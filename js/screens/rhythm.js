// Ensayo rítmico (percusión): la partitura avanza a tempo y la app compara cada golpe con su momento exacto.
import { $, toast } from '../ui.js';
import { register, go, originTab } from '../router.js';
import { parseScore } from '../music.js';
import { lessonSong, lessonTitle } from '../course.js';
import { createStaff } from '../staff.js';
import { scoreRhythm, accentContrast, rhythmTip, PERFECT_MS, GOOD_MS, WINDOW_MS } from '../onsets.js';
import { getState, update } from '../store.js';
import * as audio from '../audio.js';
import { finishLesson } from './result.js';
import { decodeScore } from '../passage.js';
import { createPulse } from './pulse.js';
import { dynamicsChecks } from '../lm/dynamics.js';

const pulse = createPulse('rhPulse', '#rhythm .staff-card');

const TICK_MS = 30;
const SNARE = { letter: 'C', acc: 0, oct: 5, midi: 72 };
const ACCENT_GOAL = 1.3;
const TONE_GOAL = 0.6;
const LABEL = { perfect: '¡Perfecto!', good: 'Bien', early: 'Pronto', late: 'Tarde' };

const staff = createStaff($('rhythmStaff'));
let run = null;
let timer = 0;

// Cualquier canción se toca como ritmo: un golpe por nota, en la línea de la caja.
// En el cajón las lecciones distinguen grave (Fa4, abajo) y agudo (Do5, arriba).
export const CAJON_BASS_MIDI = 65;
const TONE_NAME = { bass: 'Grave', slap: 'Agudo' };
function buildScore(lesson) {
  const song = lesson.song || lessonSong(lesson);
  const score = song.parsed ? structuredClone(song.parsed) : parseScore(song.score);
  if (!lesson.tones) score.notes = score.notes.map(n => (n.rest ? n : { ...n, ...SNARE }));
  return { song, score };
}
const expectedTone = n => (n.midi === CAJON_BASS_MIDI ? 'bass' : 'slap');

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
  $('rhClick').checked = getState().metroClick;
}

// ---------- Golpes en directo ----------
// Toques en la pantalla (sin micrófono): el toque va con lo que se oye, que sale por el altavoz con su retraso
const hitLatency = () => (run.touch ? audio.outputLatency() : latency());
function onHits(hits) {
  if (!run || !run.playing) return;
  hits.forEach(h => {
    if (h.time < run.countEnd - 0.1) { setStatus('Te oigo: espera a que acabe la cuenta', 'var(--muted)'); return; } // la cuenta previa no cuenta
    run.onsets.push(h);
    const t = h.time - hitLatency();
    const near = run.expected.reduce((best, e, i) => (Math.abs(e - t) < Math.abs(run.expected[best] - t) ? i : best), 0);
    const ms = (t - run.expected[near]) * 1000;
    if (Math.abs(ms) > WINDOW_MS) { setStatus('Golpe de más', 'var(--bad)'); showOffset(null); return; }
    const kind = Math.abs(ms) <= PERFECT_MS ? 'perfect' : Math.abs(ms) <= GOOD_MS ? 'good' : ms < 0 ? 'early' : 'late';
    showOffset(ms);
    if (run.lesson.tones && h.tone) {
      const want = expectedTone(run.notes[run.playable[near]]);
      const toneText = h.tone === want ? TONE_NAME[h.tone] : `${TONE_NAME[h.tone]}: tocaba ${TONE_NAME[want].toLowerCase()}`;
      setStatus(`${LABEL[kind]} · ${toneText}`, h.tone !== want ? 'var(--bad)' : kind === 'perfect' ? 'var(--ok)' : kind === 'good' ? 'var(--warn)' : 'var(--bad)');
      return;
    }
    setStatus(`${LABEL[kind]} · ${ms > 0 ? '+' : ''}${Math.round(ms)} ms`, kind === 'perfect' ? 'var(--ok)' : kind === 'good' ? 'var(--warn)' : 'var(--bad)');
    staff.setState(run.playable[near], kind === 'perfect' || kind === 'good' ? 'done' : 'miss');
  });
}

// Sílabas de apoyo (Fácil del curso de Lenguaje): la de la figura que toca ahora
const SYLLABLE = { q: 'ta', e: 'ti', h: 'taa-a', w: 'taa-a-a-a' };
function syllableAt(beat) {
  const n = run.notes.find(x => beat >= x.start && beat < x.start + x.beats);
  if (!n) return '';
  return n.rest ? 'sh' : SYLLABLE[String(n.dur || '').replace('.', '')] || 'ta';
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
  $('rhCounter').textContent = beat < 0 && left <= 0 ? '' : `${inBar + 1}${run.syllables ? ` · ${syllableAt(beat)}` : ''}`;
  $('rhBeat').classList.toggle('on', beat - Math.floor(beat) < 0.15);
  $('rhBeat').classList.toggle('down', inBar === 0 && beat - Math.floor(beat) < 0.15);
  pulse.draw(beat - run.pickup, run.time);
  if (beat > run.totalBeats + 0.6) finish();
}

