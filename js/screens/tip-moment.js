// Tarjeta «Técnica en 30 segundos» encima de «Continuar» (Por mi cuenta): el consejo de la lección que viene, con su
// primera ilustración. Se cierra con ✕ o al empezar la lección, y no vuelve a salir para ese instrumento.
// Se descarga aparte (tips.js y sus dibujos pesan): Aprender la pinta cuando el módulo llega.
import { esc, icon } from '../ui.js';
import { go } from '../router.js';
import { getState, update } from '../store.js';
import { artPanels } from '../tips-art.js';
import { photoFor, photoHtml } from '../tips-photos.js';
import { tipForLesson, markSeen } from '../tip-moments.js';

const seenOf = s => (s.tipMoments || {})[s.instrument] || [];

function figureHtml(tip) {
  const step = tip.steps[0];
  const photo = photoFor(tip.art, 0);
  const art = photo ? photoHtml(photo, step.t) : artPanels(tip.art)[0] || '';
  return art ? `<div class="tip-figure tip-moment-fig">${art}</div>` : '';
}

export function seeTip(kind) {
  const s = getState();
  update({ tipMoments: markSeen(s.tipMoments, s.instrument, kind) });
}

// box: el hueco de la tarjeta; lesson: la siguiente lección; first: aún no ha superado ningún nivel
export function renderTipMoment(box, lesson, { first = false } = {}) {
  const s = getState();
  const tip = tipForLesson(s.instrument, lesson, { first, seen: seenOf(s) });
  box.dataset.tip = tip ? tip.kind : '';
  if (!tip) { box.replaceChildren(); return; }
  box.innerHTML = `<aside class="tip-moment" aria-labelledby="tipMomentTitle">
    ${figureHtml(tip)}
    <div class="tip-moment-text">
      <p class="eyebrow"><span class="ic" aria-hidden="true">${icon('tips')}</span>Técnica en 30 segundos</p>
      <h2 id="tipMomentTitle">${esc(tip.title)}</h2>
      <p class="small">${esc(tip.intro)}</p>
      <button type="button" class="btn ghost small" id="tipMomentMore">Ver cómo se hace</button>
    </div>
    <button type="button" class="icon-btn tip-moment-close" id="tipMomentClose" aria-label="Ocultar este consejo">✕</button>
  </aside>`;
  box.querySelector('#tipMomentMore').addEventListener('click', () => { seeTip(tip.kind); go('tips', { kind: tip.kind }); });
  box.querySelector('#tipMomentClose').addEventListener('click', () => {
    seeTip(tip.kind);
    box.replaceChildren();
    box.dataset.tip = '';
    document.getElementById('continueBtn')?.focus();
  });
}
