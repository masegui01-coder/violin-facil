// Catálogo del curso de Lenguaje Musical: niveles → unidades → ejercicios. Lo comparten el curso del alumno y el Aula
// (que asigna ejercicios por su id). Cada ejercicio tiene versión Fácil y Media.
//
// Contrato de ids: lm{nivel}-u{unidad}-{sección}-{parte a|b|c}-{facil|medio}, p. ej. «lm1-u3-ritmo-a-facil».
// Ejercicio: { id, level, unit, section, letter, variant, type, title, params, skills }
//   type: herramienta que lo hace (TYPES); params: el ejercicio tal cual lo diseñó el profesorado (level1/u*.js),
//   con lo que necesita de su unidad ya resuelto (la lectura base del STOP, la canción, la audición, la ficha);
//   skills: competencias que puntúa (contrato: skillsPorSeccion).
// Unidad: { level, unit, id, title, goal, color, notes, objectives, novelties, blocks, exercises, raw }
//   blocks: secciones en el orden de la unidad, intercaladas con el bloque «En tu instrumento» (temario de instrumento).
import U1 from './level1/u1.js';
import U2 from './level1/u2.js';
import U3 from './level1/u3.js';
import U4 from './level1/u4.js';
import U5 from './level1/u5.js';
import U6 from './level1/u6.js';
import U7 from './level1/u7.js';
import U8 from './level1/u8.js';
import META_1 from './level1/meta.js';

export const LM_SECTIONS = ['teoria', 'ritmo', 'agilidad', 'entonacion', 'dictado', 'cancion', 'audicion', 'creatividad', 'repaso'];
export const LM_VARIANTS = ['facil', 'medio'];
export const LM_SKILLS = ['ritmo', 'entonacion', 'lectura', 'teoria', 'dictado', 'audicion'];
export const SECTION_NAME = {
  teoria: 'Teoría', ritmo: 'Ritmo', agilidad: 'Agilidad de notas', entonacion: 'Entonación', dictado: 'Dictado',
  cancion: 'Canción de la unidad', audicion: 'Audición y cultura', creatividad: 'Creatividad', repaso: 'Repaso',
};
export const VARIANT_NAME = { facil: 'Fácil', medio: 'Media' };
export const SKILL_NAME = { ritmo: 'Ritmo', entonacion: 'Entonación', lectura: 'Lectura', teoria: 'Teoría', dictado: 'Dictado', audicion: 'Audición' };
export const LM_META = { 1: META_1 };

// «tool»: herramienta que ya existía (se abre con parámetros fijos); «lm»: tipo nuevo (pantalla del ejercicio, screen.js)
export const TYPES = {
  'lectura-ritmica': 'tool',
  teoria: 'lm', stop: 'lm', agilidad: 'lm', entonacion: 'lm', 'cancion-cantada': 'lm', escribir: 'lm', discriminacion: 'lm',
  audicion: 'lm', creatividad: 'lm', repaso: 'lm',
};

// Orden de la unidad: lo que se aprende en Lenguaje se aplica en el instrumento en la misma unidad
const BLOCK_ORDER = ['teoria', 'ritmo', 'instrumento', 'agilidad', 'entonacion', 'cancion', 'dictado', 'audicion', 'creatividad', 'repaso'];

const ID_RE = /^lm(\d+)-u(\d+)-([a-z]+)-([a-z])-(facil|medio)$/;
export const lmId = ({ level, unit, section, letter = 'a', variant }) => `lm${level}-u${unit}-${section}-${letter}-${variant}`;
export function parseLmId(id) {
  const m = ID_RE.exec(String(id));
  if (!m || !LM_SECTIONS.includes(m[3])) return null;
  return { level: Number(m[1]), unit: Number(m[2]), section: m[3], letter: m[4], variant: m[5] };
}
export const unitKey = (level, unit) => `lm${level}-u${unit}`;

function typeOf(section, ex) {
  const tool = (ex.herramienta && ex.herramienta.tool) || '';
  if (section === 'ritmo') return /stop/.test(tool) ? 'stop' : 'lectura-ritmica';
  if (section === 'dictado') return /discriminacion/.test(tool) ? 'discriminacion' : 'escribir';
  if (section === 'cancion') return 'cancion-cantada';
  return section;
}

// Lo que cada ejercicio necesita de su unidad, ya resuelto
function resolve(section, ex, raw) {
  const list = raw.secciones[section] || [];
  if (section === 'teoria') return { ...ex, ficha: raw.teoria.ficha };
  if (section === 'ritmo' && ex.base) return { ...ex, base: list.find(b => b.id === ex.base) || null };
  if (section === 'cancion' || (section === 'dictado' && ex.compases)) return { ...ex, cancion: raw.cancion };
  if (section === 'audicion') return { ...ex, audicion: raw.audicion };
  if (section === 'dictado' || section === 'repaso') return { ...ex, figurasUnidad: raw.figuras || [] };
  return ex;
}

