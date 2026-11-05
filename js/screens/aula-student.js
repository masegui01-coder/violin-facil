// Ficha de un alumno en el Aula (profesor): minutos por día, racha, % y nota por competencia, errores frecuentes,
// sus tareas con el comentario de cada entrega, el historial de intentos y su informe trimestral en PDF.
import { $, esc, toast } from '../ui.js';
import { cloudErrorText } from '../cloud.js';
import { instrumentById } from '../instruments.js';
import { t } from '../i18n.js';
import { columns, hbars, statTile, attachTooltips } from '../charts.js';
import { addDays, dayKey, minutesInLast } from '../aula.js';
import { termOf, termReport, gradeWord } from '../aula-report.js';
import { mistakeLabel, attemptLabel, flattenLm } from '../aula-temario.js';
import * as api from '../aula-api.js';
import { statusPill, dueLabel, fmtShort, fmtDayKey, partsHtml, subtitleHtml } from './aula-ui.js';

const CHART_DAYS = 28;

function minutesChart(days, today) {
  const series = Array.from({ length: CHART_DAYS }, (_, i) => {
    const day = addDays(today, i - CHART_DAYS + 1);
    const value = Math.round((days && days[day]) || 0);
    return { label: fmtDayKey(day), value, tip: `${fmtDayKey(day)}: ${value} min`, strong: day === today };
  });
  return columns(series, { unit: 'min', title: t('Minutos de práctica por día, últimas 4 semanas'), width: 560, height: 150, xLabels: [0, 13, 27] });
}

export function renderStudent(box, { ctx, row, entrySheet, reportSheet, removed }) {
  const today = dayKey(Date.now());
  const sum = row.summary || {};
  const term = termOf(new Date());
  const rep = termReport({ summary: sum, tasks: ctx.data.tasks, uid: row.id, term, today });
  const exercises = flattenLm(ctx.lm.tree);
  const skills = rep.rows.filter(r => !['tareas', 'constancia'].includes(r.id));
  const withData = skills.filter(r => r.pct !== null);
  const tasks = ctx.data.tasks.map((task, i) => ({ task, cell: row.cells[i] })).filter(x => x.cell);
  const recent = [...(sum.recent || [])].reverse();
  box.innerHTML = `<p class="muted">${partsHtml([instrumentById(row.instrument).name, sum.at ? `Última actividad el ${fmtShort(sum.at)}` : 'Aún no ha publicado actividad'])}</p>
    <div class="tiles aula-tiles">${statTile({ label: t('Minutos (7 días)'), value: minutesInLast(sum.days, today, 7), good: row.inactive ? false : null, hint: row.inactive ? t('Sin practicar esta semana') : '' })}
      ${statTile({ label: t('Racha'), value: `${row.streak} ${row.streak === 1 ? t('día') : t('días')}` })}
      ${statTile({ label: t('Días de práctica del trimestre'), value: rep.daysPracticed, hint: t(`${rep.minutes} min en total`) })}
      ${statTile({ label: t('Tareas hechas'), value: `${row.done}/${row.assigned}`, good: row.overdue ? false : null, hint: row.overdue ? t(`${row.overdue} vencidas`) : '' })}</div>
    <section class="panel"><h2>${esc('Minutos por día')}</h2>${minutesChart(sum.days, today)}</section>
    <section class="panel"><h2>${esc('Competencias')} <small class="muted">${esc('este trimestre')}</small></h2>
      ${withData.length ? hbars(skills.map(r => ({ label: t(r.label), value: r.pct || 0, display: r.pct === null ? '—' : `${r.pct} % · ${r.grade}`, sub: r.pct === null ? t('Sin datos') : t(gradeWord(r.grade)) })), { max: 100 })
        : `<p class="aula-empty">${esc('Cuando haga ejercicios de Lenguaje Musical verás aquí su % en ritmo, entonación, lectura, teoría, dictado y audición.')}</p>`}</section>
    <section class="panel"><h2>${esc('Errores frecuentes')}</h2>
      ${rep.mistakes.length ? `<ul class="aula-mistakes">${rep.mistakes.map(([code, n]) => `<li><span>${esc(mistakeLabel(code, ctx.lm.mistakes))}</span><b>${esc(`${n} ${n === 1 ? 'vez' : 'veces'}`)}</b></li>`).join('')}</ul>`
        : `<p class="aula-empty">${esc('Sin errores repetidos por ahora.')}</p>`}</section>
    <section class="panel"><h2>${esc('Tareas')}</h2>
      ${tasks.length ? `<div class="list">${tasks.map(({ task, cell }) => { const fb = ctx.data.feedback[`${task.id}_${row.id}`];
        return `<button type="button" class="list-row task-row aula-entry" data-entry="${esc(task.id)}"><span><b>${esc(task.title)}</b><small>${subtitleHtml(task)} · <span>${esc(dueLabel(task, today))}</span></small>${fb ? `<small class="aula-fb"><span aria-hidden="true">💬</span> ${esc(fb.comment)}</small>` : ''}</span>
          <span>${statusPill(cell.status)} <b>${cell.n ? `${cell.p} %` : '—'}</b></span></button>`; }).join('')}</div>`
        : `<p class="aula-empty">${esc('No tiene tareas asignadas.')}</p>`}</section>
    <section class="panel"><h2>${esc('Historial de intentos')}</h2>
      ${recent.length ? `<ol class="aula-history">${recent.map(x => `<li><span>${partsHtml(attemptLabel(x, exercises).split(' · '))}</span><span class="muted small">${esc(fmtShort(x.at))}</span><b>${x.p} %</b></li>`).join('')}</ol>`
        : `<p class="aula-empty">${esc('Todavía no hay intentos.')}</p>`}</section>
    <div class="row aula-exports"><button type="button" class="btn" id="aulaStudentPdf">${esc('Informe trimestral (PDF)')}</button>
      <button type="button" class="btn ghost small danger" id="aulaRemove">${esc('Dar de baja de la clase')}</button></div>`;
  attachTooltips(box);
  box.querySelectorAll('[data-entry]').forEach(b => b.addEventListener('click', () => entrySheet(row.id, b.dataset.entry)));
  $('aulaStudentPdf').addEventListener('click', () => reportSheet(row.id));
  $('aulaRemove').addEventListener('click', async e => {
    if (!e.currentTarget.dataset.confirm) { e.currentTarget.dataset.confirm = '1'; e.currentTarget.textContent = '¿Seguro? Toca otra vez'; return; }
    try { await api.removeStudent(ctx.sid, ctx.cid, row.id); toast('Alumno dado de baja'); removed(); } catch (err) { toast(cloudErrorText(err)); }
  });
}
