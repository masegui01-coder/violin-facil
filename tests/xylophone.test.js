import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instrumentById, foldOctave, toleranceFor } from '../js/instruments.js';
import { buildCourse } from '../js/course.js';
import { parseScore, parseNote } from '../js/music.js';
import { fingeringText } from '../js/fingerings.js';
import { playHints } from '../js/coach.js';

const xyl = instrumentById('xylophone');

test('el xilófono acepta la nota en cualquier octava y solo pide acertar la lámina', () => {
  assert.equal(foldOctave(84, 72, xyl), 72);
  assert.equal(foldOctave(59.8, 72, xyl), 71.8);
  assert.equal(foldOctave(84, 72, instrumentById('violin')), 84);
  assert.equal(toleranceFor(25, xyl), 50);
  assert.equal(toleranceFor(25, instrumentById('flute')), 25);
});

test('las cinco primeras unidades caben en un xilófono de juguete de Do a Do, sin alteraciones', () => {
  const units = buildCourse([], 'xylophone').slice(0, 5);
  const midis = units.flatMap(u => u.lessons).flatMap(l => {
    if (l.kind === 'notes') return l.notes.split(' ').map(n => parseNote(n).midi);
    if (l.song) return parseScore(l.song.score).notes.filter(n => !n.rest).map(n => n.midi);
    return [];
  });
  assert.ok(midis.length > 100);
  // el Sol grave de Martinillo vale en la lámina 5 (cualquier octava)
  midis.forEach(m => assert.ok([0, 2, 4, 5, 7, 9, 11].includes(m % 12) && foldOctave(m, 78, xyl) >= 72 && m <= 84, String(m)));
});

test('la digitación del xilófono cuenta las láminas y los avisos hablan de láminas', () => {
  assert.equal(fingeringText('xylophone', 72, 'eu'), 'Lámina 1: la más larga, a la izquierda');
  assert.equal(fingeringText('xylophone', 76, 'eu'), 'Lámina 3 desde la izquierda');
  assert.equal(fingeringText('xylophone', 73, 'eu'), 'Fila de atrás, entre las láminas 1 y 2');
  assert.match(playHints(xyl).repeat, /lámina/);
});

test('las láminas de metal (parciales no armónicos, aunque suenen más que la nota) se oyen en su nota', async () => {
  const { barPitch } = await import('../js/pitch.js');
  const { midiToFreq, freqToMidi } = await import('../js/music.js');
  const SR = 48000;
  const METAL = [[[1, 1, 2], [2.76, 0.9, 3], [5.4, 0.6, 4]], [[1, 0.6, 2], [2.76, 1, 3], [5.4, 0.5, 4]], [[1, 1, 3], [3, 0.3, 9]]];
  METAL.forEach(parts => [72, 76, 79, 84].forEach(written => [0, 12, 24].forEach(up => {
    const f = midiToFreq(written + up);
    const buf = new Float32Array(2048).map((_, i) => {
      const t = 0.3 + i / SR;
      return parts.reduce((s, [k, a, d]) => s + a * Math.exp(-d * t) * Math.sin(2 * Math.PI * f * k * t + k), 0) * 0.05;
    });
    const heard = foldOctave(freqToMidi(barPitch(buf, SR, xyl.minHz, xyl.maxHz)) - xyl.transpose, written, xyl);
    assert.ok(Math.abs(heard - written) * 100 < 10, `${written}+${up}: ${heard}`);
  })));
  const noise = new Float32Array(2048).map(() => (Math.random() - 0.5) * 0.01);
  assert.equal(barPitch(noise, SR, xyl.minHz, xyl.maxHz), null);
});
