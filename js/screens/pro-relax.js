// Pestaña Relax del método Pro: retos rápidos como en un juego. Opción múltiple (a veces leyendo una nota),
// verdadero o falso, completar huecos, escribir notas en el pentagrama (por nombre o al dictado), completar un compás
// con figuras y marcar un ritmo tocando la pantalla. En percusión, además, ordenar las manos (D/I) y tocar el ritmo con
// dos pads a tiempo. Cada acierto suma puntos y la racha los multiplica. Los fallos vuelven una vez al final de la ronda.
import { $, esc, icon, starsHtml } from '../ui.js';
import { L } from '../tips-l10n.js';
import { t } from '../i18n.js';
import { parseScore } from '../music.js';
import { createStaff } from '../staff.js';
import { createWriter } from '../note-writer.js';
import { FIGURE_BEATS, barBeats, checkBar, rhythmOnsets, gradeTaps, gradeSticks, sameWrittenNote, relaxStars, TAP_WINDOW_BEATS } from '../method.js';
import * as audio from '../audio.js';

const FIGURE_NAME = {
  w: L('Redonda', 'Whole note'), 'h.': L('Blanca con puntillo', 'Dotted half note'), h: L('Blanca', 'Half note'),
  'q.': L('Negra con puntillo', 'Dotted quarter note'), q: L('Negra', 'Quarter note'), ee: L('Dos corcheas', 'Two eighth notes'),
  e: L('Corchea', 'Eighth note'), Re: L('Silencio de corchea', 'Eighth rest'), Rw: L('Silencio de redonda', 'Whole rest'), Rh: L('Silencio de blanca', 'Half rest'), Rq: L('Silencio de negra', 'Quarter rest'),
};
const TXT = {
  check: L('Comprobar', 'Check'), next: L('Continuar', 'Continue'), right: L('¡Correcto!', 'Correct!'), wrong: L('No es correcto', 'Not quite'),
  true: L('Verdadero', 'True'), false: L('Falso', 'False'), listen: L('Escuchar', 'Listen'), undo: L('Borrar la última', 'Remove last'),
  missing: L('Faltan pulsos:', 'Beats missing:'), full: L('Compás completo', 'Bar complete'), noFit: L('Esa figura no cabe', 'That value does not fit'),
  use: L('Usa al menos una:', 'Use at least one:'), start: L('Empezar', 'Start'), tap: L('Toca aquí', 'Tap here'),
  ready: L('Escucha la cuenta y marca cada nota', 'Listen to the count-in and tap every note'), taps: L('Notas marcadas:', 'Notes tapped:'),
  extra: L('Toques de más:', 'Extra taps:'), again: L('Repaso', 'Review'), done: L('¡Relax completado!', 'Relax complete!'),
  mistakes: L('Fallos:', 'Mistakes:'), toPlay: L('Ahora, a tocarlo', 'Now, play it'), retry: L('Repetir el Relax', 'Repeat the Relax'),
  solfeo: L('Solfeo', 'Music reading'), tecnica_instrumento: L('Técnica', 'Technique'), cruzado: L('Solfeo y técnica', 'Reading and technique'),
  writeHint: L('Toca una línea o un espacio para poner la nota', 'Tap a line or space to place the note'),
  left: L('Izquierda', 'Left'), rightHand: L('Derecha', 'Right'), solution: L('La buena:', 'The answer:'),
  streak: L('Racha', 'Streak'), points: L('Puntos:', 'Points:'), bestStreak: L('Mejor racha:', 'Best streak:'), record: L('¡Nuevo récord!', 'New record!'),
  perfect: L('¡Perfecto!', 'Perfect!'), good: L('¡Bien!', 'Good!'), wrongHand: L('¡Otra mano!', 'Other hand!'),
  hands: L('Golpes con su mano:', 'Strokes with the right hand:'), wrongHands: L('con la otra mano:', 'with the other hand:'),
  keys: L('En el ordenador: tecla F (izquierda) y J (derecha)', 'On a computer: F key (left) and J key (right)'),
};
const POINTS = 10;
const STREAK_STEP = 3;   // cada 3 aciertos seguidos sube el multiplicador
const MAX_MULT = 4;
const PERFECT_BEATS = 0.12;
const multiplier = streak => 1 + Math.min(MAX_MULT - 1, Math.floor(streak / STREAK_STEP));
const NEXT_DELAY_MS = 900;
const TAP_GRACE_S = 0.6;

