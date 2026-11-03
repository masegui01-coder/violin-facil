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

import { partFor } from '../js/band-api.js';

test('a concert-pitch task part is transposed for each band instrument', () => {
  const part = songPayload(SONGS.find(s => s.id === 'oda'));      // Himno de la Alegría en Re (sonido real)
  const first = p => p.parsed.notes.find(n => !n.rest);
  const flute = partFor(part, 'flute'), trumpet = partFor(part, 'trumpet'), alto = partFor(part, 'sax'), guitar = partFor(part, 'guitar');
  assert.equal(flute.key, 'D');
  assert.equal(trumpet.key, 'E');
  assert.equal(alto.key, 'B');
  assert.equal(guitar.key, 'D');
  // toda la banda suena igual (salvo octavas): escrita + transposición del instrumento
  const pc = (p, t) => ((first(p).midi + t) % 12 + 12) % 12;
  assert.equal(pc(trumpet, -2), pc(flute, 0));
  assert.equal(pc(alto, -9), pc(flute, 0));
  // una partichela ya escrita para trompeta (con <transpose> -2) no se vuelve a transportar
  assert.equal(partFor({ ...part, transpose: -2 }, 'trumpet').key, 'D');
});

import { dailySeries, weekCompare, taskStatus, practiceDays } from '../js/band-stats.js';

test('director dashboard series and week comparison', () => {
  const today = '2026-10-25';
  const a = { id: 'a', days: { '2026-10-25': 10, '2026-10-24': 5, '2026-10-16': 20 } };
  const b = { id: 'b', days: { '2026-10-23': 15 } };
  const s = dailySeries([a, b], today, 3);
  assert.deepEqual(s.map(x => [x.day, x.minutes, x.active]), [['2026-10-23', 15, 1], ['2026-10-24', 5, 1], ['2026-10-25', 10, 1]]);
  const w = weekCompare([a, b], today);
  assert.deepEqual([w.now.minutes, w.prev.minutes, w.now.active, w.prev.active], [30, 20, 2, 1]);
  assert.equal(w.minutesChange, 50);
  assert.equal(practiceDays(a, today, 7), 2);
});

test('task status splits musicians into done, started and not started', () => {
  const task = { id: 't', due: '2026-10-20' };
  const targets = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const progress = [{ taskId: 't', uid: 'a', completed: true, bestAccuracy: 0.9 }, { taskId: 't', uid: 'b', completed: false, bestAccuracy: 0.5 }];
  const st = taskStatus(task, targets, progress, '2026-10-25');
  assert.deepEqual([st.done.length, st.started.length, st.notStarted.length], [1, 1, 1]);
  assert.equal(st.state, 'late');
  assert.equal(Math.round(st.avgAccuracy * 100), 70);
});

// ---------- Ficha pública (la ve la banda) y estadísticas privadas (el músico y el director) ----------
import { sharedActivity, privateActivity, cappedPoints, statsDue, memberWithStats, SHARED_DAYS } from '../js/band-stats.js';

test('a la ficha pública solo van los minutos de las dos últimas semanas y el nivel', () => {
  const summary = activitySummary({ practiceLog: { '2026-11-03': 10, '2026-10-21': 5, '2026-10-20': 7, '2026-09-01': 30 }, xp: 900, streak: 6,
    tuning: { 69: { n: 5, sum: 25 } }, level: 'Músico' }, '2026-11-03', 300);
  const shared = sharedActivity(summary, '2026-11-03');
  assert.deepEqual(Object.keys(shared).sort(), ['level', 'minutes']);
  assert.deepEqual(shared.minutes, { '2026-11-03': 10, '2026-10-21': 5 }); // 14 días contando hoy
  assert.equal(SHARED_DAYS, 14);
  assert.equal(shared.level, 'Músico');
  const priv = privateActivity(summary);
  assert.deepEqual(Object.keys(priv).sort(), ['days', 'lastPractice', 'points', 'streak', 'tuning']);
  assert.equal(priv.points, 600);
  assert.equal(priv.streak, 6);
  assert.equal(Object.keys(priv.days).length, 4);
});

test('los puntos suben como mucho 120 por escritura, no bajan salvo a 0 y la primera vez parten de los antiguos', () => {
  assert.equal(cappedPoints(600, 0), 120);
  assert.equal(cappedPoints(600, 500), 600);
  assert.equal(cappedPoints(50, 0), 50);
  assert.equal(cappedPoints(0, 400), 0); // progreso reiniciado
  assert.equal(cappedPoints(300, 400), 400); // otro dispositivo con menos: se queda como estaba
  assert.equal(cappedPoints(undefined, 10), 0);
});

test('las estadísticas se escriben como mucho una vez por minuto (hora del servidor, con margen)', () => {
  const at = { toMillis: () => 1_000_000 };
  assert.ok(statsDue(null, 0));
  assert.ok(!statsDue({ at }, 1_000_000 + 30_000));
  assert.ok(!statsDue({ at }, 1_000_000 + 61_000));
  assert.ok(statsDue({ at }, 1_000_000 + 70_000));
});

test('las pantallas reciben la ficha con las estadísticas si se pueden leer, y toleran las fichas antiguas', () => {
  // Compañero: solo lo público; el último ensayo sale de sus minutos recientes
  const mate = memberWithStats({ id: 'b', nickname: 'Ana', minutes: { '2026-11-01': 5, '2026-10-30': 0 }, level: 'Aprendiz' });
  assert.deepEqual(mate.days, { '2026-11-01': 5, '2026-10-30': 0 });
  assert.equal(mate.lastPractice, '2026-11-01');
  assert.equal(mate.points, undefined);
  assert.equal(trafficLight(mate, '2026-11-02'), 'green');
  // Director: el trimestre, puntos, racha y afinación de las estadísticas privadas
  const full = memberWithStats({ id: 'b', minutes: { '2026-11-01': 5 } }, { days: { '2026-11-01': 5, '2026-09-10': 20 }, points: 80, streak: 2, tuning: { 69: 4 }, lastPractice: '2026-11-01', at: { toMillis: () => 0 } });
  assert.equal(Object.keys(full.days).length, 2);
  assert.equal(full.points, 80);
  assert.equal(full.at, undefined);
  // Ficha antigua, con todo a la vista y sin estadísticas: se sigue viendo como antes
  const old = memberWithStats({ id: 'c', days: { '2026-10-01': 9 }, points: 300, lastPractice: '2026-10-01' });
  assert.deepEqual(old.days, { '2026-10-01': 9 });
  assert.equal(old.points, 300);
  assert.equal(old.lastPractice, '2026-10-01');
  // Ficha sin nada
  assert.deepEqual(memberWithStats({ id: 'd' }).days, {});
  assert.equal(memberWithStats({ id: 'd' }).lastPractice, null);
});
