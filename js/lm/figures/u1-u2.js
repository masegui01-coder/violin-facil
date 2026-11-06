// Nivel 1 · Unidades 1 (El latido) y 2 (Corcheas a pares). Cada función recibe o = { lang, nom, still } y devuelve SVG.
import { W, t, nn, text, arrow, callout, heart, beatRow, beatStyle, figure, beamed, restQ, rhythmStrip, staff, svg, tap, r1 } from './kit.js';

// U1 · «Tu corazón ya sabe música»: cuatro corazones sobre la línea del tiempo, a la misma distancia
export function corazonesPulso(o = {}) {
  const xs = [60, 140, 220, 300];
  let b = xs.map((x, k) => heart(x, 52, 46, 'lmf-heart lmf-beat', beatStyle(k)) + text(x, 100, 'tum', { cls: 'b l' })).join('');
  b += arrow(20, 124, 308, 124, { cls: 'ink', head: 8 });
  b += xs.map(x => `<line x1="${x}" x2="${x}" y1="117" y2="131" class="lmf-bar"/>`).join('');
  b += text(313, 129, t(o, 'tiempo', 'time'), { anchor: 'start', cls: 'm s' });
  for (let k = 0; k < 3; k++) b += arrow(xs[k] + 8, 144, xs[k + 1] - 8, 144, { cls: 'hi', head: 5 }) + arrow(xs[k + 1] - 8, 144, xs[k] + 8, 144, { cls: 'hi', head: 5 });
  b += text(180, 168, t(o, 'siempre a la misma distancia: eso es el pulso', 'always the same distance apart: that is the beat'), { cls: 'hi' });
  const body = tap(0, 0, W, 176, '| C5q C5q C5q C5q |', t(o, 'Escuchar el pulso', 'Listen to the beat'), b, ' data-sound="pulso"');
  return svg(o, { h: 176, alt: ALT.corazonesPulso, body, interactive: true });
}

// U1 · «La negra: un latido»: la negra por partes y cuatro negras sobre cuatro latidos (con su línea de duración)
export function negra(o = {}) {
  const big = figure(62, 104, 'q', { s: 13 });
  let b = big.svg;
  b += callout(big.sx, 52, 104, 46, t(o, 'plica (el palito)', 'stem (the stick)'));
  b += callout(70, 106, 104, 104, t(o, 'cabeza rellena', 'filled-in head'));
  b += text(262, 34, t(o, 'dura', 'lasts'), { cls: 'm' }) + heart(262, 66, 40, 'lmf-heart lmf-beat', beatStyle(0, 1, 1.5));
  b += text(262, 108, t(o, '1 latido', '1 beat'), { cls: 'b hi' });
  b += strip(o, ['q', 'q', 'q', 'q'], 'ta');
  return svg(o, { h: 226, alt: ALT.negra, body: b + tapRow(o, 124, 102, '| G4q G4q | G4q G4q |'), interactive: true });
}

// Tira de cuatro latidos (negras y silencios de negra) con líneas de duración, corazones y sílabas
const strip = (o, figs, syl) => rhythmStrip(figs.map(f => (f === 'R' ? { f: 'R', n: 1, syl: ['(sss)'] } : { f: 'q', n: 1, syl: [syl] })), { y: 160 });
const tapRow = (o, y, h, play) => tap(14, y, 332, h, play, t(o, 'Escuchar el ejemplo', 'Listen to the example'), '');

// U1 · «El silencio de negra»: parece un rayo; dura un latido sin sonar, el corazón sigue
export function silencioNegra(o = {}) {
  let b = restQ(52, 22, 13);
  b += `<path d="M126 20 L108 60 L121 60 L112 96 L142 50 L128 50 L138 20 Z" class="lmf-soft"/>`;
  b += text(126, 114, t(o, '¿un rayo?', 'a lightning bolt?'), { cls: 'm s' });
  b += text(262, 34, t(o, 'dura', 'lasts'), { cls: 'm' }) + heart(262, 66, 40, 'lmf-heart lmf-beat', beatStyle(0, 1, 1.5));
  b += text(262, 108, t(o, '1 latido sin sonar', '1 silent beat'), { cls: 'b hi' });
  b += strip(o, ['q', 'R', 'q', 'R'], 'ta');
  return svg(o, { h: 226, alt: ALT.silencioNegra, body: b + tapRow(o, 124, 102, '| G4q Rq | G4q Rq |'), interactive: true });
}

