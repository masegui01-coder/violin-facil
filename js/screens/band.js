// Pestaña Banda: el director crea la banda, pone tareas con partitura y ve el progreso; los músicos se unen con un código y ensayan.
import { $, esc, toast, starsHtml } from '../ui.js';
import { register, go, currentScreen } from '../router.js';
import { cloudConfigured, cloudErrorText } from '../cloud.js';
import * as api from '../band-api.js';
import { INSTRUMENTS, instrumentById } from '../instruments.js';
import { getState, update } from '../store.js';
import { launch } from '../launch.js';
import { openTaskForm } from './band-task.js';

const MODE_NAME = { learn: 'Nota a nota', tempo: 'A tempo', memory: 'De memoria' };
const DAY_MS = 86400000;
let data = { tasks: [], members: [], progress: [] };
let joinCode = new URLSearchParams(location.search).get('banda') || '';

const body = html => { $('bandBody').innerHTML = html; };
const band = () => getState().band;
const fmtDate = ms => new Date(ms).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

function dueBadge(task) {
  if (!task.due) return '';
  const left = Math.ceil((new Date(task.due + 'T23:59') - Date.now()) / DAY_MS);
  const cls = left < 0 ? 'late' : left <= 2 ? 'warn' : '';
  return `<span class="pill ${cls}">${left < 0 ? 'Venció' : 'Hasta'} ${fmtDate(new Date(task.due + 'T12:00'))}</span>`;
}

// ---------- Sin servidor / sin banda ----------
function notConfigured() {
  body(`<div class="screen-head"><h1>Mi banda</h1><p class="muted">Tareas de ensayo para toda la banda, con el progreso de cada músico.</p></div>
    <div class="panel"><h2>Muy pronto</h2>
      <p>El director podrá crear su banda, poner obras para estudiar con fecha límite y ver cómo avanza cada músico. Los músicos se unen con un código, sin email.</p>
      <p class="muted small">Falta conectar el servidor de la app. Si eres el administrador, sigue la guía <i>docs/FIREBASE.md</i>.</p></div>`);
}

function welcome() {
  const inst = getState().instrument;
  body(`<div class="screen-head"><h1>Mi banda</h1><p class="muted">Ensaya las obras que te pone tu director y comparte tu progreso.</p></div>
    <form class="panel form" id="joinForm">
      <h2>Soy músico</h2>
      <label for="joinCodeInput">Código de la banda</label>
      <input id="joinCodeInput" class="input" maxlength="6" autocomplete="off" placeholder="Ej.: K7P2QX" value="${esc(joinCode)}" style="text-transform:uppercase">
      <label for="joinNick">Tu nombre o apodo</label>
      <input id="joinNick" class="input" maxlength="30" placeholder="Como te conoce tu banda">
      <label for="joinInst">Instrumento</label>
      <select id="joinInst" class="select">${INSTRUMENTS.map(i => `<option value="${i.id}" ${i.id === inst ? 'selected' : ''}>${i.name}</option>`).join('')}</select>
      <p class="muted small">No hace falta email. Solo tu director verá tu progreso.</p>
      <button class="btn" type="submit">Unirme</button>
      <p id="joinError" class="warn" hidden></p>
    </form>
    <form class="panel form" id="createForm">
      <h2>Soy director</h2>
      <label for="createName">Nombre de la banda</label>
      <input id="createName" class="input" maxlength="60" placeholder="Ej.: Banda Municipal de…">
      <label for="createNick">Tu nombre</label>
      <input id="createNick" class="input" maxlength="30">
      <p class="muted small">Entrarás con tu cuenta de Google para no perder la banda si cambias de móvil.</p>
      <button class="btn ghost" type="submit">Crear banda</button>
      <p id="createError" class="warn" hidden></p>
    </form>`);
  $('joinForm').addEventListener('submit', onJoin);
  $('createForm').addEventListener('submit', onCreate);
}

