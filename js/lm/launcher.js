// Lanzador de los ejercicios del curso de Lenguaje Musical. Los tipos nuevos se hacen en la pantalla «lm»
// (screen.js); la lectura rítmica con palmas se abre en el ensayo rítmico de siempre con la partitura de la unidad, y
// las herramientas del bloque «En tu instrumento» (notas tenidas, afinar en acorde, gimnasio, primera vista, lecturas
// rítmicas, dictados, Toca libre, Libro y Método Pro) se abren con los parámetros fijos del temario.
// El resultado vuelve por el evento «lesson-finished» (lecciones) o por «lm-tool-result» (bridge.js) y se registra
// con el contrato (results.js). Al terminar, el botón principal devuelve a la unidad.
import { go } from '../router.js';
import { toast } from '../ui.js';
import { getState, update } from '../store.js';
import { instrumentById } from '../instruments.js';
import { sightReading, rhythmReading, technique, keyLabel } from '../generate.js';
import { octaveShiftFor } from '../songs.js';
import { launch, currentCourse } from '../launch.js';
import { LANGUAGE } from '../book-theory.js';
import { barBeatsOf } from './notes.js';
import { genRhythm } from './gen.js';
import { lmExercise, lmUnit, lmSong, TYPES } from './catalog.js';
import { recordLmResult } from './results.js';
import { LM_TOOL_EVENT } from './bridge.js';

const MAX_MISTAKES = 10;
let active = null; // { ex, startedAt }

const elapsed = () => (active ? (performance.now() - active.startedAt) / 1000 : 0);
const skillsFor = (ex, pct) => Object.fromEntries(ex.skills.map(k => [k, pct]));

export const activeExercise = () => (active ? active.ex : null);

// Registra el resultado del ejercicio en curso (lo usan también los tipos nuevos de screen.js)
export function recordActive(partial, { logMinutes = true } = {}) {
  if (!active) return null;
  const { ex } = active;
  const r = recordLmResult(ex.id, { skills: skillsFor(ex, partial.pct), ...partial, seconds: partial.seconds ?? elapsed() }, { logMinutes });
  active = { ...active, startedAt: performance.now() };
  return r;
}

// Tipos que aún no tienen pantalla (todas las lecturas rítmicas se hacen ya en la pantalla del curso)
function openTool() {
  toast('Este ejercicio todavía no está disponible');
}

