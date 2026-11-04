// Prueba estricta del modo inglés sobre la versión compilada (npm run build antes): Chrome real con Puppeteer.
// Pone la app en inglés, recorre las pantallas principales (Aprender, lección, afinador, metrónomo, Canciones,
// Perfil, Ajustes y Banda) y comprueba que en el texto visible
// (document.body.innerText) no queda ni una palabra en español: ni tildes ni eñes ni palabras frecuentes.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { startServer } from './server.mjs';

const VIEWPORT = { width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const SHEET_WAIT_MS = 2000;
const SETTLE_MS = 600;
// Usuario de prueba sin cuenta y en inglés, con nombres de nota en letras (C D E…)
const SEED = {
  onboarded: true, instrumentChosen: true, instrument: 'violin', tourDone: true, accountPromptSince: Date.now(),
  analyticsConsent: false, reportSeen: '2099-W01', lang: 'en', nom: 'us', styles: ['clasica'],
  xp: 250, cards: [0, 5], // con puntos y cromos, Perfil enseña su nivel y la colección
};

// Lo que delata un texto en español: tildes, eñes, signos de apertura y palabras muy frecuentes de la interfaz
const SPANISH_CHARS = '[ñÑáéíóúÁÉÍÓÚ¿¡«»]';
const SPANISH_WORDS = [
  'de', 'del', 'la', 'las', 'el', 'los', 'y', 'con', 'para', 'por', 'una', 'tu', 'tus', 'mis', 'sin', 'hoy', 'más',
  'puntos', 'tiempo', 'tiempos', 'cuerda', 'cuerdas', 'dedo', 'nivel', 'canciones', 'canción', 'lección', 'aprender',
  'perfil', 'banda', 'racha', 'días', 'semana', 'notas', 'afinador', 'metrónomo', 'compás', 'negra', 'blanca',
  'redonda', 'corchea', 'aire', 'educando', 'cromos', 'cromo', 'ajustes', 'tocar', 'toca', 'escuchar', 'empezar',
  'ensaya', 'ensayo', 'logros', 'afinado', 'afinada', 'micrófono', 'activar', 'pulsa', 'elige',
];
// Nombres propios y textos que deben quedarse como están (marca, selector de idioma)
// (y nombres de compositores, estilos e instrumentos que en inglés se escriben igual)
const ALLOWED = ['Band Flow', 'Español', 'Dvořák', 'Händel', 'Cajón', 'bulerías'];
const SPANISH_RE = new RegExp(`${SPANISH_CHARS}|(?<!\\p{L})(?:${SPANISH_WORDS.join('|')})(?!\\p{L})`, 'iu');

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

// Micrófono simulado en silencio: el afinador y la lección arrancan sin pedir permiso de verdad
function fakeMic() {
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AudioContext();
    const dest = ac.createMediaStreamDestination();
    return dest.stream;
  };
}

async function openApp({ keepSheet = false, seed = {} } = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await page.setViewport(VIEWPORT);
  await page.evaluateOnNewDocument(fakeMic);
  await page.evaluateOnNewDocument(s => localStorage.setItem('violin-facil-v2', JSON.stringify(s)), { ...SEED, ...seed });
  await page.goto(server.url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#sheet[open]', { timeout: SHEET_WAIT_MS }).catch(() => {});
  if (!keepSheet) await page.evaluate(() => { const d = document.getElementById('sheet'); if (d && d.open) d.close(); });
  // El diccionario grande (cursos y libros) se descarga aparte: se espera a que llegue
  await page.waitForNetworkIdle({ idleTime: 300, timeout: 5000 }).catch(() => {});
  return { page, errors, close: () => context.close() };
}

async function tap(page, selector) {
  await page.$eval(selector, el => el.click());
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: 5000 });
}

const visible = (page, id) => page.$eval(`#${id}`, el => !el.hidden).catch(() => false);
const waitVisible = (page, id, timeout = 5000) => page.waitForSelector(`#${id}:not([hidden])`, { timeout });

