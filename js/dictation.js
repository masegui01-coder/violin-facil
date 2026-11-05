// Dictado musical: niveles y generador de dictados (melódicos y, para percusión, rítmicos).
// Todo determinista con semilla y en notas ESCRITAS dentro del registro del instrumento (sirve para transpositores:
// la reproducción suma la transposición, como el resto de la app). Sin DOM: se prueba con node --test.
// Cada dictado es una frase: antecedente que acaba en semicadencia y consecuente que repite el ritmo (y el arranque
// melódico) del primer compás y cierra en la tónica. Sin tritonos ni intervalos aumentados o disminuidos.
import { rng, scaleNames, fit, MAJOR, DUR, bars, keyLabel } from './generate.js';
import { parseNote, parseScore } from './music.js';

export const LEVEL_COUNT = 10;
export const BAR_OPTIONS = [2, 4, 8];
// Ocho compases de memoria solo en los niveles de iniciación
const LONG_BARS_MAX_LEVEL = 5;
// Dos compases no caben en 2/4 (cuatro pulsos no dan para la novedad del nivel) ni en «La escala» (no llega a la octava)
const SCALE_LEVEL = 3;
// (en 2/4, «La escala» necesita los ocho compases para recorrer la octava)
export const barsFor = (level, meter = '4/4', rhythmOnly = false) => BAR_OPTIONS.filter(b => (b < 8 || level <= LONG_BARS_MAX_LEVEL)
  && !(b === 2 && (meter === '2/4' || (!rhythmOnly && level === SCALE_LEVEL)))
  && !(b === 4 && meter === '2/4' && !rhythmOnly && level === SCALE_LEVEL));
export const METERS = ['2/4', '3/4', '4/4', '6/8'];
export const LISTENS = 3;
export const EXTRA_LISTEN_PENALTY = 5;
export const PASS_PCT = 80;
// Pulsos (en negras) de cada compás; el 6/8 son dos partes de negra con puntillo
const METER_BEATS = { '2/4': 2, '3/4': 3, '4/4': 4, '6/8': 3 };
export const meterBeatsOf = meter => METER_BEATS[meter];
export const meterParts = meter => meter.split('/').map(Number);
const EPS = 1e-6;
const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];
// Densidad máxima (notas por compás de media) y semicorcheas seguidas
const MAX_NOTES_PER_BAR = 3.75;
const MAX_SIXTEENTH_RUN = 4;
const RHYTHM_TRIES = 150;
const MELODY_TRIES = 150;
const MIN_SCALE_NOTES_PER_BEAT = 0.6;

// Células rítmicas en negras; un valor negativo es un silencio de esa duración
const SIMPLE = {
  h: [2], qq: [1, 1], q: [1], w: [4], ee: [0.5, 0.5], dq: [1.5, 0.5], dh: [3], rq: [-1], re: [-0.5, 0.5],
  de: [0.75, 0.25], ssss: [0.25, 0.25, 0.25, 0.25], ess: [0.5, 0.25, 0.25], sse: [0.25, 0.25, 0.5], sync: [0.5, 1, 0.5], ses: [0.25, 0.5, 0.25],
};
// 6/8: cada célula ocupa una parte (1,5) o el compás entero (3)
const COMPOUND = {
  dq: [1.5], qe: [1, 0.5], eee: [0.5, 0.5, 0.5], dh: [3], ere: [0.5, -0.5, 0.5], qre: [1, -0.5], ree: [-0.5, 0.5, 0.5],
  esse: [0.5, 0.25, 0.25, 0.5], ssee: [0.25, 0.25, 0.5, 0.5], dese: [0.75, 0.25, 0.5],
};
const C68 = ['dq', 'qe', 'eee', 'dh'];
const C68_RESTS = [...C68, 'qre', 'ree', 'ere'];
const B = ['h', 'qq', 'q'];
const ALL_METERS = ['2/4', '3/4', '4/4', '6/8'];
const SIMPLE_METERS = ['2/4', '3/4', '4/4'];
const BASE7 = [...B, 'rq', 'ee', 'dq', 'dh'];

