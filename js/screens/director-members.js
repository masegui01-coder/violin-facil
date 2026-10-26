// Músicos: lista por secciones con su actividad (minigráfica de 14 días) y la ficha de cada músico.
import { esc, num } from '../ui.js';
import * as api from '../band-api.js';
import { trafficLight, minutesInLast, practiceDays, dailySeries, FAMILY_NAME } from '../band-stats.js';
import { instrumentById } from '../instruments.js';
import { noteLabel, isBowed } from '../music.js';
import { getState } from '../store.js';
import { columns, sparkbars, statTile } from '../charts.js';
import { ROLE_NAME, fmtDay, lightDot, seatName, pct } from './band-ui.js';
import { derive, shortDay } from './director-common.js';

const SORTS = [['activity', 'Más activos'], ['risk', 'Menos activos'], ['section', 'Por sección'], ['name', 'Nombre']];
let sort = 'section';
let family = 'all';
export const setMemberSort = v => { sort = v; };
export const setMemberFamily = v => { family = v; };

const SPARK_DAYS = 14;
const WORST_NOTES = 3;
const familyOf = m => instrumentById(m.instrument).family;

function rowHtml(m, d, tasksOf) {
  const series = dailySeries([m], d.day, SPARK_DAYS).map(x => x.minutes);
  const t = tasksOf(m);
  return `<button type="button" class="list-row member-row" data-act="member:${m.id}">${lightDot(trafficLight(m, d.day))}
    <span><b>${esc(m.nickname)}</b>${m.role === 'leader' ? ' <span class="pill">Jefe de cuerda</span>' : ''}<small>${esc(seatName(m))} · ${Math.round(minutesInLast(m, d.day, 7))} min esta semana · tareas ${t.done}/${t.total}</small></span>
    ${sparkbars(series)}<span class="chev">›</span></button>`;
}

export function membersView(ctx) {
  const d = derive(ctx);
  if (!d.musicians.length) return '<p class="empty">Todavía no hay músicos. Comparte el código de la banda (en «Más») para que se unan.</p>';
  const tasksOf = m => {
    const mine = ctx.tasks.filter(t => api.assignedTo(t, m));
    return { total: mine.length, done: mine.filter(t => ctx.progress.some(p => p.taskId === t.id && p.uid === m.id && p.completed)).length };
  };
  const families = [...new Set(d.musicians.map(familyOf))];
  const list = d.musicians.filter(m => family === 'all' || familyOf(m) === family);
  const mins = m => minutesInLast(m, d.day, 7);
  const sorted = [...list].sort(sort === 'activity' ? (a, b) => mins(b) - mins(a) : sort === 'risk' ? (a, b) => mins(a) - mins(b)
    : sort === 'name' ? (a, b) => a.nickname.localeCompare(b.nickname) : (a, b) => (a.instrument + (a.voice || 0)).localeCompare(b.instrument + (b.voice || 0)));
  const body = sort === 'section'
    ? [...new Set(sorted.map(m => m.instrument))].map(inst => `<p class="group-title">${esc(instrumentById(inst).name)} · ${sorted.filter(m => m.instrument === inst).length}</p>
        <div class="list">${sorted.filter(m => m.instrument === inst).map(m => rowHtml(m, d, tasksOf)).join('')}</div>`).join('')
    : `<div class="list">${sorted.map(m => rowHtml(m, d, tasksOf)).join('')}</div>`;
  return `<div class="toolbar">${families.length > 1 ? `<div class="chips-row"><button type="button" class="chip-btn" data-act="mfamily:all" aria-pressed="${family === 'all'}">Todos <span>${d.musicians.length}</span></button>
      ${families.map(f => `<button type="button" class="chip-btn" data-act="mfamily:${f}" aria-pressed="${family === f}">${FAMILY_NAME[f] || f} <span>${d.musicians.filter(m => familyOf(m) === f).length}</span></button>`).join('')}</div>` : ''}
    <label class="sort-pick">Ordenar <select class="select small" data-change="msort">${SORTS.map(([id, name]) => `<option value="${id}" ${sort === id ? 'selected' : ''}>${name}</option>`).join('')}</select></label></div>
    <p class="muted small">${lightDot('green')} al día · ${lightDot('amber')} hace días · ${lightDot('red')} sin ensayar. Barras: minutos de los últimos 14 días.</p>
    ${body}`;
}

