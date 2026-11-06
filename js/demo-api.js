// Modo prueba en Firestore: la escuela de prueba del profesor (con su licencia corta) y el borrado de todo lo de la
// prueba al salir. Las reglas (firestore.rules, «Modo prueba») solo aceptan la escuela de prueba a una sesión anónima,
// con «demo: true», 7 días como mucho, 3 clases y 30 alumnos por clase.
import { getCloud, ensureSignedIn, randomCode } from './cloud.js';
import { schoolYear } from './school.js';
import { demoSchoolDoc, freeDemoClassId } from './demo.js';

const MAX_CODE_TRIES = 5;
const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs, auth: c.auth, authFns: c.authFns }; };
const isPermission = e => String(e && e.code).includes('permission');

// Entra sin cuenta (sesión anónima). «fresh»: la sesión la ha abierto la prueba (al salir se borra ese usuario anónimo)
export async function signInDemo() {
  const c = await getCloud();
  const fresh = !c.auth.currentUser;
  const user = await ensureSignedIn();
  if (!user.isAnonymous) throw Object.assign(new Error('Cierra tu sesión para entrar en el modo prueba.'), { code: 'demo/has-account' });
  return { uid: user.uid, fresh };
}

// Escuela de prueba con su licencia de prueba y su código, en una escritura
export async function createDemoSchool(ownerName) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const ref = fs.doc(fs.collection(db, 'schools'));
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const doc = demoSchoolDoc({ uid: user.uid, ownerName, code: randomCode(), year: schoolYear() });
    const batch = fs.writeBatch(db);
    batch.set(ref, { ...doc, createdAt: fs.serverTimestamp() });
    batch.set(fs.doc(db, 'schoolCodes', doc.code), { schoolId: ref.id, schoolName: doc.name });
    try {
      await batch.commit();
      return { id: ref.id, ...doc };
    } catch (e) {
      if (!isPermission(e)) throw e; // el código ya existía (o las reglas no lo aceptan: lo dice el último intento)
    }
  }
  throw new Error('No he podido preparar el Aula de prueba. Inténtalo otra vez.');
}

// Identificador de la próxima clase de prueba (null: ya hay 3)
export async function nextDemoClassId(sid) {
  const { db, fs } = await refs();
  const snap = await fs.getDocs(fs.collection(db, 'schools', sid, 'classes'));
  return freeDemoClassId(snap.docs.map(d => ({ id: d.id })));
}

// Al salir: el profesor borra su escuela de prueba entera (clases, fichas, tareas, resúmenes y códigos); el alumno sale
// de sus clases (se lleva su ficha, su resumen, sus composiciones y los comentarios). Lo que falle no impide salir.
export async function deleteDemoData(demo, classes) {
  const [{ deleteSpace }, api] = await Promise.all([import('./spaces-api.js'), import('./aula-api.js')]);
  const user = (await getCloud()).auth.currentUser;
  const jobs = (classes || []).map(c => api.leaveClass(c).catch(() => null));
  if (demo && demo.schoolId && user) jobs.push(deleteSpace({ kind: 'school', id: demo.schoolId, code: demo.schoolCode }, user.uid).catch(() => null));
  await Promise.all(jobs);
}

// Cierra la sesión de prueba y borra su usuario anónimo. Si la sesión anónima ya existía antes de la prueba (un músico sin
// cuenta en una banda), se conserva: cerrarla le haría perder su banda.
export async function signOutDemo(fresh) {
  const { auth, authFns } = await refs();
  const user = auth.currentUser;
  if (!fresh || !user || !user.isAnonymous) return;
  try { await authFns.deleteUser(user); return; } catch (e) { /* sin conexión o no permitido: basta con cerrar la sesión */ }
  await authFns.signOut(auth);
}
