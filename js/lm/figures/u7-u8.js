// Nivel 1 · Unidades 7 (La hermana menor) y 8 (Pregunta y respuesta)
import { t, nn, pitch, text, arrow, heart, staff, keyboard, svg, tap, moveAlong, r1 } from './kit.js';
import { house } from './u3-u4.js';
import { stairs } from './u5-u6.js';

const sun = (x, y) => `<circle cx="${x}" cy="${y}" r="8" class="lmf-solid"/>`
  + Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; return `<line x1="${r1(x + 11 * Math.cos(a))}" y1="${r1(y + 11 * Math.sin(a))}" x2="${r1(x + 15 * Math.cos(a))}" y2="${r1(y + 15 * Math.sin(a))}" class="lmf-outline hi"/>`; }).join('');
const moon = (x, y) => `<circle cx="${x}" cy="${y}" r="11" class="lmf-solid two"/><circle cx="${x + 6}" cy="${y - 4}" r="9.5" class="lmf-cut"/>`;

// U7 · «Dos hermanas»: las mismas teclas blancas; do mayor vive en do (sol) y la menor en la (luna)
export function hermanas(o = {}) {
  const kb = keyboard(42, 128, 36, 84, 0, 7, { o, mark: { 0: 'hi', 5: 'hi2', 7: 'hi' } });
  let b = kb.svg + text(180, 18, t(o, 'Las mismas notas: solo teclas blancas, sin ♯ ni ♭', 'Same notes: white keys only, no ♯ or ♭'), { cls: 's b' });
  const sis = [
    [kb.cx(0), sun, 'hi', t(o, 'Do mayor', 'C major'), t(o, 'luminosa', 'bright'), '| C4q E4q G4q C5q |'],
    [kb.cx(5), moon, 'two', t(o, 'La menor', 'A minor'), t(o, 'misteriosa', 'mysterious'), '| A4q C5q E4q A4q |'],
  ];
  sis.forEach(([x, icon, cls, name, mood, play]) => {
    const g = icon(x, 66) + house(x, 122, 1.1, `lmf-soft${cls === 'two' ? ' two' : ''}`) + text(x + 22, 74, name, { anchor: 'start', cls: `b ${cls}` }) + text(x + 22, 90, mood, { anchor: 'start', cls: 's m' });
    b += tap(x - 24, 30, 120, 96, play, `${name}: ${mood}`, g);
  });
  b += `<path d="M${kb.cx(7)} 218 Q${(kb.cx(7) + kb.cx(5)) / 2} 246 ${kb.cx(5) + 6} 220" class="lmf-arrow two"/>` + arrow(kb.cx(5) + 14, 226, kb.cx(5) + 5, 219, { cls: 'two', head: 6 });
  b += text(kb.cx(6), 260, t(o, 'do → si → la: 3 notas más abajo', 'C → B → A: 3 notes down'), { cls: 's b two' });
  return svg(o, { h: 268, alt: ALT.hermanas, body: b, interactive: true });
}

// Escalera con nombres y medio tono marcado (½) donde toca
function scaleStairs(o, x0, base, from, semis, label, cls) {
  const st = stairs(x0, base, 36, semis.map(s => s * 7), { first: 17, hiRise: i => semis[i - 1] === 1 });
  let b = st.svg + text(x0, base - 108, label, { anchor: 'start', cls: `b ${cls}` });
  st.xs.forEach((x, i) => {
    b += text(x, st.tops[i] - 6, nn(o, from + i), { cls: 's b' }) + text(x, base - 4, i + 1, { cls: 's m' });
    if (i && semis[i - 1] === 1) b += text(x - 18, st.tops[i] - 6, '½', { cls: 'b hi' });
  });
  return b;
}

// U7 · «La escala de la menor»: dos escaleras con las mismas notas; los peldaños cortos caen en otro sitio
export function escalaLaMenor(o = {}) {
  const major = scaleStairs(o, 30, 124, 0, [2, 2, 1, 2, 2, 2, 1], t(o, 'Do mayor: ½ entre 3-4 y 7-8', 'C major: ½ at 3-4 and 7-8'), 'hi');
  const minor = scaleStairs(o, 30, 258, 5, [2, 1, 2, 2, 1, 2, 2], t(o, 'La menor: ½ entre 2-3 y 5-6', 'A minor: ½ at 2-3 and 5-6'), 'two');
  const body = tap(20, 10, 320, 124, '| C4q D4q E4q F4q G4q A4q B4q C5q |', t(o, 'Escuchar do mayor', 'Listen to C major'), major)
    + tap(20, 144, 320, 124, '| A4q B4q C5q D5q E5q F5q G5q A5q |', t(o, 'Escuchar la menor', 'Listen to A minor'), minor);
  return svg(o, { h: 270, alt: ALT.escalaLaMenor, body, interactive: true });
}

