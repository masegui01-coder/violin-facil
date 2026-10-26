// Audio del navegador: micrófono, notas de referencia y metrónomo.
import { detectPitch, rms } from './pitch.js';
import { midiToFreq, freqToMidi } from './music.js';
import { createOnsetDetector } from './onsets.js';
import { chromaFromSpectrum } from './chroma.js';

const MIN_RMS = 0.01;
const MEDIAN_FRAMES = 3;
const CLICK_MASK_BEFORE_S = 0.02;
const CLICK_MASK_AFTER_S = 0.13;
const LOOKAHEAD_S = 0.12;
const SCHED_MS = 25;
const CHORD_FFT = 16384;       // resolución fina para separar notas graves de guitarra y piano
const CHORD_SMOOTHING = 0.5;

const state = { ctx: null, analyser: null, buf: null, muteUntil: 0, recent: [], transpose: 0, minHz: 180, maxHz: 1600 };

// Instrumento activo: registro del detector y transposición (las notas que entran y salen son ESCRITAS)
export function setInstrument(inst) {
  state.transpose = inst.transpose;
  state.minHz = inst.minHz;
  state.maxHz = inst.maxHz;
}

export function ctx() {
  if (!state.ctx) state.ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (state.ctx.state === 'suspended') state.ctx.resume();
  return state.ctx;
}

export function micReady() { return !!state.analyser; }
export function micStream() { return state.stream || null; }

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!state.ctx) return;
    if (document.visibilityState === 'hidden') state.ctx.suspend().catch(() => {});
    else state.ctx.resume().catch(() => {});
  });
}

export async function startMic() {
  if (state.analyser) return;
  const c = ctx();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Este navegador no permite usar el micrófono. Prueba con Chrome o Safari actualizados.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const analyser = c.createAnalyser();
  analyser.fftSize = 2048;
  const source = c.createMediaStreamSource(stream);
  source.connect(analyser);
  const chordAnalyser = c.createAnalyser();
  chordAnalyser.fftSize = CHORD_FFT;
  chordAnalyser.smoothingTimeConstant = CHORD_SMOOTHING;
  source.connect(chordAnalyser);
  state.chordAnalyser = chordAnalyser;
  state.spectrum = new Float32Array(chordAnalyser.frequencyBinCount);
  state.stream = stream;
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
  const f = level < MIN_RMS ? null : detectPitch(state.buf, state.ctx.sampleRate, state.minHz, state.maxHz);
  if (!f) { state.recent = []; return { freq: null, midi: null, level }; }
  state.recent = [...state.recent, f].slice(-MEDIAN_FRAMES);
  const sorted = [...state.recent].sort((x, y) => x - y);
  const freq = sorted[Math.floor(sorted.length / 2)];
  return { freq, midi: freqToMidi(freq) - state.transpose, level };
}

// Cromagrama actual (12 valores) para reconocer acordes; null si la app está sonando
export function readChroma() {
  if (!state.chordAnalyser || performance.now() < state.muteUntil) return null;
  state.analyser.getFloatTimeDomainData(state.buf);
  const level = rms(state.buf);
  if (level < MIN_RMS) return { chroma: null, level };
  state.chordAnalyser.getFloatFrequencyData(state.spectrum);
  return { chroma: chromaFromSpectrum(state.spectrum, state.ctx.sampleRate, CHORD_FFT, Math.max(60, state.minHz * 0.9), 2000), level };
}

function voice(c, midi, start, seconds, peak = 0.16) {
  const osc = c.createOscillator(), filt = c.createBiquadFilter(), gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = midiToFreq(midi + state.transpose);
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
// Retraso de lo que suena por el altavoz (en Bluetooth puede pasar de 0,2 s): el cursor lo espera para ir con lo que oyes
export function outputLatency() {
  const c = ctx();
  return c.outputLatency || c.baseLatency || 0;
}

export function playScore(notes, bpm, onNote, { at = null, silent = false } = {}) {
  const c = ctx();
  const spb = 60 / bpm;
  const t0 = at ?? c.currentTime + 0.15;
  // las notas ligadas suenan como una sola, sin volver a atacar
  const sounding = [];
  notes.forEach((n, i) => {
    if (n.rest) return;
    const prev = notes[i - 1];
    if (prev && prev.tie && !prev.rest && prev.midi === n.midi && sounding.length) { sounding[sounding.length - 1].beats += n.beats; return; }
    sounding.push({ midi: n.midi, start: n.start, beats: n.beats });
  });
  const oscs = silent ? [] : sounding.map(n => voice(c, n.midi, t0 + n.start * spb, Math.max(0.12, n.beats * spb * 0.92)));
  const total = notes.length ? (notes[notes.length - 1].start + notes[notes.length - 1].beats) * spb : 0;
  state.muteUntil = performance.now() + (total + 0.5) * 1000;
  const timer = setInterval(() => {
    const beat = (c.currentTime - outputLatency() - t0) / spb;
    onNote(beat, beat * spb >= total);
    if (beat * spb >= total) clearInterval(timer);
  }, SCHED_MS);
  return () => {
    clearInterval(timer);
    oscs.forEach(o => { try { o.stop(); } catch (e) { /* ya parado */ } });
    state.muteUntil = 0;
  };
}

// Rasgueo de un acorde (notas REALES, de grave a aguda) con sonido de cuerda pulsada. Tapa el micrófono mientras suena.
const STRUM_GAP_S = 0.018;
const STRUM_PEAK = 0.12;
export function strum(soundingMidis, at = null, seconds = 1.6) {
  const c = ctx();
  const t0 = at ?? c.currentTime + 0.05;
  [...soundingMidis].sort((a, b) => a - b).forEach((m, i) => {
    const t = t0 + i * STRUM_GAP_S;
    const osc = c.createOscillator(), filt = c.createBiquadFilter(), gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = midiToFreq(m);
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(3200, t);
    filt.frequency.exponentialRampToValueAtTime(700, t + seconds);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(STRUM_PEAK / Math.sqrt(soundingMidis.length), t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + seconds);
    osc.connect(filt).connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.05);
  });
  state.muteUntil = Math.max(state.muteUntil, performance.now() + (t0 - c.currentTime + seconds * 0.6) * 1000);
}

