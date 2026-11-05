// Corrección del dictado: cuantiza lo tocado a la rejilla del nivel, lo alinea nota a nota con lo que sonó y lo
// puntúa por separado en altura y en ritmo (50/50). Puro y sin DOM: se prueba con node --test.
import { DUR } from './generate.js';
import { spell } from './music.js';
import { EXTRA_LISTEN_PENALTY } from './dictation.js';

const EPS = 1e-6;
// Crédito por la altura: exacta; otra octava (suelta); misma nota con otra alteración; nota vecina (grado al lado)
export const PITCH_CREDIT = { exact: 100, octave: 70, accidental: 60, step: 30, wrong: 0 };
// Ritmo: figura (lo que dura hasta la nota siguiente) y sitio en el compás. Las dos bien, 100; solo una, 30.
export const RHYTHM_CREDIT = { both: 100, one: 30, none: 0 };
// Peso del desfase en el tiempo al alinear (desempata; en percusión pesa más porque solo cuenta el ritmo)
const TIME_WEIGHT = { melodic: 0.3, rhythm: 0.8 };
const TIME_CAP_BEATS = 2;
const GAP_COST = 1;
// Antes de este pulso (en la claqueta) lo que suena no cuenta
const EARLIEST_BEAT = -0.5;
// Ajuste a quien toca: tempo del alumno (±10 %) y un resto de retraso del micrófono (la latencia ya se descuenta al
// captar; aquí como mucho 0,08 pulsos: entrar tarde no es gratis)
const SHIFT_LIMIT = 0.08;
const MIN_SHIFT = 0.03;
const MIN_SHIFT_PERC = 0.07;
// Dictados cortos (hasta 4,5 pulsos de la primera a la última nota, es decir, dos compases): el tempo se ajusta como
// mucho un 6,5 % y la ventana no se ensancha, para que el ajuste no se «trague» una última nota fuera de sitio
const SHORT_SPAN_BEATS = 4.5;
const SHORT_TEMPO = 0.065;
const SHIFT_STEP = 0.01;
const FIRST_NOTE_WEIGHT = 3;
// la primera nota marca el arranque: el tempo no puede «tragarse» una entrada tarde
const ANCHOR_WEIGHT = 3;
const TEMPO_RANGE = 0.1;
const TEMPO_STEP = 0.005;
const FIT_CAP_BEATS = 0.5;
// Margen humano: un ataque a menos de 150 ms de una nota del dictado cuenta como en su sitio
const SNAP_S = 0.15;
const SNAP_MAX_BEATS = 0.3;
// Estrellas y aprobado: ★ desde 60, ★★ desde 75, ★★★ desde 90 con altura y ritmo de 90 o más; aprobar pide 80 en todo
export const STAR_STEPS = [60, 75, 90];
export const PASS_MIN = 80;
const OCTAVE_SHIFTS = [0, -12, 12, -24, 24];

const roundTo = (x, q) => Math.round(x / q) * q;

