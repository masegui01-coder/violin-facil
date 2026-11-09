// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "6c21153f93";
const PRECACHE = [
  "css/base.css",
  "dist/app-7b59e64fc8.css",
  "dist/chunk-2BE7MYYM.js",
  "dist/chunk-2J7T56PI.js",
  "dist/chunk-2TEDRQ4M.js",
  "dist/chunk-34VLG5YX.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3VZN5K5U.js",
  "dist/chunk-46RI56EG.js",
  "dist/chunk-4752PPIC.js",
  "dist/chunk-47OKQJLL.js",
  "dist/chunk-4HS6B7YW.js",
  "dist/chunk-4IWRHHGN.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5IA45C6P.js",
  "dist/chunk-5NTDPMWR.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6HJWJ3EC.js",
  "dist/chunk-743V26SM.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-A7QJRATI.js",
  "dist/chunk-AAELLE5O.js",
  "dist/chunk-ABWHOXEV.js",
  "dist/chunk-ACFUSOT5.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BI6X6OIS.js",
  "dist/chunk-BP4YEHSI.js",
  "dist/chunk-C5PGKU36.js",
  "dist/chunk-CE4OXLAQ.js",
  "dist/chunk-CJ3DI7MP.js",
  "dist/chunk-DSC6FQLC.js",
  "dist/chunk-E4U23PAY.js",
  "dist/chunk-EKD55V2Z.js",
  "dist/chunk-F74VTKZP.js",
  "dist/chunk-FHIEQ4ZR.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FWGTRUNR.js",
  "dist/chunk-GGOD74M3.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-I3DMII7U.js",
  "dist/chunk-I4BP4DGJ.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IHEEIFWW.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JQG4PK5I.js",
  "dist/chunk-K3H3PRYC.js",
  "dist/chunk-KOYQARVR.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-LEEYLOSM.js",
  "dist/chunk-LHV7G74W.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-MDVXUXVR.js",
  "dist/chunk-MTJMZMWX.js",
  "dist/chunk-MVE7T66E.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N4JQK7BU.js",
  "dist/chunk-NBKM6RVT.js",
  "dist/chunk-O2X7JXMB.js",
  "dist/chunk-OAGT5EAP.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PHEBREWO.js",
  "dist/chunk-PYVMIEOZ.js",
  "dist/chunk-QQHI6PBK.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RFSTI6OS.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-SAPJNLD2.js",
  "dist/chunk-SBCLXE6W.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SMNQQJBN.js",
  "dist/chunk-SR3OZDL6.js",
  "dist/chunk-SRLE6CGN.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TG3GJYSX.js",
  "dist/chunk-TIL7TATP.js",
  "dist/chunk-TL6CGEUK.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TRE64S44.js",
  "dist/chunk-TZB2FPTV.js",
  "dist/chunk-TZC5EI3N.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-URM2NQJ4.js",
  "dist/chunk-VZS6JSD3.js",
  "dist/chunk-W3PH3CBN.js",
  "dist/chunk-WGI7SVW4.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WPHVVWPO.js",
  "dist/chunk-WUGSP2A5.js",
  "dist/chunk-WYXSNMUE.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XWZHQDED.js",
  "dist/chunk-XZCJL2GE.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YMA2FOIE.js",
  "dist/chunk-YRC3PD2M.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-YYRSAMMS.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z3I6F46T.js",
  "dist/chunk-Z5AVGPKV.js",
  "dist/chunk-ZQ5FDIHE.js",
  "dist/chunk-ZRQQNGQ6.js",
  "dist/main-GH6WKY67.js",
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
