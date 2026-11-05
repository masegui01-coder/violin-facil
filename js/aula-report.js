// Aula Pro (sin DOM ni red): informe trimestral con baremo 1-10 por competencia y exportación CSV de la clase.
// Baremo: nota = % ÷ 10 redondeado (mínimo 1). 5 es suficiente. Constancia: 3 días de práctica por semana = 100 %.
import { assignedTo, taskStatus, minutesInLast } from './aula.js';

export const COMPETENCIES = [
  ['ritmo', 'Ritmo'], ['entonacion', 'Entonación'], ['lectura', 'Lectura'],
  ['teoria', 'Teoría'], ['dictado', 'Dictado'], ['audicion', 'Audición'],
];
export const DAYS_PER_WEEK_GOAL = 3;
const WEEK_MS = 7 * 864e5;

export function grade10(pct) {
  if (pct === null || pct === undefined || !Number.isFinite(Number(pct))) return null;
  return Math.min(10, Math.max(1, Math.round(Number(pct) / 10)));
}

export function gradeWord(grade) {
  if (grade === null) return 'Sin datos';
  if (grade < 5) return 'Insuficiente';
  if (grade === 5) return 'Suficiente';
  if (grade === 6) return 'Bien';
  if (grade <= 8) return 'Notable';
  return 'Sobresaliente';
}

// Trimestres del curso escolar: 1.º septiembre-diciembre, 2.º enero-marzo, 3.º abril-agosto
export function termOf(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const course = m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  const n = m >= 8 ? 1 : m <= 2 ? 2 : 3;
  const [start, end] = n === 1 ? [`${y}-09-01`, `${y}-12-31`] : n === 2 ? [`${y}-01-01`, `${y}-03-31`] : [`${y}-04-01`, `${y}-08-31`];
  return { id: `${course}-${n}`, n, course, start, end };
}

const TERM_ORDINAL = { 1: '1.er', 2: '2.º', 3: '3.er' };
export const termLabel = term => `${TERM_ORDINAL[term.n]} trimestre · curso ${term.course}`;

const inTerm = (day, term) => day >= term.start && day <= term.end;

// Informe de un alumno en un trimestre. summary: lo que publica en la clase; tasks: las de la clase
export function termReport({ summary, tasks, uid, term, today }) {
  const sum = summary || {};
  const days = Object.entries(sum.days || {}).filter(([d, m]) => inTerm(d, term) && m > 0);
  const minutes = Math.round(days.reduce((s, [, m]) => s + m, 0));
  const until = today < term.end ? today : term.end;
  const weeks = Math.max(1, Math.ceil((new Date(until + 'T12:00') - new Date(term.start + 'T12:00') + 1) / WEEK_MS));
  const consistency = Math.min(100, Math.round(days.length / (weeks * DAYS_PER_WEEK_GOAL) * 100));
  // Competencias del trimestre pedido: las del curso o, si es el anterior, las que el alumno guardó de él (prevSkills)
  const source = sum.term === term.id ? sum.skills : sum.prevTerm === term.id ? sum.prevSkills : null;
  const skills = COMPETENCIES.map(([id, label]) => {
    const pct = source && Number.isFinite(source[id]) ? Math.round(source[id]) : null;
    return { id, label, pct, grade: grade10(pct) };
  });
  const termTasks = tasks.filter(t => assignedTo(t, uid) && (t.createdAt || 0) >= Date.parse(term.start + 'T00:00') && (t.createdAt || 0) <= Date.parse(term.end + 'T23:59'));
  const entries = termTasks.map(t => ({ task: t, entry: (sum.tasks || {})[t.id] || null }));
  const done = entries.filter(e => e.entry && e.entry.d).length;
  // Nota de tareas: solo lo exigible (empezado, hecho, agotado o vencido); lo que aún no vence y no se ha empezado no baja la nota
  const due = entries.filter(e => taskStatus(e.task, e.entry, today) !== 'todo');
  const tasksPct = due.length ? Math.round(due.reduce((s, e) => s + ((e.entry && e.entry.p) || 0), 0) / due.length) : null;
  const rows = [
    ...skills,
    { id: 'tareas', label: 'Tareas', pct: tasksPct, grade: grade10(tasksPct) },
    { id: 'constancia', label: 'Constancia', pct: days.length ? consistency : 0, grade: grade10(days.length ? consistency : 0) },
  ];
  // Sin resumen (el alumno aún no ha abierto la app con la clase): no hay datos, no un 1
  if (!summary) rows.forEach((r, i) => { rows[i] = { ...r, pct: null, grade: null }; });
  const graded = rows.filter(r => r.grade !== null);
  const overall = graded.length ? Math.round(graded.reduce((s, r) => s + r.grade, 0) / graded.length * 10) / 10 : null;
  return {
    term, minutes, daysPracticed: days.length, weeks, rows, overall,
    tasks: entries.map(e => ({ title: e.task.title, due: e.task.due, minPct: e.task.minPct, pct: e.entry ? e.entry.p : null, attempts: e.entry ? e.entry.n || 0 : 0, status: taskStatus(e.task, e.entry, today) })),
    done, assigned: entries.length,
    mistakes: Object.entries(sum.mistakes || {}).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}

// ---------- CSV (punto y coma, como lo abre Excel en español) ----------
// Las celdas que empiezan por = + - @ se escapan para que una hoja de cálculo no las ejecute como fórmula
export function csvCell(v) {
  const text = String(v ?? '');
  const safe = /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
  return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// rows: classRows(); tasks: las de la clase; tr: traductor de los encabezados (t() de i18n.js)
export function classCsv({ rows, tasks, term, today, tr = x => x, instrumentName = x => x }) {
  const head = [tr('Alumno'), tr('Instrumento'), tr('Minutos (7 días)'), tr('Minutos del trimestre'), tr('Días de práctica del trimestre'), tr('Racha'),
    tr('Tareas hechas'), tr('Tareas asignadas'), tr('Vencidas'), tr('Media de tareas (%)'),
    ...COMPETENCIES.flatMap(([, label]) => [`${tr(label)} (%)`, `${tr(label)} (1-10)`]), tr('Nota media (1-10)'),
    ...tasks.map(t => `${t.title} (%)`)];
  const body = rows.map(r => {
    const rep = termReport({ summary: r.summary, tasks, uid: r.id, term, today });
    const skill = id => rep.rows.find(x => x.id === id);
    return [r.nickname, instrumentName(r.instrument), minutesInLast(r.summary && r.summary.days, today, 7), rep.minutes, rep.daysPracticed, r.streak,
      r.done, r.assigned, r.overdue, r.avg ?? '',
      ...COMPETENCIES.flatMap(([id]) => [skill(id).pct ?? '', skill(id).grade ?? '']), rep.overall ?? '',
      ...r.cells.map(c => (c ? c.p ?? 0 : '—'))];
  });
  return [head, ...body].map(line => line.map(csvCell).join(';')).join('\r\n');
}
