// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "d3f8020e54";
const PRECACHE = [
  "css/base.css",
  "dist/app-75ba6be498.css",
  "dist/chunk-22OVQ2JG.js",
  "dist/chunk-2LBSPCP5.js",
  "dist/chunk-34ZPUVPK.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3QK2FJPY.js",
  "dist/chunk-3XCSQGDR.js",
  "dist/chunk-4R6SFSDY.js",
  "dist/chunk-4UW27GZC.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-55FKGMCU.js",
  "dist/chunk-5BYEZ7FB.js",
  "dist/chunk-5OYN3HP6.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5S2BTK3O.js",
  "dist/chunk-5VAUMJID.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6AMJ4MUR.js",
  "dist/chunk-6MYMLTHP.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7CU2NKVD.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AHCG7NYK.js",
  "dist/chunk-AUJZPSTN.js",
  "dist/chunk-AVJQGMIW.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BIE5UGFU.js",
  "dist/chunk-BVIWJ23W.js",
  "dist/chunk-BX4QNF2J.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-CXMTPG3U.js",
  "dist/chunk-DDIXTPOK.js",
  "dist/chunk-EA7URUDJ.js",
  "dist/chunk-EJAZ2TQJ.js",
  "dist/chunk-ENNO4Q3Y.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FVWX5AAJ.js",
  "dist/chunk-FYM2R5FH.js",
  "dist/chunk-GGB4LMPZ.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-GVKBRGUR.js",
  "dist/chunk-I3RA6QRH.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-I7ONTMIG.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IN54QTQC.js",
  "dist/chunk-IPJ2MTZY.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JG4CT3NA.js",
  "dist/chunk-JJKWNHDK.js",
  "dist/chunk-JJTZTDYV.js",
  "dist/chunk-KOYQARVR.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-KXRFOFML.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LUBNJ7UG.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MHXJKSUX.js",
  "dist/chunk-MKRUUVSN.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N6VELJLF.js",
  "dist/chunk-NCNTENI5.js",
  "dist/chunk-NFFFNYIQ.js",
  "dist/chunk-NHVLNCRM.js",
  "dist/chunk-P3NMDNYX.js",
  "dist/chunk-P7IYOQMS.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PKKBBZDY.js",
  "dist/chunk-POJ4ZB3M.js",
  "dist/chunk-PP2XCZIM.js",
  "dist/chunk-QLGNDSI5.js",
  "dist/chunk-QSSDYEMH.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-REUVGFPA.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-RZ2YUOWF.js",
  "dist/chunk-RZLI5MDX.js",
  "dist/chunk-S3FN6B3X.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-SEJ2HSIG.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-U44FEZWS.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UMQXRLTY.js",
  "dist/chunk-UPWMLUYS.js",
  "dist/chunk-V62XVX4I.js",
  "dist/chunk-VGPPZNUX.js",
  "dist/chunk-VVSV6YTZ.js",
  "dist/chunk-VXWZMTI6.js",
  "dist/chunk-W23B5F6Y.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YE2JJLHM.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZEGPX7CZ.js",
  "dist/chunk-ZKIBAAPS.js",
  "dist/chunk-ZQBWFX27.js",
  "dist/chunk-ZVVZMOXX.js",
  "dist/main-OHUHV6AQ.js",
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
