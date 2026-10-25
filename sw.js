// Service worker: permite instalar la app y abrirla sin conexión con la última versión vista.
// Primero red (para recibir siempre lo nuevo) y, si no hay conexión, la copia guardada.
// Se revalida cada archivo con el servidor (no-cache): así nunca se mezclan módulos de dos versiones tras publicar.
const CACHE = 'band-flow-v3';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/main.js'];
// Con mala cobertura, la página se abre con la copia en vez de esperar sin fin (solo la página: los módulos
// siguen esperando a la red para no mezclar versiones)
const PAGE_TIMEOUT_MS = 4000;
// Fuentes de Google: no cambian, así que primero la copia; la app se ve igual sin conexión
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()),
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()),
));

// Solo se guardan respuestas buenas (un 404 o un error del servidor no sustituye a la copia buena)
function fromNetwork(request, key, e) {
  return fetch(request).then(res => {
    if (res.ok || res.type === 'opaque') {
      const copy = res.clone();
      e.waitUntil(caches.open(CACHE).then(c => c.put(key, copy)).catch(() => {}));
    }
    return res;
  });
}

// ?banda=CODIGO no cambia la página: se busca sin parámetros
function cached(request) {
  const page = request.mode === 'navigate';
  return caches.match(request, { ignoreSearch: page })
    .then(hit => hit || (page ? caches.match('index.html') : undefined));
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(cached(e.request).then(hit => hit || fromNetwork(e.request, e.request, e)));
    return;
  }
  if (url.origin !== location.origin) return;
  const page = e.request.mode === 'navigate';
  const request = page ? e.request : new Request(e.request, { cache: 'no-cache' });
  const network = fromNetwork(request, e.request, e);
  const offline = network.catch(() => cached(e.request)).then(res => res || Response.error());
  if (!page) { e.respondWith(offline); return; }
  const slow = new Promise(resolve => setTimeout(resolve, PAGE_TIMEOUT_MS)).then(() => cached(e.request)).then(hit => hit || offline);
  e.respondWith(Promise.race([offline, slow]));
});
