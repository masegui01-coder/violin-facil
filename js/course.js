// Curso progresivo. Desde la unidad 4 cada unidad trae lecciones «Tu música» con canciones de los estilos elegidos.
import { SONGS, songById, octaveShiftFor } from './songs.js';
import { instrumentById } from './instruments.js';
import { windUnits } from './course-winds.js';
import { percUnits } from './course-perc.js';
import { guitarUnits } from './course-guitar.js';
import { ukuleleUnits } from './course-ukulele.js';
import { pianoUnits } from './course-piano.js';
import { recorderUnits } from './course-recorder.js';
import { cajonUnits } from './course-cajon.js';
import { songbookById, songbookLesson } from './songbook.js';
import { chordLabel } from './chords.js';
import { pillsFor } from './theory-pills.js';
import { getState } from './store.js';

const theory = (id, title, cards) => ({ id, kind: 'theory', title, cards });
// extra: clave ('bass') o dedos bajo las notas (piano)
const notes = (id, title, sub, list, extra = {}) => ({ id, kind: 'notes', title, sub, notes: list, ...extra });
const song = (id, songId, sub) => ({ id, kind: 'song', songId, sub });
const exercise = (id, title, sub, meta, extra = {}) => ({ id, kind: 'song', title, sub, song: { id, title, by: 'Ejercicio', style: null, difficulty: 1, ...meta }, ...extra });
const slots = (count, difficulty) => ({ kind: 'slots', count, difficulty });
const warmup = (id, title, list) => ({ ...notes(id, title, 'Calentamiento opcional', list), optional: true });

