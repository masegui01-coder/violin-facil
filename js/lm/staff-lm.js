// Pentagrama por piezas para los ejercicios del curso: cada nota (o silencio, clave, hueco entre notas) es una celda
// SVG de la misma altura, así las celdas se ponen en fila, saltan de línea en el móvil y cada una puede ser un botón
// accesible. Se pinta con currentColor (tema claro y oscuro) y crece con el tamaño de letra (CSS en rem).
import { CLEF_BOTTOM, durBase, isTriplet } from './notes.js';

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
const BEAM_GAP = 3;     // entre la barra principal y la segunda (semicorcheas)
const ACC_GLYPH = { '#': '♯', b: '♭', n: '♮' };
// Posición (en medios espacios sobre la línea inferior) de cada alteración de la armadura, en clave de sol
const KEY_FLATS = [4, 7, 3, 6, 2, 5, 1];   // si mi la re sol do fa
const KEY_SHARPS = [8, 5, 9, 6, 3, 7, 4];  // fa do sol re la mi si
const KEY_W = 12;
const TIME_W = 28;

// Posición de cada alteración de la armadura (n > 0 sostenidos, n < 0 bemoles) en su clave. Clave de fa, 2 medios espacios más
// abajo; de do en 3.ª, 1 más abajo; de do en 4.ª y de fa en 3.ª, la misma altura en la octava que cae dentro del pentagrama
const CLEF_SHIFT = { treble: 0, bass: 2, alto: 1 };
export function keyRelPositions(armadura, clef = 'treble') {
  const spots = (armadura < 0 ? KEY_FLATS : KEY_SHARPS).slice(0, Math.abs(armadura));
  if (clef in CLEF_SHIFT) return spots.map(rel => rel - CLEF_SHIFT[clef]);
  return spots.map(rel => { let r = rel + CLEF_BOTTOM.treble - CLEF_BOTTOM[clef]; while (r > 8) r -= 7; while (r < 0) r += 7; return r; });
}
// Escalón de cada alteración de una armadura en su clave: el orden fijo del pentagrama
export function keySignatureSteps(armadura, clef = 'treble') {
  return keyRelPositions(armadura, clef).map(rel => CLEF_BOTTOM[clef] + rel);
}
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

// Signo del tresillo en la celda: «3» (en la celda del medio) y, si no hay barra común, corchete de punta a punta
// tuplet: { pos: 'start' | 'mid' | 'end' | 'only', label: esta celda lleva el 3, bracket, y, up }
function tupletSvg(t, w) {
  if (!t) return '';
  const cx = w / 2;
  const hook = t.up ? 6 : -6;
  let out = '';
  if (t.bracket) {
    const first = t.pos === 'start' || t.pos === 'only';
    const last = t.pos === 'end' || t.pos === 'only';
    out += `<path class="lm-tuplet-br" d="M${first ? cx - 8 : 0} ${t.y + (first ? hook : 0)} V${t.y} H${last ? cx + 8 : w}${last ? ` V${t.y + hook}` : ''}"/>`;
  }
  if (t.label) out += `<text class="lm-tuplet" x="${t.pos === 'start' ? w : cx}" y="${r1(t.y + (t.up ? -3 : 11))}" text-anchor="middle">3</text>`;
  return out;
}

