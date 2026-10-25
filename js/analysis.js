// Análisis de una nota tenida: afinación media, estabilidad, vibrato y relación entre volumen y afinación.

export function mean(xs) {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

export function std(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1));
}

// Pendiente de la recta de regresión y = a + b·x
export function slope(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) * (x - mx); });
  return den ? num / den : 0;
}

// Media móvil centrada (para separar la deriva lenta del vibrato)
function smooth(xs, half) {
  return xs.map((_, i) => mean(xs.slice(Math.max(0, i - half), i + half + 1)));
}

// Vibrato a partir de cents muestreados cada dtMs: frecuencia (Hz) y amplitud (cents de pico a pico)
export function vibrato(cents, dtMs) {
  if (cents.length < 20) return null;
  const trend = smooth(cents, Math.round(250 / dtMs));
  const osc = cents.map((c, i) => c - trend[i]);
  let crossings = 0;
  for (let i = 1; i < osc.length; i++) if ((osc[i - 1] < 0) !== (osc[i] < 0)) crossings++;
  const seconds = cents.length * dtMs / 1000;
  const rate = crossings / 2 / seconds;
  const width = 2 * Math.SQRT2 * std(osc);
  // vibrato musical: 4–8 Hz y al menos 10 cents de pico a pico
  if (rate < 3.5 || rate > 9 || width < 10) return null;
  return { rate, width };
}

// Resumen de una toma: frames = [{cents, level}] con cents null cuando no había nota
export function analyzeLongTone(frames, dtMs) {
  const voiced = frames.filter(f => f.cents !== null);
  if (voiced.length < 10) return null;
  const cents = voiced.map(f => f.cents);
  const db = voiced.map(f => 20 * Math.log10(Math.max(f.level, 1e-4)));
  return {
    seconds: voiced.length * dtMs / 1000,
    mean: mean(cents),
    stability: std(cents),
    vibrato: vibrato(cents, dtMs),
    centsPer10dB: slope(db, cents) * 10,
    dynamicRange: Math.max(...db) - Math.min(...db),
  };
}

// Consejo principal según el resultado
export function longToneTip(r) {
  if (!r) return 'No he oído una nota estable. Prueba a tocar más fuerte o más cerca del móvil.';
  if (r.dynamicRange > 8 && Math.abs(r.centsPer10dB) >= 5) {
    return r.centsPer10dB > 0 ? 'Al subir el volumen te vas alto: abre la garganta y relaja la embocadura en el forte.' : 'Al bajar el volumen te vas alto: sostén el aire en el piano y no dejes caer la columna.';
  }
  if (r.stability > 12 && !r.vibrato) return 'La afinación se mueve: mantén el aire constante y la embocadura quieta.';
  if (Math.abs(r.mean) > 10) return r.mean > 0 ? 'Vas alto de media: relaja un poco o ajusta la afinación del instrumento.' : 'Vas bajo de media: más velocidad de aire o ajusta la afinación del instrumento.';
  return '¡Muy estable! Prueba ahora con un crescendo y un diminuendo.';
}
