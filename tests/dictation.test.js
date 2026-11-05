// Dictado musical: generador por niveles (pedagogía y frase), cuantización del ritmo, alineación y puntuación.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeDictation, melodicDictation, rhythmDictation, LEVEL_COUNT, MELODIC_LEVELS, RHYTHM_LEVELS, metersFor, barsFor,
  meterBeatsOf, quantumFor, tonicTriad, cadenceChords, countInPlan, recommendedLevel, bestKey, intervalOk, levelConfig, hasNovelty, novelCells,
} from '../js/dictation.js';
import {
  quantize, quantizeBest, fitTiming, dictationStars, alignNotes, scoreDictation, pitchKind, rhythmCredit, withIoi, splitDuration,
  eventsToScore, spellPlayed, spellingsOf,
} from '../js/dictation-score.js';
import { INSTRUMENTS, instrumentById, foldOctave } from '../js/instruments.js';
import { parseScore, parseNote } from '../js/music.js';
import { rng } from '../js/generate.js';

const violin = instrumentById('violin');
const sounding = d => d.notes.filter(n => !n.rest);
const EPS = 1e-6;
const pitched = INSTRUMENTS.filter(i => !i.rhythmOnly);
const barRhythms = d => {
  const out = [];
  d.notes.forEach(n => { (out[n.bar] ||= []).push((n.rest ? 'R' : '') + n.beats); });
  return out.map(b => b.join(' '));
};

test('mismo nivel y semilla, mismo dictado; otra semilla, otro dictado', () => {
  const a = melodicDictation(violin, { level: 5, meter: '4/4', bars: 4, seed: 42 });
  assert.equal(a.score, melodicDictation(violin, { level: 5, meter: '4/4', bars: 4, seed: 42 }).score);
  assert.notEqual(a.score, melodicDictation(violin, { level: 5, meter: '4/4', bars: 4, seed: 43 }).score);
});

test('todos los niveles, compases, longitudes e instrumentos: frase completa, tónica al principio y al final, registro', () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (const meter of metersFor(level, false)) {
      for (const bars of barsFor(level, meter)) {
        for (const inst of pitched) {
          for (let seed = 1; seed <= 4; seed++) {
            const d = melodicDictation(inst, { level, meter, bars, seed: seed * 7919 + level });
            assert.ok(d, `${inst.id} nivel ${level} ${meter} ${bars}`);
            const parsed = parseScore(d.score);
            assert.equal(parsed.bars.length, bars, d.score);
            parsed.bars.forEach(b => assert.ok(Math.abs(b.beats - meterBeatsOf(meter)) < EPS, d.score));
            const notes = sounding(d);
            const pc = m => ((m % 12) + 12) % 12;
            assert.equal(pc(notes[0].midi), pc(d.tonicMidi), 'empieza en la tónica');
            assert.equal(pc(notes[notes.length - 1].midi), pc(d.tonicMidi), 'acaba en la tónica');
            assert.ok(notes.length <= Math.round(3.75 * bars), `densidad: ${notes.length} notas en ${bars} compases`);
            notes.forEach(n => assert.ok(n.midi >= inst.written[0] && n.midi <= inst.written[1], `${inst.id}: ${n.midi} fuera de registro`));
            assert.ok(!d.notes[0].rest, 'no empieza con silencio');
          }
        }
      }
    }
  }
});

test('sin tritonos ni intervalos aumentados o disminuidos (también tras las alteraciones y en menor armónica)', () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (const inst of [violin, instrumentById('clarinet'), instrumentById('trumpet'), instrumentById('flute')]) {
      for (let seed = 1; seed <= 40; seed++) {
        const d = melodicDictation(inst, { level, meter: metersFor(level, false)[seed % metersFor(level, false).length], bars: 4, seed });
        const notes = sounding(d);
        for (let i = 1; i < notes.length; i++) {
          assert.ok(intervalOk(notes[i - 1], notes[i], true), `nivel ${level}: ${d.score}`);
          assert.notEqual(Math.abs(notes[i].midi - notes[i - 1].midi) % 12, 6, `tritono en ${d.score}`);
        }
        notes.forEach(n => assert.ok(!((n.letter === 'E' || n.letter === 'B') && n.acc > 0), `Mi♯/Si♯ en ${d.score}`));
      }
    }
  }
});

test('intervalOk: justos, mayores y menores sí; tritono y aumentados no', () => {
  const n = parseNote;
  assert.ok(intervalOk(n('C4'), n('G4')));
  assert.ok(intervalOk(n('F#4'), n('D5')), 'sexta menor');
  assert.ok(!intervalOk(n('F4'), n('B4')), 'cuarta aumentada');
  assert.ok(!intervalOk(n('Bb4'), n('C#5')), 'segunda aumentada');
  assert.ok(!intervalOk(n('C#5'), n('F5')), 'cuarta disminuida');
  assert.ok(!intervalOk(n('F4'), n('F#4')) && intervalOk(n('F4'), n('F#4'), true), 'semitono cromático solo si se admite');
});

test('la frase: el consecuente repite el ritmo del compás 1 y la semicadencia acaba en nota larga', () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    const meter = metersFor(level, false).includes('4/4') ? '4/4' : metersFor(level, false)[0];
    for (const bars of barsFor(level, meter).filter(b => b >= 4)) {
      for (let seed = 1; seed <= 20; seed++) {
        const d = melodicDictation(violin, { level, meter, bars, seed });
        const rh = barRhythms(d);
        assert.equal(rh[bars / 2], rh[0], `el consecuente empieza con el motivo: ${d.score}`);
        rh.forEach(r => assert.ok(rh.filter(x => x === r).length <= Math.max(2, bars / 2), `variedad de compases: ${d.score}`));
        rh.forEach((r, i) => assert.ok(i < 2 || !(r === rh[i - 1] && r === rh[i - 2]), `tres compases iguales seguidos: ${d.score}`));
        const semi = d.notes.filter(x => x.bar === bars / 2 - 1 && !x.rest).pop();
        assert.ok(semi.beats >= 1.5, `semicadencia larga: ${d.score}`);
        const deg = ((semi.midi - d.tonicMidi) % 12 + 12) % 12;
        assert.ok([2, 7].includes(deg), `semicadencia en el 2.º o el 5.º grado (${deg}): ${d.score}`);
      }
    }
  }
});

