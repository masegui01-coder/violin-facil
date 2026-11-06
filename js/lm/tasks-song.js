// Canción de la unidad cantada A TEMPO: la partitura avanza con el pulso y la app mide dos cosas de cada nota,
// la afinación (en cualquier octava, como en la entonación) y el ataque (cuándo empieza respecto a su sitio).
// Fácil: la app canta cada compás y el alumno lo repite a tempo tras un compás de claqueta (eco).
// Media: un compás de claqueta y toda la canción seguida, sin voz guía.
import { esc } from '../ui.js';
import * as audio from '../audio.js';
import { centsAnyOctave, noteText, barBeatsOf } from './notes.js';
import { gradeSung, singMark, SING_TOLERANCE, pctOf, mistakeCodes } from './grade.js';
import { staffHtml, CLEF } from './kit.js';
import { playEvents, playChordNow, clicks, stopSound, wait, now } from './sound.js';
import { MIC_GATE, openMic, groupsOf } from './tasks-voice.js';
import { dynamicsChecks } from './dynamics.js';
import { keepInView } from './systems.js';

const TICK_MS = 25;
// Ataque a tiempo: ±180 ms en Fácil y ±120 ms en Media (la voz arranca más despacio que una palmada)
export const ATTACK_TOLERANCE_S = { facil: 0.18, medio: 0.12 };
const VOICED_SHARE = 0.6;   // la nota tiene que sonar al menos el 60 % de su valor
const EDGE_S = 0.06;         // se descartan los bordes de cada nota (transición entre notas)
const JUMP_CENTS = 70;       // cambio de altura que cuenta como ataque nuevo
const TAIL_S = 0.6;
const MAJOR_TRIAD = [0, 4, 7];
const MINOR_TRIAD = [0, 3, 7];

const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

// Ataques de una toma: instantes en que empieza a sonar la voz o cambia de nota (frames: { t, freq|null })
export function attacksOf(frames) {
  const out = [];
  let prev = null;
  frames.forEach(f => {
    if (f.freq === null) { prev = null; return; }
    if (!prev || Math.abs(1200 * Math.log2(f.freq / prev.freq)) > JUMP_CENTS) out.push(f.t);
    prev = f;
  });
  return out;
}

// Corrección de una toma a tempo: notas { midi, start, beats } (pulsos desde t0), frames del micrófono
export function gradeTimedTake(notes, frames, { t0, spb, tolerance, attackTol }) {
  const attacks = attacksOf(frames);
  const used = new Set();
  return notes.map(n => {
    const from = t0 + n.start * spb;
    const to = from + n.beats * spb;
    const inside = frames.filter(f => f.t >= from + EDGE_S && f.t <= to - EDGE_S);
    const voiced = inside.filter(f => f.freq !== null);
    const cents = voiced.length && voiced.length >= inside.length * VOICED_SHARE ? median(voiced.map(f => centsAnyOctave(f.freq, n.midi))) : null;
    let best = -1;
    attacks.forEach((a, i) => { if (!used.has(i) && Math.abs(a - from) <= attackTol * 2 && (best < 0 || Math.abs(a - from) < Math.abs(attacks[best] - from))) best = i; });
    if (best >= 0) used.add(best);
    const off = best >= 0 ? attacks[best] - from : null;
    const attack = off === null ? 'bad' : Math.abs(off) <= attackTol ? 'ok' : 'near';
    return { cents, pitch: singMark(cents, tolerance), attack, off };
  });
}

