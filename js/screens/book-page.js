// Página del libro, como en un método impreso: portadilla del capítulo, explicación, partitura en renglones con el
// cifrado de la armonización, diagramas de las notas o acordes, un consejo y las medallas. Se toca o se escucha con la banda.
// También compone el libro entero para imprimirlo o guardarlo en PDF.
import { $, esc, toast } from '../ui.js';
import { register, go } from '../router.js';
import { getState, update } from '../store.js';
import { instrumentById } from '../instruments.js';
import { lessonTitle, chordText } from '../course.js';
import { noteLabel } from '../music.js';
import { chordLabel } from '../chords.js';
import { createStaff } from '../staff.js';
import { renderDiagram } from '../keydiagram.js';
import { drawChord } from '../boards.js';
import { harmonize, accompanimentNotes, inferKey } from '../harmony.js';
import * as audio from '../audio.js';
import { pageScore, sliceScore, medalOf, nextGoal, MEDAL_NAME } from '../book.js';
import { fullBook, bookPlays, pageState, playPage, isConcert } from './book.js';

const BARS_PER_LINE = 4;
const MAX_NOTE_DIAGRAMS = 6;
const MEDAL_ICON = { bronze: '🥉', silver: '🥈', gold: '🥇' };
const KIND_NAME = { theory: 'Teoría', notes: 'Ejercicio', song: 'Canción', chords: 'Acordes' };

let ctx = null; // { lessonId }
let stopListen = null;

const inst = () => instrumentById(getState().instrument);
const nom = () => getState().nom;

function tipFor(lesson) {
  if (lesson.chapterReview) return 'Es una página nueva hecha con lo que ya sabes: léela despacio, sin miedo a fallar. Vuelve mañana y verás cómo sale mejor.';
  if (lesson.kind === 'theory') return '';
  if (lesson.kind === 'chords') return lesson.mode === 'changes' ? 'Cuenta los cambios en voz alta. Cada día que repites, la cifra sube: es la mejor prueba de que avanzas.'
    : lesson.mode === 'strum' ? 'Escucha primero el ritmo, luego toca solo el primer pulso de cada compás y, cuando salga, el rasgueo completo.'
      : 'Pon los dedos sin prisa, rasguea y deja sonar. Si una cuerda no suena, apoya la yema justo detrás del traste.';
  if (inst().rhythmOnly) return 'Cuenta en voz alta «1, 2, 3, 4» antes de empezar y mantén el pulso aunque falles un golpe.';
  if (lesson.kind === 'notes') return 'Primero nota a nota: la app espera a que cada nota suene bien. Cuando salga sin fallos, pásate a tempo.';
  return 'Escúchala con la banda antes de tocar. Empieza al 60 % y sube la velocidad cuando salga limpia.';
}

// Los ejercicios de notas sueltas no tienen tonalidad escrita: se deduce de la melodía
const harmonyKey = (lesson, data) => (lesson.kind === 'notes' ? inferKey(data.score.notes) : data.key);

// ---------- Partitura en renglones ----------
function systemsHtml(lessonId, count) {
  return Array.from({ length: count }, (_, i) => `<div class="bp-system"><div class="bp-chords" id="bpc-${esc(lessonId)}-${i}"></div><svg class="staff" id="bps-${esc(lessonId)}-${i}" role="img" aria-label="Partitura, renglón ${i + 1}"></svg></div>`).join('');
}

function drawSystems(root, lesson, data) {
  const { score, key, time } = data;
  const lines = Math.ceil(score.bars.length / BARS_PER_LINE);
  const chords = inst().rhythmOnly ? [] : harmonize(score.notes, score.bars, { key: harmonyKey(lesson, data), time });
  const clef = lesson.clef || inst().clef || (inst().rhythmOnly ? 'perc' : 'treble');
  for (let i = 0; i < lines; i++) {
    const slice = sliceScore(score, i * BARS_PER_LINE, BARS_PER_LINE);
    const svg = root.querySelector(`#bps-${CSS.escape(lesson.id)}-${i}`);
    if (!slice || !svg) continue;
    createStaff(svg).render(slice, { key, time, mode: 'review', clef });
    const from = score.bars[i * BARS_PER_LINE].start;
    const to = from + slice.totalBeats;
    const names = chords.filter(c => c.start >= from - 1e-6 && c.start < to - 1e-6).map(c => chordLabel(c.name, nom()));
    const box = root.querySelector(`#bpc-${CSS.escape(lesson.id)}-${i}`);
    if (box) box.textContent = names.join('   ');
  }
}

