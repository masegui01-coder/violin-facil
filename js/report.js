// Informe de mejora: historial semanal, comparación con la semana anterior y perfil de habilidades.

const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const avg = (sum, n) => (n ? sum / n : null);

export function emptyWeek() {
  return { minutes: 0, lessons: 0, accSum: 0, accN: 0, tuneSum: 0, tuneN: 0, readSum: 0, readN: 0, gym: {}, days: [] };
}

// Añade un hecho a la semana (inmutable)
export function addToWeek(week = emptyWeek(), { minutes = 0, accuracy = null, reading = false, tuneAbs = [], gym = null, day = null }) {
  const next = { ...week, gym: { ...week.gym }, days: [...week.days] };
  next.minutes = Math.round((next.minutes + minutes) * 10) / 10;
  if (accuracy !== null) {
    next.lessons += 1;
    if (reading) { next.readSum += accuracy; next.readN += 1; } else { next.accSum += accuracy; next.accN += 1; }
  }
  tuneAbs.forEach(c => { next.tuneSum += Math.abs(c); next.tuneN += 1; });
  if (gym) next.gym[gym.id] = Math.max(next.gym[gym.id] || 0, gym.bpm);
  if (day && !next.days.includes(day)) next.days.push(day);
  return next;
}

export function weekSummary(w) {
  if (!w) return null;
  return { minutes: w.minutes, days: w.days.length, accuracy: avg(w.accSum, w.accN), tuning: avg(w.tuneSum, w.tuneN), reading: avg(w.readSum, w.readN), gym: w.gym };
}

// Frases de mejora comparando esta semana con la anterior
export function compareWeeks(cur, prev) {
  const a = weekSummary(cur), b = weekSummary(prev);
  const out = [];
  if (!a) return out;
  if (a.tuning !== null && b && b.tuning !== null && Math.abs(b.tuning - a.tuning) >= 1) {
    out.push({ good: a.tuning < b.tuning, text: `Afinación media: de ±${Math.round(b.tuning)} a ±${Math.round(a.tuning)} cents` });
  }
  if (a.accuracy !== null && b && b.accuracy !== null && Math.abs(a.accuracy - b.accuracy) >= 0.02) {
    out.push({ good: a.accuracy > b.accuracy, text: `Precisión a tempo: del ${Math.round(b.accuracy * 100)} % al ${Math.round(a.accuracy * 100)} %` });
  }
  Object.entries(a.gym).forEach(([id, bpm]) => {
    const before = b && b.gym[id];
    if (before && bpm > before) out.push({ good: true, text: `${id}: de ${before} a ${bpm} BPM` });
  });
  if (b) out.push({ good: a.minutes >= b.minutes, text: `${Math.round(a.minutes)} minutos en ${a.days} días (la semana pasada: ${Math.round(b.minutes)} en ${b.days})` });
  else out.push({ good: true, text: `${Math.round(a.minutes)} minutos en ${a.days} días esta semana` });
  return out;
}

// Perfil de habilidades de 0 a 100
// En guitarra y piano la afinación la pone el instrumento: el primer eje mide los acordes que sabes (20 = 100)
const CHORDS_FOR_FULL = 20;
export function skills({ tuningAbs = null, tempoAcc = null, gymBest = 0, readingAcc = null, practiceDays30 = 0, rhythmOnly = false, chordsKnown = null }) {
  const first = chordsKnown !== null
    ? { id: 'chords', name: 'Acordes', value: clamp(chordsKnown / CHORDS_FOR_FULL * 100) }
    : { id: 'tune', name: rhythmOnly ? 'Precisión' : 'Afinación', value: rhythmOnly ? clamp((tempoAcc ?? 0) * 100) : tuningAbs === null ? 0 : clamp(100 - tuningAbs * 3) };
  return [
    first,
    { id: 'rhythm', name: 'Ritmo', value: tempoAcc === null ? 0 : clamp(tempoAcc * 100) },
    { id: 'tech', name: 'Técnica', value: gymBest ? clamp((gymBest - 40) / 100 * 100) : 0 },
    { id: 'read', name: 'Lectura', value: readingAcc === null ? 0 : clamp(readingAcc * 100) },
    { id: 'habit', name: 'Constancia', value: clamp(practiceDays30 / 20 * 100) },
  ];
}

// Polígono del radar (centro cx, cy, radio r) para valores 0–100
export function radarPoints(values, cx, cy, r) {
  return values.map((v, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / values.length;
    return [cx + Math.cos(a) * r * v / 100, cy + Math.sin(a) * r * v / 100];
  });
}
