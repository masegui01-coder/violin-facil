import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse, lessonMeta } from '../js/course.js';
import { instrumentById } from '../js/instruments.js';
import { parseScore, fingering } from '../js/music.js';
import { SONGS, octaveShiftFor, songById } from '../js/songs.js';
import { buildLibrary } from '../js/books.js';
import { TECHNIQUE } from '../js/book-theory.js';

const vc = instrumentById('cello');
const inFirst = m => !!fingering(m, 'cello');

test('violonchelo: todo el curso se toca en primera posición (con extensiones)', () => {
  buildCourse(['clasica', 'pop'], 'cello').forEach(u => u.lessons.forEach(l => {
    if (!(l.notes || l.song || l.songId)) return;
    const shift = l.songId ? octaveShiftFor(songById(l.songId), vc) : 0;
    parseScore(lessonMeta(l).score).notes.filter(n => !n.rest).forEach(n => assert.ok(inFirst(n.midi + shift), `${l.id}: ${n.letter}${n.oct}`));
  }));
});

test('violonchelo: las canciones de la biblioteca se colocan en la octava cómoda de primera posición', () => {
  SONGS.forEach(s => {
    const k = octaveShiftFor(s, vc);
    assert.notEqual(k, null, s.id);
    const midis = s.score ? parseScore(s.score).notes.filter(n => !n.rest).map(n => n.midi + k) : [];
    midis.forEach(m => assert.ok(m >= vc.comfort[0] && m <= vc.comfort[1], `${s.id}: ${m}`));
  });
});

test('violonchelo: los libros usan su propia técnica (Dotzauer y Lee, no los estudios de violín)', () => {
  assert.ok(TECHNIQUE.cello[3].some(([, text]) => text.includes('Dotzauer')));
  const books = buildLibrary(buildCourse(['clasica'], 'cello'), vc);
  assert.equal(books.length, 3);
  const text = JSON.stringify(books);
  assert.ok(!text.includes('Wohlfahrt'));
});
