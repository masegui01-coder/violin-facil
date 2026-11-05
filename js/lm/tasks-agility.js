// Agilidad de notas: aparece una nota en el pentagrama y hay que nombrarla antes de que se acabe su tiempo.
// Fácil («nombrar»): un tiempo fijo por nota. Media («leer-a-tempo»): las notas llegan a tempo y el tempo sube.
// Se guarda el récord de aciertos de cada ejercicio.
import { esc } from '../ui.js';
import { rng } from '../generate.js';
import { gradeAgility, mistakeCodes } from './grade.js';
import { stepOf, positionText, letterText, barBeatsOf, LETTERS } from './notes.js';
import { noteCell, clefCell } from './staff-lm.js';
import { nameButtons, CLEF, GLYPH } from './kit.js';
import { wait, clicks } from './sound.js';
import { recordOf, saveRecord } from './results.js';

const FEEDBACK_MS = 450;
const TICK_MS = 50;
const BEATS_PER_NOTE = 2; // a tempo: una nota cada dos pulsos

// Plan del ejercicio: cuántas notas, cuánto tiempo para cada una y qué nota sale (sin repetir la anterior)
export function agilityPlan(p, seed) {
  const r = rng(seed);
  const pool = p.notas;
  let count = p.cantidad;
  let secs;
  if (p.modo === 'leer-a-tempo') {
    const [lo, hi] = Array.isArray(p.tempo) ? p.tempo : [p.tempo || 80, p.tempo || 80];
    count = Math.max(4, Math.round((p.compases || 4) * barBeatsOf(p.compas || '4/4') / BEATS_PER_NOTE));
    secs = Array.from({ length: count }, (_, i) => (60 / (lo + (hi - lo) * (count > 1 ? i / (count - 1) : 0))) * BEATS_PER_NOTE);
  } else secs = Array(count || 12).fill(p.segundosPorNota || 3);
  let prev = null;
  const notes = secs.map(() => {
    const options = pool.length > 1 ? pool.filter(n => n !== prev) : pool;
    prev = options[Math.floor(r() * options.length)];
    return prev;
  });
  return { notes, secs };
}

export async function agilityTask(host, p, env) {
  const clef = CLEF[p.clave] || 'treble';
  const plan = agilityPlan(p, env.seed);
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
  for (let i = 0; i < plan.notes.length; i++) {
    if (!env.alive()) return null;
    const name = plan.notes[i];
    const step = stepOf(name);
    const noteBox = host.querySelector('#lmAgNote');
    noteBox.innerHTML = noteCell({ step, dur: 'w', clef, w: 56 });
    noteBox.dataset.step = String(step);
    noteBox.setAttribute('aria-label', `Nota ${i + 1}: ${positionText(step, clef)}`);
    host.querySelector('#lmAgCount').textContent = `${i + 1} / ${plan.notes.length}`;
    if (i === 0) host.querySelector('[data-name]').focus();
    const limit = plan.secs[i] * 1000;
    // a tempo, el metrónomo marca los dos pulsos de cada nota
    if (p.modo === 'leer-a-tempo') clicks(2, 120000 / limit, { accentEvery: 2, level: 0.45 });
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
    await wait(FEEDBACK_MS);
  }
  // contrato: aciertos sobre el total (los tiempos agotados cuentan como fallo, sin restar más)
  const g = gradeAgility(right, 0, plan.notes.length);
  const record = saveRecord(key, right);
  host.querySelector('#lmAgFeedback').innerHTML = record ? '<b>¡Nuevo récord!</b>' : '';
  return { pct: g.pct, right, total: plan.notes.length, record, mistakes: mistakeCodes(misses) };
}