// Adornos sobre la nota: tr (trino), mordente (zigzag corto), grupeto (S tumbada), apoyatura (nota pequeña con corchete) y
// acciaccatura (nota pequeña tachada, de una semicorchea). Los dos últimos van delante de la nota principal.
function ornamentSvg(signo, cx, y, direccion) {
  const top = Math.min(y - 14, BOTTOM - 8 * HALF - 8);
  if (signo === 'trino') return `<text class="lm-orn-tr" x="${cx}" y="${r1(top + 4)}" text-anchor="middle">tr</text><path class="lm-orn" d="M${cx - 9} ${r1(top + 9)} q 3 -4 6 0 t 6 0 t 6 0"/>`;
  if (signo === 'mordente') return `<path class="lm-orn" d="M${cx - 8} ${r1(top + 6)} l 3 -6 l 3 6 l 3 -6 l 3 6 M${cx - 1} ${r1(top + 8)} v -10"/>`;
  if (signo === 'grupeto') return `<path class="lm-orn" d="M${cx - 10} ${r1(top + 5)} q 5 -9 10 0 t 10 -1"/>`;
  // nota pequeña a la izquierda, un escalón por encima (o por debajo, si el adorno va hacia abajo)
  const gy = y + (direccion === 'abajo' ? HALF : -HALF);
  const gx = cx - 17;
  const head = `<ellipse class="lm-head lm-grace" cx="${gx}" cy="${r1(gy)}" rx="4.2" ry="3.1" transform="rotate(-20 ${gx} ${r1(gy)})"/>`;
  const stem = `<line class="lm-stem lm-grace-stem" x1="${gx + 3.8}" x2="${gx + 3.8}" y1="${r1(gy)}" y2="${r1(gy - 18)}"/><path class="lm-flag lm-grace-stem" d="M${gx + 3.8} ${r1(gy - 18)} q 5 4 4 11"/>`;
  const slash = signo === 'acciaccatura' ? `<line class="lm-grace-stem" x1="${gx - 2}" x2="${gx + 11}" y1="${r1(gy - 4)}" y2="${r1(gy - 15)}"/>` : '';
  return head + stem + slash;
}

// beam: 'start' | 'end' (corcheas unidas por una barra: la barra llega al borde de la celda y sigue en la de al lado)
// up: dirección de la plica impuesta (las dos corcheas de una pareja, igual)
function noteSvg(step, dur, clef, cx, { beam: beam0 = null, up: forcedUp = null, w = NOTE_W, acc = null, tie = 0, slur = 0, ornament = null } = {}) {
  const beam = typeof beam0 === 'string' ? (beam0 === 'start' ? { out: true } : { in: true }) : beam0;
  const rel = step - CLEF_BOTTOM[clef];
  const y = yOf(step, clef);
  const base = durBase(dur);
  const open = base === 'h' || base === 'w';
  const head = `<ellipse class="lm-head${open ? ' open' : ''}" cx="${cx}" cy="${y}" rx="6.4" ry="4.6" transform="rotate(-20 ${cx} ${y})"/>`;
  let stem = '';
  const up = forcedUp ?? rel < 4;
  if (base !== 'w') {
    const x = up ? cx + 5.8 : cx - 5.8;
    // las plicas de un grupo acaban a la misma altura (la de la barra)
    const end = beam ? (beam.y !== undefined ? beam.y : up ? Math.min(y - STEM, BEAM_UP) : Math.max(y + STEM, BEAM_DOWN)) : up ? y - STEM : y + STEM;
    stem = `<line class="lm-stem" x1="${x}" x2="${x}" y1="${r1(y + (up ? -1 : 1))}" y2="${end}"/>`;
    if (beam) {
      const x1 = beam.in ? 0 : x;
      const x2 = beam.out ? w : x;
      if (x2 > x1) stem += `<rect class="lm-beam" x="${r1(x1)}" y="${up ? end : end - BEAM_W}" width="${r1(x2 - x1)}" height="${BEAM_W}"/>`;
      if (base === 's') {
        // segunda barra: entera si la nota vecina también es semicorchea; si no, un trazo corto hacia el resto del grupo
        const y2 = up ? end + BEAM_W + BEAM_GAP : end - 2 * BEAM_W - BEAM_GAP;
        const s1 = beam.in2 ? 0 : beam.stub2 < 0 ? x - 9 : x;
        const s2 = beam.out2 ? w : beam.stub2 > 0 ? x + 9 : x;
        if (s2 > s1) stem += `<rect class="lm-beam" x="${r1(s1)}" y="${r1(y2)}" width="${r1(s2 - s1)}" height="${BEAM_W}"/>`;
      }
    }
    const flags = beam ? 0 : base === 'e' ? 1 : base === 's' ? 2 : 0;
    for (let k = 0; k < flags; k++) {
      const fy = end + (up ? 7 : -7) * k;
      stem += `<path class="lm-flag" d="M${x} ${fy} q 9 ${up ? 8 : -8} 7 ${up ? 18 : -18}" />`;
    }
  }
  const dot = dur.endsWith('.') ? `<circle class="lm-dot" cx="${cx + 11}" cy="${rel % 2 === 0 ? y - HALF : y}" r="1.9"/>` : '';
  const sign = acc ? `<text class="lm-acc" x="${cx - 18}" y="${r1(y + 6)}">${ACC_GLYPH[acc]}</text>` : '';
  // ligadura de prolongación: un arco que sale de la cabeza y llega a la nota que sigue (debajo si la plica sube)
  let arc = '';
  if (tie) {
    const yb = y + (up ? 8 : -8);
    arc = `<path class="lm-tie" d="M${r1(cx + 2)} ${r1(yb)} Q ${r1(cx + tie / 2)} ${r1(yb + (up ? 9 : -9))} ${r1(cx + tie - 2)} ${r1(yb)}"/>`;
  }
  // ligadura de expresión: una curva más alta que la de prolongación, de la primera a la última nota del grupo (por el lado
  // contrario a la plica)
  if (slur) {
    const yb = y + (up ? 10 : -10);
    const lift = Math.min(16, 7 + slur / 18);
    arc += `<path class="lm-tie lm-slur" d="M${r1(cx)} ${r1(yb)} Q ${r1(cx + slur / 2)} ${r1(yb + (up ? lift : -lift) * 1.6)} ${r1(cx + slur)} ${r1(yb)}"/>`;
  }
  const orn = ornament ? ornamentSvg(ornament.signo, cx, y, ornament.direccion) : '';
  return ledgers(rel, cx) + sign + head + stem + dot + arc + orn;
}

