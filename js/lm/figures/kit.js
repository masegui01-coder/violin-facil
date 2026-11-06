// Ilustraciones de la teoría de Lenguaje Musical: piezas de dibujo comunes (pentagrama, figuras sin pentagrama,
// silencios, corazones del pulso, teclado, flechas, rótulos). Todo devuelve texto SVG, sin DOM.
// Colores: solo clases lmf-* (ver figures.css), que leen los tokens del tema (currentColor, --staff, --unit, --accent…),
// así cada dibujo vale para claro y oscuro. Pasos diatónicos contados desde do4 = 0 (re4 = 1 … do5 = 7, re5 = 8).

export const W = 360;          // ancho común del lienzo (viewBox): cabe en la tarjeta del móvil sin escalar casi nada
export const BEAT = 0.75;      // segundos por pulso en las animaciones (80 por minuto, el tempo de los ejemplos)
const MAX_MOTION_S = 5;        // ninguna animación dura más (WCAG 2.2.2)
export const FIG_EN = {};      // diccionario es → en de los rótulos (para i18n.js, como TIPS_EN)

const EU = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
const US = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const TREBLE = '\u{1D11E}';

export const r1 = v => Math.round(v * 10) / 10;
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Rótulo bilingüe: registra la traducción y devuelve el idioma pedido (o.lang = 'es' | 'en')
export function t(o, es, en) {
  FIG_EN[es] = en;
  return o?.lang === 'en' ? en : es;
}
// Nombre de nota según la nomenclatura elegida en la app (o.nom = 'eu' do re mi | 'us' C D E)
export const nn = (o, step) => (o?.nom === 'us' ? US : EU)[((step % 7) + 7) % 7];
// Nota en el formato de los ejemplos del curso (C4, A4…) para data-play
export const pitch = step => LETTER[((step % 7) + 7) % 7] + (4 + Math.floor(step / 7));

export function text(x, y, s, { cls = '', anchor = 'middle', size = null } = {}) {
  const st = size ? ` style="font-size:${size}px"` : '';
  return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}" class="lmf-t ${cls}"${st}>${esc(s)}</text>`;
}

// Flecha recta o curva (bend > 0 curva a la derecha del sentido de avance; en pantalla, «hacia abajo» si va a la derecha)
export function arrow(x1, y1, x2, y2, { cls = '', bend = 0, head = 6 } = {}) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 - (dy / len) * bend, cy = (y1 + y2) / 2 + (dx / len) * bend;
  const d = bend ? `M${r1(x1)} ${r1(y1)} Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}` : `M${r1(x1)} ${r1(y1)} L${r1(x2)} ${r1(y2)}`;
  const a = bend ? Math.atan2(y2 - cy, x2 - cx) : Math.atan2(dy, dx);
  const p = s => `${r1(x2 - head * Math.cos(a + s))} ${r1(y2 - head * Math.sin(a + s))}`;
  return `<path d="${d}" class="lmf-arrow ${cls}"/><path d="M${p(-0.5)} L${r1(x2)} ${r1(y2)} L${p(0.5)}" class="lmf-arrow ${cls}"/>`;
}

// Rótulo con línea guía hasta un punto (con un puntito en el extremo señalado)
export function callout(px, py, tx, ty, label, { anchor = 'start', cls = '' } = {}) {
  return `<line x1="${r1(px)}" y1="${r1(py)}" x2="${r1(tx)}" y2="${r1(ty)}" class="lmf-guide"/><circle cx="${r1(px)}" cy="${r1(py)}" r="2.2" class="lmf-guide-dot"/>`
    + text(tx + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0), ty + 4, label, { anchor, cls });
}

// Corazón (pulso), centrado en (cx, cy) y de lado s
export function heart(cx, cy, s, cls = 'lmf-heart', extra = '') {
  const p = (a, b) => `${r1(cx + (a - 0.5) * s)} ${r1(cy + (b - 0.55) * s)}`;
  return `<path d="M${p(0.5, 0.95)} C${p(0.1, 0.65)} ${p(-0.02, 0.4)} ${p(0.16, 0.2)} C${p(0.32, 0.04)} ${p(0.5, 0.14)} ${p(0.5, 0.3)} `
    + `C${p(0.5, 0.14)} ${p(0.68, 0.04)} ${p(0.84, 0.2)} C${p(1.02, 0.4)} ${p(0.9, 0.65)} ${p(0.5, 0.95)}Z" class="${cls}"${extra}/>`;
}

