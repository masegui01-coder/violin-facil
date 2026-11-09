// Lenguaje musical · Nivel 4: tresillos, compases de amalgama y cambios de compás, armonía (grados, tríadas, cadencias,
// modulación), claves de do, adornos, creatividad, discriminación y el concierto con su diploma. Sin navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LM_LEVELS, lmExercise, lmUnit, lmQuestion, mistakeText } from '../js/lm/catalog.js';
import { scoreTokens, barBeatsOf, isAmalgam, isCompound, meterPlan, groupingOf, FIGURE_BEATS, durBase } from '../js/lm/notes.js';
import { parseScore } from '../js/music.js';
import { beatWeight, prosodyIssues } from '../js/lm/prosody.js';
import { metronomeBeats, readingTimeline, syllablesOf, toleranceMs } from '../js/lm/rhythm-plan.js';
import { layoutTokens, keySignatureSteps, keyRelPositions, yOf, noteCell, clefCell } from '../js/lm/staff-lm.js';
import { staffHtml, CLEF } from '../js/lm/kit.js';
import * as H from '../js/lm/harmony.js';
import { tripletBeats, syncopations, groupsOk, meterChanges, chordRules, cadenceAt, modulationOk } from '../js/lm/rules4.js';
import { stopKinds, stopOptions, stopBase, genRhythm, genRhythmChanging, choiceQuestions } from '../js/lm/gen.js';
import { notesOfPlay, progressionNotes, chordNotes } from '../js/lm/tasks-quiz.js';
import { agilityPlan, answerButtons } from '../js/lm/tasks-agility.js';
import { checkComposition } from '../js/lm/grade.js';
import { extraRules4 } from '../js/lm/creative.js';
import { gradosAnswer, gradosSound } from '../js/lm/tasks-grados.js';
import { concertPct, diplomaStatus, issueDiploma, deliverState, reviewPassed, orderedPieces } from '../js/lm/concert.js';
import { EMPTY_LM } from '../js/lm/results.js';

const L4 = LM_LEVELS[3];
const items = ex => ex.params.items || ex.params.preguntas || [];
const allItems = () => L4.units.flatMap(u => u.exercises.flatMap(e => items(e).map(q => ({ q, e, u }))));

test('el Nivel 4 tiene 8 unidades y 222 ejercicios, abiertos, y ya no queda ningún nivel «próximamente»', () => {
  assert.equal(L4.units.length, 8);
  assert.equal(L4.units.flatMap(u => u.exercises).length, 222);
  assert.ok(LM_LEVELS.every(l => l.units.length === 8));
  assert.equal(lmExercise('lm4-u8-audicion-b-medio').params.audicion.verificacion, 'por verificar');
  assert.match(mistakeText('3>2'), /tresillo/);
  assert.match(mistakeText('r-tresillos'), /tresillos/);
});

test('el tiempo se ajusta a la cuadrícula: siete tresillos de corchea suman 3,5 y el compás 8 llega exacto', () => {
  const bar = '| C5e:3 C5e:3 C5e:3 C5q C5h |';
  const p = parseScore(Array(8).fill(bar).join(' '));
  assert.equal(p.totalBeats, 32);
  assert.equal(p.notes[7 * 5].start, 28, 'el compás 8 empieza en el pulso 28');
  assert.equal(FIGURE_BEATS['e:3'] * 3, 1);
  const t = scoreTokens('| C5e:3 Re:3 C5e:3 C5q | C5q:3 C5q:3 C5q:3 |');
  assert.deepEqual(t.map(x => x.dur), ['e:3', 'e:3', 'e:3', 'q', 'q:3', 'q:3', 'q:3']);
  assert.equal(durBase('e:3'), 'e');
  assert.equal(t[1].rest, true);
});

test('beatWeight: el inicio del compás tras tantos tresillos sigue siendo fuerte; 12/8 y amalgama', () => {
  assert.equal(beatWeight(27.999999999999996, 4), 3);
  assert.equal(beatWeight(3.9999999999999996, 4), 3);
  assert.deepEqual([0, 1.5, 3, 4.5].map(p => beatWeight(p, 6, true)), [3, 1, 2, 1]);
  assert.deepEqual([0, 1.5, 0.5, 1].map(p => beatWeight(p, 2.5, false, [3, 2])), [3, 2, 0, 0]);
  assert.equal(beatWeight(1 / 3, 1.5), 0);
});

