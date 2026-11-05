// Dictados (Estudio) de principio a fin sobre la versión compilada: elegir nivel, escuchar, tocar con un micrófono
// simulado (un oscilador que «toca» las notas del dictado a tempo) y ver la corrección nota a nota.
// También: micrófono denegado, «no he oído nada», inglés, accesibilidad (axe) y anchura de móvil.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launch, openApp, tap, waitVisible, sleep, DESKTOP } from './helpers.mjs';
import { makeDictation } from '../../js/dictation.js';
import { instrumentById } from '../../js/instruments.js';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const RANDOM = 0.123;
const SEED = Math.floor(RANDOM * 1e9);
const OPTS = { level: 1, meter: '2/4', bars: 2 };
const LISTEN_TIMEOUT_MS = 40000;
const RESULT_TIMEOUT_MS = 20000;
const NOTE_ON = 0.8; // parte de cada nota que suena (el resto, silencio para que se oiga el ataque siguiente)

let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

// Micrófono simulado: un oscilador cuya frecuencia fija la prueba (window.__setTone); __denyMic lo niega
function fakeMic() {
  navigator.mediaDevices.getUserMedia = async () => {
    if (window.__denyMic) throw Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const dest = ac.createMediaStreamDestination();
    osc.connect(gain).connect(dest);
    gain.gain.value = 0;
    osc.start();
    window.__setTone = hz => {
      if (hz) osc.frequency.value = hz;
      gain.gain.value = hz ? 0.4 : 0;
    };
    return dest.stream;
  };
}

async function openDictation({ seed = {}, viewport, deny = false } = {}) {
  const app = await openApp(env, { seed: { dictation: { opts: OPTS }, ...seed }, ...(viewport ? { viewport } : {}) });
  await app.page.evaluate(fakeMic);
  if (deny) await app.page.evaluate(() => { window.__denyMic = true; });
  await tap(app.page, '[data-tab="practice"]');
  await waitVisible(app.page, 'practice');
  await tap(app.page, '[data-go="dictation"]');
  await waitVisible(app.page, 'dictation');
  await app.page.waitForSelector('#dictGo');
  return app;
}

// Empieza el dictado con una semilla conocida (Math.random fijo solo durante el clic)
async function startKnown(page) {
  await page.evaluate(r => {
    const real = Math.random;
    Math.random = () => r;
    document.getElementById('dictGo').click();
    Math.random = real;
  }, RANDOM);
}

const freq = midi => 440 * 2 ** ((midi - 69) / 12);

// Toca las notas del dictado a tempo, empezando cuando acaba la claqueta
async function playNotes(page, dict, transpose = 0) {
  await page.waitForFunction(() => /Ahora|Now/.test(document.getElementById('dictStatus').textContent), { timeout: 10000 });
  const spb = 60 / dict.bpm;
  const t0 = Date.now();
  for (const n of dict.notes) {
    const at = t0 + n.start * spb * 1000;
    await sleep(Math.max(0, at - Date.now()));
    if (n.rest) continue;
    await page.evaluate(hz => window.__setTone(hz), freq(n.midi + transpose));
    await sleep(n.beats * spb * 1000 * NOTE_ON);
    await page.evaluate(() => window.__setTone(0));
  }
}

async function axeViolations(page) {
  if (!(await page.evaluate(() => !!window.axe))) await page.evaluate(AXE);
  const result = await page.evaluate(() => window.axe.run(document.getElementById('dictation'), { resultTypes: ['violations'] }));
  return result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    .map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}

// Pulsa como el dedo (sin depender de la posición en pantalla, como tap() de helpers)
const press = (page, selector) => page.$eval(selector, el => el.click());

const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('elegir: diez niveles, compases según el nivel y longitud; se puede manejar con teclado', async () => {
  const { page, errors, close } = await openDictation();
  assert.equal(await page.$$eval('.dict-level', b => b.length), 10);
  assert.deepEqual(await page.$$eval('#dictBody [data-meter]', b => b.map(x => x.textContent)), ['2/4', '4/4']);
  assert.equal(await page.$eval('.dict-level[data-level="1"]', b => b.getAttribute('aria-pressed')), 'true');
  assert.match(await page.$eval('.dict-level[data-level="1"]', b => b.textContent), /Recomendado/);
  await page.$eval('.dict-level[data-level="8"]', b => b.focus());
  await page.keyboard.press('Enter');
  assert.ok((await page.$$eval('#dictBody [data-meter]', b => b.map(x => x.textContent))).includes('6/8'), 'el nivel 8 permite 6/8');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.level), '8', 'el foco sigue en el nivel elegido');
  assert.ok(!(await page.$$eval('#dictBody [data-bars]', b => b.map(x => x.dataset.bars))).includes('8'), 'sin 8 compases desde el nivel 6');
  assert.ok(await noHorizontalScroll(page), 'sin desplazamiento horizontal a 360 px');
  assert.deepEqual(await axeViolations(page), []);
  await page.keyboard.press('Escape');
  await waitVisible(page, 'practice');
  assert.deepEqual(errors, []);
  await close();
});

