// Aula Pro: acceso, tareas, estado de cada entrega, tabla de la clase, resumen del alumno, baremo y CSV.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proAccess, aulaSchoolId } from '../js/pro-access.js';
import {
  normalizeTask, assignedTo, taskTargets, applyAttempt, taskStatus, pctBand, classRows, taskStats, filterRows, filterCounts,
  unitColumns, streakFromDays, minutesInLast, lessonPct, lessonIdFor, addDays,
} from '../js/aula.js';
import { cleanLmResult, addToLog, skillsPct, unitPcts, applyToTasks, buildSummary } from '../js/aula-summary.js';
import { grade10, gradeWord, termOf, termLabel, termReport, csvCell, classCsv } from '../js/aula-report.js';
import { lmTree, flattenLm, mistakeLabel, attemptLabel } from '../js/aula-temario.js';

const NOW = Date.parse('2026-11-05T10:00');
const TODAY = '2026-11-05';
const EXERCISES = [
  { id: 'lm1-u1-ritmo-a-facil', level: 1, unit: 1, section: 'ritmo', variant: 'facil' },
  { id: 'lm1-u1-ritmo-a-medio', level: 1, unit: 1, section: 'ritmo', variant: 'medio' },
  { id: 'lm1-u1-teoria-a-facil', level: 1, unit: 1, section: 'teoria', variant: 'facil' },
  { id: 'lm1-u2-ritmo-a-facil', level: 1, unit: 2, section: 'ritmo', variant: 'facil' },
];
const task = (over = {}) => ({ id: 't1', title: 'Ritmo', kind: 'lm-section', ref: { level: 1, unit: 1, section: 'ritmo' }, due: null, minPct: 60, maxAttempts: 0, variant: 'any', to: [], createdAt: NOW - 1000, ...over });

test('acceso Pro: solo con la licencia vigente de la escuela (un único punto)', () => {
  const now = Date.UTC(2026, 10, 5);
  assert.deepEqual(proAccess({ school: { premium: { active: true, until: '2027-08-31' } }, now }), { active: true, source: 'license', until: Date.parse('2027-08-31'), requested: false });
  assert.equal(proAccess({ school: { premium: { active: true, until: '2026-08-31' } }, now }).active, false, 'caducada');
  assert.equal(proAccess({ school: null }).active, false);
  assert.equal(proAccess({ school: { proRequestedAt: 1 } }).requested, true);
  assert.equal(proAccess({ purchase: { active: true } }).active, false, 'las compras de tienda aún no cuentan');
  assert.equal(aulaSchoolId({ school: { role: 'teacher', schoolId: 'S' } }), 'S');
  assert.equal(aulaSchoolId({ school: { role: 'student', schoolId: 'S' }, aula: { schoolId: 'A' } }), 'A');
  assert.equal(aulaSchoolId({}), null);
});

test('crear tarea: valida lo que pide el temario y deja solo los campos que aceptan las reglas', () => {
  assert.match(normalizeTask({ title: '', kind: 'lesson' }).error, /título/);
  assert.match(normalizeTask({ title: 'x', kind: 'nada' }).error, /temario/);
  assert.match(normalizeTask({ title: 'x', kind: 'lm-section', ref: { level: 1, unit: 2 } }).error, /sección/);
  assert.match(normalizeTask({ title: 'x', kind: 'lm-ex', ref: { ids: [] } }).error, /ejercicio/);
  assert.match(normalizeTask({ title: 'x', kind: 'xml' }).error, /MusicXML/);
  assert.match(normalizeTask({ title: 'x', kind: 'lesson', ref: { id: 'u1' }, due: '2026-11-01' }, NOW).error, /ya ha pasado/);
  const { task: t } = normalizeTask({ title: '  Lección 1 ', kind: 'lesson', ref: { id: 'u1-intro', label: 'Conoce tu violín', inst: 'violin', junk: 1 }, minPct: 140, maxAttempts: -3, variant: 'raro', to: ['a', 'a', 'b'], due: '2026-11-20', note: 'Hazla' }, NOW);
  assert.deepEqual(t, { title: 'Lección 1', kind: 'lesson', ref: { id: 'u1-intro', inst: 'violin', label: 'Conoce tu violín' }, due: '2026-11-20', minPct: 100, maxAttempts: 0, variant: 'any', to: ['a', 'b'], note: 'Hazla', createdAt: NOW });
  assert.equal(assignedTo(t, 'a'), true);
  assert.equal(assignedTo(t, 'c'), false);
  assert.equal(assignedTo({ to: [] }, 'c'), true, 'sin alumnos marcados va para toda la clase');
});

