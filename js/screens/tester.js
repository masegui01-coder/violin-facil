// Modo tester para quien ya tiene cuenta (beta: BETA_ALL_TESTERS): «Ver como alumno · Ver como profesor · Salir» en el
// Aula y en Ajustes › Tu cuenta, con un aviso fijo arriba y el atajo al libro de Lenguaje Musical. Sin clase, sin escuela y
// sin licencia: la clase de ejemplo vive solo en este móvil (tester-fs.js, tester-view.js) y nunca toca los datos reales.
import { $, esc, toast } from '../ui.js';
import { go } from '../router.js';
import { getState, update, subscribe } from '../store.js';
import { cloudConfigured } from '../cloud.js';
import { currentAccount } from '../account.js';
import { BETA_ALL_TESTERS } from '../metrics.js';
import { demoSession } from '../demo.js';
import { SANDBOX_SID, seedSandbox, clearSandbox, sandboxDocs } from '../tester-fs.js';
import { testerSession, testerEntryPatch, testerExitPatch, sandboxSeed, SANDBOX_CID } from '../tester-view.js';

const OTHER = { alumno: 'profesor', profesor: 'alumno' };

// Cualquier usuario con cuenta durante la beta (no en el modo prueba sin cuenta, que tiene su propio aviso)
export const testerAvailable = () => BETA_ALL_TESTERS && cloudConfigured() && !!currentAccount() && !demoSession(getState());

// ---------- Atajo al libro ----------
export function openLmBook() {
  update({ learnView: 'lm' });
  go('learn'); // Aprender lo lee como Libro y profesor › Mi libro › Lenguaje y baja hasta allí
}
const bookButton = (id, cls = 'btn ghost small') => `<button type="button" class="${cls}" id="${id}" data-lm-book>${esc('Abrir el libro de Lenguaje Musical (Nivel 1)')}</button>`;

// ---------- Entrar, cambiar de papel y salir ----------
export function enterTester(role) {
  const acc = currentAccount();
  if (!acc) return;
  // La clase de ejemplo se prepara la primera vez; al cambiar de papel se conserva lo que el tester ha hecho en ella
  if (!testerSession(getState()) || !sandboxDocs().size) seedSandbox(sandboxSeed({ uid: acc.uid }));
  update(testerEntryPatch(getState(), role, { uid: acc.uid }));
  if (role === 'profesor') go('aula', { sid: SANDBOX_SID, cid: SANDBOX_CID });
  else go('learn');
  toast(role === 'profesor' ? 'Modo tester: ves el Aula como profesor (clase de ejemplo)' : 'Modo tester: ves el Aula como alumno (tareas de ejemplo)');
}

export function exitTester() {
  if (!testerSession(getState())) return;
  clearSandbox();
  update(testerExitPatch(getState()));
  go('learn');
  toast('Has salido del modo tester: vuelves a tu Aula de siempre');
}

// ---------- «Modo tester: Ver como alumno · Ver como profesor · Salir» ----------
export function testerControlHtml() {
  if (!testerAvailable() && !testerSession(getState())) return '';
  const t = testerSession(getState());
  const btn = (role, label) => `<button type="button" class="btn ${t && t.role === role ? '' : 'ghost '}small" data-tester-role="${role}" aria-pressed="${!!(t && t.role === role)}">${esc(label)}</button>`;
  return `<div class="tester-control" role="group" aria-label="${esc('Modo tester')}"><b>${esc('Modo tester:')}</b>
    ${btn('alumno', 'Ver como alumno')}${btn('profesor', 'Ver como profesor')}
    ${t ? `<button type="button" class="btn ghost small" data-tester-exit>${esc('Salir')}</button>` : ''}</div>`;
}

export function bindTesterControls(box) {
  box.querySelectorAll('[data-tester-role]').forEach(b => b.addEventListener('click', () => enterTester(b.dataset.testerRole)));
  box.querySelectorAll('[data-tester-exit]').forEach(b => b.addEventListener('click', exitTester));
  box.querySelectorAll('[data-lm-book]').forEach(b => b.addEventListener('click', openLmBook));
}

