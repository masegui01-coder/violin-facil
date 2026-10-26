// Libro de lecturas (beta para testers pro): lecturas a primera vista generadas en 10 niveles, de la redonda y la
// negra hasta el nivel de las pruebas de acceso a enseñanzas superiores (nivel 9): compases cambiantes de corchea,
// grupos irregulares, cromatismos, saltos amplios, matices y reguladores, articulaciones, agógica, cambios de clave,
// de armadura y de carácter y técnicas extendidas. Sale como texto de partitura (music.js) para tocar, ver e imprimir.
import { rng } from './generate.js';
import { keySignature, meterBeats } from './music.js';
import { beatGroups } from './engrave.js';

export const MAX_LEVEL = 10;
export const LEVELS = [
  'Iniciación: redondas, blancas y negras',
  'Corcheas y silencios',
  'Puntillo, semicorcheas y ligaduras',
  'Síncopas, combinaciones y compás de 6/8',
  'Tresillos, matices y agógica',
  'Seisillos, cromatismos y cambios de compás',
  'Fusas, compases de amalgama y saltos amplios',
  'Profesional: adornos, trinos y cambios de tonalidad y de carácter',
  'Prueba de acceso a enseñanzas superiores',
  'Virtuoso: todo a la vez y cambios en cada compás',
];

// Familias de figuras que se pueden quitar
export const FAMILIES = [
  { id: 'w', name: 'Redondas' }, { id: 'h', name: 'Blancas' }, { id: 'q', name: 'Negras' }, { id: 'e', name: 'Corcheas' },
  { id: 's', name: 'Semicorcheas' }, { id: 't', name: 'Fusas' }, { id: 'dot', name: 'Puntillos' }, { id: 'trip', name: 'Tresillos' },
  { id: 'tup', name: 'Seisillos y quintillos' }, { id: 'sync', name: 'Síncopas' }, { id: 'rest', name: 'Silencios' }, { id: 'tie', name: 'Ligaduras de prolongación' },
];
export const FAMILY_IDS = FAMILIES.map(f => f.id);
export const METERS = ['2/4', '3/4', '4/4', '2/2', '3/8', '6/8', '9/8', '12/8', '4/8', '5/8', '7/8', '5/4'];
const METERS_BY_LEVEL = [null, ['2/4', '3/4', '4/4'], ['2/4', '3/4', '4/4'], ['2/4', '3/4', '4/4', '2/2'], ['2/4', '3/4', '4/4', '6/8', '2/2'],
  ['2/4', '3/4', '4/4', '6/8', '3/8', '9/8'], ['2/4', '3/4', '4/4', '6/8', '3/8', '9/8', '12/8'], ['2/4', '3/4', '4/4', '6/8', '3/8', '5/8', '4/8', '7/8'],
  ['2/4', '3/4', '4/4', '6/8', '3/8', '5/8', '4/8', '7/8', '9/8'], ['6/8', '3/8', '5/8', '4/8', '7/8', '2/4', '3/4', '4/4', '5/4'], METERS];
const MAX_KEY = [0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 6];
const RANGE = [0, 9, 10, 12, 14, 15, 17, 19, 22, 28, 34];
const MAX_LEAP = [0, 1, 2, 2, 3, 4, 5, 7, 8, 11, 13]; // en grados de la escala
const LEAP_CHANCE = [0, 0, 0.12, 0.18, 0.22, 0.26, 0.3, 0.34, 0.38, 0.42, 0.46];
const CHROMATIC = [0, 0, 0, 0, 0.04, 0.07, 0.1, 0.14, 0.18, 0.24, 0.3];
const METER_CHANGE_EVERY = [0, 0, 0, 0, 0, 6, 4, 3, 3, 2, 1];

