// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "11d7343828";
const PRECACHE = [
  "css/base.css",
  "dist/app-1cab13d66f.css",
  "dist/chunk-23467RDC.js",
  "dist/chunk-2ETX44WS.js",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-33CEE7GU.js",
  "dist/chunk-343ANCZQ.js",
  "dist/chunk-37QNG63O.js",
  "dist/chunk-3DHDK6E3.js",
  "dist/chunk-3EQMCA75.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3X6O6SHB.js",
  "dist/chunk-4A3ZVIP2.js",
  "dist/chunk-4EZTFGDB.js",
  "dist/chunk-4FXSBRFW.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5BYTZKE3.js",
  "dist/chunk-5SSICPYS.js",
  "dist/chunk-5ZFMJROQ.js",
  "dist/chunk-6CJFJF6W.js",
  "dist/chunk-6GANVMCA.js",
  "dist/chunk-6J5KIMMD.js",
  "dist/chunk-72DRKT5X.js",
  "dist/chunk-76BE7QCQ.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-DGWACIHR.js",
  "dist/chunk-DKFXQ6SW.js",
  "dist/chunk-DN4FWRMN.js",
  "dist/chunk-DSIJ6BA6.js",
  "dist/chunk-DZODCGLY.js",
  "dist/chunk-EOEQA3XP.js",
  "dist/chunk-EXF4R2XP.js",
  "dist/chunk-F4LQAMD5.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FBTJGSXD.js",
  "dist/chunk-FGIG3IQR.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-G7M67KDJ.js",
  "dist/chunk-GN2XNBPA.js",
  "dist/chunk-GQ7M4VCK.js",
  "dist/chunk-GU24VSIS.js",
  "dist/chunk-HCQBBOQX.js",
  "dist/chunk-HJGIY35Z.js",
  "dist/chunk-HT2TJXYD.js",
  "dist/chunk-I2ZOLWTN.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-INIG3RXZ.js",
  "dist/chunk-IPKMVVXI.js",
  "dist/chunk-IXFXN5LK.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JV4NFKS7.js",
  "dist/chunk-K5BOJX3T.js",
  "dist/chunk-K7AJSCA5.js",
  "dist/chunk-KC5NZPQH.js",
  "dist/chunk-LFO7JT5B.js",
  "dist/chunk-LG2B5JTN.js",
  "dist/chunk-M2KNSPEV.js",
  "dist/chunk-MFAQV7ES.js",
  "dist/chunk-MUIPMK4Q.js",
  "dist/chunk-MVTPIYUI.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-NCWQTGHY.js",
  "dist/chunk-NOWFFDKX.js",
  "dist/chunk-NS2PP34Y.js",
  "dist/chunk-O7XVP7OB.js",
  "dist/chunk-OHPQP4CV.js",
  "dist/chunk-OUHRGTUX.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PY4GPNHL.js",
  "dist/chunk-QNSLESNH.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R3KDFZKK.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RFA3WEXH.js",
  "dist/chunk-SENZX4VI.js",
  "dist/chunk-SFF3J2AP.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SO5RXUPR.js",
  "dist/chunk-SXASX3Y2.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TCD7WP4I.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TN3JVC3H.js",
  "dist/chunk-UACS5LV5.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UQVBRFAJ.js",
  "dist/chunk-USY43VPZ.js",
  "dist/chunk-UV3Y52SA.js",
  "dist/chunk-VHHYG27G.js",
  "dist/chunk-W67DUYW4.js",
  "dist/chunk-WCEHKEFA.js",
  "dist/chunk-XEXMVDG4.js",
  "dist/chunk-XMM2N7MU.js",
  "dist/chunk-XPG6KXFS.js",
  "dist/chunk-XUQDO2I5.js",
  "dist/chunk-XZAASXCI.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-Z5EBRQHG.js",
  "dist/chunk-ZAXNUEZB.js",
  "dist/chunk-ZZOYRNRE.js",
  "dist/main-233RCI3B.js",
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
