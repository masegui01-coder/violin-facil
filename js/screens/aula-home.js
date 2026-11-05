// Aula (pestaña Pro de Aprender): el alumno ve «Mis tareas» y entra en clases con un código; el profesor con licencia
// ve sus clases y crea otras; sin licencia, la presentación del Aula y «Solicitar acceso». El acceso Pro se consulta
// SOLO en pro-access.js. La clase por dentro (tabla, fichas, informes) está en la pantalla «aula» (aula.js).
import { $, esc, icon, toast } from '../ui.js';
import { go } from '../router.js';
import { getState, update } from '../store.js';
import { cloudConfigured, cloudErrorText } from '../cloud.js';
import { accountName } from '../account.js';
import { INSTRUMENTS } from '../instruments.js';
import { proAccess, aulaSchoolId } from '../pro-access.js';
import { taskStatus, dayKey, assignedTo } from '../aula.js';
import { schoolYear } from '../school.js';
import { classKey } from '../aula-summary.js';
import { cacheTasks, publishSoon, myClasses } from '../aula-sync.js';
import { VARIANT_NAMES } from '../aula-temario.js';
import * as api from '../aula-api.js';
import { dueLabel, statusPill, meter, fmtShort, fmtLong, subtitleHtml } from './aula-ui.js';
import { startTask } from './aula-launch.js';

const CONTACT = 'tizaestudiogames+violin@gmail.com';
const PRIVACY = 'Tu profesor ve solo esto: tus minutos de práctica, tu racha, el % de tus tareas y de las unidades de Lenguaje, tus competencias y tus errores más frecuentes. Nada de tu correo ni de tus grabaciones.';
let token = 0;
let inviteCode = new URLSearchParams(location.search).get('clase') || '';

const instOptions = sel => INSTRUMENTS.map(i => `<option value="${i.id}" ${i.id === sel ? 'selected' : ''}>${esc(i.name)}</option>`).join('');
const showError = (id, text) => { const el = $(id); if (!el) return; el.textContent = text; el.hidden = false; };

export async function renderAulaHome(box) {
  const my = ++token;
  if (!cloudConfigured()) { box.innerHTML = '<p class="empty">El Aula necesita conexión con el servidor.</p>'; return; }
  box.innerHTML = '<p class="empty" role="status">Cargando el Aula…</p>';
  const s = getState();
  const sid = aulaSchoolId(s);
  const [school, mine] = await Promise.all([
    sid ? api.getSchoolDoc(sid).catch(() => null) : null,
    Promise.all(myClasses().map(c => api.loadMyClass(c).then(d => ({ c, d }), err => ({ c, err })))),
  ]);
  const access = proAccess({ school });
  const classes = access.active || access.expired ? await api.listClasses(sid).catch(err => ({ err })) : null;
  if (my !== token || !box.isConnected) return;
  mine.forEach(({ c, d }) => { if (d) cacheTasks(c, d.tasks.filter(t => assignedTo(t, c.uid))); });
  if (mine.some(x => x.d)) publishSoon();
  const isStudent = myClasses().length > 0;
  const isTeacher = access.active || !!access.expired;
  box.innerHTML = `${hero(isStudent, isTeacher)}
    ${isStudent ? mine.map(studentBlock).join('') : ''}
    ${isTeacher ? teacherBlock(school, access, classes) : ''}
    <div class="aula-roles${isStudent || isTeacher ? ' compact' : ''}">
      ${isStudent || isTeacher ? `<details class="aula-more"><summary>${esc(isStudent ? 'Unirme a otra clase' : '¿También eres alumno? Unirme a una clase')}</summary>${joinForm()}</details>` : joinForm()}
      ${isTeacher ? '' : isStudent ? `<details class="aula-more"><summary>${esc('¿Eres profesor? Conoce el Aula Pro')}</summary>${pitch(school, access)}</details>` : pitch(school, access)}
    </div>`;
  bind(box, { school, mine, classes });
}