export const UNITS = [
  { id: 'u1', title: 'Primeros sonidos', sub: 'Las cuatro cuerdas al aire', color: 'var(--u1)', lessons: [
    theory('u1-intro', 'Conoce tu violín', [
      { title: 'Cuatro cuerdas', text: 'De grave a aguda: Sol, Re, La y Mi. Mirando el violín desde tu barbilla, la cuerda Sol queda a la izquierda y la Mi a la derecha.', board: [55, 62, 69, 76] },
      { title: 'El arco', text: 'Pulgar doblado entre la nuez y el cuero, dedos relajados y meñique curvo sobre la vara. Toca a medio camino entre el puente y el diapasón.' },
      { title: 'Cómo te escucha la app', text: 'Deja el móvil a medio metro, en un sitio silencioso. Haz notas largas: cuando suene afinada, la nota se pondrá verde y pasarás a la siguiente.' },
    ]),
    warmup('u1-warm', 'Arcos largos', 'G3 G3 D4 D4 A4 A4 E5 E5 E5 E5 A4 A4 D4 D4 G3 G3'),
    notes('u1-ae', 'La y Mi', 'Las dos cuerdas agudas', 'A4 A4 E5 E5 A4 E5 A4 E5 E5 E5 A4 A4 E5 A4 E5 A4'),
    notes('u1-dg', 'Re y Sol', 'Las dos cuerdas graves', 'D4 D4 G3 G3 D4 G3 D4 G3 G3 G3 D4 D4 G3 D4 G3 D4'),
    notes('u1-all', 'Cruzar cuerdas', 'Sol, Re, La, Mi y vuelta', 'G3 D4 A4 E5 E5 A4 D4 G3 D4 A4 D4 A4 E5 A4 E5 A4 D4 G3'),
    exercise('u1-rhythm', 'Primer ritmo', 'Negras y blancas a tempo', { key: 'C', time: 4, bpm: 56, score: '| A4q A4q A4h | E5q E5q E5h | D4q D4q D4h | A4w |' }),
  ] },
  { id: 'u2', title: 'Dedos en La', sub: 'Primer, segundo y tercer dedo', color: 'var(--u2)', lessons: [
    theory('u2-intro', 'Tus primeros dedos', [
      { title: 'Cuerda La', text: 'Sobre la cuerda La: el dedo 1 da Si, el 2 (alto, pegado al 3) da Do♯ y el 3 da Re. Apoya la yema y mantén el codo debajo del violín.', board: [71, 73, 74] },
      { title: 'Afinación', text: 'Si una nota sale baja, acerca el dedo al puente; si sale alta, acércalo a la voluta. El indicador te dirá hacia dónde moverte.' },
    ]),
    warmup('u2-warm', 'Patrón 0-1-2-3', 'A4 B4 A4 C#5 A4 D5 A4 B4 C#5 D5 C#5 B4 A4 A4'),
    notes('u2-a123', 'Subir y bajar', 'La, Si, Do♯, Re', 'A4 B4 C#5 D5 C#5 B4 A4 B4 C#5 D5 C#5 B4 A4 A4 B4 B4 C#5 C#5 D5 D5'),
    notes('u2-jumps', 'Saltos', 'Combinaciones en la cuerda La', 'A4 C#5 B4 D5 A4 D5 C#5 A4 B4 D5 A4 C#5 B4 A4 D5 A4'),
    exercise('u2-melody', 'Primera melodía', 'Solo cuerda La, a tempo', { key: 'A', time: 4, bpm: 60, score: '| A4q B4q C#5q D5q | C#5q B4q A4h | A4q C#5q B4q D5q | C#5q B4q A4h |' }),
  ] },
  { id: 'u3', title: 'Cuerda Re', sub: 'Escala de Re mayor', color: 'var(--u3)', lessons: [
    theory('u3-intro', 'La cuerda Re', [
      { title: 'Mismos dedos, otra cuerda', text: 'Sobre la cuerda Re los dedos 1, 2 alto y 3 dan Mi, Fa♯ y Sol. Con la cuerda La ya tienes la escala de Re mayor.', board: [64, 66, 67] },
    ]),
    warmup('u3-warm', 'Cruces Re-La', 'D4 A4 E4 B4 F#4 C#5 G4 D5 G4 C#5 F#4 B4 E4 A4 D4'),
    notes('u3-d123', 'Re, Mi, Fa♯, Sol', 'Dedos en la cuerda Re', 'D4 E4 F#4 G4 F#4 E4 D4 E4 F#4 G4 F#4 E4 D4 F#4 E4 G4 F#4 D4'),
    notes('u3-scale', 'Escala de Re mayor', 'Una octava', 'D4 E4 F#4 G4 A4 B4 C#5 D5 C#5 B4 A4 G4 F#4 E4 D4'),
    song('u3-mary', 'mary', 'Tu primera canción'),
    song('u3-oda', 'oda', 'Beethoven en Re mayor'),
  ] },
  { id: 'u4', title: 'Cuerda Mi', sub: 'Escala de La mayor', color: 'var(--u4)', lessons: [
    theory('u4-intro', 'La cuerda Mi', [
      { title: 'La cuerda más aguda', text: 'Dedo 1 Fa♯, dedo 2 alto Sol♯ y dedo 3 La. Con la cuerda La forman la escala de La mayor.', board: [78, 80, 81] },
    ]),
    warmup('u4-warm', 'Terceras en La mayor', 'A4 C#5 B4 D5 C#5 E5 D5 F#5 E5 G#5 F#5 A5 A5 F#5 D5 A4'),
    notes('u4-e123', 'Mi, Fa♯, Sol♯, La', 'Dedos en la cuerda Mi', 'E5 F#5 G#5 A5 G#5 F#5 E5 F#5 G#5 A5 G#5 F#5 E5 G#5 F#5 A5 G#5 E5'),
    notes('u4-scale', 'Escala de La mayor', 'Una octava', 'A4 B4 C#5 D5 E5 F#5 G#5 A5 G#5 F#5 E5 D5 C#5 B4 A4'),
    song('u4-estrellita', 'estrellita', 'La canción de siempre'),
    slots(2, 1),
  ] },
  { id: 'u5', title: 'Cuerda Sol', sub: 'Escala de Sol mayor', color: 'var(--u5)', lessons: [
    theory('u5-intro', 'La cuerda Sol', [
      { title: 'La cuerda más grave', text: 'Dedo 1 La, dedo 2 alto Si y dedo 3 Do. Sube a la cuerda Re y tendrás la escala de Sol mayor.', board: [57, 59, 60] },
    ]),
    warmup('u5-warm', 'Arpegio de Sol', 'G3 B3 D4 G4 D4 B3 G3 B3 D4 G4 B4 D5 B4 G4 D4 B3 G3'),
    notes('u5-g123', 'Sol, La, Si, Do', 'Dedos en la cuerda Sol', 'G3 A3 B3 C4 B3 A3 G3 A3 B3 C4 B3 A3 G3 B3 A3 C4 B3 G3'),
    notes('u5-scale', 'Escala de Sol mayor', 'Una octava', 'G3 A3 B3 C4 D4 E4 F#4 G4 F#4 E4 D4 C4 B3 A3 G3'),
    song('u5-martinillo', 'martinillo', 'Baja hasta la cuerda Sol'),
    slots(2, 1),
  ] },
  { id: 'u6', title: 'Ritmo', sub: 'Corcheas y puntillos', color: 'var(--u6)', lessons: [
    theory('u6-intro', 'Las figuras', [
      { title: 'Cuánto dura cada nota', text: 'Redonda: 4 pulsos. Blanca: 2. Negra: 1. Corchea: medio pulso, van de dos en dos. Un puntillo suma la mitad: negra con puntillo = 1 pulso y medio.' },
      { title: 'Toca a tempo', text: 'En el modo a tempo la partitura avanza sola tras una cuenta de un compás. Sigue la línea vertical y toca cada nota cuando llegue.' },
    ]),
    warmup('u6-warm', 'Notas repetidas', 'A4 A4 B4 B4 C#5 C#5 D5 D5 E5 E5 D5 D5 C#5 C#5 B4 B4 A4 A4'),
    exercise('u6-eighths', 'Corcheas', 'Dos notas por pulso', { key: 'D', time: 4, bpm: 60, score: '| D5e D5e A4e A4e B4e B4e A4q | G4e G4e F#4e F#4e E4e E4e D4q | A4e A4e D5e D5e C#5e C#5e D5q | A4q. B4e A4h |' }),
    song('u6-jingle', 'jingle', 'Corcheas y puntillos'),
    slots(2, 1),
  ] },
  { id: 'u7', title: 'Segundo dedo bajo', sub: 'Do natural y Sol natural', color: 'var(--u7)', lessons: [
    theory('u7-intro', 'Dedo 2 bajo', [
      { title: 'Junto al primero', text: 'Si pegas el dedo 2 al 1 suena medio tono más bajo: en la cuerda La da Do natural y en la cuerda Mi, Sol natural.', board: [72, 79] },
      { title: 'Dedo 1 bajo', text: 'En la cuerda Mi, el dedo 1 pegado a la cejuela da Fa natural. Lo usarás en las tonalidades menores.', board: [77] },
    ]),
    warmup('u7-warm', 'Dedo 2 alto y bajo', 'A4 B4 C#5 B4 C5 B4 C#5 D5 C5 B4 A4 E5 F#5 G#5 F#5 G5 F#5 E5'),
    notes('u7-low2', 'Do natural', 'Dedo 2 bajo en La y Mi', 'A4 B4 C5 D5 C5 B4 A4 B4 C5 B4 A4 E5 F#5 G5 A5 G5 F#5 E5 F#5 G5 F#5 E5'),
    notes('u7-scale', 'Escala de Do mayor', 'Desde la cuerda Sol', 'C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4'),
    song('u7-minueto', 'minueto', 'Bach para violín'),
    slots(3, 2),
  ] },
  { id: 'u8', title: 'Menores y expresión', sub: 'La menor y frases largas', color: 'var(--u8)', lessons: [
    theory('u8-intro', 'Tonalidades menores', [
      { title: 'Otro color', text: 'La escala de La menor usa Do natural, Fa natural y Sol natural. Suena más melancólica. En las melodías a veces aparece Sol♯ para volver a La.', board: [72, 77, 79] },
    ]),
    warmup('u8-warm', 'Escala de Re menor', 'D4 E4 F4 G4 A4 Bb4 C5 D5 C5 Bb4 A4 G4 F4 E4 D4'),
    notes('u8-scale', 'Escala de La menor', 'Natural, una octava', 'A4 B4 C5 D5 E5 F5 G5 A5 G5 F5 E5 D5 C5 B4 A4'),
    song('u8-greensleeves', 'greensleeves', 'Tradicional en La menor'),
    slots(3, 3),
  ] },
];