const MAJOR_KEYS = [['C', 0], ['G', 1], ['F', -1], ['D', 2], ['Bb', -2], ['A', 3], ['Eb', -3], ['E', 4], ['Ab', -4], ['B', 5], ['Db', -5], ['F#', 6], ['Gb', -6]];
const MINOR_KEYS = [['Am', 0], ['Em', 1], ['Dm', -1], ['Bm', 2], ['Gm', -2], ['F#m', 3], ['Cm', -3], ['C#m', 4], ['Fm', -4], ['G#m', 5], ['Bbm', -5], ['D#m', 6], ['Ebm', -6]];
export const KEYS = [...MAJOR_KEYS, ...MINOR_KEYS].map(([k]) => k);
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACC_TXT = { 1: '#', '-1': 'b', 0: '' };
const CLEF_RANGE = { treble: [60, 93], bass: [40, 64], alto: [53, 74], tenor: [50, 71] };
const TEMPO_WORDS = [['Larghetto', 52], ['Adagio', 60], ['Andante', 72], ['Moderato', 88], ['Allegretto', 104], ['Allegro', 126]];

// ---------- Células rítmicas ----------
// [patrón, pulsos (negras), nivel desde el que aparece, familias]; unit 1 = pulso de negra, 1.5 = negra con puntillo
const SIMPLE = [
  ['q', 1, 1, ['q']], ['h', 2, 1, ['h']], ['h.', 3, 1, ['h', 'dot']], ['w', 4, 1, ['w']],
  ['e e', 1, 2, ['e']], ['Rq', 1, 2, ['rest']], ['Re e', 1, 2, ['e', 'rest']],
  ['q. e', 2, 3, ['q', 'e', 'dot']], ['s s s s', 1, 3, ['s']], ['e Re', 1, 3, ['e', 'rest']],
  ['e s s', 1, 4, ['e', 's']], ['s s e', 1, 4, ['s', 'e']], ['e. s', 1, 4, ['e', 's', 'dot']], ['e q e', 2, 4, ['e', 'q', 'sync']], ['Rs s s s', 1, 4, ['s', 'rest']],
  ['e:3 e:3 e:3', 1, 5, ['trip']], ['s e s', 1, 5, ['s', 'sync']], ['s e.', 1, 5, ['s', 'dot']], ['q:3 q:3 q:3', 2, 5, ['trip', 'q']], ['Re:3 e:3 e:3', 1, 5, ['trip', 'rest']],
  ['s:6 s:6 s:6 s:6 s:6 s:6', 1, 6, ['tup']], ['Rs e s', 1, 6, ['s', 'rest', 'sync']], ['e:3 Re:3 e:3', 1, 6, ['trip', 'rest']], ['s s Rs s', 1, 6, ['s', 'rest']], ['e. s e. s', 2, 6, ['dot', 's']],
  ['s. t s. t', 1, 7, ['t', 'dot']], ['t t t t s s', 1, 7, ['t', 's']], ['q:3 e:3', 1, 7, ['trip']], ['e:3 q:3', 1, 7, ['trip']], ['s:5 s:5 s:5 s:5 s:5', 1, 7, ['tup']], ['s e s q', 2, 7, ['sync', 's']],
  ['t t t t t t t t', 1, 8, ['t']], ['Rs:6 s:6 s:6 s:6 s:6 s:6', 1, 8, ['tup', 'rest']], ['e. t t', 1, 8, ['t', 'dot']], ['Rt t s e', 1, 8, ['t', 'rest']], ['q:3 Rq:3 q:3', 2, 8, ['trip', 'rest']],
  ['e:5 e:5 e:5 e:5 e:5', 2, 9, ['tup']], ['s:7 s:7 s:7 s:7 s:7 s:7 s:7', 1, 9, ['tup']], ['t t s. t s', 1, 9, ['t', 'dot', 'sync']], ['Re:3 q:3', 1, 9, ['trip', 'rest']],
  ['s:6 s:6 Rs:6 s:6 s:6 s:6', 1, 10, ['tup', 'rest']], ['t t s Rs s', 1, 10, ['t', 's', 'rest']],
].map(([pat, beats, level, fam]) => ({ pat, beats, level, fam }));
const COMPOUND = [
  ['q.', 1.5, 1, ['q', 'dot']], ['h.', 3, 1, ['h', 'dot']], ['q e', 1.5, 3, ['q', 'e']], ['e e e', 1.5, 3, ['e']],
  ['e q', 1.5, 4, ['e', 'q', 'sync']], ['e. s e', 1.5, 4, ['e', 's', 'dot']], ['Re e e', 1.5, 4, ['e', 'rest']], ['Rq.', 1.5, 4, ['rest', 'dot']],
  ['s s s s s s', 1.5, 5, ['s']], ['q s s', 1.5, 5, ['q', 's']], ['e s s e', 1.5, 5, ['e', 's']], ['e e s s', 1.5, 5, ['e', 's']],
  ['s s e e', 1.5, 6, ['s', 'e']], ['Re s s e', 1.5, 6, ['rest', 's']], ['e Rs s e', 1.5, 6, ['rest', 's', 'sync']],
  ['s s s s e', 1.5, 7, ['s']], ['e s s s s', 1.5, 7, ['s']], ['t t s e e', 1.5, 7, ['t', 's']], ['e. e.', 1.5, 7, ['e', 'dot', 'sync']],
  ['s. t e e', 1.5, 8, ['t', 'dot']], ['Rs s s s s s', 1.5, 8, ['rest', 's']], ['s e s e', 1.5, 9, ['s', 'sync']], ['t t t t s s e', 1.5, 9, ['t', 's']],
].map(([pat, beats, level, fam]) => ({ pat, beats, level, fam }));
const BASIC = { 1: 'q', 1.5: 'q.', 0.5: 'e' };
export const ALL_CELLS = [...SIMPLE, ...COMPOUND];

