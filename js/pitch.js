// Detección de tono con el algoritmo YIN (de Cheveigné y Kawahara, 2002).

export const MIN_FREQ = 180;
export const MAX_FREQ = 1500;
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

// Devuelve la frecuencia fundamental en Hz o null si no hay un tono claro
export function detectPitch(buf, sampleRate) {
  const tauMin = Math.floor(sampleRate / MAX_FREQ);
  const tauMax = Math.min(Math.floor(sampleRate / MIN_FREQ), Math.floor(buf.length / 2));
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
