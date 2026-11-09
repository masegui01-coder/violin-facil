// Forma de una pieza: el ORDEN en que suenan sus compases. Una sola fuente para la lectura rítmica (readingTimeline), el
// reproductor de la canción (singSong), la letra de cada vuelta (letra / letra2), la audición y lo que se dibuja
// (|:, casillas «1.» y «2.», Fine y «D.C. al Fine»). Sin DOM.
//
// Campos del catálogo (en el ejercicio, la canción o la ficha):
//   repeticion: true | { desde, hasta }                      (todo, o desde…hasta, dos veces)
//   repeticion: { desde, hasta, casilla1: [a, b], casilla2: [c, d] }
//   dc: { fine }                                              (todo y otra vez desde el compás 1 hasta «fine»)
// Los compases se cuentan desde 1 sobre lo escrito; la anacrusa, si la hay, es el compás 0.
const range = (a, b) => (b >= a ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : []);

// Descripción normalizada de la forma, o null si la pieza se toca de una vez
export function formOf(p = {}) {
  const r = p.repeticion;
  const dc = p.dc && p.dc.fine ? { fine: Number(p.dc.fine) } : null;
  if (dc) return { kind: 'dc', dc };
  if (r && typeof r === 'object' && r.casilla1 && r.casilla2) {
    const span = c => [c[0], c[1] ?? c[0]]; // «[3]» es la casilla del compás 3
    return { kind: 'casillas', desde: r.desde || 1, hasta: r.hasta, casilla1: span(r.casilla1), casilla2: span(r.casilla2) };
  }
  if (r && typeof r === 'object' && (r.desde || r.hasta)) return { kind: 'repeat', desde: r.desde || 1, hasta: r.hasta || null };
  if (r) return { kind: 'repeat', desde: 1, hasta: null };
  return null;
}

// Compases en el orden en que suenan, agrupados por vuelta: [[0?, 1, 2, …], [1, 2, …]]. total: compases escritos (sin la
// anacrusa). pickup: hay anacrusa (el compás 0)
export function passesOf(form, total, pickup = false) {
  const head = pickup ? [0] : [];
  if (!form) return [[...head, ...range(1, total)]];
  if (form.kind === 'dc') return [[...head, ...range(1, total)], [...head, ...range(1, Math.min(total, form.dc.fine))]];
  if (form.kind === 'casillas') {
    const { desde, casilla1: c1, casilla2: c2 } = form;
    const hasta = form.hasta || c1[1];
    // 1.ª vuelta: hasta el final de la casilla 1; 2.ª: salta la casilla 1 y sigue por la 2 (y lo que haya después)
    return [
      [...head, ...range(1, hasta)],
      [...range(desde, c1[0] - 1), ...range(c2[0], c2[1]), ...range(Math.max(hasta, c2[1]) + 1, total)],
    ];
  }
  const desde = form.desde;
  const hasta = form.hasta || total;
  if (desde === 1 && hasta === total) return [[...head, ...range(1, total)], [...head, ...range(1, total)]];
  return [[...head, ...range(1, hasta)], [...range(desde, hasta), ...range(hasta + 1, total)]];
}

// Todos los compases seguidos, en orden de sonido
export const barOrder = (form, total, pickup = false) => passesOf(form, total, pickup).flat();

// Número de compases escritos (sin la anacrusa) de unas fichas con «bar» (desde 0)
export function totalBars(tokens, pickup = 0) {
  const last = tokens.reduce((m, t) => Math.max(m, t.bar ?? 0), 0);
  return pickup ? last : last + 1;
}
// Número de compás (0 = anacrusa) de una ficha de scoreTokens
export const barNumber = (t, pickup = 0) => (pickup ? t.bar : t.bar + 1);

// Lo que se dibuja en cada compás: { start: «|:» antes, end: «:|» después, volta: '1.' | '2.' (y si abre), fine, dcEnd }
export function drawMarks(form, total) {
  const marks = {};
  const at = n => (marks[n] ||= {});
  if (!form) return marks;
  if (form.kind === 'dc') {
    at(form.dc.fine).fine = true;
    at(total).dc = true;
    return marks;
  }
  if (form.kind === 'casillas') {
    at(form.desde).start = true;
    at(form.casilla1[1]).end = true;
    range(form.casilla1[0], form.casilla1[1]).forEach((n, i) => { at(n).volta = '1.'; at(n).voltaOpens = i === 0; });
    range(form.casilla2[0], form.casilla2[1]).forEach((n, i) => { at(n).volta = '2.'; at(n).voltaOpens = i === 0; });
    return marks;
  }
  const hasta = form.hasta || total;
  if (form.desde > 1) at(form.desde).start = true;
  at(hasta).end = true;
  return marks;
}

// Texto para quien lee en voz alta o con lector de pantalla
export function formText(form) {
  if (!form) return '';
  if (form.kind === 'dc') return `D.C. al Fine: se repite desde el principio hasta el compás ${form.dc.fine}`;
  if (form.kind === 'casillas') return `Repetición con casillas: la 1.ª vez, compases ${form.desde} a ${form.casilla1[1]}; la 2.ª, salta la casilla 1 y sigue en la casilla 2`;
  return 'Con repetición';
}

// La pieza entera en el orden en que suena, como una sola fila de fichas con su «start» seguido (pulsos desde el principio),
// su vuelta («pass») y su n.º de compás escrito («barNo»). Las notas ligadas se funden en una. Sin forma, la pieza tal cual.
// Lo usan el juego STOP, la audición y la canción (que suenan en el orden de la forma).
export function expandForm(tokens, form, { pickup = 0, barBeats = 4 } = {}) {
  const merged = [];
  tokens.forEach((t, i) => {
    if (t.tiedFrom && merged.length) { merged[merged.length - 1].beats += t.beats; return; }
    merged.push({ ...t, index: i });
  });
  const passes = passesOf(form, totalBars(tokens, pickup), !!pickup);
  const out = [];
  let at = 0;
  passes.forEach((bars, pass) => {
    bars.forEach(b => {
      const scoreStart = b === 0 ? 0 : pickup + (b - 1) * barBeats;
      merged.filter(t => barNumber(t, pickup) === b).forEach(t => out.push({ ...t, scoreStart: t.start, start: at + (t.start - scoreStart), pass, barNo: b }));
      at += b === 0 ? pickup : barBeats;
    });
  });
  return out;
}
