// Importar partituras propias en MusicXML: vista previa, nombre y guía para conseguir el archivo.
import { $, esc, toast } from '../ui.js';
import { readMusicFile, parseMusicXml } from '../musicxml.js';
import { encodeScore } from '../passage.js';
import { getState } from '../store.js';
import { createStaff } from '../staff.js';
import { MY_STYLE } from '../songs.js';
import { addImportedSong } from '../store.js';

const MAX_BYTES = 5 * 1024 * 1024;
const EXAMPLE_URL = 'ejemplos/minueto-en-sol.musicxml';

let onSaved = () => {};

const GUIDE = `<div class="guide">
  <h2>Cómo conseguir tu partitura en MusicXML</h2>
  <p class="muted small">MusicXML es el formato estándar para intercambiar partituras. Casi todos los programas de música lo exportan.</p>
  <h3>Si ya la tienes en un programa de partituras</h3>
  <ol>
    <li><b>MuseScore</b> (gratis, para ordenador): abre la partitura y ve a <i>Archivo → Exportar</i>. Elige <i>MusicXML</i>; vale tanto .mxl como .musicxml.</li>
    <li><b>Sibelius, Finale, Dorico, Flat.io o Noteflight</b>: busca <i>Exportar → MusicXML</i>.</li>
  </ol>
  <h3>Si la tienes en papel o en PDF</h3>
  <ol>
    <li>Escanéala con una app de lectura de partituras que exporte a MusicXML. Por ejemplo, PlayScore 2 o Sheet Music Scanner; algunas solo exportan en su versión de pago.</li>
    <li>También puedes abrir el PDF en MuseScore con su función de importar PDF, revisarla y exportarla como en el paso anterior.</li>
    <li>Revisa siempre el resultado: los escáneres a veces confunden alguna nota o figura.</li>
  </ol>
  <h3>Consejos</h3>
  <ol>
    <li>Mejor si solo tiene la parte de violín. Si tiene varias, la app usa la que se llame «Violín» o, si no, la primera.</li>
    <li>De los acordes y dobles cuerdas se toca la nota más aguda.</li>
    <li>Pásate el archivo al móvil por WhatsApp, correo o Drive y elígelo con «Importar partitura».</li>
  </ol>
  <a class="btn ghost small" href="${EXAMPLE_URL}" download>Descargar un ejemplo para probar</a>
  <button type="button" class="btn small" data-close>Entendido</button>
</div>`;

function openSheet(html) {
  $('sheetBody').innerHTML = html;
  $('sheetBody').querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $('sheet').close()));
  if (!$('sheet').open) $('sheet').showModal();
}

export function openGuide() { openSheet(GUIDE); }

// Las otras voces se guardan comprimidas para la banda virtual
export function othersOf(song) {
  return (song.parts || []).filter(p => p.id !== song.partId).map(p => ({ name: p.name, transpose: p.transpose, percussion: p.percussion, enc: encodeScore(p.parsed) }));
}

function showPreview(song, fileName, title = null) {
  const count = song.parsed.notes.filter(n => !n.rest).length;
  openSheet(`<div class="sheet-body">
    <p class="eyebrow">Vista previa · ${esc(fileName)}</p>
    <label for="importTitle" class="small muted">Nombre</label>
    <input id="importTitle" class="title-input" value="${esc(title || song.title)}" maxlength="80">
    ${song.parts.length > 1 ? `<label for="importPart" class="small muted">Tu parte (las demás sonarán en la banda virtual)</label>
      <select id="importPart" class="select">${song.parts.map(p => `<option value="${esc(p.id)}" ${p.id === song.partId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>` : ''}
    <div class="sheet-facts"><span>${count} notas</span><span>${song.parsed.bars.length} compases</span><span>♩ = ${song.bpm}</span></div>
    ${song.warnings.map(w => `<p class="warn">${esc(w)}</p>`).join('')}
    <div class="review-scroll"><svg id="importStaff" class="staff" role="img" aria-label="Vista previa de la partitura"></svg></div>
    <button type="button" class="btn big" id="importSave">Guardar y ensayar</button>
    <button type="button" class="btn ghost small" data-close>Cancelar</button>
  </div>`);
  createStaff($('importStaff')).render(song.parsed, { key: song.key, time: song.time, mode: 'review', clef: song.parts.find(p => p.id === song.partId)?.percussion ? 'perc' : 'treble' });
  if ($('importPart')) $('importPart').addEventListener('change', e => showPreview({ ...parseMusicXml(song.source, e.target.value), source: song.source }, fileName, $('importTitle').value));
  $('importSave').addEventListener('click', () => {
    const title = $('importTitle').value.trim() || song.title;
    const { by, key, time, bpm, difficulty, parsed, partName } = song;
    const saved = { title, by, key, time, bpm, difficulty, parsed, partName, others: othersOf(song), id: 'imp-' + Date.now(), style: MY_STYLE.id, importedAt: new Date().toISOString() };
    addImportedSong(saved);
    $('sheet').close();
    toast('Partitura guardada en «Mis partituras»');
    onSaved(saved);
  });
}

async function importFile(file) {
  if (file.size > MAX_BYTES) { toast('El archivo es demasiado grande para una partitura'); return; }
  try {
    const first = await readMusicFile(file.name, await file.arrayBuffer());
    // si hay varias partes, se propone la de tu instrumento
    const mine = first.parts.find(p => p.instrument === getState().instrument);
    const song = mine && mine.id !== first.partId ? { ...parseMusicXml(first.source, mine.id), source: first.source } : first;
    showPreview(song, file.name);
  } catch (err) {
    openSheet(`<div class="sheet-body"><h2>No he podido leer «${esc(file.name)}»</h2>
      <p class="warn">${esc(err.message)}</p>
      <p class="muted small">Comprueba que sea un MusicXML (.musicxml, .xml o .mxl). Los PDF e imágenes hay que convertirlos antes.</p>
      <button type="button" class="btn ghost small" id="importGuide">Ver cómo conseguir un MusicXML</button>
      <button type="button" class="btn small" data-close>Cerrar</button></div>`);
    $('importGuide').addEventListener('click', openGuide);
  }
}

export function initImporter(savedCallback) {
  onSaved = savedCallback;
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importHelp').addEventListener('click', openGuide);
  $('importFile').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) importFile(file);
  });
}
