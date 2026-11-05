// Generadores puros del curso (sin DOM, con semilla: toda la clase recibe lo mismo): rondas del juego STOP a partir de
// la lectura rítmica de la unidad, ritmos con las figuras permitidas y preguntas de discriminación auditiva.
import { rng } from '../generate.js';
import { FIGURE_BEATS, scale } from './notes.js';

const CLAP = 'C5';
const EPS = 1e-6;
const withStarts = tokens => {
  let start = 0;
  return tokens.map(t => { const n = { ...t, start, beats: FIGURE_BEATS[t.dur] ?? t.beats ?? 0 }; start += n.beats; return n; });
};
const note = (dur, rest = false) => (rest ? { rest: true, dur } : { rest: false, dur, name: CLAP });

// ---------- STOP ----------
// La lectura de la unidad suena con notas sostenidas (cada figura dura lo que vale) sobre un pulso suave, con sus
// matices, su calderón, su anacrusa y, si el error es de voz, una pequeña melodía ostinato. Cada error del catálogo es
// una mutación: dónde puede ir, cómo queda, en qué pulso empieza a oírse distinto y su código (contrato del curso;
// «Rq>q» = calló una negra, «q>Rq» = sonó en un silencio).
export const DYN_GAIN = { ppp: 0.2, pp: 0.28, p: 0.42, mp: 0.55, mf: 0.68, f: 0.85, ff: 1, fff: 1 };
const DEFAULT_GAIN = DYN_GAIN.mf;
const OSTINATO = [72, 67, 69, 67]; // Do5 Sol4 La4 Sol4: la «voz» que la app repite
const WRONG_STEP = 3;               // la nota cambiada, una tercera menor por encima

// Volumen de cada nota según los matices (compases desde 1; t.bar desde 0): el último matiz fijo vale hasta el
// siguiente y los reguladores (cresc, dim) van de piano a forte o al revés a lo largo de sus compases
export function gainsFor(ts, matices = []) {
  const bars = Math.max(1, ...ts.map(t => (t.bar ?? 0) + 1));
  const level = Array(bars + 1).fill(DEFAULT_GAIN);
  const statics = matices.filter(m => m.signo in DYN_GAIN).sort((x, y) => x.compas - y.compas);
  for (let b = 1; b <= bars; b++) {
    const last = statics.filter(m => m.compas <= b).pop();
    if (last) level[b] = DYN_GAIN[last.signo];
  }
  const swells = matices.filter(m => m.signo === 'cresc' || m.signo === 'dim');
  return ts.map(t => {
    const bar = (t.bar ?? 0) + 1;
    const sw = swells.find(m => bar >= m.compas && bar <= (m.hasta || m.compas));
    if (!sw) return level[bar];
    const span = ts.filter(x => (x.bar ?? 0) + 1 >= sw.compas && (x.bar ?? 0) + 1 <= (sw.hasta || sw.compas));
    const pos = span.indexOf(t) / Math.max(1, span.length - 1);
    const from = level[Math.max(1, sw.compas - 1)] || DYN_GAIN.p;
    const to = sw.signo === 'cresc' ? Math.max(DYN_GAIN.f, from) : Math.min(DYN_GAIN.p, from);
    return from + (to - from) * pos;
  });
}

// Interpretación correcta de la lectura: volumen por compás (matices y reguladores), calderón y melodía si hace falta
export function stopBase(base, { matices = [], voice = false } = {}) {
  const ts = withStarts(base);
  const gains = gainsFor(ts, matices);
  const fermata = (matices.find(m => m.signo === 'calderon') || {}).compas;
  let k = 0;
  return ts.map((t, j) => {
    const bar = (t.bar ?? 0) + 1;
    const gain = gains[j];
    const lastInBar = !ts.some(x => x.bar === t.bar && x.start > t.start);
    const hold = fermata && bar === fermata && lastInBar && !t.rest ? t.beats : 0;
    const midi = t.rest ? 0 : voice ? OSTINATO[k++ % OSTINATO.length] : 72;
    return { ...t, gain, hold, midi };
  });
}

