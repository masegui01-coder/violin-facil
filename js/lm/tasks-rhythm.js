// Ritmo en la pantalla del curso: el juego STOP (la app palmea la lectura de la unidad con un error y hay que pararla
// a tiempo) y la lectura rítmica tocando la pantalla (repaso), con la tolerancia del contrato (±120 ms / ±80 ms).
import { esc } from '../ui.js';
import { gradeStop, stopMark, pctOf, mistakeCodes } from './grade.js';
import { stopKinds, stopRoundOf, stopWindow, ostinatoTokens } from './gen.js';
import { barBeatsOf, pulseOfParams } from './notes.js';
import { staffHtml, systemHtml, onceClick, GLYPH, tokenLabel, continueButton, CLEF } from './kit.js';
import { formOf, expandForm } from './form.js';
import { playEvents, clicks, stopSound, now, wait } from './sound.js';
import { outputLatency } from '../audio.js';
import { follow } from './systems.js';
import { toleranceMs } from './rhythm-plan.js';

const TAP_TOLERANCE_MS = { facil: 120, medio: 80 };
const AFTER_END_S = 0.8;
const STOP_NAMES = {
  'q>ee': 'Una negra se partió en dos corcheas', 'ee>q': 'Dos corcheas se juntaron en una negra', 'Rq>q': 'Sonó un silencio donde había una negra',
  'q>Rq': 'Sonó una negra donde había un silencio', 'h-corta': 'Una blanca duró solo un pulso', 'w-corta': 'Una redonda se cortó a la mitad',
  'Rw-salto': 'Se saltó el silencio', compas: 'Un compás tuvo un pulso de más', matiz: 'Un compás sonó con el matiz cambiado',
  calderon: 'No esperó en el calderón', voz: 'Una nota del ostinato (voz 1) cambió de altura', anacrusa: 'La anacrusa cayó en la parte fuerte',
  'q.e>qq': 'Una negra con puntillo y su corchea sonaron como dos negras', 'h.>h': 'Una blanca con puntillo duró solo dos pulsos',
  'ssss>ee': 'Cuatro semicorcheas sonaron como dos corcheas', 'ess>sse': 'Un grupo de corchea y dos semicorcheas cambió de orden',
  'e.s>ee': 'Un saltillo sonó como dos corcheas iguales', '6/8>3/4': 'El 6/8 sonó como un 3/4 (tres negras en lugar de dos con puntillo)',
  'R>e': 'Sonó un silencio de corchea o de negra con puntillo', casilla: 'En la 2.ª vuelta no saltó la casilla 1',
  dc: 'No volvió al principio (D.C.) o no paró en el Fine', alteracion: 'Una nota sonó sin la alteración de la armadura', nota: 'Una nota sonó un escalón más arriba o más abajo',
};

// Lo que se lee en el STOP: la lectura con sus matices, calderón y anacrusa; si el error es de voz, encima va el
// ostinato que toca la app (voz 1), con su propio ritmo repetido, y debajo la voz del alumno (voz 2)
function stopScore(tokens, ostinato, base, env) {
  const meter = base.compas || '4/4';
  const opts = { meter, dynamics: base.matices || [], pickup: base.anacrusa || 0, clef: CLEF[base.clave] || 'treble', armadura: base.armadura || 0, form: formOf(base), pulso: base.pulso || null };
  // en el STOP melódico se ven las alturas (el error puede estar en una nota)
  const rhythm = staffHtml(tokens, { ...opts, label: tokens.map(t => tokenLabel(t, env.nom, { pitch: !!base.melodic })).join(', ') });
  if (!ostinato) return rhythm;
  return twoVoices(tokens, ostinato, base, env);
}

