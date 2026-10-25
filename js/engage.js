// Enganche diario: racha con protectores, objetivo de minutos, insignias y reto del día.

const DAY_MS = 86400000;
export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;
export const GOALS = [5, 10, 15, 20];

const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / DAY_MS);

// Avanza la racha. Si se perdió algún día y hay protectores, se gastan para salvarla.
// Cada 7 días seguidos se gana un protector (máximo 2).
export function advanceStreak({ count, last }, freezes, day) {
  if (last === day) return { streak: { count, last }, freezes, usedFreezes: 0 };
  const gap = last ? dayDiff(last, day) : Infinity;
  const missed = gap - 1;
  let next = 1;
  let used = 0;
  let left = freezes;
  if (gap === 1) next = count + 1;
  else if (missed >= 1 && missed <= left) { used = missed; left -= missed; next = count + 1; }
  const earned = next % FREEZE_EVERY === 0 && next > 0 ? 1 : 0;
  return { streak: { count: next, last: day }, freezes: Math.min(MAX_FREEZES, left + earned), usedFreezes: used };
}

export function dailyProgress(practiceLog, goal, day) {
  const minutes = practiceLog[day] || 0;
  return { minutes, goal, done: minutes >= goal, ratio: Math.min(1, minutes / goal) };
}

// Semilla del reto del día: igual para todos los que tocan el mismo instrumento ese día
export function dailySeed(day, instrumentId) {
  let h = 2166136261;
  for (const ch of `${day}|${instrumentId}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 1000000;
}

// Semana ISO (lunes a domingo) para las ligas: «2026-W43»
export function weekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const countDone = progress => Object.values(progress).filter(v => v > 0).length;
const countPerfect = progress => Object.values(progress).filter(v => v >= 3).length;
const songsDone = progress => Object.entries(progress).filter(([k, v]) => k.includes('song:') && v > 0).length;
const maxGym = gym => Math.max(0, ...Object.values(gym));
const tuningNotes = tuning => Object.values(tuning).reduce((s, inst) => s + Object.keys(inst).length, 0);

export const BADGES = [
  { id: 'first', name: 'Primera nota', desc: 'Termina tu primera lección', test: s => countDone(s.progress) >= 1 },
  { id: 'streak3', name: 'Constancia', desc: '3 días seguidos', test: s => s.streak.count >= 3 },
  { id: 'streak7', name: 'Una semana', desc: '7 días seguidos', test: s => s.streak.count >= 7 },
  { id: 'streak30', name: 'Imparable', desc: '30 días seguidos', test: s => s.streak.count >= 30 },
  { id: 'perfect5', name: 'Afinación de oro', desc: '5 lecciones con 3 estrellas', test: s => countPerfect(s.progress) >= 5 },
  { id: 'songs10', name: 'Repertorio', desc: '10 canciones terminadas', test: s => songsDone(s.progress) >= 10 },
  { id: 'gym100', name: 'Dedos rápidos', desc: 'Un ejercicio del gimnasio a 100 BPM', test: s => maxGym(s.gym) >= 100 },
  { id: 'map12', name: 'Oído fino', desc: 'Mapa de afinación con 12 notas', test: s => tuningNotes(s.tuning) >= 12 },
  { id: 'daily7', name: 'Retador', desc: '7 retos del día', test: s => Object.keys(s.dailyDone || {}).length >= 7 },
  { id: 'xp1000', name: 'Mil puntos', desc: 'Consigue 1000 puntos', test: s => s.xp >= 1000 },
  { id: 'multi', name: 'Multiinstrumentista', desc: 'Lecciones con dos instrumentos', test: s => new Set(Object.keys(s.progress).map(k => (/^[a-z-]+:(lesson|song):/.test(k) ? k.split(':')[0] : 'violin'))).size >= 2 },
];

export function earnedBadges(state) {
  return BADGES.filter(b => b.test(state)).map(b => b.id);
}
