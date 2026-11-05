// Pentagrama para escribir varias notas (tocar líneas y espacios, elegir figura, borrar, con teclado) y los
// ejercicios que lo usan: tocar notas en el pentagrama, construir una escala, dictado escrito y trazar barras.
import { esc } from '../ui.js';
import { noteCell, gapCell, clefCell, endCell, stepAtY, STEP_LIMITS, layoutTokens } from './staff-lm.js';
import { FIGURE_BEATS, FIGURE_NAME, REST_NAME, nameOfStep, noteText, positionText, stepOf, scoreTokens, barBeatsOf, midiOf } from './notes.js';
import { gradeWriting, gradeBarlines, scaleMark, pctOf } from './grade.js';
import { gainsFor } from './gen.js';
import { staffHtml, onceClick, whyHtml, CLEF, tokenLabel, playButton, continueButton } from './kit.js';
import { playNotes, stopSound } from './sound.js';

const RHYTHM_STEP = { treble: 36, bass: 24 }; // Do5 / Mi3: la línea donde se escribe el ritmo sin altura
const EXTRA_LISTEN_PENALTY = 5;
const DEFAULT_STEP = { treble: 34, bass: 22 };

const figLabel = f => (f.startsWith('R') ? REST_NAME[f.slice(1)] : FIGURE_NAME[f]);
export const tokensToPlay = tokens => {
  let start = 0;
  return tokens.map(t => {
    const n = { rest: !!t.rest, start, beats: FIGURE_BEATS[t.dur], midi: t.rest ? 0 : midiOf(nameOfStep(t.step)) };
    start += n.beats;
    return n;
  });
};

