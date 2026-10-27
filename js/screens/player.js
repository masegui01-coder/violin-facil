// Motor de lección: modo «nota a nota» (espera a que suene bien) y modo «a tempo» (la partitura avanza sola).
import { harmonize, accompanimentNotes, noteValueName, inferKey } from '../harmony.js';
import { $, toast } from '../ui.js';
import { register, go, originTab } from '../router.js';
import { parseScore, noteLabel, isBowed } from '../music.js';
import { lessonMeta, lessonSong, lessonTitle } from '../course.js';
import { createStaff } from '../staff.js';
import { renderDiagram } from '../keydiagram.js';
import { fingeringText } from '../fingerings.js';
import { instrumentById, foldOctave, toleranceFor } from '../instruments.js';
import { octaveShiftFor } from '../songs.js';
import { getState, update, addTuningSamples, recordAttempts, TOLERANCE_CENTS } from '../store.js';
import * as audio from '../audio.js';
import { finishLesson } from './result.js';
import { showPulse, drawPulse } from './pulse.js';
import { decodeScore } from '../passage.js';
import { playHints } from '../coach.js';

const TICK_MS = 30;
const HOLD_MS = 250;
const WRONG_MS = 450;
const RELEASE_DIP = 0.55;
const RELEASE_FALLBACK_MS = 700;
const EARLY_S = 0.1;
const GRACE_S = 0.18;
const LIGHT_EARLY_BEATS = 0.02; // margen para que la nota se encienda al tocar la línea, no un instante después
const MIN_HIT_S = 0.22;
const BPM_STEP = 2;
const BPM_MIN = 30;
const BPM_MAX = 220;
const PRAISE = ['¡Bien!', '¡Muy bien!', '¡Eso es!', '¡Qué buen sonido!', '¡Sigue así!', '¡Perfecto!'];

const staff = createStaff($('lessonStaff'));
const DEMO_LEAD_S = 0.15;
let run = null;
let timer = 0;
let offBeat = null;

const buildMeta = lessonMeta;

const inst = () => instrumentById(getState().instrument);
const tolerance = () => toleranceFor(TOLERANCE_CENTS[getState().tolerance] || TOLERANCE_CENTS.facil, inst());
// Metrónomo en toda la app: la cuenta previa siempre suena, el péndulo siempre se ve y el clic durante la canción es opcional
const metroSound = () => getState().metroClick;
const tempoBpm = () => Math.round(run.bpm * run.speed);

// ---------- Interfaz ----------
function setStatus(text, color) {
  $('status').textContent = text || ' ';
  $('status').style.color = color || '';
}

function setMeter(cents) {
  const dot = $('meterDot');
  if (cents === null) { dot.style.left = '50%'; dot.style.background = 'var(--muted)'; return; }
  const c = Math.max(-50, Math.min(50, cents));
  const tol = tolerance();
  dot.style.left = (50 + c) + '%';
  dot.style.background = Math.abs(cents) <= tol / 2 ? 'var(--ok)' : Math.abs(cents) <= tol ? 'var(--warn)' : 'var(--bad)';
}

function showTarget(index) {
  const note = run.notes[index];
  if (!note || note.rest || run.shown === index) return;
  run.shown = index;
  const nom = getState().nom;
  $('tName').textContent = noteLabel(note, nom);
  $('tName').className = 'name';
  $('tHint').textContent = fingeringText(getState().instrument, note.midi, nom);
  // como el indicador de marchas del coche: la nota que tocas en grande, su valor, y la que viene en pequeño
  $('tValue').textContent = noteValueName(note.beats, note);
  setFill(0);
  showNext(index, nom);
  if (getState().showBoard) renderDiagram($('lessonBoard'), getState().instrument, [note.midi], nom);
}

