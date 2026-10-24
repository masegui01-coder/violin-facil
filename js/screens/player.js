// Motor de lección: modo «nota a nota» (espera a que suene bien) y modo «a tempo» (la partitura avanza sola).
import { $, toast } from '../ui.js';
import { register, go } from '../router.js';
import { parseScore, noteLabel, fingerText, freqToMidi } from '../music.js';
import { lessonSong, lessonTitle } from '../course.js';
import { createStaff } from '../staff.js';
import { renderFingerboard } from '../fingerboard.js';
import { getState, update, TOLERANCE_CENTS } from '../store.js';
import * as audio from '../audio.js';
import { finishLesson } from './result.js';
import { showPulse, drawPulse } from './pulse.js';

const TICK_MS = 30;
const HOLD_MS = 250;
const WRONG_MS = 450;
const RELEASE_DIP = 0.55;
const RELEASE_FALLBACK_MS = 700;
const EARLY_S = 0.1;
const GRACE_S = 0.18;
const MIN_HIT_S = 0.22;
const NOTES_PER_BAR = 4;
const NOTES_BPM = 60;
const BPM_STEP = 2;
const BPM_MIN = 30;
const BPM_MAX = 220;
const PRAISE = ['¡Bien!', '¡Muy bien!', '¡Eso es!', '¡Qué buen sonido!', '¡Sigue así!', '¡Perfecto!'];

const staff = createStaff($('lessonStaff'));
let run = null;
let timer = 0;
let offBeat = null;

function buildMeta(lesson) {
  if (lesson.kind === 'notes') {
    const list = lesson.notes.split(' ');
    const bars = [];
    for (let i = 0; i < list.length; i += NOTES_PER_BAR) bars.push(list.slice(i, i + NOTES_PER_BAR).map(n => n + 'q').join(' '));
    return { title: lesson.title, key: 'C', time: 4, bpm: NOTES_BPM, score: '| ' + bars.join(' | ') + ' |' };
  }
  return lessonSong(lesson);
}

const tolerance = () => TOLERANCE_CENTS[getState().tolerance] || TOLERANCE_CENTS.facil;
const metroSound = () => getState().metroMode !== 'visual';
const metroVisual = () => getState().metroMode !== 'sound';
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
  $('tHint').textContent = fingerText(note.midi, nom);
  if (getState().showBoard) renderFingerboard($('lessonBoard'), [note.midi], nom);
}

function updateProgress(done) {
  $('lessonCount').textContent = done + '/' + run.playable.length;
  $('lessonProg').style.width = (done / run.playable.length * 100) + '%';
}

function showHeard(p, target) {
  if (!p || p.freq === null) { $('heard').innerHTML = '&nbsp;'; setMeter(null); return null; }
  const detected = freqToMidi(p.freq);
  const cents = target ? (detected - target.midi) * 100 : 0;
  $('heard').textContent = 'Oigo ' + noteLabel({ midi: Math.round(detected) }, getState().nom) + (target ? ` (${cents >= 0 ? '+' : ''}${Math.round(cents)} cents)` : '');
  setMeter(target ? (Math.abs(cents) <= 100 ? cents : Math.sign(cents) * 50) : null);
  return cents;
}

