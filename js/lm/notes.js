// Lenguaje musical: utilidades puras de notas (escalón en el pentagrama, nombres, intervalos, escalas y comparación
// de la voz en cualquier octava). Sin DOM: las usan los ejercicios, la corrección y las pruebas.
import { parseNote, diatonicStep, noteLabel, freqToMidi, parseScore } from '../music.js';

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACC_TEXT = { '-1': 'b', 0: '', 1: '#' };
// Línea inferior del pentagrama: Mi4 en clave de sol y Sol2 en clave de fa (mismo escalón que note-writer.js)
export const CLEF_BOTTOM = { treble: 30, bass: 18 };
// Duración en pulsos de negra de cada figura de los ejercicios
export const FIGURE_BEATS = { w: 4, 'h.': 3, h: 2, 'q.': 1.5, q: 1, 'e.': 0.75, e: 0.5, s: 0.25 };
export const FIGURE_NAME = { w: 'Redonda', 'h.': 'Blanca con puntillo', h: 'Blanca', 'q.': 'Negra con puntillo', q: 'Negra', 'e.': 'Corchea con puntillo', e: 'Corchea', s: 'Semicorchea' };
export const REST_NAME = { w: 'Silencio de redonda', h: 'Silencio de blanca', 'h.': 'Silencio de blanca con puntillo', q: 'Silencio de negra', 'q.': 'Silencio de negra con puntillo', e: 'Silencio de corchea' };

export const stepOf = name => diatonicStep(parseNote(name));
export const nameOfStep = step => LETTERS[((step % 7) + 7) % 7] + Math.floor(step / 7);
export const midiOf = name => parseNote(name).midi;

