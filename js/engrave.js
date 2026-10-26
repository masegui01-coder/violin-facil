// Grabado de partituras para leer e imprimir (libro de lecturas): renglones justificados con barras de corcheas por
// pulso, grupos irregulares, ligaduras, articulaciones, matices, reguladores, indicaciones de tempo y agógica, cambios
// de compás, clave y armadura. Entra una partitura de parseScore y salen los renglones como SVG en texto.
import { diatonicStep, keySignature, meterBeats } from './music.js';

const W = 760;              // ancho de cada renglón
const SYS_H = 204;          // alto de cada renglón
const SP = 10;              // espacio entre líneas
const H = SP / 2;
const TOP = 76;             // línea superior del pentagrama
const BOTTOM = TOP + 4 * SP;
const DYN_Y = BOTTOM + 52;  // línea de matices y reguladores
const TEXT_Y = TOP - 44;    // indicaciones sobre el pentagrama (rit., técnica…)
const INK = '#141414';
const MUSIC_FONT = '"Noto Music", "Bravura", "Segoe UI Symbol", "Apple Symbols", serif';
const SERIF = '"Times New Roman", "Young Serif", Georgia, serif';
const CLEF_BASE = { treble: 30, bass: 18, alto: 24, tenor: 22, perc: 30 };
const CLEF_GLYPH = { treble: '𝄞', bass: '𝄢', alto: '𝄡', tenor: '𝄡', perc: '𝄥' };
const KEY_STEPS = {
  treble: { sharp: [38, 35, 39, 36, 33, 37, 34], flat: [34, 37, 33, 36, 32, 35, 31] },
  bass: { sharp: [24, 21, 25, 22, 19, 23, 20], flat: [20, 23, 19, 22, 18, 21, 17] },
  alto: { sharp: [31, 28, 32, 29, 26, 30, 27], flat: [27, 30, 26, 29, 25, 28, 24] },
  tenor: { sharp: [24, 28, 25, 29, 26, 30, 27], flat: [27, 30, 26, 29, 25, 28, 24] },
};
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
const ACC_GLYPH = { 1: '♯', '-1': '♭', 0: '♮', 2: '𝄪', '-2': '𝄫' };
const BEAMS = { e: 1, s: 2, t: 3 };
const UNIT_GLYPH = { q: '♩', e: '♪', h: '𝅗𝅥', 'q.': '♩.' };

