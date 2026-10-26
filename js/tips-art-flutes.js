// Ilustraciones de la flauta travesera (y flautín) y de la flauta dulce: embocadura vista de perfil y desde arriba,
// los tres apoyos, la posición de la cabeza, cómo tapar los agujeros y cómo soplar.
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad, dashed } from './tips-art-kit.js';
import { SKIN, SKIN_LINE, limb, cloth, arm, shouldersFront, profileHead, frontPerson } from './tips-art-people.js';

const F = { silver: '#C9D0DA', silverDark: '#8A93A3', hole: '#2A2F38', wood: '#E3C58E', woodDark: '#A8854A', air: '#17798A' };

// Flauta travesera horizontal de (x, y) a (x + len, y): cabeza a la izquierda con la placa y el agujero
function flute(x, y, len = 240, { keys = true } = {}) {
  return `<rect x="${x}" y="${y - 6}" width="${len}" height="12" rx="6" fill="${F.silver}" stroke="${F.silverDark}" stroke-width="1.5"/>
    <rect x="${x - 6}" y="${y - 7}" width="10" height="14" rx="3" fill="${F.silverDark}"/>
    <ellipse cx="${x + 26}" cy="${y - 4}" rx="11" ry="5" fill="${F.silver}" stroke="${F.silverDark}" stroke-width="1.5"/><ellipse cx="${x + 26}" cy="${y - 5}" rx="5" ry="2.6" fill="${F.hole}"/>
    ${keys ? Array.from({ length: 7 }, (_, i) => `<circle cx="${x + len * 0.42 + i * len * 0.075}" cy="${y - 1}" r="4.2" fill="${F.silver}" stroke="${F.silverDark}" stroke-width="1.5"/>`).join('') : ''}`;
}
// Flauta dulce vertical, boquilla arriba en (x, y)
function recorder(x, y, len = 200) {
  const holes = [0.3, 0.4, 0.5, 0.62, 0.72, 0.82, 0.91].map(f => y + len * f);
  return `<path d="M${x - 9} ${y} L${x + 9} ${y} L${x + 11} ${y + 30} L${x + 10} ${y + len} L${x + 16} ${y + len + 14} L${x - 16} ${y + len + 14} L${x - 10} ${y + len} L${x - 11} ${y + 30} Z" fill="${F.wood}" stroke="${F.woodDark}" stroke-width="1.5"/>
    <rect x="${x - 4}" y="${y + 18}" width="8" height="5" fill="${F.hole}"/>
    ${holes.map(hy => `<circle cx="${x}" cy="${hy}" r="3.6" fill="${F.hole}"/>`).join('')}`;
}
const waves = (x, y, color = C.green) => [0, 1, 2].map(i => `<path d="M${x + i * 12} ${y - 12 - i * 4} C${x + 7 + i * 12} ${y - 4} ${x + 7 + i * 12} ${y + 4} ${x + i * 12} ${y + 12 + i * 4}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`).join('');
// Mano abierta (palma) de frente, centrada en (x, y)
const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-22 30 C-26 10 -24 -6 -18 -14 L-18 -40 C-18 -46 -10 -46 -10 -40 L-10 -18 L-8 -48 C-8 -54 0 -54 0 -48 L0 -18 L4 -46 C4 -52 12 -52 12 -46 L10 -16 L16 -38 C16 -44 24 -44 23 -37 L18 -6 C24 -12 30 -10 28 -4 L18 18 C14 30 4 36 -8 36 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.2"/></g>`;

