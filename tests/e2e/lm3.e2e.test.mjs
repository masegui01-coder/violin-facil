// Curso de Lenguaje Musical · Nivel 3 sobre la versión compilada (Chrome real): cada ejercicio se abre en Fácil y Media sin
// errores, y varios se completan de punta a punta: un ritmo en 9/8, una lectura con D.S. al Coda, una serie de preguntas de
// intervalos con especie, un dictado en una tonalidad de dos bemoles, la agilidad nueva (armadura e intervalos con especie),
// y la teoría y la audición de las 8 unidades. El Nivel 3 está abierto como el 2 (beta).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openApp, DESKTOP, tap } from './helpers.mjs';
import { lmExercise, LM_LEVELS } from '../../js/lm/catalog.js';
import { scoreTokens, solfaToName, keyAcc, accOfName } from '../../js/lm/notes.js';
import { readingTimeline } from '../../js/lm/rhythm-plan.js';
import { keySignatureSteps, yOf, CELL_H } from '../../js/lm/staff-lm.js';
import { intervalRounds } from '../../js/lm/tasks-staff.js';
import { seedOf } from '../../js/lm/kit.js';

const STEP_TIMEOUT = 8000;
const LEVEL = LM_LEVELS[2];
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
  await page.waitForSelector(`.lm-unit-card[data-level="3"][data-unit="${unit}"]`, { timeout: STEP_TIMEOUT });
  await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: STEP_TIMEOUT });
  await page.$eval(`.lm-unit-card[data-level="3"][data-unit="${unit}"]`, b => b.click());
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

test('el Nivel 3 está en la vista Lenguaje, abierto y con sus 8 unidades', async () => {
  const { page, errors, close } = await openLm();
  assert.equal(await page.$$eval('.lm-unit-card[data-level="3"]', b => b.length), 8);
  assert.equal(await page.$$eval('.lm-level.soon', b => b.length), 0, 'el Nivel 4 ya está abierto: ningún nivel es «próximamente»');
  await openUnit(page, 6);
  assert.match(await page.$eval('#lmUnitTitle', h => h.textContent), /\S/);
  assert.deepEqual(errors, []);
  await close();
});

