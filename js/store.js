// Preferencias y progreso guardados solo en este navegador.
import { advanceStreak, weekId } from './engage.js';
import { addToWeek } from './report.js';

const KEY = 'violin-facil-v2';
const LEGACY_KEY = 'violin-facil-v1';
export const TOLERANCE_CENTS = { facil: 40, normal: 28, exigente: 18 };
const XP_PER_STAR = 10;
const XP_PER_LESSON = 5;

const DEFAULTS = Object.freeze({
  onboarded: false, nom: 'eu', level: 'new', styles: [], tolerance: 'facil', showBoard: true,
  unlockAll: false, bpm: 80, meter: 4, lessonMetro: false, progress: {}, xp: 0,
  streak: { count: 0, last: null }, lessonsPlayed: 0,
  speed: 0.6, bigText: false, recordings: [], importedSongs: [],
  instrument: 'violin', a4: 440, tuning: {}, gym: {}, practiceLog: {}, band: null,
  freezes: 0, dailyGoal: 10, dailyDone: {}, badges: [], nickname: '', goalCelebrated: null, instrumentChosen: false, tourDone: false,
  percLatency: 0, metroClick: true,
  history: {}, recentAcc: [], recentReading: [], errors: {}, routineDone: {}, cards: [], themes: [], theme: 'barniz', reportSeen: null, longtones: 0,
  chordsKnown: {}, changes: {}, theoryAnswers: {},
  accountPromptSince: null, analyticsConsent: null,
  publicName: '', publicBoards: false, kidMode: false, bandPending: [],
  groups: [], bandView: 'band', placement: {},
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

// Sustituye todo el estado (al recuperar el progreso de la cuenta en otro dispositivo)
export function replaceState(next) {
  state = { ...DEFAULTS, ...next };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento */ }
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

// El progreso del curso es por instrumento: el violín conserva las claves originales
const progressKey = key => (state.instrument === 'violin' ? key : `${state.instrument}:${key}`);

export function instrumentProgress() {
  if (state.instrument === 'violin') return Object.fromEntries(Object.entries(state.progress).filter(([k]) => !/^[a-z]+:(lesson|song):/.test(k)));
  const prefix = state.instrument + ':';
  return Object.fromEntries(Object.entries(state.progress).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]));
}

export function recordResult(key, stars, minutes = 0) {
  const full = progressKey(key);
  const prev = state.progress[full] || 0;
  const gained = XP_PER_LESSON + Math.max(0, stars - prev) * XP_PER_STAR;
  return update({
    ...dayPatch(minutes),
    progress: { ...state.progress, [full]: Math.max(prev, stars) },
    xp: state.xp + gained,
    lessonsPlayed: state.lessonsPlayed + 1,
  });
}

// Mapa de afinación: por instrumento y nota escrita, suma de desviaciones (cents) para la media y la dispersión
export function addTuningSamples(samples) {
  if (!samples.length) return state;
  const mine = { ...(state.tuning[state.instrument] || {}) };
  samples.forEach(({ midi, cents }) => {
    const prev = mine[midi] || { n: 0, sum: 0, sumSq: 0 };
    mine[midi] = { n: prev.n + 1, sum: prev.sum + cents, sumSq: prev.sumSq + cents * cents };
  });
  return update({ tuning: { ...state.tuning, [state.instrument]: mine }, history: weekPatch({ tuneAbs: samples.map(x => x.cents) }) });
}

export function recordGym(exerciseId, bpm) {
  const key = `${state.instrument}:${exerciseId}`;
  if ((state.gym[key] || 0) >= bpm) return state;
  return update({ gym: { ...state.gym, [key]: bpm }, history: weekPatch({ gym: { id: exerciseId, bpm } }) });
}

// Práctica fuera de las lecciones (herramientas de Estudio): suma minutos, mantiene la racha y da unos puntos
export function logPractice(minutes, xp = 2) {
  return update({ ...dayPatch(minutes), xp: state.xp + xp });
}

