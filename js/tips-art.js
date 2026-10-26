// Ilustraciones de los consejos: cada una son 2-3 viñetas (una por paso). Se dibujan en SVG dentro de la página,
// así los rótulos se traducen como el resto del texto. Colores fijos de ilustración (sobre fondo claro siempre).
import { L } from './tips-l10n.js';

import { C, panel, arrow, label } from './tips-art-kit.js';
import { VIOLIN_ART } from './tips-art-violin.js';
import { reedArt } from './tips-art-reeds.js';
import { FLUTE_ART } from './tips-art-flutes.js';
import { BRASS_ART } from './tips-art-brass.js';
import { STRING_ART } from './tips-art-strings.js';
import { KEYS_ART } from './tips-art-keys.js';
import { HAND_PANELS } from './tips-art-hands-panels.js';
import { CELLO_ART } from './tips-art-cello.js';
import { UKE_ART } from './tips-art-uke.js';

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

  ...VIOLIN_ART,
};

// El resto de instrumentos, por familias
Object.assign(ART, reedArt(ART['reed-lip']), FLUTE_ART, BRASS_ART, STRING_ART, KEYS_ART, CELLO_ART);

// Viñetas de manos redibujadas (sustituyen a la del mismo número)
Object.entries(HAND_PANELS).forEach(([id, panels]) => {
  ART[id] = ART[id].map((p, i) => panels[i] || p);
});
// el ukelele: su mástil de cuatro cuerdas y su mano derecha (la viñeta 2 de pisar es la misma que en guitarra)
ART['uke-fretting'] = [UKE_ART['uke-fretting'][0], ART.fretting[1], UKE_ART['uke-fretting'][2]];
ART['uke-right'] = UKE_ART['uke-right'];
// el oboe se sujeta como el clarinete: comparte esas dos viñetas
ART['oboe-hold'] = [ART['woodwind-hold'][0], ART['woodwind-hold'][1], ART['oboe-hold'][2]];

export const artPanels = id => ART[id] || [];
export const ART_IDS = Object.keys(ART);