// Herramientas del bloque «En tu instrumento» (temario de instrumento de la unidad): se abren con sus parámetros
// fijos y guardan su progreso como siempre (no son ejercicios del catálogo de Lenguaje)
const toUnit = { label: 'Volver a la unidad', run: () => go('learn') };
export function openInstrumentTool(h, unit = null) {
  const p = h.params || {};
  const inst = instrumentById(getState().instrument);
  const lesson = extra => ({ noRecord: true, nextAction: () => toUnit, ...extra });
  switch (h.tool) {
    case 'longtone': go('longtone', { secs: p.segundos || 8, dynamics: p.dinamica || null, routine: toUnit }); return;
    case 'chord': go('chord', { lm: { root: CHORD_ROOT[p.acorde] || 60, interval: CHORD_DEGREE[p.nota] || 'M3', hits: 3 } }); return;
    case 'gym': {
      const song = inst.rhythmOnly ? null : technique(p.kind || 'scale', p.key || 'C', inst, p.bpm || 60, p.figure || 'q');
      if (!song) { go('gym'); return; }
      launch(lesson({ id: song.id, kind: 'song', song, fixedSpeed: true, gym: { id: song.id, bpm: p.bpm || 60 }, noRecord: false }), { mode: 'tempo', from: 'lm' });
      return;
    }
    case 'generate.sightReading': {
      const song = inst.rhythmOnly ? rhythmReading(p.level || 1, p.seed || 1) : sightReading(p.level || 1, inst, p.seed || 1);
      launch(lesson({ id: song.id, kind: 'song', song, oneTake: true, sticking: song.sticking }), { mode: 'tempo', from: 'lm' });
      return;
    }
    case 'generate.rhythmReading': {
      // con las figuras que ya conoce la unidad (el generador de siempre metería blancas y redondas antes de tiempo)
      const song = unit && unit.raw.figuras ? unitReading(unit, p.seed || 1) : rhythmReading(p.level || 1, p.seed || 1);
      go('rhythm', { lesson: lesson({ id: song.id, kind: 'song', song, sticking: song.sticking }), from: 'lm', eyebrow: 'Lenguaje musical' });
      return;
    }
    case 'dictation.melodicDictation': go('dictation', { lm: { level: p.level, meter: p.meter, bars: p.bars } }); return;
    case 'free': {
      // De memoria: la canción de la unidad, tocada sin partitura y comparada nota a nota
      const tune = p.obra ? lmSong(1, p.obra) : null;
      if (!tune) { go('free', {}); return; }
      const song = { id: `lm-song-${tune.titulo}`.replace(/\W+/g, '-').slice(0, 60), title: tune.titulo, by: 'Band Flow', style: null, key: 'C', time: barBeatsOf(tune.compas), bpm: tune.tempo || 80, score: tune.partitura };
      launch(lesson({ id: song.id, kind: 'song', song, octaveShift: octaveShiftFor(song, inst) ?? 0 }), { mode: 'memory', from: 'lm' });
      return;
    }
    case 'book': {
      // la página del Libro del instrumento con esa teoría («b1-lm1-pentagrama»)
      import('../books.js').then(({ buildLibrary }) => {
        const page = buildLibrary(currentCourse(), inst).flatMap(b => b.chapters.flatMap(c => c.pages)).find(pg => pg.lesson.id.endsWith(`-${p.lesson}`));
        if (page) go('bookpage', { lessonId: page.lesson.id });
        else { update({ learnView: 'book' }); go('learn'); }
      }, () => toast('No se ha podido abrir. Revisa la conexión.'));
      return;
    }
    case 'method':
      // el primer nivel del Método Pro del instrumento (el temario asignable equivalente al final del nivel 1)
      import('../method.js').then(({ buildMethod, hasMethod }) => {
        const first = hasMethod(inst) ? buildMethod(inst, getState().nom)[0] : null;
        update({ learnView: 'pro' });
        if (first) go('pro', { id: first.leccion_id, tab: 'play' }); else go('learn');
      }, () => toast('No se ha podido abrir. Revisa la conexión.'));
      return;
    default: toast('Este ejercicio todavía no está disponible');
  }
}

// Lectura rítmica de 8 compases con las figuras de la unidad, en su compás
function unitReading(unit, seed) {
  const meter = (unit.meters && unit.meters[0]) || '4/4';
  const barBeats = barBeatsOf(meter);
  const tokens = genRhythm({ figuras: unit.raw.figuras.map(f => (f === 'ee' ? 'e' : f)), barBeats, bars: 8, seed });
  const bars = [];
  let cur = [];
  let sum = 0;
  tokens.forEach(t => { cur.push((t.rest ? 'R' : 'C5') + t.dur); sum += t.beats; if (Math.abs(sum % barBeats) < 1e-6) { bars.push(cur.join(' ')); cur = []; } });
  return { id: `rhythm-lm${unit.level}-u${unit.unit}-${seed}`, title: `Lectura rítmica · Unidad ${unit.unit}`, by: '', style: null, key: 'C', time: barBeats, bpm: 72, score: `| ${bars.join(' | ')} |` };
}

// Texto del botón de cada herramienta del bloque «En tu instrumento»
const TOOL_BASE = {
  longtone: 'Notas tenidas', chord: 'Afinar en acorde', gym: 'Gimnasio', 'generate.sightReading': 'Lectura a primera vista',
  'generate.rhythmReading': 'Lectura rítmica', 'dictation.melodicDictation': 'Dictado tocado', free: 'De memoria', book: 'Libro', method: 'Método Pro',
};
export function toolLabel(h) {
  const p = h.params || {};
  if (h.tool === 'longtone' && p.dinamica) return 'Notas tenidas con regulador';
  if (h.tool === 'chord') return p.nota === 'tercera' ? 'Afinar en acorde: la tercera' : 'Afinar en acorde: la tónica';
  if (h.tool === 'gym') return `${p.kind === 'arpeggio' ? 'Arpegio' : 'Escala'} de ${keyLabel(p.key || 'C')}`;
  if (h.tool === 'free' && p.obra) return `De memoria: ${p.obra}`;
  if (h.tool === 'book') { const topic = Object.values(LANGUAGE).flat().find(x => x.id === p.lesson); return topic ? `Libro: ${topic.title}` : 'Libro'; }
  return TOOL_BASE[h.tool] || h.tool;
}
const CHORD_ROOT = { C: 60, F: 65, G: 55, Bb: 58, Eb: 63 };
const CHORD_DEGREE = { tercera: 'M3', 'tónica': 'root', quinta: 'P5', sexta: 'M6' };