const r1 = v => Math.round(v * 10) / 10;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const txt = (x, y, s, { size = 14, italic = false, bold = false, anchor = 'start', font = SERIF } = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-family='${font}' font-size="${size}"${italic ? ' font-style="italic"' : ''}${bold ? ' font-weight="700"' : ''} text-anchor="${anchor}" fill="${INK}">${esc(s)}</text>`;
const line = (x1, y1, x2, y2, w = 1.2) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${INK}" stroke-width="${w}"/>`;

// Grupos de pulso del compás (en negras) para unir corcheas y semicorcheas
export function beatGroups(meter) {
  const [num, den] = meter;
  if (den === 8 && num % 3 === 0) return Array.from({ length: num / 3 }, () => 1.5);
  if (den === 8) {
    if (num === 5) return [1, 1.5];
    if (num === 7) return [1, 1, 1.5];
    return Array.from({ length: Math.ceil(num / 2) }, (_, i) => (i === Math.ceil(num / 2) - 1 && num % 2 ? 0.5 : 1));
  }
  return Array.from({ length: Math.round(meterBeats(meter)) }, () => 1);
}

const keyCountOf = key => { const sig = keySignature(key); const n = Object.keys(sig).length; return n && Object.values(sig)[0] < 0 ? -n : n; };

// Becuadros de cancelación: las alteraciones de la armadura anterior que ya no están (o cambian de signo)
function cancelSvg(x, oldKey, newKey, clef) {
  const oldN = keyCountOf(oldKey);
  const newSig = keySignature(newKey);
  const table = KEY_STEPS[clef] || KEY_STEPS.treble;
  const order = oldN >= 0 ? SHARP_ORDER : FLAT_ORDER;
  const steps = (oldN >= 0 ? table.sharp : table.flat).slice(0, Math.abs(oldN)).filter((st, i) => newSig[order[i]] !== (oldN >= 0 ? 1 : -1));
  const base = CLEF_BASE[clef] ?? 30;
  return { svg: steps.map((st, i) => txt(x + i * 8, BOTTOM - (st - base) * H + 5, '♮', { size: 18, font: MUSIC_FONT })).join(''), width: steps.length ? steps.length * 8 + 4 : 0 };
}

function keySigSvg(x, key, clef) {
  const n = keyCountOf(key);
  const table = KEY_STEPS[clef] || KEY_STEPS.treble;
  const steps = n >= 0 ? table.sharp.slice(0, n) : table.flat.slice(0, -n);
  const base = CLEF_BASE[clef] ?? 30;
  return { svg: steps.map((st, i) => txt(x + i * 9, BOTTOM - (st - base) * H + (n >= 0 ? 5 : 4), n >= 0 ? '♯' : '♭', { size: 19, font: MUSIC_FONT })).join(''), width: steps.length * 9 };
}

function clefSvg(x, clef, small = false) {
  const s = small ? 0.75 : 1;
  if (clef === 'bass') return txt(x, TOP + 12 * s + (small ? 2 : 0), CLEF_GLYPH.bass, { size: 42 * s, font: MUSIC_FONT });
  if (clef === 'alto' || clef === 'tenor') {
    const mid = clef === 'alto' ? TOP + 2 * SP : TOP + SP;
    return txt(x, mid + 20 * s, CLEF_GLYPH.alto, { size: 40 * s, font: MUSIC_FONT });
  }
  return txt(x, BOTTOM + 10 * s - (small ? 6 : 0), CLEF_GLYPH.treble, { size: 62 * s, font: MUSIC_FONT });
}

function timeSigSvg(x, meter) {
  return txt(x, TOP + SP * 1.7, String(meter[0]), { size: 24, bold: true, anchor: 'middle' }) + txt(x, TOP + SP * 3.7, String(meter[1]), { size: 24, bold: true, anchor: 'middle' });
}

const noteWidth = n => 10 + 24 * Math.sqrt(n.beats) + (n.grace ? 12 : 0);

// ---------- Reparto en renglones ----------
function barInfo(score, opts) {
  let meter = opts.meter;
  let clef = opts.clef || 'treble';
  let key = opts.key || 'C';
  return score.bars.map((b, i) => {
    const notes = score.notes.filter(n => n.bar === i);
    const first = notes[0] || {};
    const m = first.marks || {};
    const prevKey = key;
    const changes = {
      meter: m.meter && i > 0 ? m.meter[m.meter.length - 1] : null,
      clef: m.clef && i > 0 && m.clef[m.clef.length - 1] !== clef ? m.clef[m.clef.length - 1] : null,
      key: m.key && i > 0 && m.key[m.key.length - 1] !== key ? m.key[m.key.length - 1] : null,
    };
    if (i === 0 && m.meter) meter = m.meter[0];
    if (i === 0 && m.clef) clef = m.clef[0];
    if (i === 0 && m.key) key = m.key[0];
    if (changes.meter) meter = changes.meter;
    if (changes.clef) clef = changes.clef;
    if (changes.key) key = changes.key;
    const extra = (changes.clef ? 26 : 0) + (changes.key ? (Math.abs(keyCountOf(changes.key)) + Math.abs(keyCountOf(prevKey))) * 9 + 18 : 0) + (changes.meter ? 26 : 0);
    const natural = notes.reduce((s, n) => s + noteWidth(n), 0) + 18 + extra;
    return { index: i, bar: b, notes, meter, clef, key, prevKey, changes, extra, natural };
  });
}

function prefixWidth(info, first) {
  return 44 + Math.abs(keyCountOf(info.key)) * 9 + 8 + (first || info.changes.meter ? 26 : 0);
}

export function layoutSystems(score, opts) {
  const bars = barInfo(score, opts);
  const systems = [];
  let cur = [];
  bars.forEach(b => {
    const pre = prefixWidth(cur[0] || b, systems.length === 0 && !cur.length);
    const used = cur.reduce((s, x) => s + x.natural, 0);
    if (cur.length && (used + b.natural > W - pre - 8 || cur.length >= (opts.maxBars || 6))) { systems.push(cur); cur = []; }
    cur.push(b);
  });
  if (cur.length) systems.push(cur);
  return systems;
}

// ---------- Dibujo de un renglón ----------
export function engrave(score, opts = {}) {
  const systems = layoutSystems(score, opts);
  const state = { hairpin: null, ottava: null, tieFrom: null, slurOpen: false };
  return systems.map((sys, k) => drawSystem(score, sys, k, k === systems.length - 1, opts, state));
}

function drawSystem(score, sys, k, last, opts, state) {
  const first = sys[0];
  const out = [];
  for (let i = 0; i < 5; i++) out.push(line(0, TOP + i * SP, W, TOP + i * SP, 1));
  // prefijo: clave, armadura y compás (el compás solo al principio o si cambia aquí)
  out.push(clefSvg(4, first.clef));
  let x = 42;
  if (first.changes.key && first.prevKey) { const c = cancelSvg(x, first.prevKey, first.key, first.clef); out.push(c.svg); x += c.width; }
  const ks = keySigSvg(x, first.key, first.clef);
  out.push(ks.svg);
  x += ks.width + 8;
  if (k === 0 || first.changes.meter) { out.push(timeSigSvg(x + 10, first.meter)); x += 26; }
  out.push(txt(2, TOP - 12, String(first.index + 1), { size: 11, italic: true }));
  if (k === 0 && opts.tempo) out.push(txt(44, TEXT_Y - 4, `${opts.tempo.label ? opts.tempo.label + ' ' : ''}${UNIT_GLYPH[opts.tempo.unit] || '♩'} = ${opts.tempo.bpm}`, { size: 14, bold: true }));
  const natural = sys.reduce((s, b) => s + b.natural, 0);
  const room = W - x - 6;
  const stretch = last && natural < room * 0.7 ? Math.min(1.35, room / natural) : room / natural;
  const placed = [];
  sys.forEach((b, bi) => {
    let cx = x + 10;
    if (bi > 0 || first.changes.meter || first.changes.clef || first.changes.key) {
      if (bi > 0 && b.changes.key) { out.push(line(x - 3, TOP, x - 3, BOTTOM, 1)); }
      if (bi > 0 && b.changes.clef) { out.push(clefSvg(cx - 4, b.changes.clef, true)); cx += 26; }
      if (bi > 0 && b.changes.key) {
        const c = cancelSvg(cx, sys[bi - 1].key, b.changes.key, b.clef);
        out.push(c.svg);
        cx += c.width;
        const s = keySigSvg(cx, b.changes.key, b.clef);
        out.push(s.svg);
        cx += s.width + 14;
      }
      if (bi > 0 && b.changes.meter) { out.push(timeSigSvg(cx + 6, b.changes.meter)); cx += 26; }
    }
    const scale = (b.natural * stretch - (cx - x) - 8) / Math.max(1, b.natural - b.extra - 18);
    b.notes.forEach(n => {
      const gx = n.grace ? 12 : 0;
      placed.push({ n, x: cx + gx + 8, bar: b });
      cx += noteWidth(n) * scale;
    });
    x += b.natural * stretch;
    const finalBar = last && bi === sys.length - 1 && b.index === score.bars.length - 1;
    if (finalBar) { out.push(line(x - 6, TOP, x - 6, BOTTOM, 1.2)); out.push(`<rect x="${r1(x - 3)}" y="${TOP}" width="3.5" height="${4 * SP}" fill="${INK}"/>`); }
    else out.push(line(x - 2, TOP, x - 2, BOTTOM, 1.2));
    const next = score.bars[b.index + 1] && score.notes.find(n => n.bar === b.index + 1);
    if (next && next.marks && next.marks.key) out.push(line(x - 6, TOP, x - 6, BOTTOM, 1.2));
  });
  out.push(drawNotes(placed, opts, state, last));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${SYS_H}" class="engraved">${out.join('')}</svg>`;
}

function drawNotes(placed, opts, state, lastSystem) {
  const out = [];
  const yOf = p => BOTTOM - (diatonicStep(p.n) - (CLEF_BASE[p.bar.clef] ?? 30) - (p.ottava ? 7 : 0)) * H;
  // 8va: las notas bajo la línea de puntos se escriben una octava más baja
  placed.forEach(p => {
    const m = p.n.marks || {};
    if (m.ottava && m.ottava.includes('start')) state.ottava = { x: p.x - 6 };
    p.ottava = !!state.ottava && !p.n.rest;
    if (m.ottava && m.ottava.includes('end') && state.ottava) {
      out.push(txt(state.ottava.x, TEXT_Y + 14, '8va', { size: 13, italic: true, bold: true }) + `<line x1="${r1(state.ottava.x + 24)}" y1="${TEXT_Y + 10}" x2="${r1(p.x)}" y2="${TEXT_Y + 10}" stroke="${INK}" stroke-dasharray="4 4"/>` + line(p.x, TEXT_Y + 10, p.x, TEXT_Y + 18));
      state.ottava = null;
    }
  });
  if (state.ottava) { out.push(txt(state.ottava.x, TEXT_Y + 14, '8va', { size: 13, italic: true, bold: true }) + `<line x1="${r1(state.ottava.x + 24)}" y1="${TEXT_Y + 10}" x2="${W - 4}" y2="${TEXT_Y + 10}" stroke="${INK}" stroke-dasharray="4 4"/>`); state.ottava.x = 50; }
  placed.forEach(p => { p.y = p.n.rest ? null : yOf(p); });

  // plicas y barras por grupos de pulso
  const groups = beamGroupsOf(placed);
  groups.forEach(g => layoutStems(g));
  placed.filter(p => !p.n.rest && !p.stem && p.n.dur !== 'w').forEach(p => layoutStems([p]));

  // accidentes con memoria dentro del compás
  let barMem = null;
  let barIdx = -1;
  placed.forEach(p => {
    if (p.bar.index !== barIdx) { barIdx = p.bar.index; barMem = {}; }
    if (p.n.rest) return;
    const sig = keySignature(p.n.key || p.bar.key);
    const id = p.n.letter + p.n.oct;
    const expected = id in barMem ? barMem[id] : (sig[p.n.letter] || 0);
    if (p.n.acc !== expected && !p.tiedIn) p.acc = p.n.acc;
    barMem[id] = p.n.acc;
  });

  placed.forEach(p => out.push(p.n.rest ? restSvg(p) : noteSvg(p)));
  groups.forEach(g => out.push(beamSvg(g)));
  out.push(tupletsSvg(placed));
  out.push(curvesSvg(placed, state));
  out.push(marksSvg(placed, state));
  return out.join('');
}

// ---------- Plicas y barras ----------
function beamGroupsOf(placed) {
  const groups = [];
  let cur = [];
  let key = null;
  const flush = () => { if (cur.length > 1) groups.push(cur); cur = []; key = null; };
  placed.forEach(p => {
    const n = p.n;
    const beamable = !n.rest && BEAMS[n.dur];
    if (!beamable) { flush(); return; }
    const segs = beatGroups(p.bar.meter);
    const local = n.start - p.bar.bar.start;
    let acc = 0;
    let seg = 0;
    while (seg < segs.length - 1 && local >= acc + segs[seg] - 1e-6) { acc += segs[seg]; seg++; }
    const k = n.tupletId ? `t${n.tupletId}` : `${p.bar.index}:${seg}`;
    if (key !== null && k !== key) flush();
    key = k;
    cur.push(p);
  });
  flush();
  return groups;
}

function layoutStems(group) {
  const mid = TOP + 2 * SP;
  const avg = group.reduce((s, p) => s + p.y, 0) / group.length;
  const up = avg > mid;
  if (group.length === 1) {
    const p = group[0];
    let tip = up ? p.y - 34 : p.y + 34;
    if (up && tip > mid) tip = mid;
    if (!up && tip < mid) tip = mid;
    p.stem = { up, x: up ? p.x + 5.6 : p.x - 5.6, tip };
    return;
  }
  const f = group[0];
  const l = group[group.length - 1];
  const slope = Math.max(-0.14, Math.min(0.14, ((l.y - f.y) / Math.max(1, l.x - f.x)) * 0.5));
  const at = (p, a) => a + slope * (p.x - f.x);
  const depth = Math.max(...group.map(p => BEAMS[p.n.dur])) - 1;
  const minLen = 28 + depth * 6;
  let a = up ? Math.min(...group.map(p => p.y - minLen - slope * (p.x - f.x))) : Math.max(...group.map(p => p.y + minLen - slope * (p.x - f.x)));
  // la barra no debe quedar lejos del pentagrama
  if (up && at(f, a) > mid) a = mid - slope * 0;
  if (!up && at(f, a) < mid) a = mid;
  group.forEach(p => { p.stem = { up, x: up ? p.x + 5.6 : p.x - 5.6, tip: at(p, a) }; p.beamed = true; });
  group.beam = { up, slope, a, f };
}

function beamSvg(g) {
  const { up } = g.beam;
  const out = [];
  const levels = Math.max(...g.map(p => BEAMS[p.n.dur]));
  for (let lv = 1; lv <= levels; lv++) {
    const off = (lv - 1) * 7 * (up ? 1 : -1);
    for (let i = 0; i < g.length; i++) {
      const p = g[i];
      if (BEAMS[p.n.dur] < lv) continue;
      const nx = g[i + 1];
      if (lv === 1 || (nx && BEAMS[nx.n.dur] >= lv)) {
        if (!nx) continue;
        out.push(beamPoly(p.stem.x, p.stem.tip + off, nx.stem.x, nx.stem.tip + off, up));
      } else {
        const pv = g[i - 1];
        if (pv && BEAMS[pv.n.dur] >= lv) continue;
        const left = !nx || (pv && pv.n.dots);
        const x2 = left ? p.stem.x - 9 : p.stem.x + 9;
        const t2 = p.stem.tip + (x2 - p.stem.x) * g.beam.slope;
        out.push(beamPoly(Math.min(p.stem.x, x2), (left ? t2 : p.stem.tip) + off, Math.max(p.stem.x, x2), (left ? p.stem.tip : t2) + off, up));
      }
    }
  }
  return out.join('');
}
const beamPoly = (x1, y1, x2, y2, up) => { const t = up ? 4.6 : -4.6; return `<polygon points="${r1(x1)},${r1(y1)} ${r1(x2)},${r1(y2)} ${r1(x2)},${r1(y2 + t)} ${r1(x1)},${r1(y1 + t)}" fill="${INK}"/>`; };

// ---------- Notas y silencios ----------
function ledgers(p) {
  const out = [];
  for (let yy = BOTTOM + SP; yy <= p.y + 0.1; yy += SP) out.push(line(p.x - 10, yy, p.x + 10, yy, 1.2));
  for (let yy = TOP - SP; yy >= p.y - 0.1; yy -= SP) out.push(line(p.x - 10, yy, p.x + 10, yy, 1.2));
  return out.join('');
}

function headSvg(x, y, n, scale = 1) {
  if (n.xhead) return `<path d="M${r1(x - 5)} ${r1(y - 5)} L${r1(x + 5)} ${r1(y + 5)} M${r1(x - 5)} ${r1(y + 5)} L${r1(x + 5)} ${r1(y - 5)}" stroke="${INK}" stroke-width="1.8"/>`;
  if (n.dur === 'w') return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${7.4 * scale}" ry="${4.8 * scale}" fill="none" stroke="${INK}" stroke-width="2.2"/>`;
  const hollow = n.dur === 'h';
  return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${6.2 * scale}" ry="${4.5 * scale}" transform="rotate(-22 ${r1(x)} ${r1(y)})" fill="${hollow ? '#fff' : INK}" stroke="${INK}" stroke-width="${hollow ? 1.8 : 0.6}"/>`;
}

function noteSvg(p) {
  const { n, x, y } = p;
  const out = [ledgers(p), headSvg(x, y, n)];
  if (p.acc !== undefined) out.push(txt(x - 19, y + 5, ACC_GLYPH[p.acc], { size: 17, font: MUSIC_FONT }));
  const onLine = Math.round((BOTTOM - y) / H) % 2 === 0;
  for (let d = 0; d < (n.dots || 0); d++) out.push(`<circle cx="${r1(x + 11 + d * 5)}" cy="${r1(onLine ? y - H : y)}" r="1.9" fill="${INK}"/>`);
  if (p.stem) {
    out.push(line(p.stem.x, y + (p.stem.up ? -1 : 1), p.stem.x, p.stem.tip, 1.3));
    if (!p.beamed && BEAMS[n.dur]) out.push(flags(p.stem.x, p.stem.tip, BEAMS[n.dur], p.stem.up));
  }
  if (n.grace) n.grace.forEach((g, i) => out.push(graceSvg(p, g, i, n.grace.length)));
  return out.join('');
}

function flags(sx, tip, count, up) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const fy = tip + (up ? i * 7 : -i * 7);
    const d = up ? `M${r1(sx)} ${r1(fy)} c1 7 9 10 8 19 c2 -8 -3 -12 -8 -14z` : `M${r1(sx)} ${r1(fy)} c1 -7 9 -10 8 -19 c2 8 -3 12 -8 14z`;
    out.push(`<path d="${d}" fill="${INK}"/>`);
  }
  return out.join('');
}

