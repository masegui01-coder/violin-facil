// Escritor de PDF mínimo, sin librerías: páginas A4 con texto (Helvetica) e imágenes JPEG.
// Lo justo para imprimir o compartir partituras generadas por la app.
const A4 = { w: 595.28, h: 841.89 }; // puntos
export const MM = 72 / 25.4;

// Texto en Latin-1 (WinAnsi) para que salgan bien las tildes y la ñ
function latin1(text) {
  return String(text).replace(/[^\x20-\x7e\xa0-\xff]/g, '?').replace(/[\\()]/g, m => '\\' + m);
}

function jpegBytes(dataUrl) {
  const bin = atob(dataUrl.split(',')[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Documento: doc.page() abre una página; doc.text(...) y doc.image(...) en milímetros desde arriba a la izquierda
export function createPdf() {
  const pages = [];
  const images = [];
  let current = null;
  let footerFn = null;
  const api = {
    page() { current = { ops: [], images: [] }; pages.push(current); return api; },
    text(str, xMm, yMm, { size = 11, bold = false, gray = 0, align = 'left' } = {}) {
      const s = latin1(str);
      // ancho aproximado de Helvetica (0,5 em por carácter) para centrar
      const width = align === 'center' ? s.length * size * 0.5 : 0;
      const x = xMm * MM - width / 2;
      const y = A4.h - yMm * MM;
      current.ops.push(`BT ${gray / 255} g /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${s}) Tj ET`);
      return api;
    },
    // dataUrl JPEG; ancho y alto en milímetros
    image(dataUrl, xMm, yMm, wMm, hMm, pixelW, pixelH) {
      const name = `Im${images.length + 1}`;
      images.push({ name, bytes: jpegBytes(dataUrl), w: pixelW, h: pixelH });
      current.images.push(name);
      const w = wMm * MM;
      const h = hMm * MM;
      current.ops.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${(xMm * MM).toFixed(2)} ${(A4.h - yMm * MM - h).toFixed(2)} cm /${name} Do Q`);
      return api;
    },
    pageCount: () => pages.length,
    // pie de cada página: fn(número, total) → texto, centrado abajo
    footer(fn) { footerFn = fn; return api; },
    blob() {
      if (footerFn) pages.forEach((pg, i) => { current = pg; api.text(footerFn(i + 1, pages.length), 105, 290, { size: 8, gray: 120, align: 'center' }); });
      const chunks = [];
      const offsets = [];
      let length = 0;
      const push = part => { const bytes = typeof part === 'string' ? latinBytes(part) : part; chunks.push(bytes); length += bytes.length; };
      const latinBytes = s => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff; return b; };
      const obj = (n, body) => { offsets[n] = length; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
      push('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n');
      // 1 catálogo, 2 páginas, 3-4 fuentes, después imágenes, y por cada página: página + contenido
      const imageBase = 5;
      const pageBase = imageBase + images.length;
      const pageIds = pages.map((_, i) => pageBase + i * 2);
      obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
      obj(2, () => push(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`));
      obj(3, () => push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'));
      obj(4, () => push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'));
      images.forEach((img, i) => obj(imageBase + i, () => {
        push(`<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`);
        push(img.bytes);
        push('\nendstream');
      }));
      pages.forEach((pg, i) => {
        const content = pg.ops.join('\n');
        const xobjects = pg.images.map(name => `/${name} ${imageBase + images.findIndex(x => x.name === name)} 0 R`).join(' ');
        obj(pageIds[i], () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Contents ${pageIds[i] + 1} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ${xobjects} >> >> >>`));
        obj(pageIds[i] + 1, () => { const bytes = latinBytes(content); push(`<< /Length ${bytes.length} >>\nstream\n`); push(bytes); push('\nendstream'); });
      });
      const total = pageBase + pages.length * 2;
      const xref = length;
      push(`xref\n0 ${total}\n0000000000 65535 f \n`);
      for (let n = 1; n < total; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
      push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
      return new Blob(chunks, { type: 'application/pdf' });
    },
  };
  return api;
}
