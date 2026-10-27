// Detección de tono con el algoritmo YIN (de Cheveigné y Kawahara, 2002).

export const MIN_FREQ = 180;
export const MAX_FREQ = 1600;
const YIN_THRESHOLD = 0.15;

export function rms(buf) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}

function differenceFunction(buf, tauMax) {
  const w = buf.length - tauMax;
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let i = 0; i < w; i++) { const diff = buf[i] - buf[i + tau]; sum += diff * diff; }
    d[tau] = sum;
  }
  return d;
}

function cumulativeMeanNormalize(d) {
  let running = 0;
  d[0] = 1;
  for (let tau = 1; tau < d.length; tau++) {
    running += d[tau];
    d[tau] = running ? d[tau] * tau / running : 1;
  }
  return d;
}

// Devuelve la frecuencia fundamental en Hz o null si no hay un tono claro. El registro depende del instrumento.
export function detectPitch(buf, sampleRate, minHz = MIN_FREQ, maxHz = MAX_FREQ) {
  const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
  const tauMax = Math.min(Math.floor(sampleRate / minHz), Math.floor(buf.length / 2));
  const d = cumulativeMeanNormalize(differenceFunction(buf, tauMax));
  let tau = tauMin;
  while (tau <= tauMax && d[tau] >= YIN_THRESHOLD) tau++;
  if (tau > tauMax) return null;
  while (tau + 1 <= tauMax && d[tau + 1] < d[tau]) tau++;
  // interpolación parabólica alrededor del mínimo
  const a = d[tau - 1], b = d[tau], c = tau + 1 <= tauMax ? d[tau + 1] : b;
  const denom = a - 2 * b + c;
  return sampleRate / (denom ? tau + (a - c) / (2 * denom) : tau);
}

// Afina la frecuencia buscando el pico del espectro (ventana de Hann) a ±1 semitono de la estimación de YIN.
// En las láminas de metal los parciales no son armónicos (2,76×, 5,4×) y desplazan a YIN hasta medio semitono.
const REFINE_CENTS = 100;
const REFINE_STEP = 4;
function magnitudeAt(buf, sampleRate, freq) {
  const w = 2 * Math.PI * freq / sampleRate, n = buf.length;
  let re = 0, im = 0;
  for (let i = 0; i < n; i++) {
    const v = buf[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
    re += v * Math.cos(w * i);
    im -= v * Math.sin(w * i);
  }
  return Math.hypot(re, im);
}
export function refinePitch(buf, sampleRate, freq) {
  const cents = [], mags = [];
  for (let c = -REFINE_CENTS; c <= REFINE_CENTS; c += REFINE_STEP) { cents.push(c); mags.push(magnitudeAt(buf, sampleRate, freq * 2 ** (c / 1200))); }
  const k = mags.indexOf(Math.max(...mags));
  if (k === 0 || k === mags.length - 1) return freq; // el pico no está cerca: se queda la de YIN
  const [a, b, c] = [mags[k - 1], mags[k], mags[k + 1]];
  const denom = a - 2 * b + c;
  const best = cents[k] + (denom ? REFINE_STEP * (a - c) / (2 * denom) : 0);
  return freq * 2 ** (best / 1200);
}
