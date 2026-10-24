// Convierte las lecturas del micrófono en notas sueltas: una nota nueva cuando el tono cambia
// o cuando la misma nota se vuelve a atacar (silencio breve o bajón de volumen al cambiar el arco).
import { freqToMidi } from './music.js';

const STABLE_MS = 150;
const SILENCE_MS = 60;
const DIP = 0.55;

export function createTracker() {
  let candidate = null;
  let since = 0;
  let last = null;
  let articulated = true;
  let peak = 0;
  let silent = 0;

  // reading: {freq, level} o null/{freq:null}. Devuelve la nota MIDI nueva o null.
  function feed(reading, dt) {
    if (!reading || reading.freq === null) {
      silent += dt;
      if (silent >= SILENCE_MS) articulated = true;
      candidate = null;
      return null;
    }
    silent = 0;
    const midi = Math.round(freqToMidi(reading.freq));
    // bajón de volumen sobre la misma nota: cambio de arco o final de la nota. Hace falta volver a sonar estable.
    if (last !== null && midi === last && reading.level < peak * DIP) {
      articulated = true;
      candidate = null;
      return null;
    }
    peak = Math.max(peak * 0.995, reading.level);
    if (midi !== candidate) { candidate = midi; since = 0; return null; }
    since += dt;
    if (since < STABLE_MS) return null;
    if (midi === last && !articulated) return null;
    last = midi;
    articulated = false;
    peak = reading.level;
    return midi;
  }

  return { feed };
}
