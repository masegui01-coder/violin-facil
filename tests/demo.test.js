// Modo prueba (testers sin cuenta): licencia de prueba corta y con límites, acceso Pro por proAccess(), alumnos de
// ejemplo y la forma de las reglas (comprobación estática, como tests/aula-rules.test.js: sin Java no hay emulador).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  demoLicenceOk, demoUntilKey, demoLicenceEnd, demoSchoolDoc, freeDemoClassId, demoEntryPatch, demoSession, demoExpired,
  DEMO_CLASS_IDS, DEMO_MAX_STUDENTS, DEMO_MAX_DAYS, DEMO_MAX_CLASSES,
} from '../js/demo.js';
import { withSampleStudents, isSampleId, SAMPLE_TAG } from '../js/demo-samples.js';
import { proAccess } from '../js/pro-access.js';
import { hasFullContent } from '../js/metrics.js';
import { classRows, filterCounts, dayKey } from '../js/aula.js';
import { encodeSummary, WIRE } from '../js/aula-wire.js';
import { translate } from '../js/i18n.js';

const DAY = 864e5;
const NOW = Date.UTC(2026, 10, 6, 10);
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const flat = rules.replace(/\s+/g, ' ');
const fn = name => {
  const m = flat.match(new RegExp(`function ${name}\\([^)]*\\) \\{ (.*?) \\}(?= function| match| //|$)`));
  assert.ok(m, `falta la función ${name}`);
  return m[1];
};
function block(path) {
  const start = rules.indexOf(`match /${path} {`);
  let depth = 0;
  for (let i = start + `match /${path} `.length; i < rules.length; i++) {
    if (rules[i] === '{') depth++;
    if (rules[i] === '}' && --depth === 0) return rules.slice(start, i + 1).replace(/\s+/g, ' ');
  }
  throw new Error(path);
}
const rule = (text, verb) => (text.match(new RegExp(`allow ${verb}[^;]*;`)) || [''])[0];
const schoolDoc = () => { const b = block('schools/{sid}'); return b.slice(0, b.indexOf('match /members/{uid}')); };
const classDoc = () => { const b = block('classes/{cid}'); return b.slice(0, b.indexOf('match /students/{uid}')); };

// ---------- Licencia de prueba ----------
test('licencia de prueba: la que pide el cliente vale y dura 7 días como mucho', () => {
  const until = demoUntilKey(NOW);
  assert.match(until, /^\d{4}-\d{2}-\d{2}$/);
  const end = demoLicenceEnd(until);
  assert.ok(end > NOW + 5 * DAY && end <= NOW + DEMO_MAX_DAYS * DAY, 'entre 5 y 7 días');
  assert.equal(demoLicenceOk({ active: true, demo: true, until }, NOW), true);
  // con un reloj del móvil 23 h adelantado sigue cumpliendo el tope de las reglas (hora del servidor)
  assert.ok(demoLicenceEnd(demoUntilKey(NOW + 23 * 36e5)) <= NOW + DEMO_MAX_DAYS * DAY);
});

test('licencia de prueba: no vale si es larga, si caducó, si no es de prueba o si le falta la fecha', () => {
  const day = ms => new Date(ms).toISOString().slice(0, 10);
  assert.equal(demoLicenceOk({ active: true, demo: true, until: day(NOW + 30 * DAY) }, NOW), false, 'más de 7 días');
  assert.equal(demoLicenceOk({ active: true, demo: true, until: day(NOW - 2 * DAY) }, NOW), false, 'caducada');
  assert.equal(demoLicenceOk({ active: true, demo: true }, NOW), false, 'sin fecha no hay licencia de prueba eterna');
  assert.equal(demoLicenceOk({ active: false, demo: true, until: demoUntilKey(NOW) }, NOW), false);
  assert.equal(demoLicenceOk({ active: true, until: demoUntilKey(NOW) }, NOW), false, 'sin demo no es de prueba');
  assert.equal(demoLicenceOk(null, NOW), false);
});

test('acceso Pro: la licencia de prueba pasa por proAccess() y solo si es corta', () => {
  const school = { premium: { active: true, demo: true, until: demoUntilKey(NOW) } };
  assert.deepEqual(proAccess({ school, now: NOW }), { active: true, source: 'license', until: Date.parse(school.premium.until), requested: false, demo: true });
  const long = { premium: { active: true, demo: true, until: '2099-01-01' } };
  assert.equal(proAccess({ school: long, now: NOW }).active, false, 'una licencia «de prueba» de años no abre el Aula');
  const old = { premium: { active: true, demo: true, until: '2026-10-01' } };
  assert.equal(proAccess({ school: old, now: NOW }).active, false);
  assert.equal(proAccess({ school: old, now: NOW }).expired, true, 'caducada: solo lectura, como cualquier licencia');
  // Un usuario sin cuenta y sin escuela de prueba no tiene Aula
  assert.equal(proAccess({ school: null, now: NOW }).active, false);
  assert.equal(proAccess({ school: { name: 'x', ownerUid: 'anon' }, now: NOW }).active, false);
  // La licencia normal no cambia
  assert.deepEqual(proAccess({ school: { premium: { active: true, until: '2027-08-31' } }, now: NOW }), { active: true, source: 'license', until: Date.parse('2027-08-31'), requested: false });
});