// Niveles melódicos: una novedad en cada uno. span: grados alrededor de la tónica; moves: saltos (en grados);
// chord: saltos por el acorde de tónica; finals: penúltima nota posible (grado) antes de la tónica final.
const LEAPS = { span: [-3, 7], moves: [1, 2, 3, 4], chord: true, finals: [1, -1, 4, -3] };
export const MELODIC_LEVELS = [
  { name: 'Tres notas', desc: 'Grados 1.º, 2.º y 3.º por grado conjunto; negras, blancas y una nota larga al final', span: [0, 2], moves: [1], simple: B, meters: ['2/4', '4/4'], bpm: 72 },
  { name: 'Pentacordo', desc: 'Cinco notas por grado conjunto y el silencio de negra', span: [0, 4], moves: [1], simple: [...B, 'rq'], meters: ['2/4', '4/4'], bpm: 72, novel: ['rq'] },
  { name: 'La escala', desc: 'Toda la escala, dentro de la octava, por grado conjunto', span: [0, 7], moves: [1], simple: [...B, 'rq'], meters: ['2/4', '4/4'], bpm: 72, check: 'high' },
  { name: 'Terceras y acorde de tónica', desc: 'Saltos de 3.ª y por el acorde de tónica: 3.ª, 5.ª y 8.ª', span: [0, 7], moves: [1, 2], chord: true, simple: [...B, 'rq'], meters: ['2/4', '4/4'], bpm: 72, check: 'third' },
  { name: 'Corcheas', desc: 'Dos corcheas por parte', span: [0, 7], moves: [1, 2], chord: true, simple: [...B, 'rq', 'ee'], meters: ['2/4', '4/4'], bpm: 72, novel: ['ee'] },
  { name: 'Puntillos y 3/4', desc: 'Negra con puntillo, blanca con puntillo y compás de 3/4', span: [0, 7], moves: [1, 2], chord: true, simple: BASE7, meters: SIMPLE_METERS, bpm: 69, novel: ['dq', 'dh'] },
  { name: 'Cuartas, quintas y graves', desc: 'Saltos de 4.ª y 5.ª y notas por debajo de la tónica', ...LEAPS, simple: BASE7, meters: SIMPLE_METERS, bpm: 66, check: 'fourth' },
  { name: 'Compás de 6/8', desc: 'Binario compuesto: dos partes de negra con puntillo, con silencios', ...LEAPS, simple: BASE7, compound: C68_RESTS, meters: ['6/8'], bpm: 66, bpm68: 96, novel: ['qre', 'ree', 'ere'] },
  { name: 'Menor armónica', desc: 'Tonalidad menor, con la sensible al subir a la tónica', ...LEAPS, minor: 1, cadence: true, simple: BASE7, compound: C68_RESTS, meters: ALL_METERS, bpm: 66, bpm68: 96, finals: [-1], check: 'leading' },
  { name: 'Alteraciones y semicorcheas', desc: 'Alteraciones accidentales habituales y semicorcheas por grado conjunto', ...LEAPS, minor: 0.35, nearKeys: true, chromatic: true, cadence: true, simple: [...BASE7, 'ssss', 'ess', 'sse'], compound: [...C68_RESTS, 'esse', 'ssee'], meters: ALL_METERS, bpm: 63, bpm68: 90, novel: ['ssss', 'ess', 'sse', 'esse', 'ssee'] },
];

// Niveles rítmicos (percusión): solo cuenta el ritmo. Lo aprendido sigue apareciendo en los niveles siguientes.
const R4 = [...B, 'w', 'rq', 'ee', 'sync', 'dh'];
const R6 = [...R4, 'dq', 're'];
export const RHYTHM_LEVELS = [
  { name: 'Negras, blancas y redondas', desc: 'El pulso con negras, blancas y redondas', simple: [...B, 'w'], meters: ['2/4', '4/4'], bpm: 72 },
  { name: 'Silencio de negra', desc: 'Negras, blancas y silencios de negra', simple: [...B, 'w', 'rq'], meters: ['2/4', '4/4'], bpm: 72, novel: ['rq'] },
  { name: 'Corcheas', desc: 'Dos corcheas por parte', simple: [...B, 'w', 'rq', 'ee'], meters: ['2/4', '4/4'], bpm: 72, novel: ['ee'] },
  { name: 'Síncopa y 3/4', desc: 'Corchea, negra y corchea; blanca con puntillo y compás de 3/4', simple: R4, meters: SIMPLE_METERS, bpm: 72, novel: ['sync', 'dh'] },
  { name: 'Negra con puntillo', desc: 'Negra con puntillo y corchea', simple: [...R4, 'dq'], meters: SIMPLE_METERS, bpm: 72, novel: ['dq'] },
  { name: 'Silencio de corchea', desc: 'Contratiempos con silencio de corchea', simple: R6, meters: SIMPLE_METERS, bpm: 72, novel: ['re'] },
  { name: 'Compás de 6/8', desc: 'Binario compuesto: dos partes de negra con puntillo', simple: R6, compound: C68_RESTS, meters: ['6/8'], bpm: 66, bpm68: 96 },
  { name: 'Semicorcheas', desc: 'Cuatro semicorcheas por parte', simple: [...R6, 'ssss'], compound: [...C68_RESTS, 'ssee'], meters: ALL_METERS, bpm: 66, bpm68: 96, novel: ['ssss', 'ssee'] },
  { name: 'Corchea y semicorcheas', desc: 'Corchea y dos semicorcheas, y al revés', simple: [...R6, 'ssss', 'ess', 'sse'], compound: [...C68_RESTS, 'esse', 'ssee'], meters: ALL_METERS, bpm: 66, bpm68: 96, novel: ['ess', 'sse', 'esse'] },
  { name: 'Puntillo de corchea y síncopas', desc: 'Corchea con puntillo y semicorchea, y síncopas de semicorchea', simple: [...R6, 'ssss', 'ess', 'sse', 'de', 'ses'], compound: [...C68_RESTS, 'esse', 'ssee', 'dese'], meters: ALL_METERS, bpm: 63, bpm68: 90, novel: ['de', 'ses', 'dese'] },
];

