// Aula Pro (sin DOM ni red): tareas del profesor, su estado para cada alumno y la tabla de seguimiento de la clase.
// Una tarea apunta a algo del temario (Lenguaje Musical, lecciones del curso, páginas del Libro, Método Pro o un
// MusicXML propio) con fecha, nota mínima (%), intentos por ejercicio, variante Fácil/Medio y a quién va.
// El alumno cuenta sus intentos en su móvil (aula-summary.js) y publica en su clase un resumen: { p, n, d, l, o } por tarea.
export const TASK_KINDS = ['lm-unit', 'lm-section', 'lm-ex', 'lesson', 'book', 'method', 'xml'];
export const LM_KINDS = new Set(['lm-unit', 'lm-section', 'lm-ex']);
export const VARIANTS = ['facil', 'medio', 'any'];
export const MAX_ATTEMPTS = 20;     // intentos por ejercicio (0 = sin límite)
export const MAX_STUDENTS = 60;     // alumnos por clase (lo comprueban también las reglas)
export const MAX_EXERCISES = 20;    // ejercicios sueltos en una tarea
export const MAX_TASKS = 100;       // tareas de una clase que viajan en el resumen del alumno
export const DEFAULT_MIN_PCT = 60;
export const TITLE_MAX = 120;
export const NOTE_MAX = 300;
const DAY_MS = 864e5;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------- Fechas (días locales «AAAA-MM-DD») ----------
export function dayKey(ms) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const addDays = (day, n) => dayKey(new Date(day + 'T12:00').getTime() + n * DAY_MS);
// Días entre dos fechas (b − a)
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / DAY_MS);

// Minutos de los últimos «n» días (hoy incluido) a partir de { día: minutos }
export function minutesInLast(days, today, n) {
  if (!days) return 0;
  const from = addDays(today, -(n - 1));
  return Math.round(Object.entries(days).filter(([d]) => d >= from && d <= today).reduce((s, [, m]) => s + (Number(m) || 0), 0));
}

