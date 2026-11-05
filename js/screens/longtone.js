// Notas tenidas: gráfica en vivo de afinación y volumen, con análisis de estabilidad, vibrato y dinámica.
import { $ } from '../ui.js';
import { register } from '../router.js';
import { commonLabel, parseNote, isBowed, signedCents } from '../music.js';
import { instrumentById } from '../instruments.js';
import { fingeringFor } from '../fingerings.js';
import { analyzeLongTone, longToneTip } from '../analysis.js';
import { getState, update, addTuningSamples, logPractice, recordLongtoneTake } from '../store.js';
import * as audio from '../audio.js';
import { withMic } from './practice.js';
import { reportLmTool } from '../lm/bridge.js';

const TICK_MS = 30;
const RANGE_CENTS = 50;
const OFF_NOTE_CENTS = 100;

let secs = 10;
let routineNext = null;
let target = null;
let frames = [];
let timer = 0;
let running = false;
// Lanzado desde una unidad del curso de Lenguaje Musical: { id, secs }
let lmCtx = null;
// Nota de la toma en una unidad: se descuenta lo que la afinación media y la estabilidad se alejan de ±5 cents
const LM_GOOD_CENTS = 5;
const LM_PENALTY = 2;
// Regulador p < f > p (temario de instrumento del curso): el centro de la toma debe sonar claramente más fuerte que
// el principio y el final
const SWELL_RATIO = 1.5;
export function swellOk(levels) {
  const n = levels.length;
  if (n < 8) return false;
  const mean = xs => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const q = Math.floor(n / 4);
  const edges = (mean(levels.slice(0, q)) + mean(levels.slice(n - q))) / 2;
  return mean(levels.slice(q + Math.floor(q / 2), n - q - Math.floor(q / 2))) > edges * SWELL_RATIO;
}
let swell = false;
export const longtonePct = r => Math.max(0, Math.min(100, Math.round(100 - LM_PENALTY * (Math.max(0, Math.abs(r.mean) - LM_GOOD_CENTS) + Math.max(0, r.stability - LM_GOOD_CENTS)))));

// Los colores del tema se leen una vez por toma (antes, getComputedStyle cada 30 ms)
let palette = null;
const readPalette = () => {
  const style = getComputedStyle(document.documentElement);
  const v = name => style.getPropertyValue(name).trim();
  palette = { '--ink': v('--ink'), '--muted': v('--muted'), '--u2': v('--u2'), '--accent': v('--accent') };
};
const css = name => { if (!palette) readPalette(); return palette[name]; };

function draw() {
  const cv = $('ltCanvas');
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const total = Math.round(secs * 1000 / TICK_MS);
  const y = c => H / 2 - (Math.max(-RANGE_CENTS, Math.min(RANGE_CENTS, c)) / RANGE_CENTS) * (H / 2 - 12);
  g.clearRect(0, 0, W, H);
  // las etiquetas se dibujan a 13 px de pantalla sea cual sea la escala del lienzo (a 360 px salían de unos 8 px)
  const scale = W / (cv.clientWidth || W);
  g.font = `700 ${Math.round(13 * scale)}px Figtree, sans-serif`;
  [[0, 0.55], [10, 0.25], [-10, 0.25], [25, 0.15], [-25, 0.15]].forEach(([c, a]) => {
    g.globalAlpha = a;
    g.strokeStyle = css('--ink');
    g.beginPath(); g.moveTo(0, y(c)); g.lineTo(W, y(c)); g.stroke();
    g.globalAlpha = 1;
    g.fillStyle = css('--muted');
    if (c) g.fillText((c > 0 ? '+' : '') + c, 6 * scale, y(c) - 4 * scale);
  });
  g.globalAlpha = 0.35;
  g.fillStyle = css('--u2');
  frames.forEach((f, i) => {
    const h = Math.min(1, f.level * 4) * (H * 0.35);
    g.fillRect(i * W / total, H - h, W / total + 0.5, h);
  });
  g.globalAlpha = 1;
  g.strokeStyle = css('--accent');
  g.lineWidth = 3;
  g.beginPath();
  let pen = false;
  frames.forEach((f, i) => {
    if (f.cents === null) { pen = false; return; }
    const x = i * W / total;
    if (pen) g.lineTo(x, y(f.cents)); else g.moveTo(x, y(f.cents));
    pen = true;
  });
  g.stroke();
}

function stat(value, label) { return `<div class="stat"><b>${value}</b><span>${label}</span></div>`; }

