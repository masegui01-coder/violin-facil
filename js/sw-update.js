// Service worker: app instalable y sin conexión. Cuando se publica una versión, el nuevo espera
// («waiting») y se avisa con «Hay una versión nueva · Actualizar»; al pulsar, toma el control y se recarga.
import { $ } from './ui.js';

// La plantilla de desarrollo (index.src.html) carga los módulos sueltos: sin service worker para no guardar copias
const isDevPage = () => /index\.src\.html$/.test(location.pathname);

function offerUpdate(worker) {
  const box = $('updateToast');
  if (!box) return;
  box.hidden = false;
  $('updateNow').onclick = () => {
    $('updateNow').disabled = true;
    worker.postMessage({ type: 'SKIP_WAITING' });
  };
}

function watchInstalling(reg) {
  const worker = reg.installing;
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    // Sin controlador es la primera instalación: no hay nada que actualizar
    if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
  });
}

export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || isDevPage()) return;
  let wantsReload = false;
  $('updateNow')?.addEventListener('click', () => { wantsReload = true; });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Relevo directo del service worker antiguo (sin versiones): esta página ya vino de la red, no hay que recargar
    if (!wantsReload) { if ($('updateToast')) $('updateToast').hidden = true; return; }
    wantsReload = false;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').then(reg => {
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => watchInstalling(reg));
  }).catch(() => { /* sin service worker la app funciona igual, solo que no sin conexión */ });
}
