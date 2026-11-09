// Prosodia de las letras del curso: la sílaba tónica de cada palabra tiene que caer en una parte al menos tan fuerte
// como sus sílabas átonas vecinas (o en una nota más larga). Acento en español: la tilde manda; si no, las palabras acabadas
// en vocal, n o s son llanas (penúltima) y las demás, agudas (última). Las sílabas son las que se cantan (con sus
// sinalefas, «ce el»), y las palabras salen de la letra seguida (SONG_WORDS).
import { scoreTokens, barBeatsOf, isCompound, attackTokens } from './notes.js';

const ACCENTED = /[áéíóú]/i;
// Letras sin tildes ni signos (la ñ cuenta como una letra)
const plain = s => String(s).toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\u0001]/g, '');

// Peso métrico de un instante del compás: 3 el primer tiempo, 2 el tercero del 4/4, 1 los demás pulsos, 0 a contratiempo
// En 6/8 (compound): peso 3 en el 0, 2 en el 1,5 (el 2.º pulso) y 0 en las demás corcheas
export function beatWeight(pos, barBeats, compound = false) {
  const p = ((pos % barBeats) + barBeats) % barBeats;
  if (Math.abs(p) < 1e-6) return 3;
  if (compound) return Math.abs(p - 1.5) < 1e-6 ? 2 : 0;
  if (barBeats === 4 && Math.abs(p - 2) < 1e-6) return 2;
  return Math.abs(p - Math.round(p)) < 1e-6 ? 1 : 0;
}

// Palabras átonas (artículos, preposiciones, conjunciones, pronombres átonos y posesivos antepuestos): no llevan
// acento propio y se apoyan en la tónica que les sigue
const UNSTRESSED = new Set(['el', 'la', 'lo', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'ni', 'a', 'al', 'de', 'del',
  'en', 'con', 'por', 'para', 'sin', 'que', 'se', 'me', 'te', 'le', 'les', 'nos', 'mi', 'mis', 'tu', 'tus', 'su', 'sus']);
const SOLFA = new Set(['do', 're', 'mi', 'fa', 'sol', 'la', 'si']);
const STRONGEST = 3;
const bare = w => String(w).toLowerCase().replace(/[^\p{L}]/gu, '');

// Sílaba tónica (índice) de una palabra de n sílabas: por la tilde (índice de su letra) o por la terminación
// (vocal, n o s: llana; las demás, aguda; «-s» tras consonante, como «robots», también aguda)
function stressedPiece(word, pieces) {
  const letters = [...word].filter(c => plain(c));
  const accent = letters.findIndex(c => ACCENTED.test(c));
  if (accent >= 0) {
    let at = 0;
    return pieces.findIndex(p => { at += p.len; return accent < at; });
  }
  const end = plain(word);
  const llana = /[aeiou]$|[aeiou]n$|[aeiou]s$/.test(end);
  return llana ? pieces.length - 2 : pieces.length - 1;
}

