// Pentagrama para escribir: tocas una línea o un espacio y aparece la nota (redonda). Con clave de sol o de fa
// y la armadura del instrumento, así la nota escrita ya lleva su alteración. Opcionalmente muestra una nota de
// referencia (dictado). Devuelve la nota escrita como «C4».
import { parseNote, diatonicStep, keyCount } from './music.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 300;
const H = 170;
const HALF = 8;
const BOTTOM = 112;
const BASE = { treble: 30, bass: 18 };      // escalón de la línea inferior: Mi4 en sol, Sol2 en fa
const BELOW = 6;                              // hasta tres líneas adicionales por debajo
const ABOVE = 14;                             // y por encima
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SHARP_STEPS = [38, 35, 39, 36, 33, 37, 34];
const FLAT_STEPS = [34, 37, 33, 36, 32, 35, 31];
const BASS_SIG_SHIFT = 14;
const REF_X = 170;
const NOTE_X = 235;

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  if (parent) parent.appendChild(n);
  return n;
}

export const stepToNote = step => LETTERS[((step % 7) + 7) % 7] + Math.floor(step / 7);

export function createWriter(svg, { clef = 'treble', key = 'C', reference = null, onChange = () => {} } = {}) {
  const base = BASE[clef] ?? BASE.treble;
  const y = step => BOTTOM - (step - base) * HALF;
  let step = null;
  let locked = false;
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('writer');
  for (let i = 0; i < 5; i++) el('line', { x1: 0, x2: W, y1: BOTTOM - i * HALF * 2, y2: BOTTOM - i * HALF * 2, class: 'st-line' }, svg);
  const clefText = el('text', clef === 'bass' ? { x: 6, y: BOTTOM - HALF * 2 + 2, class: 'st-clef bass' } : { x: 4, y: BOTTOM + 9, class: 'st-clef' }, svg);
  clefText.textContent = clef === 'bass' ? '𝄢' : '𝄞';
  const n = keyCount(key);
  const shift = clef === 'bass' ? BASS_SIG_SHIFT : 0;
  (n >= 0 ? SHARP_STEPS.slice(0, n) : FLAT_STEPS.slice(0, -n)).forEach((s, i) => {
    const t = el('text', { x: 46 + i * 10, y: y(s - shift) + (n >= 0 ? 5 : 3), class: 'st-acc' }, svg);
    t.textContent = n >= 0 ? '♯' : '♭';
  });
  const layer = el('g', {}, svg);

  function drawNote(st, x, cls) {
    const g = el('g', { class: cls }, layer);
    for (let s = base - 2; s >= st; s -= 2) el('line', { x1: x - 15, x2: x + 15, y1: y(s), y2: y(s), class: 'st-line' }, g);
    for (let s = base + 10; s <= st; s += 2) el('line', { x1: x - 15, x2: x + 15, y1: y(s), y2: y(s), class: 'st-line' }, g);
    el('ellipse', { cx: x, cy: y(st), rx: 9, ry: 6.5, transform: `rotate(-20 ${x} ${y(st)})`, class: 'wr-head' }, g);
    return g;
  }

  let ghost = null;
  let mark = null;
  const refStep = reference ? diatonicStep(parseNote(reference)) : null;
  function redraw(extra = null) {
    layer.innerHTML = '';
    if (refStep !== null) drawNote(refStep, REF_X, 'wr-ref');
    if (extra) drawNote(extra.step, NOTE_X, extra.cls);
    if (step !== null) mark = drawNote(step, NOTE_X, 'wr-note' + (extra ? ' wr-shifted' : ''));
    if (ghost !== null && step === null && !locked) drawNote(ghost, NOTE_X, 'wr-ghost');
  }

  function stepAt(e) {
    const r = svg.getBoundingClientRect();
    const yy = (e.clientY - r.top) * (H / r.height);
    return Math.max(base - BELOW, Math.min(base + ABOVE, base + Math.round((BOTTOM - yy) / HALF)));
  }
  svg.addEventListener('pointermove', e => { if (locked || e.pointerType === 'touch') return; ghost = stepAt(e); redraw(); });
  svg.addEventListener('pointerleave', () => { ghost = null; if (!locked) redraw(); });
  svg.addEventListener('click', e => {
    if (locked) return;
    step = stepAt(e);
    redraw();
    onChange(stepToNote(step));
  });
  // Teclado: flechas para subir y bajar la nota
  svg.setAttribute('tabindex', '0');
  svg.addEventListener('keydown', e => {
    if (locked || !['ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    step = Math.max(base - BELOW, Math.min(base + ABOVE, (step ?? base + 4) + (e.key === 'ArrowUp' ? 1 : -1)));
    redraw();
    onChange(stepToNote(step));
  });
  redraw();

  return {
    value: () => (step === null ? null : stepToNote(step)),
    // Bloquea el pentagrama y pinta la respuesta: verde si está bien; si no, la tuya en rojo y la buena en verde
    reveal(target, ok) {
      locked = true;
      ghost = null;
      const targetStep = diatonicStep(parseNote(target));
      if (ok) { redraw(); if (mark) mark.setAttribute('class', 'wr-note right'); return; }
      layer.innerHTML = '';
      if (refStep !== null) drawNote(refStep, REF_X, 'wr-ref');
      if (step !== null) drawNote(step, NOTE_X - 30, 'wr-note wrong');
      drawNote(targetStep, NOTE_X + 20, 'wr-note right');
    },
  };
}