// Centros de las teclas por semitonos (blancas y negras) entre dos pasos diatónicos
function chromaticXs(kb, from, to) {
  const xs = [];
  for (let s = from; s <= to; s++) {
    xs.push(kb.cx(s));
    const letter = ((s % 7) + 7) % 7;
    if (s < to && [0, 1, 3, 4, 5].includes(letter)) xs.push(kb.cx(s) + kb.kw / 2);
  }
  return xs;
}

// U7 · «Mayor o menor: escucha la 3.ª»: do-mi = 4 medios pasos (abierta); la-do = 3 (cerrada)
export function tercerasModo(o = {}) {
  const part = (x0, from, cls, name, info, mood, play) => {
    const kb = keyboard(x0, 70, 40, 84, from, from + 2, { o, mark: { [from]: cls, [from + 2]: cls } });
    const xs = chromaticXs(kb, from, from + 2);
    let g = kb.svg;
    xs.slice(1).forEach((x, i) => {
      g += `<path d="M${r1(xs[i])} 62 Q${r1((xs[i] + x) / 2)} 40 ${r1(x)} 62" class="lmf-outline ${cls === 'hi' ? 'hi' : 'two'}"/>` + text((xs[i] + x) / 2, 38, i + 1, { cls: `s b ${cls === 'hi' ? 'hi' : 'two'}` });
    });
    g += text(x0 + 60, 20, name, { cls: `b ${cls === 'hi' ? 'hi' : 'two'}` });
    g += text(x0 + 60, 176, info, { cls: 's b' }) + text(x0 + 60, 196, mood, { cls: `b ${cls === 'hi' ? 'hi' : 'two'}` });
    return tap(x0 - 6, 4, 132, 200, play, `${name}: ${info}`, g);
  };
  let b = part(30, 0, 'hi', `${nn(o, 0)} – ${nn(o, 2)}`, t(o, '4 medios pasos (2 tonos)', '4 half steps (2 tones)'), t(o, 'MAYOR: abierta', 'MAJOR: open'), '| C4q E4q C4h+E4h |');
  b += part(210, 5, 'hi2', `${nn(o, 5)} – ${nn(o, 7)}`, t(o, '3 medios pasos (tono y ½)', '3 half steps (1½ tones)'), t(o, 'menor: cerrada', 'minor: closed'), '| A4q C5q A4h+C5h |');
  b += text(180, 222, t(o, 'La 3.ª nota desde la tónica decide el modo', 'The 3rd note from the tonic decides the mode'), { cls: 's m' });
  return svg(o, { h: 230, alt: ALT.tercerasModo, body: b, interactive: true });
}

// Marca de respiración (coma) y soplo
const breath = (x, y, i) => `<text x="${x}" y="${y}" class="lmf-t hi" style="font-size:34px;font-weight:800">’</text>`
  + `<g class="lmf-fade" style="--i:${i}">${[0, 7, 14].map(d => `<path d="M${x + 12} ${y - 22 + d} q8 -4 16 0" class="lmf-outline m"/>`).join('')}</g>`;

// U7 · «Frases y respiración»: dos frases de cuatro compases, como dos partes de una oración, con su coma
export function comaRespiracion(o = {}) {
  let b = '';
  [[16, t(o, 'Había una vez un gato', 'Once upon a time a cat'), 0], [190, t(o, 'que cantaba al despertar', 'sang as soon as it woke'), 1]].forEach(([x0, phrase, i]) => {
    b += text(x0 + 74, 26, phrase + (i ? '.' : ','), { cls: 's b' });
    for (let k = 0; k < 4; k++) b += `<rect x="${x0 + k * 37}" y="118" width="35" height="30" rx="5" class="lmf-soft${i ? ' two' : ''}"/>` + text(x0 + k * 37 + 17.5, 138, i * 4 + k + 1, { cls: 's b' });
    b += `<path d="M${x0 + 6} 110 Q${x0 + 72} 64 ${x0 + 134} 110" class="lmf-outline ${i ? 'two' : 'hi'}" style="stroke-width:2.6"/>`;
    b += text(x0 + 74, 72, t(o, `frase ${i + 1}`, `phrase ${i + 1}`), { cls: `b ${i ? 'two' : 'hi'}` });
    b += breath(x0 + 144, 112, i) + text(x0 + 74, 170, t(o, '4 compases', '4 bars'), { cls: 's m' });
  });
  b += text(180, 194, t(o, '’ = respira aquí, como la coma de un cuento', '’ = breathe here, like a comma in a story'), { cls: 's b hi' });
  return svg(o, { h: 202, alt: ALT.comaRespiracion, body: b });
}

