// Nivel 1 · Unidades 3 (Sonidos largos) y 4 (Vals en tres)
import { W, t, nn, pitch, text, arrow, callout, heart, beatStyle, durBar, figure, beamed, restQ, rhythmStrip, staff, keyboard, svg, tap, moveAlong, r1 } from './kit.js';

const tapAll = (o, x, y, w, h, play, inner, extra = '') => tap(x, y, w, h, play, t(o, 'Escuchar el ejemplo', 'Listen to the example'), inner, extra);

// U3 · «La blanca: dos latidos»: cabeza hueca y plica; vale dos negras; su línea de duración ocupa dos latidos
export function blanca(o = {}) {
  const big = figure(60, 104, 'h', { s: 13 });
  let b = big.svg;
  b += callout(big.sx, 52, 96, 44, t(o, 'plica', 'stem'));
  b += callout(64, 104, 96, 92, t(o, 'cabeza hueca', 'hollow head'));
  b += figure(196, 78, 'h', { s: 6.5 }).svg + text(222, 72, '=', { cls: 'l' });
  b += figure(250, 78, 'q', { s: 6.5 }).svg + text(276, 72, '+', { cls: 'l' }) + figure(302, 78, 'q', { s: 6.5 }).svg;
  b += text(258, 106, t(o, 'dos negras juntas', 'two quarter notes together'), { cls: 'b hi' });
  b += rhythmStrip([
    { f: 'h', n: 2, syl: ['taa', 'a'], sweep: 3 },
    { f: 'q', n: 1, syl: ['ta'], cls: 'ink' },
    { f: 'q', n: 1, syl: ['ta'], cls: 'ink' },
  ], { y: 168 });
  return svg(o, { h: 236, alt: ALT.blanca, body: b + tapAll(o, 14, 126, 332, 110, '| G4h G4q G4q |'), interactive: true });
}

// Sombrero de copa (para «sentado como un sombrero»)
const hat = (x, y) => `<rect x="${x - 11}" y="${y - 22}" width="22" height="22" rx="2" class="lmf-soft"/><rect x="${x - 18}" y="${y - 2}" width="36" height="5" rx="2.5" class="lmf-solid"/>`;

// U3 · «El silencio de blanca»: rectángulo sentado encima de la 3.ª línea; dura dos latidos sin sonar
export function silencioBlanca(o = {}) {
  const S = staff(122, 12);
  let b = S.lines(16, 176) + S.line(3, 16, 176, 'hi') + S.rest(96, 'h', 'hi');
  b += text(182, S.lineY(3) + 4, t(o, '3.ª línea', 'line 3'), { anchor: 'start', cls: 'b hi' });
  b += hat(290, 64) + text(290, 86, t(o, 'sentado encima,', 'sitting on top,'), { cls: 's' }) + text(290, 100, t(o, 'como un sombrero', 'like a hat'), { cls: 's' });
  b += arrow(262, 52, 116, S.lineY(3) - 16, { cls: 'hi', bend: 18 });
  b += rhythmStrip([
    { f: 'q', n: 1, syl: ['ta'], cls: 'ink' },
    { f: 'Rh', n: 2, syl: ['(sss', 's)'], cls: 'hi' },
    { f: 'q', n: 1, syl: ['ta'], cls: 'ink' },
  ], { y: 176 });
  return svg(o, { h: 244, alt: ALT.silencioBlanca, body: b + tapAll(o, 14, 136, 332, 108, '| G4q Rh G4q |'), interactive: true });
}

