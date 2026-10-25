// Panel del director, pensado para usarlo cada día: Inicio (cómo va la banda), Tareas, Músicos, Agenda y Más.
// Las vistas viven en director-*.js; aquí están el menú, las fichas y todas las acciones (un único despachador).
import { $, esc, toast } from '../ui.js';
import * as api from '../band-api.js';
import { bandCsv, weekStarSuggestion } from '../band-stats.js';
import { instrumentById } from '../instruments.js';
import { weekId } from '../engage.js';
import { today, getState, update } from '../store.js';
import { cloudErrorText } from '../cloud.js';
import { attachTooltips } from '../charts.js';
import { openTaskForm } from './band-task.js';
import { seatName, sheet, fmtDay } from './band-ui.js';
import { derive, musiciansOf } from './director-common.js';
import { homeView } from './director-home.js';
import { tasksView, taskDetail, setTaskFilter } from './director-tasks.js';
import { membersView, memberDetail, setMemberSort, setMemberFamily } from './director-members.js';
import { agendaView, moreView, printReport, setTuneInst } from './director-more.js';
import { openLibraryUpload } from './band-library.js';

const NAV = [['home', 'Inicio'], ['tasks', 'Tareas'], ['members', 'Músicos'], ['agenda', 'Agenda'], ['more', 'Más']];
const VIEWS = { home: homeView, tasks: tasksView, members: membersView, agenda: agendaView, more: moreView };
const ALIAS = { musicos: 'members', agenda: 'agenda', tareas: 'tasks' };
const QR_LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
let tab = 'home';

export function directorView(ctx) {
  const b = ctx.band;
  const pending = derive(ctx);
  const late = ctx.tasks.filter(t => pending.statusOf(t).state === 'late').length;
  return `<div id="dirRoot" class="director">
    <header class="dir-head"><div><p class="eyebrow">Panel del director</p><h1>${esc(b.name)}</h1></div>
      <button type="button" class="code-chip" data-act="nav:more" title="Invitar">Código <b>${esc(b.code)}</b></button></header>
    <nav class="dir-nav" role="tablist">${NAV.map(([id, name]) => `<button type="button" role="tab" data-act="nav:${id}" aria-selected="${tab === id}">${name}${id === 'tasks' && late ? ` <span class="badge-dot">${late}</span>` : ''}</button>`).join('')}</nav>
    <div class="band-view">${VIEWS[tab](ctx)}</div></div>`;
}

// ---------- Fichas ----------
function openSheet(ctx, html, reload, rerender) {
  sheet(html, box => bindActions(box.querySelector('.sheet-body'), ctx, reload, rerender));
}

function stampSheet(ctx, docId, reload, rerender) {
  const p = ctx.progress.find(x => x.id === docId);
  openSheet(ctx, `<h2>Visto bueno · ${esc(p.nickname)}</h2><p class="muted small">El músico verá tu sello y tu comentario en la tarea.</p>
    <label class="check-chip"><input type="checkbox" id="stampOk" ${p.stamp ? 'checked' : ''}> Dar el visto bueno</label>
    <label for="stampText">Comentario</label><textarea id="stampText" maxlength="300" placeholder="Ej.: Muy bien el picado; cuida la respiración del compás 12">${esc(p.comment || '')}</textarea>
    <button type="button" class="btn" data-act="stamp-save:${docId}">Guardar</button><button type="button" class="btn ghost small" data-close>Cancelar</button>`, reload, rerender);
}

// Aviso para toda la banda o solo para algunos músicos (p. ej. quienes no han empezado una tarea)
function noticeSheet(ctx, to, text, reload, rerender) {
  const names = to.map(uid => ctx.members.find(m => m.id === uid)?.nickname).filter(Boolean);
  openSheet(ctx, `<h2>Aviso para ${names.length === 1 ? esc(names[0]) : `${names.length} músicos`}</h2>
    <p class="muted small">${esc(names.join(', '))}. Lo verán arriba en su pestaña Banda.</p>
    <textarea id="noticeTo" maxlength="300">${esc(text)}</textarea>
    <button type="button" class="btn" data-act="notice-send" data-to="${to.join(',')}">Enviar aviso</button><button type="button" class="btn ghost small" data-close>Cancelar</button>`, reload, rerender);
}

