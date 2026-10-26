// Agenda (conciertos, ensayos y avisos) y «Más»: invitar con código y QR, premios, afinación por sección e informes.
import { esc } from '../ui.js';
import * as api from '../band-api.js';
import { eventPrep, daysUntil, sectionTuning, minutesInLast, dailySeries, weekCompare, bandStreak, trafficLight } from '../band-stats.js';
import { instrumentById } from '../instruments.js';
import { noteLabel, isBowed } from '../music.js';
import { getState } from '../store.js';
import { columns } from '../charts.js';
import { fmtDate, fmtDay, pct, seatName } from './band-ui.js';
import { derive, meter, section } from './director-common.js';
import { libraryCard } from './band-library.js';

const TUNE_OK = 5, TUNE_WARN = 12;
let tuneInst = null;
export const setTuneInst = v => { tuneInst = v; };

// ---------- Agenda ----------
function eventCard(ctx, d, e) {
  const prep = eventPrep(e, ctx.tasks, d.musicians, ctx.progress, api.assignedTo);
  const left = daysUntil(e.date, d.day);
  const linked = ctx.tasks.filter(t => (e.taskIds || []).includes(t.id));
  return `<div class="event-card ${left < 0 ? 'past' : ''}"><div class="event-big"><div><small>${e.kind === 'concierto' ? 'Concierto' : 'Ensayo'}</small><b>${esc(e.title)}</b>
      <small>${fmtDay(e.date)}${e.place ? ' · ' + esc(e.place) : ''}</small></div>${left >= 0 ? `<div class="countdown-box"><b>${left || 'Hoy'}</b>${left ? `<small>${left === 1 ? 'día' : 'días'}</small>` : ''}</div>` : ''}</div>
    ${prep === null ? '<small class="muted">Sin obras vinculadas</small>' : `<div class="prep"><span>Preparación</span><b>${pct(prep)}</b></div>${meter(prep, prep >= 0.8 ? 'done' : 'open')}
      <small class="muted">${linked.map(t => { const st = d.statusOf(t); return `${esc(t.title)} ${st.done.length}/${st.total}`; }).join(' · ')}</small>`}
    <div class="row"><button type="button" class="btn ghost small danger" data-act="del-sub:events:${e.id}">Borrar</button></div></div>`;
}

export function agendaView(ctx) {
  const d = derive(ctx);
  const events = [...ctx.events].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = events.filter(e => e.date >= d.day), past = events.filter(e => e.date < d.day).reverse();
  const notices = [...ctx.notices].sort((a, b) => api.millis(b.at) - api.millis(a.at));
  const nameOf = uid => ctx.members.find(m => m.id === uid)?.nickname || 'alguien';
  return `${section('Conciertos y ensayos', `${upcoming.length ? upcoming.map(e => eventCard(ctx, d, e)).join('') : '<p class="muted">Añade el próximo concierto: verás cuánto le falta a la banda para llegar preparada.</p>'}
      <details class="add-box"><summary class="btn small">+ Nuevo concierto o ensayo</summary>
      <form class="form" id="eventForm">
        <label for="evTitle">Título</label><input id="evTitle" class="input" maxlength="80" placeholder="Ej.: Concierto de Santa Cecilia">
        <div class="row"><div class="grow"><label for="evDate">Fecha</label><input id="evDate" class="input" type="date" min="${d.day}"></div>
          <div class="grow"><label for="evKind">Tipo</label><select id="evKind" class="select"><option value="concierto">Concierto</option><option value="ensayo">Ensayo</option></select></div></div>
        <label for="evPlace">Lugar (opcional)</label><input id="evPlace" class="input" maxlength="60">
        ${ctx.tasks.length ? `<label>Obras que hay que llevar preparadas</label><div class="member-list">${ctx.tasks.map(t => `<label class="check-chip"><input type="checkbox" value="${t.id}">${esc(t.title)}</label>`).join('')}</div>` : ''}
        <button class="btn" type="submit">Añadir a la agenda</button></form></details>
      ${past.length ? `<details><summary class="muted small">Pasados (${past.length})</summary>${past.map(e => eventCard(ctx, d, e)).join('')}</details>` : ''}`)}
    ${section('Avisos', `<form class="form" id="noticeForm"><textarea id="noticeText" maxlength="300" placeholder="Ej.: El ensayo del jueves pasa a las 20:30"></textarea>
        <div class="row spread"><small class="muted">Lo verá toda la banda al abrir su pestaña Banda.</small><button class="btn small" type="submit">Publicar</button></div></form>
      ${notices.map(n => `<div class="notice"><small>${n.at ? fmtDate(api.millis(n.at)) : ''}${n.to ? ` · para ${n.to.length === 1 ? esc(nameOf(n.to[0])) : `${n.to.length} músicos`}` : ' · toda la banda'}</small><span>${esc(n.text)}</span>
        <button type="button" class="btn ghost small danger" data-act="del-sub:notices:${n.id}">Borrar</button></div>`).join('')}`)}`;
}