// ---------- Altura real: alteraciones y armadura ----------
// La corrección compara la altura (midi) y no el escalón del pentagrama: Fa♯ y Fa no son la misma nota.
// armadura: 0 (sin alteraciones), -1 (un bemol: si♭), 1 (un sostenido: fa♯)… hasta ±7 (orden de bemoles y de sostenidos)
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
export const ACC_SYMBOL = { '-1': '♭', 0: '♮', 1: '♯' };
// Alteración que la armadura pone a una letra (-1, 0 o 1)
export function keyAcc(letter, armadura = 0) {
  if (!armadura) return 0;
  return armadura < 0 ? (FLAT_ORDER.slice(0, -armadura).includes(letter) ? -1 : 0) : (SHARP_ORDER.slice(0, armadura).includes(letter) ? 1 : 0);
}
// Nombre de una nota por su escalón: alteración explícita (-1, 0, 1) o, si no la hay, la de la armadura
export function pitchName(step, armadura = 0, acc = null) {
  const letter = LETTERS[((step % 7) + 7) % 7];
  const a = acc === null || acc === undefined ? keyAcc(letter, armadura) : acc;
  return letter + (ACC_TEXT[a] ?? '') + Math.floor(step / 7);
}
// Altura (midi) de una ficha de la partitura: la suya, o la de su nombre, o la de su escalón (sin alteración)
export const tokenMidi = t => (t.midi ?? midiOf(t.name || nameOfStep(t.step)));
// Escalón (posición en el pentagrama) de una ficha con nombre o con escalón
export const tokenStep = t => (t.step ?? stepOf(t.name));
// Nombre con alteración de una ficha escrita en el pentagrama
export const tokenName = t => t.name || nameOfStep(t.step);
// Alteración escrita en el nombre de una nota («Bb4» → -1)
export const accOfName = name => { const m = /^[A-G]([#b]?)[0-9]/.exec(name); return m ? (m[1] === '#' ? 1 : m[1] === 'b' ? -1 : 0) : 0; };
// Ficha escrita en el pentagrama (escalón + alteración opcional + armadura) → nombre y altura reales. Las alteraciones
// valen hasta la barra de compás, para la misma nota (y octava); «bars»: compás de cada ficha
export function resolvePitches(tokens, { armadura = 0, bars = null } = {}) {
  let state = {};
  let bar = null;
  return tokens.map((t, i) => {
    if (t.rest || t.step === undefined || t.step === null) return t;
    const b = bars ? bars[i] : 0;
    if (b !== bar) { state = {}; bar = b; }
    const explicit = t.acc === '#' ? 1 : t.acc === 'b' ? -1 : t.acc === 'n' ? 0 : (t.acc === 1 || t.acc === -1 || t.acc === 0) ? t.acc : null;
    const letter = LETTERS[((t.step % 7) + 7) % 7];
    const key = t.step;
    const acc = explicit !== null ? explicit : (key in state ? state[key] : keyAcc(letter, armadura));
    state[key] = acc;
    const name = letter + (ACC_TEXT[acc] ?? '') + Math.floor(t.step / 7);
    return { ...t, name, midi: midiOf(name) };
  });
}
// Alteración que hay que DIBUJAR delante de cada nota (null = ninguna): la que la armadura no pone ya, la que contradice
// una alteración anterior del mismo compás y, de cortesía, el becuadro (o la alteración) de una nota que el compás
// anterior llevó alterada. bars: compás de cada ficha. Devuelve '#' | 'b' | 'n' | null por ficha
export function accidentalSigns(tokens, bars, armadura = 0) {
  let state = {};
  let before = {};
  let bar = null;
  return tokens.map((t, i) => {
    if (t.rest || t.step === undefined || t.step === null) return null;
    if (bars[i] !== bar) { before = bar === null ? {} : state; state = {}; bar = bars[i]; }
    const letter = LETTERS[((t.step % 7) + 7) % 7];
    const acc = accOfName(t.name || nameOfStep(t.step));
    const current = t.step in state ? state[t.step] : keyAcc(letter, armadura);
    const signOf = a => (a === 1 ? '#' : a === -1 ? 'b' : 'n');
    let sign = null;
    if (acc !== current) sign = signOf(acc);
    else if (!(t.step in state) && t.step in before && before[t.step] !== acc) sign = signOf(acc); // cortesía
    state[t.step] = acc;
    return sign;
  });
}
// Coinciden dos fichas en altura real (las dos con nombre o con escalón)
export const samePitch = (a, b) => !!a && !!b && !a.rest && !b.rest && tokenMidi(a) === tokenMidi(b);

// Nombre de la nota para el alumno: Do, Re, Mi… (o C4, D4… con la notación en letras)
export const noteText = (name, nom) => noteLabel(parseNote(name), nom);
// Solo la letra o la sílaba, sin octava (para los botones de «nombra la nota»)
export const letterText = (letter, nom) => (nom === 'us' ? letter : noteLabel({ letter, acc: 0, oct: 4 }, 'eu'));

// Dónde está una nota en el pentagrama, dicho con palabras (para el lector de pantalla, sin revelar su nombre)
const ORD = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta'];
const ORD_SPACE = ['primer', 'segundo', 'tercer', 'cuarto'];
export function positionText(step, clef = 'treble') {
  const rel = step - CLEF_BOTTOM[clef];
  if (rel >= 0 && rel <= 8) return rel % 2 === 0 ? `${ORD[rel / 2]} línea` : `${ORD_SPACE[(rel - 1) / 2]} espacio`;
  if (rel < 0) {
    if (rel === -1) return 'debajo del pentagrama';
    return rel % 2 === 0 ? `línea adicional ${-rel / 2} por debajo` : `debajo de la línea adicional ${(-rel - 1) / 2}`;
  }
  if (rel === 9) return 'encima del pentagrama';
  return rel % 2 === 0 ? `línea adicional ${(rel - 8) / 2} por encima` : `encima de la línea adicional ${(rel - 9) / 2}`;
}

// Intervalo entre dos notas: número (2.ª, 3.ª…) y calidad (M mayor, m menor, J justa, A aumentada, d disminuida)
const PERFECT = new Set([1, 4, 5, 8]);
const MAJOR_SEMIS = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12 };
export function interval(a, b) {
  const [lo, hi] = midiOf(a) <= midiOf(b) ? [a, b] : [b, a];
  const number = stepOf(hi) - stepOf(lo) + 1;
  const simple = ((number - 1) % 7) + 1;
  const octaves = Math.floor((number - 1) / 7);
  const semis = midiOf(hi) - midiOf(lo) - octaves * 12;
  const diff = semis - MAJOR_SEMIS[simple];
  const quality = PERFECT.has(simple)
    ? ({ 0: 'J', 1: 'A', '-1': 'd' })[diff] ?? '?'
    : ({ 0: 'M', '-1': 'm', 1: 'A', '-2': 'd' })[diff] ?? '?';
  return { number, quality, code: `${number}${quality}` };
}

// Escala de una tonalidad (mayor o menor natural) desde la tónica en una octava: ['C4','D4',…,'C5']
const STEPS = { mayor: [0, 2, 4, 5, 7, 9, 11, 12], menor: [0, 2, 3, 5, 7, 8, 10, 12] };
export function scale(tonic, mode = 'mayor') {
  const t = parseNote(tonic);
  const l0 = LETTERS.indexOf(t.letter);
  return STEPS[mode].map((semi, i) => {
    const letter = LETTERS[(l0 + i) % 7];
    const oct = t.oct + Math.floor((l0 + i) / 7);
    const natural = (oct + 1) * 12 + LETTER_PC[letter];
    const acc = t.midi + semi - natural;
    return letter + (ACC_TEXT[acc] ?? '') + oct;
  });
}

// Grado de la escala (1 = tónica; 0 o negativo, por debajo; 8 = octava) → nota
export function degreeNote(tonic, degree, mode = 'mayor') {
  const notes = scale(tonic, mode);
  const k = degree - 1;
  const oct = Math.floor(k / 7);
  const base = notes[((k % 7) + 7) % 7];
  const p = parseNote(base);
  return p.letter + (ACC_TEXT[p.acc] ?? '') + (p.oct + oct);
}

// Distancia en cents a la nota buscada en la octava más cercana (la voz vale en cualquier octava): de −600 a 600
export function centsAnyOctave(freq, targetMidi) {
  const diff = (freqToMidi(freq) - targetMidi) * 100;
  return ((((diff + 600) % 1200) + 1200) % 1200) - 600;
}

// Octava cómoda para la voz: la tónica más cercana por debajo del centro de la voz (para tocar las referencias)
export function voiceTonic(tonic, centerMidi) {
  if (!Number.isFinite(centerMidi)) return tonic;
  const t = parseNote(tonic);
  const pc = t.midi % 12;
  let midi = Math.floor((centerMidi - pc) / 12) * 12 + pc;
  if (centerMidi - midi > 7) midi += 12;
  const oct = Math.floor(midi / 12) - 1;
  return t.letter + (ACC_TEXT[t.acc] ?? '') + oct;
}

// Notas en texto («C4q D4h Rq») → [{ step, name, dur } | { rest: true, dur }]
const TOKEN_RE = /^(R|[A-G][#b]?\d)(w|h\.|h|q\.|q|e\.|e|s)$/;
export function parseTokens(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).map(raw => {
    const m = TOKEN_RE.exec(raw);
    if (!m) throw new Error('Figura no válida: ' + raw);
    return m[1] === 'R' ? { rest: true, dur: m[2] } : { step: stepOf(m[1]), name: m[1], dur: m[2] };
  });
}
// Y al revés, para guardar o reproducir: [{ step, dur }] → «C4q D4h Rq»
export const tokensText = tokens => tokens.map(t => (t.rest ? 'R' : t.name || nameOfStep(t.step)) + t.dur).join(' ');

// Partitura para playScore: [{ midi, start, beats, rest }]
export function tokensToNotes(tokens) {
  let start = 0;
  return tokens.map(t => {
    const beats = FIGURE_BEATS[t.dur];
    const n = t.rest ? { rest: true, start, beats } : { midi: midiOf(nameOfStep(t.step)), start, beats, rest: false };
    start += beats;
    return n;
  });
}

// Partitura del catálogo («| C4q E4q G4h |») → notas con escalón, figura, pulsos, inicio y compás (0, 1…)
const ACC_NAME = { '-1': 'b', 0: '', 1: '#' };
export function scoreTokens(text) {
  const notes = parseScore(text).notes;
  return notes.map((n, i) => {
    const prev = notes[i - 1];
    // ligadura de prolongación: la nota liga con la siguiente si es la misma altura (la continuación no es un ataque nuevo)
    const tiedFrom = !!(prev && prev.tie && !n.rest && !prev.rest && prev.midi === n.midi);
    const tie = !!(n.tie && notes[i + 1] && !n.rest && notes[i + 1].midi === n.midi);
    return {
      rest: n.rest, dur: n.dur + (n.dots ? '.'.repeat(n.dots) : ''), beats: n.beats, start: n.start, bar: n.bar,
      ...(n.rest ? {} : { step: diatonicStep(n), name: n.letter + (ACC_NAME[n.acc] ?? '') + n.oct, midi: n.midi, acc: n.acc }),
      ...(tie ? { tie: true } : {}), ...(tiedFrom ? { tiedFrom: true } : {}),
    };
  });
}
// Las notas que se tocan o se cantan: una nota ligada es UNA sola (su duración suma la de sus continuaciones).
// Cada ficha devuelta lleva «index» (su posición en la lista de fichas que se pintan)
export function attackTokens(tokens) {
  const out = [];
  tokens.forEach((t, i) => {
    if (t.tiedFrom && out.length) { out[out.length - 1].beats += t.beats; return; }
    out.push({ ...t, index: i });
  });
  return out;
}
// Pulsos por compás de un compás escrito («3/4» → 3, «6/8» → 3)
export const barBeatsOf = meter => { const [num, den] = String(meter || '4/4').split('/').map(Number); return num * 4 / den; };
// Compás compuesto (6/8, 9/8, 12/8): el pulso es la negra con puntillo (1,5 pulsos de negra); si no, la negra
export const isCompound = meter => { const [num, den] = String(meter || '4/4').split('/').map(Number); return den === 8 && num % 3 === 0 && num >= 6; };
export const pulseBeatsOf = meter => (isCompound(meter) ? 1.5 : 1);
// Pulso de un ejercicio: su campo «pulso» («q.») o el del compás
export const pulseOfParams = p => (p && p.pulso === 'q.' ? 1.5 : p && p.compas ? pulseBeatsOf(p.compas) : 1);
// Nombres de nota en solfeo del contenido («sol4», «do») → letra («G4», «C»)
const SOLFA = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };
export function solfaToName(text) {
  const m = /^(do|re|mi|fa|sol|la|si)(#|b|♯|♭)?(\d)?$/i.exec(String(text).trim());
  if (!m) return null;
  const acc = m[2] ? ({ '#': '#', '♯': '#', b: 'b', '♭': 'b' })[m[2]] : '';
  return SOLFA[m[1].toLowerCase()] + acc + (m[3] ?? '');
}

// Transporta una nota por octavas (para cantar en la octava de la voz)
export function shiftOctave(name, octaves) {
  const p = parseNote(name);
  return p.letter + (ACC_TEXT[p.acc] ?? '') + (p.oct + octaves);
}
