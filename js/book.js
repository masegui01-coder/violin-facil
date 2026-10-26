// Modo libro: el curso de cada instrumento como un método de toda la vida (capítulos y páginas numeradas),
// pero con medallas que premian repetir: bronce al pasarla, plata al repetirla bien y oro al dominarla.
// Sin DOM: reglas puras para poder probarlas.
import { parseScore } from './music.js';
import { lessonMeta } from './course.js';
import { octaveShiftFor } from './songs.js';
import { parseChart } from './songbook.js';
import { rng, rhythmReading } from './generate.js';

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
// ---------- Contenido del libro: partituras, novedades de cada capítulo y repaso final ----------

const REVIEW_BARS = 8;
const REVIEW_BPM = 72;
const MIN_POOL = 3;
const NEW_NOTE_EVERY = 3; // cada tres notas, una de las nuevas del capítulo
const CELLS = [
  [[1, 1], [2], [1, 1], [2]],
  [[1, 1], [2], [0.5, 0.5, 1], [1.5, 0.5], [1, 0.5, 0.5]],
  [[0.5, 0.5, 0.5, 0.5], [1.5, 0.5], [0.75, 0.25, 1], [0.5, 0.5, 1], [2], [1, 1]],
];
const DUR = { 4: 'w', 3: 'h.', 2: 'h', 1.5: 'q.', 1: 'q', 0.75: 'e.', 0.5: 'e', 0.25: 's' };
const ACC_TXT = { 1: '#', '-1': 'b', 0: '' };

// Partitura analizada de una página (con el cambio de octava de las canciones de la biblioteca) o null
export function pageScore(lesson, inst) {
  if (!['notes', 'song'].includes(lesson.kind)) return null;
  const meta = lessonMeta(lesson);
  if (!meta) return null;
  const score = meta.parsed ? structuredClone(meta.parsed) : parseScore(meta.score);
  const shift = lesson.songId && inst ? (octaveShiftFor(meta, inst) ?? 0) : 0;
  if (shift) score.notes.forEach(n => { if (!n.rest) { n.midi += shift; n.oct += shift / 12; } });
  return { score, key: meta.key || 'C', time: meta.time || 4, bpm: meta.bpm || REVIEW_BPM, title: meta.title };
}

// Trozo de partitura (para escribirla en renglones de pocos compases, como en un libro)
export function sliceScore(score, fromBar, count) {
  const bars = score.bars.slice(fromBar, fromBar + count);
  if (!bars.length) return null;
  const offset = bars[0].start;
  const end = bars[bars.length - 1].start + bars[bars.length - 1].beats;
  return {
    bars: bars.map(b => ({ ...b, start: b.start - offset })),
    notes: score.notes.filter(n => n.start >= offset - 1e-6 && n.start < end - 1e-6).map(n => ({ ...n, start: n.start - offset })),
    totalBeats: end - offset,
  };
}

const ownNotes = (pages, inst) => pages.flatMap(pg => {
  if (pg.lesson.songId) return []; // las canciones de la biblioteca no cuentan como notas «enseñadas»
  const s = pageScore(pg.lesson, inst);
  return s ? s.score.notes.filter(n => !n.rest) : [];
});
const ownChords = pages => pages.flatMap(pg => (pg.lesson.kind === 'chords' ? pg.lesson.chords || [] : []));
const uniqueByMidi = notes => [...new Map(notes.map(n => [n.midi, n])).values()].sort((a, b) => a.midi - b.midi);

// Lo nuevo de cada capítulo: notas y acordes que no habían salido antes
export function chapterNews(book, inst) {
  const seenNotes = new Set();
  const seenChords = new Set();
  return book.map(chapter => {
    const notes = uniqueByMidi(ownNotes(chapter.pages, inst)).filter(n => !seenNotes.has(n.midi));
    const chords = [...new Set(ownChords(chapter.pages))].filter(c => !seenChords.has(c));
    notes.forEach(n => seenNotes.add(n.midi));
    chords.forEach(c => seenChords.add(c));
    return { notes, chords };
  });
}