// U3 · «El compás de 4/4»: 4/4 = C; una pelota bota en cada pulso, más alto antes del fuerte (1) y del semifuerte (3)
export function compas44(o = {}) {
  const S = staff(84, 8);
  let b = S.lines(18, 74) + S.time(46, 4, 4, 'hi') + text(98, 62, '=', { cls: 'l' });
  b += S.lines(116, 162) + `<text x="139" y="${S.lineY(1) - 0.2 * S.h}" text-anchor="middle" class="lmf-time hi" style="font-size:${7.4 * S.h}px">C</text>`;
  b += text(186, 40, t(o, '4 pulsos de negra', '4 quarter note beats'), { anchor: 'start', cls: 'b' });
  b += text(186, 58, t(o, 'en cada compás.', 'in every bar.'), { anchor: 'start', cls: 'b' });
  b += text(186, 76, t(o, 'También se escribe C', 'Also written as C'), { anchor: 'start', cls: 'm s' });
  const xs = [44, 116, 188, 260, 332], ground = 186, sizes = [17, 8, 12.5, 8, 17];
  const labels = [t(o, 'UN', 'ONE'), t(o, 'dos', 'two'), t(o, 'TRES', 'THREE'), t(o, 'cua-tro', 'four'), t(o, 'UN', 'ONE')];
  const peaks = [0, 150, 124, 150, 100]; // salto bajo hacia los débiles, medio hacia el 3, alto hacia el 1
  let d = `M${xs[0]} ${ground - 8}`;
  for (let k = 1; k < xs.length; k++) d += ` Q${(xs[k - 1] + xs[k]) / 2} ${peaks[k] - (ground - peaks[k])} ${xs[k]} ${ground - 8}`;
  b += `<path d="${d}" class="lmf-path"/>`;
  xs.forEach((x, k) => {
    const last = k === 4;
    b += `<ellipse cx="${x}" cy="${ground}" rx="${sizes[k] * 1.5}" ry="${r1(sizes[k] * 0.45)}" class="${k === 0 || last ? 'lmf-solid' : k === 2 ? 'lmf-soft' : 'lmf-soft two'}"${last ? ' opacity=".4"' : ''}/>`;
    b += text(x, ground + 26, labels[k], { cls: k === 0 || k === 2 ? 'b l hi' : 'm', size: k === 2 ? 15 : null });
  });
  b += `<line x1="296" x2="296" y1="128" y2="${ground + 30}" class="lmf-bar"/>`;
  b += moveAlong(o, d, 3, { r: 7 });
  b += text(xs[0], ground + 42, t(o, 'fuerte', 'strong'), { cls: 's b hi' }) + text(xs[2], ground + 42, t(o, 'medio', 'medium'), { cls: 's b hi' });
  return svg(o, { h: 236, alt: ALT.compas44, body: tapAll(o, 10, 100, 340, 136, '| C5q C5q C5q C5q |', b, ' data-sound="acento:4"'), interactive: true });
}

// Casita (la tónica, «en casa»)
export const house = (x, y, s = 1, cls = 'lmf-soft') => `<path d="M${x - 14 * s} ${y} v${-14 * s} l${14 * s} ${-12 * s} l${14 * s} ${12 * s} v${14 * s} z" class="${cls}"/>`
  + `<rect x="${x - 4 * s}" y="${y - 9 * s}" width="${8 * s}" height="${9 * s}" class="lmf-solid"/>`;

// U3 · «Do, la nota casa»: do grave con su línea adicional; la melodía baja y llega a casa
export function doLineaAdicional(o = {}) {
  const S = staff(118, 10);
  let b = S.lines(14, 346) + S.clef(18);
  const notes = [[100, 2], [142, 4], [184, 2], [226, 0]];
  notes.forEach(([x, st]) => { b += S.note(x, st, 'q', { cls: st === 0 ? 'hi' : '', ledgerCls: 'hi' }); });
  b += S.bar(254) + S.note(282, 0, 'h', { cls: 'hi', ledgerCls: 'hi' }) + S.final(344);
  b += arrow(150, S.y(0) + 30, 204, S.y(0) + 3, { cls: 'hi', bend: -8 });
  b += text(96, S.y(0) + 40, t(o, 'línea adicional:', 'ledger line:'), { cls: 'b hi' });
  b += text(96, S.y(0) + 56, t(o, 'una rayita solo para esa nota', 'a little line just for that note'), { cls: 'm s' });
  b += house(282, S.y(0) + 52, 1) + text(282, S.y(0) + 70, t(o, '¡en casa!', 'home!'), { cls: 'b hi' });
  b += notes.map(([x, st]) => text(x, 14, nn(o, st), { cls: st === 0 ? 'b hi' : 'm' })).join('') + text(282, 14, nn(o, 0), { cls: 'b hi' });
  return svg(o, { h: 214, alt: ALT.doLineaAdicional, body: tapAll(o, 60, 6, 290, 150, '| E4q G4q E4q C4q | C4h Rh |', b), interactive: true });
}