const tokensOf = pat => pat.split(' ').map(t => {
  const m = /^(R?)([whqest])(\.{0,2})(?::(\d))?$/.exec(t);
  return { rest: !!m[1], dur: m[2], dots: m[3], tup: m[4] || '' };
});

function pickWeighted(r, items, weight) {
  const ws = items.map(weight);
  let x = r() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { x -= ws[i]; if (x <= 0) return items[i]; }
  return items[items.length - 1];
}

export function cellsFor(unit, beats, level, families) {
  return (unit === 1.5 ? COMPOUND : SIMPLE).filter(c => c.level <= level && Math.abs(c.beats - beats) < 1e-6 && c.fam.every(f => families.has(f)));
}

// Un compás: recorre los tramos de pulso y elige células (a veces una larga que ocupa varios tramos)
function fillBar(r, meter, level, families) {
  const segs = beatGroups(meter);
  const out = [];
  for (let i = 0; i < segs.length;) {
    const unit = segs[i];
    if (unit === 0.5) { out.push(...tokensOf('e')); i++; continue; }
    const options = [];
    for (let span = 4; span >= 1; span--) {
      if (i + span > segs.length || segs.slice(i, i + span).some(u => u !== unit)) continue;
      if (span > 1 && level < 7 && i % 2 === 1) continue;
      cellsFor(unit, unit * span, level, families).forEach(c => options.push({ c, span }));
    }
    if (!options.length) { out.push(...tokensOf(BASIC[unit])); i++; continue; }
    const { c, span } = pickWeighted(r, options, o => (o.c.level >= level - 2 ? 3 : 1) * (o.span > 1 ? Math.max(0.25, 1.4 - level * 0.12) : 1) * (o.c.fam.includes('rest') ? 0.35 : 1));
    out.push(...tokensOf(c.pat));
    i += span;
  }
  return out;
}

// El último compás: una sola nota que lo llena; si no cabe en una figura, ligada respetando los pulsos (9/8 = h. + q.)
const FINAL_BAR = { '2/4': ['h'], '3/4': ['h.'], '4/4': ['w'], '2/2': ['w'], '5/4': ['h.', 'h'], '2/8': ['q'], '3/8': ['q.'], '4/8': ['h'],
  '5/8': ['q', 'q.'], '6/8': ['h.'], '7/8': ['h', 'q.'], '9/8': ['h.', 'q.'], '12/8': ['w.'] };
