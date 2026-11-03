// Imágenes realistas de los consejos (generadas con IA a partir de docs/prompts-imagenes-consejos.md). Si una viñeta
// tiene imagen, se muestra en lugar del dibujo, con marcas encima (círculos, flechas, ✓/✗ y rótulos) en coordenadas
// de 0 a 100 de ancho y de 0 a 75 de alto (imágenes 4:3). Las viñetas sin imagen siguen con su dibujo.
import { L } from './tips-l10n.js';

// art → { paso (0, 1, 2): { src, marks } }. Se rellena según llegan las imágenes (tools/foto-consejo.py).
export const PHOTOS = {
  'brass-buzz': { 0: { src: 'img/consejos/fotos/brass-buzz-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/brass-buzz-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/brass-buzz-3.webp', marks: [] } },
  'brass-placement': { 0: { src: 'img/consejos/fotos/brass-placement-1.webp', marks: [] }, 2: { src: 'img/consejos/fotos/brass-placement-3.webp', marks: [] } },
  'brass-posture': { 0: { src: 'img/consejos/fotos/brass-posture-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/brass-posture-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/brass-posture-3.webp', marks: [] } },
  'breath': { 1: { src: 'img/consejos/fotos/breath-2.webp', marks: [] } },
  'cajon-strokes': { 0: { src: 'img/consejos/fotos/cajon-strokes-1.webp', marks: [] }, 2: { src: 'img/consejos/fotos/cajon-strokes-3.webp', marks: [] } },
  'cello-bow': { 0: { src: 'img/consejos/fotos/cello-bow-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/cello-bow-2.webp', marks: [] } },
  'cello-hold': { 0: { src: 'img/consejos/fotos/cello-hold-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/cello-hold-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/cello-hold-3.webp', marks: [] } },
  'cello-left': { 0: { src: 'img/consejos/fotos/cello-left-1.webp', marks: [] } },
  'clar-barrel': { 1: { src: 'img/consejos/fotos/clar-barrel-2.webp', marks: [] } },
  'clar-embouchure': { 1: { src: 'img/consejos/fotos/clar-embouchure-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/clar-embouchure-3.webp', marks: [] } },
  'flute-embouchure': { 0: { src: 'img/consejos/fotos/flute-embouchure-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/flute-embouchure-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/flute-embouchure-3.webp', marks: [] } },
  'flute-head': { 0: { src: 'img/consejos/fotos/flute-head-1.webp', marks: [] } },
  'flute-hold': { 0: { src: 'img/consejos/fotos/flute-hold-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/flute-hold-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/flute-hold-3.webp', marks: [] } },
  'fretting': { 1: { src: 'img/consejos/fotos/fretting-2.webp', marks: [] } },
  'guitar-posture': { 0: { src: 'img/consejos/fotos/guitar-posture-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/guitar-posture-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/guitar-posture-3.webp', marks: [] } },
  'guitar-right': { 0: { src: 'img/consejos/fotos/guitar-right-1.webp', marks: [] }, 2: { src: 'img/consejos/fotos/guitar-right-3.webp', marks: [] } },
  'horn-hand': { 0: { src: 'img/consejos/fotos/horn-hand-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/horn-hand-2.webp', marks: [] } },
  'oboe-crow': { 0: { src: 'img/consejos/fotos/oboe-crow-1.webp', marks: [] }, 2: { src: 'img/consejos/fotos/oboe-crow-3.webp', marks: [] } },
  'oboe-embouchure': { 0: { src: 'img/consejos/fotos/oboe-embouchure-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/oboe-embouchure-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/oboe-embouchure-3.webp', marks: [] } },
  'oboe-hold': { 2: { src: 'img/consejos/fotos/oboe-hold-3.webp', marks: [] } },
  'piano-hand': { 0: { src: 'img/consejos/fotos/piano-hand-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/piano-hand-2.webp', marks: [] } },
  'piano-posture': { 0: { src: 'img/consejos/fotos/piano-posture-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/piano-posture-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/piano-posture-3.webp', marks: [] } },
  'recorder-breath': { 0: { src: 'img/consejos/fotos/recorder-breath-1.webp', marks: [] }, 2: { src: 'img/consejos/fotos/recorder-breath-3.webp', marks: [] } },
  'recorder-holes': { 0: { src: 'img/consejos/fotos/recorder-holes-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/recorder-holes-2.webp', marks: [] } },
  'sax-neck': { 0: { src: 'img/consejos/fotos/sax-neck-1.webp', marks: [] } },
  'sax-posture': { 0: { src: 'img/consejos/fotos/sax-posture-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/sax-posture-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/sax-posture-3.webp', marks: [] } },
  'stick-grip': { 0: { src: 'img/consejos/fotos/stick-grip-1.webp', marks: [] }, 2: { src: 'img/consejos/fotos/stick-grip-3.webp', marks: [] } },
  'trombone-slide': { 0: { src: 'img/consejos/fotos/trombone-slide-1.webp', marks: [] } },
  'uke-hold': { 0: { src: 'img/consejos/fotos/uke-hold-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/uke-hold-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/uke-hold-3.webp', marks: [] } },
  'violin-bow': { 0: { src: 'img/consejos/fotos/violin-bow-1.webp', marks: [] } },
  'violin-hold': { 0: { src: 'img/consejos/fotos/violin-hold-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/violin-hold-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/violin-hold-3.webp', marks: [] } },
  'violin-left': { 0: { src: 'img/consejos/fotos/violin-left-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/violin-left-2.webp', marks: [] } },
  'woodwind-hold': { 0: { src: 'img/consejos/fotos/woodwind-hold-1.webp', marks: [] }, 1: { src: 'img/consejos/fotos/woodwind-hold-2.webp', marks: [] }, 2: { src: 'img/consejos/fotos/woodwind-hold-3.webp', marks: [] } },
};

