import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseMusicXml, guessInstrument, guessVoice } from '../js/musicxml.js';

const fixture = name => new URL('./fixtures/' + name, import.meta.url);

test('guesses instruments and voices from part names', () => {
  assert.equal(guessInstrument('Clarinete en Si♭ 2'), 'clarinet');
  assert.equal(guessInstrument('Saxofón tenor'), 'sax-tenor');
  assert.equal(guessInstrument('Sax. Barítono'), 'sax-bari');
  assert.equal(guessInstrument('Alto Sax'), 'sax');
  assert.equal(guessInstrument('Caja'), 'percussion');
  assert.equal(guessInstrument('Tuba'), null);
  assert.equal(guessVoice('Trompeta 2'), 2);
  assert.equal(guessVoice('Clarinete II'), 2);
  assert.equal(guessVoice('1º Clarinete'), 1);
  assert.equal(guessVoice('Flauta'), null);
});

test('keeps every part and lets you choose which one to rehearse', async () => {
  const xml = await readFile(fixture('prueba.musicxml'), 'utf8');
  const song = parseMusicXml(xml);
  assert.equal(song.parts.length, 2);
  assert.equal(song.partName, 'Violín');
  const piano = parseMusicXml(xml, 'P1');
  assert.equal(piano.partId, 'P1');
  assert.equal(piano.parsed.notes.length, 1);
});

test('reads the written-to-sounding transposition of each part', () => {
  const xml = '<score-partwise><part-list><score-part id="P1"><part-name>Clarinete 1</part-name></score-part></part-list><part id="P1"><measure>'
    + '<attributes><divisions>1</divisions><transpose><diatonic>-1</diatonic><chromatic>-2</chromatic></transpose></attributes>'
    + '<note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration></note></measure></part></score-partwise>';
  const p = parseMusicXml(xml).parts[0];
  assert.equal(p.transpose, -2);
  assert.equal(p.instrument, 'clarinet');
  assert.equal(p.voice, 1);
});
