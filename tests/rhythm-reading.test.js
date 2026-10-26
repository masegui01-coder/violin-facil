import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseScore, meterBeats, keyCount } from '../js/music.js';
import { instrumentById } from '../js/instruments.js';
import { generateReading, generateBook, MAX_LEVEL, ALL_CELLS } from '../js/rhythm-reading.js';
import { engrave } from '../js/engrave.js';

const INSTS = ['sax', 'clarinet', 'trumpet', 'flute', 'trombone', 'violin'].map(instrumentById);
const near = (a, b) => Math.abs(a - b) < 1e-6;

function check(song, inst) {
  const s = parseScore(song.score);
  let meter = song.meter;
  s.bars.forEach((b, i) => {
    meter = b.meter || meter;
    assert.ok(near(b.beats, meterBeats(meter)), `${inst.id} nivel ${song.level} compás ${i + 1}: ${b.beats} en ${meter.join('/')}`);
  });
  s.notes.filter(n => !n.rest).forEach(n => assert.ok(n.midi >= inst.written[0] && n.midi <= inst.written[1] + 2, `${inst.id}: ${n.letter}${n.oct} fuera de registro`));
  const groups = {};
  s.notes.filter(n => n.tupletId).forEach(n => { groups[n.tupletId] = (groups[n.tupletId] || 0) + n.beats; });
  Object.values(groups).forEach(sum => assert.ok(near(sum, Math.round(sum)), 'grupo irregular incompleto'));
  return s;
}

test('todas las lecturas, en los 10 niveles y varios instrumentos, tienen los compases completos y caben en el registro', () => {
  INSTS.forEach(inst => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let seed = 1; seed <= 6; seed++) {
        const song = generateReading({ inst, level, bars: 16, seed, key: 'random', clefs: 'all', extended: true });
        check(song, inst);
        assert.ok(Math.abs(keyCount(song.key)) <= 6);
        assert.ok(engrave(parseScore(song.score), { key: song.key, meter: song.meter, clef: inst.clef || 'treble' }).length >= 1);
      }
    }
  });
});

test('el nivel 1 solo usa redondas, blancas y negras, sin grupos irregulares', () => {
  const inst = instrumentById('sax');
  for (let seed = 1; seed <= 10; seed++) {
    const s = parseScore(generateReading({ inst, level: 1, bars: 8, seed, meter: '4/4' }).score);
    s.notes.forEach(n => assert.ok(['w', 'h', 'q'].includes(n.dur) && !n.tuplet, n.dur));
  }
});

test('los niveles altos traen cambios de compás, grupos irregulares, cromatismos, reguladores y agógica', () => {
  const inst = instrumentById('sax');
  const scores = Array.from({ length: 8 }, (_, i) => generateReading({ inst, level: 9, bars: 24, seed: i + 1, key: 'random', extended: true }).score).join(' ');
  ['@time:', ':3', ':6', '@<', '@rit', '@tempo:', "'", '(', 'U'].forEach(token => assert.ok(scores.includes(token), `falta ${token}`));
  const parsed = parseScore(generateReading({ inst, level: 9, bars: 24, seed: 3, key: 'random' }).score);
  assert.ok(new Set(parsed.bars.map(b => (b.meter || []).join('/'))).size > 2);
});

test('se pueden quitar familias de figuras y cambios de clave', () => {
  const inst = instrumentById('sax');
  const s = parseScore(generateReading({ inst, level: 9, bars: 16, seed: 5, families: ['q', 'e', 'h', 'w', 'dot'], rests: false, clefs: 'none', meter: '4/4' }).score);
  s.notes.forEach(n => { assert.ok(!n.tuplet && !['s', 't'].includes(n.dur), n.dur); assert.ok(!n.clef); });
  assert.ok(s.notes.slice(1).every(n => !n.rest || s.notes.indexOf(n) > s.notes.length - 4));
});

test('el libro sube de nivel hasta el elegido', () => {
  const book = generateBook({ inst: instrumentById('sax'), level: 8, bars: 12, seed: 4, key: 'random' }, 6);
  assert.equal(book[0].level, 5);
  assert.equal(book[5].level, 8);
  book.forEach(x => check(x.song, instrumentById('sax')));
});

test('cada célula rítmica dura exactamente lo que dice', () => {
  ALL_CELLS.forEach(c => {
    const s = parseScore(c.pat.split(' ').map(t => (t.startsWith('R') ? t : 'C5' + t)).join(' '));
    assert.ok(near(s.totalBeats, c.beats), `${c.pat}: ${s.totalBeats} en vez de ${c.beats}`);
  });
});
