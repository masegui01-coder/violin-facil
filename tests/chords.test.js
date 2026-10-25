import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromaFromSpectrum, matchChord } from '../js/chroma.js';
import { parseChord, chordLabel, guitarMidis, pianoMidis, guitarChangeCost } from '../js/chords.js';

const SR = 48000, FFT = 16384;
// Espectro sintético en dB: cada nota con 6 armónicos que se van apagando
function spectrum(midis, { detuneCents = 0, noise = -110, harmonics = 6 } = {}) {
  const lin = new Float64Array(FFT / 2).fill(10 ** (noise / 20));
  midis.forEach(m => {
    const f0 = 440 * 2 ** ((m - 69 + detuneCents / 100) / 12);
    for (let h = 1; h <= harmonics; h++) {
      const bin = f0 * h / (SR / FFT);
      for (let k = Math.floor(bin) - 3; k <= Math.ceil(bin) + 3; k++) {
        if (k > 0 && k < lin.length) lin[k] += (0.3 / h) * Math.exp(-((k - bin) ** 2) / 1.2);
      }
    }
  });
  return Float32Array.from(lin, v => 20 * Math.log10(v));
}
const heard = (midis, name, opts) => matchChord(chromaFromSpectrum(spectrum(midis, opts), SR, FFT), parseChord(name).pcs).ok;

test('recognises guitar chords strummed with the open shapes', () => {
  for (const name of ['Em', 'Am', 'E', 'A', 'D', 'G', 'C', 'Dm', 'G7']) assert.ok(heard(guitarMidis(name), name), name);
});

test('copes with bright tones full of harmonics', () => {
  for (const name of ['Em', 'Am', 'D', 'G', 'C']) assert.ok(heard(guitarMidis(name), name, { harmonics: 20 }), name);
  assert.ok(!heard(guitarMidis('C'), 'Am', { harmonics: 20 }));
  assert.ok(!heard(guitarMidis('E'), 'Em', { harmonics: 20 }));
});

test('does not accept a different chord', () => {
  assert.ok(!heard(guitarMidis('C'), 'Am'));
  assert.ok(!heard(guitarMidis('G'), 'Em'));
  assert.ok(!heard(guitarMidis('D'), 'Dm'));
  assert.ok(!heard(guitarMidis('E'), 'Em'));
  assert.ok(!heard([], 'C'));
});

test('recognises piano chords even a little out of tune', () => {
  for (const name of ['C', 'F', 'G', 'Am']) assert.ok(heard(pianoMidis(name), name, { detuneCents: 15 }), name);
});

test('chord names in both nomenclatures', () => {
  assert.equal(chordLabel('Am'), 'Lam');
  assert.equal(chordLabel('F#m', 'eu'), 'Fa♯m');
  assert.equal(chordLabel('Fmaj7', 'eu'), 'Fa7M');
  assert.equal(chordLabel('G7', 'us'), 'G7');
  assert.deepEqual(parseChord('Bb').pcs, [10, 2, 5]);
  assert.ok(guitarChangeCost('Em', 'Em7') < guitarChangeCost('Em', 'D'));
});

import { changeCounter, strumWindows, strumStars, changesStars, holdStars, smoother } from '../js/chord-practice.js';
import { SONGBOOK, parseChart, songbookStatus, playableCount, songbookLesson } from '../js/songbook.js';

test('one-minute changes count every switch once the chord is stable', () => {
  const c = changeCounter(150);
  const feed = [['A', 0], ['A', 200], [null, 300], ['D', 400], ['D', 600], ['D', 800], ['A', 900], ['A', 1000], ['A', 1100], ['D', 1200], ['A', 1250]];
  feed.forEach(([n, t]) => c.feed(n, t));
  assert.equal(c.count, 2);
});

test('strum windows, stars and smoothing', () => {
  const w = strumWindows(parseChart('G | D C', 4));
  assert.deepEqual(w.map(x => [x.chord, x.start, x.end]), [['G', 0, 4], ['D', 4, 6], ['C', 6, 8]]);
  assert.equal(strumStars(0.95), 3);
  assert.equal(strumStars(0.4), 0);
  assert.equal(changesStars(30, 25), 3);
  assert.equal(changesStars(16, 25), 2);
  assert.equal(holdStars([2, 3, 3], 0, 3), 3);
  assert.equal(holdStars([9, 12], 2, 3), 0);
  const s = smoother(2);
  s.push(new Array(12).fill(0).map((_, i) => (i === 0 ? 1 : 0)));
  s.push(new Array(12).fill(0).map((_, i) => (i === 4 ? 1 : 0)));
  assert.equal(s.value()[0], 0.5);
});

test('songbook unlocks songs as you learn chords and every chart is valid', () => {
  SONGBOOK.forEach(e => assert.ok(songbookLesson(e).chart.length > 0, e.id));
  assert.equal(songbookStatus([]).filter(x => !x.missing.length).length, 0);
  assert.ok(playableCount(['D', 'A']) >= 2);
  assert.ok(playableCount(['D', 'A', 'G', 'C', 'Em', 'Am']) > playableCount(['D', 'A']));
});
