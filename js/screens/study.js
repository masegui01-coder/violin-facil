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

const TOOL_HELP = [
  ['Afinador', 'Afina antes de tocar. En viento es cromático y te dice la nota escrita y la real; en violín, cuerda a cuerda. Puedes elegir La 440, 441 o 442 Hz en Perfil.'],
  ['Metrónomo', 'Marca el pulso con sonido y luces. Elige el compás o pulsa «Marcar tempo» al ritmo que quieras.'],
  ['Notas tenidas', 'Sostén una nota y mira la gráfica: la línea es tu afinación y el relleno, tu volumen. Te dice si eres estable, si tienes vibrato y si te desafinas al hacer crescendo.'],
  ['Toca libre', 'Toca lo que quieras y la app lo escribe en el pentagrama. Guárdalo o compáralo con una canción para comprobar si te la sabes de memoria.'],
  ['Mapa de afinación', 'Resume todo lo que tocas: qué notas te salen altas o bajas. Pulsa una nota para trabajarla con notas tenidas.'],
  ['Gimnasio de técnica', 'Escalas, arpegios y terceras en las 12 tonalidades, siempre a tu mejor tempo. Si lo haces con 2 estrellas, sube 4 pulsos por minuto.'],
  ['Afinar en acorde', 'La app suena un acorde y tú colocas la tercera, la quinta o la sexta en su sitio justo, como en la banda. Sin auriculares, alterna escuchar y tocar.'],
  ['Lectura a primera vista', 'Una partitura nueva cada vez, en tres niveles, y una sola toma: sin escucharla antes ni repetir.'],
  ['Modo audición', 'Una obra al azar, una sola toma y sin ayudas en pantalla, como en una prueba real.'],
];

function openStudyHelp() {
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>Para qué sirve cada herramienta</h2>
    <dl class="help-list">${TOOL_HELP.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl>
    <button type="button" class="btn small" data-close>Entendido</button></div>`;
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('sheet').showModal();
}

$('studyHelp').addEventListener('click', openStudyHelp);
$('toolSight').addEventListener('click', openSightSheet);
$('toolAudition').addEventListener('click', () => launch(auditionLesson(), { mode: 'tempo', from: 'practice' }));
