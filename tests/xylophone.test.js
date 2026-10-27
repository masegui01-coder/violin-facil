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

test('las láminas de metal de juguete (parciales no armónicos) se oyen en su nota', async () => {
  const { detectPitch, refinePitch } = await import('../js/pitch.js');
  const { midiToFreq, freqToMidi } = await import('../js/music.js');
  const SR = 48000;
  [72, 76, 79, 84].forEach(written => [12, 24].forEach(up => {
    const f = midiToFreq(written + up);
    const buf = new Float32Array(2048).map((_, i) => {
      const t = 0.05 + i / SR;
      return [[1, 1], [2.76, 0.5], [5.4, 0.3]].reduce((s, [k, a]) => s + a * Math.exp(-3 * k * t) * Math.sin(2 * Math.PI * f * k * t), 0) * 0.3;
    });
    const got = refinePitch(buf, SR, detectPitch(buf, SR, xyl.minHz, xyl.maxHz));
    const heard = foldOctave(freqToMidi(got) - xyl.transpose, written, xyl);
    assert.ok(Math.abs(heard - written) * 100 < 15, `${written}+${up}: ${heard}`);
  }));
});
