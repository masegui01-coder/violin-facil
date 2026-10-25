// Datos de «Mi banda» en Firestore: bandas, códigos de invitación, músicos, tareas y progreso.
import { getCloud, ensureSignedIn, signInDirector, randomCode } from './cloud.js';
import { songScore } from './songs.js';

const MAX_CODE_TRIES = 5;
const MODE_RANK = { learn: 1, tempo: 2, memory: 3 };

const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs }; };
const toMillis = t => (t && t.toMillis ? t.toMillis() : t || 0);
const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));

export async function createBand(name, nickname, instrument) {
  const user = await signInDirector();
  const { db, fs } = await refs();
  const bandRef = fs.doc(fs.collection(db, 'bands'));
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const code = randomCode();
    const batch = fs.writeBatch(db);
    batch.set(bandRef, { name, directorUid: user.uid, directorName: nickname, code, createdAt: fs.serverTimestamp() });
    batch.set(fs.doc(db, 'bands', bandRef.id, 'members', user.uid), { nickname, instrument, role: 'director', joinedAt: fs.serverTimestamp() });
    batch.set(fs.doc(db, 'bandCodes', code), { bandId: bandRef.id, bandName: name });
    try {
      await batch.commit();
      return { bandId: bandRef.id, name, code, role: 'director', nickname, uid: user.uid };
    } catch (e) {
      if (!String(e.code).includes('permission')) throw e; // el código ya existía: probamos otro
    }
  }
  throw new Error('No he podido generar un código libre. Inténtalo otra vez.');
}

export async function lookupCode(code) {
  await ensureSignedIn();
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'bandCodes', code.trim().toUpperCase()));
  if (!snap.exists()) throw new Error('No existe ninguna banda con ese código. Revísalo con tu director.');
  return { code: snap.id, ...snap.data() };
}

export async function joinBand(code, nickname, instrument) {
  const user = await ensureSignedIn();
  const { bandId, bandName } = await lookupCode(code);
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'bands', bandId, 'members', user.uid), { nickname, instrument, role: 'member', code: code.trim().toUpperCase(), joinedAt: fs.serverTimestamp() });
  return { bandId, name: bandName, role: 'member', nickname, uid: user.uid };
}

export async function updateMyMember(band, patch) {
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'bands', band.bandId, 'members', band.uid), patch, { merge: true });
}

export async function listMembers(bandId) {
  const { db, fs } = await refs();
  return rows(await fs.getDocs(fs.collection(db, 'bands', bandId, 'members')));
}

export async function listTasks(bandId) {
  const { db, fs } = await refs();
  const list = rows(await fs.getDocs(fs.collection(db, 'bands', bandId, 'tasks')));
  return list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function createTask(bandId, task) {
  const { db, fs } = await refs();
  return fs.addDoc(fs.collection(db, 'bands', bandId, 'tasks'), { ...task, createdAt: fs.serverTimestamp() });
}

export async function deleteTask(bandId, taskId) {
  const { db, fs } = await refs();
  await fs.deleteDoc(fs.doc(db, 'bands', bandId, 'tasks', taskId));
}

// Director: todo el progreso. Músico: solo el suyo.
export async function listProgress(band) {
  const { db, fs } = await refs();
  const col = fs.collection(db, 'bands', band.bandId, 'progress');
  const q = band.role === 'director' ? col : fs.query(col, fs.where('uid', '==', band.uid));
  return rows(await fs.getDocs(q));
}

// ¿La tarea se considera hecha? Vale el modo pedido o uno más exigente, con las estrellas mínimas.
export function taskDone(task, byMode) {
  return Object.entries(byMode || {}).some(([mode, stars]) => MODE_RANK[mode] >= MODE_RANK[task.mode] && stars >= task.minStars);
}

export async function reportProgress(band, task, { mode, stars, accuracy, minutes }) {
  const { db, fs } = await refs();
  const ref = fs.doc(db, 'bands', band.bandId, 'progress', `${task.id}_${band.uid}`);
  const prev = (await fs.getDoc(ref)).data() || {};
  const byMode = { ...(prev.byMode || {}), [mode]: Math.max(prev.byMode?.[mode] || 0, stars) };
  await fs.setDoc(ref, {
    taskId: task.id, uid: band.uid, nickname: band.nickname, instrument: band.instrument || null,
    bestStars: Math.max(prev.bestStars || 0, stars), bestAccuracy: Math.max(prev.bestAccuracy || 0, accuracy ?? 0),
    attempts: (prev.attempts || 0) + 1, minutes: Math.round(((prev.minutes || 0) + minutes) * 10) / 10,
    byMode, completed: taskDone(task, byMode), lastAt: fs.serverTimestamp(),
    history: [...(prev.history || []), { at: Date.now(), stars, accuracy: accuracy ?? 0, mode }].slice(-30),
  });
}

// Partitura que se guarda en la tarea (siempre ya analizada, para que no dependa del repertorio)
export function songPayload(song) {
  return { title: song.title, by: song.by || '', key: song.key, time: song.time, bpm: song.bpm, pickup: song.pickup || 0, parsed: songScore(song) };
}

// ¿Esta tarea es para mí?
export function assignedTo(task, member) {
  const a = task.assign || { type: 'all' };
  if (a.type === 'instruments') return (a.instruments || []).includes(member.instrument);
  if (a.type === 'members') return (a.members || []).includes(member.uid);
  return true;
}

export const millis = toMillis;
