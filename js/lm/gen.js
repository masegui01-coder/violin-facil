// Generadores puros del curso (sin DOM, con semilla: toda la clase recibe lo mismo): rondas del juego STOP a partir de
// la lectura rítmica de la unidad, ritmos con las figuras permitidas y preguntas de discriminación auditiva.
import { rng } from '../generate.js';
import { FIGURE_BEATS, scale, midiOf, stepOf, scoreTokens, keyAcc } from './notes.js';

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
// Voz 1 de la lectura a dos voces: el ostinato del ejercicio (campo voz1) o, si no lo trae, uno de un compás
const DEFAULT_OSTINATO = { 2: '| C4q C4e C4e |', 3: '| C4q C4e C4e C4q |', 4: '| C4q C4e C4e C4q C4e C4e |' };
const OSTINATO_GAIN = 0.5;
const WRONG_STEP = 4;               // la nota cambiada del ostinato: una tercera mayor por encima (do → mi)

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

// El ostinato que toca la app (voz 1) debajo de la lectura del alumno (voz 2): su patrón repetido desde el primer
// compás entero hasta el final de la lectura. reading: los tokens de la lectura; base: { voz1, compas, anacrusa }
export function ostinatoTokens(reading, { voz1 = null, compas = '4/4', anacrusa = 0 } = {}) {
  const barBeats = Math.round(Number(String(compas).split('/')[0]) * 4 / Number(String(compas).split('/')[1] || 4));
  const pattern = scoreTokens(voz1 || DEFAULT_OSTINATO[barBeats] || DEFAULT_OSTINATO[4]);
  const span = pattern.reduce((s, t) => s + t.beats, 0);
  const last = reading[reading.length - 1];
  const end = last ? last.start + last.beats : 0;
  const out = [];
  for (let at = anacrusa; span > 0 && at < end - EPS; at += span) {
    pattern.forEach(t => { if (at + t.start < end - EPS) out.push({ ...t, start: at + t.start, bar: Math.floor((at + t.start - anacrusa) / barBeats) + (anacrusa ? 1 : 0), gain: OSTINATO_GAIN, hold: 0 }); });
  }
  return out;
}

// Interpretación correcta de la lectura: volumen por compás (matices y reguladores) y calderón
// melodic: las notas suenan en su altura (STOP melódico); up: octavas de más (la clave de fa se oye una octava más arriba)
export function stopBase(base, { matices = [], melodic = false, up = 0 } = {}) {
  const ts = withStarts(base);
  const gains = gainsFor(ts, matices);
  const fermata = (matices.find(m => m.signo === 'calderon') || {}).compas;
  return ts.map((t, j) => {
    const bar = (t.bar ?? 0) + 1;
    const gain = gains[j];
    const lastInBar = !ts.some(x => x.bar === t.bar && x.start > t.start);
    const hold = fermata && bar === fermata && lastInBar && !t.rest ? t.beats : 0;
    const midi = t.rest ? 0 : melodic && t.midi ? t.midi + up : 72;
    return { ...t, gain, hold, midi };
  });
}

