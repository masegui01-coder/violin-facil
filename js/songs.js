// Repertorio por estilos. Solo melodías de dominio público o composiciones originales de la app.
// Partitura: notas con duración (w redonda, h blanca, q negra, e corchea, s semicorchea, "." puntillo), R = silencio.

import { getState } from './store.js';
import { parseScore } from './music.js';

export const STYLES = [
  { id: 'clasica', name: 'Clásica', blurb: 'Beethoven, Mozart, Dvořák, Bach…', color: 'var(--st-clasica)' },
  { id: 'folk', name: 'Folk y country', blurb: 'Melodías tradicionales de las islas y de América', color: 'var(--st-folk)' },
  { id: 'jazz', name: 'Jazz y blues', blurb: 'Nueva Orleans, ragtime y blues', color: 'var(--st-jazz)' },
  { id: 'rock', name: 'Rock y pop', blurb: 'Riffs y baladas originales de la app', color: 'var(--st-rock)' },
  { id: 'navidad', name: 'Navidad', blurb: 'Villancicos de siempre', color: 'var(--st-navidad)' },
  { id: 'populares', name: 'Populares', blurb: 'Canciones que todo el mundo conoce', color: 'var(--st-populares)' },
];

export const DIFFICULTY = { 1: 'Inicial', 2: 'Intermedio', 3: 'Avanzado' };

