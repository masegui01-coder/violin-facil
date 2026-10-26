// Viñetas de manos y dedos redibujadas con dedos de verdad (falanges, pliegues y uña): se ve con qué parte toca cada
// dedo y dónde apoya. Sustituyen a la viñeta del mismo número en cada ilustración (ver tips-art.js).
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad, dashed } from './tips-art-kit.js';
import { finger, curledFinger, handBack, forearm, touch } from './tips-art-hands.js';

const W = { board: '#1C1C1C', violin: '#C2742F', violinEdge: '#6E3B12', stick: '#5B3414', hair: '#EFE7D6', frog: '#1C1C1C',
  fret: '#C9D0DA', string: '#EDEDED', neck: '#6B4423', gtrTop: '#E2B26E', gtrEdge: '#8A5A26', hole: '#2A1A0E', black: '#1E2430',
  silver: '#C9D0DA', silverDark: '#8A93A3', brass: '#D7A63A', brassDark: '#9A7020', inside: '#7A5A1A', key: '#FFFFFF', keyLine: '#9AA3B2',
  plate: '#E8C38A', wood: '#D9A066', woodDark: '#8A5A26', stickWood: '#E3C58E', recorder: '#E3C58E', recorderDark: '#A8854A' };
const SKIN = C.skin;
const LINE = C.skinLine;

// Un dedo que baja desde arriba y apoya la yema (curvo) o la punta / el dedo plano
const goodFinger = (x, y, opts) => curledFinger(x, y - 66, 70, 14, [28, 22, 18], { w: 15, nail: -1, ...opts });

