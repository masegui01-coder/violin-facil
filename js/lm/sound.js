// Sonido de los ejercicios del curso: notas (con volumen por nota, para los matices), palmas y clics, todo
// programado en el reloj de audio y cancelable. Las notas son REALES (la voz y las audiciones no se transportan).
import { ctx, drumHit } from '../audio.js';
import { midiToFreq } from '../music.js';

const PEAK = 0.18;
const ATTACK_S = 0.03;
const RELEASE_S = 0.08;
const LEAD_S = 0.15;
let live = [];

function tone(c, midi, start, seconds, gain = 1, type = 'triangle') {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = midiToFreq(midi);
  const end = start + Math.max(0.1, seconds);
  const peak = PEAK * gain;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + ATTACK_S);
  g.gain.setValueAtTime(peak, Math.max(start + ATTACK_S, end - RELEASE_S));
  g.gain.linearRampToValueAtTime(0, end);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(end + 0.05);
  live.push(osc);
}

// Para todo lo que esté sonando o programado
export function stopSound() {
  live.forEach(o => { try { o.stop(); } catch (e) { /* ya parado */ } });
  live = [];
}

// Reproduce notas ({ midi, start, beats, rest }) a un tempo. opts: gains (volumen 0-1 por nota), clap (palmas en vez
// de notas), accentEvery (pulsos por compás: el primero suena más fuerte). Devuelve { t0, end } en el reloj de audio.
export function playNotes(notes, bpm, { at = null, gains = null, clap = false, accentEvery = 0, legato = 0.9 } = {}) {
  const c = ctx();
  const spb = 60 / bpm;
  const t0 = at ?? c.currentTime + LEAD_S;
  notes.forEach((n, i) => {
    if (n.rest) return;
    const when = t0 + n.start * spb;
    const accent = accentEvery > 0 && Math.abs(n.start % accentEvery) < 1e-6;
    if (clap) drumHit(when, accent, gains ? gains[i] : 1);
    else tone(c, n.midi, when, n.beats * spb * legato, (gains ? gains[i] : 1) * (accent ? 1.35 : 1));
  });
  const last = notes[notes.length - 1];
  return { t0, end: t0 + (last ? (last.start + last.beats) * spb : 0) };
}

// Notas con su instante y su duración en segundos (relativos a «at») y su volumen: matices, calderones, accelerando
export function playEvents(events, { at = null } = {}) {
  const c = ctx();
  const t0 = at ?? c.currentTime + LEAD_S;
  events.forEach(e => tone(c, e.midi, t0 + e.at, e.dur, e.gain ?? 1));
  return { t0, end: t0 + Math.max(0, ...events.map(e => e.at + e.dur)) };
}

// Varias voces a la vez (audiciones)
export function playVoices(voices, bpm) {
  const c = ctx();
  const at = c.currentTime + LEAD_S;
  return voices.map(v => playNotes(v, bpm, { at })).reduce((a, b) => ({ t0: at, end: Math.max(a.end, b.end) }), { t0: at, end: at });
}

// Una nota suelta (referencia de entonación) y un acorde
export function playPitch(midi, seconds = 1) {
  const c = ctx();
  tone(c, midi, c.currentTime + 0.05, seconds);
  return c.currentTime + 0.05 + seconds;
}
export function playChordNow(midis, seconds = 1.2) {
  const c = ctx();
  midis.forEach(m => tone(c, m, c.currentTime + 0.05, seconds, 0.6));
  return c.currentTime + 0.05 + seconds;
}

// Clics de metrónomo (cuenta previa): devuelve cuándo acaba
export function clicks(count, bpm, { at = null, accentEvery = 0, level = 0.7 } = {}) {
  const c = ctx();
  const t0 = at ?? c.currentTime + LEAD_S;
  for (let i = 0; i < count; i++) drumHit(t0 + i * 60 / bpm, accentEvery ? i % accentEvery === 0 : i === 0, level);
  return t0 + count * 60 / bpm;
}

export const now = () => ctx().currentTime;
export const wait = ms => new Promise(r => setTimeout(r, Math.max(0, ms)));
// Espera hasta un instante del reloj de audio
export const until = t => wait((t - ctx().currentTime) * 1000);
