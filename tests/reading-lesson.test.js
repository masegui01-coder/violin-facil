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
  const lessons = course[0].lessons;
  const at = lessons.findIndex(l => l.id === 'u1-intro');
  const first = lessons[at];
  assert.ok(isReadingLesson(first), 'Conoce tu violín is reading only');
  assert.ok(READ_STARS > 0 && READ_STARS < 3, 'not a perfect score');
  // antes de leer se toca la primera nota
  const played = Object.fromEntries(lessons.slice(0, at).filter(l => !l.optional).map(l => [lessonKey(l), 2]));
  const before = lessonStates(course, played);
  const after = lessonStates(course, { ...played, [lessonKey(first)]: READ_STARS });
  const second = lessons.slice(at + 1).find(l => !l.optional);
  assert.equal(before[first.id], 'open');
  assert.equal(before[second.id], 'locked');
  assert.equal(after[first.id], 'done');
  assert.equal(after[second.id], 'open');
});

test('the violin «Cuatro cuerdas» card carries its own drawing', () => {
  const course = buildCourse(['clasica'], 'violin');
  const card = course[0].lessons.find(l => l.id === 'u1-intro').cards.find(c => c.title === 'Cuatro cuerdas');
  assert.equal(card.art, 'violin-strings');
});
