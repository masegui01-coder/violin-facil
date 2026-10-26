// Modo libro de la pestaña Aprender: índice de capítulos y páginas con medallas por repetir, el repaso de hoy
// (vale el doble), el concierto con acompañamiento al final de cada capítulo y el libro para imprimir.
import { $, esc, toast } from '../ui.js';
import { go } from '../router.js';
import { getState, update, today } from '../store.js';
import { instrumentById } from '../instruments.js';
import { lessonTitle, chordText } from '../course.js';
import { currentCourse, currentStates, launch } from '../launch.js';
import { buildFullBook, recordPlay, medalOf, nextGoal, chapterStats, reviewPage, MEDAL_NAME, REPEAT_XP, REVIEW_MULTIPLIER } from '../book.js';

const MEDAL_ICON = { none: '', bronze: '🥉', silver: '🥈', gold: '🥇' };

export const bookPlays = () => (getState().bookPlays || {})[getState().instrument] || {};
const dayStart = () => new Date(`${today()}T00:00:00`).getTime();
const inst = () => instrumentById(getState().instrument);

export const fullBook = () => buildFullBook(currentCourse(), inst());

export const isConcert = (chapter, page) => {
  const songs = chapter.pages.filter(pg => pg.lesson.kind === 'song' && !pg.lesson.chapterReview);
  return songs.length > 0 && songs[songs.length - 1] === page;
};

// Estado de una página: el del curso; el repaso del capítulo se abre cuando se abre la página anterior
export function pageState(chapter, page, states = currentStates()) {
  if (states[page.lesson.id]) return states[page.lesson.id];
  const prev = chapter.pages[chapter.pages.indexOf(page) - 1];
  return prev && pageState(chapter, prev, states) === 'locked' ? 'locked' : 'open';
}

function findPage(book, lessonId) {
  for (const chapter of book) {
    const page = chapter.pages.find(pg => pg.lesson.id === lessonId);
    if (page) return { chapter, page };
  }
  return null;
}

// La página siguiente del libro (para el botón del resultado)
export function nextBookPage(lessonId) {
  const book = fullBook();
  const states = currentStates();
  const flat = book.flatMap(c => c.pages.map(page => ({ chapter: c, page })));
  const next = flat[flat.findIndex(x => x.page.lesson.id === lessonId) + 1];
  return next && pageState(next.chapter, next.page, states) !== 'locked' ? next : null;
}

export const openPage = lessonId => go('bookpage', { lessonId });

export function playPage(chapter, page) {
  if (isConcert(chapter, page) && !getState().accompOn) { update({ accompOn: true }); toast('Concierto: suena la banda contigo. Mejor con auriculares'); }
  launch({ ...page.lesson, bookPage: page.number }, { from: 'book', mode: page.lesson.kind === 'notes' ? 'learn' : undefined });
}

const pageTitle = lesson => chordText(lessonTitle(lesson));
const KIND = { theory: 'Teoría', chords: 'Acordes', song: 'Canción', notes: 'Ejercicio' };

function pageButton(chapter, page, state, p, review) {
  const kind = page.lesson.kind;
  const medal = medalOf(p, kind);
  const locked = state === 'locked';
  const tag = isConcert(chapter, page) ? '<span class="tag">Concierto</span>' : page.lesson.chapterReview ? '<span class="tag">Repaso</span>' : review && review.page === page ? '<span class="tag review">Repaso ×2</span>' : '';
  return `<button type="button" class="book-page ${medal}${locked ? ' locked' : ''}" data-page="${esc(page.lesson.id)}" style="--unit:${chapter.color}">
    <span class="book-num">${page.number}</span>
    <span class="book-text"><b>${tag}${esc(pageTitle(page.lesson))}</b><small>${KIND[kind] || ''}${p && p.plays ? ` · ${p.plays} ${p.plays === 1 ? 'vez' : 'veces'}` : ''}</small></span>
    <span class="book-medal" aria-label="${locked ? 'Bloqueada' : MEDAL_NAME[medal]}">${locked ? '🔒' : MEDAL_ICON[medal] || '○'}</span></button>`;
}

