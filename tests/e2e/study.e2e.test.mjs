// Estudio: el modo audición no enseña ayudas, la calibración de percusión siempre tiene salida y los segmentados
// conservan el foco al rehacerse. Se ejecuta con `npm run e2e` (después de `npm run build`).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, openApp, tap, waitVisible, sleep } from './helpers.mjs';

const CALIBRATION_MS = 9000; // 8 golpes a 90 BPM y los márgenes
let env;

before(async () => { env = await launch(); });
after(async () => { await env?.close(); });

// Micrófono en silencio (la calibración no oye nada) que apunta qué pistas se han parado
function silentMic() {
  window.__micTracks = [];
  // cuenta los golpes sintéticos (cada uno es un AudioBufferSourceNode)
  window.__drumHits = 0;
  const create = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function (...args) { window.__drumHits++; return create.apply(this, args); };
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AudioContext();
    const dest = ac.createMediaStreamDestination();
    window.__micTracks.push(...dest.stream.getAudioTracks());
    return dest.stream;
  };
}

const openWithMic = seed => openApp(env, { seed, init: silentMic });

async function openStudy(page) {
  await tap(page, '[data-tab="practice"]');
  await waitVisible(page, 'practice');
}

test('modo audición: ni diagrama de digitación ni nombre de la nota ni la siguiente', async () => {
  const { page, errors, close } = await openApp(env, { seed: { instrument: 'tuba', showBoard: true } });
  await openStudy(page);
  await tap(page, '#toolAudition');
  await waitVisible(page, 'lesson');
  const shown = await page.evaluate(() => {
    const seen = el => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    return { board: seen(document.getElementById('lessonBoard')), name: seen(document.getElementById('tName')), next: seen(document.getElementById('tNext')) };
  });
  assert.deepEqual(shown, { board: false, name: false, next: false });
  assert.deepEqual(errors, []);
  await close();
});

test('Toca libre con el diagrama desactivado no deja hueco', async () => {
  const { page, close } = await openApp(env, { seed: { instrument: 'trumpet', showBoard: false } });
  await openStudy(page);
  await tap(page, '[data-go="free"]');
  await waitVisible(page, 'free');
  assert.equal(await page.$eval('#freeBoard', el => getComputedStyle(el).display), 'none');
  await close();
});

test('Toca libre escribe en la clave del instrumento (fa en tuba, sol en trompeta) y notas tenidas solo ofrece notas con digitación', async () => {
  for (const [instrument, clef] of [['tuba', '𝄢'], ['cello', '𝄢'], ['trumpet', '𝄞']]) {
    const { page, close } = await openApp(env, { seed: { instrument } });
    await openStudy(page);
    await tap(page, '[data-go="free"]');
    await waitVisible(page, 'free');
    assert.equal(await page.$eval('#freeStaff', s => [...s.querySelectorAll('text')].some(t => t.textContent === '𝄢')), clef === '𝄢', instrument);
    await close();
  }
  const { page, close } = await openApp(env, { seed: { instrument: 'piccolo', nom: 'us' } });
  await openStudy(page);
  await tap(page, '[data-go="longtone"]');
  await waitVisible(page, 'longtone');
  const first = await page.$eval('#ltNote option', o => o.textContent);
  assert.equal(first, 'D4', 'el flautín empieza en Re4');
  await close();
});

test('calibración de percusión fallida: lo dice, ofrece reintentar o cerrar y apaga el micrófono', async () => {
  const { page, errors, close } = await openWithMic({ instrument: 'percussion' });
  await openStudy(page);
  await page.$eval('#toolCalibrate', b => b.click());
  await page.waitForSelector('#sheet[open]', { timeout: 5000 });
  assert.match(await page.$eval('#sheetBody h2', h => h.textContent), /Calibrando/);
  await page.waitForFunction(() => /No se ha podido calibrar/.test(document.querySelector('#sheetBody h2').textContent), { timeout: CALIBRATION_MS });
  assert.ok(await page.$('#sheetBody [data-retry]'), 'botón Reintentar');
  assert.equal(await page.evaluate(() => window.__micTracks.every(t => t.readyState === 'ended')), true, 'micrófono apagado');
  await page.$eval('#sheetBody [data-close]', b => b.click());
  assert.equal(await page.$eval('#sheet', d => d.open), false);
  assert.deepEqual(errors, []);
  await close();
});

test('calibración: un doble clic en «Calibrar» arranca un solo intento', async () => {
  const { page, close } = await openWithMic({ instrument: 'percussion' });
  await openStudy(page);
  await page.$eval('#toolCalibrate', b => { b.click(); b.click(); });
  await page.waitForFunction(() => /No se ha podido calibrar/.test(document.querySelector('#sheetBody h2').textContent), { timeout: CALIBRATION_MS });
  assert.equal(await page.evaluate(() => window.__drumHits), 8, 'los 8 golpes de un solo intento');
  await close();
});

