// Ilustraciones del Libro del método Pro: un pentagrama con el ejemplo de cada tema y etiquetas con flechas que
// señalan cada parte (la clave, la plica, la barra de compás, el puntillo…). Usa la clave y la escala del instrumento.
// Devuelve el SVG como texto, el pie de figura y el ejemplo que suena con «Escuchar». Sin DOM.
import { L } from './tips-l10n.js';
import { parseNote, diatonicStep, noteLabel, keyCount } from './music.js';

const HALF = 7;
const BASE = { treble: 30, bass: 18, perc: 30 };
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SHARP_STEPS = [38, 35, 39, 36, 33, 37, 34];
const FLAT_STEPS = [34, 37, 33, 36, 32, 35, 31];
const BASS_SIG_SHIFT = 14;
const STEM = 34;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stepToNote = step => LETTERS[((step % 7) + 7) % 7] + Math.floor(step / 7);

// Lienzo de una figura: pentagrama de x0 a x1 con su línea inferior en «bottom»
function canvas({ width, height, clef, bottom = 120 }) {
  const base = BASE[clef] ?? BASE.treble;
  const mid = base + 4;
  const y = step => bottom - (step - base) * HALF;
  const parts = [];
  const add = s => parts.push(s);
  const f = {
    base, mid, y, bottom,
    staff(x0 = 8, x1 = width - 8) {
      for (let i = 0; i < 5; i++) add(`<line x1="${x0}" x2="${x1}" y1="${bottom - i * HALF * 2}" y2="${bottom - i * HALF * 2}" class="st-line"/>`);
    },
    clef(x = 10) {
      if (clef === 'perc') {
        [x + 6, x + 16].forEach(cx => add(`<rect x="${cx}" y="${bottom - HALF * 6}" width="6" height="${HALF * 4}" class="st-fill"/>`));
        return x + 44;
      }
      add(clef === 'bass' ? `<text x="${x + 2}" y="${bottom - HALF * 2 + 2}" class="st-clef bass">𝄢</text>` : `<text x="${x}" y="${bottom + 9}" class="st-clef">𝄞</text>`);
      return x + 44;
    },
    time(x, num, den = 4) {
      add(`<text x="${x}" y="${bottom - HALF * 4 - 1}" class="st-time">${num}</text><text x="${x}" y="${bottom + 1}" class="st-time">${den}</text>`);
    },
    keySig(x, key) {
      const n = keyCount(key);
      const shift = clef === 'bass' ? BASS_SIG_SHIFT : 0;
      const steps = (n >= 0 ? SHARP_STEPS.slice(0, n) : FLAT_STEPS.slice(0, -n)).map(s => s - shift);
      steps.forEach((s, i) => add(`<text x="${x + i * 10}" y="${y(s) + (n >= 0 ? 5 : 3)}" class="st-acc">${n >= 0 ? '♯' : '♭'}</text>`));
      return x + steps.length * 10 + 6;
    },
    bar(x) { add(`<line x1="${x}" x2="${x}" y1="${bottom - HALF * 8}" y2="${bottom}" class="st-line"/>`); },
    finalBar(x) {
      add(`<line x1="${x - 6}" x2="${x - 6}" y1="${bottom - HALF * 8}" y2="${bottom}" class="st-line"/><rect x="${x - 3}" y="${bottom - HALF * 8}" width="4" height="${HALF * 8}" class="st-fill"/>`);
    },
    repeatEnd(x) {
      f.finalBar(x);
      [3, 5].forEach(k => add(`<circle cx="${x - 12}" cy="${bottom - HALF * k}" r="2.4" class="st-fill"/>`));
    },
    ledgers(x, step) {
      for (let s = base - 2; s >= step; s -= 2) add(`<line x1="${x - 13}" x2="${x + 13}" y1="${y(s)}" y2="${y(s)}" class="st-line"/>`);
      for (let s = base + 10; s <= step; s += 2) add(`<line x1="${x - 13}" x2="${x + 13}" y1="${y(s)}" y2="${y(s)}" class="st-line"/>`);
    },
    // Nota: dur w h q e; dot; acc ('♯' '♭' '♮'); flag false para corcheas unidas por barra. Devuelve dónde acaba la plica.
    note(x, step, dur, { dot = false, acc = null, flag = true, cls = '', up: forceUp = null } = {}) {
      f.ledgers(x, step);
      const ny = y(step);
      const hollow = dur === 'w' || dur === 'h';
      add(`<g class="st-note ${cls}">`);
      if (acc) add(`<text x="${x - 22}" y="${ny + 5}" class="st-acc-note">${acc}</text>`);
      add(`<ellipse cx="${x}" cy="${ny}" rx="8" ry="6" transform="rotate(-20 ${x} ${ny})" class="${hollow ? 'st-head-hollow' : 'st-fill'}"/>`);
      if (dot) add(`<circle cx="${x + 14}" cy="${(step - base) % 2 === 0 ? ny - 4 : ny}" r="2.3" class="st-fill"/>`);
      let stem = null;
      if (dur !== 'w') {
        const up = forceUp ?? step < mid;
        const sx = up ? x + 7.3 : x - 7.3;
        const tip = up ? ny - STEM : ny + STEM;
        add(`<line x1="${sx}" x2="${sx}" y1="${ny}" y2="${tip}" class="st-stroke" stroke-width="1.7"/>`);
        if (dur === 'e' && flag) add(up ? `<path d="M${sx} ${tip} q2 10 10 16 q-4 -8 -10 -10" class="st-fill"/>` : `<path d="M${sx} ${tip} q2 -10 10 -16 q-4 8 -10 10" class="st-fill"/>`);
        stem = { x: sx, y: tip, up };
      }
      add('</g>');
      return { x, y: ny, stem };
    },
    // Nota de adorno (flam): cabeza pequeña con plica tachada justo antes de la nota
    grace(x, step) {
      const gy = y(step);
      add(`<g class="st-note"><ellipse cx="${x}" cy="${gy}" rx="4.6" ry="3.4" transform="rotate(-20 ${x} ${gy})" class="st-fill"/><line x1="${x + 4}" x2="${x + 4}" y1="${gy}" y2="${gy - 22}" class="st-stroke" stroke-width="1.2"/><line x1="${x - 2}" x2="${x + 10}" y1="${gy - 8}" y2="${gy - 16}" class="st-stroke" stroke-width="1.2"/></g>`);
    },
    beam(a, b, offset = 0) { if (offset) { add(`<line x1="${a.stem.x}" x2="${b.stem.x}" y1="${a.stem.y + offset}" y2="${b.stem.y + offset}" class="st-stroke" stroke-width="5"/>`); return; } add(`<line x1="${a.stem.x}" x2="${b.stem.x}" y1="${a.stem.y}" y2="${b.stem.y}" class="st-stroke" stroke-width="5"/>`); },
    rest(x, kind) {
      const m = bottom - HALF * 4;
      if (kind === 'w') add(`<rect x="${x - 7}" y="${m - HALF * 2}" width="14" height="6" class="st-fill"/>`);
      else if (kind === 'h') add(`<rect x="${x - 7}" y="${m - 6}" width="14" height="6" class="st-fill"/>`);
      else if (kind === 'e') add(`<circle cx="${x - 3}" cy="${m - 4}" r="2.8" class="st-fill"/><path d="M${x - 3} ${m - 2} q5 1 7 -4 l-5 16" class="st-stroke" stroke-width="1.6" fill="none"/>`);
      else add(`<path d="M${x - 2} ${m - 14} l6 7 -5 6 6 8 c-5 -2 -8 1 -4 5 c-7 -3 -6 -9 0 -7 l-6 -7 5 -6z" class="st-fill"/>`);
    },
    arc(x1, x2, yy, up = true) {
      const d = up ? -14 : 14;
      add(`<path d="M${x1} ${yy} Q${(x1 + x2) / 2} ${yy + d * 1.6} ${x2} ${yy}" class="fig-arc"/>`);
    },
    hairpin(x1, x2, yy, opening) {
      const [a, b] = opening ? [x1, x2] : [x2, x1];
      add(`<path d="M${b} ${yy - 7} L${a} ${yy} L${b} ${yy + 7}" class="fig-arc"/>`);
    },
    dyn(x, yy, s) { add(`<text x="${x}" y="${yy}" class="fig-dyn">${esc(s)}</text>`); },
    text(x, yy, s, cls = 'fig-text', anchor = 'middle') { add(`<text x="${x}" y="${yy}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`); },
    // Etiqueta con flecha: el texto en (tx, ty) y la punta de la flecha en (px, py)
    label(tx, ty, s, px, py, anchor = 'middle') {
      const ly = ty + (py > ty ? 5 : -14);
      add(`<line x1="${tx}" y1="${ly}" x2="${px}" y2="${py}" class="fig-arrow" marker-end="url(#figHead)"/>`);
      f.text(tx, ty, s, 'fig-label', anchor);
    },
    bracket(x1, x2, yy, s, cls = 'fig-text') {
      add(`<path d="M${x1} ${yy - 5} V${yy} H${x2} V${yy - 5}" class="fig-bracket"/>`);
      f.text((x1 + x2) / 2, yy + 14, s, cls);
    },
    // Corchete suelto de una corchea (o el segundo de una semicorchea) y barrita corta de semicorchea en un grupo
    flag(n, offset = 0) {
      const { x: sx, y: tip, up } = n.stem;
      const fy = tip + (up ? offset : -offset);
      add(up ? `<path d="M${sx} ${fy} q2 10 10 16 q-4 -8 -10 -10" class="st-fill"/>` : `<path d="M${sx} ${fy} q2 -10 10 -16 q-4 8 -10 10" class="st-fill"/>`);
    },
    stub(n, dx) { add(`<line x1="${n.stem.x}" x2="${n.stem.x + dx}" y1="${n.stem.y + 8}" y2="${n.stem.y + 8}" class="st-stroke" stroke-width="5"/>`); },
    height(x, h) { add(`<rect x="${x - 4}" y="${bottom + 58 - h}" width="8" height="${h}" rx="2" class="fig-height${h > 10 ? ' hi' : ''}"/>`); },
    svg() {
      return `<svg class="staff pro-fig" viewBox="0 0 ${width} ${height}" role="img"><defs><marker id="figHead" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8z" class="fig-head"/></marker></defs>${parts.join('')}</svg>`;
    },
  };
  return f;
}