export const levelsFor = rhythmOnly => (rhythmOnly ? RHYTHM_LEVELS : MELODIC_LEVELS);
export const levelConfig = (level, rhythmOnly) => levelsFor(rhythmOnly)[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
export const metersFor = (level, rhythmOnly) => levelConfig(level, rhythmOnly).meters;
export const bpmFor = (cfg, meter) => (meter === '6/8' && cfg.bpm68 ? cfg.bpm68 : cfg.bpm);

const cellsFor = (cfg, meter) => (meter === '6/8' ? (cfg.compound || []).map(c => COMPOUND[c]) : cfg.simple.map(c => SIMPLE[c]));
// Células con su nombre (para comprobar que sale la novedad del nivel)
const namedCells = (cfg, meter) => (meter === '6/8' ? (cfg.compound || []).map(k => ({ key: k, cell: COMPOUND[k] })) : cfg.simple.map(k => ({ key: k, cell: SIMPLE[k] })));
// Novedad rítmica del nivel que cabe en ese compás (vacía si el nivel no tiene o no cabe)
export const novelCells = (cfg, meter) => (cfg.novel || []).filter(k => namedCells(cfg, meter).some(c => c.key === k));
const NOVEL_WEIGHT = 3;
const cellLen = cell => cell.reduce((s, x) => s + Math.abs(x), 0);

// Rejilla para cuantizar lo que se toca: la corchea, o la semicorchea si el nivel la tiene
export function quantumFor(level, rhythmOnly, meter) {
  return Math.min(0.5, ...cellsFor(levelConfig(level, rhythmOnly), meter).flat().map(Math.abs));
}

// ---------- Ritmo ----------
// Dónde puede empezar una célula: las de dos partes en 4/4, en parte fuerte; las de un compás entero, al principio
function fitsAt(cell, pos, length, meter) {
  const len = cellLen(cell);
  if (len > length - pos + EPS) return false;
  if (len >= 3 - EPS) return pos < EPS;
  if (meter === '4/4' && Math.abs(len - 2) < EPS) return Math.abs(pos % 2) < EPS;
  return true;
}

const isSixteenth = x => x > 0 && x <= 0.25 + EPS;
function sixteenthRun(values) {
  let run = 0;
  for (let i = values.length - 1; i >= 0 && isSixteenth(values[i]); i--) run++;
  return run;
}
const leadingSixteenths = cell => { let k = 0; while (k < cell.length && isSixteenth(cell[k])) k++; return k; };

// Un trozo de compás de ritmo (length pulsos): lista de duraciones (negativas = silencios)
// cells: [{ key, cell }]; used: donde se apuntan las células elegidas; novel: las que se prefieren
function rhythmSpan(r, cells, length, meter, { first = false, prev = [], used = null, novel = [] } = {}) {
  const out = [];
  let pos = 0;
  for (let guard = 0; pos < length - EPS && guard < 40; guard++) {
    const before = [...prev, ...out];
    const lastRest = before.length ? before[before.length - 1] < 0 : false;
    const options = cells.filter(({ cell: c }) => fitsAt(c, pos, length, meter)
      && !(c[0] < 0 && (lastRest || (first && pos < EPS)))
      && sixteenthRun(before) + leadingSixteenths(c) <= MAX_SIXTEENTH_RUN);
    if (!options.length) break;
    const { key, cell } = pickWeighted(r, options, options.map(o => (novel.includes(o.key) ? NOVEL_WEIGHT : 1)));
    if (used) used.add(key);
    out.push(...cell);
    pos += cellLen(cell);
  }
  for (const v of [1, 0.5, 0.25]) while (length - pos >= v - EPS) { out.push(v); pos += v; }
  return out;
}

// Compás de semicadencia: termina con una nota larga
const SEMI_LONG = { '2/4': 1, '3/4': 2, '4/4': 2, '6/8': 1.5 };
function semiBar(r, cells, barBeats, meter, opts) {
  const long = SEMI_LONG[meter];
  const head = barBeats - long > EPS ? rhythmSpan(r, cells, barBeats - long, meter, opts) : [];
  return [...head, long];
}

const noteCount = plan => plan.flat().filter(x => x > 0).length;
const sameBar = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < EPS);