test('cadencia final: llega a la tónica por grado, desde la sensible o desde la dominante (5→1 desde el nivel 7)', () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (let seed = 1; seed <= 30; seed++) {
      const notes = sounding(melodicDictation(violin, { level, meter: '4/4', bars: 4, seed }));
      const gap = notes[notes.length - 2].midi - notes[notes.length - 1].midi;
      const ok = [1, 2, -1, -2].includes(gap) || (level >= 7 && [7, -5].includes(gap));
      if (level === 9) assert.equal(gap, -1, `nivel 9: la sensible sube a la tónica al final (${gap})`);
      assert.ok(ok, `nivel ${level}, semilla ${seed}: final de ${gap} semitonos`);
    }
  }
});

const sample = (level, meter = '4/4', bars = 4, n = 40, inst = violin) => Array.from({ length: n }, (_, s) => melodicDictation(inst, { level, meter, bars, seed: s + 1 }));
const values = ds => new Set(ds.flatMap(d => d.notes.map(n => (n.rest ? 'R' : '') + n.beats)));

test('una novedad por nivel: figuras, silencios, saltos y compases en su sitio', () => {
  const l1 = sample(1);
  l1.forEach(d => assert.ok(new Set(sounding(d).map(n => n.midi)).size <= 3));
  assert.ok(!values(l1).has('R1'), 'sin silencios en el nivel 1');
  assert.ok(values(sample(2)).has('R1'), 'silencio de negra en el nivel 2');
  assert.ok(!values(sample(4)).has('0.5'), 'sin corcheas en el nivel 4');
  assert.ok(values(sample(5)).has('0.5'), 'corcheas en el nivel 5');
  assert.ok(!values(sample(5)).has('1.5') && values(sample(6)).has('1.5'), 'negra con puntillo en el nivel 6');
  assert.ok(!values(sample(9)).has('0.25') && values(sample(10)).has('0.25'), 'semicorcheas en el nivel 10');
  const leaps = (ds, semis) => ds.some(d => { const n = sounding(d); return n.some((x, i) => i && Math.abs(x.midi - n[i - 1].midi) === semis); });
  assert.ok(!leaps(sample(3), 3) && !leaps(sample(3), 4), 'el nivel 3 va por grado conjunto');
  assert.ok(leaps(sample(4), 3) || leaps(sample(4), 4), 'terceras en el nivel 4');
  assert.ok(!leaps(sample(6), 5) && leaps(sample(7), 5), 'cuartas desde el nivel 7');
  assert.ok(sample(6).every(d => sounding(d).every(n => n.midi >= d.tonicMidi)), 'hasta el 6, nada por debajo de la tónica');
  assert.deepEqual(metersFor(5, false), ['2/4', '4/4']);
  assert.ok(metersFor(6, false).includes('3/4') && !metersFor(7, false).includes('6/8') && metersFor(8, false).includes('6/8'));
});

test('6/8: con silencios, cada parte de negra con puntillo se respeta y va a negra con puntillo 60-66', () => {
  const ds = sample(8, '6/8');
  assert.ok(ds.some(d => d.notes.some(n => n.rest)), 'hay silencios');
  ds.forEach(d => {
    assert.equal(d.barBeats, 3);
    const dottedQuarter = d.bpm / 1.5;
    assert.ok(dottedQuarter >= 60 && dottedQuarter <= 66, `tempo ${dottedQuarter}`);
    d.notes.forEach(n => { const at = n.start % 3; if (n.beats < 3 - EPS) assert.ok(at + n.beats <= 1.5 + EPS || at >= 1.5 - EPS, d.score); });
  });
});

test('tempos: niveles 7-10 a negra 60-72', () => {
  for (let level = 7; level <= LEVEL_COUNT; level++) {
    const bpm = MELODIC_LEVELS[level - 1].bpm;
    assert.ok(bpm >= 60 && bpm <= 72, `nivel ${level}: ${bpm}`);
  }
});

test('menor armónica (nivel 9): siempre en menor, con la sensible elevada y sin el 7.º natural', () => {
  sample(9).forEach(d => {
    assert.ok(d.minor);
    const rel = sounding(d).map(n => ((n.midi - d.tonicMidi) % 12 + 12) % 12);
    assert.ok(!rel.includes(10), `7.º natural en ${d.score}`);
  });
  assert.ok(sample(9).some(d => sounding(d).some(n => ((n.midi - d.tonicMidi) % 12 + 12) % 12 === 11)), 'aparece la sensible');
});

test('alteraciones (nivel 10): habituales, como mucho una cada dos compases, y semicorcheas por grado conjunto', () => {
  const ds = sample(10, '4/4', 4, 80);
  const accidentals = d => {
    const sig = { D: { F: 1, C: 1 }, A: { F: 1, C: 1, G: 1 }, G: { F: 1 } }[d.key];
    return sig ? sounding(d).filter(n => n.acc !== (sig[n.letter] || 0)) : [];
  };
  assert.ok(ds.some(d => !d.minor && accidentals(d).length), 'hay alteraciones accidentales');
  ds.filter(d => !d.minor).forEach(d => assert.ok(accidentals(d).length <= 2, `demasiadas alteraciones: ${d.score}`));
  ds.forEach(d => {
    const n = sounding(d);
    for (let i = 1; i < n.length; i++) {
      if (n[i].beats <= 0.25 || n[i - 1].beats <= 0.25) assert.ok(Math.abs(n[i].midi - n[i - 1].midi) <= 2 && n[i].midi !== n[i - 1].midi, `semicorcheas por grado: ${d.score}`);
    }
  });
});

