// Nivel 1 · Unidades 5 (La escalera de do) y 6 (Fuerte y suave)
import { t, nn, pitch, text, arrow, figure, beamed, durBar, beatRow, staff, keyboard, svg, tap, moveAlong, r1 } from './kit.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const SCALE = [0, 1, 2, 3, 4, 5, 6, 7];
const STEPS_MAJOR = [2, 2, 1, 2, 2, 2, 1]; // en semitonos: T T ½ T T T ½

// Escalera: un peldaño por nota; rises = altura de cada subida (opcional). Devuelve { svg, tops, xs }
export function stairs(x0, base, sw, rises, { first = 18, hiRise = null } = {}) {
  const tops = [base - first];
  rises.forEach(r => tops.push(tops[tops.length - 1] - r));
  let b = '';
  tops.forEach((top, i) => {
    const hi = i > 0 && hiRise?.(i);
    b += `<rect x="${x0 + i * sw}" y="${r1(top)}" width="${sw}" height="${r1(base - top)}" class="${hi ? 'lmf-soft' : 'lmf-soft two'}"/>`;
    if (hi) b += `<line x1="${x0 + i * sw}" x2="${x0 + (i + 1) * sw}" y1="${r1(top)}" y2="${r1(top)}" class="lmf-bar hi"/>`;
  });
  return { svg: b, tops, xs: tops.map((_, i) => x0 + (i + 0.5) * sw) };
}

// U5 · «Una escalera de sonidos»: ocho peldaños do→do con su grado (I…VIII); la tónica, en color
export function escalera(o = {}) {
  const st = stairs(20, 222, 40, Array(7).fill(22), { first: 26 });
  let b = st.svg;
  SCALE.forEach((s, i) => {
    const x = st.xs[i], top = st.tops[i], tonic = i === 0 || i === 7;
    const inner = text(x, top - 10, nn(o, s), { cls: tonic ? 'b l hi' : 'b' }) + text(x, top + 18, ROMAN[i], { cls: tonic ? 'b hi' : 'm b' });
    b += tap(x - 20, top - 30, 40, 52, `| ${pitch(s)}q |`, `${nn(o, s)}, ${t(o, 'grado', 'degree')} ${ROMAN[i]}`, inner);
  });
  let d = `M${st.xs[0]} ${st.tops[0] - 34}`;
  for (let i = 1; i < 8; i++) d += ` Q${st.xs[i] - 20} ${st.tops[i] - 64} ${st.xs[i]} ${st.tops[i] - 34}`;
  b += moveAlong(o, d, 6, { r: 6 });
  b += text(20, 24, t(o, 'grados: I, II, III…', 'degrees: I, II, III…'), { anchor: 'start', cls: 'm s' });
  return svg(o, { h: 230, alt: ALT.escalera, body: b, interactive: true });
}

// U5 · «Peldaños largos y cortos»: teclado (mi-fa y si-do sin tecla negra en medio) y escalera con peldaños de verdad
export function tonosSemitonos(o = {}) {
  const kw = 38, x0 = 28;
  const kb = keyboard(x0, 12, kw, 92, 0, 7, { o, mark: { 2: 'hi', 3: 'hi', 6: 'hi', 7: 'hi' }, playable: true });
  let b = kb.svg;
  STEPS_MAJOR.forEach((semi, i) => {
    const a = kb.cx(i), c = kb.cx(i + 1), half = semi === 1;
    b += `<path d="M${r1(a + 4)} 112 Q${r1((a + c) / 2)} 128 ${r1(c - 4)} 112" class="lmf-outline ${half ? 'hi' : 'm'}"/>`;
    b += text((a + c) / 2, 142, half ? '½' : 'T', { cls: half ? 'b l hi' : 'b m' });
  });
  b += text(180, 162, t(o, 'T = tono (paso grande) · ½ = semitono (paso corto)', 'T = tone (big step) · ½ = semitone (short step)'), { cls: 's b' });
  const st = stairs(x0, 292, kw, STEPS_MAJOR.map(s => s * 8), { first: 10, hiRise: i => STEPS_MAJOR[i - 1] === 1 });
  b += st.svg;
  [3, 7].forEach(i => { b += text(st.xs[i], st.tops[i] - 8, t(o, 'corto', 'short'), { cls: 's b hi' }); });
  b += text(x0 + 4, 180, t(o, 'Sin tecla negra en medio = medio tono', 'No black key in between = half step'), { anchor: 'start', cls: 's b hi' });
  return svg(o, { h: 300, alt: ALT.tonosSemitonos, body: b, interactive: true });
}