test('qué cuenta para cada tarea: ejercicios del catálogo según unidad, sección y variante; lecciones por su id', () => {
  assert.deepEqual(taskTargets(task(), EXERCISES), ['lm1-u1-ritmo-a-facil', 'lm1-u1-ritmo-a-medio']);
  assert.deepEqual(taskTargets(task({ variant: 'medio' }), EXERCISES), ['lm1-u1-ritmo-a-medio']);
  assert.deepEqual(taskTargets(task({ kind: 'lm-unit', variant: 'facil' }), EXERCISES), ['lm1-u1-ritmo-a-facil', 'lm1-u1-teoria-a-facil']);
  assert.deepEqual(taskTargets(task({ kind: 'lm-ex', ref: { ids: ['x'] } }), EXERCISES), ['x']);
  assert.deepEqual(taskTargets(task({ kind: 'method', ref: { id: 'violin_c1_n1' } })), ['pro-violin_c1_n1']);
  assert.equal(lessonIdFor({ kind: 'xml', id: 'T9', ref: {} }), 'aula-T9');
  assert.equal(lessonPct({ stars: 2 }), 67);
  assert.equal(lessonPct({ stars: 1, accuracy: 0.84 }), 84);
});

test('entregas: mejor % por ejercicio, intentos limitados por ejercicio y solo después de crear la tarea', () => {
  const t = task({ maxAttempts: 2 });
  const targets = taskTargets(t, EXERCISES);
  assert.equal(applyAttempt(undefined, t, targets, { id: 'lm1-u1-ritmo-a-facil', pct: 90, at: NOW - 5000 }), undefined, 'antes de la tarea no cuenta');
  assert.equal(applyAttempt(undefined, t, targets, { id: 'otro', pct: 90, at: NOW }), undefined);
  let e = applyAttempt(undefined, t, targets, { id: 'lm1-u1-ritmo-a-facil', pct: 80, at: NOW });
  assert.deepEqual({ p: e.p, n: e.n, d: e.d, o: e.o }, { p: 40, n: 1, d: false, o: false });
  const before = e;
  e = applyAttempt(e, t, targets, { id: 'lm1-u1-ritmo-a-medio', pct: 50, at: NOW + 1 });
  assert.equal(before.p, 40, 'no se muta la entrega anterior');
  assert.deepEqual({ p: e.p, d: e.d }, { p: 65, d: true });
  assert.equal(taskStatus(t, e, TODAY), 'done');
  // Sin llegar al mínimo y sin intentos: agotada
  const strict = task({ maxAttempts: 1, minPct: 95, kind: 'lm-ex', ref: { ids: ['a'] } });
  const out = applyAttempt(undefined, strict, ['a'], { id: 'a', pct: 50, at: NOW });
  assert.equal(out.o, true);
  assert.equal(applyAttempt(out, strict, ['a'], { id: 'a', pct: 100, at: NOW + 1 }), out, 'el intento de más no cuenta');
  assert.equal(taskStatus(strict, out, TODAY), 'out');
  assert.equal(taskStatus(task({ due: '2026-11-01' }), null, TODAY), 'late');
  assert.equal(taskStatus(task({ due: '2026-11-05' }), null, TODAY), 'todo', 'el día de entrega aún no está vencida');
  assert.equal(taskStatus(task(), { n: 1, p: 10 }, TODAY), 'progress');
  assert.deepEqual([null, 10, 55, 75, 95].map(pctBand), ['none', 'low', 'mid', 'good', 'top']);
});

