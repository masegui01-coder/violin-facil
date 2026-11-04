// Datos de «Mi banda» en Firestore: bandas, códigos de invitación, músicos, tareas y progreso.
import { getCloud, ensureSignedIn, signInDirector, randomCode } from './cloud.js';
import { songScore, octaveShiftFor } from './songs.js';
import { transposeScore } from './music.js';
import { instrumentById } from './instruments.js';
import { encodeScore, decodeScore } from './passage.js';
import { STATS_DOC, LEGACY_SHARED_KEYS, sharedActivity, privateActivity, cappedPoints, statsDue, memberWithStats } from './band-stats.js';

const MAX_CODE_TRIES = 5;
const MODE_RANK = { learn: 1, tempo: 2, memory: 3 };

const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs }; };
const toMillis = t => (t && t.toMillis ? t.toMillis() : t || 0);
const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
const isDenied = e => String(e && e.code).includes('permission');
// Estadísticas privadas de un músico (las reglas solo dejan leerlas a él y al director)
const statsRef = (fs, db, bandId, uid) => fs.doc(db, 'bands', bandId, 'members', uid, ...STATS_DOC);

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

export async function leaveBand(band) {
  const { db, fs } = await refs();
  const batch = fs.writeBatch(db);
  batch.delete(statsRef(fs, db, band.bandId, band.uid));
  batch.delete(fs.doc(db, 'bands', band.bandId, 'members', band.uid));
  await batch.commit();
}

// Código nuevo para la banda (p. ej. si el antiguo circula por donde no debe): el viejo deja de servir
export async function rotateCode(band) {
  const { db, fs } = await refs();
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const code = randomCode();
    const batch = fs.writeBatch(db);
    batch.set(fs.doc(db, 'bandCodes', code), { bandId: band.bandId, bandName: band.name });
    batch.update(fs.doc(db, 'bands', band.bandId), { code });
    if (band.code) batch.delete(fs.doc(db, 'bandCodes', band.code));
    try { await batch.commit(); return code; } catch (e) { if (!String(e.code).includes('permission')) throw e; }
  }
  throw new Error('No he podido generar un código nuevo. Inténtalo otra vez.');
}

export async function updateMyMember(band, patch) {
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'bands', band.bandId, 'members', band.uid), patch, { merge: true });
}

// Fichas de la banda. El director las recibe con las estadísticas privadas de cada músico; los demás, solo con las suyas
// (sus puntos para los premios). Una ficha sin estadísticas (antigua o aún sin sincronizar) se queda con lo público.
export async function listMembers(bandId) {
  const { db, fs, auth } = await getCloud();
  const list = rows(await fs.getDocs(fs.collection(db, 'bands', bandId, 'members')));
  const uid = auth.currentUser && auth.currentUser.uid;
  const me = list.find(m => m.id === uid);
  const readable = new Set(me && me.role === 'director' ? list.map(m => m.id) : me ? [uid] : []);
  const readStats = async m => {
    if (!readable.has(m.id)) return null;
    try {
      const snap = await fs.getDoc(statsRef(fs, db, bandId, m.id));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      if (isDenied(e)) return null; // p. ej. justo después de un traspaso de la dirección
      throw e;
    }
  };
  const stats = await Promise.all(list.map(readStats));
  return list.map((m, i) => memberWithStats(m, stats[i]));
}

