// Puente entre las herramientas de siempre (Dictados, Afinar en acorde, Notas tenidas) y el curso de Lenguaje Musical.
// Una herramienta lanzada desde una unidad recibe en sus parámetros «lm» ({ id, …parámetros fijos }) y, al terminar,
// devuelve su resultado con reportLmTool; el lanzador (launcher.js) lo registra según el contrato. Sin «lm», nada cambia.
import { esc } from '../ui.js';
import { back } from '../router.js';

export const LM_TOOL_EVENT = 'lm-tool-result';

// partial: { pct, stars?, skills?, mistakes? } (el lanzador añade el tiempo y el resto del contrato)
export function reportLmTool(lm, partial) {
  if (!lm || !lm.id || typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(LM_TOOL_EVENT, { detail: { id: lm.id, ...partial } }));
}

// Aviso de «ejercicio completado» con el botón para volver a la unidad, dentro de la herramienta
export function showLmDone(container, text) {
  if (!container) return;
  let box = container.querySelector('.lm-tool-done');
  if (!box) {
    box = document.createElement('div');
    box.className = 'lm-tool-done';
    container.append(box);
  }
  box.innerHTML = `<p role="status">${esc(text)}</p><button type="button" class="btn">Volver a la unidad</button>`;
  box.querySelector('button').addEventListener('click', () => back());
  box.querySelector('button').focus();
}

export function clearLmDone(container) {
  container?.querySelector('.lm-tool-done')?.remove();
}
