// Arranque de la app: iconos, barra superior, pestañas y comentarios.
import { $, icon, toast } from './ui.js';
import { go, lazy, currentScreen, TABS } from './router.js';
import { getState, subscribe, currentStreak, update } from './store.js';
import { TRACKED_SCREENS } from './test-coverage.js';
import { setInstrument } from './audio.js';
import { setReferenceA } from './music.js';
import { instrumentById } from './instruments.js';
import { checkCelebrations } from './screens/daily.js';
import { openInstrumentPicker, instrumentIcon } from './screens/instrument-picker.js';
import { startTour } from './screens/tour.js';
import { maybeWeeklyReport } from './screens/progress-ui.js';
import './screens/learn.js';
import './screens/profile.js';
import './screens/practice.js';
import './screens/onboarding.js';
import './screens/tuningmap.js';
import './screens/gym.js';
import './screens/study.js';
import './screens/social.js';
import './screens/perc-tools.js';
import './growth.js';
import { accountGate } from './screens/account.js';
import './screens/friends.js';
import { onAccount, currentAccount } from './account.js';
import { BETA_ALL_TESTERS, hasFullContent } from './metrics.js';
import { isProTesterUid } from './roles-api.js';
import { isAdmin } from './sync.js';
import { setLang, defaultLang } from './i18n.js';
import { refreshRhythmBookTool } from './screens/rhythm-book-tool.js';
import { initAnalytics } from './analytics.js';
import { cloudConfigured } from './cloud.js';
import { registerServiceWorker } from './sw-update.js';

// Pantallas pesadas o poco usadas: se descargan al abrirlas por primera vez
lazy('band', () => import('./screens/band.js'));
lazy('groupsong', () => import('./screens/group-song.js'));
lazy('metrics', () => import('./screens/metrics.js'));
lazy('rhythmbook', () => import('./screens/rhythm-book.js'));
lazy('bookpage', () => import('./screens/book-page.js'));
lazy('tips', () => import('./screens/tips.js'));
lazy('pro', () => import('./screens/pro.js'));

// Momento libre del hilo principal (o un poco después, si el navegador no tiene requestIdleCallback)
const IDLE_TIMEOUT_MS = 3000;
const whenIdle = fn => (typeof requestIdleCallback === 'function'
  ? requestIdleCallback(() => fn(), { timeout: IDLE_TIMEOUT_MS }) : setTimeout(fn, 300));

// Pantallas que no se ven al abrir la app: no entran en el arranque. Se cargan en ratos libres justo después,
// una a una, y si se piden antes, al abrirlas (el router espera a que se registren).
const DEFERRED_SCREENS = {
  lesson: () => import('./screens/player.js'),
  theory: () => import('./screens/theory.js'),
  songs: () => import('./screens/library.js'),
  free: () => import('./screens/free.js'),
  longtone: () => import('./screens/longtone.js'),
  chord: () => import('./screens/chord.js'),
  chords: () => import('./screens/chords.js'),
  rhythm: () => import('./screens/rhythm.js'),
};
Object.entries(DEFERRED_SCREENS).forEach(([id, load]) => lazy(id, load));
function preloadDeferredScreens(queue = Object.values(DEFERRED_SCREENS)) {
  if (!queue.length) return;
  whenIdle(() => queue[0]().catch(() => {}).then(() => preloadDeferredScreens(queue.slice(1))));
}
// Los enlaces de invitación y el de métricas se atienden al arrancar, como antes
const launchParams = new URLSearchParams(location.search);
if (['banda', 'grupo', 'escuela'].some(k => launchParams.has(k))) import('./screens/band.js');
if (launchParams.get('panel') === 'metricas') import('./screens/metrics.js');

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}

function renderTopbar(s) {
  const streak = currentStreak(s.streak);
  $('streakCount').textContent = streak;
  $('xpCount').textContent = s.xp;
  document.querySelector('.chip-stat.streak').classList.toggle('cold', streak === 0);
  $('toolBpm').textContent = s.bpm;
  document.documentElement.classList.toggle('big', s.bigText);
  setInstrument(instrumentById(s.instrument));
  $('instChipName').textContent = instrumentById(s.instrument).name;
  $('instChipIcon').innerHTML = instrumentIcon(s.instrument);
  setReferenceA(s.a4);
  document.documentElement.dataset.accent = s.theme || 'barniz';
  const pending = s.band && s.band.role !== 'director' ? (s.bandPending || []).length : 0;
  $('bandBadge').hidden = !pending;
  $('bandBadge').textContent = pending;
  $('bandBadge').setAttribute('aria-label', `${pending} ${pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}`);
}

hydrateIcons();
if (!getState().lang) update({ lang: defaultLang(), ...(defaultLang() === 'en' && !getState().onboarded ? { nom: 'us' } : {}) });
setLang(getState().lang);
// Tester: todo el contenido abierto mientras esté su cuenta en este móvil (en la beta, cualquier cuenta: BETA_ALL_TESTERS).
// El administrador lo dice el servidor (admins/{uid} o las reglas), nunca una lista de correos en el cliente.
const applyRole = async acc => {
  const admin = !!acc && await isAdmin(acc.uid);
  const proRole = !!acc && !BETA_ALL_TESTERS && !admin && await isProTesterUid(acc.uid);
  const pro = hasFullContent({ signedIn: !!acc, admin, proRole });
  if (acc !== currentAccount()) return; // cambió la cuenta mientras se comprobaba
  if (pro !== !!getState().proTester || admin !== !!getState().adminUser) update({ proTester: pro, adminUser: admin });
  refreshRhythmBookTool();
};
onAccount(applyRole);
applyRole(currentAccount());

