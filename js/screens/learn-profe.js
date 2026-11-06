// Aprender › «Libro y profesor» (js/learn-path.js): el Aula (Mis tareas, Mis clases o «Unirme a una clase») y Mi libro
// (Lenguaje Musical, libro del instrumento y Método Pro). Solo se descarga y se pinta la sección elegida.
import { $, toast } from '../ui.js';
import { getState } from '../store.js';
import { resolveLearn, inClassroom } from '../learn-path.js';
import { renderBook } from './book.js';

// Con clase (alumno o profesor, también en modo prueba o tester) o llegando por un enlace al Aula (invitación ?clase=),
// el Aula va arriba; si no, Mi libro primero y «Unirme a una clase» debajo, a mano pero sin tapar el libro
let aulaPinned = false;
export const unpinAula = () => { aulaPinned = false; };
const aulaFirst = s => aulaPinned || inClassroom(s) || !!s.tester || !!s.demo;

export function placeAula() {
  const s = getState();
  const first = aulaFirst(s);
  const box = $('proView');
  const libro = $('libro');
  if (first && box.nextElementSibling !== libro) libro.before(box);
  if (!first && libro.nextElementSibling !== box) libro.after(box);
  box.classList.toggle('aula-below', !first);
  $('libroJoin').hidden = first; // sin clase: atajo a «Unirme a la clase de tu profesor»
}

// El Aula se pinta en #proPane (donde el modo tester la repinta al restaurar la sesión)
function renderAulaBox() {
  return import('./aula-home.js').then(m => m.renderAulaHome($('proPane')), () => toast('No se ha podido abrir. Revisa la conexión.'));
}

// «Unirme a una clase»: la vista baja al formulario y el foco va al código (en la invitación, ya escrito)
export function focusJoin() {
  const code = $('aulaJoinCode');
  const more = code && code.closest('details');
  if (more) more.open = true;
  ($('proView')).scrollIntoView({ block: 'start' });
  if (code) code.focus({ preventScroll: true });
}

function renderLibro(section) {
  document.querySelectorAll('[data-libro]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.libro === section)));
  $('lmView').hidden = section !== 'lm';
  $('bookView').hidden = section !== 'book';
  $('methodView').hidden = section !== 'method';
  if (section === 'book') { renderBook(); return Promise.resolve(); }
  if (section === 'lm') {
    return import('../lm/view.js').then(m => { m.bindLm(); if (resolveLearn(getState()).section === 'lm') m.renderLm(); }, () => toast('No se ha podido abrir Lenguaje musical. Revisa la conexión.'));
  }
  return import('./pro.js').then(m => { if (resolveLearn(getState()).section === 'method') m.renderMethod($('methodView')); }, () => toast('No se ha podido abrir Pro. Revisa la conexión.'));
}

// view: lo que devuelve resolveLearn antes de normalizar (linked: un enlace a una sección; aulaLink: al Aula)
export function renderProfe({ section, linked, aulaLink }) {
  if (aulaLink) aulaPinned = true;
  placeAula();
  const aula = renderAulaBox();
  const libro = renderLibro(section);
  if (linked) libro.then(() => requestAnimationFrame(() => $('libro').scrollIntoView({ block: 'start' })));
  if (aulaLink) {
    aula.then(() => requestAnimationFrame(() => {
      const s = getState();
      if (!inClassroom(s) && !s.tester && !s.demo) focusJoin();
      else $('proView').scrollIntoView({ block: 'start' });
    }));
  }
}

// Texto del camino según quién eres (se enseña la primera vez)
export function profeHint(s) {
  if ((s.school && s.school.role === 'teacher') || (s.aula && s.aula.schoolId)) return 'Arriba, tus clases; debajo, el libro que estudian tus alumnos.';
  if (inClassroom(s)) return 'Arriba, las tareas de tu profesor; debajo, tu libro de estudio.';
  return 'Estudia con el libro: Lenguaje Musical, tu instrumento y el Método Pro. Si tienes profesor, únete a su clase.';
}
