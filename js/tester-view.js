// Modo tester para quien YA tiene cuenta (sin DOM ni red): «Ver como profesor» y «Ver como alumno» sobre una clase de
// ejemplo que vive solo en este móvil (tester-fs.js). No se crea escuela ni se entra en ninguna clase de verdad, no hace
// falta licencia y nada de lo que se hace aquí llega a los datos reales. Al salir se borra y vuelve el Aula de siempre.
import { SANDBOX_SID } from './tester-fs.js';
import { sampleStudents, sampleSummaryWire } from './demo-samples.js';
import { dayKey, addDays } from './aula.js';
import { schoolYear } from './school.js';

export const TESTER_ROLES = ['alumno', 'profesor'];
export const SANDBOX_CID = 'clase-ejemplo';
export const SANDBOX_CODE = 'EJEMPL';
export const SANDBOX_TEACHER = 'Marta (ejemplo)';
export const SANDBOX_CLASS = 'Lenguaje 1 · Ejemplo';
const DAY = 864e5;
const HOUR = 36e5;

export const testerSession = state => (state && state.tester && TESTER_ROLES.includes(state.tester.role) ? state.tester : null);
// Escuela del Aula mientras se mira como tester: la de ejemplo (profesor), ninguna (alumno); undefined fuera del modo tester
export function testerAulaSid(state) {
  const t = testerSession(state);
  if (!t) return undefined;
  return t.role === 'profesor' ? SANDBOX_SID : null;
}

// La clase de ejemplo tal como la guarda un alumno que ha entrado en ella (aula-sync.js myClasses)
export const sandboxClassEntry = t => ({
  sid: SANDBOX_SID, cid: SANDBOX_CID, name: SANDBOX_CLASS, teacher: SANDBOX_TEACHER, code: SANDBOX_CODE,
  nickname: t.nickname || 'Tú', instrument: t.instrument || 'violin', uid: t.uid,
});
// Mis clases: como alumno tester, además la de ejemplo; nunca se guarda en el estado del Aula de verdad
export function withTesterClasses(classes, state) {
  const real = (classes || []).filter(c => c.sid !== SANDBOX_SID);
  const t = testerSession(state);
  return t && t.role === 'alumno' ? [...real, sandboxClassEntry(t)] : real;
}

// Tareas de la profesora de ejemplo: una unidad, una sección y ejercicios de Lenguaje Musical y una lección del curso
export function sandboxTasks(now = Date.now()) {
  const today = dayKey(now);
  const base = { maxAttempts: 0, variant: 'any', to: [], createdAt: now - 14 * DAY };
  return [
    { ...base, id: 'ejemplo-t1', title: 'Unidad 1 · El latido', kind: 'lm-unit', ref: { level: 1, unit: 1, label: 'Nivel 1 · Unidad 1: El latido' },
      due: addDays(today, -3), minPct: 60, note: 'Haz todas las secciones. Si te cuesta el dictado, repítelo.' },
    { ...base, id: 'ejemplo-t2', title: 'Ritmo · Unidad 2', kind: 'lm-section', ref: { level: 1, unit: 2, section: 'ritmo', label: 'Nivel 1 · Unidad 2: Corcheas a pares · Ritmo' },
      due: addDays(today, 4), minPct: 70, variant: 'facil' },
    { ...base, id: 'ejemplo-t3', title: 'Ejercicios · Unidad 3', kind: 'lm-ex', ref: { level: 1, unit: 3, ids: ['lm1-u3-teoria-a-facil', 'lm1-u3-dictado-a-facil'], label: 'Nivel 1 · Unidad 3: Sonidos largos · 2 ejercicios' },
      due: addDays(today, 7), minPct: 60, maxAttempts: 3 },
    { ...base, id: 'ejemplo-t4', title: 'Conoce tu violín', kind: 'lesson', ref: { id: 'u1-intro', inst: 'violin', label: 'Violín · Unidad 1 · Conoce tu violín' },
      due: null, minPct: 50, createdAt: now - 20 * DAY },
  ];
}