function hero(isStudent, isTeacher) {
  const [title, text] = isTeacher && !isStudent
    ? ['Mis clases', 'Pon tareas del temario y mira de un vistazo cómo va cada alumno.']
    : isStudent ? ['Mis tareas', 'Lo que te ha pedido tu profesor. Cada intento cuenta y tu profesor ve tu progreso.']
      : ['Aula', 'Clases con tu profesor de música: tareas del temario y seguimiento de cada alumno.'];
  return `<div class="pro-hero aula-hero"><p class="eyebrow">Aula</p><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`;
}

// ---------- Alumno: «Mis tareas» ----------
function taskCard(c, task, entry, feedback, today) {
  const status = taskStatus(task, entry, today);
  const p = entry ? entry.p || 0 : 0;
  const several = ['lm-unit', 'lm-section'].includes(task.kind) || (task.kind === 'lm-ex' && (task.ref.ids || []).length > 1);
  const left = task.maxAttempts && !several ? Math.max(0, task.maxAttempts - ((entry && Math.max(0, ...Object.values(entry.c || {}))) || 0)) : null;
  const meta = [
    `<span class="pill ${status === 'late' ? 'late' : ''}">${esc(dueLabel(task, today))}</span>`,
    `<span>${esc(`Mínimo ${task.minPct} %`)}</span>`,
    task.variant !== 'any' ? `<span>${esc(VARIANT_NAMES[task.variant])}</span>` : '',
    left !== null ? `<span>${esc(left === 1 ? 'Queda 1 intento' : `Quedan ${left} intentos`)}</span>` : '',
    task.maxAttempts && several ? `<span>${esc(`${task.maxAttempts} ${task.maxAttempts === 1 ? 'intento' : 'intentos'} por ejercicio`)}</span>` : '',
  ].filter(Boolean).join('');
  const action = status === 'out' ? `<span class="muted small">${esc('Intentos agotados')}</span>`
    : `<button type="button" class="btn${status === 'done' ? ' ghost' : ''} small" data-do="${esc(task.id)}" data-class="${esc(classKey(c))}"><span class="ic">${icon('play')}</span><span>${esc(status === 'done' ? 'Repetir' : 'Hacer')}</span></button>`;
  return `<article class="aula-task st-${status}">
    <div class="aula-task-main"><p class="eyebrow">${subtitleHtml(task)}</p><h4>${esc(task.title)}</h4>
      <p class="aula-task-meta">${status === 'late' ? '' : statusPill(status)}${meta}</p>
      ${entry && entry.n ? meter(p, task.title) : ''}
      ${task.note ? `<p class="aula-note"><b>${esc('Indicaciones:')}</b> <span>${esc(task.note)}</span></p>` : ''}
      ${feedback ? `<div class="stamp"><b>${esc('Comentario de tu profesor')}</b><span>${esc(feedback.comment)}</span></div>` : ''}
    </div>${action}</article>`;
}

