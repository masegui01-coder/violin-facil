// Ensayo rítmico (percusión): la partitura avanza a tempo y la app compara cada golpe con su momento exacto.
import { $, toast } from '../ui.js';
import { register, go } from '../router.js';
import { parseScore } from '../music.js';
import { lessonSong, lessonTitle } from '../course.js';
import { createStaff } from '../staff.js';
import { scoreRhythm, accentContrast, rhythmTip, PERFECT_MS, GOOD_MS, WINDOW_MS } from '../onsets.js';
import { getState, update } from '../store.js';
import * as audio from '../audio.js';
import { finishLesson } from './result.js';

const TICK_MS = 30;
const SNARE = { letter: 'C', acc: 0, oct: 5, midi: 72 };
const ACCENT_GOAL = 1.3;
const LABEL = { perfect: '¡Perfecto!', good: 'Bien', early: 'Pronto', late: 'Tarde' };

const staff = createStaff($('rhythmStaff'));
let run = null;
let timer = 0;

// Cualquier canción se toca como ritmo: un golpe por nota, en la línea de la caja
function buildScore(lesson) {
  const song = lesson.song || lessonSong(lesson);
  const score = song.parsed ? structuredClone(song.parsed) : parseScore(song.score);
  score.notes = score.notes.map(n => (n.rest ? n : { ...n, ...SNARE }));
  return { song, score };
}

const tempoBpm = () => Math.round(run.bpm * run.speed);
const latency = () => getState().percLatency || 0;

function setStatus(text, color) {
  $('rhLast').textContent = text || ' ';
  $('rhLast').style.color = color || '';
}

function showOffset(ms) {
  const dot = $('rhDot');
  if (ms === null) { dot.style.left = '50%'; dot.style.background = 'var(--muted)'; return; }
  dot.style.left = (50 + Math.max(-50, Math.min(50, ms / WINDOW_MS * 50))) + '%';
  dot.style.background = Math.abs(ms) <= PERFECT_MS ? 'var(--ok)' : Math.abs(ms) <= GOOD_MS ? 'var(--warn)' : 'var(--bad)';
}