// Minutos del día y racha (con protectores) tras practicar
function dayPatch(minutes) {
  const day = today();
  const { streak, freezes } = advanceStreak(state.streak, state.freezes, day);
  return {
    practiceLog: { ...state.practiceLog, [day]: Math.round(((state.practiceLog[day] || 0) + minutes) * 10) / 10 },
    streak, freezes,
    history: weekPatch({ minutes, day }),
  };
}

// Historial semanal para el informe de mejora (se guardan las últimas 12 semanas)
const MAX_WEEKS = 12;
function weekPatch(fact) {
  const w = weekId();
  const history = { ...state.history, [w]: addToWeek(state.history[w], fact) };
  const keys = Object.keys(history).sort();
  return Object.fromEntries(keys.slice(-MAX_WEEKS).map(k => [k, history[k]]));
}

export function recordWeek(fact) {
  return update({ history: weekPatch(fact) });
}

// Últimas precisiones a tempo y de lectura, para el perfil de habilidades
export function recordAccuracy(accuracy, reading) {
  const key = reading ? 'recentReading' : 'recentAcc';
  return update({ [key]: [...state[key], accuracy].slice(reading ? -10 : -20), history: weekPatch({ accuracy, reading }) });
}

// Mapa de errores: fallos por nota de cada obra (para pintarlos en la partitura y proponer los compases difíciles)
export function recordErrors(key, missed) {
  const full = progressKey(key);
  const prev = state.errors[full] || { attempts: 0, misses: [] };
  const misses = missed.map((m, i) => (prev.misses[i] || 0) + (m ? 1 : 0));
  return update({ errors: { ...state.errors, [full]: { attempts: prev.attempts + 1, misses } } });
}

export function errorsFor(key) {
  return state.errors[progressKey(key)] || null;
}

// Respuestas a las preguntas de teoría (para repasar más las que se fallan)
export function recordTheoryAnswer(id, right, day = today()) {
  const prev = state.theoryAnswers[id] || { right: 0, wrong: 0 };
  return update({ theoryAnswers: { ...state.theoryAnswers, [id]: { right: prev.right + (right ? 1 : 0), wrong: prev.wrong + (right ? 0 : 1), last: day } } });
}

// Guitarra y piano: acordes que ya sabes (desbloquean canciones) y récords de cambios en un minuto
const MAX_CHANGES = 30;
export const knownChords = () => state.chordsKnown[state.instrument] || [];

export function learnChords(names) {
  const known = knownChords();
  const fresh = [...new Set(names)].filter(n => !known.includes(n));
  if (fresh.length) update({ chordsKnown: { ...state.chordsKnown, [state.instrument]: [...known, ...fresh] } });
  return fresh;
}

const changesKey = pair => `${state.instrument}:${pair.join('-')}`;
export const changesHistory = pair => state.changes[changesKey(pair)] || [];

export function recordChanges(pair, count, day = today()) {
  const key = changesKey(pair);
  return update({ changes: { ...state.changes, [key]: [...(state.changes[key] || []), { day, count }].slice(-MAX_CHANGES) } });
}

const MAX_RECORDINGS = 20;

export function saveRecording(notes, date = new Date()) {
  const rec = { id: String(date.getTime()), date: date.toISOString(), notes };
  return update({ recordings: [rec, ...state.recordings].slice(0, MAX_RECORDINGS) });
}

export function deleteRecording(id) {
  return update({ recordings: state.recordings.filter(r => r.id !== id) });
}

export function addImportedSong(song) {
  return update({ importedSongs: [song, ...state.importedSongs.filter(s => s.id !== song.id)] });
}

export function deleteImportedSong(id) {
  return update({ importedSongs: state.importedSongs.filter(s => s.id !== id) });
}

export function resetProgress() {
  return update({ progress: {}, xp: 0, streak: { count: 0, last: null }, lessonsPlayed: 0 });
}