test('los 204 ejercicios del Nivel 3 se abren en Fácil y Media sin errores', async () => {
  const { page, errors, close } = await openLm();
  let opened = 0;
  for (let u = 1; u <= 8; u++) {
    await openUnit(page, u);
    for (const e of LEVEL.units[u - 1].exercises) {
      if (process.env.LM3_TRACE) process.stderr.write(`${e.id}\n`);
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
  assert.equal(opened, LEVEL.units.flatMap(u => u.exercises).length);
  assert.equal(opened, 204);
  assert.deepEqual(errors, []);
  await close();
});

// Dictado rítmico completo: se escribe la partitura del catálogo y se espera el 100 %
async function rhythmDictation(unit, id) {
  const ex = lmExercise(id);
  const { page, errors, close } = await openLm();
  await openUnit(page, unit);
  await openExercise(page, id);
  await click(page, '#lmDictPlay');
  assert.match(await page.$eval('.lm-w-staff', b => b.innerHTML), /lm-time/);
  await writeNotes(page, scoreTokens(ex.params.partitura).map(t => ({ ...t, step: 36 })));
  await click(page, '[data-check]');
  await page.waitForSelector('.lm-feedback .lm-staff', { timeout: STEP_TIMEOUT });
  await next(page);
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  assert.equal((await lmState(page)).best[id].pct, 100);
  assert.deepEqual(errors, []);
  await close();
}
test('9/8 de punta a punta: dictado rítmico (negras con puntillo, corcheas, blancas con puntillo), 100 %', async () => {
  assert.equal(lmExercise('lm3-u6-dictado-a-facil').params.compas, '9/8');
  await rhythmDictation(6, 'lm3-u6-dictado-a-facil');
});
test('9/8 con silencios y semicorcheas, de punta a punta: el dictado medio, 100 %', async () => {
  await rhythmDictation(6, 'lm3-u6-dictado-a-medio');
});
test('3/8 con silencio de semicorchea, de punta a punta: el dictado medio, 100 %', async () => {
  assert.match(lmExercise('lm3-u1-dictado-a-medio').params.partitura, /Rs/);
  await rhythmDictation(1, 'lm3-u1-dictado-a-medio');
});

test('dictado con dos bemoles en la armadura (si♭ mayor), de punta a punta, 100 %', async () => {
  const id = 'lm3-u5-dictado-b-facil';
  const ex = lmExercise(id);
  assert.equal(ex.params.armadura, -2);
  const { page, errors, close } = await openLm();
  await openUnit(page, 5);
  await openExercise(page, id);
  await page.waitForSelector('.lm-w-staff .lm-clefcell', { timeout: STEP_TIMEOUT });
  assert.equal(await page.$eval('.lm-w-staff .lm-clefcell', el => (el.innerHTML.match(/♭/g) || []).length), 2, 'la armadura de dos bemoles está dibujada');
  assert.ok(await page.$('[data-acc="n"]'), 'la paleta lleva el becuadro');
  await click(page, '#lmDictPlay');
  // si♭ y mi♭ ya vienen en la armadura: no hace falta tocar la paleta
  await writeNotes(page, scoreTokens(ex.params.partitura).map(t => ({ ...t, acc: accFor(t.name, -2) })));
  await click(page, '[data-check]');
  await page.waitForSelector('.lm-feedback .lm-staff', { timeout: STEP_TIMEOUT });
  await next(page);
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  assert.equal((await lmState(page)).best[id].pct, 100);
  assert.deepEqual(errors, []);
  await close();
});

test('dictado de intervalos con especie (U4 Fácil): la 3.ª mayor o menor se escribe con su alteración, 100 %', async () => {
  const id = 'lm3-u4-dictado-c-facil';
  const ex = lmExercise(id);
  const rounds = intervalRounds(ex.params, seedOf(id));
  assert.ok(rounds.some(r => /[#b]/.test(r.to)), 'alguna ronda lleva alteración');
  const { page, errors, close } = await openLm();
  await openUnit(page, 4);
  await openExercise(page, id);
  for (let k = 0; k < rounds.length; k++) {
    await page.waitForSelector('#lmIntPlay', { timeout: STEP_TIMEOUT });
    await writeNotes(page, notesOf([rounds[k].to]));
    await click(page, '[data-check]');
    await page.waitForSelector('.lm-feedback .lm-why', { timeout: STEP_TIMEOUT });
    await next(page);
  }
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
  assert.equal((await lmState(page)).best[id].pct, 100);
  assert.deepEqual(errors, []);
  await close();
});

test('teoría con intervalos con especie (U4 Media): clasificar número y especie, escala y 3.ª, 100 %', async () => {
  const { page, errors, close } = await openLm();
  await openUnit(page, 4);
  assert.ok(lmExercise('lm3-u4-teoria-a-medio').params.items.some(i => i.tipo === 'clasificarIntervalo'));
  const r = await doTheory(page, 'lm3-u4-teoria-a-medio');
  assert.ok(r && r.pct >= 90, `${r && r.pct} %`);
  assert.deepEqual(errors, []);
  await close();
});

// Agilidad: se lee la nota que se enseña y se pulsa su botón (en uno o dos pasos: número y especie, mayor y relativa)
async function playAgility(page, id) {
  await openExercise(page, id);
  await click(page, '#lmAgGo');
  const total = await page.$eval('#lmAgCount', el => Number(el.textContent.split('/')[1]));
  for (let i = 0; i < total; i++) {
    await page.waitForFunction(n => document.getElementById('lmAgCount')?.textContent.startsWith(`${n} /`), { timeout: STEP_TIMEOUT }, i + 1);
    await page.waitForSelector('#lmAgNote[data-answer]', { timeout: STEP_TIMEOUT });
    const ans = (await page.$eval('#lmAgNote', el => el.dataset.answer)).split('|');
    await click(page, `[data-name="${ans[0]}"]`);
    if (ans[1] !== undefined) await click(page, (await page.$('[data-esp]')) ? `[data-esp="${ans[1]}"]` : `[data-minor="${ans[1]}"]`);
  }
  await page.waitForSelector('#lmScores', { timeout: STEP_TIMEOUT });
}
for (const id of ['lm3-u2-agilidad-a-facil', 'lm3-u4-agilidad-a-medio', 'lm3-u7-agilidad-a-facil', 'lm3-u8-agilidad-a-medio', 'lm3-u5-agilidad-a-facil']) {
  test(`agilidad ${id}: sostenidos, intervalos con especie y armadura → tonalidad`, async () => {
    const { page, errors, close } = await openLm();
    await openUnit(page, Number(/u(\d)/.exec(id)[1]));
    await playAgility(page, id);
    assert.equal((await lmState(page)).best[id].pct, 100, id);
    assert.deepEqual(errors, []);
    await close();
  });
}

// Teoría y audición de las 8 unidades en Fácil y Media: se completan y registran su resultado
for (const section of ['teoria', 'audicion']) {
  test(`${section}: las 8 unidades del Nivel 3 en Fácil y Media se completan y registran su resultado`, async () => {
    const { page, errors, close } = await openLm();
    for (let u = 1; u <= 8; u++) {
      await openUnit(page, u);
      for (const v of ['facil', 'medio']) {
        const id = `lm3-u${u}-${section}-a-${v}`;
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

// Toca la pantalla en los instantes dados (en pulsos desde la primera nota) y devuelve la nota guardada
const NO_MIC = () => { navigator.mediaDevices.getUserMedia = async () => { throw Object.assign(new Error('no'), { name: 'NotAllowedError' }); }; };
async function tapReading(page, id, beats, before = null) {
  const ex = lmExercise(id);
  await openExercise(page, id);
  if (before) await before();
  await click(page, '#lmDuoTap');
  await page.waitForFunction(() => document.getElementById('lmBody').dataset.readingStart, { timeout: STEP_TIMEOUT });
  const start = Number(await page.$eval('#lmBody', el => el.dataset.readingStart));
  const spb = 60 / ex.params.tempo;
  for (const beat of beats) {
    await page.evaluate(when => new Promise(res => setTimeout(() => {
      document.getElementById('lmTap').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      res();
    }, Math.max(0, when - performance.now()))), start + beat * spb * 1000);
  }
  await page.waitForSelector('#lmScores', { timeout: 40000 });
  return (await lmState(page)).last[id];
}

test('lectura con D.S. al Coda de punta a punta: compases 1-8, vuelta al signo (5-6) y salto a la Coda (9-10), con los signos dibujados', async () => {
  const id = 'lm3-u8-ritmo-a-medio';
  const ex = lmExercise(id);
  assert.deepEqual(ex.params.ds && [ex.params.ds.segno, ex.params.ds.alCoda, ex.params.ds.coda], [5, 6, 9]);
  const { page, errors, close } = await openLm({ init: NO_MIC });
  await openUnit(page, 8);
  const tl = readingTimeline(ex.params, scoreTokens(ex.params.partitura));
  assert.equal(tl.passes, 3);
  const beats = tl.events.filter(e => !e.rest && !e.cont).map(e => e.beat);
  const r = await tapReading(page, id, beats, async () => {
    await page.waitForSelector('.lm-staff .lm-dsmark', { timeout: STEP_TIMEOUT });
    assert.deepEqual(await page.$$eval('.lm-dsmark', g => g.map(x => { const t = c => { const e = x.querySelector(':scope > ' + c); return e ? (e.querySelector('[aria-label]')?.getAttribute('aria-label') || e.textContent.trim()) : ''; }; return `${t('.lm-ds-l')}|${t('.lm-ds-r')}`; })), ['Signo|', '|al Coda', '|D.S. al Coda', 'Coda|']);
  });
  assert.ok(r && r.pct >= 80, `la lectura con D.S. bien tocada: ${r && r.pct} %`);
  assert.deepEqual(errors, []);
  await close();
});

test('la canción con melismas y ligaduras de expresión, la de dos voces y la del D.S. dibujan sus signos', async () => {
  const { page, errors, close } = await openLm();
  await openUnit(page, 2);
  await openExercise(page, 'lm3-u2-cancion-a-facil');
  await page.waitForSelector('.lm-sing-staff .lm-slur', { timeout: STEP_TIMEOUT });
  assert.ok(await page.$$eval('.lm-slur', s => s.length) >= 3, 'las curvas de las ligaduras de expresión');
  assert.ok(await page.$$eval('.lm-under.lm-melisma', s => s.length) >= 2, 'la línea de los melismas');
  await backToUnit(page);
  await click(page, '[data-lm-back]');
  await openUnit(page, 8);
  await openExercise(page, 'lm3-u8-cancion-a-facil');
  await page.waitForSelector('.lm-sing-staff .lm-staff', { timeout: STEP_TIMEOUT });
  await page.waitForSelector('.lm-partner .lm-staff', { timeout: STEP_TIMEOUT }); // la 2.ª voz está a la vista
  assert.ok(await page.$('#lmSongPhones'), 'la casilla de los auriculares');
  assert.equal(await page.$$eval('.lm-sing-staff .lm-dsmark', g => g.length), 4);
  await backToUnit(page);
  await openExercise(page, 'lm3-u8-entonacion-b-medio');
  await page.waitForSelector('#lmSingBoth', { timeout: STEP_TIMEOUT }); // la voz 1 de la app, para oírla junto a la tuya
  assert.deepEqual(errors, []);
  await close();
});

test('el silencio de semicorchea y el 3/8 se dibujan en la lectura de la unidad 1', async () => {
  const { page, errors, close } = await openLm();
  await openUnit(page, 1);
  await openExercise(page, 'lm3-u1-ritmo-a-medio');
  await page.waitForSelector('.lm-staff .lm-rest', { timeout: STEP_TIMEOUT });
  assert.ok(await page.$$eval('.lm-staff .lm-rest', r => r.length) >= 1);
  assert.match(await page.$eval('.lm-clefcell', c => c.innerHTML), /lm-time/);
  assert.deepEqual(errors, []);
  await close();
});
