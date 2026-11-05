// Estudio: primera vista por niveles, ortografía de «Afinar en acorde» y resumen del mapa de afinación.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sightReading, comfortRange, spellFromTonic, majorKeyOf } from '../js/generate.js';
import { INSTRUMENTS, instrumentById } from '../js/instruments.js';
import { parseScore, noteLabel, commonLabel } from '../js/music.js';
import { mapSummary, MIN_SAMPLES } from '../js/tuning-map.js';

const notesOf = song => parseScore(song.score).notes.filter(n => !n.rest);
const melodic = INSTRUMENTS.filter(i => !i.rhythmOnly);
const SEEDS = 150;

test('primera vista nivel 1: solo por grados conjuntos, también al llegar a la tónica final', () => {
  melodic.forEach(inst => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const notes = notesOf(sightReading(1, inst, seed));
      for (let i = 1; i < notes.length; i++) {
        assert.ok(Math.abs(notes[i].midi - notes[i - 1].midi) <= 2, `${inst.id} semilla ${seed}: salto de ${notes[i - 1].midi} a ${notes[i].midi}`);
      }
    }
  });
});

test('primera vista: todas las lecturas terminan en la tónica y llegan por grado en todos los niveles', () => {
  melodic.forEach(inst => [1, 2, 3].forEach(level => {
    for (let seed = 0; seed < 60; seed++) {
      const song = sightReading(level, inst, seed);
      const notes = notesOf(song);
      const last = notes[notes.length - 1];
      const tonicPc = parseScore(`| ${song.key.replace(/m$/, '')}4q |`).notes[0].midi % 12;
      assert.equal(((last.midi % 12) + 12) % 12, tonicPc, `${inst.id} N${level} ${seed}: no acaba en la tónica`);
      assert.ok(Math.abs(last.midi - notes[notes.length - 2].midi) <= 2, `${inst.id} N${level} ${seed}: salto final`);
    }
  }));
});

test('primera vista: dentro del registro cómodo y con un ámbito que crece con el nivel', () => {
  melodic.forEach(inst => {
    const [lo, hi] = comfortRange(inst);
    const widest = { 1: 0, 2: 0, 3: 0 };
    [1, 2, 3].forEach(level => {
      for (let seed = 0; seed < SEEDS; seed++) {
        const midis = notesOf(sightReading(level, inst, seed)).map(n => n.midi);
        midis.forEach(m => assert.ok(m >= lo && m <= hi, `${inst.id} N${level} ${seed}: ${m} fuera de ${lo}-${hi}`));
        widest[level] = Math.max(widest[level], Math.max(...midis) - Math.min(...midis));
      }
    });
    assert.ok(widest[1] <= 12, `${inst.id}: el nivel 1 abarca ${widest[1]} semitonos`);
    assert.ok(widest[1] <= widest[3], inst.id);
  });
  assert.deepEqual(comfortRange(instrumentById('cello')), [36, 63]);
  const tenor = comfortRange(instrumentById('sax-tenor'));
  assert.ok(tenor[1] <= 79, 'el saxo tenor no sube a Mi6 al empezar');
});

test('afinar en acorde: la nota se escribe desde la tónica escrita', () => {
  const name = (rootConcert, transpose, written, degree) => noteLabel(spellFromTonic(rootConcert - transpose, written, degree), 'eu');
  // Mi♭ de concierto en flauta: la 5.ª es Si♭, no La♯
  assert.equal(name(63, 0, 70, 4), 'Si♭');
  // Si♭ de concierto: 3.ª menor Re♭ y la de Mi♭ (concierto) es Sol♭
  assert.equal(name(58, 0, 61, 2), 'Re♭');
  assert.equal(name(63, 0, 66, 2), 'Sol♭');
  // Fa de concierto en trompeta (Sol escrito): 3.ª menor Si♭, no La♯
  assert.equal(name(65, -2, 70, 2), 'Si♭');
  // Do de concierto en saxo alto (La escrito): 3.ª mayor Do♯
  assert.equal(name(60, -9, 73, 2), 'Do♯');
  assert.equal(majorKeyOf(70), 'Bb');
});

test('ortografía habitual de una nota suelta: Do♯, Mi♭, Fa♯, Sol♯ y Si♭', () => {
  assert.deepEqual([61, 63, 66, 68, 70].map(m => commonLabel(m, 'eu')), ['Do♯', 'Mi♭', 'Fa♯', 'Sol♯', 'Si♭']);
});

test('mapa de afinación: con pocos datos pide más en lugar de dar la afinación por equilibrada', () => {
  const nameOf = r => `n${r.midi}`;
  const one = mapSummary([{ midi: 60, mean: 0, n: 1 }], 'Flauta', nameOf);
  assert.match(one, /pocos datos/);
  assert.doesNotMatch(one, /equilibrada/);
  const steady = mapSummary([{ midi: 60, mean: 1, n: MIN_SAMPLES }], 'Flauta', nameOf);
  assert.match(steady, /equilibrada/);
  assert.match(mapSummary([{ midi: 72, mean: -9, n: 4 }, { midi: 60, mean: 2, n: 1 }], 'Flauta', nameOf), /^Notas a vigilar: n72 \(−9 ¢\)/); // signo menos, no guion
  assert.match(mapSummary([], 'Flauta', nameOf), /Aún no hay datos de tu flauta/);
});

test('una sola regla escrita/concierto: la de concierto se deletrea desde la escrita', async () => {
  const { concertLabel, signedCents } = await import('../js/music.js');
  // Clarinete en Si♭: Si♭ escrito suena La♭ (no Sol♯) y Mi♭ suena Re♭
  assert.equal(concertLabel(70, -2, 'eu'), 'La♭');
  assert.equal(concertLabel(63, -2, 'eu'), 'Re♭');
  // Trompeta: Fa♯ escrito suena Mi; saxo alto: Sol escrito suena Si♭; trompa: Do escrito suena Fa; requinto: Do suena Mi♭
  assert.equal(concertLabel(66, -2, 'eu'), 'Mi');
  assert.equal(concertLabel(67, -9, 'eu'), 'Si♭');
  assert.equal(concertLabel(60, -7, 'us'), 'F3');
  assert.equal(concertLabel(60, 3, 'eu'), 'Mi♭');
  assert.equal(commonLabel(66, 'eu'), 'Fa♯');
  assert.deepEqual([12.4, -8.2, 0].map(signedCents), ['+12', '−8', '0']);
});

test('primera vista nivel 1 de ukelele y piano: en los primeros trastes y junto al Do central', () => {
  [['ukulele', 72], ['piano', 72]].forEach(([id, top]) => {
    for (let seed = 12340; seed < 12440; seed++) {
      const high = Math.max(...notesOf(sightReading(1, instrumentById(id), seed)).map(n => n.midi));
      assert.ok(high <= top, `${id} semilla ${seed}: llega a ${high}`);
    }
  });
});
