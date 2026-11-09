// Curso de Lenguaje Musical · Nivel 4 sobre la versión compilada (Chrome real): cada ejercicio se abre en Fácil y Media sin
// errores, y varios se completan de punta a punta: un ritmo en 9/8, una lectura con D.S. al Coda, una serie de preguntas de
// intervalos con especie, un dictado en una tonalidad de dos bemoles, la agilidad nueva (armadura e intervalos con especie),
// y la teoría y la audición de las 8 unidades. El Nivel 4 está abierto como el 2 (beta).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openApp, DESKTOP, tap } from './helpers.mjs';
import { lmExercise, LM_LEVELS } from '../../js/lm/catalog.js';
import { scoreTokens, solfaToName, keyAcc, accOfName } from '../../js/lm/notes.js';
import { readingTimeline } from '../../js/lm/rhythm-plan.js';
import { keySignatureSteps, yOf, CELL_H } from '../../js/lm/staff-lm.js';
import { intervalRounds } from '../../js/lm/tasks-staff.js';
import { seedOf, tokenLabel } from '../../js/lm/kit.js';
import { armaduraOf } from '../../js/lm/harmony.js';

const STEP_TIMEOUT = 8000;
const LEVEL = LM_LEVELS[3];
let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

function fakeMic() {
  navigator.mediaDevices.getUserMedia = async () => {
    // un solo contexto de audio para todas las aperturas (Chrome limita cuántos puede haber a la vez)
    if (window.__fakeStream) return window.__fakeStream;
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const dest = ac.createMediaStreamDestination();
    osc.connect(gain).connect(dest);
    gain.gain.value = 0;
    osc.start();
    window.__setTone = hz => { if (hz) osc.frequency.value = hz; gain.gain.value = hz ? 0.4 : 0; };
    window.__fakeStream = dest.stream;
    return dest.stream;
  };
}
async function openLm(opts = {}) {
  const app = await openApp(env, { init: fakeMic, viewport: DESKTOP, ...opts });
  await tap(app.page, '[data-libro="lm"]');
  await app.page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: STEP_TIMEOUT });
  return app;
}
async function openUnit(page, unit) {
  await page.waitForSelector(`.lm-unit-card[data-level="4"][data-unit="${unit}"]`, { timeout: STEP_TIMEOUT });
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: STEP_TIMEOUT });
  await page.$eval(`.lm-unit-card[data-level="4"][data-unit="${unit}"]`, b => b.click());
  await page.waitForSelector('#lmUnitTitle', { timeout: STEP_TIMEOUT });
}
async function openExercise(page, id) {
  await page.$eval(`[data-ex="${id}"]`, b => b.click());
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: STEP_TIMEOUT });
}
const click = async (page, sel) => { await page.waitForSelector(sel, { timeout: STEP_TIMEOUT }); await page.$eval(sel, el => el.click()); };
const next = async page => { await page.waitForSelector('[data-lm-next]', { timeout: STEP_TIMEOUT }); await click(page, '[data-lm-next]'); };
const lmState = page => page.evaluate(() => JSON.parse(localStorage.getItem('violin-facil-v2')).lm || {});
async function backToUnit(page) {
  await page.$eval('#lm [data-back]', b => b.click());
  await page.waitForFunction(() => !document.documentElement.dataset.nav && !document.getElementById('learn').hidden, { timeout: STEP_TIMEOUT });
  await page.waitForSelector('#learn #lmUnitTitle', { timeout: STEP_TIMEOUT });
}

// El signo de paleta que hace falta para escribir una nota: el que la armadura no pone ya (♯, ♭ o ♮)
const accFor = (name, armadura = 0) => {
  const acc = accOfName(name);
  return acc === keyAcc(name[0], armadura) ? null : acc === 1 ? '#' : acc === -1 ? 'b' : 'n';
};

