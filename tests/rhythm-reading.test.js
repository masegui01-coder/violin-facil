import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseScore } from '../js/music.js';
import { instrumentById } from '../js/instruments.js';
import { generateReading, generateBook, VALUES, cellsFor } from '../js/rhythm-reading.js';

const sax = instrumentById('sax');
const figsOf = score => new Set(parseScore(score).notes.map(n => n.dur + (n.dotted ? '.' : '')));

test('cada compás está completo y las notas caben en el saxo', () => {
  for (const time of [2, 3, 4]) for (let d = 1; d <= 5; d++) {
    const song = generateReading({ inst: sax, bars: 16, time, values: VALUES.map(v => v.id), difficulty: d, tonic: 'G', scale: 'major', seed: d * 7 + time });
    const { bars, notes } = parseScore(song.score);
    assert.equal(bars.length, 16);
    bars.forEach((b, i) => assert.equal(b.beats, time, `${time}/4 dificultad ${d} compás ${i + 1}`));
    notes.filter(n => !n.rest).forEach(n => assert.ok(n.midi >= sax.written[0] && n.midi <= sax.written[1]));
  }
});

test('solo usa las figuras elegidas (y silencios si se piden)', () => {
  const song = generateReading({ inst: sax, bars: 12, values: ['q', 'h'], difficulty: 5, rests: false, seed: 3 });
  figsOf(song.score).forEach(f => assert.ok(['q', 'h', 'w'].includes(f), f));
  assert.ok(!parseScore(song.score).notes.some(n => n.rest));
  const withS = generateReading({ inst: sax, bars: 16, values: ['q', 'e', 's'], difficulty: 3, seed: 5 });
  assert.ok(figsOf(withS.score).has('s'));
});

test('la dificultad abre células nuevas', () => {
  const all = VALUES.map(v => v.id);
  assert.ok(cellsFor(all, 1, 4).length < cellsFor(all, 5, 4).length);
  assert.ok(cellsFor(all, 4, 4).some(c => c.figs.join(' ') === 'e q e'));
});

test('una sola nota: lectura pura de ritmo', () => {
  const song = generateReading({ inst: sax, bars: 8, values: ['q', 'e'], scale: 'single', tonic: 'D', seed: 9 });
  const pitches = new Set(parseScore(song.score).notes.filter(n => !n.rest).map(n => n.midi));
  assert.equal(pitches.size, 1);
});

test('el libro progresa: empieza con figuras largas y termina con todas', () => {
  const book = generateBook({ inst: sax, bars: 8, time: 4, values: ['h', 'q', 'e', 's'], difficulty: 4, tonic: 'C', scale: 'major', seed: 2 }, 10);
  assert.equal(book.length, 10);
  assert.deepEqual(book[0].values, ['h', 'q']);
  assert.deepEqual(book[9].values, ['h', 'q', 'e', 's']);
  assert.equal(book[0].difficulty, 1);
  assert.equal(book[9].difficulty, 4);
  assert.equal(new Set(book.map(x => x.id)).size, 10);
});
