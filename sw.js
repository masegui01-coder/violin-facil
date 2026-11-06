// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "ebdeda9fd2";
const PRECACHE = [
  "css/base.css",
  "dist/app-8af40b6c94.css",
  "dist/chunk-22PMGCPA.js",
  "dist/chunk-2GNS6Y62.js",
  "dist/chunk-2MS4OCL6.js",
  "dist/chunk-2RSG4ICQ.js",
  "dist/chunk-2XAXOZ4T.js",
  "dist/chunk-3BUEMGPZ.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3R4URSR3.js",
  "dist/chunk-4IQIR5JQ.js",
  "dist/chunk-4LPT5S3U.js",
  "dist/chunk-4OL6EDIL.js",
  "dist/chunk-4PNODO4X.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5AJXKXCX.js",
  "dist/chunk-5GRSBVDJ.js",
  "dist/chunk-5KPOSXI4.js",
  "dist/chunk-5PKO7VN7.js",
  "dist/chunk-6IJF7JMW.js",
  "dist/chunk-6ZNPPHCT.js",
  "dist/chunk-6ZVGEAO7.js",
  "dist/chunk-723JPZMU.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7MSAXU5U.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ALJAZUP6.js",
  "dist/chunk-ALOK5NAJ.js",
  "dist/chunk-AQSY5H2B.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BUSIPSBB.js",
  "dist/chunk-BWQWC5VM.js",
  "dist/chunk-CIXF3TTH.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-CX4BEEI7.js",
  "dist/chunk-CYKEINQE.js",
  "dist/chunk-CZARSZMR.js",
  "dist/chunk-EGEOV4BS.js",
  "dist/chunk-EX2PAYEW.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-G7PNKGGX.js",
  "dist/chunk-GNJBMMYJ.js",
  "dist/chunk-GP2RRZE4.js",
  "dist/chunk-GWF4WJLM.js",
  "dist/chunk-I5C3EDBR.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IAWPETFB.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JCPRKKBO.js",
  "dist/chunk-JOO35XPO.js",
  "dist/chunk-JWAZAWMI.js",
  "dist/chunk-K4WTRAXN.js",
  "dist/chunk-KMCV7BC4.js",
  "dist/chunk-KRV6NVDA.js",
  "dist/chunk-LGSAIS3B.js",
  "dist/chunk-M3KDWZA6.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MNS2H7LN.js",
  "dist/chunk-MWHDJ37H.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-NN2K5KVW.js",
  "dist/chunk-O6RANITH.js",
  "dist/chunk-ONY7LELW.js",
  "dist/chunk-OVQW3NEC.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PSXUVPXC.js",
  "dist/chunk-QGRVNBFZ.js",
  "dist/chunk-QO5HFJPL.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QYGA4TPG.js",
  "dist/chunk-R5YJJWKW.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RZKI32FD.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-SASKJL5Y.js",
  "dist/chunk-SBWVG6IU.js",
  "dist/chunk-SFHG64N6.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SZEXADB6.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TMDCTX7N.js",
  "dist/chunk-TNBY7VEV.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UFQHUG6H.js",
  "dist/chunk-UJGKBLQK.js",
  "dist/chunk-URHBIDVB.js",
  "dist/chunk-V4JTFTGL.js",
  "dist/chunk-V7IB7CYC.js",
  "dist/chunk-W2Z6ZBEK.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-XF5NS2VI.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YDRIR6S7.js",
  "dist/chunk-YJMJHN5U.js",
  "dist/chunk-YSULEDHQ.js",
  "dist/main-KMNNVJU5.js",
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
