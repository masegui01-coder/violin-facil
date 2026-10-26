// Grupos: grabar tu parte comprimida y mezclar las pistas de todos con silencio, solo y volumen.
import * as audio from './audio.js';
import { audible, placement, MAX_SECONDS } from './group-mix.js';

const MIME_PREFS = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
const BITRATE = 32000; // voz e instrumentos se entienden bien y 5 minutos ocupan unos 1,2 MB
const START_DELAY_S = 0.08;
const CLICK_S = 0.05;
const CACHE_DB = 'band-flow-groups';
const CACHE_STORE = 'tracks';

export function recordingSupported() {
  return typeof MediaRecorder !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function pickMime() {
  if (!MediaRecorder.isTypeSupported) return '';
  return MIME_PREFS.find(m => MediaRecorder.isTypeSupported(m)) || '';
}

// Empieza a grabar y devuelve en qué instante del reloj de audio arrancó (para cuadrar la toma con la canción)
export async function startTake() {
  await audio.startMic();
  const mimeType = pickMime();
  const rec = new MediaRecorder(audio.micStream(), mimeType ? { mimeType, audioBitsPerSecond: BITRATE } : { audioBitsPerSecond: BITRATE });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  await new Promise((resolve, reject) => { rec.onstart = resolve; rec.onerror = e => reject(e.error || e); rec.start(1000); });
  const startedAt = audio.ctx().currentTime;
  return {
    startedAt,
    stop: () => new Promise(resolve => {
      if (rec.state === 'inactive') { resolve(new Blob(chunks, { type: rec.mimeType })); return; }
      rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || mimeType }));
      rec.stop();
    }),
  };
}

export async function decode(bytesOrBlob) {
  const buf = bytesOrBlob instanceof Blob ? await bytesOrBlob.arrayBuffer() : bytesOrBlob.buffer.slice(bytesOrBlob.byteOffset, bytesOrBlob.byteOffset + bytesOrBlob.byteLength);
  return new Promise((resolve, reject) => audio.ctx().decodeAudioData(buf, resolve, reject));
}

// Cuenta previa: «beats» clics al tempo, terminando justo en «until»
export function countIn(until, bpm, beats = 4) {
  const c = audio.ctx();
  const step = 60 / bpm;
  for (let i = 0; i < beats; i++) {
    const t = until - (beats - i) * step;
    if (t < c.currentTime) continue;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.frequency.value = i === 0 ? 1500 : 1000;
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + CLICK_S);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + CLICK_S);
  }
}

// Mezclador: cada pista tiene su volumen; silencio y solo se aplican al vuelo, sin cortar la reproducción
export function createMixer() {
  const c = audio.ctx();
  const tracks = new Map(); // id → { buffer, startAt, gain, volume }
  let state = {};
  let run = null; // { t0, pos0, sources }
  let paused = 0;

  const applyGains = () => {
    const list = [...tracks.entries()].map(([id, t]) => ({ id, ...t }));
    const on = new Set(audible(list, state).map(t => t.id));
    tracks.forEach((t, id) => { t.gain.gain.setTargetAtTime(on.has(id) ? t.volume : 0, c.currentTime, 0.02); });
  };

  const api = {
    set(id, buffer, startAt = 0) {
      const old = tracks.get(id);
      const gain = old ? old.gain : c.createGain();
      if (!old) gain.connect(c.destination);
      tracks.set(id, { buffer, startAt, gain, volume: old ? old.volume : 1 });
      applyGains();
    },
    remove(id) { const t = tracks.get(id); if (t) { t.gain.disconnect(); tracks.delete(id); } },
    has: id => tracks.has(id),
    setState(next) { state = next; applyGains(); },
    setVolume(id, v) { const t = tracks.get(id); if (t) { t.volume = v; applyGains(); } },
    length() { return Math.min(MAX_SECONDS, [...tracks.values()].reduce((m, t) => Math.max(m, t.startAt + t.buffer.duration), 0)); },
    playing: () => !!run,
    position() { return run ? run.pos0 + (c.currentTime - run.t0) : paused; },
    // Suena desde «pos»; si se da «when» (reloj de audio), arranca exactamente entonces
    play(pos = paused, when = c.currentTime + START_DELAY_S, skip = []) {
      api.stop(pos);
      const sources = [];
      tracks.forEach((t, id) => {
        if (skip.includes(id)) return;
        const at = placement(t.startAt, pos, t.buffer.duration);
        if (!at) return;
        const src = c.createBufferSource();
        src.buffer = t.buffer;
        src.connect(t.gain);
        src.start(when + at.wait, at.offset);
        sources.push(src);
      });
      run = { t0: when, pos0: pos, sources };
      return when;
    },
    stop(at) {
      if (run) {
        paused = at === undefined ? api.position() : at;
        run.sources.forEach(s => { try { s.stop(); } catch (e) { /* ya parada */ } });
        run = null;
      } else if (at !== undefined) paused = at;
    },
    seek(pos) { const was = !!run; api.stop(pos); if (was) api.play(pos); },
    destroy() { api.stop(); tracks.forEach(t => t.gain.disconnect()); tracks.clear(); },
  };
  return api;
}

// ---------- Copia en el móvil de las pistas descargadas (solo se vuelven a bajar si hay versión nueva) ----------
function openCache() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CACHE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(CACHE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cachedTrack(key, version) {
  try {
    const db = await openCache();
    const hit = await new Promise((resolve, reject) => {
      const r = db.transaction(CACHE_STORE).objectStore(CACHE_STORE).get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return hit && hit.version === version ? hit.bytes : null;
  } catch (e) { return null; }
}

export async function storeTrack(key, version, bytes) {
  try {
    const db = await openCache();
    await new Promise((resolve, reject) => {
      const t = db.transaction(CACHE_STORE, 'readwrite');
      t.objectStore(CACHE_STORE).put({ version, bytes }, key);
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
  } catch (e) { /* sin espacio: se descargará la próxima vez */ }
}
