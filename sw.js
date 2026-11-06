// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "a5fa047cc5";
const PRECACHE = [
  "css/base.css",
  "dist/app-bb61e3f374.css",
  "dist/chunk-22XISMYW.js",
  "dist/chunk-23IPM5ZO.js",
  "dist/chunk-24SUIJLH.js",
  "dist/chunk-2BAXB22O.js",
  "dist/chunk-2DD7YYQQ.js",
  "dist/chunk-3CF4WKMG.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3NBZNPRW.js",
  "dist/chunk-4JFM4AI5.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5PKO7VN7.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5QH3XXR6.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6BJ4KGZN.js",
  "dist/chunk-6JGS2EKW.js",
  "dist/chunk-6KN7YZEV.js",
  "dist/chunk-6LP7QSPB.js",
  "dist/chunk-74SKADQV.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7MBRQWPZ.js",
  "dist/chunk-A6MSAW5W.js",
  "dist/chunk-ADR5Z3LH.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AILNFEGU.js",
  "dist/chunk-ALBEA3OG.js",
  "dist/chunk-B5TPIUOV.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF3FLQPO.js",
  "dist/chunk-BTWW2XUY.js",
  "dist/chunk-C66N4ZUW.js",
  "dist/chunk-CDTRYWSY.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-CYKEINQE.js",
  "dist/chunk-D4IISM2C.js",
  "dist/chunk-DQVJQSO2.js",
  "dist/chunk-DRV4KI7P.js",
  "dist/chunk-DSHBLOJR.js",
  "dist/chunk-E4H6EZRA.js",
  "dist/chunk-EQGDGKOD.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FJCTUYA6.js",
  "dist/chunk-FW444NJ2.js",
  "dist/chunk-G3QY4LBC.js",
  "dist/chunk-GHD2IDME.js",
  "dist/chunk-HXVJJK65.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IA7EFCRR.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IXSG3RDX.js",
  "dist/chunk-J2TVXLQC.js",
  "dist/chunk-J3FVZWA6.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JOO35XPO.js",
  "dist/chunk-JRD2LVOH.js",
  "dist/chunk-KPZ7V7F4.js",
  "dist/chunk-KX35BQZV.js",
  "dist/chunk-L55ARXBP.js",
  "dist/chunk-LLPP6GLQ.js",
  "dist/chunk-LTD2SBUI.js",
  "dist/chunk-LWBWCNRU.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MNN2JCIY.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N4LWG36X.js",
  "dist/chunk-N4WA3TKQ.js",
  "dist/chunk-P6SB555O.js",
  "dist/chunk-P7XNUKOE.js",
  "dist/chunk-PE2XYITF.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PI6P3KUT.js",
  "dist/chunk-PITAKWFU.js",
  "dist/chunk-PKUZTPQK.js",
  "dist/chunk-Q3W52LHZ.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QZIV2HGC.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RAWJKXXY.js",
  "dist/chunk-RBVWEIYG.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-S5PH6JRF.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SLIZDYOZ.js",
  "dist/chunk-SSGUR6DR.js",
  "dist/chunk-SW3Z23TI.js",
  "dist/chunk-T2NEKUSE.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-UDB7VLLD.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UN2KJYVC.js",
  "dist/chunk-UURLPWBD.js",
  "dist/chunk-V3WXHXZN.js",
  "dist/chunk-VDTH6C3S.js",
  "dist/chunk-VWYWEWUP.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WOYMKU3G.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YLEQL3I2.js",
  "dist/chunk-YSULEDHQ.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZMZMAKDU.js",
  "dist/main-BZ3T3M72.js",
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
