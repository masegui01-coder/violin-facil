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

test('liga semanal: una suma por minuto, como mucho 120 por escritura y 5000 en la semana, con la hora del servidor', () => {
  const league = block('leagues/{board}/results/{uid}');
  assert.match(flat, /request\.resource\.data\.at == request\.time/);
  assert.match(flat, /keys\(\)\.hasOnly\(\['name', 'instrument', 'score', 'stars', 'at'\]\)/);
  assert.match(flat, /function validLeague\(\) \{[^}]*request\.resource\.data\.score <= 5000/);
  assert.match(rule(league, 'create'), /score >= 0 && request\.resource\.data\.score <= 120/);
  const upd = rule(league, 'update');
  assert.match(upd, /request\.resource\.data\.score >= resource\.data\.score/);
  assert.match(upd, /request\.resource\.data\.score <= resource\.data\.score \+ 120/);
  assert.match(upd, /request\.time > resource\.data\.get\('at', timestamp\.value\(0\)\) \+ duration\.value\(60, 's'\)/);
});

test('el cliente de la liga escribe «at» con la hora del servidor, espera al minuto y respeta los topes de las reglas', async () => {
  const api = readFileSync(new URL('../js/social-api.js', import.meta.url), 'utf8');
  assert.match(api, /score: fs\.increment\(plan\.send\), at: fs\.serverTimestamp\(\)/);
  assert.match(api, /leaguePlan\(/);
  const social = readFileSync(new URL('../js/screens/social.js', import.meta.url), 'utf8');
  const base = Number(social.match(/LEAGUE_BASE = (\d+)/)[1]);
  const perStar = Number(social.match(/LEAGUE_PER_STAR = (\d+)/)[1]);
  const L = await import('../js/league.js');
  assert.ok(base + 3 * perStar <= L.LEAGUE_MAX_WRITE);
  assert.ok(L.LEAGUE_INTERVAL_MS >= 60000);
  assert.equal(L.LEAGUE_MAX_WRITE, 120);
  assert.equal(L.LEAGUE_WEEK_MAX, 5000);
});

test('jefe de cuerda: no puede cambiarse de instrumento (vería otra sección); un músico sí', () => {
  assert.match(flat, /function keepsSection\(d, old\) \{ return old\.get\('role', 'member'\) != 'leader' \|\| d\.get\('instrument', null\) == old\.get\('instrument', null\); \}/);
  const upd = rule(block('members/{uid}'), 'update');
  assert.match(upd, /ownMemberChange\(request\.resource\.data, resource\.data\) && keepsSection\(request\.resource\.data, resource\.data\)/);
  assert.ok(flat.match(/function ownMemberKeys\(\) \{ return \[([^\]]*)\]/)[1].includes("'instrument'"), 'el músico normal sigue pudiendo');
});

// ---------- Escuela: plazas de la licencia ----------
const schoolBlock = () => block('schools/{sid}');
const schoolDocRules = () => schoolBlock().slice(0, schoolBlock().indexOf('match /members/{uid}'));
const schoolMemberRules = () => schoolBlock().slice(schoolBlock().indexOf('match /members/{uid}'));

test('escuela: la ficha de alumno solo se crea sumando 1 en la misma escritura y si cabía en la licencia', () => {
  assert.match(flat, /function seatTaken\(sid\) \{ let before = get\(schoolPath\(sid\)\)\.data; return before\.students < schoolLimit\(before\) && getAfter\(schoolPath\(sid\)\)\.data\.students == before\.students \+ 1; \}/);
  assert.match(rule(schoolMemberRules(), 'create'), /&& seatTaken\(sid\)/);
});

test('escuela: al borrar la ficha el contador baja exactamente 1 y nunca de 0 (o la escuela se borra con ella)', () => {
  assert.match(flat, /function seatFreed\(sid\) \{ return !existsAfter\(schoolPath\(sid\)\) \|\| \(get\(schoolPath\(sid\)\)\.data\.students >= 1 && getAfter\(schoolPath\(sid\)\)\.data\.students == get\(schoolPath\(sid\)\)\.data\.students - 1\); \}/);
  assert.match(rule(schoolMemberRules(), 'delete'), /\(\(signedIn\(\) && uid == request\.auth\.uid\) \|\| schoolOwner\(sid\)\) && seatFreed\(sid\)/);
});

test('escuela: el contador solo lo tocan ±1 el alumno que entra o sale y −1 el profesor al dar de baja (con su ficha)', () => {
  const upd = rule(schoolDocRules(), 'update');
  assert.match(upd, /schoolOwner\(sid\) && request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['name', 'year'\]\)/);
  assert.ok(!/hasOnly\(\['name', 'year', 'students'\]\)/.test(upd), 'el profesor ya no cambia el contador a su gusto');
  assert.match(upd, /hasOnly\(\['students', 'leftUid'\]\) && request\.resource\.data\.students == resource\.data\.students - 1 && resource\.data\.students >= 1/);
  assert.match(upd, /exists\(schoolMember\(sid, request\.resource\.data\.leftUid\)\) && !existsAfter\(schoolMember\(sid, request\.resource\.data\.leftUid\)\)/);
  assert.match(upd, /students == resource\.data\.students \+ 1 && resource\.data\.students < schoolLimit\(resource\.data\) && !exists\(schoolMember\(sid, request\.auth\.uid\)\) && existsAfter\(schoolMember\(sid, request\.auth\.uid\)\)/);
  assert.match(upd, /students == resource\.data\.students - 1 && resource\.data\.students >= 1 && exists\(schoolMember\(sid, request\.auth\.uid\)\) && !existsAfter\(schoolMember\(sid, request\.auth\.uid\)\)/);
});

