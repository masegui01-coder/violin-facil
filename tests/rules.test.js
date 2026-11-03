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

test('administrador: admins/{uid} o el uid de la cuenta del dueño (sin correos en las reglas)', () => {
  assert.match(flat, /function isAdmin\(\) \{ return signedIn\(\) && \(exists\(\/databases\/\$\(db\)\/documents\/admins\/\$\(request\.auth\.uid\)\)/);
  assert.match(flat, /\|\| request\.auth\.uid == 'OxA5RXkTzXQ2ggKkzDOlQoEmVGM2'\); \}/);
  assert.ok(!/request\.auth\.token\.email/.test(rules), 'el administrador ya no se reconoce por correo');
  assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}/i.test(rules), 'no debe quedar ningún correo en las reglas');
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

// ---------- Borrar la cuenta: cada documento del usuario se puede borrar con su sesión ----------
// Sentencias «allow …;» con sus verbos (sin comentarios)
const statements = rules.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').match(/allow [a-z, ]+:[^;]*;/g);

test('ninguna regla que permite borrar valida request.resource (en un borrado no existe y lo deniega)', () => {
  const deleting = statements.filter(s => /^allow [a-z, ]*\b(write|delete)\b/.test(s));
  assert.ok(deleting.length > 20);
  for (const s of deleting) assert.ok(!s.includes('request.resource'), s);
});

test('el propio usuario puede borrar cada documento suyo', () => {
  assert.match(block('users/{uid}'), /allow read, write: if isOwn\(uid\);/);
  for (const path of ['roles/{uid}', 'testers/{uid}', 'profiles/{uid}', 'boards/{board}/results/{uid}', 'daily/{board}/results/{uid}', 'leagues/{board}/results/{uid}']) {
    assert.match(block(path), /allow delete: if isOwn\(uid\);/, path);
  }
  assert.match(block('results/{uid}'), /allow delete: if isOwn\(uid\);/); // resultados de los retos
  assert.match(rule(block('friendCodes/{code}'), 'update, delete'), /resource\.data\.uid == request\.auth\.uid/);
  assert.match(rule(block('requests/{to}/in/{from}'), 'delete'), /to == request\.auth\.uid \|\| from == request\.auth\.uid/);
  assert.match(rule(block('friends/{owner}/list/{fid}'), 'delete'), /owner == request\.auth\.uid \|\| fid == request\.auth\.uid/);
  assert.match(block('activity/{owner}/events/{id}'), /allow create, delete: if signedIn\(\) && owner == request\.auth\.uid;/);
  assert.match(block('inbox/{owner}/items/{id}'), /allow read, delete: if signedIn\(\) && owner == request\.auth\.uid;/);
  assert.match(rule(block('progress/{docId}'), 'delete'), /resource\.data\.uid == request\.auth\.uid/); // progreso en la banda
  assert.match(rule(block('members/{uid}'), 'delete'), /signedIn\(\) && uid == request\.auth\.uid/);
});

test('retos y partituras compartidas: su autor los puede listar (para borrarlos), nadie más', () => {
  for (const path of ['sharedScores/{code}', 'challenges/{code}']) {
    assert.match(rule(block(path), 'list'), /signedIn\(\) && resource\.data\.ownerUid == request\.auth\.uid/, path);
  }
  const sync = readFileSync(new URL('../js/sync.js', import.meta.url), 'utf8');
  assert.match(sync, /fs\.where\('ownerUid', '==', uid\)/);
});

test('el borrado de la cuenta recorre todo lo del usuario', () => {
  const sync = readFileSync(new URL('../js/sync.js', import.meta.url), 'utf8');
  for (const piece of ["'friends', uid, 'list'", "'activity', uid, 'events'", "'inbox', uid, 'items'", "'requests', uid, 'in'", "'friendCodes'",
    "'results', uid", "'bands', band.bandId, 'progress'", "'bands', band.bandId, 'members', uid", "'groups', gid, 'members', uid", 'deleteTrack(gid',
    "'schools', school.schoolId, 'members', uid", "'schools', school.schoolId, 'progress', uid", "['profiles', 'users', 'testers', 'roles']"]) {
    assert.ok(sync.includes(piece), piece);
  }
});

