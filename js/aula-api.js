// Aula Pro en Firestore, sobre la escuela del profesor (school-api.js). Sin plan Blaze: todo lo comprueban las reglas.
// schools/{sid}/classes/{cid}                 clase: { name, code, teacherName, students, createdAt, (archived), (leftUid) }
// classCodes/{code}                            { schoolId, classId, className, teacherName } para entrar con el código
// schools/{sid}/classes/{cid}/students/{uid}   ficha del alumno: { nickname, instrument, code, joinedAt } (él y el profesor)
// schools/{sid}/classes/{cid}/tasks/{tid}      tareas (aula.js normalizeTask): las lee la clase, las escribe el profesor
// schools/{sid}/classes/{cid}/summaries/{uid}  resumen acotado que publica el alumno (aula-summary.js): él y el profesor
// schools/{sid}/classes/{cid}/feedback/{tid_uid} comentario del profesor a una entrega: él y ese alumno
// schools/{sid}/classes/{cid}/works/{uid_ejercicio} composición del curso de Lenguaje (creatividad): ese alumno y el profesor
import { getCloud, ensureSignedIn, randomCode } from './cloud.js';
import { createSchool } from './school-api.js';
import { encodeSummary, decodeSummary } from './aula-wire.js';

const MAX_CODE_TRIES = 5;
// Todo lo que cuelga de una clase (también las composiciones y los comentarios: son datos de menores)
export const CLASS_SUBS = ['students', 'tasks', 'summaries', 'feedback', 'works'];
const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs }; };
const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
const classRef = (fs, db, sid, cid) => fs.doc(db, 'schools', sid, 'classes', cid);
const sub = (fs, db, sid, cid, name) => fs.collection(db, 'schools', sid, 'classes', cid, name);
const isPermission = e => String(e && e.code).includes('permission');

// ---------- Profesor ----------
// Pide el Aula: crea su escuela si aún no tiene y deja la petición a la vista del administrador
export async function requestAccess({ schoolId, name, ownerName }) {
  const created = schoolId ? null : await createSchool(name, ownerName);
  const sid = schoolId || created.schoolId;
  const { db, fs } = await refs();
  await fs.updateDoc(fs.doc(db, 'schools', sid), { proRequestedAt: fs.serverTimestamp() });
  return { schoolId: sid, created };
}

export async function getSchoolDoc(sid) {
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'schools', sid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createClass(sid, name, teacherName) {
  await ensureSignedIn();
  const { db, fs } = await refs();
  const ref = fs.doc(fs.collection(db, 'schools', sid, 'classes'));
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const code = randomCode();
    const batch = fs.writeBatch(db);
    batch.set(ref, { name, code, teacherName, students: 0, createdAt: fs.serverTimestamp() });
    batch.set(fs.doc(db, 'classCodes', code), { schoolId: sid, classId: ref.id, className: name, teacherName });
    try {
      await batch.commit();
      return { id: ref.id, name, code, teacherName, students: 0 };
    } catch (e) {
      if (!isPermission(e)) throw e; // el código ya existía (o falta la licencia: lo dice el último intento)
    }
  }
  throw new Error('No he podido crear la clase. Comprueba que tu Aula Pro está activa e inténtalo otra vez.');
}

export async function listClasses(sid) {
  const { db, fs } = await refs();
  return rows(await fs.getDocs(fs.collection(db, 'schools', sid, 'classes')));
}

// Todo lo que el profesor ve de una clase, en cuatro lecturas
export async function loadClass(sid, cid) {
  const { db, fs } = await refs();
  const [cls, students, tasks, summaries, feedback, works] = await Promise.all([
    fs.getDoc(classRef(fs, db, sid, cid)),
    fs.getDocs(sub(fs, db, sid, cid, 'students')), fs.getDocs(sub(fs, db, sid, cid, 'tasks')),
    fs.getDocs(sub(fs, db, sid, cid, 'summaries')), fs.getDocs(sub(fs, db, sid, cid, 'feedback')),
    fs.getDocs(sub(fs, db, sid, cid, 'works')).catch(() => ({ docs: [] })),
  ]);
  if (!cls.exists()) return null;
  return {
    cls: { id: cls.id, ...cls.data() }, students: rows(students),
    tasks: rows(tasks).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    // Lo que publica el alumno se sanea al leerlo: todo % y todo número salen como número (aula-wire.js)
    summaries: Object.fromEntries(rows(summaries).map(s => [s.id, decodeSummary(s)])),
    feedback: Object.fromEntries(rows(feedback).map(f => [f.id, f])),
    works: rows(works).sort((a, b) => (b.at || 0) - (a.at || 0)),
  };
}

