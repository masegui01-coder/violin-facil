// Pentagrama para escribir varias notas (tocar líneas y espacios, elegir figura y alteración, borrar, con teclado) y los
// ejercicios que lo usan: tocar notas en el pentagrama, construir una escala, dictado escrito (ritmo, melodía e
// intervalos) y trazar barras. La corrección compara la ALTURA REAL (fa♯ no es fa), con la armadura puesta.
import { esc } from '../ui.js';
import { rng } from '../generate.js';
import { noteCell, gapCell, clefCell, endCell, stepAtY, STEP_LIMITS, layoutTokens, timeCell, doubleBarCell, NOTE_W } from './staff-lm.js';
import {
  FIGURE_BEATS, FIGURE_NAME, REST_NAME, nameOfStep, intervalNote, noteText, positionText, stepOf, scoreTokens, barBeatsOf, beamBeatsOf, resolvePitches,
  accidentalSigns, tokenMidi, tokenName, pitchName, meterPlan, groupingOf, isAmalgam,
} from './notes.js';
import { noteAtPosition } from './harmony.js';
import { gradeWriting, gradeBarlines, scaleMark, pctOf, mistakeCodes } from './grade.js';
import { gainsFor } from './gen.js';
import { staffHtml, onceClick, whyHtml, CLEF, tokenLabel, playButton, continueButton } from './kit.js';
import { playNotes, stopSound } from './sound.js';

const RHYTHM_STEP = { treble: 36, bass: 24, alto: 30, tenor: 30, baritone: 26 }; // Do5 / Mi3: la línea donde se escribe el ritmo sin altura
const EXTRA_LISTEN_PENALTY = 5;
const DEFAULT_STEP = { treble: 34, bass: 22, alto: 28, tenor: 28, baritone: 24 };
// lo que se puede escribir: del do grave al la agudo en clave de sol; del do2 al sol4 en clave de fa
const WRITE_RANGE = { treble: ['C4', 'A5'], bass: ['C2', 'G4'] };
export const writeLimits = clef => (WRITE_RANGE[clef] ? WRITE_RANGE[clef].map(stepOf) : STEP_LIMITS(clef));
const RELEASE_MARGIN_PX = 24; // soltar el dedo más lejos de la celda cancela la nota fantasma
const ACC_LABEL = { '#': 'Sostenido', b: 'Bemol', n: 'Becuadro' };
const ACC_SIGN = { '#': '♯', b: '♭', n: '♮' };
const ACC_VALUE = { '#': 1, b: -1, n: 0 };

const figLabel = f => (f.startsWith('R') ? REST_NAME[f.slice(1)] : FIGURE_NAME[f]);
export const tokensToPlay = tokens => {
  let start = 0;
  return tokens.map(t => {
    const n = { rest: !!t.rest, start, beats: FIGURE_BEATS[t.dur], midi: t.rest ? 0 : tokenMidi(t) };
    start += n.beats;
    return n;
  });
};

