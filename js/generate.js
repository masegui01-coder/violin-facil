// Ejercicios generados: escalas y arpegios en las 12 tonalidades y lectura a primera vista infinita.
// Todo en notas escritas y dentro del registro del instrumento.
import { parseNote } from './music.js';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const ACC = { '-1': 'b', 0: '', 1: '#' };

// Tonalidades mayores con su nombre en el formato de la app (como mucho 6 alteraciones)
export const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];
const KEY_NAME_EU = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };

export function keyLabel(key) {
  const letter = KEY_NAME_EU[key[0]];
  const acc = key.includes('#') ? '♯' : key.includes('b') ? '♭' : '';
  return `${letter}${acc} ${key.endsWith('m') ? 'menor' : 'mayor'}`;
}

// Nombres de las 7 notas de la escala, con la ortografía correcta (una letra por grado)
function scaleNames(tonic, steps) {
  const l0 = LETTERS.indexOf(tonic[0]);
  const pc0 = LETTER_PC[tonic[0]] + (tonic.includes('#') ? 1 : tonic.includes('b') ? -1 : 0);
  return steps.map((st, i) => {
    const letter = LETTERS[(l0 + i) % 7];
    let acc = ((pc0 + st - LETTER_PC[letter]) % 12 + 12) % 12;
    if (acc > 6) acc -= 12;
    return { letter, acc };
  });
}

// Notas de la escala desde una octava concreta (con el salto de octava al pasar de Si a Do)
function scaleFrom(tonic, steps, octave, degrees) {
  const names = scaleNames(tonic, steps);
  const l0 = LETTERS.indexOf(tonic[0]);
  return degrees.map(d => {
    const { letter, acc } = names[((d % 7) + 7) % 7];
    const oct = octave + Math.floor((l0 + d) / 7);
    return `${letter}${ACC[acc]}${oct}`;
  });
}

const midiOf = n => parseNote(n).midi;

// Elige la octava de la tónica para que todas las notas quepan; prefiere la más cercana al centro del registro
function fit(tonic, steps, degrees, inst) {
  const center = (inst.written[0] + inst.written[1]) / 2 - 4;
  const options = [2, 3, 4, 5, 6].map(o => scaleFrom(tonic, steps, o, degrees))
    .filter(ns => ns.every(n => { const m = midiOf(n); return m >= inst.written[0] && m <= inst.written[1]; }));
  if (!options.length) return null;
  return options.reduce((a, b) => (Math.abs(midiOf(b[0]) + 6 - center) < Math.abs(midiOf(a[0]) + 6 - center) ? b : a));
}

function bars(tokens, time) {
  const out = [];
  let acc = 0;
  let bar = [];
  tokens.forEach(t => {
    bar.push(t.tok);
    acc += t.beats;
    if (acc >= time) { out.push(bar.join(' ')); bar = []; acc = 0; }
  });
  if (bar.length) out.push(bar.join(' '));
  return '| ' + out.join(' | ') + ' |';
}

const EXERCISES = {
  scale: { name: 'Escala', degrees: [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0] },
  arpeggio: { name: 'Arpegio', degrees: [0, 2, 4, 7, 4, 2, 0] },
  thirds: { name: 'Terceras', degrees: [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 4, 2, 0] },
};
export const EXERCISE_IDS = Object.keys(EXERCISES);

// Ejercicio de técnica como canción de la app (corcheas, cierra con blanca). null si no cabe en el registro.
export function technique(kind, key, inst, bpm) {
  const ex = EXERCISES[kind];
  const names = fit(key, MAJOR, ex.degrees, inst);
  if (!names) return null;
  // corcheas y la última nota alargada hasta completar el compás
  const tokens = names.slice(0, -1).map(n => ({ tok: n + 'e', beats: 0.5 }));
  const used = tokens.length * 0.5;
  let last = 4 - (used % 4);
  if (last < 1) last += 4;
  tokens.push({ tok: names[names.length - 1] + DUR[last], beats: last });
  return {
    id: `gym-${kind}-${key}`, title: `${ex.name} de ${keyLabel(key)}`, by: 'Gimnasio de técnica', style: null, difficulty: 2,
    key, time: 4, bpm, score: bars(tokens, 4),
  };
}

