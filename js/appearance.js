// Apariencia: claro, oscuro o la del sistema. La CSS usa :root[data-theme] y, sin él, prefers-color-scheme.
// js/theme-boot.js hace lo mismo antes de pintar (sin módulos) para que no parpadee al abrir.
export const APPEARANCES = ['light', 'dark', 'system'];
// Color de la barra del navegador en cada modo (igual que las metas theme-color de index.html)
const BAR_COLOR = { light: '#B4461F', dark: '#0F141B' };

// Valor guardado → atributo data-theme (null = seguir al sistema)
export function themeAttr(appearance) {
  return appearance === 'light' || appearance === 'dark' ? appearance : null;
}

export function applyAppearance(appearance, doc = document) {
  const theme = themeAttr(appearance);
  if (theme) doc.documentElement.dataset.theme = theme;
  else delete doc.documentElement.dataset.theme;
  // Con un modo fijo, las dos metas dicen lo mismo; con «Sistema», cada una el suyo
  doc.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    const own = (m.media || '').includes('dark') ? 'dark' : 'light';
    m.content = BAR_COLOR[theme || own];
  });
}
