// Pantalla de resultado: estrellas, puntos ganados, partitura revisada y qué hacer después.
import { $, icon } from '../ui.js';
import { register, go } from '../router.js';
import { lessonKey } from '../course.js';
import { createStaff } from '../staff.js';
import { getState, recordResult } from '../store.js';
import { launch, nextLesson } from '../launch.js';

const ORIGIN_TAB = { course: 'learn', songs: 'songs', practice: 'practice' };
const reviewStaff = createStaff($('resStaff'));
let ctx = null;

export function finishLesson({ lesson, mode, from, stars, text, title, record = true, review = null }) {
  const before = getState().xp;
  if (record && stars > 0) recordResult(lessonKey(lesson), stars);
  go('result', { lesson, mode, from, stars, text, title, review, xp: getState().xp - before });
}

const backToOrigin = () => go(ORIGIN_TAB[ctx.from] || 'learn');

function primaryAction() {
  const { lesson, mode, from, stars } = ctx;
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
  reviewStaff.render(review.score, { key: review.key, time: review.time, mode: 'review' });
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
  const action = primaryAction();
  $('resPrimary').textContent = action.label;
  $('resPrimary').onclick = action.run;
  $('resRetry').hidden = stars === 0 || mode === 'compare';
}

register('result', { enter });

$('resRetry').addEventListener('click', () => launch(ctx.lesson, { mode: ctx.mode, from: ctx.from }));
$('resBack').addEventListener('click', backToOrigin);