test('tabla de la clase: celdas por tarea, sin practicar esta semana, vencidas, por debajo del mínimo y filtros', () => {
  const tasks = [task({ id: 'a' }), task({ id: 'b', due: '2026-11-01', to: ['ana'] })];
  const students = [{ id: 'ana', nickname: 'Ana' }, { id: 'bea', nickname: 'Bea' }, { id: 'carl', nickname: 'Carlos' }];
  const summaries = {
    ana: { at: NOW, days: { [TODAY]: 20, '2026-10-01': 30 }, streak: 1, tasks: { a: { p: 100, n: 2, d: true } } },
    bea: { at: NOW, days: { '2026-10-20': 15 }, tasks: { a: { p: 30, n: 1 } } },
  };
  const rows = classRows({ students, tasks, summaries, today: TODAY });
  const [ana, bea, carl] = rows;
  assert.deepEqual(ana.cells.map(c => c && c.status), ['done', 'late']);
  assert.equal(bea.cells[1], null, 'la tarea b no es para Bea');
  assert.deepEqual([ana.week, bea.week, carl.week], [20, 0, 0]);
  assert.deepEqual([ana.overdue, ana.done, ana.assigned, ana.avg], [1, 1, 2, 50]);
  assert.equal(bea.below, true);
  assert.equal(carl.below, false, 'sin intentos no está «por debajo»: está sin empezar');
  assert.deepEqual(filterRows(rows, 'inactive').map(r => r.id), ['bea', 'carl']);
  assert.deepEqual(filterRows(rows, 'overdue').map(r => r.id), ['ana']);
  assert.deepEqual(filterRows(rows, 'all', 'attention')[0].id, 'ana');
  assert.deepEqual(filterCounts(rows), { all: 3, inactive: 2, overdue: 1, below: 1 });
  assert.deepEqual(taskStats(tasks[0], rows), { index: 0, assigned: 3, done: 1, late: 0, started: 2, avg: 65 });
  assert.deepEqual(unitColumns({ a: { units: { l1u10: 5, l1u2: 9 } }, b: { units: { l2u1: 1, raro: 3 } } }), ['l1u2', 'l1u10', 'l2u1']);
  assert.equal(streakFromDays({ '2026-11-04': 5, '2026-11-03': 5, '2026-11-01': 5 }, TODAY), 2);
  assert.equal(minutesInLast({ '2026-10-30': 10, '2026-10-29': 99 }, TODAY, 7), 10);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('resumen del alumno: resultados saneados, errores contados, competencias del trimestre y topes de las reglas', () => {
  assert.equal(cleanLmResult({ id: 'mal id con espacios', pct: 50 }), null);
  const r = cleanLmResult({ id: 'lm1-u1-ritmo-a-facil', level: 1, unit: 1, section: 'ritmo', pct: 140, at: NOW, skills: { ritmo: 80, raro: 3 }, mistakes: ['3M-3m', '<b>', ...Array(20).fill('x')] });
  assert.equal(r.pct, 100);
  assert.deepEqual(r.skills, { ritmo: 80 });
  assert.equal(r.mistakes.length, 10);
  assert.ok(!r.mistakes.includes('<b>'));
  let log = addToLog(undefined, r, '2026-2027-1');
  log = addToLog(log, { ...r, pct: 60, skills: { ritmo: 40 }, mistakes: ['3M-3m'], at: NOW + 1 }, '2026-2027-1');
  assert.equal(log.r['lm1-u1-ritmo-a-facil'].b, 100);
  assert.equal(log.r['lm1-u1-ritmo-a-facil'].n, 2);
  assert.equal(log.m['3M-3m'], 2);
  assert.deepEqual(skillsPct(log, '2026-2027-1'), { ritmo: 60 });
  assert.deepEqual(skillsPct(log, '2026-2027-2'), {}, 'el trimestre nuevo empieza de cero');
  assert.deepEqual(unitPcts(EXERCISES, log), { l1u1: 50 }, 'ritmo 100 (mejor variante) y teoría 0');

  const cls = { sid: 'S', cid: 'C', nickname: 'Ana', instrument: 'violin' };
  const aula = { classes: [cls], tasks: { 'S/C': [task()] }, log };
  const prog = applyToTasks(aula, { id: 'lm1-u1-ritmo-a-facil', pct: 100, at: NOW }, EXERCISES);
  assert.deepEqual(prog['C/t1'].p, 50);
  assert.deepEqual(applyToTasks(aula, { id: 'nada', pct: 100, at: NOW }, EXERCISES), {}, 'un intento ajeno no crea entregas vacías');
  const days = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [addDays(TODAY, -i), 10]));
  const sum = buildSummary({ cls, aula: { ...aula, prog }, practiceLog: { ...days, '2026-11-04': 0 }, streak: 3, exercises: EXERCISES, now: NOW, termId: '2026-2027-1' });
  assert.deepEqual(Object.keys(sum).sort(), ['at', 'days', 'instrument', 'mistakes', 'nickname', 'recent', 'skills', 'streak', 'tasks', 'term', 'units']);
  assert.equal(Object.keys(sum.days).length, 91, '92 días como mucho y sin los días a 0');
  assert.deepEqual(sum.tasks.t1, { p: 50, n: 1, d: false, l: NOW, o: false });
  assert.equal(sum.recent.length, 2);
});

