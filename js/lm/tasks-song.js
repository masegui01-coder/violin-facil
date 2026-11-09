// Canción de la unidad cantada A TEMPO: la partitura avanza con el pulso y la app mide dos cosas de cada nota,
// la afinación (en cualquier octava, como en la entonación) y el ataque (cuándo empieza respecto a su sitio).
// Fácil: la app canta cada compás y el alumno lo repite a tempo tras un compás de claqueta (eco).
// Media: un compás de claqueta y toda la canción seguida, sin voz guía.
// La canción se canta en el orden en que suena (form.js): barra de repetición, casillas de 1.ª y 2.ª vez, D.C. al Fine,
// cada vuelta con su letra (letra / letra2). Una nota ligada es una sola nota. En 6/8 la claqueta marca la negra con
// puntillo. En clave de fa, la app suena una octava más arriba y se canta ahí.
import { esc } from '../ui.js';
import * as audio from '../audio.js';
import { centsAnyOctave, noteText, barBeatsOf, attackTokens, pulseOfParams, meterPlan, midiOf } from './notes.js';
import { chordVoicing } from './harmony.js';
import { gradeSung, singMark, SING_TOLERANCE, pctOf, mistakeCodes } from './grade.js';
import { staffHtml, CLEF } from './kit.js';
import { playEvents, playChordNow, clicks, stopSound, wait, now } from './sound.js';
import { MIC_GATE, openMic, groupsOf, keyTonic } from './tasks-voice.js';
import { dynamicsChecks } from './dynamics.js';
import { keepInView } from './systems.js';
import { passesOf, totalBars, barNumber, passText } from './form.js';

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

// Las vueltas de la canción: [{ notes, bars, length }]. Cada nota (las ligadas, fundidas en una) con su «start» DENTRO de la
// vuelta (los compases que se saltan no cuentan), su «index» en la partitura y su «pass». length: pulsos de la vuelta.
export function songPasses(tokens, { form = null, pickup = 0, meter = '4/4' } = {}) {
  const barBeats = barBeatsOf(meter);
  const attacks = attackTokens(tokens).filter(t => !t.rest);
  const f = form === true ? { kind: 'repeat', desde: 1, hasta: null } : form;
  // cambios de compás (@time): cada compás escrito mide lo suyo y empieza donde empieza su primera figura
  const plan = meterPlan(tokens, meter);
  const idxOf = b => (pickup ? b : b - 1);
  const startOf = b => { const t = tokens.find(x => x.bar === idxOf(b)); return t ? t.start : 0; };
  return passesOf(f, totalBars(tokens, pickup), !!pickup).map((bars, pass) => {
    let at = 0;
    const notes = [];
    bars.forEach(b => {
      const beats = b === 0 ? pickup : plan ? plan.sizes[idxOf(b)] : barBeats;
      const scoreStart = b === 0 ? 0 : plan ? startOf(b) : pickup + (b - 1) * barBeats;
      attacks.filter(t => barNumber(t, pickup) === b).forEach(t => notes.push({ ...t, pass, start: at + (t.start - scoreStart), barAt: at, barLen: beats }));
      at += beats;
    });
    return { notes, bars, length: at, pass };
  });
}

