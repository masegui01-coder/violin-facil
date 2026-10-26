// Ilustraciones de piano, cajón y percusión: sentarse a la altura de las teclas, la mano redonda sobre cinco teclas,
// los dos sonidos del cajón y el agarre con rebote de la baqueta.
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad, dashed } from './tips-art-kit.js';
import { SKIN, SKIN_LINE, limb, arm, shoulderSitting, shoulderStanding, sittingSide, standingSide } from './tips-art-people.js';

const P = { case: '#23262E', key: '#FFFFFF', keyLine: '#9AA3B2', black: '#1A1A1A', wood: '#D9A066', woodDark: '#8A5A26', plate: '#E8C38A', stick: '#E3C58E', drum: '#C9D0DA', drumDark: '#8A93A3' };

// Piano de lado: el teclado sale hacia la izquierda en (kx, ky)
const piano = (kx = 150, ky = 118) => `<rect x="${kx + 24}" y="40" width="${270 - kx - 24}" height="170" fill="${P.case}"/>
  <rect x="${kx}" y="${ky}" width="40" height="12" fill="${P.key}" stroke="${P.keyLine}"/><rect x="${kx + 14}" y="${ky - 6}" width="26" height="6" fill="${P.black}"/>
  <rect x="${kx + 30}" y="${ky + 12}" width="10" height="40" fill="${P.case}"/><path d="M${kx + 36} 210 L${kx + 54} 210" stroke="#C9A43C" stroke-width="5" stroke-linecap="round"/>`;
const bench = (x1, x2, y = 150) => `<rect x="${x1}" y="${y + 6}" width="${x2 - x1}" height="10" rx="3" fill="${P.woodDark}"/><path d="M${x1 + 6} ${y + 16} L${x1 + 6} 214 M${x2 - 6} ${y + 16} L${x2 - 6} 214" stroke="${P.woodDark}" stroke-width="6"/>`;
// Pianista sentado de perfil con el antebrazo a la altura de las teclas
function pianist(x, { lean = 0 } = {}) {
  const s = shoulderSitting(x);
  return `${sittingSide(x, { chair: false, lean })}${arm([s[0] - 6, s[1] + 2], [s[0] + 10, 116], [150, 114], { far: true })}${arm(s, [s[0] + 14, 120], [156, 118])}`;
}
// Teclado visto desde arriba: n teclas blancas desde (x, y)
const keysTop = (x, y, n, w = 34, h = 110) => Array.from({ length: n }, (_, i) => `<rect x="${x + i * w}" y="${y}" width="${w}" height="${h}" fill="${P.key}" stroke="${P.keyLine}" stroke-width="1.5"/>`).join('')
  + [0, 1, 3, 4, 5].filter(i => i < n - 1).map(i => `<rect x="${x + (i + 1) * w - 10}" y="${y}" width="20" height="${h * 0.6}" fill="${P.black}"/>`).join('');

