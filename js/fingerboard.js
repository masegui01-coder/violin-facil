// Diapasón en primera posición visto desde quien toca: de la cuerda más grave (izquierda) a la más aguda.
// Violín: Sol, Re, La, Mi. Violonchelo: Do, Sol, Re, La. Las cintas marcan los dedos 1, 3 y 4 (2 alto y 3 en el violín).
import { stringsOf, fingering } from './music.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 150;
const H = 196;
const NUT_Y = 38;
const STEP_Y = 18;             // distancia por semitono
const TAPES = [2, 4, 5];       // cintas guía: dedo 1, dedo 2 alto y dedo 3
const stringX = i => 30 + i * 30;

function el(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  parent.appendChild(node);
  return node;
}

export function renderFingerboard(svg, midis, nom, instId = 'violin') {
  const STRINGS = stringsOf(instId);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.replaceChildren();
  el('path', { d: `M14 ${NUT_Y} L136 ${NUT_Y} L130 ${H - 4} L20 ${H - 4} Z`, class: 'fb-wood' }, svg);
  el('rect', { x: 12, y: NUT_Y - 5, width: 126, height: 6, rx: 2, class: 'fb-nut' }, svg);
  TAPES.forEach(t => {
    const ty = NUT_Y + t * STEP_Y - STEP_Y / 2;
    el('line', { x1: 18, x2: 132, y1: ty, y2: ty, class: 'fb-tape' }, svg);
  });
  const targets = midis.map(m => fingering(m, instId)).filter(Boolean);
  STRINGS.forEach((s, i) => {
    const active = targets.some(t => t.string === s.id);
    el('line', { x1: stringX(i), x2: stringX(i), y1: NUT_Y - 2, y2: H - 4, class: active ? 'fb-string on' : 'fb-string', 'stroke-width': 3.2 - i * 0.6 }, svg);
    const label = el('text', { x: stringX(i), y: 11, class: active ? 'fb-label on' : 'fb-label' }, svg);
    label.textContent = nom === 'us' ? s.us : s.eu;
  });
  targets.forEach(t => {
    const x = stringX(STRINGS.findIndex(s => s.id === t.string));
    const cy = t.offset === 0 ? NUT_Y - 13 : NUT_Y + t.offset * STEP_Y - STEP_Y / 2;
    el('circle', { cx: x, cy, r: t.offset === 0 ? 7 : 11, class: t.offset === 0 ? 'fb-open' : 'fb-dot' }, svg);
    const num = el('text', { x, y: cy + 4.5, class: 'fb-num' }, svg);
    num.textContent = t.offset === 0 ? '0' : String(t.finger);
  });
}