// ---------- Unidad 4 ----------
const polar = (cx, cy, r, deg) => [r1(cx + r * Math.cos((deg * Math.PI) / 180)), r1(cy + r * Math.sin((deg * Math.PI) / 180))];

// U4 · «Contar hasta tres»: el compás de 3/4 como una vuelta de vals (tres porciones, la primera pesa)
export function compas34(o = {}) {
  const cx = 92, cy = 108, r = 66;
  let b = '';
  [[-90, 30], [30, 150], [150, 270]].forEach(([a0, a1], k) => {
    const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
    b += `<path d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" class="${k === 0 ? 'lmf-soft' : 'lmf-box'}"/>`;
  });
  const lab = [[t(o, 'UN', 'ONE'), -30, 'b l hi'], [t(o, 'dos', 'two'), 90, 'm'], [t(o, 'tres', 'three'), 210, 'm']];
  lab.forEach(([s, a, cls]) => { const [x, y] = polar(cx, cy, r * 0.55, a); b += text(x, y + 5, s, { cls }); });
  b += arrow(...polar(cx, cy, r + 10, -60), ...polar(cx, cy, r + 10, -20), { cls: 'hi', bend: -4 });
  const [sx, sy] = polar(cx, cy, r, -90);
  b += `<circle cx="${sx}" cy="${sy}" r="6" class="lmf-solid"/>`;
  b += moveAlong(o, `M${sx} ${sy} A${r} ${r} 0 1 1 ${sx - 0.1} ${sy}`, 2.25, { r: 7 });
  b += text(cx, cy + r + 26, t(o, '1 vuelta = 1 compás', '1 turn = 1 bar'), { cls: 'b' });
  const S = staff(124, 7);
  let m = S.lines(176, 350) + S.time(188, 3, 4, 'hi');
  m += S.note(228, 4, 'q', { cls: 'hi' }) + S.note(258, 4) + S.note(288, 4) + S.bar(308) + S.note(330, 4, 'h', { cls: 'hi' });
  m += [[228, 'UN', 'ONE'], [258, 'dos', 'two'], [288, 'tres', 'three']].map(([x, es, en], k) => text(x, S.bottom + 26, t(o, es, en), { cls: k ? 'm s' : 'b hi' })).join('');
  b += tapAll(o, 172, 40, 182, 120, '| G4q G4q G4q | G4h G4q |', m, ' data-sound="acento:3"');
  return svg(o, { h: 206, alt: ALT.compas34, body: b, interactive: true });
}

// U4 · «¿Qué cabe en 3/4?»: una caja de tres latidos; lo que cabe (✓) y lo que se sale (✕)
export function queCabe(o = {}) {
  const x0 = 128, cw = 52, box = 3 * cw;
  let b = `<rect x="${x0}" y="34" width="${box}" height="262" rx="10" class="lmf-zone"/><rect x="${x0}" y="34" width="${box}" height="262" rx="10" class="lmf-box hi"/>`;
  for (let k = 0; k < 3; k++) b += heart(x0 + cw * (k + 0.5), 20, 16, 'lmf-heart') + (k ? `<line x1="${x0 + cw * k}" x2="${x0 + cw * k}" y1="34" y2="296" class="lmf-guide"/>` : '');
  const rows = [
    [t(o, 'tres negras', 'three quarter notes'), [['q', 1], ['q', 1], ['q', 1]], true],
    [t(o, 'blanca + negra', 'half note + quarter note'), [['h', 2], ['q', 1]], true],
    [t(o, 'seis corcheas', 'six eighth notes'), [['e2', 1], ['e2', 1], ['e2', 1]], true],
    [t(o, 'una redonda', 'a whole note'), [['w', 4]], false],
    [t(o, 'dos blancas', 'two half notes'), [['h', 2], ['h', 2]], false],
  ];
  rows.forEach(([name, figs, ok], i) => {
    const y = 78 + i * 50;
    b += text(122, y + 4, name, { anchor: 'end', cls: ok ? 'b s' : 'b s bad' });
    let pos = 0;
    for (const [f, n] of figs) {
      const x = x0 + cw * pos;
      b += f === 'e2' ? beamed([x + 14, x + 32], y - 2, { s: 4 }) : figure(x + 16, y - 2, f, { s: 4.2, cls: pos + n > 3 ? 'mute' : '' }).svg;
      const fits = Math.max(0, Math.min(n, 3 - pos));
      if (fits) b += durBar(x + 4, y + 8, cw * fits - 8, 'ink');
      if (pos + n > 3) b += durBar(x0 + box + 2 + (pos > 3 ? cw * (pos - 3) : 0), y + 8, cw * (pos + n - Math.max(3, pos)) - 8, 'bad');
      pos += n;
    }
    b += text(352, y + 6, ok ? '✓' : '✕', { anchor: 'end', cls: ok ? 'l ok' : 'l bad' });
  });
  b += text(x0 + box / 2, 314, t(o, 'la caja de un compás de 3/4', 'the box of one 3/4 bar'), { cls: 'm s' });
  return svg(o, { h: 322, alt: ALT.queCabe, body: b });
}