// Tarjeta «Siguiente» junto a la nota grande, y la siguiente nota marcada en la partitura
function showNext(index, nom) {
  const next = run.playable.find(i => i > index);
  const card = $('tNext');
  card.classList.toggle('last', next === undefined);
  if (run.nextMark !== undefined && run.nextMark > index) staff.setState(run.nextMark, 'future');
  run.nextMark = next;
  if (next === undefined) {
    $('tNextName').textContent = '¡Última!';
    $('tNextHint').textContent = 'Termina con esta';
    return;
  }
  const n = run.notes[next];
  $('tNextName').textContent = noteLabel(n, nom);
  $('tNextHint').textContent = n.midi === run.notes[index].midi ? 'La misma otra vez' : fingeringText(getState().instrument, n.midi, nom);
  staff.setState(next, 'next');
}

// Barra bajo la nota: se va llenando mientras dura
function setFill(frac) {
  $('tFill').style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
}

// Nota que suena en el pulso «beat» (o la siguiente si estamos en un silencio)
function noteAt(beat) {
  let idx;
  for (const i of run.playable) { if (run.notes[i].start <= beat + 1e-6) idx = i; else break; }
  return idx === undefined ? run.playable[0] : idx;
}

function updateProgress(done) {
  $('lessonCount').textContent = done + '/' + run.playable.length;
  $('lessonProg').style.width = (done / run.playable.length * 100) + '%';
}

function showHeard(p, target) {
  if (!p || p.freq === null) { $('heard').innerHTML = '&nbsp;'; setMeter(null); return null; }
  const detected = target ? foldOctave(p.midi, target.midi, inst()) : p.midi;
  const cents = target ? (detected - target.midi) * 100 : 0;
  $('heard').textContent = 'Oigo ' + noteLabel({ midi: Math.round(detected) }, getState().nom, !isBowed(getState().instrument)) + (target ? ` (${cents >= 0 ? '+' : ''}${Math.round(cents)} cents)` : '');
  setMeter(target ? (Math.abs(cents) <= 100 ? cents : Math.sign(cents) * 50) : null);
  return cents;
}

function renderTempoControls() {
  const learn = run.mode === 'learn';
  $('lmBpm').textContent = learn ? getState().bpm : tempoBpm();
  $('lessonMetro').setAttribute('aria-pressed', audio.metronome().on);
  document.querySelector('#lesson .metro-group').hidden = !learn;
  $('lmClick').checked = getState().metroClick;
  $('lmDown').hidden = !learn;
  $('lmUp').hidden = !learn;
  $('tempoBpm').textContent = `♩ = ${tempoBpm()}`;
  document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.speed) === run.speed));
  $('playControls').hidden = !run.playing || run.oneTake;
  $('tempoBar').hidden = learn || run.playing;
}

// ---------- Modo nota a nota ----------
function learnFocus() {
  while (run.pos < run.notes.length && run.notes[run.pos].rest) run.pos++;
  if (run.pos >= run.notes.length) { finish(); return; }
  staff.focus(run.pos);
  showTarget(run.pos);
  updateProgress(run.playable.indexOf(run.pos));
}

function learnAdvance(skipped) {
  const prev = run.notes[run.pos];
  staff.setState(run.pos, skipped ? 'miss' : 'done');
  if (skipped) { run.skips++; run.missed.add(run.pos); run.skipped.add(run.pos); }
  else setStatus(PRAISE[run.praise++ % PRAISE.length], 'var(--ok)');
  run.pos++;
  run.hold = 0; run.wrong = 0; run.wrongCounted = false; run.peak = 0; run.releaseWait = 0;
  const next = run.notes[run.pos];
  run.needRelease = !skipped && next && !next.rest && next.midi === prev.midi && !prev.tie; // ligada: sin volver a atacar
  learnFocus();
}

