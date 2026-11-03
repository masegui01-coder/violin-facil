// Pantalla Ajustes (se abre desde Perfil): idioma, apariencia, notas, lecciones, privacidad y la cuenta.
// Se descarga al abrirla por primera vez (lazy en router.js); el tema se aplica al arrancar desde profile.js.
import { $, toast } from '../ui.js';
import { register } from '../router.js';
import { getState, update } from '../store.js';
import { setLang } from '../i18n.js';
import { renderAccountPanel } from './account-panel.js';

// Marca el botón elegido de cada grupo segmentado
function pressed(attr, value) {
  document.querySelectorAll(`[data-${attr}]`).forEach(b => b.setAttribute('aria-pressed', b.getAttribute(`data-${attr}`) === value));
}

function render() {
  const s = getState();
  pressed('set-nom', s.nom);
  pressed('set-lang', s.lang || 'es');
  pressed('set-tol', s.tolerance);
  pressed('set-appearance', s.appearance || 'system');
  $('setClick').checked = s.metroClick;
  $('setBig').checked = s.bigText;
  $('setBoard').checked = s.showBoard;
  $('setUnlock').checked = s.unlockAll;
  $('setKid').checked = !!s.kidMode;
  $('setPublic').checked = !!(s.publicBoards && s.publicName) && !s.kidMode;
  $('setPublic').disabled = !!s.kidMode;
  $('setPublicText').textContent = s.publicName ? `Tu apodo público: ${s.publicName}. Nunca se usa tu nombre.` : 'Se te pedirá un apodo la primera vez que entres en una clasificación.';
  renderAccountPanel();
}

register('settings', { enter: render });

document.querySelectorAll('[data-set-nom]').forEach(b => b.addEventListener('click', () => { update({ nom: b.dataset.setNom }); render(); }));
// En inglés, las notas por defecto con letras (C, D, E…); se puede cambiar justo debajo
document.querySelectorAll('[data-set-lang]').forEach(b => b.addEventListener('click', () => {
  const lang = b.dataset.setLang;
  update({ lang, ...(lang === 'en' && getState().nom === 'eu' ? { nom: 'us' } : {}) });
  setLang(lang);
  render();
}));
document.querySelectorAll('[data-set-tol]').forEach(b => b.addEventListener('click', () => { update({ tolerance: b.dataset.setTol }); render(); }));
// Apariencia: profile.js la aplica en cuanto cambia el estado
document.querySelectorAll('[data-set-appearance]').forEach(b => b.addEventListener('click', () => {
  update({ appearance: b.dataset.setAppearance });
  render();
}));
$('setClick').addEventListener('change', e => update({ metroClick: e.target.checked }));
$('setBoard').addEventListener('change', e => update({ showBoard: e.target.checked }));
$('setBig').addEventListener('change', e => update({ bigText: e.target.checked }));
$('setUnlock').addEventListener('change', e => update({ unlockAll: e.target.checked }));
$('setKid').addEventListener('change', e => { update({ kidMode: e.target.checked, ...(e.target.checked ? { publicBoards: false } : {}) }); render(); });
$('setPublic').addEventListener('change', e => {
  if (e.target.checked && !getState().publicName) { e.target.checked = false; toast('Entra en una clasificación y elige tu apodo'); return; }
  update({ publicBoards: e.target.checked });
  render();
});