const MUTATIONS = {
  'q>ee': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'q', apply: (ts, i) => [{ ...ts[i], dur: 'e' }, { ...ts[i], dur: 'e' }], at: 0.5 },
  'ee>q': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'e' && ts[i + 1] && !ts[i + 1].rest && ts[i + 1].dur === 'e' && Math.abs(ts[i].start % 1) < EPS, apply: (ts, i) => [{ ...ts[i], dur: 'q' }], at: 0.5, span: 2 },
  'Rq>q': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'q', apply: (ts, i) => [{ ...ts[i], rest: true }], at: 0 },
  'q>Rq': { can: (ts, i) => ts[i].rest && ts[i].dur === 'q', apply: (ts, i) => [{ ...ts[i], rest: false, midi: (ts[i - 1] && ts[i - 1].midi) || 72 }], at: 0 },
  'h-corta': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'h', apply: (ts, i) => [{ ...ts[i], dur: 'q' }, { ...ts[i], dur: 'q', rest: true }], at: 1 },
  'w-corta': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'w', apply: (ts, i) => [{ ...ts[i], dur: 'h' }, { ...ts[i], dur: 'h', rest: true }], at: 2 },
  'Rw-salto': { can: (ts, i) => ts[i].rest && (ts[i].dur === 'w' || ts[i].dur === 'h'), apply: () => [], at: 0 },
  compas: { can: (ts, i, bar) => !ts[i].rest && ts[i].dur === 'q' && Math.abs((ts[i].start + 1) % bar) < EPS, apply: (ts, i) => [ts[i], { ...ts[i] }], at: 1 },
  // matiz equivocado: un compás entero suena con el matiz contrario (fuerte donde pone piano o al revés)
  matiz: { can: (ts, i) => i > 0 && !ts[i].rest && ts[i - 1].bar !== ts[i].bar, apply: (ts, i) => ts.filter(t => t.bar === ts[i].bar).map(t => ({ ...t, gain: t.gain >= DYN_GAIN.mf ? DYN_GAIN.pp : DYN_GAIN.ff })), at: 0, wholeBar: true },
  // calderón ignorado: la nota del calderón dura solo su figura
  calderon: { can: (ts, i) => ts[i].hold > 0, apply: (ts, i) => [{ ...ts[i], hold: 0 }], at: 'end' },
  // voz cambiada: una nota del ostinato suena a otra altura
  voz: { can: (ts, i) => !ts[i].rest && ts[i].midi > 0, apply: (ts, i) => [{ ...ts[i], midi: ts[i].midi + WRONG_STEP }], at: 0 },
};
const KINDS_OF = [
  [/negra↔silencio/, ['Rq>q', 'q>Rq']], [/corcheas↔negra/, ['q>ee', 'ee>q']], [/blanca acortada/, ['h-corta']],
  [/redonda acortada/, ['w-corta']], [/silencio de compás/, ['Rw-salto']], [/compás de 4/, ['compas']],
  [/matiz/, ['matiz']], [/calderón/, ['calderon']], [/voz cambiada/, ['voz']], [/anacrusa/, ['anacrusa']],
  [/cualquier figura/, ['q>ee', 'ee>q', 'h-corta', 'Rq>q']],
];
export function stopKinds(errores = []) {
  const kinds = errores.flatMap(e => (KINDS_OF.find(([re]) => re.test(e)) || [null, []])[1]);
  return kinds.length ? [...new Set(kinds)] : ['q>ee', 'ee>q'];
}

// Una ronda: lo que suena (con el error), el pulso donde empieza el error, el código y dónde. offset: pulsos de
// silencio antes de la primera nota (la anacrusa entra en el último pulso de la claqueta: offset = compás − anacrusa).
// avoid: rondas ya jugadas («código:posición»), para no repetir la misma.
export function stopRoundOf(base, { kinds, seed, barBeats = 4, matices = [], pickup = 0, avoid = new Set() }) {
  const ts = stopBase(base, { matices, voice: kinds.includes('voz') });
  const r = rng(seed);
  const offset = pickup ? barBeats - pickup : 0;
  const options = kinds.flatMap(k => (k === 'anacrusa' ? (pickup ? [{ k, i: 0 }] : [])
    : ts.map((t, i) => (i > 0 && MUTATIONS[k].can(ts, i, barBeats) ? { k, i } : null)).filter(Boolean)));
  const fallback = ts.map((t, i) => (i > 0 && MUTATIONS['q>ee'].can(ts, i) ? { k: 'q>ee', i } : null)).filter(Boolean);
  const all = options.length ? options : fallback;
  const fresh = all.filter(o => !avoid.has(`${o.k}:${o.i}`));
  // si los errores de la unidad ya se han jugado todos, una figura cambiada nueva antes que repetir una ronda
  const generic = ['q>ee', 'ee>q', 'h-corta', 'Rq>q'].flatMap(k => ts.map((t, i) => (i > 0 && MUTATIONS[k].can(ts, i, barBeats) ? { k, i } : null)).filter(Boolean))
    .filter(o => !avoid.has(`${o.k}:${o.i}`));
  const pool = fresh.length ? fresh : generic.length ? generic : all;
  const { k, i } = pool[Math.floor(r() * pool.length)];
  const key = `${k}:${i}`;
  // anacrusa en tiempo fuerte: la anacrusa cae en el primer pulso, todo se adelanta y los acentos cambian de sitio
  if (k === 'anacrusa') return { played: withStarts(ts), offset: 0, errorBeat: 0, code: k, index: 0, key };
  const m = MUTATIONS[k];
  const span = m.wholeBar ? ts.filter(t => t.bar === ts[i].bar).length : (m.span || 1);
  const played = withStarts([...ts.slice(0, i), ...m.apply(ts, i), ...ts.slice(i + span)]);
  const errorBeat = offset + (m.at === 'end' ? ts[i].start + ts[i].beats : ts[i].start + m.at);
  return { played, offset, errorBeat, code: k, index: i, key };
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
// inicio (grado de do mayor) → hueco del semitono entre sus cinco notas: do-sol 2, re-la 1, mi-si 0, fa-do 3, sol-re 2, la-mi 1
const SEMITONE_AT = { 0: 2, 1: 1, 2: 0, 3: 3, 4: 2, 5: 1 };
const PAIR_NAMES = ['Entre la 1.ª y la 2.ª', 'Entre la 2.ª y la 3.ª', 'Entre la 3.ª y la 4.ª', 'Entre la 4.ª y la 5.ª'];
export function semitoneQuestions(count, seed) {
  const r = rng(seed);
  const two = [...scale('C4'), ...scale('C5').slice(1)];
  return Array.from({ length: count }, (_, k) => {
    const target = k % 4 === 0 ? Math.floor(r() * 4) : (Math.floor(r() * 4) + k) % 4;
    const starts = Object.keys(SEMITONE_AT).map(Number).filter(st => SEMITONE_AT[st] === target);
    const s = starts[Math.floor(r() * starts.length)];
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
