import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mean, std, slope, vibrato, analyzeLongTone, longToneTip } from '../js/analysis.js';

const DT = 30;

test('basic statistics', () => {
  assert.equal(mean([1, 2, 3]), 2);
  assert.ok(Math.abs(std([2, 4, 4, 4, 5, 5, 7, 9]) - 2.138) < 0.01);
  assert.ok(Math.abs(slope([0, 1, 2], [1, 3, 5]) - 2) < 1e-9);
});

test('vibrato detects rate and width of a 5.5 Hz, ±15 cents oscillation', () => {
  const cents = Array.from({ length: 200 }, (_, i) => 15 * Math.sin(2 * Math.PI * 5.5 * i * DT / 1000));
  const v = vibrato(cents, DT);
  assert.ok(v, 'sin vibrato');
  assert.ok(Math.abs(v.rate - 5.5) < 0.6, `rate ${v.rate}`);
  assert.ok(v.width > 22 && v.width < 38, `width ${v.width}`);
});

test('a steady tone has no vibrato', () => {
  assert.equal(vibrato(Array.from({ length: 200 }, () => 3), DT), null);
});

test('long tone analysis reports pitch rising with volume', () => {
  const frames = Array.from({ length: 200 }, (_, i) => {
    const level = 0.02 + 0.2 * i / 200;
    return { level, cents: 2 + 0.6 * 20 * Math.log10(level / 0.02) };
  });
  const r = analyzeLongTone(frames, DT);
  assert.ok(r.centsPer10dB > 5, `pendiente ${r.centsPer10dB}`);
  assert.match(longToneTip(r), /volumen te vas alto/);
});

test('silence gives no analysis and a helpful tip', () => {
  assert.equal(analyzeLongTone([{ cents: null, level: 0 }], DT), null);
  assert.match(longToneTip(null), /No he oído/);
});