// ---------- El escritor ----------
// opts: clef, figures (['q','h','Rq'…]; una sola = sin paleta), rhythmOnly (todas en la misma línea), max (notas),
// nom, say (anuncio para el lector de pantalla), meter, initial (notas de partida editables), extras () → { dynamics,
// pickup, repeat } (lo que se dibuja además: matices, anacrusa, barra de repetición), breath (botón de coma de respiración),
// armadura (0, -1, 1: con un bemol, «si» ya es si♭), accidentals (paleta ♯ ♭ ♮), given (notas dadas: en gris, no se borran),
// pulso ('q.' en 6/8), cursor (escalón inicial del cursor)
export function createStaffWriter(box, { clef = 'treble', figures = ['q'], rhythmOnly = false, max = 32, nom = 'eu', say = () => {}, meter: meter0 = null, initial = [], extras = () => ({}), breath = false, armadura: armadura0 = 0, accidentals = false, given = [], pulso = null, cursor: cursor0 = null, slurs = false, ties = false, meters = null, agrupacion = null, agrupaciones = null, meterChanges = false } = {}) {
  const [lo, hi] = writeLimits(clef);
  const clampStep = step => Math.max(lo, Math.min(hi, step));
  let meter = meter0;
  let armadura = armadura0;
  const fixed = given.map(t => ({ ...t, given: true }));
  let tokens = [...fixed, ...initial.map(t => ({ ...t }))];
  let figure = figures[0];
  let accSel = null;       // alteración elegida en la paleta ('#', 'b', 'n') para la próxima nota
  let sel = null;          // nota seleccionada (para cambiarla o borrarla)
  let cursor = cursor0 ?? (rhythmOnly ? RHYTHM_STEP[clef] : DEFAULT_STEP[clef]);
  let locked = false;
  let placedByPointer = false;
  const one = figures.length === 1;

  // Creatividad con cambios de compás: cada compás mide lo suyo. Una ficha con «barMeter» abre un compás nuevo si el anterior
  // está lleno; si no, el cambio no vale (el compás sigue como estaba)
  let nextMeter = null;
  function writtenPlan() {
    const bars = [];
    let cur = null;
    let filled = 0;
    tokens.forEach(t => {
      if (!cur || filled >= cur.size - 1e-6) {
        const m = t.barMeter || (cur ? cur.meter : meter);
        cur = { meter: m, size: barBeatsOf(m) };
        bars.push(cur);
        filled = 0;
      }
      filled += FIGURE_BEATS[t.dur] ?? 0;
    });
    // el compás que se abrirá a continuación, el último o el elegido, y unos cuantos más para las barras que se escriban
    const tail = bars.length && filled < bars[bars.length - 1].size - 1e-6 ? bars[bars.length - 1] : { meter: bars.length ? bars[bars.length - 1].meter : meter };
    const rest = Array.from({ length: 14 }, () => ({ meter: tail.meter, size: barBeatsOf(tail.meter) }));
    const all = [...bars, ...rest];
    return { sizes: all.map(b => b.size), meters: all.map(b => b.meter) };
  }
  // Altura real de cada ficha: la alteración elegida o, si no, la de la armadura y las anteriores del mismo compás
  const geometry = () => {
    const barBeats = meter ? barBeatsOf(meter) : null;
    const ext = extras() || {};
    // cambios de compás (Nivel 4): el compás de cada compás escrito; los que sobren, como el último
    const extended = meters && meters.length ? [...meters, ...Array(12).fill(meters[meters.length - 1])] : null;
    const plan = meterChanges ? writtenPlan() : extended ? { sizes: extended.map(barBeatsOf), meters: extended } : null;
    const grouping = meter && (plan || isAmalgam(meter) || agrupacion || agrupaciones) ? b => groupingOf(plan ? plan.meters[b] : meter, { agrupacion, agrupaciones }, b) : null;
    const lay = layoutTokens(tokens, { barBeats, pickup: ext.pickup || 0, clef, pulse: meter ? beamBeatsOf(meter, pulso) : pulso === 'q.' ? 1.5 : 1, plan, grouping });
    const res = rhythmOnly ? tokens : resolvePitches(tokens, { armadura, bars: lay.map(L => L.bar) });
    return { ext, lay, res, plan };
  };
  const describe = t => (t.rest ? REST_NAME[t.dur] : rhythmOnly ? FIGURE_NAME[t.dur] : `${FIGURE_NAME[t.dur]} ${noteText(tokenName(t), nom)}`);
  const cursorName = () => pitchName(cursor, armadura, accSel ? ACC_VALUE[accSel] : null);
  const cursorText = () => (rhythmOnly ? '' : `${noteText(cursorName(), nom)}, ${positionText(cursor, clef)}`);

  function render(focusSel = null) {
    const { ext, lay, res, plan } = geometry();
    const accs = rhythmOnly ? [] : accidentalSigns(res, lay.map(L => L.bar), armadura);
    // compases agrupados (no se parten entre líneas), corcheas con su barra, matices y calderón como se pintan
    const dyn = {};
    (ext.dynamics || []).forEach(m => { (dyn[m.compas] ||= []).push(m); });
    let open = true;
    let n = 0;
    const cells = res.map((t, i) => {
      const L = lay[i];
      const bar = L.bar + 1;
      const signs = open ? (dyn[bar] || []).filter(m => m.signo !== 'calderon').map(m => ({ cresc: 'cresc.', dim: 'dim.' })[m.signo] || m.signo) : [];
      const fermata = (L.barEnd || i === tokens.length - 1) && (dyn[bar] || []).some(m => m.signo === 'calderon');
      open = L.barEnd;
      // ligadura de prolongación (misma altura) o de expresión (otra altura) hasta la nota que sigue
      const next = res[i + 1];
      const reach = next ? NOTE_W + (L.barEnd ? 14 : 0) : 0;
      const tieLen = t.tie && next && !t.rest && !next.rest && tokenMidi(next) === tokenMidi(t) ? reach : 0;
      const slurLen = t.slur && next && !t.rest && !next.rest && tokenMidi(next) !== tokenMidi(t) ? reach : 0;
      const svg = noteCell({ ...t, clef, beam: L.beam, up: L.up, fermata, breath: !!t.breath, acc: accs[i], given: !!t.given, tie: tieLen, slur: slurLen, tuplet: L.tuplet });
      const btn = t.given
        ? `<span class="lm-sc lm-note-btn given" role="img" aria-label="${esc(`Nota dada: ${describe(t)}`)}">${svg}</span>`
        : `<button type="button" class="lm-sc lm-note-btn${i === sel ? ' sel' : ''}" data-idx="${i}" aria-pressed="${i === sel}" aria-label="${esc(`${++n}: ${describe(t)}${t.breath ? ', respiración' : ''}`)}">${svg}${signs.length ? `<span class="lm-dyn" lang="it">${esc(signs.join(' '))}</span>` : ''}</button>`;
      const changes = L.barEnd && plan && plan.meters[L.bar + 1] !== plan.meters[L.bar];
      return btn + (L.barEnd ? `<span class="lm-sc">${changes ? doubleBarCell(14) : gapCell(true, null, 14)}</span></span><span class="lm-bargroup">${changes ? `<span class="lm-sc">${timeCell(plan.meters[L.bar + 1])}</span>` : ''}` : '');
    }).join('');
    const isRest = figure.startsWith('R');
    const ghost = isRest || rhythmOnly ? null : cursor;
    box.querySelector('.lm-w-staff').dataset.armadura = armadura ? String(armadura) : '';
    box.querySelector('.lm-w-staff').dataset.clef = clef;
    box.querySelector('.lm-w-staff').innerHTML = `<span class="lm-bargroup"><span class="lm-sc" aria-hidden="true">${clefCell(clef, meter, armadura)}</span>${cells}${tokens.length < max && !locked ? `<button type="button" class="lm-sc lm-insert" data-insert data-step="${cursor}" aria-label="${esc(`Añadir ${figLabel(figure).toLowerCase()}${rhythmOnly || isRest ? '' : `: ${cursorText()}`}. Toca una línea o un espacio; flechas arriba y abajo para cambiar la nota`)}">${noteCell({ clef, dur: isRest ? figure.slice(1) : figure, rest: isRest, ghost, step: null })}</button>` : ''}${ext.repeat ? `<span class="lm-sc" aria-hidden="true">${endCell(true)}</span>` : ''}</span>`;
    box.querySelectorAll('[data-fig]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fig === figure)));
    box.querySelectorAll('[data-acc]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.acc === accSel)); b.disabled = locked || isRest; });
    box.querySelector('[data-del]').disabled = locked || !tokens.some(t => !t.given);
    box.querySelectorAll('[data-up],[data-down]').forEach(b => { b.disabled = locked || rhythmOnly; });
    if (focusSel !== null) box.querySelector(focusSel)?.focus();
    const label = box.querySelector('.lm-w-cursor');
    if (label) label.textContent = isRest ? '' : cursorText();
  }

  function add(step = cursor) {
    if (locked || tokens.length >= max) return;
    const isRest = figure.startsWith('R');
    const t = isRest ? { rest: true, dur: figure.slice(1) } : { step: rhythmOnly ? RHYTHM_STEP[clef] : step, dur: figure, ...(accSel && !rhythmOnly ? { acc: accSel } : {}) };
    tokens = [...tokens, nextMeter && meterChanges ? { ...t, barMeter: nextMeter } : t];
    nextMeter = null;
    sel = null;
    accSel = null;
    render('[data-insert]');
    const placed = geometry().res[tokens.length - 1];
    say(`${describe(placed)} añadida`);
    if (!box.querySelector('[data-insert]')) box.querySelector('[data-check]')?.focus();
  }
  function moveCursor(d) {
    if (rhythmOnly) return;
    if (sel !== null && !tokens[sel].rest) {
      const step = Math.max(lo, Math.min(hi, tokens[sel].step + d));
      tokens = tokens.map((t, i) => (i === sel ? { ...t, step } : t));
      render(`[data-idx="${sel}"]`);
      say(describe(geometry().res[sel]));
      return;
    }
    cursor = Math.max(lo, Math.min(hi, cursor + d));
    render(box.contains(document.activeElement) ? '[data-insert]' : null);
    say(cursorText());
  }
  function remove() {
    if (locked) return;
    let i = sel;
    if (i === null) { for (let k = tokens.length - 1; k >= 0; k--) if (!tokens[k].given) { i = k; break; } }
    if (i === null || tokens[i].given) return;
    const gone = geometry().res[i];
    tokens = tokens.filter((_, k) => k !== i);
    sel = null;
    render('[data-insert]');
    say(`${describe(gone)} borrada`);
  }
  // alteración de la paleta: a la nota seleccionada (otra vez la misma, la quita) o a la próxima que se escriba
  function pickAcc(a) {
    if (locked) return;
    if (sel !== null && !tokens[sel].rest && !tokens[sel].given) {
      tokens = tokens.map((t, i) => (i === sel ? (t.acc === a ? { ...t, acc: undefined } : { ...t, acc: a }) : t));
      render(`[data-idx="${sel}"]`);
      say(describe(geometry().res[sel]));
      return;
    }
    accSel = accSel === a ? null : a;
    render(`[data-acc="${a}"]`);
    say(accSel ? `${ACC_LABEL[a]} para la próxima nota` : 'Sin alteración');
  }

  box.innerHTML = `${one ? '' : `<div class="seg wrap lm-figs" role="group" aria-label="Figura">${figures.map(f => `<button type="button" data-fig="${f}" aria-pressed="false"><span class="lm-fig-ic" aria-hidden="true">${noteCell({ clef, dur: f.startsWith('R') ? f.slice(1) : f, rest: f.startsWith('R'), step: f.startsWith('R') ? null : DEFAULT_STEP[clef] + 2, w: 30 })}</span>${esc(figLabel(f))}</button>`).join('')}</div>`}
    ${accidentals && !rhythmOnly ? `<div class="lm-acc-palette" role="group" aria-label="Alteración">${['#', 'b', 'n'].map(a => `<button type="button" class="btn ghost lm-acc-btn" data-acc="${a}" aria-pressed="false" aria-label="${ACC_LABEL[a]}"><span aria-hidden="true">${ACC_SIGN[a]}</span></button>`).join('')}</div>` : ''}
    <div class="lm-w-staff lm-staff" role="group" aria-label="Pentagrama para escribir"></div>
    ${rhythmOnly ? '' : '<p class="lm-w-cursor" aria-hidden="true"></p>'}
    <div class="controls lm-w-tools">
      <button type="button" class="btn ghost small" data-up aria-label="Nota más aguda">↑ Más aguda</button>
      <button type="button" class="btn ghost small" data-down aria-label="Nota más grave">↓ Más grave</button>
      <button type="button" class="btn ghost small" data-del>Borrar</button>
      ${breath ? '<button type="button" class="btn ghost small" data-breath>Coma de respiración</button>' : ''}
      ${slurs ? '<button type="button" class="btn ghost small" data-slur aria-label="Ligadura de expresión con la nota siguiente (la nota elegida o la última)">Ligadura de expresión ⌒</button>' : ''}
      ${ties ? '<button type="button" class="btn ghost small" data-tie aria-label="Ligadura de prolongación con la nota siguiente, si es la misma (la nota elegida o la última)">Ligadura de prolongación ⌣</button>' : ''}
    </div>`;
  if (rhythmOnly) box.querySelectorAll('[data-up],[data-down]').forEach(b => { b.hidden = true; });

  box.addEventListener('click', e => {
    if (locked) return;
    const fig = e.target.closest('[data-fig]');
    const ins = e.target.closest('[data-insert]');
    const note = e.target.closest('[data-idx]');
    const accBtn = e.target.closest('[data-acc]');
    if (fig) { figure = fig.dataset.fig; render(`[data-fig="${figure}"]`); return; }
    if (accBtn) { pickAcc(accBtn.dataset.acc); return; }
    if (e.target.closest('[data-up]')) { moveCursor(1); return; }
    if (e.target.closest('[data-down]')) { moveCursor(-1); return; }
    if (e.target.closest('[data-del]')) { remove(); return; }
    const link = e.target.closest('[data-slur],[data-tie]');
    if (link) {
      // la ligadura sale de la nota elegida (o de la última escrita) y llega a la siguiente; otra vez, se quita
      const key = link.hasAttribute('data-slur') ? 'slur' : 'tie';
      const i = sel ?? tokens.length - 1;
      if (i < 0 || tokens[i].rest || tokens[i].given) return;
      tokens = tokens.map((t, k) => (k === i ? { ...t, [key]: !t[key] } : t));
      render(sel !== null ? `[data-idx="${i}"]` : null);
      say(tokens[i][key] ? 'Ligadura puesta' : 'Ligadura quitada');
      return;
    }
    if (e.target.closest('[data-breath]')) {
      // la coma va detrás de la nota elegida (o de la última escrita); otra vez, se quita
      const i = sel ?? tokens.length - 1;
      if (i < 0) return;
      tokens = tokens.map((t, k) => (k === i ? { ...t, breath: !t.breath } : t));
      render(sel !== null ? `[data-idx="${i}"]` : null);
      say(tokens[i].breath ? 'Coma de respiración puesta' : 'Coma de respiración quitada');
      return;
    }
    if (ins && placedByPointer) { placedByPointer = false; return; }
    if (ins) {
      const svg = ins.querySelector('svg');
      // con el ratón o el dedo, la altura es donde se toca; con el teclado (clic sin posición), la del cursor
      const step = e.detail && !rhythmOnly ? clampStep(stepAtY(svg, e.clientY, clef)) : cursor;
      cursor = step;
      add(step);
      return;
    }
    if (note) {
      const i = Number(note.dataset.idx);
      sel = sel === i ? null : i;
      render(`[data-idx="${i}"]`);
      say(sel === null ? 'Nota sin seleccionar' : `Seleccionada: ${describe(geometry().res[i])}. Flechas para cambiarla, Suprimir para borrarla`);
    }
  });
  // la nota fantasma: aparece al apoyar el dedo (o el ratón), sigue por las líneas y los espacios con su nombre
  // debajo y se coloca al soltar. touch-action: none en la celda (CSS) para que arrastrar no sea desplazar la página
  let dragging = null;
  const ghostAt = (ins, clientY) => {
    if (figure.startsWith('R')) return;
    const step = clampStep(stepAtY(ins.querySelector('svg'), clientY, clef));
    if (step === cursor && ins.dataset.step === String(step)) return;
    cursor = step;
    ins.innerHTML = noteCell({ clef, dur: figure, ghost: cursor, step: null });
    ins.dataset.step = String(cursor);
    ins.setAttribute('aria-label', `Añadir ${figLabel(figure).toLowerCase()}: ${cursorText()}. Toca una línea o un espacio; flechas arriba y abajo para cambiar la nota`);
    const label = box.querySelector('.lm-w-cursor');
    if (label) label.textContent = cursorText();
  };
  box.addEventListener('pointerdown', e => {
    if (locked || rhythmOnly) return;
    const ins = e.target.closest('[data-insert]');
    if (!ins) return;
    dragging = ins;
    try { ins.setPointerCapture(e.pointerId); } catch { /* sin captura: se sigue igual */ }
    ghostAt(ins, e.clientY);
  });
  box.addEventListener('pointermove', e => {
    if (locked || rhythmOnly) return;
    const ins = dragging || e.target.closest('[data-insert]');
    if (ins) ghostAt(ins, e.clientY);
  });
  box.addEventListener('pointerup', e => {
    if (!dragging) return;
    const ins = dragging;
    dragging = null;
    placedByPointer = true; // el clic que llega después no añade otra (si no llega, se olvida enseguida)
    setTimeout(() => { placedByPointer = false; }, CLICK_AFTER_POINTER_MS);
    // soltar fuera de la celda (con un margen) es arrepentirse: no se escribe nada
    const r = ins.getBoundingClientRect();
    const out = e.clientX < r.left - RELEASE_MARGIN_PX || e.clientX > r.right + RELEASE_MARGIN_PX || e.clientY < r.top - RELEASE_MARGIN_PX || e.clientY > r.bottom + RELEASE_MARGIN_PX;
    if (out) { say('Nota cancelada'); return; }
    ghostAt(ins, e.clientY);
    add(cursor);
  });
  box.addEventListener('pointercancel', () => { dragging = null; });
  box.addEventListener('keydown', e => {
    if (locked) return;
    const onStaff = e.target.closest('[data-insert],[data-idx]');
    if (!onStaff) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); moveCursor(e.key === 'ArrowUp' ? 1 : -1); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); remove(); }
    else if (accidentals && !rhythmOnly && (e.key === '+' || e.key === '#')) { e.preventDefault(); pickAcc('#'); }
    else if (accidentals && !rhythmOnly && e.key === '-') { e.preventDefault(); pickAcc('b'); }
    else if (accidentals && !rhythmOnly && e.key === '0') { e.preventDefault(); pickAcc('n'); }
    else if (/^[1-9]$/.test(e.key) && figures[Number(e.key) - 1]) { figure = figures[Number(e.key) - 1]; render('[data-insert]'); say(figLabel(figure)); }
  });
  render();

  return {
    // las notas escritas por el alumno (sin las dadas), con su nombre y altura reales
    tokens: () => geometry().res.filter(t => !t.given),
    allTokens: () => geometry().res,
    givenCount: fixed.length,
    refresh: () => render(),
    setMeter(m) { meter = m; render(); },
    // el compás que tendrá el próximo compás que se empiece (cambio de compás en la creatividad)
    setNextMeter(m) { nextMeter = m; },
    plan: () => geometry().plan,
    setArmadura(a) { armadura = a; render(); },
    lock(marks = []) {
      locked = true;
      sel = null;
      render();
      box.querySelectorAll('[data-idx]').forEach((b, i) => {
        if (!marks[i]) return;
        b.classList.add(marks[i]);
        b.insertAdjacentHTML('beforeend', `<span class="lm-cell-mark ${marks[i]}" aria-hidden="true">${({ ok: '✓', near: '≈', bad: '✕' })[marks[i]]}</span>`);
      });
      box.querySelectorAll('[data-fig],[data-acc],[data-up],[data-down],[data-del],[data-breath],[data-slur],[data-tie]').forEach(b => { b.disabled = true; });
    },
  };
}

