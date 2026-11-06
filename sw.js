// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "4363de537e";
const PRECACHE = [
  "css/base.css",
  "dist/app-f919f3e0e1.css",
  "dist/chunk-2I74WAPA.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3J7YLOOD.js",
  "dist/chunk-3ZBCZIUJ.js",
  "dist/chunk-44MXIJDA.js",
  "dist/chunk-4CXSD2PP.js",
  "dist/chunk-4G73QC4Y.js",
  "dist/chunk-4JFM4AI5.js",
  "dist/chunk-4MRSXUO7.js",
  "dist/chunk-4OEQKA24.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5OOAXEWN.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5SQP3ERL.js",
  "dist/chunk-5XKT2J4C.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-67KRJOJH.js",
  "dist/chunk-6JGS2EKW.js",
  "dist/chunk-6LP7QSPB.js",
  "dist/chunk-6WIKIBXO.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7KVCNWR4.js",
  "dist/chunk-A3OBQSKO.js",
  "dist/chunk-A5HOIKT4.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ALBEA3OG.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF3FLQPO.js",
  "dist/chunk-BLDIKJ3D.js",
  "dist/chunk-BTWW2XUY.js",
  "dist/chunk-CIRWWOWM.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-DIJACVLV.js",
  "dist/chunk-DNOP2Z2C.js",
  "dist/chunk-EA3RVKXN.js",
  "dist/chunk-ENFOU5US.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FSLBSN3K.js",
  "dist/chunk-FYMVLJEC.js",
  "dist/chunk-G3BKRBTR.js",
  "dist/chunk-G4RFV6LL.js",
  "dist/chunk-GPDLCWCT.js",
  "dist/chunk-H2GIKUPR.js",
  "dist/chunk-HJDRXZUO.js",
  "dist/chunk-HVZXV36L.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-J2NV7NOI.js",
  "dist/chunk-J5THKAH4.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-J7STSX4M.js",
  "dist/chunk-JEDKBND4.js",
  "dist/chunk-JILZTP6H.js",
  "dist/chunk-KFS22M3K.js",
  "dist/chunk-KUCEXA7D.js",
  "dist/chunk-LJ5S7FP7.js",
  "dist/chunk-LOR4GIGB.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MN4S6YNW.js",
  "dist/chunk-MWOSIOUX.js",
  "dist/chunk-MXXT6BDR.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N4AAT5CK.js",
  "dist/chunk-N6Q4ZML4.js",
  "dist/chunk-NSBVC447.js",
  "dist/chunk-NXQ4R7OD.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PNT5I5O5.js",
  "dist/chunk-Q2CVGIFX.js",
  "dist/chunk-QGIQH4ME.js",
  "dist/chunk-QNJJFJSC.js",
  "dist/chunk-QR573BRE.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RDQZZ3TW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RKKC732V.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-UDB7VLLD.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UNJ74IGM.js",
  "dist/chunk-UYQAYE2L.js",
  "dist/chunk-V3EMV5JL.js",
  "dist/chunk-V6UGILEZ.js",
  "dist/chunk-VHLG4KLD.js",
  "dist/chunk-VIQ66NPX.js",
  "dist/chunk-VWYWEWUP.js",
  "dist/chunk-W6QIQFGN.js",
  "dist/chunk-WBWLC5Z5.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WV56RUDE.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJ7QS5ZI.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-Y57RDXCB.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YEFIDEFH.js",
  "dist/chunk-YWRKWE2B.js",
  "dist/chunk-Z2J45M77.js",
  "dist/chunk-Z2T2KX5B.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZUDTOB26.js",
  "dist/main-N5N4DYW7.js",
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
