// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "33e184f563";
const PRECACHE = [
  "css/base.css",
  "dist/app-ada87fd118.css",
  "dist/chunk-2SZI65WJ.js",
  "dist/chunk-2TQXSRZ3.js",
  "dist/chunk-2VOBY755.js",
  "dist/chunk-2YAZSOWY.js",
  "dist/chunk-364HU25V.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-42YJ7VKG.js",
  "dist/chunk-45QYHIGS.js",
  "dist/chunk-4JFM4AI5.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-57T7Q4ZM.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6AYA5GQA.js",
  "dist/chunk-6BAXY7GE.js",
  "dist/chunk-6CXTNO5N.js",
  "dist/chunk-6JGS2EKW.js",
  "dist/chunk-6LP7QSPB.js",
  "dist/chunk-6TNRSWD5.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7LXUPM7F.js",
  "dist/chunk-7PVDQ23R.js",
  "dist/chunk-7QOS7HEH.js",
  "dist/chunk-ABHGYSWX.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ALBEA3OG.js",
  "dist/chunk-AREV5KPL.js",
  "dist/chunk-BAUFFRKI.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF3FLQPO.js",
  "dist/chunk-BTWW2XUY.js",
  "dist/chunk-BVIWJ23W.js",
  "dist/chunk-CFSRO5OF.js",
  "dist/chunk-CGK6DVYV.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-DZ4MVOEH.js",
  "dist/chunk-EH5KX7BC.js",
  "dist/chunk-EOTB4LOA.js",
  "dist/chunk-EX5TZEAV.js",
  "dist/chunk-EZDNT7SG.js",
  "dist/chunk-F4JFSBFW.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FVSYNV6N.js",
  "dist/chunk-FYOT7Q7N.js",
  "dist/chunk-G2XHFCPN.js",
  "dist/chunk-GANYNTV6.js",
  "dist/chunk-GCBLP7RY.js",
  "dist/chunk-HQJUC37W.js",
  "dist/chunk-HTNKIT34.js",
  "dist/chunk-HWJPKEN2.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JBOPN7WD.js",
  "dist/chunk-JOHKTPEP.js",
  "dist/chunk-K7FDI37F.js",
  "dist/chunk-L46JBJXS.js",
  "dist/chunk-LECXT6P3.js",
  "dist/chunk-LXKA3CXK.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MDMVS7WI.js",
  "dist/chunk-MEJTYDN2.js",
  "dist/chunk-MEX4IL4O.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-P5X5VVIR.js",
  "dist/chunk-PEUQ2WN5.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PWB7PLOU.js",
  "dist/chunk-QSDNUP45.js",
  "dist/chunk-QSVCGYA2.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCMJBO3Y.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RJKZA7F5.js",
  "dist/chunk-RQWTVTH5.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-SCRBBQV6.js",
  "dist/chunk-SIIA2NFD.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-UDB7VLLD.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UOQU7EU6.js",
  "dist/chunk-UPWMLUYS.js",
  "dist/chunk-VHM7BLVV.js",
  "dist/chunk-VMIW3IRM.js",
  "dist/chunk-VU5NKJ3U.js",
  "dist/chunk-VVSV6YTZ.js",
  "dist/chunk-VWYWEWUP.js",
  "dist/chunk-WA37U4NG.js",
  "dist/chunk-WLUIUBAF.js",
  "dist/chunk-WNESK54U.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WTSQOX4I.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJHWFKEK.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XSXD5RHC.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YE2JJLHM.js",
  "dist/chunk-YVSQUNHJ.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZWGBKCGJ.js",
  "dist/main-PP53TTXU.js",
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
