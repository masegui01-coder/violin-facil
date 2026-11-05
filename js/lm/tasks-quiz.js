// Preguntas del curso (teoría, audición, discriminación y repaso): elegir, escuchar y elegir (compás, intervalo,
// matiz, modo, frase, forma), contar pulsos, completar un compás, emparejar signos, ordenar y nombrar notas.
// Cada pregunta se pinta en «host» y resuelve con { mark: 'ok'|'near'|'bad', mistake } tras mostrar la corrección.
import { esc } from '../ui.js';
import { orderMark } from './grade.js';
import { scoreTokens, barBeatsOf, solfaToName, letterText, midiOf, FIGURE_NAME, REST_NAME } from './notes.js';
import { staffHtml, nameButtons, playButton, shuffle, seedOf, onceClick, whyHtml, CLEF, tokenLabel } from './kit.js';
import { playNotes, stopSound } from './sound.js';

const LISTEN_BPM = 84;
const PAIR_BPM = 60;
const DYN_RANGE = [0.25, 1];
const COUNT_SPREAD = 2;

// ---------- Sonido de una pregunta «escuchar…» ----------
function notesOfPlay(play, env) {
  if (play.notas) return play.notas.map((n, i) => ({ midi: midiOf(n), start: i * 1.2, beats: 1, rest: false }));
  const text = play.cancion ? env.songScore(play.cancion) : play.partitura;
  return text ? scoreTokens(text).map(t => ({ midi: t.midi, start: t.start, beats: t.beats, rest: t.rest })) : [];
}
function gainsOf(play, notes) {
  if (!play.dinamica) return null;
  const [lo, hi] = DYN_RANGE;
  const k = i => (notes.length > 1 ? i / (notes.length - 1) : 0);
  return notes.map((_, i) => (play.dinamica === 'cresc' ? lo + (hi - lo) * k(i) : play.dinamica === 'dim' ? hi - (hi - lo) * k(i) : 0.7));
}
export function playQuestion(play, env) {
  stopSound();
  const notes = notesOfPlay(play, env);
  return playNotes(notes, play.notas ? PAIR_BPM : play.tempo || LISTEN_BPM, { gains: gainsOf(play, notes), accentEvery: play.acentoPrimero ? barBeatsOf(play.compas) : 0 });
}

// ---------- Elegir (con sonido opcional) ----------
const LISTEN_MISTAKE = { escucharCompas: 'compas', escucharModo: 'modo', escucharIntervalo: 'semitono', escucharMatiz: 'matiz' };

function headHtml(item) {
  return `<h2 class="lm-q" tabindex="-1">${esc(item.q)}</h2>`;
}

