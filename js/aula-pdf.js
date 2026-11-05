// Informe trimestral del Aula en PDF: una página A4 por alumno con la nota de 1 a 10 de cada apartado, minutos,
// tareas, errores frecuentes y las observaciones del profesor. Texto en el idioma de la app (t()).
import { createPdf } from './pdf-writer.js';
import { sharePdf } from './pdf-export.js';
import { t } from './i18n.js';
import { instrumentById } from './instruments.js';
import { termReport, termLabel, gradeWord, DAYS_PER_WEEK_GOAL } from './aula-report.js';
import { mistakeLabel } from './aula-temario.js';

const LEFT = 18;
const LINE = 6.5;
const MAX_TASKS = 14;
const WRAP = 95;
const STATUS = { done: 'Hecha', out: 'Sin intentos', late: 'Vencida', progress: 'Empezada', todo: 'Sin empezar' };

function wrap(text, width = WRAP) {
  return String(text).split(/\n/).flatMap(par => par.split(' ').reduce((lines, word) => {
    const last = lines[lines.length - 1];
    if ((last + ' ' + word).trim().length > width) return [...lines, word];
    return [...lines.slice(0, -1), (last + ' ' + word).trim()];
  }, ['']));
}
const cut = (text, n) => (String(text).length > n ? String(text).slice(0, n - 1) + '…' : String(text));

function studentPage(doc, { cls, row, tasks, term, today, notes, lm }) {
  const rep = termReport({ summary: row.summary, tasks, uid: row.id, term, today });
  let y = 20;
  doc.page();
  doc.text(t('Informe trimestral'), LEFT, y, { size: 18, bold: true });
  doc.text(`${row.nickname} · ${t(instrumentById(row.instrument).name)}`, LEFT, y += 9, { size: 13, bold: true });
  doc.text(`${cls.name} · ${t(termLabel(term))}`, LEFT, y += 6, { size: 10, gray: 90 });
  doc.text(`${t('Minutos de práctica')}: ${rep.minutes}   ·   ${t('Días de práctica')}: ${rep.daysPracticed}   ·   ${t('Tareas hechas')}: ${rep.done}/${rep.assigned}   ·   ${t('Nota media')}: ${rep.overall ?? '—'}`, LEFT, y += 10, { size: 10 });
  y += 10;
  [[t('Apartado'), LEFT], ['%', 92], [t('Nota'), 108], [t('Calificación'), 124]].forEach(([h, x]) => doc.text(h, x, y, { size: 9, bold: true, gray: 70 }));
  rep.rows.forEach(r => {
    y += LINE + 1;
    doc.text(t(r.label), LEFT, y, { size: 11 });
    doc.text(r.pct === null ? '—' : `${r.pct}`, 92, y, { size: 11 });
    doc.text(r.grade === null ? '—' : `${r.grade}`, 108, y, { size: 11, bold: true });
    doc.text(t(gradeWord(r.grade)), 124, y, { size: 10 });
    doc.rect(158, y - 3.2, 34, 3.4, { gray: 225 });
    if (r.grade) doc.rect(158, y - 3.2, 34 * r.grade / 10, 3.4, { gray: r.grade >= 5 ? 90 : 160 });
  });
  y += 12;
  doc.text(t('Tareas del trimestre'), LEFT, y, { size: 12, bold: true });
  if (!rep.tasks.length) doc.text(t('Sin tareas este trimestre.'), LEFT, y += LINE, { size: 10, gray: 90 });
  rep.tasks.slice(0, MAX_TASKS).forEach(x => {
    y += LINE;
    doc.text(cut(x.title, 58), LEFT, y, { size: 10 });
    doc.text(x.pct === null ? '—' : `${x.pct} %`, 130, y, { size: 10 });
    doc.text(t(STATUS[x.status]), 150, y, { size: 10, gray: 70 });
  });
  if (rep.mistakes.length) {
    y += 11;
    doc.text(t('Errores frecuentes'), LEFT, y, { size: 12, bold: true });
    rep.mistakes.forEach(([code, n]) => { doc.text(`${t(mistakeLabel(code, lm.mistakes))} (${n})`, LEFT, y += LINE, { size: 10 }); });
  }
  if (notes) {
    y += 11;
    doc.text(t('Observaciones del profesor'), LEFT, y, { size: 12, bold: true });
    wrap(notes).slice(0, 8).forEach(line => doc.text(line, LEFT, y += 5.5, { size: 10 }));
  }
  wrap(t(`Baremo: nota = % ÷ 10, redondeado (5 = suficiente). Constancia: ${DAYS_PER_WEEK_GOAL} días de práctica por semana = 100 %. Las competencias salen de los ejercicios de Lenguaje Musical del trimestre.`), 120)
    .forEach((line, i) => doc.text(line, LEFT, 274 + i * 4, { size: 7.5, gray: 110 }));
}

export async function classPdf({ cls, rows, tasks, term, today, notes = '', lm }) {
  if (!rows.length) throw new Error(t('No hay alumnos en la clase.'));
  const doc = createPdf();
  rows.forEach(row => studentPage(doc, { cls, row, tasks, term, today, notes, lm }));
  const who = rows.length === 1 ? rows[0].nickname : cls.name;
  const filename = `${t('Informe')}-${String(who).replace(/[^\w-]+/g, '-')}-${term.id}.pdf`;
  await sharePdf(doc.footer((n, total) => `Band Flow · ${cls.name} · ${n}/${total}`).blob(), filename, t('Informe trimestral'));
}