test('baremo 1-10, trimestres e informe por competencias', () => {
  assert.deepEqual([0, 44, 45, 94, 95, 100, null].map(grade10), [1, 4, 5, 9, 10, 10, null]);
  assert.deepEqual([3, 5, 6, 8, 9, null].map(gradeWord), ['Insuficiente', 'Suficiente', 'Bien', 'Notable', 'Sobresaliente', 'Sin datos']);
  assert.deepEqual(termOf(new Date(2026, 10, 5)), { id: '2026-2027-1', n: 1, course: '2026-2027', start: '2026-09-01', end: '2026-12-31' });
  assert.equal(termOf(new Date(2027, 1, 5)).id, '2026-2027-2');
  assert.equal(termOf(new Date(2027, 6, 5)).id, '2026-2027-3');
  assert.equal(termLabel(termOf(new Date(2027, 1, 5))), '2.º trimestre · curso 2026-2027');
  const term = termOf(new Date(2026, 10, 5));
  const tasks = [task({ id: 'a', createdAt: Date.parse('2026-10-01T10:00') }), task({ id: 'old', createdAt: Date.parse('2026-06-01T10:00') })];
  const summary = { term: term.id, skills: { ritmo: 72, teoria: 38 }, days: { '2026-10-01': 30, '2026-11-02': 15, '2026-08-01': 50 }, tasks: { a: { p: 80, n: 1, d: true } }, mistakes: { x: 1, y: 5 } };
  const rep = termReport({ summary, tasks, uid: 'ana', term, today: TODAY });
  assert.equal(rep.minutes, 45);
  assert.equal(rep.daysPracticed, 2);
  assert.deepEqual(rep.rows.map(r => [r.id, r.grade]), [['ritmo', 7], ['entonacion', null], ['lectura', null], ['teoria', 4], ['dictado', null], ['audicion', null], ['tareas', 8], ['constancia', 1]]);
  assert.equal(rep.overall, 5);
  assert.deepEqual([rep.done, rep.assigned], [1, 1]);
  assert.deepEqual(rep.mistakes[0], ['y', 5]);
  const other = termReport({ summary: { ...summary, term: '2025-2026-3' }, tasks, uid: 'ana', term, today: TODAY });
  assert.equal(other.rows[0].pct, null, 'las competencias de otro trimestre no cuentan');
});

test('CSV: punto y coma, comillas y sin fórmulas inyectadas', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('-5'), "'-5");
  assert.equal(csvCell('Ana; Bea'), '"Ana; Bea"');
  const tasks = [task({ id: 'a', title: 'Ritmo 1' })];
  const rows = classRows({ students: [{ id: 'ana', nickname: '+Ana', instrument: 'violin' }], tasks, summaries: { ana: { tasks: { a: { p: 70, n: 1, d: true } }, days: {} } }, today: TODAY });
  const csv = classCsv({ rows, tasks, term: termOf(new Date(2026, 10, 5)), today: TODAY, instrumentName: () => 'Violín' });
  const [head, line] = csv.split('\r\n');
  assert.match(head, /^Alumno;Instrumento;/);
  assert.match(head, /;Ritmo 1 \(%\)$/);
  assert.match(line, /^'\+Ana;Violín;0;0;0;0;1;1;0;70;/);
  assert.match(line, /;70$/);
});

test('temario: catálogo de Lenguaje leído con tolerancia, errores e intentos con nombre', () => {
  const tree = lmTree([{ n: 1, titulo: 'Uno', unidades: [{ titulo: 'U', ejercicios: [{ id: 'e1', section: 'ritmo', variant: 'medio', titulo: 'Palmas' }, { title: 'sin id' }] }] }]);
  assert.deepEqual(flattenLm(tree), [{ id: 'e1', level: 1, unit: 1, section: 'ritmo', variant: 'medio', title: 'Palmas' }]);
  assert.deepEqual(tree[0].units[0].sections, ['ritmo']);
  assert.equal(mistakeLabel('3M-3m'), 'Confunde 3.ª mayor con 3.ª menor');
  assert.equal(mistakeLabel('ZZ', { ZZ: 'Silencios' }), 'Silencios');
  assert.equal(mistakeLabel('raro'), 'raro');
  assert.equal(attemptLabel({ id: 'e1' }, flattenLm(tree)), 'N1 · U1 · Ritmo · Palmas');
  assert.equal(attemptLabel({ id: 'x', t: 'Conoce tu violín' }), 'Conoce tu violín');
});

