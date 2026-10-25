// Acceso obligatorio en la beta. Quien llega nuevo crea su usuario antes de la bienvenida.
// Quien ya usaba la app ve un aviso para crearlo sin perder su avance; durante una semana puede posponerlo.
import { $, esc, toast } from '../ui.js';
import { register, go, currentScreen } from '../router.js';
import { cloudConfigured } from '../cloud.js';
import { watchAccount, currentAccount, onAccount, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, accountErrorText } from '../account.js';
import { startSync, stopSync, schedulePush, flushPush, armSync } from '../sync.js';
import { getState, update, replaceState, subscribe } from '../store.js';

const GRACE_DAYS = 7;
const DAY_MS = 86400000;
let mode = 'signup';
let syncing = false;

const PRIVACY = 'Guardamos tu nombre, tu correo y tu progreso para que no lo pierdas al cambiar de móvil y para mejorar la beta. Puedes borrar tu cuenta cuando quieras desde Perfil.';

function formHtml(prefix, intro) {
  const signup = mode === 'signup';
  return `${intro}
    <button type="button" class="btn big google-btn" id="${prefix}Google"><span class="g-logo" aria-hidden="true">G</span>Continuar con Google</button>
    <p class="or"><span>o con tu correo</span></p>
    <form class="form" id="${prefix}Form" novalidate>
      ${signup ? `<label for="${prefix}Name">Tu nombre</label><input id="${prefix}Name" class="input" maxlength="40" autocomplete="name" placeholder="Como quieres que te llamemos">` : ''}
      <label for="${prefix}Email">Correo</label><input id="${prefix}Email" class="input" type="email" autocomplete="email" inputmode="email">
      <label for="${prefix}Pass">Contraseña</label><input id="${prefix}Pass" class="input" type="password" minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="${signup ? 'Mínimo 6 caracteres' : ''}">
      <p id="${prefix}Error" class="warn" hidden></p>
      <button class="btn" type="submit">${signup ? 'Crear cuenta' : 'Entrar'}</button>
    </form>
    <div class="row spread"><button type="button" class="text-link" id="${prefix}Mode">${signup ? 'Ya tengo cuenta' : 'Crear una cuenta nueva'}</button>
      ${signup ? '' : `<button type="button" class="text-link" id="${prefix}Reset">¿Has olvidado la contraseña?</button>`}</div>
    <p class="muted small">${PRIVACY}</p>`;
}

function bindForm(prefix, rerender, done) {
  const error = msg => { $(prefix + 'Error').textContent = msg; $(prefix + 'Error').hidden = !msg; };
  const busy = on => $(prefix + 'Form').querySelectorAll('button, input').forEach(el => { el.disabled = on; });
  $(prefix + 'Google').addEventListener('click', async () => {
    try { await signInWithGoogle(); await done(); } catch (e) { error(accountErrorText(e)); }
  });
  $(prefix + 'Mode').addEventListener('click', () => { mode = mode === 'signup' ? 'login' : 'signup'; rerender(); });
  $(prefix + 'Reset')?.addEventListener('click', async () => {
    const email = $(prefix + 'Email').value.trim();
    if (!email) { error('Escribe tu correo y te enviaré un enlace para cambiar la contraseña.'); return; }
    try { await resetPassword(email); error(''); toast('Te he enviado un correo para cambiar la contraseña'); } catch (e) { error(accountErrorText(e)); }
  });
  $(prefix + 'Form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $(prefix + 'Email').value.trim();
    const pass = $(prefix + 'Pass').value;
    const name = mode === 'signup' ? $(prefix + 'Name').value.trim() : '';
    if (mode === 'signup' && !name) { error('Escribe tu nombre.'); return; }
    busy(true);
    try {
      if (mode === 'signup') await signUpWithEmail(name, email, pass);
      else await signInWithEmail(email, pass);
      await done();
    } catch (err) { error(accountErrorText(err)); }
    finally { if ($(prefix + 'Form')) busy(false); }
  });
}

