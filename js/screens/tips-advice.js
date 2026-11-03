// Consejo personalizado al terminar una lección (lo usa el resultado sin descargar la pantalla de Consejos)
// y los textos fijos de Consejos, que también aparecen en Estudio y en el resultado.
import { getState, update } from '../store.js';
import { instrumentById } from '../instruments.js';
import { coachAdvice } from '../coach.js';
import { L } from '../tips-l10n.js';

// Textos fijos de la pantalla (y de la herramienta en Estudio y del resultado), con su traducción
[
  ['Consejos', 'Tips'], ['Consejos para ti', 'Tips for you'], ['Comprueba:', 'Check:'], ['Evita:', 'Avoid:'], ['Fuentes', 'Sources'],
  ['Prueba esto:', 'Try this:'], ['Ver cómo se hace:', 'See how it is done:'], ['Consejos de técnica', 'Technique tips'],
  ['Embocadura, postura y respiración, y qué corregir según cómo tocas', 'Embouchure, posture and breathing, and what to fix based on how you play'],
  ['Postura, arco y mano izquierda, y qué corregir según cómo tocas', 'Posture, bow and left hand, and what to fix based on how you play'],
  ['Postura y las dos manos, y qué corregir según cómo tocas', 'Posture and both hands, and what to fix based on how you play'],
  ['Postura y posición de la mano, y qué corregir según cómo tocas', 'Posture and hand position, and what to fix based on how you play'],
  ['Postura y golpe, y qué corregir según cómo tocas', 'Posture and stroke, and what to fix based on how you play'],
  ['Consejo para ti', 'A tip for you'], ['Ver por qué y cómo se hace', 'See why and how to do it'],
  ['A partir de lo que has tocado con este instrumento.', 'Based on what you have played on this instrument.'],
  ['Toca unas cuantas lecciones más y aquí te diré qué detalle de técnica puede estar haciendo que se te vayan las notas.', 'Play a few more lessons and I will tell you here which technique detail may be pulling your notes off.'],
  ['Toca tus primeras lecciones y aquí aparecerán consejos de técnica hechos a tu medida.', 'Play your first lessons and technique tips tailored to you will show up here.'],
  ['Datos para tus consejos', 'Data for your tips'],
  ['No veo ningún fallo que se repita: sigue así. Revisa de vez en cuando los básicos de abajo.', 'I do not see any repeated mistake: keep it up. Review the basics below from time to time.'],
  ['Pronto habrá consejos para este instrumento.', 'Tips for this instrument are coming soon.'],
  ['Abrir el afinador', 'Open the tuner'], ['Hacer notas tenidas', 'Do long notes'], ['Abrir el metrónomo', 'Open the metronome'],
].forEach(([es, en]) => L(es, en));

const RESULT_TIP_DAYS = 3; // un mismo consejo personalizado no se repite en el resultado antes de estos días
const DAY_MS = 864e5;

export function adviceNow() {
  const s = getState();
  const inst = instrumentById(s.instrument);
  return coachAdvice(inst, (s.tuning || {})[s.instrument] || {}, (s.coach || {})[s.instrument], { recentAcc: s.recentAcc || [] });
}

// El consejo que se enseña al terminar una lección: el primero que no se haya visto hace poco
export function freshAdvice(now = Date.now()) {
  const s = getState();
  const seen = s.tipsSeen || {};
  const item = adviceNow().items.find(i => !seen[`${s.instrument}:${i.id}`] || now - seen[`${s.instrument}:${i.id}`] > RESULT_TIP_DAYS * DAY_MS);
  return item || null;
}

export function markAdviceSeen(item, now = Date.now()) {
  const s = getState();
  update({ tipsSeen: { ...(s.tipsSeen || {}), [`${s.instrument}:${item.id}`]: now } });
}
