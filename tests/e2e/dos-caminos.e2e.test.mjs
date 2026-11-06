// Aprender con dos caminos (docs/PLAN-DOS-CAMINOS.md, fase 1), de extremo a extremo en Chrome real:
// «Por mi cuenta · Libro y profesor», el botón Técnica, Mi libro (Lenguaje, libro del instrumento y Método Pro),
// el alumno y el profesor bajo Libro y profesor (Firebase simulado), la tarjeta de técnica antes de la lección,
// los enlaces antiguos (learnView «lm») y axe a 375 px en claro y oscuro.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launch, openApp, tap, waitVisible, sleep } from './helpers.mjs';
import { createStore, installFakeFirebase } from './fake-firebase.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PHONE = { width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
const STEP = 10000;
const SEED = {
  onboarded: true, instrumentChosen: true, instrument: 'violin', tourDone: true, accountPromptSince: Date.now(),
  analyticsConsent: false, reportSeen: '2099-W01', lang: 'es', nom: 'us', styles: ['clasica'],
};
const TEACHER = { uid: 'teacher-1', displayName: 'Marta', email: 'marta@example.com', isAnonymous: false };
const STUDENT = { uid: 'student-1', displayName: 'Lucía', email: 'lucia@example.com', isAnonymous: false };
const SCHOOL = { name: 'Escuela Prueba', ownerUid: TEACHER.uid, ownerName: 'Marta', code: 'SCHL23', year: '2026-2027', students: 0, premium: { active: true, until: '2099-08-31' } };
const IGNORED = /fonts\.g|net::ERR|Failed to load resource/;

let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('violin-facil-v2')));
const text = (page, sel) => page.$eval(sel, el => el.innerText);
const pressed = (page, sel) => page.$eval(sel, b => b.getAttribute('aria-pressed'));

async function axeViolations(page, rootId = 'learn') {
  if (!(await page.evaluate(() => !!window.axe))) await page.evaluate(AXE);
  const result = await page.evaluate(id => window.axe.run(document.getElementById(id), { resultTypes: ['violations'] }), rootId);
  return result.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}

// Con Firebase simulado (el Aula necesita servidor)
async function openAs(store, user, seed = {}, path = '') {
  const context = await env.browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORED.test(m.text())) errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.setViewport(PHONE);
  await installFakeFirebase(page, store, user);
  await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), { ...SEED, ...seed });
  await page.goto(env.server.url + path, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#sheet[open]', { timeout: 2000 }).catch(() => {});
  await page.evaluate(() => { const d = document.getElementById('sheet'); if (d && d.open) d.close(); });
  return { page, errors, close: () => context.close() };
}

// axe en claro y en oscuro
async function axeBoth(page) {
  const out = [];
  for (const scheme of ['light', 'dark']) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    out.push(...(await axeViolations(page)).map(v => `${scheme}: ${v}`));
  }
  return out;
}
// Doce niveles del curso de violín superados (claves de progreso del curso con estilo «clasica»)
const TWELVE = ['u1-ae-pn0', 'u1-intro', 'u1-ae-pn1', 'u1-ae', 'u1-dg-pn0', 'u1-dg-pn1', 'u1-dg', 'u1-all-pa', 'u1-all-pb', 'u1-all', 'u1-rhythm', 'u1-xr'];
const PROGRESS = Object.fromEntries(TWELVE.map(id => [`lesson:${id}`, 3]));

test('cambiar de camino: Por mi cuenta (por defecto) y Libro y profesor, y se recuerda la elección', async () => {
  const { page, errors, close } = await openApp(env, { viewport: PHONE });
  await waitVisible(page, 'learn');
  assert.equal(await pressed(page, '[data-learn-path="solo"]'), 'true', 'sin clase: Por mi cuenta');
  assert.equal(await page.$$eval('[data-learn-view]', b => b.length), 0, 'ya no hay cuatro modos');
  assert.ok(await page.$('#casualView:not([hidden]) #continueBtn'));
  assert.ok(await page.$('#profeView[hidden]'));
  await tap(page, '[data-learn-path="profe"]');
  await page.waitForSelector('#profeView:not([hidden]) #lmView:not([hidden]) .lm-unit-card', { timeout: STEP });
  assert.ok(await page.$('#casualView[hidden]'));
  assert.equal((await state(page)).learnView, 'profe');
  assert.match(await text(page, '#libro'), /Mi libro/);
  await tap(page, '[data-learn-path="solo"]');
  await page.waitForSelector('#casualView:not([hidden])');
  assert.equal((await state(page)).learnView, 'solo');
  assert.deepEqual(errors, []);
  await close();
});

