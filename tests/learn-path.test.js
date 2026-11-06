// Aprender con dos caminos: traducción de learnView antiguo, camino por defecto, sección de Mi libro, puente al libro
// y la tarjeta de técnica en el momento (docs/PLAN-DOS-CAMINOS.md, fase 1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateLearnView, resolveLearn, defaultPath, inClassroom, showBridge, BRIDGE_MIN_LEVELS } from '../js/learn-path.js';
import { momentOf, tipForLesson, markSeen } from '../js/tip-moments.js';

test('learnView antiguo → camino nuevo: casual → solo; book, lm y pro → profe', () => {
  assert.equal(migrateLearnView('casual'), 'solo');
  assert.equal(migrateLearnView('book'), 'profe');
  assert.equal(migrateLearnView('lm'), 'profe');
  assert.equal(migrateLearnView('pro'), 'profe');
  assert.equal(migrateLearnView('solo'), 'solo');
  assert.equal(migrateLearnView('profe'), 'profe');
  assert.equal(migrateLearnView(null), null);
  assert.equal(migrateLearnView('raro'), null);
});

test('primera vez: en una clase o profesor → Con profesor; si no → Por mi cuenta', () => {
  assert.equal(defaultPath({}), 'solo');
  assert.equal(defaultPath({ aula: { classes: [] } }), 'solo');
  assert.equal(defaultPath({ aula: { classes: [{ cid: 'C1' }] } }), 'profe');
  assert.equal(defaultPath({ aula: { schoolId: 'S1' } }), 'profe');
  assert.equal(defaultPath({ school: { role: 'teacher' } }), 'profe');
  assert.equal(defaultPath({ school: { role: 'student' } }), 'solo');
  assert.equal(inClassroom({ aula: { classes: [{}] } }), true);
  assert.equal(resolveLearn({ learnView: null }).path, 'solo');
  assert.equal(resolveLearn({ learnView: null, aula: { classes: [{}] } }).path, 'profe');
});

test('una elección guardada manda sobre el valor por defecto (se puede cambiar siempre)', () => {
  const student = { aula: { classes: [{}] } };
  assert.equal(resolveLearn({ ...student, learnView: 'solo' }).path, 'solo');
  assert.equal(resolveLearn({ learnView: 'profe' }).path, 'profe');
  assert.equal(resolveLearn({ ...student, learnView: 'casual' }).path, 'solo', 'quien eligió Casual sigue en su camino');
});

test('los enlaces antiguos abren su sección de Mi libro (openLmTarget, libro, Método Pro)', () => {
  assert.deepEqual(resolveLearn({ learnView: 'lm', libroView: 'book' }), { path: 'profe', section: 'lm', linked: true });
  assert.deepEqual(resolveLearn({ learnView: 'book' }), { path: 'profe', section: 'book', linked: true });
  assert.deepEqual(resolveLearn({ learnView: 'pro', aulaView: 'method' }), { path: 'profe', section: 'method', linked: true });
  const aula = resolveLearn({ learnView: 'pro', aulaView: 'aula', libroView: 'book' });
  assert.equal(aula.path, 'profe');
  assert.equal(aula.section, 'book');
  assert.equal(aula.linked, false, 'el Aula ya está arriba: no hace falta bajar');
});

test('sin sección elegida, Mi libro abre lo que ya se usaba; si no, Lenguaje', () => {
  assert.equal(resolveLearn({ learnView: 'profe', instrument: 'violin' }).section, 'lm');
  assert.equal(resolveLearn({ learnView: 'profe', instrument: 'violin', bookPlays: { violin: { a: 1 } } }).section, 'book');
  assert.equal(resolveLearn({ learnView: 'profe', instrument: 'violin', pro: { violin: { n1: {} } }, bookPlays: { violin: { a: 1 } } }).section, 'method');
  assert.equal(resolveLearn({ learnView: 'profe', instrument: 'violin', pro: { violin: { n1: {} } }, libroView: 'lm' }).section, 'lm');
  assert.equal(resolveLearn({ learnView: 'profe', libroView: 'nada' }).section, 'lm');
});

test('puente al libro: solo tras unos cuantos niveles y hasta que se cierra', () => {
  assert.equal(showBridge({}, BRIDGE_MIN_LEVELS - 1), false);
  assert.equal(showBridge({}, BRIDGE_MIN_LEVELS), true);
  assert.equal(showBridge({ bridgeHidden: true }, 50), false);
});

test('técnica en el momento: postura al empezar, dedos con notas nuevas, sonido en la primera canción', () => {
  assert.equal(momentOf({ kind: 'theory' }, { first: true }), 'start');
  assert.equal(momentOf({ kind: 'notes' }), 'notes');
  assert.equal(momentOf({ kind: 'song' }), 'song');
  assert.equal(momentOf({ kind: 'song', optional: true }), null, 'los calentamientos opcionales no la llevan');
  assert.equal(momentOf({ kind: 'theory' }), null);
  assert.equal(momentOf(null), null);
  assert.equal(tipForLesson('violin', { kind: 'theory' }, { first: true }).kind, 'posture');
  assert.equal(tipForLesson('violin', { kind: 'notes' }).kind, 'left-hand');
  assert.equal(tipForLesson('violin', { kind: 'song' }).kind, 'bow');
  assert.equal(tipForLesson('flute', { kind: 'song' }).kind, 'breath');
  assert.equal(tipForLesson('guitar', { kind: 'notes' }).kind, 'fretting');
  assert.equal(tipForLesson('piano', { kind: 'notes' }).kind, 'hand');
});

test('cada consejo sale una vez por instrumento', () => {
  const seen = markSeen({}, 'violin', 'left-hand');
  assert.deepEqual(seen, { violin: ['left-hand'] });
  assert.equal(markSeen(seen, 'violin', 'left-hand'), seen, 'sin duplicados ni objeto nuevo');
  assert.equal(tipForLesson('violin', { kind: 'notes' }, { seen: seen.violin }), null);
  assert.equal(tipForLesson('cello', { kind: 'notes' }, { seen: seen.cello || [] }).kind, 'left-hand');
  assert.equal(tipForLesson('instrumento-sin-consejos', { kind: 'notes' }), null);
});
