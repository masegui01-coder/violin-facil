// Recorrido guiado: ilumina cada zona de la app y explica para qué sirve. Se ve al empezar y se repite desde Perfil.
import { $, esc } from '../ui.js';
import { go } from '../router.js';
import { getState, update } from '../store.js';
import { instrumentById } from '../instruments.js';

const PAD = 6;

const STEPS = [
  { tab: 'learn', target: null, title: 'Bienvenido a Band Flow',
    text: inst => `Te enseño la app en un minuto. Practicarás con ${inst}: la app te escucha por el micrófono y te dice si cada nota suena bien.` },
  { tab: 'learn', target: '#instChip', title: 'Tu instrumento',
    text: () => 'Aquí ves con qué instrumento practicas. Púlsalo para cambiarlo cuando quieras: cada instrumento guarda su propio progreso.' },
  { tab: 'learn', target: '#continueCard', title: 'Tu siguiente paso',
    text: () => 'Lo primero que ves al abrir la app: la próxima lección (o la tarea de tu banda si vence pronto). Cada lección te da hasta 3 estrellas y desbloquea la siguiente.' },
  { tab: 'learn', target: '#todayCard', title: 'Tu día',
    text: () => 'Tu objetivo de minutos, tu racha de días seguidos y el reto del día: la misma partitura para todos los que tocan tu instrumento.' },
  { tab: 'learn', target: null, title: 'Cómo tocar con la app',
    text: () => 'Deja el móvil a un metro, en un sitio silencioso. Toca la nota marcada: se pone verde cuando suena afinada. Si la oyes en rojo, el indicador te dice si vas alto o bajo.' },
  { tab: 'songs', target: '[data-tab="songs"]', title: 'Canciones',
    text: () => 'Toda la biblioteca por estilos. Cada canción se puede tocar nota a nota, a tempo o de memoria. También puedes importar tus propias partituras en MusicXML.' },
  { tab: 'practice', target: '[data-tab="practice"]', title: 'Estudio',
    text: () => 'Afinador, metrónomo y herramientas para subir de nivel: notas tenidas, mapa de afinación, gimnasio de técnica y más. Pulsa «¿Para qué sirve cada una?» cuando quieras.' },
  { tab: 'band', target: '[data-tab="band"]', title: 'Tu banda',
    text: () => 'Únete a tu banda con el código que te dé tu director y ensaya las tareas que te ponga. Si eres director, crea tu banda aquí.' },
  { tab: 'profile', target: '[data-tab="profile"]', title: 'Perfil',
    text: () => 'Tus estadísticas, insignias, estilos de música y ajustes: nombres de las notas (Do-Re-Mi o C-D-E), exigencia de afinación y texto grande.' },
  { tab: 'learn', target: null, title: '¡Listo!',
    text: () => 'Tu progreso se guarda en tu cuenta, así no lo pierdes si cambias de móvil. Puedes repetir este recorrido desde Perfil. ¡A tocar!' },
];

let index = 0;

function place(step) {
  const spot = $('tourSpot');
  const card = $('tourCard');
  const el = step.target ? document.querySelector(step.target) : null;
  $('tour').classList.toggle('dim', !(el && el.getClientRects().length));
  if (el && el.getClientRects().length) {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    spot.hidden = false;
    Object.assign(spot.style, { top: `${r.top - PAD}px`, left: `${r.left - PAD}px`, width: `${r.width + PAD * 2}px`, height: `${r.height + PAD * 2}px` });
    const below = r.top + r.height / 2 < window.innerHeight / 2;
    card.classList.toggle('center', false);
    card.style.top = below ? `${Math.min(window.innerHeight - 240, r.bottom + 16)}px` : 'auto';
    card.style.bottom = below ? 'auto' : `${Math.min(window.innerHeight - 240, window.innerHeight - r.top + 16)}px`;
  } else {
    spot.hidden = true;
    card.classList.toggle('center', true);
    card.style.top = '';
    card.style.bottom = '';
  }
}

function render() {
  const step = STEPS[index];
  go(step.tab);
  const inst = instrumentById(getState().instrument).name.toLowerCase();
  $('tourCard').innerHTML = `<p class="eyebrow">${index + 1} de ${STEPS.length}</p><h2>${esc(step.title)}</h2><p>${esc(step.text(inst))}</p>
    <div class="row spread">
      <button type="button" class="btn ghost small" id="tourSkip">${index === STEPS.length - 1 ? 'Cerrar' : 'Saltar'}</button>
      <div class="row">${index ? '<button type="button" class="btn ghost small" id="tourPrev">Anterior</button>' : ''}
      <button type="button" class="btn small" id="tourNext">${index === STEPS.length - 1 ? '¡A tocar!' : 'Siguiente'}</button></div>
    </div>`;
  requestAnimationFrame(() => place(step));
  $('tourSkip').addEventListener('click', end);
  $('tourNext').addEventListener('click', () => { if (index === STEPS.length - 1) end(); else { index++; render(); } });
  if ($('tourPrev')) $('tourPrev').addEventListener('click', () => { index--; render(); });
}

function end() {
  $('tour').hidden = true;
  update({ tourDone: true });
  go('learn');
}

export function startTour() {
  index = 0;
  $('tour').hidden = false;
  render();
}

window.addEventListener('resize', () => { if (!$('tour').hidden) place(STEPS[index]); });