function noteDiagramsHtml(lesson, data) {
  if (inst().rhythmOnly) return '';
  const uniq = [...new Map(data.score.notes.filter(n => !n.rest).map(n => [n.midi, n])).values()].sort((a, b) => a.midi - b.midi).slice(0, MAX_NOTE_DIAGRAMS);
  return `<h3>Las notas de esta página</h3><div class="bp-notes">${uniq.map(n => `<figure><svg class="board" data-note="${n.midi}" role="img" aria-label="Digitación de ${esc(noteLabel(n, nom()))}"></svg><figcaption>${esc(noteLabel(n, nom()))}</figcaption></figure>`).join('')}</div>`;
}

function chordsHtml(lesson) {
  const chart = lesson.chart ? `<div class="bp-chart">${lesson.chart.map(x => `<span>${esc(chordLabel(x.chord, nom()))}</span>`).join('')}</div>` : '';
  return `${chart}<div class="bp-notes">${(lesson.chords || []).map(c => `<figure><svg class="board chord-board" data-chord="${esc(c)}" role="img" aria-label="Acorde ${esc(chordLabel(c, nom()))}"></svg></figure>`).join('')}</div>`;
}

function theoryHtml(lesson) {
  return (lesson.cards || []).map((card, i) => `<section class="bp-card"><h3>${esc(chordText(card.title))}</h3><p>${esc(chordText(card.text))}</p>
    ${card.board ? `<svg class="board" data-board="${i}" role="img" aria-label="Diagrama"></svg>` : card.chord ? `<svg class="board chord-board" data-chord="${esc(card.chord)}" role="img" aria-label="Acorde"></svg>` : ''}</section>`).join('');
}

function openerHtml(chapter) {
  const notes = chapter.news.notes.map(n => `<span class="pill">${esc(noteLabel(n, nom()))}</span>`).join(' ');
  const chords = chapter.news.chords.map(c => `<span class="pill">${esc(chordLabel(c, nom()))}</span>`).join(' ');
  const concert = chapter.pages.find(pg => isConcert(chapter, pg));
  return `<div class="bp-opener" style="--unit:${chapter.color}"><p class="eyebrow">Capítulo ${chapter.number}</p><h1>${esc(chapter.title)}</h1><p>${esc(chapter.sub)}</p>
    ${notes ? `<p class="small"><b>Notas nuevas:</b> ${notes}</p>` : ''}${chords ? `<p class="small"><b>Acordes nuevos:</b> ${chords}</p>` : ''}
    <p class="muted small">${chapter.pages.length} páginas${concert ? ` · concierto en la página ${concert.number}` : ''}${chapter.pages.some(pg => pg.lesson.chapterReview) ? ' · repaso al final' : ''}</p></div>`;
}

// HTML de una página (también para el libro impreso)
export function pageHtml(chapter, page, { print = false } = {}) {
  const lesson = page.lesson;
  const data = pageScore(lesson, inst());
  const first = chapter.pages[0] === page;
  const tip = tipFor(lesson);
  const concert = isConcert(chapter, page);
  let content = '';
  if (lesson.kind === 'theory') content = theoryHtml(lesson);
  else if (lesson.kind === 'chords') content = chordsHtml(lesson);
  else if (data) content = systemsHtml(lesson.id, Math.ceil(data.score.bars.length / BARS_PER_LINE)) + noteDiagramsHtml(lesson, data);
  return `${first ? openerHtml(chapter) : ''}
    <header class="bp-head"><span class="bp-num" style="--unit:${chapter.color}">${page.number}</span><div><p class="eyebrow">${concert ? 'Concierto del capítulo' : lesson.chapterReview ? 'Repaso del capítulo' : KIND_NAME[lesson.kind] || ''}</p>
      <h2>${esc(chordText(lessonTitle(lesson)))}</h2>${lesson.sub ? `<p class="muted">${esc(chordText(lesson.sub))}</p>` : ''}</div></header>
    ${content}
    ${tip ? `<aside class="bp-tip"><b>Consejo</b><span>${esc(tip)}</span></aside>` : ''}
    ${print ? `<p class="bp-print-foot">Tócala con la app: Aprender → Libro → página ${page.number}</p>` : ''}`;
}

// Dibuja las partituras y diagramas de una página ya insertada
export function drawPage(root, page) {
  const lesson = page.lesson;
  const data = pageScore(lesson, inst());
  if (data) drawSystems(root, lesson, data);
  root.querySelectorAll('[data-note]').forEach(svg => renderDiagram(svg, inst().id, [Number(svg.dataset.note)], nom()));
  root.querySelectorAll('[data-chord]').forEach(svg => drawChord(svg, svg.dataset.chord, inst().id, nom()));
  root.querySelectorAll('[data-board]').forEach(svg => {
    const card = (lesson.cards || [])[Number(svg.dataset.board)];
    if (card && card.board) renderDiagram(svg, inst().id, card.board, nom());
  });
}

