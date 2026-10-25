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

// Google: vincula la sesión anónima; si esa cuenta de Google ya existía, entra en ella (sin abrir otra ventana)
export async function signInWithGoogle() {
  const c = await getCloud();
  const provider = new c.authFns.GoogleAuthProvider();
  const anon = c.auth.currentUser && c.auth.currentUser.isAnonymous ? c.auth.currentUser : null;
  if (!anon) return (await c.authFns.signInWithPopup(c.auth, provider)).user;
  try {
    return (await c.authFns.linkWithPopup(anon, provider)).user;
  } catch (e) {
    const cred = e.code === 'auth/credential-already-in-use' ? c.authFns.GoogleAuthProvider.credentialFromError(e) : null;
    if (!cred) throw e;
    return (await c.authFns.signInWithCredential(c.auth, cred)).user;
  }
}

export async function signUpWithEmail(name, email, password) {
  const c = await getCloud();
  const anon = c.auth.currentUser && c.auth.currentUser.isAnonymous ? c.auth.currentUser : null;
  const u = anon
    ? (await c.authFns.linkWithCredential(anon, c.authFns.EmailAuthProvider.credential(email, password))).user
    : (await c.authFns.createUserWithEmailAndPassword(c.auth, email, password)).user;
  if (name) await c.authFns.updateProfile(u, { displayName: name });
  return u;
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
    'auth/email-already-in-use': 'Ya hay una cuenta con ese correo: usa «Ya tengo cuenta».',
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
  return map[code] || (err && err.message) || 'No se ha podido completar el acceso.';
}
