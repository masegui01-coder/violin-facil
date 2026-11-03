// Servidor estático para las pruebas de extremo a extremo y Lighthouse: sirve la raíz del repositorio como
// GitHub Pages (index.html compilado + dist/), comprimiendo con gzip y con 10 min de caché HTTP.
// Uso suelto: node tests/e2e/server.mjs [puerto]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg']);
const MAX_AGE_S = 600;

// Ruta del archivo dentro del repositorio (nunca fuera de él)
async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\])+/, '');
  let file = join(ROOT, clean);
  if (!file.startsWith(ROOT) || clean.split(sep).includes('node_modules')) return null;
  const info = await stat(file).catch(() => null);
  if (info && info.isDirectory()) file = join(file, 'index.html');
  const ok = await stat(file).then(s => s.isFile(), () => false);
  return ok ? file : null;
}

// Las pruebas pueden simular que se publica otra versión cambiando el final de sw.js
const swPatch = { suffix: '' };

async function handle(req, res) {
  const file = await resolveFile(new URL(req.url, 'http://x').pathname);
  if (!file) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('404'); return; }
  const ext = extname(file);
  let body = await readFile(file);
  if (file === join(ROOT, 'sw.js') && swPatch.suffix) body = Buffer.concat([body, Buffer.from(`\n${swPatch.suffix}\n`)]);
  const headers = { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': `max-age=${MAX_AGE_S}` };
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    body = gzipSync(body);
    headers['content-encoding'] = 'gzip';
    headers.vary = 'Accept-Encoding';
  }
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

export function startServer(port = 0) {
  const server = createServer((req, res) => handle(req, res).catch(() => { res.writeHead(500); res.end(); }));
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => {
    resolve({
      url: `http://localhost:${server.address().port}/`,
      publishNewServiceWorker: tag => { swPatch.suffix = `// ${tag}`; },
      close: () => new Promise(r => { server.closeAllConnections(); server.close(r); }),
    });
  }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { url } = await startServer(Number(process.argv[2]) || 8792);
  console.log(`Sirviendo ${ROOT} en ${url}`);
}