// Silencios dibujados con trazos (no dependen de la fuente musical)
function restSvg(dur, cx) {
  const dot = dur.endsWith('.') ? `<circle class="lm-dot" cx="${cx + 9}" cy="${BOTTOM - 5 * HALF}" r="1.9"/>` : '';
  return restBody(durBase(dur), cx) + dot;
}
function restBody(base, cx) {
  if (base === 'w') return `<rect class="lm-rest" x="${cx - 7}" y="${BOTTOM - 6 * HALF}" width="14" height="5"/>`;
  if (base === 'h') return `<rect class="lm-rest" x="${cx - 7}" y="${BOTTOM - 4 * HALF - 5}" width="14" height="5"/>`;
  if (base === 'e') return `<circle class="lm-rest" cx="${cx - 3}" cy="${BOTTOM - 5 * HALF}" r="2.6"/><path class="lm-rest-line" d="M${cx - 3} ${BOTTOM - 5 * HALF + 1} q 5 2 8 -3 l -6 18"/>`;
  // silencio de semicorchea: como el de corchea con un segundo gancho
  if (base === 's') return `<circle class="lm-rest" cx="${cx - 3}" cy="${BOTTOM - 5 * HALF}" r="2.6"/><circle class="lm-rest" cx="${cx - 5}" cy="${BOTTOM - 4 * HALF + 1}" r="2.6"/><path class="lm-rest-line" d="M${cx - 3} ${BOTTOM - 5 * HALF + 1} q 5 2 8 -3 l -8 24"/>`;
  return `<path class="lm-rest-line q" d="M${cx - 3} ${BOTTOM - 7 * HALF} l 6 7 l -6 6 l 6 7 q -8 -3 -6 6"/>`;
}

