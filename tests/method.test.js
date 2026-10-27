// Método Pro de viento: formato del JSON de lecciones, contenido completo y traducido, notas en el registro de cada
// instrumento y corrección de los retos de Relax.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS, instrumentById } from '../js/instruments.js';
import { buildMethod, buildLevel, LEVELS, isWind, checkBar, rhythmOnsets, gradeTaps, relaxStars, levelStates, practiceLesson, sameWrittenNote, barBeats } from '../js/method.js';
import { parseScore, parseNote } from '../js/music.js';
import { TIPS_EN } from '../js/tips-l10n.js';
import { lessonKey } from '../js/course.js';

const WINDS = INSTRUMENTS.filter(isWind);
const words = s => s.trim().split(/\s+/).length;

test('hay doce niveles y cada uno sigue el formato del JSON', () => {
  assert.equal(LEVELS.length, 12);
  const level = buildMethod(instrumentById('trumpet'))[0];
  assert.equal(level.leccion_id, 'viento_c1_n1');
  ['descripcion', 'bloque_teoria_solfeo', 'bloque_tecnica_instrumento', 'consejo_unificado'].forEach(k => assert.ok(level.pestana_libro[k], k));
  ['instruccion_pantalla', 'bpm_recomendado', 'notas_usadas', 'rutina_pasos', 'criterio_microfono'].forEach(k => assert.ok(level.pestana_practica[k], k));
});

test('la descripción del libro tiene entre 100 y 150 palabras', () => {
  LEVELS.forEach(l => {
    const n = words(l.descripcion);
    assert.ok(n >= 100 && n <= 150, `nivel ${l.n}: ${n} palabras`);
  });
});

test('todos los instrumentos de viento tienen sus textos, sus retos y notas en su registro', () => {
  WINDS.forEach(inst => buildMethod(inst).forEach(level => {
    const b = level.pestana_libro;
    assert.ok(b.bloque_teoria_solfeo && b.bloque_tecnica_instrumento && b.consejo_unificado, `${inst.id} ${level.leccion_id}`);
    assert.ok(level.pestana_relax.length >= 5, `${inst.id} ${level.leccion_id}: ${level.pestana_relax.length} retos`);
    const score = parseScore(level.score);
    score.notes.filter(n => !n.rest).forEach(n => assert.ok(n.midi >= inst.written[0] && n.midi <= inst.written[1], `${inst.id} ${level.leccion_id}: ${n.midi}`));
    score.bars.forEach(bar => assert.equal(bar.beats, level.time, `${inst.id} ${level.leccion_id}: compás incompleto`));
  }));
});

test('las respuestas de los retos son válidas', () => {
  WINDS.forEach(inst => buildMethod(inst).forEach(level => level.pestana_relax.forEach(it => {
    const where = `${inst.id} ${it.id}`;
    if (it.tipo_interaccion === 'opcion_multiple') assert.ok(it.respuesta_correcta >= 0 && it.respuesta_correcta < it.opciones.length && new Set(it.opciones).size === it.opciones.length, where);
    if (it.tipo_interaccion === 'verdadero_falso') assert.equal(typeof it.respuesta_correcta, 'boolean', where);
    if (it.tipo_interaccion === 'completar_hueco') assert.equal(it.texto_incompleto.split('___').length - 1, it.palabras_correctas.length, where);
    if (it.tipo_interaccion === 'escribir_nota') assert.ok(parseNote(it.nota).midi >= inst.written[0], where);
    if (it.tipo_interaccion === 'completar_compas') {
      assert.ok(barBeats(it.dados) < it.compas, where);
      assert.ok(!it.usar || it.figuras.includes(it.usar), where);
    }
    if (it.tipo_interaccion === 'marcar_ritmo') assert.equal(rhythmOnsets(it.ritmo).beats % it.compas, 0, where);
  })));
});