// U4 · «Repetir sin escribir dos veces»: el camino de ida, la vuelta a los puntos y la segunda pasada
export function repeticion(o = {}) {
  const S = staff(118, 9);
  let b = S.lines(14, 346) + S.clef(16) + S.repStart(70, 'hi');
  b += S.note(118, 4) + S.note(154, 5) + S.note(190, 4) + S.bar(214) + S.note(246, 2, 'h') + S.repEnd(330, 'hi');
  const go1 = 'M98 40 L300 40', back = 'M330 128 C330 178 96 178 96 136', go2 = 'M96 210 L300 210';
  b += `<path d="${go1}" class="lmf-path"/>` + arrow(280, 40, 304, 40, { cls: 'hi' }) + text(98, 30, t(o, '1.ª vez', '1st time'), { anchor: 'start', cls: 'b hi' });
  b += `<path d="${back}" class="lmf-arrow two"/>` + arrow(100, 150, 96, 136, { cls: 'two' });
  b += text(213, 182, t(o, 'vuelve a los puntos', 'go back to the dots'), { cls: 'b two' });
  b += `<path d="${go2}" class="lmf-path"/>` + arrow(280, 210, 304, 210, { cls: 'hi' }) + text(98, 228, t(o, '2.ª vez… y sigue', '2nd time… and go on'), { anchor: 'start', cls: 'b hi' });
  b += moveAlong(o, `${go1} L330 40 L330 128 C330 178 96 178 96 136 L96 210 L300 210`, 6, { r: 6 });
  b += text(352, 250, t(o, 'Sin |: vuelve al principio', 'No |: means from the start'), { anchor: 'end', cls: 'm s' });
  return svg(o, { h: 258, alt: ALT.repeticion, body: tapAll(o, 60, 50, 290, 90, '| G4q A4q G4q | E4h | G4q A4q G4q | E4h |', b), interactive: true });
}

// U4 · «Re y la pentatónica»: cinco teclas (do re mi sol la) en el teclado y en el pentagrama; fa y si se quedan fuera
export function pentatonica(o = {}) {
  const penta = [0, 1, 2, 4, 5];
  const mark = { 0: 'hi', 1: 'hi', 2: 'hi', 3: 'off', 4: 'hi', 5: 'hi', 6: 'off' };
  const kb = keyboard(62, 30, 36, 92, 0, 6, { o, mark, playable: true });
  let b = kb.svg;
  penta.forEach((st, i) => { b += `<circle cx="${r1(kb.cx(st))}" cy="18" r="9" class="lmf-solid"/>` + text(kb.cx(st), 22, i + 1, { cls: 'b on s' }); });
  b += text(338, 70, t(o, 'penta', 'penta'), { cls: 'b hi' }) + text(338, 86, '= 5', { cls: 'b hi' });
  const S = staff(208, 7.5);
  let m = S.lines(20, 340) + S.clef(22);
  penta.forEach((st, i) => { m += S.note(110 + i * 48, st, 'n', { cls: st === 1 ? 'hi' : '' }) + text(110 + i * 48, S.bottom + 34, nn(o, st), { cls: st === 1 ? 'b hi' : 'b' }); });
  m += text(158, S.bottom + 50, t(o, '(colgado de la 1.ª línea)', '(hanging under line 1)'), { cls: 'm s hi' });
  b += tapAll(o, 70, 140, 290, 126, `| ${penta.map(s => pitch(s) + 'q').join(' ')} |`, m);
  return svg(o, { h: 266, alt: ALT.pentatonica, body: b, interactive: true });
}

