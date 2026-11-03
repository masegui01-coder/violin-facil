// Borrar la cuenta del director o dueño: traspasar o borrar sus espacios (lógica sin red)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownedSpaces, transferCandidates, defaultChoice, choicesValid, transferWrites, stateAfterSpaces, spaceKey, DELETE } from '../js/spaces.js';

const me = 'u1';
const loaded = [
  { kind: 'band', id: 'b1', doc: { name: 'Banda', directorUid: me, code: 'ABCDEF' }, members: [{ id: me, nickname: 'Yo' }, { id: 'u3', nickname: 'Zoe' }, { id: 'u2', nickname: 'Ana' }] },
  { kind: 'group', id: 'g1', doc: { name: 'Garaje', ownerUid: me, code: 'GGGGGG' }, members: [{ id: me, nickname: 'Yo' }] },
  { kind: 'group', id: 'g2', doc: { name: 'Ajeno', ownerUid: 'u9' }, members: [] },
  { kind: 'school', id: 's1', doc: { name: 'Escuela', ownerUid: me, code: 'SSSSSS' }, members: [{ id: 'u4', nickname: "D'Angelo" }] },
];

test('solo los espacios que dirige o posee, con los demás miembros como candidatos (ordenados)', () => {
  const spaces = ownedSpaces(loaded, me);
  assert.deepEqual(spaces.map(spaceKey), ['band:b1', 'group:g1', 'school:s1']);
  assert.deepEqual(spaces[0].candidates.map(c => c.id), ['u2', 'u3']);
  assert.equal(spaces[0].code, 'ABCDEF');
  assert.deepEqual(spaces[1].candidates, []);
  assert.deepEqual(transferCandidates(null, me), []);
});

test('sin más miembros solo se puede borrar; con miembros se propone el primero', () => {
  const [band, group] = ownedSpaces(loaded, me);
  assert.equal(defaultChoice(band), 'u2');
  assert.equal(defaultChoice(group), DELETE);
  assert.equal(choicesValid([band, group], { 'band:b1': 'u3', 'group:g1': DELETE }), true);
  assert.equal(choicesValid([band, group], { 'band:b1': 'u3', 'group:g1': 'u2' }), false, 'nadie que no sea miembro');
  assert.equal(choicesValid([band], {}), false);
});

test('escrituras del traspaso por tipo de espacio', () => {
  const [band, , school] = ownedSpaces(loaded, me);
  assert.deepEqual(transferWrites(band, 'u3'), [
    { path: ['bands', 'b1'], data: { directorUid: 'u3', directorName: 'Zoe' } },
    { path: ['bands', 'b1', 'members', 'u3'], data: { role: 'director' } },
  ]);
  assert.deepEqual(transferWrites(school, 'u4'), [{ path: ['schools', 's1'], data: { ownerUid: 'u4', ownerName: "D'Angelo" } }]);
  assert.deepEqual(transferWrites({ kind: 'group', id: 'g1', candidates: [{ id: 'u5', nickname: 'Eva' }] }, 'u5'), [{ path: ['groups', 'g1'], data: { ownerUid: 'u5' } }]);
  assert.throws(() => transferWrites(band, 'u9'));
});

test('el borrado de la cuenta sigue sin los espacios borrados ni la escuela traspasada', () => {
  const spaces = ownedSpaces(loaded, me);
  const state = { band: { bandId: 'b1', role: 'director' }, groups: [{ groupId: 'g1' }, { groupId: 'g2' }], school: { schoolId: 's1', role: 'teacher' }, xp: 5 };
  const after = stateAfterSpaces(state, spaces, { 'band:b1': 'u2', 'group:g1': DELETE, 'school:s1': 'u4' });
  assert.deepEqual(after.band, state.band, 'banda traspasada: luego se borra su ficha y su progreso');
  assert.deepEqual(after.groups, [{ groupId: 'g2' }]);
  assert.equal(after.school, null);
  assert.equal(after.xp, 5);
  assert.equal(stateAfterSpaces(state, spaces, { 'band:b1': DELETE }).band, null);
  assert.deepEqual(stateAfterSpaces({ xp: 1 }, [], {}), { xp: 1, band: undefined, groups: [], school: undefined });
});
