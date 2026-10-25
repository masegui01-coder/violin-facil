// Social en Firestore: partituras compartidas, retos con amigos, clasificaciones abiertas, reto del día y ligas semanales.
import { getCloud, ensureSignedIn, randomCode } from './cloud.js';

const MAX_CODE_TRIES = 5;
const TOP = 20;

const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs }; };

async function createWithCode(collection, data) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const code = randomCode();
    const ref = fs.doc(db, collection, code);
    try {
      await fs.setDoc(ref, { ...data, ownerUid: user.uid, createdAt: fs.serverTimestamp() });
      return code;
    } catch (e) { if (!String(e.code).includes('permission')) throw e; }
  }
  throw new Error('No he podido generar un código libre. Inténtalo otra vez.');
}

async function getByCode(collection, code, notFound) {
  await ensureSignedIn();
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, collection, code.trim().toUpperCase()));
  if (!snap.exists()) throw new Error(notFound);
  return { code: snap.id, ...snap.data() };
}

// ---------- Partituras compartidas ----------
export const shareScore = (song, ownerName) => createWithCode('sharedScores', { song, ownerName });
export const getSharedScore = code => getByCode('sharedScores', code, 'No existe ninguna partitura con ese código.');

// ---------- Retos ----------
export const createChallenge = (song, instrument, ownerName) => createWithCode('challenges', { song, instrument, ownerName });
export const getChallenge = code => getByCode('challenges', code, 'Ese reto no existe o ha caducado.');

// ---------- Resultados con clasificación (retos, canciones, reto del día y ligas) ----------
// path: ['challenges', code] · ['boards', 'oda_flute'] · ['daily', '2026-10-25_flute'] · ['leagues', '2026-W43_flute']
export async function submitScore(path, { name, score, stars = 0, instrument }) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const ref = fs.doc(db, ...path, 'results', user.uid);
  const prev = (await fs.getDoc(ref)).data();
  if (prev && prev.score >= score) return false;
  await fs.setDoc(ref, { name, score, stars, instrument: instrument || null, at: fs.serverTimestamp() });
  return true;
}

// Para la liga semanal se acumulan puntos en vez de guardar el mejor resultado
export async function addLeaguePoints(path, { name, points, instrument }) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, ...path, 'results', user.uid), { name, instrument, score: fs.increment(points), at: fs.serverTimestamp() }, { merge: true });
}

export async function topScores(path) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const snap = await fs.getDocs(fs.query(fs.collection(db, ...path, 'results'), fs.orderBy('score', 'desc'), fs.limit(TOP)));
  return { me: user.uid, rows: snap.docs.map(d => ({ uid: d.id, ...d.data() })) };
}