export const ALT = {
  blanca: { es: 'Una blanca grande: cabeza hueca y plica. Una blanca vale lo mismo que dos negras juntas. Debajo, una blanca cuya barra de duración ocupa dos latidos («taa-a») seguida de dos negras de un latido.', en: 'A large half note: hollow head and stem. One half note equals two quarter notes together. Below, a half note whose duration bar spans two beats (“taa-a”) followed by two one-beat quarter notes.' },
  silencioBlanca: { es: 'Un trozo de pentagrama con la 3.ª línea resaltada y el silencio de blanca sentado encima, como un sombrero. Debajo: negra, silencio de blanca de dos latidos y negra.', en: 'A piece of staff with line 3 highlighted and the half note rest sitting on top of it, like a hat. Below: quarter note, two-beat half note rest, quarter note.' },
  compas44: { es: 'El compás 4/4, que también se escribe con una C. Una pelota bota en los cuatro pulsos: en el 1 («UN») cae más fuerte, en el 3 («TRES») medio fuerte, y en el 2 y el 4 suave.', en: 'The 4/4 time signature, also written as a C. A ball bounces on the four beats: it lands hardest on 1 (“ONE”), medium on 3 (“THREE”) and softly on 2 and 4.' },
  doLineaAdicional: { es: 'Pentagrama con la melodía mi, sol, mi, do y un do largo al final. El do grave está debajo del pentagrama, atravesado por una línea adicional resaltada. Junto al último do, una casita: «¡en casa!».', en: 'A staff with the melody E, G, E, C and a long C at the end. Low C sits below the staff, crossed by a highlighted ledger line. Next to the last C, a little house: “home!”.' },
  compas34: { es: 'Un círculo dividido en tres porciones: «UN» (resaltada), «dos» y «tres»; una vuelta completa es un compás de 3/4, como un paso de vals. Al lado, un compás 3/4 con tres negras y otro con blanca y negra.', en: 'A circle split into three slices: “ONE” (highlighted), “two” and “three”; one full turn is one 3/4 bar, like a waltz step. Beside it, a 3/4 bar with three quarter notes and another with a half note and a quarter note.' },
  queCabe: { es: 'Una caja del ancho de tres latidos. Caben tres negras, blanca y negra, o seis corcheas (✓). Una redonda y dos blancas se salen por la derecha, en rojo (✕).', en: 'A box three beats wide. Three quarter notes, a half note and a quarter note, or six eighth notes fit (✓). A whole note and two half notes stick out on the right in red (✕).' },
  repeticion: { es: 'Pentagrama con barra de inicio de repetición y barra de final de repetición, cada una con dos puntos. Flechas: primera pasada hacia la derecha, vuelta hacia atrás hasta los puntos del principio y segunda pasada. Si no hay barra de inicio, se vuelve al principio.', en: 'A staff with a start-repeat and an end-repeat bar, each with two dots. Arrows: first time through to the right, back to the start dots, and second time through. If there is no start sign, go back to the beginning.' },
  pentatonica: { es: 'Teclado de do a si con cinco teclas resaltadas y numeradas: do, re, mi, sol y la; fa y si quedan tachadas. Debajo, las mismas cinco notas en el pentagrama; re cuelga justo debajo de la 1.ª línea.', en: 'A keyboard from C to B with five highlighted, numbered keys: C, D, E, G and A; F and B are crossed out. Below, the same five notes on the staff; D hangs just under line 1.' },
};
