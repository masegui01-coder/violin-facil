// Comprobaciones estáticas de firestore.rules (sin Java no hay emulador): que no se pierdan las condiciones clave.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const flat = rules.replace(/\s+/g, ' ');

// Texto del bloque «match /<path> {…}» (hasta su llave de cierre)
function block(path) {
  const start = rules.indexOf(`match /${path} {`);
  assert.ok(start >= 0, `falta match /${path}`);
  let depth = 0;
  for (let i = start + `match /${path} `.length; i < rules.length; i++) {
    if (rules[i] === '{') depth++;
    if (rules[i] === '}' && --depth === 0) return rules.slice(start, i + 1).replace(/\s+/g, ' ');
  }
  throw new Error(`bloque sin cerrar: ${path}`);
}
const rule = (text, verb) => (text.match(new RegExp(`allow ${verb}[^;]*;`)) || [''])[0];

test('administrador: admins/{uid} o el correo verificado del dueño (solo en las reglas)', () => {
  assert.match(flat, /function isAdmin\(\) \{ return signedIn\(\) && \(exists\(\/databases\/\$\(db\)\/documents\/admins\/\$\(request\.auth\.uid\)\)/);
  assert.match(flat, /request\.auth\.token\.email == 'masegui01@gmail\.com' && request\.auth\.token\.email_verified == true/);
  assert.match(block('adminData/{doc}'), /allow read, write: if isAdmin\(\);/);
  assert.match(block('admins/{uid}'), /allow list, write: if false;/);
});

test('roles: solo el administrador los lista o los da', () => {
  assert.match(block('roles/{uid}'), /allow list, write: if isAdmin\(\);/);
});

test('canciones de grupo: solo su autor o el dueño del grupo las borran o cambian título y tempo', () => {
  const songs = block('songs/{sid}');
  assert.match(songs, /function songAuthorOrOwner\(\) \{ return resource\.data\.createdBy == request\.auth\.uid \|\| groupOwner\(gid\); \}/);
  assert.match(rule(songs, 'delete'), /inGroup\(gid\) && songAuthorOrOwner\(\)/);
  const upd = rule(songs, 'update');
  assert.match(upd, /request\.resource\.data\.createdBy == resource\.data\.createdBy/);
  assert.match(upd, /affectedKeys\(\)\.hasOnly\(\['parts', 'sections', 'updatedAt'\]\)/);
  assert.match(upd, /parts\.diff\(resource\.data\.parts\)\.affectedKeys\(\)\.hasOnly\(\[request\.auth\.uid, 'demo'\]\)/);
});

test('pistas y trozos de audio: solo su autor (o el dueño del grupo, para borrar)', () => {
  const tracks = block('tracks/{tid}');
  const chunks = block('chunks/{n}');
  for (const b of [tracks, chunks]) {
    assert.match(rule(b, 'delete'), /trackAuthor\(tid\) \|\| groupOwner\(gid\)/);
    assert.match(rule(b, 'create, update'), /ownTrack\(tid\) && trackAuthor\(tid\)/);
    assert.ok(!/allow read, delete: if inGroup\(gid\);/.test(b), 'cualquier músico podía borrar');
  }
  assert.match(rule(tracks, 'create, update'), /request\.resource\.data\.by == request\.auth\.uid/);
  assert.match(flat, /tid == 'demo' && \(!exists\(trackPath\(tid\)\) \|\| get\(trackPath\(tid\)\)\.data\.get\('by', null\) == request\.auth\.uid/);
});

test('ficha de músico: se valida también al unirse a la banda', () => {
  const members = block('members/{uid}'); // el primero es el de las bandas
  assert.match(members, /isMember\(bandId\)/);
  assert.match(rule(members, 'create'), /uid == request\.auth\.uid && validMember\(request\.resource\.data\)/);
  assert.match(rule(members, 'update'), /validMember\(request\.resource\.data\)/);
});

test('liga semanal: como mucho 40 puntos por escritura y una cada 10 s con la hora del servidor', () => {
  const league = block('leagues/{board}/results/{uid}');
  assert.match(flat, /request\.resource\.data\.at == request\.time/);
  assert.match(flat, /keys\(\)\.hasOnly\(\['name', 'instrument', 'score', 'stars', 'at'\]\)/);
  assert.match(rule(league, 'create'), /score >= 0 && request\.resource\.data\.score <= 40/);
  const upd = rule(league, 'update');
  assert.match(upd, /request\.resource\.data\.score >= resource\.data\.score/);
  assert.match(upd, /request\.resource\.data\.score <= resource\.data\.score \+ 40/);
  assert.match(upd, /request\.time > resource\.data\.get\('at', timestamp\.value\(0\)\) \+ duration\.value\(10, 's'\)/);
});

test('el cliente de la liga escribe «at» con la hora del servidor y suma menos de 40 por lección', () => {
  const api = readFileSync(new URL('../js/social-api.js', import.meta.url), 'utf8');
  assert.match(api, /score: fs\.increment\(points\), at: fs\.serverTimestamp\(\)/);
  const social = readFileSync(new URL('../js/screens/social.js', import.meta.url), 'utf8');
  const base = Number(social.match(/LEAGUE_BASE = (\d+)/)[1]);
  const perStar = Number(social.match(/LEAGUE_PER_STAR = (\d+)/)[1]);
  assert.ok(base + 3 * perStar <= 40);
});