// ---------- El escritor ----------
// opts: clef, figures (['q','h','Rq'…]; una sola = sin paleta), rhythmOnly (todas en la misma línea), max (notas),
// nom, say (anuncio para el lector de pantalla), meter, initial (notas de partida), extras () → { dynamics, pickup,
// repeat } (lo que se dibuja además: matices, anacrusa, barra de repetición), breath (botón de coma de respiración)
export function createStaffWriter(box, { clef = 'treble', figures = ['q'], rhythmOnly = false, max = 32, nom = 'eu', say = () => {}, meter: meter0 = null, initial = [], extras = () => ({}), breath = false } = {}) {
  const [lo, hi] = STEP_LIMITS(clef);
  let meter = meter0;
  let tokens = initial.map(t => ({ ...t }));
  let figure = figures[0];
  let sel = null;          // nota seleccionada (para cambiarla o borrarla)
  let cursor = rhythmOnly ? RHYTHM_STEP[clef] : DEFAULT_STEP[clef];
  let locked = false;
  const one = figures.length === 1;

  const describe = t => (t.rest ? REST_NAME[t.dur] : rhythmOnly ? FIGURE_NAME[t.dur] : `${FIGURE_NAME[t.dur]} ${noteText(nameOfStep(t.step), nom)}`);
  const cursorText = () => (rhythmOnly ? '' : `${noteText(nameOfStep(cursor), nom)}, ${positionText(cursor, clef)}`);

  function render(focusSel = null) {
    const barBeats = meter ? barBeatsOf(meter) : null;
    const ext = extras() || {};
    // compases agrupados (no se parten entre líneas), corcheas con su barra, matices y calderón como se pintan
    const lay = layoutTokens(tokens, { barBeats, pickup: ext.pickup || 0, clef });
    const dyn = {};
    (ext.dynamics || []).forEach(m => { (dyn[m.compas] ||= []).push(m); });
    let open = true;
    const cells = tokens.map((t, i) => {
      const L = lay[i];
      const bar = L.bar + 1;
      const signs = open ? (dyn[bar] || []).filter(m => m.signo !== 'calderon').map(m => ({ cresc: 'cresc.', dim: 'dim.' })[m.signo] || m.signo) : [];
      const fermata = (L.barEnd || i === tokens.length - 1) && (dyn[bar] || []).some(m => m.signo === 'calderon');
      open = L.barEnd;
      const btn = `<button type="button" class="lm-sc lm-note-btn${i === sel ? ' sel' : ''}" data-idx="${i}" aria-pressed="${i === sel}" aria-label="${esc(`${i + 1}: ${describe(t)}${t.breath ? ', respiración' : ''}`)}">${noteCell({ ...t, clef, beam: L.beam, up: L.up, fermata, breath: !!t.breath })}${signs.length ? `<span class="lm-dyn" lang="it">${esc(signs.join(' '))}</span>` : ''}</button>`;
      return btn + (L.barEnd ? `<span class="lm-sc">${gapCell(true, null, 14)}</span></span><span class="lm-bargroup">` : '');
    }).join('');
    const isRest = figure.startsWith('R');
    const ghost = isRest || rhythmOnly ? null : cursor;
    box.querySelector('.lm-w-staff').innerHTML = `<span class="lm-bargroup"><span class="lm-sc" aria-hidden="true">${clefCell(clef, meter)}</span>${cells}${tokens.length < max && !locked ? `<button type="button" class="lm-sc lm-insert" data-insert data-step="${cursor}" aria-label="${esc(`Añadir ${figLabel(figure).toLowerCase()}${rhythmOnly || isRest ? '' : `: ${cursorText()}`}. Toca una línea o un espacio; flechas arriba y abajo para cambiar la nota`)}">${noteCell({ clef, dur: isRest ? figure.slice(1) : figure, rest: isRest, ghost, step: null })}</button>` : ''}${ext.repeat ? `<span class="lm-sc" aria-hidden="true">${endCell(true)}</span>` : ''}</span>`;
    box.querySelectorAll('[data-fig]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fig === figure)));
    box.querySelector('[data-del]').disabled = locked || !tokens.length;
    box.querySelectorAll('[data-up],[data-down]').forEach(b => { b.disabled = locked || rhythmOnly; });
    if (focusSel !== null) box.querySelector(focusSel)?.focus();
  }

  function add(step = cursor) {
    if (locked || tokens.length >= max) return;
    const isRest = figure.startsWith('R');
    const t = isRest ? { rest: true, dur: figure.slice(1) } : { step: rhythmOnly ? RHYTHM_STEP[clef] : step, dur: figure };
    tokens = [...tokens, t];
    sel = null;
    render('[data-insert]');
    say(`${describe(t)} añadida`);
    if (!box.querySelector('[data-insert]')) box.querySelector('[data-check]')?.focus();
  }
  function moveCursor(d) {
    if (rhythmOnly) return;
    if (sel !== null && !tokens[sel].rest) {
      const step = Math.max(lo, Math.min(hi, tokens[sel].step + d));
      tokens = tokens.map((t, i) => (i === sel ? { ...t, step } : t));
      render(`[data-idx="${sel}"]`);
      say(describe(tokens[sel]));
      return;
    }
    cursor = Math.max(lo, Math.min(hi, cursor + d));
    render(box.contains(document.activeElement) ? '[data-insert]' : null);
    say(cursorText());
  }
  function remove() {
    if (locked || !tokens.length) return;
    const i = sel ?? tokens.length - 1;
    const gone = tokens[i];
    tokens = tokens.filter((_, k) => k !== i);
    sel = null;
    render('[data-insert]');
    say(`${describe(gone)} borrada`);
  }

  box.innerHTML = `${one ? '' : `<div class="seg wrap lm-figs" role="group" aria-label="Figura">${figures.map(f => `<button type="button" data-fig="${f}" aria-pressed="false"><span class="lm-fig-ic" aria-hidden="true">${noteCell({ clef, dur: f.startsWith('R') ? f.slice(1) : f, rest: f.startsWith('R'), step: f.startsWith('R') ? null : DEFAULT_STEP[clef] + 2, w: 30 })}</span>${esc(figLabel(f))}</button>`).join('')}</div>`}
    <div class="lm-w-staff lm-staff" role="group" aria-label="Pentagrama para escribir"></div>
    <div class="controls lm-w-tools">
      <button type="button" class="btn ghost small" data-up aria-label="Nota más aguda">↑ Más aguda</button>
      <button type="button" class="btn ghost small" data-down aria-label="Nota más grave">↓ Más grave</button>
      <button type="button" class="btn ghost small" data-del>Borrar</button>
      ${breath ? '<button type="button" class="btn ghost small" data-breath>Coma de respiración</button>' : ''}
    </div>`;
  if (rhythmOnly) box.querySelectorAll('[data-up],[data-down]').forEach(b => { b.hidden = true; });

  box.addEventListener('click', e => {
    if (locked) return;
    const fig = e.target.closest('[data-fig]');
    const ins = e.target.closest('[data-insert]');
    const note = e.target.closest('[data-idx]');
    if (fig) { figure = fig.dataset.fig; render(`[data-fig="${figure}"]`); return; }
    if (e.target.closest('[data-up]')) { moveCursor(1); return; }
    if (e.target.closest('[data-down]')) { moveCursor(-1); return; }
    if (e.target.closest('[data-del]')) { remove(); return; }
    if (e.target.closest('[data-breath]')) {
      // la coma va detrás de la nota elegida (o de la última escrita); otra vez, se quita
      const i = sel ?? tokens.length - 1;
      if (i < 0) return;
      tokens = tokens.map((t, k) => (k === i ? { ...t, breath: !t.breath } : t));
      render(sel !== null ? `[data-idx="${i}"]` : null);
      say(tokens[i].breath ? 'Coma de respiración puesta' : 'Coma de respiración quitada');
      return;
    }
    if (ins) {
      const svg = ins.querySelector('svg');
      // con el ratón o el dedo, la altura es donde se toca; con el teclado (clic sin posición), la del cursor
      const step = e.detail && !rhythmOnly ? stepAtY(svg, e.clientY, clef) : cursor;
      cursor = step;
      add(step);
      return;
    }
    if (note) {
      const i = Number(note.dataset.idx);
      sel = sel === i ? null : i;
      render(`[data-idx="${i}"]`);
      say(sel === null ? 'Nota sin seleccionar' : `Seleccionada: ${describe(tokens[i])}. Flechas para cambiarla, Suprimir para borrarla`);
    }
  });
  box.addEventListener('keydown', e => {
    if (locked) return;
    const onStaff = e.target.closest('[data-insert],[data-idx]');
    if (!onStaff) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); moveCursor(e.key === 'ArrowUp' ? 1 : -1); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); remove(); }
    else if (/^[1-9]$/.test(e.key) && figures[Number(e.key) - 1]) { figure = figures[Number(e.key) - 1]; render('[data-insert]'); say(figLabel(figure)); }
  });
  render();

  return {
    tokens: () => tokens,
    refresh: () => render(),
    setMeter(m) { meter = m; render(); },
    lock(marks = []) {
      locked = true;
      sel = null;
      render();
      box.querySelectorAll('[data-idx]').forEach((b, i) => {
        if (!marks[i]) return;
        b.classList.add(marks[i]);
        b.insertAdjacentHTML('beforeend', `<span class="lm-cell-mark ${marks[i]}" aria-hidden="true">${({ ok: '✓', near: '≈', bad: '✕' })[marks[i]]}</span>`);
      });
      box.querySelectorAll('[data-fig],[data-up],[data-down],[data-del],[data-breath]').forEach(b => { b.disabled = true; });
    },
  };
}