// ---------- Inicio del Aula ----------
export function testerAulaHtml() {
  const t = testerSession(getState());
  const control = testerControlHtml();
  const book = bookButton('aulaLmBook');
  if (!t) {
    // Fuera del modo tester el libro ya está en Mi libro: sin atajo
    return control ? `<section class="panel tester-panel">${control}
      <p class="muted small">${esc('Mira el Aula como alumno o como profesor con una clase de ejemplo, sin registrarte en ninguna clase ni pedir licencia. Nada de lo que hagas toca tus datos.')}</p></section>` : '';
  }
  const extra = t.role === 'profesor'
    ? `<p class="muted small">${esc('Clase de ejemplo con alumnos inventados («ejemplo»): prueba la tabla, los filtros, las fichas, el informe trimestral, los comentarios y el formulario de tareas. Todo se queda en este móvil.')}</p>
      <div class="row"><button type="button" class="btn small" id="testerOpenClass">${esc('Abrir la clase de ejemplo')}</button>${book}</div>
      <p class="muted small">${esc('Para probarlo de verdad con dos móviles, usa «Probar sin cuenta (modo prueba)» en una ventana privada o en otro móvil.')}</p>`
    : `<p class="muted small">${esc('Tareas de ejemplo de una profesora inventada. Al hacerlas se abre el ejercicio de verdad y tu resultado aparece en la tarea.')}</p>
      <div class="row"><button type="button" class="btn ghost small" id="testerJoinReal">${esc('Unirme a una clase de verdad con código')}</button>${book}</div>`;
  return `<section class="panel tester-panel">${control}${extra}</section>`;
}

export function bindTesterAula(box) {
  bindTesterControls(box);
  box.querySelector('#testerOpenClass')?.addEventListener('click', () => go('aula', { sid: SANDBOX_SID, cid: SANDBOX_CID }));
  box.querySelector('#testerJoinReal')?.addEventListener('click', () => {
    const form = $('aulaJoin');
    if (!form) return;
    const more = form.closest('details');
    if (more) more.open = true;
    $('aulaJoinCode').focus();
  });
}

// ---------- Aviso fijo arriba ----------
let shown = '';
function renderBanner() {
  const el = $('testerBanner');
  if (!el) return;
  const t = testerSession(getState());
  const key = t ? t.role : '';
  if (key === shown) return;
  shown = key;
  el.hidden = !t;
  if (!t) { el.innerHTML = ''; return; }
  el.innerHTML = `<p class="demo-banner-text"><b>${esc(t.role === 'profesor' ? 'Modo tester · profesor' : 'Modo tester · alumno')}</b> <small>${esc('Clase de ejemplo: nada toca tus datos')}</small></p>
    <div class="demo-banner-actions">
      <button type="button" class="btn ghost small" id="testerSwitch">${esc(OTHER[t.role] === 'profesor' ? 'Ver como profesor' : 'Ver como alumno')}</button>
      ${bookButton('testerBook')}
      <button type="button" class="btn ghost small" id="testerExit">${esc('Salir')}</button></div>`;
  $('testerSwitch').addEventListener('click', () => enterTester(OTHER[t.role]));
  $('testerBook').addEventListener('click', openLmBook);
  $('testerExit').addEventListener('click', exitTester);
}

// La sesión se restaura después del primer pintado: si el Aula ya estaba en pantalla sin el control, se repinta
function refreshAulaHome() {
  const pane = $('proPane');
  if (!pane || !pane.querySelector('.tester-panel') || pane.querySelector('.tester-control') || !testerAvailable()) return;
  import('./aula-home.js').then(m => m.renderAulaHome(pane), () => {});
}

if (typeof document !== 'undefined') {
  renderBanner();
  subscribe(() => renderBanner());
  window.addEventListener('account-ready', refreshAulaHome);
}
