// Ilustraciones propias del ukelele: pisar en un mástil de cuatro cuerdas (con el Sol agudo) y la mano derecha
// (rasgueo con el índice donde acaba el mástil, muñeca suelta y punteo con un dedo por cuerda).
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad } from './tips-art-kit.js';
import { finger, forearm, touch } from './tips-art-hands.js';

const U = { board: '#3A2616', fret: '#C9D0DA', nylon: '#F2EEE6', body: '#E2B26E', edge: '#8A5A26', hole: '#2A1A0E', neck: '#6B4423' };
const SKIN = C.skin;
const LINE = C.skinLine;
// De arriba abajo, como ves las cuerdas al mirar hacia abajo: 4.ª Sol, 3.ª Do (la más gruesa), 2.ª Mi, 1.ª La
const STRINGS = [[4, L('Sol', 'G'), 1.6], [3, L('Do', 'C'), 2.6], [2, L('Mi', 'E'), 2], [1, L('La', 'A'), 1.4]];

export const UKE_ART = {
  'uke-fretting': [
    // 1. Junto al traste (bien) frente a en medio de la casilla (mal), en un mástil de cuatro cuerdas
    panel(`<rect x="10" y="84" width="250" height="68" fill="${U.board}"/>${[70, 180].map(x => `<rect x="${x}" y="84" width="6" height="68" fill="${U.fret}"/>`).join('')}
      ${STRINGS.map(([n, name, w], i) => `<line x1="10" x2="260" y1="${96 + i * 15}" y2="${96 + i * 15}" stroke="${U.nylon}" stroke-width="${w}"/>${label(258, 100 + i * 15, `${n}`, { color: '#fff', anchor: 'end', size: 10 })}`).join('')}
      ${finger([[150, 10], [154, 44], [162, 76], [168, 108]], { w: 17, nail: 1 })}${touch(169, 111, 10)}${ok(168, 196)}
      ${finger([[96, 10], [102, 48], [114, 88], [124, 122]], { w: 17, nail: 1 })}${touch(125, 125, 10, C.red)}${bad(118, 196)}
      ${label(178, 222, L('junto al traste', 'next to the fret'), { anchor: 'middle', size: 12 })}${label(76, 222, L('en medio', 'in the middle'), { color: C.red, anchor: 'middle', size: 12 })}`),
    null, // 2. con la punta: la misma viñeta que la guitarra (se rellena en tips-art.js)
    // 3. Corte del mástil: cuatro cuerdas, pulgar detrás frente al dedo medio, sin apretar
    panel(`<path d="M88 96 L182 96 L182 106 C182 140 162 156 135 156 C108 156 88 140 88 106 Z" fill="${U.neck}" stroke="#3E2612" stroke-width="2"/>
      <rect x="84" y="86" width="102" height="12" rx="3" fill="${U.board}"/>${[102, 122, 148, 168].map(x => `<circle cx="${x}" cy="84" r="2.6" fill="#DDD"/>`).join('')}
      <path d="M100 230 C110 206 160 200 196 210 C214 216 222 226 224 230 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${finger([[130, 222], [132, 200], [134, 184], [135, 164]], { w: 20, nail: 0 })}${touch(135, 164, 10)}
      ${finger([[206, 214], [232, 160], [222, 96], [196, 66]], { w: 15, nail: 1 })}${finger([[196, 66], [178, 58], [166, 64], [160, 78]], { w: 14, nail: 1 })}
      ${label(14, 150, L('pulgar detrás,', 'thumb behind,'), { size: 12 })}${label(14, 164, L('frente al dedo', 'opposite the'), { size: 12 })}${label(14, 178, L('medio', 'middle finger'), { size: 12 })}${arrow('M84 176 L120 170')}
      ${bad(244, 30)}${label(230, 56, L('sin apretar', 'no squeezing'), { color: C.red, size: 11, anchor: 'end' })}`),
  ],

  'uke-right': [
    // 1. El índice rasguea donde el mástil se une al cuerpo: abajo con la uña, arriba con la yema
    panel(`<ellipse cx="70" cy="140" rx="72" ry="58" fill="${U.body}" stroke="${U.edge}" stroke-width="2.5"/><circle cx="70" cy="132" r="18" fill="${U.hole}"/>
      <rect x="132" y="112" width="140" height="40" fill="${U.board}"/>${STRINGS.map(([, , w], i) => `<line x1="20" x2="270" y1="${118 + i * 9}" y2="${118 + i * 9}" stroke="${U.nylon}" stroke-width="${w * 0.7}"/>`).join('')}
      <rect x="128" y="104" width="34" height="56" rx="6" fill="${C.green}" opacity=".18"/>
      ${forearm(240, 0, 186, 46, 28)}<path d="M150 70 C150 52 166 40 184 42 C200 44 206 58 200 74 L186 86 L158 86 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2.2"/>
      ${finger([[160, 80], [152, 96], [148, 108], [146, 122]], { w: 13, nail: 1 })}
      ${arrow('M118 60 L118 104')}${arrow('M104 190 L104 150')}
      ${label(118, 50, L('abajo: uña', 'down: nail'), { anchor: 'middle', size: 12 })}${label(104, 210, L('arriba: yema', 'up: pad'), { anchor: 'middle', size: 12 })}
      ${label(266, 196, L('donde acaba', 'where the'), { anchor: 'end', size: 11 })}${label(266, 210, L('el mástil', 'neck ends'), { anchor: 'end', size: 11 })}`),
    // 2. La muñeca suelta: la mano bascula, el antebrazo casi quieto
    panel(`${forearm(20, 150, 130, 120, 30)}
      ${[-24, 0, 24].map((a, i) => `<g transform="rotate(${a} 130 120)" opacity="${i === 1 ? 1 : 0.35}"><path d="M128 104 C150 98 176 104 186 116 C190 126 182 136 168 138 L134 136 Z" fill="${SKIN}" stroke="${LINE}" stroke-width="2"/>${finger([[176, 126], [192, 130], [204, 136], [212, 142]], { w: 12, nail: -1 })}</g>`).join('')}
      <path d="M214 62 A90 90 0 0 1 214 182" fill="none" stroke="${C.green}" stroke-width="3" stroke-dasharray="6 5"/>${arrow('M222 160 L218 180')}${arrow('M222 84 L218 64')}
      ${label(20, 40, L('la mano bascula', 'the hand swings'), { size: 12 })}${label(20, 54, L('desde la muñeca', 'from the wrist'), { size: 12 })}
      ${label(20, 200, L('el antebrazo, casi quieto', 'the forearm barely moves'), { size: 12 })}${ok(240, 30)}`),
    // 3. Punteo: cada dedo en su cuerda (p en la 4.ª Sol, i en la 3.ª Do, m en la 2.ª Mi, a en la 1.ª La)
    panel(`${STRINGS.map(([n, name, w], i) => `<line x1="14" x2="258" y1="${70 + i * 34}" y2="${70 + i * 34}" stroke="#B9B2A4" stroke-width="${w * 1.4}"/>${label(14, 64 + i * 34, `${n}.ª ${name}`, { color: C.ink, size: 11 })}`).join('')}
      ${[['p', 70, C.pants], ['i', 104, C.green], ['m', 138, C.green], ['a', 172, C.green]].map(([f, y, col], i) => `${touch(150 + i * 26, y, 9, col)}${label(150 + i * 26, y - 14, f, { color: col, anchor: 'middle', size: 16 })}`).join('')}
      ${label(266, 222, L('un dedo por cuerda', 'one finger per string'), { anchor: 'end', size: 12 })}`),
  ],
};
