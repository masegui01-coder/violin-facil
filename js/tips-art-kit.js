// Piezas comunes de las ilustraciones de los consejos: colores, viñeta, flechas, rótulos y marcas de bien/mal.
export const C = {
  skin: '#F1DCC6', skinLine: '#C9A985', gum: '#F4E3D3', lip: '#D9827A', tooth: '#FFFFFF', toothLine: '#9AA3B2',
  mp: '#1E2430', reed: '#D9B26A', brass: '#D7A63A', brassDark: '#A87A1F', green: '#2B7A4B', red: '#C2372F', accent: '#B4461F',
  ink: '#141B26', muted: '#5A6678', wood: '#A0632B', woodLight: '#D9A066', shirt: '#B4461F', pants: '#2F55A4', silver: '#B8C0CC',
  floor: '#E2D7CB', paper: '#F7F3EE',
};

// Degradados y sombra para un acabado con volumen (piel, metales, maderas, ébano, tela) y una sombra suave
const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const GRADIENTS = [
  lin('gSkin', [[0, '#F8E6D3'], [0.55, '#EFD3B8'], [1, '#DDB894']], 1, 1),
  lin('gLip', [[0, '#E79A90'], [1, '#C46A61']]),
  lin('gBrass', [[0, '#F7DD8E'], [0.35, '#E0B24A'], [0.7, '#B8862A'], [1, '#8E6418']], 1, 0.4),
  lin('gSilver', [[0, '#F5F7FA'], [0.4, '#D2D8E0'], [0.75, '#A9B2BE'], [1, '#8A93A3']]),
  lin('gBlack', [[0, '#545C6A'], [0.35, '#262C37'], [1, '#0E1218']]),
  lin('gReed', [[0, '#EDCB86'], [1, '#C0954A']]),
  lin('gViolin', [[0, '#D98A42'], [0.5, '#B9662A'], [1, '#8C4718']], 1, 1),
  lin('gSpruce', [[0, '#F0CB8A'], [1, '#D19E58']], 1, 1),
  lin('gWood', [[0, '#E6B47A'], [1, '#B07338']], 1, 1),
  lin('gBox', [[0, '#F0D8A8'], [1, '#CDA868']], 1, 0),
  lin('gShirt', [[0, '#C9592E'], [1, '#952F12']], 0.4, 1),
  lin('gPants', [[0, '#3F69BD'], [1, '#22427F']], 0.4, 1),
  lin('gPlate', [[0, '#F2D49F'], [1, '#D7AE6C']], 1, 1),
].join('');
const SHADOW = '<filter id="tipShadow" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#3A2A1A" flood-opacity=".22"/></filter>';
export const DEFS = `<defs><marker id="tipArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.green}"/></marker>
<marker id="tipArrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.red}"/></marker>${GRADIENTS}${SHADOW}</defs>`;

// Los colores planos de relleno pasan a sus degradados (solo rellenos: los trazos se quedan lisos)
const REALISTIC = {
  '#F1DCC6': 'gSkin', '#D9827A': 'gLip', '#D7A63A': 'gBrass', '#C9D0DA': 'gSilver', '#C3CAD4': 'gSilver', '#B8C0CC': 'gSilver',
  '#1E2430': 'gBlack', '#D9B26A': 'gReed', '#C2742F': 'gViolin', '#E2B26E': 'gSpruce', '#D9A066': 'gWood', '#E3C58E': 'gBox',
  '#B4461F': 'gShirt', '#2F55A4': 'gPants', '#E8C38A': 'gPlate',
};
const realistic = svg => svg.replace(/fill="(#[0-9A-Fa-f]{6})"/g, (m, c) => (REALISTIC[c.toUpperCase()] ? `fill="url(#${REALISTIC[c.toUpperCase()]})"` : m));

export const panel = inner => `<svg viewBox="0 0 270 230" class="tip-art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DEFS}<g filter="url(#tipShadow)">${realistic(inner)}</g></svg>`;
export const arrow = (d, color = C.green, w = 3) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${color === C.red ? 'tipArrowRed' : 'tipArrow'})"/>`;
export const label = (x, y, text, { color = C.green, anchor = 'start', size = 14, weight = 800 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" font-family="Figtree, Segoe UI, Roboto, sans-serif">${text}</text>`;
export const ok = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.green}"/><path d="M${x - 6} ${y} l4 5 l8 -10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
export const bad = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.red}"/><path d="M${x - 5} ${y - 5} l10 10 M${x + 5} ${y - 5} l-10 10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
export const dashed = (d, color = C.green) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6 6"/>`;
export const floor = (x1, x2, y) => `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${C.floor}" stroke-width="4" stroke-linecap="round"/>`;

