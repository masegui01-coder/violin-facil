// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "3bb17fc874";
const PRECACHE = [
  "css/base.css",
  "dist/app-283ed90bec.css",
  "dist/chunk-2BNPZIGT.js",
  "dist/chunk-2HYEKRBR.js",
  "dist/chunk-2R3ORXY2.js",
  "dist/chunk-2VCHQKMK.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3H5PLWC3.js",
  "dist/chunk-4HU5HERT.js",
  "dist/chunk-4XUMQOZW.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5EN4H5JL.js",
  "dist/chunk-5P4ZCZ7U.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6ZPIDNBB.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7PET672Q.js",
  "dist/chunk-7PJ5HV7K.js",
  "dist/chunk-7XMPFBAG.js",
  "dist/chunk-A4YDY5WP.js",
  "dist/chunk-A5RXPQTS.js",
  "dist/chunk-AABN2ZYQ.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-BBT4VIEV.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BSF7LAHW.js",
  "dist/chunk-CLBR7DJP.js",
  "dist/chunk-E4B7QTKX.js",
  "dist/chunk-E7L3DQHZ.js",
  "dist/chunk-EFXO3DWN.js",
  "dist/chunk-FAMGSA4P.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-GMLNOGMT.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-H36CJAXL.js",
  "dist/chunk-HEWJXQZD.js",
  "dist/chunk-HLHMGR7T.js",
  "dist/chunk-HPMBXW64.js",
  "dist/chunk-HUKHIIQK.js",
  "dist/chunk-I4MCNDE3.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IDFZPYHY.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IQTCKUME.js",
  "dist/chunk-ITYJ5X4J.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JGKSKSCG.js",
  "dist/chunk-JVYD4G2A.js",
  "dist/chunk-KEMD5BZ4.js",
  "dist/chunk-KONSZN7I.js",
  "dist/chunk-KOYQARVR.js",
  "dist/chunk-KPXRG4AA.js",
  "dist/chunk-KVUOW5O6.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-L3FWVCMK.js",
  "dist/chunk-L3W6NWFV.js",
  "dist/chunk-L4DVOITF.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LYU4PFW2.js",
  "dist/chunk-M4723ONG.js",
  "dist/chunk-MYDNF4Y5.js",
  "dist/chunk-MYEDONCU.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-OTSHCH2R.js",
  "dist/chunk-P75M463R.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PJUI735B.js",
  "dist/chunk-POZFMKQA.js",
  "dist/chunk-PYVMIEOZ.js",
  "dist/chunk-QJUPDOLQ.js",
  "dist/chunk-QLEDYT4O.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QV5S5EXE.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RNGRDI6R.js",
  "dist/chunk-RU2GEPVN.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-SAQTB5T3.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SVHFUQZW.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TG3GJYSX.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UHRE6CFV.js",
  "dist/chunk-V7FBPVAQ.js",
  "dist/chunk-W2YETNTI.js",
  "dist/chunk-WBVQRH4L.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WXO65PBB.js",
  "dist/chunk-WXR2HW4C.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XGGCMWYF.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YDGFZPPW.js",
  "dist/chunk-YPYP2GFL.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z3D4Q3QF.js",
  "dist/chunk-Z3I6F46T.js",
  "dist/chunk-ZAU53LSY.js",
  "dist/chunk-ZMMUYTGA.js",
  "dist/chunk-ZPLGKCCS.js",
  "dist/chunk-ZRXHNX2R.js",
  "dist/chunk-ZXDSMD33.js",
  "dist/main-YGKQEL7R.js",
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
