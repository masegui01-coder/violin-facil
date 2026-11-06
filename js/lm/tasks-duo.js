// Lectura rítmica en la pantalla del curso: a dos voces (U7 Media: la app toca SIEMPRE la voz 1, el ostinato, y el
// alumno la voz 2, leídas en un sistema compás a compás) o a una voz con sus comas de respiración (U7 Fácil).
// Mientras suena, el compás que toca se resalta y se mantiene a la vista, y el botón de tocar queda fijo abajo.
// Micrófono: solo con auriculares (si no, se toca la pantalla). Aun así, por si el micrófono oye el altavoz, a dos
// voces solo se corrigen las notas propias de la voz 2 (las que no suenan a la vez que el ostinato) y se descartan
// los golpes que caen en una nota del ostinato: el eco de la app no puede dar puntos.
import { esc } from '../ui.js';
import * as audio from '../audio.js';
import { getState } from '../store.js';
import { pctOf, mistakeCodes } from './grade.js';
import { ostinatoTokens } from './gen.js';
import { barBeatsOf, scoreTokens } from './notes.js';
import { onceClick, staffHtml, tokenLabel, withBreaths } from './kit.js';
import { twoVoices } from './tasks-rhythm.js';
import { follow } from './systems.js';
import { playEvents, clicks, stopSound, now, wait } from './sound.js';

const TOLERANCE_MS = { facil: 120, medio: 80 };
const BLEED_MS = 60;          // ventana del eco del ostinato en el micrófono
const OSTINATO_GAIN = 0.45;
const LEGATO = 0.9;
const AFTER_END_S = 0.8;
const EXTRA_WEIGHT = 1.5;

// Notas del alumno marcadas ✓ ≈ ✕ a partir de los golpes (en segundos del reloj de audio)
export function gradeHits(expected, hits, tol) {
  const used = new Set();
  const marks = expected.map(at => {
    let best = -1;
    hits.forEach((x, i) => { if (!used.has(i) && Math.abs(x - at) <= tol * 2 && (best < 0 || Math.abs(x - at) < Math.abs(hits[best] - at))) best = i; });
    if (best < 0) return 'bad';
    used.add(best);
    return Math.abs(hits[best] - at) <= tol ? 'ok' : 'near';
  });
  return { marks, extra: hits.length - used.size };
}

// Corrección de la lectura. Con micrófono y ostinato: solo cuentan las notas propias del alumno y ningún golpe que
// caiga en una nota del ostinato (podría ser el altavoz). Devuelve una marca por nota esperada (null = no se corrige)
export function gradeReading({ expected, hits, tol, mic = false, ostinatoTimes = [] }) {
  const near = (x, list, w) => list.some(t => Math.abs(x - t) <= w);
  if (!mic || !ostinatoTimes.length) return gradeHits(expected, hits, tol);
  const own = expected.map(at => !near(at, ostinatoTimes, tol));
  const heard = hits.filter(x => !near(x, ostinatoTimes, BLEED_MS / 1000));
  const graded = gradeHits(expected.filter((_, i) => own[i]), heard, tol);
  let k = 0;
  return { marks: expected.map((_, i) => (own[i] ? graded.marks[k++] : null)), extra: graded.extra };
}

// Lo que pide cada variante (campo «modo»): cómo suena el metrónomo mientras se lee (todos los pulsos, solo el 1.º o
// nada), si la entrada es un solo clic y si se ven las sílabas de apoyo (ta, ti, sh) en Fácil
export function readingMode(p, variant) {
  const modo = p.modo || '';
  const metro = /solo marca el 1|pie en el primer tiempo/.test(modo) ? 'first' : /ninguna pista|sin cuenta previa/.test(modo) ? 'none' : 'all';
  return { metro, oneClick: /sin cuenta previa/.test(modo), syllables: variant === 'facil' && !!p.vocablos };
}
const SYLLABLE = { q: 'ta', e: 'ti', h: 'taa-a', w: 'taa-a-a-a' };
const PULSE_LEVEL = 0.35;

