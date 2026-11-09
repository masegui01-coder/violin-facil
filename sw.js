// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "7c8ba3fd73";
const PRECACHE = [
  "css/base.css",
  "dist/app-87cd8c262b.css",
  "dist/chunk-2AH356U4.js",
  "dist/chunk-2DH2CYI3.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3EKQODIC.js",
  "dist/chunk-3FGUH3R5.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3HCZQR6B.js",
  "dist/chunk-3KZPBVXE.js",
  "dist/chunk-3OXEUKDZ.js",
  "dist/chunk-3RFHYDBU.js",
  "dist/chunk-3XWSPOJC.js",
  "dist/chunk-42WLVSO3.js",
  "dist/chunk-4CKHID7X.js",
  "dist/chunk-4KZF3SB5.js",
  "dist/chunk-4P7KYBGK.js",
  "dist/chunk-4SOU7DMJ.js",
  "dist/chunk-4WXSX37J.js",
  "dist/chunk-5A3QYIH3.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6W5LZATB.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-ABUBEXYF.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AHZRA4JH.js",
  "dist/chunk-AKPZZGSW.js",
  "dist/chunk-AM4EJDFT.js",
  "dist/chunk-ASOJEFVE.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BN3B2FHD.js",
  "dist/chunk-BXB2KDLX.js",
  "dist/chunk-C536AUU2.js",
  "dist/chunk-CLIRSWKL.js",
  "dist/chunk-COGA4GQX.js",
  "dist/chunk-COPQVJLH.js",
  "dist/chunk-CU64MOYF.js",
  "dist/chunk-CZMKJTWZ.js",
  "dist/chunk-DN4TTOAJ.js",
  "dist/chunk-EA5KJFMX.js",
  "dist/chunk-F5FBAZNC.js",
  "dist/chunk-FEEOFQB5.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FJFDF4WT.js",
  "dist/chunk-FMIZLHTR.js",
  "dist/chunk-FQTA5ZX4.js",
  "dist/chunk-GGTQ4A7F.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-GP4N3SNW.js",
  "dist/chunk-GZ67BWIK.js",
  "dist/chunk-HTMSH4ZZ.js",
  "dist/chunk-HVYG6IDE.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IIHMQQK3.js",
  "dist/chunk-INMG4DJH.js",
  "dist/chunk-IQDJGPM3.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JQCXZHTF.js",
  "dist/chunk-JRYE3A77.js",
  "dist/chunk-JZ5WJUP5.js",
  "dist/chunk-KJQ77L4G.js",
  "dist/chunk-KUMLSKPX.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LT7GX6ZA.js",
  "dist/chunk-MBY2W2EZ.js",
  "dist/chunk-MH67ZCDY.js",
  "dist/chunk-MJ6KHAYS.js",
  "dist/chunk-MQEC7UPT.js",
  "dist/chunk-MSZM5STR.js",
  "dist/chunk-MV2NTLT2.js",
  "dist/chunk-MZ2IQIQQ.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NUEJPSIO.js",
  "dist/chunk-OMVDGC6S.js",
  "dist/chunk-OOIL5LEX.js",
  "dist/chunk-OSIEAK6E.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PXVHFMB3.js",
  "dist/chunk-PYAIL7L3.js",
  "dist/chunk-QLG3DZOV.js",
  "dist/chunk-R6ARRQFW.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-REHOPJH3.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S5XBNKCZ.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SQYXIYVV.js",
  "dist/chunk-SS5TB2R2.js",
  "dist/chunk-SVC5ICYA.js",
  "dist/chunk-SVC5XZL3.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TJB45HVA.js",
  "dist/chunk-TQQLWI6M.js",
  "dist/chunk-TSGXP44S.js",
  "dist/chunk-TWO64PPC.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UFJ3YY6A.js",
  "dist/chunk-UG7EZPT5.js",
  "dist/chunk-UJDYU3C7.js",
  "dist/chunk-UOC4H7WA.js",
  "dist/chunk-UWKAYJT6.js",
  "dist/chunk-VQEQTMJY.js",
  "dist/chunk-VQHEG4SQ.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2OKGAE5.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z75CAPB5.js",
  "dist/chunk-ZUE2YLTN.js",
  "dist/main-55JZZRZQ.js",
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
