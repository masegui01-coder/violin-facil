// Ajustes en su propia pantalla (desde Perfil) y Escape para salir de la lección en el ordenador.
// Se ejecuta con `npm run e2e` sobre la versión compilada.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openApp, tap, visible, waitVisible, waitHidden, sleep, DESKTOP } from './helpers.mjs';

let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

test('Perfil tiene la entrada «Ajustes» y la pantalla Ajustes guarda idioma, apariencia y privacidad', async () => {
  const { page, errors, close } = await openApp(env);
  await tap(page, '[data-tab="profile"]');
  await waitVisible(page, 'profile');
  // Los ajustes ya no están dentro de Perfil
  for (const id of ['setLangLabel', 'setAppearanceLabel', 'setKid', 'accountPanel']) {
    assert.equal(await page.$eval(`#${id}`, el => !!el.closest('#profile')), false, `${id} fuera de Perfil`);
  }
  await tap(page, '#openSettings');
  await waitVisible(page, 'settings');
  assert.equal(await visible(page, 'tabbar'), false, 'Ajustes es una pantalla de detalle');
  assert.equal(await page.$eval('#settings h1', h => h.textContent.trim()), 'Ajustes');
  assert.equal(await page.$eval('[data-set-lang="es"]', b => b.getAttribute('aria-pressed')), 'true');
  await page.waitForFunction(() => document.getElementById('accountPanel').textContent.includes('Tu cuenta'), { timeout: 5000 });
  // Apariencia oscura: se aplica al momento y se guarda
  await page.$eval('[data-set-appearance="dark"]', b => b.click());
  assert.equal(await page.$eval('[data-set-appearance="dark"]', b => b.getAttribute('aria-pressed')), 'true');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('violin-facil-v2')).appearance), 'dark');
  // Modo niño desactiva aparecer en las clasificaciones
  await page.$eval('#setKid', el => el.click());
  assert.equal(await page.$eval('#setPublic', el => el.disabled), true);
  // Volver deja en Perfil
  await tap(page, '#settings [data-back]');
  await waitVisible(page, 'profile');
  assert.equal(await page.$eval('[data-tab="profile"]', b => b.getAttribute('aria-current')), 'page');
  assert.deepEqual(errors, []);
  await close();
});

test('Perfil es mucho más corto al sacar los ajustes (móvil de 360 px)', async () => {
  const { page, close } = await openApp(env);
  await tap(page, '[data-tab="profile"]');
  await waitVisible(page, 'profile');
  await sleep(300);
  const height = await page.$eval('#profile', el => el.getBoundingClientRect().height);
  assert.ok(height < 4500, `Perfil mide ${Math.round(height)} px`);
  await close();
});

test('en inglés la pantalla Ajustes no deja textos de la interfaz en español', async () => {
  const { page, errors, close } = await openApp(env, { seed: { lang: 'en' } });
  await tap(page, '[data-tab="profile"]');
  await tap(page, '#openSettings');
  await waitVisible(page, 'settings');
  await sleep(400);
  const text = await page.$eval('#settings', el => el.innerText);
  assert.doesNotMatch(text, /(?<!\p{L})(Ajustes|Idioma|Apariencia|Privacidad|Tu cuenta)(?!\p{L})/u);
  assert.match(text, /Settings/);
  assert.deepEqual(errors, []);
  await close();
});

test('Escape en el ordenador cierra la lección abierta (como el ✕), pero no mientras se escribe ni con una ventana abierta', async () => {
  const { page, errors, close } = await openApp(env, { viewport: DESKTOP });
  await tap(page, '#continueBtn');
  await waitVisible(page, 'lesson');
  // Con una ventana abierta, Escape solo la cierra a ella
  await page.evaluate(() => document.getElementById('fbDialog').showModal());
  await page.keyboard.press('Escape');
  await sleep(300);
  assert.equal(await page.$eval('#fbDialog', d => d.open), false);
  assert.ok(await visible(page, 'lesson'), 'la lección sigue abierta');
  // Escribiendo en un campo no sale
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'escProbe';
    document.getElementById('lesson').append(input);
    input.focus();
  });
  await page.keyboard.press('Escape');
  await sleep(300);
  assert.ok(await visible(page, 'lesson'), 'sigue en la lección al pulsar Escape en un campo');
  await page.evaluate(() => { document.getElementById('escProbe').remove(); document.body.focus(); });
  // Escape sale de la lección y vuelve a Aprender
  await page.keyboard.press('Escape');
  await waitHidden(page, 'lesson');
  await waitVisible(page, 'learn');
  assert.deepEqual(errors, []);
  await close();
});

test('Escape en Ajustes vuelve a Perfil', async () => {
  const { page, close } = await openApp(env, { viewport: DESKTOP });
  await tap(page, '[data-tab="profile"]');
  await tap(page, '#openSettings');
  await waitVisible(page, 'settings');
  await page.keyboard.press('Escape');
  await waitVisible(page, 'profile');
  await close();
});

// La confirmación de borrar la cuenta (sin cuenta real: se abre desde los módulos sin compilar de index.src.html)
test('borrar la cuenta pide confirmación en un <dialog> modal accesible: foco en Cancelar, Escape cancela', async () => {
  const { page, errors, close } = await openApp(env, { path: 'index.src.html' });
  const open = () => page.evaluate(() => {
    window.__del = 'pending';
    return import('./js/screens/account-panel.js').then(m => { m.confirmDeletion().then(ok => { window.__del = ok; }); });
  });
  await open();
  const info = await page.$eval('#delConfirm', d => ({
    open: d.open, modal: d.matches(':modal'), focus: document.activeElement.id,
    title: document.getElementById(d.getAttribute('aria-labelledby')).textContent,
    text: document.getElementById(d.getAttribute('aria-describedby')).textContent,
    buttons: [...d.querySelectorAll('button')].map(b => b.textContent),
    red: getComputedStyle(document.getElementById('delConfirmOk')).backgroundColor,
  }));
  assert.equal(info.open, true);
  assert.equal(info.modal, true, 'abierto con showModal');
  assert.equal(info.focus, 'delConfirmCancel', 'el foco empieza en Cancelar');
  assert.equal(info.title, '¿Borrar tu cuenta?');
  assert.match(info.text, /No se puede deshacer/);
  assert.deepEqual(info.buttons, ['Cancelar', 'Borrar mi cuenta']);
  assert.equal(info.red, await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--bad)';
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }), 'el botón de borrar va en el color de error');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__del !== 'pending', { timeout: 3000 });
  assert.equal(await page.evaluate(() => window.__del), false, 'Escape no confirma');
  assert.equal(await page.$eval('#delConfirm', d => d.open), false);
  await open();
  await page.$eval('#delConfirmCancel', b => b.click());
  await page.waitForFunction(() => window.__del !== 'pending', { timeout: 3000 });
  assert.equal(await page.evaluate(() => window.__del), false, 'Cancelar no confirma');
  await open();
  await page.$eval('#delConfirmOk', b => b.click());
  await page.waitForFunction(() => window.__del !== 'pending', { timeout: 3000 });
  assert.equal(await page.evaluate(() => window.__del), true, '«Borrar mi cuenta» confirma');
  assert.deepEqual(errors, []);
  await close();
});
