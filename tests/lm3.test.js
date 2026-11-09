// Curso de Lenguaje Musical · Nivel 3: contenido (sumas de compás, prosodia, respuestas) y motor nuevo (3/8 y 9/8, menores,
// armaduras de dos y tres alteraciones, intervalos con especie, síncopa con ligadura, D.S. al Coda y dos voces).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LM_LEVELS, allLmExercises, lmExercise, lmQuestion, lmSong, parseLmId, mistakeText } from '../js/lm/catalog.js';
import U1 from '../js/lm/level3/u1.js';
import U2 from '../js/lm/level3/u2.js';
import U3 from '../js/lm/level3/u3.js';
import U4 from '../js/lm/level3/u4.js';
import U5 from '../js/lm/level3/u5.js';
import U6 from '../js/lm/level3/u6.js';
import U7 from '../js/lm/level3/u7.js';
import U8 from '../js/lm/level3/u8.js';
import META from '../js/lm/level3/meta.js';
import { prosodyIssues, beatWeight } from '../js/lm/prosody.js';
import {
  scoreTokens, barBeatsOf, stepOf, resolvePitches, accidentalSigns, keyAcc, attackTokens, isCompound, pulseBeatsOf, interval, scale,
} from '../js/lm/notes.js';
import { formOf, passesOf, barOrder, expandForm } from '../js/lm/form.js';
import { readingTimeline, metronomeBeats } from '../js/lm/rhythm-plan.js';
import { layoutTokens, clefCell, noteCell } from '../js/lm/staff-lm.js';
import { stopKinds, stopOptions, stopRoundOf, stopBase, genRhythm, choiceQuestions, cellTokens } from '../js/lm/gen.js';
import { minorFormOk, countSlurs, countBeatTies, motionCount } from '../js/lm/creative.js';
import { checkComposition } from '../js/lm/grade.js';

const UNITS = [U1, U2, U3, U4, U5, U6, U7, U8];
const level3 = () => LM_LEVELS[2];

// ---------- Catálogo ----------
test('Nivel 3: 8 unidades en el catálogo, con ids lm3-u{n}-{sección}-{a|b|c}-{facil|medio}', () => {
  assert.equal(level3().level, 3);
  assert.equal(level3().units.length, 8);
  const exs = level3().units.flatMap(u => u.exercises);
  assert.equal(exs.length, 204);
  exs.forEach(e => {
    assert.match(e.id, /^lm3-u[1-8]-[a-z]+-[abc]-(facil|medio)$/, e.id);
    assert.equal(lmExercise(e.id), e);
    assert.equal(parseLmId(e.id).level, 3);
  });
  assert.equal(META.nivel, 3);
  assert.ok(allLmExercises().length > exs.length);
});

// ---------- Contenido: sumas de compás ----------
function checkBars(where, text, compas, pickup = 0) {
  if (!text || !compas || /\?/.test(text)) return;
  const tokens = scoreTokens(text);
  const bb = barBeatsOf(compas);
  const bars = [];
  tokens.forEach(t => { bars[t.bar] = (bars[t.bar] || 0) + t.beats; });
  bars.forEach((sum, i) => {
    const first = i === 0;
    const last = i === bars.length - 1;
    const ok = Math.abs(sum - bb) < 1e-6 || (pickup && first && Math.abs(sum - pickup) < 1e-6) || (pickup && last && Math.abs(sum - (bb - pickup)) < 1e-6);
    assert.ok(ok, `${where}: el compás ${i + 1} suma ${sum} y el ${compas} pide ${bb}`);
  });
}
test('Nivel 3: cada partitura suma lo que pide su compás (ejercicios, canciones, fichas, preguntas)', () => {
  let n = 0;
  UNITS.forEach(u => {
    Object.values(u.secciones).flat().forEach(ex => {
      if (ex.partitura && ex.compas) { checkBars(ex.id, ex.partitura, ex.compas, ex.anacrusa || 0); n++; }
      if (ex.voz1 && ex.compas) { checkBars(`${ex.id} voz1`, ex.voz1, ex.compas); n++; }
      (ex.items || ex.preguntas || []).forEach(it => {
        if (it.partitura && it.compas && it.tipo !== 'barras' && it.erroneoAdrede === undefined) { checkBars(it.id, it.partitura, it.compas); n++; }
        if (it.play && it.play.partitura && it.play.compas) { checkBars(`${it.id} play`, it.play.partitura, it.play.compas, it.play.anacrusa || 0); n++; }
        if (it.play && it.play.voz2 && it.play.compas) { checkBars(`${it.id} voz2`, it.play.voz2, it.play.compas); n++; }
      });
    });
    u.teoria.ficha.forEach((f, i) => { if (f.ejemplo && f.compas) { checkBars(`${u.id} ficha ${i + 1}`, f.ejemplo, f.compas, f.anacrusa || 0); n++; } });
    checkBars(`${u.id} canción`, u.cancion.partitura, u.cancion.compas, u.cancion.anacrusa || 0);
    if (u.cancion.voz2) checkBars(`${u.id} voz2`, u.cancion.voz2.partitura, u.cancion.compas, u.cancion.anacrusa || 0);
  });
  assert.ok(n > 100, `${n} partituras comprobadas`);
});

