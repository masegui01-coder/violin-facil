// Método Pro (opcional, no cambia el curso): en Aprender, la vista «Pro» lista los niveles del curso (viento, violín o
// percusión) y cada
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
import { buildMethod, hasMethod, courseIdFor, levelStates, practiceLesson } from '../method.js';
import * as audio from '../audio.js';
import { startRelax, stopRelax } from './pro-relax.js';
import { figureFor } from '../pro-figures.js';
import { sheet } from './band-ui.js';

const BARS_PER_LINE = 2; // en el móvil, dos compases por renglón se leen bien
const XP_PER_STAR = 5;
const TXT = {
  eyebrow: L('Método Pro · Viento', 'Pro method · Winds'), eyebrowViolin: L('Método Pro · Violín', 'Pro method · Violin'),
  eyebrowPerc: L('Método Pro · Percusión', 'Pro method · Percussion'), course: L('Curso 1 · Iniciación', 'Course 1 · Beginner'),
  intro: L('Un camino aparte del curso, para estudiar como en el conservatorio pero desde el móvil. Cada nivel tiene tres pestañas: Libro para entender el solfeo y la técnica, Relax para practicarlo como un juego (leer, escribir notas y marcar ritmos) y Práctica para tocarlo con el micrófono.', 'A path separate from the course, to study as in a music school but from your phone. Each level has three tabs: Book to understand reading and technique, Relax to practise it as a game (reading, writing notes and tapping rhythms) and Practice to play it with the microphone.'),
  notWind: L('El método Pro está, de momento, para violín, percusión e instrumentos de viento. Elige uno de ellos en tu perfil para verlo.', 'The Pro method is, for now, for violin, percussion and wind instruments. Choose one of them in your profile to see it.'),
  introPerc: L('Un camino aparte del curso para aprender caja como en el conservatorio, pero jugando. Libro para entender el ritmo y la técnica de baquetas, Relax para practicarlo como un videojuego (ordenar las manos, tocar con dos pads, sumar rachas) y Práctica para tocarlo en el pad con el micrófono.', 'A path separate from the course to learn snare as in a music school, but playing. Book to understand rhythm and stick technique, Relax to practise it like a video game (ordering hands, playing two pads, building streaks) and Practice to play it on the pad with the microphone.'),
  hands: L('Las manos de este nivel', 'The sticking in this level'), surface: L('Superficie:', 'Surface:'), bestPoints: L('Tu récord:', 'Your record:'), points: L('puntos', 'points'),
  playMic: L('Tocar con el micrófono', 'Play with the microphone'),
  level: L('Nivel', 'Level'), locked: L('Termina el nivel anterior para abrirlo', 'Finish the previous level to open it'),
  book: L('Libro', 'Book'), relax: L('Relax', 'Relax'), play: L('Práctica', 'Practice'),
  theory: L('Solfeo', 'Music reading'), technique: L('Tu instrumento', 'Your instrument'), tip: L('Consejo', 'Tip'),
  notes: L('Las notas de este nivel', 'The notes in this level'), goRelax: L('Ir a Relax', 'Go to Relax'),
  relaxIntro: L('Retos rápidos de solfeo y técnica: lee, escribe en el pentagrama y marca ritmos. Los fallos vuelven al final para que los repases.', 'Quick reading and technique challenges: read, write on the staff and tap rhythms. Mistakes come back at the end so you can review them.'),
  challenges: L('Retos:', 'Challenges:'), best: L('Tu mejor resultado:', 'Your best result:'), startRelax: L('Empezar', 'Start'),
  tempo: L('Tempo', 'Tempo'), time: L('Compás', 'Time'), routine: L('Rutina', 'Routine'), mic: L('Qué escucha la app', 'What the app listens for'),
  listen: L('Escuchar', 'Listen'), stop: L('Parar', 'Stop'), learnMode: L('Nota a nota', 'Note by note'), tempoMode: L('Tocar a tempo', 'Play in tempo'),
  done: L('Hecho', 'Done'),
  lockedTitle: L('Este nivel aún está bloqueado', 'This level is still locked'),
  lockedText: L('Lo normal es llegar aquí terminando el nivel anterior, pero puedes verlo ya en modo tester: se abre sin cambiar tu progreso.', 'Normally you get here by finishing the previous level, but you can look at it now in tester mode: it opens without changing your progress.'),
  peek: L('Verlo en modo tester', 'View in tester mode'), cancel: L('Ahora no', 'Not now'),
  figure: L('Míralo en el pentagrama', 'See it on the staff'), playFig: L('Escuchar el ejemplo', 'Listen to the example'),
  practiseIt: L('Practícalo en Relax', 'Practise it in Relax'), playIt: L('Tócalo en Práctica', 'Play it in Practice'),
};