test('el oboe y la flauta no oyen hablar de caña o boquilla donde no la tienen', () => {
  const text = id => JSON.stringify(buildMethod(instrumentById(id)).map(l => l.pestana_libro.bloque_tecnica_instrumento));
  assert.doesNotMatch(text('flute'), /caña|boquilla/);
  assert.doesNotMatch(text('trombone'), /pistón|pistones/);
  assert.match(text('trombone'), /vara/);
});

test('todo el contenido tiene traducción al inglés', () => {
  const missing = [];
  const check = s => { if (typeof s === 'string' && /[a-záéíóúñ]{3}/i.test(s) && !TIPS_EN[s]) missing.push(s); };
  buildMethod(instrumentById('clarinet')).concat(buildMethod(instrumentById('trombone'))).forEach(level => {
    check(level.titulo_leccion);
    Object.values(level.pestana_libro).forEach(check);
    const p = level.pestana_practica;
    [p.instruccion_pantalla, p.criterio_microfono, ...p.rutina_pasos].forEach(check);
    level.pestana_relax.forEach(it => {
      [it.pregunta, it.afirmacion, it.texto_incompleto, it.mensaje_acierto, it.mensaje_error, it.consigna].forEach(check);
      if (!it.notesAreNames) (it.opciones || []).forEach(check);
      [...(it.palabras_correctas || []), ...(it.palabras_señuelo || [])].forEach(check);
    });
  });
  assert.deepEqual(missing, []);
});

test('corrección: compás, ritmo, nota escrita y estrellas', () => {
  const bar = { compas: 4, dados: ['h'], usar: null };
  assert.ok(checkBar(bar, ['q', 'q']));
  assert.ok(!checkBar(bar, ['q']));
  assert.ok(!checkBar({ ...bar, usar: 'ee' }, ['h']));
  const { onsets, beats } = rhythmOnsets('| q Rq h |');
  assert.deepEqual(onsets, [0, 2]);
  assert.equal(beats, 4);
  assert.ok(gradeTaps([0, 1, 2], [0.1, 0.95, 2.2]).ok);
  assert.ok(!gradeTaps([0, 1, 2], [0.1, 0.95, 1.5, 2.2]).ok);
  assert.ok(!gradeTaps([0, 1, 2], [0.1, 2.2]).ok);
  assert.ok(sameWrittenNote('B4', 'Bb4'));
  assert.ok(!sameWrittenNote('B4', 'C5'));
  assert.deepEqual([0, 1, 2, 3].map(relaxStars), [3, 2, 2, 1]);
});

test('los niveles se abren al aprobar el anterior (Relax o Práctica)', () => {
  const list = buildMethod(instrumentById('sax'));
  let st = levelStates(list, {}, {});
  assert.equal(st.viento_c1_n1.state, 'open');
  assert.equal(st.viento_c1_n2.state, 'locked');
  st = levelStates(list, { viento_c1_n1: { relax: 2 } }, {});
  assert.equal(st.viento_c1_n2.state, 'open');
  st = levelStates(list, {}, { [lessonKey(practiceLesson(list[0]))]: 1 });
  assert.equal(st.viento_c1_n1.state, 'done');
  assert.equal(levelStates(list, {}, {}, true).viento_c1_n12.state, 'open');
});

test('los nombres de las notas siguen la nomenclatura elegida', () => {
  const eu = buildLevel(LEVELS[0], instrumentById('flute'), 'eu');
  const us = buildLevel(LEVELS[0], instrumentById('flute'), 'us');
  assert.deepEqual(eu.pestana_practica.notas_usadas, ['Si♭']);
  assert.deepEqual(us.pestana_practica.notas_usadas, ['B♭4']);
});

