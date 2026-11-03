// Pruebas de extremo a extremo sobre la versión compilada (npm run build antes): Chrome real con Puppeteer.
// No forman parte de `npm test`: se ejecutan con `npm run e2e`. Chrome instalado (o CHROME_PATH con su ruta).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';
import { startServer } from './server.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const VIEWPORT = { width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const TABS = ['learn', 'songs', 'practice', 'band', 'profile'];
const NOTE_TIMEOUT_MS = 15000;
const SHEET_WAIT_MS = 2000;
const SILENCE_MS = 1500;
// Usuario de prueba sin cuenta, en su semana de gracia (como los scripts de evaluación): entra directo a la app
const SEED = {
  onboarded: true, instrumentChosen: true, instrument: 'violin', tourDone: true, accountPromptSince: Date.now(),
  analyticsConsent: false, reportSeen: '2099-W01', lang: 'es', nom: 'us', styles: ['clasica'],
};

let server;
let browser;

before(async () => {
  server = await startServer();
  browser = await puppeteer.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Micrófono simulado: un oscilador cuya frecuencia fija la prueba (window.__setTone). Guarda las pistas entregadas.
function fakeMic() {
  window.__micStreams = [];
  window.__toneHz = 0;
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const dest = ac.createMediaStreamDestination();
    osc.connect(gain).connect(dest);
    gain.gain.value = 0;
    osc.start();
    window.__setTone = hz => {
      window.__toneHz = hz;
      if (hz) osc.frequency.value = hz;
      gain.gain.value = hz ? 0.4 : 0;
    };
    if (window.__toneHz) window.__setTone(window.__toneHz);
    window.__micStreams.push(dest.stream);
    return dest.stream;
  };
}

async function openApp({ seeded = true, path = '' } = {}) {
  // Contexto aparte en cada prueba: almacenamiento, service worker y cachés limpios
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.setViewport(VIEWPORT);
  await page.evaluateOnNewDocument(fakeMic);
  if (seeded) await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), SEED);
  await page.goto(server.url + path, { waitUntil: 'networkidle0' });
  // El aviso para crear usuario se abre a los 600 ms: se espera y se cierra
  if (seeded) await page.waitForSelector('#sheet[open]', { timeout: SHEET_WAIT_MS }).catch(() => {});
  await page.evaluate(() => { const d = document.getElementById('sheet'); if (d && d.open) d.close(); });
  return { page, errors, close: () => context.close() };
}

// Pulsa como lo haría el dedo y espera a que termine la transición entre pantallas (View Transitions)
async function tap(page, selector) {
  await page.$eval(selector, el => el.click());
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: 5000 });
}

const visible = (page, id) => page.$eval(`#${id}`, el => !el.hidden).catch(() => false);
const waitVisible = (page, id, timeout = 5000) => page.waitForSelector(`#${id}:not([hidden])`, { timeout });

async function axeViolations(page) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: AXE });
  const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
  return result.violations
    .filter(v => v.impact === 'serious' || v.impact === 'critical')
    .map(v => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}

