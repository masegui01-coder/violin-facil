// Canción de un grupo (beta): la maqueta y las partes de cada músico sonando juntas, «¿dónde estamos?»
// con las partes de la canción y tus apuntes, y grabar tu parte en casa encima de lo que han subido los demás.
import { $, esc, toast } from '../ui.js';
import { register } from '../router.js';
import { cloudErrorText } from '../cloud.js';
import * as api from '../groups-api.js';
import * as gaudio from '../group-audio.js';
import { ctx as audioCtx } from '../audio.js';
import { getState } from '../store.js';
import { sectionAt, recordedStart, clock, MAX_SECONDS, MAX_UPLOAD_BYTES, SECTION_NAMES } from '../group-mix.js';
import { sheet } from './band-ui.js';
import { partName } from './groups.js';

const NUDGE_S = 0.3;
const COUNT_IN_BEATS = 4;

let ctx = null; // { group, songId, me }
let song = null;
let mixer = null;
let mix = {}; // id → { muted, solo }
let take = null; // grabación en curso o por revisar: { phase, pos, when, rec, buffer, blob, startAt, nudge }
let timer = 0;
const TICK_MS = 100;

const gid = () => ctx.group.groupId;
const myId = () => ctx.me.uid;
const trackKey = tid => `${gid()}/${ctx.songId}/${tid}`;

async function enter(params) {
  if (params && params.group) ctx = params;
  if (!ctx) return;
  $('gsTitle').textContent = 'Cargando…';
  $('gsBody').innerHTML = '<p class="empty">Descargando las pistas…</p>';
  mixer = gaudio.createMixer();
  mix = {};
  take = null;
  try {
    song = await api.getSong(gid(), ctx.songId);
    if (!song) throw new Error('Esta canción ya no existe.');
    $('gsTitle').textContent = song.title;
    document.title = `${song.title} · Band Flow`;
    await loadTracks();
    render();
    tick();
  } catch (err) {
    $('gsBody').innerHTML = `<p class="warn">${esc(cloudErrorText(err))}</p>`;
  }
}

async function loadTracks() {
  const parts = Object.entries(song.parts || {});
  await Promise.all(parts.map(async ([tid, p]) => {
    try {
      let bytes = await gaudio.cachedTrack(trackKey(tid), p.version);
      if (!bytes) {
        bytes = await api.loadTrackAudio(gid(), ctx.songId, tid, p.chunks);
        gaudio.storeTrack(trackKey(tid), p.version, bytes);
      }
      mixer.set(tid, await gaudio.decode(bytes), p.startAt || 0);
    } catch (e) { toast(`No he podido cargar la pista de ${p.nickname}`); }
  }));
}

function leave() {
  clearInterval(timer);
  if (take && take.rec) take.rec.stop();
  take = null;
  if (mixer) mixer.destroy();
  mixer = null;
}

register('groupsong', { enter, leave });

// ---------- Pintar ----------
function trackRow(tid, p) {
  const st = mix[tid] || {};
  const mine = tid === myId() || (tid === 'demo' && p.by === myId());
  return `<div class="gs-track"><div><b>${tid === 'demo' ? 'Maqueta' : esc(p.nickname)}</b><small>${tid === 'demo' ? 'Referencia de la canción' : esc(partName(p.instrument))}${tid === myId() ? ' · tú' : ''}</small></div>
    <div class="gs-track-ctl">
      <button type="button" class="chip-btn" data-mute="${esc(tid)}" aria-pressed="${!!st.muted}" aria-label="Silenciar">${st.muted ? 'Silenciada' : 'Suena'}</button>
      <button type="button" class="chip-btn" data-solo="${esc(tid)}" aria-pressed="${!!st.solo}">Solo</button>
      <input type="range" min="0" max="1.5" step="0.05" value="${st.volume ?? 1}" data-vol="${esc(tid)}" aria-label="Volumen de ${tid === 'demo' ? 'la maqueta' : esc(p.nickname)}">
      ${mine ? `<button type="button" class="text-link" data-del-track="${esc(tid)}">Borrar</button>` : ''}
    </div></div>`;
}

