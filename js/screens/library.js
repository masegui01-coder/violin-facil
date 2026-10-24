// Pestaña Canciones: biblioteca filtrada por estilo y partituras importadas.
import { $, esc, icon, starsHtml } from '../ui.js';
import { register } from '../router.js';
import { allSongs, STYLES, MY_STYLE, styleById } from '../songs.js';
import { getState } from '../store.js';
import { songLesson } from '../launch.js';
import { openLessonSheet } from './sheet.js';
import { initImporter, openGuide } from './importer.js';

let filter = 'mine';

function visibleSongs() {
  const mine = getState().styles;
  const songs = allSongs();
  if (filter === 'all') return songs;
  if (filter === 'mine') return songs.filter(s => mine.includes(s.style));
  return songs.filter(s => s.style === filter);
}

function renderFilter() {
  const opts = [{ id: 'mine', name: 'Mis estilos', color: 'var(--ink)' }, { id: 'all', name: 'Todas', color: 'var(--ink)' }, MY_STYLE, ...STYLES];
  $('styleFilter').innerHTML = opts.map(o => `<button type="button" data-filter="${o.id}" aria-pressed="${o.id === filter}" style="--chip:${o.color}">${esc(o.name)}</button>`).join('');
}

function songHtml(song) {
  const style = styleById(song.style);
  const best = getState().progress['song:' + song.id] || 0;
  const dots = [1, 2, 3].map(i => `<i class="${i <= song.difficulty ? 'on' : ''}"></i>`).join('');
  return `<button type="button" class="song" data-song="${song.id}" style="--chip:${style.color}">
    <span class="song-art"><span class="ic">${icon('song')}</span></span>
    <div><b>${esc(song.title)}</b><small>${esc(song.by)} · ${esc(style.name)}</small></div>
    <span class="song-side">${starsHtml(best)}<span class="level-dots" title="Dificultad ${song.difficulty} de 3">${dots}</span></span>
  </button>`;
}

function emptyHtml() {
  if (filter === MY_STYLE.id) {
    return '<p class="empty">Todavía no has importado ninguna partitura. <button type="button" class="btn ghost small" data-guide>Ver cómo conseguir un MusicXML</button></p>';
  }
  return '<p class="empty">No has elegido estilos todavía. Elígelos en tu perfil o mira «Todas».</p>';
}

function render() {
  renderFilter();
  const songs = [...visibleSongs()].sort((a, b) => (a.style === MY_STYLE.id) - (b.style === MY_STYLE.id) || a.difficulty - b.difficulty);
  $('songList').innerHTML = songs.length ? songs.map(songHtml).join('') : emptyHtml();
}

function openSong(id) {
  openLessonSheet(songLesson(id), { from: 'songs', onChange: render });
}

register('songs', { enter: render });

initImporter(song => {
  filter = MY_STYLE.id;
  render();
  openSong(song.id);
});

$('styleFilter').addEventListener('click', e => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  filter = b.dataset.filter;
  render();
});
$('songList').addEventListener('click', e => {
  if (e.target.closest('[data-guide]')) { openGuide(); return; }
  const b = e.target.closest('[data-song]');
  if (b) openSong(b.dataset.song);
});
