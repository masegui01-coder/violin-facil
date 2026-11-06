// Modo tester (usuarios con cuenta): la clase de ejemplo vive solo en este móvil. Se comprueba que el envoltorio de
// Firestore nunca manda a la nube nada de la escuela de ejemplo (ni sus códigos de clase), que lo demás sigue igual y
// que entrar y salir no deja rastro en el Aula de verdad.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sandboxFs, seedSandbox, clearSandbox, sandboxDocs, SANDBOX_SID, inSandbox } from '../js/tester-fs.js';
import {
  sandboxSeed, sandboxTasks, sandboxProgress, testerEntryPatch, testerExitPatch, withTesterClasses, testerAulaSid, testerSession,
  SANDBOX_CID,
} from '../js/tester-view.js';
import { classRows, filterCounts, taskStatus, dayKey } from '../js/aula.js';
import { decodeSummary, WIRE } from '../js/aula-wire.js';
import { translate } from '../js/i18n.js';

const NOW = Date.UTC(2026, 10, 6, 10);
const CLS = `schools/${SANDBOX_SID}/classes/${SANDBOX_CID}`;

// Firestore «de verdad» simulado: apunta cada llamada que llegaría a la nube
function fakeCloud() {
  const calls = [];
  const ref = (type, parts) => ({ type, path: parts.filter(p => typeof p === 'string').join('/') });
  const fs = {
    doc: (db, ...parts) => ref('document', parts), collection: (db, ...parts) => ref('collection', parts),
    where: (f, op, v) => ({ real: 'where', f, op, v }), query: (col, ...cs) => ({ col, cs }),
    serverTimestamp: () => ({ real: 'ts' }), increment: n => ({ real: 'inc', n }), deleteField: () => ({ real: 'del' }),
    getDoc: async r => { calls.push(['getDoc', r.path]); return { exists: () => false }; },
    getDocs: async q => { calls.push(['getDocs', q.path || q.col.path]); return { docs: [] }; },
    setDoc: async (r, d) => { calls.push(['setDoc', r.path, d]); }, updateDoc: async (r, d) => { calls.push(['updateDoc', r.path, d]); },
    deleteDoc: async r => { calls.push(['deleteDoc', r.path]); }, addDoc: async (c, d) => { calls.push(['addDoc', c.path, d]); return ref('document', [c.path, 'x']); },
    writeBatch: () => { const ops = []; return { set: (r, d) => ops.push(['set', r.path, d]), update: (r, d) => ops.push(['update', r.path, d]), delete: r => ops.push(['delete', r.path]), commit: async () => { calls.push(['batch', ops]); } }; },
  };
  return { fs, calls };
}

test('envoltorio: lo de la escuela de ejemplo se lee y escribe en local; nada llega a la nube', async () => {
  clearSandbox();
  seedSandbox(sandboxSeed({ uid: 'me', now: NOW }));
  const { fs: real, calls } = fakeCloud();
  const fs = sandboxFs(real);
  const db = {};
  // Lecturas como las de aula-api.js loadClass / loadMyClass
  const cls = await fs.getDoc(fs.doc(db, 'schools', SANDBOX_SID, 'classes', SANDBOX_CID));
  assert.equal(cls.exists(), true);
  assert.equal(typeof cls.data().createdAt.toMillis, 'function', 'las horas vuelven como Timestamp');
  assert.equal((await fs.getDocs(fs.collection(db, 'schools', SANDBOX_SID, 'classes', SANDBOX_CID, 'students'))).docs.length, 8);
  const mine = await fs.getDocs(fs.query(fs.collection(db, 'schools', SANDBOX_SID, 'classes', SANDBOX_CID, 'feedback'), fs.where('uid', '==', 'me')));
  assert.equal(mine.docs.length, 2, 'los comentarios del tester alumno');
  // Escrituras como las del profesor: tarea, comentario, cambiar código (lote con classCodes), dar de baja y borrar la clase
  const task = await fs.addDoc(fs.collection(db, 'schools', SANDBOX_SID, 'classes', SANDBOX_CID, 'tasks'), { title: 'Nueva', createdAt: NOW });
  assert.ok(inSandbox(task.path));
  await fs.setDoc(fs.doc(db, 'schools', SANDBOX_SID, 'classes', SANDBOX_CID, 'feedback', 'x_ejemplo-1'), { uid: 'ejemplo-1', comment: 'Bien' });
  const b = fs.writeBatch(db);
  b.update(fs.doc(db, 'schools', SANDBOX_SID, 'classes', SANDBOX_CID), { code: 'NUEVO2', students: fs.increment(-1), leftUid: fs.deleteField() });
  b.set(fs.doc(db, 'classCodes', 'NUEVO2'), { schoolId: SANDBOX_SID, classId: SANDBOX_CID });
  b.delete(fs.doc(db, 'classCodes', 'EJEMPL'));
  await b.commit();
  const after = sandboxDocs().get(CLS);
  assert.equal(after.code, 'NUEVO2');
  assert.equal(after.students, 7, 'increment aplicado en local');
  assert.ok(!('leftUid' in after));
  await fs.updateDoc(fs.doc(db, 'schools', SANDBOX_SID, 'classes', SANDBOX_CID), { createdAt: fs.serverTimestamp() });
  assert.ok(sandboxDocs().get(CLS).createdAt.__ts > 0);
  await fs.deleteDoc(fs.doc(db, 'schools', SANDBOX_SID, 'classes', SANDBOX_CID, 'students', 'ejemplo-1'));
  assert.ok(!sandboxDocs().has(`${CLS}/students/ejemplo-1`));
  assert.deepEqual(calls, [], 'ni una llamada a la nube');
  assert.ok(![...sandboxDocs().keys()].some(k => k.startsWith('classCodes/')), 'los códigos de la clase de ejemplo no se guardan en ningún sitio');
  clearSandbox();
  assert.equal(sandboxDocs().size, 0);
});

