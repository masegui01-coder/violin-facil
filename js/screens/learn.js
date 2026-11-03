// Pestaña Aprender: «Tu siguiente paso» (tarea de la banda que vence pronto o la próxima lección) y mapa del curso.
import { $, esc, icon, starsHtml, toast } from '../ui.js';
import { register, go } from '../router.js';
import { lessonKey, lessonTitle, lessonSong, chordText, isReadingLesson, isCourseLevel } from '../course.js';
import { styleById } from '../songs.js';
import { getState, instrumentProgress, today, update } from '../store.js';
import { soonBandTask } from '../next-step.js';
import { placementCardHtml, bindPlacementCard } from './placement-ui.js';
import { currentCourse, currentStates, nextLesson, unitOf, launch } from '../launch.js';
import { openLessonSheet } from './sheet.js';
import { renderToday } from './daily.js';
import { renderBook } from './book.js';

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

// Niveles del curso: todo el camino salvo los calentamientos opcionales (la teoría leída cuenta)
const isLevel = isCourseLevel;
function levelsDone() {
  const levels = course.flatMap(u => u.lessons).filter(isLevel);
  return { total: levels.length, done: levels.filter(l => states[l.id] === 'done').length, index: id => levels.findIndex(l => l.id === id) + 1 };
}
const progressBar = ({ done, total }) => `<div class="level-progress" role="progressbar" aria-label="Niveles superados del curso" aria-valuetext="${done} de ${total}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
  <span style="width:${Math.round(100 * done / Math.max(1, total))}%"></span></div><p class="small muted">${done} de ${total} niveles superados</p>`;

function continueCard() {
  const next = nextLesson(null, course);
  const lv = levelsDone();
  if (!next) {
    return `<div class="continue" style="--unit:var(--u4)"><p class="eyebrow">Curso completado</p><h2>¡Has terminado todas las lecciones!</h2>
      <p>Sigue con la biblioteca de canciones o sube la exigencia de afinación en tu perfil.</p></div>`;
  }
  const unit = unitOf(next.id, course);
  const song = lessonSong(next);
  const color = next.slot && song ? styleById(song.style).color : unit.color;
  return `<div class="continue" style="--unit:${color}">
    <div class="continue-meta"><div><p class="eyebrow">${isLevel(next) ? `Nivel ${lv.index(next.id)} de ${lv.total}` : 'Tu siguiente paso'} · ${esc(unit.title)}</p><h2>${esc(lessonTitle(next))}</h2>${next.sub ? `<p>${esc(chordText(next.sub))}</p>` : ''}</div>
    <span class="continue-note" aria-hidden="true">${next.kind === 'song' ? '♫' : '♪'}</span></div>
    ${progressBar(lv)}
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
    <span class="node-text"><b>${tag}${esc(lessonTitle(lesson))}</b><small>${esc(sub)}</small>${st !== 'done' ? '' : isReadingLesson(lesson) ? '<span class="read-tag">Leída</span>' : starsHtml(best)}</span>
    <span class="sr-only">${st === 'locked' ? ', bloqueada' : st === 'done' ? ', hecha' : lesson.id === currentId ? ', siguiente lección' : ''}</span>
  </button>`;
}

// Rendimiento: solo se pinta el camino de la unidad actual y sus vecinas; el resto (cientos de nodos)
// se monta al acercarse con el scroll. Mientras, la unidad reserva su altura aproximada (--n, css/perf.css).
const EAGER_AROUND = 1;
const MOUNT_MARGIN = '900px 0px';
const pathHtml = unit => unit.lessons.map(l => nodeHtml(l, unit)).join('');

function unitHtml(unit, ui, eager) {
  const done = unit.lessons.filter(l => states[l.id] === 'done').length;
  return `<section class="unit"${eager ? '' : ` data-lazy-unit="${ui}"`} style="--n:${unit.lessons.length}">
    <div class="unit-banner" style="--unit:${unit.color}">
      <div><p class="eyebrow">Unidad ${ui + 1}</p><h2>${esc(unit.title)}</h2><p>${esc(unit.sub)}</p></div>
      <span class="unit-pct">${done}/${unit.lessons.length}</span>
    </div>
    <div class="path">${eager ? pathHtml(unit) : ''}</div>
  </section>`;
}

function mountUnit(section) {
  const unit = course[Number(section.dataset.lazyUnit)];
  section.removeAttribute('data-lazy-unit');
  if (unit) section.querySelector('.path').innerHTML = pathHtml(unit);
}

let unitObserver = null;
function watchLazyUnits() {
  if (unitObserver) unitObserver.disconnect();
  const lazy = $('courseMap').querySelectorAll('[data-lazy-unit]');
  if (!lazy.length) return;
  // Sin IntersectionObserver (navegadores muy viejos): se monta todo, como antes
  if (typeof IntersectionObserver !== 'function') { lazy.forEach(mountUnit); return; }
  unitObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    unitObserver.unobserve(e.target);
    mountUnit(e.target);
  }), { rootMargin: MOUNT_MARGIN });
  lazy.forEach(el => unitObserver.observe(el));
}

