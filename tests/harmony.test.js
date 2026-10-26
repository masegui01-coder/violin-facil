import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseScore } from '../js/music.js';
import { harmonize, accompanimentNotes, parseKey, noteValueName, inferKey } from '../js/harmony.js';
import { SONGS, songScore } from '../js/songs.js';

test('lee la tonalidad', () => {
  assert.deepEqual(parseKey('D'), { tonic: 2, minor: false });
  assert.deepEqual(parseKey('Am'), { tonic: 9, minor: true });
  assert.deepEqual(parseKey('Bb'), { tonic: 10, minor: false });
});

test('armoniza una melodía en Do con tónica al principio y al final', () => {
  const score = parseScore('| C5q E5q G5q E5q | F5q A5q F5q D5q | G5q B4q D5q G4q | C5w |');
  const chords = harmonize(score.notes, score.bars, { key: 'C', time: 4 });
  assert.equal(chords.length, 8);
  assert.equal(chords[0].name, 'C');
  assert.equal(chords[2].name, 'F');
  assert.equal(chords[4].name, 'G');
  assert.equal(chords[chords.length - 1].name, 'C');
});

test('el Himno de la Alegría se armoniza con acordes de Re mayor', () => {
  const oda = SONGS.find(s => s.id === 'oda');
  const score = songScore(oda);
  const chords = harmonize(score.notes, score.bars, { key: oda.key, time: oda.time });
  assert.ok(chords.every(c => ['D', 'G', 'A', 'Bm', 'Em'].includes(c.name)), chords.map(c => c.name).join(' '));
  assert.equal(chords[0].name, 'D');
});

test('el acompañamiento tiene bajo y acorde, en notas escritas', () => {
  const notes = accompanimentNotes([{ start: 0, beats: 2, root: 0, minor: false }], { time: 4, transpose: -2 });
  assert.equal(notes.filter(n => n.start === 0).length, 1);
  assert.equal(notes.filter(n => n.start === 1).length, 3);
  assert.ok(notes.every(n => n.midi + -2 >= 37 && n.midi + -2 <= 62));
});

test('nombre del valor de la nota', () => {
  assert.equal(noteValueName(2), 'Blanca · 2 tiempos');
  assert.equal(noteValueName(1), 'Negra · 1 tiempo');
  assert.equal(noteValueName(0.5), 'Corchea · medio tiempo');
  assert.equal(noteValueName(1.5), 'Negra con puntillo · 1,5 tiempos');
});

test('deduce la tonalidad de un ejercicio sin tonalidad escrita', () => {
  assert.equal(inferKey(parseScore('| A4q E5q A4q E5q | A4q E5q A4h |').notes), 'A');
  assert.equal(inferKey(parseScore('| D4q E4q F#4q G4q | A4q G4q F#4q E4q | D4w |').notes), 'D');
  assert.equal(inferKey(parseScore('| C4q D4q E4q F4q | G4q F4q E4q D4q | C4w |').notes), 'C');
});
