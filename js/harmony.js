// Armonización automática de una melodía (sin DOM): elige un acorde por medio compás entre los de la tonalidad
// y genera un acompañamiento sencillo de banda (bajo en la parte fuerte y acorde en las demás).
// La crea la app a partir de la melodía, así que no depende de ningún arreglo con derechos de terceros.

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// Grados de la tonalidad: [semitonos desde la tónica, menor?, preferencia]
const MAJOR = [[0, false, 0.3], [5, false, 0.15], [7, false, 0.2], [9, true, 0.05], [2, true, 0.03]];
const MINOR = [[0, true, 0.3], [5, true, 0.15], [7, false, 0.2], [8, false, 0.05], [3, false, 0.05]];
const STRONG_BONUS = 0.5; // la nota que cae en la parte fuerte pesa más
const MISS_PENALTY = 0.6; // una nota de la melodía que no está en el acorde
const BASS_REAL = 43; // Sol2: el bajo suena por aquí
const CHORD_REAL = 55; // Sol3: el acorde, en medio

export function parseKey(key = 'C') {
  const m = /^([A-G])([b#]?)(m?)$/.exec(String(key).trim());
  if (!m) return { tonic: 0, minor: false };
  return { tonic: (LETTER_PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12, minor: m[3] === 'm' };
}

// Tonalidad que mejor encaja con la melodía (para ejercicios sin tonalidad escrita): las notas de su escala,
// y que empiece y sobre todo acabe en la tónica. A igualdad, la de menos alteraciones.
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10, 11];
const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SIMPLE = [0, 7, 2, 5, 9, 10, 4, 3]; // Do, Sol, Re, Fa, La, Si♭, Mi, Mi♭: las tonalidades más fáciles primero
export function inferKey(notes) {
  const played = notes.filter(n => !n.rest);
  if (!played.length) return 'C';
  const pc = n => ((n.midi % 12) + 12) % 12;
  const first = pc(played[0]), last = pc(played[played.length - 1]);
  let best = { score: -Infinity, name: 'C' };
  for (let t = 0; t < 12; t++) {
    [false, true].forEach(minor => {
      const scale = (minor ? MINOR_SCALE : MAJOR_SCALE).map(i => (t + i) % 12);
      const fit = played.reduce((s, n) => s + (scale.includes(pc(n)) ? n.beats : -2 * n.beats), 0);
      const ease = SIMPLE.includes(t) ? (8 - SIMPLE.indexOf(t)) * 0.01 : 0;
      const score = fit + (last === t ? 3 : 0) + (first === t ? 1 : 0) + ease - (minor ? 0.05 : 0);
      if (score > best.score) best = { score, name: KEY_NAMES[t] + (minor ? 'm' : '') };
    });
  }
  return best.name;
}

const triad = (root, minor) => [root, (root + (minor ? 3 : 4)) % 12, (root + 7) % 12];
export const chordName = (root, minor) => NAMES[root] + (minor ? 'm' : '');

// Trozos de medio compás (en 3/4, el compás entero)
function segments(bars, time) {
  const size = time === 4 ? 2 : time;
  return bars.flatMap(b => {
    const out = [];
    for (let s = b.start; s < b.start + b.beats - 1e-6; s += size) out.push({ start: s, beats: Math.min(size, b.start + b.beats - s) });
    return out;
  });
}

// [{ start, beats, root, minor, name }] para toda la canción
export function harmonize(notes, bars, { key = 'C', time = 4 } = {}) {
  const { tonic, minor } = parseKey(key);
  const degrees = (minor ? MINOR : MAJOR).map(([iv, m, prior]) => ({ root: (tonic + iv) % 12, minor: m, prior }));
  const segs = segments(bars, time);
  return segs.map((seg, i) => {
    const inside = notes.filter(n => !n.rest && n.start < seg.start + seg.beats && n.start + n.beats > seg.start);
    const weight = n => Math.min(n.start + n.beats, seg.start + seg.beats) - Math.max(n.start, seg.start) + (Math.abs(n.start - seg.start) < 1e-6 ? STRONG_BONUS : 0);
    const edge = i === 0 || i === segs.length - 1;
    const best = degrees.map(d => {
      const pcs = triad(d.root, d.minor);
      const fit = inside.reduce((s, n) => s + (pcs.includes(((n.midi % 12) + 12) % 12) ? weight(n) : -MISS_PENALTY * weight(n)), 0);
      return { ...d, score: fit + d.prior + (edge && d.root === tonic ? 1 : 0) };
    }).sort((a, b) => b.score - a.score)[0];
    return { start: seg.start, beats: seg.beats, root: best.root, minor: best.minor, name: chordName(best.root, best.minor) };
  });
}

// Nota real más cercana a «center» con esa clase de altura
const near = (pc, center) => center + ((pc - center) % 12 + 18) % 12 - 6;

// Acompañamiento en notas ESCRITAS para el instrumento (transpose: escrita → real)
export function accompanimentNotes(chords, { time = 4, transpose = 0 } = {}) {
  const out = [];
  // los acordes salen de la melodía ESCRITA: para que suenen con ella se colocan en sonido real y se devuelven escritos
  const real = pc => (pc + transpose + 120) % 12;
  chords.forEach(c => {
    const pcs = triad(c.root, c.minor).map(real);
    const root = real(c.root);
    for (let b = 0; b < c.beats - 1e-6; b += 1) {
      const start = c.start + b;
      const beats = Math.min(1, c.beats - b) * 0.9;
      if (b === 0) out.push({ midi: near(root, BASS_REAL) - transpose, start, beats, rest: false });
      else pcs.forEach(pc => out.push({ midi: near(pc, CHORD_REAL) - transpose, start, beats, rest: false }));
    }
    if (time === 2 || c.beats === 1) pcs.forEach(pc => out.push({ midi: near(pc, CHORD_REAL) - transpose, start: c.start, beats: c.beats * 0.9, rest: false }));
  });
  return out;
}

// Nombre del valor de una nota (en negras): «blanca», «negra con puntillo», «corchea de tresillo»…
const VALUES = [[6, 'Redonda con puntillo'], [4, 'Redonda'], [3.5, 'Blanca con doble puntillo'], [3, 'Blanca con puntillo'], [2, 'Blanca'], [1.75, 'Negra con doble puntillo'], [1.5, 'Negra con puntillo'],
  [1, 'Negra'], [0.875, 'Corchea con doble puntillo'], [0.75, 'Corchea con puntillo'], [0.5, 'Corchea'], [0.375, 'Semicorchea con puntillo'], [0.25, 'Semicorchea'], [0.125, 'Fusa']];
const FIGURE = { w: 'Redonda', h: 'Blanca', q: 'Negra', e: 'Corchea', s: 'Semicorchea', t: 'Fusa' };
const GROUP = { 3: 'tresillo', 5: 'quintillo', 6: 'seisillo', 7: 'septillo' };
export function noteValueName(beats, note = null) {
  if (note && note.tuplet && FIGURE[note.dur]) return `${FIGURE[note.dur]} de ${GROUP[note.tuplet] || 'grupo irregular'}`;
  const hit = VALUES.find(([b]) => Math.abs(b - beats) < 1e-6);
  const name = hit ? hit[1] : 'Nota';
  const count = beats >= 1 ? `${Number.isInteger(beats) ? beats : beats.toLocaleString('es-ES')} ${beats === 1 ? 'tiempo' : 'tiempos'}` : `${beats === 0.5 ? 'medio' : beats.toLocaleString('es-ES')} tiempo`;
  return `${name} · ${count}`;
}