test('Técnica: un solo botón en Aprender abre los consejos del instrumento', async () => {
  const { page, errors, close } = await openApp(env, { viewport: PHONE });
  await waitVisible(page, 'learn');
  await tap(page, '#learnTech');
  await waitVisible(page, 'tips', STEP);
  await page.waitForSelector('#tip-posture', { timeout: STEP });
  assert.match(await text(page, '#tipsTitle'), /Violín/);
  await tap(page, '#tips [data-back]');
  await waitVisible(page, 'learn');
  await tap(page, '[data-learn-path="profe"]');
  assert.equal(await page.$$eval('#learn [data-tech]', b => b.length), 1, 'un solo botón de Técnica, también en Libro y profesor');
  assert.deepEqual(errors, []);
  await close();
});

test('Mi libro reúne Lenguaje, el libro del instrumento y el Método Pro', async () => {
  const { page, errors, close } = await openApp(env, { viewport: PHONE, seed: { learnView: 'profe' } });
  await waitVisible(page, 'learn');
  await page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: STEP });
  assert.equal(await pressed(page, '[data-libro="lm"]'), 'true');
  await tap(page, '[data-libro="book"]');
  await page.waitForSelector('#bookView:not([hidden]) .book-head', { timeout: STEP });
  assert.ok(await page.$('#lmView[hidden]'));
  assert.match(await text(page, '#bookView'), /Libro 1/);
  await tap(page, '[data-libro="method"]');
  await page.waitForSelector('#methodView:not([hidden]) .pro-level', { timeout: STEP });
  assert.equal((await state(page)).libroView, 'method');
  // Un nivel del Método Pro se abre en su pantalla y se vuelve a Mi libro
  await tap(page, '#methodView .pro-level:not(.locked)');
  await waitVisible(page, 'pro', STEP);
  await tap(page, '#pro [data-back]');
  await page.waitForSelector('#methodView:not([hidden]) .pro-level', { timeout: STEP });
  assert.deepEqual(await axeViolations(page), []);
  assert.deepEqual(errors, []);
  await close();
});

test('enlaces de antes: learnView «lm» (atajo del modo tester, tareas del Aula) abre Libro y profesor › Mi libro › Lenguaje', async () => {
  const { page, errors, close } = await openApp(env, { viewport: PHONE, seed: { learnView: 'lm' } });
  await page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: STEP });
  assert.equal(await pressed(page, '[data-learn-path="profe"]'), 'true');
  assert.equal(await pressed(page, '[data-libro="lm"]'), 'true');
  assert.deepEqual([(await state(page)).learnView, (await state(page)).libroView], ['profe', 'lm'], 'se guarda ya traducido: no vuelve a desplazar en cada arranque');
  assert.deepEqual(errors, []);
  await close();
  const casual = await openApp(env, { viewport: PHONE, seed: { learnView: 'casual' } });
  await waitVisible(casual.page, 'learn');
  assert.equal(await pressed(casual.page, '[data-learn-path="solo"]'), 'true');
  await casual.close();
});

test('alumno: sin clase empieza en Por mi cuenta; en Libro y profesor se une y ve «Mis tareas» encima de Mi libro', async () => {
  const store = createStore({
    'schools/S1': SCHOOL,
    'schools/S1/classes/C1': { name: 'Grupo A', code: 'ABCDEF', teacherName: 'Marta', students: 0, createdAt: { __ts: Date.now() } },
    'classCodes/ABCDEF': { schoolId: 'S1', classId: 'C1', className: 'Grupo A', teacherName: 'Marta' },
    'schools/S1/classes/C1/tasks/T1': { title: 'Conoce tu violín', kind: 'lesson', ref: { id: 'u1-intro', inst: 'violin', label: 'Violín · Conoce tu violín' }, due: '2099-01-01', minPct: 50, maxAttempts: 0, variant: 'any', to: [], note: '', createdAt: Date.now() - 1000 },
  });
  const { page, errors, close } = await openAs(store, STUDENT);
  await waitVisible(page, 'learn');
  assert.equal(await pressed(page, '[data-learn-path="solo"]'), 'true');
  await tap(page, '[data-learn-path="profe"]');
  await page.waitForSelector('#aulaJoin', { timeout: STEP });
  const order = () => page.evaluate(() => (document.getElementById('libro').compareDocumentPosition(document.getElementById('proView')) & Node.DOCUMENT_POSITION_FOLLOWING ? 'libro-primero' : 'aula-primero'));
  assert.equal(await order(), 'libro-primero', 'sin clase, el libro va primero y «Unirme» debajo');
  await page.$eval('#aulaJoinCode', el => { el.value = 'ABCDEF'; });
  await page.$eval('#aulaJoinNick', el => { el.value = 'Lucía'; });
  await page.$eval('#aulaJoin', f => f.requestSubmit());
  await page.waitForSelector('.aula-task [data-do]', { timeout: STEP });
  assert.match(await text(page, '#proView'), /Mis tareas/);
  assert.equal(await order(), 'aula-primero', 'ya en una clase: sus tareas arriba');
  assert.deepEqual(await axeBoth(page), []);
  assert.deepEqual(errors, []);
  await close();
});

