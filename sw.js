// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "1868e991e9";
const PRECACHE = [
  "css/base.css",
  "dist/app-87cd8c262b.css",
  "dist/chunk-2DH2CYI3.js",
  "dist/chunk-2XYIHAL5.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3FGUH3R5.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3N3ILDAE.js",
  "dist/chunk-3PH63I5N.js",
  "dist/chunk-3RFHYDBU.js",
  "dist/chunk-426D447J.js",
  "dist/chunk-4CKHID7X.js",
  "dist/chunk-4KZF3SB5.js",
  "dist/chunk-4UIEHSBO.js",
  "dist/chunk-5GYOS62C.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-62FYSJ4R.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-63Q5HFN6.js",
  "dist/chunk-65IYDJ56.js",
  "dist/chunk-6E7PPBGO.js",
  "dist/chunk-6H4HKNZO.js",
  "dist/chunk-6SROWY3D.js",
  "dist/chunk-743C5YEL.js",
  "dist/chunk-747BV3VI.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7FONEM4H.js",
  "dist/chunk-7MFFE32H.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AQAYUCJR.js",
  "dist/chunk-AZTGEBUZ.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-C4UUBIHS.js",
  "dist/chunk-C5Q6ERD4.js",
  "dist/chunk-CWUEMA5E.js",
  "dist/chunk-CZMKJTWZ.js",
  "dist/chunk-DN4TTOAJ.js",
  "dist/chunk-ENBOCUV2.js",
  "dist/chunk-EZP5ORXA.js",
  "dist/chunk-F2YELJRI.js",
  "dist/chunk-F4VCSVUC.js",
  "dist/chunk-FAWVKTRT.js",
  "dist/chunk-FHV5I3MR.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-GT6XN7R3.js",
  "dist/chunk-HZIIYKU5.js",
  "dist/chunk-I7I3WPCU.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-INMG4DJH.js",
  "dist/chunk-IQDJGPM3.js",
  "dist/chunk-ISRFK27L.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JH5RBTEO.js",
  "dist/chunk-JQCXZHTF.js",
  "dist/chunk-JRYE3A77.js",
  "dist/chunk-KCVF4PSO.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-LHDV6ETW.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LNR7ZMVV.js",
  "dist/chunk-LQMPDKK5.js",
  "dist/chunk-LV5OI3UE.js",
  "dist/chunk-MG3GZ57L.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N37KPLB6.js",
  "dist/chunk-NBVOVDTJ.js",
  "dist/chunk-NDNBPQUO.js",
  "dist/chunk-NPXMDIWQ.js",
  "dist/chunk-NQS6MIWU.js",
  "dist/chunk-OHLUUSBQ.js",
  "dist/chunk-OMVDGC6S.js",
  "dist/chunk-OSIEAK6E.js",
  "dist/chunk-OYX6I7EW.js",
  "dist/chunk-PCR4E7Z5.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PK3GLKBD.js",
  "dist/chunk-PPPWEN4P.js",
  "dist/chunk-PQZYEJP7.js",
  "dist/chunk-PTUDZXEA.js",
  "dist/chunk-PX6YVGM4.js",
  "dist/chunk-Q4OJUZBG.js",
  "dist/chunk-R6ARRQFW.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RDUL2DUG.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RPCDLVZ7.js",
  "dist/chunk-RTPRCYDK.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SL4XAB7C.js",
  "dist/chunk-SVC5ICYA.js",
  "dist/chunk-SVC5XZL3.js",
  "dist/chunk-T2D3AEBZ.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TGCAIS2S.js",
  "dist/chunk-TSGXP44S.js",
  "dist/chunk-TWD52KGV.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-ULS425CJ.js",
  "dist/chunk-UOC4H7WA.js",
  "dist/chunk-UOCLLJSK.js",
  "dist/chunk-VBFGAPFG.js",
  "dist/chunk-VITMRVR4.js",
  "dist/chunk-VQHEG4SQ.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XWVOKRRS.js",
  "dist/chunk-Y3L3R3XN.js",
  "dist/chunk-YN4L4JON.js",
  "dist/chunk-YP3NUR23.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/main-XKSKD3N7.js",
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