function renderControls() {
  $('rhBpm').textContent = `♩ = ${tempoBpm()}`;
  document.querySelectorAll('[data-rspeed]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.rspeed) === run.speed));
  $('rhTempoBar').hidden = run.playing;
  $('rhPlaying').hidden = !run.playing;
  $('rhClick').checked = getState().percClick;
}

// ---------- Golpes en directo ----------
function onHits(hits) {
  if (!run || !run.playing) return;
  hits.forEach(h => {
    if (h.time < run.countEnd - 0.1) return; // la cuenta previa no cuenta
    run.onsets.push(h);
    const t = h.time - latency();
    const near = run.expected.reduce((best, e, i) => (Math.abs(e - t) < Math.abs(run.expected[best] - t) ? i : best), 0);
    const ms = (t - run.expected[near]) * 1000;
    if (Math.abs(ms) > WINDOW_MS) { setStatus('Golpe de más', 'var(--bad)'); showOffset(null); return; }
    const kind = Math.abs(ms) <= PERFECT_MS ? 'perfect' : Math.abs(ms) <= GOOD_MS ? 'good' : ms < 0 ? 'early' : 'late';
    showOffset(ms);
    setStatus(`${LABEL[kind]} · ${ms > 0 ? '+' : ''}${Math.round(ms)} ms`, kind === 'perfect' ? 'var(--ok)' : kind === 'good' ? 'var(--warn)' : 'var(--bad)');
    staff.setState(run.playable[near], kind === 'perfect' || kind === 'good' ? 'done' : 'miss');
  });
}

// ---------- Ciclo ----------
function tick() {
  if (!run.playing) return;
  const now = audio.audioTime();
  const beat = (now - run.t0) / run.spb;
  const left = run.countEnd - now;
  $('rhCountdown').hidden = left <= 0;
  if (left > 0) $('rhCountdown').textContent = Math.ceil(left / run.spb);
  staff.scrollTo(Math.max(0, beat), false);
  const k = Math.floor(beat - run.pickup);
  const inBar = ((k % run.time) + run.time) % run.time;
  $('rhCounter').textContent = beat < 0 && left <= 0 ? '' : String(inBar + 1);
  $('rhBeat').classList.toggle('on', beat - Math.floor(beat) < 0.15);
  $('rhBeat').classList.toggle('down', inBar === 0 && beat - Math.floor(beat) < 0.15);
  if (beat > run.totalBeats + 0.6) finish();
}

function start() {
  if (!audio.micReady()) { $('rhGate').hidden = false; setStatus('Activa el micrófono para empezar', 'var(--bad)'); return; }
  run.spb = 60 / tempoBpm();
  run.onsets = [];
  run.countEnd = audio.countIn(run.time, tempoBpm(), true);
  run.t0 = run.countEnd;
  run.expected = run.playable.map(i => run.t0 + run.notes[i].start * run.spb);
  run.notes.forEach((n, i) => { if (!n.rest) staff.setState(i, 'future'); });
  audio.startOnsetCapture(onHits);
  if (getState().percClick) {
    audio.configureMetronome({ bpm: tempoBpm(), meter: run.time, sound: true });
    audio.startMetronome(run.t0 + run.pickup * run.spb);
  }
  run.playing = true;
  run.startedAt = performance.now();
  setStatus('Sigue la línea y golpea en cada nota');
  renderControls();
}

function stop() {
  audio.stopOnsetCapture();
  audio.stopMetronome();
  if (run) run.playing = false;
  $('rhCountdown').hidden = true;
}

function finish() {
  stop();
  const r = scoreRhythm(run.expected, run.onsets, latency());
  const count = s => r.results.filter(x => x.status === s).length;
  const accents = run.playable.map(i => run.notes[i].accent);
  const contrast = accents.some(Boolean) ? accentContrast(r.results, accents) : null;
  const stars = r.accuracy >= 0.9 ? 3 : r.accuracy >= 0.75 ? 2 : r.accuracy >= 0.5 ? 1 : 0;
  const accentText = contrast === null ? '' : contrast >= ACCENT_GOAL ? ' · Acentos claros' : ' · Marca más los acentos';
  const text = `${count('perfect')} perfectos · ${count('good')} bien · ${count('early') + count('late')} fuera de tiempo · ${count('miss')} sin tocar${accentText}. ${rhythmTip(r)}`;
  let k = 0;
  const states = run.notes.map(n => (n.rest ? 'future' : ['perfect', 'good'].includes(r.results[k++].status) ? 'done' : 'miss'));
  finishLesson({
    lesson: run.lesson, mode: 'tempo', from: run.from, stars, text, title: run.title, accuracy: r.accuracy, speed: run.speed,
    minutes: (performance.now() - run.startedAt) / 60000,
    review: { score: run.score, key: 'C', time: run.time, states, clef: 'perc', sticking: run.sticking },
  });
}

// ---------- Escuchar el ritmo ----------
function demo() {
  if (run.playing) return;
  const spb = 60 / tempoBpm();
  const t0 = audio.audioTime() + 0.2;
  run.playable.forEach(i => audio.drumHit(t0 + run.notes[i].start * spb, run.notes[i].accent));
  setStatus('Escucha el ritmo…');
}

// ---------- Entrada y salida ----------
function enter({ lesson, from, eyebrow }) {
  const { song, score } = buildScore(lesson);
  const notes = score.notes;
  run = {
    lesson, from, title: lessonTitle(lesson) || song.title, score, notes, totalBeats: score.totalBeats,
    playable: notes.map((n, i) => (n.rest ? -1 : i)).filter(i => i >= 0),
    sticking: lesson.sticking || song.sticking || null,
    bpm: song.bpm, time: song.time, pickup: song.pickup || 0, speed: lesson.fixedSpeed ? 1 : getState().speed,
    playing: false, onsets: [], expected: [],
  };
  $('rhEyebrow').textContent = eyebrow || '';
  $('rhTitle').textContent = run.title;
  $('rhGate').hidden = audio.micReady();
  $('rhMicError').hidden = true;
  $('rhCountdown').hidden = true;
  $('rhCounter').textContent = '';
  document.querySelector('#rhTempoBar .seg').hidden = !!lesson.fixedSpeed;
  $('rhDemo').hidden = !!lesson.oneTake;
  staff.render(score, { key: 'C', time: run.time, mode: 'tempo', clef: 'perc', sticking: run.sticking });
  staff.scrollTo(0, false);
  showOffset(null);
  setStatus(getState().percLatency ? 'Elige la velocidad y pulsa Empezar' : 'Consejo: calibra el micrófono en Estudio para medir mejor', 'var(--muted)');
  renderControls();
  timer = setInterval(tick, TICK_MS);
}

function leave() {
  clearInterval(timer);
  stop();
}

register('rhythm', { enter, leave });

$('rhExit').addEventListener('click', () => go(run.from === 'songs' ? 'songs' : run.from === 'practice' ? 'practice' : run.from === 'band' ? 'band' : 'learn'));
$('rhStartMic').addEventListener('click', async () => {
  try { await audio.startMic(); $('rhGate').hidden = true; setStatus('Elige la velocidad y pulsa Empezar'); }
  catch (err) { $('rhMicError').textContent = audio.micErrorText(err); $('rhMicError').hidden = false; }
});
$('rhStart').addEventListener('click', start);
$('rhDemo').addEventListener('click', demo);
$('rhRestart').addEventListener('click', () => { stop(); start(); });
$('rhClick').addEventListener('change', e => {
  update({ percClick: e.target.checked });
  if (e.target.checked) toast('Con el clic sonando, usa auriculares para que el micrófono no lo confunda con tus golpes');
});
document.querySelectorAll('[data-rspeed]').forEach(b => b.addEventListener('click', () => {
  run.speed = Number(b.dataset.rspeed);
  update({ speed: run.speed });
  renderControls();
}));
