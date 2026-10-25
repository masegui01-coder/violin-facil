// Pestaña Aprender: «Tu siguiente paso» (tarea de la banda que vence pronto o la próxima lección) y mapa del curso.
import { $, esc, icon, starsHtml } from '../ui.js';
import { register, go } from '../router.js';
import { lessonKey, lessonTitle, lessonSong, chordText } from '../course.js';
import { styleById } from '../songs.js';
import { getState, instrumentProgress, today } from '../store.js';
import { soonBandTask } from '../next-step.js';
import { currentCourse, currentStates, nextLesson, unitOf, launch } from '../launch.js';
import { openLessonSheet } from './sheet.js';
import { renderToday } from './daily.js';

const KIND_ICON = { theory: 'theory', notes: 'notes', song: 'song' };
const KIND_NAME = { theory: 'Teoría', notes: 'Notas', song: 'Canción' };

let course = [];
let states = {};
let currentId = null;
function bandStepCard(task) {
  const days = Math.round((new Date(`${task.due}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 864e5);
  const when = days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Vence en ${days} días`;
  return `<div class="continue" style="--unit:var(--u2)">
    <div class="continue-meta"><div><p class="eyebrow">Tu siguiente paso · Tarea de tu banda</p><h2>${esc(task.title)}</h2><p>${when}</p></div>
    <span class="continue-note" aria-hidden="true">♫</span></div>
    <button type="button" class="btn" id="bandStepBtn"><span class="ic">${icon('play')}</span>Ir a ensayarla</button></div>`;
}

function continueCard() {
  const next = nextLesson(null, course);
  if (!next) {
    return `<div class="continue" style="--unit:var(--u4)"><p class="eyebrow">Curso completado</p><h2>¡Has terminado todas las lecciones!</h2>
      <p>Sigue con la biblioteca de canciones o sube la exigencia de afinación en tu perfil.</p></div>`;
  }
  const unit = unitOf(next.id, course);
  const song = lessonSong(next);
  const color = next.slot && song ? styleById(song.style).color : unit.color;
  return `<div class="continue" style="--unit:${color}">
    <div class="continue-meta"><div><p class="eyebrow">Tu siguiente paso · ${esc(unit.title)} · ${KIND_NAME[next.kind]}</p><h2>${esc(lessonTitle(next))}</h2></div>
    <span class="continue-note" aria-hidden="true">${next.kind === 'song' ? '♫' : '♪'}</span></div>
    <button type="button" class="btn" id="continueBtn"><span class="ic">${icon('play')}</span>Continuar</button></div>`;
}

function nodeHtml(lesson, unit) {
  const st = states[lesson.id];
  const best = instrumentProgress()[lessonKey(lesson)] || 0;
  const song = lessonSong(lesson);
  const slotColor = lesson.slot && song ? styleById(song.style).color : null;
  const cls = ['node', st, lesson.id === currentId ? 'current' : '', lesson.slot ? 'slot' : ''].join(' ');
  const glyph = st === 'locked' ? 'lock' : lesson.slot ? 'star' : KIND_ICON[lesson.kind];
  const tag = lesson.slot ? `<span class="tag">${esc(styleById(song.style).name)}</span>` : '';
  const sub = lesson.slot ? (song.by || '') : chordText(lesson.sub || KIND_NAME[lesson.kind]);
  return `<button type="button" class="${cls}" data-lesson="${lesson.id}" style="--unit:${unit.color}${slotColor ? ';--slot:' + slotColor : ''}">
    <span class="bubble"><span class="ic">${icon(glyph)}</span></span>
    <span class="node-text"><b>${tag}${esc(lessonTitle(lesson))}</b><small>${esc(sub)}</small>${st === 'done' ? starsHtml(best) : ''}</span>
    <span class="sr-only">${st === 'locked' ? ', bloqueada' : st === 'done' ? ', hecha' : lesson.id === currentId ? ', siguiente lección' : ''}</span>
  </button>`;
}

function unitHtml(unit, ui) {
  const done = unit.lessons.filter(l => states[l.id] === 'done').length;
  return `<section class="unit">
    <div class="unit-banner" style="--unit:${unit.color}">
      <div><p class="eyebrow">Unidad ${ui + 1}</p><h2>${esc(unit.title)}</h2><p>${esc(unit.sub)}</p></div>
      <span class="unit-pct">${done}/${unit.lessons.length}</span>
    </div>
    <div class="path">${unit.lessons.map(l => nodeHtml(l, unit)).join('')}</div>
  </section>`;
}

function render() {
  course = currentCourse();
  states = currentStates(course);
  const next = nextLesson(null, course);
  currentId = next ? next.id : null;
  renderToday();
  const task = soonBandTask(getState(), today());
  $('continueCard').innerHTML = (task ? bandStepCard(task) : '') + continueCard();
  if (task) $('bandStepBtn').addEventListener('click', () => go('band'));
  $('courseMap').innerHTML = course.map(unitHtml).join('');
  const btn = $('continueBtn');
  if (btn && next) btn.addEventListener('click', () => launch(next, { from: 'course' }));
}

register('learn', { enter: render });

$('courseMap').addEventListener('click', e => {
  const node = e.target.closest('[data-lesson]');
  if (!node) return;
  const lesson = course.flatMap(u => u.lessons).find(l => l.id === node.dataset.lesson);
  const unit = unitOf(lesson.id, course);
  openLessonSheet(lesson, { state: states[lesson.id], from: 'course', color: lesson.slot ? null : unit.color });
});