// ----- Nivel 2: contexto de la ronda (armadura, forma, melodía) y errores nuevos -----
const isNote = t => !t.rest;
const same = (a, b, d) => a && b && !a.rest && !b.rest && a.dur === d && b.dur === d;
// Notas de la escala de la tonalidad (por la armadura: fa mayor / re menor, do mayor / la menor, sol mayor / mi menor)
const SCALE_PCS = { '-1': [5, 7, 9, 10, 0, 2, 4], 0: [0, 2, 4, 5, 7, 9, 11], 1: [7, 9, 11, 0, 2, 4, 6] };
export function scaleStep(midi, dir, armadura = 0) {
  const pcs = SCALE_PCS[armadura] || SCALE_PCS[0];
  for (let m = midi + dir; Math.abs(m - midi) < 6; m += dir) if (pcs.includes(((m % 12) + 12) % 12)) return m;
  return midi + 2 * dir;
}
// Alteración que pone la armadura a una nota (si la tiene): -1 (bemol) o 1 (sostenido)
const keyedAcc = (t, armadura) => (isNote(t) && t.name ? keyAcc(t.name[0], armadura) : 0);

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
  // puntillo olvidado: negra con puntillo + corchea suena como dos negras (el mismo largo de compás)
  'q.e>qq': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'q.' && ts[i + 1] && !ts[i + 1].rest && ts[i + 1].dur === 'e', apply: (ts, i) => [{ ...ts[i], dur: 'q' }, { ...ts[i + 1], dur: 'q' }], at: 1, span: 2 },
  // blanca con puntillo cortada: blanca + silencio de negra (con la nota sostenida para que se oiga)
  'h.>h': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'h.', apply: (ts, i) => [{ ...ts[i], dur: 'h' }, { ...ts[i], dur: 'q', rest: true }], at: 2 },
  // cuatro semicorcheas tocadas como dos corcheas
  'ssss>ee': { can: (ts, i) => [0, 1, 2, 3].every(k => ts[i + k] && !ts[i + k].rest && ts[i + k].dur === 's') && Math.abs(ts[i].start % 1) < EPS, apply: (ts, i) => [{ ...ts[i], dur: 'e' }, { ...ts[i + 2], dur: 'e' }], at: 0.25, span: 4 },
  // corchea + dos semicorcheas ↔ dos semicorcheas + corchea (el grupo cambiado)
  'ess>sse': {
    can: (ts, i) => [0, 1, 2].every(k => ts[i + k] && !ts[i + k].rest) && Math.abs(ts[i].start % 1) < EPS
      && ((ts[i].dur === 'e' && ts[i + 1].dur === 's' && ts[i + 2].dur === 's') || (ts[i].dur === 's' && ts[i + 1].dur === 's' && ts[i + 2].dur === 'e')),
    apply: (ts, i) => { const d = ts[i].dur === 'e' ? ['s', 's', 'e'] : ['e', 's', 's']; return [0, 1, 2].map(k => ({ ...ts[i + k], dur: d[k] })); }, at: 0.25, span: 3,
  },
  // saltillo (corchea con puntillo + semicorchea) tocado como dos corcheas
  'e.s>ee': { can: (ts, i) => !ts[i].rest && ts[i].dur === 'e.' && ts[i + 1] && !ts[i + 1].rest && ts[i + 1].dur === 's', apply: (ts, i) => [{ ...ts[i], dur: 'e' }, { ...ts[i + 1], dur: 'e' }], at: 0.5, span: 2 },
  // 6/8 tocado como 3/4: dos negras con puntillo suenan como tres negras
  // (o una blanca con puntillo de compás entero, que se parte en tres pulsos)
  '6/8>3/4': {
    can: (ts, i) => !ts[i].rest && Math.abs(ts[i].start % 3) < EPS && ((ts[i].dur === 'q.' && ts[i + 1] && ts[i + 1].dur === 'q.') || ts[i].dur === 'h.'),
    apply: (ts, i) => (ts[i].dur === 'h.' ? [0, 1, 2].map(() => ({ ...ts[i], dur: 'q' })) : [{ ...ts[i], dur: 'q' }, { ...ts[i], dur: 'q' }, { ...ts[i + 1], dur: 'q' }]),
    at: 1, span: (ts, i) => (ts[i].dur === 'h.' ? 1 : 2),
  },
  // silencio con palmada: un silencio de corchea o de negra con puntillo suena
  'R>e': { can: (ts, i) => ts[i].rest && (ts[i].dur === 'e' || ts[i].dur === 'q.'), apply: (ts, i) => [{ ...ts[i], rest: false, midi: (ts[i - 1] && ts[i - 1].midi) || (ts[i + 1] && ts[i + 1].midi) || 72 }], at: 0 },
  // STOP melódico: la nota de la armadura suena natural (el bemol o el sostenido olvidado)
  alteracion: { can: (ts, i, bar, ctx) => !!ctx.armadura && keyedAcc(ts[i], ctx.armadura) !== 0, apply: (ts, i, ctx) => [{ ...ts[i], midi: ts[i].midi - keyedAcc(ts[i], ctx.armadura) }], at: 0 },
  // …o una nota un escalón más arriba o más abajo dentro de la tonalidad
  nota: { can: (ts, i, bar, ctx) => isNote(ts[i]) && !!ctx.melodic && i > 0, apply: (ts, i, ctx) => [{ ...ts[i], midi: scaleStep(ts[i].midi, (i % 2 ? 1 : -1), ctx.armadura || 0) }], at: 0 },
  // casillas: en la 2.ª vuelta suena otra vez la casilla 1 (en lugar de saltar a la 2)
  casilla: {
    can: (ts, i, bar, ctx) => !!ctx.form && ctx.form.kind === 'casillas' && ts[i].pass === 1 && ts[i].barNo === ctx.form.casilla2[0] && (i === 0 || ts[i - 1].barNo !== ts[i].barNo),
    span: (ts, i, ctx) => ts.filter(t => t.pass === 1 && t.barNo >= ctx.form.casilla2[0] && t.barNo <= ctx.form.casilla2[1]).length,
    apply: (ts, i, ctx) => ts.filter(t => t.pass === 0 && t.barNo >= ctx.form.casilla1[0] && t.barNo <= ctx.form.casilla1[1]).map(t => ({ ...t, pass: 1 })), at: 0,
  },
  // D.C.: no vuelve al principio (la música acaba antes de tiempo) o no para en el Fine (sigue hasta el final)
  dc: {
    can: (ts, i, bar, ctx) => !!ctx.form && ctx.form.kind === 'dc' && ts[i].pass === 1 && (i === 0 || ts[i - 1].pass === 0),
    span: ts => ts.filter(t => t.pass === 1).length,
    apply: (ts, i, ctx) => (ctx.variant === 'sigue' ? [...ts.slice(i), ...ts.filter(t => t.pass === 0 && t.barNo > ctx.form.dc.fine).map(t => ({ ...t, pass: 1 }))] : []),
    at: 0, atEnd: (ts, i, ctx) => ctx.variant === 'sigue',
  },
};
export const KINDS_OF = [
  [/puntillo olvidado/, ['q.e>qq']], [/blanca con puntillo acortada/, ['h.>h']], [/semicorcheas↔corcheas/, ['ssss>ee']], [/grupo cambiado/, ['ess>sse']],
  [/casilla equivocada/, ['casilla']], [/6\/8 tocado como 3\/4/, ['6/8>3/4']], [/silencio con palmada/, ['R>e']], [/saltillo tocado/, ['e.s>ee']],
  [/D\.C\. olvidado/, ['dc']], [/bemol olvidado|sostenido olvidado/, ['alteracion']], [/nota cambiada/, ['nota']],
  [/negra↔silencio/, ['Rq>q', 'q>Rq']], [/corcheas↔negra/, ['q>ee', 'ee>q']], [/blanca acortada/, ['h-corta']],
  [/redonda acortada/, ['w-corta']], [/silencio de compás/, ['Rw-salto']], [/compás de 4/, ['compas']],
  [/matiz/, ['matiz']], [/calderón/, ['calderon']], [/voz cambiada/, ['voz']], [/anacrusa/, ['anacrusa']],
  [/cualquier figura/, ['q>ee', 'ee>q', 'h-corta', 'Rq>q']],
];
export function stopKinds(errores = []) {
  const kinds = errores.flatMap(e => (KINDS_OF.find(([re]) => re.test(e)) || [null, []])[1]);
  return kinds.length ? [...new Set(kinds)] : ['q>ee', 'ee>q'];
}

