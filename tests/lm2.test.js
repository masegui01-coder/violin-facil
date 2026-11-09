// Curso de Lenguaje Musical · Nivel 2: contenido (sumas de compás, prosodia de las canciones) y motor nuevo (altura real,
// ligaduras, línea de tiempo con casillas y D.C., 6/8, clave de fa, intervalos, STOP nuevo y reglas de creatividad).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LM_LEVELS, allLmExercises, lmExercise, lmQuestion, lmSong, parseLmId, mistakeText } from '../js/lm/catalog.js';
import U1 from '../js/lm/level2/u1.js';
import U2 from '../js/lm/level2/u2.js';
import U3 from '../js/lm/level2/u3.js';
import U4 from '../js/lm/level2/u4.js';
import U5 from '../js/lm/level2/u5.js';
import U6 from '../js/lm/level2/u6.js';
import U7 from '../js/lm/level2/u7.js';
import U8 from '../js/lm/level2/u8.js';
import META from '../js/lm/level2/meta.js';
import { prosodyIssues, beatWeight } from '../js/lm/prosody.js';
import {
  scoreTokens, barBeatsOf, positionText, stepOf, nameOfStep, resolvePitches, accidentalSigns, keyAcc, pitchName, attackTokens, isCompound, pulseBeatsOf, tokenMidi, interval,
} from '../js/lm/notes.js';
import { writtenMark, gradeWriting, checkComposition, gradeAgility } from '../js/lm/grade.js';
import { formOf, passesOf, barOrder, expandForm } from '../js/lm/form.js';
import { readingTimeline, metronomeBeats, syllablesOf, toleranceMs } from '../js/lm/rhythm-plan.js';
import { layoutTokens, clefCell } from '../js/lm/staff-lm.js';
import { stopKinds, stopOptions, stopRoundOf, stopBase, genRhythm, genMelody, choiceQuestions, cellTokens } from '../js/lm/gen.js';
import { agilityPlan, answerOf } from '../js/lm/tasks-agility.js';
import { intervalRounds, writeLimits } from '../js/lm/tasks-staff.js';
import { songPasses } from '../js/lm/tasks-song.js';
import { gradeReading } from '../js/lm/reading-grade.js';

const UNITS = [U1, U2, U3, U4, U5, U6, U7, U8];
const level2 = () => LM_LEVELS[1];

