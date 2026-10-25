// Reglas de las prácticas de acordes: media de los últimos fotogramas, cambios de un minuto y estrellas.

export const SMOOTH_FRAMES = 8;     // ~0,3 s: un rasgueo o un arpegio cuenta entero
export const HOLD_MS = 400;         // tiempo sonando bien para dar el acorde por bueno
export const STABLE_MS = 150;       // en los cambios de un minuto basta con que suene un instante
export const STRUM_GRACE_BEATS = 0.5; // al empezar cada acorde hay medio pulso para cambiar la mano
export const STRUM_OK_RATIO = 0.35;
export const CHANGES_SECONDS = 60;

// Media de los últimos cromagramas (los silencios no cuentan)
export function smoother(size = SMOOTH_FRAMES) {
  let frames = [];
  return {
    push(chroma) { frames = [...frames, chroma].slice(-size); },
    clear() { frames = []; },
    value() {
      if (!frames.length) return null;
      return Array.from({ length: 12 }, (_, i) => frames.reduce((s, f) => s + f[i], 0) / frames.length);
    },
  };
}

// Cuenta los cambios entre dos acordes: suma uno cada vez que suena estable el acorde contrario al anterior
export function changeCounter(stableMs = STABLE_MS) {
  let last = null, candidate = null, since = 0, count = 0;
  return {
    feed(name, t) {
      if (name !== candidate) { candidate = name; since = t; return count; }
      if (!name || name === last || t - since < stableMs) return count;
      if (last !== null) count++;
      last = name;
      return count;
    },
    get count() { return count; },
    get current() { return last; },
  };
}

// Ventanas de cada acorde del cifrado (en pulsos)
export function strumWindows(chart) {
  let beat = 0;
  return chart.map(item => {
    const w = { ...item, start: beat, end: beat + item.beats };
    beat += item.beats;
    return w;
  });
}

export function strumStars(accuracy) {
  return accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= 0.5 ? 1 : 0;
}

export function changesStars(count, target) {
  return count >= target ? 3 : count >= target * 0.6 ? 2 : count >= 5 ? 1 : 0;
}

// Acorde a acorde: rapidez media en encontrar cada acorde (los saltados cuentan como fallo)
export function holdStars(secondsPerChord, skipped, total) {
  if (skipped * 2 > total) return 0;
  const avg = secondsPerChord.length ? secondsPerChord.reduce((a, b) => a + b, 0) / secondsPerChord.length : Infinity;
  if (!skipped && avg <= 4) return 3;
  if (avg <= 8 && skipped <= 1) return 2;
  return 1;
}
