// Toda nota que el alumno ve en Aprender (curso, Libro y Pro) tiene digitación: nunca «consulta tu tabla».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS } from '../js/instruments.js';
import { buildCourse, lessonMeta } from '../js/course.js';
import { buildLibrary } from '../js/books.js';
import { buildMethod, hasMethod, practiceLesson } from '../js/method.js';
import { parseScore } from '../js/music.js';
import { octaveShiftFor } from '../js/songs.js';
import { fingeringFor, fingeringText } from '../js/fingerings.js';

const STYLES = ['clasica', 'populares', 'pop', 'cine', 'navidad', 'infantil', 'jazz', 'rock', 'latina', 'flamenco', 'folk', 'banda'];
const SKIP = new Set(['theory', 'chords', 'slots']);

function contentLessons(inst) {
  const course = buildCourse(STYLES, inst.id);
  const lessons = course.flatMap(u => u.lessons);
  const book = buildLibrary(course, inst).flatMap(b => b.chapters.flatMap(c => c.pages.map(p => p.lesson)));
  const pro = hasMethod(inst) ? buildMethod(inst, 'us').map(practiceLesson) : [];
  return [...lessons, ...book, ...pro].filter(l => !SKIP.has(l.kind));
}

function writtenNotes(inst, lesson) {
  const meta = lessonMeta(lesson);
  if (!meta) return [];
  const score = meta.parsed || parseScore(meta.score);
  const shift = lesson.octaveShift ?? (lesson.songId || lesson.passage ? (octaveShiftFor(meta, inst) ?? 0) : 0);
  return score.notes.filter(n => !n.rest).map(n => n.midi + shift);
}

test('todas las notas de las lecciones de cada instrumento tienen digitación', () => {
  const gaps = {};
  INSTRUMENTS.filter(inst => !inst.rhythmOnly).forEach(inst => {
    const missing = new Set();
    contentLessons(inst).forEach(l => writtenNotes(inst, l).forEach(midi => {
      if (/consulta tu tabla/.test(fingeringText(inst.id, midi, 'eu'))) missing.add(midi);
    }));
    if (missing.size) gaps[inst.id] = [...missing].sort((a, b) => a - b);
  });
  assert.deepEqual(gaps, {});
});

test('la madera cubre su registro escrito habitual sin huecos cromáticos', () => {
  const ranges = { oboe: [58, 89], clarinet: [52, 91], flute: [60, 93], sax: [58, 89], recorder: [60, 84], piccolo: [62, 86], 'bass-clarinet': [52, 84] };
  Object.entries(ranges).forEach(([id, [lo, hi]]) => {
    for (let midi = lo; midi <= hi; midi++) assert.ok(fingeringFor(id, midi), `${id} ${midi}`);
  });
});

test('digitaciones estándar de las notas que faltaban', () => {
  assert.equal(fingeringText('clarinet', 77, 'eu'), 'llave de registro · pulgar · izq. 1-2-3 · der. 1');
  assert.equal(fingeringText('clarinet', 59, 'eu'), 'pulgar · izq. 1-2-3 · der. 2');
  assert.equal(fingeringText('oboe', 74, 'eu'), 'medio agujero izq. 1 · izq. 2-3 · der. 1-2-3');
  assert.equal(fingeringText('sax', 86, 'eu'), 'llave de octava · llave de palma Re (mano izq.)');
  assert.equal(fingeringText('recorder', 63, 'eu'), 'pulgar · agujeros 1-2-3-4-5 · solo el agujero grande del 6');
  assert.equal(fingeringText('ukulele', 76, 'eu'), 'Cuerda 1 (La) · traste 7, dedo 3');
  assert.deepEqual(fingeringFor('flute', 91).holes, ['L1', 'L2', 'L3']);
});

test('revisión del profesor de madera: notas que no existen o no se comparten, barroca y llaves con su mano', () => {
  // Flauta dulce: Do♯6 solo con la campana tapada (a la tabla); esa digitación es el Re6. Fa4 barroco
  assert.equal(fingeringFor('recorder', 85), null);
  assert.deepEqual(fingeringFor('recorder', 86).holes, [1, 3, 4, 6]);
  assert.deepEqual(fingeringFor('recorder', 65).holes, [1, 2, 3, 4, 6, 7]);
  // Oboe semiautomático: 2.ª llave de octava de La5 a Do6
  [81, 82, 83, 84].forEach(m => assert.equal(fingeringFor('oboe', m).octave2, true));
  assert.equal(fingeringFor('oboe', 80).octave2, false);
  assert.match(fingeringText('oboe', 81, 'eu'), /^llave de octava 2\.ª \(lateral\)/);
  // El flautín empieza en Re4; el sobreagudo del clarinete bajo es propio; el requinto sí comparte
  [60, 61].forEach(m => assert.equal(fingeringFor('piccolo', m), null));
  assert.ok(fingeringFor('piccolo', 62));
  assert.equal(fingeringFor('bass-clarinet', 85), null);
  assert.ok(fingeringFor('eb-clarinet', 85));
  assert.ok(fingeringFor('clarinet', 87));
  // Ukelele soprano: 12 trastes; el traste 5 en primera posición con el meñique
  assert.equal(fingeringFor('ukulele', 82), null);
  assert.equal(fingeringText('ukulele', 74, 'eu'), 'Cuerda 1 (La) · traste 5, dedo 4');
  assert.match(fingeringText('clarinet', 56, 'eu'), /llave La♭\/Mi♭ \(meñique der\.\)$/);
});