function studentBlock({ c, d, err }) {
  const head = `<div class="aula-block-head"><div><p class="eyebrow">${esc(c.teacher ? `Clase de ${c.teacher}` : 'Clase')}</p><h3>${esc(c.name)}</h3></div>
    <button type="button" class="btn ghost small" data-leave="${esc(classKey(c))}">${esc('Salir de la clase')}</button></div>`;
  if (err || !d) {
    const gone = !d && !err;
    return `<section class="panel aula-class-block">${head}<p class="${gone ? 'muted' : 'warn'}">${esc(gone || String(err && err.code).includes('permission')
      ? 'Ya no estás en esta clase: tu profesor te ha dado de baja o la ha borrado.' : cloudErrorText(err))}</p></section>`;
  }
  const today = dayKey(Date.now());
  const prog = getState().aula.prog || {};
  const tasks = d.tasks.filter(t => assignedTo(t, c.uid)).map(t => ({ t, e: prog[`${c.cid}/${t.id}`] || null }));
  const withStatus = tasks.map(x => ({ ...x, status: taskStatus(x.t, x.e, today) }));
  const order = { late: 0, progress: 1, todo: 2, out: 3, done: 4 };
  const pending = withStatus.filter(x => x.status !== 'done').sort((a, b) => order[a.status] - order[b.status] || (a.t.due || '9999').localeCompare(b.t.due || '9999'));
  const done = withStatus.filter(x => x.status === 'done');
  const late = pending.filter(x => x.status === 'late').length;
  const counts = `${pending.length} ${pending.length === 1 ? 'pendiente' : 'pendientes'} · ${late} ${late === 1 ? 'vencida' : 'vencidas'} · ${done.length} ${done.length === 1 ? 'hecha' : 'hechas'}`;
  const card = x => taskCard(c, x.t, x.e, d.feedback[x.t.id], today);
  return `<section class="panel aula-class-block">${head}<p class="muted small">${esc(counts)}</p>
    ${pending.length ? `<div class="aula-tasks">${pending.map(card).join('')}</div>` : `<p class="aula-empty">${esc(tasks.length ? '¡Todo hecho! Tu profesor verá tu progreso.' : 'Tu profesor todavía no ha puesto tareas.')}</p>`}
    ${done.length ? `<details class="aula-done"><summary>${esc(`Hechas (${done.length})`)}</summary><div class="aula-tasks">${done.map(card).join('')}</div></details>` : ''}
    <details class="aula-privacy"><summary>${esc('Qué ve tu profesor')}</summary><p class="muted small">${esc(PRIVACY)}</p></details></section>`;
}

function joinForm() {
  return `<form class="panel form aula-join" id="aulaJoin" novalidate><h2>${esc('Soy alumno')}</h2>
    <label for="aulaJoinCode">${esc('Código de tu clase')}</label><input id="aulaJoinCode" class="input code-input" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Ej.: K7P2QX" value="${esc(inviteCode)}">
    <label for="aulaJoinNick">${esc('Tu nombre')}</label><input id="aulaJoinNick" class="input" maxlength="30" autocomplete="off" placeholder="${esc('Tu nombre de pila o un apodo')}" aria-describedby="aulaJoinNickHint">
    <p class="muted small" id="aulaJoinNickHint">${esc('Tu profesor te verá con este nombre: basta con tu nombre de pila o un apodo, sin apellidos.')}</p>
    <label for="aulaJoinInst">${esc('Tu instrumento')}</label><select id="aulaJoinInst" class="select">${instOptions(getState().instrument)}</select>
    <p class="muted small"><span>${esc('Para ti es gratis.')}</span> <span>${esc(PRIVACY)}</span></p>
    <button class="btn" type="submit">${esc('Entrar en la clase')}</button><p id="aulaJoinError" class="warn" role="alert" hidden></p></form>`;
}

// ---------- Profesor ----------
function teacherBlock(school, access, classes) {
  const until = access.expired ? 'Licencia caducada' : access.until ? `Aula Pro activa hasta el ${fmtShort(access.until)}` : 'Aula Pro activa';
  const list = classes && classes.err ? `<p class="warn">${esc(cloudErrorText(classes.err))}</p>`
    : (classes || []).length ? `<div class="aula-class-grid">${classes.sort((a, b) => String(a.name).localeCompare(String(b.name), 'es')).map(c => `<button type="button" class="aula-class-card" data-open-class="${esc(c.id)}">
        <b>${esc(c.name)}</b><small><span>${esc(`${c.students || 0} ${c.students === 1 ? 'alumno' : 'alumnos'}`)}</span> · ${c.closed ? `<span>${esc('Inscripciones cerradas')}</span>` : `<span>${esc('código')}</span> <span class="code">${esc(c.code)}</span>`}</small><span class="aula-go" aria-hidden="true">›</span></button>`).join('')}</div>`
      : `<p class="aula-empty">${esc('Crea tu primera clase: tus alumnos entrarán con su código.')}</p>`;
  const expired = access.expired ? `<div class="panel aula-expired" role="status"><b>${esc(access.expiredAt ? `Tu licencia del Aula Pro venció el ${fmtLong(access.expiredAt)}` : 'Tu licencia del Aula Pro ya no está activa')}</b>
      <span>${esc('Tus clases y tus alumnos siguen aquí en solo lectura: hasta renovarla no puedes crear clases, tareas ni comentarios.')}</span>
      ${access.requested ? `<span class="pill ok">${esc('Renovación pedida')}</span>` : `<button type="button" class="btn small" id="aulaRenew">${esc('Pedir la renovación')}</button>`}</div>` : '';
  if (access.expired) return `<section class="aula-teacher"><div class="aula-block-head"><h3>${esc(school.name)}</h3><span class="pill late">${esc(until)}</span></div>${expired}${list}</section>`;
  return `<section class="aula-teacher"><div class="aula-block-head"><h3>${esc(school.name)}</h3><span class="pill ok">${esc(until)}</span></div>${list}
    <form class="panel form aula-new-class" id="aulaNewClass" novalidate><label for="aulaClassName">${esc('Nueva clase')}</label>
      <div class="row"><input id="aulaClassName" class="input" maxlength="60" placeholder="Ej.: 1.º de Lenguaje · martes"><button class="btn" type="submit">${esc('Crear clase')}</button></div>
      <p id="aulaNewClassError" class="warn" role="alert" hidden></p></form></section>`;
}

