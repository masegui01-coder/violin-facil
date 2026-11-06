// Modo tester de extremo a extremo (versión compilada, Chrome real, Firebase simulado): un usuario que YA tiene cuenta,
// sin clase ni escuela ni licencia, mira el Aula como profesor (clase de ejemplo con todas sus pantallas) y como alumno
// (tareas de ejemplo que abren el ejercicio de verdad), abre el libro de Lenguaje en un toque y sale sin dejar rastro.
// Nada de la clase de ejemplo llega a la «nube».
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, MOBILE, sleep, tap, waitVisible } from './helpers.mjs';
import { createStore, installFakeFirebase } from './fake-firebase.mjs';

const USER = { uid: 'tester-1', displayName: 'Manu', email: 'manu@example.com', isAnonymous: false };
const SEED = {
  onboarded: true, instrumentChosen: true, instrument: 'violin', tourDone: true, accountPromptSince: Date.now(),
  analyticsConsent: false, reportSeen: '2099-W01', lang: 'es', nom: 'us', styles: ['clasica'], learnView: 'pro', aulaView: 'aula',
};
const IGNORED = /fonts\.g|net::ERR|Failed to load resource/;
const SANDBOX = 'violin-facil-sandbox';
const CLS = 'schools/ejemplo-tester/classes/clase-ejemplo';

let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