function pickStar(ctx, reload, rerender) {
  const musicians = musiciansOf(ctx);
  const suggestion = weekStarSuggestion(musicians, today());
  openSheet(ctx, `<h2>Músico de la semana</h2><p class="muted small">Lo verá toda la banda en su pestaña Banda hasta el lunes.</p>
    <label for="starWho">Músico</label><select id="starWho" class="select">${musicians.map(m => `<option value="${m.id}" ${suggestion?.member.id === m.id ? 'selected' : ''}>${esc(m.nickname)} · ${esc(seatName(m))}</option>`).join('')}</select>
    <label for="starNote">Por qué (opcional)</label><input id="starNote" class="input" maxlength="80" placeholder="Ej.: Por su constancia con la marcha">
    <button type="button" class="btn" data-act="star-save">Nombrar</button><button type="button" class="btn ghost small" data-close>Cancelar</button>`, reload, rerender);
}

// ---------- Invitación ----------
async function shareInvite(b) {
  const link = `${location.origin}${location.pathname}?banda=${b.code}`;
  const text = `Únete a «${b.name}» en Band Flow con el código ${b.code}: ${link}`;
  if (navigator.share) { try { await navigator.share({ title: 'Band Flow', text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); toast('Invitación copiada'); } catch (e) { toast(link); }
}

function loadQrLib() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = QR_LIB;
    s.onload = () => resolve(window.qrcode);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function showQr(b) {
  const box = $('qrBox');
  box.hidden = false;
  box.textContent = 'Generando…';
  try {
    const qrcode = await loadQrLib();
    const qr = qrcode(0, 'M');
    qr.addData(`${location.origin}${location.pathname}?banda=${b.code}`);
    qr.make();
    box.innerHTML = `${qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true })}<small>Escanéalo con la cámara del móvil</small>`;
  } catch (e) { box.textContent = 'No he podido generar el QR sin conexión. Usa «Compartir enlace».'; }
}

function downloadCsv(ctx) {
  const csv = bandCsv(musiciansOf(ctx), ctx.tasks, ctx.progress, today(), id => instrumentById(id).name);
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `informe-${ctx.band.name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}-${today()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Acciones ----------
const confirmFirst = el => { if (el.dataset.confirm) return true; el.dataset.confirm = '1'; el.textContent = '¿Seguro? Toca otra vez'; return false; };

async function act(key, el, ctx, reload, rerender) {
  const [name, ...rest] = key.split(':');
  const arg = rest.join(':');
  const b = ctx.band;
  const closeSheet = () => { if ($('sheet').open) $('sheet').close(); };
  switch (name) {
    case 'nav': tab = ALIAS[arg] || arg; closeSheet(); rerender(); window.scrollTo(0, 0); return;
    case 'tfilter': setTaskFilter(arg); rerender(); return;
    case 'mfamily': setMemberFamily(arg); rerender(); return;
    case 'new-task': openTaskForm(b, ctx.members, async task => { await api.createTask(b.bandId, task); toast('Tarea creada'); reload(); }, { library: ctx.library || [] }); return;
    case 'lib-add': openLibraryUpload(ctx, reload); return;
    case 'lib-task': {
      const item = ctx.library.find(l => l.id === arg);
      openTaskForm(b, ctx.members, async task => { await api.createTask(b.bandId, task); toast('Tarea creada'); reload(); }, { library: ctx.library, preset: { title: item.title, parts: item.parts } });
      return;
    }
    case 'task': openSheet(ctx, taskDetail(ctx, ctx.tasks.find(t => t.id === arg)), reload, rerender); return;
    case 'member': openSheet(ctx, memberDetail(ctx, ctx.members.find(m => m.id === arg)), reload, rerender); return;
    case 'stamp': stampSheet(ctx, arg, reload, rerender); return;
    case 'star': pickStar(ctx, reload, rerender); return;
    case 'share-invite': shareInvite(b); return;
    case 'show-qr': showQr(b); return;
    case 'csv': downloadCsv(ctx); return;
    case 'print': if (!printReport(ctx)) toast('Permite las ventanas emergentes para ver el informe'); return;
    case 'remind': {
      const task = ctx.tasks.find(t => t.id === arg);
      const to = derive(ctx).statusOf(task).notStarted.map(r => r.member.id);
      const name = /[«"]/.test(task.title) ? task.title : `«${task.title}»`;
      noticeSheet(ctx, to, `Recuerda practicar ${name}${task.due ? ` antes del ${fmtDay(task.due)}` : ''}. ¡Ánimo!`, reload, rerender);
      return;
    }
    case 'notice-to': noticeSheet(ctx, [arg], '', reload, rerender); return;
    default: break;
  }
  try {
    if (name === 'stamp-save') {
      await api.stampProgress(b.bandId, arg, { stamp: $('stampOk').checked, comment: $('stampText').value.trim() });
      closeSheet(); toast('Sello guardado'); reload();
    } else if (name === 'notice-send') {
      const text = $('noticeTo').value.trim();
      if (!text) { toast('Escribe el aviso'); return; }
      await api.addSub(b.bandId, 'notices', { text, to: el.dataset.to.split(',').filter(Boolean) });
      closeSheet(); toast('Aviso enviado'); reload();
    } else if (name === 'star-save') {
      const m = ctx.members.find(x => x.id === $('starWho').value);
      await api.updateBand(b.bandId, { weekStar: { uid: m.id, nickname: m.nickname, note: $('starNote').value.trim(), week: weekId() } });
      closeSheet(); toast(`${m.nickname} es el músico de la semana`); reload();
    } else if (name === 'dup-task') {
      const { id, createdAt, ...task } = ctx.tasks.find(t => t.id === arg);
      await api.createTask(b.bandId, { ...task, title: task.title + ' (copia)', due: null });
      closeSheet(); toast('Tarea duplicada: ponle fecha en la copia'); reload();
    } else if (name === 'del-task' && confirmFirst(el)) {
      await api.deleteTask(b.bandId, arg); closeSheet(); toast('Tarea borrada'); reload();
    } else if (name === 'del-sub' && confirmFirst(el)) {
      const [col, id] = arg.split(':');
      await api.deleteSub(b.bandId, col, id); reload();
    } else if (name === 'rotate-code' && confirmFirst(el)) {
      const code = await api.rotateCode(b);
      update({ band: { ...getState().band, code } });
      toast(`Nuevo código: ${code}`); reload();
    } else if (name === 'remove-member' && confirmFirst(el)) {
      await api.removeMember(b.bandId, arg); closeSheet(); toast('Músico quitado de la banda'); reload();
    }
  } catch (err) { toast(cloudErrorText(err)); }
}

async function change(key, el, ctx, reload, rerender) {
  const [name, arg] = key.split(':');
  if (name === 'msort') { setMemberSort(el.value); rerender(); return; }
  if (name === 'tune') { setTuneInst(el.value); rerender(); return; }
  try {
    if (name === 'voice') { await api.updateMember(ctx.band.bandId, arg, { voice: el.value ? Number(el.value) : null }); toast('Voz cambiada'); reload(); }
    if (name === 'role') { await api.updateMember(ctx.band.bandId, arg, { role: el.value }); toast(el.value === 'leader' ? 'Nuevo jefe de cuerda' : 'Papel cambiado'); reload(); }
  } catch (err) { toast(cloudErrorText(err)); }
}

function bindActions(root, ctx, reload, rerender) {
  if (!root) return;
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el && root.contains(el)) act(el.dataset.act, el, ctx, reload, rerender);
  });
  root.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if (el) change(el.dataset.change, el, ctx, reload, rerender);
  });
  attachTooltips(root);
}

async function addSub(ctx, name, data, reload, msg) {
  try { await api.addSub(ctx.band.bandId, name, data); toast(msg); reload(); } catch (err) { toast(cloudErrorText(err)); }
}

export function bindDirector(ctx, reload, rerender) {
  const root = $('dirRoot');
  bindActions(root, ctx, reload, rerender);
  root.addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.id === 'eventForm') {
      const title = $('evTitle').value.trim(), date = $('evDate').value;
      if (!title || !date) { toast('Pon el título y la fecha'); return; }
      const taskIds = [...e.target.querySelectorAll('input:checked')].map(i => i.value);
      addSub(ctx, 'events', { title, date, kind: $('evKind').value, place: $('evPlace').value.trim(), taskIds }, reload, 'Añadido a la agenda');
    }
    if (e.target.id === 'noticeForm') {
      const text = $('noticeText').value.trim();
      if (text) addSub(ctx, 'notices', { text }, reload, 'Aviso publicado');
    }
    if (e.target.id === 'rewardForm') {
      const title = $('rwTitle').value.trim(), points = Math.round(Number($('rwPoints').value));
      if (!title || !(points > 0)) { toast('Pon el premio y los puntos'); return; }
      addSub(ctx, 'rewards', { title, points }, reload, 'Premio creado');
    }
  });
}