// ---------- Tocar notas en el pentagrama y construir una escala ----------
export async function tocarPentagrama(host, item, env) {
  const clef = CLEF[item.clave] || 'treble';
  const want = item.respuesta;
  host.innerHTML = `<h2 class="lm-q" tabindex="-1">${esc(item.q)}</h2><div class="lm-writer"></div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  const w = createStaffWriter(host.querySelector('.lm-writer'), { clef, figures: ['w'], max: want.length, nom: env.nom, say: env.say });
  await onceClick(host, '[data-check]');
  const given = w.tokens().map(t => nameOfStep(t.step));
  const marks = want.map((n, i) => (given[i] && stepOf(given[i]) === stepOf(n) ? 'ok' : 'bad'));
  w.lock(marks);
  host.querySelector('[data-check]').remove();
  const mark = item.tipo === 'escala' ? scaleMark(want.map(stepOf), given.map(stepOf)) : marks.every(m => m === 'ok') ? 'ok' : 'bad';
  const shown = want.map(n => noteText(n, env.nom)).join(' ');
  host.querySelector('.lm-feedback').innerHTML = `${mark === 'ok' ? '' : staffHtml(want.map(n => ({ step: stepOf(n), dur: 'w', beats: 4 })), { clef, bars: false, label: `Respuesta: ${shown}` })}${whyHtml(mark, item.why || (mark === 'ok' ? '' : `Respuesta: ${shown}`))}`;
  const wrongAt = marks.findIndex(m => m === 'bad');
  return { mark, mistake: wrongAt < 0 ? null : given[wrongAt] ? `${want[wrongAt]}>${given[wrongAt]}` : item.id || 'pentagrama' };
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
// params: partitura, compas, tempo, escuchas, tipo ('ritmico'|'melodico'), pista; figuras: las que se pueden elegir
export async function dictadoEscrito(host, p, env) {
  const want = scoreTokens(p.partitura);
  const rhythmOnly = p.tipo === 'ritmico';
  // la paleta es la de la unidad (todas las figuras que ya se conocen), no solo las de la respuesta: así no da pistas
  const known = (p.figurasUnidad || []).map(f => (f === 'ee' ? 'e' : f === 'rq' ? 'Rq' : f)).filter(f => /^R?(w|h\.?|q\.?|e|s)$/.test(f));
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
    <div class="controls">${playButton('lmDictPlay', 'Escuchar')}<span class="muted small" id="lmDictLeft" aria-live="polite">Escuchas: ${listens}</span></div>
    <div class="lm-writer"></div>${dynHtml}
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  const w = createStaffWriter(host.querySelector('.lm-writer'), { figures, rhythmOnly, max: want.length + 4, nom: env.nom, say: env.say, meter: p.compas });
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
  const g = rhythmOnly
    ? gradeWriting(want.map(t => ({ ...t, step: RHYTHM_STEP.treble })), got.map(t => ({ ...t, step: t.rest ? undefined : RHYTHM_STEP.treble })))
    : gradeWriting(want, got);
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
  host.querySelector('.lm-feedback').innerHTML = `<p class="dict-staff-label">Lo que sonaba</p>${staffHtml(want, { meter: p.compas, marks: g.marks, dynamics: p.matices || null, label: want.map(t => tokenLabel(t, env.nom, { pitch: !rhythmOnly })).join(', ') })}
    ${extra ? `<p class="muted small">Incluye −${extra * EXTRA_LISTEN_PENALTY} puntos por las escuchas extra</p>` : ''}`;
  host.querySelector('.lm-feedback').insertAdjacentHTML('beforeend', '<p class="muted small">Compara tu pentagrama con lo que sonaba: cada nota lleva su signo.</p>');
  await continueButton(host, 'Ver el resultado');
  return { pct, marks: allMarks, extra: g.extra, mistakes: [...g.mistakes, ...(dynMarksOk.includes('bad') ? ['matiz'] : [])] };
}
const DYN_OPTIONS = [['pp', 'pp (pianísimo)'], ['p', 'p (piano)'], ['mp', 'mp (mezzopiano)'], ['mf', 'mf (mezzoforte)'], ['f', 'f (forte)'], ['ff', 'ff (fortísimo)'], ['cresc', 'crescendo'], ['dim', 'diminuendo']];
const DYN_LABEL = Object.fromEntries(DYN_OPTIONS);

