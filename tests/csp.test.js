// Política de seguridad (CSP) en la página: orígenes justos y el único script en línea autorizado por su hash.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function csp(html) {
  const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
  assert.ok(m, 'falta la meta Content-Security-Policy');
  assert.ok(html.indexOf(m[0]) < html.search(/<script|<link rel="(stylesheet|preload)"/), 'la CSP va antes de cualquier recurso');
  return Object.fromEntries(m[1].split(';').map(d => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
}
const inlineScripts = html => [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const hostOf = url => new URL(url).origin;

test('index.src.html: CSP sin scripts en línea, con los orígenes que usa la app', () => {
  const p = csp(read('index.src.html'));
  for (const d of ['default-src', 'object-src', 'base-uri']) assert.ok(p[d], d);
  assert.deepEqual(p['default-src'], ["'self'"]);
  assert.deepEqual(p['object-src'], ["'none'"]);
  assert.deepEqual(p['base-uri'], ["'none'"]);
  assert.ok(!p['script-src'].includes("'unsafe-inline'") && !p['script-src'].includes("'unsafe-eval'"));
  assert.ok(!('frame-ancestors' in p), 'frame-ancestors no funciona en una meta');
  // Firebase desde gstatic y la ventana de Google; el QR va copiado en el sitio (nada de CDN de terceros)
  const cloud = read('js/cloud.js');
  assert.ok(p['script-src'].includes(hostOf(cloud.match(/SDK = '([^']+)'/)[1])));
  assert.ok(p['script-src'].includes('https://apis.google.com'));
  assert.deepEqual(p['script-src'].filter(s => s.startsWith('https:')).sort(), ['https://apis.google.com', 'https://www.gstatic.com']);
  // El aviso gen_204 de la ventana de Google se manda con fetch(): connect-src
  assert.ok(p['connect-src'].includes('https://apis.google.com'), 'gen_204 de apis.google.com');
  const authDomain = read('js/firebase-config.js').match(/authDomain: "([^"]+)"/)[1];
  assert.ok(p['frame-src'].includes(`https://${authDomain}`), 'ventana de Google (iframe de Firebase Auth)');
  for (const host of ['https://firestore.googleapis.com', 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com']) assert.ok(p['connect-src'].includes(host), host);
  assert.ok(p['style-src'].includes('https://fonts.googleapis.com') && p['font-src'].includes('https://fonts.gstatic.com'));
  assert.ok(p['media-src'].includes('blob:') && p['img-src'].includes('blob:'));
  // Firestore (WebChannel) comprueba la conexión cargando www.google.com/images/cleardot.gif con new Image(): img-src.
  // Además, en Chrome se ha visto la misma prueba bloqueada por connect-src, así que el origen va en las dos directivas
  const firestore = read('js/cloud.js').match(/SDK = '([^']+)'/)[1];
  assert.match(firestore, /firebasejs\/10\.12\.2\//, 'si cambia la versión del SDK, revisar qué directiva usa la prueba de conexión');
  assert.ok(p['img-src'].includes('https://www.google.com'), 'cleardot.gif de la prueba de conexión de Firestore');
  assert.ok(p['connect-src'].includes('https://www.google.com'), 'cleardot.gif también por connect-src');
});

test('index.html (compilado): conserva la CSP y el hash coincide con el theme-boot en línea', () => {
  const html = read('index.html');
  const p = csp(html);
  const scripts = inlineScripts(html);
  assert.ok(scripts.length >= 1, 'theme-boot va en línea');
  const hashes = p['script-src'].filter(s => s.startsWith("'sha256-"));
  for (const code of scripts) {
    const h = `'sha256-${createHash('sha256').update(code).digest('base64')}'`;
    assert.ok(hashes.includes(h), `falta el hash del script en línea ${h}`);
  }
  assert.equal(hashes.length, scripts.length, 'ni hashes de más ni scripts sin autorizar');
  assert.doesNotMatch(html, /\son[a-z]+="/, 'sin manejadores de eventos en línea (la CSP los bloquea)');
});

test('el código de la app no pone manejadores en línea (onclick=…) en el HTML que genera', () => {
  const files = ['js/screens/director-more.js', 'js/screens/account-panel.js', 'js/screens/band.js', 'js/screens/school.js', 'js/screens/groups.js'];
  for (const f of files) assert.doesNotMatch(read(f), /<[a-z]+[^>]*\son(click|load|error|change|submit)="/, f);
});

test('privacy.html: CSP sencilla sin scripts en línea', () => {
  const html = read('privacy.html');
  const p = csp(html);
  assert.deepEqual(p['script-src'], ["'self'"]);
  assert.deepEqual(p['object-src'], ["'none'"]);
  assert.equal(inlineScripts(html).length, 0);
});

test('el QR del director se carga del propio sitio, sin CDN externo', () => {
  const dir = read('js/screens/band-director.js');
  assert.match(dir, /import\('\.\.\/vendor\/qrcode\.js'\)/);
  assert.doesNotMatch(dir, /https?:\/\//);
  const lib = read('js/vendor/qrcode.js');
  assert.match(lib, /Licensed under the MIT license/, 'conserva la licencia');
  assert.match(lib, /export default qrcode;\s*$/);
  for (const f of ['index.src.html', 'index.html', 'js/screens/band-director.js']) assert.doesNotMatch(read(f), /jsdelivr/, f);
});