test('ocho compases solo hasta el nivel 5', () => {
  assert.deepEqual(barsFor(5), [2, 4, 8]);
  assert.deepEqual(barsFor(6), [2, 4]);
  assert.deepEqual(barsFor(5, '2/4'), [4, 8], 'en 2/4 no hay dos compases');
  assert.deepEqual(barsFor(3, '4/4'), [4, 8], '«La escala» necesita al menos cuatro compases');
  assert.deepEqual(barsFor(3, '2/4'), [8]);
  assert.equal(melodicDictation(violin, { level: 8, meter: '4/4', bars: 8, seed: 1 }).bars, 4);
});

test('situarse: acorde de tónica, cadencia I-IV-V7-I y claqueta según el compás', () => {
  const trumpet = instrumentById('trumpet');
  const d = makeDictation(trumpet, { level: 2, meter: '2/4', bars: 2, seed: 9 });
  assert.equal(d.key, 'C');
  assert.deepEqual(tonicTriad(d), [d.tonicMidi, d.tonicMidi + 4, d.tonicMidi + 7]);
  assert.deepEqual(countInPlan(d), { clicks: 4, bpm: d.bpm, accents: [0, 2] }, '2/4: dos compases');
  const m = makeDictation(violin, { level: 9, meter: '6/8', bars: 2, seed: 3 });
  assert.ok(m.cadence);
  assert.equal(cadenceChords(m).length, 4);
  assert.deepEqual(cadenceChords(m)[2], [m.tonicMidi - 1, m.tonicMidi + 2, m.tonicMidi + 5, m.tonicMidi + 7], 'V7 con la sensible');
  assert.deepEqual(countInPlan(m), { clicks: 6, bpm: m.bpm * 2, accents: [0, 3] }, '6/8: acentos en 1 y 4');
});

test('percusión: dictados rítmicos con lo aprendido sin desaparecer', () => {
  for (let level = 1; level <= LEVEL_COUNT; level++) {
    for (const meter of metersFor(level, true)) {
      const d = rhythmDictation({ level, meter, bars: 4, seed: level * 31 });
      assert.equal(parseScore(d.score).bars.length, 4);
      sounding(d).forEach(n => assert.equal(n.midi, 72));
    }
  }
  assert.equal(RHYTHM_LEVELS.length, LEVEL_COUNT);
  RHYTHM_LEVELS.slice(1).forEach(cfg => assert.ok(cfg.simple.includes('w') && cfg.simple.includes('rq'), `${cfg.name}: redonda y silencio de negra`));
  RHYTHM_LEVELS.slice(4).forEach(cfg => assert.ok(cfg.simple.includes('dh'), `${cfg.name}: blanca con puntillo`));
  assert.ok(RHYTHM_LEVELS[3].simple.includes('sync'), 'la síncopa justo después de las corcheas');
});

test('la rejilla de cuantización es como mínimo la corchea', () => {
  assert.equal(quantumFor(1, false, '4/4'), 0.5);
  assert.equal(quantumFor(5, false, '4/4'), 0.5);
  assert.equal(quantumFor(10, false, '4/4'), 0.25);
  assert.equal(quantumFor(8, true, '4/4'), 0.25);
});

test('cuantización: corrige un retraso pequeño del micrófono (sin dictado, por la rejilla)', () => {
  const late = [0, 1, 2, 2.5, 3].map(b => ({ beat: b + 0.06, midi: 60 }));
  assert.ok(Math.abs(fitTiming(late, { quantum: 0.5 }).shift - 0.06) < 0.02);
  const q = quantizeBest(late, { quantum: 0.5, totalBeats: 4 });
  assert.deepEqual(q.map(e => e.start), [0, 1, 2, 2.5, 3]);
  assert.deepEqual(q.map(e => e.beats), [1, 1, 0.5, 0.5, 1]);
  assert.deepEqual(quantize([{ beat: -2, midi: 60 }, { beat: 0.1, midi: 60 }, { beat: 0.12, midi: 62 }], { quantum: 0.5, totalBeats: 4 }).map(e => e.start), [0, 0.25], 'dos ataques pegados: el segundo, a la semicorchea (no se borra)');
  assert.deepEqual(quantizeBest([], { quantum: 0.5, totalBeats: 4 }), []);
});

test('dos corcheas tocadas en un nivel de negras no desaparecen', () => {
  const q = quantizeBest([{ beat: 0, midi: 60 }, { beat: 0.5, midi: 62 }, { beat: 1, midi: 64 }], { quantum: quantumFor(1, false, '4/4'), totalBeats: 4 });
  assert.equal(q.length, 3);
  assert.deepEqual(q.map(e => e.start), [0, 0.5, 1]);
});

test('todo transpuesto pero a tiempo: cada nota mal en su sitio, sin faltas ni notas de más', () => {
  const d = melodicDictation(violin, { level: 3, meter: '4/4', bars: 2, seed: 5 });
  const exp = expectedOf(d);
  const raw = exp.map(e => ({ beat: e.start + 0.1, endBeat: e.start + e.beats * 0.9, midi: e.midi + 5 }));
  const result = scoreDictation(exp, quantizeBest(raw, { quantum: d.quantum, totalBeats: d.totalBeats, expected: exp, bpm: d.bpm }), { barBeats: d.barBeats });
  assert.equal(result.transposed, 5, 'avisa de que parece transportado');
  assert.ok(result.pairs.every(x => x.e !== null && x.p !== null), JSON.stringify(result.pairs));
  assert.equal(result.rhythmPct, 100);
  assert.equal(result.pitchPct, 0);
  assert.ok(result.pairs.every(x => x.state === 'bad'));
});

