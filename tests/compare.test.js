import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareNotes, starsFor } from '../js/compare.js';
import { createTracker } from '../js/tracker.js';
import { midiToFreq } from '../js/music.js';

test('identical sequences are fully correct', () => {
  const r = compareNotes([69, 71, 73], [69, 71, 73]);
  assert.deepEqual(r.states, ['ok', 'ok', 'ok']);
  assert.equal(r.extra, 0);
  assert.equal(r.accuracy, 1);
});

test('a missing note is marked as miss', () => {
  const r = compareNotes([69, 71, 73, 74], [69, 73, 74]);
  assert.deepEqual(r.states, ['ok', 'miss', 'ok', 'ok']);
  assert.equal(r.correct, 3);
});

test('a wrong note is marked as wrong and extra notes are counted', () => {
  const r = compareNotes([69, 71, 73], [69, 72, 73, 76]);
  assert.deepEqual(r.states, ['ok', 'wrong', 'ok']);
  assert.equal(r.extra, 1);
});

test('stars follow accuracy thresholds', () => {
  assert.equal(starsFor(0.95), 3);
  assert.equal(starsFor(0.8), 2);
  assert.equal(starsFor(0.5), 1);
  assert.equal(starsFor(0.3), 0);
});

const tone = (midi, level = 0.2) => ({ freq: midiToFreq(midi), level });
const silence = { freq: null, level: 0 };

function run(tracker, frames) {
  const out = [];
  frames.forEach(([reading, ms]) => {
    for (let t = 0; t < ms; t += 30) {
      const n = tracker.feed(reading, 30);
      if (n !== null) out.push(n);
    }
  });
  return out;
}

test('tracker emits one note per stable pitch', () => {
  const notes = run(createTracker(), [[tone(69), 400], [tone(71), 400], [tone(73), 400]]);
  assert.deepEqual(notes, [69, 71, 73]);
});

test('tracker ignores pitch blips shorter than the stable time', () => {
  const notes = run(createTracker(), [[tone(69), 400], [tone(76), 60], [tone(69), 400]]);
  assert.deepEqual(notes, [69]);
});

test('tracker does not repeat a note while it fades out', () => {
  assert.deepEqual(run(createTracker(), [[tone(69, 0.15), 300], [tone(69, 0.07), 60], [silence, 120], [tone(71), 300]]), [69, 71]);
});

test('tracker repeats a note after a short silence or a bow-change dip', () => {
  assert.deepEqual(run(createTracker(), [[tone(69), 400], [silence, 90], [tone(69), 400]]), [69, 69]);
  assert.deepEqual(run(createTracker(), [[tone(69, 0.3), 400], [tone(69, 0.1), 60], [tone(69, 0.3), 400]]), [69, 69]);
});
