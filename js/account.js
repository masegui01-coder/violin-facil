// Cuentas de usuario (obligatorias en la beta): Google o correo y contraseña.
// Si ya había una sesión anónima (por ejemplo, de una banda), se vincula a la cuenta nueva para no perder nada.
import { getCloud, warmPopups, popupsReady } from './cloud.js';

// La ventana de Google no se prepara al arrancar (ver cloud.js): se prepara cuando el usuario se acerca a un botón
// «Continuar con Google» o al formulario que lo acompaña (toque, puntero encima o foco), antes de que llegue el clic.
// También «Borrar mi cuenta» (Perfil): con Google pide volver a entrar en una ventana.
const GOOGLE_BTN = '.google-btn';
const POPUP_INTENT = `${GOOGLE_BTN}, #accDelete`;
const nearGoogle = el => {
  const form = el.closest('form');
  return !!(form && form.parentElement && form.parentElement.querySelector(GOOGLE_BTN));
};
function warmOnIntent(e) {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  // El foco solo cuenta en los campos: al abrirse, la ventana del aviso enfoca sola el botón de Google
  if (e.type === 'focusin') { if (el.matches('input') && nearGoogle(el)) warmPopups(); return; }
  if (el.closest(POPUP_INTENT) || nearGoogle(el)) warmPopups();
}
if (typeof document !== 'undefined') {
  ['pointerdown', 'pointerover', 'focusin', 'keydown'].forEach(type => document.addEventListener(type, warmOnIntent, { capture: true, passive: true }));
}

// Con el formulario ya en pantalla se prepara también en un rato libre: en iOS Safari una ventana preparada durante
// el mismo clic puede quedar bloqueada, así que el primer toque en Google debe encontrarla lista
const WARM_DELAY_MS = 2500;
export function warmPopupsSoon() {
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 0));
  setTimeout(() => idle(() => warmPopups(), { timeout: 2000 }), WARM_DELAY_MS);
}

const listeners = new Set();
let user = null;
let watching = false;

const isAccount = u => !!u && !u.isAnonymous;

export async function watchAccount() {
  if (watching) return;
  watching = true;
  const c = await getCloud();
  user = c.auth.currentUser;
  c.authFns.onAuthStateChanged(c.auth, u => { user = u; listeners.forEach(fn => fn(isAccount(u) ? u : null)); });
}

export const currentAccount = () => (isAccount(user) ? user : null);

// Nombre para rellenar «Tu nombre» (banda, grupo, escuela): texto SIN escapar (se escapa una vez al meterlo en HTML).
// Nunca el correo: el apodo lo ven otros músicos.
export const NICK_MAX = 30;
export const nicknameOf = acc => String((acc && acc.displayName) || '').slice(0, NICK_MAX);
export const accountName = () => nicknameOf(currentAccount());

export function onAccount(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Vincular la sesión anónima a una cuenta mantiene el mismo usuario y Firebase no avisa: lo hacemos aquí
function announce(u) {
  if (!isAccount(u)) return u;
  user = u;
  listeners.forEach(fn => fn(u));
  return u;
}

// Google: intenta unir la sesión anónima (para conservar la banda); si no se puede por cualquier motivo
// (la cuenta ya existía, el correo ya se usa…), entra directamente con Google. Solo se rinde si cierras la ventana.
const USER_CANCELLED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];

export async function signInWithGoogle() {
  const c = await getCloud();
  const warm = popupsReady();
  try { return await googlePopup(c); } catch (e) {
    // La ventana se preparó durante el clic y el navegador la bloqueó por tardar: ya está lista, basta con repetir
    if (e.code === 'auth/popup-blocked' && !warm) throw Object.assign(new Error(e.message), { code: 'auth/popup-retry' });
    throw e;
  }
}

async function googlePopup(c) {
  const provider = new c.authFns.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const anon = c.auth.currentUser && c.auth.currentUser.isAnonymous ? c.auth.currentUser : null;
  if (!anon) return (await c.authFns.signInWithPopup(c.auth, provider)).user;
  try {
    return announce((await c.authFns.linkWithPopup(anon, provider)).user);
  } catch (e) {
    if (USER_CANCELLED.includes(e.code) || e.code === 'auth/popup-blocked') throw e;
    const cred = c.authFns.GoogleAuthProvider.credentialFromError(e);
    if (cred) return (await c.authFns.signInWithCredential(c.auth, cred)).user;
    return (await c.authFns.signInWithPopup(c.auth, provider)).user;
  }
}

export async function signUpWithEmail(name, email, password) {
  const c = await getCloud();
  const anon = c.auth.currentUser && c.auth.currentUser.isAnonymous ? c.auth.currentUser : null;
  const u = anon
    ? (await c.authFns.linkWithCredential(anon, c.authFns.EmailAuthProvider.credential(email, password))).user
    : (await c.authFns.createUserWithEmailAndPassword(c.auth, email, password)).user;
  if (name) await c.authFns.updateProfile(u, { displayName: name });
  return anon ? announce(u) : u;
}

export async function signInWithEmail(email, password) {
  const c = await getCloud();
  return (await c.authFns.signInWithEmailAndPassword(c.auth, email, password)).user;
}

export async function resetPassword(email) {
  const c = await getCloud();
  c.auth.languageCode = 'es';
  await c.authFns.sendPasswordResetEmail(c.auth, email);
}

export async function signOutAccount() {
  const c = await getCloud();
  await c.authFns.signOut(c.auth);
}

export async function deleteAccount() {
  const c = await getCloud();
  await c.authFns.deleteUser(c.auth.currentUser);
}

export function accountErrorText(err) {
  const code = (err && err.code) || '';
  const map = {
    'auth/invalid-email': 'Ese correo no parece válido.',
    'auth/missing-password': 'Escribe una contraseña.',
    'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.',
    'auth/email-already-in-use': 'Ya hay una cuenta con ese correo: usa «Ya tengo cuenta» (o «Continuar con Google» si la creaste con Google).',
    'auth/account-exists-with-different-credential': 'Ese correo ya tiene cuenta con otro método: prueba con «Ya tengo cuenta» y tu contraseña.',
    'auth/credential-already-in-use': 'Esa cuenta de Google ya está registrada: vuelve a pulsar «Continuar con Google» para entrar.',
    'auth/unauthorized-domain': 'Esta web aún no está autorizada para iniciar sesión. Avisa al administrador.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No hay ninguna cuenta con ese correo.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un poco y vuelve a probar.',
    'auth/popup-closed-by-user': 'Has cerrado la ventana de Google antes de terminar.',
    'auth/popup-retry': 'La ventana de Google ya está preparada: vuelve a pulsar «Continuar con Google».',
    'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes y vuelve a probar.',
    'auth/operation-not-allowed': 'Este tipo de acceso aún no está activado.',
    'auth/requires-recent-login': 'Por seguridad, cierra sesión, vuelve a entrar y repite la acción.',
    'auth/network-request-failed': 'No hay conexión. Inténtalo cuando tengas internet.',
  };
  return map[code] || `No se ha podido completar el acceso${code ? ` (${code.replace('auth/', '')})` : ''}. Inténtalo otra vez y, si sigue, mándanos este mensaje.`;
}
