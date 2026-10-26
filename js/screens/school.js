// Escuela de música (premium, en pruebas): el profesor ve a sus alumnos por curso con el progreso en su libro
// y los pasa de curso cada año; el alumno tiene su libro del curso y lo completa jugando, como en el modo libro.
import { $, esc, toast } from '../ui.js';
import { go } from '../router.js';
import { cloudConfigured, cloudErrorText } from '../cloud.js';
import * as api from '../school-api.js';
import { INSTRUMENTS, instrumentById } from '../instruments.js';
import { currentAccount } from '../account.js';
import { getState, update } from '../store.js';
import { schoolYear, nextSchoolYear, premiumActive, studentLimit, promote, pct, TRIAL_STUDENTS, PREMIUM_STUDENTS, MAX_LEVEL } from '../school.js';
import { BOOK_INFO } from '../books.js';
import { sheet } from './band-ui.js';

const CONTACT = 'tizaestudiogames+violin@gmail.com';
let joinCode = new URLSearchParams(location.search).get('escuela') || '';
export const schoolInviteCode = () => joinCode;

const body = html => { $('schoolBody').innerHTML = html; };
const accountName = () => String((currentAccount() && currentAccount().displayName) || '').slice(0, 30);
const instOptions = sel => INSTRUMENTS.map(i => `<option value="${i.id}" ${i.id === sel ? 'selected' : ''}>${esc(i.name)}</option>`).join('');
const fmtDay = ms => (ms ? new Date(ms).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—');
const showError = (id, text) => { $(id).textContent = text; $(id).hidden = false; };
const PREMIUM_NOTE = `<div class="beta-note"><b>Escuelas · premium</b><span>Para escuelas de música y conservatorios: cada alumno tiene el libro de su curso y lo completa jugando; el profesor ve el progreso de todos y los pasa de curso cada año.
  Sin licencia, la escuela funciona en modo prueba con ${TRIAL_STUDENTS} alumnos. Estamos en beta: la licencia se activa a petición.</span></div>`;

export function renderSchool() {
  if (!cloudConfigured()) { body('<p class="empty">Las escuelas necesitan conexión con el servidor.</p>'); return; }
  const s = getState().school;
  if (!s) { welcome(); return; }
  if (s.role === 'teacher') teacherView(s); else studentView(s);
}

// ---------- Sin escuela ----------
function welcome() {
  body(`${PREMIUM_NOTE}
    <form class="panel form" id="schoolJoinForm"><h2>Soy alumno</h2>
      <label for="sJoinCode">Código de tu escuela</label><input id="sJoinCode" class="input" maxlength="6" autocomplete="off" placeholder="Ej.: K7P2QX" value="${esc(joinCode)}" style="text-transform:uppercase">
      <label for="sJoinNick">Tu nombre</label><input id="sJoinNick" class="input" maxlength="30" value="${esc(accountName())}">
      <label for="sJoinInst">Tu instrumento</label><select id="sJoinInst" class="select">${instOptions(getState().instrument)}</select>
      <p class="muted small">Tu profesor verá tu progreso en el libro de tu curso.</p>
      <button class="btn" type="submit">Entrar en mi escuela</button><p id="sJoinError" class="warn" hidden></p></form>
    <form class="panel form" id="schoolCreateForm"><h2>Soy profesor</h2>
      <label for="sName">Nombre de la escuela</label><input id="sName" class="input" maxlength="80" placeholder="Ej.: Escuela de Música de…">
      <label for="sOwner">Tu nombre</label><input id="sOwner" class="input" maxlength="30" value="${esc(accountName())}">
      <button class="btn ghost" type="submit">Crear mi escuela</button><p id="sCreateError" class="warn" hidden></p></form>`);
  $('schoolJoinForm').addEventListener('submit', async e => {
    e.preventDefault();
    const code = $('sJoinCode').value.trim().toUpperCase();
    const nick = $('sJoinNick').value.trim();
    const instrument = $('sJoinInst').value;
    if (code.length !== 6 || !nick) { showError('sJoinError', 'Escribe el código de 6 caracteres y tu nombre.'); return; }
    try {
      const joined = await api.joinSchool(code, nick, instrument);
      joinCode = '';
      update({ school: { ...joined, nickname: nick, instrument, year: schoolYear() }, instrument });
      toast(`Te has unido a ${joined.name}`);
      renderSchool();
    } catch (err) { showError('sJoinError', cloudErrorText(err)); }
  });
  $('schoolCreateForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('sName').value.trim();
    const owner = $('sOwner').value.trim();
    if (!name || !owner) { showError('sCreateError', 'Escribe el nombre de la escuela y el tuyo.'); return; }
    try {
      const created = await api.createSchool(name, owner);
      update({ school: { ...created, year: schoolYear() } });
      renderSchool();
    } catch (err) { showError('sCreateError', cloudErrorText(err)); }
  });
}

