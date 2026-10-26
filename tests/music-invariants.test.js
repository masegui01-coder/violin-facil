// Reglas musicales que no deben romperse nunca, comprobadas para todos los instrumentos (sobre todo los transpositores).
// Si una falla, algo sonará o se escribirá mal aunque el código «funcione».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS } from '../js/instruments.js';
import { SONGS, songScore, octaveShiftFor } from '../js/songs.js';
import { harmonize, accompanimentNotes } from '../js/harmony.js';
import { parseScore, meterBeats, keySignature, keyCount, transposeScore } from '../js/music.js';
import { beatGroups } from '../js/engrave.js';
import { METERS, KEYS } from '../js/rhythm-reading.js';

const pc = m => ((m % 12) + 12) % 12;
const PITCHED = INSTRUMENTS.filter(i => !i.rhythmOnly);

test('la base automática suena con la melodía real en todos los instrumentos', () => {
  PITCHED.forEach(inst => {
    let fit = 0;
    let total = 0;
    SONGS.forEach(song => {
      const shift = octaveShiftFor(song, inst);
      if (shift === null) return;
      const score = songScore(song);
      const notes = score.notes.map(n => (n.rest ? n : { ...n, midi: n.midi + shift }));
      const chords = harmonize(notes, score.bars, { key: song.key, time: song.time });
      const accomp = accompanimentNotes(chords, { time: song.time, transpose: inst.transpose });
      chords.forEach(c => {
        const sounding = new Set(accomp.filter(a => a.start >= c.start - 1e-6 && a.start < c.start + c.beats - 1e-6).map(a => pc(a.midi + inst.transpose)));
        notes.filter(n => !n.rest && n.start >= c.start - 1e-6 && n.start < c.start + c.beats - 1e-6).forEach(n => {
          total++;
          if (sounding.has(pc(n.midi + inst.transpose))) fit++;
        });
      });
    });
    assert.ok(total > 0 && fit / total > 0.6, `${inst.name}: solo ${Math.round((fit / total) * 100)} % de las notas de la melodía están en el acorde que suena`);
  });
});

test('la misma obra en dos instrumentos suena con la base en la misma relación con la melodía', () => {
  const song = SONGS.find(s => s.id === 'oda');
  const ref = INSTRUMENTS.find(i => i.id === 'violin');
  const shape = inst => {
    const score = songScore(song);
    const chords = harmonize(score.notes, score.bars, { key: song.key, time: song.time });
    const accomp = accompanimentNotes(chords, { time: song.time, transpose: inst.transpose });
    const melody0 = pc(score.notes.find(n => !n.rest).midi + inst.transpose);
    return accomp.map(a => pc(a.midi + inst.transpose - melody0)).join(',');
  };
  PITCHED.forEach(inst => assert.equal(shape(inst), shape(ref), inst.name));
});

test('cada compás se reparte en pulsos que suman lo que dura', () => {
  METERS.forEach(m => {
    const meter = m.split('/').map(Number);
    const sum = beatGroups(meter).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - meterBeats(meter)) < 1e-9, `${m}: ${sum} en vez de ${meterBeats(meter)}`);
  });
  assert.deepEqual(beatGroups([6, 8]), [1.5, 1.5]);
  assert.deepEqual(beatGroups([7, 8]), [1, 1, 1.5]);
});

test('las armaduras siguen el orden de sostenidos y bemoles', () => {
  KEYS.forEach(k => {
    const sig = keySignature(k);
    const n = keyCount(k);
    const letters = Object.keys(sig);
    assert.equal(letters.length, Math.abs(n), k);
    assert.deepEqual(letters, (n >= 0 ? ['F', 'C', 'G', 'D', 'A', 'E', 'B'] : ['B', 'E', 'A', 'D', 'G', 'C', 'F']).slice(0, Math.abs(n)), k);
  });
});

test('transportar una obra conserva los intervalos y una letra por grado', () => {
  const score = parseScore(SONGS.find(s => s.id === 'oda').score);
  [-9, -7, -2, 2, 3, 5].forEach(semi => {
    const { score: out } = transposeScore(score, 'D', semi);
    score.notes.forEach((n, i) => {
      if (n.rest) return;
      assert.equal(out.notes[i].midi - n.midi, semi);
      assert.ok(Math.abs(out.notes[i].acc) <= 1, `alteración doble al transportar ${semi}`);
    });
  });
});
