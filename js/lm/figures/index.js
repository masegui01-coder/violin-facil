// Ilustraciones de la teoría del Nivel 1. Punto de entrada: el campo «dibujo» de cada tarjeta (u*.js) elige la figura.
//   figureHtml(dibujo, { lang, nom, still })  → '<figure class="lmf">…</figure>' o '' si no hay dibujo
//   bindFigures(root, play)                  → engancha «toca para oír» (play(partitura, { dyn, sound }))
//   CARD_FIGURE['lm1-u3-2'] → 'silencio-blanca'  (unidad-tarjeta, por si se prefiere un id estable)
// still: true con «reducir movimiento» o para el PDF: sin animaciones (el dibujo fijo explica lo mismo).
import * as A from './u1-u2.js';
import * as B from './u3-u4.js';
import * as C from './u5-u6.js';
import * as D from './u7-u8.js';
import { beginFigure, endFigure, esc } from './kit.js';
export { FIG_EN } from './kit.js';

const ALT = { ...A.ALT, ...B.ALT, ...C.ALT, ...D.ALT };
const ALL = { ...A, ...B, ...C, ...D };

// dibujo → [función, ¿animada?, ¿tocar para oír?]
const SPEC = {
  'corazones-pulso': ['corazonesPulso', true, true],
  negra: ['negra', true, true],
  'silencio-negra': ['silencioNegra', true, true],
  pentagrama: ['pentagrama', true, true],
  'clave-sol-sol-mi': ['claveSol', true, true],
  'andar-correr': ['andarCorrer', true, true],
  'compas-2-4': ['compas24', true, true],
  barras: ['barras', false, true],
  'nota-la': ['notaLa', false, true],
  blanca: ['blanca', true, true],
  'silencio-blanca': ['silencioBlanca', false, true],
  'compas-4-4': ['compas44', true, true],
  'do-linea-adicional': ['doLineaAdicional', false, true],
  'compas-3-4': ['compas34', true, true],
  'que-cabe': ['queCabe', false, false],
  repeticion: ['repeticion', true, true],
  pentatonica: ['pentatonica', false, true],
  escalera: ['escalera', true, true],
  'tonos-semitonos': ['tonosSemitonos', false, true],
  'fa-si-do': ['faSiDo', false, true],
  redonda: ['redonda', false, true],
  'escalera-matices': ['escaleraMatices', true, true],
  reguladores: ['reguladores', false, true],
  calderon: ['calderon', true, true],
  're-agudo': ['reAgudo', false, true],
  hermanas: ['hermanas', false, true],
  'escala-la-menor': ['escalaLaMenor', false, true],
  'terceras-modo': ['tercerasModo', false, true],
  'coma-respiracion': ['comaRespiracion', true, false],
  anacrusa: ['anacrusa', true, true],
  'anacrusa-final': ['anacrusaFinal', true, false],
  'pregunta-respuesta': ['preguntaRespuesta', false, true],
  'bocadillo-aba': ['bocadilloAba', false, false],
};

export const FIGURES = Object.fromEntries(Object.entries(SPEC).map(([id, [fn, anim, interactive]]) =>
  [id, { draw: ALL[fn], alt: ALT[fn], anim, interactive }]));

// Unidad-tarjeta → dibujo (orden de las tarjetas en teoria.ficha)
export const CARD_FIGURE = {
  'lm1-u1-1': 'corazones-pulso', 'lm1-u1-2': 'negra', 'lm1-u1-3': 'silencio-negra', 'lm1-u1-4': 'pentagrama', 'lm1-u1-5': 'clave-sol-sol-mi',
  'lm1-u2-1': 'andar-correr', 'lm1-u2-2': 'compas-2-4', 'lm1-u2-3': 'barras', 'lm1-u2-4': 'nota-la',
  'lm1-u3-1': 'blanca', 'lm1-u3-2': 'silencio-blanca', 'lm1-u3-3': 'compas-4-4', 'lm1-u3-4': 'do-linea-adicional',
  'lm1-u4-1': 'compas-3-4', 'lm1-u4-2': 'que-cabe', 'lm1-u4-3': 'repeticion', 'lm1-u4-4': 'pentatonica',
  'lm1-u5-1': 'escalera', 'lm1-u5-2': 'tonos-semitonos', 'lm1-u5-3': 'fa-si-do', 'lm1-u5-4': 'redonda',
  'lm1-u6-1': 'escalera-matices', 'lm1-u6-2': 'reguladores', 'lm1-u6-3': 'calderon', 'lm1-u6-4': 're-agudo',
  'lm1-u7-1': 'hermanas', 'lm1-u7-2': 'escala-la-menor', 'lm1-u7-3': 'terceras-modo', 'lm1-u7-4': 'coma-respiracion',
  'lm1-u8-1': 'anacrusa', 'lm1-u8-2': 'anacrusa-final', 'lm1-u8-3': 'pregunta-respuesta', 'lm1-u8-4': 'bocadillo-aba',
};

export function figureHtml(dibujo, o = {}) {
  const f = FIGURES[dibujo];
  if (!f?.draw) return '';
  beginFigure();
  const drawn = f.draw(o);
  const chips = endFigure();
  const en = o.lang === 'en';
  const hint = f.interactive ? `<figcaption class="lmf-hint">${en ? 'Tap the drawing to hear it' : 'Toca el dibujo para oírlo'}</figcaption>` : '';
  // Los botones de las zonas pequeñas (teclas, notas sueltas…): de verdad, a tamaño de dedo y con su nombre visible
  const row = chips.length ? `<div class="lmf-chips" role="group" aria-label="${en ? 'Listen' : 'Escuchar'}">${chips
    .map(c => `<button type="button" class="lmf-chip" data-play="${esc(c.play)}"${c.extra}>${esc(c.label)}</button>`).join('')}</div>` : '';
  // Con la letra grande, la explicación del dibujo también va escrita debajo (el texto del SVG no crece)
  const words = `<p class="lmf-words" aria-hidden="true">${esc(en ? f.alt.en : f.alt.es)}</p>`;
  return `<figure class="lmf${o.still ? ' still' : ''}${o.big ? ' big' : ''}" data-fig="${dibujo}">${drawn}${hint}${row}${words}</figure>`;
}

// «Toca para oír»: clic (y en las zonas role="button" del dibujo, también Intro o Espacio) en cada [data-play].
// play la pone la app (p. ej. playQuestion del curso).
export function bindFigures(root, play) {
  const fire = async el => {
    el.classList.add('lmf-playing');
    try { await play(el.dataset.play, { dyn: el.dataset.dyn || null, sound: el.dataset.sound || null }); }
    finally { el.classList.remove('lmf-playing'); }
  };
  root.querySelectorAll('.lmf [data-play]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); fire(el); });
    if (el.tagName === 'BUTTON') return; // un botón ya responde a Intro y Espacio con su clic
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation();
      fire(el);
    });
  });
}
