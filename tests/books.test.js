import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS } from '../js/instruments.js';
import { buildCourse } from '../js/course.js';
import { buildLibrary, bookOpen } from '../js/books.js';
import { pageScore } from '../js/book.js';
import { chordShape, parseChord, isFretted } from '../js/chords.js';
import { LANGUAGE, TECHNIQUE } from '../js/book-theory.js';

for (const inst of INSTRUMENTS) {
  test(`${inst.name}: tres libros completos y tocables`, () => {
    const library = buildLibrary(buildCourse(['folk', 'clasica'], inst.id), inst);
    assert.equal(library.length, 3);
    const ids = library.flatMap(b => b.chapters.flatMap(c => c.pages.map(p => p.lesson.id)));
    assert.equal(new Set(ids).size, ids.length, 'ids repetidos: ' + ids.filter((x, i) => ids.indexOf(x) !== i).join(','));
    library.forEach(book => {
      const pages = book.chapters.flatMap(c => c.pages);
      assert.deepEqual(pages.map(p => p.number), pages.map((_, i) => i + 1));
      assert.ok(pages.length >= 50, `${inst.id} ${book.title}: solo ${pages.length} páginas`);
      assert.ok(pages.some(p => p.lesson.exam), 'sin examen');
      pages.forEach(({ lesson: l }) => {
        if (l.kind === 'chords') {
          l.chords.forEach(c => { parseChord(c); if (isFretted(inst.id)) assert.ok(chordShape(c, inst.id), `${l.id}: sin forma ${c}`); });
          if (l.chart) assert.ok(l.chart.length > 0);
          return;
        }
        if (l.kind === 'theory') {
          assert.ok((l.cards || []).length > 0 || (l.quiz || []).length > 0, l.id);
          (l.quiz || []).forEach(q => assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id));
          return;
        }
        const data = pageScore(l, inst);
        assert.ok(data, `${l.id}: sin partitura`);
        data.score.bars.slice(1, -1).forEach((b, i) => assert.equal(b.beats, data.time, `${l.id} compás ${i + 2}`)); // la primera puede ser anacrusa
        if (!inst.rhythmOnly) data.score.notes.filter(n => !n.rest).forEach(n => assert.ok(n.midi >= inst.written[0] && n.midi <= inst.written[1], `${l.id}: ${n.midi}`));
      });
    });
    const theory = library.flatMap(b => b.chapters.flatMap(c => c.pages)).filter(p => p.lesson.kind === 'theory').length;
    assert.ok(theory >= 40, `${inst.id}: solo ${theory} páginas de teoría`);
  });
}

test('el libro 2 se abre al aprobar el examen del 1', () => {
  assert.equal(bookOpen(1, {}), true);
  assert.equal(bookOpen(2, {}), false);
  assert.equal(bookOpen(2, { 'b1-examen-teoria': { best: 2 } }), true);
  assert.equal(bookOpen(3, { 'b1-examen-teoria': { best: 3 } }), false);
  assert.equal(bookOpen(3, {}, { unlocked: { 3: true } }), true);
});

test('el temario está completo: 8 temas por nivel y técnica para cada familia', () => {
  [2, 3].forEach(n => assert.ok(LANGUAGE[n].length >= 8));
  Object.values(TECHNIQUE).forEach(f => [2, 3].forEach(n => assert.equal(f[n].length, 8)));
});