// U5 · «Tres notas nuevas»: la escala completa en el pentagrama; fa, si y do agudo resaltadas con su sitio
export function faSiDo(o = {}) {
  const S = staff(150, 10);
  let b = S.lines(14, 346) + S.clef(18);
  const xs = SCALE.map(i => 98 + i * 34);
  const tags = { 3: [t(o, 'fa: 1.er espacio', 'F: space 1'), 56, 'middle'], 6: [t(o, 'si: 3.ª línea (centro)', 'B: line 3 (middle)'), 38, 'end'], 7: [t(o, 'do: 3.er espacio', 'C: space 3'), 20, 'end'] };
  SCALE.forEach((s, i) => {
    const isNew = !!tags[s];
    b += S.note(xs[i], s, 'n', { cls: isNew ? 'hi' : 'mute' }) + text(xs[i], S.bottom + 44, nn(o, s), { cls: isNew ? 'b hi' : 'm' });
    if (isNew) {
      const [label, y, anchor] = tags[s];
      b += `<line x1="${xs[i]}" x2="${xs[i]}" y1="${y + 6}" y2="${S.y(s) - 12}" class="lmf-guide"/>` + text(anchor === 'end' ? xs[i] + 14 : xs[i], y, label, { anchor, cls: 'b hi s' });
    }
  });
  b += S.line(3, 14, 346, 'soft');
  return svg(o, { h: 206, alt: ALT.faSiDo, body: tap(60, 10, 296, 192, `| ${SCALE.map(s => pitch(s) + 'q').join(' ')} |`, t(o, 'Escuchar la escala', 'Listen to the scale'), b), interactive: true });
}

// U5 · «La redonda y su silencio»: el árbol de las figuras (1 redonda = 2 blancas = 4 negras = 8 corcheas)
// y los dos silencios largos: el de redonda cuelga de la 4.ª línea; el de blanca se sienta en la 3.ª
export function redonda(o = {}) {
  const x0 = 46, cw = 75;
  let b = '';
  const rows = [['w', 4, '1'], ['h', 2, '2'], ['q', 1, '4'], ['e2', 1, '8']];
  rows.forEach(([f, n, count], r) => {
    const y = 50 + r * 52, play = { w: '| C5w |', h: '| C5h C5h |', q: '| C5q C5q C5q C5q |', e2: '| C5e C5e C5e C5e C5e C5e C5e C5e |' }[f];
    let row = text(16, y + 4, count, { cls: r ? 'b l' : 'b l hi' });
    for (let k = 0; k < 4 / n; k++) {
      const cx = x0 + cw * (k * n + n / 2);
      row += f === 'e2' ? beamed([cx - 11, cx + 9], y, { s: 4.6 }) : figure(cx, y, f, { s: f === 'w' ? 7 : 4.6, cls: r ? '' : 'hi' }).svg;
      row += durBar(x0 + cw * k * n + 5, y + 13, cw * n - 10, r ? 'ink' : '', 4);
    }
    b += tap(8, y - 36, 344, 52, play, `${count} ${t(o, 'figuras', 'notes')}`, row);
  });
  b += beatRow(x0, 236, 4, cw, { size: 16 });
  const S = staff(304, 7);
  b += S.lines(20, 340) + S.rest(90, 'w', 'hi') + S.rest(250, 'h');
  b += text(90, 330, t(o, 'redonda: cuelga de la 4.ª', 'whole note: hangs from line 4'), { cls: 's b hi' });
  b += text(250, 330, t(o, 'blanca: se sienta en la 3.ª', 'half note: sits on line 3'), { cls: 's b' });
  return svg(o, { h: 338, alt: ALT.redonda, body: b, interactive: true });
}

