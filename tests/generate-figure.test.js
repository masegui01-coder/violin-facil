import { test } from 'node:test';
import assert from 'node:assert/strict';
import { technique } from '../js/generate.js';
import { instrumentById } from '../js/instruments.js';
import { parseScore } from '../js/music.js';

const beatsOf = score => parseScore(score).notes.reduce((s, n) => s + n.beats, 0);

test('las escalas y arpegios del gimnasio se pueden tocar en negras o blancas, con compases completos', () => {
  const violin = instrumentById('violin');
  ['scale', 'arpeggio', 'thirds'].forEach(kind => ['e', 'q', 'h'].forEach(fig => {
    const song = technique(kind, 'D', violin, 50, fig);
    assert.equal(beatsOf(song.score) % 4, 0, `${kind} ${fig}`);
    const notes = parseScore(song.score).notes;
    const body = notes.slice(0, -1);
    assert.ok(body.every(n => n.beats === { e: 0.5, q: 1, h: 2 }[fig]), `${kind} ${fig}`);
  }));
  assert.equal(technique('scale', 'D', violin, 60).id, 'gym-scale-D');
  assert.equal(technique('scale', 'D', violin, 60, 'q').id, 'gym-scale-D-q');
});