// Acompañamiento de la canción: acorde de tónica o de dominante en cada compás (el que mejor encaja con sus notas),
// en el registro grave y en la tonalidad de la canción; en la habanera, con su ritmo (corchea con puntillo, semicorchea y
// dos corcheas). bars: números de compás de la partitura (desde 0) que suenan, en orden (por defecto, todos)
const HABANERA = [[0, 0.75], [0.75, 0.25], [1, 0.5], [1.5, 0.5]];
const ACCOMP_GAIN = 0.32;
export function accompaniment(tokens, { meter, bpm, key = '', habanera = false, fromBar = 0, toBar = Infinity, bars = null, pickup = 0, chords = null }) {
  const barBeats = barBeatsOf(meter);
  const plan = meterPlan(tokens, meter);
  const spb = 60 / bpm;
  const { minor, midi: top } = keyTonic(key);
  const root = top - 12;                                  // la tónica, en el registro grave
  const I = [root, root + (minor ? 3 : 4), root + 7];
  const V = [root - 5, root - 1, root + 2];               // el acorde de dominante, una quinta por debajo
  const total = Math.max(0, ...tokens.map(t => t.bar)) + 1;
  const list = bars || Array.from({ length: Math.min(total, toBar + 1) - Math.max(0, fromBar) }, (_, i) => Math.max(0, fromBar) + i);
  const events = [];
  let at = 0;
  list.forEach(b => {
    const notes = tokens.filter(t => t.bar === b && !t.rest);
    // las notas que solo caben en el acorde de dominante (sensible, 2.º y 4.º grado)
    const dom = n => [11, 2, 5].includes((((n.midi - top) % 12) + 12) % 12);
    const dominant = notes.filter(dom).length > notes.filter(n => !dom(n)).length;
    const chord = dominant ? V : I;
    const isPickup = !!pickup && b === 0;
    const len = isPickup ? pickup : plan ? plan.sizes[b] : barBeats;
    // Nivel 4: los acordes escritos en el catálogo (uno por compás, o dos: mitad y mitad), en el registro grave
    const written = chords && !isPickup ? [].concat(chords[pickup ? b - 1 : b] || []) : [];
    if (written.length) {
      written.forEach((numeral, k) => {
        const { bass, notes: voices } = chordVoicing(key, numeral);
        [bass, ...voices].map(midiOf).map(m => m - (m > 55 ? 12 : 0)).forEach(m => events.push({ midi: m, at: (at + (k * len) / written.length) * spb, dur: (len / written.length) * spb * 0.9, gain: ACCOMP_GAIN }));
      });
    } else if (!isPickup) {
      const pattern = habanera ? HABANERA.flatMap(([a, l]) => (barBeats >= 2 ? [[a, l]] : [])) : [[0, barBeats]];
      pattern.forEach(([a, l], k) => {
        const midis = habanera ? [k === 0 ? chord[0] : chord[(k % 2) + 1]] : chord;
        midis.forEach(m => events.push({ midi: m, at: (at + a) * spb, dur: l * spb * 0.9, gain: ACCOMP_GAIN }));
      });
    }
    at += len;
  });
  return events;
}