function finalBar(meter) {
  const figs = [...(FINAL_BAR[meter.join('/')] || [])];
  if (!figs.length) {
    const FIGS = [[4, 'w'], [3, 'h.'], [2, 'h'], [1.5, 'q.'], [1, 'q'], [0.5, 'e']];
    let left = meterBeats(meter);
    while (left > 1e-6) { const f = FIGS.find(([b]) => b <= left + 1e-6); figs.push(f[1]); left -= f[0]; }
  }
  return figs.map((f, i) => ({ rest: false, dur: f[0], dots: f.slice(1), tup: '', tie: i < figs.length - 1 }));
}

// ---------- Alturas ----------
function spellDiatonic(midi, sig) {
  const pc = ((midi % 12) + 12) % 12;
  const letter = LETTERS.find(l => (LETTER_PC[l] + (sig[l] || 0) + 12) % 12 === pc);
  if (!letter) return null;
  const acc = sig[letter] || 0;
  return { letter, acc, oct: Math.round((midi - acc - LETTER_PC[letter]) / 12) - 1, midi };
}

// Nota cromática que se acerca a una nota de la escala (target) por semitono:
// subiendo, la letra de abajo alterada (Fa → Fa♯ → Sol) salvo que salga Mi♯ o Si♯ (entonces la propia letra: Fa♮ → Fa♯);
// bajando, la letra de arriba rebajada (Si♭ → La) salvo que salga Fa♭ o Do♭. Nunca dobles alteraciones.
const LETTER_NEAR = (letter, d) => LETTERS[(LETTERS.indexOf(letter) + d + 7) % 7];
function spelled(letter, midi) {
  let acc = ((midi - LETTER_PC[letter]) % 12 + 12) % 12;
  if (acc > 6) acc -= 12;
  return Math.abs(acc) <= 1 ? { letter, acc, oct: Math.round((midi - acc - LETTER_PC[letter]) / 12) - 1, midi } : null;
}
function spellApproach(midi, sig, target) {
  const goal = spellDiatonic(target, sig);
  if (!goal) return null;
  const up = midi < target;
  const neighbour = spelled(LETTER_NEAR(goal.letter, up ? -1 : 1), midi);
  const odd = n => !n || (up && n.acc === 1 && ['E', 'B'].includes(n.letter)) || (!up && n.acc === -1 && ['F', 'C'].includes(n.letter));
  const own = spelled(goal.letter, midi);
  const chosen = !odd(neighbour) ? neighbour : own;
  return chosen && chosen.acc !== (sig[chosen.letter] || 0) ? chosen : null;
}

const nameOf = n => `${n.letter}${ACC_TXT[n.acc]}${n.oct}`;

// Registro según el nivel (centrado en el instrumento) y, si hay cambio de clave, lo cómodo de esa clave
export function pitchRange(inst, level, clef) {
  const [lo0, hi0] = inst.written;
  const center = Math.round((lo0 + hi0) / 2);
  const half = RANGE[level] / 2;
  let lo = Math.max(lo0, Math.round(center - half));
  let hi = Math.min(hi0 + (level >= 9 ? 2 : 0), Math.round(center + half));
  if (clef && CLEF_RANGE[clef]) { lo = Math.max(lo, CLEF_RANGE[clef][0]); hi = Math.min(hi, CLEF_RANGE[clef][1]); }
  return [lo, hi];
}

function scaleMidis(lo, hi, sig) {
  const out = [];
  for (let m = lo; m <= hi; m++) if (spellDiatonic(m, sig)) out.push(m);
  return out;
}

// ---------- Plan de la pieza ----------
const randInt = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];

function chooseKey(r, opts, level) {
  if (opts.key && opts.key !== 'random') return opts.scale === 'minor' && !opts.key.endsWith('m') ? `${opts.key}m` : opts.key;
  const pool = (opts.scale === 'major' ? MAJOR_KEYS : opts.scale === 'minor' ? MINOR_KEYS : [...MAJOR_KEYS, ...MINOR_KEYS])
    .filter(([, n]) => Math.abs(n) <= MAX_KEY[level]);
  return pick(r, pool)[0];
}