test('compases: 5/8, 7/8, 12/8, agrupaciones y plan de cambios de compás', () => {
  assert.equal(barBeatsOf('5/8'), 2.5);
  assert.equal(barBeatsOf('7/8'), 3.5);
  assert.equal(barBeatsOf('12/8'), 6);
  assert.ok(isAmalgam('5/8') && isAmalgam('7/8') && !isAmalgam('6/8') && isCompound('12/8'));
  assert.deepEqual(groupingOf('5/8', {}), [3, 2]);
  assert.deepEqual(groupingOf('7/8', { agrupaciones: [[2, 2, 3], [3, 2, 2]] }, 1), [3, 2, 2]);
  const t = scoreTokens('| C5q C5q C5q | @time:2/4 C5q C5q | @time:6/8 C5q. C5q. | @time:12/8 C5q. C5q. C5q. C5q. |');
  const plan = meterPlan(t, '3/4');
  assert.deepEqual(plan.meters, ['3/4', '2/4', '6/8', '12/8']);
  assert.deepEqual(plan.sizes, [3, 2, 3, 6]);
  // todas las lecturas rítmicas suman lo que dice su compás en cada compás
  L4.units.forEach(u => u.exercises.forEach(e => {
    const p = e.params;
    const text = p.partitura || (p.base && p.base.partitura);
    if (!text || !p.compas && !(p.base && p.base.compas) || e.section === 'creatividad') return;
    const tokens = scoreTokens(text);
    const pl = meterPlan(tokens, p.compas || p.base.compas);
    const size = b => (pl ? pl.sizes[b] : barBeatsOf(p.compas || p.base.compas));
    const last = tokens.reduce((m, x) => Math.max(m, x.bar), 0);
    if (e.section === 'entonacion' && p.anacrusa) return;
    for (let b = 0; b <= last; b++) {
      const sum = tokens.filter(x => x.bar === b).reduce((s, x) => s + x.beats, 0);
      assert.ok(Math.abs(sum - size(b)) < 1e-6 || p.anacrusa || p.repeticion || p.ds, `${e.id} compás ${b + 1}: ${sum} y no ${size(b)}`);
    }
  }));
});

test('dibujo: tresillo con su 3 (barra común) o corchete, claves de do y de fa en 3.ª, armaduras de −7 a 7', () => {
  const t = scoreTokens('| C5e:3 C5e:3 C5e:3 C5q | C5q:3 C5q:3 C5q:3 | C5e:3 Re:3 C5e:3 C5q |');
  const lay = layoutTokens(t, { barBeats: 2, clef: 'treble', pulse: 1 });
  assert.equal(lay.filter(l => l.tuplet).length, 9);
  assert.ok(lay[0].beam && lay[1].beam && !lay[0].tuplet.bracket, 'tres corcheas unidas: solo el 3');
  assert.ok(lay[4].tuplet.bracket && lay[7].tuplet.bracket, 'negras y silencio: corchete');
  assert.equal(lay.filter(l => l.tuplet && l.tuplet.label).length, 3);
  const html = staffHtml(t, { meter: '2/4' });
  assert.match(html, /lm-tuplet/);
  assert.doesNotMatch(html, /undefined|NaN/);
  // claves: línea inferior y referencia
  assert.equal(H.clefBottom('do3'), 24);
  assert.equal(H.clefBottom('do4'), 22);
  assert.equal(H.clefBottom('fa3'), 20);
  assert.equal(H.clefBottom('fa'), 18);
  assert.equal(CLEF.do3, 'alto');
  for (const clef of ['treble', 'bass', 'alto', 'tenor', 'baritone']) {
    for (let a = -7; a <= 7; a++) {
      const steps = keySignatureSteps(a, clef);
      assert.equal(steps.length, Math.abs(a));
      steps.forEach(s => { const rel = s - H.clefBottom(clef); assert.ok(rel >= -2 && rel <= 9, `${clef} ${a}: ${rel}`); });
      assert.doesNotMatch(clefCell(clef, '12/8', a), /undefined|NaN/);
    }
  }
  assert.doesNotMatch(noteCell({ step: 30, dur: 'e:3', rest: false, ornament: { signo: 'trino' } }), /undefined|NaN/);
  for (const signo of ['trino', 'mordente', 'apoyatura', 'acciaccatura', 'grupeto']) assert.match(noteCell({ step: 36, dur: 'h', ornament: { signo } }), /<svg/);
  assert.equal(yOf(28, 'alto'), 80 - 4 * 5);
});

