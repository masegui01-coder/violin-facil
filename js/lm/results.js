// Resultados del curso de Lenguaje Musical (contrato compartido con el Aula). Cada intento de un ejercicio produce:
//   { id, level, unit, section, variant, pct 0-100, stars 0-3, seconds, at (epoch ms),
//     skills: { ritmo?, entonacion?, lectura?, teoria?, dictado?, audicion? } (0-100), mistakes?: ['3M-3m', …] (≤10) }
// y se guarda en state.lm:
//   best: { id → resultado con más pct }   last: { id → último resultado }   days: { 'AAAA-MM-DD' → minutos }
//   skills: { competencia → últimos porcentajes (20) }   mistakes: { código → veces }   records: { clave → récord }
//   voice: { low, high } (registro de la voz, en midi)   works: { id → composición en texto }
// onLmResult(fn) avisa de cada resultado nuevo (el Aula publica el resumen en la clase del alumno).
import { getState, update, logPractice, today } from '../store.js';
import { parseLmId, LM_SKILLS, lmUnit, lmLevel } from './catalog.js';
import { clampPct, starsFor, mistakeCodes } from './grade.js';

const SKILL_WINDOW = 20;
const MAX_SECONDS = 4 * 3600;
const XP_BASE = 2;
const listeners = new Set();

export const EMPTY_LM = Object.freeze({ best: {}, last: {}, days: {}, skills: {}, mistakes: {}, records: {}, voice: null, works: {} });
export const lmState = (s = getState()) => ({ ...EMPTY_LM, ...(s.lm || {}) });

// Resultado completo y saneado a partir de lo que devuelve un ejercicio
export function makeResult(id, { pct, stars, seconds = 0, skills = {}, mistakes = [] } = {}, at = Date.now()) {
  const p = parseLmId(id);
  if (!p) throw new Error('Ejercicio desconocido: ' + id);
  const score = clampPct(pct);
  const cleanSkills = Object.fromEntries(Object.entries(skills || {}).filter(([k, v]) => LM_SKILLS.includes(k) && Number.isFinite(Number(v))).map(([k, v]) => [k, clampPct(v)]));
  return {
    id, level: p.level, unit: p.unit, section: p.section, variant: p.variant, pct: score,
    stars: Number.isFinite(stars) ? Math.max(0, Math.min(3, Math.round(stars))) : starsFor(score),
    seconds: Math.max(0, Math.min(MAX_SECONDS, Math.round(Number(seconds) || 0))), at,
    skills: cleanSkills, mistakes: mistakeCodes(mistakes || []),
  };
}

// Estado nuevo de state.lm tras un resultado (función pura: la prueba la usa sin tocar el almacenamiento)
export function applyResult(lm, r, day) {
  const prev = lm.best[r.id];
  const better = !prev || r.pct > prev.pct || (r.pct === prev.pct && r.stars > prev.stars);
  const skills = { ...lm.skills };
  Object.entries(r.skills).forEach(([k, v]) => { skills[k] = [...(skills[k] || []), v].slice(-SKILL_WINDOW); });
  const mistakes = { ...lm.mistakes };
  r.mistakes.forEach(code => { mistakes[code] = (mistakes[code] || 0) + 1; });
  const minutes = Math.round(((lm.days[day] || 0) + r.seconds / 60) * 10) / 10;
  return {
    ...lm, best: better ? { ...lm.best, [r.id]: r } : lm.best, last: { ...lm.last, [r.id]: r },
    days: { ...lm.days, [day]: minutes }, skills, mistakes,
  };
}

// Guarda un resultado. logMinutes: suma los minutos a la práctica del día y la racha (las herramientas que ya lo
// hacen por su cuenta, como Dictados o las lecciones, lo registran con logMinutes: false)
export function recordLmResult(id, partial, { logMinutes = true, at = Date.now() } = {}) {
  const r = makeResult(id, partial, at);
  update({ lm: applyResult(lmState(), r, today(new Date(at))) });
  if (logMinutes) logPractice(r.seconds / 60, XP_BASE + r.stars);
  emitLmResult(r);
  return r;
}

// Avisa de un resultado (con el contrato) a los oyentes: el Aula publica el resumen en la clase del alumno.
// También sale como evento «lm-result» de window.
export function emitLmResult(r) {
  listeners.forEach(fn => { try { fn(r); } catch (e) { /* un oyente roto no impide guardar ni avisar a los demás */ } });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lm-result', { detail: r }));
}

export function onLmResult(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const bestOf = id => lmState().best[id] || null;
export const lastOf = id => lmState().last[id] || null;

// Progreso de una unidad: ejercicios hechos (con al menos 1 estrella, en cualquiera de sus variantes),
// estrellas (la mejor de Fácil o Media de cada ejercicio, sobre 3) y porcentaje medio
export function unitProgress(level, unit, lm = lmState()) {
  const u = lmUnit(level, unit);
  if (!u) return { done: 0, total: 0, stars: 0, maxStars: 0, pct: 0 };
  const groups = {};
  u.exercises.forEach(e => { (groups[e.id.replace(/-(facil|medio)$/, '')] ||= []).push(e.id); });
  const bests = Object.values(groups).map(ids => ids.map(id => lm.best[id]).filter(Boolean)
    .reduce((a, b) => (!a || b.stars > a.stars || (b.stars === a.stars && b.pct > a.pct) ? b : a), null));
  const total = bests.length;
  return {
    done: bests.filter(b => b && b.stars > 0).length, total,
    stars: bests.reduce((s, b) => s + (b ? b.stars : 0), 0), maxStars: total * 3,
    pct: total ? Math.round(bests.reduce((s, b) => s + (b ? b.pct : 0), 0) / total) : 0,
  };
}

export function levelProgress(level, lm = lmState()) {
  const units = (lmLevel(level)?.units || []).map(u => unitProgress(level, u.unit, lm));
  const sum = k => units.reduce((s, u) => s + u[k], 0);
  return { units: units.length, done: sum('done'), total: sum('total'), stars: sum('stars'), maxStars: sum('maxStars') };
}

// Porcentaje por competencia: media de los últimos resultados de cada una (null si aún no hay)
export function skillSummary(lm = lmState()) {
  return Object.fromEntries(LM_SKILLS.map(k => {
    const list = lm.skills[k] || [];
    return [k, list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null];
  }));
}

// Errores más frecuentes (para el repaso y la ficha del alumno en el Aula)
export const topMistakes = (n = 5, lm = lmState()) => Object.entries(lm.mistakes).sort((a, b) => b[1] - a[1]).slice(0, n).map(([code, count]) => ({ code, count }));

export const minutesByDay = (lm = lmState()) => ({ ...lm.days });

// Récords (agilidad) y registro de la voz
export const recordOf = key => lmState().records[key] || 0;
export function saveRecord(key, value) {
  const lm = lmState();
  if ((lm.records[key] || 0) >= value) return false;
  update({ lm: { ...lm, records: { ...lm.records, [key]: value } } });
  return true;
}
export const voiceRange = () => lmState().voice;
export function saveVoice(low, high) {
  update({ lm: { ...lmState(), voice: { low: Math.round(low), high: Math.round(high) } } });
}
export const workOf = id => lmState().works[id] || '';
export function saveWork(id, text) {
  update({ lm: { ...lmState(), works: { ...lmState().works, [id]: String(text).slice(0, 2000) } } });
}
