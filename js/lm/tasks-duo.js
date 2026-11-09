// Lectura rítmica en la pantalla del curso: a una voz (con sus sílabas de apoyo, comas, matices, calderón y barra de
// repetición) o a dos voces (U7 Media: la app toca SIEMPRE la voz 1, el ostinato, y el alumno la voz 2, leídas en un
// sistema compás a compás). Mientras suena, el compás que toca se resalta y se mantiene a la vista, y el botón de
// tocar queda fijo abajo. Micrófono: solo con auriculares (si no, se toca la pantalla). La corrección (sin DOM) está
// en reading-grade.js: retraso del alumno compensado, silencios corregidos y golpes de más penalizados.
import { esc } from '../ui.js';
import * as audio from '../audio.js';
import { getState } from '../store.js';
import { mistakeCodes } from './grade.js';
import { gradeReading as gradeAll } from './reading-grade.js';
import { dynamicsChecks } from './dynamics.js';
import { accentContrast } from '../onsets.js';
import { ostinatoTokens } from './gen.js';
import { barBeatsOf, scoreTokens } from './notes.js';
import { onceClick, staffHtml, tokenLabel, withBreaths } from './kit.js';
import { twoVoices } from './tasks-rhythm.js';
import { follow } from './systems.js';
import { playEvents, clicks, stopSound, now, wait } from './sound.js';

const TOLERANCE_MS = { facil: 120, medio: 80 };
const OSTINATO_GAIN = 0.45;
const LEGATO = 0.9;
const AFTER_END_S = 0.8;
const PULSE_LEVEL = 0.35;
const DOWNBEAT_BOOST = 1.4;
const MEASURE_WEIGHT = 0.15;   // matices o acento, cuando la variante los pide y se toca con palmas al micrófono
const ACCENT_GOAL = 1.3;       // el 1.er tiempo, al menos un 30 % más fuerte que los demás
const SYLLABLE = { q: 'ta', e: 'ti', h: 'taa-a', w: 'taa-a-a-a' };

// Compatibilidad (pruebas de dos voces): instantes sueltos en segundos → corrección completa
export function gradeReading({ expected, hits, tol, mic = false, ostinatoTimes = [], rests = [], tempo = false }) {
  return gradeAll({ notes: expected.map(at => ({ at, dur: 'q' })), rests, hits, tol, mic, ostinatoTimes, tempo });
}

// Lo que pide cada variante, escrito en los datos (campo «lectura»): metrónomo (todos los pulsos, solo el 1.º o
// ninguno), compases sin metrónomo, entrada (un compás de claqueta o un solo clic un pulso antes) y qué se mide
// además de los ataques (matices o acento, solo con el micrófono). Sílabas de apoyo en Fácil si hay vocablos
export function readingMode(p, variant) {
  const l = p.lectura || {};
  return { metro: l.metro || 'all', mute: l.mudo || [], click: l.entrada === 'clic', measure: l.medir || null, syllables: variant === 'facil' && !!p.vocablos };
}

// La lectura en el tiempo: cada figura con su pulso de comienzo, con las dos vueltas si hay barra de repetición y la
// espera del calderón (la nota dura el doble)
export function readingTimeline(p, tokens) {
  const pickup = p.anacrusa || 0;
  const passes = p.repeticion ? 2 : 1;
  const fermata = (p.matices || []).find(m => m.signo === 'calderon');
  const barOf = t => t.bar + (pickup ? 0 : 1);
  const span = tokens.reduce((m, t) => Math.max(m, t.start + t.beats), 0);
  const events = [];
  let shift = 0;
  for (let pass = 0; pass < passes; pass++) {
    tokens.forEach((t, i) => {
      const lastOfBar = !tokens[i + 1] || barOf(tokens[i + 1]) !== barOf(t);
      const hold = fermata && barOf(t) === fermata.compas && lastOfBar && !t.rest ? t.beats : 0;
      events.push({ ...t, pass, beat: pass * span + t.start + shift, beats: t.beats + hold, hold });
      shift += hold;
    });
  }
  return { events, total: passes * span + shift, span, passes };
}

