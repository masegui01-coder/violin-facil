// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "3dff9ebffa";
const PRECACHE = [
  "css/base.css",
  "dist/app-d0c4b822f0.css",
  "dist/chunk-26USN4QM.js",
  "dist/chunk-3CAHEQPP.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3LKQROWW.js",
  "dist/chunk-43WKPLVE.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5I6NCDLW.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-66ZKQW5U.js",
  "dist/chunk-6J4T6344.js",
  "dist/chunk-6NFF4MWH.js",
  "dist/chunk-6SOJTTR4.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7CPRCPJ3.js",
  "dist/chunk-7L54DIIW.js",
  "dist/chunk-A7XSXBQL.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BWGRZWM7.js",
  "dist/chunk-BWYJEG2H.js",
  "dist/chunk-CAA236S6.js",
  "dist/chunk-CAEPWNWF.js",
  "dist/chunk-CI3ZWEAU.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-DFMQDI5M.js",
  "dist/chunk-E5FQ2MC2.js",
  "dist/chunk-E5IHJAG7.js",
  "dist/chunk-EHHJJIDM.js",
  "dist/chunk-ETYYNTNK.js",
  "dist/chunk-FIDCUFHT.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-GBKGV5AZ.js",
  "dist/chunk-GDZUYLGX.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-GSPUEYRK.js",
  "dist/chunk-HBLUHLSB.js",
  "dist/chunk-HNOUASTJ.js",
  "dist/chunk-HQZ7KR53.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IB27AAH7.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IF3EIU43.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IYU2FTB4.js",
  "dist/chunk-J23PDW7Z.js",
  "dist/chunk-J4R76C46.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JAU6P7YC.js",
  "dist/chunk-K6ZFJCRS.js",
  "dist/chunk-KOYQARVR.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-LGGKT4N7.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LN4UUN4L.js",
  "dist/chunk-LPOUSID5.js",
  "dist/chunk-MFAVUOZP.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NAXBH7ZV.js",
  "dist/chunk-NB666KAH.js",
  "dist/chunk-NWDS5BSH.js",
  "dist/chunk-O4KIRY3Z.js",
  "dist/chunk-P6YLAFSH.js",
  "dist/chunk-P7Y5VNDM.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PRCTZK3W.js",
  "dist/chunk-PYVMIEOZ.js",
  "dist/chunk-QJIV5BPS.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R3Z7XDAR.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RGE6XVHF.js",
  "dist/chunk-RLUYGDWD.js",
  "dist/chunk-RMZCORUV.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SSFBDIEJ.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TG3GJYSX.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TWJ4DUE5.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-ULCD7BHO.js",
  "dist/chunk-UTSONEOK.js",
  "dist/chunk-UVF7JMUP.js",
  "dist/chunk-UXZM7YY4.js",
  "dist/chunk-VI5U7UE4.js",
  "dist/chunk-VSEPHBMT.js",
  "dist/chunk-W4QC2V77.js",
  "dist/chunk-WFCDU6FE.js",
  "dist/chunk-WHZBKW2Q.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XAUJVDC5.js",
  "dist/chunk-XEEENUOK.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YN6N5R7I.js",
  "dist/chunk-YQG26CNK.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z3I6F46T.js",
  "dist/chunk-Z6FLZNPA.js",
  "dist/chunk-ZFSRMMXZ.js",
  "dist/chunk-ZWKZEMAR.js",
  "dist/main-3VDJ75TZ.js",
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
