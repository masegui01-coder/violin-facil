// Lenguaje musical · Nivel 4: armonía y teoría sin DOM (las usan las preguntas, los dictados, la síntesis de acordes y las
// pruebas). Tonalidades de −7 a 7, grados y su nombre, tríadas, números romanos, cadencias, modulación a tonos vecinos,
// notas enarmónicas, inversión de intervalos, posiciones en las claves de do y de fa en 3.ª y realización de los adornos.
import { LETTERS, midiOf, stepOf, nameOfStep, interval, intervalNote, keyAcc, scoreTokens, scale } from './notes.js';
import { parseNote } from '../music.js';

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SOLFA = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };
const ACC_TEXT = { '-1': 'b', 0: '', 1: '#' };

// ---------- Tonalidades ----------
// Quintas de cada letra natural a partir de Do (Fa = −1); sostenidos y bemoles suman o restan 7. La menor está tres quintas
// por debajo de su mayor homónima (La m = Do M − 3 + 3 …: armadura de la menor = armadura de la mayor de su tónica − 3)
const FIFTHS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, F: -1 };
// «Do M», «La♭ M», «Fa♯ m», «sol# menor»… → { letter, acc, minor, armadura, name, tonic } o null
export function parseKey(text) {
  const m = /^(do|re|mi|fa|sol|la|si)\s*([♯♭#]|b(?=\s|$))?\s*(M|m|mayor|menor)?$/i.exec(String(text || '').trim());
  if (!m) return null;
  const letter = SOLFA[m[1].toLowerCase()];
  const acc = m[2] === '♯' || m[2] === '#' ? 1 : m[2] ? -1 : 0;
  const minor = /^(m|menor)$/.test(m[3] || '');
  const armadura = FIFTHS[letter] + 7 * acc - (minor ? 3 : 0);
  if (Math.abs(armadura) > 7) return null;
  return { letter, acc, minor, armadura, tonic: letter + ACC_TEXT[acc], name: keyName(armadura, minor) };
}
// Armadura (−7…7) → tonalidad escrita («Do♯ M», «Si♭ m»)
const MAJORS = ['Do♭', 'Sol♭', 'Re♭', 'La♭', 'Mi♭', 'Si♭', 'Fa', 'Do', 'Sol', 'Re', 'La', 'Mi', 'Si', 'Fa♯', 'Do♯'];
const MINORS = ['La♭', 'Mi♭', 'Si♭', 'Fa', 'Do', 'Sol', 'Re', 'La', 'Mi', 'Si', 'Fa♯', 'Do♯', 'Sol♯', 'Re♯', 'La♯'];
export const keyName = (armadura, minor = false) => `${(minor ? MINORS : MAJORS)[armadura + 7]} ${minor ? 'm' : 'M'}`;
// Armadura de una tonalidad escrita (0 si no se entiende)
export const armaduraOf = text => (parseKey(text) || { armadura: 0 }).armadura;
// Nombre de la tonalidad en solfeo → letra de la tónica con alteración («La♭ M» → «Ab»)
export const tonicName = text => (parseKey(text) || { tonic: 'C' }).tonic;

// Escala de la tonalidad desde su tónica en la octava dada: ['C4', 'D4', …] (la menor, natural; con harm, armónica)
export function keyScale(text, { harm = false, oct = 4 } = {}) {
  const k = parseKey(text);
  return scale(k.tonic + oct, k.minor ? (harm ? 'menor armónica' : 'menor natural') : 'mayor').slice(0, 7);
}

// ---------- Grados ----------
export const DEGREE_NAME = { 1: 'tónica', 2: 'supertónica', 3: 'mediante', 4: 'subdominante', 5: 'dominante', 6: 'superdominante', 7: 'sensible' };
// Grado y nombre de una nota en una tonalidad. En menor, el 7.º con la sensible (a un semitono de la tónica) es la sensible
// y el 7.º natural, la subtónica. Una nota que no es de la escala (ni la sensible de la menor) devuelve null.
export function degreeOf(keyText, note) {
  const k = parseKey(keyText);
  const n = parseNote(note);
  const grado = ((LETTERS.indexOf(n.letter) - LETTERS.indexOf(k.letter) + 7) % 7) + 1;
  const natural = keyScale(keyText).map(x => parseNote(x).midi % 12);
  const harmonic = keyScale(keyText, { harm: true }).map(x => parseNote(x).midi % 12);
  const pc = n.midi % 12;
  if (grado === 7 && k.minor) return harmonic[6] === pc ? { grado, nombre: 'sensible' } : natural[6] === pc ? { grado, nombre: 'subtónica' } : null;
  const okPc = natural[grado - 1] === pc;
  return okPc ? { grado, nombre: DEGREE_NAME[grado] } : null;
}
// La nota de un grado (1…7) en una tonalidad, en una octava
export function noteOfDegree(keyText, grado, { oct = 4, harm = false } = {}) {
  const k = parseKey(keyText);
  const sc = keyScale(keyText, { oct, harm: harm && k.minor });
  return sc[(grado - 1) % 7];
}

// ---------- Tríadas ----------
export const TRIAD_TYPES = ['mayor', 'menor', 'disminuida', 'aumentada'];
const TRIAD_INTERVALS = { mayor: [['M', 3], ['J', 5]], menor: [['m', 3], ['J', 5]], disminuida: [['m', 3], ['d', 5]], aumentada: [['M', 3], ['A', 5]] };
// Las tres notas de una tríada en posición fundamental sobre una raíz con octava
export function triadFromRoot(root, tipo) {
  const [t, f] = TRIAD_INTERVALS[tipo];
  return [root, intervalNote(root, t[1], t[0]), intervalNote(root, f[1], f[0])];
}
// Clase de una tríada en posición fundamental (3.ª sobre 3.ª): 'mayor' | 'menor' | 'disminuida' | 'aumentada' | null
export function classifyTriad(notes) {
  const s = [...notes].sort((a, b) => midiOf(a) - midiOf(b));
  if (s.length !== 3) return null;
  if (stepOf(s[1]) - stepOf(s[0]) !== 2 || stepOf(s[2]) - stepOf(s[1]) !== 2) return null;
  const a = midiOf(s[1]) - midiOf(s[0]);
  const b = midiOf(s[2]) - midiOf(s[1]);
  if (a === 4 && b === 3) return 'mayor';
  if (a === 3 && b === 4) return 'menor';
  if (a === 3 && b === 3) return 'disminuida';
  if (a === 4 && b === 4) return 'aumentada';
  return null;
}
// Tríada de un grado (1…7) de la escala de una tonalidad (en menor, la armónica): { root, notes, tipo }
export function triadOfDegree(keyText, grado, { oct = 4 } = {}) {
  const k = parseKey(keyText);
  const sc = keyScale(keyText, { harm: k.minor, oct }).map(parseNote);
  // la fundamental en la octava pedida y las otras dos encima, de tercera en tercera
  const rootStep = stepOf(sc[(grado - 1) % 7].letter + oct);
  const notes = [0, 2, 4].map(i => {
    const n = sc[(grado - 1 + i) % 7];
    const step = rootStep + i;
    return LETTERS[((step % 7) + 7) % 7] + ACC_TEXT[n.acc] + Math.floor(step / 7);
  });
  return { root: notes[0], notes, tipo: classifyTriad(notes) };
}

// ---------- Números romanos ----------
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const ROMAN_TEXT = Object.fromEntries(Object.entries(ROMAN).map(([k, v]) => [v, k]));
// «V» → { grado: 5, mayusculas: true, marca: '' }; «vii°» → { grado: 7, mayusculas: false, marca: '°' }
export function parseNumeral(text) {
  const m = /^(i{1,3}|iv|v|vi{1,2})(°|\+)?$/i.exec(String(text).trim());
  if (!m) return null;
  return { grado: ROMAN[m[1].toUpperCase()], mayusculas: m[1] === m[1].toUpperCase(), marca: m[2] || '' };
}
// El numeral que corresponde a la tríada de un grado: mayor = I; menor = i; disminuida = vii°; aumentada = III+
export function numeralFor(keyText, grado) {
  const { tipo } = triadOfDegree(keyText, grado);
  const base = ROMAN_TEXT[grado];
  return tipo === 'mayor' ? base : tipo === 'menor' ? base.toLowerCase() : tipo === 'disminuida' ? `${base.toLowerCase()}°` : `${base}+`;
}
// ¿Está bien escrito el numeral (mayúscula o minúscula) para esa tonalidad? null si sí; si no, el motivo
export function numeralProblem(keyText, text) {
  const r = parseNumeral(text);
  if (!r) return `numeral no válido «${text}»`;
  const want = numeralFor(keyText, r.grado);
  return want === text ? null : `en ${keyText}, el grado ${r.grado} se escribe «${want}», no «${text}»`;
}
// Acorde de un numeral: { numeral, grado, root, notes (octava 4), tipo }
export function chordOfNumeral(keyText, numeral, opts = {}) {
  const r = parseNumeral(numeral);
  return { numeral, grado: r.grado, ...triadOfDegree(keyText, r.grado, opts) };
}
// Notas (con octava) que suenan en un acorde: la fundamental una octava grave y las tres voces desde la octava 4. Si la
// fundamental queda en la octava 4 entera (do4…si4), las voces suben sobre ella
export function chordVoicing(keyText, numeral) {
  const { notes } = chordOfNumeral(keyText, numeral, { oct: 4 });
  const root = parseNote(notes[0]);
  const bass = root.letter + ACC_TEXT[root.acc] + (root.oct - 1);
  return { bass, notes };
}

// ---------- Cadencias ----------
// Cadencia de una progresión de numerales: perfecta V–I, plagal IV–I, rota V–vi y semicadencia (termina en V). Los acordes
// repetidos seguidos cuentan una vez («I I IV IV V V I I» acaba en V–I)
export function cadenciaDe(progresion) {
  const prog = progresion.filter((c, i) => i === 0 || c !== progresion[i - 1]);
  const g = k => (prog[k] ? parseNumeral(prog[k]).grado : 0);
  const last = g(prog.length - 1);
  const prev = g(prog.length - 2);
  if (last === 1 && prev === 5) return 'perfecta';
  if (last === 1 && prev === 4) return 'plagal';
  if (last === 6 && prev === 5) return 'rota';
  if (last === 5) return 'semicadencia';
  return null;
}

// ---------- Modulación a tonos vecinos ----------
// Relación de una tonalidad con otra por sus armaduras: dominante (+1♯), subdominante (−1♯), relativa (misma armadura, otro
// modo) o null (misma tonalidad o lejana)
export function modulationRelation(desde, hasta) {
  const a = parseKey(desde);
  const b = parseKey(hasta);
  if (!a || !b) return null;
  if (a.minor === b.minor) return b.armadura - a.armadura === 1 ? 'dominante' : b.armadura - a.armadura === -1 ? 'subdominante' : null;
  return a.armadura === b.armadura ? 'relativa' : null;
}
// La alteración que anuncia la modulación: la sensible del tono de llegada (dominante), el 4.º grado del tono de salida
// (subdominante) o el 7.º elevado de la relativa menor / el 7.º natural de la relativa mayor
export function newNoteOf(desde, hasta) {
  const rel = modulationRelation(desde, hasta);
  const to = parseKey(hasta);
  const pc = n => parseNote(n).letter + ACC_TEXT[parseNote(n).acc];
  if (rel === 'dominante') return pc(noteOfDegree(hasta, 7, { harm: true }));
  if (rel === 'subdominante') return pc(noteOfDegree(desde, 4));
  if (rel === 'relativa') return to.minor ? pc(noteOfDegree(hasta, 7, { harm: true })) : pc(noteOfDegree(desde, 7, { harm: true }));
  return null;
}

// ---------- Notas enarmónicas ----------
// Otro nombre para la misma tecla: la misma altura con otra letra (con un sostenido o un bemol como mucho)
export function enharmonicNames(name) {
  const m = midiOf(name);
  const own = name[0];
  const out = [];
  for (const letter of LETTERS) {
    if (letter === own) continue;
    for (const acc of [-1, 0, 1]) {
      const oct = Math.round((m - acc - LETTER_PC[letter]) / 12) - 1;
      if ((oct + 1) * 12 + LETTER_PC[letter] + acc === m) out.push(letter + ACC_TEXT[acc] + oct);
    }
  }
  return out;
}
export const isEnharmonic = (a, b) => midiOf(a) === midiOf(b) && a[0] !== b[0];

// ---------- Inversión de intervalos ----------
const INVERT_SPECIES = { M: 'm', m: 'M', J: 'J', A: 'd', d: 'A' };
// La inversión de un intervalo (la nota grave pasa una octava arriba): número + número = 9, mayor ↔ menor, justa ↔ justa,
// aumentada ↔ disminuida. Devuelve { numero, especie } de la inversión y las dos notas ordenadas
export function invertInterval(a, b) {
  const iv = interval(a, b);
  const [lo, hi] = midiOf(a) <= midiOf(b) ? [a, b] : [b, a];
  const p = parseNote(lo);
  const up = p.letter + ACC_TEXT[p.acc] + (p.oct + 1);
  return { numero: 9 - iv.number, especie: INVERT_SPECIES[iv.quality], notas: [hi, up] };
}

// ---------- Claves de do y de fa en 3.ª ----------
// Referencia de cada clave: la nota que marca y su posición (0 = línea 1, 1 = espacio 1, 2 = línea 2…). El nombre del
// catálogo («sol», «fa», «do3», «do4», «fa3») y el del pentagrama («treble», «bass», «alto», «tenor», «baritone»)
export const CLEF_REF = {
  treble: { note: 'G4', pos: 2 }, bass: { note: 'F3', pos: 6 }, alto: { note: 'C4', pos: 4 }, tenor: { note: 'C4', pos: 6 }, baritone: { note: 'F3', pos: 4 },
};
export const CLEF_OF = { sol: 'treble', fa: 'bass', do3: 'alto', do4: 'tenor', fa3: 'baritone', treble: 'treble', bass: 'bass', alto: 'alto', tenor: 'tenor', baritone: 'baritone' };
// Escalón de la línea inferior de cada clave
export const clefBottom = clef => stepOf(CLEF_REF[CLEF_OF[clef] || clef].note) - CLEF_REF[CLEF_OF[clef] || clef].pos;
// Posición de una nota en el pentagrama de una clave: { tipo: 'linea' | 'espacio', n: 1…5 } (null si queda fuera del pentagrama)
export function positionInClef(note, clef) {
  const p = stepOf(note) - clefBottom(clef);
  if (p < 0 || p > 8) return null;
  return p % 2 === 0 ? { tipo: 'linea', n: p / 2 + 1 } : { tipo: 'espacio', n: (p + 1) / 2 };
}
// La nota natural de una posición en una clave: { tipo: 'linea', n: 3 } → 'C4' en la clave de do en 3.ª
export function noteAtPosition(pos, clef) {
  const p = pos.tipo === 'linea' ? (pos.n - 1) * 2 : pos.n * 2 - 1;
  return nameOfStep(clefBottom(clef) + p);
}

// ---------- Adornos ----------
// La realización escrita de los adornos de una partitura: «ornamentos» = [{ indice (nº de la nota, desde 0, sin contar los
// silencios), signo (trino, mordente, grupeto, apoyatura, acciaccatura), direccion ('abajo') }]. La nota vecina es la de
// la escala de la armadura un grado arriba o abajo. Devuelve el texto de la partitura realizada o lanza un error si no
// hay figura que valga el resto (adorno imposible).
const BEATS_FIG = { 0.25: 's', 0.5: 'e', 0.75: 'e.', 1: 'q', 1.5: 'q.', 2: 'h', 3: 'h.', 4: 'w' };
const figOf = beats => {
  const f = BEATS_FIG[Math.round(beats * 1000) / 1000];
  if (!f) throw new Error(`ninguna figura vale ${beats} pulsos`);
  return f;
};
function neighbour(name, up, armadura) {
  const step = stepOf(name) + (up ? 1 : -1);
  const letter = LETTERS[((step % 7) + 7) % 7];
  return letter + ACC_TEXT[keyAcc(letter, armadura)] + Math.floor(step / 7);
}
export function ornamentSequence(name, beats, signo, { armadura = 0, direccion = null } = {}) {
  const up = (dir = direccion) => neighbour(name, dir !== 'abajo', armadura);
  const low = neighbour(name, false, armadura);
  const high = neighbour(name, true, armadura);
  const d = beats;
  if (signo === 'trino') {
    if (d < 1) throw new Error('trino sobre una nota de menos de un pulso');
    const pairs = Math.round((d - 0.5) * 4);
    return [...Array.from({ length: pairs }, (_, i) => [i % 2 ? high : name, 0.25]), [name, 0.5]];
  }
  if (signo === 'mordente') {
    if (d < 0.75) throw new Error('mordente sobre una nota demasiado corta');
    return [[name, 0.25], [low, 0.25], [name, d - 0.5]];
  }
  if (signo === 'grupeto') return [[high, d / 4], [name, d / 4], [low, d / 4], [name, d / 4]];
  if (signo === 'apoyatura') return [[up(), d / 2], [name, d / 2]];
  if (signo === 'acciaccatura') return [[up(), 0.25], [name, d - 0.25]];
  throw new Error('adorno desconocido ' + signo);
}
export function realizeOrnaments(partitura, ornamentos = [], armadura = 0) {
  let k = -1;
  const bars = String(partitura).split('|').map(x => x.trim()).filter(Boolean);
  const out = bars.map(bar => bar.split(/\s+/).map(tok => {
    const m = /^([A-G][#b]?\d)([whqes])(\.?)$/.exec(tok);
    if (!m) return tok;
    k++;
    const o = ornamentos.find(x => x.indice === k);
    if (!o) return tok;
    const d = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 }[m[2]] * (m[3] ? 1.5 : 1);
    return ornamentSequence(m[1], d, o.signo, { armadura, direccion: o.direccion }).map(([n, du]) => n + figOf(du)).join(' ');
  }).join(' '));
  return `| ${out.join(' | ')} |`;
}
// Lo que suena: las notas del texto realizado (parseScore) con su altura real
export const ornamentedTokens = (partitura, ornamentos, armadura = 0) => scoreTokens(realizeOrnaments(partitura, ornamentos, armadura));