// Animación de «latido» que recorre una fila: el elemento k se ilumina en su pulso (ciclo de n pulsos)
export const beatStyle = (k, n = 4, beat = BEAT) => ` style="--i:${k};--beat:${beat}s;--cyc:${r1(n * beat * 100) / 100}s"`;

// Fila de corazones (uno por pulso) con sus casillas; devuelve el SVG
export function beatRow(x0, cy, n, cw, { size = 20, anim = true, cls = 'lmf-heart' } = {}) {
  let out = '';
  for (let k = 0; k < n; k++) {
    const cx = x0 + cw * (k + 0.5);
    out += heart(cx, cy, size, `${cls}${anim ? ' lmf-beat' : ''}`, anim ? beatStyle(k, n) : '');
  }
  return out;
}

// «Línea de duración»: barra redondeada bajo una figura, tan larga como dura (en casillas de pulso)
export function durBar(x, y, w, cls = '', h = 8) {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${h}" rx="${h / 2}" class="lmf-dur ${cls}"/>`;
}

// ---------- Figuras sueltas (sin pentagrama) ----------
// Cabeza en (x, y); s = medio espacio (tamaño). up: plica arriba. Devuelve { svg, sx, tip }
export function figure(x, y, dur, { s = 6, up = true, cls = '', flag = true } = {}) {
  const hollow = dur === 'h' || dur === 'w';
  const rx = (dur === 'w' ? 1.45 : 1.2) * s, ry = (dur === 'w' ? 0.95 : 0.85) * s;
  const rot = dur === 'w' ? -10 : -20;
  let svg = `<g class="lmf-note ${cls}"><ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" transform="rotate(${rot} ${r1(x)} ${r1(y)})" class="${hollow ? (dur === 'w' ? 'lmf-hollow lmf-whole' : 'lmf-hollow') : 'lmf-fill'}"/>`;
  let sx = x, tip = y;
  if (dur !== 'w' && dur !== 'n') { // 'n': solo la cabeza (dibujos de altura, sin ritmo)
    sx = up ? x + 1.08 * s : x - 1.08 * s;
    tip = up ? y - 7 * s : y + 7 * s;
    svg += `<line x1="${r1(sx)}" x2="${r1(sx)}" y1="${r1(y + (up ? -0.3 : 0.3) * s)}" y2="${r1(tip)}" class="lmf-stem" style="stroke-width:${r1(Math.max(1.4, s * 0.26))}px"/>`;
    if (dur === 'e' && flag) svg += flagPath(sx, tip, s, up);
  }
  return { svg: svg + '</g>', sx, tip };
}
function flagPath(sx, tip, s, up) {
  const k = up ? 1 : -1;
  return `<path d="M${r1(sx)} ${r1(tip)} q${r1(0.3 * s)} ${r1(k * 1.6 * s)} ${r1(1.6 * s)} ${r1(k * 2.6 * s)} q${r1(0.8 * s)} ${r1(k * 1 * s)} ${r1(0.2 * s)} ${r1(k * 2.8 * s)} `
    + `q${r1(0.2 * s)} ${r1(-k * 1.6 * s)} ${r1(-1.8 * s)} ${r1(-k * 2.6 * s)}z" class="lmf-fill"/>`;
}
// Grupo de corcheas unidas por una barra (todas a la misma altura y)
export function beamed(xs, y, { s = 6, cls = '' } = {}) {
  const parts = xs.map(x => figure(x, y, 'q', { s, cls }));
  const x1 = parts[0].sx, x2 = parts[parts.length - 1].sx, tip = parts[0].tip;
  return parts.map(p => p.svg).join('') + `<rect x="${r1(x1 - 0.13 * s)}" y="${r1(tip)}" width="${r1(x2 - x1 + 0.26 * s)}" height="${r1(0.8 * s)}" class="lmf-fill ${cls}"/>`;
}
// Silencios sueltos: tope arriba en y (q: zigzag; h/w: rectángulo)
export function restQ(x, y, s = 6, cls = '') {
  // Silueta rellena (zigzag de trazo grueso y gancho final), en unidades u = s/2: 4.4u de ancho y 12.4u de alto
  const u = s / 2, P = (a, b) => `${r1(x + (a - 2.2) * u)} ${r1(y + b * u)}`;
  return `<path d="M${P(0.7, 0)} L${P(4.1, 4.1)} Q${P(2.3, 5.5)} ${P(2.5, 7.2)} L${P(4.4, 9.9)} Q${P(1.9, 9.1)} ${P(1.8, 10.7)} `
    + `Q${P(1.8, 11.7)} ${P(2.8, 12.4)} Q${P(0, 11.9)} ${P(0.1, 10.2)} Q${P(0.3, 8.5)} ${P(2.7, 8.7)} L${P(0.3, 5.9)} `
    + `Q${P(2.1, 4.5)} ${P(1.9, 2.6)} Z" class="lmf-fill lmf-rest-q ${cls}"/>`;
}

