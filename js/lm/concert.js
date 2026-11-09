// Concierto final y diploma del curso de Lenguaje Musical (Nivel 4, unidad 8). El concierto son tres piezas del curso, en el
// orden que elige el alumno; cada una se canta con su ejercicio de canción. La nota del concierto es la media de las tres.
// El diploma lo emite la app cuando el repaso de la unidad 8 está aprobado (≥ 60 %) y el concierto entregado
// (state.lm.diploma = { at, level: 4 }). Se puede imprimir con pdf-writer.js. La lógica (sin DOM) se prueba aparte.
import { esc } from '../ui.js';
import { getState, update } from '../store.js';
import { lmUnit, lmExercise } from './catalog.js';
import { lmState, bestOf } from './results.js';
import { gradeTen } from './grade.js';

export const DIPLOMA_PASS = 60;
export const CONCERT_LEVEL = 4;
export const CONCERT_UNIT = 8;
const REVIEW_IDS = ['lm4-u8-repaso-a-facil', 'lm4-u8-repaso-a-medio'];

// Las piezas del programa del concierto, en el orden del catálogo
export function programOf(unit = lmUnit(CONCERT_LEVEL, CONCERT_UNIT)) {
  const prog = (unit && unit.raw.concierto && unit.raw.concierto.programa) || [];
  return prog.map(p => ({ ...p, id: p.ejercicio }));
}
// Orden elegido por el alumno (lista de ids del programa) o el del catálogo si no hay o no es válido
export function orderedPieces(lm = lmState(), unit) {
  const prog = programOf(unit);
  const saved = lm.concierto && Array.isArray(lm.concierto.order) ? lm.concierto.order : null;
  if (saved && saved.length === prog.length && prog.every(p => saved.includes(p.id))) return saved.map(id => prog.find(p => p.id === id));
  return prog;
}
// Mejor porcentaje de cada pieza: el de su ejercicio (Fácil o Media, el mejor). null si aún no se ha cantado
export function pieceBest(piece, lm = lmState()) {
  const ids = [piece.id, piece.id.replace(/-(facil|medio)$/, m => (m === '-medio' ? '-facil' : '-medio'))];
  const found = ids.map(id => lm.best[id]).filter(Boolean);
  return found.length ? Math.max(...found.map(b => b.pct)) : null;
}
// Nota del concierto: la media de las tres piezas (null mientras falte alguna)
export function concertPct(lm = lmState(), unit) {
  const pieces = orderedPieces(lm, unit);
  const marks = pieces.map(p => pieceBest(p, lm));
  return marks.length && marks.every(m => m !== null) ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;
}
export const concertGrade = (pct, variant = 'medio') => (pct === null ? null : gradeTen(pct, variant));
// ¿Está aprobado el repaso final? (Fácil o Media, con el 60 %)
export const reviewPassed = (lm = lmState()) => REVIEW_IDS.some(id => lm.best[id] && lm.best[id].pct >= DIPLOMA_PASS);
// Estado del diploma: pendiente de repaso, de concierto, listo para emitir o ya emitido
export function diplomaStatus(lm = lmState()) {
  if (lm.diploma) return 'emitido';
  const review = reviewPassed(lm);
  const delivered = !!(lm.concierto && lm.concierto.at);
  return review && delivered ? 'listo' : !review && !delivered ? 'faltan-ambos' : review ? 'falta-concierto' : 'falta-repaso';
}
// Emite el diploma si procede; devuelve el estado de lm nuevo (o el mismo)
export function issueDiploma(lm = lmState(), at = Date.now()) {
  if (lm.diploma || diplomaStatus(lm) !== 'listo') return lm;
  return { ...lm, diploma: { at, level: CONCERT_LEVEL } };
}
// Entrega del concierto: guarda el orden, la nota y el momento, y emite el diploma si ya está el repaso
export function deliverState(lm, order, at = Date.now()) {
  const next = { ...lm, concierto: { at, order, pct: concertPct({ ...lm, concierto: { order } }) } };
  return issueDiploma(next, at);
}
export function deliverConcert(order, at = Date.now()) {
  const next = deliverState(lmState(), order, at);
  update({ lm: next });
  return next;
}
export function saveOrder(order) {
  const lm = lmState();
  update({ lm: { ...lm, concierto: { ...(lm.concierto || {}), order } } });
}
// Tras un repaso aprobado, por si el concierto ya estaba entregado
export function refreshDiploma() {
  const lm = lmState();
  const next = issueDiploma(lm);
  if (next !== lm) update({ lm: next });
  return next;
}

const STATUS_TEXT = {
  'faltan-ambos': 'Para el diploma te faltan el repaso final aprobado (60 %) y entregar el concierto.',
  'falta-repaso': 'Para el diploma te falta aprobar el repaso final de esta unidad (60 %).',
  'falta-concierto': 'Para el diploma te falta entregar el concierto.',
  listo: 'Tienes todo para el diploma.',
};