// ---------- Lectura a primera vista ----------
// Generador pseudoaleatorio con semilla (mismo número, misma partitura)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEVELS = {
  1: { keys: 0, rhythms: [[2], [1, 1], [2], [1, 1, 2]], leap: 1, minor: false, time: [4] },
  2: { keys: 2, rhythms: [[1, 1], [0.5, 0.5, 1], [1.5, 0.5], [2], [1, 0.5, 0.5]], leap: 2, minor: false, time: [4, 3] },
  3: { keys: 4, rhythms: [[0.5, 0.5, 0.5, 0.5], [1.5, 0.5], [0.75, 0.25, 1], [1, 'r1'], [0.5, 0.5, 1], [2]], leap: 4, minor: true, time: [4, 3, 2] },
};
const DUR = { 4: 'w', 3: 'h.', 2: 'h', 1.5: 'q.', 1: 'q', 0.75: 'e.', 0.5: 'e', 0.25: 's' };
const NEAR_KEYS = { C: ['F', 'G', 'Bb', 'D'], G: ['C', 'D', 'F', 'A'], Bb: ['F', 'Eb', 'C', 'G'], D: ['G', 'A', 'C', 'E'] };

function pickRhythmBar(r, level, time) {
  const cells = LEVELS[level].rhythms;
  const out = [];
  let left = time;
  for (let guard = 0; left > 0 && guard < 20; guard++) {
    const cell = cells[Math.floor(r() * cells.length)];
    const len = cell.reduce((s, x) => s + (typeof x === 'string' ? Number(x.slice(1)) : x), 0);
    if (len <= left) { out.push(...cell); left -= len; }
  }
  while (left > 0) { const b = left >= 1 ? 1 : 0.5; out.push(b); left -= b; }
  return out;
}

export function sightReading(level, inst, seed) {
  const r = rng(seed);
  const cfg = LEVELS[level];
  const base = inst.bandKey;
  const pool = [base, ...(NEAR_KEYS[base] || []).slice(0, cfg.keys)];
  const key = pool[Math.floor(r() * pool.length)];
  const minor = cfg.minor && r() < 0.35;
  const steps = minor ? MINOR : MAJOR;
  const tonic = minor ? scaleNames(key, MAJOR)[5] : { letter: key[0], acc: key.includes('#') ? 1 : key.includes('b') ? -1 : 0 };
  const tonicName = tonic.letter + ACC[tonic.acc];
  const time = cfg.time[Math.floor(r() * cfg.time.length)];
  const degreesRange = [-2, 9];
  const all = fit(tonicName, steps, Array.from({ length: degreesRange[1] - degreesRange[0] + 1 }, (_, i) => i + degreesRange[0]), inst)
    || fit(tonicName, steps, [0, 1, 2, 3, 4, 5, 6, 7], inst);
  const lowDeg = all.length > 8 ? degreesRange[0] : 0;
  let deg = 0;
  const tokens = [];
  const BARS = 8;
  for (let b = 0; b < BARS; b++) {
    const rhythm = b === BARS - 1 ? [time] : pickRhythmBar(r, level, time);
    rhythm.forEach((x, i) => {
      if (typeof x === 'string') { tokens.push({ tok: 'R' + DUR[Number(x.slice(1))], beats: Number(x.slice(1)) }); return; }
      const last = b === BARS - 1;
      if (last) deg = 0;
      else if (tokens.length) {
        const leap = r() < 0.25 ? cfg.leap : 1;
        deg += (r() < 0.5 ? -1 : 1) * leap;
        deg = Math.max(lowDeg, Math.min(lowDeg + all.length - 1, deg));
      }
      const name = all[deg - lowDeg];
      tokens.push({ tok: name + DUR[x], beats: x });
    });
  }
  const label = minor ? keyLabel(tonicName + 'm') : keyLabel(key);
  return {
    id: `sight-${level}-${seed}`, title: `Primera vista n.º ${seed % 1000}`, by: `Nivel ${level} · ${label}`, style: null, difficulty: level,
    key: minor ? (tonicName + 'm') : key, time, bpm: [0, 72, 80, 88][level], score: bars(tokens, time),
  };
}
