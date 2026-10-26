import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPdf } from '../js/pdf-writer.js';

// JPEG mínimo de 1×1 píxel (solo para comprobar la estructura del PDF)
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z';

test('crea un PDF válido con texto, imágenes, varias páginas y pie', async () => {
  const doc = createPdf().page().text('Lectura rítmica n.º 1 (ñ)', 15, 20, { size: 15, bold: true }).image(JPEG, 15, 30, 180, 30, 1, 1).page().text('Otra página', 15, 20);
  const blob = doc.footer((n, t) => `Band Flow - ${n}/${t}`).blob();
  const text = Buffer.from(await blob.arrayBuffer()).toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.ok(text.trimEnd().endsWith('%%EOF'));
  assert.match(text, /\/Count 2/);
  assert.match(text, /\/Filter \/DCTDecode/);
  assert.ok(text.includes('Lectura rítmica n.º 1 \\(ñ\\)'), 'texto con tildes y paréntesis escapados');
  assert.match(text, /Band Flow - 2\/2/);
  // la tabla xref apunta a los objetos de verdad
  const xref = Number(/startxref\n(\d+)/.exec(text)[1]);
  assert.equal(text.slice(xref, xref + 4), 'xref');
  const offsets = text.slice(xref).split('\n').slice(3).filter(l => / n $/.test(l)).map(l => Number(l.slice(0, 10)));
  offsets.forEach((o, i) => assert.ok(text.slice(o).startsWith(`${i + 1} 0 obj`), `objeto ${i + 1}`));
});
