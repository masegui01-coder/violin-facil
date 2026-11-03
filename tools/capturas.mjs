// Capturas del manifiesto (img/screenshots/, 1080×1920): Aprender y una lección escuchando.
// Uso: npm run build && node tools/capturas.mjs   (Chrome instalado o CHROME_PATH)
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from '../tests/e2e/server.mjs';

const OUT = fileURLToPath(new URL('../img/screenshots/', import.meta.url));
const VIEWPORT = { width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const SEED = {
  onboarded: true, instrumentChosen: true, instrument: 'violin', tourDone: true, accountPromptSince: Date.now(),
  analyticsConsent: false, reportSeen: '2099-W01', lang: 'es', styles: ['clasica'], xp: 120,
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });
const server = await startServer();
const browser = await puppeteer.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
try {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), SEED);
  await page.goto(server.url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#sheet[open]', { timeout: 2000 }).catch(() => {});
  await page.evaluate(() => document.getElementById('sheet').close());
  await page.screenshot({ path: OUT + 'aprender.png' });
  // La primera lección con notas (tras la de teoría)
  await page.$eval('#continueBtn', b => b.click());
  for (let i = 0; i < 40 && await page.$eval('#lesson', el => el.hidden); i++) {
    await sleep(250);
    await page.evaluate(() => {
      if (!document.getElementById('result').hidden) document.getElementById('resPrimary').click();
      else if (!document.getElementById('theory').hidden) {
        document.querySelector('#theoryCard [data-opt]:not([disabled])')?.click(); // las preguntas, con la primera opción
        document.getElementById('theoryNext').click();
      }
    });
  }
  await page.evaluate(() => document.getElementById('startMic').click());
  await sleep(1500);
  await page.screenshot({ path: OUT + 'leccion.png' });
  console.log('Capturas en img/screenshots/');
} finally {
  await browser.close();
  await server.close();
}