function start() {
  run.touch = $('rhTouch').checked;
  $('rhTap').hidden = !run.touch;
  if (!run.touch && !audio.micReady()) { $('rhGate').hidden = false; setStatus('Activa el micrófono para empezar', 'var(--bad)'); return; }
  run.spb = 60 / tempoBpm();
  run.onsets = [];
  run.countEnd = audio.countIn(run.lm && run.lm.oneClick ? 1 : run.time, tempoBpm(), true);
  run.t0 = run.countEnd;
  run.expected = run.playable.map(i => run.t0 + run.notes[i].start * run.spb);
  run.notes.forEach((n, i) => { if (!n.rest) staff.setState(i, 'future'); });
  if (!run.touch) audio.startOnsetCapture(onHits);
  if (run.stopAccomp) run.stopAccomp();
  run.stopAccomp = $('rhVbToggle').checked && run.accompaniment.length ? audio.playAccompaniment(run.accompaniment, run.t0, run.spb) : null;
  // Lecturas del curso de Lenguaje: el metrónomo hace lo que pide la variante (todos los pulsos, solo el 1.º o nada)
  const metro = run.lm ? run.lm.metro : getState().metroClick ? 'all' : 'none';
  if (metro !== 'none') {
    audio.configureMetronome({ bpm: tempoBpm(), meter: run.time, sound: true, firstOnly: metro === 'first' });
    audio.startMetronome(run.t0 + run.pickup * run.spb);
  }
  run.playing = true;
  pulse.show(true);
  run.startedAt = performance.now();
  if (run.touch) $('rhTap').focus();
  setStatus('Sigue la línea y golpea en cada nota');
  renderControls();
}

function stop() {
  audio.stopOnsetCapture();
  if (run && run.stopAccomp) { run.stopAccomp(); run.stopAccomp = null; }
  audio.stopMetronome();
  if (run) run.playing = false;
  pulse.show(false);
  $('rhCountdown').hidden = true;
}

function finish() {
  stop();
  const r = scoreRhythm(run.expected, run.onsets, hitLatency());
  const count = s => r.results.filter(x => x.status === s).length;
  const accents = run.playable.map(i => run.notes[i].accent);
  const contrast = accents.some(Boolean) ? accentContrast(r.results, accents) : null;
  // Cajón: además del tiempo cuenta el sonido (grave o agudo). Con menos del 60 % bien, como mucho 2 estrellas.
  const tones = run.lesson.tones ? r.results.map((x, i) => (x.tone ? x.tone === expectedTone(run.notes[run.playable[i]]) : null)).filter(x => x !== null) : [];
  const toneAcc = tones.length ? tones.filter(Boolean).length / tones.length : null;
  let stars = r.accuracy >= 0.9 ? 3 : r.accuracy >= 0.75 ? 2 : r.accuracy >= 0.5 ? 1 : 0;
  if (toneAcc !== null && toneAcc < TONE_GOAL) stars = Math.min(stars, 2);
  const accentText = contrast === null ? '' : contrast >= ACCENT_GOAL ? ' · Acentos claros' : ' · Marca más los acentos';
  const toneText = toneAcc === null ? '' : ` · Graves y agudos: ${Math.round(toneAcc * 100)} % bien${toneAcc < TONE_GOAL ? ' (grave con la palma en el centro, agudo con los dedos en el borde)' : ''}`;
  // Matices (lecturas del curso de Lenguaje con p, f, reguladores): con la fuerza de cada golpe del micrófono
  const dyn = run.lesson.dynamics && !run.touch ? dynamicsChecks(run.lesson.dynamics, run.playable.map(i => run.notes[i]), strengthsOf(run)) : null;
  if (dyn && dyn.total) {
    run.lesson.dynamicsResult = dyn;
    if (dyn.ok * 2 < dyn.total) stars = Math.min(stars, 2);
  }
  const dynText = dyn && dyn.total ? ` · Matices: ${dyn.ok} de ${dyn.total} bien` : run.lesson.dynamics && run.touch ? ' · Los matices se miden con el micrófono' : '';
  const text = `${count('perfect')} perfectos · ${count('good')} bien · ${count('early') + count('late')} fuera de tiempo · ${count('miss')} sin tocar${accentText}${toneText}${dynText}. ${rhythmTip(r)}`;
  let k = 0;
  const states = run.notes.map(n => (n.rest ? 'future' : ['perfect', 'good'].includes(r.results[k++].status) ? 'done' : 'miss'));
  finishLesson({
    lesson: run.lesson, mode: 'tempo', from: run.from, stars, text, title: run.title, accuracy: r.accuracy, speed: run.speed,
    minutes: (performance.now() - run.startedAt) / 60000,
    missed: r.results.map(x => !['perfect', 'good'].includes(x.status)),
    review: { score: run.score, key: 'C', time: run.time, states, clef: 'perc', sticking: run.sticking },
  });
}

