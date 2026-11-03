// Texto «Oigo…» del reproductor: otra nota → cuál suena y cuál se pide; la misma nota desafinada → cents.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heardText } from '../js/heard.js';
import { translate } from '../js/i18n.js';

const E4 = 64;
const G4 = 67;

test('otra nota: dice cuál oye y cuál pide, sin cents', () => {
  assert.equal(heardText(E4 + 0.02, G4, { nom: 'eu' }), 'Oigo Mi · te pide Sol');
  assert.equal(heardText(E4 + 0.02, G4, { nom: 'us' }), 'Oigo E4 · te pide G4');
});

test('la misma nota desafinada: cents y si va alta o baja', () => {
  assert.equal(heardText(G4 + 0.23, G4, { nom: 'eu', tolerance: 25 }), 'Oigo Sol, +23 cents, un poco alto');
  assert.equal(heardText(G4 - 0.6, G4, { nom: 'us', tolerance: 25 }), 'Oigo G4, -60 cents, bajo');
  assert.equal(heardText(G4 + 0.05, G4, { nom: 'eu', tolerance: 25 }), 'Oigo Sol, +5 cents, afinado');
});

test('misma nota en otra octava: en la europea se añade la octava para distinguirlas', () => {
  assert.equal(heardText(G4 - 12, G4, { nom: 'eu' }), 'Oigo Sol3 · te pide Sol4');
});

test('sin nota pedida, solo lo que oye', () => {
  assert.equal(heardText(E4, null, { nom: 'eu' }), 'Oigo Mi');
});

test('se traduce al inglés', () => {
  assert.equal(translate('Oigo Mi · te pide Sol'), 'I hear Mi · it asks for Sol');
  assert.equal(translate('Oigo G4, +23 cents, un poco alto'), 'I hear G4, +23 cents, a little sharp');
});
