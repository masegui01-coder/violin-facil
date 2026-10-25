// Formulario del director para crear una tarea: obra (del repertorio o MusicXML con todas sus partichelas), pasaje, modo, estrellas, fecha y a quién.
import { $, esc, toast } from '../ui.js';
import { allSongs, songById } from '../songs.js';
import { readMusicFile } from '../musicxml.js';
import { INSTRUMENTS, instrumentById } from '../instruments.js';
import { songPayload, partKey, payloadScore } from '../band-api.js';
import { voiceKeyName } from './band-ui.js';
import { cloudErrorText } from '../cloud.js';

export const MAX_BYTES = 5 * 1024 * 1024;

// MusicXML con varias partes: cada una a su instrumento y voz; las que no reconozco quedan como acompañamiento
export function partsFromSong(song) {
  const mapped = {};
  song.parts.forEach((p, i) => {
    const key = p.instrument ? partKey(p.instrument, p.voice) : `acc${i}`;
    if (mapped[key]) return;
    mapped[key] = songPayload({ ...song, parsed: p.parsed, key: p.key, time: p.time }, { xml: true, partName: p.name, transpose: p.transpose, percussion: p.percussion });
  });
  return mapped;
}

// Una sola parte (o una obra del repertorio, que está en sonido real) para un instrumento o para todos
export function singlePart(song) {
  const chosen = (song.parts || []).find(p => p.id === song.partId);
  return songPayload(song, chosen ? { transpose: chosen.transpose || 0, percussion: !!chosen.percussion } : {});
}