// Problemas de prosodia de una estrofa: { bar (desde 1, o «anacrusa»), word, stressed, weaker }
//  - en cada palabra, la tónica no puede caer más débil que una átona de la misma palabra que sea vecina (o que
//    cualquiera, si la tónica no cae en un tiempo fuerte): «a-ca-BÓ» con «a» en el 1 y «bó» en el 2 del vals, mal
//  - una palabra átona no puede caer más fuerte que la tónica que la sigue (aunque esta sea más larga): «EL mar»,
//    «y MÁS», «al VER», «Y se a-ca-BÓ», mal
//  - la letra tiene que casar letra a letra con la letra seguida (si no, se avisa)
export function prosodyIssues({ partitura, compas, anacrusa = 0 }, letra, words) {
  const barBeats = barBeatsOf(compas);
  const compound = isCompound(compas);
  // una nota ligada es una sola: su continuación no lleva sílaba y suma su duración a la nota
  const tokens = attackTokens(scoreTokens(partitura));
  const byBar = {};
  tokens.forEach(t => { if (!t.rest) (byBar[t.bar] ||= []).push(t); });
  const syl = [];
  letra.forEach((bar, b) => bar.forEach((text, i) => { const n = (byBar[b] || [])[i]; if (n) syl.push({ text, start: n.start, beats: n.beats, bar: b }); }));
  const wordList = String(words).split(/\s+/).filter(w => plain(w));
  const barName = b => (anacrusa && b === 0 ? 'anacrusa' : b + (anacrusa ? 0 : 1));
  const issues = [];
  const sungLetters = syl.map(x => plain(x.text)).join('');
  if (sungLetters !== wordList.map(plain).join('')) issues.push({ bar: '—', word: 'letra desalineada', stressed: '', weaker: '' });
  // las letras de cada palabra repartidas entre las sílabas que la cantan
  const pieces = wordList.map(() => []);
  let w = 0;
  let left = wordList.length ? plain(wordList[0]).length : 0;
  syl.forEach((x, k) => {
    let len = plain(x.text).length;
    while (len > 0 && w < wordList.length) {
      const take = Math.min(len, left);
      pieces[w].push({ syl: k, len: take });
      len -= take;
      left -= take;
      if (left === 0) { w++; left = w < wordList.length ? plain(wordList[w]).length : 0; }
    }
  });
  const weight = x => beatWeight(x.start - anacrusa, barBeats, compound);
  // tónica de cada sílaba cantada y sílabas hechas solo de palabras átonas
  const stressed = new Set();
  const onlyUnstressed = new Map();
  wordList.forEach((word, i) => {
    const ps = pieces[i];
    if (!ps.length) return;
    // los nombres de nota junto a otro nombre de nota («mi fa», «si do») son tónicos, no el posesivo ni el artículo
    const noteName = n => SOLFA.has(bare(wordList[n] || ''));
    const atonic = ps.length === 1 && UNSTRESSED.has(bare(word)) && !(SOLFA.has(bare(word)) && (noteName(i - 1) || noteName(i + 1)));
    if (!atonic) stressed.add(ps[ps.length === 1 ? 0 : stressedPiece(word, ps)].syl);
    ps.forEach(p => onlyUnstressed.set(p.syl, (onlyUnstressed.get(p.syl) ?? true) && atonic));
    if (ps.length < 2) return;
    const k = stressedPiece(word, ps);
    const s = syl[ps[k].syl];
    const weaker = ps.map((p, j) => ({ u: syl[p.syl], j })).find(({ u, j }) => j !== k && weight(u) > weight(s) && u.beats >= s.beats && (Math.abs(j - k) === 1 || weight(s) < 2));
    if (weaker) issues.push({ bar: barName(s.bar), word: bare(word), stressed: s.text, weaker: weaker.u.text });
  });
  // una átona nunca en el 1.er tiempo ni más fuerte que la tónica que la sigue («MIS a-MI-gos», «Y se pa | RÓ»)
  syl.forEach((x, k) => {
    if (!onlyUnstressed.get(k)) return;
    const next = syl.findIndex((y, j) => j > k && stressed.has(j));
    if (next < 0) return;
    const s = syl[next];
    if (weight(x) > weight(s) || weight(x) === STRONGEST) issues.push({ bar: barName(x.bar), word: `${bare(x.text)} ${bare(s.text)}`, stressed: s.text, weaker: x.text });
  });
  // en 4/4, la última tónica de cada verso (antes de un signo de puntuación o cerrando el compás; no la interjección que abre el verso, «¡Sí,») no cae en el pulso débil («es-TÁ GRIS» en el 4)
  if (barBeats === 4) {
    wordList.forEach((word, i) => {
      const ps = pieces[i];
      if (!ps.length || (ps.length === 1 && UNSTRESSED.has(bare(word))) || /^[¡¿].*,$/.test(word)) return;
      const s = syl[ps[ps.length === 1 ? 0 : stressedPiece(word, ps)].syl];
      // también sin signo: la aguda o el monosílabo que cierra el compás («gris |»)
      const closesBar = s === syl[ps[ps.length - 1].syl] && (!syl[ps[ps.length - 1].syl + 1] || syl[ps[ps.length - 1].syl + 1].bar !== s.bar);
      if (!(/[.;:!?]$/.test(word) || /,$/.test(word) || closesBar)) return;
      if (weight(s) < 2 && s.beats < 2) issues.push({ bar: barName(s.bar), word: bare(word), stressed: s.text, weaker: 'fin de verso en parte débil' });
    });
  }
  return issues;
}
