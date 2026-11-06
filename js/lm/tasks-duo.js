// Lectura rítmica a dos voces (U7): la app toca SIEMPRE la voz 1 (el ostinato) y el alumno palmea o toca la voz 2,
// leyendo las dos en un sistema compás a compás. Con micrófono, un golpe que coincide con una nota del ostinato y con
// ninguna del alumno es el altavoz de la app (no cuenta); con auriculares o tocando la pantalla no hay ese problema.
import { esc } from '../ui.js';
import * as audio from '../audio.js';
import { getState } from '../store.js';
import { pctOf, mistakeCodes } from './grade.js';
import { ostinatoTokens } from './gen.js';
import { barBeatsOf, scoreTokens } from './notes.js';
import { onceClick } from './kit.js';
import { twoVoices } from './tasks-rhythm.js';
import { playEvents, clicks, stopSound, now, wait } from './sound.js';

const TOLERANCE_MS = { facil: 120, medio: 80 };
const BLEED_MS = 60;          // ventana del eco del ostinato en el micrófono
const OSTINATO_GAIN = 0.45;
const LEGATO = 0.9;
const PULSE_LEVEL = 0.25;
const AFTER_END_S = 0.8;

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

// Golpes del micrófono que son el eco del ostinato: coinciden con una nota de la app y con ninguna del alumno
export function withoutBleed(hits, ostinatoTimes, expected, tol) {
  const near = (x, list, w) => list.some(t => Math.abs(x - t) <= w);
  return hits.filter(x => !(near(x, ostinatoTimes, BLEED_MS / 1000) && !near(x, expected, tol * 2)));
}

export async function lecturaDosVoces(host, ex, env) {
  const p = ex.params;
  const tokens = scoreTokens(p.partitura);
  const ostinato = ostinatoTokens(tokens, p);
  const barBeats = barBeatsOf(p.compas || '4/4');
  const bpm = p.tempo || 72;
  const spb = 60 / bpm;
  const tol = (TOLERANCE_MS[env.variant] || TOLERANCE_MS.facil) / 1000;
  const base = { compas: p.compas, anacrusa: p.anacrusa || 0 };
  host.innerHTML = `<p class="muted">${esc(p.modo || 'La app toca la voz 1 y tú la voz 2')}</p>
    ${twoVoices(tokens, ostinato, base, env)}
    <p class="muted small">Con el micrófono, mejor con auriculares: así la app no se oye a sí misma. Sin auriculares, los golpes que solo coinciden con el ostinato no cuentan.</p>
    <p class="lm-stop-phase" id="lmDuoPhase" aria-live="polite">Elige cómo vas a tocar</p>
    <div class="controls"><button type="button" class="btn big" id="lmDuoMic">Palmas (micrófono)</button><button type="button" class="btn ghost" id="lmDuoTap">Tocar la pantalla</button></div>`;
  host.querySelector('#lmDuoMic').focus();
  const chosen = await onceClick(host, '#lmDuoMic, #lmDuoTap');
  let useMic = chosen.id === 'lmDuoMic';
  if (useMic) {
    try { await audio.startMic(); } catch (err) {
      useMic = false;
      host.querySelector('#lmDuoPhase').textContent = 'Sin micrófono: tocarás la pantalla.';
      env.say(audio.micErrorText(err));
    }
  }
  if (!env.alive()) return null;
  const hits = [];
  const lat = audio.outputLatency();
  host.querySelector('.controls').innerHTML = useMic ? '' : '<button type="button" class="btn big lm-tap" id="lmTap">Toca aquí</button>';
  const pad = host.querySelector('#lmTap');
  if (pad) {
    const onTap = e => { e.preventDefault(); hits.push(now() - lat); pad.classList.remove('lm-hit'); void pad.offsetWidth; pad.classList.add('lm-hit'); };
    pad.addEventListener('pointerdown', onTap);
    pad.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') onTap(e); });
    pad.addEventListener('click', e => e.preventDefault());
    pad.focus();
  }
  if (useMic) audio.startOnsetCapture(found => found.forEach(h => hits.push(h.time - (getState().percLatency || 0))));
  const t0 = clicks(barBeats, bpm, { accentEvery: barBeats });
  const offset = p.anacrusa ? barBeats - p.anacrusa : 0;
  const at = t => t0 + (offset + t.start) * spb;
  playEvents(ostinato.filter(t => !t.rest).map(t => ({ midi: t.midi, at: (offset + t.start) * spb, dur: t.beats * spb * LEGATO, gain: OSTINATO_GAIN })), { at: t0 });
  const last = tokens[tokens.length - 1];
  const end = t0 + (offset + last.start + last.beats) * spb;
  clicks(Math.round((end - t0) / spb), bpm, { at: t0, accentEvery: barBeats, level: PULSE_LEVEL });
  host.querySelector('#lmDuoPhase').textContent = '¡Ahora! Tu voz es la de abajo';
  await wait((end - now() + AFTER_END_S) * 1000);
  if (useMic) audio.stopOnsetCapture();
  stopSound();
  if (pad) pad.disabled = true;
  if (!env.alive()) return null;
  const sounding = tokens.filter(t => !t.rest);
  const expected = sounding.map(at);
  const heard = useMic ? withoutBleed(hits, ostinato.filter(t => !t.rest).map(at), expected, tol) : hits;
  const { marks, extra } = gradeHits(expected, heard, tol);
  const allMarks = tokens.map(t => (t.rest ? null : marks[sounding.indexOf(t)]));
  host.querySelector('.lm-system').outerHTML = twoVoices(tokens, ostinato, base, env, allMarks).replace(/^[\s\S]*?(<div class="lm-system")/, '$1');
  host.querySelector('#lmDuoPhase').textContent = `${marks.filter(m => m === 'ok').length} de ${marks.length} a tiempo`;
  return { pct: pctOf(marks, extra), marks, mistakes: mistakeCodes([extra ? 'q>Rq' : null, marks.includes('bad') ? 'Rq>q' : null]) };
}
