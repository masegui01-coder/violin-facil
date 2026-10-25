// Convierte un MusicXML (MuseScore, Sibelius, Finale, Dorico, apps de escaneo…) en una partitura de la app.
// Se queda con una sola línea melódica: la parte de violín (o la primera), su primera voz y la nota más aguda de cada acorde.
import { parseXml, child, childrenOf, textOf, find } from './xml.js';
import { unzipMusicXml } from './unzip.js';
import { fingering, spell } from './music.js';

const STEP_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR = { 0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', '-1': 'F', '-2': 'Bb', '-3': 'Eb' };
const MINOR = { 0: 'Am', 1: 'Em', 2: 'Bm', 3: 'F#m', '-1': 'Dm', '-2': 'Gm' };
const GLYPHS = [['w', false, 4], ['h', true, 3], ['h', false, 2], ['q', true, 1.5], ['q', false, 1], ['e', true, 0.75], ['e', false, 0.5], ['s', true, 0.375], ['s', false, 0.25]];
const BEAT_UNIT = { whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25 };
const DEFAULT_BPM = 80;
const LOWEST = 55;
const HIGHEST = 88;

// Figura que se dibuja para una duración (la duración real se conserva para el ritmo)
function glyphFor(beats) {
  const best = GLYPHS.reduce((a, g) => (Math.abs(g[2] - beats) < Math.abs(a[2] - beats) ? g : a));
  return { dur: best[0], dotted: best[1] };
}

function readTempo(part) {
  const sound = (function search(node) {
    for (const c of node.children) {
      if (c.name === 'sound' && c.attrs.tempo) return c;
      const deep = search(c);
      if (deep) return deep;
    }
    return null;
  })(part);
  if (sound) return Math.round(Number(sound.attrs.tempo));
  const metro = find(part, 'metronome');
  if (metro) {
    const unit = (BEAT_UNIT[textOf(metro, 'beat-unit')] || 1) * (child(metro, 'beat-unit-dot') ? 1.5 : 1);
    const perMinute = Number(textOf(metro, 'per-minute'));
    if (perMinute) return Math.round(perMinute * unit);
  }
  return DEFAULT_BPM;
}

function readPitch(noteEl) {
  // percusión sin altura: se usa la posición en el pentagrama
  const unpitched = child(noteEl, 'unpitched');
  if (unpitched) {
    const step = textOf(unpitched, 'display-step') || 'C';
    const oct = Number(textOf(unpitched, 'display-octave') || 5);
    return { letter: step, acc: 0, oct, midi: (oct + 1) * 12 + STEP_PC[step] };
  }
  const pitch = child(noteEl, 'pitch');
  const step = textOf(pitch, 'step');
  const alter = Math.round(Number(textOf(pitch, 'alter') || 0));
  const oct = Number(textOf(pitch, 'octave'));
  const midi = (oct + 1) * 12 + STEP_PC[step] + alter;
  return Math.abs(alter) <= 1 ? { letter: step, acc: alter, oct, midi } : spell(midi);
}

// Instrumento probable según el nombre de la parte (para repartir partichelas y para la banda virtual)
// El orden importa: primero los nombres más concretos (clarinete bajo antes que clarinete, saxo barítono antes que bombardino…)
const NAME_TO_INSTRUMENT = [
  [/viol[ií]n/i, 'violin'],
  [/clarinete?\s*baj|bass\s*clar|clarinetto\s*basso/i, 'bass-clarinet'],
  [/requinto|clarinet\S*\s*(en\s*)?(mi\s*b|mi♭|e\s*b|e♭)/i, 'eb-clarinet'],
  [/sax\S*\s*(bar[ií]t|bari)/i, 'sax-bari'], [/sax\S*\s*ten|tenor sax/i, 'sax-tenor'], [/sax\S*\s*sop|soprano sax/i, 'sax-soprano'],
  [/sax/i, 'sax'], [/clarinet/i, 'clarinet'],
  [/fliscorno|flugel/i, 'flugelhorn'], [/trompeta|trumpet|corneta|cornet/i, 'trumpet'],
  [/tromb[oó]n|trombone|posaune/i, 'trombone'], [/bombardino|euphon|bar[ií]tono/i, 'euphonium'], [/tuba|helic[oó]n|sousaf/i, 'tuba'],
  [/trompa|\bhorn\b|corno|\bcor\b/i, 'horn'],
  [/flaut[ií]n|piccolo|ottavino/i, 'piccolo'], [/flauta?\s*dulce|recorder|blockfl/i, 'recorder'], [/flaut|flute/i, 'flute'], [/oboe/i, 'oboe'],
  [/caj[oó]n/i, 'cajon'], [/percus|caja|snare|bombo|drum|plato|cymbal|timbal|bater[ií]a/i, 'percussion'],
];
export function guessInstrument(name) {
  const hit = NAME_TO_INSTRUMENT.find(([re]) => re.test(name || ''));
  return hit ? hit[1] : null;
}
// Voz de la parte: «Clarinete 2», «Trompeta II», «1º Clarinete»…
export function guessVoice(name) {
  const m = /(?:^|\s)([1-4])\s*[ºª.]?(?=\s|$)|\b(I{1,3}|IV)\b/.exec(name || '');
  if (!m) return null;
  return m[1] ? Number(m[1]) : { I: 1, II: 2, III: 3, IV: 4 }[m[2]];
}

function readPart(part) {
  const state = { divisions: 1, key: null, time: null, voice: null, beat: 0, transpose: 0 };
  const notes = [];
  const bars = [];
  childrenOf(part, 'measure').forEach(measure => {
    const barStart = state.beat;
    measure.children.forEach(el => {
      if (el.name === 'attributes') {
        if (textOf(el, 'divisions')) state.divisions = Number(textOf(el, 'divisions'));
        const key = child(el, 'key');
        if (key && state.key === null) state.key = { fifths: Number(textOf(key, 'fifths')), minor: textOf(key, 'mode') === 'minor' };
        const time = child(el, 'time');
        if (time && state.time === null) state.time = { beats: Number(textOf(time, 'beats')), type: Number(textOf(time, 'beat-type')) };
        const tr = child(el, 'transpose');
        if (tr) state.transpose = Number(textOf(tr, 'chromatic') || 0) + 12 * Number(textOf(tr, 'octave-change') || 0);
      }
      if (el.name !== 'note' || child(el, 'grace') || child(el, 'cue')) return;
      const staffNo = textOf(el, 'staff');
      if (staffNo && staffNo !== '1') return;
      const voice = textOf(el, 'voice') || '1';
      if (state.voice === null) state.voice = voice;
      if (voice !== state.voice) return;
      if (child(el, 'chord')) {
        // doble cuerda o acorde: se toca la nota más aguda
        const last = notes[notes.length - 1];
        if (last && !last.rest && (child(el, 'pitch') || child(el, 'unpitched'))) {
          const pitch = readPitch(el);
          if (pitch.midi > last.midi) Object.assign(last, pitch);
        }
        return;
      }
      const beats = Number(textOf(el, 'duration')) / state.divisions;
      if (!beats) return;
      const tieStop = childrenOf(el, 'tie').some(t => t.attrs.type === 'stop');
      const prev = notes[notes.length - 1];
      if (child(el, 'rest')) {
        notes.push({ rest: true, beats, start: state.beat, bar: bars.length, ...glyphFor(beats) });
      } else {
        const pitch = readPitch(el);
        if (tieStop && prev && !prev.rest && prev.midi === pitch.midi) {
          prev.beats += beats;
          Object.assign(prev, glyphFor(prev.beats));
        } else {
          notes.push({ ...pitch, rest: false, beats, start: state.beat, bar: bars.length, ...glyphFor(beats) });
          if (child(el, 'unpitched')) state.percussion = true;
        }
      }
      state.beat += beats;
    });
    if (state.beat > barStart) bars.push({ start: barStart, beats: state.beat - barStart });
  });
  const fifths = state.key ? state.key.fifths : 0;
  return {
    parsed: { notes, bars, totalBeats: state.beat },
    key: (state.key && state.key.minor ? MINOR : MAJOR)[fifths] || 'C', fifths, hasKey: !!state.key,
    time: state.time ? state.time.beats * 4 / state.time.type : 4,
    transpose: state.transpose, percussion: !!state.percussion,
  };
}

const MAX_PARTS = 24;

// partId: la parte que se quiere ensayar (si no, la de violín o la primera)
export function parseMusicXml(text, partId = null) {
  const score = parseXml(text);
  if (score.name === 'score-timewise') throw new Error('Este MusicXML está en formato «timewise». Expórtalo de nuevo como MusicXML normal.');
  if (score.name !== 'score-partwise') throw new Error('Esto no parece un archivo MusicXML');
  const partEls = childrenOf(score, 'part');
  if (!partEls.length) throw new Error('El archivo no tiene ninguna parte con notas');
  const names = Object.fromEntries(childrenOf(child(score, 'part-list'), 'score-part').map(p => [p.attrs.id, textOf(p, 'part-name')]));
  const parts = partEls.slice(0, MAX_PARTS).map(el => {
    const name = names[el.attrs.id] || el.attrs.id;
    return { id: el.attrs.id, name, instrument: guessInstrument(name), voice: guessVoice(name), ...readPart(el) };
  }).filter(p => p.parsed.notes.some(n => !n.rest));
  if (!parts.length) throw new Error('No he encontrado notas en la partitura');
  const chosen = parts.find(p => p.id === partId) || parts.find(p => /viol[ií]n/i.test(p.name)) || parts[0];
  const playable = chosen.parsed.notes.filter(n => !n.rest);
  const warnings = [];
  const outOfRange = playable.filter(n => n.midi < LOWEST || n.midi > HIGHEST).length;
  if (outOfRange && !chosen.percussion) warnings.push(`${outOfRange} ${outOfRange === 1 ? 'nota está' : 'notas están'} fuera del registro que reconoce la app.`);
  const highPositions = playable.filter(n => n.midi >= LOWEST && n.midi <= HIGHEST && !fingering(n.midi)).length;
  if (highPositions && !chosen.percussion) warnings.push(`${highPositions} ${highPositions === 1 ? 'nota requiere' : 'notas requieren'} posiciones altas: no mostraré digitación para ellas.`);
  if (chosen.hasKey && chosen.key === 'C' && chosen.fifths !== 0) warnings.push('La armadura no está soportada: las alteraciones se mostrarán junto a cada nota.');
  const work = child(score, 'work');
  const title = textOf(work, 'work-title') || textOf(score, 'movement-title') || 'Partitura importada';
  const composer = childrenOf(child(score, 'identification'), 'creator').find(c => c.attrs.type === 'composer');
  const hasShort = playable.some(n => n.beats < 1);
  return {
    title, by: composer ? composer.text.trim() : 'Partitura importada', key: chosen.key, time: chosen.time, bpm: readTempo(score),
    difficulty: highPositions || outOfRange ? 3 : hasShort ? 2 : 1, warnings,
    parsed: chosen.parsed, partId: chosen.id, partName: chosen.name,
    parts: parts.map(({ id, name, instrument, voice, parsed, key, time, transpose, percussion }) => ({ id, name, instrument, voice, parsed, key, time, transpose, percussion })),
  };
}

// Acepta el archivo tal cual lo elige el usuario (.musicxml, .xml o .mxl). Devuelve también el texto para cambiar de parte.
export async function readMusicFile(name, buffer, partId = null) {
  const text = /\.mxl$/i.test(name) ? await unzipMusicXml(buffer) : new TextDecoder().decode(buffer);
  return { ...parseMusicXml(text, partId), source: text };
}
