// Afinar en acorde: la app suena tónica y quinta; tú tocas un grado y lo colocas en su sitio de afinación justa.
import { $, toast } from '../ui.js';
import { register } from '../router.js';
import { noteLabel } from '../music.js';
import { instrumentById } from '../instruments.js';
import { getState, logPractice } from '../store.js';
import * as audio from '../audio.js';
import { withMic } from './practice.js';

const TICK_MS = 30;
const SUCCESS_CENTS = 5;
const HOLD_MS = 1200;
const LISTEN_S = 2.5;
const PLAY_S = 4.5;
// Acordes de concierto típicos de banda (sonido real)
const ROOTS = [{ midi: 58, name: 'Si♭' }, { midi: 63, name: 'Mi♭' }, { midi: 65, name: 'Fa' }, { midi: 60, name: 'Do' }];
// Desviación de la afinación justa respecto al temperamento igual (cents)
export const JUST_INTERVALS = [
  { id: 'root', name: 'Tónica', semi: 0, cents: 0 },
  { id: 'M3', name: '3.ª mayor', semi: 4, cents: -13.7 },
  { id: 'm3', name: '3.ª menor', semi: 3, cents: 15.6 },
  { id: 'P5', name: '5.ª', semi: 7, cents: 2.0 },
  { id: 'M6', name: '6.ª mayor', semi: 9, cents: -15.6 },
  { id: 'oct', name: 'Octava', semi: 12, cents: 0 },
];

let root = ROOTS[0];
let interval = JUST_INTERVALS[1];
let mode = 'loop';
let target = null;
let timer = 0;
let stopChord = null;
let running = false;
let hold = 0;
let hits = 0;
let cycleStart = 0;

// Nota escrita que toca el músico, en la octava más cómoda de su registro
function writtenTarget() {
  const inst = instrumentById(getState().instrument);
  const center = (inst.written[0] + inst.written[1]) / 2 - 3;
  const base = root.midi + interval.semi - inst.transpose;
  return [-24, -12, 0, 12, 24].map(k => base + k)
    .filter(m => m >= inst.written[0] && m <= inst.written[1])
    .reduce((a, b) => (Math.abs(b - center) < Math.abs(a - center) ? b : a));
}

function renderSegs() {
  $('chRoots').innerHTML = ROOTS.map(r => `<button type="button" data-root="${r.midi}" aria-pressed="${r === root}">${r.name}</button>`).join('');
  $('chIntervals').innerHTML = JUST_INTERVALS.map(i => `<button type="button" data-int="${i.id}" aria-pressed="${i === interval}">${i.name}</button>`).join('');
  document.querySelectorAll('[data-ch-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.chMode === mode));
  target = writtenTarget();
  const nom = getState().nom;
  const sign = interval.cents > 0 ? '+' : '';
  $('chName').textContent = noteLabel({ midi: target }, nom);
  $('chHint').textContent = interval.cents ? `Objetivo: ${sign}${interval.cents.toFixed(0)} cents respecto al afinador` : 'Objetivo: igual que el afinador';
}

function chordNotes() { return [root.midi - 12, root.midi - 5, root.midi]; }

function setMeter(dev) {
  const dot = $('chDot');
  if (dev === null) { dot.style.left = '50%'; dot.style.background = 'var(--muted)'; return; }
  dot.style.left = (50 + Math.max(-50, Math.min(50, dev * 2))) + '%';
  dot.style.background = Math.abs(dev) <= SUCCESS_CENTS ? 'var(--ok)' : Math.abs(dev) <= 12 ? 'var(--warn)' : 'var(--bad)';
}

function tick() {
  if (mode === 'loop') {
    const t = (performance.now() - cycleStart) / 1000;
    if (t >= LISTEN_S + PLAY_S) { cycleStart = performance.now(); stopChord = audio.playChord(chordNotes(), LISTEN_S); $('chStatus').textContent = 'Escucha el acorde…'; hold = 0; return; }
    if (t < LISTEN_S) return;
  }
  const p = audio.readPitch();
  if (!p || p.freq === null) { setMeter(null); $('chCents').innerHTML = '&nbsp;'; hold = 0; if (mode === 'loop') $('chStatus').textContent = 'Ahora tú'; return; }
  const dev = (p.midi - target) * 100 - interval.cents;
  if (Math.abs(dev) > 80) { setMeter(null); $('chCents').textContent = 'Oigo ' + noteLabel({ midi: Math.round(p.midi) }, getState().nom); hold = 0; return; }
  setMeter(dev);
  $('chCents').textContent = Math.abs(dev) <= SUCCESS_CENTS ? 'En su sitio' : (dev > 0 ? 'Alto ' : 'Bajo ') + Math.abs(Math.round(dev)) + ' cents';
  hold = Math.abs(dev) <= SUCCESS_CENTS ? hold + TICK_MS : 0;
  if (hold >= HOLD_MS) {
    hold = -1500;
    hits++;
    $('chStatus').textContent = `¡Clavada! ${hits} ${hits === 1 ? 'vez' : 'veces'}`;
    logPractice(0.2, 3);
  }
}

function stop() {
  clearInterval(timer);
  if (stopChord) stopChord();
  stopChord = null;
  running = false;
  $('chGo').textContent = 'Empezar';
}

function start() {
  if (!audio.micReady()) { $('chGate').hidden = false; return; }
  running = true;
  hits = 0;
  hold = 0;
  $('chGo').textContent = 'Parar';
  if (mode === 'drone') { stopChord = audio.playChord(chordNotes()); $('chStatus').textContent = 'Toca la nota y busca que el punto se ponga verde'; }
  else { cycleStart = performance.now(); stopChord = audio.playChord(chordNotes(), LISTEN_S); $('chStatus').textContent = 'Escucha el acorde…'; }
  timer = setInterval(tick, TICK_MS);
}

register('chord', {
  enter() {
    renderSegs();
    $('chGate').hidden = audio.micReady();
    $('chMicError').hidden = true;
    $('chStatus').innerHTML = '&nbsp;';
    setMeter(null);
  },
  leave: stop,
});

$('chStart').addEventListener('click', () => withMic('chGate', 'chMicError'));
$('chRoots').addEventListener('click', e => { const b = e.target.closest('[data-root]'); if (b) { root = ROOTS.find(r => r.midi === Number(b.dataset.root)); if (running) stop(); renderSegs(); } });
$('chIntervals').addEventListener('click', e => { const b = e.target.closest('[data-int]'); if (b) { interval = JUST_INTERVALS.find(i => i.id === b.dataset.int); renderSegs(); } });
document.querySelectorAll('[data-ch-mode]').forEach(b => b.addEventListener('click', () => {
  mode = b.dataset.chMode;
  if (running) stop();
  renderSegs();
  if (mode === 'drone') toast('Usa auriculares: si el micrófono oye el acorde, se confunde');
}));
$('chGo').addEventListener('click', () => (running ? stop() : start()));
