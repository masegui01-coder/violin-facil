// Conexión con Firebase (se carga solo cuando hace falta). Músicos: acceso anónimo. Directores: Google.
import { FIREBASE_CONFIG } from './firebase-config.js';

export const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
let cloud = null;

export const cloudConfigured = () => !!FIREBASE_CONFIG;

export async function getCloud() {
  if (!FIREBASE_CONFIG) throw new Error('El servidor de bandas todavía no está conectado.');
  if (cloud) return cloud;
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const a = auth.getAuth(app);
  await new Promise(resolve => { const off = auth.onAuthStateChanged(a, () => { off(); resolve(); }); });
  cloud = { app, auth: a, authFns: auth, db: fs.getFirestore(app), fs };
  return cloud;
}

export async function currentUser() {
  const c = await getCloud();
  return c.auth.currentUser;
}

// Entra sin cuenta (músicos, también menores): la identidad queda guardada en este dispositivo
export async function ensureSignedIn() {
  const c = await getCloud();
  if (!c.auth.currentUser) await c.authFns.signInAnonymously(c.auth);
  return c.auth.currentUser;
}

// Directores: cuenta de Google. Si ya había una sesión anónima, se vincula para no perder datos.
export async function signInDirector() {
  const c = await getCloud();
  const provider = new c.authFns.GoogleAuthProvider();
  const u = c.auth.currentUser;
  if (u && u.isAnonymous) {
    try { await c.authFns.linkWithPopup(u, provider); return c.auth.currentUser; }
    catch (e) { if (e.code !== 'auth/credential-already-in-use') throw e; }
  }
  if (!u || u.isAnonymous) await c.authFns.signInWithPopup(c.auth, provider);
  return c.auth.currentUser;
}

export function cloudErrorText(err) {
  const code = err && err.code ? err.code : '';
  if (code.includes('permission-denied')) return 'No tienes permiso para hacer esto. Comprueba el código de la banda.';
  if (code.includes('popup-closed')) return 'Has cerrado la ventana de Google antes de terminar.';
  if (code.includes('unavailable') || code.includes('network')) return 'No hay conexión. Inténtalo de nuevo cuando tengas internet.';
  if (code.includes('unauthorized-domain')) return 'Falta autorizar esta web en Firebase (Authentication → Dominios autorizados).';
  return (err && err.message) || 'Algo ha fallado al conectar con el servidor.';
}

// Código corto y legible (sin 0/O ni 1/I) para invitaciones y partituras compartidas
export function randomCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}
