import { test } from 'node:test';
import assert from 'node:assert/strict';
import { technique, sightReading, MAJOR_KEYS, EXERCISE_IDS, keyLabel } from '../js/generate.js';
import { INSTRUMENTS } from '../js/instruments.js';
import { parseScore, keySignature, accidentalToShow } from '../js/music.js';

const inRange = (song, inst) => parseScore(song.score).notes.filter(n => !n.rest).every(n => n.midi >= inst.written[0] && n.midi <= inst.written[1]);
const barsOk = song => parseScore(song.score).bars.every(b => b.beats === song.time);

test('every instrument can play the scale exercise in all 12 major keys, in range and spelled in key', () => {
  for (const inst of INSTRUMENTS.filter(i => !i.rhythmOnly)) {
    for (const key of MAJOR_KEYS) {
      for (const kind of EXERCISE_IDS) {
        const song = technique(kind, key, inst, 80);
        if (!song) continue;
        assert.ok(inRange(song, inst), `${inst.id} ${kind} ${key}`);
        assert.ok(barsOk(song), `${inst.id} ${kind} ${key}: ${song.score}`);
        const sig = keySignature(key);
        parseScore(song.score).notes.filter(n => !n.rest).forEach(n => assert.equal(accidentalToShow(n, sig), null, `${inst.id} ${key} ${n.letter}${n.acc}`));
      }
      assert.ok(technique('scale', key, inst, 80), `${inst.id} sin escala de ${key}`);
    }
  }
});

test('sight reading is deterministic, fits the bars and the range at every level', () => {
  for (const inst of INSTRUMENTS.filter(i => !i.rhythmOnly)) {
    for (const level of [1, 2, 3]) {
      for (let seed = 1; seed <= 25; seed++) {
        const a = sightReading(level, inst, seed);
        assert.equal(a.score, sightReading(level, inst, seed).score);
        assert.ok(barsOk(a), `${inst.id} L${level} s${seed}: ${a.score}`);
        assert.ok(inRange(a, inst), `${inst.id} L${level} s${seed}`);
        keySignature(a.key);
      }
    }
  }
});

test('key labels read naturally in Spanish', () => {
  assert.equal(keyLabel('Bb'), 'Si♭ mayor');
  assert.equal(keyLabel('F#m'), 'Fa♯ menor');
});