// Acorde de fondo con notas REALES (sin transponer). Con «seconds» suena ese tiempo y tapa el micrófono.
export function playChord(soundingMidis, seconds = null) {
  const c = ctx();
  const t = c.currentTime;
  const peak = 0.22 / soundingMidis.length;
  const nodes = soundingMidis.map(m => {
    const osc = c.createOscillator(), gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = midiToFreq(m);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    return { osc, gain };
  });
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    const n = c.currentTime;
    nodes.forEach(({ osc, gain }) => {
      gain.gain.cancelScheduledValues(n);
      gain.gain.setValueAtTime(gain.gain.value, n);
      gain.gain.linearRampToValueAtTime(0, n + 0.12);
      osc.stop(n + 0.2);
    });
  };
  if (seconds) {
    state.muteUntil = performance.now() + seconds * 1000 + 300;
    setTimeout(stop, seconds * 1000);
  }
  return stop;
}

// ---------- Percusión: golpes y sonido de caja ----------
const CAPTURE_BUFFER = 1024;
let capture = null;

// Escucha golpes en el micrófono y llama a onHits([{time, strength}]) con tiempos del reloj de audio
export function startOnsetCapture(onHits) {
  if (!state.stream) return false;
  stopOnsetCapture();
  const c = ctx();
  const src = c.createMediaStreamSource(state.stream);
  const proc = c.createScriptProcessor(CAPTURE_BUFFER, 1, 1);
  const sink = c.createGain();
  sink.gain.value = 0;
  const detector = createOnsetDetector(c.sampleRate);
  proc.onaudioprocess = e => {
    const data = e.inputBuffer.getChannelData(0);
    const hits = detector.feed(new Float32Array(data), c.currentTime - data.length / c.sampleRate);
    if (hits.length) onHits(hits);
  };
  src.connect(proc);
  proc.connect(sink).connect(c.destination);
  capture = { src, proc, sink };
  return true;
}

export function stopOnsetCapture() {
  if (!capture) return;
  capture.proc.onaudioprocess = null;
  capture.src.disconnect();
  capture.proc.disconnect();
  capture.sink.disconnect();
  capture = null;
}

