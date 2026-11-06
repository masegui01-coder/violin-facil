// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "f483361093";
const PRECACHE = [
  "css/base.css",
  "dist/app-fab35e5a93.css",
  "dist/chunk-36AF4GNQ.js",
  "dist/chunk-3CFBRHI3.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3LRDL72N.js",
  "dist/chunk-46FTPE6L.js",
  "dist/chunk-4LANUZLQ.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5D4O74D5.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5SP6T2RV.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6GJK2M5G.js",
  "dist/chunk-6WIKIBXO.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AKCFODSA.js",
  "dist/chunk-AORGIASP.js",
  "dist/chunk-AWY63VXX.js",
  "dist/chunk-AYHXOCE5.js",
  "dist/chunk-B4NA5XMF.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BUP6ONUU.js",
  "dist/chunk-CA4OT74A.js",
  "dist/chunk-CJQMXIPX.js",
  "dist/chunk-CRPF6EA3.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-D7ZC7XY5.js",
  "dist/chunk-DHZ6Y5UR.js",
  "dist/chunk-EM3BYI2M.js",
  "dist/chunk-EQU4NDZ5.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-GJNAY4MM.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-GW3I64GS.js",
  "dist/chunk-HEV4QLVR.js",
  "dist/chunk-HM232F2B.js",
  "dist/chunk-HMMZMZ3M.js",
  "dist/chunk-HN3RXYNB.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IQUV5Z2M.js",
  "dist/chunk-IRDH5ZSZ.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JBJ4KJZP.js",
  "dist/chunk-KOYQARVR.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-L7F7SFPD.js",
  "dist/chunk-LDCKKG56.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LO2G2NNG.js",
  "dist/chunk-LWWWX2AW.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MN4S6YNW.js",
  "dist/chunk-MWX4MVWE.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N2VGWMRW.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NIQNSCZV.js",
  "dist/chunk-OBN64IGB.js",
  "dist/chunk-OCLO4KKM.js",
  "dist/chunk-OG4TTSTL.js",
  "dist/chunk-PBFWWOYR.js",
  "dist/chunk-PCDBBUE4.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-QJHSBW5G.js",
  "dist/chunk-QJPKH75V.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RIPJLUW3.js",
  "dist/chunk-RJ3NWQAQ.js",
  "dist/chunk-RJT6TN6T.js",
  "dist/chunk-RKKC732V.js",
  "dist/chunk-RKOH7ELR.js",
  "dist/chunk-RLSS5N3P.js",
  "dist/chunk-RPILVHIY.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-SBO4KWV6.js",
  "dist/chunk-SDLU3R2A.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SKURQI6P.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TKFL47ON.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TMAQO4QO.js",
  "dist/chunk-TZAOP25L.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-VFV2YMMA.js",
  "dist/chunk-VHGLYAUR.js",
  "dist/chunk-VMR564KO.js",
  "dist/chunk-VPQW42CC.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WU3F2YOS.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-Y4MKEV54.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YRXXCS3U.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-YV3U3TFA.js",
  "dist/chunk-Z2A3HNV3.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZGGGRFHG.js",
  "dist/chunk-ZUDTOB26.js",
  "dist/main-OORSVDZC.js",
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