const CORE_SONG_IDS = new Set(UNITS.flatMap(u => u.lessons.filter(l => l.songId).map(l => l.songId)));

// Canciones candidatas para «Tu música»: primero las de tus estilos, alternando estilos
function pickSongs(count, difficulty, styles, used, inst) {
  const free = SONGS.filter(s => !CORE_SONG_IDS.has(s.id) && !used.has(s.id) && octaveShiftFor(s, inst) !== null);
  const byStyle = styles.map(st => free.filter(s => s.style === st && s.difficulty === difficulty));
  const picked = [];
  for (let round = 0; picked.length < count && byStyle.some(list => list.length > round); round++) {
    byStyle.forEach(list => { if (list[round] && picked.length < count) picked.push({ song: list[round], fromStyles: true }); });
  }
  // si faltan, se completan con otros estilos y después con la dificultad anterior
  const fallback = [difficulty, difficulty - 1]
    .flatMap(d => free.filter(s => s.difficulty === d))
    .filter(s => !picked.some(p => p.song.id === s.id));
  return [...picked, ...fallback.slice(0, count - picked.length).map(s => ({ song: s, fromStyles: styles.includes(s.style) }))];
}

// Guitarra, ukelele y piano: acordes uno a uno, cambios de un minuto y canciones del cancionero a tempo
const chordsHold = (id, title, sub, chords) => ({ id, kind: 'chords', mode: 'hold', title, sub, chords });
const changes = (id, a, b, target) => ({ id, kind: 'chords', mode: 'changes', title: `Cambios {${a}}–{${b}}`, sub: `Un minuto: ¿cuántos cambios? Meta: ${target}`, pair: [a, b], chords: [a, b], target });
const sbSong = (id, songbookId, sub) => ({ ...songbookLesson(songbookById(songbookId)), id, sub });

