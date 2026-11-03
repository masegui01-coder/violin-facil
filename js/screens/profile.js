// Pestaña Perfil: estadísticas, instrumento, estilos de música, objetivo e insignias.
// Los ajustes (idioma, apariencia, privacidad y la cuenta) tienen su propia pantalla: settings.js.
import { $, esc, toast } from '../ui.js';
import { register, go } from '../router.js';
import { STYLES } from '../songs.js';
import { BADGES } from '../engage.js';
import { renderProgress } from './progress-ui.js';
import { instrumentCardsHtml as instrumentGridHtml } from './instrument-picker.js';
import { getState, update, subscribe, resetProgress, currentStreak, instrumentProgress } from '../store.js';
import { openPlacementIntro } from './placement-ui.js';
import { applyAppearance } from '../appearance.js';

export { instrumentGridHtml };



export function styleGridHtml(selected) {
  return STYLES.map(s => `<button type="button" class="style-opt" data-style="${s.id}" aria-pressed="${selected.includes(s.id)}" style="--chip:${s.color}">
    <b>${esc(s.name)}</b><small>${esc(s.blurb)}</small></button>`).join('');
}

// Alterna un estilo sin dejar la lista vacía
export function toggleStyle(styles, id) {
  if (!styles.includes(id)) return [...styles, id];
  return styles.length > 1 ? styles.filter(s => s !== id) : styles;
}

let confirmReset = false;

function render() {
  const s = getState();
  const done = Object.values(instrumentProgress()).filter(v => v > 0).length;
  $('stats').innerHTML = [
    [currentStreak(s.streak), 'días seguidos'], [s.xp, 'puntos'], [done, 'lecciones hechas'],
  ].map(([n, label]) => `<div class="stat"><b>${n}</b><span>${label}</span></div>`).join('');
  renderProgress();
  $('profileStyles').innerHTML = styleGridHtml(s.styles);
  document.querySelectorAll('[data-set-goal]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.setGoal) === s.dailyGoal));
  $('profileBadges').innerHTML = BADGES.map(b => `<div class="badge${s.badges.includes(b.id) ? ' on' : ''}" title="${esc(b.desc)}"><span>${s.badges.includes(b.id) ? '★' : '·'}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('');
  $('profileInstruments').innerHTML = instrumentGridHtml(s.instrument);
  document.querySelectorAll('[data-set-a4]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.setA4) === s.a4));
  confirmReset = false;
  $('resetProgress').textContent = 'Borrar progreso';
}

register('profile', { enter: render });

$('profileStyles').addEventListener('click', e => {
  const b = e.target.closest('[data-style]');
  if (!b) return;
  const before = getState().styles;
  const styles = toggleStyle(before, b.dataset.style);
  if (styles === before) { toast('Deja al menos un estilo elegido'); return; }
  update({ styles });
  render();
  toast('Lecciones «Tu música» actualizadas');
});
$('profileInstruments').addEventListener('click', e => {
  const b = e.target.closest('[data-inst]');
  if (!b || b.dataset.inst === getState().instrument) return;
  update({ instrument: b.dataset.inst, instrumentChosen: true });
  render();
  toast('Curso y digitaciones adaptados a tu instrumento');
});
document.querySelectorAll('[data-set-goal]').forEach(b => b.addEventListener('click', () => { update({ dailyGoal: Number(b.dataset.setGoal) }); render(); }));
document.querySelectorAll('[data-set-a4]').forEach(b => b.addEventListener('click', () => { update({ a4: Number(b.dataset.setA4) }); render(); }));
// Apariencia: se guarda en el estado (y en la nube con el resto); se aplica al arrancar y también si llega de otro móvil.
// Va aquí y no en Ajustes (que se descarga al abrirla) para que el tema elegido se vea desde el principio.
let shownAppearance = getState().appearance;
applyAppearance(shownAppearance);
subscribe(s => { if (s.appearance !== shownAppearance) { shownAppearance = s.appearance; applyAppearance(s.appearance); } });
$('profilePlacement').addEventListener('click', openPlacementIntro);
$('resetProgress').addEventListener('click', () => {
  if (!confirmReset) {
    confirmReset = true;
    $('resetProgress').textContent = 'Pulsa otra vez para borrar';
    return;
  }
  resetProgress();
  toast('Progreso borrado');
  go('learn');
});
