// Consejos de técnica: arriba los personalizados (lo que el detector ve en lo que tocas) y debajo todos los del
// instrumento, cada uno con su ilustración por pasos, cómo comprobarlo, errores típicos y la bibliografía.
import { $, esc } from '../ui.js';
import { register, go } from '../router.js';
import { getState, update } from '../store.js';
import { instrumentById } from '../instruments.js';
import { coachAdvice } from '../coach.js';
import { tipsFor, tipOfKind, SOURCES } from '../tips.js';
import { artPanels } from '../tips-art.js';
import { photoFor, photoHtml } from '../tips-photos.js';
import { L } from '../tips-l10n.js';

// Textos fijos de la pantalla (y de la herramienta en Estudio y del resultado), con su traducción
[
  ['Consejos', 'Tips'], ['Consejos para ti', 'Tips for you'], ['Comprueba:', 'Check:'], ['Evita:', 'Avoid:'], ['Fuentes', 'Sources'],
  ['Prueba esto:', 'Try this:'], ['Ver cómo se hace:', 'See how it is done:'], ['Consejos de técnica', 'Technique tips'],
  ['Embocadura, postura y respiración, y qué corregir según cómo tocas', 'Embouchure, posture and breathing, and what to fix based on how you play'],
  ['Postura, arco y mano izquierda, y qué corregir según cómo tocas', 'Posture, bow and left hand, and what to fix based on how you play'],
  ['Postura y las dos manos, y qué corregir según cómo tocas', 'Posture and both hands, and what to fix based on how you play'],
  ['Postura y posición de la mano, y qué corregir según cómo tocas', 'Posture and hand position, and what to fix based on how you play'],
  ['Postura y golpe, y qué corregir según cómo tocas', 'Posture and stroke, and what to fix based on how you play'],
  ['Consejo para ti', 'A tip for you'], ['Ver por qué y cómo se hace', 'See why and how to do it'],
  ['A partir de lo que has tocado con este instrumento.', 'Based on what you have played on this instrument.'],
  ['Toca unas cuantas lecciones más y aquí te diré qué detalle de técnica puede estar haciendo que se te vayan las notas.', 'Play a few more lessons and I will tell you here which technique detail may be pulling your notes off.'],
  ['No veo ningún fallo que se repita: sigue así. Revisa de vez en cuando los básicos de abajo.', 'I do not see any repeated mistake: keep it up. Review the basics below from time to time.'],
  ['Pronto habrá consejos para este instrumento.', 'Tips for this instrument are coming soon.'],
  ['Abrir el afinador', 'Open the tuner'], ['Hacer notas tenidas', 'Do long notes'], ['Abrir el metrónomo', 'Open the metronome'],
].forEach(([es, en]) => L(es, en));

const RESULT_TIP_DAYS = 3; // un mismo consejo personalizado no se repite en el resultado antes de estos días
const DAY_MS = 864e5;

export function adviceNow() {
  const s = getState();
  const inst = instrumentById(s.instrument);
  return coachAdvice(inst, (s.tuning || {})[s.instrument] || {}, (s.coach || {})[s.instrument], { recentAcc: s.recentAcc || [] });
}

// El consejo que se enseña al terminar una lección: el primero que no se haya visto hace poco
export function freshAdvice(now = Date.now()) {
  const s = getState();
  const seen = s.tipsSeen || {};
  const item = adviceNow().items.find(i => !seen[`${s.instrument}:${i.id}`] || now - seen[`${s.instrument}:${i.id}`] > RESULT_TIP_DAYS * DAY_MS);
  return item || null;
}

export function markAdviceSeen(item, now = Date.now()) {
  const s = getState();
  update({ tipsSeen: { ...(s.tipsSeen || {}), [`${s.instrument}:${item.id}`]: now } });
}

const GOTO = { tuner: 'Abrir el afinador', longtone: 'Hacer notas tenidas', metro: 'Abrir el metrónomo' };

