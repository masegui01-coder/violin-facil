// Exporta una canción del repertorio a MusicXML (para el archivo de ejemplo que se descarga desde la guía).
// Uso: node tools/song-to-musicxml.mjs minueto ejemplos/minueto-en-sol.musicxml
import { writeFile } from 'node:fs/promises';
import { SONGS } from '../js/songs.js';
import { parseScore, keyCount } from '../js/music.js';

const DIVISIONS = 4;
const TYPE = { w: 'whole', h: 'half', q: 'quarter', e: 'eighth', s: '16th' };
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function noteXml(n) {
  const head = n.rest ? '<rest/>' : `<pitch><step>${n.letter}</step>${n.acc ? `<alter>${n.acc}</alter>` : ''}<octave>${n.oct}</octave></pitch>`;
  return `      <note>${head}<duration>${n.beats * DIVISIONS}</duration><voice>1</voice><type>${TYPE[n.dur]}</type>${n.dotted ? '<dot/>' : ''}</note>`;
}

export function songToMusicXml(song) {
  const score = parseScore(song.score);
  const minor = song.key.endsWith('m');
  const measures = score.bars.map((bar, i) => {
    const notes = score.notes.filter(n => n.bar === i).map(noteXml).join('\n');
    const attrs = i === 0
      ? `      <attributes><divisions>${DIVISIONS}</divisions><key><fifths>${keyCount(song.key)}</fifths><mode>${minor ? 'minor' : 'major'}</mode></key><time><beats>${song.time}</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
      <direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${song.bpm}</per-minute></metronome></direction-type><sound tempo="${song.bpm}"/></direction>\n`
      : '';
    return `    <measure number="${i + (song.pickup ? 0 : 1)}"${i === 0 && song.pickup ? ' implicit="yes"' : ''}>\n${attrs}${notes}\n    </measure>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>${esc(song.title)}</work-title></work>
  <identification><creator type="composer">${esc(song.by)}</creator></identification>
  <part-list><score-part id="P1"><part-name>Violín</part-name></score-part></part-list>
  <part id="P1">
${measures}
  </part>
</score-partwise>
`;
}

const [id, out] = process.argv.slice(2);
if (id && out) {
  const song = SONGS.find(s => s.id === id);
  if (!song) throw new Error('No existe la canción ' + id);
  await writeFile(out, songToMusicXml(song));
  console.log('Escrito', out);
}
