// Ilustraciones de los metales (trompeta, fliscorno, trompa, trombón, bombardino y tuba): labios y buzz, dónde va la
// boquilla, la postura, la mano en la campana de la trompa y las posiciones de la vara.
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad, dashed } from './tips-art-kit.js';
import { SKIN, SKIN_LINE, limb, cloth, arm, shoulderSitting, profileHead, sittingSide } from './tips-art-people.js';

const M = { brass: '#D7A63A', dark: '#9A7020', light: '#F0CF7A', silver: '#C9D0DA', silverDark: '#8A93A3', inside: '#7A5A1A' };

// Boquilla de metal de lado: el borde (copa) en (x, y), hacia la derecha
const mouthpiece = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M0 -14 C10 -14 14 -8 18 -4 L60 -3 L60 3 L18 4 C14 8 10 14 0 14 Z" fill="${M.silver}" stroke="${M.silverDark}" stroke-width="1.5"/></g>`;
// Trompeta de lado: boquilla en (x, y), campana a la derecha
function trumpet(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${mouthpiece(0, 0, 0.5)}
    <path d="M28 0 L120 0 C150 0 160 -4 176 -12 L204 -26 L204 26 L176 12 C160 4 150 2 130 2" fill="none" stroke="${M.dark}" stroke-width="2"/>
    <path d="M28 0 L130 0" stroke="${M.brass}" stroke-width="6" stroke-linecap="round"/>
    <path d="M130 -1 C150 -1 162 -6 178 -13 L204 -26 L204 26 L178 13 C162 6 150 3 130 3 Z" fill="${M.brass}" stroke="${M.dark}" stroke-width="1.5"/>
    <ellipse cx="204" cy="0" rx="5" ry="26" fill="${M.inside}"/>
    <path d="M40 22 C30 22 30 0 40 0 M40 22 L120 22" fill="none" stroke="${M.brass}" stroke-width="6" stroke-linecap="round"/>
    ${[66, 82, 98].map(vx => `<rect x="${vx - 5}" y="-8" width="10" height="38" rx="2" fill="${M.brass}" stroke="${M.dark}" stroke-width="1.2"/><rect x="${vx - 3}" y="-16" width="6" height="8" fill="${M.silver}"/><ellipse cx="${vx}" cy="-17" rx="5" ry="2.5" fill="${M.light}" stroke="${M.dark}"/>`).join('')}</g>`;
}
// Tuba (o bombardino) en vertical: campana arriba, boquilla a la izquierda
function tuba(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-28 -60 L28 -60 L22 -20 L22 60 C22 84 -22 84 -22 60 L-22 -20 Z" fill="${M.brass}" stroke="${M.dark}" stroke-width="2"/>
    <ellipse cx="0" cy="-60" rx="30" ry="7" fill="${M.inside}" stroke="${M.dark}" stroke-width="2"/>
    ${[-6, 4, 14].map(vy => `<rect x="-38" y="${vy}" width="18" height="8" rx="2" fill="${M.silver}" stroke="${M.silverDark}"/>`).join('')}
    <path d="M-22 30 C-50 30 -60 10 -60 -10" fill="none" stroke="${M.brass}" stroke-width="6" stroke-linecap="round"/>${mouthpiece(-60, -18, 0.35)}</g>`;
}
// Labios de frente: cerrados (m), con las comisuras firmes
const lips = (cx, cy, w = 70) => `<path d="M${cx - w / 2} ${cy} C${cx - w / 4} ${cy - 12} ${cx + w / 4} ${cy - 12} ${cx + w / 2} ${cy} C${cx + w / 4} ${cy - 2} ${cx - w / 4} ${cy - 2} ${cx - w / 2} ${cy} Z" fill="${C.lip}"/>
  <path d="M${cx - w / 2} ${cy} C${cx - w / 4} ${cy + 14} ${cx + w / 4} ${cy + 14} ${cx + w / 2} ${cy} C${cx + w / 4} ${cy + 2} ${cx - w / 4} ${cy + 2} ${cx - w / 2} ${cy} Z" fill="#CF7068"/>`;