// Sube mi actividad: a la ficha, lo que ve la banda (minutos recientes y nivel); a las estadísticas privadas, el resto.
// Las reglas dejan escribir las estadísticas una vez por minuto y subir 120 puntos cada vez: si aún no toca, solo se
// actualiza la ficha. En la misma escritura se borran de la ficha los datos que las versiones antiguas dejaban a la vista.
export async function publishActivity(band, summary, { today, extra = {}, now = Date.now() }) {
  const { db, fs } = await refs();
  const memberRef = fs.doc(db, 'bands', band.bandId, 'members', band.uid);
  const ref = statsRef(fs, db, band.bandId, band.uid);
  const legacy = Object.fromEntries(LEGACY_SHARED_KEYS.map(k => [k, fs.deleteField()]));
  const shared = { ...sharedActivity(summary, today), ...extra, ...legacy };
  const prevSnap = await fs.getDoc(ref);
  const prev = prevSnap.exists() ? prevSnap.data() : null;
  if (prev && !statsDue(prev, now)) { await fs.setDoc(memberRef, shared, { merge: true }); return; }
  // La primera vez se parte de los puntos que la ficha antigua tenía a la vista (las reglas lo comprueban igual)
  const before = prev ? prev.points || 0 : ((await fs.getDoc(memberRef)).data() || {}).points || 0;
  const batch = fs.writeBatch(db);
  batch.set(ref, { ...privateActivity(summary), points: cappedPoints(summary.points, before), at: fs.serverTimestamp() });
  batch.set(memberRef, shared, { merge: true });
  try {
    await batch.commit();
  } catch (e) {
    // Con el reloj del móvil adelantado puede no haber pasado el minuto para el servidor: se sube al menos la ficha
    if (!prev || !isDenied(e)) throw e;
    await fs.setDoc(memberRef, shared, { merge: true });
  }
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

// Director: todo el progreso. Jefe de cuerda: el de su instrumento. Músico: solo el suyo.
export async function listProgress(band) {
  const { db, fs } = await refs();
  const col = fs.collection(db, 'bands', band.bandId, 'progress');
  if (band.role === 'director') return rows(await fs.getDocs(col));
  const mine = rows(await fs.getDocs(fs.query(col, fs.where('uid', '==', band.uid))));
  if (band.role !== 'leader') return mine;
  const section = rows(await fs.getDocs(fs.query(col, fs.where('instrument', '==', band.instrument))));
  return [...mine, ...section.filter(p => p.uid !== band.uid)];
}

// ---------- Banda: documento, agenda, avisos y premios ----------
export async function getBand(bandId) {
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'bands', bandId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateBand(bandId, patch) {
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'bands', bandId), patch, { merge: true });
}

const SUBCOLLECTIONS = ['events', 'notices', 'rewards', 'library'];

export async function listSub(bandId, name) {
  if (!SUBCOLLECTIONS.includes(name)) throw new Error('Colección desconocida');
  const { db, fs } = await refs();
  return rows(await fs.getDocs(fs.collection(db, 'bands', bandId, name)));
}

export async function addSub(bandId, name, data) {
  const { db, fs } = await refs();
  return fs.addDoc(fs.collection(db, 'bands', bandId, name), { ...data, at: fs.serverTimestamp() });
}

export async function deleteSub(bandId, name, id) {
  const { db, fs } = await refs();
  await fs.deleteDoc(fs.doc(db, 'bands', bandId, name, id));
}

// El director cambia la voz o el papel (músico / jefe de cuerda) de alguien
export async function updateMember(bandId, uid, patch) {
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'bands', bandId, 'members', uid), patch, { merge: true });
}

// El director quita a un músico de la banda (puede volver a unirse con el código)
export async function removeMember(bandId, uid) {
  const { db, fs } = await refs();
  const batch = fs.writeBatch(db);
  batch.delete(statsRef(fs, db, bandId, uid));
  batch.delete(fs.doc(db, 'bands', bandId, 'members', uid));
  await batch.commit();
}

// Sello y comentario del director en el progreso de un músico
export async function stampProgress(bandId, docId, { stamp, comment }) {
  const { db, fs } = await refs();
  await fs.setDoc(fs.doc(db, 'bands', bandId, 'progress', docId), { stamp: !!stamp, comment: comment || '', stampAt: Date.now() }, { merge: true });
}

// ¿La tarea se considera hecha? Vale el modo pedido o uno más exigente, con las estrellas mínimas.
export function taskDone(task, byMode) {
  return Object.entries(byMode || {}).some(([mode, stars]) => MODE_RANK[mode] >= MODE_RANK[task.mode] && stars >= task.minStars);
}

