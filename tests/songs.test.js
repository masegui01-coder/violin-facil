import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SONGS, STYLES } from '../js/songs.js';
import { UNITS, buildCourse, lessonStates, lessonKey, lessonSong } from '../js/course.js';
import { parseScore, fingering, keySignature, parseNote } from '../js/music.js';

const courseExercises = UNITS.flatMap(u => u.lessons.filter(l => l.song).map(l => l.song));

for (const song of [...SONGS, ...courseExercises]) {
  test(`${song.id}: every bar matches the time signature`, () => {
    const { bars } = parseScore(song.score);
    const pickup = song.pickup || 0;
    bars.forEach((bar, i) => {
      let expected = song.time;
      if (pickup && i === 0) expected = pickup;
      if (pickup && i === bars.length - 1) expected = song.time - pickup;
      assert.equal(bar.beats, expected, `compás ${i + 1} dura ${bar.beats} y debería durar ${expected}`);
    });
  });

  test(`${song.id}: playable in first position with a valid key`, () => {
    keySignature(song.key);
    parseScore(song.score).notes.filter(n => !n.rest).forEach(n => {
      assert.ok(fingering(n.midi), `nota ${n.midi} fuera de la primera posición`);
    });
  });
}

test('songs have unique ids, known styles and difficulty 1-3', () => {
  const ids = SONGS.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  SONGS.forEach(s => {
    assert.ok(STYLES.some(st => st.id === s.style), s.id);
    assert.ok([1, 2, 3].includes(s.difficulty), s.id);
  });
});

test('note exercises only use first-position notes', () => {
  UNITS.flatMap(u => u.lessons).filter(l => l.kind === 'notes').forEach(l => {
    l.notes.split(' ').forEach(n => assert.ok(fingering(parseNote(n).midi), `${l.id}: ${n}`));
  });
});

test('course style slots follow the chosen styles and never repeat a song', () => {
  const course = buildCourse(['rock']);
  const slots = course.flatMap(u => u.lessons).filter(l => l.slot);
  const ids = slots.map(l => l.songId);
  assert.equal(new Set(ids).size, ids.length);
  const firstUnitSlots = course.find(u => u.id === 'u4').lessons.filter(l => l.slot);
  assert.ok(firstUnitSlots.every(l => lessonSong(l).style === 'rock'));
});

test('changing styles changes the style slots', () => {
  const a = buildCourse(['clasica']).flatMap(u => u.lessons).filter(l => l.slot).map(l => l.songId);
  const b = buildCourse(['navidad']).flatMap(u => u.lessons).filter(l => l.slot).map(l => l.songId);
  assert.notDeepEqual(a, b);
});

test('lessons unlock in order and style slots do not block progress', () => {
  const course = buildCourse(['jazz']);
  const states = lessonStates(course, {});
  assert.equal(states['u1-intro'], 'open');
  assert.equal(states['u1-ae'], 'locked');
  const done = { [lessonKey(course[0].lessons[0])]: 3 };
  assert.equal(lessonStates(course, done)['u1-ae'], 'open');
  const basic = lessonStates(course, {}, { level: 'basic' });
  assert.equal(basic['u3-scale'], 'open');
  assert.equal(basic['u4-intro'], 'open');
  assert.equal(basic['u4-e123'], 'locked');
  assert.equal(basic['u4-tu1'], 'open');
  const all = lessonStates(course, {}, { unlockAll: true });
  assert.ok(Object.values(all).every(s => s === 'open'));
});
