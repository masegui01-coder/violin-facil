// Imágenes realistas de los consejos (generadas con IA a partir de docs/prompts-imagenes-consejos.md). Si una viñeta
// tiene imagen, se muestra en lugar del dibujo, con marcas encima (círculos, flechas, ✓/✗ y rótulos) en coordenadas
// de 0 a 100 de ancho y de 0 a 75 de alto (imágenes 4:3). Las viñetas sin imagen siguen con su dibujo.
import { L } from './tips-l10n.js';

// art → { paso (0, 1, 2): { src, marks } }. Se rellena según llegan las imágenes (tools/foto-consejo.py).
export const PHOTOS = {};

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
