// Método Pro (opcional, no cambia el curso): en Aprender, la vista «Pro» lista los niveles del curso de viento y cada
// nivel se abre con tres pestañas. Libro: descripción, solfeo, técnica de tu instrumento y consejo. Relax: retos
// rápidos (pro-relax.js). Práctica: partitura, rutina de pasos, lo que escucha el micrófono y el botón para tocar.
import { $, esc, icon, starsHtml } from '../ui.js';
import { register, go } from '../router.js';
import { L } from '../tips-l10n.js';
import { getState, instrumentProgress, recordPro, logPractice } from '../store.js';
import { instrumentById } from '../instruments.js';
import { parseScore } from '../music.js';
import { createStaff } from '../staff.js';
import { sliceScore } from '../book.js';
import { launch } from '../launch.js';
import { buildMethod, isWind, levelStates, practiceLesson } from '../method.js';
import * as audio from '../audio.js';
import { startRelax, stopRelax } from './pro-relax.js';

const BARS_PER_LINE = 2; // en el móvil, dos compases por renglón se leen bien
const XP_PER_STAR = 5;
const TXT = {
  eyebrow: L('Método Pro · Viento', 'Pro method · Winds'), course: L('Curso 1 · Iniciación', 'Course 1 · Beginner'),
  intro: L('Un camino aparte del curso, para estudiar como en el conservatorio pero desde el móvil. Cada nivel tiene tres pestañas: Libro para entender el solfeo y la técnica, Relax para practicarlo como un juego (leer, escribir notas y marcar ritmos) y Práctica para tocarlo con el micrófono.', 'A path separate from the course, to study as in a music school but from your phone. Each level has three tabs: Book to understand reading and technique, Relax to practise it as a game (reading, writing notes and tapping rhythms) and Practice to play it with the microphone.'),
  notWind: L('El método Pro está, de momento, para instrumentos de viento. Elige un instrumento de viento en tu perfil para verlo.', 'The Pro method is, for now, for wind instruments. Choose a wind instrument in your profile to see it.'),
  level: L('Nivel', 'Level'), locked: L('Termina el nivel anterior para abrirlo', 'Finish the previous level to open it'),
  book: L('Libro', 'Book'), relax: L('Relax', 'Relax'), play: L('Práctica', 'Practice'),
  theory: L('Solfeo', 'Music reading'), technique: L('Tu instrumento', 'Your instrument'), tip: L('Consejo', 'Tip'),
  notes: L('Las notas de este nivel', 'The notes in this level'), goRelax: L('Ir a Relax', 'Go to Relax'),
  relaxIntro: L('Retos rápidos de solfeo y técnica: lee, escribe en el pentagrama y marca ritmos. Los fallos vuelven al final para que los repases.', 'Quick reading and technique challenges: read, write on the staff and tap rhythms. Mistakes come back at the end so you can review them.'),
  challenges: L('Retos:', 'Challenges:'), best: L('Tu mejor resultado:', 'Your best result:'), startRelax: L('Empezar', 'Start'),
  tempo: L('Tempo', 'Tempo'), time: L('Compás', 'Time'), routine: L('Rutina', 'Routine'), mic: L('Qué escucha la app', 'What the app listens for'),
  listen: L('Escuchar', 'Listen'), stop: L('Parar', 'Stop'), learnMode: L('Nota a nota', 'Note by note'), tempoMode: L('Tocar a tempo', 'Play in tempo'),
  done: L('Hecho', 'Done'),
};

let level = null;      // nivel abierto
let tab = 'book';
let stopDemo = null;

const inst = () => instrumentById(getState().instrument);
const levels = () => buildMethod(inst(), getState().nom);
const saved = () => (getState().pro || {})[getState().instrument] || {};
const statesOf = list => levelStates(list, saved(), instrumentProgress(), getState().unlockAll || getState().proTester);

