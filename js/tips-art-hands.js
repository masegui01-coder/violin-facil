// Manos y dedos para las ilustraciones: dedos con falanges, pliegues y uña (así se ve con qué parte se toca),
// dorso de la mano visto desde arriba y la marca de «aquí toca». Coordenadas de la viñeta (270 × 230).
import { C } from './tips-art-kit.js';

const SKIN = C.skin;
const LINE = C.skinLine;
const NAIL = '#FBEDE2';
const r1 = v => Math.round(v * 10) / 10;
const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };

// Dedo de lado: pts = [base, nudillo, articulación, yema] (4 puntos). nail = lado de la uña: 1 (a la izquierda del
// sentido base→yema) o -1 (a la derecha); 0 sin uña (dedo visto por la yema).
export function finger(pts, { w = 13, nail = 1 } = {}) {
  const d = `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L')}`;
  const body = `<path d="${d}" fill="none" stroke="${LINE}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${SKIN}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // pliegues en las dos articulaciones (en el lado de la palma)
  const creases = [1, 2].map(i => {
    const [ux, uy] = norm(pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]);
    const [nx, ny] = [-uy, ux];
    const side = -(nail || 1);
    const [cx, cy] = [pts[i][0] + nx * side * w * 0.12, pts[i][1] + ny * side * w * 0.12];
    return `<path d="M${r1(cx - nx * w * 0.32)} ${r1(cy - ny * w * 0.32)} L${r1(cx + nx * w * 0.32)} ${r1(cy + ny * w * 0.32)}" stroke="${LINE}" stroke-width="1.3" stroke-linecap="round"/>`;
  }).join('');
  let nailSvg = '';
  if (nail) {
    const [ux, uy] = norm(pts[3][0] - pts[2][0], pts[3][1] - pts[2][1]);
    const [nx, ny] = [-uy * nail, ux * nail];
    const cx = pts[3][0] - ux * w * 0.42 + nx * w * 0.2;
    const cy = pts[3][1] - uy * w * 0.42 + ny * w * 0.2;
    const ang = Math.atan2(uy, ux) * 180 / Math.PI;
    nailSvg = `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(w * 0.36)}" ry="${r1(w * 0.22)}" transform="rotate(${r1(ang)} ${r1(cx)} ${r1(cy)})" fill="${NAIL}" stroke="${LINE}" stroke-width="1.2"/>`;
  }
  return body + creases + nailSvg;
}

// Dedo curvado por ángulos: arranca en (x, y) con dirección a (grados, 0 = derecha, 90 = abajo), cada falange
// gira bend grados más; lens = largos de las 3 falanges
export function curledFinger(x, y, a, bend, lens = [20, 14, 11], opts = {}) {
  const pts = [[x, y]];
  let ang = a;
  lens.forEach(len => {
    const [px, py] = pts[pts.length - 1];
    pts.push([px + Math.cos(ang * Math.PI / 180) * len, py + Math.sin(ang * Math.PI / 180) * len]);
    ang += bend;
  });
  return { svg: finger(pts, opts), tip: pts[3], pts };
}

// Dorso de la mano visto desde arriba, dedos hacia arriba (antes de girar). (x, y) = centro de los nudillos.
// curl 0-1 acorta los dedos (doblados hacia abajo, se ven más cortos); thumb: 'left' | 'right' | null
export function handBack(x, y, { rot = 0, s = 1, curl = 0, thumb = 'left', spread = 0 } = {}) {
  const lens = [42, 48, 45, 36].map(l => l * (1 - curl * 0.55));
  const xs = [-21, -7, 7, 20];
  const fingers = xs.map((fx, i) => {
    const tilt = (i - 1.5) * spread;
    const tx = fx + Math.sin(tilt * Math.PI / 180) * lens[i];
    const ty = -Math.cos(tilt * Math.PI / 180) * lens[i];
    const w = i === 3 ? 11 : 12.5;
    return `<path d="M${fx} 0 L${r1(tx)} ${r1(ty)}" stroke="${LINE}" stroke-width="${w + 3}" stroke-linecap="round"/><path d="M${fx} 0 L${r1(tx)} ${r1(ty)}" stroke="${SKIN}" stroke-width="${w}" stroke-linecap="round"/>
      <ellipse cx="${r1(tx - Math.sin(tilt * Math.PI / 180) * 5)}" cy="${r1(ty + Math.cos(tilt * Math.PI / 180) * 5)}" rx="4" ry="5.5" transform="rotate(${tilt} ${r1(tx)} ${r1(ty)})" fill="${NAIL}" stroke="${LINE}" stroke-width="1"/>
      <path d="M${fx - 4} ${r1(ty * 0.45)} L${fx + 4} ${r1(ty * 0.45)}" stroke="${LINE}" stroke-width="1"/>`;
  }).join('');
  const palm = `<path d="M-30 -4 C-32 18 -28 44 -14 56 L16 56 C28 44 32 18 30 -4 C20 -10 -20 -10 -30 -4 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>`;
  const knuckles = xs.map(fx => `<path d="M${fx - 4} 2 Q${fx} -2 ${fx + 4} 2" fill="none" stroke="${LINE}" stroke-width="1.2"/>`).join('');
  const th = thumb === 'left' ? finger([[-24, 40], [-38, 26], [-46, 12], [-50, 0]], { w: 14, nail: -1 })
    : thumb === 'right' ? finger([[24, 40], [38, 26], [46, 12], [50, 0]], { w: 14, nail: 1 }) : '';
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${th}${palm}${fingers}${knuckles}</g>`;
}

// Antebrazo y muñeca que llegan a la mano (de (x1, y1) a (x2, y2))
export const forearm = (x1, y1, x2, y2, w = 24) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${LINE}" stroke-width="${w + 3}" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${SKIN}" stroke-width="${w}" stroke-linecap="round"/>`;

// Marca de contacto: «aquí toca» (círculo verde) o error (rojo)
export const touch = (x, y, r = 9, color = C.green) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
