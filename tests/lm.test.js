// Curso de Lenguaje Musical: catálogo del nivel 1 (contrato de ids y coherencia del contenido), registro de
// resultados (hook del Aula) y corrección de cada tipo nuevo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LM_LEVELS, LM_SECTIONS, LM_VARIANTS, LM_SKILLS, TYPES, LM_CATALOG, lmId, parseLmId, lmExercise, allLmExercises, siblingId, lmQuestion, lmSong,
} from '../js/lm/catalog.js';
import { makeResult, applyResult, EMPTY_LM, unitProgress, skillSummary, recordLmResult, onLmResult, lmState } from '../js/lm/results.js';
import {
  starsFor, pctOf, gradeSung, singMark, gradeWriting, barlineGaps, gradeBarlines, stopMark, gradeStop,
  gradeAgility, orderMark, scaleMark, skillsOf, checkComposition, mistakeCodes, SING_TOLERANCE, gradeTen,
} from '../js/lm/grade.js';
import {
  interval, scale, degreeNote, centsAnyOctave, voiceTonic, parseTokens, tokensText, tokensToNotes, positionText, stepOf, scoreTokens, barBeatsOf, solfaToName,
} from '../js/lm/notes.js';
import { stopRoundOf, stopKinds, stopWindow, stopBase, ostinatoTokens, gainsFor, genRhythm, genMelody, meterQuestions, semitoneQuestions, modeQuestions } from '../js/lm/gen.js';
import { agilityPlan, chanceCorrected } from '../js/lm/tasks-agility.js';
import { getState } from '../js/store.js';
import { readFileSync } from 'node:fs';

// ---------- Catálogo ----------
test('cada ejercicio cumple el contrato de ids y el catálogo plano del Aula coincide', () => {
  assert.deepEqual(LM_LEVELS.map(l => l.level), [1, 2, 3, 4]);
  const ids = new Set();
  allLmExercises().forEach(e => {
    assert.match(e.id, /^lm\d+-u\d+-[a-z]+-[abc]-(facil|medio)$/, e.id);
    assert.ok(!ids.has(e.id), `id repetido ${e.id}`);
    ids.add(e.id);
    assert.equal(e.id, lmId(e));
    assert.deepEqual(parseLmId(e.id), { level: e.level, unit: e.unit, section: e.section, letter: e.letter, variant: e.variant });
    assert.ok(LM_SECTIONS.includes(e.section) && LM_VARIANTS.includes(e.variant));
    assert.ok(TYPES[e.type], `tipo ${e.type}`);
    assert.ok(e.title, e.id);
    assert.ok(e.skills.every(s => LM_SKILLS.includes(s)), e.id);
    assert.equal(lmExercise(e.id), e);
  });
  assert.deepEqual(LM_CATALOG.map(x => x.id), [...ids]);
});

test('el nivel 1 tiene sus 8 unidades y 202 ejercicios, con el bloque de instrumento tras el ritmo', () => {
  const level = LM_LEVELS[0];
  assert.equal(level.units.length, 8);
  assert.equal(level.units.flatMap(u => u.exercises).length, 202);
  level.units.forEach(u => {
    const kinds = u.blocks.map(b => (b.kind === 'instrument' ? 'instrumento' : b.section));
    assert.deepEqual(kinds.slice(0, 3), ['teoria', 'ritmo', 'instrumento'], `unidad ${u.unit}`);
    LM_SECTIONS.forEach(s => assert.ok(kinds.includes(s), `unidad ${u.unit}: falta ${s}`));
    assert.ok(u.song && u.song.partitura && u.listening && u.listening.fragmento, `unidad ${u.unit}: canción y audición`);
    u.exercises.forEach(e => assert.ok(e.variant === 'medio' || lmExercise(siblingId(e.id, 'medio')), `${e.id} sin su Media`));
  });
  const types = new Set(allLmExercises().map(e => e.type));
  Object.keys(TYPES).forEach(t => assert.ok(types.has(t), `nadie usa el tipo ${t}`));
  assert.equal(lmSong(1, 'lm1-u5-cancion').titulo, 'La escalera');
});

test('cotejo de las audiciones: sin «verificar» pendientes y con Fanny Hensel activa', () => {
  const units = LM_LEVELS[0].units;
  units.forEach(u => assert.equal(u.listening.fragmento.verificar, undefined, `unidad ${u.unit}`));
  const hensel = units[6].listening.extra;
  assert.match(hensel.obra, /Gartenlieder/);
  assert.equal(hensel.fragmento.voces.length, 2);
  assert.match(hensel.ficha.join(' '), /450/);
  assert.match(units[7].listening.fragmento.voces[0].partitura, /^\| G4q \|/, 'anacrusa de una negra');
  assert.equal(units[2].listening.fragmento.compas, '2/4');
  assert.equal(units[5].listening.fragmento.golpe.compas, 16);
  assert.equal(units[0].listening.fragmento.voces.length, 3, 'canon: violín 1, violín 2 y bajo');
});

test('ids mal formados no se aceptan', () => {
  ['', 'lm1-u1-ritmo-a', 'lm1-u1-otro-a-facil', 'lmx-u1-ritmo-a-facil', 'lm1-u1-ritmo-a-dificil'].forEach(id => assert.equal(parseLmId(id), null, id));
  assert.equal(lmExercise('lm9-u9-ritmo-a-facil'), null);
});

