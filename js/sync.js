// Progreso en la nube: con cuenta, el estado de la app se guarda en Firestore (users/{uid}) y se recupera en
// cualquier dispositivo. Además cada tester deja un resumen (testers/{uid}) que solo ve el administrador.
import { featuresFromState } from './test-coverage.js';
import { getCloud } from './cloud.js';
import { levelFor } from './rewards.js';
import { instrumentById } from './instruments.js';
import { weekId } from './engage.js';
import { deleteTrack } from './groups-api.js';

const LOCAL_ONLY = ['recordings', 'importedSongs', 'proTester', 'adminUser', 'tester']; // grabaciones y partituras pueden ser grandes; el rol depende de la cuenta
const MAX_DOC_CHARS = 900000;                      // Firestore admite 1 MB por documento
const PUSH_DELAY_MS = 4000;

export function syncableState(state) {
  const out = Object.fromEntries(Object.entries(state).filter(([k]) => !LOCAL_ONLY.includes(k)));
  if (JSON.stringify(out).length > MAX_DOC_CHARS) return { ...out, errors: {}, history: {} };
  return out;
}

const progressScore = s => (s ? (s.lessonsPlayed || 0) * 1000 + (s.xp || 0) : -1);

// Al entrar: si la nube tiene más progreso que este dispositivo, se usa la nube; si no, se sube lo de aquí
export function chooseState(local, cloud) {
  if (!cloud) return 'upload';
  return progressScore(cloud) > progressScore(local) ? 'download' : 'upload';
}

function platform() {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'Mac' : 'Otro';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Otro';
  return `${os} · ${browser}`;
}

// Resumen de un tester para el panel del administrador
export function testerSummary(state, account, now = Date.now()) {
  const days = Object.keys(state.practiceLog || {}).filter(d => state.practiceLog[d] > 0).sort();
  const minutes = Object.values(state.practiceLog || {}).reduce((a, b) => a + b, 0);
  const used = new Set(Object.keys(state.progress || {}).map(k => (/^[a-z-]+:(lesson|song):/.test(k) ? k.split(':')[0] : 'violin')));
  return {
    name: String(account.displayName || state.nickname || (account.email || '').split('@')[0] || 'Sin nombre').slice(0, 60),
    email: account.email || '', instrument: state.instrument, instruments: [...used].map(id => instrumentById(id).name),
    xp: state.xp || 0, level: levelFor(state.xp || 0).name, lessons: state.lessonsPlayed || 0,
    minutes: Math.round(minutes), daysPracticed: days.length, firstDay: days[0] || null, lastPractice: days[days.length - 1] || null,
    streak: (state.streak && state.streak.count) || 0, badges: (state.badges || []).length,
    features: featuresFromState(state), instrumentIds: [...used],
    band: state.band ? `${state.band.name} (${state.band.role === 'director' ? 'director' : 'músico'})` : '',
    platform: typeof navigator === 'undefined' ? '' : platform(),
    createdAt: account.metadata && account.metadata.creationTime ? Date.parse(account.metadata.creationTime) : now,
    lastSeen: now,
  };
}

let timer = 0;
let active = null; // { uid, account, getState }

async function push() {
  if (!active) return;
  const { db, fs } = await getCloud();
  const state = active.getState();
  await Promise.all([
    fs.setDoc(fs.doc(db, 'users', active.uid), { state: syncableState(state), savedAt: Date.now() }),
    fs.setDoc(fs.doc(db, 'testers', active.uid), testerSummary(state, active.account)),
  ]);
}

export function schedulePush() {
  if (!active) return;
  clearTimeout(timer);
  timer = setTimeout(() => push().catch(() => {}), PUSH_DELAY_MS);
}

export function flushPush() {
  if (!active) return Promise.resolve();
  clearTimeout(timer);
  return push().catch(() => {});
}

