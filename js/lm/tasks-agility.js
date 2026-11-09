// Agilidad de notas: aparece una nota en el pentagrama y hay que nombrarla antes de que se acabe su tiempo.
// Fácil («nombrar»): un tiempo fijo por nota. Media («leer-a-tempo»): las notas llegan a tempo y el tempo sube.
// Se guarda el récord de aciertos de cada ejercicio.
import { esc } from '../ui.js';
import { rng } from '../generate.js';
import { gradeAgility, mistakeCodes } from './grade.js';
import { stepOf, positionText, letterText, barBeatsOf, LETTERS, keyAcc, midiOf } from './notes.js';
import { noteCell, clefCell } from './staff-lm.js';
import { nameButtons, nameText, namesFor, CLEF, GLYPH } from './kit.js';
import { wait, clicks, now, stopSound } from './sound.js';

const LEAD_IN_S = 0.6;
import { recordOf, saveRecord } from './results.js';

const FEEDBACK_MS = 450;
const TICK_MS = 50;
const BEATS_PER_NOTE = 2; // a tempo: una nota cada dos pulsos

// Plan del ejercicio: cuántas notas, cuánto tiempo para cada una y qué nota sale (sin repetir la anterior)
// Serie de notas al azar que no se puede adivinar sin leer: con muchas notas, nunca la misma dos veces seguidas; con
// dos o tres, se permite repetir (como mucho dos seguidas) y la serie se rehace si alternar o repetir siempre la misma
// nota, o decir «la misma que antes» o «la contraria de antes», acertaría el 60 % o más (con la bolsa sol/mi,
// «sol, mi, sol, mi…» ya no aprueba). Con pocas notas, al menos 16 por serie, y la nota se corrige por el azar.
const MAX_RUN = 2;
const GUESS_LIMIT = 0.6;
const MAX_TRIES = 200;
const SMALL_POOL = 3;
export const MIN_SMALL_NOTES = 16;
export function guessable(notes, pool) {
  const share = f => notes.filter((n, i) => n === f(i)).length / notes.length;
  const guesses = [...pool.map(n => () => n), ...pool.flatMap(a => pool.filter(b => b !== a).map(b => i => (i % 2 ? b : a)))];
  if (guesses.some(g => share(g) >= GUESS_LIMIT)) return true;
  // la misma que la anterior / otra distinta de la anterior (al azar entre las demás)
  const moves = notes.slice(1).map((n, i) => n === notes[i]);
  const same = moves.filter(Boolean).length / Math.max(1, moves.length);
  const other = (1 - same) / Math.max(1, pool.length - 1);
  return same >= GUESS_LIMIT || other >= GUESS_LIMIT;
}
// Nota sobre 100 descontado el azar: con k botones, contestar a ciegas acierta 1 de cada k y debe dar 0
export function chanceCorrected(pct, k) {
  if (k < 2) return pct;
  const p = pct / 100;
  return Math.max(0, Math.round(100 * (p - 1 / k) / (1 - 1 / k)));
}
export function noteSeries(pool, count, r) {
  const small = pool.length <= SMALL_POOL;
  let notes = [];
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    notes = [];
    for (let i = 0; i < count; i++) {
      const run = i >= MAX_RUN && notes.slice(-MAX_RUN).every(n => n === notes[i - 1]);
      const options = pool.length > 1 && (!small || run) ? pool.filter(n => n !== notes[i - 1]) : pool;
      notes.push(options[Math.floor(r() * options.length)]);
    }
    if (pool.length < 2 || !guessable(notes, pool)) break;
  }
  return notes;
}

// Una serie con las dos claves: cada nota sale en una clave al azar, sin rachas de más de MAX_CLEF_RUN en la misma. Cada
// elemento es «clave:nota» («sol:C5», «fa:G2»): la clave va con la nota, y la misma nota puede salir en las dos (do4)
const MAX_CLEF_RUN = 3;
export function mixedSeries(pools, count, r) {
  const out = [];
  let run = 0;
  let last = null;
  for (let i = 0; i < count; i++) {
    let clef = r() < 0.5 ? 'sol' : 'fa';
    if (clef === last && run >= MAX_CLEF_RUN) clef = clef === 'sol' ? 'fa' : 'sol';
    run = clef === last ? run + 1 : 1;
    last = clef;
    const options = pools[clef].filter(n => `${clef}:${n}` !== out[i - 1]);
    out.push(`${clef}:${options[Math.floor(r() * options.length)]}`);
  }
  return out;
}

