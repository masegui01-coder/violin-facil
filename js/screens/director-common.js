// Datos derivados y piezas comunes del panel del director.
import { esc } from '../ui.js';
import * as api from '../band-api.js';
import { taskStatus } from '../band-stats.js';
import { today } from '../store.js';
import { fmtDay } from './band-ui.js';

export const musiciansOf = ctx => ctx.members.filter(m => m.role !== 'director');

// Todo lo que el panel calcula una vez por pintado
export function derive(ctx) {
  const day = today();
  const musicians = musiciansOf(ctx);
  const statusOf = task => taskStatus(task, musicians.filter(m => api.assignedTo(task, m)), ctx.progress, day);
  return { day, musicians, statusOf };
}

export const shortDay = day => new Date(day + 'T12:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });

// Barra de progreso con su estado (verde terminada, rojo vencida, color de la app en curso)
export function meter(ratio, state = 'open') {
  return `<span class="meter-bar ${state}"><i style="width:${Math.round(Math.min(1, ratio) * 100)}%"></i></span>`;
}

export function dueText(task, day) {
  if (!task.due) return 'Sin fecha';
  const left = Math.round((new Date(task.due + 'T12:00') - new Date(day + 'T12:00')) / 86400000);
  if (left < 0) return `Venció el ${fmtDay(task.due)}`;
  if (left === 0) return 'Vence hoy';
  return left === 1 ? 'Vence mañana' : `Vence en ${left} días`;
}

export const STATE_PILL = { done: '<span class="pill ok">Terminada</span>', late: '<span class="pill late">Vencida</span>', open: '' };

export function section(title, body, action = '') {
  return `<section class="dash-card"><div class="dash-head"><h2>${esc(title)}</h2>${action}</div>${body}</section>`;
}
