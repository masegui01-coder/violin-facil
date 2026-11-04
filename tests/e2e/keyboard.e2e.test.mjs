// Teclado y estructura: «Saltar al contenido» es lo primero con foco y lleva al título de la pantalla; el menú de
// pestañas llega antes que el contenido; el afinador tiene h1; y la lección en horizontal tiene botones de 44 px.
// Se ejecuta con `npm run e2e` (después de `npm run build`).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openApp, tap, waitVisible, sleep, DESKTOP } from './helpers.mjs';

const MAX_TABS_TO_NAV = 4; // salto, chip del instrumento y, enseguida, la primera pestaña
const LANDSCAPE = { width: 780, height: 360, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true };
const MIN_TARGET_PX = 44;
let env;

before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

const focusedId = page => page.evaluate(() => {
  const a = document.activeElement;
  return a.id || (a.dataset && a.dataset.tab) || a.className || a.tagName;
});

test('«Saltar al contenido» es el primer foco, se ve al recibirlo y lleva al h1 de la pantalla', async () => {
  const { page, close } = await openApp(env, { viewport: DESKTOP });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('skip-link')), true, 'primer foco');
  await sleep(250); // su pequeña animación de entrada
  const box = await page.$eval('.skip-link', el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
  assert.ok(box.top >= 0 && box.bottom > box.top, `visible con el foco: ${JSON.stringify(box)}`);
  await page.keyboard.press('Enter');
  await sleep(150);
  const info = await page.evaluate(() => ({ tag: document.activeElement.tagName, inLearn: !!document.activeElement.closest('#learn'), hash: location.hash }));
  assert.deepEqual(info, { tag: 'H1', inLearn: true, hash: '' }, 'el foco va al h1 de Aprender sin cambiar la dirección');
  // Sin foco, fuera de la pantalla
  await page.evaluate(() => document.activeElement.blur());
  await sleep(250);
  const hidden = await page.$eval('.skip-link', el => el.getBoundingClientRect().bottom <= 0);
  assert.ok(hidden, 'oculto sin foco');
  await close();
});

test('en el ordenador el menú lateral llega con el teclado antes que el contenido', async () => {
  const { page, errors, close } = await openApp(env, { viewport: DESKTOP });
  const seen = [];
  for (let i = 0; i < MAX_TABS_TO_NAV; i++) {
    await page.keyboard.press('Tab');
    seen.push(await focusedId(page));
  }
  assert.ok(seen.includes('learn'), `la primera pestaña en ${MAX_TABS_TO_NAV} pulsaciones: ${seen.join(' > ')}`);
  assert.deepEqual(errors, []);
  await close();
});

test('el afinador tiene un h1', async () => {
  const { page, errors, close } = await openApp(env, { path: '?go=tuner' });
  await waitVisible(page, 'tuner');
  assert.equal(await page.$eval('#tuner h1', h => h.textContent.trim()), 'Afinador');
  assert.deepEqual(errors, []);
  await close();
});

test('en la lección con el móvil en horizontal (780 × 360) los botones miden al menos 44 px', async () => {
  const { page, close } = await openApp(env, { viewport: LANDSCAPE });
  await tap(page, '#continueBtn');
  for (let i = 0; i < 40 && !(await page.$eval('#lesson', e => !e.hidden)); i++) {
    await sleep(250);
    if (await page.$eval('#result', e => !e.hidden)) { await tap(page, '#resPrimary'); continue; }
    if (await page.$eval('#theory', e => e.hidden)) continue;
    await page.evaluate(() => {
      const opt = document.querySelector('#theoryCard [data-opt]:not([disabled])');
      if (opt) opt.click();
      document.getElementById('theoryNext').click();
    });
  }
  await waitVisible(page, 'lesson');
  const sizes = await page.$$eval('#lessonExit, #playRef, #playDemo, #skipNote, #lmDown, #lmUp', bs => bs.map(b => {
    const r = b.getBoundingClientRect();
    return { id: b.id, w: Math.round(r.width), h: Math.round(r.height) };
  }));
  assert.equal(sizes.length, 6);
  for (const s of sizes) assert.ok(s.w >= MIN_TARGET_PX && s.h >= MIN_TARGET_PX, `${s.id}: ${s.w} × ${s.h}`);
  await close();
});
