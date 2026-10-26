// Escuelas de música (sin DOM ni red): curso escolar, libro de cada alumno, resumen de su progreso y paso de curso.
// Cada alumno está en un curso (1, 2 o 3) y ese año trabaja su libro; al empezar el curso siguiente, quien aprobó el
// examen pasa al libro siguiente. Una escuela sin licencia premium funciona en modo prueba con pocos alumnos.
export const TRIAL_STUDENTS = 5;
export const PREMIUM_STUDENTS = 200;
export const MAX_LEVEL = 3;
const SCHOOL_YEAR_START_MONTH = 8; // septiembre (los meses van de 0 a 11)

// «2026-2027»: el curso empieza en septiembre
export function schoolYear(date = new Date()) {
  const y = date.getFullYear();
  const start = date.getMonth() >= SCHOOL_YEAR_START_MONTH ? y : y - 1;
  return `${start}-${start + 1}`;
}

export function nextSchoolYear(year) {
  const start = Number(String(year).split('-')[0]) + 1;
  return `${start}-${start + 1}`;
}

// Premium vigente: activado por el administrador y no caducado
export function premiumActive(school, now = Date.now()) {
  const p = school && school.premium;
  return !!(p && p.active && (!p.until || Date.parse(p.until) >= now));
}

export const studentLimit = school => (premiumActive(school) ? PREMIUM_STUDENTS : TRIAL_STUDENTS);

// Libros que puede abrir un alumno de la escuela: el de su curso y los anteriores (para repasar), nunca los siguientes
export const schoolBookOpen = (n, level) => n <= Math.max(1, Math.min(MAX_LEVEL, level || 1));

// Resumen del progreso de un alumno en su libro: páginas pasadas, medallas y examen
export function bookSummary(book, plays) {
  const pages = book.chapters.flatMap(c => c.pages);
  const played = pages.map(pg => plays[pg.lesson.id]).filter(p => p && p.best > 0);
  const exam = pages.find(pg => pg.lesson.exam);
  const examPlay = exam ? plays[exam.lesson.id] : null;
  const gold = pages.filter(pg => { const p = plays[pg.lesson.id]; return p && p.best > 0 && (pg.lesson.kind === 'theory' || (p.good >= 5 && p.perfect)); }).length;
  return {
    book: book.n, done: played.length, total: pages.length, gold,
    examPassed: !!(examPlay && examPlay.best >= 2),
    last: played.reduce((m, p) => Math.max(m, p.last || 0), 0),
  };
}

// Al empezar el curso nuevo: quien aprobó el examen sube de libro; el resto repite curso
export function promote(level, progress) {
  return progress && progress.examPassed && progress.book === level ? Math.min(MAX_LEVEL, level + 1) : level;
}

export const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);
