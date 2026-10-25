// Detección de golpes (percusión) y puntuación del ritmo. Sin dependencias del navegador para poder probarlo.

const HOP = 128;              // muestras por bloque de energía (~2,7 ms a 48 kHz)
const AVG_BLOCKS = 40;        // ventana para el nivel de fondo (~100 ms)
const RATIO = 3.2;            // un golpe es una subida brusca de energía sobre el fondo
const MIN_ENERGY = 0.0008;    // por debajo es silencio
const REFRACTORY_S = 0.07;    // dos golpes no pueden estar más cerca de 70 ms
// Cajón: tras cada golpe se mira ~30 ms de sonido. El grave (palma en el centro) tiene casi toda la energía
// por debajo de 250 Hz; el agudo (dedos en el borde) suena con las bordonas, muy por encima.
const TONE_CUTOFF_HZ = 250;
const TONE_BLOCKS = 12;
export const BASS_RATIO = 0.45;

// Recibe trozos de audio con su instante de inicio y devuelve los golpes [{time, strength, low, tone}]
// (los golpes salen ~30 ms después, cuando ya se sabe si fueron graves o agudos)
export function createOnsetDetector(sampleRate) {
  const history = [];
  let lastOnset = -Infinity;
  let rest = new Float32Array(0);
  let restTime = 0;
  const alpha = 1 - Math.exp(-2 * Math.PI * TONE_CUTOFF_HZ / sampleRate);
  let lp = 0;
  let pending = null;

  function feed(samples, startTime) {
    const buf = new Float32Array(rest.length + samples.length);
    buf.set(rest);
    buf.set(samples, rest.length);
    const t0 = rest.length ? restTime : startTime;
    const hits = [];
    let i = 0;
    for (; i + HOP <= buf.length; i += HOP) {
      let e = 0, eLow = 0;
      for (let j = i; j < i + HOP; j++) {
        e += buf[j] * buf[j];
        lp += alpha * (buf[j] - lp);
        eLow += lp * lp;
      }
      e /= HOP;
      eLow /= HOP;
      if (pending) {
        pending.total += e; pending.low += eLow;
        if (++pending.blocks >= TONE_BLOCKS) {
          const low = pending.total ? pending.low / pending.total : 0;
          hits.push({ ...pending.hit, low, tone: low >= BASS_RATIO ? 'bass' : 'slap' });
          pending = null;
        }
      }
      const background = history.length ? history.reduce((s, x) => s + x, 0) / history.length : 0;
      const time = t0 + i / sampleRate;
      if (e > MIN_ENERGY && e > background * RATIO && time - lastOnset > REFRACTORY_S) {
        if (pending) hits.push({ ...pending.hit, low: pending.total ? pending.low / pending.total : 0, tone: null });
        pending = { hit: { time, strength: Math.sqrt(e) }, total: e, low: eLow, blocks: 1 };
        lastOnset = time;
      }
      history.push(e);
      if (history.length > AVG_BLOCKS) history.shift();
    }
    rest = buf.slice(i);
    restTime = t0 + i / sampleRate;
    return hits;
  }

  return { feed };
}

export const PERFECT_MS = 35;
export const GOOD_MS = 75;
export const WINDOW_MS = 160;

// Empareja cada golpe esperado (segundos) con el golpe tocado más cercano dentro de la ventana
export function scoreRhythm(expected, onsets, latency = 0) {
  const played = onsets.map(o => ({ ...o, time: o.time - latency, used: false }));
  const results = expected.map(t => {
    let best = null;
    played.forEach(p => {
      if (p.used) return;
      const d = (p.time - t) * 1000;
      if (Math.abs(d) <= WINDOW_MS && (!best || Math.abs(d) < Math.abs(best.d))) best = { p, d };
    });
    if (!best) return { status: 'miss', offset: null, strength: 0, tone: null };
    best.p.used = true;
    const a = Math.abs(best.d);
    return { status: a <= PERFECT_MS ? 'perfect' : a <= GOOD_MS ? 'good' : best.d < 0 ? 'early' : 'late', offset: best.d, strength: best.p.strength, tone: best.p.tone || null };
  });
  const hit = results.filter(r => r.offset !== null);
  const meanOffset = hit.length ? hit.reduce((s, r) => s + r.offset, 0) / hit.length : 0;
  const spread = hit.length > 1 ? Math.sqrt(hit.reduce((s, r) => s + (r.offset - meanOffset) ** 2, 0) / (hit.length - 1)) : 0;
  const points = results.reduce((s, r) => s + (r.status === 'perfect' ? 1 : r.status === 'good' ? 0.8 : r.status === 'miss' ? 0 : 0.4), 0);
  return {
    results, meanOffset, spread, extra: played.filter(p => !p.used).length,
    accuracy: expected.length ? points / expected.length : 0,
  };
}

// ¿Se notan los acentos? Media de fuerza de los golpes acentuados frente al resto
export function accentContrast(results, accents) {
  const strong = results.filter((r, i) => accents[i] && r.strength);
  const weak = results.filter((r, i) => !accents[i] && r.strength);
  if (!strong.length || !weak.length) return null;
  const avg = xs => xs.reduce((s, r) => s + r.strength, 0) / xs.length;
  return avg(strong) / avg(weak);
}

export function rhythmTip({ meanOffset, spread, results }) {
  const missed = results.filter(r => r.status === 'miss').length;
  if (missed > results.length / 3) return 'Se me escapan muchos golpes: toca más fuerte o acerca el móvil, y calibra el micrófono en Estudio.';
  if (meanOffset < -25) return `Tiendes a adelantarte unos ${Math.round(-meanOffset)} ms: escucha el pulso y espera a que llegue.`;
  if (meanOffset > 25) return `Tiendes a retrasarte unos ${Math.round(meanOffset)} ms: anticipa un poco el movimiento de la baqueta.`;
  if (spread > 30) return 'El pulso medio es bueno pero irregular: practica despacio con el metrónomo hasta que todos los golpes caigan igual.';
  return '¡Pulso muy firme! Sube un poco el tempo.';
}
