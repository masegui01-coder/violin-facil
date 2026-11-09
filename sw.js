// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "d7269e2cb8";
const PRECACHE = [
  "css/base.css",
  "dist/app-027a3c889c.css",
  "dist/chunk-24UIHSVP.js",
  "dist/chunk-26QOMG55.js",
  "dist/chunk-2DH2CYI3.js",
  "dist/chunk-2NMD6NW6.js",
  "dist/chunk-2VOYNSF4.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3FGUH3R5.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3QRJJVJT.js",
  "dist/chunk-3RFHYDBU.js",
  "dist/chunk-4CKHID7X.js",
  "dist/chunk-4HZHQCIZ.js",
  "dist/chunk-4KZF3SB5.js",
  "dist/chunk-4Q52NSUT.js",
  "dist/chunk-4XRA57TM.js",
  "dist/chunk-4ZKYCCOF.js",
  "dist/chunk-5BFHHQLY.js",
  "dist/chunk-5LPXAP32.js",
  "dist/chunk-5NBY3T4G.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-77XCGZT5.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7FRN2P7U.js",
  "dist/chunk-7LBWYSYK.js",
  "dist/chunk-AANXCGF3.js",
  "dist/chunk-AGEK36KI.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ARRKLGLO.js",
  "dist/chunk-AZSOVDZX.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BITBFK42.js",
  "dist/chunk-BUKNQBAP.js",
  "dist/chunk-CQZCO6MI.js",
  "dist/chunk-CZMKJTWZ.js",
  "dist/chunk-D34ZOMF3.js",
  "dist/chunk-D7H2TNGK.js",
  "dist/chunk-DGWSWDYL.js",
  "dist/chunk-DN4TTOAJ.js",
  "dist/chunk-E6SAFTG2.js",
  "dist/chunk-EB2QWYEM.js",
  "dist/chunk-EOVGUXGQ.js",
  "dist/chunk-FHM32DGE.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FIPXHVG2.js",
  "dist/chunk-GCXY2S3F.js",
  "dist/chunk-GNPAEVXD.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-HHL24SK5.js",
  "dist/chunk-HKLOPZXK.js",
  "dist/chunk-HMUXVL45.js",
  "dist/chunk-HN7PR2Q2.js",
  "dist/chunk-HVPRMDKI.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-INMG4DJH.js",
  "dist/chunk-IQDJGPM3.js",
  "dist/chunk-IS3VM5U5.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JQCXZHTF.js",
  "dist/chunk-JRYE3A77.js",
  "dist/chunk-JV2OXUBK.js",
  "dist/chunk-JXAN3MG3.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LLOHQGBF.js",
  "dist/chunk-M4XS6TIC.js",
  "dist/chunk-MDFZ6MSV.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NDBD2HQU.js",
  "dist/chunk-NUQII3ZX.js",
  "dist/chunk-OMVDGC6S.js",
  "dist/chunk-OQ4I47HG.js",
  "dist/chunk-OSIEAK6E.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-Q5R3TLRZ.js",
  "dist/chunk-QCVVRRW4.js",
  "dist/chunk-QV6SY5WJ.js",
  "dist/chunk-R6ARRQFW.js",
  "dist/chunk-R6EQFLUS.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RD434VPI.js",
  "dist/chunk-RDSKJWSB.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RM46PZUK.js",
  "dist/chunk-RNR7TKQH.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-SB2JBKAZ.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SNL57STC.js",
  "dist/chunk-SOX7WEW2.js",
  "dist/chunk-SSWORYUJ.js",
  "dist/chunk-SVC5ICYA.js",
  "dist/chunk-SVC5XZL3.js",
  "dist/chunk-T3OTBZPS.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TIVQFIBS.js",
  "dist/chunk-TOENIJHL.js",
  "dist/chunk-TQISQGFA.js",
  "dist/chunk-TSGXP44S.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UOC4H7WA.js",
  "dist/chunk-UWTC4WQQ.js",
  "dist/chunk-VQHEG4SQ.js",
  "dist/chunk-VQY5YGT3.js",
  "dist/chunk-WKOSZF4F.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-YPEFNZ6F.js",
  "dist/chunk-YU4A6Z5E.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/main-RE24IFRY.js",
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