function planOk(plan, barCount) {
  const notes = noteCount(plan);
  if (notes < 3 || notes > Math.round(MAX_NOTES_PER_BAR * barCount)) return false;
  // variedad: el mismo ritmo de compás, nunca tres veces seguidas ni en más de la mitad de la frase (en 4 compases, dos)
  const maxSame = Math.max(2, Math.ceil(barCount / 2));
  const noRuns = plan.every((b, i) => i < 2 || !(sameBar(b, plan[i - 1]) && sameBar(b, plan[i - 2])));
  return noRuns && plan.every(b => plan.filter(o => sameBar(o, b)).length <= maxSame);
}

// Ritmo de la frase: compás 1 = motivo; con 4 u 8 compases, el consecuente repite el motivo tras la semicadencia
export function rhythmPlan(r, cfg, meter, barCount) {
  const barBeats = METER_BEATS[meter];
  const cells = namedCells(cfg, meter);
  const novel = novelCells(cfg, meter);
  // nota final de compás entero, salvo que el nivel (limitado por el curso) aún no tenga esa figura: entonces, pulsos
  const wholeBar = cells.some(c => c.cell.length === 1 && Math.abs(c.cell[0] - barBeats) < EPS);
  const restOk = cells.some(c => c.key === 'rq');
  const beats = Math.round(barBeats);
  const pulses = Array.from({ length: beats }, (_, k) => (restOk && k === beats - 1 ? -1 : 1));
  const end = !cfg.limited || wholeBar ? [barBeats] : pulses;
  let fallback = null;
  for (let attempt = 0; attempt < RHYTHM_TRIES; attempt++) {
    const used = new Set();
    const motif = rhythmSpan(r, cells, barBeats, meter, { first: true, used, novel });
    if (noteCount([motif]) < 2) continue;
    const plan = [motif];
    const add = () => plan.push(rhythmSpan(r, cells, barBeats, meter, { prev: plan[plan.length - 1], used, novel }));
    if (barCount === 2) plan.push(end);
    else {
      const half = barCount / 2;
      for (let b = 1; b < half - 1; b++) add();
      plan.push(semiBar(r, cells, barBeats, meter, { prev: plan[plan.length - 1], used, novel }));
      plan.push(motif);
      for (let b = half + 1; b < barCount - 1; b++) add();
      plan.push(end);
    }
    if (!planOk(plan, barCount)) continue;
    // la novedad rítmica del nivel tiene que sonar
    if (!novel.length || novel.some(k => used.has(k))) return plan;
    fallback ||= plan;
  }
  if (fallback) return fallback;
  const pulse = meter === '6/8' ? 1.5 : 1;
  return [...Array.from({ length: barCount - 1 }, () => Array(Math.round(barBeats / pulse)).fill(pulse)), end];
}

// ---------- Intervalos ----------
const LETTERS = 'CDEFGAB';
const OK_SEMIS = { 0: [0], 1: [1, 2], 2: [3, 4], 3: [5], 4: [7], 5: [8, 9], 6: [10, 11] };
// Intervalo melódico «de solfeo»: mayores, menores y justos (sin tritono ni aumentados o disminuidos).
// chromatic: admite el semitono cromático (Fa → Fa♯) de las alteraciones de paso.
export function intervalOk(a, b, chromatic = false) {
  const steps = (LETTERS.indexOf(b.letter) + 7 * b.oct) - (LETTERS.indexOf(a.letter) + 7 * a.oct);
  const semis = b.midi - a.midi;
  if (steps === 0) return semis === 0 || (chromatic && Math.abs(semis) === 1);
  if (Math.sign(steps) !== Math.sign(semis)) return false;
  const k = Math.abs(steps) % 7;
  const o = Math.floor(Math.abs(steps) / 7);
  return OK_SEMIS[k].some(x => x + 12 * o === Math.abs(semis));
}

// ---------- Melodía ----------
const CHORD_DEGREES = new Set([0, 2, 4]);
const CHORD_STEPS = new Set([2, 4, 7]);
const mod7 = d => ((d % 7) + 7) % 7;
function contiguousReach(moves) {
  let n = 0;
  while (moves.includes(n + 1)) n++;
  return Math.max(1, n);
}
const BIG_LEAP_SEMIS = 7;
const SHORT = 0.25 + EPS;