test('crédito de altura: exacta 100, otra octava 70, otra alteración 60, nota vecina 30, resto 0', () => {
  const c = parseNote('C5');
  const fs = parseNote('F#4');
  assert.equal(pitchKind(c, 72), 'exact');
  assert.equal(pitchKind(c, 84), 'octave');
  assert.equal(pitchKind(c, 73), 'accidental', 'Do → Do♯');
  assert.equal(pitchKind(fs, 65), 'accidental', 'Fa♯ → Fa');
  assert.equal(pitchKind(c, 71), 'step', 'Do → Si: nota vecina');
  assert.equal(pitchKind(c, 74), 'step');
  assert.equal(pitchKind(c, 77), 'wrong');
});

test('ritmo: figura y sitio en el compás; solo una de las dos, 30', () => {
  const e = { start: 1, ioi: 1, last: false };
  assert.equal(rhythmCredit(e, { start: 1, ioi: 1 }, 4), 100);
  assert.equal(rhythmCredit(e, { start: 1, ioi: 0.5 }, 4), 30);
  assert.equal(rhythmCredit(e, { start: 1.5, ioi: 1 }, 4), 30);
  assert.equal(rhythmCredit(e, { start: 1.5, ioi: 0.5 }, 4), 0);
});

const expectedOf = d => d.notes.filter(n => !n.rest).map(n => ({ midi: n.midi, start: n.start, beats: n.beats, letter: n.letter, acc: n.acc }));
const ev = rows => rows.map(([midi, start, beats]) => ({ midi, start, beats }));

test('el ritmo cuenta: alturas bien pero todo en negras no aprueba; percusión todo en corcheas tampoco', () => {
  const d = melodicDictation(violin, { level: 6, meter: '4/4', bars: 4, seed: 11 });
  const exp = expectedOf(d);
  const quarters = exp.map((e, i) => ({ midi: e.midi, start: i, beats: 1 }));
  const r = scoreDictation(exp, quarters, { barBeats: d.barBeats });
  assert.equal(r.pitchPct, 100);
  assert.ok(r.score < 80, `todo en negras: ${r.score}`);
  const p = rhythmDictation({ level: 3, meter: '4/4', bars: 4, seed: 5 });
  const pe = expectedOf(p);
  const eighths = pe.map((e, i) => ({ midi: 72, start: i * 0.5, beats: 0.5 }));
  assert.ok(scoreDictation(pe, eighths, { rhythmOnly: true, barBeats: 4 }).score < 60);
});

test('todo una octava abajo no resta; en el xilófono cualquier octava vale', () => {
  const notes = ev([[62, 0, 1], [64, 1, 1], [62, 2, 2]]);
  const low = notes.map(n => ({ ...n, midi: n.midi - 12 }));
  const r = scoreDictation(notes, low, { barBeats: 4 });
  assert.equal(r.score, 100);
  assert.equal(r.octaveShift, -12);
  const mixed = [notes[0], { ...notes[1], midi: 76 }, notes[2]];
  assert.ok(scoreDictation(notes, mixed, { barBeats: 4 }).pitchPct < 100, 'una nota suelta en otra octava sí resta');
  const xylo = instrumentById('xylophone');
  assert.equal(scoreDictation(notes, mixed, { barBeats: 4, fold: (m, t) => foldOctave(m, t, xylo) }).score, 100);
});

test('alineación: una nota olvidada y una de más quedan señaladas sin desplazar las demás', () => {
  const expected = ev([[60, 0, 1], [65, 1, 1], [69, 2, 1], [72, 3, 1], [76, 4, 4]]);
  const played = ev([[60, 0, 1], [69, 2, 1], [72, 3, 0.5], [74, 3.5, 0.5], [76, 4, 4]]);
  const pairs = alignNotes(expected, played, { barBeats: 4 });
  assert.deepEqual(pairs.map(p => [p.e, p.p]), [[0, 0], [1, null], [2, 1], [3, 2], [null, 3], [4, 4]]);
  assert.equal(pairs[1].kind, 'missing');
  assert.equal(pairs[4].kind, 'extra');
  assert.equal(pairs[2].state, 'ok');
});

test('puntuación: todo bien 100 y 3 estrellas; la escucha extra resta 5; sin tocar nada, 0', () => {
  const notes = ev([[62, 0, 1], [64, 1, 1], [62, 2, 2]]);
  const perfect = scoreDictation(notes, notes, { barBeats: 4 });
  assert.equal(perfect.score, 100);
  assert.equal(perfect.stars, 3);
  assert.equal(scoreDictation(notes, notes, { barBeats: 4, extraListens: 1 }).score, 95);
  const nothing = scoreDictation(notes, [], { barBeats: 4 });
  assert.equal(nothing.score, 0);
  assert.equal(nothing.pairs.length, 3);
});

// Toca «perfecto» (con el retraso del micrófono, algo de imprecisión y notas un poco más cortas) y debe sacar ≥90
// (lag: el resto de retraso tras descontar la latencia al captar)
function perfectRaw(d, r, lag = 0.05) {
  return expectedOf(d).map(e => {
    const jitter = (r() - 0.5) * 0.08;
    return { beat: e.start + lag + jitter, endBeat: d.rhythmOnly ? null : e.start + lag + e.beats * 0.85, midi: e.midi };
  });
}

