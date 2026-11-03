import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { themeAttr, applyAppearance, APPEARANCES } from '../js/appearance.js';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('claro y oscuro fijan data-theme; «Sistema» o nada lo dejan al sistema', () => {
  assert.deepEqual(APPEARANCES, ['light', 'dark', 'system']);
  assert.equal(themeAttr('light'), 'light');
  assert.equal(themeAttr('dark'), 'dark');
  assert.equal(themeAttr('system'), null);
  assert.equal(themeAttr(undefined), null);
});

test('applyAppearance pone el tema y el color de la barra del navegador', () => {
  const metas = [{ media: '(prefers-color-scheme: light)', content: '' }, { media: '(prefers-color-scheme: dark)', content: '' }];
  const doc = { documentElement: { dataset: {} }, querySelectorAll: () => metas };
  applyAppearance('dark', doc);
  assert.equal(doc.documentElement.dataset.theme, 'dark');
  assert.deepEqual(metas.map(m => m.content), ['#0F141B', '#0F141B']);
  applyAppearance('system', doc);
  assert.equal(doc.documentElement.dataset.theme, undefined);
  assert.deepEqual(metas.map(m => m.content), ['#B4461F', '#0F141B']);
});

test('la plantilla index.src.html enlaza todas las hojas de css/ una vez y cada una tiene menos de 800 líneas', () => {
  const html = read('index.src.html');
  const linked = [...html.matchAll(/<link rel="stylesheet" href="css\/([\w-]+\.css)">/g)].map(m => m[1]);
  const files = readdirSync(new URL('css/', root)).filter(f => f.endsWith('.css'));
  assert.equal(new Set(linked).size, linked.length);
  assert.deepEqual([...linked].sort(), [...files].sort());
  // Al final: los ajustes por formato y de movimiento, y detrás solo los de rendimiento (perf.css)
  assert.equal(['responsive.css', 'motion.css', 'perf.css'].includes(linked.at(-1)), true);
  for (const f of files) assert.ok(read(`css/${f}`).split('\n').length < 800, `${f} supera 800 líneas`);
});

test('el tamaño de letra respeta el del sistema (sin px fijos en html)', () => {
  const base = read('css/base.css');
  assert.doesNotMatch(base, /html\s*\{[^}]*font-size:\s*\d+px/);
});

test('hay política de privacidad enlazada desde la app con contacto', () => {
  const privacy = read('privacy.html');
  assert.match(privacy, /tizaestudiogames\+violin@gmail\.com/);
  assert.match(read('index.html'), /href="privacy\.html"/);
});
