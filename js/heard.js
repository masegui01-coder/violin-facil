// Texto «Oigo…» del reproductor. Los cents solo tienen sentido cuando suena la nota pedida (desafinada):
// si suena otra nota, se dice cuál suena y cuál se pide, sin cents.
import { noteLabel } from './music.js';

const SAME_NOTE_CENTS = 100;
const SLIGHT_CENTS = 50;

const octaveOf = midi => Math.floor(midi / 12) - 1;

// Nombre de una nota en la nomenclatura elegida; en la europea se añade la octava si hace falta distinguir dos notas
function label(midi, nom, flats, other) {
  const text = noteLabel({ midi }, nom, flats);
  if (nom === 'us' || other === undefined || midi === other) return text;
  return noteLabel({ midi: other }, nom, flats) === text ? text + octaveOf(midi) : text;
}

function tuneWord(cents, tolerance) {
  if (Math.abs(cents) <= tolerance / 2) return 'afinado';
  const dir = cents > 0 ? 'alto' : 'bajo';
  return Math.abs(cents) < SLIGHT_CENTS ? `un poco ${dir}` : dir;
}

// detected: altura en midi con decimales (ya plegada a la octava de la nota pedida); target: midi pedido o null
export function heardText(detected, target, { nom = 'eu', flats = false, tolerance = 25 } = {}) {
  const heard = Math.round(detected);
  if (target === null || target === undefined) return `Oigo ${label(heard, nom, flats)}`;
  const cents = Math.round((detected - target) * 100);
  if (Math.abs(cents) < SAME_NOTE_CENTS) {
    return `Oigo ${label(target, nom, flats)}, ${cents >= 0 ? '+' : ''}${cents} cents, ${tuneWord(cents, tolerance)}`;
  }
  return `Oigo ${label(heard, nom, flats, target)} · te pide ${label(target, nom, flats, heard)}`;
}