function expandUnit(level, raw) {
  const exercises = LM_SECTIONS.flatMap(section => (raw.secciones[section] || []).map(ex => {
    const p = parseLmId(ex.id);
    return {
      id: ex.id, level, unit: raw.unit, section, letter: p.letter, variant: p.variant, type: typeOf(section, ex),
      title: ex.title || ex.titulo || '', params: resolve(section, ex, raw), skills: ex.skills || [],
    };
  }));
  const blocks = BLOCK_ORDER.map(k => (k === 'instrumento'
    ? { kind: 'instrument', idea: raw.instrumento.idea, families: raw.instrumento.familias, tools: raw.instrumento.herramientas || [], exercises: [] }
    : { kind: 'section', section: k, exercises: exercises.filter(e => e.section === k) })).filter(b => b.kind === 'instrument' || b.exercises.length);
  return {
    level, unit: raw.unit, id: unitKey(level, raw.unit), title: raw.titulo, goal: raw.lema, color: `var(--u${((raw.unit - 1) % 8) + 1})`,
    notes: raw.notas, meters: raw.compases, key: raw.tonalidad, objectives: raw.objetivos || [], novelties: raw.novedades || [],
    song: raw.cancion, listening: raw.audicion, blocks, exercises, raw,
  };
}

const LEVEL_1 = {
  level: 1, title: 'Nivel 1', sub: 'Pulso, negra, corchea, blanca y redonda · 2/4, 3/4 y 4/4 · clave de sol · do mayor y la menor',
  units: [U1, U2, U3, U4, U5, U6, U7, U8].map(u => expandUnit(1, u)),
};
// Niveles 2-4 (fase 2): aparecen como «próximamente» en el curso
const COMING = [
  { level: 2, title: 'Nivel 2', sub: 'Clave de fa, semicorcheas, puntillo, 6/8 e intervalos', units: [] },
  { level: 3, title: 'Nivel 3', sub: 'Menores, intervalos mayores y menores, ligaduras y tres alteraciones', units: [] },
  { level: 4, title: 'Nivel 4', sub: 'Todas las tonalidades, tresillos, síncopas, grados y acordes', units: [] },
];

export const LM_LEVELS = [LEVEL_1, ...COMING];

export const lmLevel = level => LM_LEVELS.find(l => l.level === Number(level)) || null;
export const lmUnit = (level, unit) => (lmLevel(level)?.units || []).find(u => u.unit === Number(unit)) || null;
export const allLmExercises = () => LM_LEVELS.flatMap(l => l.units.flatMap(u => u.exercises));
export function lmExercise(id) {
  const p = parseLmId(id);
  if (!p) return null;
  return (lmUnit(p.level, p.unit)?.exercises || []).find(e => e.id === id) || null;
}
// El hermano Fácil/Media de un ejercicio (si existe: algunos solo tienen versión Media)
export const siblingId = (id, variant) => String(id).replace(/-(facil|medio)$/, `-${variant}`);

// Catálogo plano para el Aula: { id, level, unit, section, variant, title, type, skills }
export const LM_CATALOG = allLmExercises().map(({ id, level, unit, section, variant, title, type, skills }) => ({ id, level, unit, section, variant, title, type, skills }));

// Códigos de error → texto legible (el inglés está en i18n-en-lm.js). Los del contrato del nivel, más los que añaden
// los ejercicios (STOP, barras, escritura, reglas de la composición). «X>Y»: nota X leída o cantada como Y.
export const LM_MISTAKES = {
  ...META_1.codigosError,
  'semitono-oido': 'no distinguió el tono del semitono al oírlo', modo: META_1.codigosError.modo,
  'stop-pronto': 'paró antes del error', 'stop-tarde': 'paró tarde', 'stop-no': 'no paró la música',
  'barra-falta': 'faltó una barra de compás', 'barra-sobra': 'sobró una barra de compás', falta: 'faltó una nota', sobra: 'sobró una nota',
  altura: 'nota equivocada', 'r-longitud': 'número de compases', 'r-compases': 'compases incompletos', 'r-figuras': 'figura no permitida',
  'r-notas': 'nota no permitida', 'r-final': 'final no pedido', 'r-saltos': 'salto no permitido', 'r-incluye': 'faltan figuras obligatorias', 'r-semitonos': 'faltan los semitonos',
};
export function mistakeText(code) {
  if (LM_MISTAKES[code]) return LM_MISTAKES[code];
  const m = /^([A-G][#b]?\d)>([A-G][#b]?\d?)$/.exec(code);
  if (m) return `${m[1]} → ${m[2]}`;
  if (/-sil$/.test(code)) return 'no se oyó la nota';
  if (/-t$/.test(code)) return 'se acabó el tiempo';
  return null;
}

// Pregunta de teoría o de audición por su id (bancos del repaso)
export function lmQuestion(level, qid) {
  for (const u of lmLevel(level)?.units || []) {
    for (const ex of u.exercises) {
      const found = (ex.params.items || ex.params.preguntas || []).find(q => q.id === qid);
      if (found) return { ...found, unit: u.unit, section: ex.section };
    }
  }
  return null;
}
// Canción de una unidad por su id («lm1-u5-cancion») o por su título
export function lmSong(level, ref) {
  const units = lmLevel(level)?.units || [];
  const m = /^lm\d+-u(\d+)-cancion$/.exec(String(ref));
  const u = m ? units.find(x => x.unit === Number(m[1])) : units.find(x => x.song && x.song.titulo === ref);
  return u ? u.song : null;
}
