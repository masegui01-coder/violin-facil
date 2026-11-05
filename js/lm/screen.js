// Pantalla de un ejercicio nuevo del curso de Lenguaje Musical («lm»): cabecera con la unidad, la sección y la
// variante; el ejercicio (runners.js); y el resultado con nota, estrellas, corrección ✓ ≈ ✕, errores explicados y
// los botones para repetir, cambiar de variante, seguir con el siguiente o volver a la unidad.
import { $, esc, starsHtml, announcer, toast } from '../ui.js';
import { cloudErrorText } from '../cloud.js';
import { register, back, go } from '../router.js';
import { getState } from '../store.js';
import * as audio from '../audio.js';
import { lmExercise, lmUnit, siblingId, SECTION_NAME, VARIANT_NAME, SKILL_NAME, mistakeText } from './catalog.js';
import { RUNNERS } from './runners.js';
import { recordActive, openLmExercise } from './launcher.js';
import { gradeTen, starsFor } from './grade.js';
import { legendHtml, chipsHtml, seedOf } from './kit.js';
import { stopSound } from './sound.js';

const say = announcer('lmStatus', 600);
let session = 0;
let current = null;

const body = () => $('lmBody');

// Siguiente ejercicio de la unidad en la misma variante (o el siguiente que haya)
function nextExercise(ex) {
  const list = lmUnit(ex.level, ex.unit).exercises;
  const same = list.filter(e => e.variant === ex.variant);
  const at = same.findIndex(e => e.id === ex.id);
  return same[at + 1] || null;
}

function mistakesHtml(codes) {
  const known = [...new Set(codes.map(mistakeText).filter(Boolean))].slice(0, 5).map(text => ({ text }));
  if (!known.length) return '';
  return `<div class="lm-mistakes"><h3>Para repasar</h3><ul>${known.map(k => `<li>${esc(k.text)}</li>`).join('')}</ul></div>`;
}

const myClasses = () => (getState().aula && getState().aula.classes) || [];
async function sendWork(btn, ex, out, saved) {
  btn.disabled = true;
  try {
    const api = await import('../aula-api.js');
    const work = { exId: ex.id, title: ex.title, score: out.work, lyrics: out.lyrics || '', meter: out.meter, pct: saved.pct };
    await Promise.all(myClasses().map(c => api.sendWork(c, work)));
    btn.textContent = 'Enviada a tu profesor';
    say('Enviada a tu profesor');
  } catch (err) {
    btn.disabled = false;
    toast('No se ha podido enviar: ' + cloudErrorText(err));
  }
}

function renderResult(ex, out, saved) {
  const ten = gradeTen(saved.pct, ex.variant);
  const sib = lmExercise(siblingId(ex.id, ex.variant === 'facil' ? 'medio' : 'facil'));
  const next = nextExercise(ex);
  const skills = Object.entries(saved.skills || {});
  body().innerHTML = `<div class="lm-result">
    <div id="lmScores" class="dict-scores ${skills.length > 1 ? '' : 'one'}" tabindex="-1">
      <div class="dict-score main"><b>${saved.pct} %</b><span>Resultado</span></div>
      ${skills.length > 1 ? skills.map(([k, v]) => `<div class="dict-score"><b>${v} %</b><span>${esc(SKILL_NAME[k] || k)}</span></div>`).join('') : ''}
    </div>
    <div class="dict-stars">${starsHtml(saved.stars)}</div>
    <p class="lm-ten"><span>Calificación</span> <b>${ten}</b><small class="muted">/10</small>${ex.variant === 'facil' ? ' <small class="muted">(en Fácil, como mucho 8)</small>' : ''}</p>
    ${out.marks && out.marks.length ? `${legendHtml()}${chipsHtml(out.marks, out.labels || [])}` : ''}
    ${out.note ? `<p class="muted center">${esc(out.note)}</p>` : ''}
    ${mistakesHtml(saved.mistakes || [])}
    <div class="controls lm-result-actions">
      ${next ? '<button type="button" class="btn" id="lmNext">Siguiente ejercicio</button>' : ''}
      <button type="button" class="btn ghost" id="lmAgain">Repetir</button>
      ${sib ? `<button type="button" class="btn ghost" id="lmOther">Probar la versión ${esc(VARIANT_NAME[sib.variant])}</button>` : ''}
      ${out.work && myClasses().length ? '<button type="button" class="btn" id="lmSendWork">Enviar a mi profesor</button>' : ''}
      ${ex.params.practicaInfinita ? '<button type="button" class="btn ghost" id="lmMoreDict">Más dictados como este</button>' : ''}
      <button type="button" class="btn ghost" id="lmToUnit">Volver a la unidad</button>
    </div></div>`;
  say(`Resultado: ${saved.pct} %`);
  $('lmScores').focus();
  $('lmAgain').addEventListener('click', () => openLmExercise(ex));
  $('lmToUnit').addEventListener('click', () => back());
  if (next) $('lmNext').addEventListener('click', () => openLmExercise(next));
  if (sib) $('lmOther').addEventListener('click', () => openLmExercise(sib));
  // Creatividad: la composición va al profesor de cada una de mis clases del Aula (la escucha en mi ficha)
  if (out.work && myClasses().length) $('lmSendWork').addEventListener('click', e => sendWork(e.currentTarget, ex, out, saved));
  // Práctica infinita: los Dictados de siempre con el nivel, el compás y las figuras de la unidad (sin semilla fija)
  if (ex.params.practicaInfinita) $('lmMoreDict').addEventListener('click', () => { const { level, meter, bars, cells } = ex.params.practicaInfinita.params; go('dictation', { lm: { level, meter, bars, cells } }); });
}

async function run(ex) {
  const token = ++session;
  const alive = () => token === session;
  const env = { id: ex.id, nom: getState().nom, variant: ex.variant, seed: seedOf(ex.id), alive, say, level: ex.level };
  $('lmTitle').textContent = ex.title;
  $('lmEyebrow').innerHTML = `<span>Unidad ${ex.unit}</span> · <span>${esc(SECTION_NAME[ex.section])}</span> · <span class="lm-variant ${ex.variant}">${esc(VARIANT_NAME[ex.variant])}</span>`;
  body().innerHTML = '';
  const runner = RUNNERS[ex.type];
  if (!runner) { body().innerHTML = '<p class="muted">Este ejercicio todavía no está disponible.</p>'; return; }
  let out;
  try {
    out = await runner(body(), ex, env);
  } catch (err) {
    if (!alive()) return;
    body().innerHTML = `<p class="dict-warn" role="alert">No se ha podido hacer el ejercicio. Inténtalo otra vez.</p>
      <div class="controls"><button type="button" class="btn" id="lmAgain">Repetir</button></div>`;
    $('lmAgain').addEventListener('click', () => openLmExercise(ex));
    throw err;
  }
  if (!out || !alive()) return;
  stopSound();
  const partial = { pct: out.pct, mistakes: out.mistakes || [], ...(out.stars !== undefined ? { stars: out.stars } : { stars: starsFor(out.pct) }), ...(out.skills ? { skills: out.skills } : {}) };
  const saved = recordActive(partial);
  if (saved) renderResult(ex, out, saved);
}

function enter({ ex } = {}) {
  current = ex || null;
  if (!current) { back(); return; }
  run(current).catch(() => {}); // el error ya se ha enseñado en pantalla
}

function leave() {
  session++;
  stopSound();
  audio.setVoiceInput(false);
  current = null;
}

register('lm', { enter, leave });
