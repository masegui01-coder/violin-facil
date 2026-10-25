// Diagrama de digitación según el instrumento: diapasón (violín), pistones (trompeta) o llaves (madera).
import { renderFingerboard } from './fingerboard.js';
import { fingeringFor, fingeringsReviewed } from './fingerings.js';

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

function drawValves(svg, f) {
  [1, 2, 3].forEach((v, i) => {
    const x = 33 + i * 42;
    const on = f.valves.includes(v);
    el('rect', { x: x - 15, y: on ? 74 : 56, width: 30, height: 34, rx: 8, class: on ? 'kd-on' : 'kd-off' }, svg);
    el('rect', { x: x - 11, y: on ? 108 : 90, width: 22, height: 70 - (on ? 18 : 0), rx: 6, class: 'kd-body' }, svg);
    el('text', { x, y: on ? 96 : 78, class: on ? 'kd-num on' : 'kd-num' }, svg, String(v));
  });
  el('text', { x: W / 2, y: 30, class: 'kd-caption' }, svg, f.valves.length ? 'Pistones' : 'Al aire');
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
  if (instId === 'violin') { renderFingerboard(svg, midis, nom); return true; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.replaceChildren();
  const f = midis.length ? fingeringFor(instId, midis[0]) : null;
  if (!f) {
    el('text', { x: W / 2, y: H / 2, class: 'kd-caption' }, svg, midis.length ? 'Sin diagrama' : '');
    return false;
  }
  if (f.type === 'valves') drawValves(svg, f);
  else drawKeys(svg, f, instId);
  return true;
}