// Acompañamiento de la canción: acorde de tónica o de dominante en cada compás (el que mejor encaja con sus notas),
// en el registro grave; en la habanera, con su ritmo (corchea con puntillo, semicorchea y dos corcheas)
const DOMINANT_LETTERS = new Set(['B', 'D', 'F']);
const HABANERA = [[0, 0.75], [0.75, 0.25], [1, 0.5], [1.5, 0.5]];
const ACCOMP_GAIN = 0.32;
export function accompaniment(tokens, { meter, bpm, key = '', habanera = false, fromBar = 0, toBar = Infinity }) {
  const barBeats = barBeatsOf(meter);
  const spb = 60 / bpm;
  const minor = /m$|menor|La m/i.test(key);
  const I = minor ? [45, 48, 52] : [48, 52, 55];   // La2-Do3-Mi3 / Do3-Mi3-Sol3
  const V = minor ? [40, 44, 47] : [43, 47, 50];   // Mi2-Sol#2-Si2 / Sol2-Si2-Re3
  const bars = Math.max(0, ...tokens.map(t => t.bar)) + 1;
  const events = [];
  for (let b = Math.max(0, fromBar); b < Math.min(bars, toBar + 1); b++) {
    const notes = tokens.filter(t => t.bar === b && !t.rest);
    const dominant = notes.filter(t => DOMINANT_LETTERS.has(t.name[0])).length > notes.filter(t => !DOMINANT_LETTERS.has(t.name[0])).length;
    const chord = dominant ? V : I;
    const start = (b - fromBar) * barBeats;
    const pattern = habanera ? HABANERA.flatMap(([at, len]) => (barBeats >= 2 ? [[at, len]] : [])) : [[0, barBeats]];
    pattern.forEach(([at, len], k) => {
      const midis = habanera ? [k === 0 ? chord[0] : chord[(k % 2) + 1]] : chord;
      midis.forEach(m => events.push({ midi: m, at: (start + at) * spb, dur: len * spb * 0.9, gain: ACCOMP_GAIN }));
    });
  }
  return events;
}

