import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schoolYear, nextSchoolYear, premiumActive, studentLimit, schoolBookOpen, bookSummary, promote, TRIAL_STUDENTS } from '../js/school.js';

test('el curso escolar empieza en septiembre', () => {
  assert.equal(schoolYear(new Date(2026, 9, 26)), '2026-2027');
  assert.equal(schoolYear(new Date(2027, 5, 10)), '2026-2027');
  assert.equal(schoolYear(new Date(2027, 8, 1)), '2027-2028');
  assert.equal(nextSchoolYear('2026-2027'), '2027-2028');
});

test('premium: activo hasta su fecha; sin él, modo prueba con pocos alumnos', () => {
  const now = Date.UTC(2026, 9, 26);
  assert.equal(premiumActive({ premium: { active: true, until: '2027-08-31' } }, now), true);
  assert.equal(premiumActive({ premium: { active: true, until: '2026-08-31' } }, now), false);
  assert.equal(premiumActive({}, now), false);
  assert.equal(studentLimit({}), TRIAL_STUDENTS);
});

test('el alumno abre el libro de su curso y los anteriores, no los siguientes', () => {
  assert.equal(schoolBookOpen(1, 2), true);
  assert.equal(schoolBookOpen(2, 2), true);
  assert.equal(schoolBookOpen(3, 2), false);
});

test('resumen del libro y paso de curso', () => {
  const book = { n: 1, chapters: [{ pages: [{ lesson: { id: 'a', kind: 'notes' } }, { lesson: { id: 't', kind: 'theory' } }, { lesson: { id: 'x', kind: 'theory', exam: true } }] }] };
  const s = bookSummary(book, { a: { best: 2, good: 1, last: 5 }, t: { best: 3, last: 9 }, x: { best: 2, last: 7 } });
  assert.deepEqual(s, { book: 1, done: 3, total: 3, gold: 2, examPassed: true, last: 9 });
  assert.equal(promote(1, s), 2);
  assert.equal(promote(1, { ...s, examPassed: false }), 1);
  assert.equal(promote(3, { ...s, book: 3 }), 3);
});
