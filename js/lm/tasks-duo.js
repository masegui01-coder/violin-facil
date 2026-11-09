// Lectura rítmica en la pantalla del curso: a una voz (con sus sílabas de apoyo, comas, matices, calderón, barra de
// repetición, casillas de 1.ª y 2.ª vez y D.C. al Fine) o a dos voces (la app toca SIEMPRE la voz 1, el ostinato, y el
// alumno la voz 2, leídas en un sistema compás a compás; la voz 1 puede ir en clave de fa). Mientras suena, el compás que
// toca se resalta y se mantiene a la vista, y el botón de tocar queda fijo abajo. Micrófono: solo con auriculares (si no,
// se toca la pantalla). En 6/8 el pulso es la negra con puntillo (pulso: 'q.'): el metrónomo marca ese pulso y, si pide
// subdivisión, las corcheas más suaves. La corrección (sin DOM) está en reading-grade.js: retraso del alumno compensado,
// silencios y ligaduras corregidos y golpes de más penalizados. El plan (línea de tiempo, metrónomo) está en rhythm-plan.js.
import { esc } from '../ui.js';
import * as audio from '../audio.js';
import { getState } from '../store.js';
import { mistakeCodes } from './grade.js';
import { gradeReading as gradeAll } from './reading-grade.js';
import { dynamicsChecks } from './dynamics.js';
import { accentContrast } from '../onsets.js';
import { ostinatoTokens } from './gen.js';
import { barBeatsOf, beamBeatsOf, scoreTokens } from './notes.js';
import { onceClick, staffHtml, tokenLabel, withBreaths, CLEF } from './kit.js';
import { twoVoices } from './tasks-rhythm.js';
import { follow } from './systems.js';
import { formOf, passText } from './form.js';
import { readingTimeline, metronomeBeats, syllablesOf, toleranceMs, pulseOf } from './rhythm-plan.js';
import { playEvents, clicks, stopSound, now, wait } from './sound.js';

export { readingTimeline };
const OSTINATO_GAIN = 0.45;
const LEGATO = 0.9;
const AFTER_END_S = 0.8;
const PULSE_LEVEL = 0.35;
const DOWNBEAT_BOOST = 1.4;
const SUB_LEVEL = 0.16;        // las corcheas de la subdivisión (6/8), más suaves que el pulso
const MEASURE_WEIGHT = 0.15;   // matices o acento, cuando la variante los pide y se toca con palmas al micrófono
const ACCENT_GOAL = 1.3;       // el 1.er tiempo, al menos un 30 % más fuerte que los demás

// Compatibilidad (pruebas de dos voces): instantes sueltos en segundos → corrección completa
export function gradeReading({ expected, hits, tol, mic = false, ostinatoTimes = [], rests = [], tempo = false }) {
  return gradeAll({ notes: expected.map(at => ({ at, dur: 'q' })), rests, hits, tol, mic, ostinatoTimes, tempo });
}

// Lo que pide cada variante, escrito en los datos (campo «lectura»): metrónomo (todos los pulsos, solo el 1.º o
// ninguno), compases sin metrónomo, entrada (un compás de claqueta o un solo clic un pulso antes), subdivisión (las
// corcheas, suaves) y qué se mide además de los ataques (matices o acento, solo con el micrófono). Sílabas de apoyo en Fácil si hay vocablos
export function readingMode(p, variant) {
  const l = p.lectura || {};
  return { metro: l.metro || 'all', mute: l.mudo || [], click: l.entrada === 'clic', measure: l.medir || null, syllables: variant === 'facil' && !!p.vocablos, subdivision: !!l.subdivision };
}