function learnTick(p, dt) {
  const target = run.notes[run.pos];
  if (p === 'masked') {
    if (run.hold > 0 && !run.needRelease) { run.hold += dt; if (run.hold >= HOLD_MS) learnAdvance(false); }
    return;
  }
  const cents = showHeard(p, target);
  if (cents === null) { run.hold = 0; run.wrong = 0; run.needRelease = false; return; }
  if (run.needRelease) {
    run.peak = Math.max(run.peak, p.level);
    run.releaseWait += dt;
    if (p.level < run.peak * RELEASE_DIP || run.releaseWait >= RELEASE_FALLBACK_MS) run.needRelease = false;
    else { setStatus(playHints(instrumentById(getState().instrument)).repeat); return; }
  }
  if (Math.abs(cents) <= tolerance()) {
    run.wrong = 0;
    run.hold += dt;
    setFill(run.hold / HOLD_MS);
    $('tName').className = 'name ok';
    run.centsSum += cents; run.centsN++;
    if (run.hold >= HOLD_MS) {
      run.tuning.push({ midi: target.midi, cents: run.centsSum / run.centsN });
      run.centsSum = 0; run.centsN = 0;
      learnAdvance(false);
    }
    return;
  }
  run.hold = 0;
  run.centsSum = 0; run.centsN = 0;
  run.wrong += dt;
  $('tName').className = 'name';
  if (run.wrong >= WRONG_MS) {
    $('tName').className = 'name bad';
    const hints = playHints(instrumentById(getState().instrument));
    setStatus(Math.abs(cents) > 100 ? 'Esa es otra nota' : cents > 0 ? hints.sharp : hints.flat, 'var(--bad)');
    if (!run.wrongCounted) { run.errors++; run.wrongCounted = true; run.missed.add(run.pos); run.slips.push({ midi: target.midi, off: Math.round(cents / 100) }); }
  }
}

// ---------- Modo a tempo ----------
function barStartBefore(beat) {
  const idx = run.bars.findIndex(b => beat < b.start + b.beats);
  const current = idx < 0 ? run.bars.length - 1 : idx;
  return run.bars[Math.max(0, current - 1)].start;
}

// Arranca (o vuelve a arrancar) desde un pulso concreto con un compás de cuenta previa
function playFrom(beatStart) {
  audio.stopMetronome();
  run.notes.forEach((n, i) => {
    if (n.rest || n.start < beatStart) return;
    n.judged = false; n.hit = false; n.inTune = 0;
    staff.setState(i, 'future');
  });
  run.spb = 60 / (run.bpm * run.speed);
  const countEnd = audio.countIn(run.time, tempoBpm(), true);
  run.t0 = countEnd - beatStart * run.spb;
  run.countEnd = countEnd;
  run.beatStart = beatStart;
  run.playing = true;
  run.shown = -1;
  showTarget(run.playable.find(i => !run.notes[i].judged) ?? run.playable[0]);
  updateProgress(run.playable.filter(i => run.notes[i].judged).length);
  if (metroSound()) {
    const firstBar = run.t0 + run.pickup * run.spb;
    const barLen = run.spb * run.time;
    audio.configureMetronome({ bpm: tempoBpm(), meter: run.time, sound: true });
    audio.startMetronome(firstBar + Math.max(0, Math.ceil((countEnd - firstBar) / barLen - 1e-6)) * barLen);
  }
  showPulse(true);
  if (run.stopAccomp) run.stopAccomp();
  run.stopAccomp = getState().accompOn && run.accompaniment.length ? audio.playAccompaniment(run.accompaniment, run.t0, run.spb) : null;
  audio.startRecording();
  setStatus('Sigue la línea y toca cada nota cuando llegue');
  renderTempoControls();
}

function startTempo() {
  if (!audio.micReady()) { $('micGate').hidden = false; setStatus('Activa el micrófono para empezar', 'var(--bad)'); return; }
  playFrom(0);
}

function judgePassed(t) {
  run.playable.forEach(i => {
    const n = run.notes[i];
    if (!n.judged && t > (n.start + n.beats) * run.spb + GRACE_S) {
      n.judged = true;
      staff.setState(i, n.hit ? 'done' : 'miss');
      updateProgress(run.playable.filter(j => run.notes[j].judged).length);
    }
  });
}