let run = null; // { level, queue, i, mistakes, retried:Set, answer, onFinish, ... }

// Barajado fijo (no cambia al repetir la pantalla) para las fichas de los huecos
function stableShuffle(list, seed) {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const out = list.map((v, i) => ({ v, k: (h = (h * 1103515245 + 12345) >>> 0) + i }));
  return out.sort((a, b) => a.k - b.k).map(x => x.v);
}

const pitchFor = level => (level.clef === 'perc' ? 'C5' : level.clef === 'bass' ? 'D3' : 'B4');
const isPerc = level => level.curso === 'percusion';
const figToScore = (fig, pitch) => (fig === 'ee' ? `${pitch}e ${pitch}e` : fig.startsWith('R') ? fig : pitch + fig);
const rhythmToScore = (ritmo, pitch) => ritmo.split(/\s+/).filter(Boolean).map(tok => (tok === '|' ? '|' : figToScore(tok, pitch))).join(' ');

function drawRhythm(svg, text, level, time, sticking = null) {
  const score = parseScore(text);
  createStaff(svg).render(score, { key: 'C', time, mode: 'review', clef: level.clef, sticking });
}

// Escuchar un ritmo de reto: en percusión suena la caja (con sus acentos); en los demás, la nota del instrumento
function playRhythm(ritmo, bpm) {
  if (!isPerc(run.level)) {
    audio.playScore(parseScore(rhythmToScore(ritmo, run.level.scale[0])).notes, bpm, () => {});
    return;
  }
  const { onsets, accents } = rhythmOnsets(ritmo);
  const t0 = audio.audioTime() + 0.15;
  onsets.forEach((o, k) => audio.drumHit(t0 + o * 60 / bpm, accents[k]));
}

// best: mejor puntuación guardada, para avisar de un récord
export function startRelax(level, onFinish, { best = 0 } = {}) {
  run = { level, queue: [...level.pestana_relax], i: 0, mistakes: 0, retried: new Set(), answer: null, checked: false, onFinish, started: Date.now(), streak: 0, bestStreak: 0, points: 0, best };
  renderItem();
}

export function stopRelax() {
  if (run && run.stopTaps) run.stopTaps();
  if (run && run.unbindKeys) run.unbindKeys();
  run = null;
}

function shell(item, body) {
  const pct = Math.round(run.i / run.queue.length * 100);
  const isReview = run.i >= run.level.pestana_relax.length;
  return `<div class="relax-top"><div class="progress pro-progress"><i style="width:${pct}%"></i></div>
    <span class="relax-score" aria-live="polite"><b id="relaxPoints">${run.points}</b>${run.streak >= 2 ? ` <span class="combo-badge"><span>${esc(TXT.streak)}</span> ${run.streak} · ×${multiplier(run.streak)}</span>` : ''}</span></div>
    <p class="eyebrow">${isReview ? `<span>${esc(TXT.again)}</span> · ` : ''}<span>${esc(TXT[item.enfoque] || '')}</span></p>
    <div class="pro-item">${body}</div>
    <div id="relaxFeedback" class="relax-feedback" hidden></div>
    <button id="relaxCheck" class="btn relax-check" type="button" disabled>${esc(TXT.check)}</button>`;
}

function setReady(ready) { $('relaxCheck').disabled = !ready; }