function scoreHtml(tokens, ostinato, p, env, marks = []) {
  const base = { compas: p.compas, anacrusa: p.anacrusa || 0 };
  if (ostinato) return twoVoices(tokens, ostinato, base, env, marks);
  const under = readingMode(p, env.variant).syllables ? tokens.map(t => (t.rest ? 'sh' : SYLLABLE[String(t.dur).replace('.', '')] || 'ta')) : [];
  return staffHtml(tokens, { meter: p.compas, pickup: p.anacrusa || 0, marks, under, dynamics: p.matices || null, repeat: !!p.repeticion, label: tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ') });
}

// Matices o acento con la fuerza de cada palmada (micrófono): parte de 0 a 1 (null si no se puede medir)
export function measuredPart(kind, p, notes, strengths, barBeats) {
  if (kind === 'matices') {
    const d = dynamicsChecks(p.matices || [], notes, strengths);
    return d && d.total ? d.ok / d.total : null;
  }
  const pickup = p.anacrusa || 0;
  const accents = notes.map(n => Math.abs((((n.start - pickup) % barBeats) + barBeats) % barBeats) < 1e-6);
  const c = accentContrast(strengths.map(s => ({ strength: s || 0 })), accents);
  return c === null ? null : Math.max(0, Math.min(1, (c - 1) / (ACCENT_GOAL - 1)));
}

// hand: la mano del calderón, grande, para mirarla sin leer
function phaseAt(host, env, when, text, hand = false) {
  setTimeout(() => {
    if (!env.alive()) return;
    const el = host.querySelector('#lmDuoPhase');
    el.textContent = text;
    el.classList.toggle('lm-hand', hand);
  }, Math.max(0, (when - now()) * 1000));
}

export async function lecturaDosVoces(host, ex, env) {
  const p = ex.params;
  const tokens = withBreaths(scoreTokens(p.partitura), p.comas || [], p.anacrusa || 0);
  const ostinato = p.voz1 ? ostinatoTokens(tokens, p) : null;
  const barBeats = barBeatsOf(p.compas || '4/4');
  const bpm = p.tempo || 72;
  const spb = 60 / bpm;
  const tol = (TOLERANCE_MS[env.variant] || TOLERANCE_MS.facil) / 1000;
  const mode = readingMode(p, env.variant);
  const tl = readingTimeline(p, tokens);
  host.innerHTML = `<p class="muted">${esc(p.modo || 'La app toca la voz 1 y tú la voz 2')}</p>
    ${scoreHtml(tokens, ostinato, p, env)}
    <div class="lm-phones" id="lmPhones"><label class="lm-check"><input type="checkbox" id="lmDuoPhones"> <span>Llevo auriculares (para dar palmas al micrófono)</span></label>
    <p class="muted small lm-phones-note">Sin auriculares, el micrófono oiría también a la app: toca la pantalla.${mode.measure ? ' <span>Los matices y el acento solo se miden con palmas al micrófono.</span>' : ''}</p>
    <button type="button" class="btn ghost" id="lmDuoMic" disabled>Palmas (micrófono)</button></div>
    <p class="lm-stop-phase" id="lmDuoPhase" aria-live="polite">Elige cómo vas a tocar</p>
    <div class="controls lm-sticky-controls"><button type="button" class="btn big" id="lmDuoTap">Tocar la pantalla</button><a class="lm-mic-link" href="#lmPhones">o con palmas al micrófono</a></div>`;
  const phones = host.querySelector('#lmDuoPhones');
  phones.addEventListener('change', () => { host.querySelector('#lmDuoMic').disabled = !phones.checked; });
  host.querySelector('.lm-mic-link').addEventListener('click', e => { e.preventDefault(); host.querySelector('#lmPhones').scrollIntoView({ block: 'center' }); phones.focus(); });
  host.querySelector('#lmDuoTap').focus();
  const chosen = await onceClick(host, '#lmDuoMic, #lmDuoTap');
  let useMic = chosen.id === 'lmDuoMic' && phones.checked;
  if (useMic) {
    try { await audio.startMic(); } catch (err) {
      useMic = false;
      host.querySelector('#lmDuoPhase').textContent = 'Sin micrófono: tocarás la pantalla.';
      env.say(audio.micErrorText(err));
    }
  }
  if (!env.alive()) return null;
  host.querySelector('.lm-phones')?.remove();
  const hits = [];
  const lat = audio.outputLatency();
  host.querySelector('.controls').innerHTML = useMic ? '<p class="muted center">Da palmas: la app te escucha</p>' : '<button type="button" class="btn big lm-tap" id="lmTap">Toca aquí</button>';
  const pad = host.querySelector('#lmTap');
  if (pad) {
    const onTap = e => { e.preventDefault(); hits.push({ time: now() - lat, strength: null }); pad.classList.remove('lm-hit'); void pad.offsetWidth; pad.classList.add('lm-hit'); };
    pad.addEventListener('pointerdown', onTap);
    pad.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') onTap(e); });
    pad.addEventListener('click', e => e.preventDefault());
    pad.focus();
  }
  if (useMic) audio.startOnsetCapture(found => found.forEach(h => hits.push({ time: h.time - (getState().percLatency || 0), strength: h.strength || null })));
  // entrada: un compás de claqueta, o (sin cuenta previa) un solo clic justo un pulso antes de la primera nota
  const pickup = p.anacrusa || 0;
  const t0 = clicks(mode.click ? 1 : barBeats, bpm, { accentEvery: barBeats });
  const offset = mode.click ? 0 : pickup ? barBeats - pickup : 0;
  const at = e => t0 + (offset + e.beat) * spb;
  host.dataset.readingStart = String(Math.round(performance.now() + (t0 - now() + offset * spb) * 1000));
  if (ostinato) playEvents(ostinato.filter(t => !t.rest).map(t => ({ midi: t.midi, at: (offset + t.start) * spb, dur: t.beats * spb * LEGATO, gain: OSTINATO_GAIN })), { at: t0 });
  // metrónomo de la variante en la primera vuelta (la de la repetición va sin él), salvo en los compases mudos;
  // el 1.er tiempo de cada compás cuenta desde la anacrusa
  if (!ostinato && mode.metro !== 'none') {
    for (let b = 0; b < tl.span; b++) {
      const bar = pickup ? (b < pickup ? 0 : 1 + Math.floor((b - pickup) / barBeats)) : 1 + Math.floor(b / barBeats);
      const downbeat = (((b - pickup) % barBeats) + barBeats) % barBeats === 0;
      if (mode.mute.includes(bar) || (mode.metro === 'first' && !downbeat)) continue;
      clicks(1, bpm, { at: t0 + (offset + b) * spb, level: downbeat ? PULSE_LEVEL * DOWNBEAT_BOOST : PULSE_LEVEL });
    }
  }
  const end = t0 + (offset + tl.total) * spb;
  const loop = tl.passes > 1 ? tl.total / tl.passes : Infinity;
  const unfollow = follow(host, () => ((now() - t0) / spb - offset) % loop, { barBeats, pickup });
  host.querySelector('#lmDuoPhase').textContent = ostinato ? '¡Ahora! Tu voz es la de abajo' : '¡Ahora!';
  // calderón: la mano de la app indica que se mantiene y baja cuando se sigue; repetición: aviso de la 2.ª vuelta
  const held = tl.events.find(e => e.hold);
  if (held) {
    phaseAt(host, env, at(held) + (held.beats - held.hold) * spb, '✋ Calderón: mantén… hasta que la mano baje', true);
    phaseAt(host, env, at(held) + held.beats * spb, '👇 ¡Sigue!', true);
  }
  if (tl.passes > 1) phaseAt(host, env, t0 + (offset + tl.total / 2) * spb, '2.ª vuelta, sin metrónomo');
  await wait((end - now() + AFTER_END_S) * 1000);
  unfollow();
  if (useMic) audio.stopOnsetCapture();
  stopSound();
  if (pad) pad.disabled = true;
  if (!env.alive()) return null;
  const notes = tl.events.filter(e => !e.rest);
  const rests = tl.events.filter(e => e.rest).map(e => ({ from: at(e), to: at(e) + e.beats * spb, dur: e.dur }));
  const g = gradeAll({
    notes: notes.map(e => ({ at: at(e), dur: e.dur })), rests, hits: hits.map(h => h.time), tol, mic: useMic,
    ostinatoTimes: ostinato ? ostinato.filter(t => !t.rest).map(t => t0 + (offset + t.start) * spb) : [], tempo: mode.metro === 'none' && !ostinato,
  });
  let pct = g.pct;
  let note = null;
  if (mode.measure) {
    const first = notes.filter(e => e.pass === 0);
    const strengths = first.map(e => { const h = hits.find(x => Math.abs(x.time - at(e)) <= tol * 2); return h ? h.strength : null; });
    const part = useMic ? measuredPart(mode.measure, p, first, strengths, barBeats) : null;
    if (part !== null) pct = Math.round(pct * (1 - MEASURE_WEIGHT) + 100 * MEASURE_WEIGHT * part);
    else note = mode.measure === 'matices' ? 'Los matices se miden solo con palmas al micrófono (con auriculares).' : 'El acento del 1.er tiempo se mide solo con palmas al micrófono (con auriculares).';
  }
  // marcas en la partitura: las de la primera vuelta (la segunda se corrige igual)
  const firstMarks = tokens.map(t => { if (t.rest) return null; const k = notes.findIndex(e => e.pass === 0 && e.start === t.start); return g.marks[k] ?? null; });
  const fresh = scoreHtml(tokens, ostinato, p, env, firstMarks);
  host.querySelector('.lm-system, .lm-staff').outerHTML = ostinato ? fresh.replace(/^[\s\S]*?(<div class="lm-system")/, '$1') : fresh;
  const graded = g.marks.filter(Boolean);
  host.querySelector('#lmDuoPhase').textContent = `${graded.filter(m => m === 'ok').length} de ${graded.length} a tiempo`;
  return { pct, marks: graded, mistakes: mistakeCodes(g.mistakes), ...(note ? { note } : {}) };
}
