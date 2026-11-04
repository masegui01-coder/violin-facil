// Navegación entre pantallas. Las pestañas muestran la barra superior y la inferior.
import { $, toast } from './ui.js';
import { stopMic, resumeMic } from './audio.js';

export const TABS = ['learn', 'songs', 'practice', 'band', 'profile'];
const SCREENS = [...TABS, 'onboarding', 'theory', 'lesson', 'result', 'tuner', 'metro', 'free', 'longtone', 'tuningmap', 'chord', 'chords', 'gym', 'rhythm', 'account', 'friends', 'groupsong', 'metrics', 'bookpage', 'rhythmbook', 'tips', 'pro', 'settings'];
const hooks = {};
let current = null;
let lastTab = 'learn';

// De dónde se lanzó una lección: al salir se vuelve a esa pestaña
export const ORIGIN_TAB = { course: 'learn', book: 'learn', rhythmbook: 'rhythmbook', songs: 'songs', practice: 'practice', band: 'band', pro: 'pro' };
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
  window.addEventListener('keydown', onEscape);
}

// Escape (teclado de ordenador): sale de la lección o de la pantalla de detalle con su botón de salir, como el ✕.
// No actúa mientras se escribe en un campo ni con una ventana abierta (el <dialog> se cierra solo con Escape).
const TYPING = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const overlayOpen = () => !!document.querySelector('dialog[open]') || !!(document.getElementById('tour') && !document.getElementById('tour').hidden);
function onEscape(e) {
  if (e.key !== 'Escape' || e.defaultPrevented || e.repeat) return;
  if (overlayOpen()) return;
  if (e.target && e.target.closest && e.target.closest(TYPING)) return;
  if (!current || TABS.includes(current) || current === 'onboarding' || current === 'account') return;
  const exit = $(current).querySelector(EXIT_BUTTONS);
  if (!exit || exit.disabled || !exit.getClientRects().length) return;
  e.preventDefault();
  exit.click();
}

export function register(id, { enter, leave } = {}) {
  hooks[id] = { enter, leave };
}

// Pantallas que se descargan al abrirlas por primera vez (su módulo llama a register al cargarse)
const loaders = {};
export function lazy(id, load) {
  if (!hooks[id]) loaders[id] = load;
}
// Ajustes (se abre desde Perfil): idioma, apariencia, privacidad y la cuenta
lazy('settings', () => import('./screens/settings.js'));

// Pantallas que escuchan: al entrar se reabre el micrófono si ya se había concedido
const MIC_SCREENS = new Set(['lesson', 'tuner', 'free', 'longtone', 'chord', 'chords', 'rhythm', 'groupsong']);

// Transiciones: View Transitions si el navegador las tiene y no se pide reducir el movimiento.
// El estado (pantalla actual, salida y micrófono) cambia al momento; solo el cambio visible va en la transición.
let switchToken = 0;
let switching = false;
let pendingTransition = false;
function canAnimate() {
  if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') return false;
  return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
// Sentido del movimiento: entrar en una pantalla de detalle avanza, volver a una pestaña retrocede
function direction(prev, id) {
  if (TABS.includes(id)) return TABS.includes(prev) ? 'tab' : 'back';
  return 'forward';
}

export function go(id, params = {}) {
  const load = !hooks[id] && loaders[id];
  if (load) {
    // Sin conexión y sin copia guardada no se cambia de pantalla: se avisa y se puede reintentar
    load().then(() => { delete loaders[id]; go(id, params); }, () => toast('No se ha podido abrir. Revisa la conexión.'));
    return;
  }
  const prev = current;
  if (current && hooks[current] && hooks[current].leave) hooks[current].leave();
  if (prev !== id) stopMic();
  current = id;
  if (TABS.includes(id)) lastTab = id;
  const token = ++switchToken;
  const swap = () => {
    if (token !== switchToken) return;
    switching = true;
    try { show(id, params); } finally { switching = false; }
  };
  if (prev && prev !== id && !switching && !pendingTransition && canAnimate()) {
    document.documentElement.dataset.nav = direction(prev, id);
    pendingTransition = true;
    const t = document.startViewTransition(() => { pendingTransition = false; swap(); });
    t.ready.catch(() => {}); // si el navegador la cancela (p. ej. cambia el tamaño de la ventana) se cambia sin animación
    t.finished.catch(() => {}).then(() => { delete document.documentElement.dataset.nav; });
    return;
  }
  swap();
}

function show(id, params) {
  SCREENS.forEach(s => { $(s).hidden = s !== id; });
  const isTab = TABS.includes(id);
  $('topbar').hidden = !isTab;
  $('tabbar').hidden = !isTab;
  document.querySelectorAll('[data-tab]').forEach(b => {
    if (b.dataset.tab === id) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  arm();
  window.scrollTo(0, 0);
  if (hooks[id] && hooks[id].enter) hooks[id].enter(params);
  if (MIC_SCREENS.has(id)) resumeMic();
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

// «Saltar al contenido»: lleva el foco al título de la pantalla actual (o a <main> si no tiene) sin cambiar la dirección
// (un #ancla nuevo dispararía popstate y, con él, el botón atrás de la app)
function skipToContent(e) {
  e.preventDefault();
  const screen = current && $(current);
  // El primer h1 visible: en Banda el de «Mi banda» sigue en el DOM, oculto, al pasar a Grupos o Escuela
  const visible = screen ? [...screen.querySelectorAll('h1')].find(h => h.getClientRects().length) : null;
  const target = visible || $('main');
  if (!target) return;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus();
}
if (typeof document !== 'undefined') {
  const skip = document.querySelector('.skip-link');
  if (skip) skip.addEventListener('click', skipToContent);
}
