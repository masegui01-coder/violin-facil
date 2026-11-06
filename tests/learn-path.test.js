// Aprender con dos caminos: traducción de learnView antiguo, camino por defecto, sección de Mi libro, puente al libro
// y la tarjeta de técnica en el momento (docs/PLAN-DOS-CAMINOS.md, fase 1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateLearnView, resolveLearn, normalizedLearn, defaultPath, inClassroom, showBridge, BRIDGE_MIN_LEVELS } from '../js/learn-path.js';
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
  assert.deepEqual(resolveLearn({ learnView: 'lm', libroView: 'book' }), { path: 'profe', section: 'lm', linked: true, aulaLink: false });
  assert.deepEqual(resolveLearn({ learnView: 'book' }), { path: 'profe', section: 'book', linked: true, aulaLink: false });
  assert.deepEqual(resolveLearn({ learnView: 'pro', aulaView: 'method' }), { path: 'profe', section: 'method', linked: true, aulaLink: false });
  // ?clase= (main.js), el modo tester y las tareas del Aula escriben «pro»: es un enlace al Aula
  const aula = resolveLearn({ learnView: 'pro', aulaView: 'aula', libroView: 'book' });
  assert.deepEqual(aula, { path: 'profe', section: 'book', linked: false, aulaLink: true });
  assert.equal(resolveLearn({ learnView: 'profe' }).aulaLink, false);
});

test('un valor antiguo se guarda traducido una vez atendido (y los nuevos se dejan como están)', () => {
  assert.deepEqual(normalizedLearn({ learnView: 'casual' }), { learnView: 'solo' });
  assert.deepEqual(normalizedLearn({ learnView: 'lm' }), { learnView: 'profe', libroView: 'lm' });
  assert.deepEqual(normalizedLearn({ learnView: 'book' }), { learnView: 'profe', libroView: 'book' });
  assert.deepEqual(normalizedLearn({ learnView: 'pro', aulaView: 'method' }), { learnView: 'profe', libroView: 'method' });
  assert.deepEqual(normalizedLearn({ learnView: 'pro', aulaView: 'aula' }), { learnView: 'profe' });
  assert.equal(normalizedLearn({ learnView: 'solo' }), null);
  assert.equal(normalizedLearn({ learnView: 'profe' }), null);
  assert.equal(normalizedLearn({ learnView: null }), null, 'sin elección: se sigue deduciendo');
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

test('modo tester: al salir vuelve el camino de antes, también «sin elegir» (un profesor sigue en Libro y profesor)', async () => {
  const { testerEntryPatch, testerExitPatch } = await import('../js/tester-view.js');
  const teacher = { nickname: 'Marta', instrument: 'violin', learnView: null, school: { role: 'teacher' }, aula: {} };
  const inside = { ...teacher, ...testerEntryPatch(teacher, 'profesor', { uid: 'me', now: 1 }) };
  assert.equal(inside.tester.prev.learnView, null);
  const out = { ...inside, ...testerExitPatch(inside) };
  assert.equal(out.learnView, null);
  assert.equal(resolveLearn(out).path, 'profe');
  const solo = { ...teacher, learnView: 'solo' };
  const back = testerExitPatch({ ...solo, ...testerEntryPatch(solo, 'alumno', { uid: 'me', now: 1 }) });
  assert.equal(back.learnView, 'solo');
});