// ---------- Unidad 8 ----------
// U8 · «Empezar antes de empezar»: una nota antes de la barra coge impulso y salta al tiempo fuerte
export function anacrusa(o = {}) {
  const S = staff(122, 8);
  let b = `<rect x="91" y="${S.top - 8}" width="36" height="${8 * S.h + 16}" rx="6" class="lmf-zone"/><rect x="91" y="${S.top - 8}" width="36" height="${8 * S.h + 16}" rx="6" class="lmf-box hi dash"/>`;
  b += S.lines(12, 346) + S.clef(14) + S.time(74, 4, 4) + S.note(108, 4, 'q', { cls: 'hi' }) + S.bar(136);
  [[164, 7], [200, 6], [236, 5], [272, 4]].forEach(([x, st]) => { b += S.note(x, st); });
  b += S.bar(300) + [316, 324, 332].map(x => `<circle cx="${x}" cy="${S.bottom - 3 * S.h}" r="2" class="lmf-fill"/>`).join(''); // «sigue…»
  const jump = `M114 ${S.top - 14} Q140 ${S.top - 50} 164 ${S.y(7) - 14}`;
  b += `<path d="${jump}" class="lmf-arrow hi"/>` + arrow(160, S.y(7) - 22, 164, S.y(7) - 14, { cls: 'hi', head: 6 });
  b += moveAlong(o, jump, 1.5, { r: 6 });
  const beats = [[108, '(4)'], [164, '1'], [200, '2'], [236, '3'], [272, '4']];
  b += beats.map(([x, n], i) => text(x + (i === 1 || i === 2 ? 8 : 0), S.bottom + 34, n, { cls: i === 1 ? 'b l hi' : i ? 'm b' : 'hi b' })).join('');
  b += [[108, '¿Te'], [172, 'VIE-'], [208, 'nes…']].map(([x, s], i) => text(x, S.bottom + 54, s, { cls: i === 1 ? 'b' : 's' })).join('');
  b += text(108, S.bottom + 76, t(o, 'anacrusa', 'pick-up'), { cls: 'b hi' }) + text(218, S.bottom + 76, t(o, '1.er tiempo fuerte', 'first strong beat'), { cls: 'b' });
  return svg(o, { h: 206, alt: ALT.anacrusa, body: tap(84, 10, 220, 192, '| G4q | C5q B4q A4q G4q | A4h G4q |', t(o, 'Escuchar el ejemplo', 'Listen to the example'), b), interactive: true });
}

// Pieza de compás: casillas con corazones (n pulsos)
const piece = (x, y, n, cls, cw = 44) => `<rect x="${x}" y="${y}" width="${n * cw}" height="40" rx="8" class="lmf-soft${cls ? ' ' + cls : ''}"/>`
  + Array.from({ length: n }, (_, k) => heart(x + cw * (k + 0.5), y + 21, 18, cls === 'two' ? 'lmf-solid two' : 'lmf-heart')).join('')
  + Array.from({ length: n - 1 }, (_, k) => `<line x1="${x + cw * (k + 1)}" x2="${x + cw * (k + 1)}" y1="${y + 6}" y2="${y + 34}" class="lmf-guide"/>`).join('');

// U8 · «El último compás paga la deuda»: la anacrusa (1) y el último compás (3) encajan en un compás entero (4)
export function anacrusaFinal(o = {}) {
  let b = text(40, 24, t(o, 'al empezar', 'at the start'), { cls: 's m' }) + text(282, 24, t(o, 'al terminar', 'at the end'), { cls: 's m' });
  b += piece(18, 34, 1, '') + text(162, 60, '· · ·', { cls: 'l m' }) + piece(216, 34, 3, 'two');
  b += text(40, 92, t(o, 'anacrusa: 1', 'pick-up: 1'), { cls: 's b hi' }) + text(282, 92, t(o, 'último compás: 3', 'last bar: 3'), { cls: 's b two' });
  b += arrow(282, 100, 200, 124, { cls: 'two', bend: 8 }) + arrow(40, 100, 236, 124, { cls: 'hi', bend: -20 });
  b += `<g class="lmf-slide-r">${piece(92, 132, 3, 'two')}</g><g class="lmf-slide-l">${piece(224, 132, 1, '')}</g>`;
  b += `<path d="M92 182 v8 H268 v-8" class="lmf-outline m"/>`;
  b += text(180, 208, t(o, '3 + 1 = 4: ¡un compás completo!', '3 + 1 = 4: one whole bar!'), { cls: 'b' }) + text(290, 158, '✓', { anchor: 'start', cls: 'l ok' });
  return svg(o, { h: 216, alt: ALT.anacrusaFinal, body: b });
}

