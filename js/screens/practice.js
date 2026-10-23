// Herramientas de práctica: afinador, metrónomo y «Toca libre».
import { $ } from '../ui.js';
import { register, back } from '../router.js';
import { STRINGS, noteLabel, fingerText, freqToMidi, parseScore, spell } from '../music.js';
import { createStaff } from '../staff.js';
import { renderFingerboard } from '../fingerboard.js';
import { getState, update } from '../store.js';
import * as audio from '../audio.js';

const TICK_MS = 30;
const IN_TUNE_CENTS = 5;
const FREE_STABLE_MS = 180;
const FREE_TRAIL = 10;
const BPM_MIN = 30, BPM_MAX = 220, TAP_RESET_MS = 2000;
const TEMPO_NAMES = [[60, 'Largo'], [66, 'Larghetto'], [76, 'Adagio'], [108, 'Andante'], [120, 'Moderato'], [156, 'Allegro'], [176, 'Vivace'], [200, 'Presto'], [Infinity, 'Prestissimo']];

let timer = 0;

async function withMic(gateId, errId) {
  try {
    await audio.startMic();
    $(gateId).hidden = true;
  } catch (err) {
    $(errId).textContent = audio.micErrorText(err);
    $(errId).hidden = false;
  }
}

// ---------- Afinador ----------
function tunerTick() {
  const p = audio.readPitch();
  const btns = $('stringPick').querySelectorAll('button');
  if (!p || p.freq === null) { btns.forEach(b => b.classList.remove('on')); return; }
  const det = freqToMidi(p.freq);
  const near = STRINGS.reduce((a, b) => (Math.abs(b.midi - det) < Math.abs(a.midi - det) ? b : a));
  const cents = (det - near.midi) * 100;
  const nom = getState().nom;
  if (Math.abs(cents) > 300) { $('tunerCents').textContent = 'Oigo ' + noteLabel({ midi: Math.round(det) }, nom) + ': toca una cuerda al aire'; return; }
  $('needle').style.transform = `rotate(${Math.max(-50, Math.min(50, cents)) * 1.6}deg)`;
  $('tunerName').textContent = nom === 'us' ? near.us : near.eu;
  $('tunerName').style.color = Math.abs(cents) <= IN_TUNE_CENTS ? 'var(--ok)' : '';
  $('tunerCents').textContent = Math.abs(cents) <= IN_TUNE_CENTS ? 'Afinada' : (cents > 0 ? 'Alta: afloja ' : 'Baja: tensa ') + Math.abs(Math.round(cents)) + ' cents';
  btns.forEach(b => b.classList.toggle('on', Number(b.dataset.midi) === near.midi && Math.abs(cents) <= IN_TUNE_CENTS));
}

register('tuner', {
  enter() {
    const nom = getState().nom;
    $('stringPick').innerHTML = STRINGS.map(s => `<button type="button" data-midi="${s.midi}">${nom === 'us' ? s.us : s.eu}<small>${noteLabel(spell(s.midi), 'us')}</small></button>`).join('');
    $('tunerGate').hidden = audio.micReady();
    $('tunerMicError').hidden = true;
    timer = setInterval(tunerTick, TICK_MS);
  },
  leave() { clearInterval(timer); },
});
$('tunerStart').addEventListener('click', () => withMic('tunerGate', 'tunerMicError'));
$('stringPick').addEventListener('click', e => {
  const b = e.target.closest('[data-midi]');
  if (b) audio.playTone(Number(b.dataset.midi), 1.6);
});

// ---------- Metrónomo ----------
let taps = [];
let offBeat = null;
const clampBpm = v => Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(v)));

