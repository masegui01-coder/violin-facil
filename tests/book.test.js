import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse } from '../js/course.js';
import { buildBook, recordPlay, medalOf, nextGoal, chapterStats, reviewPage } from '../js/book.js';

test('el libro numera las páginas seguidas, sin huecos ni píldoras', () => {
  const book = buildBook(buildCourse(['folk'], 'sax'));
  const numbers = book.flatMap(c => c.pages.map(p => p.number));
  assert.deepEqual(numbers, numbers.map((_, i) => i + 1));
  assert.ok(book.every(c => c.pages.every(p => !p.lesson.slot && !p.lesson.pill)));
  assert.equal(book[0].number, 1);
});

test('medallas: bronce al pasarla, plata repitiéndola y oro dominándola', () => {
  let p = null;
  p = recordPlay(p, { stars: 1, at: 1 });
  assert.equal(medalOf(p, 'notes'), 'bronze');
  p = recordPlay(p, { stars: 2, at: 2 });
  p = recordPlay(p, { stars: 2, at: 3 });
  p = recordPlay(p, { stars: 3, at: 4 });
  assert.equal(medalOf(p, 'notes'), 'silver');
  p = recordPlay(p, { stars: 2, at: 5 });
  assert.equal(medalOf(p, 'notes'), 'silver');
  p = recordPlay(p, { stars: 3, perfect: true, at: 6 });
  assert.equal(medalOf(p, 'notes'), 'gold');
  assert.equal(medalOf(recordPlay(null, { stars: 3, at: 1 }), 'theory'), 'gold');
});

test('dice qué falta para la siguiente medalla', () => {
  assert.match(nextGoal(null, 'song'), /bronce/);
  assert.match(nextGoal(recordPlay(null, { stars: 2, at: 1 }), 'song'), /2 veces más/);
});

test('repaso de hoy: la página empezada más olvidada, nunca una de hoy ni de oro', () => {
  const book = [{ pages: [
    { lesson: { id: 'a', kind: 'notes' } }, { lesson: { id: 'b', kind: 'notes' } }, { lesson: { id: 'c', kind: 'theory' } },
  ] }];
  const plays = { a: recordPlay(null, { stars: 2, at: 50 }), b: recordPlay(null, { stars: 2, at: 10 }), c: recordPlay(null, { stars: 1, at: 1 }) };
  assert.equal(reviewPage(book, plays, 100).page.lesson.id, 'b');
  assert.equal(reviewPage(book, plays, 20).page.lesson.id, 'b');
  assert.equal(reviewPage(book, plays, 5), null);
  const stats = chapterStats(book[0], plays);
  assert.equal(stats.started, 3);
  assert.equal(stats.stamp, 'done');
});
