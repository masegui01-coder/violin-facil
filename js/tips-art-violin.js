// Ilustraciones del violín: sujeción, arco y mano izquierda. Dibujo detallado (violín con su forma, manos, bien/mal)
// para que cada viñeta se entienda sin leer el texto.
import { L } from './tips-l10n.js';
import { C, panel, arrow, label, ok, bad, dashed } from './tips-art-kit.js';

const V = { body: '#C2742F', edge: '#6E3B12', board: '#1C1C1C', bridge: '#F1E2C6', hair: '#EFE7D6', stick: '#5B3414', chin: '#2A2A2A', rest: '#3A3F48' };
const SKIN = C.skin;
const SKIN_LINE = C.skinLine;

// Violín visto desde arriba, en vertical (voluta arriba), centrado en el cuerpo. Unidades: el cuerpo mide ~146.
function violinTop() {
  const body = 'M0 -72 C20 -72 34 -62 34 -44 C34 -28 22 -22 20 -12 C18 -2 20 6 24 12 C38 22 40 40 38 52 C36 66 22 74 0 74 C-22 74 -36 66 -38 52 C-40 40 -38 22 -24 12 C-20 6 -18 -2 -20 -12 C-22 -22 -34 -28 -34 -44 C-34 -62 -20 -72 0 -72 Z';
  const fHole = side => `<path d="M${side * 15} 6 c${side * -5} 4 ${side * 5} 10 0 14 c${side * -5} 4 ${side * 5} 10 0 14" fill="none" stroke="${V.edge}" stroke-width="2.4" stroke-linecap="round"/>`;
  return `<path d="${body}" fill="${V.body}" stroke="${V.edge}" stroke-width="2.5"/>
    <path d="${body}" fill="none" stroke="#E9B07A" stroke-width="1" transform="scale(.9)" opacity=".8"/>
    ${fHole(1)}${fHole(-1)}
    <path d="M-5 -150 L5 -150 L4 -174 L-4 -174 Z" fill="${V.body}" stroke="${V.edge}" stroke-width="1.5"/>
    <rect x="-11" y="-170" width="6" height="4" rx="1" fill="${V.chin}"/><rect x="5" y="-162" width="6" height="4" rx="1" fill="${V.chin}"/>
    <rect x="-11" y="-160" width="6" height="4" rx="1" fill="${V.chin}"/><rect x="5" y="-170" width="6" height="4" rx="1" fill="${V.chin}"/>
    <circle cx="0" cy="-181" r="8" fill="${V.body}" stroke="${V.edge}" stroke-width="1.8"/><path d="M0 -181 m-4 0 a4 4 0 1 1 4 4" fill="none" stroke="${V.edge}" stroke-width="1.4"/>
    <rect x="-7" y="-150" width="14" height="160" rx="3" fill="${V.board}"/>
    <rect x="-16" y="22" width="32" height="5" rx="1.5" fill="${V.bridge}" stroke="#A9926A" stroke-width="1"/>
    <path d="M-8 42 L8 42 L5 68 L-5 68 Z" fill="${V.board}"/>
    <ellipse cx="-21" cy="62" rx="15" ry="9" fill="${V.chin}"/>
    ${[-4.5, -1.5, 1.5, 4.5].map(x => `<line x1="${x}" y1="-150" x2="${x * 0.9}" y2="44" stroke="#E8E8E8" stroke-width=".9"/>`).join('')}`;
}
const violinAt = (x, y, rot, s) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${violinTop()}</g>`;

// Persona de frente (hasta el pecho): cabeza con cara, cuello, hombros y clavículas
function frontPerson(cx, cy) {
  return `<path d="M${cx - 92} 232 C${cx - 92} ${cy + 70} ${cx - 70} ${cy + 52} ${cx - 30} ${cy + 46} L${cx + 30} ${cy + 46} C${cx + 70} ${cy + 52} ${cx + 92} ${cy + 70} ${cx + 92} 232 Z" fill="${C.shirt}"/>
    <path d="M${cx - 30} ${cy + 46} L${cx} ${cy + 76} L${cx + 30} ${cy + 46} Z" fill="${SKIN}"/>
    <rect x="${cx - 11}" y="${cy + 22}" width="22" height="30" fill="${SKIN}"/>
    <path d="M${cx - 6} ${cy + 52} C${cx - 18} ${cy + 50} ${cx - 34} ${cy + 52} ${cx - 44} ${cy + 56}" fill="none" stroke="${SKIN_LINE}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M${cx + 6} ${cy + 52} C${cx + 18} ${cy + 50} ${cx + 34} ${cy + 52} ${cx + 44} ${cy + 56}" fill="none" stroke="${SKIN_LINE}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="${cx}" cy="${cy}" rx="27" ry="31" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.5"/>
    <path d="M${cx - 26} ${cy - 8} C${cx - 26} ${cy - 34} ${cx + 26} ${cy - 34} ${cx + 26} ${cy - 8} C${cx + 18} ${cy - 22} ${cx - 18} ${cy - 22} ${cx - 26} ${cy - 8} Z" fill="#6B4A2E"/>
    <circle cx="${cx - 10}" cy="${cy - 2}" r="2.6" fill="${C.ink}"/><circle cx="${cx + 10}" cy="${cy - 2}" r="2.6" fill="${C.ink}"/>
    <path d="M${cx} ${cy + 1} L${cx - 3} ${cy + 12} L${cx + 3} ${cy + 12}" fill="none" stroke="${SKIN_LINE}" stroke-width="2"/>
    <path d="M${cx - 7} ${cy + 19} Q${cx} ${cy + 23} ${cx + 7} ${cy + 19}" fill="none" stroke="${C.lip}" stroke-width="2.4" stroke-linecap="round"/>`;
}

// Mano derecha sujetando el arco, vista desde delante (crin abajo)
function bowHold() {
  const finger = (x, len) => `<path d="M${x - 9} 92 C${x - 11} 108 ${x - 8} ${118 + len} ${x} ${124 + len} C${x + 8} ${118 + len} ${x + 11} 108 ${x + 9} 92 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.2"/>
    <path d="M${x - 7} 112 Q${x} 116 ${x + 7} 112" fill="none" stroke="${SKIN_LINE}" stroke-width="1.4"/>`;
  return `<line x1="6" y1="116" x2="266" y2="110" stroke="${V.stick}" stroke-width="6" stroke-linecap="round"/>
    <line x1="96" y1="140" x2="266" y2="126" stroke="${V.hair}" stroke-width="4"/>
    <path d="M40 118 L98 117 L98 138 C80 144 58 144 44 138 Z" fill="${V.board}"/>
    <rect x="94" y="116" width="8" height="25" fill="${C.silver}"/>
    <circle cx="60" cy="129" r="4" fill="#E7D9B5"/>
    <path d="M96 96 C100 70 130 58 168 60 C196 62 210 78 206 96 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.2"/>
    ${finger(196, 6)}${finger(172, 14)}${finger(148, 12)}
    <path d="M118 96 C110 82 102 80 96 88 C90 96 92 108 100 112" fill="none" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/>
    <path d="M118 96 C110 82 102 80 96 88 C90 96 92 108 100 112" fill="none" stroke="${SKIN_LINE}" stroke-width="1.6"/>
    <circle cx="100" cy="112" r="2" fill="${C.green}"/>
    <path d="M150 176 C136 176 128 162 134 150 L146 132 C150 126 158 128 156 136 L152 150 C150 160 156 170 150 176 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.2"/>
    <path d="M150 176 C150 196 160 214 172 232" fill="none" stroke="${SKIN}" stroke-width="24" stroke-linecap="round"/>`;
}

// Cabeza de perfil (mirando a la derecha)
function profileHead(dx = 0, dy = 0) {
  return `<g transform="translate(${dx} ${dy})">
    <path d="M70 34 C100 18 136 26 146 52 L154 70 L146 74 C149 84 146 90 140 92 C140 100 134 106 124 108 C112 112 96 112 84 104 C66 94 58 76 58 60 C58 48 62 40 70 34 Z" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2.5"/>
    <path d="M60 46 C66 28 98 18 126 26 C108 26 90 34 80 50 Z" fill="#6B4A2E"/>
    <ellipse cx="86" cy="66" rx="7" ry="10" fill="${SKIN}" stroke="${SKIN_LINE}" stroke-width="2"/>
    <circle cx="132" cy="54" r="2.6" fill="${C.ink}"/>
    <path d="M136 86 L144 86" stroke="${C.lip}" stroke-width="2.4" stroke-linecap="round"/></g>`;
}

export const VIOLIN_ART = {
  'violin-hold': [
    // 1. El violín apoyado en la clavícula izquierda (a la derecha del dibujo: la persona nos mira)
    panel(`${frontPerson(92, 62)}
      <path d="M128 112 C140 104 160 102 172 108 L170 116 C158 112 142 114 130 120 Z" fill="${V.rest}"/>
      ${violinAt(152, 80, 65, 0.55)}
      <circle cx="140" cy="113" r="9" fill="none" stroke="${C.green}" stroke-width="3"/>
      ${arrow('M222 182 L150 120')}${label(222, 204, L('clavícula', 'collarbone'), { anchor: 'middle' })}`),
    // 2. La cabeza descansa sobre la barbada: su peso sujeta el violín; el hombro, abajo y suelto
    panel(`<path d="M20 232 C26 176 60 158 96 152 L190 152 C230 158 256 184 260 232 Z" fill="${C.shirt}"/>
      <rect x="92" y="100" width="26" height="56" fill="${SKIN}"/>
      ${profileHead(0, 2)}
      <path d="M102 132 C102 124 108 122 116 122 L200 122 C208 122 212 126 212 132 L212 144 C212 150 208 152 200 152 L116 152 C108 152 102 150 102 144 Z" fill="${V.body}" stroke="${V.edge}" stroke-width="2"/>
      <line x1="104" y1="137" x2="210" y2="137" stroke="${V.edge}" stroke-width="1" opacity=".6"/>
      <path d="M212 126 L252 124 L252 130 L212 134 Z" fill="${V.board}"/>
      <circle cx="258" cy="126" r="7" fill="${V.body}" stroke="${V.edge}" stroke-width="1.8"/>
      <path d="M100 116 C104 108 132 106 144 112 L146 124 L104 126 Z" fill="${V.chin}"/>
      <path d="M118 154 C130 150 150 150 164 154 L162 160 L120 162 Z" fill="${V.rest}"/>
      ${arrow('M112 0 L112 28')}${label(124, 18, L('peso de la cabeza', 'head weight'))}
      ${ok(238, 196)}${label(206, 222, L('hombro bajo', 'shoulder down'), { color: '#fff', anchor: 'middle', size: 13 })}`),
    // 3. Hacia la izquierda y un poco hacia arriba: la voluta a la altura de la nariz
    panel(`${frontPerson(96, 64)}
      ${violinAt(147, 96, 81, 0.57)}
      ${dashed('M100 78 L262 78')}
      <circle cx="96" cy="76" r="4" fill="${C.green}"/><circle cx="251" cy="78" r="5" fill="none" stroke="${C.green}" stroke-width="2.5"/>
      ${label(258, 64, L('voluta = nariz', 'scroll = nose'), { anchor: 'end', size: 13 })}`),
  ],

  'violin-bow': [
    // 1. Agarre: pulgar doblado frente al dedo medio, meñique curvo de pie sobre la vara
    panel(`${bowHold()}
      ${arrow('M84 196 L132 160')}${label(30, 214, L('pulgar doblado', 'bent thumb'), { size: 13 })}
      ${arrow('M60 58 L92 84')}${label(40, 46, L('meñique de pie', 'pinky standing'), { size: 13 })}
      ${ok(240, 28)}`),
    // 2. Visto desde arriba: el arco cruza recto (paralelo al puente), entre el puente y el diapasón
    panel(`<g transform="translate(130 92) scale(1.15)">${violinTop()}</g>
      <line x1="4" y1="108" x2="266" y2="108" stroke="${V.stick}" stroke-width="5" stroke-linecap="round"/>
      <line x1="4" y1="113" x2="266" y2="113" stroke="${V.hair}" stroke-width="3"/>
      <path d="M140 108 L140 98 L130 98" fill="none" stroke="${C.green}" stroke-width="2"/>
      <path d="M178 96 L200 82" stroke="${C.ink}" stroke-width="1.2"/>${label(202, 82, L('diapasón', 'fingerboard'), { color: C.ink, size: 12 })}
      <path d="M150 120 L200 140" stroke="${C.ink}" stroke-width="1.2"/>${label(202, 146, L('puente', 'bridge'), { color: C.ink, size: 12 })}
      ${ok(238, 196)}`),
    // 3. Cada cuerda, una altura del brazo: el puente es curvo y el arco toca solo la cuerda marcada.
    //    Sol pide el codo alto y Mi el codo bajo (la barra verde de cada viñeta).
    panel(`${(() => {
      const strings = [[L('Sol', 'G'), -114], [L('Re', 'D'), -100], [L('La', 'A'), -80], [L('Mi', 'E'), -66]];
      return strings.map(([name, deg], k) => {
        const ox = 8 + (k % 2) * 132;
        const oy = 30 + Math.floor(k / 2) * 100;
        const cx = ox + 58, cy = oy + 128, R = 70;
        const at = d => { const r = d * Math.PI / 180; return [cx + R * Math.cos(r), cy + R * Math.sin(r)]; };
        const [lx, ly] = at(-124);
        const [rx, ry] = at(-56);
        const bridge = `<path d="M${lx.toFixed(1)} ${oy + 94} L${lx.toFixed(1)} ${ly.toFixed(1)} A${R} ${R} 0 0 1 ${rx.toFixed(1)} ${ry.toFixed(1)} L${rx.toFixed(1)} ${oy + 94} Z" fill="${V.bridge}" stroke="#A9926A" stroke-width="1.5"/>`;
        const dots = strings.map(([, d], i) => { const [x, y] = at(d); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === k ? 5 : 3.2}" fill="${i === k ? C.green : '#777'}"/>`; }).join('');
        const r = deg * Math.PI / 180;
        const [px, py] = at(deg);
        const nx = Math.cos(r), ny = Math.sin(r); // hacia fuera del puente
        const tx = -ny, ty = nx;                  // tangente: la dirección del arco
        const bx = px + nx * 5, by = py + ny * 5;
        const bow = `<line x1="${(bx - tx * 54).toFixed(1)}" y1="${(by - ty * 54).toFixed(1)}" x2="${(bx + tx * 54).toFixed(1)}" y2="${(by + ty * 54).toFixed(1)}" stroke="${V.stick}" stroke-width="4" stroke-linecap="round"/>`;
        const meter = `<rect x="${ox + 112}" y="${oy + 10}" width="6" height="74" rx="3" fill="#E9E2D8"/><rect x="${ox + 109}" y="${oy + 12 + k * 18}" width="12" height="10" rx="3" fill="${C.green}"/>`;
        return `<rect x="${ox}" y="${oy}" width="126" height="94" rx="10" fill="#FBF8F4" stroke="#E2D7CB"/>${bridge}${dots}${bow}${meter}${label(ox + 8, oy + 18, name, { color: C.ink, size: 14 })}`;
      }).join('');
    })()}
      ${label(262, 20, L('verde = altura del codo', 'green = elbow height'), { size: 11, anchor: 'end' })}`),
  ],

  'violin-left': [
    // 1. Muñeca recta (bien) frente a muñeca doblada con la palma pegada al mástil (mal)
    panel(`<rect x="10" y="44" width="110" height="14" rx="4" fill="${V.board}"/><rect x="10" y="58" width="110" height="10" rx="4" fill="${V.body}"/>
      <path d="M44 232 L72 120" stroke="${SKIN}" stroke-width="26" stroke-linecap="round"/>
      <path d="M72 120 L80 80" stroke="${SKIN}" stroke-width="22" stroke-linecap="round"/>
      <path d="M78 82 C80 58 96 40 108 44" fill="none" stroke="${SKIN}" stroke-width="10" stroke-linecap="round"/>
      <path d="M78 82 C78 62 88 46 96 44" fill="none" stroke="${SKIN_LINE}" stroke-width="1.5"/>
      ${dashed('M40 238 L84 66')}${ok(110, 200)}
      <rect x="150" y="44" width="110" height="14" rx="4" fill="${V.board}"/><rect x="150" y="58" width="110" height="10" rx="4" fill="${V.body}"/>
      <path d="M216 232 L232 150" stroke="${SKIN}" stroke-width="26" stroke-linecap="round"/>
      <path d="M232 150 C224 116 206 84 190 70" stroke="${SKIN}" stroke-width="22" stroke-linecap="round" fill="none"/>
      <path d="M190 70 C196 54 222 46 236 46" fill="none" stroke="${SKIN}" stroke-width="10" stroke-linecap="round"/>
      ${bad(250, 200)}${label(214, 102, L('palma pegada', 'palm on neck'), { color: C.red, size: 12, anchor: 'end' })}`),
    // 2. Corte del mástil: el pulgar enfrente, los dedos por arriba y un hueco entre la palma y el mástil
    panel(`<path d="M95 92 L175 92 L175 104 C175 136 158 150 135 150 C112 150 95 136 95 104 Z" fill="${V.body}" stroke="${V.edge}" stroke-width="2"/>
      <rect x="92" y="84" width="86" height="10" rx="3" fill="${V.board}"/>
      ${[108, 126, 144, 162].map(x => `<circle cx="${x}" cy="82" r="2.6" fill="#BBB"/>`).join('')}
      <path d="M92 180 C110 200 160 200 186 176" fill="none" stroke="${SKIN}" stroke-width="22" stroke-linecap="round"/>
      <path d="M70 200 C68 168 76 136 92 118" fill="none" stroke="${SKIN}" stroke-width="18" stroke-linecap="round"/>
      <path d="M186 176 C204 140 200 96 184 72 C174 60 158 60 152 70 L148 80" fill="none" stroke="${SKIN}" stroke-width="15" stroke-linecap="round"/>
      <path d="M112 158 C122 168 150 170 166 160" fill="${C.green}" opacity=".18" stroke="${C.green}" stroke-dasharray="4 4"/>
      ${label(135, 222, L('hueco', 'gap'), { anchor: 'middle' })}${arrow('M135 208 L135 172')}
      ${label(26, 108, L('pulgar', 'thumb'), { size: 13 })}${arrow('M48 114 L82 120')}`),
    // 3. Dedos de martillo: caen desde arriba, curvados, con la yema (bien) — dedo plano (mal)
    panel(`<rect x="8" y="168" width="254" height="16" rx="4" fill="${V.board}"/><line x1="8" y1="164" x2="262" y2="164" stroke="#BBB" stroke-width="2"/>
      <path d="M40 30 C80 40 104 70 112 104 C118 130 124 150 126 162" fill="none" stroke="${SKIN}" stroke-width="20" stroke-linecap="round"/>
      <path d="M40 30 C80 40 104 70 112 104 C118 130 124 150 126 162" fill="none" stroke="${SKIN_LINE}" stroke-width="1.5" opacity=".7"/>
      ${arrow('M150 60 L132 140')}${label(160, 56, L('cae desde arriba', 'drops from above'), { size: 12 })}${ok(78, 200)}
      <path d="M176 140 C200 150 230 156 256 160" fill="none" stroke="${SKIN}" stroke-width="18" stroke-linecap="round" opacity=".9"/>
      ${bad(222, 120)}${label(222, 96, L('plano', 'flat'), { color: C.red, size: 12, anchor: 'middle' })}`),
  ],
};
