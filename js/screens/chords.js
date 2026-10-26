// Guitarra y piano: practicar acordes. Tres modos: acorde a acorde (espera a que suene limpio), cambios de un minuto
// (cuántas veces cambias entre dos acordes) y a tempo con el cifrado de una canción.
import { $, esc, toast } from '../ui.js';
import { register, go, originTab } from '../router.js';
import * as audio from '../audio.js';
import { matchChord, chordCoverage } from '../chroma.js';
import { parseChord, chordLabel, chordMidis, isFretted, pianoMidis } from '../chords.js';
import { drawChord } from '../boards.js';
import { noteLabel } from '../music.js';
import { lessonTitle } from '../course.js';
import { playableCount } from '../songbook.js';
import { smoother, changeCounter, strumWindows, strumStars, changesStars, holdStars, HOLD_MS, STRUM_GRACE_BEATS, STRUM_OK_RATIO, CHANGES_SECONDS } from '../chord-practice.js';
import { getState, update, learnChords, knownChords, recordChanges, changesHistory } from '../store.js';
import { finishLesson } from './result.js';
import { withMic } from './practice.js';
import { createPulse } from './pulse.js';

const TICK_MS = 35;
const RELEASE_MS = 250;
const HINT_AFTER_MS = 3000;
const MIN_HEARD_SHARE = 0.06;
const MODE_CHIP = { hold: 'Acorde a acorde', changes: 'Un minuto', strum: 'A tempo' };
const TIP = {
  guitar: 'Rasguea todas las cuerdas del acorde y deja que suenen. Si una nota no sale, apoya mejor la yema justo detrás del traste.',
  ukulele: 'Rasguea las cuatro cuerdas con el índice, suave y cerca del final del mástil. Si una nota zumba, apoya la yema justo detrás del traste.',
  piano: 'Baja las teclas del acorde a la vez y mantenlas. Puedes tocarlo en cualquier octava: lo que cuenta son las notas.',
};

let run = null;
let speed = 0.8;
const pulse = createPulse('cdPulse');
const avg = smoother();

const inst = () => getState().instrument;
const label = name => chordLabel(name, getState().nom);
const soundOf = name => (isFretted(inst()) ? chordMidis(name, inst()) : pianoMidis(name));

function showChord(name, next) {
  const svg = $('cdDiagram');
  svg.setAttribute('class', isFretted(inst()) ? 'board chord-board' : 'board');
  drawChord(svg, name, inst(), getState().nom);
  $('cdName').textContent = label(name);
  $('cdNext').textContent = next ? `Después: ${label(next)}` : '';
}

function stripHtml(items) {
  return items.map((name, i) => `<span class="chord-chip" data-i="${i}">${esc(label(name))}</span>`).join('');
}

