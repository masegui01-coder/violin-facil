// Ilustraciones de saxofón, clarinete, oboe y respiración: instrumentos con su forma, personas de pie y sentadas,
// comparaciones bien/mal y notas de referencia en un pentagrama pequeño, para que cada viñeta se entienda sola.
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad, dashed } from './tips-art-kit.js';
import { SKIN, SKIN_LINE, limb, cloth, arm, shoulderStanding, shoulderSitting, profileHead, frontPerson, standingSide, sittingSide } from './tips-art-people.js';

const B = { brass: '#D7A63A', dark: '#9A7020', pearl: '#F3E9C8', black: '#1E2430', silver: '#C3CAD4', reed: '#D9B26A', cork: '#8A3B2A' };

// ---------- Instrumentos ----------
// Saxo alto de lado: la punta de la boquilla en (0, 0) y el instrumento hacia la derecha y abajo
function sax(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 L16 -4 L18 6 L2 6 Z" fill="${B.black}"/>
    <path d="M17 1 C32 2 40 12 42 30" fill="none" stroke="${B.brass}" stroke-width="7" stroke-linecap="round"/>
    <path d="M42 30 C42 80 32 110 32 140" fill="none" stroke="${B.dark}" stroke-width="15" stroke-linecap="round"/>
    <path d="M42 30 C42 80 32 110 32 140" fill="none" stroke="${B.brass}" stroke-width="12" stroke-linecap="round"/>
    <path d="M32 140 C32 172 72 172 72 140" fill="none" stroke="${B.dark}" stroke-width="19" stroke-linecap="round"/>
    <path d="M32 140 C32 172 72 172 72 140" fill="none" stroke="${B.brass}" stroke-width="16" stroke-linecap="round"/>
    <path d="M72 140 L66 98" fill="none" stroke="${B.brass}" stroke-width="22" stroke-linecap="round"/>
    <ellipse cx="66" cy="90" rx="17" ry="6" transform="rotate(-8 66 90)" fill="${B.dark}" stroke="${B.brass}" stroke-width="3"/>
    ${[[40, 58], [39, 72], [37, 86], [35, 104], [34, 120]].map(([kx, ky]) => `<circle cx="${kx}" cy="${ky}" r="4" fill="${B.pearl}" stroke="${B.dark}" stroke-width="1.2"/>`).join('')}
    <circle cx="44" cy="46" r="3" fill="none" stroke="${C.ink}" stroke-width="1.6"/></g>`;
}
// Clarinete (o oboe) recto: la punta en (0, 0), girado ang grados desde la horizontal hacia abajo
function clarinet(x, y, ang, len = 190, { oboe = false } = {}) {
  const keys = Array.from({ length: 6 }, (_, i) => 40 + i * (len - 70) / 5);
  return `<g transform="translate(${x} ${y}) rotate(${ang})">
    ${oboe ? `<path d="M-14 -2 L4 -4 L4 4 L-14 2 Z" fill="${B.reed}"/><rect x="4" y="-4" width="12" height="8" fill="${B.cork}"/>`
      : `<path d="M0 -3 L26 -6 L26 6 L0 3 Z" fill="${B.black}"/><path d="M0 3 L22 5" stroke="${B.reed}" stroke-width="2.5"/><rect x="12" y="-7" width="6" height="14" fill="${B.silver}"/><rect x="26" y="-7" width="14" height="14" rx="2" fill="${B.black}"/>`}
    <path d="M${oboe ? 16 : 40} -6 L${len} -8 L${len} 8 L${oboe ? 16 : 40} 6 Z" fill="${B.black}"/>
    <path d="M${len} -8 C${len + 10} -10 ${len + 22} -18 ${len + 26} -20 L${len + 26} 20 C${len + 22} 18 ${len + 10} 10 ${len} 8 Z" fill="${B.black}"/>
    ${keys.map(k => `<circle cx="${k}" cy="0" r="3" fill="#3A4252" stroke="${B.silver}" stroke-width="1.5"/>`).join('')}
    <rect x="${len * 0.62}" y="6" width="9" height="5" rx="1" fill="${B.silver}"/></g>`;
}
// Boquilla de saxo o clarinete sola (o con barrilete), de lado: punta en (x, y)
const mouthpiece = (x, y, s = 1, { barrel = false } = {}) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M0 -6 L64 -14 L64 14 L0 6 Z" fill="${B.black}"/><path d="M0 6 L56 12" stroke="${B.reed}" stroke-width="4"/>
  <rect x="34" y="-17" width="12" height="34" rx="3" fill="none" stroke="${B.silver}" stroke-width="4"/>
  ${barrel ? `<rect x="64" y="-18" width="44" height="36" rx="6" fill="${B.black}"/><rect x="66" y="-18" width="3" height="36" fill="${B.silver}"/>` : ''}</g>`;
// Sonido que sale (ondas)
const waves = (x, y) => [0, 1, 2].map(i => `<path d="M${x + i * 14} ${y - 14 - i * 4} C${x + 8 + i * 14} ${y - 4} ${x + 8 + i * 14} ${y + 4} ${x + i * 14} ${y + 14 + i * 4}" fill="none" stroke="${C.green}" stroke-width="2.6" stroke-linecap="round"/>`).join('');

// Pentagrama pequeño con notas (paso diatónico respecto a Mi4 = 0: Fa4 = 1, Do5 = 5, La5 = 10, Do6 = 12) y alteración opcional
function miniStaff(x, y, w, notes) {
  const sp = 7;
  const lines = Array.from({ length: 5 }, (_, i) => `<line x1="${x}" y1="${y + i * sp}" x2="${x + w}" y2="${y + i * sp}" stroke="${C.ink}" stroke-width="1"/>`).join('');
  const clef = `<text x="${x + 1}" y="${y + 4 * sp + 6}" font-size="38" font-family="Noto Music, Segoe UI Symbol, serif" fill="${C.ink}">𝄞</text>`;
  const heads = notes.map(({ step, acc, nx }) => {
    const ny = y + 4 * sp - step * sp / 2;
    const led = [];
    for (let s = 10; s <= step; s += 2) led.push(`<line x1="${nx - 9}" y1="${y + 4 * sp - s * sp / 2}" x2="${nx + 9}" y2="${y + 4 * sp - s * sp / 2}" stroke="${C.ink}" stroke-width="1"/>`);
    for (let s = -2; s >= step; s -= 2) led.push(`<line x1="${nx - 9}" y1="${y + 4 * sp - s * sp / 2}" x2="${nx + 9}" y2="${y + 4 * sp - s * sp / 2}" stroke="${C.ink}" stroke-width="1"/>`);
    return `${led.join('')}<ellipse cx="${nx}" cy="${ny}" rx="5" ry="3.8" transform="rotate(-20 ${nx} ${ny})" fill="${C.ink}"/>${acc ? `<text x="${nx - 15}" y="${ny + 4}" font-size="13" fill="${C.ink}" font-family="Noto Music, Segoe UI Symbol, serif">${acc}</text>` : ''}`;
  }).join('');
  return lines + clef + heads;
}
// Afinador: aguja en el centro (bien), a la izquierda (grave = floja) y a la derecha (agudo = muerdes)
function gauge(cx = 135, cy = 170, { left = L('floja', 'loose'), right = L('muerdes', 'biting') } = {}) {
  return `<path d="M${cx - 100} ${cy} A100 100 0 0 1 ${cx + 100} ${cy}" fill="none" stroke="#E2D7CB" stroke-width="20" stroke-linecap="round"/>
    <path d="M${cx - 100} ${cy} A100 100 0 0 1 ${cx - 42} ${cy - 82}" fill="none" stroke="${C.red}" stroke-width="20" stroke-linecap="round" opacity=".55"/>
    <path d="M${cx + 42} ${cy - 82} A100 100 0 0 1 ${cx + 100} ${cy}" fill="none" stroke="${C.red}" stroke-width="20" stroke-linecap="round" opacity=".55"/>
    <path d="M${cx - 25} ${cy - 97} A100 100 0 0 1 ${cx + 25} ${cy - 97}" fill="none" stroke="${C.green}" stroke-width="20"/>
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 84}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="9" fill="${C.ink}"/>
    ${label(cx - 104, cy + 34, `◀ ${left}`, { color: C.red, size: 13 })}${label(cx + 104, cy + 34, `${right} ▶`, { color: C.red, anchor: 'end', size: 13 })}${label(cx, cy - 116, L('bien', 'good'), { anchor: 'middle', size: 13 })}`;
}

// Boca de perfil en corte (como la del labio de abajo del saxo), con caña de doble lengüeta o boquilla
const JAW = `<rect x="40" y="22" width="70" height="210" rx="10" fill="#F4E3D3"/>`;
const tooth = (y1, y2) => `<path d="M110 ${y1} L140 ${y1} L140 ${y2} L110 ${y2} Z" fill="#fff" stroke="#9AA3B2" stroke-width="2.5"/>`;
const rolledUpper = `<path d="M98 100 C98 120 150 124 178 114 C198 104 198 56 178 30 L140 30 L140 88 C128 94 112 94 98 92 Z" fill="${C.lip}"/>`;
const rolledLower = `<path d="M98 138 C98 118 150 114 178 124 C198 134 198 184 178 214 L140 214 L140 150 C128 144 112 144 98 146 Z" fill="${C.lip}"/>`;

// Brazos de quien toca el saxo o el clarinete (de pie, de perfil): hombro en (x, 80)
// (el de detrás va a la mano de arriba y el de delante a la de abajo)
const arms = (x, [top, bottom]) => {
  const s = shoulderStanding(x);
  return arm([s[0] - 6, s[1] + 2], [s[0] + 8, s[1] + 40], top, { far: true }) + arm(s, [s[0] + 4, s[1] + 46], bottom);
};
// Correa del saxo: del cuello al anillo
const strap = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${y1 + 8} ${x2} ${y2}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;

export function reedArt(reedLip) {
  return {
    // ---- Saxofón: postura y arnés ----
    'sax-posture': [
      panel(`${standingSide(96)}${strap(96, 64, 150, 99)}${sax(110, 52, 1)}${arms(98, [[150, 100], [146, 132]])}
        ${dashed('M126 37 L262 37')}${label(262, 28, L('cabeza recta', 'head straight'), { anchor: 'end', size: 13 })}${ok(236, 196)}`),
      panel(`<g transform="translate(-14 26) scale(.78)">${standingSide(96, { tilt: 32 })}${strap(96, 64, 150, 130)}${sax(118, 82, 1)}</g>
        ${bad(30, 30)}${label(52, 26, L('muy largo', 'too long'), { color: C.red, size: 12 })}${label(52, 40, L('bajas la cabeza', 'head goes down'), { color: C.red, size: 11, weight: 600 })}
        <line x1="135" y1="40" x2="135" y2="222" stroke="#E2D7CB" stroke-width="2"/>
        <g transform="translate(120 26) scale(.78)">${standingSide(96)}${strap(96, 64, 150, 99)}${sax(110, 52, 1)}</g>
        ${ok(162, 30)}${label(184, 26, L('justo', 'just right'), { size: 12 })}${label(184, 40, L('llega sola', 'it reaches you'), { size: 11, weight: 600 })}`),
      panel(`${sittingSide(36)}${strap(64, 62, 120, 100)}${sax(76, 50, 0.95)}${arm([56, 78], [66, 116], [118, 100], { far: true })}${arm(shoulderSitting(36), [66, 122], [112, 128])}
        ${dashed('M48 30 L48 150')}${label(262, 76, L('espalda recta', 'straight back'), { size: 12, anchor: 'end' })}${label(140, 222, L('en el borde de la silla', 'on the edge of the chair'), { size: 12 })}${ok(236, 40)}`),
    ],

    // ---- Saxofón: boquilla y tudel ----
    'sax-neck': [
      panel(`${profileHead(-30, 50, 1)}${mouthpiece(112, 136, 1)}${arrow('M190 70 L150 120', '#17798A')}${label(262, 60, L('aire constante', 'steady air'), { color: '#17798A', size: 13, anchor: 'end' })}${waves(196, 138)}`),
      panel(gauge()),
      panel(`${[[L('Soprano', 'Soprano'), L('Do', 'C'), 12, 0.2], [L('Alto', 'Alto'), L('La', 'A'), 10, 0.24], [L('Tenor', 'Tenor'), L('Sol', 'G'), 9, 0.27], [L('Barítono', 'Baritone'), L('Re', 'D'), 6, 0.3]]
        .map(([name, note, step, sc], i) => {
          const y = 18 + i * 52;
          return `${sax(24, y + 2, sc)}${label(64, y + 24, name, { color: C.ink, size: 13 })}${label(64, y + 40, note, { size: 13 })}${miniStaff(150, y + 6, 110, [{ step, nx: 228 }])}`;
        }).join('')}`),
    ],

    // ---- Respiración (todos los vientos) ----
    breath: [
      panel(`${frontPerson(135, 46)}
        <ellipse cx="135" cy="176" rx="62" ry="34" fill="none" stroke="${C.green}" stroke-width="2.5" stroke-dasharray="6 5"/>
        ${arrow('M100 176 L44 176')}${arrow('M170 176 L226 176')}${arrow('M135 186 L135 214')}
        ${label(135, 168, L('barriga y costados', 'belly and sides'), { color: '#fff', anchor: 'middle', size: 13 })}
        ${arrow('M60 104 L60 72', C.red)}${arrow('M210 104 L210 72', C.red)}${bad(236, 40)}${label(60, 64, L('hombros quietos', 'shoulders still'), { color: C.red, anchor: 'middle', size: 12 })}`),
      panel(`${profileHead(-36, 40, 1)}
        ${[0, 1, 2].map(i => `<path d="M${116 + i * 4} ${118 + i * 10} C150 ${112 + i * 10} 170 ${124 + i * 10} 200 ${118 + i * 10}" fill="none" stroke="#17798A" stroke-width="3" stroke-linecap="round"/>`).join('')}
        <rect x="222" y="140" width="12" height="62" rx="3" fill="#F7E4B5" stroke="${SKIN_LINE}"/>
        <path d="M228 140 C220 126 226 112 228 102 C232 114 238 126 228 140 Z" fill="#F2A33A" transform="rotate(32 228 140)"/>
        ${label(150, 212, 'ssssss…', { color: '#17798A', anchor: 'middle', size: 20 })}`),
      panel(`<path d="M30 40 L60 40 L70 120 L20 120 Z" fill="none" stroke="${C.ink}" stroke-width="3"/><path d="M45 110 L58 54" stroke="${C.accent}" stroke-width="3"/>
        ${[0, 1, 2, 3].map(i => `<rect x="${92 + i * 22}" y="${110 - i * 16}" width="16" height="${20 + i * 16}" rx="4" fill="${C.green}" opacity=".85"/>`).join('')}
        ${Array.from({ length: 8 }, (_, i) => `<rect x="${92 + i * 21}" y="${144 + i * 6}" width="15" height="${56 - i * 6}" rx="3" fill="#17798A" opacity=".8"/>`).join('')}
        ${label(150, 30, L('coge aire: 4 tiempos', 'breathe in: 4 beats'), { color: C.green, anchor: 'middle', size: 13 })}${label(180, 224, L('suelta: 8 tiempos', 'breathe out: 8 beats'), { color: '#17798A', anchor: 'middle', size: 13 })}`),
    ],

    // ---- Clarinete: embocadura ----
    'clar-embouchure': [
      reedLip[1],
      panel(`${[[70, false], [200, true]].map(([cx, bunched]) => `
        <path d="M${cx - 40} 40 C${cx + 10} 34 ${cx + 40} 70 ${cx + 40} 100 L${cx + 44} 120 C${cx + 40} 160 ${cx + 20} 190 ${cx - 10} 200 L${cx - 40} 200 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.5"/>
        <path d="M${cx + 36} 112 C${cx + 46} 112 ${cx + 50} 116 ${cx + 52} 120" stroke="${C.lip}" stroke-width="7" stroke-linecap="round" fill="none"/>
        <path d="M${cx + 52} 116 L${cx + 70} 112 L${cx + 70} 124 L${cx + 50} 124 Z" fill="${B.black}"/>
        ${bunched ? [0, 1, 2].map(i => `<circle cx="${cx + 18 + i * 6}" cy="${150 + i * 9}" r="5" fill="none" stroke="${SKIN_LINE}" stroke-width="2"/>`).join('') : `<path d="M${cx + 30} 140 C${cx + 26} 160 ${cx + 16} 178 ${cx} 190" fill="none" stroke="${C.green}" stroke-width="3" stroke-dasharray="5 4"/>`}
        ${bunched ? bad(cx, 212) : ok(cx, 212)}`).join('')}
        ${label(70, 30, L('barbilla plana', 'flat chin'), { anchor: 'middle', size: 13 })}${label(200, 30, L('con bolitas', 'bunched'), { color: C.red, anchor: 'middle', size: 13 })}`),
      panel(`${profileHead(-20, 6, 0.9)}<line x1="80" y1="96" x2="80" y2="226" stroke="${C.muted}" stroke-width="2" stroke-dasharray="6 6"/>
        ${clarinet(112, 84, 58, 150)}
        <path d="M80 160 A76 76 0 0 0 144 128" fill="none" stroke="${C.green}" stroke-width="3"/>${label(20, 200, '30–40°', { size: 18 })}${arrow('M48 192 L96 166')}`),
    ],

    // ---- Clarinete y oboe: cómo sujetarlo ----
    'woodwind-hold': [
      panel(`<rect x="112" y="10" width="40" height="214" rx="6" fill="${B.black}"/>${[40, 70, 100].map(y => `<circle cx="132" cy="${y}" r="7" fill="#3A4252" stroke="${B.silver}" stroke-width="2"/>`).join('')}
        <path d="M112 146 L94 146 L94 158 L112 158" fill="${B.silver}" stroke="#8A93A3" stroke-width="1.5"/>
        ${limb('M20 214 C40 190 70 172 92 162', 22)}<ellipse cx="96" cy="160" rx="9" ry="7" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
        ${arrow('M40 120 L90 148')}${label(16, 108, L('apoyapulgar', 'thumb rest'), { size: 13 })}
        ${label(196, 160, L('el peso', 'the weight'), { color: C.ink, size: 12 })}${label(196, 176, L('va aquí', 'goes here'), { color: C.ink, size: 12 })}`),
      panel(`<rect x="20" y="150" width="232" height="30" rx="8" fill="${B.black}"/>${[70, 135, 200].map(x => `<circle cx="${x}" cy="165" r="9" fill="#3A4252"/>`).join('')}
        <circle cx="135" cy="96" r="38" fill="none" stroke="${C.green}" stroke-width="2" stroke-dasharray="5 5"/>
        ${limb('M40 60 C60 40 100 40 120 56', 18)}
        ${[[70, 92], [135, 82], [200, 92]].map(([x, top]) => limb(`M${x - 10} ${top - 30} C${x - 24} ${top} ${x - 10} 140 ${x} 154`, 13)).join('')}
        ${label(135, 100, L('pelota', 'ball'), { color: C.green, anchor: 'middle', size: 12 })}${ok(240, 30)}${label(135, 214, L('yemas planas sobre los agujeros', 'flat pads on the holes'), { color: C.ink, anchor: 'middle', size: 12 })}`),
      panel(`${standingSide(80)}${clarinet(96, 52, 52, 140)}${arm([76, 82], [92, 116], [130, 92], { far: true })}${arm(shoulderStanding(80), [96, 120], [150, 124])}
        ${dashed('M108 37 L262 37')}${label(262, 28, L('cabeza recta', 'head straight'), { anchor: 'end', size: 13 })}
        ${arrow('M120 132 L150 150')}${label(150, 172, L('codos sueltos', 'loose elbows'), { size: 12 })}${ok(236, 196)}`),
    ],

    // ---- Oboe: como el clarinete, pero con su caña doble y su campana pequeña ----
    get 'oboe-hold'() {
      const base = this['woodwind-hold'];
      return [base[0], base[1], panel(`${standingSide(80)}${clarinet(104, 50, 52, 150, { oboe: true })}${arm([76, 82], [92, 116], [130, 92], { far: true })}${arm(shoulderStanding(80), [96, 120], [150, 124])}
        ${dashed('M108 37 L262 37')}${label(262, 28, L('cabeza recta', 'head straight'), { anchor: 'end', size: 13 })}
        ${arrow('M120 132 L150 150')}${label(150, 172, L('codos sueltos', 'loose elbows'), { size: 12 })}${ok(236, 196)}`)];
    },

    // ---- Clarinete: boquilla y barrilete ----
    'clar-barrel': [
      panel(`${mouthpiece(30, 80, 1.4)}${waves(140, 80)}${miniStaff(70, 150, 150, [{ step: 12, nx: 170 }])}${label(135, 222, L('Do agudo (sonido real)', 'high C (concert)'), { anchor: 'middle', size: 13 })}`),
      panel(`${mouthpiece(18, 80, 1.1)}${waves(150, 80)}${miniStaff(70, 150, 150, [{ step: 8, nx: 170, acc: '♯' }])}${label(135, 222, L('Fa♯ con el barrilete', 'F♯ with the barrel'), { anchor: 'middle', size: 13 })}`),
      panel(gauge()),
    ],

    // ---- Oboe ----
    'oboe-embouchure': [
      panel(`${JAW}${tooth(30, 92)}${tooth(140, 214)}${rolledUpper}${rolledLower}${arrow('M214 40 C232 70 214 100 184 104')}${arrow('M214 200 C232 170 214 140 184 136')}
        ${label(258, 124, L('los dos', 'both lips'), { anchor: 'end', size: 12 })}`),
      panel(`${JAW}${tooth(30, 92)}${tooth(140, 214)}
        <path d="M98 100 C98 120 150 122 178 114 C198 106 198 56 178 30 L140 30 L140 88 C128 94 112 94 98 92 Z" fill="${C.lip}"/>
        <path d="M98 138 C98 120 150 118 178 126 C198 134 198 186 178 214 L140 214 L140 150 C128 146 112 146 98 148 Z" fill="${C.lip}"/>
        <path d="M150 112 L268 102 L268 138 L150 128 Z" fill="${B.reed}"/><rect x="214" y="104" width="54" height="32" fill="${B.cork}"/>
        <path d="M150 154 L196 154" stroke="${C.green}" stroke-width="2.5"/><path d="M150 148 L150 160 M196 148 L196 160" stroke="${C.green}" stroke-width="2.5"/>${label(173, 176, L('solo la punta', 'just the tip'), { anchor: 'middle', size: 12 })}`),
      panel(`${[[70, false], [200, true]].map(([cx, puff]) => `
        <ellipse cx="${cx}" cy="110" rx="${puff ? 48 : 40}" ry="54" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.5"/>
        <circle cx="${cx - 14}" cy="88" r="3" fill="${C.ink}"/><circle cx="${cx + 14}" cy="88" r="3" fill="${C.ink}"/>
        <ellipse cx="${cx}" cy="130" rx="9" ry="7" fill="${C.lip}"/><rect x="${cx - 3}" y="132" width="6" height="40" fill="${B.reed}"/>
        ${puff ? `<ellipse cx="${cx - 36}" cy="124" rx="10" ry="14" fill="#E9B9A0" opacity=".7"/><ellipse cx="${cx + 36}" cy="124" rx="10" ry="14" fill="#E9B9A0" opacity=".7"/>${bad(cx, 196)}` : ok(cx, 196)}`).join('')}
        ${label(70, 36, L('mofletes quietos', 'still cheeks'), { anchor: 'middle', size: 12 })}${label(200, 36, L('hinchados', 'puffed'), { color: C.red, anchor: 'middle', size: 12 })}`),
    ],
    'oboe-crow': [
      panel(`<path d="M70 90 L200 90 L190 214 L80 214 Z" fill="#CFE7F2" stroke="#8FB8CC" stroke-width="3"/><path d="M74 120 L196 120" stroke="#8FB8CC" stroke-width="2"/>
        <path d="M122 40 L148 40 L143 150 L127 150 Z" fill="${B.reed}"/><rect x="127" y="150" width="16" height="40" fill="${B.cork}"/>
        ${label(135, 28, L('2-3 minutos', '2-3 minutes'), { color: C.ink, anchor: 'middle', size: 13 })}${label(262, 200, L('solo la caña,', 'cane only,'), { size: 12, anchor: 'end' })}${label(262, 214, L('no el tudel', 'not the staple'), { size: 12, anchor: 'end' })}`),
      panel(`<path d="M20 70 L120 60 L120 84 L20 76 Z" fill="${B.reed}"/><rect x="120" y="58" width="36" height="28" fill="${B.cork}"/>${waves(170, 72)}
        ${miniStaff(40, 136, 200, [{ step: 5, nx: 120 }, { step: 12, nx: 160 }, { step: -2, nx: 80 }])}${label(135, 220, L('«graznido»: Do en varias octavas', '"crow": C in several octaves'), { anchor: 'middle', size: 12 })}`),
      panel(`${profileHead(-20, 30, 0.9)}<path d="M126 108 L210 100 L210 120 L126 116 Z" fill="${B.reed}"/><rect x="186" y="98" width="30" height="24" fill="${B.cork}"/>${waves(222, 110)}
        ${miniStaff(70, 168, 150, [{ step: 5, nx: 160 }])}${label(110, 222, L('un Do limpio', 'a clean C'), { anchor: 'middle', size: 13 })}`),
    ],
  };
}
