// Curso de Lenguaje Musical de principio a fin sobre la versión compilada: la vista «Lenguaje» de Aprender (niveles,
// unidades, bloque de instrumento), y en la unidad 1 cada tipo de ejercicio nuevo con toques, teclado o un micrófono
// simulado que «canta» (oscilador): teoría, agilidad, entonación, dictado escrito, STOP, audición y creatividad.
// Cada uno deja su resultado en state.lm según el contrato. También: inglés, accesibilidad (axe), 360 px y letra al 200 %.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launch, openApp, tap, waitVisible, sleep, DESKTOP } from './helpers.mjs';
import { lmExercise } from '../../js/lm/catalog.js';
import { scoreTokens } from '../../js/lm/notes.js';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const STEP_TIMEOUT = 8000;
const SING_TIMEOUT_MS = 90000;

let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

// Micrófono simulado: un oscilador cuya frecuencia fija la prueba (window.__setTone)
function fakeMic() {
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const dest = ac.createMediaStreamDestination();
    osc.connect(gain).connect(dest);
    gain.gain.value = 0;
    osc.start();
    window.__setTone = hz => { if (hz) osc.frequency.value = hz; gain.gain.value = hz ? 0.4 : 0; };
    return dest.stream;
  };
}

async function openLm(opts = {}) {
  const app = await openApp(env, { init: fakeMic, ...opts });
  await tap(app.page, '[data-libro="lm"]');
  await app.page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: STEP_TIMEOUT });
  return app;
}
async function openUnit(page, unit = 1) {
  // tras volver a la lista, se espera a que esté pintada y sin transición en curso (si no, el toque se pierde)
  await page.waitForSelector(`.lm-unit-card[data-unit="${unit}"]`, { timeout: STEP_TIMEOUT });
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: STEP_TIMEOUT });
  await page.$eval(`.lm-unit-card[data-unit="${unit}"]`, b => b.click());
  await page.waitForSelector('#lmUnitTitle', { timeout: STEP_TIMEOUT });
}
async function openExercise(page, id) {
  await page.$eval(`[data-ex="${id}"]`, b => b.click());
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: STEP_TIMEOUT });
}
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: STEP_TIMEOUT }); await page.$eval(sel, el => el.click()); };
const next = async page => { await page.waitForSelector('[data-lm-next]', { timeout: STEP_TIMEOUT }); await click(page, '[data-lm-next]'); };
const lmState = page => page.evaluate(() => JSON.parse(localStorage.getItem('violin-facil-v2')).lm || {});
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function axeViolations(page, id) {
  if (!(await page.evaluate(() => !!window.axe))) await page.evaluate(AXE);
  const result = await page.evaluate(i => window.axe.run(document.getElementById(i), { resultTypes: ['violations'] }), id);
  return result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}

// Escribe notas en el escritor: figura, altura (con las flechas desde el cursor) y añadir
async function writeNotes(page, tokens) {
  for (const t of tokens) {
    const fig = t.rest ? `R${t.dur}` : t.dur;
    if (await page.$(`[data-fig="${fig}"]`)) await click(page, `[data-fig="${fig}"]`);
    if (!t.rest) {
      // la celda de añadir dice en qué escalón está el cursor: se lleva a la nota con las flechas
      const now = Number(await page.$eval('[data-insert]', el => el.dataset.step));
      const steps = t.step - now;
      await page.focus('[data-insert]');
      for (let k = 0; k < Math.abs(steps); k++) await page.keyboard.press(steps > 0 ? 'ArrowUp' : 'ArrowDown');
    }
    await click(page, '[data-insert]');
  }
}

// Contar: se escribe el número y se comprueba
async function setCount(page, n) {
  await page.waitForSelector('.lm-item [data-count]', { timeout: STEP_TIMEOUT });
  await page.$eval('.lm-item [data-count]', (el, v) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, n);
  await click(page, '.lm-item [data-check]');
}

