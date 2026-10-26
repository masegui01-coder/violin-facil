// Ilustraciones de los consejos: cada una son 2-3 viñetas (una por paso). Se dibujan en SVG dentro de la página,
// así los rótulos se traducen como el resto del texto. Colores fijos de ilustración (sobre fondo claro siempre).
import { L } from './tips-l10n.js';

const C = {
  skin: '#F1DCC6', skinLine: '#C9A985', gum: '#F4E3D3', lip: '#D9827A', tooth: '#FFFFFF', toothLine: '#9AA3B2',
  mp: '#1E2430', reed: '#D9B26A', brass: '#D7A63A', brassDark: '#A87A1F', green: '#2B7A4B', red: '#C2372F', accent: '#B4461F',
  ink: '#141B26', muted: '#5A6678', wood: '#A0632B', woodLight: '#D9A066', shirt: '#B4461F', pants: '#2F55A4', silver: '#B8C0CC',
  floor: '#E2D7CB', paper: '#F7F3EE',
};

const DEFS = `<defs><marker id="tipArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.green}"/></marker>
<marker id="tipArrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.red}"/></marker></defs>`;

const panel = inner => `<svg viewBox="0 0 270 230" class="tip-art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${DEFS}${inner}</svg>`;
const arrow = (d, color = C.green, w = 3) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${color === C.red ? 'tipArrowRed' : 'tipArrow'})"/>`;
const label = (x, y, text, { color = C.green, anchor = 'start', size = 14, weight = 800 } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" font-family="Figtree, Segoe UI, Roboto, sans-serif">${text}</text>`;
const ok = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.green}"/><path d="M${x - 6} ${y} l4 5 l8 -10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
const bad = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.red}"/><path d="M${x - 5} ${y - 5} l10 10 M${x + 5} ${y - 5} l-10 10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
const dashed = (d, color = C.green) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6 6"/>`;
const floor = (x1, x2, y) => `<line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${C.floor}" stroke-width="4" stroke-linecap="round"/>`;

// ---------- Boca de perfil (mirando a la derecha), en grande ----------
const jaw = `<rect x="40" y="22" width="70" height="210" rx="10" fill="${C.gum}"/>`;
const upperTooth = (bottom = 108) => `<path d="M110 30 L140 30 L140 ${bottom} C140 ${bottom + 8} 110 ${bottom + 8} 110 ${bottom} Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/>`;
const lowerTooth = (top = 142) => `<path d="M110 214 L140 214 L140 ${top} C140 ${top - 8} 110 ${top - 8} 110 ${top} Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/>`;
const upperLip = `<path d="M140 26 C178 26 196 64 194 100 C193 116 180 122 140 120 Z" fill="${C.lip}"/>`;
const lowerLip = `<path d="M140 130 C180 128 194 136 194 156 C196 192 178 222 140 222 Z" fill="${C.lip}"/>`;
const rolledLip = (top = 152) => `<path d="M98 ${top} C98 ${top - 20} 150 ${top - 28} 178 ${top - 16} C198 ${top - 6} 198 ${top + 44} 178 ${top + 70} L140 ${top + 70} L140 ${top + 12} C128 ${top + 6} 112 ${top + 6} 98 ${top + 8} Z" fill="${C.lip}"/>`;
const mouthpiece = (y = 110, angle = 0) => `<g transform="rotate(${angle} 120 ${y})"><path d="M92 ${y} L270 ${y - 14} L270 ${y + 16} L92 ${y + 16} Z" fill="${C.mp}"/><path d="M92 ${y + 16} L270 ${y + 16} L270 ${y + 23} L96 ${y + 22} Z" fill="${C.reed}"/></g>`;