function graceSvg(p, g, i, count) {
  const gy = BOTTOM - (diatonicStep(g) - (CLEF_BASE[p.bar.clef] ?? 30)) * H;
  const gx = p.x - 16 - (count - 1 - i) * 9;
  const sig = keySignature(p.n.key || p.bar.key);
  const acc = g.acc !== (sig[g.letter] || 0) ? txt(gx - 13, gy + 4, ACC_GLYPH[g.acc], { size: 12, font: MUSIC_FONT }) : '';
  return headSvg(gx, gy, { dur: 'e' }, 0.65) + acc + line(gx + 3.8, gy - 1, gx + 3.8, gy - 22, 1) + `<path d="M${r1(gx + 3.8)} ${r1(gy - 22)} c1 5 6 7 5 12" fill="none" stroke="${INK}" stroke-width="1"/>`
    + line(gx - 1, gy - 8, gx + 9, gy - 16, 1) + `<path d="M${r1(gx)} ${r1(gy + 6)} Q${r1((gx + p.x) / 2)} ${r1(Math.max(gy, p.y) + 12)} ${r1(p.x - 4)} ${r1(p.y + 6)}" fill="none" stroke="${INK}" stroke-width="1"/>`;
}

function restSvg(p) {
  const { n, x } = p;
  const mid = TOP + 2 * SP;
  const dots = Array.from({ length: n.dots || 0 }, (_, d) => `<circle cx="${r1(x + 10 + d * 5)}" cy="${mid - H}" r="1.9" fill="${INK}"/>`).join('');
  if (n.dur === 'w') return `<rect x="${r1(x - 6)}" y="${TOP + SP}" width="12" height="5" fill="${INK}"/>` + dots;
  if (n.dur === 'h') return `<rect x="${r1(x - 6)}" y="${mid - 5}" width="12" height="5" fill="${INK}"/>` + dots;
  if (n.dur === 'q') return `<path d="M${r1(x - 2)} ${mid - 15} l6 7.5 -5 6 6 8 c-5 -2 -8 1 -4 5 c-7 -3 -6 -9 0 -7 l-6 -7.5 5 -6z" fill="${INK}"/>` + dots;
  const k = BEAMS[n.dur];
  const top = mid - 8 - (k - 1) * 3;
  const parts = [];
  for (let i = 0; i < k; i++) {
    const fy = top + i * 9;
    const fx = x - 4 - i * 1.6;
    parts.push(`<circle cx="${r1(fx)}" cy="${r1(fy)}" r="2.6" fill="${INK}"/><path d="M${r1(fx)} ${r1(fy + 1.5)} q5 1 ${r1(8.5 - i * 1.6 + i * 1.6)} -4" fill="none" stroke="${INK}" stroke-width="1.4"/>`);
  }
  parts.push(line(x + 4.5, top - 3, x - 1 - k * 1.6, top + 14 + (k - 1) * 9, 1.5));
  return parts.join('') + dots;
}

