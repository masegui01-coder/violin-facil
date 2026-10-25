// Herramientas de Estudio para percusión: rudimentos con tempo creciente y calibración del micrófono.
// También adapta la pestaña Estudio: oculta lo que depende de la afinación y muestra lo rítmico.
import { $, esc, toast } from '../ui.js';
import { register } from '../router.js';
import { instrumentById } from '../instruments.js';
import { getState, update } from '../store.js';
import { launch } from '../launch.js';
import * as audio from '../audio.js';

const START_BPM = 60;
const STEP_BPM = 4;
const PASS_STARS = 2;
const CALIBRATION_HITS = 8;
const CALIBRATION_BPM = 90;
const MATCH_S = 0.3;
const MIN_MATCHES = 5;

const bar = (cell, n) => '| ' + Array(n).fill(cell).join(' | ') + ' | C5w |';
const hands = (pattern, n) => Array.from({ length: n }, (_, i) => pattern[i % pattern.length]);

export const RUDIMENTS = [
  { id: 'pulse', name: 'Pulso estable', sub: 'Negras con las dos manos', score: bar('C5q C5q C5q C5q', 4), sticking: hands('DI', 16).concat('D') },
  { id: 'singles', name: 'Golpes simples', sub: 'D I D I en corcheas', score: bar('C5e C5e C5e C5e C5e C5e C5e C5e', 3), sticking: hands('DI', 24).concat('D') },
  { id: 'doubles', name: 'Golpes dobles', sub: 'D D I I', score: bar('C5e C5e C5e C5e C5e C5e C5e C5e', 3), sticking: hands(['D', 'D', 'I', 'I'], 24).concat('D') },
  { id: 'paradiddle', name: 'Paradiddle', sub: 'D I D D · I D I I', score: bar('C5e> C5e C5e C5e C5e> C5e C5e C5e', 3), sticking: hands(['D', 'I', 'D', 'D', 'I', 'D', 'I', 'I'], 24).concat('D') },
  { id: 'sixteenths', name: 'Semicorcheas', sub: 'Cuatro por pulso, sin acelerar', score: bar('C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s', 2), sticking: hands('DI', 32).concat('D') },
  { id: 'accents', name: 'Acentos', sub: 'Uno de cada cuatro', score: bar('C5s> C5s C5s C5s C5s> C5s C5s C5s C5s> C5s C5s C5s C5s> C5s C5s C5s', 2), sticking: hands('DI', 32).concat('D') },
];

const isPerc = () => instrumentById(getState().instrument).rhythmOnly;
const bestBpm = id => getState().gym[`${getState().instrument}:${id}`] || 0;

export function rudimentLesson(r, bpm) {
  const id = 'rud-' + r.id;
  return {
    id, kind: 'song', fixedSpeed: true, sticking: r.sticking, gym: { id, bpm },
    song: { id, title: r.name, by: 'Gimnasio de rudimentos', style: null, difficulty: 2, key: 'C', time: 4, bpm, score: r.score },
    nextAction: ({ stars }) => (stars >= PASS_STARS
      ? { label: `Subir a ${bpm + STEP_BPM} BPM`, run: () => launch(rudimentLesson(r, bpm + STEP_BPM), { mode: 'tempo', from: 'practice' }) }
      : { label: `Repetir a ${bpm} BPM`, run: () => launch(rudimentLesson(r, bpm), { mode: 'tempo', from: 'practice' }) }),
  };
}

// La lista del gimnasio para percusión (gym.js la pide cuando el instrumento es de ritmo)
export function renderRudiments() {
  $('gymKinds').innerHTML = '';
  $('gymKinds').closest('.setting').hidden = true;
  $('gymList').innerHTML = RUDIMENTS.map(r => {
    const best = bestBpm('rud-' + r.id);
    return `<button type="button" class="gym-row" data-rudiment="${r.id}"><span><b>${esc(r.name)}</b><small>${esc(r.sub)}</small></span>
      <span class="gym-bpm">${best ? best + ' BPM' : '—'}</span></button>`;
  }).join('');
}

$('gymList').addEventListener('click', e => {
  const b = e.target.closest('[data-rudiment]');
  if (!b) return;
  const r = RUDIMENTS.find(x => x.id === b.dataset.rudiment);
  launch(rudimentLesson(r, bestBpm('rud-' + r.id) || START_BPM), { mode: 'tempo', from: 'practice' });
});

// ---------- Estudio según el instrumento ----------
register('practice', {
  enter() {
    const perc = isPerc();
    document.querySelectorAll('#practice [data-family="pitch"]').forEach(el => { el.hidden = perc; });
    document.querySelectorAll('#practice [data-family="perc"]').forEach(el => { el.hidden = !perc; });
    // Guitarra y piano: la afinación la da el instrumento; notas tenidas y afinar en acorde no les sirven
    if (instrumentById(getState().instrument).polyphonic) document.querySelectorAll('#practice [data-melodic]').forEach(el => { el.hidden = true; });
    $('gymToolText').textContent = perc ? 'Pulso, golpes simples y dobles, paradiddle y acentos' : 'Escalas, arpegios y terceras en las 12 tonalidades';
  },
});

// ---------- Calibración: el móvil se escucha a sí mismo y mide el retraso de ida y vuelta ----------
async function calibrate() {
  if (!audio.micReady()) {
    try { await audio.startMic(); } catch (err) { toast(audio.micErrorText(err)); return; }
  }
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>Calibrando…</h2>
    <p class="muted">Sube el volumen y no hagas ruido: van a sonar ${CALIBRATION_HITS} golpes y el micrófono medirá cuánto tardan en llegar.</p>
    <p id="calStatus" class="status">Escuchando…</p></div>`;
  $('sheet').showModal();
  const heard = [];
  audio.startOnsetCapture(hits => heard.push(...hits));
  const spb = 60 / CALIBRATION_BPM;
  const t0 = audio.audioTime() + 0.6;
  const scheduled = Array.from({ length: CALIBRATION_HITS }, (_, i) => t0 + i * spb);
  scheduled.forEach(t => audio.drumHit(t, true));
  await new Promise(r => setTimeout(r, (0.6 + CALIBRATION_HITS * spb + 0.6) * 1000));
  audio.stopOnsetCapture();
  const delays = scheduled.map(t => heard.map(h => h.time - t).filter(d => d >= 0 && d < MATCH_S).sort((a, b) => a - b)[0]).filter(d => d !== undefined).sort((a, b) => a - b);
  if (delays.length < MIN_MATCHES) {
    $('calStatus').textContent = 'No he oído bien los golpes. Sube el volumen del móvil, quita los auriculares y vuelve a intentarlo.';
    return;
  }
  const latency = delays[Math.floor(delays.length / 2)];
  update({ percLatency: latency });
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>¡Calibrado!</h2>
    <p>El retraso de tu móvil es de <b>${Math.round(latency * 1000)} ms</b>. Lo tendré en cuenta para medir tus golpes.</p>
    <p class="muted small">Si cambias de móvil o usas auriculares Bluetooth, vuelve a calibrar.</p>
    <button type="button" class="btn small" data-close>Entendido</button></div>`;
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
}

$('toolCalibrate').addEventListener('click', calibrate);