const T = {
  higher: L('más agudo', 'higher'), lower: L('más grave', 'lower'), clefSol: L('Clave de sol', 'Treble clef'), clefFa: L('Clave de fa', 'Bass clef'),
  whole4: L('Redonda: 4 pulsos', 'Whole note: 4 beats'), linesSpaces: L('5 líneas y 4 espacios, de abajo arriba', '5 lines and 4 spaces, from the bottom up'),
  head: L('Cabeza', 'Head'), stem: L('Plica', 'Stem'), beats4: L('4 pulsos', '4 beats'), beats2: L('2 pulsos', '2 beats'), beat1: L('1 pulso', '1 beat'),
  whole: L('Redonda', 'Whole note'), half: L('Blanca', 'Half note'), quarter: L('Negra', 'Quarter note'),
  equal: L('1 redonda = 2 blancas = 4 negras', '1 whole = 2 halves = 4 quarters'),
  perBar: L('pulsos por compás', 'beats per bar'), whoBeat: L('la negra vale 1 pulso', 'a quarter note gets 1 beat'),
  barLine: L('Barra de compás', 'Bar line'), finalBar: L('Doble barra final', 'Final double bar'), strong: L('fuerte', 'strong'),
  ledger: L('Línea adicional', 'Ledger line'), line: L('línea', 'line'), space: L('espacio', 'space'),
  hangs: L('cuelga de la 4.ª línea', 'hangs from line 4'), sits: L('sobre la 3.ª línea', 'sits on line 3'),
  slur: L('Ligadura de expresión', 'Slur'), slurSub: L('una sola articulación', 'a single articulation'),
  tie: L('Ligadura de prolongación', 'Tie'), tieSub: L('2 + 1 = 3 pulsos', '2 + 1 = 3 beats'),
  flag: L('Corchete', 'Flag'), beamL: L('Barra', 'Beam'), eighth: L('Corchea: ½ pulso', 'Eighth: ½ beat'), and: L('y', 'and'),
  dot: L('Puntillo', 'Dot'), dottedHalf: L('2 + 1 = 3 pulsos', '2 + 1 = 3 beats'), dottedQ: L('1½ + ½', '1½ + ½'), waltz: L('UN', 'ONE'), two: L('dos', 'two'), three: L('tres', 'three'),
  keySig: L('Armadura', 'Key signature'), sharp: L('sube ½ tono', 'up ½ step'), flat: L('baja ½ tono', 'down ½ step'), natural: L('anula', 'cancels'),
  piano: L('piano: suave', 'piano: soft'), forte: L('forte: fuerte', 'forte: loud'), cresc: L('crescendo', 'crescendo'), dim: L('diminuendo', 'diminuendo'),
  arp: L('En color, el arpegio: 1, 3, 5 y 8', 'In colour, the arpeggio: 1, 3, 5 and 8'),
  strG: L('Sol · 4.ª', 'G · 4th'), strD: L('Re · 3.ª', 'D · 3rd'), strA: L('La · 2.ª', 'A · 2nd'), strE: L('Mi · 1.ª', 'E · 1st'),
  openStrings: L('Las cuatro cuerdas al aire', 'The four open strings'), fingers: L('Dedos sobre la cuerda La', 'Fingers on the A string'),
  open0: L('al aire', 'open'), high2: L('2 alto: pegado al 3', 'high 2: next to 3'),
  breath: L('Coma de respiración', 'Breath mark'), repeat: L('Barra de repetición', 'Repeat bar'), ask: L('Frase 1: pregunta', 'Phrase 1: question'), answer: L('Frase 2: respuesta', 'Phrase 2: answer'),
};

