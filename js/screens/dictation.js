// Dictados (Estudio): eliges nivel, compás y longitud; escuchas el dictado tres veces (con el acorde de tónica, o la
// cadencia I-IV-V7-I en los niveles con menor, y un compás de claqueta antes de cada escucha) y lo tocas de oído.
// La app capta las notas y su instante por el micrófono, las cuantiza a la rejilla del nivel y las corrige nota a nota
// (dictation-result.js).
import { $, esc, toast, starsHtml } from '../ui.js';
import { register, back } from '../router.js';
import { getState, update, logPractice } from '../store.js';
import { instrumentById, foldOctave } from '../instruments.js';
import { keyLabel, scaleNames, MAJOR } from '../generate.js';
import * as audio from '../audio.js';
import { createTracker } from '../tracker.js';
import {
  LISTENS, EXTRA_LISTEN_PENALTY, LEVEL_COUNT, levelsFor, levelConfig, metersFor, barsFor, makeDictation, tonicTriad,
  cadenceChords, countInPlan, bestKey, recommendedLevel,
} from '../dictation.js';
import { quantizeBest, scoreDictation, dictationStars } from '../dictation-score.js';
import { renderResult, expectedEvents, playDrums } from './dictation-result.js';
import { reportLmTool } from '../lm/bridge.js';

const TICK_MS = 20;
const UI_MS = 50;
const CHORD_S = 1.4;
const CADENCE_CHORD_S = 0.8;
const AFTER_CHORD_MS = 250;
const PAUSE_MS = 3000;
const AFTER_PLAY_MS = 300;
// Captador rápido para figuras cortas: la nota vale tras 60 ms estable (más lo que tarda el análisis)
const STABLE_MS = 60;
const ONSET_LAG_S = 0.12;
// Fin automático: tras la duración del dictado, este margen y un rato sin sonido (o, como mucho, MAX_TAIL_S)
const END_MARGIN_S = 1.2;
const SILENCE_END_S = 0.8;
const MAX_TAIL_S = 5;
const RANGE_SLACK = 2;
const PERC_MIDI = 72;
const LEVEL_METER_GAIN = 8;

const body = $('dictBody');
let run = null;     // dictado en curso: { dict, inst, listens, extra, startedAt }
let capture = null; // toma en curso
let session = 0;    // cada fase nueva invalida las esperas de la anterior
let stops = [];
// Lanzado desde una unidad del curso de Lenguaje Musical: { id, level, meter, bars, seed } (sin elegir nivel)
let lmCtx = null;

const inst = () => instrumentById(getState().instrument);
const saved = () => getState().dictation || {};
const bests = () => saved().best || {};
// Aviso para el lector de pantalla (lo que se ve está en la propia pantalla)
const setStatus = text => { $('dictStatus').textContent = text; };

function normalizedOpts(src = saved().opts || {}) {
  const perc = !!inst().rhythmOnly;
  const o = { level: 1, bars: 4, meter: null, ...src };
  const level = Math.min(LEVEL_COUNT, Math.max(1, Number(o.level) || 1));
  const meters = metersFor(level, perc);
  const meter = meters.includes(o.meter) ? o.meter : (meters.includes('4/4') ? '4/4' : meters[0]);
  const barsOk = barsFor(level, meter, perc);
  return { level, meter, bars: barsOk.includes(o.bars) ? o.bars : 4 };
}
const saveOpts = patch => update({ dictation: { ...saved(), opts: { ...normalizedOpts(), ...patch } } });

// ---------- Esperas que se cancelan al cambiar de fase o salir ----------
function cancel() {
  session++;
  stops.forEach(fn => { try { fn(); } catch (e) { /* ya parado */ } });
  stops = [];
  if (capture) { clearInterval(capture.tick); clearInterval(capture.ui); capture = null; }
  audio.stopOnsetCapture();
}
function begin() { cancel(); return session; }
const live = token => token === session;
function wait(ms) {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    stops.push(() => clearTimeout(id));
  });
}
function every(ms, fn) {
  const id = setInterval(fn, ms);
  stops.push(() => clearInterval(id));
  return id;
}