test('Nivel 3: la prosodia de las canciones (3/8, 9/8, ligaduras y melismas) y la letra casa con las notas', () => {
  UNITS.forEach(u => {
    const s = u.cancion;
    assert.ok(s.palabras, `${u.id}: palabras`);
    const clean = l => l;
    assert.deepEqual(prosodyIssues({ partitura: s.partitura, compas: s.compas, anacrusa: s.anacrusa || 0 }, clean(s.letra), s.palabras), [], `${s.titulo}: estrofa 1`);
    if (s.letra2) assert.deepEqual(prosodyIssues({ partitura: s.partitura, compas: s.compas, anacrusa: s.anacrusa || 0 }, clean(s.letra2), s.palabras2), [], `${s.titulo}: estrofa 2`);
  });
});

test('Nivel 3: toda pregunta de teoría y audición tiene respuesta dentro de sus opciones', () => {
  level3().units.forEach(u => u.exercises.filter(e => e.section === 'teoria' || e.section === 'audicion').forEach(e => {
    (e.params.items || e.params.preguntas || []).forEach(it => {
      if (it.options && Number.isInteger(it.answer)) assert.ok(it.answer < it.options.length, it.id);
      if (it.tipo === 'completar') it.correctas.forEach(c => assert.ok(c < it.opciones.length, it.id));
      assert.ok(lmQuestion(3, it.id), it.id);
    });
  }));
});

// ---------- 3/8 y 9/8 ----------
import { keyTonic, scaleDown, intervalNote, beamBeatsOf, pulseOfParams, REST_NAME } from '../js/lm/notes.js';
import { drawMarks, formText, passText } from '../js/lm/form.js';
import { syllablesOf } from '../js/lm/rhythm-plan.js';
import { gradeReading } from '../js/lm/reading-grade.js';
import { staffHtml } from '../js/lm/kit.js';
import { agilityPlan, answerButtons, keyAnswers } from '../js/lm/tasks-agility.js';
import { armaduraMark } from '../js/lm/tasks-quiz.js';
import { intervalRounds } from '../js/lm/tasks-staff.js';

test('3/8: 1,5 pulsos de negra por compás, pulso de corchea por defecto o «a uno» con pulso q.; 9/8: 4,5 y tres pulsos de q.', () => {
  assert.equal(barBeatsOf('3/8'), 1.5);
  assert.equal(barBeatsOf('9/8'), 4.5);
  assert.equal(isCompound('3/8'), false);
  assert.equal(isCompound('9/8'), true);
  assert.equal(pulseBeatsOf('3/8'), 0.5);
  assert.equal(pulseOfParams({ compas: '3/8', pulso: 'e' }), 0.5);
  assert.equal(pulseOfParams({ compas: '3/8', pulso: 'q.' }), 1.5);
  assert.equal(pulseOfParams({ compas: '9/8', pulso: 'q.' }), 1.5);
  // metrónomo de 3/8: tres clics por compás con el primero acentuado; «a uno»: uno por compás
  const e = metronomeBeats({ length: 3, barBeats: 1.5, pulse: 0.5, metro: 'all' });
  assert.deepEqual(e.map(c => `${c.beat}${c.level[0]}`), ['0d', '0.5p', '1p', '1.5d', '2p', '2.5p']);
  assert.deepEqual(metronomeBeats({ length: 4.5, barBeats: 1.5, pulse: 1.5, metro: 'first' }).map(c => c.beat), [0, 1.5, 3]);
  // 9/8 con subdivisión: tres pulsos y, suaves, las corcheas
  const nine = metronomeBeats({ length: 4.5, barBeats: 4.5, pulse: 1.5, metro: 'all', subdivision: true });
  assert.deepEqual(nine.filter(c => c.level !== 'sub').map(c => c.beat), [0, 1.5, 3]);
  assert.equal(nine.filter(c => c.level === 'sub').length, 6);
});

test('3/8 y 9/8: las corcheas del compás van unidas y las semicorcheas con segunda barra por compás', () => {
  const three = layoutTokens(scoreTokens('| C5e C5e C5e | C5e C5s C5s |'), { barBeats: 1.5, pulse: beamBeatsOf('3/8') });
  assert.deepEqual(three.map(x => `${x.beam.in ? 'i' : ''}${x.beam.out ? 'o' : ''}`), ['o', 'io', 'i', 'o', 'io', 'i']);
  const six = layoutTokens(scoreTokens('| C5s C5s C5s C5s C5s C5s |'), { barBeats: 1.5, pulse: 1.5 });
  assert.ok(six.every((x, i) => !!x.beam.in2 === (i > 0) && !!x.beam.out2 === (i < 5)), 'doble barra de las seis semicorcheas');
  const nine = layoutTokens(scoreTokens('| C5e C5e C5e C5e C5e C5e C5e C5e C5e |'), { barBeats: 4.5, pulse: beamBeatsOf('9/8') });
  assert.deepEqual(nine.map(x => `${x.beam.in ? 'i' : ''}${x.beam.out ? 'o' : ''}`), ['o', 'io', 'i', 'o', 'io', 'i', 'o', 'io', 'i']);
  assert.equal(beamBeatsOf('2/4'), 1);
  assert.equal(beamBeatsOf('4/4', 'q.'), 1.5);
});