test('envoltorio: lo que no es de la escuela de ejemplo va a la nube igual que antes (valores de Firestore intactos)', async () => {
  const { fs: real, calls } = fakeCloud();
  const fs = sandboxFs(real);
  await fs.setDoc(fs.doc({}, 'schools', 'S1', 'classes', 'C1', 'students', 'me'), { nickname: 'Lucía', joinedAt: fs.serverTimestamp() });
  const b = fs.writeBatch({});
  b.update(fs.doc({}, 'schools', 'S1', 'classes', 'C1'), { students: fs.increment(1) });
  await b.commit();
  await fs.getDocs(fs.query(fs.collection({}, 'schools', 'S1', 'classes', 'C1', 'works'), fs.where('uid', '==', 'me')));
  assert.deepEqual(calls[0], ['setDoc', 'schools/S1/classes/C1/students/me', { nickname: 'Lucía', joinedAt: { real: 'ts' } }]);
  assert.deepEqual(calls[1], ['batch', [['update', 'schools/S1/classes/C1', { students: { real: 'inc', n: 1 } }]]]);
  assert.equal(calls[2][0], 'getDocs');
  assert.ok(!inSandbox('schools/ejemplo-testerX/classes'), 'solo la escuela de ejemplo exacta');
});

test('aula-api usa el envoltorio solo durante el modo tester', () => {
  const api = readFileSync(new URL('../js/aula-api.js', import.meta.url), 'utf8');
  assert.match(api, /const refs = async \(\) => \{ const c = await getCloud\(\); return \{ db: c\.db, fs: testerFs\(c\.fs\) \}; \};/);
  const src = readFileSync(new URL('../js/tester-fs.js', import.meta.url), 'utf8');
  assert.match(src, /if \(!getState\(\)\.tester\) return fs;/);
});

