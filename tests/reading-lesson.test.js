// Fichas solo de lectura: se marcan como leídas (recompensa fija) sin dar estrellas por rendimiento, y no bloquean el avance.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse, isReadingLesson, READ_STARS, lessonStates, lessonKey } from '../js/course.js';

test('theory cards without questions are reading lessons; quizzes and exams are not', () => {
  assert.equal(isReadingLesson({ kind: 'theory', cards: [{}] }), true);
  assert.equal(isReadingLesson({ kind: 'theory', cards: [{}], quiz: [] }), true);
  assert.equal(isReadingLesson({ kind: 'theory', cards: [{}], quiz: [{ id: 'q' }] }), false);
  assert.equal(isReadingLesson({ kind: 'theory', exam: true, quiz: [] }), false);
  assert.equal(isReadingLesson({ kind: 'notes' }), false);
  assert.equal(isReadingLesson(null), false);
});

test('reading the first violin card unlocks the next lesson with the fixed reward', () => {
  const course = buildCourse(['clasica'], 'violin');
  const first = course[0].lessons[0];
  assert.ok(isReadingLesson(first), 'Conoce tu violín is reading only');
  assert.ok(READ_STARS > 0 && READ_STARS < 3, 'not a perfect score');
  const before = lessonStates(course, {});
  const after = lessonStates(course, { [lessonKey(first)]: READ_STARS });
  const second = course[0].lessons.find(l => !l.optional && l.id !== first.id);
  assert.equal(before[second.id], 'locked');
  assert.equal(after[first.id], 'done');
  assert.equal(after[second.id], 'open');
});

test('the violin «Cuatro cuerdas» card carries its own drawing', () => {
  const course = buildCourse(['clasica'], 'violin');
  const card = course[0].lessons[0].cards.find(c => c.title === 'Cuatro cuerdas');
  assert.equal(card.art, 'violin-strings');
});
