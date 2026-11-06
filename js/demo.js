// Modo prueba (sin DOM ni red): un tester entra sin cuenta como alumno o como profesor. El profesor de prueba se da a sí
// mismo una licencia de prueba del Aula (escuela con «demo: true»), corta y con límites que comprueban también las reglas
// (firestore.rules, demoSchoolCreate / demoClassOk / demoSeatOk). Todo lo de la prueba es temporal: se borra al salir.
export const DEMO_ROLES = ['alumno', 'profesor'];
const DAY_MS = 864e5;
// La licencia de prueba vale como mucho 7 días (las reglas: «until» + 1 día ≤ ahora + 7 días). El cliente pide 5 días
// de «until» (6 de uso): así un reloj del móvil algo adelantado no hace que las reglas la rechacen.
export const DEMO_MAX_DAYS = 7;
export const DEMO_UNTIL_DAYS = 5;
export const DEMO_MAX_CLASSES = 3;
export const DEMO_CLASS_IDS = ['demo-1', 'demo-2', 'demo-3'];
export const DEMO_MAX_STUDENTS = 30;

export const isDemoRole = role => DEMO_ROLES.includes(role);
export const demoSession = state => (state && state.demo && isDemoRole(state.demo.role) ? state.demo : null);
export const demoExpired = (state, now = Date.now()) => { const d = demoSession(state); return !!(d && d.until && d.until <= now); };

// «AAAA-MM-DD» en UTC (como lo leen las reglas con timestamp.date)
const utcDay = ms => new Date(ms).toISOString().slice(0, 10);
export const demoUntilKey = (now = Date.now()) => utcDay(now + DEMO_UNTIL_DAYS * DAY_MS);
// Fin real de la licencia: todo el día «until» (hasta las 24:00 UTC), igual que premiumActive y licenseLive
export const demoLicenceEnd = until => Date.parse(until) + DAY_MS;

// Una licencia de prueba solo vale si es de prueba de verdad: activa, con «until» y que no pase de 7 días desde ahora
export function demoLicenceOk(premium, now = Date.now()) {
  if (!premium || premium.demo !== true || premium.active !== true || typeof premium.until !== 'string') return false;
  const end = demoLicenceEnd(premium.until);
  return Number.isFinite(end) && end > now && end <= now + DEMO_MAX_DAYS * DAY_MS;
}

// Escuela del profesor de prueba: exactamente las claves que aceptan las reglas (más createdAt, la hora del servidor)
export function demoSchoolDoc({ uid, ownerName, code, year, now = Date.now() }) {
  return {
    name: 'Escuela de prueba', ownerUid: uid, ownerName: String(ownerName || 'Profe de prueba').slice(0, 30), code, year, students: 0,
    demo: true, premium: { active: true, demo: true, until: demoUntilKey(now) },
  };
}

// Identificador libre para una clase nueva (en una escuela de prueba solo caben tres, con estos nombres fijos)
export const freeDemoClassId = classes => DEMO_CLASS_IDS.find(id => !(classes || []).some(c => c.id === id)) || null;

// Estado local al entrar: directo a Aprender › Pro › Aula, sin bienvenida ni tutorial y con todo el contenido abierto
export function demoEntryPatch(role, { now = Date.now(), fresh = true, school = null } = {}) {
  const until = school ? demoLicenceEnd(school.premium.until) : now + DEMO_MAX_DAYS * DAY_MS;
  return {
    demo: { role, since: now, until, fresh, samples: false, ...(school ? { schoolId: school.id, schoolCode: school.code } : {}) },
    onboarded: true, instrumentChosen: true, tourDone: true, accountPromptSince: now, proTester: true,
    nickname: role === 'profesor' ? 'Profe de prueba' : 'Alumno de prueba',
    learnView: 'pro', aulaView: 'aula',
  };
}