function scoreHtml(tokens, ostinato, p, env, marks = []) {
  const base = { compas: p.compas, anacrusa: p.anacrusa || 0, voz1Clave: p.voz1Clave, pulso: p.pulso, armadura: p.armadura || 0 };
  if (ostinato) return twoVoices(tokens, ostinato, base, env, marks);
  const pulse = pulseOf(p);
  const under = readingMode(p, env.variant).syllables ? syllablesOf(tokens, { pulse: beamBeatsOf(p.compas, p.pulso), pickup: p.anacrusa || 0 }) : [];
  return staffHtml(tokens, {
    clef: CLEF[p.clave] || 'treble', meter: p.compas, pickup: p.anacrusa || 0, marks, under, dynamics: p.matices || null,
    armadura: p.armadura || 0, form: formOf(p), pulso: p.pulso || null,
    label: tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', '),
  });
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
  const pulse = pulseOf(p);
  const bpm = p.tempo || 72;
  const spb = 60 / bpm;
  const tol = toleranceMs(env.variant, tokens, bpm) / 1000;
  const mode = readingMode(p, env.variant);
  const tl = readingTimeline(p, tokens);
  const form = formOf(p);
  host.innerHTML = `<p class="muted">${esc(p.modo || 'La app toca la voz 1 y tú la voz 2')}</p>${p.consigna ? `<p>${esc(p.consigna)}</p>` : ''}
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
  // entrada: un compás de claqueta (un clic por pulso: en 6/8, dos), o (sin cuenta previa) un solo clic justo un pulso antes de la primera nota
  const pickup = p.anacrusa || 0;
  const counts = Math.max(1, Math.round(barBeats / pulse));
  const t0 = mode.click ? clicks(1, bpm / pulse, { accentEvery: 1 }) : clicks(counts, bpm / pulse, { accentEvery: counts });
  const offset = mode.click ? 0 : pickup ? barBeats - pickup : 0;
  const at = e => t0 + (offset + e.beat) * spb;
  host.dataset.readingStart = String(Math.round(performance.now() + (t0 - now() + offset * spb) * 1000));
  if (ostinato) playEvents(ostinato.filter(t => !t.rest).map(t => ({ midi: t.midi, at: (offset + t.start) * spb, dur: t.beats * spb * LEGATO, gain: OSTINATO_GAIN })), { at: t0 });
  // metrónomo de la variante en la primera vuelta (la de la repetición va sin él), salvo en los compases mudos;
  // el 1.er tiempo de cada compás cuenta desde la anacrusa
  if (!ostinato) {
    const firstLen = tl.passStarts[1] ?? tl.total;
    metronomeBeats({ length: firstLen, barBeats, pickup, pulse, metro: mode.metro, mute: mode.mute, subdivision: mode.subdivision }).forEach(c => {
      clicks(1, bpm, { at: t0 + (offset + c.beat) * spb, level: c.level === 'down' ? PULSE_LEVEL * DOWNBEAT_BOOST : c.level === 'sub' ? SUB_LEVEL : PULSE_LEVEL });
    });
  }
  const end = t0 + (offset + tl.total) * spb;
  const unfollow = follow(host, () => tl.scoreBeat((now() - t0) / spb - offset), { barBeats, pickup });
  host.querySelector('#lmDuoPhase').textContent = ostinato ? '¡Ahora! Tu voz es la de abajo' : '¡Ahora!';
  // calderón: la mano de la app indica que se mantiene y baja cuando se sigue; repetición: aviso de la 2.ª vuelta
  const held = tl.events.find(e => e.hold);
  if (held) {
    phaseAt(host, env, at(held) + (held.beats - held.hold) * spb, '✋ Calderón: mantén… hasta que la mano baje', true);
    phaseAt(host, env, at(held) + held.beats * spb, '👇 ¡Sigue!', true);
  }
  for (let k = 1; k < tl.passes; k++) phaseAt(host, env, t0 + (offset + tl.passStarts[k]) * spb, passText(form, k));
  await wait((end - now() + AFTER_END_S) * 1000);
  unfollow();
  if (useMic) audio.stopOnsetCapture();
  stopSound();
  if (pad) pad.disabled = true;
  if (!env.alive()) return null;
  // una nota ligada es un solo ataque: su continuación es como un silencio (una palmada ahí es error «liga»)
  const notes = tl.events.filter(e => !e.rest && !e.cont);
  const rests = tl.events.filter(e => e.rest || e.cont).map(e => ({ from: at(e), to: at(e) + e.beats * spb, dur: e.dur, ...(e.cont ? { code: 'liga' } : {}) }));
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
  const firstMarks = tokens.map((t, i) => { if (t.rest || t.tiedFrom) return null; const k = notes.findIndex(e => e.pass === 0 && e.index === i); return g.marks[k] ?? null; });
  const fresh = scoreHtml(tokens, ostinato, p, env, firstMarks);
  host.querySelector('.lm-system, .lm-staff').outerHTML = ostinato ? fresh.replace(/^[\s\S]*?(<div class="lm-system")/, '$1') : fresh;
  const graded = g.marks.filter(Boolean);
  host.querySelector('#lmDuoPhase').textContent = `${graded.filter(m => m === 'ok').length} de ${graded.length} a tiempo`;
  return { pct, marks: graded, mistakes: mistakeCodes(g.mistakes), ...(note ? { note } : {}) };
}
