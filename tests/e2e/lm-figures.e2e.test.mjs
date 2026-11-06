// Ilustraciones de la teoría del curso de Lenguaje Musical en la app compilada: se abre la teoría de las 8 unidades
// a 375 px, en modo oscuro y con «reducir movimiento», en español y en inglés. Cada tarjeta lleva su dibujo con texto
// alternativo, sin animaciones, y ningún rótulo pisa otro rótulo ni un trazo ni se sale del lienzo (el mismo detector
// de solapes con el que se diseñaron). Tocar una zona del dibujo suena sin errores.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openApp } from './helpers.mjs';
import { lmExercise } from '../../js/lm/catalog.js';
import { scoreTokens } from '../../js/lm/notes.js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
// axe en la tarjeta: fallos graves (también el nombre accesible de las zonas que no coincide con su texto visible)
async function axeCard(page) {
  if (!(await page.evaluate(() => !!window.axe))) await page.evaluate(AXE);
  const r = await page.evaluate(() => window.axe.run(document.querySelector('#lmBody'), { resultTypes: ['violations'] }));
  return r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id);
}

const PHONE_375 = { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const STEP_TIMEOUT = 8000;
const MIN_ALT = 20;

let env;
before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

// Detector de solapes (en la página): texto↔texto, texto↔trazo (contorno muestreado con su grosor) y fuera del lienzo
function overlapsIn(svg) {
  const out = [];
  const [, , W, H] = svg.getAttribute('viewBox').split(' ').map(Number);
  const inv = svg.getCTM().inverse();
  const toUser = (el, p) => p.matrixTransform(inv.multiply(el.getCTM()));
  const boxes = [...svg.querySelectorAll('text')]
    .filter(t => !t.classList.contains('lmf-clef') && t.textContent.trim() && t.textContent.trim() !== '·')
    .map(t => {
      const b = t.getBBox();
      return { time: t.classList.contains('lmf-time'), label: t.textContent.trim().slice(0, 30), x0: b.x - 1, x1: b.x + b.width + 1, y0: b.y + b.height * 0.14, y1: b.y + b.height * 0.9 };
    });
  const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  boxes.forEach((a, i) => {
    if (a.x0 < -2 || a.x1 > W + 2 || a.y0 < -2 || a.y1 > H + 2) out.push(`«${a.label}» se sale del lienzo`);
    boxes.slice(i + 1).forEach(b => { if (!(a.time && b.time) && hit(a, b)) out.push(`«${a.label}» ↔ «${b.label}»`); });
  });
  const shapes = [...svg.querySelectorAll('path, line, rect, circle, ellipse, polyline')]
    .filter(s => !s.classList.contains('lmf-tap') && !s.classList.contains('lmf-zone') && !s.closest('defs'));
  shapes.forEach(s => {
    const len = s.getTotalLength?.() || 0;
    const style = getComputedStyle(s);
    const pad = style.stroke !== 'none' ? (parseFloat(style.strokeWidth) || 0) / 2 + 0.5 : 0;
    const pts = [];
    for (let d = 0; d <= len; d += 1) pts.push(toUser(s, s.getPointAtLength(d)));
    if (pts.some(p => p.x < -3 || p.x > W + 3 || p.y < -3 || p.y > H + 3)) out.push(`trazo ${s.getAttribute('class') || s.tagName} se sale del lienzo`);
    boxes.forEach(a => {
      if (a.time && s.classList.contains('lmf-line')) return;
      if (pts.some(p => p.x > a.x0 - pad && p.x < a.x1 + pad && p.y > a.y0 - pad && p.y < a.y1 + pad)) out.push(`«${a.label}» ↔ trazo ${s.getAttribute('class') || s.tagName}`);
    });
  });
  return [...new Set(out)];
}

// Lo que se mide de cada tarjeta en la página: zonas táctiles, ejemplo con compás y barras, nada más ancho que ella
function cardLayout(c) {
  const box = c.getBoundingClientRect();
  const small = [...c.querySelectorAll('.lmf [role="button"], .lmf-chip')].map(el => el.getBoundingClientRect())
    .filter(r => r.width < 47.5 || r.height < 47.5).map(r => `${Math.round(r.width)}×${Math.round(r.height)}`);
  const wide = [...c.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > box.right + 1).map(el => el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || ''));
  const ex = c.querySelector('.lm-card-ex .lm-staff');
  const art = c.querySelector('.lm-card-art');
  const text = c.querySelector('.lm-card-text');
  return {
    small, wide: [...new Set(wide)].slice(0, 3),
    example: ex ? { time: ex.querySelectorAll('.lm-clefcell .lm-time').length, bars: ex.querySelectorAll('.lm-gapcell .lm-bar').length, clefs: ex.querySelectorAll('.lm-clefcell').length,
      lines: new Set([...ex.querySelectorAll(':scope > .lm-bargroup')].map(g => g.offsetTop)).size } : null,
    side: art && text ? art.getBoundingClientRect().right <= text.getBoundingClientRect().left + 1 : false,
    words: getComputedStyle(c.querySelector('.lmf-words')).display !== 'none',
  };
}

