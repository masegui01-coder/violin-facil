// Modo libro de la pestaña Aprender: capítulos y páginas numeradas con medallas por repetir,
// el repaso de hoy (vale el doble) y un concierto con acompañamiento al final de cada capítulo.
import { $, esc, toast } from '../ui.js';
import { getState, update, today } from '../store.js';
import { instrumentById } from '../instruments.js';
import { lessonTitle, chordText } from '../course.js';
import { currentCourse, currentStates, launch } from '../launch.js';
import { buildBook, recordPlay, medalOf, nextGoal, chapterStats, reviewPage, MEDAL_NAME, REPEAT_XP, REVIEW_MULTIPLIER } from '../book.js';
import { sheet } from './band-ui.js';

const MEDAL_ICON = { none: '', bronze: '🥉', silver: '🥈', gold: '🥇' };
const PLAYABLE = ['notes', 'song'];

const plays = () => (getState().bookPlays || {})[getState().instrument] || {};
const dayStart = () => new Date(`${today()}T00:00:00`).getTime();
const isConcert = (chapter, page) => {
  const songs = chapter.pages.filter(pg => pg.lesson.kind === 'song');
  return songs.length > 0 && songs[songs.length - 1] === page;
};

function current() {
  const course = currentCourse();
  return { book: buildBook(course), states: currentStates(course) };
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
  const { book, states } = current();
  const flat = book.flatMap(c => c.pages.map(page => ({ chapter: c, page })));
  const i = flat.findIndex(x => x.page.lesson.id === lessonId);
  const next = flat[i + 1];
  return next && states[next.page.lesson.id] !== 'locked' ? next : null;
}

export function openPage(lessonId) {
  const { book } = current();
  const hit = findPage(book, lessonId);
  if (hit) playPage(hit.chapter, hit.page);
}

function playPage(chapter, page) {
  const concert = isConcert(chapter, page);
  if (concert && !getState().accompOn) { update({ accompOn: true }); toast('Concierto: suena la banda contigo. Mejor con auriculares'); }
  launch({ ...page.lesson, bookPage: page.number }, { from: 'book', mode: page.lesson.kind === 'notes' ? 'learn' : undefined });
}

const pageTitle = lesson => chordText(lessonTitle(lesson));

function pageButton(chapter, page, states, p, review) {
  const kind = page.lesson.kind;
  const medal = medalOf(p, kind);
  const locked = states[page.lesson.id] === 'locked';
  const concert = isConcert(chapter, page);
  const tag = concert ? '<span class="tag">Concierto</span>' : review && review.page === page ? '<span class="tag review">Repaso ×2</span>' : '';
  return `<button type="button" class="book-page ${medal}${locked ? ' locked' : ''}" data-page="${esc(page.lesson.id)}" style="--unit:${chapter.color}">
    <span class="book-num">${page.number}</span>
    <span class="book-text"><b>${tag}${esc(pageTitle(page.lesson))}</b><small>${kind === 'theory' ? 'Teoría' : kind === 'chords' ? 'Acordes' : kind === 'song' ? 'Canción' : 'Ejercicio'}${p && p.plays ? ` · ${p.plays} ${p.plays === 1 ? 'vez' : 'veces'}` : ''}</small></span>
    <span class="book-medal" aria-label="${locked ? 'Bloqueada' : MEDAL_NAME[medal]}">${locked ? '🔒' : MEDAL_ICON[medal] || '○'}</span></button>`;
}

