// Pestaña Canciones: cancionero de acordes (guitarra y piano), biblioteca filtrada por estilo y partituras importadas.
import { $, esc, icon, starsHtml } from '../ui.js';
import { register } from '../router.js';
import { allSongs, STYLES, MY_STYLE, styleById, songScore } from '../songs.js';
import { getState, instrumentProgress, knownChords } from '../store.js';
import { instrumentById } from '../instruments.js';
import { SONGBOOK, songbookStatus, songbookLesson, songbookById, chordsOf } from '../songbook.js';
import { chordLabel } from '../chords.js';
import { lessonKey, chordText } from '../course.js';
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

// Portada de cada obra: pictograma del estilo y, debajo, el contorno de sus primeras notas (cada tarjeta es distinta)
const STYLE_PICTO = {
  clasica: '<path d="M6 3c-3 4-2 10 3 12h6c5-2 6-8 3-12M9 5v10M12 4v11M15 5v10M8 21h8M12 15v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  folk: '<circle cx="9" cy="15" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="15" r="1.6" fill="currentColor"/><path d="M12.5 11.5L20 4M18 3l3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  jazz: '<path d="M15 3v8c0 5-2.5 9-6.5 9S3 17 4 14l2 1M15 6h3M15 9h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 2h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  rock: '<path d="M13 2L5 13h6l-1 9 8-12h-6z" fill="currentColor"/>',
  navidad: '<path d="M12 2l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 8l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4zM12 9l-4 6h2.5L7 20h10l-3.5-5H16z" fill="currentColor"/><path d="M12 20v2" stroke="currentColor" stroke-width="2"/>',
  populares: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>',
  mias: '<path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M11 17v-6l4-1" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9.6" cy="17" r="1.6" fill="currentColor"/>',
};
const ICON_FALLBACK = '<ellipse cx="8" cy="17" rx="3" ry="2.4" fill="currentColor"/><path d="M11 17V5l8-2v11" fill="none" stroke="currentColor" stroke-width="2"/>';
const CONTOUR_NOTES = 12;
const contourCache = new Map();

// Contorno melódico: las primeras notas (sin silencios) como una línea con puntos, normalizada a la miniatura
function contourSvg(song) {
  const key = song.id + ':' + (song.score || '').length;
  if (contourCache.has(key)) return contourCache.get(key);
  let midis = [];
  try { midis = songScore(song).notes.filter(n => !n.rest).slice(0, CONTOUR_NOTES).map(n => n.midi); } catch { midis = []; }
  let out = '';
  if (midis.length > 1) {
    const lo = Math.min(...midis), span = Math.max(1, Math.max(...midis) - lo);
    const pts = midis.map((m, i) => [6 + i * 40 / (midis.length - 1), 46 - (m - lo) / span * 18].map(v => v.toFixed(1)));
    out = `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity=".55"/>`
      + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.1" fill="currentColor"/>`).join('');
  }
  contourCache.set(key, out);
  return out;
}

function songArt(song) {
  const picto = STYLE_PICTO[song.style] || ICON_FALLBACK;
  return `<span class="song-art" aria-hidden="true"><svg viewBox="0 0 52 52"><g transform="translate(4 2) scale(.85)">${picto}</g>${contourSvg(song)}</svg></span>`;
}

function songHtml(song) {
  const style = styleById(song.style);
  const best = instrumentProgress()['song:' + song.id] || 0;
  const dots = [1, 2, 3].map(i => `<i class="${i <= song.difficulty ? 'on' : ''}"></i>`).join('');
  return `<button type="button" class="song" data-song="${esc(song.id)}" style="--chip:${style.color}">
    ${songArt(song)}
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
        ? `<div class="song locked"><span class="song-art"><span class="ic">${icon('lock')}</span></span><div><b>${esc(chordText(entry.title))}</b><small>Te ${missing.length === 1 ? 'falta' : 'faltan'}: ${missing.map(c => esc(chordLabel(c, nom))).join(', ')}</small></div></div>`
        : `<button type="button" class="song" data-songbook="${entry.id}" style="--chip:var(--u4)"><span class="song-art"><span class="ic">${icon('chord')}</span></span>
            <div><b>${esc(chordText(entry.title))}</b><small>${esc(entry.by)} · ${chordsOf(entry).map(c => esc(chordLabel(c, nom))).join(' ')}</small></div><span class="song-side">${starsHtml(best)}</span></button>`;
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
