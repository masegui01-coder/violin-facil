// Liga semanal: el cliente nunca escribe más de una vez por minuto ni pasa los topes de las reglas
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leaguePlan, LEAGUE_INTERVAL_MS, LEAGUE_MARGIN_MS, LEAGUE_MAX_WRITE, LEAGUE_WEEK_MAX } from '../js/league.js';

const NOW = 1_000_000_000;

test('primera suma de la semana: se envía ya', () => {
  assert.deepEqual(leaguePlan(35, null, NOW), { send: 35, carry: 0, waitMs: 0 });
});

test('menos de un minuto desde la última: se acumula y espera al servidor (con margen de reloj)', () => {
  const plan = leaguePlan(35, { score: 100, atMs: NOW - 20000 }, NOW);
  assert.equal(plan.send, 0);
  assert.equal(plan.carry, 35);
  assert.equal(plan.waitMs, LEAGUE_INTERVAL_MS + LEAGUE_MARGIN_MS - 20000);
});

test('pasado el minuto se envía lo acumulado, como mucho el tope por escritura', () => {
  const at = NOW - LEAGUE_INTERVAL_MS - LEAGUE_MARGIN_MS;
  assert.deepEqual(leaguePlan(70, { score: 100, atMs: at }, NOW), { send: 70, carry: 0, waitMs: 0 });
  const big = leaguePlan(LEAGUE_MAX_WRITE + 30, { score: 100, atMs: at }, NOW);
  assert.equal(big.send, LEAGUE_MAX_WRITE);
  assert.equal(big.carry, 30);
  assert.ok(big.waitMs >= LEAGUE_INTERVAL_MS);
});

test('tope semanal: nunca se pasa y lo que sobra se descarta', () => {
  assert.deepEqual(leaguePlan(35, { score: LEAGUE_WEEK_MAX - 10, atMs: 0 }, NOW), { send: 10, carry: 0, waitMs: 0 });
  assert.deepEqual(leaguePlan(35, { score: LEAGUE_WEEK_MAX, atMs: 0 }, NOW), { send: 0, carry: 0, waitMs: 0 });
});
