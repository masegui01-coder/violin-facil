// Nueva tarea del Aula (profesor): elegir del temario (Lenguaje Musical: unidad, sección o ejercicios; lección del
// curso de instrumento; página del Libro; nivel del Método Pro; MusicXML propio), fecha, nota mínima, intentos,
// Fácil/Medio y a quién va (toda la clase o alumnos concretos). La validación final es la de aula.js normalizeTask.
import { $, esc, toast } from '../ui.js';
import { getState } from '../store.js';
import { cloudErrorText } from '../cloud.js';
import { INSTRUMENTS, instrumentById } from '../instruments.js';
import { normalizeTask, MAX_EXERCISES } from '../aula.js';
import { courseUnits, bookList, methodLevels, SECTION_NAMES, VARIANT_NAMES } from '../aula-temario.js';
import * as api from '../aula-api.js';

const SOURCES = [['lm', 'Lenguaje Musical'], ['lesson', 'Curso de instrumento'], ['book', 'Libro'], ['method', 'Método Pro'], ['xml', 'MusicXML']];
const SCOPES = [['lm-unit', 'Unidad entera'], ['lm-section', 'Una sección'], ['lm-ex', 'Ejercicios sueltos']];
const MIN_OPTIONS = [50, 60, 70, 80, 90, 100];
const ATTEMPT_OPTIONS = [[0, 'Sin límite'], [1, '1'], [2, '2'], [3, '3'], [5, '5'], [10, '10']];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const seg = (name, options, current) => options.map(([v, label]) => `<button type="button" data-${name}="${esc(v)}" aria-pressed="${String(v) === String(current)}">${esc(label)}</button>`).join('');
const opts = (list, sel) => list.map(([v, label]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(label)}</option>`).join('');
const instOpts = sel => opts(INSTRUMENTS.map(i => [i.id, i.name]), sel);

export function openAulaTaskForm({ ctx, onSaved }) {
  const s = getState();
  const tree = ctx.lm.tree;
  const firstLevel = tree[0] || null;
  const f = {
    source: tree.length ? 'lm' : 'lesson', scope: 'lm-unit', level: firstLevel ? firstLevel.level : 1, unit: firstLevel && firstLevel.units[0] ? firstLevel.units[0].unit : 1,
    section: '', ids: [], variant: 'any', inst: s.instrument, lesson: '', book: 1, page: '', method: '', song: null, assign: 'all', autoTitle: '',
  };
  const students = [...ctx.data.students].sort((a, b) => String(a.nickname).localeCompare(String(b.nickname), 'es'));

  $('sheetBody').innerHTML = `<form class="sheet-body form aula-form" id="aulaTaskForm" novalidate>
    <h2>Nueva tarea</h2>
    <fieldset><legend>Del temario</legend><div class="seg wrap" id="atSource">${seg('src', SOURCES, f.source)}</div><div id="atPick"></div></fieldset>
    <label for="atTitle">Título</label><input id="atTitle" class="input" maxlength="120" placeholder="Ej.: Ritmo de la unidad 3 para el jueves">
    <label for="atNote">Indicaciones</label><textarea id="atNote" maxlength="300" placeholder="Ej.: Primero en Fácil; cuando te salga, en Medio"></textarea>
    <div class="aula-form-grid">
      <div><label for="atDue">Fecha límite</label><input id="atDue" class="input" type="date"></div>
      <div><label for="atMin">Nota mínima</label><select id="atMin" class="select">${opts(MIN_OPTIONS.map(v => [v, `${v} %`]), 60)}</select></div>
      <div><label for="atTries">Intentos por ejercicio</label><select id="atTries" class="select">${opts(ATTEMPT_OPTIONS, 0)}</select></div>
    </div>
    <fieldset><legend>Para quién</legend><div class="seg" id="atAssign">${seg('assign', [['all', 'Toda la clase'], ['some', 'Alumnos concretos']], f.assign)}</div>
      <div id="atStudents" class="member-list" hidden>${students.map(st => `<label class="check-chip"><input type="checkbox" value="${esc(st.id)}">${esc(st.nickname)}</label>`).join('') || '<span class="muted small">Aún no hay alumnos en la clase.</span>'}</div></fieldset>
    <p id="atError" class="warn" role="alert" hidden></p>
    <button class="btn big" type="submit">Crear tarea</button>
    <button type="button" class="btn ghost small" data-close>Cancelar</button>
    <input id="atFile" type="file" accept=".xml,.musicxml,.mxl" hidden>
  </form>`;

  const error = msg => { $('atError').textContent = msg; $('atError').hidden = !msg; };
  const setTitle = text => {
    if (!$('atTitle').value || $('atTitle').value === f.autoTitle) $('atTitle').value = text;
    f.autoTitle = text;
  };
  const lvl = () => tree.find(l => l.level === f.level) || firstLevel;
  const unitOf = () => (lvl() ? lvl().units.find(u => u.unit === f.unit) || lvl().units[0] : null);

  function lmPick() {
    if (!tree.length) return '<p class="muted small">El curso de Lenguaje Musical todavía no está en esta versión. Elige otra parte del temario.</p>';
    const unit = unitOf();
    const exercises = unit ? unit.exercises.filter(e => f.variant === 'any' || e.variant === f.variant) : [];
    return `<div class="aula-form-grid"><div><label for="atLevel">Nivel</label><select id="atLevel" class="select">${opts(tree.map(l => [l.level, l.title]), f.level)}</select></div>
      <div><label for="atUnit">Unidad</label><select id="atUnit" class="select">${opts((lvl() ? lvl().units : []).map(u => [u.unit, `${u.unit}. ${u.title}`]), f.unit)}</select></div></div>
      <label>Qué parte</label><div class="seg wrap" id="atScope">${seg('scope', SCOPES, f.scope)}</div>
      ${f.scope === 'lm-section' ? `<label for="atSection">Sección</label><select id="atSection" class="select">${opts((unit ? unit.sections : []).map(x => [x, SECTION_NAMES[x] || x]), f.section)}</select>` : ''}
      <label>Variante</label><div class="seg" id="atVariant">${seg('variant', Object.entries(VARIANT_NAMES).map(([k, v]) => [k, v]).sort((a, b) => (a[0] === 'any') - (b[0] === 'any')), f.variant)}</div>
      ${f.scope === 'lm-ex' ? `<div class="member-list" id="atExercises">${exercises.map(e => `<label class="check-chip"><input type="checkbox" value="${esc(e.id)}" ${f.ids.includes(e.id) ? 'checked' : ''}>${esc(`${SECTION_NAMES[e.section] || e.section} · ${e.title}`)}</label>`).join('')}</div>
        <p class="muted small">${esc(`Como mucho ${MAX_EXERCISES} ejercicios.`)}</p>` : ''}`;
  }
  function lessonPick() {
    const units = courseUnits(f.inst, s.styles);
    return `<label for="atInst">Instrumento</label><select id="atInst" class="select">${instOpts(f.inst)}</select>
      <label for="atLesson">Lección</label><select id="atLesson" class="select"><option value="">Elige una lección…</option>${units.map(u => `<optgroup label="${esc(u.title)}">${opts(u.lessons.map(l => [l.id, l.title]), f.lesson)}</optgroup>`).join('')}</select>
      <p class="muted small">Cada alumno la hace en el curso de su instrumento.</p>`;
  }
  function bookPick() {
    const books = bookList(f.inst, s.styles);
    const book = books.find(b => b.n === f.book) || books[0];
    return `<div class="aula-form-grid"><div><label for="atInst">Instrumento</label><select id="atInst" class="select">${instOpts(f.inst)}</select></div>
      <div><label for="atBook">Libro</label><select id="atBook" class="select">${opts(books.map(b => [b.n, b.title]), f.book)}</select></div></div>
      <label for="atPage">Página</label><select id="atPage" class="select"><option value="">Elige una página…</option>${opts(book.pages.map(p => [p.id, `${p.number}. ${p.title}`]), f.page)}</select>`;
  }
  function methodPick() {
    const levels = methodLevels(f.inst, s.nom);
    return `<label for="atInst">Instrumento</label><select id="atInst" class="select">${instOpts(f.inst)}</select>
      ${levels.length ? `<label for="atMethod">Nivel</label><select id="atMethod" class="select"><option value="">Elige un nivel…</option>${opts(levels.map(l => [l.id, `${l.nivel}. ${l.title}`]), f.method)}</select>
        <p class="muted small">Cuenta cuando lo toca en la pestaña Práctica del nivel.</p>` : '<p class="muted small">Este instrumento todavía no tiene Método Pro.</p>'}`;
  }
  function xmlPick() {
    return `<div class="row"><button type="button" class="btn ghost small" id="atImport">Importar MusicXML</button><span class="small">${esc(f.song ? f.song.title : 'Ninguna partitura todavía')}</span></div>
      <p class="muted small">Cada alumno la lee transportada a su instrumento.</p>`;
  }
  const PICKERS = { lm: lmPick, lesson: lessonPick, book: bookPick, method: methodPick, xml: xmlPick };

  function renderPick() {
    $('atPick').innerHTML = PICKERS[f.source]();
    const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
    on('atLevel', 'change', e => { f.level = Number(e.target.value); f.unit = (lvl().units[0] || {}).unit || 1; f.ids = []; renderPick(); });
    on('atUnit', 'change', e => { f.unit = Number(e.target.value); f.ids = []; f.section = ''; renderPick(); });
    on('atSection', 'change', e => { f.section = e.target.value; describe(); });
    on('atInst', 'change', e => { f.inst = e.target.value; f.lesson = ''; f.page = ''; f.method = ''; renderPick(); });
    on('atLesson', 'change', e => { f.lesson = e.target.value; describe(); });
    on('atBook', 'change', e => { f.book = Number(e.target.value); f.page = ''; renderPick(); });
    on('atPage', 'change', e => { f.page = e.target.value; describe(); });
    on('atMethod', 'change', e => { f.method = e.target.value; describe(); });
    on('atImport', 'click', () => $('atFile').click());
    $('atPick').querySelectorAll('[data-scope]').forEach(b => b.addEventListener('click', () => { f.scope = b.dataset.scope; renderPick(); }));
    $('atPick').querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => { f.variant = b.dataset.variant; f.ids = []; renderPick(); }));
    $('atExercises')?.addEventListener('change', () => { f.ids = [...$('atExercises').querySelectorAll('input:checked')].map(i => i.value).slice(0, MAX_EXERCISES); describe(); });
    if (f.scope === 'lm-section' && !f.section && unitOf()) f.section = unitOf().sections[0] || '';
    describe();
  }

  // Lo elegido, como tarea (kind + ref) y como texto para el título
  function choice() {
    const inst = instrumentById(f.inst).name;
    if (f.source === 'lm') {
      const unit = unitOf();
      if (!unit) return null;
      const base = `Nivel ${f.level} · Unidad ${unit.unit}: ${unit.title}`;
      if (f.scope === 'lm-unit') return { kind: 'lm-unit', ref: { level: f.level, unit: unit.unit, label: base }, title: base };
      if (f.scope === 'lm-section') return { kind: 'lm-section', ref: { level: f.level, unit: unit.unit, section: f.section, label: `${base} · ${SECTION_NAMES[f.section] || f.section}` }, title: `${SECTION_NAMES[f.section] || f.section} · Unidad ${unit.unit}` };
      return { kind: 'lm-ex', ref: { level: f.level, unit: unit.unit, ids: f.ids, label: `${base} · ${f.ids.length} ${f.ids.length === 1 ? 'ejercicio' : 'ejercicios'}` }, title: `Ejercicios · Unidad ${unit.unit}` };
    }
    if (f.source === 'lesson') {
      const u = courseUnits(f.inst, s.styles).find(x => x.lessons.some(l => l.id === f.lesson));
      const l = u && u.lessons.find(x => x.id === f.lesson);
      return l ? { kind: 'lesson', ref: { id: l.id, inst: f.inst, label: `${inst} · ${u.title} · ${l.title}` }, title: l.title } : null;
    }
    if (f.source === 'book') {
      const b = bookList(f.inst, s.styles).find(x => x.n === f.book);
      const p = b && b.pages.find(x => x.id === f.page);
      return p ? { kind: 'book', ref: { id: p.id, inst: f.inst, book: f.book, label: `${inst} · ${b.title} · p. ${p.number}: ${p.title}` }, title: `${b.title} · p. ${p.number}` } : null;
    }
    if (f.source === 'method') {
      const l = methodLevels(f.inst, s.nom).find(x => x.id === f.method);
      return l ? { kind: 'method', ref: { id: l.id, inst: f.inst, label: `${inst} · Nivel ${l.nivel}: ${l.title}` }, title: `Método Pro · ${l.title}` } : null;
    }
    return f.song ? { kind: 'xml', ref: { label: f.song.title }, title: f.song.title, song: f.song } : null;
  }
  const describe = () => { const c = choice(); if (c) setTitle(c.title); };

  const bindSeg = (id, attr, fn) => $(id).addEventListener('click', e => {
    const b = e.target.closest(`[data-${attr}]`);
    if (!b) return;
    $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    fn(b.dataset[attr]);
  });
  bindSeg('atSource', 'src', v => { f.source = v; error(''); renderPick(); });
  bindSeg('atAssign', 'assign', v => { f.assign = v; $('atStudents').hidden = v !== 'some'; });
  $('atFile').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { error('El archivo es demasiado grande.'); return; }
    try {
      const [{ readMusicFile }, { singlePart }] = await Promise.all([import('../musicxml.js'), import('./band-task.js')]);
      f.song = singlePart(await readMusicFile(file.name, await file.arrayBuffer()));
      error('');
      renderPick();
    } catch (err) { error(err.message); }
  });
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());

  $('aulaTaskForm').addEventListener('submit', async e => {
    e.preventDefault();
    const c = choice();
    if (!c) { error('Elige qué hay que hacer en el temario.'); return; }
    const to = f.assign === 'some' ? [...$('atStudents').querySelectorAll('input:checked')].map(i => i.value) : [];
    if (f.assign === 'some' && !to.length) { error('Marca al menos un alumno.'); return; }
    const { task, error: msg } = normalizeTask({
      title: $('atTitle').value, kind: c.kind, ref: c.ref, song: c.song, due: $('atDue').value || null,
      minPct: Number($('atMin').value), maxAttempts: Number($('atTries').value), variant: c.kind.startsWith('lm-') ? f.variant : 'any', to, note: $('atNote').value,
    });
    if (msg) { error(msg); return; }
    try {
      await api.createTask(ctx.sid, ctx.cid, task);
      $('sheet').close();
      toast('Tarea creada');
      onSaved();
    } catch (err) { error(cloudErrorText(err)); }
  });
  renderPick();
  $('sheet').showModal();
}
