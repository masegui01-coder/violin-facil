// Los tres libros de cada instrumento (sin DOM):
// Libro 1 · Iniciación: el curso, con lenguaje musical en cada capítulo y ejercicios numerados generados con sus notas.
// Libro 2 · Elemental y Libro 3 · Intermedio: capítulos por tonalidad con lenguaje musical, técnica del instrumento,
// escalas y arpegios, lecturas, progresiones de acordes o ritmos (según el instrumento) y un concierto.
// Cada libro termina con un examen (teoría + interpretación) y un glosario; aprobarlo abre el siguiente.
import { buildFullBook, pageScore } from './book.js';
import { LANGUAGE, GLOSSARY, TECHNIQUE, FAMILY_OF } from './book-theory.js';
import { technique, sightReading, rhythmReading, rng, keyLabel } from './generate.js';
import { SONGS, octaveShiftFor } from './songs.js';
import { SONGBOOK, songbookLesson, parseChart, chordsOf } from './songbook.js';
import { chordShape, isFretted } from './chords.js';

export const BOOK_INFO = [
  { n: 1, title: 'Libro 1 · Iniciación', sub: 'Tus primeras notas, ritmos y canciones' },
  { n: 2, title: 'Libro 2 · Elemental', sub: 'Tonalidades, articulación, escalas y repertorio' },
  { n: 3, title: 'Libro 3 · Intermedio', sub: 'Todas las tonalidades, técnica avanzada y concierto' },
];
export const EXAM_PASS_STARS = 2;
const CHAPTERS = 8;
const EXERCISES_B1 = 5;
const BPM = { 2: 80, 3: 100 };
const KEYS = { 2: ['G', 'F', 'D', 'Bb', 'A', 'Eb', 'C', 'E'], 3: ['Ab', 'B', 'Db', 'E', 'F#', 'Bb', 'D', 'G'] };
const GLOSSARY_PER_CARD = 5;
const DUR = { 4: 'w', 3: 'h.', 2: 'h', 1.5: 'q.', 1: 'q', 0.5: 'e' };
const ACC_TXT = { 1: '#', '-1': 'b', 0: '' };

