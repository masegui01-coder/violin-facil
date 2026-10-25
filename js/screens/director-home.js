// Inicio del panel del director: cifras de la semana, actividad diaria, qué atender hoy, próximo concierto y tareas.
import { esc } from '../ui.js';
import { trafficLight, bandStreak, sectionDuel, eventPrep, daysUntil, weekStarSuggestion, dailySeries, weekCompare, FAMILY_NAME } from '../band-stats.js';
import { instrumentById } from '../instruments.js';
import { weekId } from '../engage.js';
import * as api from '../band-api.js';
import { columns, hbars, statTile } from '../charts.js';
import { fmtDay, lightDot, seatName, pct } from './band-ui.js';
import { derive, shortDay, meter, dueText, section } from './director-common.js';

const ATTENTION_MAX = 5;
const DAYS_CHART = 14;
const familyOf = id => instrumentById(id).family;

function tiles(ctx, d) {
  const w = weekCompare(d.musicians, d.day);
  const statuses = ctx.tasks.map(d.statusOf);
  const pairs = statuses.reduce((s, st) => s + st.total, 0);
  const done = statuses.reduce((s, st) => s + st.done.length, 0);
  return `<div class="tiles">
    ${statTile({ label: 'Activos esta semana', value: `${w.now.active}/${d.musicians.length}`, delta: w.activeChange ? `${w.activeChange > 0 ? '+' : ''}${w.activeChange} vs semana anterior` : 'igual que la semana anterior', good: w.activeChange > 0 ? true : w.activeChange < 0 ? false : null })}
    ${statTile({ label: 'Minutos de práctica', value: w.now.minutes, delta: w.minutesChange === null ? 'últimos 7 días' : `${w.minutesChange > 0 ? '+' : ''}${w.minutesChange} % vs semana anterior`, good: w.minutesChange === null || w.minutesChange === 0 ? null : w.minutesChange > 0 })}
    ${statTile({ label: 'Tareas completadas', value: pairs ? pct(done / pairs) : '—', hint: pairs ? `${done} de ${pairs} entregas` : 'Aún no hay tareas' })}
    ${statTile({ label: 'Racha de banda', value: `${bandStreak(d.musicians, d.day)} días`, hint: 'con 7 de cada 10 practicando' })}
  </div>`;
}

function activity(d) {
  const series = dailySeries(d.musicians, d.day, DAYS_CHART);
  const chart = columns(series.map((s, i) => ({
    label: String(Number(s.day.slice(8))), value: s.minutes, strong: i === series.length - 1,
    tip: `${shortDay(s.day)}: ${s.minutes} min · ${s.active} ${s.active === 1 ? 'músico' : 'músicos'}`,
  })), { unit: 'min', title: 'Minutos de práctica de la banda por día', xLabels: [0, 7, DAYS_CHART - 1] });
  return section('Práctica de la banda', `<p class="muted small">Minutos al día, últimas dos semanas. Toca una barra para ver el detalle.</p>${chart}`);
}

function attention(d) {
  const risky = d.musicians.map(m => ({ m, light: trafficLight(m, d.day) })).filter(x => x.light !== 'green')
    .sort((a, b) => (a.light === 'red' ? 0 : 1) - (b.light === 'red' ? 0 : 1)).slice(0, ATTENTION_MAX);
  if (!d.musicians.length) return section('Para atender hoy', '<p class="empty">Todavía no hay músicos. Invítalos con el código de la banda (en «Más»).</p>');
  if (!risky.length) return section('Para atender hoy', '<p class="good-news">¡Toda la banda ha practicado en los dos últimos días!</p>');
  return section('Para atender hoy', `<div class="list">${risky.map(({ m, light }) => `<button type="button" class="list-row" data-act="member:${m.id}">${lightDot(light)}
      <span><b>${esc(m.nickname)}</b><small>${esc(seatName(m))} · ${m.lastPractice ? 'último ensayo ' + fmtDay(m.lastPractice) : 'aún no ha ensayado'}</small></span><span class="chev">›</span></button>`).join('')}</div>`,
  '<button type="button" class="text-link" data-act="nav:musicos">Ver todos</button>');
}

