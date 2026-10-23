import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextStreak, currentStreak, today } from '../js/store.js';

test('streak grows on consecutive days and restarts after a gap', () => {
  const s1 = nextStreak({ count: 0, last: null }, '2026-10-20');
  assert.deepEqual(s1, { count: 1, last: '2026-10-20' });
  assert.deepEqual(nextStreak(s1, '2026-10-20'), s1);
  assert.deepEqual(nextStreak(s1, '2026-10-21'), { count: 2, last: '2026-10-21' });
  assert.deepEqual(nextStreak(s1, '2026-10-23'), { count: 1, last: '2026-10-23' });
});

test('current streak is zero once a day is missed', () => {
  assert.equal(currentStreak({ count: 4, last: '2026-10-22' }, '2026-10-23'), 4);
  assert.equal(currentStreak({ count: 4, last: '2026-10-21' }, '2026-10-23'), 0);
});

test('today formats a local date', () => {
  assert.equal(today(new Date(2026, 0, 5)), '2026-01-05');
});
