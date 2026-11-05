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
  await tap(app.page, '[data-learn-view="lm"]');
  await app.page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: STEP_TIMEOUT });
  return app;
}
async function openUnit(page, unit = 1) {
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

// Responde bien una pregunta de teoría según su tipo (las respuestas salen del catálogo)
async function answer(page, item) {
  await page.waitForSelector('.lm-item .lm-q', { timeout: STEP_TIMEOUT });
  if (['tocarPentagrama', 'escala'].includes(item.tipo)) {
    await writeNotes(page, item.respuesta.map(n => ({ step: scoreTokens(`| ${n}w |`)[0].step, dur: 'w' })));
    await click(page, '[data-check]');
  } else if (item.tipo === 'contar') {
    await page.$$eval('[data-opt]', (bs, r) => bs.find(b => b.textContent.trim() === String(r)).click(), item.respuesta);
  } else if (item.tipo === 'nombrarNotas') {
    for (const n of item.respuesta) await click(page, `[data-name="${({ do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' })[n.replace(/\d/, '')]}"]`);
  } else if (item.tipo === 'ordenar') {
    await click(page, '[data-check]');
  } else if (item.tipo === 'completar') {
    await click(page, `[data-opt="${item.correctas[0]}"]`);
  } else {
    await click(page, `[data-opt="${item.answer}"]`);
  }
  await page.waitForSelector('.lm-feedback .lm-why', { timeout: STEP_TIMEOUT });
}

test('vista Lenguaje: 8 unidades del nivel 1, niveles próximamente, accesible y sin desplazamiento a 360 px', async () => {
  const { page, errors, close } = await openLm();
  assert.equal(await page.$$eval('.lm-unit-card', b => b.length), 8);
  assert.equal(await page.$$eval('.lm-level.soon', b => b.length), 3);
  assert.equal(await page.$eval('[data-learn-view="lm"]', b => b.getAttribute('aria-pressed')), 'true');
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
  await page.waitForSelector('#lmUnitTitle');
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
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
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
  })).map(l => l.trim()).filter(l => l && spanish.test(l.replace(/Band Flow|Dvořák|Euphemia Allan/g, '')));
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

test('herramienta de siempre lanzada desde la unidad: la lectura rítmica abre el ensayo rítmico y vuelve a la unidad', async () => {
  const { page, errors, close } = await openLm();
  await openUnit(page, 1);
  await openExercise(page, 'lm1-u1-ritmo-a-facil');
  await waitVisible(page, 'rhythm');
  const notes = await page.$$eval('#rhythmStaff .note, #rhythmStaff ellipse', n => n.length);
  assert.ok(notes > 0, 'la partitura de la unidad está en el pentagrama');
  await click(page, '#rhExit');
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
  await waitVisible(page, 'rhythm');
  await page.$eval('#rhTouch', el => { el.checked = true; el.dispatchEvent(new Event('change')); });
  assert.equal(await page.$eval('#rhGate', el => el.hidden), true, 'sin la puerta del micrófono');
  const spb = 60 / ex.params.tempo;
  const beats = Number(ex.params.compas.split('/')[0]);
  const notes = scoreTokens(ex.params.partitura).filter(t => !t.rest);
  const t0 = await page.evaluate(() => { document.getElementById('rhStart').click(); return performance.now(); });
  for (const n of notes) {
    const at = t0 + (0.15 + (beats + n.start) * spb) * 1000;
    await page.evaluate(when => new Promise(res => setTimeout(() => {
      document.getElementById('rhTap').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      res();
    }, Math.max(0, when - performance.now()))), at);
  }
  await page.waitForSelector('#result:not([hidden])', { timeout: 15000 });
  const r = (await lmState(page)).best[id];
  assert.ok(r && r.pct >= 60, `lectura con toques: ${r && r.pct} %`);
  await click(page, '#resBack');
  await page.waitForSelector('#lmUnitTitle', { timeout: STEP_TIMEOUT });
  const book = await page.$$eval('[data-inst-tool]', bs => bs.findIndex(b => b.textContent.startsWith('Libro')));
  assert.ok(book >= 0, 'enlace al Libro');
  await click(page, `[data-inst-tool="${book}"]`);
  await waitVisible(page, 'bookpage');
  assert.deepEqual(errors, []);
  await close();
});
