// Teoría musical: notas, partituras en texto, digitación en primera posición y armaduras.

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const EU_LETTER = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const ACC_SIGN = { 1: '♯', '-1': '♭', 0: '' };
// Ortografía por defecto (con sostenidos) para notas sin escribir
const SHARP_SPELLING = [['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]];
export const DURATIONS = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };

export const STRINGS = [
  { id: 'G', midi: 55, eu: 'Sol', us: 'G' },
  { id: 'D', midi: 62, eu: 'Re', us: 'D' },
  { id: 'A', midi: 69, eu: 'La', us: 'A' },
  { id: 'E', midi: 76, eu: 'Mi', us: 'E' },
];
export const LOWEST_MIDI = 55;
export const HIGHEST_MIDI = 84;

export function parseNote(str) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(str);
  if (!m) throw new Error('Nota no válida: ' + str);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const oct = Number(m[3]);
  return { letter: m[1], acc, oct, midi: (oct + 1) * 12 + LETTER_PC[m[1]] + acc };
}

const FLAT_SPELLING = [['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0], ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0]];

// Ortografía de una nota sin escribir: con sostenidos (cuerda) o con bemoles (viento, habitual en banda)
export function spell(midi, flats = false) {
  const [letter, acc] = (flats ? FLAT_SPELLING : SHARP_SPELLING)[midi % 12];
  const oct = Math.floor((midi - acc) / 12) - 1;
  return { letter, acc, oct, midi };
}

// Escalón diatónico (para colocar la nota en el pentagrama)
export function diatonicStep(note) {
  return note.oct * 7 + LETTERS.indexOf(note.letter);
}

// Partitura en texto: "| D4q E4e F#4e G4h | R h |". Duraciones w h q e s, puntillo con ".".
export function parseScore(text) {
  const notes = [];
  const bars = [];
  let beat = 0;
  let barStart = 0;
  const closeBar = () => {
    if (beat > barStart) bars.push({ start: barStart, beats: beat - barStart });
    barStart = beat;
  };
  normalizeScore(text).trim().split(/\s+/).forEach(raw => {
    if (raw === '|') { closeBar(); return; }
    const tok = /^(R|[A-G](?:#|b)?\d)([whqes])(\.?)$/.exec(raw);
    if (!tok) throw new Error('Figura no válida: ' + raw);
    const beats = DURATIONS[tok[2]] * (tok[3] ? 1.5 : 1);
    const base = tok[1] === 'R' ? { rest: true } : { ...parseNote(tok[1]), rest: false };
    notes.push({ ...base, beats, start: beat, dotted: !!tok[3], dur: tok[2], bar: bars.length });
    beat += beats;
  });
  closeBar();
  return { notes, bars, totalBeats: beat };
}

// "R h" (silencio con espacio) también se acepta
function normalizeScore(text) {
  return text.replace(/\bR\s+([whqes]\.?)/g, 'R$1');
}

const OFFSET_FINGER = [[0, ''], [1, 'bajo'], [1, ''], [2, 'bajo'], [2, 'alto'], [3, ''], [3, 'alto'], [4, ''], [4, 'extendido']];

// Digitación en primera posición: cuerda al aire si se puede; si no, la cuerda con el dedo más cercano a la cejuela.
export function fingering(midi) {
  const options = STRINGS
    .map(s => ({ s, offset: midi - s.midi }))
    .filter(o => o.offset >= 0 && (o.offset <= 7 || (o.s.id === 'E' && o.offset === 8)));
  if (!options.length) return null;
  const best = options.reduce((a, b) => (b.offset < a.offset ? b : a));
  const [finger, tag] = OFFSET_FINGER[best.offset];
  return { string: best.s.id, offset: best.offset, finger, tag };
}

export function stringLabel(id, nom) {
  const s = STRINGS.find(x => x.id === id);
  return nom === 'us' ? s.us : s.eu;
}

export function fingerText(midi, nom) {
  const f = fingering(midi);
  if (!f) return 'Fuera de la primera posición';
  const finger = f.finger === 0 ? 'al aire' : 'dedo ' + f.finger + (f.tag ? ' ' + f.tag : '');
  return 'Cuerda ' + stringLabel(f.string, nom) + ' · ' + finger;
}

export function noteLabel(note, nom, flats = false) {
  const n = note.letter ? note : spell(note.midi, flats);
  const sign = ACC_SIGN[n.acc];
  return nom === 'us' ? n.letter + sign + n.oct : EU_LETTER[n.letter] + sign;
}

const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
const KEY_COUNT = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6,
  Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, 'D#m': 6, Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5, Ebm: -6,
};

export function keyCount(key) {
  if (!(key in KEY_COUNT)) throw new Error('Tonalidad no soportada: ' + key);
  return KEY_COUNT[key];
}

export function keySignature(key) {
  const n = keyCount(key);
  const letters = n >= 0 ? SHARP_ORDER.slice(0, n) : FLAT_ORDER.slice(0, -n);
  return Object.fromEntries(letters.map(l => [l, n >= 0 ? 1 : -1]));
}

// Alteración que hay que dibujar delante de la nota según la armadura (sin arrastre dentro del compás)
export function accidentalToShow(note, sig) {
  const expected = sig[note.letter] || 0;
  if (note.acc === expected) return null;
  if (note.acc === 0) return 'natural';
  return note.acc > 0 ? 'sharp' : 'flat';
}

// La de referencia: 440 Hz por defecto; muchas bandas afinan a 442
let referenceA = 440;
export function setReferenceA(hz) { referenceA = hz; }
export function getReferenceA() { return referenceA; }
export function midiToFreq(m) { return referenceA * Math.pow(2, (m - 69) / 12); }
export function freqToMidi(f) { return 69 + 12 * Math.log2(f / referenceA); }