// Todo lo de la escuela de ejemplo (rutas de Firestore → documento, horas como { __ts })
export function sandboxSeed({ uid, now = Date.now() }) {
  const root = `schools/${SANDBOX_SID}`;
  const cls = `${root}/classes/${SANDBOX_CID}`;
  const tasks = sandboxTasks(now);
  const students = sampleStudents();
  const seed = {
    [root]: { name: 'Escuela de ejemplo', ownerUid: uid, ownerName: SANDBOX_TEACHER, code: 'EJESCU', year: schoolYear(new Date(now)), students: 0,
      premium: { active: true, until: dayKey(now + 365 * DAY) } },
    [cls]: { name: SANDBOX_CLASS, code: SANDBOX_CODE, teacherName: SANDBOX_TEACHER, students: students.length, createdAt: { __ts: now - 30 * DAY } },
  };
  tasks.forEach(({ id, ...t }) => { seed[`${cls}/tasks/${id}`] = t; });
  students.forEach((s, i) => {
    seed[`${cls}/students/${s.id}`] = { nickname: s.nickname, instrument: s.instrument, code: SANDBOX_CODE, joinedAt: { __ts: now - (28 - i) * DAY } };
    seed[`${cls}/summaries/${s.id}`] = sampleSummaryWire(i, tasks, now);
  });
  const feedback = (taskId, to, comment, ago) => { seed[`${cls}/feedback/${taskId}_${to}`] = { uid: to, taskId, comment, at: now - ago }; };
  feedback('ejemplo-t1', 'ejemplo-1', '¡Muy buen pulso! Ahora repasa el dictado.', 2 * DAY);
  feedback('ejemplo-t4', 'ejemplo-2', 'Bien. Mira otra vez cómo se coge el arco.', 5 * DAY);
  // Comentarios para el propio tester cuando mira como alumno
  feedback('ejemplo-t4', uid, '¡Muy bien! Ya conoces las partes de tu instrumento.', 3 * DAY);
  feedback('ejemplo-t1', uid, 'Te falta terminar la unidad: el dictado es lo que más te cuesta.', DAY);
  seed[`${cls}/works/ejemplo-2_lm1-u1-creatividad-a-facil`] = {
    uid: 'ejemplo-2', nickname: students[1].nickname, exId: 'lm1-u1-creatividad-a-facil', title: 'Mi primer ritmo',
    score: 'C4q C4q D4q E4q D4h C4h', lyrics: 'Late, late mi corazón', meter: '4/4', pct: 80, at: now - 2 * DAY,
  };
  seed[`${cls}/works/ejemplo-5_lm1-u3-creatividad-a-facil`] = {
    uid: 'ejemplo-5', nickname: students[4].nickname, exId: 'lm1-u3-creatividad-a-facil', title: 'Sonido largo',
    score: 'E4h G4h C5w', lyrics: '', meter: '4/4', pct: 100, at: now - 6 * HOUR,
  };
  return seed;
}

// Lo que el alumno tester ya «había hecho»: la lección terminada y uno de los dos ejercicios de la unidad 3 empezado
export function sandboxProgress(now = Date.now()) {
  return {
    [`${SANDBOX_CID}/ejemplo-t4`]: { p: 100, n: 1, d: true, l: now - 4 * DAY, o: false, ex: { 'u1-intro': 100 }, c: { 'u1-intro': 1 } },
    [`${SANDBOX_CID}/ejemplo-t3`]: { p: 50, n: 1, d: false, l: now - DAY, o: false, ex: { 'lm1-u3-teoria-a-facil': 100 }, c: { 'lm1-u3-teoria-a-facil': 1 } },
  };
}

const withoutSandbox = aula => {
  const a = aula || {};
  const tasks = Object.fromEntries(Object.entries(a.tasks || {}).filter(([k]) => !k.startsWith(`${SANDBOX_SID}/`)));
  const prog = Object.fromEntries(Object.entries(a.prog || {}).filter(([k]) => !k.startsWith(`${SANDBOX_CID}/`)));
  return { ...a, tasks, prog };
};

// Entrar (o cambiar de papel): se recuerda la vista del Aula de antes, una sola vez, para devolverla al salir
export function testerEntryPatch(state, role, { uid, now = Date.now() }) {
  const was = testerSession(state);
  const prev = was ? was.prev : { learnView: state.learnView || 'casual', aulaView: state.aulaView || null };
  const aula = withoutSandbox(state.aula);
  return {
    tester: { role, uid, since: was ? was.since : now, nickname: state.nickname || 'Tú', instrument: state.instrument || 'violin', prev },
    learnView: 'pro', aulaView: 'aula',
    aula: role === 'alumno' ? { ...aula, prog: { ...aula.prog, ...sandboxProgress(now) } } : aula,
  };
}

// Salir: fuera todo lo de la clase de ejemplo y vuelve la vista de antes
export function testerExitPatch(state) {
  const t = testerSession(state);
  const prev = (t && t.prev) || {};
  return { tester: null, learnView: prev.learnView || state.learnView, aulaView: prev.aulaView ?? null, aula: withoutSandbox(state.aula) };
}
