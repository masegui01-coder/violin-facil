// Firebase simulado para las pruebas de extremo a extremo: se sirven en lugar de www.gstatic.com/firebasejs/… unos
// módulos con la misma API que usa la app (app, auth y firestore). Los datos viven en un Map de Node compartido por
// todas las páginas de la prueba (profesor y alumno ven la misma «nube»). Las reglas NO se simulan (ver tests/aula-rules).
const SDK_PREFIX = 'https://www.gstatic.com/firebasejs/';

export function createStore(seed = {}) {
  const docs = new Map(Object.entries(seed));
  const now = () => ({ __ts: Date.now() });
  const resolve = (value, prev) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.__op === 'ts') return now();
      if (value.__op === 'inc') return (typeof prev === 'number' ? prev : 0) + value.n;
      if (value.__op === 'del') return undefined;
      if ('__ts' in value) return value;
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, prev && prev[k])]).filter(([, v]) => v !== undefined));
    }
    return value;
  };
  const merge = (prev, patch, dotted) => {
    const out = { ...(prev || {}) };
    Object.entries(patch).forEach(([k, v]) => {
      const path = dotted ? k.split('.') : [k];
      let box = out;
      path.slice(0, -1).forEach(p => { box[p] = { ...(box[p] || {}) }; box = box[p]; });
      const last = path[path.length - 1];
      const next = resolve(v, box[last]);
      if (next === undefined) delete box[last]; else box[last] = next;
    });
    return out;
  };
  const write = ({ type, path, data, merge: m }) => {
    if (type === 'delete') { docs.delete(path); return; }
    if (type === 'update') {
      if (!docs.has(path)) throw Object.assign(new Error('not-found'), { code: 'not-found' });
      docs.set(path, merge(docs.get(path), data, true));
      return;
    }
    docs.set(path, m ? merge(docs.get(path), data, false) : resolve(data));
  };
  const denied = path => path.startsWith('adminData/');
  const ops = {
    get: ({ path }) => {
      if (denied(path)) throw Object.assign(new Error('permission-denied'), { code: 'permission-denied' });
      return docs.has(path) ? { exists: true, data: docs.get(path) } : { exists: false };
    },
    list: ({ path, filters = [], limit = null }) => {
      const depth = path.split('/').length + 1;
      let rows = [...docs.entries()].filter(([p]) => p.startsWith(path + '/') && p.split('/').length === depth)
        .map(([p, data]) => ({ path: p, data }))
        .filter(r => filters.every(f => f.op !== '==' || r.data[f.f] === f.v));
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    write: op => { write(op); return null; },
    batch: ({ ops: list }) => { list.forEach(write); return null; },
  };
  return {
    docs,
    handle(json) {
      const req = JSON.parse(json);
      try { return JSON.stringify({ ok: ops[req.op](req) }); } catch (e) { return JSON.stringify({ error: { code: e.code || 'unknown', message: e.message } }); }
    },
  };
}

const APP = 'export function initializeApp(config) { return { options: config }; }';

// Usuario con cuenta (no anónimo) que la prueba fija en window.__FAKE_USER
const AUTH = `
const listeners = new Set();
export const indexedDBLocalPersistence = {}, browserLocalPersistence = {}, browserSessionPersistence = {};
export class browserPopupRedirectResolver { _initialize() { return Promise.resolve(); } }
export class GoogleAuthProvider {}
export const EmailAuthProvider = { credential: () => ({}) };
const withMeta = u => u && { ...u, metadata: { lastSignInTime: new Date().toUTCString() }, getIdToken: async () => 'fake', reload: async () => {} };
export function initializeAuth() { return { currentUser: withMeta(window.__FAKE_USER || null) }; }
export function onAuthStateChanged(auth, cb) { listeners.add(cb); setTimeout(() => cb(auth.currentUser), 0); return () => listeners.delete(cb); }
export async function signInAnonymously(auth) { auth.currentUser = withMeta({ uid: 'anon-' + Math.random().toString(36).slice(2), isAnonymous: true }); listeners.forEach(cb => cb(auth.currentUser)); return { user: auth.currentUser }; }
export async function getRedirectResult() { return null; }
export async function signOut(auth) { auth.currentUser = null; listeners.forEach(cb => cb(null)); }
export async function updateProfile() {}
const unsupported = async () => { throw Object.assign(new Error('unsupported in tests'), { code: 'auth/operation-not-allowed' }); };
export const signInWithPopup = unsupported, linkWithPopup = unsupported, reauthenticateWithPopup = unsupported, signInWithRedirect = unsupported,
  linkWithRedirect = unsupported, reauthenticateWithRedirect = unsupported, signInWithEmailAndPassword = unsupported, createUserWithEmailAndPassword = unsupported,
  signInWithCredential = unsupported, linkWithCredential = unsupported, reauthenticateWithCredential = unsupported, sendPasswordResetEmail = unsupported, deleteUser = unsupported;
`;