// Las dos voces como un sistema: voz 1 (el ostinato de la app) arriba y voz 2 (la del alumno) abajo, compás a compás
export function twoVoices(tokens, ostinato, base, env, marks = []) {
  const label = `Voz 1, la app: ${ostinato.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ')}. Voz 2, tú: ${tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ')}`;
  // la voz 1 puede ir en clave de fa (un bajo): gran pentagrama con la voz del alumno (clave de sol) arriba y la de la app abajo
  const bass = base.voz1Clave === 'fa' || base.voz1Clave === 'bass';
  const voices = bass ? [{ tokens, marks }, { tokens: ostinato, clef: 'bass' }] : [{ tokens: ostinato }, { tokens, marks }];
  const legend = bass ? 'Arriba, voz 2: tú (clave de sol) · Abajo, voz 1: la app (el bajo, en clave de fa, se repite)' : 'Arriba, voz 1: la app (el ostinato, se repite) · Abajo, voz 2: tú';
  return `<p class="lm-system-legend">${legend}</p>
    ${systemHtml(voices, { meter: base.compas || '4/4', pickup: base.anacrusa || 0, label, armadura: base.armadura || 0, pulso: base.pulso || null })}`;
}

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
  // la voz 1 (ostinato), más suave y más grave, a la vez que la lectura
  (round.ostinato || []).forEach(t => { if (!t.rest) events.push({ midi: t.midi, at: (round.offset + t.start) * spb, dur: t.beats * spb * LEGATO, gain: t.gain ?? 0.5 }); });
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
  const pulse = pulseOfParams(p.base);
  const counts = Math.max(1, Math.round(barBeats / pulse));
  const pickup0 = p.base.anacrusa || 0;
  const form = formOf(p.base);
  // lo que suena: la lectura en el orden de su forma (repeticiones, casillas, D.C.); lo que se ve, la partitura escrita
  const playBase = form ? expandForm(tokens, form, { pickup: pickup0, barBeats }) : tokens;
  const ctx = { armadura: p.base.armadura || 0, melodic: !!p.base.melodic, form, up: p.base.clave === 'fa' ? 12 : 0 };
  const ostinato = kinds.includes('voz') ? ostinatoTokens(tokens, p.base) : null;
  const rounds = [];
  const played = new Set(); // rondas ya jugadas: no se repite la misma
  const total = p.rondas || 3;
  for (let k = 0; k < total; k++) {
    if (!env.alive()) return null;
    const round = stopRoundOf(playBase, { kinds, seed: env.seed + k * 101, barBeats, matices: p.base.matices || [], pickup: p.base.anacrusa || 0, avoid: played, round: k, ostinato, ctx });
    played.add(round.key);
    host.innerHTML = `<p class="eyebrow">Ronda ${k + 1} de ${total}</p>
      <p class="muted">La app toca este ritmo sobre el pulso, pero se equivocará en algún momento. ¡Pulsa STOP en cuanto lo notes!</p>
      ${stopScore(tokens, ostinato, p.base, env)}
      <p class="lm-stop-phase" id="lmStopPhase" aria-live="polite">Preparado</p>
      <div class="controls lm-sticky-controls"><button type="button" class="btn big" id="lmStopGo">Empezar la ronda</button></div>`;
    host.querySelector('#lmStopGo').focus();
    await onceClick(host, '#lmStopGo');
    host.querySelector('.controls').innerHTML = '<button type="button" class="btn big lm-stop-btn" id="lmStop" aria-keyshortcuts="Space">STOP</button>';
    const stopBtn = host.querySelector('#lmStop');
    stopBtn.focus();
    const phase = text => { host.querySelector('#lmStopPhase').textContent = text; };
    phase('Claqueta…');
    const t0 = clicks(counts, bpm / pulse, { accentEvery: counts });
    const { end, beats } = playStopRound(round, { t0, spb, barBeats, pickup: p.base.anacrusa || 0 });
    // el compás que suena, resaltado y a la vista (con el STOP fijo abajo); con forma, el compás escrito que corresponde
    const scoreBeat = beat => {
      if (!form) return beat;
      let e = null;
      for (const t of round.played) { if (t.start <= beat + 1e-9) e = t; else break; }
      return e && e.scoreStart !== undefined ? e.scoreStart + Math.min(Math.max(0, beat - e.start), e.beats) : beat;
    };
    const unfollow = follow(host, () => scoreBeat((now() - t0) / spb - round.offset), { barBeats, pickup: p.base.anacrusa || 0 });
    clicks(Math.ceil(beats / pulse), bpm / pulse, { at: t0, accentEvery: counts, level: PULSE_LEVEL });
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
    unfollow();
    stopSound();
    if (!env.alive()) return null;
    // pulsar durante la claqueta (pulso negativo) también es parar antes de tiempo
    const r = { errorBeat: round.errorBeat, pressBeat: pressed, code: round.code };
    rounds.push(r);
    const mark = stopMark(r.errorBeat, r.pressBeat, window);
    const where = (round.bar ?? Math.floor(round.errorBeat / barBeats)) + 1;
    const msg = mark === 'ok' ? '¡Parada a tiempo!' : r.pressBeat === null ? 'No has parado la música' : r.pressBeat < r.errorBeat ? 'Has parado antes del error' : 'Has parado tarde';
    host.querySelector('.controls').innerHTML = '';
    host.querySelector('#lmStopPhase').innerHTML = `<span class="dict-sw ${mark}" aria-hidden="true">${GLYPH[mark]}</span> <span>${esc(msg)}</span>`;
    host.querySelector('#lmStopPhase').insertAdjacentHTML('afterend', `<p class="muted center"><span>${esc(STOP_NAMES[round.code] || 'Cambió una figura')}</span> · <span>compás ${where}</span></p>`);
    env.say(msg);
    await continueButton(host, k + 1 < total ? 'Siguiente ronda' : 'Ver el resultado');
  }
  const g = gradeStop(rounds, { window });
  // el error lo cometió la app: lo que se apunta es que el alumno no lo notó («stop-» + el tipo de error)
  const missed = rounds.filter((r, i) => g.marks[i] !== 'ok').map(r => `stop-${r.code}`);
  return { pct: g.pct, marks: g.marks, mistakes: mistakeCodes([...missed, ...g.mistakes]) };
}

// ---------- Lectura rítmica tocando la pantalla ----------
// p: { tokens, meter, bpm }. Se toca en el botón grande (o con la barra espaciadora) al ritmo de la partitura.
export async function tapRhythm(host, p, env) {
  const barBeats = barBeatsOf(p.meter);
  const spb = 60 / p.bpm;
  const pulse = p.pulso === 'q.' ? 1.5 : 1; // en 6/8 la claqueta marca la negra con puntillo
  const counts = Math.max(1, Math.round(barBeats / pulse));
  const tol = toleranceMs(env.variant, p.tokens, p.bpm) / 1000;
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
  const t0 = clicks(counts, p.bpm / pulse, { accentEvery: counts });
  const last = p.tokens[p.tokens.length - 1];
  const end = t0 + (last.start + last.beats) * spb;
  // metrónomo suave en cada pulso mientras se toca (Fácil)
  if (env.variant === 'facil') clicks(Math.round((end - t0) / spb / pulse), p.bpm / pulse, { at: t0, accentEvery: counts });
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