let level = null;      // nivel abierto
let tab = 'book';
let stopDemo = null;

const inst = () => instrumentById(getState().instrument);
const EYEBROW = { violin: 'eyebrowViolin', percusion: 'eyebrowPerc' };
const eyebrow = () => TXT[EYEBROW[courseIdFor(inst())] || 'eyebrow'];
const isPerc = () => courseIdFor(inst()) === 'percusion';
const levels = () => buildMethod(inst(), getState().nom);
const saved = () => (getState().pro || {})[getState().instrument] || {};
const statesOf = list => levelStates(list, saved(), instrumentProgress(), getState().unlockAll || getState().proTester);

// ---------- Lista de niveles (dentro de Aprender) ----------
export function renderPro() {
  const box = $('proView');
  if (!hasMethod(inst())) {
    box.innerHTML = `<div class="pro-hero"><p class="eyebrow">${esc(TXT.eyebrow)}</p><h2>${esc(TXT.course)}</h2><p>${esc(TXT.notWind)}</p></div>`;
    return;
  }
  const list = levels();
  const states = statesOf(list);
  const done = list.filter(l => states[l.leccion_id].state === 'done').length;
  box.innerHTML = `<div class="pro-hero"><p class="eyebrow">${esc(eyebrow())}</p><h2>${esc(TXT.course)}</h2><p>${esc(isPerc() ? TXT.introPerc : TXT.intro)}</p>
      <div class="progress"><i style="width:${Math.round(done / list.length * 100)}%"></i></div><span class="unit-pct">${done}/${list.length}</span></div>
    <div class="pro-levels">${list.map(l => levelCard(l, states[l.leccion_id])).join('')}</div>`;
  box.querySelectorAll('[data-pro]').forEach(b => b.addEventListener('click', () => {
    if (states[b.dataset.pro].state === 'locked') askPeek(b.dataset.pro);
    else go('pro', { id: b.dataset.pro });
  }));
}

// Nivel cerrado: se puede abrir igualmente para verlo (modo tester), sin marcarlo como hecho
function askPeek(id) {
  sheet(`<h2><span class="ic">${icon('lock')}</span> ${esc(TXT.lockedTitle)}</h2><p>${esc(TXT.lockedText)}</p>
    <div class="row"><button type="button" class="btn ghost" data-close>${esc(TXT.cancel)}</button><button type="button" class="btn" id="proPeek">${esc(TXT.peek)}</button></div>`, box => {
    box.querySelector('#proPeek').addEventListener('click', () => { document.getElementById('sheet').close(); go('pro', { id }); });
  });
}

