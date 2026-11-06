// Modo prueba (testers sin cuenta): botón «Probar sin cuenta» en la pantalla de acceso, elección de papel (alumno o
// profesor), aviso fijo arriba con «Cambiar a …» y «Salir», y el panel de tres pasos del Aula para probar con dos móviles.
// Al entrar se guarda una copia del estado del móvil; al salir se borra todo lo de la prueba (en la nube y aquí) y se
// recupera esa copia. La lógica sin DOM está en demo.js y la nube en demo-api.js.
import { $, esc, toast } from '../ui.js';
import { go } from '../router.js';
import { getState, update, replaceState, subscribe } from '../store.js';
import { cloudConfigured, cloudErrorText } from '../cloud.js';
import { demoSession, demoExpired, demoEntryPatch } from '../demo.js';
import { sheet, fmtDate } from './band-ui.js';

const SNAPSHOT_KEY = 'violin-facil-demo-prev';
const OTHER = { alumno: 'profesor', profesor: 'alumno' };
let busy = false;

// ---------- Copia del estado de antes de la prueba ----------
function saveSnapshot(state) {
  try { if (!localStorage.getItem(SNAPSHOT_KEY)) localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ ...state, demo: null })); } catch (e) { /* sin almacenamiento */ }
}
function restoreSnapshot() {
  let prev = null;
  try { prev = JSON.parse(localStorage.getItem(SNAPSHOT_KEY)); localStorage.removeItem(SNAPSHOT_KEY); } catch (e) { prev = null; }
  if (prev) replaceState({ ...prev, demo: null });
  else update({ demo: null, proTester: false, aula: {}, aulaView: null });
}

// ---------- Pantalla de acceso ----------
export function demoEntryHtml() {
  if (!cloudConfigured()) return '';
  return `<div class="demo-entry"><p class="or"><span>${esc('o sin cuenta, para probar')}</span></p>
    <button type="button" class="btn ghost big" id="acDemo">${esc('Probar sin cuenta (modo prueba)')}</button>
    <p class="muted small">${esc('Para testers: entra como alumno o como profesor sin registrarte. Lo que hagas en la prueba se borra al salir y caduca en 7 días.')}</p></div>`;
}

export function bindDemoEntry() {
  $('acDemo')?.addEventListener('click', openRolePicker);
}

function openRolePicker() {
  sheet(`<p class="eyebrow">${esc('Modo prueba')}</p><h2>${esc('¿Cómo quieres probar la app?')}</h2>
    <div class="demo-roles">
      <button type="button" class="demo-role" data-demo-role="alumno"><b>${esc('Alumno')}</b><small>${esc('Todo el curso abierto (también Lenguaje Musical) y entrar en una clase con el código de tu profesor.')}</small></button>
      <button type="button" class="demo-role" data-demo-role="profesor"><b>${esc('Profesor')}</b><small>${esc('Aula Pro de prueba: crea clases, pon tareas y mira el progreso de tus alumnos.')}</small></button>
    </div>
    <p class="muted small">${esc('Para probar el Aula de verdad usa dos móviles: uno como profesor y otro como alumno.')}</p>
    <p id="demoRoleError" class="warn" role="alert" hidden></p>
    <button type="button" class="btn ghost small" data-close>${esc('Cancelar')}</button>`, box => {
    box.querySelectorAll('[data-demo-role]').forEach(b => b.addEventListener('click', () => enterDemo(b.dataset.demoRole, box)));
  });
}

// ---------- Entrar ----------
export async function enterDemo(role, box = null) {
  if (busy) return;
  busy = true;
  const buttons = box ? [...box.querySelectorAll('button')] : [];
  buttons.forEach(b => { b.disabled = true; });
  let fresh = false;
  let api = null;
  try {
    api = await import('../demo-api.js');
    ({ fresh } = await api.signInDemo());
    const school = role === 'profesor' ? await api.createDemoSchool('Profe de prueba') : null;
    saveSnapshot(getState());
    update({ ...demoEntryPatch(role, { fresh, school }), school: null, aula: school ? { classes: [], schoolId: school.id } : { classes: [] } });
    if ($('sheet').open) $('sheet').close();
    toast(role === 'profesor' ? 'Modo prueba: has entrado como profesor' : 'Modo prueba: has entrado como alumno');
    go('learn');
  } catch (err) {
    if (api && fresh) await api.signOutDemo(true).catch(() => {});
    const msg = (err && err.code === 'demo/has-account') ? err.message : cloudErrorText(err);
    const out = box && box.querySelector('#demoRoleError');
    if (out) { out.textContent = msg; out.hidden = false; } else toast(msg);
  } finally {
    busy = false;
    buttons.forEach(b => { b.disabled = false; });
  }
}

// ---------- Salir (o cambiar de papel) ----------
export async function exitDemo({ switchTo = null } = {}) {
  const d = demoSession(getState());
  if (!d || busy) return;
  busy = true;
  renderBanner(true);
  try {
    const api = await import('../demo-api.js');
    await api.deleteDemoData(d, (getState().aula || {}).classes || []);
    await api.signOutDemo(d.fresh).catch(() => {});
  } catch (err) { /* sin conexión: se sale igual (los datos de la prueba caducan solos) */ }
  restoreSnapshot();
  busy = false;
  renderBanner();
  if (switchTo) { await enterDemo(switchTo); return; }
  toast('Has salido del modo prueba: se ha borrado todo lo de la prueba');
  go(getState().onboarded ? 'learn' : 'account');
}