test('clase de ejemplo: alumnos «(ejemplo)», unidades de Lenguaje, vencidas, comentarios y composiciones', () => {
  const seed = sandboxSeed({ uid: 'me', now: NOW });
  const tasks = sandboxTasks(NOW);
  assert.deepEqual(tasks.map(t => t.kind), ['lm-unit', 'lm-section', 'lm-ex', 'lesson']);
  const students = Object.entries(seed).filter(([k]) => k.startsWith(`${CLS}/students/`)).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  students.forEach(s => assert.match(s.nickname, /\(ejemplo\)$/));
  const summaries = Object.fromEntries(students.map(s => [s.id, decodeSummary(seed[`${CLS}/summaries/${s.id}`])]));
  Object.values(summaries).forEach(sum => assert.ok(Object.keys(sum.units).length >= 1, 'progreso en unidades de Lenguaje'));
  students.forEach(s => ['days', 'tasks', 'units', 'mistakes', 'recent'].forEach(f => assert.match(seed[`${CLS}/summaries/${s.id}`][f], new RegExp(`^(?:${WIRE[f]})$`))));
  const rows = classRows({ students, tasks, summaries, today: dayKey(NOW) });
  const counts = filterCounts(rows);
  assert.ok(counts.overdue > 0 && counts.inactive > 0, 'hay vencidas y alumnos sin practicar');
  assert.ok(Object.keys(seed).some(k => k.includes('/feedback/')), 'comentarios del profesor');
  assert.ok(Object.keys(seed).some(k => k.includes('/works/')), 'composiciones');
  assert.equal(seed[`schools/${SANDBOX_SID}`].premium.active, true, 'licencia de la escuela de ejemplo, solo local');
  // Las tareas de ejemplo tienen las claves de una tarea de verdad (las de validAulaTask en las reglas)
  const keys = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8').replace(/\s+/g, ' ')
    .match(/function validAulaTask\(d\) \{ return d\.keys\(\)\.hasOnly\(\[([^\]]*)\]/)[1].split(',').map(k => k.trim().replace(/'/g, ''));
  tasks.forEach(({ id, ...t }) => assert.deepEqual(Object.keys(t).filter(k => !keys.includes(k)), [], id));
  // Lo que ve el alumno tester: hecha, empezada, vencida y sin empezar
  const prog = sandboxProgress(NOW);
  const status = t => taskStatus(t, prog[`${SANDBOX_CID}/${t.id}`] || null, dayKey(NOW));
  assert.deepEqual(tasks.map(status), ['late', 'todo', 'progress', 'done']);
  ['Unidad 1 · El latido', 'Lenguaje 1 · Ejemplo', 'Clase de Marta (ejemplo)', 'Abrir el libro de Lenguaje Musical (Nivel 1)'].forEach(es => assert.notEqual(translate(es), es, es));
});

test('entrar y salir del modo tester: el Aula de verdad queda como estaba', () => {
  const real = { sid: 'S1', cid: 'C1', name: 'Clase real', uid: 'me' };
  const state = { nickname: 'Manu', instrument: 'violin', learnView: 'casual', aulaView: 'method', aula: { classes: [real], prog: { 'C1/t1': { p: 80 } }, tasks: { 'S1/C1': [] } } };
  const asStudent = { ...state, ...testerEntryPatch(state, 'alumno', { uid: 'me', now: NOW }) };
  assert.deepEqual(asStudent.aula.classes, [real], 'la clase de ejemplo no se guarda en mis clases');
  assert.equal(testerSession(asStudent).role, 'alumno');
  const mine = withTesterClasses(asStudent.aula.classes, asStudent);
  assert.equal(mine.length, 2);
  assert.equal(mine[1].sid, SANDBOX_SID);
  assert.equal(mine[1].uid, 'me');
  assert.equal(testerAulaSid(asStudent), null, 'como alumno no se ve ninguna escuela');
  assert.equal(asStudent.learnView, 'pro');
  // Cambiar a profesor: la vista de antes se sigue recordando
  const withCache = { ...asStudent, aula: { ...asStudent.aula, tasks: { ...asStudent.aula.tasks, [`${SANDBOX_SID}/${SANDBOX_CID}`]: [] } } };
  const asTeacher = { ...withCache, ...testerEntryPatch(withCache, 'profesor', { uid: 'me', now: NOW }) };
  assert.equal(testerAulaSid(asTeacher), SANDBOX_SID);
  assert.deepEqual(withTesterClasses(asTeacher.aula.classes, asTeacher), [real]);
  assert.deepEqual(asTeacher.tester.prev, { learnView: 'casual', aulaView: 'method' });
  assert.ok(!Object.keys(asTeacher.aula.prog).some(k => k.startsWith(SANDBOX_CID)), 'el progreso de ejemplo se quita al cambiar a profesor');
  // Salir
  const out = { ...asTeacher, ...testerExitPatch(asTeacher) };
  assert.equal(out.tester, null);
  assert.equal(out.learnView, 'casual');
  assert.equal(out.aulaView, 'method');
  assert.deepEqual(out.aula, state.aula, 'el Aula de verdad, intacta');
  assert.equal(testerAulaSid(out), undefined);
  assert.deepEqual(withTesterClasses(out.aula.classes, out), [real]);
});

test('el modo tester no se sube a la nube con el progreso', () => {
  const sync = readFileSync(new URL('../js/sync.js', import.meta.url), 'utf8');
  assert.match(sync, /const LOCAL_ONLY = \[[^\]]*'tester'[^\]]*\]/);
});

test('cada texto del modo tester tiene su inglés', () => {
  const src = readFileSync(new URL('../js/screens/tester.js', import.meta.url), 'utf8');
  const literals = [...src.matchAll(/(?:esc|toast)\('((?:[^'\\]|\\.)*)'\)/g)].map(m => m[1]);
  const ternaries = [...src.matchAll(/\? '([^']+)' : '([^']+)'/g)].flatMap(m => [m[1], m[2]]).filter(x => x.includes(' '));
  const texts = [...new Set([...literals, ...ternaries])].filter(x => /\p{L}{2}/u.test(x));
  assert.ok(texts.length > 15, `solo ${texts.length}`);
  assert.deepEqual(texts.filter(es => translate(es) === es), []);
});
