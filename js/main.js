// Arranque de la app: iconos, barra superior, pestañas y comentarios.
import { $, icon, toast } from './ui.js';
import { go, currentScreen } from './router.js';
import { getState, subscribe, currentStreak, update } from './store.js';
import { TRACKED_SCREENS } from './test-coverage.js';
import { setInstrument } from './audio.js';
import { setReferenceA } from './music.js';
import { instrumentById } from './instruments.js';
import { checkCelebrations } from './screens/daily.js';
import { openInstrumentPicker, instrumentIcon } from './screens/instrument-picker.js';
import { startTour } from './screens/tour.js';
import { maybeWeeklyReport } from './screens/progress-ui.js';
import './screens/player.js';
import './screens/theory.js';
import './screens/learn.js';
import './screens/library.js';
import './screens/profile.js';
import './screens/practice.js';
import './screens/free.js';
import './screens/onboarding.js';
import './screens/longtone.js';
import './screens/tuningmap.js';
import './screens/chord.js';
import './screens/chords.js';
import './screens/gym.js';
import './screens/study.js';
import './screens/band.js';
import './screens/social.js';
import './screens/rhythm.js';
import './screens/perc-tools.js';
import './growth.js';
import { accountGate } from './screens/account.js';
import './screens/friends.js';
import './screens/group-song.js';
import './screens/metrics.js';
import { onAccount, currentAccount } from './account.js';
import { isProTesterEmail } from './metrics.js';
import './screens/book-page.js';
import { initAnalytics } from './analytics.js';
import { cloudConfigured } from './cloud.js';

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
  $('bandBadge').setAttribute('aria-label', `${pending} tareas pendientes`);
}

hydrateIcons();
// Tester pro: todo el contenido abierto mientras esté su cuenta en este móvil
const applyRole = acc => { const pro = isProTesterEmail(acc && acc.email); if (pro !== !!getState().proTester) update({ proTester: pro }); };
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

function startApp() {
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
accountGate();
initAnalytics();

// App instalable (icono en la pantalla de inicio)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