// Dos notas seguidas para contar su intervalo: { a, b, number } con notas naturales de la bolsa y los números pedidos
export function intervalSeries(pool, numbers, count, r) {
  const steps = [...new Set(pool)].sort((x, y) => stepOf(x) - stepOf(y));
  const has = n => steps.find(x => stepOf(x) === n);
  const out = [];
  for (let i = 0; i < count; i++) {
    let item = null;
    for (let tries = 0; tries < 60 && !item; tries++) {
      const number = numbers[(i + Math.floor(r() * 2)) % numbers.length];
      const a = steps[Math.floor(r() * steps.length)];
      const up = r() < 0.5;
      const b = has(stepOf(a) + (up ? 1 : -1) * (number - 1));
      if (b && JSON.stringify([a, b]) !== JSON.stringify(out[i - 1] && [out[i - 1].a, out[i - 1].b])) item = { a, b, number };
    }
    out.push(item || { a: steps[0], b: has(stepOf(steps[0]) + numbers[0] - 1) || steps[1], number: numbers[0] });
  }
  return out;
}

const isMixed = p => p.clave === 'mixta' || p.clave === 'gran';
// Las bolsas de notas por clave: un objeto { sol, fa } o, en el repaso, una lista de las dos (sol: do4 o más; fa: do4 o menos)
export function poolsOf(p) {
  if (!isMixed(p)) return null;
  if (!Array.isArray(p.notas)) return { sol: p.notas.sol, fa: p.notas.fa };
  const c4 = stepOf('C4');
  return { sol: p.notas.filter(n => stepOf(n) >= c4), fa: p.notas.filter(n => stepOf(n) <= c4) };
}

export function agilityPlan(p, seed) {
  const r = rng(seed);
  const pools = poolsOf(p);
  const pool = pools ? [...pools.sol, ...pools.fa] : p.notas;
  const small = pool.length <= SMALL_POOL;
  let count = p.cantidad;
  let secs;
  if (p.modo === 'leer-a-tempo') {
    const [lo, hi] = Array.isArray(p.tempo) ? p.tempo : [p.tempo || 80, p.tempo || 80];
    count = Math.max(small ? MIN_SMALL_NOTES : 4, Math.round((p.compases || 4) * barBeatsOf(p.compas || '4/4') / BEATS_PER_NOTE));
    secs = Array.from({ length: count }, (_, i) => (60 / (lo + (hi - lo) * (count > 1 ? i / (count - 1) : 0))) * BEATS_PER_NOTE);
  } else secs = Array(Math.max(count || 12, small ? MIN_SMALL_NOTES : 0)).fill(p.segundosPorNota || 3);
  if (p.modo === 'intervalo') return { notes: intervalSeries(pool, p.intervalos || [2, 3, 4, 5], secs.length, r), secs, intervals: true };
  if (pools) return { notes: mixedSeries(pools, secs.length, r), secs, mixed: true };
  return { notes: noteSeries(pool, secs.length, r), secs };
}
// La respuesta de una nota: su nombre con alteración y sin octava («C», «Bb», «F#»)
export const answerOf = name => name.replace(/[0-9]$/, '');

// Botones de respuesta de la agilidad: las siete notas (con la armadura, el si de un bemol es si♭); en Fácil, solo las
// de la unidad. En el modo «intervalo», los números de intervalo (2.ª … 8.ª).
export function answerButtons(p, variant, nom) {
  if (p.modo === 'intervalo') {
    const numbers = p.intervalos || [2, 3, 4, 5];
    return `<div class="lm-names lm-numbers" role="group" aria-label="Intervalos">${numbers.map(n => `<button type="button" class="lm-name" data-name="${n}">${n}.ª</button>`).join('')}</div>`;
  }
  const pools = poolsOf(p);
  const all = pools ? [...pools.sol, ...pools.fa] : p.notas;
  const arm = p.armadura || 0;
  const names = namesFor(arm);
  // Fácil: solo los nombres de las notas de la unidad (al empezar son dos o tres); Media: los siete
  const shown = variant === 'facil' ? names.filter(n => all.some(x => answerOf(x) === n)) : names;
  return nameButtons(shown, nom);
}