// ---------- Más ----------
function invite(ctx) {
  const b = ctx.band;
  return section('Invitar a la banda', `<div class="invite"><div><small>Código de la banda</small><div class="band-code dark">${esc(b.code)}</div>
      <p class="muted small">Los músicos lo escriben en la pestaña Banda, o abren el enlace. Proyecta el QR en el ensayo y que lo escaneen.</p>
      <div class="row"><button type="button" class="btn small" data-act="share-invite">Compartir enlace</button><button type="button" class="btn ghost small" data-act="show-qr">Mostrar QR</button></div>
      <button type="button" class="text-link" data-act="rotate-code">Cambiar el código (el anterior dejará de servir)</button></div>
    <div id="qrBox" class="qr-box" hidden></div></div>`);
}

function rewards(ctx, d) {
  const list = [...ctx.rewards].sort((a, b) => a.points - b.points);
  return section('Premios', `<p class="muted small">Los músicos suman puntos practicando desde que entran. Tú decides el premio: elegir la próxima obra, un solo en el concierto…</p>
    ${list.map(r => {
      const winners = d.musicians.filter(m => (m.points || 0) >= r.points);
      return `<div class="list-row static"><span><b>${esc(r.title)}</b><small>${r.points} puntos · ${winners.length ? 'conseguido por ' + winners.map(m => esc(m.nickname)).join(', ') : 'nadie todavía'}</small></span>
        <button type="button" class="btn ghost small danger" data-act="del-sub:rewards:${r.id}">Borrar</button></div>`;
    }).join('')}
    <details class="add-box"><summary class="btn small">+ Nuevo premio</summary><form class="form" id="rewardForm">
      <label for="rwTitle">Premio</label><input id="rwTitle" class="input" maxlength="80" placeholder="Ej.: Elegir la marcha del pasacalles">
      <label for="rwPoints">Puntos necesarios</label><input id="rwPoints" class="input" type="number" min="50" step="50" value="500">
      <button class="btn" type="submit">Crear premio</button></form></details>`);
}

function tuning(ctx, d) {
  const present = [...new Set(d.musicians.filter(m => m.tuning && Object.keys(m.tuning).length).map(m => m.instrument))];
  if (!present.length) return section('Afinación por sección', '<p class="muted">Cuando los músicos ensayen verás qué notas tiende a desafinar cada sección: buen material para el calentamiento.</p>');
  if (!present.includes(tuneInst)) tuneInst = present[0];
  const rows = sectionTuning(d.musicians, tuneInst).slice(0, 12);
  const nom = getState().nom;
  const color = c => (Math.abs(c) < TUNE_OK ? 'var(--ok)' : Math.abs(c) < TUNE_WARN ? 'var(--warn)' : 'var(--bad)');
  return section('Afinación por sección', `<p class="muted small">Media de cada nota en la sección (a la derecha, alta; a la izquierda, baja). Arriba, las que más se desvían.</p>
    <select class="select" data-change="tune">${present.map(id => `<option value="${id}" ${id === tuneInst ? 'selected' : ''}>${esc(instrumentById(id).name)}</option>`).join('')}</select>
    <div class="tm-list">${rows.map(r => {
      const w = Math.min(50, Math.abs(r.mean) / 30 * 50);
      return `<div class="tm-row"><b>${esc(noteLabel({ midi: r.midi }, nom, !isBowed(tuneInst)))}</b><span class="tm-bar"><i style="left:${r.mean >= 0 ? 50 : 50 - w}%;width:${w}%;background:${color(r.mean)}"></i></span>
        <small>${r.mean > 0 ? '+' : ''}${Math.round(r.mean)} ¢ · ${r.musicians} ${r.musicians === 1 ? 'músico' : 'músicos'}</small></div>`;
    }).join('')}</div>`);
}

function reports(ctx, d) {
  const total = d.musicians.reduce((s, m) => s + minutesInLast(m, d.day, 90), 0);
  return section('Informes', `<p>${d.musicians.length} músicos · ${Math.round(total)} minutos en 90 días · ${ctx.tasks.length} tareas.</p>
    <p class="muted small">El informe para imprimir (o guardar en PDF) resume la banda y a cada músico: ideal para la junta o las familias. El CSV se abre con Excel.</p>
    <div class="row"><button type="button" class="btn small" data-act="print">Informe para imprimir</button><button type="button" class="btn ghost small" data-act="csv">Descargar CSV</button></div>`);
}

