// Las expresiones de firestore.rules (`.matches('…')`) se compilan con RE2 en el servidor, no con el motor de JS.
// RE2 rechaza una repetición anidada que pase de 1000 («invalid nested repetition operator»): la regla fallaría SIEMPRE,
// aunque el dry-run compile y en JS funcione. Aquí se comprueban TODAS con la misma cuenta que repeatIsValid de RE2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WIRE } from '../js/aula-wire.js';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const RE2_MAX_REPEAT = 1000;

// Árbol mínimo: grupos, clases [...], escapes, alternativas y cuantificadores {n}, {n,}, {n,m}, *, +, ?
export function parse(s) {
  let i = 0;
  function seq() {
    const items = [];
    while (i < s.length && s[i] !== ')') {
      let atom;
      if (s[i] === '(') { i++; if (s.startsWith('?:', i)) i += 2; const inner = seq(); i++; atom = { op: 'group', subs: inner }; }
      else if (s[i] === '[') { const j = s.indexOf(']', i + 2); atom = { op: 'class' }; i = j + 1; }
      else if (s[i] === '\\') { atom = { op: 'lit' }; i += 2; }
      else if (s[i] === '|') { i++; continue; }
      else { atom = { op: 'lit' }; i++; }
      const m = /^\{(\d+)(,(\d*))?\}/.exec(s.slice(i));
      if (m) { i += m[0].length; const min = +m[1]; const max = m[2] === undefined ? min : (m[3] === '' ? -1 : +m[3]); atom = { op: 'repeat', min, max, subs: [atom] }; }
      else if ('*+?'.includes(s[i] || '#')) { i++; atom = { op: 'star', subs: [atom] }; }
      items.push(atom);
    }
    return items;
  }
  return seq();
}

// repeatIsValid de RE2: cada {n,m} divide el presupuesto de las repeticiones que tiene dentro
function valid(node, budget) {
  let n = budget;
  if (node.op === 'repeat') {
    let m = node.max;
    if (m === 0) return true;
    if (m < 0) m = node.min;
    if (m > n) return false;
    if (m > 0) n = Math.floor(n / m);
  }
  return (node.subs || []).every(x => valid(x, n));
}
export const re2Valid = re => parse(re).every(x => valid(x, RE2_MAX_REPEAT));

test('el comprobador reconoce lo que RE2 rechaza', () => {
  assert.equal(re2Valid('([A-Za-z0-9_-]{1,40}=[0-9];){0,100}'), false, '40 × 100 > 1000');
  assert.equal(re2Valid('(a{1,60}b){0,20}'), false, '60 × 20 > 1000');
  assert.equal(re2Valid('[0-9]{1001}'), false);
  assert.equal(re2Valid('([A-Za-z0-9_-]{1,40}=[0-9];)*'), true);
  assert.equal(re2Valid('(a{1,10}){0,100}'), true, '10 × 100 = 1000');
});

test('todas las expresiones de firestore.rules caben en los límites de RE2', () => {
  const found = [...rules.matchAll(/\.matches\('([^']+)'\)/g)].map(m => m[1]);
  assert.ok(found.length >= 10, `solo ${found.length} expresiones`);
  assert.deepEqual(found.filter(re => !re2Valid(re)), []);
});

test('las del resumen del alumno (js/aula-wire.js) también', () => {
  assert.deepEqual(Object.entries(WIRE).filter(([, re]) => !re2Valid(re)).map(([k]) => k), []);
});
