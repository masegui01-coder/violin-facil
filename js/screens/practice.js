// Herramientas de práctica: afinador y metrónomo («Toca libre» está en free.js).
import { $ } from '../ui.js';
import { register, back } from '../router.js';
import { STRINGS, noteLabel, spell } from '../music.js';
import { instrumentById } from '../instruments.js';
import { getState, update } from '../store.js';
import * as audio from '../audio.js';

const TICK_MS = 30;
const IN_TUNE_CENTS = 5;
const BPM_MIN = 30, BPM_MAX = 220, TAP_RESET_MS = 2000;
const TEMPO_NAMES = [[60, 'Largo'], [66, 'Larghetto'], [76, 'Adagio'], [108, 'Andante'], [120, 'Moderato'], [156, 'Allegro'], [176, 'Vivace'], [200, 'Presto'], [Infinity, 'Prestissimo']];

let timer = 0;

export async function withMic(gateId, errId) {
  try {
    await audio.startMic();
    $(gateId).hidden = true;
  } catch (err) {
    $(errId).textContent = audio.micErrorText(err);
    $(errId).hidden = false;
  }
}

// ---------- Afinador ----------
// Violín y guitarra: sus cuerdas al aire. Viento y piano: cromático, con la nota escrita y, si transporta, la real.
// Guitarra: notas escritas (una octava por encima de como suenan).
const GUITAR_STRINGS = [
  { midi: 52, eu: '6.ª Mi', us: 'E2' }, { midi: 57, eu: '5.ª La', us: 'A2' }, { midi: 62, eu: '4.ª Re', us: 'D3' },
  { midi: 67, eu: '3.ª Sol', us: 'G3' }, { midi: 71, eu: '2.ª Si', us: 'B3' }, { midi: 76, eu: '1.ª Mi', us: 'E4' },
];
const STRINGS_OF = { violin: STRINGS, guitar: GUITAR_STRINGS };
const openStrings = () => STRINGS_OF[getState().instrument] || null;
const isViolin = () => !!openStrings();

function showTuning(name, cents, sub) {
  const ok = Math.abs(cents) <= IN_TUNE_CENTS;
  $('needle').style.transform = `rotate(${Math.max(-50, Math.min(50, cents)) * 1.6}deg)`;
  $('tunerName').textContent = name;
  $('tunerName').style.color = ok ? 'var(--ok)' : '';
  $('tunerCents').textContent = (ok ? 'Afinada' : (cents > 0 ? 'Alta ' : 'Baja ') + Math.abs(Math.round(cents)) + ' cents') + (sub ? ' · ' + sub : '');
  return ok;
}

function tunerTick() {
  const p = audio.readPitch();
  const btns = $('stringPick').querySelectorAll('button');
  if (!p || p.freq === null) { btns.forEach(b => b.classList.remove('on')); return; }
  const nom = getState().nom;
  const inst = instrumentById(getState().instrument);
  if (!isViolin()) {
    const near = Math.round(p.midi);
    const real = near + inst.transpose;
    showTuning(noteLabel({ midi: near }, nom, true), (p.midi - near) * 100, inst.transpose ? 'suena ' + noteLabel({ midi: real }, nom, true) : '');
    return;
  }
  const det = p.midi;
  const near = openStrings().reduce((a, b) => (Math.abs(b.midi - det) < Math.abs(a.midi - det) ? b : a));
  const cents = (det - near.midi) * 100;
  if (Math.abs(cents) > 300) { $('tunerCents').textContent = 'Oigo ' + noteLabel({ midi: Math.round(det) }, nom) + ': toca una cuerda al aire'; return; }
  const ok = showTuning(nom === 'us' ? near.us : near.eu, cents, '');
  if (!ok) $('tunerCents').textContent = (cents > 0 ? 'Alta: afloja ' : 'Baja: tensa ') + Math.abs(Math.round(cents)) + ' cents';
  btns.forEach(b => b.classList.toggle('on', Number(b.dataset.midi) === near.midi && ok));
}

// Notas de afinación habituales: cuerdas al aire (violín) o el Si♭ y La de concierto (viento)
function referenceNotes() {
  if (isViolin()) return openStrings().map(s => ({ midi: s.midi, label: getState().nom === 'us' ? s.us : s.eu }));
  const inst = instrumentById(getState().instrument);
  return [70, 69, 65].map(real => real - inst.transpose).map(midi => ({ midi, label: noteLabel({ midi }, getState().nom, true) }));
}

register('tuner', {
  enter() {
    $('stringPick').innerHTML = referenceNotes().map(r => `<button type="button" data-midi="${r.midi}">${r.label}<small>${noteLabel(spell(r.midi + instrumentById(getState().instrument).transpose, !isViolin()), 'us')}</small></button>`).join('');
    $('tunerHelp').textContent = isViolin() ? `Pulsa una cuerda para oír su nota (La = ${getState().a4} Hz).` : instrumentById(getState().instrument).polyphonic ? `Afinador cromático (La = ${getState().a4} Hz).` : `Notas de afinación de banda (Si♭, La y Fa de concierto, escritas para tu instrumento). La = ${getState().a4} Hz.`;
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
  else { audio.configureMetronome({ bpm: getState().bpm, meter: getState().meter, sound: true }); audio.startMetronome(); }
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

document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', back));