// Los sitios donde puede caer cada tipo de error en una lectura: [{ k, i, variant? }] (para la ronda y para las pruebas)
export function stopOptions(ts, kinds, barBeats = 4, ctx = {}) {
  const out = [];
  kinds.forEach(k => {
    if (k === 'anacrusa') { if (ctx.pickup) out.push({ k, i: 0 }); return; }
    const m = MUTATIONS[k];
    if (!m) return;
    ts.forEach((t, i) => {
      if (k === 'dc') { if (m.can(ts, i, barBeats, ctx)) out.push({ k, i, variant: 'omite' }, { k, i, variant: 'sigue' }); return; }
      // la primera figura no se toca (nadie sabe aún por dónde va), salvo en los errores de altura o de forma
      if ((i > 0 || m.at > 0 || k === 'alteracion' || k === 'casilla') && m.can(ts, i, barBeats, ctx)) out.push({ k, i });
    });
  });
  return out;
}

// Una ronda: lo que suena (con el error), el pulso donde empieza el error, el código y dónde. offset: pulsos de
// silencio antes de la primera nota (la anacrusa entra en el último pulso de la claqueta: offset = compás − anacrusa).
// avoid: rondas ya jugadas («código:posición»), para no repetir la misma.
// round: número de ronda. Se sortea primero el TIPO de error (los de la unidad por turnos, así salen todos) y
// después la posición. ctx: { armadura, melodic, form, up } (STOP melódico y forma con casillas o D.C.)
export function stopRoundOf(base, { kinds, seed, barBeats = 4, matices = [], pickup = 0, avoid = new Set(), round = null, ostinato = null, ctx: ctx0 = {} }) {
  const ctx = { ...ctx0, pickup };
  const ts = stopBase(base, { matices, melodic: !!ctx.melodic, up: ctx.up || 0 });
  // el error «voz cambiada» cae en el ostinato de la app (voz 1); los demás, en la lectura (voz 2)
  const ost = ostinato || (kinds.includes('voz') ? ostinatoTokens(ts, { compas: `${barBeats}/4`, anacrusa: pickup }) : null);
  const target = k => (k === 'voz' ? ost || [] : ts);
  const r = rng(seed);
  const offset = pickup ? barBeats - pickup : 0;
  const options = kinds.flatMap(k => stopOptions(target(k), [k], barBeats, ctx));
  const fallback = ts.map((t, i) => (i > 0 && MUTATIONS['q>ee'].can(ts, i) ? { k: 'q>ee', i } : null)).filter(Boolean);
  const all = options.length ? options : fallback;
  const keyOf = o => `${o.k}:${o.i}${o.variant ? `:${o.variant}` : ''}`;
  let fresh = all.filter(o => !avoid.has(keyOf(o)));
  if (round !== null && fresh.length) {
    const offered = kinds.filter(k => fresh.some(o => o.k === k));
    if (offered.length) {
      const kind = offered[round % offered.length];
      fresh = fresh.filter(o => o.k === kind);
    }
  }
  // si los errores de la unidad ya se han jugado todos, una figura cambiada nueva antes que repetir una ronda
  const generic = ['q>ee', 'ee>q', 'h-corta', 'Rq>q'].flatMap(k => ts.map((t, i) => (i > 0 && MUTATIONS[k].can(ts, i, barBeats) ? { k, i } : null)).filter(Boolean))
    .filter(o => !avoid.has(keyOf(o)));
  const pool = fresh.length ? fresh : generic.length ? generic : all;
  const picked = pool[Math.floor(r() * pool.length)];
  const { k, i } = picked;
  const key = keyOf(picked);
  // anacrusa en tiempo fuerte: la anacrusa cae en el primer pulso, todo se adelanta y los acentos cambian de sitio
  if (k === 'anacrusa') return { played: withStarts(ts), ostinato: ost, offset: 0, errorBeat: 0, code: k, index: 0, bar: 0, key };
  const m = MUTATIONS[k];
  const src = target(k);
  const mctx = { ...ctx, variant: picked.variant };
  const spanOf = typeof m.span === 'function' ? m.span(src, i, mctx) : m.span || 1;
  const span = m.wholeBar ? src.filter(t => t.bar === src[i].bar).length : spanOf;
  const mutated = [...src.slice(0, i), ...m.apply(src, i, mctx), ...src.slice(i + span)];
  // D.C. que no para en el Fine: el error empieza donde debía parar (el final de la 2.ª vuelta)
  const atEnd = !!(m.atEnd && m.atEnd(src, i, mctx));
  const finePoint = atEnd ? ts.filter(t => t.pass === 1 && t.barNo <= ctx.form.dc.fine).reduce((e, t) => Math.max(e, t.start + t.beats), 0) : null;
  const errorBeat = offset + (atEnd ? finePoint : m.at === 'end' ? src[i].start + src[i].beats : src[i].start + m.at);
  if (k === 'voz') return { played: ts, ostinato: mutated, offset, errorBeat, code: k, index: i, bar: src[i].bar ?? 0, key };
  return { played: withStarts(mutated), ostinato: ost, offset, errorBeat, code: k, index: i, bar: src[i].bar ?? 0, key };
}

