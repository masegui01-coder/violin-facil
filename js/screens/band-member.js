// Vista del músico (y del jefe de cuerda): avisos, próximo concierto, tareas con el visto bueno del director, premios y su sección.
import { $, esc, toast } from '../ui.js';
import * as api from '../band-api.js';
import { bandStreak, sectionDuel, trafficLight, eventPrep, daysUntil, FAMILY_NAME } from '../band-stats.js';
import { instrumentById } from '../instruments.js';
import { weekId } from '../engage.js';
import { getState, update, today } from '../store.js';
import { cloudErrorText } from '../cloud.js';
import { practiceTask } from './band-sync.js';
import { dueBadge, fmtDay, pct, seatName, taskSubtitle, stampHtml, lightDot, bar, ROLE_NAME } from './band-ui.js';

const NOTICES_SHOWN = 3;
const familyOf = id => instrumentById(id).family;

function myStatus(p) {
  if (!p) return '<span class="pill">Pendiente</span>';
  if (p.completed) return '<span class="pill ok">Hecha ✓</span>';
  if (p.passageBest) return `<span class="pill warn">Al ${pct(p.passageBest)}</span>`;
  return `<span class="pill warn">En curso · ${p.bestStars}★</span>`;
}

function upcoming(events) {
  const day = today();
  return events.filter(e => e.date >= day).sort((a, b) => a.date.localeCompare(b.date));
}

function eventCard(event, tasks, me, progress) {
  const left = daysUntil(event.date, today());
  const prep = eventPrep(event, tasks, [me], progress, api.assignedTo);
  return `<div class="event"><div><small>${event.kind === 'concierto' ? 'Próximo concierto' : 'Próximo ensayo'}</small><b>${esc(event.title)}</b>
      <small>${fmtDay(event.date)}${event.place ? ' · ' + esc(event.place) : ''}</small></div>
    <div class="event-count"><b>${left === 0 ? 'Hoy' : left}</b>${left === 0 ? '' : `<small>${left === 1 ? 'día' : 'días'}</small>`}</div>
    ${prep !== null ? `<div class="event-prep"><small>Tu preparación: ${pct(prep)}</small>${bar(prep)}</div>` : ''}</div>`;
}

function sectionPanel(ctx, me) {
  const mates = ctx.members.filter(m => m.role !== 'director' && m.instrument === me.instrument);
  const day = today();
  return `<h2>Mi sección · ${esc(instrumentById(me.instrument).name)}</h2>
    <div class="table-wrap"><table class="prog-table"><thead><tr><th>Músico</th><th>Estado</th><th class="num">Hechas</th></tr></thead><tbody>
    ${mates.map(m => `<tr><td>${lightDot(trafficLight(m, day))} <b>${esc(m.nickname)}</b><br><small>${esc(seatName(m))}</small></td>
      <td>${m.lastPractice ? 'Último ensayo ' + fmtDay(m.lastPractice) : 'Sin ensayar'}</td>
      <td class="num">${ctx.progress.filter(p => p.uid === m.id && p.completed).length}</td></tr>`).join('')}</tbody></table></div>`;
}