function renderItem() {
  if (run.unbindKeys) { run.unbindKeys(); run.unbindKeys = null; }
  run.onHit = null;
  const item = run.queue[run.i];
  run.answer = null;
  run.checked = false;
  const body = RENDER[item.tipo_interaccion](item);
  $('proBody').innerHTML = shell(item, body);
  BIND[item.tipo_interaccion](item);
  $('relaxCheck').addEventListener('click', () => (run.checked ? advance() : check(CHECK[item.tipo_interaccion](item))));
}

function check(ok) {
  const item = run.queue[run.i];
  run.checked = true;
  let gained = 0;
  if (!ok) {
    run.mistakes++;
    run.streak = 0;
    if (!run.retried.has(item.id)) { run.retried.add(item.id); run.queue.push(item); }
  } else {
    run.streak++;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    gained = POINTS * multiplier(run.streak);
    run.points += gained;
    $('relaxPoints').textContent = run.points;
  }
  const fb = $('relaxFeedback');
  fb.hidden = false;
  fb.className = 'relax-feedback ' + (ok ? 'right' : 'wrong');
  fb.innerHTML = `<b>${esc(ok ? TXT.right : TXT.wrong)}${gained ? ` <span class="gain">+${gained}</span>` : ''}</b><span>${esc(ok ? item.mensaje_acierto || '' : item.mensaje_error || '')}</span>`;
  $('proBody').querySelectorAll('.pro-item button, .pro-item svg').forEach(b => { if (!b.dataset.keep) b.setAttribute('disabled', ''); });
  const btn = $('relaxCheck');
  btn.disabled = false;
  btn.hidden = false;
  btn.textContent = TXT.next;
}

function advance() {
  if (run.stopTaps) run.stopTaps();
  if (run.unbindKeys) { run.unbindKeys(); run.unbindKeys = null; }
  run.i++;
  if (run.i < run.queue.length) { renderItem(); return; }
  const stars = relaxStars(run.mistakes);
  const minutes = Math.max(1, Math.round((Date.now() - run.started) / 60000));
  const { onFinish, points, bestStreak, best } = run;
  const record = points > best;
  $('proBody').innerHTML = `<div class="pro-done"><p class="eyebrow">${esc(run.level.titulo_leccion)}</p><h2>${esc(TXT.done)}</h2>
    <div class="big-stars">${starsHtml(stars)}</div>
    <p class="pro-points"><span>${esc(TXT.points)}</span> <b>${points}</b>${record ? ` <span class="combo-badge">${esc(TXT.record)}</span>` : ''}</p>
    <p class="muted"><span>${esc(TXT.mistakes)}</span> ${run.mistakes} · <span>${esc(TXT.bestStreak)}</span> ${bestStreak}</p>
    <button id="relaxToPlay" class="btn" type="button"><span class="ic">${icon('play')}</span>${esc(TXT.toPlay)}</button>
    <button id="relaxAgain" class="btn ghost" type="button">${esc(TXT.retry)}</button></div>`;
  const level = run.level;
  run = null;
  onFinish({ stars, minutes, points, again: () => startRelax(level, onFinish, { best: Math.max(best, points) }) });
}

// ---------- Opción múltiple y verdadero/falso ----------
function optionsHtml(labels) {
  return `<div class="quiz-options" role="group">${labels.map((o, k) => `<button type="button" class="quiz-opt" data-opt="${k}">${esc(o)}</button>`).join('')}</div>`;
}
function bindOptions(item, correctOf) {
  const box = $('proBody');
  box.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => {
    if (run.checked) return;
    run.answer = Number(b.dataset.opt);
    box.querySelectorAll('[data-opt]').forEach(o => o.classList.toggle('picked', o === b));
    setReady(true);
  }));
  run.markOptions = ok => box.querySelectorAll('[data-opt]').forEach(o => {
    const k = Number(o.dataset.opt);
    if (k === correctOf()) o.classList.add('right');
    else if (k === run.answer && !ok) o.classList.add('wrong');
  });
}
const withMark = (fn, item) => { const ok = fn(item); run.markOptions(ok); return ok; };