// Ventana para parar a tiempo según la tolerancia del ejercicio («1 compás», «½ pulso», «1 pulso»)
export function stopWindow(tolerancia, barBeats) {
  const m = /(½|\d+(?:[.,]\d+)?)\s*(compás|compases|pulso|pulsos)/.exec(String(tolerancia || ''));
  if (!m) return 2;
  const n = m[1] === '½' ? 0.5 : Number(m[1].replace(',', '.'));
  return /comp/.test(m[2]) ? n * barBeats : n;
}

// ---------- Ritmos con las figuras de la unidad ----------
// Una célula por su nombre: 'q', 'q.', 'h.', 'ee', 'eee', 'qe', 'q.e', 'ssss', 'ess', 'sse', 'e.s', 'Rq', 'Rq.', 'Ree'…
// (R delante = silencio). Es el mismo vocabulario de los dictados («cells») del catálogo.
const CELL_RE = /R?[whqes]\.?/g;
export const cellTokens = name => (String(name).match(CELL_RE) || []).map(p => (p[0] === 'R' ? note(p.slice(1), true) : note(p)));
// figuras: ['q','Rq','e','h'…]. Una figura suelta se completa como se escribe: 'e' va por parejas (en 6/8, de tres en tres),
// 's' en grupos de cuatro, 'e.' con su semicorchea, 'Re' con una corchea y, en 6/8, 'q' con su corchea.
function cellsFor(f, compound) {
  if (f === 'e') return [compound ? 'eee' : 'ee'];
  if (f === 's') return ['ssss', 'ess', 'sse'];
  if (f === 'e.') return ['e.s'];
  if (f === 'Re') return [compound ? 'Reee' : 'Ree'];
  if (f === 'q' && compound) return ['qe'];
  return [f];
}
export function genRhythm({ figuras, barBeats, bars, seed, compound = false }) {
  const r = rng(seed);
  const cells = figuras.flatMap(f => cellsFor(f, compound)).map(name => cellTokens(name));
  const len = c => c.reduce((s, t) => s + FIGURE_BEATS[t.dur], 0);
  const out = [];
  for (let b = 0; b < bars; b++) {
    let left = barBeats;
    const last = b === bars - 1;
    for (let guard = 0; left > EPS && guard < 40; guard++) {
      let fit = cells.filter(c => len(c) <= left + EPS);
      if (last && left === barBeats) fit = fit.filter(c => !c[0].rest) || fit;
      // lo que no cabe en ninguna célula se rellena con corcheas (un compás nunca se pasa)
      const cell = fit.length ? fit[Math.floor(r() * fit.length)] : left >= 0.5 - EPS ? [note('e')] : [note('s')];
      out.push(...cell);
      left -= len(cell);
    }
  }
  // que no acabe en silencio ni empiece con él
  if (out[0] && out[0].rest) out[0] = note(out[0].dur);
  if (out[out.length - 1].rest) out[out.length - 1] = note(out[out.length - 1].dur);
  return withStarts(out);
}