test('con la letra al 200 % la elección cabe a 360 px y los botones siguen siendo grandes', async () => {
  const { page, errors, close } = await openDictation();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await sleep(300);
  assert.ok(await noHorizontalScroll(page), 'sin desplazamiento horizontal');
  const boxes = await page.$$eval('#dictBody button', bs => bs.map(b => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, right: r.right, sw: b.scrollWidth, cw: b.clientWidth }; }));
  const width = await page.evaluate(() => window.innerWidth);
  boxes.forEach(b => {
    assert.ok(b.w >= 44 && b.h >= 44, `zona táctil ${b.w} × ${b.h}`);
    assert.ok(b.right <= width + 0.5, 'dentro de la pantalla');
    assert.ok(b.sw <= b.cw + 1, 'el texto no se sale del botón');
  });
  assert.deepEqual(errors, []);
  await close();
});

test('flujo completo: tres escuchas, tocar de oído y corrección nota a nota con récord', async () => {
  const dict = makeDictation(instrumentById('violin'), { ...OPTS, seed: SEED });
  const { page, errors, close } = await openDictation();
  await startKnown(page);
  await page.waitForFunction(() => document.getElementById('dictCount') && document.getElementById('dictCount').textContent === 'Escucha 1 de 3', { timeout: 3000 });
  assert.equal(await page.$eval('#dictStatus', el => el.getAttribute('aria-live')), 'polite');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'dictCount', 'el foco va al contador de escuchas');
  await page.waitForFunction(() => document.getElementById('dictPhase').textContent.startsWith('Claqueta'), { timeout: 5000 });
  // tras la primera escucha ya se puede tocar
  await page.waitForFunction(() => !document.getElementById('dictPlay').disabled, { timeout: LISTEN_TIMEOUT_MS });
  await press(page, '#dictPlay');
  assert.match(await page.$eval('#dictRelisten', b => b.textContent), /te quedan 2/, 'las escuchas que faltan siguen disponibles');
  await playNotes(page, dict);
  await page.waitForSelector('#dictScores', { timeout: RESULT_TIMEOUT_MS });
  const mark = await page.$eval('.dict-score.main b', el => parseInt(el.textContent, 10));
  assert.ok(mark >= 90, `nota: ${mark} %`);
  assert.equal(await page.$$eval('.dict-score', s => s.length), 3, 'nota final, altura y ritmo');
  const expectedCount = dict.notes.filter(n => !n.rest).length;
  const chips = await page.$$eval('.dict-chip', cs => cs.map(c => ({ cls: c.className, label: c.getAttribute('aria-label'), glyph: c.firstElementChild.textContent })));
  assert.ok(chips.filter(c => /^Nota \d+:/.test(c.label)).length === expectedCount, JSON.stringify(chips));
  chips.forEach(c => assert.ok(['✓', '≈', '✕'].includes(c.glyph), 'cada nota lleva su signo, no solo el color'));
  assert.equal(await page.$$eval('#dictStaffWant .dict-mark', m => m.length), expectedCount, 'cada nota del dictado lleva su signo');
  // al enfocar una nota se dice qué sonaba y qué se tocó (y «Saltar al contenido» no tapa el pentagrama)
  await page.$eval('.dict-chip', c => c.focus());
  await page.keyboard.press('Tab');
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
  assert.ok(await page.$eval('.skip-link', el => el.getBoundingClientRect().bottom <= 0), 'el enlace de saltar sigue oculto');
  const detail = await page.$eval('#dictDetail', el => el.textContent);
  assert.match(detail, /Sonaba/);
  assert.match(detail, /Tocaste/);
  assert.equal(await page.$eval('#dictDetail', el => el.getAttribute('aria-live')), 'polite');
  // récord guardado por nivel
  const best = await page.evaluate(() => JSON.parse(localStorage.getItem('violin-facil-v2')).dictation.best['violin:m1']);
  assert.ok(best >= 90, `récord ${best}`);
  for (const id of ['dictHearWant', 'dictHearMine', 'dictAgain', 'dictChange']) assert.ok(await page.$(`#${id}`), id);
  // Escuchar / Parar: vuelve la etiqueta al parar y al cambiar al otro botón
  await press(page, '#dictHearMine');
  assert.equal(await page.$eval('#dictHearMine', b => b.textContent), 'Parar');
  await press(page, '#dictHearMine');
  assert.equal(await page.$eval('#dictHearMine', b => b.textContent), 'Escuchar tu versión');
  await press(page, '#dictHearWant');
  await press(page, '#dictHearMine');
  assert.equal(await page.$eval('#dictHearWant', b => b.textContent), 'Volver a escuchar el dictado');
  assert.equal(await page.$eval('#dictHearMine', b => b.textContent), 'Parar');
  await press(page, '#dictHearMine');
  assert.equal(await page.$eval('#dictHearMine', b => b.textContent), 'Escuchar tu versión');
  assert.equal(await page.$eval('.dict-staves', el => el.getAttribute('tabindex')), '0', 'la partitura se puede desplazar con el teclado');
  assert.ok(await noHorizontalScroll(page), 'la partitura se desplaza dentro de su caja, no la página');
  assert.deepEqual(await axeViolations(page), []);
  await press(page, '#dictChange');
  await page.waitForSelector('#dictGo');
  assert.deepEqual(errors, []);
  await close();
});