// ---------- 1. Elegir ----------
// Las estrellas de la lista son las mejores conseguidas en la corrección (misma regla: dictationStars)
function levelButton(cfg, level, { selected, best, stars, recommended }) {
  const meta = [
    best ? `${starsHtml(stars ?? dictationStars(best))}<small>Récord ${best} %</small>` : '',
    recommended ? '<span class="pill dict-rec">Recomendado</span>' : '',
  ].join('');
  return `<button type="button" class="dict-level" data-level="${level}" aria-pressed="${selected}">
    <span class="dict-lv-num" aria-hidden="true">${level}</span><span class="sr-only">Nivel ${level}</span>
    <span class="dict-lv-text"><b>${esc(cfg.name)}</b><small>${esc(cfg.desc)}</small>${meta ? `<span class="dict-lv-meta">${meta}</span>` : ''}</span></button>`;
}

function segButtons(attr, values, current, label) {
  return values.map(v => `<button type="button" data-${attr}="${v}" aria-pressed="${v === current}">${label(v)}</button>`).join('');
}

// Tonalidad del nivel elegido: la de la banda, su relativo menor o «puede cambiar» en el último nivel
function keyInfo(i, level) {
  const cfg = levelConfig(level, false);
  if (cfg.minor === 1) {
    const rel = scaleNames(i.bandKey, MAJOR)[5];
    const name = `${rel.letter}${rel.acc > 0 ? '#' : rel.acc < 0 ? 'b' : ''}m`;
    return `<p class="dict-key"><span>Tonalidad:</span> <b>${esc(keyLabel(name))}</b> <small class="muted">(relativo menor de tu banda)</small></p>`;
  }
  const note = cfg.nearKeys ? '<p class="muted small">En este nivel puede cambiar a una tonalidad vecina o a menor.</p>' : '';
  return `<p class="dict-key"><span>Tonalidad:</span> <b>${esc(keyLabel(i.bandKey))}</b> <small class="muted">(la de tu banda)</small></p>${note}`;
}

function renderSetup({ focus = false } = {}) {
  cancel();
  run = null;
  const i = inst();
  const perc = !!i.rhythmOnly;
  const o = normalizedOpts();
  const best = bests();
  const rec = recommendedLevel(best, perc, i.id, saved().pass);
  const meters = metersFor(o.level, perc);
  const barOpts = barsFor(o.level, o.meter, perc);
  setStatus('');
  body.innerHTML = `<p class="muted small">${perc
    ? 'Escucha un ritmo corto tres veces y tócalo de oído. Solo cuenta el ritmo.'
    : 'Escucha una melodía corta tres veces y tócala de oído. La app la corrige nota a nota.'}</p>
    ${perc ? '' : keyInfo(i, o.level)}
    <div class="setting"><span id="dictLevelLabel">Nivel</span>
      <div class="dict-levels" role="group" aria-labelledby="dictLevelLabel">${levelsFor(perc).map((cfg, k) => levelButton(cfg, k + 1, {
        selected: k + 1 === o.level, best: best[bestKey(k + 1, perc, i.id)] || 0, stars: (saved().stars || {})[bestKey(k + 1, perc, i.id)], recommended: k + 1 === rec,
      })).join('')}</div></div>
    <div class="setting"><span id="dictMeterLabel">Compás</span>
      <div class="seg ${['', 'one', 'two', 'three', 'four'][meters.length]}" role="group" aria-labelledby="dictMeterLabel">${segButtons('meter', meters, o.meter, m => m)}</div></div>
    <div class="setting"><span id="dictBarsLabel">Longitud</span>
      <div class="seg ${barOpts.length === 3 ? 'three' : barOpts.length === 2 ? 'two' : 'one'}" role="group" aria-labelledby="dictBarsLabel">${segButtons('bars', barOpts, o.bars, b => `${b} compases`)}</div>
      ${o.level > 5 ? '<small class="muted">Ocho compases, solo hasta el nivel 5: más largos no se recuerdan con tres escuchas.</small>' : ''}</div>
    <button id="dictGo" class="btn big" type="button">Empezar el dictado</button>`;
  if (focus) body.querySelector('.dict-level[aria-pressed="true"]').focus();
}

function pickOption(target) {
  const level = target.closest('[data-level]');
  const meter = target.closest('[data-meter]');
  const barsBtn = target.closest('[data-bars]');
  if (level) saveOpts({ level: Number(level.dataset.level) });
  else if (meter) saveOpts({ meter: meter.dataset.meter });
  else if (barsBtn) saveOpts({ bars: Number(barsBtn.dataset.bars) });
  else return false;
  const sel = level ? `[data-level="${level.dataset.level}"]` : meter ? `[data-meter="${meter.dataset.meter}"]` : `[data-bars="${barsBtn.dataset.bars}"]`;
  renderSetup();
  const again = body.querySelector(sel) || body.querySelector('[data-meter][aria-pressed="true"]');
  if (again) again.focus();
  return true;
}