// Parte baja de la cara de frente (nariz, labios, barbilla)
const lowerFace = (cx, cy, w = 200) => `<path d="M${cx - w / 2} ${cy - 90} L${cx + w / 2} ${cy - 90} L${cx + w / 2} ${cy + 10} C${cx + w / 2} ${cy + 80} ${cx + w / 4} ${cy + 110} ${cx} ${cy + 110} C${cx - w / 4} ${cy + 110} ${cx - w / 2} ${cy + 80} ${cx - w / 2} ${cy + 10} Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.5"/>
  <path d="M${cx - 12} ${cy - 70} L${cx - 16} ${cy - 46} C${cx - 8} ${cy - 40} ${cx + 8} ${cy - 40} ${cx + 16} ${cy - 46} L${cx + 12} ${cy - 70}" fill="none" stroke="${SKIN_LINE}" stroke-width="2.5"/>`;
const waves = (x, y) => [0, 1, 2].map(i => `<path d="M${x + i * 12} ${y - 12 - i * 4} C${x + 7 + i * 12} ${y - 4} ${x + 7 + i * 12} ${y + 4} ${x + i * 12} ${y + 12 + i * 4}" fill="none" stroke="${C.green}" stroke-width="2.6" stroke-linecap="round"/>`).join('');
const buzzLines = (x, y) => [0, 1, 2].map(i => `<path d="M${x + i * 14} ${y - 16} l6 8 -6 8 6 8 -6 8" fill="none" stroke="${C.accent}" stroke-width="2.5"/>`).join('');
function gauge(cx = 135, cy = 168) {
  return `<path d="M${cx - 100} ${cy} A100 100 0 0 1 ${cx + 100} ${cy}" fill="none" stroke="#E2D7CB" stroke-width="20" stroke-linecap="round"/>
    <path d="M${cx - 25} ${cy - 97} A100 100 0 0 1 ${cx + 25} ${cy - 97}" fill="none" stroke="${C.green}" stroke-width="20"/>
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 84}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="9" fill="${C.ink}"/>`;
}

