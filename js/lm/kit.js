// Piezas de interfaz comunes a los ejercicios del curso: pentagrama de una partitura (con letra o nombres debajo),
// leyenda y fichas de corrección (✓ ≈ ✕, como en Dictados), botones de nombres de nota y utilidades de espera.
import { esc, icon } from '../ui.js';
import { rng } from '../generate.js';
import { noteCell, clefCell, gapCell, endCell, layoutTokens } from './staff-lm.js';
import { FIGURE_NAME, REST_NAME, letterText, LETTERS, noteText, barBeatsOf, stepOf } from './notes.js';

export const GLYPH = { ok: '✓', near: '≈', bad: '✕' };
export const MARK_TEXT = { ok: 'bien', near: 'casi', bad: 'mal' };
export const CLEF = { sol: 'treble', fa: 'bass', treble: 'treble', bass: 'bass' };

export const legendHtml = () => `<ul class="dict-legend lm-legend">
  <li><span class="dict-sw ok" aria-hidden="true">✓</span>Bien</li>
  <li><span class="dict-sw near" aria-hidden="true">≈</span>Cerca</li>
  <li><span class="dict-sw bad" aria-hidden="true">✕</span>Mal o falta</li></ul>`;

// Nombre accesible de una nota o silencio de la partitura (sin revelar nada que se pregunte: lo decide quien llama)
export function tokenLabel(t, nom, { pitch = true } = {}) {
  if (t.rest) return REST_NAME[t.dur.replace('.', '')] || 'Silencio';
  const fig = FIGURE_NAME[t.dur] || 'Nota';
  return pitch && t.name ? `${fig} ${noteText(t.name, nom)}` : fig;
}

// Pentagrama de una lista de notas: celdas en fila con barras de compás; under: texto bajo cada nota (letra, nombre)
// Matices del catálogo ({ compas, signo, hasta }) → texto bajo el primer tiempo de cada compás y calderones
const DYN_TEXT = { cresc: 'cresc.', dim: 'dim.' };
function dynamicsByBar(matices = []) {
  const by = {};
  matices.forEach(m => { (by[m.compas] ||= []).push(m); });
  return by;
}

// Pentagrama de una lista de notas: celdas en fila agrupadas por compases (un compás nunca se parte entre dos
// líneas), corcheas unidas por su barra, matices y reguladores debajo, calderones y comas de respiración encima.
// under: texto bajo cada nota (letra, nombre). dynamics: matices del catálogo. pickup: pulsos de la anacrusa.
export function staffHtml(tokens, { clef = 'treble', meter = null, marks = [], under = [], under2 = null, current = -1, bars = true, label = '', dynamics = null, pickup = 0, repeat = false } = {}) {
  const barBeats = bars && meter ? barBeatsOf(meter) : null;
  const lay = layoutTokens(tokens, { barBeats, pickup, clef });
  const dyn = dynamicsByBar(dynamics || []);
  const groups = [[`<span class="lm-sc">${clefCell(clef, meter)}</span>`]];
  let firstInBar = true;
  tokens.forEach((t, i) => {
    const L = lay[i];
    const barNo = L.bar + 1;
    const lastOfBar = L.barEnd || i === tokens.length - 1;
    const signs = firstInBar ? (dyn[barNo] || []).filter(m => m.signo !== 'calderon') : [];
    const fermata = lastOfBar && (dyn[barNo] || []).some(m => m.signo === 'calderon');
    const cls = ['lm-sc', marks[i] || '', i === current ? 'lm-now' : ''].join(' ');
    // cresc. / dim. con «hasta»: la línea de guiones sigue bajo cada nota hasta el último compás que abarca
    const swell = !signs.length && (dynamics || []).some(m => DYN_TEXT[m.signo] && m.hasta && barNo >= m.compas && barNo <= m.hasta);
    const dynHtml = signs.length ? `<span class="lm-dyn" lang="it">${signs.map(m => esc(DYN_TEXT[m.signo] || m.signo)).join(' ')}</span>` : swell ? '<span class="lm-dyn lm-dyn-ext" aria-hidden="true">- - -</span>' : '';
    groups[groups.length - 1].push(`<span class="${cls}" data-i="${i}">${noteCell({ ...t, clef, mark: marks[i] || null, beam: L.beam, up: L.up, fermata, breath: !!t.breath })}${dynHtml}${under[i] !== undefined ? `<span class="lm-under">${esc(under[i])}</span>` : ''}${under2 && under2[i] !== undefined ? `<span class="lm-under lm-under2">${esc(under2[i])}</span>` : ''}</span>`);
    firstInBar = false;
    if (L.barEnd) {
      groups[groups.length - 1].push(`<span class="lm-sc">${gapCell(true, null, 14)}</span>`);
      groups.push([]);
      firstInBar = true;
    }
  });
  groups[groups.length - 1].push(`<span class="lm-sc">${endCell(repeat)}</span>`);
  const html = groups.filter(g => g.length).map(g => `<span class="lm-bargroup">${g.join('')}</span>`).join('');
  return `<div class="lm-staff${tight(tokens, clef, marks, dynamics) ? ' lm-tight' : ''}"${label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"'}>${html}</div>`;
}

