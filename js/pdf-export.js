// Exportar partituras a PDF (para imprimir, guardar o enviar por WhatsApp).
// Cada renglón de pentagrama (SVG) se convierte en imagen con sus estilos y las fuentes musicales incrustadas,
// y se coloca en páginas A4 con un escritor de PDF propio (sin librerías externas).
import { createPdf } from './pdf-writer.js';

const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Music&family=Young+Serif&display=swap';
const STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity',
  'font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'display', 'visibility'];
const PX_SCALE = 3; // resolución de las imágenes (nítidas al imprimir)
const JPEG_QUALITY = 0.92;
const PAGE = { w: 210, h: 297, margin: 15 };

let fontCss = null;

// Fuentes musicales como data: para que el clef y las alteraciones salgan en la imagen
async function embeddedFonts() {
  if (fontCss !== null) return fontCss;
  try {
    const css = await (await fetch(FONTS_CSS)).text();
    const blocks = css.match(/@font-face\s*{[^}]*}/g) || [];
    const out = await Promise.all(blocks.map(async block => {
      const url = (block.match(/url\(([^)]+)\)/) || [])[1];
      if (!url) return '';
      const buf = await (await fetch(url.replace(/["']/g, ''))).arrayBuffer();
      let bin = '';
      new Uint8Array(buf).forEach(b => { bin += String.fromCharCode(b); });
      return block.replace(/url\([^)]+\)/, `url(data:font/woff2;base64,${btoa(bin)})`);
    }));
    fontCss = out.join('\n');
  } catch (e) { fontCss = ''; }
  return fontCss;
}

// Colores claros (tema oscuro) pasan a negro: el papel es blanco
function printable(color) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color || '');
  if (!m) return color;
  const [r, g, b] = m.slice(1).map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#111' : color;
}

function inlineStyles(src, dst) {
  if (src.nodeType !== 1) return;
  const cs = getComputedStyle(src);
  dst.setAttribute('style', STYLE_PROPS.map(p => {
    let v = cs.getPropertyValue(p);
    if ((p === 'fill' || p === 'stroke') && v && v !== 'none') v = printable(v);
    return `${p}:${v}`;
  }).join(';'));
  [...src.children].forEach((child, i) => inlineStyles(child, dst.children[i]));
}

export async function svgToPng(svg) {
  const box = svg.viewBox.baseVal;
  const width = box && box.width ? box.width : svg.clientWidth || 600;
  const height = box && box.height ? box.height : svg.clientHeight || 120;
  const clone = svg.cloneNode(true);
  inlineStyles(svg, clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = await embeddedFonts();
  clone.insertBefore(style, clone.firstChild);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  try {
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = width * PX_SCALE;
    canvas.height = height * PX_SCALE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/jpeg', JPEG_QUALITY), ratio: height / width, w: canvas.width, h: canvas.height };
  } finally { URL.revokeObjectURL(url); }
}

// La Helvetica del PDF no tiene ♯ ♭ ♩: se escriben con letras
const pdfText = t => String(t).replace(/♯/g, '#').replace(/♭/g, 'b').replace(/♩/g, 'negra');

// items: [{ title, sub, svgs: [SVGElement] }]. Devuelve un Blob con el PDF
export async function scoresPdf(items, { footer = 'Band Flow' } = {}) {
  const doc = createPdf().page();
  const usable = PAGE.w - PAGE.margin * 2;
  let y = PAGE.margin;
  const newPage = () => { doc.page(); y = PAGE.margin; };
  for (let k = 0; k < items.length; k++) {
    const item = items[k];
    if (k > 0 && y > PAGE.h * 0.6) newPage();
    else if (k > 0) y += 6;
    doc.text(pdfText(item.title), PAGE.margin, y + 5, { size: 15, bold: true });
    doc.text(pdfText(item.sub || ''), PAGE.margin, y + 11, { size: 10, gray: 90 });
    y += 16;
    for (const svg of item.svgs) {
      const img = await svgToPng(svg);
      const h = usable * img.ratio;
      if (y + h > PAGE.h - PAGE.margin) newPage();
      doc.image(img.data, PAGE.margin, y, usable, h, img.w, img.h);
      y += h + 2;
    }
  }
  return doc.footer((n, total) => `${pdfText(footer)} - ${n}/${total}`).blob();
}

// Enviar: en el móvil abre el menú de compartir (WhatsApp, correo…); si no se puede, descarga el PDF
export async function sharePdf(blob, filename, text) {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename, text }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  downloadPdf(blob, filename);
  return 'downloaded';
}

export function downloadPdf(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function openPdf(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
