// Lenguaje musical: corrección de los ejercicios nuevos (sin DOM). Cada marca es «ok» (verde ✓), «near» (amarillo ≈)
// o «bad» (rojo ✕), el mismo patrón de los dictados; el porcentaje da las estrellas con los mismos escalones.
import { FIGURE_BEATS, midiOf, nameOfStep, tokenMidi, tokenName, interval } from './notes.js';
import { spell } from '../music.js';

// Estrellas del contrato: 1 desde el 60 %, 2 desde el 80 % y 3 desde el 90 %
export const STAR_STEPS = [60, 80, 90];
export const MARK_CREDIT = { ok: 1, near: 0.5, bad: 0 };
const MAX_MISTAKES = 10;
const MAX_CODE = 16; // como el resumen del Aula (aula-summary.js CODE_RE)

export const clampPct = x => Math.max(0, Math.min(100, Math.round(Number(x) || 0)));
export const starsFor = pct => STAR_STEPS.filter(s => clampPct(pct) >= s).length;

// Porcentaje de una lista de marcas (las de más cuentan como fallos: van en «extra»)
export function pctOf(marks, extra = 0) {
  const total = marks.length + extra;
  if (!total) return 0;
  return clampPct(100 * marks.reduce((s, m) => s + (MARK_CREDIT[m] ?? 0), 0) / total);
}

// Códigos cortos de error, sin repetir y como mucho diez (contrato de resultados)
export function mistakeCodes(list) {
  return [...new Set(list.filter(Boolean).map(c => String(c).slice(0, MAX_CODE)))].slice(0, MAX_MISTAKES);
}

// ---------- Entonación cantada ----------
// sung: cents respecto a la nota buscada en cualquier octava (null = no se oyó). Tolerancia según la variante.
export const SING_TOLERANCE = { facil: 50, medio: 35 };
export function singMark(cents, tol) {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return 'bad';
  const a = Math.abs(cents);
  return a <= tol ? 'ok' : a <= tol * 2 ? 'near' : 'bad';
}
export function gradeSung(targets, sung, { tolerance = SING_TOLERANCE.facil } = {}) {
  const marks = targets.map((_, i) => singMark(sung[i], tolerance));
  const mistakes = targets.map((t, i) => {
    const c = sung[i];
    if (marks[i] === 'ok') return null;
    if (c === null || c === undefined) return `${t}-sil`;
    // a partir de unos 3/4 de semitono ya es otra nota (código «X>Y»); antes, tendencia (afin+ / afin-)
    const off = Math.abs(c) >= 75 ? Math.round(c / 100) : 0;
    if (!off) return c > 0 ? 'afin+' : 'afin-';
    const n = spell(midiOf(t) + off, off < 0);
    return `${t}>${n.letter}${({ '-1': 'b', 0: '', 1: '#' })[n.acc] ?? ''}${n.oct}`;
  });
  return { marks, pct: pctOf(marks), mistakes: mistakeCodes(mistakes) };
}

// ---------- Escribir en el pentagrama ----------
// token: { step } (nota) o { rest: true }, y dur ('q', 'h'…). Altura y figura bien: ok; una de las dos: near.
// La altura se compara por la nota real (midi): fa♯ no es fa. Una ficha sin nombre usa su escalón sin alteración.
export function writtenMark(want, got) {
  if (!got) return 'bad';
  const pitch = want.rest ? !!got.rest : !got.rest && got.step !== undefined && tokenMidi(got) === tokenMidi(want);
  const figure = got.dur === want.dur;
  return pitch && figure ? 'ok' : pitch || figure ? 'near' : 'bad';
}
export function gradeWriting(target, written, { pitchOnly = false } = {}) {
  const marks = target.map((w, i) => (pitchOnly && written[i] ? (!written[i].rest && tokenMidi(written[i]) === tokenMidi(w) ? 'ok' : 'bad') : writtenMark(w, written[i])));
  const extra = Math.max(0, written.length - target.length);
  // qué nota era y cuál se escribió («E4>F4», «B4>Bb4»), o la figura que tocaba
  const pitchCode = (w, got) => (w.rest || got.rest || got.step === undefined || w.step === undefined ? 'nota' : `${tokenName(w)}>${tokenName(got)}`);
  const mistakes = target.map((w, i) => (marks[i] === 'ok' ? null : !written[i] ? 'falta'
    : written[i].dur !== w.dur ? `fig-${w.dur}` : pitchCode(w, written[i])));
  return { marks, extra, pct: pctOf(marks, extra), mistakes: mistakeCodes([...mistakes, extra ? 'sobra' : null]) };
}

