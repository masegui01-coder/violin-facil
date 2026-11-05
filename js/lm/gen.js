// Generadores puros del curso (sin DOM, con semilla: toda la clase recibe lo mismo): rondas del juego STOP a partir de
// la lectura rítmica de la unidad, ritmos con las figuras permitidas y preguntas de discriminación auditiva.
import { rng } from '../generate.js';
import { FIGURE_BEATS, scale } from './notes.js';

const CLAP = 'C5';
const EPS = 1e-6;
const beatsOf = t => FIGURE_BEATS[t.dur] ?? t.beats ?? 0;
const withStarts = tokens => {
  let start = 0;
  return tokens.map(t => { const n = { ...t, start, beats: beatsOf(t) }; start += n.beats; return n; });
};
const note = (dur, rest = false) => (rest ? { rest: true, dur } : { rest: false, dur, name: CLAP });

// ---------- STOP ----------
// Cada error del catálogo («blanca acortada», «corcheas↔negra»…) es una mutación del ritmo: dónde puede ir, cómo queda
// lo que suena, en qué pulso empieza a oírse distinto y su código de error (contrato del curso)
const MUTATIONS = {
  'q>ee': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'q', apply: (ts, i) => [note('e'), note('e')], at: 0.5 },
  'ee>q': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'e' && ts[i + 1] && !ts[i + 1].rest && ts[i + 1].dur === 'e' && Math.abs(ts[i].start % 1) < EPS, apply: () => [note('q')], at: 0.5, span: 2 },
  'q>Rq': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'q', apply: () => [note('q', true)], at: 0 },
  'Rq>q': { can: (ts, i) => ts[i].rest && ts[i].dur === 'q', apply: () => [note('q')], at: 0 },
  'h-corta': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'h', apply: () => [note('q'), note('q', true)], at: 1 },
  'w-corta': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'w', apply: () => [note('h'), note('h', true)], at: 2 },
  'Rw-salto': { can: (ts, i) => ts[i].rest && (ts[i].dur === 'w' || ts[i].dur === 'h'), apply: () => [], at: 0 },
  compas: { can: (ts, i, bar) => !ts[i].rest && ts[i].dur === 'q' && Math.abs((ts[i].start + 1) % bar) < EPS, apply: () => [note('q'), note('q')], at: 1 },
};
const KINDS_OF = [
  [/negra↔silencio/, ['q>Rq', 'Rq>q']], [/corcheas↔negra/, ['q>ee', 'ee>q']], [/blanca acortada/, ['h-corta']],
  [/redonda acortada/, ['w-corta']], [/silencio de compás/, ['Rw-salto']], [/compás de 4/, ['compas']],
  [/cualquier figura/, ['q>ee', 'ee>q', 'h-corta', 'q>Rq']],
];
export function stopKinds(errores = []) {
  const kinds = errores.flatMap(e => (KINDS_OF.find(([re]) => re.test(e)) || [null, []])[1]);
  return kinds.length ? [...new Set(kinds)] : ['q>ee', 'ee>q'];
}

// Una ronda: ritmo que suena (con el error), pulso donde empieza el error, código y nota afectada
export function stopRoundOf(base, { kinds, seed, barBeats = 4 }) {
  const ts = withStarts(base);
  const r = rng(seed);
  const options = kinds.flatMap(k => ts.map((t, i) => (i > 0 && MUTATIONS[k].can(ts, i, barBeats) ? { k, i } : null)).filter(Boolean));
  const fallback = ts.map((t, i) => (i > 0 && MUTATIONS['q>ee'].can(ts, i) ? { k: 'q>ee', i } : null)).filter(Boolean);
  const pool = options.length ? options : fallback.length ? fallback : [{ k: 'q>Rq', i: ts.findIndex((t, i) => i > 0 && !t.rest) }];
  const { k, i } = pool[Math.floor(r() * pool.length)];
  const m = MUTATIONS[k];
  const played = withStarts([...ts.slice(0, i), ...m.apply(ts, i), ...ts.slice(i + (m.span || 1))]);
  return { played, errorBeat: ts[i].start + m.at, code: k, index: i };
}

// Ventana para parar a tiempo según la tolerancia del ejercicio («1 compás», «½ pulso», «1 pulso»)
export function stopWindow(tolerancia, barBeats) {
  const m = /(½|\d+(?:[.,]\d+)?)\s*(compás|compases|pulso|pulsos)/.exec(String(tolerancia || ''));
  if (!m) return 2;
  const n = m[1] === '½' ? 0.5 : Number(m[1].replace(',', '.'));
  return /comp/.test(m[2]) ? n * barBeats : n;
}

// ---------- Ritmos con las figuras de la unidad ----------
// figuras: ['q','Rq','e','h'…] ('e' se usa siempre por parejas en el pulso)
export function genRhythm({ figuras, barBeats, bars, seed }) {
  const r = rng(seed);
  const cells = figuras.map(f => (f === 'e' ? [note('e'), note('e')] : f.startsWith('R') ? [note(f.slice(1), true)] : [note(f)]));
  const len = c => c.reduce((s, t) => s + FIGURE_BEATS[t.dur], 0);
  const out = [];
  for (let b = 0; b < bars; b++) {
    let left = barBeats;
    const last = b === bars - 1;
    for (let guard = 0; left > EPS && guard < 40; guard++) {
      let fit = cells.filter(c => len(c) <= left + EPS);
      if (last && left === barBeats) fit = fit.filter(c => !c[0].rest) || fit;
      const cell = fit.length ? fit[Math.floor(r() * fit.length)] : [note('q')];
      out.push(...cell);
      left -= len(cell);
    }
  }
  // que no acabe en silencio ni empiece con él
  if (out[0] && out[0].rest) out[0] = note(out[0].dur);
  if (out[out.length - 1].rest) out[out.length - 1] = note(out[out.length - 1].dur);
  return withStarts(out);
}