// ---------- Catálogo ----------
test('Nivel 2: 8 unidades en el catálogo, con ids lm2-u{n}-{sección}-{a|b|c}-{facil|medio}', () => {
  assert.equal(level2().level, 2);
  assert.equal(level2().units.length, 8);
  const exs = level2().units.flatMap(u => u.exercises);
  assert.ok(exs.length >= 190, `${exs.length} ejercicios`);
  exs.forEach(e => {
    assert.match(e.id, /^lm2-u[1-8]-[a-z]+-[abc]-(facil|medio)$/, e.id);
    assert.equal(lmExercise(e.id), e);
    assert.equal(parseLmId(e.id).level, 2);
  });
  assert.equal(META.nivel, 2);
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
test('Nivel 2: cada partitura suma lo que pide su compás (ejercicios, canciones, fichas, preguntas)', () => {
  let n = 0;
  UNITS.forEach(u => {
    Object.values(u.secciones).flat().forEach(ex => {
      if (ex.partitura && ex.compas) { checkBars(ex.id, ex.partitura, ex.compas, ex.anacrusa || 0); n++; }
      if (ex.voz1 && ex.compas) { checkBars(`${ex.id} voz1`, ex.voz1, ex.compas); n++; }
      (ex.items || ex.preguntas || []).forEach(it => {
        if (it.partitura && it.compas && it.tipo !== 'barras' && it.erroneoAdrede === undefined) { checkBars(it.id, it.partitura, it.compas); n++; }
        if (it.play && it.play.partitura && it.play.compas) { checkBars(`${it.id} play`, it.play.partitura, it.play.compas); n++; }
      });
    });
    u.teoria.ficha.forEach((f, i) => { if (f.ejemplo && f.compas) { checkBars(`${u.id} ficha ${i + 1}`, f.ejemplo, f.compas, f.anacrusa || 0); n++; } });
    checkBars(`${u.id} canción`, u.cancion.partitura, u.cancion.compas, u.cancion.anacrusa || 0);
  });
  assert.ok(n > 100, `${n} partituras comprobadas`);
});

test('Nivel 2: la prosodia de las canciones (con prosody.js, que entiende el 6/8) y la letra casa con las notas', () => {
  UNITS.forEach(u => {
    const s = u.cancion;
    assert.ok(s.palabras, `${u.id}: palabras`);
    assert.deepEqual(prosodyIssues({ partitura: s.partitura, compas: s.compas, anacrusa: s.anacrusa || 0 }, s.letra, s.palabras), [], `${s.titulo}: estrofa 1`);
    if (s.letra2) assert.deepEqual(prosodyIssues({ partitura: s.partitura, compas: s.compas, anacrusa: s.anacrusa || 0 }, s.letra2, s.palabras2), [], `${s.titulo}: estrofa 2`);
  });
});

test('prosodia en 6/8: peso 3 en el 0, 2 en el 1,5 y 0 en las demás corcheas; una ligadura no lleva sílaba propia', () => {
  assert.deepEqual([0, 0.5, 1, 1.5, 2, 2.5].map(p => beatWeight(p, 3, true)), [3, 0, 0, 2, 0, 0]);
  assert.equal(beatWeight(1.5, 3, false), 0);
  // «Duér-me-te» con una blanca ligada: la continuación no cuenta como sílaba
  // «Aquí está» con la blanca ligada de un compás a otro: el compás 2 no tiene sílaba y no se desalinea
  const tied = prosodyIssues({ partitura: '| C4q D4q E4h~ | E4h Rh |', compas: '4/4' }, [['A', 'quí', 'va'], []], 'Aquí va');
  assert.equal(tied.filter(i => i.word === 'letra desalineada').length, 0);
  // y dentro del compás (3/4, la ligadura queda en el mismo): la continuación no recibe la siguiente sílaba
  const inside = prosodyIssues({ partitura: '| C4q D4q~ D4q | E4h. |', compas: '3/4' }, [['A', 'ma'], ['sol']], 'Ama sol');
  assert.equal(inside.filter(i => i.word === 'letra desalineada').length, 0);
});

// ---------- Altura real: alteraciones y armadura ----------
test('altura real: fa♯ no es fa; con un bemol, el «si» escrito es si♭; las alteraciones valen hasta la barra', () => {
  assert.equal(keyAcc('B', -1), -1);
  assert.equal(keyAcc('F', 1), 1);
  assert.equal(keyAcc('E', -1), 0);
  assert.equal(pitchName(stepOf('B4'), -1), 'Bb4');
  assert.equal(pitchName(stepOf('B4'), -1, 0), 'B4');
  const toks = resolvePitches([{ step: stepOf('B4'), dur: 'q' }, { step: stepOf('B4'), dur: 'q', acc: 'n' }, { step: stepOf('B4'), dur: 'q' }, { step: stepOf('F4'), dur: 'q', acc: '#' }, { step: stepOf('F4'), dur: 'q' }], { armadura: -1, bars: [0, 0, 0, 1, 1] });
  assert.deepEqual(toks.map(t => t.name), ['Bb4', 'B4', 'B4', 'F#4', 'F#4']);
  const want = scoreTokens('| F#4q |')[0];
  assert.equal(writtenMark(want, { step: stepOf('F4'), dur: 'q', name: 'F4' }), 'near', 'la figura bien, la altura no');
  assert.equal(writtenMark(want, { step: stepOf('F4'), dur: 'q', name: 'F#4', midi: want.midi }), 'ok');
  const g = gradeWriting(scoreTokens('| B4q Bb4q |'), [{ step: stepOf('B4'), dur: 'q', name: 'B4', midi: 71 }, { step: stepOf('B4'), dur: 'q', name: 'B4', midi: 71 }]);
  assert.deepEqual(g.marks, ['ok', 'near']);
  assert.ok(g.mistakes.includes('Bb4>B4'));
});

test('dibujo de alteraciones: la armadura cubre las suyas; contradecirla o cambiarla dentro del compás pone signo; becuadro de cortesía', () => {
  const t = scoreTokens('| B4q Bb4q A4h | B4q A4q G4h |');
  assert.deepEqual(accidentalSigns(t, t.map(x => x.bar), 0), [null, 'b', null, 'n', null, null], 'sin armadura: ♭ y el becuadro de cortesía');
  const f = scoreTokens('| F4q Bb4q B4q Bb4q |');
  assert.deepEqual(accidentalSigns(f, f.map(x => x.bar), -1), [null, null, 'n', 'b'], 'con un bemol: el si♭ no lleva signo; el si natural, becuadro');
  const g = scoreTokens('| G4q F#4q F#4h |');
  assert.deepEqual(accidentalSigns(g, g.map(x => x.bar), 1), [null, null, null]);
  assert.match(clefCell('treble', '4/4', -1), /♭/);
  assert.match(clefCell('bass', null, 1), /♯/);
});

test('composición por altura real: notas, final, obligatorias, intervalos y figuras distintas', () => {
  const t = resolvePitches(scoreTokens('| F4q Bb4q Bb4q A4q | G4q F4q C5h |').map(x => ({ ...x })), { armadura: 0, bars: scoreTokens('| F4q Bb4q Bb4q A4q | G4q F4q C5h |').map(x => x.bar) });
  const allowed = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5'];
  const ok = checkComposition(t, { barBeats: 4, bars: 2, notes: allowed, endSteps: ['F4', 'F5'], mustFigures: { Bb4: 2 }, intervals: [4, 5] });
  assert.equal(ok.rules.find(r => r.id === 'notas').ok, true);
  assert.equal(ok.rules.find(r => r.id === 'final').ok, false, 'acaba en do, no en fa');
  assert.equal(ok.rules.find(r => r.id === 'incluye').ok, true);
  assert.equal(ok.rules.find(r => r.id === 'intervalos').ok, true, 'fa-si♭ es una 4.ª y fa-do una 5.ª');
  const nat = checkComposition(scoreTokens('| F4q B4q B4q A4q |'), { barBeats: 4, bars: 1, mustFigures: { Bb4: 2 } });
  assert.equal(nat.rules.find(r => r.id === 'incluye').ok, false, 'si natural no es si♭');
  const tonic = checkComposition(scoreTokens('| A4q C5q E5q F5q | D5w |'), { barBeats: 4, bars: 2, endPc: [2], endFigure: 'w' });
  assert.equal(tonic.rules.find(r => r.id === 'final').ok, true, 'termina en re (cualquier octava) con redonda');
  const any = checkComposition(scoreTokens('| C5q. C5e C5s C5s C5e |'), { barBeats: 2.5 + 0.5, bars: 1, any: { de: ['h.', 'q.', 's', 'e.'], distintas: 2 } });
  assert.equal(any.rules.find(r => r.id === 'alguna').ok, true);
});

// ---------- Ligaduras ----------
test('scoreTokens expone las ligaduras: una nota ligada es un solo ataque', () => {
  const t = scoreTokens('| G4q G4q G4h~ | G4h G4q G4q |');
  assert.equal(t[2].tie, true);
  assert.equal(t[3].tiedFrom, true);
  assert.equal(t.filter(x => x.tiedFrom).length, 1);
  const a = attackTokens(t);
  assert.equal(a.length, 5);
  assert.equal(a[2].beats, 4);
  // notas distintas no se ligan
  assert.equal(scoreTokens('| G4q~ A4q |').some(x => x.tiedFrom), false);
  // la letra no da sílaba a la continuación
  const syl = syllablesOf(t, { pulse: 1 });
  assert.equal(syl[3], '');
});

test('ligadura en la lectura: la continuación no es un ataque; palmearla es el error «liga»', () => {
  const tokens = scoreTokens('| C5q C5q C5h~ | C5h C5q C5q |');
  const tl = readingTimeline({ compas: '4/4' }, tokens);
  const cont = tl.events.filter(e => e.cont);
  assert.equal(cont.length, 1);
  const attacks = tl.events.filter(e => !e.rest && !e.cont);
  const spb = 0.5;
  const at = e => e.beat * spb;
  const rests = tl.events.filter(e => e.rest || e.cont).map(e => ({ from: at(e), to: at(e) + e.beats * spb, dur: e.dur, ...(e.cont ? { code: 'liga' } : {}) }));
  const hitsOk = attacks.map(at);
  const good = gradeReading({ notes: attacks.map(e => ({ at: at(e), dur: e.dur })), rests, hits: hitsOk, tol: 0.08 });
  assert.equal(good.pct, 100);
  const bad = gradeReading({ notes: attacks.map(e => ({ at: at(e), dur: e.dur })), rests, hits: [...hitsOk, at(cont[0]) + 0.01], tol: 0.08 });
  assert.ok(bad.pct < 100);
  assert.ok(bad.mistakes.includes('liga'));
  assert.match(mistakeText('liga'), /ligada/);
});

// ---------- Línea de tiempo: casillas, D.C. ----------
test('orden de los compases: repetición, casillas de 1.ª y 2.ª vez y D.C. al Fine', () => {
  assert.deepEqual(barOrder(formOf({ repeticion: { desde: 1, hasta: 8, casilla1: [7, 8], casilla2: [9, 10] } }), 10), [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 9, 10]);
  assert.deepEqual(barOrder(formOf({ repeticion: { desde: 1, hasta: 3, casilla1: [3], casilla2: [4] } }), 4), [1, 2, 3, 1, 2, 4]);
  assert.deepEqual(barOrder(formOf({ dc: { fine: 2 } }), 4), [1, 2, 3, 4, 1, 2]);
  assert.deepEqual(barOrder(formOf({ repeticion: true }), 3), [1, 2, 3, 1, 2, 3]);
  assert.deepEqual(barOrder(formOf({ repeticion: { desde: 1, hasta: 8 } }), 8), [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(barOrder(null, 3), [1, 2, 3]);
  assert.equal(passesOf(formOf({ dc: { fine: 2 } }), 4).length, 2);
});

test('la línea de tiempo de la lectura sigue el orden de la forma (casillas y D.C.) y el calderón', () => {
  const song = lmSong(2, 'Lluvia y sol');
  const tokens = scoreTokens(song.partitura);
  const tl = readingTimeline({ compas: song.compas, repeticion: song.repeticion }, tokens);
  const barsPlayed = [...new Set(tl.events.map(e => `${e.pass}:${e.bar + 1}`))];
  assert.deepEqual(barsPlayed.filter(x => x.startsWith('1:')).map(x => Number(x.slice(2))), [1, 2, 3, 4, 5, 6, 9, 10]);
  assert.equal(tl.passes, 2);
  assert.equal(tl.passStarts.length, 2);
  // el instante de la 2.ª vuelta se vuelve a la partitura: el compás 1
  assert.equal(tl.scoreBeat(tl.passStarts[1]), 0);
  const rhythm = scoreTokens('| C5q C5q | C5h | C5q C5q | C5h |');
  const dc = readingTimeline({ compas: '2/4', dc: { fine: 2 } }, rhythm);
  assert.equal(dc.total, 8 + 4);
  const form = formOf({ dc: { fine: 2 } });
  const ex = expandForm(rhythm, form, { barBeats: 2 });
  assert.equal(ex.length, 9);
  assert.equal(ex[6].pass, 1);
  assert.equal(ex[8].barNo, 2);
});

test('la canción cantada sigue el mismo orden: letra de cada vuelta y ligadura como una sola nota', () => {
  const song = lmSong(2, 'Lluvia y sol');
  const tokens = scoreTokens(song.partitura);
  const passes = songPasses(tokens, { form: formOf(song), meter: song.compas });
  assert.equal(passes.length, 2);
  assert.deepEqual(passes[1].bars, [1, 2, 3, 4, 5, 6, 9, 10]);
  assert.ok(Math.abs(passes[1].length - 16) < 1e-6);
  const nana = lmSong(2, 'Nana de la luna');
  const nt = scoreTokens(nana.partitura);
  const p = songPasses(nt, { meter: nana.compas });
  assert.equal(p[0].notes.length, attackTokens(nt).filter(t => !t.rest).length);
  assert.ok(nt.some(t => t.tiedFrom));
});

// ---------- 6/8 ----------
test('6/8: el pulso es la negra con puntillo; el metrónomo marca 2 por compás y, con subdivisión, las corcheas más suaves', () => {
  assert.equal(isCompound('6/8'), true);
  assert.equal(isCompound('3/4'), false);
  assert.equal(pulseBeatsOf('6/8'), 1.5);
  assert.equal(barBeatsOf('6/8'), 3);
  const all = metronomeBeats({ length: 6, barBeats: 3, pulse: 1.5, metro: 'all' });
  assert.deepEqual(all.map(c => c.beat), [0, 1.5, 3, 4.5]);
  assert.deepEqual(all.map(c => c.level), ['down', 'pulse', 'down', 'pulse']);
  const sub = metronomeBeats({ length: 3, barBeats: 3, pulse: 1.5, metro: 'all', subdivision: true });
  assert.deepEqual(sub.map(c => `${c.beat}${c.level[0]}`), ['0d', '0.5s', '1s', '1.5p', '2s', '2.5s']);
  const first = metronomeBeats({ length: 6, barBeats: 3, pulse: 1.5, metro: 'first' });
  assert.deepEqual(first.map(c => c.beat), [0, 3]);
  assert.deepEqual(metronomeBeats({ length: 4, barBeats: 2, pulse: 1, metro: 'all' }).map(c => c.beat), [0, 1, 2, 3]);
  assert.deepEqual(metronomeBeats({ length: 4, barBeats: 3, pulse: 1.5, metro: 'none' }), []);
});

test('6/8: las corcheas se unen de tres en tres, las semicorcheas con segunda barra y la anacrusa de corchea', () => {
  const six = layoutTokens(scoreTokens('| C5e C5e C5e C5e C5e C5e |'), { barBeats: 3, pulse: 1.5 });
  assert.deepEqual(six.map(x => `${x.beam.in ? 'i' : ''}${x.beam.out ? 'o' : ''}`), ['o', 'io', 'i', 'o', 'io', 'i']);
  const simple = layoutTokens(scoreTokens('| C5e C5e C5e C5e C5e C5e |'), { barBeats: 3, pulse: 1 });
  assert.deepEqual(simple.map(x => `${x.beam.in ? 'i' : ''}${x.beam.out ? 'o' : ''}`), ['o', 'i', 'o', 'i', 'o', 'i']);
  const semi = layoutTokens(scoreTokens('| C5e C5s C5s C5q |'), { barBeats: 2, pulse: 1 });
  assert.equal(semi[2].beam.in2, true);
  assert.equal(semi[0].beam.out, true);
  const dotted = layoutTokens(scoreTokens('| C5e. C5s C5q |'), { barBeats: 2 });
  assert.equal(dotted[1].beam.stub2, -1, 'el saltillo: la semicorchea lleva un trazo hacia la corchea con puntillo');
  const pick = layoutTokens(scoreTokens('| E4e | A4q B4e C5q A4e |'), { barBeats: 3, pickup: 0.5, pulse: 1.5 });
  assert.equal(pick[0].bar, 0);
  assert.equal(pick[0].barEnd, true);
  assert.equal(pick[1].bar, 1);
});

test('6/8: generadores y sílabas (ta-a-a, ti-ti-ti, ta-i)', () => {
  const r = genRhythm({ figuras: ['q.', 'e', 'q', 'h.', 'Re', 'Rq.'], barBeats: 3, bars: 8, seed: 11, compound: true });
  let sum = 0;
  r.forEach(t => { sum += t.beats; });
  assert.ok(Math.abs(sum - 24) < 1e-6);
  let at = 0;
  r.forEach(t => { const into = at % 3; assert.ok(into + t.beats <= 3 + 1e-6, 'ninguna figura cruza el compás'); at += t.beats; });
  assert.deepEqual(syllablesOf(scoreTokens('| C5q. C5q. | C5e C5e C5e C5q C5e |'), { pulse: 1.5 }), ['ta-a-a', 'ta-a-a', 'ti', 'ti', 'ti', 'ta', 'i']);
  assert.deepEqual(syllablesOf(scoreTokens('| C5s C5s C5s C5s | C5e C5s C5s | C5e. C5s C5q. C5e |'), { pulse: 1 }), ['ti', 'ri', 'ti', 'ri', 'ti', 'ti', 'ri', 'taaa', 'ri', 'taaa', 'i']);
  assert.deepEqual(cellTokens('Rq.').map(t => `${t.rest ? 'R' : ''}${t.dur}`), ['Rq.']);
  assert.deepEqual(cellTokens('q.e').map(t => t.dur), ['q.', 'e']);
  const q = choiceQuestions({ opciones: ['3/4', '6/8'] }, 4, 3);
  assert.equal(q.length, 4);
  q.forEach(x => assert.ok(x.options[x.answer]));
});

test('tolerancia: ±60 ms en Media con semicorcheas a más de 80, y la de siempre en los demás casos', () => {
  const semi = scoreTokens('| C5e C5s C5s C5q |');
  assert.equal(toleranceMs('medio', semi, 96), 60);
  assert.equal(toleranceMs('medio', semi, 72), 80);
  assert.equal(toleranceMs('facil', semi, 96), 120);
  assert.equal(toleranceMs('medio', scoreTokens('| C5q C5q |'), 96), 80);
});

// ---------- Clave de fa ----------
test('clave de fa: las posiciones en el pentagrama y las líneas adicionales', () => {
  assert.equal(positionText(stepOf('G2'), 'bass'), 'primera línea');
  assert.equal(positionText(stepOf('A3'), 'bass'), 'quinta línea');
  assert.equal(positionText(stepOf('C3'), 'bass'), 'segundo espacio');
  assert.equal(positionText(stepOf('C4'), 'bass'), 'línea adicional 1 por encima');
  assert.equal(positionText(stepOf('E2'), 'bass'), 'línea adicional 1 por debajo');
  assert.deepEqual(writeLimits('bass').map(nameOfStep), ['C2', 'G4']);
  assert.deepEqual(writeLimits('treble').map(nameOfStep), ['C4', 'A5']);
  const bass = layoutTokens(scoreTokens('| C3e D3e E3q |'), { barBeats: 2, clef: 'bass' });
  assert.equal(bass[0].up, true, 'por debajo de la línea central, la plica sube');
});

test('agilidad: clave mixta sin rachas de más de 3, gran pentagrama, intervalos y armadura', () => {
  const mixed = agilityPlan({ clave: 'mixta', notas: { sol: ['C4', 'D4', 'E4', 'F4'], fa: ['C3', 'D3', 'E3', 'F3'] }, modo: 'nombrar', cantidad: 60, segundosPorNota: 2 }, 5);
  let run = 1;
  let maxRun = 1;
  mixed.notes.forEach((n, i) => { run = i && n.split(':')[0] === mixed.notes[i - 1].split(':')[0] ? run + 1 : 1; maxRun = Math.max(maxRun, run); });
  assert.ok(maxRun <= 3, `racha de ${maxRun}`);
  assert.ok(mixed.notes.some(n => n.startsWith('fa:')) && mixed.notes.some(n => n.startsWith('sol:')));
  const flat = agilityPlan({ clave: 'mixta', notas: ['C4', 'D4', 'E4', 'C3', 'D3', 'E3'], modo: 'nombrar', cantidad: 20, segundosPorNota: 2 }, 2);
  assert.equal(flat.notes.length, 20);
  const iv = agilityPlan({ clave: 'sol', notas: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], modo: 'intervalo', intervalos: [2, 3, 4, 5, 6, 7, 8], cantidad: 16, segundosPorNota: 5 }, 9);
  iv.notes.forEach(x => assert.equal(Math.abs(stepOf(x.a) - stepOf(x.b)) + 1, x.number));
  assert.equal(answerOf('Bb4'), 'Bb');
  assert.equal(answerOf('F#5'), 'F#');
  assert.equal(mistakeText('3>4'), 'intervalo: era una 3.ª y se dijo una 4.ª');
  assert.equal(gradeAgility(8, 0, 8).pct, 100);
});

// ---------- Intervalos ----------
test('dictado de intervalos: cada ronda es el intervalo pedido (hacia arriba o abajo) con notas naturales', () => {
  const rounds = intervalRounds({ desde: ['C4', 'E4', 'G4', 'C5'], intervalos: [2, 3, 4, 5, 6, 7, 8], direccion: ['asc', 'desc'], rondas: 12 }, 4);
  assert.equal(rounds.length, 12);
  rounds.forEach(r => {
    const d = stepOf(r.to) - stepOf(r.from);
    assert.equal(Math.abs(d) + 1, r.number);
    assert.equal(d > 0, r.dir === 'asc');
    assert.ok(/^[A-G]\d$/.test(r.to));
  });
  assert.deepEqual(interval('C4', 'G4'), { number: 5, quality: 'J', code: '5J' });
  assert.deepEqual(intervalRounds({ desde: ['C4'], intervalos: [3, 5, 8], direccion: ['asc'], rondas: 6 }, 7), intervalRounds({ desde: ['C4'], intervalos: [3, 5, 8], direccion: ['asc'], rondas: 6 }, 7), 'con semilla: igual para toda la clase');
});

// ---------- STOP ----------
test('STOP del Nivel 2: cada error pedido existe en la lectura de su base y la ronda suena distinta', () => {
  const stops = level2().units.flatMap(u => u.exercises).filter(e => e.type === 'stop');
  assert.equal(stops.length, 16);
  stops.forEach(e => {
    const base = e.params.base;
    assert.ok(base && base.partitura, `${e.id}: base`);
    const tokens = scoreTokens(base.partitura);
    const barBeats = barBeatsOf(base.compas);
    const form = formOf(base);
    const played = form ? expandForm(tokens, form, { pickup: base.anacrusa || 0, barBeats }) : tokens;
    const melodic = /-entonacion-/.test(base.id);
    const ctx = { armadura: base.armadura || 0, melodic, form };
    const kinds = stopKinds(e.params.errores);
    // cada error del catálogo cabe en la lectura (de los que cubre «cualquier figura», basta uno)
    e.params.errores.forEach(txt => assert.ok(stopKinds([txt]).some(k => stopOptions(stopBase(played, { melodic }), [k], barBeats, { ...ctx, pickup: base.anacrusa || 0 }).length > 0), `${e.id}: no cabe «${txt}»`));
    for (let k = 0; k < 3; k++) {
      const r = stopRoundOf(played, { kinds, seed: 21 + k * 101, barBeats, pickup: base.anacrusa || 0, round: k, ctx });
      assert.ok(r.errorBeat >= 0 && r.code, e.id);
      assert.ok(kinds.includes(r.code), `${e.id}: ${r.code} no está entre ${kinds}`);
    }
  });
});

test('STOP: los errores nuevos cambian lo que suena en el sitio que dicen', () => {
  const t = scoreTokens('| C5q. C5e C5q C5q | C5h. Rq | C5s C5s C5s C5s C5e C5s C5s C5q | C5e. C5s C5q C5h |');
  const ts = stopBase(t, {});
  const one = (k, ctx = {}) => stopRoundOf(t, { kinds: [k], seed: 3, barBeats: 4, ctx });
  const a = one('q.e>qq');
  assert.equal(a.code, 'q.e>qq');
  assert.deepEqual(a.played.slice(0, 3).map(x => x.dur), ['q', 'q', 'q']);
  assert.equal(one('h.>h').played.filter(x => x.rest).length, 2);
  assert.ok(one('ssss>ee').played.length < ts.length);
  assert.equal(one('ess>sse').code, 'ess>sse');
  assert.equal(one('e.s>ee').code, 'e.s>ee');
  const alt = stopRoundOf(scoreTokens('| F4q Bb4q A4q G4q |').map(x => ({ ...x })), { kinds: ['alteracion'], seed: 2, barBeats: 4, ctx: { armadura: -1, melodic: true } });
  assert.equal(alt.code, 'alteracion');
  assert.ok(alt.played.some(x => x.name === 'Bb4' && x.midi === 71), 'el si♭ suena natural');
  const six = stopRoundOf(scoreTokens('| C5q. C5q. | C5q. C5q. |'), { kinds: ['6/8>3/4'], seed: 2, barBeats: 3 });
  assert.equal(six.played.filter(x => x.dur === 'q').length, 3);
  const rr = stopRoundOf(scoreTokens('| C5q Re C5e C5q | C5q. Rq. |'), { kinds: ['R>e'], seed: 4, barBeats: 3 });
  assert.equal(rr.played.filter(x => x.rest).length, 1);
  // casillas: la 2.ª vuelta repite la casilla 1
  const piece = scoreTokens('| C5q D5q | E5q D5q | C5q G4q | C5h |');
  const form = formOf({ repeticion: { desde: 1, hasta: 3, casilla1: [3], casilla2: [4] } });
  const exp = expandForm(piece, form, { barBeats: 2 });
  const cas = stopRoundOf(exp, { kinds: ['casilla'], seed: 1, barBeats: 2, ctx: { form } });
  assert.equal(cas.code, 'casilla');
  assert.ok(cas.played.some(x => x.barNo === 3 && x.pass === 1));
  // D.C.: no vuelve o no para en el Fine
  const dform = formOf({ dc: { fine: 2 } });
  const dexp = expandForm(piece, dform, { barBeats: 2 });
  const dcs = [1, 2, 3, 4, 5, 6].map(s => stopRoundOf(dexp, { kinds: ['dc'], seed: s, barBeats: 2, ctx: { form: dform } }));
  assert.ok(dcs.every(r => r.code === 'dc'));
  assert.ok(dcs.some(r => r.played.length < dexp.length) || dcs.some(r => r.played.length > dexp.length));
  assert.equal(mistakeText('stop-dc'), 'no notó: un D.C. olvidado');
});

// ---------- Creatividad: contenido ----------
test('creatividad del Nivel 2: las restricciones se entienden y cada parte tiene su nota', () => {
  const crea = level2().units.flatMap(u => u.exercises).filter(e => e.section === 'creatividad');
  assert.equal(crea.length, 16);
  crea.forEach(e => {
    const rs = e.params.restricciones;
    assert.ok(rs.compas && rs.compases, e.id);
    (rs.notas || []).forEach(n => assert.ok(Number.isFinite(stepOf(n)), `${e.id}: ${n}`));
    if (rs.dada) checkBars(e.id, rs.dada, rs.compas);
  });
});

test('Nivel 2: toda pregunta de teoría y audición tiene respuesta dentro de sus opciones', () => {
  level2().units.forEach(u => u.exercises.filter(e => e.section === 'teoria' || e.section === 'audicion').forEach(e => {
    (e.params.items || e.params.preguntas || []).forEach(it => {
      if (it.options && Number.isInteger(it.answer)) assert.ok(it.answer < it.options.length, it.id);
      if (it.tipo === 'completar') it.correctas.forEach(c => assert.ok(c < it.opciones.length, it.id));
      assert.ok(lmQuestion(2, it.id), it.id);
    });
  }));
});

test('el pentagrama dibuja las alteraciones aunque el compás lleve matiz (sin «undefined»)', async () => {
  const { staffHtml } = await import('../js/lm/kit.js');
  const { scoreTokens } = await import('../js/lm/notes.js');
  const html = staffHtml(scoreTokens('F#4q G4q A4q B4q | C#5h D5h'), { meter: '4/4', dynamics: [{ compas: 1, signo: 'mf' }, { compas: 2, signo: 'f' }] });
  assert.ok(!/undefined/.test(html), 'sin texto «undefined»');
  assert.equal((html.match(/class="lm-acc"[^>]*>♯</g) || []).length, 2, 'los dos sostenidos');
  assert.match(html, /lm-dyn[^>]*>mf</);
});