// Silencio de blanca o de redonda sin pentagrama: con su trocito de línea, para que se vea si se sienta o cuelga
export function restBlock(x, y, dur, s = 6, cls = '') {
  const w = 2.8 * s, hh = 0.95 * s;
  return `<line x1="${r1(x - 2.4 * s)}" x2="${r1(x + 2.4 * s)}" y1="${r1(y)}" y2="${r1(y)}" class="lmf-line"/>`
    + `<rect x="${r1(x - w / 2)}" y="${r1(dur === 'w' ? y : y - hh)}" width="${r1(w)}" height="${r1(hh)}" class="lmf-fill ${cls}"/>`;
}

// Tira rítmica sobre una fila de latidos: figura al principio de su duración, «línea de duración» tan larga como dura,
// corazones debajo y sílabas por pulso. items: [{ f: 'q'|'h'|'w'|'e2'|'R'|'Rh'|'Rw', n: pulsos, syl: ['taa','a'], cls, sweep }]
export function rhythmStrip(items, { x0 = 20, cw = 80, y = 160, heart: hs = 20 } = {}) {
  let b = '', pos = 0;
  for (const it of items) {
    const cx = x0 + cw * (pos + 0.5), rest = it.f.startsWith('R');
    if (it.f === 'R') b += restQ(cx, y - 32, 6, it.cls || '');
    else if (it.f === 'Rh' || it.f === 'Rw') b += restBlock(cx, y - 14, it.f === 'Rh' ? 'h' : 'w', 8, it.cls || '');
    else if (it.f === 'e2') b += beamed([cx - 14, cx + 10], y, { s: 6, cls: it.cls || '' });
    else b += figure(cx - 4, y, it.f, { s: 6.5, cls: it.cls || '' }).svg;
    const bar = durBar(x0 + cw * pos + 6, y + 12, cw * it.n - 12, rest ? 'rest' : (it.cls || ''));
    b += it.sweep ? bar.replace('class="lmf-dur', `style="--cyc:${it.sweep}s" class="lmf-sweep lmf-dur`) : bar;
    (it.syl || []).forEach((sy, k) => {
      b += text(x0 + cw * (pos + k + 0.5), y + 60, sy, { cls: rest || k > 0 ? 'm b' : 'b' });
    });
    pos += it.n;
  }
  return b + beatRow(x0, y + 36, pos, cw, { size: hs });
}

