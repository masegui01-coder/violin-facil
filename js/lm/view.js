// Vista «Lenguaje» de Aprender: niveles → unidades (con progreso y estrellas) → la unidad, con sus secciones
// intercaladas con el bloque «En tu instrumento» (la lección del curso del instrumento del alumno que aplica lo
// mismo y las herramientas de su familia). Arriba, tus competencias. Ficha de la unidad en PDF opcional.
import { $, esc, icon, starsHtml, toast } from '../ui.js';
import { getState } from '../store.js';
import { instrumentById } from '../instruments.js';
import { currentCourse, currentStates, launch } from '../launch.js';
import { lessonTitle } from '../course.js';
import { LM_LEVELS, lmLevel, lmUnit, SECTION_NAME, VARIANT_NAME, SKILL_NAME, LM_SKILLS } from './catalog.js';
import { unitProgress, levelProgress, skillSummary, bestOf } from './results.js';
import { openLmExercise, openInstrumentTool, toolsFor, toolLabel } from './launcher.js';

let openUnit = null; // { level, unit }
let marked = { section: null, ids: [] }; // lo que asignó el Aula, resaltado en la unidad

const SECTION_ICON = { teoria: 'theory', ritmo: 'metro', agilidad: 'sight', entonacion: 'audition', dictado: 'dictation', cancion: 'song', audicion: 'speaker', creatividad: 'notes', repaso: 'star' };
const SECTION_HINT = {
  teoria: 'Ficha y práctica interactiva', ritmo: 'Palmas al micrófono y el juego STOP', agilidad: 'Nombra las notas contra reloj',
  entonacion: 'Canta: la app te escucha y corrige', dictado: 'Escucha y escribe en el pentagrama', cancion: 'La canción de la unidad, cantada',
  audicion: 'Una obra, su historia y preguntas', creatividad: 'Compón y escúchalo', repaso: 'Todas las competencias',
};
// Familia de instrumento del temario (lm-nivel1: cuerdaFrotada, vientoMadera…)
const FAMILY = { cuerda: 'cuerdaFrotada', madera: 'vientoMadera', escuela: 'vientoMadera', metal: 'vientoMetal', tecla: 'teclado', pulsada: 'cuerdaPulsada', percusion: 'percusion' };
export const familyOf = inst => (inst.id === 'xylophone' ? 'percusion' : FAMILY[inst.family] || 'vientoMadera');

const bar = (done, total, label) => `<div class="lm-progress" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width:${Math.round(100 * done / Math.max(1, total))}%"></span></div>`;

// ---------- Niveles y unidades ----------
function skillsHtml() {
  const s = skillSummary();
  if (LM_SKILLS.every(k => s[k] === null)) return '';
  return `<section class="lm-skills" aria-labelledby="lmSkillsTitle"><h2 id="lmSkillsTitle">Tus competencias</h2>
    <ul>${LM_SKILLS.map(k => `<li><span>${esc(SKILL_NAME[k])}</span>${s[k] === null ? '<small class="muted">Sin datos</small>' : `<b>${s[k]} %</b>${bar(s[k], 100, SKILL_NAME[k])}`}</li>`).join('')}</ul></section>`;
}

function unitCard(u) {
  const p = unitProgress(u.level, u.unit);
  return `<button type="button" class="lm-unit-card" data-unit="${u.unit}" data-level="${u.level}" style="--unit:${u.color}">
    <span class="lm-unit-num" aria-hidden="true">${u.unit}</span>
    <span class="lm-unit-text"><small><span>Unidad</span> ${u.unit}</small><b>${esc(u.title)}</b><small>${esc(u.goal)}</small>
      ${bar(p.done, p.total, `Ejercicios hechos de la unidad ${u.unit}`)}<small class="lm-unit-meta"><span>${p.done}/${p.total}</span> · ${starsHtml(Math.round(3 * p.stars / Math.max(1, p.maxStars)))}</small></span></button>`;
}

