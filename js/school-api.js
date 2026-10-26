// Escuelas de música en Firestore. El profesor crea la escuela y su código; los alumnos entran con el código y
// cada uno guarda el resumen de su libro. La licencia premium solo la cambia el administrador.
// schools/{sid} · schoolCodes/{code} · schools/{sid}/members/{uid} (alumnos) · schools/{sid}/progress/{uid}
import { getCloud, ensureSignedIn, randomCode } from './cloud.js';
import { schoolYear } from './school.js';

const MAX_CODE_TRIES = 5;
const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs }; };
const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));

export async function createSchool(name, ownerName) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const ref = fs.doc(fs.collection(db, 'schools'));
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const code = randomCode();
    const batch = fs.writeBatch(db);
    batch.set(ref, { name, ownerUid: user.uid, ownerName, code, year: schoolYear(), students: 0, createdAt: fs.serverTimestamp() });
    batch.set(fs.doc(db, 'schoolCodes', code), { schoolId: ref.id, schoolName: name });
    try {
      await batch.commit();
      return { schoolId: ref.id, name, code, role: 'teacher' };
    } catch (e) {
      if (!String(e.code).includes('permission')) throw e; // el código ya existía
    }
  }
  throw new Error('No he podido generar un código libre. Inténtalo otra vez.');
}

// Entrar como alumno: ficha en el curso 1 y un alumno más en la escuela (las reglas comprueban el límite de la licencia)
export async function joinSchool(code, nickname, instrument) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const clean = code.trim().toUpperCase();
  const snap = await fs.getDoc(fs.doc(db, 'schoolCodes', clean));
  if (!snap.exists()) throw new Error('No existe ninguna escuela con ese código. Pídeselo a tu profesor.');
  const { schoolId, schoolName } = snap.data();
  const batch = fs.writeBatch(db);
  batch.set(fs.doc(db, 'schools', schoolId, 'members', user.uid), { nickname, instrument, level: 1, code: clean, joinedAt: fs.serverTimestamp() });
  batch.update(fs.doc(db, 'schools', schoolId), { students: fs.increment(1) });
  try { await batch.commit(); } catch (e) {
    if (String(e.code).includes('permission')) throw new Error('La escuela está completa en su modo de prueba. Pide a tu profesor que active la licencia de escuela.');
    throw e;
  }
  return { schoolId, name: schoolName, role: 'student', level: 1, uid: user.uid };
}

export async function leaveSchool(schoolId) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const batch = fs.writeBatch(db);
  batch.delete(fs.doc(db, 'schools', schoolId, 'members', user.uid));
  batch.update(fs.doc(db, 'schools', schoolId), { students: fs.increment(-1) });
  batch.delete(fs.doc(db, 'schools', schoolId, 'progress', user.uid));
  await batch.commit();
}

export async function getSchool(schoolId) {
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'schools', schoolId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMyMember(schoolId) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'schools', schoolId, 'members', user.uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listStudents(schoolId) {
  const { db, fs } = await refs();
  const [members, progress] = await Promise.all([
    fs.getDocs(fs.collection(db, 'schools', schoolId, 'members')), fs.getDocs(fs.collection(db, 'schools', schoolId, 'progress')),
  ]);
  const prog = Object.fromEntries(rows(progress).map(p => [p.id, p]));
  return rows(members).map(m => ({ ...m, progress: prog[m.id] || null }));
}

export async function updateStudent(schoolId, uid, patch) {
  const { db, fs } = await refs();
  await fs.updateDoc(fs.doc(db, 'schools', schoolId, 'members', uid), patch);
}

export async function removeStudent(schoolId, uid) {
  const { db, fs } = await refs();
  const batch = fs.writeBatch(db);
  batch.delete(fs.doc(db, 'schools', schoolId, 'members', uid));
  batch.delete(fs.doc(db, 'schools', schoolId, 'progress', uid));
  batch.update(fs.doc(db, 'schools', schoolId), { students: fs.increment(-1) });
  await batch.commit();
}

// Curso nuevo: cambia el año de la escuela y el curso de cada alumno de una vez
export async function startNewYear(schoolId, year, levels) {
  const { db, fs } = await refs();
  const batch = fs.writeBatch(db);
  batch.update(fs.doc(db, 'schools', schoolId), { year });
  Object.entries(levels).forEach(([uid, level]) => batch.update(fs.doc(db, 'schools', schoolId, 'members', uid), { level }));
  await batch.commit();
}

export async function saveProgress(schoolId, summary) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'schools', schoolId, 'progress', user.uid), { ...summary, at: Date.now() });
}

// ---------- Administrador ----------
export async function listSchools() {
  const { db, fs } = await refs();
  return rows(await fs.getDocs(fs.collection(db, 'schools')));
}

export async function setPremium(schoolId, premium) {
  const { db, fs } = await refs();
  await fs.updateDoc(fs.doc(db, 'schools', schoolId), { premium });
}
