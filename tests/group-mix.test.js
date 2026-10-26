import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitBytes, joinBytes, placement, recordedStart, sectionAt, songLength, audible, clock, isStale, CHUNK_BYTES } from '../js/group-mix.js';

test('trocea y vuelve a unir el audio sin perder bytes', () => {
  const bytes = Uint8Array.from({ length: CHUNK_BYTES * 2 + 10 }, (_, i) => i % 251);
  const parts = splitBytes(bytes);
  assert.equal(parts.length, 3);
  assert.ok(parts.every(p => p.length <= CHUNK_BYTES));
  assert.deepEqual(joinBytes(parts), bytes);
});

test('coloca una pista que empieza más tarde o ya ha empezado', () => {
  assert.deepEqual(placement(2, 0, 10), { wait: 2, offset: 0 });
  assert.deepEqual(placement(2, 5, 10), { wait: 0, offset: 3 });
  assert.equal(placement(0, 30, 10), null);
});

test('la toma grabada se adelanta lo que tarda el móvil', () => {
  assert.equal(recordedStart(10, 0.3, 0.12).toFixed(2), '9.58');
});

test('dice en qué parte va la canción y cuánto falta para la siguiente', () => {
  const sections = [{ name: 'Estribillo', at: 30 }, { name: 'Intro', at: 0 }, { name: 'Estrofa', at: 8 }];
  const r = sectionAt(sections, 12);
  assert.equal(r.current.name, 'Estrofa');
  assert.equal(r.next.name, 'Estribillo');
  assert.equal(r.inNext, 18);
  assert.equal(sectionAt([], 5).current, null);
});

test('duración, solo y silencio', () => {
  const tracks = [{ id: 'a', startAt: 0, duration: 100 }, { id: 'b', startAt: 5, duration: 120 }];
  assert.equal(songLength(tracks), 125);
  assert.deepEqual(audible(tracks, { a: { muted: true } }).map(t => t.id), ['b']);
  assert.deepEqual(audible(tracks, { a: { solo: true } }).map(t => t.id), ['a']);
  assert.equal(clock(125.7), '2:05');
});

test('una canción sin tocar en 60 días caduca', () => {
  const now = Date.UTC(2026, 9, 26);
  assert.equal(isStale(now - 61 * 864e5, now), true);
  assert.equal(isStale(now - 10 * 864e5, now), false);
});
