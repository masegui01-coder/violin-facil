// Pantalla «aula» (profesor): una clase por dentro. Cifras de la semana, avisos (quién no ha practicado, qué está
// vencido), tabla alumnos × tareas o unidades de Lenguaje con el % escrito y coloreado, filtros, tareas con su
// resumen, entregas con comentario, exportación CSV e informe trimestral. La ficha de cada alumno: aula-student.js.
import { $, esc, icon, toast } from '../ui.js';
import { register, go } from '../router.js';
import { cloudErrorText } from '../cloud.js';
import { instrumentById } from '../instruments.js';
import { statTile, attachTooltips } from '../charts.js';
import { t } from '../i18n.js';
import { classRows, filterRows, filterCounts, taskStats, unitColumns, pctBand, dayKey, FILTERS, MAX_STUDENTS } from '../aula.js';
import { classCsv, termOf, termLabel } from '../aula-report.js';
import { loadLm } from '../aula-temario.js';
import * as api from '../aula-api.js';
import { sheet } from './band-ui.js';
import { pctCell, statusPill, dueLabel, meter, LEGEND, downloadText, safeName, fmtShort, partsHtml, subtitleHtml } from './aula-ui.js';
import { renderStudent } from './aula-student.js';
import { openAulaTaskForm } from './aula-task-form.js';
import { classPdf } from '../aula-pdf.js';

const FILTER_NAME = { all: 'Todos', inactive: 'Sin practicar esta semana', overdue: 'Con tareas vencidas', below: 'Por debajo del mínimo' };
let ctx = null; // { sid, cid, data, lm, filter, sort, cols, uid }
let loadToken = 0;

const body = html => { $('aulaBody').innerHTML = html; };
const today = () => dayKey(Date.now());
const rowsOf = () => classRows({ students: ctx.data.students, tasks: ctx.data.tasks, summaries: ctx.data.summaries, today: today() });

function enter(params = {}) {
  if (params.cid) ctx = { sid: params.sid, cid: params.cid, filter: 'all', sort: 'name', cols: 'tasks', uid: params.uid || null, data: null, lm: null };
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
  $('aulaEyebrow').textContent = `Clase · código ${cls.code}`;
  renderClass();
}