test('prosodia en 3/8 y 9/8: pesos de cada instante', () => {
  assert.deepEqual([0, 0.5, 1, 0.25].map(p => beatWeight(p, 1.5, false)), [3, 1, 1, 0]);
  assert.deepEqual([0, 0.5, 1.5, 2, 3, 3.5].map(p => beatWeight(p, 4.5, true)), [3, 0, 1, 0, 1, 0]);
  assert.deepEqual([0, 1.5, 0.5].map(p => beatWeight(p, 3, true)), [3, 2, 0], 'el 6/8 sigue igual');
});

test('melisma «_»: la nota sigue con la sílaba anterior y no cuenta como sílaba nueva', () => {
  const song = { partitura: '| (A4q C5q) B4q | A4h Rq |', compas: '3/4' };
  assert.deepEqual(prosodyIssues(song, [['Duer', '_', 'me'], ['dor']], 'Duerme dor'), []);
  // sin el guion bajo la letra se desalinea (una sílaba de más)
  assert.equal(prosodyIssues(song, [['Duer', 'me', 'dor'], []], 'Duerme dor').length, 0);
});

test('silencio de semicorchea: nombre, dibujo y error «Rs>s» al palmearlo', () => {
  assert.equal(REST_NAME.s, 'Silencio de semicorchea');
  assert.match(noteCell({ rest: true, dur: 's' }), /lm-rest/);
  assert.match(noteCell({ rest: true, dur: 'h.' }), /lm-rest/, 'silencio de blanca con puntillo');
  const t = scoreTokens('| C5e Rs C5s C5e |');
  assert.equal(t[1].rest, true);
  assert.equal(t[1].dur, 's');
  const tl = readingTimeline({ compas: '3/8' }, t);
  const spb = 0.5;
  const at = e => e.beat * spb;
  const notes = tl.events.filter(e => !e.rest).map(e => ({ at: at(e), dur: e.dur }));
  const rests = tl.events.filter(e => e.rest).map(e => ({ from: at(e), to: at(e) + e.beats * spb, dur: e.dur }));
  const bad = gradeReading({ notes, rests, hits: [...notes.map(n => n.at), rests[0].from + 0.02], tol: 0.1 });
  assert.ok(bad.mistakes.includes('Rs>s'));
  assert.match(mistakeText('Rs>s'), /semicorchea/);
  assert.equal(gradeReading({ notes, rests, hits: notes.map(n => n.at), tol: 0.1 }).pct, 100);
});

test('sílabas de apoyo en 3/8: ti-ti-ti, ta-i, ta-a-a, ti-tiri-ti', () => {
  const pulse = beamBeatsOf('3/8');
  assert.deepEqual(syllablesOf(scoreTokens('| C5e C5e C5e | C5q C5e | C5q. | C5e C5s C5s C5e |'), { pulse }), ['ti', 'ti', 'ti', 'ta', 'i', 'ta-a-a', 'ti', 'ti', 'ri', 'ti']);
});

test('generadores en 3/8 y 9/8 llenan el compás', () => {
  const g38 = genRhythm({ figuras: ['e', 'q', 'q.', 's', 'Re', 'Rs'], barBeats: 1.5, bars: 8, seed: 5 });
  assert.ok(Math.abs(g38.reduce((s, t) => s + t.beats, 0) - 12) < 1e-6);
  const g98 = genRhythm({ figuras: ['q.', 'eee', 'qe', 'h.', 'Ree', 'ess', 'Rq.'], barBeats: 4.5, bars: 8, seed: 5, compound: true });
  assert.ok(Math.abs(g98.reduce((s, t) => s + t.beats, 0) - 36) < 1e-6);
  assert.deepEqual(cellTokens('Rs').map(t => `${t.rest ? 'R' : ''}${t.dur}`), ['Rs']);
});

// ---------- Menores y armaduras ----------
test('la menor en sus tres formas y la bajada de la melódica; las escalas del catálogo coinciden', () => {
  assert.deepEqual(scale('A4', 'menor armónica'), ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G#5', 'A5']);
  assert.deepEqual(scale('A4', 'menor melódica'), ['A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G#5', 'A5']);
  assert.deepEqual(scaleDown('A4', 'menor melódica'), ['A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4']);
  assert.deepEqual(scale('B4', 'menor natural'), ['B4', 'C#5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5']);
  assert.deepEqual(scale('C4', 'menor armónica'), ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'B4', 'C5']);
  let n = 0;
  level3().units.flatMap(u => u.exercises).flatMap(e => e.params.items || []).filter(i => i.tipo === 'escala').forEach(i => {
    assert.deepEqual(i.respuesta, scale(i.tonica, i.modo), `${i.id} subida`);
    if (i.respuestaBajada) assert.deepEqual(i.respuestaBajada, scaleDown(i.tonica, i.modo), `${i.id} bajada`);
    n++;
  });
  assert.ok(n >= 4, `${n} escalas`);
});