// Melodía corta con las notas de la unidad: se mueve de nota vecina en nota vecina (ordenadas de grave a agudo),
// empieza y acaba en la tónica (tonic; si no, la primera de la lista)
export function genMelody({ notas, bars, barBeats, seed, figures = ['q', 'h'], tonic = null }) {
  const r = rng(seed);
  const order = [...new Set(notas)].sort((a, b) => midiOf(a) - midiOf(b));
  const home = tonic && order.includes(tonic) ? tonic : notas[0];
  const out = [];
  let idx = order.indexOf(home);
  for (let b = 0; b < bars; b++) {
    let left = barBeats;
    while (left > EPS) {
      const fit = figures.filter(f => FIGURE_BEATS[f] <= left + EPS);
      const dur = fit[Math.floor(r() * fit.length)] || (left >= 0.5 - EPS ? 'e' : 's');
      idx = Math.max(0, Math.min(order.length - 1, idx + Math.floor(r() * 3) - 1));
      out.push({ rest: false, dur, name: order[idx], bar: b });
      left -= FIGURE_BEATS[dur];
    }
  }
  out[out.length - 1] = { ...out[out.length - 1], name: home };
  // con su altura (midi) y su escalón: la lectura cantada y el dictado del repaso la necesitan
  return withStarts(out).map(t => ({ ...t, midi: midiOf(t.name), step: stepOf(t.name) }));
}