// Bocadillo de diálogo con el contorno de la melodía (puntos por altura) y su final
function bubble(o, x, y, w, notes, end, tail, cls, title) {
  const h = 114, x0 = x + 30, dx = (w - 90) / (notes.length - 1);
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" class="lmf-soft${cls === 'two' ? ' two' : ''}"/>`;
  g += `<path d="M${tail[0]} ${y + h - 1} l${tail[1]} 18 l${tail[2]} -18" class="lmf-soft${cls === 'two' ? ' two' : ''}"/>`;
  g += text(x + 14, y + 22, title, { anchor: 'start', cls: `b ${cls}` });
  const pts = notes.map((s, i) => [x0 + i * dx, y + 82 - s * 8]);
  g += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" class="lmf-outline m"/>`;
  pts.forEach(([px, py], i) => { const last = i === pts.length - 1; g += `<circle cx="${r1(px)}" cy="${r1(py)}" r="${last ? 7 : 5}" class="${last ? `lmf-solid${cls === 'two' ? ' two' : ''}` : 'lmf-solid ink'}"/>` + text(px, py + (last ? 26 : 18), nn(o, notes[i]), { cls: 's m' }); });
  const [lx, ly] = pts[pts.length - 1];
  g += end(lx, ly);
  return g;
}

// U8 · «Preguntar y responder»: la pregunta termina en el aire (re, «?»); la respuesta, en casa (do, «.»)
export function preguntaRespuesta(o = {}) {
  const q = bubble(o, 8, 8, 250, [2, 3, 4, 5, 1], (x, y) => `<circle cx="${x}" cy="${y}" r="11" class="lmf-outline hi" style="stroke-dasharray:3 3"/>` + text(x + 30, y + 10, '?', { cls: 'xl hi' }),
    [60, 6, 16], 'hi', t(o, 'Pregunta: termina en el aire', 'Question: ends up in the air'));
  const a = bubble(o, 102, 154, 250, [2, 3, 4, 1, 0], (x, y) => house(x + 30, y + 10, 0.8, 'lmf-soft two') + text(x + 28, y - 18, '.', { cls: 'xl two' }),
    [300, 16, 6], 'two', t(o, 'Respuesta: termina en casa', 'Answer: ends at home'));
  const body = tap(4, 4, 258, 138, '| E4q F4q G4q A4q | D4h Rh |', t(o, 'Escuchar la pregunta', 'Listen to the question'), q)
    + tap(98, 150, 258, 138, '| E4q F4q G4q D4q | C4h Rh |', t(o, 'Escuchar la respuesta', 'Listen to the answer'), a);
  return svg(o, { h: 292, alt: ALT.preguntaRespuesta, body, interactive: true });
}

// U8 · «Formas: AB y ABA»: dos bloques distintos (AB) y el bocadillo (pan A, relleno B, pan A)
export function bocadilloAba(o = {}) {
  const blockA = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="34" rx="8" class="lmf-solid"/>` + text(x + w / 2, y + 23, 'A', { cls: 'l on' });
  const blockB = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="34" rx="8" class="lmf-solid two"/>` + text(x + w / 2, y + 23, 'B', { cls: 'l on' });
  let b = text(80, 22, 'AB', { cls: 'xl' }) + blockA(20, 60, 56) + blockB(84, 60, 56);
  b += text(80, 120, t(o, 'dos partes', 'two different'), { cls: 's b' }) + text(80, 136, t(o, 'distintas', 'parts'), { cls: 's b' });
  b += text(262, 22, 'ABA', { cls: 'xl' });
  b += `<path d="M190 66 Q190 38 262 38 Q334 38 334 66 Z" class="lmf-solid"/>` + text(262, 60, t(o, 'A · pan', 'A · bread'), { cls: 'b on' });
  b += `<path d="M186 72 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 v26 q-12 8 -24 0 t-24 0 t-24 0 t-24 0 t-24 0 t-24 0 Z" class="lmf-solid two"/>` + text(262, 90, t(o, 'B · relleno', 'B · filling'), { cls: 'b on' });
  b += `<rect x="190" y="106" width="144" height="26" rx="10" class="lmf-solid"/>` + text(262, 124, t(o, 'A · pan', 'A · bread'), { cls: 'b on' });
  b += text(262, 154, t(o, 'la A vuelve al final', 'A comes back at the end'), { cls: 's b' });
  b += `<line x1="160" x2="160" y1="16" y2="210" class="lmf-guide"/>`;
  b += blockA(176, 170, 54) + blockB(234, 170, 54) + blockA(292, 170, 54);
  b += text(180, 226, t(o, 'en el tiempo: A → B → A', 'over time: A → B → A'), { cls: 's m' });
  return svg(o, { h: 234, alt: ALT.bocadilloAba, body: b });
}

