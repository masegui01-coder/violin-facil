// Aula Pro, lado del alumno (sin DOM ni red): apunta cada intento (Lenguaje Musical y lecciones), lo suma a las tareas
// de sus clases y prepara el resumen ACOTADO que publica en cada clase (lo único que ve el profesor).
// Resumen: { nickname, instrument, at, term, days, streak, skills, mistakes, units, tasks, recent } con los topes de
// firestore.rules (validAulaSummary). Nada de correo, ni grabaciones, ni el resto del progreso.
import { taskTargets, applyAttempt, dayKey, addDays, MAX_TASKS } from './aula.js';

export const SKILLS = ['ritmo', 'entonacion', 'lectura', 'teoria', 'dictado', 'audicion'];
export const SECTIONS = ['teoria', 'ritmo', 'agilidad', 'entonacion', 'dictado', 'cancion', 'audicion', 'creatividad', 'repaso'];
const MAX_IDS = 300;          // resultados guardados en el móvil (los más recientes)
const MAX_RECENT = 30;        // historial de intentos
const PUBLISHED_RECENT = 20;
const MAX_CODES = 40;         // errores contados en el móvil
const PUBLISHED_CODES = 10;   // errores que viajan al profesor
export const SUMMARY_DAYS = 92;
const ID_RE = /^[\w-]{1,60}$/;
const CODE_RE = /^[\w#+\-.]{1,16}$/;
const TITLE_MAX = 60;

const pct = v => Math.min(100, Math.max(0, Math.round(Number(v) || 0)));

// Resultado del curso de Lenguaje Musical (contrato del plan) saneado; null si no sirve
export function cleanLmResult(r) {
  if (!r || !ID_RE.test(String(r.id || ''))) return null;
  const skills = Object.fromEntries(SKILLS.filter(k => r.skills && Number.isFinite(Number(r.skills[k]))).map(k => [k, pct(r.skills[k])]));
  const mistakes = (Array.isArray(r.mistakes) ? r.mistakes : []).map(String).filter(c => CODE_RE.test(c)).slice(0, 10);
  return {
    id: String(r.id), pct: pct(r.pct), at: Number.isFinite(r.at) ? r.at : Date.now(),
    level: Number(r.level) || null, unit: Number(r.unit) || null, section: SECTIONS.includes(r.section) ? r.section : null,
    skills, mistakes, title: r.title ? String(r.title).slice(0, TITLE_MAX) : '',
  };
}

// Suma un intento al registro del alumno (sin mutar): mejor % por ejercicio, errores, competencias del trimestre e historial
export function addToLog(log, r, termId) {
  const prev = log || {};
  const old = (prev.r && prev.r[r.id]) || {};
  const allResults = { ...(prev.r || {}), [r.id]: { b: Math.max(old.b || 0, r.pct), n: (old.n || 0) + 1, l: r.at } };
  const results = Object.fromEntries(Object.entries(allResults).sort((a, b) => b[1].l - a[1].l).slice(0, MAX_IDS));
  const counted = (r.mistakes || []).reduce((m, code) => ({ ...m, [code]: (m[code] || 0) + 1 }), { ...(prev.m || {}) });
  const mistakes = Object.fromEntries(Object.entries(counted).sort((a, b) => b[1] - a[1]).slice(0, MAX_CODES));
  const base = prev.s && prev.s.term === termId ? prev.s.sums : {};
  const sums = Object.entries(r.skills || {}).reduce((m, [k, v]) => ({ ...m, [k]: [((m[k] || [0, 0])[0]) + v, ((m[k] || [0, 0])[1]) + 1] }), { ...base });
  const recent = [...(prev.recent || []), { id: r.id, p: r.pct, at: r.at, ...(r.title ? { t: r.title } : {}) }].slice(-MAX_RECENT);
  return { r: results, m: mistakes, s: { term: termId, sums }, recent };
}

export function skillsPct(log, termId) {
  if (!log || !log.s || log.s.term !== termId) return {};
  return Object.fromEntries(Object.entries(log.s.sums).filter(([k, [, n]]) => SKILLS.includes(k) && n > 0).map(([k, [sum, n]]) => [k, Math.round(sum / n)]));
}

// % de cada unidad de Lenguaje con algún intento («l1u3»). Por sección cuenta la mejor variante (Fácil o Medio)
export function unitPcts(exercises, log) {
  const best = (log && log.r) || {};
  const units = {};
  exercises.forEach(e => {
    const key = `l${e.level}u${e.unit}`;
    const sec = (units[key] ||= { touched: false, sections: {} }).sections[e.section] ||= {};
    (sec[e.variant || 'facil'] ||= []).push(best[e.id] ? best[e.id].b : 0);
    if (best[e.id]) units[key].touched = true;
  });
  const avg = list => list.reduce((s, x) => s + x, 0) / Math.max(1, list.length);
  return Object.fromEntries(Object.entries(units).filter(([, u]) => u.touched).map(([key, u]) => {
    const sections = Object.values(u.sections).map(byVariant => Math.max(...Object.values(byVariant).map(avg)));
    return [key, Math.round(avg(sections))];
  }));
}

export const classKey = c => `${c.sid}/${c.cid}`;
const progKey = (c, taskId) => `${c.cid}/${taskId}`;

// Un intento (de Lenguaje o de una lección) sobre todas las tareas de todas mis clases: devuelve el «prog» nuevo
export function applyToTasks(aula, attempt, exercises) {
  const prog = { ...((aula && aula.prog) || {}) };
  ((aula && aula.classes) || []).forEach(c => {
    (((aula.tasks || {})[classKey(c)]) || []).forEach(task => {
      const key = progKey(c, task.id);
      const next = applyAttempt(prog[key], task, taskTargets(task, exercises), attempt);
      if (next !== prog[key]) prog[key] = next;
    });
  });
  return prog;
}

// Entrega publicada: sin los detalles por ejercicio (solo %, intentos, hecha, último y agotada)
const publicEntry = e => ({ p: e.p || 0, n: e.n || 0, d: !!e.d, l: e.l || 0, o: !!e.o });

// Resumen que el alumno publica en una clase
export function buildSummary({ cls, aula, practiceLog, streak, exercises, now = Date.now(), termId }) {
  const today = dayKey(now);
  const from = addDays(today, -(SUMMARY_DAYS - 1));
  const days = Object.fromEntries(Object.entries(practiceLog || {})
    .filter(([d, m]) => d >= from && d <= today && m > 0).map(([d, m]) => [d, Math.round(m * 10) / 10]));
  const log = aula.log || {};
  const tasks = (((aula.tasks || {})[classKey(cls)]) || []).slice(0, MAX_TASKS);
  const entries = Object.fromEntries(tasks.map(t => [t.id, (aula.prog || {})[progKey(cls, t.id)]]).filter(([, e]) => e).map(([id, e]) => [id, publicEntry(e)]));
  const units = Object.fromEntries(Object.entries(unitPcts(exercises, log)).slice(0, 64));
  return {
    nickname: String(cls.nickname || '').slice(0, 30), instrument: String(cls.instrument || '').slice(0, 24),
    at: now, term: termId, days, streak: Math.max(0, Math.min(5000, Math.round(streak || 0))),
    skills: skillsPct(log, termId),
    mistakes: Object.fromEntries(Object.entries(log.m || {}).slice(0, PUBLISHED_CODES)),
    units, tasks: entries,
    recent: (log.recent || []).slice(-PUBLISHED_RECENT).map(x => ({ id: x.id, p: x.p, at: x.at, ...(x.t ? { t: x.t } : {}) })),
  };
}