test('tocar perfecto da al menos un 90 % en todos los niveles, compases e instrumentos', () => {
  const r = rng(77);
  for (const inst of [...pitched, instrumentById('percussion'), instrumentById('cajon')]) {
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      for (const meter of metersFor(level, !!inst.rhythmOnly)) {
        for (const bars of barsFor(level, meter, !!inst.rhythmOnly)) {
          const d = makeDictation(inst, { level, meter, bars, seed: level * 101 + bars });
          const played = quantizeBest(perfectRaw(d, r), { quantum: d.quantum, totalBeats: d.totalBeats, expected: expectedOf(d), bpm: d.bpm });
          const res = scoreDictation(expectedOf(d), played, { rhythmOnly: d.rhythmOnly, barBeats: d.barBeats, fold: (m, t) => foldOctave(m, t, inst) });
          assert.ok(res.score >= 90, `${inst.id} nivel ${level} ${meter} ${bars}: ${res.score} · ${d.score}`);
        }
      }
    }
  }
});

test('withIoi: la última nota usa su propia duración', () => {
  assert.deepEqual(withIoi(ev([[60, 0, 1], [62, 2, 2]])).map(e => [e.ioi, e.last]), [[2, false], [2, true]]);
});

test('splitDuration trocea en figuras escribibles sin cruzar la barra', () => {
  assert.deepEqual(splitDuration(0, 4, 4), [4]);
  assert.deepEqual(splitDuration(3, 2, 4), [1, 1]);
  assert.deepEqual(splitDuration(1, 2.5, 4), [2, 0.5]);
  assert.deepEqual(splitDuration(1, 3, 4, { rest: true }), [1, 2], 'el silencio de blanca, en parte fuerte');
});

test('la partitura de lo tocado liga las notas que cruzan la barra y escribe los silencios', () => {
  const s = eventsToScore([{ start: 0, beats: 3, midi: 62 }, { start: 3, beats: 2, midi: 64 }], { barBeats: 4, totalBeats: 8, nameOf: e => (e.midi === 62 ? 'D4' : 'E4') });
  assert.equal(s.text, '| D4h. E4q~ | E4q Rq Rh |');
  const q = quantize([{ beat: 0, endBeat: 0.9, midi: 60 }, { beat: 1, endBeat: 1.45, midi: 62 }, { beat: 3, endBeat: 4, midi: 60 }], { quantum: 0.5, totalBeats: 4 });
  assert.equal(eventsToScore(q, { barBeats: 4, totalBeats: 4, nameOf: e => (e.midi === 60 ? 'C4' : 'D4') }).text, '| C4q D4e Re Rq C4q |');
});

test('ortografía de lo tocado: la del dictado si la nota sale en él', () => {
  const sp = spellingsOf(parseScore('| Gb4q F#4q |').notes);
  assert.equal(spellPlayed(78, sp, false), 'F#5');
  assert.equal(spellPlayed(61, {}, true), 'Db4');
});

test('récord y nivel recomendado por instrumento: el siguiente al más alto superado con el 80 %', () => {
  assert.equal(bestKey(3, false, 'violin'), 'violin:m3');
  assert.equal(recommendedLevel({}, false, 'violin'), 1);
  assert.equal(recommendedLevel({ 'violin:m1': 85, 'violin:m4': 90, 'violin:m5': 60 }, false, 'violin'), 5);
  assert.equal(recommendedLevel({ 'violin:m4': 90 }, false, 'trumpet'), 1, 'cada instrumento con lo suyo');
  assert.equal(recommendedLevel({ 'percussion:r3': 100 }, false, 'percussion'), 1, 'los rítmicos van aparte');
  assert.equal(recommendedLevel({ 'violin:m10': 100 }, false, 'violin'), 10);
  assert.equal(recommendedLevel({ 'violin:m1': 90, 'violin:m2': 85 }, false, 'violin', { 'violin:m1': 1 }), 2, 'cuenta lo superado (80 en todo), no solo la nota');
});

// ---------- Ronda 3: novedad garantizada, tempo y precisión humana, exigencia de la nota ----------
const novelCheck = {
  2: d => d.notes.some(n => n.rest),
  3: d => new Set(sounding(d).map(n => n.midi)).size >= 6,
  4: d => sounding(d).some((n, i, a) => i && Math.abs(n.midi - a[i - 1].midi) >= 3),
  5: d => d.notes.some(n => n.beats === 0.5),
  6: d => d.notes.some(n => n.beats === 1.5 || n.beats === 3),
  7: d => sounding(d).some((n, i, a) => (i && Math.abs(n.midi - a[i - 1].midi) === 5) || n.midi < d.tonicMidi),
  8: d => d.meter !== '6/8' || d.notes.some(n => n.rest),
  9: d => d.minor && sounding(d).some((n, i, a) => i && ((a[i - 1].midi - d.tonicMidi) % 12 + 12) % 12 === 11 && ((n.midi - d.tonicMidi) % 12 + 12) % 12 === 0),
  10: d => d.notes.some(n => n.beats === 0.25),
};

test('la novedad de cada nivel está siempre, en todos los compases y longitudes, y no está en el nivel anterior', () => {
  for (let level = 2; level <= LEVEL_COUNT; level++) {
    for (const meter of metersFor(level, false)) {
      for (const bars of barsFor(level, meter)) {
        for (let seed = 1; seed <= 40; seed++) {
          const d = melodicDictation(violin, { level, meter, bars, seed: seed * 977 + 3 });
          assert.ok(novelCheck[level](d), `nivel ${level} ${meter} ${bars}c sin su novedad: ${d.score}`);
        }
      }
    }
    if (level === 8) continue; // la novedad del 8 es el propio 6/8, que el 7 no tiene
    const prevMeter = metersFor(level - 1, false).includes('4/4') ? '4/4' : metersFor(level - 1, false)[0];
    const prev = Array.from({ length: 40 }, (_, s) => melodicDictation(violin, { level: level - 1, meter: prevMeter, bars: 4, seed: s + 1 }));
    assert.ok(prev.every(d => !novelCheck[level](d)), `el nivel ${level - 1} ya tiene la novedad del ${level}`);
  }
});