export function memberView(ctx) {
  const b = ctx.band;
  const meDoc = ctx.members.find(m => m.id === b.uid) || {};
  const me = { uid: b.uid, id: b.uid, instrument: b.instrument, voice: b.voice || null };
  const musicians = ctx.members.filter(m => m.role !== 'director');
  const mine = ctx.tasks.filter(t => api.assignedTo(t, me));
  const myProgress = ctx.progress.filter(p => p.uid === b.uid);
  const pOf = t => myProgress.find(p => p.taskId === t.id);
  const day = today();
  const star = ctx.bandDoc?.weekStar?.week === weekId() ? ctx.bandDoc.weekStar : null;
  const next = upcoming(ctx.events)[0];
  const points = meDoc.points || 0;
  const duel = sectionDuel(musicians, day, familyOf).slice(0, 4);
  const notices = [...ctx.notices].sort((x, y) => api.millis(y.at) - api.millis(x.at)).slice(0, NOTICES_SHOWN);

  return `<div class="band-hero"><p class="eyebrow">Mi banda${b.role === 'leader' ? ' · ' + ROLE_NAME.leader : ''}</p><h1>${esc(b.name)}</h1>
      <p>${esc(b.nickname)} · ${esc(seatName(me))}</p>
      <label class="voice-pick">Mi voz <select id="myVoice" class="select small">${['', 1, 2, 3, 4].map(v => `<option value="${v}" ${String(v) === String(me.voice || '') ? 'selected' : ''}>${v ? v + 'º' : 'Única'}</option>`).join('')}</select></label></div>
    ${star ? `<div class="week-star"><small>Músico de la semana</small><b>${esc(star.nickname)}</b>${star.note ? `<span>${esc(star.note)}</span>` : ''}</div>` : ''}
    ${notices.map(n => `<div class="notice"><small>Aviso del director</small><span>${esc(n.text)}</span></div>`).join('')}
    ${next ? eventCard(next, ctx.tasks, me, myProgress) : ''}
    <div class="stats"><div class="stat"><b>${mine.filter(t => pOf(t)?.completed).length}/${mine.length}</b><span>tareas hechas</span></div>
      <div class="stat"><b>${Math.round(myProgress.reduce((s, p) => s + (p.minutes || 0), 0))}</b><span>minutos en tareas</span></div>
      <div class="stat"><b>${bandStreak(musicians, day)}</b><span>días de racha de banda</span></div></div>
    <h2>Tareas</h2>
    ${mine.length ? mine.map(t => {
      const p = pOf(t);
      return `<div class="task"><div class="task-head"><div><b>${esc(t.title)}</b><br><small>${esc(taskSubtitle(t, api.taskPartFor(t, me)))}</small></div>${myStatus(p)}</div>
        ${t.notes ? `<p class="small">${esc(t.notes)}</p>` : ''}${stampHtml(p)}
        <div class="row spread">${dueBadge(t)}<button type="button" class="btn small" data-practice="${t.id}">Ensayar</button></div></div>`;
    }).join('') : '<p class="empty">Tu director todavía no ha puesto tareas.</p>'}
    ${ctx.rewards.length ? `<h2>Premios de la banda</h2><p class="muted small">Tienes ${points} puntos desde que entraste en la banda.</p>
      ${[...ctx.rewards].sort((x, y) => x.points - y.points).map(r => `<div class="reward ${points >= r.points ? 'won' : ''}"><div><b>${esc(r.title)}</b><small>${points >= r.points ? '¡Conseguido! Díselo a tu director' : `${r.points - points} puntos más`}</small></div>${bar(points / r.points)}</div>`).join('')}` : ''}
    ${duel.length > 1 ? `<h2>Duelo de secciones</h2><p class="muted small">Minutos por músico en los últimos 7 días.</p>
      ${duel.map((g, i) => `<div class="duel-row"><span>${i + 1}. ${FAMILY_NAME[g.family] || g.family}</span>${bar(g.perMusician / Math.max(1, duel[0].perMusician))}<b>${Math.round(g.perMusician)}</b></div>`).join('')}` : ''}
    ${b.role === 'leader' ? sectionPanel(ctx, me) : ''}
    <button type="button" class="btn ghost small" id="leaveBand">Salir de la banda en este móvil</button>`;
}

export function bindMember(ctx, reload) {
  const b = ctx.band;
  const me = { uid: b.uid, id: b.uid, instrument: b.instrument, voice: b.voice || null };
  $('bandBody').querySelectorAll('[data-practice]').forEach(btn => btn.addEventListener('click', () => {
    const task = ctx.tasks.find(t => t.id === btn.dataset.practice);
    practiceTask(task, me, ctx.progress.find(p => p.taskId === task.id && p.uid === b.uid));
  }));
  $('myVoice').addEventListener('change', async e => {
    const voice = e.target.value ? Number(e.target.value) : null;
    try {
      await api.updateMyMember(b, { voice });
      update({ band: { ...getState().band, voice } });
      toast('Voz guardada');
      reload();
    } catch (err) { toast(cloudErrorText(err)); }
  });
  $('leaveBand').addEventListener('click', () => { update({ band: null }); reload(); });
}
