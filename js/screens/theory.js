// Lecciones de teoría: tarjetas con texto y, si hace falta, el diapasón con las notas marcadas.
import { $, esc } from '../ui.js';
import { register, go } from '../router.js';
import { renderFingerboard } from '../fingerboard.js';
import { getState } from '../store.js';
import { finishLesson } from './result.js';

let ctx = null;
let page = 0;

function render() {
  const cards = ctx.lesson.cards;
  const card = cards[page];
  $('theoryProg').style.width = ((page + 1) / cards.length * 100) + '%';
  $('theoryCard').innerHTML = `<p class="eyebrow">${esc(ctx.eyebrow || ctx.lesson.title)} · ${page + 1} de ${cards.length}</p>
    <h1>${esc(card.title)}</h1><p>${esc(card.text)}</p>${card.board ? '<svg class="board" id="theoryBoard" role="img" aria-label="Diapasón"></svg>' : ''}`;
  if (card.board) renderFingerboard($('theoryBoard'), card.board, getState().nom);
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
  finishLesson({ lesson: ctx.lesson, mode: 'learn', from: ctx.from, stars: 3, text: 'Teoría repasada', title: ctx.lesson.title });
});
$('theoryExit').addEventListener('click', () => go('learn'));