// La nota se enciende en el instante en que su cabeza toca la línea y se apaga al acabar (si aún no se ha juzgado)
function lightSounding(idx, seenBeat) {
  const n = run.notes[idx];
  const lit = seenBeat >= n.start - LIGHT_EARLY_BEATS && seenBeat < n.start + n.beats ? idx : null;
  if (lit === run.lit) return;
  const prev = run.lit !== null ? run.notes[run.lit] : null;
  if (prev && !prev.judged && !prev.hit) staff.setState(run.lit, 'future');
  if (lit !== null && !n.hit) staff.setState(lit, 'current');
  run.lit = lit;
}

function tempoTick(p, dt) {
  const t = audio.audioTime() - run.t0;
  const beat = t / run.spb;
  // lo que se ve va con lo que se oye (el altavoz suena un poco después); la escucha del micrófono no cambia
  const seenBeat = beat - audio.outputLatency() / run.spb;
  drawPulse(seenBeat - run.pickup, run.time);
  const countLeft = run.countEnd - audio.audioTime();
  if (countLeft > 0) {
    $('countdown').hidden = false;
    $('countdown').textContent = Math.ceil(countLeft / run.spb);
    staff.scrollTo(run.beatStart, false);
    return;
  }
  $('countdown').hidden = true;
  staff.scrollTo(seenBeat, false);
  judgePassed(t);
  // notas que ya han empezado y siguen abiertas (la anterior conserva un margen de gracia)
  const started = run.playable.filter(i => !run.notes[i].judged && t >= run.notes[i].start * run.spb - EARLY_S);
  const judging = started.length ? started[started.length - 1] : run.playable.find(i => !run.notes[i].judged);
  // en pantalla, la nota que está sonando ahora (no la siguiente) y cuánto le queda
  const shownIdx = noteAt(seenBeat);
  showTarget(shownIdx);
  lightSounding(shownIdx, seenBeat);
  setFill((seenBeat - run.notes[shownIdx].start) / run.notes[shownIdx].beats);
  if (p !== 'masked') {
    showHeard(p, judging !== undefined ? run.notes[judging] : null);
    run.heardMidi = p && p.freq ? p.midi : null;
  }
  if (run.heardMidi !== null && run.heardMidi !== undefined) {
    started.forEach(i => {
      const n = run.notes[i];
      const heard = foldOctave(run.heardMidi, n.midi, inst());
      if (n.hit || Math.abs(heard - n.midi) * 100 > tolerance()) return;
      n.inTune = (n.inTune || 0) + dt / 1000;
      n.centsSum = (n.centsSum || 0) + (heard - n.midi) * 100;
      n.centsN = (n.centsN || 0) + 1;
      if (n.inTune >= Math.min(MIN_HIT_S, n.beats * run.spb * 0.5)) {
        n.hit = true;
        run.tuning.push({ midi: n.midi, cents: n.centsSum / n.centsN });
        staff.setState(i, 'done');
        if (i === shownIdx) $('tName').className = 'name ok';
      }
    });
  }
  if (t > run.totalBeats * run.spb + GRACE_S) finish();
}

// ---------- Ciclo ----------
function tick() {
  const now = performance.now();
  const dt = Math.min(100, now - run.last);
  run.last = now;
  if (run.finished || run.demoStop) return;
  if (run.mode === 'learn' && audio.metronome().on) drawPulse(audio.metronomeBeat(), getState().meter);
  if (!audio.micReady()) return;
  const p = audio.clickMasked() ? 'masked' : audio.readPitch();
  if (run.mode === 'learn') learnTick(p, dt);
  else if (run.playing) tempoTick(p, dt);
}

function scoreStars() {
  if (run.mode === 'tempo') {
    const hits = run.playable.filter(i => run.notes[i].hit).length;
    const acc = hits / run.playable.length;
    return { stars: acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : acc >= 0.5 ? 1 : 0, text: `${hits} de ${run.playable.length} notas a tiempo (${Math.round(acc * 100)} %)` };
  }
  const total = run.playable.length;
  const score = (total - run.skips - run.errors * 0.5) / total;
  const stars = run.skips >= total ? 0 : score >= 0.9 ? 3 : score >= 0.65 ? 2 : 1;
  return { stars, text: `${total - run.skips} de ${total} notas · ${run.errors} ${run.errors === 1 ? 'fallo' : 'fallos'}` + (run.skips ? ` · ${run.skips} saltadas` : '') };
}

