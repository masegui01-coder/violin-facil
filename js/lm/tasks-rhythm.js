// Ritmo en la pantalla del curso: el juego STOP (la app palmea la lectura de la unidad con un error y hay que pararla
// a tiempo) y la lectura rítmica tocando la pantalla (repaso), con la tolerancia del contrato (±120 ms / ±80 ms).
import { esc } from '../ui.js';
import { gradeStop, stopMark, pctOf, mistakeCodes } from './grade.js';
import { stopKinds, stopRoundOf, stopWindow } from './gen.js';
import { barBeatsOf } from './notes.js';
import { staffHtml, onceClick, GLYPH, tokenLabel, continueButton } from './kit.js';
import { playEvents, clicks, stopSound, now, wait } from './sound.js';
import { outputLatency } from '../audio.js';

const TAP_TOLERANCE_MS = { facil: 120, medio: 80 };
const AFTER_END_S = 0.8;
const STOP_NAMES = {
  'q>ee': 'Una negra se partió en dos corcheas', 'ee>q': 'Dos corcheas se juntaron en una negra', 'Rq>q': 'Sonó un silencio donde había una negra',
  'q>Rq': 'Sonó una negra donde había un silencio', 'h-corta': 'Una blanca duró solo un pulso', 'w-corta': 'Una redonda se cortó a la mitad',
  'Rw-salto': 'Se saltó el silencio', compas: 'Un compás tuvo un pulso de más', matiz: 'Un compás sonó con el matiz cambiado',
  calderon: 'No esperó en el calderón', voz: 'Una nota de la voz cambió de altura', anacrusa: 'La anacrusa cayó en la parte fuerte',
};

const PULSE_LEVEL = 0.25;
const LEGATO = 0.92;
const ACCENT = 1.25;
// Lo que suena en una ronda: notas sostenidas (cada figura dura lo que vale; el calderón, el doble) con su volumen,
// el primer pulso de cada compás algo más fuerte, a partir del desplazamiento de la ronda (anacrusa)
function playStopRound(round, { t0, spb, barBeats, pickup }) {
  let extra = 0;
  const events = [];
  round.played.forEach(t => {
    const at = (round.offset + t.start + extra) * spb;
    const downbeat = Math.abs(((t.start - pickup) % barBeats + barBeats) % barBeats) < 1e-6;
    if (!t.rest) events.push({ midi: t.midi || 72, at, dur: (t.beats + (t.hold || 0)) * spb * LEGATO, gain: (t.gain ?? 0.68) * (downbeat ? ACCENT : 1) });
    extra += t.hold || 0;
  });
  const last = round.played[round.played.length - 1];
  const beats = round.offset + (last ? last.start + last.beats : 0) + extra;
  return { end: playEvents(events, { at: t0 }).end, beats };
}

// ---------- STOP ----------
// p: { base (lectura de la unidad: partitura, tempo, compas), errores, rondas, tolerancia }
export async function stopGame(host, p, env) {
  const meter = p.base.compas || '4/4';
  const barBeats = barBeatsOf(meter);
  const tokens = p.base.tokens;
  const bpm = p.base.tempo || 72;
  const spb = 60 / bpm;
  const window = stopWindow(p.tolerancia, barBeats);
  const kinds = stopKinds(p.errores);
  const rounds = [];
  const played = new Set(); // rondas ya jugadas: no se repite la misma
  const total = p.rondas || 3;
  for (let k = 0; k < total; k++) {
    if (!env.alive()) return null;
    const round = stopRoundOf(tokens, { kinds, seed: env.seed + k * 101, barBeats, matices: p.base.matices || [], pickup: p.base.anacrusa || 0, avoid: played });
    played.add(round.key);
    host.innerHTML = `<p class="eyebrow">Ronda ${k + 1} de ${total}</p>
      <p class="muted">La app toca este ritmo sobre el pulso, pero se equivocará en algún momento. ¡Pulsa STOP en cuanto lo notes!</p>
      ${staffHtml(tokens, { meter, label: tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ') })}
      <p class="lm-stop-phase" id="lmStopPhase" aria-live="polite">Preparado</p>
      <div class="controls"><button type="button" class="btn big" id="lmStopGo">Empezar la ronda</button></div>`;
    host.querySelector('#lmStopGo').focus();
    await onceClick(host, '#lmStopGo');
    host.querySelector('.controls').innerHTML = '<button type="button" class="btn big lm-stop-btn" id="lmStop" aria-keyshortcuts="Space">STOP</button>';
    const stopBtn = host.querySelector('#lmStop');
    stopBtn.focus();
    const phase = text => { host.querySelector('#lmStopPhase').textContent = text; };
    phase('Claqueta…');
    const t0 = clicks(barBeats, bpm, { accentEvery: barBeats });
    const { end, beats } = playStopRound(round, { t0, spb, barBeats, pickup: p.base.anacrusa || 0 });
    clicks(Math.ceil(beats), bpm, { at: t0, accentEvery: barBeats, level: PULSE_LEVEL });
    const lat = outputLatency();
    const pressed = await new Promise(resolve => {
      const done = beat => { clearInterval(timer); resolve(beat); };
      const timer = setInterval(() => {
        if (!env.alive()) done(null);
        else if (now() > t0 + 0.05 && host.querySelector('#lmStopPhase').textContent !== 'Escucha…') phase('Escucha…');
        if (now() > end + AFTER_END_S) done(null);
      }, 50);
      stopBtn.addEventListener('click', () => done((now() - lat - t0) / spb), { once: true });
    });
    stopSound();
    if (!env.alive()) return null;
    // pulsar durante la claqueta (pulso negativo) también es parar antes de tiempo
    const r = { errorBeat: round.errorBeat, pressBeat: pressed, code: round.code };
    rounds.push(r);
    const mark = stopMark(r.errorBeat, r.pressBeat, window);
    const where = ((tokens[round.index] || {}).bar ?? Math.floor(round.errorBeat / barBeats)) + 1;
    const msg = mark === 'ok' ? '¡Parada a tiempo!' : r.pressBeat === null ? 'No has parado la música' : r.pressBeat < r.errorBeat ? 'Has parado antes del error' : 'Has parado tarde';
    host.querySelector('.controls').innerHTML = '';
    host.querySelector('#lmStopPhase').innerHTML = `<span class="dict-sw ${mark}" aria-hidden="true">${GLYPH[mark]}</span> <span>${esc(msg)}</span>`;
    host.querySelector('#lmStopPhase').insertAdjacentHTML('afterend', `<p class="muted center"><span>${esc(STOP_NAMES[round.code] || 'Cambió una figura')}</span> · <span>compás ${where}</span></p>`);
    env.say(msg);
    await continueButton(host, k + 1 < total ? 'Siguiente ronda' : 'Ver el resultado');
  }
  const g = gradeStop(rounds, { window });
  const missed = rounds.filter((r, i) => g.marks[i] !== 'ok').map(r => r.code);
  return { pct: g.pct, marks: g.marks, mistakes: mistakeCodes([...missed, ...g.mistakes]) };
}