// Celda de nota o silencio. extra: marca de corrección encima (✓ ≈ ✕) o un fantasma (nota a punto de ponerse)
// fermata: calderón encima; breath: coma de respiración después de la nota; tuplet: signo del tresillo; chord: acorde
// (número romano o cifrado) encima del pentagrama; ornament: { signo, direccion } sobre la nota
export function noteCell({ step = null, rest = false, dur = 'q', clef = 'treble', mark = null, ghost = null, w = NOTE_W, beam = null, up = null, fermata = false, breath = false, acc = null, tie = 0, slur = 0, given = false, tuplet = null, chord = null, ornament = null } = {}) {
  const cx = w / 2;
  const inner = (rest ? restSvg(dur, cx) : step === null ? '' : noteSvg(step, dur, clef, cx, { beam, up, w, acc, tie, slur, ornament }));
  const body = (given ? `<g class="lm-given">${inner}</g>` : inner)
    + tupletSvg(tuplet, w)
    + (fermata ? `<path class="lm-fermata" d="M${cx - 8} 26 a8 7 0 0 1 16 0"/><circle class="lm-dot" cx="${cx}" cy="23" r="1.8"/>` : '')
    + (breath ? `<text class="lm-breath" x="${w - 6}" y="${BOTTOM - 8 * HALF - 2}" text-anchor="middle">,</text>` : '')
    + (chord ? `<text class="lm-chordname" x="2" y="11">${String(chord).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>` : '');
  const ghostSvg = ghost === null ? '' : `<g class="lm-ghost">${noteSvg(ghost, dur, clef, cx)}</g>`;
  const markSvg = mark ? `<text class="lm-mark" x="${cx}" y="12" text-anchor="middle">${({ ok: '✓', near: '≈', bad: '✕' })[mark]}</text>` : '';
  return `<svg class="lm-cell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}${ghostSvg}${body}${markSvg}</svg>`;
}

// Cifra del compás en dos pisos (6/8, 12/8…): el ancho crece con las cifras
const timeWidth = meter => TIME_W + 9 * Math.max(0, ...String(meter).split('/').map(x => x.length - 1));
function timeSvg(meter, x) {
  return String(meter).split('/').map((t, i) => `<text class="lm-time" x="${x}" y="${BOTTOM - (i ? 0 : 4) * HALF - 1}" text-anchor="middle">${t}</text>`).join('');
}
// Clave de do: dos barras y dos medias lunas, centradas en la línea que marca el do central (línea 3 o 4)
function cClefSvg(pos) {
  const cy = BOTTOM - pos * HALF;
  return `<rect class="lm-bar-thick" x="3" y="${BOTTOM - 8 * HALF}" width="4" height="${8 * HALF}"/><line class="lm-bar" x1="10" x2="10" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/>`
    + `<path class="lm-cclef" d="M13 ${cy - 2} C 21 ${cy - 4} 24 ${cy - 10} 24 ${cy - 14} C 24 ${cy - 21} 15 ${cy - 21} 14 ${cy - 17}"/>`
    + `<path class="lm-cclef" d="M13 ${cy + 2} C 21 ${cy + 4} 24 ${cy + 10} 24 ${cy + 14} C 24 ${cy + 21} 15 ${cy + 21} 14 ${cy + 17}"/>`
    + `<circle class="lm-dot" cx="27" cy="${cy - HALF}" r="2"/><circle class="lm-dot" cx="27" cy="${cy + HALF}" r="2"/>`;
}
// Posición (en medios espacios) de la línea que marca cada clave de do y de fa en 3.ª
const CLEF_LINE = { alto: 4, tenor: 6, baritone: 4 };
// Clave (y compás, si lo hay) al principio de la fila
export function clefCell(clef = 'treble', meter = null, armadura = 0) {
  const n = Math.abs(armadura || 0);
  const w = 40 + KEY_W * n + (meter ? timeWidth(meter) : 0);
  let glyph;
  if (clef === 'bass') glyph = `<text class="lm-clef bass" x="3" y="${BOTTOM - 6 * HALF + 2}">${CLEF_GLYPH.bass}</text>`;
  else if (clef === 'baritone') glyph = `<text class="lm-clef bass" x="3" y="${BOTTOM - 4 * HALF + 2}">${CLEF_GLYPH.bass}</text>`;
  else if (clef === 'alto' || clef === 'tenor') glyph = cClefSvg(CLEF_LINE[clef]);
  else glyph = `<text class="lm-clef" x="4" y="${r1(BOTTOM + 1.45 * HALF)}">${CLEF_GLYPH.treble}</text>`;
  const time = meter ? timeSvg(meter, w - timeWidth(meter) / 2 + 2) : '';
  // armadura: las alteraciones en su sitio según la clave
  const key = keyRelPositions(armadura, clef).map((rel, i) => `<text class="lm-acc" x="${34 + KEY_W * i}" y="${BOTTOM - rel * HALF + 6}">${armadura < 0 ? '♭' : '♯'}</text>`).join('');
  return `<svg class="lm-cell lm-clefcell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}${glyph}${key}${time}</svg>`;
}

