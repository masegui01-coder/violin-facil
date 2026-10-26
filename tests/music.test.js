import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNote, parseScore, fingering, fingerText, isBowed, noteLabel, keySignature, accidentalToShow, freqToMidi, midiToFreq } from '../js/music.js';

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

import { transposeKey, transposeScore } from '../js/music.js';

test('transposes keys to the simplest signature', () => {
  assert.equal(transposeKey('D', 2), 'E');        // trompeta en Si♭: Re de concierto se escribe en Mi
  assert.equal(transposeKey('Bb', 2), 'C');
  assert.equal(transposeKey('F', 9), 'D');        // saxo alto en Mi♭
  assert.equal(transposeKey('Am', 2), 'Bm');
  assert.equal(transposeKey('G', 0), 'G');
});

test('transposes scores keeping the right spelling', () => {
  const src = parseScore('| D4q F#4q A4q C#5q | Bb4h R h |');
  const { score, key } = transposeScore(src, 'D', 2);
  assert.equal(key, 'E');
  const names = score.notes.filter(n => !n.rest).map(n => n.letter + (n.acc === 1 ? '#' : n.acc === -1 ? 'b' : '') + n.oct);
  assert.deepEqual(names, ['E4', 'G#4', 'B4', 'D#5', 'C5']);
  assert.equal(score.notes[4].midi, 72);
  const sax = transposeScore(parseScore('| F4q A4q C5q |'), 'F', 9);
  assert.equal(sax.key, 'D');
  assert.deepEqual(sax.score.notes.map(n => n.letter + n.oct), ['D5', 'F5', 'A5']);
  assert.deepEqual(sax.score.notes.map(n => n.acc), [0, 1, 0]);
});

test('parseScore entiende grupos irregulares, articulaciones, matices y cambios de compás y clave', () => {
  const s = parseScore('@time:6/8 @mf (C5e\' D5e E5e) | @< F5e:3 G5e:3 A5e:3 @| B5q>U~ | @time:2/4 @clef:bass @rit C3s:6 D3s:6 E3s:6 F3s:6 G3s:6 A3s:6 g:B3 C4q.. | R t @ff');
  const [a, , c, d] = s.notes;
  assert.deepEqual(s.bars[0].meter, [6, 8]);
  assert.equal(s.bars[0].beats, 1.5);
  assert.ok(a.slurStart && a.staccato && a.marks.dyn[0] === 'mf' && a.marks.meter);
  assert.ok(c.slurEnd);
  assert.equal(d.tuplet, 3);
  assert.ok(Math.abs(d.beats - 1 / 3) < 1e-9);
  const trip = s.notes.filter(n => n.tuplet === 3);
  assert.equal(new Set(trip.map(n => n.tupletId)).size, 1);
  const b = s.notes[6];
  assert.ok(b.accent && b.fermata && b.tie && b.marks.hairpin[0] === 'end');
  const sext = s.notes.filter(n => n.tuplet === 6);
  assert.equal(sext.length, 6);
  assert.equal(sext[0].clef, 'bass');
  assert.equal(sext[0].marks.text[0], 'rit.');
  const dd = s.notes.find(n => n.dots === 2);
  assert.equal(dd.beats, 1.75);
  assert.equal(dd.grace[0].letter, 'B');
  assert.equal(s.notes[s.notes.length - 1].dur, 't');
  assert.deepEqual(s.endMarks.dyn, ['ff']);
});

test('violonchelo: digitación en primera posición (1-3-4, el 2 para la tercera menor y extensión hacia atrás)', () => {
  const f = n => fingering(parseNote(n).midi, 'cello');
  assert.deepEqual([f('C2'), f('G2'), f('D3'), f('A3')].map(x => [x.string, x.finger]), [['C', 0], ['G', 0], ['D', 0], ['A', 0]]);
  assert.deepEqual(['B3', 'C4', 'C#4', 'D4'].map(n => f(n).finger), [1, 2, 3, 4]);
  assert.equal(f('Bb3').tag, 'extendido atrás');
  assert.deepEqual([f('E2').finger, f('F2').finger, f('B2').finger, f('C3').finger], [3, 4, 3, 4]);
  assert.equal(f('E4'), null);
  assert.equal(fingerText(parseNote('F#3').midi, 'eu', 'cello'), 'Cuerda Re · dedo 3');
  assert.ok(isBowed('cello') && isBowed('violin') && !isBowed('sax'));
});
