// Pantalla de resultado: estrellas, puntos ganados y qué hacer después.
import { $, icon } from '../ui.js';
import { register, go } from '../router.js';
import { lessonKey } from '../course.js';
import { getState, recordResult } from '../store.js';
import { launch, nextLesson } from '../launch.js';

let ctx = null;

export function finishLesson({ lesson, mode, from, stars, text, title }) {
  const before = getState().xp;
  if (stars > 0) recordResult(lessonKey(lesson), stars);
  go('result', { lesson, mode, from, stars, text, title, xp: getState().xp - before });
}

function primaryAction() {
  const { lesson, mode, from, stars } = ctx;
  if (stars > 0 && mode === 'learn' && lesson.kind === 'song') {
    return { label: 'Ahora a tempo', run: () => launch(lesson, { mode: 'tempo', from }) };
  }
  if (stars === 0) return { label: 'Intentarlo otra vez', run: () => launch(lesson, { mode, from }) };
  if (from === 'course') {
    const next = nextLesson(lesson.id) || nextLesson();
    if (next) return { label: 'Siguiente lección', run: () => launch(next, { from: 'course' }) };
  }
  return { label: 'Continuar', run: () => go(from === 'songs' ? 'songs' : 'learn') };
}

function enter(params) {
  ctx = params;
  const { stars, text, title, xp } = params;
  $('resEyebrow').textContent = stars === 0 ? 'Casi lo tienes' : stars === 3 ? '¡Perfecto!' : 'Lección terminada';
  $('resTitle').textContent = title;
  $('resStars').innerHTML = [1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}">${icon('star')}</span>`).join('');
  $('resText').textContent = stars === 0 ? text + '. Necesitas acertar al menos la mitad para ganar una estrella.' : text;
  $('resXp').textContent = xp > 0 ? `+${xp} puntos` : '';
  const action = primaryAction();
  $('resPrimary').textContent = action.label;
  $('resPrimary').onclick = action.run;
  $('resRetry').hidden = stars === 0;
}

register('result', { enter });

$('resRetry').addEventListener('click', () => launch(ctx.lesson, { mode: ctx.mode, from: ctx.from }));
$('resBack').addEventListener('click', () => go(ctx.from === 'songs' ? 'songs' : 'learn'));
