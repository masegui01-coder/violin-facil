// Registra lo que hace falta para notar la mejora: precisión reciente, lectura y fallos por nota de cada obra.
import { lessonKey } from './course.js';
import { getState, update, recordAccuracy, recordErrors } from './store.js';

const READING = /^(sight|rhythm|daily)-/;

window.addEventListener('lesson-finished', e => {
  const { lesson, mode, accuracy, missed } = e.detail;
  if (accuracy === null || accuracy === undefined) return;
  const reading = READING.test(lesson.id);
  if (mode === 'tempo' || reading) recordAccuracy(accuracy, reading);
  if (missed && missed.length && !reading && !lesson.passage) recordErrors(lessonKey(lesson), missed);
  if (lesson.passage && lesson.passage.speed >= 1 && e.detail.stars >= 2) update({ passagesMastered: (getState().passagesMastered || 0) + 1 });
});
