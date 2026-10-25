import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseState, syncableState, testerSummary } from '../js/sync.js';

test('keeps whichever side has more progress so nobody loses their work', () => {
  assert.equal(chooseState({ lessonsPlayed: 3, xp: 100 }, null), 'upload');
  assert.equal(chooseState({ lessonsPlayed: 0, xp: 0 }, { lessonsPlayed: 12, xp: 900 }), 'download');
  assert.equal(chooseState({ lessonsPlayed: 20, xp: 1500 }, { lessonsPlayed: 12, xp: 900 }), 'upload');
});

test('large local-only data stays on the device', () => {
  const s = syncableState({ xp: 5, recordings: [{ id: 1 }], importedSongs: [{ id: 'x' }], progress: { a: 1 } });
  assert.deepEqual(Object.keys(s).sort(), ['progress', 'xp']);
});

test('tester summary for the admin panel', () => {
  const state = { instrument: 'guitar', xp: 650, lessonsPlayed: 9, practiceLog: { '2026-10-20': 12.4, '2026-10-24': 8, '2026-10-22': 0 }, streak: { count: 2 }, badges: ['first'], progress: { 'guitar:lesson:gu1-em': 3, 'lesson:u1-ae': 2 }, band: null };
  const t = testerSummary(state, { displayName: 'Ana', email: 'ana@example.com', metadata: { creationTime: 'Sat, 24 Oct 2026 10:00:00 GMT' } }, 1793000000000);
  assert.equal(t.name, 'Ana');
  assert.equal(t.level, 'Músico');
  assert.equal(t.minutes, 20);
  assert.equal(t.daysPracticed, 2);
  assert.equal(t.lastPractice, '2026-10-24');
  assert.deepEqual(t.instruments.sort(), ['Guitarra', 'Violín']);
  assert.equal(t.lastSeen, 1793000000000);
});