// Responde bien una pregunta de teoría según su tipo (las respuestas salen del catálogo)
async function answer(page, item) {
  await page.waitForSelector('.lm-item .lm-q', { timeout: STEP_TIMEOUT });
  if (['tocarPentagrama', 'escala'].includes(item.tipo)) {
    await writeNotes(page, item.respuesta.map(n => ({ step: scoreTokens(`| ${n}w |`)[0].step, dur: 'w' })));
    await click(page, '[data-check]');
  } else if (item.tipo === 'nombrarNotas') {
    for (const n of item.respuesta) await click(page, `[data-name="${({ do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' })[n.replace(/\d/, '')]}"]`);
  } else if (item.tipo === 'ordenar') {
    await click(page, '[data-check]');
  } else if (item.tipo === 'emparejar') {
    await page.$$eval('[data-pair]', (sels, pares) => sels.forEach((sel, i) => { sel.value = pares[i][1]; }), item.pares);
    await click(page, '[data-check]');
  } else if (item.tipo === 'barras') {
    for (const g of item.respuesta) await click(page, `[data-gap="${g}"]`);
    await click(page, '[data-check]');
  } else if (item.tipo === 'completar') {
    // un hueco tras otro (cada opción guarda su número del catálogo aunque se barajen)
    const holes = (item.partitura.match(/\?/g) || []).length;
    for (let k = 0; k < holes; k++) await click(page, `.lm-item [data-opt="${holes > 1 ? item.correctas[k] : item.correctas[0]}"]:not([disabled])`);
  } else if (item.tipo === 'contar') {
    await setCount(page, item.respuesta);
  } else if (item.tipo === 'senalar') {
    await click(page, `[data-bar="${item.respuesta}"]`);
  } else {
    // las opciones se barajan en cada intento: se busca la correcta por su texto
    await page.waitForSelector('.lm-item [data-opt]', { timeout: STEP_TIMEOUT });
    await page.$$eval('.lm-item [data-opt]', (bs, w) => bs.find(b => b.textContent.trim() === w).click(), item.options[item.answer]);
  }
  await page.waitForSelector('.lm-feedback .lm-why', { timeout: STEP_TIMEOUT });
}

test('vista Lenguaje: 8 unidades del nivel 1, niveles próximamente, accesible y sin desplazamiento a 360 px', async () => {
  const { page, errors, close } = await openLm();
  assert.equal(await page.$$eval('.lm-unit-card', b => b.length), 8);
  assert.equal(await page.$$eval('.lm-level.soon', b => b.length), 3);
  assert.equal(await page.$eval('[data-libro="lm"]', b => b.getAttribute('aria-pressed')), 'true');
  assert.ok(await noHorizontalScroll(page));
  assert.deepEqual(await axeViolations(page, 'lmView'), []);
  await openUnit(page, 3);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'lmUnitTitle', 'el foco va al título de la unidad');
  const order = await page.$$eval('#lmView > section', s => s.map(x => (x.classList.contains('lm-instrument') ? 'instrumento' : x.querySelector('h3').textContent.trim())));
  assert.equal(order[2], 'instrumento', `orden: ${order.join(', ')}`);
  assert.match(await page.$eval('.lm-instrument', s => s.textContent), /Violín/);
  assert.ok(await page.$('[data-inst-lesson]'), 'enlaza la lección del curso de violín');
  assert.ok(await noHorizontalScroll(page));
  assert.deepEqual(await axeViolations(page, 'lmView'), []);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await sleep(300);
  assert.ok(await noHorizontalScroll(page), 'con la letra al 200 %');
  const small = await page.$$eval('#lmView button', bs => bs.filter(b => b.getClientRects().length).map(b => b.getBoundingClientRect()).filter(r => r.height < 44 || r.width < 44).length);
  assert.equal(small, 0, 'botones de al menos 44 px');
  // Escape (o el botón atrás de la unidad) vuelve a la lista
  await click(page, '[data-lm-back]');
  await page.waitForSelector('.lm-unit-card');
  assert.deepEqual(errors, []);
  await close();
});

test('teoría (fichas + preguntas de todo tipo) se corrige y queda registrada con el contrato', async () => {
  const id = 'lm1-u1-teoria-a-facil';
  const ex = lmExercise(id);
  const { page, errors, close } = await openLm();
  await openUnit(page, 1);
  await openExercise(page, id);
  await waitVisible(page, 'lm');
  for (let k = 0; k < ex.params.ficha.length; k++) await next(page);
  for (let i = 0; i < ex.params.items.length; i++) {
    await answer(page, ex.params.items[i]);
    if (i === 0) assert.deepEqual(await axeViolations(page, 'lm'), []);
    await next(page);
  }
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  assert.match(await page.$eval('.dict-score.main b', b => b.textContent), /^100 %/);
  const lm = await lmState(page);
  const r = lm.best[id];
  assert.deepEqual([r.level, r.unit, r.section, r.variant, r.pct, r.stars], [1, 1, 'teoria', 'facil', 100, 3]);
  assert.deepEqual(Object.keys(r.skills), ['teoria']);
  assert.ok(Number.isFinite(r.at) && Number.isFinite(r.seconds));
  assert.deepEqual(await axeViolations(page, 'lm'), []);
  await click(page, '#lmToUnit');
  await page.waitForSelector('#lmUnitTitle', { timeout: STEP_TIMEOUT });
  assert.match(await page.$eval(`[data-ex="${id}"]`, b => b.textContent), /100 %/, 'la unidad enseña el resultado');
  assert.deepEqual(errors, []);
  await close();
});

