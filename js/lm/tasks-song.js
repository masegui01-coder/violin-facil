// Canción de la unidad cantada A TEMPO: la partitura avanza con el pulso y la app mide dos cosas de cada nota,
// la afinación (en cualquier octava, como en la entonación) y el ataque (cuándo empieza respecto a su sitio).
// Fácil: la app canta cada compás y el alumno lo repite a tempo tras un compás de claqueta (eco).
// Media: un compás de claqueta y toda la canción seguida, sin voz guía.
import { esc } from '../ui.js';
import * as audio from '../audio.js';
import { centsAnyOctave, noteText, barBeatsOf } from './notes.js';
import { gradeSung, singMark, SING_TOLERANCE, pctOf, mistakeCodes } from './grade.js';
import { staffHtml, CLEF } from './kit.js';
import { playNotes, playChordNow, clicks, stopSound, wait, now } from './sound.js';
import { MIC_GATE, openMic, groupsOf } from './tasks-voice.js';

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
    <div class="lm-sing-now" aria-live="polite"><span id="lmSingPhase">Preparado</span> <b id="lmSingNote"></b></div>
    <div class="controls"><button type="button" class="btn big" id="lmSongGo">Empezar a cantar</button></div>`;
  const draw = current => { host.querySelector('.lm-sing-staff').innerHTML = staffHtml(tokens, { clef: CLEF.treble, meter, marks, under: opts.under, current }); };
  const phase = (text, note = '') => { host.querySelector('#lmSingPhase').textContent = text; host.querySelector('#lmSingNote').textContent = note; };
  draw(-1);
  host.querySelector('#lmSongGo').focus();
  await new Promise(r => host.querySelector('#lmSongGo').addEventListener('click', r, { once: true }));
  host.querySelector('.controls').remove();
  if (!(await openMic(host, env))) return null;
  audio.setVoiceInput(true);
  const results = [];
  try {
    const minor = /m$|menor/i.test(opts.key || '');
    phase('Escucha la tonalidad');
    playChordNow((minor ? MINOR_TRIAD : MAJOR_TRIAD).map(x => (minor ? 57 : 60) + x), 1.2);
    await wait(1400);
    for (const group of groupsOf(sounding, echo)) {
      if (!env.alive()) return null;
      const g0 = echo ? group[0].bar * barBeats : 0;
      const notes = group.map(n => ({ midi: n.midi, start: n.start - g0, beats: n.beats, rest: false, index: n.index }));
      const length = echo ? barBeats : tokens.reduce((s, t) => s + t.beats, 0);
      if (echo) {
        phase('Escucha y repite');
        const r = playNotes(notes, bpm);
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
        frames.push({ t: t - audio.outputLatency(), freq: p && p.freq ? p.freq : null });
        const beat = (t - t0) / spb;
        const cur = notes.find(n => beat >= n.start && beat < n.start + n.beats);
        if (cur) {
          if (host.dataset.index !== String(cur.index)) {
            host.dataset.index = String(cur.index);
            host.dataset.target = String(cur.midi);
            draw(cur.index);
            phase('Canta:', opts.under[cur.index] || noteText(tokens[cur.index].name, env.nom));
          }
        } else if (beat >= 0 && host.dataset.target) { delete host.dataset.target; delete host.dataset.index; }
      }
      if (!env.alive()) return null;
      const graded = gradeTimedTake(notes, frames, { t0, spb, tolerance, attackTol });
      graded.forEach((g, k) => { marks[notes[k].index] = g.pitch; results.push({ ...g, name: tokens[notes[k].index].name }); });
      draw(-1);
    }
    phase('¡Hecho!');
    delete host.dataset.target;
    const pitch = gradeSung(results.map(r => r.name), results.map(r => r.cents), { tolerance });
    const attackMarks = results.map(r => r.attack);
    const late = results.filter(r => r.off !== null && r.off > attackTol).length;
    const early = results.filter(r => r.off !== null && r.off < -attackTol).length;
    return {
      pct: Math.round(0.7 * pitch.pct + 0.3 * pctOf(attackMarks)),
      skills: { entonacion: pitch.pct, ritmo: pctOf(attackMarks) },
      marks: pitch.marks, names: results.map(r => r.name),
      mistakes: mistakeCodes([...pitch.mistakes, late > early && late > 1 ? 'tempo-' : null, early > late && early > 1 ? 'tempo+' : null]),
    };
  } finally {
    audio.setVoiceInput(false);
    stopSound();
  }
}