const FIRESTORE = `
const revive = v => {
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === 'object') {
    if ('__ts' in v) { const ms = v.__ts; return { seconds: Math.floor(ms / 1000), toMillis: () => ms, toDate: () => new Date(ms) }; }
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revive(x)]));
  }
  return v;
};
const plain = v => {
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') {
    if (typeof v.toMillis === 'function') return { __ts: v.toMillis() };
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, plain(x)]));
  }
  return v;
};
async function call(op, args) {
  const res = JSON.parse(await window.__fakeFs(JSON.stringify({ op, ...args })));
  if (res.error) throw Object.assign(new Error(res.error.message), { code: res.error.code });
  return res.ok;
}
const autoId = () => Array.from({ length: 20 }, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]).join('');
class DocumentReference { constructor(path) { this.type = 'document'; this.path = path; this.id = path.split('/').pop(); } get parent() { return new CollectionReference(this.path.split('/').slice(0, -1).join('/')); } }
class CollectionReference { constructor(path) { this.type = 'collection'; this.path = path; this.id = path.split('/').pop(); } get parent() { const p = this.path.split('/'); return p.length > 1 ? new DocumentReference(p.slice(0, -1).join('/')) : null; } }
const join = parts => parts.map(p => (typeof p === 'string' ? p : p.path)).join('/');
export function getFirestore() { return { type: 'firestore' }; }
export function collection(db, ...parts) { return new CollectionReference(join(db && db.path ? [db, ...parts] : parts)); }
export function doc(a, ...parts) {
  if (a instanceof CollectionReference) return new DocumentReference(a.path + '/' + (parts[0] || autoId()));
  return new DocumentReference(join(a && a.path ? [a, ...parts] : parts));
}
export const where = (f, op, v) => ({ kind: 'where', f, op, v });
export const orderBy = (f, dir = 'asc') => ({ kind: 'orderBy', f, dir });
export const limit = n => ({ kind: 'limit', n });
export function query(col, ...cs) { return { type: 'query', path: col.path, filters: cs.filter(c => c.kind === 'where'), order: cs.find(c => c.kind === 'orderBy'), limit: (cs.find(c => c.kind === 'limit') || {}).n || null }; }
export const serverTimestamp = () => ({ __op: 'ts' });
export const increment = n => ({ __op: 'inc', n });
export const deleteField = () => ({ __op: 'del' });
const snap = (ref, exists, data) => ({ id: ref.id, ref, exists: () => exists, data: () => (exists ? revive(data) : undefined), get: k => (exists ? revive(data)[k] : undefined) });
export async function getDoc(ref) { const r = await call('get', { path: ref.path }); return snap(ref, r.exists, r.data); }
export async function getDocs(q) {
  const rows = await call('list', { path: q.path, filters: q.filters || [], limit: q.limit || null });
  let docs = rows.map(r => snap(new DocumentReference(r.path), true, r.data));
  if (q.order) docs = docs.sort((a, b) => { const x = a.data()[q.order.f], y = b.data()[q.order.f]; const d = (x > y) - (x < y); return q.order.dir === 'desc' ? -d : d; });
  return { docs, size: docs.length, empty: !docs.length, forEach: fn => docs.forEach(fn) };
}
export async function setDoc(ref, data, opts = {}) { await call('write', { type: 'set', path: ref.path, data: plain(data), merge: !!opts.merge }); }
export async function updateDoc(ref, data) { await call('write', { type: 'update', path: ref.path, data: plain(data) }); }
export async function deleteDoc(ref) { await call('write', { type: 'delete', path: ref.path }); }
export async function addDoc(col, data) { const ref = doc(col); await setDoc(ref, data); return ref; }
export function writeBatch() {
  const ops = [];
  const b = {
    set(ref, data, opts = {}) { ops.push({ type: 'set', path: ref.path, data: plain(data), merge: !!opts.merge }); return b; },
    update(ref, data) { ops.push({ type: 'update', path: ref.path, data: plain(data) }); return b; },
    delete(ref) { ops.push({ type: 'delete', path: ref.path }); return b; },
    commit() { return call('batch', { ops }); },
  };
  return b;
}
`;

const MODULES = { 'firebase-app.js': APP, 'firebase-auth.js': AUTH, 'firebase-firestore.js': FIRESTORE };

// Antes de page.goto: los módulos simulados, el puente con la «nube» y el usuario de la página
export async function installFakeFirebase(page, store, user) {
  await page.exposeFunction('__fakeFs', json => store.handle(json));
  await page.evaluateOnNewDocument(u => { window.__FAKE_USER = u; }, user);
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (!url.startsWith(SDK_PREFIX)) { req.continue(); return; }
    const name = url.split('/').pop();
    req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'access-control-allow-origin': '*' }, body: MODULES[name] || 'export {};' });
  });
}
