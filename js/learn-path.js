// Aprender con dos caminos (docs/PLAN-DOS-CAMINOS.md): «Por mi cuenta» (solo) y «Con profesor» (profe), con Mi libro
// dentro de Con profesor (Lenguaje Musical, libro del instrumento y Método Pro). Funciones puras, sin DOM.
//
// Migración sin reescribir nada: los valores antiguos de learnView (casual|book|lm|pro) se siguen aceptando y se leen
// como el camino nuevo. Así los enlaces y lanzadores que aún los escriben (openLmTarget, el Aula, el modo tester, la
// escuela) abren el sitio correcto: «lm» = Con profesor › Mi libro › Lenguaje, «book» = … › Libro, «pro» = Con profesor.

export const PATHS = ['solo', 'profe'];
export const LIBRO_SECTIONS = ['lm', 'book', 'method'];
export const BRIDGE_MIN_LEVELS = 10; // «¿Quieres ir más en serio?» aparece tras 10 niveles del curso

const LEGACY = {
  casual: { path: 'solo', section: null },
  book: { path: 'profe', section: 'book' },
  lm: { path: 'profe', section: 'lm' },
  pro: { path: 'profe', section: null },
};

// En una clase del Aula (alumno o escuela) o profesor: su sitio natural es Con profesor
export function inClassroom(s = {}) {
  const aula = s.aula || {};
  return !!((aula.classes || []).length || aula.schoolId) || !!(s.school && s.school.role === 'teacher');
}

// Primera vez (sin elección guardada): en una clase → Con profesor; si no → Por mi cuenta
export const defaultPath = s => (inClassroom(s) ? 'profe' : 'solo');

// learnView antiguo → camino nuevo (null si no es un valor conocido)
export function migrateLearnView(view) {
  if (PATHS.includes(view)) return view;
  return LEGACY[view] ? LEGACY[view].path : null;
}

// Sección de Mi libro que se abre si nadie ha pedido una: la que el usuario ya usaba
function usedSection(s) {
  const inst = s.instrument;
  if (Object.keys((s.pro || {})[inst] || {}).length) return 'method';
  if (Object.keys((s.bookPlays || {})[inst] || {}).length) return 'book';
  return 'lm';
}

// Lo que pinta Aprender: el camino, la sección de Mi libro y si se llegó por un enlace (para llevar la vista a Mi libro)
export function resolveLearn(s = {}) {
  const raw = s.learnView;
  const path = migrateLearnView(raw) || defaultPath(s);
  const legacy = LEGACY[raw];
  const linked = legacy ? (raw === 'pro' && s.aulaView === 'method' ? 'method' : legacy.section) : null;
  const section = linked || (LIBRO_SECTIONS.includes(s.libroView) ? s.libroView : usedSection(s));
  return { path, section, linked: !!linked };
}

// El puente al libro: tras unos cuantos niveles del curso y mientras no se haya cerrado
export const showBridge = (s, levelsDone) => levelsDone >= BRIDGE_MIN_LEVELS && !s.bridgeHidden;
