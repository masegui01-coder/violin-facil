// Huella de las fuentes de la app: si cambia algo de js/, css/, la plantilla, el service worker, el manifiesto,
// la privacidad, los iconos o el propio build, la huella cambia. La usan tools/build.mjs (la guarda en
// dist/build-manifest.json) y tests/build.test.js (comprueba que dist/ está al día antes de publicar).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const SOURCE_DIRS = ['js', 'css', 'icons'];
const SOURCE_FILES = ['index.src.html', 'sw.src.js', 'manifest.webmanifest', 'privacy.html', 'tools/build.mjs', 'tools/build-hash.mjs'];
const TEXT = /\.(js|mjs|css|html|json|webmanifest|svg)$/;

function listFiles(root, dir) {
  return readdirSync(join(root, dir), { recursive: true })
    .map(f => join(dir, String(f)))
    .filter(f => statSync(join(root, f)).isFile());
}

export function sourceFiles(root) {
  return [...SOURCE_DIRS.flatMap(d => listFiles(root, d)), ...SOURCE_FILES]
    .map(f => f.split(sep).join('/'))
    .sort();
}

// Git puede cambiar los finales de línea al descargar (CRLF en Windows): se comparan sin ellos
const contentOf = (root, file) => {
  const buf = readFileSync(join(root, file));
  return TEXT.test(file) ? Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n')) : buf;
};

export function sourceHash(root) {
  const h = createHash('sha256');
  for (const f of sourceFiles(root)) h.update(f).update('\0').update(contentOf(root, f)).update('\0');
  return h.digest('hex');
}