// ---------- Pintado (unidad 8 del nivel 4) ----------
export function concertHtml(unit) {
  const lm = lmState();
  const pieces = orderedPieces(lm, unit);
  const pct = concertPct(lm, unit);
  const status = diplomaStatus(lm);
  const c = unit.raw.concierto;
  return `<section class="lm-concert" aria-labelledby="lmConcertTitle"><h3 id="lmConcertTitle">Concierto final</h3>
    <p>${esc(c.criterios)}</p>
    <ol class="lm-concert-list">${pieces.map((p, k) => {
      const b = pieceBest(p, lm);
      return `<li class="lm-concert-piece" data-piece="${esc(p.id)}"><b>${k + 1}. ${esc(p.pieza)}</b><small>${esc(p.pide)}</small>
        <span class="lm-concert-best">${b === null ? 'Sin cantar' : `${b} %`}</span>
        <span class="controls"><button type="button" class="btn ghost small" data-ex="${esc(p.id)}">Cantar (Media)</button>
        <button type="button" class="btn ghost small" data-ex="${esc(p.id.replace('-medio', '-facil'))}">Cantar (Fácil)</button>
        <button type="button" class="icon-btn" data-concert-up="${k}" aria-label="Subir ${esc(p.pieza)}"${k === 0 ? ' disabled' : ''}>↑</button>
        <button type="button" class="icon-btn" data-concert-down="${k}" aria-label="Bajar ${esc(p.pieza)}"${k === pieces.length - 1 ? ' disabled' : ''}>↓</button></span></li>`;
    }).join('')}</ol>
    <ul class="muted small">${(c.preparacion || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <p class="lm-concert-grade" aria-live="polite">${pct === null ? 'Nota del concierto: canta las tres piezas.' : `Nota del concierto: <b>${concertGrade(pct)}</b>/10 (${pct} %, la media de las tres piezas)`}</p>
    <div class="controls"><button type="button" class="btn" data-concert-send${pct === null ? ' disabled' : ''}>${lm.concierto && lm.concierto.at ? 'Entregar otra vez' : 'Entregar el concierto'}</button></div>
    ${lm.diploma ? diplomaHtml(lm.diploma) : `<p class="muted" id="lmDiplomaState">${esc(STATUS_TEXT[status])}</p>`}</section>`;
}
export function diplomaHtml(diploma) {
  const name = getState().nickname || 'Alumno o alumna';
  const date = new Date(diploma.at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<div class="lm-diploma" id="lmDiploma" role="region" aria-label="Diploma de Lenguaje musical"><h2>Diploma de Lenguaje musical</h2>
    <p>Band Flow certifica que</p><p><b class="lm-diploma-name">${esc(name)}</b></p>
    <p>ha completado los cuatro niveles del curso de Lenguaje musical, con su repaso final y su concierto.</p><p class="muted">${esc(date)}</p>
    <button type="button" class="btn ghost" data-diploma-pdf>Imprimir el diploma (PDF)</button></div>`;
}

// El diploma en PDF (A4): marco, título, nombre y fecha
export async function diplomaPdf(diploma = lmState().diploma) {
  const [{ createPdf }, { sharePdf }] = await Promise.all([import('../pdf-writer.js'), import('../pdf-export.js')]);
  const name = getState().nickname || 'Alumno o alumna';
  const doc = createPdf().page();
  doc.rect(12, 12, 186, 1.2, { gray: 90 }).rect(12, 284, 186, 1.2, { gray: 90 }).rect(12, 12, 1.2, 273, { gray: 90 }).rect(197, 12, 1.2, 273, { gray: 90 });
  doc.text('Band Flow', 105, 50, { size: 14, gray: 100, align: 'center' });
  doc.text('DIPLOMA DE LENGUAJE MUSICAL', 105, 80, { size: 24, bold: true, align: 'center' });
  doc.text('certifica que', 105, 110, { size: 14, gray: 80, align: 'center' });
  doc.text(name, 105, 135, { size: 26, bold: true, align: 'center' });
  doc.text('ha completado los cuatro niveles del curso de Lenguaje musical,', 105, 165, { size: 13, align: 'center' });
  doc.text('con su repaso final y su concierto.', 105, 175, { size: 13, align: 'center' });
  doc.text(new Date(diploma.at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), 105, 215, { size: 12, gray: 90, align: 'center' });
  const blob = doc.blob();
  return sharePdf(blob, 'diploma-lenguaje-musical.pdf', 'Diploma de Lenguaje musical');
}

// Para el Aula y las pruebas: las piezas del concierto como ejercicios reales
export const concertExercises = unit => programOf(unit).map(p => lmExercise(p.id)).filter(Boolean);
export { bestOf };
