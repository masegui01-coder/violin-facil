// Cada instrumento recibe textos de su propia técnica: nada heredado de otro (rasgueo en el piano, baquetas en el cajón…)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS, instrumentById } from '../js/instruments.js';
import { playHints, coachAdvice } from '../js/coach.js';
import { bandTuningNotes, noteLabel } from '../js/music.js';
import { buildLibrary } from '../js/books.js';
import { buildCourse } from '../js/course.js';
import { tipsFor } from '../js/tips.js';
import { fingeringText } from '../js/fingerings.js';

const libraryText = id => {
  const inst = instrumentById(id);
  return JSON.stringify(buildLibrary(buildCourse([], id), inst).map(b => b.chapters.map(c => [c.title, c.sub, c.pages.map(p => [p.lesson.title, p.lesson.sub, p.lesson.cards])])));
};
const tipsText = id => JSON.stringify(tipsFor(id));

test('los avisos de la lección usan el gesto de cada instrumento', () => {
  assert.match(playHints(instrumentById('violin')).sharp, /dedo/);
  assert.match(playHints(instrumentById('trombone')).sharp, /vara/);
  ['trumpet', 'flute', 'sax', 'piano', 'guitar', 'recorder'].forEach(id => {
    const h = playHints(instrumentById(id));
    assert.doesNotMatch(`${h.repeat} ${h.sharp} ${h.flat}`, /arco|dedo/, id);
  });
});

test('las notas de afinación de banda caen en el registro y con la grafía de su tonalidad', () => {
  INSTRUMENTS.filter(i => !i.polyphonic && !i.rhythmOnly && i.family !== 'cuerda').forEach(inst => {
    bandTuningNotes(inst).forEach(n => assert.ok(n.midi >= inst.written[0] && n.midi <= inst.written[1], `${inst.id}: ${n.midi}`));
  });
  assert.equal(noteLabel(bandTuningNotes(instrumentById('sax'))[1], 'eu'), 'Fa♯');
  assert.equal(noteLabel(bandTuningNotes(instrumentById('tuba'))[0], 'us'), 'B♭2');
});

test('el piano no recibe instrucciones de rasgueo', () => {
  assert.doesNotMatch(libraryText('piano'), /rasgu|Abajo-arriba/);
});

test('el cajón no habla de baquetas y la flauta dulce no tiene llaves', () => {
  assert.doesNotMatch(libraryText('cajon'), /baqueta|Wilcoxon/);
  assert.doesNotMatch(libraryText('recorder'), /llaves|Klosé|morder/);
  assert.doesNotMatch(libraryText('percussion'), /palos flamencos|Escalas mayores y el círculo/);
});

test('el trombón afina con la vara y la trompa no tiene pistones', () => {
  assert.doesNotMatch(libraryText('trombone'), /bomba del 3|pistones/);
  assert.match(fingeringText('horn', 67, 'eu'), /Cilindro|Sin cilindros/);
  assert.doesNotMatch(fingeringText('euphonium', 55, 'eu'), /bomba del 3/);
  assert.equal(fingeringText('trumpet', 54, 'eu'), 'Pistones 1, 2 y 3 · saca la bomba del 3.er pistón');
});

test('los consejos de cada instrumento no copian los de otro', () => {
  assert.match(tipsText('horn'), /izquierda sostiene la trompa y acciona los cilindros/);
  assert.doesNotMatch(tipsText('oboe'), /El clarinete sube/);
  assert.doesNotMatch(tipsText('bass-clarinet'), /30-40 grados|barrilete/);
});

test('al oboe no se le habla de boquilla en los consejos personalizados', () => {
  const oboe = instrumentById('oboe');
  const tuning = Object.fromEntries([60, 62, 64, 72, 74, 76, 84, 86, 88].map(m => [m, { n: 10, mean: m > 80 ? 30 : 0 }]));
  const coach = { notes: { low: 30, mid: 30, high: 30 }, slips: { 'low:+12': 8 }, longtones: [] };
  const text = JSON.stringify(coachAdvice(oboe, tuning, coach).items);
  assert.doesNotMatch(text, /boquilla/);
});