test('agilidad: nombra las notas con los botones; récord y resultado', async () => {
  const id = 'lm1-u1-agilidad-a-facil';
  const total = lmExercise(id).params.cantidad;
  const { page, errors, close } = await openLm();
  await openUnit(page, 1);
  await openExercise(page, id);
  await click(page, '#lmAgGo');
  for (let i = 0; i < total; i++) {
    await page.waitForFunction(n => document.getElementById('lmAgCount')?.textContent.startsWith(`${n} /`), { timeout: STEP_TIMEOUT }, i + 1);
    const step = Number(await page.$eval('#lmAgNote', el => el.dataset.step));
    if (i === 0) assert.match(await page.$eval('#lmAgNote', el => el.getAttribute('aria-label')), /línea|espacio/, 'se dice la posición, no el nombre');
    await click(page, `[data-name="${LETTERS[step % 7]}"]`);
  }
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  const lm = await lmState(page);
  assert.equal(lm.best[id].pct, 100);
  assert.equal(lm.records[`agil:${id}`], total);
  assert.deepEqual(errors, []);
  await close();
});

test('entonación cantada: el micrófono simulado canta cada nota (una octava más grave) y la app la corrige', async () => {
  const id = 'lm1-u1-entonacion-a-medio';
  const { page, errors, close } = await openLm();
  await openUnit(page, 1);
  await openExercise(page, id);
  const started = Date.now();
  let sung = 0;
  while (Date.now() - started < SING_TIMEOUT_MS) {
    if (await page.$('#lmScores')) break;
    const target = await page.$eval('#lmBody', el => el.dataset.target || null).catch(() => null);
    if (target) {
      // una octava por debajo: una voz grave vale igual
      await page.evaluate(m => window.__setTone(440 * 2 ** ((Number(m) - 12 - 69) / 12)), target);
      await page.waitForFunction(m => document.getElementById('lmBody').dataset.target !== m, { timeout: 15000 }, target).catch(() => {});
      await page.evaluate(() => window.__setTone(0));
      sung++;
      await sleep(150);
    } else await sleep(100);
  }
  await page.waitForSelector('#lmScores', { timeout: 5000 });
  const r = (await lmState(page)).best[id];
  assert.ok(r.pct >= 80, `nota ${r.pct} % tras ${sung} notas`);
  assert.equal(r.section, 'entonacion');
  assert.ok('entonacion' in r.skills);
  assert.ok((await lmState(page)).voice, 'guarda el registro de la voz');
  assert.deepEqual(errors, []);
  await close();
});

test('dictado escrito: escucha, escribe con el teclado en el pentagrama y corrección ✓ ≈ ✕', async () => {
  const id = 'lm1-u1-dictado-b-facil';
  const ex = lmExercise(id);
  const { page, errors, close } = await openLm({ viewport: DESKTOP });
  await openUnit(page, 1);
  await openExercise(page, id);
  await click(page, '#lmDictPlay');
  const want = scoreTokens(ex.params.partitura);
  await writeNotes(page, want);
  await click(page, '[data-check]');
  // la solución se ve antes del resultado: lo que sonaba, con los signos
  await page.waitForSelector('.lm-feedback .lm-staff', { timeout: STEP_TIMEOUT });
  await next(page);
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  const chips = await page.$$eval('.lm-chips .dict-chip', cs => cs.map(c => c.firstElementChild.textContent));
  assert.ok(chips.length === want.length && chips.every(c => c === '✓'), chips.join(''));
  assert.equal((await lmState(page)).best[id].pct, 100);
  assert.deepEqual(await axeViolations(page, 'lm'), []);
  assert.deepEqual(errors, []);
  await close();
});

test('STOP: parar antes del error se corrige como «pronto»', async () => {
  const { page, errors, close } = await openLm();
  await openUnit(page, 1);
  await openExercise(page, 'lm1-u1-ritmo-b-facil');
  await click(page, '#lmStopGo');
  await page.waitForSelector('#lmStop');
  await click(page, '#lmStop');
  await page.waitForFunction(() => /antes del error/.test(document.getElementById('lmStopPhase').textContent), { timeout: STEP_TIMEOUT });
  assert.ok(await page.$('[data-lm-next]'));
  await page.keyboard.press('Escape');
  await page.waitForSelector('#lmUnitTitle', { timeout: STEP_TIMEOUT });
  assert.deepEqual(errors, []);
  await close();
});