// U1 · «La casa de las notas»: líneas y espacios numerados de abajo arriba, nota en línea y nota en espacio
export function pentagrama(o = {}) {
  const S = staff(150, 13), x0 = 66, x1 = 286;
  let b = [1, 2, 3, 4, 5].map(n => `<line x1="${x0}" x2="${x1}" y1="${S.lineY(n)}" y2="${S.lineY(n)}" class="lmf-line"/>`).join('');
  b += text(x0 - 22, 26, t(o, 'líneas', 'lines'), { cls: 'b' }) + text(x1 + 20, 26, t(o, 'espacios', 'spaces'), { cls: 'b hi' });
  for (let n = 1; n <= 5; n++) b += `<circle cx="${x0 - 22}" cy="${S.lineY(n)}" r="11" class="lmf-solid ink"/>` + text(x0 - 22, S.lineY(n) + 5, n, { cls: 'b on s' });
  for (let n = 1; n <= 4; n++) b += `<rect x="${x1 + 13}" y="${S.lineY(n) - 21}" width="22" height="16" rx="8" class="lmf-solid"/>` + text(x1 + 24, S.lineY(n) - 9, n, { cls: 'b on s' });
  b += tap(108, S.lineY(3) - 4, 60, 64, '| G4q |', `${nn(o, 4)}: ${t(o, 'nota en línea', 'note on a line')}`, S.note(138, 4, 'q'));
  b += tap(192, S.lineY(3) - 4, 60, 64, '| A4q |', `${nn(o, 5)}: ${t(o, 'nota en espacio', 'note in a space')}`, S.note(222, 5, 'q', { cls: 'hi' }));
  b += text(118, 176, t(o, 'en línea:', 'on a line:'), { cls: 'b s' }) + text(118, 191, t(o, 'la raya la cruza', 'line through it'), { cls: 'm s' });
  b += text(252, 176, t(o, 'en espacio:', 'in a space:'), { cls: 'b s hi' }) + text(252, 191, t(o, 'entre dos rayas', 'between lines'), { cls: 'm s' });
  b += arrow(346, 150, 346, 58, { cls: 'hi', head: 7 });
  b += text(358, 44, t(o, 'agudo', 'higher'), { anchor: 'end', cls: 's b hi' }) + text(358, 166, t(o, 'grave', 'lower'), { anchor: 'end', cls: 's b m' });
  return svg(o, { h: 200, alt: ALT.pentagrama, body: b, interactive: true });
}

// U1 · «La llave: clave de sol»: la clave se enrosca en la 2.ª línea, que pasa a llamarse sol; mi debajo
export function claveSol(o = {}) {
  const S = staff(152, 11);
  let b = S.lines(14, 346) + S.line(2, 14, 346, 'hi') + S.clef(18);
  const c = S.clefCurl(18);
  b += `<circle cx="${r1(c.x)}" cy="${r1(c.y)}" r="${r1(c.r)}" class="lmf-outline hi lmf-draw" style="--len:${Math.ceil(2 * Math.PI * c.r)}"/>`;
  b += arrow(118, 22, c.x + c.r * 0.8, c.y - c.r * 0.8, { cls: 'hi', bend: -14 });
  b += text(122, 22, t(o, 'se enrosca en la 2.ª línea…', 'it curls around line 2…'), { anchor: 'start', cls: 'b' });
  b += text(122, 40, t(o, '…y esa línea se llama SOL', '…so that line is called G (sol)'), { anchor: 'start', cls: 'b hi' });
  b += tap(150, 60, 70, 120, '| G4q |', nn(o, 4), S.note(185, 4, 'q', { cls: 'hi' }) + text(185, 180, `${nn(o, 4)} · ${t(o, '2.ª línea', 'line 2')}`, { cls: 'b hi' }));
  b += tap(250, 60, 80, 120, '| E4q |', nn(o, 2), S.note(285, 2, 'q') + text(285, 180, `${nn(o, 2)} · ${t(o, '1.ª línea', 'line 1')}`, { cls: 'b' }));
  return svg(o, { h: 190, alt: ALT.claveSol, body: b, interactive: true });
}

