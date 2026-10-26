// Personas y manos para las ilustraciones de los consejos: de frente, de perfil (de pie y sentada), cabeza de perfil,
// brazos y dedos con contorno. Todo en coordenadas de la viñeta (270 × 230).
import { C } from './tips-art-kit.js';

export const SKIN = C.skin;
export const SKIN_LINE = C.skinLine;
export const HAIR = '#6B4A2E';
export const SHIRT = C.shirt;
export const PANTS = C.pants;
export const SHOE = '#2B2B2B';
export const SHIRT_LINE = '#8A3416';
export const SHIRT_FAR = '#962F12'; // el brazo de detrás, un poco más oscuro

// Dónde está el hombro (el de delante) de cada figura, para que los brazos salgan de ahí
export const shoulderStanding = x => [x + 2, 80];
export const shoulderSitting = (x, seatY = 150) => [x + 26, seatY - 74];
export const shouldersFront = (cx, cy) => [[cx - 60, cy + 62], [cx + 60, cy + 62]];

// Brazo completo: manga desde el hombro hasta el codo, antebrazo y mano; el hombro se marca con su redondeo.
// far = el brazo de detrás (más oscuro, sin hombro marcado)
export function arm([sx, sy], [ex, ey], [hx, hy], { far = false, hand = true } = {}) {
  const sleeve = far ? SHIRT_FAR : SHIRT;
  return `<path d="M${sx} ${sy} L${ex} ${ey}" stroke="${SHIRT_LINE}" stroke-width="20" stroke-linecap="round"/>
    <path d="M${sx} ${sy} L${ex} ${ey}" stroke="${sleeve}" stroke-width="16" stroke-linecap="round"/>
    ${limb(`M${ex} ${ey} L${hx} ${hy}`, 11)}
    ${hand ? `<ellipse cx="${hx}" cy="${hy}" rx="8" ry="7" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>` : ''}
    ${far ? '' : `<circle cx="${sx}" cy="${sy}" r="11" fill="${SHIRT}" stroke="${SHIRT_LINE}" stroke-width="2"/>`}`;
}