test('metrónomo: grupos, cambios de compás y tolerancia con tresillos', () => {
  const g = metronomeBeats({ length: 5, barBeats: 2.5, pulse: 0.5, metro: 'groups', groups: () => [3, 2] });
  assert.deepEqual(g.map(c => c.level[0]).join(''), 'dssgsdssgs');
  const ch = metronomeBeats({ length: 8, barBeats: 3, metro: 'all', pulse: 1, sizes: [3, 2, 3], meters: ['3/4', '2/4', '3/4'] });
  assert.deepEqual(ch.filter(c => c.level === 'down').map(c => c.beat), [0, 3, 5]);
  assert.equal(toleranceMs('medio', scoreTokens('| C5e:3 C5e:3 C5e:3 C5q |'), 90), 60);
  assert.equal(toleranceMs('facil', scoreTokens('| C5e:3 C5e:3 C5e:3 C5q |'), 90), 120);
  assert.deepEqual(syllablesOf(scoreTokens('| C5e:3 C5e:3 C5e:3 C5q |')), ['tre', 'si', 'llo', 'ta']);
  // la línea de tiempo sigue cada compás con su medida
  const ex = lmExercise('lm4-u6-ritmo-a-facil');
  const tl = readingTimeline(ex.params, scoreTokens(ex.params.partitura));
  assert.equal(tl.total, meterPlan(scoreTokens(ex.params.partitura), '3/4').sizes.reduce((a, b) => a + b, 0));
});

test('prosodia: ninguna canción del Nivel 4 tiene la tónica más débil que su vecina (5/8, cambios de compás incluidos)', () => {
  const found = [];
  L4.units.forEach(u => {
    const s = u.song;
    prosodyIssues(s, s.letra, s.palabras).forEach(i => found.push(`U${u.unit} compás ${i.bar}: ${i.word}`));
  });
  assert.deepEqual(found, []);
});

test('tonalidades, grados, tríadas y numerales', () => {
  assert.equal(H.parseKey('La♭ M').armadura, -4);
  assert.equal(H.parseKey('Sol♯ m').armadura, 5);
  assert.equal(H.parseKey('Fa♯ M').armadura, 6);
  assert.equal(H.parseKey('Do♭ M').armadura, -7);
  assert.equal(H.keyName(5, true), 'Sol♯ m');
  assert.deepEqual(H.degreeOf('La m', 'G#4'), { grado: 7, nombre: 'sensible' });
  assert.deepEqual(H.degreeOf('La m', 'G4'), { grado: 7, nombre: 'subtónica' });
  assert.deepEqual(H.degreeOf('Do M', 'G4'), { grado: 5, nombre: 'dominante' });
  assert.equal(H.classifyTriad(['B3', 'D4', 'F4']), 'disminuida');
  assert.equal(H.classifyTriad(['C4', 'E4', 'G#4']), 'aumentada');
  assert.equal(H.numeralFor('La m', 3), 'III+');
  assert.equal(H.numeralFor('La m', 7), 'vii°');
  assert.equal(H.cadenciaDe(['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I']), 'perfecta');
  assert.equal(H.cadenciaDe(['I', 'IV', 'V']), 'semicadencia');
  assert.equal(H.cadenciaDe(['V', 'vi']), 'rota');
  assert.equal(H.cadenciaDe(['IV', 'I']), 'plagal');
  assert.equal(H.modulationRelation('Do M', 'Sol M'), 'dominante');
  assert.equal(H.modulationRelation('Do M', 'Fa M'), 'subdominante');
  assert.equal(H.modulationRelation('Do M', 'La m'), 'relativa');
  assert.equal(H.newNoteOf('Do M', 'Sol M'), 'F#');
  assert.equal(H.newNoteOf('Do M', 'Fa M'), 'Bb');
  assert.deepEqual(H.invertInterval('C4', 'E4'), { numero: 6, especie: 'm', notas: ['E4', 'C5'] });
  assert.deepEqual(H.enharmonicNames('F#4'), ['Gb4']);
  assert.deepEqual(H.positionInClef('E4', 'do3'), { tipo: 'linea', n: 4 });
  assert.equal(H.noteAtPosition({ tipo: 'espacio', n: 3 }, 'do4'), 'B3');
});