function meterList(r, opts, level, bars) {
  const fixed = opts.meter && opts.meter !== 'var' ? opts.meter : null;
  const pool = METERS_BY_LEVEL[level];
  const every = fixed ? 0 : METER_CHANGE_EVERY[level] || (level >= 3 ? 6 : 0);
  let cur = fixed || pick(r, pool);
  const out = [];
  let left = every ? randInt(r, every, every + 2) : Infinity;
  for (let b = 0; b < bars; b++) {
    if (left <= 0) { cur = pick(r, pool.filter(m => m !== cur)); left = randInt(r, every, every + 2); }
    out.push(cur.split('/').map(Number));
    left--;
  }
  return out;
}

// Tramos de 2-4 compases en otra clave (solo si el instrumento tiene notas cómodas en ella)
function clefPlan(r, opts, level, bars, inst) {
  const base = inst.clef === 'bass' ? 'bass' : 'treble';
  const plan = Array(bars).fill(base);
  if (!opts.clefs || opts.clefs === 'none' || level < 6) return plan;
  const others = (opts.clefs === 'all' ? ['treble', 'bass', 'alto', 'tenor'] : ['treble', 'bass']).filter(c => c !== base)
    .filter(c => { const [lo, hi] = pitchRange(inst, Math.max(level, 8), c); return hi - lo >= 7; });
  if (!others.length) return plan;
  for (let b = 2; b < bars - 2; b += randInt(r, 4, 7)) {
    const c = pick(r, others);
    const len = randInt(r, 2, level >= 9 ? 3 : 4);
    for (let k = b; k < Math.min(bars - 1, b + len); k++) plan[k] = c;
  }
  return plan;
}

