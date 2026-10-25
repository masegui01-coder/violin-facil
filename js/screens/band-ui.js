// Piezas comunes de la pestaña Banda (director y músicos).
import { esc } from '../ui.js';
import { instrumentById } from '../instruments.js';

export const MODE_NAME = { learn: 'Nota a nota', tempo: 'A tempo', memory: 'De memoria' };
export const ROLE_NAME = { member: 'Músico', leader: 'Jefe de cuerda', director: 'Director' };
export const LIGHT_NAME = { green: 'Al día', amber: 'Hace días', red: 'Sin ensayar' };
const VOICE_NAME = { 1: '1º', 2: '2º', 3: '3º', 4: '4º' };
const DAY_MS = 86400000;

export const fmtDate = ms => new Date(ms).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
export const fmtDay = day => fmtDate(new Date(day + 'T12:00'));
export const pct = x => `${Math.round(x * 100)} %`;

export function dueBadge(task) {
  if (!task.due) return '';
  const left = Math.ceil((new Date(task.due + 'T23:59') - Date.now()) / DAY_MS);
  const cls = left < 0 ? 'late' : left <= 2 ? 'warn' : '';
  return `<span class="pill ${cls}">${left < 0 ? 'Venció' : 'Hasta'} ${fmtDay(task.due)}</span>`;
}

// «Clarinete 2º», «Trompeta»
export function seatName(member) {
  const inst = instrumentById(member.instrument).name;
  return member.voice ? `${inst} ${VOICE_NAME[member.voice] || member.voice}` : inst;
}

export function voiceKeyName(key) {
  const [inst, voice] = key.split('#');
  return key === 'all' ? 'Todos' : seatName({ instrument: inst, voice });
}

export function taskSubtitle(task, part) {
  const what = task.passage ? `Compases ${task.passage.fromBar}–${task.passage.toBar} en bucle` : MODE_NAME[task.mode];
  return [part?.title, what, `mínimo ${task.minStars}★`].filter(Boolean).join(' · ');
}

export const lightDot = light => `<i class="light ${light}" title="${LIGHT_NAME[light]}" aria-label="${LIGHT_NAME[light]}"></i>`;

export const bar = ratio => `<span class="prog-bar"><i style="width:${Math.round(Math.min(1, ratio) * 100)}%"></i></span>`;

// Sello y comentario del director, tal como lo ve el músico
export function stampHtml(p) {
  if (!p || (!p.stamp && !p.comment)) return '';
  return `<div class="stamp">${p.stamp ? '<b>Visto bueno del director</b>' : '<b>Comentario del director</b>'}${p.comment ? `<span>${esc(p.comment)}</span>` : ''}</div>`;
}

export function sheet(html, onReady) {
  const box = document.getElementById('sheetBody');
  box.innerHTML = `<div class="sheet-body">${html}</div>`;
  box.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => document.getElementById('sheet').close()));
  if (onReady) onReady(box);
  if (!document.getElementById('sheet').open) document.getElementById('sheet').showModal();
}
