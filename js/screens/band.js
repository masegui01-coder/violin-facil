// Pestaña Banda: el director crea la banda, pone tareas con partitura y ve el progreso; los músicos se unen con un código y ensayan.
import { $, esc, toast } from '../ui.js';
import { register, go, currentScreen } from '../router.js';
import { cloudConfigured, cloudErrorText } from '../cloud.js';
import * as api from '../band-api.js';
import { INSTRUMENTS, instrumentById } from '../instruments.js';
import { currentAccount } from '../account.js';

const accountName = () => String((currentAccount() && currentAccount().displayName) || '').slice(0, 30);
import { getState, update } from '../store.js';
import { myBand, syncActivity } from './band-sync.js';
import { directorView, bindDirector } from './band-director.js';
import { memberView, bindMember } from './band-member.js';
import { renderGroups, groupInviteCode } from './groups.js';
import { renderSchool, schoolInviteCode } from './school.js';

export { pendingBandLesson } from './band-sync.js';

let data = { tasks: [], members: [], progress: [], bandDoc: null, events: [], notices: [], rewards: [], library: [] };
let joinCode = new URLSearchParams(location.search).get('banda') || '';

const body = html => { $('bandBody').innerHTML = html; };
const band = () => getState().band;

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
      <input id="joinNick" class="input" maxlength="30" placeholder="Como te conoce tu banda" value="${esc(accountName())}">
      <label for="joinInst">Instrumento</label>
      <select id="joinInst" class="select">${INSTRUMENTS.map(i => `<option value="${i.id}" ${i.id === inst ? 'selected' : ''}>${i.name}</option>`).join('')}</select>
      <p class="muted small">Tu director verá tu progreso en las tareas; tus compañeros, solo los minutos de práctica y tu nivel.</p>
      <button class="btn" type="submit">Unirme</button>
      <p id="joinError" class="warn" hidden></p>
    </form>
    <form class="panel form" id="createForm">
      <h2>Soy director</h2>
      <label for="createName">Nombre de la banda</label>
      <input id="createName" class="input" maxlength="60" placeholder="Ej.: Banda Municipal de…">
      <label for="createNick">Tu nombre</label>
      <input id="createNick" class="input" maxlength="30" value="${esc(accountName())}">
      <p class="muted small">La banda queda en tu cuenta: no la pierdes si cambias de móvil.</p>
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
    const changed = instrument !== getState().instrument;
    update({ band: { ...joined, instrument, joinXp: getState().xp }, instrument });
    joinCode = '';
    toast(changed ? `Te has unido a ${joined.name}. Ahora practicas con ${instrumentById(instrument).name}` : `Te has unido a ${joined.name}`);
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

// ---------- Carga ----------
const ctx = () => ({ ...data, band: myBand() });

// Tareas mías sin terminar: las usan el aviso de la pestaña Banda y «Tu siguiente paso»
function rememberPending(c) {
  const b = c.band;
  const me = { uid: b.uid, id: b.uid, instrument: b.instrument, voice: b.voice || null };
  const done = new Set(c.progress.filter(p => p.uid === b.uid && p.completed).map(p => p.taskId));
  const pending = b.role === 'director' ? [] : c.tasks.filter(t => api.assignedTo(t, me) && !done.has(t.id))
    .map(t => ({ id: t.id, title: String(t.title || '').slice(0, 80), due: t.due || null }));
  if (JSON.stringify(pending) !== JSON.stringify(getState().bandPending || [])) update({ bandPending: pending });
}

function show() {
  const c = ctx();
  rememberPending(c);
  if (c.band.role === 'director') { body(directorView(c)); bindDirector(c, load, show); }
  else { body(memberView(c)); bindMember(c, render); }
}

// La ficha de la banda manda: si el director me cambió la voz o me hizo jefe de cuerda, lo guardo aquí
function adoptMemberDoc(members) {
  const b = band();
  const me = members.find(m => m.id === b.uid);
  if (!me || b.role === 'director') return;
  const role = me.role === 'leader' ? 'leader' : 'member';
  const voice = me.voice || null;
  if (role !== b.role || voice !== (b.voice || null)) update({ band: { ...b, role, voice } });
}

async function load() {
  const b = myBand();
  body('<p class="empty">Cargando tu banda…</p>');
  try {
    syncActivity(true).catch(() => {});
    const [tasks, members, bandDoc, events, notices, rewards, library] = await Promise.all([
      api.listTasks(b.bandId), api.listMembers(b.bandId), api.getBand(b.bandId),
      api.listSub(b.bandId, 'events'), api.listSub(b.bandId, 'notices'), api.listSub(b.bandId, 'rewards'), api.listSub(b.bandId, 'library').catch(() => []),
    ]);
    adoptMemberDoc(members);
    const progress = await api.listProgress(myBand());
    data = { tasks, members, progress, bandDoc, events, notices, rewards, library: library.sort((a, b) => a.title.localeCompare(b.title)) };
    show();
  } catch (err) {
    body(`<div class="panel"><h2>No he podido cargar la banda</h2><p class="warn">${esc(cloudErrorText(err))}</p><div class="row"><button type="button" class="btn small" id="retryBand">Reintentar</button><button type="button" class="btn ghost small" id="forgetBand">Salir de esta banda</button></div></div>`);
    $('retryBand').addEventListener('click', load);
    $('forgetBand').addEventListener('click', () => { update({ band: null, bandPending: [] }); render(); });
  }
}

function render() {
  const view = getState().bandView || 'band';
  document.querySelectorAll('[data-band-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.bandView === view));
  $('bandBody').hidden = view !== 'band';
  $('groupBody').hidden = view !== 'groups';
  $('schoolBody').hidden = view !== 'school';
  if (view === 'groups') { renderGroups(); return; }
  if (view === 'school') { renderSchool(); return; }
  if (!cloudConfigured()) { notConfigured(); return; }
  if (!band()) { welcome(); return; }
  load();
}

register('band', { enter: render });
document.querySelectorAll('[data-band-view]').forEach(b => b.addEventListener('click', () => { update({ bandView: b.dataset.bandView }); render(); }));

// Enlace de invitación a una escuela (?escuela=CÓDIGO): abre «Escuela» con el código puesto
if (schoolInviteCode() && getState().onboarded) {
  update({ bandView: 'school' });
  setTimeout(() => { if (currentScreen() !== 'band') go('band'); }, 0);
}

// Enlace de invitación a un grupo (?grupo=CÓDIGO): abre «Mis grupos» con el código puesto
if (groupInviteCode() && getState().onboarded) {
  update({ bandView: 'groups' });
  setTimeout(() => { if (currentScreen() !== 'band') go('band'); }, 0);
}

// Enlace de invitación (?banda=CÓDIGO): abre la pestaña Banda con el código puesto
if (joinCode && getState().onboarded && !band()) setTimeout(() => { if (currentScreen() !== 'band') go('band'); }, 0);