function showResult() {
  const r = analyzeLongTone(frames, TICK_MS);
  $('ltTip').textContent = longToneTip(r, { bowed: isBowed(getState().instrument) });
  $('ltNextStep').hidden = !routineNext;
  if (routineNext) $('ltNextStep').textContent = routineNext.label;
  if (!r) { $('ltStats').innerHTML = ''; return; }
  $('ltStats').innerHTML = stat(signedCents(r.mean) + ' ¢', 'afinación media')
    + stat('±' + Math.round(r.stability) + ' ¢', 'estabilidad')
    + stat(r.vibrato ? `${r.vibrato.rate.toFixed(1)} Hz` : '—', r.vibrato ? `vibrato · ${Math.round(r.vibrato.width)} ¢` : 'sin vibrato');
  if (swell) $('ltStats').innerHTML += stat(swellOk(frames.map(f => f.level)) ? '✓' : '✕', swellOk(frames.map(f => f.level)) ? 'regulador p < f > p' : 'regulador: crece más en el centro');
  addTuningSamples([{ midi: target, cents: r.mean }]);
  recordLongtoneTake(r);
  logPractice(r.seconds / 60);
  update({ longtones: getState().longtones + 1 });
  if (lmCtx) reportLmTool(lmCtx, { pct: longtonePct(r), skills: { entonacion: longtonePct(r) }, mistakes: [r.mean > LM_GOOD_CENTS ? 'alta' : r.mean < -LM_GOOD_CENTS ? 'baja' : null, r.stability > LM_GOOD_CENTS ? 'inestable' : null] });
}

function tick() {
  const p = audio.readPitch();
  const cents = p && p.freq !== null ? (p.midi - target) * 100 : null;
  frames.push({ cents: cents !== null && Math.abs(cents) <= OFF_NOTE_CENTS ? cents : null, level: p ? p.level : 0 });
  draw();
  if (frames.length * TICK_MS >= secs * 1000) stop(true);
}

function stop(done) {
  clearInterval(timer);
  running = false;
  $('ltGo').textContent = 'Empezar';
  if (done) showResult();
}

function start() {
  if (!audio.micReady()) { $('ltGate').hidden = false; return; }
  frames = [];
  readPalette();
  running = true;
  $('ltGo').textContent = 'Parar';
  $('ltTip').textContent = 'Sostén la nota…';
  $('ltStats').innerHTML = '';
  timer = setInterval(tick, TICK_MS);
}

function enter({ midi, secs: forcedSecs, routine, lm, dynamics } = {}) {
  lmCtx = lm || null;
  swell = dynamics === 'p<f>p';
  routineNext = routine || null;
  if (forcedSecs) secs = forcedSecs;
  $('ltNextStep').hidden = true;
  const inst = instrumentById(getState().instrument);
  const nom = getState().nom;
  target = midi ?? parseNote(inst.firstNotes[0]).midi;
  // Madera y flauta dulce: solo las notas que tienen digitación en la tabla (más la que llega del mapa de afinación)
  const table = inst.family === 'madera' || inst.id === 'recorder';
  const options = [];
  for (let m = inst.written[0]; m <= inst.written[1]; m++) if (!table || m === target || fingeringFor(inst.id, m)) options.push(m);
  // Ortografía habitual (Do♯, Mi♭, Fa♯, Sol♯, Si♭): en clarinete no sale «La♯»
  $('ltNote').innerHTML = options.map(m => `<option value="${m}" ${m === target ? 'selected' : ''}>${commonLabel(m, nom)}${nom === 'eu' ? ' ' + (Math.floor(m / 12) - 1) : ''}</option>`).join('');
  document.querySelectorAll('[data-lt-secs]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.ltSecs) === secs));
  $('ltGate').hidden = audio.micReady();
  $('ltMicError').hidden = true;
  frames = [];
  $('ltStats').innerHTML = '';
  $('ltTip').textContent = swell ? 'Haz un regulador: empieza piano, crece hasta forte en la mitad y vuelve a piano.' : '';
  readPalette();
  draw();
}

register('longtone', { enter, leave() { stop(false); } });

$('ltStart').addEventListener('click', () => withMic('ltGate', 'ltMicError'));
$('ltNote').addEventListener('change', e => { target = Number(e.target.value); frames = []; draw(); });
document.querySelectorAll('[data-lt-secs]').forEach(b => b.addEventListener('click', () => {
  secs = Number(b.dataset.ltSecs);
  document.querySelectorAll('[data-lt-secs]').forEach(x => x.setAttribute('aria-pressed', x === b));
}));
$('ltGo').addEventListener('click', () => (running ? stop(true) : start()));
$('ltNextStep').addEventListener('click', () => { if (routineNext) routineNext.run(); });
$('ltRef').addEventListener('click', () => { if (!running) audio.playTone(target, 1.5); });