function confirmExit(switchTo) {
  const d = demoSession(getState());
  if (!d) return;
  const title = switchTo ? (switchTo === 'profesor' ? '¿Cambiar a profesor?' : '¿Cambiar a alumno?') : '¿Salir del modo prueba?';
  const text = d.role === 'profesor'
    ? 'Se borran tu escuela de prueba, tus clases, sus tareas y lo que hayan enviado los alumnos de prueba.'
    : 'Sales de tus clases de prueba y se borra el progreso que has hecho en la prueba.';
  sheet(`<p class="eyebrow">${esc('Modo prueba')}</p><h2>${esc(title)}</h2><p>${esc(text)}</p>
    <div class="row"><button type="button" class="btn ghost" data-close>${esc('Cancelar')}</button>
    <button type="button" class="btn" id="demoExitOk">${esc(switchTo ? 'Cambiar y borrar la prueba' : 'Salir y borrar la prueba')}</button></div>`, box => {
    box.querySelector('#demoExitOk').addEventListener('click', () => { $('sheet').close(); exitDemo({ switchTo }); });
  });
}

// ---------- Aviso fijo arriba ----------
let shown = '';
function renderBanner(leaving = false) {
  const el = $('demoBanner');
  if (!el) return;
  const d = demoSession(getState());
  const expired = demoExpired(getState());
  const key = d ? `${d.role}|${d.until}|${expired}|${leaving}` : '';
  if (key === shown) return;
  shown = key;
  el.hidden = !d;
  document.documentElement.classList.toggle('demo-mode', !!d);
  if (!d) { el.innerHTML = ''; return; }
  const when = expired ? `<span>${esc('La prueba ha caducado')}</span>`
    : `<span>${esc('Caduca el')}</span> <span>${esc(fmtDate(d.until))}</span>`;
  el.innerHTML = `<p class="demo-banner-text"><b>${esc(d.role === 'profesor' ? 'Modo prueba · profesor' : 'Modo prueba · alumno')}</b> <small>${when}</small></p>
    <div class="demo-banner-actions">${leaving ? `<span class="small" role="status">${esc('Borrando la prueba…')}</span>` : `
      <button type="button" class="btn ghost small" id="demoSwitch">${esc(OTHER[d.role] === 'profesor' ? 'Cambiar a profesor' : 'Cambiar a alumno')}</button>
      <button type="button" class="btn ghost small" id="demoExit">${esc('Salir del modo prueba')}</button>`}</div>`;
  $('demoSwitch')?.addEventListener('click', () => confirmExit(OTHER[d.role]));
  $('demoExit')?.addEventListener('click', () => confirmExit(null));
}

// ---------- Aula: los tres pasos para probar con dos móviles (y los alumnos de ejemplo del profesor) ----------
const STEPS = {
  profesor: ['Crea una clase y apunta su código.', 'En otro móvil, entra en el modo prueba como alumno y únete con ese código.', 'Pon una tarea (por ejemplo, una unidad de Lenguaje Musical) y mira aquí el progreso del alumno.'],
  alumno: ['En otro móvil, entra en el modo prueba como profesor y crea una clase.', 'Escribe aquí abajo el código de la clase y tu nombre.', 'Haz la tarea desde «Mis tareas»: tu profesor verá tu progreso en su móvil.'],
};

export function demoAulaHtml({ hasClasses = false } = {}) {
  const d = demoSession(getState());
  if (!d) return '';
  const samples = d.role === 'profesor' && hasClasses ? `<div class="demo-samples"><button type="button" class="btn ghost small" id="demoSamples">${esc(d.samples ? 'Quitar los alumnos de ejemplo' : 'Rellenar con alumnos de ejemplo')}</button>
      <p class="muted small">${esc('Alumnos inventados, marcados «(ejemplo)», para ver la tabla, los filtros, la ficha y el informe. Solo se ven en este móvil.')}</p></div>` : '';
  const expiry = d.role === 'profesor'
    ? `<span>${esc('Tu Aula de prueba (3 clases y 30 alumnos por clase como mucho) caduca el')}</span> <span>${esc(fmtDate(d.until))}</span><span>.</span> <span>${esc('Al salir del modo prueba se borra todo.')}</span>`
    : `<span>${esc('Al salir del modo prueba sales de tus clases y se borra tu progreso de la prueba.')}</span>`;
  return `<section class="panel demo-steps" aria-labelledby="demoStepsTitle"><p class="eyebrow">${esc('Modo prueba')}</p>
    <h3 id="demoStepsTitle">${esc('Pruébalo con dos móviles')}</h3>
    <ol>${STEPS[d.role].map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <p class="muted small">${expiry}</p>${samples}</section>`;
}

export function bindDemoAula(box, rerender) {
  box.querySelector('#demoSamples')?.addEventListener('click', () => {
    const d = demoSession(getState());
    if (!d) return;
    update({ demo: { ...d, samples: !d.samples } });
    toast(d.samples ? 'Alumnos de ejemplo quitados' : 'Alumnos de ejemplo añadidos: abre una clase para verlos');
    rerender();
  });
}

export const demoSamplesOn = () => { const d = demoSession(getState()); return !!(d && d.role === 'profesor' && d.samples); };
export const isDemoStudent = () => { const d = demoSession(getState()); return !!(d && d.role === 'alumno'); };

if (typeof document !== 'undefined') {
  renderBanner();
  subscribe(() => renderBanner());
}