// ¿Se puede ir del grado a al b entre las notas i-1 e i? (saltos del nivel, acorde, figuras y calidad del intervalo)
function moveOk(ctx, a, b, i) {
  const { cfg, beats, noteOf } = ctx;
  const d = b - a;
  // en menor armónica la sensible sube siempre a la tónica
  if (ctx.minor && mod7(a) === 6 && d !== 1) return false;
  if (d === 0) return beats[i] >= 1 && beats[i - 1] >= 1; // repetir nota solo en figuras largas
  if ((beats[i] <= SHORT || beats[i - 1] <= SHORT) && Math.abs(d) !== 1) return false; // semicorcheas por grado conjunto
  // por el acorde de tónica: hasta el nivel 6, solo 3.ª, 5.ª y 8.ª; desde el 7, entre cualquier par de notas del acorde
  const byChord = cfg.chord && CHORD_DEGREES.has(mod7(a)) && CHORD_DEGREES.has(mod7(b)) && Math.abs(d) <= 7
    && (cfg.finals || CHORD_STEPS.has(Math.abs(d)));
  if (!cfg.moves.includes(Math.abs(d)) && !byChord) return false;
  const na = noteOf(a), nb = noteOf(b);
  if (Math.abs(nb.midi - na.midi) > BIG_LEAP_SEMIS && (beats[i] < 1 || beats[i - 1] < 1)) return false;
  return intervalOk(na, nb);
}

// Dos saltos seguidos en el mismo sentido no pueden dibujar un tritono, una 7.ª ni pasar de la octava
const BAD_OUTLINE = new Set([6, 10, 11]);
function contourOk(ctx, a, b, c) {
  const m1 = b - a, m2 = c - b;
  if (Math.abs(m1) < 2 || Math.abs(m2) < 2 || Math.sign(m1) !== Math.sign(m2)) return true;
  const span = Math.abs(ctx.noteOf(c).midi - ctx.noteOf(a).midi);
  return span <= 12 && !BAD_OUTLINE.has(span);
}

// Pasos pequeños más probables; repetir nota, poco; tras un salto, vuelta por grados en sentido contrario
const LEAP = 3;
function weightOf(from, to, lastMove) {
  if (from === to) return 0.15;
  const move = to - from;
  let w = 1 / Math.abs(move);
  if (Math.abs(lastMove) >= LEAP) w *= Math.sign(move) !== Math.sign(lastMove) && Math.abs(move) <= 2 ? 3 : 0.25;
  return w;
}

function pickWeighted(r, items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let x = r() * total;
  for (let i = 0; i < items.length; i++) { x -= weights[i]; if (x <= 0) return items[i]; }
  return items[items.length - 1];
}

// Rellena degrees[from+1 .. to] para llegar al grado target en la nota «to». false si no hay camino.
function walk(r, ctx, degrees, from, to, target) {
  const [lo, hi] = ctx.span;
  for (let i = from + 1; i < to; i++) {
    const prev = degrees[i - 1];
    const left = to - i;
    const lastMove = i > 1 ? prev - degrees[i - 2] : 0;
    const options = [];
    for (let d = lo; d <= hi; d++) {
      if (!moveOk(ctx, prev, d, i) || Math.abs(d - target) > ctx.reach * left) continue;
      if (i > 1 && !contourOk(ctx, degrees[i - 2], prev, d)) continue;
      if (left === 1 && !moveOk(ctx, d, target, i + 1)) continue;
      options.push(d);
    }
    if (!options.length) return false;
    degrees[i] = pickWeighted(r, options, options.map(d => weightOf(prev, d, lastMove)));
  }
  degrees[to] = target;
  return to === from || moveOk(ctx, degrees[to - 1], target, to);
}

const pick = (r, xs) => xs[Math.floor(r() * xs.length)];

// Grados de toda la frase según el plan rítmico: empieza y acaba en la tónica, semicadencia (2.º o 5.º grado) a mitad
// y el consecuente repite el arranque del motivo mientras se pueda llegar a la cadencia final
export function phraseDegrees(r, plan, ctx) {
  const perBar = plan.map(b => b.filter(x => x > 0).length);
  const n = perBar.reduce((sum, x) => sum + x, 0);
  const firstOf = bar => perBar.slice(0, bar).reduce((sum, x) => sum + x, 0);
  const [lo, hi] = ctx.span;
  // la tónica de arriba también vale para empezar o acabar cuando el nivel abarca la octava
  const tonics = hi >= 7 ? [0, 7] : [0];
  const first = tonics.includes(ctx.first) ? ctx.first : pick(r, tonics);
  const last = pick(r, tonics);
  const finals = (ctx.cfg.finals || [1]).map(f => last + f).filter(d => d >= lo && d <= hi);
  if (!finals.length) return null;
  const degrees = new Array(n).fill(first);
  const pen = n - 2;
  const penTarget = pick(r, finals);
  let start = 0;
  if (plan.length > 2) {
    const semiIdx = firstOf(plan.length / 2) - 1;
    const semi = pick(r, [1, ...(ctx.cfg.chord && hi >= 4 ? [4] : [])]);
    if (!walk(r, ctx, degrees, 0, semiIdx, semi)) return null;
    start = semiIdx;
    const consStart = semiIdx + 1;
    // el consecuente repite el arranque del motivo si se puede enlazar
    if (consStart < pen && moveOk(ctx, semi, first, consStart)) {
      degrees[consStart] = first;
      start = consStart;
      for (let k = 1; k < perBar[0] && consStart + k < pen; k++) {
        const d = degrees[k];
        const at = consStart + k;
        if (!moveOk(ctx, degrees[at - 1], d, at) || !contourOk(ctx, degrees[at - 2], degrees[at - 1], d) || Math.abs(d - penTarget) > ctx.reach * (pen - at)) break;
        degrees[at] = d;
        start = at;
      }
    }
  }
  if (!walk(r, ctx, degrees, start, pen, penTarget)) return null;
  degrees[n - 1] = last;
  return moveOk(ctx, penTarget, last, n - 1) ? degrees : null;
}

