// Pentagrama por piezas para los ejercicios del curso: cada nota (o silencio, clave, hueco entre notas) es una celda
// SVG de la misma altura, así las celdas se ponen en fila, saltan de línea en el móvil y cada una puede ser un botón
// accesible. Se pinta con currentColor (tema claro y oscuro) y crece con el tamaño de letra (CSS en rem).
import { CLEF_BOTTOM } from './notes.js';

export const CELL_H = 120;
export const NOTE_W = 40;
export const GAP_W = 44;
const BOTTOM = 80;      // línea inferior
const HALF = 5;         // medio espacio
const STEM = 30;
const LOW = -6;         // tres líneas adicionales por debajo…
const HIGH = 14;        // …y por encima
const CLEF_GLYPH = { treble: '𝄞', bass: '𝄢' };

export const yOf = (step, clef = 'treble') => BOTTOM - (step - CLEF_BOTTOM[clef]) * HALF;
const r1 = v => Math.round(v * 10) / 10;

function lines(w) {
  return Array.from({ length: 5 }, (_, i) => `<line class="lm-st-line" x1="0" x2="${w}" y1="${BOTTOM - i * 2 * HALF}" y2="${BOTTOM - i * 2 * HALF}"/>`).join('');
}

function ledgers(rel, cx) {
  const out = [];
  for (let r = -2; r >= rel; r -= 2) out.push(r);
  for (let r = 10; r <= rel; r += 2) out.push(r);
  return out.map(r => `<line class="lm-st-line" x1="${cx - 11}" x2="${cx + 11}" y1="${BOTTOM - r * HALF}" y2="${BOTTOM - r * HALF}"/>`).join('');
}

function noteSvg(step, dur, clef, cx) {
  const rel = step - CLEF_BOTTOM[clef];
  const y = yOf(step, clef);
  const base = dur.replace('.', '');
  const open = base === 'h' || base === 'w';
  const head = `<ellipse class="lm-head${open ? ' open' : ''}" cx="${cx}" cy="${y}" rx="6.4" ry="4.6" transform="rotate(-20 ${cx} ${y})"/>`;
  let stem = '';
  if (base !== 'w') {
    const up = rel < 4;
    const x = up ? cx + 5.8 : cx - 5.8;
    const end = up ? y - STEM : y + STEM;
    stem = `<line class="lm-stem" x1="${x}" x2="${x}" y1="${r1(y + (up ? -1 : 1))}" y2="${end}"/>`;
    const flags = base === 'e' ? 1 : base === 's' ? 2 : 0;
    for (let k = 0; k < flags; k++) {
      const fy = end + (up ? 7 : -7) * k;
      stem += `<path class="lm-flag" d="M${x} ${fy} q 9 ${up ? 8 : -8} 7 ${up ? 18 : -18}" />`;
    }
  }
  const dot = dur.endsWith('.') ? `<circle class="lm-dot" cx="${cx + 11}" cy="${rel % 2 === 0 ? y - HALF : y}" r="1.9"/>` : '';
  return ledgers(rel, cx) + head + stem + dot;
}

// Silencios dibujados con trazos (no dependen de la fuente musical)
function restSvg(dur, cx) {
  const base = dur.replace('.', '');
  if (base === 'w') return `<rect class="lm-rest" x="${cx - 7}" y="${BOTTOM - 6 * HALF}" width="14" height="5"/>`;
  if (base === 'h') return `<rect class="lm-rest" x="${cx - 7}" y="${BOTTOM - 4 * HALF - 5}" width="14" height="5"/>`;
  if (base === 'e') return `<circle class="lm-rest" cx="${cx - 3}" cy="${BOTTOM - 5 * HALF}" r="2.6"/><path class="lm-rest-line" d="M${cx - 3} ${BOTTOM - 5 * HALF + 1} q 5 2 8 -3 l -6 18"/>`;
  return `<path class="lm-rest-line q" d="M${cx - 3} ${BOTTOM - 7 * HALF} l 6 7 l -6 6 l 6 7 q -8 -3 -6 6"/>`;
}

// Celda de nota o silencio. extra: marca de corrección encima (✓ ≈ ✕) o un fantasma (nota a punto de ponerse)
export function noteCell({ step = null, rest = false, dur = 'q', clef = 'treble', mark = null, ghost = null, w = NOTE_W } = {}) {
  const cx = w / 2;
  const body = rest ? restSvg(dur, cx) : step === null ? '' : noteSvg(step, dur, clef, cx);
  const ghostSvg = ghost === null ? '' : `<g class="lm-ghost">${noteSvg(ghost, dur, clef, cx)}</g>`;
  const markSvg = mark ? `<text class="lm-mark" x="${cx}" y="12" text-anchor="middle">${({ ok: '✓', near: '≈', bad: '✕' })[mark]}</text>` : '';
  return `<svg class="lm-cell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}${ghostSvg}${body}${markSvg}</svg>`;
}

// Clave (y compás, si lo hay) al principio de la fila
export function clefCell(clef = 'treble', meter = null) {
  const w = meter ? 68 : 40;
  const glyph = clef === 'bass'
    ? `<text class="lm-clef bass" x="3" y="${BOTTOM - 6 * HALF + 2}">${CLEF_GLYPH.bass}</text>`
    : `<text class="lm-clef" x="2" y="${BOTTOM + 9}">${CLEF_GLYPH.treble}</text>`;
  const time = meter ? meter.split('/').map((n, i) => `<text class="lm-time" x="56" y="${BOTTOM - (i ? 0 : 4) * HALF - 1}" text-anchor="middle">${n}</text>`).join('') : '';
  return `<svg class="lm-cell lm-clefcell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}${glyph}${time}</svg>`;
}

// Hueco entre dos notas: con barra de compás o vacío (en el ejercicio de barras es un botón)
export function gapCell(on = false, mark = null, w = GAP_W) {
  const bar = on ? `<line class="lm-bar" x1="${w / 2}" x2="${w / 2}" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/>` : `<line class="lm-bar-hint" x1="${w / 2}" x2="${w / 2}" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/>`;
  const markSvg = mark ? `<text class="lm-mark" x="${w / 2}" y="12" text-anchor="middle">${({ ok: '✓', near: '≈', bad: '✕' })[mark]}</text>` : '';
  return `<svg class="lm-cell lm-gapcell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}${bar}${markSvg}</svg>`;
}

// Barra final (doble)
export function endCell() {
  return `<svg class="lm-cell lm-endcell" viewBox="0 0 12 ${CELL_H}" aria-hidden="true" focusable="false">${lines(12)}<line class="lm-bar" x1="4" x2="4" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/><rect x="7" y="${BOTTOM - 8 * HALF}" width="3.5" height="${8 * HALF}" class="lm-bar-thick"/></svg>`;
}

// Escalón según dónde se toca la celda (para escribir notas tocando líneas y espacios)
export function stepAtY(svg, clientY, clef = 'treble') {
  const r = svg.getBoundingClientRect();
  const y = (clientY - r.top) * (CELL_H / r.height);
  const rel = Math.round((BOTTOM - y) / HALF);
  return CLEF_BOTTOM[clef] + Math.max(LOW, Math.min(HIGH, rel));
}
export const STEP_LIMITS = clef => [CLEF_BOTTOM[clef] + LOW, CLEF_BOTTOM[clef] + HIGH];
