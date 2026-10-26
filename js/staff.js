// Pentagrama en SVG: clave de sol o de fa, armadura, compás, figuras, silencios y barras. Se desplaza con la lección.
import { diatonicStep, keySignature, keyCount, accidentalToShow } from './music.js';

const NS = 'http://www.w3.org/2000/svg';
const WIDTH = 440;
const HEIGHT = 200;
const BOTTOM_Y = 130;          // línea inferior (Mi4 en clave de sol, Sol2 en clave de fa)
const HALF = 7;                // medio espacio entre líneas
const E4 = 4 * 7 + 2;
const G2 = 2 * 7 + 4;
const BASE = { treble: E4, perc: E4, bass: G2, alto: 3 * 7 + 3, tenor: 3 * 7 + 1 };
const CLEF_MARK = { treble: '𝄞', bass: '𝄢', alto: '𝄡', tenor: '𝄡' };
const BASS_SIG_SHIFT = 14;     // en clave de fa las alteraciones de la armadura van dos octavas más abajo
const FOCUS_X = 190;           // donde queda la nota actual (deja ver las siguientes y la que suena)
const NOTE_PAD = 26;
const HEAD_RX = 8; // radio horizontal de la cabeza de la nota
const SHARP_STEPS = [38, 35, 39, 36, 33, 37, 34];
const FLAT_STEPS = [34, 37, 33, 36, 32, 35, 31];
const ACC_GLYPH = { sharp: '♯', flat: '♭', natural: '♮' };

let base = E4;                 // nota de la línea inferior según la clave
const y = step => BOTTOM_Y - (step - base) * HALF;

function el(tag, attrs = {}, parent) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (parent) parent.appendChild(node);
  return node;
}

function text(parent, x, yy, str, attrs = {}) {
  const t = el('text', { x, y: yy, ...attrs }, parent);
  t.textContent = str;
  return t;
}

function ledgerSteps(step) {
  const out = [];
  for (let s = base - 2; s >= step; s -= 2) out.push(s);
  for (let s = base + 10; s <= step; s += 2) out.push(s);
  return out;
}

function drawPrefix(g, key, time, clef) {
  for (let i = 0; i < 5; i++) {
    const ly = BOTTOM_Y - i * HALF * 2;
    el('line', { x1: 0, x2: WIDTH, y1: ly, y2: ly, class: 'st-line' }, g);
  }
  if (clef === 'perc') {
    // clave de percusión: dos barras gruesas
    [14, 24].forEach(x => el('rect', { x, y: BOTTOM_Y - HALF * 6, width: 6, height: HALF * 4, class: 'st-clef-perc' }, g));
    key = 'C';
  } else if (clef === 'bass') {
    text(g, 6, BOTTOM_Y - HALF * 2 + 2, '𝄢', { class: 'st-clef bass' });
  } else {
    text(g, 4, BOTTOM_Y + 9, '𝄞', { class: 'st-clef' });
  }
  const n = keyCount(key);
  const shift = clef === 'bass' ? BASS_SIG_SHIFT : 0;
  const steps = (n >= 0 ? SHARP_STEPS.slice(0, n) : FLAT_STEPS.slice(0, -n)).map(st => st - shift);
  steps.forEach((s, i) => text(g, 46 + i * 10, y(s) + (n >= 0 ? 5 : 3), n >= 0 ? '♯' : '♭', { class: 'st-acc' }));
  const tx = 54 + steps.length * 10;
  if (time) {
    text(g, tx, BOTTOM_Y - HALF * 4 - 1, String(time), { class: 'st-time' });
    text(g, tx, BOTTOM_Y + 1, '4', { class: 'st-time' });
  }
  return tx + (time ? 22 : 6);
}

function drawRest(g, x, note) {
  const mid = BOTTOM_Y - HALF * 4;
  if (note.dur === 'w') el('rect', { x: x - 6, y: mid - HALF * 2, width: 12, height: 5, class: 'st-fill' }, g);
  else if (note.dur === 'h') el('rect', { x: x - 6, y: mid - 5, width: 12, height: 5, class: 'st-fill' }, g);
  else if (note.dur === 'q') el('path', { d: `M${x - 2} ${mid - 14} l6 7 -5 6 6 8 c-5 -2 -8 1 -4 5 c-7 -3 -6 -9 0 -7 l-6 -7 5 -6z`, class: 'st-fill' }, g);
  else {
    el('circle', { cx: x - 3, cy: mid - 4, r: 2.8, class: 'st-fill' }, g);
    el('path', { d: `M${x - 3} ${mid - 2} q5 1 7 -4 l-5 16`, class: 'st-stroke', 'stroke-width': 1.6, fill: 'none' }, g);
  }
}

