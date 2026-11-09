// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "ce7694fa22";
const PRECACHE = [
  "css/base.css",
  "dist/app-29cd7d46cb.css",
  "dist/chunk-2VM2W5YN.js",
  "dist/chunk-3CKBOTVN.js",
  "dist/chunk-3DUWUKAW.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-3ONXISOZ.js",
  "dist/chunk-3OOORUBL.js",
  "dist/chunk-43Y6R6XD.js",
  "dist/chunk-4BUEFHX6.js",
  "dist/chunk-4DQOZVYS.js",
  "dist/chunk-4JFM4AI5.js",
  "dist/chunk-4WK34R4R.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5FBXVAO2.js",
  "dist/chunk-5Q2C7LES.js",
  "dist/chunk-5X4JXVQM.js",
  "dist/chunk-63NUBG4A.js",
  "dist/chunk-6JGS2EKW.js",
  "dist/chunk-6LP7QSPB.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7DWOZSPA.js",
  "dist/chunk-7JFNKH7F.js",
  "dist/chunk-7QFAR6UI.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-ALBEA3OG.js",
  "dist/chunk-AU4NBUMT.js",
  "dist/chunk-AX5DD5LE.js",
  "dist/chunk-BD7YZ5GV.js",
  "dist/chunk-BE6SAB57.js",
  "dist/chunk-BF3FLQPO.js",
  "dist/chunk-BREQX3NW.js",
  "dist/chunk-BTWW2XUY.js",
  "dist/chunk-BX7GHTBK.js",
  "dist/chunk-CUXTMSVW.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FZPSKNWY.js",
  "dist/chunk-GCSV2YP6.js",
  "dist/chunk-GGBOAXYJ.js",
  "dist/chunk-HAD725OZ.js",
  "dist/chunk-I7NK2KQW.js",
  "dist/chunk-IEQELNYV.js",
  "dist/chunk-IHA6KEXK.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-JF6WOAUL.js",
  "dist/chunk-JPW3LKAU.js",
  "dist/chunk-KR7RRYSN.js",
  "dist/chunk-LGPVCCDS.js",
  "dist/chunk-LXNPRZAB.js",
  "dist/chunk-LYD7ZO2W.js",
  "dist/chunk-MEYUFAZM.js",
  "dist/chunk-MMHXW7ON.js",
  "dist/chunk-MT7PGYU2.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N36D252V.js",
  "dist/chunk-NB7NHQYI.js",
  "dist/chunk-NEAMHZCR.js",
  "dist/chunk-NPFC6L3V.js",
  "dist/chunk-NQPHKOQ2.js",
  "dist/chunk-P7DK3IO3.js",
  "dist/chunk-PAJEBKGQ.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PFATQZQP.js",
  "dist/chunk-PNT3QKIV.js",
  "dist/chunk-POTWGKOP.js",
  "dist/chunk-PYVMIEOZ.js",
  "dist/chunk-QN33PV64.js",
  "dist/chunk-QS2EZ73H.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-RCSGLDYW.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-RMPURYLM.js",
  "dist/chunk-RMY5PYMY.js",
  "dist/chunk-RSNS2JDG.js",
  "dist/chunk-RWTK6SFS.js",
  "dist/chunk-S4QKOYZM.js",
  "dist/chunk-SBZJCL5B.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SSDHSRYS.js",
  "dist/chunk-T3BU4ZY3.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TG3GJYSX.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TSTJKYHZ.js",
  "dist/chunk-TYH7KKQB.js",
  "dist/chunk-UDB7VLLD.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UGBMX3H3.js",
  "dist/chunk-UGUUBS5H.js",
  "dist/chunk-UPI4FPCV.js",
  "dist/chunk-UTU3Q66P.js",
  "dist/chunk-V6SRBY7R.js",
  "dist/chunk-V7R522DR.js",
  "dist/chunk-VFYGIJKO.js",
  "dist/chunk-VRNLCEGO.js",
  "dist/chunk-VWYWEWUP.js",
  "dist/chunk-WICC23QU.js",
  "dist/chunk-WOT6VMZA.js",
  "dist/chunk-WUYLQEDC.js",
  "dist/chunk-X4QVU36R.js",
  "dist/chunk-X5R6I745.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XOBM6GFV.js",
  "dist/chunk-XSMVAUX7.js",
  "dist/chunk-Y2CYEE2G.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YOEF64LV.js",
  "dist/chunk-YZZCHL6T.js",
  "dist/chunk-Z2KQQXJO.js",
  "dist/chunk-Z2VOOI2E.js",
  "dist/chunk-Z3I6F46T.js",
  "dist/chunk-ZDKXJKH4.js",
  "dist/main-RK3GMDLQ.js",
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
