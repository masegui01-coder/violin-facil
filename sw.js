// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "674508179a";
const PRECACHE = [
  "css/base.css",
  "dist/app-283ed90bec.css",
  "dist/chunk-2725AZ7S.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3GL5JILG.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3V2HQBEK.js",
  "dist/chunk-4LU54RQM.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5Q2PWR3J.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6BTD54J6.js",
  "dist/chunk-6QXWXPQR.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7GE6UIED.js",
  "dist/chunk-7XMPFBAG.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AOSPRZZ7.js",
  "dist/chunk-AOSW5JNJ.js",
  "dist/chunk-B743JVEQ.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BJZGJ3G5.js",
  "dist/chunk-BQA2QTLQ.js",
  "dist/chunk-CMPCNXRS.js",
  "dist/chunk-DHGWLRM4.js",
  "dist/chunk-DQIJWVZW.js",
  "dist/chunk-EGWG6NBG.js",
  "dist/chunk-EIM2WTFE.js",
  "dist/chunk-ES2Y5BYH.js",
  "dist/chunk-EXWX4IGM.js",
  "dist/chunk-EZFKOXJ7.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FKURUYBQ.js",
  "dist/chunk-FRDODQSV.js",
  "dist/chunk-GMCK7XX5.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-GPDAOGRO.js",
  "dist/chunk-GQUBTZZ4.js",
  "dist/chunk-HCXJCRN7.js",
  "dist/chunk-I2YOZZHZ.js",
  "dist/chunk-I46TLNMS.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IAQ3X3PO.js",
  "dist/chunk-IAWQINH3.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IUUABEBO.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-KHK4XAZ3.js",
  "dist/chunk-KOYQARVR.js",
  "dist/chunk-KQ6KLXLD.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-L3W6NWFV.js",
  "dist/chunk-L4DVOITF.js",
  "dist/chunk-LJ4FRQ24.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-M4723ONG.js",
  "dist/chunk-MFPMTXWT.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NCVHV427.js",
  "dist/chunk-NLOC5MCZ.js",
  "dist/chunk-O3OVWOQX.js",
  "dist/chunk-O4IP6Y66.js",
  "dist/chunk-O55ZAEVA.js",
  "dist/chunk-OTSHCH2R.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PF3MJHOO.js",
  "dist/chunk-PFQMMNOJ.js",
  "dist/chunk-PIVZ6TS3.js",
  "dist/chunk-PYVMIEOZ.js",
  "dist/chunk-QE7RZUA6.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S5VRZIQT.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TG3GJYSX.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TWMAXJJO.js",
  "dist/chunk-UA6GV3JP.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UHOWBIWE.js",
  "dist/chunk-UQUGYBRS.js",
  "dist/chunk-UUTTZYR5.js",
  "dist/chunk-VLRC4UPV.js",
  "dist/chunk-VWVTTKWG.js",
  "dist/chunk-WHDG46Z2.js",
  "dist/chunk-WHXQTDEI.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WTPUTYF5.js",
  "dist/chunk-WUZL37CK.js",
  "dist/chunk-WXR2HW4C.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XCEBN2PS.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XKHJNMXO.js",
  "dist/chunk-XRMYMGXH.js",
  "dist/chunk-XVTPBRTS.js",
  "dist/chunk-Y2DAN3JV.js",
  "dist/chunk-Y6VYMNJ2.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-YUDKDEYN.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z3I6F46T.js",
  "dist/chunk-ZEQGSTVX.js",
  "dist/chunk-ZWC6O6XA.js",
  "dist/main-QRH6APGF.js",
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
