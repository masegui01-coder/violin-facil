// Pantalla «aula» (profesor): una clase por dentro. Cifras de la semana, avisos (quién no ha practicado, qué está
// vencido), tabla alumnos × tareas o unidades de Lenguaje con el % escrito y coloreado, filtros, tareas con su
// resumen, entregas con comentario, exportación CSV e informe trimestral. La ficha de cada alumno: aula-student.js.
import { $, esc, icon, toast } from '../ui.js';
import { register, go } from '../router.js';
import { cloudErrorText } from '../cloud.js';
import { instrumentById } from '../instruments.js';
import { statTile, attachTooltips } from '../charts.js';
import { t } from '../i18n.js';
import { classRows, filterRows, filterCounts, taskStats, dayKey, MAX_STUDENTS } from '../aula.js';
import { classCsv, termOf, termLabel } from '../aula-report.js';
import { loadLm } from '../aula-temario.js';
import * as api from '../aula-api.js';
import { sheet } from './band-ui.js';
import { pctNum, statusPill, dueLabel, meter, downloadText, safeName, fmtShort, partsHtml, subtitleHtml } from './aula-ui.js';
import { renderStudent } from './aula-student.js';
import { trackingHtml, bindGrid } from './aula-table.js';
import { openAulaTaskForm } from './aula-task-form.js';
import { classPdf } from '../aula-pdf.js';

let ctx = null; // { sid, cid, data, lm, filter, sort, cols, uid }
let loadToken = 0;

const body = html => { $('aulaBody').innerHTML = html; };
const today = () => dayKey(Date.now());
const rowsOf = () => classRows({ students: ctx.data.students, tasks: ctx.data.tasks, summaries: ctx.data.summaries, today: today() });

function enter(params = {}) {
  if (params.cid) ctx = { sid: params.sid, cid: params.cid, filter: 'all', sort: 'name', cols: 'tasks', uid: params.uid || null, data: null, lm: null, readOnly: !!params.readOnly };
  if (!ctx) { go('learn'); return; }
  if ('uid' in params && !params.cid) ctx = { ...ctx, uid: params.uid };
  load();
}

async function load() {
  const my = ++loadToken;
  $('aulaEyebrow').textContent = 'Aula';
  $('aulaTitle').textContent = ctx.data ? ctx.data.cls.name : '…';
  if (!ctx.data) body('<p class="empty" role="status">Cargando la clase…</p>');
  try {
    const [data, lm] = await Promise.all([api.loadClass(ctx.sid, ctx.cid), loadLm()]);
    if (my !== loadToken) return;
    if (!data) { body(`<div class="panel"><h2>${esc('Esta clase ya no existe')}</h2><button type="button" class="btn small" id="aulaGone">${esc('Volver')}</button></div>`); $('aulaGone').addEventListener('click', () => go('learn')); return; }
    ctx = { ...ctx, data, lm };
    render();
  } catch (err) {
    if (my !== loadToken) return;
    body(`<div class="panel"><h2>${esc('No he podido abrir la clase')}</h2><p class="warn">${esc(cloudErrorText(err))}</p><button type="button" class="btn small" id="aulaRetry">${esc('Reintentar')}</button></div>`);
    $('aulaRetry').addEventListener('click', load);
  }
}

function render() {
  const { cls } = ctx.data;
  $('aulaTitle').textContent = cls.name;
  if (ctx.uid) {
    const row = rowsOf().find(r => r.id === ctx.uid);
    if (row) {
      $('aulaEyebrow').textContent = `Ficha del alumno · ${cls.name}`;
      $('aulaTitle').textContent = row.nickname;
      renderStudent($('aulaBody'), { ctx, row, reload: load, entrySheet, reportSheet, removed: () => { ctx = { ...ctx, uid: null }; load(); } });
      window.scrollTo(0, 0);
      return;
    }
    ctx = { ...ctx, uid: null };
  }
  $('aulaEyebrow').textContent = cls.closed ? 'Clase · inscripciones cerradas' : `Clase · código ${cls.code}`;
  renderClass();
}

