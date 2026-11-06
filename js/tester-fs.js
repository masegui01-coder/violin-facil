// Modo tester (usuarios con cuenta): una escuela de ejemplo que vive SOLO en este móvil. Mientras el modo tester está
// activo, aula-api.js usa este envoltorio de Firestore: todo lo que va a schools/<SANDBOX_SID>/… (y cualquier lote que lo
// toque, con sus códigos de clase) se lee y se escribe aquí, en el almacenamiento local; lo demás sigue yendo a la nube
// tal cual (así «Unirme a una clase de verdad» funciona). Sin modo tester, aula-api.js recibe el Firestore de siempre.
import { getState } from './store.js';

export const SANDBOX_SID = 'ejemplo-tester';
const ROOT = `schools/${SANDBOX_SID}`;
const STORAGE_KEY = 'violin-facil-sandbox';

export const inSandbox = path => path === ROOT || String(path).startsWith(ROOT + '/');

// ---------- Datos locales ----------
let docs = null;
function load() {
  if (docs) return docs;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { saved = null; }
  docs = new Map(Object.entries(saved || {}));
  return docs;
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(load()))); } catch (e) { /* sin almacenamiento: queda en memoria */ }
}
export function seedSandbox(seed) { docs = new Map(Object.entries(seed)); save(); }
export function clearSandbox() { docs = new Map(); try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nada */ } }
export const sandboxDocs = () => new Map(load());

// ---------- Valores especiales (hora del servidor, sumar, borrar campo) ----------
const SPECIAL = '__sandbox';
const special = (kind, real, extra = {}) => ({ [SPECIAL]: kind, real, ...extra });
const isSpecial = v => !!(v && typeof v === 'object' && v[SPECIAL]);
const isPlain = v => !!v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;

// Para la nube: cada valor especial vuelve a ser el de Firestore
function toReal(v) {
  if (isSpecial(v)) return v.real;
  if (Array.isArray(v)) return v.map(toReal);
  if (isPlain(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toReal(x)]));
  return v;
}
// Para el almacenamiento local: horas como { __ts }, sumas aplicadas, campos borrados fuera
function toLocal(v, prev) {
  if (isSpecial(v)) {
    if (v[SPECIAL] === 'ts') return { __ts: Date.now() };
    if (v[SPECIAL] === 'inc') return (typeof prev === 'number' ? prev : 0) + v.n;
    return undefined;
  }
  if (Array.isArray(v)) return v.map(x => toLocal(x));
  if (isPlain(v) && !('__ts' in v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toLocal(x, prev && prev[k])]).filter(([, x]) => x !== undefined));
  return v;
}
function revive(v) {
  if (Array.isArray(v)) return v.map(revive);
  if (isPlain(v)) {
    if ('__ts' in v) { const ms = v.__ts; return { seconds: Math.floor(ms / 1000), toMillis: () => ms, toDate: () => new Date(ms) }; }
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revive(x)]));
  }
  return v;
}

// ---------- Referencias locales ----------
class LocalDoc { constructor(path) { this.local = true; this.type = 'document'; this.path = path; this.id = path.split('/').pop(); } }
class LocalCol { constructor(path) { this.local = true; this.type = 'collection'; this.path = path; this.id = path.split('/').pop(); } }
const autoId = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('');
const allStrings = parts => parts.every(p => typeof p === 'string');

function snap(ref) {
  const data = load().get(ref.path);
  return { id: ref.id, ref, exists: () => data !== undefined, data: () => (data === undefined ? undefined : revive(data)), get: k => (data === undefined ? undefined : revive(data)[k]) };
}
function list(path, filters = []) {
  const depth = path.split('/').length + 1;
  const found = [...load().keys()].filter(p => p.startsWith(path + '/') && p.split('/').length === depth).map(p => snap(new LocalDoc(p)))
    .filter(s => filters.every(f => f.op !== '==' || s.data()[f.f] === f.v));
  return { docs: found, size: found.length, empty: !found.length, forEach: fn => found.forEach(fn) };
}
function writeLocal({ type, ref, data }) {
  const all = load();
  if (type === 'delete') { all.delete(ref.path); return; }
  if (type === 'update') {
    if (!all.has(ref.path)) throw Object.assign(new Error('not-found'), { code: 'not-found' });
    const prev = all.get(ref.path);
    const next = { ...prev };
    Object.entries(data).forEach(([k, v]) => { const x = toLocal(v, prev[k]); if (x === undefined) delete next[k]; else next[k] = x; });
    all.set(ref.path, next);
    return;
  }
  all.set(ref.path, toLocal(data));
}

