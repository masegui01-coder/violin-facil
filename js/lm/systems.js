// Cada renglón del pentagrama empieza con su clave, como en el papel: los compases (.lm-bargroup) bajan de línea
// solos (flex-wrap) y aquí se mira cuáles abren un renglón para ponerles delante una clave (sin compás).
// Se vuelve a mirar cuando cambia el contenido o el ancho del ejercicio.
import { clefCell } from './staff-lm.js';

const STAFFS = '.lm-staff, .lm-w-staff';

// Si un compás (con la clave que se le pondría delante) no cabe a lo ancho —letra muy grande o pantalla estrecha—,
// el pentagrama entero se reduce lo justo (--lm-fit) para que ningún compás se corte
const CLEF_RATIO = 40 / 120; // ancho de la clave sola respecto al alto de la celda
const MIN_FIT = 0.5;
function fitWidth(staff, groups) {
  staff.style.removeProperty('--lm-fit');
  const room = staff.clientWidth;
  const cell = staff.querySelector('.lm-cell');
  if (!room || !cell) return;
  const clefW = cell.getBoundingClientRect().height * CLEF_RATIO;
  const widest = Math.max(...groups.map((g, i) => g.getBoundingClientRect().width + (i ? clefW : 0)));
  if (widest > room) staff.style.setProperty('--lm-fit', String(Math.max(MIN_FIT, Math.floor(room / widest * 100) / 100)));
}

function fitStaff(staff) {
  staff.querySelectorAll(':scope > .lm-bargroup > .lm-sysclef').forEach(c => c.remove());
  const groups = [...staff.querySelectorAll(':scope > .lm-bargroup')];
  if (!groups.length) return;
  fitWidth(staff, groups);
  if (groups.length < 2) return;
  const clef = staff.querySelector('.lm-clef.bass') ? 'bass' : 'treble';
  let lineTop = groups[0].offsetTop;
  groups.slice(1).forEach(g => {
    if (g.offsetTop <= lineTop + 2) return;
    lineTop = g.offsetTop;
    g.insertAdjacentHTML('afterbegin', `<span class="lm-sc lm-sysclef" aria-hidden="true">${clefCell(clef)}</span>`);
  });
}

export function fitSystems(root) {
  root.querySelectorAll(STAFFS).forEach(fitStaff);
}

// Observa un contenedor: tras cada cambio (salvo los propios) o cambio de ancho, se recolocan las claves
export function watchSystems(root) {
  let busy = false;
  let queued = false;
  const run = () => {
    queued = false;
    busy = true;
    fitSystems(root);
    mo.takeRecords();
    busy = false;
  };
  const schedule = () => { if (!busy && !queued) { queued = true; requestAnimationFrame(run); } };
  const mo = new MutationObserver(schedule);
  mo.observe(root, { childList: true, subtree: true });
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  if (ro) ro.observe(root);
  return () => { mo.disconnect(); if (ro) ro.disconnect(); };
}
