// Pasajes (un trozo de una obra por compases) y codificación compacta de partituras para guardarlas en la nube.

// Recorta los compases from..to (1 = primer compás) y vuelve a empezar en el pulso 0
export function slicePassage(score, fromBar, toBar) {
  const first = Math.max(1, fromBar) - 1;
  const last = Math.min(score.bars.length, toBar) - 1;
  if (last < first) throw new Error('El pasaje no tiene compases');
  const offset = score.bars[first].start;
  const end = score.bars[last].start + score.bars[last].beats;
  const notes = score.notes
    .filter(n => n.bar >= first && n.bar <= last)
    .map(n => ({ ...n, start: n.start - offset, bar: n.bar - first, beats: Math.min(n.beats, end - n.start) }));
  const bars = score.bars.slice(first, last + 1).map(b => ({ start: b.start - offset, beats: b.beats }));
  return { notes, bars, totalBeats: end - offset };
}

// Los dos compases seguidos con más fallos (según un recuento de fallos por nota que suena)
export function hardestBars(score, missCounts, width = 2) {
  const perBar = new Array(score.bars.length).fill(0);
  let k = 0;
  score.notes.forEach(n => { if (!n.rest) perBar[n.bar] += missCounts[k++] || 0; });
  let best = 0, bestSum = -1;
  for (let i = 0; i + width <= perBar.length; i++) {
    const sum = perBar.slice(i, i + width).reduce((a, b) => a + b, 0);
    if (sum > bestSum) { bestSum = sum; best = i; }
  }
  return bestSum > 0 ? { fromBar: best + 1, toBar: best + width } : null;
}

// Tempo adaptativo de un pasaje: sube un 10 % si sale bien, baja un 10 % si no
export const PASSAGE_START = 0.6;
export function nextPassageSpeed(speed, stars) {
  const next = stars >= 2 ? speed + 0.1 : speed - 0.1;
  return Math.round(Math.min(1, Math.max(0.4, next)) * 10) / 10;
}

// ---------- Codificación compacta («C#5:0:1.5>» por nota, «R:4:1» por silencio) ----------
const ACC = { 1: '#', '-1': 'b', 0: '' };

export function encodeScore(score) {
  const notes = score.notes.map(n => `${n.rest ? 'R' : n.letter + ACC[n.acc] + n.oct}:${+n.start.toFixed(4)}:${+n.beats.toFixed(4)}${n.accent ? '>' : ''}`).join(' ');
  const bars = score.bars.map(b => `${+b.start.toFixed(4)}:${+b.beats.toFixed(4)}`).join(' ');
  return { n: notes, b: bars, t: score.totalBeats };
}

const GLYPHS = [['w', false, 4], ['h', true, 3], ['h', false, 2], ['q', true, 1.5], ['q', false, 1], ['e', true, 0.75], ['e', false, 0.5], ['s', true, 0.375], ['s', false, 0.25]];
const glyph = beats => GLYPHS.reduce((a, g) => (Math.abs(g[2] - beats) < Math.abs(a[2] - beats) ? g : a));
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function decodeScore({ n, b, t }) {
  const bars = b ? b.split(' ').map(x => { const [start, beats] = x.split(':').map(Number); return { start, beats }; }) : [];
  const barOf = start => Math.max(0, bars.findIndex((bar, i) => start >= bar.start - 1e-6 && (i === bars.length - 1 || start < bars[i + 1].start - 1e-6)));
  const notes = (n ? n.split(' ') : []).map(tok => {
    const accent = tok.endsWith('>');
    const [pitch, start, beats] = (accent ? tok.slice(0, -1) : tok).split(':');
    const s = Number(start), bt = Number(beats);
    const [dur, dotted] = glyph(bt);
    const base = { start: s, beats: bt, dur, dotted, accent, bar: barOf(s) };
    if (pitch === 'R') return { ...base, rest: true };
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(pitch);
    const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
    const oct = Number(m[3]);
    return { ...base, rest: false, letter: m[1], acc, oct, midi: (oct + 1) * 12 + PC[m[1]] + acc };
  });
  return { notes, bars, totalBeats: t };
}
