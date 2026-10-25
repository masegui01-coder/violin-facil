// Estadísticas de la banda a partir de los datos que cada músico sincroniza (minutos por día, último ensayo, afinación…).

const DAY_MS = 86400000;
export const FAMILY_NAME = { cuerda: 'Cuerda', madera: 'Maderas', metal: 'Metales', percusion: 'Percusión' };

const dayKey = d => d.toISOString().slice(0, 10);
const daysBack = (today, n) => Array.from({ length: n }, (_, i) => dayKey(new Date(new Date(today + 'T12:00Z') - i * DAY_MS)));

// Semáforo: verde si ha practicado en los últimos 2 días, ámbar hasta 6, rojo después o nunca
export function trafficLight(member, today) {
  const days = Object.entries(member.days || {}).filter(([, m]) => m > 0).map(([d]) => d).sort();
  const last = days[days.length - 1];
  if (!last) return 'red';
  const gap = Math.round((new Date(today + 'T12:00Z') - new Date(last + 'T12:00Z')) / DAY_MS);
  return gap <= 2 ? 'green' : gap <= 6 ? 'amber' : 'red';
}

export function minutesInLast(member, today, n) {
  return daysBack(today, n).reduce((s, d) => s + ((member.days || {})[d] || 0), 0);
}

// Racha de banda: días seguidos (hasta hoy o ayer) en los que practicó al menos el 70 % de los músicos
export function bandStreak(members, today, threshold = 0.7) {
  if (!members.length) return 0;
  const ok = d => members.filter(m => ((m.days || {})[d] || 0) > 0).length / members.length >= threshold;
  const days = daysBack(today, 60);
  let i = ok(days[0]) ? 0 : 1;
  let streak = 0;
  for (; i < days.length && ok(days[i]); i++) streak++;
  return streak;
}

export function practicedToday(members, today) {
  return members.length ? members.filter(m => ((m.days || {})[today] || 0) > 0).length / members.length : 0;
}

// Duelo de secciones: minutos de los últimos 7 días por familia, en media por músico (justo con secciones de distinto tamaño)
export function sectionDuel(members, today, familyOf) {
  const groups = {};
  members.forEach(m => {
    const f = familyOf(m.instrument);
    groups[f] = groups[f] || { family: f, minutes: 0, count: 0 };
    groups[f].minutes += minutesInLast(m, today, 7);
    groups[f].count += 1;
  });
  return Object.values(groups).map(g => ({ ...g, perMusician: g.minutes / g.count })).sort((a, b) => b.perMusician - a.perMusician);
}

// Afinación por sección: media de cada nota entre los músicos del mismo instrumento
export function sectionTuning(members, instrument) {
  const acc = {};
  members.filter(m => m.instrument === instrument && m.tuning).forEach(m => {
    Object.entries(m.tuning).forEach(([midi, cents]) => {
      acc[midi] = acc[midi] || { sum: 0, n: 0 };
      acc[midi].sum += cents;
      acc[midi].n += 1;
    });
  });
  return Object.entries(acc).map(([midi, { sum, n }]) => ({ midi: Number(midi), mean: sum / n, musicians: n }))
    .sort((a, b) => Math.abs(b.mean) - Math.abs(a.mean));
}

// Informe en CSV (separado por punto y coma, como lo abre Excel en España)
export function bandCsv(members, tasks, progress, today, nameOf) {
  const head = ['Músico', 'Instrumento', 'Voz', 'Minutos 7 días', 'Minutos 30 días', 'Minutos trimestre', 'Último ensayo', ...tasks.map(t => t.title)];
  const rows = members.map(m => {
    const days = Object.keys(m.days || {}).filter(d => m.days[d] > 0).sort();
    return [m.nickname, nameOf(m.instrument), m.voice || '', Math.round(minutesInLast(m, today, 7)), Math.round(minutesInLast(m, today, 30)), Math.round(minutesInLast(m, today, 90)), days[days.length - 1] || '',
      ...tasks.map(t => { const p = progress.find(x => x.taskId === t.id && x.uid === m.id); return p ? (p.completed ? 'Hecha' : `${p.bestStars}★`) : 'Sin empezar'; })];
  });
  const cell = v => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [head, ...rows].map(r => r.map(cell).join(';')).join('\r\n');
}

const SYNC_DAYS = 92; // un trimestre, para el informe
const MIN_TUNING_SAMPLES = 3;

// Lo que cada músico comparte con su banda: minutos del último trimestre, puntos desde que entró, nivel, racha y afinación media
export function activitySummary({ practiceLog = {}, xp = 0, streak = 0, tuning = {}, level = '' }, today, joinXp = 0) {
  const days = Object.fromEntries(daysBack(today, SYNC_DAYS).filter(d => practiceLog[d] > 0).map(d => [d, Math.round(practiceLog[d] * 10) / 10]));
  const tune = Object.fromEntries(Object.entries(tuning).filter(([, t]) => t.n >= MIN_TUNING_SAMPLES).map(([midi, t]) => [midi, Math.round(t.sum / t.n * 10) / 10]));
  const practised = Object.keys(practiceLog).filter(d => practiceLog[d] > 0).sort();
  return { days, xp, points: Math.max(0, xp - joinXp), level, streak, tuning: tune, lastPractice: practised[practised.length - 1] || null };
}

// Preparación para un concierto o ensayo: parte de las tareas vinculadas que ya están hechas (por músico y tarea)
export function eventPrep(event, tasks, members, progress, isAssigned) {
  const linked = tasks.filter(t => (event.taskIds || []).includes(t.id));
  const pairs = linked.flatMap(t => members.filter(m => isAssigned(t, m)).map(m => [t, m]));
  if (!pairs.length) return null;
  const done = pairs.filter(([t, m]) => progress.some(p => p.taskId === t.id && p.uid === (m.uid || m.id) && p.completed)).length;
  return done / pairs.length;
}

export function daysUntil(date, today) {
  return Math.round((new Date(date + 'T12:00Z') - new Date(today + 'T12:00Z')) / DAY_MS);
}

// Propuesta de músico de la semana: quien más ha ensayado en 7 días
export function weekStarSuggestion(members, today) {
  const ranked = members.map(m => ({ m, minutes: minutesInLast(m, today, 7) })).filter(x => x.minutes > 0).sort((a, b) => b.minutes - a.minutes);
  return ranked.length ? { member: ranked[0].m, minutes: ranked[0].minutes } : null;
}