// Lo que recibe aula-api.js: el envoltorio solo mientras el modo tester está activo; si no, el Firestore de siempre
let wrapped = null;
export function testerFs(fs) {
  if (!getState().tester) return fs;
  if (!wrapped || wrapped.base !== fs) wrapped = { base: fs, fs: sandboxFs(fs) };
  return wrapped.fs;
}

// El Firestore que usa aula-api.js: con las rutas de la escuela de ejemplo en local, lo demás a la nube
export function sandboxFs(fs) {
  return {
    ...fs,
    doc(a, ...parts) {
      if (a instanceof LocalCol) return new LocalDoc(`${a.path}/${parts[0] || autoId()}`);
      if (allStrings(parts) && inSandbox(parts.join('/'))) return new LocalDoc(parts.join('/'));
      return fs.doc(a, ...parts);
    },
    collection(a, ...parts) {
      if (allStrings(parts) && inSandbox(parts.join('/'))) return new LocalCol(parts.join('/'));
      return fs.collection(a, ...parts);
    },
    where: (f, op, v) => special('where', fs.where(f, op, v), { f, op, v }),
    query(col, ...cs) {
      if (col instanceof LocalCol) return { local: true, path: col.path, filters: cs.filter(c => isSpecial(c) && c[SPECIAL] === 'where') };
      return fs.query(col, ...cs.map(c => (isSpecial(c) ? c.real : c)));
    },
    serverTimestamp: () => special('ts', fs.serverTimestamp()),
    increment: n => special('inc', fs.increment(n), { n }),
    deleteField: () => special('del', fs.deleteField()),
    async getDoc(ref) { return ref.local ? snap(ref) : fs.getDoc(ref); },
    async getDocs(q) { return q.local ? list(q.path, q.filters || []) : fs.getDocs(q); },
    async setDoc(ref, data, opts) { if (ref.local) { writeLocal({ type: 'set', ref, data }); save(); return; } await fs.setDoc(ref, toReal(data), ...(opts ? [opts] : [])); },
    async updateDoc(ref, data) { if (ref.local) { writeLocal({ type: 'update', ref, data }); save(); return; } await fs.updateDoc(ref, toReal(data)); },
    async deleteDoc(ref) { if (ref.local) { writeLocal({ type: 'delete', ref }); save(); return; } await fs.deleteDoc(ref); },
    async addDoc(col, data) {
      if (!col.local) return fs.addDoc(col, toReal(data));
      const ref = new LocalDoc(`${col.path}/${autoId()}`);
      writeLocal({ type: 'set', ref, data });
      save();
      return ref;
    },
    // Un lote que toca la escuela de ejemplo se queda ENTERO aquí (también sus códigos de clase): nunca llega a la nube
    writeBatch(db) {
      const ops = [];
      const b = {
        set(ref, data) { ops.push({ type: 'set', ref, data }); return b; },
        update(ref, data) { ops.push({ type: 'update', ref, data }); return b; },
        delete(ref) { ops.push({ type: 'delete', ref }); return b; },
        async commit() {
          if (ops.some(o => o.ref.local)) {
            ops.filter(o => o.ref.local).forEach(writeLocal);
            save();
            return;
          }
          const real = fs.writeBatch(db);
          ops.forEach(o => (o.type === 'delete' ? real.delete(o.ref) : real[o.type](o.ref, toReal(o.data))));
          await real.commit();
        },
      };
      return b;
    },
  };
}
