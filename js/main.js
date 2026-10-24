// Arranque de la app: iconos, barra superior, pestañas y comentarios.
import { $, icon, toast } from './ui.js';
import { go, currentScreen } from './router.js';
import { getState, subscribe, currentStreak } from './store.js';
import './screens/player.js';
import './screens/theory.js';
import './screens/learn.js';
import './screens/library.js';
import './screens/profile.js';
import './screens/practice.js';
import './screens/free.js';
import './screens/onboarding.js';

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
}

hydrateIcons();
$('streakIcon').innerHTML = icon('flame');
renderTopbar(getState());
subscribe(renderTopbar);

document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

// ---------- Comentarios ----------
function feedbackText() {
  const s = getState();
  return `Violin Flow (beta) – comentario\n\n${$('fbText').value.trim()}\n\nPantalla: ${currentScreen()} · Notación: ${s.nom === 'eu' ? 'Do-Re-Mi' : 'G3-A4'} · Estilos: ${s.styles.join(', ')}\n${navigator.userAgent}`;
}
$('openFeedback').addEventListener('click', () => $('fbDialog').showModal());
$('fbCancel').addEventListener('click', () => $('fbDialog').close());
$('fbCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(feedbackText()); toast('Copiado. Pégalo en un mensaje.'); }
  catch (e) { $('fbText').select(); toast('Selecciona el texto y cópialo'); }
});
$('fbForm').addEventListener('submit', async e => {
  e.preventDefault();
  const text = feedbackText();
  if (navigator.share) {
    try { await navigator.share({ title: 'Violin Flow – comentario', text }); $('fbDialog').close(); return; }
    catch (err) { if (err && err.name === 'AbortError') return; }
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
});

go(getState().onboarded ? 'learn' : 'onboarding');
