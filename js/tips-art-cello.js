// Ilustraciones del violonchelo: sentarse con la pica bien ajustada y los cuatro apoyos, el arco (agarre, recto y
// una altura por cuerda) y la mano izquierda (marco de medio tono por dedo, pulgar detrás y codo alto).
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad, dashed } from './tips-art-kit.js';
import { violinTop, bowLevels } from './tips-art-violin.js';
import { seatedFront } from './tips-art-strings.js';
import { arm, shouldersFront, limb } from './tips-art-people.js';
import { finger, curledFinger, forearm, touch } from './tips-art-hands.js';

const V = { board: '#1C1C1C', stick: '#5B3414', hair: '#EFE7D6', frog: '#1C1C1C', silver: '#C9D0DA', body: '#C2742F', edge: '#6E3B12', pin: '#9AA3B2' };
const SKIN = C.skin;
const LINE = C.skinLine;

// Violonchelo de frente: el violín grande y con la pica hasta el suelo (y = floor)
function cello(x, y, rot = 8, s = 0.62, floor = 214) {
  const pin = (floor - y) / s;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <line x1="0" y1="72" x2="0" y2="${pin}" stroke="${V.pin}" stroke-width="5" stroke-linecap="round"/>
    ${violinTop()}</g>`;
}
// Chelista sentado de frente (cabeza en cx, 48): el chelo entre las rodillas, la izquierda en el mástil y el arco
function cellist(cx = 135, extra = '') {
  const [sR, sL] = shouldersFront(cx, 48);
  return `${seatedFront(cx)}${cello(cx, 128)}
    <line x1="34" y1="152" x2="214" y2="146" stroke="${V.stick}" stroke-width="4" stroke-linecap="round"/>
    ${arm(sR, [sR[0] - 18, sR[1] + 52], [cx - 34, 150])}
    ${arm(sL, [sL[0] + 22, sL[1] + 10], [cx + 22, 70])}${extra}`;
}

export const CELLO_ART = {
  'cello-hold': [
    // 1. En el borde de la silla, la espalda recta y las rodillas abiertas
    panel(`${cellist()}${dashed('M135 8 L135 40')}${label(262, 30, L('espalda recta', 'straight back'), { anchor: 'end', size: 12 })}
      ${label(262, 222, L('en el borde de la silla', 'on the edge of the chair'), { anchor: 'end', size: 12 })}${ok(30, 196)}`),
    // 2. La pica: la clavija de Do junto a la oreja izquierda y el borde de arriba a la altura del esternón
    panel(`${cellist()}
      <circle cx="152" cy="34" r="8" fill="none" stroke="${C.green}" stroke-width="3"/>${dashed('M160 36 L166 46')}
      ${label(262, 24, L('clavija de Do', 'C peg'), { anchor: 'end', size: 12 })}${label(262, 38, L('junto a la oreja', 'by your ear'), { anchor: 'end', size: 12 })}
      ${dashed('M60 86 L210 86')}${label(262, 96, L('esternón', 'breastbone'), { anchor: 'end', size: 12 })}
      ${arrow('M196 208 L196 186')}${arrow('M210 186 L210 208')}${label(262, 180, L('pica', 'endpin'), { anchor: 'end', size: 12 })}
      <rect x="132" y="210" width="26" height="6" rx="3" fill="${C.ink}"/>`),
    // 3. Cuatro apoyos: el pecho, las dos rodillas y la pica en el suelo
    panel(`${cellist(135, `${[[132, 86], [104, 166], [168, 166], [148, 213]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${C.green}" stroke="#fff" stroke-width="2"/>`).join('')}`)}
      ${label(262, 80, L('pecho', 'chest'), { anchor: 'end', size: 12 })}${label(14, 190, L('rodillas', 'knees'), { size: 12 })}${label(262, 222, L('suelo', 'floor'), { anchor: 'end', size: 12 })}`),
  ],

  'cello-bow': [
    // 1. Agarre: pulgar doblado frente al medio y los cuatro dedos caídos sobre la vara (el meñique también)
    panel(`<line x1="6" y1="128" x2="266" y2="122" stroke="${V.stick}" stroke-width="6" stroke-linecap="round"/>
      <line x1="96" y1="152" x2="266" y2="138" stroke="${V.hair}" stroke-width="4"/>
      <path d="M40 130 L98 129 L98 150 C80 156 58 156 44 150 Z" fill="${V.frog}"/><rect x="94" y="128" width="8" height="25" fill="${V.silver}"/><circle cx="60" cy="141" r="4" fill="#E7D9B5"/>
      ${forearm(250, 20, 200, 70, 30)}
      <path d="M112 100 C110 78 134 60 166 60 C194 60 208 74 206 96 L198 106 L118 108 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${curledFinger(198, 100, 92, 12, [16, 13, 11], { w: 13, nail: 1 }).svg}
      ${curledFinger(176, 104, 96, 10, [18, 15, 12], { w: 13.5, nail: 1 }).svg}
      ${curledFinger(152, 104, 98, 10, [18, 15, 12], { w: 13.5, nail: 1 }).svg}
      ${curledFinger(128, 102, 100, 10, [15, 12, 10], { w: 12, nail: 1 }).svg}
      ${finger([[150, 172], [140, 160], [134, 146], [130, 134]], { w: 14, nail: 1 })}${touch(130, 136, 8)}
      ${arrow('M60 70 L118 104')}${label(30, 60, L('cuatro dedos sobre la vara', 'four fingers over the stick'), { size: 12 })}
      ${arrow('M70 200 L122 148')}${label(30, 218, L('pulgar doblado, frente al medio', 'bent thumb, opposite the middle'), { size: 12 })}${ok(240, 30)}`),
    // 2. Recto, entre el puente y el diapasón
    panel(`<g transform="translate(130 92) scale(1.15)">${violinTop()}</g>
      <line x1="4" y1="108" x2="266" y2="108" stroke="${V.stick}" stroke-width="5" stroke-linecap="round"/>
      <line x1="4" y1="113" x2="266" y2="113" stroke="${V.hair}" stroke-width="3"/>
      <path d="M140 108 L140 98 L130 98" fill="none" stroke="${C.green}" stroke-width="2"/>
      <path d="M178 96 L200 82" stroke="${C.ink}" stroke-width="1.2"/>${label(202, 82, L('diapasón', 'fingerboard'), { color: C.ink, size: 12 })}
      <path d="M150 120 L200 140" stroke="${C.ink}" stroke-width="1.2"/>${label(202, 146, L('puente', 'bridge'), { color: C.ink, size: 12 })}
      ${ok(238, 196)}`),
    // 3. Una altura de brazo por cuerda: Do con el codo alto, La con el codo bajo
    panel(`${bowLevels([L('Do', 'C'), L('Sol', 'G'), L('Re', 'D'), L('La', 'A')])}
      ${label(262, 20, L('verde = altura del codo', 'green = elbow height'), { size: 11, anchor: 'end' })}`),
  ],

  'cello-left': [
    // 1. El marco de la mano: cuatro dedos, cada uno a medio tono, en la cuerda La
    panel(`${(() => {
      const strX = [96, 122, 148, 174];
      const nut = 30, semi = 34;
      const board = `<path d="M80 ${nut} L190 ${nut} L196 226 L74 226 Z" fill="${V.board}"/><rect x="78" y="${nut - 6}" width="114" height="7" rx="2" fill="#E7DCC4"/>`;
      const strings = strX.map((x, i) => `<line x1="${x}" y1="${nut}" x2="${x + (i - 1.5) * 2}" y2="226" stroke="#DDD" stroke-width="${3 - i * 0.5}"/>`).join('');
      const names = [L('Do', 'C'), L('Sol', 'G'), L('Re', 'D'), L('La', 'A')].map((n, i) => label(strX[i], 18, n, { color: C.ink, anchor: 'middle', size: 11 })).join('');
      const tips = [1, 2, 3, 4].map(f => [174, nut + (f + 1) * semi - semi / 2]);
      const fingers = tips.map(([x, y], i) => finger([[20, y - 40 + i * 6], [70, y - 30 + i * 4], [128, y - 14], [x - 2, y]], { w: 14, nail: 1 })).join('');
      const marks = tips.map(([x, y], i) => `${touch(x, y, 9)}${label(x + 18, y + 5, String(i + 1), { size: 14 })}`).join('');
      return board + strings + names + fingers + marks;
    })()}
      ${label(266, 120, L('medio tono', 'a semitone'), { anchor: 'end', size: 11 })}${label(266, 134, L('por dedo', 'per finger'), { anchor: 'end', size: 11 })}`),
    // 2. Pulgar detrás, frente al dedo 2, sin apretar
    panel(`<path d="M95 92 L175 92 L175 104 C175 136 158 150 135 150 C112 150 95 136 95 104 Z" fill="${V.body}" stroke="${V.edge}" stroke-width="2"/>
      <rect x="92" y="84" width="86" height="10" rx="3" fill="${V.board}"/>${[108, 126, 144, 162].map(x => `<circle cx="${x}" cy="82" r="2.6" fill="#BBB"/>`).join('')}
      <path d="M70 230 C66 200 70 186 84 176 C104 168 150 168 176 180 C196 190 206 210 206 230 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${finger([[120, 214], [124, 190], [130, 170], [135, 156]], { w: 19, nail: 0 })}${touch(135, 156, 10)}
      ${finger([[196, 196], [214, 150], [204, 100], [180, 74]], { w: 15, nail: 1 })}${finger([[180, 74], [168, 66], [158, 70], [152, 80]], { w: 14, nail: 1 })}
      ${label(14, 120, L('pulgar detrás,', 'thumb behind,'), { size: 12 })}${label(14, 134, L('frente al dedo 2', 'opposite finger 2'), { size: 12 })}${arrow('M70 140 L124 160')}
      ${label(262, 30, L('sin apretar', 'no squeezing'), { anchor: 'end', size: 12 })}`),
    // 3. Codo alto, a la altura de la mano (bien) frente a codo caído (mal)
    panel(`${[[0, true], [136, false]].map(([ox, good]) => `<g transform="translate(${ox} 0)">
        <rect x="96" y="20" width="16" height="200" rx="4" fill="${V.board}"/>
        ${limb(good ? 'M10 70 L60 108' : 'M10 70 L40 170', 18, C.shirt, '#8A3416')}
        ${good ? forearm(60, 108, 94, 80, 18) : forearm(40, 170, 92, 96, 18)}
        <ellipse cx="96" cy="${good ? 78 : 92}" rx="10" ry="12" fill="${SKIN}" stroke="${LINE}" stroke-width="2"/>
        ${good ? ok(30, 200) : bad(30, 200)}</g>`).join('')}
      ${label(70, 24, L('codo alto', 'elbow up'), { anchor: 'middle', size: 12 })}${label(206, 24, L('codo caído', 'dropped elbow'), { color: C.red, anchor: 'middle', size: 12 })}`),
  ],
};
