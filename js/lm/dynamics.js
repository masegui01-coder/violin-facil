// Matices en la lectura rítmica con palmas (sin DOM): con la fuerza de cada golpe que oye el micrófono se comprueba
// que lo forte suena más que lo piano y que los reguladores (crescendo, diminuendo) crecen o decrecen.
// matices: [{ compas, signo: 'p'|'f'|'cresc'|'dim'…, hasta? }] (compases desde 1). notes: [{ bar (desde 0) }].
// strengths: fuerza de cada nota tocada (null si no se oyó). Devuelve { ok, total, checks: [{ signo, compas, ok }] }.
const LEVEL = { ppp: 0, pp: 1, p: 2, mp: 3, mf: 4, f: 5, ff: 6, fff: 7 };
const MIN_RATIO = 1.15;  // lo forte, al menos un 15 % más fuerte que lo piano
const SWELL_RATIO = 1.1; // en un regulador, el final un 10 % más (o menos) fuerte que el principio

const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function dynamicsChecks(matices = [], notes = [], strengths = []) {
  const heard = notes.map((n, i) => ({ bar: n.bar + 1, s: strengths[i] })).filter(x => Number.isFinite(x.s) && x.s > 0);
  const lastBar = Math.max(0, ...notes.map(n => n.bar + 1));
  const statics = matices.filter(m => m.signo in LEVEL).sort((a, b) => a.compas - b.compas);
  const checks = [];
  // cada cambio de matiz: el tramo nuevo frente al anterior
  statics.forEach((m, k) => {
    if (!k) return;
    const prev = statics[k - 1];
    const until = statics[k + 1] ? statics[k + 1].compas - 1 : lastBar;
    const a = mean(heard.filter(x => x.bar >= prev.compas && x.bar < m.compas).map(x => x.s));
    const b = mean(heard.filter(x => x.bar >= m.compas && x.bar <= until).map(x => x.s));
    if (a === null || b === null || LEVEL[m.signo] === LEVEL[prev.signo]) return;
    const up = LEVEL[m.signo] > LEVEL[prev.signo];
    checks.push({ signo: m.signo, compas: m.compas, ok: up ? b >= a * MIN_RATIO : a >= b * MIN_RATIO });
  });
  // reguladores: el último tercio frente al primero
  matices.filter(m => m.signo === 'cresc' || m.signo === 'dim').forEach(m => {
    const span = heard.filter(x => x.bar >= m.compas && x.bar <= (m.hasta || m.compas));
    if (span.length < 3) return;
    const third = Math.max(1, Math.floor(span.length / 3));
    const first = mean(span.slice(0, third).map(x => x.s));
    const last = mean(span.slice(-third).map(x => x.s));
    checks.push({ signo: m.signo, compas: m.compas, ok: m.signo === 'cresc' ? last >= first * SWELL_RATIO : first >= last * SWELL_RATIO });
  });
  return { ok: checks.filter(c => c.ok).length, total: checks.length, checks };
}
