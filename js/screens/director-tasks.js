// Tareas del director: lista con filtros y ficha de cada tarea (quién la tiene, quién no ha empezado, sellos, recordatorio).
import { esc, starsHtml } from '../ui.js';
import { hbars, statTile } from '../charts.js';
import { seatName, pct, taskSubtitle } from './band-ui.js';
import { derive, meter, dueText, STATE_PILL } from './director-common.js';

const FILTERS = [['open', 'En curso'], ['late', 'Vencidas'], ['done', 'Terminadas'], ['all', 'Todas']];
let filter = 'open';
export const setTaskFilter = f => { filter = f; };

export function tasksView(ctx) {
  const d = derive(ctx);
  const items = ctx.tasks.map(t => ({ t, st: d.statusOf(t) }));
  const count = f => items.filter(x => f === 'all' || x.st.state === f).length;
  const shown = items.filter(x => filter === 'all' || x.st.state === filter)
    .sort((a, b) => (a.t.due || '9999').localeCompare(b.t.due || '9999'));
  return `<div class="row spread"><div class="chips-row">${FILTERS.map(([id, name]) => `<button type="button" class="chip-btn" data-act="tfilter:${id}" aria-pressed="${filter === id}">${name} <span>${count(id)}</span></button>`).join('')}</div>
      <button type="button" class="btn small" data-act="new-task">+ Nueva tarea</button></div>
    ${shown.length ? `<div class="list">${shown.map(({ t, st }) => `<button type="button" class="list-row task-row" data-act="task:${t.id}">
      <span><b>${esc(t.title)}</b> ${STATE_PILL[st.state]}<small>${esc(taskSubtitle(t, t.parts?.all || Object.values(t.parts || {})[0]))}</small>
      <small>${dueText(t, d.day)} · ${st.done.length} hechas · ${st.started.length} en curso · ${st.notStarted.length} sin empezar</small>${meter(st.ratio, st.state)}</span><span class="chev">›</span></button>`).join('')}</div>`
      : `<p class="empty">${ctx.tasks.length ? 'No hay tareas en este filtro.' : 'Crea la primera tarea: elige una obra (o unos compases), el modo de ensayo y la fecha límite.'}</p>`}`;
}

// Ficha de una tarea
export function taskDetail(ctx, task) {
  const d = derive(ctx);
  const st = d.statusOf(task);
  const value = p => (task.passage ? p.passageBest || 0 : p.bestAccuracy || 0);
  const ranked = st.rows.filter(r => r.p).sort((a, b) => value(b.p) - value(a.p));
  return `<p class="eyebrow">${dueText(task, d.day)}</p><h2>${esc(task.title)}</h2>
    <p class="muted small">${esc(taskSubtitle(task, task.parts?.all || Object.values(task.parts || {})[0]))}</p>
    ${task.notes ? `<p class="small">${esc(task.notes)}</p>` : ''}
    <div class="tiles">${statTile({ label: 'Hechas', value: `${st.done.length}/${st.total}` })}${statTile({ label: 'En curso', value: st.started.length })}
      ${statTile({ label: 'Sin empezar', value: st.notStarted.length })}${statTile({ label: task.passage ? 'Tempo medio' : 'Acierto medio', value: st.avgAccuracy === null ? '—' : pct(task.passage ? ranked.reduce((s, r) => s + value(r.p), 0) / Math.max(1, ranked.length) : st.avgAccuracy) })}</div>
    ${meter(st.ratio, st.state)}
    ${st.notStarted.length ? `<div class="callout"><b>Sin empezar (${st.notStarted.length})</b><span>${st.notStarted.map(r => esc(r.member.nickname)).join(', ')}</span>
      <button type="button" class="btn small" data-act="remind:${task.id}">Recordárselo con un aviso</button></div>` : ''}
    ${ranked.length ? `<h3>${task.passage ? 'Mejor tempo conseguido' : 'Mejor acierto'} de cada músico</h3>${hbars(ranked.map(r => ({ label: r.member.nickname, sub: seatName(r.member), value: value(r.p), display: pct(value(r.p)) })), { max: 1 })}` : ''}
    <h3>Detalle y visto bueno</h3>
    <div class="table-wrap"><table class="prog-table"><thead><tr><th>Músico</th><th>Estado</th><th class="num">Mejor</th><th class="num">Intentos</th><th></th></tr></thead><tbody>
    ${st.rows.map(({ member: m, p }) => `<tr><td><b>${esc(m.nickname)}</b><br><small>${esc(seatName(m))}</small></td>
      <td>${!p ? '<span class="pill">Sin empezar</span>' : p.completed ? '<span class="pill ok">Hecha</span>' : '<span class="pill warn">En curso</span>'}${p?.stamp ? ' <span class="pill ok">Sellada</span>' : ''}</td>
      <td class="num">${p ? starsHtml(p.bestStars) : '—'}</td><td class="num">${p ? p.attempts : 0}</td>
      <td>${p ? `<button type="button" class="btn ghost small" data-act="stamp:${p.id}">${p.stamp || p.comment ? 'Editar sello' : 'Sellar'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
    <div class="row"><button type="button" class="btn ghost small" data-act="dup-task:${task.id}">Duplicar</button><button type="button" class="btn ghost small danger" data-act="del-task:${task.id}">Borrar tarea</button>
      <button type="button" class="btn ghost small" data-close>Cerrar</button></div>`;
}
