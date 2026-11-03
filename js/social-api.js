// Social en Firestore: partituras compartidas, retos con amigos, clasificaciones abiertas, reto del día y ligas semanales.
import { getCloud, ensureSignedIn, randomCode } from './cloud.js';
import { leaguePlan, LEAGUE_INTERVAL_MS, LEAGUE_MARGIN_MS } from './league.js';

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

// Para la liga semanal se acumulan puntos en vez de guardar el mejor resultado. Las reglas solo aceptan una suma
// por minuto: lo que llega antes espera en memoria (por clasificación) y se envía junto cuando toca (ver league.js).
const leagueQueue = new Map(); // 'leagues/<semana>_<inst>' → { path, name, instrument, points, busy, timer, tries }
const LEAGUE_RETRIES = 3;      // por si el reloj del móvil va adelantado y las reglas lo rechazan

export async function addLeaguePoints(path, { name, points, instrument }) {
  const key = path.join('/');
  const prev = leagueQueue.get(key);
  leagueQueue.set(key, { tries: 0, ...prev, path, name, instrument, points: ((prev && prev.points) || 0) + points });
  if (prev && (prev.busy || prev.timer)) return; // ya hay un envío en marcha o programado: se suman a él
  await flushLeague(key);
}

function scheduleLeague(key, waitMs) {
  const timer = setTimeout(() => flushLeague(key).catch(() => {}), waitMs); // en segundo plano: si falla, se pierden esos puntos
  leagueQueue.set(key, { ...leagueQueue.get(key), busy: false, timer });
}

async function flushLeague(key) {
  const start = leagueQueue.get(key);
  if (!start) return;
  const taken = start.points;
  leagueQueue.set(key, { ...start, busy: true, timer: 0 });
  let plan;
  try {
    const user = await ensureSignedIn();
    const { db, fs } = await refs();
    const ref = fs.doc(db, ...start.path, 'results', user.uid);
    const snap = await fs.getDoc(ref);
    const d = snap.exists() ? snap.data() : null;
    plan = leaguePlan(taken, d && { score: d.score || 0, atMs: d.at && d.at.toMillis ? d.at.toMillis() : 0 }, Date.now());
    if (plan.send) await fs.setDoc(ref, { name: start.name, instrument: start.instrument, score: fs.increment(plan.send), at: fs.serverTimestamp() }, { merge: true });
  } catch (e) {
    const cur = leagueQueue.get(key);
    if (String(e && e.code).includes('permission') && cur.tries < LEAGUE_RETRIES) {
      leagueQueue.set(key, { ...cur, tries: cur.tries + 1 });
      scheduleLeague(key, LEAGUE_INTERVAL_MS + LEAGUE_MARGIN_MS);
      return;
    }
    leagueQueue.delete(key);
    throw e;
  }
  const latest = leagueQueue.get(key);
  const left = plan.carry + (latest.points - taken); // lo que no cabía y lo que llegó mientras se enviaba
  if (left <= 0) { leagueQueue.delete(key); return; }
  leagueQueue.set(key, { ...latest, points: left, tries: 0 });
  scheduleLeague(key, plan.waitMs || LEAGUE_INTERVAL_MS + LEAGUE_MARGIN_MS);
}

export async function topScores(path) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const snap = await fs.getDocs(fs.query(fs.collection(db, ...path, 'results'), fs.orderBy('score', 'desc'), fs.limit(TOP)));
  return { me: user.uid, rows: snap.docs.map(d => ({ uid: d.id, ...d.data() })) };
}
