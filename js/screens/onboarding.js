// Bienvenida: nomenclatura, nivel y estilos favoritos. Todo se puede cambiar después en Perfil.
import { $ } from '../ui.js';
import { register, go } from '../router.js';
import { getState, update } from '../store.js';
import { styleGridHtml } from './profile.js';

const LEVELS = [
  { id: 'new', title: 'Nunca he tocado', text: 'Empezamos por las cuerdas al aire.' },
  { id: 'basic', title: 'Sé lo básico', text: 'Conozco las cuerdas y algunos dedos. Abro las tres primeras unidades.' },
  { id: 'fluent', title: 'Toco con soltura', text: 'Abro todo el curso para que vayas donde quieras.' },
];

const HERO = `<div class="ob-hero">
  <svg class="ob-staff" viewBox="0 0 320 120" aria-hidden="true">
    <g class="lines">${[30, 44, 58, 72, 86].map(y => `<line x1="0" x2="320" y1="${y}" y2="${y}"></line>`).join('')}</g>
    <text x="4" y="94" font-size="80" fill="currentColor" style="font-family:var(--f-music)">𝄞</text>
    ${[[110, 79], [160, 65], [210, 51], [260, 37]].map(([x, y]) => `<g class="n"><ellipse cx="${x}" cy="${y}" rx="9" ry="7" transform="rotate(-20 ${x} ${y})" fill="currentColor"></ellipse><line x1="${x + 8}" x2="${x + 8}" y1="${y}" y2="${y - 44}" stroke="currentColor" stroke-width="2"></line></g>`).join('')}
  </svg>
  <h1>Aprende violín tocando</h1>
  <p class="muted">La app te escucha por el micrófono, te dice si vas afinado y te lleva paso a paso desde las cuerdas al aire hasta canciones de tu estilo.</p>
</div>`;

let step = 0;
let draft = null;

const STEPS = [
  { render: () => HERO, valid: () => true },
  {
    render: () => `<h1>¿Cómo nombras las notas?</h1><div class="choice">
      <button type="button" data-nom="eu" aria-pressed="${draft.nom === 'eu'}"><b>Do · Re · Mi</b><small>Nomenclatura latina, la de España y Latinoamérica</small></button>
      <button type="button" data-nom="us" aria-pressed="${draft.nom === 'us'}"><b>G3 · A4 · E5</b><small>Nomenclatura americana, con número de octava</small></button></div>`,
    valid: () => true,
  },
  {
    render: () => `<h1>¿Has tocado antes el violín?</h1><div class="choice">${LEVELS.map(l => `<button type="button" data-level="${l.id}" aria-pressed="${draft.level === l.id}"><b>${l.title}</b><small>${l.text}</small></button>`).join('')}</div>`,
    valid: () => true,
  },
  {
    render: () => `<h1>¿Qué música te gusta?</h1><p class="muted">Desde la unidad 4 el curso incluye canciones de estos estilos. Elige uno o varios; podrás cambiarlos cuando quieras.</p><div class="style-grid">${styleGridHtml(draft.styles)}</div>`,
    valid: () => draft.styles.length > 0,
  },
];

function render() {
  $('obDots').innerHTML = STEPS.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('');
  $('obStep').innerHTML = STEPS[step].render();
  $('obBack').hidden = step === 0;
  $('obNext').textContent = step === 0 ? 'Empezar' : step === STEPS.length - 1 ? 'Ir al curso' : 'Continuar';
  $('obNext').disabled = !STEPS[step].valid();
}

function enter() {
  const s = getState();
  draft = { nom: s.nom, level: s.level, styles: s.styles };
  step = 0;
  render();
}

register('onboarding', { enter });

$('obStep').addEventListener('click', e => {
  const nom = e.target.closest('[data-nom]');
  const level = e.target.closest('[data-level]');
  const style = e.target.closest('[data-style]');
  if (nom) draft = { ...draft, nom: nom.dataset.nom };
  if (level) draft = { ...draft, level: level.dataset.level };
  if (style) {
    const id = style.dataset.style;
    draft = { ...draft, styles: draft.styles.includes(id) ? draft.styles.filter(s => s !== id) : [...draft.styles, id] };
  }
  if (nom || level || style) render();
});
$('obBack').addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
$('obNext').addEventListener('click', () => {
  if (step < STEPS.length - 1) { step++; render(); return; }
  update({ ...draft, onboarded: true, unlockAll: draft.level === 'fluent' });
  go('learn');
});
