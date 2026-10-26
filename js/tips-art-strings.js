// Ilustraciones de guitarra y ukelele: la postura sentada de frente (con el reposapiés y los cuatro apoyos),
// cómo pisar junto al traste, el pulgar detrás del mástil, la mano derecha y dónde rasguear el ukelele.
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad, dashed } from './tips-art-kit.js';
import { SKIN, SKIN_LINE, PANTS, SHOE, limb, arm, frontPerson, shouldersFront } from './tips-art-people.js';

const G = { top: '#E2B26E', edge: '#8A5A26', neck: '#6B4423', board: '#3A2616', fret: '#C9D0DA', string: '#EDEDED', hole: '#2A1A0E' };

// Guitarra de frente: cuerpo centrado en (x, y), girada rot grados (0 = mástil hacia arriba); size 1 = guitarra, 0.6 ≈ ukelele
function guitar(x, y, rot = 0, s = 1, { frets = 12 } = {}) {
  const body = 'M0 -72 C24 -72 38 -60 38 -42 C38 -28 30 -20 30 -10 C30 0 48 8 48 34 C48 62 28 76 0 76 C-28 76 -48 62 -48 34 C-48 8 -30 0 -30 -10 C-30 -20 -38 -28 -38 -42 C-38 -60 -24 -72 0 -72 Z';
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="${body}" fill="${G.top}" stroke="${G.edge}" stroke-width="2.5"/>
    <circle cx="0" cy="-18" r="15" fill="${G.hole}"/><circle cx="0" cy="-18" r="18" fill="none" stroke="${G.edge}" stroke-width="1.5"/>
    <rect x="-16" y="34" width="32" height="7" rx="2" fill="${G.neck}"/>
    <rect x="-8" y="-196" width="16" height="164" fill="${G.board}"/>
    ${Array.from({ length: frets }, (_, i) => `<line x1="-8" x2="8" y1="${-190 + i * 12.5}" y2="${-190 + i * 12.5}" stroke="${G.fret}" stroke-width="1.5"/>`).join('')}
    <path d="M-10 -196 L10 -196 L12 -228 L-12 -228 Z" fill="${G.neck}"/>
    ${[-5, -3, -1, 1, 3, 5].map(sx => `<line x1="${sx}" y1="-196" x2="${sx}" y2="36" stroke="${G.string}" stroke-width=".9"/>`).join('')}</g>`;
}

// Persona sentada de frente (cabeza en cx, 48). footstool: el pie izquierdo (a la derecha del dibujo) en alto
function seatedFront(cx, { footstool = false } = {}) {
  const lift = footstool ? 16 : 0;
  return `<rect x="${cx - 70}" y="146" width="140" height="14" rx="4" fill="${C.muted}"/>
    <path d="M${cx - 44} 150 L${cx - 44} 196" stroke="${PANTS}" stroke-width="26" stroke-linecap="round"/>
    <path d="M${cx + 40} ${150 - lift} L${cx + 42} ${196 - lift}" stroke="${PANTS}" stroke-width="26" stroke-linecap="round"/>
    <path d="M${cx - 58} 212 L${cx - 30} 212" stroke="${SHOE}" stroke-width="9" stroke-linecap="round"/>
    <path d="M${cx + 28} ${212 - lift} L${cx + 56} ${212 - lift}" stroke="${SHOE}" stroke-width="9" stroke-linecap="round"/>
    ${footstool ? `<rect x="${cx + 18}" y="${216 - lift}" width="48" height="${14 + lift}" rx="3" fill="${C.ink}" opacity=".75"/>` : ''}
    <g>${frontPerson(cx, 48).replace(`${cx + 92} 232 Z`, `${cx + 92} 150 Z`).replace(`M${cx - 92} 232`, `M${cx - 92} 150`)}</g>`;
}
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="${C.green}" stroke="#fff" stroke-width="2"/>`;

// La guitarra en su sitio y los brazos de quien toca (sentado de frente en cx)
function guitarist(cx, { footstool = true, highlight = '' } = {}) {
  const [sR, sL] = shouldersFront(cx, 48); // sR: hombro derecho de quien toca (a la izquierda del dibujo)
  return `${seatedFront(cx, { footstool })}
    ${guitar(cx + 6, 150, 45, 0.72)}
    ${arm(sR, [sR[0] - 6, sR[1] + 40], [cx - 4, 138])}
    ${arm(sL, [sL[0] + 20, sL[1] + 30], [cx + 70, 72])}
    ${highlight}`;
}

export const STRING_ART = {
  // ---- Guitarra: la postura ----
  'guitar-posture': [
    panel(`${guitarist(100, { footstool: false })}${dashed('M100 14 L100 140')}${label(262, 30, L('espalda recta', 'straight back'), { size: 12, anchor: 'end' })}${label(262, 222, L('pies apoyados', 'feet flat'), { size: 12, anchor: 'end' })}${ok(236, 196)}`),
    panel(`${guitarist(100)}
      <path d="M140 180 A70 70 0 0 1 164 130" fill="none" stroke="${C.green}" stroke-width="3"/>${label(170, 172, '45°', { size: 16 })}
      ${arrow('M248 222 L178 214')}${label(262, 200, L('reposapiés', 'footstool'), { size: 12, anchor: 'end' })}`),
    panel(`${guitarist(100, { highlight: `${dot(140, 196)}${dot(84, 176)}${dot(116, 116)}${dot(66, 126)}` })}
      ${label(262, 222, L('pierna izquierda', 'left leg'), { size: 11, anchor: 'end' })}${label(14, 186, L('pierna', 'right'), { size: 11 })}${label(14, 200, L('derecha', 'leg'), { size: 11 })}
      ${label(262, 40, L('pecho', 'chest'), { size: 11, anchor: 'end' })}${arrow('M232 44 L128 112')}${label(14, 30, L('antebrazo', 'forearm'), { size: 11 })}${arrow('M30 36 L60 118')}`),
  ],

  // ---- Pisar las cuerdas (guitarra y ukelele) ----
  fretting: [
    panel(`<rect x="10" y="80" width="250" height="76" fill="${G.board}"/>${[70, 180].map(x => `<rect x="${x}" y="80" width="6" height="76" fill="${G.fret}"/>`).join('')}
      ${[92, 106, 120, 134, 148].map(y => `<line x1="10" x2="260" y1="${y}" y2="${y}" stroke="${G.string}" stroke-width="1.6"/>`).join('')}
      ${limb('M150 20 C156 60 162 94 168 106', 18)}<circle cx="168" cy="106" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>${ok(168, 196)}
      ${limb('M100 20 C108 60 120 112 124 120', 18)}<circle cx="124" cy="120" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2" opacity=".8"/>${bad(118, 196)}
      ${label(168, 222, L('junto al traste', 'next to the fret'), { anchor: 'middle', size: 12 })}${label(76, 222, L('en medio', 'in the middle'), { color: C.red, anchor: 'middle', size: 12 })}`),
    panel(`<rect x="10" y="168" width="250" height="18" fill="${G.board}"/><line x1="10" x2="260" y1="166" y2="166" stroke="#BBB" stroke-width="2.5"/><rect x="176" y="160" width="6" height="26" fill="${G.fret}"/>
      ${limb('M40 30 C90 40 130 80 150 120 C158 138 164 152 166 164', 20)}
      ${arrow('M222 90 L176 150')}${label(262, 76, L('la punta, desde arriba', 'the tip, from above'), { anchor: 'end', size: 12 })}${label(262, 210, L('uñas cortas', 'short nails'), { color: C.ink, anchor: 'end', size: 12 })}`),
    panel(`<path d="M80 96 L190 96 L190 108 C190 148 166 166 135 166 C104 166 80 148 80 108 Z" fill="${G.neck}" stroke="#3E2612" stroke-width="2"/>
      <rect x="76" y="86" width="118" height="12" rx="3" fill="${G.board}"/>${[90, 108, 126, 144, 162, 180].map(x => `<circle cx="${x}" cy="84" r="2.4" fill="#CCC"/>`).join('')}
      ${limb('M135 230 C135 206 135 190 135 178', 22)}<ellipse cx="135" cy="176" rx="12" ry="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${limb('M214 200 C236 150 230 92 206 64 C192 50 172 50 162 64 L156 80', 15)}
      ${label(20, 196, L('pulgar detrás,', 'thumb behind,'), { size: 12 })}${label(20, 210, L('a la altura del', 'opposite the'), { size: 12 })}${label(20, 224, L('dedo medio', 'middle finger'), { size: 12 })}${arrow('M104 196 L124 182')}`),
  ],

  // ---- Guitarra: la mano derecha ----
  'guitar-right': [
    panel(`${guitar(110, 140, -90, 1.15, { frets: 0 })}
      ${limb('M270 40 C236 60 206 80 180 100', 26)}${limb('M180 100 C170 112 160 124 150 132', 20)}
      ${[0, 1, 2].map(i => limb(`M${150 - i * 6} 132 C${142 - i * 8} 140 ${136 - i * 8} 150 ${132 - i * 8} 160`, 9)).join('')}
      ${dashed('M190 60 L250 110')}${label(264, 220, L('antebrazo apoyado en el borde', 'forearm on the edge'), { anchor: 'end', size: 12 })}${label(44, 30, L('mano sobre la boca', 'hand over the soundhole'), { size: 12 })}`),
    panel(`${[0, 1, 2, 3, 4, 5].map(i => `<line x1="14" x2="258" y1="${64 + i * 22}" y2="${64 + i * 22}" stroke="${i < 3 ? '#8A6A3A' : '#B9B9B9'}" stroke-width="${4.2 - i * 0.6}"/>`).join('')}
      ${limb('M30 230 C50 200 70 160 90 120', 22)}<circle cx="94" cy="112" r="10" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${limb('M200 20 C196 70 192 120 190 150', 13)}${limb('M232 20 C230 80 226 140 222 172', 13)}
      ${label(70, 46, 'p', { color: C.pants, size: 22 })}${label(176, 200, 'i', { size: 20 })}${label(228, 200, 'm', { size: 20 })}
      ${label(14, 222, L('pulgar: 3 graves', 'thumb: 3 bass strings'), { color: C.pants, size: 12 })}${label(262, 222, L('i-m: agudas', 'i-m: trebles'), { anchor: 'end', size: 12 })}`),
    panel(`<line x1="14" x2="258" y1="140" y2="140" stroke="${C.ink}" stroke-width="3"/>
      ${limb('M70 30 C90 60 104 100 118 134', 18)}<circle cx="118" cy="136" r="9" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${arrow('M126 152 C140 178 170 184 196 172')}${label(264, 206, L('hacia la palma', 'towards the palm'), { size: 13, anchor: 'end' })}
      <circle cx="70" cy="30" r="9" fill="none" stroke="${C.green}" stroke-width="3"/>${label(84, 24, L('se mueve desde el nudillo', 'moves from the knuckle'), { size: 12 })}`),
  ],

  // ---- Ukelele ----
  'uke-hold': [
    panel(`${frontPerson(100, 48)}${guitar(118, 150, 60, 0.5, { frets: 10 })}
      ${arm(shouldersFront(100, 48)[0], [44, 160], [104, 150])}${arm(shouldersFront(100, 48)[1], [176, 150], [200, 104])}
      ${label(100, 222, L('contra el pecho', 'against the chest'), { color: '#fff', anchor: 'middle', size: 13 })}${ok(236, 30)}`),
    panel(`${frontPerson(100, 48)}${guitar(118, 150, 60, 0.5, { frets: 10 })}
      ${arm(shouldersFront(100, 48)[0], [44, 160], [104, 150])}
      ${arrow('M22 210 L60 176')}${label(14, 226, L('el antebrazo lo sujeta', 'the forearm holds it'), { color: '#fff', size: 13 })}
      ${arrow('M240 120 L240 70')}${label(262, 30, L('mástil un poco', 'neck slightly'), { anchor: 'end', size: 12 })}${label(262, 44, L('hacia arriba', 'upward'), { anchor: 'end', size: 12 })}`),
    panel(`${guitar(84, 120, 90, 1.1, { frets: 10 })}<rect x="160" y="88" width="20" height="64" rx="4" fill="${C.green}" opacity=".25"/>
      ${arrow('M164 40 L164 92')}${arrow('M178 200 L178 150')}${label(150, 30, L('abajo: uña', 'down: nail'), { anchor: 'middle', size: 12 })}${label(184, 222, L('arriba: yema', 'up: pad'), { anchor: 'middle', size: 12 })}
      ${label(40, 210, L('donde el mástil', 'where the neck'), { size: 11 })}${label(40, 224, L('se une al cuerpo', 'joins the body'), { size: 11 })}`),
  ],
};
