// Aula Pro en segundo plano (alumno): escucha cada resultado del curso de Lenguaje Musical (onLmResult) y de las
// lecciones, herramientas y páginas del Libro (evento «lesson-finished»), lo suma a sus tareas y publica en cada una de
// sus clases el resumen acotado de aula-summary.js. Sin clases no hace nada (ni descarga nada).
import { getState, update, currentStreak } from './store.js';
import { cloudConfigured, cloudErrorText } from './cloud.js';
import { toast } from './ui.js';
import { onLmResult } from './lm/results.js';
import { cleanLmResult, addToLog, applyToTasks, buildSummary, classKey } from './aula-summary.js';
import { lessonPct } from './aula.js';
import { termOf } from './aula-report.js';

const PUBLISH_DELAY_MS = 1500;
const REFRESH_AFTER_MS = 6 * 3600e3; // al abrir la app, se publica si hace más de 6 h (minutos y racha al día)
const STARTUP_DELAY_MS = 8000;

const aula = () => getState().aula || {};
export const myClasses = () => aula().classes || [];

let exercisesLoad = null;
// Catálogo de Lenguaje en plano (para saber qué ejercicios cuentan en cada tarea)
export function lmExercises() {
  exercisesLoad ||= import('./aula-temario.js').then(m => m.loadLm().then(lm => m.flattenLm(lm.tree)), () => { exercisesLoad = null; return []; });
  return exercisesLoad;
}

// Guarda las tareas de una clase en el móvil (sin partitura) para poder contar los intentos aunque no haya conexión
export function cacheTasks(c, tasks) {
  const slim = tasks.map(({ song, hasSong, ...t }) => t);
  update({ aula: { ...aula(), tasks: { ...(aula().tasks || {}), [classKey(c)]: slim } } });
}

async function record(attempt, result) {
  if (!myClasses().length) return;
  const exercises = await lmExercises();
  const now = aula();
  const log = addToLog(now.log, result, termOf(new Date(attempt.at)).id);
  const prog = applyToTasks(now, attempt, exercises);
  update({ aula: { ...aula(), log, prog } });
  publishSoon();
}

let timer = null;
export function publishSoon() {
  clearTimeout(timer);
  timer = setTimeout(() => publishNow().catch(err => toast('No se ha podido enviar tu progreso a tu clase: ' + cloudErrorText(err))), PUBLISH_DELAY_MS);
}

// Publica mi resumen en todas mis clases (una escritura por clase)
export async function publishNow() {
  if (!cloudConfigured() || !myClasses().length) return;
  const [api, exercises] = await Promise.all([import('./aula-api.js'), lmExercises()]);
  const s = getState();
  const termId = termOf(new Date()).id;
  await Promise.all(myClasses().map(cls => api.publishSummary(cls, buildSummary({
    cls, aula: aula(), practiceLog: s.practiceLog, streak: currentStreak(s.streak), exercises, termId,
  }))));
  update({ aula: { ...aula(), publishedAt: Date.now() } });
}

onLmResult(raw => {
  const r = cleanLmResult(raw);
  if (r) record({ id: r.id, pct: r.pct, at: r.at }, r);
});

if (typeof window !== 'undefined') {
  window.addEventListener('lesson-finished', async e => {
    if (!myClasses().length) return;
    const { lesson, stars, accuracy } = e.detail;
    if (!lesson || !/^[\w-]{1,60}$/.test(String(lesson.id || ''))) return;
    const { lessonTitle } = await import('./course.js');
    const title = String((lesson.song && lesson.song.title) || lessonTitle(lesson) || '').slice(0, 60);
    const at = Date.now();
    const pct = lessonPct({ stars, accuracy });
    record({ id: lesson.id, pct, at }, { id: lesson.id, pct, at, skills: {}, mistakes: [], title });
  });
  setTimeout(() => {
    if (myClasses().length && Date.now() - (aula().publishedAt || 0) > REFRESH_AFTER_MS) publishNow().catch(() => { /* sin conexión: se publica en el próximo intento */ });
  }, STARTUP_DELAY_MS);
}