// Sistema de dos (o más) pentagramas unidos, compás a compás: la voz 1 arriba y la 2 abajo, con la clave, el compás
// y una llave al principio de cada renglón, y la barra de compás a la misma altura en las dos voces (cada compás es
// una columna). voices: [{ tokens, label, marks }]. Es lo que se lee a dos voces (ostinato de la app + voz del alumno).
export function systemHtml(voices, { meter, pickup = 0, clef = 'treble', label = '' } = {}) {
  const barBeats = meter ? barBeatsOf(meter) : null;
  const key = x => Math.round(x * 1000);
  // cada voz: sus notas por compás con el instante en que suenan (las notas a la vez van en la misma columna)
  const voiceBars = voices.map(v => {
    const lay = layoutTokens(v.tokens, { barBeats, pickup, clef });
    let at = 0;
    const bars = [];
    v.tokens.forEach((t, i) => {
      const start = t.start ?? at;
      at = start + (t.beats ?? 0);
      (bars[lay[i].bar] ||= []).push({ start, html: `<span class="lm-sc ${(v.marks || [])[i] || ''}">${noteCell({ ...t, clef, mark: (v.marks || [])[i] || null, beam: lay[i].beam, up: lay[i].up, breath: !!t.breath })}</span>` });
    });
    return bars;
  });
  const count = Math.max(...voiceBars.map(b => b.length));
  const cols = Array.from({ length: count }, (_, b) => {
    const last = b === count - 1;
    // rejilla común del compás: todos los instantes en que empieza alguna nota de alguna voz
    const slots = [...new Set(voiceBars.flatMap(bars => (bars[b] || []).map(n => key(n.start))))].sort((x, y) => x - y);
    const rows = voiceBars.map(bars => {
      const by = new Map((bars[b] || []).map(n => [key(n.start), n.html]));
      const cells = slots.map(k => by.get(k) || `<span class="lm-sc lm-syshole" aria-hidden="true">${noteCell({ step: null })}</span>`).join('');
      return `<span class="lm-sysrow">${b === 0 ? `<span class="lm-sc">${clefCell(clef, meter)}</span>` : ''}${cells}<span class="lm-sc">${last ? endCell(false) : gapCell(true, null, 14)}</span></span>`;
    }).join('');
    return `<span class="lm-sysbar${b === 0 ? ' lm-sysstart' : ''}" data-sysbar="${b}">${rows}</span>`;
  }).join('');
  const names = voices.map(v => v.label).filter(Boolean).join(' · ');
  return `<div class="lm-system" role="img" aria-label="${esc(label || names)}">${cols}</div>`;
}