test('audición y creatividad: ficha con fragmento sintetizado, preguntas, composición guardada', async () => {
  const aud = lmExercise('lm1-u7-audicion-a-facil');
  const { page, errors, close } = await openLm();
  await openUnit(page, 7);
  await openExercise(page, aud.id);
  await page.waitForSelector('#lmWorkPlay');
  await click(page, '#lmWorkPlay');
  assert.ok(await page.$('#lmWorkPlay2'), 'Fanny Hensel con su fragmento');
  await next(page);
  for (const q of aud.params.preguntas) { await answer(page, q); await next(page); }
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  assert.equal((await lmState(page)).best[aud.id].pct, 100);
  await click(page, '#lmToUnit');
  await page.waitForSelector('#learn:not([hidden]) #lmUnitTitle', { timeout: STEP_TIMEOUT });
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: STEP_TIMEOUT });
  await page.$eval('[data-lm-back]', b => b.click());
  await openUnit(page, 1);
  const cre = 'lm1-u1-creatividad-a-facil';
  await openExercise(page, cre);
  await page.waitForSelector('[data-insert]');
  const rs = lmExercise(cre).params.restricciones;
  // sin notas en las restricciones es una composición rítmica (todas en la misma línea)
  const note = rs.notas ? scoreTokens(`| ${rs.notas[0]}q |`)[0] : { step: 36 };
  const beats = Number(rs.compas.split('/')[0]) * rs.compases;
  await writeNotes(page, Array.from({ length: beats }, () => ({ step: note.step, dur: 'q' })));
  await click(page, '[data-check]');
  await page.waitForSelector('.lm-rules', { timeout: STEP_TIMEOUT });
  await next(page);
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  assert.equal(await page.$('.lm-ten'), null, 'creatividad: sin nota automática');
  const lm = await lmState(page);
  assert.ok(lm.works[cre], 'la composición queda guardada');
  assert.deepEqual(lm.best[cre].skills, {}, 'creatividad: sin competencia automática (la nota la pone el profesor)');
  assert.deepEqual(errors, []);
  await close();
});

test('en inglés: la vista, la unidad y un ejercicio sin español visible', async () => {
  const { page, errors, close } = await openLm({ seed: { lang: 'en' } });
  await page.waitForNetworkIdle({ idleTime: 300, timeout: 5000 }).catch(() => {});
  await sleep(500);
  const spanish = /[ñáéíóú¿¡«»]|(?<!\p{L})(?:de|del|la|las|el|los|con|para|una|tu|tus|nivel|unidad|notas|ritmo|pulso|compás|negra|blanca|corchea|escucha|empezar|lección)(?!\p{L})/iu;
  const lines = async () => (await page.evaluate(() => {
    const shown = el => el.getClientRects().length > 0;
    return [...document.body.innerText.split('\n'), ...[...document.querySelectorAll('[aria-label]')].filter(shown).map(e => e.getAttribute('aria-label'))];
  })).map(l => l.trim()).filter(l => l && spanish.test(l.replace(/Band Flow|Dvořák|Euphemia Allan|Cajón/g, '')));
  assert.deepEqual(await lines(), []);
  await openUnit(page, 1);
  await sleep(300);
  assert.deepEqual(await lines(), []);
  await openExercise(page, 'lm1-u1-teoria-a-facil');
  await sleep(300);
  assert.deepEqual(await lines(), []);
  await next(page);
  assert.deepEqual(await lines(), []);
  assert.deepEqual(errors, []);
  await close();
});

test('lectura rítmica en la pantalla del curso (consigna, sílabas de apoyo en Fácil) y a dos voces en U7', async () => {
  const { page, errors, close } = await openLm();
  await openUnit(page, 1);
  await openExercise(page, 'lm1-u1-ritmo-a-facil');
  await waitVisible(page, 'lm');
  await page.waitForSelector('#lmBody .lm-staff', { timeout: STEP_TIMEOUT });
  assert.match(await page.$eval('#lmBody', b => b.textContent), new RegExp(lmExercise('lm1-u1-ritmo-a-facil').params.modo.slice(0, 20)));
  const syl = await page.$$eval('#lmBody .lm-staff .lm-under', u => [...new Set(u.map(x => x.textContent))]);
  assert.deepEqual(syl.sort(), ['sh', 'ta'], 'sílabas de apoyo: ta y sh');
  assert.ok(await page.$('#lmDuoTap'), 'se puede tocar la pantalla');
  await page.$eval('#lm [data-back]', b => b.click());
  await page.waitForSelector('#learn:not([hidden]) #lmUnitTitle', { timeout: STEP_TIMEOUT });
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: STEP_TIMEOUT });
  // en el curso no se enseña el interruptor del metrónomo (lo decide la variante)
  // U7 Media, a dos voces: sistema de dos pentagramas compás a compás; la app toca siempre el ostinato
  await page.$eval('[data-lm-back]', b => b.click());
  await openUnit(page, 7);
  await openExercise(page, 'lm1-u7-ritmo-a-medio');
  await waitVisible(page, 'lm');
  await page.waitForSelector('#lmBody .lm-system', { timeout: STEP_TIMEOUT });
  const rows = await page.$$eval('#lmBody .lm-sysbar', cols => cols.map(c => c.querySelectorAll(':scope > .lm-sysrow').length));
  assert.ok(rows.length >= 8 && rows.every(n => n === 2), `columnas con las dos voces: ${rows}`);
  const aligned = await page.$$eval('#lmBody .lm-sysbar', cols => cols.every(c => {
    const bars = [...c.querySelectorAll(':scope > .lm-sysrow > .lm-sc:last-child')].map(b => Math.round(b.getBoundingClientRect().right));
    return Math.abs(bars[0] - bars[1]) <= 1;
  }));
  assert.ok(aligned, 'la barra de cada compás cae a la misma altura en las dos voces');
  assert.ok(await page.$eval('#rhythm', r => r.hidden), 'no es el ensayo rítmico (donde el ostinato se podía apagar)');
  await click(page, '#lmDuoTap');
  await page.waitForSelector('#lmScores', { timeout: 60000 });
  assert.ok((await lmState(page)).last['lm1-u7-ritmo-a-medio'], 'queda registrada');
  await click(page, '#lmToUnit');
  await page.waitForSelector('#learn:not([hidden]) #lmUnitTitle', { timeout: STEP_TIMEOUT });
  // Notas tenidas desde «En tu instrumento» (violín: cuerda frotada) con su vuelta a la unidad
  const tools = await page.$$eval('[data-inst-tool]', bs => bs.map(b => b.textContent.trim()));
  assert.ok(tools.length > 0, 'herramientas del instrumento');
  assert.deepEqual(errors, []);
  await close();
});

