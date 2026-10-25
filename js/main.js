// Arranque de la app: iconos, barra superior, pestañas y comentarios.
import { $, icon, toast } from './ui.js';
import { go, currentScreen } from './router.js';
import { getState, subscribe, currentStreak } from './store.js';
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
}

hydrateIcons();
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

go(getState().onboarded ? 'learn' : 'onboarding');

// Tutorial: tras la bienvenida, y una vez para quien ya usaba la app
const maybeTour = () => { if (!getState().tourDone) startTour(); };
window.addEventListener('onboarding-done', maybeTour);
$('replayTour').addEventListener('click', startTour);

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

// App instalable (icono en la pantalla de inicio)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
