// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "a8483ea0f7";
const PRECACHE = [
  "css/base.css",
  "dist/app-b28cd8c1f1.css",
  "dist/chunk-27EL4QTU.js",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-2NBZOSIL.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3SYQ5NQN.js",
  "dist/chunk-3T5UAB75.js",
  "dist/chunk-4S6247TY.js",
  "dist/chunk-4YVLCA4H.js",
  "dist/chunk-5AHJUPHQ.js",
  "dist/chunk-6CJFJF6W.js",
  "dist/chunk-6TRZX5GS.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-B4Y2KM7F.js",
  "dist/chunk-BED5U5OZ.js",
  "dist/chunk-BHSJMTGE.js",
  "dist/chunk-CS2ETVL3.js",
  "dist/chunk-CVQ7ULJV.js",
  "dist/chunk-EPMOY22M.js",
  "dist/chunk-F2OF2RWG.js",
  "dist/chunk-FNCYJKSD.js",
  "dist/chunk-HCF3BBO7.js",
  "dist/chunk-HMCA5K4L.js",
  "dist/chunk-IUZDJQJZ.js",
  "dist/chunk-K6TXCEWK.js",
  "dist/chunk-LK4PNOWB.js",
  "dist/chunk-LNB5UGKJ.js",
  "dist/chunk-LYB2U4KA.js",
  "dist/chunk-MUIPMK4Q.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-NGD5EU3F.js",
  "dist/chunk-NZF5EKIU.js",
  "dist/chunk-OS336ZTM.js",
  "dist/chunk-OUHRGTUX.js",
  "dist/chunk-PFWXDCLI.js",
  "dist/chunk-PQD24AEF.js",
  "dist/chunk-Q3GWOFJA.js",
  "dist/chunk-QAMUS6LV.js",
  "dist/chunk-QGJT5P2C.js",
  "dist/chunk-QWQ3QH3G.js",
  "dist/chunk-SGOFOBNY.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-TEDIWJPW.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-VKPKAYXE.js",
  "dist/chunk-VNTN5FM3.js",
  "dist/chunk-WMO5HTFR.js",
  "dist/chunk-WQPPMCWR.js",
  "dist/chunk-X5DMMK4Q.js",
  "dist/chunk-Y37MHN2P.js",
  "dist/chunk-ZDXWSMKA.js",
  "dist/main-2TALL7CY.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-192.png",
  "icons/maskable-512.png",
  "index.html",
  "js/theme-boot.js",
  "manifest.webmanifest",
  "privacy.html"
];
const PREFIX = 'band-flow-';
const CACHE = `${PREFIX}${VERSION}`;
const IMAGES = `${PREFIX}img`;
const FONTS = `${PREFIX}fonts`;
const KEEP = [CACHE, IMAGES, FONTS];
const PAGE_TIMEOUT_MS = 3000;
const MAX_IMAGES = 150;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// El service worker anterior (sin versiones, primero red) no guarda nada que pueda mezclarse: se le releva sin preguntar
const LEGACY_CACHE = 'band-flow-v3';

self.addEventListener('install', e => e.waitUntil(
  // cache: 'reload' salta la caché HTTP del navegador para no precargar una copia vieja de la página
  caches.open(CACHE).then(c => c.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))))
    .then(() => caches.has(LEGACY_CACHE))
    .then(legacy => { if (legacy) self.skipWaiting(); }),
));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && !KEEP.includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()),
));

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Solo se guardan respuestas buenas (un 404 o un error del servidor no sustituye a la copia buena)
function store(cacheName, key, res) {
  if (!res.ok && res.type !== 'opaque') return Promise.resolve();
  const copy = res.clone();
  return caches.open(cacheName).then(c => c.put(key, copy)).catch(() => {});
}

function cacheFirst(e, cacheName) {
  return caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    e.waitUntil(store(cacheName, e.request, res));
    return res;
  }));
}

// Se borran las imágenes más antiguas cuando hay demasiadas
function trimImages() {
  return caches.open(IMAGES).then(c => c.keys().then(keys => Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_IMAGES)).map(k => c.delete(k)))));
}

function staleWhileRevalidate(e) {
  const network = fetch(e.request).then(res => {
    e.waitUntil(store(IMAGES, e.request, res).then(trimImages));
    return res;
  });
  e.waitUntil(network.catch(() => {}));
  return caches.match(e.request).then(hit => hit || network);
}

// ?banda=CODIGO o ?go=tuner no cambian la página: sin conexión se busca sin parámetros
function page(e) {
  const fallback = () => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'));
  const network = fetch(e.request);
  const slow = new Promise(resolve => setTimeout(resolve, PAGE_TIMEOUT_MS)).then(fallback);
  const offline = network.catch(fallback);
  // Si pasa el margen y no hay copia, se sigue esperando a la red
  return Promise.race([offline, slow.then(hit => hit || offline)]).then(res => res || Response.error());
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (FONT_HOSTS.includes(url.hostname)) { e.respondWith(cacheFirst(e, FONTS)); return; }
  if (url.origin !== location.origin) return;
  if (e.request.mode === 'navigate') { e.respondWith(page(e)); return; }
  const path = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (path.startsWith('dist/')) { e.respondWith(cacheFirst(e, CACHE)); return; }
  if (path.startsWith('img/')) { e.respondWith(staleWhileRevalidate(e)); return; }
  // El resto de lo precargado (iconos, manifiesto...) cambia con la versión: primero la copia; lo demás va a la red
  e.respondWith(caches.match(e.request, { cacheName: CACHE }).then(hit => hit || fetch(e.request)));
});
