import { signedCents } from './music.js';

// Mapa de afinación (lógica sin pantalla): media y dispersión de cada nota y el resumen que se enseña arriba.
export const MIN_SAMPLES = 3;
const WATCH_CENTS = 5;
const WATCH_MAX = 3;

export function tuningStats(entry) {
  const m = entry.sum / entry.n;
  const variance = entry.n > 1 ? Math.max(0, (entry.sumSq - entry.n * m * m) / (entry.n - 1)) : 0;
  return { mean: m, spread: Math.sqrt(variance), n: entry.n };
}

// rows: [{ midi, mean, n }]; nameOf(row): nombre de la nota con su octava (dos Do distintos no se confunden)
export function mapSummary(rows, instName, nameOf) {
  if (!rows.length) return `Aún no hay datos de tu ${instName.toLowerCase()}. Haz lecciones o notas tenidas y aquí verás qué notas te salen altas o bajas.`;
  const reliable = rows.filter(r => r.n >= MIN_SAMPLES);
  // Con una o dos tomas por nota no se puede decir que la afinación esté equilibrada
  if (!reliable.length) return 'Todavía hay pocos datos: hacen falta al menos 3 tomas de una nota para saber si te sale alta o baja. Sigue tocando.';
  const worst = [...reliable].sort((a, b) => Math.abs(b.mean) - Math.abs(a.mean)).slice(0, WATCH_MAX).filter(r => Math.abs(r.mean) >= WATCH_CENTS);
  return worst.length
    ? `Notas a vigilar: ${worst.map(r => `${nameOf(r)} (${signedCents(r.mean)} ¢)`).join(', ')}. Toca una para practicarla con notas tenidas.`
    : 'Tu afinación está muy equilibrada en todas las notas con datos suficientes.';
}
