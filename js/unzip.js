// Lee archivos .mxl (MusicXML comprimido, un ZIP) con la descompresión nativa del navegador.

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_HEADER = 30;
const STORED = 0;
const DEFLATE = 8;

function listEntries(view) {
  let eocd = -1;
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('El archivo .mxl no es un ZIP válido');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (view.getUint32(p, true) !== CENTRAL_SIG) throw new Error('Directorio del ZIP dañado');
    const method = view.getUint16(p + 10, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const offset = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset + p + 46, nameLen));
    entries.push({ name, method, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function readEntry(view, entry) {
  const nameLen = view.getUint16(entry.offset + 26, true);
  const extraLen = view.getUint16(entry.offset + 28, true);
  const start = view.byteOffset + entry.offset + LOCAL_HEADER + nameLen + extraLen;
  const data = new Uint8Array(view.buffer, start, entry.size);
  if (entry.method === STORED) return new TextDecoder().decode(data);
  if (entry.method !== DEFLATE) throw new Error('Compresión del .mxl no soportada');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

// Devuelve el texto del MusicXML principal que hay dentro del .mxl
export async function unzipMusicXml(buffer) {
  const view = new DataView(buffer);
  const entries = listEntries(view);
  const container = entries.find(e => e.name === 'META-INF/container.xml');
  let target = null;
  if (container) {
    const xml = await readEntry(view, container);
    const path = /full-path\s*=\s*"([^"]+)"/.exec(xml);
    target = path ? entries.find(e => e.name === path[1]) : null;
  }
  target = target || entries.find(e => !e.name.startsWith('META-INF/') && /\.(musicxml|xml)$/i.test(e.name));
  if (!target) throw new Error('No encuentro la partitura dentro del .mxl');
  return readEntry(view, target);
}
