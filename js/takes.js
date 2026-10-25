// Tomas guardadas en el móvil (IndexedDB): la primera y la última de cada obra, para oír la mejora.
const DB = 'band-flow-takes';
const STORE = 'takes';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : undefined);
    t.onerror = () => reject(t.error);
  }));
}

export async function getTakes(key) {
  try { return (await tx('readonly', s => s.get(key))) || null; } catch (e) { return null; }
}

// Guarda la toma como «última»; si no había ninguna, también como «primera»
export async function saveTake(key, blob) {
  try {
    const prev = await getTakes(key);
    const entry = { at: Date.now(), blob };
    await tx('readwrite', s => s.put({ first: prev ? prev.first : entry, last: entry }, key));
    return prev;
  } catch (e) { return null; }
}
