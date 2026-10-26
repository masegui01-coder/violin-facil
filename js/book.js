// Modo libro: el curso de cada instrumento como un método de toda la vida (capítulos y páginas numeradas),
// pero con medallas que premian repetir: bronce al pasarla, plata al repetirla bien y oro al dominarla.
// Sin DOM: reglas puras para poder probarlas.

export const MEDALS = ['none', 'bronze', 'silver', 'gold'];
export const MEDAL_NAME = { none: 'Sin empezar', bronze: 'Bronce', silver: 'Plata', gold: 'Oro' };
export const SILVER_GOOD = 3; // veces con 2 estrellas o más
export const GOLD_GOOD = 5;
export const REPEAT_XP = 5; // cada repaso de una página ya pasada
export const REVIEW_MULTIPLIER = 2; // la página del repaso de hoy vale el doble

// Capítulos = unidades del curso; páginas = sus lecciones (sin los huecos de «Tu música»), numeradas seguidas
export function buildBook(course) {
  let page = 0;
  return course.map((unit, ci) => ({
    id: unit.id, number: ci + 1, title: unit.title, sub: unit.sub, color: unit.color,
    pages: unit.lessons.filter(l => !l.slot && !l.pill).map(lesson => ({ number: ++page, lesson })),
  }));
}

// Lo que se guarda de cada página: veces tocada, veces bien (2★+), mejor nota, si salió perfecta y cuándo
export function recordPlay(prev, { stars, perfect, at }) {
  const p = prev || { plays: 0, good: 0, best: 0, perfect: false, last: 0 };
  return { plays: p.plays + 1, good: p.good + (stars >= 2 ? 1 : 0), best: Math.max(p.best, stars), perfect: p.perfect || !!perfect, last: at };
}

// Las páginas de teoría no se «repiten»: leerlas da el oro
export function medalOf(p, kind) {
  if (!p || !p.best) return 'none';
  if (kind === 'theory') return 'gold';
  if (p.good >= GOLD_GOOD && p.perfect) return 'gold';
  if (p.good >= SILVER_GOOD) return 'silver';
  return 'bronze';
}

// Qué falta para la siguiente medalla, en una frase
export function nextGoal(p, kind) {
  const medal = medalOf(p, kind);
  if (medal === 'none') return kind === 'theory' ? 'Léela para conseguir el oro' : 'Tócala para conseguir el bronce';
  if (medal === 'bronze') { const left = SILVER_GOOD - p.good; return `Tócala ${left} ${left === 1 ? 'vez' : 'veces'} más con 2 estrellas para la plata`; }
  if (medal === 'silver') {
    const left = Math.max(0, GOLD_GOOD - p.good);
    return left ? `${left} ${left === 1 ? 'repaso' : 'repasos'} más con 2 estrellas${p.perfect ? '' : ' y una perfecta (3 estrellas al 100 %)'} para el oro` : 'Sácala perfecta (3 estrellas al 100 %) para el oro';
  }
  return '¡Dominada! Repasarla sigue dando puntos';
}

export function chapterStats(chapter, plays) {
  const medals = chapter.pages.map(pg => medalOf(plays[pg.key || pg.lesson.id], pg.lesson.kind));
  const count = m => medals.filter(x => x === m).length;
  return {
    total: medals.length, started: medals.filter(m => m !== 'none').length,
    bronze: count('bronze'), silver: count('silver'), gold: count('gold'),
    stamp: medals.every(m => m !== 'none') ? (medals.every(m => m === 'gold') ? 'gold' : 'done') : null,
  };
}

// Repaso de hoy: la página empezada (sin oro) que hace más tiempo que no tocas, y nunca una de hoy
export function reviewPage(book, plays, dayStart) {
  const candidates = book.flatMap(c => c.pages.map(pg => ({ chapter: c, page: pg, p: plays[pg.key || pg.lesson.id] })))
    .filter(x => x.page.lesson.kind !== 'theory' && x.p && x.p.best > 0 && medalOf(x.p, x.page.lesson.kind) !== 'gold' && x.p.last < dayStart);
  return candidates.sort((a, b) => a.p.last - b.p.last)[0] || null;
}
