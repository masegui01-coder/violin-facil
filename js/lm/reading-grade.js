// Corrección de una lectura rítmica (palmas al micrófono o toques en la pantalla), sin DOM: se prueba aparte.
// - Retraso propio del alumno (o del móvil): se resta la mediana del desfase de los golpes que casan con una nota.
//   Sin metrónomo, además, se busca su tempo (el que más notas casa): se corrige la lectura, no el reloj.
// - Notas: ✓ dentro del 60 % de la ventana del contrato (±120 ms Fácil, ±80 ms Media), ≈ hasta la ventana, ✕ fuera.
// - Silencios: ✓ si se respetan, ✕ (con doble peso) si cae una palmada dentro; con 3 o más silencios hace falta
//   respetar el 75 % para aprobar. Golpes de más: pesan 1,5. Así, dar palmas en todos los pulsos sin leer no aprueba.
// - A dos voces con micrófono: solo cuentan las notas propias de la voz 2 y ningún golpe que caiga en el ostinato.
import { pctOf } from './grade.js';

export const EXTRA_WEIGHT = 1.5;
export const REST_WEIGHT = 3;
export const REST_PASS = 0.75;
const MIN_RESTS_FOR_PASS = 3;
const PASS_CAP = 59;
const MIN_READ_FOR_RESTS = 0.5;
const OK_SHARE = 0.6;
const BLEED_S = 0.06;
const FIT_WINDOW_S = 0.25;
const MIN_PAIRS = 3;
const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

// Golpes llevados a la escala de la partitura: sin el retraso del alumno y, si se pide, a su tempo
// (sin metrónomo se prueban tempos del 85 % al 118 % y se queda el que más notas casa: la deriva no se castiga)
const TEMPO_MIN = 0.85;
const TEMPO_MAX = 1.18;
const TEMPO_STEP = 0.0025;
const nearestGap = (expected, x) => expected.reduce((g, e) => (Math.abs(x - e) < Math.abs(g) ? x - e : g), Infinity);
function shiftFit(expected, hits) {
  const gaps = hits.map(h => nearestGap(expected, h)).filter(g => Math.abs(g) <= FIT_WINDOW_S);
  if (gaps.length < MIN_PAIRS) return hits;
  const offset = median(gaps);
  return hits.map(h => h - offset);
}
const matched = (expected, xs, tol) => expected.filter(e => xs.some(x => Math.abs(x - e) <= tol)).length;
export function alignHits(expected, hits, { tempo = false, tol = FIT_WINDOW_S / 2 } = {}) {
  if (!hits.length || !expected.length) return hits;
  let best = shiftFit(expected, hits);
  if (!tempo) return best;
  let score = matched(expected, best, tol);
  for (let b = TEMPO_MIN; b <= TEMPO_MAX; b += TEMPO_STEP) {
    const fit = shiftFit(expected, hits.map(h => h / b));
    const s = matched(expected, fit, tol);
    if (s > score) { best = fit; score = s; }
  }
  return best;
}

// notes: [{ at, dur }] instantes (s) de las notas que se corrigen; rests: [{ from, to, dur }] silencios;
// devuelve { marks (una por nota; null = no se corrige), restMarks, extra, pct, mistakes }
export function gradeReading({ notes, rests = [], hits, tol, mic = false, ostinatoTimes = [], tempo = false }) {
  const near = (x, list, w) => list.some(t => Math.abs(x - t) <= w);
  const own = notes.map(n => !(mic && ostinatoTimes.length && near(n.at, ostinatoTimes, tol)));
  const heard = mic && ostinatoTimes.length ? hits.filter(x => !near(x, ostinatoTimes, BLEED_S)) : hits;
  const graded = notes.filter((_, i) => own[i]);
  const aligned = alignHits(graded.map(n => n.at), heard, { tempo, tol });
  const used = new Set();
  const marksOwn = graded.map(n => {
    let best = -1;
    aligned.forEach((x, i) => { if (!used.has(i) && Math.abs(x - n.at) <= tol && (best < 0 || Math.abs(x - n.at) < Math.abs(aligned[best] - n.at))) best = i; });
    if (best < 0) return 'bad';
    used.add(best);
    return Math.abs(aligned[best] - n.at) <= tol * OK_SHARE ? 'ok' : 'near';
  });
  let k = 0;
  const marks = notes.map((_, i) => (own[i] ? marksOwn[k++] : null));
  // silencios: una palmada que no es de ninguna nota y cae en el silencio, desde su comienzo (palmear el pulso del
  // silencio es justo el fallo) hasta una ventana antes de la nota siguiente
  const restMarks = rests.map(r => {
    const inside = aligned.findIndex((x, i) => !used.has(i) && x > r.from - tol && x < r.to - tol);
    if (inside < 0) return 'ok';
    used.add(inside);
    return 'bad';
  });
  const extra = aligned.length - used.size;
  const restBad = restMarks.filter(m => m === 'bad').length;
  // callarse no es «respetar los silencios»: sin leer al menos la mitad de las notas, los silencios no suman
  const read = marksOwn.filter(m => m !== 'bad').length >= marksOwn.length * MIN_READ_FOR_RESTS;
  const all = [...marksOwn, ...restMarks.filter(m => read || m === 'bad'), ...Array(restBad * (REST_WEIGHT - 1)).fill('bad')];
  let pct = pctOf(all, Math.ceil(extra * EXTRA_WEIGHT));
  if (rests.length >= MIN_RESTS_FOR_PASS && (rests.length - restBad) / rests.length < REST_PASS) pct = Math.min(pct, PASS_CAP);
  const mistakes = [
    ...notes.map((n, i) => (marks[i] === 'bad' ? `falta-${n.dur}` : null)),
    ...rests.map((r, i) => (restMarks[i] === 'bad' ? `sil-${r.dur}` : null)),
    extra ? 'golpe-mas' : null,
  ];
  return { marks, restMarks, extra, pct, mistakes };
}
