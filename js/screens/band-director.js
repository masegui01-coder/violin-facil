// Panel del director: resumen semanal con semáforo, tareas con sello, músicos, agenda, avisos, premios, afinación e informe.
import { $, esc, toast, starsHtml } from '../ui.js';
import * as api from '../band-api.js';
import { trafficLight, minutesInLast, bandStreak, practicedToday, sectionDuel, sectionTuning, bandCsv, eventPrep, daysUntil, weekStarSuggestion, FAMILY_NAME } from '../band-stats.js';
import { instrumentById } from '../instruments.js';
import { noteLabel } from '../music.js';
import { weekId } from '../engage.js';
import { getState, today } from '../store.js';
import { cloudErrorText } from '../cloud.js';
import { openTaskForm } from './band-task.js';
import { ROLE_NAME, LIGHT_NAME, dueBadge, fmtDate, fmtDay, pct, seatName, taskSubtitle, lightDot, bar, sheet } from './band-ui.js';

const TABS = [['resumen', 'Resumen'], ['tareas', 'Tareas'], ['musicos', 'Músicos'], ['agenda', 'Agenda'], ['avisos', 'Avisos'], ['premios', 'Premios'], ['afinacion', 'Afinación'], ['informe', 'Informe']];
const TUNE_OK = 5, TUNE_WARN = 12;
let tab = 'resumen';
let tuneInst = null;

const familyOf = id => instrumentById(id).family;
const musiciansOf = ctx => ctx.members.filter(m => m.role !== 'director');
const progressOf = (ctx, task, m) => ctx.progress.find(p => p.taskId === task.id && p.uid === m.id);

function taskSummary(ctx, task) {
  const targets = musiciansOf(ctx).filter(m => api.assignedTo(task, m));
  return { targets, done: targets.filter(m => progressOf(ctx, task, m)?.completed).length };
}

// ---------- Resumen ----------
function resumen(ctx) {
  const day = today();
  const musicians = musiciansOf(ctx);
  const lights = musicians.map(m => ({ m, light: trafficLight(m, day) }));
  const risk = lights.filter(x => x.light !== 'green').sort((a, b) => (a.light === 'red' ? -1 : 1) - (b.light === 'red' ? -1 : 1));
  const next = ctx.events.filter(e => e.date >= day).sort((a, b) => a.date.localeCompare(b.date))[0];
  const prep = next ? eventPrep(next, ctx.tasks, musicians, ctx.progress, api.assignedTo) : null;
  const star = ctx.bandDoc?.weekStar?.week === weekId() ? ctx.bandDoc.weekStar : null;
  const suggestion = weekStarSuggestion(musicians, day);
  const duel = sectionDuel(musicians, day, familyOf);
  const count = light => lights.filter(x => x.light === light).length;
  return `<div class="stats"><div class="stat"><b>${pct(practicedToday(musicians, day))}</b><span>han ensayado hoy</span></div>
      <div class="stat"><b>${bandStreak(musicians, day)}</b><span>días de racha de banda</span></div>
      <div class="stat"><b>${count('green')}/${musicians.length}</b><span>al día</span></div></div>
    <div class="lights"><span>${lightDot('green')} ${count('green')} ${LIGHT_NAME.green}</span><span>${lightDot('amber')} ${count('amber')} ${LIGHT_NAME.amber}</span><span>${lightDot('red')} ${count('red')} ${LIGHT_NAME.red}</span></div>
    ${next ? `<div class="event"><div><small>${next.kind === 'concierto' ? 'Próximo concierto' : 'Próximo ensayo'}</small><b>${esc(next.title)}</b><small>${fmtDay(next.date)}${next.place ? ' · ' + esc(next.place) : ''}</small></div>
      <div class="event-count"><b>${daysUntil(next.date, day) || 'Hoy'}</b>${daysUntil(next.date, day) ? '<small>días</small>' : ''}</div>
      ${prep !== null ? `<div class="event-prep"><small>Preparación de la banda: ${pct(prep)}</small>${bar(prep)}</div>` : '<div class="event-prep"><small>Vincula tareas al evento en Agenda para ver la preparación.</small></div>'}</div>` : ''}
    <h2>Necesitan un empujón</h2>
    ${risk.length ? `<div class="table-wrap"><table class="prog-table"><tbody>${risk.map(({ m, light }) => `<tr data-member="${m.id}"><td>${lightDot(light)} <b>${esc(m.nickname)}</b><br><small>${esc(seatName(m))}</small></td>
      <td>${m.lastPractice ? 'Último ensayo ' + fmtDay(m.lastPractice) : 'Aún no ha ensayado'}</td><td class="num">${Math.round(minutesInLast(m, day, 7))} min/7 d</td></tr>`).join('')}</tbody></table></div>`
      : `<p class="empty">${musicians.length ? '¡Toda la banda ha ensayado en los últimos dos días!' : 'Todavía no hay músicos.'}</p>`}
    <h2>Músico de la semana</h2>
    <div class="week-star"><small>${star ? 'Elegido esta semana' : suggestion ? `Propuesta: ${Math.round(suggestion.minutes)} min en 7 días` : 'Nadie ha ensayado aún esta semana'}</small>
      <b>${esc(star ? star.nickname : suggestion ? suggestion.member.nickname : '—')}</b>${star?.note ? `<span>${esc(star.note)}</span>` : ''}
      <button type="button" class="btn small" id="pickStar">${star ? 'Cambiar' : 'Nombrar'}</button></div>
    ${duel.length > 1 ? `<h2>Duelo de secciones</h2>${duel.map((g, i) => `<div class="duel-row"><span>${i + 1}. ${FAMILY_NAME[g.family] || g.family}</span>${bar(g.perMusician / Math.max(1, duel[0].perMusician))}<b>${Math.round(g.perMusician)} min</b></div>`).join('')}` : ''}`;
}

