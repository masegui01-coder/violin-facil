// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "59bb3beab4";
const PRECACHE = [
  "css/base.css",
  "dist/app-e51f6c9447.css",
  "dist/chunk-22ZUPCXN.js",
  "dist/chunk-2DGB63ZR.js",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-2ILBLUEA.js",
  "dist/chunk-325PFP7D.js",
  "dist/chunk-343ANCZQ.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3UEWRSVN.js",
  "dist/chunk-3X6O6SHB.js",
  "dist/chunk-42J3X5JZ.js",
  "dist/chunk-4A3ZVIP2.js",
  "dist/chunk-4XQHFZUE.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-55QLSCEQ.js",
  "dist/chunk-5EVOM3PR.js",
  "dist/chunk-5HS7OXXB.js",
  "dist/chunk-5M3BEFQA.js",
  "dist/chunk-5ZGZZF24.js",
  "dist/chunk-6CJFJF6W.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-BBEURU4K.js",
  "dist/chunk-BRWPCF2T.js",
  "dist/chunk-CYSBYTM5.js",
  "dist/chunk-D2XVAPIC.js",
  "dist/chunk-D5KKLYHV.js",
  "dist/chunk-D6W7RSP7.js",
  "dist/chunk-DKFXQ6SW.js",
  "dist/chunk-DPCKEYTJ.js",
  "dist/chunk-EDOLBATW.js",
  "dist/chunk-ENTY4S5Y.js",
  "dist/chunk-EYLQ6BTN.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-GBIDXHFK.js",
  "dist/chunk-GF7YLQEN.js",
  "dist/chunk-GKPBBHX2.js",
  "dist/chunk-GP6NQSPE.js",
  "dist/chunk-GXPPDK2T.js",
  "dist/chunk-HFWJUVSA.js",
  "dist/chunk-IBU4KVWN.js",
  "dist/chunk-INOZMJNX.js",
  "dist/chunk-IUXYU6QW.js",
  "dist/chunk-IUYAEHZD.js",
  "dist/chunk-IW2WENWX.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JLDN3UGM.js",
  "dist/chunk-JPFUALH4.js",
  "dist/chunk-JY5UKZP2.js",
  "dist/chunk-K37ENGQR.js",
  "dist/chunk-MUIPMK4Q.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N3DX4KXH.js",
  "dist/chunk-NZRY4QH5.js",
  "dist/chunk-OHPQP4CV.js",
  "dist/chunk-OUHRGTUX.js",
  "dist/chunk-OVYEIJYH.js",
  "dist/chunk-PAJXUUGS.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PJ7ZVSUD.js",
  "dist/chunk-PJKZIDTH.js",
  "dist/chunk-Q752KAZZ.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-R6OHHY52.js",
  "dist/chunk-S3OLYZKY.js",
  "dist/chunk-SFF3J2AP.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SMV6A52C.js",
  "dist/chunk-SXASX3Y2.js",
  "dist/chunk-T23TBQKU.js",
  "dist/chunk-T2DGZFQL.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TIWSMSPQ.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TN3JVC3H.js",
  "dist/chunk-TNQVORKK.js",
  "dist/chunk-TREWFGG3.js",
  "dist/chunk-TW4BFXKT.js",
  "dist/chunk-UAOZAPWO.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-ULYKA37W.js",
  "dist/chunk-UUIRZS2F.js",
  "dist/chunk-VDBSJMBG.js",
  "dist/chunk-VLUZCO7C.js",
  "dist/chunk-W6UWW3WW.js",
  "dist/chunk-WQRCSTPI.js",
  "dist/chunk-WUM4ELV6.js",
  "dist/chunk-X36VCAXV.js",
  "dist/chunk-X44LWTQI.js",
  "dist/chunk-X4J3WY3F.js",
  "dist/chunk-XHGFHP32.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YJQHPNRC.js",
  "dist/chunk-YLXRAEIH.js",
  "dist/chunk-ZI2HOF2T.js",
  "dist/chunk-ZICOJNDM.js",
  "dist/chunk-ZYLATAHC.js",
  "dist/main-2EEEVO6H.js",
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