test('armaduras de dos y tres alteraciones: signos, becuadro del si♮ en do menor y mi♯ en fa♯ menor', () => {
  const cm = scoreTokens('| C4q Eb4q G4q B4q | Bb4q B4q Bb4q Ab4q |');
  assert.deepEqual(accidentalSigns(cm, cm.map(t => t.bar), -3), [null, null, null, 'n', 'b', 'n', 'b', null], 'B♮ lleva becuadro; la cortesía del compás siguiente');
  const fm = scoreTokens('| F#4q A4q C#5q E#4q |');
  assert.deepEqual(accidentalSigns(fm, fm.map(t => t.bar), 3), [null, null, null, '#']);
  assert.equal(fm[3].midi, 65);
  assert.equal(interval('G#4', 'E#5').code, '6M');
  for (const [k, glyph] of [[2, '♯'], [3, '♯'], [-2, '♭'], [-3, '♭']]) {
    assert.equal((clefCell('treble', '4/4', k).match(new RegExp(glyph, 'g')) || []).length, Math.abs(k));
    assert.equal((clefCell('bass', null, k).match(new RegExp(glyph, 'g')) || []).length, Math.abs(k));
  }
  assert.equal(keyAcc('F', 2), 1);
  assert.equal(keyAcc('G', 2), 0);
  assert.equal(keyAcc('G', 3), 1);
  assert.equal(keyAcc('A', -3), -1);
  assert.equal(keyAcc('G', -3), 0);
  assert.equal(keyAcc('E', -2), -1);
  assert.equal(keyAcc('A', -2), 0);
  assert.deepEqual(keyTonic('Fa♯ m'), { midi: 66, minor: true });
  assert.deepEqual(keyTonic('Si♭ M'), { midi: 58, minor: false });
  assert.deepEqual(keyTonic('Mi♭ M'), { midi: 63, minor: false });
  assert.deepEqual(keyTonic('Do m'), { midi: 60, minor: true });
  assert.deepEqual(keyTonic('La M'), { midi: 57, minor: false });
});

test('pregunta «armadura»: número, signo y orden de las alteraciones', () => {
  // en clave de sol: fa♯ (línea superior, 38), do♯ (35), sol♯ (39); si♭ (34), mi♭ (37), la♭ (33)
  assert.equal(armaduraMark([{ sym: '#', step: 38 }, { sym: '#', step: 35 }, { sym: '#', step: 39 }], 3, 'treble'), 'ok');
  assert.equal(armaduraMark([{ sym: '#', step: 35 }, { sym: '#', step: 38 }, { sym: '#', step: 39 }], 3, 'treble'), 'near', 'orden cambiado');
  assert.equal(armaduraMark([{ sym: 'b', step: 34 }, { sym: 'b', step: 37 }, { sym: 'b', step: 33 }], -3, 'treble'), 'ok');
  assert.equal(armaduraMark([{ sym: '#', step: 38 }], -3, 'treble'), 'bad');
  assert.equal(armaduraMark([{ sym: '#', step: 38 }, { sym: '#', step: 35 }], 3, 'treble'), 'near', 'faltó una');
  assert.equal(armaduraMark([], 0, 'treble'), 'ok');
});