function startDictation() {
  const i = inst();
  const o = lmCtx ? normalizedOpts({ level: lmCtx.level, meter: lmCtx.meter, bars: lmCtx.bars }) : normalizedOpts();
  if (!lmCtx) saveOpts(o);
  const seed = lmCtx && Number.isFinite(lmCtx.seed) ? lmCtx.seed : Math.floor(Math.random() * 1e9);
  const dict = makeDictation(i, { ...o, seed, ...(lmCtx && lmCtx.cells ? { cells: lmCtx.cells, meter: lmCtx.meter || o.meter } : {}) });
  if (!dict) { toast('Este dictado no cabe en el registro de tu instrumento'); if (lmCtx) back(); return; }
  run = { dict, inst: i, listens: 0, extra: 0, startedAt: performance.now(), canPlay: false };
  listenCycle();
}

// Desde una unidad no se cambia de nivel: el botón vuelve a la unidad
const setupButton = () => `<button id="dictBackSetup" class="btn ghost small" type="button">${lmCtx ? 'Volver a la unidad' : 'Cambiar nivel'}</button>`;

// ---------- 2-3. Situarse y escuchar ----------
const headerText = d => `Nivel ${d.level} · ${d.meter} · ${d.bars} compases`;
const beforeText = d => (d.rhythmOnly ? 'Antes de cada escucha suena un compás de claqueta.'
  : d.cadence ? 'Antes de cada escucha suena la cadencia de la tonalidad y un compás de claqueta.'
    : 'Antes de cada escucha suena el acorde de tónica y un compás de claqueta.');

function renderListen() {
  const d = run.dict;
  body.innerHTML = `<p class="eyebrow">${headerText(d)}</p>
    ${d.keyName ? `<p class="dict-key"><span>Tonalidad:</span> <b>${esc(d.keyName)}</b></p>` : ''}
    <div class="dict-stage">
      <p id="dictCount" class="dict-count" tabindex="-1">Escucha 1 de 3</p>
      <ol class="dict-dots" aria-hidden="true">${Array.from({ length: LISTENS }, () => '<li></li>').join('')}</ol>
      <p id="dictPhase" class="dict-phase">Preparado</p>
      <div class="dict-progress" aria-hidden="true"><i id="dictBar"></i></div>
    </div>
    <div class="controls">
      <button id="dictPlay" class="btn" type="button" ${run.canPlay ? '' : 'disabled'}>Tocar ahora</button>
      <button id="dictExtra" class="btn ghost" type="button" hidden>Otra escucha (−${EXTRA_LISTEN_PENALTY} puntos)</button>
      ${setupButton()}
    </div>
    <p class="muted small center"><span>${beforeText(d)}</span> <span>Entre escucha y escucha hay una pausa para pensar.</span></p>`;
}

