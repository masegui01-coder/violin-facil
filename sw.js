// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "9e379bdd65";
const PRECACHE = [
  "css/base.css",
  "dist/app-ef450ff2b4.css",
  "dist/chunk-2FCJZTPG.js",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-2KNMJP5N.js",
  "dist/chunk-2RTEBQ5O.js",
  "dist/chunk-343ANCZQ.js",
  "dist/chunk-34IAPYYT.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3ICIKFG2.js",
  "dist/chunk-3X6O6SHB.js",
  "dist/chunk-3ZNT5GZW.js",
  "dist/chunk-45AO6BCW.js",
  "dist/chunk-4J5KGZZ6.js",
  "dist/chunk-4VDGICQ5.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5SMJOI6X.js",
  "dist/chunk-6BGYLQYV.js",
  "dist/chunk-6BW6LSCM.js",
  "dist/chunk-6CJFJF6W.js",
  "dist/chunk-6JTNVR2R.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7AXYTXGW.js",
  "dist/chunk-7BBNTA7E.js",
  "dist/chunk-7GBJCAGC.js",
  "dist/chunk-7KPH2SG5.js",
  "dist/chunk-7KUUJXN7.js",
  "dist/chunk-7OWHV3IQ.js",
  "dist/chunk-AEIMH2QI.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AWPC36D4.js",
  "dist/chunk-BPJ24VLP.js",
  "dist/chunk-DKFXQ6SW.js",
  "dist/chunk-EFMXHHKI.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FMBCZI6H.js",
  "dist/chunk-FOY5ZAMD.js",
  "dist/chunk-FPFRGFM7.js",
  "dist/chunk-FQAJN4X2.js",
  "dist/chunk-FT4GGN2F.js",
  "dist/chunk-FW3RKRVB.js",
  "dist/chunk-G44HWJAE.js",
  "dist/chunk-G5TDKQNK.js",
  "dist/chunk-GEQDJYL3.js",
  "dist/chunk-GQBCAMNU.js",
  "dist/chunk-GWCNTTFU.js",
  "dist/chunk-GXCABM3C.js",
  "dist/chunk-HYCTI4NG.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JVV7555D.js",
  "dist/chunk-K7NLH4TF.js",
  "dist/chunk-KTRIP2WN.js",
  "dist/chunk-LNPLWIT6.js",
  "dist/chunk-M55TLMVR.js",
  "dist/chunk-MC7CJ3KN.js",
  "dist/chunk-MO3EA5RM.js",
  "dist/chunk-MUIPMK4Q.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N5YX3K2P.js",
  "dist/chunk-NKIOS3W4.js",
  "dist/chunk-NQPMS6ZY.js",
  "dist/chunk-NYYA5526.js",
  "dist/chunk-OHPQP4CV.js",
  "dist/chunk-OKGJIM2P.js",
  "dist/chunk-OUHRGTUX.js",
  "dist/chunk-OZZE33IV.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PIDLVLQM.js",
  "dist/chunk-PWVUI2UV.js",
  "dist/chunk-PZA6KH6L.js",
  "dist/chunk-QDFWIQOX.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R26MG2KJ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-S7JL77BW.js",
  "dist/chunk-SAUPIOY4.js",
  "dist/chunk-SFF3J2AP.js",
  "dist/chunk-SHCJCITW.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SXASX3Y2.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TCKQSODA.js",
  "dist/chunk-TF7KNWOU.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UHYNNQSK.js",
  "dist/chunk-V4VNASMB.js",
  "dist/chunk-W7ISS2T4.js",
  "dist/chunk-WE3CM7GF.js",
  "dist/chunk-WMG2ME3W.js",
  "dist/chunk-XIRD75TR.js",
  "dist/chunk-Y2KL3ZDC.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YJ53EZAY.js",
  "dist/chunk-YNEVT3D7.js",
  "dist/chunk-Z2KFXQDO.js",
  "dist/chunk-ZB2YULJ5.js",
  "dist/chunk-ZB72WZQ3.js",
  "dist/chunk-ZFBFRMDL.js",
  "dist/main-YMSJRSMW.js",
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
