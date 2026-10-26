// Test de nivel (opcional, por instrumento): una prueba por unidad, cada vez más difícil.
// Al fallar una (menos de 2 estrellas) se para y el curso se abre hasta la última unidad superada.
export const PASS_STARS = 2;
const SKIP_KINDS = ['theory'];

// La última lección con partitura de cada unidad (desde la 2.ª): resume lo que hay que saber para pasarla
export function placementSteps(course) {
  return course.map((unit, unitIndex) => {
    if (unitIndex === 0) return null;
    const playable = unit.lessons.filter(l => !l.optional && !l.slot && !l.pill && !SKIP_KINDS.includes(l.kind));
    const lesson = playable[playable.length - 1];
    return lesson ? { unitIndex, unit, lesson } : null;
  }).filter(Boolean);
}

// Unidad en la que conviene empezar según las estrellas de cada prueba (en orden)
export function placedUnit(steps, stars) {
  let passed = 0;
  while (passed < stars.length && passed < steps.length && stars[passed] >= PASS_STARS) passed++;
  return passed ? steps[passed - 1].unitIndex + 1 : 0;
}

// Se ofrece el test a quien aún no ha hecho casi nada con este instrumento y no lo ha hecho ni descartado
export function offerPlacement(placement, instrument, lessonsDone) {
  return !(placement && instrument in placement) && lessonsDone < 3;
}