// ¿Pide esta respuesta alteraciones (o hay armadura)? Entonces el escritor lleva la paleta ♯ ♭ ♮. En el Nivel 2, desde
// la unidad 6 (donde se enseñan) siempre: así la paleta no delata cuál es la respuesta.
const hasAccidental = names => names.some(n => /^[A-G][#b]/.test(n));
export const wantsPalette = (env, names = [], armadura = 0) => !!armadura || hasAccidental(names) || env.level >= 3 || (env.level >= 2 && env.unit >= 6);

// ---------- Tocar notas en el pentagrama y construir una escala ----------
const BIG_STAFF_NOTES = 2;
const CLICK_AFTER_POINTER_MS = 400;
const noteTok = n => scoreTokens(`| ${n}w |`)[0];
export async function tocarPentagrama(host, item, env) {
  const clef = CLEF[item.clave] || 'treble';
  // escala que sube y baja de forma distinta (menor melódica): se escribe primero la subida y después la bajada
  const want = [...item.respuesta, ...(item.respuestaBajada || [])];
  const armadura = item.armadura || 0;
  const dada = (item.dada ? [].concat(item.dada) : []).map(noteTok);
  // una o dos notas: pentagrama al doble de alto (20 px por línea o espacio), para acertar con el dedo
  const big = want.length <= BIG_STAFF_NOTES;
  // «desdeClave»: la nota de partida se enseña en su clave (de do o de fa en 3.ª) y se escribe en la clave de la pregunta
  const source = item.desdeClave ? staffHtml([{ ...noteTok(`${noteAtPosition(item.desdeClave.posicion, CLEF[item.desdeClave.clave])}`), beats: 4 }], { clef: CLEF[item.desdeClave.clave], bars: false, label: `Una nota en clave de ${item.desdeClave.clave}` }) : '';
  host.innerHTML = `<h2 class="lm-q" tabindex="-1">${esc(item.q)}</h2>${source}${item.respuestaBajada ? '<p class="muted small">Escribe primero la subida y después la bajada, todo seguido.</p>' : ''}<div class="lm-writer${big ? ' lm-big' : ''}"></div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  const w = createStaffWriter(host.querySelector('.lm-writer'), {
    clef, figures: ['w'], max: want.length + dada.length, nom: env.nom, say: env.say, armadura, given: dada, accidentals: wantsPalette(env, [...want, ...dada.map(t => t.name)], armadura),
  });
  await onceClick(host, '[data-check]');
  const written = w.tokens();
  const wantMidi = want.map(n => noteTok(n).midi);
  // la altura real y también el nombre: do♯ no es re♭
  const marks = want.map((n, i) => (written[i] && tokenMidi(written[i]) === wantMidi[i] && written[i].step === stepOf(n) ? 'ok' : 'bad'));
  w.lock(marks);
  host.querySelector('[data-check]').remove();
  const mark = item.tipo === 'escala' ? scaleMark(wantMidi, written.map(tokenMidi)) : marks.every(m => m === 'ok') ? 'ok' : 'bad';
  const shown = want.map(n => noteText(n, env.nom)).join(' ');
  host.querySelector('.lm-feedback').innerHTML = `${mark === 'ok' ? '' : staffHtml(want.map(n => ({ ...noteTok(n), beats: 4 })), { clef, bars: false, armadura, label: `Respuesta: ${shown}` })}${whyHtml(mark, item.why || (mark === 'ok' ? '' : `Respuesta: ${shown}`))}`;
  const wrongAt = marks.findIndex(m => m === 'bad');
  return { mark, mistake: wrongAt < 0 ? null : written[wrongAt] ? `${want[wrongAt]}>${written[wrongAt].name}` : item.id || 'pentagrama' };
}

// ---------- Trazar barras de compás ----------
export async function barras(host, item, env) {
  const tokens = scoreTokens(`| ${item.secuencia} |`);
  const chosen = new Set();
  const draw = () => tokens.map((t, i) => `<span class="lm-sc">${noteCell({ ...t, clef: 'treble' })}</span>${i < tokens.length - 1
    ? `<button type="button" class="lm-sc lm-gap" data-gap="${i}" aria-pressed="${chosen.has(i)}" aria-label="${esc(`Barra entre la ${i + 1} y la ${i + 2}`)}">${gapCell(chosen.has(i))}</button>` : ''}`).join('');
  host.innerHTML = `<h2 class="lm-q" tabindex="-1">${esc(item.q)}</h2>
    <p class="muted small">Toca entre dos figuras para poner o quitar una barra.</p>
    <div class="lm-staff lm-bars-staff" role="group" aria-label="Figuras del ritmo">${draw()}</div>
    <p class="sr-only">${esc(tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', '))}</p>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  const staff = host.querySelector('.lm-bars-staff');
  const toggle = e => {
    const g = e.target.closest('[data-gap]');
    if (!g) return;
    const i = Number(g.dataset.gap);
    if (chosen.has(i)) chosen.delete(i); else chosen.add(i);
    staff.innerHTML = draw();
    staff.querySelector(`[data-gap="${i}"]`).focus();
    env.say(chosen.has(i) ? 'Barra puesta' : 'Barra quitada');
  };
  staff.addEventListener('click', toggle);
  await onceClick(host, '[data-check]');
  staff.removeEventListener('click', toggle);
  const g = gradeBarlines(item.respuesta, [...chosen]);
  const byGap = Object.fromEntries(g.marks.map(m => [m.gap, m]));
  staff.innerHTML = tokens.map((t, i) => `<span class="lm-sc">${noteCell({ ...t, clef: 'treble' })}</span>${i < tokens.length - 1
    ? `<span class="lm-sc lm-gap ${byGap[i] ? byGap[i].mark : ''}" aria-label="${byGap[i] ? esc(`Barra ${i + 1}: ${({ bien: 'bien', falta: 'falta', sobra: 'sobra' })[byGap[i].kind]}`) : ''}" ${byGap[i] ? 'role="img"' : 'aria-hidden="true"'}>${gapCell(item.respuesta.includes(i), byGap[i] ? (byGap[i].kind === 'bien' ? 'ok' : 'bad') : null)}</span>` : ''}`).join('');
  host.querySelector('[data-check]').remove();
  const mark = g.pct === 100 ? 'ok' : g.pct >= 50 ? 'near' : 'bad';
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || '');
  return { mark, pct: g.pct, mistake: g.mistakes[0] || null };
}

