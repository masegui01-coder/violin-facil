import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPitch, rms } from '../js/pitch.js';
import { midiToFreq, freqToMidi } from '../js/music.js';

function violinLike(freq, sampleRate, size = 2048) {
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    let s = 0;
    for (let h = 1; h <= 8; h++) s += Math.sin(2 * Math.PI * freq * h * i / sampleRate) / h;
    buf[i] = 0.3 * s;
  }
  return buf;
}

test('detects every first-position note within 2 cents', () => {
  for (const sr of [44100, 48000]) {
    for (let m = 55; m <= 84; m++) {
      const f = detectPitch(violinLike(midiToFreq(m), sr), sr);
      assert.ok(f, `sin tono para ${m} a ${sr}`);
      assert.ok(Math.abs(freqToMidi(f) - m) * 100 < 2, `nota ${m}: ${freqToMidi(f)}`);
    }
  }
});

test('returns null for noise-free silence', () => {
  assert.equal(detectPitch(new Float32Array(2048), 48000), null);
});

test('rms of a constant signal is its absolute value', () => {
  assert.equal(rms(new Float32Array([0.5, -0.5, 0.5, -0.5])), 0.5);
});
