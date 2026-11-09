// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "a2445d33c4";
const PRECACHE = [
  "css/base.css",
  "dist/app-87cd8c262b.css",
  "dist/chunk-2A7H4DM2.js",
  "dist/chunk-2DH2CYI3.js",
  "dist/chunk-2MSD44FK.js",
  "dist/chunk-2N5T5SFI.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3FGUH3R5.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3RFHYDBU.js",
  "dist/chunk-3T6XPDX7.js",
  "dist/chunk-4CKHID7X.js",
  "dist/chunk-4IOAZ6WY.js",
  "dist/chunk-4KZF3SB5.js",
  "dist/chunk-4QNLIPZI.js",
  "dist/chunk-4TFIINWE.js",
  "dist/chunk-5B6ZGIRU.js",
  "dist/chunk-5KEM3L7R.js",
  "dist/chunk-5NZM7QKY.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-765XQNSW.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7ICAVZTD.js",
  "dist/chunk-7LN4SRLY.js",
  "dist/chunk-A4RJDXXD.js",
  "dist/chunk-ABPNRBAD.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BG4ZEGZM.js",
  "dist/chunk-BLHVXN4A.js",
  "dist/chunk-BVSNI5ST.js",
  "dist/chunk-CG7A24QZ.js",
  "dist/chunk-CZMKJTWZ.js",
  "dist/chunk-D5FGCTU5.js",
  "dist/chunk-DN4TTOAJ.js",
  "dist/chunk-EQSCUK6O.js",
  "dist/chunk-EUPVGH7L.js",
  "dist/chunk-F37GWYUR.js",
  "dist/chunk-F6AXJUZD.js",
  "dist/chunk-FDLCL335.js",
  "dist/chunk-FI6QODTX.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FKY6YPJ6.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-HURB7TMS.js",
  "dist/chunk-HZJNWFR2.js",
  "dist/chunk-I342GIIJ.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IDZJQD5G.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IFKNKHLU.js",
  "dist/chunk-INMG4DJH.js",
  "dist/chunk-IQDJGPM3.js",
  "dist/chunk-J5O5PDSW.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JJSZUWYQ.js",
  "dist/chunk-JJWTW5HO.js",
  "dist/chunk-JQCXZHTF.js",
  "dist/chunk-JRYE3A77.js",
  "dist/chunk-K2ELAJT2.js",
  "dist/chunk-KDZ46Z5V.js",
  "dist/chunk-KLI2XSNX.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-L5WR4MFZ.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NG2IX6JF.js",
  "dist/chunk-O6PEWZ7X.js",
  "dist/chunk-OALYDB5U.js",
  "dist/chunk-OHDBQGJM.js",
  "dist/chunk-OMVDGC6S.js",
  "dist/chunk-OSE67RWF.js",
  "dist/chunk-OSIEAK6E.js",
  "dist/chunk-OY5WHQIU.js",
  "dist/chunk-P7DUDWNY.js",
  "dist/chunk-PDOGWKCP.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PJD36J64.js",
  "dist/chunk-PNYUKUOG.js",
  "dist/chunk-PRVIVYUZ.js",
  "dist/chunk-QVTADVLH.js",
  "dist/chunk-R4EDIOW5.js",
  "dist/chunk-R6ARRQFW.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RH4QZHQB.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-SAFTFLZU.js",
  "dist/chunk-SGIFNTEF.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SVC5ICYA.js",
  "dist/chunk-SVC5XZL3.js",
  "dist/chunk-SY3KC4XG.js",
  "dist/chunk-SZEAO6DW.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TOOGHIJ5.js",
  "dist/chunk-TSGXP44S.js",
  "dist/chunk-TYFYI4AL.js",
  "dist/chunk-UCDYZ45L.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UOC4H7WA.js",
  "dist/chunk-VQHEG4SQ.js",
  "dist/chunk-WK5DX26P.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WWT4CHVO.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-X7A52EIN.js",
  "dist/chunk-XGZISI4U.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XRRNRL75.js",
  "dist/chunk-YDUUA47N.js",
  "dist/chunk-YJT3HQJK.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/main-CNDY6SAY.js",
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