// ---------- Clase ----------
function renderClass() {
  const { cls, students, tasks } = ctx.data;
  const rows = rowsOf();
  const counts = filterCounts(rows);
  const active = rows.length - counts.inactive;
  const late = rows.reduce((s, r) => s + r.overdue, 0);
  // Como mucho 5 nombres por aviso (con muchos, el resto se ve con el filtro): menos ruido y menos paradas de teclado
  const ALERT_NAMES = 5;
  const names = (list, filter) => `<span class="aula-names">${list.slice(0, ALERT_NAMES).map(r => `<button type="button" class="text-link" data-student="${esc(r.id)}">${esc(r.nickname)}</button>`).join(', ')}${list.length > ALERT_NAMES
    ? ` <button type="button" class="text-link" data-filter="${filter}">${esc(`y ${list.length - ALERT_NAMES} más`)}</button>` : ''}</span>`;
  const inactive = rows.filter(r => r.inactive);
  const overdue = rows.filter(r => r.overdue > 0);
  const ro = ctx.readOnly;
  body(`${ro ? `<div class="panel aula-expired" role="status"><b>${esc('Solo lectura')}</b><span>${esc('Tu licencia del Aula Pro ha caducado: puedes ver la clase, exportarla y borrar datos, pero no poner tareas ni comentarios.')}</span></div>` : ''}
    <div class="aula-toolbar">${ro ? '' : `<button type="button" class="btn" id="aulaNewTask"><span class="ic">${icon('notes')}</span><span>${esc('Nueva tarea')}</span></button>`}
      ${cls.closed ? '' : `<button type="button" class="btn ghost" id="aulaInvite">${esc('Invitar alumnos')}</button>`}</div>
    <div class="tiles aula-tiles">${statTile({ label: t('Alumnos'), value: `${students.length}/${MAX_STUDENTS}` })}
      ${statTile({ label: t('Han practicado esta semana'), value: `${active}/${rows.length}`, good: rows.length ? active / rows.length >= 0.7 : null, hint: t('últimos 7 días') })}
      ${statTile({ label: t('Tareas'), value: tasks.length })}${statTile({ label: t('Entregas vencidas'), value: late, good: late ? false : null })}</div>
    ${students.length || cls.closed ? '' : inviteCard(cls)}
    ${inactive.length || overdue.length ? `<div class="panel aula-alerts" role="region" aria-label="${esc('Avisos de la clase')}">
      ${inactive.length ? `<p><span class="pill warn">${esc('Sin practicar esta semana')}</span> ${names(inactive, 'inactive')}</p>` : ''}
      ${overdue.length ? `<p><span class="pill late">${esc('Con tareas vencidas')}</span> ${names(overdue, 'overdue')}</p>` : ''}</div>` : ''}
    ${students.length ? trackingHtml({ ctx, rows, counts, today: today() }) : ''}
    <h2 id="aulaTasksTitle" tabindex="-1">${esc('Tareas')}</h2>${tasksHtml(rows)}
    <h2>${esc('Informes')}</h2>
    <div class="row aula-exports"><button type="button" class="btn ghost small" id="aulaCsv">${esc('Descargar la clase (CSV)')}</button>
      <button type="button" class="btn ghost small" id="aulaPdf">${esc('Informe trimestral de la clase (PDF)')}</button></div>
    <p class="muted small">${esc('El informe trimestral pone una nota de 1 a 10 por competencia (% ÷ 10, redondeado; 5 es suficiente) y por tareas y constancia. La ficha de cada alumno tiene su informe individual.')}</p>
    ${settingsHtml(cls)}`);
  bindClass(rows);
}

function inviteCard(cls) {
  return `<div class="panel aula-invite"><h2>${esc('Invita a tus alumnos')}</h2><p>${esc('Entran desde Aprender › Pro › Aula con este código, o con el enlace de invitación:')}</p>
    <p class="aula-code" aria-label="${esc(`Código ${cls.code.split('').join(' ')}`)}">${esc(cls.code)}</p></div>`;
}

