// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "264cb0dbd6";
const PRECACHE = [
  "css/base.css",
  "dist/app-f396264950.css",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3V7TBELS.js",
  "dist/chunk-44ITLDCK.js",
  "dist/chunk-46T4X25L.js",
  "dist/chunk-4FDN74NE.js",
  "dist/chunk-4PUINURJ.js",
  "dist/chunk-4YCXFNQM.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-67HZ5L4R.js",
  "dist/chunk-6DZPJUWS.js",
  "dist/chunk-6DZWGYCT.js",
  "dist/chunk-6G75XAB3.js",
  "dist/chunk-6I5WKT5M.js",
  "dist/chunk-6PWX36RF.js",
  "dist/chunk-6W4ZPY66.js",
  "dist/chunk-6WIKIBXO.js",
  "dist/chunk-6Y7WX3ES.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7RPT4H65.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AHCLP5EO.js",
  "dist/chunk-AJPXFMDT.js",
  "dist/chunk-AK7IJ2YH.js",
  "dist/chunk-ALJBHVYN.js",
  "dist/chunk-BASM3LZ4.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BNB7SMUT.js",
  "dist/chunk-BQ4D2O45.js",
  "dist/chunk-CDNZQVPL.js",
  "dist/chunk-CE3JGTWV.js",
  "dist/chunk-CNKVWQQO.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-DJOSXUW2.js",
  "dist/chunk-DRQZAN4P.js",
  "dist/chunk-DXZ7AXZE.js",
  "dist/chunk-E6IPCRWX.js",
  "dist/chunk-EMXNGDMK.js",
  "dist/chunk-ERCJMS7U.js",
  "dist/chunk-FE7AOGNL.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-HVSTMTZ3.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IAEE5ZTN.js",
  "dist/chunk-IDPAR7XO.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IFWMZT7F.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JXHEDCGI.js",
  "dist/chunk-KDKNEHDD.js",
  "dist/chunk-KOBKPEI7.js",
  "dist/chunk-LKSNK5RD.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MK2DJ6UD.js",
  "dist/chunk-MLMMH3J7.js",
  "dist/chunk-MN4S6YNW.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NBSRLY4N.js",
  "dist/chunk-NKQOIDKA.js",
  "dist/chunk-NRWF5G7A.js",
  "dist/chunk-O4TWCUAZ.js",
  "dist/chunk-OLTJV6SU.js",
  "dist/chunk-OMB6NCNR.js",
  "dist/chunk-OZAOPIR5.js",
  "dist/chunk-PDBVDUOL.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-QL2NYIUM.js",
  "dist/chunk-QNKLR7ZQ.js",
  "dist/chunk-QRU6ETMQ.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R33UIG4G.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RKKC732V.js",
  "dist/chunk-RMNBBCWM.js",
  "dist/chunk-RTLD5G7O.js",
  "dist/chunk-RUHQYM3K.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-S6F7OLW5.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SSD7VF7D.js",
  "dist/chunk-SVTYFCMW.js",
  "dist/chunk-T4LZ7OG6.js",
  "dist/chunk-T5THFYRA.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TRHVSYA5.js",
  "dist/chunk-TXQESFBX.js",
  "dist/chunk-U4DAM2PV.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UOV2OKT6.js",
  "dist/chunk-VBCTN5PZ.js",
  "dist/chunk-VIW7SSIX.js",
  "dist/chunk-VR57KJ2B.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WWQNEX27.js",
  "dist/chunk-X2GFQNVZ.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5KJEVMI.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XYMJXESP.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YHUQNEHX.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZAMKQAIA.js",
  "dist/chunk-ZUDTOB26.js",
  "dist/main-WXF3AO2G.js",
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
