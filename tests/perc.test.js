import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse, lessonStates, lessonSong } from '../js/course.js';
import { parseScore } from '../js/music.js';

const course = buildCourse(['clasica', 'rock'], 'percussion');
const lessons = course.flatMap(u => u.lessons);

test('percussion course has unique lessons and starts open', () => {
  assert.equal(new Set(lessons.map(l => l.id)).size, lessons.length);
  assert.equal(lessonStates(course, {})[lessons[0].id], 'open');
});

for (const l of lessons.filter(x => x.song)) {
  test(`${l.id}: bars fit the time signature and every hit has a hand`, () => {
    const { bars, notes } = parseScore(l.song.score);
    bars.forEach((b, i) => assert.equal(b.beats, l.song.time, `compás ${i + 1}: ${b.beats}`));
    const hits = notes.filter(n => !n.rest).length;
    assert.equal(l.sticking.length, hits, `${l.id}: ${l.sticking.length} manos para ${hits} golpes`);
    l.sticking.forEach(h => assert.ok(h === 'D' || h === 'I', h));
  });
}

test('song slots use the rhythm of any repertoire song', () => {
  const slots = lessons.filter(l => l.slot);
  assert.ok(slots.length >= 4);
  slots.forEach(l => assert.ok(lessonSong(l)));
});

import { rhythmReading } from '../js/generate.js';

test('rhythm reading fits the bars and has one hand per hit at every level', () => {
  for (const level of [1, 2, 3]) {
    for (let seed = 1; seed <= 30; seed++) {
      const song = rhythmReading(level, seed);
      const { bars, notes } = parseScore(song.score);
      bars.forEach((b, i) => assert.equal(b.beats, song.time, `L${level} s${seed} compás ${i + 1}: ${song.score}`));
      assert.equal(song.sticking.length, notes.filter(n => !n.rest).length);
    }
  }
});