test('contenido completo: el tester en modo prueba lo ve todo; sin cuenta y sin prueba, no', () => {
  assert.equal(hasFullContent({ signedIn: false, demo: true }), true);
  assert.equal(hasFullContent({ signedIn: false }), false);
  assert.equal(hasFullContent({ signedIn: true }), true);
});

// ---------- Estado local ----------
test('entrar: directo al Aula, sin bienvenida ni tutorial, con la caducidad de la licencia', () => {
  const school = { id: 'S1', code: 'ABCDEF', premium: { active: true, demo: true, until: demoUntilKey(NOW) } };
  const p = demoEntryPatch('profesor', { now: NOW, fresh: true, school });
  assert.equal(p.demo.role, 'profesor');
  assert.equal(p.demo.schoolId, 'S1');
  assert.equal(p.demo.until, demoLicenceEnd(school.premium.until));
  assert.equal(p.onboarded && p.instrumentChosen && p.tourDone && p.proTester, true);
  assert.equal(p.learnView, 'pro');
  assert.equal(p.aulaView, 'aula');
  const a = demoEntryPatch('alumno', { now: NOW });
  assert.equal(a.demo.until, NOW + DEMO_MAX_DAYS * DAY);
  assert.equal(demoSession({ demo: a.demo }).role, 'alumno');
  assert.equal(demoSession({ demo: { role: 'admin' } }), null, 'solo alumno o profesor');
  assert.equal(demoSession({}), null);
  assert.equal(demoExpired({ demo: a.demo }, NOW + 8 * DAY), true);
  assert.equal(demoExpired({ demo: a.demo }, NOW), false);
});

test('clases de prueba: 3 como mucho, con los identificadores que aceptan las reglas', () => {
  assert.equal(DEMO_CLASS_IDS.length, DEMO_MAX_CLASSES);
  assert.equal(freeDemoClassId([]), 'demo-1');
  assert.equal(freeDemoClassId([{ id: 'demo-1' }, { id: 'demo-3' }]), 'demo-2');
  assert.equal(freeDemoClassId(DEMO_CLASS_IDS.map(id => ({ id }))), null);
});

// ---------- Alumnos de ejemplo ----------
test('alumnos de ejemplo: inventados, marcados y con resúmenes que cumplen el formato de las reglas', () => {
  const tasks = [{ id: 't1', minPct: 60, to: [], due: dayKey(NOW - 3 * DAY) }, { id: 't2', minPct: 50, to: [], due: null }];
  const real = { id: 'uid-real', nickname: 'Lucía', instrument: 'violin' };
  const data = withSampleStudents({ cls: { id: 'demo-1' }, students: [real], tasks, summaries: {}, feedback: {}, works: [] }, NOW);
  const samples = data.students.filter(s => isSampleId(s.id));
  assert.equal(samples.length, 8);
  assert.ok(data.students.includes(real), 'el alumno real sigue');
  samples.forEach(s => assert.ok(s.nickname.endsWith(SAMPLE_TAG), s.nickname));
  samples.forEach(s => {
    const wire = encodeSummary(data.summaries[s.id]);
    ['days', 'tasks', 'units', 'mistakes', 'recent'].forEach(f => assert.match(wire[f], new RegExp(`^(?:${WIRE[f]})$`), `${s.id} ${f}`));
  });
  const rows = classRows({ students: data.students, tasks, summaries: data.summaries, today: dayKey(NOW) });
  const counts = filterCounts(rows);
  assert.ok(counts.inactive > 0, 'alguno sin practicar esta semana (filtro)');
  assert.ok(counts.overdue > 0, 'alguno con la tarea vencida (filtro)');
  assert.ok(rows.some(r => r.avg !== null && r.avg > 0), 'hay % en la tabla');
  assert.equal(withSampleStudents(null), null);
  // Con la clase casi llena no se pasa del tope de la prueba
  const full = Array.from({ length: DEMO_MAX_STUDENTS - 2 }, (_, i) => ({ id: `u${i}`, nickname: `A${i}` }));
  assert.equal(withSampleStudents({ students: full, tasks: [], summaries: {} }, NOW).students.length, DEMO_MAX_STUDENTS);
  assert.equal(translate('Ana (ejemplo)'), 'Ana (sample)');
});

