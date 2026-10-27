// Método Pro de viento (opcional, aparte del curso): cada nivel con tres pestañas, Libro, Relax y Práctica.
// Convierte el contenido (grados de la escala) en el nivel de cada instrumento, con el formato del JSON de lecciones:
// { leccion_id, titulo_leccion, pestana_libro, pestana_relax, pestana_practica }. Sin DOM.
import { LEVELS_1 } from './method-content-1.js';
import { LEVELS_2 } from './method-content-2.js';
import { bandScale } from './course-winds.js';
import { parseNote, parseScore, noteLabel, diatonicStep } from './music.js';
import { lessonKey } from './course.js';
import { L } from './tips-l10n.js';

export const METHOD_COURSE = 1;
export const LEVELS = [...LEVELS_1, ...LEVELS_2];
export const PASS_STARS = 1;

// Valor en pulsos de cada figura de «completar el compás» («ee» = dos corcheas unidas, «R» delante = silencio)
export const FIGURE_BEATS = { w: 4, 'h.': 3, h: 2, 'q.': 1.5, q: 1, ee: 1, e: 0.5, Rw: 4, Rh: 2, Rq: 1 };

const GROUP = {
  flute: 'bisel', piccolo: 'bisel', oboe: 'oboe', trombone: 'vara',
  clarinet: 'cana', 'eb-clarinet': 'cana', 'bass-clarinet': 'cana', sax: 'cana', 'sax-tenor': 'cana', 'sax-bari': 'cana', 'sax-soprano': 'cana',
};

export const isWind = inst => !!inst && (inst.family === 'madera' || inst.family === 'metal');
export const groupOf = inst => GROUP[inst.id] || inst.family;
const tags = inst => [groupOf(inst), inst.family, inst.clef === 'bass' ? 'fa' : 'sol', 'all'];

// Texto con variantes: el más concreto que exista para el instrumento
export function pick(variants, inst) {
  const key = tags(inst).find(k => variants[k] !== undefined);
  return key ? variants[key] : '';
}

const appliesTo = (item, inst) => (!item.para || item.para.some(t => tags(inst).includes(t)))
  && !(item.excepto || []).some(t => tags(inst).includes(t));

export const levelId = n => `viento_c${METHOD_COURSE}_n${n}`;

