// STUB del Aula (rama feat/aula-pro): sustituir por el catálogo real del curso de Lenguaje Musical al fusionar.
// Solo fija la forma que usa el Aula (docs/PLAN-LENGUAJE-MUSICAL.md): niveles → unidades → ejercicios
// { id, section, variant, title }. El Aula lee este módulo a través de js/aula-temario.js (tolerante a nombres).
const SECTIONS = [['teoria', 'Teoría'], ['ritmo', 'Ritmo'], ['entonacion', 'Entonación'], ['dictado', 'Dictado']];
const unit = (level, n, title) => ({
  unit: n, title,
  exercises: SECTIONS.flatMap(([section, name]) => ['facil', 'medio'].map(variant => ({
    id: `lm${level}-u${n}-${section}-a-${variant}`, section, variant, title: `${name} · ${variant === 'facil' ? 'Fácil' : 'Medio'}`,
  }))),
});

export const LM_LEVELS = [
  { level: 1, title: 'Nivel 1', units: [unit(1, 1, 'El pulso y la negra'), unit(1, 2, 'La blanca y el silencio')] },
];
