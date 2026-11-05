// Piezas comunes de las pantallas del Aula: fechas, estado de una entrega y celdas con % (el número siempre escrito).
import { esc } from '../ui.js';
import { dateLocale } from './band-ui.js';
import { pctBand, daysBetween } from '../aula.js';
import { KIND_NAMES, refParts } from '../aula-temario.js';
import { getState } from '../store.js';

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

export const STATUS_NAME = { done: 'Hecha', out: 'Intentos agotados', late: 'Vencida', progress: 'Empezada', todo: 'Sin empezar' };
const STATUS_PILL = { done: 'ok', out: 'bad', late: 'late', progress: 'warn', todo: '' };
export const statusPill = status => `<span class="pill ${STATUS_PILL[status]}">${esc(STATUS_NAME[status])}</span>`;
const STATUS_MARK = { done: '✓', out: '✕', late: '!', progress: '', todo: '' };

// Celda de la tabla de la clase: color por % con el número escrito y una marca de estado (no solo color)
export function pctCell(cell, { label = '' } = {}) {
  if (!cell) return '<td class="aula-cell na"><span aria-hidden="true">·</span><span class="sr-only">No asignada</span></td>';
  const p = pctNum(cell.p);
  const shown = cell.n ? `${p} %` : '—';
  const band = cell.n ? pctBand(p) : 'none';
  const mark = STATUS_MARK[cell.status];
  return `<td class="aula-cell ${band} st-${esc(cell.status)}"><button type="button" class="aula-cell-btn" tabindex="-1" data-cell="${esc(cell.taskId)}" aria-label="${esc(`${label}: ${shown === '—' ? '' : shown + ', '}${STATUS_NAME[cell.status]}`)}">
    <b>${esc(shown)}</b>${mark ? `<i aria-hidden="true">${mark}</i>` : ''}</button></td>`;
}

// Varias piezas «a · b · c», cada una en su <span> (así cada pieza se traduce sola al inglés)
export const partsHtml = parts => parts.filter(Boolean).map(p => `<span>${esc(p)}</span>`).join(' · ');
// Subtítulo de una tarea: tipo · lo elegido del temario (ref.label, escrito por el formulario con « · »)
export const subtitleHtml = task => partsHtml([KIND_NAMES[task.kind], ...refParts(task, { styles: getState().styles, nom: getState().nom })]);

// Barra de progreso con el % escrito al lado
// Todo % que llega de fuera (lo publica el alumno) se convierte en número entero 0-100 antes de pintarlo
export const pctNum = v => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0; };

export const meter = (raw, label = '') => { const p = pctNum(raw); return `<div class="aula-meter" role="img" aria-label="${esc(`${label} ${p} %`.trim())}"><span class="prog-bar"><i style="width:${p}%"></i></span><b>${p} %</b></div>`; };

// Leyenda de colores de la tabla
export const LEGEND = `<div class="aula-legend" aria-label="Leyenda"><span><i class="sw low"></i>Menos del 50 %</span><span><i class="sw mid"></i>50-69 %</span><span><i class="sw good"></i>70-89 %</span><span><i class="sw top"></i>90 % o más</span><span><b>✓</b> Hecha</span><span><b>!</b> Vencida</span><span><b>✕</b> Intentos agotados</span><span><b>—</b> Sin empezar</span></div>`;

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