// Nota escrita en notación americana (G3, F♯4, B♭3) → frecuencia con La 440
function frequencyOf(label) {
  const m = /^([A-G])([♯♭]?)(-?\d)/.exec(label.trim());
  if (!m) return null;
  const midi = 12 * (Number(m[3]) + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '♯' ? 1 : m[2] === '♭' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

test('arranca sin errores de consola (pantalla de acceso y app con usuario)', async () => {
  const fresh = await openApp({ seeded: false });
  assert.ok(await visible(fresh.page, 'account') || await visible(fresh.page, 'onboarding'), 'se ve el acceso o la bienvenida');
  assert.deepEqual(fresh.errors, []);
  await fresh.close();
  const app = await openApp();
  assert.ok(await visible(app.page, 'learn'), 'el usuario de prueba entra en Aprender');
  assert.deepEqual(app.errors, []);
  await app.close();
});

test('se recorren las cinco pestañas (Banda se descarga al abrirla)', async () => {
  const { page, errors, close } = await openApp();
  for (const tab of TABS) {
    await tap(page, `[data-tab="${tab}"]`);
    await waitVisible(page, tab);
    assert.equal(await page.$eval(`[data-tab="${tab}"]`, b => b.getAttribute('aria-current')), 'page', tab);
  }
  assert.deepEqual(errors, []);
  await close();
});

test('axe: sin violaciones graves ni críticas en Aprender y Perfil', async () => {
  const { page, close } = await openApp();
  assert.deepEqual(await axeViolations(page), [], 'Aprender');
  await tap(page, '[data-tab="profile"]');
  await waitVisible(page, 'profile');
  await sleep(400);
  assert.deepEqual(await axeViolations(page), [], 'Perfil');
  await close();
});

// Pasa las lecciones de teoría (respondiendo la primera opción) hasta llegar a una lección con micrófono
async function reachLesson(page) {
  await tap(page, '#continueBtn');
  for (let i = 0; i < 40 && !(await visible(page, 'lesson')); i++) {
    await sleep(250);
    if (await visible(page, 'result')) { await tap(page, '#resPrimary'); continue; } // «Siguiente lección»
    if (!(await visible(page, 'theory'))) continue;
    await page.evaluate(() => {
      const opt = document.querySelector('#theoryCard [data-opt]:not([disabled])');
      if (opt) opt.click();
      document.getElementById('theoryNext').click();
    });
  }
  await waitVisible(page, 'lesson');
}

const doneCount = page => page.$eval('#lessonCount', el => Number(el.textContent.split('/')[0]) || 0);

test('una lección con micrófono simulado avanza de nota al tocar la que pide', async () => {
  const { page, errors, close } = await openApp();
  await reachLesson(page);
  if (await visible(page, 'micGate')) await tap(page, '#startMic');
  await page.waitForFunction(() => document.getElementById('micGate').hidden, { timeout: 5000 });
  const before = await doneCount(page);
  await sleep(SILENCE_MS); // en silencio no avanza
  assert.equal(await doneCount(page), before);
  const label = await page.$eval('#tName', el => el.textContent);
  const hz = frequencyOf(label);
  assert.ok(hz, `nota legible en pantalla: «${label}»`);
  await page.evaluate(f => window.__setTone(f), hz);
  await page.waitForFunction(n => Number(document.getElementById('lessonCount').textContent.split('/')[0]) > n, { timeout: NOTE_TIMEOUT_MS }, before);
  await page.evaluate(() => window.__setTone(0));
  assert.ok(await doneCount(page) > before);
  assert.deepEqual(errors, []);
  await close();
});

test('al salir del afinador la pista del micrófono queda «ended»', async () => {
  const { page, errors, close } = await openApp();
  await tap(page, '[data-tab="practice"]');
  await waitVisible(page, 'practice');
  await tap(page, '[data-go="tuner"]');
  await waitVisible(page, 'tuner');
  if (await visible(page, 'tunerGate')) await tap(page, '#tunerStart');
  await page.waitForFunction(() => window.__micStreams.length > 0, { timeout: 5000 });
  assert.deepEqual(await page.evaluate(() => window.__micStreams.at(-1).getAudioTracks().map(t => t.readyState)), ['live']);
  await tap(page, '#tuner [data-back]');
  await page.waitForFunction(() => document.getElementById('tuner').hidden, { timeout: 5000 });
  const states = await page.evaluate(() => window.__micStreams.flatMap(s => s.getAudioTracks().map(t => t.readyState)));
  assert.ok(states.length > 0 && states.every(s => s === 'ended'), `pistas: ${states}`);
  assert.deepEqual(errors, []);
  await close();
});

test('el acceso directo ?go=tuner abre el afinador', async () => {
  const { page, errors, close } = await openApp({ path: '?go=tuner' });
  assert.ok(await visible(page, 'tuner'));
  assert.deepEqual(errors, []);
  await close();
});

test('sin conexión la app vuelve a abrir desde la precarga del service worker', async () => {
  const { page, errors, close } = await openApp();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 10000 }).catch(() => page.reload({ waitUntil: 'networkidle0' }));
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitVisible(page, 'learn', 10000);
  await tap(page, '[data-tab="band"]');
  await waitVisible(page, 'band', 10000);
  await page.setOfflineMode(false);
  // Sin red, Firebase (gstatic) no carga: solo se aceptan esos fallos de red
  assert.deepEqual(errors.filter(e => !/gstatic|Failed to fetch|ERR_INTERNET_DISCONNECTED|net::/i.test(e)), []);
  await close();
});

test('cuando se publica otra versión avisa «Hay una versión nueva» y al actualizar se recarga con ella', async () => {
  const { page, errors, close } = await openApp();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 10000 });
  const first = await page.evaluate(() => navigator.serviceWorker.controller.scriptURL);
  server.publishNewServiceWorker(`prueba ${Date.now()}`);
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  await waitVisible(page, 'updateToast', 10000);
  await Promise.all([page.waitForNavigation({ timeout: 10000 }), tap(page, '#updateNow')]);
  await waitVisible(page, 'learn', 10000);
  assert.ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'la página nueva la controla el service worker nuevo');
  assert.equal(await visible(page, 'updateToast'), false);
  assert.ok(first);
  server.publishNewServiceWorker('');
  assert.deepEqual(errors, []);
  await close();
});

test('quien venía del service worker antiguo (band-flow-v3) pasa al nuevo sin aviso ni recarga', async () => {
  const { page, errors, close } = await openApp();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 10000 });
  await page.evaluate(() => caches.open('band-flow-v3'));
  await page.evaluate(() => { window.__samePage = true; });
  server.publishNewServiceWorker(`relevo ${Date.now()}`);
  await page.evaluate(() => new Promise(resolve => {
    navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
    navigator.serviceWorker.getRegistration().then(r => r.update());
  }));
  await page.waitForFunction(() => navigator.serviceWorker.controller.state === 'activated', { timeout: 5000 });
  await sleep(SILENCE_MS);
  assert.equal(await page.evaluate(() => window.__samePage), true, 'no se recarga');
  assert.equal(await visible(page, 'updateToast'), false);
  assert.equal(await page.evaluate(() => caches.has('band-flow-v3')), false, 'la caché antigua se borra');
  server.publishNewServiceWorker('');
  assert.deepEqual(errors, []);
  await close();
});