test('cada tema del Libro tiene su ilustración y un ejemplo que suena en el registro del instrumento', async () => {
  const { figureFor } = await import('../js/pro-figures.js');
  WINDS.forEach(inst => buildMethod(inst).forEach(level => {
    const fig = figureFor(level, inst);
    assert.match(fig.svg, /^<svg/, `${inst.id} ${level.leccion_id}`);
    assert.ok(TIPS_EN[fig.caption], `${level.leccion_id}: pie sin traducir`);
    parseScore(fig.play).notes.filter(n => !n.rest).forEach(n => assert.ok(n.midi >= inst.written[0] && n.midi <= inst.written[1], `${inst.id} ${level.leccion_id}: ${n.midi}`));
  }));
});

test('el violín tiene su propio libro Pro con el formato de violín', async () => {
  const { VIOLIN_LEVELS } = await import('../js/method-violin.js');
  const { figureFor } = await import('../js/pro-figures.js');
  const violin = instrumentById('violin');
  const levels = buildMethod(violin);
  assert.equal(levels.length, 12);
  assert.equal(levels[0].leccion_id, 'violin_c1_n1');
  VIOLIN_LEVELS.forEach(l => { const n = words(l.descripcion); assert.ok(n >= 100 && n <= 150, `violín ${l.n}: ${n} palabras`); });
  const missing = [];
  const check = s => { if (typeof s === 'string' && /[a-záéíóúñ]{3}/i.test(s) && !TIPS_EN[s]) missing.push(s); };
  const ZONES = { arco: 3, contacto: 3, cuerdas: 4 };
  levels.forEach(level => {
    const p = level.pestana_practica;
    assert.ok(p.criterio_microfono_hz && !p.criterio_microfono, level.leccion_id);
    [level.titulo_leccion, ...Object.values(level.pestana_libro), p.instruccion_pantalla, p.criterio_microfono_hz, ...p.rutina_pasos].forEach(check);
    const score = parseScore(level.score);
    score.notes.filter(n => !n.rest).forEach(n => assert.ok(n.midi >= violin.written[0] && n.midi <= violin.written[1], `${level.leccion_id}: ${n.midi}`));
    score.bars.forEach(bar => assert.equal(bar.beats, level.time, `${level.leccion_id}: compás incompleto`));
    assert.ok(level.pestana_relax.length >= 5, level.leccion_id);
    level.pestana_relax.forEach(it => {
      [it.pregunta, it.pregunta_ui, it.afirmacion, it.texto_incompleto, it.mensaje_acierto, it.mensaje_error].forEach(check);
      if (!it.notesAreNames) (it.opciones || []).forEach(check);
      if (it.tipo_interaccion === 'zona_tactil') {
        assert.equal(it.opciones.length, ZONES[it.zona], it.id);
        assert.ok(it.respuesta_correcta < it.opciones.length, it.id);
      }
      if (it.tipo_interaccion === 'opcion_multiple') assert.ok(it.respuesta_correcta < it.opciones.length && new Set(it.opciones).size === it.opciones.length, it.id);
      if (it.tipo_interaccion === 'escribir_nota') assert.ok(it.nota, it.id);
    });
    const fig = figureFor(level, violin);
    assert.ok(fig && TIPS_EN[fig.caption], `${level.leccion_id}: ilustración`);
  });
  assert.deepEqual(missing, []);
  assert.ok(levels.some(l => l.pestana_relax.some(it => it.tipo_interaccion === 'zona_tactil')));
});