test('profesor: por defecto entra en Libro y profesor y ve «Mis clases» arriba, con Mi libro debajo', async () => {
  const store = createStore({ 'schools/S1': SCHOOL });
  const { page, errors, close } = await openAs(store, TEACHER, { learnView: null, school: { schoolId: 'S1', name: SCHOOL.name, code: SCHOOL.code, role: 'teacher', year: '2026-2027' } });
  await waitVisible(page, 'learn');
  await page.waitForSelector('#aulaNewClass', { timeout: STEP });
  assert.equal(await pressed(page, '[data-learn-path="profe"]'), 'true');
  assert.match(await text(page, '#proView'), /Mis clases/);
  assert.ok(await page.evaluate(() => document.getElementById('proView').compareDocumentPosition(document.getElementById('libro')) & Node.DOCUMENT_POSITION_FOLLOWING));
  assert.deepEqual(await axeBoth(page), []);
  assert.equal(await page.$('#aulaLmBook'), null, 'sin atajo duplicado al libro fuera del modo tester');
  // y puede pasarse a Por mi cuenta cuando quiera
  await tap(page, '[data-learn-path="solo"]');
  await page.waitForSelector('#casualView:not([hidden])');
  assert.deepEqual(errors, []);
  await close();
});

test('tarjeta de técnica antes de la lección: se ve, lleva al consejo, se cierra y no vuelve', async () => {
  const { page, errors, close } = await openApp(env, { viewport: PHONE });
  await waitVisible(page, 'learn');
  await page.waitForSelector('#tipMoment .tip-moment', { timeout: STEP });
  assert.match(await text(page, '#tipMoment'), /Técnica en 30 segundos/i);
  assert.match(await text(page, '#tipMoment'), /Cómo sujetar el violín/);
  assert.ok(await page.$('#tipMoment img, #tipMoment svg'), 'con su ilustración');
  // justo debajo de «Continuar», que sigue siendo lo primero
  assert.ok(await page.evaluate(() => document.getElementById('continueBtn').compareDocumentPosition(document.getElementById('tipMoment')) & Node.DOCUMENT_POSITION_FOLLOWING));
  const size = await page.$eval('#tipMomentClose', b => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); });
  assert.ok(size >= 48, `zona táctil de cerrar: ${size}`);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  assert.deepEqual(await axeViolations(page), []);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  assert.deepEqual(await axeViolations(page), []);
  // «Ver cómo se hace» abre ese consejo en la pantalla de Técnica
  await tap(page, '#tipMomentMore');
  await waitVisible(page, 'tips', STEP);
  await page.waitForSelector('#tip-posture', { timeout: STEP });
  await tap(page, '#tips [data-back]');
  await waitVisible(page, 'learn');
  await sleep(300);
  assert.equal(await page.$('#tipMoment .tip-moment'), null, 'visto: no vuelve a salir');
  assert.deepEqual((await state(page)).tipMoments, { violin: ['posture'] });
  assert.deepEqual(errors, []);
  await close();
  // Otro instrumento tiene su propio consejo; ✕ lo cierra y el foco vuelve a «Continuar»
  const flute = await openApp(env, { viewport: PHONE, seed: { instrument: 'flute', tipMoments: { violin: ['posture'] } } });
  await flute.page.waitForSelector('#tipMoment .tip-moment', { timeout: STEP });
  await tap(flute.page, '#tipMomentClose');
  assert.equal(await flute.page.$('#tipMoment .tip-moment'), null);
  assert.equal(await flute.page.evaluate(() => document.activeElement.id), 'continueBtn');
  assert.equal((await state(flute.page)).tipMoments.flute.length, 1);
  assert.deepEqual(flute.errors, []);
  await flute.close();
});

