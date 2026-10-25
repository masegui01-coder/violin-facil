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

import { pillsFor, reviewQuestion, resolveQuestion } from '../js/theory-pills.js';

test('every instrument gets its own tuning pill plus level pills with valid questions', () => {
  for (const inst of ['violin', 'trumpet', 'clarinet', 'sax', 'sax-tenor', 'sax-bari', 'flute', 'oboe', 'percussion', 'guitar', 'piano']) {
    const pills = pillsFor(inst);
    assert.equal(pills[0].title, 'Tu instrumento y la afinación', inst);
    assert.ok(pills.length >= 6, inst);
    pills.forEach(p => {
      assert.ok(p.cards.length >= 2 && p.cards.length <= 4, p.id);
      (p.quiz || []).forEach(q => {
        const r = resolveQuestion(q, () => 0.99);
        assert.ok(r.answer >= 0 && r.answer < r.options.length, `${inst} ${q.id}`);
      });
    });
    const course = buildCourse([], inst);
    assert.equal(course.flatMap(u => u.lessons).filter(l => l.pill).length, pills.length, inst + ' all pills placed');
  }
});

test('band tuning question matches each instrument transposition', () => {
  const answerFor = inst => { const q = pillsFor(inst)[0].quiz[0]; return q.options[q.answer]; };
  assert.equal(answerFor('trumpet'), 'Do');
  assert.equal(answerFor('clarinet'), 'Do');
  assert.equal(answerFor('sax'), 'Sol');
  assert.equal(answerFor('sax-bari'), 'Sol');
  assert.equal(answerFor('flute'), 'Si♭');
});

test('review prefers questions you got wrong', () => {
  const pills = pillsFor('trumpet').slice(0, 3);
  const q = reviewQuestion(pills, { 'fig-half': { right: 0, wrong: 2 } }, 5);
  assert.equal(q.id, 'fig-half');
  assert.equal(reviewQuestion([], {}, 1), null);
});