// Fuerza del golpe más cercano a cada nota (null si no hubo golpe en la ventana)
function strengthsOf(r) {
  const lat = latency();
  return r.expected.map(at => {
    const near = r.onsets.filter(h => Math.abs(h.time - lat - at) * 1000 <= WINDOW_MS);
    return near.length ? Math.max(...near.map(h => h.strength || 0)) : null;
  });
}

// ---------- Escuchar el ritmo ----------
function demo() {
  if (run.playing) return;
  const spb = 60 / tempoBpm();
  const t0 = audio.audioTime() + 0.2;
  run.playable.forEach(i => {
    const n = run.notes[i];
    if (run.lesson.tones) audio.cajonHit(t0 + n.start * spb, expectedTone(n), n.accent);
    else audio.drumHit(t0 + n.start * spb, n.accent);
  });
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
    bpm: song.bpm, time: song.time, pickup: song.pickup || 0, speed: lesson.speedOverride ?? (lesson.fixedSpeed ? 1 : getState().speed),
    playing: false, onsets: [], expected: [],
    accompaniment: lesson.accompaniment || (song.others || []).map(o => ({ ...o, notes: decodeScore(o.enc).notes })),
    lm: lesson.lmMode || null, syllables: !!(lesson.lmMode && lesson.lmMode.syllables),
  };
  // Desde el curso de Lenguaje no es percusión: lectura rítmica con palmas, sin manos D/I, y la consigna de la variante
  $('rhChip').textContent = run.lm ? 'Lectura rítmica' : 'Percusión';
  $('rhHint').textContent = run.lm ? run.lm.hint : 'Golpea en la caja, en un pad o en la mesa. Las letras D e I indican la mano derecha o izquierda.';
  // en el curso el metrónomo lo decide la variante: el interruptor no haría nada, así que no se enseña
  $('rhClick').closest('.switch-row').hidden = !!run.lm;
  $('rhVbRow').hidden = !run.accompaniment.length;
  $('rhVbRow').querySelector('span').textContent = lesson.backing ? 'Guitarra de fondo (mejor con auriculares)' : 'Banda virtual: suenan las otras voces (con auriculares)';
  $('rhEyebrow').textContent = eyebrow || '';
  $('rhTitle').textContent = run.title;
  $('rhTouch').checked = !!getState().rhythmTouch;
  $('rhGate').hidden = audio.micReady() || $('rhTouch').checked;
  $('rhMicError').hidden = true;
  $('rhCountdown').hidden = true;
  $('rhCounter').textContent = '';
  document.querySelector('#rhTempoBar .seg').hidden = !!lesson.fixedSpeed;
  $('rhDemo').hidden = !!lesson.oneTake;
  // las lecturas del curso unen las corcheas por pulsos, como se enseña en la U2
  staff.render(score, { key: 'C', time: run.time, mode: 'tempo', clef: 'perc', sticking: run.sticking, beams: run.lm ? 1 : 0 });
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

$('rhExit').addEventListener('click', () => go(originTab(run.from)));
$('rhStartMic').addEventListener('click', async () => {
  try { await audio.startMic(); $('rhGate').hidden = true; setStatus('Elige la velocidad y pulsa Empezar'); }
  catch (err) { $('rhMicError').textContent = audio.micErrorText(err); $('rhMicError').hidden = false; }
});
$('rhStart').addEventListener('click', start);
// Toque en pantalla: al bajar el dedo (sin esperar al clic) o con la barra espaciadora / Intro
const tap = e => { e.preventDefault(); onHits([{ time: audio.audioTime(), strength: null, tap: true }]); };
$('rhTap').addEventListener('pointerdown', tap);
$('rhTap').addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) tap(e); });
$('rhTap').addEventListener('click', e => e.preventDefault());
$('rhTouch').addEventListener('change', e => { update({ rhythmTouch: e.target.checked }); $('rhGate').hidden = e.target.checked || audio.micReady(); });
$('rhDemo').addEventListener('click', demo);
$('rhRestart').addEventListener('click', () => { stop(); start(); });
$('rhClick').addEventListener('change', e => {
  update({ metroClick: e.target.checked });
  if (e.target.checked) toast('Con el clic sonando, usa auriculares para que el micrófono no lo confunda con tus golpes');
});
document.querySelectorAll('[data-rspeed]').forEach(b => b.addEventListener('click', () => {
  run.speed = Number(b.dataset.rspeed);
  update({ speed: run.speed });
  renderControls();
}));
$('rhVbToggle').addEventListener('change', e => { if (e.target.checked) toast('Ponte auriculares: si el micrófono oye la banda virtual, la confunde con tus golpes'); });