// ---------- Crear una tarea ----------
const clampInt = (v, lo, hi, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

// Valida y deja la tarea con la forma exacta que aceptan las reglas. Devuelve { task } o { error } (texto para el profesor)
export function normalizeTask(input, now = Date.now()) {
  const title = String(input.title || '').trim().slice(0, TITLE_MAX);
  if (!title) return { error: 'Ponle un título a la tarea.' };
  if (!TASK_KINDS.includes(input.kind)) return { error: 'Elige qué hay que hacer en el temario.' };
  const ref = input.ref || {};
  if (LM_KINDS.has(input.kind) && input.kind !== 'lm-ex' && !(ref.level >= 1 && ref.unit >= 1)) return { error: 'Elige el nivel y la unidad de Lenguaje Musical.' };
  if (input.kind === 'lm-section' && !ref.section) return { error: 'Elige la sección de la unidad.' };
  if (input.kind === 'lm-ex' && !(Array.isArray(ref.ids) && ref.ids.length)) return { error: 'Marca al menos un ejercicio.' };
  if (['lesson', 'book', 'method'].includes(input.kind) && !ref.id) return { error: 'Elige la lección, la página o el nivel.' };
  if (input.kind === 'xml' && !input.song) return { error: 'Importa la partitura MusicXML.' };
  const due = input.due && DATE_RE.test(input.due) ? input.due : null;
  if (due && due < dayKey(now)) return { error: 'La fecha límite ya ha pasado.' };
  const to = [...new Set((input.to || []).map(String))].slice(0, MAX_STUDENTS);
  const cleanRef = Object.fromEntries(Object.entries({
    level: ref.level, unit: ref.unit, section: ref.section, id: ref.id, inst: ref.inst, book: ref.book, label: ref.label,
    ids: Array.isArray(ref.ids) ? ref.ids.slice(0, MAX_EXERCISES).map(String) : undefined,
  }).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const task = {
    title, kind: input.kind, ref: cleanRef, due,
    minPct: clampInt(input.minPct, 0, 100, DEFAULT_MIN_PCT),
    maxAttempts: clampInt(input.maxAttempts, 0, MAX_ATTEMPTS, 0),
    variant: VARIANTS.includes(input.variant) ? input.variant : 'any',
    to, note: String(input.note || '').trim().slice(0, NOTE_MAX), createdAt: now,
  };
  return { task: input.kind === 'xml' ? { ...task, song: input.song } : task };
}

export const assignedTo = (task, uid) => !(task.to && task.to.length) || task.to.includes(uid);
export const isLate = (task, today) => !!task.due && task.due < today;

// ---------- Qué cuenta para cada tarea ----------
// Identificador de la lección que la cumple (la que llega en el evento «lesson-finished»)
export function lessonIdFor(task) {
  if (task.kind === 'method') return 'pro-' + task.ref.id;
  if (task.kind === 'xml') return 'aula-' + task.id;
  return task.ref.id;
}

// Ejercicios o lecciones de la tarea. exercises: el catálogo de Lenguaje en plano [{ id, level, unit, section, variant }]
export function taskTargets(task, exercises = []) {
  if (!LM_KINDS.has(task.kind)) return [lessonIdFor(task)];
  if (task.kind === 'lm-ex') return task.ref.ids || [];
  return exercises.filter(e => e.level === task.ref.level && e.unit === task.ref.unit
    && (task.kind === 'lm-unit' || e.section === task.ref.section)
    && (task.variant === 'any' || e.variant === task.variant)).map(e => e.id);
}

// % de una lección: la precisión si la hay; si no, las estrellas (3 = 100 %)
export function lessonPct({ stars = 0, accuracy = null }) {
  if (typeof accuracy === 'number' && Number.isFinite(accuracy)) return Math.round(Math.min(1, Math.max(0, accuracy)) * 100);
  return Math.round(Math.min(3, Math.max(0, stars)) / 3 * 100);
}

// Suma un intento a la entrega del alumno (sin mutar). Solo cuentan los intentos posteriores a la tarea y, si hay
// límite, los primeros «maxAttempts» de cada ejercicio. Entrega: { p: %, n: intentos, d: hecha, l: último, o: agotada, ex, c }
export function applyAttempt(entry, task, targets, { id, pct, at }) {
  const prev = entry || {};
  if (!targets.includes(id) || at < (task.createdAt || 0)) return entry; // no cuenta: la misma entrega, sin copiar
  const used = (prev.c && prev.c[id]) || 0;
  if (task.maxAttempts && used >= task.maxAttempts) return entry;
  const c = { ...(prev.c || {}), [id]: used + 1 };
  const ex = { ...(prev.ex || {}), [id]: Math.max((prev.ex && prev.ex[id]) || 0, clampInt(pct, 0, 100, 0)) };
  const p = Math.round(targets.reduce((s, t) => s + (ex[t] || 0), 0) / Math.max(1, targets.length));
  const d = !!prev.d || p >= task.minPct;
  const o = !d && !!task.maxAttempts && targets.every(t => (c[t] || 0) >= task.maxAttempts);
  return { p, n: (prev.n || 0) + 1, d, l: at, o, ex, c };
}

// Estado de una tarea para un alumno: hecha, agotada (sin intentos), vencida, empezada o sin empezar
export function taskStatus(task, entry, today) {
  if (entry && entry.d) return 'done';
  if (entry && entry.o) return 'out';
  if (isLate(task, today)) return 'late';
  if (entry && entry.n) return 'progress';
  return 'todo';
}

// Franja de color de un % (la celda lleva siempre el número escrito: el color solo acompaña)
export function pctBand(p) {
  if (p === null || p === undefined) return 'none';
  if (p < 50) return 'low';
  if (p < 70) return 'mid';
  if (p < 90) return 'good';
  return 'top';
}

// ---------- Tabla de la clase ----------
const mean = list => (list.length ? Math.round(list.reduce((s, x) => s + x, 0) / list.length) : null);

// Una fila por alumno: celdas por tarea (null si no va para él), minutos de 7 días, vencidas, hechas y media
export function classRows({ students, tasks, summaries, today }) {
  return students.map(st => {
    const sum = summaries[st.id] || null;
    const cells = tasks.map(t => {
      if (!assignedTo(t, st.id)) return null;
      const e = (sum && sum.tasks && sum.tasks[t.id]) || null;
      return { taskId: t.id, p: e ? e.p : null, n: e ? e.n || 0 : 0, status: taskStatus(t, e, today), min: t.minPct };
    });
    const mine = cells.filter(Boolean);
    const week = minutesInLast(sum && sum.days, today, 7);
    return {
      id: st.id, nickname: st.nickname, instrument: st.instrument, summary: sum, cells, week,
      inactive: week === 0, overdue: mine.filter(c => c.status === 'late').length,
      done: mine.filter(c => c.status === 'done').length, assigned: mine.length,
      avg: mean(mine.map(c => c.p || 0)),
      below: mine.some(c => c.status !== 'done' && c.n > 0 && (c.p || 0) < c.min),
      lastAt: sum ? sum.at || null : null, streak: sum ? sum.streak || 0 : 0,
    };
  });
}

// Resumen de una tarea en la clase: a cuántos va, cuántos la han hecho, vencidas y % medio de quien la ha intentado
export function taskStats(task, rows) {
  const i = rows.length ? rows[0].cells.findIndex(c => c && c.taskId === task.id) : -1;
  const cells = rows.map(r => r.cells.find(c => c && c.taskId === task.id)).filter(Boolean);
  return {
    index: i, assigned: cells.length, done: cells.filter(c => c.status === 'done').length,
    late: cells.filter(c => c.status === 'late').length, started: cells.filter(c => c.n > 0).length,
    avg: mean(cells.filter(c => c.n > 0).map(c => c.p || 0)),
  };
}

export const FILTERS = ['all', 'inactive', 'overdue', 'below'];
const FILTER_TEST = { all: () => true, inactive: r => r.inactive, overdue: r => r.overdue > 0, below: r => r.below };
// «attention»: primero quien más ayuda necesita (vencidas, sin practicar, media baja)
const attention = r => r.overdue * 100 + (r.inactive ? 50 : 0) + (100 - (r.avg ?? 0)) / 10;
export function filterRows(rows, filter = 'all', sort = 'name') {
  const list = rows.filter(FILTER_TEST[filter] || FILTER_TEST.all);
  const byName = (a, b) => String(a.nickname).localeCompare(String(b.nickname), 'es');
  return [...list].sort(sort === 'attention' ? (a, b) => attention(b) - attention(a) || byName(a, b) : byName);
}

// Cuántos alumnos hay en cada filtro (para los chips)
export const filterCounts = rows => Object.fromEntries(FILTERS.map(f => [f, rows.filter(FILTER_TEST[f]).length]));

// Unidades de Lenguaje que aparecen en los resúmenes («l1u3»), ordenadas por nivel y unidad
export function unitColumns(summaries) {
  const keys = new Set(Object.values(summaries).flatMap(s => Object.keys((s && s.units) || {})));
  const parse = k => (/^l(\d+)u(\d+)$/.exec(k) || [0, 0, 0]).slice(1).map(Number);
  return [...keys].filter(k => /^l\d+u\d+$/.test(k)).sort((a, b) => { const [la, ua] = parse(a), [lb, ub] = parse(b); return la - lb || ua - ub; });
}

// Racha (días seguidos con práctica hasta hoy o ayer) a partir de { día: minutos }
export function streakFromDays(days, today) {
  if (!days) return 0;
  let day = days[today] > 0 ? today : addDays(today, -1);
  let n = 0;
  while (days[day] > 0) { n++; day = addDays(day, -1); }
  return n;
}