// ---------- Grupos irregulares ----------
function tupletsSvg(placed) {
  const ids = [...new Set(placed.filter(p => p.n.tupletId).map(p => p.n.tupletId))];
  return ids.map(id => {
    const g = placed.filter(p => p.n.tupletId === id);
    const notes = g.filter(p => !p.n.rest && p.stem);
    const up = notes.length ? notes[0].stem.up : true;
    const allBeamed = g.every(p => p.beamed);
    const x1 = g[0].x - 6;
    const x2 = g[g.length - 1].x + 6;
    const ext = up ? Math.min(TOP - 4, ...g.map(p => (p.stem ? p.stem.tip : p.y ?? TOP + 2 * SP) - 4), ...g.map(p => (p.y ?? TOP) - 10))
      : Math.max(BOTTOM + 4, ...g.map(p => (p.stem ? p.stem.tip : p.y ?? BOTTOM) + 4), ...g.map(p => (p.y ?? BOTTOM) + 10));
    const ny = up ? ext - 6 : ext + 14;
    const label = txt((x1 + x2) / 2, ny, String(g[0].n.tuplet), { size: 12, italic: true, bold: true, anchor: 'middle' });
    if (allBeamed) return label;
    const by = up ? ny - 4 : ny - 10;
    const hook = up ? 5 : -5;
    return label + `<path d="M${r1(x1)} ${r1(by + hook)} L${r1(x1)} ${r1(by)} L${r1((x1 + x2) / 2 - 8)} ${r1(by)} M${r1((x1 + x2) / 2 + 8)} ${r1(by)} L${r1(x2)} ${r1(by)} L${r1(x2)} ${r1(by + hook)}" fill="none" stroke="${INK}" stroke-width="1"/>`;
  }).join('');
}

