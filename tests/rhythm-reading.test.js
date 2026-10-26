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

// Hallazgos del revisor musical (no deben volver)
const many = (instId, opts = {}) => {
  const inst = instrumentById(instId);
  const out = [];
  for (let level = 1; level <= MAX_LEVEL; level++) for (let seed = 1; seed <= 25; seed++) out.push({ inst, level, song: generateReading({ inst, level, bars: 16, seed, key: 'random', clefs: 'all', ...opts }) });
  return out;
};

test('la percusión y el cajón generan lecturas sin altura en cualquier nivel y tonalidad pedida', () => {
  ['percussion', 'cajon'].forEach(id => {
    many(id, { key: 'D' }).forEach(({ song, inst }) => {
      const s = check(song, inst);
      assert.equal(song.key, 'C');
      assert.ok(s.notes.every(n => n.rest || n.acc === 0));
    });
  });
});

test('una ligadura de prolongación siempre une dos notas iguales, nunca un silencio', () => {
  ['violin', 'sax', 'clarinet'].forEach(id => many(id).forEach(({ song }) => {
    const notes = parseScore(song.score).notes;
    notes.forEach((n, i) => {
      if (!n.tie) return;
      const next = notes[i + 1];
      assert.ok(next && !next.rest, `ligadura hacia un silencio: ${song.score.slice(0, 80)}`);
      assert.equal(next.midi, n.midi, 'ligadura entre alturas distintas');
      assert.ok(next.letter === n.letter && next.acc === n.acc, 'la nota ligada cambia de ortografía');
    });
  }));
});

test('los cromatismos se escriben con la letra natural para su resolución (sin Mi♯, Si♯, Fa♭ ni Do♭ en tonalidades sencillas)', () => {
  ['violin', 'sax', 'flute'].forEach(id => many(id).forEach(({ song }) => {
    // la tonalidad de cada nota (puede cambiar a mitad) y la sensible de la menor armónica (Mi♯ en Fa♯ menor) son correctas
    const L = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    parseScore(song.score).notes.filter(n => !n.rest).forEach(n => {
      const key = n.key || song.key;
      if (Math.abs(keyCount(key)) > 3) return;
      if (key.endsWith('m') && n.letter === L[(L.indexOf(key[0]) + 6) % 7]) return;
      const odd = (n.acc === 1 && ['E', 'B'].includes(n.letter)) || (n.acc === -1 && ['F', 'C'].includes(n.letter));
      assert.ok(!odd, `${n.letter}${n.acc > 0 ? '#' : 'b'}${n.oct} en ${key}`);
    });
  }));
});

test('la sensible de la menor armónica lleva la letra del 7.º grado (nunca Sol♮ en Sol♯ menor)', () => {
  const inst = instrumentById('violin');
  ['G#m', 'D#m', 'Am', 'Bbm'].forEach(key => {
    for (let seed = 1; seed <= 30; seed++) {
      const song = generateReading({ inst, level: 6, bars: 16, seed, key, scale: 'minor', chromatic: false });
      const s = parseScore(song.score);
      const tonicLetter = key[0];
      const seventhLetter = ['C', 'D', 'E', 'F', 'G', 'A', 'B'][(['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(tonicLetter) + 6) % 7];
      s.notes.filter(n => !n.rest).forEach(n => assert.ok(Math.abs(n.acc) <= 1));
      // en Sol♯ y Re♯ menor no se sube el 7.º (haría falta un doble sostenido): la letra del 7.º grado no aparece natural
      if (key === 'G#m' || key === 'D#m') s.notes.filter(n => !n.rest && n.letter === seventhLetter).forEach(n => assert.equal(n.acc, 1, `${seventhLetter}${n.acc} en ${key}`));
    }
  });
});

test('el último compás de los compases compuestos y de amalgama respeta los pulsos', () => {
  const inst = instrumentById('sax');
  [['9/8', ['h', 'q']], ['12/8', ['w']], ['5/8', ['q', 'q']], ['7/8', ['h', 'q']], ['6/8', ['h']]].forEach(([meter, durs]) => {
    const s = parseScore(generateReading({ inst, level: 5, bars: 4, seed: 2, meter }).score);
    const last = s.notes.filter(n => n.bar === s.bars.length - 1);
    assert.deepEqual(last.map(n => n.dur), durs, meter);
    assert.ok(last.every(n => !n.rest));
    last.slice(0, -1).forEach(n => assert.ok(n.tie, `${meter}: falta la ligadura`));
  });
});

test('las lecturas no llevan base automática (cambian de armadura y de compás)', () => {
  assert.equal(generateReading({ inst: instrumentById('sax'), level: 9, seed: 1 }).noAutoBase, true);
});

test('lecturas largas: 48, 64 y 96 compases completos', () => {
  const inst = instrumentById('sax');
  [48, 64, 96].forEach(bars => {
    const song = generateReading({ inst, level: 9, bars, seed: bars, key: 'random', clefs: 'all' });
    assert.equal(check(song, inst).bars.length, bars);
  });
});
