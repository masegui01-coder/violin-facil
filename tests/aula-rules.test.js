// Reglas del Aula Pro (comprobación estática, como tests/rules.test.js: sin Java no hay emulador). Además, el
// documento que escribe cada función del cliente debe tener exactamente las claves que aceptan las reglas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeTask } from '../js/aula.js';
import { buildSummary } from '../js/aula-summary.js';

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
  assert.match(flat, /function aulaActive\(sid\) \{ return get\(schoolPath\(sid\)\)\.data\.get\('premium', \{\}\)\.get\('active', false\) == true; \}/);
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
  assert.match(upd, /hasOnly\(\['name', 'archived'\]\)/);
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
  assert.match(rule(fb, 'create, update'), /schoolOwner\(sid\) && validFeedback\(request\.resource\.data\) && fid == request\.resource\.data\.taskId \+ '_' \+ request\.resource\.data\.uid/);
  const tasks = block('tasks/{tid}');
  assert.match(rule(tasks, 'create, update'), /schoolOwner\(sid\) && validAulaTask\(request\.resource\.data\)/);
  assert.match(rule(tasks, 'read'), /schoolOwner\(sid\) \|\| inClass\(sid, cid\)/);
});

test('validación estricta: claves, tipos y tamaños de tareas, resúmenes y comentarios', () => {
  assert.match(flat, /d\.minPct is int && d\.minPct >= 0 && d\.minPct <= 100/);
  assert.match(flat, /d\.maxAttempts is int && d\.maxAttempts >= 0 && d\.maxAttempts <= 20/);
  assert.match(flat, /d\.due == null \|\| \(d\.due is string && d\.due\.matches\('\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$'\)\)/);
  assert.match(flat, /d\.to is list && d\.to\.size\(\) <= 60/);
  assert.match(flat, /\(!\('song' in d\) \|\| \(d\.kind == 'xml' && validSongPayload\(d\.song\)\)\)/);
  for (const piece of ['d.days is map && d.days.size() <= 92', 'd.mistakes is map && d.mistakes.size() <= 10', 'd.units is map && d.units.size() <= 64',
    'd.tasks is map && d.tasks.size() <= 100', 'd.recent is list && d.recent.size() <= 20', 'd.streak is int', "shortText(d.comment, 500)"]) {
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
  assert.deepEqual(Object.keys(summary).sort(), keysOf('validAulaSummary').sort());
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
  assert.match(rule(works, 'list'), /if schoolOwner\(sid\);/);
  assert.match(rule(works, 'get'), /schoolOwner\(sid\) \|\| \(signedIn\(\) && resource\.data\.uid == request\.auth\.uid\)/);
  const { WORK_KEYS, workDoc } = await import('../js/aula-api.js');
  assert.deepEqual(keysOf('validAulaWork'), WORK_KEYS);
  const doc = workDoc('u1', { nickname: 'Ana', exId: 'lm1-u3-creatividad-a-facil', title: 'Contesta a la llamada', score: 'G4q E4q C4h', meter: '4/4', pct: 80 });
  assert.deepEqual(Object.keys(doc), WORK_KEYS);
  assert.match(doc.exId, /^lm[0-9]+-u[0-9]+-creatividad-[a-c]-(facil|medio)$/);
  assert.match(doc.score, /^[A-GR#b0-9whqes. ]+$/);
  assert.match(api, /'works', `\$\{user\.uid\}_\$\{work\.exId\}`/);
});