async function onJoin(e) {
  e.preventDefault();
  const code = $('joinCodeInput').value.trim().toUpperCase();
  const nickname = $('joinNick').value.trim();
  const instrument = $('joinInst').value;
  if (code.length !== 6 || !nickname) { showError('joinError', 'Escribe el código de 6 caracteres y tu nombre.'); return; }
  try {
    const joined = await api.joinBand(code, nickname, instrument);
    update({ band: { ...joined, instrument }, instrument });
    joinCode = '';
    toast(`Te has unido a ${joined.name}`);
    render();
  } catch (err) { showError('joinError', cloudErrorText(err)); }
}

async function onCreate(e) {
  e.preventDefault();
  const name = $('createName').value.trim();
  const nickname = $('createNick').value.trim();
  if (!name || !nickname) { showError('createError', 'Escribe el nombre de la banda y el tuyo.'); return; }
  try {
    const created = await api.createBand(name, nickname, getState().instrument);
    update({ band: created });
    render();
  } catch (err) { showError('createError', cloudErrorText(err)); }
}

function showError(id, msg) { $(id).textContent = msg; $(id).hidden = false; }

// ---------- Músico ----------
function myStatus(task) {
  const p = data.progress.find(x => x.taskId === task.id);
  if (!p) return '<span class="pill">Pendiente</span>';
  if (p.completed) return '<span class="pill ok">Hecha ✓</span>';
  return `<span class="pill warn">En curso · ${p.bestStars}★</span>`;
}

function taskPart(task) {
  const inst = band().instrument || getState().instrument;
  return (task.parts && (task.parts[inst] || task.parts.all)) || null;
}

function memberView() {
  const b = band();
  const me = { uid: b.uid, instrument: b.instrument || getState().instrument };
  const mine = data.tasks.filter(t => api.assignedTo(t, me));
  const minutes = data.progress.reduce((s, p) => s + (p.minutes || 0), 0);
  body(`<div class="band-hero"><p class="eyebrow">Mi banda</p><h1>${esc(b.name)}</h1><p>${esc(b.nickname)} · ${esc(instrumentById(me.instrument).name)}</p></div>
    <div class="stats"><div class="stat"><b>${mine.filter(t => data.progress.find(p => p.taskId === t.id && p.completed)).length}/${mine.length}</b><span>tareas hechas</span></div>
      <div class="stat"><b>${Math.round(minutes)}</b><span>minutos ensayados</span></div>
      <div class="stat"><b>${data.progress.reduce((s, p) => s + (p.attempts || 0), 0)}</b><span>intentos</span></div></div>
    <h2>Tareas</h2>
    ${mine.length ? mine.map(t => `<div class="task"><div class="task-head"><div><b>${esc(t.title)}</b><br><small>${esc(taskPart(t)?.title || '')} · ${MODE_NAME[t.mode]} · mínimo ${t.minStars}★</small></div>${myStatus(t)}</div>
      ${t.notes ? `<p class="small">${esc(t.notes)}</p>` : ''}
      <div class="row spread">${dueBadge(t)}<button type="button" class="btn small" data-practice="${t.id}">Ensayar</button></div></div>`).join('')
      : '<p class="empty">Tu director todavía no ha puesto tareas.</p>'}
    <button type="button" class="btn ghost small" id="leaveBand">Salir de la banda en este móvil</button>`);
}

function practiceTask(task) {
  const part = taskPart(task);
  if (!part) { toast('Esta tarea no tiene partitura para tu instrumento'); return; }
  const lesson = { id: 'task-' + task.id, kind: 'song', song: { ...part, id: 'task-' + task.id, style: null, difficulty: 2 }, taskId: task.id, task };
  launch(lesson, { mode: task.mode, from: 'band' });
}

// ---------- Director ----------
function taskSummary(task) {
  const targets = data.members.filter(m => m.role !== 'director' && api.assignedTo(task, m));
  const done = targets.filter(m => data.progress.some(p => p.taskId === task.id && p.uid === m.id && p.completed)).length;
  return { targets, done };
}