test('percusión: la célula nueva de cada nivel suena en todas las longitudes', () => {
  RHYTHM_LEVELS.forEach((cfg, k) => {
    const level = k + 1;
    cfg.meters.forEach(meter => {
      const novel = novelCells(cfg, meter);
      if (!novel.length) return;
      barsFor(level, meter, true).forEach(bars => {
        for (let seed = 1; seed <= 25; seed++) {
          const d = rhythmDictation({ level, meter, bars, seed });
          const values = d.notes.map(n => (n.rest ? -n.beats : n.beats));
          const has = { rq: values.includes(-1), ee: values.includes(0.5), sync: values.includes(0.5), dh: values.includes(3), dq: values.includes(1.5),
            re: values.includes(-0.5), ssss: values.includes(0.25), ess: values.includes(0.25), sse: values.includes(0.25), esse: values.includes(0.25),
            ssee: values.includes(0.25), de: values.includes(0.75), ses: values.includes(0.25), dese: values.includes(0.75) };
          assert.ok(novel.some(c => has[c]), `R${level} ${meter} ${bars}c: ${d.score}`);
        }
      });
    });
  });
});

test('en menor armónica la sensible sube siempre a la tónica; ni 7.ª ni tritono en dos saltos seguidos', () => {
  for (const level of [9, 10]) {
    for (let seed = 1; seed <= 60; seed++) {
      const d = melodicDictation(violin, { level, meter: '4/4', bars: 4, seed });
      const n = sounding(d);
      if (d.minor) n.forEach((x, i) => {
        if (i < n.length - 1 && ((x.midi - d.tonicMidi) % 12 + 12) % 12 === 11) assert.equal(n[i + 1].midi, x.midi + 1, `sensible sin resolver: ${d.score}`);
      });
      for (let i = 2; i < n.length; i++) {
        const a = n[i - 1].midi - n[i - 2].midi, b = n[i].midi - n[i - 1].midi;
        if (Math.abs(a) >= 3 && Math.abs(b) >= 3 && Math.sign(a) === Math.sign(b)) assert.ok(![6, 10, 11].includes(Math.abs(a + b)) && Math.abs(a + b) <= 12, d.score);
      }
    }
  }
});

// Interpretación sintética: tempo del alumno, desajuste humano (gaussiano) y notas algo más cortas
function performed(d, r, { tempo = 1, jitterMs = 0, lag = 0.05 } = {}) {
  const spb = 60 / d.bpm;
  const gauss = () => { let x = 0; for (let i = 0; i < 6; i++) x += r(); return (x - 3) / Math.sqrt(0.5); };
  return expectedOf(d).map(e => {
    const b = e.start * tempo + lag + gauss() * jitterMs / 1000 / spb;
    return { beat: b, endBeat: d.rhythmOnly ? null : b + e.beats * tempo * 0.85, midi: e.midi };
  });
}
const gradeOf = (d, raw, inst) => scoreDictation(expectedOf(d), quantizeBest(raw, { quantum: d.quantum, totalBeats: d.totalBeats, expected: expectedOf(d), bpm: d.bpm }),
  { rhythmOnly: d.rhythmOnly, barBeats: d.barBeats, fold: (m, t) => foldOctave(m, t, inst) });

test('tocar bien a otro tempo (±6 %) o con el desajuste humano de 50 ms sigue dando 90 o más', () => {
  const r = rng(2024);
  for (const inst of [violin, instrumentById('tuba'), instrumentById('percussion')]) {
    const scores = { fast: [], slow: [], jitter: [] };
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      for (const meter of metersFor(level, !!inst.rhythmOnly)) {
        for (let seed = 1; seed <= 4; seed++) {
          const d = makeDictation(inst, { level, meter, bars: 4, seed: seed * 31 + level });
          scores.fast.push(gradeOf(d, performed(d, r, { tempo: 1.06 }), inst).score);
          scores.slow.push(gradeOf(d, performed(d, r, { tempo: 0.94 }), inst).score);
          scores.jitter.push(gradeOf(d, performed(d, r, { jitterMs: 50 }), inst).score);
        }
      }
    }
    assert.ok(scores.fast.every(x => x >= 90) && scores.slow.every(x => x >= 90), `${inst.id}: tempo ${Math.min(...scores.fast, ...scores.slow)}`);
    const avg = scores.jitter.reduce((a, b) => a + b, 0) / scores.jitter.length;
    const share = scores.jitter.filter(x => x >= 90).length / scores.jitter.length;
    assert.ok(avg >= 97 && share >= 0.9, `${inst.id}: desajuste 50 ms, media ${avg.toFixed(1)}, ${Math.round(share * 100)} % con 90 o más`);
  }
});

test('la nota exige: una de cuatro mal no da ★★★ ni aprueba; notas al azar a tiempo, sin estrellas; entrar medio pulso tarde resta', () => {
  const four = ev([[62, 0, 1], [64, 1, 1], [66, 2, 1], [62, 3, 1]]);
  const oneWrong = scoreDictation(four, [four[0], { ...four[1], midi: 69 }, four[2], four[3]], { barBeats: 4 });
  assert.ok(oneWrong.stars < 3 && !oneWrong.passed, JSON.stringify({ s: oneWrong.score, st: oneWrong.stars }));
  const d = melodicDictation(violin, { level: 6, meter: '4/4', bars: 4, seed: 8 });
  const randomPitches = expectedOf(d).map((e, i) => ({ ...e, midi: e.midi + [5, -4, 7, -5, 3][i % 5] }));
  assert.equal(scoreDictation(expectedOf(d), randomPitches, { barBeats: 4 }).stars, 0);
  const r = rng(9);
  const late = gradeOf(d, performed(d, r, { lag: 0.5 }), violin);
  assert.ok(late.score < 90, `entrar medio pulso tarde: ${late.score}`);
  assert.deepEqual([dictationStars(59), dictationStars(60), dictationStars(75), dictationStars(92), dictationStars(92, 85)], [0, 1, 2, 3, 2]);
});