test('canción de la unidad cantada a tempo: afinación y ataques medidos nota a nota (micrófono simulado)', async () => {
  const id = 'lm1-u1-cancion-a-medio';
  const { page, errors, close } = await openLm();
  await openUnit(page, 1);
  await openExercise(page, id);
  await click(page, '#lmSongGo');
  const started = Date.now();
  let last = null;
  while (Date.now() - started < SING_TIMEOUT_MS) {
    if (await page.$('#lmScores')) break;
    const cur = await page.$eval('#lmBody', el => (el.dataset.index ? `${el.dataset.index}:${el.dataset.target}` : null)).catch(() => null);
    if (cur && cur !== last) {
      last = cur;
      const midi = Number(cur.split(':')[1]);
      // un corte breve antes de cada nota: así dos notas iguales seguidas son dos ataques
      await page.evaluate(m => { window.__setTone(0); setTimeout(() => window.__setTone(440 * 2 ** ((m - 69) / 12)), 30); }, midi);
    } else if (!cur && last) { await page.evaluate(() => window.__setTone(0)); last = null; }
    await sleep(15);
  }
  await page.waitForSelector('#lmScores', { timeout: 5000 });
  const r = (await lmState(page)).best[id];
  assert.ok(r.skills.entonacion >= 80, `afinación ${r.skills.entonacion} %`);
  assert.ok(r.skills.ritmo >= 60, `ataques ${r.skills.ritmo} %`);
  assert.notEqual(r.skills.ritmo, undefined, 'el ritmo se mide aparte de la afinación');
  assert.deepEqual(errors, []);
  await close();
});

test('lectura rítmica respondida con toques en la pantalla (sin micrófono) y el Libro desde «En tu instrumento»', async () => {
  const id = 'lm1-u1-ritmo-a-facil';
  const ex = lmExercise(id);
  const { page, errors, close } = await openLm({ init: () => { navigator.mediaDevices.getUserMedia = async () => { throw Object.assign(new Error('no'), { name: 'NotAllowedError' }); }; } });
  await openUnit(page, 1);
  await openExercise(page, id);
  await click(page, '#lmDuoTap');
  await page.waitForFunction(() => document.getElementById('lmBody').dataset.readingStart, { timeout: STEP_TIMEOUT });
  const start = Number(await page.$eval('#lmBody', b => b.dataset.readingStart));
  const spb = 60 / ex.params.tempo;
  for (const n of scoreTokens(ex.params.partitura).filter(t => !t.rest)) {
    await page.evaluate(when => new Promise(res => setTimeout(() => {
      document.getElementById('lmTap').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      res();
    }, Math.max(0, when - performance.now()))), start + n.start * spb * 1000);
  }
  await page.waitForSelector('#lmScores', { timeout: 20000 });
  const r = (await lmState(page)).best[id];
  assert.ok(r && r.pct >= 60, `lectura con toques: ${r && r.pct} %`);
  assert.ok(await page.$('.lm-ten'), 'con su calificación sobre 10');
  await click(page, '#lmToUnit');
  await page.waitForSelector('#learn:not([hidden]) #lmUnitTitle', { timeout: STEP_TIMEOUT });
  const book = await page.$$eval('[data-inst-tool]', bs => bs.findIndex(b => b.textContent.startsWith('Libro')));
  assert.ok(book >= 0, 'enlace al Libro');
  await click(page, `[data-inst-tool="${book}"]`);
  await waitVisible(page, 'bookpage');
  assert.deepEqual(errors, []);
  await close();
});