test('el contenido es coherente con el motor: grados, acordes, cadencias, modulaciones, inversiones y claves', () => {
  const bad = [];
  allItems().forEach(({ q, u }) => {
    const w = q.id;
    if (q.tipo === 'identificarGrado') { const d = H.degreeOf(q.tonalidad, q.nota); if (!d || d.grado !== q.respuesta.grado || d.nombre !== q.respuesta.nombre) bad.push(`${w}: grado`); }
    if (q.tipo === 'clasificarAcorde' && H.classifyTriad(q.notas) !== q.respuesta.tipo) bad.push(`${w}: acorde`);
    if (q.tipo === 'construirAcorde') {
      const got = q.tonalidad ? H.chordOfNumeral(q.tonalidad, q.grado) : { notes: H.triadFromRoot(q.raiz, q.tipoPedido), tipo: q.tipoPedido };
      if (JSON.stringify(got.notes) !== JSON.stringify(q.respuesta) || H.classifyTriad(q.respuesta) !== q.tipoPedido) bad.push(`${w}: construir`);
    }
    if (q.tipo === 'clasificarCadencia' && H.cadenciaDe(q.progresion) !== q.respuesta) bad.push(`${w}: cadencia`);
    if (q.tipo === 'clasificarModulacion' && H.modulationRelation(q.desde, q.hasta) !== q.respuesta) bad.push(`${w}: modulación`);
    if (q.tipo === 'invertirIntervalo') { const r = H.invertInterval(...q.notas); if (r.numero !== q.respuesta.numero || r.especie !== q.respuesta.especie) bad.push(`${w}: inversión`); }
    if (q.tipo === 'enarmonico' && !H.isEnharmonic(q.nota, q.respuesta)) bad.push(`${w}: enarmónico`);
    if (q.tipo === 'nombreEnClave' && H.noteAtPosition(q.posicion, q.clave) !== q.respuesta) bad.push(`${w}: nombre en clave`);
    if (q.tipo === 'ubicarNota') { const p = H.positionInClef(q.nota, q.clave); if (!p || p.tipo !== q.respuesta.tipo || p.n !== q.respuesta.n) bad.push(`${w}: ubicar`); }
    if (q.tipo === 'reconocerOrnamento' && q.ornamentos[0].signo !== q.respuesta) bad.push(`${w}: ornamento`);
    if (q.tipo === 'realizarOrnamento' && H.realizeOrnaments(q.partitura, q.ornamentos, q.armadura || 0).replace(/\s+/g, ' ') !== q.opciones[q.correctas[0]].replace(/\s+/g, ' ')) bad.push(`${w}: realizar`);
    if (q.tipo === 'escucharOrnamento' && q.options[q.answer] !== q.play.ornamentos[0].signo) bad.push(`${w}: escuchar ornamento`);
    if (q.tipo === 'armonizar') {
      const toks = scoreTokens(q.partitura).filter(t => !t.rest);
      const fits = n => { const pcs = H.chordOfNumeral(q.tonalidad, n).notes.map(x => scoreTokens(`| ${x}w |`)[0].midi % 12); return toks.every(t => pcs.includes(t.midi % 12)); };
      const good = q.opciones.filter(fits);
      if (good.length !== 1 || q.opciones[q.correctas[0]] !== good[0]) bad.push(`${w}: armonizar`);
    }
    if (q.tipo === 'agrupar') { const t = scoreTokens(q.fuente); let at = 0; const starts = t.map(x => x.start); q.respuesta.slice(0, -1).forEach(g => { at += g * 0.5; if (!starts.some(s => Math.abs(s - at) < 1e-6)) bad.push(`${w}: agrupar`); }); }
    if (q.tipo === 'mismoRitmo') q.pares.forEach(([a, b, same], k) => {
      const key = text => scoreTokens(text).reduce((acc, t) => { const last = acc[acc.length - 1]; if (last && last.tie) { last.beats += t.beats; last.tie = t.tie; } else acc.push({ rest: t.rest, start: t.start, beats: t.beats, tie: t.tie }); return acc; }, []).map(x => `${x.rest ? 'R' : 'n'}${x.start}`).join();
      if ((key(a) === key(b)) !== !!same) bad.push(`${w}: mismoRitmo ${k}`);
    });
    if (q.tipo === 'clasificarNotas') {
      const pcs = H.chordOfNumeral(q.tonalidad, q.acorde).notes.map(x => scoreTokens(`| ${x}w |`)[0].midi % 12);
      const real = scoreTokens(q.partitura).filter(t => !t.rest).map(t => (pcs.includes(t.midi % 12) ? 'real' : 'extraña'));
      if (JSON.stringify(real) !== JSON.stringify(q.respuesta)) bad.push(`${w}: clasificarNotas`);
    }
    if (u && q.tipo === 'ordenar') assert.ok(q.respuesta.every(i => i < q.items.length), w);
  });
  assert.deepEqual(bad, []);
});

