// Utilidades comunes de las pruebas de extremo a extremo nuevas (Chrome real con Puppeteer sobre la versión compilada).
// Mismo arranque que app.e2e.test.mjs: usuario de prueba sin cuenta, en su semana de gracia, que entra directo a la app.
import puppeteer from 'puppeteer-core';
import { startServer } from './server.mjs';

export const MOBILE = { width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
export const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
export const TABS = ['learn', 'songs', 'practice', 'band', 'profile'];
const SHEET_WAIT_MS = 2000;
const SEED = {
  onboarded: true, instrumentChosen: true, instrument: 'violin', tourDone: true, accountPromptSince: Date.now(),
  analyticsConsent: false, reportSeen: '2099-W01', lang: 'es', nom: 'us', styles: ['clasica'],
};

export const sleep = ms => new Promise(r => setTimeout(r, ms));

// Servidor y Chrome para todo el archivo de pruebas
export async function launch() {
  const server = await startServer();
  const browser = await puppeteer.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  });
  return { server, browser, close: async () => { await browser.close(); await server.close(); } };
}

// Contexto aparte en cada prueba: almacenamiento, service worker y cachés limpios
// init: función que se ejecuta en la página antes que la app (p. ej. un micrófono simulado)
export async function openApp(env, { viewport = MOBILE, seed = {}, path = '', init = null } = {}) {
  const context = await env.browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.setViewport(viewport);
  if (init) await page.evaluateOnNewDocument(init);
  await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), { ...SEED, ...seed });
  await page.goto(env.server.url + path, { waitUntil: 'networkidle0' });
  // El aviso para crear usuario se abre a los 600 ms: se espera y se cierra
  await page.waitForSelector('#sheet[open]', { timeout: SHEET_WAIT_MS }).catch(() => {});
  await page.evaluate(() => { const d = document.getElementById('sheet'); if (d && d.open) d.close(); });
  return { page, errors, close: () => context.close() };
}

// Pulsa y espera a que termine la transición entre pantallas (View Transitions)
export async function tap(page, selector) {
  await page.$eval(selector, el => el.click());
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: 5000 });
}

export const visible = (page, id) => page.$eval(`#${id}`, el => !el.hidden).catch(() => false);
export const waitVisible = (page, id, timeout = 5000) => page.waitForSelector(`#${id}:not([hidden])`, { timeout });
export const waitHidden = (page, id, timeout = 5000) => page.waitForFunction(i => document.getElementById(i).hidden, { timeout }, id);
