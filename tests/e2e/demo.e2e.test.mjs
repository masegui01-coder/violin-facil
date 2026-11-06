// Modo prueba de extremo a extremo (versión compilada, Chrome real) con Firebase simulado (fake-firebase.mjs): dos testers
// sin cuenta en dos «móviles». El profesor entra con «Probar sin cuenta» → Profesor (escuela y licencia de prueba), crea
// una clase y una tarea; el alumno entra → Alumno, se une con el código y hace la tarea; el profesor ve su %. Además:
// alumnos de ejemplo, salir (se borra todo lo de la prueba) y cambiar de papel en el mismo móvil.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, MOBILE, DESKTOP, sleep, tap, waitVisible } from './helpers.mjs';
import { createStore, installFakeFirebase } from './fake-firebase.mjs';
import { decodeSummary } from '../../js/aula-wire.js';

// Tester nuevo: sin cuenta y sin haber pasado la bienvenida, así que la app abre la pantalla de acceso
const SEED = { onboarded: false, analyticsConsent: false, reportSeen: '2099-W01', lang: 'es', nom: 'us', styles: ['clasica'] };
const LESSON_ID = 'u1-intro'; // lección de teoría del curso de violín: se hace sin micrófono
const IGNORED = /fonts\.g|net::ERR|Failed to load resource/;
const DAY = 864e5;

let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

async function openTester(store, { viewport = MOBILE } = {}) {
  const context = await env.browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORED.test(m.text())) errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.setViewport(viewport);
  await installFakeFirebase(page, store, null);
  await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), SEED);
  await page.goto(env.server.url, { waitUntil: 'networkidle0' });
  return { page, errors, close: () => context.close() };
}

const text = (page, sel) => page.$eval(sel, el => el.innerText);
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('violin-facil-v2')));

// Pantalla de acceso → «Probar sin cuenta» → papel
async function enterDemo(page, role) {
  await page.waitForSelector('#acDemo', { visible: true, timeout: 10000 });
  await page.$eval('#acDemo', b => b.click());
  await page.waitForSelector(`#sheet[open] [data-demo-role="${role}"]`, { timeout: 5000 });
  await page.$eval(`[data-demo-role="${role}"]`, b => b.click());
  await page.waitForSelector('#demoBanner:not([hidden])', { timeout: 10000 });
}

// Salir o cambiar de papel desde el aviso de arriba (con su confirmación)
async function bannerAction(page, id) {
  await page.$eval(`#${id}`, b => b.click());
  await page.waitForSelector('#sheet[open] #demoExitOk', { timeout: 5000 });
  await page.$eval('#demoExitOk', b => b.click());
}

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

const schoolsIn = store => [...store.docs.keys()].filter(k => /^schools\/[^/]+$/.test(k));