// ---------- Ronda 4: notas de más, simetría, 6/8 y estrellas ----------
test('una nota o un golpe de más nunca desaparece: siempre resta', () => {
  for (const inst of [violin, instrumentById('percussion')]) {
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      for (const meter of metersFor(level, !!inst.rhythmOnly)) {
        const d = makeDictation(inst, { level, meter, bars: 4, seed: level * 13 + 1 });
        const exp = expectedOf(d);
        const k = Math.floor(exp.length / 2);
        const gap = 0.15 * d.bpm / 60;
        const raw = exp.flatMap((e, i) => {
          const hit = { beat: e.start, endBeat: d.rhythmOnly ? null : e.start + e.beats * 0.8, midi: e.midi };
          return i === k ? [{ beat: e.start - gap, endBeat: d.rhythmOnly ? null : e.start - 0.02, midi: e.midi + 3 }, hit] : [hit];
        });
        const played = quantizeBest(raw, { quantum: d.quantum, totalBeats: d.totalBeats, expected: exp, bpm: d.bpm });
        assert.equal(played.length, exp.length + 1, `${inst.id} nivel ${level} ${meter}: se conserva la nota de más`);
        const r = scoreDictation(exp, played, { rhythmOnly: d.rhythmOnly, barBeats: d.barBeats });
        assert.ok(r.score < 100 && r.extra >= 1, `${inst.id} nivel ${level} ${meter}: ${r.score}`);
      }
    }
  }
});

test('adelantarse o retrasarse lo mismo (±0,3 pulsos) se trata igual', () => {
  for (const level of [2, 5]) {
    for (let seed = 1; seed <= 20; seed++) {
      const d = melodicDictation(violin, { level, meter: '4/4', bars: 4, seed });
      const exp = expectedOf(d);
      const k = Math.floor(exp.length / 2);
      const grade = off => scoreDictation(exp, quantizeBest(exp.map((e, i) => ({ beat: e.start + (i === k ? off : 0), endBeat: e.start + (i === k ? off : 0) + e.beats * 0.85, midi: e.midi })),
        { quantum: d.quantum, totalBeats: d.totalBeats, expected: exp, bpm: d.bpm }), { barBeats: 4 });
      const early = grade(-0.3), late = grade(0.3);
      assert.ok(early.rhythmPct < 100 && late.rhythmPct < 100, `nivel ${level}: ${early.rhythmPct} / ${late.rhythmPct}`);
    }
  }
});

test('los niveles «Compás de 6/8» solo se ofrecen en 6/8 y la percusión con semicorcheas también las tiene en 6/8', () => {
  assert.deepEqual(metersFor(8, false), ['6/8']);
  assert.deepEqual(metersFor(7, true), ['6/8']);
  assert.ok(novelCells(levelConfig(8, true), '6/8').length > 0, 'semicorcheas en 6/8 en el nivel 8');
  assert.ok(novelCells(levelConfig(9, true), '6/8').length > 0);
  for (let seed = 1; seed <= 30; seed++) assert.ok(rhythmDictation({ level: 8, meter: '6/8', bars: 4, seed }).notes.some(n => n.beats === 0.25));
});

test('estrellas: una sola regla; sin estrellas si la altura o el ritmo no llegan a 50', () => {
  assert.equal(dictationStars(60, 19), 0, 'altura 100 y ritmo 19 no da estrella');
  assert.equal(dictationStars(65, 55), 1);
});

// ---------- Ronda 5: rejilla del nivel, imprecisión humana con otro tempo ----------
test('niveles 1-7: una nota desviada 170-200 ms se escribe en la rejilla del nivel (sin semicorcheas) y apenas resta', () => {
  for (const inst of [violin, instrumentById('percussion')]) {
    for (const ms of [-200, -170, 170, 200]) {
      let sum = 0, n = 0;
      for (let level = 1; level <= 7; level++) {
        for (const meter of metersFor(level, !!inst.rhythmOnly)) {
          for (let seed = 1; seed <= 6; seed++) {
            const d = makeDictation(inst, { level, meter, bars: 4, seed: seed * 7 + level });
            const off = ms / 1000 * d.bpm / 60;
            // la regla: si hay hueco de la rejilla del nivel a menos de medio cuanto, se usa
            if (d.quantum < 0.5 || Math.abs(off) >= d.quantum / 2) continue;
            const exp = expectedOf(d);
            const k = Math.floor(exp.length / 2);
            const raw = exp.map((e, i) => ({ beat: e.start + (i === k ? off : 0), endBeat: d.rhythmOnly ? null : e.start + (i === k ? off : 0) + e.beats * 0.85, midi: e.midi }));
            const played = quantizeBest(raw, { quantum: d.quantum, totalBeats: d.totalBeats, expected: exp, bpm: d.bpm });
            played.forEach(p => assert.ok(Math.abs(p.start * 2 - Math.round(p.start * 2)) < 1e-6, `${inst.id} nivel ${level}: figura ajena al nivel en ${p.start}`));
            sum += scoreDictation(exp, played, { rhythmOnly: d.rhythmOnly, barBeats: d.barBeats }).score;
            n++;
          }
        }
      }
      assert.ok(sum / n >= 95, `${inst.id} ${ms} ms: media ${(sum / n).toFixed(1)}`);
    }
  }
});

