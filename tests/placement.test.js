import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse, lessonStates } from '../js/course.js';
import { placementSteps, placedUnit, offerPlacement } from '../js/placement.js';

test('una prueba por unidad desde la segunda, sin teoría', () => {
  const course = buildCourse(['folk'], 'guitar');
  const steps = placementSteps(course);
  assert.ok(steps.length >= 3);
  assert.equal(steps[0].unitIndex, 1);
  assert.ok(steps.every(s => s.lesson.kind !== 'theory' && !s.lesson.optional));
});

test('empieza después de la última unidad superada', () => {
  const steps = [{ unitIndex: 1 }, { unitIndex: 2 }, { unitIndex: 3 }];
  assert.equal(placedUnit(steps, [1]), 0);
  assert.equal(placedUnit(steps, [3, 2, 1]), 3);
  assert.equal(placedUnit(steps, [3, 3, 3]), 4);
});

test('el curso se abre hasta la unidad del test', () => {
  const course = buildCourse(['folk'], 'violin');
  const first = course[2].lessons[0].id;
  assert.equal(lessonStates(course, {})[first], 'locked');
  assert.equal(lessonStates(course, {}, { startUnit: 3 })[first], 'open');
});

test('se ofrece solo a quien empieza con ese instrumento', () => {
  assert.equal(offerPlacement({}, 'guitar', 0), true);
  assert.equal(offerPlacement({ guitar: 0 }, 'guitar', 0), false);
  assert.equal(offerPlacement({}, 'guitar', 5), false);
});