// Empieza a sincronizar: baja o sube el progreso y desde entonces guarda cada cambio
export async function startSync(account, { getState, replaceState }) {
  const { db, fs } = await getCloud();
  const snap = await fs.getDoc(fs.doc(db, 'users', account.uid));
  const cloud = snap.exists() ? snap.data().state : null;
  const local = getState();
  const decision = chooseState(local, cloud);
  if (decision === 'download') replaceState({ ...cloud, recordings: local.recordings || [], importedSongs: local.importedSongs || [] });
  active = { uid: account.uid, account, getState };
  await push();
  return decision;
}

// Si la primera sincronización falla, se deja preparada igualmente para reintentar en el siguiente cambio
export function armSync(account, getState) {
  if (!active) active = { uid: account.uid, account, getState };
}

export function stopSync() {
  clearTimeout(timer);
  active = null;
}

// Administrador según el servidor (no hay correos en el cliente): admins/{uid} existe o, si no, las reglas le dejan
// leer adminData/probe (respaldo por el uid del dueño en firestore.rules). Se recuerda por uid durante la sesión.
const adminCache = new Map();
export async function isAdmin(uid) {
  if (!uid) return false;
  if (!adminCache.has(uid)) adminCache.set(uid, checkAdmin(uid));
  return adminCache.get(uid);
}

async function checkAdmin(uid) {
  try {
    const { db, fs } = await getCloud();
    if ((await fs.getDoc(fs.doc(db, 'admins', uid))).exists()) return true;
    await fs.getDoc(fs.doc(db, 'adminData', 'probe')); // sin permiso lanza «permission-denied»
    return true;
  } catch (e) {
    if (!String(e && e.code).includes('permission')) adminCache.delete(uid); // un fallo de red se reintenta la próxima vez
    return false;
  }
}

