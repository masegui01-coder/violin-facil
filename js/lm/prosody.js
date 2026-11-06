// Prosodia de las letras del curso: la sílaba tónica de cada palabra tiene que caer en una parte al menos tan fuerte
// como sus sílabas átonas vecinas (o en una nota más larga). Acento en español: la tilde manda; si no, las palabras acabadas
// en vocal, n o s son llanas (penúltima) y las demás, agudas (última). Las sílabas son las que se cantan (con sus
// sinalefas, «ce el»), y las palabras salen de la letra seguida (SONG_WORDS).
import { scoreTokens, barBeatsOf } from './notes.js';

const ACCENTED = /[áéíóú]/i;
// Letras sin tildes ni signos (la ñ cuenta como una letra)
const plain = s => String(s).toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\u0001]/g, '');

// Peso métrico de un instante del compás: 3 el primer tiempo, 2 el tercero del 4/4, 1 los demás pulsos, 0 a contratiempo
export function beatWeight(pos, barBeats) {
  const p = ((pos % barBeats) + barBeats) % barBeats;
  if (Math.abs(p) < 1e-6) return 3;
  if (barBeats === 4 && Math.abs(p - 2) < 1e-6) return 2;
  return Math.abs(p - Math.round(p)) < 1e-6 ? 1 : 0;
}

// Sílaba tónica (índice) de una palabra de n sílabas: por la tilde (índice de su letra) o por la terminación
function stressedPiece(word, pieces) {
  const letters = [...word].filter(c => plain(c));
  const accent = letters.findIndex(c => ACCENTED.test(c));
  if (accent >= 0) {
    let at = 0;
    return pieces.findIndex(p => { at += p.len; return accent < at; });
  }
  const last = plain(word).slice(-1);
  return /[aeiouns]/.test(last) ? pieces.length - 2 : pieces.length - 1;
}

// Problemas de prosodia de una estrofa: { bar (desde 1), word, stressed, weaker }
export function prosodyIssues({ partitura, compas, anacrusa = 0 }, letra, words) {
  const barBeats = barBeatsOf(compas);
  const tokens = scoreTokens(partitura);
  const byBar = {};
  tokens.forEach(t => { if (!t.rest) (byBar[t.bar] ||= []).push(t); });
  // cada sílaba con su nota
  const syl = [];
  letra.forEach((bar, b) => bar.forEach((text, i) => { const n = (byBar[b] || [])[i]; if (n) syl.push({ text, start: n.start, beats: n.beats, bar: b }); }));
  // las letras de cada palabra repartidas entre las sílabas que la cantan
  const wordList = String(words).split(/\s+/).filter(w => plain(w));
  const pieces = wordList.map(() => []);
  let w = 0;
  let left = wordList.length ? plain(wordList[0]).length : 0;
  syl.forEach((s, k) => {
    let len = plain(s.text).length;
    while (len > 0 && w < wordList.length) {
      const take = Math.min(len, left);
      pieces[w].push({ syl: k, len: take });
      len -= take;
      left -= take;
      if (left === 0) { w++; left = w < wordList.length ? plain(wordList[w]).length : 0; }
    }
  });
  const issues = [];
  wordList.forEach((word, i) => {
    const ps = pieces[i];
    if (ps.length < 2) return; // las palabras de una sílaba no se miran
    const k = stressedPiece(word, ps);
    const s = syl[ps[k].syl];
    const weight = x => beatWeight(x.start - anacrusa, barBeats);
    // se compara con las sílabas vecinas de la misma palabra (la secundaria de «es-ca-LE-ra» en el 1 no es un error)
    const weaker = ps.filter((p, j) => Math.abs(j - k) === 1).map(p => syl[p.syl]).find(u => weight(u) > weight(s) && u.beats >= s.beats);
    if (weaker) issues.push({ bar: s.bar + (anacrusa ? 0 : 1), word: word.replace(/[^\p{L}]/gu, ''), stressed: s.text, weaker: weaker.text });
  });
  return issues;
}