// En un pasaje, la tarea está hecha cuando sale al 100 % del tempo con las estrellas pedidas
export function passageDone(task, passageBest) {
  return !!task.passage && passageBest >= 1;
}

export async function reportProgress(band, task, { mode, stars, accuracy, minutes, passageSpeed = null }) {
  const { db, fs } = await refs();
  const ref = fs.doc(db, 'bands', band.bandId, 'progress', `${task.id}_${band.uid}`);
  const prev = (await fs.getDoc(ref)).data() || {};
  const byMode = { ...(prev.byMode || {}), [mode]: Math.max(prev.byMode?.[mode] || 0, stars) };
  const passageBest = passageSpeed !== null && stars >= task.minStars ? Math.max(prev.passageBest || 0, passageSpeed) : prev.passageBest || 0;
  await fs.setDoc(ref, {
    taskId: task.id, uid: band.uid, nickname: band.nickname, instrument: band.instrument || null,
    bestStars: Math.max(prev.bestStars || 0, stars), bestAccuracy: Math.max(prev.bestAccuracy || 0, accuracy ?? 0),
    attempts: (prev.attempts || 0) + 1, minutes: Math.round(((prev.minutes || 0) + minutes) * 10) / 10,
    byMode, passageBest, completed: task.passage ? passageDone(task, passageBest) : taskDone(task, byMode), lastAt: fs.serverTimestamp(),
    history: [...(prev.history || []), { at: Date.now(), stars, accuracy: accuracy ?? 0, mode }].slice(-30),
  }, { merge: true });
}

// Partitura que se guarda en la nube, comprimida (cabe una obra completa con todas sus voces en una tarea)
const SONG_TEXT_MAX = 200;
export function songPayload(song, extra = {}) {
  // Las reglas limitan título y autor a 200 caracteres; un MusicXML puede traer textos más largos
  return { title: String(song.title || '').slice(0, SONG_TEXT_MAX), by: String(song.by || '').slice(0, SONG_TEXT_MAX), key: song.key, time: song.time, bpm: song.bpm, pickup: song.pickup || 0, enc: encodeScore(songScore(song)), ...extra };
}

// La partitura de una parte guardada (formato nuevo comprimido o antiguo)
export function payloadScore(part) {
  return part.enc ? decodeScore(part.enc) : part.parsed;
}

const partKey = (instrument, voice) => (voice ? `${instrument}#${voice}` : instrument);

// La partichela que toca a un músico: la de su instrumento y voz, la de su instrumento o la general
export function taskPartFor(task, member) {
  const parts = task.parts || {};
  return parts[partKey(member.instrument, member.voice)] || parts[member.instrument] || parts.all || null;
}

// ¿Esta tarea es para mí? (por instrumento, por instrumento y voz, o por músico)
export function assignedTo(task, member) {
  const a = task.assign || { type: 'all' };
  const uid = member.uid || member.id;
  if (a.type === 'instruments') return (a.instruments || []).some(x => x === member.instrument || x === partKey(member.instrument, member.voice));
  if (a.type === 'members') return (a.members || []).includes(uid);
  return true;
}

export { partKey };

export const millis = toMillis;

// La partichela escrita para el instrumento del músico. part.transpose dice cómo suena lo escrito en la parte
// (0 en las obras del repertorio, que están en sonido real); el músico la lee transportada a su instrumento
// y en la octava que le resulta cómoda, para que toda la banda suene al unísono.
export function partFor(part, instId) {
  const inst = instrumentById(instId);
  const delta = inst.rhythmOnly || part.percussion ? 0 : (part.transpose || 0) - inst.transpose;
  const { score, key } = transposeScore(payloadScore(part), part.key || 'C', delta);
  const shift = octaveShiftFor({ parsed: score }, inst) ?? 0;
  const parsed = shift ? { ...score, notes: score.notes.map(n => (n.rest ? n : { ...n, midi: n.midi + shift, oct: n.oct + shift / 12 })) } : score;
  return { key, parsed };
}