function pitch(school, access) {
  const benefits = [
    ['Clases con código', 'Tus alumnos entran con un código de 6 letras, sin correo.'],
    ['Tareas del temario', 'Unidades, secciones o ejercicios de Lenguaje Musical, lecciones del curso de su instrumento, páginas del Libro, niveles del Método Pro o tu propio MusicXML. Con fecha, nota mínima, intentos y nivel Fácil o Medio, para toda la clase o para alumnos concretos.'],
    ['Seguimiento que se entiende', 'La tabla de la clase con el % de cada tarea, quién no ha practicado esta semana y qué está vencido. La ficha de cada alumno con sus minutos, su racha, sus competencias y sus errores frecuentes.'],
    ['Informes', 'Informe trimestral con nota de 1 a 10 por competencia en PDF y la clase entera en CSV.'],
  ];
  const requested = access.requested && school
    ? `<div class="aula-requested" role="status"><b>${esc('Solicitud enviada')}</b><span>${esc('Te escribiremos cuando la activemos. Si tienes prisa, escríbenos.')}</span>
        <a class="btn ghost small" href="mailto:${CONTACT}?subject=${encodeURIComponent('Aula Pro: ' + school.name + ' (' + school.code + ')')}">${esc('Escribirnos')}</a></div>`
    : `<form class="form" id="aulaRequest" novalidate>
        ${school ? `<p class="small"><span>${esc('Escuela:')}</span> <b>${esc(school.name)}</b></p>` : `<label for="aulaSchoolName">${esc('Tu escuela o academia')}</label><input id="aulaSchoolName" class="input" maxlength="80" placeholder="Ej.: Escuela de Música de…">`}
        <label for="aulaOwner">${esc('Tu nombre')}</label><input id="aulaOwner" class="input" maxlength="30" autocomplete="name" value="${esc((school && school.ownerName) || accountName())}">
        <button class="btn" type="submit">${esc('Solicitar acceso')}</button><p id="aulaRequestError" class="warn" role="alert" hidden></p></form>`;
  return `<section class="panel aula-pitch"><p class="eyebrow">${esc('Para profesores · Aula Pro')}</p><h2>${esc('Soy profesor')}</h2>
    <ul class="aula-benefits">${benefits.map(([b, text]) => `<li><b>${esc(b)}</b><span>${esc(text)}</span></li>`).join('')}</ul>
    <p class="muted small">${esc('Para tus alumnos es gratis: la licencia es del profesor. Durante la beta la activamos a petición.')}</p>${requested}</section>`;
}

