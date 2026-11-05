// «Hacer» una tarea del Aula (alumno): abre lo que pide el profesor en la herramienta que ya existe.
// Lenguaje Musical → el curso (js/lm/), lecciones del curso y del Libro → su lección, Método Pro → su nivel,
// MusicXML → una lección con la partitura de la tarea (cuenta por el id «aula-<tarea>», ver aula.js lessonIdFor).
import { toast } from '../ui.js';
import { go } from '../router.js';
import { getState, update } from '../store.js';
import { launch } from '../launch.js';
import { buildCourse } from '../course.js';
import { cloudErrorText } from '../cloud.js';
import { LM_KINDS } from '../aula.js';

function findLesson(id, instId) {
  const s = getState();
  return buildCourse(s.styles, instId).flatMap(u => u.lessons).find(l => l.id === id) || null;
}

async function findBookPage(id, instId) {
  const [{ buildLibrary }, { instrumentById }] = await Promise.all([import('../books.js'), import('../instruments.js')]);
  const lib = buildLibrary(buildCourse(getState().styles, instId), instrumentById(instId));
  return lib.flatMap(b => b.chapters.flatMap(c => c.pages)).find(p => p.lesson.id === id) || null;
}

// Lenguaje Musical: el curso decide cómo abrir la unidad, la sección o el ejercicio (js/lm/launcher.js openLmTarget)
async function openLm(task) {
  const target = { level: task.ref.level, unit: task.ref.unit, section: task.ref.section, ids: task.ref.ids, variant: task.variant };
  const mod = await import('../lm/launcher.js').catch(() => ({}));
  if (typeof mod.openLmTarget === 'function') { mod.openLmTarget(target); return; }
  window.dispatchEvent(new CustomEvent('lm-open', { detail: target }));
  toast(task.ref.label ? `Ábrelo en Lenguaje musical: ${task.ref.label}` : 'Ábrelo en Lenguaje musical');
}

async function openXml(cls, task) {
  const [api, band] = await Promise.all([import('../aula-api.js'), import('../band-api.js')]);
  const full = await api.getTask(cls.sid, cls.cid, task.id);
  if (!full || !full.song) { toast('Esta tarea ya no tiene partitura'); return; }
  const { enc, parsed, ...rest } = full.song;
  const id = 'aula-' + task.id;
  const song = { ...rest, ...band.partFor(full.song, getState().instrument), id, style: null, difficulty: 2 };
  launch({ id, kind: 'song', song }, { mode: 'tempo', from: 'aula' });
}

export async function startTask(cls, task) {
  const inst = getState().instrument;
  try {
    if (LM_KINDS.has(task.kind)) { await openLm(task); return; }
    if (task.kind === 'lesson') {
      const lesson = findLesson(task.ref.id, inst) || (task.ref.inst && findLesson(task.ref.id, task.ref.inst));
      if (!lesson) { toast('Esta lección no está en el curso de tu instrumento'); return; }
      launch(lesson, { from: 'aula' });
      return;
    }
    if (task.kind === 'book') {
      const page = await findBookPage(task.ref.id, inst);
      if (!page) { toast('Esta página no está en el Libro de tu instrumento'); return; }
      launch({ ...page.lesson, bookPage: page.number }, { from: 'book', mode: page.lesson.kind === 'notes' ? 'learn' : undefined });
      return;
    }
    if (task.kind === 'method') {
      const { buildMethod } = await import('../method.js');
      const { instrumentById } = await import('../instruments.js');
      if (!buildMethod(instrumentById(inst), getState().nom).some(l => l.leccion_id === task.ref.id)) { toast('Este nivel del Método Pro es de otro instrumento'); return; }
      update({ learnView: 'pro' });
      go('pro', { id: task.ref.id, tab: 'play' });
      return;
    }
    if (task.kind === 'xml') await openXml(cls, task);
  } catch (err) { toast(cloudErrorText(err)); }
}
