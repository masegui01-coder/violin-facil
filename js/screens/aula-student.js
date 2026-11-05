// Ficha de un alumno en el Aula (profesor): minutos por día, racha, % y nota por competencia, errores frecuentes,
// sus tareas con el comentario de cada entrega, el historial de intentos y su informe trimestral en PDF.
import { $, esc, toast } from '../ui.js';
import { cloudErrorText } from '../cloud.js';
import { instrumentById } from '../instruments.js';
import { t } from '../i18n.js';
import { columns, hbars, statTile, attachTooltips } from '../charts.js';
import { addDays, dayKey, minutesInLast } from '../aula.js';
import { termOf, termReport, gradeWord } from '../aula-report.js';
import { mistakeLabel, attemptLabel, flattenLm, lessonTitleMap } from '../aula-temario.js';
import { getState } from '../store.js';
import * as api from '../aula-api.js';
import { statusPill, dueLabel, fmtShort, fmtDayKey, partsHtml, subtitleHtml, pctNum } from './aula-ui.js';

const CHART_DAYS = 28;

function minutesChart(days, today) {
  const series = Array.from({ length: CHART_DAYS }, (_, i) => {
    const day = addDays(today, i - CHART_DAYS + 1);
    const value = Math.round((days && days[day]) || 0);
    return { label: fmtDayKey(day), value, tip: `${fmtDayKey(day)}: ${value} min`, strong: day === today };
  });
  return columns(series, { unit: 'min', title: t('Minutos de práctica por día, últimas 4 semanas'), width: 560, height: 150, xLabels: [0, 13, 27] });
}

