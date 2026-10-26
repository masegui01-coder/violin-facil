import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse } from '../js/course.js';
import { chordShape, chordMidis, parseChord } from '../js/chords.js';
import { fingeringFor } from '../js/fingerings.js';

const course = buildCourse(['folk'], 'ukulele');
const lessons = course.flatMap(u => u.lessons);

test('cada acorde del curso de ukelele tiene su forma de 4 cuerdas', () => {
  const chords = new Set(lessons.filter(l => l.kind === 'chords').flatMap(l => l.chords || []));
  lessons.filter(l => l.chart).forEach(l => l.chart.forEach(x => chords.add(x.chord)));
  chords.forEach(c => {
    const shape = chordShape(c, 'ukulele');
    assert.ok(shape && shape.frets.length === 4, `falta ${c}`);
  });
});

test('las formas de ukelele suenan las notas del acorde', () => {
  ['C', 'Am', 'F', 'G', 'G7', 'C7', 'Em', 'Dm', 'D', 'A', 'A7', 'D7', 'E7', 'E', 'Em7', 'Am7', 'Fmaj7', 'Bb', 'Bm', 'B7'].forEach(name => {
    const pcs = new Set(parseChord(name).pcs);
    chordMidis(name, 'ukulele').forEach(m => assert.ok(pcs.has(m % 12), `${name}: ${m}`));
  });
});

test('las notas del punteo tienen cuerda y traste', () => {
  assert.deepEqual(fingeringFor('ukulele', 72), { type: 'fret', string: 1, fret: 3 });
  assert.deepEqual(fingeringFor('ukulele', 62), { type: 'fret', string: 3, fret: 2 });
});