// Melodía corta con las notas de la unidad (por grados o saltos pequeños), terminada en la primera de la lista
export function genMelody({ notas, bars, barBeats, seed, figures = ['q', 'h'] }) {
  const r = rng(seed);
  const order = [...notas];
  const out = [];
  let idx = 0;
  for (let b = 0; b < bars; b++) {
    let left = barBeats;
    while (left > EPS) {
      const fit = figures.filter(f => FIGURE_BEATS[f] <= left + EPS);
      const dur = fit[Math.floor(r() * fit.length)] || 'q';
      idx = Math.max(0, Math.min(order.length - 1, idx + Math.floor(r() * 3) - 1));
      out.push({ rest: false, dur, name: order[idx] });
      left -= FIGURE_BEATS[dur];
    }
  }
  out[out.length - 1] = { ...out[out.length - 1], name: order[0] };
  return withStarts(out);
}

// ---------- Discriminación auditiva ----------
const METERS = [['2/4', 2, 'De dos'], ['3/4', 3, 'De tres'], ['4/4', 4, 'De cuatro']];
export function meterQuestions(count, seed) {
  const r = rng(seed);
  return Array.from({ length: count }, (_, k) => {
    const m = Math.floor(r() * METERS.length);
    const [meter, beats] = METERS[m];
    const bar = ['C3q', ...Array(beats - 1).fill('G4q')].join(' ');
    return { tipo: 'escucharCompas', id: `compas-${k}`, q: '¿De cuántos pulsos es el compás?', options: METERS.map(x => x[2]),
      answer: m, play: { partitura: `| ${Array(4).fill(bar).join(' | ')} |`, compas: meter, acentoPrimero: true, tempo: 100 },
      why: `El golpe grave llega cada ${beats === 2 ? 'dos' : beats === 3 ? 'tres' : 'cuatro'} pulsos.` };
  });
}

// Cinco notas seguidas de do mayor: ¿entre qué dos estaba el semitono (mi-fa o si-do)?
const SEMITONE_STARTS = [0, 1, 4, 5];
const PAIR_NAMES = ['Entre la 1.ª y la 2.ª', 'Entre la 2.ª y la 3.ª', 'Entre la 3.ª y la 4.ª', 'Entre la 4.ª y la 5.ª'];
export function semitoneQuestions(count, seed) {
  const r = rng(seed);
  const two = [...scale('C4'), ...scale('C5').slice(1)];
  return Array.from({ length: count }, (_, k) => {
    const s = SEMITONE_STARTS[Math.floor(r() * SEMITONE_STARTS.length)];
    const five = two.slice(s, s + 5);
    const at = five.findIndex((n, i) => i < 4 && ['E', 'B'].includes(n[0]));
    return { tipo: 'escucharIntervalo', id: `semitono-${k}`, q: 'Escucha la escalera: ¿dónde está el peldaño corto?', options: PAIR_NAMES,
      answer: at, play: { partitura: `| ${five.map(n => `${n}q`).join(' ')} Rq |`, tempo: 76 }, why: 'El semitono es el paso más corto: mi-fa o si-do.' };
  });
}

// Frases cortas en do mayor o en la menor
const SHAPES = [[1, 3, 5, 3, 1], [1, 2, 3, 2, 1], [5, 4, 3, 2, 1], [1, 3, 2, 1], [3, 2, 1, 5, 1], [1, 5, 3, 1]];
export function modeQuestions(count, seed) {
  const r = rng(seed);
  const major = scale('C4');
  const minor = scale('A3', 'menor');
  return Array.from({ length: count }, (_, k) => {
    const isMinor = r() < 0.5;
    const shape = SHAPES[Math.floor(r() * SHAPES.length)];
    const notes = shape.map(d => (isMinor ? minor : major)[d - 1]);
    const toks = notes.map((n, i) => `${n}${i === notes.length - 1 ? 'h' : 'q'}`);
    return { tipo: 'escucharModo', id: `modo-${k}`, q: 'Escucha: ¿mayor o menor?', options: ['Mayor', 'Menor'], answer: isMinor ? 1 : 0,
      play: { partitura: `| ${toks.join(' ')} |`, tempo: 84 }, why: isMinor ? 'Menor: suena más oscuro (la-do-mi).' : 'Mayor: luminoso (do-mi-sol).' };
  });
}

// ¿Qué canción es? La app palmea el ritmo de una canción y se elige entre las de la lista
export function songQuestions(songs, count, seed) {
  const r = rng(seed);
  return Array.from({ length: count }, (_, k) => {
    const pick = Math.floor(r() * songs.length);
    const bars = songs[pick].partitura.split('|').map(x => x.trim()).filter(Boolean).slice(0, 4);
    return { tipo: 'escucharForma', id: `cancion-${k}`, q: '¿Qué canción es? Escucha su ritmo', options: songs.map(s => s.titulo), answer: pick,
      play: { partitura: `| ${bars.join(' | ')} |`, clap: true, tempo: songs[pick].tempo || 84 }, why: `Era «${songs[pick].titulo}».` };
  });
}
