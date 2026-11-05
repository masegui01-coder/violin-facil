// Temario asignable del Aula: Lenguaje Musical (js/lm/catalog.js), lecciones del curso de instrumento, páginas del Libro
// y niveles del Método Pro. Sin DOM: listas para el formulario del profesor y nombres para mostrar tareas e intentos.
// El catálogo de Lenguaje se lee con tolerancia (level|n, units|unidades, exercises|ejercicios) para no atarse a sus nombres.
import { buildCourse, lessonTitle } from './course.js';
import { buildLibrary } from './books.js';
import { buildMethod, hasMethod } from './method.js';
import { instrumentById } from './instruments.js';

export const KIND_NAMES = {
  'lm-unit': 'Unidad de Lenguaje Musical', 'lm-section': 'Sección de Lenguaje Musical', 'lm-ex': 'Ejercicios de Lenguaje Musical',
  lesson: 'Lección del curso de instrumento', book: 'Página del Libro', method: 'Nivel del Método Pro', xml: 'Partitura MusicXML propia',
};
export const SECTION_NAMES = {
  teoria: 'Teoría', ritmo: 'Ritmo', agilidad: 'Agilidad de notas', entonacion: 'Entonación', dictado: 'Dictado',
  cancion: 'Canción', audicion: 'Audición y cultura', creatividad: 'Creatividad', repaso: 'Repaso',
};
export const VARIANT_NAMES = { facil: 'Fácil', medio: 'Medio', any: 'Fácil o Medio' };

const pick = (obj, ...keys) => keys.map(k => obj && obj[k]).find(v => v !== undefined && v !== null);

// Niveles → unidades → secciones → ejercicios, con números y títulos
export function lmTree(levels = []) {
  return levels.map((lv, li) => {
    const level = Number(pick(lv, 'level', 'n', 'nivel', 'number')) || li + 1;
    const units = (pick(lv, 'units', 'unidades') || []).map((u, ui) => {
      const unit = Number(pick(u, 'unit', 'n', 'unidad', 'number')) || ui + 1;
      const exercises = (pick(u, 'exercises', 'ejercicios') || []).filter(e => e && e.id).map(e => ({
        id: String(e.id), level, unit, section: e.section || 'repaso', variant: e.variant || 'facil', title: String(pick(e, 'title', 'titulo') || e.id),
      }));
      const sections = [...new Set(exercises.map(e => e.section))];
      return { unit, title: String(pick(u, 'title', 'titulo') || ''), exercises, sections };
    });
    return { level, title: String(pick(lv, 'title', 'titulo') || `Nivel ${level}`), units };
  });
}

export const flattenLm = tree => tree.flatMap(l => l.units.flatMap(u => u.exercises));

let lmLoad = null;
// Catálogo de Lenguaje (se descarga una vez); sin él, el Aula sigue funcionando con el resto del temario
export function loadLm() {
  lmLoad ||= import('./lm/catalog.js').then(m => ({ tree: lmTree(m.LM_LEVELS || []), mistakes: m.LM_MISTAKES || {} }), () => {
    lmLoad = null;
    return { tree: [], mistakes: {} };
  });
  return lmLoad;
}

// Lecciones del curso de un instrumento, por unidad
export function courseUnits(instId, styles) {
  return buildCourse(styles, instId).map((u, i) => ({
    title: `${i + 1}. ${u.title}`, lessons: u.lessons.filter(l => !l.optional || l.pill).map(l => ({ id: l.id, title: lessonTitle(l) })),
  }));
}

// Libros de un instrumento con sus páginas numeradas
export function bookList(instId, styles) {
  return buildLibrary(buildCourse(styles, instId), instrumentById(instId)).map(b => ({
    n: b.n, title: b.title, pages: b.chapters.flatMap(c => c.pages.map(p => ({ id: p.lesson.id, number: p.number, title: lessonTitle(p.lesson) }))),
  }));
}

// Niveles del Método Pro de un instrumento (vacío si aún no tiene método)
export function methodLevels(instId, nom) {
  const inst = instrumentById(instId);
  return hasMethod(inst) ? buildMethod(inst, nom).map(l => ({ id: l.leccion_id, nivel: l.nivel, title: l.titulo_leccion })) : [];
}

// Subtítulo de una tarea: tipo · lo elegido (lo escribió el formulario del profesor en ref.label)
export const taskSubtitle = task => [KIND_NAMES[task.kind], task.ref && task.ref.label].filter(Boolean).join(' · ');

const INTERVAL_NAMES = { 2: '2.ª', 3: '3.ª', 4: '4.ª', 5: '5.ª', 6: '6.ª', 7: '7.ª', 8: '8.ª' };
const QUALITY = { M: 'mayor', m: 'menor', J: 'justa', A: 'aumentada', d: 'disminuida' };
// Error frecuente en palabras: el catálogo puede traer sus nombres (LM_MISTAKES); los intervalos «3M-3m» se leen solos
export function mistakeLabel(code, names = {}) {
  if (names[code]) return names[code];
  const m = /^(\d)([MmJAd])-(\d)([MmJAd])$/.exec(code);
  if (m && INTERVAL_NAMES[m[1]] && INTERVAL_NAMES[m[3]]) return `Confunde ${INTERVAL_NAMES[m[1]]} ${QUALITY[m[2]]} con ${INTERVAL_NAMES[m[3]]} ${QUALITY[m[4]]}`;
  // códigos del curso (js/lm/catalog.js mistakeText): nota leída o cantada como otra, nota sin oír, tiempo agotado
  const note = /^([A-G][#b]?\d)>([A-G][#b]?\d?)$/.exec(code);
  if (note) return `Lee o canta ${note[1]} como ${note[2]}`;
  if (/^[A-G][#b]?\d-sil$/.test(code)) return 'no se oyó la nota';
  if (/^[A-G][#b]?\d-t$/.test(code)) return 'se acabó el tiempo';
  return code;
}

// Nombre de un intento del historial: el título que mandó el alumno, el del catálogo o el identificador
export function attemptLabel(item, exercises = []) {
  if (item.t) return item.t;
  const e = exercises.find(x => x.id === item.id);
  return e ? `N${e.level} · U${e.unit} · ${SECTION_NAMES[e.section] || e.section} · ${e.title}` : item.id;
}
