// GENERADO por `npm run build` a partir de sw.src.js: no editar a mano
// Service worker (PLANTILLA: sw.js lo genera `npm run build` con la versión y la lista de archivos de esa compilación).
// - Precarga versionada: al instalarse guarda toda la app de esa versión (página, código con hash, estilos, iconos...).
//   La versión nueva espera hasta que la persona pulsa «Actualizar» (mensaje SKIP_WAITING): así nunca se mezclan dos versiones.
// - Código y estilos con hash: primero la copia (no cambian nunca). Página: red con 3 s de margen y, si no, la copia.
// - Imágenes (img/): la copia al momento y se renueva por detrás, con un máximo de archivos. Fuentes de Google: primero la copia.
const VERSION = "176c26e5a0";
const PRECACHE = [
  "css/base.css",
  "dist/app-4667979577.css",
  "dist/chunk-22JO26O3.js",
  "dist/chunk-2FZUQHNV.js",
  "dist/chunk-2OJ6KNUF.js",
  "dist/chunk-2YGUYF2D.js",
  "dist/chunk-3AESRUOT.js",
  "dist/chunk-3DUDYXYH.js",
  "dist/chunk-3GV7AFFR.js",
  "dist/chunk-4A3ZVIP2.js",
  "dist/chunk-4D7UPJO5.js",
  "dist/chunk-5544XBUY.js",
  "dist/chunk-5M36UBZK.js",
  "dist/chunk-5POGKNTF.js",
  "dist/chunk-5QFUNZOF.js",
  "dist/chunk-62IY2OPD.js",
  "dist/chunk-6IKXSXPG.js",
  "dist/chunk-6NUBE7IB.js",
  "dist/chunk-7AWJ7NV3.js",
  "dist/chunk-7KDBMKP2.js",
  "dist/chunk-7Q5BV6VF.js",
  "dist/chunk-7TTSNYBW.js",
  "dist/chunk-7YQXKHEI.js",
  "dist/chunk-AHBEMQWN.js",
  "dist/chunk-AJSGF3YD.js",
  "dist/chunk-AN5LMNVD.js",
  "dist/chunk-AS35QFWJ.js",
  "dist/chunk-C52TIUNS.js",
  "dist/chunk-CHEVNG57.js",
  "dist/chunk-D2XVAPIC.js",
  "dist/chunk-D6MCZVOM.js",
  "dist/chunk-DJIGPM7K.js",
  "dist/chunk-DKFXQ6SW.js",
  "dist/chunk-EFI2IZRY.js",
  "dist/chunk-EGX6CXIZ.js",
  "dist/chunk-EM3XJZID.js",
  "dist/chunk-EMCWXK5R.js",
  "dist/chunk-F5ZXCHQB.js",
  "dist/chunk-F7LHM2F6.js",
  "dist/chunk-FCOXA7WC.js",
  "dist/chunk-FIPRKNBT.js",
  "dist/chunk-FNJIKVSI.js",
  "dist/chunk-FPFVP47B.js",
  "dist/chunk-FQ6KWYMM.js",
  "dist/chunk-FTGATJIR.js",
  "dist/chunk-H6GI75TD.js",
  "dist/chunk-HWTKXGSC.js",
  "dist/chunk-HZT4KCAL.js",
  "dist/chunk-INPYVNA7.js",
  "dist/chunk-IRBXM2HE.js",
  "dist/chunk-J4S33RLA.js",
  "dist/chunk-J7LENFKR.js",
  "dist/chunk-K37ENGQR.js",
  "dist/chunk-KARXGQ5H.js",
  "dist/chunk-LB7LZFFV.js",
  "dist/chunk-LGSAIS3B.js",
  "dist/chunk-LPGM37KY.js",
  "dist/chunk-MBI5R7XT.js",
  "dist/chunk-MGIELFJO.js",
  "dist/chunk-MIES3FR5.js",
  "dist/chunk-MYQZ35SE.js",
  "dist/chunk-N23QXN2C.js",
  "dist/chunk-N4XUBRBG.js",
  "dist/chunk-NJQBXFBA.js",
  "dist/chunk-O7RPNWJL.js",
  "dist/chunk-OHPQP4CV.js",
  "dist/chunk-PEZJUWHS.js",
  "dist/chunk-PKQQT2WO.js",
  "dist/chunk-PL2PL23Y.js",
  "dist/chunk-PZPOIFOU.js",
  "dist/chunk-Q2SLMI3N.js",
  "dist/chunk-Q752KAZZ.js",
  "dist/chunk-QO2H7SPC.js",
  "dist/chunk-QU2K32MQ.js",
  "dist/chunk-R67Z756L.js",
  "dist/chunk-R6OHHY52.js",
  "dist/chunk-RF2HAFXK.js",
  "dist/chunk-ROH5VAXK.js",
  "dist/chunk-SBWVG6IU.js",
  "dist/chunk-SHN5U3O7.js",
  "dist/chunk-SIDZZOXK.js",
  "dist/chunk-SJWVOYGB.js",
  "dist/chunk-SXAK5GUQ.js",
  "dist/chunk-SXASX3Y2.js",
  "dist/chunk-T27KJKEH.js",
  "dist/chunk-TAY6DV2L.js",
  "dist/chunk-TH2UBSYM.js",
  "dist/chunk-TLOWU7CN.js",
  "dist/chunk-TN3JVC3H.js",
  "dist/chunk-TOGMKO3Q.js",
  "dist/chunk-UEVO3H7G.js",
  "dist/chunk-UIOCOUPM.js",
  "dist/chunk-VU3GICAV.js",
  "dist/chunk-WR3H2TPL.js",
  "dist/chunk-WT65PZIS.js",
  "dist/chunk-X5ZLLEVF.js",
  "dist/chunk-XJOHO4SS.js",
  "dist/chunk-XZT2XHOA.js",
  "dist/chunk-YB3FAWWO.js",
  "dist/chunk-YJJVUPXM.js",
  "dist/main-HSQ55DDF.js",
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