function scoreAccuracy() {
  if (run.mode === 'tempo') return run.playable.filter(i => run.notes[i].hit).length / run.playable.length;
  return Math.max(0, (run.playable.length - run.skips - run.errors * 0.5) / run.playable.length);
}

function finish() {
  if (run.finished) return;
  run.finished = true;
  audio.stopMetronome();
  if (run.stopAccomp) run.stopAccomp();
  const { stars, text } = scoreStars();
  addTuningSamples(run.tuning);
  if (run.mode === 'learn') recordAttempts(run.playable.filter(i => !run.skipped.has(i)).map(i => run.notes[i].midi), run.slips);
  const minutes = (performance.now() - run.startedAt) / 60000;
  finishLesson({ lesson: run.lesson, mode: run.mode, from: run.from, stars, text, title: run.title, minutes, accuracy: scoreAccuracy(), take: audio.stopRecording(), speed: run.speed,
    missed: run.playable.map(i => (run.mode === 'tempo' ? !run.notes[i].hit : run.missed.has(i))), review: reviewOf() });
}

// La partitura entera para el resultado: verde bien, naranja te costó (fallaste antes de acertarla), rojo fallada o saltada
function reviewOf() {
  const states = run.notes.map((n, i) => {
    if (n.rest) return 'future';
    if (run.mode === 'tempo') return n.hit ? 'done' : 'miss';
    return run.skipped.has(i) ? 'miss' : run.missed.has(i) ? 'heat1' : 'done';
  });
  return { score: run.score, key: run.renderOpts.key, time: run.renderOpts.time, clef: run.renderOpts.clef, sticking: run.renderOpts.sticking, states };
}

// ---------- Demo ----------
function toggleDemo() {
  if (run.demoStop) { stopDemo(); return; }
  if (run.playing) return;
  $('playDemo').lastChild.textContent = 'Parar';
  const bpm = run.mode === 'tempo' ? tempoBpm() : run.bpm;
  const s = getState();
  const at = audio.ctx().currentTime + DEMO_LEAD_S;
  const withAccomp = s.accompOn && run.accompaniment.length;
  const stopScore = audio.playScore(run.notes, bpm, (beat, done) => {
    if (done) { stopDemo(); return; }
    if (beat < 0) return;
    const idx = noteAt(beat);
    if (idx !== run.demoIdx) { run.demoIdx = idx; staff.focus(idx); showTarget(idx); }
    setFill((beat - run.notes[idx].start) / run.notes[idx].beats);
  }, { at, silent: !s.listenMelody && withAccomp });
  const stopAccomp = withAccomp ? audio.playAccompaniment(run.accompaniment, at, 60 / bpm) : null;
  run.demoStop = () => { stopScore(); if (stopAccomp) stopAccomp(); };
}

function stopDemo() {
  if (run.demoStop) run.demoStop();
  run.demoStop = null;
  run.demoIdx = -1;
  $('playDemo').lastChild.textContent = 'Escuchar';
  if (run.mode === 'learn') learnFocus();
  else { staff.render(run.score, run.renderOpts); staff.scrollTo(0, false); run.shown = -1; showTarget(run.playable[0]); }
}