// Novedad melódica del nivel: pasa del pentacordo, salta una 3.ª o más, salta una 4.ª (o baja de la tónica)
// o resuelve la sensible en la tónica
const pcOf = m => ((m % 12) + 12) % 12;
const MELODIC_CHECKS = {
  high: (notes, degrees) => degrees.some(d => d >= 5) && new Set(notes.map(n => n.midi)).size >= 6,
  third: notes => notes.some((n, i) => i && Math.abs(n.midi - notes[i - 1].midi) >= 3),
  fourth: (notes, degrees) => degrees.some(d => d < 0) || notes.some((n, i) => i && Math.abs(n.midi - notes[i - 1].midi) === 5),
  leading: (notes, degrees, tonicMidi) => notes.some((n, i) => i && pcOf(notes[i - 1].midi) === pcOf(tonicMidi - 1) && pcOf(n.midi) === pcOf(tonicMidi)),
};
export const hasNovelty = (cfg, notes, degrees, tonicMidi) => !cfg.check || MELODIC_CHECKS[cfg.check](notes, degrees, tonicMidi);

const accText = acc => (acc > 0 ? '#' : acc < 0 ? 'b' : '');
const nameOf = n => `${n.letter}${accText(n.acc)}${n.oct}`;
const inRange = (midi, inst) => midi >= inst.written[0] && midi <= inst.written[1];
const NEIGHBOR_KEYS = { C: ['G', 'F'], G: ['D', 'C'], D: ['A', 'G'], A: ['E', 'D'], F: ['C', 'Bb'], Bb: ['F', 'Eb'], Eb: ['Bb', 'Ab'] };

function chooseKey(r, cfg, inst) {
  const base = inst.bandKey;
  const pool = cfg.nearKeys ? [base, base, ...(NEIGHBOR_KEYS[base] || [])] : [base];
  const key = pool[Math.floor(r() * pool.length)];
  const relative = scaleNames(key, MAJOR)[5];
  // en menor, la sensible no puede ser Mi♯ ni Si♯ (Fa♯ menor, Do♯ menor): entonces se queda en mayor
  const leading = scaleNames(relative.letter + accText(relative.acc), HARMONIC_MINOR)[6];
  const minor = !!cfg.minor && r() < cfg.minor && !oddSpelling(leading);
  const t = minor ? relative : { letter: key[0], acc: key.includes('#') ? 1 : key.includes('b') ? -1 : 0 };
  const tonic = t.letter + accText(t.acc);
  return { key: minor ? tonic + 'm' : key, tonic, minor, steps: minor ? HARMONIC_MINOR : MAJOR };
}

const FALLBACK_SPANS = [[0, 7], [0, 4], [0, 2]];
function fitSpan(tonic, steps, span, inst) {
  for (const s of [span, ...FALLBACK_SPANS.filter(f => f[0] >= span[0] && f[1] <= span[1])]) {
    const degrees = Array.from({ length: s[1] - s[0] + 1 }, (_, i) => i + s[0]);
    const names = fit(tonic, steps, degrees, inst);
    if (names) return { span: s, names };
  }
  return null;
}

