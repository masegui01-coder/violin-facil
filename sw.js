// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "fc013aa213";
const PRECACHE = [
  "css/base.css",
  "dist/app-ebc95719d1.css",
  "dist/chunk-22O5OBP6.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3NHLCQVC.js",
  "dist/chunk-54WOPMSF.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5NGBGWR2.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5RKS6PB2.js",
  "dist/chunk-5URUNA6P.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6WC6ACHD.js",
  "dist/chunk-77T6SL32.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-AEHTY3AP.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AIVSFNEB.js",
  "dist/chunk-AIZQM53Y.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-CJ3AJFIX.js",
  "dist/chunk-CZPI6B3J.js",
  "dist/chunk-DVGIG4XM.js",
  "dist/chunk-DVNUZ6W7.js",
  "dist/chunk-E5HX3VMZ.js",
  "dist/chunk-EHFM3JWL.js",
  "dist/chunk-EQSWKLJI.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-G4BDHNDR.js",
  "dist/chunk-GDLNS3DI.js",
  "dist/chunk-GKMQK2RZ.js",
  "dist/chunk-GNSIIEDA.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-GNXINXDZ.js",
  "dist/chunk-GS3YZEBG.js",
  "dist/chunk-H5RMD7TM.js",
  "dist/chunk-HQR4Q5NT.js",
  "dist/chunk-I4M3JYAH.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-ILFE4R72.js",
  "dist/chunk-J3TFOOGH.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JATR3SQF.js",
  "dist/chunk-JCNBL36Z.js",
  "dist/chunk-JOIKYN7Y.js",
  "dist/chunk-JPZRWYV7.js",
  "dist/chunk-KOYQARVR.js",
  "dist/chunk-KPVNPSL5.js",
  "dist/chunk-KSWVOXPT.js",
  "dist/chunk-KVYHJK4J.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-L2XFIXH2.js",
  "dist/chunk-LIJLYFUR.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LN67PJDU.js",
  "dist/chunk-LQMEAZWA.js",
  "dist/chunk-MSJKTZFH.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-O6RHH4EE.js",
  "dist/chunk-OA72B42X.js",
  "dist/chunk-OKRRSWUI.js",
  "dist/chunk-OQL2LHBZ.js",
  "dist/chunk-PDMSJ2YY.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PORYQNVN.js",
  "dist/chunk-PRPKKCY2.js",
  "dist/chunk-PYVMIEOZ.js",
  "dist/chunk-Q7OTTF5D.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R4IJEPHN.js",
  "dist/chunk-R4ZSGLFV.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RERJBMYV.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RQZYKVWR.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-SC3FJOGB.js",
  "dist/chunk-SDHXHOPH.js",
  "dist/chunk-SITGBTEY.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SUEPEXRQ.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TG3GJYSX.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-URNNOBQD.js",
  "dist/chunk-VBFM2WBS.js",
  "dist/chunk-W4EE6FSP.js",
  "dist/chunk-WBDPH5VN.js",
  "dist/chunk-WBHUPEZN.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-X6I7T2YA.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XJQDOEQ6.js",
  "dist/chunk-XQ4EMOUK.js",
  "dist/chunk-XUC6W7BD.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YDAQPGNA.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z3I6F46T.js",
  "dist/chunk-ZBFUTOFT.js",
  "dist/chunk-ZFVQBL4S.js",
  "dist/chunk-ZM4Y2HUQ.js",
  "dist/chunk-ZQ53H2OA.js",
  "dist/chunk-ZXSGHEMH.js",
  "dist/main-U4I7ODVU.js",
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