const HELPERS = { theory, notes, song, exercise, slots, warmup, chordsHold, changes, sbSong };

const UNITS_BY_INSTRUMENT = { guitar: guitarUnits, ukulele: ukuleleUnits, piano: pianoUnits, recorder: recorderUnits, cajon: cajonUnits };

export function buildCourse(styles, instId = 'violin') {
  const inst = instrumentById(instId);
  const units = inst.id === 'violin' ? UNITS : UNITS_BY_INSTRUMENT[inst.id] ? UNITS_BY_INSTRUMENT[inst.id](HELPERS) : inst.rhythmOnly ? percUnits(HELPERS) : windUnits(inst, HELPERS);
  const used = new Set();
  const pills = pillsFor(inst.id);
  return units.map((unit, ui) => ({
    ...unit,
    lessons: withPills(unit.lessons, pills.filter(p => Math.min(p.unit, units.length - 1) === ui)).flatMap(l => {
      if (l.kind !== 'slots') return [l];
      const picks = pickSongs(l.count, l.difficulty, styles, used, inst);
      picks.forEach(p => used.add(p.song.id));
      return picks.map((p, i) => ({ id: `${unit.id}-tu${i + 1}`, kind: 'song', songId: p.song.id, slot: true, fromStyles: p.fromStyles, sub: 'Tu música' }));
    }),
  }));
}

// Las píldoras de teoría van al principio de su unidad, justo después de la teoría propia de la unidad (si la hay)
function withPills(lessons, pills) {
  if (!pills.length) return lessons;
  const at = lessons[0] && lessons[0].kind === 'theory' ? 1 : 0;
  return [...lessons.slice(0, at), ...pills, ...lessons.slice(at)];
}

export function lessonKey(lesson) {
  return lesson.songId ? 'song:' + lesson.songId : 'lesson:' + lesson.id;
}

export function lessonSong(lesson) {
  return lesson.song || (lesson.songId ? songById(lesson.songId) : null);
}

// Partitura de una lección: las de notas sueltas se escriben en negras, cuatro por compás
const NOTES_PER_BAR = 4;
const NOTES_BPM = 60;
export function lessonMeta(lesson) {
  if (lesson.kind === 'notes') {
    const list = lesson.notes.split(' ');
    const bars = [];
    for (let i = 0; i < list.length; i += NOTES_PER_BAR) bars.push(list.slice(i, i + NOTES_PER_BAR).map(n => n + 'q').join(' '));
    return { title: lesson.title, key: 'C', time: 4, bpm: NOTES_BPM, score: '| ' + bars.join(' | ') + ' |' };
  }
  return lessonSong(lesson);
}

// Los títulos llevan los acordes entre llaves («{Am}») para escribirlos en la nomenclatura elegida
export function chordText(text, nom = getState().nom) {
  return String(text || '').replace(/\{([^}]+)\}/g, (_, name) => chordLabel(name, nom));
}

export function lessonTitle(lesson) {
  return chordText(lesson.title || lessonSong(lesson)?.title || '');
}

const START_UNIT = { new: 0, basic: 3, fluent: UNITS.length };

// Estado de cada lección: done / open / locked. «Tu música» y los calentamientos no bloquean el avance.
export function lessonStates(course, progress, { level = 'new', unlockAll = false, startUnit = 0 } = {}) {
  const states = {};
  let prevCoreDone = true;
  course.forEach((unit, ui) => {
    const preUnlocked = unlockAll || ui < Math.max(START_UNIT[level], startUnit); // startUnit: test de nivel
    let unitOpen = false;
    unit.lessons.forEach((lesson, li) => {
      const done = (progress[lessonKey(lesson)] || 0) > 0;
      let open;
      if (lesson.slot || lesson.optional) open = unitOpen;
      else {
        open = preUnlocked || prevCoreDone;
        prevCoreDone = done || preUnlocked;
        if (li === 0) unitOpen = open;
      }
      states[lesson.id] = done ? 'done' : open ? 'open' : 'locked';
    });
  });
  return states;
}
