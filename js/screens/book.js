// Modo libro de la pestaña Aprender: los tres libros de tu instrumento (Iniciación, Elemental e Intermedio)
// con capítulos, páginas con medallas por repetir, el repaso de hoy (vale el doble), conciertos con acompañamiento
// y un examen al final de cada libro que abre el siguiente.
import { $, esc, toast } from '../ui.js';
import { go } from '../router.js';
import { getState, update, today } from '../store.js';
import { instrumentById } from '../instruments.js';
import { lessonTitle, chordText } from '../course.js';
import { currentCourse, currentStates, launch } from '../launch.js';
import { recordPlay, medalOf, nextGoal, chapterStats, reviewPage, MEDAL_NAME, REPEAT_XP, REVIEW_MULTIPLIER } from '../book.js';
import { buildLibrary, bookOpen, EXAM_PASS_STARS } from '../books.js';

const MEDAL_ICON = { none: '', bronze: '🥉', silver: '🥈', gold: '🥇' };
const KIND = { theory: 'Teoría', chords: 'Acordes', song: 'Partitura', notes: 'Ejercicio' };

export const bookPlays = () => (getState().bookPlays || {})[getState().instrument] || {};
const dayStart = () => new Date(`${today()}T00:00:00`).getTime();
const inst = () => instrumentById(getState().instrument);
const unlockedBooks = () => (getState().booksUnlocked || {})[getState().instrument] || {};
export const shelfIndex = () => Math.min(2, Math.max(0, ((getState().bookShelf || {})[getState().instrument] || 1) - 1));

// La biblioteca se genera a partir del curso: se guarda mientras no cambien el instrumento ni los estilos
let cache = { key: '', library: null };
export function library() {
  const s = getState();
  const key = `${s.instrument}|${(s.styles || []).join(',')}`;
  if (cache.key !== key) cache = { key, library: buildLibrary(currentCourse(), inst()) };
  return cache.library;
}

const flatOf = book => book.chapters.flatMap(chapter => chapter.pages.map(page => ({ book, chapter, page })));

export function findInLibrary(lessonId) {
  for (const book of library()) {
    const flat = flatOf(book);
    const i = flat.findIndex(x => x.page.lesson.id === lessonId);
    if (i >= 0) return { ...flat[i], flat, index: i };
  }
  return null;
}

export const isConcert = (chapter, page) => {
  if (page.lesson.concert) return true;
  const songs = chapter.pages.filter(pg => pg.lesson.kind === 'song' && !pg.lesson.chapterReview && !pg.lesson.id.includes('-ej') && !pg.lesson.id.includes('-mel'));
  return /^b\d-/.test(chapter.id) ? false : songs.length > 0 && songs[songs.length - 1] === page;
};

const isOpen = n => bookOpen(n, bookPlays(), { unlockAll: getState().unlockAll, unlocked: unlockedBooks() });

// Estado de una página. Libro 1: el del curso (y las páginas añadidas siguen a la anterior).
// Libros 2 y 3: cerrados hasta aprobar el examen anterior; dentro, cada página se abre al tocar la anterior.
export function pageState(hit, states = currentStates()) {
  const { book, page, flat, index } = hit;
  const plays = bookPlays();
  if (plays[page.lesson.id] && plays[page.lesson.id].best > 0) return 'done';
  if (!isOpen(book.n)) return 'locked';
  if (book.n === 1 && states[page.lesson.id]) return states[page.lesson.id];
  if (index === 0 || getState().unlockAll) return 'open';
  const prev = flat[index - 1];
  if (book.n === 1) return pageState({ ...hit, ...prev, index: index - 1 }, states) === 'locked' ? 'locked' : 'open';
  return plays[prev.page.lesson.id] && plays[prev.page.lesson.id].best > 0 ? 'open' : 'locked';
}

// La página siguiente (para el botón del resultado)
export function nextBookPage(lessonId) {
  const hit = findInLibrary(lessonId);
  if (!hit || !hit.flat[hit.index + 1]) return null;
  const next = { ...hit.flat[hit.index + 1], flat: hit.flat, index: hit.index + 1 };
  return pageState(next) !== 'locked' ? next : null;
}

export const openPage = lessonId => go('bookpage', { lessonId });

