// Métricas de la app para el administrador, calculadas a partir del resumen de cada tester (sin DOM ni red).
export const ADMIN_EMAILS = ['masegui01@gmail.com']; // también en firestore.rules (isAdmin)
const DAY_MS = 864e5;
const WEEKS = 8;

export const isAdminEmail = email => !!email && ADMIN_EMAILS.includes(String(email).toLowerCase());

// Testers pro: ven todo el contenido abierto (lecciones y los tres libros), pero no el panel de administrador
export const PRO_TESTER_EMAILS = ['fran-saxo@hotmail.com'];
export const isProTesterEmail = email => !!email && PRO_TESTER_EMAILS.includes(String(email).toLowerCase());

// Todos los correos de una cuenta (el principal y los de Google, correo…), en minúsculas
export const accountEmails = acc => [...new Set([acc && acc.email, ...((acc && acc.providerData) || []).map(p => p && p.email)]
  .filter(Boolean).map(e => String(e).trim().toLowerCase()))];

const activeIn = (list, days, now) => list.filter(t => now - (t.lastSeen || 0) < days * DAY_MS).length;
const countBy = (list, key) => Object.entries(list.reduce((m, t) => {
  const k = key(t) || 'Sin dato';
  return { ...m, [k]: (m[k] || 0) + 1 };
}, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

// Lunes (00:00) de la semana de «ms»
export function weekStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export function userMetrics(testers, now = Date.now()) {
  const total = testers.length;
  const active7 = activeIn(testers, 7, now);
  const minutes = testers.reduce((s, t) => s + (t.minutes || 0), 0);
  const thisWeek = weekStart(now);
  const weeks = Array.from({ length: WEEKS }, (_, i) => thisWeek - (WEEKS - 1 - i) * 7 * DAY_MS);
  const signups = weeks.map(w => ({
    label: new Date(w).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    value: testers.filter(t => t.createdAt && weekStart(t.createdAt) === w).length,
  }));
  const practiced = n => testers.filter(t => (t.daysPracticed || 0) >= n).length;
  return {
    total, active1: activeIn(testers, 1, now), active7, active30: activeIn(testers, 30, now),
    newThisWeek: signups[signups.length - 1].value,
    minutes: Math.round(minutes), lessons: testers.reduce((s, t) => s + (t.lessons || 0), 0),
    minutesPerUser: total ? Math.round(minutes / total) : 0,
    signups,
    retention: [
      { label: 'Practicaron al menos 1 día', value: pct(practiced(1), total) },
      { label: 'Volvieron otro día (2+)', value: pct(practiced(2), total) },
      { label: 'Una semana de práctica (7+)', value: pct(practiced(7), total) },
    ],
    instruments: countBy(testers, t => t.instrumentName || t.instrument),
    platforms: countBy(testers, t => t.platform),
    inBand: testers.filter(t => t.band).length,
  };
}

export function groupMetrics(groups) {
  const songs = groups.flatMap(g => g.songs || []);
  const parts = songs.flatMap(s => Object.values(s.parts || {}));
  return {
    groups: groups.length,
    members: groups.reduce((s, g) => s + (g.members || 0), 0),
    songs: songs.length,
    tracks: parts.length,
    megabytes: Math.round(parts.reduce((s, p) => s + (p.bytes || 0), 0) / 1e5) / 10,
  };
}