async function choose(host, item, env, { options, correct, extraHtml = '', optionHtml = null }) {
  host.innerHTML = `${headHtml(item)}${item.play ? playButton('lmQPlay') : ''}${extraHtml}
    <div class="quiz-options lm-options" role="group" aria-label="Respuestas">${options.map((o, k) => `<button type="button" class="quiz-opt" data-opt="${k}">${optionHtml ? optionHtml(o, k) : esc(o)}</button>`).join('')}</div>
    <div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  if (item.play) {
    host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion(item.play, env));
    playQuestion(item.play, env);
  }
  const b = await onceClick(host, '[data-opt]');
  const chosen = Number(b.dataset.opt);
  const mark = correct.includes(chosen) ? 'ok' : 'bad';
  host.querySelectorAll('[data-opt]').forEach(x => {
    const k = Number(x.dataset.opt);
    x.disabled = true;
    if (correct.includes(k) && (k === chosen || mark === 'bad')) x.classList.add('right');
    else if (k === chosen) x.classList.add('wrong');
  });
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why);
  return { mark, mistake: mark === 'ok' ? null : LISTEN_MISTAKE[item.tipo] || item.id || 'teoria' };
}

const elegir = (host, item, env) => choose(host, item, env, { options: item.options, correct: [item.answer] });

// ---------- Contar pulsos ----------
function contar(host, item, env) {
  const tokens = scoreTokens(item.partitura);
  const right = Number(item.respuesta);
  const pool = [];
  for (let d = -COUNT_SPREAD; d <= COUNT_SPREAD; d++) if (right + d >= 1) pool.push(right + d);
  const options = shuffle(pool, seedOf(item.id || item.q)).slice(0, 4);
  if (!options.includes(right)) options[0] = right;
  const sorted = [...options].sort((a, b) => a - b);
  return choose(host, item, env, {
    options: sorted.map(String), correct: [sorted.indexOf(right)],
    extraHtml: staffHtml(tokens, { meter: item.compas || null, label: tokens.map(t => tokenLabel(t, env.nom)).join(', ') }),
  });
}

// ---------- Completar el compás con una figura ----------
function optionCells(text, env) {
  const tokens = scoreTokens(`| ${text} |`);
  return `<span class="lm-opt-staff" aria-hidden="true">${staffHtml(tokens, { bars: false })}</span><span class="sr-only">${esc(tokens.map(t => (t.rest ? REST_NAME[t.dur] : FIGURE_NAME[t.dur])).join(' y '))}</span>`;
}
function completar(host, item, env) {
  const known = item.partitura.replace(/\?/g, '').replace(/\|\s*\|/g, '|');
  const tokens = scoreTokens(known);
  const staff = `<div class="lm-complete">${staffHtml(tokens, { meter: item.compas, bars: false, label: tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ') })}<span class="lm-hole" aria-label="Hueco">?</span></div>`;
  return choose(host, item, env, { options: item.opciones, correct: item.correctas, extraHtml: staff, optionHtml: o => optionCells(o, env) });
}

// ---------- Emparejar ----------
async function emparejar(host, item, env) {
  const names = shuffle(item.pares.map(p => p[1]), seedOf(item.id || item.q));
  host.innerHTML = `${headHtml(item)}<div class="lm-pairs">${item.pares.map(([sign], i) => `<label class="lm-pair"><span class="lm-sign" lang="it">${esc(sign)}</span>
    <select data-pair="${i}"><option value="">Elige…</option>${names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select></label>`).join('')}</div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  await onceClick(host, '[data-check]');
  const picks = [...host.querySelectorAll('[data-pair]')];
  const right = picks.filter((s, i) => s.value === item.pares[i][1]);
  picks.forEach((s, i) => {
    const ok = s.value === item.pares[i][1];
    s.disabled = true;
    s.closest('.lm-pair').classList.add(ok ? 'ok' : 'bad');
    s.closest('.lm-pair').insertAdjacentHTML('beforeend', `<span class="dict-sw ${ok ? 'ok' : 'bad'}" aria-hidden="true">${ok ? '✓' : '✕'}</span>${ok ? '' : `<small class="muted">${esc(item.pares[i][1])}</small>`}`);
  });
  host.querySelector('[data-check]').remove();
  const mark = right.length === picks.length ? 'ok' : right.length * 2 >= picks.length ? 'near' : 'bad';
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why);
  return { mark, mistake: mark === 'ok' ? null : item.id || 'emparejar' };
}

// ---------- Ordenar ----------
async function ordenar(host, item, env) {
  const want = item.respuesta || item.items;
  let order = shuffle(item.items, seedOf(item.id || item.q));
  if (order.every((x, i) => x === want[i]) && order.length > 1) order = [...order.slice(1), order[0]];
  const draw = focus => {
    host.querySelector('.lm-order').innerHTML = order.map((x, i) => `<li><span class="lm-order-text">${esc(x)}</span>
      <button type="button" class="icon-btn" data-up="${i}" aria-label="Subir ${esc(x)}" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" class="icon-btn" data-down="${i}" aria-label="Bajar ${esc(x)}" ${i === order.length - 1 ? 'disabled' : ''}>↓</button></li>`).join('');
    if (focus) host.querySelector(focus)?.focus();
  };
  host.innerHTML = `${headHtml(item)}<ol class="lm-order"></ol><div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  draw();
  host.querySelector('.lm-q').focus();
  const move = e => {
    const up = e.target.closest('[data-up]');
    const down = e.target.closest('[data-down]');
    if (!up && !down) return;
    const i = Number((up || down).dataset[up ? 'up' : 'down']);
    const j = up ? i - 1 : i + 1;
    [order[i], order[j]] = [order[j], order[i]];
    draw(`[data-${up ? 'up' : 'down'}="${j}"]`);
    env.say(`${order[j]}: posición ${j + 1}`);
  };
  host.addEventListener('click', move);
  await onceClick(host, '[data-check]');
  host.removeEventListener('click', move);
  const mark = orderMark(want, order);
  host.querySelector('.lm-order').innerHTML = order.map((x, i) => `<li class="${x === want[i] ? 'ok' : 'bad'}"><span class="dict-sw ${x === want[i] ? 'ok' : 'bad'}" aria-hidden="true">${x === want[i] ? '✓' : '✕'}</span><span class="lm-order-text">${esc(x)}</span></li>`).join('');
  host.querySelector('[data-check]').remove();
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || `Orden correcto: ${want.join(', ')}`);
  return { mark, mistake: mark === 'ok' ? null : item.id || 'ordenar' };
}

// ---------- Nombrar notas en orden ----------
async function nombrarNotas(host, item, env) {
  const tokens = scoreTokens(item.partitura).filter(t => !t.rest);
  const want = item.respuesta.map(x => (solfaToName(x) || x)[0]);
  const given = [];
  const clef = CLEF[item.clave] || 'treble';
  const render = () => {
    host.querySelector('.lm-staff-box').innerHTML = staffHtml(tokens, { clef, current: given.length, under: given.map(l => letterText(l, env.nom)) });
  };
  host.innerHTML = `${headHtml(item)}<div class="lm-staff-box"></div>${nameButtons(undefined, env.nom)}
    <p class="muted small center" aria-live="polite" id="lmNameProg">Nota 1 de ${tokens.length}</p><div class="lm-feedback"></div>`;
  render();
  host.querySelector('.lm-q').focus();
  while (given.length < want.length) {
    const b = await onceClick(host, '[data-name]');
    given.push(b.dataset.name);
    render();
    host.querySelector('#lmNameProg').textContent = given.length < want.length ? `Nota ${given.length + 1} de ${tokens.length}` : 'Hecho';
  }
  host.querySelectorAll('[data-name]').forEach(b => { b.disabled = true; });
  const marks = want.map((w, i) => (given[i] === w ? 'ok' : 'bad'));
  host.querySelector('.lm-staff-box').innerHTML = staffHtml(tokens, { clef, marks, under: want.map((w, i) => (given[i] === w ? letterText(w, env.nom) : `${letterText(given[i], env.nom)} → ${letterText(w, env.nom)}`)) });
  const right = marks.filter(m => m === 'ok').length;
  const mark = right === want.length ? 'ok' : right * 2 >= want.length ? 'near' : 'bad';
  const wrongAt = marks.findIndex(m => m === 'bad');
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why);
  return { mark, mistake: wrongAt < 0 ? null : `${tokens[wrongAt].name}>${given[wrongAt]}` };
}

export const QUIZ_KINDS = {
  elegir, contar, completar, emparejar, ordenar, nombrarNotas,
  escucharCompas: elegir, escucharIntervalo: elegir, escucharMatiz: elegir, escucharModo: elegir, escucharFrase: elegir, escucharForma: elegir,
};