// «| 0q 1e (2h) |» → notas escritas de la escala del instrumento
export function degreeScore(text, scale) {
  return text.replace(/(^|\s)(\(?)([0-7])(?=[whqe])/g, (m, sp, open, d) => sp + open + scale[Number(d)]);
}

// Opciones de «¿qué nota es?»: la correcta y tres vecinas, girando el orden para que la buena no caiga siempre igual
function readOptions(degree, seed) {
  const others = [degree + 1, degree - 1, degree + 2, degree - 2, degree + 3].filter(d => d >= 0 && d <= 7 && d !== degree).slice(0, 3);
  const all = [degree, ...others].sort((a, b) => a - b);
  const rot = (degree + seed) % all.length;
  return [...all.slice(rot), ...all.slice(0, rot)];
}

function resolveItem(item, scale, nom, i, id) {
  const base = { ...item, id: `${id}-r${i}` };
  delete base.para; delete base.excepto;
  if (item.tipo_interaccion === 'leer_nota') {
    const degrees = readOptions(item.grado, i + 2);
    return {
      ...base, tipo_interaccion: 'opcion_multiple', pregunta: L('¿Qué nota está escrita?', 'Which note is written?'),
      opciones: degrees.map(d => noteLabel(parseNote(scale[d]), nom)), respuesta_correcta: degrees.indexOf(item.grado),
      pentagrama: scale[item.grado], notesAreNames: true,
    };
  }
  if (item.tipo_interaccion === 'escribir_nota') {
    return { ...base, consigna: L('Escribe en el pentagrama la nota:', 'Write this note on the staff:'), nota: scale[item.grado], nombre: noteLabel(parseNote(scale[item.grado]), nom) };
  }
  if (item.tipo_interaccion === 'dictado') {
    return { ...base, tipo_interaccion: 'escribir_nota', modo: 'dictado', consigna: L('Escucha las dos notas. La primera ya está escrita: escribe la segunda.', 'Listen to the two notes. The first is already written: write the second.'), referencia: scale[0], nota: scale[item.grado] };
  }
  if (item.tipo_interaccion === 'completar_compas') return { ...base, consigna: L('Completa el compás con las figuras de abajo', 'Fill the bar with the note values below') };
  if (item.tipo_interaccion === 'marcar_ritmo') return { ...base, consigna: L('Escucha el ritmo y márcalo tocando el botón en cada nota', 'Listen to the rhythm and tap the button on every note') };
  return base;
}

// Nivel listo para la app, con el formato del JSON y lo que necesita la pantalla (partitura, clave, armadura)
export function buildLevel(level, inst, nom = 'eu') {
  const scale = bandScale(inst);
  const id = levelId(level.n);
  const p = level.practica;
  const score = degreeScore(p.score, scale);
  const used = [...new Set(parseScore(score).notes.filter(n => !n.rest).map(n => n.midi))].sort((a, b) => a - b);
  const usedNames = used.map(m => {
    const name = scale.find(s => parseNote(s).midi === m);
    return noteLabel(parseNote(name), nom);
  });
  return {
    leccion_id: id,
    nivel: level.n,
    titulo_leccion: level.titulo,
    pestana_libro: {
      descripcion: level.descripcion,
      bloque_teoria_solfeo: pick(level.teoria, inst),
      bloque_tecnica_instrumento: pick(level.tecnica, inst),
      consejo_unificado: pick(level.consejo, inst),
    },
    pestana_relax: level.relax.filter(it => appliesTo(it, inst)).map((it, i) => resolveItem(it, scale, nom, i, id)),
    pestana_practica: {
      instruccion_pantalla: p.instruccion,
      bpm_recomendado: p.bpm,
      notas_usadas: usedNames,
      rutina_pasos: p.rutina_pasos,
      criterio_microfono: p.criterio_microfono,
    },
    key: inst.bandKey, time: p.time, clef: inst.clef || 'treble', score, scale,
  };
}

export const buildMethod = (inst, nom = 'eu') => LEVELS.map(l => buildLevel(l, inst, nom));

// Lección del reproductor (micrófono) para la pestaña Práctica
export function practiceLesson(level) {
  const lessonId = 'pro-' + level.leccion_id;
  return {
    id: lessonId, kind: 'song', title: level.titulo_leccion, sub: 'Método Pro',
    song: { id: lessonId, title: level.titulo_leccion, by: 'Método Pro', style: null, difficulty: 1, key: level.key, time: level.time, bpm: level.pestana_practica.bpm_recomendado, score: level.score },
  };
}

// ---------- Corrección (sin DOM) ----------
export const sameWrittenNote = (a, b) => diatonicStep(parseNote(a)) === diatonicStep(parseNote(b));

export function barBeats(figures) {
  return figures.reduce((sum, f) => sum + FIGURE_BEATS[f], 0);
}

export function checkBar(item, added) {
  const total = barBeats([...item.dados, ...added]);
  return Math.abs(total - item.compas) < 1e-6 && (!item.usar || added.includes(item.usar));
}

// Ataques esperados (en pulsos) de un ritmo «| q q h |»; los silencios no se marcan
export function rhythmOnsets(ritmo) {
  const out = [];
  let beat = 0;
  ritmo.split(/\s+/).filter(t => t && t !== '|').forEach(tok => {
    const rest = tok.startsWith('R');
    const fig = rest ? tok.slice(1) : tok;
    if (!rest) out.push(beat);
    beat += FIGURE_BEATS[fig];
  });
  return { onsets: out, beats: beat };
}

// Toques del alumno (en pulsos desde el primer pulso del ritmo) frente a los esperados: acierto si cada ataque tiene un
// toque cerca y no sobran toques
export const TAP_WINDOW_BEATS = 0.3;
export function gradeTaps(onsets, taps) {
  const used = new Set();
  let hits = 0;
  onsets.forEach(o => {
    const k = taps.findIndex((t, i) => !used.has(i) && Math.abs(t - o) <= TAP_WINDOW_BEATS);
    if (k >= 0) { used.add(k); hits++; }
  });
  const extra = taps.length - used.size;
  return { hits, total: onsets.length, extra, ok: hits === onsets.length && extra === 0 };
}

// Estrellas de Relax: todo a la primera 3, hasta dos fallos 2, más fallos 1
export const relaxStars = mistakes => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

// Estado de cada nivel: se abre el siguiente al aprobar el Relax o la Práctica del anterior
export function levelStates(levels, saved = {}, progress = {}, unlockAll = false) {
  const out = {};
  let open = true;
  levels.forEach(l => {
    const s = saved[l.leccion_id] || {};
    const play = progress[lessonKey(practiceLesson(l))] || 0;
    const done = (s.relax || 0) >= PASS_STARS || play >= PASS_STARS;
    out[l.leccion_id] = { book: !!s.book, relax: s.relax || 0, play, state: done ? 'done' : open || unlockAll ? 'open' : 'locked' };
    if (!done) open = false;
  });
  if (unlockAll) Object.values(out).forEach(v => { if (v.state === 'locked') v.state = 'open'; });
  return out;
}
