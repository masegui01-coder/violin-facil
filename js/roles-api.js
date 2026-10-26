// Testers pro dados de alta por el administrador (roles/{uid}), además de la lista fija de correos de metrics.js.
import { getCloud } from './cloud.js';

export async function isProTesterUid(uid) {
  if (!uid) return false;
  const { db, fs } = await getCloud();
  try { const snap = await fs.getDoc(fs.doc(db, 'roles', uid)); return snap.exists() && snap.data().pro === true; } catch (e) { return false; }
}

// Solo administrador: uid → true para los que son tester pro
export async function listProTesters() {
  const { db, fs } = await getCloud();
  const snap = await fs.getDocs(fs.collection(db, 'roles'));
  return Object.fromEntries(snap.docs.filter(d => d.data().pro === true).map(d => [d.id, true]));
}

export async function setProTester(uid, pro) {
  const { db, fs } = await getCloud();
  await fs.setDoc(fs.doc(db, 'roles', uid), { pro, at: Date.now() });
}
