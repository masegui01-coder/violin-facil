// Pestaña Aprender: «Tu siguiente paso» (tarea de la banda que vence pronto o la próxima lección) y mapa del curso.
import { $, esc, icon, starsHtml, toast } from '../ui.js';
import { register, go } from '../router.js';
import { lessonKey, lessonTitle, lessonSong, chordText, isReadingLesson, isCourseLevel } from '../course.js';
import { styleById } from '../songs.js';
import { getState, instrumentProgress, today, update, subscribe } from '../store.js';
import { soonBandTask } from '../next-step.js';
import { placementCardHtml, bindPlacementCard } from './placement-ui.js';
import { currentCourse, currentStates, nextLesson, unitOf, launch } from '../launch.js';
import { openLessonSheet } from './sheet.js';
import { renderToday } from './daily.js';
import { renderBook, warmLibrary } from './book.js';
import { resolveLearn, showBridge, inClassroom, PATHS } from '../learn-path.js';

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
    <div class="continue-meta"><div><p class="eyebrow">${isLevel(next) ? `Nivel ${lv.index(next.id)} de ${lv.total}` : 'Tu siguiente paso'} · ${esc(chordText(unit.title))}</p><h2>${esc(lessonTitle(next))}</h2>${next.sub ? `<p>${esc(chordText(next.sub))}</p>` : ''}</div>
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
      <div><p class="eyebrow">Unidad ${ui + 1}</p><h2>${esc(chordText(unit.title))}</h2><p>${esc(chordText(unit.sub))}</p></div>
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

// ---------- Dos caminos (js/learn-path.js): Por mi cuenta y Con profesor › Mi libro ----------
const PATH_HINT = {
  solo: 'Aprende tocando canciones, a tu ritmo y unos minutos al día.',
  profe: 'Las tareas de tu profesor y tu libro de estudio: Lenguaje Musical, el libro de tu instrumento y el Método Pro.',
};
const LIBRO_HINT = {
  lm: 'Lenguaje Musical: leer, escuchar, cantar y escribir música, unidad a unidad. Es igual para todos los instrumentos.',
  book: 'El libro de tu instrumento, página a página, con medallas.',
  method: 'El Método Pro: cada nivel con teoría, retos rápidos y práctica con el micrófono.',
};

// El Aula (Mis tareas del alumno, Mis clases del profesor o «Unirme a una clase») arriba de Con profesor
// (en #proPane, donde el modo tester lo repinta al restaurar la sesión)
function renderAulaBox() {
  if (!$('proPane')) $('proView').innerHTML = '<div id="proPane"></div>';
  import('./aula-home.js').then(m => m.renderAulaHome($('proPane')), () => toast('No se ha podido abrir. Revisa la conexión.'));
}