// ---------- Unidad 6 ----------
const DYNS = [['pp', 'pianísimo', 'pianissimo', 'muy suave', 'very soft'], ['p', 'piano', 'piano', 'suave', 'soft'],
  ['mf', 'mezzoforte', 'mezzo forte', 'medio fuerte', 'medium loud'], ['f', 'forte', 'forte', 'fuerte', 'loud'], ['ff', 'fortísimo', 'fortissimo', 'muy fuerte', 'very loud']];

// U6 · «Los matices»: cinco peldaños de volumen, cada uno con su «burbuja» de sonido más grande
export function escaleraMatices(o = {}) {
  let b = '';
  DYNS.forEach(([sym, es, en, mes, men], i) => {
    const x = 44 + i * 68, bh = 12 + i * 13, rr = 7 + i * 4.5, cy = 150 - bh - rr - 8;
    let col = `<rect x="${x - 30}" y="${150 - bh}" width="60" height="${bh}" rx="3" class="lmf-soft${i % 2 ? '' : ' two'}"/>`;
    col += `<circle cx="${x}" cy="${r1(cy)}" r="${r1(rr)}" class="lmf-solid lmf-breathe" style="--i:${i};--amp:${1.03 + i * 0.04};opacity:${0.45 + i * 0.13}"/>`;
    col += text(x, 182, sym, { cls: 'dyn' }) + text(x, 202, o.lang === 'en' ? en : es, { cls: 's b' }) + text(x, 218, t(o, mes, men), { cls: 's m' });
    t(o, es, en);
    b += tap(x - 34, 8, 68, 216, '| G4q A4q G4h |', `${sym}: ${t(o, mes, men)}`, col, ` data-dyn="${sym}"`);
  });
  return svg(o, { h: 226, alt: ALT.escaleraMatices, body: b, interactive: true });
}

// Onda cuya amplitud va de a0 a a1 (crescendo o diminuendo)
function wave(x0, x1, y, a0, a1) {
  let d = `M${x0} ${y}`;
  for (let x = x0; x <= x1; x += 2) {
    const k = (x - x0) / (x1 - x0), a = a0 + (a1 - a0) * k;
    d += ` L${x} ${r1(y - a * Math.sin(((x - x0) / 26) * 2 * Math.PI))}`;
  }
  return d;
}

// U6 · «Poco a poco»: el regulador que se abre (crescendo) y el que se cierra (diminuendo), con su ola
export function reguladores(o = {}) {
  const row = (y, cresc) => {
    const [l, r] = cresc ? [0, 18] : [18, 0];
    let g = `<path d="M40 ${y - l} L320 ${y - r} M40 ${y + l} L320 ${y + r}" class="lmf-outline hi" style="stroke-width:3"/>`;
    g += `<path d="${wave(40, 320, y + 58, cresc ? 2 : 20, cresc ? 20 : 2)}" class="lmf-outline two"/>`;
    g += text(40, y - 28, cresc ? t(o, 'crescendo (cresc.): crece', 'crescendo (cresc.): grows') : t(o, 'diminuendo (dim.): mengua', 'diminuendo (dim.): fades'), { anchor: 'start', cls: 'b' });
    g += text(cresc ? 320 : 40, y + 92, cresc ? t(o, 'como la ola que llega', 'like a wave rolling in') : t(o, 'como la ola que se va', 'like a wave rolling out'), { anchor: cresc ? 'end' : 'start', cls: 's m' });
    return tap(28, y - 44, 304, 142, '| G4q A4q B4q C5q | D5h |', cresc ? 'crescendo' : 'diminuendo', g, ` data-dyn="${cresc ? 'cresc' : 'dim'}"`);
  };
  return svg(o, { h: 300, alt: ALT.reguladores, body: row(52, true) + row(196, false), interactive: true });
}