// Líneas del texto visible de la página que siguen en español
async function spanishLines(page) {
  await sleep(SETTLE_MS);
  return page.evaluate((src, allowed) => {
    const re = new RegExp(src, 'iu');
    document.querySelectorAll('details').forEach(d => { d.open = true; });
    // innerText no recoge el texto de los SVG (ejes del radar, rótulos) ni las etiquetas de accesibilidad
    const shown = el => el.getClientRects().length > 0;
    const svgText = [...document.querySelectorAll('svg text')].filter(shown).map(el => el.textContent);
    const labels = [...document.querySelectorAll('[aria-label], [placeholder], [title]')].filter(shown)
      .flatMap(el => ['aria-label', 'placeholder', 'title'].map(a => el.getAttribute(a)).filter(Boolean));
    return [...document.body.innerText.split('\n'), ...svgText, ...labels]
      .map(line => line.trim())
      .filter(line => re.test(allowed.reduce((text, ok) => text.split(ok).join(' '), line)));
  }, SPANISH_RE.source, ALLOWED);
}

async function openTab(page, tab) {
  await tap(page, `[data-tab="${tab}"]`);
  await waitVisible(page, tab);
}

async function openTool(page, tool) {
  await openTab(page, 'practice');
  await tap(page, `[data-go="${tool}"]`);
  await waitVisible(page, tool);
}

test('la lista de palabras detecta el español y deja pasar el inglés', () => {
  ['Negra · 1 tiempo', 'Cuerda A · al aire', 'Mis cromos', '120 puntos', 'Educando', 'Original de Band Flow'].forEach(es => assert.match(es, SPANISH_RE, es));
  ['Quarter note · 1 beat', 'Open A string', 'My stickers', '120 points', 'Band Flow original', 'A4 · 440 Hz'].forEach(en => assert.doesNotMatch(en, SPANISH_RE, en));
});

// Recorre las pantallas y junta lo que queda en español en cada una: así el fallo enseña todo de una vez
async function collect(page, steps) {
  const found = {};
  for (const [name, go] of steps) {
    await go();
    const lines = await spanishLines(page);
    if (lines.length) found[name] = lines;
  }
  return found;
}