// ---------- Ligaduras ----------
function arc(x1, y1, x2, y2, above) {
  const h = (above ? -1 : 1) * Math.min(9, 4 + (x2 - x1) * 0.04);
  const mx = (x1 + x2) / 2;
  const base = (y1 + y2) / 2;
  return `<path d="M${r1(x1)} ${r1(y1)} Q${r1(mx)} ${r1(base + h * 2)} ${r1(x2)} ${r1(y2)} Q${r1(mx)} ${r1(base + h * 1.5)} ${r1(x1)} ${r1(y1)}Z" fill="${INK}"/>`;
}

function curvesSvg(placed, state) {
  const out = [];
  const notes = placed.filter(p => !p.n.rest);
  // ligaduras de prolongación (con la nota siguiente)
  if (state.tieFrom && notes[0]) { const p = notes[0]; out.push(arc(20 + 60, p.y + 7, p.x - 7, p.y + 7, false)); state.tieFrom = null; }
  notes.forEach((p, i) => {
    if (!p.n.tie) return;
    const q = notes[i + 1];
    const above = p.stem ? !p.stem.up : true;
    const dy = above ? -7 : 7;
    if (q) { q.tiedIn = true; out.push(arc(p.x + 7, p.y + dy, q.x - 7, q.y + dy, above)); }
    else { out.push(arc(p.x + 7, p.y + dy, W - 6, p.y + dy, above)); state.tieFrom = true; }
  });
  // ligaduras de expresión
  let open = state.slurOpen ? { x: 70, y: null } : null;
  notes.forEach(p => {
    if (p.n.slurStart) open = { p };
    if (p.n.slurEnd && open) {
      const a = open.p || null;
      const span = notes.filter(q => (!a || q.x >= a.x) && q.x <= p.x);
      const stemsUp = span.filter(q => q.stem && q.stem.up).length;
      const above = stemsUp < span.length / 2;
      const ext = above ? Math.min(...span.map(q => Math.min(q.y, q.stem && !q.stem.up ? q.y : (q.stem ? q.stem.tip : q.y)))) - 6
        : Math.max(...span.map(q => Math.max(q.y, q.stem && q.stem.up ? q.y : (q.stem ? q.stem.tip : q.y)))) + 6;
      const x1 = a ? a.x : 64;
      const y1 = a ? a.y + (above ? -8 : 8) : ext;
      const y2 = p.y + (above ? -8 : 8);
      const peak = above ? Math.min(ext, y1 - 8, y2 - 8) : Math.max(ext, y1 + 8, y2 + 8);
      out.push(slurPath(x1, y1, p.x, y2, peak));
      open = null;
    }
  });
  if (open && open.p) {
    const a = open.p;
    const above = a.stem ? !a.stem.up : true;
    const y1 = a.y + (above ? -8 : 8);
    out.push(slurPath(a.x, y1, W - 8, y1, y1 + (above ? -10 : 10)));
    state.slurOpen = true;
  } else state.slurOpen = false;
  return out.join('');
}