// Cambio de compás a mitad de pieza: solo las cifras, tras una doble barra fina
export function timeCell(meter) {
  const w = timeWidth(meter) - 4;
  return `<svg class="lm-cell lm-timecell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}${timeSvg(meter, w / 2)}</svg>`;
}
// Doble barra fina (cambio de compás): sustituye a la barra de compás
export function doubleBarCell(w = 16) {
  return `<svg class="lm-cell lm-gapcell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}<line class="lm-bar" x1="${w / 2 - 2.5}" x2="${w / 2 - 2.5}" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/><line class="lm-bar" x1="${w / 2 + 2.5}" x2="${w / 2 + 2.5}" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/></svg>`;
}

// Casilla del pentagrama donde se coloca UNA alteración de la armadura (ejercicio «armadura»): sin nota, con el signo a la altura elegida
export function accSlotCell(step = null, sym = '♯', w = 26, clef = 'treble') {
  const sign = step === null ? '' : `<text class="lm-acc" x="${w / 2 - 6}" y="${r1(yOf(step, clef) + 6)}">${sym}</text>`;
  return `<svg class="lm-cell lm-slotcell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}${sign}</svg>`;
}

// Barra de repetición al principio (|:) y al final de la casilla 1 (:|)
export function repStartCell() {
  const w = 20;
  return `<svg class="lm-cell lm-repcell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}<rect x="1" y="${BOTTOM - 8 * HALF}" width="3.5" height="${8 * HALF}" class="lm-bar-thick"/><line class="lm-bar" x1="8" x2="8" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/><circle class="lm-dot" cx="14" cy="${BOTTOM - 5 * HALF}" r="2"/><circle class="lm-dot" cx="14" cy="${BOTTOM - 3 * HALF}" r="2"/></svg>`;
}
export function repEndCell() {
  const w = 20;
  return `<svg class="lm-cell lm-repcell" viewBox="0 0 ${w} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w)}<circle class="lm-dot" cx="5" cy="${BOTTOM - 5 * HALF}" r="2"/><circle class="lm-dot" cx="5" cy="${BOTTOM - 3 * HALF}" r="2"/><line class="lm-bar" x1="11" x2="11" y1="${BOTTOM - 8 * HALF}" y2="${BOTTOM}"/><rect x="14" y="${BOTTOM - 8 * HALF}" width="3.5" height="${8 * HALF}" class="lm-bar-thick"/></svg>`;
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
// pulse: pulsos de negra de cada pulso del compás (1; 1,5 en 6/8): las corcheas y semicorcheas se unen DENTRO de cada pulso
// (en 6/8, de tres en tres). Las semicorcheas llevan segunda barra.
// Nivel 4: plan { sizes } (pulsos de negra de cada compás, si cambia el compás) y grouping(bar) → corcheas de cada grupo
// (5/8 en 3+2, 7/8, 12/8, la hemiola…): las barras se parten en los grupos. Los tresillos se unen entre sí (un grupo por
// tresillo) y llevan el 3: tuplet = { pos, label, bracket, y, up } por ficha.
export function layoutTokens(tokens, { barBeats = null, pickup = 0, clef = 'treble', pulse = 1, plan = null, grouping = null } = {}) {
  let start = 0;
  const pos = tokens.map(t => { const p = { ...t, start: t.start ?? start, beats: t.beats ?? (BEATS[t.dur] || 0) }; start = p.start + p.beats; return p; });
  const baseOf = t => durBase(t.dur);
  const eligible = t => !t.rest && (baseOf(t) === 'e' || baseOf(t) === 's') && t.step !== undefined && t.step !== null;
  const eps = 1e-6;
  // compás de cada ficha: por la medida de cada compás si cambia, o por el compás fijo
  const edges = plan && plan.sizes ? plan.sizes.reduce((acc, s) => [...acc, acc[acc.length - 1] + s], [0]) : null;
  const bars = pos.map(t => {
    if (edges) { let b = 0; while (b < edges.length - 2 && t.start >= edges[b + 1] - eps) b++; return b; }
    return !barBeats ? 0 : pickup ? (t.start < pickup - eps ? 0 : 1 + Math.floor((t.start - pickup + eps) / barBeats)) : Math.floor((t.start + eps) / barBeats);
  });
  const barStartOf = b => (edges ? edges[b] : pickup ? (b === 0 ? 0 : pickup + (b - 1) * barBeats) : b * (barBeats || 0));
  const pulseOf = (t, i) => {
    if (grouping) {
      const gs = grouping(bars[i]);
      if (gs) {
        const rel = t.start - barStartOf(bars[i]);
        let acc = 0;
        let k = 0;
        while (k < gs.length - 1 && rel >= (acc += gs[k]) * 0.5 - eps) k++;
        return `${bars[i]}:${k}`;
      }
    }
    return `${bars[i]}:${t.start < pickup - eps ? -1 : Math.floor((t.start - pickup + eps) / pulse)}`;
  };
  // tresillos: cada grupo acaba cuando suma un múltiplo de media negra; sus fichas se unen entre sí y no con las vecinas
  const tupId = new Array(pos.length).fill(null);
  let tg = null;
  pos.forEach((t, i) => {
    if (!isTriplet(t.dur)) { tg = null; return; }
    if (!tg) tg = { id: i, from: t.start };
    tupId[i] = tg.id;
    const span = t.start + t.beats - tg.from;
    if (span >= 0.5 - eps && Math.abs(span * 2 - Math.round(span * 2)) < eps) tg = null;
  });
  const keyOf = (t, i) => (tupId[i] !== null ? `T${tupId[i]}` : pulseOf(t, i));
  // grupos de notas que se unen con barra (dos o más seguidas del mismo pulso)
  const groupOf = new Array(pos.length).fill(null);
  for (let i = 0; i < pos.length;) {
    if (!eligible(pos[i])) { i++; continue; }
    let j = i;
    while (j + 1 < pos.length && eligible(pos[j + 1]) && keyOf(pos[j + 1], j + 1) === keyOf(pos[i], i)) j++;
    if (j > i) {
      const members = pos.slice(i, j + 1);
      const rels = members.map(m => m.step - CLEF_BOTTOM[clef]);
      const up = rels.reduce((a, b) => a + b, 0) / rels.length < 4;
      const ys = members.map(m => yOf(m.step, clef));
      const y = up ? Math.max(2, Math.min(BEAM_UP, Math.min(...ys) - STEM)) : Math.min(118, Math.max(BEAM_DOWN, Math.max(...ys) + STEM));
      for (let k = i; k <= j; k++) groupOf[k] = { from: i, to: j, up, y };
    }
    i = j + 1;
  }
  // signo de cada tresillo: «3» sobre la barra común o, si algún miembro no está unido (silencio, negras), corchete
  const tupletOf = new Array(pos.length).fill(null);
  [...new Set(tupId.filter(x => x !== null))].forEach(id => {
    const idx = tupId.map((x, i) => (x === id ? i : -1)).filter(i => i >= 0);
    const beamed = idx.length > 1 && idx.every(i => groupOf[i] && groupOf[i].from === groupOf[idx[0]].from);
    const stemsUp = idx.map(i => (pos[i].rest ? 4 : pos[i].step - CLEF_BOTTOM[clef])).reduce((a, b) => a + b, 0) / idx.length < 4;
    const up = beamed ? groupOf[idx[0]].up : stemsUp;
    let y;
    if (beamed) y = up ? Math.max(8, groupOf[idx[0]].y - 4) : Math.min(112, groupOf[idx[0]].y + 4);
    else if (up) y = Math.max(8, Math.min(...idx.map(i => (pos[i].rest ? BOTTOM - 8 * HALF : yOf(pos[i].step, clef) - STEM))) - 6);
    else y = Math.min(112, Math.max(...idx.map(i => (pos[i].rest ? BOTTOM : yOf(pos[i].step, clef) + STEM))) + 8);
    const mid = Math.floor((idx.length - 1) / 2);
    idx.forEach((i, k) => {
      const where = idx.length === 1 ? 'only' : k === 0 ? 'start' : k === idx.length - 1 ? 'end' : 'mid';
      tupletOf[i] = { pos: where, label: k === mid, bracket: !beamed, y, up };
    });
  });
  return pos.map((t, i) => {
    const g = groupOf[i];
    const end = t.start + t.beats;
    const barEnd = i < pos.length - 1 && (edges ? edges.some(e => e > 0 && Math.abs(e - end) < eps) : !!barBeats && Math.abs((((end - pickup) % barBeats) + barBeats) % barBeats) < eps);
    let beam = null;
    if (g) {
      const isS = k => baseOf(pos[k]) === 's';
      const hasPrev = i > g.from;
      const hasNext = i < g.to;
      beam = { in: hasPrev, out: hasNext, y: g.y };
      if (isS(i)) {
        beam.in2 = hasPrev && isS(i - 1);
        beam.out2 = hasNext && isS(i + 1);
        beam.stub2 = beam.in2 || beam.out2 ? 0 : hasNext ? 1 : -1;
      }
    }
    return { beam, up: g ? g.up : null, barEnd, bar: bars[i], tuplet: tupletOf[i] };
  });
}
const BEATS = { w: 4, 'h.': 3, h: 2, 'q.': 1.5, q: 1, 'e.': 0.75, e: 0.5, s: 0.25, 'q:3': 2 / 3, 'e:3': 1 / 3, 's:3': 1 / 6 };

// Escalón según dónde se toca la celda (para escribir notas tocando líneas y espacios)
export function stepAtY(svg, clientY, clef = 'treble') {
  const r = svg.getBoundingClientRect();
  const y = (clientY - r.top) * (CELL_H / r.height);
  const rel = Math.round((BOTTOM - y) / HALF);
  return CLEF_BOTTOM[clef] + Math.max(LOW, Math.min(HIGH, rel));
}
export const STEP_LIMITS = clef => [CLEF_BOTTOM[clef] + LOW, CLEF_BOTTOM[clef] + HIGH];

// Acorde: varias notas apiladas en una celda (una redonda por cada nota, o con plica común si se pide duración menor).
// steps: escalones de abajo arriba; accs: alteración a dibujar delante de cada una ('#', 'b', 'n' o null)
export function chordCell({ steps = [], clef = 'treble', accs = [], dur = 'w', w = NOTE_W + 16, mark = null } = {}) {
  const cx = w / 2 + 6;
  const open = dur === 'w' || dur === 'h';
  const rels = steps.map(s => s - CLEF_BOTTOM[clef]);
  const ledg = [...new Set(rels.flatMap(rel => { const out = []; for (let r = -2; r >= rel; r -= 2) out.push(r); for (let r = 10; r <= rel; r += 2) out.push(r); return out; }))];
  const ledgers = ledg.map(r => `<line class="lm-st-line" x1="${cx - 11}" x2="${cx + 11}" y1="${BOTTOM - r * HALF}" y2="${BOTTOM - r * HALF}"/>`).join('');
  const heads = steps.map(s => { const y = yOf(s, clef); return `<ellipse class="lm-head${open ? ' open' : ''}" cx="${cx}" cy="${y}" rx="6.4" ry="4.6" transform="rotate(-20 ${cx} ${y})"/>`; }).join('');
  const signs = steps.map((s, i) => (accs[i] ? `<text class="lm-acc" x="${cx - 18 - (i % 2) * 12}" y="${r1(yOf(s, clef) + 6)}">${ACC_GLYPH[accs[i]]}</text>` : '')).join('');
  const stem = dur === 'w' || !steps.length ? '' : `<line class="lm-stem" x1="${cx + 5.8}" x2="${cx + 5.8}" y1="${yOf(steps[0], clef)}" y2="${yOf(steps[steps.length - 1], clef) - STEM}"/>`;
  const markSvg = mark ? `<text class="lm-mark" x="${cx}" y="12" text-anchor="middle">${({ ok: '✓', near: '≈', bad: '✕' })[mark]}</text>` : '';
  return `<svg class="lm-cell lm-chordcell" viewBox="0 0 ${w + 12} ${CELL_H}" aria-hidden="true" focusable="false">${lines(w + 12)}${ledgers}${signs}${heads}${stem}${markSvg}</svg>`;
}
