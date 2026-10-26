// Diagramas de guitarra, ukelele y piano: mástil con la nota, caja de acorde y teclado con las teclas que se tocan.
import { chordShape, isFretted, pianoMidis, chordLabel } from './chords.js';
import { stringName } from './fingerings.js';

// Grosor de cada cuerda por su número: en la guitarra crece de la 1.ª a la 6.ª; en el ukelele (Sol agudo) la 3.ª es la más gruesa
const STRING_WIDTH = { guitar: { 1: 1, 2: 1.3, 3: 1.6, 4: 1.9, 5: 2.2, 6: 2.5 }, ukulele: { 1: 1, 2: 1.4, 3: 1.9, 4: 1.2 } };
const widthOf = (instId, n) => (STRING_WIDTH[instId] || STRING_WIDTH.guitar)[n] || 1.4;

const NS = 'http://www.w3.org/2000/svg';
const BLACK = new Set([1, 3, 6, 8, 10]);

function el(tag, attrs, parent, text) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text !== undefined) node.textContent = text;
  parent.appendChild(node);
  return node;
}

function reset(svg, w, h, label) {
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('aria-label', label);
}

// Mástil en horizontal (cuerda 1 arriba, como lo ves al mirar hacia abajo) con las posiciones {string, fret}
export function drawFretboard(svg, positions, strings = 6, { nom = 'eu' } = {}) {
  const instId = strings === 4 ? 'ukulele' : 'guitar';
  const W = 268, X0 = 58, FRET_W = 40, Y0 = 18, GAP = 17, FRETS = 5;
  const H = Y0 + GAP * (strings - 1) + 33;
  reset(svg, W, H, strings === 4 ? 'Mástil del ukelele' : 'Mástil de la guitarra');
  el('rect', { x: X0, y: Y0 - 6, width: FRET_W * FRETS, height: GAP * (strings - 1) + 12, rx: 4, class: 'gb-neck' }, svg);
  for (let f = 0; f <= FRETS; f++) el('line', { x1: X0 + f * FRET_W, x2: X0 + f * FRET_W, y1: Y0 - 6, y2: Y0 + GAP * (strings - 1) + 6, class: f ? 'gb-fret' : 'gb-nut' }, svg);
  [3, 5].forEach(f => el('circle', { cx: X0 + (f - 0.5) * FRET_W, cy: Y0 + GAP * (strings - 1) / 2, r: 4, class: 'gb-inlay' }, svg));
  for (let s = 1; s <= strings; s++) {
    const y = Y0 + (s - 1) * GAP;
    el('line', { x1: X0, x2: X0 + FRET_W * FRETS, y1: y, y2: y, class: 'gb-string', 'stroke-width': widthOf(instId, s) }, svg);
    el('text', { x: 4, y: y + 4, class: 'kd-label', style: 'text-anchor: start' }, svg, `${s} ${stringName(instId, s, nom)}`);
  }
  positions.forEach(({ string, fret }) => {
    const y = Y0 + (string - 1) * GAP;
    if (fret === 0) el('circle', { cx: X0 - 9, cy: y, r: 6, class: 'gb-open' }, svg);
    else {
      el('circle', { cx: X0 + (fret - 0.5) * FRET_W, cy: y, r: 7.5, class: 'kd-on' }, svg);
      el('text', { x: X0 + (fret - 0.5) * FRET_W, y: y + 4, class: 'kd-chip' }, svg, String(Math.min(4, fret)));
    }
  });
  for (let f = 1; f <= FRETS; f++) el('text', { x: X0 + (f - 0.5) * FRET_W, y: H - 4, class: 'kd-label' }, svg, String(f));
}

