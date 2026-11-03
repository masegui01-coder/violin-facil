// Formulario de acceso: primer campo con error, campos según el error de Firebase y aviso «Crea tu usuario».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAccountForm, fieldsForError, reminderText, reminderDue } from '../js/account-form.js';
import { translate } from '../js/i18n.js';

test('formulario vacío: el primer campo con error es el nombre (crear) o el correo (entrar)', () => {
  assert.equal(validateAccountForm({ signup: true }).field, 'Name');
  assert.equal(validateAccountForm({ signup: false }).field, 'Email');
});

test('correo mal escrito y contraseña corta', () => {
  assert.deepEqual(validateAccountForm({ signup: false, email: 'ana@', pass: 'x' }), { field: 'Email', message: 'Ese correo no parece válido.' });
  assert.equal(validateAccountForm({ signup: true, name: 'Ana', email: 'ana@x.es', pass: '123' }).field, 'Pass');
  assert.equal(validateAccountForm({ signup: false, email: 'ana@x.es', pass: '123' }), null, 'al entrar no se exige longitud');
  assert.equal(validateAccountForm({ signup: true, name: 'Ana', email: 'ana@x.es', pass: '123456' }), null);
});

test('errores de Firebase: qué campos se marcan', () => {
  assert.deepEqual(fieldsForError({ code: 'auth/invalid-credential' }), ['Email', 'Pass']);
  assert.deepEqual(fieldsForError({ code: 'auth/weak-password' }), ['Pass']);
  assert.deepEqual(fieldsForError({ code: 'auth/network-request-failed' }), []);
  assert.deepEqual(fieldsForError(null), []);
});

test('aviso «Crea tu usuario»: sin «Tus 0 puntos» y una vez al día', () => {
  assert.doesNotMatch(reminderText(0), /0 puntos/);
  assert.match(reminderText(120), /Tus 120 puntos/);
  assert.equal(reminderDue('2026-11-03', '2026-11-03'), false);
  assert.equal(reminderDue('2026-11-02', '2026-11-03'), true);
  assert.equal(reminderDue(undefined, '2026-11-03'), true);
  assert.match(translate(reminderText(0)), /^Everything you play/);
  assert.match(translate(reminderText(7)), /^Your 7 points/);
});

test('días de la semana: etiqueta accesible traducida', () => {
  assert.equal(translate('martes, hoy, sin práctica'), 'Tuesday, today, no practice');
  assert.equal(translate('lunes, practicado'), 'Monday, practised');
});
