// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "c20c5d3239";
const PRECACHE = [
  "css/base.css",
  "dist/app-662ef2ae9f.css",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-2Q4NPW3C.js",
  "dist/chunk-33CEE7GU.js",
  "dist/chunk-3FWPHPPF.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-4A3ZVIP2.js",
  "dist/chunk-4HGLCMUQ.js",
  "dist/chunk-4WPQDXG3.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5XKQKTIJ.js",
  "dist/chunk-65JOEJUT.js",
  "dist/chunk-6QYFUCYJ.js",
  "dist/chunk-6TSYFHAN.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7DP2OJO6.js",
  "dist/chunk-7MMZRE5W.js",
  "dist/chunk-7T5YKUQ4.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-B7537SFR.js",
  "dist/chunk-BBV3WQZ5.js",
  "dist/chunk-BMDP54H6.js",
  "dist/chunk-BTY2CZJY.js",
  "dist/chunk-BWJGILSA.js",
  "dist/chunk-CRJVGCEO.js",
  "dist/chunk-CRK4HYLE.js",
  "dist/chunk-CVQT2NGJ.js",
  "dist/chunk-DCQ6ZIE2.js",
  "dist/chunk-DKFXQ6SW.js",
  "dist/chunk-DN4FWRMN.js",
  "dist/chunk-DZODCGLY.js",
  "dist/chunk-ER6C2ES6.js",
  "dist/chunk-EYMDBDI6.js",
  "dist/chunk-EYYF73CD.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FUHDKZ3R.js",
  "dist/chunk-GVO5EZO3.js",
  "dist/chunk-H4SOHQCU.js",
  "dist/chunk-H52MYAR5.js",
  "dist/chunk-H766UQSJ.js",
  "dist/chunk-HMKEUF2H.js",
  "dist/chunk-HWTKXGSC.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IS5KFXLT.js",
  "dist/chunk-J5KQBM3O.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JAPXFNJE.js",
  "dist/chunk-JSWYCN5D.js",
  "dist/chunk-K4GNCJBS.js",
  "dist/chunk-LGSAIS3B.js",
  "dist/chunk-LJNLOBHO.js",
  "dist/chunk-LNJQTEBV.js",
  "dist/chunk-LQE4WUXB.js",
  "dist/chunk-M3E2ZLF4.js",
  "dist/chunk-M77NRMNW.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-NROTU2WB.js",
  "dist/chunk-OAW6FGPW.js",
  "dist/chunk-OHPQP4CV.js",
  "dist/chunk-OSL2N56O.js",
  "dist/chunk-OYOOFRWZ.js",
  "dist/chunk-PAOD4JH2.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PP3ZV726.js",
  "dist/chunk-PWHD44OP.js",
  "dist/chunk-Q2SLMI3N.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QXPEOE4K.js",
  "dist/chunk-R4AEWWDI.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RFVRQRBH.js",
  "dist/chunk-RQ5JJYFU.js",
  "dist/chunk-S2LNIX34.js",
  "dist/chunk-SBWVG6IU.js",
  "dist/chunk-SD275YUU.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SPR523CB.js",
  "dist/chunk-SXASX3Y2.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TN3JVC3H.js",
  "dist/chunk-TZQ44OXT.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-URJBJRTD.js",
  "dist/chunk-VBBNZRGR.js",
  "dist/chunk-W5N2NPDX.js",
  "dist/chunk-WRN33OI7.js",
  "dist/chunk-WZTHPBZ3.js",
  "dist/chunk-XIW2JVUT.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XZAASXCI.js",
  "dist/chunk-Y5XIQP4K.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YKP4XUPN.js",
  "dist/chunk-YPEJWDQT.js",
  "dist/chunk-YRBN5ZFQ.js",
  "dist/chunk-Z66EVZLF.js",
  "dist/chunk-ZDGCIEDA.js",
  "dist/main-Z3543BEV.js",
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