// ---------- Dictado escrito (ritmo o melodía) ----------
// params: partitura, compas, tempo, escuchas, tipo ('ritmico'|'melodico'), pista, clave, armadura; figuras: las que se pueden elegir
export async function dictadoEscrito(host, p, env) {
  const clef = CLEF[p.clave] || 'treble';
  const armadura = p.armadura || 0;
  const want = scoreTokens(p.partitura);
  const rhythmOnly = p.tipo === 'ritmico';
  // la paleta es la de la unidad (todas las figuras que ya se conocen), no solo las de la respuesta: así no da pistas
  const known = (p.figurasUnidad || []).map(f => (f === 'ee' ? 'e' : f === 'rq' ? 'Rq' : f)).filter(f => /^R?(w|h\.?|q\.?|e\.?|s)(:3)?$/.test(f));
  const figures = [...new Set([...want.map(t => (t.rest ? `R${t.dur}` : t.dur)), ...known])].sort((a, b) => (FIGURE_BEATS[b.replace('R', '')] - FIGURE_BEATS[a.replace('R', '')]) || (a.startsWith('R') ? 1 : -1));
  const listens = p.escuchas || 3;
  let used = 0;
  let extra = 0;
  const bpm = p.tempo || (rhythmOnly ? 72 : 66);
  const play = () => {
    stopSound();
    // con matices, suena con su volumen (lo que hay que reconocer)
    playNotes(want.map(t => ({ rest: t.rest, start: t.start, beats: t.beats, midi: t.midi })), bpm, { clap: rhythmOnly, accentEvery: barBeatsOf(p.compas), gains: dynMarks.length ? gainsFor(want, p.matices) : null });
  };
  // dictado de matices: además de las figuras, el matiz de cada compás que lo lleva (selector por compás)
  const dynMarks = (p.matices || []).filter(m => m.signo !== 'calderon');
  const barCount = want.length ? want[want.length - 1].bar + 1 : 0;
  const dynHtml = dynMarks.length ? `<fieldset class="lm-dynpick"><legend>Matiz de cada compás</legend>${Array.from({ length: barCount }, (_, b) => `<label><span>Compás ${b + 1}</span>
      <select data-dynbar="${b + 1}"><option value="">—</option>${DYN_OPTIONS.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></label>`).join('')}</fieldset>` : '';
  host.innerHTML = `<p class="muted">${rhythmOnly ? 'Escucha el ritmo y escríbelo con las figuras.' : 'Escucha la melodía y escríbela en el pentagrama.'}${p.pista ? ` <b>${esc(p.pista)}</b>` : ''}</p>
    ${clef === 'bass' && !rhythmOnly ? '<p class="lm-notice">Esta melodía se escribe en clave de fa.</p>' : ''}${armadura && !rhythmOnly ? '<p class="lm-notice">La armadura ya está puesta: con un bemol, el «si» que escribas es si♭.</p>' : ''}
    <div class="controls">${playButton('lmDictPlay', 'Escuchar')}<span class="muted small" id="lmDictLeft" aria-live="polite">Escuchas: ${listens}</span></div>
    <div class="lm-writer"></div>${dynHtml}
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  const w = createStaffWriter(host.querySelector('.lm-writer'), {
    clef, figures, rhythmOnly, max: want.length + 4, nom: env.nom, say: env.say, meter: p.compas, armadura, pulso: p.pulso || null, ties: want.some(x => x.tie),
    meters: (meterPlan(want, p.compas) || {}).meters || null, agrupacion: p.agrupacion || null, agrupaciones: p.agrupaciones || null,
    accidentals: !rhythmOnly && wantsPalette(env, want.filter(t => !t.rest).map(t => t.name), armadura),
  });
  const left = host.querySelector('#lmDictLeft');
  host.querySelector('#lmDictPlay').addEventListener('click', () => {
    used++;
    if (used > listens) extra++;
    left.textContent = used < listens ? `Escuchas: ${listens - used}` : `Escucha extra: −${EXTRA_LISTEN_PENALTY} puntos cada una`;
    play();
  });
  host.querySelector('#lmDictPlay').focus();
  await onceClick(host, '[data-check]');
  stopSound();
  const got = w.tokens();
  // el ritmo se escribe sin altura: solo cuentan las figuras
  const bare = t => ({ rest: !!t.rest, dur: t.dur, step: t.rest ? undefined : RHYTHM_STEP.treble, midi: t.rest ? undefined : 72 });
  const g0 = rhythmOnly ? gradeWriting(want.map(bare), got.map(bare)) : gradeWriting(want, got);
  // ligaduras de prolongación: cada una que falta o sobra rebaja la nota a «casi» (código «liga»)
  const tieOff = want.map((x, i) => !!x.tie !== !!(got[i] && got[i].tie));
  const g = want.some(x => x.tie) || got.some(x => x.tie)
    ? (marks => ({ ...g0, marks, pct: pctOf(marks, g0.extra), mistakes: mistakeCodes([...g0.mistakes, marks.some((m, i) => tieOff[i] && g0.marks[i] === 'ok') ? 'liga' : null]) }))(g0.marks.map((m, i) => (m === 'ok' && tieOff[i] ? 'near' : m)))
    : g0;
  w.lock(g.marks);
  host.querySelector('[data-check]').remove();
  // matices: cada uno que pide el dictado, en su compás
  const chosen = Object.fromEntries([...host.querySelectorAll('[data-dynbar]')].map(s => { s.disabled = true; return [s.dataset.dynbar, s.value]; }));
  const dynMarksOk = dynMarks.map(m => (chosen[m.compas] === m.signo ? 'ok' : 'bad'));
  host.querySelectorAll('[data-dynbar]').forEach(s => {
    const want1 = dynMarks.find(m => String(m.compas) === s.dataset.dynbar);
    if (!want1) return;
    const ok = s.value === want1.signo;
    s.closest('label').classList.add(ok ? 'ok' : 'bad');
    s.closest('label').insertAdjacentHTML('beforeend', `<span class="dict-sw ${ok ? 'ok' : 'bad'}" aria-hidden="true">${ok ? '✓' : '✕'}</span>${ok ? '' : ` <small class="muted">${esc(DYN_LABEL[want1.signo] || want1.signo)}</small>`}`);
  });
  const allMarks = [...g.marks, ...dynMarksOk];
  const pct = Math.max(0, (dynMarks.length ? pctOf(allMarks, g.extra) : g.pct) - extra * EXTRA_LISTEN_PENALTY);
  host.querySelector('.lm-feedback').innerHTML = `<p class="dict-staff-label">Lo que sonaba</p>${staffHtml(want, { clef, meter: p.compas, marks: g.marks, armadura, pulso: p.pulso || null, dynamics: p.matices || null, agrupacion: p.agrupacion || null, agrupaciones: p.agrupaciones || null, label: want.map(t => tokenLabel(t, env.nom, { pitch: !rhythmOnly })).join(', ') })}
    ${extra ? `<p class="muted small">Incluye −${extra * EXTRA_LISTEN_PENALTY} puntos por las escuchas extra</p>` : ''}`;
  host.querySelector('.lm-feedback').insertAdjacentHTML('beforeend', '<p class="muted small">Compara tu pentagrama con lo que sonaba: cada nota lleva su signo.</p>');
  await continueButton(host, 'Ver el resultado');
  return { pct, marks: allMarks, extra: g.extra, mistakes: [...g.mistakes, ...(dynMarksOk.includes('bad') ? ['matiz'] : [])] };
}
const DYN_OPTIONS = [['pp', 'pp (pianísimo)'], ['p', 'p (piano)'], ['mp', 'mp (mezzopiano)'], ['mf', 'mf (mezzoforte)'], ['f', 'f (forte)'], ['ff', 'ff (fortísimo)'], ['cresc', 'crescendo'], ['dim', 'diminuendo']];
const DYN_LABEL = Object.fromEntries(DYN_OPTIONS);

// ---------- Dictado de intervalos ----------
// La app dibuja y toca la primera nota; toca el intervalo (una nota detrás de otra) y el alumno escribe la segunda.
// params: desde (notas de partida), intervalos (números: 2…8), direccion (['asc'], ['desc'] o las dos), rondas, escuchas
const INTERVAL_NAME = { 2: '2.ª', 3: '3.ª', 4: '4.ª', 5: '5.ª', 6: '6.ª', 7: '7.ª', 8: '8.ª' };
const SPECIES_TEXT = { M: 'mayor', m: 'menor', J: 'justa', A: 'aumentada', d: 'disminuida' };
// Las rondas (con semilla: toda la clase recibe las mismas): { from, number, dir, to }; todo con notas naturales
export function intervalRounds(p, seed) {
  const r = rng(seed);
  const starts = p.desde || ['C4'];
  const numbers = p.intervalos || [3, 5, 8];
  const dirs = p.direccion || ['asc'];
  // con especies («3M», «4A»…): cada ronda lleva la suya y la nota de llegada puede llevar alteración
  const kinds = (p.especies || []).map(x => ({ number: Number(x[0]), especie: x.slice(1) })).filter(x => numbers.includes(x.number));
  const out = [];
  const used = new Set();
  for (let k = 0; k < (p.rondas || 6); k++) {
    let round = null;
    // sin repetir la misma ronda (si hay combinaciones de sobra) y dentro del pentagrama de sol (la3–la5)
    for (let tries = 0; tries < 60 && !round; tries++) {
      const from = starts[Math.floor(r() * starts.length)];
      const kind = kinds.length ? kinds[(k + Math.floor(r() * 2)) % kinds.length] : null;
      const number = kind ? kind.number : numbers[(k + Math.floor(r() * 2)) % numbers.length]; // los números se turnan para que salgan todos
      const dir = dirs[Math.floor(r() * dirs.length)];
      const step = stepOf(from) + (dir === 'desc' ? -(number - 1) : number - 1);
      if (step < stepOf('A3') || step > stepOf('A5')) continue;
      const to = kind ? intervalNote(from, number, kind.especie, dir) : nameOfStep(step);
      if (!to) continue;
      const key = `${from}${number}${kind ? kind.especie : ''}${dir}`;
      if (used.has(key) && tries < 40) continue;
      used.add(key);
      round = { from, number, dir, to, ...(kind ? { especie: kind.especie } : {}) };
    }
    out.push(round || { from: starts[0], number: numbers[0], dir: 'asc', to: nameOfStep(stepOf(starts[0]) + numbers[0] - 1) });
  }
  return out;
}
export async function dictadoIntervalos(host, p, env) {
  const rounds = intervalRounds(p, env.seed);
  const listens = p.escuchas || 2;
  const marks = [];
  const mistakes = [];
  let extra = 0;
  for (let k = 0; k < rounds.length; k++) {
    if (!env.alive()) return null;
    const round = rounds[k];
    const start = noteTok(round.from);
    const target = noteTok(round.to);
    let used = 0;
    host.innerHTML = `<p class="eyebrow lm-count">Intervalo ${k + 1} de ${rounds.length}</p>
      <p class="muted">Escucha la primera nota y el intervalo, y escribe la segunda nota.</p>
      <div class="controls">${playButton('lmIntPlay', 'Escuchar el intervalo')}<span class="muted small" id="lmIntLeft" aria-live="polite">Escuchas: ${listens}</span></div>
      <div class="lm-writer lm-big"></div>
      <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
    const w = createStaffWriter(host.querySelector('.lm-writer'), { figures: ['w'], max: 2, nom: env.nom, say: env.say, given: [start], accidentals: !!p.especies || env.level >= 3 });
    const left = host.querySelector('#lmIntLeft');
    const play = () => { stopSound(); playNotes([{ midi: start.midi, start: 0, beats: 1.4, rest: false }, { midi: target.midi, start: 1.6, beats: 1.4, rest: false }], 72); };
    host.querySelector('#lmIntPlay').addEventListener('click', () => {
      used++;
      if (used > listens) extra++;
      left.textContent = used < listens ? `Escuchas: ${listens - used}` : `Escucha extra: −${EXTRA_LISTEN_PENALTY} puntos cada una`;
      play();
    });
    host.querySelector('#lmIntPlay').focus();
    await onceClick(host, '[data-check]');
    stopSound();
    if (!env.alive()) return null;
    const got = w.tokens()[0];
    // la altura real y el nombre (do♯ no es re♭)
    const ok = !!got && tokenMidi(got) === target.midi && got.step === target.step;
    marks.push(ok ? 'ok' : 'bad');
    if (!ok) mistakes.push(got && round.especie && got.step === target.step ? 'especie' : 'intervalo');
    w.lock([ok ? 'ok' : 'bad']);
    host.querySelector('[data-check]').remove();
    host.querySelector('.lm-feedback').innerHTML = whyHtml(ok ? 'ok' : 'bad', ok ? '' : `Era una ${INTERVAL_NAME[round.number] || round.number}${round.especie ? ` ${SPECIES_TEXT[round.especie]}` : ''} ${round.dir === 'desc' ? 'hacia abajo' : 'hacia arriba'}: ${noteText(round.to, env.nom)}`);
    await continueButton(host, k + 1 < rounds.length ? 'Siguiente' : 'Ver el resultado');
  }
  const pct = Math.max(0, pctOf(marks) - extra * EXTRA_LISTEN_PENALTY);
  return { pct, marks, mistakes: mistakeCodes(mistakes), extra };
}