test('escuela: el cliente une ficha y contador en un batch al entrar, salir, dar de baja y borrar la cuenta', () => {
  const api = readFileSync(new URL('../js/school-api.js', import.meta.url), 'utf8');
  const fn = name => { const i = api.indexOf(`export async function ${name}(`); return api.slice(i, api.indexOf('\n}\n', i)); };
  assert.match(fn('joinSchool'), /batch\.set\(fs\.doc\(db, 'schools', schoolId, 'members', user\.uid\)[\s\S]*batch\.update\(fs\.doc\(db, 'schools', schoolId\), \{ students: fs\.increment\(1\) \}\)/);
  assert.match(fn('leaveSchool'), /batch\.delete\(fs\.doc\(db, 'schools', schoolId, 'members', user\.uid\)\)[\s\S]*batch\.update\(school, \{ students: fs\.increment\(-1\) \}\)/);
  assert.match(fn('removeStudent'), /batch\.delete\(fs\.doc\(db, 'schools', schoolId, 'members', uid\)\)[\s\S]*\{ students: fs\.increment\(-1\), leftUid: uid \}/);
  const sync = readFileSync(new URL('../js/sync.js', import.meta.url), 'utf8');
  assert.match(sync, /batch\.delete\(member\);[\s\S]*batch\.update\(schoolRef, \{ students: fs\.increment\(-1\) \}\)/);
});

// ---------- Traspaso de bandas, grupos y escuelas al borrar la cuenta ----------
test('banda: solo el director actual pasa la dirección, y solo a un músico que ya esté en ella', () => {
  const upd = rule(block('bands/{bandId}'), 'update');
  assert.match(upd, /isDirector\(bandId\) && \(request\.resource\.data\.directorUid == resource\.data\.directorUid \|\| \(request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['directorUid', 'directorName'\]\)/);
  assert.match(upd, /request\.resource\.data\.directorUid != request\.auth\.uid && exists\(\/databases\/\$\(db\)\/documents\/bands\/\$\(bandId\)\/members\/\$\(request\.resource\.data\.directorUid\)\)/);
  // el nuevo director pasa a «director» en su ficha solo en la misma escritura del traspaso
  assert.match(rule(block('members/{uid}'), 'update'), /isDirector\(bandId\) && getAfter\(bandPath\(bandId\)\)\.data\.directorUid == uid && request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['role'\]\) && request\.resource\.data\.role == 'director'/);
});

test('grupo y escuela: solo el dueño actual los pasa, y solo a un miembro', () => {
  const group = rule(block('groups/{gid}'), 'update');
  assert.match(group, /groupOwner\(gid\)/);
  assert.match(group, /hasOnly\(\['ownerUid'\]\) && request\.resource\.data\.ownerUid is string && request\.resource\.data\.ownerUid != request\.auth\.uid && exists\(\/databases\/\$\(db\)\/documents\/groups\/\$\(gid\)\/members\/\$\(request\.resource\.data\.ownerUid\)\)/);
  const upd = rule(schoolDocRules(), 'update');
  assert.match(upd, /schoolOwner\(sid\) && request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['ownerUid', 'ownerName'\]\) && request\.resource\.data\.ownerUid is string && request\.resource\.data\.ownerUid != request\.auth\.uid && exists\(schoolMember\(sid, request\.resource\.data\.ownerUid\)\)/);
});

