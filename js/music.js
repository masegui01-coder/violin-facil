// Teoría musical: notas, partituras en texto, digitación en primera posición y armaduras.

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const EU_LETTER = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const ACC_SIGN = { 1: '♯', '-1': '♭', 0: '' };
// Ortografía por defecto (con sostenidos) para notas sin escribir
const SHARP_SPELLING = [['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0], ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0]];
export const DURATIONS = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 0.125 };

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

// Partitura en texto: "| D4q E4e F#4e G4h | R h |". Duraciones w h q e s t (fusa), puntillo "." (doble ".."),
// grupos irregulares ":3" (tresillo), ":5", ":6", ":7"; tras la figura: > acento, ' picado, _ tenuto, ^ marcato,
// U calderón, ~ ligadura con la siguiente, T trino, x cabeza en aspa (slap). "(" delante y ")" detrás: ligadura de expresión.
// "g:C#5" es una nota de adorno de la siguiente. Indicaciones sin duración (para la nota siguiente):
// @p @mf @ff @sfz @fp… matices · @< @> @| reguladores (abrir crescendo, diminuendo, cerrar) · @rit @accel @atempo @cresc @dim
// textos · @time:6/8 · @clef:bass|treble|alto|tenor · @key:F · @tempo:q=52:Larghetto · @8va @8va| · @breath · @tech:Slap
export const DYNAMICS = ['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff', 'sfz', 'fp', 'sf'];
const TUPLET = { 3: 2 / 3, 5: 4 / 5, 6: 2 / 3, 7: 4 / 7 };
const DIRECTION_TEXT = { rit: 'rit.', accel: 'accel.', atempo: 'a tempo', cresc: 'cresc.', dim: 'dim.', rall: 'rall.', 'poco_rit': 'poco rit.', niente: 'niente' };
const NOTE_RE = /^(\(?)(R|[A-G](?:#|b)?\d)([whqest])(\.{0,2})(?::([3567]))?([>'_^UTx~]*)(\)?)$/;

export const meterBeats = ([num, den]) => num * 4 / den;

export function parseScore(text) {
  const notes = [];
  const bars = [];
  let beat = 0;
  let barStart = 0;
  let meter = null;
  let clef = null;
  let key = null;
  let pending = {};
  let grace = [];
  let tupletId = 0;
  let tupletOpen = null; // { n, id, start } mientras se llena un grupo irregular
  const closeBar = () => {
    if (beat > barStart) bars.push({ start: barStart, beats: beat - barStart, ...(meter ? { meter } : {}), ...(clef ? { clef } : {}), ...(key ? { key } : {}) });
    barStart = beat;
  };
  const mark = (k, v) => { pending = { ...pending, [k]: [...(pending[k] || []), v] }; };
  normalizeScore(text).trim().split(/\s+/).forEach(raw => {
    if (raw === '|') { closeBar(); return; }
    if (raw.startsWith('@')) {
      const [cmd, ...args] = raw.slice(1).split(':');
      if (DYNAMICS.includes(cmd)) mark('dyn', cmd);
      else if (cmd === '<' || cmd === '>' || cmd === '|') mark('hairpin', cmd === '<' ? 'cresc' : cmd === '>' ? 'dim' : 'end');
      else if (DIRECTION_TEXT[cmd]) mark('text', DIRECTION_TEXT[cmd]);
      else if (cmd === 'time') { meter = args[0].split('/').map(Number); mark('meter', meter); }
      else if (cmd === 'clef') { clef = args[0]; mark('clef', clef); }
      else if (cmd === 'key') { key = args[0]; mark('key', key); }
      else if (cmd === 'tempo') mark('tempo', { unit: args[0].split('=')[0], bpm: Number(args[0].split('=')[1]), label: (args[1] || '').replace(/_/g, ' ') });
      else if (cmd === '8va' || cmd === '8va|') mark('ottava', cmd === '8va' ? 'start' : 'end');
      else if (cmd === 'breath') mark('breath', true);
      else if (cmd === 'tech') mark('tech', args.join(':').replace(/_/g, ' '));
      else throw new Error('Indicación no válida: ' + raw);
      return;
    }
    if (raw.startsWith('g:')) { grace.push(parseNote(raw.slice(2))); return; }
    const tok = NOTE_RE.exec(raw);
    if (!tok) throw new Error('Figura no válida: ' + raw);
    const dots = tok[4].length;
    const tuplet = tok[5] ? Number(tok[5]) : null;
    const beats = DURATIONS[tok[3]] * (dots === 2 ? 1.75 : dots ? 1.5 : 1) * (tuplet ? TUPLET[tuplet] : 1);
    const flags = tok[6];
    const base = tok[2] === 'R' ? { rest: true } : { ...parseNote(tok[2]), rest: false };
    // un grupo irregular se cierra al llegar a un pulso entero desde su comienzo (tresillo de corcheas: 1; de negras: 2)
    if (tuplet && (!tupletOpen || tupletOpen.n !== tuplet)) tupletOpen = { n: tuplet, id: ++tupletId, start: beat };
    if (!tuplet) tupletOpen = null;
    const groupId = tupletOpen && tupletOpen.id;
    const note = {
      ...base, beats, start: beat, dotted: dots > 0, dots, dur: tok[3], accent: flags.includes('>'), bar: bars.length,
      ...(tuplet ? { tuplet, tupletId: groupId } : {}),
      ...(flags.includes("'") ? { staccato: true } : {}), ...(flags.includes('_') ? { tenuto: true } : {}),
      ...(flags.includes('^') ? { marcato: true } : {}), ...(flags.includes('U') ? { fermata: true } : {}),
      ...(flags.includes('~') ? { tie: true } : {}), ...(flags.includes('T') ? { trill: true } : {}), ...(flags.includes('x') ? { xhead: true } : {}),
      ...(tok[1] ? { slurStart: true } : {}), ...(tok[7] ? { slurEnd: true } : {}),
      ...(clef ? { clef } : {}), ...(key ? { key } : {}),
      ...(grace.length ? { grace } : {}),
      ...(Object.keys(pending).length ? { marks: pending } : {}),
    };
    notes.push(note);
    pending = {};
    grace = [];
    beat += beats;
    if (tupletOpen) { const span = beat - tupletOpen.start; if (span > 0.5 && Math.abs(span - Math.round(span)) < 1e-6) tupletOpen = null; }
  });
  closeBar();
  return { notes, bars, totalBeats: beat, ...(Object.keys(pending).length ? { endMarks: pending } : {}) };
}

// "R h" (silencio con espacio) también se acepta
function normalizeScore(text) {
  return text.replace(/\bR\s+([whqest]\.{0,2})/g, 'R$1');
}

const OFFSET_FINGER = [[0, ''], [1, 'bajo'], [1, ''], [2, 'bajo'], [2, 'alto'], [3, ''], [3, 'alto'], [4, ''], [4, 'extendido']];

// Violonchelo: Do, Sol, Re y La (dos octavas por debajo de la viola). En primera posición la mano abarca una
// tercera menor: dedo 1 a un tono de la cuerda al aire, 2 a una tercera menor, 3 a una mayor y 4 a la cuarta;
// el 1 «extendido atrás» da el semitono y el 4 «extendido adelante», la cuarta aumentada (Do♯ en la cuerda Sol).
export const CELLO_STRINGS = [
  { id: 'C', midi: 36, eu: 'Do', us: 'C' },
  { id: 'G', midi: 43, eu: 'Sol', us: 'G' },
  { id: 'D', midi: 50, eu: 'Re', us: 'D' },
  { id: 'A', midi: 57, eu: 'La', us: 'A' },
];
const CELLO_OFFSET_FINGER = [[0, ''], [1, 'extendido atrás'], [1, ''], [2, ''], [3, ''], [4, ''], [4, 'extendido adelante']];
const BOWED = {
  violin: { strings: STRINGS, map: OFFSET_FINGER, max: s => (s.id === 'E' ? 8 : 7) },
  cello: { strings: CELLO_STRINGS, map: CELLO_OFFSET_FINGER, max: () => 6 },
};
const bowed = instId => BOWED[instId] || BOWED.violin;
export const stringsOf = instId => bowed(instId).strings;
export const isBowed = instId => instId in BOWED;

// Digitación en primera posición: cuerda al aire si se puede; si no, la cuerda con el dedo más cercano a la cejuela.
export function fingering(midi, instId = 'violin') {
  const { strings, map, max } = bowed(instId);
  const options = strings
    .map(s => ({ s, offset: midi - s.midi }))
    .filter(o => o.offset >= 0 && o.offset <= max(o.s));
  if (!options.length) return null;
  const best = options.reduce((a, b) => (b.offset < a.offset ? b : a));
  const [finger, tag] = map[best.offset];
  return { string: best.s.id, offset: best.offset, finger, tag };
}

export function stringLabel(id, nom, instId = 'violin') {
  const s = stringsOf(instId).find(x => x.id === id);
  return nom === 'us' ? s.us : s.eu;
}

export function fingerText(midi, nom, instId = 'violin') {
  const f = fingering(midi, instId);
  if (!f) return 'Fuera de la primera posición';
  const finger = f.finger === 0 ? 'al aire' : 'dedo ' + f.finger + (f.tag ? ' ' + f.tag : '');
  return 'Cuerda ' + stringLabel(f.string, nom, instId) + ' · ' + finger;
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

// ---------- Trasposición (para que cada instrumento lea su parte escrita de una obra en sonido real) ----------
const KEY_NAMES = Object.keys(KEY_COUNT);
const tonicOf = key => key.replace(/m$/, '');
const pcOf = name => (LETTER_PC[name[0]] + (name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0) + 12) % 12;

// Tonalidad destino con la armadura más sencilla (p. ej. Re + 2 semitonos = Mi; Fa + 9 = Re)
export function transposeKey(key, semitones) {
  const minor = key.endsWith('m');
  const pc = (pcOf(tonicOf(key)) + semitones % 12 + 24) % 12;
  const options = KEY_NAMES.filter(k => k.endsWith('m') === minor && pcOf(tonicOf(k)) === pc);
  return options.sort((a, b) => Math.abs(KEY_COUNT[a]) - Math.abs(KEY_COUNT[b]))[0] || key;
}

// Desplaza las notas «semitones» y las reescribe en la nueva tonalidad respetando el intervalo (Fa♯ → Sol♯, no La♭)
export function transposeScore(score, key, semitones) {
  if (!semitones) return { score, key };
  const target = transposeKey(key, semitones);
  const d0 = (LETTERS.indexOf(tonicOf(target)[0]) - LETTERS.indexOf(tonicOf(key)[0]) + 7) % 7;
  const steps = [d0 - 7, d0, d0 + 7].sort((a, b) => Math.abs(a - semitones * 7 / 12) - Math.abs(b - semitones * 7 / 12))[0];
  const notes = score.notes.map(n => {
    if (n.rest || !n.letter) return n.rest ? n : { ...n, midi: n.midi + semitones };
    const idx = LETTERS.indexOf(n.letter) + steps;
    const letter = LETTERS[((idx % 7) + 7) % 7];
    const midi = n.midi + semitones;
    let oct = n.oct + Math.floor(idx / 7);
    const acc = midi - ((oct + 1) * 12 + LETTER_PC[letter]);
    return Math.abs(acc) <= 2 ? { ...n, midi, letter, acc, oct } : { ...n, ...spell(midi, keyCount(target) < 0) };
  });
  return { score: { ...score, notes }, key: target };
}

// Notas de afinación de banda (Si♭, La y Fa de concierto) escritas para el instrumento, en la octava cómoda de su
// registro y con la grafía de su tonalidad (el La de concierto es Fa♯ en el saxo alto, no Sol♭)
const SHARP_KEYS = [0, 2, 4, 7, 9, 11]; // Do, Re, Mi, Sol, La y Si mayor se escriben con sostenidos
export function bandTuningNotes(inst) {
  const [lo, hi] = inst.comfort || inst.written;
  const target = lo + (hi - lo) * 0.4;
  const flats = !SHARP_KEYS.includes(((10 - inst.transpose) % 12 + 12) % 12);
  // la octava se elige con el Si♭ y las tres notas se quedan juntas
  let bb = 70 - inst.transpose;
  while (bb - 12 >= lo + 5 && Math.abs(bb - 12 - target) < Math.abs(bb - target)) bb -= 12;
  while (bb + 12 <= hi && Math.abs(bb + 12 - target) < Math.abs(bb - target)) bb += 12;
  const shift = bb - (70 - inst.transpose);
  return [70, 69, 65].map(real => spell(real - inst.transpose + shift, flats));
}
