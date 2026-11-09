// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "0a4cd1c0ce";
const PRECACHE = [
  "css/base.css",
  "dist/app-027a3c889c.css",
  "dist/chunk-2DH2CYI3.js",
  "dist/chunk-2LDD7UCG.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3FGUH3R5.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3RFHYDBU.js",
  "dist/chunk-43HY3Y5R.js",
  "dist/chunk-4CKHID7X.js",
  "dist/chunk-4KZF3SB5.js",
  "dist/chunk-5HRGMZGQ.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-67WDZFNX.js",
  "dist/chunk-6RKJXS27.js",
  "dist/chunk-6S2YA2KI.js",
  "dist/chunk-6SDMTVWC.js",
  "dist/chunk-7A4SWSXL.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7PCQ3GMZ.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AICK7OE6.js",
  "dist/chunk-AZBTG3I5.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BJQGLKSV.js",
  "dist/chunk-CZMKJTWZ.js",
  "dist/chunk-DN4TTOAJ.js",
  "dist/chunk-E4KC3HUP.js",
  "dist/chunk-EONFN6RI.js",
  "dist/chunk-ERDCLQWW.js",
  "dist/chunk-ETQJ6J6O.js",
  "dist/chunk-EWX4HQ6K.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FZLDOGM6.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-HC5MSGFZ.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IM4LPV42.js",
  "dist/chunk-INMG4DJH.js",
  "dist/chunk-IQDJGPM3.js",
  "dist/chunk-J47S5QKT.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JL7I3AOS.js",
  "dist/chunk-JQCXZHTF.js",
  "dist/chunk-JRYE3A77.js",
  "dist/chunk-KBK4MKYU.js",
  "dist/chunk-KNIJVNCT.js",
  "dist/chunk-KPDMQFTV.js",
  "dist/chunk-KSCH74EI.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-KYTCS52O.js",
  "dist/chunk-L53TXISH.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LPECEMKI.js",
  "dist/chunk-MI7CEX3Z.js",
  "dist/chunk-MVMXMA5I.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N4ZFG55M.js",
  "dist/chunk-NM72QMXW.js",
  "dist/chunk-NSU3CXTV.js",
  "dist/chunk-OFDA5WDK.js",
  "dist/chunk-OMVDGC6S.js",
  "dist/chunk-OR63YK75.js",
  "dist/chunk-OSIEAK6E.js",
  "dist/chunk-P3LJALNR.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PFDESLKD.js",
  "dist/chunk-PSK5ZPAD.js",
  "dist/chunk-Q5OQBL5Q.js",
  "dist/chunk-Q7H347YK.js",
  "dist/chunk-QCMKLZZN.js",
  "dist/chunk-QDEF6DJK.js",
  "dist/chunk-QQT7GER6.js",
  "dist/chunk-R6ARRQFW.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RUV42HNB.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4KKKQ37.js",
  "dist/chunk-S6GU7XIP.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SVC5ICYA.js",
  "dist/chunk-SVC5XZL3.js",
  "dist/chunk-T7EYTDPN.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TEZAGYDP.js",
  "dist/chunk-TSGXP44S.js",
  "dist/chunk-U4DHY4I4.js",
  "dist/chunk-U4MU5C37.js",
  "dist/chunk-UBJSIMMH.js",
  "dist/chunk-UE7RLMVG.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UOC4H7WA.js",
  "dist/chunk-UQXCMFY5.js",
  "dist/chunk-UV2TPQNS.js",
  "dist/chunk-UYXSRV2C.js",
  "dist/chunk-VEGTIANE.js",
  "dist/chunk-VMIEFX4U.js",
  "dist/chunk-VQHEG4SQ.js",
  "dist/chunk-VTFEFDNY.js",
  "dist/chunk-VWOGOAMX.js",
  "dist/chunk-WAHMYI4E.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WWKQ5NUF.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XGGJBLJ3.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XYQAXQFV.js",
  "dist/chunk-YDIWVDSS.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-YYCZNJ7J.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZL67PBE5.js",
  "dist/main-PXFEFDLT.js",
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