function levelsHtml() {
  return `<header class="lm-head"><p class="eyebrow">Gratis para todos</p><h2>Lenguaje musical</h2>
      <p class="muted">Ritmo, lectura, entonación, dictado y audición: lo común a todos los instrumentos, unidad a unidad, y aplicado en el tuyo.</p></header>
    ${skillsHtml()}
    ${LM_LEVELS.map(l => {
      if (!l.units.length) return `<section class="lm-level soon"><h3>${esc(l.title)} <span class="pill">Próximamente</span></h3><p class="muted small">${esc(l.sub)}</p></section>`;
      const p = levelProgress(l.level);
      return `<section class="lm-level"><h3>${esc(l.title)}</h3><p class="muted small">${esc(l.sub)}</p>
        <p class="small"><span>${p.done}/${p.total}</span> <span>ejercicios</span> · <span>${p.stars}</span> <span>estrellas</span></p>
        <div class="lm-units">${l.units.map(unitCard).join('')}</div></section>`;
    }).join('')}`;
}

// ---------- Una unidad ----------
const groupTitle = t => String(t).replace(/\s+(fácil|media|medio)$/i, '');
function exerciseRow(group) {
  const first = { ...group[0], title: groupTitle(group[0].title) };
  const assigned = group.some(e => marked.ids.includes(e.id));
  return `<li class="lm-ex${assigned ? ' assigned' : ''}"><div class="lm-ex-text"><b>${esc(first.title)}</b>${assigned ? '<span class="pill">Tarea</span>' : ''}</div>
    <div class="lm-ex-variants">${group.map(e => {
      const best = bestOf(e.id);
      return `<button type="button" class="lm-ex-btn ${e.variant}" data-ex="${e.id}">
        <span class="sr-only">${esc(first.title)}</span> <span>${esc(VARIANT_NAME[e.variant])}</span>${best ? `${starsHtml(best.stars)}<small>${best.pct} %</small>` : '<small class="muted">Sin hacer</small>'}</button>`;
    }).join('')}</div></li>`;
}

function grouped(exercises) {
  const groups = {};
  exercises.forEach(e => { (groups[`${e.section}-${e.letter}`] ||= []).push(e); });
  return Object.values(groups);
}

function sectionHtml(block) {
  return `<section class="lm-section${marked.section === block.section ? ' assigned' : ''}"><h3><span class="ic" aria-hidden="true">${icon(SECTION_ICON[block.section])}</span>${esc(SECTION_NAME[block.section])}</h3>
    <p class="muted small">${esc(SECTION_HINT[block.section])}</p><ul class="lm-ex-list">${grouped(block.exercises).map(exerciseRow).join('')}</ul></section>`;
}

// Lección del curso del instrumento del alumno que corresponde a la unidad («u3», «pu1», «gu5»…)
const refOf = (block, s) => {
  const fam = block.families[familyOf(instrumentById(s.instrument))];
  if (!fam || !fam.curso) return { fam, n: null };
  const ref = fam.curso[s.instrument] || fam.curso.winds || Object.values(fam.curso)[0];
  return { fam, n: Number(String(ref).replace(/\D+/g, '')) || 1 };
};
export function courseLesson(block, lmUnitNumber, level = 1) {
  const s = getState();
  const { fam, n } = refOf(block, s);
  if (!n) return { fam, lesson: null };
  const course = currentCourse();
  const unit = course[Math.min(course.length, n) - 1];
  if (!unit) return { fam, lesson: null };
  // las unidades de Lenguaje que remiten a esta misma unidad del curso se reparten sus lecciones por orden
  const sharing = (lmLevel(level)?.units || []).filter(u => refOf(u.blocks.find(b => b.kind === 'instrument'), s).n === n).map(u => u.unit);
  const lessons = unit.lessons.filter(l => !l.optional || l.pill);
  const k = Math.max(0, sharing.indexOf(lmUnitNumber));
  const lesson = lessons[Math.min(lessons.length - 1, Math.floor(lessons.length * k / Math.max(1, sharing.length)))] || unit.lessons[0];
  return { fam, lesson, unitTitle: unit.title };
}