// U6 · «El calderón»: ojo y ceja sobre la nota; la nota dura «lo que diga el director»
export function calderon(o = {}) {
  let b = `<path d="M30 76 A42 42 0 0 1 114 76" class="lmf-outline hi" style="stroke-width:7"/><circle cx="72" cy="66" r="7" class="lmf-solid"/>`;
  b += figure(66, 162, 'q', { s: 9 }).svg;
  b += text(72, 20, t(o, 'ceja', 'eyebrow'), { cls: 'b hi' }) + `<line x1="72" x2="72" y1="26" y2="32" class="lmf-guide"/>`;
  b += text(122, 98, t(o, 'ojo', 'eye'), { anchor: 'start', cls: 'b hi' }) + `<line x1="80" x2="118" y1="68" y2="94" class="lmf-guide"/>`;
  const x0 = 168, cw = 46;
  const lane = (y, ferm, label) => {
    let g = text(x0, y - 60, label, { anchor: 'start', cls: 'b s' }) + figure(x0 + 18, y, 'q', { s: 5 }).svg;
    if (ferm) g += `<path d="M${x0 + 8} ${y - 40} A10 10 0 0 1 ${x0 + 28} ${y - 40}" class="lmf-outline hi" style="stroke-width:2.5"/><circle cx="${x0 + 18}" cy="${y - 42}" r="2" class="lmf-solid"/>`;
    g += durBar(x0 + 4, y + 10, cw - 8, ferm ? '' : 'ink');
    if (ferm) g += `<g class="lmf-hold">${durBar(x0 + cw - 6, y + 10, 70, '')}<rect x="${x0 + cw + 64}" y="${y + 10}" width="40" height="8" rx="4" class="lmf-dur" opacity=".35"/></g>`
      + text(x0 + cw + 128, y + 18, '…?', { cls: 'b hi' });
    return g;
  };
  b += lane(96, false, t(o, 'negra: 1 latido', 'quarter note: 1 beat'));
  b += lane(196, true, t(o, 'con calderón: ¡más larga!', 'with a fermata: longer!'));
  b += beatRow(x0, 228, 4, cw, { size: 14, anim: false });
  b += text(260, 254, t(o, 'no cuentes: mira al director', "don't count: watch the conductor"), { cls: 's b hi' });
  return svg(o, { h: 262, alt: ALT.calderon, body: tap(4, 4, 352, 256, '| G4q A4q B4q C5h^ |', t(o, 'Escuchar una nota con calderón', 'Listen to a note with a fermata'), b), interactive: true });
}

// U6 · «Re agudo»: re en la 4.ª línea y las nueve notas de do grave a re agudo
export function reAgudo(o = {}) {
  const S = staff(140, 9.5);
  let b = S.lines(14, 346) + S.clef(18) + S.line(4, 14, 346, 'hi');
  const steps = [...SCALE, 8];
  steps.forEach((s, i) => {
    const x = 96 + i * 30;
    b += S.note(x, s, 'n', { cls: s === 8 ? 'hi' : '' }) + text(x, S.bottom + 44, i + 1, { cls: s === 8 ? 'b hi' : 'm b' });
  });
  b += text(336, S.top - 10, t(o, 're: 4.ª línea', 'D: line 4'), { anchor: 'end', cls: 'b hi' });
  b += `<path d="M86 ${S.bottom + 52} v6 H342 v-6" class="lmf-outline m"/>` + text(206, S.bottom + 76, t(o, '¡9 notas, de do grave a re agudo!', '9 notes, from low C to high D!'), { cls: 'b' });
  return svg(o, { h: 226, alt: ALT.reAgudo, body: tap(60, 10, 296, 212, `| ${steps.map(s => pitch(s) + 'q').join(' ')} |`, t(o, 'Escuchar las nueve notas', 'Listen to the nine notes'), b), interactive: true });
}