function slurPath(x1, y1, x2, y2, peak) {
  const c1 = peak + (peak < y1 ? 2 : -2);
  return `<path d="M${r1(x1)} ${r1(y1)} C${r1(x1 + (x2 - x1) * 0.25)} ${r1(peak)} ${r1(x2 - (x2 - x1) * 0.25)} ${r1(peak)} ${r1(x2)} ${r1(y2)} C${r1(x2 - (x2 - x1) * 0.25)} ${r1(c1)} ${r1(x1 + (x2 - x1) * 0.25)} ${r1(c1)} ${r1(x1)} ${r1(y1)}Z" fill="${INK}"/>`;
}

// ---------- Articulaciones, matices, reguladores y textos ----------
function marksSvg(placed, state) {
  const out = [];
  const lowest = Math.max(BOTTOM, ...placed.filter(p => p.y !== null).map(p => Math.max(p.y, p.stem && !p.stem.up ? p.stem.tip : p.y)));
  const dynY = Math.max(DYN_Y, lowest + 22);
  if (state.hairpin) state.hairpin.x = 60;
  const closeHairpin = x2 => {
    const h = state.hairpin;
    state.hairpin = null;
    if (!h || x2 - h.x < 12) return;
    const y = dynY - 5;
    const [open, point] = h.kind === 'cresc' ? [x2, h.x] : [h.x, x2];
    out.push(`<path d="M${r1(open)} ${r1(y - 5)} L${r1(point)} ${r1(y)} L${r1(open)} ${r1(y + 5)}" fill="none" stroke="${INK}" stroke-width="1.1"/>`);
  };
  placed.forEach((p, i) => {
    const n = p.n;
    const m = n.marks || {};
    const up = p.stem ? p.stem.up : true;
    const headSide = up ? 1 : -1; // las articulaciones van al lado contrario de la plica
    if (!n.rest) {
      let ay = p.y + headSide * 10;
      if (headSide < 0 && ay > TOP - 2 && ay < BOTTOM) ay = Math.min(ay, p.y - 9);
      if (n.staccato) { out.push(`<circle cx="${r1(p.x)}" cy="${r1(ay)}" r="1.9" fill="${INK}"/>`); ay += headSide * 6; }
      if (n.tenuto) { out.push(line(p.x - 5, ay, p.x + 5, ay, 1.6)); ay += headSide * 6; }
      if (n.accent) out.push(`<path d="M${r1(p.x - 6)} ${r1(ay - 3)} L${r1(p.x + 6)} ${r1(ay)} L${r1(p.x - 6)} ${r1(ay + 3)}" fill="none" stroke="${INK}" stroke-width="1.4"/>`);
    }
    const highY = Math.min(TOP - 8, (p.y ?? TOP) - 12, p.stem && p.stem.up ? p.stem.tip - 6 : TOP);
    if (n.marcato) out.push(`<path d="M${r1(p.x - 5)} ${r1(highY)} L${r1(p.x)} ${r1(highY - 9)} L${r1(p.x + 5)} ${r1(highY)}" fill="none" stroke="${INK}" stroke-width="1.8"/>`);
    if (n.fermata) out.push(`<path d="M${r1(p.x - 9)} ${r1(highY - 2)} A9 9 0 0 1 ${r1(p.x + 9)} ${r1(highY - 2)}" fill="none" stroke="${INK}" stroke-width="1.8"/><circle cx="${r1(p.x)}" cy="${r1(highY - 4)}" r="1.8" fill="${INK}"/>`);
    if (n.trill) out.push(txt(p.x - 6, highY - (n.fermata ? 16 : 2), 'tr', { size: 15, italic: true, bold: true }));
    if (m.breath) { const prev = placed[i - 1]; const bx = prev ? (prev.x + p.x) / 2 + 4 : p.x - 12; out.push(txt(bx, TOP - 6, '’', { size: 26, bold: true })); }
    (m.tech || []).forEach((t, k) => out.push(txt(p.x - 6, TEXT_Y + 2 - k * 14, t, { size: 13 })));
    (m.text || []).forEach((t, k) => {
      const below = t === 'cresc.' || t === 'dim.' || t === 'niente';
      out.push(below ? txt(p.x - 4 + (m.dyn ? 26 : 0), dynY, t, { size: 13, italic: true }) : txt(p.x - 4 + (m.tempo ? 150 : 0), TEXT_Y + 2 - k * 14, t, { size: 14, italic: true }));
    });
    (m.tempo || []).forEach(t => out.push(txt(p.x - 8, TEXT_Y - 4, `${t.label ? t.label + ' ' : ''}${UNIT_GLYPH[t.unit] || '♩'} = ${t.bpm}`, { size: 14, bold: true })));
    if (m.hairpin) m.hairpin.forEach(h => {
      if (h === 'end') closeHairpin(p.x - 8);
      else { if (state.hairpin) closeHairpin(p.x - 10); state.hairpin = { kind: h, x: p.x + (m.dyn ? 18 : 0) }; }
    });
    if (m.dyn) {
      if (state.hairpin && !m.hairpin) closeHairpin(p.x - 14);
      out.push(txt(p.x - 6, dynY, m.dyn[m.dyn.length - 1], { size: 18, italic: true, bold: true }));
    }
  });
  if (state.hairpin) { const h = state.hairpin; closeHairpin(W - 10); state.hairpin = { ...h, x: 60 }; }
  return out.join('');
}

// SVG en texto → elemento (para la pantalla y para el PDF)
export function svgElement(markup) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  return document.importNode(doc.documentElement, true);
}