export async function renameClass(sid, cid, name) {
  const { db, fs } = await refs();
  await fs.updateDoc(classRef(fs, db, sid, cid), { name });
}

// Borra la clase entera (tareas, resúmenes, comentarios, fichas y su código) en una escritura
export async function deleteClass(sid, cls) {
  const { db, fs } = await refs();
  const lists = await Promise.all(CLASS_SUBS.map(n => fs.getDocs(sub(fs, db, sid, cls.id, n))));
  const batch = fs.writeBatch(db);
  lists.forEach(snap => snap.docs.forEach(d => batch.delete(d.ref)));
  // Con las inscripciones cerradas el código ya no existe: no se borra otra vez (un lote con un borrado inválido falla entero)
  if (cls.code && !cls.closed) batch.delete(fs.doc(db, 'classCodes', cls.code));
  batch.delete(classRef(fs, db, sid, cls.id));
  await batch.commit();
}

export async function createTask(sid, cid, task) {
  const { db, fs } = await refs();
  const ref = await fs.addDoc(sub(fs, db, sid, cid, 'tasks'), task);
  return { id: ref.id, ...task };
}

export async function deleteTask(sid, cid, taskId) {
  const { db, fs } = await refs();
  await fs.deleteDoc(fs.doc(db, 'schools', sid, 'classes', cid, 'tasks', taskId));
}

// Comentario del profesor a la entrega de un alumno (vacío: se borra)
export async function setFeedback(sid, cid, taskId, uid, comment) {
  const { db, fs } = await refs();
  const ref = fs.doc(db, 'schools', sid, 'classes', cid, 'feedback', `${taskId}_${uid}`);
  if (!comment) { await fs.deleteDoc(ref); return null; }
  const doc = { uid, taskId, comment, at: Date.now() };
  await fs.setDoc(ref, doc);
  return doc;
}

// Dar de baja: ficha, resumen, composiciones y comentarios del alumno con una plaza menos (indicando quién sale),
// todo en una escritura como piden las reglas; después se quita «leftUid» para que la clase no guarde su identificador
export async function removeStudent(sid, cid, uid) {
  const { db, fs } = await refs();
  const own = await Promise.all(['works', 'feedback'].map(n => fs.getDocs(fs.query(sub(fs, db, sid, cid, n), fs.where('uid', '==', uid)))));
  const batch = fs.writeBatch(db);
  batch.delete(fs.doc(db, 'schools', sid, 'classes', cid, 'students', uid));
  batch.delete(fs.doc(db, 'schools', sid, 'classes', cid, 'summaries', uid));
  own.forEach(snap => snap.docs.forEach(d => batch.delete(d.ref)));
  batch.update(classRef(fs, db, sid, cid), { students: fs.increment(-1), leftUid: uid });
  await batch.commit();
  await fs.updateDoc(classRef(fs, db, sid, cid), { leftUid: fs.deleteField() });
}

// Código de la clase: uno nuevo (el anterior deja de servir) o ninguno (inscripciones cerradas)
export async function changeCode(sid, cls, teacherName) {
  const { db, fs } = await refs();
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const code = randomCode();
    const batch = fs.writeBatch(db);
    batch.update(classRef(fs, db, sid, cls.id), { code, closed: false });
    batch.set(fs.doc(db, 'classCodes', code), { schoolId: sid, classId: cls.id, className: cls.name, teacherName });
    if (cls.code && !cls.closed) batch.delete(fs.doc(db, 'classCodes', cls.code));
    try { await batch.commit(); return code; } catch (e) { if (!isPermission(e)) throw e; }
  }
  throw new Error('No he podido cambiar el código. Inténtalo otra vez.');
}

export async function closeJoining(sid, cls) {
  const { db, fs } = await refs();
  const batch = fs.writeBatch(db);
  batch.update(classRef(fs, db, sid, cls.id), { closed: true });
  if (cls.code && !cls.closed) batch.delete(fs.doc(db, 'classCodes', cls.code));
  await batch.commit();
}

