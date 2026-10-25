import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseXml, child, textOf } from '../js/xml.js';
import { parseMusicXml, readMusicFile } from '../js/musicxml.js';
import { SONGS } from '../js/songs.js';
import { parseScore } from '../js/music.js';
import { songToMusicXml } from '../tools/song-to-musicxml.mjs';

const fixture = name => new URL('./fixtures/' + name, import.meta.url);

test('xml parser reads nested elements, attributes, entities and self-closing tags', () => {
  const root = parseXml('<?xml version="1.0"?><!-- c --><a x="1"><b>uno &amp; dos</b><c y=\'2\'/></a>');
  assert.equal(root.name, 'a');
  assert.equal(root.attrs.x, '1');
  assert.equal(textOf(root, 'b'), 'uno & dos');
  assert.equal(child(root, 'c').attrs.y, '2');
});

test('xml parser rejects badly nested tags', () => {
  assert.throws(() => parseXml('<a><b></a></b>'));
});

test('musicxml: picks the violin part, first voice, top chord note and merges ties', async () => {
  const song = parseMusicXml(await readFile(fixture('prueba.musicxml'), 'utf8'));
  assert.equal(song.title, 'Prueba & ensayo');
  assert.equal(song.by, 'Anónimo');
  assert.equal(song.key, 'D');
  assert.equal(song.time, 3);
  assert.equal(song.bpm, 90);
  const { notes, bars, totalBeats } = song.parsed;
  assert.deepEqual(notes.map(n => (n.rest ? 'R' : n.letter + (n.acc === 1 ? '#' : n.acc === -1 ? 'b' : '') + n.oct)), ['A4', 'F#5', 'E5', 'C#5', 'R', 'Bb4', 'B4', 'D5']);
  assert.deepEqual(notes.map(n => n.beats), [1, 1, 1, 2, 1, 0.5, 0.5, 2]);
  assert.deepEqual(notes.map(n => n.start), [0, 1, 2, 3, 5, 6, 6.5, 7]);
  assert.deepEqual(bars.map(b => b.beats), [1, 3, 3, 2]);
  assert.equal(totalBeats, 9);
  assert.equal(notes[3].dur, 'h');
  assert.equal(notes[5].dur, 'e');
});

test('musicxml: reads compressed .mxl files', async () => {
  const buf = await readFile(fixture('prueba.mxl'));
  const song = await readMusicFile('prueba.mxl', buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  assert.equal(song.parsed.notes.length, 8);
});

test('musicxml: every repertoire song survives a round trip through MusicXML', () => {
  for (const song of SONGS) {
    const back = parseMusicXml(songToMusicXml(song));
    const original = parseScore(song.score);
    assert.deepEqual(back.parsed.notes.map(n => [n.rest ? 'R' : n.midi, n.beats, n.start]), original.notes.map(n => [n.rest ? 'R' : n.midi, n.beats, n.start]), song.id);
    assert.equal(back.key, song.key, song.id);
    assert.equal(back.bpm, song.bpm, song.id);
  }
});

test('musicxml: explains what is wrong with other files', () => {
  assert.throws(() => parseMusicXml('<html><body></body></html>'), /MusicXML/);
  assert.throws(() => parseMusicXml('<score-partwise><part-list/><part id="P1"><measure/></part></score-partwise>'), /notas/);
});

test('musicxml: warns about notes the app cannot hear', () => {
  const xml = '<score-partwise><part id="P1"><measure><attributes><divisions>1</divisions></attributes>'
    + '<note><pitch><step>C</step><octave>3</octave></pitch><duration>1</duration></note>'
    + '<note><pitch><step>E</step><octave>6</octave></pitch><duration>1</duration></note></measure></part></score-partwise>';
  const song = parseMusicXml(xml);
  assert.equal(song.warnings.length, 2);
  assert.equal(song.difficulty, 3);
});

test('musicxml: reads unpitched percussion notes as rhythm', () => {
  const xml = '<score-partwise><part-list><score-part id="P1"><part-name>Caja</part-name></score-part></part-list><part id="P1"><measure>'
    + '<attributes><divisions>2</divisions><time><beats>2</beats><beat-type>4</beat-type></time></attributes>'
    + '<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched><duration>1</duration></note>'
    + '<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched><duration>1</duration></note>'
    + '<note><rest/><duration>2</duration></note></measure></part></score-partwise>';
  const song = parseMusicXml(xml);
  assert.deepEqual(song.parsed.notes.map(n => (n.rest ? 'R' : n.midi) + ':' + n.beats), ['72:0.5', '72:0.5', 'R:1']);
  assert.equal(song.time, 2);
});
