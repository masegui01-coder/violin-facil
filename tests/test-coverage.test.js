import { test } from 'node:test';
import assert from 'node:assert/strict';
import { featuresFromState, coverage, untested, FEATURES } from '../js/test-coverage.js';

test('deduce del estado qué partes ha usado el tester', () => {
  const f = featuresFromState({ onboarded: true, seenScreens: { tuner: 1, lesson: 2 }, band: { role: 'director' }, groups: [{}], routineDone: {}, placement: { guitar: 0 } });
  assert.deepEqual(f.sort(), ['band-director', 'groups', 'lesson', 'onboarding', 'tuner'].sort());
});

test('cada parte queda probada, poco probada o sin probar', () => {
  const testers = [{ name: 'Ana', features: ['tuner', 'lesson'] }, { name: 'Luis', features: ['tuner'] }];
  const rows = coverage(testers, { gym: { ok: true } });
  const by = id => rows.find(r => r.id === id);
  assert.equal(rows.length, FEATURES.length);
  assert.equal(by('tuner').status, 'ok');
  assert.equal(by('lesson').status, 'few');
  assert.deepEqual(by('lesson').names, ['Ana']);
  assert.equal(by('metro').status, 'missing');
  assert.equal(by('gym').checked, true);
});

test('instrumentos que nadie ha probado', () => {
  assert.deepEqual(untested(['violin', 'guitar', 'ukulele'], [{ instrumentIds: ['guitar'] }], t => t.instrumentIds), ['violin', 'ukulele']);
});
