// Piezas comunes de las pantallas del Aula: fechas, estado de una entrega y celdas con % (el número siempre escrito).
import { esc } from '../ui.js';
import { dateLocale } from './band-ui.js';
import { pctBand, daysBetween } from '../aula.js';
import { KIND_NAMES } from '../aula-temario.js';

export const fmtShort = ms => new Date(ms).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' });
export const fmtDayKey = day => fmtShort(new Date(day + 'T12:00').getTime());
export const fmtLong = ms => new Date(ms).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' });

// Fecha de entrega en palabras
export function dueLabel(task, today) {
  if (!task.due) return 'Sin fecha';
  const d = daysBetween(today, task.due);
  if (d < 0) return `Venció el ${fmtDayKey(task.due)}`;
  if (d === 0) return 'Vence hoy';
  if (d === 1) return 'Vence mañana';
  return `Vence el ${fmtDayKey(task.due)}`;
}

export const STATUS_NAME = { done: 'Hecha', out: 'Sin intentos', late: 'Vencida', progress: 'Empezada', todo: 'Sin empezar' };
const STATUS_PILL = { done: 'ok', out: 'bad', late: 'late', progress: 'warn', todo: '' };
export const statusPill = status => `<span class="pill ${STATUS_PILL[status]}">${esc(STATUS_NAME[status])}</span>`;
const STATUS_MARK = { done: '✓', out: '✕', late: '!', progress: '', todo: '' };

// Celda de la tabla de la clase: color por % con el número escrito y una marca de estado (no solo color)
export function pctCell(cell, { label = '' } = {}) {
  if (!cell) return '<td class="aula-cell na"><span aria-hidden="true">·</span><span class="sr-only">No asignada</span></td>';
  const shown = cell.n ? `${cell.p ?? 0} %` : '—';
  const band = cell.n ? pctBand(cell.p ?? 0) : 'none';
  const mark = STATUS_MARK[cell.status];
  return `<td class="aula-cell ${band} st-${cell.status}"><button type="button" class="aula-cell-btn" data-cell="${esc(cell.taskId)}" aria-label="${esc(`${label}: ${shown === '—' ? '' : shown + ', '}${STATUS_NAME[cell.status]}`)}">
    <b>${esc(shown)}</b>${mark ? `<i aria-hidden="true">${mark}</i>` : ''}</button></td>`;
}

// Varias piezas «a · b · c», cada una en su <span> (así cada pieza se traduce sola al inglés)
export const partsHtml = parts => parts.filter(Boolean).map(p => `<span>${esc(p)}</span>`).join(' · ');
// Subtítulo de una tarea: tipo · lo elegido del temario (ref.label, escrito por el formulario con « · »)
export const subtitleHtml = task => partsHtml([KIND_NAMES[task.kind], ...String((task.ref && task.ref.label) || '').split(' · ')]);

// Barra de progreso con el % escrito al lado
export const meter = (p, label = '') => `<div class="aula-meter" role="img" aria-label="${esc(`${label} ${p} %`.trim())}"><span class="prog-bar"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></span><b>${p} %</b></div>`;

// Leyenda de colores de la tabla
export const LEGEND = `<div class="aula-legend" aria-label="Leyenda"><span><i class="sw low"></i>Menos del 50 %</span><span><i class="sw mid"></i>50-69 %</span><span><i class="sw good"></i>70-89 %</span><span><i class="sw top"></i>90 % o más</span><span><b>✓</b> Hecha</span><span><b>!</b> Vencida</span><span><b>✕</b> Sin intentos</span><span><b>—</b> Sin empezar</span></div>`;

// Descarga un texto (CSV) con BOM para que Excel lea bien las tildes
export function downloadText(text, filename, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const safeName = name => String(name || 'clase').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'clase';
