// El plan de una lectura rítmica, sin DOM ni audio (se prueba aparte): la línea de tiempo en el orden en que suena
// (repeticiones, casillas de 1.ª y 2.ª vez, D.C. al Fine, calderón y ligaduras), el metrónomo de cada variante (también
// en 6/8, donde el pulso es la negra con puntillo), las sílabas de apoyo y la tolerancia de ataque.
import { formOf, passesOf, totalBars } from './form.js';
import { pulseOfParams, isAmalgam, isTriplet } from './notes.js';

// La lectura en el tiempo: cada figura con su pulso de comienzo en la línea de tiempo. Una nota ligada es UN solo ataque:
// su continuación (cont) ocupa tiempo pero no se toca, y una palmada ahí es error («liga»).
// Devuelve { events, total, span, passes, passStarts, scoreBeat(b) }.
export function readingTimeline(p, tokens) {
  const pickup = p.anacrusa || 0;
  const passes = passesOf(formOf(p), totalBars(tokens, pickup), !!pickup);
  const fermata = (p.matices || []).find(m => m.signo === 'calderon');
  const barOf = t => t.bar + (pickup ? 0 : 1);
  const byBar = new Map();
  tokens.forEach((t, i) => { const b = barOf(t); if (!byBar.has(b)) byBar.set(b, []); byBar.get(b).push(i); });
  const span = tokens.reduce((m, t) => Math.max(m, t.start + t.beats), 0);
  const events = [];
  const passStarts = [];
  let beat = 0;
  passes.forEach((bars, pass) => {
    passStarts.push(beat);
    bars.forEach(b => (byBar.get(b) || []).forEach(i => {
      const t = tokens[i];
      const next = tokens[i + 1];
      const lastOfBar = !next || barOf(next) !== barOf(t);
      const hold = fermata && barOf(t) === fermata.compas && lastOfBar && !t.rest ? t.beats : 0;
      events.push({ ...t, pass, beat, beats: t.beats + hold, hold, cont: !!t.tiedFrom, index: i });
      beat += t.beats + hold;
    }));
  });
  // posición en la partitura (pulsos desde su principio) de un instante de la línea de tiempo: para resaltar el compás que suena
  const scoreBeat = at => {
    let e = null;
    for (const ev of events) { if (ev.beat <= at + 1e-9) e = ev; else break; }
    return e ? e.start + Math.min(Math.max(0, at - e.beat), e.beats) : at;
  };
  return { events, total: beat, span, passes: passes.length, passStarts, scoreBeat };
}

// Clics del metrónomo en la primera vuelta (la repetición va sin él): [{ beat, level }] con level 'down' (1.er pulso del
// compás), 'pulse' o 'sub' (subdivisión: las corcheas, más suaves). metro: 'all' | 'first' | 'none'; mute: compases mudos.
// pulse: pulsos de negra de cada pulso (1,5 en 6/8). Los pulsos caen donde caen los del compás (con anacrusa, desde ella).
// Nivel 4: sizes (pulsos de negra de cada compás, si cambia el compás), meters (el compás de cada uno) y groups(bar) → corcheas
// de cada grupo: con metro «groups» suena una corchea de cada una (fuerte al inicio del compás, media al de cada grupo y suave
// el resto); con «all» y grupos, el pulso se acentúa al inicio de cada grupo (nivel 'group').
export function metronomeBeats({ length, barBeats, pickup = 0, pulse = 1, metro = 'all', mute = [], subdivision = false, sizes = null, meters = null, groups = null }) {
  if (metro === 'none') return [];
  const out = [];
  const eps = 1e-6;
  if (sizes || (groups && metro !== 'first')) return metronomeByBars({ length, barBeats, pickup, pulse, metro, mute, subdivision, sizes, meters, groups });
  const first = ((pickup % pulse) + pulse) % pulse;
  const barOf = b => (pickup ? (b < pickup - eps ? 0 : 1 + Math.floor((b - pickup + eps) / barBeats)) : 1 + Math.floor((b + eps) / barBeats));
  for (let b = first; b < length - eps; b += pulse) {
    const rel = (((b - pickup) % barBeats) + barBeats) % barBeats;
    const down = rel < eps || barBeats - rel < eps;
    if (mute.includes(barOf(b))) continue;
    if (metro === 'first' && !down) continue;
    out.push({ beat: b, level: down ? 'down' : 'pulse' });
    if (subdivision) {
      // las corcheas del pulso que no caen en él (en 6/8, dos; en 2/4, una)
      for (let s = b + 0.5; s < b + pulse - eps && s < length - eps; s += 0.5) out.push({ beat: s, level: 'sub' });
    }
  }
  return out.sort((a, b) => a.beat - b.beat);
}