test('borrar el espacio entero: el dueño puede borrar todo lo que lista', () => {
  assert.match(block('bands/{bandId}'), /allow delete: if isDirector\(bandId\);/);
  assert.match(rule(block('tasks/{taskId}'), 'create, update, delete'), /isDirector\(bandId\)/);
  assert.match(rule(block('progress/{docId}'), 'delete'), /isDirector\(bandId\)/);
  assert.match(rule(block('bandCodes/{code}'), 'delete'), /isDirector\(resource\.data\.bandId\)/);
  assert.match(rule(block('groups/{gid}'), 'delete'), /groupOwner\(gid\)/);
  assert.match(rule(block('groupCodes/{code}'), 'delete'), /groupOwner\(resource\.data\.groupId\)/);
  assert.match(rule(block('schoolCodes/{code}'), 'delete'), /schoolOwner\(resource\.data\.schoolId\)/);
  const api = readFileSync(new URL('../js/spaces-api.js', import.meta.url), 'utf8');
  for (const piece of ["'bandCodes', space.code", "'groupCodes', space.code", "'schoolCodes', space.code", 'deleteSong(space.id, song)', "batch.delete(fs.doc(db, 'schools', space.id))"]) {
    assert.ok(api.includes(piece), piece);
  }
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
    "'results', uid", "'bands', band.bandId, 'progress'", "'bands', band.bandId, 'members', uid", "'bands', band.bandId, 'members', uid, 'private', 'stats'", "'groups', gid, 'members', uid", 'deleteTrack(gid',
    "'schools', school.schoolId, 'members', uid", "'schools', school.schoolId, 'progress', uid", "['profiles', 'users', 'testers', 'roles']"]) {
    assert.ok(sync.includes(piece), piece);
  }
});