// ---------- Intervalos con especie ----------
test('intervalos con especie: calidad por semitonos (M, m, J, A, d) y la nota de llegada con su alteración', () => {
  const codes = [['E4', 'G4', '3m'], ['A4', 'C#5', '3M'], ['F4', 'B4', '4A'], ['B4', 'F5', '5d'], ['F4', 'G#4', '2A'], ['D4', 'C#5', '7M'], ['E4', 'C5', '6m'], ['C4', 'G4', '5J'], ['D4', 'G#4', '4A']];
  codes.forEach(([a, b, code]) => assert.equal(interval(a, b).code, code, `${a}-${b}`));
  assert.equal(intervalNote('A4', 3, 'M', 'asc'), 'C#5');
  assert.equal(intervalNote('E4', 3, 'm', 'asc'), 'G4');
  assert.equal(intervalNote('F4', 4, 'A', 'asc'), 'B4');
  assert.equal(intervalNote('B4', 5, 'd', 'asc'), 'F5');
  assert.equal(intervalNote('C5', 3, 'M', 'desc'), 'Ab4');
  assert.equal(intervalNote('G4', 3, 'M', 'asc'), 'B4');
  assert.equal(intervalNote('A4', 2, 'A', 'asc'), 'B#4');
  assert.equal(intervalNote('A4', 4, 'M', 'asc'), null);
  assert.equal(intervalNote('F#4', 5, 'A', 'asc'), null, 'doble sostenido: no se pide');
  const rounds = intervalRounds({ desde: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'], intervalos: [2, 3, 4, 5, 6, 8], especies: ['2m', '2M', '3m', '3M', '4J', '5J', '6m', '6M', '8J'], direccion: ['asc', 'desc'], rondas: 30 }, 11);
  assert.equal(rounds.length, 30);
  rounds.forEach(r => {
    const iv = r.dir === 'asc' ? interval(r.from, r.to) : interval(r.to, r.from);
    assert.equal(iv.code, `${r.number}${r.especie}`, `${r.from}→${r.to}`);
  });
  assert.ok(new Set(rounds.map(r => `${r.number}${r.especie}`)).size >= 6);
  const easy = intervalRounds({ desde: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'], intervalos: [3], especies: ['3M', '3m'], direccion: ['asc'], rondas: 8 }, 3);
  assert.ok(easy.every(r => r.number === 3 && ['M', 'm'].includes(r.especie)));
  assert.match(mistakeText('3>4'), /3\.ª/);
  assert.match(mistakeText('3M>3m'), /mayor.*menor/);
  assert.match(mistakeText('especie'), /especie/);
});

test('agilidad: armadura → tonalidad y parejas de notas con su especie', () => {
  assert.deepEqual(keyAnswers(-3), { major: 'Eb', minor: 'C' });
  assert.deepEqual(keyAnswers(3), { major: 'A', minor: 'F#' });
  assert.deepEqual(keyAnswers(0), { major: 'C', minor: 'A' });
  const plan = agilityPlan({ clave: 'sol', modo: 'armadura', notas: [], armaduras: [-3, -2, -1, 0, 1, 2, 3], respuesta: 'tonalidad mayor y su relativa menor', cantidad: 14, segundosPorNota: 6 }, 4);
  assert.equal(plan.notes.length, 14);
  assert.ok(plan.keys && plan.both);
  plan.notes.forEach((a, i) => assert.ok(i === 0 || a !== plan.notes[i - 1]));
  const iv = agilityPlan({ clave: 'sol', notas: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G#4', 'F#4'], modo: 'intervalo', intervalos: [2, 3, 4, 5, 6, 7, 8], especies: ['2m', '2M', '2A', '3m', '3M', '4J', '4A', '5d', '5J', '6m', '6M', '7m', '7M', '8J'], cantidad: 30, segundosPorNota: 7 }, 9);
  assert.ok(iv.species);
  iv.notes.forEach(x => assert.equal(interval(x.a, x.b).code, x.code));
  assert.ok(new Set(iv.notes.map(x => x.code)).size >= 6);
  // los botones de nombre incluyen las notas con alteración de la bolsa
  const sharp = answerButtons({ clave: 'sol', notas: ['E4', 'G#4', 'A4'], modo: 'nombrar' }, 'facil', 'eu');
  assert.match(sharp, /data-name="G#"/);
  assert.doesNotMatch(sharp, /data-name="G"/);
});

// ---------- D.S. al Coda ----------
test('D.S. al Coda: 1…coda−1, vuelta al signo hasta «al Coda» y salto a la Coda', () => {
  const form = formOf({ ds: { segno: 5, alCoda: 6, coda: 9 } });
  assert.equal(form.kind, 'ds');
  assert.deepEqual(barOrder(form, 10), [1, 2, 3, 4, 5, 6, 7, 8, 5, 6, 9, 10]);
  assert.equal(passesOf(form, 10).length, 3);
  const marks = drawMarks(form, 10);
  assert.equal(marks[5].segno, true);
  assert.equal(marks[6].alCoda, true);
  assert.equal(marks[8].ds, true);
  assert.equal(marks[9].coda, true);
  assert.match(formText(form), /D\.S\. al Coda/);
  assert.match(passText(form, 1), /signo/);
  assert.match(passText(form, 2), /Coda/);
  // la lectura rítmica de la unidad 8 sigue ese orden y lo pinta
  const reading = level3().units.flatMap(u => u.exercises).find(e => e.params.ds && e.section === 'ritmo');
  assert.ok(reading, 'hay una lectura rítmica con D.S.');
  const tokens = scoreTokens(reading.params.partitura);
  const tl = readingTimeline(reading.params, tokens);
  assert.equal(tl.passes, 3);
  assert.equal(tl.passStarts.length, 3);
  const played = [...new Set(tl.events.map(e => `${e.pass}:${e.bar + 1}`))].map(x => Number(x.split(':')[1]));
  assert.deepEqual(played, [1, 2, 3, 4, 5, 6, 7, 8, 5, 6, 9, 10]);
  assert.equal(tl.scoreBeat(tl.passStarts[1]), tokens.find(t => t.bar === 4).start, 'la 2.ª vuelta vuelve al compás del signo');
  const exp = expandForm(tokens, form, { barBeats: 2 });
  assert.deepEqual([...new Set(exp.map(t => `${t.pass}:${t.barNo}`))].map(x => Number(x.split(':')[1])), played);
  const html = staffHtml(tokens, { meter: '2/4', form });
  assert.match(html, /data-ds-left="𝄋"/);
  assert.match(html, /D\.S\. al Coda/);
  assert.match(html, /𝄌 Coda/);
});

test('STOP del D.S.: «alinicio» vuelve al compás 1 y «sigue» no salta a la Coda', () => {
  const tokens = scoreTokens('| C5q C5q | D5q D5q | E5q E5q | F5q F5q | G5q G5q | A5q A5q | B5q B5q | C6q C6q |');
  const form = formOf({ ds: { segno: 3, alCoda: 4, coda: 7 } });
  const base = expandForm(tokens, form, { barBeats: 2 });
  const opts = stopOptions(stopBase(base, {}), ['ds'], 2, { form });
  assert.deepEqual(opts.map(o => o.variant).sort(), ['alinicio', 'sigue']);
  const a = stopRoundOf(base, { kinds: ['ds'], seed: 1, barBeats: 2, ctx: { form }, avoid: new Set([`ds:${opts[0].i}:sigue`]) });
  const b = stopRoundOf(base, { kinds: ['ds'], seed: 1, barBeats: 2, ctx: { form }, avoid: new Set([`ds:${opts[0].i}:alinicio`]) });
  assert.equal(a.code, 'ds');
  assert.equal(a.errorBeat, 12, 'el error empieza al volver al signo (6 compases de 2 pulsos)');
  assert.equal(b.errorBeat, 16, 'al terminar el compás «al Coda» (6 + 2 compases)');
  assert.equal(mistakeText('stop-ds'), 'no notó: un D.S. al Coda olvidado');
});

// ---------- STOP del Nivel 3 ----------
test('STOP del Nivel 3: cada error pedido existe en la lectura de su base y la ronda suena distinta', () => {
  const stops = level3().units.flatMap(u => u.exercises).filter(e => e.type === 'stop');
  assert.equal(stops.length, 16);
  stops.forEach(e => {
    const base = e.params.base;
    assert.ok(base && base.partitura, `${e.id}: base`);
    const tokens = scoreTokens(base.partitura);
    const barBeats = barBeatsOf(base.compas);
    const form = formOf(base);
    const played = form ? expandForm(tokens, form, { pickup: base.anacrusa || 0, barBeats }) : attackTokens(tokens);
    const melodic = /-entonacion-/.test(base.id);
    const tone = keyTonic(base.tonalidad);
    const ctx = { armadura: base.armadura || 0, melodic, form, minor: tone.minor, tonicPc: ((tone.midi % 12) + 12) % 12 };
    const kinds = stopKinds(e.params.errores);
    e.params.errores.forEach(txt => assert.ok(stopKinds([txt]).some(k => stopOptions(stopBase(played, { melodic }), [k], barBeats, { ...ctx, pickup: base.anacrusa || 0 }).length > 0), `${e.id}: no cabe «${txt}»`));
    for (let k = 0; k < 4; k++) {
      const r = stopRoundOf(played, { kinds, seed: 21 + k * 101, barBeats, pickup: base.anacrusa || 0, round: k, ctx });
      assert.ok(r.errorBeat >= 0 && r.code, e.id);
      assert.ok(kinds.includes(r.code), `${e.id}: ${r.code} no está entre ${kinds}`);
    }
  });
});

test('STOP: los errores nuevos cambian lo que suena en el sitio que dicen', () => {
  // ligadura olvidada: la nota ligada se vuelve a atacar donde empieza su continuación
  const t = scoreTokens('| C5e C5e~ C5e C5e | C5q C5q |');
  const ties = stopRoundOf(attackTokens(t), { kinds: ['liga'], seed: 3, barBeats: 2 });
  assert.equal(ties.code, 'liga');
  assert.equal(ties.played.filter(x => !x.rest).length, 6, 'un ataque de más (5 notas con la ligadura)');
  assert.equal(ties.errorBeat, 1, 'la continuación empezaba en el 2.º pulso');
  // sensible olvidada: el sol♯ suena sol
  const am = scoreTokens('| A4q B4q C5q D5q | E5q F5q G#5q A5q |');
  const sens = stopRoundOf(am, { kinds: ['sensible'], seed: 2, barBeats: 4, ctx: { melodic: true, minor: true, tonicPc: 9 } });
  assert.equal(sens.code, 'sensible');
  assert.ok(sens.played.some(x => x.name === 'G#5' && x.midi === midiOfName('G5')));
  // becuadro olvidado en do menor: el si♮ suena si♭
  const cm = scoreTokens('| C4q Eb4q G4q B4q | C5w |');
  const bec = stopRoundOf(cm, { kinds: ['sensible'], seed: 2, barBeats: 4, ctx: { melodic: true, minor: true, tonicPc: 0, armadura: -3 } });
  assert.ok(bec.played.some(x => x.name === 'B4' && x.midi === midiOfName('Bb4')));
  // melódica bajada con sostenidos: al bajar suena la nota de la subida
  const mel = scoreTokens('| A4q B4q C5q D5q | E5q F#5q G#5q A5q | G5q F5q E5q D5q |');
  const down = stopRoundOf(mel, { kinds: ['melodica'], seed: 1, barBeats: 4, ctx: { melodic: true, minor: true, tonicPc: 9 } });
  assert.equal(down.code, 'melodica');
  assert.ok(down.played.some(x => (x.name === 'G5' && x.midi === midiOfName('G#5')) || (x.name === 'F5' && x.midi === midiOfName('F#5'))));
  // 9/8 tocado como 6/8: el compás pierde su tercer pulso
  const nine = scoreTokens('| C5q. C5q. C5q. | C5e C5e C5e C5q. C5q. |');
  const lost = stopRoundOf(nine, { kinds: ['9/8>6/8'], seed: 4, barBeats: 4.5 });
  assert.equal(lost.code, '9/8>6/8');
  assert.equal(lost.played.reduce((s, x) => s + x.beats, 0), 9 - 1.5);
  assert.equal(mistakeText('stop-9/8>6/8'), 'no notó: un 9/8 tocado como 6/8');
  // silencio de semicorchea con palmada
  const rs = stopRoundOf(scoreTokens('| C5e Rs C5s C5e |'), { kinds: ['R>e'], seed: 2, barBeats: 1.5 });
  assert.equal(rs.played.filter(x => x.rest).length, 0);
  assert.equal(stopKinds(['silencio con palmada', 'saltillo tocado como dos corcheas']).join(), 'R>e,e.s>ee');
});

// ---------- Discriminación ----------
test('discriminación: compases 2/4–3/8–6/8 y 3/4–6/8–9/8, formas de la menor, ligadura y movimiento de dos voces', () => {
  const a = choiceQuestions({ opciones: ['2/4', '3/8', '6/8'] }, 9, 3);
  assert.equal(a.length, 9);
  assert.ok(new Set(a.map(q => q.options[q.answer])).size === 3, 'salen los tres compases');
  a.forEach(q => {
    const toks = scoreTokens(q.play.partitura);
    assert.equal(toks.length, 12, 'doce corcheas');
    const strong = toks.map((x, i) => (x.midi === 48 ? i : -1)).filter(i => i >= 0);
    const gap = { '2/4': 4, '3/8': 3, '6/8': 6 }[q.options[q.answer]];
    assert.ok(strong.every((s, k) => s === k * gap), `${q.options[q.answer]}: apoyo cada ${gap}`);
  });
  const b = choiceQuestions({ opciones: ['3/4', '6/8', '9/8'] }, 9, 4);
  b.forEach(q => assert.equal(scoreTokens(q.play.partitura).length, q.options[q.answer] === '9/8' ? 18 : 12));
  assert.deepEqual([...new Set(b.map(q => q.code))].sort(), ['6/8>3/4', '9/8>6/8', 'compas']);
  const f = choiceQuestions({ opciones: ['menor natural', 'menor armónica', 'menor melódica'] }, 9, 5);
  assert.ok(new Set(f.map(q => q.options[q.answer])).size === 3);
  f.forEach(q => {
    const toks = scoreTokens(q.play.partitura);
    assert.equal(toks.length, 15, 'subida y bajada');
    assert.match(q.options[q.answer], /^Menor/);
  });
  const lig = choiceQuestions({ opciones: ['e e e e', 'e e~e e'] }, 8, 6);
  assert.ok(lig.some(q => /~/.test(q.play.partitura)) && lig.some(q => !/~/.test(q.play.partitura)));
  lig.forEach(q => assert.equal(q.play.pulso, true));
  const mov = choiceQuestions({ opciones: ['paralelo', 'contrario', 'oblicuo'] }, 12, 7);
  mov.forEach(q => {
    const want = q.options[q.answer].toLowerCase();
    const up = scoreTokens(q.play.partitura);
    const low = scoreTokens(q.play.voz2);
    assert.ok(up.every((x, i) => x.midi > low[i].midi), 'la voz aguda siempre arriba');
    const m = motionCount(up, low);
    if (want === 'paralelo') assert.ok(m.paralelo === 3 && !m.contrario && !m.oblicuo, 'paralelo');
    if (want === 'contrario') assert.ok(m.contrario === 3, 'contrario');
    if (want === 'oblicuo') assert.ok(m.oblicuo === 3 && !m.paralelo && !m.contrario, 'oblicuo');
  });
});

test('los movimientos de las preguntas «escucharMovimiento» del catálogo coinciden con su respuesta', () => {
  let n = 0;
  level3().units.flatMap(u => u.exercises).flatMap(e => e.params.preguntas || e.params.items || []).filter(q => q.tipo === 'escucharMovimiento').forEach(q => {
    const m = motionCount(scoreTokens(q.play.partitura), scoreTokens(q.play.voz2));
    const kind = ['paralelo', 'contrario', 'oblicuo'][['Paralelo', 'Contrario', 'Oblicuo'].indexOf(q.options[q.answer])];
    const found = m.contrario && !m.oblicuo && !m.paralelo ? 'contrario' : m.oblicuo && !m.contrario && !m.paralelo ? 'oblicuo' : m.paralelo && !m.contrario && !m.oblicuo ? 'paralelo' : 'mixto';
    assert.equal(found, kind, q.id);
    n++;
  });
  assert.ok(n >= 2, `${n} preguntas`);
});

// ---------- Creatividad ----------
test('creatividad: forma de la menor, ligaduras de expresión y de pulso, dos voces y especies de intervalo', () => {
  const am = tonic => scoreTokens('| A4q B4q C5q B4q | G#4q B4q A4h |').map(t => ({ ...t }));
  assert.equal(minorFormOk(am(), 'armónica', 9), true);
  assert.equal(minorFormOk(scoreTokens('| A4q B4q C5q B4q | G4q B4q A4h |'), 'armónica', 9), false, 'sol natural');
  assert.equal(minorFormOk(scoreTokens('| A4q B4q C5q D5q | E5q F#5q G#5q A5q | G5q F5q E5q D5q |'), 'melódica', 9), true);
  assert.equal(minorFormOk(scoreTokens('| A4q B4q C5q D5q | E5q F5q G5q A5q |'), 'melódica', 9), false, 'sube con 6.º y 7.º naturales');
  assert.equal(minorFormOk(scoreTokens('| A4q B4q C5q D5q | E5q F#5q G#5q A5q | G#5q F#5q E5q D5q |'), 'melódica', 9), false, 'baja con sostenidos');
  const slur = [{ step: 30, dur: 'q', slur: true }, { step: 32, dur: 'q' }, { step: 32, dur: 'q', slur: true }, { step: 32, dur: 'q' }];
  assert.equal(countSlurs(slur), 1, 'una curva entre notas de distinta altura; sobre la misma altura no cuenta');
  const ties = [{ step: 30, dur: 'e', tie: true }, { step: 30, dur: 'e' }, { step: 32, dur: 'q', tie: true }, { step: 32, dur: 'q' }];
  assert.equal(countBeatTies(ties, '2/4'), 0, 'la 1.ª empieza en el pulso y la 2.ª continúa en el contratiempo; la 3.ª pasa de compás');
  const cross = [{ step: 30, dur: 'q' }, { step: 30, dur: 'e', tie: true }, { step: 30, dur: 'e' }, { step: 32, dur: 'q' }];
  assert.equal(countBeatTies(cross, '4/4'), 0, 'continuación en medio pulso: no cruza un pulso');
  const beat = [{ step: 30, dur: 'e' }, { step: 30, dur: 'e', tie: true }, { step: 30, dur: 'e' }, { step: 32, dur: 'e' }];
  assert.equal(countBeatTies(beat, '2/4'), 1, 'la continuación cae en el 2.º pulso');
  // dos voces
  const given = scoreTokens('| F#5q E5q D5q C#5q | B4q C#5q D5h |');
  const ok = scoreTokens('| A4q B4q F#4q A4q | D4q C#5q.. |'.replace('C#5q..', 'A4h'));
  assert.equal(motionCount(given, scoreTokens('| D5q E5q F#4q A4q | D4q E4q D4h |')).below, false, 'la primera nota no va debajo');
  assert.equal(motionCount(given, scoreTokens('| A4q B4q F#4q A4q | D4q E4q A4h |')).below, true);
  assert.ok(ok);
  const m = motionCount(given, scoreTokens('| A4q A4q F#4q A4q | D4q E4q A4h |'));
  assert.ok(m.oblicuo >= 1 && m.contrario >= 1);
  // intervalos con especie en checkComposition
  const comp = scoreTokens('| A3q C#4q E4q A4q | A4w |');
  const rules = checkComposition(comp, { barBeats: 4, bars: 2, intervals: ['3M', '3m', '4J'] });
  assert.equal(rules.rules.find(r => r.id === 'intervalos').ok, true);
  assert.equal(checkComposition(comp, { barBeats: 4, bars: 2, intervals: ['5J'] }).rules.find(r => r.id === 'intervalos').ok, false);
  const aug = scoreTokens('| F4q B4q C5q A4q | C4w |');
  assert.equal(checkComposition(aug, { barBeats: 4, bars: 2, intervals: ['4A'] }).rules.find(r => r.id === 'intervalos').ok, true);
  assert.equal(checkComposition(scoreTokens('| F4q Bb4q C5q A4q | C4w |'), { barBeats: 4, bars: 2, intervals: ['4A'] }).rules.find(r => r.id === 'intervalos').ok, false);
  assert.equal(checkComposition(comp, { barBeats: 4, bars: 2, intervals: [3, 4] }).rules.find(r => r.id === 'intervalos').ok, true, 'los números del Nivel 2 siguen valiendo');
});

test('creatividad del Nivel 3: las restricciones se entienden y cada parte tiene su nota', () => {
  const crea = level3().units.flatMap(u => u.exercises).filter(e => e.section === 'creatividad');
  assert.equal(crea.length, 16);
  crea.forEach(e => {
    const rs = e.params.restricciones;
    assert.ok(rs.compas && rs.compases, e.id);
    (rs.notas || []).forEach(n => assert.ok(Number.isFinite(stepOf(n)), `${e.id}: ${n}`));
    if (rs.dada) checkBars(e.id, rs.dada, rs.compas);
    String(rs.tonalidad || '').split('|').filter(Boolean).forEach(k => assert.ok(Number.isFinite(keyTonic(k).midi), `${e.id}: ${k}`));
  });
});

test('la nota ligada en la lectura rítmica y la ligadura olvidada: la continuación es el error «liga»', () => {
  const tokens = scoreTokens('| C5e C5e~ C5e C5e | C5q C5q |');
  const tl = readingTimeline({ compas: '2/4' }, tokens);
  assert.equal(tl.events.filter(e => e.cont).length, 1);
  assert.equal(tl.events.find(e => e.cont).beat, 1);
  const prosody = prosodyIssues({ partitura: '| C5e C5e~ C5e C5e | C5q C5q |', compas: '2/4' }, [['A', 'ma', 'sol'], ['ro', 'ja']], 'Ama sol roja');
  assert.equal(prosody.filter(i => i.word === 'letra desalineada').length, 0, 'la continuación de la ligadura dentro del compás no lleva sílaba');
});

import { midiOf as midiOfName } from '../js/lm/notes.js';
