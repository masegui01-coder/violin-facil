// «Tu siguiente paso»: qué conviene hacer ahora (sin DOM, para poder probarlo).
const SOON_DAYS = 3;

// Tarea de la banda pendiente que vence en los próximos días (la banda la guarda al cargarse)
export function soonBandTask(s, day) {
  if (!s.band || s.band.role === 'director') return null;
  const limit = new Date(`${day}T12:00:00`);
  limit.setDate(limit.getDate() + SOON_DAYS);
  const max = limit.toISOString().slice(0, 10);
  return (s.bandPending || []).filter(t => t.due && t.due >= day && t.due <= max)
    .sort((a, b) => a.due.localeCompare(b.due))[0] || null;
}