test('dos testers sin cuenta: el profesor de prueba asigna, el alumno de prueba practica y el profesor ve el resultado', async () => {
  const store = createStore();
  // ---- Móvil 1: profesor de prueba ----
  const teacher = await openTester(store, { viewport: DESKTOP });
  const tp = teacher.page;
  assert.match(await text(tp, '#accountBody'), /Probar sin cuenta \(modo prueba\)/);
  await enterDemo(tp, 'profesor');
  assert.match(await text(tp, '#demoBanner'), /Modo prueba · profesor/);
  assert.match(await text(tp, '#demoBanner'), /Caduca el/);
  await tp.waitForSelector('#aulaNewClass', { timeout: 10000 });
  // Licencia de prueba en su escuela: con «demo», activa y 7 días como mucho
  const [schoolPath] = schoolsIn(store);
  const school = store.docs.get(schoolPath);
  assert.equal(school.demo, true);
  assert.deepEqual(Object.keys(school.premium).sort(), ['active', 'demo', 'until']);
  assert.ok(Date.parse(school.premium.until) + DAY <= Date.now() + 7 * DAY, 'licencia de 7 días como mucho');
  assert.equal(store.docs.get(`schoolCodes/${school.code}`).schoolId, schoolPath.split('/')[1]);
  const home = await text(tp, '#proView');
  assert.match(home, /Pruébalo con dos móviles/);
  assert.match(home, /Crea una clase y apunta su código/);
  assert.match(home, /caduca el/);
  assert.match(home, /Aula Pro activa hasta el/);
  assert.equal((await state(tp)).proTester, true, 'todo el contenido abierto');
  // Clase (identificador fijo de la prueba) y tarea
  await tp.type('#aulaClassName', 'Prueba · martes');
  await tp.$eval('#aulaNewClass', f => f.requestSubmit());
  await tp.waitForSelector('#aulaNewTask', { timeout: 10000 });
  assert.ok(store.docs.has(`${schoolPath}/classes/demo-1`), 'la clase de prueba es demo-1');
  const code = (await tp.$eval('#aulaEyebrow', el => el.textContent)).match(/código ([A-Z0-9]{6})/)[1];
  await tp.$eval('#aulaNewTask', b => b.click());
  await tp.waitForSelector('#aulaTaskForm');
  await tp.$eval('[data-src="lesson"]', b => b.click());
  await tp.select('#atLesson', LESSON_ID);
  await tp.select('#atMin', '50');
  await tp.$eval('#aulaTaskForm', f => f.requestSubmit());
  await tp.waitForSelector('.aula-task-row', { timeout: 10000 });
  const taskPath = [...store.docs.keys()].find(k => /\/tasks\//.test(k));
  assert.deepEqual(teacher.errors, []);

  // ---- Móvil 2: alumno de prueba ----
  const student = await openTester(store);
  const sp = student.page;
  await enterDemo(sp, 'alumno');
  assert.match(await text(sp, '#demoBanner'), /Modo prueba · alumno/);
  await sp.waitForSelector('#aulaJoin', { timeout: 10000 });
  const shown = await text(sp, '#proView');
  assert.match(shown, /En otro móvil, entra en el modo prueba como profesor/);
  assert.doesNotMatch(shown, /Solicitar acceso/, 'el alumno de prueba no ve la petición de licencia');
  assert.equal((await state(sp)).proTester, true, 'todo el curso abierto');
  assert.equal(schoolsIn(store).length, 1, 'el alumno no crea escuela');
  await sp.$eval('#aulaJoinCode', (el, c) => { el.value = c; }, code);
  await sp.$eval('#aulaJoinNick', el => { el.value = 'Lucía'; });
  await sp.$eval('#aulaJoin', f => f.requestSubmit());
  await sp.waitForSelector('.aula-task [data-do]', { timeout: 10000 });
  assert.match(await text(sp, '#proView'), /Mis tareas/);
  const studentUid = (await state(sp)).aula.classes[0].uid;
  assert.ok(store.docs.has(`${schoolPath}/classes/demo-1/students/${studentUid}`));
  await sp.$eval('.aula-task [data-do]', b => b.click());
  await finishTheory(sp);
  const summaryPath = taskPath.replace(/tasks\/.*/, `summaries/${studentUid}`);
  const taskId = taskPath.split('/').pop();
  for (let i = 0; i < 40 && !(decodeSummary(store.docs.get(summaryPath))?.tasks?.[taskId]); i++) await sleep(250);
  assert.ok(decodeSummary(store.docs.get(summaryPath)).tasks[taskId].n >= 1, 'el intento llega a la clase');
  assert.deepEqual(student.errors, []);

  // ---- Móvil 1: el profesor ve el % de Lucía ----
  await tap(tp, '#aulaBack');
  await tp.waitForSelector('[data-open-class]', { timeout: 10000 });
  await tp.click('[data-open-class]');
  await tp.waitForSelector('.aula-table [data-student]', { timeout: 10000 });
  assert.match(await text(tp, '.aula-table tbody'), /Lucía/);
  assert.match(await text(tp, '.aula-table .aula-cell-btn'), /\d+ %/);

  // ---- Alumnos de ejemplo (solo en el móvil del profesor) ----
  await tap(tp, '#aulaBack');
  await tp.waitForSelector('#demoSamples', { timeout: 10000 });
  await tp.$eval('#demoSamples', b => b.click());
  await tp.waitForFunction(() => /Quitar los alumnos de ejemplo/.test(document.getElementById('proView').innerText), { timeout: 10000 });
  await tp.waitForSelector('[data-open-class]', { timeout: 10000 });
  await tp.$eval('[data-open-class]', b => b.click());
  await tp.waitForFunction(() => document.querySelectorAll('.aula-table tbody tr').length >= 9, { timeout: 10000 });
  assert.match(await text(tp, '.aula-table tbody'), /Ana \(ejemplo\)/);
  assert.ok(![...store.docs.keys()].some(k => k.includes('ejemplo-')), 'los alumnos de ejemplo no se escriben en la nube');
  assert.deepEqual(teacher.errors, []);

  // ---- El alumno sale: se borra lo suyo y vuelve a la pantalla de acceso ----
  await bannerAction(sp, 'demoExit');
  await sp.waitForSelector('#demoBanner[hidden]', { timeout: 10000 });
  await waitVisible(sp, 'account', 10000);
  assert.ok(!store.docs.has(`${schoolPath}/classes/demo-1/students/${studentUid}`), 'su ficha se ha borrado');
  assert.ok(!store.docs.has(summaryPath), 'su resumen se ha borrado');
  assert.equal(store.docs.get(`${schoolPath}/classes/demo-1`).students, 0);
  const after = await state(sp);
  assert.equal(after.demo, null);
  assert.equal(after.onboarded, false);
  assert.ok(!after.proTester);
  assert.deepEqual(student.errors, []);
  await student.close();

  // ---- El profesor cambia a alumno en el mismo móvil: su escuela de prueba desaparece entera ----
  await bannerAction(tp, 'demoSwitch');
  await tp.waitForFunction(() => /Modo prueba · alumno/.test(document.getElementById('demoBanner').innerText), { timeout: 15000 });
  assert.deepEqual(schoolsIn(store), [], 'escuela de prueba borrada');
  assert.ok(![...store.docs.keys()].some(k => k.startsWith(schoolPath + '/') || k.startsWith('classCodes/') || k.startsWith('schoolCodes/')), 'clases, tareas y códigos borrados');
  await tp.waitForSelector('#aulaJoin', { timeout: 10000 });
  assert.deepEqual(teacher.errors, []);
  await teacher.close();
});

test('en inglés: la entrada al modo prueba y el aviso se ven traducidos', async () => {
  const store = createStore();
  const context = await env.browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(MOBILE);
  await installFakeFirebase(page, store, null);
  await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), { ...SEED, lang: 'en' });
  await page.goto(env.server.url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#acDemo', { visible: true, timeout: 10000 });
  assert.match(await text(page, '#acDemo'), /Try without an account \(trial mode\)/);
  await enterDemo(page, 'alumno');
  assert.match(await text(page, '#demoBanner'), /Trial mode · student/);
  assert.match(await text(page, '#demoBanner'), /Leave trial mode/);
  await page.waitForSelector('.demo-steps', { timeout: 10000 });
  assert.match(await text(page, '.demo-steps'), /Try it with two phones/);
  await context.close();
});
