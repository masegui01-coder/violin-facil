// Practicar por pasajes: unos compases en bucle con tempo adaptativo, y los compases donde más fallas.
import { slicePassage, hardestBars, nextPassageSpeed, PASSAGE_START } from './passage.js';
import { lessonSong, lessonKey } from './course.js';
import { songScore } from './songs.js';
import { errorsFor } from './store.js';
import { launch } from './launch.js';

const MIN_ATTEMPTS = 1;

// Lección de un pasaje. extra: datos de la tarea de banda u otros (se conservan en cada repetición)
export function passageLesson(song, fromBar, toBar, speed = PASSAGE_START, extra = {}) {
  const score = song.parsed ? structuredClone(song.parsed) : songScore(song);
  const parsed = slicePassage(score, fromBar, toBar);
  const id = `pas-${song.id}-${fromBar}-${toBar}`;
  const pct = Math.round(speed * 100);
  return {
    ...extra, id, kind: 'song', fixedSpeed: true, speedOverride: speed,
    passage: { fromBar, toBar, speed },
    song: { ...song, id, parsed, pickup: fromBar === 1 ? song.pickup || 0 : 0, title: `${song.title} · c. ${fromBar}–${toBar}` },
    nextAction: ({ stars, from }) => {
      const next = nextPassageSpeed(speed, stars);
      if (stars >= 2 && speed >= 1) return { label: '¡Pasaje dominado! Otra vez', run: () => launch(passageLesson(song, fromBar, toBar, 1, extra), { mode: 'tempo', from }) };
      const label = next > speed ? `Subir al ${Math.round(next * 100)} %` : next < speed ? `Repetir al ${Math.round(next * 100)} %` : `Repetir al ${pct} %`;
      return { label, run: () => launch(passageLesson(song, fromBar, toBar, next, extra), { mode: 'tempo', from }) };
    },
  };
}

// Los compases más difíciles de una lección según tus fallos acumulados
export function hardPassage(lesson) {
  const song = lessonSong(lesson);
  const errors = errorsFor(lessonKey(lesson));
  if (!song || !errors || errors.attempts < MIN_ATTEMPTS) return null;
  const range = hardestBars(song.parsed ? song.parsed : songScore(song), errors.misses);
  return range ? { song, ...range } : null;
}