// ---------- Lista de niveles (dentro de Aprender) ----------
export function renderPro() {
  const box = $('proView');
  if (!isWind(inst())) {
    box.innerHTML = `<div class="pro-hero"><p class="eyebrow">${esc(TXT.eyebrow)}</p><h2>${esc(TXT.course)}</h2><p>${esc(TXT.notWind)}</p></div>`;
    return;
  }
  const list = levels();
  const states = statesOf(list);
  const done = list.filter(l => states[l.leccion_id].state === 'done').length;
  box.innerHTML = `<div class="pro-hero"><p class="eyebrow">${esc(TXT.eyebrow)}</p><h2>${esc(TXT.course)}</h2><p>${esc(TXT.intro)}</p>
      <div class="progress"><i style="width:${Math.round(done / list.length * 100)}%"></i></div><span class="unit-pct">${done}/${list.length}</span></div>
    <div class="pro-levels">${list.map(l => levelCard(l, states[l.leccion_id])).join('')}</div>`;
  box.querySelectorAll('[data-pro]').forEach(b => b.addEventListener('click', () => go('pro', { id: b.dataset.pro })));
}

function levelCard(l, st) {
  const locked = st.state === 'locked';
  const pill = (on, ic, label, stars) => `<span class="pro-pill${on ? ' on' : ''}"><span class="ic">${icon(ic)}</span>${esc(label)}${stars ? starsHtml(stars) : ''}</span>`;
  return `<button type="button" class="pro-level ${st.state}" data-pro="${l.leccion_id}" ${locked ? 'disabled' : ''}>
    <span class="pro-num">${l.nivel}</span>
    <span class="pro-level-text"><small><span>${esc(TXT.level)}</span> ${l.nivel}</small><b>${esc(l.titulo_leccion)}</b>
    ${locked ? `<small>${esc(TXT.locked)}</small>` : `<span class="pro-pills">${pill(st.book, 'theory', TXT.book)}${pill(st.relax > 0, 'star', TXT.relax, st.relax)}${pill(st.play > 0, 'notes', TXT.play, st.play)}</span>`}</span>
  </button>`;
}

// ---------- Pantalla del nivel ----------
function enter(params = {}) {
  if (params.id) {
    level = levels().find(l => l.leccion_id === params.id) || level;
    tab = params.tab || 'book';
  } else if (level) {
    level = levels().find(l => l.leccion_id === level.leccion_id) || level; // vuelve de tocar: estrellas al día
    tab = params.tab || tab;
  }
  if (!level) { go('learn'); return; }
  $('proEyebrow').innerHTML = `<span>${esc(TXT.eyebrow)}</span> · <span>${esc(TXT.level)}</span> ${level.nivel}`;
  $('proTitle').textContent = level.titulo_leccion;
  render();
}

function leave() {
  stopRelax();
  if (stopDemo) { stopDemo(); stopDemo = null; }
}