// Sin líneas adicionales, marcas ni matices, el pentagrama no necesita el aire de arriba y de abajo de sus celdas:
// los renglones se juntan (clase lm-tight). Notas de do4 a re5 en clave de sol
const TIGHT_LOW = stepOf('C4');
const TIGHT_HIGH = stepOf('D5');
export function tight(tokens, clef = 'treble', marks = [], dynamics = null) {
  return clef === 'treble' && !(marks || []).some(Boolean) && !(dynamics && dynamics.length)
    && tokens.every(t => t.rest || t.step === undefined || (t.step >= TIGHT_LOW && t.step <= TIGHT_HIGH));
}

// Comas de respiración (n.º de compás, desde 1): la última nota de esos compases lleva la coma
export function withBreaths(tokens, comas = [], pickup = 0) {
  if (!comas.length) return tokens;
  const bars = tokens.map(t => t.bar + (pickup ? 0 : 1));
  // la coma va entre dos notas, dentro de la pieza: nunca sobre un silencio (ahí ya se respira) ni al final
  return tokens.map((t, i) => (comas.includes(bars[i]) && i < tokens.length - 1 && bars[i + 1] !== bars[i] && !t.rest ? { ...t, breath: true } : t));
}

// Fichas de corrección (una por elemento), con signo además del color
export function chipsHtml(marks, labels = []) {
  return `<div class="dict-chips lm-chips" role="list">${marks.map((m, i) => `<span role="listitem" class="dict-chip ${m}" aria-label="${esc(`${labels[i] || `${i + 1}`}: ${MARK_TEXT[m]}`)}"><span aria-hidden="true">${GLYPH[m]}</span><small aria-hidden="true">${i + 1}</small></span>`).join('')}</div>`;
}

// Botones con los nombres de nota (Do Re Mi… o C D E…)
export function nameButtons(letters = LETTERS, nom = 'eu', attr = 'data-name') {
  return `<div class="lm-names" role="group" aria-label="Nombres de nota">${letters.map(l => `<button type="button" class="lm-name" ${attr}="${l}">${esc(letterText(l, nom))}</button>`).join('')}</div>`;
}

export const playButton = (id, text = 'Escuchar') => `<button type="button" class="btn ghost lm-play" id="${id}"><span class="ic">${icon('speaker')}</span>${esc(text)}</button>`;

// Barajado con semilla (el mismo ejercicio sale igual para toda la clase)
export function shuffle(list, seed) {
  const r = rng(seed);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const seedOf = text => [...String(text)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

// Espera a que se pulse un botón del contenedor (resuelve con el botón)
export function onceClick(host, selector) {
  return new Promise(resolve => {
    const handler = e => {
      const b = e.target.closest(selector);
      if (!b || !host.contains(b) || b.disabled) return;
      host.removeEventListener('click', handler);
      resolve(b);
    };
    host.addEventListener('click', handler);
  });
}

// «Continuar» tras la corrección de una parte
export async function continueButton(host, text = 'Continuar') {
  const box = document.createElement('div');
  box.className = 'controls lm-next';
  box.innerHTML = `<button type="button" class="btn" data-lm-next>${esc(text)}</button>`;
  host.append(box);
  box.querySelector('button').focus();
  await onceClick(box, '[data-lm-next]');
  box.remove();
}

// Mensaje de corrección de una pregunta (signo + texto)
export function whyHtml(mark, why = '') {
  const lead = mark === 'ok' ? '¡Correcto!' : mark === 'near' ? 'Casi.' : 'No exactamente.';
  return `<p class="quiz-why lm-why ${mark === 'ok' ? 'right' : 'wrong'}" role="status"><span class="dict-sw ${mark}" aria-hidden="true">${GLYPH[mark]}</span> <span>${lead}</span>${why ? ` <span>${esc(why)}</span>` : ''}</p>`;
}