function scoreHtml(tokens, ostinato, p, env, marks = []) {
  const base = { compas: p.compas, anacrusa: p.anacrusa || 0 };
  if (ostinato) return twoVoices(tokens, ostinato, base, env, marks);
  const under = readingMode(p, env.variant).syllables ? tokens.map(t => (t.rest ? 'sh' : SYLLABLE[String(t.dur).replace('.', '')] || 'ta')) : [];
  return staffHtml(tokens, { meter: p.compas, pickup: p.anacrusa || 0, marks, under, dynamics: p.matices || null, label: tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ') });
}

export async function lecturaDosVoces(host, ex, env) {
  const p = ex.params;
  const tokens = withBreaths(scoreTokens(p.partitura), p.comas || [], p.anacrusa || 0);
  const ostinato = p.voz1 ? ostinatoTokens(tokens, p) : null;
  const barBeats = barBeatsOf(p.compas || '4/4');
  const bpm = p.tempo || 72;
  const spb = 60 / bpm;
  const tol = (TOLERANCE_MS[env.variant] || TOLERANCE_MS.facil) / 1000;
  host.innerHTML = `<p class="muted">${esc(p.modo || 'La app toca la voz 1 y tú la voz 2')}</p>
    ${scoreHtml(tokens, ostinato, p, env)}
    <div class="lm-phones"><label class="lm-check"><input type="checkbox" id="lmDuoPhones"> <span>Llevo auriculares (para dar palmas al micrófono)</span></label>
    <p class="muted small lm-phones-note">Sin auriculares, el micrófono oiría también a la app: toca la pantalla.</p>
    <button type="button" class="btn ghost" id="lmDuoMic" disabled>Palmas (micrófono)</button></div>
    <p class="lm-stop-phase" id="lmDuoPhase" aria-live="polite">Elige cómo vas a tocar</p>
    <div class="controls lm-sticky-controls"><button type="button" class="btn big" id="lmDuoTap">Tocar la pantalla</button></div>`;
  const phones = host.querySelector('#lmDuoPhones');
  phones.addEventListener('change', () => { host.querySelector('#lmDuoMic').disabled = !phones.checked; });
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
    const onTap = e => { e.preventDefault(); hits.push(now() - lat); pad.classList.remove('lm-hit'); void pad.offsetWidth; pad.classList.add('lm-hit'); };
    pad.addEventListener('pointerdown', onTap);
    pad.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') onTap(e); });
    pad.addEventListener('click', e => e.preventDefault());
    pad.focus();
  }
  if (useMic) audio.startOnsetCapture(found => found.forEach(h => hits.push(h.time - (getState().percLatency || 0))));
  // claqueta (un compás, o un solo clic si la variante lo pide); a dos voces el pulso lo marca el ostinato; a una voz,
  // el metrónomo que pide la variante (todos los pulsos, solo el primero de cada compás o ninguno)
  const mode = readingMode(p, env.variant);
  const t0 = clicks(mode.oneClick ? 1 : barBeats, bpm, { accentEvery: barBeats });
  const offset = p.anacrusa ? barBeats - p.anacrusa : 0;
  const at = t => t0 + (offset + t.start) * spb;
  // el instante (reloj de la página) en que empieza la lectura, para las pruebas que tocan a tempo
  host.dataset.readingStart = String(Math.round(performance.now() + (t0 - now() + offset * spb) * 1000));
  if (ostinato) playEvents(ostinato.filter(t => !t.rest).map(t => ({ midi: t.midi, at: (offset + t.start) * spb, dur: t.beats * spb * LEGATO, gain: OSTINATO_GAIN })), { at: t0 });
  const last = tokens[tokens.length - 1];
  const end = t0 + (offset + last.start + last.beats) * spb;
  const beats = Math.round((end - t0) / spb);
  if (!ostinato && mode.metro === 'all') clicks(beats, bpm, { at: t0, accentEvery: barBeats, level: PULSE_LEVEL });
  if (!ostinato && mode.metro === 'first') for (let b = offset; b < beats; b += barBeats) clicks(1, bpm, { at: t0 + b * spb, level: PULSE_LEVEL });
  const unfollow = follow(host, () => (now() - t0) / spb - offset, { barBeats, pickup: p.anacrusa || 0 });
  host.querySelector('#lmDuoPhase').textContent = ostinato ? '¡Ahora! Tu voz es la de abajo' : '¡Ahora!';
  await wait((end - now() + AFTER_END_S) * 1000);
  unfollow();
  if (useMic) audio.stopOnsetCapture();
  stopSound();
  if (pad) pad.disabled = true;
  if (!env.alive()) return null;
  const sounding = tokens.filter(t => !t.rest);
  const { marks, extra } = gradeReading({ expected: sounding.map(at), hits, tol, mic: useMic, ostinatoTimes: ostinato ? ostinato.filter(t => !t.rest).map(at) : [] });
  const graded = marks.filter(Boolean);
  const allMarks = tokens.map(t => (t.rest ? null : marks[sounding.indexOf(t)]));
  const fresh = scoreHtml(tokens, ostinato, p, env, allMarks);
  host.querySelector('.lm-system, .lm-staff').outerHTML = ostinato ? fresh.replace(/^[\s\S]*?(<div class="lm-system")/, '$1') : fresh;
  host.querySelector('#lmDuoPhase').textContent = `${graded.filter(m => m === 'ok').length} de ${graded.length} a tiempo`;
  // los golpes de más pesan más que una nota (golpear todos los pulsos sin leer no aprueba)
  return { pct: pctOf(graded, Math.ceil(extra * EXTRA_WEIGHT)), marks: graded, mistakes: mistakeCodes([extra ? 'q>Rq' : null, graded.includes('bad') ? 'Rq>q' : null]) };
}