// ---------- Clase ----------
function renderClass() {
  const { cls, students, tasks } = ctx.data;
  const rows = rowsOf();
  const counts = filterCounts(rows);
  const active = rows.length - counts.inactive;
  const late = rows.reduce((s, r) => s + r.overdue, 0);
  const names = list => `<span class="aula-names">${list.map(r => `<button type="button" class="text-link" data-student="${esc(r.id)}">${esc(r.nickname)}</button>`).join(', ')}</span>`;
  const inactive = rows.filter(r => r.inactive);
  const overdue = rows.filter(r => r.overdue > 0);
  body(`<div class="aula-toolbar"><button type="button" class="btn" id="aulaNewTask"><span class="ic">${icon('notes')}</span><span>${esc('Nueva tarea')}</span></button>
      <button type="button" class="btn ghost" id="aulaInvite">${esc('Invitar alumnos')}</button></div>
    <div class="tiles aula-tiles">${statTile({ label: t('Alumnos'), value: `${students.length}/${MAX_STUDENTS}` })}
      ${statTile({ label: t('Han practicado esta semana'), value: `${active}/${rows.length}`, good: rows.length ? active / rows.length >= 0.7 : null, hint: t('últimos 7 días') })}
      ${statTile({ label: t('Tareas'), value: tasks.length })}${statTile({ label: t('Entregas vencidas'), value: late, good: late ? false : null })}</div>
    ${students.length ? '' : inviteCard(cls)}
    ${inactive.length || overdue.length ? `<div class="panel aula-alerts" role="region" aria-label="${esc('Avisos de la clase')}">
      ${inactive.length ? `<p><span class="pill warn">${esc('Sin practicar esta semana')}</span> ${names(inactive)}</p>` : ''}
      ${overdue.length ? `<p><span class="pill late">${esc('Con tareas vencidas')}</span> ${names(overdue)}</p>` : ''}</div>` : ''}
    ${students.length ? trackingHtml(rows, counts) : ''}
    <h2>${esc('Tareas')}</h2>${tasksHtml(rows)}
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

function trackingHtml(rows, counts) {
  const { tasks, summaries } = ctx.data;
  const shown = filterRows(rows, ctx.filter, ctx.sort);
  const units = unitColumns(summaries);
  const chips = FILTERS.map(f => `<button type="button" class="chip-btn" data-filter="${f}" aria-pressed="${ctx.filter === f}">${esc(FILTER_NAME[f])} <span class="count">${counts[f]}</span></button>`).join('');
  const unitTitle = key => {
    const [, l, u] = /^l(\d+)u(\d+)$/.exec(key);
    const unit = ((ctx.lm.tree.find(x => x.level === Number(l)) || {}).units || []).find(x => x.unit === Number(u));
    return { short: `N${l} · U${u}`, long: unit ? unit.title : '' };
  };
  const useUnits = ctx.cols === 'units';
  const heads = useUnits ? units.map(k => { const u = unitTitle(k); return `<th scope="col" title="${esc(u.long)}"><span>${esc(u.short)}</span>${u.long ? `<small>${esc(u.long)}</small>` : ''}</th>`; }).join('')
    : tasks.map(tk => `<th scope="col"><button type="button" class="aula-th-btn" data-task="${esc(tk.id)}"><span>${esc(tk.title)}</span><small>${esc(dueLabel(tk, today()))}</small></button></th>`).join('');
  const cells = r => (useUnits
    ? units.map(k => { const p = r.summary && r.summary.units ? r.summary.units[k] : undefined; return p === undefined ? '<td class="aula-cell none"><b>—</b></td>' : `<td class="aula-cell ${pctBand(p)}"><b>${p} %</b></td>`; }).join('')
    : r.cells.map((c, i) => pctCell(c, { label: `${r.nickname} · ${tasks[i].title}` })).join(''));
  const empty = useUnits ? !units.length : !tasks.length;
  return `<h2>${esc('Seguimiento')}</h2>
    <div class="aula-filters" role="group" aria-label="${esc('Filtrar alumnos')}">${chips}</div>
    <div class="row aula-view-opts"><div class="seg" role="group" aria-label="${esc('Columnas')}"><button type="button" data-cols="tasks" aria-pressed="${!useUnits}">${esc('Tareas')}</button><button type="button" data-cols="units" aria-pressed="${useUnits}">${esc('Unidades de Lenguaje')}</button></div>
      <label class="small" for="aulaSort">${esc('Ordenar')}</label><select id="aulaSort" class="select small"><option value="name" ${ctx.sort === 'name' ? 'selected' : ''}>${esc('Por nombre')}</option><option value="attention" ${ctx.sort === 'attention' ? 'selected' : ''}>${esc('Primero quien necesita ayuda')}</option></select></div>
    ${empty ? `<p class="aula-empty">${esc(useUnits ? 'Aún nadie ha hecho ejercicios de Lenguaje Musical.' : 'Pon la primera tarea para ver aquí el progreso de cada alumno.')}</p>` : ''}
    ${shown.length ? `<div class="table-wrap aula-table-wrap" tabindex="0" role="region" aria-label="${esc('Tabla de seguimiento')}"><table class="aula-table">
      <caption class="sr-only">${esc(useUnits ? '% de cada alumno en las unidades de Lenguaje Musical' : '% de cada alumno en cada tarea')}</caption>
      <thead><tr><th scope="col" class="aula-name-col">${esc('Alumno')}</th><th scope="col">${esc('7 días')}</th>${heads}${useUnits ? '' : `<th scope="col">${esc('Promedio')}</th>`}</tr></thead>
      <tbody>${shown.map(r => `<tr><th scope="row" class="aula-name-col"><button type="button" class="aula-student-btn" data-student="${esc(r.id)}"><b>${esc(r.nickname)}</b><small><span>${esc(instrumentById(r.instrument).name)}</span>${r.streak ? ` · <span aria-label="${esc(`Racha: ${r.streak}`)}">🔥 ${r.streak}</span>` : ''}</small></button></th>
        <td class="aula-min${r.inactive ? ' zero' : ''}">${esc(r.inactive ? 'Sin práctica' : `${r.week} min`)}</td>${cells(r)}
        ${useUnits ? '' : `<td class="aula-cell ${r.avg === null ? 'none' : pctBand(r.avg)}"><b>${r.avg === null ? '—' : `${r.avg} %`}</b></td>`}</tr>`).join('')}</tbody></table></div>${LEGEND}`
      : `<p class="aula-empty">${esc('Ningún alumno cumple este filtro.')}</p>`}`;
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
        <button type="button" class="btn ghost small danger" data-del-task="${esc(tk.id)}">${esc('Borrar')}</button></div></article>`;
  }).join('')}</div>`;
}

function settingsHtml(cls) {
  return `<details class="panel aula-settings"><summary>${esc('Ajustes de la clase')}</summary>
    <form class="form" id="aulaRename" novalidate><label for="aulaNewName">${esc('Nombre de la clase')}</label><div class="row"><input id="aulaNewName" class="input" maxlength="60" value="${esc(cls.name)}"><button class="btn ghost small" type="submit">${esc('Guardar')}</button></div></form>
    <p class="muted small">${esc('Borrar la clase quita sus tareas, sus entregas y a sus alumnos. No se puede deshacer.')}</p>
    <button type="button" class="btn ghost small danger" id="aulaDelete">${esc('Borrar la clase')}</button></details>`;
}

function bindClass() {
  const box = $('aulaBody');
  const { cls } = ctx.data;
  attachTooltips(box);
  $('aulaNewTask').addEventListener('click', () => openAulaTaskForm({ ctx, onSaved: load }));
  $('aulaInvite').addEventListener('click', () => invite(cls));
  box.querySelectorAll('[data-student]').forEach(b => b.addEventListener('click', () => { ctx = { ...ctx, uid: b.dataset.student }; render(); }));
  box.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { ctx = { ...ctx, filter: b.dataset.filter }; renderClass(); box.querySelector(`[data-filter="${b.dataset.filter}"]`).focus(); }));
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
    <p>${cell ? statusPill(cell.status) : ''} ${entry && entry.n ? `<b>${entry.p} %</b> · ${partsHtml([`${entry.n} ${entry.n === 1 ? 'intento' : 'intentos'}`, `último el ${fmtShort(entry.l)}`])}` : `<span>${esc('Todavía no lo ha intentado')}</span>`}</p>
    <p class="muted small">${partsHtml([`Mínimo ${task.minPct} %`, dueLabel(task, today())])}</p>
    <label for="aulaComment">${esc('Comentario para el alumno')}</label><textarea id="aulaComment" maxlength="500" placeholder="${esc('Ej.: ¡Muy bien el pulso! Repasa los silencios.')}">${esc(fb ? fb.comment : '')}</textarea>
    <div class="row"><button type="button" class="btn" id="aulaSaveComment">${esc('Guardar comentario')}</button><button type="button" class="btn ghost small" data-close>${esc('Cerrar')}</button></div>`, box => {
    box.querySelector('#aulaSaveComment').addEventListener('click', async () => {
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
      return `<button type="button" class="list-row task-row aula-entry" data-entry="${esc(r.id)}"><span><b>${esc(r.nickname)}</b><small><span>${esc(c.n ? `${c.n} ${c.n === 1 ? 'intento' : 'intentos'}` : 'Sin intentos todavía')}</span>${fb ? ' · <span aria-hidden="true">💬</span>' : ''}</small></span><span>${statusPill(c.status)} <b>${c.n ? `${c.p} %` : '—'}</b></span></button>`; }).join('') || `<p class="muted">${esc('Esta tarea no va para nadie de la clase.')}</p>`}</div>
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
