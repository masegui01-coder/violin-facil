// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "7f24873757";
const PRECACHE = [
  "css/base.css",
  "dist/app-76194163bc.css",
  "dist/chunk-3GRPYZXC.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3LTGLKCE.js",
  "dist/chunk-3R4URSR3.js",
  "dist/chunk-3TFR5DHR.js",
  "dist/chunk-3VGR3YJX.js",
  "dist/chunk-46Z6IIEJ.js",
  "dist/chunk-4A3ZVIP2.js",
  "dist/chunk-54BSVIAP.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5LAYWHTN.js",
  "dist/chunk-5U36DYEG.js",
  "dist/chunk-5XT77WTD.js",
  "dist/chunk-6AW2ZOPD.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7IRBDG7B.js",
  "dist/chunk-7LPEBUXD.js",
  "dist/chunk-7Z4VHJYB.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-BCBDSSGS.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF62HWB5.js",
  "dist/chunk-BWOS6SBS.js",
  "dist/chunk-CEROQAXV.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-CWWUGTXY.js",
  "dist/chunk-CZBOYKOJ.js",
  "dist/chunk-D7VRABUM.js",
  "dist/chunk-DN4FWRMN.js",
  "dist/chunk-DOXUHV7H.js",
  "dist/chunk-DP4GD6SK.js",
  "dist/chunk-ELHFWRXL.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-G6C2CMNP.js",
  "dist/chunk-G7CLR66K.js",
  "dist/chunk-GBGFTIT5.js",
  "dist/chunk-GV3EQQPD.js",
  "dist/chunk-GZDRXAI4.js",
  "dist/chunk-HN5PNABR.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IKAXEPPX.js",
  "dist/chunk-IVQQWJ5B.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JDVETCO7.js",
  "dist/chunk-JWFVOY3B.js",
  "dist/chunk-JY7PVCBU.js",
  "dist/chunk-KAEJCZM4.js",
  "dist/chunk-KG44VVEC.js",
  "dist/chunk-KNZYHIKD.js",
  "dist/chunk-LGSAIS3B.js",
  "dist/chunk-LLLSOOZS.js",
  "dist/chunk-LLM3RS7D.js",
  "dist/chunk-MNKBIGMY.js",
  "dist/chunk-MPDZLE5D.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-NVEO7BEV.js",
  "dist/chunk-O6TS3H6Z.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-QRL5RW7Q.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QVRKUEMJ.js",
  "dist/chunk-QYXZNEEF.js",
  "dist/chunk-R4EDMT3C.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RVQNRYU3.js",
  "dist/chunk-RXQF5CN6.js",
  "dist/chunk-SBWVG6IU.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SYUK5CLI.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TEFQWTND.js",
  "dist/chunk-TFUHDBAB.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UVFWN437.js",
  "dist/chunk-V6YFD27W.js",
  "dist/chunk-VUYC7OKQ.js",
  "dist/chunk-VVJSAOQP.js",
  "dist/chunk-WB3V7KBZ.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WRMTV5EL.js",
  "dist/chunk-WVQNPWKZ.js",
  "dist/chunk-WYIUBHUV.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-XE75TGR5.js",
  "dist/chunk-XHPIDYFW.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XTY4EWQN.js",
  "dist/chunk-Y4OREQYA.js",
  "dist/chunk-Y6N6OJZL.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YEF7BGXR.js",
  "dist/chunk-ZAGSOCE6.js",
  "dist/chunk-ZC3EU4ZN.js",
  "dist/chunk-ZRGEM4WE.js",
  "dist/chunk-ZYGYGGZW.js",
  "dist/main-OX52QR74.js",
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
