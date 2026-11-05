// Entonación cantada: la app escucha la voz (en cualquier octava: vale para niños y adultos) y corrige nota a nota.
// Sirve para los ordenamientos, la lectura melódica cantada y la canción de la unidad. Con apoyo (Fácil), la app
// canta primero cada compás y el alumno lo repite (eco); sin apoyo (Media), solo da la tónica y la primera nota.
import { esc } from '../ui.js';
import * as audio from '../audio.js';
import { centsAnyOctave, noteText, letterText } from './notes.js';
import { freqToMidi } from '../music.js';
import { gradeSung, singMark, SING_TOLERANCE } from './grade.js';
import { staffHtml, CLEF } from './kit.js';
import { playNotes, playChordNow, playPitch, stopSound, wait, now } from './sound.js';
import { saveVoice } from './results.js';

const TICK_MS = 30;
const MIN_HOLD_MS = 300;
const MAX_HOLD_MS = 900;
const HOLD_SHARE = 0.6;          // la nota debe durar al menos el 60 % de su valor (contrato del curso)
const NOTE_TIMEOUT_MS = 9000;
const GAP_MS = 120;              // un hueco corto dentro de la misma nota no la corta
const SAME_CENTS = 150;          // lecturas de la misma nota sostenida
const BREAK_CENTS = 70;          // para la nota siguiente igual: hace falta un corte o un cambio de altura
const BREAK_WAIT_MS = 1200;
const AFTER_PLAY_S = 0.3;
const MAJOR_TRIAD = [0, 4, 7];
const MINOR_TRIAD = [0, 3, 7];

const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

// Espera una nota cantada estable y devuelve sus cents (o null si no se oye nada a tiempo)
async function hearNote(midi, holdMs, alive, quietUntil) {
  let run = [];
  let lastVoiced = 0;
  const midis = [];
  const start = performance.now();
  while (alive() && performance.now() - start < NOTE_TIMEOUT_MS) {
    await wait(TICK_MS);
    if (now() < quietUntil()) continue;
    const p = audio.readPitch();
    const t = performance.now();
    if (!p || p.freq === null) {
      if (run.length && t - lastVoiced > GAP_MS) run = [];
      continue;
    }
    const cents = centsAnyOctave(p.freq, midi);
    const m = median(run.map(r => r.cents));
    if (run.length && Math.abs(cents - m) > SAME_CENTS) run = [];
    run.push({ cents, t });
    midis.push(freqToMidi(p.freq));
    lastVoiced = t;
    if (t - run[0].t >= holdMs) return { cents: median(run.map(r => r.cents)), sungMidi: median(midis.slice(-run.length).filter(Number.isFinite)) };
  }
  return { cents: null, sungMidi: null };
}

// Tras aceptar una nota, si la siguiente es la misma hace falta volver a atacarla (silencio breve o cambio)
async function waitBreak(midi, alive) {
  const start = performance.now();
  while (alive() && performance.now() - start < BREAK_WAIT_MS) {
    await wait(TICK_MS);
    const p = audio.readPitch();
    if (!p || p.freq === null || Math.abs(centsAnyOctave(p.freq, midi)) > BREAK_CENTS) return;
  }
}

// Puerta del micrófono (#lmSingGate, #lmSingErr, #lmSingMic en host): insiste hasta que se concede o se sale
export const MIC_GATE = `<div id="lmSingGate" class="mic-gate" hidden><p><strong>Necesito el micrófono</strong> para oír cómo cantas.</p><p class="muted" id="lmSingErr"></p>
      <button type="button" class="btn" id="lmSingMic">Activar micrófono</button></div>`;
export async function openMic(host, env) {
  for (;;) {
    try { await audio.startMic(); break; } catch (err) {
      host.querySelector('#lmSingGate').hidden = false;
      host.querySelector('#lmSingErr').textContent = audio.micErrorText(err);
      host.querySelector('#lmSingMic').focus();
      env.say('Micrófono sin permiso');
      await new Promise(r => host.querySelector('#lmSingMic').addEventListener('click', r, { once: true }));
      if (!env.alive()) return false;
    }
  }
  host.querySelector('#lmSingGate').hidden = true;
  return true;
}

export function groupsOf(notes, by) {
  if (!by) return [notes];
  const out = [];
  notes.forEach(n => {
    const last = out[out.length - 1];
    if (last && last[0].bar === n.bar) last.push(n); else out.push([n]);
  });
  return out;
}