function directorView() {
  const b = band();
  const link = `${location.origin}${location.pathname}?banda=${b.code}`;
  const musicians = data.members.filter(m => m.role !== 'director');
  body(`<div class="band-hero"><p class="eyebrow">Director · ${esc(b.name)}</p><p>Código para unirse</p><div class="band-code">${esc(b.code)}</div>
      <div class="row"><button type="button" class="btn small" id="shareInvite">Compartir invitación</button></div></div>
    <div class="row spread"><h2>Tareas</h2><button type="button" class="btn small" id="newTask">Nueva tarea</button></div>
    ${data.tasks.length ? data.tasks.map(t => {
      const s = taskSummary(t);
      return `<div class="task"><div class="task-head"><div><b>${esc(t.title)}</b><br><small>${esc(t.parts?.all?.title || Object.values(t.parts || {})[0]?.title || '')} · ${MODE_NAME[t.mode]} · mínimo ${t.minStars}★</small></div>
        <span class="pill ${s.done === s.targets.length && s.targets.length ? 'ok' : ''}">${s.done}/${s.targets.length}</span></div>
        <div class="row spread">${dueBadge(t)}<span class="row"><button type="button" class="btn ghost small" data-progress="${t.id}">Ver progreso</button><button type="button" class="btn ghost small danger" data-delete-task="${t.id}">Borrar</button></span></div>
        <div class="table-wrap" id="prog-${t.id}" hidden></div></div>`;
    }).join('') : '<p class="empty">Crea la primera tarea: elige una obra, el modo de ensayo y la fecha límite.</p>'}
    <h2>Músicos (${musicians.length})</h2>
    ${musicians.length ? `<div class="table-wrap"><table class="prog-table"><thead><tr><th>Músico</th><th>Instrumento</th><th class="num">Hechas</th><th class="num">Min.</th><th>Último ensayo</th></tr></thead><tbody>
      ${musicians.map(m => {
        const mine = data.progress.filter(p => p.uid === m.id);
        const last = Math.max(0, ...mine.map(p => api.millis(p.lastAt)));
        return `<tr data-member="${m.id}"><td><b>${esc(m.nickname)}</b></td><td>${esc(instrumentById(m.instrument).name)}</td><td class="num">${mine.filter(p => p.completed).length}</td>
          <td class="num">${Math.round(mine.reduce((s, p) => s + (p.minutes || 0), 0))}</td><td>${last ? fmtDate(last) : '—'}</td></tr>`;
      }).join('')}</tbody></table></div>` : `<p class="empty">Comparte el código <b>${esc(b.code)}</b> para que se unan.</p>`}`);
  $('shareInvite').addEventListener('click', async () => {
    const text = `Únete a «${b.name}» en Band Flow con el código ${b.code}: ${link}`;
    if (navigator.share) { try { await navigator.share({ title: 'Band Flow', text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Invitación copiada'); } catch (e) { toast(link); }
  });
  $('newTask').addEventListener('click', () => openTaskForm(b, data.members, async task => {
    await api.createTask(b.bandId, task);
    toast('Tarea creada');
    await load();
  }));
}

function progressTable(task) {
  const { targets } = taskSummary(task);
  return `<table class="prog-table"><thead><tr><th>Músico</th><th>Estado</th><th class="num">Mejor</th><th class="num">Acierto</th><th class="num">Intentos</th><th>Evolución</th></tr></thead><tbody>
    ${targets.map(m => {
      const p = data.progress.find(x => x.taskId === task.id && x.uid === m.id);
      const hist = (p?.history || []).slice(-10);
      return `<tr><td><b>${esc(m.nickname)}</b><br><small>${esc(instrumentById(m.instrument).name)}</small></td>
        <td>${!p ? '<span class="pill">Sin empezar</span>' : p.completed ? '<span class="pill ok">Hecha</span>' : '<span class="pill warn">En curso</span>'}</td>
        <td class="num">${p ? starsHtml(p.bestStars) : '—'}</td><td class="num">${p ? Math.round(p.bestAccuracy * 100) + ' %' : '—'}</td><td class="num">${p ? p.attempts : 0}</td>
        <td><span class="spark">${hist.map(h => `<i style="height:${Math.max(6, h.accuracy * 100)}%"></i>`).join('')}</span></td></tr>`;
    }).join('')}</tbody></table>`;
}

function memberSheet(memberId) {
  const m = data.members.find(x => x.id === memberId);
  const mine = data.progress.filter(p => p.uid === memberId);
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>${esc(m.nickname)}</h2><p class="muted small">${esc(instrumentById(m.instrument).name)}</p>
    ${data.tasks.filter(t => api.assignedTo(t, m)).map(t => {
      const p = mine.find(x => x.taskId === t.id);
      return `<div class="task"><div class="task-head"><b>${esc(t.title)}</b>${p ? (p.completed ? '<span class="pill ok">Hecha</span>' : '<span class="pill warn">En curso</span>') : '<span class="pill">Sin empezar</span>'}</div>
        ${p ? `<small>Mejor: ${p.bestStars}★ · ${Math.round(p.bestAccuracy * 100)} % · ${p.attempts} intentos · ${p.minutes} min</small><span class="spark">${(p.history || []).slice(-15).map(h => `<i style="height:${Math.max(6, h.accuracy * 100)}%"></i>`).join('')}</span>` : ''}</div>`;
    }).join('') || '<p class="empty">Sin tareas asignadas.</p>'}
    <button type="button" class="btn ghost small" data-close>Cerrar</button></div>`;
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('sheet').showModal();
}

// ---------- Carga y eventos ----------
async function load() {
  const b = band();
  body('<p class="empty">Cargando tu banda…</p>');
  try {
    const [tasks, members, progress] = await Promise.all([api.listTasks(b.bandId), b.role === 'director' ? api.listMembers(b.bandId) : Promise.resolve([]), api.listProgress(b)]);
    data = { tasks, members, progress };
    if (b.role === 'director') directorView(); else memberView();
  } catch (err) {
    body(`<div class="panel"><h2>No he podido cargar la banda</h2><p class="warn">${esc(cloudErrorText(err))}</p><button type="button" class="btn small" id="retryBand">Reintentar</button></div>`);
    $('retryBand').addEventListener('click', load);
  }
}

function render() {
  if (!cloudConfigured()) { notConfigured(); return; }
  if (!band()) { welcome(); return; }
  load();
}

register('band', { enter: render });

$('bandBody').addEventListener('click', async e => {
  const practice = e.target.closest('[data-practice]');
  const prog = e.target.closest('[data-progress]');
  const del = e.target.closest('[data-delete-task]');
  const member = e.target.closest('[data-member]');
  if (practice) practiceTask(data.tasks.find(t => t.id === practice.dataset.practice));
  if (prog) {
    const box = $('prog-' + prog.dataset.progress);
    box.hidden = !box.hidden;
    if (!box.hidden) box.innerHTML = progressTable(data.tasks.find(t => t.id === prog.dataset.progress));
  }
  if (del) {
    if (!del.dataset.confirm) { del.dataset.confirm = '1'; del.textContent = '¿Seguro?'; return; }
    try { await api.deleteTask(band().bandId, del.dataset.deleteTask); await load(); } catch (err) { toast(cloudErrorText(err)); }
  }
  if (member) memberSheet(member.dataset.member);
  if (e.target.closest('#leaveBand')) { update({ band: null }); render(); }
});

// Cada ensayo de una tarea se sube al servidor para que el director vea la evolución
window.addEventListener('lesson-finished', async e => {
  const { lesson, mode, stars, accuracy, minutes } = e.detail;
  if (!lesson.taskId || !band()) return;
  try { await api.reportProgress({ ...band(), instrument: band().instrument || getState().instrument }, lesson.task, { mode, stars, accuracy, minutes }); }
  catch (err) { toast('No se ha podido enviar tu progreso: ' + cloudErrorText(err)); }
});

// Enlace de invitación (?banda=CÓDIGO): abre la pestaña Banda con el código puesto
if (joinCode && getState().onboarded && !band()) setTimeout(() => { if (currentScreen() !== 'band') go('band'); }, 0);
