// STUB del Aula (rama feat/aula-pro): sustituir por el js/lm/results.js real al fusionar.
// Contrato (docs/PLAN-LENGUAJE-MUSICAL.md): cada intento emite { id, level, unit, section, variant, pct, stars, seconds,
// at, skills?, mistakes? } y quien quiera escucharlo se suscribe con onLmResult(fn), que devuelve cómo dejar de escuchar.
const listeners = new Set();

export function onLmResult(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitLmResult(result) {
  listeners.forEach(fn => fn(result));
}