// opts: tokens (scoreTokens), key ('Do M'|'La m'), echo, variant, under (texto bajo cada nota: letra o nombres),
// meter, bpm, clef, intro (texto)
export async function singTask(host, opts, env) {
  const { tokens, echo = false, variant = 'facil', meter = null, bpm = 72, clef = 'treble' } = opts;
  const tolerance = SING_TOLERANCE[variant] || SING_TOLERANCE.facil;
  const sounding = tokens.map((t, i) => ({ ...t, index: i })).filter(t => !t.rest);
  // hideNames: lectura cantada (se lee el pentagrama: ni el nombre debajo ni la app lo dice)
  const hide = !!opts.hideNames;
  const under = hide ? tokens.map(() => '') : opts.under || tokens.map(t => (t.rest ? '' : noteText(t.name, env.nom)));
  const nth = n => sounding.indexOf(n) + 1;
  const marks = [];
  const heard = [];
  let playingUntil = 0;
  const quietUntil = () => playingUntil;

  const draw = current => {
    host.querySelector('.lm-sing-staff').innerHTML = staffHtml(tokens, { clef: CLEF[clef] || clef, meter, marks, under, current });
  };
  host.innerHTML = `${opts.intro ? `<p class="muted">${esc(opts.intro)}</p>` : ''}
    ${MIC_GATE}
    <div class="lm-sing-staff"></div>
    <div class="lm-sing-now" aria-live="polite"><span id="lmSingPhase">Preparado</span> <b id="lmSingNote"></b></div>
    <div class="lm-meter" aria-hidden="true"><i id="lmSingDot"></i></div>
    <div class="controls"><button type="button" class="btn ghost" id="lmSingRef">Oír la primera nota</button></div>`;
  draw(-1);
  const phase = (text, note = '') => {
    host.querySelector('#lmSingPhase').textContent = text;
    host.querySelector('#lmSingNote').textContent = note;
  };
  const first = sounding[0];
  host.querySelector('#lmSingRef').addEventListener('click', () => { playingUntil = playPitch(first.midi, 1) + AFTER_PLAY_S; });

  if (!(await openMic(host, env))) return null;
  audio.setVoiceInput(true);
  try {
    // Situarse: acorde de la tonalidad y primera nota
    const minor = /m$|menor/i.test(opts.key || '');
    const tonic = minor ? 57 : 60;
    phase('Escucha la tonalidad');
    playingUntil = playChordNow((minor ? MINOR_TRIAD : MAJOR_TRIAD).map(x => tonic + x), 1.2) + 0.1;
    await wait(1300);
    phase('Tu primera nota:', noteText(first.name, env.nom));
    playingUntil = playPitch(first.midi, 1) + AFTER_PLAY_S;
    await wait(1200);
    const spb = 60 / bpm;
    const sungMidis = [];
    for (const group of groupsOf(sounding, echo)) {
      if (!env.alive()) return null;
      if (echo) {
        phase('Escucha y repite');
        draw(group[0].index);
        const g0 = group[0].start;
        const r = playNotes(group.map(n => ({ midi: n.midi, start: n.start - g0, beats: n.beats, rest: false })), bpm);
        playingUntil = r.end + AFTER_PLAY_S;
        await wait((playingUntil - now()) * 1000);
      }
      for (const n of group) {
        if (!env.alive()) return null;
        draw(n.index);
        host.dataset.target = String(n.midi);
        if (hide) phase(`Nota ${nth(n)} de ${sounding.length}`); else phase('Canta:', under[n.index] || noteText(n.name, env.nom));
        const hold = Math.max(MIN_HOLD_MS, Math.min(MAX_HOLD_MS, n.beats * spb * 1000 * HOLD_SHARE));
        const { cents, sungMidi } = await hearNote(n.midi, hold, env.alive, quietUntil);
        if (!env.alive()) return null;
        const mark = singMark(cents, tolerance);
        marks[n.index] = mark;
        heard[n.index] = cents;
        if (Number.isFinite(sungMidi)) sungMidis.push(sungMidi);
        const dot = host.querySelector('#lmSingDot');
        if (dot) { dot.className = mark; dot.style.left = `${50 + Math.max(-50, Math.min(50, (cents ?? 0) / 2))}%`; }
        env.say(`${hide ? `Nota ${nth(n)}` : noteText(n.name, env.nom)}: ${cents === null ? 'no te he oído' : mark === 'ok' ? 'afinada' : cents > 0 ? 'alta' : 'baja'}`);
        const next = sounding[sounding.indexOf(n) + 1];
        if (next && next.midi % 12 === n.midi % 12) await waitBreak(n.midi, env.alive);
      }
    }
    delete host.dataset.target;
    draw(-1);
    phase('¡Hecho!');
    if (sungMidis.length >= 2) saveVoice(Math.min(...sungMidis), Math.max(...sungMidis));
    return { marks: sounding.map(n => marks[n.index]), cents: sounding.map(n => heard[n.index] ?? null), names: sounding.map(n => n.name), tolerance, range: sungMidis.length ? [Math.min(...sungMidis), Math.max(...sungMidis)] : null };
  } finally {
    audio.setVoiceInput(false);
    stopSound();
  }
}

// Texto bajo cada nota para la canción: la letra (por compases) o los nombres de nota
export function lyricsUnder(tokens, letra, nom, names = false) {
  if (names || !letra) return tokens.map(t => (t.rest ? '' : letterText(t.name[0], nom)));
  const counters = {};
  return tokens.map(t => {
    if (t.rest) return '';
    const k = counters[t.bar] = (counters[t.bar] ?? -1) + 1;
    return (letra[t.bar] || [])[k] ?? '';
  });
}

// Resultado de una toma cantada según el contrato (marcas → porcentaje y errores)
export function singResult(take) {
  const g = gradeSung(take.names, take.cents, { tolerance: take.tolerance });
  return { pct: g.pct, marks: g.marks, mistakes: g.mistakes };
}