test('evaluación 1: licencia caducada, promedio de lo exigible y competencias del trimestre anterior', () => {
  const now = Date.UTC(2026, 10, 5);
  const expired = proAccess({ school: { premium: { active: true, until: '2026-08-31' }, proRequestedAt: { toMillis: () => Date.UTC(2026, 9, 1) } }, now });
  assert.deepEqual([expired.active, expired.expired, expired.requested], [false, true, true]);
  assert.equal(proAccess({ school: { premium: { active: true, until: '2026-08-31' }, proRequestedAt: { toMillis: () => Date.UTC(2026, 0, 1) } }, now }).requested, false, 'la petición antigua no cuenta como renovación');
  // Lucía: 92 % en lo exigible y una tarea que vence dentro de 10 días sin empezar → 92 %, no 46 %
  const tasks = [task({ id: 'a' }), task({ id: 'b', due: addDays(TODAY, 10) })];
  const [row] = classRows({ students: [{ id: 'l', nickname: 'Lucía' }], tasks, summaries: { l: { tasks: { a: { p: 92, n: 1, d: true } }, days: {} } }, today: TODAY });
  assert.deepEqual([row.avg, row.pending], [92, 1]);
  const term = termOf(new Date(2026, 10, 5));
  assert.equal(termReport({ summary: { tasks: { a: { p: 92, n: 1, d: true } } }, tasks, uid: 'l', term, today: TODAY }).rows.find(r => r.id === 'tareas').pct, 92);
  // Competencias: al cambiar de trimestre las del anterior se guardan y el informe de ese trimestre las usa
  let log = addToLog(undefined, { id: 'x', pct: 80, at: NOW, skills: { ritmo: 80 } }, '2026-2027-1');
  log = addToLog(log, { id: 'y', pct: 40, at: NOW + 1, skills: { ritmo: 40 } }, '2026-2027-2');
  assert.deepEqual(skillsPct(log, '2026-2027-2'), { ritmo: 40 });
  const cls = { sid: 'S', cid: 'C', nickname: 'Ana' };
  const sum = buildSummary({ cls, aula: { log }, practiceLog: {}, streak: 0, exercises: [], now: NOW, termId: '2026-2027-2' });
  assert.deepEqual([sum.prevTerm, sum.prevSkills], ['2026-2027-1', { ritmo: 80 }]);
  const rep = termReport({ summary: sum, tasks: [], uid: 'x', term: { ...term }, today: TODAY });
  assert.equal(rep.rows[0].pct, 80, 'el informe del 1.er trimestre usa las competencias guardadas');
});

test('evaluación 2: último día de licencia válido, licencia quitada = caducada y sin datos no es un 1', () => {
  const lastDay = Date.parse('2026-08-31T18:00:00Z');
  assert.equal(proAccess({ school: { premium: { active: true, until: '2026-08-31' } }, now: lastDay }).active, true, 'vale todo el último día, como las reglas');
  assert.equal(proAccess({ school: { premium: { active: true, until: '2026-08-31' } }, now: Date.parse('2026-09-01T00:00:01Z') }).active, false);
  const revoked = proAccess({ school: { premium: { active: false } } });
  assert.deepEqual([revoked.active, revoked.expired, revoked.revoked, revoked.expiredAt], [false, true, true, null]);
  assert.equal(proAccess({ school: { name: 'x' } }).expired, undefined, 'sin licencia nunca: presentación, no caducada');
  const term = termOf(new Date(2026, 10, 5));
  const rep = termReport({ summary: null, tasks: [task({ id: 'a', due: '2026-10-01', createdAt: Date.parse('2026-09-20') })], uid: 'x', term, today: TODAY });
  assert.equal(rep.overall, null);
  assert.ok(rep.rows.every(r => r.grade === null));
});
