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

const TICK_MS = 30;
const HOLD_MS = 250;
const WRONG_MS = 450;
const RELEASE_DIP = 0.55;
const RELEASE_FALLBACK_MS = 700;
const EARLY_S = 0.1;
const GRACE_S = 0.18;
const MIN_HIT_S = 0.22;
const NOTES_PER_BAR = 4;
const NOTES_BPM = 70;

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

function tolerance() { return TOLERANCE_CENTS[getState().tolerance] || TOLERANCE_CENTS.facil; }

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
  const near = Math.round(detected);
  $('heard').textContent = 'Oigo ' + noteLabel({ midi: near }, getState().nom) + (target ? ` (${cents >= 0 ? '+' : ''}${Math.round(cents)} cents)` : '');
  setMeter(target ? (Math.abs(cents) <= 100 ? cents : Math.sign(cents) * 50) : null);
  return cents;
}

function renderMetroButton() {
  const on = audio.metronome().on;
  $('lessonMetro').setAttribute('aria-pressed', on);
  $('lmBpm').textContent = run && run.mode === 'tempo' ? Math.round(run.bpm * run.speed) : getState().bpm;
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
    if (run.hold >= HOLD_MS) { setStatus('¡Bien!', 'var(--ok)'); learnAdvance(false); }
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
function startTempo() {
  if (!audio.micReady()) { $('micGate').hidden = false; setStatus('Activa el micrófono para empezar', 'var(--bad)'); return; }
  $('tempoBar').hidden = true;
  const spb = 60 / (run.bpm * run.speed);
  run.spb = spb;
  run.t0 = audio.countIn(run.time, run.bpm * run.speed);
  run.playing = true;
  setStatus('Sigue la línea y toca cada nota cuando llegue');
  if (run.wantMetro) {
    audio.configureMetronome({ bpm: run.bpm * run.speed, meter: run.time });
    audio.startMetronome(run.t0 + run.pickup * spb);
  }
  renderMetroButton();
}

function tempoTick(p, dt) {
  const t = audio.audioTime() - run.t0;
  if (t < 0) {
    $('countdown').hidden = false;
    $('countdown').textContent = Math.ceil(-t / run.spb);
    return;
  }
  $('countdown').hidden = true;
  const beat = t / run.spb;
  staff.scrollTo(beat, false);
  const endOf = n => (n.start + n.beats) * run.spb;
  // cerrar las notas cuyo tiempo ya pasó
  run.playable.forEach(i => {
    const n = run.notes[i];
    if (!n.judged && t > endOf(n) + GRACE_S) {
      n.judged = true;
      staff.setState(i, n.hit ? 'done' : 'miss');
      if (n.hit) run.hits++;
      updateProgress(run.playable.filter(j => run.notes[j].judged).length);
    }
  });
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
  if (run.finished || run.demoStop || !audio.micReady()) return;
  const p = audio.clickMasked() ? 'masked' : audio.readPitch();
  if (run.mode === 'learn') learnTick(p, dt);
  else if (run.playing) tempoTick(p, dt);
}

function scoreStars() {
  if (run.mode === 'tempo') {
    const acc = run.hits / run.playable.length;
    return { stars: acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : acc >= 0.5 ? 1 : 0, text: `${run.hits} de ${run.playable.length} notas a tiempo (${Math.round(acc * 100)} %)` };
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
  run.playable.forEach(i => {
    const n = run.notes[i];
    if (!n.judged) { n.judged = true; if (n.hit) run.hits++; }
  });
  const { stars, text } = scoreStars();
  finishLesson({ lesson: run.lesson, mode: run.mode, from: run.from, stars, text, title: run.title });
}

// ---------- Demo ----------
function toggleDemo() {
  if (run.demoStop) { stopDemo(); return; }
  if (run.playing) return;
  $('playDemo').lastChild.textContent = 'Parar';
  const bpm = run.mode === 'tempo' ? run.bpm * run.speed : run.bpm;
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
  else { staff.scrollTo(0); run.shown = -1; showTarget(run.playable[0]); }
}

// ---------- Entrada y salida ----------
function enter({ lesson, mode, from, eyebrow }) {
  const meta = buildMeta(lesson);
  const score = parseScore(meta.score);
  const notes = score.notes.map(n => ({ ...n }));
  run = {
    lesson, mode, from, title: lessonTitle(lesson), notes, totalBeats: score.totalBeats,
    playable: notes.map((n, i) => (n.rest ? -1 : i)).filter(i => i >= 0),
    bpm: meta.bpm, time: meta.time, pickup: meta.pickup || 0, speed: 0.8,
    pos: 0, hold: 0, wrong: 0, wrongCounted: false, errors: 0, skips: 0, needRelease: false, peak: 0, releaseWait: 0,
    hits: 0, playing: false, finished: false, shown: -1, last: performance.now(), demoStop: null, demoIdx: -1,
    wantMetro: getState().lessonMetro,
  };
  $('lessonEyebrow').textContent = eyebrow || '';
  $('lessonTitle').textContent = run.title;
  $('modeChip').textContent = mode === 'tempo' ? 'A tempo' : 'Nota a nota';
  $('micGate').hidden = audio.micReady();
  $('micError').hidden = true;
  $('countdown').hidden = true;
  $('skipNote').hidden = mode === 'tempo';
  $('tempoBar').hidden = mode !== 'tempo';
  document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.speed) === run.speed));
  const showBoard = getState().showBoard;
  $('lessonBoard').hidden = !showBoard;
  document.querySelector('#lesson .target-row').classList.toggle('no-board', !showBoard);
  setStatus(mode === 'tempo' ? 'Elige la velocidad y pulsa Empezar' : 'Toca la nota marcada');
  setMeter(null);
  $('heard').innerHTML = '&nbsp;';
  staff.render(score, { key: meta.key, time: meta.time, mode });
  updateProgress(0);
  if (mode === 'learn') {
    learnFocus();
    if (run.wantMetro) { audio.configureMetronome({ bpm: getState().bpm, meter: getState().meter }); audio.startMetronome(); }
  } else {
    staff.scrollTo(0, false);
    showTarget(run.playable[0]);
  }
  renderMetroButton();
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
document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
  run.speed = Number(b.dataset.speed);
  document.querySelectorAll('[data-speed]').forEach(x => x.setAttribute('aria-pressed', x === b));
  renderMetroButton();
}));
// Primer tiempo fuerte que aún no ha sonado, para que el metrónomo entre a compás
function nextDownbeat() {
  const barLen = run.spb * run.time;
  const firstBar = run.t0 + run.pickup * run.spb;
  const elapsed = audio.audioTime() - firstBar;
  return firstBar + Math.max(0, Math.ceil(elapsed / barLen)) * barLen;
}

$('lessonMetro').addEventListener('click', () => {
  if (run.mode === 'tempo' && !run.playing) {
    run.wantMetro = !run.wantMetro;
    update({ lessonMetro: run.wantMetro });
    $('lessonMetro').setAttribute('aria-pressed', run.wantMetro);
    toast(run.wantMetro ? 'El metrónomo sonará durante la canción' : 'Sin metrónomo');
    return;
  }
  if (audio.metronome().on) audio.stopMetronome();
  else if (run.mode === 'learn') {
    audio.configureMetronome({ bpm: getState().bpm, meter: getState().meter });
    audio.startMetronome();
  } else {
    audio.configureMetronome({ bpm: run.bpm * run.speed, meter: run.time });
    audio.startMetronome(nextDownbeat());
  }
  run.wantMetro = audio.metronome().on;
  update({ lessonMetro: run.wantMetro });
  renderMetroButton();
});