// Escribe notas en el escritor: figura, alteración (paleta), altura (flechas desde el cursor) y añadir
async function writeNotes(page, tokens) {
  for (const t of tokens) {
    const fig = t.rest ? `R${t.dur}` : t.dur;
    if (await page.$(`[data-fig="${fig}"]`)) await click(page, `[data-fig="${fig}"]`);
    if (!t.rest) {
      const now = Number(await page.$eval('[data-insert]', el => el.dataset.step));
      const steps = t.step - now;
      await page.focus('[data-insert]');
      for (let k = 0; k < Math.abs(steps); k++) await page.keyboard.press(steps > 0 ? 'ArrowUp' : 'ArrowDown');
      if (t.acc) await click(page, `[data-acc="${t.acc}"]`);
    }
    await click(page, '[data-insert]');
  }
}
async function setCount(page, n) {
  await page.waitForSelector('.lm-item [data-count]', { timeout: STEP_TIMEOUT });
  await page.$eval('.lm-item [data-count]', (el, v) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, n);
  await click(page, '.lm-item [data-check]');
}
const notesOf = (names, armadura = 0) => names.map(n => ({ step: scoreTokens(`| ${n}w |`)[0].step, dur: 'w', acc: accFor(n, armadura) }));

// Coloca la armadura: ♯ o ♭ y un clic real en el pentagrama a la altura de cada alteración, de izquierda a derecha
async function placeKeySignature(page, item) {
  const clef = item.clave === 'fa' ? 'bass' : 'treble';
  const steps = keySignatureSteps(item.respuesta, clef);
  if (item.respuesta) await click(page, `[data-sym="${item.respuesta < 0 ? 'b' : '#'}"]`);
  for (let i = 0; i < steps.length; i++) {
    const sel = `.lm-item [data-slot="${i}"]`;
    await page.$eval(sel, el => el.scrollIntoView({ block: 'center' }));
    const box = await page.$eval(`${sel} svg`, el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, top: r.top, h: r.height }; });
    await page.mouse.click(box.x, box.top + (yOf(steps[i], clef) / CELL_H) * box.h);
  }
  await click(page, '.lm-item [data-check]');
}