test('imprecisión humana de 50 y 60 ms, también a otro tempo (±6 %): 90 o más en al menos el 90 % de las tomas', () => {
  for (const inst of [violin, instrumentById('percussion')]) {
    for (const jitterMs of [50, 60]) {
      for (const tempo of [1, 1.06, 0.94]) {
        const r = rng(jitterMs * 100 + Math.round(tempo * 100));
        const scores = [];
        for (let level = 1; level <= LEVEL_COUNT; level++) {
          for (const meter of metersFor(level, !!inst.rhythmOnly)) {
            for (let seed = 1; seed <= 10; seed++) {
              const d = makeDictation(inst, { level, meter, bars: 4, seed: seed * 31 + level });
              scores.push(gradeOf(d, performed(d, r, { tempo, jitterMs, lag: 0 }), inst).score);
            }
          }
        }
        const share = scores.filter(x => x >= 90).length / scores.length;
        assert.ok(share >= 0.9, `${inst.id} σ ${jitterMs} ms, tempo ${tempo}: ${Math.round(share * 100)} % con 90 o más`);
      }
    }
  }
});

test('al final de un dictado largo, una nota un cuanto antes o después se nota (la ventana tiene tope)', () => {
  for (const inst of [violin, instrumentById('percussion')]) {
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      for (const meter of metersFor(level, !!inst.rhythmOnly)) {
        for (const bars of barsFor(level, meter, !!inst.rhythmOnly).filter(b => b >= 4)) {
          for (const dir of [-1, 1]) {
            const d = makeDictation(inst, { level, meter, bars, seed: level * 7 + bars });
            const exp = expectedOf(d);
            const k = exp.length - 1; // la nota del último compás
            const off = dir * d.quantum;
            if (dir < 0 && exp[k].start + off <= exp[k - 1].start + 1e-6) continue;
            const raw = exp.map((e, i) => ({ beat: e.start + (i === k ? off : 0), endBeat: d.rhythmOnly ? null : e.start + (i === k ? off : 0) + e.beats * 0.85, midi: e.midi }));
            const r = gradeOf(d, raw, inst);
            assert.ok(r.rhythmPct < 100, `${inst.id} nivel ${level} ${meter} ${bars}c, ${off > 0 ? 'tarde' : 'antes'}: ritmo ${r.rhythmPct}`);
          }
        }
      }
    }
  }
});

// ---------- Ronda 7: entrar tarde con semicorcheas, dos compases ----------
test('niveles 8-10: la primera nota una semicorchea tarde (el resto a tiempo) resta', () => {
  for (const inst of [violin, instrumentById('percussion')]) {
    for (let level = 8; level <= LEVEL_COUNT; level++) {
      for (const meter of metersFor(level, !!inst.rhythmOnly)) {
        for (let seed = 1; seed <= 8; seed++) {
          const d = makeDictation(inst, { level, meter, bars: 4, seed: seed * 11 + level });
          if (d.quantum > 0.25) continue;
          const exp = expectedOf(d);
          if (exp[1].start - exp[0].start <= d.quantum + 1e-6) continue;
          const raw = exp.map((e, i) => { const b = e.start + (i === 0 ? d.quantum : 0); return { beat: b, endBeat: d.rhythmOnly ? null : b + e.beats * 0.85, midi: e.midi }; });
          assert.ok(gradeOf(d, raw, inst).rhythmPct < 100, `${inst.id} nivel ${level} ${meter}: ${d.score}`);
        }
      }
    }
  }
});

test('nivel 10 en 6/8: toda la toma una semicorchea tarde resta', () => {
  for (const inst of [violin, instrumentById('percussion')]) {
    for (let seed = 1; seed <= 20; seed++) {
      const d = makeDictation(inst, { level: 10, meter: '6/8', bars: 4, seed });
      const raw = expectedOf(d).map(e => { const b = e.start + d.quantum; return { beat: b, endBeat: d.rhythmOnly ? null : b + e.beats * 0.85, midi: e.midi }; });
      assert.ok(gradeOf(d, raw, inst).rhythmPct < 100, `${inst.id}: ${d.score}`);
    }
  }
});

test('dos compases: la última nota una corchea antes o después resta (el tempo no se la traga)', () => {
  for (const inst of [violin, instrumentById('percussion')]) {
    for (let level = 1; level <= LEVEL_COUNT; level++) {
      for (const meter of metersFor(level, !!inst.rhythmOnly)) {
        if (!barsFor(level, meter, !!inst.rhythmOnly).includes(2)) continue;
        for (let seed = 1; seed <= 6; seed++) {
          for (const dir of [-1, 1]) {
            const d = makeDictation(inst, { level, meter, bars: 2, seed: seed * 13 + level });
            const exp = expectedOf(d);
            const k = exp.length - 1;
            const ns = exp[k].start + dir * 0.5;
            if (ns <= exp[k - 1].start + 1e-6) continue;
            const raw = exp.map((e, i) => { const b = i === k ? ns : e.start; return { beat: b, endBeat: d.rhythmOnly ? null : b + e.beats * 0.85, midi: e.midi }; });
            assert.ok(gradeOf(d, raw, inst).rhythmPct < 100, `${inst.id} nivel ${level} ${meter} ${dir > 0 ? 'tarde' : 'antes'}: ${d.score}`);
          }
        }
      }
    }
  }
});

test('toda la toma 250 ms tarde ya no da 100 (la latencia se descuenta al captar)', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const d = melodicDictation(violin, { level: 3, meter: '4/4', bars: 4, seed });
    const off = 0.25 * d.bpm / 60;
    const raw = expectedOf(d).map(e => ({ beat: e.start + off, endBeat: e.start + off + e.beats * 0.85, midi: e.midi }));
    assert.ok(gradeOf(d, raw, violin).score < 100, d.score);
  }
});
