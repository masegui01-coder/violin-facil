import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slicePassage, hardestBars, nextPassageSpeed, encodeScore, decodeScore } from '../js/passage.js';
import { addToWeek, compareWeeks, skills, radarPoints } from '../js/report.js';
import { levelFor, openChest, CARDS } from '../js/rewards.js';
import { trafficLight, bandStreak, sectionDuel, sectionTuning, practicedToday, bandCsv } from '../js/band-stats.js';
import { parseScore } from '../js/music.js';
import { rng } from '../js/generate.js';

const score = parseScore('| D4q E4q F#4q G4q | A4h A4h | B4q. A4e G4q F#4q | E4w |');

test('a passage keeps only its bars and starts at beat 0', () => {
  const p = slicePassage(score, 2, 3);
  assert.equal(p.bars.length, 2);
  assert.equal(p.totalBeats, 8);
  assert.equal(p.notes[0].start, 0);
  assert.deepEqual(p.notes.map(n => n.midi), [69, 69, 71, 69, 67, 66]);
  assert.throws(() => slicePassage(score, 3, 2));
});

test('hardest bars follow the miss counts', () => {
  const misses = [0, 0, 0, 0, 0, 0, 3, 2, 1, 0, 1];
  assert.deepEqual(hardestBars(score, misses), { fromBar: 3, toBar: 4 });
  assert.equal(hardestBars(score, new Array(11).fill(0)), null);
});

test('passage tempo goes up when it sounds clean and down when not', () => {
  assert.equal(nextPassageSpeed(0.6, 3), 0.7);
  assert.equal(nextPassageSpeed(0.6, 1), 0.5);
  assert.equal(nextPassageSpeed(1, 3), 1);
  assert.equal(nextPassageSpeed(0.4, 0), 0.4);
});

test('compact score encoding round-trips pitches, rhythm, bars and accents', () => {
  const s = parseScore('| C5q> Bb4e. A4s R h | G#4w |');
  const back = decodeScore(encodeScore(s));
  assert.deepEqual(back.notes.map(n => [n.rest ? 'R' : n.midi, n.start, n.beats, n.accent, n.bar, n.dur, n.dotted]), s.notes.map(n => [n.rest ? 'R' : n.midi, n.start, n.beats, n.accent, n.bar, n.dur, n.dotted]));
  assert.deepEqual(back.bars, s.bars);
});

test('weekly report compares tuning, accuracy and minutes', () => {
  let prev = addToWeek(undefined, { minutes: 30, accuracy: 0.7, tuneAbs: [18, 18], day: '2026-10-19' });
  let cur = addToWeek(undefined, { minutes: 50, accuracy: 0.85, tuneAbs: [11, 11], day: '2026-10-26', gym: { id: 'Escala de Si♭', bpm: 84 } });
  prev = addToWeek(prev, { gym: { id: 'Escala de Si♭', bpm: 72 } });
  const lines = compareWeeks(cur, prev).map(l => l.text);
  assert.ok(lines.some(t => t.includes('±18 a ±11')));
  assert.ok(lines.some(t => t.includes('70 % al 85 %')));
  assert.ok(lines.some(t => t.includes('de 72 a 84 BPM')));
});

test('skills and radar stay within bounds', () => {
  const s = skills({ tuningAbs: 10, tempoAcc: 0.8, gymBest: 100, readingAcc: 0.6, practiceDays30: 25 });
  s.forEach(x => assert.ok(x.value >= 0 && x.value <= 100));
  assert.equal(s.find(x => x.id === 'habit').value, 100);
  assert.equal(radarPoints([100, 0, 0, 0, 0], 50, 50, 40)[0][1], 10);
});

test('levels and chest rewards', () => {
  assert.equal(levelFor(0).name, 'Educando');
  assert.equal(levelFor(650).name, 'Músico');
  assert.equal(levelFor(99999).next, null);
  const state = { cards: [], themes: [], freezes: 0 };
  const types = new Set(Array.from({ length: 50 }, (_, i) => openChest(state, rng(i + 1)).type));
  ['freeze', 'card', 'theme', 'xp'].forEach(t => assert.ok(types.has(t), t));
  const full = { cards: CARDS.map((_, i) => i), themes: ['banda', 'bosque', 'granate', 'oro'], freezes: 2 };
  assert.equal(openChest(full, rng(3)).type, 'xp');
});

const today = '2026-10-26';
const members = [
  { id: 'a', nickname: 'Ana', instrument: 'flute', days: { '2026-10-26': 10, '2026-10-25': 12 }, tuning: { 72: 8, 74: -4 } },
  { id: 'b', nickname: 'Beto', instrument: 'trumpet', days: { '2026-10-22': 5 }, tuning: {} },
  { id: 'c', nickname: 'Cris', instrument: 'flute', days: { '2026-10-26': 6, '2026-10-25': 6 }, tuning: { 72: 12 } },
];

test('traffic light, practiced today and band streak', () => {
  assert.deepEqual(members.map(m => trafficLight(m, today)), ['green', 'amber', 'green']);
  assert.equal(trafficLight({}, today), 'red');
  assert.ok(Math.abs(practicedToday(members, today) - 2 / 3) < 1e-9);
  assert.equal(bandStreak(members, today, 0.6), 2);
});

test('section duel averages per musician and section tuning averages per note', () => {
  const duel = sectionDuel(members, today, i => (i === 'flute' ? 'madera' : 'metal'));
  assert.equal(duel[0].family, 'madera');
  assert.equal(duel[0].perMusician, 17);
  const t = sectionTuning(members, 'flute');
  assert.equal(t[0].midi, 72);
  assert.equal(t[0].mean, 10);
});

test('band CSV has one row per musician and escapes separators', () => {
  const csv = bandCsv([{ ...members[0], nickname: 'Ana; 1ª' }], [{ id: 't1', title: 'Pasaje' }], [{ taskId: 't1', uid: 'a', completed: true }], today, id => id);
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[1].startsWith('"Ana; 1ª";flute;'));
  assert.ok(lines[1].endsWith('Hecha'));
});
