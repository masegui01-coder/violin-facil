// Piezas comunes de las ilustraciones de los consejos: colores, viñeta, flechas, rótulos y marcas de bien/mal.
export const C = {
  skin: '#F1DCC6', skinLine: '#C9A985', gum: '#F4E3D3', lip: '#D9827A', tooth: '#FFFFFF', toothLine: '#9AA3B2',
  mp: '#1E2430', reed: '#D9B26A', brass: '#D7A63A', brassDark: '#A87A1F', green: '#2B7A4B', red: '#C2372F', accent: '#B4461F',
  ink: '#141B26', muted: '#5A6678', wood: '#A0632B', woodLight: '#D9A066', shirt: '#B4461F', pants: '#2F55A4', silver: '#B8C0CC',
  floor: '#E2D7CB', paper: '#F7F3EE',
};

export const DEFS = `<defs><marker id="tipArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.green}"/></marker>
<marker id="tipArrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.red}"/></marker></defs>`;

export const panel = inner => `<svg viewBox="0 0 270 230" class="tip-art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DEFS}${inner}</svg>`;
export const arrow = (d, color = C.green, w = 3) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${color === C.red ? 'tipArrowRed' : 'tipArrow'})"/>`;
export const label = (x, y, text, { color = C.green, anchor = 'start', size = 14, weight = 800 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" font-family="Figtree, Segoe UI, Roboto, sans-serif">${text}</text>`;
export const ok = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.green}"/><path d="M${x - 6} ${y} l4 5 l8 -10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
export const bad = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.red}"/><path d="M${x - 5} ${y - 5} l10 10 M${x + 5} ${y - 5} l-10 10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
export const dashed = (d, color = C.green) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6 6"/>`;
export const floor = (x1, x2, y) => `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${C.floor}" stroke-width="4" stroke-linecap="round"/>`;