export async function singSong(host, opts, env) {
  const { tokens, meter, bpm, echo, variant } = opts;
  const tolerance = SING_TOLERANCE[variant] || SING_TOLERANCE.facil;
  const attackTol = ATTACK_TOLERANCE_S[variant] || ATTACK_TOLERANCE_S.facil;
  const barBeats = barBeatsOf(meter);
  const spb = 60 / bpm;
  const sounding = tokens.map((t, i) => ({ ...t, index: i })).filter(t => !t.rest);
  const marks = [];
  host.innerHTML = `${opts.intro ? `<p class="muted">${esc(opts.intro)}</p>` : ''}${MIC_GATE}
    <div class="lm-sing-staff"></div>
    <div class="lm-sing-now lm-sticky-controls" aria-live="polite"><span id="lmSingPhase">Preparado</span> <b id="lmSingNote"></b></div>
    <div class="lm-vol" aria-hidden="true"><span>Volumen</span><span class="lm-vol-track"><i id="lmVol"></i></span></div>
    <div class="controls"><button type="button" class="btn ghost" id="lmSongHear">Escuchar la canción con acompañamiento</button><button type="button" class="btn big" id="lmSongGo">Empezar a cantar</button></div>
    <p class="muted small">${echo ? 'Con apoyo: la app canta cada compás con su acompañamiento y tú lo repites a tempo.' : 'Sin apoyo: un compás de claqueta y cantas toda la canción a capela.'}</p>`;
  // Con 2.ª estrofa (letra2): barra de repetición al final, las dos letras debajo y se canta dos veces
  const passes = opts.under2 ? 2 : 1;
  const draw = current => {
    host.querySelector('.lm-sing-staff').innerHTML = staffHtml(tokens, { clef: CLEF.treble, meter, marks, under: opts.under, under2: opts.under2 || null, current, dynamics: opts.dynamics || null, repeat: passes > 1 });
    const on = current >= 0 && host.querySelector('.lm-sing-staff .lm-now');
    if (on) keepInView(on); // la nota que se canta, siempre a la vista
  };
  const phase = (text, note = '') => { host.querySelector('#lmSingPhase').textContent = text; host.querySelector('#lmSingNote').textContent = note; };
  draw(-1);
  host.querySelector('#lmSongHear').addEventListener('click', () => {
    stopSound();
    const span = tokens.reduce((s, t) => s + t.beats, 0) * spb;
    const once = [...sounding.map(n => ({ midi: n.midi, at: n.start * spb, dur: n.beats * spb * 0.92, gain: 1 })), ...accompaniment(tokens, { meter, bpm, key: opts.key, habanera: opts.habanera })];
    playEvents(Array.from({ length: passes }, (_, k) => once.map(e => ({ ...e, at: e.at + k * span }))).flat());
  });
  host.querySelector('#lmSongGo').focus();
  await new Promise(r => host.querySelector('#lmSongGo').addEventListener('click', r, { once: true }));
  stopSound();
  host.querySelector('.controls').remove();
  host.querySelector('.muted.small')?.remove();
  if (!(await openMic(host, env))) return null;
  audio.setVoiceInput(true);
  const results = [];
  try {
    const minor = /m$|menor/i.test(opts.key || '');
    phase('Escucha la tonalidad');
    playChordNow((minor ? MINOR_TRIAD : MAJOR_TRIAD).map(x => (minor ? 57 : 60) + x), 1.2);
    await wait(1400);
    for (let pass = 0; pass < passes; pass++) {
    const words = pass ? opts.under2 : opts.under;
    if (pass) { phase('Ahora, la 2.ª estrofa (la letra de abajo)'); env.say('Segunda estrofa'); await wait(1200); }
    for (const group of groupsOf(sounding, echo)) {
      if (!env.alive()) return null;
      const g0 = echo ? group[0].bar * barBeats : 0;
      const notes = group.map(n => ({ midi: n.midi, start: n.start - g0, beats: n.beats, rest: false, index: n.index }));
      const length = echo ? barBeats : tokens.reduce((s, t) => s + t.beats, 0);
      if (echo) {
        phase('Escucha y repite');
        const bar = group[0].bar;
        const r = playEvents([...notes.map(n => ({ midi: n.midi, at: n.start * spb, dur: n.beats * spb * 0.92, gain: 1 })),
          ...accompaniment(tokens, { meter, bpm, key: opts.key, habanera: opts.habanera, fromBar: bar, toBar: bar })]);
        await wait((r.end - now() + 0.2) * 1000);
      }
      // claqueta de un compás y a cantar: los fotogramas del micrófono se guardan con su instante
      phase('Claqueta…');
      const t0 = clicks(barBeats, bpm, { accentEvery: barBeats });
      const frames = [];
      const end = t0 + length * spb + TAIL_S;
      while (env.alive() && now() < end) {
        await wait(TICK_MS);
        const t = now();
        if (t < t0 - 0.1) continue;
        const p = audio.readPitch();
        frames.push({ t: t - audio.outputLatency(), freq: p && p.freq ? p.freq : null, level: p ? p.level || 0 : 0 });
        const vol = host.querySelector('#lmVol');
        if (vol) vol.style.width = `${Math.min(100, Math.round((p ? p.level || 0 : 0) * 600))}%`;
        const beat = (t - t0) / spb;
        const cur = notes.find(n => beat >= n.start && beat < n.start + n.beats);
        if (cur) {
          if (host.dataset.index !== String(cur.index)) {
            host.dataset.index = String(cur.index);
            host.dataset.target = String(cur.midi);
            draw(cur.index);
            phase('Canta:', (words && words[cur.index]) || (opts.hideNames ? '' : noteText(tokens[cur.index].name, env.nom)));
          }
        } else if (beat >= 0 && host.dataset.target) { delete host.dataset.target; delete host.dataset.index; }
      }
      if (!env.alive()) return null;
      const graded = gradeTimedTake(notes, frames, { t0, spb, tolerance, attackTol });
      graded.forEach((g, k) => {
        const n = notes[k];
        const from = t0 + n.start * spb;
        const lv = frames.filter(f => f.freq !== null && f.t >= from && f.t <= from + n.beats * spb).map(f => f.level);
        marks[n.index] = g.pitch;
        results.push({ ...g, name: tokens[n.index].name, bar: tokens[n.index].bar, level: lv.length ? median(lv) : null });
      });
      draw(-1);
    }
    }
    phase('¡Hecho!');
    delete host.dataset.target;
    const pitch = gradeSung(results.map(r => r.name), results.map(r => r.cents), { tolerance });
    const attackMarks = results.map(r => r.attack);
    // matices (p/f, reguladores) con el volumen de cada nota: pesan un 15 %
    const dyn = opts.dynamics ? dynamicsChecks(opts.dynamics, results, results.map(r => r.level)) : null;
    const dynPart = dyn && dyn.total ? dyn.ok / dyn.total : null;
    const late = results.filter(r => r.off !== null && r.off > attackTol).length;
    const early = results.filter(r => r.off !== null && r.off < -attackTol).length;
    return {
      pct: Math.round(dynPart === null ? 0.7 * pitch.pct + 0.3 * pctOf(attackMarks) : 0.6 * pitch.pct + 0.25 * pctOf(attackMarks) + 15 * dynPart),
      skills: { entonacion: pitch.pct, ritmo: pctOf(attackMarks) },
      marks: pitch.marks, names: results.map(r => r.name),
      mistakes: mistakeCodes([...pitch.mistakes, late > early && late > 1 ? 'tempo-' : null, early > late && early > 1 ? 'tempo+' : null, dynPart !== null && dynPart < 1 ? 'matiz' : null]),
    };
  } finally {
    audio.setVoiceInput(false);
    stopSound();
  }
}
