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
import { FIGURE_NAME, REST_NAME } from './notes.js';
import U1 from './level1/u1.js';
import U2 from './level1/u2.js';
import U3 from './level1/u3.js';
import U4 from './level1/u4.js';
import U5 from './level1/u5.js';
import U6 from './level1/u6.js';
import U7 from './level1/u7.js';
import U8 from './level1/u8.js';
import META_1 from './level1/meta.js';
import V1 from './level2/u1.js';
import V2 from './level2/u2.js';
import V3 from './level2/u3.js';
import V4 from './level2/u4.js';
import V5 from './level2/u5.js';
import V6 from './level2/u6.js';
import V7 from './level2/u7.js';
import V8 from './level2/u8.js';
import META_2 from './level2/meta.js';
import W1 from './level3/u1.js';
import W2 from './level3/u2.js';
import W3 from './level3/u3.js';
import W4 from './level3/u4.js';
import W5 from './level3/u5.js';
import W6 from './level3/u6.js';
import W7 from './level3/u7.js';
import W8 from './level3/u8.js';
import META_3 from './level3/meta.js';

export const LM_SECTIONS = ['teoria', 'ritmo', 'agilidad', 'entonacion', 'dictado', 'cancion', 'audicion', 'creatividad', 'repaso'];
export const LM_VARIANTS = ['facil', 'medio'];
export const LM_SKILLS = ['ritmo', 'entonacion', 'lectura', 'teoria', 'dictado', 'audicion'];
export const SECTION_NAME = {
  teoria: 'Teoría', ritmo: 'Ritmo', agilidad: 'Agilidad de notas', entonacion: 'Entonación', dictado: 'Dictado',
  cancion: 'Canción de la unidad', audicion: 'Audición y cultura', creatividad: 'Creatividad', repaso: 'Repaso',
};
export const VARIANT_NAME = { facil: 'Fácil', medio: 'Media' };
export const SKILL_NAME = { ritmo: 'Ritmo', entonacion: 'Entonación', lectura: 'Lectura', teoria: 'Teoría', dictado: 'Dictado', audicion: 'Audición' };
export const LM_META = { 1: META_1, 2: META_2, 3: META_3 };

// «tool»: herramienta que ya existía (se abre con parámetros fijos); «lm»: tipo nuevo (pantalla del ejercicio, screen.js)
export const TYPES = {
  'lectura-ritmica': 'tool',
  teoria: 'lm', stop: 'lm', agilidad: 'lm', entonacion: 'lm', 'cancion-cantada': 'lm', escribir: 'lm', discriminacion: 'lm',
  audicion: 'lm', creatividad: 'lm', repaso: 'lm', intervalos: 'lm',
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
  if (section === 'dictado') return /discriminacion/.test(tool) ? 'discriminacion' : /intervalos/.test(tool) ? 'intervalos' : 'escribir';
  if (section === 'cancion') return 'cancion-cantada';
  return section;
}