test('en inglés: Aprender, Canciones, Perfil, Ajustes y Banda sin español visible', async () => {
  const { page, errors, close } = await openApp();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  const found = await collect(page, [
    ...['learn', 'songs', 'profile'].map(tab => [tab, () => openTab(page, tab)]),
    ['perfil: mis cromos', () => tap(page, '#openCards')],
    ['settings', async () => {
      await page.evaluate(() => document.getElementById('sheet').close());
      await tap(page, '#openSettings');
      await waitVisible(page, 'settings');
    }],
    ['band', () => openTab(page, 'band')],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});

test('en inglés: la lección abierta (figuras, cuerdas, dedos) sin español visible', async () => {
  const { page, errors, close } = await openApp();
  const found = await collect(page, [
    ['lección (aviso del micrófono)', async () => { await tap(page, '#continueBtn'); await waitVisible(page, 'lesson'); }],
    ['lección (reproductor)', async () => {
      if (await visible(page, 'micGate')) await tap(page, '#startMic');
      await page.waitForFunction(() => document.getElementById('micGate').hidden, { timeout: 5000 });
    }],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});

test('en inglés: el afinador y el metrónomo sin español visible', async () => {
  const { page, errors, close } = await openApp();
  const found = await collect(page, [
    ['afinador', () => openTool(page, 'tuner')],
    ['afinador escuchando', async () => { if (await visible(page, 'tunerGate')) await tap(page, '#tunerStart'); }],
    ['metrónomo', async () => {
      await tap(page, '#tuner [data-back]');
      await page.waitForFunction(() => document.getElementById('tuner').hidden, { timeout: 5000 });
      await openTool(page, 'metro');
    }],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});

// ---------- Hojas, diálogos y herramientas fuera de las pestañas principales ----------
const closeSheet = page => page.evaluate(() => { const d = document.getElementById('sheet'); if (d.open) d.close(); });
const waitSheet = page => page.waitForSelector('#sheet[open]', { timeout: 5000 });

// Pulsa algo que abre la hoja (#sheet) y espera a que esté abierta
async function openSheet(page, selector) {
  await closeSheet(page);
  await page.$eval(selector, el => el.click());
  await waitSheet(page);
}

async function back(page, id) {
  await tap(page, `#${id} [data-back]`);
  await page.waitForFunction(i => document.getElementById(i).hidden, { timeout: 5000 }, id);
}

test('en inglés: Canciones (hoja de la canción, ayuda para importar y Mis partituras vacía) sin español visible', async () => {
  const { page, errors, close } = await openApp();
  const found = await collect(page, [
    ['hoja de la canción', async () => { await openTab(page, 'songs'); await openSheet(page, '#songList [data-song]'); }],
    ['ayuda para importar', () => openSheet(page, '#importHelp')],
    ['mis partituras (vacía)', async () => {
      await closeSheet(page);
      await tap(page, '[data-filter="mias"]');
      await page.waitForSelector('#songList .empty', { timeout: 5000 });
    }],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});

test('en inglés: Estudio (para qué sirve cada una, afinar en acorde, gimnasio, toca libre, primera vista) sin español visible', async () => {
  const { page, errors, close } = await openApp();
  const found = await collect(page, [
    ['para qué sirve cada una', async () => { await openTab(page, 'practice'); await openSheet(page, '#studyHelp'); }],
    ['lectura a primera vista', () => openSheet(page, '#toolSight')],
    ['afinar en acorde', async () => { await closeSheet(page); await openTool(page, 'chord'); }],
    // cada grado del acorde con su objetivo en cents
    ...['root', 'm3', 'P5', 'M6', 'oct'].map(id => [`afinar en acorde: ${id}`, () => tap(page, `#chIntervals [data-int="${id}"]`)]),
    ['gimnasio', async () => { await back(page, 'chord'); await openTool(page, 'gym'); }],
    ['toca libre', async () => { await back(page, 'gym'); await openTool(page, 'free'); }],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});

test('en inglés: Aprender (hoja de teoría, cambiar de instrumento, test de nivel y rutina) sin español visible', async () => {
  const { page, errors, close } = await openApp();
  const found = await collect(page, [
    ['hoja de teoría', async () => {
      await openTab(page, 'learn');
      await closeSheet(page);
      await page.evaluate(() => {
        const theory = [...document.querySelectorAll('#courseMap [data-lesson]')].find(b => /-intro$|theory/.test(b.dataset.lesson));
        (theory || document.querySelector('#courseMap [data-lesson]')).click();
      });
      await waitSheet(page);
      await page.waitForFunction(() => /\b\d+ cards?\b/.test(document.getElementById('sheet').innerText), { timeout: 5000 });
    }],
    ['cambiar de instrumento', () => openSheet(page, '#instChip')],
    ['test de nivel', () => openSheet(page, '#placementGo')],
    // la rutina avisa con «Paso 1 de 3: …» y abre su primer paso
    ['rutina', async () => {
      await closeSheet(page);
      await page.$eval('#routineBtn', el => el.click());
      await page.waitForFunction(() => /Step 1 of/.test(document.body.innerText), { timeout: 8000 });
    }],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});

test('en inglés: Banda (Mis grupos y Escuela) sin español visible', async () => {
  const { page, errors, close } = await openApp();
  const found = await collect(page, [
    ['mis grupos', async () => { await openTab(page, 'band'); await tap(page, '[data-band-view="groups"]'); await waitVisible(page, 'groupBody'); }],
    ['escuela', async () => { await tap(page, '[data-band-view="school"]'); await waitVisible(page, 'schoolBody'); }],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});

test('en inglés: el aviso para crear usuario (con la privacidad) sin español visible', async () => {
  const { page, errors, close } = await openApp({ keepSheet: true });
  const found = await collect(page, [
    ['aviso para crear usuario', async () => {
      await page.waitForSelector('#sheet[open] #arGoogle', { timeout: 5000 });
    }],
    ['aviso para crear usuario: ya tengo cuenta', async () => { await tap(page, '#arMode'); await page.waitForSelector('#arReset', { timeout: 5000 }); }],
    // sin correo, «¿Has olvidado la contraseña?» explica qué falta
    ['aviso para crear usuario: sin correo', async () => { await tap(page, '#arReset'); await page.waitForSelector('#arError:not([hidden])', { timeout: 5000 }); }],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});

test('en inglés: la pantalla de acceso (plazo vencido) sin español visible', async () => {
  const GRACE_OVER_MS = 8 * 86400000;
  const { page, errors, close } = await openApp({ seed: { accountPromptSince: Date.now() - GRACE_OVER_MS } });
  const found = await collect(page, [
    ['pantalla de acceso', () => waitVisible(page, 'account', 10000)],
  ]);
  assert.deepEqual(found, {});
  assert.deepEqual(errors, []);
  await close();
});
