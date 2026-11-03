// Pantalla de resultado: estrellas, puntos ganados, partitura revisada y qué hacer después.
import { $, icon, esc } from '../ui.js';
import { register, go, ORIGIN_TAB } from '../router.js';
import { lessonKey, isReadingLesson, READ_STARS } from '../course.js';
import { createStaff } from '../staff.js';
import { getState, recordResult, update } from '../store.js';
import { launch, nextLesson } from '../launch.js';
import { saveTake } from '../takes.js';
import { nextBookPage, openPage } from './book.js';
import { freshAdvice, markAdviceSeen } from './tips-advice.js';

const FIRST_TAKE_MIN_DAYS = 7;

const reviewStaff = createStaff($('resStaff'));
let ctx = null;

// Cierra una lección: guarda estrellas, minutos y avisa (evento «lesson-finished») a quien escuche, por ejemplo «Mi banda»
// Las fichas solo de lectura no puntúan rendimiento: quedan leídas con una recompensa fija (READ_STARS)
export function finishLesson({ lesson, mode, from, stars: played, text: playedText, title, record = true, review = null, minutes = 0, accuracy = null, take = null, speed = 1, missed = null }) {
  const read = isReadingLesson(lesson);
  const stars = read ? READ_STARS : played;
  const text = read ? 'Marcada como completada: ya puedes seguir con la siguiente.' : playedText;
  const before = getState().xp;
  if (record && !lesson.noRecord && stars > 0) recordResult(lessonKey(lesson), stars, minutes);
  window.dispatchEvent(new CustomEvent('lesson-finished', { detail: { lesson, mode, from, stars, accuracy, minutes, speed, missed, read } }));
  go('result', { lesson, mode, from, stars, text, title, review, take, speed, read, xp: getState().xp - before });
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
  const { stars, text, title, xp, mode, read } = params;
  const passText = mode === 'compare' || mode === 'memory' ? 'Necesitas acertar al menos la mitad de las notas en orden.' : 'Necesitas acertar al menos la mitad para ganar una estrella.';
  $('resEyebrow').textContent = read ? 'Lección leída' : mode === 'compare' ? 'Comparación' : stars === 0 ? 'Casi lo tienes' : stars === 3 ? '¡Perfecto!' : 'Lección terminada';
  $('resTitle').textContent = title;
  renderStars(stars, read);
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
  renderAdvice(mode);
  const action = primaryAction();
  $('resPrimary').textContent = action.label;
  $('resPrimary').onclick = action.run;
  $('resRetry').hidden = stars === 0 || mode === 'compare';
}

// Estrellas que entran una a una (css/motion.css); una ficha leída lleva un sello de «leída» en su lugar
function renderStars(stars, read) {
  const box = $('resStars');
  box.classList.toggle('read', !!read);
  if (read) {
    box.innerHTML = `<span class="on read-seal">${icon('theory')}</span>`;
    box.setAttribute('aria-label', 'Lección leída');
  } else {
    box.innerHTML = [1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}" style="--i:${i}">${icon('star')}</span>`).join('');
    box.setAttribute('aria-label', `${stars} de 3 estrellas`);
  }
  box.setAttribute('role', 'img');
  // reinicia la animación aunque se repita la misma pantalla
  box.classList.remove('pop');
  void box.offsetWidth;
  box.classList.add('pop');
}

// Consejo para ti: si el detector ve un fallo de técnica que se repite (y no lo has visto estos días)
function renderAdvice(mode) {
  const item = mode === 'learn' || mode === 'tempo' ? freshAdvice() : null;
  $('resTip').hidden = !item;
  if (!item) return;
  markAdviceSeen(item);
  $('resTip').innerHTML = `<p class="eyebrow">Consejo para ti</p><b>${esc(item.title)}</b><p class="small">${esc(item.action)}</p>
    <button type="button" class="btn ghost small" id="resTipOpen">Ver por qué y cómo se hace</button>`;
  $('resTipOpen').onclick = () => go('tips', { kind: item.tip });
}

register('result', { enter });

$('resRetry').addEventListener('click', () => launch(ctx.lesson, { mode: ctx.mode, from: ctx.from }));
$('resBack').addEventListener('click', backToOrigin);