// Metrónomo compás a compás (cambios de compás y reparto en grupos). Cada compás tiene su medida, su pulso y sus grupos
function metronomeByBars({ length, barBeats, pickup, pulse, metro, mute, subdivision, sizes, meters, groups }) {
  const out = [];
  const eps = 1e-6;
  const sizeOf = b => (sizes ? sizes[Math.min(b, sizes.length - 1)] : barBeats);
  for (let bar = 1, start = 0; start < length - eps; bar++) {
    const idx = pickup ? bar : bar - 1;
    const size = sizeOf(idx);
    const meter = meters ? meters[Math.min(idx, meters.length - 1)] : null;
    const gs = groups ? groups(idx, meter) : null;
    // pulso de este compás: la corchea en 5/8, 7/8 y con «groups»; la negra con puntillo en 6/8, 12/8…; si no, el pulso del ejercicio
    const step = metro === 'groups' || (gs && isAmalgam(meter)) ? 0.5 : pulse;
    if (!mute.includes(bar)) {
      const marks = new Set();
      if (gs) { let acc = 0; gs.forEach(g => { marks.add(Math.round(acc * 1000)); acc += g * 0.5; }); }
      for (let x = 0; x < size - eps; x += step) {
        if (metro === 'first' && x > eps) continue;
        const down = x < eps;
        const group = !down && gs && marks.has(Math.round(x * 1000));
        out.push({ beat: start + x, level: down ? 'down' : group ? 'group' : metro === 'groups' ? 'sub' : 'pulse' });
        if (subdivision && step > 0.5 + eps) for (let s = x + 0.5; s < x + step - eps && s < size - eps; s += 0.5) out.push({ beat: start + s, level: 'sub' });
      }
    }
    start += size;
  }
  return out.filter(c => c.beat < length - eps).sort((x, y) => x.beat - y.beat);
}

// Sílabas de apoyo (vocablos) de una lectura: «ta», «ti-ti», «ti-ri-ti-ri», «ta-a-a»… pulse: pulsos de negra por pulso
// Tresillo: «tre-si-llo» en las corcheas; las negras de tresillo, «ta»
const TRIPLET_SYL = ['tre', 'si', 'llo'];
const LONG = { w: 'taa-a-a-a', 'h.': 'taa-a-a', h: 'taa-a', 'q.': 'taaa', q: 'ta' };
export function syllablesOf(tokens, { pulse = 1, pickup = 0 } = {}) {
  const compound = pulse === 1.5;
  const eps = 1e-6;
  const pulseIndex = t => (t.start < pickup - eps ? -1 : Math.floor((t.start - pickup + eps) / pulse));
  const out = [];
  let sRun = 0;
  let tripIndex = -1;
  tokens.forEach((t, i) => {
    const prev = tokens[i - 1];
    const base = String(t.dur);
    if (isTriplet(base)) {
      // posición de la nota dentro de su tresillo (las del mismo grupo van seguidas)
      const first = !prev || !isTriplet(prev.dur) || (t.tupletId !== undefined && prev.tupletId !== t.tupletId);
      tripIndex = first ? 0 : tripIndex + 1;
      out.push(t.rest ? 'sh' : base === 'e:3' ? TRIPLET_SYL[tripIndex % 3] : 'ta');
      sRun = 0;
      return;
    }
    tripIndex = -1;
    if (t.rest) { out.push('sh'); sRun = 0; return; }
    if (t.tiedFrom) { out.push(''); return; }
    const samePulse = prev && !prev.rest && pulseIndex(prev) === pulseIndex(t);
    if (base === 's') {
      // las semicorcheas de un pulso van de dos en dos: «ti-ri»; la que sigue a una corchea con puntillo es «ri»
      const afterDotted = samePulse && prev.dur === 'e.';
      out.push(afterDotted || sRun % 2 === 1 ? 'ri' : 'ti');
      sRun += 1;
      return;
    }
    sRun = 0;
    if (base === 'e.') { out.push('taaa'); return; }
    if (base === 'e') {
      // la corchea que completa una negra (o una negra con puntillo) del pulso: «ta-i», «taaa-i»
      const completes = prev && !prev.rest && !compound && prev.dur === 'q.' && Math.abs(prev.start + prev.beats - t.start) < 1e-6;
      out.push((samePulse && (prev.dur === 'q' || prev.dur === 'q.')) || completes ? 'i' : 'ti');
      return;
    }
    if (compound && base === 'q.') { out.push('ta-a-a'); return; }
    out.push(LONG[base] || 'ta');
  });
  return out;
}

// Tolerancia de ataque (ms) de una lectura: Fácil ±120, Media ±80; en Media, con semicorcheas a más de 80 negras por minuto,
// ±60 (contrato del nivel 2). La compensación del retraso del alumno (mediana) sigue haciéndose en reading-grade.js.
export const TOLERANCE_MS = { facil: 120, medio: 80 };
export const SEMIQUAVER_MS = 60;
export const SEMIQUAVER_BPM = 80;
export function toleranceMs(variant, tokens = [], bpm = 72) {
  const base = TOLERANCE_MS[variant] || TOLERANCE_MS.facil;
  const fast = variant === 'medio' && bpm > SEMIQUAVER_BPM && tokens.some(t => !t.rest && (String(t.dur).replace('.', '') === 's' || isTriplet(t.dur)));
  return fast ? SEMIQUAVER_MS : base;
}

// Pulsos de negra por pulso de un ejercicio (campo «pulso» o el compás)
export const pulseOf = pulseOfParams;
