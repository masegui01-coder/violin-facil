// Lecciones de teoría: tarjetas con texto (y el diapasón con las notas marcadas o el diagrama de un acorde)
// y, en las píldoras, 1-2 preguntas al final, algunas con sonido.
import { isFretted } from '../chords.js';
import { $, esc, icon } from '../ui.js';
import { register, go, originTab } from '../router.js';
import { renderDiagram } from '../keydiagram.js';
import { drawChord } from '../boards.js';
import { chordText, lessonTitle } from '../course.js';
import { resolveQuestion } from '../theory-pills.js';
import * as audio from '../audio.js';
import { getState, recordTheoryAnswer } from '../store.js';
import { finishLesson } from './result.js';

const SEQUENCE_GAP_MS = 900;
const TONE_S = 1.2;

let ctx = null;
let page = 0;
let questions = [];
let answers = [];

const cardCount = () => ctx.lesson.cards.length;
const total = () => cardCount() + questions.length;

// Notas REALES: [60, 64, 67] suena a la vez; [[65], [66]] suena una detrás de otra
function playQuestion(play) {
  const groups = Array.isArray(play[0]) ? play : [play];
  groups.forEach((g, i) => setTimeout(() => audio.playChord(g, TONE_S), i * SEQUENCE_GAP_MS));
}

function renderCard(card) {
  const { instrument, nom } = getState();
  $('theoryCard').innerHTML = `<p class="eyebrow">${esc(ctx.eyebrow || lessonTitle(ctx.lesson))} · ${page + 1} de ${total()}</p>
    <h1>${esc(chordText(card.title))}</h1><p>${esc(chordText(card.text))}</p>${card.board || card.chord ? `<svg class="board${card.chord && isFretted(instrument) ? ' chord-board' : ''}" id="theoryBoard" role="img" aria-label="Diagrama"></svg>` : ''}`;
  if (card.chord) drawChord($('theoryBoard'), card.chord, instrument, nom);
  else if (card.board) renderDiagram($('theoryBoard'), instrument, card.board, nom);
}

function renderQuestion(i) {
  const q = questions[i];
  const a = answers[i];
  $('theoryCard').innerHTML = `<p class="eyebrow">${ctx.lesson.review ? 'Repaso · ' + esc(q.pillTitle || '') : `Pregunta ${i + 1} de ${questions.length}`}</p>
    <h1>${esc(q.q)}</h1>
    ${q.play ? `<button type="button" class="btn ghost small quiz-play" data-play><span class="ic">${icon('speaker')}</span>Escuchar</button>` : ''}
    <div class="quiz-options" role="group" aria-label="Respuestas">${q.options.map((o, k) => {
      const cls = a ? (k === q.answer ? ' right' : k === a.chosen ? ' wrong' : '') : '';
      return `<button type="button" class="quiz-opt${cls}" data-opt="${k}" ${a ? 'disabled' : ''}>${esc(o)}</button>`;
    }).join('')}</div>
    ${a ? `<p class="quiz-why ${a.right ? 'right' : 'wrong'}">${a.right ? '¡Correcto! ' : 'No exactamente. '}${esc(q.why)}</p>` : ''}`;
  const play = $('theoryCard').querySelector('[data-play]');
  if (play) {
    play.addEventListener('click', () => playQuestion(q.play));
    if (!a) playQuestion(q.play);
  }
  $('theoryCard').querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => answer(i, Number(b.dataset.opt))));
}

function answer(i, chosen) {
  if (answers[i]) return;
  const right = chosen === questions[i].answer;
  answers[i] = { chosen, right };
  recordTheoryAnswer(questions[i].id, right);
  render();
}

function render() {
  $('theoryProg').style.width = ((page + 1) / total() * 100) + '%';
  if (page < cardCount()) renderCard(ctx.lesson.cards[page]);
  else renderQuestion(page - cardCount());
  $('theoryPrev').disabled = page === 0;
  $('theoryNext').disabled = page >= cardCount() && !answers[page - cardCount()];
  $('theoryNext').textContent = page === total() - 1 ? 'Terminar' : 'Siguiente';
}

// Todas bien a la primera: 3 estrellas. Si fallas alguna, 2 (y esa pregunta vuelve antes en el repaso)
function finish() {
  const right = answers.filter(a => a.right).length;
  const allRight = right === questions.length;
  const text = !questions.length ? 'Teoría repasada' : allRight ? '¡Todas las preguntas bien!' : `${right} de ${questions.length} bien: la repasaremos en tu rutina`;
  finishLesson({ lesson: ctx.lesson, mode: 'learn', from: ctx.from, stars: allRight ? 3 : 2, text, title: lessonTitle(ctx.lesson) });
}

function enter(params) {
  ctx = params;
  page = 0;
  questions = (ctx.lesson.quiz || []).map(q => resolveQuestion(q));
  answers = [];
  render();
}

register('theory', { enter });

$('theoryPrev').addEventListener('click', () => { if (page > 0) { page--; render(); } });
$('theoryNext').addEventListener('click', () => {
  if (page < total() - 1) { page++; render(); return; }
  finish();
});
$('theoryExit').addEventListener('click', () => go(originTab(ctx && ctx.from)));
