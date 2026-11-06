// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "53f7d0b04b";
const PRECACHE = [
  "css/base.css",
  "dist/app-9425fe5564.css",
  "dist/chunk-24GDMUYI.js",
  "dist/chunk-2TU2BNKJ.js",
  "dist/chunk-32TOKXNA.js",
  "dist/chunk-37KHTP3C.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3TTBMTVD.js",
  "dist/chunk-3V7TBELS.js",
  "dist/chunk-3ZTVHHZE.js",
  "dist/chunk-4UKCOOPL.js",
  "dist/chunk-54CGOVI2.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5YCAL5AP.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6I5WKT5M.js",
  "dist/chunk-6OMEQ6AA.js",
  "dist/chunk-6OTC2R66.js",
  "dist/chunk-74CYXKCP.js",
  "dist/chunk-75ZGJH4N.js",
  "dist/chunk-7675YCXP.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7BHYPXXN.js",
  "dist/chunk-7BWTU3NU.js",
  "dist/chunk-AFNXU3AL.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ANV3ZD5F.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BVIWJ23W.js",
  "dist/chunk-BY2KSCDY.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-CVPQZ42Y.js",
  "dist/chunk-DI6X3LE2.js",
  "dist/chunk-DTXRNUEZ.js",
  "dist/chunk-EMXXGDVA.js",
  "dist/chunk-F5KVNWB5.js",
  "dist/chunk-F7XZTCFS.js",
  "dist/chunk-FE5ASKVZ.js",
  "dist/chunk-FFOLCPCP.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-GF77WRQ5.js",
  "dist/chunk-GOIOW2FG.js",
  "dist/chunk-I52RDNKM.js",
  "dist/chunk-I76EUTW2.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IVWCCTBN.js",
  "dist/chunk-IYMB7G4R.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JFF5KNNZ.js",
  "dist/chunk-KCBRQM4R.js",
  "dist/chunk-KOBKPEI7.js",
  "dist/chunk-KPN7M6ZX.js",
  "dist/chunk-L7JFWEOA.js",
  "dist/chunk-LOUSUZD7.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MLFAMRYI.js",
  "dist/chunk-MWTBNMXB.js",
  "dist/chunk-MX2XKCCG.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N5V5YESK.js",
  "dist/chunk-NPUQJF2W.js",
  "dist/chunk-NZK5AQE3.js",
  "dist/chunk-OCQK3ZVO.js",
  "dist/chunk-OEFAX77B.js",
  "dist/chunk-OT5RIPDX.js",
  "dist/chunk-PDBVDUOL.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-QRKGQZHQ.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R2SRSMZX.js",
  "dist/chunk-R33UIG4G.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-REQTJIJD.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RFG5TPTG.js",
  "dist/chunk-RI5OMV3G.js",
  "dist/chunk-RTLD5G7O.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-SHNVBT2D.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-STOXAZV3.js",
  "dist/chunk-SVTYFCMW.js",
  "dist/chunk-TAW64MBK.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TXIP2YBC.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UPWMLUYS.js",
  "dist/chunk-V3UK3GDI.js",
  "dist/chunk-VBHLR6C6.js",
  "dist/chunk-VFRRQJKN.js",
  "dist/chunk-VIQCST6K.js",
  "dist/chunk-VVSV6YTZ.js",
  "dist/chunk-W2J24NE5.js",
  "dist/chunk-W736AKHT.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WPTDD6MF.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5KJEVMI.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XPPMSSUQ.js",
  "dist/chunk-Y5PDFAVX.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YE2JJLHM.js",
  "dist/chunk-YHUQNEHX.js",
  "dist/chunk-YMVSYREX.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/main-NUWQNY4B.js",
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