export function renderBook() {
  const box = $('bookView');
  const book = fullBook();
  const states = currentStates();
  const all = bookPlays();
  const review = reviewPage(book, all, dayStart());
  const totals = book.reduce((t, c) => { const s = chapterStats(c, all); return { pages: t.pages + s.total, bronze: t.bronze + s.bronze, silver: t.silver + s.silver, gold: t.gold + s.gold }; }, { pages: 0, bronze: 0, silver: 0, gold: 0 });
  const currentChapter = book.find(c => c.pages.some(pg => pageState(c, pg, states) === 'open' && !all[pg.lesson.id])) || book[0];
  box.innerHTML = `<div class="book-head"><p class="eyebrow">Modo libro</p><h1>El libro de ${esc(inst().name.toLowerCase())}</h1>
      <p class="muted small">Un método de toda la vida, página a página, con partitura, armonización y consejos. Repetir premia: bronce al pasarla, plata al repetirla bien y oro al dominarla.</p>
      <div class="book-tally"><span>🥇 ${totals.gold}</span><span>🥈 ${totals.silver}</span><span>🥉 ${totals.bronze}</span><span class="muted">de ${totals.pages} páginas</span>
        <button type="button" class="btn ghost small" id="bookPrintBtn">Libro en PDF</button></div></div>
    ${review ? `<button type="button" class="book-review" data-page="${esc(review.page.lesson.id)}"><span class="ic">↻</span><div><b>Repaso de hoy · página ${review.page.number}</b>
      <small>${esc(pageTitle(review.page.lesson))} · puntos ×${REVIEW_MULTIPLIER} · ${esc(nextGoal(review.p, review.page.lesson.kind))}</small></div></button>` : ''}
    ${book.map(chapter => {
      const st = chapterStats(chapter, all);
      return `<details class="book-chapter" ${chapter === currentChapter ? 'open' : ''} style="--unit:${chapter.color}">
        <summary><span class="book-chap-num">${chapter.number}</span><span class="book-chap-text"><b>${esc(chapter.title)}</b><small>${esc(chapter.sub)} · ${st.started}/${st.total} páginas${st.gold ? ` · ${st.gold} de oro` : ''}</small></span>
          ${st.stamp ? `<span class="book-stamp ${st.stamp}" title="${st.stamp === 'gold' ? 'Capítulo dominado' : 'Capítulo completado'}">${st.stamp === 'gold' ? '★' : '✓'}</span>` : ''}</summary>
        <div class="book-pages">${chapter.pages.map(page => pageButton(chapter, page, pageState(chapter, page, states), all[page.lesson.id], review)).join('')}</div></details>`;
    }).join('')}`;
  $('bookPrintBtn').addEventListener('click', () => import('./book-page.js').then(m => m.printBook()));
}

$('bookView').addEventListener('click', e => {
  const btn = e.target.closest('[data-page]');
  if (btn) openPage(btn.dataset.page);
});

// Cada vez que se toca una página (desde el libro o desde el curso) cuenta para sus medallas.
// Repasar una página ya pasada da puntos extra; la del repaso de hoy, el doble.
window.addEventListener('lesson-finished', e => {
  const { lesson, stars, mode, speed } = e.detail;
  if (lesson.noRecord || lesson.placement || lesson.daily || !stars) return;
  const s = getState();
  const book = fullBook();
  const hit = findPage(book, lesson.id);
  if (!hit) return;
  const mine = bookPlays();
  const prev = mine[lesson.id];
  const review = reviewPage(book, mine, dayStart());
  const rec = recordPlay(prev, { stars, perfect: stars === 3 && (mode !== 'tempo' || (speed || 1) >= 1), at: Date.now() });
  const before = medalOf(prev, lesson.kind);
  const after = medalOf(rec, lesson.kind);
  const stampBefore = chapterStats(hit.chapter, mine).stamp;
  const nextPlays = { ...mine, [lesson.id]: rec };
  const bonus = prev && prev.best ? REPEAT_XP * (review && review.page.lesson.id === lesson.id ? REVIEW_MULTIPLIER : 1) : 0;
  update({ bookPlays: { ...(s.bookPlays || {}), [s.instrument]: nextPlays }, xp: getState().xp + bonus });
  const stampAfter = chapterStats(hit.chapter, nextPlays).stamp;
  setTimeout(() => {
    if (stampAfter && stampAfter !== stampBefore) toast(stampAfter === 'gold' ? `¡Capítulo ${hit.chapter.number} dominado: todo de oro!` : `¡Sello del capítulo ${hit.chapter.number}!`);
    else if (after !== before && after !== 'bronze') toast(`¡Medalla de ${MEDAL_NAME[after].toLowerCase()} en la página ${hit.page.number}!`);
    else if (bonus) toast(`Repaso: +${bonus} puntos`);
  }, 900);
});