export const FLUTE_ART = {
  // ---- Flauta: embocadura ----
  'flute-embouchure': [
    // 1. La placa apoyada en la barbilla: el borde del agujero donde empieza el labio de abajo
    panel(`${profileHead(-74, -28, 1.55, { mouth: false })}
      <path d="M140 108 C150 104 160 104 166 108" stroke="${C.lip}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M138 118 C150 116 160 118 166 122" stroke="${C.lip}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <circle cx="176" cy="146" r="22" fill="${F.silver}" stroke="${F.silverDark}" stroke-width="2"/>
      <path d="M150 128 C162 122 186 122 200 126 L198 132 C186 128 164 128 152 134 Z" fill="${F.silverDark}"/>
      <path d="M168 125 L184 125" stroke="${F.hole}" stroke-width="4"/>
      ${arrow('M232 80 L180 120')}${label(266, 66, L('borde del agujero', 'edge of the hole'), { anchor: 'end', size: 12 })}${label(266, 80, L('= borde del labio', '= edge of the lip'), { anchor: 'end', size: 12 })}`),
    // 2. Vista desde arriba: el labio tapa entre un cuarto y un tercio del agujero
    panel(`<rect x="16" y="78" width="238" height="74" rx="37" fill="${F.silver}" stroke="${F.silverDark}" stroke-width="2"/>
      <ellipse cx="135" cy="115" rx="44" ry="25" fill="${F.hole}"/>
      <path d="M30 56 L240 56 L240 102 C200 108 70 108 30 102 Z" fill="${C.lip}"/>
      <path d="M190 90 L200 90 M195 90 L195 107 M190 107 L200 107" stroke="${C.green}" stroke-width="2.5"/>
      ${label(206, 104, '⅓', { size: 16 })}
      ${label(135, 46, L('labio de abajo (lado de quien toca)', 'lower lip (player side)'), { color: C.ink, anchor: 'middle', size: 12 })}
      ${label(135, 186, L('tapa ¼ – ⅓ del agujero', 'cover ¼ – ⅓ of the hole'), { anchor: 'middle', size: 14 })}${label(135, 204, L('el resto queda abierto', 'the rest stays open'), { color: C.ink, anchor: 'middle', size: 12 })}`),
    // 3. «pu»: abertura pequeña y el aire contra el borde de enfrente, que lo parte en dos
    panel(`<path d="M20 86 C50 70 80 74 104 92 C80 98 50 98 20 86 Z" fill="${C.lip}"/><path d="M20 112 C50 128 80 124 104 106 C80 100 50 100 20 112 Z" fill="${C.lip}"/>
      <rect x="120" y="128" width="140" height="16" rx="4" fill="${F.silver}" stroke="${F.silverDark}"/><path d="M168 128 L196 128 L190 144 L174 144 Z" fill="${F.hole}"/>
      ${arrow('M104 99 L190 126', F.air)}${arrow('M196 126 L240 112', F.air, 2.2)}${arrow('M196 128 L196 168', F.air, 2.2)}
      ${label(60, 152, '«pu»', { color: C.ink, anchor: 'middle', size: 22 })}${label(240, 100, L('fuera', 'out'), { color: F.air, anchor: 'middle', size: 12 })}${label(212, 186, L('dentro', 'in'), { color: F.air, size: 12 })}`),
  ],

  // ---- Flauta: cómo sujetarla ----
  'flute-hold': [
    // 1. Tres apoyos: barbilla, base del índice izquierdo y pulgar derecho por debajo
    panel(`${flute(18, 120, 236)}
      <path d="M30 92 C36 78 56 76 62 92" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${limb('M104 70 C104 92 106 106 110 116', 14)}${limb('M178 162 C180 146 182 136 184 128', 13)}
      ${[[44, 108], [110, 116], [184, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${C.green}" stroke-width="3"/>`).join('')}
      ${label(44, 64, L('barbilla', 'chin'), { anchor: 'middle', size: 12 })}${label(110, 52, L('base del índice', 'base of index'), { anchor: 'middle', size: 12 })}${label(110, 66, L('izquierdo', '(left)'), { anchor: 'middle', size: 11, weight: 600 })}
      ${label(184, 186, L('pulgar derecho', 'right thumb'), { anchor: 'middle', size: 12 })}${label(184, 200, L('por debajo', 'underneath'), { anchor: 'middle', size: 11, weight: 600 })}`),
    // 2. De frente: la flauta hacia la derecha de quien toca, la cabeza un poco girada y los hombros bajos
    panel(`${frontPerson(170, 60)}
      ${flute(12, 86, 156, { keys: false })}
      ${arm(shouldersFront(170, 60)[0], [96, 150], [64, 92])}${arm(shouldersFront(170, 60)[1], [214, 160], [146, 92])}
      ${arrow('M196 26 C182 16 160 16 150 24')}${label(262, 30, L('gira un poco', 'turn slightly'), { anchor: 'end', size: 12 })}
      ${arrow('M234 120 L234 142')}${label(262, 214, L('hombros bajos', 'shoulders low'), { color: '#fff', anchor: 'end', size: 13 })}`),
    // 3. Sentado en diagonal (visto desde arriba): girado a la derecha para que el brazo no choque con el respaldo
    panel(`<rect x="70" y="70" width="110" height="110" rx="10" fill="#E9E2D8" stroke="${C.muted}" stroke-width="3"/><rect x="70" y="58" width="110" height="14" rx="4" fill="${C.muted}"/>
      <g transform="rotate(35 125 125)"><ellipse cx="125" cy="125" rx="48" ry="22" fill="${C.shirt}"/><circle cx="125" cy="125" r="17" fill="#6B4A2E"/><path d="M125 108 L125 100" stroke="${SKIN_LINE}" stroke-width="5" stroke-linecap="round"/>
        <line x1="128" y1="98" x2="10" y2="98" stroke="${F.silver}" stroke-width="7" stroke-linecap="round"/></g>
      ${arrow('M206 186 C230 160 230 130 214 108')}${label(266, 206, L('girado a la derecha', 'turned to the right'), { anchor: 'end', size: 12 })}
      ${label(125, 46, L('respaldo', 'backrest'), { color: C.muted, anchor: 'middle', size: 11, weight: 600 })}${ok(236, 34)}`),
  ],

  // ---- Flauta: la cabeza sola ----
  'flute-head': [
    panel(`<rect x="30" y="100" width="170" height="20" rx="8" fill="${F.silver}" stroke="${F.silverDark}" stroke-width="1.5"/>
      <ellipse cx="62" cy="100" rx="12" ry="5" fill="${F.silver}" stroke="${F.silverDark}"/><ellipse cx="62" cy="99" rx="5" ry="2.4" fill="${F.hole}"/>
      ${limb('M170 170 C176 150 180 136 184 124', 16)}${waves(214, 110)}
      ${label(135, 64, L('extremo abierto', 'open end'), { color: C.ink, anchor: 'middle', size: 13 })}${label(135, 214, L('≈ un La', '≈ an A'), { anchor: 'middle', size: 18 })}`),
    panel(`<rect x="30" y="100" width="170" height="20" rx="8" fill="${F.silver}" stroke="${F.silverDark}" stroke-width="1.5"/>
      <ellipse cx="62" cy="100" rx="12" ry="5" fill="${F.silver}" stroke="${F.silverDark}"/><ellipse cx="62" cy="99" rx="5" ry="2.4" fill="${F.hole}"/>
      ${palm(214, 112, 1.1)}${label(135, 64, L('tapa con la palma', 'cover with the palm'), { color: C.ink, anchor: 'middle', size: 13 })}
      ${label(135, 214, L('una octava más grave', 'an octave lower'), { anchor: 'middle', size: 15 })}`),
    panel(`<rect x="20" y="70" width="150" height="18" rx="8" fill="${F.silver}" stroke="${F.silverDark}" stroke-width="1.5"/>${palm(200, 80, 0.9)}${arrow('M232 50 L232 112')}${arrow('M246 112 L246 50')}
      <path d="M20 190 C50 130 80 130 110 170 C140 210 170 210 200 150 C215 120 230 120 250 140" fill="none" stroke="${F.air}" stroke-width="4" stroke-linecap="round"/>
      ${label(135, 222, L('sirena: sube y baja sin cortarse', 'siren: up and down without breaking'), { anchor: 'middle', size: 12 })}`),
  ],

  // ---- Flauta dulce: tapar los agujeros ----
  'recorder-holes': [
    // 1. Mano izquierda arriba (3 dedos + pulgar detrás), derecha abajo (4 dedos)
    panel(`${recorder(135, 10, 196)}
      ${[0.3, 0.4, 0.5].map(f => `<circle cx="135" cy="${10 + 196 * f}" r="8" fill="none" stroke="${C.green}" stroke-width="3"/>`).join('')}
      ${[0.62, 0.72, 0.82, 0.91].map(f => `<circle cx="135" cy="${10 + 196 * f}" r="8" fill="none" stroke="${C.pants}" stroke-width="3"/>`).join('')}
      <circle cx="135" cy="${10 + 196 * 0.26}" r="8" fill="none" stroke="${C.green}" stroke-width="2.5" stroke-dasharray="3 3"/>
      ${label(110, 78, L('mano', 'left'), { anchor: 'end', size: 13 })}${label(110, 94, L('izquierda', 'hand'), { anchor: 'end', size: 13 })}
      ${label(110, 160, L('mano', 'right'), { color: C.pants, anchor: 'end', size: 13 })}${label(110, 176, L('derecha', 'hand'), { color: C.pants, anchor: 'end', size: 13 })}
      ${label(158, 62, L('pulgar detrás', 'thumb behind'), { size: 11 })}`),
    // 2. Con la yema plana (queda el círculo marcado), no con la punta
    panel(`${[[70, true], [200, false]].map(([x, good]) => `<rect x="${x - 50}" y="150" width="100" height="22" rx="8" fill="${F.wood}" stroke="${F.woodDark}"/><circle cx="${x}" cy="158" r="5" fill="${F.hole}"/>
      ${good ? limb(`M${x - 46} 70 C${x - 30} 110 ${x - 14} 142 ${x + 4} 150`, 18) : limb(`M${x - 20} 60 C${x - 10} 100 ${x - 2} 130 ${x - 2} 150`, 16)}
      ${good ? ok(x, 206) : bad(x, 206)}`).join('')}
      ${label(70, 40, L('yema plana', 'flat pad'), { anchor: 'middle', size: 13 })}${label(200, 40, L('punta', 'tip'), { color: C.red, anchor: 'middle', size: 13 })}`),
    // 3. Notas agudas: el pulgar de atrás deja una rendija doblando la punta
    panel(`<rect x="100" y="20" width="70" height="200" rx="18" fill="${F.wood}" stroke="${F.woodDark}" stroke-width="1.5"/><circle cx="135" cy="104" r="12" fill="${F.hole}"/>
      <path d="M135 230 C130 180 126 150 128 116 C130 104 142 100 150 106 C156 112 154 124 148 130 C140 140 140 160 150 230" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.2"/>
      <path d="M126 98 A12 12 0 0 1 146 96" fill="none" stroke="${C.green}" stroke-width="3"/>
      ${arrow('M210 80 L150 98')}${label(266, 70, L('rendija', 'small gap'), { anchor: 'end', size: 13 })}${label(266, 130, L('vista desde', 'seen from'), { color: C.ink, anchor: 'end', size: 11, weight: 600 })}${label(266, 144, L('atrás', 'behind'), { color: C.ink, anchor: 'end', size: 11, weight: 600 })}`),
  ],

  // ---- Flauta dulce: soplar «du» ----
  'recorder-breath': [
    panel(`<rect x="40" y="22" width="70" height="210" rx="10" fill="#F4E3D3"/>
      <path d="M110 30 L140 30 L140 100 L110 100 Z" fill="#fff" stroke="#9AA3B2" stroke-width="2.5"/><path d="M110 214 L140 214 L140 150 L110 150 Z" fill="#fff" stroke="#9AA3B2" stroke-width="2.5"/>
      <path d="M140 26 C178 26 196 64 194 96 C193 106 180 110 140 110 Z" fill="${C.lip}"/><path d="M140 138 C180 136 194 144 194 164 C196 196 178 222 140 222 Z" fill="${C.lip}"/>
      <path d="M150 112 L268 106 L268 140 L150 136 Z" fill="${F.wood}" stroke="${F.woodDark}"/>
      ${arrow('M222 186 L176 140')}${label(266, 208, L('sobre el labio,', 'on the lip,'), { anchor: 'end', size: 12 })}${label(266, 222, L('sin dientes', 'no teeth'), { anchor: 'end', size: 12 })}${ok(240, 40)}`),
    panel(`<path d="M30 60 L240 60 L240 70 C200 70 160 76 130 92 L30 92 Z" fill="#F4E3D3"/>
      <path d="M120 60 L150 60 L150 84 L120 84 Z" fill="#fff" stroke="#9AA3B2" stroke-width="2"/>
      <path d="M30 170 C70 150 110 120 136 96 C144 92 150 98 146 106 C130 130 110 160 100 190 L30 190 Z" fill="#E59A97" stroke="#C0706C" stroke-width="2"/>
      <circle cx="140" cy="98" r="6" fill="none" stroke="${C.green}" stroke-width="3"/>
      ${arrow('M196 150 L150 104')}${label(266, 170, L('la lengua toca', 'the tongue touches'), { size: 12, anchor: 'end' })}${label(266, 184, L('y se suelta', 'and lets go'), { size: 12, anchor: 'end' })}
      ${label(70, 36, '«du»', { color: C.ink, size: 26 })}`),
    panel(`${palm(70, 140, 0.9)}${palm(110, 140, 0.9)}${[0, 1, 2].map(i => `<path d="M${50 + i * 26} 70 C${44 + i * 26} 60 ${56 + i * 26} 50 ${50 + i * 26} 40" fill="none" stroke="#E8964A" stroke-width="3" stroke-linecap="round"/>`).join('')}
      ${ok(90, 206)}${label(90, 26, L('templado', 'warm'), { anchor: 'middle', size: 13 })}
      <rect x="196" y="120" width="12" height="62" rx="3" fill="#F7E4B5" stroke="${SKIN_LINE}"/><path d="M202 120 L202 112" stroke="${C.ink}" stroke-width="2"/>
      ${[0, 1, 2].map(i => `<path d="M150 ${96 + i * 12} L188 ${104 + i * 6}" stroke="${F.air}" stroke-width="3" stroke-linecap="round"/>`).join('')}
      ${bad(202, 206)}${label(202, 26, L('apagar la vela', 'blow out a candle'), { color: C.red, anchor: 'middle', size: 12 })}`),
  ],
};
