// Google Analytics (vía Firebase): solo se carga si la persona lo acepta (usa cookies; obligatorio en la UE).
// Mide pantallas visitadas, lecciones terminadas y accesos para saber qué partes de la app se usan.
import { getCloud, SDK } from './cloud.js';
import { FIREBASE_CONFIG } from './firebase-config.js';
import { getState, update } from './store.js';
import { currentAccount } from './account.js';

let ga = null;

export const analyticsAvailable = () => !!(FIREBASE_CONFIG && FIREBASE_CONFIG.measurementId);

async function start() {
  if (ga || !analyticsAvailable() || getState().analyticsConsent !== true) return;
  try {
    const c = await getCloud();
    const m = await import(SDK + 'firebase-analytics.js');
    if (!(await m.isSupported())) return;
    ga = { m, a: m.getAnalytics(c.app) };
    m.setAnalyticsCollectionEnabled(ga.a, true);
    const acc = currentAccount();
    if (acc) m.setUserId(ga.a, acc.uid);
    track('screen_view', { firebase_screen: 'inicio' });
  } catch (e) { ga = null; }
}

export function track(name, params = {}) {
  if (ga) ga.m.logEvent(ga.a, name, { instrument: getState().instrument, ...params });
}

export function setAnalyticsConsent(on) {
  update({ analyticsConsent: on });
  if (on) start();
  else if (ga) ga.m.setAnalyticsCollectionEnabled(ga.a, false);
}

function showBanner() {
  if (document.querySelector('.consent')) return;
  const box = document.createElement('div');
  box.className = 'consent';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Cookies de estadísticas');
  box.innerHTML = `<p><b>¿Nos ayudas a mejorar la beta?</b> Con tu permiso usamos Google Analytics (cookies) para saber qué partes de la app se usan. Puedes cambiarlo en Perfil.</p>
    <div class="row"><button type="button" class="btn ghost small" data-consent="no">No, gracias</button><button type="button" class="btn small" data-consent="yes">Aceptar</button></div>`;
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    setAnalyticsConsent(b.dataset.consent === 'yes');
    box.remove();
  });
  document.body.appendChild(box);
}

export function initAnalytics() {
  if (!analyticsAvailable()) return;
  if (getState().analyticsConsent === null) showBanner();
  else start();
}

window.addEventListener('screen-change', e => track('screen_view', { firebase_screen: e.detail.id }));
window.addEventListener('lesson-finished', e => {
  const { lesson, mode, stars } = e.detail;
  track('lesson_complete', { lesson_id: lesson.id, kind: lesson.kind, mode: mode || '', stars });
});
window.addEventListener('account-ready', () => {
  const acc = currentAccount();
  if (ga && acc) ga.m.setUserId(ga.a, acc.uid);
  track('login');
});
