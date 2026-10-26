// Progreso en la nube: con cuenta, el estado de la app se guarda en Firestore (users/{uid}) y se recupera en
// cualquier dispositivo. Además cada tester deja un resumen (testers/{uid}) que solo ve el administrador.
import { featuresFromState } from './test-coverage.js';
import { getCloud } from './cloud.js';
import { levelFor } from './rewards.js';
import { instrumentById } from './instruments.js';

const LOCAL_ONLY = ['recordings', 'importedSongs', 'proTester']; // grabaciones y partituras pueden ser grandes; el rol depende de la cuenta
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

export async function isAdmin(uid) {
  const { db, fs } = await getCloud();
  try { return (await fs.getDoc(fs.doc(db, 'admins', uid))).exists(); } catch (e) { return false; }
}

export async function listTesters() {
  const { db, fs } = await getCloud();
  const snap = await fs.getDocs(fs.collection(db, 'testers'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.lastSeen - a.lastSeen);
}

// Borrar la cuenta: primero los datos (las reglas solo lo permiten con la sesión activa), después el usuario
export async function deleteCloudData(uid) {
  const { db, fs } = await getCloud();
  stopSync();
  const del = ref => fs.deleteDoc(ref).catch(() => {});
  const all = async path => (await fs.getDocs(fs.collection(db, ...path)).catch(() => ({ docs: [] }))).docs;
  const profile = await fs.getDoc(fs.doc(db, 'profiles', uid)).catch(() => null);
  const code = profile && profile.exists() ? profile.data().code : null;
  const friends = await all(['friends', uid, 'list']);
  await Promise.all([
    ...friends.flatMap(f => [del(f.ref), del(fs.doc(db, 'friends', f.id, 'list', uid))]),
    ...(await all(['activity', uid, 'events'])).map(d => del(d.ref)),
    ...(await all(['inbox', uid, 'items'])).map(d => del(d.ref)),
    ...(await all(['requests', uid, 'in'])).map(d => del(d.ref)),
    code ? del(fs.doc(db, 'friendCodes', code)) : null,
    del(fs.doc(db, 'profiles', uid)), del(fs.doc(db, 'users', uid)), del(fs.doc(db, 'testers', uid)),
  ]);
}