test('canción en el móvil: la nota que se canta está a la vista (U7 Media, dos vueltas)', async () => {
  const id = 'lm1-u7-cancion-a-medio';
  const { page, errors, close } = await openLm({ viewport: { width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true } });
  await openUnit(page, 7);
  await openExercise(page, id);
  await click(page, '#lmSongGo');
  const started = Date.now();
  let last = null;
  let seen = 0;
  let visible = 0;
  while (Date.now() - started < SING_TIMEOUT_MS) {
    if (await page.$('#lmScores')) break;
    const cur = await page.$eval('#lmBody', el => (el.dataset.index ? `${el.dataset.index}:${el.dataset.target}` : null)).catch(() => null);
    if (cur && cur !== last) {
      last = cur;
      const midi = Number(cur.split(':')[1]);
      await page.evaluate(m => { window.__setTone(0); setTimeout(() => window.__setTone(440 * 2 ** ((m - 69) / 12)), 30); }, midi);
      await sleep(120);
      const v = await page.evaluate(() => {
        const on = document.querySelector('.lm-sing-staff .lm-now');
        if (!on) return null;
        const r = on.getBoundingClientRect();
        const bar = document.querySelector('.lm-sticky-controls');
        const bottom = innerHeight - (bar ? bar.getBoundingClientRect().height : 0);
        return r.top >= 0 && r.bottom <= bottom;
      });
      if (v !== null) { seen++; if (v) visible++; }
    } else if (!cur && last) { await page.evaluate(() => window.__setTone(0)); last = null; }
    await sleep(15);
  }
  await page.waitForSelector('#lmScores', { timeout: 5000 });
  assert.ok(seen > 20 && visible / seen >= 0.95, `a la vista ${visible} de ${seen}`);
  assert.deepEqual(errors, []);
  await close();
});

// Recorre la teoría y la audición de las 8 unidades en Fácil y Media (ninguna se cuelga y todas quedan registradas)
for (const section of ['teoria', 'audicion']) {
  test(`${section}: las 8 unidades en Fácil y Media se completan y registran su resultado`, async () => {
    const { page, errors, close } = await openLm({ viewport: DESKTOP });
    for (let u = 1; u <= 8; u++) {
      await openUnit(page, u);
      for (const v of ['facil', 'medio']) {
        const id = `lm1-u${u}-${section}-a-${v}`;
        const ex = lmExercise(id);
        if (!ex) continue;
        await openExercise(page, id);
        try {
        if (section === 'teoria') {
          const summary = /resumen/.test(ex.params.herramienta?.params?.cards || '');
          for (let k = 0; k < (summary ? 1 : ex.params.ficha.length); k++) await next(page);
          for (const item of ex.params.items) { await answer(page, item); await next(page); }
        } else {
          await page.waitForSelector('#lmWorkPlay');
          await next(page);
          for (const q of ex.params.preguntas) { await answer(page, q); await next(page); }
        }
        await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
        assert.ok(await page.$eval('#lmBody', b => !/No se ha podido/.test(b.textContent)), id);
        const r = (await lmState(page)).last[id];
        assert.ok(r && r.pct >= 60, `${id}: ${r && r.pct} %`);
        await click(page, '#lmToUnit');
        await page.waitForFunction(() => !document.documentElement.dataset.nav && !document.getElementById('learn').hidden, { timeout: STEP_TIMEOUT });
        await page.waitForSelector('#learn #lmUnitTitle', { timeout: STEP_TIMEOUT });
        } catch (err) {
          const state = await page.evaluate(() => ({ screen: [...document.querySelectorAll('main > section')].filter(x => !x.hidden).map(x => x.id), body: (document.getElementById('lmBody') || {}).innerText }));
          throw new Error(`${id}: ${err.message} · ${JSON.stringify(state).slice(0, 600)}`);
        }
      }
      await click(page, '[data-lm-back]');
      await page.waitForSelector('.lm-unit-card');
    }
    assert.deepEqual(errors, []);
    await close();
  });
}