// ---------- Reglas ----------
test('reglas: la escuela de prueba solo la crea una sesión anónima, con «demo», licencia corta y claves fijas', () => {
  const create = rule(schoolDoc(), 'create');
  assert.match(create, /!\('premium' in request\.resource\.data\) && request\.resource\.data\.students == 0\) \|\| validDemoSchool\(request\.resource\.data\);/,
    'la escuela normal sigue sin poder traer licencia');
  const v = fn('validDemoSchool');
  assert.match(v, /request\.auth\.token\.firebase\.sign_in_provider == 'anonymous'/);
  assert.match(v, /d\.ownerUid == request\.auth\.uid/);
  assert.match(v, /d\.students == 0/);
  assert.match(v, /d\.createdAt == request\.time/);
  assert.match(v, /d\.demo == true/);
  assert.match(v, /d\.premium\.keys\(\)\.hasOnly\(\['active', 'demo', 'until'\]\) && d\.premium\.active == true && d\.premium\.demo == true/);
  assert.match(v, /d\.premium\.until is string && d\.premium\.until\.matches\('\^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$'\) && demoUntilOk\(d\.premium\.until\)/);
  assert.match(fn('demoUntilOk'), /timestamp\.date\(int\(d\[0\]\), int\(d\[1\]\), int\(d\[2\]\)\) \+ duration\.value\(1, 'd'\) <= request\.time \+ duration\.value\(7, 'd'\)/);
  assert.equal(DEMO_MAX_DAYS, 7);
  // Lo que escribe el cliente cabe exactamente en las claves de las reglas
  const keys = v.match(/d\.keys\(\)\.hasOnly\(\[([^\]]*)\]\)/)[1].split(',').map(k => k.trim().replace(/'/g, ''));
  const doc = { ...demoSchoolDoc({ uid: 'u', ownerName: 'Profe de prueba', code: 'ABCDEF', year: '2026-2027', now: NOW }), createdAt: 'ts' };
  assert.deepEqual(Object.keys(doc).sort(), [...keys].sort());
  assert.ok(doc.year.length <= 9 && doc.ownerName.length <= 30);
});

test('reglas: nadie alarga ni pone una licencia de prueba después (solo el administrador toca «premium»)', () => {
  const upd = rule(schoolDoc(), 'update');
  const lists = [...upd.matchAll(/hasOnly\(\[([^\]]*)\]\)/g)].map(m => m[1]);
  const withPremium = lists.filter(l => /'premium'|'demo'/.test(l));
  assert.deepEqual(withPremium, ["'premium'"]);
  assert.match(upd, /isAdmin\(\) && request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasOnly\(\['premium'\]\)/);
});

test('reglas: en una escuela de prueba, 3 clases (identificadores fijos) y 30 alumnos por clase y en la escuela', () => {
  assert.match(rule(classDoc(), 'create'), /schoolOwner\(sid\) && aulaActive\(sid\) && validClass\(request\.resource\.data\).*&& demoClassOk\(sid, cid\);/);
  const ids = fn('demoClassOk').match(/cid in \[([^\]]*)\]/)[1].split(',').map(k => k.trim().replace(/'/g, ''));
  assert.deepEqual(ids, DEMO_CLASS_IDS);
  assert.match(fn('demoClassOk'), /^return !demoSchool\(sid\) \|\|/, 'las escuelas normales no cambian');
  assert.match(fn('demoSchool'), /get\(schoolPath\(sid\)\)\.data\.get\('premium', \{\}\)\.get\('demo', false\) == true/);
  assert.match(rule(block('students/{uid}'), 'create'), /classSeatTaken\(sid, cid\) && demoSeatOk\(sid, cid\);/);
  assert.match(fn('demoSeatOk'), /!demoSchool\(sid\) \|\| get\(classPath\(sid, cid\)\)\.data\.students < demoMaxStudents\(\)/);
  assert.match(flat, new RegExp(`function demoMaxStudents\\(\\) \\{ return ${DEMO_MAX_STUDENTS}; \\}`));
  assert.match(fn('schoolLimit'), /d\.premium\.get\('demo', false\) == true \? demoMaxStudents\(\) : 200/);
  // El Aula sigue exigiendo la licencia vigente para todo lo que escribe el profesor
  assert.match(flat, /function aulaActive\(sid\) \{ let p = get\(schoolPath\(sid\)\)\.data\.get\('premium', \{\}\); return p\.get\('active', false\) == true && \(p\.get\('until', null\) == null \|\| licenseLive\(p\.until\)\); \}/);
});

// ---------- Textos ----------
test('cada texto del modo prueba tiene su inglés', () => {
  const files = ['screens/demo.js', 'demo-api.js'].map(f => readFileSync(new URL(`../js/${f}`, import.meta.url), 'utf8'));
  const literals = files.flatMap(src => [...src.matchAll(/esc\('((?:[^'\\]|\\.)*)'\)|(?:toast|new Error)\('((?:[^'\\]|\\.)*)'\)/g)].map(m => m[1] || m[2]));
  const ternaries = files.flatMap(src => [...src.matchAll(/\? '([^']+)' : '([^']+)'/g)].flatMap(m => [m[1], m[2]]).filter(x => x.includes(' ')));
  const steps = files.flatMap(src => [...src.matchAll(/^\s*(?:profesor|alumno): \[([^\]]+)\]/gm)].flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1])));
  const texts = [...new Set([...literals, ...ternaries, ...steps])].filter(x => /\p{L}{2}/u.test(x) && !/^(alumno|profesor|demo\/has-account)$/.test(x));
  assert.ok(texts.length > 30, `solo ${texts.length} textos`);
  assert.deepEqual(texts.filter(es => translate(es) === es), []);
});