// ---------- Cuantización ----------
// raw: [{ beat, endBeat?, midi? }] con los pulsos medidos desde el final de la claqueta.
// shift y scale: retraso y tempo de quien toca (pulso corregido = (pulso − shift) / scale).
// snapTo: ataques del dictado; un ataque a menos de snapBeats de uno libre se coloca en él (margen humano).
export function quantize(raw, { quantum, totalBeats, shift = 0, scale = 1, snapTo = [], snapBeats = 0, snapCap = Infinity, drift = SNAP_DRIFT }) {
  const fix = b => (b - shift) / scale;
  const all = raw.map(e => ({ ...e, rawBeat: e.beat, beat: fix(e.beat), endBeat: e.endBeat === undefined || e.endBeat === null ? null : fix(e.endBeat) }))
    .filter(e => e.beat >= EARLIEST_BEAT && e.beat <= totalBeats + 2).sort((a, b) => a.beat - b.beat);
  // la ventana se mide antes y después de corregir el tempo: el ajuste no puede sacar de ella un golpe que ya estaba dentro
  const snapped = snapAssign(all.map(e => [e.beat, e.rawBeat]), [...snapTo].sort((a, b) => a - b), snapBeats, snapCap, drift);
  const starts = [];
  const events = [];
  const targets = [...snapTo].sort((a, b) => a - b);
  all.forEach((e, i) => {
    const prev = starts.length ? starts[starts.length - 1] : -Infinity;
    let s = snapped[i];
    if (s === null || s <= prev + EPS) {
      // sin pareja: al sitio libre de la rejilla más cercano entre la nota anterior y la siguiente emparejada.
      // Nunca se descarta: una nota de más siempre cuenta (y, si no cabe en la rejilla, se señala sin dibujarla).
      const next = snapped.slice(i + 1).find(x => x !== null);
      // (sin descontar el retraso: si toda la toma entra tarde, las notas sin pareja no vuelven solas a su sitio)
      s = freeSlot(s ?? e.rawBeat / scale, prev, next ?? Infinity, quantum, targets);
    }
    starts.push(s);
    events.push({ ...e, offGrid: !onGrid(s, MIN_DRAWN) });
  });
  return events.map((e, i) => {
    const ioi = i < events.length - 1 ? starts[i + 1] - starts[i] : null;
    const sounded = e.endBeat !== null ? Math.max(quantum, roundTo(e.endBeat - e.beat, quantum)) : null;
    let beats;
    if (ioi === null) beats = sounded ?? Math.max(quantum, roundTo(totalBeats - starts[i], quantum));
    else beats = sounded !== null && hasRestAfter(sounded, ioi, quantum) ? sounded : ioi;
    const drawn = e.offGrid ? beats : Math.max(MIN_DRAWN, roundTo(Math.min(Math.max(quantum, beats), ioi ?? Infinity), MIN_DRAWN));
    return { start: starts[i], beats: drawn, ...(e.offGrid ? { offGrid: true } : {}), ...(e.midi !== undefined ? { midi: e.midi } : {}) };
  });
}

// Empareja en orden ataques tocados y ataques del dictado (como mucho a «win» pulsos) con la menor distancia total.
// Devuelve, para cada ataque tocado, el ataque del dictado que le toca o null.
// onsets: [posición corregida, posición sin corregir]; cuenta la más cercana. La ventana se ensancha un poco a lo largo
// del dictado (SNAP_DRIFT por pulso), porque el tempo estimado nunca es exacto.
const SNAP_DRIFT = 0.015;
// …pero nunca más de 0,8 cuantos: tocar una corchea (o semicorchea) tarde siempre se nota
const SNAP_CAP_QUANTUM = 0.8;
// cap: tope de la ventana (menos de un cuanto: un error de una corchea o una semicorchea nunca queda perdonado)
function snapAssign(onsets, targets, win, cap = Infinity, drift = SNAP_DRIFT) {
  const dist = (o, t) => Math.min(...o.map(x => Math.abs(x - t)));
  const n = onsets.length, m = targets.length;
  if (!n || !m || win <= 0) return onsets.map(() => null);
  const winAt = t => Math.max(win > cap ? cap : win, Math.min(cap, win + drift * Math.max(0, t)));
  // coste de emparejar, normalizado a la ventana de ese ataque (como mucho, lo que cuesta dejarlo sin pareja)
  const pairCost = (i, j) => {
    const d = dist(onsets[i], targets[j]);
    return d <= winAt(targets[j]) + EPS ? d * win / winAt(targets[j]) : Infinity;
  };
  const cost = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) cost[i][0] = i * win;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i][j] = Math.min(cost[i - 1][j - 1] + pairCost(i - 1, j - 1), cost[i - 1][j] + win, cost[i][j - 1]);
    }
  }
  const out = onsets.map(() => null);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const pc = pairCost(i - 1, j - 1);
    if (pc < Infinity && Math.abs(cost[i][j] - (cost[i - 1][j - 1] + pc)) < EPS) { out[i - 1] = targets[j - 1]; i--; j--; } else if (Math.abs(cost[i][j] - (cost[i - 1][j] + win)) < EPS) i--;
    else j--;
  }
  return out;
}