test('percusión: dictado rítmico sin acorde, con golpes simulados, corregido solo por el ritmo', async () => {
  const dict = makeDictation(instrumentById('percussion'), { ...OPTS, seed: SEED });
  const { page, errors, close } = await openDictation({ seed: { instrument: 'percussion' } });
  assert.match(await page.$eval('.dict-level[data-level="1"]', b => b.textContent), /Negras, blancas y redondas/);
  assert.equal(await page.$('.dict-key'), null, 'sin tonalidad');
  await startKnown(page);
  await page.waitForFunction(() => document.getElementById('dictPhase').textContent.startsWith('Claqueta'), { timeout: 3000 });
  await page.waitForFunction(() => !document.getElementById('dictPlay').disabled, { timeout: LISTEN_TIMEOUT_MS });
  await press(page, '#dictPlay');
  await page.waitForFunction(() => /Ahora/.test(document.getElementById('dictStatus').textContent), { timeout: 10000 });
  const spb = 60 / dict.bpm;
  const t0 = Date.now();
  for (const n of dict.notes.filter(x => !x.rest)) {
    await sleep(Math.max(0, t0 + n.start * spb * 1000 - Date.now()));
    await page.evaluate(() => window.__setTone(300));
    await sleep(60);
    await page.evaluate(() => window.__setTone(0));
  }
  await page.waitForSelector('#dictScores', { timeout: RESULT_TIMEOUT_MS });
  assert.ok(await page.$$eval('.dict-chip', cs => cs.every(c => /^Golpe( \d+: (correcto|cerca|mal|falta)| de más)$/.test(c.getAttribute('aria-label')))));
  assert.match(await page.$eval('#dictStaffMine', s => s.innerHTML), /st-clef-perc/, 'pentagrama de percusión');
  assert.deepEqual(errors, []);
  await close();
});

