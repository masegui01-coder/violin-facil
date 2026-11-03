// Borrar la cuenta: qué resultados públicos se localizan, apuntes de grupo, reautenticación y orden de los pasos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ownedResultPaths, sectionsWithoutNotes, signedInRecently, isNetworkFailure } from '../js/sync.js';
import { weekId } from '../js/engage.js';

const NOW = new Date('2026-11-03T10:00:00');
const keys = paths => paths.map(p => p.join('/')).sort();

test('sin apodo público no se buscan resultados (nunca publicó nada)', () => {
  assert.deepEqual(ownedResultPaths({ progress: { 'song:oda': 3 }, practiceLog: { '2026-10-20': 5 } }, NOW), []);
  assert.deepEqual(ownedResultPaths(null, NOW), []);
});

test('localiza ligas, retos del día, canciones y retos por instrumento a partir del estado', () => {
  const state = {
    publicName: 'Trompetista42', instrument: 'trumpet',
    practiceLog: { '2026-10-20': 5, '2026-10-21': 3 },
    dailyDone: { '2026-10-21': 2 },
    progress: { 'song:oda': 3, 'trumpet:song:himno': 2, 'trumpet:lesson:reto-ABC234': 1, 'lesson:u1-ae': 2, 'song:bad/id': 1 },
  };
  const got = keys(ownedResultPaths(state, NOW));
  const week = weekId(new Date('2026-10-20T12:00'));
  assert.ok(got.includes(`leagues/${weekId(NOW)}_trumpet`), 'liga de esta semana');
  assert.ok(got.includes(`leagues/${week}_violin`) && got.includes(`leagues/${week}_trumpet`), 'liga de la semana practicada con cada instrumento');
  assert.ok(got.includes('daily/2026-10-21_violin') && got.includes('daily/2026-10-21_trumpet'));
  assert.ok(got.includes('boards/oda_violin') && got.includes('boards/himno_trumpet'));
  assert.ok(got.includes('challenges/ABC234'));
  assert.ok(!got.some(p => p.includes('bad/id')), 'un id con «/» se descarta');
  assert.equal(new Set(got).size, got.length, 'sin repetidos');
});

test('quita solo mis apuntes de las partes de una canción', () => {
  const sections = [{ name: 'Intro', at: 0, notes: { me: 'Do', ana: 'Sol' } }, { name: 'Estribillo', at: 20, notes: { ana: 'Fa' } }];
  const out = sectionsWithoutNotes(sections, 'me');
  assert.deepEqual(out[0].notes, { ana: 'Sol' });
  assert.equal(out[1], sections[1]);
  assert.deepEqual(sections[0].notes, { me: 'Do', ana: 'Sol' }, 'no muta el original');
  assert.equal(sectionsWithoutNotes(sections, 'nadie'), null);
  assert.equal(sectionsWithoutNotes(undefined, 'me'), null);
});

test('reautenticar solo si la última entrada no es reciente', () => {
  const at = ms => ({ metadata: { lastSignInTime: new Date(NOW.getTime() - ms).toUTCString() } });
  assert.equal(signedInRecently(at(60000), NOW.getTime()), true);
  assert.equal(signedInRecently(at(10 * 60000), NOW.getTime()), false);
  assert.equal(signedInRecently({ metadata: {} }, NOW.getTime()), false);
  assert.equal(signedInRecently(null, NOW.getTime()), false);
});

test('un fallo de red corta el borrado de la cuenta; uno de permisos no', () => {
  assert.equal(isNetworkFailure({ code: 'unavailable' }), true);
  assert.equal(isNetworkFailure({ code: 'auth/network-request-failed' }), true);
  assert.equal(isNetworkFailure({ code: 'permission-denied' }), false);
});

test('orden al borrar la cuenta: reautenticar, después datos y por último el usuario', () => {
  const ui = readFileSync(new URL('../js/screens/account-panel.js', import.meta.url), 'utf8');
  const body = ui.slice(ui.indexOf('async function removeAccount'));
  const reauth = body.indexOf('await reauthenticate(');
  const data = body.indexOf('await deleteCloudData(');
  const user = body.indexOf('await deleteAccount(');
  assert.ok(reauth > 0 && reauth < data && data < user, 'reautenticar → datos → usuario');
  // Si falla la reautenticación se sale sin borrar nada
  assert.match(body.slice(reauth, data), /catch \(e\) \{[\s\S]*No se ha borrado nada[\s\S]*return;/);
  assert.match(ui, /reauthenticateWithPopup\(user, provider\)/);
  assert.match(ui, /reauthenticateWithCredential\(user, c\.authFns\.EmailAuthProvider\.credential\(user\.email, pass\)\)/);
  assert.match(ui, /deleteCloudData\(user\.uid, getState\(\)\)/);
});