// Caja de acorde en vertical, como en los cancioneros: de la 6.ª cuerda (guitarra) o la 4.ª (ukelele, el Sol agudo) a la izquierda
// hasta la 1.ª a la derecha; x = no suena, o = al aire. Debajo, el nombre de cada cuerda.
export function drawChordBox(svg, name, nom, instId = 'guitar') {
  const shape = chordShape(name, instId);
  const W = 130, H = 184, Y0 = 44, FH = 22, FRETS = 5;
  const n = shape ? shape.frets.length : 6;
  const SW = n === 4 ? 24 : 17, X0 = (W - SW * (n - 1)) / 2 - 8;
  reset(svg, W, H, 'Acorde ' + chordLabel(name, nom));
  el('text', { x: W / 2, y: 18, class: 'gb-title' }, svg, chordLabel(name, nom));
  if (!shape) { el('text', { x: W / 2, y: H / 2, class: 'kd-caption' }, svg, 'Sin diagrama'); return; }
  const first = shape.barre && shape.barre > 2 ? shape.barre : 1;
  const OPEN_NAMES = n === 4 ? { eu: ['Sol', 'Do', 'Mi', 'La'], us: ['G', 'C', 'E', 'A'] } : { eu: ['Mi', 'La', 'Re', 'Sol', 'Si', 'Mi'], us: ['E', 'A', 'D', 'G', 'B', 'E'] };
  for (let s = 0; s < n; s++) {
    el('line', { x1: X0 + s * SW, x2: X0 + s * SW, y1: Y0, y2: Y0 + FH * FRETS, class: 'gb-string', 'stroke-width': widthOf(instId, n - s) * 0.75 }, svg);
    el('text', { x: X0 + s * SW, y: Y0 + FH * FRETS + 14, class: 'kd-label' }, svg, OPEN_NAMES[nom === 'us' ? 'us' : 'eu'][s]);
  }
  for (let f = 0; f <= FRETS; f++) el('line', { x1: X0, x2: X0 + (n - 1) * SW, y1: Y0 + f * FH, y2: Y0 + f * FH, class: f === 0 && first === 1 ? 'gb-nut' : 'gb-fret' }, svg);
  if (first > 1) el('text', { x: X0 + (n - 1) * SW + 12, y: Y0 + FH / 2 + 4, class: 'kd-label' }, svg, first + 'ª');
  if (shape.barre) {
    const strings = shape.frets.map((f, i) => (f === shape.barre ? i : -1)).filter(i => i >= 0);
    const fy = Y0 + (shape.barre - first + 0.5) * FH;
    el('rect', { x: X0 + strings[0] * SW - 7, y: fy - 7, width: (strings[strings.length - 1] - strings[0]) * SW + 14, height: 14, rx: 7, class: 'kd-on' }, svg);
  }
  shape.frets.forEach((f, i) => {
    const x = X0 + i * SW;
    if (f < 0) el('text', { x, y: Y0 - 8, class: 'gb-mute' }, svg, '×');
    else if (f === 0) el('circle', { cx: x, cy: Y0 - 12, r: 5, class: 'gb-open' }, svg);
    else if (!(shape.barre && f === shape.barre && shape.fingers[i] === 1)) {
      const cy = Y0 + (f - first + 0.5) * FH;
      el('circle', { cx: x, cy, r: 8, class: 'kd-on' }, svg);
      el('text', { x, y: cy + 4, class: 'kd-chip' }, svg, String(shape.fingers[i]));
    }
  });
}

// Teclado de dos octavas (o las que hagan falta) con las teclas marcadas; el Do central lleva un punto
export function drawKeyboard(svg, midis, { fingers = null } = {}) {
  const lowest = Math.min(60, ...midis), highest = Math.max(71, ...midis);
  const from = Math.floor(lowest / 12) * 12, to = Math.ceil((highest + 1) / 12) * 12 - 1;
  const whites = [];
  for (let m = from; m <= to; m++) if (!BLACK.has(m % 12)) whites.push(m);
  const KW = 22, KH = 96, BW = 14, BH = 58;
  const W = whites.length * KW + 2;
  reset(svg, W, KH + 22, 'Teclado');
  const on = new Set(midis);
  const xOfWhite = m => whites.indexOf(m) * KW + 1;
  whites.forEach(m => {
    el('rect', { x: xOfWhite(m), y: 1, width: KW, height: KH, rx: 3, class: on.has(m) ? 'pk-white on' : 'pk-white' }, svg);
    if (m === 60) el('circle', { cx: xOfWhite(m) + KW / 2, cy: KH - 10, r: 3, class: on.has(m) ? 'pk-dot on' : 'pk-dot' }, svg);
  });
  for (let m = from; m <= to; m++) {
    if (!BLACK.has(m % 12)) continue;
    el('rect', { x: xOfWhite(m - 1) + KW - BW / 2, y: 1, width: BW, height: BH, rx: 2, class: on.has(m) ? 'pk-black on' : 'pk-black' }, svg);
  }
  if (fingers) midis.forEach((m, i) => {
    if (!fingers[i]) return;
    const x = BLACK.has(m % 12) ? xOfWhite(m - 1) + KW : xOfWhite(m) + KW / 2;
    el('text', { x, y: KH + 16, class: 'kd-label' }, svg, String(fingers[i]));
  });
}

export function drawChord(svg, name, instId, nom) {
  if (isFretted(instId)) drawChordBox(svg, name, nom, instId);
  else drawKeyboard(svg, pianoMidis(name));
}
