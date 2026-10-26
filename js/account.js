// Cuentas de usuario (obligatorias en la beta): Google o correo y contraseña.
// Si ya había una sesión anónima (por ejemplo, de una banda), se vincula a la cuenta nueva para no perder nada.
import { getCloud } from './cloud.js';

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
    'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes y vuelve a probar.',
    'auth/operation-not-allowed': 'Este tipo de acceso aún no está activado.',
    'auth/requires-recent-login': 'Por seguridad, cierra sesión, vuelve a entrar y repite la acción.',
    'auth/network-request-failed': 'No hay conexión. Inténtalo cuando tengas internet.',
  };
  return map[code] || `No se ha podido completar el acceso${code ? ` (${code.replace('auth/', '')})` : ''}. Inténtalo otra vez y, si sigue, mándanos este mensaje.`;
}
