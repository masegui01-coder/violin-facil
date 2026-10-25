// Pantalla de resultado: estrellas, puntos ganados, partitura revisada y qué hacer después.
import { $, icon } from '../ui.js';
import { register, go } from '../router.js';
import { lessonKey } from '../course.js';
import { createStaff } from '../staff.js';
import { getState, recordResult } from '../store.js';
import { launch, nextLesson } from '../launch.js';

const ORIGIN_TAB = { course: 'learn', songs: 'songs', practice: 'practice', band: 'band' };
const reviewStaff = createStaff($('resStaff'));
let ctx = null;

// Cierra una lección: guarda estrellas, minutos y avisa (evento «lesson-finished») a quien escuche, por ejemplo «Mi banda»
export function finishLesson({ lesson, mode, from, stars, text, title, record = true, review = null, minutes = 0, accuracy = null, take = null, speed = 1 }) {
  const before = getState().xp;
  if (record && stars > 0) recordResult(lessonKey(lesson), stars, minutes);
  window.dispatchEvent(new CustomEvent('lesson-finished', { detail: { lesson, mode, stars, accuracy, minutes, speed } }));
  go('result', { lesson, mode, from, stars, text, title, review, take, xp: getState().xp - before });
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
  if (from === 'course' && mode !== 'memory') {
    const next = nextLesson(lesson.id) || nextLesson();
    if (next) return { label: 'Siguiente lección', run: () => launch(next, { from: 'course' }) };
  }
  return { label: 'Continuar', run: backToOrigin };
}

function renderReview(review) {
  $('resReview').hidden = !review;
  if (!review) return;
  reviewStaff.render(review.score, { key: review.key, time: review.time, mode: 'review', clef: review.clef, sticking: review.sticking });
  review.states.forEach((st, i) => reviewStaff.setState(i, st));
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
  if (params.take) params.take.then(url => { if (url && ctx === params) { $('resAudio').src = url; $('resTake').hidden = false; } });
  const action = primaryAction();
  $('resPrimary').textContent = action.label;
  $('resPrimary').onclick = action.run;
  $('resRetry').hidden = stars === 0 || mode === 'compare';
}

register('result', { enter });

$('resRetry').addEventListener('click', () => launch(ctx.lesson, { mode: ctx.mode, from: ctx.from }));
$('resBack').addEventListener('click', backToOrigin);