export const photoFor = (art, step) => (PHOTOS[art] && PHOTOS[art][step]) || null;

const GREEN = '#2B7A4B';
const RED = '#C2372F';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function mark(m) {
  const color = m.bad ? RED : GREEN;
  if (m.type === 'circle') return `<circle cx="${m.x}" cy="${m.y}" r="${m.r || 4}" fill="none" stroke="${color}" stroke-width="1.1"/>`;
  if (m.type === 'arrow') {
    const [x1, y1] = m.from;
    const [x2, y2] = m.to;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.1" stroke-linecap="round" marker-end="url(#photoArrow${m.bad ? 'Bad' : ''})"/>`;
  }
  if (m.type === 'ok' || m.type === 'bad') {
    const c = m.type === 'ok' ? GREEN : RED;
    const sym = m.type === 'ok' ? `<path d="M${m.x - 2.2} ${m.y} l1.5 1.8 l3 -3.6" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>`
      : `<path d="M${m.x - 1.8} ${m.y - 1.8} l3.6 3.6 M${m.x + 1.8} ${m.y - 1.8} l-3.6 3.6" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>`;
    return `<circle cx="${m.x}" cy="${m.y}" r="4.6" fill="${c}"/>${sym}`;
  }
  if (m.type === 'label') {
    return `<text x="${m.x}" y="${m.y}" font-size="${m.size || 4.2}" font-weight="800" fill="${color}" text-anchor="${m.anchor || 'start'}" paint-order="stroke" stroke="#fff" stroke-width="1.2" font-family="Figtree, Segoe UI, Roboto, sans-serif">${esc(m.text)}</text>`;
  }
  return '';
}

// La imagen con sus marcas encima (el SVG se estira sobre la imagen 4:3)
export function photoHtml(photo, alt) {
  const marks = (photo.marks || []).map(mark).join('');
  return `<img class="tip-photo" src="${esc(photo.src)}" alt="${esc(alt)}" loading="lazy" width="960" height="720">
    ${marks ? `<svg class="tip-photo-marks" viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden="true"><defs>
      <marker id="photoArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${GREEN}"/></marker>
      <marker id="photoArrowBad" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${RED}"/></marker></defs>${marks}</svg>` : ''}`;
}

// Rótulos de las marcas: se escriben con L(es, en) en PHOTOS para que se traduzcan como el resto
export { L };
