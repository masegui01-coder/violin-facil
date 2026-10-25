// Lectura a primera vista y modo audición: una sola toma, como en una prueba real.
import { $ } from '../ui.js';
import { sightReading } from '../generate.js';
import { instrumentById } from '../instruments.js';
import { allSongs, octaveShiftFor } from '../songs.js';
import { getState } from '../store.js';
import { launch, songLesson } from '../launch.js';

const AUDITION_MIN_DIFFICULTY = 2;

function sightLesson(level) {
  const seed = Math.floor(Math.random() * 1e6);
  const song = sightReading(level, instrumentById(getState().instrument), seed);
  return {
    id: song.id, kind: 'song', song, oneTake: true,
    nextAction: () => ({ label: 'Otra partitura', run: () => launch(sightLesson(level), { mode: 'tempo', from: 'practice' }) }),
  };
}

function auditionLesson() {
  const inst = instrumentById(getState().instrument);
  const pool = allSongs().filter(s => (s.difficulty >= AUDITION_MIN_DIFFICULTY || s.style === 'mias') && octaveShiftFor(s, inst) !== null);
  const song = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...songLesson(song.id), oneTake: true, noHints: true,
    nextAction: () => ({ label: 'Otra audición', run: () => launch(auditionLesson(), { mode: 'tempo', from: 'practice' }) }),
  };
}

function openSightSheet() {
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>Lectura a primera vista</h2>
    <p class="muted small">Una partitura nueva cada vez y una sola toma: sin escucharla antes ni repetir. Elige el nivel.</p>
    <div class="choice">
      <button type="button" data-level="1"><b>Nivel 1</b><small>Blancas y negras, por grados, en la tonalidad de la banda</small></button>
      <button type="button" data-level="2"><b>Nivel 2</b><small>Corcheas, puntillos, saltos y tonalidades vecinas</small></button>
      <button type="button" data-level="3"><b>Nivel 3</b><small>Semicorcheas, silencios, menores y saltos amplios</small></button>
    </div><button type="button" class="btn ghost small" data-close>Cancelar</button></div>`;
  $('sheetBody').querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => {
    $('sheet').close();
    launch(sightLesson(Number(b.dataset.level)), { mode: 'tempo', from: 'practice' });
  }));
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('sheet').showModal();
}

$('toolSight').addEventListener('click', openSightSheet);
$('toolAudition').addEventListener('click', () => launch(auditionLesson(), { mode: 'tempo', from: 'practice' }));
