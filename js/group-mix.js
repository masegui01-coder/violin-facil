// Grupos: cálculos sin DOM ni red (trocear el audio, colocar cada pista en el tiempo, en qué parte va la canción).
export const MAX_SECONDS = 5 * 60;
export const MAX_MEMBERS = 8;
export const MAX_SONGS = 20;
export const CHUNK_BYTES = 700 * 1024; // un documento de Firestore admite 1 MiB: margen para el resto de campos
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // maqueta subida desde un archivo (mp3 de 5 min a 128 kbps ≈ 4,8 MB)
export const INACTIVE_DAYS = 60;
export const SECTION_NAMES = ['Intro', 'Estrofa', 'Pre-estribillo', 'Estribillo', 'Puente', 'Solo', 'Final'];

// Trocea los bytes del audio en partes que caben en un documento
export function splitBytes(bytes, size = CHUNK_BYTES) {
  const parts = [];
  for (let i = 0; i < bytes.length; i += size) parts.push(bytes.subarray(i, Math.min(bytes.length, i + size)));
  return parts.length ? parts : [new Uint8Array(0)];
}

export function joinBytes(parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  parts.forEach(p => { out.set(p, at); at += p.length; });
  return out;
}

// Una pista empieza en «startAt» segundos de la canción. Para sonar desde «pos»:
// cuánto esperar antes de arrancarla y desde qué punto del audio.
export function placement(startAt, pos, duration) {
  const into = pos - startAt;
  if (into >= duration) return null; // ya ha terminado
  return into >= 0 ? { wait: 0, offset: into } : { wait: -into, offset: 0 };
}

// Dónde empieza la toma grabada en la canción: la reproducción arrancó en «pos» cuando la grabación llevaba
// «lead» segundos, y el móvil tarda «latency» en oír lo que suena (ida y vuelta, medido al calibrar)
export function recordedStart(pos, lead, latency = 0) {
  return pos - lead - latency;
}

// Parte de la canción que suena en «pos» y la siguiente (con cuánto falta)
export function sectionAt(sections, pos) {
  const sorted = [...(sections || [])].sort((a, b) => a.at - b.at);
  let current = null;
  let next = null;
  for (const s of sorted) {
    if (s.at <= pos) current = s;
    else { next = s; break; }
  }
  return { current, next, inNext: next ? next.at - pos : null };
}

export function songLength(tracks) {
  return Math.min(MAX_SECONDS, tracks.reduce((m, t) => Math.max(m, (t.startAt || 0) + (t.duration || 0)), 0));
}

// Solo suenan las pistas activas: si alguna está en «solo», solo esas
export function audible(tracks, state) {
  const solo = tracks.some(t => state[t.id] && state[t.id].solo);
  return tracks.filter(t => !(state[t.id] && state[t.id].muted) && (!solo || (state[t.id] && state[t.id].solo)));
}

export function clock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function isStale(updatedMs, now = Date.now()) {
  return !!updatedMs && now - updatedMs > INACTIVE_DAYS * 864e5;
}