const CAPTION = {
  1: L('El pentagrama: las notas suben hacia lo agudo. La clave da nombre a las líneas.', 'The staff: notes rise towards the high end. The clef names the lines.'),
  2: L('Las figuras y lo que dura cada una. Fíjate en la cabeza y en la plica.', 'The note values and how long each lasts. Look at the head and the stem.'),
  3: L('Un compás de 4/4: cuatro pulsos y el primero, el más fuerte.', 'A 4/4 bar: four beats, the first one the strongest.'),
  4: L('Cada paso hacia arriba es la nota siguiente: línea, espacio, línea…', 'Each step up is the next note: line, space, line…'),
  5: L('Los silencios duran lo mismo que su figura y el pulso sigue contando.', 'Rests last as long as their note value and the beat keeps counting.'),
  6: L('Dos ligaduras que se parecen y se tocan distinto.', 'Two curved lines that look alike and are played differently.'),
  7: L('La corchea parte el pulso en dos: se cuenta «1 y 2 y».', 'The eighth note splits the beat in two: count "1 and 2 and".'),
  8: L('El puntillo suma la mitad. En 3/4, el balanceo del vals.', 'The dot adds half. In 3/4, the swing of the waltz.'),
  9: L('Alteraciones junto a la nota y armadura al principio de la línea.', 'Accidentals next to the note and the key signature at the start of the line.'),
  10: L('Los matices y los reguladores: el volumen cambia, la afinación no.', 'Dynamics and hairpins: the volume changes, the pitch does not.'),
  11: L('Tu escala de la banda: 1 es un tono y ½ un semitono.', 'Your band scale: 1 is a whole step and ½ a half step.'),
  12: L('Frases, respiración y repetición en una partitura de verdad.', 'Phrases, breathing and repeats in a real score.'),
  cuerdas: L('Cada cuerda al aire tiene su sitio en el pentagrama: La y Mi en los espacios 2 y 4.', 'Each open string has its place on the staff: A and E in spaces 2 and 4.'),
  dedos: L('Cada paso del pentagrama es un dedo: 0 al aire, 1, 2 alto y 3.', 'Each step on the staff is a finger: 0 open, 1, high 2 and 3.'),
};

