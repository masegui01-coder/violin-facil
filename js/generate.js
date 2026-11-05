// Ejercicios generados: escalas y arpegios en las 12 tonalidades y lectura a primera vista infinita.
// Todo en notas escritas y dentro del registro del instrumento.
import { parseNote } from './music.js';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const MINOR = [0, 2, 3, 5, 7, 8, 10];
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
export function scaleNames(tonic, steps) {
  const l0 = LETTERS.indexOf(tonic[0]);
  const pc0 = LETTER_PC[tonic[0]] + (tonic.includes('#') ? 1 : tonic.includes('b') ? -1 : 0);
  return steps.map((st, i) => {
    const letter = LETTERS[(l0 + i) % 7];
    let acc = ((pc0 + st - LETTER_PC[letter]) % 12 + 12) % 12;
    if (acc > 6) acc -= 12;
    return { letter, acc };
  });
}

// Tonalidad mayor (nombre de MAJOR_KEYS) de una tónica dada en midi
export const majorKeyOf = midi => MAJOR_KEYS.find(k => ((LETTER_PC[k[0]] + (k.includes('#') ? 1 : k.includes('b') ? -1 : 0)) % 12 + 12) % 12 === ((midi % 12) + 12) % 12);

// Ortografía de una nota a «degree» grados (letras) de la tónica: la 3.ª menor de Si♭ es Re♭, no Do♯.
// Devuelve { letter, acc, oct, midi } como spell() de music.js
export function spellFromTonic(tonicMidi, midi, degree) {
  const key = majorKeyOf(tonicMidi);
  const letter = LETTERS[(LETTERS.indexOf(key[0]) + degree) % 7];
  let acc = ((midi - LETTER_PC[letter]) % 12 + 12) % 12;
  if (acc > 6) acc -= 12;
  return { letter, acc, oct: Math.floor((midi - acc - LETTER_PC[letter]) / 12) - 1, midi };
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
export function fit(tonic, steps, degrees, inst) {
  const center = (inst.written[0] + inst.written[1]) / 2 - 4;
  const options = [2, 3, 4, 5, 6].map(o => scaleFrom(tonic, steps, o, degrees))
    .filter(ns => ns.every(n => { const m = midiOf(n); return m >= inst.written[0] && m <= inst.written[1]; }));
  if (!options.length) return null;
  return options.reduce((a, b) => (Math.abs(midiOf(b[0]) + 6 - center) < Math.abs(midiOf(a[0]) + 6 - center) ? b : a));
}

export function bars(tokens, time) {
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

// Ejercicio de técnica como canción de la app, en corcheas (e), negras (q) o blancas (h); la última nota
// se alarga hasta completar el compás. null si no cabe en el registro.
const FIGURE_BEATS = { e: 0.5, q: 1, h: 2 };
export function technique(kind, key, inst, bpm, figure = 'e') {
  const ex = EXERCISES[kind];
  // «Am»: la escala menor natural de La (curso de Lenguaje Musical, Nivel 1)
  const minor = key.endsWith('m');
  const names = fit(minor ? key.slice(0, -1) : key, minor ? MINOR : MAJOR, ex.degrees, inst);
  if (!names) return null;
  const beats = FIGURE_BEATS[figure];
  const tokens = names.slice(0, -1).map(n => ({ tok: n + figure, beats }));
  const used = tokens.length * beats;
  let last = 4 - (used % 4);
  if (last < 1) last += 4;
  tokens.push({ tok: names[names.length - 1] + DUR[last], beats: last });
  return {
    id: `gym-${kind}-${key}${figure === 'e' ? '' : '-' + figure}`, title: `${ex.name} de ${keyLabel(key)}`, by: 'Gimnasio de técnica', style: null, difficulty: 2,
    key, time: 4, bpm, score: bars(tokens, 4),
  };
}

// Notas de una escala (una octava, en el registro del instrumento) para las lecturas rítmicas:
// mayor, menor natural, pentatónica mayor o una sola nota
const PENTA = [0, 1, 2, 4, 5, 7];
export function scaleNotes(tonic, kind, inst) {
  const steps = kind === 'minor' ? MINOR : MAJOR;
  const names = fit(tonic, steps, [0, 1, 2, 3, 4, 5, 6, 7], inst);
  if (!names) return null;
  if (kind === 'single') return [names[0]];
  return kind === 'pentatonic' ? PENTA.map(i => names[i]) : names;
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
export const DUR = { 4: 'w', 3: 'h.', 2: 'h', 1.5: 'q.', 1: 'q', 0.75: 'e.', 0.5: 'e', 0.25: 's' };
const NEAR_KEYS = { C: ['F', 'G', 'Bb', 'D'], F: ['C', 'Bb', 'G', 'Eb'], G: ['C', 'D', 'F', 'A'], Bb: ['F', 'Eb', 'C', 'G'], D: ['G', 'A', 'C', 'E'] };

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

// Grados que abarca cada nivel (0 = tónica) y registro cómodo: el del instrumento o la hora y media más grave
const SIGHT_SPAN = { 1: [-1, 5], 2: [-2, 7], 3: [-2, 9] };
const OCTAVE = [0, 1, 2, 3, 4, 5, 6, 7];
const COMFORT_SPAN = 21;
// El piano lee alrededor del Do central (su registro escrito empieza muy abajo); el ukelele, en los primeros trastes
// (como mucho el Sol del traste 10 de la cuerda La)
const SIGHT_COMFORT = { piano: [55, 79], ukulele: [60, 79] };
export const comfortRange = inst => inst.comfort || SIGHT_COMFORT[inst.id] || [inst.written[0], Math.min(inst.written[1], inst.written[0] + COMFORT_SPAN)];

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
  // Ámbito según el nivel y dentro del registro cómodo del instrumento (sin agudos ni posiciones altas al empezar)
  const [lo, hi] = SIGHT_SPAN[level];
  const degrees = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => i + a);
  const comfy = { ...inst, written: comfortRange(inst) };
  // Si el ámbito no cabe en el registro cómodo, se estrecha antes de salir de él
  // (primero sin los grados por debajo de la tónica: mejor eso que subir una octava entera)
  const spans = [degrees(lo, hi), degrees(0, hi), degrees(Math.max(lo, -1), Math.min(hi, 7)), OCTAVE, degrees(0, 5)];
  const placed = [comfy, inst].flatMap(where => spans.map(degs => ({ degs, where })))
    .map(({ degs, where }) => ({ degs, notes: fit(tonicName, steps, degs, where) })).find(x => x.notes);
  const all = placed.notes;
  const lowDeg = placed.degs[0];
  const highDeg = lowDeg + all.length - 1;
  const BARS = 8;
  const rhythms = Array.from({ length: BARS }, (_, b) => (b === BARS - 1 ? [time] : pickRhythmBar(r, level, time)));
  const pitched = rhythms.flat().filter(x => typeof x !== 'string').length;
  // Se termina en la tónica (la de abajo o la de arriba, la más cercana) llegando por grados: nunca un salto final
  const tonics = [0, 7].filter(d => d >= lowDeg && d <= highDeg);
  let deg = 0;
  let played = 0;
  const tokens = [];
  rhythms.forEach(rhythm => rhythm.forEach(x => {
    if (typeof x === 'string') { tokens.push({ tok: 'R' + DUR[Number(x.slice(1))], beats: Number(x.slice(1)) }); return; }
    const left = pitched - played - 1; // notas que quedan después de esta
    if (played) {
      const leap = r() < 0.25 ? cfg.leap : 1;
      let next = Math.max(lowDeg, Math.min(highDeg, deg + (r() < 0.5 ? -1 : 1) * leap));
      const home = tonics.reduce((a, b) => (Math.abs(b - next) < Math.abs(a - next) ? b : a));
      if (Math.abs(next - home) > left) {
        const goal = tonics.reduce((a, b) => (Math.abs(b - deg) < Math.abs(a - deg) ? b : a));
        next = deg + Math.sign(goal - deg);
      }
      deg = next;
    }
    played++;
    tokens.push({ tok: all[deg - lowDeg] + DUR[x], beats: x });
  }));
  const label = minor ? keyLabel(tonicName + 'm') : keyLabel(key);
  return {
    id: `sight-${level}-${seed}`, title: `Primera vista n.º ${seed % 1000}`, by: `Nivel ${level} · ${label}`, style: null, difficulty: level,
    key: minor ? (tonicName + 'm') : key, time, bpm: [0, 72, 80, 88][level], score: bars(tokens, time),
  };
}

// ---------- Lectura rítmica (percusión) ----------
const RHYTHM_CELLS = {
  1: [['q'], ['h'], ['q', 'q'], ['w']],
  2: [['e', 'e'], ['q.', 'e'], ['Rq'], ['q'], ['e', 'e', 'q'], ['h']],
  3: [['s', 's', 's', 's'], ['e', 's', 's'], ['s', 's', 'e'], ['e.', 's'], ['Re', 'e'], ['e', 'q', 'e'], ['q']],
};
const CELL_BEATS = { w: 4, h: 2, 'q.': 1.5, q: 1, 'e.': 0.75, e: 0.5, s: 0.25, Rq: 1, Re: 0.5 };

export function rhythmReading(level, seed) {
  const r = rng(seed);
  const time = level === 3 ? [4, 3, 2][Math.floor(r() * 3)] : 4;
  const BARS = 8;
  const bars = [];
  const sticking = [];
  for (let b = 0; b < BARS; b++) {
    const tokens = [];
    let left = time;
    if (b === BARS - 1) {
      tokens.push(time === 4 ? 'C5w' : time === 3 ? 'C5h.' : 'C5h');
      sticking.push('D');
    } else {
      for (let guard = 0; left > 0 && guard < 30; guard++) {
        const cells = RHYTHM_CELLS[level].filter(c => c.reduce((s, d) => s + CELL_BEATS[d], 0) <= left);
        const cell = cells.length ? cells[Math.floor(r() * cells.length)] : ['q'];
        cell.forEach(d => {
          if (d.startsWith('R')) tokens.push('R' + d.slice(1));
          else { tokens.push('C5' + d); sticking.push(sticking.length % 2 ? 'I' : 'D'); }
        });
        left -= cell.reduce((s, d) => s + CELL_BEATS[d], 0);
      }
    }
    bars.push(tokens.join(' '));
  }
  return {
    id: `rhythm-${level}-${seed}`, title: `Lectura rítmica n.º ${seed % 1000}`, by: `Nivel ${level}`, style: null, difficulty: level,
    key: 'C', time, bpm: [0, 70, 76, 80][level], score: '| ' + bars.join(' | ') + ' |', sticking,
  };
}
