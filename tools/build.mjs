// Compilación para publicar (npm run build). GitHub Pages sirve el repositorio tal cual, sin CI: lo commiteado es lo publicado.
//
// Esquema:
// - Se edita index.src.html (plantilla con los <link> a css/ y el <script> a js/main.js entre marcadores build:…) y los
//   módulos de js/. index.src.html funciona sin compilar (ábrelo con un servidor local para desarrollar).
// - Este script genera:
//     dist/main-HASH.js y dist/chunk-HASH.js  código empaquetado y minificado; cada import() dinámico es un trozo aparte
//     dist/app-HASH.css                       las 19 hojas de css/ en el orden de cascada de index.src.html, minificadas
//     dist/build-manifest.json                huella de las fuentes (tests/build.test.js falla si dist/ está desactualizado)
//     index.html                              la plantilla con los marcadores sustituidos (theme-boot va en línea)
//     sw.js                                   sw.src.js con la versión (= hash del build) y la lista de precarga
// - En cada compilación se borra dist/ entera, así no quedan archivos de builds anteriores.
//
// Antes de git push: npm run build && npm test (y npm run e2e si se tocó algo de la interfaz), y commitear dist/, index.html y sw.js.
import { build, transform } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceHash } from './build-hash.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = 'dist';
const TARGET = ['chrome100', 'safari15', 'firefox100'];
const HASH_LEN = 10;
// Lo que se precarga además de dist/: la página, el manifiesto, los iconos y lo que usa la política de privacidad
const EXTRA_PRECACHE = ['index.html', 'manifest.webmanifest', 'privacy.html', 'css/base.css', 'js/theme-boot.js'];

const at = p => join(ROOT, p);
const read = p => readFileSync(at(p), 'utf8');
const shortHash = text => createHash('sha256').update(text).digest('hex').slice(0, HASH_LEN);

// Bloque <!-- build:NOMBRE --> … <!-- /build:NOMBRE --> de la plantilla
function block(html, name) {
  const re = new RegExp(`<!-- build:${name} -->([\\s\\S]*?)<!-- /build:${name} -->\\n?`);
  const m = re.exec(html);
  if (!m) throw new Error(`index.src.html: falta el bloque build:${name}`);
  return { re, body: m[1] };
}

async function buildJs() {
  const result = await build({
    absWorkingDir: ROOT,
    entryPoints: ['js/main.js'],
    bundle: true,
    splitting: true,
    format: 'esm',
    minify: true,
    target: TARGET,
    outdir: DIST,
    entryNames: '[name]-[hash]',
    chunkNames: 'chunk-[hash]',
    legalComments: 'none',
    metafile: true,
    logLevel: 'warning',
    // Firebase se importa en tiempo de ejecución desde gstatic (import(SDK + …)): no se empaqueta
    logOverride: { 'duplicate-object-key': 'silent', 'unsupported-dynamic-import': 'silent' },
  });
  // Para estudiar qué ocupa cada trozo: BUILD_META=ruta.json npm run build (y abrirlo en esbuild.github.io/analyze)
  if (process.env.BUILD_META) writeFileSync(process.env.BUILD_META, JSON.stringify(result.metafile));
  const outputs = result.metafile.outputs;
  const entry = Object.keys(outputs).find(f => outputs[f].entryPoint === 'js/main.js');
  // Trozos que main necesita al arrancar: se piden en paralelo con <link rel="modulepreload">
  const initial = outputs[entry].imports.filter(i => i.kind === 'import-statement').map(i => i.path);
  return { entry, initial };
}

async function buildCss(template) {
  const hrefs = [...block(template, 'css').body.matchAll(/href="(css\/[\w-]+\.css)"/g)].map(m => m[1]);
  const joined = hrefs.map(h => `/* ${h} */\n${read(h)}`).join('\n');
  const { code } = await transform(joined, { loader: 'css', minify: true, target: TARGET });
  const file = `${DIST}/app-${shortHash(code)}.css`;
  writeFileSync(at(file), code);
  return { file, count: hrefs.length };
}

async function buildIndex(template, { entry, initial, css }) {
  const boot = (await transform(read('js/theme-boot.js'), { minify: true, target: TARGET })).code.trim();
  const preload = [entry, ...initial].map(f => `<link rel="modulepreload" href="${f}">`).join('\n');
  const html = template
    .replace('<!doctype html>', '<!doctype html>\n<!-- GENERADO por `npm run build` a partir de index.src.html: no editar a mano -->')
    .replace(block(template, 'note').re, '')
    .replace(block(template, 'boot').re, `<script>${boot}</script>\n`)
    .replace(block(template, 'css').re, `<link rel="stylesheet" href="${css}">\n${preload}\n`)
    .replace(block(template, 'js').re, `<script type="module" src="${entry}"></script>\n`);
  writeFileSync(at('index.html'), html);
}

function buildServiceWorker() {
  const dist = readdirSync(at(DIST)).map(f => `${DIST}/${f}`);
  const icons = readdirSync(at('icons')).map(f => `icons/${f}`);
  const precache = [...EXTRA_PRECACHE, ...icons, ...dist].sort();
  const template = read('sw.src.js');
  const version = shortHash(precache.map(f => `${f}\0${readFileSync(at(f)).toString('base64')}`).join('\0') + template);
  const sw = `// GENERADO por \`npm run build\` a partir de sw.src.js: no editar a mano\n${template}`
    .replace("'__BUILD_VERSION__'", JSON.stringify(version))
    .replace('__PRECACHE_LIST__', JSON.stringify(precache, null, 2));
  writeFileSync(at('sw.js'), sw);
  return { version, precache };
}

async function main() {
  rmSync(at(DIST), { recursive: true, force: true });
  mkdirSync(at(DIST));
  const template = read('index.src.html');
  const js = await buildJs();
  const css = await buildCss(template);
  await buildIndex(template, { ...js, css: css.file });
  const { version, precache } = buildServiceWorker();
  const files = readdirSync(at(DIST)).map(f => `${DIST}/${f}`).sort();
  const manifest = { sourceHash: sourceHash(ROOT), version, entry: js.entry, css: css.file, files };
  writeFileSync(at(`${DIST}/build-manifest.json`), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Band Flow ${version}: ${files.length} archivos en dist/ (${css.count} hojas de estilo), ${precache.length} en la precarga del service worker`);
}

main().catch(e => { console.error(e); process.exitCode = 1; });