const FIGURES = {
  1: (f, ctx) => {
    f.staff();
    f.clef(10);
    f.label(108, 34, ctx.clef === 'bass' ? T.clefFa : T.clefSol, 34, f.y(f.base + 5));
    const s = ctx.steps[0];
    const n = f.note(210, s, 'w');
    f.label(290, 42, T.whole4, 214, n.y - 9);
    f.text(210, Math.max(f.bottom + 30, n.y + 26), ctx.names[0], 'fig-name');
    [0, 1, 2, 3, 4].forEach(i => f.text(352, f.bottom - i * HALF * 2 + 4, String(i + 1), 'fig-num', 'end'));
    f.text(352, 16, T.linesSpaces, 'fig-text', 'end');
    return `| ${ctx.scale[0]}w |`;
  },
  2: (f, ctx) => {
    f.staff();
    f.clef(10);
    const m = f.mid - 1;
    f.note(95, m, 'w');
    f.note(185, m, 'h');
    const q = f.note(275, m, 'q');
    f.label(325, 40, T.stem, q.stem.x + 1, q.stem.y + 10);
    f.label(320, f.bottom + 34, T.head, q.x + 6, q.y + 6);
    [[95, T.whole, T.beats4], [185, T.half, T.beats2], [255, T.quarter, T.beat1]].forEach(([x, a, b]) => { f.text(x, f.bottom + 24, a, 'fig-name'); f.text(x, f.bottom + 40, b); });
    f.text(180, 22, T.equal, 'fig-label');
    const p = ctx.scale[0];
    return `| ${p}w | ${p}h ${p}h | ${p}q ${p}q ${p}q ${p}q |`;
  },
  3: (f, ctx) => {
    f.staff();
    let x = f.clef(10);
    f.time(x, 4);
    f.label(140, 26, T.perBar, x + 8, f.bottom - HALF * 6);
    f.label(110, f.bottom + 40, T.whoBeat, x + 8, f.bottom + 2);
    x += 40;
    const m = f.mid - 1;
    [0, 1, 2, 3].forEach(i => { f.note(x + i * 34, m, 'q'); f.text(x + i * 34, f.bottom + 22, String(i + 1), i === 0 ? 'fig-label' : 'fig-text'); });
    const bx = x + 4 * 34 - 8;
    f.bar(bx);
    f.label(bx + 6, 22, T.barLine, bx, f.bottom - HALF * 8 + 2);
    [0, 1].forEach(i => { f.note(bx + 26 + i * 50, m, 'h'); f.text(bx + 26 + i * 50, f.bottom + 22, String(i * 2 + 1)); });
    f.finalBar(bx + 120);
    f.label(352, f.bottom + 40, T.finalBar, bx + 118, f.bottom, 'end');
    const p = ctx.scale[0];
    return `| ${p}q ${p}q ${p}q ${p}q | ${p}h ${p}h |`;
  },
  4: (f, ctx) => {
    f.staff();
    const x0 = f.clef(10);
    const steps = Array.from({ length: 11 }, (_, i) => f.base - 2 + i);
    steps.forEach((s, i) => {
      const x = x0 + 10 + i * 27;
      f.note(x, s, 'w');
      f.text(x, f.bottom + 34 + (i % 2) * 14, noteLabel(parseNote(stepToNote(s)), ctx.nom), 'fig-name');
    });
    f.label(x0 + 70, 22, T.ledger, x0 + 4, f.y(f.base - 2));
    return '| ' + steps.slice(0, 8).map(s => stepToNote(s) + 'q').join(' ') + ' |';
  },
  5: (f, ctx) => {
    f.staff();
    f.clef(10);
    f.rest(95, 'w');
    f.rest(190, 'h');
    f.rest(285, 'q');
    f.label(95, 22, T.hangs, 95, f.bottom - HALF * 6);
    f.label(200, 22, T.sits, 190, f.bottom - HALF * 5);
    [[95, T.whole, T.beats4], [190, T.half, T.beats2], [285, T.quarter, T.beat1]].forEach(([x, a, b]) => { f.text(x, f.bottom + 24, a, 'fig-name'); f.text(x, f.bottom + 40, b); });
    const p = ctx.scale[0];
    return `| ${p}q Rq ${p}q Rq | ${p}h Rh |`;
  },
  6: (f, ctx) => {
    f.staff();
    f.clef(10);
    const [a, b] = [f.mid - 1, f.mid];
    const n1 = f.note(90, a, 'q');
    const n2 = f.note(130, b, 'q');
    f.arc(n1.x, n2.x, Math.min(n1.y, n2.y) + 14, false);
    f.bar(175);
    const t1 = f.note(215, a, 'h');
    const t2 = f.note(280, a, 'q');
    f.arc(t1.x + 6, t2.x - 6, t1.y + 12, false);
    f.text(108, 26, T.slur, 'fig-label');
    f.text(108, f.bottom + 48, T.slurSub);
    f.text(262, 26, T.tie, 'fig-label');
    f.text(262, f.bottom + 48, T.tieSub);
    f.finalBar(330);
    return `| (${ctx.scale[1]}q ${ctx.scale[2]}q) | ${ctx.scale[1]}h~ ${ctx.scale[1]}q |`;
  },
  7: (f, ctx) => {
    f.staff();
    f.clef(10);
    const m = f.mid - 1;
    const e = f.note(80, m, 'e');
    f.label(130, 26, T.flag, e.stem.x + 6, e.stem.y + 8);
    f.text(80, f.bottom + 24, T.eighth, 'fig-name');
    f.bar(125);
    const xs = [155, 190, 225, 260];
    const q1 = f.note(xs[0], m, 'q');
    const a = f.note(xs[1], m, 'e', { flag: false });
    const b = f.note(xs[2], m, 'e', { flag: false });
    f.beam(a, b);
    f.note(xs[3], m, 'q');
    f.label(255, 26, T.beamL, (a.stem.x + b.stem.x) / 2, a.stem.y - 3);
    ['1', '2', T.and, '3'].forEach((s, i) => f.text(xs[i], f.bottom + 24, s, i === 2 ? 'fig-label' : 'fig-text'));
    f.finalBar(300);
    void q1;
    const p = ctx.scale[0];
    return `| ${p}q ${p}e ${p}e ${p}q ${p}q |`;
  },
  8: (f, ctx) => {
    f.staff();
    let x = f.clef(10);
    f.time(x, 3);
    x += 46;
    const m = f.mid - 1;
    const h = f.note(x, m, 'h', { dot: true });
    f.label(x + 50, 24, T.dot, h.x + 14, h.y - 4);
    f.text(x + 10, f.bottom + 24, T.dottedHalf, 'fig-name');
    [T.waltz, T.two, T.three].forEach((s, i) => f.text(x - 6 + i * 26, f.bottom + 42, s, i === 0 ? 'fig-label' : 'fig-text'));
    f.bar(x + 92);
    const q = f.note(x + 125, m, 'q', { dot: true });
    f.note(x + 175, m + 1, 'e');
    f.text(x + 150, f.bottom + 24, T.dottedQ, 'fig-name');
    f.finalBar(x + 215);
    void q;
    const p = ctx.scale[0];
    return `@time:3/4 | ${p}h. | ${p}q. ${ctx.scale[1]}e ${p}q |`;
  },
  9: (f, ctx) => {
    f.staff();
    let x = f.clef(10);
    const key = keyCount(ctx.key) ? ctx.key : 'F';
    const after = f.keySig(x, key);
    f.label(x + 30, 22, T.keySig, x + 6, f.bottom - HALF * 7);
    x = Math.max(after, x + 30) + 30;
    const m = f.mid - 1;
    [['♯', T.sharp], ['♭', T.flat], ['♮', T.natural]].forEach(([acc, s], i) => {
      const n = f.note(x + i * 85, m, 'h', { acc });
      f.text(n.x - 8, f.bottom + 26, s, 'fig-name');
    });
    f.finalBar(x + 230);
    const s0 = parseNote(ctx.scale[2]);
    return `| ${ctx.scale[2]}q ${s0.letter}${s0.acc === 1 ? '' : '#'}${s0.oct}q ${ctx.scale[2]}h |`;
  },
  10: (f, ctx) => {
    f.staff();
    f.clef(10);
    const m = f.mid - 1;
    [80, 175, 270].forEach(x => f.note(x, m, 'w'));
    const dy = f.bottom + 30;
    f.dyn(70, dy, 'p');
    f.hairpin(95, 160, dy - 5, true);
    f.dyn(168, dy, 'f');
    f.hairpin(190, 255, dy - 5, false);
    f.dyn(262, dy, 'p');
    f.text(75, dy + 22, T.piano, 'fig-name');
    f.text(127, 24, T.cresc, 'fig-label');
    f.text(175, dy + 22, T.forte, 'fig-name');
    f.text(222, 24, T.dim, 'fig-label');
    return `| @p @< ${ctx.scale[0]}w | @f @> ${ctx.scale[0]}w |`;
  },
  11: (f, ctx) => {
    f.staff();
    let x = f.clef(10);
    x = f.keySig(x, ctx.key) + 14;
    const xs = ctx.steps.map((_, i) => x + i * 36);
    ctx.steps.forEach((s, i) => f.note(xs[i], s, 'w', { cls: [0, 2, 4, 7].includes(i) ? 'fig-hi' : '' }));
    const low = Math.max(f.bottom, ...ctx.steps.map(s => f.y(s))) + 22;
    ['T', 'T', 'S', 'T', 'T', 'T', 'S'].forEach((k, i) => f.bracket(xs[i] + 3, xs[i + 1] - 3, low, k === 'T' ? '1' : '½', k === 'S' ? 'fig-label' : 'fig-text'));
    f.text(190, 22, T.arp, 'fig-label');
    return '| ' + ctx.scale.map(n => n + 'q').join(' ') + ' | ' + [0, 2, 4, 7, 4, 2].map(i => ctx.scale[i] + 'q').join(' ') + ' ' + ctx.scale[0] + 'h |';
  },
  12: (f, ctx) => {
    f.staff();
    const x0 = f.clef(10);
    const d = [2, 2, 3, 4, 4, 3, 2, 1];
    const xs = d.map((_, i) => x0 + 14 + i * 30 + (i >= 4 ? 22 : 0));
    const notes = d.map((k, i) => f.note(xs[i], ctx.steps[k], 'q'));
    f.bar(xs[3] + 26);
    f.text(xs[3] + 26, f.bottom - HALF * 10, ',', 'fig-breath');
    f.label(xs[3] + 70, 22, T.breath, xs[3] + 28, f.bottom - HALF * 10 - 6);
    f.repeatEnd(xs[7] + 34);
    f.label(352, f.bottom + 46, T.repeat, xs[7] + 22, f.bottom + 2, 'end');
    f.bracket(xs[0] - 6, xs[3] + 6, f.bottom + 24, T.ask);
    void notes;
    return '| ' + d.slice(0, 4).map(k => ctx.scale[k] + 'q').join(' ') + ' | ' + d.slice(4).map(k => ctx.scale[k] + 'q').join(' ') + ' |';
  },
};

