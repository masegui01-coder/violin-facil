// Aula Pro de extremo a extremo (versión compilada, Chrome real) con Firebase simulado (fake-firebase.mjs):
// el profesor (con licencia) crea una clase y una tarea; el alumno entra con el código, ve «Mis tareas» y la hace;
// el profesor ve el % en la tabla de la clase y en la ficha del alumno. Además: sin licencia, la presentación del Aula;
// el Método Pro sigue a mano; axe sin violaciones graves; y en inglés no queda español a la vista.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launch, MOBILE, DESKTOP, sleep, tap, waitVisible } from './helpers.mjs';
import { createStore, installFakeFirebase } from './fake-firebase.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const SEED = {
  onboarded: true, instrumentChosen: true, instrument: 'violin', tourDone: true, accountPromptSince: Date.now(),
  analyticsConsent: false, reportSeen: '2099-W01', lang: 'es', nom: 'us', styles: ['clasica'], learnView: 'pro', aulaView: 'aula',
};
const TEACHER = { uid: 'teacher-1', displayName: 'Marta', email: 'marta@example.com', isAnonymous: false };
const STUDENT = { uid: 'student-1', displayName: 'Lucía', email: 'lucia@example.com', isAnonymous: false };
const SCHOOL = { name: 'Escuela de Música Prueba', ownerUid: TEACHER.uid, ownerName: 'Marta', code: 'SCHL23', year: '2026-2027', students: 0, premium: { active: true, until: '2099-08-31' } };
const TEACHER_STATE = { school: { schoolId: 'S1', name: SCHOOL.name, code: SCHOOL.code, role: 'teacher', year: '2026-2027' } };
const LESSON_ID = 'u1-intro'; // «Conoce tu violín», lección de teoría del curso: se hace sin micrófono
// Ruido que no depende del Aula: fuentes y recursos externos sin red en la máquina de pruebas
const IGNORED = /fonts\.g|net::ERR|Failed to load resource/;

let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

async function openAs(store, user, { viewport = MOBILE, seed = {}, path = '' } = {}) {
  const context = await env.browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORED.test(m.text())) errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.setViewport(viewport);
  await installFakeFirebase(page, store, user);
  await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), { ...SEED, ...seed });
  await page.goto(env.server.url + path, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#sheet[open]', { timeout: 2000 }).catch(() => {});
  await page.evaluate(() => { const d = document.getElementById('sheet'); if (d && d.open) d.close(); });
  return { page, errors, close: () => context.close() };
}

const text = (page, sel) => page.$eval(sel, el => el.innerText);
async function axeViolations(page) {
  if (!(await page.evaluate(() => !!window.axe))) await page.evaluate(AXE); // por CDP: la CSP no admite scripts en línea
  const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
  return result.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}

// Responde la teoría (primera opción) hasta llegar al resultado
async function finishTheory(page) {
  await waitVisible(page, 'theory', 10000);
  for (let i = 0; i < 60 && !(await page.$eval('#result', el => !el.hidden)); i++) {
    await page.evaluate(() => {
      const opt = document.querySelector('#theoryCard [data-opt]:not([disabled])');
      if (opt) opt.click();
      const next = document.getElementById('theoryNext');
      if (next && !next.hidden && !next.disabled) next.click();
    });
    await sleep(150);
  }
  await waitVisible(page, 'result', 10000);
}