function forget() {
  update({ school: null });
  renderSchool();
}

function errorView(err) {
  body(`<div class="panel"><h2>No he podido abrir la escuela</h2><p class="warn">${esc(cloudErrorText(err))}</p>
    <div class="row"><button type="button" class="btn small" id="sRetry">Reintentar</button><button type="button" class="btn ghost small" id="sForget">Quitar la escuela de este móvil</button></div></div>`);
  $('sRetry').addEventListener('click', renderSchool);
  $('sForget').addEventListener('click', forget);
}

// ---------- Alumno ----------
async function studentView(s) {
  body('<p class="empty">Cargando tu escuela…</p>');
  try {
    const [school, me] = await Promise.all([api.getSchool(s.schoolId), api.getMyMember(s.schoolId)]);
    if (!school || !me) { body('<div class="panel"><h2>Ya no estás en esta escuela</h2><p class="muted">Tu profesor te ha dado de baja o la escuela ya no existe.</p><button type="button" class="btn small" id="sForget">Entendido</button></div>'); $('sForget').addEventListener('click', forget); return; }
    if (me.level !== s.level || school.year !== s.year) update({ school: { ...getState().school, level: me.level, year: school.year, name: school.name } });
    const { library } = await import('./book.js');
    const { bookSummary } = await import('../school.js');
    const plays = (getState().bookPlays || {})[getState().instrument] || {};
    const book = library()[me.level - 1];
    const sum = bookSummary(book, plays);
    const info = BOOK_INFO[me.level - 1];
    body(`<div class="band-hero"><p class="eyebrow">Mi escuela · curso ${esc(school.year)}</p><h1>${esc(school.name)}</h1><p>${esc(me.nickname)} · ${esc(instrumentById(me.instrument).name)} · ${me.level}.º curso</p></div>
      <div class="panel school-book"><p class="eyebrow">Tu libro de este curso</p><h2>${esc(info.title)}</h2><p class="muted small">${esc(info.sub)}</p>
        <span class="prog-bar"><i style="width:${pct(sum.done, sum.total)}%"></i></span>
        <p class="small">${sum.done} de ${sum.total} páginas · 🥇 ${sum.gold} · examen ${sum.examPassed ? 'aprobado ✓' : 'pendiente'}</p>
        <button type="button" class="btn" id="sOpenBook">Abrir mi libro</button></div>
      <p class="muted small">Cada curso tienes un libro. Cuando apruebes su examen, tu profesor te pasará al siguiente al empezar el nuevo curso. Puedes repasar los libros anteriores cuando quieras.</p>
      <button type="button" class="btn ghost small" id="sLeave">Salir de la escuela</button>`);
    $('sOpenBook').addEventListener('click', () => {
      const st = getState();
      update({ learnView: 'book', instrument: me.instrument, bookShelf: { ...(st.bookShelf || {}), [me.instrument]: me.level } });
      go('learn');
    });
    $('sLeave').addEventListener('click', async e => {
      if (!e.target.dataset.confirm) { e.target.dataset.confirm = '1'; e.target.textContent = '¿Seguro? Toca otra vez'; return; }
      await api.leaveSchool(s.schoolId).catch(() => {});
      forget();
    });
  } catch (err) { errorView(err); }
}