// Checklist de pruebas de la beta: se apunta (una vez) cada parte de la app que usa este tester
window.addEventListener('screen-change', e => {
  const id = e.detail.id;
  const s = getState();
  if (TRACKED_SCREENS.includes(id) && !(s.seenScreens || {})[id]) update({ seenScreens: { ...(s.seenScreens || {}), [id]: Date.now() } });
});
new MutationObserver(() => {
  const dlg = $('sheet');
  if (!dlg.open) return;
  const title = dlg.querySelector('h1, h2, h3');
  if (title) { title.id = title.id || 'sheetTitle'; dlg.setAttribute('aria-labelledby', title.id); } else dlg.removeAttribute('aria-labelledby');
}).observe($('sheet'), { attributes: true, attributeFilter: ['open'] });
$('streakIcon').innerHTML = icon('flame');
renderTopbar(getState());
subscribe(renderTopbar);
subscribe(checkCelebrations);

document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

// Cambiar de instrumento desde cualquier pestaña: se vuelve a pintar la pantalla actual
const refreshScreen = () => go(currentScreen());
$('instChip').addEventListener('click', () => openInstrumentPicker({ onPicked: refreshScreen }));
window.addEventListener('pick-instrument', () => openInstrumentPicker({ onPicked: refreshScreen }));
// Llegó el contenido en inglés de cursos y libros: se vuelve a pintar lo que ya estaba en pantalla
window.addEventListener('lang-content-ready', () => { if (TABS.includes(currentScreen())) refreshScreen(); });

// ---------- Comentarios ----------
function feedbackText() {
  const s = getState();
  return `Band Flow (beta) – comentario\n\n${$('fbText').value.trim()}\n\nInstrumento: ${instrumentById(s.instrument).name} · Pantalla: ${currentScreen()} · Notación: ${s.nom === 'eu' ? 'Do-Re-Mi' : 'G3-A4'} · Estilos: ${s.styles.join(', ')}\n${navigator.userAgent}`;
}
$('openFeedback').addEventListener('click', () => $('fbDialog').showModal());
$('fbCancel').addEventListener('click', () => $('fbDialog').close());
$('fbCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(feedbackText()); toast('Copiado. Pégalo en un mensaje.'); }
  catch (e) { $('fbText').select(); toast('Selecciona el texto y cópialo'); }
});
// Correo del estudio: el alias "+violin" hace que Gmail lo etiquete en la carpeta de esta app.
const SUPPORT_EMAIL = 'tizaestudiogames+violin@gmail.com';
$('fbForm').addEventListener('submit', e => {
  e.preventDefault();
  const subject = '[Band Flow] Sugerencia o error';
  location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(feedbackText())}`;
  $('fbDialog').close();
});

// Tutorial: tras la bienvenida, y una vez para quien ya usaba la app
const maybeTour = () => { if (!getState().tourDone) startTour(); };
window.addEventListener('onboarding-done', maybeTour);
$('replayTour').addEventListener('click', startTour);

// Accesos directos del icono instalado (manifest «shortcuts»): ?go=tuner o ?go=metro
const SHORTCUT_SCREENS = ['tuner', 'metro'];
const shortcut = SHORTCUT_SCREENS.includes(launchParams.get('go')) ? launchParams.get('go') : null;

function startApp() {
  if (shortcut && getState().onboarded && getState().instrumentChosen) { go(shortcut); return; }
  go(getState().onboarded ? 'learn' : 'onboarding');
  // Quien ya usaba la app (solo violín) elige ahora su instrumento una vez y después ve el tutorial
  if (getState().onboarded && !getState().instrumentChosen) {
    openInstrumentPicker({
      title: 'Novedad: elige tu instrumento',
      intro: 'Band Flow ya no es solo para violín. Elige el instrumento que quieres aprender o practicar; podrás cambiarlo cuando quieras desde el botón de arriba.',
      onPicked: () => { refreshScreen(); maybeTour(); },
      onClosed: maybeTour,
    });
  } else if (getState().onboarded) {
    maybeTour();
    if (getState().tourDone) maybeWeeklyReport();
  }
}

// Cuenta obligatoria en la beta: quien llega nuevo empieza creando su usuario
if (cloudConfigured() && !getState().onboarded) {
  go('account');
  window.addEventListener('account-ready', startApp, { once: true });
} else startApp();

// Lo que no hace falta para el primer pintado va en ratos libres, cada cosa en su propia tarea:
// la cuenta (restaurar sesión y sincronizar), la analítica, el service worker y las pantallas diferidas
whenIdle(accountGate);
whenIdle(initAnalytics);
// App instalable (icono en la pantalla de inicio) y aviso cuando hay una versión nueva
whenIdle(registerServiceWorker);
preloadDeferredScreens();