FIGURES.cuerdas = f => {
  f.staff();
  const x0 = f.clef(10);
  const strings = [['G3', T.strG], ['D4', T.strD], ['A4', T.strA], ['E5', T.strE]];
  strings.forEach(([n, s], i) => {
    const x = x0 + 40 + i * 72;
    const st = diatonicStep(parseNote(n));
    f.note(x, st, 'w', { cls: i >= 2 ? 'fig-hi' : '' });
    f.text(x, Math.max(f.bottom + 34, f.y(st) + 28), s, 'fig-name');
  });
  f.text(180, 22, T.openStrings, 'fig-label');
  return '| G3w | D4w | A4w | E5w |';
};
FIGURES.dedos = f => {
  f.staff();
  const x0 = f.clef(10);
  const notes = ['A4', 'B4', 'C#5', 'D5'];
  notes.forEach((n, i) => {
    const x = x0 + 40 + i * 70;
    f.note(x, diatonicStep(parseNote(n)), 'q');
    f.text(x, f.bottom - HALF * 11, String(i), 'fig-finger');
  });
  f.text(x0 + 40, f.bottom + 26, T.open0, 'fig-name');
  f.text(x0 + 180, f.bottom + 26, T.high2, 'fig-label');
  f.text(180, 18, T.fingers, 'fig-label');
  return '| A4q B4q C#5q D5q | C#5q B4q A4h |';
};

