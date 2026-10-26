// Test de nivel: se ofrece en Aprender a quien empieza con un instrumento y se puede repetir desde Perfil.
import { $, esc } from '../ui.js';
import { go } from '../router.js';
import { getState, update, instrumentProgress } from '../store.js';
import { instrumentById } from '../instruments.js';
import { currentCourse, launch } from '../launch.js';
import { placementSteps, placedUnit, offerPlacement, PASS_STARS } from '../placement.js';
import { sheet } from './band-ui.js';

const instName = () => instrumentById(getState().instrument).name.toLowerCase();
const lessonsDone = () => Object.values(instrumentProgress()).filter(v => v > 0).length;

function savePlacement(unit) {
  const s = getState();
  update({ placement: { ...(s.placement || {}), [s.instrument]: unit } });
}

export function placementCardHtml() {
  if (!offerPlacement(getState().placement, getState().instrument, lessonsDone())) return '';
  return `<div class="panel placement-card"><b>¿Ya sabes tocar ${esc(instName())}?</b>
    <span class="muted small">Haz el test de nivel (unos minutos) y empieza en la unidad que te toca, sin repetir lo que ya sabes.</span>
    <div class="row"><button type="button" class="btn small" id="placementGo">Hacer el test</button><button type="button" class="btn ghost small" id="placementNo">Empiezo de cero</button></div></div>`;
}

export function bindPlacementCard() {
  const go1 = $('placementGo');
  if (!go1) return;
  go1.addEventListener('click', openPlacementIntro);
  $('placementNo').addEventListener('click', () => { savePlacement(0); go('learn'); });
}

export function openPlacementIntro() {
  const steps = placementSteps(currentCourse());
  sheet(`<h2>Test de nivel · ${esc(instrumentById(getState().instrument).name)}</h2>
    <p>Tocarás ${steps.length} fragmentos, cada uno de una unidad más avanzada. Cuando uno no te salga (menos de ${PASS_STARS} estrellas) paramos y te colocamos en esa unidad.</p>
    <p class="muted small">No cuenta para tus estrellas ni tus puntos. Puedes salir cuando quieras y repetirlo desde Perfil.</p>
    <div class="row"><button type="button" class="btn" id="placementStart">Empezar</button><button type="button" class="btn ghost small" data-close>Ahora no</button></div>`,
  box => box.querySelector('#placementStart').addEventListener('click', () => { $('sheet').close(); run(steps, [], 0); }));
}

function run(steps, stars, i) {
  if (i === 0) update({ seenScreens: { ...(getState().seenScreens || {}), placement: Date.now() } });
  const { lesson, unit } = steps[i];
  const test = {
    ...lesson, noRecord: true, placement: true,
    title: `Test ${i + 1} de ${steps.length}: ${lesson.title || unit.title}`,
    nextAction: ctx => {
      const all = [...stars, ctx.stars];
      if (ctx.stars >= PASS_STARS && i + 1 < steps.length) return { label: `Siguiente prueba (${i + 2} de ${steps.length})`, run: () => run(steps, all, i + 1) };
      return { label: 'Ver mi nivel', run: () => finish(steps, all) };
    },
  };
  launch(test, { from: 'course', mode: lesson.kind === 'notes' ? 'learn' : 'tempo' });
}

function finish(steps, stars) {
  const course = currentCourse();
  const unit = Math.min(course.length - 1, placedUnit(steps, stars));
  const prev = (getState().placement || {})[getState().instrument] || 0;
  savePlacement(Math.max(prev, unit));
  go('learn');
  const target = course[Math.max(prev, unit)];
  sheet(unit > 0
    ? `<h2>¡Empiezas en la unidad ${unit + 1}!</h2><p>«${esc(target.title)}». Las unidades anteriores quedan abiertas por si quieres repasar algo.</p><button type="button" class="btn" data-close>A tocar</button>`
    : `<h2>Mejor desde el principio</h2><p>Las primeras unidades te darán una buena base. Irás rápido: cuando una lección te salga, pasa a la siguiente.</p><button type="button" class="btn" data-close>Vamos</button>`);
}
