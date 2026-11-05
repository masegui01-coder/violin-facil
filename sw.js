// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "eb4fbd0bd4";
const PRECACHE = [
  "css/base.css",
  "dist/app-4bd186bea3.css",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-2KNMJP5N.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-4GXZCSM7.js",
  "dist/chunk-4MSYFV5Q.js",
  "dist/chunk-4VCTBNNB.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5HMZPKWB.js",
  "dist/chunk-5R5LOFWV.js",
  "dist/chunk-6CJFJF6W.js",
  "dist/chunk-6DDGNSFX.js",
  "dist/chunk-6EVKRM6I.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7GALQ37E.js",
  "dist/chunk-A5NCQVQP.js",
  "dist/chunk-AFCXQ35M.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AXFNQ3R4.js",
  "dist/chunk-BV2U6CKS.js",
  "dist/chunk-CG57UKPD.js",
  "dist/chunk-DKFXQ6SW.js",
  "dist/chunk-DP72B263.js",
  "dist/chunk-EB7ORJJ3.js",
  "dist/chunk-EUXE56VD.js",
  "dist/chunk-F3NN4HLQ.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FEGKSSPF.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FNWFQYTY.js",
  "dist/chunk-GIJO6SC6.js",
  "dist/chunk-GMOLP6TN.js",
  "dist/chunk-H23XBD27.js",
  "dist/chunk-HNCJDYKB.js",
  "dist/chunk-HPOY2HIE.js",
  "dist/chunk-HTBFO3R5.js",
  "dist/chunk-I7JFG3PY.js",
  "dist/chunk-ID4X35FF.js",
  "dist/chunk-IDEJH4TJ.js",
  "dist/chunk-IXD3EWJF.js",
  "dist/chunk-J52VJMSD.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JAITRJLF.js",
  "dist/chunk-JXFNGRYE.js",
  "dist/chunk-KH25QUAL.js",
  "dist/chunk-KKK4VCZJ.js",
  "dist/chunk-KUCKRYNZ.js",
  "dist/chunk-L4XMMDCV.js",
  "dist/chunk-MOMBXBRQ.js",
  "dist/chunk-MUIPMK4Q.js",
  "dist/chunk-MXXBV7NH.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N5YX3K2P.js",
  "dist/chunk-NKIOS3W4.js",
  "dist/chunk-NOAQXBNY.js",
  "dist/chunk-O2G32CHB.js",
  "dist/chunk-OHPQP4CV.js",
  "dist/chunk-OUHRGTUX.js",
  "dist/chunk-PPPPPSUB.js",
  "dist/chunk-PXQIJAY6.js",
  "dist/chunk-QPFG77DR.js",
  "dist/chunk-QQ7YXONU.js",
  "dist/chunk-QSA5SACE.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QWMJ3TGD.js",
  "dist/chunk-QWSQORY3.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RAPR6RWI.js",
  "dist/chunk-RKCBSLUO.js",
  "dist/chunk-RTXV6EKE.js",
  "dist/chunk-SGTSIEF3.js",
  "dist/chunk-SISVAT3E.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SOH6T72G.js",
  "dist/chunk-SRWSY527.js",
  "dist/chunk-SXASX3Y2.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TJ76WVDE.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-U6LHO2TP.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UHYNNQSK.js",
  "dist/chunk-VFZVQB3E.js",
  "dist/chunk-VUYHF6ID.js",
  "dist/chunk-W4P3BR5O.js",
  "dist/chunk-WBWDTDTY.js",
  "dist/chunk-WMPS54U5.js",
  "dist/chunk-WOM5PHQK.js",
  "dist/chunk-WXV4WX7T.js",
  "dist/chunk-XIE4FIVK.js",
  "dist/chunk-XSVGW5HP.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YHEOEDTW.js",
  "dist/chunk-YMAA3PAQ.js",
  "dist/chunk-YNVFAM67.js",
  "dist/chunk-ZGE2WJ7Q.js",
  "dist/chunk-ZTLVGYFC.js",
  "dist/chunk-ZUTCSY6H.js",
  "dist/main-5NZY7D7Q.js",
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
