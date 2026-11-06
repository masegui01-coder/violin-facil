// Modo prueba: alumnos de ejemplo (sin DOM ni red). Solo existen en el móvil del profesor de prueba, para ver de golpe
// la tabla de la clase, los filtros, la ficha del alumno y el informe trimestral. Van marcados «(ejemplo)» y nunca se
// escriben en la nube.
import { dayKey, addDays } from './aula.js';
import { encodeSummary, decodeSummary } from './aula-wire.js';
import { termOf } from './aula-report.js';
import { DEMO_MAX_STUDENTS } from './demo.js';

const SAMPLE_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Hugo', 'Irene', 'Leo'];
const SAMPLE_INSTRUMENTS = ['violin', 'flute', 'piano', 'guitar', 'violin', 'clarinet', 'piano', 'trumpet'];
const PCTS = [96, 82, 64, 45, 30, 100, 72, 18, 55, 90];
const MISTAKES = ['3M-3m', 'E4>F4', '5J-4J', 'B4>C5'];
export const SAMPLE_PREFIX = 'ejemplo-';
export const SAMPLE_TAG = '(ejemplo)';
export const isSampleId = id => String(id).startsWith(SAMPLE_PREFIX);

// Resumen de un alumno inventado tal como lo publicaría su app (formato de aula-wire.js, el que validan las reglas)
export function sampleSummaryWire(i, tasks, now = Date.now()) {
  const today = dayKey(now);
  const lazy = i % 4 === 3; // uno de cada cuatro no ha practicado esta semana (filtro «sin practicar»)
  const days = Object.fromEntries(Array.from({ length: 21 }, (_, d) => [addDays(today, -d), (d + i) % 3 === 0 && !(lazy && d < 8) ? 10 + ((i * 7 + d * 3) % 25) : 0]).filter(([, m]) => m > 0));
  const pick = k => PCTS[(i * 3 + k) % PCTS.length];
  const taskMap = Object.fromEntries(tasks.map((t, k) => {
    if (lazy && k % 2 === 0) return null; // sin empezar: si la tarea ya venció, sale como vencida
    const p = pick(k);
    return [t.id, { p, n: 1 + ((i + k) % 3), d: p >= (t.minPct || 0), l: now - (k + 1) * 36e5, o: false }];
  }).filter(Boolean));
  const skills = { ritmo: pick(1), entonacion: pick(2), lectura: pick(3), teoria: pick(4), dictado: pick(5), audicion: pick(6) };
  // Unidades de Lenguaje del nivel 1: cada uno va por una distinta, con menos % en las últimas que ha empezado
  const reached = lazy ? 1 : 2 + (i % 6);
  const units = Object.fromEntries(Array.from({ length: reached }, (_, u) => [`l1u${u + 1}`, u === reached - 1 ? Math.min(pick(u), 60) : Math.max(pick(u + 7), 70)]));
  return encodeSummary({
    nickname: `${SAMPLE_NAMES[i]} ${SAMPLE_TAG}`, instrument: SAMPLE_INSTRUMENTS[i], at: now - i * 36e5, term: termOf(new Date(now)).id,
    streak: lazy ? 0 : 1 + (i % 5), days, skills,
    mistakes: { [MISTAKES[i % MISTAKES.length]]: 2 + (i % 4), [MISTAKES[(i + 1) % MISTAKES.length]]: 1 },
    units, tasks: taskMap,
    recent: tasks.slice(0, 5).map((t, k) => ({ id: t.id, p: pick(k), at: now - (k + 1) * 36e5 })),
  });
}

// Alumnos inventados (fichas de clase), como mucho «max»
export const sampleStudents = (max = SAMPLE_NAMES.length) => SAMPLE_NAMES.slice(0, Math.max(0, max)).map((name, i) => (
  { id: `${SAMPLE_PREFIX}${i + 1}`, nickname: `${name} ${SAMPLE_TAG}`, instrument: SAMPLE_INSTRUMENTS[i], sample: true }));

// Añade a lo que se ha leído de la clase unos alumnos inventados (marcados «(ejemplo)»); no se escribe nada en la nube
export function withSampleStudents(data, now = Date.now()) {
  if (!data) return data;
  const real = (data.students || []).filter(s => !isSampleId(s.id));
  const samples = sampleStudents(DEMO_MAX_STUDENTS - real.length);
  const summaries = Object.fromEntries(samples.map((s, i) => [s.id, { ...decodeSummary(sampleSummaryWire(i, data.tasks || [], now)), id: s.id }]));
  return { ...data, students: [...real, ...samples], summaries: { ...summaries, ...(data.summaries || {}) } };
}