function render() {
  const parts = song.parts || {};
  const len = Math.max(1, mixer.length());
  const sections = [...(song.sections || [])].sort((a, b) => a.at - b.at);
  const hasDemo = !!parts.demo;
  $('gsBody').innerHTML = `
    <div class="gs-where" aria-live="polite"><small>Ahora suena</small><b id="gsSection">—</b><p id="gsNotes" class="small"></p><small id="gsNext"></small></div>
    <div class="gs-timeline" id="gsTimeline" role="slider" aria-label="Posición en la canción" aria-valuemin="0" aria-valuemax="${Math.round(len)}" tabindex="0">
      ${sections.map(s => `<span class="gs-mark" style="left:${(s.at / len) * 100}%" title="${esc(s.name)}"></span>`).join('')}<i id="gsHead"></i></div>
    <div class="row spread small"><span id="gsClock">0:00</span><span>${clock(len)}</span></div>
    <div class="row gs-transport">
      <button type="button" class="btn" id="gsPlay" ${take && take.phase === 'recording' ? 'disabled' : ''}>${mixer.playing() ? 'Pausa' : 'Escuchar'}</button>
      <button type="button" class="btn ghost small" id="gsStart">Al principio</button>
      <button type="button" class="btn ghost small" id="gsMark">Marcar parte aquí</button>
    </div>
    ${takePanel(hasDemo)}
    <h2>Pistas</h2>
    ${Object.keys(parts).length ? Object.entries(parts).sort(([a], [b]) => (a === 'demo' ? -1 : b === 'demo' ? 1 : 0)).map(([tid, p]) => trackRow(tid, p)).join('') : '<p class="empty">Todavía no hay pistas. Sube la maqueta o graba la primera parte.</p>'}
    <p class="muted small">Pon en «Solo» a quien quieras escuchar, o silencia tu instrumento para tocar encima de los demás como en un ensayo.</p>
    <h2>Partes de la canción</h2>
    ${sections.length ? `<div class="list">${sections.map((s, i) => `<button type="button" class="list-row" data-section="${i}"><span><b>${esc(s.name)} · ${clock(s.at)}</b><small>${s.notes && s.notes[myId()] ? esc(s.notes[myId()]) : 'Toca para apuntar qué tocas tú aquí'}</small></span><span class="chev">›</span></button>`).join('')}</div>`
      : '<p class="muted small">Mientras suena, pulsa «Marcar parte aquí» al empezar cada parte (intro, estrofa, estribillo…). Así todos sabréis por dónde va la canción.</p>'}`;
  bind();
}