// Trazo de carne con contorno: brazos, dedos, piernas (d = recorrido, w = grosor)
export const limb = (d, w, color = SKIN, line = SKIN_LINE) =>
  `<path d="${d}" fill="none" stroke="${line}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
  + (color === SKIN ? `<path d="${d}" fill="none" stroke="#FFF4EA" stroke-width="${Math.max(2, w * 0.28)}" stroke-linecap="round" stroke-linejoin="round" opacity=".55" transform="translate(-${(w * 0.18).toFixed(1)} -${(w * 0.18).toFixed(1)})"/>` : '');
// Manga o pantalón (sin contorno de piel)
export const cloth = (d, w, color = SHIRT) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Cabeza de perfil mirando a la derecha. Ocupa x 58-158, y 18-112 a escala 1; (dx, dy) desplaza y s escala.
export function profileHead(dx = 0, dy = 0, s = 1, { mouth = true } = {}) {
  return `<g transform="translate(${dx} ${dy}) scale(${s})">
    <path d="M70 34 C100 18 136 26 146 52 L154 70 L146 74 C149 84 146 90 140 92 C140 100 134 106 124 108 C112 112 96 112 84 104 C66 94 58 76 58 60 C58 48 62 40 70 34 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="${2.5 / s}"/>
    <path d="M60 46 C66 28 98 18 126 26 C108 26 90 34 80 50 Z" fill="${HAIR}"/>
    <ellipse cx="86" cy="66" rx="7" ry="10" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="${2 / s}"/>
    <circle cx="132" cy="54" r="2.8" fill="${C.ink}"/>
    ${mouth ? `<path d="M136 86 L144 86" stroke="${C.lip}" stroke-width="${2.4 / s}" stroke-linecap="round"/>` : ''}</g>`;
}

// Persona de frente hasta el pecho (cabeza en cx, cy)
export function frontPerson(cx, cy, { shirt = SHIRT, mouth = 'smile' } = {}) {
  const lips = mouth === 'smile' ? `<path d="M${cx - 7} ${cy + 19} Q${cx} ${cy + 23} ${cx + 7} ${cy + 19}" fill="none" stroke="${C.lip}" stroke-width="2.4" stroke-linecap="round"/>`
    : mouth === 'round' ? `<ellipse cx="${cx}" cy="${cy + 19}" rx="4" ry="3.5" fill="${C.lip}"/>` : '';
  return `<path d="M${cx - 92} 232 C${cx - 92} ${cy + 70} ${cx - 70} ${cy + 52} ${cx - 30} ${cy + 46} L${cx + 30} ${cy + 46} C${cx + 70} ${cy + 52} ${cx + 92} ${cy + 70} ${cx + 92} 232 Z" fill="${shirt}" stroke="${SHIRT_LINE}" stroke-width="2"/>
    <path d="M${cx - 30} ${cy + 46} L${cx} ${cy + 76} L${cx + 30} ${cy + 46} Z" fill="${SKIN}"/>
    <rect x="${cx - 11}" y="${cy + 22}" width="22" height="30" fill="${SKIN}"/>
    <path d="M${cx - 6} ${cy + 52} C${cx - 18} ${cy + 50} ${cx - 34} ${cy + 52} ${cx - 44} ${cy + 56}" fill="none" stroke="${SKIN_LINE}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M${cx + 6} ${cy + 52} C${cx + 18} ${cy + 50} ${cx + 34} ${cy + 52} ${cx + 44} ${cy + 56}" fill="none" stroke="${SKIN_LINE}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="${cx}" cy="${cy}" rx="27" ry="31" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.5"/>
    <path d="M${cx - 26} ${cy - 8} C${cx - 26} ${cy - 34} ${cx + 26} ${cy - 34} ${cx + 26} ${cy - 8} C${cx + 18} ${cy - 22} ${cx - 18} ${cy - 22} ${cx - 26} ${cy - 8} Z" fill="${HAIR}"/>
    <circle cx="${cx - 10}" cy="${cy - 2}" r="2.6" fill="${C.ink}"/><circle cx="${cx + 10}" cy="${cy - 2}" r="2.6" fill="${C.ink}"/>
    <path d="M${cx} ${cy + 1} L${cx - 3} ${cy + 12} L${cx + 3} ${cy + 12}" fill="none" stroke="${SKIN_LINE}" stroke-width="2"/>${lips}`;
}

// Persona de pie de perfil mirando a la derecha, sin brazos (se dibujan aparte con limb/cloth).
// x = eje del cuerpo; la cabeza queda hacia y 18-66 y los pies en y 214. tilt baja la cabeza (grados).
export function standingSide(x, { tilt = 0, feetApart = true } = {}) {
  return `${cloth(`M${x - 4} 140 L${x - 10} 210`, 18, PANTS)}${cloth(`M${x + 6} 140 L${x + 14} 210`, 18, PANTS)}
    <path d="M${x - 16} 212 L${x + 4} 212" stroke="${SHOE}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${x + 6} 212 L${x + 30} 212" stroke="${SHOE}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${x - 20} 72 C${x - 22} 100 ${x - 18} 130 ${x - 14} 146 L${x + 18} 146 C${x + 22} 120 ${x + 22} 92 ${x + 16} 72 C${x + 6} 64 ${x - 10} 64 ${x - 20} 72 Z" fill="${SHIRT}" stroke="${SHIRT_LINE}" stroke-width="2"/>
    <rect x="${x - 6}" y="56" width="14" height="16" fill="${SKIN}"/>
    <g transform="rotate(${tilt} ${x} 60)">${profileHead(x - 58, 8, 0.5)}</g>`;
}

// Persona sentada de perfil mirando a la derecha en una silla (x = respaldo). leanForward inclina el tronco.
export function sittingSide(x, { chair = true, seatY = 150, lean = 0 } = {}) {
  const hip = x + 24;
  const chairSvg = chair ? `<path d="M${x - 4} ${seatY + 6} L${x + 60} ${seatY + 6} M${x} ${seatY + 6} L${x} 214 M${x + 56} ${seatY + 6} L${x + 56} 214 M${x - 4} ${seatY + 6} L${x - 8} ${seatY - 70}" stroke="${C.muted}" stroke-width="6" stroke-linecap="round" fill="none"/>` : '';
  return `${chairSvg}
    ${cloth(`M${hip} ${seatY - 4} L${hip + 52} ${seatY - 4} L${hip + 54} 210`, 18, PANTS)}
    <path d="M${hip + 46} 212 L${hip + 72} 212" stroke="${SHOE}" stroke-width="8" stroke-linecap="round"/>
    <g transform="rotate(${lean} ${hip} ${seatY})">
      <path d="M${hip - 18} ${seatY - 82} C${hip - 20} ${seatY - 56} ${hip - 18} ${seatY - 20} ${hip - 14} ${seatY} L${hip + 18} ${seatY} C${hip + 22} ${seatY - 30} ${hip + 22} ${seatY - 62} ${hip + 16} ${seatY - 82} C${hip + 6} ${seatY - 90} ${hip - 8} ${seatY - 90} ${hip - 18} ${seatY - 82} Z" fill="${SHIRT}" stroke="${SHIRT_LINE}" stroke-width="2"/>
      <rect x="${hip - 6}" y="${seatY - 98}" width="14" height="16" fill="${SKIN}"/>
      ${profileHead(hip - 58, seatY - 152, 0.5)}
    </g>`;
}

// Dedo visto de lado: de la base (x1, y1) a la yema (x2, y2), curvado hacia c
export const finger = (x1, y1, cx, cy, x2, y2, w = 12) => limb(`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`, w);
