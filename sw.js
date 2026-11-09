// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "9050391c10";
const PRECACHE = [
  "css/base.css",
  "dist/app-027a3c889c.css",
  "dist/chunk-2DH2CYI3.js",
  "dist/chunk-2NCRTUEH.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3FGUH3R5.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3NPP5MHP.js",
  "dist/chunk-3ORTJATI.js",
  "dist/chunk-3UKYJKKF.js",
  "dist/chunk-3XNK442W.js",
  "dist/chunk-3YX4IHQ6.js",
  "dist/chunk-4HNA3NOM.js",
  "dist/chunk-4S52WH6W.js",
  "dist/chunk-53ILXAFA.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5SEK62FA.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6BS57LWG.js",
  "dist/chunk-6MVEL7LO.js",
  "dist/chunk-6UHOC65U.js",
  "dist/chunk-72PPKVS3.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AKM43R4D.js",
  "dist/chunk-AO6VQK4X.js",
  "dist/chunk-ATCGSTZ6.js",
  "dist/chunk-AWIGTKDV.js",
  "dist/chunk-AYGXHMHS.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BLYJLNM6.js",
  "dist/chunk-BO6J3INX.js",
  "dist/chunk-BQ4QU6Q5.js",
  "dist/chunk-CIUUKEPQ.js",
  "dist/chunk-CJDBZIWV.js",
  "dist/chunk-CTDM3R4I.js",
  "dist/chunk-EBG5JJFF.js",
  "dist/chunk-EONH6NT2.js",
  "dist/chunk-EQRKKBMY.js",
  "dist/chunk-EZ53PCAI.js",
  "dist/chunk-F2NZATHE.js",
  "dist/chunk-F4A2HNMA.js",
  "dist/chunk-F4MRXGSO.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FPS64J55.js",
  "dist/chunk-FVS2GN42.js",
  "dist/chunk-G6MQD5AD.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-GWBCMY3Q.js",
  "dist/chunk-H4F4TYD2.js",
  "dist/chunk-HDFTJMIM.js",
  "dist/chunk-HMB2XOI3.js",
  "dist/chunk-HRZQ3K22.js",
  "dist/chunk-HSBHJFGH.js",
  "dist/chunk-HZ5VBNJ6.js",
  "dist/chunk-I3DMII7U.js",
  "dist/chunk-I3X34HNB.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IC3DJDVK.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JDJZKCRF.js",
  "dist/chunk-JQ43OTJT.js",
  "dist/chunk-KM4QPOIH.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-L547XSJM.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LMDHXVNG.js",
  "dist/chunk-LMJHLK22.js",
  "dist/chunk-LRSOQ2FO.js",
  "dist/chunk-M6YD6BPV.js",
  "dist/chunk-M7MYLHQD.js",
  "dist/chunk-MQU26FRJ.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-OBXKQ5XW.js",
  "dist/chunk-OMVDGC6S.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PXWHFF5S.js",
  "dist/chunk-Q4DRF72Y.js",
  "dist/chunk-QNLMCKXJ.js",
  "dist/chunk-QZRFXUVT.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-RXYH5S6O.js",
  "dist/chunk-SA3UADNO.js",
  "dist/chunk-SAIOCKBB.js",
  "dist/chunk-SEAHRZDR.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SVC5XZL3.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TR6QPM33.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UOKKL46W.js",
  "dist/chunk-USYIEJTC.js",
  "dist/chunk-UWRQBRNW.js",
  "dist/chunk-VH7V4ERE.js",
  "dist/chunk-VQCUBNEE.js",
  "dist/chunk-VZS6JSD3.js",
  "dist/chunk-W572YKDQ.js",
  "dist/chunk-WFBNJMPT.js",
  "dist/chunk-WJNQRIKE.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X56LFARI.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XLXECEQ5.js",
  "dist/chunk-XX22TXX5.js",
  "dist/chunk-Y2ZG5DJH.js",
  "dist/chunk-YL3OO76D.js",
  "dist/chunk-YQ5XULSB.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-YZD73GO3.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZWN7VE7F.js",
  "dist/main-EPLYNQTL.js",
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
