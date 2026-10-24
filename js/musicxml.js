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

function pickPart(score) {
  const parts = childrenOf(score, 'part');
  if (!parts.length) throw new Error('El archivo no tiene ninguna parte con notas');
  const names = Object.fromEntries(childrenOf(child(score, 'part-list'), 'score-part').map(p => [p.attrs.id, textOf(p, 'part-name')]));
  return parts.find(p => /viol[ií]n/i.test(names[p.attrs.id] || '')) || parts[0];
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
  const pitch = child(noteEl, 'pitch');
  const step = textOf(pitch, 'step');
  const alter = Math.round(Number(textOf(pitch, 'alter') || 0));
  const oct = Number(textOf(pitch, 'octave'));
  const midi = (oct + 1) * 12 + STEP_PC[step] + alter;
  return Math.abs(alter) <= 1 ? { letter: step, acc: alter, oct, midi } : spell(midi);
}

export function parseMusicXml(text) {
  const score = parseXml(text);
  if (score.name === 'score-timewise') throw new Error('Este MusicXML está en formato «timewise». Expórtalo de nuevo como MusicXML normal.');
  if (score.name !== 'score-partwise') throw new Error('Esto no parece un archivo MusicXML');
  const part = pickPart(score);
  const state = { divisions: 1, key: null, time: null, voice: null, beat: 0 };
  const notes = [];
  const bars = [];
  const warnings = [];
  childrenOf(part, 'measure').forEach(measure => {
    const barStart = state.beat;
    measure.children.forEach(el => {
      if (el.name === 'attributes') {
        if (textOf(el, 'divisions')) state.divisions = Number(textOf(el, 'divisions'));
        const key = child(el, 'key');
        if (key && state.key === null) state.key = { fifths: Number(textOf(key, 'fifths')), minor: textOf(key, 'mode') === 'minor' };
        const time = child(el, 'time');
        if (time && state.time === null) state.time = { beats: Number(textOf(time, 'beats')), type: Number(textOf(time, 'beat-type')) };
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
        if (last && !last.rest && child(el, 'pitch')) {
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
        }
      }
      state.beat += beats;
    });
    if (state.beat > barStart) bars.push({ start: barStart, beats: state.beat - barStart });
  });
  const playable = notes.filter(n => !n.rest);
  if (!playable.length) throw new Error('No he encontrado notas en la partitura');
  const outOfRange = playable.filter(n => n.midi < LOWEST || n.midi > HIGHEST).length;
  if (outOfRange) warnings.push(`${outOfRange} ${outOfRange === 1 ? 'nota está' : 'notas están'} fuera del registro del violín que reconoce la app.`);
  const highPositions = playable.filter(n => n.midi >= LOWEST && n.midi <= HIGHEST && !fingering(n.midi)).length;
  if (highPositions) warnings.push(`${highPositions} ${highPositions === 1 ? 'nota requiere' : 'notas requieren'} posiciones altas: no mostraré digitación para ellas.`);
  const fifths = state.key ? state.key.fifths : 0;
  const key = (state.key && state.key.minor ? MINOR : MAJOR)[fifths] || 'C';
  if (state.key && key === 'C' && fifths !== 0) warnings.push('La armadura no está soportada: las alteraciones se mostrarán junto a cada nota.');
  const time = state.time ? state.time.beats * 4 / state.time.type : 4;
  const work = child(score, 'work');
  const title = textOf(work, 'work-title') || textOf(score, 'movement-title') || 'Partitura importada';
  const composer = childrenOf(child(score, 'identification'), 'creator').find(c => c.attrs.type === 'composer');
  const hasShort = playable.some(n => n.beats < 1);
  return {
    title, by: composer ? composer.text.trim() : 'Partitura importada', key, time, bpm: readTempo(part),
    difficulty: highPositions || outOfRange ? 3 : hasShort ? 2 : 1, warnings,
    parsed: { notes, bars, totalBeats: state.beat },
  };
}

// Acepta el archivo tal cual lo elige el usuario (.musicxml, .xml o .mxl)
export async function readMusicFile(name, buffer) {
  if (/\.mxl$/i.test(name)) return parseMusicXml(await unzipMusicXml(buffer));
  return parseMusicXml(new TextDecoder().decode(buffer));
}
