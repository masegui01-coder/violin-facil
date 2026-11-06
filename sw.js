// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "d9a5679ec5";
const PRECACHE = [
  "css/base.css",
  "dist/app-284b1b5e38.css",
  "dist/chunk-2DLR2XMY.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-43WKPLVE.js",
  "dist/chunk-4JFM4AI5.js",
  "dist/chunk-4RQF5DSH.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5M5JAXQJ.js",
  "dist/chunk-5MUTKMEO.js",
  "dist/chunk-5OQP36CN.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5SUIABO5.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-65LKBXTQ.js",
  "dist/chunk-6C4EBRJQ.js",
  "dist/chunk-6JGS2EKW.js",
  "dist/chunk-6LP7QSPB.js",
  "dist/chunk-6QRHXDC2.js",
  "dist/chunk-7A7GQ2G4.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7DG6J2D4.js",
  "dist/chunk-7TUWOQXP.js",
  "dist/chunk-A44CWS5Q.js",
  "dist/chunk-AC447MG7.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ALBEA3OG.js",
  "dist/chunk-ASIKAP6R.js",
  "dist/chunk-BBHSA5NB.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF3FLQPO.js",
  "dist/chunk-BTWW2XUY.js",
  "dist/chunk-BZ4IV4XQ.js",
  "dist/chunk-CCHVJF7B.js",
  "dist/chunk-CFK3RD76.js",
  "dist/chunk-CRCYENZF.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-D7EY2DTU.js",
  "dist/chunk-DZ6ZWMDH.js",
  "dist/chunk-ECZXO6CI.js",
  "dist/chunk-EDGTGHIG.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-G4A6S62M.js",
  "dist/chunk-GKA3W5AT.js",
  "dist/chunk-GSPUEYRK.js",
  "dist/chunk-HBEIVDMS.js",
  "dist/chunk-HNOUASTJ.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IUCT5YAC.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JESXMDFE.js",
  "dist/chunk-JMSR24I7.js",
  "dist/chunk-KAVDT6SN.js",
  "dist/chunk-LH5XERDT.js",
  "dist/chunk-LH7RRGKA.js",
  "dist/chunk-LLBR3SD5.js",
  "dist/chunk-MA5EY2QU.js",
  "dist/chunk-MDEGPGJL.js",
  "dist/chunk-MG6MO45J.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N2SFK67K.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NGPWJ77G.js",
  "dist/chunk-NKPCZ537.js",
  "dist/chunk-OEZDRSHH.js",
  "dist/chunk-ON4FMOXI.js",
  "dist/chunk-OR6WGGFJ.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PSG3N7YZ.js",
  "dist/chunk-PYQZXNNE.js",
  "dist/chunk-PYVMIEOZ.js",
  "dist/chunk-QPCX7KQN.js",
  "dist/chunk-QQ44WNRR.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-R6VK434S.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-RYI2AZH7.js",
  "dist/chunk-S4MW6BXO.js",
  "dist/chunk-S5ITPQ5D.js",
  "dist/chunk-SHW355UR.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TG3GJYSX.js",
  "dist/chunk-TGZICUS5.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TP5QHLC6.js",
  "dist/chunk-UDB7VLLD.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UXZM7YY4.js",
  "dist/chunk-UZROPP5U.js",
  "dist/chunk-VTWJMGGV.js",
  "dist/chunk-VWYWEWUP.js",
  "dist/chunk-VX3P54QR.js",
  "dist/chunk-WB2J4MTM.js",
  "dist/chunk-WKRTR3YS.js",
  "dist/chunk-WMOEACGX.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-X6XCFYW3.js",
  "dist/chunk-X75WXENZ.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XUDOCWPX.js",
  "dist/chunk-Y5PBEHA7.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z3I6F46T.js",
  "dist/chunk-Z6SXAC3Q.js",
  "dist/main-UO5TJ4LX.js",
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
