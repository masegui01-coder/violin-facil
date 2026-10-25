import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceStreak, dailyProgress, dailySeed, weekId, earnedBadges } from '../js/engage.js';

test('streak grows day by day and earns a freeze every 7 days', () => {
  let s = { count: 0, last: null }, f = 0;
  for (let d = 1; d <= 7; d++) ({ streak: s, freezes: f } = advanceStreak(s, f, `2026-10-${String(d).padStart(2, '0')}`));
  assert.equal(s.count, 7);
  assert.equal(f, 1);
});

test('a missed day uses a freeze and keeps the streak', () => {
  const r = advanceStreak({ count: 9, last: '2026-10-10' }, 1, '2026-10-12');
  assert.deepEqual(r.streak, { count: 10, last: '2026-10-12' });
  assert.equal(r.freezes, 0);
  assert.equal(r.usedFreezes, 1);
});

test('without freezes a gap restarts the streak', () => {
  const r = advanceStreak({ count: 9, last: '2026-10-10' }, 0, '2026-10-13');
  assert.equal(r.streak.count, 1);
});

test('same day does not change anything', () => {
  const r = advanceStreak({ count: 4, last: '2026-10-10' }, 1, '2026-10-10');
  assert.equal(r.streak.count, 4);
  assert.equal(r.freezes, 1);
});

test('daily goal progress', () => {
  assert.deepEqual(dailyProgress({ '2026-10-25': 6 }, 10, '2026-10-25'), { minutes: 6, goal: 10, done: false, ratio: 0.6 });
});

test('daily challenge seed is shared per day and instrument', () => {
  assert.equal(dailySeed('2026-10-25', 'flute'), dailySeed('2026-10-25', 'flute'));
  assert.notEqual(dailySeed('2026-10-25', 'flute'), dailySeed('2026-10-26', 'flute'));
});

test('ISO week id', () => {
  assert.equal(weekId(new Date(2026, 9, 25)), '2026-W43');
  assert.equal(weekId(new Date(2026, 0, 1)), '2026-W01');
});

test('badges are earned from the saved state', () => {
  const ids = earnedBadges({ progress: { 'lesson:a': 3, 'trumpet:song:oda': 2 }, streak: { count: 7 }, gym: {}, tuning: {}, xp: 50, dailyDone: {} });
  assert.ok(ids.includes('first'));
  assert.ok(ids.includes('streak7'));
  assert.ok(ids.includes('multi'));
  assert.ok(!ids.includes('xp1000'));
});
