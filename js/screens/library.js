// Pestaña Canciones: cancionero de acordes (guitarra y piano), biblioteca filtrada por estilo y partituras importadas.
import { $, esc, icon, starsHtml } from '../ui.js';
import { register } from '../router.js';
import { allSongs, STYLES, MY_STYLE, styleById } from '../songs.js';
import { getState, instrumentProgress, knownChords } from '../store.js';
import { instrumentById } from '../instruments.js';
import { SONGBOOK, songbookStatus, songbookLesson, songbookById, chordsOf } from '../songbook.js';
import { chordLabel } from '../chords.js';
import { lessonKey } from '../course.js';
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
  const best = instrumentProgress()['song:' + song.id] || 0;
  const dots = [1, 2, 3].map(i => `<i class="${i <= song.difficulty ? 'on' : ''}"></i>`).join('');
  return `<button type="button" class="song" data-song="${esc(song.id)}" style="--chip:${style.color}">
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

// Cancionero: cada canción se abre en cuanto sabes sus acordes
function renderSongbook() {
  const poly = instrumentById(getState().instrument).polyphonic;
  $('songbook').hidden = !poly;
  if (!poly) return;
  const known = knownChords();
  const nom = getState().nom;
  const status = songbookStatus(known).sort((a, b) => a.missing.length - b.missing.length);
  const open = status.filter(x => !x.missing.length).length;
  $('songbook').innerHTML = `<div class="songbook-head"><div><b>Tu cancionero</b><small>Sabes ${known.length} ${known.length === 1 ? 'acorde' : 'acordes'}: puedes tocar ${open} de ${SONGBOOK.length} canciones</small></div>
      <span class="prog-bar"><i style="width:${Math.round(open / SONGBOOK.length * 100)}%"></i></span>
      <div class="known-chords">${known.map(c => `<span class="pill ok">${esc(chordLabel(c, nom))}</span>`).join('') || '<span class="muted small">Aprende tu primer acorde en la pestaña Aprender.</span>'}</div></div>
    ${status.map(({ entry, missing }) => {
      const best = instrumentProgress()[lessonKey(songbookLesson(entry))] || 0;
      return missing.length
        ? `<div class="song locked"><span class="song-art"><span class="ic">${icon('lock')}</span></span><div><b>${esc(entry.title)}</b><small>Te ${missing.length === 1 ? 'falta' : 'faltan'}: ${missing.map(c => esc(chordLabel(c, nom))).join(', ')}</small></div></div>`
        : `<button type="button" class="song" data-songbook="${entry.id}" style="--chip:var(--u4)"><span class="song-art"><span class="ic">${icon('chord')}</span></span>
            <div><b>${esc(entry.title)}</b><small>${esc(entry.by)} · ${chordsOf(entry).map(c => esc(chordLabel(c, nom))).join(' ')}</small></div><span class="song-side">${starsHtml(best)}</span></button>`;
    }).join('')}`;
}

function render() {
  renderSongbook();
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
$('songbook').addEventListener('click', e => {
  const b = e.target.closest('[data-songbook]');
  if (b) openLessonSheet(songbookLesson(songbookById(b.dataset.songbook)), { from: 'songs', onChange: render });
});
$('songList').addEventListener('click', e => {
  if (e.target.closest('[data-guide]')) { openGuide(); return; }
  const b = e.target.closest('[data-song]');
  if (b) openSong(b.dataset.song);
});