function pickStar(ctx, reload) {
  const musicians = musiciansOf(ctx);
  const suggestion = weekStarSuggestion(musicians, today());
  sheet(`<h2>Músico de la semana</h2><p class="muted small">Lo verá toda la banda en su pestaña Banda hasta el lunes.</p>
    <label for="starWho">Músico</label><select id="starWho" class="select">${musicians.map(m => `<option value="${m.id}" ${suggestion?.member.id === m.id ? 'selected' : ''}>${esc(m.nickname)} · ${esc(seatName(m))}</option>`).join('')}</select>
    <label for="starNote">Por qué (opcional)</label><input id="starNote" class="input" maxlength="80" placeholder="Ej.: Por su constancia con la marcha">
    <button type="button" class="btn" id="starSave">Nombrar</button><button type="button" class="btn ghost small" data-close>Cancelar</button>`, box => {
    box.querySelector('#starSave').addEventListener('click', async () => {
      const m = musicians.find(x => x.id === $('starWho').value);
      if (!m) return;
      try {
        await api.updateBand(ctx.band.bandId, { weekStar: { uid: m.id, nickname: m.nickname, note: $('starNote').value.trim(), week: weekId() } });
        $('sheet').close(); toast(`${m.nickname} es el músico de la semana`); reload();
      } catch (err) { toast(cloudErrorText(err)); }
    });
  });
}

// ---------- Tareas ----------
function tareas(ctx) {
  return `<div class="row spread"><h2>Tareas</h2><button type="button" class="btn small" id="newTask">Nueva tarea</button></div>
    ${ctx.tasks.length ? ctx.tasks.map(t => {
      const s = taskSummary(ctx, t);
      return `<div class="task"><div class="task-head"><div><b>${esc(t.title)}</b><br><small>${esc(taskSubtitle(t, t.parts?.all || Object.values(t.parts || {})[0]))}</small></div>
        <span class="pill ${s.done === s.targets.length && s.targets.length ? 'ok' : ''}">${s.done}/${s.targets.length}</span></div>
        <div class="row spread">${dueBadge(t)}<span class="row"><button type="button" class="btn ghost small" data-progress="${t.id}">Ver progreso</button><button type="button" class="btn ghost small danger" data-delete-task="${t.id}">Borrar</button></span></div>
        <div class="table-wrap" id="prog-${t.id}" hidden></div></div>`;
    }).join('') : '<p class="empty">Crea la primera tarea: elige una obra (o unos compases), el modo de ensayo y la fecha límite.</p>'}`;
}