// ---------- Pantalla ----------
function find() {
  const book = fullBook();
  const flat = book.flatMap(chapter => chapter.pages.map(page => ({ chapter, page })));
  const i = flat.findIndex(x => x.page.lesson.id === ctx.lessonId);
  return { book, flat, i, hit: flat[i] };
}

function stopAudio() {
  if (stopListen) stopListen();
  stopListen = null;
  $('bpListen').textContent = 'Escuchar con la banda';
}

function render() {
  stopAudio();
  const { flat, i, hit } = find();
  if (!hit) { go('learn'); return; }
  const { chapter, page } = hit;
  const p = bookPlays()[page.lesson.id];
  const medal = medalOf(p, page.lesson.kind);
  const state = pageState(chapter, page);
  $('bpWhere').textContent = `Capítulo ${chapter.number} · página ${page.number} de ${flat.length}`;
  $('bpMedal').textContent = MEDAL_ICON[medal] || '';
  $('bpBody').innerHTML = pageHtml(chapter, page) + `<div class="bp-medals"><div class="book-medals">${['bronze', 'silver', 'gold'].map((m, k) => `<span class="${k < ['none', 'bronze', 'silver', 'gold'].indexOf(medal) ? 'on' : ''}">${MEDAL_ICON[m]}<small>${MEDAL_NAME[m]}</small></span>`).join('')}</div>
    <p class="small">${state === 'locked' ? 'Se abre al pasar la página anterior.' : esc(nextGoal(p, page.lesson.kind))}</p>${p && p.plays ? `<p class="muted small">Tocada ${p.plays} ${p.plays === 1 ? 'vez' : 'veces'} · mejor: ${p.best} ★</p>` : ''}</div>`;
  drawPage($('bpBody'), page);
  $('bpPlay').textContent = page.lesson.kind === 'theory' ? 'Leer y responder' : 'Tocar';
  $('bpPlay').disabled = state === 'locked';
  $('bpListen').hidden = !pageScore(page.lesson, inst()) || inst().rhythmOnly;
  $('bpPrev').disabled = i <= 0;
  const next = flat[i + 1];
  $('bpNext').disabled = !next;
  window.scrollTo(0, 0);
}

function listen() {
  if (stopListen) { stopAudio(); return; }
  const { hit } = find();
  const data = pageScore(hit.page.lesson, inst());
  if (!data) return;
  const at = audio.ctx().currentTime + 0.15;
  const transpose = inst().transpose;
  const chords = harmonize(data.score.notes, data.score.bars, { key: harmonyKey(hit.page.lesson, data), time: data.time });
  const stopMelody = audio.playScore(data.score.notes, data.bpm, (beat, done) => { if (done) stopAudio(); }, { at });
  const stopBand = audio.playAccompaniment([{ notes: accompanimentNotes(chords, { time: data.time, transpose }), transpose }], at, 60 / data.bpm);
  stopListen = () => { stopMelody(); stopBand(); };
  $('bpListen').textContent = 'Parar';
}

register('bookpage', { enter: params => { if (params && params.lessonId) ctx = params; if (ctx) render(); }, leave: stopAudio });

$('bpPrev').addEventListener('click', () => { const { flat, i } = find(); if (i > 0) { ctx = { lessonId: flat[i - 1].page.lesson.id }; render(); } });
$('bpNext').addEventListener('click', () => { const { flat, i } = find(); if (flat[i + 1]) { ctx = { lessonId: flat[i + 1].page.lesson.id }; render(); } });
$('bpPlay').addEventListener('click', () => { stopAudio(); const { hit } = find(); playPage(hit.chapter, hit.page); });
$('bpListen').addEventListener('click', listen);

// ---------- Libro impreso (o PDF) ----------
export function printBook() {
  const book = fullBook();
  const name = inst().name.toLowerCase();
  const box = $('bookPrint');
  box.innerHTML = `<section class="bp-print-page bp-cover"><p class="eyebrow">Band Flow</p><h1>El libro de ${esc(name)}</h1><p>Método paso a paso con ${book.reduce((s, c) => s + c.pages.length, 0)} páginas</p>
      <h2>Índice</h2><ol class="bp-index">${book.map(c => `<li><span>Capítulo ${c.number}: ${esc(c.title)}</span><span>pág. ${c.pages[0].number}</span></li>`).join('')}</ol></section>
    ${book.map(chapter => chapter.pages.map(page => `<section class="bp-print-page" data-print="${esc(page.lesson.id)}">${pageHtml(chapter, page, { print: true })}</section>`).join('')).join('')}`;
  book.forEach(chapter => chapter.pages.forEach(page => drawPage(box.querySelector(`[data-print="${CSS.escape(page.lesson.id)}"]`), page)));
  document.body.classList.add('print-book');
  const done = () => { document.body.classList.remove('print-book'); box.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  toast('Elige «Guardar como PDF» para tener el libro en el móvil');
  setTimeout(() => window.print(), 300);
}
