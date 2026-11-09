// Curso de Lenguaje Musical · Nivel 2 sobre la versión compilada (Chrome real): cada ejercicio se abre en Fácil y Media sin
// errores, y varios se completan de punta a punta: uno en 6/8, uno con armadura, la agilidad en clave de fa y con si♭,
// y la teoría y la audición de las 8 unidades (con ♯ ♭ ♮, intervalos, casillas y D.C.). El Nivel 2 está abierto (beta).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openApp, DESKTOP, tap, sleep } from './helpers.mjs';
import { lmExercise, LM_LEVELS } from '../../js/lm/catalog.js';
import { scoreTokens, solfaToName } from '../../js/lm/notes.js';

const STEP_TIMEOUT = 8000;
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
  await page.waitForSelector(`.lm-unit-card[data-level="2"][data-unit="${unit}"]`, { timeout: STEP_TIMEOUT });
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: STEP_TIMEOUT });
  await page.$eval(`.lm-unit-card[data-level="2"][data-unit="${unit}"]`, b => b.click());
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
const accOf = name => (/^[A-G]#/.test(name) ? '#' : /^[A-G]b/.test(name) ? 'b' : null);

// Responde bien una pregunta de teoría según su tipo (las respuestas salen del catálogo)
async function answer(page, item) {
  await page.waitForSelector('.lm-item .lm-q', { timeout: STEP_TIMEOUT });
  if (['tocarPentagrama', 'escala'].includes(item.tipo)) {
    await writeNotes(page, item.respuesta.map(n => ({ step: scoreTokens(`| ${n}w |`)[0].step, dur: 'w', acc: accOf(n) })));
    await click(page, '[data-check]');
  } else if (item.tipo === 'nombrarNotas') {
    for (const n of item.respuesta) await click(page, `[data-name="${solfaToName(n)}"]`);
  } else if (item.tipo === 'ordenar') {
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
  } else {
    await page.waitForSelector('.lm-item [data-opt]', { timeout: STEP_TIMEOUT });
    await page.$$eval('.lm-item [data-opt]', (bs, w) => bs.find(b => b.textContent.trim() === w).click(), item.options[item.answer]);
  }
  await page.waitForSelector('.lm-feedback .lm-why', { timeout: STEP_TIMEOUT });
}

test('el Nivel 2 está en la vista Lenguaje, abierto y con sus 8 unidades', async () => {
  const { page, errors, close } = await openLm();
  assert.equal(await page.$$eval('.lm-unit-card[data-level="2"]', b => b.length), 8);
  assert.equal(await page.$$eval('.lm-level.soon', b => b.length), 1, 'solo el nivel 4 es «próximamente»');
  await openUnit(page, 4);
  assert.match(await page.$eval('#lmUnitTitle', h => h.textContent), /\S/);
  assert.deepEqual(errors, []);
  await close();
});

test('los 199 ejercicios del Nivel 2 se abren en Fácil y Media sin errores', async () => {
  const { page, errors, close } = await openLm();
  let opened = 0;
  for (let u = 1; u <= 8; u++) {
    await openUnit(page, u);
    for (const e of LM_LEVELS[1].units[u - 1].exercises) {
      if (process.env.LM2_TRACE) process.stderr.write(`${e.id}
`);
      await openExercise(page, e.id);
      await page.waitForFunction(() => {
        const b = document.getElementById('lmBody');
        return b && (b.dataset.error || b.children.length > 0);
      }, { timeout: STEP_TIMEOUT });
      const bad = await page.$eval('#lmBody', b => b.dataset.error || (/No se ha podido hacer|todavía no está/.test(b.textContent) ? b.textContent.slice(0, 120) : ''));
      assert.equal(bad, '', `${e.id}: ${bad}`);
      opened++;
      await backToUnit(page);
    }
    await click(page, '[data-lm-back]');
    await page.waitForSelector('.lm-unit-card');
  }
  assert.equal(opened, LM_LEVELS[1].units.flatMap(u => u.exercises).length);
  assert.ok(opened >= 190, `${opened} ejercicios`);
  assert.deepEqual(errors, []);
  await close();
});

test('6/8 de punta a punta: dictado rítmico con negra con puntillo y silencios, 100 %', async () => {
  const id = 'lm2-u4-dictado-a-medio';
  const ex = lmExercise(id);
  assert.equal(ex.params.compas, '6/8');
  const { page, errors, close } = await openLm();
  await openUnit(page, 4);
  await openExercise(page, id);
  await click(page, '#lmDictPlay');
  const want = scoreTokens(ex.params.partitura);
  await writeNotes(page, want.map(t => ({ ...t, step: 36 })));
  await click(page, '[data-check]');
  await page.waitForSelector('.lm-feedback .lm-staff', { timeout: STEP_TIMEOUT });
  await next(page);
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  assert.equal((await lmState(page)).best[id].pct, 100);
  assert.deepEqual(errors, []);
  await close();
});

test('armadura de un bemol de punta a punta: dictado en fa mayor con el si♭ de la armadura, 100 %', async () => {
  const id = 'lm2-u6-dictado-b-facil';
  const ex = lmExercise(id);
  const { page, errors, close } = await openLm();
  await openUnit(page, 6);
  await openExercise(page, id);
  await page.waitForSelector('.lm-w-staff .lm-clefcell', { timeout: STEP_TIMEOUT });
  assert.match(await page.$eval('.lm-w-staff', b => b.innerHTML), /♭/, 'la armadura está dibujada');
  assert.ok(await page.$('[data-acc="b"]'), 'paleta de alteraciones');
  await click(page, '#lmDictPlay');
  // «si» escrito con un bemol en la armadura ya es si♭: no hace falta tocar la paleta
  await writeNotes(page, scoreTokens(ex.params.partitura).map(t => ({ ...t, acc: null })));
  await click(page, '[data-check]');
  await page.waitForSelector('.lm-feedback .lm-staff', { timeout: STEP_TIMEOUT });
  await next(page);
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  assert.equal((await lmState(page)).best[id].pct, 100);
  assert.deepEqual(errors, []);
  await close();
});

// Agilidad: se lee la nota que se enseña y se pulsa su botón (clave de fa, mixta, con si♭, intervalos)
async function playAgility(page, id) {
  const p = lmExercise(id).params;
  await openExercise(page, id);
  await click(page, '#lmAgGo');
  const total = await page.$eval('#lmAgCount', el => Number(el.textContent.split('/')[1]));
  for (let i = 0; i < total; i++) {
    await page.waitForFunction(n => document.getElementById('lmAgCount')?.textContent.startsWith(`${n} /`), { timeout: STEP_TIMEOUT }, i + 1);
    await page.waitForSelector('#lmAgNote[data-answer]', { timeout: STEP_TIMEOUT });
    const ans = await page.$eval('#lmAgNote', el => el.dataset.answer);
    await click(page, `[data-name="${ans}"]`);
  }
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  return p;
}
for (const id of ['lm2-u3-agilidad-a-facil', 'lm2-u4-agilidad-a-medio', 'lm2-u5-agilidad-a-medio', 'lm2-u6-agilidad-a-facil']) {
  test(`agilidad ${id}: se lee la clave y se contesta (fa, mixta, intervalos, si♭)`, async () => {
    const { page, errors, close } = await openLm();
    const unit = Number(/u(\d)/.exec(id)[1]);
    await openUnit(page, unit);
    if (/u6/.test(id)) assert.ok(true);
    await playAgility(page, id);
    assert.equal((await lmState(page)).best[id].pct, 100, id);
    assert.deepEqual(errors, []);
    await close();
  });
}

// Teoría y audición de las 8 unidades en Fácil y Media: se completan y registran su resultado
for (const section of ['teoria', 'audicion']) {
  test(`${section}: las 8 unidades del Nivel 2 en Fácil y Media se completan y registran su resultado`, async () => {
    const { page, errors, close } = await openLm();
    for (let u = 1; u <= 8; u++) {
      await openUnit(page, u);
      for (const v of ['facil', 'medio']) {
        const id = `lm2-u${u}-${section}-a-${v}`;
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
          assert.ok(r && r.pct >= 60, `${id}: ${r && r.pct} %`);
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

test('la canción con casillas y la lectura con D.C. dibujan sus signos (|:, 1., 2., Fine, D.C. al Fine)', async () => {
  const { page, errors, close } = await openLm();
  await openUnit(page, 2);
  await openExercise(page, 'lm2-u2-cancion-a-facil');
  await page.waitForSelector('.lm-sing-staff .lm-staff', { timeout: STEP_TIMEOUT });
  assert.equal(await page.$$eval('.lm-bargroup.lm-volta', g => g.length), 4, 'casilla 1 (2 compases) y casilla 2 (2 compases)');
  assert.deepEqual(await page.$$eval('.lm-bargroup.lm-volta-open', g => g.map(x => x.dataset.volta)), ['1.', '2.']);
  await backToUnit(page);
  await click(page, '[data-lm-back]');
  await openUnit(page, 8);
  await openExercise(page, 'lm2-u8-ritmo-a-medio');
  await page.waitForSelector('.lm-staff .lm-fine', { timeout: STEP_TIMEOUT });
  assert.match(await page.$eval('#lmBody', b => b.textContent), /D\.C\. al Fine/);
  assert.deepEqual(errors, []);
  await close();
});