let instrumentLesson = null;
function instrumentHtml(block, u) {
  const inst = instrumentById(getState().instrument);
  const { fam, lesson } = courseLesson(block, u.unit, u.level);
  instrumentLesson = lesson;
  const tools = toolsFor(block.tools, familyOf(inst), inst);
  return `<section class="lm-instrument" aria-labelledby="lmInstTitle"><h3 id="lmInstTitle"><span>En tu instrumento</span> · <span>${esc(inst.name)}</span></h3>
    <p>${esc(block.idea)}</p>${fam ? `<p class="muted">${esc(fam.texto)}</p>` : ''}
    <div class="lm-inst-links">
      ${lesson ? `<button type="button" class="btn" data-inst-lesson><span class="ic">${icon('play')}</span><span>Lección:</span> <span>${esc(lessonTitle(lesson))}</span></button>` : ''}
      ${tools.map((h, i) => `<button type="button" class="btn ghost small" data-inst-tool="${i}">${esc(toolLabel(h))}</button>`).join('')}
    </div></section>`;
}

function unitHtml(u) {
  const p = unitProgress(u.level, u.unit);
  return `<button type="button" class="btn ghost small lm-back" data-lm-back>← Todas las unidades</button>
    <header class="lm-unit-head" style="--unit:${u.color}"><p class="eyebrow"><span>Nivel</span> ${u.level} · <span>Unidad</span> ${u.unit}</p>
      <h2 tabindex="-1" id="lmUnitTitle">${esc(u.title)}</h2><p>${esc(u.goal)}</p>
      ${bar(p.done, p.total, 'Ejercicios hechos de la unidad')}<p class="small"><span>${p.done}/${p.total}</span> · ${starsHtml(Math.round(3 * p.stars / Math.max(1, p.maxStars)))}</p></header>
    <details class="lm-goals"><summary>Qué aprendes en esta unidad</summary>
      <h4>Novedades</h4><ul>${u.novelties.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
      <h4>Objetivos</h4><ul>${u.objectives.map(n => `<li>${esc(n)}</li>`).join('')}</ul></details>
    <div class="controls"><button type="button" class="btn ghost small" data-lm-pdf>Ficha de la unidad en PDF</button></div>
    ${u.blocks.map(b => (b.kind === 'instrument' ? instrumentHtml(b, u) : sectionHtml(b))).join('')}`;
}

export function renderLm({ focus = false } = {}) {
  const box = $('lmView');
  const u = openUnit && lmUnit(openUnit.level, openUnit.unit);
  box.innerHTML = u ? unitHtml(u) : levelsHtml();
  box.dataset.openUnit = u ? u.id : '';
  if (focus) (u ? $('lmUnitTitle') : box.querySelector('.lm-unit-card'))?.focus();
}

let bound = false;
export function bindLm() {
  if (bound) return;
  bound = true;
  $('lmView').addEventListener('click', e => {
    const card = e.target.closest('.lm-unit-card');
    const ex = e.target.closest('[data-ex]');
    if (card) { openUnit = { level: Number(card.dataset.level), unit: Number(card.dataset.unit) }; renderLm({ focus: true }); window.scrollTo(0, 0); return; }
    if (e.target.closest('[data-lm-back]')) { const at = openUnit; openUnit = null; renderLm(); $('lmView').querySelector(`[data-unit="${at.unit}"]`)?.focus(); return; }
    if (ex) { openLmExercise(ex.dataset.ex); return; }
    if (e.target.closest('[data-inst-lesson]') && instrumentLesson) { launch(instrumentLesson, { from: 'course' }); return; }
    const tool = e.target.closest('[data-inst-tool]');
    if (tool) {
      const u = lmUnit(openUnit.level, openUnit.unit);
      const block = u.blocks.find(b => b.kind === 'instrument');
      const inst = instrumentById(getState().instrument);
      openInstrumentTool(toolsFor(block.tools, familyOf(inst), inst)[Number(tool.dataset.instTool)], u);
      return;
    }
    if (e.target.closest('[data-lm-pdf]')) {
      const btn = e.target.closest('[data-lm-pdf]');
      btn.disabled = true;
      import('./pdf.js').then(m => m.unitPdf(lmUnit(openUnit.level, openUnit.unit)))
        .catch(() => toast('No se ha podido crear el PDF'))
        .finally(() => { btn.disabled = false; });
    }
  });
}

// El Aula abre una unidad con una sección o unos ejercicios resaltados (se pinta al entrar en Aprender)
export function focusTarget({ level, unit, section = null, ids = [] }) {
  openUnit = { level, unit };
  marked = { section, ids };
}