function levelCard(l, st) {
  const locked = st.state === 'locked';
  const pill = (on, ic, label, stars) => `<span class="pro-pill${on ? ' on' : ''}"><span class="ic">${icon(ic)}</span>${esc(label)}${stars ? starsHtml(stars) : ''}</span>`;
  return `<button type="button" class="pro-level ${st.state}" data-pro="${l.leccion_id}">
    <span class="pro-num">${locked ? `<span class="ic">${icon('lock')}</span>` : l.nivel}</span>
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
  $('proEyebrow').innerHTML = `<span>${esc(eyebrow())}</span> · <span>${esc(TXT.level)}</span> ${level.nivel}`;
  $('proTitle').textContent = level.titulo_leccion;
  render();
}

function leave() {
  stopRelax();
  if (stopDemo) { stopDemo(); stopDemo = null; }
}

function render() {
  document.querySelectorAll('[data-pro-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.proTab === tab)));
  leave();
  if (tab === 'book') renderBook();
  else if (tab === 'relax') renderRelaxIntro();
  else renderPractice();
  $('pro').scrollTop = 0;
  window.scrollTo(0, 0);
}

function noteChips() {
  if (level.patron) return `<div class="pro-chips hands">${level.patron.map(h => `<span class="chip hand ${h}">${h}</span>`).join('')}</div>`;
  return `<div class="pro-chips">${level.pestana_practica.notas_usadas.map(n => `<span class="chip">${esc(n)}</span>`).join('')}</div>`;
}

function renderBook() {
  const b = level.pestana_libro;
  const fig = figureFor(level, inst(), getState().nom);
  $('proBody').innerHTML = `<article class="pro-book">
    <p class="pro-lead">${esc(b.descripcion)}</p>
    <section class="pro-block solfeo"><h3>${esc(TXT.theory)}</h3><p>${esc(b.bloque_teoria_solfeo)}</p>
      ${fig ? `<figure class="pro-figure"><figcaption class="eyebrow">${esc(TXT.figure)}</figcaption>${fig.svg}<p class="muted">${esc(fig.caption)}</p></figure>` : ''}
      <div class="pro-links">${fig ? `<button type="button" class="btn ghost small" id="proFigPlay"><span class="ic">${icon('speaker')}</span><span>${esc(TXT.playFig)}</span></button>` : ''}
      <button type="button" class="btn ghost small" data-goto="relax"><span>${esc(TXT.practiseIt)}</span> ›</button></div></section>
    <section class="pro-block tecnica"><h3><span>${esc(TXT.technique)}</span> · <span>${esc(inst().name)}</span></h3><p>${esc(b.bloque_tecnica_instrumento)}</p>
      <div class="pro-links"><button type="button" class="btn ghost small" data-goto="play"><span>${esc(TXT.playIt)}</span> ›</button></div></section>
    <section class="pro-block consejo"><h3>${esc(TXT.tip)}</h3><p>${esc(b.consejo_unificado)}</p></section>
    <h3>${esc(level.patron ? TXT.hands : TXT.notes)}</h3>${noteChips()}
    <button id="proGoRelax" class="btn" type="button"><span>${esc(TXT.goRelax)}</span> ›</button></article>`;
  recordPro(level.leccion_id, { book: true });
  $('proGoRelax').addEventListener('click', () => { tab = 'relax'; render(); });
  $('proBody').querySelectorAll('[data-goto]').forEach(btn => btn.addEventListener('click', () => { tab = btn.dataset.goto; render(); }));
  if (fig) $('proFigPlay').addEventListener('click', () => toggleDemo(parseScore(fig.play).notes, level.pestana_practica.bpm_recomendado, 'proFigPlay'));
}

function renderRelaxIntro() {
  const mine = saved()[level.leccion_id] || {};
  const best = mine.relax || 0;
  $('proBody').innerHTML = `<div class="pro-relax-intro"><p>${esc(TXT.relaxIntro)}</p>
    <p class="muted"><span>${esc(TXT.challenges)}</span> ${level.pestana_relax.length}</p>
    ${best ? `<p class="muted"><span>${esc(TXT.best)}</span> ${starsHtml(best)}</p>` : ''}
    ${mine.score ? `<p class="muted"><span>${esc(TXT.bestPoints)}</span> ${mine.score} <span>${esc(TXT.points)}</span></p>` : ''}
    <button id="proStartRelax" class="btn" type="button"><span class="ic">${icon('play')}</span>${esc(TXT.startRelax)}</button></div>`;
  $('proStartRelax').addEventListener('click', () => startRelax(level, finishRelax, { best: mine.score || 0 }));
}

function finishRelax({ stars, minutes, points, again }) {
  const prev = (saved()[level.leccion_id] || {}).score || 0;
  recordPro(level.leccion_id, { relax: stars, score: Math.max(prev, points) });
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
    <div class="pro-chips"><span class="chip">♩ = ${p.bpm_recomendado}</span><span class="chip"><span>${esc(TXT.time)}</span> ${level.time}/4</span>${p.superficie_recomendada ? `<span class="chip"><span>${esc(TXT.surface)}</span> <span>${esc(p.superficie_recomendada)}</span></span>` : ''}${best ? `<span class="chip">${starsHtml(best)}</span>` : ''}</div>
    <div class="pro-score">${Array.from({ length: lines }, (_, i) => `<svg class="staff" id="proLine${i}" role="img" aria-label="Partitura"></svg>`).join('')}</div>
    <button id="proListen" class="btn ghost small" type="button"><span class="ic">${icon('speaker')}</span><span>${esc(TXT.listen)}</span></button>
    ${noteChips()}
    <h3>${esc(TXT.routine)}</h3>
    <ol class="pro-steps">${p.rutina_pasos.map((s, i) => `<li><label><input type="checkbox" data-step="${i}"><span>${esc(s)}</span></label></li>`).join('')}</ol>
    <section class="pro-block mic"><h3><span class="ic">${icon('notes')}</span>${esc(TXT.mic)}</h3><p>${esc(p.criterio_microfono || p.criterio_microfono_hz || p.criterio_microfono_ritmo)}</p></section>
    <div class="pro-actions">${level.sticking ? `<button id="proTempo" class="btn" type="button"><span class="ic">${icon('play')}</span>${esc(TXT.playMic)}</button>`
      : `<button id="proLearn" class="btn ghost" type="button">${esc(TXT.learnMode)}</button>
    <button id="proTempo" class="btn" type="button"><span class="ic">${icon('play')}</span>${esc(TXT.tempoMode)}</button>`}</div></article>`;
  let stroke = 0; // la mano de cada golpe sigue de un renglón al siguiente
  for (let i = 0; i < lines; i++) {
    const slice = sliceScore(score, i * BARS_PER_LINE, BARS_PER_LINE);
    if (!slice) continue;
    const strokes = slice.notes.filter(n => !n.rest).length;
    const sticking = level.sticking ? level.sticking.slice(stroke, stroke + strokes) : null;
    stroke += strokes;
    createStaff($(`proLine${i}`)).render(slice, { key: level.key, time: i === 0 ? level.time : null, mode: 'review', clef: level.clef, sticking });
  }
  $('proListen').addEventListener('click', () => toggleDemo(score.notes, p.bpm_recomendado, 'proListen'));
  const lesson = practiceLesson(level);
  if (!level.sticking) $('proLearn').addEventListener('click', () => launch(lesson, { mode: 'learn', from: 'pro' }));
  $('proTempo').addEventListener('click', () => launch(lesson, { mode: 'tempo', from: 'pro' }));
}