// ---------- Profesor ----------
function studentRow(st) {
  const p = st.progress;
  return `<button type="button" class="list-row school-row" data-student="${esc(st.id)}"><span><b>${esc(st.nickname)}</b><small>${esc(instrumentById(st.instrument).name)} · último uso ${fmtDay(p && p.last)}</small></span>
    <span class="school-prog"><span class="prog-bar"><i style="width:${p ? pct(p.done, p.total) : 0}%"></i></span><small>${p ? `${p.done}/${p.total} · 🥇 ${p.gold}` : 'Sin empezar'}${p && p.examPassed ? ' · examen ✓' : ''}</small></span></button>`;
}

function csv(students) {
  const cell = v => { const t = String(v ?? ''); const safe = /^[=+\-@\t]/.test(t) ? "'" + t : t; return /[;"\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe; };
  const head = ['Alumno', 'Instrumento', 'Curso', 'Páginas', 'Total', 'Oros', 'Examen', 'Último uso'];
  const rows = students.map(s => [s.nickname, instrumentById(s.instrument).name, s.level, s.progress ? s.progress.done : 0, s.progress ? s.progress.total : '', s.progress ? s.progress.gold : 0, s.progress && s.progress.examPassed ? 'Aprobado' : '', fmtDay(s.progress && s.progress.last)]);
  return [head, ...rows].map(r => r.map(cell).join(';')).join('\r\n');
}

async function teacherView(s) {
  body('<p class="empty">Cargando tu escuela…</p>');
  try {
    const [school, students] = await Promise.all([api.getSchool(s.schoolId), api.listStudents(s.schoolId)]);
    if (!school) { errorView(new Error('Esta escuela ya no existe.')); return; }
    const premium = premiumActive(school);
    const limit = studentLimit(school);
    const link = `${location.origin}${location.pathname}?escuela=${school.code}`;
    const current = schoolYear();
    body(`<div class="band-hero"><p class="eyebrow">Escuela · curso ${esc(school.year)}</p><h1>${esc(school.name)}</h1>
        <p>${premium ? `<span class="pill ok">Premium hasta ${fmtDay(Date.parse(school.premium.until))}</span>` : `<span class="pill warn">Modo prueba</span>`} · ${students.length} de ${limit} alumnos</p>
        <div class="row"><button type="button" class="btn small" id="sInvite">Invitar alumnos</button><span class="muted small">Código <b>${esc(school.code)}</b></span></div></div>
      ${premium ? '' : `<div class="panel"><b>Licencia de escuela</b><span class="muted small">Hasta ${PREMIUM_STUDENTS} alumnos y todo el seguimiento. Estamos en beta: escríbenos y la activamos para tu escuela.</span>
        <a class="btn ghost small" href="mailto:${CONTACT}?subject=${encodeURIComponent('Licencia de escuela: ' + school.name)}">Pedir la licencia</a></div>`}
      ${school.year !== current ? `<div class="panel"><b>Empieza el curso ${esc(current)}</b><span class="muted small">Pasa de curso a los alumnos que aprobaron el examen de su libro.</span><button type="button" class="btn small" id="sNewYear">Empezar el curso ${esc(current)}</button></div>` : ''}
      ${[1, 2, 3].map(level => {
        const list = students.filter(st => st.level === level);
        return `<h2>${level}.º curso · ${esc(BOOK_INFO[level - 1].title)}</h2>${list.length ? `<div class="list">${list.map(studentRow).join('')}</div>` : '<p class="muted small">Ningún alumno en este curso.</p>'}
          <button type="button" class="text-link" data-preview="${level}">Ver el ${esc(BOOK_INFO[level - 1].title)}</button>`;
      }).join('')}
      <div class="row"><button type="button" class="btn ghost small" id="sCsv">Descargar progreso (CSV)</button>
        ${school.year === current ? `<button type="button" class="btn ghost small" id="sNewYear">Pasar de curso (${esc(nextSchoolYear(school.year))})</button>` : ''}</div>
      <p class="muted small">Cada alumno ve solo el libro de su curso y los anteriores. Al empezar el curso siguiente, quien aprobó el examen pasa al libro siguiente; puedes cambiar el curso de cualquier alumno tocando su nombre.</p>`);
    $('sInvite').addEventListener('click', async () => {
      const text = `Únete a «${school.name}» en Band Flow: ${link} (código ${school.code})`;
      try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Invitación copiada'); } } catch (e) { /* cancelado */ }
    });
    $('schoolBody').querySelectorAll('[data-preview]').forEach(b => b.addEventListener('click', () => {
      const st = getState();
      update({ learnView: 'book', bookShelf: { ...(st.bookShelf || {}), [st.instrument]: Number(b.dataset.preview) } });
      toast('Cambia de instrumento arriba para ver el libro de cada uno');
      go('learn');
    }));
    $('schoolBody').querySelectorAll('[data-student]').forEach(b => b.addEventListener('click', () => editStudent(school, students.find(x => x.id === b.dataset.student))));
    $('sCsv').addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob(['﻿' + csv(students)], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${school.name.replace(/[^\w-]+/g, '-')}-${school.year}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const newYear = $('sNewYear');
    if (newYear) newYear.addEventListener('click', () => confirmNewYear(school, students));
  } catch (err) { errorView(err); }
}

function editStudent(school, st) {
  sheet(`<h2>${esc(st.nickname)}</h2><p class="muted small">${st.progress ? `${st.progress.done} de ${st.progress.total} páginas del Libro ${st.progress.book}` : 'Todavía no ha empezado su libro'}</p>
    <label for="sLevel">Curso</label><select id="sLevel" class="select">${[1, 2, 3].map(l => `<option value="${l}" ${l === st.level ? 'selected' : ''}>${l}.º · ${esc(BOOK_INFO[l - 1].title)}</option>`).join('')}</select>
    <label for="sInst">Instrumento</label><select id="sInst" class="select">${instOptions(st.instrument)}</select>
    <div class="row"><button type="button" class="btn" id="sSave">Guardar</button><button type="button" class="btn ghost small danger" id="sRemove">Dar de baja</button><button type="button" class="btn ghost small" data-close>Cerrar</button></div>`, box => {
    box.querySelector('#sSave').addEventListener('click', async () => {
      try {
        await api.updateStudent(school.id, st.id, { level: Number($('sLevel').value), instrument: $('sInst').value });
        $('sheet').close();
        renderSchool();
      } catch (err) { toast(cloudErrorText(err)); }
    });
    box.querySelector('#sRemove').addEventListener('click', async e => {
      if (!e.target.dataset.confirm) { e.target.dataset.confirm = '1'; e.target.textContent = '¿Seguro?'; return; }
      try { await api.removeStudent(school.id, st.id); $('sheet').close(); renderSchool(); } catch (err) { toast(cloudErrorText(err)); }
    });
  });
}

function confirmNewYear(school, students) {
  const year = school.year === schoolYear() ? nextSchoolYear(school.year) : schoolYear();
  const levels = Object.fromEntries(students.map(st => [st.id, promote(st.level, st.progress)]));
  const up = students.filter(st => levels[st.id] > st.level);
  sheet(`<h2>Empezar el curso ${esc(year)}</h2>
    <p>${up.length ? `Pasan de curso (aprobaron su examen): ${up.map(st => esc(st.nickname)).join(', ')}.` : 'Nadie ha aprobado todavía el examen de su libro: todos se quedan en su curso.'}</p>
    <p class="muted small">Los demás repiten curso con su libro. Después puedes cambiar el curso de cualquier alumno a mano. Máximo: ${MAX_LEVEL}.º curso.</p>
    <div class="row"><button type="button" class="btn" id="sYearOk">Empezar el curso</button><button type="button" class="btn ghost small" data-close>Cancelar</button></div>`, box => {
    box.querySelector('#sYearOk').addEventListener('click', async () => {
      try {
        await api.startNewYear(school.id, year, levels);
        $('sheet').close();
        toast(`Curso ${year} en marcha`);
        renderSchool();
      } catch (err) { toast(cloudErrorText(err)); }
    });
  });
}