// library: obras del archivo de la banda; preset: { title, parts } para crear la tarea a partir de una de ellas
export function openTaskForm(band, members, onSave, { library = [], preset = null } = {}) {
  const musicians = members.filter(m => m.role !== 'director');
  const form = { mode: 'tempo', minStars: 2, assignType: 'all', parts: preset ? { ...preset.parts } : {} };

  const seg = (name, options, current) => options.map(([v, label]) => `<button type="button" data-${name}="${v}" aria-pressed="${String(v) === String(current)}">${label}</button>`).join('');
  const partsHtml = () => Object.entries(form.parts).map(([inst, p]) => `<span class="pill ok">${esc(voiceKeyName(inst))}: ${esc(p.partName || p.title)} <button type="button" class="link" data-remove-part="${inst}" aria-label="Quitar">✕</button></span>`).join(' ') || '<span class="muted small">Todavía no hay partitura</span>';

  $('sheetBody').innerHTML = `<form class="sheet-body form" id="taskForm">
    <h2>Nueva tarea</h2>
    <label for="tTitle">Título</label><input id="tTitle" class="input" maxlength="80" placeholder="Ej.: Pasaje del compás 24 al 40" value="${esc(preset ? preset.title : '')}">
    <label for="tNotes">Indicaciones</label><textarea id="tNotes" maxlength="500" placeholder="Ej.: Cuidad las respiraciones y el picado"></textarea>
    <label for="tSong">Obra</label>
    ${library.length ? `<select id="tLibrary" class="select"><option value="">Del archivo de la banda…</option>${library.map(l => `<option value="${l.id}">${esc(l.title)}</option>`).join('')}</select>` : ''}
    <div class="row"><select id="tSong" class="select"><option value="">Elige del repertorio…</option>${allSongs().map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select>
      <button type="button" class="btn ghost small" id="tImport">Importar MusicXML</button></div>
    <div class="row"><label for="tPartInst" class="small">Para</label><select id="tPartInst" class="select"><option value="all">Todos los instrumentos</option>${INSTRUMENTS.map(i => `<option value="${i.id}">Solo ${esc(i.name)}</option>`).join('')}</select></div>
    <p class="muted small">Si importas un MusicXML con varias partes, repartiré cada partichela a su instrumento y voz (y las demás sonarán de banda virtual). Una obra para «Todos» se transporta sola: cada músico la lee escrita para su instrumento (Si♭, Mi♭…) y toda la banda suena al unísono.</p>
    <div id="tParts" class="row">${partsHtml()}</div>
    <input id="tFile" type="file" hidden>
    <label class="check-chip"><input type="checkbox" id="tPassage"> Solo unos compases, en bucle y subiendo el tempo</label>
    <div class="row" id="tPassageBars" hidden><label for="tFrom" class="small">Del compás</label><input id="tFrom" class="input narrow" type="number" min="1" value="1">
      <label for="tTo" class="small">al</label><input id="tTo" class="input narrow" type="number" min="1" value="8"></div>
    <label>Modo de ensayo</label><div class="seg three" id="tMode">${seg('mode', [['learn', 'Nota a nota'], ['tempo', 'A tempo'], ['memory', 'De memoria']], form.mode)}</div>
    <label>Estrellas mínimas</label><div class="seg three" id="tStars">${seg('stars', [[1, '★'], [2, '★★'], [3, '★★★']], form.minStars)}</div>
    <label for="tDue">Fecha límite</label><input id="tDue" class="input" type="date">
    <label>Para quién</label><div class="seg three" id="tAssign">${seg('assign', [['all', 'Toda la banda'], ['instruments', 'Por instrumento'], ['members', 'Músicos']], form.assignType)}</div>
    <div id="tTargets" class="member-list"></div>
    <p id="tError" class="warn" hidden></p>
    <button class="btn big" type="submit">Crear tarea</button>
    <button type="button" class="btn ghost small" data-close>Cancelar</button>
  </form>`;

  const renderTargets = () => {
    const voices = [...new Set(musicians.filter(m => m.voice).map(m => partKey(m.instrument, m.voice)))].sort();
    const list = form.assignType === 'instruments'
      ? [...INSTRUMENTS.map(i => [i.id, i.name]), ...voices.map(k => [k, voiceKeyName(k)])]
      : form.assignType === 'members' ? musicians.map(m => [m.id, `${m.nickname} (${instrumentById(m.instrument).name})`]) : [];
    $('tTargets').innerHTML = list.map(([v, label]) => `<label class="check-chip"><input type="checkbox" value="${v}">${esc(label)}</label>`).join('')
      || (form.assignType === 'members' ? '<span class="muted small">Aún no hay músicos en la banda.</span>' : '');
  };
  const addPart = song => {
    form.parts = { ...form.parts, [$('tPartInst').value]: singlePart(song) };
    $('tParts').innerHTML = partsHtml();
    if (!$('tTitle').value) $('tTitle').value = song.title;
  };
  const addAllParts = song => {
    const mapped = partsFromSong(song);
    form.parts = { ...form.parts, ...mapped };
    $('tParts').innerHTML = partsHtml();
    if (!$('tTitle').value) $('tTitle').value = song.title;
    toast(`${Object.keys(mapped).filter(k => !k.startsWith('acc')).length} partichelas repartidas`);
  };
  const error = msg => { $('tError').textContent = msg; $('tError').hidden = false; };

  $('tLibrary')?.addEventListener('change', e => {
    const item = library.find(l => l.id === e.target.value);
    if (!item) return;
    form.parts = { ...item.parts };
    $('tParts').innerHTML = partsHtml();
    if (!$('tTitle').value) $('tTitle').value = item.title;
    e.target.value = '';
  });
  $('tSong').addEventListener('change', e => { if (e.target.value) addPart(songById(e.target.value)); e.target.value = ''; });
  $('tImport').addEventListener('click', () => $('tFile').click());
  $('tFile').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) { error('El archivo es demasiado grande.'); return; }
    try {
      const song = await readMusicFile(file.name, await file.arrayBuffer());
      if (song.parts.length > 1 && $('tPartInst').value === 'all') addAllParts(song); else addPart(song);
    } catch (err) { error(err.message); }
  });
  $('tParts').addEventListener('click', e => {
    const b = e.target.closest('[data-remove-part]');
    if (!b) return;
    const { [b.dataset.removePart]: _, ...rest } = form.parts;
    form.parts = rest;
    $('tParts').innerHTML = partsHtml();
  });
  const bindSeg = (id, key, attr, cast) => $(id).addEventListener('click', e => {
    const b = e.target.closest(`[data-${attr}]`);
    if (!b) return;
    form[key] = cast(b.dataset[attr]);
    $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    if (key === 'assignType') renderTargets();
  });
  bindSeg('tMode', 'mode', 'mode', String);
  bindSeg('tStars', 'minStars', 'stars', Number);
  bindSeg('tAssign', 'assignType', 'assign', String);
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('tPassage').addEventListener('change', e => { $('tPassageBars').hidden = !e.target.checked; });

  $('taskForm').addEventListener('submit', async e => {
    e.preventDefault();
    const title = $('tTitle').value.trim();
    const chosen = [...$('tTargets').querySelectorAll('input:checked')].map(i => i.value);
    if (!title) { error('Ponle un título a la tarea.'); return; }
    if (!Object.keys(form.parts).length) { error('Elige o importa la obra que hay que estudiar.'); return; }
    if (form.assignType !== 'all' && !chosen.length) { error('Marca al menos un instrumento o músico.'); return; }
    let passage = null;
    if ($('tPassage').checked) {
      const fromBar = Math.round(Number($('tFrom').value)), toBar = Math.round(Number($('tTo').value));
      const bars = Math.min(...Object.values(form.parts).map(p => payloadScore(p).bars.length));
      if (!(fromBar >= 1 && toBar >= fromBar && toBar <= bars)) { error(`Elige compases entre 1 y ${bars}.`); return; }
      passage = { fromBar, toBar };
    }
    const task = {
      title, notes: $('tNotes').value.trim(), mode: passage ? 'tempo' : form.mode, passage, minStars: form.minStars, due: $('tDue').value || null, parts: form.parts,
      assign: { type: form.assignType, instruments: form.assignType === 'instruments' ? chosen : [], members: form.assignType === 'members' ? chosen : [] },
    };
    try { await onSave(task); $('sheet').close(); } catch (err) { error(cloudErrorText(err)); toast('No se ha guardado la tarea'); }
  });
  $('sheet').showModal();
}