// Progresiones para guitarra, ukelele y piano (todas con forma de acorde en los dos instrumentos de trastes)
const PROGRESSIONS = {
  2: [
    { key: 'G', name: 'Sol mayor', chords: ['G', 'Em', 'C', 'D', 'G', 'C', 'D7', 'G'] },
    { key: 'C', name: 'Do mayor', chords: ['C', 'Am', 'F', 'G', 'C', 'Dm', 'G7', 'C'] },
    { key: 'D', name: 'Re mayor', chords: ['D', 'Bm', 'G', 'A', 'D', 'Em', 'A7', 'D'] },
    { key: 'A', name: 'La mayor', chords: ['A', 'F#m', 'D', 'E', 'A', 'D', 'E7', 'A'] },
    { key: 'Am', name: 'La menor', chords: ['Am', 'Dm', 'E', 'Am', 'F', 'G', 'E7', 'Am'] },
    { key: 'Em', name: 'Mi menor', chords: ['Em', 'Am', 'B7', 'Em', 'C', 'D', 'B7', 'Em'] },
    { key: 'F', name: 'Fa mayor', chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Gm', 'C7', 'F'] },
    { key: 'E', name: 'Mi mayor', chords: ['E', 'C#m', 'A', 'B7', 'E', 'A', 'B7', 'E'] },
  ],
  3: [
    { key: 'C', name: 'jazz en Do', chords: ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'G7'] },
    { key: 'G', name: 'jazz en Sol', chords: ['Gmaj7', 'Em7', 'Am7', 'D7', 'Gmaj7', 'Em7', 'Am7', 'D7'] },
    { key: 'A', name: 'blues en La', chords: ['A7', 'A7', 'D7', 'A7', 'E7', 'D7', 'A7', 'E7'] },
    { key: 'Dm', name: 'Re menor', chords: ['Dm', 'Gm', 'A7', 'Dm', 'Bb', 'C', 'A7', 'Dm'] },
    { key: 'Gm', name: 'Sol menor', chords: ['Gm', 'Cm', 'D7', 'Gm', 'Bb', 'F', 'D7', 'Gm'] },
    { key: 'D', name: 'suspendidos en Re', chords: ['D', 'Dsus4', 'D', 'A', 'Asus4', 'A', 'G', 'D'] },
    { key: 'Fm', name: 'Fa menor', chords: ['Fm', 'Bb', 'C7', 'Fm', 'Fm', 'Bb', 'C7', 'Fm'] },
    { key: 'Em', name: 'andaluza en Mi', chords: ['Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'E'] },
  ],
};

const isChordInstrument = inst => isFretted(inst.id);
const kindOfInstrument = inst => (inst.rhythmOnly ? 'rhythm' : isChordInstrument(inst) ? 'fretted' : inst.id === 'piano' ? 'piano' : 'melodic');
const familyOf = inst => FAMILY_OF[inst.family] || 'madera';

// ---------- Piezas ----------
const theoryPage = (id, title, sub, cards, quiz = [], extra = {}) => ({ id, kind: 'theory', title, sub, cards, quiz, ...extra });
const songPage = (id, title, sub, song, extra = {}) => ({ id, kind: 'song', title, sub, song: { ...song, title }, ...extra });
const chartPage = (id, title, sub, chords, { time = 4, bpm = 72, perBar = 1 } = {}) => {
  const bars = [];
  for (let i = 0; i < chords.length; i += perBar) bars.push(chords.slice(i, i + perBar).join(' '));
  const chart = parseChart(bars.join(' | '), time);
  return { id, kind: 'chords', mode: 'strum', title, sub, chart, bpm, time, chords: [...new Set(chords)] };
};
const changesPage = (id, a, b, target) => ({ id, kind: 'chords', mode: 'changes', title: `Cambios {${a}}–{${b}}`, sub: `Un minuto: ¿cuántos cambios? Meta: ${target}`, pair: [a, b], chords: [a, b], target });

const languagePage = (prefix, topic) => theoryPage(`${prefix}-${topic.id}`, `Lenguaje musical: ${topic.title}`, 'Teoría con preguntas', topic.cards, topic.quiz, { language: true });

// Melodía corta con las notas que ya conoces (ejercicios numerados del libro 1)
const VARIATIONS = [
  { name: 'Ritmo nuevo', cells: [[1, 1], [2], [1, 1, 2]], leap: 0.1 },
  { name: 'Saltos', cells: [[1, 1], [2]], leap: 0.6 },
  { name: 'Notas largas', cells: [[4], [2, 2]], leap: 0.2 },
  { name: 'Con corcheas', cells: [[0.5, 0.5, 1], [1, 1], [0.5, 0.5, 0.5, 0.5]], leap: 0.2 },
  { name: 'Eco', cells: [[1, 1], [2]], leap: 0.2, echo: true },
];
function melody(pool, fresh, { seed, cells, leap, echo, bars = 4 }) {
  const r = rng(seed);
  const tok = (n, beats) => `${n.letter}${ACC_TXT[n.acc] || ''}${n.oct}${DUR[beats]}`;
  let idx = Math.floor(pool.length / 2);
  const makeBar = () => {
    const out = [];
    let left = 4;
    while (left > 0) {
      const fits = cells.filter(c => c.reduce((s, x) => s + x, 0) <= left);
      const cell = fits.length ? fits[Math.floor(r() * fits.length)] : [left];
      cell.forEach(beats => {
        const step = r() < leap ? 2 + Math.floor(r() * 2) : 1;
        idx = fresh.length && r() < 0.3 ? pool.indexOf(fresh[Math.floor(r() * fresh.length)]) : Math.max(0, Math.min(pool.length - 1, idx + step * (r() < 0.5 ? -1 : 1)));
        out.push(tok(pool[idx], beats));
      });
      left -= cell.reduce((s, x) => s + x, 0);
    }
    return out.join(' ');
  };
  const list = [];
  for (let b = 0; b < bars - 1; b++) list.push(echo && b % 2 === 1 ? list[b - 1] : makeBar());
  list.push(tok(pool[0], 4));
  return '| ' + list.join(' | ') + ' |';
}

const uniqueByMidi = notes => [...new Map(notes.map(n => [n.midi, n])).values()].sort((a, b) => a.midi - b.midi);

// ---------- Libro 1 ----------
function bookOne(course, inst) {
  const base = buildFullBook(course, inst);
  const kind = kindOfInstrument(inst);
  const topics = LANGUAGE[1];
  let exerciseNo = 0;
  const cumulative = [];
  const chapters = base.map((chapter, ci) => {
    const own = chapter.pages.filter(pg => !pg.lesson.songId).flatMap(pg => { const s = pageScore(pg.lesson, inst); return s ? s.score.notes.filter(n => !n.rest) : []; });
    cumulative.push(...own);
    const pool = uniqueByMidi(cumulative).filter(n => n.midi >= inst.written[0] && n.midi <= inst.written[1]).slice(-9);
    const fresh = chapter.news.notes.filter(n => pool.some(p => p.midi === n.midi)).map(n => pool.find(p => p.midi === n.midi));
    const extra = [];
    const chords = [...new Set(chapter.pages.flatMap(pg => (pg.lesson.kind === 'chords' ? pg.lesson.chords || [] : [])))].filter(c => !inst || !isChordInstrument(inst) || chordShape(c, inst.id));
    if (kind === 'rhythm') {
      for (let k = 0; k < 3; k++) {
        const rr = rhythmReading(Math.min(3, 1 + Math.floor(ci / 3)), 7000 + ci * 10 + k);
        extra.push(songPage(`${chapter.id}-ej${k + 1}`, `Ejercicio ${++exerciseNo}: lectura rítmica`, 'Cuenta en voz alta y mantén el pulso', rr));
      }
    } else if (chords.length >= 2) {
      extra.push(chartPage(`${chapter.id}-ej1`, `Ejercicio ${++exerciseNo}: dos acordes por compás`, 'Cambia en el pulso 3', [...chords, ...chords, ...chords, ...chords].slice(0, 16), { perBar: 2, bpm: 66 }));
      extra.push(chartPage(`${chapter.id}-ej2`, `Ejercicio ${++exerciseNo}: en tres por cuatro`, 'Abajo-arriba-arriba: un-dos-tres', [...chords, ...chords].slice(0, 8), { time: 3, bpm: 80 }));
      extra.push(changesPage(`${chapter.id}-ej3`, chords[chords.length - 2], chords[chords.length - 1], 25));
    }
    if (kind !== 'rhythm' && pool.length >= 3 && own.length) {
      VARIATIONS.slice(0, chords.length >= 2 ? 2 : EXERCISES_B1).forEach((v, k) => {
        extra.push(songPage(`${chapter.id}-mel${k + 1}`, `Ejercicio ${++exerciseNo}: ${v.name.toLowerCase()}`, fresh.length ? 'Con las notas nuevas del capítulo' : 'Con las notas que ya sabes',
          { key: 'C', time: 4, bpm: 72, score: melody(pool, fresh, { ...v, seed: 3000 + ci * 17 + k, bars: v.cells[0][0] === 4 ? 4 : 8 }) }));
      });
    }
    const topic = topics[ci];
    const firstTheory = chapter.pages.findIndex(pg => pg.lesson.kind === 'theory');
    const at = firstTheory >= 0 ? firstTheory + 1 : 0;
    const review = chapter.pages.findIndex(pg => pg.lesson.chapterReview);
    const end = review >= 0 ? review : chapter.pages.length;
    const lessons = chapter.pages.map(pg => pg.lesson);
    const ordered = [...lessons.slice(0, at), ...(topic ? [languagePage('b1', topic)] : []), ...lessons.slice(at, end), ...extra, ...lessons.slice(end)];
    return { ...chapter, lessons: ordered };
  });
  // los temas de lenguaje musical que no caben en los capítulos van en el último
  const leftover = topics.slice(base.length).map(t => languagePage('b1', t));
  if (leftover.length) chapters[chapters.length - 1].lessons.splice(1, 0, ...leftover);
  return chapters;
}

// ---------- Libros 2 y 3 ----------
function repertoire(level, inst, used) {
  const fits = s => !used.has(s.id) && octaveShiftFor(s, inst) !== null;
  const order = level === 2 ? [2, 1] : [3, 2];
  return order.flatMap(d => SONGS.filter(s => s.difficulty === d && fits(s)));
}

function advancedBook(level, inst, usedSongs, usedSongbook) {
  const kind = kindOfInstrument(inst);
  const fam = familyOf(inst);
  const topics = LANGUAGE[level];
  const techs = TECHNIQUE[fam][level];
  const songs = repertoire(level, inst, usedSongs);
  const sbs = SONGBOOK.filter(e => !usedSongbook.has(e.id) && chordsOf(e).every(c => !isChordInstrument(inst) || chordShape(c, inst.id)));
  const keys = KEYS[level].map(k => (technique('scale', k, inst, BPM[level]) ? k : null));
  const fallbackKeys = ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb'].filter(k => technique('scale', k, inst, BPM[level]));
  let exerciseNo = 0;
  const p = `b${level}`;
  const chapters = [];
  for (let c = 0; c < CHAPTERS; c++) {
    const id = `${p}-c${c + 1}`;
    const key = keys[c] || fallbackKeys[c % Math.max(1, fallbackKeys.length)] || 'C';
    const lessons = [];
    const topic = topics[c % topics.length];
    lessons.push(languagePage(p, topic));
    const [tTitle, tText] = techs[c % techs.length];
    lessons.push(theoryPage(`${id}-tec`, `Técnica: ${tTitle}`, 'Para tu instrumento', [{ title: tTitle, text: tText }]));
    const prog = PROGRESSIONS[level][c % PROGRESSIONS[level].length];
    if (kind === 'rhythm') {
      for (let k = 0; k < 5; k++) lessons.push(songPage(`${id}-r${k + 1}`, `Ejercicio ${++exerciseNo}: lectura rítmica`, k < 2 ? 'Primero lento, contando en voz alta' : 'A tempo y sin pararte', rhythmReading(level, level * 1000 + c * 10 + k)));
    } else {
      if (kind !== 'fretted' || technique('scale', key, inst, BPM[level])) {
        ['scale', 'arpeggio', ...(level === 3 || c >= 4 ? ['thirds'] : [])].forEach(t => {
          const tech = technique(t, kind === 'fretted' ? prog.key.replace('m', '') || key : key, inst, BPM[level]) || technique(t, key, inst, BPM[level]);
          if (tech) lessons.push(songPage(`${id}-${t}`, `Ejercicio ${++exerciseNo}: ${tech.title.toLowerCase()}`, 'Primero lento y ligado; después picado y a tempo', tech));
        });
      }
      if (kind === 'fretted' || kind === 'piano') {
        lessons.push(chartPage(`${id}-prog`, `Ejercicio ${++exerciseNo}: progresión en ${prog.name}`, 'Un acorde por compás, rasgueo ↓ ↓↑ ↑↓↑', prog.chords, { bpm: level === 2 ? 76 : 92 }));
        const pair = prog.chords.filter((x, i, a) => a.indexOf(x) === i).slice(-2);
        if (pair.length === 2 && kind === 'fretted') lessons.push(changesPage(`${id}-cambios`, pair[0], pair[1], level === 2 ? 30 : 40));
        if (kind === 'fretted') lessons.push(chartPage(`${id}-prog3`, `Ejercicio ${++exerciseNo}: ${prog.name} en tres por cuatro`, 'Bajo en el uno y acorde en el dos y el tres', prog.chords, { time: 3, bpm: level === 2 ? 84 : 100 }));
      }
      const readings = kind === 'fretted' ? 2 : 3;
      for (let k = 0; k < readings; k++) {
        const sr = sightReading(kind === 'fretted' ? level - 1 : level, inst, level * 1000 + c * 10 + k);
        lessons.push(songPage(`${id}-lec${k + 1}`, `Ejercicio ${++exerciseNo}: lectura`, `${keyLabel(sr.key)} · léela antes de tocar`, sr));
      }
    }
    // Concierto: repertorio (o el cancionero en guitarra y ukelele); si no queda, un estudio de concierto
    let concert;
    if (kind === 'fretted' && sbs.length) {
      const entry = sbs.shift();
      usedSongbook.add(entry.id);
      concert = { ...songbookLesson(entry), id: `${id}-concierto`, sub: `${entry.by} · concierto del capítulo`, concert: true };
    } else if (songs.length) {
      const song = songs.shift();
      usedSongs.add(song.id);
      concert = { id: `${id}-concierto`, kind: 'song', songId: song.id, sub: `${song.by} · concierto del capítulo`, concert: true };
    } else if (kind === 'rhythm') {
      concert = songPage(`${id}-concierto`, 'Estudio de concierto', 'Para tocar con la banda', rhythmReading(3, level * 1000 + c * 10 + 9), { concert: true });
    } else {
      concert = songPage(`${id}-concierto`, `Estudio de concierto n.º ${c + 1}`, 'Para tocar con la banda', sightReading(3, inst, level * 1000 + c * 10 + 9), { concert: true });
    }
    lessons.push(concert);
    const title = kind === 'rhythm' ? `${techs[c % techs.length][0]}` : kind === 'fretted' ? `Acordes: ${prog.name}` : keyLabel(key);
    chapters.push({ id, number: c + 1, title, sub: topic.title, color: `var(--u${(c % 8) + 1})`, lessons });
  }
  return chapters;
}

// Capítulo final de cada libro: examen de teoría (70 % para aprobar), prueba de interpretación y glosario
function examChapter(level, inst, number) {
  const kind = kindOfInstrument(inst);
  const p = `b${level}`;
  const questions = LANGUAGE[level].flatMap(t => t.quiz);
  const glossary = GLOSSARY[level];
  const cards = [];
  for (let i = 0; i < glossary.length; i += GLOSSARY_PER_CARD) {
    const part = glossary.slice(i, i + GLOSSARY_PER_CARD);
    cards.push({ title: `${part[0][0]} … ${part[part.length - 1][0]}`, text: part.map(([t, d]) => `${t}: ${d}`).join(' · ') });
  }
  const performance = kind === 'rhythm'
    ? songPage(`${p}-prueba`, 'Examen: prueba de interpretación', 'Una lectura rítmica nueva, de una sola vez', rhythmReading(Math.min(3, level), level * 1000 + 999), { oneTake: true })
    : kind === 'fretted' && level === 1
      ? chartPage(`${p}-prueba`, 'Examen: prueba de interpretación', 'Los acordes del libro, a tempo', ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'].filter(c => chordShape(c, inst.id)), { bpm: 76 })
      : songPage(`${p}-prueba`, 'Examen: prueba de interpretación', 'Una lectura nueva, de una sola vez', sightReading(Math.max(1, kind === 'fretted' ? level - 1 : level), inst, level * 1000 + 998), { oneTake: true });
  return {
    id: `${p}-examen`, number, title: 'Examen final', sub: 'Teoría, interpretación y glosario', color: 'var(--u8)',
    lessons: [
      theoryPage(`${p}-examen-teoria`, 'Examen: lenguaje musical', `${questions.length} preguntas · aprueba con el 70 %`,
        [{ title: 'Cómo es el examen', text: `Repasa las preguntas de todo el libro. Con el 70 % de aciertos apruebas${level < 3 ? ` y se abre el Libro ${level + 1}` : ''}. Puedes repetirlo las veces que quieras.` }],
        questions, { exam: true }),
      performance,
      theoryPage(`${p}-glosario`, 'Glosario', 'Las palabras del libro', cards),
    ],
  };
}

// Biblioteca completa de un instrumento: tres libros con capítulos y páginas numeradas
export function buildLibrary(course, inst) {
  const b1 = bookOne(course, inst);
  const usedSongs = new Set(b1.flatMap(c => c.lessons.map(l => l.songId).filter(Boolean)));
  const usedSongbook = new Set(b1.flatMap(c => c.lessons.map(l => l.songbook).filter(Boolean)));
  const raw = [b1, advancedBook(2, inst, usedSongs, usedSongbook), advancedBook(3, inst, usedSongs, usedSongbook)];
  return raw.map((chapters, bi) => {
    const all = [...chapters, examChapter(bi + 1, inst, chapters.length + 1)];
    let page = 0;
    return {
      ...BOOK_INFO[bi],
      chapters: all.map(ch => ({
        id: ch.id, number: ch.number, title: ch.title, sub: ch.sub, color: ch.color, news: ch.news || { notes: [], chords: [] },
        pages: ch.lessons.map(lesson => ({ number: ++page, lesson })),
      })),
    };
  });
}

// ¿Está abierto el libro n? El primero siempre; los demás, al aprobar el examen del anterior (o si se abren a mano)
export function bookOpen(n, plays, { unlockAll = false, unlocked = {} } = {}) {
  if (n === 1 || unlockAll || unlocked[n]) return true;
  const exam = plays[`b${n - 1}-examen-teoria`];
  return !!exam && exam.best >= EXAM_PASS_STARS;
}
