// Tabla de seguimiento de la clase (profesor): alumnos × tareas o unidades de Lenguaje, con el % escrito, color y marca;
// 7 días, última actividad, promedio de lo exigible y nota 1-10 del trimestre. Con teclado es UNA parada de tabulador:
// dentro se mueve con las flechas (Inicio/Fin, Intro abre), y un botón permite saltarla entera.
import { esc } from '../ui.js';
import { instrumentById } from '../instruments.js';
import { filterRows, unitColumns, pctBand, FILTERS } from '../aula.js';
import { termOf, termReport, gradeWord } from '../aula-report.js';
import { pctCell, pctNum, dueLabel, LEGEND, fmtShort } from './aula-ui.js';

const FILTER_NAME = { all: 'Todos', inactive: 'Sin practicar esta semana', overdue: 'Con tareas vencidas', below: 'Por debajo del mínimo' };

const unitTitle = (tree, key) => {
  const [, l, u] = /^l(\d+)u(\d+)$/.exec(key);
  const unit = ((tree.find(x => x.level === Number(l)) || {}).units || []).find(x => x.unit === Number(u));
  return { short: `N${l} · U${u}`, long: unit ? unit.title : '' };
};

function rowHtml(r, { useUnits, units, tasks, today, term }) {
  const unitCells = () => units.map(k => {
    const raw = r.summary && r.summary.units ? r.summary.units[k] : undefined;
    if (raw === undefined) return '<td class="aula-cell none"><b>—</b></td>';
    const p = pctNum(raw);
    return `<td class="aula-cell ${pctBand(p)}"><b>${p} %</b></td>`;
  }).join('');
  const taskCells = () => r.cells.map((c, i) => pctCell(c, { label: `${r.nickname} · ${tasks[i].title}` })).join('');
  const rep = termReport({ summary: r.summary, tasks, uid: r.id, term, today });
  const grade = rep.overall === null ? '—' : String(Math.round(rep.overall));
  const avg = r.avg === null ? null : pctNum(r.avg);
  return `<tr><th scope="row" class="aula-name-col"><button type="button" class="aula-student-btn" tabindex="-1" data-student="${esc(r.id)}"><b>${esc(r.nickname)}</b><small><span>${esc(instrumentById(r.instrument).name)}</span>${r.streak ? ` · <span aria-label="${esc(`Racha: ${r.streak}`)}">🔥 ${Number(r.streak) || 0}</span>` : ''}</small></button></th>
    <td class="aula-min${r.inactive ? ' zero' : ''}">${esc(r.inactive ? 'Sin práctica' : `${Number(r.week) || 0} min`)}</td>
    <td class="aula-last">${esc(r.lastAt ? fmtShort(r.lastAt) : '—')}</td>
    ${useUnits ? unitCells() : taskCells()}
    ${useUnits ? '' : `<td class="aula-cell ${avg === null ? 'none' : pctBand(avg)}"><b>${avg === null ? '—' : `${avg} %`}</b>${r.pending ? `<small>${esc(`${r.pending} sin vencer`)}</small>` : ''}</td>`}
    <td class="aula-grade" title="${esc(rep.overall === null ? '' : gradeWord(Math.round(rep.overall)))}"><b>${esc(grade)}</b></td></tr>`;
}