function courseMapHtml() {
  const unit = currentId ? unitOf(currentId, course) : null;
  const at = unit ? course.indexOf(unit) : course.length - 1;
  return course.map((u, i) => unitHtml(u, i, Math.abs(i - at) <= EAGER_AROUND)).join('');
}

// «Más»: reto del día, clasificación, liga, amigos y test de nivel, plegados bajo el objetivo de hoy
// para que arriba solo queden el siguiente paso, el objetivo y el camino. Los contenedores conservan su id,
// así que sus módulos (amigos, test de nivel) siguen pintando en ellos.
const MORE_FROM_TODAY = ['dailyBtn', 'dailyBoardBtn', 'leagueBtn'];
function moreBox() {
  let box = $('learnMore');
  if (box) return box;
  box = document.createElement('details');
  box.id = 'learnMore';
  box.className = 'learn-more';
  box.innerHTML = `<summary><span class="learn-more-title">Más</span><small id="learnMoreHint"></small></summary>
    <div class="learn-more-body"><div id="learnMoreDaily" class="learn-more-daily"></div></div>`;
  $('todayCard').after(box);
  const body = box.querySelector('.learn-more-body');
  body.append($('friendsCard'), $('placementCard'));
  return box;
}

function fillMore() {
  const box = moreBox();
  const slot = $('learnMoreDaily');
  slot.replaceChildren(...MORE_FROM_TODAY.map(id => $(id)).filter(Boolean));
  const s = getState();
  const day = today();
  const parts = [s.dailyDone[day] !== undefined ? 'Reto hecho' : 'Reto del día'];
  if (!s.kidMode) parts.push('liga', 'amigos');
  if ($('placementCard').innerHTML.trim()) parts.push('test de nivel');
  $('learnMoreHint').textContent = parts.join(' · ');
  return box;
}

// Nodo recién desbloqueado: si la siguiente lección cambió desde la última vez, se anima (ver css/motion.css)
let seenNext = {};
function celebrateUnlock() {
  const inst = getState().instrument;
  const prev = seenNext[inst];
  seenNext = { ...seenNext, [inst]: currentId };
  if (!prev || !currentId || prev === currentId) return;
  const node = $('courseMap').querySelector(`[data-lesson="${CSS.escape(currentId)}"]`);
  if (node) node.classList.add('just-unlocked');
}

// Pro (con el método completo de cada instrumento) se descarga al elegir esa vista
function renderProView() {
  import('./pro.js').then(m => { if ((getState().learnView || 'casual') === 'pro') m.renderPro(); },
    () => toast('No se ha podido abrir Pro. Revisa la conexión.'));
}

// Casual: siguiente paso, objetivo de hoy y camino (lo demás, plegado en «Más»). Libro: el método página a página con medallas. Pro: el método de viento
// con Libro, Relax y Práctica en cada nivel (opcional, aparte del curso).
function render() {
  const view = getState().learnView || 'casual';
  document.querySelectorAll('[data-learn-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.learnView === view)));
  $('casualView').hidden = view !== 'casual';
  $('bookView').hidden = view !== 'book';
  $('proView').hidden = view !== 'pro';
  if (view === 'book') { renderBook(); return; }
  if (view === 'pro') { renderProView(); return; }
  course = currentCourse();
  states = currentStates(course);
  const next = nextLesson(null, course);
  currentId = next ? next.id : null;
  renderToday();
  const task = soonBandTask(getState(), today());
  $('continueCard').innerHTML = (task ? bandStepCard(task) : '') + continueCard();
  if (task) $('bandStepBtn').addEventListener('click', () => go('band'));
  $('placementCard').innerHTML = placementCardHtml();
  bindPlacementCard();
  fillMore();
  $('courseMap').innerHTML = courseMapHtml();
  watchLazyUnits();
  celebrateUnlock();
  const btn = $('continueBtn');
  if (btn && next) btn.addEventListener('click', () => launch(next, { from: 'course' }));
}

register('learn', { enter: render });
document.querySelectorAll('[data-learn-view]').forEach(b => b.addEventListener('click', () => { update({ learnView: b.dataset.learnView }); render(); }));

$('courseMap').addEventListener('click', e => {
  const node = e.target.closest('[data-lesson]');
  if (!node) return;
  const lesson = course.flatMap(u => u.lessons).find(l => l.id === node.dataset.lesson);
  const unit = unitOf(lesson.id, course);
  openLessonSheet(lesson, { state: states[lesson.id], from: 'course', color: lesson.slot ? null : unit.color });
});
