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
import { dynamicsChecks } from './dynamics.js';

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
async function hearNote(midi, holdMs, alive, quietUntil, onLevel = () => {}) {
  let run = [];
  const levels = [];
  let lastVoiced = 0;
  const midis = [];
  const start = performance.now();
  while (alive() && performance.now() - start < NOTE_TIMEOUT_MS) {
    await wait(TICK_MS);
    if (now() < quietUntil()) continue;
    const p = audio.readPitch();
    const t = performance.now();
    onLevel(p ? p.level || 0 : 0);
    if (!p || p.freq === null) {
      if (run.length && t - lastVoiced > GAP_MS) run = [];
      continue;
    }
    levels.push(p.level || 0);
    const cents = centsAnyOctave(p.freq, midi);
    const m = median(run.map(r => r.cents));
    if (run.length && Math.abs(cents - m) > SAME_CENTS) run = [];
    run.push({ cents, t });
    midis.push(freqToMidi(p.freq));
    lastVoiced = t;
    if (t - run[0].t >= holdMs) return { cents: median(run.map(r => r.cents)), sungMidi: median(midis.slice(-run.length).filter(Number.isFinite)), level: median(levels.slice(-run.length)) };
  }
  return { cents: null, sungMidi: null, level: null };
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
  // help: lectura con apoyo (Fácil): se puede oír la nota que toca, pero entonces cuenta como «casi»
  const help = !!opts.help;
  const helped = new Set();
  let currentNote = null;
  const levels = [];
  const marks = [];
  const heard = [];
  let playingUntil = 0;
  const quietUntil = () => playingUntil;

  const draw = current => {
    // ordenamiento con notas que aún no se leen: se canta de oído, con los nombres (sin pentagrama)
    host.querySelector('.lm-sing-staff').innerHTML = opts.noStaff
      ? `<ol class="lm-names-row">${sounding.map(n => `<li class="${marks[n.index] || ''}${n.index === current ? ' lm-now' : ''}">${esc(noteText(n.name, env.nom))}</li>`).join('')}</ol>`
      : staffHtml(tokens, { clef: CLEF[clef] || clef, meter, marks, under, current, dynamics: opts.dynamics || null });
  };
  host.innerHTML = `${opts.intro ? `<p class="muted">${esc(opts.intro)}</p>` : ''}
    ${MIC_GATE}
    <div class="lm-sing-staff"></div>
    <div class="lm-sing-now" aria-live="polite"><span id="lmSingPhase">Preparado</span> <b id="lmSingNote"></b></div>
    <div class="lm-meter" aria-hidden="true"><i id="lmSingDot"></i></div>
    <div class="lm-vol" aria-hidden="true"><span>Volumen</span><span class="lm-vol-track"><i id="lmVol"></i></span></div>
    <div class="controls"><button type="button" class="btn ghost" id="lmSingRef">Oír la primera nota</button>${help ? '<button type="button" class="btn ghost" id="lmSingHelp">Ayuda: oír la nota que toca</button>' : ''}</div>`;
  draw(-1);
  const phase = (text, note = '') => {
    host.querySelector('#lmSingPhase').textContent = text;
    host.querySelector('#lmSingNote').textContent = note;
  };
  const first = sounding[0];
  host.querySelector('#lmSingRef').addEventListener('click', () => { playingUntil = playPitch(first.midi, 1) + AFTER_PLAY_S; });
  host.querySelector('#lmSingHelp')?.addEventListener('click', () => {
    if (!currentNote) return;
    helped.add(currentNote.index);
    playingUntil = playPitch(currentNote.midi, 0.8) + AFTER_PLAY_S;
  });
  const VOL_GAIN = 6;
  const showLevel = l => { const v = host.querySelector('#lmVol'); if (v) v.style.width = `${Math.min(100, Math.round(l * VOL_GAIN * 100))}%`; };

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
        currentNote = n;
        if (hide) phase(`Nota ${nth(n)} de ${sounding.length}`); else phase('Canta:', under[n.index] || noteText(n.name, env.nom));
        const hold = Math.max(MIN_HOLD_MS, Math.min(MAX_HOLD_MS, n.beats * spb * 1000 * HOLD_SHARE));
        const { cents, sungMidi, level } = await hearNote(n.midi, hold, env.alive, quietUntil, showLevel);
        if (!env.alive()) return null;
        levels[n.index] = level;
        const raw = singMark(cents, tolerance);
        const mark = raw === 'ok' && helped.has(n.index) ? 'near' : raw;
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
    // matices: con el volumen de cada nota cantada, lo forte más fuerte que lo piano y los reguladores
    const dyn = opts.dynamics ? dynamicsChecks(opts.dynamics, sounding, sounding.map(n => levels[n.index] ?? null)) : null;
    return { marks: sounding.map(n => marks[n.index]), cents: sounding.map(n => (helped.has(n.index) && heard[n.index] !== null ? Math.max(Math.abs(heard[n.index] ?? 0), tolerance + 1) : heard[n.index] ?? null)), names: sounding.map(n => n.name), tolerance, dyn, range: sungMidis.length ? [Math.min(...sungMidis), Math.max(...sungMidis)] : null };
  } finally {
    audio.setVoiceInput(false);
    stopSound();
  }
}

