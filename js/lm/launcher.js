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
import { sightReading, rhythmReading, technique } from '../generate.js';
import { launch } from '../launch.js';
import { lmExercise, lmUnit, TYPES } from './catalog.js';
import { recordLmResult } from './results.js';
import { LM_TOOL_EVENT } from './bridge.js';

const MAX_MISTAKES = 10;
let active = null; // { ex, startedAt }

const backToUnit = () => ({ label: 'Volver a la unidad', run: () => go('learn') });
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

function lessonBase(ex, extra) {
  return { noRecord: true, lm: { id: ex.id }, nextAction: backToUnit, ...extra };
}

function rhythmLesson(ex, song) {
  return lessonBase(ex, { id: `rhythm-${ex.id}`, kind: 'song', title: ex.title, song, fixedSpeed: true });
}

// Lectura rítmica con palmas: el ensayo rítmico de siempre (micrófono, metrónomo y corrección golpe a golpe)
function openTool(ex) {
  const p = ex.params;
  if (ex.type === 'lectura-ritmica') {
    const time = Number(String(p.compas || '4/4').split('/')[0]);
    const song = { id: ex.id, title: ex.title, by: '', key: 'C', time, bpm: p.tempo || 72, score: p.partitura };
    go('rhythm', { lesson: rhythmLesson(ex, song), from: 'lm', eyebrow: 'Lenguaje musical' });
    return;
  }
  toast('Este ejercicio todavía no está disponible');
}

// Herramientas del bloque «En tu instrumento» (temario de instrumento de la unidad): se abren con sus parámetros
// fijos y guardan su progreso como siempre (no son ejercicios del catálogo de Lenguaje)
const toUnit = { label: 'Volver a la unidad', run: () => go('learn') };
export function openInstrumentTool(h) {
  const p = h.params || {};
  const inst = instrumentById(getState().instrument);
  const lesson = extra => ({ noRecord: true, nextAction: () => toUnit, ...extra });
  switch (h.tool) {
    case 'longtone': go('longtone', { secs: p.segundos || 8, dynamics: p.dinamica || null, routine: toUnit }); return;
    case 'chord': go('chord', {}); return;
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
      const song = rhythmReading(p.level || 1, p.seed || 1);
      go('rhythm', { lesson: lesson({ id: song.id, kind: 'song', song, sticking: song.sticking }), from: 'lm', eyebrow: 'Lenguaje musical' });
      return;
    }
    case 'dictation.melodicDictation': go('dictation', { lm: { level: p.level, meter: p.meter, bars: p.bars } }); return;
    case 'free': go('free', {}); return;
    case 'book': case 'method': update({ learnView: h.tool === 'book' ? 'book' : 'pro' }); go('learn'); return;
    default: toast('Este ejercicio todavía no está disponible');
  }
}

// Herramientas que valen para la familia del instrumento del alumno («para» vacío: todas)
export const toolsFor = (tools, family) => tools.filter(h => !h.para || h.para.includes(family));

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
  if (TYPES[ex.type] === 'lm') go('lm', { ex });
  else openTool(ex);
}

// Lecciones (teoría, canciones, lecturas, gimnasio): pct = precisión de la toma (o las estrellas, si no hay)
function onLessonFinished(e) {
  const { lesson, stars, accuracy, missed } = e.detail || {};
  if (!lesson || !lesson.lm || lesson.lm.via === 'tool' || !active || active.ex.id !== lesson.lm.id) return;
  const pct = accuracy === null || accuracy === undefined ? Math.round((stars || 0) * 100 / 3) : Math.round(accuracy * 100);
  const mistakes = (missed || []).map((m, i) => (m ? `n${i + 1}` : null)).filter(Boolean).slice(0, MAX_MISTAKES);
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