function takePanel(hasDemo) {
  if (!gaudio.recordingSupported()) return '<p class="warn small">Este navegador no permite grabar. Prueba con Chrome o Safari actualizados.</p>';
  if (take && take.phase === 'recording') {
    return `<div class="panel gs-rec"><b>● Grabando…</b><span class="muted small">Toca tu parte. Pulsa «Parar» al terminar (máximo 5 minutos).</span>
      <button type="button" class="btn" id="gsStop">Parar</button></div>`;
  }
  if (take && take.phase === 'review') {
    return `<div class="panel gs-rec"><b>Escucha tu toma con los demás</b>
      <label for="gsNudge" class="small">Si se oye adelantada o retrasada, ajústala: <span id="gsNudgeVal">${Math.round(take.nudge * 1000)} ms</span></label>
      <input type="range" id="gsNudge" min="${-NUDGE_S}" max="${NUDGE_S}" step="0.01" value="${take.nudge}">
      <div class="row"><button type="button" class="btn" id="gsUpload">Subir ${take.demo ? 'la maqueta' : 'mi parte'}</button><button type="button" class="btn ghost small" id="gsRetake">Repetir</button><button type="button" class="btn ghost small" id="gsDiscard">Descartar</button></div>
      <p id="gsUploadState" class="muted small" hidden></p></div>`;
  }
  return `<div class="panel gs-rec">
    <b>${hasDemo ? 'Graba tu parte' : 'Empieza por la maqueta'}</b>
    <span class="muted small">${hasDemo ? 'Ponte auriculares (mejor con cable): oirás la cuenta previa y a los demás, y el micrófono solo te grabará a ti.' : 'Sube la grabación del ensayo o graba una versión sencilla (voz y guitarra, por ejemplo) para que el resto toque encima.'}</span>
    <div class="row">
      ${hasDemo ? '<button type="button" class="btn" id="gsRecord">Grabar mi parte</button>' : '<button type="button" class="btn" id="gsRecordDemo">Grabar la maqueta</button>'}
      <label class="btn ghost small" for="gsFile">${hasDemo ? 'Cambiar la maqueta' : 'Subir un audio'}</label>
      <input type="file" id="gsFile" accept="audio/*" hidden>
    </div>
    ${getState().percLatency ? '' : '<p class="muted small">Consejo: en Estudio → «Calibrar el micrófono» mides el retraso de tu móvil y las tomas cuadrarán mejor.</p>'}</div>`;
}

function bind() {
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  on('gsPlay', () => { if (mixer.playing()) mixer.stop(); else mixer.play(mixer.position() >= mixer.length() ? 0 : mixer.position()); render(); });
  on('gsStart', () => { mixer.seek(0); });
  on('gsMark', markSection);
  on('gsRecord', () => startTake(false));
  on('gsRecordDemo', () => startTake(true));
  on('gsStop', stopTake);
  on('gsUpload', uploadTake);
  on('gsRetake', () => { const demo = take.demo; dropTake(); startTake(demo); });
  on('gsDiscard', () => { dropTake(); render(); });
  const nudge = $('gsNudge');
  if (nudge) nudge.addEventListener('input', () => {
    take.nudge = Number(nudge.value);
    $('gsNudgeVal').textContent = `${Math.round(take.nudge * 1000)} ms`;
    mixer.set('__take', take.buffer, take.startAt + take.nudge);
  });
  const file = $('gsFile');
  if (file) file.addEventListener('change', () => file.files[0] && uploadDemoFile(file.files[0]));
  $('gsTimeline').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    mixer.seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * mixer.length());
  });
  $('gsBody').querySelectorAll('[data-mute]').forEach(b => b.addEventListener('click', () => toggle(b.dataset.mute, 'muted')));
  $('gsBody').querySelectorAll('[data-solo]').forEach(b => b.addEventListener('click', () => toggle(b.dataset.solo, 'solo')));
  $('gsBody').querySelectorAll('[data-vol]').forEach(r => r.addEventListener('input', () => {
    mix = { ...mix, [r.dataset.vol]: { ...mix[r.dataset.vol], volume: Number(r.value) } };
    mixer.setVolume(r.dataset.vol, Number(r.value));
  }));
  $('gsBody').querySelectorAll('[data-del-track]').forEach(b => b.addEventListener('click', () => deleteTrack(b, b.dataset.delTrack)));
  $('gsBody').querySelectorAll('[data-section]').forEach(b => b.addEventListener('click', () => editSection(Number(b.dataset.section))));
}

function toggle(tid, key) {
  mix = { ...mix, [tid]: { ...mix[tid], [key]: !(mix[tid] && mix[tid][key]) } };
  mixer.setState(mix);
  render();
}

