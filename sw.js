// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "d72c58f379";
const PRECACHE = [
  "css/base.css",
  "dist/app-e0315bb108.css",
  "dist/chunk-332ZX3C3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-45EJ5E5Z.js",
  "dist/chunk-4CJPF4BC.js",
  "dist/chunk-4EIXEHBV.js",
  "dist/chunk-5R5M6KG3.js",
  "dist/chunk-6ASR2TG3.js",
  "dist/chunk-6CJFJF6W.js",
  "dist/chunk-6J54URUL.js",
  "dist/chunk-6QSZPV66.js",
  "dist/chunk-6WMIATDG.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-A6PF44CZ.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AKWBOCCA.js",
  "dist/chunk-AWPGVNIB.js",
  "dist/chunk-COB7AIL7.js",
  "dist/chunk-CTDBFEL2.js",
  "dist/chunk-DKC46RUZ.js",
  "dist/chunk-F6DOSOLF.js",
  "dist/chunk-GJUJSYKC.js",
  "dist/chunk-GLQBNJ53.js",
  "dist/chunk-HAVBGHWP.js",
  "dist/chunk-IDWL73QI.js",
  "dist/chunk-L3S2XW4M.js",
  "dist/chunk-L4BCYJBU.js",
  "dist/chunk-LRWBTRMI.js",
  "dist/chunk-M3BJCULC.js",
  "dist/chunk-MH3UMS77.js",
  "dist/chunk-MPMRWOWG.js",
  "dist/chunk-MUIPMK4Q.js",
  "dist/chunk-MYUHIMJ6.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-NEED5LWC.js",
  "dist/chunk-NKDM5CTR.js",
  "dist/chunk-NTOPSF27.js",
  "dist/chunk-OKFE2TKN.js",
  "dist/chunk-QFQK4W5P.js",
  "dist/chunk-QGAOWZM6.js",
  "dist/chunk-RTV3OOS4.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-T3I5LD5L.js",
  "dist/chunk-TLMYMYPT.js",
  "dist/chunk-TSAECV4D.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-X222PP65.js",
  "dist/chunk-XV2Y6V5D.js",
  "dist/chunk-ZT3ZBLYM.js",
  "dist/main-RX3ERZYH.js",
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
