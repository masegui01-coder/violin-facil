import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS } from '../js/instruments.js';
import { tipsFor, tipOfKind, SOURCES } from '../js/tips.js';
import { artPanels, ART_IDS } from '../js/tips-art.js';
import { TIPS_EN } from '../js/tips-l10n.js';
import { techniqueKind } from '../js/coach.js';

test('cada instrumento tiene consejos con sus viñetas, fuentes y textos completos', () => {
  INSTRUMENTS.forEach(inst => {
    const tips = tipsFor(inst.id);
    assert.ok(tips.length >= 1, inst.id);
    tips.forEach(tip => {
      assert.ok(ART_IDS.includes(tip.art), `${inst.id}: falta la ilustración ${tip.art}`);
      assert.equal(artPanels(tip.art).length, tip.steps.length, `${inst.id}/${tip.kind}: viñetas y pasos`);
      assert.ok(tip.sources.length && tip.sources.every(k => SOURCES[k]), `${inst.id}/${tip.kind}: fuentes`);
      [tip.title, tip.intro, tip.check].forEach(text => assert.ok(text && text.length > 3));
    });
  });
});

test('los consejos a los que apunta el detector existen para cada instrumento', () => {
  const NEEDS = {
    reed: ['embouchure', 'breath', 'mouthpiece'], oboe: ['embouchure', 'breath', 'mouthpiece'], clarinet: ['embouchure', 'breath', 'mouthpiece'], flute: ['embouchure', 'breath', 'mouthpiece'],
    recorder: ['breath', 'holes'], brass: ['buzz', 'breath', 'embouchure'], trombone: ['buzz', 'breath', 'slide'],
    bowed: ['left-hand', 'bow'], fretted: ['fretting', 'right-hand'], keys: ['hand'], perc: ['stroke'],
  };
  INSTRUMENTS.forEach(inst => NEEDS[techniqueKind(inst)].forEach(kind => assert.ok(tipOfKind(inst.id, kind), `${inst.id} sin consejo «${kind}»`)));
});

test('todo el texto de los consejos tiene su traducción al inglés', () => {
  const texts = INSTRUMENTS.flatMap(inst => tipsFor(inst.id).flatMap(t => [t.title, t.intro, t.check, ...(t.avoid || []), ...t.steps.flatMap(s => [s.t, s.d])]));
  const missing = [...new Set(texts)].filter(es => !TIPS_EN[es]);
  assert.deepEqual(missing, []);
});

test('ukelele: digitaciones con los nombres de SUS cuerdas (no los de la guitarra)', async () => {
  const { fingeringText } = await import('../js/fingerings.js');
  assert.equal(fingeringText('ukulele', 69, 'eu'), 'Cuerda 1 (La) · al aire');
  assert.equal(fingeringText('ukulele', 64, 'eu'), 'Cuerda 2 (Mi) · al aire');
  assert.equal(fingeringText('ukulele', 62, 'eu'), 'Cuerda 3 (Do) · traste 2, dedo 2');
  assert.equal(fingeringText('ukulele', 67, 'us'), 'Cuerda 4 (high G) · al aire');
  assert.match(fingeringText('guitar', 76, 'eu'), /Mi aguda/);
});

test('las formas de acorde de guitarra y ukelele dan exactamente las notas del acorde', async () => {
  const { chordShape, chordMidis, parseChord } = await import('../js/chords.js');
  const NAMES = ['C', 'Am', 'F', 'G', 'G7', 'C7', 'Em', 'Dm', 'D', 'A', 'A7', 'D7', 'E7', 'E', 'Em7', 'Am7', 'Fmaj7', 'Bb', 'Bm', 'B7', 'F#m', 'Gm', 'Cm', 'Fm', 'C#m', 'Dm7', 'Cmaj7', 'Gmaj7', 'Dsus4', 'Asus4'];
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const TONES = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7] };
  ['guitar', 'ukulele'].forEach(inst => NAMES.forEach(name => {
    if (!chordShape(name, inst)) return;
    const m = /^([A-G])([#b]?)(.*)$/.exec(name);
    const root = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
    const want = new Set(TONES[m[3]].map(t => (root + t) % 12));
    const got = new Set(chordMidis(name, inst).map(x => x % 12));
    [...got].forEach(pc => assert.ok(want.has(pc), `${inst} ${name}: nota ajena ${pc}`));
    assert.ok(got.size >= Math.min(3, want.size) - (m[3] === '7' ? 1 : 0), `${inst} ${name}: faltan notas`);
    void parseChord;
  }));
});