// Alteraciones accidentales habituales en mayor: ♯4→5, ♯1→2, ♯5→6 (subiendo) y ♭7→6 (bajando).
// Como mucho una cada dos compases, con la nota anterior cerca y sin escribir Mi♯, Si♯, Do♭ ni Fa♭.
const RAISE_DEGREES = new Set([3, 0, 4]);
const oddSpelling = n => (n.acc > 0 && (n.letter === 'E' || n.letter === 'B')) || (n.acc < 0 && (n.letter === 'C' || n.letter === 'F'));
function addAccidentals(r, notes, degrees, barOf, inst) {
  const out = notes.map(n => ({ ...n }));
  let lastBar = -10;
  for (let i = 1; i < out.length - 2; i++) {
    if (barOf[i] - lastBar < 2 || r() < 0.5) continue;
    const up = degrees[i + 1] === degrees[i] + 1 && RAISE_DEGREES.has(mod7(degrees[i]));
    const down = degrees[i + 1] === degrees[i] - 1 && mod7(degrees[i]) === 6;
    if ((!up && !down) || Math.abs(out[i + 1].midi - out[i].midi) !== 2) continue;
    const delta = up ? 1 : -1;
    if (Math.abs(out[i].acc + delta) > 1) continue;
    const altered = parseNote(nameOf({ ...out[i], acc: out[i].acc + delta }));
    if (oddSpelling(altered) || !inRange(altered.midi, inst)) continue;
    const prevOk = Math.abs(altered.midi - out[i - 1].midi) <= 2 || out[i - 1].letter === altered.letter;
    if (!prevOk || !intervalOk(out[i - 1], altered, true) || !intervalOk(altered, out[i + 1])) continue;
    out[i] = altered;
    lastBar = barOf[i];
  }
  return out;
}

function tokensFrom(plan, notes) {
  const tokens = [];
  let k = 0;
  plan.flat().forEach(v => {
    if (v < 0) tokens.push({ tok: 'R' + DUR[-v], beats: -v });
    else tokens.push({ tok: nameOf(notes[k++]) + DUR[v], beats: v });
  });
  return tokens;
}

const outlineOk = notes => notes.every((n, i) => {
  if (i < 2) return true;
  const m1 = notes[i - 1].midi - notes[i - 2].midi, m2 = n.midi - notes[i - 1].midi;
  if (Math.abs(m1) < 3 || Math.abs(m2) < 3 || Math.sign(m1) !== Math.sign(m2)) return true;
  const span = Math.abs(n.midi - notes[i - 2].midi);
  return span <= 12 && !BAD_OUTLINE.has(span);
});
// Ámbito de la frase hasta la 9.ª y como mucho dos notas repetidas
const MAX_RANGE = 14;
const MAX_REPEATS = 2;
const rangeOk = notes => Math.max(...notes.map(n => n.midi)) - Math.min(...notes.map(n => n.midi)) <= MAX_RANGE;
const repeatsOk = notes => notes.filter((n, i) => i && n.midi === notes[i - 1].midi).length <= MAX_REPEATS;
const melodyOk = notes => notes.every((n, i) => i === 0 || intervalOk(notes[i - 1], n, true)) && outlineOk(notes) && rangeOk(notes) && repeatsOk(notes);

// Dictado melódico. opts: { level, meter, bars, seed }. null si el instrumento no da para la tonalidad.
// Curso de Lenguaje Musical: un nivel con solo las figuras ya vistas (cells: claves de SIMPLE, p. ej. ['q', 'rq', 'ee'])
// y, si las células lo permiten, un compás simple que el nivel aún no tenía (3/4 en el rítmico 3)
export function limitedConfig(cfg, { cells = null, meter = null } = {}) {
  if (!cells || !cells.length) return cfg;
  const simple = cells.filter(k => SIMPLE[k]);
  if (!simple.length) return cfg;
  const meters = meter && SIMPLE_METERS.includes(meter) && !cfg.meters.includes(meter) ? [...cfg.meters, meter] : cfg.meters;
  return { ...cfg, limited: true, simple, compound: [], novel: (cfg.novel || []).filter(k => simple.includes(k)), meters: meters.filter(m => m !== '6/8') };
}