function nextEvent(ctx, d) {
  const next = ctx.events.filter(e => e.date >= d.day).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!next) return section('Próximo concierto', '<p class="muted">Añade conciertos y ensayos en Agenda y verás aquí cuánto le falta a la banda para llegar preparada.</p>', '<button type="button" class="text-link" data-act="nav:agenda">Abrir agenda</button>');
  const prep = eventPrep(next, ctx.tasks, d.musicians, ctx.progress, api.assignedTo);
  const left = daysUntil(next.date, d.day);
  return section(next.kind === 'concierto' ? 'Próximo concierto' : 'Próximo ensayo', `<div class="event-big"><div><b>${esc(next.title)}</b><small>${fmtDay(next.date)}${next.place ? ' · ' + esc(next.place) : ''}</small></div>
      <div class="countdown-box"><b>${left || 'Hoy'}</b>${left ? `<small>${left === 1 ? 'día' : 'días'}</small>` : ''}</div></div>
    ${prep === null ? '<p class="muted small">Vincula sus obras en Agenda para medir la preparación.</p>' : `<div class="prep"><span>Preparación de la banda</span><b>${pct(prep)}</b></div>${meter(prep, prep >= 0.8 ? 'done' : 'open')}`}`,
  '<button type="button" class="text-link" data-act="nav:agenda">Agenda</button>');
}

function tasksNow(ctx, d) {
  const open = ctx.tasks.map(t => ({ t, st: d.statusOf(t) })).filter(x => x.st.state !== 'done')
    .sort((a, b) => (a.t.due || '9999').localeCompare(b.t.due || '9999')).slice(0, 4);
  const body = open.length ? `<div class="list">${open.map(({ t, st }) => `<button type="button" class="list-row task-row" data-act="task:${t.id}">
      <span><b>${esc(t.title)}</b><small>${dueText(t, d.day)} · ${st.done.length} de ${st.total} la tienen</small>${meter(st.ratio, st.state)}</span><span class="chev">›</span></button>`).join('')}</div>`
    : '<p class="muted">No hay tareas pendientes. Pon la siguiente obra para que la banda la prepare.</p>';
  return section('Tareas en curso', body, '<button type="button" class="btn small" data-act="new-task">+ Nueva tarea</button>');
}

function sections(d) {
  const duel = sectionDuel(d.musicians, d.day, familyOf);
  if (duel.length < 2) return '';
  return section('Secciones esta semana', `<p class="muted small">Minutos por músico en los últimos 7 días (justo aunque las secciones sean de distinto tamaño).</p>
    ${hbars(duel.map(g => ({ label: FAMILY_NAME[g.family] || g.family, sub: `${g.count} ${g.count === 1 ? 'músico' : 'músicos'}`, value: g.perMusician, display: `${Math.round(g.perMusician)} min` })))}`);
}

function weekStar(ctx, d) {
  const star = ctx.bandDoc?.weekStar?.week === weekId() ? ctx.bandDoc.weekStar : null;
  const suggestion = weekStarSuggestion(d.musicians, d.day);
  if (!star && !suggestion) return '';
  return section('Músico de la semana', `<div class="week-star"><small>${star ? 'Elegido esta semana · lo ve toda la banda' : `Propuesta: ${Math.round(suggestion.minutes)} min en 7 días`}</small>
      <b>${esc(star ? star.nickname : suggestion.member.nickname)}</b>${star?.note ? `<span>${esc(star.note)}</span>` : ''}</div>`,
  `<button type="button" class="btn small" data-act="star">${star ? 'Cambiar' : 'Nombrar'}</button>`);
}

export function homeView(ctx) {
  const d = derive(ctx);
  return `${tiles(ctx, d)}${attention(d)}${tasksNow(ctx, d)}${activity(d)}${nextEvent(ctx, d)}${sections(d)}${weekStar(ctx, d)}`;
}
