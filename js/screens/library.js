// Pestaña Canciones: biblioteca filtrada por estilo.
import { $, esc, icon, starsHtml } from '../ui.js';
import { register } from '../router.js';
import { SONGS, STYLES, styleById } from '../songs.js';
import { getState } from '../store.js';
import { songLesson } from '../launch.js';
import { openLessonSheet } from './sheet.js';

let filter = 'mine';

function visibleSongs() {
  const mine = getState().styles;
  if (filter === 'all') return SONGS;
  if (filter === 'mine') return SONGS.filter(s => mine.includes(s.style));
  return SONGS.filter(s => s.style === filter);
}

function renderFilter() {
  const opts = [{ id: 'mine', name: 'Mis estilos', color: 'var(--ink)' }, { id: 'all', name: 'Todas', color: 'var(--ink)' }, ...STYLES];
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

function render() {
  renderFilter();
  const songs = [...visibleSongs()].sort((a, b) => a.difficulty - b.difficulty);
  $('songList').innerHTML = songs.length
    ? songs.map(songHtml).join('')
    : '<p class="empty">No has elegido estilos todavía. Elígelos en tu perfil o mira «Todas».</p>';
}

register('songs', { enter: render });

$('styleFilter').addEventListener('click', e => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  filter = b.dataset.filter;
  render();
});
$('songList').addEventListener('click', e => {
  const b = e.target.closest('[data-song]');
  if (b) openLessonSheet(songLesson(b.dataset.song), { from: 'songs' });
});