const phaseText = text => { const el = $('dictPhase'); if (el) el.textContent = text; };
const barWidth = frac => { const el = $('dictBar'); if (el) el.style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`; };

function markListen(n, extra) {
  const label = extra ? `Escucha extra (−${EXTRA_LISTEN_PENALTY} puntos)` : `Escucha ${n} de ${LISTENS}`;
  $('dictCount').textContent = label;
  // si el foco ya está en el contador, el lector lo lee al enfocarlo: no se repite por el aviso de estado
  if (document.activeElement !== $('dictCount')) setStatus(label);
  body.querySelectorAll('.dict-dots li').forEach((li, k) => li.classList.toggle('on', k < n));
}

// La claqueta del compás (dos compases en 2/4; en 6/8, acentos en la 1 y la 4). Devuelve cuándo acaba.
function countIn(d) {
  const plan = countInPlan(d);
  return { end: audio.countIn(plan.clicks, plan.bpm, true, plan.accents), plan };
}

// Muestra la claqueta (1, 2, 3…) y luego el avance
function clickNumber(plan, end, now) {
  const spc = 60 / plan.bpm;
  return Math.max(1, Math.min(plan.clicks, Math.floor((now - (end - plan.clicks * spc)) / spc) + 1));
}

function followPlayback(d, count, onMusic) {
  const total = d.totalBeats * 60 / d.bpm;
  let started = false;
  every(UI_MS, () => {
    const now = audio.audioTime();
    if (now < count.end) { phaseText(`Claqueta: ${clickNumber(count.plan, count.end, now)}`); return; }
    if (!started) { started = true; onMusic(); }
    barWidth((now - count.end) / total);
  });
  return total;
}

const real = midis => midis.map(m => m + run.inst.transpose);

// Acorde de tónica o cadencia I-IV-V7-I (para situarse en la tonalidad)
async function situate(token, d) {
  if (d.rhythmOnly) return true;
  if (!d.cadence) {
    phaseText('Acorde de tónica');
    stops.push(audio.playChord(real(tonicTriad(d)), CHORD_S));
    await wait(CHORD_S * 1000 + AFTER_CHORD_MS);
    return live(token);
  }
  phaseText('Cadencia de la tonalidad');
  for (const chord of cadenceChords(d)) {
    stops.push(audio.playChord(real(chord), CADENCE_CHORD_S));
    await wait(CADENCE_CHORD_S * 1000);
    if (!live(token)) return false;
  }
  await wait(AFTER_CHORD_MS);
  return live(token);
}

async function playOnce(token, n, extra = false) {
  const d = run.dict;
  markListen(n, extra);
  barWidth(0);
  if (!(await situate(token, d))) return;
  const count = countIn(d);
  const total = followPlayback(d, count, () => phaseText('Escucha…'));
  if (d.rhythmOnly) stops.push(playDrums(d.notes, d.bpm, d.barBeats, count.end));
  else stops.push(audio.playScore(d.notes, d.bpm, () => {}, { at: count.end }));
  await wait((count.end - audio.audioTime() + total) * 1000 + AFTER_PLAY_MS);
  barWidth(1);
}

// Tras la primera escucha ya se puede tocar: se avisa y el foco va al botón
function allowPlay() {
  if (run.canPlay) return;
  run.canPlay = true;
  $('dictPlay').disabled = false;
  setStatus('Ya puedes tocar cuando quieras: pulsa «Tocar ahora»');
  $('dictPlay').focus();
}

async function listenCycle() {
  const token = begin();
  renderListen();
  $('dictCount').focus();
  for (let k = run.listens; k < LISTENS; k++) {
    await playOnce(token, k + 1);
    if (!live(token)) return;
    run.listens = k + 1;
    allowPlay();
    if (k + 1 < LISTENS) {
      phaseText('Pausa: repásalo en tu cabeza');
      await wait(PAUSE_MS);
      if (!live(token)) return;
    }
  }
  readyToPlay();
}

function readyToPlay() {
  cancel();
  phaseText('Cuando quieras, toca lo que has oído');
  setStatus('Ya puedes tocar: pulsa «Tocar ahora»');
  allowPlay();
  $('dictExtra').hidden = run.extra > 0;
  $('dictPlay').focus();
}

async function extraListen() {
  if (!run || run.extra > 0) return;
  run.extra = 1;
  if (!body.querySelector('.dict-dots')) renderListen();
  const token = begin();
  $('dictExtra').hidden = true;
  $('dictCount').focus();
  await playOnce(token, LISTENS, true);
  if (!live(token)) return;
  readyToPlay();
}

// ---------- 4. Tocar ----------
// Si se ha ido a tocar antes de oír las tres escuchas, las que quedan siguen ahí (sin penalización)
const listensLeft = () => (run ? LISTENS - run.listens : 0);
const relistenButton = (id = 'dictRelisten') => (listensLeft() > 0 ? `<button id="${id}" class="btn ghost" type="button">Escuchar otra vez (te ${listensLeft() === 1 ? 'queda 1' : `quedan ${listensLeft()}`})</button>` : '');
function relisten() {
  if (!run || listensLeft() <= 0) return;
  listenCycle();
}

function renderPlay() {
  body.innerHTML = `<p class="eyebrow">${headerText(run.dict)}</p>
    <div id="dictGate" class="mic-gate" hidden>
      <p><strong>Necesito el micrófono</strong> para oír lo que tocas.</p>
      <p id="dictMicError" class="muted"></p>
      <div class="controls"><button id="dictMic" class="btn" type="button">Activar micrófono</button>${relistenButton('dictRelistenGate')}
        ${setupButton()}</div>
    </div>
    <div id="dictStage" class="dict-stage">
      <p id="dictCount" class="dict-count" tabindex="-1">Tu turno</p>
      <p id="dictPhase" class="dict-phase">Atento a la claqueta</p>
      <div class="dict-progress" aria-hidden="true"><i id="dictBar"></i></div>
      <div class="dict-ear"><span class="dict-mic" aria-hidden="true"><i id="dictMicLevel"></i></span><span id="dictHeard">Te escucho</span></div>
    </div>
    <div id="dictPlayControls" class="controls">
      <button id="dictStop" class="btn big" type="button">Terminar</button>
      ${relistenButton()}
    </div>
    <p id="dictPlayHint" class="muted small center">Termina solo cuando pasa el tiempo del dictado y dejas de tocar.</p>`;
}

function showMicError(err) {
  $('dictGate').hidden = false;
  $('dictStage').hidden = true;
  $('dictMicError').textContent = audio.micErrorText(err);
  $('dictPlayControls').hidden = true;
  $('dictPlayHint').hidden = true;
  setStatus(audio.micDenied() ? 'Micrófono sin permiso' : 'No se pudo abrir el micrófono');
  $('dictMic').focus();
}

async function startPlaying() {
  if (!run) return;
  const token = begin();
  renderPlay();
  try {
    await audio.startMic();
  } catch (err) {
    if (live(token)) showMicError(err);
    return;
  }
  if (!live(token)) return;
  $('dictCount').focus();
  beginCapture();
}

function beginCapture() {
  const d = run.dict;
  const count = countIn(d);
  setStatus('Atento a la claqueta: después, toca lo que has oído');
  capture = { count, t0: count.end, spb: 60 / d.bpm, events: [], current: null, lastSound: audio.audioTime(), tracker: createTracker({ stableMs: STABLE_MS }), announced: false };
  if (d.rhythmOnly) {
    const lag = getState().percLatency || audio.outputLatency();
    audio.startOnsetCapture(hits => {
      if (!capture) return;
      hits.forEach(h => capture.events.push({ time: h.time - lag, midi: PERC_MIDI }));
      capture.lastSound = audio.audioTime();
    });
  }
  capture.tick = setInterval(pitchTick, TICK_MS);
  capture.ui = setInterval(playUi, UI_MS);
}

// Lectura del micrófono: nivel para el indicador y, en instrumentos de altura, las notas nuevas con su instante
function pitchTick() {
  const c = capture;
  if (!c) return;
  const p = audio.readPitch();
  if (!p) return;
  const meter = $('dictMicLevel');
  if (meter) meter.style.transform = `scaleX(${Math.min(1, (p.level || 0) * LEVEL_METER_GAIN)})`;
  if (run.dict.rhythmOnly) return;
  const now = audio.audioTime() - audio.outputLatency();
  if (p.freq === null) {
    if (c.current && c.current.end === null) c.current.end = now;
    c.tracker.feed(p, TICK_MS);
    return;
  }
  c.lastSound = audio.audioTime();
  const midi = c.tracker.feed(p, TICK_MS);
  if (midi === null) return;
  const { written } = run.inst;
  if (midi < written[0] - RANGE_SLACK || midi > written[1] + RANGE_SLACK) return;
  const at = now - ONSET_LAG_S;
  if (c.current && c.current.end === null) c.current.end = at;
  c.current = { time: at, midi, end: null };
  c.events.push(c.current);
}

const heardText = (n, perc) => (perc ? `Golpes oídos: ${n}` : `Notas oídas: ${n}`);

function playUi() {
  const c = capture;
  if (!c) return;
  const d = run.dict;
  const now = audio.audioTime();
  if (now < c.t0) { phaseText(`Claqueta: ${clickNumber(c.count.plan, c.t0, now)}`); return; }
  if (!c.announced) { c.announced = true; setStatus('¡Ahora! Toca'); }
  const beat = (now - c.t0) / c.spb;
  const bar = Math.min(d.bars, Math.floor(beat / d.barBeats) + 1);
  phaseText(beat < d.totalBeats ? `Compás ${bar} de ${d.bars}` : 'Termina la última nota');
  barWidth(beat / d.totalBeats);
  $('dictHeard').textContent = heardText(c.events.length, d.rhythmOnly);
  const end = c.t0 + d.totalBeats * c.spb;
  const quiet = audio.audioTime() - c.lastSound > SILENCE_END_S;
  if ((now > end + END_MARGIN_S && quiet) || now > end + MAX_TAIL_S) finishPlaying();
}

function finishPlaying() {
  const c = capture;
  if (!c || !run) return;
  const d = run.dict;
  if (c.current && c.current.end === null) c.current.end = audio.audioTime() - audio.outputLatency();
  cancel();
  const raw = c.events.map(e => ({
    beat: (e.time - c.t0) / c.spb,
    endBeat: d.rhythmOnly || e.end === null || e.end === undefined ? null : (e.end - c.t0) / c.spb,
    midi: e.midi,
  }));
  const expected = expectedEvents(d);
  const played = quantizeBest(raw, { quantum: d.quantum, totalBeats: d.totalBeats, expected, bpm: d.bpm });
  if (!played.length) { renderNothingHeard(); return; }
  const i = run.inst;
  const result = scoreDictation(expected, played, {
    rhythmOnly: d.rhythmOnly, extraListens: run.extra, barBeats: d.barBeats, fold: (m, target) => foldOctave(m, target, i),
  });
  const rec = record(d, result);
  renderResult(body, { dict: d, inst: i, played, result, record: rec, nom: getState().nom }, resultActions());
  if (lmCtx) reportLm(result);
  setStatus(d.rhythmOnly ? `Nota ${result.score} %` : `Nota ${result.score} % · altura ${result.pitchPct} % · ritmo ${result.rhythmPct} %`);
}

function renderNothingHeard() {
  setStatus('No he oído nada');
  body.innerHTML = `<div class="dict-empty">
    <h2 tabindex="-1">No he oído nada</h2>
    <p class="muted">Comprueba que el micrófono no está tapado, acércate un poco y toca más fuerte. Empieza justo después de la claqueta.</p>
    <div class="controls">
      <button id="dictRetry" class="btn" type="button">Volver a tocar</button>
      ${relistenButton() || (run.extra ? '' : `<button id="dictExtraEmpty" class="btn ghost" type="button">Otra escucha (−${EXTRA_LISTEN_PENALTY} puntos)</button>`)}
      ${setupButton()}
    </div></div>`;
  $('dictRetry').focus();
}

// ---------- 5-6. Corrección, estrellas y récord ----------
// Récord por instrumento y nivel. «Nuevo récord» solo si vale algo: con estrellas o mejorando un récord anterior.
function record(d, result) {
  const key = bestKey(d.level, d.rhythmOnly, run.inst.id);
  const prevBest = bests()[key] || 0;
  const pass = saved().pass || {};
  const stars = saved().stars || {};
  update({ dictation: {
    ...saved(), best: { ...bests(), [key]: Math.max(prevBest, result.score) }, pass: result.passed ? { ...pass, [key]: 1 } : pass,
    stars: { ...stars, [key]: Math.max(stars[key] || 0, result.stars) },
  } });
  logPractice((performance.now() - run.startedAt) / 60000, 2 + result.stars);
  const improved = result.score > prevBest && (result.stars >= 1 || prevBest > 0);
  return { prevBest, isRecord: improved, passed: result.passed };
}

// Unidad del curso: el resultado vuelve con el contrato y los botones son «Repetir» y «Volver a la unidad»
function reportLm(result) {
  const mistakes = result.pairs.map(x => (x.state === 'ok' ? null : x.e === null ? 'sobra' : `n${x.e + 1}`)).filter(Boolean);
  reportLmTool(lmCtx, { pct: result.score, stars: result.stars, skills: { dictado: result.score, ritmo: result.rhythmPct }, mistakes });
  const again = $('dictAgain');
  const change = $('dictChange');
  if (again) again.textContent = 'Repetir el dictado';
  if (change) change.textContent = 'Volver a la unidad';
}

function resultActions() {
  return {
    again: () => startDictation(),
    setup: () => (lmCtx ? back() : renderSetup({ focus: true })),
    register: stop => stops.push(stop),
    stopAll: () => { stops.forEach(fn => { try { fn(); } catch (e) { /* ya parado */ } }); stops = []; },
  };
}

// ---------- Eventos ----------
body.addEventListener('click', e => {
  const t = e.target;
  if (pickOption(t)) return;
  const id = t.closest('button') && t.closest('button').id;
  if (id === 'dictGo') startDictation();
  else if (id === 'dictPlay') startPlaying();
  else if (id === 'dictExtra' || id === 'dictExtraEmpty') extraListen();
  else if (id === 'dictStop') finishPlaying();
  else if (id === 'dictRetry' || id === 'dictMic') startPlaying();
  else if (id === 'dictRelisten' || id === 'dictRelistenGate') relisten();
  else if (id === 'dictBackSetup') { if (lmCtx) back(); else renderSetup({ focus: true }); }
});

register('dictation', {
  enter(params = {}) {
    lmCtx = params.lm || null;
    if (lmCtx) startDictation(); else renderSetup();
  },
  leave() { cancel(); run = null; lmCtx = null; },
});