test('el contenido es coherente: partituras válidas, barras bien puestas, respuestas dentro de las opciones', () => {
  const scores = [];
  const walk = v => {
    if (typeof v === 'string' && /^\|/.test(v.trim()) && !v.includes('?')) scores.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  LM_LEVELS[0].units.forEach(u => walk(u.raw));
  assert.ok(scores.length > 100, `${scores.length} partituras`);
  scores.forEach(s => assert.doesNotThrow(() => scoreTokens(s), s));
  allLmExercises().forEach(e => {
    const p = e.params;
    (p.items || []).forEach(it => {
      if (it.tipo === 'barras') {
        const toks = scoreTokens(`| ${it.secuencia} |`);
        const first = scoreTokens(it.fuente.split('|').filter(x => x.trim())[0].replace(/^/, '| ') + ' |').reduce((s, t) => s + t.beats, 0);
        const pickup = first < barBeatsOf(it.compas) ? first : 0;
        assert.deepEqual(barlineGaps(toks.map(t => t.dur), barBeatsOf(it.compas), pickup), it.respuesta, it.id);
      }
      if (it.options && Number.isInteger(it.answer)) assert.ok(it.answer < it.options.length, it.id);
      if (it.tipo === 'tocarPentagrama' || it.tipo === 'escala') it.respuesta.forEach(n => assert.ok(Number.isFinite(stepOf(n)), it.id));
      if (it.tipo === 'nombrarNotas') it.respuesta.forEach(n => assert.ok(solfaToName(n), it.id));
    });
    (p.preguntas || []).forEach(q => assert.ok(q.answer < q.options.length, q.id));
    if (e.type === 'stop') assert.ok(p.base && p.base.partitura, e.id);
    if (e.type === 'agilidad') p.notas.forEach(n => assert.ok(Number.isFinite(stepOf(n)), e.id));
    if (e.type === 'creatividad') (p.restricciones.notas || []).forEach(n => assert.ok(Number.isFinite(stepOf(n)), e.id));
    if (e.type === 'repaso') {
      assert.equal(p.partes.reduce((s, x) => s + x.peso, 0), 100, e.id);
      p.partes.filter(x => x.competencia === 'teoria').forEach(x => [...x.params.propias, ...x.params.banco].forEach(id => assert.ok(lmQuestion(1, id), `${e.id}: ${id}`)));
    }
  });
});

// ---------- Resultados ----------
test('makeResult sanea el resultado según el contrato', () => {
  const r = makeResult('lm1-u1-ritmo-b-facil', { pct: 140, seconds: -3, skills: { ritmo: 88.6, magia: 50 }, mistakes: ['a', 'a', 'b', ...Array(20).fill(0).map((_, i) => `m${i}`)] }, 1000);
  assert.deepEqual(Object.keys(r).sort(), ['at', 'id', 'level', 'mistakes', 'pct', 'seconds', 'section', 'skills', 'stars', 'unit', 'variant'].sort());
  assert.equal(r.pct, 100);
  assert.equal(r.stars, 3);
  assert.equal(r.seconds, 0);
  assert.deepEqual(r.skills, { ritmo: 89 });
  assert.equal(r.mistakes.length, 10);
  assert.equal(r.mistakes[0], 'a');
  assert.deepEqual([r.level, r.unit, r.section, r.variant, r.at], [1, 1, 'ritmo', 'facil', 1000]);
  assert.throws(() => makeResult('nada', { pct: 1 }));
});

test('applyResult guarda el mejor y el último, los minutos del día y las competencias', () => {
  const id = 'lm1-u1-agilidad-a-facil';
  let lm = { ...EMPTY_LM };
  lm = applyResult(lm, makeResult(id, { pct: 80, seconds: 90, skills: { lectura: 80 }, mistakes: ['E4'] }), '2026-11-05');
  lm = applyResult(lm, makeResult(id, { pct: 50, seconds: 30, skills: { lectura: 50 }, mistakes: ['E4'] }), '2026-11-05');
  assert.equal(lm.best[id].pct, 80);
  assert.equal(lm.last[id].pct, 50);
  assert.equal(lm.days['2026-11-05'], 2);
  assert.deepEqual(lm.skills.lectura, [80, 50]);
  assert.equal(lm.mistakes.E4, 2);
  assert.deepEqual(skillSummary(lm).lectura, 65);
  assert.equal(skillSummary(lm).ritmo, null);
});

test('progreso de la unidad: mejor variante de cada ejercicio, estrellas y porcentaje', () => {
  let lm = { ...EMPTY_LM };
  lm = applyResult(lm, makeResult('lm1-u1-ritmo-b-facil', { pct: 95 }), '2026-11-05');
  lm = applyResult(lm, makeResult('lm1-u1-ritmo-b-medio', { pct: 70 }), '2026-11-05');
  lm = applyResult(lm, makeResult('lm1-u1-teoria-a-medio', { pct: 40 }), '2026-11-05');
  assert.equal(lm.best['lm1-u1-ritmo-b-medio'].stars, 1);
  const p = unitProgress(1, 1, lm);
  assert.equal(p.done, 2, 'Fácil y Media cuentan por separado; el 40 % no da estrellas');
  assert.equal(p.stars, 4);
  const exs = LM_LEVELS[0].units[0].exercises;
  assert.equal(p.total, exs.length);
  assert.equal(p.maxStars, exs.filter(e => e.section !== 'creatividad').length * 3, 'la creatividad no suma estrellas de la app');
});

test('recordLmResult guarda en state.lm y avisa a los oyentes (hook del Aula)', () => {
  const seen = [];
  const off = onLmResult(r => seen.push(r.id));
  const r = recordLmResult('lm1-u1-repaso-a-facil', { pct: 77, seconds: 60, skills: { teoria: 77 } }, { logMinutes: false });
  off();
  recordLmResult('lm1-u1-repaso-a-facil', { pct: 10 }, { logMinutes: false });
  assert.deepEqual(seen, ['lm1-u1-repaso-a-facil']);
  assert.equal(lmState().best['lm1-u1-repaso-a-facil'].pct, 77);
  assert.equal(getState().lm.last['lm1-u1-repaso-a-facil'].pct, 10);
  assert.equal(r.stars, 1, '77 %: una estrella (contrato: 60 / 80 / 90)');
});

// ---------- Corrección ----------
test('estrellas del contrato (60 / 80 / 90) y nota de 1 a 10 de la rúbrica', () => {
  assert.deepEqual([0, 59, 60, 79, 80, 89, 90, 100].map(starsFor), [0, 0, 1, 1, 2, 2, 3, 3]);
  assert.equal(pctOf(['ok', 'near', 'bad', 'ok']), 63);
  assert.equal(pctOf(['ok'], 1), 50);
  assert.deepEqual(mistakeCodes(['x', 'x', null, 'muy-largo-codigo-de-error']), ['x', 'muy-largo-codigo']);
  assert.equal(gradeTen(100, 'facil'), 8);
  assert.equal(gradeTen(96, 'medio', true), 10);
  assert.equal(gradeTen(90, 'medio'), 9);
  assert.equal(gradeTen(60, 'medio'), 5);
  assert.equal(gradeTen(50, 'medio'), 3, 'por debajo del 60 % no se aprueba');
  assert.equal(gradeTen(0, 'medio'), 0, 'sin hacer nada, un 0');
  assert.equal(gradeTen(10, 'medio'), 1);
});

test('entonación: la voz vale en cualquier octava y se corrige con tolerancia según la variante', () => {
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  assert.ok(Math.abs(centsAnyOctave(hz(48), 60)) < 0.01, 'Do3 cantado para Do4');
  assert.ok(Math.abs(centsAnyOctave(hz(72) * 2 ** (20 / 1200), 60) - 20) < 0.01);
  assert.ok(Math.abs(centsAnyOctave(hz(59), 60) + 100) < 0.01);
  assert.equal(singMark(40, SING_TOLERANCE.facil), 'ok');
  assert.equal(singMark(40, SING_TOLERANCE.medio), 'near');
  assert.equal(SING_TOLERANCE.medio, 35);
  assert.equal(singMark(null, 30), 'bad');
  const g = gradeSung(['C4', 'D4', 'E4'], [5, 70, null], { tolerance: 50 });
  assert.deepEqual(g.marks, ['ok', 'near', 'bad']);
  assert.equal(g.pct, 50);
  assert.deepEqual(g.mistakes, ['afin+', 'E4-sil']);
  assert.deepEqual(gradeSung(['E4'], [100]).mistakes, ['E4>F4']);
  assert.equal(voiceTonic('C4', 50), 'C3');
  assert.equal(voiceTonic('C4', 64), 'C4');
});

test('escribir: altura y figura bien (verde), una de las dos (amarillo), nada (rojo); las de más restan', () => {
  const want = parseTokens('C4q D4q E4h');
  assert.deepEqual(gradeWriting(want, parseTokens('C4q D4h F4q')).marks, ['ok', 'near', 'bad']);
  const extra = gradeWriting(want, parseTokens('C4q D4q E4h C4q'));
  assert.deepEqual(extra.marks, ['ok', 'ok', 'ok']);
  assert.equal(extra.pct, 75);
  assert.ok(extra.mistakes.includes('sobra'));
  assert.equal(gradeWriting(want, parseTokens('C4q D4h E4q'), { pitchOnly: true }).pct, 100);
  assert.equal(tokensText(parseTokens('C4q Rq E4h')), 'C4q Rq E4h');
  assert.deepEqual(tokensToNotes(parseTokens('C4q Rh')).map(n => [n.start, n.beats, n.rest]), [[0, 1, false], [1, 2, true]]);
});

test('barras de compás: huecos correctos, barras que faltan y que sobran', () => {
  assert.deepEqual(barlineGaps('q q h q q h'.split(' '), 2), [1, 2, 4]);
  assert.deepEqual(barlineGaps('h q q e e q h. q q q e e h'.split(' '), 3), [1, 5, 6, 9]);
  assert.deepEqual(barlineGaps('q q q h e e q q q h q'.split(' '), 4, 1), [0, 3, 8], 'con anacrusa de una negra');
  assert.equal(gradeBarlines([1, 2, 4], [1, 2, 4]).pct, 100);
  const g = gradeBarlines([1, 2, 4], [1, 3]);
  assert.deepEqual(g.marks.map(m => m.kind), ['bien', 'falta', 'sobra', 'falta']);
  assert.equal(g.pct, 0);
  assert.deepEqual(g.mistakes, ['barra-falta', 'barra-sobra']);
});

test('STOP: se para a tiempo dentro de la ventana; la ronda cambia una figura y dice dónde', () => {
  const base = scoreTokens('| C5q C5q | C5h | C5e C5e C5q | C5q Rq |');
  const r = stopRoundOf(base, { kinds: ['h-corta'], seed: 1, barBeats: 2 });
  assert.equal(r.code, 'h-corta');
  assert.equal(r.errorBeat, 3);
  const j = stopRoundOf(base, { kinds: ['ee>q'], seed: 1, barBeats: 2 });
  assert.equal(j.errorBeat, 4.5);
  assert.equal(j.played.reduce((s, t) => s + t.beats, 0), 8);
  assert.equal(stopMark(4, 4.5, 2), 'ok');
  assert.equal(stopMark(4, 6.5, 2), 'near');
  assert.equal(stopMark(4, 3, 2), 'bad');
  assert.equal(stopMark(4, null, 2), 'bad');
  const g = gradeStop([{ errorBeat: 2, pressBeat: 2.4 }, { errorBeat: 3, pressBeat: 1 }, { errorBeat: 5, pressBeat: null }]);
  assert.deepEqual(g.marks, ['ok', 'bad', 'bad']);
  assert.deepEqual(g.mistakes, ['stop-pronto', 'stop-no']);
  assert.deepEqual(stopKinds(['blanca acortada', 'corcheas↔negra']), ['h-corta', 'q>ee', 'ee>q']);
  assert.equal(stopWindow('1 compás', 4), 4);
  assert.equal(stopWindow('½ pulso', 4), 0.5);
});

test('STOP: cada error del catálogo cambia el ritmo de la lectura de su unidad', () => {
  allLmExercises().filter(e => e.type === 'stop').forEach(e => {
    const base = scoreTokens(e.params.base.partitura);
    const barBeats = barBeatsOf(e.params.base.compas);
    const kinds = stopKinds(e.params.errores);
    const opts = { kinds, barBeats, matices: e.params.base.matices || [], pickup: e.params.base.anacrusa || 0 };
    const ost = kinds.includes('voz') ? ostinatoTokens(base, e.params.base) : null;
    const voice = list => (list || []).map(t => [t.rest, t.dur, t.midi, Math.round((t.gain || 0) * 100), t.hold || 0]);
    const sound = r => JSON.stringify([r.offset, voice(r.played), voice(r.ostinato)]);
    const correct = sound({ offset: opts.pickup ? barBeats - opts.pickup : 0, played: stopBase(base, { matices: opts.matices }), ostinato: ost });
    opts.ostinato = ost;
    const avoid = new Set();
    for (let k = 0; k < (e.params.rondas || 3); k++) {
      const r = stopRoundOf(base, { ...opts, seed: 11 + k * 101, avoid });
      assert.ok(r.errorBeat >= 0 && r.code, e.id);
      assert.notEqual(sound(r), correct, `${e.id}: la ronda ${k + 1} suena distinta (${r.code})`);
      assert.ok(!avoid.has(r.key), `${e.id}: ronda repetida ${r.key}`);
      avoid.add(r.key);
    }
    // los errores que pide el catálogo existen de verdad (matiz, calderón, voz, anacrusa…), no solo corcheas
    kinds.forEach(k => assert.ok(['q>ee', 'ee>q', 'Rq>q', 'q>Rq', 'h-corta', 'w-corta', 'Rw-salto', 'compas', 'matiz', 'calderon', 'voz', 'anacrusa'].includes(k), k));
  });
});

test('generadores con semilla: ritmos que completan el compás, melodías que acaban en casa y preguntas de oído', () => {
  const rh = genRhythm({ figuras: ['q', 'Rq', 'e', 'h'], barBeats: 4, bars: 4, seed: 9 });
  assert.equal(rh.reduce((s, t) => s + t.beats, 0), 16);
  assert.deepEqual(genRhythm({ figuras: ['q', 'e'], barBeats: 2, bars: 2, seed: 3 }), genRhythm({ figuras: ['q', 'e'], barBeats: 2, bars: 2, seed: 3 }));
  const mel = genMelody({ notas: ['G4', 'E4', 'A4'], bars: 2, barBeats: 2, seed: 4 });
  assert.equal(mel[mel.length - 1].name, 'G4');
  meterQuestions(6, 1).forEach(q => assert.equal(scoreTokens(q.play.partitura).length, [2, 3, 4][q.answer] * 4));
  semitoneQuestions(6, 2).forEach(q => {
    const n = scoreTokens(q.play.partitura).filter(t => !t.rest);
    assert.equal(n[q.answer + 1].midi - n[q.answer].midi, 1);
  });
  modeQuestions(6, 3).forEach(q => assert.equal(q.options[q.answer], q.play.partitura.includes('A3') ? 'Menor' : 'Mayor'));
  assert.equal(solfaToName('sol4'), 'G4');
});

test('agilidad: aciertos sobre el total; a tempo, el tiempo por nota baja; la posición se dice sin el nombre', () => {
  assert.equal(gradeAgility(12, 0, 12).pct, 100);
  assert.equal(gradeAgility(9, 0, 12).pct, 75);
  const easy = agilityPlan({ notas: ['G4', 'E4'], cantidad: 12, segundosPorNota: 4, modo: 'nombrar' }, 1);
  assert.equal(easy.notes.length, 16, 'con dos o tres notas, al menos 16');
  // con dos notas: como mucho dos iguales seguidas, y ni alternar ni repetir siempre la misma aprueba
  for (let seed = 1; seed <= 40; seed++) {
    const { notes } = agilityPlan({ notas: ['G4', 'E4'], cantidad: 12, segundosPorNota: 4, modo: 'nombrar' }, seed);
    notes.slice(2).forEach((n, i) => assert.ok(!(n === notes[i] && n === notes[i + 1]), 'como mucho dos seguidas'));
    for (const guess of [i => (i % 2 ? 'G4' : 'E4'), i => (i % 2 ? 'E4' : 'G4'), () => 'G4', () => 'E4']) {
      assert.ok(notes.filter((n, i) => n === guess(i)).length / notes.length < 0.6, `semilla ${seed}: adivinar aprueba`);
    }
    // ni «la misma que antes» ni «la contraria de antes»
    const moves = notes.slice(1).map((n, i) => n === notes[i]);
    const same = moves.filter(Boolean).length / moves.length;
    assert.ok(same < 0.6 && 1 - same < 0.6, `semilla ${seed}: misma/contraria ${same}`);
  }
  const fast = agilityPlan({ notas: ['G4', 'E4', 'A4'], modo: 'leer-a-tempo', tempo: [60, 90], compases: 8, compas: '2/4' }, 2);
  assert.equal(fast.notes.length, 16);
  assert.ok(fast.secs[0] > fast.secs[fast.secs.length - 1]);
  // la nota descuenta el azar: a ciegas con dos botones (50 %) da 0, todo bien da 100
  assert.equal(chanceCorrected(50, 2), 0);
  assert.equal(chanceCorrected(100, 2), 100);
  assert.equal(chanceCorrected(80, 2), 60);
  assert.equal(chanceCorrected(33, 3), 0);
  assert.equal(positionText(stepOf('G4')), 'segunda línea');
  assert.equal(positionText(stepOf('F4')), 'primer espacio');
  assert.equal(positionText(stepOf('C4')), 'línea adicional 1 por debajo');
  assert.equal(positionText(stepOf('A5')), 'línea adicional 1 por encima');
  assert.equal(positionText(stepOf('B2'), 'bass'), 'segunda línea');
});

test('teoría: intervalos con número y calidad, escalas y ordenar', () => {
  assert.equal(interval('C4', 'E4').code, '3M');
  assert.equal(interval('E4', 'G4').code, '3m');
  assert.equal(interval('G4', 'C5').code, '4J');
  assert.equal(interval('C4', 'G4').code, '5J');
  assert.equal(interval('E4', 'F4').code, '2m');
  assert.equal(interval('F4', 'B4').code, '4A');
  assert.equal(interval('C4', 'C5').code, '8J');
  assert.deepEqual(scale('C4'), ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']);
  assert.deepEqual(scale('A3', 'menor'), ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4']);
  assert.deepEqual(scale('G4').slice(-2), ['F#5', 'G5']);
  assert.equal(degreeNote('C4', 5), 'G4');
  assert.equal(degreeNote('C4', 0), 'B3');
  assert.equal(orderMark(['a', 'b', 'c', 'd'], ['a', 'b', 'd', 'c']), 'near');
  assert.equal(orderMark(['a', 'b', 'c'], ['c', 'a', 'b']), 'bad');
  assert.equal(scaleMark(scale('C4'), scale('C4')), 'ok');
  assert.equal(scaleMark(scale('C4'), ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'A4', 'C5']), 'near');
  assert.deepEqual(skillsOf([{ skill: 'teoria', mark: 'ok' }, { skill: 'teoria', mark: 'bad' }, { skill: 'ritmo', mark: 'ok' }]), { teoria: 50, ritmo: 100 });
});

test('creatividad: reglas de la composición (restricciones del catálogo)', () => {
  const opts = { barBeats: 2, bars: 2, figures: ['q', 'h', 'Rq'], notes: [stepOf('C4'), stepOf('D4'), stepOf('E4')], endSteps: [stepOf('C4')] };
  assert.equal(checkComposition(parseTokens('C4q D4q C4h'), opts).pct, 100);
  const bad = checkComposition(parseTokens('C4q D4h E4q'), opts);
  assert.deepEqual(bad.rules.filter(r => !r.ok).map(r => r.id), ['compases', 'final']);
  assert.equal(bad.pct, 60);
  assert.deepEqual(bad.mistakes, ['r-compases', 'r-final']);
  const strict = checkComposition(parseTokens('E4q F4q E4q D4q C4w'), { barBeats: 4, bars: 2, endSteps: [stepOf('C4'), stepOf('C5')], endFigure: 'w', maxLeap: 1, mustFigures: { w: 1 }, semitones: [[stepOf('E4'), stepOf('F4')]] });
  assert.equal(strict.pct, 100, JSON.stringify(strict.rules));
  const leap = checkComposition(parseTokens('C4q G4q C4h'), { barBeats: 4, bars: 1, maxLeap: 1, semitones: [[stepOf('B4'), stepOf('C5')]] });
  assert.deepEqual(leap.rules.filter(r => !r.ok).map(r => r.id), ['saltos', 'semitonos']);
  assert.equal(checkComposition(parseTokens('C5q Rq C5e C5e C5q'), { barBeats: 2, bars: 2, figures: ['q', 'e', 'Rq'] }).pct, 100);
});

test('inglés: vara del trombón, antetítulo «estilo · autor» y textos del curso', async () => {
  const { translate } = await import('../js/i18n.js');
  assert.equal(translate('Vara'), 'Slide');
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(n => translate(`${n}.ª`)), ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th']);
  assert.equal(translate('Clásica · Ludwig van Beethoven'), 'Classical · Ludwig van Beethoven');
  assert.equal(translate('Populares · Bach'), 'Popular · Bach');
  assert.equal(translate('Pregunta 2 de 5'), 'Question 2 of 5');
  assert.equal(translate('Negra C5, Negra C5, Silencio de negra'), 'Quarter note C5, Quarter note C5, Quarter rest');
  assert.equal(translate('Nota 3: segunda línea'), 'Note 3: 2nd line');
  assert.equal(translate('Probar la versión Media'), 'Try the Medium version');
  const { LM_CONTENT_EN_1 } = await import('../js/i18n-en-lm-content-1.js');
  const { LM_CONTENT_EN_2 } = await import('../js/i18n-en-lm-content-2.js');
  const { LM_COTEJO_EN } = await import('../js/i18n-en-lm.js');
  const dict = { ...LM_CONTENT_EN_1, ...LM_CONTENT_EN_2, ...LM_COTEJO_EN };
  // todas las preguntas, fichas y títulos del nivel tienen su inglés
  const missing = [];
  allLmExercises().forEach(e => {
    [e.title, ...(e.params.items || []).flatMap(it => [it.q, it.why, ...(it.options || [])]), ...(e.params.preguntas || []).flatMap(q => [q.q, q.why, ...q.options])]
      .filter(x => x && /\p{Ll}{2}/u.test(x)) // «AB», «ABA» (formas) y «2/4» se escriben igual.forEach(x => { if (!(x in dict) && translate(x) === x) missing.push(x); });
  });
  LM_LEVELS[0].units.forEach(u => [u.title, u.goal, ...u.listening.ficha, ...(u.listening.extra ? u.listening.extra.ficha : [])].forEach(x => { if (!(x in dict)) missing.push(x); }));
  assert.deepEqual([...new Set(missing)], []);
});

test('Dictados con las figuras de la unidad: células permitidas, 3/4 en el rítmico 3 y sin figuras aún no vistas', async () => {
  const { rhythmDictation, limitedConfig, levelConfig } = await import('../js/dictation.js');
  const d = rhythmDictation({ level: 2, meter: '2/4', bars: 4, seed: 1, cells: ['q', 'rq'] });
  assert.ok(d.notes.every(n => n.beats === 1), d.score);
  const t = rhythmDictation({ level: 3, meter: '3/4', bars: 2, seed: 9, cells: ['h', 'qq', 'q', 'rq', 'ee'] });
  assert.equal(t.meter, '3/4');
  assert.ok(t.notes.every(n => [0.5, 1, 2].includes(n.beats)), t.score);
  assert.deepEqual(limitedConfig(levelConfig(3, true), {}), levelConfig(3, true), 'sin células, el nivel de siempre');
});

test('Dictados desde el curso: menor natural en la tonalidad pedida y anacrusa contada sobre la claqueta', async () => {
  const { melodicDictation, rhythmDictation, countInPlan, withPickup } = await import('../js/dictation.js');
  const { instrumentById } = await import('../js/instruments.js');
  const m = melodicDictation(instrumentById('violin'), { level: 3, meter: '4/4', bars: 4, seed: 7, minor: 'natural', key: 'Am' });
  assert.equal(m.key, 'Am');
  assert.ok(!m.score.includes('G#'), 'menor natural: sin sensible');
  const r = rhythmDictation({ level: 3, meter: '4/4', bars: 4, seed: 3, anacrusa: true });
  assert.equal(r.lead, 3);
  assert.match(r.score, /^\| Rh\. C5q \|/);
  assert.equal(r.totalBeats, 16, 'mismos compases');
  assert.deepEqual(countInPlan(r), { clicks: 7, bpm: r.bpm, accents: [0, 4] });
  assert.deepEqual(withPickup([[1, 1], [2], [1, 1], [2]], 2), [[-1, 1], [2], [1, 1], [1, -1]]);
});

test('canción cantada a tempo: afinación y ataques de cada nota por separado', async () => {
  const { gradeTimedTake, attacksOf } = await import('../js/lm/tasks-song.js');
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  const notes = [{ midi: 67, start: 0, beats: 1 }, { midi: 64, start: 1, beats: 1 }, { midi: 67, start: 2, beats: 1 }];
  // a 60 BPM: sol a tiempo, mi 0,3 s tarde, el último sol sin cantar
  const frames = [];
  for (let k = 0; k < 120; k++) {
    const t = k / 40;
    const freq = t < 0.95 ? hz(55) : t >= 1.3 && t < 1.95 ? hz(64) : null; // el primero, una octava más grave
    frames.push({ t: 10 + t, freq });
  }
  assert.deepEqual(attacksOf(frames).map(t => Math.round((t - 10) * 100) / 100), [0, 1.3]);
  const g = gradeTimedTake(notes, frames, { t0: 10, spb: 1, tolerance: 50, attackTol: 0.18 });
  assert.deepEqual(g.map(x => x.pitch), ['ok', 'ok', 'bad']);
  assert.deepEqual(g.map(x => x.attack), ['ok', 'near', 'bad']);
});

test('matices de la lectura rítmica: forte más fuerte que piano y reguladores que crecen o decrecen', async () => {
  const { dynamicsChecks } = await import('../js/lm/dynamics.js');
  const matices = [{ compas: 1, signo: 'p' }, { compas: 3, signo: 'f' }, { compas: 5, signo: 'cresc', hasta: 6 }];
  const notes = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5].map(bar => ({ bar }));
  const good = dynamicsChecks(matices, notes, [1, 1, 1, 1, 2, 2, 2, 2, 1, 1.2, 1.4, 1.6, 1.8, 2]);
  assert.deepEqual([good.ok, good.total], [2, 2]);
  const flat = dynamicsChecks(matices, notes, notes.map(() => 1));
  assert.deepEqual([flat.ok, flat.total], [0, 2]);
  assert.equal(dynamicsChecks(matices, notes, notes.map(() => null)).total, 0, 'sin golpes oídos no se juzga');
});

test('«En tu instrumento»: textos concretos de cada herramienta y escala menor del gimnasio', async () => {
  const { technique } = await import('../js/generate.js');
  const { instrumentById } = await import('../js/instruments.js');
  const am = technique('scale', 'Am', instrumentById('violin'), 60, 'q');
  assert.ok(!/#/.test(am.score), `la menor natural: ${am.score}`);
  const { translate } = await import('../js/i18n.js');
  assert.equal(translate('Escala de La menor'), 'A minor scale');
  assert.equal(translate('Lee o canta E4 como F4'), 'Reads or sings E4 as F4');
});

test('STOP con matiz, calderón, voz y anacrusa: el error se oye y se sabe dónde empieza', () => {
  const base = scoreTokens('| C5q C5q C5q C5q | C5h C5h | C5q C5q C5q C5q | C5w |');
  const matices = [{ compas: 1, signo: 'p' }, { compas: 3, signo: 'f' }, { compas: 4, signo: 'calderon' }];
  const cal = stopRoundOf(base, { kinds: ['calderon'], seed: 1, barBeats: 4, matices });
  assert.equal(cal.code, 'calderon');
  assert.equal(cal.errorBeat, 16, 'el calderón debía seguir sonando después de la redonda');
  const mat = stopRoundOf(base, { kinds: ['matiz'], seed: 2, barBeats: 4, matices });
  const bar = base[mat.index].bar;
  const loud = mat.played.filter(t => t.bar === bar).map(t => t.gain);
  const good = stopBase(base, { matices }).filter(t => t.bar === bar).map(t => t.gain);
  assert.notDeepEqual(loud, good);
  // voz cambiada: la lectura del alumno suena igual y la nota cambiada es del ostinato de la app
  const ost = ostinatoTokens(base, { compas: '4/4' });
  const voz = stopRoundOf(base, { kinds: ['voz'], seed: 3, barBeats: 4, ostinato: ost });
  assert.deepEqual(voz.played.map(t => t.midi), stopBase(base).map(t => t.midi));
  assert.notEqual(voz.ostinato[voz.index].midi, ost[voz.index].midi);
  assert.equal(voz.errorBeat, ost[voz.index].start);
  const pick = scoreTokens('| C5q | C5q C5q C5q C5q | C5h C5h | C5q C5q C5h | C5h. |');
  const ana = stopRoundOf(pick, { kinds: ['anacrusa'], seed: 4, barBeats: 4, pickup: 1 });
  assert.deepEqual([ana.offset, ana.errorBeat], [0, 0], 'la anacrusa cae en el primer pulso');
  assert.equal(stopRoundOf(pick, { kinds: ['q>ee'], seed: 4, barBeats: 4, pickup: 1 }).offset, 3, 'bien tocada, entra en el último pulso');
  const gains = gainsFor(scoreTokens('| C5q C5q | C5q C5q | C5q C5q | C5q C5q |'), [{ compas: 1, signo: 'p' }, { compas: 2, signo: 'cresc', hasta: 3 }, { compas: 4, signo: 'ff' }]);
  assert.ok(gains[2] < gains[5] && gains[7] > gains[0], 'p, crescendo y ff');
});

test('audición: el fragmento suena con sus matices, su crescendo y su accelerando', async () => {
  const { lmUnit } = await import('../js/lm/catalog.js');
  const src = readFileSync(new URL('../js/lm/runners.js', import.meta.url), 'utf8');
  assert.ok(src.includes('playEvents(workEvents(frag))'), 'la audición suena con workEvents');
  const haydn = lmUnit(1, 6).listening.fragmento;
  const grieg = lmUnit(1, 7).listening.fragmento;
  assert.ok(haydn.matices.some(m => m.signo === 'pp') && haydn.golpe, 'Haydn: p, pp y el golpe');
  assert.ok(grieg.tempoFinal > grieg.tempo && grieg.repetir > 1, 'Grieg: accelerando en las repeticiones');
});

test('audición sintetizada: Haydn repite en pp y remata ff; Grieg acelera y crece', async () => {
  const { workEvents } = await import('../js/lm/runners.js');
  const { lmUnit } = await import('../js/lm/catalog.js');
  const haydn = lmUnit(1, 6).listening.fragmento;
  const spb = 60 / haydn.tempo;
  const h = workEvents(haydn);
  const at = beat => h.find(e => Math.abs(e.at - beat * spb) < 1e-6 && e.gain <= 1);
  assert.ok(at(16).gain < at(0).gain, 'la repetición (compás 9) suena más suave');
  assert.ok(h.filter(e => e.gain > 1).length >= 6, 'el golpe: acorde de toda la orquesta');
  const g = workEvents(lmUnit(1, 7).listening.fragmento);
  assert.ok(g[g.length - 1].gain > g[0].gain, 'crescendo');
  const gap = (k) => g[k + 1].at - g[k].at;
  assert.ok(gap(g.length - 3) < gap(0), 'accelerando: al final las corcheas van más deprisa');
});

test('pentagrama: corcheas por parejas con barra, compases completos y la anacrusa en su compás', async () => {
  const { layoutTokens } = await import('../js/lm/staff-lm.js');
  const lay = layoutTokens(scoreTokens('| G4q | E4e E4e G4q G4q | C5e C5e D5h |'), { barBeats: 3, pickup: 1 });
  assert.deepEqual(lay.map(x => `${x.bar}${x.barEnd ? '|' : ''}${x.beam ? x.beam[0] : ''}`), ['0|', '1s', '1e', '1', '1|', '2s', '2e', '2']);
  assert.equal(lay[1].up, lay[2].up, 'las dos corcheas, con la plica hacia el mismo lado');
});

test('letra: guion entre las sílabas de una misma palabra (con el texto seguido de la canción)', async () => {
  const { hyphenate, SONG_WORDS } = await import('../js/lm/tasks-voice.js');
  assert.deepEqual(hyphenate(['La', 'bri', 'sa', 'me', 'can', 'ta'], 'La brisa me canta'), ['La', 'bri-', 'sa', 'me', 'can-', 'ta']);
  LM_LEVELS[0].units.forEach(u => {
    const syl = u.song.letra.flat();
    const out = hyphenate(syl, SONG_WORDS[u.song.titulo]);
    const rebuilt = out.join(' ').replace(/- /g, '').replace(/\s+/g, ' ');
    assert.equal(rebuilt.replace(/[^\p{L} ]/gu, '').toLowerCase(), SONG_WORDS[u.song.titulo].replace(/[^\p{L} ]/gu, '').toLowerCase().replace(/\s+/g, ' ').trim(), u.song.titulo);
  });
});

test('repaso: melodías con las notas de la unidad, con su altura y acabando en la tónica', () => {
  const m = genMelody({ notas: ['G4', 'E4', 'A4', 'C4'], bars: 2, barBeats: 4, seed: 3, tonic: 'C4' });
  assert.ok(m.every(t => Number.isFinite(t.midi) && Number.isFinite(t.step)), 'cada nota con su midi (antes se colgaba la lectura cantada)');
  assert.equal(m[0].name, 'C4');
  assert.equal(m[m.length - 1].name, 'C4');
  assert.ok(m.every(t => ['G4', 'E4', 'A4', 'C4'].includes(t.name)), 'solo notas de la unidad');
});

test('STOP: se sortea primero el tipo de error; los propios de la unidad salen por turnos', () => {
  const base = scoreTokens('| C5q C5q C5q C5q | C5h C5h | C5q C5q C5q C5q | C5w |');
  const kinds = ['h-corta', 'q>ee', 'ee>q'];
  const avoid = new Set();
  const codes = [0, 1, 2].map(k => { const r = stopRoundOf(base, { kinds, seed: 5 + k * 101, barBeats: 4, avoid, round: k }); avoid.add(r.key); return r.code; });
  assert.equal(codes[0], 'h-corta');
  assert.ok(codes.includes('q>ee'));
});

test('creatividad: reglas nuevas (anacrusa, una figura en cada compás, nota en el primer tiempo, notas obligatorias, reglas externas)', () => {
  const pick = checkComposition(parseTokens('G4q C5q C5q B4q A4q G4q'), { barBeats: 2, bars: 3, pickup: 1 });
  assert.equal(pick.pct, 100, JSON.stringify(pick.rules));
  const each = checkComposition(parseTokens('C5e C5e C5q C5q C5q'), { barBeats: 2, bars: 2, mustFigures: { e: 'en cada compás' } });
  assert.deepEqual(each.rules.filter(r => !r.ok).map(r => r.id), ['incluye']);
  const first = checkComposition(parseTokens('Rq C5h C5q C5q C5q'), { barBeats: 3, bars: 2, firstBeatNote: true });
  assert.deepEqual(first.rules.filter(r => !r.ok).map(r => r.id), ['tiempo1']);
  const d5 = checkComposition(parseTokens('C4q D5q'), { barBeats: 2, bars: 1, mustFigures: { D5: 1 }, extra: [{ id: 'signos', ok: false }] });
  assert.deepEqual(d5.rules.filter(r => !r.ok).map(r => r.id), ['signos']);
});

// ---------- Ilustraciones de la teoría ----------
test('teoría: cada tarjeta del nivel 1 tiene su ilustración accesible (texto alternativo y versión fija)', async () => {
  const { figureHtml, CARD_FIGURE, FIGURES } = await import('../js/lm/figures/index.js');
  LM_LEVELS[0].units.forEach(u => u.raw.teoria.ficha.forEach((card, i) => {
    const key = `lm1-u${u.unit}-${i + 1}`;
    assert.equal(card.dibujo, CARD_FIGURE[key], key);
    assert.ok(FIGURES[card.dibujo], `${key}: ${card.dibujo}`);
    for (const lang of ['es', 'en']) {
      const html = figureHtml(card.dibujo, { lang, nom: 'eu' });
      assert.match(html, /<svg [^>]*role="(img|group)"[^>]*aria-label="[^"]{20,}"/, `${key} ${lang}`);
      assert.match(html, /<title>[^<]{20,}<\/title>/, `${key} ${lang}`);
    }
    assert.doesNotMatch(figureHtml(card.dibujo, { still: true }), /<animate/, `${key}: la versión fija no se mueve`);
  }));
});

test('teoría: los rótulos de las ilustraciones tienen su inglés y los ejemplos solo usan notas ya aprendidas', async () => {
  const { figureHtml, FIGURES, FIG_EN } = await import('../js/lm/figures/index.js');
  const { LM_FIGURES_EN } = await import('../js/i18n-en-lm-figures.js');
  Object.keys(FIGURES).forEach(id => ['eu', 'us'].forEach(nom => figureHtml(id, { nom })));
  const missing = Object.keys(FIG_EN).filter(es => es !== FIG_EN[es] && !(es in LM_FIGURES_EN));
  assert.deepEqual(missing, []);
  LM_LEVELS[0].units.forEach(u => {
    const known = new Set(u.notes.map(solfaToName));
    u.raw.teoria.ficha.filter(c => c.ejemplo).forEach(c => scoreTokens(c.ejemplo).filter(t => !t.rest)
      .forEach(t => assert.ok(known.has(t.name), `U${u.unit} «${c.titulo}»: ${t.name}`)));
  });
});

test('sonido de las ilustraciones: calderón, notas a la vez y matices', async () => {
  const { figureNotes, gainsOf } = await import('../js/lm/tasks-quiz.js');
  const notes = figureNotes('| G4q A4q C5h^ |');
  assert.deepEqual(notes.map(n => n.beats), [1, 1, 5]);
  const chord = figureNotes('| C4q E4q C4h+E4h |');
  assert.deepEqual(chord.slice(2).map(n => [n.midi, n.start]), [[60, 2], [64, 2]]);
  const [pp] = gainsOf({ dyn: 'pp' }, [{}]);
  const [ff] = gainsOf({ dyn: 'ff' }, [{}]);
  assert.ok(pp < ff);
  const cresc = gainsOf({ dyn: 'cresc' }, [{}, {}, {}]);
  assert.ok(cresc[0] < cresc[2]);
});

test('U7 a dos voces: la voz 1 es el ostinato del ejercicio (su ritmo, repetido), no la lectura del alumno', () => {
  const lectura = lmExercise('lm1-u7-ritmo-a-medio').params;
  const reading = scoreTokens(lectura.partitura);
  const ost = ostinatoTokens(reading, lectura);
  const pattern = scoreTokens(lectura.voz1);
  assert.deepEqual(ost.slice(0, pattern.length).map(t => t.dur), pattern.map(t => t.dur));
  assert.notDeepEqual(ost.slice(0, 6).map(t => t.dur), reading.slice(0, 6).map(t => t.dur), 'ritmo propio');
  const end = t => t.start + t.beats;
  assert.equal(end(ost[ost.length - 1]), end(reading[reading.length - 1]), 'dura lo mismo que la lectura');
  // la lectura fácil (3/4) no trae voz1: la app le pone un ostinato de un compás
  const facil = lmExercise('lm1-u7-ritmo-a-facil').params;
  const ostF = ostinatoTokens(scoreTokens(facil.partitura), facil);
  assert.ok(ostF.length > 0 && ostF.every(t => t.midi === 60));
});

// ---------- Creatividad: composiciones correctas que imitan los modelos del curso (evaluación 4) ----------
test('creatividad: el final admite un silencio detrás y la forma mira el final de la frase, no la anacrusa siguiente', async () => {
  const { extraRules, phraseEnd } = await import('../js/lm/creative.js');
  const toks = s => parseTokens(s.replace(/\|/g, ' '));
  // U3 Media: acaba en do y lleva el silencio de blanca obligatorio
  const u3 = checkComposition(toks('C4h E4h | G4q A4q G4h | E4q G4q E4q G4q | C4h Rh'), { barBeats: 4, bars: 4, endSteps: [stepOf('C4')] });
  assert.ok(u3.rules.find(r => r.id === 'final').ok, 'C4h Rh acaba en do');
  // U8 Media, como «¿Te vienes?»: cada frase entra en anacrusa (Rq G4q) y la última acaba con silencio
  const song = toks('G4q | C5q B4q A4q G4q | D5h Rq G4q | C5q B4q A4q G4q | C5h Rq G4q | E4q F4q G4q A4q | B4h Rq G4q | A4q G4q F4q D4q | C4h Rq');
  const p = lmExercise('lm1-u8-creatividad-a-medio').params;
  const rules = extraRules({ rs: p.restricciones, p, tokens: song, given: null, signs: null, state: { pickup: 1 }, lyrics: 'te vie nes', barBeats: 4, bars: 8, dyn: [] });
  const byId = Object.fromEntries(rules.map(r => [r.id, r.ok]));
  assert.deepEqual([byId.pregunta, byId.respuesta, byId.formaB], [true, true, true]);
  const fin = checkComposition(song, { barBeats: 4, bars: 8, pickup: 1, endSteps: [stepOf('C4'), stepOf('C5')] });
  assert.ok(fin.rules.find(r => r.id === 'final').ok, 'C4h Rq acaba en do');
  assert.equal(phraseEnd(toks('C5h Rq G4q')).name, 'C5');
  assert.equal(phraseEnd(toks('B4q A4q')).name, 'A4');
  assert.equal(phraseEnd(toks('C4h Rh')).name, 'C4');
  // y una respuesta que no acaba en do sigue sin valer
  const wrong = extraRules({ rs: p.restricciones, p, tokens: toks('G4q | C5q B4q A4q G4q | D5h Rq G4q | C5q B4q A4q G4q | E5h Rq G4q | E4q F4q G4q A4q | B4h Rq G4q | A4q G4q F4q D4q | C4h Rq'), given: null, signs: null, state: { pickup: 1 }, lyrics: 'x', barBeats: 4, bars: 8, dyn: [] });
  assert.equal(wrong.find(r => r.id === 'respuesta').ok, false);
});

// ---------- Evaluación 4 ----------
test('ningún ejercicio que se puntúa pide notas no enseñadas: cada lista de notas ⊆ las de su unidad', () => {
  const asName = n => (/^[A-G]/.test(n) ? n : solfaToName(n));
  const walk = (o, path, fn) => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}.${i}`, fn));
    else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => ((k === 'notas' || k === 'notasEs') && Array.isArray(v) ? fn(v, `${path}.${k}`) : walk(v, `${path}.${k}`, fn)));
  };
  const bad = [];
  LM_LEVELS[0].units.forEach(u => {
    const known = new Set(u.notes.map(solfaToName));
    u.exercises.forEach(e => walk(e.params, e.id, (list, path) => {
      if (/audicion/.test(path)) return; // las audiciones se escuchan, no se leen
      list.map(asName).filter(n => n && /\d/.test(n) && !known.has(n)).forEach(n => bad.push(`${path}: ${n}`));
    }));
  });
  assert.deepEqual(bad, []);
});

test('elegir: las opciones se barajan en cada intento y la correcta cae en cualquier sitio (reparto casi uniforme)', async () => {
  const { shuffledChoice, isOrdered } = await import('../js/lm/tasks-quiz.js');
  const items = allLmExercises().flatMap(e => [...(e.params.items || []), ...(e.params.preguntas || [])])
    .filter(it => (it.tipo === 'elegir' || /^escuchar/.test(it.tipo)) && it.options && it.options.length === 3 && !isOrdered(it));
  // las listas con orden propio no se barajan
  const ordinal = { id: 'x', options: ['La primera', 'La segunda'], answer: 1 };
  assert.deepEqual(shuffledChoice(ordinal, 3).options, ordinal.options);
  const seen = [0, 0, 0];
  for (let attempt = 1; attempt <= 20; attempt++) {
    items.forEach(it => {
      const c = shuffledChoice(it, attempt * 7919);
      assert.equal(c.options[c.correct[0]], it.options[it.answer], it.id);
      seen[c.correct[0]]++;
    });
  }
  const total = seen.reduce((a, b) => a + b, 0);
  seen.forEach((n, k) => assert.ok(n / total > 0.25 && n / total < 0.42, `posición ${k + 1}: ${Math.round(n * 100 / total)} %`));
  // el mismo intento, el mismo orden (se puede repetir la corrección); otro intento, otro orden
  const it = items[0];
  assert.deepEqual(shuffledChoice(it, 5), shuffledChoice(it, 5));
});

test('variedad: al menos el 40 % de las preguntas de teoría y audición son activas (no de elegir)', () => {
  const qs = allLmExercises().filter(e => e.section === 'teoria' || e.section === 'audicion').flatMap(e => [...(e.params.items || []), ...(e.params.preguntas || [])]);
  const unique = [...new Map(qs.map(q => [q.id, q])).values()];
  const active = unique.filter(q => q.tipo !== 'elegir' && !/^escuchar/.test(q.tipo));
  assert.ok(active.length / unique.length >= 0.4, `${active.length} de ${unique.length}`);
  ['senalar', 'contar', 'tocarPentagrama', 'completar', 'ordenar', 'barras'].forEach(t => assert.ok(unique.some(q => q.tipo === t), t));
});

// ---------- Evaluación 5 ----------
test('toda pregunta con «play» suena: se programan notas (también «dos versiones» con su matiz)', async () => {
  const { notesOfPlay, gainsOf } = await import('../js/lm/tasks-quiz.js');
  const env = { songScore: ref => (lmSong(1, ref) || {}).partitura || null };
  const silent = [];
  allLmExercises().forEach(e => [...(e.params.items || []), ...(e.params.preguntas || [])].forEach(q => {
    if (!q.play) return;
    const notes = notesOfPlay(q.play, env).filter(n => !n.rest);
    if (!notes.length) silent.push(`${e.id}: ${q.id}`);
  }));
  assert.deepEqual(silent, []);
  const two = { versiones: ['f', 'p'] };
  const notes = notesOfPlay(two, env);
  const gains = gainsOf(two, notes);
  const half = notes.length / 2;
  assert.ok(gains[0] > gains[half], 'la primera (f) suena más fuerte que la segunda (p)');
  assert.ok(notes[half].start > notes[half - 1].start + notes[half - 1].beats, 'con un silencio entre las dos');
});

test('creatividad AB con anacrusa pegada a la nota larga, como «Cumpleaños feliz» (C5h G4q): la respuesta acaba en do', async () => {
  const { extraRules } = await import('../js/lm/creative.js');
  const toks = s => parseTokens(s.replace(/\|/g, ' '));
  const p = lmExercise('lm1-u8-creatividad-a-medio').params;
  const song = toks('G4q | A4q G4q C5q | B4h G4q | A4q G4q D5q | C5h G4q | E4q E4q F4q | G4h F4q | E4q D4q B4q | C4h');
  const rules = Object.fromEntries(extraRules({ rs: p.restricciones, p, tokens: song, given: null, signs: null, state: { pickup: 1 }, lyrics: 'x', barBeats: 3, bars: 8, dyn: [] }).map(r => [r.id, r.ok]));
  assert.deepEqual([rules.pregunta, rules.respuesta, rules.formaB], [true, true, true]);
});

test('canciones: la letra seguida (guiones y PDF) coincide letra a letra con las sílabas de cada estrofa', async () => {
  const { SONG_WORDS, SONG_WORDS2 } = await import('../js/lm/tasks-voice.js');
  const letters = s => String(s).toLowerCase().normalize('NFD').replace(/[^a-zñ]/g, '');
  LM_LEVELS[0].units.forEach(u => {
    const s = u.song;
    assert.equal(letters(SONG_WORDS[s.titulo]), letters(s.letra.flat().join('')), `${s.titulo}: estrofa 1`);
    if (s.letra2) assert.equal(letters(SONG_WORDS2[s.titulo]), letters(s.letra2.flat().join('')), `${s.titulo}: estrofa 2`);
    // una sílaba por nota en cada compás
    const notes = {};
    scoreTokens(s.partitura).forEach(t => { if (!t.rest) notes[t.bar] = (notes[t.bar] || 0) + 1; });
    [s.letra, s.letra2].filter(Boolean).forEach(L => L.forEach((bar, b) => assert.equal(bar.length, notes[b] || 0, `${s.titulo}, compás ${b + 1}`)));
  });
});

test('lectura a dos voces con micrófono: si solo se oye el altavoz (el ostinato), la nota es baja', async () => {
  const { gradeReading } = await import('../js/lm/tasks-duo.js');
  const { ostinatoTokens } = await import('../js/lm/gen.js');
  const p = lmExercise('lm1-u7-ritmo-a-medio').params;
  const reading = scoreTokens(p.partitura);
  const ost = ostinatoTokens(reading, p).filter(t => !t.rest);
  const spb = 60 / p.tempo;
  const expected = reading.filter(t => !t.rest).map(t => t.start * spb);
  const ostinatoTimes = ost.map(t => t.start * spb);
  const tol = 0.08;
  const echo = gradeReading({ expected, hits: ostinatoTimes, tol, mic: true, ostinatoTimes });
  assert.ok(pctOf(echo.marks.filter(Boolean), echo.extra) < 20, `solo el eco: ${pctOf(echo.marks.filter(Boolean), echo.extra)} %`);
  const own = echo.marks.filter(Boolean).length;
  assert.ok(own >= expected.length * 0.4, `la voz 2 tiene notas propias: ${own} de ${expected.length}`);
  const perfect = gradeReading({ expected, hits: expected, tol, mic: true, ostinatoTimes });
  assert.equal(pctOf(perfect.marks.filter(Boolean), perfect.extra), 100);
  // tocando la pantalla se corrigen todas
  assert.equal(gradeReading({ expected, hits: expected, tol }).marks.length, expected.length);
});

// ---------- Evaluación 6 ----------
test('prosodia: en todas las canciones la sílaba tónica cae en una parte al menos tan fuerte como sus vecinas', async () => {
  const { prosodyIssues, beatWeight } = await import('../js/lm/prosody.js');
  const { SONG_WORDS, SONG_WORDS2 } = await import('../js/lm/tasks-voice.js');
  const found = [];
  LM_LEVELS[0].units.forEach(u => {
    const s = u.song;
    [[1, s.letra, SONG_WORDS[s.titulo]], [2, s.letra2, SONG_WORDS2[s.titulo]]].forEach(([v, L, W]) => {
      if (!L) return;
      prosodyIssues(s, L, W).forEach(i => found.push(`U${u.unit} estrofa ${v}, compás ${i.bar}: «${i.word}» (tónica «${i.stressed}» más débil que «${i.weaker}»)`));
    });
  });
  assert.deepEqual(found, []);
  // la regla misma: llanas, agudas, tilde
  const two = { partitura: '| G4q G4q | G4q G4q |', compas: '2/4' };
  assert.equal(prosodyIssues(two, [['ro', 'bot'], ['me', 'sa']], 'robot mesa').length, 1, '«ro-BOT» con «bot» en el 2 está mal');
  assert.equal(prosodyIssues(two, [['me', 'sa'], ['can', 'ción']], 'mesa canción').length, 1, '«can-CIÓN» con «ción» en el 2 está mal');
  assert.equal(prosodyIssues({ partitura: '| G4q | G4q G4q |', compas: '2/4', anacrusa: 1 }, [['ro'], ['bot', 'sí']], 'robot sí').length, 0, 'en anacrusa, «bot» cae en el 1');
  assert.deepEqual([0, 1, 2, 0.5].map(p => beatWeight(p, 4)), [3, 1, 2, 0]);
  // los huecos que encontró la evaluación 7: átonas en la parte fuerte, palabras de tres sílabas y «robots»
  const ee = { partitura: '| G4e G4e G4q | G4h |', compas: '2/4' };
  assert.equal(prosodyIssues(ee, [['El', 'mar', 'me'], ['va']], 'El mar me va').length, 1, '«EL mar» con el artículo en el pulso');
  assert.equal(prosodyIssues({ partitura: '| G4e G4e G4e G4e | G4h |', compas: '2/4' }, [['y', 'más,', 'y', 'más,'], ['ya']], 'y más, y más, ya').length, 2, '«Y más, Y más»');
  assert.equal(prosodyIssues({ partitura: '| G4q G4q G4q G4q | G4w |', compas: '4/4' }, [['Can', 'tan', 'al', 'ver'], ['sol']], 'Cantan al ver sol').filter(i => i.weaker === 'al').length, 1, '«AL ver»');
  assert.equal(prosodyIssues({ partitura: '| G4e G4e G4q G4q | G4h G4q |', compas: '3/4' }, [['y', 'se a', 'ca', 'bó'], ['ya']], 'y se acabó ya').length, 1, '«Y se a-ca-BÓ» en el vals');
  assert.equal(prosodyIssues(two, [['ro', 'bots'], ['me', 'sa']], 'robots mesa').length, 1, '«ro-BOTS» es aguda');
  assert.equal(prosodyIssues(two, [['me', 'sa'], ['ro', 'bot']], 'mesa sofá').filter(i => i.word === 'letra desalineada').length, 1, 'avisa si la letra no casa');
  // evaluación 8: sin excepción de «acento secundario», átona nunca en el 1, final de verso en parte fuerte, nombres de nota
  const up = { partitura: '| G4q | G4q G4q G4q G4q | G4w |', compas: '4/4', anacrusa: 1 };
  assert.equal(prosodyIssues(up, [['con'], ['mis', 'a', 'mi', 'gos'], ['ya']], 'con mis amigos ya').length, 1, '«con MIS a-MI-gos»');
  const four = { partitura: '| G4q G4q G4q G4q | G4w |', compas: '4/4' };
  assert.ok(prosodyIssues(four, [['Can', 'ta', 'la', 'luz.'], ['ya.']], 'Canta la luz. ya.').some(i => i.weaker.startsWith('fin de verso')), '«es-TÁ GRIS»: final de verso en el 4');
  assert.equal(prosodyIssues(four, [['¡Sí,', 'can', 'ta', 'ya!'], ['sol.']], '¡Sí, canta ya! sol.').filter(i => i.weaker.startsWith('fin de verso')).length, 1, 'la interjección «¡Sí,» abre el verso, no lo cierra');
  assert.ok(prosodyIssues(four, [['to', 'do es', 'tá', 'gris'], ['ya']], 'todo está gris ya').some(i => i.word === 'gris'), '«es-TÁ GRIS |» sin signo, cerrando el compás en el 4');
  const yse = { partitura: '| G4q G4e G4e | G4h |', compas: '2/4' };
  assert.ok(prosodyIssues(yse, [['Y', 'se', 'pa'], ['ró']], 'Y se paró').some(i => i.weaker === 'Y'), '«Y se pa | RÓ»: la átona en el 1');
  const qv = { partitura: '| G4q G4q | G4h |', compas: '2/4' };
  assert.equal(prosodyIssues(qv, [['que', 'me'], ['ves']], 'que me ves').length, 1, '«QUE me VES»');
  assert.equal(prosodyIssues(qv, [['mi', 'fa'], ['do']], 'mi fa do').length, 0, 'nombres de nota seguidos: tónicos');
  assert.ok(prosodyIssues(qv, [['mi', 'ca'], ['sa']], 'mi casa').some(i => i.weaker === 'mi'), 'el posesivo «mi» sigue siendo átono');
});

test('creatividad AB: la respuesta acaba en do aunque la parte B empiece en el primer tiempo (sin anacrusa)', async () => {
  const { extraRules } = await import('../js/lm/creative.js');
  const toks = s => parseTokens(s.replace(/\|/g, ' '));
  const p = lmExercise('lm1-u8-creatividad-a-medio').params;
  const song = toks('G4q | C5q B4q A4q | G4q F4q D5q | C5q B4q A4q | E4q D4q C4q | E4q F4q G4q | A4h G4q | F4q E4q D4q | C4h');
  const rules = Object.fromEntries(extraRules({ rs: p.restricciones, p, tokens: song, given: null, signs: null, state: { pickup: 1 }, lyrics: 'x', barBeats: 3, bars: 8, dyn: [] }).map(r => [r.id, r.ok]));
  assert.deepEqual([rules.pregunta, rules.respuesta, rules.formaB], [true, true, true]);
});

test('lectura a dos voces: golpear todos los pulsos sin leer no aprueba', async () => {
  const { gradeReading } = await import('../js/lm/tasks-duo.js');
  const p = lmExercise('lm1-u7-ritmo-a-medio').params;
  const reading = scoreTokens(p.partitura);
  const spb = 60 / p.tempo;
  const expected = reading.filter(t => !t.rest).map(t => t.start * spb);
  const total = reading.reduce((s, t) => Math.max(s, t.start + t.beats), 0);
  const everyBeat = Array.from({ length: total }, (_, k) => k * spb);
  const g = gradeReading({ expected, hits: everyBeat, tol: 0.08 });
  const pct = pctOf(g.marks, Math.ceil(g.extra * 1.5));
  assert.ok(gradeTen(pct, 'medio') < 5, `${pct} % → ${gradeTen(pct, 'medio')}`);
});

test('comas de respiración: entre dos notas, nunca sobre un silencio ni al final de la pieza', async () => {
  const { withBreaths } = await import('../js/lm/kit.js');
  const t = withBreaths(scoreTokens('| C5q C5q | C5h | C5q Rq | C5h |'), [1, 2, 3, 4]);
  assert.deepEqual(t.map(x => !!x.breath), [false, true, true, false, false, false]);
});

// ---------- Evaluación 7 ----------
test('lectura rítmica del curso: machacar la pantalla o callarse no aprueba; bien leída, 100 % (las 16)', async () => {
  const { gradeReading } = await import('../js/lm/tasks-duo.js');
  const readings = allLmExercises().filter(e => e.type === 'lectura-ritmica');
  assert.equal(readings.length, 16);
  readings.forEach(e => {
    const p = e.params;
    const spb = 60 / (p.tempo || 72);
    const toks = scoreTokens(p.partitura);
    const expected = toks.filter(t => !t.rest).map(t => t.start * spb);
    const end = toks.reduce((m, t) => Math.max(m, t.start + t.beats), 0) * spb;
    const tol = e.variant === 'medio' ? 0.08 : 0.12;
    const pct = hits => gradeReading({ expected, hits, tol }).pct;
    const mash = Array.from({ length: Math.floor(end / 0.06) }, (_, i) => i * 0.06);
    assert.ok(pct(mash) < 60, `${e.id}: machacar ${pct(mash)} %`);
    assert.equal(pct([]), 0, `${e.id}: en silencio`);
    assert.equal(pct(expected), 100, `${e.id}: bien leída`);
    // una palmada en un silencio es un fallo (cuenta como golpe de más)
    const rest = toks.find(t => t.rest);
    if (rest) assert.ok(pct([...expected, rest.start * spb]) < 100, `${e.id}: palmada en un silencio`);
  });
});

// ---------- Evaluación 8 ----------
// Cada ejemplo de tarjeta y cada partitura de pregunta que se pinta con compás suma exactamente su compás
// (la anacrusa al principio y, si la hay, el compás que la completa al final)
const METER_EXEMPT = new Set(['lm1u4-t7']); // la pregunta es justo encontrar el compás que no suma
test('ejemplos de tarjeta y preguntas con compás: cada compás suma exactamente lo que marca', async () => {
  const { lmLevel } = await import('../js/lm/catalog.js');
  const { barBeatsOf, scoreTokens: tokensOf } = await import('../js/lm/notes.js');
  const bad = [];
  const check = (name, text, meter, pickup = 0) => {
    const bb = barBeatsOf(meter);
    const bars = text.split('|').map(x => x.trim()).filter(Boolean).map(b => tokensOf(`| ${b} |`).reduce((a, t) => a + t.beats, 0));
    bars.forEach((sum, i) => {
      const want = pickup && i === 0 ? pickup : pickup && i === bars.length - 1 && sum === bb - pickup ? sum : bb;
      if (Math.abs(sum - want) > 1e-6) bad.push(`${name}: compás ${i + 1} suma ${sum} en ${meter}`);
    });
  };
  for (const u of lmLevel(1).units) {
    const def = u.raw.compases[0];
    (u.raw.teoria.ficha || []).forEach((c, i) => ['ejemplo', 'ejemploCompleto'].forEach(k => c[k] && check(`U${u.unit} tarjeta ${i + 1} ${k}`, c[k], c.compas || def, c.anacrusa || 0)));
    for (const ex of Object.values(u.raw.secciones).flat()) {
      for (const it of [...(ex.items || []), ...(ex.preguntas || [])]) {
        if (it.partitura && it.compas && !METER_EXEMPT.has(it.id) && !String(it.partitura).includes('?')) check(it.id, it.partitura, it.compas, it.anacrusa || 0);
      }
    }
  }
  assert.deepEqual(bad, []);
  // y la tarjeta «Frases y respiración» de la U7 va en 4/4
  const u7 = lmLevel(1).units[6].raw.teoria.ficha;
  assert.ok(u7.some(c => /respiraci/i.test(c.titulo) && c.compas === '4/4'));
});

// La lectura tal y como la corrige la pantalla del curso: las dos vueltas, el calderón y los silencios
async function readingSim(e) {
  const { readingTimeline, readingMode } = await import('../js/lm/tasks-duo.js');
  const { gradeReading: gradeAll } = await import('../js/lm/reading-grade.js');
  const { withBreaths } = await import('../js/lm/kit.js');
  const p = e.params;
  const spb = 60 / (p.tempo || 72);
  const tokens = withBreaths(scoreTokens(p.partitura), p.comas || [], p.anacrusa || 0);
  const tl = readingTimeline(p, tokens);
  const mode = readingMode(p, e.variant);
  const notes = tl.events.filter(x => !x.rest);
  const at = x => x.beat * spb;
  const tol = e.variant === 'medio' ? 0.08 : 0.12;
  const grade = hits => gradeAll({
    notes: notes.map(x => ({ at: at(x), dur: x.dur })),
    rests: tl.events.filter(x => x.rest).map(x => ({ from: at(x), to: at(x) + x.beats * spb, dur: x.dur })),
    hits, tol, tempo: mode.metro === 'none',
  });
  return { p, spb, tl, mode, notes, expected: notes.map(at), grade, tol };
}

test('lecturas del curso: dar el pulso sin leer, palmear los silencios o tocar una sola vuelta no aprueba (las 16)', async () => {
  const readings = allLmExercises().filter(e => e.type === 'lectura-ritmica');
  assert.equal(readings.length, 16);
  for (const e of readings) {
    const { spb, tl, expected, grade } = await readingSim(e);
    assert.equal(grade(expected).pct, 100, `${e.id}: bien leída`);
    assert.equal(grade([]).pct, 0, `${e.id}: en silencio`);
    // el pulso, sin leer: un golpe en cada pulso de toda la lectura
    const pulse = Array.from({ length: Math.round(tl.total) }, (_, i) => i * spb);
    const isPulse = expected.length === pulse.length && expected.every((x, i) => Math.abs(x - pulse[i]) < 1e-6);
    if (!isPulse) assert.ok(grade(pulse).pct < 60, `${e.id}: el pulso sin leer da ${grade(pulse).pct} %`);
    // retraso constante del móvil o del alumno (+100 ms): se compensa
    assert.ok(grade(expected.map(x => x + 0.1)).pct >= 95, `${e.id}: con 100 ms de retraso ${grade(expected.map(x => x + 0.1)).pct} %`);
    // una palmada en cada silencio
    const rests = tl.events.filter(x => x.rest);
    if (rests.length) {
      const inRests = rests.map(r => (r.beat + r.beats / 2) * spb);
      const g = grade([...expected, ...inRests]);
      assert.ok(g.pct < 100 && g.mistakes.some(m => String(m).startsWith('sil-')), `${e.id}: palmear los silencios`);
      if (e.id.includes('-u1-')) assert.ok(g.pct < 60, `${e.id}: en la U1 palmear todos los silencios no aprueba (${g.pct} %)`);
    }
    // con barra de repetición, una sola vuelta perfecta no aprueba
    if (tl.passes > 1) assert.ok(grade(expected.slice(0, expected.length / 2)).pct < 60, `${e.id}: una sola vuelta`);
  }
});

test('lecturas del curso: datos de cada variante (repetición, compás mudo, entrada con clic, matices, acento)', async () => {
  const byId = id => allLmExercises().find(e => e.id === id);
  const u4m = await readingSim(byId('lm1-u4-ritmo-a-medio'));
  assert.equal(u4m.tl.passes, 2, 'U4 Media: la repetición se toca dos veces');
  assert.equal(u4m.notes.length % 2, 0);
  const u5m = await readingSim(byId('lm1-u5-ritmo-a-medio'));
  assert.deepEqual(u5m.mode.mute, [2], 'U5 Media: el metrónomo calla solo en el compás 2 (dato, no texto)');
  const u8m = await readingSim(byId('lm1-u8-ritmo-a-medio'));
  assert.equal(u8m.mode.click, true, 'U8 Media: un clic un pulso antes de entrar');
  assert.equal(u8m.mode.metro, 'none');
  // sin metrónomo, la app sigue el tempo del alumno: ±5 % de deriva sigue aprobando con nota alta
  for (const k of [1.05, 0.95]) assert.ok(u8m.grade(u8m.expected.map(x => 0.1 + x * k)).pct >= 85, `U8 Media a ${k} del tempo`);
  assert.equal((await readingSim(byId('lm1-u4-ritmo-a-facil'))).mode.measure, 'acento');
  assert.equal((await readingSim(byId('lm1-u6-ritmo-a-facil'))).mode.measure, 'matices');
});

test('calderón: la nota con calderón dura el doble y lo que sigue se retrasa lo mismo', async () => {
  const { readingTimeline } = await import('../js/lm/tasks-duo.js');
  const p = { partitura: '| G4q G4q | G4q G4q | G4q G4q |', compas: '2/4', matices: [{ signo: 'calderon', compas: 2 }] };
  const tl = readingTimeline(p, scoreTokens(p.partitura));
  assert.equal(tl.total, 7);
  const held = tl.events.find(x => x.hold);
  assert.equal(held.beat, 3);
  assert.equal(held.beats, 2);
  assert.equal(tl.events[4].beat, 5);
});

test('acento y matices medidos con el micrófono: cuentan solo si se tocan', async () => {
  const { measuredPart } = await import('../js/lm/tasks-duo.js');
  const p = { partitura: '| G4q G4q G4q | G4q G4q G4q |', compas: '3/4' };
  const notes = scoreTokens(p.partitura);
  assert.equal(measuredPart('acento', p, notes, notes.map(n => (n.start % 3 === 0 ? 1 : 0.5)), 3), 1, 'el 1 bien marcado');
  assert.equal(measuredPart('acento', p, notes, notes.map(() => 0.5), 3), 0, 'todas iguales: sin acento');
  const d = { partitura: '| G4q G4q | G4q G4q |', compas: '2/4', matices: [{ signo: 'p', compas: 1 }, { signo: 'f', compas: 2 }] };
  const dn = scoreTokens(d.partitura);
  assert.equal(measuredPart('matices', d, dn, dn.map(n => (n.bar === 0 ? 0.2 : 0.8)), 2), 1, 'p y luego f');
  assert.equal(measuredPart('matices', d, dn, dn.map(() => 0.5), 2), 0, 'todo igual: sin matices');
});

test('entonación con barra de repetición (U4 Media): se canta y se corrige dos veces', async () => {
  const { singOrder } = await import('../js/lm/tasks-voice.js');
  const e = allLmExercises().find(x => x.id === 'lm1-u4-entonacion-b-medio');
  assert.ok(e.params.repeticion);
  const toks = scoreTokens(e.params.partitura);
  const { passes, once, sounding } = singOrder(toks, !!e.params.repeticion);
  assert.equal(passes, 2);
  assert.equal(sounding.length, once.length * 2);
  assert.deepEqual(sounding.slice(once.length).map(n => n.index), once.map(n => n.index), 'la 2.ª vuelta, desde el principio');
  assert.equal(singOrder(toks).sounding.length, once.length, 'sin repetición, una vuelta');
  assert.match(readFileSync(new URL('../js/lm/runners.js', import.meta.url), 'utf8'), /repeat: !!p\.repeticion/);
});

test('lectura rítmica: el fallo se explica con la figura de verdad (y en inglés)', async () => {
  const { mistakeText } = await import('../js/lm/catalog.js');
  assert.equal(mistakeText('falta-e'), 'no tocó una corchea');
  assert.equal(mistakeText('falta-h'), 'no tocó una blanca');
  assert.equal(mistakeText('sil-q'), 'palmada en un silencio de negra');
  assert.equal(mistakeText('golpe-mas'), 'golpes de más');
  const en = readFileSync(new URL('../js/i18n-en-lm.js', import.meta.url), 'utf8');
  assert.match(en, /\^no tocó una/);
  assert.match(en, /\^palmada en un/);
  assert.match(en, /'golpes de más': 'extra claps'/);
});

test('escribir en el pentagrama: la nota fantasma no sale del do grave al la agudo; soltar fuera la cancela', async () => {
  const { writeLimits } = await import('../js/lm/tasks-staff.js');
  assert.deepEqual(writeLimits('treble'), [stepOf('C4'), stepOf('A5')]);
  const src = readFileSync(new URL('../js/lm/tasks-staff.js', import.meta.url), 'utf8');
  assert.match(src, /clampStep\(stepAtY\(ins\.querySelector\('svg'\)/, 'la fantasma, dentro del ámbito');
  assert.match(src, /if \(out\) \{ say\('Nota cancelada'\); return; \}/, 'soltar fuera no escribe');
});

test('cresc. y dim. con «hasta»: la línea de guiones sigue hasta el último compás que abarcan', async () => {
  const { staffHtml } = await import('../js/lm/kit.js');
  const toks = scoreTokens('| G4q G4q | G4q G4q | G4h |');
  const html = staffHtml(toks, { meter: '2/4', dynamics: [{ compas: 1, signo: 'cresc', hasta: 2 }] });
  assert.equal((html.match(/lm-dyn-ext/g) || []).length, 3, 'tres notas tras «cresc.», hasta el compás 2');
  assert.equal((staffHtml(toks, { meter: '2/4', dynamics: [{ compas: 1, signo: 'f' }] }).match(/lm-dyn-ext/g) || []).length, 0);
});
