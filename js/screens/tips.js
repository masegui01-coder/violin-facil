// Consejos de técnica: arriba los personalizados (lo que el detector ve en lo que tocas) y debajo todos los del
// instrumento, cada uno con su ilustración por pasos, cómo comprobarlo, errores típicos y la bibliografía.
import { $, esc, icon } from '../ui.js';
import { register, go } from '../router.js';
import { getState } from '../store.js';
import { instrumentById } from '../instruments.js';
import { tipsFor, tipOfKind, SOURCES } from '../tips.js';
import { artPanels } from '../tips-art.js';
import { photoFor, photoHtml } from '../tips-photos.js';
import { adviceNow } from './tips-advice.js';

const GOTO = { tuner: 'Abrir el afinador', longtone: 'Hacer notas tenidas', metro: 'Abrir el metrónomo' };

function adviceHtml(advice, instId) {
  if (!advice.ready) {
    const pct = Math.round(Math.min(1, advice.progress || 0) * 100);
    // Estado vacío: sin nada tocado aún, una ilustración y una frase (no una barra vacía)
    if (!pct) {
      return `<div class="panel tip-box tip-coach tip-empty"><span class="tip-empty-art" aria-hidden="true">${icon('tips')}</span>
        <div><h2>Consejos para ti</h2><p class="muted">Toca tus primeras lecciones y aquí aparecerán consejos de técnica hechos a tu medida.</p></div></div>`;
    }
    return `<div class="panel tip-box tip-coach"><h2>Consejos para ti</h2>
      <p class="muted">Toca unas cuantas lecciones más y aquí te diré qué detalle de técnica puede estar haciendo que se te vayan las notas.</p>
      <div class="bar-track" role="progressbar" aria-label="Datos para tus consejos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div></div>`;
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
