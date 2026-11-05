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
import { stopRoundOf, stopKinds, stopWindow, genRhythm, genMelody, meterQuestions, semitoneQuestions, modeQuestions } from '../js/lm/gen.js';
import { agilityPlan } from '../js/lm/tasks-agility.js';
import { getState } from '../js/store.js';

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
  assert.equal(p.done, 1, 'el 40 % no da estrellas');
  assert.equal(p.stars, 3);
  assert.equal(p.maxStars, p.total * 3);
  assert.equal(p.total, LM_LEVELS[0].units[0].exercises.filter(e => e.variant === 'medio').length);
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
  assert.deepEqual(mistakeCodes(['x', 'x', null, 'muy-largo-codigo-de-error']), ['x', 'muy-largo-co']);
  assert.equal(gradeTen(100, 'facil'), 8);
  assert.equal(gradeTen(96, 'medio', true), 10);
  assert.equal(gradeTen(90, 'medio'), 9);
  assert.equal(gradeTen(60, 'medio'), 6);
  assert.equal(gradeTen(10, 'medio'), 2);
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
    for (let k = 0; k < 3; k++) {
      const r = stopRoundOf(base, { kinds: stopKinds(e.params.errores), seed: 11 + k, barBeats });
      assert.ok(r.errorBeat > 0 && r.code, e.id);
      assert.notDeepEqual(r.played.map(t => `${t.rest}${t.dur}`), base.map(t => `${t.rest}${t.dur}`), e.id);
    }
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
  assert.equal(easy.notes.length, 12);
  easy.notes.slice(1).forEach((n, i) => assert.notEqual(n, easy.notes[i], 'no repite la nota anterior'));
  const fast = agilityPlan({ notas: ['G4', 'E4', 'A4'], modo: 'leer-a-tempo', tempo: [60, 90], compases: 8, compas: '2/4' }, 2);
  assert.equal(fast.notes.length, 8);
  assert.ok(fast.secs[0] > fast.secs[fast.secs.length - 1]);
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
