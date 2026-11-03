// El curso empieza tocando: la primera actividad de cada instrumento es tocable y la teoría de bienvenida va después.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCourse, playFirst, isCourseLevel, lessonStates } from '../js/course.js';
import { INSTRUMENTS } from '../js/instruments.js';

for (const inst of INSTRUMENTS) {
  test(`${inst.name}: la primera lección se toca y la bienvenida llega enseguida`, () => {
    const lessons = buildCourse(['folk'], inst.id)[0].lessons;
    assert.notEqual(lessons[0].kind, 'theory', `${inst.id} empieza con ${lessons[0].id}`);
    assert.ok(!lessons[0].optional);
    const intro = lessons.findIndex(l => l.kind === 'theory');
    assert.equal(intro, 1, `${inst.id}: la teoría va justo después de la primera nota`);
    const states = lessonStates(buildCourse(['folk'], inst.id), {});
    assert.equal(states[lessons[0].id], 'open');
  });
}

test('playFirst solo reordena la unidad 1 y conserva los ids', () => {
  const list = [{ id: 'i', kind: 'theory' }, { id: 'w', kind: 'notes', optional: true }, { id: 'n', kind: 'notes' }, { id: 's', kind: 'song' }];
  assert.deepEqual(playFirst(list, 0).map(l => l.id), ['n', 'i', 'w', 's']);
  assert.equal(playFirst(list, 1), list);
  assert.deepEqual(list.map(l => l.id), ['i', 'w', 'n', 's'], 'no muta la lista original');
});

test('la teoría leída cuenta como nivel; los calentamientos opcionales no', () => {
  assert.equal(isCourseLevel({ kind: 'theory' }), true);
  assert.equal(isCourseLevel({ kind: 'notes', optional: true }), false);
  assert.equal(isCourseLevel({ kind: 'song' }), true);
});