export const HAND_PANELS = {
  // ---------- Violín ----------
  'violin-bow': {
    0: panel(`<line x1="6" y1="128" x2="266" y2="122" stroke="${W.stick}" stroke-width="6" stroke-linecap="round"/>
      <line x1="96" y1="152" x2="266" y2="138" stroke="${W.hair}" stroke-width="4"/>
      <path d="M40 130 L98 129 L98 150 C80 156 58 156 44 150 Z" fill="${W.frog}"/><rect x="94" y="128" width="8" height="25" fill="${W.silver}"/><circle cx="60" cy="141" r="4" fill="#E7D9B5"/>
      ${forearm(250, 20, 200, 70, 30)}
      <path d="M118 100 C116 78 136 62 166 62 C192 62 206 74 206 96 L198 106 L124 108 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${curledFinger(196, 100, 92, 12, [16, 13, 11], { w: 13, nail: 1 }).svg}
      ${curledFinger(176, 104, 96, 10, [18, 15, 12], { w: 13.5, nail: 1 }).svg}
      ${curledFinger(154, 104, 98, 10, [18, 15, 12], { w: 13.5, nail: 1 }).svg}
      ${curledFinger(130, 102, 200, 70, [13, 11, 9], { w: 11.5, nail: 1 }).svg}
      ${finger([[150, 172], [140, 160], [134, 146], [130, 134]], { w: 14, nail: 1 })}
      ${touch(116, 124, 8)}${touch(128, 136, 8)}
      ${arrow('M60 70 L108 112')}${label(40, 60, L('meñique de pie sobre la vara', 'pinky standing on the stick'), { size: 12 })}
      ${arrow('M70 200 L122 148')}${label(30, 218, L('pulgar doblado, frente al medio', 'bent thumb, opposite the middle'), { size: 12 })}${ok(240, 30)}`),
  },
  'violin-left': {
    1: panel(`<path d="M95 92 L175 92 L175 104 C175 136 158 150 135 150 C112 150 95 136 95 104 Z" fill="${W.violin}" stroke="${W.violinEdge}" stroke-width="2"/>
      <rect x="92" y="84" width="86" height="10" rx="3" fill="${W.board}"/>${[108, 126, 144, 162].map(x => `<circle cx="${x}" cy="82" r="2.6" fill="#BBB"/>`).join('')}
      <path d="M70 230 C66 200 70 186 84 176 C104 168 150 168 176 180 C196 190 206 210 206 230 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${finger([[84, 190], [80, 160], [86, 138], [96, 124]], { w: 17, nail: 1 })}
      ${finger([[196, 196], [214, 150], [204, 100], [180, 74]], { w: 15, nail: 1 })}${finger([[180, 74], [168, 66], [158, 70], [152, 80]], { w: 14, nail: 1 })}
      <path d="M108 162 C120 172 150 172 166 164" fill="${C.green}" opacity=".2" stroke="${C.green}" stroke-dasharray="4 4"/>
      ${label(135, 222, L('hueco', 'gap'), { anchor: 'middle', size: 13, color: '#fff' })}${arrow('M135 206 L135 172')}
      ${label(18, 110, L('pulgar enfrente', 'thumb opposite'), { size: 12 })}${arrow('M48 116 L88 122')}${touch(152, 82, 8)}`),
    2: panel(`<rect x="8" y="168" width="254" height="16" rx="4" fill="${W.board}"/><line x1="8" y1="164" x2="262" y2="164" stroke="#BBB" stroke-width="2"/>
      ${finger([[40, 40], [82, 78], [104, 122], [112, 160]], { w: 18, nail: -1 })}${touch(112, 162, 9)}
      ${arrow('M150 60 L122 138')}${label(156, 56, L('cae desde arriba', 'drops from above'), { size: 12 })}${ok(70, 206)}
      ${finger([[160, 120], [196, 140], [228, 152], [258, 158]], { w: 17, nail: -1 })}
      ${bad(222, 112)}${label(222, 92, L('plano', 'flat'), { color: C.red, size: 12, anchor: 'middle' })}
      ${label(112, 210, L('yema', 'pad'), { color: C.ink, size: 12, anchor: 'middle' })}`),
  },

  // ---------- Guitarra y ukelele ----------
  fretting: {
    0: panel(`<rect x="10" y="80" width="250" height="76" fill="${W.board}"/>${[70, 180].map(x => `<rect x="${x}" y="80" width="6" height="76" fill="${W.fret}"/>`).join('')}
      ${[92, 106, 120, 134, 148].map(y => `<line x1="10" x2="260" y1="${y}" y2="${y}" stroke="${W.string}" stroke-width="1.6"/>`).join('')}
      ${finger([[150, 10], [154, 46], [162, 78], [168, 104]], { w: 17, nail: 1 })}${touch(169, 108, 10)}${ok(168, 196)}
      ${finger([[96, 10], [102, 50], [114, 92], [124, 118]], { w: 17, nail: 1 })}${touch(125, 121, 10, C.red)}${bad(118, 196)}
      ${label(178, 222, L('junto al traste', 'next to the fret'), { anchor: 'middle', size: 12 })}${label(76, 222, L('en medio', 'in the middle'), { color: C.red, anchor: 'middle', size: 12 })}`),
    1: panel(`<rect x="10" y="168" width="250" height="18" fill="${W.board}"/><line x1="10" x2="260" y1="166" y2="166" stroke="#BBB" stroke-width="2.5"/><rect x="176" y="160" width="6" height="26" fill="${W.fret}"/>
      ${forearm(-10, 40, 40, 50, 26)}${finger([[40, 50], [96, 66], [140, 110], [164, 160]], { w: 19, nail: -1 })}${touch(165, 164, 9)}
      ${arrow('M222 90 L176 150')}${label(262, 76, L('la punta, desde arriba', 'the tip, from above'), { anchor: 'end', size: 12 })}${label(262, 210, L('uñas cortas', 'short nails'), { color: C.ink, anchor: 'end', size: 12 })}`),
    2: panel(`<path d="M80 96 L190 96 L190 108 C190 148 166 166 135 166 C104 166 80 148 80 108 Z" fill="${W.neck}" stroke="#3E2612" stroke-width="2"/>
      <rect x="76" y="86" width="118" height="12" rx="3" fill="${W.board}"/>${[90, 108, 126, 144, 162, 180].map(x => `<circle cx="${x}" cy="84" r="2.4" fill="#CCC"/>`).join('')}
      <path d="M100 230 C110 206 160 200 196 210 C214 216 222 226 224 230 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${finger([[130, 222], [132, 200], [134, 186], [135, 172]], { w: 20, nail: 0 })}${touch(135, 172, 10)}
      ${finger([[206, 214], [232, 160], [222, 96], [196, 66]], { w: 15, nail: 1 })}${finger([[196, 66], [178, 58], [166, 64], [160, 78]], { w: 14, nail: 1 })}
      ${label(20, 150, L('pulgar detrás,', 'thumb behind,'), { size: 12 })}${label(20, 164, L('frente al dedo', 'opposite the'), { size: 12 })}${label(20, 178, L('medio', 'middle finger'), { size: 12 })}${arrow('M84 180 L120 176')}
      ${bad(244, 30)}${label(230, 56, L('sin apretar', 'no squeezing'), { color: C.red, size: 11, anchor: 'end' })}`),
  },
  'guitar-right': {
    1: panel(`${[0, 1, 2, 3, 4, 5].map(i => `<line x1="14" x2="258" y1="${64 + i * 22}" y2="${64 + i * 22}" stroke="${i < 3 ? '#8A6A3A' : '#B9B9B9'}" stroke-width="${4.2 - i * 0.6}"/>`).join('')}
      ${forearm(270, 0, 220, 20, 30)}
      <path d="M140 10 C150 0 214 0 226 14 C232 30 224 48 210 54 L156 56 C140 50 134 26 140 10 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${finger([[150, 40], [136, 66], [126, 88], [122, 104]], { w: 16, nail: -1 })}
      ${finger([[176, 52], [176, 92], [178, 124], [178, 148]], { w: 14, nail: 1 })}${finger([[196, 52], [198, 98], [196, 140], [194, 170]], { w: 14, nail: 1 })}
      ${finger([[214, 48], [222, 80], [224, 104], [222, 122]], { w: 12, nail: 1 })}
      ${touch(122, 108, 9, C.pants)}${touch(178, 152, 9)}${touch(194, 174, 9)}
      ${label(96, 30, 'p', { color: C.pants, size: 22 })}${label(184, 214, 'i', { size: 20 })}${label(208, 214, 'm', { size: 20 })}
      ${label(14, 222, L('pulgar: 3 graves', 'thumb: 3 bass strings'), { color: C.pants, size: 12 })}${label(262, 30, L('i-m: agudas', 'i-m: trebles'), { anchor: 'end', size: 12 })}`),
    2: panel(`<line x1="14" x2="258" y1="140" y2="140" stroke="${C.ink}" stroke-width="3"/>
      ${forearm(10, 20, 50, 40, 26)}${finger([[50, 40], [86, 70], [104, 104], [114, 134]], { w: 17, nail: 1 })}${touch(115, 138, 9)}
      ${arrow('M126 152 C140 178 170 184 196 172')}${label(264, 206, L('hacia la palma', 'towards the palm'), { size: 13, anchor: 'end' })}
      ${touch(86, 70, 10)}${label(100, 54, L('se mueve desde el nudillo', 'moves from the knuckle'), { size: 12 })}`),
  },

  // ---------- Viento madera ----------
  'woodwind-hold': {
    0: panel(`<rect x="112" y="10" width="40" height="214" rx="6" fill="${W.black}"/>${[40, 70, 100].map(y => `<circle cx="132" cy="${y}" r="7" fill="#3A4252" stroke="${W.silver}" stroke-width="2"/>`).join('')}
      <path d="M112 140 L92 140 L92 154 L112 154" fill="${W.silver}" stroke="${W.silverDark}" stroke-width="1.5"/>
      ${forearm(10, 230, 50, 190, 30)}${finger([[50, 190], [66, 176], [80, 166], [96, 160]], { w: 18, nail: 1 })}${touch(98, 158, 10)}
      ${arrow('M40 110 L88 146')}${label(16, 100, L('apoyapulgar', 'thumb rest'), { size: 13 })}
      ${label(166, 156, L('entre la uña y', 'between the nail'), { color: C.ink, size: 11 })}${label(166, 170, L('la 1.ª articulación', 'and the 1st joint'), { color: C.ink, size: 11 })}`),
    1: panel(`<rect x="20" y="150" width="232" height="30" rx="8" fill="${W.black}"/>${[70, 135, 200].map(x => `<circle cx="${x}" cy="165" r="9" fill="#3A4252"/>`).join('')}
      <circle cx="135" cy="104" r="40" fill="none" stroke="${C.green}" stroke-width="2" stroke-dasharray="5 5"/>
      <path d="M30 40 C60 22 210 22 240 40 L240 64 C200 52 70 52 30 64 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${[[58, 70], [123, 135], [188, 200]].map(([x0, x]) => finger([[x0 - 6, 58], [x0 - 10, 96], [x - 10, 130], [x, 152]], { w: 15, nail: -1 })).join('')}
      ${[70, 135, 200].map(x => touch(x, 156, 9)).join('')}
      ${label(135, 108, L('pelota', 'ball'), { color: C.green, anchor: 'middle', size: 12 })}${ok(240, 200)}${label(135, 214, L('yemas planas sobre los agujeros', 'flat pads on the holes'), { color: C.ink, anchor: 'middle', size: 12 })}`),
  },
  'recorder-holes': {
    0: panel(`<path d="M126 10 L144 10 L146 40 L145 206 L151 220 L119 220 L125 206 L124 40 Z" fill="${W.recorder}" stroke="${W.recorderDark}" stroke-width="1.5"/>
      ${[0.3, 0.4, 0.5, 0.62, 0.72, 0.82, 0.91].map(f => `<circle cx="135" cy="${10 + 196 * f}" r="3.6" fill="#2A2F38"/>`).join('')}
      ${[0.3, 0.4, 0.5].map(f => finger([[200, 10 + 196 * f - 30], [176, 10 + 196 * f - 14], [154, 10 + 196 * f - 4], [138, 10 + 196 * f]], { w: 13, nail: 1 })).join('')}
      ${[0.62, 0.72, 0.82, 0.91].map(f => finger([[70, 10 + 196 * f - 28], [94, 10 + 196 * f - 12], [116, 10 + 196 * f - 4], [132, 10 + 196 * f]], { w: 12, nail: -1 })).join('')}
      ${label(266, 30, L('mano izquierda', 'left hand'), { anchor: 'end', size: 13 })}${label(266, 44, L('arriba', 'on top'), { anchor: 'end', size: 12 })}
      ${label(6, 150, L('mano derecha', 'right hand'), { color: C.pants, size: 13 })}${label(6, 164, L('abajo', 'below'), { color: C.pants, size: 12 })}`),
    1: panel(`${[[70, true], [200, false]].map(([x, good]) => `<rect x="${x - 50}" y="150" width="100" height="22" rx="8" fill="${W.recorder}" stroke="${W.recorderDark}"/><circle cx="${x}" cy="158" r="5" fill="#2A2F38"/>
      ${good ? finger([[x - 60, 70], [x - 34, 104], [x - 14, 132], [x + 2, 150]], { w: 18, nail: -1 }) : finger([[x - 20, 52], [x - 12, 92], [x - 4, 124], [x - 2, 152]], { w: 15, nail: 1 })}
      ${good ? ok(x, 206) : bad(x, 206)}`).join('')}
      ${label(70, 36, L('yema plana', 'flat pad'), { anchor: 'middle', size: 13 })}${label(200, 36, L('punta', 'tip'), { color: C.red, anchor: 'middle', size: 13 })}
      ${label(70, 228, L('queda el círculo marcado', 'it leaves a ring mark'), { color: C.ink, anchor: 'middle', size: 10 })}`),
    2: panel(`<rect x="100" y="20" width="70" height="200" rx="18" fill="${W.recorder}" stroke="${W.recorderDark}" stroke-width="1.5"/><circle cx="135" cy="104" r="12" fill="#2A2F38"/>
      ${finger([[140, 230], [134, 170], [130, 134], [136, 112]], { w: 22, nail: -1 })}
      <path d="M124 98 A12 12 0 0 1 146 98" fill="none" stroke="${C.green}" stroke-width="3"/>
      ${arrow('M210 80 L150 98')}${label(266, 70, L('rendija', 'small gap'), { anchor: 'end', size: 13 })}${label(266, 130, L('pulgar doblado,', 'thumb bent,'), { color: C.ink, anchor: 'end', size: 11 })}${label(266, 144, L('visto desde atrás', 'seen from behind'), { color: C.ink, anchor: 'end', size: 11 })}`),
  },

  // ---------- Metales ----------
  'horn-hand': {
    0: panel(`${handBack(90, 110, { s: 1.25, thumb: 'left' })}
      ${label(90, 30, L('dedos juntos y rectos', 'fingers together, straight'), { anchor: 'middle', size: 12 })}
      <path d="M176 120 C176 150 200 170 230 170 C252 170 262 150 262 120" fill="none" stroke="${LINE}" stroke-width="12" stroke-linecap="round"/>
      <path d="M176 120 C176 150 200 170 230 170 C252 170 262 150 262 120" fill="none" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>
      ${label(219, 100, L('de lado:', 'side view:'), { color: C.ink, anchor: 'middle', size: 11, weight: 600 })}${label(212, 200, L('como una cuchara', 'like a spoon'), { anchor: 'middle', size: 12 })}`),
    1: panel(`<circle cx="125" cy="115" r="96" fill="${W.brass}" stroke="${W.brassDark}" stroke-width="3"/><circle cx="125" cy="115" r="74" fill="${W.inside}"/>
      <g transform="translate(184 115) rotate(-90)">${handBack(0, 0, { s: 0.75, thumb: null }).replace('<g transform="translate(0 0) rotate(0) scale(0.75)">', '<g transform="scale(.75)">')}</g>
      ${forearm(270, 115, 236, 115, 28)}
      ${label(262, 30, L('a las 3 en punto', 'at 3 o\'clock'), { anchor: 'end', size: 12 })}${arrow('M232 40 L200 80')}`),
  },
  'trombone-slide': {
    0: panel(`<rect x="10" y="96" width="250" height="9" rx="4" fill="${W.brass}" stroke="${W.brassDark}"/><rect x="10" y="134" width="250" height="9" rx="4" fill="${W.brass}" stroke="${W.brassDark}"/>
      <rect x="150" y="96" width="10" height="47" fill="${W.brassDark}"/>
      ${forearm(110, 230, 132, 180, 26)}
      ${finger([[132, 180], [140, 160], [146, 140], [150, 124]], { w: 15, nail: 1 })}
      ${finger([[140, 182], [158, 166], [166, 146], [162, 124]], { w: 13, nail: -1 })}${finger([[146, 186], [168, 176], [176, 160], [174, 142]], { w: 13, nail: -1 })}
      ${touch(155, 120, 10)}
      ${label(135, 40, L('como un lápiz', 'like a pencil'), { anchor: 'middle', size: 14 })}${label(135, 58, L('pulgar, índice y medio', 'thumb, index and middle'), { color: C.ink, anchor: 'middle', size: 12 })}${ok(236, 196)}`),
  },
  'brass-posture': {
    1: panel(`<g transform="translate(4 130) scale(1.25)">
        <path d="M14 0 L130 0" stroke="${W.brass}" stroke-width="6" stroke-linecap="round"/>
        <path d="M130 -1 C150 -1 162 -6 178 -13 L204 -26 L204 26 L178 13 C162 6 150 3 130 3 Z" fill="${W.brass}" stroke="${W.brassDark}" stroke-width="1.5"/>
        <path d="M40 22 C30 22 30 0 40 0 M40 22 L120 22" fill="none" stroke="${W.brass}" stroke-width="6" stroke-linecap="round"/>
        ${[66, 82, 98].map(vx => `<rect x="${vx - 5}" y="-8" width="10" height="38" rx="2" fill="${W.brass}" stroke="${W.brassDark}" stroke-width="1.2"/><rect x="${vx - 3}" y="-16" width="6" height="8" fill="${W.silver}"/><ellipse cx="${vx}" cy="-17" rx="5" ry="2.5" fill="#F0CF7A" stroke="${W.brassDark}"/>`).join('')}</g>
      <path d="M78 186 C70 168 76 156 92 154 L134 154 C150 156 152 172 144 186 C130 200 92 200 78 186 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${forearm(60, 232, 86, 196, 26)}${finger([[86, 158], [80, 144], [84, 132], [96, 128]], { w: 13, nail: 1 })}
      ${[86, 106, 126].map((vx, i) => finger([[150 + i * 16, 40], [vx + 30 + i * 6, 58], [vx + 14, 82], [vx + 6, 106]], { w: 13, nail: -1 })).join('')}
      ${forearm(250, 20, 196, 40, 28)}
      ${[86, 106, 126].map(vx => touch(vx + 6, 108, 7)).join('')}
      ${label(10, 222, L('la izquierda sostiene', 'left hand holds'), { size: 12 })}${arrow('M66 206 L90 186')}
      ${label(262, 84, L('la derecha: yemas', 'right hand: fingertips'), { size: 12, anchor: 'end' })}${label(262, 98, L('sobre los pistones', 'on the valves'), { size: 12, anchor: 'end' })}`),
  },

  // ---------- Piano, cajón y baquetas ----------
  'piano-hand': {
    1: panel(`${[[70, true], [200, false]].map(([x, good]) => `<rect x="${x - 56}" y="150" width="112" height="40" fill="${W.key}" stroke="${W.keyLine}" stroke-width="2"/>
      ${good ? finger([[x - 56, 60], [x - 24, 66], [x - 2, 104], [x + 4, 148]], { w: 17, nail: 1 }) : finger([[x - 56, 120], [x - 24, 132], [x + 10, 142], [x + 44, 146]], { w: 17, nail: 1 })}
      ${good ? touch(x + 4, 150, 9) : ''}${good ? ok(x, 214) : bad(x, 214)}`).join('')}
      ${label(70, 36, L('curvo, en la yema', 'curved, on the pad'), { anchor: 'middle', size: 12 })}${label(200, 36, L('dedo plano', 'flat finger'), { color: C.red, anchor: 'middle', size: 12 })}`),
    2: panel(`${Array.from({ length: 7 }, (_, i) => `<rect x="${16 + i * 34}" y="110" width="34" height="110" fill="${W.key}" stroke="${W.keyLine}" stroke-width="1.5"/>`).join('')}
      ${[0, 1, 3, 4, 5].map(i => `<rect x="${16 + (i + 1) * 34 - 10}" y="110" width="20" height="66" fill="#1A1A1A"/>`).join('')}
      <path d="M40 30 C40 14 200 14 202 30 L200 84 C160 92 80 92 44 84 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${finger([[48, 70], [38, 96], [34, 120], [33, 140]], { w: 17, nail: -1 })}
      ${[67, 101, 135].map(x => finger([[x, 86], [x - 2, 110], [x - 1, 132], [x, 156]], { w: 16, nail: 1 })).join('')}
      ${finger([[170, 84], [170, 104], [170, 122], [169, 140]], { w: 14, nail: 1 })}
      ${[[33, 142], [67, 158], [101, 158], [135, 158], [169, 142]].map(([x, y]) => touch(x, y, 8)).join('')}
      ${[33, 67, 101, 135, 169].map((cx, i) => label(cx, 214, String(i + 1), { color: C.ink, anchor: 'middle', size: 16 })).join('')}
      ${label(135, 22, L('un dedo sobre cada tecla', 'one finger over each key'), { anchor: 'middle', size: 12 })}`),
  },
  'cajon-strokes': {
    1: panel(`<rect x="60" y="20" width="150" height="200" rx="8" fill="${W.wood}" stroke="${W.woodDark}" stroke-width="3"/><rect x="66" y="26" width="138" height="188" rx="6" fill="${W.plate}"/>
      <circle cx="135" cy="96" r="38" fill="${C.green}" opacity=".2"/>
      ${handBack(135, 92, { s: 0.95, thumb: 'left', spread: 3 })}${forearm(135, 230, 135, 150, 30)}
      ${label(135, 210, L('grave: palma, cerca del centro', 'bass: palm, near the centre'), { anchor: 'middle', size: 12, color: C.ink })}`),
    2: panel(`<rect x="60" y="20" width="150" height="200" rx="8" fill="${W.wood}" stroke="${W.woodDark}" stroke-width="3"/><rect x="66" y="26" width="138" height="188" rx="6" fill="${W.plate}"/>
      <rect x="68" y="28" width="44" height="30" rx="6" fill="${C.accent}" opacity=".3"/><rect x="158" y="28" width="44" height="30" rx="6" fill="${C.accent}" opacity=".3"/>
      ${handBack(180, 80, { s: 0.85, thumb: 'left' })}${forearm(180, 230, 180, 136, 28)}
      ${label(135, 210, L('agudo: dedos juntos en el borde', 'slap: fingers at the top edge'), { anchor: 'middle', size: 12, color: C.ink })}`),
  },
  'stick-grip': {
    0: panel(`<line x1="20" y1="170" x2="252" y2="70" stroke="${W.stickWood}" stroke-width="10" stroke-linecap="round"/><line x1="20" y1="170" x2="252" y2="70" stroke="#B9965A" stroke-width="1"/>
      ${forearm(-6, 230, 60, 178, 30)}
      <path d="M60 160 C70 146 96 140 110 146 C118 156 112 176 96 184 C80 190 62 184 60 160 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${finger([[70, 150], [86, 132], [100, 126], [112, 130]], { w: 14, nail: 1 })}${finger([[96, 182], [114, 168], [118, 152], [110, 140]], { w: 13, nail: -1 })}
      ${touch(106, 140, 13)}
      ${label(170, 186, L('pinza suave:', 'gentle pinch:'), { size: 12 })}${label(170, 200, L('pulgar e índice', 'thumb and index'), { size: 12 })}${label(170, 214, L('a ⅓ del final', 'a third from the end'), { size: 12 })}`),
    1: panel(`<line x1="16" y1="120" x2="256" y2="120" stroke="${W.stickWood}" stroke-width="10" stroke-linecap="round"/>
      <path d="M60 60 C80 50 170 50 196 62 L196 86 C170 78 80 78 60 86 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${[0, 1, 2].map(i => finger([[96 + i * 30, 82], [92 + i * 30, 112], [100 + i * 30, 134], [114 + i * 30, 138]], { w: 14, nail: -1 })).join('')}
      ${label(135, 40, L('los demás rodean sin apretar', 'the rest wrap without squeezing'), { anchor: 'middle', size: 12 })}${label(135, 182, L('hay aire entre la mano y la baqueta', 'air between hand and stick'), { color: C.ink, anchor: 'middle', size: 11 })}${ok(236, 206)}`),
  },
};