function progressTable(ctx, task) {
  const { targets } = taskSummary(ctx, task);
  if (!targets.length) return '<p class="empty">Nadie tiene asignada esta tarea todavía.</p>';
  return `<table class="prog-table"><thead><tr><th>Músico</th><th>Estado</th><th class="num">Mejor</th><th class="num">${task.passage ? 'Tempo' : 'Acierto'}</th><th class="num">Intentos</th><th>Evolución</th><th></th></tr></thead><tbody>
    ${targets.map(m => {
      const p = progressOf(ctx, task, m);
      const hist = (p?.history || []).slice(-10);
      return `<tr><td><b>${esc(m.nickname)}</b><br><small>${esc(seatName(m))}</small></td>
        <td>${!p ? '<span class="pill">Sin empezar</span>' : p.completed ? '<span class="pill ok">Hecha</span>' : '<span class="pill warn">En curso</span>'}${p?.stamp ? ' <span class="pill ok">Sellada</span>' : ''}</td>
        <td class="num">${p ? starsHtml(p.bestStars) : '—'}</td><td class="num">${p ? (task.passage ? pct(p.passageBest || 0) : pct(p.bestAccuracy)) : '—'}</td><td class="num">${p ? p.attempts : 0}</td>
        <td><span class="spark">${hist.map(h => `<i style="height:${Math.max(6, h.accuracy * 100)}%"></i>`).join('')}</span></td>
        <td>${p ? `<button type="button" class="btn ghost small" data-stamp="${p.id}">${p.stamp || p.comment ? 'Editar sello' : 'Sellar'}</button>` : ''}</td></tr>`;
    }).join('')}</tbody></table>`;
}

function stampSheet(ctx, docId, reload) {
  const p = ctx.progress.find(x => x.id === docId);
  sheet(`<h2>Visto bueno · ${esc(p.nickname)}</h2><p class="muted small">El músico verá tu sello y tu comentario en la tarea.</p>
    <label class="check-chip"><input type="checkbox" id="stampOk" ${p.stamp ? 'checked' : ''}> Dar el visto bueno</label>
    <label for="stampText">Comentario</label><textarea id="stampText" maxlength="300" placeholder="Ej.: Muy bien el picado; cuida la respiración del compás 12">${esc(p.comment || '')}</textarea>
    <button type="button" class="btn" id="stampSave">Guardar</button><button type="button" class="btn ghost small" data-close>Cancelar</button>`, box => {
    box.querySelector('#stampSave').addEventListener('click', async () => {
      try {
        await api.stampProgress(ctx.band.bandId, docId, { stamp: $('stampOk').checked, comment: $('stampText').value.trim() });
        $('sheet').close(); toast('Sello guardado'); reload();
      } catch (err) { toast(cloudErrorText(err)); }
    });
  });
}