// Tocar perfecto (con el micrófono simulado) debe dar al menos un 90 % en cada nivel
const PERFECT = [
  ...Array.from({ length: 10 }, (_, k) => ({ inst: 'violin', level: k + 1, meter: k + 1 === 8 ? '6/8' : k + 1 >= 6 && k + 1 < 10 ? '3/4' : '4/4', bars: k + 1 === 10 ? 4 : 2 })),
  { inst: 'clarinet', level: 10, meter: '4/4', bars: 4 },
  { inst: 'tuba', level: 5, meter: '4/4', bars: 2 },
  { inst: 'tuba', level: 10, meter: '4/4', bars: 2 },
];
for (const c of PERFECT) {
  test(`tocar perfecto: ${c.inst}, nivel ${c.level}, ${c.meter}, ${c.bars} compases → 90 % o más`, async () => {
    const inst = instrumentById(c.inst);
    const opts = { level: c.level, meter: c.meter, bars: c.bars };
    const dict = makeDictation(inst, { ...opts, seed: SEED });
    const { page, errors, close } = await openDictation({ seed: { instrument: c.inst, dictation: { opts } } });
    await startKnown(page);
    await page.waitForFunction(() => !document.getElementById('dictPlay').disabled, { timeout: LISTEN_TIMEOUT_MS });
    await press(page, '#dictPlay');
    await playNotes(page, dict, inst.transpose);
    await page.waitForSelector('#dictScores', { timeout: RESULT_TIMEOUT_MS });
    const score = await page.$eval('.dict-score.main b', el => parseInt(el.textContent, 10));
    assert.ok(score >= 90, `${c.inst} ${c.level}: ${score} % · ${dict.score}`);
    if (c.level === 10 && c.inst === 'violin') {
      assert.deepEqual(await axeViolations(page), [], 'dictado largo a 360 px');
      const before = await page.$eval('#dictStaffWant', el => el.getBoundingClientRect().height);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await sleep(300);
      const after = await page.$eval('#dictStaffWant', el => el.getBoundingClientRect().height);
      assert.ok(after > before * 1.5, `el pentagrama crece con la letra (${before} → ${after})`);
      const overlap = await page.$$eval('.dict-score', cards => cards.some(c => c.querySelector('b').scrollWidth > c.clientWidth + 1));
      assert.ok(!overlap, 'con texto al 200 % las cifras caben en sus tarjetas');
      assert.ok(await noHorizontalScroll(page));
    }
    assert.deepEqual(errors, []);
    await close();
  });
}

test('micrófono denegado: se explica cómo activarlo y se puede reintentar', async () => {
  const { page, errors, close } = await openDictation({ deny: true });
  await press(page, '#dictGo');
  await page.waitForFunction(() => !document.getElementById('dictPlay').disabled, { timeout: LISTEN_TIMEOUT_MS });
  await press(page, '#dictPlay');
  await page.waitForSelector('#dictGate:not([hidden])', { timeout: 5000 });
  assert.ok(await page.$eval('#dictStage', el => el.hidden), 'sin «Tu turno» si no hay micrófono');
  assert.match(await page.$eval('#dictMicError', el => el.textContent), /Permiso denegado/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'dictMic');
  assert.deepEqual(errors, []);
  await close();
});

test('si no se oye nada, lo dice y ofrece volver a tocar', async () => {
  const { page, errors, close } = await openDictation();
  await press(page, '#dictGo');
  await page.waitForFunction(() => !document.getElementById('dictPlay').disabled, { timeout: LISTEN_TIMEOUT_MS });
  await press(page, '#dictPlay');
  await page.waitForSelector('#dictRetry', { timeout: RESULT_TIMEOUT_MS });
  assert.match(await page.$eval('#dictBody', el => el.textContent), /No he oído nada/);
  assert.ok(await page.$('#dictRelisten'), 'se pueden oír las escuchas que quedaban');
  assert.deepEqual(errors, []);
  await close();
});

// Lo que delata el español en pantalla (como english.e2e)
const SPANISH = /[ñáéíóú¿¡«»]|(?<!\p{L})(de|del|la|las|el|los|y|con|para|por|una|tu|nivel|compás|compases|escucha|nota|notas|tocar|cerca|falta|sobra)(?!\p{L})/iu;
const spanishIn = page => page.evaluate(src => {
  const re = new RegExp(src, 'iu');
  const root = document.getElementById('dictation');
  const shown = el => el.getClientRects().length > 0;
  const labels = [...root.querySelectorAll('[aria-label]')].filter(shown).map(el => el.getAttribute('aria-label'));
  return [...root.innerText.split('\n'), ...labels].map(l => l.trim()).filter(l => re.test(l.replace(/Do-Re-Mi/g, '')));
}, SPANISH.source);

test('en inglés: la elección, la escucha y la corrección salen en inglés (también en escritorio)', async () => {
  const dict = makeDictation(instrumentById('violin'), { ...OPTS, seed: SEED });
  const { page, errors, close } = await openDictation({ seed: { lang: 'en' }, viewport: DESKTOP });
  await sleep(500);
  assert.deepEqual(await spanishIn(page), []);
  await startKnown(page);
  await page.waitForFunction(() => !document.getElementById('dictPlay').disabled, { timeout: LISTEN_TIMEOUT_MS });
  assert.deepEqual(await spanishIn(page), []);
  await press(page, '#dictPlay');
  await playNotes(page, dict).catch(() => {});
  await page.waitForSelector('#dictScores', { timeout: RESULT_TIMEOUT_MS });
  await page.$eval('.dict-chip', c => c.focus());
  await sleep(300);
  assert.deepEqual(await spanishIn(page), []);
  assert.deepEqual(errors, []);
  await close();
});