// Ficha del músico
export function memberDetail(ctx, m) {
  const d = derive(ctx);
  const series = dailySeries([m], d.day, 30);
  const mine = ctx.tasks.filter(t => api.assignedTo(t, m));
  const prog = t => ctx.progress.find(p => p.taskId === t.id && p.uid === m.id);
  const worst = Object.entries(m.tuning || {}).map(([midi, c]) => ({ midi: Number(midi), c })).sort((a, b) => Math.abs(b.c) - Math.abs(a.c)).slice(0, WORST_NOTES);
  const nom = getState().nom;
  return `<p class="eyebrow">${lightDot(trafficLight(m, d.day))} ${esc(seatName(m))} · ${esc(ROLE_NAME[m.role] || '')}</p><h2>${esc(m.nickname)}</h2>
    <div class="tiles">${statTile({ label: 'Minutos (30 días)', value: Math.round(minutesInLast(m, d.day, 30)) })}${statTile({ label: 'Días que practicó', value: `${practiceDays(m, d.day, 30)}/30` })}
      ${statTile({ label: 'Tareas hechas', value: `${mine.filter(t => prog(t)?.completed).length}/${mine.length}` })}${statTile({ label: 'Nivel', value: m.level || '—', hint: `racha de ${m.streak || 0} días · ${m.points || 0} puntos` })}</div>
    <h3>Práctica, últimos 30 días</h3>
    ${columns(series.map((s, i) => ({ label: String(Number(s.day.slice(8))), value: s.minutes, strong: i === series.length - 1, tip: `${shortDay(s.day)}: ${s.minutes} min` })), { unit: 'min', title: `Minutos de ${m.nickname} por día`, xLabels: [0, 15, 29] })}
    <h3>Tareas</h3>
    ${mine.length ? `<div class="list">${mine.map(t => {
      const p = prog(t);
      return `<div class="list-row static"><span><b>${esc(t.title)}</b><small>${!p ? 'Sin empezar' : p.completed ? 'Hecha' : 'En curso'}${p ? ` · mejor ${pct(t.passage ? p.passageBest || 0 : p.bestAccuracy || 0)} · ${num(p.attempts)} intentos · ${num(p.minutes)} min` : ''}</small></span>
        ${p ? `<button type="button" class="btn ghost small" data-act="stamp:${p.id}">${p.stamp || p.comment ? 'Sello ✓' : 'Sellar'}</button>` : ''}</div>`;
    }).join('')}</div>` : '<p class="muted">No tiene tareas asignadas.</p>'}
    ${worst.length ? `<h3>Notas que más le cuestan afinar</h3><p class="small">${worst.map(w => `<b>${esc(noteLabel({ midi: w.midi }, nom, !isBowed(m.instrument)))}</b> ${w.c > 0 ? '+' : ''}${Math.round(w.c)} ¢`).join(' · ')}</p>` : ''}
    <h3>Ajustes</h3>
    <div class="row"><label class="sort-pick">Voz <select class="select small" data-change="voice:${m.id}">${['', 1, 2, 3, 4].map(v => `<option value="${v}" ${String(v) === String(m.voice || '') ? 'selected' : ''}>${v ? v + 'º' : '—'}</option>`).join('')}</select></label>
      <label class="sort-pick">Papel <select class="select small" data-change="role:${m.id}">${['member', 'leader'].map(r => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${ROLE_NAME[r]}</option>`).join('')}</select></label></div>
    <p class="muted small">${m.lastPractice ? `Último ensayo: ${fmtDay(m.lastPractice)}.` : 'Aún no ha ensayado.'} Los jefes de cuerda ven el progreso de su sección.</p>
    <div class="row"><button type="button" class="btn small" data-act="notice-to:${m.id}">Enviarle un aviso</button><button type="button" class="btn ghost small danger" data-act="remove-member:${m.id}">Quitar de la banda</button>
      <button type="button" class="btn ghost small" data-close>Cerrar</button></div>`;
}
