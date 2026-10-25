// Banda en segundo plano: sube la actividad del músico, envía el progreso de cada tarea y prepara la lección de una tarea.
import { toast } from '../ui.js';
import { cloudConfigured, cloudErrorText } from '../cloud.js';
import * as api from '../band-api.js';
import { activitySummary } from '../band-stats.js';
import { slicePassage, PASSAGE_START } from '../passage.js';
import { passageLesson } from '../passages.js';
import { levelFor } from '../rewards.js';
import { getState, update, today, currentStreak } from '../store.js';
import { launch } from '../launch.js';

const SYNC_EVERY_MS = 60000;
const PENDING_TIMEOUT_MS = 4000;
let lastSync = 0;

export const myBand = () => {
  const b = getState().band;
  return b ? { ...b, instrument: b.instrument || getState().instrument } : null;
};

// Sube mi actividad a mi ficha de la banda (minutos por día, puntos, nivel, racha y afinación)
export async function syncActivity(force = false) {
  const b = myBand();
  if (!b || !cloudConfigured() || (!force && Date.now() - lastSync < SYNC_EVERY_MS)) return;
  lastSync = Date.now();
  const s = getState();
  const joinXp = b.joinXp ?? s.xp;
  if (b.joinXp === undefined) update({ band: { ...s.band, joinXp } });
  const summary = activitySummary({ practiceLog: s.practiceLog, xp: s.xp, streak: currentStreak(s.streak), tuning: s.tuning[b.instrument] || {}, level: levelFor(s.xp).name }, today(), joinXp);
  await api.updateMyMember(b, { ...summary, instrument: b.instrument, syncedAt: Date.now() });
}

// Las otras partichelas de la tarea suenan como banda virtual
function accompanimentFor(task, part, passage) {
  return Object.values(task.parts || {}).filter(p => p !== part && p.xml).map(p => {
    const score = api.payloadScore(p);
    return { name: p.partName || p.title, transpose: p.transpose || 0, percussion: !!p.percussion, notes: passage ? slicePassage(score, passage.fromBar, passage.toBar).notes : score.notes };
  });
}

// Lección para ensayar una tarea; en los pasajes se empieza al mejor tempo que ya conseguiste
export function taskLesson(task, member, progress = null) {
  const part = api.taskPartFor(task, member);
  if (!part) return null;
  const { enc, parsed, ...rest } = part;
  const id = 'task-' + task.id;
  const song = { ...rest, ...api.partFor(part, member.instrument), id, style: null, difficulty: 2 };
  const extra = { taskId: task.id, task, accompaniment: accompanimentFor(task, part, task.passage) };
  if (task.passage) {
    const speed = Math.max(PASSAGE_START, Math.min(1, progress?.passageBest || 0));
    return passageLesson(song, task.passage.fromBar, task.passage.toBar, speed, extra);
  }
  return { id, kind: 'song', song, ...extra };
}

export function practiceTask(task, member, progress) {
  const lesson = taskLesson(task, member, progress);
  if (!lesson) { toast('Esta tarea no tiene partitura para tu instrumento'); return; }
  launch(lesson, { mode: task.passage ? 'tempo' : task.mode, from: 'band' });
}

const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

// Para la rutina diaria: la tarea pendiente que vence antes
export async function pendingBandLesson() {
  const b = myBand();
  if (!b || b.role === 'director' || !cloudConfigured()) return null;
  const [tasks, progress] = await withTimeout(Promise.all([api.listTasks(b.bandId), api.listProgress({ ...b, role: 'member' })]), PENDING_TIMEOUT_MS);
  const me = { uid: b.uid, instrument: b.instrument, voice: b.voice };
  const pending = tasks.filter(t => api.assignedTo(t, me) && !progress.some(p => p.taskId === t.id && p.completed))
    .sort((x, y) => (x.due || '9999').localeCompare(y.due || '9999'));
  for (const task of pending) {
    const lesson = taskLesson(task, me, progress.find(p => p.taskId === task.id));
    if (lesson) return { title: task.title, lesson, mode: task.passage ? 'tempo' : task.mode };
  }
  return null;
}

// Cada ensayo de una tarea se sube para que el director vea la evolución; y cualquier práctica actualiza la actividad
window.addEventListener('lesson-finished', async e => {
  const b = myBand();
  if (!b || !cloudConfigured()) return;
  const { lesson, mode, stars, accuracy, minutes } = e.detail;
  try {
    if (lesson.taskId) await api.reportProgress(b, lesson.task, { mode, stars, accuracy, minutes, passageSpeed: lesson.passage ? lesson.passage.speed : null });
    await syncActivity(!!lesson.taskId);
  } catch (err) { toast('No se ha podido enviar tu progreso: ' + cloudErrorText(err)); }
});