function tasksHtml(rows) {
  const { tasks } = ctx.data;
  if (!tasks.length) return `<p class="aula-empty">${esc('Todavía no hay tareas. Elige del temario: Lenguaje Musical, el curso de instrumento, el Libro, el Método Pro o tu MusicXML.')}</p>`;
  return `<div class="aula-task-list">${[...tasks].reverse().map(tk => {
    const st = taskStats(tk, rows);
    return `<article class="aula-task-row"><div><p class="eyebrow">${subtitleHtml(tk)}</p><h3>${esc(tk.title)}</h3>
      <p class="aula-task-meta"><span class="pill ${tk.due && tk.due < today() ? 'late' : ''}">${esc(dueLabel(tk, today()))}</span><span>${esc(`Mínimo ${tk.minPct} %`)}</span>
        <span>${esc(tk.to && tk.to.length ? `${tk.to.length} ${tk.to.length === 1 ? 'alumno' : 'alumnos'}` : 'Toda la clase')}</span></p>
      ${meter(st.assigned ? Math.round(st.done / st.assigned * 100) : 0, tk.title)}
      <p class="small muted">${esc(`${st.done} de ${st.assigned} la han hecho · ${st.started} la han intentado${st.avg === null ? '' : ` · media ${st.avg} %`}${st.late ? ` · ${st.late} vencidas` : ''}`)}</p></div>
      <div class="aula-task-actions"><button type="button" class="btn ghost small" data-task="${esc(tk.id)}">${esc('Ver entregas')}</button>
        ${ctx.readOnly ? '' : `<button type="button" class="btn ghost small danger" data-del-task="${esc(tk.id)}">${esc('Borrar')}</button>`}</div></article>`;
  }).join('')}</div>`;
}

function settingsHtml(cls) {
  return `<details class="panel aula-settings"><summary>${esc('Ajustes de la clase')}</summary>
    <form class="form" id="aulaRename" novalidate><label for="aulaNewName">${esc('Nombre de la clase')}</label><div class="row"><input id="aulaNewName" class="input" maxlength="60" value="${esc(cls.name)}"><button class="btn ghost small" type="submit">${esc('Guardar')}</button></div></form>
    <h3>${esc('Código de la clase')}</h3>
    <p class="muted small">${esc(cls.closed ? 'Las inscripciones están cerradas: nadie puede entrar. Crea un código nuevo para abrirlas.' : 'Cambia el código si se ha compartido de más o si no quieres que vuelva a entrar alguien a quien diste de baja. Cerrar las inscripciones invalida el código.')}</p>
    <div class="row"><button type="button" class="btn ghost small" id="aulaNewCode">${esc(cls.closed ? 'Abrir con un código nuevo' : 'Cambiar el código')}</button>
      ${cls.closed ? '' : `<button type="button" class="btn ghost small" id="aulaCloseCode">${esc('Cerrar inscripciones')}</button>`}</div>
    <p class="muted small">${esc('Borrar la clase quita sus tareas, las entregas, los comentarios, las composiciones y las fichas de sus alumnos. No se puede deshacer.')}</p>
    <button type="button" class="btn ghost small danger" id="aulaDelete">${esc('Borrar la clase')}</button></details>`;
}

