import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse } from '../js/course.js';
import { placementSpeed, PLACEMENT_MAX_BPM } from '../js/placement.js';

test('el test de nivel nunca va más rápido de 66 negras por minuto', () => {
  assert.equal(84 * placementSpeed(84), PLACEMENT_MAX_BPM);
  assert.equal(placementSpeed(60), 1);
  assert.equal(placementSpeed(100, 0.5), 0.5);
});

test('el repaso y el reto de la unidad de la escala de Fa del clarinete se quedan en Fa mayor (sin el Fa♯ del minueto)', () => {
  const unit = buildCourse([], 'clarinet').find(u => u.id === 'clarinet-u6');
  const close = unit.lessons.filter(l => l.unitReview);
  assert.ok(close.length >= 2);
  close.forEach(l => assert.doesNotMatch(l.notes || l.song.score, /F#/, l.id));
  assert.match(close.find(l => l.kind === 'notes').notes, /Bb4/);
});

test('en el clarinete el Si♭ oído una octava desplazada cuenta, pero una nota distinta no', async () => {
  const { instrumentById, foldOctave } = await import('../js/instruments.js');
  const cl = instrumentById('clarinet');
  assert.equal(foldOctave(82, 70, cl), 70);
  assert.equal(foldOctave(58.2, 70, cl), 70.2);
  assert.equal(foldOctave(77, 70, cl), 77);
  assert.equal(foldOctave(94, 70, cl), 94);
  assert.equal(foldOctave(82, 70, instrumentById('flute')), 82);
});
