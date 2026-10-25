// Acordes por el micrófono: el espectro se resume en un «cromagrama» (cuánta energía hay de cada una de las 12 notas)
// y se compara con la plantilla del acorde que toca. Sabemos qué acorde esperamos, así que basta con verificarlo.

const A4_HZ = 440;
const MAX_CENTS_OFF = 40;     // los picos que caen entre dos notas no cuentan
const PEAK_FLOOR_DB = -85;    // por debajo es ruido
const PEAK_RANGE_DB = 45;     // solo cuentan los picos a menos de 45 dB del más fuerte

const pcOfFreq = f => {
  const exact = 12 * Math.log2(f / A4_HZ) + 69;
  const midi = Math.round(exact);
  return { pc: ((midi % 12) + 12) % 12, cents: (exact - midi) * 100 };
};

// spectrumDb: dB por banda (como AnalyserNode.getFloatFrequencyData). Devuelve 12 valores que suman 1 (o ceros si hay silencio).
export function chromaFromSpectrum(spectrumDb, sampleRate, fftSize, minHz = 70, maxHz = 2000) {
  const binHz = sampleRate / fftSize;
  const lo = Math.max(2, Math.floor(minHz / binHz));
  const hi = Math.min(spectrumDb.length - 2, Math.ceil(maxHz / binHz));
  let top = -Infinity;
  for (let i = lo; i <= hi; i++) if (spectrumDb[i] > top) top = spectrumDb[i];
  const chroma = new Array(12).fill(0);
  if (top < PEAK_FLOOR_DB) return chroma;
  const floor = Math.max(PEAK_FLOOR_DB, top - PEAK_RANGE_DB);
  for (let i = lo; i <= hi; i++) {
    const v = spectrumDb[i];
    if (v < floor || v < spectrumDb[i - 1] || v < spectrumDb[i + 1]) continue;
    // interpolación parabólica para afinar la frecuencia del pico
    const a = spectrumDb[i - 1], c = spectrumDb[i + 1];
    const delta = (a - c) / (2 * (a - 2 * v + c) || 1);
    const freq = (i + delta) * binHz;
    const { pc, cents } = pcOfFreq(freq);
    if (Math.abs(cents) > MAX_CENTS_OFF) continue;
    // energía relativa al suelo, con menos peso para los armónicos agudos
    chroma[pc] += (v - floor) / Math.sqrt(freq / minHz);
  }
  const total = chroma.reduce((s, x) => s + x, 0);
  return total ? chroma.map(x => x / total) : chroma;
}

export function templateOf(pcs) {
  const t = new Array(12).fill(0);
  pcs.forEach(pc => { t[((pc % 12) + 12) % 12] = 1; });
  return t;
}

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < 12; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// Parte de la energía que cae en las notas del acorde, y cuántas notas del acorde se oyen
export function chordCoverage(chroma, pcs) {
  const set = new Set(pcs.map(pc => ((pc % 12) + 12) % 12));
  const inside = chroma.reduce((s, x, pc) => s + (set.has(pc) ? x : 0), 0);
  const heard = [...set].filter(pc => chroma[pc] >= 0.06).length;
  return { inside, heard, of: set.size };
}

const MAJOR = [0, 4, 7], MINOR = [0, 3, 7];
const RIVALS = Array.from({ length: 12 }, (_, r) => [MAJOR.map(i => r + i), MINOR.map(i => r + i)]).flat();

// Los armónicos de una cuerda real (5.º, 7.º, 9.º…) reparten energía en otras notas: se exige parecido global y mayoría dentro
export const ACCEPT_INSIDE = 0.55;
export const ACCEPT_SCORE = 0.78;

// ¿Suena el acorde esperado? Casi toda la energía en sus notas, casi todas sus notas presentes
// y ningún otro acorde mayor o menor encaja claramente mejor.
export function matchChord(chroma, pcs) {
  if (!chroma.some(x => x > 0)) return { ok: false, score: 0, inside: 0 };
  const { inside, heard, of } = chordCoverage(chroma, pcs);
  const score = cosine(chroma, templateOf(pcs));
  const key = t => t.map(x => ((x % 12) + 12) % 12).sort((a, b) => a - b).join();
  const mine = key(pcs);
  const rival = Math.max(0, ...RIVALS.filter(r => key(r) !== mine).map(r => cosine(chroma, templateOf(r))));
  const needHeard = of <= 2 ? of : of - 1;
  return { ok: score >= ACCEPT_SCORE && inside >= ACCEPT_INSIDE && heard >= needHeard && score >= rival - 0.03, score, inside, heard };
}