function render() {
  document.querySelectorAll('[data-pro-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.proTab === tab)));
  stopRelax();
  if (tab === 'book') renderBook();
  else if (tab === 'relax') renderRelaxIntro();
  else renderPractice();
  $('pro').scrollTop = 0;
  window.scrollTo(0, 0);
}

function noteChips() {
  return `<div class="pro-chips">${level.pestana_practica.notas_usadas.map(n => `<span class="chip">${esc(n)}</span>`).join('')}</div>`;
}

function renderBook() {
  const b = level.pestana_libro;
  $('proBody').innerHTML = `<article class="pro-book">
    <p class="pro-lead">${esc(b.descripcion)}</p>
    <section class="pro-block solfeo"><h3>${esc(TXT.theory)}</h3><p>${esc(b.bloque_teoria_solfeo)}</p></section>
    <section class="pro-block tecnica"><h3><span>${esc(TXT.technique)}</span> · <span>${esc(inst().name)}</span></h3><p>${esc(b.bloque_tecnica_instrumento)}</p></section>
    <section class="pro-block consejo"><h3>${esc(TXT.tip)}</h3><p>${esc(b.consejo_unificado)}</p></section>
    <h3>${esc(TXT.notes)}</h3>${noteChips()}
    <button id="proGoRelax" class="btn" type="button"><span>${esc(TXT.goRelax)}</span> ›</button></article>`;
  recordPro(level.leccion_id, { book: true });
  $('proGoRelax').addEventListener('click', () => { tab = 'relax'; render(); });
}

function renderRelaxIntro() {
  const best = (saved()[level.leccion_id] || {}).relax || 0;
  $('proBody').innerHTML = `<div class="pro-relax-intro"><p>${esc(TXT.relaxIntro)}</p>
    <p class="muted"><span>${esc(TXT.challenges)}</span> ${level.pestana_relax.length}</p>
    ${best ? `<p class="muted"><span>${esc(TXT.best)}</span> ${starsHtml(best)}</p>` : ''}
    <button id="proStartRelax" class="btn" type="button"><span class="ic">${icon('play')}</span>${esc(TXT.startRelax)}</button></div>`;
  $('proStartRelax').addEventListener('click', () => startRelax(level, finishRelax));
}

function finishRelax({ stars, minutes, again }) {
  recordPro(level.leccion_id, { relax: stars });
  logPractice(minutes, stars * XP_PER_STAR);
  $('relaxToPlay').addEventListener('click', () => { tab = 'play'; render(); });
  $('relaxAgain').addEventListener('click', again);
}

function renderPractice() {
  const p = level.pestana_practica;
  const score = parseScore(level.score);
  const lines = Math.ceil(score.bars.length / BARS_PER_LINE);
  const best = instrumentProgress()['lesson:' + practiceLesson(level).id] || 0;
  $('proBody').innerHTML = `<article class="pro-play">
    <p class="pro-lead">${esc(p.instruccion_pantalla)}</p>
    <div class="pro-chips"><span class="chip">♩ = ${p.bpm_recomendado}</span><span class="chip"><span>${esc(TXT.time)}</span> ${level.time}/4</span>${best ? `<span class="chip">${starsHtml(best)}</span>` : ''}</div>
    <div class="pro-score">${Array.from({ length: lines }, (_, i) => `<svg class="staff" id="proLine${i}" role="img" aria-label="Partitura"></svg>`).join('')}</div>
    <button id="proListen" class="btn ghost small" type="button"><span class="ic">${icon('speaker')}</span><span>${esc(TXT.listen)}</span></button>
    ${noteChips()}
    <h3>${esc(TXT.routine)}</h3>
    <ol class="pro-steps">${p.rutina_pasos.map((s, i) => `<li><label><input type="checkbox" data-step="${i}"><span>${esc(s)}</span></label></li>`).join('')}</ol>
    <section class="pro-block mic"><h3><span class="ic">${icon('notes')}</span>${esc(TXT.mic)}</h3><p>${esc(p.criterio_microfono)}</p></section>
    <div class="pro-actions"><button id="proLearn" class="btn ghost" type="button">${esc(TXT.learnMode)}</button>
    <button id="proTempo" class="btn" type="button"><span class="ic">${icon('play')}</span>${esc(TXT.tempoMode)}</button></div></article>`;
  for (let i = 0; i < lines; i++) {
    const slice = sliceScore(score, i * BARS_PER_LINE, BARS_PER_LINE);
    if (slice) createStaff($(`proLine${i}`)).render(slice, { key: level.key, time: i === 0 ? level.time : null, mode: 'review', clef: level.clef });
  }
  $('proListen').addEventListener('click', () => toggleDemo(score.notes, p.bpm_recomendado));
  const lesson = practiceLesson(level);
  $('proLearn').addEventListener('click', () => launch(lesson, { mode: 'learn', from: 'pro' }));
  $('proTempo').addEventListener('click', () => launch(lesson, { mode: 'tempo', from: 'pro' }));
}

function toggleDemo(notes, bpm) {
  const label = $('proListen').lastChild;
  if (stopDemo) { stopDemo(); stopDemo = null; label.textContent = TXT.listen; return; }
  label.textContent = TXT.stop;
  stopDemo = audio.playScore(notes, bpm, (beat, done) => {
    if (!done) return;
    stopDemo = null;
    if ($('proListen')) $('proListen').lastChild.textContent = TXT.listen;
  });
}

register('pro', { enter, leave });
document.querySelectorAll('[data-pro-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.proTab; render(); }));