function drawNote(g, x, note, sig, shownAcc) {
  const step = diatonicStep(note);
  const ny = y(step);
  ledgerSteps(step).forEach(s => el('line', { x1: x - 13, x2: x + 13, y1: y(s), y2: y(s), class: 'st-line' }, g));
  const acc = shownAcc !== undefined ? shownAcc : accidentalToShow(note, sig);
  if (acc) text(g, x - 23, ny + 5, ACC_GLYPH[acc], { class: 'st-acc-note' });
  const hollow = note.dur === 'h' || note.dur === 'w';
  el('ellipse', { cx: x, cy: ny, rx: HEAD_RX, ry: 6, transform: `rotate(-20 ${x} ${ny})`, class: hollow ? 'st-head-hollow' : 'st-fill' }, g);
  if (note.accent) text(g, x - 7, BOTTOM_Y - HALF * 10, '>', { class: 'st-accent' });
  for (let d = 0; d < (note.dots || (note.dotted ? 1 : 0)); d++) el('circle', { cx: x + 13 + d * 6, cy: (step - base) % 2 === 0 ? ny - 4 : ny, r: 2.2, class: 'st-fill' }, g);
  if (note.tuplet && note.tupletFirst) text(g, x - 4, BOTTOM_Y - HALF * 12, String(note.tuplet), { class: 'st-tuplet' });
  if (note.dur === 'w') return;
  const up = step < base + 4; // a partir de la línea central la plica va hacia abajo
  const sx = up ? x + 7.3 : x - 7.3;
  const tip = up ? ny - 42 : ny + 42;
  el('line', { x1: sx, x2: sx, y1: ny, y2: tip, class: 'st-stroke', 'stroke-width': 1.7 }, g);
  const flags = note.dur === 'e' ? 1 : note.dur === 's' ? 2 : note.dur === 't' ? 3 : 0;
  for (let i = 0; i < flags; i++) {
    const fy = tip + (up ? i * 8 : -i * 8);
    const d = up ? `M${sx} ${fy} q2 10 10 16 q-4 -8 -10 -10` : `M${sx} ${fy} q2 -10 10 -16 q-4 8 -10 10`;
    el('path', { d, class: 'st-fill' }, g);
  }
}

let staffCount = 0;