test('numerales, acordes y cadencias escritos en las canciones, lecturas y dictados casan con su tonalidad', () => {
  const bad = [];
  L4.units.forEach(u => u.exercises.forEach(e => {
    const p = e.params;
    const key = p.tonalidad || (p.cancion && p.cancion.tonalidad);
    const chords = p.acordes || (p.cancion && p.cancion.acordes);
    if (chords && key && !/ y /.test(key)) [].concat(...chords.map(c => [].concat(c))).forEach(n => { const m = H.numeralProblem(key, n); if (m) bad.push(`${e.id}: ${m}`); });
    if (p.tipo === 'acordes') p.progresion.forEach(n => { const m = H.numeralProblem(p.tonalidad, n); if (m) bad.push(`${e.id}: ${m}`); });
    const cad = p.cadencias || (p.cancion && p.cancion.cadencias);
    if (cad && chords) cad.forEach(c => { if (H.cadenciaDe(chords.slice(0, c.compas).map(x => [].concat(x).pop())) !== c.tipo) bad.push(`${e.id}: cadencia del compás ${c.compas}`); });
    const mod = p.modulacion || (p.cancion && p.cancion.modulacion);
    if (mod && mod.relacion && !/|/.test(mod.hasta) && H.newNoteOf(mod.desde, mod.hasta) !== mod.notaNueva) bad.push(`${e.id}: nota nueva de ${mod.desde} a ${mod.hasta}`);
    if (mod && mod.relacion && !/|/.test(mod.hasta) && H.modulationRelation(mod.desde, mod.hasta) !== mod.relacion) bad.push(`${e.id}: relación`);
    if (p.ornamentos && p.partitura && p.realizado && H.realizeOrnaments(p.partitura, p.ornamentos, p.armadura || 0).replace(/\s+/g, ' ') !== p.realizado.replace(/\s+/g, ' ')) bad.push(`${e.id}: realizado`);
  }));
  assert.deepEqual(bad, []);
});

test('adornos: la realización de la tabla del motor (trino, mordente, grupeto, apoyatura, acciaccatura)', () => {
  assert.equal(H.realizeOrnaments('| D5h |', [{ indice: 0, signo: 'mordente' }]), '| D5s C5s D5q. |');
  assert.equal(H.realizeOrnaments('| E5h |', [{ indice: 0, signo: 'apoyatura' }]), '| F5q E5q |');
  assert.equal(H.realizeOrnaments('| D5q |', [{ indice: 0, signo: 'acciaccatura' }]), '| E5s D5e. |');
  assert.equal(H.realizeOrnaments('| D5h |', [{ indice: 0, signo: 'grupeto' }]), '| E5e D5e C5e D5e |');
  assert.equal(H.realizeOrnaments('| G4h A4h |', [{ indice: 0, signo: 'trino' }], 1), '| G4s A4s G4s A4s G4s A4s G4e A4h |');
  assert.throws(() => H.realizeOrnaments('| D5e |', [{ indice: 0, signo: 'trino' }]));
});

