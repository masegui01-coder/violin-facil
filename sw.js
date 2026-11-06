// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "1d671d1404";
const PRECACHE = [
  "css/base.css",
  "dist/app-d668b5f289.css",
  "dist/chunk-2CCEIPV7.js",
  "dist/chunk-2S2SXOC6.js",
  "dist/chunk-34YUIJA3.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3IVGS22E.js",
  "dist/chunk-3LV6IZUO.js",
  "dist/chunk-4A3ZVIP2.js",
  "dist/chunk-4JFM4AI5.js",
  "dist/chunk-4YWINVTS.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-55GIQKMK.js",
  "dist/chunk-5JH7O4G4.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5R4LZKAD.js",
  "dist/chunk-5Z6AFZHO.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6JGS2EKW.js",
  "dist/chunk-6LP7QSPB.js",
  "dist/chunk-6TGGYHZT.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7HQZC57G.js",
  "dist/chunk-7IRBDG7B.js",
  "dist/chunk-7UT6EEVU.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ALBEA3OG.js",
  "dist/chunk-AW35QKOE.js",
  "dist/chunk-BC4XZKJF.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF3FLQPO.js",
  "dist/chunk-BIOQXHHG.js",
  "dist/chunk-BT3JATJS.js",
  "dist/chunk-BTWW2XUY.js",
  "dist/chunk-CHIQI2DR.js",
  "dist/chunk-CN7GZ6AI.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-DN4FWRMN.js",
  "dist/chunk-EQTQYTFY.js",
  "dist/chunk-F5M5AFLR.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-G7CLR66K.js",
  "dist/chunk-GLVCLLAJ.js",
  "dist/chunk-H6BJV5KE.js",
  "dist/chunk-H74DLSDR.js",
  "dist/chunk-I2QJOJVZ.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IKRHXCN7.js",
  "dist/chunk-IL4GNKV3.js",
  "dist/chunk-IQCBKTTL.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JDVETCO7.js",
  "dist/chunk-JZSJWDZS.js",
  "dist/chunk-K62I5GEL.js",
  "dist/chunk-KAH3RM24.js",
  "dist/chunk-L4AJNRIM.js",
  "dist/chunk-LXAW6KRT.js",
  "dist/chunk-MIJWZ7E3.js",
  "dist/chunk-MOQ625EU.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NAZ3IDPU.js",
  "dist/chunk-NEZDJHVX.js",
  "dist/chunk-NI3A4OQM.js",
  "dist/chunk-OKKH6KOX.js",
  "dist/chunk-OLZILARS.js",
  "dist/chunk-PAKMWN5E.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PKULFAFQ.js",
  "dist/chunk-PT2XWF2X.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QYXZNEEF.js",
  "dist/chunk-R3IYQRGU.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RIMPZVTF.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-RXKFFWWD.js",
  "dist/chunk-RXQF5CN6.js",
  "dist/chunk-SH43CVNY.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SMQSWLS6.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TB3PWTYM.js",
  "dist/chunk-TDYVHAO2.js",
  "dist/chunk-TI3WWGOF.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TM2HD5Q7.js",
  "dist/chunk-U77FIGGC.js",
  "dist/chunk-UA6ZSMBO.js",
  "dist/chunk-UDB7VLLD.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UGLLAAQX.js",
  "dist/chunk-VATGT3F5.js",
  "dist/chunk-VPAEHSWA.js",
  "dist/chunk-VPZV4EES.js",
  "dist/chunk-VT6D3BZ6.js",
  "dist/chunk-VWYWEWUP.js",
  "dist/chunk-WCQCKAWQ.js",
  "dist/chunk-WK27VWBU.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XLDHOGQM.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YYYNKPDQ.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZU57GK7W.js",
  "dist/main-UEOTANBZ.js",
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