async function checkAllUnits(lang, { dark = true, big = false, viewport = PHONE_375 } = {}) {
  const { page, errors, close } = await openApp(env, { viewport, seed: { lang } });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
  if (big) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.$eval('[data-libro="lm"]', b => b.click());
  await page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: STEP_TIMEOUT });
  const problems = [];
  let cards = 0;
  for (let u = 1; u <= 8; u++) {
    const id = `lm1-u${u}-teoria-a-facil`;
    const ficha = lmExercise(id).params.ficha;
    await page.$eval(`.lm-unit-card[data-unit="${u}"]`, b => b.click());
    await page.waitForSelector(`[data-ex="${id}"]`, { timeout: STEP_TIMEOUT });
    await page.$eval(`[data-ex="${id}"]`, b => b.click());
    for (let k = 0; k < ficha.length; k++) {
      await page.waitForSelector('#lmBody .lm-card figure.lmf svg', { timeout: STEP_TIMEOUT });
      await page.evaluate(() => document.fonts.ready);
      const card = await page.$eval('#lmBody .lm-card', (c, src) => {
        const svg = c.querySelector('figure.lmf svg');
        const ink = getComputedStyle(svg.querySelector('text:not(.lmf-keyname)') || svg).fill;
        return {
          fig: c.querySelector('figure.lmf').dataset.fig,
          role: svg.getAttribute('role'),
          alt: svg.getAttribute('aria-label') || '',
          title: (svg.querySelector('title') || {}).textContent || '',
          animated: !!svg.querySelector('animateMotion') || c.querySelector('figure.lmf').classList.contains('still') === false,
          bg: getComputedStyle(c).backgroundColor,
          ink,
          overlaps: new Function(`return (${src})`)()(svg),
        };
      }, overlapsIn.toString());
      cards++;
      const where = `U${u} ficha ${k + 1} (${card.fig}, ${lang})`;
      if (card.fig !== ficha[k].dibujo) problems.push(`${where}: dibujo ${card.fig} en vez de ${ficha[k].dibujo}`);
      if (!/^(img|group)$/.test(card.role) || card.alt.length < MIN_ALT || card.title !== card.alt) problems.push(`${where}: texto alternativo`);
      if (card.animated) problems.push(`${where}: se mueve con «reducir movimiento»`);
      if (dark && card.ink === 'rgb(20, 27, 38)') problems.push(`${where}: rótulos con la tinta del tema claro en oscuro`);
      card.overlaps.forEach(o => problems.push(`${where}: ${o}`));
      const lay = await page.$eval('#lmBody .lm-card', cardLayout);
      if (lay.small.length) problems.push(`${where}: zonas táctiles de menos de 48 px: ${lay.small.join(', ')}`);
      if (lay.wide.length) problems.push(`${where}: más ancho que la tarjeta: ${lay.wide.join(', ')}`);
      if (ficha[k].ejemplo) {
        const bars = new Set(scoreTokens(ficha[k].ejemplo).map(t => t.bar)).size;
        const e = lay.example;
        if (!e || e.time !== 2 || e.bars < bars - 1 || e.clefs < e.lines) problems.push(`${where}: ejemplo sin compás, barras o clave en cada renglón ${JSON.stringify(e)}`);
      }
      if (viewport.width >= 600 && !lay.side) problems.push(`${where}: en tableta, dibujo y texto no van en dos columnas`);
      (await axeCard(page)).forEach(v => problems.push(`${where}: axe ${v}`));
      if (big && !lay.words) problems.push(`${where}: con la letra grande falta la explicación escrita del dibujo`);
      if (k === 0) {
        const zone = await page.$('#lmBody .lmf [data-play]');
        if (zone) await zone.evaluate(z => z.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
      }
      await page.waitForSelector('[data-lm-next]', { timeout: STEP_TIMEOUT });
      await page.$eval('[data-lm-next]', b => b.click());
    }
    await page.$eval('#lm [data-back]', b => b.click());
    await page.waitForSelector('#learn #lmUnitTitle', { timeout: STEP_TIMEOUT });
    await page.$eval('[data-lm-back]', b => b.click());
    await page.waitForSelector('.lm-unit-card', { timeout: STEP_TIMEOUT });
  }
  assert.equal(cards, 33);
  assert.deepEqual(problems, []);
  assert.deepEqual(errors, []);
  await close();
}

test('teoría ilustrada: las 33 tarjetas de las 8 unidades con su dibujo accesible y sin solapes (375 px, oscuro)', () => checkAllUnits('es'));
test('teoría ilustrada en inglés: las 33 tarjetas sin solapes (375 px, oscuro)', () => checkAllUnits('en'));
test('teoría ilustrada con la letra al 200 %: nada se corta y el dibujo se explica también por escrito', () => checkAllUnits('es', { dark: false, big: true }));
test('teoría ilustrada en tableta (800 px): tarjeta en dos columnas, dibujo | texto y ejemplo', () => checkAllUnits('en', { dark: false, viewport: { width: 800, height: 1100, deviceScaleFactor: 1, isMobile: true, hasTouch: true } }));