// Tempo y retraso de quien toca: se buscan los que mejor llevan sus ataques a los del dictado (o, sin dictado, a la
// rejilla). Solo mueve y estira todo a la vez: no recoloca notas sueltas, así que no «arregla» los errores.
// robust: en dictados cortos, un golpe fuera de la ventana cuenta lo mismo lo lejos que esté (no arrastra el tempo)
export function fitTiming(raw, { quantum, expected = null, window = 0, shiftLimit = SHIFT_LIMIT, tempoRange = TEMPO_RANGE, robust = false }) {
  const fitCap = robust && window > 0 ? window : FIT_CAP_BEATS;
  const beats = raw.map(e => e.beat).filter(b => b >= EARLIEST_BEAT).sort((a, b) => a - b);
  if (!beats.length) return { shift: 0, scale: 1 };
  const targets = expected && expected.length ? expected.map(e => e.start).sort((a, b) => a - b) : null;
  // distancia de cada ataque (ordenados) al ataque del dictado más cercano, recorriendo las dos listas a la vez
  const totalDist = fixed => {
    if (!targets) return fixed.reduce((sum, b) => sum + Math.abs(b - roundTo(b, quantum)), 0);
    let k = 0;
    return fixed.reduce((sum, b) => {
      while (k < targets.length - 1 && Math.abs(targets[k + 1] - b) <= Math.abs(targets[k] - b)) k++;
      return sum + Math.min(fitCap, Math.abs(targets[k] - b));
    }, 0);
  };
  let best = { cost: Infinity, shift: 0, scale: 1 };
  for (let sc = 1 - tempoRange; sc <= 1 + tempoRange + EPS; sc += TEMPO_STEP) {
    for (let sh = -shiftLimit; sh <= shiftLimit + EPS; sh += SHIFT_STEP) {
      const fixed = beats.map(b => (b - sh) / sc);
      const cost = totalDist(fixed) / fixed.length + (targets ? ANCHOR_WEIGHT * Math.max(0, Math.abs(fixed[0] - targets[0]) - window) : FIRST_NOTE_WEIGHT * Math.abs(fixed[0]))
        + 0.01 * (Math.abs(sh) + Math.abs(sc - 1));
      if (cost < best.cost - EPS) best = { cost, shift: sh, scale: sc };
    }
  }
  return { shift: best.shift, scale: best.scale };
}

// Segundo ajuste, más fino: con los ataques ya emparejados, recta de mínimos cuadrados tocado = desplazamiento + tempo × esperado
// (el desplazamiento sigue limitado: entrar tarde no sale gratis)
const MIN_REFINE_PAIRS = 3;
function refineTiming(raw, targets, { shift, scale, win, cap, shiftLimit = SHIFT_LIMIT, tempoRange = TEMPO_RANGE, drift = SNAP_DRIFT }) {
  const beats = raw.map(e => e.beat).filter(b => b >= EARLIEST_BEAT).sort((a, b) => a - b);
  const snapped = snapAssign(beats.map(b => [(b - shift) / scale, b]), targets, win, cap, drift);
  const paired = beats.map((b, i) => [snapped[i], b]).filter(([t]) => t !== null);
  // fuera los golpes que se apartan del primer ajuste más de la ventana básica: una nota tarde no tuerce el tempo
  const fits = paired.filter(([t, b]) => Math.abs((b - shift) / scale - t) <= win + EPS);
  const pairs = fits.length >= MIN_REFINE_PAIRS ? fits : paired;
  if (pairs.length < MIN_REFINE_PAIRS) return { shift, scale };
  const n = pairs.length;
  const mx = pairs.reduce((sum, [t]) => sum + t, 0) / n;
  const my = pairs.reduce((sum, [, b]) => sum + b, 0) / n;
  const sxx = pairs.reduce((sum, [t]) => sum + (t - mx) ** 2, 0);
  if (sxx < EPS) return { shift, scale };
  const slope = pairs.reduce((sum, [t, b]) => sum + (t - mx) * (b - my), 0) / sxx;
  const sc = Math.min(1 + tempoRange, Math.max(1 - tempoRange, slope));
  const sh = Math.min(shiftLimit, Math.max(-shiftLimit, my - sc * mx));
  return { shift: sh, scale: sc };
}

