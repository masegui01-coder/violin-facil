// Inglés del Aula: cada texto fijo de sus pantallas (esc('…')) y los compuestos con números, fechas o nombres.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { translate } from '../js/i18n.js';
import { KIND_NAMES, SECTION_NAMES, VARIANT_NAMES } from '../js/aula-temario.js';
import { COMPETENCIES, gradeWord } from '../js/aula-report.js';

const SCREENS = new URL('../js/screens/', import.meta.url);
const files = readdirSync(SCREENS).filter(f => /^aula/.test(f)).map(f => readFileSync(new URL(f, SCREENS), 'utf8'));
const untranslated = list => list.filter(es => /\p{L}{2}/u.test(es) && translate(es) === es);

test('cada texto fijo de las pantallas del Aula tiene su inglés', () => {
  const literals = files.flatMap(src => [...src.matchAll(/esc\('((?:[^'\\]|\\.)*)'\)/g)].map(m => m[1].replace(/\\'/g, "'")));
  assert.ok(literals.length > 80, `solo ${literals.length} textos`);
  assert.deepEqual(untranslated([...new Set(literals)]), []);
});

test('textos del formulario y del HTML fijo de las pantallas del Aula', () => {
  const form = readFileSync(new URL('aula-task-form.js', SCREENS), 'utf8');
  const html = [...form.matchAll(/>([^<>${}`'=;()]*\p{L}[^<>${}`'=;()]*)</gu)].map(m => m[1].trim()).filter(x => x && x !== 'MusicXML');
  const attrs = [...form.matchAll(/(?:placeholder|aria-label)="([^"$]+)"/g)].map(m => m[1]);
  const consts = [...form.matchAll(/\['[\w-]+', '([^']+)'\]/g)].map(m => m[1]).filter(x => x !== 'MusicXML');
  assert.deepEqual(untranslated([...new Set([...html, ...attrs, ...consts])]), []);
});

test('nombres del temario, competencias y calificaciones', () => {
  const names = [...Object.values(KIND_NAMES), ...Object.values(SECTION_NAMES), ...Object.values(VARIANT_NAMES), ...COMPETENCIES.map(c => c[1]),
    ...[1, 5, 6, 7, 9, null].map(gradeWord), 'Tareas', 'Constancia', 'Hecha', 'Sin intentos', 'Vencida', 'Empezada', 'Sin empezar'];
  assert.deepEqual(untranslated(names), []);
});

test('compuestos con números, fechas y nombres', () => {
  const cases = {
    'Vence el 12 Nov': 'Due 12 Nov', 'Venció el 3 Nov': 'Was due 3 Nov', 'Mínimo 60 %': 'Pass mark 60 %', 'Quedan 3 intentos': '3 attempts left',
    '2 intentos por ejercicio': '2 attempts per exercise', '1 intento': '1 attempt', 'Clase de Marta': "Marta's class",
    '2 pendientes · 1 vencida · 0 hechas': '2 to do · 1 overdue · 0 done', 'Hechas (4)': 'Done (4)', '12 alumnos': '12 students',
    'Clase · código K7P2QX': 'Class · code K7P2QX', '3 de 5 la han hecho · 4 la han intentado · media 72 % · 1 vencidas': '3 of 5 done · 4 tried · average 72 % · 1 overdue',
    '1.er trimestre · curso 2026-2027': '1st term · school year 2026-2027', 'Confunde 3.ª mayor con 3.ª menor': 'Confuses major 3rd with minor 3rd',
    'Nivel 1': 'Level 1', 'N1 · U3': 'L1 · U3', 'Ana: 45 %, Empezada': 'Ana: 45 %, Started', '5 veces': '5 times', 'Como mucho 20 ejercicios.': 'Up to 20 exercises.',
    'Te has unido a 1.º A': 'You joined 1.º A', 'Racha: 4': 'Streak: 4',
    'No se ha podido enviar tu progreso a tu clase: No hay conexión. Inténtalo de nuevo cuando tengas internet.': "Couldn't send your progress to your class: No connection. Try again when you're online.",
  };
  Object.entries(cases).forEach(([es, en]) => assert.equal(translate(es), en, es));
  assert.match(translate('Únete a mi clase «1.º A» en Band Flow: https://x.y/?clase=K7P2QX (código K7P2QX)'), /^Join my class “1\.º A” on Band Flow: .+ \(code K7P2QX\)$/);
});