test('la ficha de la unidad en PDF lleva la ilustración de cada tarjeta de teoría', async () => {
  const { page, errors, close } = await openApp(env, { viewport: PHONE_375 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.evaluate(() => {
    navigator.canShare = () => false;
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => { if (blob.type === 'application/pdf') window.__pdf = blob; return create(blob); };
  });
  await page.$eval('[data-libro="lm"]', b => b.click());
  await page.waitForSelector('#lmView:not([hidden]) .lm-unit-card', { timeout: STEP_TIMEOUT });
  await page.$eval('.lm-unit-card[data-unit="1"]', b => b.click());
  await page.waitForSelector('[data-lm-pdf]', { timeout: STEP_TIMEOUT });
  await page.$eval('[data-lm-pdf]', b => b.click());
  await page.waitForFunction(() => !!window.__pdf, { timeout: 30000 });
  const images = await page.evaluate(async () => ((await window.__pdf.text()).match(/\/Subtype\s*\/Image/g) || []).length);
  const cards = lmExercise('lm1-u1-teoria-a-facil').params.ficha.length;
  assert.ok(images >= cards, `${images} imágenes para ${cards} tarjetas`);
  assert.deepEqual(errors, []);
  await close();
});

// «Señalar» como el resto de pentagramas del curso: clave en cada renglón y nada más ancho que la pantalla (375 px y
// letra al 200 %); «completar» con sus huecos en su sitio
for (const big of [false, true]) {
  test(`señalar el compás a 375 px${big ? ' con la letra al 200 %' : ''}: clave en cada renglón y sin cortes`, async () => {
    const { page, errors, close } = await openApp(env, { viewport: PHONE_375 });
    if (big) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.$eval('[data-libro="lm"]', b => b.click());
    await page.waitForSelector('.lm-unit-card', { timeout: STEP_TIMEOUT });
    await page.$eval('.lm-unit-card[data-unit="8"]', b => b.click());
    // la teoría Fácil de U8 empieza, tras sus fichas, por «toca la anacrusa»
    await page.waitForSelector('[data-ex="lm1-u8-teoria-a-facil"]', { timeout: STEP_TIMEOUT });
    await page.$eval('[data-ex="lm1-u8-teoria-a-facil"]', b => b.click());
    const ex = lmExercise('lm1-u8-teoria-a-facil').params;
    assert.equal(ex.items[0].tipo, 'senalar');
    for (let k = 0; k < ex.ficha.length; k++) { await page.waitForSelector('[data-lm-next]', { timeout: STEP_TIMEOUT }); await page.$eval('[data-lm-next]', b => b.click()); }
    await page.waitForSelector('.lm-pick-bars', { timeout: STEP_TIMEOUT });
    await new Promise(r => setTimeout(r, 300));
    const lay = await page.$eval('.lm-pick-bars', s => {
      const groups = [...s.querySelectorAll(':scope > .lm-bargroup')];
      const tops = [...new Set(groups.map(g => g.offsetTop))];
      const firstOfLine = tops.map(t => groups.find(g => g.offsetTop === t));
      return { lines: tops.length, clefs: firstOfLine.every(g => g.querySelector('.lm-clefcell')), wide: s.scrollWidth > s.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1 };
    });
    assert.ok(lay.clefs, `cada renglón con su clave (${lay.lines} renglones)`);
    assert.ok(!lay.wide, 'nada se sale');
    assert.deepEqual(errors, []);
    await close();
  });
}

for (const width of [375, 320]) test(`lectura a dos voces al 200 % a ${width} px: el sistema cabe y la barra fija no tapa la partitura`, async () => {
  const { page, errors, close } = await openApp(env, { viewport: { ...PHONE_375, width } });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.$eval('[data-learn-view="lm"]', b => b.click());
  await page.waitForSelector('.lm-unit-card', { timeout: STEP_TIMEOUT });
  await page.$eval('.lm-unit-card[data-unit="7"]', b => b.click());
  await page.waitForSelector('[data-ex="lm1-u7-ritmo-a-medio"]', { timeout: STEP_TIMEOUT });
  await page.$eval('[data-ex="lm1-u7-ritmo-a-medio"]', b => b.click());
  await page.waitForSelector('#lmBody .lm-system', { timeout: STEP_TIMEOUT });
  await new Promise(r => setTimeout(r, 400));
  const fit = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, view: innerWidth, sys: Math.round(document.querySelector('.lm-system').scrollWidth), box: document.querySelector('.lm-system').clientWidth }));
  assert.ok(fit.page <= fit.view + 1 && fit.sys <= fit.box + 1, JSON.stringify(fit));
  const bar = await page.$eval('.lm-sticky-controls', b => b.getBoundingClientRect().height / innerHeight);
  assert.ok(bar < 0.3, `barra fija: ${Math.round(bar * 100)} % de la pantalla`);
  const box = await page.$eval('#lmDuoPhones', c => { const r = c.getBoundingClientRect(); return [r.width, r.height]; });
  assert.ok(box[0] >= 24 && box[1] >= 24, `casilla ${box}`);
  assert.deepEqual(errors, []);
  await close();
});