function adviceHtml(advice, instId) {
  if (!advice.ready) {
    return `<div class="panel tip-box tip-coach"><h2>Consejos para ti</h2>
      <p class="muted">Toca unas cuantas lecciones más y aquí te diré qué detalle de técnica puede estar haciendo que se te vayan las notas.</p>
      <div class="bar-track"><i style="width:${Math.round(Math.min(1, advice.progress) * 100)}%"></i></div></div>`;
  }
  if (!advice.items.length) {
    return `<div class="panel tip-box tip-coach ok"><h2>Consejos para ti</h2><p>No veo ningún fallo que se repita: sigue así. Revisa de vez en cuando los básicos de abajo.</p></div>`;
  }
  return `<div class="panel tip-box tip-coach"><h2>Consejos para ti</h2><p class="muted small">A partir de lo que has tocado con este instrumento.</p>
    ${advice.items.map(i => {
      const tip = tipOfKind(instId, i.tip);
      return `<div class="tip-advice">
        <h3>${esc(i.title)}</h3>
        <p class="tip-evidence">${i.evidence.map(e => `<span class="pill">${esc(e.label)}: <b>${esc(e.value)}</b></span>`).join(' ')}</p>
        <p>${esc(i.why)}</p>
        <p><b>Prueba esto:</b> <span>${esc(i.action)}</span></p>
        <div class="row">${tip ? `<button type="button" class="btn small" data-tip-jump="${esc(tip.kind)}"><span>Ver cómo se hace:</span> <span>${esc(tip.title)}</span></button>` : ''}
        ${i.goto ? `<button type="button" class="btn ghost small" data-tip-go="${esc(i.goto)}">${esc(GOTO[i.goto])}</button>` : ''}</div>
      </div>`;
    }).join('')}</div>`;
}

function tipHtml(tip) {
  const panels = artPanels(tip.art);
  return `<article class="panel tip-box tip-card" id="tip-${esc(tip.kind)}">
    <h2>${esc(tip.title)}</h2>
    <p>${esc(tip.intro)}</p>
    <ol class="tip-steps">${tip.steps.map((s, i) => `<li class="tip-step">
      <div class="tip-figure">${photoFor(tip.art, i) ? photoHtml(photoFor(tip.art, i), s.t) : panels[i] || ''}<span class="tip-num">${i + 1}</span></div>
      <p><b>${esc(s.t)}</b><br>${esc(s.d)}</p></li>`).join('')}</ol>
    <p class="tip-check"><b>Comprueba:</b> <span>${esc(tip.check)}</span></p>
    ${tip.avoid && tip.avoid.length ? `<p class="tip-avoid"><b>Evita:</b></p><ul class="tip-avoid-list">${tip.avoid.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    <details class="tip-sources"><summary>Fuentes</summary><ul>${tip.sources.map(k => `<li>${esc(SOURCES[k])}</li>`).join('')}</ul></details>
  </article>`;
}

function render({ kind } = {}) {
  const s = getState();
  const inst = instrumentById(s.instrument);
  const tips = tipsFor(s.instrument);
  $('tipsTitle').innerHTML = `<span>Consejos</span> · <span>${esc(inst.name)}</span>`;
  $('tipsBody').innerHTML = adviceHtml(adviceNow(), s.instrument)
    + (tips.length ? tips.map(tipHtml).join('') : '<p class="muted">Pronto habrá consejos para este instrumento.</p>');
  if (kind) requestAnimationFrame(() => jump(kind));
}

function jump(kind) {
  const el = document.getElementById('tip-' + kind);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

register('tips', { enter: render });

$('tipsBody').addEventListener('click', e => {
  const j = e.target.closest('[data-tip-jump]');
  if (j) { jump(j.dataset.tipJump); return; }
  const g = e.target.closest('[data-tip-go]');
  if (g) go(g.dataset.tipGo);
});
