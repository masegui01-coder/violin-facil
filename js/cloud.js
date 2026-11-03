// Conexión con Firebase (se carga solo cuando hace falta). Músicos: acceso anónimo. Directores: Google.
import { FIREBASE_CONFIG } from './firebase-config.js';

export const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
let cloudLoad = null;

export const cloudConfigured = () => !!FIREBASE_CONFIG;

// Ventanas de Google (popup). getAuth() las prepara al arrancar en móviles y Safari: descarga apis.google.com/js/api.js
// y un iframe (~650 ms de CPU) aunque nadie vaya a pulsar. Aquí Auth se crea SIN ese resolutor, con la misma
// persistencia que getAuth (la sesión guardada se restaura igual), y el resolutor se pasa solo en las llamadas
// *WithPopup. warmPopups() lo prepara antes del clic, cuando el usuario se acerca al botón o al formulario.
// La clase devuelve siempre la misma instancia: es la que la SDK usará en signInWithPopup (la guarda por clase).
function popupResolverFor(authFns) {
  const Base = authFns.browserPopupRedirectResolver;
  const instance = new Base();
  function PopupResolver() { return instance; }
  PopupResolver.prototype = Base.prototype;
  PopupResolver.instance = instance;
  return PopupResolver;
}

// Las funciones de Auth con el resolutor ya puesto: quien llame a c.authFns.signInWithPopup(…) no cambia nada
const WITH_PROVIDER = ['signInWithPopup', 'linkWithPopup', 'reauthenticateWithPopup', 'signInWithRedirect', 'linkWithRedirect', 'reauthenticateWithRedirect'];
function withPopupResolver(authFns, resolver) {
  const fns = { ...authFns };
  WITH_PROVIDER.forEach(name => { fns[name] = (target, provider, r) => authFns[name](target, provider, r || resolver); });
  fns.getRedirectResult = (a, r) => authFns.getRedirectResult(a, r || resolver);
  return fns;
}

async function loadCloud() {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const a = auth.initializeAuth(app, {
    persistence: [auth.indexedDBLocalPersistence, auth.browserLocalPersistence, auth.browserSessionPersistence],
  });
  await new Promise(resolve => { const off = auth.onAuthStateChanged(a, () => { off(); resolve(); }); });
  const popupResolver = popupResolverFor(auth);
  return { app, auth: a, authFns: withPopupResolver(auth, popupResolver), popupResolver, db: fs.getFirestore(app), fs };
}

export function getCloud() {
  if (!FIREBASE_CONFIG) return Promise.reject(new Error('El servidor de bandas todavía no está conectado.'));
  // Una sola carga aunque la pidan varios a la vez; si falla (sin conexión), se reintenta en la siguiente llamada
  cloudLoad ||= loadCloud().catch(e => { cloudLoad = null; throw e; });
  return cloudLoad;
}

// Prepara la ventana de Google para que se abra al momento al pulsar (si falla, se prepara al pulsar)
let popupsWarm = null;
let popupsReadyNow = false;
export function warmPopups() {
  if (!FIREBASE_CONFIG) return Promise.resolve(false);
  popupsWarm ||= getCloud()
    .then(c => c.popupResolver.instance._initialize(c.auth))
    .then(() => { popupsReadyNow = true; return true; }, () => { popupsWarm = null; return false; });
  return popupsWarm;
}
export const popupsReady = () => popupsReadyNow;

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