export function playPage(chapter, page) {
  if (isConcert(chapter, page) && !getState().accompOn) { update({ accompOn: true }); toast('Concierto: suena la banda contigo. Mejor con auriculares'); }
  launch({ ...page.lesson, bookPage: page.number }, { from: 'book', mode: page.lesson.kind === 'notes' ? 'learn' : undefined });
}

const pageTitle = lesson => chordText(lessonTitle(lesson));

function pageButton(hit, state, p, review) {
  const { chapter, page } = hit;
  const kind = page.lesson.kind;
  const medal = medalOf(p, kind);
  const locked = state === 'locked';
  const tag = page.lesson.exam ? '<span class="tag">Examen</span>' : isConcert(chapter, page) ? '<span class="tag">Concierto</span>'
    : page.lesson.chapterReview ? '<span class="tag">Repaso</span>' : review && review.page === page ? '<span class="tag review">Repaso ×2</span>' : '';
  return `<button type="button" class="book-page ${medal}${locked ? ' locked' : ''}" data-page="${esc(page.lesson.id)}" style="--unit:${chapter.color}">
    <span class="book-num">${page.number}</span>
    <span class="book-text"><b>${tag}${esc(pageTitle(page.lesson))}</b><small>${page.lesson.language ? 'Lenguaje musical' : KIND[kind] || ''}${p && p.plays ? ` · ${p.plays} ${p.plays === 1 ? 'vez' : 'veces'}` : ''}</small></span>
    <span class="book-medal" aria-label="${locked ? 'Bloqueada' : MEDAL_NAME[medal]}">${locked ? '🔒' : MEDAL_ICON[medal] || '○'}</span></button>`;
}

function shelfHtml(books, current) {
  return `<div class="book-shelf" role="tablist" aria-label="Libros">${books.map((b, i) => `<button type="button" role="tab" class="book-spine${i === current ? ' on' : ''}" data-book="${b.n}" aria-selected="${i === current}">
    <b>Libro ${b.n}</b><small>${esc(b.title.split('· ')[1])}</small>${isOpen(b.n) ? '' : '<span aria-label="Cerrado">🔒</span>'}</button>`).join('')}</div>`;
}

export function renderBook() {
  const box = $('bookView');
  const books = library();
  const current = shelfIndex();
  const book = books[current];
  const flat = flatOf(book);
  const states = currentStates();
  const all = bookPlays();
  const open = isOpen(book.n);
  const review = open ? reviewPage(book.chapters, all, dayStart()) : null;
  const totals = book.chapters.reduce((t, c) => { const s = chapterStats(c, all); return { pages: t.pages + s.total, bronze: t.bronze + s.bronze, silver: t.silver + s.silver, gold: t.gold + s.gold }; }, { pages: 0, bronze: 0, silver: 0, gold: 0 });
  const stateOf = page => { const i = flat.findIndex(x => x.page === page); return pageState({ ...flat[i], flat, index: i }, states); };
  const currentChapter = book.chapters.find(c => c.pages.some(pg => stateOf(pg) === 'open')) || book.chapters[0];
  box.innerHTML = `${shelfHtml(books, current)}
    <div class="book-head"><p class="eyebrow">Modo libro · ${esc(inst().name)}</p><h1>${esc(book.title)}</h1>
      <p class="muted small">${esc(book.sub)}. Página a página, con partitura, armonización, teoría y consejos. Repetir premia: bronce al pasarla, plata al repetirla bien y oro al dominarla.</p>
      <div class="book-tally"><span>🥇 ${totals.gold}</span><span>🥈 ${totals.silver}</span><span>🥉 ${totals.bronze}</span><span class="muted">de ${totals.pages} páginas</span>
        <button type="button" class="btn ghost small" id="bookPrintBtn">Libro en PDF</button></div></div>
    ${open ? '' : `<div class="panel book-locked"><b>Este libro se abre al aprobar el examen del Libro ${book.n - 1}</b>
      <span class="muted small">Está al final del Libro ${book.n - 1}: preguntas de lenguaje musical y una lectura. ¿Ya tocas a este nivel? Puedes abrirlo directamente.</span>
      <button type="button" class="btn ghost small" id="bookForceOpen">Abrirlo ya</button></div>`}
    ${review ? `<button type="button" class="book-review" data-page="${esc(review.page.lesson.id)}"><span class="ic">↻</span><div><b>Repaso de hoy · página ${review.page.number}</b>
      <small>${esc(pageTitle(review.page.lesson))} · puntos ×${REVIEW_MULTIPLIER} · ${esc(nextGoal(review.p, review.page.lesson.kind))}</small></div></button>` : ''}
    ${book.chapters.map(chapter => {
      const st = chapterStats(chapter, all);
      return `<details class="book-chapter" ${chapter === currentChapter ? 'open' : ''} style="--unit:${chapter.color}">
        <summary><span class="book-chap-num">${chapter.number}</span><span class="book-chap-text"><b>${esc(chapter.title)}</b><small>${esc(chapter.sub)} · ${st.started}/${st.total} páginas${st.gold ? ` · ${st.gold} de oro` : ''}</small></span>
          ${st.stamp ? `<span class="book-stamp ${st.stamp}" title="${st.stamp === 'gold' ? 'Capítulo dominado' : 'Capítulo completado'}">${st.stamp === 'gold' ? '★' : '✓'}</span>` : ''}</summary>
        <div class="book-pages">${chapter.pages.map(page => pageButton({ chapter, page }, stateOf(page), all[page.lesson.id], review)).join('')}</div></details>`;
    }).join('')}`;
  $('bookPrintBtn').addEventListener('click', () => import('./book-page.js').then(m => m.printBook(book)));
  const force = $('bookForceOpen');
  if (force) force.addEventListener('click', () => {
    const s = getState();
    update({ booksUnlocked: { ...(s.booksUnlocked || {}), [s.instrument]: { ...unlockedBooks(), [book.n]: true } } });
    renderBook();
  });
}

