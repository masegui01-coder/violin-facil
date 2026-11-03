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

test('la pantalla de acceso, «Apariencia» de Perfil y el aviso de versión nueva tienen su texto en inglés', () => {
  [
    'Aprende tu instrumento con una app que te escucha', 'Te escucha mientras tocas', 'Un curso a tu ritmo', 'Ensaya con tu banda',
    '¿Por qué pedimos una cuenta?', 'Política de privacidad', 'Tu progreso de este móvil se guardará en tu cuenta: no pierdes nada.',
    'Apariencia', 'Claro', 'Oscuro', 'Sistema', '«Sistema» sigue el modo claro u oscuro de tu móvil.',
    'Hay una versión nueva', 'Actualizar',
  ].forEach(es => assert.notEqual(translate(es), es, es));
});

test('Aprender, Banda y Perfil: lo que quedaba en español se traduce', () => {
  assert.equal(translate('Unidad 3'), 'Unit 3');
  assert.equal(translate('Más'), 'More');
  assert.equal(translate('Reto del día · liga · amigos · test de nivel'), 'Daily challenge · league · friends · level test');
  assert.equal(translate('B4, C♯5 y D5'), 'B4, C♯5 and D5');
  assert.equal(translate('2 de 3 estrellas'), '2 of 3 stars');
  assert.equal(translate('Dificultad 1 de 3'), 'Difficulty 1 of 3');
  assert.equal(translate('Ej.: K7P2QX'), 'E.g. K7P2QX');
  assert.equal(translate('Ej.: Banda Municipal de…'), 'E.g. Town Band of…');
  assert.equal(translate('Tu apodo público: Lola. Nunca se usa tu nombre.'), 'Your public nickname: Lola. Your name is never used.');
  [
    'Ensaya las obras que te pone tu director y comparte tu progreso.', 'Como te conoce tu banda', 'Niveles superados del curso',
    'Se te pedirá un apodo la primera vez que entres en una clasificación.', 'Practica unos días y aquí verás cómo mejoras.', 'Perfil de habilidades',
  ].forEach(es => assert.notEqual(translate(es), es, es));
});
