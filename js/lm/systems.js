// Cada renglón del pentagrama empieza con su clave, como en el papel: los compases (.lm-bargroup) bajan de línea
// solos (flex-wrap) y aquí se mira cuáles abren un renglón para ponerles delante una clave (sin compás).
// Se vuelve a mirar cuando cambia el contenido o el ancho del ejercicio.
import { clefCell } from './staff-lm.js';

const STAFFS = '.lm-staff, .lm-w-staff';

// Si un compás (con la clave que se le pondría delante) no cabe a lo ancho —letra muy grande o pantalla estrecha—,
// el pentagrama entero se reduce lo justo (--lm-fit) para que ningún compás se corte
const CLEF_RATIO = 40 / 120; // ancho de la clave sola respecto al alto de la celda
const MIN_FIT = 0.4;
function fitWidth(staff, groups) {
  staff.style.removeProperty('--lm-fit');
  const room = staff.clientWidth;
  const cell = staff.querySelector('.lm-cell');
  if (!room || !cell) return;
  const arm = Math.abs(Number(staff.dataset.armadura || 0));
  const clefW = cell.getBoundingClientRect().height * CLEF_RATIO * (1 + 0.3 * arm);
  const widest = Math.max(...groups.map((g, i) => g.getBoundingClientRect().width + (i ? clefW : 0)));
  if (widest > room) staff.style.setProperty('--lm-fit', String(Math.max(MIN_FIT, Math.floor(room / widest * 100) / 100)));
}

// A dos voces, al menos dos compases por renglón (para leer el sistema mientras suena): se reduce lo justo, sin
// bajar de MIN_SYSTEM_FIT; si ni así caben dos, al menos que quepa uno entero
const MIN_SYSTEM_FIT = 0.6;
const MIN_SYSTEM_SHRINK = 0.3;
const BRACE_PX = 12; // la llave y su margen (no se reducen con el pentagrama)
function fitPairs(sys, cols) {
  sys.style.removeProperty('--lm-fit');
  const room = sys.clientWidth - BRACE_PX;
  const cell = sys.querySelector('.lm-cell');
  if (!room || !cell) return;
  const clefW = cell.getBoundingClientRect().height * CLEF_RATIO;
  const w = cols.map(c => c.getBoundingClientRect().width);
  const one = Math.max(...w) + clefW;
  const two = Math.max(...w.slice(1).map((x, i) => x + w[i])) + clefW;
  const fit = Math.min(1, two > room ? Math.max(MIN_SYSTEM_FIT, room / two) : 1, room / one);
  // un sistema de dos voces puede reducirse algo más que un pentagrama suelto (pantalla de 320 px con letra al 200 %)
  if (fit < 1) sys.style.setProperty('--lm-fit', String(Math.max(MIN_SYSTEM_SHRINK, Math.floor(fit * 100) / 100)));
}

function fitStaff(staff) {
  staff.querySelectorAll(':scope > .lm-bargroup > .lm-sysclef').forEach(c => c.remove());
  const groups = [...staff.querySelectorAll(':scope > .lm-bargroup')];
  if (!groups.length) return;
  fitWidth(staff, groups);
  if (groups.length < 2) return;
  const clef = staff.dataset.clef || (staff.querySelector('.lm-clef.bass') ? 'bass' : 'treble');
  const armadura = Number(staff.dataset.armadura || 0);
  let lineTop = groups[0].offsetTop;
  groups.slice(1).forEach(g => {
    if (g.offsetTop <= lineTop + 2) return;
    lineTop = g.offsetTop;
    g.insertAdjacentHTML('afterbegin', `<span class="lm-sc lm-sysclef" aria-hidden="true">${clefCell(clef, null, armadura)}</span>`);
  });
}

// Sistema a dos voces: cada compás es una columna con una fila por voz. La columna que abre renglón lleva la llave y
// una clave en cada fila
function fitSystem(sys) {
  sys.querySelectorAll('.lm-sysclef').forEach(c => c.remove());
  const cols = [...sys.querySelectorAll(':scope > .lm-sysbar')];
  if (!cols.length) return;
  fitPairs(sys, cols);
  let lineTop = cols[0].offsetTop;
  cols.slice(1).forEach(c => {
    c.classList.remove('lm-sysstart');
    if (c.offsetTop <= lineTop + 2) return;
    lineTop = c.offsetTop;
    c.classList.add('lm-sysstart');
    c.querySelectorAll(':scope > .lm-sysrow').forEach(r => r.insertAdjacentHTML('afterbegin', `<span class="lm-sc lm-sysclef" aria-hidden="true">${clefCell(r.dataset.clef || 'treble')}</span>`));
  });
}

export function fitSystems(root) {
  root.querySelectorAll(STAFFS).forEach(fitStaff);
  root.querySelectorAll('.lm-system').forEach(fitSystem);
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

const FOLLOW_MS = 60;
// El compás que suena, resaltado y a la vista
export function follow(host, beatAt, { barBeats, pickup, sizes = null }) {
  // con cambios de compás, el compás que suena se busca por la medida de cada uno
  const edges = sizes ? sizes.reduce((acc, s) => [...acc, acc[acc.length - 1] + s], [0]) : null;
  let shown = -1;
  const smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const timer = setInterval(() => {
    const beat = beatAt();
    if (beat < 0) return;
    const bar = edges ? (edges.findIndex(e => e > beat + 1e-9) < 0 ? edges.length - 2 : Math.max(0, edges.findIndex(e => e > beat + 1e-9) - 1)) : pickup ? (beat < pickup ? 0 : 1 + Math.floor((beat - pickup) / barBeats)) : Math.floor(beat / barBeats);
    if (bar === shown) return;
    shown = bar;
    const cols = host.querySelectorAll('[data-sysbar], .lm-staff > .lm-bargroup');
    cols.forEach((c, k) => c.classList.toggle('lm-now', k === bar));
    cols[bar]?.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  }, FOLLOW_MS);
  return () => { clearInterval(timer); host.querySelectorAll('.lm-now').forEach(c => c.classList.remove('lm-now')); };
}


// Un elemento (la nota que se canta) a la vista: si se acerca al borde de arriba o a la barra fija de abajo (se mide
// su alto de verdad), se lleva al centro. Sin animación: con notas seguidas, un desplazamiento suave se quedaba a medias
const VIEW_MARGIN_TOP = 80;
const VIEW_MARGIN_EXTRA = 24;
export function keepInView(el) {
  const r = el.getBoundingClientRect();
  const bar = document.querySelector('.lm-sticky-controls');
  const bottom = innerHeight - (bar ? bar.getBoundingClientRect().height : 0) - VIEW_MARGIN_EXTRA;
  if (r.top >= VIEW_MARGIN_TOP && r.bottom <= bottom) return;
  el.scrollIntoView({ block: 'center', behavior: 'auto' });
}
