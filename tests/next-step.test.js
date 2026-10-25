import { test } from 'node:test';
import assert from 'node:assert/strict';
import { soonBandTask } from '../js/next-step.js';

const band = { role: 'member' };
const tasks = [{ id: 'a', title: 'Marcha', due: '2026-11-10' }, { id: 'b', title: 'Pasodoble', due: '2026-10-28' }, { id: 'c', title: 'Sin fecha', due: null }];

test('elige la tarea pendiente que vence antes dentro de 3 días', () => {
  assert.equal(soonBandTask({ band, bandPending: tasks }, '2026-10-26').id, 'b');
});

test('no propone tareas lejanas, vencidas ni a directores', () => {
  assert.equal(soonBandTask({ band, bandPending: tasks }, '2026-10-20'), null);
  assert.equal(soonBandTask({ band, bandPending: tasks }, '2026-10-29'), null);
  assert.equal(soonBandTask({ band: { role: 'director' }, bandPending: tasks }, '2026-10-26'), null);
  assert.equal(soonBandTask({ band: null, bandPending: tasks }, '2026-10-26'), null);
});
