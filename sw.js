// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "72687c882d";
const PRECACHE = [
  "css/base.css",
  "dist/app-5b6b0cc062.css",
  "dist/chunk-27JXQ7TO.js",
  "dist/chunk-2FCJZTPG.js",
  "dist/chunk-2FOXNPZC.js",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-2KNMJP5N.js",
  "dist/chunk-3D5T6RK7.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-43V3C5V2.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-55E7BIKP.js",
  "dist/chunk-5SUAPSMZ.js",
  "dist/chunk-5UIBZUNJ.js",
  "dist/chunk-6BK24W5U.js",
  "dist/chunk-6CJFJF6W.js",
  "dist/chunk-6JI55EXY.js",
  "dist/chunk-6T6CRPHK.js",
  "dist/chunk-7A4SOKRI.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7EIVBVH6.js",
  "dist/chunk-7EROG36H.js",
  "dist/chunk-7QX4YZ4J.js",
  "dist/chunk-A5TKVJZF.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AK74PU6J.js",
  "dist/chunk-BT2BSBK5.js",
  "dist/chunk-C2U5SHVG.js",
  "dist/chunk-CFI7DDLH.js",
  "dist/chunk-CR3YVOQF.js",
  "dist/chunk-CZZYWDJE.js",
  "dist/chunk-DKFXQ6SW.js",
  "dist/chunk-DMKXVI4B.js",
  "dist/chunk-DOPPHLEZ.js",
  "dist/chunk-DUQR2HXZ.js",
  "dist/chunk-DWKO5AKR.js",
  "dist/chunk-EVDLOTFZ.js",
  "dist/chunk-F5BSBLXL.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FFDM4ASN.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FQ64M2FG.js",
  "dist/chunk-FYGSAUOJ.js",
  "dist/chunk-GR4OSMNI.js",
  "dist/chunk-GYJSBYR4.js",
  "dist/chunk-H5EPM347.js",
  "dist/chunk-HKLUZOT7.js",
  "dist/chunk-HM4UDG5X.js",
  "dist/chunk-IATPSSDF.js",
  "dist/chunk-IDIXG4FS.js",
  "dist/chunk-IKH33I2V.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JIESCXMT.js",
  "dist/chunk-JTWYFVQD.js",
  "dist/chunk-K47M25F3.js",
  "dist/chunk-KMOQNTQR.js",
  "dist/chunk-L4GPVJD4.js",
  "dist/chunk-L4YIPSWW.js",
  "dist/chunk-LFVOD7NT.js",
  "dist/chunk-M4J75FEJ.js",
  "dist/chunk-MF5DKSQI.js",
  "dist/chunk-MHKI3ZVN.js",
  "dist/chunk-MJIOUXX4.js",
  "dist/chunk-MUIPMK4Q.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N5YX3K2P.js",
  "dist/chunk-N6IXMRZT.js",
  "dist/chunk-NKIOS3W4.js",
  "dist/chunk-O5UCHD6W.js",
  "dist/chunk-OHPQP4CV.js",
  "dist/chunk-OQL743KZ.js",
  "dist/chunk-OUHRGTUX.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PNF4LMSO.js",
  "dist/chunk-QPCQWUOS.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RHLCG4IA.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SOH6T72G.js",
  "dist/chunk-SXASX3Y2.js",
  "dist/chunk-T7JHY4LX.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UHYNNQSK.js",
  "dist/chunk-UKCTW6SK.js",
  "dist/chunk-UODRO5Z2.js",
  "dist/chunk-UST5WJ6B.js",
  "dist/chunk-VOVQMIHC.js",
  "dist/chunk-W4P3BR5O.js",
  "dist/chunk-WBJYOOIR.js",
  "dist/chunk-WWWFMHNZ.js",
  "dist/chunk-XQKVIPFY.js",
  "dist/chunk-XSVGW5HP.js",
  "dist/chunk-Y6QBLZJ3.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YMR5ITDI.js",
  "dist/chunk-YWWXT7MM.js",
  "dist/chunk-Z2KFXQDO.js",
  "dist/main-4FXHYSDR.js",
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
