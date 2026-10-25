// Hoja de detalle de una lección o canción, con la elección de modo.
import { $, esc, icon, starsHtml } from '../ui.js';
import { lessonSong, lessonTitle, lessonKey } from '../course.js';
import { SONGS, allSongs, styleById, songScore, DIFFICULTY, MY_STYLE } from '../songs.js';

const SONGS_IDS = new Set(SONGS.map(s => s.id));
import { deleteImportedSong, instrumentProgress } from '../store.js';
import { launch, defaultMode } from '../launch.js';

const KIND_ICON = { theory: 'theory', notes: 'notes', song: 'song' };
const KEY_NAME = { C: 'Do mayor', G: 'Sol mayor', D: 'Re mayor', A: 'La mayor', F: 'Fa mayor', Am: 'La menor', Em: 'Mi menor', Dm: 'Re menor' };

function facts(lesson, song) {
  if (lesson.kind === 'theory') return [`${lesson.cards.length} tarjetas`];
  if (lesson.kind === 'notes') return [`${lesson.notes.split(' ').length} notas`, 'Nota a nota'];
  const count = songScore(song).notes.filter(n => !n.rest).length;
  const style = song.style ? styleById(song.style).name : null;
  return [style, song.style ? DIFFICULTY[song.difficulty] : null, KEY_NAME[song.key], `${song.time}/4`, `♩ = ${song.bpm}`, `${count} notas`].filter(Boolean);
}

export function openLessonSheet(lesson, { state = 'open', from = 'course', color, onChange = () => {} } = {}) {
  const song = lessonSong(lesson);
  const best = instrumentProgress()[lessonKey(lesson)] || 0;
  const chip = color || (song && song.style ? styleById(song.style).color : 'var(--accent)');
  const sub = lesson.sub || (song ? song.by : '');
  const locked = state === 'locked';
  const isSong = lesson.kind === 'song';
  const rec = defaultMode(lesson);
  const modeBtn = (mode, title, text) => `<button type="button" class="mode-btn${rec === mode ? ' primary' : ''}" data-mode="${mode}" ${locked ? 'disabled' : ''}><b>${title}</b><small>${text}</small></button>`;
  $('sheetBody').innerHTML = `<div class="sheet-body">
    <div class="sheet-head" style="--chip:${chip}">
      <span class="sheet-art"><span class="ic">${icon(KIND_ICON[lesson.kind])}</span></span>
      <div><h2>${esc(lessonTitle(lesson))}</h2><p class="muted small">${esc(sub)}</p>${starsHtml(best)}</div>
    </div>
    <div class="sheet-facts">${facts(lesson, song).map(f => `<span>${esc(f)}</span>`).join('')}</div>
    ${locked ? '<p class="muted">Completa la lección anterior para desbloquear esta, o actívalas todas en Perfil.</p>' : ''}
    ${isSong
      ? `<div class="mode-grid">${modeBtn('learn', 'Nota a nota', 'La partitura espera a que cada nota suene bien.')}${modeBtn('tempo', 'A tempo', 'Cuenta de un compás y la partitura avanza sola.')}${lesson.songId ? modeBtn('memory', 'De memoria', 'Sin partitura: tocas y al final comparo lo que has tocado con la canción.').replace('mode-btn', 'mode-btn wide') : ''}</div>`
      : `<button type="button" class="btn big" data-mode="learn" ${locked ? 'disabled' : ''}>Empezar</button>`}
    ${isSong && lesson.songId ? `<div class="row">${SONGS_IDS.has(lesson.songId) ? '<button type="button" class="btn ghost small" data-social="board">Clasificación</button>' : '<button type="button" class="btn ghost small" data-social="share">Compartir partitura</button>'}<button type="button" class="btn ghost small" data-social="challenge">Retar a un amigo</button></div>` : ''}
    ${song && song.style === MY_STYLE.id ? '<button type="button" class="btn ghost small danger" data-delete>Borrar esta partitura</button>' : ''}
    <button type="button" class="btn ghost small" data-close>Cerrar</button>
  </div>`;
  $('sheetBody').querySelectorAll('[data-social]').forEach(b => b.addEventListener('click', () => window.dispatchEvent(new CustomEvent('social-action', { detail: { action: b.dataset.social, songId: lesson.songId } }))));
  const del = $('sheetBody').querySelector('[data-delete]');
  if (del) {
    del.addEventListener('click', () => {
      if (!del.dataset.confirm) { del.dataset.confirm = '1'; del.textContent = 'Pulsa otra vez para borrarla'; return; }
      deleteImportedSong(song.id);
      $('sheet').close();
      onChange();
    });
  }
  $('sheetBody').querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
    $('sheet').close();
    launch(lesson, { mode: b.dataset.mode, from });
  }));
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('sheet').showModal();
}

// Lista de canciones para elegir con cuál comparar
export function openSongPicker(onPick) {
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>¿Qué canción has tocado?</h2>
    <div class="picker">${allSongs().map(s => `<button type="button" class="song" data-pick="${s.id}" style="--chip:${styleById(s.style).color}">
      <span class="song-art"><span class="ic">${icon('song')}</span></span><div><b>${esc(s.title)}</b><small>${esc(s.by)}</small></div><span></span></button>`).join('')}</div>
    <button type="button" class="btn ghost small" data-close>Cancelar</button></div>`;
  $('sheetBody').querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { $('sheet').close(); onPick(b.dataset.pick); }));
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('sheet').showModal();
}

// Cerrar al tocar fuera de la hoja
$('sheet').addEventListener('click', e => { if (e.target === $('sheet')) $('sheet').close(); });