// ---------- Discriminación auditiva ----------
const METERS = [['2/4', 2, 'De dos'], ['3/4', 3, 'De tres'], ['4/4', 4, 'De cuatro']];
export function meterQuestions(count, seed) {
  const r = rng(seed);
  return Array.from({ length: count }, (_, k) => {
    const m = Math.floor(r() * METERS.length);
    const [meter, beats] = METERS[m];
    const bar = ['C3q', ...Array(beats - 1).fill('G4q')].join(' ');
    return { tipo: 'escucharCompas', id: `compas-${k}`, code: 'compas', q: '¿De cuántos pulsos es el compás?', options: METERS.map(x => x[2]),
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
    return { tipo: 'escucharIntervalo', id: `semitono-${k}`, code: 'semitono-oido', q: 'Escucha la escalera: ¿dónde está el peldaño corto?', options: PAIR_NAMES,
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
    return { tipo: 'escucharModo', id: `modo-${k}`, code: 'modo', q: 'Escucha: ¿mayor o menor?', options: ['Mayor', 'Menor'], answer: isMinor ? 1 : 0,
      play: { partitura: `| ${toks.join(' ')} |`, tempo: 84 }, why: isMinor ? 'Menor: suena más oscuro (la-do-mi).' : 'Mayor: luminoso (do-mi-sol).' };
  });
}

// ¿Qué canción es? La app palmea el ritmo de una canción y se elige entre las de la lista
export function songQuestions(songs, count, seed) {
  const r = rng(seed);
  return Array.from({ length: count }, (_, k) => {
    const pick = Math.floor(r() * songs.length);
    const bars = songs[pick].partitura.split('|').map(x => x.trim()).filter(Boolean).slice(0, 4);
    return { tipo: 'escucharForma', id: `cancion-${k}`, code: 'cancion', q: '¿Qué canción es? Escucha su ritmo', options: songs.map(s => s.titulo), answer: pick,
      play: { partitura: `| ${bars.join(' | ')} |`, clap: true, tempo: songs[pick].tempo || 84 }, why: `Era «${songs[pick].titulo}».` };
  });
}

// ---------- Discriminación con las opciones escritas en el catálogo (Nivel 2) ----------
// opciones: ritmo de un pulso («s s s s», «e s s», «e. s», «e e»), compás («3/4», «6/8») o modo con armadura («Fa mayor», «Re menor»)
const RHYTHM_OPTION = /^([es]\.?)( [es]\.?)*$/;
const cellOf = text => (String(text).match(/[es]\.?/g) || []).map(d => `C5${d}`).join(' ');
export function choiceQuestions(p, count, seed) {
  const r = rng(seed);
  const options = p.opciones;
  const pick = k => (k % 3 === 0 ? Math.floor(r() * options.length) : (Math.floor(r() * options.length) + k) % options.length);
  // 1) células de ritmo dentro de un pulso: la app palmea la célula cuatro compases y se elige cuál era
  if (options.every(o => RHYTHM_OPTION.test(o))) {
    return Array.from({ length: count }, (_, k) => {
      const a = pick(k);
      const bar = `${cellOf(options[a])} ${cellOf(options[a])}`;
      return { tipo: 'escucharForma', id: `ritmo-${k}`, code: 'ritmo', q: 'Escucha el ritmo de un pulso: ¿cuál es?', options: [...options], answer: a,
        play: { partitura: `| ${Array(4).fill(bar).join(' | ')} |`, clap: true, tempo: 76 }, why: `Era «${options[a]}».` };
    });
  }
  // 2) 3/4 o 6/8: seis corcheas con el apoyo (el golpe grave) cada dos o cada tres
  if (options.length === 2 && options.every(o => /^[36]\/[48]$/.test(o))) {
    return Array.from({ length: count }, (_, k) => {
      const a = pick(k);
      const six = options[a] === '6/8' ? ['C3e', 'G4e', 'G4e', 'C3e', 'G4e', 'G4e'] : ['C3e', 'G4e', 'C3e', 'G4e', 'C3e', 'G4e'];
      return { tipo: 'escucharCompas', id: `compas-${k}`, code: '6/8>3/4', q: 'Escucha dónde cae el apoyo: ¿3/4 o 6/8?', options: [...options], answer: a,
        play: { partitura: `| ${Array(4).fill(six.join(' ')).join(' | ')} |`, compas: options[a], tempo: 138 },
        why: options[a] === '6/8' ? 'El apoyo llega cada tres corcheas: dos grandes pulsos.' : 'El apoyo llega cada dos corcheas: tres pulsos.' };
    });
  }
  // 3) mayor o menor con armadura: fa mayor frente a re menor
  const major = scale('F4');
  const minor = scale('D4', 'menor');
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const isMinor = /menor/i.test(options[a]);
    const shape = SHAPES[(k * 2 + Math.floor(r() * SHAPES.length)) % SHAPES.length];
    const notes = shape.map(d => (isMinor ? minor : major)[d - 1]);
    const toks = notes.map((n, i) => `${n}${i === notes.length - 1 ? 'h' : 'q'}`);
    return { tipo: 'escucharModo', id: `modo-${k}`, code: 'modo', q: 'Escucha: ¿en qué tonalidad está?', options: [...options], answer: a,
      play: { partitura: `| ${toks.join(' ')} |`, tempo: 84, armadura: -1 }, why: isMinor ? 'Re menor: suena más oscuro (re-fa-la).' : 'Fa mayor: luminoso (fa-la-do).' };
  });
}