const text = (page, sel) => page.$eval(sel, el => el.innerText);
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('violin-facil-v2')));
const sandbox = page => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), SANDBOX);
const cloudAula = store => [...store.docs.keys()].filter(k => /^(schools|classCodes|schoolCodes)\//.test(k));

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

test('con cuenta y sin clase: ver como profesor y como alumno, el libro en un toque y salir sin tocar datos reales', async () => {
  const store = createStore();
  const context = await env.browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORED.test(m.text())) errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.setViewport(MOBILE);
  await installFakeFirebase(page, store, USER);
  await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), SEED);
  await page.goto(env.server.url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#sheet[open]', { timeout: 2000 }).catch(() => {});
  await page.evaluate(() => { const d = document.getElementById('sheet'); if (d && d.open) d.close(); });

  // ---- Inicio del Aula: «Modo tester: Ver como alumno · Ver como profesor» y el atajo al libro ----
  await page.waitForSelector('.tester-control [data-tester-role="profesor"]', { timeout: 10000 });
  assert.match(await text(page, '.tester-control'), /Modo tester:\s*Ver como alumno\s*Ver como profesor/);
  assert.ok(await page.$('#aulaLmBook'), 'atajo al libro en el inicio del Aula');

  // ---- Ver como profesor: la clase de ejemplo, al momento ----
  await page.$eval('[data-tester-role="profesor"]', b => b.click());
  await waitVisible(page, 'aula', 10000);
  await page.waitForFunction(() => document.querySelectorAll('.aula-table tbody tr').length >= 8, { timeout: 10000 });
  assert.match(await text(page, '#testerBanner'), /Modo tester · profesor/);
  assert.match(await text(page, '.aula-table tbody'), /Ana \(ejemplo\)/);
  assert.match(await text(page, '#aulaBody'), /Entregas vencidas/);
  // Filtros
  await page.$eval('[data-filter="overdue"]', b => b.click());
  await page.waitForSelector('[data-filter="overdue"][aria-pressed="true"]', { timeout: 5000 });
  await page.$eval('[data-filter="all"]', b => b.click());
  // Ficha de un alumno (competencias, historial) y vuelta a la clase
  await page.waitForSelector('.aula-table [data-student]');
  await page.$eval('.aula-table [data-student]', b => b.click());
  await page.waitForSelector('.aula-history li', { timeout: 10000 });
  assert.match(await text(page, '#aulaBody'), /Competencias/);
  await page.$eval('#aulaBack', b => b.click());
  await page.waitForSelector('.aula-table', { timeout: 5000 });
  // Nueva tarea con el temario entero (se queda en el móvil)
  const before = (await page.$$('.aula-task-row')).length;
  await page.$eval('#aulaNewTask', b => b.click());
  await page.waitForSelector('#aulaTaskForm');
  await page.$eval('[data-src="lesson"]', b => b.click());
  await page.select('#atLesson', 'u1-intro');
  await page.$eval('#aulaTaskForm', f => f.requestSubmit());
  await page.waitForFunction(n => document.querySelectorAll('.aula-task-row').length > n, { timeout: 10000 }, before);
  // Comentario a una entrega
  await page.$eval('.aula-table .aula-cell-btn', b => b.click());
  await page.waitForSelector('#aulaComment');
  await page.type('#aulaComment', 'Comentario de prueba');
  await page.$eval('#aulaSaveComment', b => b.click());
  for (let i = 0; i < 20 && !Object.values(await sandbox(page) || {}).some(d => d.comment === 'Comentario de prueba'); i++) await sleep(150);
  assert.ok(Object.values(await sandbox(page)).some(d => d.comment === 'Comentario de prueba'), 'el comentario se guarda en el móvil');
  assert.equal(Object.keys(await sandbox(page)).filter(k => k.startsWith(`${CLS}/tasks/`)).length, 5);
  assert.deepEqual(cloudAula(store), [], 'nada de la clase de ejemplo en la nube');

  // ---- El libro en un toque (desde el aviso de arriba) ----
  await page.$eval('#testerBook', b => b.click());
  await waitVisible(page, 'learn', 10000);
  await page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: 10000 });
  assert.equal((await state(page)).learnView, 'lm');

  // ---- Ver como alumno: «Mis tareas» de la profesora de ejemplo ----
  await page.$eval('#testerSwitch', b => b.click());
  await page.waitForSelector('.aula-task [data-do]', { timeout: 10000 });
  assert.match(await text(page, '#testerBanner'), /Modo tester · alumno/);
  await page.evaluate(() => document.querySelectorAll('details.aula-done').forEach(d => { d.open = true; }));
  const mine = await text(page, '#proView');
  assert.match(mine, /Mis tareas/);
  assert.match(mine, /Clase de Marta \(ejemplo\)/i);
  assert.match(mine, /Unidad 1 · El latido/);
  assert.match(mine, /Te falta terminar la unidad/, 'comentario de la profesora');
  assert.match(mine, /1 vencida/);
  assert.match(mine, /Unirme a una clase de verdad con código/);
  assert.ok(await page.$('#aulaLmBook'), 'atajo al libro también como alumno');
  // La tarea abre el ejercicio de verdad y el resultado llega a la tarea de ejemplo
  await page.$eval('[data-do="ejemplo-t4"]', b => b.click());
  await finishTheory(page);
  const summaryKey = `${CLS}/summaries/${USER.uid}`;
  for (let i = 0; i < 40 && !/ejemplo-t4=100,2,/.test(((await sandbox(page)) || {})[summaryKey]?.tasks || ''); i++) await sleep(250);
  assert.match((await sandbox(page))[summaryKey].tasks, /ejemplo-t4=100,2,1,/, 'el segundo intento cuenta en la tarea de ejemplo');
  assert.deepEqual(cloudAula(store), [], 'el resumen tampoco sale del móvil');

  // ---- Salir: vuelve el Aula de siempre y no queda nada de la clase de ejemplo ----
  await page.$eval('#testerExit', b => b.click());
  await page.waitForSelector('#testerBanner[hidden]', { timeout: 5000 });
  const after = await state(page);
  assert.equal(after.tester, null);
  assert.equal(after.learnView, 'pro');
  assert.equal(after.aulaView, 'aula');
  assert.deepEqual(Object.keys(after.aula.prog || {}).filter(k => k.startsWith('clase-ejemplo/')), []);
  assert.deepEqual(Object.keys(after.aula.tasks || {}).filter(k => k.startsWith('ejemplo-tester/')), []);
  assert.deepEqual(after.aula.classes || [], []);
  assert.equal(await sandbox(page), null);
  const users = store.docs.get(`users/${USER.uid}`);
  if (users) assert.ok(!('tester' in users.state), 'el modo tester no se sube con el progreso');

  // ---- También en Ajustes › Tu cuenta ----
  await tap(page, '[data-tab="profile"]');
  await tap(page, '#openSettings');
  await page.waitForFunction(() => document.getElementById('accountPanel').innerText.includes('Modo tester:'), { timeout: 5000 });
  assert.ok(await page.$('#accountPanel [data-tester-role="alumno"]'));
  assert.deepEqual(errors, []);
  await context.close();
});