// Lo tocado, ajustado al tempo de quien toca y con el margen humano en los ataques
// rhythmOnly: percusión (si no se dice, se deduce: en un dictado melódico nunca suenan todas las notas iguales)
export function quantizeBest(raw, { quantum, totalBeats, expected = null, bpm = 60, rhythmOnly = null }) {
  const perc = rhythmOnly ?? (!!expected && expected.length > 1 && expected.every(e => e.midi === expected[0].midi));
  const snapBeats = expected ? Math.min(SNAP_MAX_BEATS, SNAP_S * bpm / 60) : 0;
  const snapCap = Math.min(SNAP_MAX_BEATS, SNAP_CAP_QUANTUM * quantum);
  // retraso admitido: lo que deja libre la ventana hasta su tope (si no, un retraso + la ventana superarían un cuanto)
  // (en percusión algo más de margen mínimo: el golpe se capta al instante y la imprecisión del brazo pesa más)
  const minShift = perc ? MIN_SHIFT_PERC : MIN_SHIFT;
  const shiftLimit = expected ? Math.min(SHIFT_LIMIT, Math.max(minShift, snapCap - Math.min(snapBeats, snapCap))) : SHIFT_LIMIT;
  const short = !!expected && expected.length > 0 && Math.max(...expected.map(e => e.start)) <= SHORT_SPAN_BEATS + EPS;
  const tempoRange = short ? SHORT_TEMPO : TEMPO_RANGE;
  const drift = short ? 0 : SNAP_DRIFT;
  const limits = { shiftLimit, tempoRange };
  let { shift, scale } = fitTiming(raw, { quantum, expected, window: snapBeats, robust: short, ...limits });
  if (expected) ({ shift, scale } = refineTiming(raw, expected.map(e => e.start).sort((a, b) => a - b), { shift, scale, win: snapBeats, cap: snapCap, drift, ...limits }));
  return quantize(raw, { quantum, totalBeats, shift, scale, snapTo: expected ? expected.map(e => e.start) : [], snapBeats, snapCap, drift });
}

// Sitio para un ataque sin pareja: punto de la rejilla (o, si no cabe, de la semicorchea) estrictamente entre prev y
// next, el más cercano; a igual distancia, el que coincide con una nota del dictado (redondeo simétrico).
// Si no hay ninguno, el punto medio (fuera de la rejilla).
const MIN_DRAWN = 0.25;
function freeSlot(beat, prev, next, quantum, targets) {
  const isTarget = c => targets.some(t => Math.abs(t - c) < EPS);
  const options = [];
  [...new Set([quantum, MIN_DRAWN])].forEach((g, coarse) => {
    const base = Math.round(beat / g);
    const firstAfter = Math.floor(prev / g) + 1;
    [base - 2, base - 1, base, base + 1, base + 2, firstAfter].forEach(k => {
      const c = k * g;
      if (c >= 0 && c > prev + EPS && c < next - EPS) options.push({ c, coarse: -coarse });
    });
  });
  if (!options.length) {
    const after = Number.isFinite(prev) ? prev : 0;
    return Number.isFinite(next) ? (after + next) / 2 : after + quantum;
  }
  // el más cercano; a igual distancia, el que coincide con una nota del dictado y luego el de la rejilla del nivel
  options.sort((a, b) => {
    const d = Math.abs(a.c - beat) - Math.abs(b.c - beat);
    // si la rejilla del nivel tiene hueco a menos de medio cuanto, se usa esa (la semicorchea solo si no cabe)
    if (a.coarse !== b.coarse && Math.abs(a.c - beat) < quantum / 2 + EPS && Math.abs(b.c - beat) < quantum / 2 + EPS) return b.coarse - a.coarse;
    if (Math.abs(d) > EPS) return d;
    return (isTarget(b.c) - isTarget(a.c)) || (b.coarse - a.coarse);
  });
  return options[0].c + 0; // sin «-0»
}

