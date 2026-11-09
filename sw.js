// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "5a8e7bf44b";
const PRECACHE = [
  "css/base.css",
  "dist/app-5f081836d2.css",
  "dist/chunk-2B7NRKIT.js",
  "dist/chunk-2N2QEI2K.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3HSOU2WN.js",
  "dist/chunk-3OZFLFZ2.js",
  "dist/chunk-3U672ARB.js",
  "dist/chunk-3XDVLWOS.js",
  "dist/chunk-4F43XA3G.js",
  "dist/chunk-4WK34R4R.js",
  "dist/chunk-4YFWDJBF.js",
  "dist/chunk-4ZMA7XK3.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-56BFEYRL.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5RBYGBPG.js",
  "dist/chunk-5XXZZFML.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6G7FWJDB.js",
  "dist/chunk-6HC4IW52.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7FMXRFGR.js",
  "dist/chunk-7I5L62TR.js",
  "dist/chunk-7PGZEWIV.js",
  "dist/chunk-7XLVIX5M.js",
  "dist/chunk-AG4MM6HB.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AK5EFOIQ.js",
  "dist/chunk-BARV5B6D.js",
  "dist/chunk-BBIHSQ7G.js",
  "dist/chunk-BD7YZ5GV.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BX7GHTBK.js",
  "dist/chunk-CRBNPI4W.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-CVUZQDXN.js",
  "dist/chunk-EEWMM3OK.js",
  "dist/chunk-EFW5A7JN.js",
  "dist/chunk-F2WNZN64.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FZ3ZRHPQ.js",
  "dist/chunk-GA76CIMH.js",
  "dist/chunk-GM2A5RU4.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-HAXXH7F5.js",
  "dist/chunk-HIB2SUDJ.js",
  "dist/chunk-HJ4OOQND.js",
  "dist/chunk-HWC5XS7K.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JOLHXGIK.js",
  "dist/chunk-JSVYVYYO.js",
  "dist/chunk-KOYQARVR.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-L4U7ZLF3.js",
  "dist/chunk-LIV77234.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-M5KKYQMA.js",
  "dist/chunk-MNFSEBDQ.js",
  "dist/chunk-MR5ZNAWO.js",
  "dist/chunk-MTDB6XIJ.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NA7ESAJF.js",
  "dist/chunk-NIAIEVJH.js",
  "dist/chunk-OPFSGP2C.js",
  "dist/chunk-OQR5LGNM.js",
  "dist/chunk-P23QSVTF.js",
  "dist/chunk-P6A77IY6.js",
  "dist/chunk-P6OR6QPQ.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PUF5RW25.js",
  "dist/chunk-PYVMIEOZ.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QUYGE7NX.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SLALQI3N.js",
  "dist/chunk-T3BU4ZY3.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TG3GJYSX.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-U3CRNBLZ.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UNE4L7SZ.js",
  "dist/chunk-USHA465M.js",
  "dist/chunk-VBHXGCLJ.js",
  "dist/chunk-VFSINA3Y.js",
  "dist/chunk-VJCODDLV.js",
  "dist/chunk-WHQDD4MK.js",
  "dist/chunk-WOQ43UQR.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WTYTA73V.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJ2HM5Z3.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XZLNEGNY.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z3I6F46T.js",
  "dist/chunk-Z6YXDWDW.js",
  "dist/chunk-ZH57XGHF.js",
  "dist/chunk-ZSMW73GH.js",
  "dist/main-SDD6FE3H.js",
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