// Mi libro: solo se descarga y se pinta la sección elegida
function renderLibro(section) {
  document.querySelectorAll('[data-libro]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.libro === section)));
  $('libroHint').textContent = LIBRO_HINT[section];
  $('lmView').hidden = section !== 'lm';
  $('bookView').hidden = section !== 'book';
  $('methodView').hidden = section !== 'method';
  if (section === 'book') { renderBook(); return Promise.resolve(); }
  if (section === 'lm') {
    return import('../lm/view.js').then(m => { m.bindLm(); if (resolveLearn(getState()).section === 'lm') m.renderLm(); }, () => toast('No se ha podido abrir Lenguaje musical. Revisa la conexión.'));
  }
  return import('./pro.js').then(m => { if (resolveLearn(getState()).section === 'method') m.renderMethod($('methodView')); }, () => toast('No se ha podido abrir Pro. Revisa la conexión.'));
}

// Con clase (alumno o profesor, también en modo prueba o tester) el Aula va arriba; sin clase, Mi libro primero y
// «Unirme a una clase» debajo, a mano pero sin tapar el libro
function placeAula() {
  const s = getState();
  const aulaFirst = inClassroom(s) || !!s.tester || !!s.demo;
  const box = $('proView');
  if (aulaFirst && box.nextElementSibling !== $('libro')) $('libro').before(box);
  if (!aulaFirst && $('libro').nextElementSibling !== box) $('libro').after(box);
  box.classList.toggle('aula-below', !aulaFirst);
}

// Un enlace (tarea del Aula, atajo del modo tester, la escuela) que pide una sección: la vista baja a Mi libro
let lastLink = null;
function renderProfe({ section, linked }) {
  placeAula();
  renderAulaBox();
  const done = renderLibro(section);
  const raw = getState().learnView;
  if (linked && raw !== lastLink) done.then(() => requestAnimationFrame(() => $('libro').scrollIntoView({ block: 'start' })));
  lastLink = linked ? raw : null;
}

function renderSolo() {
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
  const lv = levelsDone();
  renderBridge(lv.done);
  renderTip(next, lv.done === 0);
  $('courseMap').innerHTML = courseMapHtml();
  watchLazyUnits();
  celebrateUnlock();
  const btn = $('continueBtn');
  if (btn && next) btn.addEventListener('click', () => { seeShownTip(); launch(next, { from: 'course' }); });
  warmLibrary();
}

// Técnica en 30 segundos antes de la lección que trae algo nuevo (js/tip-moments.js); el módulo llega aparte
let tipModule = null;
function renderTip(next, first) {
  const box = $('tipMoment');
  if (!next) { box.replaceChildren(); return; }
  import('./tip-moment.js').then(m => {
    tipModule = m;
    if (currentId === (next && next.id)) m.renderTipMoment(box, next, { first });
  }, () => box.replaceChildren());
}
// Quien empieza la lección con la tarjeta delante ya la ha visto: no vuelve a salir
function seeShownTip() {
  const kind = $('tipMoment').dataset.tip;
  if (kind && tipModule) tipModule.seeTip(kind);
}

// Puente discreto al libro tras unos cuantos niveles: «¿Quieres ir más en serio?»
function renderBridge(done) {
  const box = $('bridgeCard');
  if (!showBridge(getState(), done)) { box.replaceChildren(); return; }
  box.innerHTML = `<aside class="bridge" aria-labelledby="bridgeTitle">
    <div><h2 id="bridgeTitle">¿Quieres ir más en serio?</h2><p class="small muted">El libro te enseña a leer música. Lo que ya has aprendido cuenta.</p>
    <button type="button" class="btn ghost small" id="bridgeGo">Abrir Mi libro</button></div>
    <button type="button" class="icon-btn" id="bridgeClose" aria-label="No, gracias">✕</button></aside>`;
  $('bridgeGo').addEventListener('click', () => openLibro('book'));
  $('bridgeClose').addEventListener('click', () => { update({ bridgeHidden: true }); box.replaceChildren(); $('continueBtn')?.focus(); });
}

// Con profesor › Mi libro › sección, con la vista en Mi libro
export function openLibro(section) {
  update({ learnView: 'profe', libroView: section });
  render();
  requestAnimationFrame(() => { $('libro').scrollIntoView({ block: 'start' }); $('libroTitle').focus({ preventScroll: true }); });
}

function render() {
  const view = resolveLearn(getState());
  document.querySelectorAll('[data-learn-path]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.learnPath === view.path)));
  $('learnPathHint').textContent = PATH_HINT[view.path];
  $('casualView').hidden = view.path !== 'solo';
  $('profeView').hidden = view.path !== 'profe';
  if (view.path === 'profe') renderProfe(view);
  else renderSolo();
}

register('learn', { enter: render });
// Al entrar en una clase (o salir), el Aula sube o baja sin esperar a volver a Aprender
subscribe(() => { if (!$('profeView').hidden) placeAula(); });
document.querySelectorAll('[data-learn-path]').forEach(b => b.addEventListener('click', () => {
  if (resolveLearn(getState()).path === b.dataset.learnPath && PATHS.includes(getState().learnView)) return;
  update({ learnView: b.dataset.learnPath });
  render();
}));
// Elegir una sección de Mi libro deja el camino en Con profesor (también desde un enlace antiguo «lm» o «book»)
document.querySelectorAll('[data-libro]').forEach(b => b.addEventListener('click', () => {
  update({ learnView: 'profe', libroView: b.dataset.libro });
  render();
}));
// Técnica: los consejos del instrumento (postura, boca, dedos, arco…), en los dos caminos
document.querySelectorAll('[data-tech]').forEach(b => b.addEventListener('click', () => go('tips')));

$('courseMap').addEventListener('click', e => {
  const node = e.target.closest('[data-lesson]');
  if (!node) return;
  const lesson = course.flatMap(u => u.lessons).find(l => l.id === node.dataset.lesson);
  const unit = unitOf(lesson.id, course);
  openLessonSheet(lesson, { state: states[lesson.id], from: 'course', color: lesson.slot ? null : unit.color });
});