$('bookView').addEventListener('click', e => {
  const spine = e.target.closest('[data-book]');
  if (spine) {
    const s = getState();
    update({ bookShelf: { ...(s.bookShelf || {}), [s.instrument]: Number(spine.dataset.book) } });
    renderBook();
    return;
  }
  const btn = e.target.closest('[data-page]');
  if (btn) openPage(btn.dataset.page);
});

// Cada vez que se toca una página (desde el libro o desde el curso) cuenta para sus medallas.
// Repasar una página ya pasada da puntos extra; la del repaso de hoy, el doble. Aprobar un examen abre el libro siguiente.
window.addEventListener('lesson-finished', e => {
  const { lesson, stars, mode, speed } = e.detail;
  if (lesson.noRecord || lesson.placement || lesson.daily || !stars) return;
  const s = getState();
  const hit = findInLibrary(lesson.id);
  if (!hit) return;
  const mine = bookPlays();
  const prev = mine[lesson.id];
  const review = reviewPage(hit.book.chapters, mine, dayStart());
  const rec = recordPlay(prev, { stars, perfect: stars === 3 && (mode !== 'tempo' || (speed || 1) >= 1), at: Date.now() });
  const before = medalOf(prev, lesson.kind);
  const after = medalOf(rec, lesson.kind);
  const stampBefore = chapterStats(hit.chapter, mine).stamp;
  const nextPlays = { ...mine, [lesson.id]: rec };
  const bonus = prev && prev.best ? REPEAT_XP * (review && review.page.lesson.id === lesson.id ? REVIEW_MULTIPLIER : 1) : 0;
  update({ bookPlays: { ...(s.bookPlays || {}), [s.instrument]: nextPlays }, xp: getState().xp + bonus });
  const stampAfter = chapterStats(hit.chapter, nextPlays).stamp;
  const passed = lesson.exam && stars >= EXAM_PASS_STARS && !(prev && prev.best >= EXAM_PASS_STARS);
  setTimeout(() => {
    if (passed) toast(hit.book.n < 3 ? `¡Examen aprobado! Se abre el Libro ${hit.book.n + 1}` : '¡Examen aprobado! Has terminado los tres libros');
    else if (stampAfter && stampAfter !== stampBefore) toast(stampAfter === 'gold' ? `¡Capítulo ${hit.chapter.number} dominado: todo de oro!` : `¡Sello del capítulo ${hit.chapter.number}!`);
    else if (after !== before && after !== 'bronze') toast(`¡Medalla de ${MEDAL_NAME[after].toLowerCase()} en la página ${hit.page.number}!`);
    else if (bonus) toast(`Repaso: +${bonus} puntos`);
  }, 900);
});
