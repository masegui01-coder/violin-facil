// Arranca lecciones y calcula la siguiente del curso.
import { buildCourse, lessonStates, lessonSong } from './course.js';
import { styleById } from './songs.js';
import { getState } from './store.js';
import { go } from './router.js';

export function currentCourse() {
  return buildCourse(getState().styles);
}

export function currentStates(course = currentCourse()) {
  const s = getState();
  return lessonStates(course, s.progress, { level: s.level, unlockAll: s.unlockAll });
}

export function unitOf(lessonId, course = currentCourse()) {
  return course.find(u => u.lessons.some(l => l.id === lessonId)) || null;
}

// Primera lección abierta y sin hacer después de la indicada (o desde el principio). Los calentamientos se saltan.
export function nextLesson(afterId = null, course = currentCourse()) {
  const states = currentStates(course);
  const flat = course.flatMap(u => u.lessons);
  const from = afterId ? flat.findIndex(l => l.id === afterId) + 1 : 0;
  return flat.slice(from).find(l => states[l.id] === 'open' && !l.optional) || null;
}

export function defaultMode(lesson) {
  if (lesson.kind === 'notes') return 'learn';
  return lesson.song ? 'tempo' : 'learn';
}

function eyebrowFor(lesson, from) {
  const song = lessonSong(lesson);
  if (from === 'course') {
    const unit = unitOf(lesson.id);
    if (lesson.slot && song) return 'Tu música · ' + (styleById(song.style)?.name || '');
    return unit ? unit.title : '';
  }
  return song && song.style ? styleById(song.style).name + ' · ' + song.by : '';
}

export function launch(lesson, { mode, from = 'course' } = {}) {
  const params = { lesson, from, eyebrow: eyebrowFor(lesson, from) };
  if (lesson.kind === 'theory') go('theory', params);
  else if (mode === 'memory') go('free', params);
  else go('lesson', { ...params, mode: mode || defaultMode(lesson) });
}

export function songLesson(songId) {
  return { id: 'song-' + songId, kind: 'song', songId };
}