test('la percusión tiene su libro Pro con manos, superficie y criterio de ritmo', async () => {
  const { PERC_LEVELS, gradeSticks, strokeCount } = await import('../js/method.js');
  const { figureFor } = await import('../js/pro-figures.js');
  const perc = instrumentById('percussion');
  const levels = buildMethod(perc);
  assert.equal(levels.length, 12);
  assert.equal(levels[0].leccion_id, 'perc_c1_n1');
  PERC_LEVELS.forEach(l => { const n = words(l.descripcion); assert.ok(n >= 100 && n <= 150, `percusión ${l.n}: ${n} palabras`); });
  const missing = [];
  const check = s => { if (typeof s === 'string' && /[a-záéíóúñ]{3}/i.test(s) && !TIPS_EN[s]) missing.push(s); };
  levels.forEach(level => {
    const p = level.pestana_practica;
    assert.ok(p.criterio_microfono_ritmo && p.superficie_recomendada && !p.notas_usadas, level.leccion_id);
    [level.titulo_leccion, ...Object.values(level.pestana_libro), p.instruccion_pantalla, p.superficie_recomendada, p.criterio_microfono_ritmo, ...p.rutina_pasos].forEach(check);
    assert.equal(level.sticking.length, strokeCount(level.score), `${level.leccion_id}: una mano por golpe`);
    assert.equal(lessonKey(practiceLesson(level)), 'lesson:pro-' + level.leccion_id);
    assert.deepEqual(practiceLesson(level).sticking, level.sticking);
    parseScore(level.score).bars.forEach(bar => assert.ok(Math.abs(bar.beats - level.time) < 1e-6, `${level.leccion_id}: compás incompleto`));
    const types = new Set(level.pestana_relax.map(it => it.tipo_interaccion));
    assert.ok(level.pestana_relax.length >= 5 && types.has('tocar_baquetas'), level.leccion_id);
    level.pestana_relax.forEach(it => {
      [it.pregunta, it.pregunta_ui, it.afirmacion, it.texto_incompleto, it.mensaje_acierto, it.mensaje_error, it.consigna].forEach(check);
      if (it.tipo_interaccion !== 'opcion_multiple' || !it.notesAreNames) (it.opciones || []).forEach(check);
      [...(it.palabras_correctas || []), ...(it.palabras_señuelo || [])].forEach(check);
      if (it.tipo_interaccion === 'secuencia_logica') assert.ok(it.secuencia_correcta.length >= 3 && it.secuencia_correcta.every(h => h === 'D' || h === 'I'), it.id);
      if (it.tipo_interaccion === 'tocar_baquetas' || it.tipo_interaccion === 'marcar_ritmo') {
        const { onsets, beats } = rhythmOnsets(it.ritmo);
        assert.ok(Math.abs(beats % it.compas) < 1e-6 || Math.abs(beats % it.compas - it.compas) < 1e-6, it.id);
        if (it.manos) assert.equal(it.manos.length, onsets.length, it.id);
      }
      if (it.tipo_interaccion === 'completar_compas') assert.ok(barBeats(it.dados) < it.compas && (!it.usar || it.figuras.includes(it.usar)), it.id);
    });
    const fig = figureFor(level, perc);
    assert.ok(fig && fig.svg.startsWith('<svg') && TIPS_EN[fig.caption], `${level.leccion_id}: ilustración`);
    parseScore(fig.play);
  });
  assert.deepEqual(missing, []);
  assert.ok(levels.some(l => l.pestana_relax.some(it => it.tipo_interaccion === 'secuencia_logica' && it.secuencia_correcta.join('') === 'DIDD')));
  // Reto de baquetas: a tiempo y con la mano que toca
  const taps = [{ beat: 0.05, hand: 'D' }, { beat: 1.02, hand: 'I' }];
  assert.ok(gradeSticks([0, 1], ['D', 'I'], taps).ok);
  const swapped = gradeSticks([0, 1], ['D', 'I'], [{ beat: 0, hand: 'I' }, { beat: 1, hand: 'D' }]);
  assert.equal(swapped.ok, false);
  assert.equal(swapped.wrongHand, 2);
  assert.equal(gradeSticks([0, 1], ['D', 'I'], [...taps, { beat: 2, hand: 'D' }]).extra, 1);
});

test('el cajón y los instrumentos sin método Pro no reciben niveles', () => {
  assert.deepEqual(buildMethod(instrumentById('guitar')), []);
  assert.deepEqual(buildMethod(instrumentById('cajon')), []);
});