// ---------- Pentagrama ----------
// bottom: y de la 1.ª línea; h: medio espacio. y(step): altura de un paso diatónico (do4 = 0, mi4 = 2 en la 1.ª línea)
export function staff(bottom, h = 8) {
  const y = step => bottom - (step - 2) * h;
  const lineY = n => bottom - (n - 1) * 2 * h;          // n = 1…5
  const S = { bottom, h, y, lineY, top: bottom - 8 * h };
  S.lines = (x0, x1, cls = '') => [1, 2, 3, 4, 5].map(n => `<line x1="${r1(x0)}" x2="${r1(x1)}" y1="${r1(lineY(n))}" y2="${r1(lineY(n))}" class="lmf-line ${cls}"/>`).join('');
  S.line = (n, x0, x1, cls = '') => `<line x1="${r1(x0)}" x2="${r1(x1)}" y1="${r1(lineY(n))}" y2="${r1(lineY(n))}" class="lmf-line ${cls}"/>`;
  // Clave de sol (glifo de Noto Music, medido: tinta de 1.72 em; su espiral, a 0.43 em sobre la línea base, cae en la 2.ª línea)
  S.clefSize = 8 * h;
  S.clefCurl = x => ({ x: x + 0.36 * S.clefSize, y: lineY(2), r: 0.24 * S.clefSize });
  S.clef = (x, cls = '') => `<text x="${r1(x)}" y="${r1(bottom + 1.45 * h)}" class="lmf-clef ${cls}" style="font-size:${r1(S.clefSize)}px">${TREBLE}</text>`;
  S.ledgers = (x, step, cls = '') => {
    let out = '';
    for (let s = 0; s >= step; s -= 2) out += `<line x1="${r1(x - 2 * h)}" x2="${r1(x + 2 * h)}" y1="${r1(y(s))}" y2="${r1(y(s))}" class="lmf-line lmf-ledger ${cls}"/>`;
    for (let s = 12; s <= step; s += 2) out += `<line x1="${r1(x - 2 * h)}" x2="${r1(x + 2 * h)}" y1="${r1(y(s))}" y2="${r1(y(s))}" class="lmf-line lmf-ledger ${cls}"/>`;
    return out;
  };
  // Plica arriba por debajo del si (3.ª línea); desde el si, abajo
  S.note = (x, step, dur = 'q', { cls = '', up = null, ledgerCls = '', flag = true } = {}) =>
    S.ledgers(x, step, ledgerCls) + figure(x, y(step), dur, { s: h, up: up ?? step < 6, cls, flag }).svg;
  S.pair = (x1, x2, step, { cls = '' } = {}) => beamed([x1, x2], y(step), { s: h, cls });
  S.rest = (x, dur, cls = '') => {
    if (dur === 'q') return restQ(x, bottom - 6.3 * h, h, cls);
    if (dur === 'w') return `<rect x="${r1(x - 1.4 * h)}" y="${r1(lineY(4))}" width="${r1(2.8 * h)}" height="${r1(0.95 * h)}" class="lmf-fill ${cls}"/>`;
    return `<rect x="${r1(x - 1.4 * h)}" y="${r1(lineY(3) - 0.95 * h)}" width="${r1(2.8 * h)}" height="${r1(0.95 * h)}" class="lmf-fill ${cls}"/>`;
  };
  S.bar = (x, cls = '') => `<line x1="${r1(x)}" x2="${r1(x)}" y1="${r1(S.top)}" y2="${r1(bottom)}" class="lmf-bar ${cls}"/>`;
  S.final = (x, cls = '') => `<line x1="${r1(x - 1.1 * h)}" x2="${r1(x - 1.1 * h)}" y1="${r1(S.top)}" y2="${r1(bottom)}" class="lmf-bar ${cls}"/>`
    + `<rect x="${r1(x - 0.55 * h)}" y="${r1(S.top)}" width="${r1(0.6 * h)}" height="${r1(8 * h)}" class="lmf-fill ${cls}"/>`;
  const dots = (x, cls) => [3, 5].map(k => `<circle cx="${r1(x)}" cy="${r1(bottom - k * h)}" r="${r1(0.42 * h)}" class="lmf-fill ${cls}"/>`).join('');
  S.repStart = (x, cls = '') => `<rect x="${r1(x)}" y="${r1(S.top)}" width="${r1(0.6 * h)}" height="${r1(8 * h)}" class="lmf-fill ${cls}"/>`
    + `<line x1="${r1(x + 1.4 * h)}" x2="${r1(x + 1.4 * h)}" y1="${r1(S.top)}" y2="${r1(bottom)}" class="lmf-bar ${cls}"/>` + dots(x + 2.3 * h, cls);
  S.repEnd = (x, cls = '') => dots(x - 2.4 * h, cls) + S.final(x, cls);
  S.time = (x, num, den, cls = '') => `<text x="${r1(x)}" y="${r1(lineY(3) - 0.1 * h)}" text-anchor="middle" class="lmf-time ${cls}" style="font-size:${r1(5.2 * h)}px">${num}</text>`
    + `<text x="${r1(x)}" y="${r1(bottom - 0.1 * h)}" text-anchor="middle" class="lmf-time ${cls}" style="font-size:${r1(5.2 * h)}px">${den}</text>`;
  return S;
}

