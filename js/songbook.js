// Cancionero de acordes (canciones tradicionales y de dominio público). Cada canción se desbloquea
// en cuanto sabes todos sus acordes: así cada acorde nuevo abre canciones nuevas.
import { parseChord } from './chords.js';

// chart: compases separados por «|»; dos acordes en un compás se escriben «G D»
export const SONGBOOK = [
  { id: 'balada-mim', title: 'Balada en Mim', by: 'Ejercicio', time: 4, bpm: 70, chart: 'Em | Em | Am | Am | Em | Em | Am | Em' },
  { id: 'tom-dooley', title: 'Tom Dooley', by: 'Tradicional', time: 4, bpm: 90, chart: 'D | D | D | A | A | A | A | D | D | D | D | A | A | A | A | D' },
  { id: 'skip-lou', title: 'Skip to My Lou', by: 'Tradicional', time: 4, bpm: 100, chart: 'D | D | A | A | D | D | A | D' },
  { id: 'tres-mosqueteros', title: 'Los tres mosqueteros', by: 'Ejercicio', time: 4, bpm: 80, chart: 'A | D | E | A | A | D | E | A' },
  { id: 'cumple', title: 'Cumpleaños feliz', by: 'Tradicional', time: 3, bpm: 100, chart: 'G | D | D | G | G | C | G D | G' },
  { id: 'amazing-grace', title: 'Amazing Grace', by: 'Tradicional', time: 3, bpm: 84, chart: 'G | G | C | G | G | G | D | D | G | G | C | G | G | D | G | G' },
  { id: 'kumbaya', title: 'Kumbayá', by: 'Tradicional', time: 4, bpm: 80, chart: 'D | G | D | D | D | G | A | A | D | G | D | D | G | D | A | D' },
  { id: 'cucaracha', title: 'La cucaracha', by: 'Tradicional', time: 3, bpm: 140, chart: 'D | D | D | A7 | A7 | A7 | A7 | D | D | D | D | A7 | A7 | A7 | A7 | D' },
  { id: 'when-saints', title: 'When the Saints Go Marching In', by: 'Tradicional', time: 4, bpm: 110, chart: 'G | G | G | G | G | G | D7 | D7 | G | G7 | C | C | G | D7 | G | G' },
  { id: 'clementine', title: 'Clementine', by: 'Tradicional', time: 3, bpm: 110, chart: 'C | C | C | G7 | G7 | G7 | G7 | C | C | C | C | G7 | G7 | G7 | G7 | C' },
  { id: 'pop-cuatro', title: 'Los cuatro acordes del pop', by: 'Ejercicio', time: 4, bpm: 90, chart: 'C | G | Am | F | C | G | Am | F' },
  { id: 'sol-naciente', title: 'La casa del sol naciente', by: 'Tradicional', time: 3, bpm: 90, chart: 'Am | C | D | Fmaj7 | Am | C | E | E | Am | C | D | Fmaj7 | Am | E | Am | E' },
  { id: 'scarborough', title: 'Scarborough Fair', by: 'Tradicional', time: 3, bpm: 96, chart: 'Am | Am | G | Am | C | Am | D | Am | C | G | Am | G | Am | Am' },
  { id: 'rock-quintas', title: 'Riff de quintas', by: 'Ejercicio', time: 4, bpm: 100, chart: 'E5 G5 | A5 A5 | E5 G5 | D5 C5 | E5 G5 | A5 A5 | G5 E5 | E5' },
  { id: 'blues-mi', title: 'Blues en Mi', by: 'Ejercicio', time: 4, bpm: 96, chart: 'E7 | E7 | E7 | E7 | A7 | A7 | E7 | E7 | B7 | A7 | E7 | B7' },
  { id: 'pop-cejilla', title: 'Balada con cejilla', by: 'Ejercicio', time: 4, bpm: 80, chart: 'Am | F | C | G | Am | F | C | G | F | G | Em | Am | F | G | C | C' },
  { id: 'cumple-do', title: 'Cumpleaños feliz (en Do)', by: 'Tradicional', time: 3, bpm: 100, chart: 'C | G | G | C | C | F | C G | C' },
  { id: 'grace-do', title: 'Amazing Grace (en Do)', by: 'Tradicional', time: 3, bpm: 84, chart: 'C | C | F | C | C | C | G | G | C | C | F | C | C | G | C | C' },
  { id: 'kumbaya-do', title: 'Kumbayá (en Do)', by: 'Tradicional', time: 4, bpm: 80, chart: 'C | F | C | C | C | F | G | G | C | F | C | C | F | C | G | C' },
  { id: 'saints-do', title: 'When the Saints (en Do)', by: 'Tradicional', time: 4, bpm: 110, chart: 'C | C | C | C | C | C | G7 | G7 | C | C7 | F | F | C | G7 | C | C' },
  { id: 'vals-lam', title: 'Vals en Lam', by: 'Ejercicio', time: 3, bpm: 110, chart: 'Am | Am | Dm | Dm | E | E | Am | Am | Am | Am | Dm | Dm | Am | E | Am | Am' },
  // Flamenco: formas tradicionales (de todos, sin autor) para acompañar
  { id: 'cadencia-andaluza', title: 'Cadencia andaluza', by: 'Flamenco tradicional', style: 'flamenco', time: 4, bpm: 80, chart: 'Am | G | F | E | Am | G | F | E' },
  { id: 'por-tangos', title: 'Por tangos', by: 'Flamenco tradicional', style: 'flamenco', time: 4, bpm: 96, chart: 'Am | G | F | E | Am | G | F | E | Dm | Am | E | Am' },
  { id: 'rumba-flamenca', title: 'Rumba flamenca', by: 'Flamenco tradicional', style: 'flamenco', time: 4, bpm: 112, chart: 'Am | G | F | E | Am | G | F E | Am' },
  { id: 'por-medio', title: 'Toque por medio', by: 'Flamenco tradicional', style: 'flamenco', time: 4, bpm: 84, chart: 'Dm | C | Bb | A | Dm | C | Bb | A' },
  { id: 'sim-cejilla', title: 'Sim en movimiento', by: 'Ejercicio', time: 4, bpm: 80, chart: 'D | Bm | G | A | D | Bm | G | A' },
];

// [{ chords: ['G'], beats: 3 }, …] a partir del «chart»
export function parseChart(chart, time) {
  return chart.split('|').map(b => b.trim()).filter(Boolean).flatMap(bar => {
    const list = bar.split(/\s+/);
    return list.map(name => ({ chord: name, beats: time / list.length }));
  });
}

export const chordsOf = entry => [...new Set(parseChart(entry.chart, entry.time).map(x => x.chord))];

export function songbookStatus(known, entries = SONGBOOK) {
  const set = new Set(known);
  return entries.map(entry => ({ entry, missing: chordsOf(entry).filter(c => !set.has(c)) }));
}

export const playableCount = known => songbookStatus(known).filter(s => !s.missing.length).length;

// Lección de rasgueo a tempo con el cifrado de la canción
export function songbookLesson(entry) {
  const chart = parseChart(entry.chart, entry.time);
  chart.forEach(x => parseChord(x.chord));
  return { id: 'sb-' + entry.id, kind: 'chords', mode: 'strum', title: entry.title, sub: entry.by, chart, bpm: entry.bpm, time: entry.time, chords: chordsOf(entry), songbook: entry.id };
}

export const songbookById = id => SONGBOOK.find(s => s.id === id);
