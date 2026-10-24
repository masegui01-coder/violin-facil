// «Toca libre» y modo «De memoria»: escribe en el pentagrama lo que tocas, lo guarda y lo compara con una canción.
import { $, esc, toast } from '../ui.js';
import { register } from '../router.js';
import { noteLabel, fingerText, freqToMidi, parseScore, spell } from '../music.js';
import { createStaff } from '../staff.js';
import { renderFingerboard } from '../fingerboard.js';
import { createTracker } from '../tracker.js';
import { compareNotes, starsFor } from '../compare.js';
import { songById, songScore } from '../songs.js';
import { getState, saveRecording, deleteRecording } from '../store.js';
import * as audio from '../audio.js';
import { withMic } from './practice.js';
import { finishLesson } from './result.js';
import { openSongPicker } from './sheet.js';

const TICK_MS = 30;
const TRAIL_SHOWN = 10;
const LOWEST = 55;
const HIGHEST = 88;

const freeStaff = createStaff($('freeStaff'));
let free = { all: [], tracker: null, lesson: null, from: 'practice' };
let timer = 0;

const tokenOf = midi => { const n = spell(midi); return `${n.letter}${n.acc ? '#' : ''}${n.oct}q`; };

function renderTrail() {
  const shown = free.all.slice(-TRAIL_SHOWN);
  const score = parseScore('| ' + (shown.length ? shown.map(tokenOf) : ['Rq']).join(' ') + ' |');
  freeStaff.render(score, { key: 'C', time: null, mode: 'learn' });
  if (shown.length) freeStaff.focus(shown.length - 1);
  $('freeCount').textContent = free.all.length ? `${free.all.length} ${free.all.length === 1 ? 'nota tocada' : 'notas tocadas'}` : '';
}

function renderRecordings() {
  const nom = getState().nom;
  const recs = getState().recordings;
  $('recordings').innerHTML = !free.lesson && recs.length
    ? '<h2>Guardadas</h2>' + recs.map(r => `<div class="recording"><div><b>${new Date(r.date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })} · ${r.notes.length} notas</b>
      <small>${esc(r.notes.slice(0, 12).map(m => noteLabel({ midi: m }, nom)).join(' '))}${r.notes.length > 12 ? '…' : ''}</small></div>
      <div class="row"><button type="button" class="btn ghost small" data-rec-compare="${r.id}">Comparar</button><button type="button" class="btn ghost small" data-rec-delete="${r.id}" aria-label="Borrar grabación">✕</button></div></div>`).join('')
    : '';
}

function freeTick() {
  const p = audio.readPitch();
  const midi = free.tracker.feed(p, TICK_MS);
  if (p && p.freq !== null) {
    const det = freqToMidi(p.freq);
    const near = Math.round(det);
    const cents = (det - near) * 100;
    const nom = getState().nom;
    $('freeName').textContent = noteLabel({ midi: near }, nom);
    $('freeHint').textContent = fingerText(near, nom);
    $('freeCents').textContent = (cents >= 0 ? '+' : '') + Math.round(cents) + ' cents';
    $('freeDot').style.left = (50 + Math.max(-50, Math.min(50, cents))) + '%';
    $('freeDot').style.background = Math.abs(cents) <= 15 ? 'var(--ok)' : Math.abs(cents) <= 30 ? 'var(--warn)' : 'var(--bad)';
  } else {
    $('freeDot').style.left = '50%';
  }
  if (midi !== null && midi >= LOWEST && midi <= HIGHEST) {
    free = { ...free, all: [...free.all, midi] };
    renderTrail();
    if (getState().showBoard) renderFingerboard($('freeBoard'), [midi], getState().nom);
  }
}

// Compara una secuencia tocada con una canción y muestra el resultado con la partitura coloreada
export function compareWithSong(songId, played, { lesson = null, from = 'practice' } = {}) {
  const song = songById(songId);
  const score = songScore(song);
  const expected = score.notes.filter(n => !n.rest).map(n => n.midi);
  const result = compareNotes(expected, played);
  let k = 0;
  const states = score.notes.map(n => (n.rest ? 'future' : result.states[k++] === 'ok' ? 'done' : 'miss'));
  const stars = starsFor(result.accuracy);
  const text = `${result.correct} de ${expected.length} notas en su sitio (${Math.round(result.accuracy * 100)} %)` + (result.extra ? ` · ${result.extra} de más` : '');
  finishLesson({
    lesson: lesson || { id: 'compare-' + songId, kind: 'compare', songId }, mode: lesson ? 'memory' : 'compare', from,
    stars, text, title: song.title, record: !!lesson,
    review: { score, key: song.key, time: song.time, states },
  });
}

function enter({ lesson = null, from = 'practice' } = {}) {
  free = { all: [], tracker: createTracker(), lesson, from };
  const song = lesson ? songById(lesson.songId) : null;
  $('freeTitle').textContent = song ? 'De memoria' : 'Toca libre';
  $('freeIntro').textContent = song
    ? `Toca «${song.title}» sin mirar la partitura. Cuando acabes, pulsa «Terminar y comparar».`
    : 'Toca lo que quieras: la app lo escribe en el pentagrama. Guárdalo o compáralo con una canción para comprobar si te la sabes de memoria.';
  $('memoryDone').hidden = !song;
  $('freeActions').hidden = !!song;
  renderTrail();
  renderRecordings();
  renderFingerboard($('freeBoard'), [], getState().nom);
  $('freeBoard').hidden = !getState().showBoard;
  $('freeGate').hidden = audio.micReady();
  $('freeMicError').hidden = true;
  timer = setInterval(freeTick, TICK_MS);
}

register('free', { enter, leave() { clearInterval(timer); } });

$('freeStart').addEventListener('click', () => withMic('freeGate', 'freeMicError'));
$('freeClear').addEventListener('click', () => { free = { ...free, all: [], tracker: createTracker() }; renderTrail(); });
$('freeSave').addEventListener('click', () => {
  if (!free.all.length) { toast('Toca algo antes de guardar'); return; }
  saveRecording(free.all);
  renderRecordings();
  toast('Guardado en este dispositivo');
});
$('freeCompare').addEventListener('click', () => {
  if (!free.all.length) { toast('Toca la canción y después compárala'); return; }
  const played = free.all;
  openSongPicker(id => compareWithSong(id, played));
});
$('memoryDone').addEventListener('click', () => {
  if (!free.all.length) { toast('Todavía no he oído ninguna nota'); return; }
  compareWithSong(free.lesson.songId, free.all, { lesson: free.lesson, from: free.from });
});
$('recordings').addEventListener('click', e => {
  const cmp = e.target.closest('[data-rec-compare]');
  const del = e.target.closest('[data-rec-delete]');
  if (cmp) {
    const rec = getState().recordings.find(r => r.id === cmp.dataset.recCompare);
    if (rec) openSongPicker(id => compareWithSong(id, rec.notes));
  }
  if (del) { deleteRecording(del.dataset.recDelete); renderRecordings(); }
});