export function moreView(ctx) {
  const d = derive(ctx);
  return `${libraryCard(ctx)}${invite(ctx)}${rewards(ctx, d)}${tuning(ctx, d)}${reports(ctx, d)}`;
}

// ---------- Informe para imprimir ----------
const PRINT_CSS = `:root{--accent:#B4461F;--line:#E3DACB;--ink:#141B26;--muted:#5A6678;--ok:#16804F;--bad:#C2372F;--warn:#B47708;--surface-2:#F5EFE4}
body{font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#141B26;margin:28px}h1{font-size:24px;margin:0}h2{font-size:17px;margin:22px 0 8px}
.muted{color:#5A6678}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.kpi{border:1px solid #E3DACB;border-radius:10px;padding:10px}
.kpi b{display:block;font-size:22px}table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #E3DACB}
th{font-size:11px;text-transform:uppercase;color:#5A6678}.num{text-align:right}.chart{width:100%;max-width:640px}.ch-grid{stroke:#E3DACB}.ch-axis{font:600 10px sans-serif;fill:#5A6678}
.ch-value{font:800 11px sans-serif;fill:#141B26}.ch-bar{fill:#B4461F;opacity:.55}.ch-bar.strong{opacity:1}.dot{display:inline-block;width:9px;height:9px;border-radius:50%}
@media print{body{margin:12mm}button{display:none}}`;

export function printReport(ctx) {
  const d = derive(ctx);
  const w = weekCompare(d.musicians, d.day);
  const series = dailySeries(d.musicians, d.day, 30);
  const chart = columns(series.map((s, i) => ({ label: String(Number(s.day.slice(8))), value: s.minutes, strong: i === series.length - 1 })), { width: 640, height: 170, xLabels: [0, 15, 29] });
  const light = { green: '#16804F', amber: '#B47708', red: '#C2372F' };
  const rows = [...d.musicians].sort((a, b) => (a.instrument + a.nickname).localeCompare(b.instrument + b.nickname)).map(m => {
    const mine = ctx.tasks.filter(t => api.assignedTo(t, m));
    const done = mine.filter(t => ctx.progress.some(p => p.taskId === t.id && p.uid === m.id && p.completed)).length;
    return `<tr><td><span class="dot" style="background:${light[trafficLight(m, d.day)]}"></span> ${esc(m.nickname)}</td><td>${esc(seatName(m))}</td>
      <td class="num">${Math.round(minutesInLast(m, d.day, 7))}</td><td class="num">${Math.round(minutesInLast(m, d.day, 30))}</td><td class="num">${done}/${mine.length}</td><td>${m.lastPractice ? fmtDay(m.lastPractice) : '—'}</td></tr>`;
  }).join('');
  const tasks = ctx.tasks.map(t => { const st = d.statusOf(t); return `<tr><td>${esc(t.title)}</td><td>${t.due ? fmtDay(t.due) : '—'}</td><td class="num">${st.done.length}/${st.total}</td><td class="num">${st.avgAccuracy === null ? '—' : pct(st.avgAccuracy)}</td></tr>`; }).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe · ${esc(ctx.band.name)}</title><style>${PRINT_CSS}</style></head><body>
    <h1>${esc(ctx.band.name)}</h1><p class="muted">Informe de Band Flow · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <div class="kpis"><div class="kpi"><span class="muted">Músicos</span><b>${d.musicians.length}</b></div><div class="kpi"><span class="muted">Activos esta semana</span><b>${w.now.active}</b></div>
      <div class="kpi"><span class="muted">Minutos esta semana</span><b>${w.now.minutes}</b></div><div class="kpi"><span class="muted">Racha de banda</span><b>${bandStreak(d.musicians, d.day)} días</b></div></div>
    <h2>Minutos de práctica por día (30 días)</h2>${chart}
    <h2>Músicos</h2><table><thead><tr><th>Músico</th><th>Instrumento</th><th class="num">Min. 7 d</th><th class="num">Min. 30 d</th><th class="num">Tareas</th><th>Último ensayo</th></tr></thead><tbody>${rows}</tbody></table>
    ${tasks ? `<h2>Tareas</h2><table><thead><tr><th>Tarea</th><th>Fecha</th><th class="num">Hechas</th><th class="num">Acierto medio</th></tr></thead><tbody>${tasks}</tbody></table>` : ''}
    <p><button onclick="print()">Imprimir o guardar en PDF</button></p></body></html>`;
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
