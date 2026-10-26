// Navegación entre pantallas. Las pestañas muestran la barra superior y la inferior.
import { $ } from './ui.js';

export const TABS = ['learn', 'songs', 'practice', 'band', 'profile'];
const SCREENS = [...TABS, 'onboarding', 'theory', 'lesson', 'result', 'tuner', 'metro', 'free', 'longtone', 'tuningmap', 'chord', 'chords', 'gym', 'rhythm', 'account', 'friends', 'groupsong'];
const hooks = {};
let current = null;
let lastTab = 'learn';

// De dónde se lanzó una lección: al salir se vuelve a esa pestaña
export const ORIGIN_TAB = { course: 'learn', songs: 'songs', practice: 'practice', band: 'band' };
export const originTab = from => ORIGIN_TAB[from] || 'learn';

// Botón atrás del móvil: cierra la ventana abierta, sale de la lección o vuelve a Aprender.
// Se deja una entrada en el historial para que el atrás llegue aquí en vez de cerrar la app.
const EXIT_BUTTONS = '[data-back], #theoryExit, #lessonExit, #rhExit, #cdExit, #resBack';
let armed = false;
function arm() {
  if (armed || typeof history === 'undefined') return;
  history.pushState({ bandFlow: true }, '');
  armed = true;
}
function handleBack() {
  const open = document.querySelector('dialog[open]');
  if (open) { open.close(); return true; }
  if (!current || current === 'learn' || current === 'account') return false;
  if (current === 'onboarding') {
    const prev = $('obBack');
    if (prev.hidden) return false;
    prev.click();
    return true;
  }
  if (TABS.includes(current)) { go('learn'); return true; }
  const exit = $(current).querySelector(EXIT_BUTTONS);
  if (exit) exit.click(); else go(lastTab);
  return true;
}
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    armed = false;
    if (handleBack()) arm();
    else history.back();
  });
}

export function register(id, { enter, leave } = {}) {
  hooks[id] = { enter, leave };
}

export function go(id, params = {}) {
  if (current && hooks[current] && hooks[current].leave) hooks[current].leave();
  SCREENS.forEach(s => { $(s).hidden = s !== id; });
  const isTab = TABS.includes(id);
  $('topbar').hidden = !isTab;
  $('tabbar').hidden = !isTab;
  if (isTab) lastTab = id;
  document.querySelectorAll('[data-tab]').forEach(b => {
    if (b.dataset.tab === id) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  current = id;
  arm();
  window.scrollTo(0, 0);
  if (hooks[id] && hooks[id].enter) hooks[id].enter(params);
  announce(id);
  window.dispatchEvent(new CustomEvent('screen-change', { detail: { id } }));
}

export function back() { go(lastTab); }

const TAB_NAMES = { learn: 'Aprender', songs: 'Canciones', practice: 'Estudio', band: 'Banda', profile: 'Perfil' };
function announce(id) {
  const heading = $(id).querySelector(TABS.includes(id) ? 'h1' : 'h1, h2');
  const name = TAB_NAMES[id] || (heading && heading.textContent.trim());
  document.title = name ? `${name} · Band Flow` : 'Band Flow';
  if (!heading || !document.activeElement || document.activeElement === document.body) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}
export function currentScreen() { return current; }
