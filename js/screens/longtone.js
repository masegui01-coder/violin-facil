// Notas tenidas: gráfica en vivo de afinación y volumen, con análisis de estabilidad, vibrato y dinámica.
import { $ } from '../ui.js';
import { register } from '../router.js';
import { noteLabel, parseNote, isBowed } from '../music.js';
import { instrumentById } from '../instruments.js';
import { analyzeLongTone, longToneTip } from '../analysis.js';
import { getState, update, addTuningSamples, logPractice, recordLongtoneTake } from '../store.js';
import * as audio from '../audio.js';
import { withMic } from './practice.js';

const TICK_MS = 30;
const RANGE_CENTS = 50;
const OFF_NOTE_CENTS = 100;

let secs = 10;
let routineNext = null;
let target = null;
let frames = [];
let timer = 0;
let running = false;

const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function draw() {
  const cv = $('ltCanvas');
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const total = Math.round(secs * 1000 / TICK_MS);
  const y = c => H / 2 - (Math.max(-RANGE_CENTS, Math.min(RANGE_CENTS, c)) / RANGE_CENTS) * (H / 2 - 12);
  g.clearRect(0, 0, W, H);
  g.font = '600 18px Figtree, sans-serif';
  [[0, 0.55], [10, 0.25], [-10, 0.25], [25, 0.15], [-25, 0.15]].forEach(([c, a]) => {
    g.globalAlpha = a;
    g.strokeStyle = css('--ink');
    g.beginPath(); g.moveTo(0, y(c)); g.lineTo(W, y(c)); g.stroke();
    g.globalAlpha = 0.6;
    g.fillStyle = css('--muted');
    if (c) g.fillText((c > 0 ? '+' : '') + c, 6, y(c) - 4);
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
  const sign = v => (v >= 0 ? '+' : '') + Math.round(v);
  $('ltStats').innerHTML = stat(sign(r.mean) + ' ¢', 'afinación media')
    + stat('±' + Math.round(r.stability) + ' ¢', 'estabilidad')
    + stat(r.vibrato ? `${r.vibrato.rate.toFixed(1)} Hz` : '—', r.vibrato ? `vibrato · ${Math.round(r.vibrato.width)} ¢` : 'sin vibrato');
  addTuningSamples([{ midi: target, cents: r.mean }]);
  recordLongtoneTake(r);
  logPractice(r.seconds / 60);
  update({ longtones: getState().longtones + 1 });
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
  running = true;
  $('ltGo').textContent = 'Parar';
  $('ltTip').textContent = 'Sostén la nota…';
  $('ltStats').innerHTML = '';
  timer = setInterval(tick, TICK_MS);
}

function enter({ midi, secs: forcedSecs, routine } = {}) {
  routineNext = routine || null;
  if (forcedSecs) secs = forcedSecs;
  $('ltNextStep').hidden = true;
  const inst = instrumentById(getState().instrument);
  const nom = getState().nom;
  const options = [];
  for (let m = inst.written[0]; m <= inst.written[1]; m++) options.push(m);
  target = midi ?? parseNote(inst.firstNotes[0]).midi;
  $('ltNote').innerHTML = options.map(m => `<option value="${m}" ${m === target ? 'selected' : ''}>${noteLabel({ midi: m }, nom)}${nom === 'eu' ? ' ' + (Math.floor(m / 12) - 1) : ''}</option>`).join('');
  document.querySelectorAll('[data-lt-secs]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.ltSecs) === secs));
  $('ltGate').hidden = audio.micReady();
  $('ltMicError').hidden = true;
  frames = [];
  $('ltStats').innerHTML = '';
  $('ltTip').textContent = '';
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