test('sonido: acordes a la vez con la fundamental grave, progresiones y adornos tocados', () => {
  const c = chordNotes(['C4', 'E4', 'G4']);
  assert.equal(c.length, 4);
  assert.equal(c[0].midi, 48);
  assert.ok(c.every(n => n.start === 0));
  const prog = progressionNotes('Do M', ['I', 'IV', 'V', 'I']);
  assert.equal(prog.length, 16);
  assert.equal(prog[prog.length - 1].beats, 4);
  assert.deepEqual(prog.slice(0, 4).map(n => n.start), [0, 0, 0, 0]);
  const orn = notesOfPlay({ partitura: '| D5h |', ornamentos: [{ indice: 0, signo: 'trino' }], compas: '2/4' }, {});
  assert.ok(orn.length > 4);
  assert.equal(notesOfPlay({ notas: ['C4', 'E4', 'G4'], acorde: true }, {}).length, 4);
});

test('STOP del Nivel 4: cada error pedido existe en su lectura (o hay otro de la lista) y cambia lo que suena', () => {
  L4.units.forEach(u => u.exercises.filter(e => e.params.base).forEach(e => {
    const b = e.params.base;
    const tokens = scoreTokens(b.partitura);
    const kinds = stopKinds(e.params.errores);
    assert.ok(kinds.length, e.id);
    const plan = meterPlan(tokens, b.compas);
    const ts = stopBase(tokens, { matices: b.matices || [] });
    const any = kinds.some(k => stopOptions(ts, [k], barBeatsOf(b.compas), { plan, pickup: b.anacrusa || 0 }).length > 0 || ['liga', 'ds', 'dc'].includes(k) || k === 'R>e');
    assert.ok(any, `${e.id}: ningún error posible`);
  }));
  const trip = stopBase(scoreTokens('| C5e:3 C5e:3 C5e:3 C5q |'), {});
  assert.ok(stopOptions(trip, ['3>2'], 2).length === 1);
  assert.ok(stopOptions(stopBase(scoreTokens('| C5e C5q C5e |'), {}), ['sincopa', 'contratiempo'], 2).length >= 1);
  assert.ok(stopOptions(stopBase(scoreTokens('| C5q. C5q |'), {}), ['5/8>2+3'], 2.5).length === 1);
});

test('generadores: tresillos, cambios de compás y todas las discriminaciones del nivel tienen sonido y respuesta', () => {
  const r = genRhythm({ figuras: ['q', 'e:3', 'Re:3', 'q:3'], barBeats: 4, bars: 6, seed: 4 });
  assert.ok(r.some(t => t.dur === 'e:3') || r.some(t => t.dur === 'q:3'));
  const total = r.reduce((s, t) => s + t.beats, 0);
  assert.ok(Math.abs(total - 24) < 1e-6);
  const text = genRhythmChanging({ figuras: ['q', 'e', 'q.'], meters: ['3/4', '6/8'], bars: 4, seed: 2 });
  assert.match(text, /@time:6\/8/);
  let n = 0;
  L4.units.forEach(u => u.exercises.filter(e => e.params.tipo === 'discriminacion').forEach(e => {
    const qs = choiceQuestions(e.params, e.params.rondas || 8, 11);
    assert.ok(qs.length >= 8, e.id);
    new Set(qs.map(q => q.answer)).forEach(a => assert.ok(a >= 0));
    assert.ok(new Set(qs.map(q => q.answer)).size >= 2, `${e.id}: salen todas las respuestas`);
    qs.forEach(q => { assert.ok(q.options[q.answer], e.id); assert.ok(notesOfPlay(q.play, { songScore: () => null }).length > 0, e.id); });
    n++;
  }));
  assert.ok(n >= 19);
});

