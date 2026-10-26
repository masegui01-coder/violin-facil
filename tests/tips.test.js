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
    reed: ['embouchure', 'breath', 'mouthpiece'], clarinet: ['embouchure', 'breath', 'mouthpiece'], flute: ['embouchure', 'breath', 'mouthpiece'],
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
