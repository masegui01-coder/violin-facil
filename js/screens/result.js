// Pantalla de resultado: estrellas, puntos ganados, partitura revisada y qué hacer después.
import { $, icon } from '../ui.js';
import { register, go, ORIGIN_TAB } from '../router.js';
import { lessonKey } from '../course.js';
import { createStaff } from '../staff.js';
import { getState, recordResult, update } from '../store.js';
import { launch, nextLesson } from '../launch.js';
import { saveTake } from '../takes.js';
import { nextBookPage, openPage } from './book.js';

const FIRST_TAKE_MIN_DAYS = 7;

const reviewStaff = createStaff($('resStaff'));
let ctx = null;

// Cierra una lección: guarda estrellas, minutos y avisa (evento «lesson-finished») a quien escuche, por ejemplo «Mi banda»
export function finishLesson({ lesson, mode, from, stars, text, title, record = true, review = null, minutes = 0, accuracy = null, take = null, speed = 1, missed = null }) {
  const before = getState().xp;
  if (record && !lesson.noRecord && stars > 0) recordResult(lessonKey(lesson), stars, minutes);
  window.dispatchEvent(new CustomEvent('lesson-finished', { detail: { lesson, mode, stars, accuracy, minutes, speed, missed } }));
  go('result', { lesson, mode, from, stars, text, title, review, take, speed, xp: getState().xp - before });
}

const backToOrigin = () => go(ORIGIN_TAB[ctx.from] || 'learn');

function primaryAction() {
  const { lesson, mode, from, stars } = ctx;
  if (lesson.nextAction) return lesson.nextAction(ctx);
  if (mode === 'compare') return { label: 'Volver a Toca libre', run: () => go('free') };
  if (stars > 0 && mode === 'learn' && lesson.kind === 'song') {
    return { label: 'Ahora a tempo', run: () => launch(lesson, { mode: 'tempo', from }) };
  }
  if (stars === 0) return { label: 'Intentarlo otra vez', run: () => launch(lesson, { mode, from }) };
  if (from === 'book') {
    const next = nextBookPage(lesson.id);
    if (next) return { label: `Siguiente página (${next.page.number})`, run: () => openPage(next.page.lesson.id) };
  }
  if (from === 'course' && mode !== 'memory') {
    const next = nextLesson(lesson.id) || nextLesson();
    if (next) return { label: 'Siguiente lección', run: () => launch(next, { from: 'course' }) };
  }
  // Tempo adaptativo en canciones a tempo: más despacio si cuesta, más rápido si sale perfecta
  if (mode === 'tempo' && lesson.kind === 'song' && !lesson.oneTake) {
    const speed = ctx.speed || 1;
    if (stars <= 1 && speed > 0.4) return { label: `Repetir al ${Math.round((speed - 0.1) * 100)} %`, run: () => { update({ speed: Math.round((speed - 0.1) * 10) / 10 }); launch(lesson, { mode, from }); } };
    if (stars === 3 && speed < 1) return { label: `Probar al ${Math.round((speed + 0.1) * 100)} %`, run: () => { update({ speed: Math.round((speed + 0.1) * 10) / 10 }); launch(lesson, { mode, from }); } };
  }
  return { label: 'Continuar', run: backToOrigin };
}

// Partitura coloreada (verde bien, naranja te costó, rojo fallada) en el pentagrama que se indique
export function drawReview(staff, review) {
  staff.render(review.score, { key: review.key, time: review.time, mode: 'review', clef: review.clef, sticking: review.sticking });
  review.states.forEach((st, i) => staff.setState(i, st));
}

const firstStaff = createStaff($('resFirstStaff'));

function renderReview(review) {
  $('resReview').hidden = !review;
  if (review) drawReview(reviewStaff, review);
}

function enter(params) {
  ctx = params;
  const { stars, text, title, xp, mode } = params;
  const passText = mode === 'compare' || mode === 'memory' ? 'Necesitas acertar al menos la mitad de las notas en orden.' : 'Necesitas acertar al menos la mitad para ganar una estrella.';
  $('resEyebrow').textContent = mode === 'compare' ? 'Comparación' : stars === 0 ? 'Casi lo tienes' : stars === 3 ? '¡Perfecto!' : 'Lección terminada';
  $('resTitle').textContent = title;
  $('resStars').innerHTML = [1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">${icon('star')}</span>`).join('');
  $('resText').textContent = stars === 0 ? `${text}. ${passText}` : text;
  $('resXp').textContent = xp > 0 ? `+${xp} puntos` : '';
  renderReview(params.review);
  $('resTake').hidden = true;
  $('resFirst').hidden = true;
  if (params.take) params.take.then(async take => {
    if (!take || ctx !== params) return;
    $('resAudio').src = take.url;
    $('resTake').hidden = false;
    // la primera toma de esta obra, si es de hace una semana o más: para oír cuánto has mejorado
    const prev = await saveTake(`${getState().instrument}:${lessonKey(params.lesson)}`, take.blob, params.review || null);
    const days = prev ? Math.floor((Date.now() - prev.first.at) / 86400000) : 0;
    if (prev && days >= FIRST_TAKE_MIN_DAYS && ctx === params) {
      $('resFirstAudio').src = URL.createObjectURL(prev.first.blob);
      $('resFirstLabel').textContent = `Tu primera toma, hace ${days} días`;
      $('resFirst').hidden = false;
      $('resFirstReview').hidden = !prev.first.review;
      if (prev.first.review) drawReview(firstStaff, prev.first.review);
    }
  });
  const action = primaryAction();
  $('resPrimary').textContent = action.label;
  $('resPrimary').onclick = action.run;
  $('resRetry').hidden = stars === 0 || mode === 'compare';
}

register('result', { enter });

$('resRetry').addEventListener('click', () => launch(ctx.lesson, { mode: ctx.mode, from: ctx.from }));
$('resBack').addEventListener('click', backToOrigin);
