// Audio del navegador: micrófono, notas de referencia y metrónomo.
import { detectPitch, rms } from './pitch.js';
import { midiToFreq } from './music.js';

const MIN_RMS = 0.01;
const MEDIAN_FRAMES = 3;
const CLICK_MASK_BEFORE_S = 0.02;
const CLICK_MASK_AFTER_S = 0.13;
const LOOKAHEAD_S = 0.12;
const SCHED_MS = 25;

const state = { ctx: null, analyser: null, buf: null, muteUntil: 0, recent: [] };

export function ctx() {
  if (!state.ctx) state.ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (state.ctx.state === 'suspended') state.ctx.resume();
  return state.ctx;
}

export function micReady() { return !!state.analyser; }

export async function startMic() {
  if (state.analyser) return;
  const c = ctx();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Este navegador no permite usar el micrófono. Prueba con Chrome o Safari actualizados.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const analyser = c.createAnalyser();
  analyser.fftSize = 2048;
  c.createMediaStreamSource(stream).connect(analyser);
  state.analyser = analyser;
  state.buf = new Float32Array(analyser.fftSize);
}

export function micErrorText(err) {
  if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
    return 'Permiso denegado. Actívalo en los ajustes del navegador (el candado junto a la dirección) y vuelve a intentarlo.';
  }
  if (err && err.name === 'NotFoundError') return 'No encuentro ningún micrófono en este dispositivo.';
  return (err && err.message) || 'No se pudo abrir el micrófono.';
}

// Lectura del tono actual: null si la app está sonando; {freq:null} si hay silencio
export function readPitch() {
  if (!state.analyser) return null;
  if (performance.now() < state.muteUntil) { state.recent = []; return null; }
  state.analyser.getFloatTimeDomainData(state.buf);
  const level = rms(state.buf);
  const f = level < MIN_RMS ? null : detectPitch(state.buf, state.ctx.sampleRate);
  if (!f) { state.recent = []; return { freq: null, level }; }
  state.recent = [...state.recent, f].slice(-MEDIAN_FRAMES);
  const sorted = [...state.recent].sort((x, y) => x - y);
  return { freq: sorted[Math.floor(sorted.length / 2)], level };
}

function voice(c, midi, start, seconds, peak = 0.16) {
  const osc = c.createOscillator(), filt = c.createBiquadFilter(), gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = midiToFreq(midi);
  filt.type = 'lowpass';
  filt.frequency.value = 2400;
  const end = start + seconds;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.04);
  gain.gain.setValueAtTime(peak, Math.max(start + 0.05, end - 0.08));
  gain.gain.linearRampToValueAtTime(0, end);
  osc.connect(filt).connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(end + 0.05);
  return osc;
}

export function playTone(midi, seconds = 1) {
  const c = ctx();
  voice(c, midi, c.currentTime, seconds);
  state.muteUntil = performance.now() + seconds * 1000 + 250;
}

// Reproduce una partitura (demostración). Devuelve una función para pararla.
export function playScore(notes, bpm, onNote) {
  const c = ctx();
  const spb = 60 / bpm;
  const t0 = c.currentTime + 0.15;
  const oscs = notes.filter(n => !n.rest).map(n => voice(c, n.midi, t0 + n.start * spb, Math.max(0.12, n.beats * spb * 0.92)));
  const total = notes.length ? (notes[notes.length - 1].start + notes[notes.length - 1].beats) * spb : 0;
  state.muteUntil = performance.now() + (total + 0.5) * 1000;
  const timer = setInterval(() => {
    const beat = (c.currentTime - t0) / spb;
    onNote(beat, beat * spb >= total);
    if (beat * spb >= total) clearInterval(timer);
  }, SCHED_MS);
  return () => {
    clearInterval(timer);
    oscs.forEach(o => { try { o.stop(); } catch (e) { /* ya parado */ } });
    state.muteUntil = 0;
  };
}

// ---------- Metrónomo ----------
const metro = { on: false, bpm: 80, meter: 4, nextTime: 0, beat: 0, timer: 0, queue: [], clicks: [], listeners: new Set() };

function scheduleClick(time, accent) {
  const c = state.ctx;
  const osc = c.createOscillator(), gain = c.createGain();
  osc.frequency.value = accent ? 1600 : 1000;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.6 : 0.4, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  osc.connect(gain).connect(c.destination);
  osc.start(time);
  osc.stop(time + 0.06);
  metro.clicks = [...metro.clicks.filter(t => t > c.currentTime - 1), time];
}

function scheduler() {
  const c = state.ctx;
  while (metro.nextTime < c.currentTime + LOOKAHEAD_S) {
    const beat = metro.beat % metro.meter;
    scheduleClick(metro.nextTime, beat === 0 && metro.meter > 1);
    metro.queue.push({ time: metro.nextTime, beat });
    metro.nextTime += 60 / metro.bpm;
    metro.beat = beat + 1;
  }
  let current = null;
  while (metro.queue.length && metro.queue[0].time <= c.currentTime) current = metro.queue.shift();
  if (current) metro.listeners.forEach(fn => fn(current.beat));
}

export function metronome() {
  return { on: metro.on, bpm: metro.bpm, meter: metro.meter };
}

export function configureMetronome({ bpm, meter }) {
  if (bpm) metro.bpm = bpm;
  if (meter) { metro.meter = meter; metro.beat = 0; }
}

export function startMetronome(startTime) {
  if (metro.on) return;
  const c = ctx();
  metro.on = true;
  metro.beat = 0;
  metro.queue = [];
  metro.nextTime = startTime ?? c.currentTime + 0.08;
  metro.timer = setInterval(scheduler, SCHED_MS);
  scheduler();
}

export function stopMetronome() {
  if (!metro.on) return;
  metro.on = false;
  clearInterval(metro.timer);
  metro.queue = [];
}

export function onBeat(fn) {
  metro.listeners.add(fn);
  return () => metro.listeners.delete(fn);
}

// Clics sueltos (cuenta previa). Devuelve el instante de audio en que acaba la cuenta.
export function countIn(beats, bpm) {
  const c = ctx();
  const start = c.currentTime + 0.15;
  for (let i = 0; i < beats; i++) scheduleClick(start + i * 60 / bpm, i === 0);
  return start + beats * 60 / bpm;
}

export function audioTime() { return ctx().currentTime; }

// El micrófono oye los clics: durante cada clic (más la latencia de salida) no se analiza el tono
export function clickMasked() {
  if (!state.ctx || !metro.clicks.length) return false;
  const c = state.ctx;
  const t = c.currentTime - (c.outputLatency || 0) - (c.baseLatency || 0);
  return metro.clicks.some(k => t - k > -CLICK_MASK_BEFORE_S && t - k < CLICK_MASK_AFTER_S);
}