function bindClass() {
  const box = $('aulaBody');
  const { cls } = ctx.data;
  attachTooltips(box);
  $('aulaNewTask')?.addEventListener('click', () => openAulaTaskForm({ ctx, onSaved: load }));
  $('aulaInvite')?.addEventListener('click', () => invite(cls));
  bindGrid(box, { onSkip: () => $('aulaTasksTitle').focus() });
  $('aulaNewCode').addEventListener('click', async () => {
    try { await api.changeCode(ctx.sid, cls, cls.teacherName); toast('Código nuevo listo'); load(); } catch (err) { toast(cloudErrorText(err)); }
  });
  $('aulaCloseCode')?.addEventListener('click', async e => {
    if (!e.currentTarget.dataset.confirm) { e.currentTarget.dataset.confirm = '1'; e.currentTarget.textContent = '¿Seguro? Toca otra vez'; return; }
    try { await api.closeJoining(ctx.sid, cls); toast('Inscripciones cerradas'); load(); } catch (err) { toast(cloudErrorText(err)); }
  });
  box.querySelectorAll('[data-student]').forEach(b => b.addEventListener('click', () => { ctx = { ...ctx, uid: b.dataset.student }; render(); }));
  box.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { ctx = { ...ctx, filter: b.dataset.filter }; renderClass(); box.querySelector(`.aula-filters [data-filter="${b.dataset.filter}"]`).focus(); }));
  box.querySelectorAll('[data-cols]').forEach(b => b.addEventListener('click', () => { ctx = { ...ctx, cols: b.dataset.cols }; renderClass(); box.querySelector(`[data-cols="${b.dataset.cols}"]`).focus(); }));
  $('aulaSort')?.addEventListener('change', e => { ctx = { ...ctx, sort: e.target.value }; renderClass(); $('aulaSort').focus(); });
  box.querySelectorAll('[data-task]').forEach(b => b.addEventListener('click', () => taskSheet(b.dataset.task)));
  box.querySelectorAll('[data-cell]').forEach(b => b.addEventListener('click', () => entrySheet(b.closest('tr').querySelector('[data-student]').dataset.student, b.dataset.cell)));
  box.querySelectorAll('[data-del-task]').forEach(b => b.addEventListener('click', () => deleteTask(b)));
  $('aulaCsv').addEventListener('click', exportCsv);
  $('aulaPdf').addEventListener('click', () => reportSheet());
  $('aulaRename').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('aulaNewName').value.trim();
    if (!name) return;
    try { await api.renameClass(ctx.sid, ctx.cid, name); toast('Nombre guardado'); load(); } catch (err) { toast(cloudErrorText(err)); }
  });
  $('aulaDelete').addEventListener('click', async e => {
    if (!e.currentTarget.dataset.confirm) { e.currentTarget.dataset.confirm = '1'; e.currentTarget.textContent = '¿Seguro? Toca otra vez'; return; }
    try { await api.deleteClass(ctx.sid, cls); toast('Clase borrada'); ctx = null; go('learn'); } catch (err) { toast(cloudErrorText(err)); }
  });
}

async function invite(cls) {
  const link = `${location.origin}${location.pathname}?clase=${cls.code}`;
  const text = t(`Únete a mi clase «${cls.name}» en Band Flow: ${link} (código ${cls.code})`);
  try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Invitación copiada'); } } catch (e) { /* compartir cancelado */ }
}

async function deleteTask(btn) {
  if (!btn.dataset.confirm) { btn.dataset.confirm = '1'; btn.textContent = '¿Seguro?'; return; }
  try { await api.deleteTask(ctx.sid, ctx.cid, btn.dataset.delTask); toast('Tarea borrada'); load(); } catch (err) { toast(cloudErrorText(err)); }
}

// ---------- Entregas y comentarios ----------
function entrySheet(uid, taskId, after = load) {
  const task = ctx.data.tasks.find(x => x.id === taskId);
  const row = rowsOf().find(r => r.id === uid);
  if (!task || !row) return;
  const cell = row.cells[ctx.data.tasks.indexOf(task)];
  const entry = row.summary && row.summary.tasks ? row.summary.tasks[taskId] : null;
  const fb = ctx.data.feedback[`${taskId}_${uid}`];
  sheet(`<h2>${esc(row.nickname)}</h2><p class="eyebrow">${esc(task.title)}</p>
    <p>${cell ? statusPill(cell.status) : ''} ${entry && entry.n ? `<b>${pctNum(entry.p)} %</b> · ${partsHtml([`${entry.n} ${entry.n === 1 ? 'intento' : 'intentos'}`, `último el ${fmtShort(entry.l)}`])}` : `<span>${esc('Todavía no lo ha intentado')}</span>`}</p>
    <p class="muted small">${partsHtml([`Mínimo ${task.minPct} %`, dueLabel(task, today())])}</p>
    ${ctx.readOnly ? (fb ? `<div class="stamp"><b>${esc('Comentario para el alumno')}</b><span>${esc(fb.comment)}</span></div>` : '')
      : `<label for="aulaComment">${esc('Comentario para el alumno')}</label><textarea id="aulaComment" maxlength="500" placeholder="${esc('Ej.: ¡Muy bien el pulso! Repasa los silencios.')}">${esc(fb ? fb.comment : '')}</textarea>`}
    <div class="row">${ctx.readOnly ? '' : `<button type="button" class="btn" id="aulaSaveComment">${esc('Guardar comentario')}</button>`}<button type="button" class="btn ghost small" data-close>${esc('Cerrar')}</button></div>`, box => {
    box.querySelector('#aulaSaveComment')?.addEventListener('click', async () => {
      try {
        await api.setFeedback(ctx.sid, ctx.cid, taskId, uid, box.querySelector('#aulaComment').value.trim());
        $('sheet').close();
        toast('Comentario guardado');
        after();
      } catch (err) { toast(cloudErrorText(err)); }
    });
  });
}

