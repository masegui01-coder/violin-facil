import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignedTo, taskPartFor, taskDone, passageDone, songPayload, payloadScore } from '../js/band-api.js';
import { SONGS } from '../js/songs.js';
import { parseScore } from '../js/music.js';

const task = { mode: 'tempo', minStars: 2, assign: { type: 'instruments', instruments: ['trumpet', 'clarinet#2'] }, parts: { all: { t: 'all' }, trumpet: { t: 'tp' }, 'clarinet#2': { t: 'cl2' } } };

test('tasks reach the right instruments and voices', () => {
  assert.ok(assignedTo(task, { instrument: 'trumpet', voice: 1 }));
  assert.ok(assignedTo(task, { instrument: 'clarinet', voice: 2 }));
  assert.ok(!assignedTo(task, { instrument: 'clarinet', voice: 1 }));
  assert.ok(assignedTo({ assign: { type: 'members', members: ['u1'] } }, { id: 'u1' }));
});

test('each musician gets the part of their instrument and voice', () => {
  assert.equal(taskPartFor(task, { instrument: 'clarinet', voice: 2 }).t, 'cl2');
  assert.equal(taskPartFor(task, { instrument: 'trumpet', voice: 3 }).t, 'tp');
  assert.equal(taskPartFor(task, { instrument: 'flute' }).t, 'all');
});

test('completion rules for normal tasks and passages', () => {
  assert.ok(taskDone(task, { tempo: 2 }));
  assert.ok(taskDone(task, { memory: 3 }));
  assert.ok(!taskDone(task, { learn: 3 }));
  assert.ok(passageDone({ passage: { fromBar: 1, toBar: 4 } }, 1));
  assert.ok(!passageDone({ passage: { fromBar: 1, toBar: 4 } }, 0.8));
});

test('song payload is compact and decodes back to the same rhythm', () => {
  const song = SONGS.find(s => s.id === 'minueto');
  const payload = songPayload(song);
  assert.ok(payload.enc && !payload.parsed);
  const back = payloadScore(payload);
  const orig = parseScore(song.score);
  assert.deepEqual(back.notes.map(n => [n.rest ? 'R' : n.midi, n.start]), orig.notes.map(n => [n.rest ? 'R' : n.midi, n.start]));
  assert.ok(JSON.stringify(payload).length < JSON.stringify(orig).length / 3);
});

import { activitySummary, eventPrep, daysUntil, weekStarSuggestion, trafficLight, bandStreak, sectionDuel, bandCsv } from '../js/band-stats.js';

test('activity summary keeps a quarter, points since joining and reliable tuning only', () => {
  const a = activitySummary({ practiceLog: { '2026-10-25': 12.34, '2026-06-01': 30, '2026-10-20': 0 }, xp: 900, streak: 4,
    tuning: { 69: { n: 5, sum: 25, sumSq: 0 }, 71: { n: 2, sum: 40, sumSq: 0 } } }, '2026-10-25', 300);
  assert.deepEqual(a.days, { '2026-10-25': 12.3 });
  assert.equal(a.points, 600);
  assert.deepEqual(a.tuning, { 69: 5 });
  assert.equal(a.lastPractice, '2026-10-25');
});

test('event preparation counts completed task–musician pairs', () => {
  const tasks = [{ id: 't1' }, { id: 't2' }];
  const members = [{ id: 'a' }, { id: 'b' }];
  const progress = [{ taskId: 't1', uid: 'a', completed: true }, { taskId: 't2', uid: 'a', completed: false }];
  assert.equal(eventPrep({ taskIds: ['t1', 't2'] }, tasks, members, progress, () => true), 0.25);
  assert.equal(eventPrep({ taskIds: [] }, tasks, members, progress, () => true), null);
  assert.equal(daysUntil('2026-11-01', '2026-10-25'), 7);
});

test('band stats: traffic light, streak, duel, week star and CSV', () => {
  const today = '2026-10-25';
  const a = { id: 'a', nickname: 'Ana', instrument: 'flute', days: { '2026-10-25': 10, '2026-10-24': 5 } };
  const b = { id: 'b', nickname: 'Luis; "el 2"', instrument: 'trumpet', days: { '2026-10-20': 20 } };
  assert.equal(trafficLight(a, today), 'green');
  assert.equal(trafficLight(b, today), 'amber');
  assert.equal(trafficLight({}, today), 'red');
  assert.equal(bandStreak([a], today), 2);
  assert.equal(bandStreak([a, b], today, 0.7), 0);
  const duel = sectionDuel([a, b], today, i => (i === 'flute' ? 'madera' : 'metal'));
  assert.equal(duel[0].family, 'metal');
  assert.equal(weekStarSuggestion([a, b], today).member.id, 'b');
  const csv = bandCsv([a, b], [{ id: 't', title: 'Marcha' }], [{ taskId: 't', uid: 'a', completed: true }], today, x => x);
  assert.match(csv, /Ana;flute;;15;15;15;2026-10-25;Hecha/);
  assert.match(csv, /"Luis; ""el 2"""/);
});

import { fingeringText } from '../js/fingerings.js';

test('trumpet reminds you to pull the third slide on sharp low notes', () => {
  assert.match(fingeringText('trumpet', 62, 'eu'), /Pistones 1 y 3 · saca la bomba/);
  assert.match(fingeringText('trumpet', 61, 'eu'), /bomba/);
  assert.doesNotMatch(fingeringText('trumpet', 64, 'eu'), /bomba/);
});
