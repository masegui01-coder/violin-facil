// Amigos: código de amigo, solicitudes (hay que aceptarlas), perfil y muro visibles solo para amigos, reacciones
// predefinidas (sin texto libre: la app la usan niños) y avisos dentro de la app. Todo en Firestore.
import { getCloud, randomCode } from './cloud.js';
import { levelFor } from './rewards.js';
import { BADGES, weekId } from './engage.js';
import { chordLabel } from './chords.js';

export const REACTIONS = ['👏', '❤️', '🔥'];
const FEED_PER_FRIEND = 10;
const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];
const MAX_CODE_TRIES = 5;
const MAX_WALL = 30;       // el muro guarda solo las últimas publicaciones (plan gratuito de Firebase)

const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs, uid: c.auth.currentUser && c.auth.currentUser.uid }; };
const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
export const millis = t => (t && t.toMillis ? t.toMillis() : t || 0);

// ---------- Lógica pura (probada) ----------
// Minutos de la semana actual (lunes a domingo)
export function weekMinutes(practiceLog, now = new Date()) {
  const wk = weekId(now);
  return Math.round(Object.entries(practiceLog || {}).filter(([d]) => weekId(new Date(d + 'T12:00')) === wk).reduce((s, [, m]) => s + m, 0));
}

// Qué ha pasado que merezca salir en el muro, comparando el estado antes y después
export function eventsFromChange(prev, next, nom = 'eu') {
  if (!prev || !next) return [];
  const out = [];
  (next.badges || []).filter(b => !(prev.badges || []).includes(b)).forEach(id => {
    const badge = BADGES.find(b => b.id === id);
    if (badge) out.push({ type: 'badge', icon: '🏅', text: `ha conseguido la insignia «${badge.name}»` });
  });
  const before = levelFor(prev.xp || 0), after = levelFor(next.xp || 0);
  if (after.index > before.index) out.push({ type: 'level', icon: '⭐', text: `ha subido al nivel ${after.name}` });
  const s0 = (prev.streak && prev.streak.count) || 0, s1 = (next.streak && next.streak.count) || 0;
  const milestone = STREAK_MILESTONES.filter(m => s0 < m && s1 >= m).pop();
  if (milestone) out.push({ type: 'streak', icon: '🔥', text: `lleva ${milestone} días seguidos practicando` });
  Object.entries(next.chordsKnown || {}).forEach(([inst, list]) => {
    const fresh = list.filter(c => !((prev.chordsKnown || {})[inst] || []).includes(c));
    if (fresh.length) out.push({ type: 'chords', icon: '🎸', text: `ha aprendido ${fresh.length === 1 ? 'el acorde' : 'los acordes'} ${fresh.map(c => chordLabel(c, nom)).join(', ')}` });
  });
  return out;
}

// Clasificación de la semana entre amigos (y tú), por minutos de práctica
export function friendsWeekBoard(profiles, now = new Date()) {
  const wk = weekId(now);
  return profiles.map(p => ({ ...p, minutes: p.week === wk ? p.weekMinutes || 0 : 0 }))
    .sort((a, b) => b.minutes - a.minutes || (b.xp || 0) - (a.xp || 0));
}

export function timeAgo(ms, now = Date.now()) {
  const min = Math.round((now - ms) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

// ---------- Perfil y código ----------
export async function ensureFriendCode(name) {
  const { db, fs, uid } = await refs();
  const mine = await fs.getDoc(fs.doc(db, 'profiles', uid));
  if (mine.exists() && mine.data().code) return mine.data().code;
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const code = randomCode();
    try {
      await fs.setDoc(fs.doc(db, 'friendCodes', code), { uid, name });
      await fs.setDoc(fs.doc(db, 'profiles', uid), { code, name }, { merge: true });
      return code;
    } catch (e) { if (!String(e.code).includes('permission')) throw e; }
  }
  throw new Error('No he podido crear tu código. Inténtalo otra vez.');
}

export async function updateProfile(patch) {
  const { db, fs, uid } = await refs();
  if (!uid) return;
  await fs.setDoc(fs.doc(db, 'profiles', uid), { ...patch, lastActive: Date.now() }, { merge: true });
}

export async function getProfile(uid) {
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'profiles', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ---------- Solicitudes ----------
export async function sendRequest(code, me) {
  const { db, fs, uid } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'friendCodes', code.trim().toUpperCase()));
  if (!snap.exists()) throw new Error('No hay nadie con ese código. Revísalo.');
  const to = snap.data().uid;
  if (to === uid) throw new Error('Ese es tu propio código.');
  if ((await fs.getDoc(fs.doc(db, 'friends', uid, 'list', to))).exists()) throw new Error(`${snap.data().name} ya es tu amigo.`);
  await fs.setDoc(fs.doc(db, 'requests', to, 'in', uid), { fromName: me.name, fromInstrument: me.instrument || '', at: Date.now() });
  return snap.data().name;
}