// Una nota (o dos, en el intervalo) en su clave: el escenario de la pregunta. «gran»: gran pentagrama con las dos claves
function stageHtml(item, plan, p, arm) {
  const wide = 56;
  if (plan.intervals) {
    const clef = CLEF[p.clave] || 'treble';
    return `<span class="lm-sc" aria-hidden="true">${clefCell(clef, null, arm)}</span><span class="lm-ag-note" id="lmAgNote" role="img">${noteCell({ step: stepOf(item.a), dur: 'w', clef, w: wide })}${noteCell({ step: stepOf(item.b), dur: 'w', clef, w: wide })}</span>`;
  }
  if (plan.mixed && p.clave === 'gran') {
    const [clefName, name] = item.split(':');
    const clef = clefName === 'fa' ? 'bass' : 'treble';
    const row = c => `<span class="lm-ag-row"><span class="lm-sc" aria-hidden="true">${clefCell(c, null, arm)}</span><span class="lm-sc">${noteCell(c === clef ? { step: stepOf(name), dur: 'w', clef: c, w: wide } : { step: null, clef: c, w: wide })}</span></span>`;
    return `<span class="lm-ag-grand" id="lmAgNote" role="img">${row('treble')}${row('bass')}</span>`;
  }
  const [clefName, name] = plan.mixed ? item.split(':') : [p.clave, item];
  const clef = CLEF[clefName] || 'treble';
  return `<span class="lm-sc" aria-hidden="true">${clefCell(clef, null, arm)}</span><span class="lm-ag-note" id="lmAgNote" role="img">${noteCell({ step: stepOf(name), dur: 'w', clef, w: wide })}</span>`;
}

