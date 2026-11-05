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
const BEAM_UP = 46;     // altura de la barra de corcheas con plica hacia arriba (y hacia abajo)
const BEAM_DOWN = 104;
const BEAM_W = 4.5;

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

// beam: 'start' | 'end' (corcheas unidas por una barra: la barra llega al borde de la celda y sigue en la de al lado)
// up: dirección de la plica impuesta (las dos corcheas de una pareja, igual)
function noteSvg(step, dur, clef, cx, { beam = null, up: forcedUp = null, w = NOTE_W } = {}) {
  const rel = step - CLEF_BOTTOM[clef];
  const y = yOf(step, clef);
  const base = dur.replace('.', '');
  const open = base === 'h' || base === 'w';
  const head = `<ellipse class="lm-head${open ? ' open' : ''}" cx="${cx}" cy="${y}" rx="6.4" ry="4.6" transform="rotate(-20 ${cx} ${y})"/>`;
  let stem = '';
  if (base !== 'w') {
    const up = forcedUp ?? rel < 4;
    const x = up ? cx + 5.8 : cx - 5.8;
    // las dos plicas de una pareja acaban a la misma altura (la de la barra)
    const end = beam ? (up ? Math.min(y - STEM, BEAM_UP) : Math.max(y + STEM, BEAM_DOWN)) : up ? y - STEM : y + STEM;
    stem = `<line class="lm-stem" x1="${x}" x2="${x}" y1="${r1(y + (up ? -1 : 1))}" y2="${end}"/>`;
    if (beam) {
      const [x1, x2] = beam === 'start' ? [x, w] : [0, x];
      stem += `<rect class="lm-beam" x="${r1(x1)}" y="${up ? end : end - BEAM_W}" width="${r1(x2 - x1)}" height="${BEAM_W}"/>`;
    }
    const flags = beam ? 0 : base === 'e' ? 1 : base === 's' ? 2 : 0;
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
// fermata: calderón encima; breath: coma de respiración después de la nota
export function noteCell({ step = null, rest = false, dur = 'q', clef = 'treble', mark = null, ghost = null, w = NOTE_W, beam = null, up = null, fermata = false, breath = false } = {}) {
  const cx = w / 2;
  const body = (rest ? restSvg(dur, cx) : step === null ? '' : noteSvg(step, dur, clef, cx, { beam, up, w }))
    + (fermata ? `<path class="lm-fermata" d="M${cx - 8} 26 a8 7 0 0 1 16 0"/><circle class="lm-dot" cx="${cx}" cy="23" r="1.8"/>` : '')
    + (breath ? `<text class="lm-breath" x="${w - 6}" y="${BOTTOM - 8 * HALF - 2}" text-anchor="middle">,</text>` : '');
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

// Barra final (doble); con repeat, barra de repetición (dos puntos antes)
export function endCell(repeat = false) {
  const w = repeat ? 20 : 12;
  const o = w - 12;
  const dots = repeat ? `<circle class="lm-dot" cx="4" cy="${BOTTOM - 5 * HALF}" r="2"/><circle class="lm-dot" cx="4" cy="${BOTTOM - 3 * HALF}" r="2"/>` : '';
  return `<svg class="lm-cell lm-endcell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}${dots}<line class="lm-bar" x1="${o + 4}" x2="${o + 4}" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/><rect x="${o + 7}" y="${BOTTOM - 8 * HALF}" width="3.5" height="${8 * HALF}" class="lm-bar-thick"/></svg>`;
}

// Disposición de una línea de notas: compás de cada una, si acaba compás y qué corcheas van unidas por una barra
// (dos corcheas seguidas que empiezan en el pulso). pickup: pulsos de la anacrusa.
export function layoutTokens(tokens, { barBeats = null, pickup = 0, clef = 'treble' } = {}) {
  let start = 0;
  const pos = tokens.map(t => { const p = { ...t, start: t.start ?? start, beats: t.beats ?? (BEATS[t.dur] || 0) }; start = p.start + p.beats; return p; });
  return pos.map((t, i) => {
    const next = pos[i + 1];
    const prev = pos[i - 1];
    const pairStart = t.dur === 'e' && !t.rest && next && next.dur === 'e' && !next.rest && Math.abs(t.start % 1) < 1e-6 && t.step !== undefined && next.step !== undefined;
    const pairEnd = prev && t.dur === 'e' && !t.rest && prev.dur === 'e' && !prev.rest && Math.abs(prev.start % 1) < 1e-6 && Math.abs(t.start - prev.start - 0.5) < 1e-6;
    const mate = pairStart ? next : pairEnd ? prev : null;
    const up = mate ? ((t.step + mate.step) / 2 - CLEF_BOTTOM[clef]) < 4 : null;
    const end = t.start + t.beats;
    const barEnd = !!barBeats && i < pos.length - 1 && (Math.abs((((end - pickup) % barBeats) + barBeats) % barBeats) < 1e-6);
    const bar = !barBeats ? 0 : pickup ? (t.start < pickup - 1e-6 ? 0 : 1 + Math.floor((t.start - pickup + 1e-6) / barBeats)) : Math.floor((t.start + 1e-6) / barBeats);
    return { beam: pairStart ? 'start' : pairEnd ? 'end' : null, up, barEnd, bar };
  });
}
const BEATS = { w: 4, 'h.': 3, h: 2, 'q.': 1.5, q: 1, 'e.': 0.75, e: 0.5, s: 0.25 };

// Escalón según dónde se toca la celda (para escribir notas tocando líneas y espacios)
export function stepAtY(svg, clientY, clef = 'treble') {
  const r = svg.getBoundingClientRect();
  const y = (clientY - r.top) * (CELL_H / r.height);
  const rel = Math.round((BOTTOM - y) / HALF);
  return CLEF_BOTTOM[clef] + Math.max(LOW, Math.min(HIGH, rel));
}
export const STEP_LIMITS = clef => [CLEF_BOTTOM[clef] + LOW, CLEF_BOTTOM[clef] + HIGH];