// ---------- Entrada y salida ----------
function enter({ lesson, mode, from, eyebrow }) {
  const meta = buildMeta(lesson);
  const score = meta.parsed ? structuredClone(meta.parsed) : parseScore(meta.score);
  // octaveShift: la octava que eligió el curso para esta canción (la de sus pasos intermedios)
  const shift = lesson.octaveShift ?? (lesson.songId || lesson.passage ? (octaveShiftFor(meta, instrumentById(getState().instrument)) ?? 0) : 0);
  if (shift) score.notes.forEach(n => { if (!n.rest) { n.midi += shift; n.oct += shift / 12; } });
  const notes = score.notes.map(n => ({ ...n }));
  const playable = notes.map((n, i) => (n.rest ? -1 : i)).filter(i => i >= 0);
  run = {
    lesson, mode, from, title: lessonTitle(lesson), notes, playable, score, bars: score.bars, totalBeats: score.totalBeats,
    bpm: meta.bpm, time: meta.time, pickup: meta.pickup || 0, speed: lesson.speedOverride ?? (lesson.fixedSpeed ? 1 : getState().speed), missed: new Set(), skipped: new Set(),
    renderOpts: { key: meta.key, time: meta.time, mode, clef: lesson.clef || instrumentById(getState().instrument).clef || 'treble', sticking: lesson.fingers ? lesson.fingers.split(' ') : null },
    firstBeat: () => notes[playable[0]].start,
    pos: 0, hold: 0, wrong: 0, wrongCounted: false, errors: 0, skips: 0, needRelease: false, peak: 0, releaseWait: 0,
    playing: false, finished: false, shown: -1, last: performance.now(), demoStop: null, demoIdx: -1, praise: 0,
    wantMetro: getState().lessonMetro, tuning: [], slips: [], lit: null, centsSum: 0, centsN: 0, startedAt: performance.now(),
    oneTake: !!lesson.oneTake,
    accompaniment: lesson.accompaniment || (meta.others || []).map(o => ({ ...o, notes: decodeScore(o.enc).notes })),
  };
  // Sin otras voces: armonización automática de la melodía (la crea la app, sin arreglos de terceros)
  run.bandVoices = run.accompaniment.length > 0;
  if (!run.bandVoices && !meta.noAutoBase && score.bars && score.bars.length) {
    const chords = harmonize(notes, score.bars, { key: lesson.kind === 'notes' ? inferKey(notes) : meta.key, time: meta.time });
    run.accompaniment = [{ notes: accompanimentNotes(chords, { time: meta.time, transpose: instrumentById(getState().instrument).transpose }), transpose: instrumentById(getState().instrument).transpose }];
  }
  renderMix();
  $('lessonEyebrow').textContent = eyebrow || '';
  $('lessonTitle').textContent = run.title;
  $('modeChip').textContent = lesson.oneTake ? 'Una toma' : mode === 'tempo' ? 'A tempo' : 'Nota a nota';
  $('micGate').hidden = audio.micReady();
  $('micError').hidden = true;
  $('countdown').hidden = true;
  $('skipNote').hidden = mode === 'tempo';
  $('playDemo').hidden = !!lesson.oneTake;
  $('playRef').hidden = !!lesson.oneTake;
  $('tHint').hidden = !!lesson.noHints;
  document.querySelector('#tempoBar .seg').hidden = !!lesson.fixedSpeed;
  const showBoard = getState().showBoard && !lesson.noHints;
  $('lessonBoard').hidden = !showBoard;
  document.querySelector('#lesson .target-row').classList.toggle('no-board', !showBoard);
  setStatus(mode === 'tempo' ? 'Elige la velocidad y pulsa Empezar' : 'Toca la nota marcada');
  setMeter(null);
  $('heard').innerHTML = '&nbsp;';
  staff.render(score, run.renderOpts);
  updateProgress(0);
  showPulse(false);
  if (mode === 'learn') {
    learnFocus();
    if (run.wantMetro) startLearnMetronome();
  } else {
    staff.scrollTo(0, false);
    showTarget(playable[0]);
  }
  renderTempoControls();
  offBeat = audio.onBeat(() => {
    $('lessonMetro').classList.add('tick');
    setTimeout(() => $('lessonMetro').classList.remove('tick'), 100);
  });
  timer = setInterval(tick, TICK_MS);
}

function leave() {
  clearInterval(timer);
  if (offBeat) offBeat();
  if (run && run.demoStop) run.demoStop();
  if (run && !run.finished) audio.stopRecording();
  if (run && run.stopAccomp) run.stopAccomp();
  audio.stopMetronome();
  showPulse(false);
}