// ---------- Barras de compás ----------
// Huecos (índice de la nota tras la que va la barra) donde se cierra un compás, sin contar el final
// pickup: pulsos de la anacrusa (el primer compás, incompleto)
export function barlineGaps(durs, barBeats, pickup = 0) {
  const out = [];
  let sum = 0;
  durs.forEach((d, i) => {
    sum += FIGURE_BEATS[d] ?? 0;
    const into = ((sum - pickup) % barBeats + barBeats) % barBeats;
    if (i < durs.length - 1 && (into < 1e-6 || barBeats - into < 1e-6)) out.push(i);
  });
  return out;
}
// Cada hueco con barra (puesta o que faltaba): ok si va ahí, bad si sobra o falta
export function gradeBarlines(correct, chosen) {
  const want = new Set(correct);
  const got = new Set(chosen);
  const gaps = [...new Set([...want, ...got])].sort((a, b) => a - b);
  const marks = gaps.map(g => ({ gap: g, mark: want.has(g) && got.has(g) ? 'ok' : 'bad', kind: want.has(g) ? (got.has(g) ? 'bien' : 'falta') : 'sobra' }));
  const hits = marks.filter(m => m.kind === 'bien').length;
  const extras = marks.filter(m => m.kind === 'sobra').length;
  const pct = want.size ? clampPct(100 * Math.max(0, hits - extras) / want.size) : (extras ? 0 : 100);
  return { marks, pct, mistakes: mistakeCodes(marks.filter(m => m.mark === 'bad').map(m => `barra-${m.kind}`)) };
}

// ---------- STOP ----------
// Se para a tiempo si se pulsa desde que empieza el error hasta «window» pulsos después; un poco tarde: near
export const STOP_WINDOW = { facil: 2, medio: 1.25 };
export function stopMark(errorBeat, pressBeat, window = STOP_WINDOW.facil) {
  if (pressBeat === null || pressBeat === undefined) return 'bad';
  const d = pressBeat - errorBeat;
  if (d >= 0 && d <= window) return 'ok';
  if (d > window && d <= window + 1) return 'near';
  return 'bad';
}
export function gradeStop(rounds, { window = STOP_WINDOW.facil } = {}) {
  const marks = rounds.map(r => stopMark(r.errorBeat, r.pressBeat, window));
  const mistakes = rounds.map((r, i) => (marks[i] === 'ok' ? null
    : r.pressBeat === null || r.pressBeat === undefined ? 'stop-no' : r.pressBeat < r.errorBeat ? 'stop-pronto' : 'stop-tarde'));
  return { marks, pct: pctOf(marks), mistakes: mistakeCodes(mistakes) };
}

// ---------- Agilidad de notas ----------
// Nota conseguida frente al objetivo de la variante: cada fallo resta como un acierto de menos
export function gradeAgility(right, wrong, goal) {
  const pct = clampPct(100 * Math.max(0, right - wrong * 0.5) / Math.max(1, goal));
  return { pct, score: right };
}

// ---------- Teoría interactiva y repaso ----------
export const choiceMark = (answer, chosen) => (answer === chosen ? 'ok' : 'bad');
// Ordenar: cada elemento en su sitio cuenta; todos bien, ok; la mitad o más, near
export function orderMark(expected, given) {
  const right = expected.filter((x, i) => given[i] === x).length;
  return right === expected.length ? 'ok' : right * 2 >= expected.length ? 'near' : 'bad';
}
// Escala construida nota a nota: bien si coincide entera; con un fallo, near
export function scaleMark(expected, given) {
  const wrong = expected.filter((x, i) => given[i] !== x).length + Math.max(0, given.length - expected.length);
  return wrong === 0 ? 'ok' : wrong === 1 ? 'near' : 'bad';
}
// Porcentaje por competencia de una serie de tareas marcadas ({ skill, mark })
export function skillsOf(tasks) {
  const by = {};
  tasks.forEach(t => { (by[t.skill] ||= []).push(t.mark); });
  return Object.fromEntries(Object.entries(by).map(([k, marks]) => [k, pctOf(marks)]));
}

