import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOnsetDetector, scoreRhythm, accentContrast, rhythmTip } from '../js/onsets.js';

const SR = 48000;

// Señal con golpes (ruido que decae) en los instantes indicados, más un poco de ruido de fondo
function drumTrack(times, seconds, amps = []) {
  const buf = new Float32Array(Math.round(seconds * SR));
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  for (let i = 0; i < buf.length; i++) buf[i] = rnd() * 0.004;
  times.forEach((t, k) => {
    const start = Math.round(t * SR);
    for (let i = 0; i < SR * 0.12 && start + i < buf.length; i++) buf[start + i] += rnd() * (amps[k] ?? 0.8) * Math.exp(-i / (SR * 0.02));
  });
  return buf;
}

function detectAll(buf, chunk = 1024) {
  const det = createOnsetDetector(SR);
  const hits = [];
  for (let i = 0; i < buf.length; i += chunk) hits.push(...det.feed(buf.subarray(i, i + chunk), i / SR));
  return hits;
}

test('detects each drum hit within 5 ms', () => {
  const times = [0.5, 1.0, 1.25, 1.5, 2.0, 2.125, 2.25];
  const hits = detectAll(drumTrack(times, 2.6));
  assert.equal(hits.length, times.length);
  hits.forEach((h, i) => assert.ok(Math.abs(h.time - times[i]) < 0.005, `${h.time} vs ${times[i]}`));
});

test('ignores background noise', () => {
  assert.equal(detectAll(drumTrack([], 2)).length, 0);
});

test('scores timing: perfect, good, late, missed and extra', () => {
  const r = scoreRhythm([1, 2, 3, 4], [{ time: 1.01, strength: 1 }, { time: 2.06, strength: 1 }, { time: 3.1, strength: 1 }, { time: 5, strength: 1 }]);
  assert.deepEqual(r.results.map(x => x.status), ['perfect', 'good', 'late', 'miss']);
  assert.equal(r.extra, 1);
  assert.ok(r.accuracy > 0.5 && r.accuracy < 0.6);
});

test('latency compensation shifts every hit', () => {
  const r = scoreRhythm([1, 2], [{ time: 1.08, strength: 1 }, { time: 2.08, strength: 1 }], 0.08);
  assert.deepEqual(r.results.map(x => x.status), ['perfect', 'perfect']);
});

test('accent contrast compares strong and weak hits', () => {
  const results = [{ strength: 2 }, { strength: 1 }, { strength: 1 }, { strength: 1 }];
  assert.equal(accentContrast(results, [true, false, false, false]), 2);
});

test('tips name the main problem', () => {
  assert.match(rhythmTip({ meanOffset: -40, spread: 10, results: [{ status: 'good' }] }), /adelantarte/);
  assert.match(rhythmTip({ meanOffset: 2, spread: 10, results: [{ status: 'perfect' }] }), /firme/);
});