const ART = {
  // ---- Saxofón: el labio de abajo en tres pasos (aprobado por el usuario) ----
  'reed-lip': [
    panel(`${jaw}${upperTooth()}${lowerTooth()}${upperLip}${lowerLip}`),
    panel(`${jaw}${upperTooth()}${upperLip}<path d="M110 214 L140 214 L140 156 L110 156 Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/>${rolledLip()}
      <path d="M110 156 L110 142 C110 134 140 134 140 142 L140 156" fill="none" stroke="${C.toothLine}" stroke-width="2" stroke-dasharray="4 4"/>${arrow('M214 196 C230 160 214 126 180 116')}`),
    panel(`${jaw}${mouthpiece(110)}<rect x="108" y="104" width="34" height="6" rx="2" fill="${C.accent}"/><path d="M110 26 L140 26 L140 104 L110 104 Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/>
      <path d="M140 22 C178 22 196 60 194 86 C193 98 182 104 140 106 Z" fill="${C.lip}"/><path d="M110 216 L140 216 L140 160 L110 160 Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/>
      <path d="M98 140 C100 134 150 132 178 138 C198 148 198 196 178 222 L140 222 L140 166 C128 160 112 160 98 162 Z" fill="${C.lip}"/>${arrow('M232 160 L192 142')}${label(212, 178, L('cojín', 'cushion'))}`),
  ],

  // ---- Saxofón: postura ----
  'sax-posture': [
    panel(`${floor(40, 230, 214)}${person({ x: 120 })}${dashed('M146 44 L250 44')}${label(250, 36, L('cabeza recta', 'head straight'), { anchor: 'end' })}${saxOnPerson(120)}`),
    panel(`${floor(40, 230, 214)}${person({ x: 90 })}${saxOnPerson(90)}${arrow('M190 70 L190 40')}${arrow('M190 110 L190 140')}${label(200, 96, L('ajusta', 'adjust'))}
      <circle cx="122" cy="98" r="6" fill="none" stroke="${C.green}" stroke-width="3"/>`),
    panel(`${chair(70)}${sittingPerson(70)}<path d="M128 60 L144 66 C152 72 154 84 150 100 L144 160 C142 182 152 196 168 196 C182 196 188 186 188 172 L188 158" fill="none" stroke="${C.brass}" stroke-width="12" stroke-linecap="round"/>${ok(230, 40)}`),
  ],

  // ---- Saxofón: tudel y boquilla ----
  'sax-neck': [
    panel(`<g transform="translate(30 70)">${mpSide(0, 0, 1)}</g>${arrow('M10 92 L40 92', '#17798A')}${label(14, 74, L('aire', 'air'), { color: '#17798A' })}`),
    panel(gauge()),
    panel(`<g transform="translate(16 60)">${mpSide(0, 0, 0.8)}<path d="M150 22 C200 22 236 32 250 60 L250 76 C232 50 200 46 150 46 Z" fill="${C.brass}"/></g>
      ${label(135, 190, L('alto: La · tenor: Sol', 'alto: A · tenor: G'), { color: C.ink, anchor: 'middle', size: 15 })}${label(135, 212, L('barítono: Re · soprano: Do', 'baritone: D · soprano: C'), { color: C.ink, anchor: 'middle', size: 15 })}`),
  ],

  // ---- Vientos: respiración ----
  breath: [
    panel(torso({ expand: true }) + arrow('M60 150 L30 150') + arrow('M210 150 L240 150') + bad(214, 40) + `<path d="M98 66 l-12 -16 M172 66 l12 -16" stroke="${C.red}" stroke-width="3"/>` + label(214, 72, L('hombros', 'shoulders'), { color: C.red, anchor: 'middle', size: 12 })),
    panel(`<circle cx="70" cy="110" r="34" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/><path d="M100 112 l8 0" stroke="${C.ink}" stroke-width="3"/>
      ${[0, 1, 2].map(i => `<path d="M114 ${100 + i * 12} C140 ${96 + i * 12} 150 ${104 + i * 12} 176 ${100 + i * 12}" fill="none" stroke="#17798A" stroke-width="3" stroke-linecap="round"/>`).join('')}
      <rect x="208" y="110" width="12" height="60" rx="3" fill="#F7E4B5" stroke="${C.skinLine}"/><path d="M214 110 C206 96 212 80 214 70 C218 82 224 94 214 110 Z" fill="#F2A33A" transform="rotate(28 214 110)"/>${label(135, 210, 'ssss…', { color: '#17798A', anchor: 'middle', size: 20 })}`),
    panel(`${[0, 1, 2, 3].map(i => `<rect x="${30 + i * 26}" y="${130 - i * 18}" width="18" height="${20 + i * 18}" rx="4" fill="${C.green}" opacity=".85"/>`).join('')}
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${140 + i * 15}" y="${76 + i * 9}" width="11" height="${74 - i * 9}" rx="3" fill="#17798A" opacity=".8"/>`).join('')}
      ${label(70, 180, L('coge 4', 'in 4'), { color: C.ink, anchor: 'middle' })}${label(196, 180, L('suelta 8', 'out 8'), { color: C.ink, anchor: 'middle' })}`),
  ],

  // ---- Clarinete ----
  'clar-embouchure': [
    panel(`${jaw}${upperTooth()}${upperLip}<path d="M110 214 L140 214 L140 156 L110 156 Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/>${rolledLip(158)}${arrow('M214 196 C230 164 214 132 182 122')}`),
    panel(`<path d="M70 30 C150 20 200 60 206 110 C212 150 196 190 150 214 C120 222 90 214 70 200 Z" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>
      <path d="M150 116 C172 112 190 118 200 124" stroke="${C.lip}" stroke-width="8" stroke-linecap="round" fill="none"/>${arrow('M196 160 L190 206')}${label(212, 196, L('estirada', 'flat'), { size: 13 })}${ok(234, 40)}`),
    panel(`<line x1="60" y1="30" x2="60" y2="214" stroke="${C.skinLine}" stroke-width="3" stroke-dasharray="6 6"/>
      <circle cx="60" cy="50" r="24" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>
      <line x1="80" y1="58" x2="190" y2="210" stroke="${C.mp}" stroke-width="14" stroke-linecap="round"/>
      <path d="M60 140 A80 80 0 0 0 112 128" fill="none" stroke="${C.green}" stroke-width="3"/>${label(150, 150, '30–40°', { size: 16 })}`),
  ],
  'woodwind-hold': [
    panel(`<rect x="110" y="20" width="44" height="200" rx="8" fill="${C.mp}"/><path d="M150 128 l20 0 l0 14 l-20 0" fill="${C.silver}"/>
      <path d="M232 150 C210 150 186 146 170 136 C162 130 160 122 166 118 C176 114 196 124 214 128" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${arrow('M232 100 L180 124')}${label(214, 92, L('pulgar', 'thumb'), { size: 13 })}`),
    panel(`<rect x="40" y="94" width="200" height="40" rx="8" fill="${C.mp}"/>${[80, 130, 180].map(x => `<circle cx="${x}" cy="114" r="9" fill="#3A4252"/>`).join('')}
      ${[80, 130, 180].map(x => `<path d="M${x - 14} 40 C${x - 18} 70 ${x - 10} 96 ${x} 106 C${x + 10} 96 ${x + 14} 70 ${x + 10} 40" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>`).join('')}
      ${ok(230, 190)}${label(140, 196, L('yema plana', 'flat pad'), { color: C.ink, anchor: 'middle' })}`),
    panel(`${floor(40, 230, 214)}${person({ x: 110 })}<line x1="134" y1="58" x2="186" y2="160" stroke="${C.mp}" stroke-width="10" stroke-linecap="round"/>${dashed('M136 44 L250 44')}${label(250, 36, L('cabeza recta', 'head straight'), { anchor: 'end' })}`),
  ],
  'clar-barrel': [
    panel(`<g transform="translate(30 80)">${mpSide(0, 0, 1)}</g>${label(135, 190, L('Do agudo', 'high C'), { color: C.ink, anchor: 'middle', size: 18 })}`),
    panel(`<g transform="translate(10 80)">${mpSide(0, 0, 0.9)}<rect x="150" y="18" width="70" height="34" rx="8" fill="#3A4252"/></g>${label(135, 190, 'Fa♯', { color: C.ink, anchor: 'middle', size: 22 })}`),
    panel(gauge()),
  ],

  // ---- Oboe ----
  'oboe-embouchure': [
    panel(`${jaw}<path d="M110 30 L140 30 L140 92 L110 92 Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/><path d="M110 214 L140 214 L140 140 L110 140 Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/>
      <path d="M98 100 C98 120 150 126 178 116 C198 106 198 56 178 30 L140 30 L140 88 C128 94 112 94 98 92 Z" fill="${C.lip}"/>${rolledLip(146)}${arrow('M214 40 C232 70 214 100 184 106')}${arrow('M214 200 C232 170 214 140 184 134')}`),
    panel(`${jaw}<path d="M110 30 L140 30 L140 92 L110 92 Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/><path d="M110 214 L140 214 L140 140 L110 140 Z" fill="${C.tooth}" stroke="${C.toothLine}" stroke-width="2.5"/>
      <path d="M98 100 C98 120 150 122 178 114 C198 106 198 56 178 30 L140 30 L140 88 C128 94 112 94 98 92 Z" fill="${C.lip}"/><path d="M98 138 C98 120 150 118 178 126 C198 134 198 186 178 214 L140 214 L140 150 C128 146 112 146 98 148 Z" fill="${C.lip}"/>
      <path d="M150 112 L270 104 L270 136 L150 128 Z" fill="${C.reed}"/><path d="M200 108 L200 132" stroke="#8A3B2A" stroke-width="10"/>${label(160, 168, L('solo la punta', 'just the tip'), { size: 13 })}`),
    panel(`<circle cx="80" cy="110" r="40" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/><circle cx="80" cy="110" r="12" fill="${C.lip}"/>
      ${arrow('M30 70 L58 92')}${arrow('M130 70 L102 92')}${arrow('M30 150 L58 128')}${arrow('M130 150 L102 128')}${bad(220, 70)}${label(220, 110, L('mofletes', 'cheeks'), { color: C.red, anchor: 'middle', size: 13 })}`),
  ],
  'oboe-crow': [
    panel(`<rect x="70" y="90" width="130" height="120" rx="12" fill="#CFE7F2" stroke="#8FB8CC" stroke-width="3"/><path d="M70 120 L200 120" stroke="#8FB8CC" stroke-width="2"/>
      <path d="M120 40 L150 40 L144 140 L126 140 Z" fill="${C.reed}"/><rect x="126" y="140" width="18" height="40" fill="#8A3B2A"/>${label(135, 30, '2-3 min', { color: C.ink, anchor: 'middle' })}`),
    panel(`<path d="M30 110 L130 100 L130 124 L30 116 Z" fill="${C.reed}"/><rect x="130" y="98" width="40" height="28" fill="#8A3B2A"/>
      ${[0, 1, 2].map(i => `<path d="M${184 + i * 18} ${92 - i * 4} C${194 + i * 18} 104 ${194 + i * 18} 118 ${184 + i * 18} ${132 + i * 4}" fill="none" stroke="${C.green}" stroke-width="3"/>`).join('')}${label(135, 186, L('Do · Do · Do', 'C · C · C'), { color: C.ink, anchor: 'middle', size: 18 })}`),
    panel(gauge()),
  ],

  // ---- Flauta ----
  'flute-embouchure': [
    panel(`<path d="M60 20 C150 14 210 60 214 112 C218 160 200 200 150 222 L60 222 Z" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>
      <path d="M150 100 C176 98 196 102 212 108" stroke="${C.lip}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M150 126 C176 124 196 120 210 116" stroke="${C.lip}" stroke-width="9" stroke-linecap="round" fill="none"/>
      <rect x="150" y="132" width="110" height="26" rx="6" fill="${C.silver}"/><ellipse cx="206" cy="132" rx="16" ry="5" fill="${C.ink}"/>${arrow('M120 132 L150 132')}`),
    panel(`<rect x="20" y="70" width="230" height="90" rx="44" fill="${C.silver}"/><ellipse cx="135" cy="115" rx="44" ry="28" fill="${C.ink}"/>
      <path d="M91 115 A44 28 0 0 1 120 89 L120 141 A44 28 0 0 1 91 115 Z" fill="${C.lip}" opacity=".85"/>${label(110, 196, '¼ – ⅓', { color: C.ink, anchor: 'middle', size: 20 })}`),
    panel(`<path d="M40 112 C70 100 90 100 110 112 C90 124 70 124 40 112 Z" fill="${C.lip}"/><ellipse cx="78" cy="112" rx="8" ry="3" fill="${C.ink}"/>
      ${arrow('M110 112 L196 128', '#17798A')}<rect x="150" y="136" width="110" height="20" rx="5" fill="${C.silver}"/><path d="M196 136 L214 136" stroke="${C.ink}" stroke-width="5"/>${label(70, 160, '«pu»', { color: C.ink, anchor: 'middle', size: 20 })}`),
  ],
  'flute-hold': [
    panel(`<rect x="20" y="104" width="240" height="18" rx="9" fill="${C.silver}"/>${[[40, L('barbilla', 'chin')], [118, L('índice izq.', 'left index')], [196, L('pulgar der.', 'right thumb')]].map(([x, t]) => `<circle cx="${x}" cy="${x === 196 ? 130 : x === 40 ? 98 : 128}" r="9" fill="${C.green}"/>${label(x, 170, t, { color: C.ink, anchor: 'middle', size: 12 })}`).join('')}${arrow('M196 156 L196 140')}`),
    panel(`<circle cx="80" cy="80" r="30" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/><rect x="60" y="110" width="44" height="90" rx="18" fill="${C.shirt}"/>
      <line x1="96" y1="94" x2="250" y2="104" stroke="${C.silver}" stroke-width="10" stroke-linecap="round"/>${arrow('M40 60 C30 70 30 84 38 94')}${ok(230, 40)}`),
    panel(`${chair(90)}<path d="M60 214 L200 140" stroke="${C.green}" stroke-width="2" stroke-dasharray="6 6"/>${sittingPerson(90)}<line x1="140" y1="62" x2="250" y2="70" stroke="${C.silver}" stroke-width="8" stroke-linecap="round"/>${arrow('M220 196 L240 170')}`),
  ],
  'flute-head': [
    panel(`<rect x="20" y="96" width="200" height="34" rx="12" fill="${C.silver}"/><ellipse cx="60" cy="96" rx="12" ry="4" fill="${C.ink}"/>${label(135, 180, L('≈ La', '≈ A'), { color: C.ink, anchor: 'middle', size: 20 })}`),
    panel(`<rect x="20" y="96" width="200" height="34" rx="12" fill="${C.silver}"/><ellipse cx="60" cy="96" rx="12" ry="4" fill="${C.ink}"/><path d="M220 80 C250 86 256 140 220 146 Z" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${label(135, 180, L('una octava más grave', 'an octave lower'), { color: C.ink, anchor: 'middle', size: 15 })}`),
    panel(`<path d="M20 160 C60 60 100 60 135 110 C170 160 210 160 250 60" fill="none" stroke="#17798A" stroke-width="4"/>${label(135, 200, L('sirena', 'siren'), { color: C.ink, anchor: 'middle', size: 18 })}`),
  ],

  // ---- Flauta dulce ----
  'recorder-holes': [
    panel(`<rect x="118" y="10" width="34" height="214" rx="12" fill="#E8C98E" stroke="#B9935A" stroke-width="2"/>${[50, 80, 110, 150, 175, 200].map((y, i) => `<circle cx="135" cy="${y}" r="7" fill="${i < 3 ? C.green : C.pants}"/>`).join('')}
      ${label(70, 85, L('izquierda', 'left'), { color: C.green, anchor: 'middle', size: 13 })}${label(70, 180, L('derecha', 'right'), { color: C.pants, anchor: 'middle', size: 13 })}`),
    panel(`<rect x="40" y="96" width="200" height="40" rx="14" fill="#E8C98E"/><circle cx="135" cy="116" r="10" fill="#7A5A2A"/>
      <path d="M118 40 C114 70 120 96 135 108 C150 96 156 70 152 40" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${ok(220, 190)}${label(120, 196, L('yema plana', 'flat pad'), { color: C.ink, anchor: 'middle' })}`),
    panel(`<rect x="90" y="40" width="70" height="160" rx="18" fill="#E8C98E"/><circle cx="125" cy="90" r="11" fill="#7A5A2A"/>
      <path d="M190 120 C170 116 150 104 140 92 C136 84 140 78 146 80 C160 84 176 96 196 100" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${label(135, 216, L('rendija', 'small gap'), { anchor: 'middle' })}`),
  ],
  'recorder-breath': [
    panel(`${jaw}${upperTooth(100)}${lowerTooth(150)}<path d="M140 26 C178 26 196 64 194 92 C193 104 180 110 140 108 Z" fill="${C.lip}"/><path d="M140 140 C180 138 194 146 194 166 C196 198 178 222 140 222 Z" fill="${C.lip}"/>
      <path d="M150 108 L270 104 L270 140 L150 140 Z" fill="#E8C98E"/>${ok(240, 40)}`),
    panel(`${label(135, 130, '«du»', { color: C.ink, anchor: 'middle', size: 48 })}`),
    panel(`<path d="M60 140 C80 120 100 120 120 140" fill="none" stroke="${C.skinLine}" stroke-width="10" stroke-linecap="round"/>
      ${[0, 1, 2].map(i => `<path d="M${130 + i * 6} ${100 + i * 10} C150 ${96 + i * 10} 170 ${104 + i * 10} 200 ${100 + i * 10}" fill="none" stroke="#E8964A" stroke-width="3" opacity=".7"/>`).join('')}${ok(230, 40)}`),
  ],

  // ---- Metales ----
  'brass-buzz': [
    panel(`<ellipse cx="135" cy="115" rx="90" ry="60" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/><path d="M90 112 C115 104 155 104 180 112 C155 120 115 120 90 112 Z" fill="${C.lip}"/>
      ${arrow('M50 112 L84 112')}${arrow('M220 112 L186 112')}${label(135, 210, '«m»', { color: C.ink, anchor: 'middle', size: 22 })}`),
    panel(`<path d="M50 112 C80 104 110 104 140 112 C110 120 80 120 50 112 Z" fill="${C.lip}"/>${[0, 1, 2].map(i => `<path d="M${160 + i * 22} 90 l8 22 l-8 22" fill="none" stroke="${C.accent}" stroke-width="3"/>`).join('')}${label(135, 200, 'brrrr', { color: C.accent, anchor: 'middle', size: 22 })}`),
    panel(`<path d="M30 112 C40 100 50 96 70 96 L70 128 C50 128 40 124 30 112 Z" fill="${C.lip}"/><path d="M70 92 C90 92 96 100 110 106 L250 106 L250 118 L110 118 C96 124 90 132 70 132 Z" fill="${C.silver}" stroke="#8A93A3" stroke-width="2"/>
      <path d="M60 196 C100 150 140 150 180 196 C200 170 230 160 250 170" fill="none" stroke="#17798A" stroke-width="3"/>`),
  ],
  'brass-placement': [
    panel(`<ellipse cx="135" cy="115" rx="100" ry="70" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/><path d="M85 112 C110 104 160 104 185 112 C160 122 110 122 85 112 Z" fill="${C.lip}"/>
      <circle cx="135" cy="112" r="34" fill="none" stroke="${C.silver}" stroke-width="10"/><line x1="135" y1="30" x2="135" y2="200" stroke="${C.green}" stroke-width="2" stroke-dasharray="6 6"/>`),
    panel(`${[[60, 0.5, L('trompeta', 'trumpet')], [135, 0.66, L('trompa', 'horn')], [210, 0.6, L('graves', 'low brass')]].map(([x, f, t]) => `<path d="M${x - 30} 112 C${x - 15} 104 ${x + 15} 104 ${x + 30} 112 C${x + 15} 120 ${x - 15} 120 ${x - 30} 112 Z" fill="${C.lip}"/>
      <circle cx="${x}" cy="${112 - (f - 0.5) * 60}" r="24" fill="none" stroke="${C.silver}" stroke-width="7"/>${label(x, 180, t, { color: C.ink, anchor: 'middle', size: 13 })}`).join('')}`),
    panel(`<path d="M30 112 C50 96 70 96 90 112 C70 128 50 128 30 112 Z" fill="${C.lip}"/><path d="M90 96 L250 106 L250 118 L90 128 Z" fill="${C.silver}"/>${arrow('M250 70 L200 92', C.red)}${bad(230, 40)}${label(150, 190, L('menos presión, más aire', 'less pressure, more air'), { color: C.ink, anchor: 'middle', size: 14 })}`),
  ],
  'brass-posture': [
    panel(`${floor(40, 230, 214)}${person({ x: 100 })}<path d="M126 58 L200 58 M200 50 C214 46 226 46 236 40 L236 76 C226 70 214 70 200 66 Z" stroke="${C.brass}" stroke-width="8" fill="${C.brass}"/>${dashed('M126 40 L250 40')}`),
    panel(`<rect x="40" y="100" width="160" height="24" rx="8" fill="${C.brass}"/>${[90, 116, 142].map(x => `<rect x="${x}" y="70" width="14" height="30" rx="4" fill="${C.brassDark}"/>`).join('')}
      ${[90, 116, 142].map(x => `<path d="M${x - 2} 40 C${x - 6} 52 ${x} 64 ${x + 7} 68" fill="none" stroke="${C.skinLine}" stroke-width="8" stroke-linecap="round"/>`).join('')}
      <path d="M40 124 C30 150 40 170 70 170 L120 170" fill="none" stroke="${C.skin}" stroke-width="16" stroke-linecap="round"/>${label(80, 200, L('sostiene', 'holds'), { color: C.ink, anchor: 'middle', size: 13 })}`),
    panel(`${chair(70)}${sittingPerson(70)}<ellipse cx="150" cy="150" rx="26" ry="40" fill="${C.brass}"/><path d="M130 70 L150 110" stroke="${C.brass}" stroke-width="6"/>${ok(230, 40)}`),
  ],
  'horn-hand': [
    panel(`<path d="M60 70 L200 70 C214 70 220 80 220 92 L220 140 C220 152 214 160 200 160 L60 160 Z" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${[90, 116, 142, 168].map(y => `<line x1="80" x2="210" y1="${y - 10}" y2="${y - 10}" stroke="${C.skinLine}" stroke-width="2"/>`).join('')}`),
    panel(`<circle cx="135" cy="115" r="90" fill="${C.brass}"/><circle cx="135" cy="115" r="70" fill="#7A5A1A"/><path d="M196 74 C214 100 214 130 196 156 L180 150 C194 128 194 102 180 80 Z" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="2"/>${label(135, 222, L('a las 3 en punto', 'at 3 o\'clock'), { color: C.ink, anchor: 'middle', size: 13 })}`),
    panel(`<circle cx="80" cy="110" r="44" fill="${C.brass}"/><circle cx="80" cy="110" r="32" fill="#7A5A1A"/><path d="M100 84 C112 100 112 120 100 136 L90 130 C100 118 100 102 90 90 Z" fill="${C.skin}"/>
      ${label(80, 190, L('abre: sube', 'open: sharper'), { color: C.ink, anchor: 'middle', size: 12 })}<circle cx="200" cy="110" r="44" fill="${C.brass}"/><circle cx="200" cy="110" r="32" fill="#7A5A1A"/><path d="M226 84 C244 100 244 120 226 136 L190 130 C200 118 200 102 190 90 Z" fill="${C.skin}"/>${label(200, 190, L('cierra: baja', 'close: flatter'), { color: C.ink, anchor: 'middle', size: 12 })}`),
  ],
  'trombone-slide': [
    panel(`<rect x="20" y="96" width="230" height="10" rx="4" fill="${C.brass}"/><rect x="20" y="124" width="230" height="10" rx="4" fill="${C.brass}"/><rect x="200" y="96" width="12" height="38" fill="${C.brassDark}"/>
      <path d="M180 150 C190 130 196 120 206 112" fill="none" stroke="${C.skinLine}" stroke-width="8" stroke-linecap="round"/>${label(135, 190, L('como un lápiz', 'like a pencil'), { color: C.ink, anchor: 'middle' })}`),
    panel(`<rect x="10" y="108" width="250" height="14" rx="6" fill="${C.brass}"/>${[1, 2, 3, 4, 5, 6, 7].map((p, i) => `<line x1="${30 + i * 34}" x2="${30 + i * 34}" y1="96" y2="134" stroke="${C.ink}" stroke-width="2"/>${label(30 + i * 34, 160, String(p), { color: C.ink, anchor: 'middle', size: 15 })}`).join('')}
      <circle cx="98" cy="70" r="20" fill="${C.brass}" opacity=".6"/>${label(98, 50, L('campana', 'bell'), { color: C.muted, anchor: 'middle', size: 12, weight: 600 })}`),
    panel(gauge()),
  ],

  // ---- Violín ----
  'violin-hold': [
    panel(`<path d="M40 60 C80 40 140 40 200 70 L200 220 L40 220 Z" fill="${C.shirt}"/><path d="M70 92 C110 84 160 86 210 104" stroke="${C.skinLine}" stroke-width="5" fill="none"/>
      <ellipse cx="160" cy="96" rx="80" ry="20" fill="${C.wood}" transform="rotate(10 160 96)"/>${arrow('M230 170 L130 100')}${label(230, 196, L('clavícula', 'collarbone'), { anchor: 'end', size: 13 })}`),
    panel(`<circle cx="110" cy="80" r="42" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/><ellipse cx="150" cy="134" rx="90" ry="18" fill="${C.wood}" transform="rotate(8 150 134)"/>${arrow('M110 20 L110 34')}${arrow('M110 128 L118 116', C.green)}${ok(236, 40)}`),
    panel(`<circle cx="70" cy="110" r="34" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/><path d="M90 120 L240 70" stroke="${C.wood}" stroke-width="14" stroke-linecap="round"/><circle cx="244" cy="68" r="10" fill="${C.wood}"/>${dashed('M100 106 L250 66')}${label(200, 120, L('nariz', 'nose'), { size: 13 })}`),
  ],
  'violin-bow': [
    panel(`<line x1="10" y1="96" x2="260" y2="96" stroke="#7A4A1A" stroke-width="6"/><rect x="40" y="96" width="44" height="18" fill="${C.mp}"/>
      <path d="M70 140 C72 120 80 108 92 104" stroke="${C.skin}" stroke-width="12" stroke-linecap="round" fill="none"/>${[0, 1, 2, 3].map(i => `<path d="M${100 + i * 22} 80 C${104 + i * 22} 96 ${100 + i * 22} 112 ${96 + i * 22} 130" stroke="${C.skin}" stroke-width="11" stroke-linecap="round" fill="none"/>`).join('')}
      ${label(70, 170, L('pulgar doblado', 'bent thumb'), { size: 12, anchor: 'middle' })}${label(170, 66, L('meñique curvo', 'curved pinky'), { size: 12, anchor: 'middle' })}`),
    panel(`<rect x="90" y="20" width="90" height="200" rx="40" fill="${C.wood}"/><rect x="118" y="20" width="34" height="80" fill="${C.ink}"/><rect x="112" y="160" width="46" height="8" fill="#F1E2C6"/>${[124, 132, 140, 148].map(x => `<line x1="${x}" x2="${x}" y1="20" y2="210" stroke="#ddd" stroke-width="1"/>`).join('')}
      <line x1="30" y1="130" x2="240" y2="130" stroke="#7A4A1A" stroke-width="5"/>${ok(230, 40)}`),
    panel(`${[[L('Sol', 'G'), 70], [L('Re', 'D'), 100], [L('La', 'A'), 130], [L('Mi', 'E'), 160]].map(([t, yy], i) => `<line x1="40" y1="${yy}" x2="200" y2="${60 + i * 34}" stroke="#7A4A1A" stroke-width="4" opacity="${i === 1 ? 1 : 0.35}"/>${label(220, 66 + i * 34, t, { color: C.ink, size: 14 })}`).join('')}${arrow('M30 60 L30 170')}${label(30, 200, L('codo', 'elbow'), { anchor: 'middle', size: 13 })}`),
  ],
  'violin-left': [
    panel(`<rect x="20" y="100" width="240" height="24" rx="6" fill="${C.ink}"/><path d="M40 210 C80 190 120 160 150 130" stroke="${C.skin}" stroke-width="30" stroke-linecap="round" fill="none"/>${dashed('M30 230 L170 110')}`),
    panel(`<rect x="20" y="100" width="240" height="24" rx="6" fill="${C.ink}"/><ellipse cx="110" cy="140" rx="12" ry="18" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${[100, 140, 180].map(x => `<circle cx="${x}" cy="94" r="8" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>`).join('')}${label(110, 190, L('pulgar', 'thumb'), { size: 13, anchor: 'middle' })}`),
    panel(`<rect x="20" y="150" width="240" height="20" rx="6" fill="${C.ink}"/><path d="M80 40 C80 90 110 130 140 150" stroke="${C.skin}" stroke-width="16" stroke-linecap="round" fill="none"/>${arrow('M190 60 L150 130')}${ok(230, 40)}`),
  ],

  // ---- Guitarra y ukelele ----
  'guitar-posture': [
    panel(`${chair(70)}${sittingPerson(70)}${ok(230, 40)}`),
    panel(`${chair(60)}${sittingPerson(60)}<rect x="104" y="204" width="50" height="12" rx="4" fill="${C.muted}"/><path d="M110 120 L230 40" stroke="${C.wood}" stroke-width="12" stroke-linecap="round"/><ellipse cx="120" cy="130" rx="34" ry="26" fill="${C.woodLight}"/>
      <path d="M180 120 A60 60 0 0 0 200 80" fill="none" stroke="${C.green}" stroke-width="3"/>${label(214, 120, '45°', { size: 16 })}`),
    panel(`<ellipse cx="135" cy="130" rx="70" ry="54" fill="${C.woodLight}"/><circle cx="150" cy="120" r="16" fill="#5A3A1A"/>${[[80, 180], [190, 180], [100, 76], [200, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${C.green}"/>`).join('')}${label(135, 220, L('4 apoyos', '4 contact points'), { color: C.ink, anchor: 'middle' })}`),
  ],
  fretting: [
    panel(`<rect x="10" y="80" width="250" height="70" fill="#5A3A1A"/>${[60, 160].map(x => `<rect x="${x}" y="80" width="6" height="70" fill="${C.silver}"/>`).join('')}${[92, 106, 120, 134].map(y => `<line x1="10" x2="260" y1="${y}" y2="${y}" stroke="#ddd" stroke-width="2"/>`).join('')}
      <circle cx="148" cy="106" r="11" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${ok(148, 50)}<circle cx="110" cy="120" r="11" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3" opacity=".6"/>${bad(110, 190)}`),
    panel(`<rect x="20" y="160" width="230" height="20" fill="#5A3A1A"/><line x1="20" x2="250" y1="160" y2="160" stroke="#ddd" stroke-width="3"/>
      <path d="M60 30 C60 90 110 130 135 158" stroke="${C.skin}" stroke-width="22" stroke-linecap="round" fill="none"/>${arrow('M200 80 L150 145')}${label(200, 66, L('la punta', 'the tip'), { anchor: 'middle', size: 13 })}`),
    panel(`<rect x="20" y="90" width="230" height="40" rx="10" fill="#5A3A1A"/><ellipse cx="135" cy="150" rx="12" ry="18" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${label(135, 200, L('pulgar detrás', 'thumb behind'), { color: C.ink, anchor: 'middle' })}${bad(230, 40)}${label(230, 76, L('pinza', 'clamp'), { color: C.red, anchor: 'middle', size: 12 })}`),
  ],
  'guitar-right': [
    panel(`<ellipse cx="135" cy="130" rx="110" ry="80" fill="${C.woodLight}"/><circle cx="135" cy="120" r="32" fill="#5A3A1A"/><path d="M250 40 C210 70 180 90 160 112" stroke="${C.skin}" stroke-width="22" stroke-linecap="round" fill="none"/>`),
    panel(`${[60, 80, 100, 120, 140, 160].map((y, i) => `<line x1="20" x2="250" y1="${y}" y2="${y}" stroke="${i > 2 ? C.pants : C.accent}" stroke-width="${4 - i * 0.4}"/>`).join('')}
      ${label(220, 52, 'i · m', { color: C.accent })}${label(220, 190, 'p', { color: C.pants, size: 20 })}`),
    panel(`<line x1="20" x2="250" y1="120" y2="120" stroke="${C.ink}" stroke-width="3"/><path d="M110 40 C110 80 120 110 135 122" stroke="${C.skin}" stroke-width="16" stroke-linecap="round" fill="none"/>${arrow('M150 130 C170 150 190 150 210 140')}${label(135, 200, L('hacia la palma', 'towards the palm'), { color: C.ink, anchor: 'middle' })}`),
  ],
  'uke-hold': [
    panel(`<rect x="60" y="40" width="110" height="180" rx="40" fill="${C.shirt}"/><ellipse cx="140" cy="140" rx="50" ry="40" fill="${C.woodLight}" transform="rotate(-20 140 140)"/><path d="M170 120 L250 70" stroke="${C.wood}" stroke-width="10"/>${ok(230, 190)}`),
    panel(`<ellipse cx="120" cy="130" rx="60" ry="46" fill="${C.woodLight}" transform="rotate(-20 120 130)"/><path d="M160 108 L250 60" stroke="${C.wood}" stroke-width="10"/><path d="M20 190 C70 170 110 150 140 120" stroke="${C.skin}" stroke-width="24" stroke-linecap="round" fill="none"/>${arrow('M60 120 L90 140')}`),
    panel(`<ellipse cx="110" cy="130" rx="80" ry="60" fill="${C.woodLight}"/><circle cx="110" cy="120" r="18" fill="#5A3A1A"/><path d="M190 120 L260 120" stroke="${C.wood}" stroke-width="18"/><line x1="180" x2="180" y1="100" y2="140" stroke="${C.green}" stroke-width="4"/>${arrow('M220 60 L220 100')}${arrow('M240 180 L240 140')}${label(190, 210, L('traste 14', '14th fret'), { anchor: 'middle', size: 13 })}`),
  ],

  // ---- Piano ----
  'piano-posture': [
    panel(`<rect x="160" y="100" width="100" height="16" fill="${C.ink}"/><rect x="160" y="100" width="100" height="6" fill="#fff"/><rect x="40" y="170" width="80" height="12" rx="4" fill="${C.wood}"/>${sittingPerson(50, true)}${dashed('M100 104 L170 104')}${ok(230, 40)}`),
    panel(`<rect x="160" y="100" width="100" height="16" fill="${C.ink}"/><rect x="40" y="170" width="80" height="12" rx="4" fill="${C.wood}"/>${sittingPerson(50, true)}<path d="M40 194 L80 194" stroke="${C.green}" stroke-width="4"/>${label(60, 214, L('mitad delantera', 'front half'), { anchor: 'middle', size: 12 })}`),
    panel(`<rect x="160" y="100" width="100" height="16" fill="${C.ink}"/><rect x="40" y="170" width="80" height="12" rx="4" fill="${C.wood}"/>${sittingPerson(50, true)}<rect x="170" y="210" width="30" height="6" fill="${C.brass}"/>${arrow('M180 180 L180 204')}`),
  ],
  'piano-hand': [
    panel(`<line x1="135" y1="10" x2="135" y2="110" stroke="${C.skin}" stroke-width="30" stroke-linecap="round"/><path d="M120 110 C110 150 120 180 140 190 C160 180 168 150 152 110" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>${ok(220, 40)}`),
    panel(`<rect x="20" y="150" width="230" height="50" fill="#fff" stroke="${C.ink}"/><path d="M40 60 C120 50 150 60 170 80 C190 100 196 130 192 150" fill="none" stroke="${C.skin}" stroke-width="20" stroke-linecap="round"/>${arrow('M230 110 L196 146')}${label(220, 96, L('yema', 'pad'), { anchor: 'middle', size: 13 })}`),
    panel(`${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${25 + i * 32}" y="110" width="30" height="100" fill="#fff" stroke="${C.ink}"/>`).join('')}${[0, 1, 2, 3, 4].map(i => `<circle cx="${40 + i * 32}" cy="130" r="9" fill="${C.green}"/>${label(40 + i * 32, 90, String(i + 1), { color: C.ink, anchor: 'middle' })}`).join('')}`),
  ],

  // ---- Percusión ----
  'cajon-strokes': [
    panel(`<rect x="50" y="140" width="80" height="74" rx="6" fill="${C.woodLight}" stroke="${C.wood}" stroke-width="3"/>${sittingPerson(66, false, true)}${ok(230, 40)}`),
    panel(`<rect x="60" y="20" width="150" height="200" rx="8" fill="${C.woodLight}" stroke="${C.wood}" stroke-width="4"/><circle cx="135" cy="110" r="34" fill="${C.green}" opacity=".35"/>${label(135, 116, L('grave', 'bass'), { color: C.ink, anchor: 'middle' })}`),
    panel(`<rect x="60" y="20" width="150" height="200" rx="8" fill="${C.woodLight}" stroke="${C.wood}" stroke-width="4"/><rect x="66" y="26" width="40" height="30" rx="6" fill="${C.accent}" opacity=".5"/><rect x="164" y="26" width="40" height="30" rx="6" fill="${C.accent}" opacity=".5"/>${label(135, 90, L('agudo', 'slap'), { color: C.ink, anchor: 'middle' })}`),
  ],
  'stick-grip': [
    panel(`<line x1="20" y1="160" x2="250" y2="80" stroke="${C.woodLight}" stroke-width="10" stroke-linecap="round"/><circle cx="96" cy="134" r="16" fill="none" stroke="${C.green}" stroke-width="4"/>${label(96, 190, '⅓', { anchor: 'middle', size: 20 })}`),
    panel(`<line x1="20" y1="120" x2="250" y2="120" stroke="${C.woodLight}" stroke-width="10" stroke-linecap="round"/>${[80, 104, 128].map(x => `<path d="M${x} 90 C${x - 10} 110 ${x - 6} 140 ${x + 8} 150" fill="none" stroke="${C.skin}" stroke-width="12" stroke-linecap="round"/>`).join('')}${ok(230, 40)}`),
    panel(`<ellipse cx="135" cy="200" rx="90" ry="12" fill="${C.silver}"/><path d="M60 60 L130 190" stroke="${C.woodLight}" stroke-width="8" stroke-linecap="round"/>${arrow('M160 180 C190 140 190 90 170 60')}${label(210, 120, L('rebota', 'bounces'), { size: 14 })}`),
  ],
};

// ---------- Figuras compartidas ----------
function person({ x }) {
  return `<circle cx="${x}" cy="44" r="22" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>
    <rect x="${x - 22}" y="70" width="44" height="80" rx="18" fill="${C.shirt}"/>
    <path d="M${x - 10} 148 L${x - 16} 210 M${x + 10} 148 L${x + 16} 210" stroke="${C.pants}" stroke-width="14" stroke-linecap="round"/>`;
}
function saxOnPerson(x) {
  return `<path d="M${x + 4} 74 C${x + 20} 86 ${x + 24} 92 ${x + 2} 98" fill="none" stroke="${C.ink}" stroke-width="3"/>
    <path d="M${x + 22} 52 L${x + 34} 58 C${x + 42} 64 ${x + 44} 76 ${x + 40} 92 L${x + 34} 150 C${x + 32} 172 ${x + 42} 186 ${x + 58} 186 C${x + 72} 186 ${x + 78} 176 ${x + 78} 162 L${x + 78} 148" fill="none" stroke="${C.brass}" stroke-width="12" stroke-linecap="round"/>`;
}
function chair(x) {
  return `<path d="M${x - 30} 150 L${x + 40} 150 M${x - 24} 150 L${x - 24} 214 M${x + 34} 150 L${x + 34} 214 M${x - 30} 150 L${x - 30} 70" stroke="${C.muted}" stroke-width="6" stroke-linecap="round"/>`;
}
function sittingPerson(x, arms = false, onBox = false) {
  const seat = onBox ? 140 : 146;
  return `<circle cx="${x + 10}" cy="${seat - 104}" r="20" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>
    <rect x="${x - 8}" y="${seat - 82}" width="38" height="80" rx="16" fill="${C.shirt}"/>
    <path d="M${x + 10} ${seat} L${x + 66} ${seat} L${x + 66} 212" fill="none" stroke="${C.pants}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    ${arms ? `<path d="M${x + 14} ${seat - 66} C${x + 30} ${seat - 40} ${x + 60} ${seat - 44} ${x + 110} ${seat - 44}" fill="none" stroke="${C.skin}" stroke-width="10" stroke-linecap="round"/>` : ''}`;
}
function torso({ expand }) {
  return `<circle cx="135" cy="40" r="26" fill="${C.skin}" stroke="${C.skinLine}" stroke-width="3"/>
    <path d="M90 70 L180 70 C${expand ? 214 : 196} 120 ${expand ? 214 : 196} 180 180 214 L90 214 C${expand ? 56 : 74} 180 ${expand ? 56 : 74} 120 90 70 Z" fill="${C.shirt}"/>
    <ellipse cx="135" cy="160" rx="${expand ? 46 : 34}" ry="30" fill="#E8A08A" opacity=".55"/>`;
}
function mpSide(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 22 L150 12 L150 46 L0 36 Z" fill="${C.mp}"/><path d="M0 36 L150 46 L150 52 L4 42 Z" fill="${C.reed}"/><rect x="96" y="6" width="26" height="50" rx="5" fill="none" stroke="#8A93A3" stroke-width="4"/></g>`;
}
function gauge() {
  return `<path d="M35 170 A100 100 0 0 1 235 170" fill="none" stroke="${C.floor}" stroke-width="20" stroke-linecap="round"/>
    <path d="M35 170 A100 100 0 0 1 93 88" fill="none" stroke="${C.red}" stroke-width="20" stroke-linecap="round" opacity=".55"/>
    <path d="M177 88 A100 100 0 0 1 235 170" fill="none" stroke="${C.red}" stroke-width="20" stroke-linecap="round" opacity=".55"/>
    <path d="M110 72 A100 100 0 0 1 160 72" fill="none" stroke="${C.green}" stroke-width="20"/>
    <line x1="135" y1="170" x2="135" y2="86" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><circle cx="135" cy="170" r="9" fill="${C.ink}"/>
    ${label(30, 204, L('floja', 'loose'), { color: C.red, size: 13 })}${label(240, 204, L('muerdes', 'biting'), { color: C.red, anchor: 'end', size: 13 })}${label(135, 52, L('bien', 'good'), { color: C.green, anchor: 'middle', size: 13 })}`;
}

export const artPanels = id => ART[id] || [];
export const ART_IDS = Object.keys(ART);