// ---------- Percusión: ritmos en la caja con la mano de cada golpe ----------
const PT = {
  clefPerc: L('Clave de percusión', 'Percussion clef'), snare: L('Caja: 3.er espacio', 'Snare: 3rd space'), hand: L('Mano: D o I', 'Hand: R or L'),
  pulse: L('Un golpe en cada pulso', 'One stroke on each beat'), air: L('cuenta en el aire', 'count in the air'), restAir: L('gesto en el aire', 'gesture in the air'),
  singles: L('Golpes simples', 'Single strokes'), doubles: L('Golpes dobles', 'Double strokes'), bounce: L('rebote', 'bounce'),
  para: L('pa-ra', 'pa-ra'), diddle: L('di-ddle', 'di-ddle'), accent: L('Acento', 'Accent'), ghost: L('Nota fantasma', 'Ghost note'),
  high: L('baqueta alta', 'stick high'), low: L('baqueta baja', 'stick low'), sixteenth: L('2 barras: ¼ de pulso', '2 beams: ¼ beat'), gallop: L('Galope', 'Gallop'),
  offbeat: L('Golpe en la «y»', 'Stroke on the "and"'), eighthRest: L('Silencio de corchea', 'Eighth rest'), sync: L('Síncopa', 'Syncopation'),
  dotted: L('¾ + ¼ = 1 pulso', '¾ + ¼ = 1 beat'), march: L('Marcha en 2/4', 'March in 2/4'), flam: L('Flam: adorno + nota', 'Flam: grace + note'),
  triplet: L('Tresillo: 3 en 1 pulso', 'Triplet: 3 in 1 beat'), phrase: L('Frase de 4 compases', '4-bar phrase'), ending: L('Final con acento', 'Accented ending'),
};
Object.assign(CAPTION, {
  perc1: L('La caja se escribe en el tercer espacio; debajo de cada golpe, la mano que toca.', 'The snare is written in the third space; under each stroke, the hand that plays it.'),
  perc2: L('En la caja solo suena el principio de la figura: el resto se cuenta con la baqueta en el aire.', 'On the snare only the start of the note sounds: the rest is counted with the stick in the air.'),
  perc3: L('Cada silencio es un golpe que no suena: la mano hace el gesto sin tocar.', 'Each rest is a stroke that does not sound: the hand makes the gesture without playing.'),
  perc4: L('Dos corcheas por pulso, una con cada mano: D I D I.', 'Two eighths per beat, one with each hand: R L R L.'),
  perc5: L('Dos golpes con cada mano: el segundo sale del rebote.', 'Two strokes with each hand: the second comes from the bounce.'),
  perc6: L('Paradiddle: dos simples y un doble, y el acento cambia de mano.', 'Paradiddle: two singles and a double, and the accent switches hands.'),
  perc7: L('Cuatro semicorcheas por pulso, «ta-ka-di-mi», y el galope «ta-di-mi».', 'Four sixteenths per beat, "ta-ka-di-mi", and the gallop "ta-di-mi".'),
  perc8: L('La altura de la baqueta decide el volumen: arriba para el acento, abajo para la nota fantasma.', 'Stick height sets the volume: high for the accent, low for the ghost note.'),
  perc9: L('El contratiempo cae en la «y» y la síncopa se apoya sobre el pulso.', 'The off-beat falls on the "and" and the syncopation leans over the beat.'),
  perc10: L('Corchea con puntillo y semicorchea: el paso firme y el saltito de la marcha.', 'Dotted eighth and sixteenth: the firm step and little hop of the march.'),
  perc11: L('El flam con su nota de adorno y el tresillo, tres golpes en un pulso.', 'The flam with its grace note and the triplet, three strokes in one beat.'),
  perc12: L('Una frase de marcha con todo lo aprendido y su final acentuado.', 'A march phrase with everything you have learned and its accented ending.'),
});