function startLearnMetronome() {
  audio.configureMetronome({ bpm: getState().bpm, meter: getState().meter, sound: metroSound() });
  audio.startMetronome();
  showPulse(true);
}

function setLearnBpm(bpm) {
  update({ bpm: Math.max(BPM_MIN, Math.min(BPM_MAX, bpm)) });
  audio.configureMetronome({ bpm: getState().bpm });
  renderTempoControls();
}

register('lesson', { enter, leave });

$('lessonExit').addEventListener('click', () => go(originTab(run.from)));
$('startMic').addEventListener('click', async () => {
  try {
    await audio.startMic();
    $('micGate').hidden = true;
    setStatus(run.mode === 'tempo' ? 'Elige la velocidad y pulsa Empezar' : 'Toca la nota marcada');
  } catch (err) {
    $('micError').textContent = audio.micErrorText(err);
    $('micError').hidden = false;
  }
});
$('playRef').addEventListener('click', () => {
  const idx = run.mode === 'learn' ? run.pos : (run.shown >= 0 ? run.shown : run.playable[0]);
  const n = run.notes[idx];
  if (n && !n.rest && !run.playing) audio.playTone(n.midi);
});
$('playDemo').addEventListener('click', toggleDemo);
$('skipNote').addEventListener('click', () => { if (run && run.mode === 'learn' && !run.finished) learnAdvance(true); });
$('tempoStart').addEventListener('click', () => { if (run.demoStop) stopDemo(); startTempo(); });
$('tempoRestart').addEventListener('click', () => { if (run.playing) playFrom(0); });
$('tempoBack').addEventListener('click', () => {
  if (!run.playing) return;
  const beat = (audio.audioTime() - run.t0) / run.spb;
  playFrom(beat <= run.firstBeat() ? 0 : barStartBefore(beat));
});
document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
  run.speed = Number(b.dataset.speed);
  update({ speed: run.speed });
  renderTempoControls();
}));
$('lmDown').addEventListener('click', () => setLearnBpm(getState().bpm - BPM_STEP));
$('lmUp').addEventListener('click', () => setLearnBpm(getState().bpm + BPM_STEP));
$('lmClick').addEventListener('change', e => {
  update({ metroClick: e.target.checked });
  if (audio.metronome().on) audio.configureMetronome({ sound: e.target.checked });
  if (e.target.checked) toast('Con auriculares el micrófono no oye el clic y te escucha mejor');
});
$('lessonMetro').addEventListener('click', () => {
  if (audio.metronome().on) { audio.stopMetronome(); showPulse(false); }
  else startLearnMetronome();
  run.wantMetro = audio.metronome().on;
  update({ lessonMetro: run.wantMetro });
  renderTempoControls();
});
// Qué suena al escuchar y al tocar: la melodía y el acompañamiento (otras voces de la banda o armonización automática)
function renderMix() {
  const s = getState();
  $('mixRow').hidden = !run.accompaniment.length || run.oneTake;
  $('mixAccompName').textContent = run.bandVoices ? 'Otras voces de la banda' : 'Acompañamiento';
  $('mixMelody').setAttribute('aria-pressed', String(s.listenMelody));
  $('mixAccomp').setAttribute('aria-pressed', String(s.accompOn));
}
$('mixMelody').addEventListener('click', () => {
  update({ listenMelody: !getState().listenMelody });
  if (!getState().listenMelody && !getState().accompOn) update({ accompOn: true });
  renderMix();
  toast(getState().listenMelody ? 'Al escuchar suena la melodía' : 'Al escuchar, solo el acompañamiento: tú pones la melodía');
});
$('mixAccomp').addEventListener('click', () => {
  update({ accompOn: !getState().accompOn });
  if (!getState().accompOn && !getState().listenMelody) update({ listenMelody: true });
  renderMix();
  if (getState().accompOn) toast('Con auriculares: si el micrófono oye el acompañamiento, se confunde con tu instrumento');
});