// Lo que cada ejercicio necesita de su unidad, ya resuelto
function resolve(section, ex, raw) {
  const list = raw.secciones[section] || [];
  if (section === 'teoria') return { ...ex, ficha: raw.teoria.ficha };
  // la base del STOP es una lectura de la unidad: rítmica (sección ritmo) o, en el STOP melódico, una lectura cantada (entonación)
  if (section === 'ritmo' && ex.base) return { ...ex, base: [...list, ...(raw.secciones.entonacion || [])].find(b => b.id === ex.base) || null };
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
// Nivel 2 (beta): se abre libre, sin candado; su contenido está solo en español por ahora
const LEVEL_2 = {
  level: 2, title: 'Nivel 2', sub: 'Puntillo, semicorcheas, clave de fa, 6/8, intervalos, alteraciones y armaduras (fa mayor y sol mayor)',
  units: [V1, V2, V3, V4, V5, V6, V7, V8].map(u => expandUnit(2, u)),
};
// Nivel 3 (beta): también libre y solo en español por ahora
const LEVEL_3 = {
  level: 3, title: 'Nivel 3', sub: '3/8 y 9/8, menores en tres formas, intervalos con especie, síncopa con ligadura, tres alteraciones, D.S. al Coda y dos voces',
  units: [W1, W2, W3, W4, W5, W6, W7, W8].map(u => expandUnit(3, u)),
};
// Nivel 4 (fase 2): aparece como «próximamente» en el curso
const COMING = [
  { level: 4, title: 'Nivel 4', sub: 'Todas las tonalidades, tresillos, síncopas, grados y acordes', units: [] },
];

export const LM_LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3, ...COMING];

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
  ...META_2.codigosError,
  ...META_3.codigosError,
  'fig-s': 'una semicorchea con otra figura', 'fig-e.': 'una corchea con puntillo con otra figura', 'fig-h.': 'una blanca con puntillo con otra figura',
  'r-intervalos': 'faltan los intervalos pedidos', 'r-alguna': 'faltan figuras nuevas distintas', 'r-matices': 'falta algún matiz',
  'r-distinta': 'la parte escrita repite la dada', 'r-tonalidad': 'no acaba en la tónica',
  'semitono-oido': 'no distinguió el tono del semitono al oírlo', modo: META_1.codigosError.modo,
  cancion: 'no reconoció la canción por su ritmo', nota: 'una nota en otra altura', teoria: 'una pregunta de teoría',
  'fig-w': 'una redonda con otra figura', 'fig-h': 'una blanca con otra figura', 'fig-q': 'una negra con otra figura', 'fig-e': 'una corchea con otra figura',
  'fig-h.': 'una blanca con puntillo con otra figura', 'fig-q.': 'una negra con puntillo con otra figura',
  'stop-pronto': 'paró antes del error', 'stop-tarde': 'paró tarde', 'stop-no': 'no paró la música',
  'barra-falta': 'faltó una barra de compás', 'barra-sobra': 'sobró una barra de compás', falta: 'faltó una nota', sobra: 'sobró una nota',
  altura: 'nota equivocada', 'r-longitud': 'número de compases', 'r-compases': 'compases incompletos', 'r-figuras': 'figura no permitida',
  'r-notas': 'nota no permitida', 'r-final': 'final no pedido', 'r-saltos': 'salto no permitido', 'r-incluye': 'faltan figuras obligatorias', 'r-semitonos': 'faltan los semitonos',
};
// STOP: el error lo comete la app; al alumno se le apunta que no lo notó
const STOP_MISSED = {
  'q>ee': 'una negra partida en dos corcheas', 'ee>q': 'dos corcheas juntadas en una negra', 'Rq>q': 'un silencio donde había una negra',
  'q>Rq': 'una negra donde había un silencio', 'h-corta': 'una blanca que duró un pulso', 'w-corta': 'una redonda cortada a la mitad',
  'Rw-salto': 'un silencio que se saltó', compas: 'un compás con un pulso de más', matiz: 'un compás con el matiz cambiado',
  calderon: 'un calderón sin esperar', voz: 'una nota del ostinato cambiada', anacrusa: 'la anacrusa en la parte fuerte',
  'q.e>qq': 'una negra con puntillo y su corchea tocadas como dos negras', 'h.>h': 'una blanca con puntillo acortada', 'ssss>ee': 'cuatro semicorcheas tocadas como dos corcheas',
  'ess>sse': 'un grupo de corchea y semicorcheas cambiado', 'e.s>ee': 'un saltillo tocado como dos corcheas', '6/8>3/4': 'un 6/8 tocado como 3/4', 'R>e': 'un silencio con palmada',
  casilla: 'la casilla 1 repetida en la 2.ª vuelta', dc: 'un D.C. olvidado', ds: 'un D.S. al Coda olvidado', liga: 'una nota ligada atacada otra vez',
  '9/8>6/8': 'un 9/8 tocado como 6/8', sensible: 'una sensible cantada natural', melodica: 'la bajada de la melódica con los sostenidos de la subida', alteracion: 'una nota sin la alteración de la armadura', nota: 'una nota cambiada de altura',
};
const SPECIES_NAME = { M: 'mayor', m: 'menor', J: 'justa', A: 'aumentada', d: 'disminuida' };
export function mistakeText(code) {
  if (LM_MISTAKES[code]) return LM_MISTAKES[code];
  const m = /^([A-G][#b]?\d)>([A-G][#b]?\d?)$/.exec(code);
  if (m) return `${m[1]} → ${m[2]}`;
  if (/-sil$/.test(code)) return 'no se oyó la nota';
  if (/-t$/.test(code)) return 'se acabó el tiempo';
  // lectura rítmica: lo que falló, con su figura de verdad
  const iv = /^([2-8])>([2-8])$/.exec(code);
  if (iv) return `intervalo: era una ${iv[1]}.ª y se dijo una ${iv[2]}.ª`;
  const sp = /^([2-8])([MmJAd])>([2-8])([MmJAd])$/.exec(code);
  if (sp) return `intervalo: era una ${sp[1]}.ª ${SPECIES_NAME[sp[2]]} y se dijo ${sp[3]}.ª ${SPECIES_NAME[sp[4]]}`;
  if (/^[2-8]-t$/.test(code)) return 'intervalo: se acabó el tiempo';
  const miss = /^falta-(.+)$/.exec(code);
  if (miss && FIGURE_NAME[miss[1]]) return `no tocó una ${FIGURE_NAME[miss[1]].toLowerCase()}`;
  const rest = /^sil-(.+)$/.exec(code);
  if (rest && REST_NAME[rest[1]]) return `palmada en un ${REST_NAME[rest[1]].toLowerCase()}`;
  if (code === 'golpe-mas') return 'golpes de más';
  const stop = /^stop-(.+)$/.exec(code);
  if (stop && STOP_MISSED[stop[1]]) return `no notó: ${STOP_MISSED[stop[1]]}`;
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