// ---------- Alumno ----------
export async function joinClass(code, nickname, instrument) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const clean = code.trim().toUpperCase();
  const snap = await fs.getDoc(fs.doc(db, 'classCodes', clean));
  if (!snap.exists()) throw new Error('No existe ninguna clase con ese código. Pídeselo a tu profesor.');
  const { schoolId, classId, className, teacherName } = snap.data();
  const batch = fs.writeBatch(db);
  batch.set(fs.doc(db, 'schools', schoolId, 'classes', classId, 'students', user.uid), { nickname, instrument, code: clean, joinedAt: fs.serverTimestamp() });
  batch.update(classRef(fs, db, schoolId, classId), { students: fs.increment(1) });
  try { await batch.commit(); } catch (e) {
    if (isPermission(e)) throw new Error('No puedes entrar en esta clase: ya estás dentro, está completa o el Aula de tu profesor no está activa.');
    throw e;
  }
  return { sid: schoolId, cid: classId, name: className, teacher: teacherName, code: clean, nickname, instrument, uid: user.uid };
}

export async function leaveClass(c) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const ref = classRef(fs, db, c.sid, c.cid);
  const batch = fs.writeBatch(db);
  batch.delete(fs.doc(db, 'schools', c.sid, 'classes', c.cid, 'students', user.uid));
  batch.delete(fs.doc(db, 'schools', c.sid, 'classes', c.cid, 'summaries', user.uid));
  // sus composiciones y los comentarios a sus entregas se van con él (las reglas lo dejan al salir de la clase)
  const own = await Promise.all(['works', 'feedback'].map(n => fs.getDocs(fs.query(sub(fs, db, c.sid, c.cid, n), fs.where('uid', '==', user.uid))).catch(() => ({ docs: [] }))));
  own.forEach(snap => snap.docs.forEach(d => batch.delete(d.ref)));
  // si el profesor ya borró la clase no hay contador que restar
  if ((await fs.getDoc(ref).catch(() => null))?.exists()) batch.update(ref, { students: fs.increment(-1) });
  await batch.commit();
}

// Tareas de mi clase (sin la partitura, que se pide al abrir la tarea) y comentarios del profesor para mí
export async function loadMyClass(c) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const [cls, tasks, feedback] = await Promise.all([
    fs.getDoc(classRef(fs, db, c.sid, c.cid)),
    fs.getDocs(sub(fs, db, c.sid, c.cid, 'tasks')),
    fs.getDocs(fs.query(sub(fs, db, c.sid, c.cid, 'feedback'), fs.where('uid', '==', user.uid))),
  ]);
  if (!cls.exists()) return null;
  return {
    cls: { id: cls.id, ...cls.data() },
    tasks: rows(tasks).map(({ song, ...t }) => ({ ...t, hasSong: !!song })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    feedback: Object.fromEntries(rows(feedback).map(f => [f.taskId, f])),
  };
}

export async function getTask(sid, cid, taskId) {
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'schools', sid, 'classes', cid, 'tasks', taskId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Composición del curso de Lenguaje Musical (creatividad) para el profesor: una por ejercicio, la última enviada
export const WORK_KEYS = ['uid', 'nickname', 'exId', 'title', 'score', 'lyrics', 'meter', 'pct', 'at'];
export function workDoc(uid, { nickname, exId, title, score, lyrics = '', meter, pct, at = Date.now() }) {
  return {
    uid, nickname: String(nickname || '').slice(0, 30), exId, title: String(title || '').slice(0, 80), score: String(score).slice(0, 800),
    lyrics: String(lyrics || '').slice(0, 200), meter: String(meter || '4/4').slice(0, 6), pct: Math.max(0, Math.min(100, Math.round(pct || 0))), at,
  };
}
export async function sendWork(c, work) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'schools', c.sid, 'classes', c.cid, 'works', `${user.uid}_${work.exId}`), workDoc(user.uid, { nickname: c.nickname, ...work }));
}

export async function publishSummary(c, summary) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'schools', c.sid, 'classes', c.cid, 'summaries', user.uid), encodeSummary(summary));
}