export function createStaff(svg) {
  const clipId = 'stClip' + (++staffCount);
  let notes = [];
  let beatPx = 56;
  let startX = 0;
  let noteGroups = [];
  let scroller = null;
  let playhead = null;
  let highlight = null;
  let highlightLines = null;
  let tempoMode = false;

  const xOfBeat = beat => startX + NOTE_PAD + beat * beatPx;

  // mode: learn (nota resaltada), tempo (línea de lectura y duración de cada nota) o review (partitura entera, sin desplazamiento)
  // clef: 'treble', 'bass' o 'perc'; sticking: letras de mano (D/I) para cada nota que suena, en orden
  function render(score, { key = 'C', time = 4, mode = 'learn', clef = 'treble', sticking = null } = {}) {
    svg.replaceChildren();
    notes = score.notes;
    base = BASE[clef] || E4;
    const minBeats = Math.min(1, ...notes.map(n => n.beats));
    beatPx = Math.max(48, 28 / minBeats);
    const fixed = el('g', {}, svg);
    startX = drawPrefix(fixed, key, time, clef);
    const width = mode === 'review' ? xOfBeat(score.totalBeats) + 16 : WIDTH;
    svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
    if (mode === 'review') svg.setAttribute('width', Math.round(width * 0.75));
    else svg.removeAttribute('width');
    fixed.querySelectorAll('.st-line').forEach(l => l.setAttribute('x2', width));
    el('clipPath', { id: clipId }, svg).appendChild(el('rect', { x: startX, y: 0, width: width - startX, height: HEIGHT }));
    const clip = el('g', { 'clip-path': `url(#${clipId})` }, svg);
    scroller = el('g', { class: 'st-scroll' }, clip);
    highlight = el('rect', { x: 0, y: 14, width: 44, height: HEIGHT - 28, rx: 12, class: 'st-highlight' }, scroller);
    // las líneas del pentagrama se siguen viendo dentro del resaltado, en un tono más oscuro
    highlightLines = el('g', { class: 'st-highlight-lines' }, scroller);
    for (let i = 0; i < 5; i++) el('line', { x1: 0, x2: 44, y1: BOTTOM_Y - i * HALF * 2, y2: BOTTOM_Y - i * HALF * 2 }, highlightLines);
    const sig = keySignature(key);
    score.bars.slice(0, -1).forEach(b => {
      const bx = xOfBeat(b.start + b.beats) - Math.min(16, beatPx * 0.35);
      el('line', { x1: bx, x2: bx, y1: BOTTOM_Y - HALF * 8, y2: BOTTOM_Y, class: 'st-line' }, scroller);
    });
    const endX = xOfBeat(score.totalBeats) - 8;
    el('line', { x1: endX, x2: endX, y1: BOTTOM_Y - HALF * 8, y2: BOTTOM_Y, class: 'st-line' }, scroller);
    el('rect', { x: endX + 3, y: BOTTOM_Y - HALF * 8, width: 4, height: HALF * 8, class: 'st-fill' }, scroller);
    let playIndex = 0;
    let shownClef = clef;
    let shownMeter = null;
    const firstOf = new Set();
    // las alteraciones valen hasta el final del compás (y la nota ligada no la repite)
    let barMem = {};
    let memBar = -1;
    noteGroups = notes.map((n, i) => {
      if (n.bar !== memBar) { memBar = n.bar; barMem = {}; }
      // cambios de clave, compás y armadura dentro de la partitura (libro de lecturas)
      base = BASE[n.clef || clef] || E4;
      if (n.clef && n.clef !== shownClef && CLEF_MARK[n.clef]) { text(scroller, xOfBeat(n.start) - 30, BOTTOM_Y - HALF * 9, CLEF_MARK[n.clef], { class: 'st-tuplet' }); shownClef = n.clef; }
      const meter = n.marks && n.marks.meter && n.marks.meter[0];
      if (meter && i > 0 && meter.join('/') !== shownMeter) text(scroller, xOfBeat(n.start) - 30, BOTTOM_Y - HALF * 11, meter.join('/'), { class: 'st-tuplet' });
      if (meter) shownMeter = meter.join('/');
      if (n.tupletId && !firstOf.has(n.tupletId)) { firstOf.add(n.tupletId); n = { ...n, tupletFirst: true }; }
      const sigHere = n.key ? keySignature(n.key) : sig;
      const g = el('g', { class: 'st-note future' }, scroller);
      if (mode === 'tempo' && !n.rest) {
        // cola con la duración: la nota sigue visible bajo la línea mientras dura
        el('rect', { x: xOfBeat(n.start), y: y(diatonicStep(n)) - 4, width: Math.max(4, n.beats * beatPx - 10), height: 8, rx: 4, class: 'st-tail' }, g);
      }
      if (n.rest) drawRest(g, xOfBeat(n.start), n);
      else {
        const id = n.letter + n.oct;
        const expected = id in barMem ? barMem[id] : (sigHere[n.letter] || 0);
        const tiedIn = i > 0 && notes[i - 1].tie && !notes[i - 1].rest;
        const shown = n.acc === expected || tiedIn ? null : n.acc === 0 ? 'natural' : n.acc > 0 ? 'sharp' : 'flat';
        barMem[id] = n.acc;
        drawNote(g, xOfBeat(n.start), n, sigHere, shown);
        // ligadura de prolongación hacia la nota siguiente
        const next = notes[i + 1];
        if (n.tie && next && !next.rest) {
          const ny = y(diatonicStep(n)) + 9;
          const x1 = xOfBeat(n.start) + 8;
          const x2 = xOfBeat(next.start) - 8;
          el('path', { d: `M${x1} ${ny} Q${(x1 + x2) / 2} ${ny + 9} ${x2} ${ny} Q${(x1 + x2) / 2} ${ny + 6} ${x1} ${ny}Z`, class: 'st-fill' }, g);
        }
      }
      if (!n.rest && sticking) {
        const hand = sticking[playIndex++];
        if (hand) text(g, xOfBeat(n.start) - 5, BOTTOM_Y + 34, hand, { class: 'st-stick' });
      }
      return g;
    });
    base = BASE[clef] || E4;
    // A tempo la línea de lectura queda fija justo después de la clave y la partitura pasa por debajo:
    // cada nota suena cuando el borde izquierdo de su cabeza toca la línea
    tempoMode = mode === 'tempo';
    const lineX = startX + NOTE_PAD - HEAD_RX;
    playhead = el('rect', { x: lineX - 2, y: 16, width: 4, height: HEIGHT - 32, rx: 2, class: 'st-playhead' }, svg);
    playhead.style.display = tempoMode ? '' : 'none';
    highlight.style.display = mode === 'learn' ? '' : 'none';
    highlightLines.style.display = highlight.style.display;
  }

  // Desplaza la partitura para que el pulso indicado quede bajo el foco
  function scrollTo(beat, smooth = true) {
    // a tempo: el pulso actual siempre bajo la línea fija (también al principio, sin topes);
    // aprendiendo: la nota actual en el foco, dejando ver la anterior
    const shift = tempoMode ? -beat * beatPx : Math.min(0, FOCUS_X - 10 - xOfBeat(beat));
    scroller.style.transition = smooth ? 'transform .3s ease' : 'none';
    scroller.style.transform = `translateX(${shift}px)`;
  }

  function setState(index, state) {
    if (noteGroups[index]) noteGroups[index].setAttribute('class', 'st-note ' + state);
  }

  function focus(index) {
    const n = notes[index];
    if (!n) return;
    highlight.setAttribute('x', xOfBeat(n.start) - 22);
    highlightLines.setAttribute('transform', `translate(${xOfBeat(n.start) - 22} 0)`);
    noteGroups.forEach((g, i) => {
      const cls = g.getAttribute('class');
      if (i === index) g.setAttribute('class', 'st-note current');
      else if (cls.includes('current')) g.setAttribute('class', 'st-note future');
    });
    scrollTo(n.start);
  }

  return { render, scrollTo, setState, focus };
}