// Herramientas que valen para la familia del instrumento del alumno («para» vacío: todas)
// El xilófono (familia de percusión) también hace las escalas del gimnasio: es de láminas con altura
export const toolsFor = (tools, family, inst = null) => tools.filter(h => !h.para || h.para.includes(family)
  || (inst && inst.id === 'xylophone' && h.tool === 'gym'));

// Abre lo que asigna el Aula: una unidad, una sección de la unidad o ejercicios sueltos.
// target: { level, unit, section?, ids?, variant? }. Un solo ejercicio (o una sección con variante) se abre directamente;
// si no, la unidad en la vista «Lenguaje» de Aprender, con la sección o los ejercicios marcados.
export function openLmTarget(target = {}) {
  const level = Number(target.level || 1);
  const unit = Number(target.unit || 1);
  const ids = (target.ids || []).filter(id => lmExercise(id));
  const variant = ['facil', 'medio'].includes(target.variant) ? target.variant : null; // «any» del Aula: las dos
  const inSection = target.section ? (lmUnit(level, unit)?.exercises || []).filter(e => e.section === target.section && (!variant || e.variant === variant)) : [];
  const single = ids.length === 1 ? ids[0] : !ids.length && variant && inSection.length === 1 ? inSection[0].id : null;
  if (single) { openLmExercise(single); return; }
  update({ learnView: 'lm' });
  import('./view.js').then(m => {
    m.focusTarget({ level, unit, section: target.section || null, ids: ids.length ? ids : inSection.map(e => e.id) });
    go('learn');
  }, () => toast('No se ha podido abrir Lenguaje musical. Revisa la conexión.'));
}

export function openLmExercise(idOrEx) {
  const ex = typeof idOrEx === 'string' ? lmExercise(idOrEx) : idOrEx;
  if (!ex) { toast('Este ejercicio todavía no está disponible'); return; }
  active = { ex, startedAt: performance.now() };
  // la lectura rítmica se hace en la pantalla del curso: se corrige como el resto (golpes de más y en silencios
  // cuentan, ventanas del contrato, nota sobre 10); a dos voces, sistema de dos pentagramas y ostinato siempre sonando
  if (TYPES[ex.type] === 'lm' || ex.type === 'lectura-ritmica') go('lm', { ex });
  else openTool(ex);
}

// Lecciones (teoría, canciones, lecturas, gimnasio): pct = precisión de la toma (o las estrellas, si no hay)
function onLessonFinished(e) {
  const { lesson, stars, accuracy, missed } = e.detail || {};
  if (!lesson || !lesson.lm || lesson.lm.via === 'tool' || !active || active.ex.id !== lesson.lm.id) return;
  const base = accuracy === null || accuracy === undefined ? Math.round((stars || 0) * 100 / 3) : Math.round(accuracy * 100);
  // matices de la lectura rítmica (rhythm.js): pesan un 20 % y el fallo se apunta con el código del contrato
  const dyn = lesson.dynamicsResult;
  const pct = dyn && dyn.total ? Math.round(base * (0.8 + 0.2 * dyn.ok / dyn.total)) : base;
  const mistakes = [...(dyn && dyn.ok < dyn.total ? ['matiz'] : []), ...(missed || []).map((m, i) => (m ? `n${i + 1}` : null)).filter(Boolean)].slice(0, MAX_MISTAKES);
  recordActive({ pct, stars, mistakes }, { logMinutes: false });
}

// Herramientas con su propia pantalla de resultado (Dictados, acorde, notas tenidas, la ficha de teoría)
function onToolResult(e) {
  const d = e.detail || {};
  if (!active || active.ex.id !== d.id) return;
  // «log»: la herramienta no suma minutos por su cuenta (la ficha de teoría), así que se suman aquí
  const { id, log, ...partial } = d;
  recordActive(partial, { logMinutes: !!log });
}

if (typeof window !== 'undefined') {
  window.addEventListener('lesson-finished', onLessonFinished);
  window.addEventListener(LM_TOOL_EVENT, onToolResult);
}