// Composiciones que envió el alumno desde el curso de Lenguaje (creatividad): partitura en texto, letra y reglas cumplidas
function worksHtml(works) {
  if (!works.length) return `<p class="aula-empty">${esc('Sus composiciones del curso de Lenguaje Musical aparecerán aquí cuando te las envíe.')}</p>`;
  return `<ul class="aula-works">${works.map(w => `<li><span><b>${esc(w.title)}</b><small class="muted"><span>${esc(fmtShort(w.at))}</span> · <span>${esc(w.meter)}</span> · <span>${pctNum(w.pct)} %</span> <span>reglas cumplidas</span></small>
    ${w.lyrics ? `<small lang="es">${esc(w.lyrics)}</small>` : ''}</span>
    <button type="button" class="btn ghost small" data-work="${esc(w.exId)}">Escuchar</button></li>`).join('')}</ul>`;
}
async function playWork(w) {
  if (!w) return;
  const [{ parseTokens, tokensToNotes }, { playNotes, stopSound }] = await Promise.all([import('../lm/notes.js'), import('../lm/sound.js')]);
  stopSound();
  let notes;
  try { notes = tokensToNotes(parseTokens(w.score)); } catch (e) { toast('Esta composición no se puede reproducir'); return; }
  // solo ritmo (todas en la misma línea, Do5): se escucha con palmas
  const rhythm = notes.filter(n => !n.rest).every(n => n.midi === 72);
  playNotes(notes, 80, { clap: rhythm });
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
  const titles = new Map(lessonTitleMap(row.instrument || 'violin', getState().styles, getState().nom));
  ctx.data.tasks.filter(tk => tk.kind === 'xml').forEach(tk => titles.set('aula-' + tk.id, tk.title));
  // Trimestre anterior (si el alumno lo guardó): para comparar cada competencia
  const prev = sum.prevTerm ? Object.fromEntries(Object.entries(sum.prevSkills || {}).map(([k, v]) => [k, pctNum(v)])) : {};
  const overall = rep.overall === null ? null : Math.round(rep.overall);
  box.innerHTML = `<p class="muted">${partsHtml([instrumentById(row.instrument).name, sum.at ? `Última actividad el ${fmtShort(sum.at)}` : 'Aún no ha publicado actividad'])}</p>
    <div class="tiles aula-tiles">${statTile({ label: t('Minutos (7 días)'), value: minutesInLast(sum.days, today, 7), good: row.inactive ? false : null, hint: row.inactive ? t('Sin practicar esta semana') : '' })}
      ${statTile({ label: t('Racha'), value: `${row.streak} ${row.streak === 1 ? t('día') : t('días')}` })}
      ${statTile({ label: t('Días de práctica del trimestre'), value: rep.daysPracticed, hint: t(`${rep.minutes} min en total`) })}
      ${statTile({ label: t('Tareas hechas'), value: `${row.done}/${row.assigned}`, good: row.overdue ? false : null, hint: row.overdue ? t(row.overdue === 1 ? '1 vencida' : `${row.overdue} vencidas`) : '' })}
      ${statTile({ label: t('Nota del trimestre'), value: overall === null ? '—' : `${overall}/10`, hint: overall === null ? t('Sin datos') : t(gradeWord(overall)) })}</div>
    <section class="panel"><h2>${esc('Minutos por día')}</h2>${minutesChart(sum.days, today)}</section>
    <section class="panel"><h2>${esc('Competencias')} <small class="muted">${esc('este trimestre')}</small></h2>
      ${withData.length ? hbars(skills.map(r => ({ label: t(r.label), value: r.pct || 0, display: r.pct === null ? '—' : `${pctNum(r.pct)} % · ${r.grade}/10`,
          sub: r.pct === null ? t('Sin datos') : `${t(gradeWord(r.grade))}${prev[r.id] !== undefined ? ` · ${t(`trimestre anterior: ${prev[r.id]} %`)}` : ''}` })), { max: 100 })
        : `<p class="aula-empty">${esc('Cuando haga ejercicios de Lenguaje Musical verás aquí su % en ritmo, entonación, lectura, teoría, dictado y audición.')}</p>`}</section>
    <section class="panel"><h2>${esc('Errores frecuentes')}</h2>
      ${rep.mistakes.length ? `<ul class="aula-mistakes">${rep.mistakes.map(([code, n]) => `<li><span>${esc(mistakeLabel(code, ctx.lm.mistakes))}</span><b>${esc(`${Number(n) || 0} ${Number(n) === 1 ? 'vez' : 'veces'}`)}</b></li>`).join('')}</ul>`
        : `<p class="aula-empty">${esc('Sin errores repetidos por ahora.')}</p>`}</section>
    <section class="panel"><h2>${esc('Tareas')}</h2>
      ${tasks.length ? `<div class="list">${tasks.map(({ task, cell }) => { const fb = ctx.data.feedback[`${task.id}_${row.id}`];
        return `<button type="button" class="list-row task-row aula-entry" data-entry="${esc(task.id)}"><span><b>${esc(task.title)}</b><small>${subtitleHtml(task)} · <span>${esc(dueLabel(task, today))}</span></small>${fb ? `<small class="aula-fb"><span aria-hidden="true">💬</span> ${esc(fb.comment)}</small>` : ''}</span>
          <span>${statusPill(cell.status)} <b>${cell.n ? `${pctNum(cell.p)} %` : '—'}</b></span></button>`; }).join('')}</div>`
        : `<p class="aula-empty">${esc('No tiene tareas asignadas.')}</p>`}</section>
    <section class="panel"><h2>${esc('Composiciones')}</h2>${worksHtml((ctx.data.works || []).filter(w => w.uid === row.id))}</section>
    <section class="panel"><h2>${esc('Historial de intentos')}</h2>
      ${recent.length ? `<ol class="aula-history">${recent.map(x => `<li><span>${partsHtml(attemptLabel(x, exercises, titles).split(' · '))}</span><span class="muted small">${esc(fmtShort(x.at))}</span><b>${pctNum(x.p)} %</b></li>`).join('')}</ol>`
        : `<p class="aula-empty">${esc('Todavía no hay intentos.')}</p>`}</section>
    <p class="muted small">${esc('Los minutos, los % y los intentos los registra la app del alumno mientras practica.')}</p>
    <div class="row aula-exports"><button type="button" class="btn" id="aulaStudentPdf">${esc('Informe trimestral (PDF)')}</button>
      <button type="button" class="btn ghost small danger" id="aulaRemove">${esc('Dar de baja de la clase')}</button></div>`;
  attachTooltips(box);
  box.querySelectorAll('[data-work]').forEach(b => b.addEventListener('click', () => playWork((ctx.data.works || []).find(w => w.exId === b.dataset.work && w.uid === row.id))));
  box.querySelectorAll('[data-entry]').forEach(b => b.addEventListener('click', () => entrySheet(row.id, b.dataset.entry)));
  $('aulaStudentPdf').addEventListener('click', () => reportSheet(row.id));
  $('aulaRemove').addEventListener('click', async e => {
    if (!e.currentTarget.dataset.confirm) { e.currentTarget.dataset.confirm = '1'; e.currentTarget.textContent = '¿Seguro? Toca otra vez'; return; }
    try { await api.removeStudent(ctx.sid, ctx.cid, row.id); toast('Alumno dado de baja'); removed(); } catch (err) { toast(cloudErrorText(err)); }
  });
}