function markChip(i, cls) {
  const chip = $('cdStrip').querySelector(`[data-i="${i}"]`);
  if (!chip) return;
  chip.className = 'chord-chip ' + cls;
  if (cls.includes('current')) chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

function setMeter(ratio, ok = false) {
  $('cdMeter').style.width = Math.round(Math.min(1, ratio) * 100) + '%';
  $('cdMeter').classList.toggle('ok', ok);
}

// Lo que se oye: el acorde (media de los últimos fotogramas) o null en silencio
function listen() {
  const r = audio.readChroma();
  if (!r) return null;
  if (!r.chroma) { avg.clear(); return null; }
  avg.push(r.chroma);
  return avg.value();
}

// Pista cuando un acorde no sale: qué notas no se oyen
function missingHint(chroma, name) {
  const missing = parseChord(name).pcs.filter(pc => chroma[pc] < MIN_HEARD_SHARE);
  if (!missing.length) return isFretted(getState().instrument) ? 'Casi: alguna cuerda suena de más o rozada.' : 'Casi: alguna tecla de más suena a la vez.';
  return `No oigo ${missing.map(pc => noteLabel({ midi: 60 + pc }, getState().nom, true).replace(/\d/, '')).join(' ni ')}: revisa ese dedo.`;
}

// ---------- Acorde a acorde ----------
function holdTick(now) {
  const name = run.lesson.chords[run.index];
  const chroma = listen();
  const m = chroma ? matchChord(chroma, parseChord(name).pcs) : null;
  if (run.needRelease) {
    if (!m || !m.ok) run.releasedFor += TICK_MS; else run.releasedFor = 0;
    if (run.releasedFor >= RELEASE_MS) { run.needRelease = false; $('cdStatus').textContent = `Otra vez: ${label(name)}`; }
    return;
  }
  if (m && m.ok) {
    run.hold += TICK_MS;
    setMeter(run.hold / HOLD_MS, true);
    if (run.hold >= HOLD_MS) nextHold(now, false);
    return;
  }
  run.hold = Math.max(0, run.hold - TICK_MS);
  setMeter(m ? chordCoverage(chroma, parseChord(name).pcs).inside : 0);
  if (chroma && now - run.chordStart > HINT_AFTER_MS) $('cdStatus').textContent = missingHint(chroma, name);
}

function nextHold(now, skipped) {
  const chords = run.lesson.chords;
  if (skipped) run.skipped++; else run.times.push((now - run.chordStart) / 1000);
  markChip(run.index, skipped ? 'miss' : 'done');
  $('cdStatus').textContent = skipped ? 'Saltado' : `¡${label(chords[run.index])}!`;
  run.index++;
  if (run.index >= chords.length) { finishRun(holdStars(run.times, run.skipped, chords.length), run.skipped ? `${chords.length - run.skipped} de ${chords.length} acordes` : '¡Todos los acordes limpios!'); return; }
  run.needRelease = chords[run.index] === chords[run.index - 1];
  run.releasedFor = 0;
  run.hold = 0;
  run.chordStart = now;
  avg.clear();
  markChip(run.index, 'current');
  showChord(chords[run.index], chords[run.index + 1]);
  setMeter(0);
}

// ---------- Cambios de un minuto ----------
function changesTick(now) {
  const chroma = listen();
  const [a, b] = run.lesson.pair;
  const heard = chroma ? [a, b].find(n => matchChord(chroma, parseChord(n).pcs).ok) || null : null;
  const before = run.counter.count;
  run.counter.feed(heard, now);
  if (run.counter.count !== before) {
    $('cdCount').textContent = run.counter.count;
    $('cdCount').classList.remove('pop'); void $('cdCount').offsetWidth; $('cdCount').classList.add('pop');
  }
  const current = run.counter.current;
  if (current) {
    const other = current === a ? b : a;
    showChord(other, null);
    $('cdStatus').textContent = `Ahora ${label(other)}`;
  }
  const left = Math.max(0, CHANGES_SECONDS - (now - run.startedAt) / 1000);
  $('cdTimer').textContent = `${Math.ceil(left)} s`;
  setMeter(left / CHANGES_SECONDS);
  if (left <= 0) {
    const count = run.counter.count;
    const best = Math.max(0, ...changesHistory(run.lesson.pair).map(x => x.count));
    recordChanges(run.lesson.pair, count);
    const text = count > best && best > 0 ? `¡Nuevo récord! ${count} cambios (antes ${best})` : `${count} cambios en un minuto${best ? ` · récord: ${best}` : ''}`;
    finishRun(changesStars(count, run.lesson.target), text);
  }
}

// ---------- A tempo con el cifrado ----------
function strumTick() {
  const spb = 60 / (run.lesson.bpm * speed);
  const beat = (audio.audioTime() - run.t0) / spb;
  pulse.draw(beat, run.lesson.time);
  if (beat < 0) { $('cdCounter').textContent = String(Math.ceil(-beat)); return; }
  const i = run.windows.findIndex(w => beat >= w.start && beat < w.end);
  $('cdBeat').classList.toggle('on', beat % 1 < 0.2);
  $('cdCounter').textContent = String(Math.floor(beat % run.lesson.time) + 1);
  if (i < 0) { finishStrum(); return; }
  const w = run.windows[i];
  if (i !== run.index) {
    if (run.index >= 0) closeWindow(run.index);
    run.index = i;
    markChip(i, 'current');
    showChord(w.chord, run.windows[i + 1]?.chord);
  }
  const chroma = listen();
  if (beat - w.start < STRUM_GRACE_BEATS || audio.clickMasked()) return;
  w.frames = (w.frames || 0) + 1;
  if (chroma && matchChord(chroma, parseChord(w.chord).pcs).ok) w.hits = (w.hits || 0) + 1;
  setMeter((w.hits || 0) / Math.max(1, w.frames) / STRUM_OK_RATIO, (w.hits || 0) / w.frames >= STRUM_OK_RATIO);
}

function closeWindow(i) {
  const w = run.windows[i];
  w.ok = (w.hits || 0) / Math.max(1, w.frames || 0) >= STRUM_OK_RATIO;
  markChip(i, w.ok ? 'done' : 'miss');
}

function finishStrum() {
  if (run.index >= 0) closeWindow(run.index);
  audio.stopMetronome();
  const ok = run.windows.filter(w => w.ok).length;
  const accuracy = ok / run.windows.length;
  finishRun(strumStars(accuracy), `${ok} de ${run.windows.length} acordes a tiempo`, accuracy);
}

// ---------- Ciclo ----------
function tick() {
  if (!run || !run.playing) return;
  const now = performance.now();
  if (run.lesson.mode === 'hold') holdTick(now);
  else if (run.lesson.mode === 'changes') changesTick(now);
  else strumTick();
}

function start() {
  if (!audio.micReady()) { $('cdGate').hidden = false; return; }
  stop();
  const { lesson } = run;
  avg.clear();
  run.playing = true;
  run.startedAt = performance.now();
  $('cdGo').textContent = 'Reiniciar';
  $('cdSkip').hidden = lesson.mode !== 'hold';
  if (lesson.mode === 'hold') {
    Object.assign(run, { index: 0, hold: 0, times: [], skipped: 0, chordStart: performance.now(), needRelease: false });
    lesson.chords.forEach((_, i) => markChip(i, i ? '' : 'current'));
    showChord(lesson.chords[0], lesson.chords[1]);
    $('cdStatus').textContent = `Pon ${label(lesson.chords[0])} y rasguea`;
  } else if (lesson.mode === 'changes') {
    run.counter = changeCounter();
    $('cdCount').textContent = '0';
    showChord(lesson.pair[0], null);
    $('cdStatus').textContent = `Empieza con ${label(lesson.pair[0])} y cambia todo lo rápido que puedas sin que suene sucio`;
  } else {
    const bpm = lesson.bpm * speed;
    run.windows = strumWindows(lesson.chart);
    run.index = -1;
    run.windows.forEach((_, i) => markChip(i, ''));
    showChord(run.windows[0].chord, run.windows[1]?.chord);
    run.t0 = audio.countIn(lesson.time, bpm, true);
    if (getState().metroClick) { audio.configureMetronome({ bpm, meter: lesson.time, sound: true }); audio.startMetronome(run.t0); }
    pulse.show(true);
    $('cdStatus').textContent = 'Un compás de cuenta y empezamos';
  }
  run.timer = setInterval(tick, TICK_MS);
}

function stop() {
  if (!run) return;
  clearInterval(run.timer);
  run.playing = false;
  audio.stopMetronome();
  pulse.show(false);
}

function finishRun(stars, text, accuracy = null) {
  stop();
  const { lesson, from } = run;
  const minutes = (performance.now() - run.startedAt) / 60000;
  if (stars > 0) celebrateChords(lesson.chords);
  finishLesson({ lesson, mode: lesson.mode === 'strum' ? 'tempo' : 'learn', from, stars, text, title: lessonTitle(lesson), minutes, accuracy: accuracy ?? stars / 3 });
}

// Cada acorde nuevo abre canciones del cancionero: se celebra
function celebrateChords(names) {
  const before = playableCount(knownChords());
  const fresh = learnChords(names);
  if (!fresh.length) return;
  const opened = playableCount(knownChords()) - before;
  const msg = `${fresh.length === 1 ? 'Nuevo acorde' : 'Nuevos acordes'}: ${fresh.map(label).join(', ')}${opened > 0 ? ` · ${opened} ${opened === 1 ? 'canción nueva' : 'canciones nuevas'} en tu cancionero` : ''}`;
  setTimeout(() => toast(msg), 900);
}

function demo() {
  const { lesson } = run;
  if (lesson.mode !== 'strum') { strumNow(lesson.mode === 'changes' ? lesson.pair[0] : lesson.chords[run.index || 0]); return; }
  const spb = 60 / (lesson.bpm * speed);
  const t0 = audio.audioTime() + 0.1;
  strumWindows(lesson.chart).slice(0, 8).forEach(w => {
    for (let b = 0; b < w.beats; b += 1) audio.strum(soundOf(w.chord), t0 + (w.start + b) * spb, spb * 0.95);
  });
}

function strumNow(name) { audio.strum(soundOf(name)); }

function enter({ lesson, from, eyebrow }) {
  stop();
  run = { lesson, from, playing: false, index: 0 };
  $('cdEyebrow').textContent = eyebrow || '';
  $('cdTitle').textContent = lessonTitle(lesson);
  $('cdChip').textContent = MODE_CHIP[lesson.mode];
  $('cdGate').hidden = audio.micReady();
  $('cdMicError').hidden = true;
  $('cdChanges').hidden = lesson.mode !== 'changes';
  $('cdStrumRow').hidden = lesson.mode !== 'strum';
  $('cdClick').checked = getState().metroClick;
  $('cdSkip').hidden = true;
  $('cdGo').textContent = 'Empezar';
  $('cdCounter').textContent = '';
  $('cdTip').textContent = TIP[inst()] || '';
  const items = lesson.mode === 'strum' ? lesson.chart.map(x => x.chord) : lesson.mode === 'changes' ? [] : lesson.chords;
  $('cdStrip').innerHTML = stripHtml(items);
  $('cdStrip').hidden = !items.length;
  const first = lesson.mode === 'changes' ? lesson.pair[0] : items[0];
  showChord(first, lesson.mode === 'changes' ? lesson.pair[1] : items[1]);
  if (lesson.mode === 'changes') {
    const best = Math.max(0, ...changesHistory(lesson.pair).map(x => x.count));
    $('cdCount').textContent = '0';
    $('cdTimer').textContent = `${CHANGES_SECONDS} s`;
    $('cdBest').textContent = best ? `Tu récord: ${best} · meta: ${lesson.target}` : `Meta: ${lesson.target} cambios`;
    $('cdNext').textContent = `Y vuelta a ${label(lesson.pair[1])}`;
  }
  $('cdStatus').textContent = lesson.mode === 'strum' ? `♩ = ${Math.round(lesson.bpm * speed)} · cambia de acorde cuando llegue la línea` : 'Pulsa Empezar cuando tengas la mano colocada';
  document.querySelectorAll('[data-cdspeed]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.cdspeed) === speed));
  setMeter(0);
}

register('chords', { enter, leave: stop });

$('cdGo').addEventListener('click', start);
$('cdSkip').addEventListener('click', () => { if (run && run.playing && run.lesson.mode === 'hold') nextHold(performance.now(), true); });
$('cdDemo').addEventListener('click', () => run && demo());
$('cdStartMic').addEventListener('click', async () => { await withMic('cdGate', 'cdMicError'); });
$('cdExit').addEventListener('click', () => { stop(); go(originTab(run && run.from)); });
$('cdClick').addEventListener('change', e => update({ metroClick: e.target.checked }));
$('cdStrumRow').addEventListener('click', e => {
  const b = e.target.closest('[data-cdspeed]');
  if (!b || (run && run.playing)) return;
  speed = Number(b.dataset.cdspeed);
  document.querySelectorAll('[data-cdspeed]').forEach(x => x.setAttribute('aria-pressed', x === b));
  if (run) $('cdStatus').textContent = `♩ = ${Math.round(run.lesson.bpm * speed)}`;
});
