// Archivo de partituras de la banda: el director sube cada obra una vez (MusicXML con todas las partichelas o del
// repertorio) y desde ahí crea tareas; los músicos pueden ensayarlas cuando quieran, cada uno en su partichela.
import { $, esc, toast } from '../ui.js';
import * as api from '../band-api.js';
import { allSongs, songById } from '../songs.js';
import { readMusicFile } from '../musicxml.js';
import { cloudErrorText } from '../cloud.js';
import { launch } from '../launch.js';
import { partsFromSong, singlePart, MAX_BYTES } from './band-task.js';
import { voiceKeyName, sheet } from './band-ui.js';
import { section } from './director-common.js';
import { libraryLesson } from './band-sync.js';

const partsLabel = parts => Object.keys(parts || {}).filter(k => !k.startsWith('acc')).map(voiceKeyName).join(', ');

// ---------- Director ----------
export function libraryCard(ctx) {
  const list = ctx.library || [];
  return section('Archivo de partituras', `<p class="muted small">Sube aquí las partituras de la banda (MusicXML con todas las partichelas). Cada músico ve la suya, transportada a su instrumento, y puede ensayarlas cuando quiera. Desde aquí creas las tareas en un toque.</p>
    ${list.length ? `<div class="list">${list.map(l => `<div class="list-row static"><span><b>${esc(l.title)}</b><small>${esc(l.by || '')}${l.by ? ' · ' : ''}${esc(partsLabel(l.parts) || 'Para todos')}</small></span>
      <span class="row"><button type="button" class="btn small" data-act="lib-task:${l.id}">Crear tarea</button><button type="button" class="btn ghost small danger" data-act="del-sub:library:${l.id}">Borrar</button></span></div>`).join('')}</div>`
      : '<p class="muted">Todavía no hay partituras en el archivo.</p>'}
    <button type="button" class="btn small" data-act="lib-add">+ Subir partitura</button>`);
}

export function openLibraryUpload(ctx, reload) {
  const draft = { parts: {} };
  const status = () => { $('libParts').textContent = Object.keys(draft.parts).length ? `Listo: ${partsLabel(draft.parts) || 'para todos'}` : 'Todavía no hay partitura'; };
  sheet(`<h2>Subir al archivo</h2>
    <p class="muted small">Exporta la obra desde MuseScore, Sibelius, Finale o Dorico como MusicXML (.mxl o .musicxml). Si tiene varias partichelas, las repartiré por instrumento y voz.</p>
    <button type="button" class="btn" id="libFileBtn">Elegir archivo MusicXML</button><input id="libFile" type="file" hidden>
    <select id="libSong" class="select"><option value="">…o una obra del repertorio gratuito</option>${allSongs().map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select>
    <p id="libParts" class="small muted"></p>
    <label for="libTitle">Título</label><input id="libTitle" class="input" maxlength="80">
    <label for="libBy">Autor (opcional)</label><input id="libBy" class="input" maxlength="80">
    <p class="muted small">Sube solo partituras que tu banda tenga derecho a usar (compradas o con permiso). Se guardan solo para tu banda.</p>
    <p id="libError" class="warn" hidden></p>
    <button type="button" class="btn" id="libSave">Guardar en el archivo</button><button type="button" class="btn ghost small" data-close>Cancelar</button>`, box => {
    const error = msg => { $('libError').textContent = msg; $('libError').hidden = !msg; };
    const fill = song => {
      if (!$('libTitle').value) $('libTitle').value = song.title || '';
      if (!$('libBy').value && song.by && song.by !== 'Partitura importada') $('libBy').value = song.by;
      status();
    };
    status();
    box.querySelector('#libFileBtn').addEventListener('click', () => $('libFile').click());
    box.querySelector('#libFile').addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      if (file.size > MAX_BYTES) { error('El archivo es demasiado grande.'); return; }
      try {
        const song = await readMusicFile(file.name, await file.arrayBuffer());
        draft.parts = song.parts.length > 1 ? partsFromSong(song) : { all: singlePart(song) };
        error('');
        fill(song);
      } catch (err) { error(err.message); }
    });
    box.querySelector('#libSong').addEventListener('change', e => {
      const song = songById(e.target.value);
      if (!song) return;
      draft.parts = { all: singlePart(song) };
      fill(song);
    });
    box.querySelector('#libSave').addEventListener('click', async () => {
      const title = $('libTitle').value.trim();
      if (!Object.keys(draft.parts).length) { error('Elige el archivo o una obra.'); return; }
      if (!title) { error('Ponle un título.'); return; }
      try {
        await api.addSub(ctx.band.bandId, 'library', { title, by: $('libBy').value.trim(), parts: draft.parts });
        $('sheet').close();
        toast('Guardada en el archivo de la banda');
        reload();
      } catch (err) { error(cloudErrorText(err)); }
    });
  });
}

// ---------- Músicos ----------
export function memberLibraryHtml(ctx, me) {
  const list = (ctx.library || []).filter(l => api.taskPartFor(l, me));
  if (!list.length) return '';
  return `<h2>Partituras de la banda</h2><p class="muted small">Ensáyalas cuando quieras: cada una en tu partichela.</p>
    <div class="list">${list.map(l => `<div class="list-row static"><span><b>${esc(l.title)}</b><small>${esc(l.by || 'Archivo de la banda')}</small></span>
      <button type="button" class="btn small" data-lib="${l.id}">Ensayar</button></div>`).join('')}</div>`;
}

export function practiceLibrary(item, me) {
  const lesson = libraryLesson(item, me);
  if (!lesson) { toast('Esta obra no tiene partichela para tu instrumento'); return; }
  launch(lesson, { mode: 'tempo', from: 'band' });
}
