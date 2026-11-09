// Reglas del Aula Pro (comprobación estática, como tests/rules.test.js: sin Java no hay emulador). Además, el
// documento que escribe cada función del cliente debe tener exactamente las claves que aceptan las reglas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeTask } from '../js/aula.js';
import { buildSummary } from '../js/aula-summary.js';
import { encodeSummary, decodeSummary, WIRE } from '../js/aula-wire.js';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const api = readFileSync(new URL('../js/aula-api.js', import.meta.url), 'utf8');
const flat = rules.replace(/\s+/g, ' ');

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
const keysOf = fn => flat.match(new RegExp(String.raw`function ${fn}\([a-z]\) \{ return (?:[a-z] is map && )?[a-z]\.keys\(\)\.hasOnly\(\[([^\]]*)\]`))[1].split(',').map(k => k.trim().replace(/'/g, ''));
const classBlock = () => block('classes/{cid}');
const classDoc = () => classBlock().slice(0, classBlock().indexOf('match /students/{uid}'));

test('clases: solo el dueño de la escuela, con la licencia activa, crea clases y solo él las lista', () => {
  assert.match(flat, /function aulaActive\(sid\) \{ let p = get\(schoolPath\(sid\)\)\.data\.get\('premium', \{\}\); return p\.get\('active', false\) == true && \(p\.get\('until', null\) == null \|\| licenseLive\(p\.until\)\); \}/);
  assert.match(flat, /request\.time < timestamp\.date\(int\(d\[0\]\), int\(d\[1\]\), int\(d\[2\]\)\) \+ duration\.value\(1, 'd'\)/, 'la licencia caduca también en las reglas');
  assert.match(rule(classDoc(), 'create'), /schoolOwner\(sid\) && aulaActive\(sid\) && validClass\(request\.resource\.data\)/);
  assert.match(rule(classDoc(), 'create'), /createdAt == request\.time/);
  assert.match(rule(classDoc(), 'list'), /if schoolOwner\(sid\);/);
  assert.match(rule(classDoc(), 'get'), /schoolOwner\(sid\) \|\| inClass\(sid, cid\)/);
  assert.match(rule(classDoc(), 'delete'), /if schoolOwner\(sid\);/);
});

test('alumnos: entran con el código de ESA clase ocupando una plaza en la misma escritura; nadie ve a sus compañeros', () => {
  const students = block('students/{uid}');
  assert.match(rule(students, 'create'), /isOwn\(uid\) && aulaActive\(sid\)/);
  assert.match(rule(students, 'create'), /classCodes\/\$\(request\.resource\.data\.code\)\)\.data\.classId == cid/);
  assert.match(rule(students, 'create'), /classSeatTaken\(sid, cid\)/);
  assert.match(rule(students, 'list'), /if schoolOwner\(sid\);/);
  assert.match(rule(students, 'get'), /schoolOwner\(sid\) \|\| isOwn\(uid\)/);
  assert.match(rule(students, 'delete'), /\(isOwn\(uid\) \|\| schoolOwner\(sid\)\) && classSeatFreed\(sid, cid\)/);
  assert.match(flat, /before\.students < aulaClassLimit\(\) && getAfter\(classPath\(sid, cid\)\)\.data\.students == before\.students \+ 1/);
  assert.match(flat, /function aulaClassLimit\(\) \{ return 60; \}/);
});

test('el contador de la clase solo cambia ±1 junto a la ficha (o −1 del profesor indicando quién sale)', () => {
  const upd = rule(classDoc(), 'update');
  assert.match(upd, /hasOnly\(\['name', 'archived', 'code', 'closed'\]\)/);
  assert.match(upd, /hasOnly\(\['leftUid'\]\) && !\('leftUid' in request\.resource\.data\)/, 'el profesor solo puede QUITAR leftUid');
  assert.match(upd, /hasOnly\(\['students', 'leftUid'\]\) && request\.resource\.data\.students == resource\.data\.students - 1/);
  assert.match(upd, /!exists\(classStudent\(sid, cid, request\.auth\.uid\)\) && existsAfter\(classStudent\(sid, cid, request\.auth\.uid\)\)/);
  assert.ok(!/hasOnly\(\['name', 'archived', 'students'/.test(upd), 'el profesor no cambia el contador a su gusto');
});

test('resúmenes y comentarios: el alumno solo escribe el suyo estando en la clase; el profesor solo lee su clase', () => {
  const sums = block('summaries/{uid}');
  assert.match(rule(sums, 'create, update'), /isOwn\(uid\) && inClass\(sid, cid\) && validAulaSummary\(request\.resource\.data\)/);
  assert.match(rule(sums, 'list'), /if schoolOwner\(sid\);/);
  const fb = block('feedback/{fid}');
  assert.match(rule(fb, 'read'), /schoolOwner\(sid\) \|\| \(signedIn\(\) && resource\.data\.uid == request\.auth\.uid\)/);
  assert.match(rule(fb, 'create, update'), /schoolOwner\(sid\) && aulaActive\(sid\) && validFeedback\(request\.resource\.data\) && fid == request\.resource\.data\.taskId \+ '_' \+ request\.resource\.data\.uid/);
  const tasks = block('tasks/{tid}');
  assert.match(rule(tasks, 'create, update'), /schoolOwner\(sid\) && aulaActive\(sid\) && validAulaTask\(request\.resource\.data\)/, 'con la licencia caducada, solo lectura');
  assert.match(rule(fb, 'delete'), /resource\.data\.uid == request\.auth\.uid && !existsAfter\(classStudent\(sid, cid, request\.auth\.uid\)\)/, 'el alumno no borra comentarios mientras sigue en la clase');
  assert.match(rule(tasks, 'read'), /schoolOwner\(sid\) \|\| inClass\(sid, cid\)/);
});

test('validación estricta: claves, tipos y tamaños de tareas, resúmenes y comentarios', () => {
  assert.match(flat, /d\.minPct is int && d\.minPct >= 0 && d\.minPct <= 100/);
  assert.match(flat, /d\.maxAttempts is int && d\.maxAttempts >= 0 && d\.maxAttempts <= 20/);
  assert.match(flat, /d\.due == null \|\| \(d\.due is string && d\.due\.matches\('\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$'\)\)/);
  assert.match(flat, /d\.to is list && d\.to\.size\(\) <= 60/);
  assert.match(flat, /\(!\('song' in d\) \|\| \(d\.kind == 'xml' && validSongPayload\(d\.song\)\)\)/);
  for (const piece of ['d.streak is int', "shortText(d.comment, 500)", 'd.at is int && d.at > 0 && d.at <= request.time.toMillis() + 600000']) {
    assert.ok(flat.includes(piece), piece);
  }
  assert.match(flat, /optPct\(s, 'ritmo'\) && optPct\(s, 'entonacion'\) && optPct\(s, 'lectura'\) && optPct\(s, 'teoria'\) && optPct\(s, 'dictado'\) && optPct\(s, 'audicion'\)/);
});

test('lo que escribe el cliente cabe exactamente en las claves de las reglas', () => {
  const taskKeys = keysOf('validAulaTask');
  for (const kind of ['lesson', 'xml', 'lm-ex']) {
    const { task } = normalizeTask({ title: 'T', kind, ref: { id: 'x', ids: ['a'], label: 'L' }, song: { title: 's', enc: {} }, to: [] });
    assert.ok(Object.keys(task).every(k => taskKeys.includes(k)), `${kind}: ${Object.keys(task)}`);
    assert.ok(Object.keys(task.ref).every(k => keysOf('validAulaRef').includes(k)), Object.keys(task.ref).join());
  }
  const summary = buildSummary({ cls: { sid: 's', cid: 'c', nickname: 'Ana' }, aula: {}, practiceLog: {}, streak: 0, exercises: [], termId: '2026-2027-1' });
  const wire = encodeSummary({ ...summary, prevTerm: '2025-2026-3', prevSkills: { ritmo: 50 } });
  assert.deepEqual(Object.keys(wire).sort(), keysOf('validAulaSummary').sort());
  assert.match(api, /\{ name, code, teacherName, students: 0, createdAt: fs\.serverTimestamp\(\) \}/);
  assert.match(api, /\{ schoolId: sid, classId: ref\.id, className: name, teacherName \}/);
  assert.match(api, /\{ nickname, instrument, code: clean, joinedAt: fs\.serverTimestamp\(\) \}/);
  assert.match(api, /\{ uid, taskId, comment, at: Date\.now\(\) \}/);
  assert.match(api, /batch\.update\(classRef\(fs, db, sid, cid\), \{ students: fs\.increment\(-1\), leftUid: uid \}\)/);
});

test('códigos de clase: solo los crea el dueño de la escuela junto a su clase; nadie los lista', () => {
  const codes = block('classCodes/{code}');
  assert.match(rule(codes, 'list, update'), /if false;/);
  assert.match(rule(codes, 'create'), /get\(schoolPath\(request\.resource\.data\.schoolId\)\)\.data\.ownerUid == request\.auth\.uid/);
  assert.match(rule(codes, 'create'), /getAfter\(classPath\(request\.resource\.data\.schoolId, request\.resource\.data\.classId\)\)\.data\.code == code/);
  assert.match(rule(codes, 'delete'), /schoolOwner\(resource\.data\.schoolId\)/);
});

test('petición de licencia: el profesor solo marca la hora del servidor, nunca toca «premium»', () => {
  assert.match(flat, /schoolOwner\(sid\) && request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['proRequestedAt'\]\) && request\.resource\.data\.proRequestedAt == request\.time/);
  assert.match(flat, /isAdmin\(\) && request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['premium'\]\)/);
});

test('borrar la cuenta o la escuela también limpia el Aula', () => {
  const sync = readFileSync(new URL('../js/sync.js', import.meta.url), 'utf8');
  for (const piece of ["'classes', c.cid, 'students', uid", "'classes', c.cid, 'summaries', uid", "fs.where('uid', '==', uid)"]) assert.ok(sync.includes(piece), piece);
  const spaces = readFileSync(new URL('../js/spaces-api.js', import.meta.url), 'utf8');
  assert.ok(spaces.includes("'classCodes', cls.code"), 'al borrar la escuela se borran sus clases y sus códigos');
});

test('composiciones del curso: el alumno de la clase envía la suya («<uid>_<ejercicio>»), solo la ven él y el profesor', async () => {
  const works = block('works/{wid}');
  assert.match(rule(works, 'create, update'), /request\.resource\.data\.uid == request\.auth\.uid && inClass\(sid, cid\)/);
  assert.match(rule(works, 'create, update'), /validAulaWork\(request\.resource\.data\) && wid == request\.resource\.data\.uid \+ '_' \+ request\.resource\.data\.exId/);
  assert.match(rule(works, 'list'), /schoolOwner\(sid\) \|\| \(signedIn\(\) && resource\.data\.uid == request\.auth\.uid\)/);
  assert.match(rule(works, 'get'), /schoolOwner\(sid\) \|\| \(signedIn\(\) && resource\.data\.uid == request\.auth\.uid\)/);
  const { WORK_KEYS, workDoc } = await import('../js/aula-api.js');
  assert.deepEqual(keysOf('validAulaWork'), WORK_KEYS);
  const doc = workDoc('u1', { nickname: 'Ana', exId: 'lm1-u3-creatividad-a-facil', title: 'Contesta a la llamada', score: 'G4q E4q C4h', meter: '4/4', pct: 80 });
  assert.deepEqual(Object.keys(doc), WORK_KEYS);
  assert.match(doc.exId, /^lm[0-9]+-u[0-9]+-creatividad-[a-c]-(facil|medio)$/);
  assert.match(doc.score, /^[A-GR#b0-9whqes.: ]+$/);
  assert.match(api, /'works', `\$\{user\.uid\}_\$\{work\.exId\}`/);
});

// ---------- Casos: el resumen del alumno se valida ENTERO en las reglas (mismas expresiones que js/aula-wire.js) ----------
const ruleRegex = field => {
  const m = flat.match(new RegExp(String.raw`d\.${field}\.matches\('([^']+)'\)`));
  assert.ok(m, `falta la validación de ${field}`);
  return m[1];
};
const accepts = (field, text) => new RegExp(`^(?:${ruleRegex(field)})$`).test(text); // matches() de las reglas es de cadena entera

test('las expresiones de las reglas son las del cliente (una sola fuente)', () => {
  for (const f of ['days', 'tasks', 'units', 'mistakes', 'recent', 'term']) assert.equal(ruleRegex(f), WIRE[f], f);
});

test('casos válidos: lo que publica la app del alumno pasa todas las validaciones', () => {
  const sum = {
    nickname: 'Ana', instrument: 'violin', at: Date.now(), term: '2026-2027-1', streak: 4,
    days: { '2026-11-01': 12, '2026-11-02': 1440 }, skills: { ritmo: 70 }, mistakes: { '3M-3m': 3, 'q>Rq': 1, 'afin+': 2 },
    units: { l1u1: 100, l1u12: 0 }, tasks: { 'abcDEF123_-x': { p: 100, n: 3, d: true, l: Date.now(), o: false }, t2: { p: 0, n: 0, d: false, l: 0, o: true } },
    recent: [{ id: 'lm1-u1-ritmo-a-facil', p: 95, at: Date.now() }, { id: 'u1-intro', p: 67, at: Date.now() }],
  };
  const w = encodeSummary(sum);
  for (const f of ['days', 'tasks', 'units', 'mistakes', 'recent']) assert.ok(accepts(f, w[f]), `${f}: ${w[f]}`);
  assert.ok(accepts('term', w.term));
  const back = decodeSummary(w);
  assert.deepEqual(back.tasks.t2, { p: 0, n: 0, d: false, l: 0, o: true });
  assert.equal(back.tasks['abcDEF123_-x'].p, 100);
  assert.deepEqual(back.units, { l1u1: 100, l1u12: 0 });
  assert.equal(back.mistakes['q>Rq'], 1);
  assert.equal(back.recent.length, 2);
});

test('casos inválidos: las reglas rechazan HTML, % fuera de 0-100, booleanos falsos y fechas mal formadas', () => {
  const bad = {
    units: ['l1u1=<a href=x>;', 'l1u1=101;', 'l1u1=-5;', 'x=10;', 'l1u1=50'],
    tasks: ['T1=<img src=x>,1,0,0,0;', 'T1=101,1,0,0,0;', 'T1=90,1,2,0,0;', 'T1=90,1,1,0,0;T2=;', 'T<1>=90,1,1,0,0;', 'T1=90,1,1,0;'],
    days: ['2026-11-05=<b>;', '26-11-05=10;', '2026-11-05=12345;', '2026-11-05=10'],
    mistakes: ['<script>=1;', 'a=b;'], // cuántos: lo acota el tamaño (shortText), no la expresión (RE2)
    recent: ['x=50@<img>;', 'x=200@1;', '<b>=5@1;'],
  };
  for (const [field, list] of Object.entries(bad)) list.forEach(text => assert.equal(accepts(field, text), false, `${field}: ${text}`));
  assert.equal(accepts('term', '2026-2027-4'), false);
  assert.equal(accepts('term', '<b>'), false);
});

test('al leer, lo que no cumple el formato no llega a la pantalla como texto (también los resúmenes antiguos en mapas)', () => {
  const evil = '<a id="pwn" href="https://evil.example">x</a>';
  const doc = decodeSummary({ nickname: 'Eva', units: { l1u1: evil, [evil]: 5 }, tasks: { T1: { p: '<img id="pwn2" src=x>', n: '9<b>', d: 'yes', l: evil, o: 1 } },
    days: { '2026-11-01': evil }, mistakes: { [evil]: 3 }, recent: [{ id: evil, p: 5, at: 1 }, { id: 'ok', p: evil, at: 2 }], skills: { ritmo: evil }, streak: evil, at: evil });
  const { nickname, ...rest } = doc;
  const text = JSON.stringify(rest);
  assert.ok(!text.includes('<'), text);
  assert.equal(doc.units.l1u1, 0);
  assert.deepEqual(doc.tasks.T1, { p: 0, n: 0, d: false, l: 0, o: false });
  assert.deepEqual(doc.recent, [{ id: 'ok', p: 0, at: 2 }]);
  // texto con formato roto: se ignora lo que no encaja
  assert.deepEqual(decodeSummary({ tasks: 'T1=90,1,1,5,0;<b>=1;' }).tasks, { T1: { p: 90, n: 1, d: true, l: 5, o: false } });
});

test('borrar clase, dar de baja, salir y borrar la cuenta se llevan también composiciones y comentarios', () => {
  assert.match(api, /export const CLASS_SUBS = \['students', 'tasks', 'summaries', 'feedback', 'works'\];/);
  assert.match(api, /CLASS_SUBS\.map\(n => fs\.getDocs\(sub\(fs, db, sid, cls\.id, n\)\)\)/);
  const removeFn = api.slice(api.indexOf('export async function removeStudent'), api.indexOf('export async function changeCode'));
  assert.match(removeFn, /\['works', 'feedback'\]\.map\(n => fs\.getDocs\(fs\.query\(sub\(fs, db, sid, cid, n\), fs\.where\('uid', '==', uid\)\)\)\)/);
  assert.match(removeFn, /leftUid: fs\.deleteField\(\)/, 'la clase no se queda con el uid de quien salió');
  const leaveFn = api.slice(api.indexOf('export async function leaveClass'), api.indexOf('export async function loadMyClass'));
  assert.match(leaveFn, /\['works', 'feedback'\]/);
  const sync = readFileSync(new URL('../js/sync.js', import.meta.url), 'utf8');
  assert.match(sync, /\['feedback', 'works'\]\.map/);
  const spaces = readFileSync(new URL('../js/spaces-api.js', import.meta.url), 'utf8');
  assert.match(spaces, /\['students', 'tasks', 'summaries', 'feedback', 'works'\]/);
});

test('código de clase: cambiarlo o cerrar inscripciones invalida el anterior', () => {
  const change = api.slice(api.indexOf('export async function changeCode'), api.indexOf('export async function closeJoining'));
  assert.match(change, /batch\.update\(classRef\(fs, db, sid, cls\.id\), \{ code, closed: false \}\)/);
  assert.match(change, /batch\.delete\(fs\.doc\(db, 'classCodes', cls\.code\)\)/);
  assert.match(api, /batch\.update\(classRef\(fs, db, sid, cls\.id\), \{ closed: true \}\);\s*if \(cls\.code && !cls\.closed\) batch\.delete\(fs\.doc\(db, 'classCodes', cls\.code\)\)/);
  assert.match(rule(block('students/{uid}'), 'create'), /classCodes\/\$\(request\.resource\.data\.code\)\)\.data\.classId == cid/, 'sin documento de código no se entra');
});

test('evaluación 2: inscripciones cerradas, código actual y borrado de clases cerradas sin fallar el lote', () => {
  const join = rule(block('students/{uid}'), 'create');
  assert.match(join, /get\(classPath\(sid, cid\)\)\.data\.get\('closed', false\) == false/);
  assert.match(join, /get\(classPath\(sid, cid\)\)\.data\.code == request\.resource\.data\.code/);
  assert.match(rule(block('classCodes/{code}'), 'delete'), /resource == null \|\| schoolOwner\(resource\.data\.schoolId\)/);
  const del = api.slice(api.indexOf('export async function deleteClass'), api.indexOf('export async function createTask'));
  assert.match(del, /if \(cls\.code && !cls\.closed\) batch\.delete\(fs\.doc\(db, 'classCodes', cls\.code\)\)/);
  const spaces = readFileSync(new URL('../js/spaces-api.js', import.meta.url), 'utf8');
  assert.match(spaces, /if \(cls\.code && !cls\.closed\) batch\.delete/);
  assert.match(flat, /request\.time < timestamp\.date\(int\(d\[0\]\), int\(d\[1\]\), int\(d\[2\]\)\) \+ duration\.value\(1, 'd'\)/);
});