test('calibración: Escape la cancela al momento y apaga el micrófono', async () => {
  const { page, close } = await openWithMic({ instrument: 'percussion' });
  await openStudy(page);
  await page.$eval('#toolCalibrate', b => b.click());
  await page.waitForSelector('#sheet[open]', { timeout: 5000 });
  await sleep(500);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('sheet').open, { timeout: 2000 });
  await page.waitForFunction(() => window.__micTracks.length && window.__micTracks.every(t => t.readyState === 'ended'), { timeout: 2000 });
  await sleep(CALIBRATION_MS - 2000);
  assert.equal(await page.$eval('#sheet', d => d.open), false, 'no vuelve a abrirse con el resultado');
  await close();
});

// Antes, con el micro ya concedido en otra pantalla (rudimentos), la calibración lo reabría y no lo cerraba
test('calibración tras usar el micro en los rudimentos: al cerrar, y tras Reintentar + Escape, no queda ninguna pista viva', async () => {
  const { page, errors, close } = await openWithMic({ instrument: 'percussion' });
  await openStudy(page);
  await tap(page, '[data-go="gym"]');
  await waitVisible(page, 'gym');
  await tap(page, '#gymList [data-rudiment]');
  await waitVisible(page, 'rhythm');
  if (await page.$eval('#rhGate', g => !g.hidden)) await page.$eval('#rhStartMic', b => b.click());
  await page.waitForFunction(() => window.__micTracks.length > 0, { timeout: 5000 });
  await tap(page, '#rhExit');
  await waitVisible(page, 'practice');
  const allEnded = () => page.evaluate(() => window.__micTracks.every(t => t.readyState === 'ended'));
  await page.$eval('#toolCalibrate', b => b.click());
  await page.waitForFunction(() => /No se ha podido calibrar/.test(document.querySelector('#sheetBody h2').textContent), { timeout: CALIBRATION_MS });
  assert.equal(await allEnded(), true, 'tras fallar');
  // Reintentar: el intento nuevo llega a su resultado (antes se cancelaba solo y la hoja quedaba en «Calibrando…»)
  await page.$eval('#sheetBody [data-retry]', b => b.click());
  await page.waitForFunction(() => /Calibrando/.test(document.querySelector('#sheetBody h2')?.textContent || ''), { timeout: 5000 });
  await page.waitForFunction(() => /¡Calibrado!|No se ha podido calibrar/.test(document.querySelector('#sheetBody h2').textContent), { timeout: CALIBRATION_MS });
  assert.equal(await allEnded(), true, 'tras el segundo intento');
  // Reintentar otra vez y cancelar con Escape a mitad
  await page.$eval('#sheetBody [data-retry]', b => b.click());
  await page.waitForFunction(() => /Calibrando/.test(document.querySelector('#sheetBody h2')?.textContent || ''), { timeout: 5000 });
  await sleep(400);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('sheet').open, { timeout: 2000 });
  await page.waitForFunction(() => window.__micTracks.every(t => t.readyState === 'ended'), { timeout: 2000 });
  assert.deepEqual(errors, []);
  await close();
});

test('afinador de clarinete: los botones de referencia se llaman como se ven (sin aria-label) y dicen cómo suenan', async () => {
  const { page, close } = await openApp(env, { seed: { instrument: 'clarinet', nom: 'eu' } });
  await openStudy(page);
  await tap(page, '[data-go="tuner"]');
  await waitVisible(page, 'tuner');
  const buttons = await page.$$eval('#stringPick button', bs => bs.map(b => ({ label: b.getAttribute('aria-label'), text: b.textContent.replace(/\s+/g, ' ').trim() })));
  assert.equal(buttons.length, 3);
  buttons.forEach(b => assert.equal(b.label, null));
  // Clarinete en Si♭: el Do escrito suena Si♭ (de concierto, deletreado en bemoles y en Do-Re-Mi)
  assert.ok(buttons.some(b => /^Do suena Si♭\d$/.test(b.text)), JSON.stringify(buttons));
  await close();
});

test('segmentados del gimnasio y de afinar en acorde: el foco vuelve al botón elegido', async () => {
  const { page, close } = await openApp(env, { seed: { instrument: 'trumpet' } });
  await openStudy(page);
  await tap(page, '[data-go="gym"]');
  await waitVisible(page, 'gym');
  await page.focus('#gymKinds [data-kind]:nth-child(2)');
  await page.keyboard.press('Enter');
  const kind = await page.evaluate(() => document.activeElement.closest('#gymKinds') && document.activeElement.getAttribute('aria-pressed'));
  assert.equal(kind, 'true', 'foco en el tipo elegido');
  await tap(page, '#gym [data-back]');
  await waitVisible(page, 'practice');
  await tap(page, '[data-go="chord"]');
  await waitVisible(page, 'chord');
  await page.focus('#chIntervals [data-int="P5"]');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.int), 'P5');
  await page.focus('#chRoots [data-root="63"]');
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.root), '63');
  // Trompeta en Si♭: Mi♭ de concierto es Fa escrito y su quinta, Do (no Si♯)
  assert.match(await page.$eval('#chName', el => el.textContent), /^C\d$/);
  await close();
});