export const ALT = {
  escalera: { es: 'Una escalera de ocho peldaños que sube de izquierda a derecha: do, re, mi, fa, sol, la, si, do, cada uno con su grado en números romanos (I a VIII). El primer y el último do están resaltados.', en: 'An eight-step staircase rising left to right: C, D, E, F, G, A, B, C, each with its degree in Roman numerals (I to VIII). The first and last C are highlighted.' },
  tonosSemitonos: { es: 'Teclado de do a do. Entre teclas blancas vecinas hay un tono (T) salvo entre mi-fa y si-do, resaltadas, que es medio tono (½) porque no hay tecla negra en medio. Debajo, una escalera con peldaños altos (tonos) y dos peldaños bajos (semitonos) en mi-fa y si-do.', en: 'A keyboard from C to C. Between neighbouring white keys there is a whole step (T) except E-F and B-C, highlighted, which are half steps (½) because there is no black key between them. Below, a staircase with tall steps (tones) and two short steps (semitones) at E-F and B-C.' },
  faSiDo: { es: 'Pentagrama con la escala de do. Las notas nuevas están resaltadas: fa en el 1.er espacio, si en la 3.ª línea (la del centro) y do agudo en el 3.er espacio.', en: 'A staff with the C scale. The new notes are highlighted: F in space 1, B on line 3 (the middle one) and high C in space 3.' },
  redonda: { es: 'Árbol de las figuras sobre cuatro latidos: una redonda dura los cuatro; dos blancas, dos cada una; cuatro negras, uno cada una; ocho corcheas, dos por latido. Debajo, los silencios: el de redonda cuelga de la 4.ª línea y el de blanca se sienta en la 3.ª.', en: 'Note-value tree over four beats: one whole note lasts all four; two half notes, two each; four quarter notes, one each; eight eighth notes, two per beat. Below, the rests: the whole note rest hangs from line 4 and the half note rest sits on line 3.' },
  escaleraMatices: { es: 'Cinco escalones de volumen de menor a mayor: pp (pianísimo, muy suave), p (piano, suave), mf (mezzoforte, medio fuerte), f (forte, fuerte) y ff (fortísimo, muy fuerte). Sobre cada uno, un círculo de sonido cada vez más grande.', en: 'Five volume steps from smallest to largest: pp (pianissimo, very soft), p (piano, soft), mf (mezzo forte, medium loud), f (forte, loud) and ff (fortissimo, very loud). Above each, a sound circle that gets bigger.' },
  reguladores: { es: 'Arriba, el regulador de crescendo, dos líneas que se abren hacia la derecha, con una ola que va creciendo. Abajo, el de diminuendo, que se cierra, con una ola que se va haciendo pequeña.', en: 'Top: the crescendo hairpin, two lines opening to the right, with a wave that grows. Bottom: the diminuendo hairpin, closing, with a wave that shrinks.' },
  calderon: { es: 'El calderón dibujado grande sobre una negra: un arco (la ceja) y un punto (el ojo). Al lado, una negra normal dura un latido; con calderón, su barra de duración se alarga más allá de los latidos, hasta que lo diga el director.', en: 'A large fermata over a quarter note: an arc (the eyebrow) and a dot (the eye). Beside it, a normal quarter note lasts one beat; with a fermata, its duration bar stretches beyond the beats, until the conductor says so.' },
  reAgudo: { es: 'Pentagrama con nueve notas que suben de do grave a re agudo, numeradas del 1 al 9. Re agudo, en la 4.ª línea resaltada.', en: 'A staff with nine notes rising from low C to high D, numbered 1 to 9. High D sits on the highlighted fourth line.' },
};