// Se escribe un silencio detrás de la nota solo si el hueco es claro: tanto como la nota y de al menos una corchea
function hasRestAfter(sounded, ioi, quantum) {
  const gap = ioi - sounded;
  return gap >= Math.max(quantum, 0.5) - EPS && gap >= sounded - EPS;
}

// Lo que dura cada nota hasta la siguiente (la última, su propia duración)
export function withIoi(events) {
  return events.map((e, i) => ({ ...e, ioi: i < events.length - 1 ? events[i + 1].start - e.start : e.beats, last: i === events.length - 1 }));
}

// ---------- Altura ----------
// e: nota esperada (con letter y acc si se conocen); played: MIDI tocado
const ODD = (letter, acc) => (acc > 0 && (letter === 'E' || letter === 'B')) || (acc < 0 && (letter === 'C' || letter === 'F'));
export function pitchKind(e, played) {
  const d = played - e.midi;
  if (d === 0) return 'exact';
  if (d % 12 === 0) return 'octave';
  if (Math.abs(d) === 1 && e.letter !== undefined) {
    const acc = e.acc + d;
    return Math.abs(acc) <= 1 && !ODD(e.letter, acc) ? 'accidental' : 'step';
  }
  if (Math.abs(d) <= 2) return Math.abs(d) === 1 && e.letter === undefined ? 'accidental' : 'step';
  return 'wrong';
}

// ---------- Ritmo ----------
const posInBar = (x, barBeats) => (Number.isFinite(barBeats) ? ((x % barBeats) + barBeats) % barBeats : x);
export function rhythmCredit(e, p, barBeats = Infinity) {
  const figure = Math.abs(e.ioi - p.ioi) < EPS || (e.last && p.last);
  const place = Math.abs(posInBar(e.start, barBeats) - posInBar(p.start, barBeats)) < EPS;
  return figure && place ? RHYTHM_CREDIT.both : figure || place ? RHYTHM_CREDIT.one : RHYTHM_CREDIT.none;
}

// Valoración de una pareja. fold: lleva la nota tocada a la octava esperada si el instrumento lo admite (xilófono…)
export function pairCredit(e, p, { rhythmOnly = false, barBeats = Infinity, fold = null, octaveShift = 0 } = {}) {
  const rhythm = rhythmCredit(e, p, barBeats);
  if (rhythmOnly) return { kind: 'exact', pitch: 100, rhythm };
  const heard = p.midi - octaveShift;
  const kind = pitchKind(e, fold ? fold(heard, e.midi) : heard);
  return { kind, pitch: PITCH_CREDIT[kind], rhythm };
}

function stateOf(c, rhythmOnly) {
  if (rhythmOnly) return c.rhythm >= 100 ? 'ok' : c.rhythm > 0 ? 'near' : 'bad';
  if (c.pitch >= 100 && c.rhythm >= 100) return 'ok';
  return c.pitch > 0 ? 'near' : 'bad';
}