// Una solución correcta de cada creatividad: con ella, el 100 % de las reglas (todas se pueden cumplir con el editor)
const CREATIVE = {
  'lm1-u1-creatividad-a-facil': { score: '| C5q C5q | C5q Rq | C5q C5q | C5q Rq |' },
  'lm1-u1-creatividad-a-medio': { score: '| G4q E4q | G4q Rq | G4q E4q | E4q G4q |', lyrics: 'Pe-ras ri-cas, ya' },
  'lm1-u2-creatividad-a-facil': { score: '| C5e C5e C5q | C5e C5e Rq | C5q C5e C5e | C5e C5e C5q |' },
  'lm1-u2-creatividad-a-medio': { score: '| E4e G4e A4q | G4q Rq | A4e A4e G4q | E4q G4q |', lyrics: 'Soy un ro-bot de me-tal' },
  'lm1-u3-creatividad-a-facil': { score: '| G4q A4q G4q E4q | E4q E4q C4h |' },
  'lm1-u3-creatividad-a-medio': { score: '| C4h E4h | G4q A4q G4h | Rh E4q G4q | E4q A4q C4h |' },
  'lm1-u4-creatividad-a-facil': { score: '| C5q C5q C5q | C5h C5q | C5e C5e C5q C5q | C5h C5q |' },
  'lm1-u4-creatividad-a-medio': { score: '| C4q D4q E4q | G4h A4q | G4q E4q D4q | C4h C4q |', repeat: true },
  'lm1-u5-creatividad-a-facil': { score: '| C4q D4q E4q F4q | G4q A4q G4q F4q | E4q D4q E4q D4q | C4w |' },
  'lm1-u5-creatividad-a-medio': { score: '| C4q D4q E4q F4q | G4q A4q B4q C5q | C5w | Rw | C5q B4q A4q G4q | F4q E4q D4q E4q | D4q E4q D4q D4q | C4w |' },
  'lm1-u6-creatividad-a-facil': { dyn: { 1: 'p', 2: 'f', 3: 'cresc', 4: 'dim' }, fermata: true },
  'lm1-u6-creatividad-a-medio': { meter: '2/4', score: '| C4q E4q | G4q C5q | D5q C5q | C5h | C4q E4q | G4q C5q | D5q C5q | C5h |', dyn: { 1: 'f', 5: 'p' }, fermata: true },
  'lm1-u7-creatividad-a-facil': { raise: { index: 8, steps: 5 } },
  'lm1-u7-creatividad-a-medio': { score: '| A4q B4q C5q B4q | A4h E4h | A4q G4q F4q E4q | A4w |', breathAfter: 5, lyrics: 'I-za la ve-la, e-ho' },
  'lm1-u8-creatividad-a-facil': { score: '| G4q A4q G4q E4q | D4q E4q C4h |' },
  'lm1-u8-creatividad-a-medio': { meter: '2/4', pickup: 1, score: '| G4q | C5q C5q | B4q A4q | G4q E4q | C5h | A4q B4q | C5q D5q | C5q G4q | C5q |', lyrics: 'Te vie-nes, ya' },
};
const setControl = (page, sel, apply, ...args) => page.$eval(sel, apply, ...args);