// Texto bajo cada nota para la canción: la letra (por compases) o los nombres de nota
export function lyricsUnder(tokens, letra, nom, names = false, words = '') {
  if (names || !letra) return tokens.map(t => (t.rest ? '' : letterText(t.name[0], nom)));
  const counters = {};
  const syl = tokens.map(t => {
    if (t.rest) return '';
    const k = counters[t.bar] = (counters[t.bar] ?? -1) + 1;
    return (letra[t.bar] || [])[k] ?? '';
  });
  return words ? hyphenate(syl, words) : syl;
}

// Guion tras cada sílaba que no acaba palabra. La letra del catálogo viene por sílabas; el texto seguido (words)
// dice dónde acaba cada palabra: se recorren las letras de las dos a la vez
const letters = w => w.toLowerCase().replace(/[^\p{L}]/gu, '');
export function hyphenate(syllables, words) {
  const ends = new Set();
  let pos = 0;
  words.split(/\s+/).forEach(w => { pos += letters(w).length; ends.add(pos); });
  let at = 0;
  return syllables.map(s => {
    if (!s) return s;
    at += letters(s).length;
    return ends.has(at) || /-$/.test(s) ? s : `${s}-`;
  });
}

// La letra seguida de cada canción del Nivel 1 (para los guiones entre sílabas)
export const SONG_WORDS = {
  'El pregón de la frutera': 'Fresas ¡ya! Rojas ¡ya! Dulces, frescas, buenas, grandes, Venga, ¡ven! venga, ¡ven! ¡Lleva todas, ¡ven! ¡ya!',
  'Robots en el patio': 'Pipipí, robot prende la luz, Pipipí, robot mueve el pie, ¡clac! Gira la cabeza, gira sin parar Me quedo sin pila, ¡ay, no! ¡clic!',
  'El faro': 'Luce el faro sobre el mar, ¡brilla, brilla! ¡luz! Los barcos vuelven ya a dormir Duerme, duerme, mar',
  'Vals de los relojes': 'Tic tac tic tac Baila el reloj Vamos a girar y se acabó ¡ya!',
  'La escalera': 'Subo yo la escalera, ¡do! Bajo yo la escalera, ¡do! Mi fa muy juntos van, ¡sí! si do también juntos, ¡sí! ¡Ya lo sabes! ¡Do!',
  'La brisa y el mar': 'La brisa me canta su canción de paz; el mar me responde ¡fuerte, fuerte! ¡bum! Las olas suenan más y más, y más, ¡más! La ola se va, se va, se va.',
  'Saloma del barco fantasma': '¡Vamos, barco, al mar, ¡eho! ¡Tira del timón, ¡eho! Densa niebla, todo está gris; rumbo al puerto, ¡ya!',
  '¿Te vienes?': '¿Te vienes a cantar? ¿Te vienes a bailar? ¡Sí, vamos a cantar! ¡Sí, vamos a bailar! Con mis amigos suena mejor, con mis amigos suena mejor, ¡sí, sí!',
};

// La 2.ª estrofa (letra2) de las canciones que la tienen
export const SONG_WORDS2 = {
  'Vals de los relojes': 'Tic tac tic tac Marca el compás Uno, dos, tres, ¡pum! y vuelta a empezar',
  'Saloma del barco fantasma': 'Sopla viento sur, ¡eho! Lleva el barco al sol, ¡eho! Cantan las gaviotas al ver tierra, tierra, ¡sí!',
};

// Resultado de una toma cantada según el contrato (marcas → porcentaje y errores)
export function singResult(take) {
  const g = gradeSung(take.names, take.cents, { tolerance: take.tolerance });
  // con matices, pesan un 15 % (el resto, la afinación)
  const dyn = take.dyn && take.dyn.total ? take.dyn : null;
  const pct = dyn ? Math.round(0.85 * g.pct + 15 * dyn.ok / dyn.total) : g.pct;
  return { pct, marks: g.marks, mistakes: dyn && dyn.ok < dyn.total ? [...g.mistakes, 'matiz'] : g.mistakes };
}
