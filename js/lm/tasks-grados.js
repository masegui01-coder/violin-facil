// Dictado de grados y de acordes (Nivel 4): la app toca la tónica (o su acorde) y después tres o cuatro notas (o acordes);
// el alumno escribe el grado de cada una (números I–VII) o el numeral de cada acorde (I, IV, V, vi…). Se puede oír tres
// veces; cada escucha de más resta puntos, como en el resto de dictados. Sin DOM propio: pinta en «host».
import { esc } from '../ui.js';
import { scoreTokens, midiOf, attackTokens } from './notes.js';
import { onceClick, playButton, whyHtml, continueButton, GLYPH, chipsHtml } from './kit.js';
import { playNotes, stopSound } from './sound.js';
import { progressionNotes } from './tasks-quiz.js';
import { clefCell } from './staff-lm.js';
import { armaduraOf, degreeOf, noteOfDegree, numeralFor } from './harmony.js';
import { pctOf, mistakeCodes } from './grade.js';

const EXTRA_LISTEN_PENALTY = 5;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Lo que suena: la tónica (o el acorde de tónica) un compás y, después, las notas o los acordes de la respuesta
export function gradosSound(p) {
  if (p.tipo === 'acordes') {
    const ref = progressionNotes(p.tonalidad, [numeralFor(p.tonalidad, 1)]).map(n => ({ ...n, beats: 2 }));
    const body = progressionNotes(p.tonalidad, p.progresion).map(n => ({ ...n, start: n.start + 3, beats: n.beats > 1 ? 2 : n.beats }));
    return [...ref, ...body];
  }
  const tonic = noteOfDegree(p.tonalidad, 1);
  const body = attackTokens(scoreTokens(p.partitura)).filter(t => !t.rest).map((t, i) => ({ midi: t.midi, start: 3 + i * 1.2, beats: 1.1, rest: false }));
  return [{ midi: midiOf(tonic), start: 0, beats: 2, rest: false }, ...body];
}
// Las respuestas buenas: el grado (número) de cada nota o el numeral de cada acorde
export function gradosAnswer(p) {
  if (p.tipo === 'acordes') return p.progresion;
  return p.respuestaGrados || attackTokens(scoreTokens(p.partitura)).filter(t => !t.rest).map(t => (degreeOf(p.tonalidad, t.name) || { grado: 0 }).grado);
}
// Los botones de cada casilla: grados I–VII o los numerales de los siete acordes de la tonalidad
export function gradosOptions(p) {
  if (p.tipo === 'acordes') return ROMAN.map((_, i) => numeralFor(p.tonalidad, i + 1));
  return ROMAN.map((r, i) => [String(i + 1), r]);
}

export async function dictadoGrados(host, p, env) {
  const want = gradosAnswer(p);
  const opts = p.tipo === 'acordes' ? gradosOptions(p).map(n => [n, n]) : gradosOptions(p);
  const sound = gradosSound(p);
  const listens = p.escuchas || 3;
  let used = 0;
  let extra = 0;
  const armadura = armaduraOf(p.tonalidad);
  host.innerHTML = `<p class="muted">${p.tipo === 'acordes' ? 'Escucha la tónica y los acordes, y escribe el grado de cada uno.' : 'Escucha la tónica y las notas, y escribe el grado de cada una (1 a 7).'} <b>${esc(p.tonalidad)}</b></p>
    <div class="lm-staff" aria-hidden="true"><span class="lm-bargroup"><span class="lm-sc">${clefCell('treble', null, armadura)}</span></span></div>
    <div class="controls">${playButton('lmDictPlay', 'Escuchar')}<span class="muted small" id="lmDictLeft" aria-live="polite">Escuchas: ${listens}</span></div>
    <div class="lm-degrow">${want.map((_, k) => `<label class="lm-degslot"><span>${p.tipo === 'acordes' ? 'Acorde' : 'Nota'} ${k + 1}</span>
      <select data-slot="${k}"><option value="">Elige…</option>${opts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>`).join('')}</div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  const left = host.querySelector('#lmDictLeft');
  host.querySelector('#lmDictPlay').addEventListener('click', () => {
    used++;
    if (used > listens) extra++;
    left.textContent = used < listens ? `Escuchas: ${listens - used}` : `Escucha extra: −${EXTRA_LISTEN_PENALTY} puntos cada una`;
    stopSound();
    playNotes(sound, p.tipo === 'acordes' ? 66 : 72);
  });
  host.querySelector('#lmDictPlay').focus();
  await onceClick(host, '[data-check]');
  stopSound();
  const got = [...host.querySelectorAll('[data-slot]')].map(s => s.value);
  const marks = want.map((w, k) => (String(got[k]) === String(w) ? 'ok' : 'bad'));
  host.querySelectorAll('[data-slot]').forEach((s, k) => {
    s.disabled = true;
    s.closest('label').classList.add(marks[k]);
    s.closest('label').insertAdjacentHTML('beforeend', `<span class="dict-sw ${marks[k]}" aria-hidden="true">${GLYPH[marks[k]]}</span>${marks[k] === 'ok' ? '' : ` <small class="muted">${esc(p.tipo === 'acordes' ? String(want[k]) : ROMAN[want[k] - 1])}</small>`}`);
  });
  host.querySelector('[data-check]').remove();
  const pct = Math.max(0, pctOf(marks) - extra * EXTRA_LISTEN_PENALTY);
  const mark = pct >= 100 ? 'ok' : marks.includes('ok') ? 'near' : 'bad';
  host.querySelector('.lm-feedback').innerHTML = `${chipsHtml(marks)}${whyHtml(mark, extra ? `Incluye −${extra * EXTRA_LISTEN_PENALTY} puntos por las escuchas extra.` : '')}`;
  await continueButton(host, 'Ver el resultado');
  return { pct, marks, mistakes: mistakeCodes(marks.includes('bad') ? [p.tipo === 'acordes' ? 'acorde' : 'grado'] : []) };
}