function renderTempoControls() {
  const learn = run.mode === 'learn';
  $('lmBpm').textContent = learn ? getState().bpm : tempoBpm();
  $('lessonMetro').setAttribute('aria-pressed', learn ? audio.metronome().on : run.wantMetro);
  $('lmDown').hidden = !learn;
  $('lmUp').hidden = !learn;
  $('tempoBpm').textContent = `♩ = ${tempoBpm()}`;
  document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.speed) === run.speed));
  $('playControls').hidden = !run.playing;
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
  if (skipped) run.skips++;
  else setStatus(PRAISE[run.praise++ % PRAISE.length], 'var(--ok)');
  run.pos++;
  run.hold = 0; run.wrong = 0; run.wrongCounted = false; run.peak = 0; run.releaseWait = 0;
  const next = run.notes[run.pos];
  run.needRelease = !skipped && next && !next.rest && next.midi === prev.midi;
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
    else { setStatus('Cambia de arco y repite la nota'); return; }
  }
  if (Math.abs(cents) <= tolerance()) {
    run.wrong = 0;
    run.hold += dt;
    $('tName').className = 'name ok';
    if (run.hold >= HOLD_MS) learnAdvance(false);
    return;
  }
  run.hold = 0;
  run.wrong += dt;
  $('tName').className = 'name';
  if (run.wrong >= WRONG_MS) {
    $('tName').className = 'name bad';
    setStatus(Math.abs(cents) > 100 ? 'Esa es otra nota' : cents > 0 ? 'Un poco alto: retrocede el dedo' : 'Un poco bajo: adelanta el dedo', 'var(--bad)');
    if (!run.wrongCounted) { run.errors++; run.wrongCounted = true; }
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
  const countEnd = audio.countIn(run.time, tempoBpm(), metroSound());
  run.t0 = countEnd - beatStart * run.spb;
  run.countEnd = countEnd;
  run.beatStart = beatStart;
  run.playing = true;
  run.shown = -1;
  showTarget(run.playable.find(i => !run.notes[i].judged) ?? run.playable[0]);
  updateProgress(run.playable.filter(i => run.notes[i].judged).length);
  if (run.wantMetro) {
    const firstBar = run.t0 + run.pickup * run.spb;
    const barLen = run.spb * run.time;
    audio.configureMetronome({ bpm: tempoBpm(), meter: run.time, sound: metroSound() });
    audio.startMetronome(firstBar + Math.max(0, Math.ceil((countEnd - firstBar) / barLen - 1e-6)) * barLen);
  }
  showPulse(metroVisual());
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

function tempoTick(p, dt) {
  const t = audio.audioTime() - run.t0;
  const beat = t / run.spb;
  if (metroVisual()) drawPulse(beat - run.pickup, run.time);
  const countLeft = run.countEnd - audio.audioTime();
  if (countLeft > 0) {
    $('countdown').hidden = false;
    $('countdown').textContent = Math.ceil(countLeft / run.spb);
    staff.scrollTo(run.beatStart, false);
    return;
  }
  $('countdown').hidden = true;
  staff.scrollTo(beat, false);
  judgePassed(t);
  // notas que ya han empezado y siguen abiertas (la anterior conserva un margen de gracia)
  const started = run.playable.filter(i => !run.notes[i].judged && t >= run.notes[i].start * run.spb - EARLY_S);
  const shownIdx = started.length ? started[started.length - 1] : run.playable.find(i => !run.notes[i].judged);
  if (shownIdx !== undefined) showTarget(shownIdx);
  if (p !== 'masked') {
    showHeard(p, shownIdx !== undefined ? run.notes[shownIdx] : null);
    run.heardMidi = p && p.freq ? freqToMidi(p.freq) : null;
  }
  if (run.heardMidi !== null && run.heardMidi !== undefined) {
    started.forEach(i => {
      const n = run.notes[i];
      if (n.hit || Math.abs(run.heardMidi - n.midi) * 100 > tolerance()) return;
      n.inTune = (n.inTune || 0) + dt / 1000;
      if (n.inTune >= Math.min(MIN_HIT_S, n.beats * run.spb * 0.5)) {
        n.hit = true;
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
  if (run.mode === 'learn' && metroVisual() && audio.metronome().on) drawPulse(audio.metronomeBeat(), getState().meter);
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

function finish() {
  if (run.finished) return;
  run.finished = true;
  audio.stopMetronome();
  const { stars, text } = scoreStars();
  finishLesson({ lesson: run.lesson, mode: run.mode, from: run.from, stars, text, title: run.title });
}

// ---------- Demo ----------
function toggleDemo() {
  if (run.demoStop) { stopDemo(); return; }
  if (run.playing) return;
  $('playDemo').lastChild.textContent = 'Parar';
  const bpm = run.mode === 'tempo' ? tempoBpm() : run.bpm;
  run.demoStop = audio.playScore(run.notes, bpm, (beat, done) => {
    if (done) { stopDemo(); return; }
    const idx = run.notes.findIndex(n => beat >= n.start && beat < n.start + n.beats);
    if (idx >= 0 && idx !== run.demoIdx) { run.demoIdx = idx; staff.focus(idx); showTarget(idx); }
  });
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
  const score = parseScore(meta.score);
  const notes = score.notes.map(n => ({ ...n }));
  const playable = notes.map((n, i) => (n.rest ? -1 : i)).filter(i => i >= 0);
  run = {
    lesson, mode, from, title: lessonTitle(lesson), notes, playable, score, bars: score.bars, totalBeats: score.totalBeats,
    bpm: meta.bpm, time: meta.time, pickup: meta.pickup || 0, speed: getState().speed,
    renderOpts: { key: meta.key, time: meta.time, mode },
    firstBeat: () => notes[playable[0]].start,
    pos: 0, hold: 0, wrong: 0, wrongCounted: false, errors: 0, skips: 0, needRelease: false, peak: 0, releaseWait: 0,
    playing: false, finished: false, shown: -1, last: performance.now(), demoStop: null, demoIdx: -1, praise: 0,
    wantMetro: getState().lessonMetro,
  };
  $('lessonEyebrow').textContent = eyebrow || '';
  $('lessonTitle').textContent = run.title;
  $('modeChip').textContent = mode === 'tempo' ? 'A tempo' : 'Nota a nota';
  $('micGate').hidden = audio.micReady();
  $('micError').hidden = true;
  $('countdown').hidden = true;
  $('skipNote').hidden = mode === 'tempo';
  const showBoard = getState().showBoard;
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
  audio.stopMetronome();
  showPulse(false);
}

function startLearnMetronome() {
  audio.configureMetronome({ bpm: getState().bpm, meter: getState().meter, sound: metroSound() });
  audio.startMetronome();
  showPulse(metroVisual());
}

function setLearnBpm(bpm) {
  update({ bpm: Math.max(BPM_MIN, Math.min(BPM_MAX, bpm)) });
  audio.configureMetronome({ bpm: getState().bpm });
  renderTempoControls();
}

register('lesson', { enter, leave });

$('lessonExit').addEventListener('click', () => go(run.from === 'songs' ? 'songs' : 'learn'));
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
$('lessonMetro').addEventListener('click', () => {
  if (run.mode === 'tempo') {
    run.wantMetro = !run.wantMetro;
    update({ lessonMetro: run.wantMetro });
    if (run.playing && !run.wantMetro) audio.stopMetronome();
    toast(run.wantMetro ? 'El pulso sonará o se verá en el próximo inicio' : 'Sin pulso durante la canción');
    renderTempoControls();
    return;
  }
  if (audio.metronome().on) { audio.stopMetronome(); showPulse(false); }
  else startLearnMetronome();
  run.wantMetro = audio.metronome().on;
  update({ lessonMetro: run.wantMetro });
  renderTempoControls();
});
