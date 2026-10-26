// Libro de lecturas rítmicas (beta para testers pro): ejercicios progresivos para leer figuras y silencios
// sobre las notas de una escala, sin que la afinación sea el reto. Tú eliges compases, figuras, dificultad y escala.
import { rng, scaleNotes, keyLabel } from './generate.js';

// Figuras que se pueden elegir (en negras)
export const VALUES = [
  { id: 'w', beats: 4, name: 'Redonda' },
  { id: 'h.', beats: 3, name: 'Blanca con puntillo' },
  { id: 'h', beats: 2, name: 'Blanca' },
  { id: 'q.', beats: 1.5, name: 'Negra con puntillo' },
  { id: 'q', beats: 1, name: 'Negra' },
  { id: 'e', beats: 0.5, name: 'Corchea' },
  { id: 'e.', beats: 0.75, name: 'Corchea con puntillo' },
  { id: 's', beats: 0.25, name: 'Semicorchea' },
];
export const SCALE_KINDS = [['major', 'Mayor'], ['minor', 'Menor natural'], ['pentatonic', 'Pentatónica'], ['single', 'Una sola nota']];
export const MAX_DIFFICULTY = 5;
const REST_DUR = { 4: 'w', 2: 'h', 1: 'q', 0.5: 'e', 0.25: 's' };

// Células rítmicas de un pulso o más (en negras). Solo se usan si todas sus figuras están elegidas.
// level: dificultad a partir de la que aparecen; weight: lo habituales que son
const CELLS = [
  { figs: ['w'], beats: 4, level: 1, weight: 2, onBeat: [0] },
  { figs: ['h.'], beats: 3, level: 1, weight: 2, onBeat: [0] },
  { figs: ['h'], beats: 2, level: 1, weight: 3, onBeat: [0, 2] },
  { figs: ['q'], beats: 1, level: 1, weight: 5 },
  { figs: ['e', 'e'], beats: 1, level: 1, weight: 4 },
  { figs: ['q.', 'e'], beats: 2, level: 2, weight: 3 },
  { figs: ['s', 's', 's', 's'], beats: 1, level: 2, weight: 3 },
  { figs: ['e', 's', 's'], beats: 1, level: 3, weight: 3 },
  { figs: ['s', 's', 'e'], beats: 1, level: 3, weight: 3 },
  { figs: ['e.', 's'], beats: 1, level: 3, weight: 3 },
  { figs: ['e', 'q', 'e'], beats: 2, level: 4, weight: 2 }, // síncopa
  { figs: ['s', 'e', 's'], beats: 1, level: 5, weight: 2 }, // síncopa de semicorcheas
];
const BEATS = Object.fromEntries(VALUES.map(v => [v.id, v.beats]));

export function cellsFor(values, difficulty, time) {
  const allowed = new Set(values);
  return CELLS.filter(c => c.level <= difficulty && c.beats <= time && c.figs.every(f => allowed.has(f)));
}

// Un compás de células: las largas solo empiezan en partes fuertes; con más dificultad, más figuras cortas
function fillBar(r, cells, time, difficulty) {
  const out = [];
  let pos = 0;
  for (let guard = 0; pos < time - 1e-6 && guard < 40; guard++) {
    // todas las células ocupan pulsos enteros: siempre se empieza en un pulso
    const usable = cells.filter(c => c.beats <= time - pos + 1e-6 && (!c.onBeat || c.onBeat.includes(pos)));
    if (!usable.length) { out.push(...restFill(time - pos)); break; }
    const weights = usable.map(c => c.weight * (c.beats >= 2 ? Math.max(0.3, 1.6 - difficulty * 0.3) : 1 + (difficulty - 1) * 0.15 * (c.figs.length - 1)));
    let pick = r() * weights.reduce((s, w) => s + w, 0);
    let cell = usable[0];
    for (let i = 0; i < usable.length; i++) { pick -= weights[i]; if (pick <= 0) { cell = usable[i]; break; } }
    cell.figs.forEach(f => out.push({ fig: f, beats: BEATS[f] }));
    pos += cell.beats;
  }
  return out;
}

// Si no cabe ninguna figura elegida, se completa con silencios
function restFill(beats) {
  const out = [];
  let left = beats;
  [4, 2, 1, 0.5, 0.25].forEach(b => { while (left >= b - 1e-6) { out.push({ fig: REST_DUR[b], beats: b, rest: true }); left -= b; } });
  return out;
}

// Ejercicio: { title, key, time, bpm, score } listo para tocar como una canción de la app
export function generateReading({ inst, bars = 8, time = 4, values = ['q', 'e', 'h'], difficulty = 2, rests = true, tonic = 'C', scale = 'major', bpm = 72, seed = 1, title = 'Lectura rítmica' }) {
  const r = rng(seed);
  const notes = scaleNotes(tonic, scale, inst) || scaleNotes('C', 'major', inst) || ['C5'];
  const cells = cellsFor(values, difficulty, time);
  const safeCells = cells.length ? cells : cellsFor(['q'], 1, time);
  const restChance = rests ? 0.04 + difficulty * 0.03 : 0;
  const accentChance = difficulty >= 5 ? 0.12 : 0;
  let idx = 0;
  const tokens = [];
  for (let b = 0; b < bars; b++) {
    const last = b === bars - 1;
    const figs = last && values.includes(time === 3 ? 'h.' : 'w') && time >= 3 ? [{ fig: time === 3 ? 'h.' : 'w', beats: time }] : fillBar(r, safeCells, time, difficulty);
    const bar = figs.map((f, i) => {
      const restable = REST_DUR[f.beats] && !(last && i === figs.length - 1) && !(b === 0 && i === 0);
      if (f.rest || (restable && r() < restChance)) return `R${REST_DUR[f.beats] || f.fig}`;
      // la melodía camina por la escala (grados vecinos) y acaba en la tónica
      if (last && i === figs.length - 1) idx = 0;
      else if (notes.length > 1) {
        const leap = difficulty >= 4 && r() < 0.2 ? 2 : 1;
        idx = Math.max(0, Math.min(notes.length - 1, idx + (r() < 0.5 ? -leap : leap)));
      }
      return `${notes[idx]}${f.fig}${r() < accentChance ? '>' : ''}`;
    });
    tokens.push(bar.join(' '));
  }
  const key = scale === 'minor' ? `${tonic}m` : tonic;
  return { title, by: `${keyLabel(scale === 'minor' ? tonic + 'm' : tonic)} · ${time}/4 · dificultad ${difficulty}`, key, time, bpm, score: '| ' + tokens.join(' | ') + ' |' };
}

// Libro: lecturas progresivas. Empieza con las figuras más largas elegidas y va sumando las cortas y la dificultad.
export function generateBook(opts, count = 12) {
  const chosen = VALUES.filter(v => opts.values.includes(v.id)).sort((a, b) => b.beats - a.beats).map(v => v.id);
  return Array.from({ length: count }, (_, i) => {
    const step = count === 1 ? 1 : i / (count - 1);
    const nValues = Math.max(Math.min(2, chosen.length), Math.ceil(chosen.length * (0.4 + 0.6 * step)));
    const difficulty = Math.max(1, Math.round(1 + (opts.difficulty - 1) * step));
    const values = chosen.slice(0, nValues);
    const reading = generateReading({ ...opts, values, difficulty, seed: (opts.seed || 1) * 100 + i, title: `Lectura n.º ${i + 1}` });
    return { id: `rl-${opts.seed || 1}-${i + 1}`, number: i + 1, values, difficulty, song: reading };
  });
}
