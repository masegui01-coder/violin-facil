import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse, lessonTitle } from '../js/course.js';
import { parseChord } from '../js/chords.js';
import { parseNote } from '../js/music.js';
import { instrumentById } from '../js/instruments.js';

test('guitar and piano courses: valid chords, notes in range and a real song in the first unit', () => {
  for (const id of ['guitar', 'piano']) {
    const inst = instrumentById(id);
    const course = buildCourse(['clasica', 'populares'], id);
    assert.equal(course.length, 8);
    const first = course[0].lessons;
    assert.ok(first.some(l => (l.kind === 'chords' && l.mode === 'strum') || (l.kind === 'song' && l.song)), id + ' first-day song');
    course.flatMap(u => u.lessons).forEach(l => {
      assert.ok(!/[{}]/.test(lessonTitle(l)), l.id);
      if (l.kind === 'chords') l.chords.forEach(c => parseChord(c));
      if (l.kind === 'notes') {
        const list = l.notes.split(' ');
        list.forEach(n => { const m = parseNote(n).midi; assert.ok(m >= inst.written[0] && m <= inst.written[1], `${l.id} ${n}`); });
        if (l.fingers) assert.equal(l.fingers.split(' ').length, list.length, l.id + ' fingers');
      }
      if (l.kind === 'theory') l.cards.forEach(c => c.chord && parseChord(c.chord));
    });
  }
});
