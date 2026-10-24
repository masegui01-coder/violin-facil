// Pentagrama en SVG: clave de sol, armadura, compás, figuras, silencios y barras. Se desplaza con la lección.
import { diatonicStep, keySignature, keyCount, accidentalToShow } from './music.js';

const NS = 'http://www.w3.org/2000/svg';
const WIDTH = 440;
const HEIGHT = 200;
const BOTTOM_Y = 130;          // línea inferior (Mi4)
const HALF = 7;                // medio espacio entre líneas
const E4 = 4 * 7 + 2;
const B4 = E4 + 4;             // a partir del Si4 la plica va hacia abajo
const FOCUS_X = 190;           // donde queda la nota actual (deja ver las siguientes y la que suena)
const NOTE_PAD = 26;
const SHARP_STEPS = [38, 35, 39, 36, 33, 37, 34];
const FLAT_STEPS = [34, 37, 33, 36, 32, 35, 31];
const ACC_GLYPH = { sharp: '♯', flat: '♭', natural: '♮' };

const y = step => BOTTOM_Y - (step - E4) * HALF;

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
  for (let s = E4 - 2; s >= step; s -= 2) out.push(s);
  for (let s = E4 + 10; s <= step; s += 2) out.push(s);
  return out;
}

function drawPrefix(g, key, time) {
  for (let i = 0; i < 5; i++) {
    const ly = BOTTOM_Y - i * HALF * 2;
    el('line', { x1: 0, x2: WIDTH, y1: ly, y2: ly, class: 'st-line' }, g);
  }
  text(g, 4, BOTTOM_Y + 9, '𝄞', { class: 'st-clef' });
  const n = keyCount(key);
  const steps = n >= 0 ? SHARP_STEPS.slice(0, n) : FLAT_STEPS.slice(0, -n);
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

function drawNote(g, x, note, sig) {
  const step = diatonicStep(note);
  const ny = y(step);
  ledgerSteps(step).forEach(s => el('line', { x1: x - 13, x2: x + 13, y1: y(s), y2: y(s), class: 'st-line' }, g));
  const acc = accidentalToShow(note, sig);
  if (acc) text(g, x - 23, ny + 5, ACC_GLYPH[acc], { class: 'st-acc-note' });
  const hollow = note.dur === 'h' || note.dur === 'w';
  el('ellipse', { cx: x, cy: ny, rx: 8, ry: 6, transform: `rotate(-20 ${x} ${ny})`, class: hollow ? 'st-head-hollow' : 'st-fill' }, g);
  if (note.dotted) el('circle', { cx: x + 13, cy: (step - E4) % 2 === 0 ? ny - 4 : ny, r: 2.2, class: 'st-fill' }, g);
  if (note.dur === 'w') return;
  const up = step < B4;
  const sx = up ? x + 7.3 : x - 7.3;
  const tip = up ? ny - 42 : ny + 42;
  el('line', { x1: sx, x2: sx, y1: ny, y2: tip, class: 'st-stroke', 'stroke-width': 1.7 }, g);
  const flags = note.dur === 'e' ? 1 : note.dur === 's' ? 2 : 0;
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

  const xOfBeat = beat => startX + NOTE_PAD + beat * beatPx;

  // mode: learn (nota resaltada), tempo (línea de lectura y duración de cada nota) o review (partitura entera, sin desplazamiento)
  function render(score, { key = 'C', time = 4, mode = 'learn' } = {}) {
    svg.replaceChildren();
    notes = score.notes;
    const minBeats = Math.min(1, ...notes.map(n => n.beats));
    beatPx = Math.max(48, 28 / minBeats);
    const fixed = el('g', {}, svg);
    startX = drawPrefix(fixed, key, time);
    const width = mode === 'review' ? xOfBeat(score.totalBeats) + 16 : WIDTH;
    svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
    if (mode === 'review') svg.setAttribute('width', Math.round(width * 0.75));
    else svg.removeAttribute('width');
    fixed.querySelectorAll('.st-line').forEach(l => l.setAttribute('x2', width));
    el('clipPath', { id: clipId }, svg).appendChild(el('rect', { x: startX, y: 0, width: width - startX, height: HEIGHT }));
    const clip = el('g', { 'clip-path': `url(#${clipId})` }, svg);
    scroller = el('g', { class: 'st-scroll' }, clip);
    highlight = el('rect', { x: 0, y: 14, width: 44, height: HEIGHT - 28, rx: 12, class: 'st-highlight' }, scroller);
    const sig = keySignature(key);
    score.bars.slice(0, -1).forEach(b => {
      const bx = xOfBeat(b.start + b.beats) - Math.min(16, beatPx * 0.35);
      el('line', { x1: bx, x2: bx, y1: BOTTOM_Y - HALF * 8, y2: BOTTOM_Y, class: 'st-line' }, scroller);
    });
    const endX = xOfBeat(score.totalBeats) - 8;
    el('line', { x1: endX, x2: endX, y1: BOTTOM_Y - HALF * 8, y2: BOTTOM_Y, class: 'st-line' }, scroller);
    el('rect', { x: endX + 3, y: BOTTOM_Y - HALF * 8, width: 4, height: HALF * 8, class: 'st-fill' }, scroller);
    noteGroups = notes.map(n => {
      const g = el('g', { class: 'st-note future' }, scroller);
      if (mode === 'tempo' && !n.rest) {
        // cola con la duración: la nota sigue visible bajo la línea mientras dura
        el('rect', { x: xOfBeat(n.start), y: y(diatonicStep(n)) - 4, width: Math.max(4, n.beats * beatPx - 10), height: 8, rx: 4, class: 'st-tail' }, g);
      }
      if (n.rest) drawRest(g, xOfBeat(n.start), n);
      else drawNote(g, xOfBeat(n.start), n, sig);
      return g;
    });
    playhead = el('line', { x1: FOCUS_X - 10, x2: FOCUS_X - 10, y1: 16, y2: HEIGHT - 16, class: 'st-playhead' }, svg);
    playhead.style.display = mode === 'tempo' ? '' : 'none';
    highlight.style.display = mode === 'learn' ? '' : 'none';
  }

  // Desplaza la partitura para que el pulso indicado quede bajo el foco
  function scrollTo(beat, smooth = true) {
    const shift = Math.min(0, FOCUS_X - 10 - xOfBeat(beat));
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
    noteGroups.forEach((g, i) => {
      const cls = g.getAttribute('class');
      if (i === index) g.setAttribute('class', 'st-note current');
      else if (cls.includes('current')) g.setAttribute('class', 'st-note future');
    });
    scrollTo(n.start);
  }

  return { render, scrollTo, setState, focus };
}