// ---------- Huecos ----------
function gapState(item) {
  const sentence = t(item.texto_incompleto).split('___');
  return { sentence, blanks: Array(sentence.length - 1).fill(null) };
}
function renderGaps() {
  const { sentence, blanks, chips } = run.gaps;
  $('gapText').innerHTML = sentence.map((part, i) => esc(part) + (i < blanks.length ? `<button type="button" class="gap${blanks[i] !== null ? ' filled' : ''}" data-gap="${i}">${blanks[i] !== null ? esc(t(chips[blanks[i]])) : '&nbsp;'}</button>` : '')).join('');
  $('gapChips').querySelectorAll('[data-chip]').forEach(c => { c.disabled = blanks.includes(Number(c.dataset.chip)); });
  setReady(blanks.every(b => b !== null));
}

// ---------- Escribir notas ----------
function playDictation(item) {
  audio.playTone(parseNoteMidi(item.referencia), 1);
  setTimeout(() => audio.playTone(parseNoteMidi(item.nota), 1.2), 1100);
}
const parseNoteMidi = name => parseScore(`${name}q`).notes[0].midi;

// ---------- Marcar el ritmo ----------
function startTaps(item) {
  const spb = 60 / item.bpm;
  const { onsets, beats } = rhythmOnsets(item.ritmo);
  const end = audio.countIn(item.compas + beats, item.bpm);
  const t0 = end - beats * spb;
  const taps = [];
  const pad = $('tapPad');
  pad.disabled = false;
  pad.classList.add('live');
  $('tapStatus').textContent = TXT.ready;
  const onTap = e => { e.preventDefault(); taps.push((audio.audioTime() - audio.outputLatency() - t0) / spb); pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); };
  pad.addEventListener('pointerdown', onTap);
  const timer = setTimeout(() => {
    stop();
    const g = gradeTaps(onsets, taps.filter(b => b > -0.5));
    $('tapStatus').textContent = `${t(TXT.taps)} ${g.hits}/${g.total}${g.extra ? ` · ${t(TXT.extra)} ${g.extra}` : ''}`;
    check(g.ok);
  }, (end - audio.audioTime() + TAP_GRACE_S) * 1000);
  const stop = () => { clearTimeout(timer); pad.removeEventListener('pointerdown', onTap); pad.classList.remove('live'); run && (run.stopTaps = null); };
  run.stopTaps = stop;
}

// ---------- Percusión: pads de las dos manos ----------
const padsHtml = () => `<div class="stick-pads"><button type="button" class="stick-pad I" data-hand="I"><b>I</b><small>${esc(TXT.left)}</small></button>
  <button type="button" class="stick-pad D" data-hand="D"><b>D</b><small>${esc(TXT.rightHand)}</small></button></div>`;
const KEY_HAND = { f: 'I', F: 'I', ArrowLeft: 'I', j: 'D', J: 'D', ArrowRight: 'D' };

// Pulsar un pad (dedo o teclado): se ilumina y avisa con la mano
function bindPads(onHit) {
  const box = $('proBody');
  const flash = hand => { const pad = box.querySelector(`.stick-pad.${hand}`); pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); };
  box.querySelectorAll('[data-hand]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); flash(b.dataset.hand); onHit(b.dataset.hand); }));
  const onKey = e => {
    const hand = KEY_HAND[e.key];
    if (!hand || e.repeat || !box.querySelector('.stick-pads')) return;
    e.preventDefault();
    flash(hand);
    onHit(hand);
  };
  document.addEventListener('keydown', onKey);
  run.unbindKeys = () => document.removeEventListener('keydown', onKey);
}

function renderSeq() {
  const { slots, picked } = run.seq;
  $('seqSlots').innerHTML = slots.map((_, i) => `<span class="seq-slot${picked[i] ? ' ' + picked[i] : ''}">${picked[i] || ''}</span>`).join('');
  setReady(picked.length === slots.length);
}