// Caja para «Escuchar» en percusión: golpes con sus acentos y los flams, programados poco a poco
const DRUM_LOOKAHEAD_S = 0.3;
const FLAM_S = 0.035;
function playDrums(notes, bpm, onDone) {
  const spb = 60 / bpm;
  const t0 = audio.audioTime() + 0.15;
  const hits = notes.filter(n => !n.rest).flatMap(n => [
    ...(n.grace || []).map(() => ({ time: t0 + n.start * spb - FLAM_S, accent: false, gain: 0.4 })),
    { time: t0 + n.start * spb, accent: n.accent, gain: n.accent ? 1 : 0.6 },
  ]);
  const last = hits.length ? hits[hits.length - 1].time : t0;
  let i = 0;
  const timer = setInterval(() => {
    const until = audio.audioTime() + DRUM_LOOKAHEAD_S;
    for (; i < hits.length && hits[i].time < until; i++) audio.drumHit(hits[i].time, hits[i].accent, hits[i].gain);
    if (i >= hits.length && audio.audioTime() > last + DRUM_LOOKAHEAD_S) { clearInterval(timer); onDone(); }
  }, 100);
  return () => clearInterval(timer);
}

// Escuchar/Parar en el botón indicado (su último <span> lleva el texto)
function toggleDemo(notes, bpm, buttonId) {
  const btn = $(buttonId);
  const label = btn.lastElementChild;
  const idle = label.textContent;
  if (stopDemo) { stopDemo(); stopDemo = null; label.textContent = btn.dataset.idle || idle; return; }
  btn.dataset.idle = idle;
  label.textContent = TXT.stop;
  const finished = () => {
    stopDemo = null;
    if (document.body.contains(btn)) label.textContent = btn.dataset.idle;
  };
  stopDemo = isPerc() ? playDrums(notes, bpm, finished) : audio.playScore(notes, bpm, (beat, done) => { if (done) finished(); });
}

register('pro', { enter, leave });
document.querySelectorAll('[data-pro-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.proTab; render(); }));
