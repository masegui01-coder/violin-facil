// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "29f8f0fa25";
const PRECACHE = [
  "css/base.css",
  "dist/app-075223ad10.css",
  "dist/chunk-2ABZHPFZ.js",
  "dist/chunk-2B2K553N.js",
  "dist/chunk-2DH2CYI3.js",
  "dist/chunk-2IFNFUVI.js",
  "dist/chunk-2MI43MBN.js",
  "dist/chunk-2VS6SBDJ.js",
  "dist/chunk-3CILGAI3.js",
  "dist/chunk-3FGUH3R5.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3NHLCQVC.js",
  "dist/chunk-4BQ6KBBC.js",
  "dist/chunk-4S5FAQCH.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5SEK62FA.js",
  "dist/chunk-5TZTEBUZ.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6DXX3RDK.js",
  "dist/chunk-6MVEL7LO.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7XKGNQRU.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AO6VQK4X.js",
  "dist/chunk-AWIGTKDV.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-CTDM3R4I.js",
  "dist/chunk-D6D23YQE.js",
  "dist/chunk-DLMNTWXP.js",
  "dist/chunk-DQE6P47Q.js",
  "dist/chunk-DTCOPGNA.js",
  "dist/chunk-DZ5ACOME.js",
  "dist/chunk-F4MRXGSO.js",
  "dist/chunk-FGJKPVGE.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-G5VSXND6.js",
  "dist/chunk-GIUVYWDO.js",
  "dist/chunk-GNV2RIHI.js",
  "dist/chunk-HCFX7EAH.js",
  "dist/chunk-HEWJGXXM.js",
  "dist/chunk-HGR2K3OI.js",
  "dist/chunk-HWL5JSJK.js",
  "dist/chunk-I3X34HNB.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-ICULQHXL.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IF67F4XB.js",
  "dist/chunk-IY3GT3TF.js",
  "dist/chunk-J6G4URGF.js",
  "dist/chunk-JQHVBZDZ.js",
  "dist/chunk-JTKNUAJF.js",
  "dist/chunk-K2HTVX33.js",
  "dist/chunk-KWU7T5BM.js",
  "dist/chunk-LBCKWZQM.js",
  "dist/chunk-LDWOUJSA.js",
  "dist/chunk-LINHNLTS.js",
  "dist/chunk-LJPURKVE.js",
  "dist/chunk-LRTTBWQG.js",
  "dist/chunk-LW43R2IV.js",
  "dist/chunk-MGOJM37A.js",
  "dist/chunk-MGQELM4Z.js",
  "dist/chunk-MKYB6GBY.js",
  "dist/chunk-MZSB6UFV.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-N3FOPRPY.js",
  "dist/chunk-N4ZJQTLH.js",
  "dist/chunk-N7FZU7HQ.js",
  "dist/chunk-NITXBDHD.js",
  "dist/chunk-OGQFXKUC.js",
  "dist/chunk-OIQZ3MVH.js",
  "dist/chunk-OMVDGC6S.js",
  "dist/chunk-PBOZ25W2.js",
  "dist/chunk-PD6KFQSN.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PG5J5U2I.js",
  "dist/chunk-Q4DRF72Y.js",
  "dist/chunk-QVTJJPIN.js",
  "dist/chunk-QXB6PHJC.js",
  "dist/chunk-R4IJEPHN.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RUVMWWQW.js",
  "dist/chunk-RUWY7IIJ.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S3OT7GE4.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SVC5XZL3.js",
  "dist/chunk-TB6PJ24I.js",
  "dist/chunk-TDKRVBFH.js",
  "dist/chunk-TECYNHRO.js",
  "dist/chunk-TILNQIKU.js",
  "dist/chunk-TR6QPM33.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UGDPE7DE.js",
  "dist/chunk-UOJT242R.js",
  "dist/chunk-URFL5LKI.js",
  "dist/chunk-VH7V4ERE.js",
  "dist/chunk-VJ2AONYN.js",
  "dist/chunk-VMRZSQF7.js",
  "dist/chunk-VVTXS72U.js",
  "dist/chunk-WGBRBB3C.js",
  "dist/chunk-WNXOCDA3.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WQ5CJFQT.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X4XBNGMX.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-X6VV72I6.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XRHLQOEH.js",
  "dist/chunk-YU5DTOBP.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z5HGTVWR.js",
  "dist/chunk-ZAK3TQ2K.js",
  "dist/chunk-ZSAU3RE7.js",
  "dist/chunk-ZTOY3U34.js",
  "dist/chunk-ZZUH562R.js",
  "dist/main-TPSHS2G3.js",
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