export async function singSong(host, opts, env) {
  const { tokens, meter, bpm, echo, variant } = opts;
  const tolerance = SING_TOLERANCE[variant] || SING_TOLERANCE.facil;
  const attackTol = ATTACK_TOLERANCE_S[variant] || ATTACK_TOLERANCE_S.facil;
  const barBeats = barBeatsOf(meter);
  const pulse = pulseOfParams({ compas: meter, pulso: opts.pulso });
  const spb = 60 / bpm;
  const pickup = opts.pickup || 0;
  const clef = CLEF[opts.clave] || 'treble';
  // la clave de fa se canta una octava más arriba
  const up = clef === 'bass' ? 12 : 0;
  // con 2.ª estrofa (letra2) y sin forma escrita, la barra de repetición al final: dos vueltas
  const form = opts.form || (opts.under2 ? { kind: 'repeat', desde: 1, hasta: null } : null);
  const passes = songPasses(tokens, { form, pickup, meter });
  // segunda voz (Nivel 3): la otra voz de la canción, que toca la app. Suena al escuchar y en el eco; mientras se canta,
  // solo con auriculares (si no, el micrófono la oiría)
  const partner = opts.partner || null;
  const partnerPasses = partner ? songPasses(partner.tokens, { form, pickup, meter }) : null;
  const partnerEvents = (pass, from = 0, to = Infinity, shift = 0) => (partnerPasses ? partnerPasses[pass.pass].notes.filter(n => n.start >= from - 1e-6 && n.start < to - 1e-6).map(n => ({ midi: n.midi + up, at: (n.start - shift) * spb, dur: n.beats * spb * 0.92, gain: 0.6 })) : []);
  const marks = [];
  host.innerHTML = `${opts.intro ? `<p class="muted">${esc(opts.intro)}</p>` : ''}${up ? '<p class="lm-notice">Está escrita en clave de fa: se canta una octava más arriba.</p>' : ''}${MIC_GATE}
    <div class="lm-sing-staff"></div>
    <div class="lm-sing-now lm-sticky-controls" aria-live="polite"><span id="lmSingPhase">Preparado</span> <b id="lmSingNote"></b></div>
    <div class="lm-vol" aria-hidden="true"><span>Volumen</span><span class="lm-vol-track"><i id="lmVol"></i></span></div>
    ${partner ? `<div class="lm-partner">${partner.html}</div>` : ''}
    ${partner ? '<label class="lm-check" id="lmSongPhonesBox"><input type="checkbox" id="lmSongPhones"> <span>Llevo auriculares: la app toca la otra voz mientras canto</span></label>' : ''}
    <div class="controls"><button type="button" class="btn ghost" id="lmSongHear">Escuchar la canción con acompañamiento</button><button type="button" class="btn big" id="lmSongGo">Empezar a cantar</button></div>
    <p class="muted small">${echo ? 'Con apoyo: la app canta cada compás con su acompañamiento y tú lo repites a tempo.' : 'Sin apoyo: un compás de claqueta y cantas toda la canción a capela.'}</p>`;
  // Pintado completo solo al principio y al corregir (marcas); mientras se canta, solo se mueve la marca de la nota
  // que toca sobre el pentagrama ya pintado (repintar a cada nota cortaba el desplazamiento que la mantiene a la vista)
  const draw = current => {
    const staff = host.querySelector('.lm-sing-staff');
    if (current < 0 || !staff.querySelector('[data-i]')) {
      staff.innerHTML = staffHtml(tokens, { clef, meter, marks, under: opts.under, under2: opts.under2 || null, current, dynamics: opts.dynamics || null, pickup, armadura: opts.armadura || 0, form, pulso: opts.pulso || null, chords: opts.acordes || null, ornaments: opts.ornamentos || null, agrupacion: opts.agrupacion || null, agrupaciones: opts.agrupaciones || null });
      if (current < 0) return;
    }
    staff.querySelectorAll('.lm-now').forEach(e => e.classList.remove('lm-now'));
    const on = staff.querySelector(`[data-i="${current}"]`);
    if (on) { on.classList.add('lm-now'); keepInView(on); }
  };
  const phase = (text, note = '') => { host.querySelector('#lmSingPhase').textContent = text; host.querySelector('#lmSingNote').textContent = note; };
  draw(-1);
  // lo que suena de una vuelta: la melodía y el acompañamiento, compás a compás en el orden de la vuelta
  const passEvents = pass => [
    ...pass.notes.map(n => ({ midi: n.midi + up, at: n.start * spb, dur: n.beats * spb * 0.92, gain: 1 })),
    ...accompaniment(tokens, { meter, bpm, key: opts.key, habanera: opts.habanera, bars: pass.bars.map(b => (pickup ? b : b - 1)), pickup, chords: opts.acordes }),
    ...partnerEvents(pass),
  ];
  host.querySelector('#lmSongHear').addEventListener('click', () => {
    stopSound();
    let offset = 0;
    const all = [];
    passes.forEach(pass => { passEvents(pass).forEach(e => all.push({ ...e, at: e.at + offset * spb })); offset += pass.length; });
    playEvents(all);
  });
  host.querySelector('#lmSongGo').focus();
  await new Promise(r => host.querySelector('#lmSongGo').addEventListener('click', r, { once: true }));
  stopSound();
  const withPartner = !!(partner && host.querySelector('#lmSongPhones')?.checked);
  host.querySelector('.controls').remove();
  host.querySelector('#lmSongPhonesBox')?.remove();
  host.querySelector('.muted.small')?.remove();
  if (!(await openMic(host, env))) return null;
  audio.setVoiceInput(true);
  const results = [];
  const counts = Math.max(1, Math.round(barBeats / pulse));
  try {
    const { minor, midi: tonic } = keyTonic(opts.key);
    phase('Escucha la tonalidad');
    playChordNow((minor ? MINOR_TRIAD : MAJOR_TRIAD).map(x => tonic + x), 1.2);
    await wait(1400);
    for (const pass of passes) {
      const words = pass.pass ? opts.under2 || opts.under : opts.under;
      if (pass.pass) { phase(form && ['casillas', 'dc', 'ds'].includes(form.kind) ? passText(form, pass.pass) : 'Ahora, la 2.ª estrofa (la letra de abajo)'); env.say('Segunda vuelta'); await wait(1200); }
      for (const group of groupsOf(pass.notes, echo)) {
        if (!env.alive()) return null;
        // en el eco, cada compás se repite desde su principio; si no, la vuelta entera seguida
        const barStart = echo ? group[0].barAt : 0;
        const notes = group.map(n => ({ midi: n.midi, start: n.start - barStart, beats: n.beats, rest: false, index: n.index }));
        const length = echo ? group[0].barLen : pass.length;
        if (echo) {
          phase('Escucha y repite');
          const b = group[0].bar;
          const r = playEvents([...notes.map(n => ({ midi: n.midi + up, at: n.start * spb, dur: n.beats * spb * 0.92, gain: 1 })),
            ...accompaniment(tokens, { meter, bpm, key: opts.key, habanera: opts.habanera, bars: [b], pickup, chords: opts.acordes }),
            ...partnerEvents(pass, barStart, barStart + length, barStart)]);
          await wait((r.end - now() + 0.2) * 1000);
        }
        // claqueta de un compás y a cantar: los fotogramas del micrófono se guardan con su instante
        phase('Claqueta…');
        const t0 = clicks(counts, bpm / pulse, { accentEvery: counts });
        // la otra voz, a la vez que se canta (solo con auriculares)
        if (withPartner) playEvents(partnerEvents(pass, barStart, barStart + length, barStart), { at: t0 });
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