// Dibuja una fila de figuras en la caja: «q» «e» «s» «e.» «Rq» «Re»…, con «>» de acento y «g» delante para el flam.
// Las corcheas y semicorcheas de un mismo pulso se unen con barras. Devuelve la posición de cada figura.
const SNARE_STEP = 35;
const FIG_BEATS = { w: 4, h: 2, q: 1, 'e.': 0.75, e: 0.5, 's': 0.25, t3: 1 / 3 };
function percRow(f, x0, tokens, hands = [], { gap = 26, perBeat = 30 } = {}) {
  let x = x0;
  let beat = 0;
  let h = 0;
  const out = [];
  tokens.forEach(raw => {
    const accent = raw.endsWith('>');
    const flam = raw.startsWith('g');
    const tok = raw.replace(/>$/, '').replace(/^g/, '');
    const rest = tok.startsWith('R');
    const fig = rest ? tok.slice(1) : tok;
    const dur = fig === 't3' ? 'e' : fig.replace('.', '');
    const beats = FIG_BEATS[fig] ?? (dur === 'e' ? 0.5 : 1);
    if (rest) f.rest(x, dur);
    else {
      if (flam) f.grace(x - 16, SNARE_STEP + 1);
      const n = f.note(x, SNARE_STEP, dur, { dot: fig.includes('.'), flag: false, up: true });
      if (accent) f.text(x + 7, n.stem.y - 8, '>', 'fig-accent');
      if (hands[h]) f.text(x, f.bottom + 22, hands[h], `fig-stick ${hands[h]}`);
      h++;
      out.push({ ...n, dur, beat, fig, accent });
    }
    if (rest) out.push({ x, rest: true, beat });
    beat += beats;
    x += gap + beats * perBeat;
  });
  // Barras por pulso (y la segunda barra entre semicorcheas); una corchea sola lleva corchete
  const groups = {};
  out.filter(n => !n.rest && ['e', 's'].includes(n.dur)).forEach(n => { const k = Math.floor(n.beat + 1e-6); (groups[k] = groups[k] || []).push(n); });
  Object.values(groups).forEach(g => {
    if (g.length === 1) {
      const n = g[0];
      f.flag(n);
      if (n.dur === 's') f.flag(n, 8);
      return;
    }
    f.beam(g[0], g[g.length - 1]);
    g.forEach((n, i) => {
      if (n.dur !== 's') return;
      const next = g[i + 1];
      if (next && next.dur === 's') f.beam(n, next, 8);
      else if (!(g[i - 1] && g[i - 1].dur === 's')) f.stub(n, next ? 9 : -9);
    });
  });
  return out;
}
const PARA = ['D', 'I', 'D', 'D', 'I', 'D', 'I', 'I'];
const sticks = (pattern, n) => Array.from({ length: n }, (_, i) => pattern[i % pattern.length]);

