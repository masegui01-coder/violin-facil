// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "f31a33fe32";
const PRECACHE = [
  "css/base.css",
  "dist/app-f919f3e0e1.css",
  "dist/chunk-2C3UMJM4.js",
  "dist/chunk-36ASZFEN.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3TVIRQIC.js",
  "dist/chunk-3Z3E7BYC.js",
  "dist/chunk-4GVNU25V.js",
  "dist/chunk-4JFM4AI5.js",
  "dist/chunk-53RD57CY.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6JGS2EKW.js",
  "dist/chunk-6LP7QSPB.js",
  "dist/chunk-6WIKIBXO.js",
  "dist/chunk-6XH3LQ6P.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-ADPQDK3V.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ALBEA3OG.js",
  "dist/chunk-AZDKQ5HB.js",
  "dist/chunk-BAUONVDC.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF3FLQPO.js",
  "dist/chunk-BTWW2XUY.js",
  "dist/chunk-BV66WFIY.js",
  "dist/chunk-CTH5N5X3.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-DQOZONV5.js",
  "dist/chunk-DTMYROQX.js",
  "dist/chunk-DU5UC6JB.js",
  "dist/chunk-EEB35UMK.js",
  "dist/chunk-EEDGWG26.js",
  "dist/chunk-EETR7XUW.js",
  "dist/chunk-EGV4FMB7.js",
  "dist/chunk-EQMPNI3Y.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FJYCZYAT.js",
  "dist/chunk-FOKE4MWF.js",
  "dist/chunk-FQMUQR2J.js",
  "dist/chunk-FW64ULE3.js",
  "dist/chunk-GMHEXZHA.js",
  "dist/chunk-GZUCZQKN.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-IPT5K7HV.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JE3JQUPX.js",
  "dist/chunk-JEDKBND4.js",
  "dist/chunk-JT3OH3XW.js",
  "dist/chunk-JXNUIM6I.js",
  "dist/chunk-LHICGSSE.js",
  "dist/chunk-M7NPF62B.js",
  "dist/chunk-MHDKROAC.js",
  "dist/chunk-MN4S6YNW.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NHWEVS6U.js",
  "dist/chunk-OCX4N2VZ.js",
  "dist/chunk-OPO3CDSK.js",
  "dist/chunk-OVGFAUAD.js",
  "dist/chunk-OZIFNW5J.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PF2GLWUU.js",
  "dist/chunk-Q72RYUAO.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-QXHY5WRD.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RAQHU4WW.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RKKC732V.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4JANXCS.js",
  "dist/chunk-S5YTZCOX.js",
  "dist/chunk-SAUHU2NJ.js",
  "dist/chunk-SE53GI7Y.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SMSYG4AQ.js",
  "dist/chunk-SOAKX43Y.js",
  "dist/chunk-T2LUT6XT.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TFSGEQXD.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-U3LQ3NVX.js",
  "dist/chunk-U5IOJ6BI.js",
  "dist/chunk-UDB7VLLD.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UQUUFQHN.js",
  "dist/chunk-VPESS5SS.js",
  "dist/chunk-VVPSBWGM.js",
  "dist/chunk-VWYWEWUP.js",
  "dist/chunk-WDCBHU5V.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XF3SLMFG.js",
  "dist/chunk-XHYYKYQR.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XKBC54HR.js",
  "dist/chunk-XSZIQ3UQ.js",
  "dist/chunk-Y4WR6PEY.js",
  "dist/chunk-YAZLC5R3.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YETATMIQ.js",
  "dist/chunk-YIQXYHKY.js",
  "dist/chunk-YMKDEASX.js",
  "dist/chunk-YRWQBX33.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-ZLRPISHK.js",
  "dist/chunk-ZUDTOB26.js",
  "dist/main-6IMLLEPJ.js",
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
