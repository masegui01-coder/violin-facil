// Agilidad de notas: aparece una nota en el pentagrama y hay que nombrarla antes de que se acabe su tiempo.
// Fácil («nombrar»): un tiempo fijo por nota. Media («leer-a-tempo»): las notas llegan a tempo y el tempo sube.
// Se guarda el récord de aciertos de cada ejercicio.
import { esc } from '../ui.js';
import { rng } from '../generate.js';
import { gradeAgility, mistakeCodes } from './grade.js';
import { stepOf, positionText, letterText, barBeatsOf, LETTERS } from './notes.js';
import { noteCell, clefCell } from './staff-lm.js';
import { nameButtons, CLEF, GLYPH } from './kit.js';
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

export function agilityPlan(p, seed) {
  const r = rng(seed);
  const pool = p.notas;
  const small = pool.length <= SMALL_POOL;
  let count = p.cantidad;
  let secs;
  if (p.modo === 'leer-a-tempo') {
    const [lo, hi] = Array.isArray(p.tempo) ? p.tempo : [p.tempo || 80, p.tempo || 80];
    count = Math.max(small ? MIN_SMALL_NOTES : 4, Math.round((p.compases || 4) * barBeatsOf(p.compas || '4/4') / BEATS_PER_NOTE));
    secs = Array.from({ length: count }, (_, i) => (60 / (lo + (hi - lo) * (count > 1 ? i / (count - 1) : 0))) * BEATS_PER_NOTE);
  } else secs = Array(Math.max(count || 12, small ? MIN_SMALL_NOTES : 0)).fill(p.segundosPorNota || 3);
  return { notes: noteSeries(pool, secs.length, r), secs };
}

export async function agilityTask(host, p, env) {
  const clef = CLEF[p.clave] || 'treble';
  const plan = agilityPlan(p, (env.attempt ?? env.seed) >>> 0); // otra serie en cada intento: no se aprende de memoria
  // Fácil: solo los nombres de las notas de la unidad (al empezar son dos o tres); Media: los siete
  const letters = env.variant === 'facil' ? LETTERS.filter(l => p.notas.some(n => n[0] === l)) : LETTERS;
  const key = `agil:${env.id}`;
  const best = recordOf(key);
  host.innerHTML = `<p class="muted">${p.modo === 'leer-a-tempo' ? 'Las notas llegan con el metrónomo, cada vez más deprisa: nómbralas antes de la siguiente.' : 'Nombra cada nota antes de que se acabe la barra de tiempo.'}</p>
    <p class="muted small">${best ? `<span>Tu récord:</span> <b>${best}</b>` : ''}</p>
    <div class="controls"><button type="button" class="btn big" id="lmAgGo">Empezar</button></div>`;
  host.querySelector('#lmAgGo').focus();
  await new Promise(r => host.querySelector('#lmAgGo').addEventListener('click', r, { once: true }));
  host.innerHTML = `<div class="lm-ag-top"><span id="lmAgCount">1 / ${plan.notes.length}</span><span><span>Aciertos:</span> <b id="lmAgRight">0</b></span></div>
    <div class="lm-ag-stage"><span class="lm-sc" aria-hidden="true">${clefCell(clef)}</span><span class="lm-ag-note" id="lmAgNote" role="img"></span></div>
    <div class="lm-ag-time" aria-hidden="true"><i id="lmAgBar"></i></div>
    ${nameButtons(letters, env.nom)}
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
    const name = plan.notes[i];
    const step = stepOf(name);
    const noteBox = host.querySelector('#lmAgNote');
    noteBox.innerHTML = noteCell({ step, dur: 'w', clef, w: 56 });
    noteBox.dataset.step = String(step);
    noteBox.setAttribute('aria-label', `Nota ${i + 1}: ${positionText(step, clef)}`);
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
    const ok = answer === name[0];
    if (ok) right++; else { misses.push(answer ? `${name}>${answer}` : `${name}-t`); }
    host.querySelector('#lmAgRight').textContent = String(right);
    const fb = host.querySelector('#lmAgFeedback');
    fb.className = `lm-ag-feedback ${ok ? 'ok' : 'bad'}`;
    fb.innerHTML = `<span class="dict-sw ${ok ? 'ok' : 'bad'}" aria-hidden="true">${GLYPH[ok ? 'ok' : 'bad']}</span> <span>${ok ? '¡Bien!' : answer ? 'Era' : 'Tiempo. Era'}</span>${ok ? '' : ` <b>${esc(letterText(name[0], env.nom))}</b>`}`;
    // a tempo, la nota siguiente llega en su pulso; si no, tras un momento para ver la corrección
    await wait(tempo ? (t0 + slots[i] + plan.secs[i] - now()) * 1000 : FEEDBACK_MS);
  }
  // contrato: aciertos sobre el total (los tiempos agotados cuentan como fallo, sin restar más), descontado el azar
  const g = gradeAgility(right, 0, plan.notes.length);
  const pct = chanceCorrected(g.pct, letters.length);
  const record = saveRecord(key, right);
  host.querySelector('#lmAgFeedback').innerHTML = record ? '<b>¡Nuevo récord!</b>' : '';
  return { pct, right, total: plan.notes.length, record, mistakes: mistakeCodes(misses) };
}
