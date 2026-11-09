// Piezas de interfaz comunes a los ejercicios del curso: pentagrama de una partitura (con letra o nombres debajo),
// leyenda y fichas de corrección (✓ ≈ ✕, como en Dictados), botones de nombres de nota y utilidades de espera.
import { esc, icon } from '../ui.js';
import { rng } from '../generate.js';
import { noteCell, clefCell, gapCell, endCell, layoutTokens, repStartCell, repEndCell, timeCell, doubleBarCell, NOTE_W } from './staff-lm.js';
import { FIGURE_NAME, REST_NAME, letterText, LETTERS, noteText, barBeatsOf, stepOf, beamBeatsOf, accidentalSigns, ACC_SYMBOL, accOfName, keyAcc, isTriplet, isAmalgam, groupingOf, meterPlan } from './notes.js';
import { drawMarks, totalBars } from './form.js';

export const GLYPH = { ok: '✓', near: '≈', bad: '✕' };
export const MARK_TEXT = { ok: 'bien', near: 'casi', bad: 'mal' };
// Claves: sol, fa (4.ª) y, en el Nivel 4, do en 3.ª (alto), do en 4.ª (tenor) y fa en 3.ª (barítono)
export const CLEF = { sol: 'treble', fa: 'bass', treble: 'treble', bass: 'bass', do3: 'alto', do4: 'tenor', fa3: 'baritone', alto: 'alto', tenor: 'tenor', baritone: 'baritone' };

export const legendHtml = () => `<ul class="dict-legend lm-legend">
  <li><span class="dict-sw ok" aria-hidden="true">✓</span>Bien</li>
  <li><span class="dict-sw near" aria-hidden="true">≈</span>Cerca</li>
  <li><span class="dict-sw bad" aria-hidden="true">✕</span>Mal o falta</li></ul>`;

