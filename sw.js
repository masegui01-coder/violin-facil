// Service worker mínimo: permite instalar la app y abrirla sin conexión con la última versión vista.
// Primero red (para recibir siempre lo nuevo) y, si no hay conexión, la copia guardada.
// Se revalida cada archivo con el servidor (no-cache): así nunca se mezclan módulos de dos versiones tras publicar.
const CACHE = 'band-flow-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()),
));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const request = e.request.mode === 'navigate' ? e.request : new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    fetch(request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