// Tras entrar: recupera o sube el progreso y sigue donde corresponda
async function afterSignIn() {
  const account = currentAccount();
  if (!account) return;
  // Ya has entrado: aunque falle el guardado en la nube, se sigue (se reintenta en cada cambio y al volver a abrir)
  const decision = await beginSync(account).catch(() => 'error');
  if ($('sheet').open) $('sheet').close();
  toast(decision === 'download' ? `¡Hola de nuevo, ${account.displayName || ''}! He recuperado tu progreso`
    : decision === 'error' ? 'Has entrado. Tu progreso se guardará en la nube en cuanto haya conexión'
      : 'Cuenta lista: tu progreso queda guardado');
  go(currentScreen() === 'account' ? (getState().onboarded ? 'learn' : 'onboarding') : currentScreen());
  window.dispatchEvent(new CustomEvent('account-ready'));
}

async function beginSync(account) {
  syncing = true;
  const name = account.displayName;
  if (name && !getState().nickname) update({ nickname: name });
  return startSync(account, { getState, replaceState }).catch(e => { armSync(account, getState); throw e; });
}

// ---------- Pantalla obligatoria ----------
function renderScreen() {
  const late = getState().onboarded;
  $('accountBody').innerHTML = formHtml('ac', `<div class="ob-hero"><h1>${late ? 'Crea tu usuario para seguir' : 'Bienvenido a Band Flow'}</h1>
    <p class="muted">${late ? 'Tu progreso de este móvil se guardará en tu cuenta: no pierdes nada.' : 'Crea tu usuario para guardar tu progreso. Así podrás seguir en cualquier móvil o tableta.'}</p></div>`);
  bindForm('ac', renderScreen, afterSignIn);
}

register('account', { enter: renderScreen });

// ---------- Aviso para quien ya usaba la app ----------
function graceLeft() {
  const since = getState().accountPromptSince || Date.now();
  if (!getState().accountPromptSince) update({ accountPromptSince: since });
  return Math.max(0, GRACE_DAYS - Math.floor((Date.now() - since) / DAY_MS));
}

function openReminder() {
  const left = graceLeft();
  const render = () => {
    $('sheetBody').innerHTML = `<div class="sheet-body">${formHtml('ar', `<p class="eyebrow">Nuevo en la beta</p><h2>Crea tu usuario y no pierdas tu avance</h2>
      <p>Tus ${getState().xp} puntos, tu racha y tus lecciones se guardarán en tu cuenta. Así no se pierden si cambias de móvil o borras el navegador.</p>`)}
      <button type="button" class="btn ghost small" id="arLater">Recordármelo luego (${left === 1 ? 'queda 1 día' : `quedan ${left} días`})</button></div>`;
    bindForm('ar', render, afterSignIn);
    $('arLater').addEventListener('click', () => $('sheet').close());
  };
  render();
  if (!$('sheet').open) $('sheet').showModal();
}

// ---------- Arranque ----------
// Al abrir la app: con cuenta, se sincroniza y avisa con «account-ready»; sin cuenta, pantalla de acceso
// (nuevos o plazo vencido) o el aviso para crearla. Sin conexión no se bloquea nada.
export async function accountGate() {
  if (!cloudConfigured()) return;
  const leaveGate = () => { if (currentScreen() === 'account') go(getState().onboarded ? 'learn' : 'onboarding'); };
  try { await watchAccount(); } catch (e) { leaveGate(); window.dispatchEvent(new CustomEvent('account-ready')); return; }
  onAccount(acc => { if (!acc) { syncing = false; stopSync(); } });
  const account = currentAccount();
  if (account) {
    const decision = await beginSync(account).catch(() => null);
    if (decision === 'download' && currentScreen() !== 'account') go(currentScreen());
    leaveGate();
    window.dispatchEvent(new CustomEvent('account-ready'));
    return;
  }
  if (!getState().onboarded || graceLeft() <= 0) { go('account'); return; }
  setTimeout(openReminder, 600);
}

export { openReminder as openAccountReminder };

// Cada cambio del progreso se guarda en la nube unos segundos después (y al salir de la app)
subscribe(() => { if (syncing) schedulePush(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && syncing) flushPush(); });
export const accountName = () => (currentAccount() ? esc(currentAccount().displayName || currentAccount().email || '') : '');