test('creatividad: las 16 se pueden cumplir enteras con el editor (solución correcta = 100 % de las reglas)', async () => {
  const { page, errors, close } = await openLm({ viewport: DESKTOP });
  for (let u = 1; u <= 8; u++) {
    await openUnit(page, u);
    for (const v of ['facil', 'medio']) {
      const id = `lm1-u${u}-creatividad-a-${v}`;
      const sol = CREATIVE[id];
      await openExercise(page, id);
      await page.waitForSelector('#lmBody [data-check]', { timeout: STEP_TIMEOUT });
      if (sol.meter) await click(page, `[data-meter="${sol.meter}"]`);
      if (sol.pickup) await click(page, `[data-pick="${sol.pickup}"]`);
      if (sol.score) await writeNotes(page, scoreTokens(sol.score));
      if (sol.raise) {
        await click(page, `[data-idx="${sol.raise.index}"]`);
        await page.focus(`[data-idx="${sol.raise.index}"]`);
        for (let k = 0; k < sol.raise.steps; k++) await page.keyboard.press('ArrowUp');
      }
      if (sol.breathAfter !== undefined) { await click(page, `[data-idx="${sol.breathAfter}"]`); await click(page, '[data-breath]'); }
      for (const [bar, sign] of Object.entries(sol.dyn || {})) {
        await setControl(page, `[data-dynbar="${bar}"]`, (s, val) => { s.value = val; s.dispatchEvent(new Event('change', { bubbles: true })); }, sign);
      }
      if (sol.fermata) await setControl(page, '[data-fermata]', c => { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
      if (sol.repeat) await setControl(page, '[data-repeat]', c => { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
      if (sol.lyrics) await page.type('#lmLyrics', sol.lyrics);
      await click(page, '#lmBody [data-check]');
      await page.waitForSelector('.lm-rules', { timeout: STEP_TIMEOUT });
      const rules = await page.$$eval('.lm-rules li', li => li.map(x => `${x.className}:${x.textContent.trim()}`));
      assert.ok(rules.every(r => r.startsWith('ok')), `${id}: ${rules.join(' | ')}`);
      await next(page);
      await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
      assert.equal((await lmState(page)).last[id].pct, 100, id);
      await click(page, '#lmToUnit');
      await page.waitForFunction(() => !document.documentElement.dataset.nav && !document.getElementById('learn').hidden, { timeout: STEP_TIMEOUT });
      await page.waitForSelector('#learn #lmUnitTitle', { timeout: STEP_TIMEOUT });
    }
    await click(page, '[data-lm-back]');
    await page.waitForSelector('.lm-unit-card');
  }
  assert.deepEqual(errors, []);
  await close();
});

// Recorre un ejercicio de varias partes hasta el resultado, contestando lo que aparezca: continuar, empezar, cantar
// (micrófono simulado con la nota que pide la app), nombrar la nota, la primera opción o «Comprobar»
async function drive(page, limitMs) {
  const started = Date.now();
  let lastTarget = null;
  while (Date.now() - started < limitMs) {
    const state = await page.evaluate(() => {
      const body = document.getElementById('lmBody');
      const vis = sel => { const el = body.querySelector(sel); return !!el && !el.disabled && el.getClientRects().length > 0; };
      const ag = body.querySelector('#lmAgNote');
      return {
        failed: !!body.dataset.error, done: !!document.getElementById('lmScores'), next: vis('[data-lm-next]'), tap: vis('#lmTapGo'), agGo: vis('#lmAgGo'),
        agStep: ag && ag.dataset.step ? Number(ag.dataset.step) : null, target: body.dataset.target || (body.querySelector('[data-target]') || { dataset: {} }).dataset.target || null,
        opt: vis('.lm-item [data-opt]:not([disabled])'), name: vis('.lm-item [data-name]:not([disabled])'), check: vis('[data-check]'), bar: vis('.lm-item [data-bar]:not([disabled])'),
      };
    });
    if (state.done) return true;
    if (state.failed) return false;
    if (state.target) {
      if (state.target !== lastTarget) {
        lastTarget = state.target;
        await page.evaluate(m => { window.__setTone(0); setTimeout(() => window.__setTone(440 * 2 ** ((Number(m) - 69) / 12)), 40); }, state.target);
      }
    } else if (lastTarget) { await page.evaluate(() => window.__setTone(0)); lastTarget = null; }
    if (state.next) await page.$eval('[data-lm-next]', b => b.click());
    else if (state.tap) await page.$eval('#lmTapGo', b => b.click());
    else if (state.agGo) await page.$eval('#lmAgGo', b => b.click());
    else if (state.agStep !== null && await page.$('.lm-names [data-name]')) {
      await page.$eval(`.lm-names [data-name="${LETTERS[state.agStep % 7]}"]`, b => b.click()).catch(() => {});
      await sleep(200);
    } else if (state.opt) await page.$eval('.lm-item [data-opt]:not([disabled])', b => b.click());
    else if (state.bar) await page.$eval('.lm-item [data-bar]:not([disabled])', b => b.click());
    else if (state.name) await page.$eval('.lm-item [data-name]', b => b.click());
    else if (!state.target && state.check) await page.$eval('#lmBody [data-check]', b => b.click());
    await sleep(40);
  }
  return false;
}

test('repaso: los 16 repasos (8 unidades, Fácil y Media) se hacen enteros y registran sus competencias', async () => {
  const { page, errors, close } = await openLm({ viewport: DESKTOP });
  for (let u = 1; u <= 8; u++) {
    await openUnit(page, u);
    for (const v of ['facil', 'medio']) {
      const id = `lm1-u${u}-repaso-a-${v}`;
      await openExercise(page, id);
      const ok = await drive(page, 240000);
      const body = await page.$eval('#lmBody', b => `${b.innerText.slice(0, 300)} ${b.dataset.error || ''}`);
      assert.ok(ok, `${id} no llega al resultado: ${body}`);
      assert.ok(!/No se ha podido/.test(body), id);
      const r = (await lmState(page)).last[id];
      assert.ok(r && Object.keys(r.skills).length >= 5, `${id}: ${JSON.stringify(r && r.skills)}`);
      await page.evaluate(() => window.__setTone(0));
      await click(page, '#lmToUnit');
      await page.waitForFunction(() => !document.documentElement.dataset.nav && !document.getElementById('learn').hidden, { timeout: STEP_TIMEOUT });
      await page.waitForSelector('#learn #lmUnitTitle', { timeout: STEP_TIMEOUT });
    }
    await click(page, '[data-lm-back]');
    await page.waitForSelector('.lm-unit-card');
  }
  assert.deepEqual(errors, []);
  await close();
});