export async function agilityTask(host, p, env) {
  const plan = agilityPlan(p, (env.attempt ?? env.seed) >>> 0); // otra serie en cada intento: no se aprende de memoria
  const arm = p.armadura || 0;
  const key = `agil:${env.id}`;
  const best = recordOf(key);
  const buttons = answerButtons(p, env.variant, env.nom);
  const count = (buttons.match(/data-name/g) || []).length;
  const intro = plan.intervals ? 'Dos notas seguidas: ¿qué intervalo forman? Cuéntalo antes de que se acabe la barra de tiempo.'
    : p.modo === 'leer-a-tempo' ? 'Las notas llegan con el metrónomo, cada vez más deprisa: nómbralas antes de la siguiente.' : 'Nombra cada nota antes de que se acabe la barra de tiempo.';
  host.innerHTML = `<p class="muted">${intro}</p>${arm ? `<p class="lm-notice">${arm < 0 ? 'Armadura de un bemol: el si es si♭.' : 'Armadura de un sostenido: el fa es fa♯.'}</p>` : ''}${plan.mixed ? `<p class="lm-notice">${p.clave === 'gran' ? 'Gran pentagrama: la nota puede estar arriba (clave de sol) o abajo (clave de fa).' : 'Cada nota puede salir en clave de sol o en clave de fa: mira la clave.'}</p>` : ''}
    <p class="muted small">${best ? `<span>Tu récord:</span> <b>${best}</b>` : ''}</p>
    <div class="controls"><button type="button" class="btn big" id="lmAgGo">Empezar</button></div>`;
  host.querySelector('#lmAgGo').focus();
  await new Promise(r => host.querySelector('#lmAgGo').addEventListener('click', r, { once: true }));
  host.innerHTML = `<div class="lm-ag-top"><span id="lmAgCount">1 / ${plan.notes.length}</span><span><span>Aciertos:</span> <b id="lmAgRight">0</b></span></div>
    <div class="lm-ag-stage" id="lmAgStage"></div>
    <div class="lm-ag-time" aria-hidden="true"><i id="lmAgBar"></i></div>
    ${buttons}
    <p id="lmAgFeedback" class="lm-ag-feedback" aria-live="polite"></p>`;
  let right = 0;
  const misses = [];
  // a tempo: un pulso continuo (dos clics por nota, cada vez más deprisa) programado de una vez; cada nota dura su
  // hueco aunque se conteste antes, para no perder el pulso
  const tempo = p.modo === 'leer-a-tempo';
  const slots = plan.secs.reduce((acc, s) => [...acc, (acc.length ? acc[acc.length - 1] : 0) + s], []).map((end, i) => end - plan.secs[i]);
  const t0 = tempo ? now() + LEAD_IN_S : 0;
  if (tempo) plan.secs.forEach((s, i) => clicks(2, 120 / s, { at: t0 + slots[i], accentEvery: 2, level: 0.45 }));
  if (tempo) await wait((t0 - now()) * 1000);
  for (let i = 0; i < plan.notes.length; i++) {
    if (!env.alive()) { stopSound(); return null; }
    const item = plan.notes[i];
    // lo que hay que contestar (nombre con alteración, o el número del intervalo) y cómo se llama la nota para el alumno
    const mixed = plan.mixed ? item.split(':') : null;
    const name = plan.intervals ? item.a : mixed ? mixed[1] : item;
    const correct = plan.intervals ? String(item.number) : answerOf(name);
    const clefName = plan.intervals ? p.clave : mixed ? mixed[0] : p.clave;
    host.querySelector('#lmAgStage').innerHTML = stageHtml(item, plan, p, arm);
    const noteBox = host.querySelector('#lmAgNote');
    noteBox.dataset.step = String(stepOf(name));
    noteBox.dataset.name = name;
    noteBox.dataset.answer = correct;
    noteBox.dataset.clef = clefName;
    noteBox.setAttribute('aria-label', plan.intervals ? `Intervalo ${i + 1}: ${positionText(stepOf(item.a), CLEF[p.clave] || 'treble')} y ${positionText(stepOf(item.b), CLEF[p.clave] || 'treble')}` : `Nota ${i + 1}: ${positionText(stepOf(name), CLEF[clefName] || 'treble')}${mixed ? `, en clave de ${clefName === 'fa' ? 'fa' : 'sol'}` : ''}`);
    host.querySelector('#lmAgCount').textContent = `${i + 1} / ${plan.notes.length}`;
    if (i === 0) host.querySelector('[data-name]').focus();
    const limit = tempo ? Math.max(0, (t0 + slots[i] + plan.secs[i] - now()) * 1000) : plan.secs[i] * 1000;
    const started = performance.now();
    const bar = host.querySelector('#lmAgBar');
    const answer = await new Promise(resolve => {
      const timer = setInterval(() => {
        const t = performance.now() - started;
        bar.style.width = `${Math.max(0, 100 - 100 * t / limit)}%`;
        if (t >= limit || !env.alive()) { clearInterval(timer); host.removeEventListener('click', onPick); resolve(null); }
      }, TICK_MS);
      const onPick = e => {
        const b = e.target.closest('[data-name]');
        if (!b) return;
        clearInterval(timer);
        host.removeEventListener('click', onPick);
        resolve(b.dataset.name);
      };
      host.addEventListener('click', onPick);
    });
    const ok = answer === correct;
    if (ok) right++;
    else if (plan.intervals) misses.push(answer ? `${correct}>${answer}` : `${correct}-t`);
    else misses.push(answer ? `${name}>${answer}` : `${name}-t`);
    host.querySelector('#lmAgRight').textContent = String(right);
    const fb = host.querySelector('#lmAgFeedback');
    fb.className = `lm-ag-feedback ${ok ? 'ok' : 'bad'}`;
    const shown = plan.intervals ? `${correct}.ª` : nameText(correct, env.nom);
    fb.innerHTML = `<span class="dict-sw ${ok ? 'ok' : 'bad'}" aria-hidden="true">${GLYPH[ok ? 'ok' : 'bad']}</span> <span>${ok ? '¡Bien!' : answer ? 'Era' : 'Tiempo. Era'}</span>${ok ? '' : ` <b>${esc(shown)}</b>`}`;
    // a tempo, la nota siguiente llega en su pulso; si no, tras un momento para ver la corrección
    await wait(tempo ? (t0 + slots[i] + plan.secs[i] - now()) * 1000 : FEEDBACK_MS);
  }
  // contrato: aciertos sobre el total (los tiempos agotados cuentan como fallo, sin restar más), descontado el azar
  const g = gradeAgility(right, 0, plan.notes.length);
  const pct = chanceCorrected(g.pct, count);
  const record = saveRecord(key, right);
  host.querySelector('#lmAgFeedback').innerHTML = record ? '<b>¡Nuevo récord!</b>' : '';
  return { pct, right, total: plan.notes.length, record, mistakes: mistakeCodes(misses) };
}
