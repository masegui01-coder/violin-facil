// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "ba8424c4da";
const PRECACHE = [
  "css/base.css",
  "dist/app-bb61e3f374.css",
  "dist/chunk-23GLFEN6.js",
  "dist/chunk-2P4PW5T7.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-4JFM4AI5.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5BBL7KZX.js",
  "dist/chunk-5EDYIRXU.js",
  "dist/chunk-5O533VLG.js",
  "dist/chunk-5PKO7VN7.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6ARIDH2L.js",
  "dist/chunk-6CRSOSKL.js",
  "dist/chunk-6JGS2EKW.js",
  "dist/chunk-6LP7QSPB.js",
  "dist/chunk-6Y2XOFAJ.js",
  "dist/chunk-74GAEPAL.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7EYHBDEI.js",
  "dist/chunk-7JXMBDHS.js",
  "dist/chunk-7MDV7AKT.js",
  "dist/chunk-A4WE3DNG.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ALBEA3OG.js",
  "dist/chunk-AVBCU33L.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF3FLQPO.js",
  "dist/chunk-BKLBQ2RF.js",
  "dist/chunk-BTWW2XUY.js",
  "dist/chunk-BW77QWUD.js",
  "dist/chunk-C3F2ZZIV.js",
  "dist/chunk-CB76XVYS.js",
  "dist/chunk-CE6SWYTA.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-CYKEINQE.js",
  "dist/chunk-D3CH3NDV.js",
  "dist/chunk-DBJAVIVT.js",
  "dist/chunk-DBOQJZNJ.js",
  "dist/chunk-DRRFZ52W.js",
  "dist/chunk-DS57EHRH.js",
  "dist/chunk-DUFY6YG4.js",
  "dist/chunk-DWPRTX5M.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-GGMX3B6K.js",
  "dist/chunk-HVNUYLHN.js",
  "dist/chunk-I4H42SUC.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IGB5VJFS.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JOO35XPO.js",
  "dist/chunk-JSBJGR73.js",
  "dist/chunk-KIDFAY4H.js",
  "dist/chunk-KYJXP4RR.js",
  "dist/chunk-LXLKDEVF.js",
  "dist/chunk-M3UOTVUQ.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-M7VXAW65.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MJB3EPOT.js",
  "dist/chunk-MVHUGECE.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N24AK4JN.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N5ZGVL5R.js",
  "dist/chunk-NKCXMGXK.js",
  "dist/chunk-PCNKCXBS.js",
  "dist/chunk-PEVWHZ77.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PJ2MKAFR.js",
  "dist/chunk-PU3E75SO.js",
  "dist/chunk-Q5OOYTUD.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QUXX27TF.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RD35NRX4.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-RXFO7Q7U.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-T6QYJTZJ.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TETBOHCD.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-U2LOGCKG.js",
  "dist/chunk-UBINBRXW.js",
  "dist/chunk-UDB7VLLD.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UIOL4Q7X.js",
  "dist/chunk-V3HJTA7X.js",
  "dist/chunk-VMHTCI6G.js",
  "dist/chunk-VWYWEWUP.js",
  "dist/chunk-W3YGDQGW.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WWC3RDXO.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YEAD6LD2.js",
  "dist/chunk-YJOVZR53.js",
  "dist/chunk-YKD3BEAK.js",
  "dist/chunk-YLEQL3I2.js",
  "dist/chunk-YSULEDHQ.js",
  "dist/chunk-YTJKFC6V.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZCPAGTGU.js",
  "dist/chunk-ZD4BRAJB.js",
  "dist/main-76TYD5RB.js",
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