// ---------- Alineación nota a nota ----------
// Como un corrector de textos: emparejar cuesta menos cuanto más se parecen; saltarse o añadir una nota cuesta 1.
export function alignNotes(expected, played, opts = {}) {
  const { rhythmOnly = false } = opts;
  const E = withIoi(expected);
  const P = withIoi(played);
  const n = E.length, m = P.length;
  const w = rhythmOnly ? TIME_WEIGHT.rhythm : TIME_WEIGHT.melodic;
  const credits = E.map(e => P.map(p => pairCredit(e, p, opts)));
  const pairCost = (i, j) => {
    const c = credits[i][j];
    const sim = rhythmOnly ? c.rhythm / 100 : (c.pitch + c.rhythm) / 200;
    return 1 - sim + w * Math.min(Math.abs(E[i].start - P[j].start), TIME_CAP_BEATS) / TIME_CAP_BEATS;
  };
  const cost = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j * GAP_COST : j === 0 ? i * GAP_COST : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i][j] = Math.min(cost[i - 1][j - 1] + pairCost(i - 1, j - 1), cost[i - 1][j] + GAP_COST, cost[i][j - 1] + GAP_COST);
    }
  }
  const pairs = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && Math.abs(cost[i][j] - (cost[i - 1][j - 1] + pairCost(i - 1, j - 1))) < EPS) {
      const c = credits[i - 1][j - 1];
      pairs.push({ e: i - 1, p: j - 1, ...c, rhythmOk: c.rhythm >= 100, state: stateOf(c, rhythmOnly) });
      i--; j--;
    } else if (i > 0 && Math.abs(cost[i][j] - (cost[i - 1][j] + GAP_COST)) < EPS) {
      pairs.push({ e: i - 1, p: null, kind: 'missing', pitch: 0, rhythm: 0, rhythmOk: false, state: 'bad' });
      i--;
    } else {
      pairs.push({ e: null, p: j - 1, kind: 'extra', pitch: 0, rhythm: 0, rhythmOk: false, state: 'bad' });
      j--;
    }
  }
  return pairs.reverse();
}

// ---------- Nota final ----------
// Altura y ritmo por separado (cada uno de 0 a 100) y la nota, su media (en percusión, solo el ritmo).
// Las notas de más cuentan en el total. Si todo va desplazado una octava (otro registro) no se penaliza.
// Cada escucha de más resta EXTRA_LISTEN_PENALTY puntos a la nota.
export function scoreDictation(expected, played, { rhythmOnly = false, extraListens = 0, barBeats = Infinity, fold = null } = {}) {
  const shifts = rhythmOnly ? [0] : OCTAVE_SHIFTS;
  let best = null;
  shifts.forEach(octaveShift => {
    const pairs = alignNotes(expected, played, { rhythmOnly, barBeats, fold, octaveShift });
    const pitchSum = pairs.reduce((s, x) => s + x.pitch, 0);
    if (!best || pitchSum > best.pitchSum) best = { pairs, pitchSum, octaveShift };
  });
  const { pairs, octaveShift } = best;
  const extra = pairs.filter(x => x.kind === 'extra').length;
  const total = Math.max(1, expected.length + extra);
  const exact = pairs.filter(x => x.state === 'ok').length;
  const pitchPct = Math.round(pairs.reduce((s, x) => s + x.pitch, 0) / total);
  const rhythmPct = Math.round(pairs.reduce((s, x) => s + x.rhythm, 0) / total);
  const overall = rhythmOnly ? rhythmPct : Math.round((pitchPct + rhythmPct) / 2);
  const penalty = extraListens * EXTRA_LISTEN_PENALTY;
  const score = Math.max(0, overall - penalty);
  const weakest = rhythmOnly ? rhythmPct : Math.min(pitchPct, rhythmPct);
  return {
    pairs, exact, extra, exactPct: Math.round((100 * exact) / total), pitchPct, rhythmPct, overall, penalty, score,
    stars: dictationStars(score, weakest), passed: score >= PASS_MIN && weakest >= PASS_MIN, octaveShift,
    transposed: rhythmOnly ? 0 : transposition(pairs, expected, played, octaveShift),
  };
}

// ★ desde 60, ★★ desde 75 y ★★★ desde 90 si además altura y ritmo llegan a 90
// (y sin estrellas si la altura o el ritmo se quedan por debajo de 50: todo bien en una cosa no basta)
const MIN_WEAKEST = 50;
export function dictationStars(score, weakest = score) {
  if (weakest < MIN_WEAKEST) return 0;
  const stars = STAR_STEPS.filter(x => score >= x).length;
  return stars === 3 && weakest < STAR_STEPS[2] ? 2 : stars;
}