export const KEYS_ART = {
  // ---- Piano: sentarse ----
  'piano-posture': [
    panel(`${piano()}${bench(10, 92)}${pianist(30)}${dashed('M78 116 L150 116')}${label(40, 24, L('antebrazo a la altura', 'forearm level'), { size: 12 })}${label(40, 38, L('de las teclas', 'with the keys'), { size: 12 })}${ok(130, 196)}`),
    panel(`${piano()}${bench(4, 104)}<rect x="54" y="152" width="50" height="8" fill="${C.green}" opacity=".45"/>${pianist(36)}
      ${label(40, 24, L('en la mitad delantera', 'on the front half'), { size: 12 })}${label(40, 38, L('del banco', 'of the bench'), { size: 12 })}${arrow('M30 196 L60 162')}
      ${label(262, 66, L('codos un poco', 'elbows slightly'), { size: 12, anchor: 'end', color: '#fff' })}${label(262, 80, L('por delante', 'forward'), { size: 12, anchor: 'end', color: '#fff' })}`),
    panel(`${piano()}${bench(10, 92)}${pianist(30)}${dashed('M42 20 L42 150')}
      <circle cx="${30 + 24 + 64}" cy="212" r="12" fill="none" stroke="${C.green}" stroke-width="3"/>${arrow('M150 192 L184 206')}
      ${label(56, 24, L('espalda recta', 'straight back'), { size: 12 })}${label(140, 176, L('pie derecho', 'right foot'), { size: 11, anchor: 'end' })}${label(262, 196, L('pedal', 'pedal'), { size: 12, anchor: 'end', color: '#fff' })}`),
  ],

  // ---- Piano: la mano ----
  'piano-hand': [
    panel(`${standingSide(80)}${arm(shoulderStanding(80), [86, 130], [92, 176], { hand: false })}
      <path d="M86 176 C82 190 88 204 100 208 C110 210 114 200 108 192 C104 186 104 180 100 176 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      <circle cx="104" cy="196" r="28" fill="none" stroke="${C.green}" stroke-width="2" stroke-dasharray="5 4"/>
      ${label(262, 150, L('deja caer el brazo:', 'let the arm hang:'), { size: 12, anchor: 'end' })}${label(262, 166, L('esa forma redonda', 'that round shape'), { size: 12, anchor: 'end' })}${label(262, 182, L('es la buena', 'is the right one'), { size: 12, anchor: 'end' })}`),
    panel(`${[[70, true], [200, false]].map(([x, good]) => `<rect x="${x - 56}" y="150" width="112" height="40" fill="${P.key}" stroke="${P.keyLine}" stroke-width="2"/>
      ${good ? limb(`M${x - 50} 60 C${x - 20} 60 ${x + 2} 100 ${x + 4} 148`, 16) : limb(`M${x - 56} 120 C${x - 20} 132 ${x + 10} 142 ${x + 40} 146`, 16)}
      ${good ? ok(x, 214) : bad(x, 214)}`).join('')}
      ${label(70, 36, L('dedo curvo, en la yema', 'curved, on the pad'), { anchor: 'middle', size: 12 })}${label(200, 36, L('dedo plano', 'flat finger'), { color: C.red, anchor: 'middle', size: 12 })}`),
    panel(`${keysTop(16, 110, 7)}
      <path d="M40 30 L196 30 L196 80 C196 92 186 98 176 98 L60 98 C48 98 40 90 40 80 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${[33, 67, 101, 135, 169].map((cx, i) => `${limb(`M${cx} ${i === 0 ? 92 : 94} L${cx} ${i === 0 ? 150 : 160}`, i === 0 ? 16 : 14)}${label(cx, 214, String(i + 1), { color: C.ink, anchor: 'middle', size: 16 })}`).join('')}
      ${label(135, 22, L('un dedo sobre cada tecla', 'one finger over each key'), { anchor: 'middle', size: 12 })}`),
  ],

  // ---- Cajón ----
  'cajon-strokes': [
    panel(`<rect x="44" y="140" width="76" height="74" rx="4" fill="${P.wood}" stroke="${P.woodDark}" stroke-width="2.5"/>
      ${sittingSide(36, { chair: false, seatY: 140, lean: 12 })}${arm(shoulderSitting(36, 140), [88, 104], [124, 150])}
      ${label(262, 30, L('sentado en el borde', 'on the front edge'), { size: 12, anchor: 'end' })}${label(262, 44, L('y un poco inclinado', 'leaning slightly'), { size: 12, anchor: 'end' })}${ok(236, 196)}`),
    panel(`<rect x="60" y="20" width="150" height="200" rx="8" fill="${P.wood}" stroke="${P.woodDark}" stroke-width="3"/><rect x="66" y="26" width="138" height="188" rx="6" fill="${P.plate}"/>
      <circle cx="135" cy="104" r="34" fill="${C.green}" opacity=".22"/>
      <path d="M118 150 C112 128 112 104 122 90 L122 66 C122 60 130 60 130 66 L131 88 L133 60 C133 54 141 54 141 60 L141 88 L144 64 C144 58 152 58 152 64 L151 92 L156 74 C156 68 164 68 163 75 L158 104 C156 124 152 140 150 150 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${label(135, 196, L('grave: palma, cerca del centro', 'bass: palm, near the centre'), { anchor: 'middle', size: 12 })}`),
    panel(`<rect x="60" y="20" width="150" height="200" rx="8" fill="${P.wood}" stroke="${P.woodDark}" stroke-width="3"/><rect x="66" y="26" width="138" height="188" rx="6" fill="${P.plate}"/>
      <rect x="68" y="28" width="44" height="30" rx="6" fill="${C.accent}" opacity=".35"/><rect x="158" y="28" width="44" height="30" rx="6" fill="${C.accent}" opacity=".35"/>
      ${[0, 1, 2, 3].map(i => limb(`M${162 + i * 9} 110 L${166 + i * 9} 44`, 8)).join('')}<path d="M156 110 L204 110 L198 150 L160 150 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
      ${label(135, 196, L('agudo: dedos juntos en el borde', 'slap: fingers at the top edge'), { anchor: 'middle', size: 12 })}`),
  ],

  // ---- Percusión: agarre y rebote ----
  'stick-grip': [
    panel(`<line x1="20" y1="170" x2="252" y2="70" stroke="${P.stick}" stroke-width="10" stroke-linecap="round"/><line x1="20" y1="170" x2="252" y2="70" stroke="#B9965A" stroke-width="1"/>
      ${limb('M30 230 C50 200 72 176 86 158', 24)}${limb('M86 150 C92 138 104 132 112 136', 12)}${limb('M84 160 C96 168 110 164 112 146', 12)}
      <circle cx="104" cy="142" r="15" fill="none" stroke="${C.green}" stroke-width="3"/>
      ${label(170, 186, L('pinza suave:', 'gentle pinch:'), { size: 12 })}${label(170, 200, L('pulgar e índice', 'thumb and index'), { size: 12 })}${label(170, 214, L('a ⅓ del final', 'a third from the end'), { size: 12 })}`),
    panel(`<line x1="16" y1="120" x2="256" y2="120" stroke="${P.stick}" stroke-width="10" stroke-linecap="round"/>
      ${limb('M84 70 C74 92 76 112 86 120', 12)}${[0, 1, 2].map(i => limb(`M${106 + i * 18} 76 C${100 + i * 18} 104 ${104 + i * 18} 130 ${116 + i * 18} 136`, 11)).join('')}
      ${label(135, 40, L('los demás rodean sin apretar', 'the rest wrap without squeezing'), { anchor: 'middle', size: 12 })}${ok(236, 196)}`),
    panel(`${standingSide(60)}<ellipse cx="170" cy="150" rx="56" ry="12" fill="${P.drum}" stroke="${P.drumDark}" stroke-width="2"/><rect x="114" y="150" width="112" height="30" fill="${P.drum}" stroke="${P.drumDark}"/><ellipse cx="170" cy="180" rx="56" ry="12" fill="${P.drumDark}" opacity=".6"/>
      ${arm(shoulderStanding(60), [76, 118], [116, 112])}<line x1="116" y1="112" x2="168" y2="146" stroke="${P.stick}" stroke-width="6" stroke-linecap="round"/>
      ${arrow('M184 140 C214 110 214 80 190 64')}${label(264, 62, L('rebota sola', 'bounces back'), { size: 12, anchor: 'end' })}
      ${dashed('M100 146 L240 146')}${label(264, 214, L('caja a la altura del cinturón', 'snare at belt height'), { size: 11, anchor: 'end' })}`),
  ],
};