// Cada décima de segundo: reloj, cabezal y «¿dónde estamos?»
function tick() {
  clearInterval(timer);
  const step = () => {
    if (!mixer || !$('gsClock')) return;
    const len = Math.max(1, mixer.length());
    const pos = mixer.position();
    if (mixer.playing() && pos >= len && !(take && take.phase === 'recording')) { mixer.stop(0); render(); }
    if (take && take.phase === 'recording' && pos - take.pos > MAX_SECONDS) stopTake();
    $('gsClock').textContent = clock(pos);
    $('gsHead').style.left = `${Math.min(100, (pos / len) * 100)}%`;
    const where = sectionAt(song.sections, pos);
    $('gsSection').textContent = where.current ? where.current.name : (song.sections || []).length ? 'Antes de empezar' : '—';
    $('gsNotes').textContent = where.current && where.current.notes ? where.current.notes[myId()] || '' : '';
    $('gsNext').textContent = where.next ? `${where.next.name} en ${Math.ceil(where.inNext)} s` : '';
  };
  timer = setInterval(step, TICK_MS);
}

// ---------- Partes de la canción ----------
async function saveSections(sections) {
  try {
    await api.updateSong(gid(), ctx.songId, { sections });
    song = { ...song, sections };
    render();
  } catch (err) { toast(cloudErrorText(err)); }
}

function markSection() {
  const at = Math.round(mixer.position() * 10) / 10;
  sheet(`<h2>Parte que empieza en ${clock(at)}</h2><div class="chips-row wrap">${SECTION_NAMES.map(n => `<button type="button" class="chip-btn" data-name="${n}">${n}</button>`).join('')}</div>`, box => {
    box.querySelectorAll('[data-name]').forEach(b => b.addEventListener('click', () => {
      $('sheet').close();
      saveSections([...(song.sections || []), { name: b.dataset.name, at, notes: {} }].sort((a, b2) => a.at - b2.at));
    }));
  });
}

function editSection(i) {
  const sections = [...(song.sections || [])].sort((a, b) => a.at - b.at);
  const s = sections[i];
  const others = Object.entries(s.notes || {}).filter(([uid]) => uid !== myId());
  sheet(`<h2>${esc(s.name)} · ${clock(s.at)}</h2>
    <label for="gsNote">Qué toco yo aquí (acordes, ritmo, una nota para acordarte…)</label>
    <textarea id="gsNote" class="input" maxlength="200" rows="3">${esc((s.notes || {})[myId()] || '')}</textarea>
    ${others.length ? `<p class="muted small">Tus compañeros también han apuntado cosas en esta parte.</p>` : ''}
    <div class="row"><button type="button" class="btn" id="gsNoteOk">Guardar</button><button type="button" class="btn ghost small" id="gsGo">Ir a esta parte</button><button type="button" class="btn ghost small danger" id="gsDelSection">Quitar la parte</button></div>`, box => {
    box.querySelector('#gsNoteOk').addEventListener('click', () => {
      $('sheet').close();
      const notes = { ...(s.notes || {}), [myId()]: $('gsNote').value.trim().slice(0, 200) };
      saveSections(sections.map((x, j) => (j === i ? { ...x, notes } : x)));
    });
    box.querySelector('#gsGo').addEventListener('click', () => { $('sheet').close(); mixer.seek(s.at); });
    box.querySelector('#gsDelSection').addEventListener('click', () => { $('sheet').close(); saveSections(sections.filter((_, j) => j !== i)); });
  });
}

// ---------- Grabar ----------
async function startTake(demo) {
  try {
    const pos = demo ? 0 : Math.min(mixer.position(), Math.max(0, mixer.length() - 1));
    mixer.stop(pos);
    const rec = await gaudio.startTake();
    const when = audioCtx().currentTime + (COUNT_IN_BEATS * 60) / (song.bpm || 100) + 0.1;
    gaudio.countIn(when, song.bpm || 100, COUNT_IN_BEATS);
    mixer.play(pos, when, [demo ? 'demo' : myId(), '__take']);
    take = { phase: 'recording', demo, pos, when, rec, nudge: 0 };
    render();
  } catch (err) { toast((err && err.message) || 'No he podido empezar a grabar'); }
}