test('agilidad: grado, fundamental, tríada, enarmónica, armaduras de ±7 y claves nuevas', () => {
  const plan = (id, seed = 3) => agilityPlan(lmExercise(id).params, seed);
  const g = plan('lm4-u1-agilidad-a-medio');
  assert.equal(g.notes.length, 16);
  assert.ok(g.notes.every(x => x.grado >= 1 && x.grado <= 7));
  const f = plan('lm4-u4-agilidad-a-medio');
  assert.ok(f.notes.every(x => /^[A-G][#b]?$/.test(x.root)));
  const c = plan('lm4-u2-agilidad-a-medio');
  assert.deepEqual([...new Set(c.notes.map(x => x.tipo))].sort(), ['aumentada', 'disminuida', 'mayor', 'menor']);
  const a = plan('lm4-u7-agilidad-a-facil');
  assert.ok(a.notes.some(x => Math.abs(x) >= 6));
  assert.ok(answerButtons(lmExercise('lm4-u7-agilidad-a-facil').params, 'facil', 'eu').includes('data-minor="A#"'));
  const m = plan('lm4-u6-agilidad-b-medio');
  assert.ok(m.notes.some(x => x.startsWith('do4:')) && m.notes.some(x => x.startsWith('fa3:')));
  const e = plan('lm4-u7-agilidad-a-medio');
  assert.ok(e.enh);
});

test('creatividad: tresillos, síncopas (detector métrico), grupos, cambios de compás, acordes, cadencias y modulación', () => {
  const tk = text => scoreTokens(text);
  assert.equal(tripletBeats(tk('| C5e:3 C5e:3 C5e:3 C5q | C5q:3 C5q:3 C5q:3 |')), 3);
  assert.equal(tripletBeats(tk('| C5e:3 Re:3 C5e:3 C5q |')), 1);
  assert.equal(syncopations(tk('| C5e C5q C5e |'), '2/4').length, 1);
  assert.equal(syncopations(tk('| C5e C5e~ C5e C5e |'), '2/4').length, 1);
  assert.equal(syncopations(tk('| Re C5e Re C5e |'), '2/4').length, 0, 'el contratiempo no es síncopa');
  assert.equal(syncopations(tk('| C5q. C5e |'), '2/4').length, 0, 'el puntillo no es síncopa');
  assert.equal(syncopations(tk('| C5q C5h C5q |'), '4/4').length, 1);
  assert.equal(syncopations(tk('| C5q C5q C5q C5e C5e~ | C5e C5q C5q C5q |'), '4/4').filter(s => s.crossesBar).length, 1);
  assert.ok(groupsOk(tk('| C5q. C5q |'), '5/8', { agrupacion: [3, 2] }));
  assert.ok(!groupsOk(tk('| C5q C5q. |'), '5/8', { agrupacion: [3, 2] }));
  assert.ok(groupsOk(tk('| C5e Re C5e C5q |'), '5/8', { agrupacion: [3, 2] }));
  const plan = meterPlan(tk('| C5q C5q C5q | @time:2/4 C5q C5q | @time:3/4 C5q C5q C5q |'), '3/4');
  assert.equal(meterChanges(plan), 2);
  const spec = { permitidos: ['I', 'IV', 'V'], soloNotasDelAcorde: true };
  assert.deepEqual(Object.values(chordRules(tk('| C5q E5q G4h | F4q A4q C5h |'), ['I', 'IV'], spec, 'Do M')), [true, true, true, true]);
  assert.equal(chordRules(tk('| C5q E5q G4h | F4q A4q D5h |'), ['I', 'IV'], spec, 'Do M').notas, false);
  assert.equal(chordRules(tk('| C5q E5q G4h |'), ['ii'], { permitidos: ['I', 'V'] }, 'Do M').permitidos, false);
  assert.equal(cadenceAt(['I', 'IV', 'V', 'V'], 4), 'semicadencia');
  assert.equal(cadenceAt(['I', 'IV', 'V', 'I'], 4), 'perfecta');
  assert.ok(modulationOk(tk('| E4q G4q C5q G4q | A4q D5q F#4q A4q | G4w |'), { hasta: 'Sol M', notaNueva: 'F#' }));
  assert.ok(!modulationOk(tk('| E4q G4q C5q G4q | A4q D5q F4q A4q | G4w |'), { hasta: 'Sol M', notaNueva: 'F#' }));
  // con compases que cambian, cada uno mide lo suyo
  const ok = checkComposition(tk('| C5q C5q C5q | C5q C5q |'), { barBeats: 3, bars: 2, sizes: [3, 2] });
  assert.ok(ok.rules.find(r => r.id === 'longitud').ok && ok.rules.find(r => r.id === 'compases').ok);
  const wrong = checkComposition(tk('| C5q C5q C5h | C5q |'), { barBeats: 3, bars: 2, sizes: [3, 2] });
  assert.ok(!wrong.rules.find(r => r.id === 'compases').ok);
  const r = extraRules4({ rs: { tresillos: { minimo: 1 }, sincopas: { minimo: 1 } }, tokens: tk('| C5e:3 C5e:3 C5e:3 C5e C5q C5e |'), meter: '2/4', state: { chords: [] }, tonalidad: 'Do M' });
  assert.deepEqual(r.map(x => x.ok), [true, true]);
  // todos los ejercicios de creatividad del nivel tienen reglas que el motor entiende
  L4.units.forEach(u => u.exercises.filter(e => e.section === 'creatividad').forEach(e => {
    Object.keys(e.params.restricciones).forEach(k => assert.ok(['armadura', 'compas', 'compases', 'figuras', 'notas', 'final', 'tonalidad', 'letra', 'tresillos', 'incluyeAlguna', 'sincopas', 'sincopaBarra', 'acordes', 'cadencias', 'cadenciaFinal', 'agrupacion', 'cambiosCompas', 'modulacion', 'dada', 'movimiento'].includes(k), `${e.id}: regla ${k}`));
  }));
});

test('dictado de grados y de acordes: las respuestas salen de la tonalidad y suenan', () => {
  L4.units.forEach(u => u.exercises.filter(e => /dictado-de-grados/.test((e.params.herramienta || {}).tool || '')).forEach(e => {
    const want = gradosAnswer(e.params);
    assert.ok(want.length >= 3 && want.every(x => x), e.id);
    if (e.params.tipo === 'grados') assert.deepEqual(want, e.params.respuestaGrados.map(Number));
    assert.ok(gradosSound(e.params).length > want.length, e.id);
  }));
});

test('concierto y diploma: la media de las tres piezas, el repaso aprobado y la entrega emiten el diploma', () => {
  const unit = lmUnit(4, 8);
  const lm0 = { ...EMPTY_LM };
  assert.equal(orderedPieces(lm0, unit).length, 3);
  assert.equal(concertPct(lm0, unit), null);
  const r = (id, pct) => ({ id, pct, stars: 2 });
  const lm1 = { ...lm0, best: { 'lm4-u3-cancion-a-medio': r('a', 60), 'lm4-u7-cancion-a-facil': r('b', 80), 'lm4-u8-cancion-a-medio': r('c', 100) } };
  assert.equal(concertPct(lm1, unit), 80);
  assert.equal(diplomaStatus(lm1), 'faltan-ambos');
  const lm2 = { ...lm1, best: { ...lm1.best, 'lm4-u8-repaso-a-facil': r('d', 59) } };
  assert.ok(!reviewPassed(lm2));
  const lm3 = { ...lm1, best: { ...lm1.best, 'lm4-u8-repaso-a-medio': r('d', 60) } };
  assert.equal(diplomaStatus(lm3), 'falta-concierto');
  const delivered = deliverState(lm3, orderedPieces(lm3, unit).map(p => p.id), 123);
  assert.deepEqual(delivered.diploma, { at: 123, level: 4 });
  assert.equal(delivered.concierto.pct, 80);
  assert.equal(issueDiploma(lm3), lm3);
  assert.ok(!deliverState(lm2, ['x'], 5).diploma);
  assert.equal(diplomaStatus(delivered), 'emitido');
  // el repaso final trae preguntas de los niveles 1, 2 y 3
  assert.ok(lmQuestion(4, 'lm2u1-t1') && lmQuestion(4, 'lm3u1-t1'));
});

test('armaduras de 7 alteraciones dentro del pentagrama en todas las claves y clave de do sin puntos', () => {
  assert.deepEqual(keyRelPositions(-7, 'bass'), [2, 5, 1, 4, 0, 3, 6], 'fa♭ en la 4.ª línea de la clave de fa');
  for (const clef of ['treble', 'bass', 'alto', 'tenor', 'baritone'])
    for (const n of [-7, 7]) assert.ok(keyRelPositions(n, clef).every(r => r >= 0 && r <= 9), `${clef} ${n}`);
  for (const clef of ['alto', 'tenor']) assert.doesNotMatch(clefCell(clef), /lm-dot/, `clave de do (${clef}) sin los puntos de la de fa`);
});
