import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventsFromChange, friendsWeekBoard, weekMinutes, timeAgo } from '../js/friends-api.js';
import { weekId } from '../js/engage.js';

test('the wall gets badges, level ups, streak milestones and new chords', () => {
  const prev = { badges: ['first'], xp: 590, streak: { count: 6 }, chordsKnown: { guitar: ['Em'] } };
  const next = { badges: ['first', 'streak7'], xp: 610, streak: { count: 7 }, chordsKnown: { guitar: ['Em', 'Am'] } };
  const ev = eventsFromChange(prev, next);
  assert.deepEqual(ev.map(e => e.type).sort(), ['badge', 'chords', 'level', 'streak']);
  assert.match(ev.find(e => e.type === 'chords').text, /Lam/);
  assert.match(ev.find(e => e.type === 'streak').text, /7 días/);
  assert.deepEqual(eventsFromChange(next, next), []);
});

test('weekly board ranks friends by this week\'s minutes', () => {
  const now = new Date('2026-10-25T12:00');
  const wk = weekId(now);
  const board = friendsWeekBoard([{ name: 'A', week: wk, weekMinutes: 20 }, { name: 'B', week: '2026-W40', weekMinutes: 99 }, { name: 'C', week: wk, weekMinutes: 45 }], now);
  assert.deepEqual(board.map(p => [p.name, p.minutes]), [['C', 45], ['A', 20], ['B', 0]]);
  assert.equal(weekMinutes({ '2026-10-20': 10, '2026-10-25': 5.4, '2026-10-12': 30 }, now), 15);
  assert.equal(timeAgo(Date.now() - 3 * 3600e3), 'hace 3 h');
});