// Reto de baquetas: cuenta, y cada toque se juzga al momento (a tiempo y con la mano buena) con su combo
function startSticks(item) {
  const spb = 60 / item.bpm;
  const { onsets, beats } = rhythmOnsets(item.ritmo);
  const end = audio.countIn(item.compas + Math.ceil(beats), item.bpm);
  const t0 = end - beats * spb;
  const taps = [];
  const judged = new Set();
  const chips = [...$('stickLane').children];
  let combo = 0;
  let live = true;
  $('tapStatus').textContent = TXT.ready;
  const say = (text, cls) => { const el = $('stickCall'); el.textContent = text; el.className = 'stick-call ' + cls; void el.offsetWidth; el.classList.add('pop'); };
  run.onHit = hand => {
    if (!live) return;
    audio.drumHit(audio.audioTime(), false, 0.8);
    const beat = (audio.audioTime() - audio.outputLatency() - t0) / spb;
    taps.push({ beat, hand });
    const k = onsets.findIndex((o, i) => !judged.has(i) && Math.abs(beat - o) <= TAP_WINDOW_BEATS);
    if (k < 0) { combo = 0; $('stickCombo').textContent = ''; return; }
    judged.add(k);
    const okHand = hand === item.manos[k];
    chips[k].classList.add(okHand ? 'hit' : 'wrong');
    combo = okHand ? combo + 1 : 0;
    $('stickCombo').textContent = combo >= 2 ? `×${combo}` : '';
    say(okHand ? (Math.abs(beat - onsets[k]) <= PERFECT_BEATS ? TXT.perfect : TXT.good) : TXT.wrongHand, okHand ? 'ok' : 'bad');
  };
  // Resalta la nota que toca ahora
  const frame = () => {
    if (!live) return;
    const beat = (audio.audioTime() - t0) / spb;
    chips.forEach((c, i) => {
      const until = i === onsets.length - 1 ? onsets[i] + 0.5 : onsets[i + 1] - 0.15;
      c.classList.toggle('now', beat >= onsets[i] - 0.15 && beat < until);
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  const timer = setTimeout(() => {
    stop();
    const g = gradeSticks(onsets, item.manos, taps.filter(tp => tp.beat > -0.5));
    chips.forEach((c, i) => { if (!judged.has(i)) c.classList.add('miss'); c.classList.remove('now'); });
    $('tapStatus').textContent = `${t(TXT.hands)} ${g.hits}/${g.total}${g.wrongHand ? ` · ${t(TXT.wrongHands)} ${g.wrongHand}` : ''}${g.extra ? ` · ${t(TXT.extra)} ${g.extra}` : ''}`;
    check(g.ok);
  }, (end - audio.audioTime() + TAP_GRACE_S) * 1000);
  const stop = () => { live = false; clearTimeout(timer); if (run) { run.stopTaps = null; run.onHit = null; } };
  run.stopTaps = stop;
}

// ---------- Zona táctil (arco, punto de contacto o cuerdas) ----------
const ZONE_W = 340;
// Límites de cada zona (x) y el dibujo de fondo de cada tipo
const ZONES = {
  arco: { cuts: [14, 115, 225, 326], art: `<rect x="14" y="50" width="34" height="26" rx="5" class="zt-wood"/><path d="M48 58 Q180 46 320 56" class="zt-stick"/><line x1="48" y1="74" x2="318" y2="62" class="zt-hair"/><path d="M318 52 l8 4 -8 8z" class="zt-wood"/>` },
  contacto: { cuts: [8, 185, 268, 332], art: `<rect x="8" y="40" width="177" height="56" rx="6" class="zt-board"/>${[48, 60, 72, 84].map(y => `<line x1="8" x2="320" y1="${y}" y2="${y}" class="zt-string"/>`).join('')}<rect x="312" y="34" width="9" height="68" rx="2" class="zt-wood"/>` },
  cuerdas: { cuts: [10, 92, 172, 252, 332], art: [51, 132, 212, 292].map((x, i) => `<line x1="${x}" x2="${x}" y1="20" y2="104" class="zt-string" stroke-width="${4 - i * 0.8}"/>`).join('') },
};
function zoneSvg(item) {
  const z = ZONES[item.zona];
  const widths = item.opciones.map((_, k) => z.cuts[k + 1] - z.cuts[k]);
  const zones = item.opciones.map((o, k) => `<g class="zt-zone" data-zone="${k}" aria-hidden="true"><rect x="${z.cuts[k]}" y="8" width="${widths[k]}" height="104" rx="10" class="zt-area"/></g>`).join('');
  // Los nombres van debajo, alineados con su zona (en el dibujo no caben)
  const labels = item.opciones.map((o, k) => `<button type="button" class="zt-zone zt-label" data-zone="${k}">${esc(o)}</button>`).join('');
  return `<div class="pro-zone-box"><svg class="pro-zones" viewBox="0 0 ${ZONE_W} 120">${z.art}${zones}</svg>
    <div class="zt-labels" style="grid-template-columns:${widths.map(w => w + 'fr').join(' ')}">${labels}</div></div>`;
}

const RENDER = {
  opcion_multiple: item => `<h2>${esc(item.pregunta)}</h2>${item.pentagrama ? '<svg id="relaxStaff" class="staff pro-mini" role="img" aria-label="Nota escrita"></svg>' : ''}${optionsHtml(item.opciones)}`,
  verdadero_falso: item => `<h2>${esc(item.afirmacion)}</h2>${optionsHtml([TXT.true, TXT.false])}`,
  zona_tactil: item => `<h2>${esc(item.pregunta_ui)}</h2>${zoneSvg(item)}`,
  completar_hueco: item => {
    run.gaps = { ...gapState(item), chips: stableShuffle([...item.palabras_correctas, ...item.palabras_señuelo], item.id) };
    return `<p id="gapText" class="gap-text"></p><div id="gapChips" class="gap-chips">${run.gaps.chips.map((w, k) => `<button type="button" class="chip-btn" data-chip="${k}">${esc(w)}</button>`).join('')}</div>`;
  },
  escribir_nota: item => `<h2>${esc(item.consigna)}</h2>
    ${item.modo === 'dictado' ? `<button type="button" class="btn ghost small" id="dictPlay" data-keep="1"><span class="ic">${icon('speaker')}</span>${esc(TXT.listen)}</button>` : `<p class="pro-target">${esc(item.nombre)}</p>`}
    <svg id="writer" class="staff pro-writer" role="img" aria-label="${esc(TXT.writeHint)}"></svg><p class="muted small">${esc(TXT.writeHint)}</p>`,
  completar_compas: item => `<h2>${esc(item.consigna)}</h2>${item.usar ? `<p class="muted">${esc(TXT.use)} <b>${esc(FIGURE_NAME[item.usar])}</b></p>` : ''}
    <div class="pro-bar-box"><svg id="barStaff" class="staff pro-mini" role="img" aria-label="Compás"></svg></div>
    <p id="barLeft" class="bar-left"></p>
    <div class="fig-palette">${item.figuras.map(f => `<button type="button" class="fig-btn" data-fig="${f}"><b>${esc(FIGURE_NAME[f])}</b><small>${FIGURE_BEATS[f]}</small></button>`).join('')}</div>
    <button type="button" class="btn ghost small" id="barUndo">${esc(TXT.undo)}</button>`,
  secuencia_logica: item => {
    run.seq = { slots: item.secuencia_correcta, picked: [] };
    return `<h2>${esc(item.pregunta_ui)}</h2><div id="seqSlots" class="seq-slots" aria-live="polite"></div>
      <p id="seqSolution" class="muted" hidden></p>${padsHtml()}
      <button type="button" class="btn ghost small" id="seqUndo">${esc(TXT.undo)}</button>`;
  },
  tocar_baquetas: item => `<h2>${esc(item.consigna)}</h2>
    <div class="pro-bar-box"><svg id="rhythmStaff" class="staff pro-mini" role="img" aria-label="Ritmo"></svg></div>
    <div id="stickLane" class="stick-lane">${item.manos.map(h => `<span class="stick-chip ${h}">${h}</span>`).join('')}</div>
    <div class="row"><button type="button" class="btn ghost small" id="rhythmListen" data-keep="1"><span class="ic">${icon('speaker')}</span>${esc(TXT.listen)}</button>
    <button type="button" class="btn small" id="rhythmStart"><span class="ic">${icon('play')}</span>${esc(TXT.start)}</button></div>
    <div class="stick-stage"><span id="stickCall" class="stick-call"></span><span id="stickCombo" class="stick-combo"></span></div>
    ${padsHtml()}<p id="tapStatus" class="muted" aria-live="polite">&nbsp;</p><p class="muted small stick-keys">${esc(TXT.keys)}</p>`,
  marcar_ritmo: item => `<h2>${esc(item.consigna)}</h2>
    <div class="pro-bar-box"><svg id="rhythmStaff" class="staff pro-mini" role="img" aria-label="Ritmo"></svg></div>
    <div class="row"><button type="button" class="btn ghost small" id="rhythmListen" data-keep="1"><span class="ic">${icon('speaker')}</span>${esc(TXT.listen)}</button>
    <button type="button" class="btn small" id="rhythmStart"><span class="ic">${icon('play')}</span>${esc(TXT.start)}</button></div>
    <button type="button" class="tap-pad" id="tapPad" disabled>${esc(TXT.tap)}</button><p id="tapStatus" class="muted" aria-live="polite">&nbsp;</p>`,
};

const BIND = {
  opcion_multiple: item => {
    if (item.pentagrama) createStaff($('relaxStaff')).render(parseScore(`| ${item.pentagrama}w |`), { key: run.level.key, time: null, mode: 'review', clef: run.level.clef });
    bindOptions(item, () => item.respuesta_correcta);
  },
  verdadero_falso: item => bindOptions(item, () => (item.respuesta_correcta ? 0 : 1)),
  zona_tactil: () => {
    const zones = [...$('proBody').querySelectorAll('[data-zone]')];
    const pick = z => {
      if (run.checked) return;
      run.answer = Number(z.dataset.zone);
      zones.forEach(o => o.classList.toggle('picked', o.dataset.zone === z.dataset.zone));
      setReady(true);
    };
    zones.forEach(z => {
      z.addEventListener('click', () => pick(z));
    });
  },
  completar_hueco: () => {
    renderGaps();
    $('gapChips').addEventListener('click', e => {
      const c = e.target.closest('[data-chip]');
      if (!c || run.checked) return;
      const free = run.gaps.blanks.indexOf(null);
      if (free >= 0) { run.gaps.blanks[free] = Number(c.dataset.chip); renderGaps(); }
    });
    $('gapText').addEventListener('click', e => {
      const g = e.target.closest('[data-gap]');
      if (!g || run.checked) return;
      run.gaps.blanks[Number(g.dataset.gap)] = null;
      renderGaps();
    });
  },
  escribir_nota: item => {
    run.writer = createWriter($('writer'), { clef: run.level.clef, key: run.level.key, reference: item.referencia || null, onChange: note => { run.answer = note; setReady(true); } });
    if (item.modo === 'dictado') {
      $('dictPlay').addEventListener('click', () => playDictation(item));
      playDictation(item);
    }
  },
  completar_compas: item => {
    run.added = [];
    const pitch = pitchFor(run.level);
    const draw = () => {
      const figs = [...item.dados, ...run.added];
      drawRhythm($('barStaff'), `| ${figs.map(f => figToScore(f, pitch)).join(' ')} |`, run.level, item.compas);
      const left = item.compas - barBeats(figs);
      $('barLeft').textContent = left > 0 ? `${t(TXT.missing)} ${left}` : t(TXT.full);
      setReady(left === 0);
    };
    $('proBody').querySelectorAll('[data-fig]').forEach(b => b.addEventListener('click', () => {
      if (run.checked) return;
      if (barBeats([...item.dados, ...run.added, b.dataset.fig]) > item.compas + 1e-6) { $('barLeft').textContent = t(TXT.noFit); return; }
      run.added.push(b.dataset.fig);
      draw();
    }));
    $('barUndo').addEventListener('click', () => { if (!run.checked) { run.added.pop(); draw(); } });
    draw();
  },
  marcar_ritmo: item => {
    const text = rhythmToScore(item.ritmo, pitchFor(run.level));
    drawRhythm($('rhythmStaff'), text, run.level, item.compas);
    $('rhythmListen').addEventListener('click', () => playRhythm(item.ritmo, item.bpm));
    $('rhythmStart').addEventListener('click', () => {
      if (run.checked || run.stopTaps) return;
      $('rhythmStart').disabled = true;
      startTaps(item);
    });
    $('relaxCheck').hidden = true;
  },
  secuencia_logica: () => {
    renderSeq();
    bindPads(hand => {
      if (run.checked || run.seq.picked.length >= run.seq.slots.length) return;
      audio.drumHit(audio.audioTime(), run.seq.picked.length === 0, 0.8);
      run.seq.picked.push(hand);
      renderSeq();
    });
    $('seqUndo').addEventListener('click', () => { if (!run.checked) { run.seq.picked.pop(); renderSeq(); } });
  },
  tocar_baquetas: item => {
    drawRhythm($('rhythmStaff'), rhythmToScore(item.ritmo, pitchFor(run.level)), run.level, item.compas, item.manos);
    $('rhythmListen').addEventListener('click', () => playRhythm(item.ritmo, item.bpm));
    bindPads(hand => run.onHit && run.onHit(hand));
    $('rhythmStart').addEventListener('click', () => {
      if (run.checked || run.stopTaps) return;
      $('rhythmStart').disabled = true;
      startSticks(item);
    });
    $('relaxCheck').hidden = true;
  },
};

const CHECK = {
  opcion_multiple: item => withMark(it => run.answer === it.respuesta_correcta, item),
  verdadero_falso: item => withMark(it => (run.answer === 0) === it.respuesta_correcta, item),
  zona_tactil: item => {
    const ok = run.answer === item.respuesta_correcta;
    $('proBody').querySelectorAll('[data-zone]').forEach(z => {
      const k = Number(z.dataset.zone);
      if (k === item.respuesta_correcta) z.classList.add('right');
      else if (k === run.answer) z.classList.add('wrong');
    });
    return ok;
  },
  completar_hueco: item => {
    const words = run.gaps.blanks.map(k => run.gaps.chips[k]);
    const ok = words.every((w, i) => w === item.palabras_correctas[i]);
    $('gapText').querySelectorAll('[data-gap]').forEach((g, i) => g.classList.add(words[i] === item.palabras_correctas[i] ? 'right' : 'wrong'));
    return ok;
  },
  escribir_nota: item => {
    const ok = !!run.answer && sameWrittenNote(run.answer, item.nota);
    run.writer.reveal(item.nota, ok);
    if (item.modo === 'dictado' || !ok) audio.playTone(parseNoteMidi(item.nota), 1);
    return ok;
  },
  completar_compas: item => checkBar(item, run.added),
  marcar_ritmo: () => false,
  tocar_baquetas: () => false,
  secuencia_logica: item => {
    const { picked } = run.seq;
    const ok = picked.every((h, i) => h === item.secuencia_correcta[i]);
    $('seqSlots').querySelectorAll('.seq-slot').forEach((el, i) => el.classList.add(picked[i] === item.secuencia_correcta[i] ? 'right' : 'wrong'));
    if (!ok) {
      const sol = $('seqSolution');
      sol.hidden = false;
      sol.innerHTML = `<span>${esc(TXT.solution)}</span> <b>${item.secuencia_correcta.join(' ')}</b>`;
    }
    return ok;
  },
};