// Nombre accesible de una nota o silencio de la partitura (sin revelar nada que se pregunte: lo decide quien llama)
export function tokenLabel(t, nom, { pitch = true } = {}) {
  if (t.rest) return REST_NAME[t.dur.replace('.', '')] || 'Silencio';
  const fig = FIGURE_NAME[t.dur] || 'Nota';
  return pitch && t.name ? `${fig} ${noteText(t.name, nom)}${t.tiedFrom ? ' (ligada)' : ''}` : fig;
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
// Signos del D.S. al Coda sobre un compás: a la izquierda el signo (𝄋) o la Coda (𝄌); a la derecha «al Coda 𝄌» y «D.S. al Coda»
const dsMeta = m => ({
  ...(m.segno ? { dsL: '𝄋' } : m.coda ? { dsL: '𝄌 Coda' } : {}),
  ...(m.alCoda || m.ds ? { dsR: [m.alCoda ? 'al Coda 𝄌' : '', m.ds ? 'D.S. al Coda' : ''].filter(Boolean).join(' · ') } : {}),
});
// Nivel 4: chords (acordes sobre el pentagrama, uno por compás o una lista), ornaments (adornos), agrupacion y agrupaciones
// (reparto de las corcheas en 5/8, 7/8…) y los cambios de compás (@time) y los tresillos, que salen de las propias fichas
export function staffHtml(tokens, { clef = 'treble', meter = null, marks = [], under = [], under2 = null, current = -1, bars = true, label = '', dynamics = null, pickup = 0, repeat = false, armadura = 0, form = null, pulso = null, given = 0, chords = null, ornaments = null, agrupacion = null, agrupaciones = null } = {}) {
  const barBeats = bars && meter ? barBeatsOf(meter) : null;
  const pulse = meter ? beamBeatsOf(meter, pulso) : pulso === 'q.' ? 1.5 : 1;
  const plan = bars && meter ? meterPlan(tokens, meter) : null;
  const groupP = { agrupacion, agrupaciones };
  const meterAt = b => (plan ? plan.meters[b] : meter);
  const grouping = bars && meter && (plan || isAmalgam(meter) || agrupacion || agrupaciones) ? b => (meterAt(b) ? groupingOf(meterAt(b), groupP, b) : null) : null;
  const lay = layoutTokens(tokens, { barBeats, pickup, clef, pulse, plan, grouping });
  // adornos: el nº de nota (sin contar los silencios) → ficha
  const ornAt = {};
  if (ornaments && ornaments.length) { let k = -1; tokens.forEach((tk, i) => { if (!tk.rest) { k++; const o = ornaments.find(x => x.indice === k); if (o) ornAt[i] = { signo: o.signo, direccion: o.direccion }; } }); }
  // acordes: por compás (desde 1), uno o varios; cada uno va sobre la primera ficha que empieza a partir de su parte del compás
  const chordAt = {};
  if (chords && chords.length) {
    const barOfI = i => lay[i].bar - (pickup ? 1 : 0);
    const seen = {};
    tokens.forEach((tk, i) => {
      const b = barOfI(i);
      const list = [].concat(chords[b] || []);
      if (b < 0 || !list.length) return;
      const barStart = tokens.find((x, j) => barOfI(j) === b).start ?? 0;
      const size = plan ? plan.sizes[lay[i].bar] : barBeats || 4;
      list.forEach((c, k) => { if (!seen[`${b}:${k}`] && (tk.start ?? 0) >= barStart + (k * size) / list.length - 1e-6) { seen[`${b}:${k}`] = true; chordAt[i] = chordAt[i] ? `${chordAt[i]} ${c}` : c; } });
    });
  }
  const dyn = dynamicsByBar(dynamics || []);
  // alteraciones que se dibujan (las de la armadura no) y largo de cada ligadura de prolongación
  const signs = accidentalSigns(tokens, lay.map(L => L.bar), armadura);
  const total = form ? totalBars(tokens, pickup) : 0;
  const fm = form ? drawMarks(form, total) : {};
  const groups = [[`<span class="lm-sc">${clefCell(clef, meter, armadura)}</span>`]];
  const meta = [{}];
  let firstInBar = true;
  tokens.forEach((t, i) => {
    const L = lay[i];
    const barNo = L.bar + 1;
    const fnum = pickup ? L.bar : L.bar + 1; // número de compás en la forma (0 = anacrusa)
    const fmark = fm[fnum] || null;
    if (firstInBar && fmark) {
      Object.assign(meta[meta.length - 1], fmark.volta ? { volta: fmark.volta, opens: fmark.voltaOpens } : {}, fmark.fine ? { fine: true } : {}, dsMeta(fmark));
      if (fmark.start) groups[groups.length - 1].push(`<span class="lm-sc">${repStartCell()}</span>`);
    }
    const lastOfBar = L.barEnd || i === tokens.length - 1;
    const barDyn = firstInBar ? (dyn[barNo] || []).filter(m => m.signo !== 'calderon') : [];
    const fermata = lastOfBar && (dyn[barNo] || []).some(m => m.signo === 'calderon');
    const cls = ['lm-sc', marks[i] || '', i === current ? 'lm-now' : ''].join(' ');
    // cresc. / dim. con «hasta»: la línea de guiones sigue bajo cada nota hasta el último compás que abarca
    const swell = !barDyn.length && (dynamics || []).some(m => DYN_TEXT[m.signo] && m.hasta && barNo >= m.compas && barNo <= m.hasta);
    const dynHtml = barDyn.length ? `<span class="lm-dyn" lang="it">${barDyn.map(m => esc(DYN_TEXT[m.signo] || m.signo)).join(' ')}</span>` : swell ? '<span class="lm-dyn lm-dyn-ext" aria-hidden="true">- - -</span>' : '';
    // la ligadura llega hasta la nota que sigue (si cruza la barra de compás, también el hueco de la barra)
    // ligadura de expresión: de esta nota a la que cierra el paréntesis (la barra de compás añade su hueco)
    let slurLen = 0;
    if (t.slurStart) {
      let j = i;
      while (j < tokens.length - 1 && !tokens[j].slurEnd) j++;
      if (j > i) slurLen = (j - i) * NOTE_W + lay.slice(i, j).filter(x => x.barEnd).length * 14;
    }
    const tieLen = t.tie ? (tokens[i + 1] && lay[i + 1].bar !== L.bar ? NOTE_W + 14 : NOTE_W) : 0;
    groups[groups.length - 1].push(`<span class="${cls}" data-i="${i}">${noteCell({ ...t, clef, mark: marks[i] || null, beam: L.beam, up: L.up, fermata, breath: !!t.breath, acc: signs[i], tie: tieLen, slur: slurLen, given: i < given, tuplet: L.tuplet, chord: chordAt[i] || null, ornament: ornAt[i] || null })}${dynHtml}${under[i] !== undefined ? `<span class="lm-under${under[i] === '_' ? ' lm-melisma' : ''}">${esc(under[i])}</span>` : ''}${under2 && under2[i] !== undefined ? `<span class="lm-under lm-under2">${esc(under2[i])}</span>` : ''}</span>`);
    firstInBar = false;
    if (L.barEnd) {
      const changes = !!plan && plan.meters[L.bar + 1] !== undefined && plan.meters[L.bar + 1] !== plan.meters[L.bar];
      groups[groups.length - 1].push(`<span class="lm-sc">${fmark && fmark.end ? repEndCell() : changes ? doubleBarCell(14) : gapCell(true, null, 14)}</span>`);
      groups.push(changes ? [`<span class="lm-sc" data-meter="${plan.meters[L.bar + 1]}">${timeCell(plan.meters[L.bar + 1])}</span>`] : []);
      meta.push({});
      firstInBar = true;
    }
  });
  const lastMark = form ? fm[pickup ? lay[lay.length - 1]?.bar : (lay[lay.length - 1]?.bar ?? 0) + 1] : null;
  if (lastMark && (lastMark.volta || lastMark.fine)) Object.assign(meta[meta.length - 1], lastMark.volta ? { volta: lastMark.volta, opens: lastMark.voltaOpens } : {}, lastMark.fine ? { fine: true } : {});
  if (lastMark) Object.assign(meta[meta.length - 1], dsMeta(lastMark));
  groups[groups.length - 1].push(`<span class="lm-sc">${endCell(repeat || !!(lastMark && lastMark.end))}</span>`);
  if (lastMark && lastMark.dc) groups[groups.length - 1].push('<span class="lm-dc" lang="it">D.C. al Fine</span>');
  const html = groups.map((g, k) => ({ g, m: meta[k] || {} })).filter(x => x.g.length).map(({ g, m }) => {
    const cls = ['lm-bargroup', m.volta ? `lm-volta${m.opens ? ' lm-volta-open' : ''}` : '', m.fine ? 'lm-fine' : '', m.dsL || m.dsR ? 'lm-dsmark' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}"${m.volta ? ` data-volta="${m.opens ? m.volta : ''}"` : ''}${m.fine ? ' data-fine="Fine"' : ''}${m.dsL ? ` data-ds-left="${m.dsL}"` : ''}${m.dsR ? ` data-ds-right="${m.dsR}"` : ''}>${g.join('')}</span>`;
  }).join('');
  return `<div class="lm-staff${tight(tokens, clef, marks, dynamics) && !chords && !ornaments && !plan ? ' lm-tight' : ''}"${armadura ? ` data-armadura="${armadura}"` : ''} data-clef="${clef}"${label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"'}>${html}</div>`;
}

// Sistema de dos (o más) pentagramas unidos, compás a compás: la voz 1 arriba y la 2 abajo, con la clave, el compás
// y una llave al principio de cada renglón, y la barra de compás a la misma altura en las dos voces (cada compás es
// una columna). voices: [{ tokens, label, marks }]. Es lo que se lee a dos voces (ostinato de la app + voz del alumno).
export function systemHtml(voices, { meter, pickup = 0, clef = 'treble', label = '', armadura = 0, pulso = null } = {}) {
  const barBeats = meter ? barBeatsOf(meter) : null;
  const pulse = meter ? beamBeatsOf(meter, pulso) : pulso === 'q.' ? 1.5 : 1;
  const key = x => Math.round(x * 1000);
  // cada voz: sus notas por compás con el instante en que suenan (las notas a la vez van en la misma columna)
  const voiceBars = voices.map(v => {
    const vc = v.clef || clef;
    const lay = layoutTokens(v.tokens, { barBeats, pickup, clef: vc, pulse });
    const signs = accidentalSigns(v.tokens, lay.map(L => L.bar), armadura);
    let at = 0;
    const bars = [];
    v.tokens.forEach((t, i) => {
      const start = t.start ?? at;
      at = start + (t.beats ?? 0);
      (bars[lay[i].bar] ||= []).push({ start, html: `<span class="lm-sc ${(v.marks || [])[i] || ''}">${noteCell({ ...t, clef: vc, mark: (v.marks || [])[i] || null, beam: lay[i].beam, up: lay[i].up, breath: !!t.breath, acc: signs[i] })}</span>`, });
    });
    return bars;
  });
  const count = Math.max(...voiceBars.map(b => b.length));
  const cols = Array.from({ length: count }, (_, b) => {
    const last = b === count - 1;
    // rejilla común del compás: todos los instantes en que empieza alguna nota de alguna voz
    const slots = [...new Set(voiceBars.flatMap(bars => (bars[b] || []).map(n => key(n.start))))].sort((x, y) => x - y);
    const rows = voiceBars.map((bars, vi) => {
      const vc = voices[vi].clef || clef;
      const by = new Map((bars[b] || []).map(n => [key(n.start), n.html]));
      const cells = slots.map(k => by.get(k) || `<span class="lm-sc lm-syshole" aria-hidden="true">${noteCell({ step: null })}</span>`).join('');
      return `<span class="lm-sysrow" data-clef="${vc}">${b === 0 ? `<span class="lm-sc">${clefCell(vc, meter, armadura)}</span>` : ''}${cells}<span class="lm-sc">${last ? endCell(false) : gapCell(true, null, 14)}</span></span>`;
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
  return clef === 'treble' && !(marks || []).some(Boolean) && !(dynamics && dynamics.length) && !tokens.some(t => isTriplet(t.dur))
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

// Nombre de una nota sin octava, con su alteración («B», «Bb», «F#») para el alumno: Si, Si♭, Fa♯ (o B, B♭, F♯)
const ACC_GLYPH = { '#': '♯', b: '♭' };
export const nameText = (name, nom) => letterText(name[0], nom) + (ACC_GLYPH[name[1]] || '');
// Las siete notas con la armadura puesta: con un bemol, el «si» es si♭; con un sostenido, el «fa» es fa♯
export const namesFor = (armadura = 0) => LETTERS.map(l => l + ({ '-1': 'b', 0: '', 1: '#' })[keyAcc(l, armadura)]);

// Botones con los nombres de nota (Do Re Mi… o C D E…); cada uno puede llevar su alteración («Bb»)
export function nameButtons(letters = LETTERS, nom = 'eu', attr = 'data-name') {
  return `<div class="lm-names" role="group" aria-label="Nombres de nota">${letters.map(l => `<button type="button" class="lm-name" ${attr}="${l}">${esc(nameText(l, nom))}</button>`).join('')}</div>`;
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
