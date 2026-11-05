// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "8a83838fc6";
const PRECACHE = [
  "css/base.css",
  "dist/app-beeb646784.css",
  "dist/chunk-27EEAKCJ.js",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-2Y4S3TBS.js",
  "dist/chunk-3CJ7OERX.js",
  "dist/chunk-3GS7XKS4.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-455JT7FM.js",
  "dist/chunk-4A3ZVIP2.js",
  "dist/chunk-4HYZPMUJ.js",
  "dist/chunk-4UMEMWRG.js",
  "dist/chunk-4WFMDWPH.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-6C3JWRGD.js",
  "dist/chunk-6CJFJF6W.js",
  "dist/chunk-6E3WUXIK.js",
  "dist/chunk-6R7JJB7P.js",
  "dist/chunk-6TF45SSM.js",
  "dist/chunk-6XXQMRJK.js",
  "dist/chunk-73H5BEKG.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7I5SBQ26.js",
  "dist/chunk-7ZJVGKIY.js",
  "dist/chunk-ADI3CLGQ.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AMK7M6SV.js",
  "dist/chunk-AMMXQHYW.js",
  "dist/chunk-BNUDR2JO.js",
  "dist/chunk-BPSMLTID.js",
  "dist/chunk-C7TO4AZ6.js",
  "dist/chunk-CZJBDNC7.js",
  "dist/chunk-D2XVAPIC.js",
  "dist/chunk-DDHKMSUI.js",
  "dist/chunk-DKFXQ6SW.js",
  "dist/chunk-DKLYR253.js",
  "dist/chunk-DSNWTMYI.js",
  "dist/chunk-DZ7ZEZ4Q.js",
  "dist/chunk-DZBDYR5S.js",
  "dist/chunk-EDHDAXQ7.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FCWIANYZ.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-GCCKWXCR.js",
  "dist/chunk-GHIUPPFE.js",
  "dist/chunk-GXPRUFQU.js",
  "dist/chunk-H7KXFZA2.js",
  "dist/chunk-HH74XPYR.js",
  "dist/chunk-IRZCAIFW.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JMON2GMK.js",
  "dist/chunk-K37ENGQR.js",
  "dist/chunk-KHK5OFSX.js",
  "dist/chunk-KOUIOD2T.js",
  "dist/chunk-KYF6L3UF.js",
  "dist/chunk-KYUYQJOK.js",
  "dist/chunk-LP6JCNAE.js",
  "dist/chunk-MUIPMK4Q.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-O7EE2EFX.js",
  "dist/chunk-OHPQP4CV.js",
  "dist/chunk-OUHRGTUX.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PJT2HMNK.js",
  "dist/chunk-Q3LDZF7T.js",
  "dist/chunk-Q752KAZZ.js",
  "dist/chunk-QGBNUANG.js",
  "dist/chunk-QHBJ2HYF.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R577WO27.js",
  "dist/chunk-R652PJBR.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-R6OHHY52.js",
  "dist/chunk-RA4YENHL.js",
  "dist/chunk-RL4F54HZ.js",
  "dist/chunk-RSODB5QY.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SOH6T72G.js",
  "dist/chunk-SXASX3Y2.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TN3JVC3H.js",
  "dist/chunk-TOG2C44X.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-V4BGCMQ4.js",
  "dist/chunk-VCNMPC25.js",
  "dist/chunk-VTTYCTDP.js",
  "dist/chunk-W4P3BR5O.js",
  "dist/chunk-WUUXZF7M.js",
  "dist/chunk-XADYA2KN.js",
  "dist/chunk-XF6HUSVG.js",
  "dist/chunk-XSVGW5HP.js",
  "dist/chunk-XVUI7WVH.js",
  "dist/chunk-YA5MDQO6.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YSK56YMT.js",
  "dist/chunk-YXP7MIVP.js",
  "dist/chunk-Z2S2PWKX.js",
  "dist/chunk-Z7PY2OEN.js",
  "dist/chunk-ZZCIK4O5.js",
  "dist/main-W4UBECCX.js",
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