let noise = null;
// Golpe de caja sintético (ruido filtrado) en un instante del reloj de audio
// Cajón: el grave es un golpe sordo (seno de ~85 Hz que cae); el agudo, el chasquido de las bordonas
export function cajonHit(time, tone, accent = false) {
  if (tone !== 'bass') { drumHit(time, accent, 0.8); return; }
  const c = ctx();
  const osc = c.createOscillator(), gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(70, time + 0.15);
  gain.gain.setValueAtTime(accent ? 0.9 : 0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
  osc.connect(gain).connect(c.destination);
  osc.start(time);
  osc.stop(time + 0.3);
}

export function drumHit(time, accent = false, level = 1) {
  const c = ctx();
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource(), filt = c.createBiquadFilter(), gain = c.createGain();
  src.buffer = noise;
  filt.type = 'bandpass';
  filt.frequency.value = 1800;
  filt.Q.value = 0.8;
  gain.gain.setValueAtTime((accent ? 0.9 : 0.5) * level, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  src.connect(filt).connect(gain).connect(c.destination);
  src.start(time);
  src.stop(time + 0.15);
}

// ¿Este instante coincide con un clic del metrónomo? (para no confundirlo con un golpe)
export function nearClick(time, latency = 0, windowS = 0.04) {
  return metro.clicks.some(k => Math.abs(time - latency - k) < windowS);
}

// ---------- Banda virtual: las otras voces de la obra ----------
const ACCOMP_LOOKAHEAD_S = 1.5;
const ACCOMP_TICK_MS = 200;
const ACCOMP_GAIN = 0.05;

// parts: [{notes, transpose (escrita→real), percussion}]. Las notas se programan poco a poco para no saturar el móvil.
export function playAccompaniment(parts, t0, spb) {
  const c = ctx();
  const queue = parts.flatMap(p => p.notes.filter(n => !n.rest).map(n => ({ time: t0 + n.start * spb, dur: n.beats * spb, midi: n.midi + (p.transpose || 0), perc: p.percussion })))
    .sort((a, b) => a.time - b.time);
  let i = 0;
  const live = [];
  const pump = () => {
    const until = c.currentTime + ACCOMP_LOOKAHEAD_S;
    for (; i < queue.length && queue[i].time < until; i++) {
      const n = queue[i];
      if (n.time < c.currentTime - 0.05) continue;
      if (n.perc) { drumHit(n.time, false, 0.35); continue; }
      const osc = c.createOscillator(), gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = midiToFreq(n.midi);
      gain.gain.setValueAtTime(0, n.time);
      gain.gain.linearRampToValueAtTime(ACCOMP_GAIN, n.time + 0.03);
      gain.gain.setValueAtTime(ACCOMP_GAIN, Math.max(n.time + 0.04, n.time + n.dur * 0.9 - 0.05));
      gain.gain.linearRampToValueAtTime(0, n.time + n.dur * 0.95);
      osc.connect(gain).connect(c.destination);
      osc.start(n.time);
      osc.stop(n.time + n.dur);
      live.push(osc);
    }
  };
  pump();
  const timer = setInterval(pump, ACCOMP_TICK_MS);
  return () => {
    clearInterval(timer);
    live.forEach(o => { try { o.stop(); } catch (e) { /* ya parado */ } });
  };
}

// ---------- Grabación de la toma ----------
let recorder = null;
let chunks = [];

export function startRecording() {
  stopRecording();
  if (!state.stream || typeof MediaRecorder === 'undefined') return;
  try {
    chunks = [];
    recorder = new MediaRecorder(state.stream);
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.start();
  } catch (e) { recorder = null; }
}

// Para la grabación y devuelve una promesa con {url, blob} del audio (o null si no había)
export function stopRecording() {
  if (!recorder || recorder.state === 'inactive') { recorder = null; return Promise.resolve(null); }
  const rec = recorder;
  recorder = null;
  return new Promise(resolve => {
    rec.onstop = () => {
      if (!chunks.length) { resolve(null); return; }
      const blob = new Blob(chunks, { type: rec.mimeType });
      resolve({ url: URL.createObjectURL(blob), blob });
    };
    rec.stop();
  });
}

// ---------- Metrónomo ----------
const CLICK_GAIN = { accent: 0.32, beat: 0.2 };
const metro = { on: false, bpm: 80, meter: 4, sound: true, nextTime: 0, beat: 0, timer: 0, queue: [], clicks: [], listeners: new Set(), played: -1, lastBeatTime: 0 };

// Clic suave; sin sonido no se programa nada (y el micrófono no necesita taparse)
function scheduleClick(time, accent, sound = true) {
  if (!sound) return;
  const c = state.ctx;
  const osc = c.createOscillator(), gain = c.createGain();
  osc.frequency.value = accent ? 1600 : 1000;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accent ? CLICK_GAIN.accent : CLICK_GAIN.beat, time + 0.002);
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
    scheduleClick(metro.nextTime, beat === 0 && metro.meter > 1, metro.sound);
    metro.queue.push({ time: metro.nextTime, beat });
    metro.nextTime += 60 / metro.bpm;
    metro.beat = beat + 1;
  }
  let current = null;
  while (metro.queue.length && metro.queue[0].time <= c.currentTime) current = metro.queue.shift();
  if (current) {
    metro.played++;
    metro.lastBeatTime = current.time;
    metro.listeners.forEach(fn => fn(current.beat));
  }
}

export function metronome() {
  return { on: metro.on, bpm: metro.bpm, meter: metro.meter, sound: metro.sound };
}

export function configureMetronome({ bpm, meter, sound }) {
  if (bpm) metro.bpm = bpm;
  if (meter) { metro.meter = meter; metro.beat = 0; }
  if (sound !== undefined) metro.sound = sound;
}

// Pulsos transcurridos (con decimales) desde que arrancó el metrónomo; null antes del primero
export function metronomeBeat() {
  if (!metro.on || metro.played < 0) return null;
  return metro.played + (state.ctx.currentTime - metro.lastBeatTime) * metro.bpm / 60;
}

export function startMetronome(startTime) {
  if (metro.on) return;
  const c = ctx();
  metro.on = true;
  metro.beat = 0;
  metro.queue = [];
  metro.played = -1;
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
export function countIn(beats, bpm, sound = true) {
  const c = ctx();
  const start = c.currentTime + 0.15;
  for (let i = 0; i < beats; i++) scheduleClick(start + i * 60 / bpm, i === 0, sound);
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