function renderMetro() {
  const { bpm, meter } = getState();
  $('bpmValue').textContent = bpm;
  $('toolBpm').textContent = bpm;
  $('bpmRange').value = bpm;
  $('tempoName').textContent = TEMPO_NAMES.find(([max]) => bpm < max)[1];
  document.querySelectorAll('[data-meter]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.meter) === meter));
  $('beats').innerHTML = Array.from({ length: meter }, (_, i) => `<span class="${i === 0 && meter > 1 ? 'accent' : ''}"></span>`).join('');
  $('metroToggle').textContent = audio.metronome().on ? 'Parar' : 'Empezar';
}

function setBpm(v) {
  update({ bpm: clampBpm(v) });
  audio.configureMetronome({ bpm: getState().bpm });
  renderMetro();
}

register('metro', {
  enter() {
    renderMetro();
    offBeat = audio.onBeat(beat => $('beats').querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i === beat)));
  },
  leave() { audio.stopMetronome(); if (offBeat) offBeat(); },
});
$('metroToggle').addEventListener('click', () => {
  if (audio.metronome().on) audio.stopMetronome();
  else { audio.configureMetronome({ bpm: getState().bpm, meter: getState().meter }); audio.startMetronome(); }
  renderMetro();
});
$('bpmDown').addEventListener('click', () => setBpm(getState().bpm - 1));
$('bpmUp').addEventListener('click', () => setBpm(getState().bpm + 1));
$('bpmRange').addEventListener('input', e => setBpm(Number(e.target.value)));
$('tapTempo').addEventListener('click', () => {
  const now = performance.now();
  const kept = taps.length && now - taps[taps.length - 1] > TAP_RESET_MS ? [] : taps;
  taps = [...kept, now].slice(-6);
  if (taps.length < 2) return;
  const gaps = taps.slice(1).map((t, i) => t - taps[i]);
  setBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
});
document.querySelectorAll('[data-meter]').forEach(b => b.addEventListener('click', () => {
  update({ meter: Number(b.dataset.meter) });
  audio.configureMetronome({ meter: getState().meter });
  renderMetro();
}));

// ---------- Toca libre ----------
const freeStaff = createStaff($('freeStaff'));
let free = { trail: [], candidate: null, since: 0 };

function renderTrail() {
  const tokens = free.trail.length ? free.trail.map(m => { const n = spell(m); return `${n.letter}${n.acc ? '#' : ''}${n.oct}q`; }) : ['Rq'];
  const score = parseScore('| ' + tokens.join(' ') + ' |');
  freeStaff.render(score, { key: 'C', time: null, mode: 'learn' });
  if (free.trail.length) freeStaff.focus(free.trail.length - 1);
}

function freeTick() {
  const p = audio.readPitch();
  if (!p || p.freq === null) { free = { ...free, candidate: null }; $('freeDot').style.left = '50%'; return; }
  const det = freqToMidi(p.freq);
  const near = Math.round(det);
  const cents = (det - near) * 100;
  const nom = getState().nom;
  $('freeName').textContent = noteLabel({ midi: near }, nom);
  $('freeHint').textContent = fingerText(near, nom);
  $('freeCents').textContent = (cents >= 0 ? '+' : '') + Math.round(cents) + ' cents';
  $('freeDot').style.left = (50 + Math.max(-50, Math.min(50, cents))) + '%';
  $('freeDot').style.background = Math.abs(cents) <= 15 ? 'var(--ok)' : Math.abs(cents) <= 30 ? 'var(--warn)' : 'var(--bad)';
  const now = performance.now();
  if (free.candidate !== near) { free = { ...free, candidate: near, since: now }; return; }
  const last = free.trail[free.trail.length - 1];
  if (now - free.since >= FREE_STABLE_MS && last !== near && near >= 55 && near <= 88) {
    free = { ...free, trail: [...free.trail, near].slice(-FREE_TRAIL) };
    renderTrail();
    if (getState().showBoard) renderFingerboard($('freeBoard'), [near], nom);
  }
}

register('free', {
  enter() {
    free = { trail: [], candidate: null, since: 0 };
    renderTrail();
    renderFingerboard($('freeBoard'), [], getState().nom);
    $('freeGate').hidden = audio.micReady();
    $('freeMicError').hidden = true;
    timer = setInterval(freeTick, TICK_MS);
  },
  leave() { clearInterval(timer); },
});
$('freeStart').addEventListener('click', () => withMic('freeGate', 'freeMicError'));

document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', back));
