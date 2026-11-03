// dist/ (lo que se publica) tiene que estar compilado a partir de las fuentes actuales: si falla, `npm run build`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sourceHash } from '../tools/build-hash.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const manifest = () => JSON.parse(read('dist/build-manifest.json'));

test('dist/ está compilado con las fuentes actuales (si falla: npm run build)', () => {
  assert.ok(existsSync(new URL('../dist/build-manifest.json', import.meta.url)), 'falta dist/: ejecuta npm run build');
  assert.equal(manifest().sourceHash, sourceHash(ROOT), 'dist/ está desactualizado: ejecuta npm run build');
});

test('dist/ solo tiene los archivos de la última compilación', () => {
  const { files } = manifest();
  const onDisk = readdirSync(new URL('../dist/', import.meta.url)).filter(f => f !== 'build-manifest.json').map(f => `dist/${f}`).sort();
  assert.deepEqual(onDisk, files.filter(f => f !== 'dist/build-manifest.json'));
});

test('index.html carga el código y los estilos compilados, con el tema antes de pintar', () => {
  const { entry, css } = manifest();
  const html = read('index.html');
  // async es seguro solo si el script es lo último del <body> (tools/build.mjs)
  assert.match(html, new RegExp(`<script type="module" async src="${entry}"></script>\\s*</body>`));
  assert.match(html, new RegExp(`<link rel="stylesheet" href="${css}">`));
  assert.doesNotMatch(html, /href="css\/|src="js\//, 'index.html no debe cargar fuentes sueltas');
  assert.ok(html.indexOf('violin-facil-v2') < html.indexOf(css), 'el tema se aplica antes de la hoja de estilos');
});

test('sw.js precarga la versión compilada', () => {
  const { version, files } = manifest();
  const sw = read('sw.js');
  assert.ok(sw.includes(`const VERSION = "${version}"`));
  for (const f of [...files.filter(f => !f.endsWith('build-manifest.json')), 'index.html', 'manifest.webmanifest']) assert.ok(sw.includes(`"${f}"`), f);
});

test('el manifiesto separa iconos «any» y «maskable», con accesos directos y capturas que existen', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.ok(m.icons.some(i => i.purpose === 'any') && m.icons.some(i => i.purpose === 'maskable'));
  assert.ok(m.icons.every(i => !/\s/.test(i.purpose)), 'cada icono con un solo propósito');
  assert.deepEqual(m.shortcuts.map(s => s.url), ['./?go=tuner', './?go=metro']);
  for (const src of [...m.icons, ...m.screenshots].map(i => i.src)) assert.ok(existsSync(new URL(`../${src}`, import.meta.url)), src);
});
