// Navegación entre pantallas. Las pestañas muestran la barra superior y la inferior.
import { $ } from './ui.js';

export const TABS = ['learn', 'songs', 'practice', 'band', 'profile'];
const SCREENS = [...TABS, 'onboarding', 'theory', 'lesson', 'result', 'tuner', 'metro', 'free', 'longtone', 'tuningmap', 'chord', 'chords', 'gym', 'rhythm', 'account', 'friends'];
const hooks = {};
let current = null;
let lastTab = 'learn';

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
  window.scrollTo(0, 0);
  if (hooks[id] && hooks[id].enter) hooks[id].enter(params);
  window.dispatchEvent(new CustomEvent('screen-change', { detail: { id } }));
}

export function back() { go(lastTab); }
export function currentScreen() { return current; }