export const ALT = {
  hermanas: { es: 'Un teclado de do a do solo con teclas blancas. Sobre do, una casita con un sol: do mayor, luminosa. Sobre la, una casita con una luna: la menor, misteriosa. Una flecha baja de do a la: tres notas más abajo (do, si, la).', en: 'A keyboard from C to C using only white keys. Above C, a little house with a sun: C major, bright. Above A, a little house with a moon: A minor, mysterious. An arrow goes down from C to A: three notes lower (C, B, A).' },
  escalaLaMenor: { es: 'Dos escaleras de ocho peldaños. Do mayor tiene los peldaños cortos (½) entre el 3.º y 4.º y entre el 7.º y 8.º. La menor, con las mismas notas, los tiene entre el 2.º y 3.º y entre el 5.º y 6.º.', en: 'Two eight-step staircases. C major has its short steps (½) between steps 3-4 and 7-8. A minor, with the same notes, has them between steps 2-3 and 5-6.' },
  tercerasModo: { es: 'Dos trozos de teclado. De do a mi hay cuatro saltitos de medio tono: tercera mayor, suena abierta. De la a do hay tres: tercera menor, suena cerrada. La tercera nota desde la tónica decide si el modo es mayor o menor.', en: 'Two pieces of keyboard. From C to E there are four half-step hops: a major third, sounds open. From A to C there are three: a minor third, sounds closed. The third note above the tonic decides whether the mode is major or minor.' },
  comaRespiracion: { es: 'Dos frases de cuatro compases cada una, como dos partes de una oración: «Había una vez un gato, que cantaba al despertar». Un arco cubre cada frase y al final de cada una hay una coma de respiración con un soplo de aire.', en: 'Two phrases of four bars each, like two parts of a sentence: “Once upon a time a cat, sang as soon as it woke”. An arc covers each phrase and at the end of each there is a breath mark with a puff of air.' },
  anacrusa: { es: 'Pentagrama en 4/4. Antes de la primera barra hay una sola nota, resaltada en una zona punteada: la anacrusa (cuenta 4). Una flecha salta por encima de la barra hasta el primer tiempo fuerte (1). Debajo, la letra: «¿Te | VIE-nes…».', en: 'A staff in 4/4. Before the first bar line there is a single highlighted note in a dotted zone: the pick-up (counted 4). An arrow jumps over the bar line to the first strong beat (1). Below, the words: “¿Te | VIE-nes…”.' },
  anacrusaFinal: { es: 'Arriba, la anacrusa del principio (una casilla de un pulso) y el último compás (tres casillas). Abajo, las dos piezas encajan como un puzle: 3 + 1 = 4, un compás completo.', en: 'Top: the pick-up at the start (one one-beat box) and the last bar (three boxes). Bottom: the two pieces fit together like a puzzle: 3 + 1 = 4, one whole bar.' },
  preguntaRespuesta: { es: 'Dos bocadillos de diálogo con el dibujo de la melodía. La pregunta sube mi, fa, sol, la y acaba en re, en el aire, con un signo de interrogación. La respuesta hace mi, fa, sol, re y acaba en do, junto a una casita y un punto final.', en: 'Two speech bubbles with the shape of the melody. The question goes up E, F, G, A and ends on D, up in the air, with a question mark. The answer goes E, F, G, D and ends on C, next to a little house and a full stop.' },
  bocadilloAba: { es: 'A la izquierda, forma AB: un bloque A y un bloque B distintos. A la derecha, forma ABA como un bocadillo: pan A arriba, relleno B en medio y pan A abajo. Debajo, la línea del tiempo A, B, A.', en: 'Left: AB form, two different blocks A and B. Right: ABA form like a sandwich: bread A on top, filling B in the middle and bread A at the bottom. Below, the timeline A, B, A.' },
};