test('puente al libro: tras 10 niveles, «¿Quieres ir más en serio?» lleva a Libro y profesor › Mi libro › Lenguaje', async () => {
  const progress = PROGRESS;
  const fresh = await openApp(env, { viewport: PHONE });
  await waitVisible(fresh.page, 'learn');
  assert.equal(await fresh.page.$('#bridgeCard .bridge'), null, 'al empezar no se ofrece');
  await fresh.close();
  const { page, errors, close } = await openApp(env, { viewport: PHONE, seed: { progress, tipMoments: { violin: ['posture', 'left-hand', 'bow'] } } });
  await page.waitForSelector('#bridgeCard .bridge', { timeout: STEP });
  assert.match(await text(page, '#bridgeCard'), /ir más en serio/);
  await tap(page, '#bridgeGo');
  await page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: STEP });
  assert.equal(await pressed(page, '[data-learn-path="profe"]'), 'true');
  assert.equal(await pressed(page, '[data-libro="lm"]'), 'true', 'leer música = Lenguaje');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'libroTitle');
  // ✕ lo quita para siempre
  await tap(page, '[data-learn-path="solo"]');
  await page.waitForSelector('#bridgeCard .bridge', { timeout: STEP });
  await tap(page, '#bridgeClose');
  assert.equal(await page.$('#bridgeCard .bridge'), null);
  assert.equal((await state(page)).bridgeHidden, true);
  assert.deepEqual(errors, []);
  await close();
});

test('primera pantalla a 375×812: «Continuar» entero por encima de la barra; el texto del camino solo la primera vez', async () => {
  const { page, errors, close } = await openApp(env, { viewport: PHONE });
  await waitVisible(page, 'learn');
  await page.waitForSelector('#tipMoment .tip-moment', { timeout: STEP });
  const fold = await page.evaluate(() => ({ btn: document.getElementById('continueBtn').getBoundingClientRect().bottom, nav: document.getElementById('tabbar').getBoundingClientRect().top }));
  assert.ok(fold.btn < fold.nav - 16, `Continuar acaba en ${fold.btn} y la barra empieza en ${fold.nav}`);
  assert.ok(await page.$('#learnPathHint:not([hidden])'), 'la primera vez se explica el camino');
  await tap(page, '[data-tab="songs"]');
  await tap(page, '[data-tab="learn"]');
  assert.ok(await page.$('#learnPathHint[hidden]'), 'después ya no ocupa sitio');
  assert.deepEqual(errors, []);
  await close();
});

test('Por mi cuenta con progreso: axe limpio en claro y oscuro (lecciones «Leída», estrellas, puente)', async () => {
  const { page, errors, close } = await openApp(env, { viewport: PHONE, seed: { progress: PROGRESS, tipMoments: { violin: ['posture', 'left-hand', 'bow'] } } });
  await page.waitForSelector('#bridgeCard .bridge', { timeout: STEP });
  assert.ok(await page.$('.read-tag'), 'hay lecciones de teoría leídas');
  assert.deepEqual(await axeBoth(page), []);
  assert.deepEqual(errors, []);
  await close();
});

test('invitación ?clase=CÓDIGO: el Aula va arriba y el foco al código, ya escrito, en la primera pantalla', async () => {
  const store = createStore({
    'schools/S1': SCHOOL,
    'schools/S1/classes/C1': { name: 'Grupo A', code: 'K7P2QX', teacherName: 'Marta', students: 0, createdAt: { __ts: Date.now() } },
    'classCodes/K7P2QX': { schoolId: 'S1', classId: 'C1', className: 'Grupo A', teacherName: 'Marta' },
  });
  const { page, errors, close } = await openAs(store, STUDENT, {}, '?clase=K7P2QX');
  await page.waitForSelector('#aulaJoinCode', { timeout: STEP });
  await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'aulaJoinCode', { timeout: STEP });
  const at = await page.evaluate(() => { const r = document.getElementById('aulaJoinCode').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight }; });
  assert.ok(at.top >= 0 && at.bottom <= at.h, `el código se ve sin desplazarse: ${JSON.stringify(at)}`);
  assert.equal(await page.$eval('#aulaJoinCode', el => el.value), 'K7P2QX');
  assert.equal(await page.evaluate(() => (document.getElementById('proView').compareDocumentPosition(document.getElementById('libro')) & Node.DOCUMENT_POSITION_FOLLOWING ? 'aula-primero' : 'libro-primero')), 'aula-primero');
  assert.equal(await pressed(page, '[data-learn-path="profe"]'), 'true');
  assert.deepEqual(errors, []);
  await close();
});
