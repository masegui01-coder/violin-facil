// Diapasón en primera posición visto desde quien toca: de la cuerda más grave (izquierda) a la más aguda.
// Violín: Sol, Re, La, Mi. Violonchelo: Do, Sol, Re, La. Las cintas marcan los dedos 1, 3 y 4 (2 alto y 3 en el violín).
import { stringsOf, fingering } from './music.js';

const NS = 'http://www.w3.org/2000/svg';
// Dibujo estrecho y letras grandes en unidades del SVG: en el móvil el diapasón mide ~96 px de ancho (escala ≈ 0,74)
// y así las letras de las cuerdas y los números de dedo siguen midiendo ≥ 12 px reales (tamaños en css/lesson.css).
const W = 130;
const NUT_Y = 50;
const STEP_Y = 17;             // distancia por semitono
const H = NUT_Y + STEP_Y * 8.5 + 4;
const OPEN_Y = NUT_Y - 18;     // círculo de la cuerda al aire, entre la letra y la cejuela
const TAPES = [2, 4, 5];       // cintas guía: dedo 1, dedo 2 alto y dedo 3
const stringX = i => 20 + i * 30;

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
  el('path', { d: `M4 ${NUT_Y} L126 ${NUT_Y} L120 ${H - 4} L10 ${H - 4} Z`, class: 'fb-wood' }, svg);
  el('rect', { x: 2, y: NUT_Y - 5, width: 126, height: 6, rx: 2, class: 'fb-nut' }, svg);
  TAPES.forEach(t => {
    const ty = NUT_Y + t * STEP_Y - STEP_Y / 2;
    el('line', { x1: 8, x2: 122, y1: ty, y2: ty, class: 'fb-tape' }, svg);
  });
  const targets = midis.map(m => fingering(m, instId)).filter(Boolean);
  STRINGS.forEach((s, i) => {
    const active = targets.some(t => t.string === s.id);
    el('line', { x1: stringX(i), x2: stringX(i), y1: NUT_Y - 2, y2: H - 4, class: active ? 'fb-string on' : 'fb-string', 'stroke-width': 3.2 - i * 0.6 }, svg);
    const label = el('text', { x: stringX(i), y: 16, class: active ? 'fb-label on' : 'fb-label' }, svg);
    label.textContent = nom === 'us' ? s.us : s.eu;
  });
  targets.forEach(t => {
    const x = stringX(STRINGS.findIndex(s => s.id === t.string));
    const cy = t.offset === 0 ? OPEN_Y : NUT_Y + t.offset * STEP_Y - STEP_Y / 2;
    el('circle', { cx: x, cy, r: t.offset === 0 ? 12 : 13, class: t.offset === 0 ? 'fb-open' : 'fb-dot' }, svg);
    const num = el('text', { x, y: cy + 6, class: 'fb-num' }, svg);
    num.textContent = t.offset === 0 ? '0' : String(t.finger);
  });
}