// ---------- Fichas de banda, canciones de grupo, solicitudes y avisos ----------
test('ficha de músico: cada uno solo cambia sus campos de actividad y los puntos no se inventan', async () => {
  const members = block('members/{uid}');
  assert.match(rule(members, 'create'), /!\('points' in request\.resource\.data\) && !\('xp' in request\.resource\.data\)/);
  const upd = rule(members, 'update');
  assert.match(upd, /affectedKeys\(\)\.hasOnly\(ownMemberKeys\(\)\)/);
  assert.match(upd, /validMemberPoints\(request\.resource\.data, resource\.data\)/);
  assert.match(flat, /d\.get\('points', 0\) <= d\.get\('xp', 0\)/);
  assert.match(flat, /d\.get\('points', 0\) >= old\.get\('points', 0\) && d\.get\('points', 0\) <= old\.get\('points', 0\) \+ 2000/);
  // Lo que sube el cliente cabe en la lista (y no incluye papel, código ni apodo)
  const keys = flat.match(/function ownMemberKeys\(\) \{ return \[([^\]]*)\]/)[1].split(',').map(k => k.trim().replace(/'/g, ''));
  for (const forbidden of ['role', 'code', 'nickname', 'joinedAt']) assert.ok(!keys.includes(forbidden), forbidden);
  const { activitySummary } = await import('../js/band-stats.js');
  const sent = [...Object.keys(activitySummary({}, '2026-11-03', 0)), 'instrument', 'syncedAt', 'voice'];
  for (const k of sent) assert.ok(keys.includes(k), `el cliente sube «${k}»`);
});

test('partes de una canción de grupo: los músicos añaden de una en una y solo autor o dueño quitan', () => {
  const upd = rule(block('songs/{sid}'), 'update');
  assert.match(upd, /request\.resource\.data\.sections\.size\(\) >= resource\.data\.sections\.size\(\)/);
  assert.match(upd, /request\.resource\.data\.sections\.size\(\) <= resource\.data\.sections\.size\(\) \+ 1/);
  const ui = readFileSync(new URL('../js/screens/group-song.js', import.meta.url), 'utf8');
  assert.match(ui, /const canRemove = \[song\.createdBy, ctx\.group\.ownerUid\]\.includes\(myId\(\)\)/);
  assert.match(ui, /\$\{canRemove \? '<button[^']*id="gsDelSection"/);
});

test('solicitudes y avisos: solo los campos que escribe el cliente y textos cortos', () => {
  const req = rule(block('requests/{to}/in/{from}'), 'create');
  assert.match(req, /keys\(\)\.hasOnly\(\['fromName', 'fromInstrument', 'at'\]\)/);
  assert.match(req, /shortText\(request\.resource\.data\.fromName, 60\)/);
  assert.match(req, /shortText\(request\.resource\.data\.fromInstrument, 24\)/);
  const inbox = rule(block('inbox/{owner}/items/{id}'), 'create');
  assert.match(inbox, /keys\(\)\.hasOnly\(\['kind', 'emoji', 'fromName', 'text', 'at'\]\)/);
  assert.match(inbox, /shortText\(request\.resource\.data\.text, 300\)/); // el texto de la publicación lleva el título de la canción
  assert.match(inbox, /shortText\(request\.resource\.data\.emoji, 8\)/);
  // Los campos que escribe friends-api.js
  const api = readFileSync(new URL('../js/friends-api.js', import.meta.url), 'utf8');
  assert.match(api, /'requests', to, 'in', uid\), \{ fromName: me\.name, fromInstrument: me\.instrument \|\| '', at: Date\.now\(\) \}/);
  for (const m of api.matchAll(/fs\.collection\(db, 'inbox', [^)]*\), \{ ([^}]*) \}/g)) {
    const fields = m[1].split(',').map(f => f.trim().split(':')[0].trim());
    for (const f of fields) assert.ok(['kind', 'emoji', 'fromName', 'text', 'at'].includes(f), f);
  }
});