export const SONGS = [
  // ---------- Clásica ----------
  { id: 'oda', title: 'Himno de la Alegría', by: 'L. van Beethoven', style: 'clasica', difficulty: 1, key: 'D', time: 4, bpm: 84,
    score: '| F#4q F#4q G4q A4q | A4q G4q F#4q E4q | D4q D4q E4q F#4q | F#4q. E4e E4h | F#4q F#4q G4q A4q | A4q G4q F#4q E4q | D4q D4q E4q F#4q | E4q. D4e D4h |' },
  { id: 'canon', title: 'Canon', by: 'J. Pachelbel', style: 'clasica', difficulty: 1, key: 'D', time: 4, bpm: 66,
    score: '| F#5h E5h | D5h C#5h | B4h A4h | B4h C#5h | D5h C#5h | B4h A4h | G4h F#4h | G4h E4h | D4w |' },
  { id: 'nuevo-mundo', title: 'Sinfonía del Nuevo Mundo (Largo)', by: 'A. Dvořák', style: 'clasica', difficulty: 1, key: 'D', time: 4, bpm: 60,
    score: '| F#4q. A4e A4h | F#4q. E4e D4h | E4q. F#4e A4q. F#4e | E4w | F#4q. A4e A4h | F#4q. E4e D4h | E4q. F#4e E4q. D4e | D4w |' },
  { id: 'serenata', title: 'Pequeña serenata nocturna', by: 'W. A. Mozart', style: 'clasica', difficulty: 2, key: 'G', time: 4, bpm: 96,
    score: '| G4q Re D4e G4q Re D4e | G4e D4e G4e B4e D5h | C5q Re A4e C5q Re A4e | C5e A4e F#4e A4e D4h | G4q G4q G4e B4e A4e G4e | G4q F#4q F#4e A4e C5e F#4e | A4q G4q G4e B4e A4e G4e | G4q F#4q F#4e A4e C5e F#4e | G4h. Rq |' },
  { id: 'minueto', title: 'Minueto en Sol', by: 'C. Petzold (cuaderno de A. M. Bach)', style: 'clasica', difficulty: 2, key: 'G', time: 3, bpm: 100,
    score: '| D5q G4e A4e B4e C5e | D5q G4q G4q | E5q C5e D5e E5e F#5e | G5q G4q G4q | C5q D5e C5e B4e A4e | B4q C5e B4e A4e G4e | F#4q G4e A4e B4e G4e | A4h. | D5q G4e A4e B4e C5e | D5q G4q G4q | E5q C5e D5e E5e F#5e | G5q G4q G4q | C5q D5e C5e B4e A4e | B4q C5e B4e A4e G4e | A4q B4e A4e G4e F#4e | G4h. |' },

  // ---------- Folk y country ----------
  { id: 'susanna', title: 'Oh! Susanna', by: 'S. Foster', style: 'folk', difficulty: 1, key: 'D', time: 4, bpm: 100, pickup: 1,
    score: '| D4e E4e | F#4q A4q A4q. B4e | A4q F#4q D4q. E4e | F#4q F#4q E4q D4q | E4h. D4e E4e | F#4q A4q A4q. B4e | A4q F#4q D4q. E4e | F#4q F#4q E4q E4q | D4h. Rq | G4h G4h | B4q B4h B4q | A4q A4q F#4q D4q | E4h. D4e E4e | F#4q A4q A4q. B4e | A4q F#4q D4q. E4e | F#4q F#4q E4q E4q | D4h. |' },
  { id: 'amazing', title: 'Amazing Grace', by: 'Himno tradicional', style: 'folk', difficulty: 1, key: 'G', time: 3, bpm: 80, pickup: 1,
    score: '| D4q | G4h B4e G4e | B4h A4q | G4h E4q | D4h D4q | G4h B4e G4e | B4h A4q | D5h. | D5h B4q | D5q. B4e G4q | B4h A4q | G4h E4q | D4h D4q | G4h B4e G4e | B4h A4q | G4h |' },
  { id: 'sailor', title: 'Drunken Sailor', by: 'Canción marinera tradicional', style: 'folk', difficulty: 2, key: 'C', time: 4, bpm: 104,
    score: '| A4q A4e A4e A4q A4e A4e | A4q D4q F4q A4q | G4q G4e G4e G4q G4e G4e | G4q C4q E4q G4q | A4q A4e A4e A4q A4e A4e | A4q B4q C5q D5q | C5q A4q G4q E4q | D4h D4h |' },
  { id: 'greensleeves', title: 'Greensleeves', by: 'Tradicional inglesa', style: 'folk', difficulty: 3, key: 'Am', time: 3, bpm: 92, pickup: 1,
    score: '| A4q | C5h D5q | E5q. F5e E5q | D5h B4q | G4q. A4e B4q | C5h A4q | A4q. G#4e A4q | B4h G#4q | E4h A4q | C5h D5q | E5q. F5e E5q | D5h B4q | G4q. A4e B4q | C5q. B4e A4q | G#4q. F#4e G#4q | A4h |' },

  // ---------- Jazz y blues ----------
  { id: 'saints', title: 'When the Saints Go Marching In', by: 'Tradicional de Nueva Orleans', style: 'jazz', difficulty: 1, key: 'D', time: 4, bpm: 108,
    score: '| Rq D4q F#4q G4q | A4w | Rq D4q F#4q G4q | A4w | Rq D4q F#4q G4q | A4h F#4h | D4h F#4h | E4w | Rq F#4q F#4q E4q | D4h. D4q | F#4q A4h A4q | G4h. Rq | F#4q G4q A4q F#4q | D4h E4h | D4w |' },
  { id: 'blues-la', title: 'Blues en La', by: 'Original de Violin Flow', style: 'jazz', difficulty: 2, key: 'A', time: 4, bpm: 88,
    score: '| A4q C5q A4q C5q | D5q C5q A4h | A4q C5q A4q C5q | E5h. Rq | D5q E5q D5q C5q | A4h. Rq | A4q C5q A4q C5q | D5q C5q A4h | E5q E5q D5q D5q | C5q C5q A4h | A4q C5e A4e G4q E4q | A4w |' },
  { id: 'entertainer', title: 'The Entertainer', by: 'S. Joplin', style: 'jazz', difficulty: 3, key: 'C', time: 4, bpm: 76, pickup: 1,
    score: '| D4e D#4e | E4e C5q E4e C5q E4e C5e | C5h. C5e D5e | D#5e E5e C5e D5e E5q B4e D5e | C5h. |' },

  // ---------- Rock y pop (originales) ----------
  { id: 'primer-riff', title: 'Primer riff', by: 'Original de Violin Flow', style: 'rock', difficulty: 1, key: 'D', time: 4, bpm: 96,
    score: '| E5q E5e E5e D5q B4q | A4q A4e B4e D5h | E5q E5e E5e D5q B4q | A4h A4h | E5q E5e E5e D5q B4q | A4q A4e B4e D5h | G4q A4q B4q D5q | E5w |' },
  { id: 'balada', title: 'Balada en Re', by: 'Original de Violin Flow', style: 'rock', difficulty: 1, key: 'D', time: 4, bpm: 72,
    score: '| D5h C#5q B4q | A4h F#4h | G4q A4q B4q G4q | A4w | B4h A4q G4q | F#4h D4h | E4q F#4q G4q E4q | D4w |' },
  { id: 'estadio', title: 'Himno de estadio', by: 'Original de Violin Flow', style: 'rock', difficulty: 2, key: 'G', time: 4, bpm: 104,
    score: '| G4q G4e A4e B4q B4q | A4q G4q E4h | D4q G4e A4e B4q D5q | C5h B4h | C5q B4q A4q G4q | A4h D4h | G4q G4e A4e B4q D5q | G4w |' },
  { id: 'riff-mim', title: 'Riff en Mi menor', by: 'Original de Violin Flow', style: 'rock', difficulty: 3, key: 'Em', time: 4, bpm: 92,
    score: '| E4e G4e A4e B4e D5e B4e A4e G4e | E4e G4e A4e Bb4e A4e G4e E4q | E4e G4e A4e B4e D5e B4e A4e G4e | B4e A4e G4e E4e G4q E4q | E5e D5e B4e A4e G4e A4e B4q | E5e D5e B4e A4e Bb4e A4e G4q | E4e G4e A4e B4e A4e G4e F#4e G4e | E4w |' },

  // ---------- Navidad ----------
  { id: 'jingle', title: 'Jingle Bells', by: 'J. Pierpont', style: 'navidad', difficulty: 1, key: 'D', time: 4, bpm: 108,
    score: '| F#4q F#4q F#4h | F#4q F#4q F#4h | F#4q A4q D4q. E4e | F#4w | G4q G4q G4q. G4e | G4q F#4q F#4q F#4e F#4e | F#4q E4q E4q F#4q | E4h A4h | F#4q F#4q F#4h | F#4q F#4q F#4h | F#4q A4q D4q. E4e | F#4w | G4q G4q G4q G4q | G4q F#4q F#4q F#4e F#4e | A4q A4q G4q E4q | D4w |' },
  { id: 'we-wish', title: 'We Wish You a Merry Christmas', by: 'Villancico tradicional inglés', style: 'navidad', difficulty: 2, key: 'G', time: 3, bpm: 112, pickup: 1,
    score: '| D4q | G4q G4e A4e G4e F#4e | E4q E4q E4q | A4q A4e B4e A4e G4e | F#4q D4q D4q | B4q B4e C5e B4e A4e | G4q E4q D4e D4e | E4q A4q F#4q | G4h |' },
  { id: 'noche-paz', title: 'Noche de paz', by: 'F. X. Gruber', style: 'navidad', difficulty: 2, key: 'D', time: 3, bpm: 76,
    score: '| A4q. B4e A4q | F#4h. | A4q. B4e A4q | F#4h. | E5h E5q | C#5h. | D5h D5q | A4h. | B4h B4q | D5q. C#5e B4q | A4q. B4e A4q | F#4h. | B4h B4q | D5q. C#5e B4q | A4q. B4e A4q | F#4h. | E5h E5q | G5q. E5e C#5q | D5h. | F#5h. | D5q A4q F#4q | A4q. G4e E4q | D4h. |' },

  // ---------- Populares ----------
  { id: 'mary', title: 'María tenía un corderito', by: 'Canción infantil tradicional', style: 'populares', difficulty: 1, key: 'D', time: 4, bpm: 92,
    score: '| F#4q E4q D4q E4q | F#4q F#4q F#4h | E4q E4q E4h | F#4q A4q A4h | F#4q E4q D4q E4q | F#4q F#4q F#4q F#4q | E4q E4q F#4q E4q | D4w |' },
  { id: 'estrellita', title: 'Estrellita', by: 'Canción popular francesa', style: 'populares', difficulty: 1, key: 'A', time: 4, bpm: 92,
    score: '| A4q A4q E5q E5q | F#5q F#5q E5h | D5q D5q C#5q C#5q | B4q B4q A4h | E5q E5q D5q D5q | C#5q C#5q B4h | E5q E5q D5q D5q | C#5q C#5q B4h | A4q A4q E5q E5q | F#5q F#5q E5h | D5q D5q C#5q C#5q | B4q B4q A4h |' },
  { id: 'martinillo', title: 'Martinillo', by: 'Canon popular francés', style: 'populares', difficulty: 1, key: 'D', time: 4, bpm: 100,
    score: '| D4q E4q F#4q D4q | D4q E4q F#4q D4q | F#4q G4q A4h | F#4q G4q A4h | A4e B4e A4e G4e F#4q D4q | A4e B4e A4e G4e F#4q D4q | D4q A3q D4h | D4q A3q D4h |' },
  { id: 'cumple', title: 'Cumpleaños feliz', by: 'M. y P. Hill', style: 'populares', difficulty: 2, key: 'D', time: 3, bpm: 100, pickup: 1,
    score: '| A4e. A4s | B4q A4q D5q | C#5h A4e. A4s | B4q A4q E5q | D5h A4e. A4s | A5q F#5q D5q | C#5q B4q G5e. G5s | F#5q D5q E5q | D5h |' },
];