// ---------- Teclado ----------
// Teclas blancas de from a to (pasos diatónicos). mark: { paso: 'hi' | 'hi2' | 'off' }. Devuelve { svg, cx(paso), x0, kw }
export function keyboard(x0, y0, kw, kh, from, to, { o = {}, mark = {}, names = true, playable = false } = {}) {
  let white = '', black = '';
  const n = to - from + 1;
  for (let i = 0; i < n; i++) {
    const step = from + i, x = x0 + i * kw, m = mark[step] || '';
    // Una tecla es más estrecha que un dedo: se puede tocar en el dibujo, y su botón de verdad va debajo (chips)
    const play = playable ? ` data-play="| ${pitch(step)}q |"` : '';
    if (playable && m !== 'off') addChip(`| ${pitch(step)}q |`, nn(o, step)); // las tachadas no tienen botón
    white += `<g class="lmf-key ${m}"${play}><rect x="${r1(x)}" y="${r1(y0)}" width="${r1(kw)}" height="${r1(kh)}" rx="3" class="lmf-white"/>`
      + (names ? text(x + kw / 2, y0 + kh - 8, nn(o, step), { cls: 'lmf-keyname' }) : '') + '</g>';
    const letter = ((step % 7) + 7) % 7;
    if (i < n - 1 && [0, 1, 3, 4, 5].includes(letter)) {
      const bw = kw * 0.58;
      black += `<rect x="${r1(x + kw - bw / 2)}" y="${r1(y0)}" width="${r1(bw)}" height="${r1(kh * 0.58)}" rx="2" class="lmf-black"/>`;
    }
  }
  return { svg: white + black, cx: step => x0 + (step - from + 0.5) * kw, x0, kw };
}

// Zona «toca para oír». play en el formato de los ejemplos del curso («| G4q E4q |»); extra: atributos como
// data-dyn="pp" o data-sound="pulso". El botón (role="button") es solo el rectángulo, encima del dibujo: así su
// nombre accesible no choca con los rótulos que tapa. Si la zona es más pequeña que un dedo (MIN_TAP a lo ancho de
// la tarjeta del móvil), en el dibujo solo responde al toque y su botón de verdad va debajo, en la fila de chips.
export const MIN_TAP = 58;
let chips = null;
let buttons = 0;
function addChip(play, label, extra = '') {
  if (chips && !chips.some(c => c.play === play && c.extra === extra)) chips.push({ play, label, extra });
}
// figureHtml abre y cierra la recogida de chips de cada dibujo
export function beginFigure() { chips = []; buttons = 0; }
export function endFigure() { const out = chips || []; chips = null; return out; }

export function tap(x, y, w, h, play, label, inner, extra = '') {
  const rect = cls => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="10" class="${cls}"`;
  if (w < MIN_TAP || h < MIN_TAP) {
    addChip(play, label, extra);
    return `<g class="lmf-tapgrp">${inner}${rect('lmf-tap')} data-play="${esc(play)}"${extra} aria-hidden="true"/></g>`;
  }
  buttons++;
  return `<g class="lmf-tapgrp">${inner}<g role="button" tabindex="0" data-play="${esc(play)}" aria-label="${esc(label)}"${extra}>${rect('lmf-tap')}/></g></g>`;
}

// ---------- Lienzo ----------
// Interactivo: role="group" con zonas role="button" (data-play); si no, role="img". Siempre con <title> y aria-label.
export function svg(o, { h, alt, body, interactive = false, cls = '' }) {
  const label = o?.lang === 'en' ? alt.en : alt.es;
  return `<svg class="lmf-svg ${cls}" viewBox="0 0 ${W} ${h}" role="${interactive && buttons ? 'group' : 'img'}" aria-label="${esc(label)}" focusable="false">`
    + `<title>${esc(label)}</title>${body}</svg>`;
}

// Movimiento por un camino (SMIL). Se omite con o.still (reduce-motion o PDF): queda el camino punteado como versión fija.
export function moveAlong(o, d, dur, { r = 7, cls = 'lmf-ball', begin = '0s', keyTimes = null, keyPoints = null } = {}) {
  if (o?.still) return '';
  const kp = keyTimes ? ` keyTimes="${keyTimes}" keyPoints="${keyPoints}" calcMode="linear"` : '';
  // unos 5 s como mucho (WCAG 2.2.2) y la pelota se queda al final del camino
  const times = Math.max(1, Math.floor(MAX_MOTION_S / dur));
  return `<circle r="${r}" class="${cls}"><animateMotion dur="${dur}s" begin="${begin}" repeatCount="${times}" fill="freeze" path="${d}"${kp}/></circle>`;
}
