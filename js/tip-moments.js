// Técnica en el momento (Por mi cuenta): antes de la lección que trae algo nuevo, una tarjeta de 30 s con el consejo
// que toca (js/tips.js). Tres momentos y una lista de tipos de consejo por momento, del más al menos pertinente; se
// usa el primero que tenga el instrumento y que aún no se haya visto. Cada consejo sale una sola vez por instrumento.
import { tipsFor } from './tips.js';

export const MOMENT_KINDS = Object.freeze({
  start: ['posture', 'embouchure', 'holes', 'stroke', 'hand'],                    // la primera lección: cómo se coge
  notes: ['left-hand', 'fretting', 'holes', 'hand', 'slide', 'embouchure', 'buzz'], // notas nuevas: los dedos
  song: ['bow', 'right-hand', 'breath', 'stroke', 'mouthpiece', 'buzz'],          // primera canción: el sonido
});

export function momentOf(lesson, { first = false } = {}) {
  if (!lesson) return null;
  if (first) return 'start';
  if (lesson.optional) return null;
  if (lesson.kind === 'notes') return 'notes';
  if (lesson.kind === 'song') return 'song';
  return null;
}

// El consejo para esta lección, o null. seen: tipos ya vistos con este instrumento.
export function tipForLesson(instId, lesson, { first = false, seen = [] } = {}) {
  const moment = momentOf(lesson, { first });
  if (!moment) return null;
  const tips = tipsFor(instId);
  const kind = MOMENT_KINDS[moment].find(k => !seen.includes(k) && tips.some(t => t.kind === k));
  return kind ? tips.find(t => t.kind === kind) : null;
}

// Marca un consejo como visto (devuelve el objeto nuevo para el estado: { instrumento: [tipos] })
export function markSeen(all = {}, instId, kind) {
  const mine = all[instId] || [];
  return mine.includes(kind) ? all : { ...all, [instId]: [...mine, kind] };
}
