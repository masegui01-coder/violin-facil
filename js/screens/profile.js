// Pestaña Perfil: estadísticas, estilos de música y ajustes.
import { $, esc, toast } from '../ui.js';
import { register, go } from '../router.js';
import { STYLES } from '../songs.js';
import { getState, update, resetProgress, currentStreak } from '../store.js';

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
  const done = Object.values(s.progress).filter(v => v > 0).length;
  $('stats').innerHTML = [
    [currentStreak(s.streak), 'días seguidos'], [s.xp, 'puntos'], [done, 'lecciones hechas'],
  ].map(([n, label]) => `<div class="stat"><b>${n}</b><span>${label}</span></div>`).join('');
  $('profileStyles').innerHTML = styleGridHtml(s.styles);
  document.querySelectorAll('[data-set-nom]').forEach(b => b.setAttribute('aria-pressed', b.dataset.setNom === s.nom));
  document.querySelectorAll('[data-set-tol]').forEach(b => b.setAttribute('aria-pressed', b.dataset.setTol === s.tolerance));
  document.querySelectorAll('[data-set-metro]').forEach(b => b.setAttribute('aria-pressed', b.dataset.setMetro === s.metroMode));
  $('setBig').checked = s.bigText;
  $('setBoard').checked = s.showBoard;
  $('setUnlock').checked = s.unlockAll;
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
document.querySelectorAll('[data-set-nom]').forEach(b => b.addEventListener('click', () => { update({ nom: b.dataset.setNom }); render(); }));
document.querySelectorAll('[data-set-tol]').forEach(b => b.addEventListener('click', () => { update({ tolerance: b.dataset.setTol }); render(); }));
document.querySelectorAll('[data-set-metro]').forEach(b => b.addEventListener('click', () => { update({ metroMode: b.dataset.setMetro }); render(); }));
$('setBoard').addEventListener('change', e => update({ showBoard: e.target.checked }));
$('setBig').addEventListener('change', e => update({ bigText: e.target.checked }));
$('setUnlock').addEventListener('change', e => update({ unlockAll: e.target.checked }));
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