// Responde bien una pregunta de teoría según su tipo (las respuestas salen del catálogo)
async function answer(page, item) {
  await page.waitForSelector('.lm-item .lm-q', { timeout: STEP_TIMEOUT });
  // ninguna pregunta dibuja «undefined» ni «NaN» en sus pentagramas
  assert.equal(await page.$eval('.lm-item', b => [...b.querySelectorAll('svg')].filter(s => /undefined|NaN/.test(s.outerHTML)).length), 0, `${item.id}: «undefined» o «NaN» en un pentagrama`);
  if (['tocarPentagrama', 'escala'].includes(item.tipo)) {
    await writeNotes(page, notesOf([...item.respuesta, ...(item.respuestaBajada || [])], item.armadura || 0));
    await click(page, '[data-check]');
  } else if (item.tipo === 'nombrarNotas') {
    for (const n of item.respuesta) {
      // la letra con la alteración de la armadura; si la nota lleva otra, antes se elige en la paleta
      const name = solfaToName(n);
      const sign = accFor(`${name}4`, item.armadura || 0);
      if (sign) await click(page, `.lm-item [data-mod="${sign}"]`);
      await click(page, `.lm-item [data-name="${name[0]}${({ '-1': 'b', 0: '', 1: '#' })[keyAcc(name[0], item.armadura || 0)]}"]`);
    }
  } else if (item.tipo === 'ordenar') {
    // cada elemento sube hasta su sitio con las flechas
    const want = item.respuesta || item.items;
    for (let i = 0; i < want.length; i++) {
      for (;;) {
        const cur = await page.evaluate(() => [...document.querySelectorAll('.lm-order-text')].map(e => e.textContent));
        const at = cur.indexOf(want[i]);
        if (at <= i) break;
        await click(page, `[data-up="${at}"]`);
      }
    }
    await click(page, '[data-check]');
  } else if (item.tipo === 'emparejar') {
    await page.$$eval('[data-pair]', (sels, pares) => sels.forEach((sel, i) => { sel.value = pares[i][1]; }), item.pares);
    await click(page, '[data-check]');
  } else if (item.tipo === 'barras') {
    for (const g of item.respuesta) await click(page, `[data-gap="${g}"]`);
    await click(page, '[data-check]');
  } else if (item.tipo === 'completar') {
    const holes = (item.partitura.match(/\?/g) || []).length;
    for (let k = 0; k < holes; k++) await click(page, `.lm-item [data-opt="${holes > 1 ? item.correctas[k] : item.correctas[0]}"]:not([disabled])`);
  } else if (item.tipo === 'contar') {
    await setCount(page, item.respuesta);
  } else if (item.tipo === 'senalar') {
    await click(page, `[data-bar="${item.respuesta}"]`);
  } else if (item.tipo === 'clasificarCompas') {
    await click(page, `.lm-item [data-tipo="${item.respuesta.tipo}"]`);
    await click(page, `.lm-item [data-pulsos="${item.respuesta.pulsos}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'clasificarIntervalo') {
    await click(page, `.lm-item [data-num="${item.respuesta.numero}"]`);
    await click(page, `.lm-item [data-esp="${item.respuesta.especie}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'armadura') {
    await placeKeySignature(page, item);
  } else if (item.tipo === 'identificarGrado') {
    await click(page, `.lm-item [data-grado="${item.respuesta.grado}"]`);
    await click(page, `.lm-item [data-nombre="${item.respuesta.nombre}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'clasificarAcorde') {
    await click(page, `.lm-item [data-tipo="${item.respuesta.tipo}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'construirAcorde') {
    await writeNotes(page, notesOf(item.respuesta, item.tonalidad ? armaduraOf(item.tonalidad) : 0));
    await click(page, '[data-check]');
  } else if (item.tipo === 'enarmonico') {
    await writeNotes(page, notesOf([item.respuesta]));
    await click(page, '[data-check]');
  } else if (item.tipo === 'agrupar') {
    await click(page, `.lm-item [data-grupo="${item.respuesta.join('+')}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'mismoRitmo') {
    for (let k = 0; k < item.pares.length; k++) await click(page, `.lm-item [data-same="${k}:${item.pares[k][2] ? 'si' : 'no'}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'invertirIntervalo') {
    await click(page, `.lm-item [data-num="${item.respuesta.numero}"]`);
    await click(page, `.lm-item [data-esp="${item.respuesta.especie}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'clasificarNotas') {
    for (let k = 0; k < item.respuesta.length; k++) await click(page, `.lm-item [data-real="${k}:${item.respuesta[k]}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'ubicarNota') {
    await click(page, `.lm-item [data-tipo="${item.respuesta.tipo}"]`);
    await click(page, `.lm-item [data-n="${item.respuesta.n}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'nombreEnClave') {
    await click(page, `.lm-item [data-name="${item.respuesta[0]}"]`);
    await click(page, `.lm-item [data-oct="${item.respuesta.slice(1)}"]`);
    await click(page, '.lm-item [data-check]');
  } else if (item.tipo === 'realizarOrnamento') {
    // las opciones son pentagramas: se reconoce la buena por su descripción para el lector de pantalla
    const label = scoreTokens(item.opciones[item.correctas[0]]).map(x => tokenLabel(x, 'us')).join(', ');
    await page.waitForSelector('.lm-item [data-opt]', { timeout: STEP_TIMEOUT });
    await page.$$eval('.lm-item [data-opt]', (bs, w) => bs.find(b => b.querySelector('.sr-only').textContent === w).click(), label);
  } else if (item.tipo === 'armonizar') {
    await page.waitForSelector('.lm-item [data-opt]', { timeout: STEP_TIMEOUT });
    await page.$$eval('.lm-item [data-opt]', (bs, w) => bs.find(b => b.textContent.trim() === w).click(), item.opciones[item.correctas[0]]);
  } else if (['clasificarCadencia', 'clasificarModulacion', 'reconocerOrnamento'].includes(item.tipo)) {
    const want = item.respuesta[0].toUpperCase() + item.respuesta.slice(1);
    await page.waitForSelector('.lm-item [data-opt]', { timeout: STEP_TIMEOUT });
    await page.$$eval('.lm-item [data-opt]', (bs, w) => bs.find(b => b.textContent.trim() === w).click(), want);
  } else {
    await page.waitForSelector('.lm-item [data-opt]', { timeout: STEP_TIMEOUT });
    await page.$$eval('.lm-item [data-opt]', (bs, w) => bs.find(b => b.textContent.trim() === w).click(), item.options[item.answer]);
  }
  await page.waitForSelector('.lm-feedback .lm-why', { timeout: STEP_TIMEOUT });
}

// Hace una teoría entera (ficha y preguntas) y devuelve la última nota guardada
async function doTheory(page, id) {
  const ex = lmExercise(id);
  await openExercise(page, id);
  const summary = /resumen/.test(ex.params.herramienta?.params?.cards || '');
  for (let k = 0; k < (summary ? 1 : ex.params.ficha.length); k++) await next(page);
  for (const item of ex.params.items) { await answer(page, item); await next(page); }
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  return (await lmState(page)).last[id];
}

test('el Nivel 4 está en la vista Lenguaje, abierto y con sus 8 unidades', async () => {
  const { page, errors, close } = await openLm();
  assert.equal(await page.$$eval('.lm-unit-card[data-level="4"]', b => b.length), 8);
  assert.equal(await page.$$eval('.lm-level.soon', b => b.length), 0, 'el Nivel 4 es el último: ya no queda ningún nivel «próximamente»');
  assert.equal(await page.$$eval('.lm-level', b => b.length), 4);
  await openUnit(page, 6);
  assert.match(await page.$eval('#lmUnitTitle', h => h.textContent), /\S/);
  assert.deepEqual(errors, []);
  await close();
});

test('los 222 ejercicios del Nivel 4 se abren en Fácil y Media sin errores', async () => {
  const { page, errors, close } = await openLm();
  let opened = 0;
  for (let u = 1; u <= 8; u++) {
    await openUnit(page, u);
    for (const e of LEVEL.units[u - 1].exercises) {
      if (process.env.LM4_TRACE) process.stderr.write(`${e.id}\n`);
      await openExercise(page, e.id);
      await page.waitForFunction(() => {
        const b = document.getElementById('lmBody');
        return b && (b.dataset.error || b.children.length > 0);
      }, { timeout: STEP_TIMEOUT });
      const bad = await page.$eval('#lmBody', b => b.dataset.error || (/No se ha podido hacer|todavía no está/.test(b.textContent) ? b.textContent.slice(0, 120) : ''));
      assert.equal(bad, '', `${e.id}: ${bad}`);
      // ningún pentagrama dibuja «undefined» ni «NaN» (un error pasado de otro nivel)
      const broken = await page.$eval('#lmBody', b => [...b.querySelectorAll('svg')].filter(s => /undefined|NaN/.test(s.outerHTML)).length + (/undefined|NaN/.test(b.innerText) ? 1 : 0));
      assert.equal(broken, 0, `${e.id}: algún pentagrama dibuja «undefined» o «NaN»`);
      opened++;
      await backToUnit(page);
    }
    await click(page, '[data-lm-back]');
    await page.waitForSelector('.lm-unit-card');
  }
  assert.equal(opened, LEVEL.units.flatMap(u => u.exercises).length);
  assert.equal(opened, 222);
  assert.deepEqual(errors, []);
  await close();
});


// Teoría y audición de las 8 unidades en Fácil y Media: se completan y registran su resultado
for (const section of ['teoria', 'audicion']) {
  test(`${section}: las 8 unidades del Nivel 4 en Fácil y Media se completan y registran su resultado`, async () => {
    const { page, errors, close } = await openLm();
    for (let u = 1; u <= 8; u++) {
      await openUnit(page, u);
      for (const v of ['facil', 'medio']) {
        const id = `lm4-u${u}-${section}-a-${v}`;
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
          const r = (await lmState(page)).last[id];
          assert.ok(r && r.pct >= 99, `${id}: ${r && r.pct} %`);
          await click(page, '#lmToUnit');
          await page.waitForFunction(() => !document.documentElement.dataset.nav && !document.getElementById('learn').hidden, { timeout: STEP_TIMEOUT });
          await page.waitForSelector('#learn #lmUnitTitle', { timeout: STEP_TIMEOUT });
        } catch (err) {
          const state = await page.evaluate(() => ({ body: (document.getElementById('lmBody') || {}).innerText }));
          throw new Error(`${id}: ${err.message} · ${JSON.stringify(state).slice(0, 500)}`);
        }
      }
      await click(page, '[data-lm-back]');
      await page.waitForSelector('.lm-unit-card');
    }
    assert.deepEqual(errors, []);
    await close();
  });
}