function taskSheet(taskId) {
  const task = ctx.data.tasks.find(x => x.id === taskId);
  if (!task) return;
  const i = ctx.data.tasks.indexOf(task);
  const list = filterRows(rowsOf(), 'all', 'name').filter(r => r.cells[i]);
  sheet(`<h2>${esc(task.title)}</h2><p class="eyebrow">${subtitleHtml(task)}</p>
    ${task.note ? `<p class="aula-note">${esc(task.note)}</p>` : ''}
    <div class="list">${list.map(r => { const c = r.cells[i]; const fb = ctx.data.feedback[`${task.id}_${r.id}`];
      return `<button type="button" class="list-row task-row aula-entry" data-entry="${esc(r.id)}"><span><b>${esc(r.nickname)}</b><small><span>${esc(c.n ? `${c.n} ${c.n === 1 ? 'intento' : 'intentos'}` : 'Sin intentos todavía')}</span>${fb ? ' · <span aria-hidden="true">💬</span>' : ''}</small></span><span>${statusPill(c.status)} <b>${c.n ? `${pctNum(c.p)} %` : '—'}</b></span></button>`; }).join('') || `<p class="muted">${esc('Esta tarea no va para nadie de la clase.')}</p>`}</div>
    <button type="button" class="btn ghost small" data-close>${esc('Cerrar')}</button>`, box => {
    box.querySelectorAll('[data-entry]').forEach(b => b.addEventListener('click', () => entrySheet(b.dataset.entry, task.id)));
  });
}

// ---------- Exportar ----------
function exportCsv() {
  const csv = classCsv({ rows: filterRows(rowsOf(), 'all', 'name'), tasks: ctx.data.tasks, term: termOf(new Date()), today: today(), tr: t, instrumentName: id => t(instrumentById(id).name) });
  downloadText(csv, `${safeName(ctx.data.cls.name)}-${dayKey(Date.now())}.csv`);
}

function reportSheet(uid = null) {
  const now = termOf(new Date());
  const prevDate = new Date(now.start + 'T12:00');
  prevDate.setDate(prevDate.getDate() - 1);
  const prev = termOf(prevDate);
  sheet(`<h2>${esc('Informe trimestral')}</h2>
    <label for="aulaTerm">${esc('Trimestre')}</label><select id="aulaTerm" class="select"><option value="now">${esc(termLabel(now))} (${esc('en curso')})</option><option value="prev">${esc(termLabel(prev))}</option></select>
    <label for="aulaObs">${esc('Observaciones (salen en el informe)')}</label><textarea id="aulaObs" maxlength="600" placeholder="${esc('Ej.: Buen trimestre. Para el siguiente, más constancia con el ritmo.')}"></textarea>
    <p class="muted small">${esc('Las competencias son las del trimestre en curso: para el anterior solo cuentan las tareas, los minutos y la constancia.')}</p>
    <div class="row"><button type="button" class="btn" id="aulaMakePdf">${esc('Crear el PDF')}</button><button type="button" class="btn ghost small" data-close>${esc('Cancelar')}</button></div>`, box => {
    box.querySelector('#aulaMakePdf').addEventListener('click', async () => {
      const term = box.querySelector('#aulaTerm').value === 'prev' ? prev : now;
      const rows = filterRows(rowsOf(), 'all', 'name').filter(r => !uid || r.id === uid);
      try {
        await classPdf({ cls: ctx.data.cls, rows, tasks: ctx.data.tasks, term, today: today(), notes: box.querySelector('#aulaObs').value.trim(), lm: ctx.lm });
        $('sheet').close();
      } catch (err) { toast(err.message); }
    });
  });
}

function leave() { loadToken++; }

register('aula', { enter, leave });
$('aulaBack').addEventListener('click', () => {
  if (ctx && ctx.uid) { ctx = { ...ctx, uid: null }; render(); return; }
  go('learn');
});
