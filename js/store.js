// Preferencias y progreso guardados solo en este navegador.

const KEY = 'violin-facil-v2';
const LEGACY_KEY = 'violin-facil-v1';
export const TOLERANCE_CENTS = { facil: 40, normal: 28, exigente: 18 };
const XP_PER_STAR = 10;
const XP_PER_LESSON = 5;

const DEFAULTS = Object.freeze({
  onboarded: false, nom: 'eu', level: 'new', styles: [], tolerance: 'facil', showBoard: true,
  unlockAll: false, bpm: 80, meter: 4, lessonMetro: false, progress: {}, xp: 0,
  streak: { count: 0, last: null }, lessonsPlayed: 0,
});

function read(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; }
}

function load() {
  const saved = read(KEY);
  if (saved) return { ...DEFAULTS, ...saved };
  const legacy = read(LEGACY_KEY) || {};
  return {
    ...DEFAULTS,
    nom: legacy.nom === 'us' ? 'us' : 'eu',
    bpm: Number.isFinite(legacy.bpm) ? legacy.bpm : DEFAULTS.bpm,
    meter: [1, 2, 3, 4].includes(legacy.meter) ? legacy.meter : DEFAULTS.meter,
  };
}

let state = load();
const listeners = new Set();

export function getState() { return state; }

export function update(patch) {
  state = { ...state, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento: se sigue sin guardar */ }
  listeners.forEach(fn => fn(state));
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function today(date = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function dayDiff(a, b) {
  return Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 86400000);
}

export function nextStreak(streak, day) {
  if (streak.last === day) return streak;
  const continues = streak.last && dayDiff(streak.last, day) === 1;
  return { count: continues ? streak.count + 1 : 1, last: day };
}

// La racha solo cuenta si el último día de práctica fue hoy o ayer
export function currentStreak(streak, day = today()) {
  if (!streak.last) return 0;
  return dayDiff(streak.last, day) <= 1 ? streak.count : 0;
}

export function recordResult(key, stars) {
  const prev = state.progress[key] || 0;
  const gained = XP_PER_LESSON + Math.max(0, stars - prev) * XP_PER_STAR;
  return update({
    progress: { ...state.progress, [key]: Math.max(prev, stars) },
    xp: state.xp + gained,
    streak: nextStreak(state.streak, today()),
    lessonsPlayed: state.lessonsPlayed + 1,
  });
}

export function resetProgress() {
  return update({ progress: {}, xp: 0, streak: { count: 0, last: null }, lessonsPlayed: 0 });
}