// ---------- Lectura rítmica tocando la pantalla ----------
// p: { tokens, meter, bpm }. Se toca en el botón grande (o con la barra espaciadora) al ritmo de la partitura.
export async function tapRhythm(host, p, env) {
  const barBeats = barBeatsOf(p.meter);
  const spb = 60 / p.bpm;
  const tol = (TAP_TOLERANCE_MS[env.variant] || TAP_TOLERANCE_MS.facil) / 1000;
  host.innerHTML = `<p class="muted">Toca el botón con el ritmo de la partitura (o pulsa la barra espaciadora). Primero suena un compás de claqueta.</p>
    ${staffHtml(p.tokens, { meter: p.meter, label: p.tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ') })}
    <p class="lm-stop-phase" id="lmTapPhase" aria-live="polite">Preparado</p>
    <div class="controls"><button type="button" class="btn big" id="lmTapGo">Empezar</button></div>`;
  host.querySelector('#lmTapGo').focus();
  await onceClick(host, '#lmTapGo');
  host.querySelector('.controls').innerHTML = '<button type="button" class="btn big lm-tap" id="lmTap">Toca aquí</button>';
  const pad = host.querySelector('#lmTap');
  pad.focus();
  const taps = [];
  const lat = outputLatency();
  const onTap = e => { e.preventDefault(); taps.push(now() - lat); pad.classList.remove('lm-hit'); void pad.offsetWidth; pad.classList.add('lm-hit'); };
  pad.addEventListener('pointerdown', onTap);
  pad.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') onTap(e); });
  pad.addEventListener('click', e => e.preventDefault());
  const t0 = clicks(barBeats, p.bpm, { accentEvery: barBeats });
  const last = p.tokens[p.tokens.length - 1];
  const end = t0 + (last.start + last.beats) * spb;
  // metrónomo suave en cada pulso mientras se toca (Fácil)
  if (env.variant === 'facil') clicks(Math.round((end - t0) / spb), p.bpm, { at: t0, accentEvery: barBeats });
  host.querySelector('#lmTapPhase').textContent = '¡Ahora!';
  await wait((end - now() + AFTER_END_S) * 1000);
  pad.disabled = true;
  if (!env.alive()) return null;
  const expected = p.tokens.filter(t => !t.rest).map(t => t0 + t.start * spb);
  const used = new Set();
  const marks = expected.map(at => {
    let best = -1;
    taps.forEach((x, i) => { if (!used.has(i) && Math.abs(x - at) <= tol * 2 && (best < 0 || Math.abs(x - at) < Math.abs(taps[best] - at))) best = i; });
    if (best < 0) return 'bad';
    used.add(best);
    return Math.abs(taps[best] - at) <= tol ? 'ok' : 'near';
  });
  const extra = taps.length - used.size;
  const pct = pctOf(marks, extra);
  const sounding = p.tokens.filter(t => !t.rest);
  const allMarks = p.tokens.map(t => (t.rest ? null : marks[sounding.indexOf(t)]));
  host.querySelector('.lm-staff').outerHTML = staffHtml(p.tokens, { meter: p.meter, marks: allMarks });
  host.querySelector('#lmTapPhase').textContent = `${marks.filter(m => m === 'ok').length} de ${marks.length} a tiempo`;
  const avg = taps.length ? taps.reduce((s, x, i) => s + (x - (expected[i] ?? x)), 0) / taps.length : 0;
  return { pct, marks, mistakes: mistakeCodes([extra ? 'q>Rq' : null, marks.includes('bad') ? 'Rq>q' : null, avg > tol ? 'tempo-' : avg < -tol ? 'tempo+' : null]) };
}