export async function listRequests() {
  const { db, fs, uid } = await refs();
  return rows(await fs.getDocs(fs.collection(db, 'requests', uid, 'in'))).sort((a, b) => b.at - a.at);
}

// Aceptar crea la amistad en los dos sentidos y borra la solicitud, todo a la vez
export async function acceptRequest(req, myName) {
  const { db, fs, uid } = await refs();
  const batch = fs.writeBatch(db);
  batch.set(fs.doc(db, 'friends', uid, 'list', req.id), { name: req.fromName, since: Date.now() });
  batch.set(fs.doc(db, 'friends', req.id, 'list', uid), { name: myName, since: Date.now() });
  batch.delete(fs.doc(db, 'requests', uid, 'in', req.id));
  await batch.commit();
}

export async function declineRequest(req) {
  const { db, fs, uid } = await refs();
  await fs.deleteDoc(fs.doc(db, 'requests', uid, 'in', req.id));
}

export async function removeFriend(fid) {
  const { db, fs, uid } = await refs();
  const batch = fs.writeBatch(db);
  batch.delete(fs.doc(db, 'friends', uid, 'list', fid));
  batch.delete(fs.doc(db, 'friends', fid, 'list', uid));
  batch.delete(fs.doc(db, 'requests', uid, 'in', fid));
  batch.delete(fs.doc(db, 'requests', fid, 'in', uid));
  await batch.commit();
}

// ---------- Amigos, perfiles y muro ----------
export async function listFriends() {
  const { db, fs, uid } = await refs();
  const list = rows(await fs.getDocs(fs.collection(db, 'friends', uid, 'list')));
  const profiles = await Promise.all(list.map(f => getProfile(f.id).catch(() => null)));
  return list.map((f, i) => ({ ...f, ...(profiles[i] || {}), id: f.id, name: (profiles[i] && profiles[i].name) || f.name }));
}

export async function postEvent(event) {
  const { db, fs, uid } = await refs();
  if (!uid) return;
  const col = fs.collection(db, 'activity', uid, 'events');
  await fs.addDoc(col, { ...event, at: Date.now(), reactions: {} });
  // se borran las publicaciones más antiguas para no llenar la base de datos
  const snap = await fs.getDocs(fs.query(col, fs.orderBy('at', 'desc'), fs.limit(MAX_WALL + 10)));
  const old = snap.docs.slice(MAX_WALL);
  if (old.length) {
    const batch = fs.writeBatch(db);
    old.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function loadFeed(friends) {
  const { db, fs } = await refs();
  const lists = await Promise.all(friends.map(async f => {
    const q = fs.query(fs.collection(db, 'activity', f.id, 'events'), fs.orderBy('at', 'desc'), fs.limit(FEED_PER_FRIEND));
    try { return rows(await fs.getDocs(q)).map(e => ({ ...e, owner: f.id, ownerName: f.name, ownerInstrument: f.instrument })); } catch (e) { return []; }
  }));
  return lists.flat().sort((a, b) => b.at - a.at);
}

export async function myEvents() {
  const { db, fs, uid } = await refs();
  const q = fs.query(fs.collection(db, 'activity', uid, 'events'), fs.orderBy('at', 'desc'), fs.limit(FEED_PER_FRIEND));
  return rows(await fs.getDocs(q)).map(e => ({ ...e, owner: uid }));
}

// Reaccionar: cada uno solo cambia su propia reacción; el dueño recibe un aviso
export async function react(event, emoji, myName) {
  const { db, fs, uid } = await refs();
  const same = event.reactions && event.reactions[uid] === emoji;
  await fs.updateDoc(fs.doc(db, 'activity', event.owner, 'events', event.id), { [`reactions.${uid}`]: same ? fs.deleteField() : emoji });
  if (!same) await fs.addDoc(fs.collection(db, 'inbox', event.owner, 'items'), { kind: 'reaction', emoji, fromName: myName, text: event.text, at: Date.now() });
  return same ? null : emoji;
}

// Toque para animar a un amigo (sin texto libre)
export async function nudge(fid, myName, kind = 'cheer') {
  const { db, fs } = await refs();
  await fs.addDoc(fs.collection(db, 'inbox', fid, 'items'), { kind, emoji: kind === 'cheer' ? '💪' : '🎵', fromName: myName, at: Date.now() });
}

export async function readInbox() {
  const { db, fs, uid } = await refs();
  return rows(await fs.getDocs(fs.collection(db, 'inbox', uid, 'items'))).sort((a, b) => b.at - a.at);
}

export async function clearInbox(items) {
  const { db, fs, uid } = await refs();
  const batch = fs.writeBatch(db);
  items.forEach(i => batch.delete(fs.doc(db, 'inbox', uid, 'items', i.id)));
  await batch.commit();
}
