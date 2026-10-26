import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerOf, addAttempts, addLongtone, coachStats, coachAdvice, slipsWhere, emptyCoach, techniqueKind } from '../js/coach.js';
import { instrumentById } from '../js/instruments.js';

const sax = instrumentById('sax'); // escrita 58–89
const violin = instrumentById('violin');

// Afinación de mentira: n lecturas por nota con la media indicada (y una pequeña dispersión)
function tuningOf(entries, n = 4, jitter = 2) {
  return Object.fromEntries(entries.map(([midi, mean]) => {
    const xs = Array.from({ length: n }, (_, i) => mean + (i % 2 ? jitter : -jitter));
    return [midi, { n, sum: xs.reduce((a, b) => a + b, 0), sumSq: xs.reduce((a, b) => a + b * b, 0) }];
  }));
}
const lows = [58, 60, 62, 64, 65];
const highs = [80, 82, 84, 86, 88];
const mids = [70, 72, 74];

test('registerOf reparte la tesitura escrita en tercios', () => {
  assert.equal(registerOf(58, sax), 'low');
  assert.equal(registerOf(74, sax), 'mid');
  assert.equal(registerOf(89, sax), 'high');
});

test('addAttempts cuenta notas por registro y tropiezos por salto, sin mutar', () => {
  const before = emptyCoach();
  const after = addAttempts(before, sax, { notes: [60, 60, 85], slips: [{ midi: 60, off: 12 }, { midi: 85, off: 0 }] });
  assert.deepEqual(after.notes, { low: 2, mid: 0, high: 1 });
  assert.deepEqual(after.slips, { 'low:+12': 1 });
  assert.deepEqual(before.notes, { low: 0, mid: 0, high: 0 });
});

test('addLongtone guarda solo las últimas tomas', () => {
  let c = emptyCoach();
  for (let i = 0; i < 12; i++) c = addLongtone(c, { mean: i, stability: 3, centsPer10dB: 1, dynamicRange: 2 });
  assert.equal(c.longtones.length, 8);
  assert.equal(c.longtones[7].mean, 11);
});

test('sin datos suficientes no opina y dice cuánto falta', () => {
  const r = coachAdvice(sax, tuningOf([[60, 30]], 2), emptyCoach());
  assert.equal(r.ready, false);
  assert.ok(r.progress > 0 && r.progress < 1);
  assert.deepEqual(r.items, []);
});

test('agudas altas y graves bien en el saxo: consejo de embocadura (morder)', () => {
  const tuning = tuningOf([...lows.map(m => [m, 0]), ...mids.map(m => [m, 5]), ...highs.map(m => [m, 22])]);
  const r = coachAdvice(sax, tuning, emptyCoach());
  assert.equal(r.ready, true);
  assert.equal(r.items[0].id, 'pinch-high');
  assert.equal(r.items[0].tip, 'embouchure');
  assert.ok(r.items[0].evidence.some(e => e.value === '+22 ¢'));
});

test('todo igual de alto: es la afinación del instrumento, no la técnica', () => {
  const tuning = tuningOf([...lows, ...mids, ...highs].map(m => [m, 20]));
  const r = coachAdvice(sax, tuning, emptyCoach());
  assert.equal(r.items[0].id, 'tune-sharp');
  assert.equal(r.items[0].goto, 'tuner');
  assert.ok(!r.items.some(i => i.id === 'pinch-high'));
});

test('octavas que se escapan en las graves del saxo', () => {
  const tuning = tuningOf([...lows, ...mids, ...highs].map(m => [m, 0]));
  let coach = addAttempts(emptyCoach(), sax, { notes: Array(20).fill(60), slips: Array(5).fill({ midi: 60, off: 12 }) });
  const r = coachAdvice(sax, tuning, coach);
  assert.equal(r.items[0].id, 'octave-up-low');
  assert.equal(slipsWhere(coachStats(sax, tuning, coach), off => off === 12, 'low'), 5);
});

test('en el violín, notas a un semitono apuntan a la mano izquierda y las de otra cuerda al arco', () => {
  const tuning = tuningOf([60, 64, 67, 71, 74, 76].map(m => [m, 0]));
  const coach = addAttempts(emptyCoach(), violin, {
    notes: Array(30).fill(67),
    slips: [...Array(6).fill({ midi: 67, off: 1 }), ...Array(4).fill({ midi: 67, off: 7 })],
  });
  const ids = coachAdvice(violin, tuning, coach).items.map(i => [i.id, i.tip]);
  assert.deepEqual(ids, [['finger-place', 'left-hand'], ['wrong-string', 'bow']]);
});

test('en metales, saltos a otro armónico llevan al buzz', () => {
  const tpt = instrumentById('trumpet');
  const tuning = tuningOf([60, 62, 64, 67, 72, 76].map(m => [m, 0]));
  const coach = addAttempts(emptyCoach(), tpt, { notes: Array(20).fill(67), slips: Array(4).fill({ midi: 67, off: 5 }) });
  assert.equal(coachAdvice(tpt, tuning, coach).items[0].tip, 'buzz');
});

test('percusión: la precisión a tempo decide el consejo de golpe', () => {
  const perc = instrumentById('cajon');
  assert.equal(techniqueKind(perc), 'perc');
  assert.equal(coachAdvice(perc, {}, emptyCoach(), { recentAcc: [0.9] }).ready, false);
  const r = coachAdvice(perc, {}, emptyCoach(), { recentAcc: [0.5, 0.6, 0.55] });
  assert.equal(r.items[0].tip, 'stroke');
});

test('las notas tenidas que suben con el volumen dan el consejo de dinámica', () => {
  const tuning = tuningOf([...lows, ...mids, ...highs].map(m => [m, 0]));
  let coach = emptyCoach();
  coach = addLongtone(coach, { mean: 0, stability: 4, centsPer10dB: 9, dynamicRange: 15 });
  coach = addLongtone(coach, { mean: 0, stability: 4, centsPer10dB: 7, dynamicRange: 12 });
  assert.ok(coachAdvice(sax, tuning, coach).items.some(i => i.id === 'dynamic-pitch'));
});