// ¿Todo a la misma distancia (que no sea la octava)? Señal de que se ha tocado en otra tonalidad
const TRANSPOSED_SHARE = 0.7;
const MIN_TRANSPOSED = 3;
function transposition(pairs, expected, played, octaveShift) {
  const diffs = pairs.filter(x => x.e !== null && x.p !== null).map(x => played[x.p].midi - octaveShift - expected[x.e].midi);
  if (diffs.length < MIN_TRANSPOSED) return 0;
  const counts = {};
  diffs.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
  const [d, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const semis = Number(d);
  return semis % 12 !== 0 && n / diffs.length >= TRANSPOSED_SHARE ? semis : 0;
}

// ---------- Partitura de lo tocado ----------
const PIECES = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];
const REST_PIECES = [4, 3, 2, 1, 0.5, 0.25];
const onGrid = (x, v) => Math.abs(x / v - Math.round(x / v)) < EPS;
// Los silencios se escriben en su sitio: el de blanca en parte fuerte, el de compás entero al principio
const restFits = (v, inBar, barBeats) => (v >= 3 ? inBar < EPS && Math.abs(v - barBeats) < EPS : onGrid(inBar, v));

// Trocea una duración en figuras que se pueden escribir, sin cruzar la barra de compás
export function splitDuration(pos, len, barBeats, { rest = false } = {}) {
  const out = [];
  let at = pos;
  let left = len;
  for (let guard = 0; left > EPS && guard < 64; guard++) {
    const inBar = at % barBeats;
    const room = barBeats - inBar;
    const fits = v => v <= Math.min(left, room) + EPS;
    const piece = (rest ? REST_PIECES.find(v => fits(v) && restFits(v, inBar, barBeats)) : PIECES.find(v => fits(v) && (v < 3 || inBar < EPS))) || 0.25;
    out.push(piece);
    at += piece;
    left -= piece;
  }
  return out;
}

const accText = acc => (acc > 0 ? '#' : acc < 0 ? 'b' : '');
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Nombre escrito de una nota tocada: con la ortografía del dictado si esa nota sale en él; si no, según la armadura
export function spellPlayed(midi, spellings, flats) {
  const known = spellings[((midi % 12) + 12) % 12];
  if (known) {
    const oct = Math.floor((midi - known.acc - LETTER_PC[known.letter]) / 12) - 1;
    return `${known.letter}${accText(known.acc)}${oct}`;
  }
  const n = spell(midi, flats);
  return `${n.letter}${accText(n.acc)}${n.oct}`;
}

export function spellingsOf(notes) {
  const out = {};
  notes.filter(n => !n.rest).forEach(n => { out[((n.midi % 12) + 12) % 12] = { letter: n.letter, acc: n.acc }; });
  return out;
}

// Partitura en texto de lo tocado (con silencios en los huecos y ligaduras al cruzar la barra).
// heads[i] = índice de la primera figura del evento i en la partitura (para colorear y señalar).
export function eventsToScore(events, { barBeats, totalBeats, nameOf }) {
  const tokens = [];
  const heads = [];
  let pos = 0;
  const push = (tok, at) => tokens.push({ tok, at });
  const rest = len => { splitDuration(pos, len, barBeats, { rest: true }).forEach(v => { push('R' + DUR[v], pos); pos += v; }); };
  events.forEach((e, i) => {
    // una nota fuera de la rejilla (de más, pegada a otra) se cuenta y se señala en la lista, pero no se dibuja
    if (e.offGrid || e.start < pos - EPS) { heads.push(null); return; }
    if (e.start > pos + EPS) rest(e.start - pos);
    const pieces = splitDuration(pos, e.beats, barBeats);
    heads.push(tokens.length);
    pieces.forEach((v, k) => { push(nameOf(e, i) + DUR[v] + (k < pieces.length - 1 ? '~' : ''), pos); pos += v; });
  });
  const end = Math.max(totalBeats, Math.ceil((pos - EPS) / barBeats) * barBeats);
  if (end > pos + EPS) rest(end - pos);
  const barsOut = [];
  tokens.forEach(t => {
    const b = Math.floor((t.at + EPS) / barBeats);
    (barsOut[b] ||= []).push(t.tok);
  });
  return { text: '| ' + barsOut.filter(Boolean).map(b => b.join(' ')).join(' | ') + ' |', heads };
}