// ---------- Ficha pública y estadísticas privadas de la banda ----------
const memberKeys = name => flat.match(new RegExp(String.raw`function ${name}\(\) \{ return \[([^\]]*)\]`))[1].split(',').map(k => k.trim().replace(/'/g, ''));
const privateStats = () => block('private/{docId}');

test('ficha de músico: solo sus campos públicos (minutos recientes y nivel); los datos antiguos solo se pueden borrar', async () => {
  const members = block('members/{uid}');
  assert.match(rule(members, 'create'), /!\('points' in request\.resource\.data\) && !\('xp' in request\.resource\.data\)/);
  assert.match(rule(members, 'update'), /ownMemberChange\(request\.resource\.data, resource\.data\)/);
  const own = memberKeys('ownMemberKeys');
  const legacy = memberKeys('legacyMemberKeys');
  for (const forbidden of ['role', 'code', 'nickname', 'joinedAt', ...legacy]) assert.ok(!own.includes(forbidden), forbidden);
  for (const k of ['streak', 'tuning', 'days', 'xp', 'points', 'lastPractice']) assert.ok(legacy.includes(k), k);
  assert.match(flat, /function ownMemberChange\(d, old\) \{ return d\.diff\(old\)\.affectedKeys\(\)\.hasOnly\(ownMemberKeys\(\)\.concat\(legacyMemberKeys\(\)\)\) && !d\.diff\(old\)\.addedKeys\(\)\.hasAny\(legacyMemberKeys\(\)\) && !d\.diff\(old\)\.changedKeys\(\)\.hasAny\(legacyMemberKeys\(\)\); \}/);
  assert.match(flat, /\(!\('minutes' in d\) \|\| \(d\.minutes is map && d\.minutes\.size\(\) <= 14\)\)/);
  assert.match(flat, /\(!\('level' in d\) \|\| shortText\(d\.level, 40\)\)/);
  // Lo que sube el cliente a la ficha cabe en la lista y coincide con la ventana de minutos de las reglas
  const S = await import('../js/band-stats.js');
  const summary = S.activitySummary({}, '2026-11-03', 0);
  const sent = [...Object.keys(S.sharedActivity(summary, '2026-11-03')), 'instrument', 'syncedAt', 'voice'];
  for (const k of sent) assert.ok(own.includes(k), `el cliente sube «${k}» a la ficha`);
  assert.equal(S.SHARED_DAYS, 14);
  assert.deepEqual([...S.LEGACY_SHARED_KEYS].sort(), [...legacy].sort());
  for (const k of Object.keys(S.privateActivity(summary))) assert.ok(!own.includes(k), `«${k}» no va en la ficha pública`);
});

test('estadísticas privadas: solo las leen el músico y el director, y solo las escribe el músico', () => {
  const p = privateStats();
  assert.match(rule(p, 'read'), /allow read: if \(signedIn\(\) && uid == request\.auth\.uid\) \|\| isDirector\(bandId\);/);
  assert.ok(!rule(p, 'read').includes('isMember'), 'el resto de la banda no las lee');
  for (const verb of ['create', 'update']) {
    assert.match(rule(p, verb), /signedIn\(\) && uid == request\.auth\.uid && docId == 'stats' && isMember\(bandId\) && validStats\(request\.resource\.data\)/, verb);
  }
  assert.match(rule(p, 'delete'), /\(signedIn\(\) && uid == request\.auth\.uid\) \|\| isDirector\(bandId\)/);
  assert.match(flat, /function validStats\(d\) \{ return d\.keys\(\)\.hasOnly\(\['days', 'points', 'streak', 'tuning', 'lastPractice', 'at'\]\) && d\.at == request\.time && d\.points is number && d\.points >= 0/);
  assert.match(flat, /d\.days is map && d\.days\.size\(\) <= 92/);
});

test('puntos de la banda: como en la liga, 120 por escritura como mucho y una escritura por minuto (con la hora del servidor)', async () => {
  const p = privateStats();
  assert.match(flat, /function validStatsPoints\(d, before\) \{ return d\.points == 0 \|\| \(d\.points >= before && d\.points <= before \+ 120\); \}/);
  assert.match(rule(p, 'update'), /validStatsPoints\(request\.resource\.data, resource\.data\.get\('points', 0\)\)/);
  assert.match(rule(p, 'update'), /request\.time > resource\.data\.get\('at', timestamp\.value\(0\)\) \+ duration\.value\(60, 's'\)/);
  // La primera vez parten de los puntos de la ficha antigua (nunca de lo que diga el cliente)
  assert.match(rule(p, 'create'), /validStatsPoints\(request\.resource\.data, get\(\/databases\/\$\(db\)\/documents\/bands\/\$\(bandId\)\/members\/\$\(uid\)\)\.data\.get\('points', 0\)\)/);
  assert.ok(!/\+ 2000/.test(flat), 'ya no se aceptan 2000 puntos de golpe');
  // El cliente respeta los mismos topes
  const S = await import('../js/band-stats.js');
  assert.equal(S.BAND_POINTS_MAX_WRITE, 120);
  assert.ok(S.BAND_STATS_INTERVAL_MS >= 60000);
  const api = readFileSync(new URL('../js/band-api.js', import.meta.url), 'utf8');
  assert.match(api, /points: cappedPoints\(summary\.points, before\), at: fs\.serverTimestamp\(\)/);
  assert.match(api, /if \(prev && !statsDue\(prev, now\)\)/);
});

test('códigos de banda con el formato de siempre; el instrumento del progreso es un texto corto', () => {
  assert.match(rule(block('bandCodes/{code}'), 'create'), /allow create: if validCode\(code\) && isDirectorAfter\(request\.resource\.data\.bandId\);/);
  const prog = rule(block('progress/{docId}'), 'create, update');
  assert.match(prog, /\(!\('instrument' in request\.resource\.data\) \|\| request\.resource\.data\.instrument == null \|\| shortText\(request\.resource\.data\.instrument, 24\)\)/);
});

test('al quitar o borrar una ficha de la banda también se borran sus estadísticas privadas', () => {
  const api = readFileSync(new URL('../js/band-api.js', import.meta.url), 'utf8');
  const fn = name => { const i = api.indexOf(`export async function ${name}(`); return api.slice(i, api.indexOf('\n}\n', i)); };
  for (const name of ['leaveBand', 'removeMember']) assert.match(fn(name), /batch\.delete\(statsRef\(/, name);
  const spaces = readFileSync(new URL('../js/spaces-api.js', import.meta.url), 'utf8');
  assert.match(spaces, /'members', m\.id, 'private', 'stats'/);
});

// ---------- Canciones de grupo, solicitudes y avisos ----------
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