export const BRASS_ART = {
  // ---- El buzz ----
  'brass-buzz': [
    panel(`${lowerFace(135, 100)}${lips(135, 120, 84)}${arrow('M44 120 L86 120')}${arrow('M226 120 L184 120')}
      ${label(135, 28, '«mmm»', { color: C.ink, anchor: 'middle', size: 22 })}${label(30, 160, L('comisuras', 'firm'), { size: 12 })}${label(30, 174, L('firmes', 'corners'), { size: 12 })}${label(135, 190, L('centro blando', 'soft centre'), { color: C.ink, anchor: 'middle', size: 12 })}`),
    panel(`${lowerFace(110, 100, 180)}${lips(110, 120, 80)}${buzzLines(206, 120)}${[0, 1, 2].map(i => `<path d="M${74 + i * 18} 112 l4 -6 M${74 + i * 18} 128 l4 6" stroke="${C.accent}" stroke-width="2"/>`).join('')}
      ${label(206, 76, 'brrrr', { color: C.accent, size: 22 })}${label(135, 222, L('vibran como una moto', 'they buzz like a motorbike'), { color: C.ink, anchor: 'middle', size: 12 })}`),
    panel(`${profileHead(-46, 30, 1)}${mouthpiece(100, 116, 1.2)}
      <path d="M180 196 C200 150 220 150 240 180 C250 196 256 196 264 186" fill="none" stroke="#17798A" stroke-width="3"/>
      ${buzzLines(182, 116)}${label(264, 220, L('sirena con la boquilla', 'siren on the mouthpiece'), { anchor: 'end', size: 12 })}`),
  ],

  // ---- Dónde poner la boquilla ----
  'brass-placement': [
    panel(`${lowerFace(135, 100)}${lips(135, 120, 84)}<circle cx="135" cy="120" r="40" fill="none" stroke="${M.silver}" stroke-width="12"/><circle cx="135" cy="120" r="40" fill="none" stroke="${M.silverDark}" stroke-width="1.5"/>
      <line x1="135" y1="22" x2="135" y2="216" stroke="${C.green}" stroke-width="2" stroke-dasharray="6 6"/>${label(144, 30, L('centro', 'centre'), { size: 12 })}${ok(236, 196)}`),
    panel(`${[[L('trompeta', 'trumpet'), 45, 0.5, 20], [L('trompa', 'horn'), 135, 0.66, 18], [L('graves', 'low brass'), 225, 0.6, 28]].map(([name, cx, f, r]) => `
      <rect x="${cx - 40}" y="56" width="80" height="120" rx="30" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>${lips(cx, 120, 50)}
      <circle cx="${cx}" cy="${120 - (f - 0.5) * 2 * r}" r="${r}" fill="none" stroke="${M.silver}" stroke-width="7"/>
      ${label(cx, 200, name, { color: C.ink, anchor: 'middle', size: 13 })}${label(cx, 44, f === 0.5 ? '½ · ½' : f > 0.62 ? L('⅔ arriba', '⅔ top') : L('más arriba', 'more top'), { anchor: 'middle', size: 12 })}`).join('')}`),
    panel(`${[[70, false], [200, true]].map(([cx, press]) => `
      <path d="M${cx - 30} 70 C${cx - 6} ${press ? 92 : 84} ${cx - 6} ${press ? 100 : 104} ${cx - 30} ${press ? 116 : 118}" fill="${C.lip}" stroke="#C0706C" stroke-width="${press ? 6 : 2}"/>
      ${mouthpiece(cx - 12 + (press ? -4 : 0), 94, 0.9)}${press ? arrow(`M${cx + 60} 70 L${cx + 20} 88`, C.red) : ''}
      ${press ? bad(cx, 190) : ok(cx, 190)}`).join('')}
      ${label(70, 40, L('apoyada', 'resting'), { anchor: 'middle', size: 13 })}${label(200, 40, L('apretando', 'pressing'), { color: C.red, anchor: 'middle', size: 13 })}
      ${label(135, 222, L('el agudo sale con aire, no con fuerza', 'high notes come from air, not force'), { color: C.ink, anchor: 'middle', size: 11 })}`),
  ],

  // ---- La postura ----
  'brass-posture': [
    panel(`${sittingSide(30)}${trumpet(94, 60, 0.8)}${arm([50, 78], [74, 106], [140, 76], { far: true })}${arm(shoulderSitting(30), [80, 112], [116, 74])}
      ${dashed('M40 22 L40 150')}${label(262, 200, L('espalda recta', 'straight back'), { size: 12, anchor: 'end' })}${ok(236, 166)}`),
    panel(`${trumpet(4, 120, 1.25)}
      <path d="M78 168 C70 150 76 140 88 138 L132 138 C146 140 150 154 142 170 C130 184 92 184 78 168 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.4"/>
      ${limb('M70 230 C76 206 82 188 90 176', 22)}${limb('M84 140 C80 128 86 118 96 116', 9)}
      ${[86, 106, 126].map((x, i) => limb(`M${x + 50 - i * 4} 40 C${x + 24} 52 ${x + 4} 74 ${x} 92`, 11)).join('')}
      ${limb('M210 20 C200 30 186 40 176 44', 26)}
      ${label(10, 222, L('la izquierda sostiene', 'left hand holds'), { size: 12 })}${arrow('M70 208 L94 182')}
      ${label(262, 84, L('la derecha: yemas', 'right hand: fingertips'), { size: 12, anchor: 'end' })}${label(262, 98, L('sobre los pistones', 'on the valves'), { size: 12, anchor: 'end' })}`),
    panel(`${sittingSide(20)}${tuba(150, 120, 0.9)}${arm([40, 78], [58, 116], [130, 100], { far: true })}${arm(shoulderSitting(20), [66, 120], [132, 112])}
      ${dashed('M84 37 L262 37')}${label(262, 28, L('cabeza recta', 'head straight'), { anchor: 'end', size: 12 })}${label(196, 222, L('tuba sobre las piernas', 'tuba on the lap'), { anchor: 'middle', size: 12 })}`),
  ],

  // ---- Trompa: la mano en la campana ----
  'horn-hand': [
    panel(`<path d="M50 200 L50 120 C50 112 54 106 60 104 L62 52 C62 44 74 44 74 52 L76 100 L78 42 C78 34 90 34 90 42 L92 98 L94 44 C94 36 106 36 106 44 L108 100 L110 54 C110 46 122 46 122 54 L122 120 C130 110 140 106 146 112 C150 118 140 132 132 146 C124 162 116 178 110 200 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.4"/>
      ${[76, 92, 108].map(x => `<line x1="${x}" y1="60" x2="${x}" y2="100" stroke="${SKIN_LINE}" stroke-width="1.4"/>`).join('')}
      ${label(86, 30, L('dedos juntos', 'fingers together'), { anchor: 'middle', size: 12 })}
      <path d="M176 120 C176 150 200 170 230 170 C252 170 262 150 262 120" fill="none" stroke="${SKIN_LINE}" stroke-width="12" stroke-linecap="round"/>
      <path d="M176 120 C176 150 200 170 230 170 C252 170 262 150 262 120" fill="none" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>
      ${label(219, 100, L('vista de lado:', 'side view:'), { color: C.ink, anchor: 'middle', size: 11, weight: 600 })}${label(212, 200, L('como una cuchara', 'like a spoon'), { anchor: 'middle', size: 12 })}`),
    panel(`<circle cx="125" cy="115" r="96" fill="${M.brass}" stroke="${M.dark}" stroke-width="3"/><circle cx="125" cy="115" r="74" fill="${M.inside}"/>
      <path d="M190 64 C214 96 214 136 190 168 L170 160 C188 130 188 100 170 72 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${label(262, 30, L('a las 3 en punto', 'at 3 o\'clock'), { anchor: 'end', size: 12 })}${arrow('M232 40 L200 80')}`),
    panel(`${[[70, 0.3, L('abierta: sube', 'open: sharper')], [200, 0.7, L('cerrada: baja', 'closed: flatter')]].map(([cx, f, t]) => `
      <circle cx="${cx}" cy="110" r="50" fill="${M.brass}" stroke="${M.dark}" stroke-width="2"/><circle cx="${cx}" cy="110" r="38" fill="${M.inside}"/>
      <path d="M${cx + 38} 72 C${cx + 54} 96 ${cx + 54} 124 ${cx + 38} 148 L${cx + 38 - f * 60} 140 C${cx + 30 - f * 60} 120 ${cx + 30 - f * 60} 100 ${cx + 38 - f * 60} 80 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${label(cx, 196, t, { color: C.ink, anchor: 'middle', size: 13 })}`).join('')}`),
  ],

  // ---- Trombón: la vara ----
  'trombone-slide': [
    panel(`<rect x="10" y="96" width="250" height="9" rx="4" fill="${M.brass}" stroke="${M.dark}"/><rect x="10" y="134" width="250" height="9" rx="4" fill="${M.brass}" stroke="${M.dark}"/>
      <rect x="150" y="96" width="10" height="47" fill="${M.dark}"/>
      ${limb('M120 222 C126 196 136 170 146 150', 20)}${limb('M146 150 C150 132 156 120 160 108', 10)}${limb('M146 150 C140 134 140 120 148 110', 10)}
      ${label(135, 40, L('como un lápiz', 'like a pencil'), { anchor: 'middle', size: 14 })}${label(135, 58, L('pulgar, índice y medio', 'thumb, index and middle'), { color: C.ink, anchor: 'middle', size: 12 })}${ok(236, 196)}`),
    panel(`${(() => {
      const px = n => 50 + (n - 1) * 32;
      return `<path d="M16 76 L150 76" stroke="${M.brass}" stroke-width="6" stroke-linecap="round"/>${mouthpiece(6, 76, 0.4)}
        <path d="M100 74 C128 72 140 62 152 46 L152 106 C140 90 128 80 100 78 Z" fill="${M.brass}" stroke="${M.dark}" stroke-width="1.5"/>
        <ellipse cx="152" cy="76" rx="6" ry="30" fill="${M.inside}"/>
        <path d="M20 124 L258 124 M20 136 L258 136" stroke="${M.brass}" stroke-width="7" stroke-linecap="round"/>
        <line x1="${px(4)}" y1="40" x2="${px(4)}" y2="150" stroke="${C.green}" stroke-width="1.5" stroke-dasharray="4 4"/>
        ${[1, 2, 3, 4, 5, 6, 7].map(n => `<line x1="${px(n)}" x2="${px(n)}" y1="116" y2="144" stroke="${C.ink}" stroke-width="2.4"/>${label(px(n), 164, String(n), { color: C.ink, anchor: 'middle', size: 15 })}`).join('')}
        ${label(px(1), 190, L('1.ª: cerrada', '1st: closed'), { size: 11, anchor: 'middle' })}
        ${label(px(3), 210, L('3.ª: antes de la campana', '3rd: before the bell'), { size: 11, anchor: 'middle' })}
        ${label(px(4) + 4, 32, L('4.ª = borde de la campana', '4th = bell rim'), { size: 11, anchor: 'middle' })}
        ${label(264, 190, L('6.ª: brazo', '6th: arm'), { size: 11, anchor: 'end' })}${label(264, 204, L('casi estirado', 'almost straight'), { size: 11, anchor: 'end' })}`;
    })()}`),
    panel(`${gauge()}${arrow('M70 200 L30 200')}${arrow('M200 200 L240 200')}
      ${label(70, 222, L('fuera: baja', 'out: flatter'), { color: C.ink, anchor: 'middle', size: 12 })}${label(200, 222, L('dentro: sube', 'in: sharper'), { color: C.ink, anchor: 'middle', size: 12 })}`),
  ],
};