// ---------- Músicos ----------
function musicos(ctx) {
  const b = ctx.band;
  const day = today();
  const musicians = musiciansOf(ctx).sort((x, y) => (x.instrument + (x.voice || 0)).localeCompare(y.instrument + (y.voice || 0)));
  if (!musicians.length) return `<p class="empty">Comparte el código <b>${esc(b.code)}</b> para que se unan.</p>`;
  return `<h2>Músicos (${musicians.length})</h2><p class="muted small">Asigna la voz (1º, 2º…) y nombra jefes de cuerda: verán el progreso de su sección.</p>
    <div class="table-wrap"><table class="prog-table"><thead><tr><th>Músico</th><th>Voz</th><th>Papel</th><th class="num">Min. 7 d</th><th class="num">Puntos</th><th>Nivel</th></tr></thead><tbody>
    ${musicians.map(m => `<tr><td data-member="${m.id}">${lightDot(trafficLight(m, day))} <b class="link">${esc(m.nickname)}</b><br><small>${esc(instrumentById(m.instrument).name)}</small></td>
      <td><select class="select small" data-voice="${m.id}" aria-label="Voz de ${esc(m.nickname)}">${['', 1, 2, 3, 4].map(v => `<option value="${v}" ${String(v) === String(m.voice || '') ? 'selected' : ''}>${v ? v + 'º' : '—'}</option>`).join('')}</select></td>
      <td><select class="select small" data-role="${m.id}" aria-label="Papel de ${esc(m.nickname)}">${['member', 'leader'].map(r => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${ROLE_NAME[r]}</option>`).join('')}</select></td>
      <td class="num">${Math.round(minutesInLast(m, day, 7))}</td><td class="num">${m.points || 0}</td><td>${esc(m.level || '—')}</td></tr>`).join('')}</tbody></table></div>`;
}

function memberSheet(ctx, memberId) {
  const m = ctx.members.find(x => x.id === memberId);
  const mine = ctx.progress.filter(p => p.uid === memberId);
  sheet(`<h2>${esc(m.nickname)}</h2><p class="muted small">${esc(seatName(m))} · ${esc(ROLE_NAME[m.role] || '')} · racha ${m.streak || 0} días</p>
    ${ctx.tasks.filter(t => api.assignedTo(t, m)).map(t => {
      const p = mine.find(x => x.taskId === t.id);
      return `<div class="task"><div class="task-head"><b>${esc(t.title)}</b>${p ? (p.completed ? '<span class="pill ok">Hecha</span>' : '<span class="pill warn">En curso</span>') : '<span class="pill">Sin empezar</span>'}</div>
        ${p ? `<small>Mejor: ${p.bestStars}★ · ${pct(p.bestAccuracy)} · ${p.attempts} intentos · ${p.minutes} min</small><span class="spark">${(p.history || []).slice(-15).map(h => `<i style="height:${Math.max(6, h.accuracy * 100)}%"></i>`).join('')}</span>` : ''}</div>`;
    }).join('') || '<p class="empty">Sin tareas asignadas.</p>'}
    <button type="button" class="btn ghost small" data-close>Cerrar</button>`);
}

// ---------- Agenda ----------
function agenda(ctx) {
  const day = today();
  const musicians = musiciansOf(ctx);
  const events = [...ctx.events].sort((a, b) => a.date.localeCompare(b.date));
  const card = e => {
    const prep = eventPrep(e, ctx.tasks, musicians, ctx.progress, api.assignedTo);
    return `<div class="task ${e.date < day ? 'past' : ''}"><div class="task-head"><div><b>${esc(e.title)}</b><br><small>${e.kind === 'concierto' ? 'Concierto' : 'Ensayo'} · ${fmtDay(e.date)}${e.place ? ' · ' + esc(e.place) : ''}</small></div>
      <button type="button" class="btn ghost small danger" data-del-sub="events:${e.id}">Borrar</button></div>
      ${prep !== null ? `<small>Preparación: ${pct(prep)} · ${(e.taskIds || []).length} tareas</small>${bar(prep)}` : '<small>Sin tareas vinculadas</small>'}</div>`;
  };
  return `<form class="panel form" id="eventForm"><h2>Nuevo concierto o ensayo</h2>
      <label for="evTitle">Título</label><input id="evTitle" class="input" maxlength="80" placeholder="Ej.: Concierto de Santa Cecilia">
      <div class="row"><div class="grow"><label for="evDate">Fecha</label><input id="evDate" class="input" type="date" min="${day}"></div>
        <div class="grow"><label for="evKind">Tipo</label><select id="evKind" class="select"><option value="concierto">Concierto</option><option value="ensayo">Ensayo</option></select></div></div>
      <label for="evPlace">Lugar (opcional)</label><input id="evPlace" class="input" maxlength="60">
      ${ctx.tasks.length ? `<label>Obras que hay que llevar preparadas</label><div class="member-list">${ctx.tasks.map(t => `<label class="check-chip"><input type="checkbox" value="${t.id}">${esc(t.title)}</label>`).join('')}</div>` : ''}
      <button class="btn" type="submit">Añadir a la agenda</button></form>
    ${events.length ? events.map(card).join('') : '<p class="empty">Añade el próximo concierto y verás cuánto le falta a la banda para llegar preparada.</p>'}`;
}

// ---------- Avisos ----------
function avisos(ctx) {
  const list = [...ctx.notices].sort((a, b) => api.millis(b.at) - api.millis(a.at));
  return `<form class="panel form" id="noticeForm"><h2>Nuevo aviso</h2>
      <textarea id="noticeText" maxlength="300" placeholder="Ej.: El ensayo del jueves pasa a las 20:30"></textarea>
      <p class="muted small">Lo verán los músicos al abrir su pestaña Banda.</p><button class="btn" type="submit">Publicar aviso</button></form>
    ${list.map(n => `<div class="notice"><small>${n.at ? fmtDate(api.millis(n.at)) : ''}</small><span>${esc(n.text)}</span><button type="button" class="btn ghost small danger" data-del-sub="notices:${n.id}">Borrar</button></div>`).join('')}`;
}

// ---------- Premios ----------
function premios(ctx) {
  const musicians = musiciansOf(ctx);
  const list = [...ctx.rewards].sort((a, b) => a.points - b.points);
  return `<form class="panel form" id="rewardForm"><h2>Nuevo premio</h2>
      <p class="muted small">Los músicos suman puntos practicando desde que entran en la banda. Tú decides el premio: elegir la próxima obra, un solo en el concierto…</p>
      <label for="rwTitle">Premio</label><input id="rwTitle" class="input" maxlength="80" placeholder="Ej.: Elegir la marcha del pasacalles">
      <label for="rwPoints">Puntos necesarios</label><input id="rwPoints" class="input" type="number" min="50" step="50" value="500">
      <button class="btn" type="submit">Crear premio</button></form>
    ${list.map(r => {
      const winners = musicians.filter(m => (m.points || 0) >= r.points);
      return `<div class="task"><div class="task-head"><div><b>${esc(r.title)}</b><br><small>${r.points} puntos</small></div><button type="button" class="btn ghost small danger" data-del-sub="rewards:${r.id}">Borrar</button></div>
        <small>${winners.length ? 'Lo han conseguido: ' + winners.map(m => esc(m.nickname)).join(', ') : 'Nadie lo ha conseguido todavía'}</small></div>`;
    }).join('')}`;
}

// ---------- Afinación ----------
function afinacion(ctx) {
  const present = [...new Set(musiciansOf(ctx).filter(m => m.tuning && Object.keys(m.tuning).length).map(m => m.instrument))];
  if (!present.length) return '<p class="empty">Cuando los músicos ensayen, aquí verás qué notas tiende a desafinar cada sección.</p>';
  if (!present.includes(tuneInst)) tuneInst = present[0];
  const rows = sectionTuning(musiciansOf(ctx), tuneInst);
  const nom = getState().nom;
  const color = c => (Math.abs(c) < TUNE_OK ? 'var(--ok)' : Math.abs(c) < TUNE_WARN ? 'var(--warn)' : 'var(--bad)');
  return `<h2>Mapa de afinación por sección</h2><p class="muted small">Media de cada nota entre los músicos de la sección. Las de arriba son las que más se desvían: buen material para el calentamiento.</p>
    <select id="tuneInst" class="select">${present.map(id => `<option value="${id}" ${id === tuneInst ? 'selected' : ''}>${esc(instrumentById(id).name)}</option>`).join('')}</select>
    <div class="tm-list">${rows.map(r => {
      const w = Math.min(50, Math.abs(r.mean) / 30 * 50);
      return `<div class="tm-row"><b>${esc(noteLabel({ midi: r.midi }, nom, tuneInst !== 'violin'))}</b><span class="tm-bar"><i style="left:${r.mean >= 0 ? 50 : 50 - w}%;width:${w}%;background:${color(r.mean)}"></i></span>
        <small>${r.mean > 0 ? '+' : ''}${Math.round(r.mean)} ¢ · ${r.musicians} ${r.musicians === 1 ? 'músico' : 'músicos'}</small></div>`;
    }).join('')}</div>`;
}

// ---------- Informe ----------
function informe(ctx) {
  const day = today();
  const musicians = musiciansOf(ctx);
  const total = musicians.reduce((s, m) => s + minutesInLast(m, day, 90), 0);
  return `<div class="panel"><h2>Informe del trimestre</h2>
    <p>${musicians.length} músicos · ${Math.round(total)} minutos de ensayo en 90 días · ${ctx.tasks.length} tareas.</p>
    <p class="muted small">Una fila por músico con sus minutos (7 días, 30 días y trimestre), el último ensayo y el estado de cada tarea. Se abre con Excel o con Hojas de cálculo de Google.</p>
    <button type="button" class="btn" id="downloadCsv">Descargar informe (CSV)</button></div>`;
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

const VIEWS = { resumen, tareas, musicos, agenda, avisos, premios, afinacion, informe };

export function directorView(ctx) {
  const b = ctx.band;
  return `<div id="dirRoot"><div class="band-hero"><p class="eyebrow">Director · ${esc(b.name)}</p><p>Código para unirse</p><div class="band-code">${esc(b.code)}</div>
      <div class="row"><button type="button" class="btn small" id="shareInvite">Compartir invitación</button></div></div>
    <div class="subtabs" role="tablist">${TABS.map(([id, name]) => `<button type="button" role="tab" data-subtab="${id}" aria-selected="${tab === id}">${name}</button>`).join('')}</div>
    <div class="band-view">${VIEWS[tab](ctx)}</div></div>`;
}

async function addSub(ctx, name, data, reload, msg) {
  try { await api.addSub(ctx.band.bandId, name, data); toast(msg); reload(); } catch (err) { toast(cloudErrorText(err)); }
}

export function bindDirector(ctx, reload, rerender) {
  const b = ctx.band;
  const root = $('dirRoot');
  $('shareInvite').addEventListener('click', async () => {
    const link = `${location.origin}${location.pathname}?banda=${b.code}`;
    const text = `Únete a «${b.name}» en Band Flow con el código ${b.code}: ${link}`;
    if (navigator.share) { try { await navigator.share({ title: 'Band Flow', text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Invitación copiada'); } catch (e) { toast(link); }
  });
  root.querySelectorAll('[data-subtab]').forEach(btn => btn.addEventListener('click', () => { tab = btn.dataset.subtab; rerender(); }));
  root.querySelector('#newTask')?.addEventListener('click', () => openTaskForm(b, ctx.members, async task => {
    await api.createTask(b.bandId, task);
    toast('Tarea creada');
    reload();
  }));
  root.querySelector('#pickStar')?.addEventListener('click', () => pickStar(ctx, reload));
  root.querySelector('#downloadCsv')?.addEventListener('click', () => downloadCsv(ctx));
  root.querySelector('#tuneInst')?.addEventListener('change', e => { tuneInst = e.target.value; rerender(); });
  root.querySelectorAll('[data-voice]').forEach(sel => sel.addEventListener('change', async () => {
    try { await api.updateMember(b.bandId, sel.dataset.voice, { voice: sel.value ? Number(sel.value) : null }); toast('Voz cambiada'); reload(); } catch (err) { toast(cloudErrorText(err)); }
  }));
  root.querySelectorAll('[data-role]').forEach(sel => sel.addEventListener('change', async () => {
    try { await api.updateMember(b.bandId, sel.dataset.role, { role: sel.value }); toast(sel.value === 'leader' ? 'Nuevo jefe de cuerda' : 'Papel cambiado'); reload(); } catch (err) { toast(cloudErrorText(err)); }
  }));
  root.querySelector('#eventForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const title = $('evTitle').value.trim(), date = $('evDate').value;
    if (!title || !date) { toast('Pon el título y la fecha'); return; }
    const taskIds = [...$('eventForm').querySelectorAll('input:checked')].map(i => i.value);
    addSub(ctx, 'events', { title, date, kind: $('evKind').value, place: $('evPlace').value.trim(), taskIds }, reload, 'Añadido a la agenda');
  });
  root.querySelector('#noticeForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const text = $('noticeText').value.trim();
    if (text) addSub(ctx, 'notices', { text }, reload, 'Aviso publicado');
  });
  root.querySelector('#rewardForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const title = $('rwTitle').value.trim(), points = Math.round(Number($('rwPoints').value));
    if (!title || !(points > 0)) { toast('Pon el premio y los puntos'); return; }
    addSub(ctx, 'rewards', { title, points }, reload, 'Premio creado');
  });
  root.addEventListener('click', async e => {
    const prog = e.target.closest('[data-progress]');
    const del = e.target.closest('[data-delete-task]');
    const delSub = e.target.closest('[data-del-sub]');
    const stamp = e.target.closest('[data-stamp]');
    const member = e.target.closest('[data-member]');
    if (prog) {
      const box = $('prog-' + prog.dataset.progress);
      box.hidden = !box.hidden;
      if (!box.hidden) box.innerHTML = progressTable(ctx, ctx.tasks.find(t => t.id === prog.dataset.progress));
    }
    if (stamp) stampSheet(ctx, stamp.dataset.stamp, reload);
    if (member) memberSheet(ctx, member.dataset.member);
    const confirmFirst = btn => { if (btn.dataset.confirm) return false; btn.dataset.confirm = '1'; btn.textContent = '¿Seguro?'; return true; };
    if (del && !confirmFirst(del)) {
      try { await api.deleteTask(b.bandId, del.dataset.deleteTask); reload(); } catch (err) { toast(cloudErrorText(err)); }
    }
    if (delSub && !confirmFirst(delSub)) {
      const [name, id] = delSub.dataset.delSub.split(':');
      try { await api.deleteSub(b.bandId, name, id); reload(); } catch (err) { toast(cloudErrorText(err)); }
    }
  });
}
