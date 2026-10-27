// Golpes suaves (baqueta sobre una mesa con el móvil lejos): el umbral se adapta al ruido de la sala
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOnsetDetector } from '../js/onsets.js';

const SR = 48000;
// Ruido de fondo fijo (pseudoaleatorio, para que el test no dependa del azar) y golpes cortos cada medio segundo
function detect(amp, noise, taps = 6) {
  let seed = 1;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32) * 2 - 1;
  const x = new Float32Array(SR * 4);
  for (let i = 0; i < x.length; i++) x[i] = rnd() * noise;
  for (let k = 0; k < taps; k++) {
    const s = Math.floor(SR * (0.5 + k * 0.5));
    for (let i = 0; i < SR * 0.05; i++) x[s + i] += amp * Math.exp(-i / (SR * 0.006)) * Math.sin(i * 2 * Math.PI * 1200 / SR);
  }
  const d = createOnsetDetector(SR);
  let hits = [];
  for (let i = 0; i < x.length; i += 1024) hits = hits.concat(d.feed(x.slice(i, i + 1024), i / SR));
  return hits.length;
}

test('oye golpes suaves de baqueta sobre una mesa', () => {
  assert.equal(detect(0.03, 0.003), 6);
  assert.equal(detect(0.3, 0.003), 6);
});

test('el ruido de la sala sin golpes no cuenta como golpe', () => {
  assert.equal(detect(0, 0.02, 0), 0);
  assert.equal(detect(0, 0.0005, 0), 0);
});