// ---------- Unidad 2 ----------
function foot(x, y, s, fill, extra = '') {
  return `<g class="lmf-glow"${extra}><ellipse cx="${x}" cy="${y}" rx="${r1(s * 0.42)}" ry="${r1(s * 0.62)}" class="lmf-solid ${fill}"/>`
    + [-0.32, 0, 0.32].map((d, i) => `<circle cx="${r1(x + d * s)}" cy="${r1(y - s * (0.86 + (i === 1 ? 0.12 : 0)))}" r="${r1(s * 0.13)}" class="lmf-solid ${fill}"/>`).join('') + '</g>';
}

// U2 · «Andar y correr»: una huella por latido (negras) o dos huellas por latido (corcheas, «co-rre»)
export function andarCorrer(o = {}) {
  const x0 = 76, cw = 68;
  let b = '';
  for (let k = 0; k <= 4; k++) b += `<line x1="${x0 + k * cw}" x2="${x0 + k * cw}" y1="10" y2="222" class="lmf-guide"/>`;
  b += text(8, 56, t(o, 'Andar', 'Walk'), { anchor: 'start', cls: 'b l' }) + text(8, 72, t(o, 'negras', 'quarters'), { anchor: 'start', cls: 'm s' });
  b += text(8, 152, t(o, 'Correr', 'Run'), { anchor: 'start', cls: 'b l two' }) + text(8, 168, t(o, 'corcheas', 'eighths'), { anchor: 'start', cls: 'm s' });
  let walk = '', run = '';
  for (let k = 0; k < 4; k++) {
    const cx = x0 + cw * (k + 0.5);
    walk += foot(cx + (k % 2 ? 6 : -6), 30, 16, 'ink', beatStyle(k));
    walk += figure(cx - 3, 86, 'q', { s: 5 }).svg + text(cx, 106, 'ta', { cls: 'b' });
    [0, 1].forEach(j => {
      const fx = cx - 15 + j * 30;
      run += foot(fx, 132 + (j ? -4 : 4), 12, 'two', beatStyle(k * 2 + j, 8, 0.375));
    });
    run += beamed([cx - 15, cx + 13], 180, { s: 5, cls: 'two' });
    run += text(cx - 15, 200, 'co', { cls: 'b two' }) + text(cx + 13, 200, 'rre', { cls: 'b two' });
  }
  b += tap(x0, 8, cw * 4, 104, '| G4q G4q | G4q G4q |', t(o, 'Escuchar andar: negras', 'Listen to walking: quarter notes'), walk);
  b += tap(x0, 114, cw * 4, 92, '| G4e G4e G4e G4e | G4e G4e G4e G4e |', t(o, 'Escuchar correr: corcheas', 'Listen to running: eighth notes'), run);
  b += beatRow(x0, 222, 4, cw, { size: 16 });
  b += text(8, 227, t(o, 'latido', 'beat'), { anchor: 'start', cls: 'm s' });
  return svg(o, { h: 236, alt: ALT.andarCorrer, body: b, interactive: true, cls: 'lmf-u2' });
}