export async function listTesters() {
  const { db, fs } = await getCloud();
  const snap = await fs.getDocs(fs.collection(db, 'testers'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.lastSeen - a.lastSeen);
}


// ---------- Borrar la cuenta ----------
// Se borra todo lo que el usuario puede localizar con su propio estado (sin consultas collectionGroup ni Cloud Functions,
// que exigirían el plan Blaze). Las reglas solo lo permiten con la sesión activa: se hace ANTES de borrar el usuario.
const PREFIXED_KEY = /^([a-z-]+):((?:lesson|song):.*)$/;
const CHALLENGE_KEY = /^lesson:reto-([A-Z2-9]{6})$/;
const SAFE_ID = /^[\w-]+$/; // un id con «/» rompería la ruta del documento

const splitKey = key => { const m = key.match(PREFIXED_KEY); return m ? { inst: m[1], rest: m[2] } : { inst: 'violin', rest: key }; };
const uniquePaths = paths => [...new Map(paths.map(p => [p.join('/'), p])).values()];

// Clasificaciones donde puede haber un resultado suyo: liga semanal (semanas en que practicó), reto del día,
// canciones del repertorio y retos jugados (de las claves del progreso). Sin apodo público nunca publicó nada.
export function ownedResultPaths(state, now = new Date()) {
  if (!state || !state.publicName) return [];
  const keys = Object.keys(state.progress || {}).map(splitKey);
  const insts = [...new Set([state.instrument || 'violin', ...keys.map(k => k.inst)])];
  const weeks = new Set([weekId(now), ...Object.keys(state.practiceLog || {}).map(d => weekId(new Date(`${d}T12:00`)))]);
  const paths = [
    ...[...weeks].flatMap(w => insts.map(i => ['leagues', `${w}_${i}`])),
    ...Object.keys(state.dailyDone || {}).flatMap(d => insts.map(i => ['daily', `${d}_${i}`])),
    ...keys.filter(k => k.rest.startsWith('song:')).map(k => ['boards', `${k.rest.slice(5)}_${k.inst}`]),
    ...keys.map(k => k.rest.match(CHALLENGE_KEY)).filter(Boolean).map(m => ['challenges', m[1]]),
  ];
  return uniquePaths(paths.filter(p => SAFE_ID.test(p[1])));
}

// Quita la nota de un músico de cada parte de la canción (null si no había ninguna suya)
export function sectionsWithoutNotes(sections, uid) {
  const list = sections || [];
  if (!list.some(s => s.notes && uid in s.notes)) return null;
  return list.map(s => {
    if (!s.notes || !(uid in s.notes)) return s;
    const { [uid]: _mine, ...notes } = s.notes;
    return { ...s, notes };
  });
}

const NETWORK_CODES = ['unavailable', 'network', 'deadline-exceeded'];
export const isNetworkFailure = f => NETWORK_CODES.some(c => String(f && f.code).includes(c));

// Cada paso anota sus fallos en vez de cortar el resto; al final se devuelven todos
function deleter(db, fs) {
  const failed = [];
  const run = async (label, fn) => {
    try { return await fn(); } catch (e) { failed.push({ label, code: String((e && e.code) || (e && e.message) || e) }); return null; }
  };
  const del = ref => run(ref.path, () => fs.deleteDoc(ref));
  const docs = async (label, q) => ((await run(label, () => fs.getDocs(q))) || { docs: [] }).docs;
  return { db, fs, failed, run, del, docs };
}

// Amigos: mis reacciones en sus muros (mientras aún somos amigos), la amistad en los dos sentidos y lo mío
async function deleteFriendsData(d, uid) {
  const { db, fs } = d;
  const friends = await d.docs('friends', fs.collection(db, 'friends', uid, 'list'));
  await Promise.all(friends.map(async f => {
    const events = await d.docs(`activity/${f.id}`, fs.collection(db, 'activity', f.id, 'events'));
    await Promise.all(events.filter(e => (e.data().reactions || {})[uid] !== undefined)
      .map(e => d.run(e.ref.path, () => fs.updateDoc(e.ref, { [`reactions.${uid}`]: fs.deleteField() }))));
    await Promise.all([d.del(f.ref), d.del(fs.doc(db, 'friends', f.id, 'list', uid))]);
  }));
  const mine = await Promise.all([['activity', uid, 'events'], ['inbox', uid, 'items'], ['requests', uid, 'in']]
    .map(path => d.docs(path.join('/'), fs.collection(db, ...path))));
  await Promise.all(mine.flat().map(x => d.del(x.ref)));
}

// Resultados en clasificaciones y los retos y partituras que compartió
async function deleteSocialData(d, uid, state) {
  const { db, fs } = d;
  await Promise.all(ownedResultPaths(state).map(p => d.del(fs.doc(db, ...p, 'results', uid))));
  const owned = await Promise.all(['challenges', 'sharedScores']
    .map(c => d.docs(c, fs.query(fs.collection(db, c), fs.where('ownerUid', '==', uid)))));
  await Promise.all(owned.flat().map(x => d.del(x.ref)));
}

// Banda: su progreso en cada tarea, sus estadísticas privadas y su ficha. La banda que dirige se queda (es de todos sus músicos).
async function deleteBandData(d, uid, band) {
  if (!band || !band.bandId) return;
  const { db, fs } = d;
  const progress = await d.docs('band progress', fs.query(fs.collection(db, 'bands', band.bandId, 'progress'), fs.where('uid', '==', uid)));
  await Promise.all(progress.map(x => d.del(x.ref)));
  await d.del(fs.doc(db, 'bands', band.bandId, 'members', uid, 'private', 'stats'));
  await d.del(fs.doc(db, 'bands', band.bandId, 'members', uid));
}

// Grupos: sus pistas (y la maqueta si la subió él), sus apuntes en las partes y su ficha
async function deleteGroupData(d, uid, group) {
  const { db, fs } = d;
  const gid = group.groupId;
  const songs = await d.docs(`groups/${gid}/songs`, fs.collection(db, 'groups', gid, 'songs'));
  await Promise.all(songs.map(async snap => {
    const song = snap.data();
    const tracks = Object.entries(song.parts || {}).filter(([tid, p]) => tid === uid || (tid === 'demo' && p && p.by === uid)).map(([tid]) => tid);
    for (const tid of tracks) await d.run(`${snap.ref.path}/tracks/${tid}`, () => deleteTrack(gid, snap.id, tid));
    const sections = sectionsWithoutNotes(song.sections, uid);
    if (sections) await d.run(snap.ref.path, () => fs.updateDoc(snap.ref, { sections, updatedAt: fs.serverTimestamp() }));
  }));
  await d.del(fs.doc(db, 'groups', gid, 'members', uid));
}

// Escuela (alumno): ficha, resumen del libro y un alumno menos, de una vez. La escuela del profesor se queda.
async function deleteSchoolData(d, uid, school) {
  if (!school || !school.schoolId || school.role === 'teacher') return;
  const { db, fs } = d;
  const member = fs.doc(db, 'schools', school.schoolId, 'members', uid);
  const exists = await d.run(member.path, async () => (await fs.getDoc(member)).exists());
  if (!exists) { await d.del(fs.doc(db, 'schools', school.schoolId, 'progress', uid)); return; }
  const schoolRef = fs.doc(db, 'schools', school.schoolId);
  const schoolExists = await d.run(schoolRef.path, async () => (await fs.getDoc(schoolRef)).exists());
  const batch = fs.writeBatch(db);
  batch.delete(member);
  batch.delete(fs.doc(db, 'schools', school.schoolId, 'progress', uid));
  if (schoolExists !== false) batch.update(schoolRef, { students: fs.increment(-1) }); // sin escuela no hay contador
  await d.run(`schools/${school.schoolId}`, () => batch.commit());
}

// Aula Pro (alumno): en cada clase, su ficha y su resumen con una plaza menos, y los comentarios a sus entregas
async function deleteAulaData(d, uid, aula) {
  const { db, fs } = d;
  await Promise.all(((aula && aula.classes) || []).filter(c => c && c.sid && c.cid).map(async c => {
    // Sus composiciones y los comentarios a sus entregas van en la MISMA escritura que su ficha (las reglas lo exigen)
    const own = (await Promise.all(['feedback', 'works'].map(n => d.docs(`classes/${c.cid}/${n}`,
      fs.query(fs.collection(db, 'schools', c.sid, 'classes', c.cid, n), fs.where('uid', '==', uid)))))).flat();
    const student = fs.doc(db, 'schools', c.sid, 'classes', c.cid, 'students', uid);
    const exists = await d.run(student.path, async () => (await fs.getDoc(student)).exists());
    const classRef = fs.doc(db, 'schools', c.sid, 'classes', c.cid);
    const batch = fs.writeBatch(db);
    own.forEach(x => batch.delete(x.ref));
    batch.delete(fs.doc(db, 'schools', c.sid, 'classes', c.cid, 'summaries', uid));
    if (exists) {
      batch.delete(student);
      if (await d.run(classRef.path, async () => (await fs.getDoc(classRef)).exists()) !== false) batch.update(classRef, { students: fs.increment(-1) });
    }
    await d.run(`classes/${c.cid}`, () => batch.commit());
  }));
}

// Devuelve los documentos que no se han podido borrar ([] si todo ha ido bien)
export async function deleteCloudData(uid, state = {}) {
  const { db, fs } = await getCloud();
  stopSync();
  const d = deleter(db, fs);
  const profile = await d.run(`profiles/${uid}`, () => fs.getDoc(fs.doc(db, 'profiles', uid)));
  const code = profile && profile.exists() ? profile.data().code : null;
  await Promise.all([
    deleteFriendsData(d, uid),
    deleteSocialData(d, uid, state),
    deleteBandData(d, uid, state.band),
    ...(state.groups || []).filter(g => g && g.groupId).map(g => deleteGroupData(d, uid, g)),
    deleteSchoolData(d, uid, state.school),
    deleteAulaData(d, uid, state.aula),
  ]);
  await Promise.all([
    code ? d.del(fs.doc(db, 'friendCodes', code)) : null,
    ...['profiles', 'users', 'testers', 'roles'].map(c => d.del(fs.doc(db, c, uid))),
  ]);
  return d.failed;
}

// Firebase solo deja borrar el usuario si entró hace menos de 5 minutos: con margen para borrar antes los datos
const RECENT_LOGIN_MS = 4 * 60000;
export function signedInRecently(user, now = Date.now()) {
  const at = Date.parse(user && user.metadata && user.metadata.lastSignInTime);
  return Number.isFinite(at) && now - at >= 0 && now - at < RECENT_LOGIN_MS;
}