// Partituras importadas por el usuario (MusicXML): no forman parte de los estilos del curso
export const MY_STYLE = { id: 'mias', name: 'Mis partituras', blurb: 'Importadas desde MusicXML', color: 'var(--st-mias)' };

export function allSongs() {
  return [...SONGS, ...getState().importedSongs];
}

export function songById(id) {
  return allSongs().find(s => s.id === id) || null;
}

export function styleById(id) {
  return id === MY_STYLE.id ? MY_STYLE : STYLES.find(s => s.id === id) || null;
}

// Desplazamiento de octava (0, ±12, +24) para que toda la canción quepa en el registro escrito del instrumento; null si no cabe
export function octaveShiftFor(song, inst) {
  if (inst.rhythmOnly) return 0; // en percusión solo cuenta el ritmo
  const midis = songScore(song).notes.filter(n => !n.rest).map(n => n.midi);
  const lo = Math.min(...midis), hi = Math.max(...midis);
  return [0, 12, -12, 24, -24].find(k => lo + k >= inst.written[0] && hi + k <= inst.written[1]) ?? null;
}

// Partitura ya analizada: las importadas la guardan hecha; las del repertorio se leen del texto
export function songScore(song) {
  return song.parsed ? structuredClone(song.parsed) : parseScore(song.score);
}