function reviewMelody(pool, fresh, level, seed, key) {
  const r = rng(seed);
  const cells = CELLS[level];
  const home = pool[0];
  let idx = Math.floor(pool.length / 2);
  const tokens = [];
  let count = 0;
  const tok = (n, beats) => `${n.letter}${ACC_TXT[n.acc] || ''}${n.oct}${DUR[beats]}`;
  for (let b = 0; b < REVIEW_BARS; b++) {
    if (b === REVIEW_BARS - 1) { tokens.push([tok(home, 4)]); break; }
    const bar = [];
    let left = 4;
    while (left > 0) {
      const fits = cells.filter(c => c.reduce((s, x) => s + x, 0) <= left);
      const cell = fits.length ? fits[Math.floor(r() * fits.length)] : [left];
      cell.forEach(beats => {
        count++;
        if (fresh.length && count % NEW_NOTE_EVERY === 0) idx = pool.indexOf(fresh[Math.floor(r() * fresh.length)]);
        else idx = Math.max(0, Math.min(pool.length - 1, idx + (r() < 0.2 ? 2 : 1) * (r() < 0.5 ? -1 : 1)));
        bar.push(tok(pool[idx], beats));
      });
      left -= cell.reduce((s, x) => s + x, 0);
    }
    tokens.push(bar);
  }
  return { title: 'Repaso del capítulo', key, time: 4, bpm: REVIEW_BPM, score: '| ' + tokens.map(t => t.join(' ')).join(' | ') + ' |' };
}

// Página final de cada capítulo: un repaso nuevo con lo aprendido (melodía, acordes o ritmo según el instrumento)
export function reviewLesson(chapter, index, news, cumulativeNotes, inst) {
  const id = `${chapter.id}-repaso`;
  const base = { id, title: 'Repaso del capítulo', chapterReview: true };
  const level = Math.min(2, Math.floor(index / 3));
  const chords = [...new Set(ownChords(chapter.pages))];
  if (inst.rhythmOnly) {
    if (!chapter.pages.some(pg => pg.lesson.kind === 'song')) return null;
    return { ...base, kind: 'song', sub: 'Una lectura nueva con los ritmos del capítulo', song: { ...rhythmReading(level + 1, 500 + index), title: 'Repaso del capítulo' } };
  }
  if (chords.length >= 2) {
    const chart = Array.from({ length: REVIEW_BARS }, (_, i) => chords[i % chords.length]).join(' | ');
    return { ...base, kind: 'chords', mode: 'strum', sub: 'Todos los acordes del capítulo, a tempo', chart: parseChart(chart, 4), bpm: 70, time: 4, chords };
  }
  const pool = uniqueByMidi(cumulativeNotes).filter(n => n.midi >= inst.written[0] && n.midi <= inst.written[1]);
  const fresh = news.notes.filter(n => pool.some(p => p.midi === n.midi)).map(n => pool.find(p => p.midi === n.midi));
  if (pool.length < MIN_POOL || !ownNotes(chapter.pages, inst).length) return null;
  const key = (chapter.pages.map(pg => pg.lesson.song && pg.lesson.song.key).find(Boolean)) || 'C';
  const recent = pool.slice(Math.max(0, pool.length - 8));
  return { ...base, kind: 'song', sub: 'Melodía nueva con las notas que ya sabes', song: reviewMelody(fresh.length ? uniqueByMidi([...recent, ...fresh]) : recent, fresh, level, 900 + index, key) };
}

// Libro completo de un instrumento: capítulos con sus novedades y una página de repaso al final
export function buildFullBook(course, inst) {
  const book = buildBook(course);
  const news = chapterNews(book, inst);
  const cumulative = [];
  let page = 0;
  return book.map((chapter, i) => {
    cumulative.push(...ownNotes(chapter.pages, inst));
    const review = reviewLesson(chapter, i, news[i], cumulative, inst);
    const pages = [...chapter.pages, ...(review ? [{ lesson: review }] : [])].map(pg => ({ ...pg, number: ++page }));
    return { ...chapter, pages, news: news[i] };
  });
}
