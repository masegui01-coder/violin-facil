// Resumen del alumno «en el cable» (sin DOM ni red). Firestore no puede recorrer un mapa en sus reglas, así que lo que
// tiene muchas entradas viaja como TEXTO con un formato fijo que las reglas validan entero con una expresión regular
// (firestore.rules validAulaSummary): cada %, cada fecha y cada número queda comprobado en el servidor.
//   days     «2026-11-05=20;»            minutos por día (0-1440)
//   tasks    «<tarea>=p,n,d,l,o;»         % 0-100, intentos, hecha 0/1, último (ms), agotada 0/1
//   units    «l1u3=85;»                   % por unidad de Lenguaje
//   mistakes «3M-3m=4;»                   errores frecuentes y veces
//   recent   «<id>=p@ms;»                 historial de intentos
// Al leer, decodeSummary acepta además el formato antiguo (mapas) y lo sanea: todo número sale como número.
export const WIRE = {
  days: '([0-9]{4}-[01][0-9]-[0-3][0-9]=[0-9]{1,4};){0,92}',
  tasks: '([A-Za-z0-9_-]{1,40}=(100|[1-9]?[0-9]),[0-9]{1,3},[01],[0-9]{1,13},[01];){0,100}',
  units: '(l[0-9]{1,2}u[0-9]{1,2}=(100|[1-9]?[0-9]);){0,64}',
  mistakes: '([A-Za-z0-9_#+.>-]{1,16}=[0-9]{1,4};){0,10}',
  recent: '([A-Za-z0-9_-]{1,60}=(100|[1-9]?[0-9])@[0-9]{1,13};){0,20}',
  term: '[0-9]{4}-[0-9]{4}-[1-3]',
};
const full = key => new RegExp(`^(?:${WIRE[key]})$`);
const RE = Object.fromEntries(Object.keys(WIRE).map(k => [k, full(k)]));
const ENTRY = {
  days: /^(\d{4}-\d{2}-\d{2})=(\d+)$/, tasks: /^([\w-]+)=(\d+),(\d+),([01]),(\d+),([01])$/, units: /^(l\d+u\d+)=(\d+)$/,
  mistakes: /^([\w#+.>-]+)=(\d+)$/, recent: /^([\w-]+)=(\d+)@(\d+)$/,
};
export const SKILL_KEYS = ['ritmo', 'entonacion', 'lectura', 'teoria', 'dictado', 'audicion'];

const int = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; };
const pct = v => int(v, 0, 100);
const join = list => list.map(x => x + ';').join('');

// Mapas → texto con el formato de WIRE (lo que no cabe en el formato se descarta)
export function encodeSummary(s) {
  const ok = (key, text) => (RE[key].test(text) ? text : '');
  const keep = (key, parts) => parts.filter(p => ENTRY[key].test(p));
  const wire = {
    nickname: String(s.nickname || '').slice(0, 30), instrument: String(s.instrument || '').slice(0, 24),
    at: int(s.at, 0, 9999999999999), term: String(s.term), streak: int(s.streak, 0, 5000),
    days: ok('days', join(keep('days', Object.entries(s.days || {}).map(([d, m]) => `${d}=${int(m, 0, 1440)}`)).slice(-92))),
    skills: cleanSkills(s.skills),
    mistakes: ok('mistakes', join(keep('mistakes', Object.entries(s.mistakes || {}).map(([c, n]) => `${c}=${int(n, 0, 9999)}`)).slice(0, 10))),
    units: ok('units', join(keep('units', Object.entries(s.units || {}).map(([u, p]) => `${u}=${pct(p)}`)).slice(0, 64))),
    tasks: ok('tasks', join(keep('tasks', Object.entries(s.tasks || {}).map(([id, e]) => `${id}=${pct(e.p)},${int(e.n, 0, 999)},${e.d ? 1 : 0},${int(e.l, 0, 9999999999999)},${e.o ? 1 : 0}`)).slice(0, 100))),
    recent: ok('recent', join(keep('recent', (s.recent || []).map(x => `${x.id}=${pct(x.p)}@${int(x.at, 0, 9999999999999)}`)).slice(-20))),
  };
  if (s.prevTerm && RE.term.test(s.prevTerm)) return { ...wire, prevTerm: s.prevTerm, prevSkills: cleanSkills(s.prevSkills) };
  return wire;
}

export function cleanSkills(skills) {
  return Object.fromEntries(SKILL_KEYS.filter(k => skills && skills[k] !== undefined && Number.isFinite(Number(skills[k]))).map(k => [k, pct(skills[k])]));
}

// Texto (o mapas antiguos) → mapas saneados para las pantallas
function entries(key, value) {
  if (typeof value !== 'string') return null;
  return value.split(';').filter(Boolean).map(p => ENTRY[key].exec(p)).filter(Boolean);
}
const safeId = id => /^[\w-]{1,60}$/.test(id);

export function decodeSummary(doc) {
  if (!doc) return null;
  const d = doc;
  const map = (key, fromText, fromMap) => {
    const parsed = entries(key, d[key]);
    if (parsed) return Object.fromEntries(parsed.map(fromText));
    return Object.fromEntries(Object.entries((d[key] && typeof d[key] === 'object' && !Array.isArray(d[key])) ? d[key] : {}).filter(([k]) => safeId(k) || /^\d{4}-\d{2}-\d{2}$/.test(k) || /^[\w#+.>-]{1,16}$/.test(k)).map(fromMap));
  };
  const recentText = entries('recent', d.recent);
  return {
    id: d.id, nickname: String(d.nickname || ''), instrument: String(d.instrument || ''), at: int(d.at, 0, 9999999999999) || null,
    term: typeof d.term === 'string' && RE.term.test(d.term) ? d.term : '', streak: int(d.streak, 0, 5000),
    days: map('days', m => [m[1], int(m[2], 0, 1440)], ([k, v]) => [k, int(v, 0, 1440)]),
    skills: cleanSkills(d.skills),
    prevTerm: typeof d.prevTerm === 'string' && RE.term.test(d.prevTerm) ? d.prevTerm : '', prevSkills: cleanSkills(d.prevSkills),
    mistakes: map('mistakes', m => [m[1], int(m[2], 0, 9999)], ([k, v]) => [k, int(v, 0, 9999)]),
    units: map('units', m => [m[1], pct(m[2])], ([k, v]) => [k, pct(v)]),
    tasks: map('tasks', m => [m[1], { p: pct(m[2]), n: int(m[3], 0, 999), d: m[4] === '1', l: Number(m[5]), o: m[6] === '1' }],
      ([k, e]) => [k, { p: pct(e && e.p), n: int(e && e.n, 0, 999), d: !!(e && e.d === true), l: int(e && e.l, 0, 9999999999999), o: !!(e && e.o === true) }]),
    recent: recentText ? recentText.map(m => ({ id: m[1], p: pct(m[2]), at: Number(m[3]) }))
      : (Array.isArray(d.recent) ? d.recent : []).filter(x => x && safeId(String(x.id))).map(x => ({ id: String(x.id), p: pct(x.p), at: int(x.at, 0, 9999999999999) })),
  };
}
