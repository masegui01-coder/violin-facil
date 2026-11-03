// Antes de pintar: aplica el tema elegido en Perfil (claro u oscuro). «Sistema» no pone nada.
// Lo mismo que applyAppearance de js/appearance.js, sin módulos para que se ejecute al momento.
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('violin-facil-v2')) || {};
    if (s.appearance !== 'light' && s.appearance !== 'dark') return;
    document.documentElement.dataset.theme = s.appearance;
    var bar = s.appearance === 'dark' ? '#0F141B' : '#B4461F';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.content = bar; });
  } catch (e) { /* sin almacenamiento: se usa el del sistema */ }
}());
