import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS, instrumentById, writtenToSounding, soundingToWritten } from '../js/instruments.js';
import { detectPitch } from '../js/pitch.js';
import { midiToFreq, freqToMidi, setReferenceA } from '../js/music.js';

function tone(freq, sampleRate, harmonics = 6, size = 2048) {
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    let s = 0;
    for (let h = 1; h <= harmonics; h++) s += Math.sin(2 * Math.PI * freq * h * i / sampleRate) / h;
    buf[i] = 0.3 * s;
  }
  return buf;
}

test('Bb instruments sound a major second lower than written, alto sax a major sixth lower', () => {
  assert.equal(writtenToSounding(60, instrumentById('trumpet')), 58);
  assert.equal(writtenToSounding(60, instrumentById('clarinet')), 58);
  assert.equal(writtenToSounding(60, instrumentById('sax')), 51);
  assert.equal(soundingToWritten(58, instrumentById('trumpet')), 60);
  assert.equal(writtenToSounding(72, instrumentById('flute')), 72);
});

for (const inst of INSTRUMENTS.filter(i => !i.rhythmOnly)) {
  test(`${inst.name}: the detector hears its whole written range`, () => {
    for (let w = inst.written[0]; w <= inst.written[1]; w++) {
      const f = midiToFreq(writtenToSounding(w, inst));
      const got = detectPitch(tone(f, 48000), 48000, inst.minHz, inst.maxHz);
      assert.ok(got, `${inst.id} ${w}`);
      assert.ok(Math.abs(freqToMidi(got) - writtenToSounding(w, inst)) * 100 < 3, `${inst.id} ${w}: ${freqToMidi(got)}`);
    }
  });
}

test('a 442 Hz reference shifts the whole scale', () => {
  setReferenceA(442);
  assert.equal(midiToFreq(69), 442);
  assert.ok(Math.abs(freqToMidi(442) - 69) < 1e-9);
  setReferenceA(440);
});

test('unknown instrument ids fall back to violin', () => {
  assert.equal(instrumentById('banjo').id, 'violin');
});

import { fingeringFor as fingerOf, fingeringText as fingerText2 } from '../js/fingerings.js';

test('brass fingerings come from the harmonic series', () => {
  const v = (id, m) => fingerOf(id, m).valves.join('');
  assert.equal(v('horn', 62), '1');      // trompa: Re4 con el 1
  assert.equal(v('horn', 69), '12');     // La4 con 1-2
  assert.equal(v('horn', 71), '2');      // Si4 con el 2
  assert.equal(v('tuba', 48), '1');      // tuba: Do3 con el 1
  assert.equal(v('tuba', 45), '2');      // La2 con el 2
  assert.equal(v('flugelhorn', 64), '12');
  assert.equal(fingerOf('trombone', 48).position, 6);  // trombón: Do3 en 6.ª
  assert.equal(fingerOf('trombone', 50).position, 4);  // Re3 en 4.ª
  assert.equal(fingerOf('trombone', 58).position, 1);  // Si♭3 en 1.ª
  assert.match(fingerText2('trombone', 51, 'eu'), /3\.ª posición/);
  assert.match(fingerText2('bass-clarinet', 60, 'eu'), /pulgar/);
});