export function melodicDictation(inst, { level, meter, bars: barCount, seed, cells = null }) {
  const cfg = limitedConfig(levelConfig(level, false), { cells, meter });
  const r = rng(seed);
  const m = cfg.meters.includes(meter) ? meter : cfg.meters[0];
  const nBars = barsFor(level, m).includes(barCount) ? barCount : 4;
  const { key, minor, tonic, steps } = chooseKey(r, cfg, inst);
  const fitted = fitSpan(tonic, steps, cfg.span, inst);
  if (!fitted) return null;
  const { span, names } = fitted;
  const parsed = names.map(parseNote);
  const noteOf = d => parsed[d - span[0]];
  const tonicMidi = noteOf(0).midi;
  let best = null;
  let fallback = null;
  for (let attempt = 0; attempt < MELODY_TRIES && !best; attempt++) {
    const plan = rhythmPlan(r, cfg, m, nBars);
    const beats = plan.flat().filter(x => x > 0);
    // para recorrer la escala hacen falta notas: los ritmos muy escasos se descartan
    if (cfg.check === 'high' && beats.length < MIN_SCALE_NOTES_PER_BEAT * nBars * METER_BEATS[m] && fallback) continue;
    const barOf = plan.flatMap((b, i) => b.filter(x => x > 0).map(() => i));
    const ctx = { cfg, beats, noteOf, span, minor, reach: contiguousReach(cfg.moves) };
    for (let k = 0; k < 6 && !best; k++) {
      // en «La escala», la mitad de los intentos arrancan en la tónica de arriba (bajar la escala entera)
      const degrees = phraseDegrees(r, plan, { ...ctx, first: cfg.check === 'high' && k % 2 ? 7 : null });
      if (!degrees) continue;
      const plain = degrees.map(noteOf);
      const notes = cfg.chromatic && !minor ? addAccidentals(r, plain, degrees, barOf, inst) : plain;
      if (!melodyOk(notes)) continue;
      // la novedad del nivel tiene que estar (si no, se prueba otra frase)
      if (hasNovelty(cfg, notes, degrees, tonicMidi)) best = { plan, notes };
      else fallback ||= { plan, notes };
    }
  }
  best ||= fallback;
  if (!best) return null;
  return finishDictation({
    id: `dict-m${level}-${seed}`, level, seed, rhythmOnly: false, key, minor, meter: m, bars: nBars, bpm: bpmFor(cfg, m),
    keyName: keyLabel(key), tonicMidi, cadence: !!cfg.cadence,
  }, tokensFrom(best.plan, best.notes));
}

// Dictado rítmico para percusión: todas las notas en Do5 (la línea del pentagrama de percusión)
export function rhythmDictation({ level, meter, bars: barCount, seed, cells = null }) {
  const cfg = limitedConfig(levelConfig(level, true), { cells, meter });
  const r = rng(seed);
  const m = cfg.meters.includes(meter) ? meter : cfg.meters[0];
  const nBars = barsFor(level, m, true).includes(barCount) ? barCount : 4;
  const plan = rhythmPlan(r, cfg, m, nBars);
  const notes = Array.from({ length: noteCount(plan) }, () => parseNote('C5'));
  return finishDictation({
    id: `dict-r${level}-${seed}`, level, seed, rhythmOnly: true, key: 'C', minor: false, meter: m, bars: nBars, bpm: bpmFor(cfg, m),
    keyName: null, tonicMidi: null, cadence: false,
  }, tokensFrom(plan, notes));
}

function finishDictation(base, tokens) {
  const barBeats = METER_BEATS[base.meter];
  const score = bars(tokens, barBeats);
  const parsed = parseScore(score);
  return { ...base, barBeats, quantum: quantumFor(base.level, base.rhythmOnly, base.meter), score, notes: parsed.notes, totalBeats: parsed.totalBeats };
}

export function makeDictation(inst, opts) {
  return inst.rhythmOnly ? rhythmDictation(opts) : melodicDictation(inst, opts);
}

// Acorde de tónica (notas escritas) para situarse antes de cada escucha
export function tonicTriad(dict) {
  if (dict.rhythmOnly) return [];
  const r = dict.tonicMidi;
  return [r, r + (dict.minor ? 3 : 4), r + 7];
}

// Cadencia I-IV-V7-I (notas escritas, en posición cerrada alrededor de la tónica) para los niveles con menor
export function cadenceChords(dict) {
  if (dict.rhythmOnly) return [];
  const r = dict.tonicMidi;
  const third = dict.minor ? 3 : 4;
  const sixth = dict.minor ? 8 : 9;
  return [[r, r + third, r + 7], [r, r + 5, r + sixth], [r - 1, r + 2, r + 5, r + 7], [r, r + third, r + 7]];
}

// Claqueta: un compás (en 2/4, dos). En 6/8, las seis corcheas con acento en la 1 y en la 4.
export function countInPlan(dict) {
  const [num] = meterParts(dict.meter);
  if (dict.meter === '6/8') return { clicks: 6, bpm: dict.bpm * 2, accents: [0, 3] };
  if (dict.meter === '2/4') return { clicks: 4, bpm: dict.bpm, accents: [0, 2] };
  return { clicks: num, bpm: dict.bpm, accents: [0] };
}

// ---------- Récords y nivel recomendado ----------
// Por instrumento: el violín y la trompeta no comparten récord
export const bestKey = (level, rhythmOnly, instId = '') => `${instId ? instId + ':' : ''}${rhythmOnly ? 'r' : 'm'}${level}`;

// pass: niveles superados (80 en la nota, en la altura y en el ritmo); sin él, se mira solo el récord
export function recommendedLevel(best, rhythmOnly, instId = '', pass = null) {
  let top = 0;
  for (let l = 1; l <= LEVEL_COUNT; l++) {
    const key = bestKey(l, rhythmOnly, instId);
    if (pass ? pass[key] : (best[key] || 0) >= PASS_PCT) top = l;
  }
  return Math.min(LEVEL_COUNT, top + 1);
}
