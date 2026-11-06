// Preguntas del curso (teoría, audición, discriminación y repaso): elegir, escuchar y elegir (compás, intervalo,
// matiz, modo, frase, forma), contar pulsos, completar un compás, emparejar signos, ordenar y nombrar notas.
// Cada pregunta se pinta en «host» y resuelve con { mark: 'ok'|'near'|'bad', mistake } tras mostrar la corrección.
import { esc } from '../ui.js';
import { orderMark } from './grade.js';
import { scoreTokens, barBeatsOf, solfaToName, letterText, midiOf, FIGURE_NAME, REST_NAME } from './notes.js';
import { staffHtml, nameButtons, playButton, shuffle, seedOf, onceClick, whyHtml, CLEF, tokenLabel } from './kit.js';
import { noteCell, clefCell, gapCell, endCell, layoutTokens } from './staff-lm.js';
import { playNotes, clicks, stopSound } from './sound.js';
import { DYN_GAIN } from './gen.js';

const LISTEN_BPM = 84;
const PAIR_BPM = 60;
const DYN_RANGE = [0.25, 1];
const FERMATA_STRETCH = 2.5; // una nota con calderón suena unas dos veces y media su valor

// ---------- Sonido de una pregunta «escuchar…» ----------
// Partitura de las ilustraciones: además del formato de siempre, «^» alarga la figura (calderón) y «+» suena a la vez
export function figureNotes(text) {
  const out = [];
  let start = 0;
  text.replace(/\|/g, ' ').trim().split(/\s+/).filter(Boolean).forEach(tok => {
    const fermata = tok.endsWith('^');
    const parts = tok.replace(/\^$/, '').split('+').map(p => scoreTokens(p)[0]).filter(Boolean);
    if (!parts.length) return;
    const beats = parts[0].beats * (fermata ? FERMATA_STRETCH : 1);
    parts.forEach(t => out.push({ midi: t.midi, start, beats, rest: t.rest }));
    start += beats;
  });
  return out;
}
function notesOfPlay(play, env) {
  if (play.notas) return play.notas.map((n, i) => ({ midi: midiOf(n), start: i * 1.2, beats: 1, rest: false }));
  const text = play.cancion ? env.songScore(play.cancion) : play.partitura;
  if (!text) return [];
  if (/[\^+]/.test(text)) return figureNotes(text);
  return scoreTokens(text).map(t => ({ midi: t.midi, start: t.start, beats: t.beats, rest: t.rest }));
}
// Volumen por nota: un matiz fijo (pp…ff) o un regulador (cresc/dim) de punta a punta
export function gainsOf(play, notes) {
  const dyn = play.dinamica || play.dyn;
  if (!dyn) return null;
  if (dyn in DYN_GAIN) return notes.map(() => DYN_GAIN[dyn]);
  const [lo, hi] = DYN_RANGE;
  const k = i => (notes.length > 1 ? i / (notes.length - 1) : 0);
  return notes.map((_, i) => (dyn === 'cresc' ? lo + (hi - lo) * k(i) : dyn === 'dim' ? hi - (hi - lo) * k(i) : 0.7));
}
// «pulso»: un clic por pulso; «acento:N»: clics con el primero de cada N más fuerte (sin notas)
function playPulse(sound, notes, bpm) {
  const beats = Math.max(1, Math.round(notes.reduce((end, n) => Math.max(end, n.start + n.beats), 0)));
  const meter = Number((/^acento:(\d)$/.exec(sound) || [])[1] || 0);
  const end = clicks(beats, bpm, { accentEvery: meter, level: meter ? 0.8 : 0.6 });
  return { t0: end - beats * 60 / bpm, end };
}
export function playQuestion(play, env) {
  stopSound();
  const notes = notesOfPlay(play, env);
  const bpm = play.notas ? PAIR_BPM : play.tempo || LISTEN_BPM;
  if (play.sound && /^(pulso|acento:\d)$/.test(play.sound)) return playPulse(play.sound, notes, bpm);
  return playNotes(notes, bpm, { gains: gainsOf(play, notes), accentEvery: play.acentoPrimero ? barBeatsOf(play.compas) : 0, clap: !!play.clap });
}

// ---------- Elegir (con sonido opcional) ----------
const LISTEN_MISTAKE = { escucharCompas: 'compas', escucharModo: 'modo', escucharIntervalo: 'semitono-oido', escucharMatiz: 'matiz' };

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
  return { mark, mistake: mark === 'ok' ? null : item.code || item.id || LISTEN_MISTAKE[item.tipo] || 'teoria' };
}