// ---------- Creatividad ----------
// Reglas de la composición (restricciones del catálogo): longitud, compases completos, figuras y notas permitidas,
// final (nota y figura), salto máximo (en grados), figuras obligatorias ({ w: 1, Rw: 1 }) y semitonos que deben sonar
// seguidos ([[escalón mi, escalón fa], …], en cualquier sentido)
const figKey = t => (t.rest ? `R${t.dur}` : t.dur);
// pickup: pulsos de la anacrusa (los compases se cuentan desde ahí). mustFigures admite figuras («h», «Rw»), notas
// («D5») y «en cada compás» (esa figura en todos los compases). firstBeatNote: cada compás empieza con nota.
// extra: reglas ya comprobadas fuera ({ id, ok }: signos, coma, barra de repetición, eco…)
// Las notas permitidas, el final y las obligatorias se dan como nombres con altura real («Bb4», «F#4»): se comparan por
// midi (o, con números, por escalón, como antes). endPc: el final puede ser cualquier octava de esas notas (tónica elegida).
// intervals: números de intervalo (3, 5, 8…) que deben aparecer entre dos notas seguidas. any: { de: [figuras], distintas }.
const isName = x => typeof x === 'string';
const pitchIs = (t, x) => !t.rest && (isName(x) ? tokenMidi(t) === midiOf(x) : t.step === x);
export function checkComposition(tokens, { barBeats, bars, figures = null, notes = null, endSteps = null, endPc = null, endFigure = null, maxLeap = null, mustFigures = null, semitones = null, pickup = 0, firstBeatNote = false, intervals = null, any = null, extra = [] }) {
  const total = tokens.reduce((s, t) => s + (FIGURE_BEATS[t.dur] ?? 0), 0);
  const shift = pickup ? barBeats - pickup : 0;
  let sum = shift;
  let crosses = false;
  const barOf = [];
  tokens.forEach(t => {
    const before = sum;
    sum += FIGURE_BEATS[t.dur] ?? 0;
    barOf.push({ bar: Math.floor(before / barBeats + 1e-9), first: Math.abs(before % barBeats) < 1e-6 });
    if (Math.floor(before / barBeats + 1e-9) !== Math.floor((sum - 1e-9) / barBeats)) crosses = true;
  });
  const sounding = tokens.filter(t => !t.rest);
  // el final es la última nota que suena: un silencio detrás (| C4h Rh |) no lo cambia
  const last = [...tokens].reverse().find(t => !t.rest);
  const rules = [
    { id: 'longitud', ok: Math.abs(total - barBeats * bars) < 1e-6 },
    { id: 'compases', ok: !crosses && tokens.length > 0 },
    { id: 'figuras', ok: !figures || tokens.every(t => figures.includes(figKey(t))) },
  ];
  if (notes) rules.push({ id: 'notas', ok: sounding.length > 0 && sounding.every(t => notes.some(x => pitchIs(t, x))) });
  if (endSteps || endPc) {
    const okPitch = !!last && (endPc ? endPc.includes(((tokenMidi(last) % 12) + 12) % 12) : endSteps.some(x => pitchIs(last, x)));
    rules.push({ id: 'final', ok: okPitch && (!endFigure || last.dur === endFigure) });
  } else if (endFigure) rules.push({ id: 'final', ok: !!last && last.dur === endFigure });
  if (maxLeap !== null) rules.push({ id: 'saltos', ok: sounding.every((t, i) => i === 0 || Math.abs(t.step - sounding[i - 1].step) <= maxLeap) });
  if (mustFigures) {
    const has = (t, k) => (/^[A-G][#b]?\d$/.test(k) ? !t.rest && tokenMidi(t) === midiOf(k) : figKey(t) === k);
    const barsIn = new Set(barOf.map(b => b.bar));
    rules.push({ id: 'incluye', ok: Object.entries(mustFigures).every(([k, n]) => (typeof n === 'string'
      ? [...barsIn].every(b => tokens.some((t, i) => barOf[i].bar === b && has(t, k)))
      : tokens.filter(t => has(t, k)).length >= n)) });
  }
  if (firstBeatNote) rules.push({ id: 'tiempo1', ok: tokens.length > 0 && tokens.every((t, i) => !barOf[i].first || !t.rest) });
  if (intervals) {
    const found = new Set(sounding.slice(1).map((t, i) => Math.abs(t.step - sounding[i].step) + 1));
    // un número («3») o un número con su especie («3M», «4A»): la especie se mide con las notas reales
    const species = new Set(sounding.slice(1).map((t, i) => interval(tokenName(sounding[i]), tokenName(t)).code));
    rules.push({ id: 'intervalos', ok: intervals.every(n => (typeof n === 'string' && /[A-Za-z]$/.test(n) ? species.has(n) : found.has(Number(n)))) });
  }
  if (any) {
    const kinds = new Set(tokens.filter(t => any.de.includes(figKey(t))).map(figKey));
    rules.push({ id: 'alguna', ok: kinds.size >= (any.distintas || 1) });
  }
  extra.forEach(r => rules.push(r));
  if (semitones) {
    const pairs = sounding.slice(1).map((t, i) => [sounding[i].step, t.step].sort((a, b) => a - b).join('-'));
    rules.push({ id: 'semitonos', ok: semitones.every(([a, b]) => pairs.includes([a, b].sort((x, y) => x - y).join('-'))) });
  }
  const passed = rules.filter(r => r.ok).length;
  return { rules, pct: clampPct(100 * passed / rules.length), mistakes: mistakeCodes(rules.filter(r => !r.ok).map(r => `r-${r.id}`)) };
}

// Nota de 1 a 10 de la rúbrica del curso: Fácil tiene techo 8; Media llega a 10 con la condición de excelencia
// El aprobado (5) empieza en el 60 %, como la primera estrella; nada hecho (0 %) es un 0
export function gradeTen(pct, variant, excellence = false) {
  const p = clampPct(pct);
  if (p === 0) return 0;
  if (p < 60) return Math.max(1, Math.min(4, Math.round(p / 15)));
  if (p < 70) return 5;
  if (p < 85) return 6 + Math.round((p - 70) / 15);
  if (variant === 'facil') return 8;
  return p >= 95 && excellence ? 10 : 9;
}
