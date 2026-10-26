// Diagrama de digitación según el instrumento: diapasón (violín), pistones (metales), vara (trombón), llaves (madera), mástil (guitarra) o teclado (piano).
import { renderFingerboard } from './fingerboard.js';
import { fingeringFor, fingeringsReviewed } from './fingerings.js';
import { drawFretboard, drawKeyboard } from './boards.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 150;
const H = 196;
const HOLE_Y = { L1: 52, L2: 76, L3: 100, R1: 132, R2: 156, R3: 180 };

function el(tag, attrs, parent, text) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text !== undefined) node.textContent = text;
  parent.appendChild(node);
  return node;
}

function drawValves(svg, f, instId) {
  [1, 2, 3].forEach((v, i) => {
    const x = 33 + i * 42;
    const on = f.valves.includes(v);
    el('rect', { x: x - 15, y: on ? 74 : 56, width: 30, height: 34, rx: 8, class: on ? 'kd-on' : 'kd-off' }, svg);
    el('rect', { x: x - 11, y: on ? 108 : 90, width: 22, height: 70 - (on ? 18 : 0), rx: 6, class: 'kd-body' }, svg);
    el('text', { x, y: on ? 96 : 78, class: on ? 'kd-num on' : 'kd-num' }, svg, String(v));
  });
  el('text', { x: W / 2, y: 30, class: 'kd-caption' }, svg, f.valves.length ? (instId === 'horn' ? 'Cilindros' : 'Pistones') : 'Al aire');
  if (f.slide && instId === 'trumpet') el('text', { x: W / 2, y: 188, class: 'kd-caption' }, svg, '+ bomba del 3.º');
}

// Trombón: la vara con sus siete posiciones; la marcada es la que toca
function drawSlide(svg, f) {
  el('text', { x: W / 2, y: 22, class: 'kd-caption' }, svg, 'Vara');
  el('rect', { x: 18, y: 34, width: 10, height: 150, rx: 5, class: 'kd-tube' }, svg);
  el('rect', { x: W - 28, y: 34, width: 10, height: 150, rx: 5, class: 'kd-tube' }, svg);
  for (let p = 1; p <= 7; p++) {
    const y = 34 + (p - 1) * 23;
    const on = p === f.position;
    el('rect', { x: 34, y: y + 2, width: W - 68, height: 18, rx: 9, class: on ? 'kd-on' : 'kd-off' }, svg);
    el('text', { x: W / 2, y: y + 15, class: on ? 'kd-num on' : 'kd-num' }, svg, `${p}.ª`);
  }
}

// Flauta dulce: el pulgar por detrás (a la izquierda) y los siete agujeros de arriba abajo
function drawRecorder(svg, f) {
  el('rect', { x: 58, y: 8, width: 34, height: 184, rx: 17, class: 'kd-tube' }, svg);
  el('text', { x: 24, y: 30, class: 'kd-label' }, svg, 'pulgar');
  el('circle', { cx: 24, cy: 46, r: 9, class: f.thumb === 'closed' ? 'kd-on' : 'kd-off' }, svg);
  if (f.thumb === 'half') el('path', { d: 'M24 37 a9 9 0 0 0 0 18 z', class: 'kd-on' }, svg);
  [1, 2, 3, 4, 5, 6, 7].forEach((h, i) => {
    const cy = 40 + i * 21 + (i >= 3 ? 10 : 0);
    el('circle', { cx: 75, cy, r: 8, class: f.holes.includes(h) ? 'kd-on' : 'kd-off' }, svg);
    el('text', { x: 108, y: cy + 4, class: 'kd-label' }, svg, String(h));
  });
  el('line', { x1: 62, x2: 88, y1: 99, y2: 99, class: 'kd-split' }, svg);
}

function drawKeys(svg, f, instId) {
  el('rect', { x: 52, y: 30, width: 46, height: 162, rx: 23, class: 'kd-tube' }, svg);
  if (f.thumb) el('circle', { cx: 28, cy: 46, r: 9, class: f.thumbOn ? 'kd-on' : 'kd-off' }, svg);
  if (f.thumb) el('text', { x: 28, y: 30, class: 'kd-label' }, svg, 'pulgar');
  el('rect', { x: 104, y: 36, width: 38, height: 16, rx: 8, class: f.octave ? 'kd-on' : 'kd-off' }, svg);
  el('text', { x: 123, y: 30, class: 'kd-label' }, svg, f.octaveName === 'registro' ? 'registro' : '8va');
  Object.entries(HOLE_Y).forEach(([hole, y]) => el('circle', { cx: 75, cy: y, r: 10, class: f.holes.includes(hole) ? 'kd-on' : 'kd-off' }, svg));
  el('line', { x1: 56, x2: 94, y1: 116, y2: 116, class: 'kd-split' }, svg);
  f.extras.slice(0, 3).forEach((name, i) => {
    el('rect', { x: 102, y: 120 + i * 24, width: 46, height: 19, rx: 9.5, class: 'kd-on' }, svg);
    el('text', { x: 125, y: 133 + i * 24, class: 'kd-chip' }, svg, name);
  });
  if (!fingeringsReviewed(instId)) el('text', { x: 4, y: 192, class: 'kd-beta' }, svg, 'β');
}

// Dibuja la digitación de la nota escrita; devuelve false si no hay dato
export function renderDiagram(svg, instId, midis, nom) {
  if (instId === 'violin' || instId === 'cello') { renderFingerboard(svg, midis, nom, instId); return true; }
  if (instId === 'guitar' || instId === 'ukulele') { drawFretboard(svg, midis.map(m => fingeringFor(instId, m)).filter(Boolean), instId === 'ukulele' ? 4 : 6, { nom }); return true; }
  if (instId === 'piano') { drawKeyboard(svg, midis); return true; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.replaceChildren();
  const f = midis.length ? fingeringFor(instId, midis[0]) : null;
  if (!f) {
    el('text', { x: W / 2, y: H / 2, class: 'kd-caption' }, svg, midis.length ? 'Sin diagrama' : '');
    return false;
  }
  if (f.type === 'valves') drawValves(svg, f, instId);
  else if (f.type === 'slide') drawSlide(svg, f);
  else if (f.type === 'recorder') drawRecorder(svg, f);
  else drawKeys(svg, f, instId);
  return true;
}