export function trackingHtml({ ctx, rows, counts, today }) {
  const { tasks, summaries } = ctx.data;
  const term = termOf(new Date());
  const shown = filterRows(rows, ctx.filter, ctx.sort);
  const units = unitColumns(summaries);
  const useUnits = ctx.cols === 'units';
  const chips = FILTERS.map(f => `<button type="button" class="chip-btn" data-filter="${f}" aria-pressed="${ctx.filter === f}">${esc(FILTER_NAME[f])} <span class="count">${counts[f]}</span></button>`).join('');
  const heads = useUnits ? units.map(k => { const u = unitTitle(ctx.lm.tree, k); return `<th scope="col" title="${esc(u.long)}"><span>${esc(u.short)}</span>${u.long ? `<small>${esc(u.long)}</small>` : ''}</th>`; }).join('')
    : tasks.map(tk => `<th scope="col"><button type="button" class="aula-th-btn" tabindex="-1" data-task="${esc(tk.id)}"><span>${esc(tk.title)}</span><small>${esc(dueLabel(tk, today))}</small></button></th>`).join('');
  const empty = useUnits ? !units.length : !tasks.length;
  return `<h2>${esc('Seguimiento')}</h2>
    <div class="aula-filters" role="group" aria-label="${esc('Filtrar alumnos')}">${chips}</div>
    <div class="row aula-view-opts"><div class="seg" role="group" aria-label="${esc('Columnas')}"><button type="button" data-cols="tasks" aria-pressed="${!useUnits}">${esc('Tareas')}</button><button type="button" data-cols="units" aria-pressed="${useUnits}">${esc('Unidades de Lenguaje')}</button></div>
      <span class="aula-sort"><label class="small" for="aulaSort">${esc('Ordenar')}</label><select id="aulaSort" class="select small"><option value="name" ${ctx.sort === 'name' ? 'selected' : ''}>${esc('Por nombre')}</option><option value="attention" ${ctx.sort === 'attention' ? 'selected' : ''}>${esc('Primero quien necesita ayuda')}</option></select></span></div>
    ${empty ? `<p class="aula-empty">${esc(useUnits ? 'Aún nadie ha hecho ejercicios de Lenguaje Musical.' : 'Pon la primera tarea para ver aquí el progreso de cada alumno.')}</p>` : ''}
    ${shown.length ? `<button type="button" class="btn ghost small aula-skip" id="aulaSkipTable">${esc('Saltar la tabla')}</button>
      <p class="sr-only" id="aulaGridHelp">${esc('Muévete por la tabla con las flechas. Intro abre el alumno o la entrega.')}</p>
      <div class="table-wrap aula-table-wrap" role="region" aria-label="${esc('Tabla de seguimiento')}"><table class="aula-table" id="aulaGrid" aria-describedby="aulaGridHelp">
      <caption class="sr-only">${esc(useUnits ? '% de cada alumno en las unidades de Lenguaje Musical' : '% de cada alumno en cada tarea')}</caption>
      <thead><tr><th scope="col" class="aula-name-col">${esc('Alumno')}</th><th scope="col">${esc('7 días')}</th><th scope="col">${esc('Última actividad')}</th>${heads}${useUnits ? '' : `<th scope="col">${esc('Promedio')}</th>`}<th scope="col" title="${esc('Nota del trimestre, de 1 a 10')}">${esc('Nota')}</th></tr></thead>
      <tbody>${shown.map(r => rowHtml(r, { useUnits, units, tasks, today, term })).join('')}</tbody></table></div>${LEGEND}
      <p class="muted small">${esc('El promedio solo cuenta lo exigible: no baja por tareas sin empezar que aún no han vencido. Los datos los registra la app de cada alumno al practicar.')}</p>`
      : `<p class="aula-empty">${esc('Ningún alumno cumple este filtro.')}</p>`}`;
}

// Navegación con flechas: una sola parada de tabulador (la celda activa) en toda la tabla
export function bindGrid(box, { onSkip }) {
  const grid = box.querySelector('#aulaGrid');
  if (!grid) return;
  const rows = [...grid.rows];
  const target = cell => cell.querySelector('button') || cell;
  rows.forEach(tr => [...tr.cells].forEach(cell => { const t = target(cell); t.tabIndex = -1; }));
  const first = grid.querySelector('tbody [data-student]');
  if (first) first.tabIndex = 0;
  let current = first;
  const move = (r, c) => {
    const row = rows[Math.max(0, Math.min(rows.length - 1, r))];
    const cell = row.cells[Math.max(0, Math.min(row.cells.length - 1, c))];
    const next = target(cell);
    if (current) current.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
    current = next;
  };
  grid.addEventListener('keydown', e => {
    const cell = e.target.closest('td, th');
    if (!cell) return;
    const r = rows.indexOf(cell.parentElement), c = cell.cellIndex;
    const keys = { ArrowUp: [r - 1, c], ArrowDown: [r + 1, c], ArrowLeft: [r, c - 1], ArrowRight: [r, c + 1], Home: [r, 0], End: [r, rows[r].cells.length - 1] };
    if (!keys[e.key]) return;
    e.preventDefault();
    move(...keys[e.key]);
  });
  grid.addEventListener('focusin', e => { const cell = e.target.closest('td, th'); if (cell && e.target !== current) { if (current) current.tabIndex = -1; current = target(cell); current.tabIndex = 0; } });
  box.querySelector('#aulaSkipTable')?.addEventListener('click', onSkip);
}