Object.assign(FIGURES, {
  perc1: f => {
    f.staff();
    let x = f.clef(10);
    f.time(x, 4);
    f.label(70, 22, PT.clefPerc, 22, f.bottom - HALF * 5);
    const row = percRow(f, x + 40, ['q', 'q', 'q', 'q'], ['D', 'I', 'D', 'I'], { gap: 22, perBeat: 36 });
    f.label(row[1].x + 40, 22, PT.snare, row[1].x + 2, row[1].y - 4);
    f.text(352, f.bottom + 46, PT.hand, 'fig-label', 'end');
    f.finalBar(row[3].x + 40);
    return '| C5q C5q C5q C5q |';
  },
  perc2: f => {
    f.staff();
    const x = f.clef(10);
    const row = percRow(f, x + 16, ['w', 'h', 'q', 'q'], ['D', 'I', 'D', 'I'], { gap: 34, perBeat: 22 });
    [[row[0].x, T.beats4], [row[1].x, T.beats2], [row[2].x, T.beat1]].forEach(([nx, b]) => f.text(nx, f.bottom + 40, b));
    f.bracket(row[0].x + 14, row[1].x - 14, f.bottom - HALF * 10, PT.air);
    f.text(180, 18, T.equal, 'fig-label');
    return '| C5w | C5h C5q C5q |';
  },
  perc3: f => {
    f.staff();
    const x = f.clef(10);
    const row = percRow(f, x + 20, ['q', 'Rq', 'q', 'Rq', 'h', 'Rh'], ['D', 'I', 'D'], { gap: 26, perBeat: 22 });
    f.label(row[1].x + 30, 22, PT.restAir, row[1].x, f.bottom - HALF * 7);
    return '| C5q Rq C5q Rq | C5h Rh |';
  },
  perc4: f => {
    f.staff();
    let x = f.clef(10);
    f.time(x, 4);
    const row = percRow(f, x + 36, ['e', 'e', 'e', 'e', 'q', 'q'], sticks(['D', 'I'], 6), { gap: 18, perBeat: 40 });
    ['1', T.and, '2', T.and, '3', '4'].forEach((s2, i) => f.text(row[i].x, f.bottom + 40, s2, i % 2 && i < 4 ? 'fig-label' : 'fig-text'));
    f.text(180, 18, PT.singles, 'fig-label');
    f.finalBar(row[5].x + 36);
    return '| C5e C5e C5e C5e C5q C5q |';
  },
  perc5: f => {
    f.staff();
    const x = f.clef(10);
    const row = percRow(f, x + 20, ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'], sticks(['D', 'D', 'I', 'I'], 8), { gap: 16, perBeat: 36 });
    [1, 3].forEach(i => f.label(row[i].x + 2, 22, PT.bounce, row[i].x - 4, row[i].stem.y - 6));
    f.text(352, f.bottom + 46, PT.doubles, 'fig-label', 'end');
    return '| C5e C5e C5e C5e C5e C5e C5e C5e |';
  },
  perc6: f => {
    f.staff();
    const x = f.clef(10);
    const row = percRow(f, x + 20, ['e>', 'e', 'e', 'e', 'e>', 'e', 'e', 'e'], PARA, { gap: 16, perBeat: 36 });
    f.bracket(row[0].x - 6, row[1].x + 6, f.bottom + 40, PT.para);
    f.bracket(row[2].x - 6, row[3].x + 6, f.bottom + 40, PT.diddle, 'fig-label');
    f.bracket(row[4].x - 6, row[5].x + 6, f.bottom + 40, PT.para);
    f.bracket(row[6].x - 6, row[7].x + 6, f.bottom + 40, PT.diddle, 'fig-label');
    f.label(row[4].x + 40, 16, PT.accent, row[4].x + 8, row[4].stem.y - 14);
    return '| C5e> C5e C5e C5e C5e> C5e C5e C5e |';
  },
  perc7: f => {
    f.staff();
    const x = f.clef(10);
    const row = percRow(f, x + 16, ['s', 's', 's', 's', 'e', 's', 's', 'q'], sticks(['D', 'I'], 8), { gap: 14, perBeat: 64 });
    ['ta', 'ka', 'di', 'mi', 'ta', 'di', 'mi'].forEach((s2, i) => f.text(row[i].x, f.bottom + 40, s2, 'fig-text'));
    f.label(row[1].x + 70, 18, PT.sixteenth, row[1].x, row[1].stem.y + 6);
    f.text(row[5].x, f.bottom + 56, PT.gallop, 'fig-label');
    return '| C5s C5s C5s C5s C5e C5s C5s C5q |';
  },
  perc8: f => {
    f.staff();
    const x = f.clef(10);
    const toks = ['e>', 'e', 'e', 'e>', 'e', 'e', 'e>', 'e'];
    const row = percRow(f, x + 20, toks, sticks(['D', 'I'], 8), { gap: 16, perBeat: 36 });
    // Altura de la baqueta de cada golpe (barra alta para el acento, baja para la nota fantasma)
    row.forEach(n => f.height(n.x, n.accent ? 24 : 6));
    f.label(row[0].x + 40, 16, PT.accent, row[0].x + 8, row[0].stem.y - 14);
    f.text(row[0].x, f.bottom + 76, PT.high, 'fig-label');
    f.text(row[1].x + 40, f.bottom + 76, PT.low, 'fig-text');
    return '| C5e> C5e C5e C5e> C5e C5e C5e> C5e |';
  },
  perc9: f => {
    f.staff();
    let x = f.clef(10);
    f.time(x, 4);
    const row = percRow(f, x + 36, ['Re', 'e', 'Re', 'e', 'e', 'q', 'e'], ['D', 'I', 'D', 'I', 'D'], { gap: 16, perBeat: 40 });
    ['1', T.and, '2', T.and, '3', T.and, T.and].forEach((s2, i) => f.text(row[i].x, f.bottom + 40, s2, i % 2 ? 'fig-label' : 'fig-text'));
    f.label(row[1].x + 30, 18, PT.offbeat, row[1].x + 2, row[1].stem.y - 4);
    f.text(row[5].x, f.bottom + 58, PT.sync, 'fig-label');
    return '| Re C5e Re C5e C5e C5q C5e |';
  },
  perc10: f => {
    f.staff();
    let x = f.clef(10);
    f.time(x, 2);
    const row = percRow(f, x + 36, ['e.', 's', 'e.', 's', 'e', 'e', 'q'], sticks(['D', 'I'], 7), { gap: 16, perBeat: 44 });
    f.label(row[0].x + 44, 18, T.dot, row[0].x + 14, row[0].y - 4);
    f.text((row[0].x + row[1].x) / 2, f.bottom + 40, PT.dotted, 'fig-text');
    f.text(352, f.bottom + 58, PT.march, 'fig-label', 'end');
    return '@time:2/4 | C5e. C5s C5e. C5s | C5e C5e C5q |';
  },
  perc11: f => {
    f.staff();
    const x = f.clef(10);
    const row = percRow(f, x + 34, ['gq', 'q', 't3', 't3', 't3', 'q'], ['D', 'I', 'D', 'I', 'D', 'I'], { gap: 22, perBeat: 48 });
    f.label(row[0].x + 30, 16, PT.flam, row[0].x - 16, row[0].y - 14);
    f.text((row[2].x + row[4].x) / 2, row[2].stem.y - 10, '3', 'fig-label');
    f.text((row[2].x + row[4].x) / 2, f.bottom + 44, PT.triplet, 'fig-label');
    return '| g:C5 C5q C5q C5e:3 C5e:3 C5e:3 C5q |';
  },
  perc12: f => {
    f.staff();
    let x = f.clef(10);
    f.time(x, 2);
    const row = percRow(f, x + 36, ['e.', 's', 'e>', 'e', 's', 's', 's', 's', 'q>'], sticks(['D', 'I'], 9), { gap: 12, perBeat: 40 });
    f.bar((row[1].x + row[2].x) / 2 + 2);
    f.bar((row[3].x + row[4].x) / 2 + 2);
    f.bar((row[7].x + row[8].x) / 2 + 2);
    f.finalBar(row[8].x + 30);
    f.label(row[8].x - 30, 16, PT.ending, row[8].x + 8, row[8].stem.y - 14);
    f.bracket(row[0].x - 6, row[7].x + 6, f.bottom + 44, PT.phrase);
    return '@time:2/4 | C5e. C5s C5e> C5e | C5s C5s C5s C5s C5q> |';
  },
});

const HEIGHT = { 4: 230, 11: 230, perc6: 220, perc7: 230, perc8: 250, perc9: 220, perc10: 220, perc12: 220 };

// Ilustración del nivel: { svg, caption, play } (play: partitura en texto con las notas del instrumento)
export function figureFor(level, inst, nom = 'eu') {
  const topic = level.tema ?? level.nivel;
  const draw = FIGURES[topic];
  if (!draw) return null;
  const clef = ['bass', 'perc'].includes(level.clef) ? level.clef : 'treble';
  const steps = level.scale.map(n => diatonicStep(parseNote(n)));
  const lowest = Math.min(...steps);
  // Notas muy graves (tuba): se baja el pentagrama para que quepan sus líneas adicionales
  const extra = Math.max(0, (BASE[clef] - 2 - lowest)) * HALF;
  const f = canvas({ width: 360, height: (HEIGHT[topic] || 200) + extra, clef, bottom: 120 });
  const ctx = { clef, key: level.key, scale: level.scale, steps, nom, names: level.scale.map(n => noteLabel(parseNote(n), nom)) };
  const play = draw(f, ctx);
  return { svg: f.svg(), caption: CAPTION[topic], play };
}
