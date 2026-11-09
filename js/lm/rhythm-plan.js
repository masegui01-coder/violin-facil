// El plan de una lectura rítmica, sin DOM ni audio (se prueba aparte): la línea de tiempo en el orden en que suena
// (repeticiones, casillas de 1.ª y 2.ª vez, D.C. al Fine, calderón y ligaduras), el metrónomo de cada variante (también
// en 6/8, donde el pulso es la negra con puntillo), las sílabas de apoyo y la tolerancia de ataque.
import { formOf, passesOf, totalBars } from './form.js';
import { pulseOfParams } from './notes.js';

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
export function metronomeBeats({ length, barBeats, pickup = 0, pulse = 1, metro = 'all', mute = [], subdivision = false }) {
  if (metro === 'none') return [];
  const out = [];
  const eps = 1e-6;
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

// Sílabas de apoyo (vocablos) de una lectura: «ta», «ti-ti», «ti-ri-ti-ri», «ta-a-a»… pulse: pulsos de negra por pulso
const LONG = { w: 'taa-a-a-a', 'h.': 'taa-a-a', h: 'taa-a', 'q.': 'taaa', q: 'ta' };
export function syllablesOf(tokens, { pulse = 1, pickup = 0 } = {}) {
  const compound = pulse === 1.5;
  const eps = 1e-6;
  const pulseIndex = t => (t.start < pickup - eps ? -1 : Math.floor((t.start - pickup + eps) / pulse));
  const out = [];
  let sRun = 0;
  tokens.forEach((t, i) => {
    const prev = tokens[i - 1];
    const base = String(t.dur);
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
  const fast = variant === 'medio' && bpm > SEMIQUAVER_BPM && tokens.some(t => !t.rest && String(t.dur).replace('.', '') === 's');
  return fast ? SEMIQUAVER_MS : base;
}

// Pulsos de negra por pulso de un ejercicio (campo «pulso» o el compás)
export const pulseOf = pulseOfParams;