async function stopTake() {
  if (!take || take.phase !== 'recording') return;
  const t = take;
  take = { ...t, phase: 'saving' };
  mixer.stop(t.pos);
  const blob = await t.rec.stop();
  try {
    const buffer = await gaudio.decode(blob);
    const startAt = t.demo ? -(t.when - t.rec.startedAt) : recordedStart(t.pos, t.when - t.rec.startedAt, getState().percLatency || 0);
    take = { ...t, phase: 'review', blob, buffer, startAt, rec: null };
    mixer.set('__take', buffer, startAt);
    mix = { ...mix, [t.demo ? 'demo' : myId()]: { ...mix[t.demo ? 'demo' : myId()], muted: true } };
    mixer.setState(mix);
    mixer.play(t.pos);
  } catch (e) {
    take = null;
    toast('No he podido leer la grabación. Prueba otra vez.');
  }
  render();
}

function dropTake() {
  mixer.stop();
  mixer.remove('__take');
  const tid = take && take.demo ? 'demo' : myId();
  mix = { ...mix, [tid]: { ...mix[tid], muted: false } };
  mixer.setState(mix);
  take = null;
}

async function uploadTake() {
  const t = take;
  const tid = t.demo ? 'demo' : myId();
  const duration = Math.min(t.buffer.duration, MAX_SECONDS + 20);
  $('gsUpload').disabled = true;
  $('gsUploadState').hidden = false;
  $('gsUploadState').textContent = 'Subiendo…';
  try {
    const info = await api.saveTrack(gid(), ctx.songId, tid, t.blob, {
      nickname: ctx.me.nickname, instrument: t.demo ? 'otro' : ctx.me.instrument, by: myId(), startAt: t.startAt + t.nudge, duration,
    });
    const bytes = new Uint8Array(await t.blob.arrayBuffer());
    gaudio.storeTrack(trackKey(tid), info.version, bytes);
    song = { ...song, parts: { ...(song.parts || {}), [tid]: info } };
    mixer.set(tid, t.buffer, info.startAt);
    dropTake();
    toast(t.demo ? 'Maqueta subida' : 'Tu parte ya está en el grupo');
    render();
  } catch (err) {
    $('gsUpload').disabled = false;
    $('gsUploadState').textContent = cloudErrorText(err);
  }
}

async function uploadDemoFile(file) {
  if (file.size > MAX_UPLOAD_BYTES) { toast('El archivo es muy grande (máximo 6 MB). Graba la maqueta con la app: ocupa mucho menos.'); return; }
  try {
    const buffer = await gaudio.decode(file);
    if (buffer.duration > MAX_SECONDS + 5) { toast('La maqueta dura más de 5 minutos, el máximo de la beta.'); return; }
    toast('Subiendo la maqueta…');
    const info = await api.saveTrack(gid(), ctx.songId, 'demo', file, { nickname: ctx.me.nickname, instrument: 'otro', by: myId(), startAt: 0, duration: buffer.duration });
    gaudio.storeTrack(trackKey('demo'), info.version, new Uint8Array(await file.arrayBuffer()));
    song = { ...song, parts: { ...(song.parts || {}), demo: info } };
    mixer.set('demo', buffer, 0);
    toast('Maqueta subida');
    render();
  } catch (err) { toast(err && err.name === 'EncodingError' ? 'No reconozco ese audio. Prueba con un mp3 o m4a.' : cloudErrorText(err)); }
}

async function deleteTrack(btn, tid) {
  if (!btn.dataset.confirm) { btn.dataset.confirm = '1'; btn.textContent = '¿Seguro?'; return; }
  try {
    await api.deleteTrack(gid(), ctx.songId, tid);
    const { [tid]: gone, ...parts } = song.parts || {};
    song = { ...song, parts };
    mixer.remove(tid);
    render();
  } catch (err) { toast(cloudErrorText(err)); }
}
