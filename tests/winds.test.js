import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS } from '../js/instruments.js';
import { buildCourse, lessonSong, lessonStates } from '../js/course.js';
import { parseNote, parseScore } from '../js/music.js';
import { octaveShiftFor, songScore } from '../js/songs.js';
import { fingeringFor, fingeringText } from '../js/fingerings.js';

const winds = INSTRUMENTS.filter(i => i.id !== 'violin' && !i.rhythmOnly);

for (const inst of winds) {
  test(`${inst.name}: course notes stay in range and every lesson has a unique id`, () => {
    const course = buildCourse(['clasica', 'rock'], inst.id);
    const lessons = course.flatMap(u => u.lessons);
    assert.equal(new Set(lessons.map(l => l.id)).size, lessons.length);
    lessons.filter(l => l.kind === 'notes').forEach(l => l.notes.split(' ').forEach(n => {
      const m = parseNote(n).midi;
      assert.ok(m >= inst.written[0] && m <= inst.written[1], `${l.id}: ${n}`);
    }));
    lessons.filter(l => l.song).forEach(l => {
      const { bars, notes } = parseScore(l.song.score);
      // las frases de una canción con anacrusa empiezan o acaban en un compás incompleto, como la canción
      const partial = i => l.fromSong && (i === 0 || i === bars.length - 1);
      bars.forEach((b, i) => assert.ok(partial(i) || b.beats === l.song.time, `${l.id} compás ${i + 1}`));
      notes.filter(n => !n.rest).forEach(n => assert.ok(n.midi >= inst.written[0] && n.midi <= inst.written[1], `${l.id}: ${n.midi}`));
    });
  });

  test(`${inst.name}: every song lesson fits the instrument with an octave shift`, () => {
    buildCourse(['clasica', 'folk', 'jazz', 'rock', 'navidad', 'populares'], inst.id).flatMap(u => u.lessons)
      .filter(l => l.songId).forEach(l => assert.notEqual(octaveShiftFor(lessonSong(l), inst), null, `${inst.id} ${l.songId}`));
  });

  test(`${inst.name}: the first unit has fingerings for its notes`, () => {
    inst.firstNotes.forEach(n => assert.ok(fingeringFor(inst.id, parseNote(n).midi), `${inst.id} ${n}`));
  });

  test(`${inst.name}: the course starts with the theory lesson open`, () => {
    const course = buildCourse(['clasica'], inst.id);
    const states = lessonStates(course, {});
    assert.equal(states[course[0].lessons[0].id], 'open');
  });
}

test('trumpet valves follow the standard chart', () => {
  assert.deepEqual(fingeringFor('trumpet', 60).valves, []);
  assert.deepEqual(fingeringFor('trumpet', 62).valves, [1, 3]);
  assert.deepEqual(fingeringFor('trumpet', 61).valves, [1, 2, 3]);
  assert.equal(fingeringText('trumpet', 64, 'eu'), 'Pistones 1 y 2');
  assert.equal(fingeringText('trumpet', 67, 'eu'), 'Sin pistones (al aire)');
});

test('woodwind fingering text names hands, thumb and keys', () => {
  assert.equal(fingeringText('flute', 67, 'eu'), 'pulgar · izq. 1-2-3 · llave Mi♭');
  assert.equal(fingeringText('sax', 74, 'eu'), 'llave de octava · izq. 1-2-3 · der. 1-2-3');
  assert.match(fingeringText('oboe', 61, 'eu'), /consulta/);
});

test('octave shift moves low songs up for the flute', () => {
  const flute = INSTRUMENTS.find(i => i.id === 'flute');
  const low = { score: '| G3q A3q B3q C4q |' };
  assert.equal(octaveShiftFor(low, flute), 12);
  assert.equal(songScore(low).notes.length, 4);
});
