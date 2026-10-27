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

// ---------- Láminas (xilófono y metalófono) ----------
// Los parciales de una lámina no son armónicos (2,76× y 5,4× en las de metal, 3× en las de madera), así que buscar el
// periodo (YIN) se engaña con un «tono virtual» más grave. Aquí se mira el espectro: la nota de la lámina es el pico
// fuerte más grave. Devuelve Hz o null si no hay un pico claro sobre el ruido.
const BAR_FFT = 8192;
const BAR_PEAK_DB = 20;     // un parcial más grave cuenta si está a menos de esto del pico más fuerte
const BAR_TONAL_DB = 18;    // el pico tiene que sobresalir esto sobre la mediana del espectro
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}
export function barPitch(buf, sampleRate, minHz = MIN_FREQ, maxHz = MAX_FREQ) {
  const re = new Float64Array(BAR_FFT), im = new Float64Array(BAR_FFT);
  const n = Math.min(buf.length, BAR_FFT);
  for (let i = 0; i < n; i++) re[i] = buf[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
  fft(re, im);
  const binHz = sampleRate / BAR_FFT;
  const lo = Math.max(2, Math.floor(minHz / binHz)), hi = Math.min(BAR_FFT / 2 - 2, Math.ceil(maxHz / binHz));
  const db = new Float64Array(hi + 2);
  for (let k = lo - 1; k <= hi + 1; k++) db[k] = 10 * Math.log10(re[k] * re[k] + im[k] * im[k] + 1e-20);
  let top = lo;
  for (let k = lo; k <= hi; k++) if (db[k] > db[top]) top = k;
  const sorted = Array.from(db.subarray(lo, hi + 1)).sort((a, b) => a - b);
  if (db[top] - sorted[Math.floor(sorted.length / 2)] < BAR_TONAL_DB) return null;
  let pick = top;
  for (let k = lo; k < top; k++) {
    if (db[k] >= db[top] - BAR_PEAK_DB && db[k] > db[k - 1] && db[k] >= db[k + 1]) { pick = k; break; }
  }
  const [a, b, c] = [db[pick - 1], db[pick], db[pick + 1]];
  const denom = a - 2 * b + c;
  const freq = (pick + (denom ? (a - c) / (2 * denom) : 0)) * binHz;
  return refinePitch(buf, sampleRate, freq);
}