const DYN_LEVELS = [null, ['p', 'f'], ['p', 'f'], ['p', 'mp', 'mf', 'f'], ['p', 'mp', 'mf', 'f'], ['pp', 'p', 'mp', 'mf', 'f', 'ff'], ['pp', 'p', 'mp', 'mf', 'f', 'ff'],
  ['pp', 'p', 'mp', 'mf', 'f', 'ff', 'sfz', 'fp'], ['pp', 'p', 'mp', 'mf', 'f', 'ff', 'sfz', 'fp'], ['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'sfz', 'fp'], ['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff', 'sfz', 'fp']];
const LOUD = ['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff'];

// ---------- Lectura ----------
// opts: inst, bars, bpm, level (1-10), meter ('4/4'… o 'var'), key (tónica o 'random'), scale ('major'|'minor'|'any'),
// families (figuras permitidas), rests, dynamics, articulation, agogic, chromatic, clefs ('none'|'solfa'|'all'), extended, seed
export function generateReading(opts) {
  const { inst, bars = 16, bpm = 72, seed = 1, title = 'Lectura' } = opts;
  const level = Math.max(1, Math.min(MAX_LEVEL, opts.level || 3));
  const families = new Set(opts.families && opts.families.length ? opts.families : FAMILY_IDS);
  families.add('q');
  if (opts.rests === false) families.delete('rest');
  const r = rng(seed);
  let key = inst.rhythmOnly ? 'C' : chooseKey(r, opts, level);
  const startKey = key;
  const meters = meterList(r, opts, level, bars);
  const clefs = clefPlan(r, opts, level, bars, inst);
  const wantDyn = opts.dynamics !== false;
  const wantArt = opts.articulation !== false && level >= 3;
  const wantAgogic = opts.agogic !== false && level >= 4;
  const chromatic = opts.chromatic === false || inst.rhythmOnly ? 0 : CHROMATIC[level];
  const ext = !!opts.extended && level >= 8 && ['madera', 'metal'].includes(inst.family);

  // cambio de carácter (tempo y, si la tonalidad es libre, armadura) hacia el 60 % en los niveles altos
  const sectionBar = level >= 8 && wantAgogic && bars >= 8 ? Math.round(bars * 0.6) : -1;
  const sectionKey = sectionBar > 0 && !inst.rhythmOnly && (!opts.key || opts.key === 'random') ? chooseKey(r, { ...opts, key: 'random' }, level) : null;
  const sectionTempo = sectionBar > 0 ? pick(r, TEMPO_WORDS.filter(([, b]) => Math.abs(b - bpm) > 20)) : null;

  const barsOut = [];
  let dyn = wantDyn ? pick(r, DYN_LEVELS[level].filter(d => LOUD.includes(d))) : null;
  let nextDynBar = wantDyn ? randInt(r, 2, 4) : Infinity;
  let hairpinEnd = -1;
  let midi = null;
  let prevTied = false;
  let prevNote = null;
  let lastNoteAt = null; // { out, idx } de la última nota escrita, por si hay que quitarle la ligadura
  let pendingTarget = null; // tras una nota cromática, la nota de la escala a la que resuelve
  let slurLeft = 0;
  let prevText = '';
  let prevToks = null;
  let prevDegrees = [];

  for (let b = 0; b < bars; b++) {
    const meter = meters[b];
    const lastBar = b === bars - 1;
    const out = [];
    if (b === 0 || meter.join('/') !== meters[b - 1].join('/')) out.push(`@time:${meter.join('/')}`);
    if (b === 0 ? clefs[0] !== (inst.clef === 'bass' ? 'bass' : 'treble') : clefs[b] !== clefs[b - 1]) out.push(`@clef:${clefs[b]}`);
    if (b === sectionBar) {
      if (sectionKey && sectionKey !== key) { key = sectionKey; out.push(`@key:${key}`); }
      out.push(`@tempo:q=${sectionTempo[1]}:${sectionTempo[0]}`);
    }
    const sig = keySignature(key);
    const [lo, hi] = pitchRange(inst, level, clefs[b]);
    const scale = scaleMidis(lo, hi, sig);
    if (midi === null || midi < lo || midi > hi) midi = scale[Math.floor(scale.length / 2)];
    const minor = key.endsWith('m');
    const tonicPc = (LETTER_PC[key[0]] + (key[1] === '#' ? 1 : key[1] === 'b' ? -1 : 0) + 12) % 12;

    // matices: uno al principio y cambios cada pocos compases, a veces con regulador
    const first = [];
    if (wantDyn && b === 0) first.push(`@${dyn}`);
    if (wantDyn && b === hairpinEnd) { first.push('@|', `@${dyn}`); hairpinEnd = -1; }
    else if (wantDyn && b > 0 && b >= nextDynBar && !lastBar && hairpinEnd < 0) {
      const target = pick(r, DYN_LEVELS[level].filter(d => d !== dyn));
      if (level >= 3 && LOUD.includes(target) && LOUD.includes(dyn) && r() < 0.5 + level * 0.03) {
        first.push(LOUD.indexOf(target) > LOUD.indexOf(dyn) ? '@<' : '@>');
        hairpinEnd = Math.min(bars - 1, b + randInt(r, 1, level >= 7 ? 1 : 2));
        dyn = target;
      } else { first.push(`@${target}`); if (LOUD.includes(target)) dyn = target; }
      nextDynBar = b + randInt(r, level >= 7 ? 2 : 3, level >= 7 ? 3 : 5);
    }
    // agógica: rit. al final (y calderón), poco rit. o accel. y a tempo en medio
    if (wantAgogic && lastBar && level >= 5) first.push('@rit');
    else if (prevText) { first.push('@atempo'); prevText = ''; }
    else if (wantAgogic && level >= 6 && b > 2 && b < bars - 3 && b !== sectionBar && r() < (level >= 8 ? 0.12 : 0.07)) { prevText = level >= 7 && r() < 0.4 ? '@accel' : '@poco_rit'; first.push(prevText); }
    if (wantDyn && level >= 3 && b > 1 && !lastBar && hairpinEnd < 0 && r() < 0.04) first.push(r() < 0.5 ? '@cresc' : '@dim');

    const sameMeter = b > 0 && meter.join('/') === meters[b - 1].join('/');
    const repeat = !lastBar && sameMeter && prevToks && r() < 0.35;
    const toks = lastBar ? finalBar(meter) : repeat ? prevToks : fillBar(r, meter, level, families);
    const sequence = repeat && prevDegrees.length && r() < 0.6 ? (r() < 0.5 ? -1 : 1) : null;
    const degrees = [];
    const tech = ext && !lastBar && b !== sectionBar && r() < 0.12
      ? pick(r, inst.id.startsWith('sax') || inst.id.includes('clarinet') ? ['Slap', 'Flatt.', 'Growl'] : ['Flatt.', 'Growl']) : null;
    if (tech) first.push(`@tech:${tech}`);

    // una ligadura no puede llegar a un silencio, a otra altura (cambio de clave) ni a otra armadura
    const untie = () => { if (prevTied && lastNoteAt) lastNoteAt.out[lastNoteAt.idx] = lastNoteAt.out[lastNoteAt.idx].replace('~', ''); prevTied = false; };
    if (prevTied && (b === sectionBar || midi < lo || midi > hi)) untie();
    if (b === sectionBar) pendingTarget = null;
    toks.forEach((t, i) => {
      const lastNote = lastBar && i === 0;
      const isFinal = lastBar && i === toks.length - 1;
      const marks = i === 0 ? first : [];
      if (t.rest && !lastNote && !(b === 0 && i === 0)) {
        untie();
        out.push(...marks, `R${t.dur}${t.dots}${t.tup ? ':' + t.tup : ''}`);
        return;
      }
      // altura: final en la tónica; si no, paso, salto o cromatismo
      let note;
      if (lastNote) {
        const tonics = scale.filter(m => ((m % 12) + 12) % 12 === tonicPc);
        midi = tonics.length ? tonics.reduce((a, m) => (Math.abs(m - midi) < Math.abs(a - midi) ? m : a), tonics[0]) : midi;
        note = spellDiatonic(midi, sig);
      } else if (prevTied && prevNote) {
        note = prevNote;
        midi = note.midi;
      } else if (pendingTarget !== null && pendingTarget >= lo && pendingTarget <= hi) {
        midi = pendingTarget;
        note = spellDiatonic(midi, sig);
      } else if (sequence !== null && prevDegrees[degrees.length] !== undefined && scale[prevDegrees[degrees.length] + sequence] !== undefined) {
        midi = scale[prevDegrees[degrees.length] + sequence];
        note = spellDiatonic(midi, sig);
      } else {
        let idx = scale.indexOf(midi);
        if (idx < 0) idx = Math.max(0, scale.findIndex(m => m > midi));
        const leap = r() < LEAP_CHANCE[level] ? randInt(r, 2, MAX_LEAP[level] + 1) : 1;
        const dir = idx <= 1 ? 1 : idx >= scale.length - 2 ? -1 : (r() < 0.5 ? -1 : 1);
        const target = scale[Math.max(0, Math.min(scale.length - 1, idx + dir * leap))];
        const degree = ((target - tonicPc) % 12 + 12) % 12;
        const seventh = spellDiatonic(target, sig);
        if (r() < chromatic && target - 1 >= lo && target + 1 <= hi && !spellDiatonic(target + (dir > 0 ? -1 : 1), sig)) {
          midi = target + (dir > 0 ? -1 : 1);
          note = spellApproach(midi, sig, target);
          if (note) pendingTarget = target;
        } else if (minor && level >= 4 && degree === 10 && target + 1 <= hi && seventh && seventh.acc < 1 && r() < 0.6) {
          midi = target + 1; // sensible de la menor armónica (sin dobles sostenidos: no en Sol♯ ni Re♯ menor)
          note = { ...seventh, acc: seventh.acc + 1, midi };
        } else { midi = target; note = spellDiatonic(midi, sig); }
        if (!note) { midi = target; note = spellDiatonic(midi, sig); }
      }
      // red de seguridad: si algo no tiene nombre en esta armadura, la nota de la escala más cercana
      if (!note) {
        midi = scale.reduce((a, m) => (Math.abs(m - midi) < Math.abs(a - midi) ? m : a), scale[0]);
        note = spellDiatonic(midi, sig);
        pendingTarget = null;
      }
      const art = [];
      let open = '';
      let close = '';
      if (slurLeft > 0) { slurLeft--; if (slurLeft === 0) close = ')'; }
      else if (wantArt && !t.tup && !lastNote && ['e', 's', 't'].includes(t.dur) && r() < 0.32) {
        const span = randInt(r, 2, 4);
        if (i + span <= toks.length && toks.slice(i, i + span).every(x => !x.rest)) { open = '('; slurLeft = span - 1; }
      }
      if (wantArt && !open && !slurLeft && !close) {
        if (['e', 's'].includes(t.dur) && r() < 0.2) art.push("'");
        else if (level >= 5 && r() < 0.06) art.push('_');
      }
      if (wantArt && level >= 4 && r() < 0.06) art.push('>');
      if (wantArt && level >= 8 && r() < 0.02) art.push('^');
      if (tech === 'Slap' && ['e', 'q', 's'].includes(t.dur)) art.push('x');
      if (level >= 8 && ['q', 'h', 'w'].includes(t.dur) && !t.dots && !lastNote && r() < 0.08) art.push('T');
      if (isFinal && wantAgogic) art.push('U');
      const nextTok = toks[i + 1];
      const tie = t.tie || (families.has('tie') && level >= 3 && !lastBar && !t.tup && !open && !slurLeft && !close
        && (nextTok ? !nextTok.rest && !nextTok.tup : b < bars - 2) && pendingTarget === null && r() < 0.06 + level * 0.008);
      if (tie) art.push('~');
      const graceNote = level >= 8 && !prevTied && !open && !lastNote && note.midi > lo + 1 && r() < 0.04 ? (spellApproach(note.midi - 1, sig, note.midi) || spellDiatonic(note.midi - 2, sig) || spellDiatonic(note.midi - 1, sig)) : null;
      out.push(...marks);
      if (graceNote) out.push(`g:${nameOf(graceNote)}`);
      out.push(`${open}${nameOf(note)}${t.dur}${t.dots}${t.tup ? ':' + t.tup : ''}${art.join('')}${close}`);
      lastNoteAt = { out, idx: out.length - 1 };
      degrees.push(scale.indexOf(note.midi));
      if (pendingTarget !== null && note.midi === pendingTarget) pendingTarget = null;
      prevTied = tie;
      prevNote = note;
    });
    // una ligadura de expresión no pasa de un compás a otro
    if (slurLeft > 0) { const k = out.map((x, j) => (/^[(A-G]/.test(x) ? j : -1)).filter(j => j >= 0).pop(); if (k !== undefined) out[k] += ')'; slurLeft = 0; }
    barsOut.push(out);
    prevToks = lastBar ? null : toks;
    prevDegrees = degrees.every(d => d >= 0) ? degrees : [];
  }
  const firstMeter = meters[0];
  const variable = meters.some(m => m.join('/') !== firstMeter.join('/'));
  return {
    title, key: startKey, time: Math.max(1, Math.ceil(meterBeats(firstMeter))), meter: firstMeter, bpm, level, noAutoBase: true,
    by: `${variable ? 'Compases variables' : firstMeter.join('/')} · nivel ${level}`,
    score: '| ' + barsOut.map(t => t.join(' ')).join(' | ') + ' |',
  };
}

// Libro: lecturas progresivas que suben hasta el nivel elegido
export function generateBook(opts, count = 12) {
  const top = Math.max(1, Math.min(MAX_LEVEL, opts.level || 3));
  const from = Math.max(1, top - 3);
  return Array.from({ length: count }, (_, i) => {
    const step = count === 1 ? 1 : i / (count - 1);
    const level = Math.round(from + (top - from) * step);
    const reading = generateReading({ ...opts, level, seed: (opts.seed || 1) * 100 + i, title: `Lectura n.º ${i + 1}` });
    return { id: `rl-${opts.seed || 1}-${i + 1}`, number: i + 1, level, song: reading };
  });
}