// ---------- Acciones ----------
function bind(box, { school, mine }) {
  box.querySelectorAll('[data-do]').forEach(b => b.addEventListener('click', () => {
    const entry = mine.find(x => classKey(x.c) === b.dataset.class);
    const task = entry && entry.d && entry.d.tasks.find(t => t.id === b.dataset.do);
    if (task) startTask(entry.c, task);
  }));
  box.querySelectorAll('[data-leave]').forEach(b => b.addEventListener('click', () => leave(b, box)));
  const readOnly = !proAccess({ school }).active;
  box.querySelectorAll('[data-open-class]').forEach(b => b.addEventListener('click', () => go('aula', { sid: school.id, cid: b.dataset.openClass, readOnly })));
  $('aulaRenew')?.addEventListener('click', async () => {
    try { await api.requestAccess({ schoolId: school.id }); toast('Solicitud enviada'); renderAulaHome(box); } catch (err) { toast(cloudErrorText(err)); }
  });
  $('aulaJoin')?.addEventListener('submit', e => { e.preventDefault(); join(box); });
  $('aulaJoinCode')?.addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
  $('aulaNewClass')?.addEventListener('submit', e => { e.preventDefault(); newClass(box, school); });
  $('aulaRequest')?.addEventListener('submit', e => { e.preventDefault(); request(box, school); });
}

async function join(box) {
  const code = $('aulaJoinCode').value.trim().toUpperCase();
  const nick = $('aulaJoinNick').value.trim();
  const instrument = $('aulaJoinInst').value;
  if (code.length !== 6 || !nick) { showError('aulaJoinError', 'Escribe el código de 6 caracteres y tu nombre.'); return; }
  if (myClasses().some(c => c.code === code)) { showError('aulaJoinError', 'Ya estás en esta clase.'); return; }
  try {
    const joined = await api.joinClass(code, nick, instrument);
    inviteCode = '';
    update({ aula: { ...(getState().aula || {}), classes: [...myClasses(), joined] } });
    toast(`Te has unido a ${joined.name}`);
    renderAulaHome(box);
  } catch (err) { showError('aulaJoinError', cloudErrorText(err)); }
}

async function leave(btn, box) {
  if (!btn.dataset.confirm) { btn.dataset.confirm = '1'; btn.textContent = '¿Seguro? Toca otra vez'; return; }
  const c = myClasses().find(x => classKey(x) === btn.dataset.leave);
  if (!c) return;
  try { await api.leaveClass(c); } catch (err) {
    if (!String(err && err.code).includes('permission')) { toast(cloudErrorText(err)); return; } // ya me habían dado de baja: se quita igual
  }
  const a = getState().aula || {};
  const { [classKey(c)]: _gone, ...tasks } = a.tasks || {};
  const prog = Object.fromEntries(Object.entries(a.prog || {}).filter(([k]) => !k.startsWith(c.cid + '/')));
  update({ aula: { ...a, classes: myClasses().filter(x => classKey(x) !== classKey(c)), tasks, prog } });
  toast('Has salido de la clase');
  renderAulaHome(box);
}

async function newClass(box, school) {
  const name = $('aulaClassName').value.trim();
  if (!name) { showError('aulaNewClassError', 'Ponle nombre a la clase.'); return; }
  try {
    const cls = await api.createClass(school.id, name, school.ownerName || accountName() || 'Profesor');
    toast('Clase creada');
    go('aula', { sid: school.id, cid: cls.id });
  } catch (err) { showError('aulaNewClassError', cloudErrorText(err)); }
}

async function request(box, school) {
  const owner = $('aulaOwner').value.trim();
  const name = school ? school.name : $('aulaSchoolName').value.trim();
  if (!name || !owner) { showError('aulaRequestError', 'Escribe el nombre de tu escuela y el tuyo.'); return; }
  try {
    const { schoolId, created } = await api.requestAccess({ schoolId: school && school.id, name, ownerName: owner });
    if (created) {
      const st = getState();
      // La escuela nueva es también la de la pestaña Escuela si allí no había ninguna
      update(st.school ? { aula: { ...(st.aula || {}), schoolId } } : { school: { ...created, year: schoolYear() }, aula: { ...(st.aula || {}), schoolId } });
    }
    toast('Solicitud enviada');
    renderAulaHome(box);
  } catch (err) { showError('aulaRequestError', cloudErrorText(err)); }
}