// Opciones barajadas en cada intento (semilla del intento + la pregunta): la correcta no cae siempre en el mismo sitio
export function shuffledChoice(item, seed) {
  const order = shuffle(item.options.map((_, i) => i), (seed >>> 0) + seedOf(item.id || item.q));
  return { options: order.map(i => item.options[i]), correct: [order.indexOf(item.answer)] };
}
const elegir = (host, item, env) => choose(host, item, env, shuffledChoice(item, env.attempt ?? env.seed ?? 0));

// ---------- Contar (escribir el número) ----------
// Se escribe la respuesta (o se ajusta con − y +): no se elige entre números dados. Sin partitura, es de cálculo
// («¿cuántas corcheas llenan un 2/4?»); con ella, se cuentan pulsos, compases o semitonos de lo que se ve
const COUNT_MAX = 99;
async function contar(host, item, env) {
  const tokens = item.partitura ? scoreTokens(item.partitura) : null;
  const right = Number(item.respuesta);
  host.innerHTML = `${headHtml(item)}${item.play ? playButton('lmQPlay') : ''}${tokens ? staffHtml(tokens, { meter: item.compas || null, pickup: item.anacrusa || 0, label: tokens.map(t => tokenLabel(t, env.nom)).join(', ') }) : ''}
    <div class="lm-count-in"><button type="button" class="round" data-dec aria-label="Uno menos">−</button>
    <input type="number" inputmode="numeric" min="0" max="${COUNT_MAX}" data-count aria-label="Tu respuesta" placeholder="?">
    <button type="button" class="round" data-inc aria-label="Uno más">+</button></div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  const input = host.querySelector('[data-count]');
  const step = d => { input.value = String(Math.max(0, Math.min(COUNT_MAX, (Number(input.value) || 0) + d))); env.say(input.value); };
  host.querySelector('[data-dec]').addEventListener('click', () => step(-1));
  host.querySelector('[data-inc]').addEventListener('click', () => step(1));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); host.querySelector('[data-check]').click(); } });
  if (item.play) host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion(item.play, env));
  host.querySelector('.lm-q').focus();
  await onceClick(host, '[data-check]');
  const given = input.value === '' ? null : Number(input.value);
  const mark = given === right ? 'ok' : 'bad';
  host.querySelectorAll('[data-count],[data-dec],[data-inc]').forEach(x => { x.disabled = true; });
  host.querySelector('[data-check]').remove();
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || `Son ${right}.`);
  return { mark, mistake: mark === 'ok' ? null : item.id || 'contar' };
}

// ---------- Señalar un compás en la partitura ----------
// Cada compás escrito (entre barras) es un botón: «toca la anacrusa», «el compás con calderón», «dónde acaba la
// pregunta»… calderon: n.º de compás (desde 0) cuya última nota lleva calderón
function barButtons(item, env) {
  const bars = item.partitura.split('|').map(x => x.trim()).filter(Boolean);
  return bars.map((text, k) => {
    const tokens = scoreTokens(`| ${text} |`);
    const lay = layoutTokens(tokens, { clef: 'treble' });
    const cells = tokens.map((t, i) => `<span class="lm-sc">${noteCell({ ...t, clef: 'treble', beam: lay[i].beam, up: lay[i].up, fermata: item.calderon === k && i === tokens.length - 1 })}</span>`).join('');
    const close = k === bars.length - 1 ? endCell(false) : gapCell(true, null, 14);
    return `<button type="button" class="lm-bar-btn" data-bar="${k}" aria-label="${esc(`Compás ${k + 1}: ${tokens.map(t => tokenLabel(t, env.nom)).join(', ')}`)}">${cells}<span class="lm-sc">${close}</span></button>`;
  }).join('');
}
async function senalar(host, item, env) {
  host.innerHTML = `${headHtml(item)}${item.play ? playButton('lmQPlay') : ''}
    <div class="lm-staff lm-pick-bars" role="group" aria-label="Compases"><span class="lm-bargroup"><span class="lm-sc" aria-hidden="true">${clefCell('treble', item.compas || null)}</span></span>${barButtons(item, env)}</div>
    <div class="lm-feedback"></div>`;
  if (item.play) host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion(item.play, env));
  host.querySelector('.lm-q').focus();
  const b = await onceClick(host, '[data-bar]');
  const chosen = Number(b.dataset.bar);
  const mark = chosen === Number(item.respuesta) ? 'ok' : 'bad';
  host.querySelectorAll('[data-bar]').forEach(x => {
    x.disabled = true;
    const k = Number(x.dataset.bar);
    if (k === Number(item.respuesta)) x.classList.add('right');
    else if (k === chosen) x.classList.add('wrong');
  });
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || '');
  return { mark, mistake: mark === 'ok' ? null : item.id || 'senalar' };
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
  elegir, contar, completar, emparejar, ordenar, nombrarNotas, senalar,
  escucharCompas: elegir, escucharIntervalo: elegir, escucharMatiz: elegir, escucharModo: elegir, escucharFrase: elegir, escucharForma: elegir,
};