test('profesor crea clase y tarea; el alumno la ve y la hace; el profesor ve su % y su ficha', async () => {
  const store = createStore({ 'schools/S1': SCHOOL });
  // ---- Profesor: nueva clase ----
  const teacher = await openAs(store, TEACHER, { viewport: DESKTOP, seed: TEACHER_STATE });
  const tp = teacher.page;
  await tp.waitForSelector('#aulaNewClass', { timeout: 10000 });
  assert.match(await text(tp, '#proView'), /Aula Pro activa hasta el/);
  await tp.type('#aulaClassName', '1.º A · martes');
  await tp.$eval('#aulaNewClass', f => f.requestSubmit());
  await waitVisible(tp, 'aula', 10000);
  await tp.waitForSelector('#aulaNewTask', { timeout: 10000 });
  const code = (await tp.$eval('#aulaEyebrow', el => el.textContent)).match(/código ([A-Z0-9]{6})/)[1];
  assert.equal(store.docs.get(`classCodes/${code}`).className, '1.º A · martes');
  assert.match(await text(tp, '#aulaBody'), /Invita a tus alumnos/);
  // ---- Profesor: tarea del curso de instrumento, mínimo 50 % ----
  await tp.$eval('#aulaNewTask', b => b.click());
  await tp.waitForSelector('#aulaTaskForm');
  await tp.$eval('[data-src="lesson"]', b => b.click());
  await tp.select('#atLesson', LESSON_ID);
  assert.ok((await tp.$eval('#atTitle', el => el.value)).length > 0, 'el título se rellena con la lección');
  await tp.select('#atMin', '50');
  await tp.$eval('#aulaTaskForm', f => f.requestSubmit());
  await tp.waitForSelector('.aula-task-row', { timeout: 10000 });
  const taskPath = [...store.docs.keys()].find(k => /\/tasks\//.test(k));
  const task = store.docs.get(taskPath);
  assert.equal(task.kind, 'lesson');
  assert.equal(task.ref.id, LESSON_ID);
  assert.equal(task.minPct, 50);
  assert.deepEqual(teacher.errors, []);

  // ---- Alumno: entra con el enlace de invitación y hace la tarea ----
  const student = await openAs(store, STUDENT, { path: `?clase=${code}` });
  const sp = student.page;
  await sp.waitForSelector('#aulaJoin', { timeout: 10000 });
  assert.equal(await sp.$eval('#aulaJoinCode', el => el.value), code, 'el código llega con el enlace');
  await sp.$eval('#aulaJoinNick', el => { el.value = 'Lucía'; });
  await sp.$eval('#aulaJoin', f => f.requestSubmit());
  await sp.waitForSelector('.aula-task [data-do]', { timeout: 10000 });
  assert.match(await text(sp, '#proView'), /Mis tareas/);
  assert.match(await text(sp, '.aula-task'), /Mínimo 50 %/);
  assert.equal(store.docs.get(taskPath.replace(/tasks\/.*/, '')
    .replace(/\/$/, '')).students, 1, 'una plaza ocupada en la clase');
  assert.deepEqual(await axeViolations(sp), [], 'axe: Mis tareas');
  await sp.$eval('.aula-task [data-do]', b => b.click());
  await finishTheory(sp);
  const summaryPath = taskPath.replace(/tasks\/.*/, `summaries/${STUDENT.uid}`);
  const taskId = taskPath.split('/').pop();
  for (let i = 0; i < 40 && !(store.docs.get(summaryPath)?.tasks?.[taskId]); i++) await sleep(250);
  const summary = store.docs.get(summaryPath);
  assert.ok(summary, 'el alumno publica su resumen en la clase');
  assert.equal(summary.nickname, 'Lucía');
  assert.ok(summary.tasks[taskId].n >= 1, 'el intento cuenta para la tarea');
  assert.ok(!('email' in summary), 'el resumen no lleva el correo');
  assert.deepEqual(student.errors, []);

  // ---- Profesor: vuelve a la clase y ve el % de Lucía ----
  await tap(tp, '#aulaBack');
  await tp.waitForSelector('[data-open-class]', { timeout: 10000 });
  await tp.click('[data-open-class]');
  await tp.waitForSelector('.aula-table [data-student]', { timeout: 10000 });
  const cell = await text(tp, '.aula-table .aula-cell-btn');
  assert.match(cell, /\d+ %/, 'la celda lleva el % escrito');
  assert.match(await text(tp, '.aula-table tbody tr'), /Lucía/);
  assert.match(await text(tp, '.aula-task-row'), /1 de 1 la han hecho|0 de 1 la han hecho/);
  assert.deepEqual(await axeViolations(tp), [], 'axe: clase del profesor');
  // Comentario a la entrega
  await tp.click('.aula-table .aula-cell-btn');
  await tp.waitForSelector('#aulaComment');
  await tp.type('#aulaComment', '¡Muy bien!');
  await tp.click('#aulaSaveComment');
  for (let i = 0; i < 20 && ![...store.docs.keys()].some(k => /\/feedback\//.test(k)); i++) await sleep(150);
  const fb = [...store.docs.entries()].find(([k]) => /\/feedback\//.test(k))[1];
  assert.deepEqual([fb.uid, fb.comment], [STUDENT.uid, '¡Muy bien!']);
  // Ficha del alumno
  await tp.waitForSelector('.aula-table [data-student]', { timeout: 10000 });
  await tp.click('.aula-table [data-student]');
  await tp.waitForSelector('.aula-history li', { timeout: 10000 });
  assert.match(await text(tp, '#aulaTitle'), /Lucía/);
  assert.match(await text(tp, '#aulaBody'), /Competencias/);
  assert.deepEqual(await axeViolations(tp), [], 'axe: ficha del alumno');
  // Atrás vuelve a la clase, no a Aprender
  await tp.click('#aulaBack');
  await tp.waitForSelector('.aula-table', { timeout: 5000 });
  assert.deepEqual(teacher.errors, []);

  // ---- El alumno ve el comentario de su profesor ----
  // (sin recargar: la semilla de la prueba volvería a escribir el almacenamiento local)
  await sp.$eval('[data-tab="learn"]', b => b.click());
  await waitVisible(sp, 'learn');
  await sp.waitForSelector('[data-pro-view="aula"]', { timeout: 10000 });
  await sp.$eval('[data-pro-view="aula"]', b => b.click());
  await sp.waitForSelector('.aula-task .stamp, .aula-done', { timeout: 10000 });
  await sp.evaluate(() => document.querySelectorAll('details.aula-done').forEach(d => { d.open = true; }));
  assert.match(await text(sp, '#proView'), /¡Muy bien!/);
  await student.close();
  await teacher.close();
});

test('sin licencia: presentación del Aula y «Solicitar acceso»; el Método Pro sigue a un toque', async () => {
  const store = createStore();
  const { page, errors, close } = await openAs(store, TEACHER);
  await page.waitForSelector('#aulaRequest', { timeout: 10000 });
  const shown = await text(page, '#proView');
  assert.match(shown, /Soy profesor/);
  assert.match(shown, /Soy alumno/);
  assert.match(shown, /Para tus alumnos es gratis/);
  await page.type('#aulaSchoolName', 'Academia Do Re Mi');
  await page.$eval('#aulaOwner', el => { el.value = 'Marta'; });
  await page.$eval('#aulaRequest', f => f.requestSubmit());
  await page.waitForSelector('.aula-requested', { timeout: 10000 });
  const school = [...store.docs.entries()].find(([k]) => /^schools\/[^/]+$/.test(k))[1];
  assert.equal(school.name, 'Academia Do Re Mi');
  assert.ok(school.proRequestedAt, 'la petición queda a la vista del administrador');
  assert.ok(!school.premium, 'el profesor nunca se pone la licencia');
  await page.click('[data-pro-view="method"]');
  await page.waitForSelector('#proPane .pro-level', { timeout: 10000 });
  assert.deepEqual(await axeViolations(page), [], 'axe: presentación y Método Pro');
  assert.deepEqual(errors, []);
  await close();
});

const SPANISH = /(?<!\p{L})(Alumnos?|Tareas?|Clase|Seguimiento|Vencidas?|Promedio|Mínimo|Hecha|intentos?|Informes?|Nueva tarea|Sin practicar|Competencias|Minutos|Invitar|Ajustes|Borrar|semana|días)(?!\p{L})/u;

test('en inglés: el Aula del profesor y la clase sin español a la vista', async () => {
  const store = createStore({
    'schools/S1': SCHOOL, 'schools/S1/classes/C1': { name: 'Group A', code: 'ABCDEF', teacherName: 'Marta', students: 1, createdAt: { __ts: Date.now() } },
    'classCodes/ABCDEF': { schoolId: 'S1', classId: 'C1', className: 'Group A', teacherName: 'Marta' },
    'schools/S1/classes/C1/students/u2': { nickname: 'Leo', instrument: 'violin', code: 'ABCDEF', joinedAt: { __ts: Date.now() } },
    'schools/S1/classes/C1/tasks/T1': { title: 'Scales', kind: 'lesson', ref: { id: LESSON_ID, inst: 'violin', label: 'Violín · Conoce tu violín' }, due: '2020-01-01', minPct: 60, maxAttempts: 0, variant: 'any', to: [], note: '', createdAt: Date.now() - 1000 },
    'schools/S1/classes/C1/summaries/u2': { nickname: 'Leo', instrument: 'violin', at: Date.now(), term: 'x', days: {}, streak: 0, skills: {}, mistakes: { '3M-3m': 2 }, units: {}, tasks: { T1: { p: 40, n: 1, d: false, l: Date.now(), o: false } }, recent: [{ id: LESSON_ID, p: 40, at: Date.now(), t: 'Conoce tu violín' }] },
  });
  const { page, errors, close } = await openAs(store, TEACHER, { viewport: DESKTOP, seed: { ...TEACHER_STATE, lang: 'en' } });
  await page.waitForSelector('[data-open-class]', { timeout: 10000 });
  await sleep(300);
  assert.doesNotMatch(await text(page, '#proView'), SPANISH, 'inicio del Aula');
  await page.click('[data-open-class]');
  await page.waitForSelector('.aula-table', { timeout: 10000 });
  await sleep(300);
  const cls = await text(page, '#aula');
  assert.doesNotMatch(cls, SPANISH, cls.match(SPANISH)?.[0]);
  assert.match(cls, /Overdue/);
  await page.click('.aula-table [data-student]');
  await page.waitForSelector('.aula-history li', { timeout: 10000 });
  await sleep(300);
  const file = await text(page, '#aula');
  assert.doesNotMatch(file, SPANISH, file.match(SPANISH)?.[0]);
  assert.match(file, /Confuses major 3rd with minor 3rd/);
  await page.click('#aulaBack');
  await page.waitForSelector('#aulaNewTask');
  await page.click('#aulaNewTask');
  await page.waitForSelector('#aulaTaskForm');
  await sleep(300);
  const form = await text(page, '#aulaTaskForm');
  assert.doesNotMatch(form, SPANISH, form.match(SPANISH)?.[0]);
  assert.deepEqual(errors, []);
  await close();
});
