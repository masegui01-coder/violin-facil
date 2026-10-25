// Lecciones de teoría: tarjetas con texto y, si hace falta, el diapasón con las notas marcadas o el diagrama de un acorde.
import { $, esc } from '../ui.js';
import { register, go } from '../router.js';
import { renderDiagram } from '../keydiagram.js';
import { drawChord } from '../boards.js';
import { chordText, lessonTitle } from '../course.js';
import { getState } from '../store.js';
import { finishLesson } from './result.js';

let ctx = null;
let page = 0;

function render() {
  const cards = ctx.lesson.cards;
  const card = cards[page];
  $('theoryProg').style.width = ((page + 1) / cards.length * 100) + '%';
  const { instrument, nom } = getState();
  $('theoryCard').innerHTML = `<p class="eyebrow">${esc(ctx.eyebrow || lessonTitle(ctx.lesson))} · ${page + 1} de ${cards.length}</p>
    <h1>${esc(chordText(card.title))}</h1><p>${esc(chordText(card.text))}</p>${card.board || card.chord ? `<svg class="board${card.chord && instrument === 'guitar' ? ' chord-board' : ''}" id="theoryBoard" role="img" aria-label="Diagrama"></svg>` : ''}`;
  if (card.chord) drawChord($('theoryBoard'), card.chord, instrument, nom);
  else if (card.board) renderDiagram($('theoryBoard'), instrument, card.board, nom);
  $('theoryPrev').disabled = page === 0;
  $('theoryNext').textContent = page === cards.length - 1 ? 'Terminar' : 'Siguiente';
}

function enter(params) {
  ctx = params;
  page = 0;
  render();
}

register('theory', { enter });

$('theoryPrev').addEventListener('click', () => { if (page > 0) { page--; render(); } });
$('theoryNext').addEventListener('click', () => {
  if (page < ctx.lesson.cards.length - 1) { page++; render(); return; }
  finishLesson({ lesson: ctx.lesson, mode: 'learn', from: ctx.from, stars: 3, text: 'Teoría repasada', title: lessonTitle(ctx.lesson) });
});
$('theoryExit').addEventListener('click', () => go('learn'));