export function renderBook() {
  const box = $('bookView');
  const { book, states } = current();
  const all = plays();
  const review = reviewPage(book, all, dayStart());
  const totals = book.reduce((t, c) => { const s = chapterStats(c, all); return { pages: t.pages + s.total, bronze: t.bronze + s.bronze, silver: t.silver + s.silver, gold: t.gold + s.gold }; }, { pages: 0, bronze: 0, silver: 0, gold: 0 });
  const currentChapter = book.find(c => c.pages.some(pg => states[pg.lesson.id] === 'open' && !all[pg.lesson.id])) || book[0];
  box.innerHTML = `<div class="book-head"><p class="eyebrow">Modo libro</p><h1>El libro de ${esc(instrumentById(getState().instrument).name.toLowerCase())}</h1>
      <p class="muted small">Como un método de toda la vida, página a página. Repetir premia: bronce al pasarla, plata al repetirla bien y oro al dominarla.</p>
      <div class="book-tally"><span>🥇 ${totals.gold}</span><span>🥈 ${totals.silver}</span><span>🥉 ${totals.bronze}</span><span class="muted">de ${totals.pages} páginas</span></div></div>
    ${review ? `<button type="button" class="book-review" data-page="${esc(review.page.lesson.id)}"><span class="ic">↻</span><div><b>Repaso de hoy · página ${review.page.number}</b>
      <small>${esc(pageTitle(review.page.lesson))} · puntos ×${REVIEW_MULTIPLIER} · ${esc(nextGoal(review.p, review.page.lesson.kind))}</small></div></button>` : ''}
    ${book.map(chapter => {
      const st = chapterStats(chapter, all);
      return `<details class="book-chapter" ${chapter === currentChapter ? 'open' : ''} style="--unit:${chapter.color}">
        <summary><span class="book-chap-num">${chapter.number}</span><span class="book-chap-text"><b>${esc(chapter.title)}</b><small>${esc(chapter.sub)} · ${st.started}/${st.total} páginas${st.gold ? ` · ${st.gold} de oro` : ''}</small></span>
          ${st.stamp ? `<span class="book-stamp ${st.stamp}" title="${st.stamp === 'gold' ? 'Capítulo dominado' : 'Capítulo completado'}">${st.stamp === 'gold' ? '★' : '✓'}</span>` : ''}</summary>
        <div class="book-pages">${chapter.pages.map(page => pageButton(chapter, page, states, all[page.lesson.id], review)).join('')}</div></details>`;
    }).join('')}`;
}

$('bookView').addEventListener('click', e => {
  const btn = e.target.closest('[data-page]');
  if (!btn) return;
  const { book, states } = current();
  const hit = findPage(book, btn.dataset.page);
  if (!hit) return;
  const { chapter, page } = hit;
  const p = plays()[page.lesson.id];
  const medal = medalOf(p, page.lesson.kind);
  const locked = states[page.lesson.id] === 'locked';
  const concert = isConcert(chapter, page);
  const canAccomp = PLAYABLE.includes(page.lesson.kind);
  sheet(`<p class="eyebrow">Capítulo ${chapter.number} · página ${page.number}</p><h2>${esc(pageTitle(page.lesson))}</h2>
    ${page.lesson.sub ? `<p class="muted">${esc(chordText(page.lesson.sub))}</p>` : ''}
    ${concert ? '<p class="small"><b>Concierto del capítulo:</b> la tocas con la banda de acompañamiento.</p>' : ''}
    <div class="book-medals">${['bronze', 'silver', 'gold'].map(m => `<span class="${['bronze', 'silver', 'gold'].indexOf(m) < ['bronze', 'silver', 'gold'].indexOf(medal) + 1 ? 'on' : ''}">${MEDAL_ICON[m]}<small>${MEDAL_NAME[m]}</small></span>`).join('')}</div>
    <p class="small">${locked ? 'Se abre al pasar la página anterior.' : esc(nextGoal(p, page.lesson.kind))}</p>
    ${p && p.plays ? `<p class="muted small">Tocada ${p.plays} ${p.plays === 1 ? 'vez' : 'veces'} · mejor: ${p.best} ★</p>` : ''}
    <div class="row">${locked ? '' : `<button type="button" class="btn" id="bookPlay">${page.lesson.kind === 'theory' ? 'Leer' : 'Tocar'}</button>`}
      ${!locked && canAccomp && !concert ? `<label class="check-chip"><input type="checkbox" id="bookAccomp" ${getState().accompOn ? 'checked' : ''}> Con acompañamiento</label>` : ''}
      <button type="button" class="btn ghost small" data-close>Cerrar</button></div>`, box => {
    const play = box.querySelector('#bookPlay');
    if (!play) return;
    play.addEventListener('click', () => {
      const acc = box.querySelector('#bookAccomp');
      if (acc) update({ accompOn: acc.checked });
      $('sheet').close();
      playPage(chapter, page);
    });
  });
});

// Cada vez que se toca una página (desde el libro o desde el curso) cuenta para sus medallas.
// Repasar una página ya pasada da puntos extra; la del repaso de hoy, el doble.
window.addEventListener('lesson-finished', e => {
  const { lesson, stars, mode, speed } = e.detail;
  if (lesson.noRecord || lesson.placement || lesson.daily || !stars) return;
  const s = getState();
  const { book } = current();
  const hit = findPage(book, lesson.id);
  if (!hit) return;
  const mine = plays();
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