// U2 · «El compás de 2/4»: qué dice cada número y los pulsos de dos en dos (fuerte-débil)
export function compas24(o = {}) {
  const S = staff(104, 11);
  let b = S.lines(20, 92) + S.time(56, 2, 4, 'hi');
  b += arrow(84, S.lineY(4), 116, 40, { cls: 'hi', head: 6 });
  b += text(122, 36, t(o, '2 pulsos en cada compás', '2 beats in every bar'), { anchor: 'start', cls: 'b' });
  b += arrow(84, S.lineY(2), 116, 98, { cls: 'hi', head: 6 });
  b += text(122, 94, t(o, 'cada pulso vale una negra', 'each beat is a quarter note'), { anchor: 'start', cls: 'b' });
  b += figure(316, 100, 'q', { s: 5.5 }).svg;
  const xs = [40, 92, 158, 210, 276, 328];
  xs.forEach((x, k) => {
    const strong = k % 2 === 0;
    b += `<circle cx="${x}" cy="150" r="${strong ? 15 : 8}" class="${strong ? 'lmf-solid' : 'lmf-soft'} lmf-beat"${beatStyle(k, 6)}/>`;
    b += text(x, 188, strong ? t(o, 'UN', 'ONE') : t(o, 'dos', 'two'), { cls: strong ? 'b l hi' : 'm' });
  });
  [125, 243].forEach(x => { b += `<line x1="${x}" x2="${x}" y1="128" y2="196" class="lmf-bar"/>`; });
  const body = tap(10, 124, 340, 76, '| C5q C5q | C5q C5q | C5q C5q |', t(o, 'Escuchar fuerte-débil en 2/4', 'Listen to strong-weak in 2/4'), b, ' data-sound="acento:2"');
  return svg(o, { h: 202, alt: ALT.compas24, body, interactive: true });
}

// U2 · «Barras y doble barra»: compases como habitaciones separadas por paredes; la doble barra cierra la obra
export function barras(o = {}) {
  const S = staff(112, 10);
  const zone = (x, w, cls) => `<rect x="${x}" y="${S.top - 6}" width="${w}" height="${8 * S.h + 34}" rx="6" class="lmf-zone ${cls}"/>`;
  let b = zone(100, 116, '') + zone(216, 122, 'two');
  b += text(158, S.bottom + 22, t(o, 'compás 1', 'bar 1'), { cls: 'b hi' }) + text(277, S.bottom + 22, t(o, 'compás 2', 'bar 2'), { cls: 'b two' });
  b += S.lines(12, 338) + S.clef(14) + S.time(84, 2, 4);
  b += S.pair(124, 152, 5) + S.note(188, 5) + S.bar(216, 'hi') + S.note(252, 4) + S.rest(298, 'q') + S.final(338);
  b += arrow(216, 168, 216, S.bottom + 32, { cls: 'hi' }) + text(216, 184, t(o, 'barra divisoria', 'bar line'), { cls: 'b hi' });
  b += arrow(334, 188, 337, S.bottom + 32, { cls: 'ink' }) + text(352, 202, t(o, 'doble barra final: ¡fin!', 'final double bar: the end!'), { anchor: 'end', cls: 'b' });
  const body = tap(90, 20, 252, 110, '| A4e A4e A4q | G4q Rq |', t(o, 'Escuchar los dos compases', 'Listen to the two bars'), b);
  return svg(o, { h: 210, alt: ALT.barras, body, interactive: true });
}

// U2 · «Nueva nota: la»: la, en el 2.º espacio; sol-la es un paso que sube y la-mi un salto que baja
export function notaLa(o = {}) {
  const S = staff(136, 12);
  let b = S.lines(14, 346) + S.clef(18);
  b += arrow(150, S.y(4) - 14, 198, S.y(5) - 14, { cls: 'hi', bend: -12 }) + text(172, S.top - 8, t(o, 'paso ↑', 'step ↑'), { cls: 'b hi' });
  b += arrow(224, S.y(5) - 14, 292, S.y(2) - 12, { cls: 'two', bend: -30 }) + text(262, S.top - 8, t(o, 'salto ↓', 'leap ↓'), { cls: 'b two' });
  b += tap(112, 40, 60, 130, '| G4q |', nn(o, 4), S.note(140, 4, 'n') + text(140, 170, nn(o, 4), { cls: 'b' }));
  b += tap(180, 40, 60, 130, '| A4q |', `${nn(o, 5)}: ${t(o, '2.º espacio', 'space 2')}`, `<rect x="186" y="${S.lineY(3)}" width="48" height="${2 * S.h}" rx="4" class="lmf-zone"/>` + S.note(210, 5, 'n', { cls: 'hi' })
    + text(210, 170, `${nn(o, 5)} · ${t(o, '2.º espacio', 'space 2')}`, { cls: 'b hi' }));
  b += tap(270, 40, 60, 130, '| E4q |', nn(o, 2), S.note(300, 2, 'n') + text(300, 170, nn(o, 2), { cls: 'b' }));
  return svg(o, { h: 182, alt: ALT.notaLa, body: b, interactive: true });
}

