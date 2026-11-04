// Texto grande del sistema (200 %): la barra de pestañas y la cabecera caben en un móvil de 360 × 780
// y cada pestaña se ve, no se solapa con otra y se puede pulsar en su centro. Se ejecuta con `npm run e2e`.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openApp, tap, waitVisible, sleep, TABS } from './helpers.mjs';

const ZOOMS = ['150%', '200%'];
let env;

before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

// Simula el tamaño de letra del sistema: el tamaño raíz (todo el texto de la app va en rem)
const setRootFont = (page, size) => page.evaluate(s => { document.documentElement.style.fontSize = s; }, size);

// Caja de cada pestaña y qué elemento hay en su centro
function tabBoxes(page) {
  return page.$$eval('#tabbar [data-tab]', buttons => buttons.map(b => {
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { tab: b.dataset.tab, left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, hits: !!hit && b.contains(hit) };
  }));
}

for (const zoom of ZOOMS) {
  test(`con la letra al ${zoom} las cinco pestañas caben, no se solapan y se pulsan en su centro`, async () => {
    const { page, errors, close } = await openApp(env);
    await setRootFont(page, zoom);
    await sleep(300);
    const { innerWidth, innerHeight } = await page.evaluate(() => ({ innerWidth, innerHeight }));
    const boxes = await tabBoxes(page);
    assert.deepEqual(boxes.map(b => b.tab), TABS);
    for (const b of boxes) {
      assert.ok(b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight, `${b.tab} dentro de la pantalla: ${JSON.stringify(b)}`);
      assert.ok(b.width >= 44 && b.height >= 44, `${b.tab}: zona táctil de 44 px como mínimo (${b.width} × ${b.height})`);
      assert.ok(b.hits, `${b.tab}: elementFromPoint en su centro cae en la pestaña`);
    }
    for (let i = 1; i < boxes.length; i++) assert.ok(boxes[i].left >= boxes[i - 1].right - 0.5, `${boxes[i - 1].tab} y ${boxes[i].tab} no se solapan`);
    // Cada pestaña conserva su nombre accesible aunque la etiqueta se quede solo para lectores de pantalla
    const names = await page.$$eval('#tabbar .tab-label', ls => ls.map(l => l.textContent.trim()));
    assert.deepEqual(names, ['Aprender', 'Canciones', 'Estudio', 'Banda', 'Perfil']);
    // Las etiquetas visibles no se salen de su botón
    const labelsFit = await page.$$eval('#tabbar .tab-label', ls => ls.every(l => {
      const r = l.getBoundingClientRect();
      const p = l.closest('button').getBoundingClientRect();
      return r.width <= 1 || (r.left >= p.left - 0.5 && r.right <= p.right + 0.5);
    }));
    assert.ok(labelsFit, 'etiquetas dentro de su pestaña');
    // Al 150 % las etiquetas siguen a la vista (con letra más justa o «…»); solo al 200 % se quedan los iconos solos
    if (zoom === '150%') {
      const shown = await page.$$eval('#tabbar .tab-label', ls => ls.map(l => l.getBoundingClientRect().width > 1));
      assert.deepEqual(shown, TABS.map(() => true), 'al 150 % se ven las cinco etiquetas');
    }
    // Sin desplazamiento horizontal: la cabecera tampoco se sale
    const { scrollWidth, topbarRight } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      topbarRight: Math.max(...[...document.querySelectorAll('#topbar *')].map(el => el.getBoundingClientRect()).filter(r => r.width > 1).map(r => r.right)),
    }));
    assert.ok(scrollWidth <= innerWidth, `sin scroll horizontal (${scrollWidth} > ${innerWidth})`);
    assert.ok(topbarRight <= innerWidth + 0.5, `la cabecera cabe (${topbarRight})`);
    assert.deepEqual(errors, []);
    await close();
  });
}

test('con la letra al 200 % se puede abrir Perfil (y cada pestaña) pulsando su centro', async () => {
  const { page, errors, close } = await openApp(env);
  await setRootFont(page, '200%');
  await sleep(300);
  for (const tab of [...TABS].reverse()) {
    const box = (await tabBoxes(page)).find(b => b.tab === tab);
    await page.mouse.click(box.left + box.width / 2, box.top + box.height / 2);
    await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: 5000 });
    await waitVisible(page, tab);
    // Las pestañas que se descargan al abrirlas empiezan su transición más tarde: se espera a que acabe
    await page.waitForFunction(() => !document.documentElement.dataset.nav, { timeout: 5000 });
    assert.equal(await page.$eval(`[data-tab="${tab}"]`, b => b.getAttribute('aria-current')), 'page', tab);
  }
  await tap(page, '[data-tab="learn"]');
  assert.deepEqual(errors, []);
  await close();
});

// Palabras de un botón que se han partido en dos líneas (cada palabra debe quedar en una sola)
const brokenWords = page => page.$$eval('.seg button', buttons => buttons.filter(b => b.getClientRects().length).flatMap(b => {
  const out = [];
  const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const m of node.textContent.matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const tops = new Set([...range.getClientRects()].map(r => Math.round(r.top)));
      if (tops.size > 1) out.push(m[0]);
    }
  }
  return out;
}));

test('con la letra al 200 % los segmentados de Ajustes no parten palabras ni se salen', async () => {
  const { page, errors, close } = await openApp(env, { seed: { lang: 'en' } });
  await setRootFont(page, '200%');
  await tap(page, '[data-tab="profile"]');
  await tap(page, '#openSettings');
  await waitVisible(page, 'settings');
  await sleep(300);
  assert.deepEqual(await brokenWords(page), [], 'ninguna palabra partida');
  const overflow = await page.$$eval('#settings .seg', segs => segs.filter(s => {
    const r = s.getBoundingClientRect();
    return [...s.children].some(b => { const c = b.getBoundingClientRect(); return c.right > r.right + 0.5 || c.left < r.left - 0.5 || b.scrollWidth > b.clientWidth + 1; });
  }).length);
  assert.equal(overflow, 0, 'cada segmento cabe dentro de su grupo');
  assert.deepEqual(errors, []);
  await close();
});

test('con la letra al 200 % «Objetivo de hoy» se lee entero dentro de su ficha', async () => {
  const { page, errors, close } = await openApp(env);
  await setRootFont(page, '200%');
  await sleep(300);
  const fit = await page.$eval('.today-goal', card => {
    const c = card.getBoundingClientRect();
    return [...card.querySelectorAll('b, small')].every(el => {
      const r = el.getBoundingClientRect();
      return r.left >= c.left - 0.5 && r.right <= c.right + 0.5 && r.bottom <= c.bottom + 0.5 && el.scrollWidth <= el.clientWidth + 1;
    });
  });
  assert.ok(fit, 'el texto de la ficha del objetivo no se corta');
  assert.deepEqual(errors, []);
  await close();
});
