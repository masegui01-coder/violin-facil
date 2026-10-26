import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../js/i18n.js';
import { EXACT } from '../js/i18n-en.js';

test('traduce frases exactas respetando los espacios', () => {
  assert.equal(translate('Aprender'), 'Learn');
  assert.equal(translate('  Ajustes '), '  Settings ');
  assert.equal(translate('Texto que no está en el diccionario'), 'Texto que no está en el diccionario');
});

test('traduce frases con números e instrumentos', () => {
  assert.equal(translate('Siguiente página (4)'), 'Next page (4)');
  assert.equal(translate('El libro de saxofón alto'), 'The Alto sax book');
  assert.equal(translate('Libro 2 · cap. 3 · pág. 14 de 71'), 'Book 2 · ch. 3 · p. 14 of 71');
  assert.equal(translate('12 de 16 notas a tiempo (75 %)'), '12 of 16 notes in time (75 %)');
});

test('el diccionario no deja traducciones vacías', () => {
  Object.entries(EXACT).forEach(([es, en]) => assert.ok(en && en.trim(), es));
});