export const ALT = {
  corazonesPulso: { es: 'Cuatro corazones en fila sobre una flecha del tiempo, separados siempre por la misma distancia; debajo de cada uno, «tum». El pulso es un latido regular.', en: 'Four hearts in a row above a time arrow, always the same distance apart, each labelled “tum”. The beat is a steady heartbeat.' },
  negra: { es: 'Una negra grande con sus partes: cabeza rellena y plica. Dura un latido. Debajo, cuatro negras sobre cuatro corazones, cada una con una barra de duración del ancho de un latido y la sílaba «ta».', en: 'A large quarter note with its parts: filled-in head and stem. It lasts one beat. Below, four quarter notes over four hearts, each with a one-beat duration bar and the syllable “ta”.' },
  silencioNegra: { es: 'El silencio de negra, en zigzag como un rayo. Debajo, negra, silencio, negra, silencio sobre cuatro corazones: en los silencios la barra de duración es punteada y no se canta, pero el corazón sigue latiendo.', en: 'The quarter note rest, zigzag like a lightning bolt. Below, quarter note, rest, quarter note, rest over four hearts: under the rests the duration bar is dotted and nothing is sung, but the heart keeps beating.' },
  pentagrama: { es: 'Pentagrama con las 5 líneas numeradas de abajo arriba a la izquierda y los 4 espacios numerados a la derecha. Una nota en la 2.ª línea (la raya la cruza) y otra en el 3.er espacio (entre dos rayas). Una flecha indica que hacia arriba es más agudo.', en: 'A staff with its 5 lines numbered from the bottom up on the left and its 4 spaces numbered on the right. One note on line 2 (the line goes through it) and one in space 3 (between two lines). An arrow shows that higher up means higher pitch.' },
  claveSol: { es: 'Pentagrama con la clave de sol; su espiral se enrosca en la 2.ª línea, resaltada. En esa línea está la nota sol y en la 1.ª línea, la nota mi.', en: 'A staff with the treble clef; its curl wraps around the highlighted second line. The note G (sol) sits on that line and E (mi) on the first line.' },
  andarCorrer: { es: 'Dos filas sobre cuatro latidos. Andar: una huella por latido y una negra («ta»). Correr: dos huellas por latido y dos corcheas unidas por una barra («co-rre»). Los latidos de abajo no cambian.', en: 'Two rows over four beats. Walking: one footprint per beat and a quarter note (“ta”). Running: two footprints per beat and two beamed eighth notes (“co-rre”). The beats below stay the same.' },
  compas24: { es: 'El compás 2/4: el 2 de arriba indica 2 pulsos por compás y el 4 de abajo que cada pulso es una negra. Debajo, pulsos agrupados de dos en dos, uno grande y fuerte («UN») y uno pequeño («dos»), separados por barras.', en: 'The 2/4 time signature: the top 2 means 2 beats per bar and the bottom 4 means each beat is a quarter note. Below, beats grouped in twos, one big and strong (“ONE”) and one small (“two”), separated by bar lines.' },
  barras: { es: 'Pentagrama con dos compases coloreados como dos habitaciones. La barra divisoria los separa y la doble barra final, una fina y otra gruesa, marca el fin.', en: 'A staff with two bars shaded like two rooms. The bar line separates them and the final double bar, one thin and one thick line, marks the end.' },
  notaLa: { es: 'Pentagrama con sol en la 2.ª línea, la en el 2.º espacio (resaltada) y mi en la 1.ª línea. Una flecha corta sube de sol a la: un paso. Una flecha larga baja de la a mi: un salto.', en: 'A staff with G (sol) on line 2, A (la) in space 2 (highlighted) and E (mi) on line 1. A short arrow goes up from G to A: a step. A long arrow goes down from A to E: a leap.' },
};
