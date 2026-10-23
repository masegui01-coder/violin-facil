import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNote, parseScore, fingering, noteLabel, keySignature, accidentalToShow, freqToMidi, midiToFreq } from '../js/music.js';

test('parseNote reads letter, accidental and octave', () => {
  assert.deepEqual(parseNote('A4'), { letter: 'A', acc: 0, oct: 4, midi: 69 });
  assert.equal(parseNote('C#5').midi, 73);
  assert.equal(parseNote('Bb3').midi, 58);
  assert.equal(parseNote('G3').midi, 55);
});

test('parseNote rejects invalid notes', () => {
  assert.throws(() => parseNote('H4'));
  assert.throws(() => parseNote('A'));
});

test('parseScore computes beats, start times and bars', () => {
  const s = parseScore('| D4q E4e F#4e G4h | A4q. B4e R h |');
  assert.equal(s.notes.length, 7);
  assert.deepEqual(s.notes.map(n => n.beats), [1, 0.5, 0.5, 2, 1.5, 0.5, 2]);
  assert.deepEqual(s.notes.map(n => n.start), [0, 1, 1.5, 2, 4, 5.5, 6]);
  assert.equal(s.notes[6].rest, true);
  assert.deepEqual(s.bars.map(b => b.beats), [4, 4]);
  assert.equal(s.totalBeats, 8);
});

test('parseScore accepts tokens with no space before the dot', () => {
  const s = parseScore('| A4e. A4s B4q |');
  assert.deepEqual(s.notes.map(n => n.beats), [0.75, 0.25, 1]);
});

test('fingering picks open strings first and labels low/high fingers', () => {
  assert.deepEqual(fingering(69), { string: 'A', offset: 0, finger: 0, tag: '' });
  assert.deepEqual(fingering(73), { string: 'A', offset: 4, finger: 2, tag: 'alto' });
  assert.deepEqual(fingering(72), { string: 'A', offset: 3, finger: 2, tag: 'bajo' });
  assert.deepEqual(fingering(60), { string: 'G', offset: 5, finger: 3, tag: '' });
  assert.deepEqual(fingering(77), { string: 'E', offset: 1, finger: 1, tag: 'bajo' });
  assert.deepEqual(fingering(83), { string: 'E', offset: 7, finger: 4, tag: '' });
  assert.equal(fingering(54), null);
  assert.equal(fingering(86), null);
});

test('noteLabel follows the chosen nomenclature and spelling', () => {
  assert.equal(noteLabel(parseNote('A4'), 'eu'), 'La');
  assert.equal(noteLabel(parseNote('A4'), 'us'), 'A4');
  assert.equal(noteLabel(parseNote('Bb4'), 'eu'), 'Si♭');
  assert.equal(noteLabel(parseNote('F#5'), 'us'), 'F♯5');
  assert.equal(noteLabel({ midi: 70 }, 'eu'), 'La♯');
});

test('key signatures and accidentals to draw', () => {
  assert.deepEqual(keySignature('D'), { F: 1, C: 1 });
  assert.deepEqual(keySignature('F'), { B: -1 });
  assert.deepEqual(keySignature('Am'), {});
  const sig = keySignature('G');
  assert.equal(accidentalToShow(parseNote('F#4'), sig), null);
  assert.equal(accidentalToShow(parseNote('F4'), sig), 'natural');
  assert.equal(accidentalToShow(parseNote('C#5'), sig), 'sharp');
  assert.equal(accidentalToShow(parseNote('Bb4'), keySignature('C')), 'flat');
});

test('frequency conversions are inverse', () => {
  assert.equal(midiToFreq(69), 440);
  assert.ok(Math.abs(freqToMidi(midiToFreq(62)) - 62) < 1e-9);
});
