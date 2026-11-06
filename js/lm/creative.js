// Creatividad: componer (o retocar) con las restricciones del catálogo y escucharlo. El editor ofrece todo lo que
// pide cada consigna: compás a elegir, matices por compás y calderón, coma de respiración, barra de repetición,
// anacrusa y letra. La app solo comprueba las reglas (sin nota): la nota la pone el profesor.
import { esc } from '../ui.js';
import { createStaffWriter, tokensToPlay } from './tasks-staff.js';
import { checkComposition } from './grade.js';
import { scoreTokens, barBeatsOf, stepOf, noteText, tokensText, FIGURE_BEATS } from './notes.js';
import { gainsFor } from './gen.js';
import { lmExercise } from './catalog.js';
import { staffHtml, continueButton, playButton, tokenLabel, GLYPH } from './kit.js';
import { playEvents, playNotes, stopSound } from './sound.js';
import { saveWork, workOf } from './results.js';

const BPM = 80;
const LEGATO = 0.92;
const FERMATA = 2; // el calderón dobla la última nota
export const RULE_NAME = {
  longitud: 'Número de compases', compases: 'Compases completos', figuras: 'Figuras permitidas', notas: 'Notas permitidas',
  final: 'Final', saltos: 'Sin saltos', incluye: 'Figuras o notas obligatorias', semitonos: 'Los semitonos', tiempo1: 'Nota en el primer tiempo',
  signos: 'Los matices y el calderón', repeticion: 'Barra de repetición', comas: 'Coma de respiración', anacrusa: 'Empieza en anacrusa',
  letra: 'Letra', eco: 'El eco repite la llamada', cambiar: 'Solo cambia el final', empieza: 'Empieza igual que la pregunta',
  llamada: 'La llamada acaba en la nota que pide', pregunta: 'La pregunta acaba en el aire (no en do)', respuesta: 'La respuesta acaba en do',
  formaB: 'La parte B es distinta de la A',
};
const SOLFA_INDEX = { do: 0, re: 1, mi: 2, fa: 3, sol: 4, la: 5, si: 6 };
const letterOf = step => (((step - stepOf('C4')) % 7) + 7) % 7;
// Final de una frase en su último compás: la última nota que suena, sin los silencios del final y sin la anacrusa
// de la frase siguiente. Si la pieza empieza en anacrusa, la frase siguiente también: los últimos «pickup» pulsos
// del compás ya son de ella (| C5h G4q | en 3/4 con anacrusa de 1 acaba en C5, como «Cumpleaños feliz»). Sin
// anacrusa, la que va detrás de un silencio (| C5h Rq G4q | acaba en C5)
export function phraseEnd(bar, pickup = 0) {
  let ts = [...(bar || [])];
  if (pickup > 0) {
    let cut = 0;
    while (ts.length > 1 && cut + (FIGURE_BEATS[ts[ts.length - 1].dur] || 0) <= pickup + 1e-6) cut += FIGURE_BEATS[ts.pop().dur] || 0;
  } else {
    const lastRest = ts.map(t => !!t.rest).lastIndexOf(true);
    if (lastRest > 0 && lastRest < ts.length - 1 && ts.slice(0, lastRest).some(t => !t.rest)) ts = ts.slice(0, lastRest);
  }
  for (let i = ts.length - 1; i >= 0; i--) if (!ts[i].rest) return ts[i];
  return null;
}
// Con anacrusa, la frase siguiente puede entrar en anacrusa o no (la parte B puede empezar en el 1): vale cualquiera
// de las dos lecturas del final (sin los últimos pulsos o con ellos)
const endsOn = (bar, letter, pickup = 0) => [pickup, 0].some(k => { const t = phraseEnd(bar, k); return !!t && letterOf(t.step) === letter; });
const MIN_B_CHANGES = 2; // compases de B distintos de los de A para que B sea «otra parte»
const DYN = [['pp', 'pp'], ['p', 'p'], ['mp', 'mp'], ['mf', 'mf'], ['f', 'f'], ['ff', 'ff'], ['cresc', 'cresc.'], ['dim', 'dim.']];
const normFig = f => (f === 'ee' ? 'e' : f === 'rq' ? 'Rq' : f);
const plain = t => ({ rest: !!t.rest, dur: t.dur, ...(t.rest ? {} : { step: t.step }) });
const same = (a, b) => a.length === b.length && a.every((t, i) => t.rest === b[i].rest && t.dur === b[i].dur && (t.rest || t.step === b[i].step));

// Notas por compás (desde 0), con anacrusa
function byBars(tokens, barBeats, pickup = 0) {
  let sum = pickup ? barBeats - pickup : 0;
  const bars = [];
  tokens.forEach(t => {
    const b = Math.floor(sum / barBeats + 1e-9);
    (bars[b] ||= []).push(t);
    sum += FIGURE_BEATS[t.dur] || 0;
  });
  return bars;
}

// Notas guardadas en texto («C4q D4q …») → partitura con sus barras de compás
function withBars(text, barBeats) {
  let sum = 0;
  const out = [];
  text.trim().split(/\s+/).forEach(tok => {
    out.push(tok);
    sum += FIGURE_BEATS[tok.replace(/^(R|[A-G][#b]?\d)/, '')] || 0;
    if (Math.abs(sum % barBeats) < 1e-6) out.push('|');
  });
  return `| ${out.join(' ')}${out[out.length - 1] === '|' ? '' : ' |'}`;
}

// La melodía que se pinta en «Pinta con matices»: la creación del alumno de la unidad 5 (si la guardó) o la lectura
function paintBase() {
  const saved = workOf('lm1-u5-creatividad-a-facil').split('\n')[0];
  try { if (saved) return { tokens: scoreTokens(withBars(saved, barBeatsOf('4/4'))), meter: '4/4', from: 'Tu melodía de la unidad 5' }; } catch (e) { /* guardada con otro formato: la lectura */ }
  const reading = lmExercise('lm1-u5-entonacion-b-facil');
  return { tokens: scoreTokens(reading.params.partitura), meter: reading.params.compas || '4/4', from: 'La lectura de la unidad 5' };
}

export async function creatividad(host, ex, env) {
  const p = ex.params;
  const rs = p.restricciones || {};
  const paint = !!(rs.signos && rs.base);
  const change = !!((p.dada || rs.dada) && (p.cambiar || rs.cambiar));
  const base = paint ? paintBase() : null;
  const given = p.dada || rs.dada ? scoreTokens(p.dada || rs.dada) : null;
  const meters = paint ? [base.meter] : String(rs.compas || (given ? `${given.filter(t => t.bar === 0).reduce((s, t) => s + t.beats, 0)}/4` : '4/4')).split('|');
  let meter = meters[0];
  const signs = rs.signos || (rs.mustInclude && rs.mustInclude.signos) || null;
  const figures = (rs.figuras || (given ? [...new Set(given.map(t => (t.rest ? `R${t.dur}` : t.dur)))] : ['q', 'h'])).map(normFig);
  const rhythmOnly = !rs.notas && !change && !paint;
  const bars = paint ? base.tokens[base.tokens.length - 1].bar + 1 : rs.compases || (given ? given[given.length - 1].bar + 1 : 2);
  const state = { dyn: {}, fermata: false, repeat: false, pickup: 0 };
  const dynamics = () => [...Object.entries(state.dyn).filter(([, v]) => v).map(([b, v]) => ({ compas: Number(b), signo: v })), ...(state.fermata ? [{ compas: bars, signo: 'calderon' }] : [])];

  const barSelect = n => `<fieldset class="lm-dynpick"><legend>Matices de cada compás</legend>${Array.from({ length: n }, (_, b) => `<label><span>Compás ${b + 1}</span>
    <select data-dynbar="${b + 1}"><option value="">—</option>${DYN.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></label>`).join('')}
    <label class="lm-check"><input type="checkbox" data-fermata> <span>Calderón al final</span></label></fieldset>`;
  host.innerHTML = `<p>${esc(p.consigna || '')}</p>
    ${given && !change ? `<p class="dict-staff-label">${p.dada || rs.dada ? 'La llamada de la app' : ''}</p>${staffHtml(given, { meter, label: given.map(t => tokenLabel(t, env.nom)).join(', ') })}${playButton('lmGivenPlay', 'Escuchar la llamada')}` : ''}
    ${meters.length > 1 ? `<div class="setting"><span id="lmMeterLbl">Compás</span><div class="seg ${meters.length === 2 ? 'two' : 'three'}" role="group" aria-labelledby="lmMeterLbl">${meters.map((m, i) => `<button type="button" data-meter="${m}" aria-pressed="${i === 0}">${m}</button>`).join('')}</div></div>` : ''}
    ${rs.anacrusa ? '<div class="setting"><span id="lmPickLbl">Anacrusa</span><div class="seg three" role="group" aria-labelledby="lmPickLbl"><button type="button" data-pick="0" aria-pressed="true">Sin anacrusa</button><button type="button" data-pick="1" aria-pressed="false">1 pulso</button><button type="button" data-pick="2" aria-pressed="false">2 pulsos</button></div></div>' : ''}
    <p class="dict-staff-label">${paint ? esc(base.from) : change ? 'La melodía (cambia el final)' : 'Tu composición'}</p><div class="lm-writer"></div>
    ${signs ? barSelect(bars) : ''}
    ${rs.repeticion ? '<label class="lm-check"><input type="checkbox" data-repeat> <span>Barra de repetición al final</span></label>' : ''}
    ${rs.notas ? `<p class="muted small"><span>Notas:</span> <span>${rs.notas.map(n => noteText(n, env.nom)).join(', ')}</span></p>` : ''}
    ${rs.letra ? '<label class="lm-lyrics"><span>Tu letra</span><input type="text" id="lmLyrics" maxlength="120" autocomplete="off"></label>' : ''}
    <div class="controls">${playButton('lmMinePlay', 'Escuchar lo que has escrito')}<button type="button" class="btn" data-check>Comprobar y guardar</button></div>
    <div class="lm-feedback"></div>`;
  const extras = () => ({ dynamics: dynamics(), pickup: state.pickup, repeat: state.repeat });
  const initial = paint ? base.tokens.map(plain) : change ? given.map(plain) : [];
  const w = createStaffWriter(host.querySelector('.lm-writer'), {
    figures, rhythmOnly, max: paint ? initial.length : 64, nom: env.nom, say: env.say, meter, initial, extras, breath: !!rs.comas,
  });
  if (paint) host.querySelector('.lm-writer').classList.add('lm-locked-notes');
  host.addEventListener('change', e => {
    const sel = e.target.closest('[data-dynbar]');
    if (sel) state.dyn[sel.dataset.dynbar] = sel.value;
    if (e.target.closest('[data-fermata]')) state.fermata = e.target.checked;
    if (e.target.closest('[data-repeat]')) state.repeat = e.target.checked;
    w.refresh();
  });
  host.addEventListener('click', e => {
    const m = e.target.closest('[data-meter]');
    const pk = e.target.closest('[data-pick]');
    if (m) { meter = m.dataset.meter; host.querySelectorAll('[data-meter]').forEach(b => b.setAttribute('aria-pressed', String(b === m))); w.setMeter(meter); }
    if (pk) { state.pickup = Number(pk.dataset.pick); host.querySelectorAll('[data-pick]').forEach(b => b.setAttribute('aria-pressed', String(b === pk))); w.refresh(); }
  });
  host.querySelector('#lmGivenPlay')?.addEventListener('click', () => { stopSound(); playNotes(tokensToPlay(given.map(plain)), BPM); });
  host.querySelector('#lmMinePlay').addEventListener('click', () => { stopSound(); playEvents(eventsOf(w.tokens(), meter, state.pickup, dynamics(), rhythmOnly)); });
  if (workOf(ex.id)) env.say('Tienes una composición guardada de otra vez: puedes escribir una nueva');

  await new Promise(r => host.querySelector('[data-check]').addEventListener('click', r, { once: true }));
  stopSound();
  const tokens = w.tokens();
  const barBeats = barBeatsOf(meter);
  const lyrics = host.querySelector('#lmLyrics')?.value.trim() || '';
  const c = checkComposition(tokens, {
    barBeats, bars, figures: paint ? null : figures, notes: rs.notas ? rs.notas.map(stepOf) : null,
    endSteps: (rs.final || p.final) ? String(rs.final || p.final).split('|').map(stepOf) : null, endFigure: rs.finalFigura || null,
    maxLeap: rs.saltoMax ?? null, mustFigures: mustOf(rs.mustInclude), semitones: rs.mustInclude && rs.mustInclude.semitonos ? rs.mustInclude.semitonos.map(x => x.split('-').map(stepOf)) : null,
    pickup: state.pickup, firstBeatNote: (rs.reglas || []).some(r => /primer tiempo/.test(r)), extra: extraRules({ rs, p, tokens, given, signs, state, lyrics, barBeats, bars, dyn: dynamics() }),
  });
  saveWork(ex.id, `${tokensText(tokens)}${lyrics ? `\n${lyrics}` : ''}`);
  w.lock();
  host.querySelectorAll('[data-dynbar],[data-fermata],[data-repeat]').forEach(x => { x.disabled = true; });
  host.querySelector('[data-check]').remove();
  host.querySelector('.lm-feedback').innerHTML = `<h2 class="lm-q">Lo que pedía el ejercicio</h2><ul class="lm-rules">${c.rules.map(r => `<li class="${r.ok ? 'ok' : 'bad'}"><span class="dict-sw ${r.ok ? 'ok' : 'bad'}" aria-hidden="true">${GLYPH[r.ok ? 'ok' : 'bad']}</span> <span>${esc(RULE_NAME[r.id] || r.id)}</span><span class="sr-only">: ${r.ok ? 'cumplida' : 'sin cumplir'}</span></li>`).join('')}</ul>`;
  await continueButton(host, 'Ver el resultado');
  return { pct: c.pct, noGrade: true, rulesOk: c.rules.filter(r => r.ok).length, rulesTotal: c.rules.length, marks: c.rules.map(r => (r.ok ? 'ok' : 'bad')), labels: c.rules.map(r => RULE_NAME[r.id] || r.id), mistakes: c.mistakes, note: 'Tu composición queda guardada. Si estás en una clase, envíasela a tu profesor: la escuchará y le pondrá nota.', work: tokensText(tokens), lyrics, meter };
}

// mustInclude del catálogo sin los «signos» ni los «semitonos» (van en sus propias reglas)
function mustOf(mi) {
  if (!mi) return null;
  const rest = Object.fromEntries(Object.entries(mi).filter(([k]) => k !== 'signos' && k !== 'semitonos'));
  return Object.keys(rest).length ? rest : null;
}

// Reglas que no son de notas: matices, barra de repetición, coma, anacrusa, letra, eco, «solo el final», «empieza igual»
export function extraRules({ rs, p, tokens, given, signs, state, lyrics, barBeats, bars, dyn }) {
  const out = [];
  if (signs) {
    const used = new Set(dyn.map(m => m.signo));
    out.push({ id: 'signos', ok: signs.every(s => used.has(s)) });
  }
  if (rs.repeticion) out.push({ id: 'repeticion', ok: !!state.repeat });
  if (rs.comas) out.push({ id: 'comas', ok: tokens.some(t => t.breath) });
  if (rs.anacrusa) out.push({ id: 'anacrusa', ok: state.pickup > 0 });
  if (rs.letra) out.push({ id: 'letra', ok: lyrics.length > 0 });
  if (rs.forma && /eco/i.test(rs.forma)) {
    const b = byBars(tokens, barBeats, state.pickup);
    const half = Math.floor(bars / 2);
    out.push({ id: 'eco', ok: b.length >= bars && Array.from({ length: half }, (_, k) => same(b[k] || [], b[k + half] || [])).every(Boolean) });
  }
  if ((p.cambiar || rs.cambiar) && given) {
    const gb = byBars(given.map(plain), barBeats);
    const tb = byBars(tokens, barBeats);
    out.push({ id: 'cambiar', ok: gb.length === tb.length && gb.slice(0, -1).every((bar, k) => same(bar, tb[k] || [])) });
  }
  if (/empiece igual/i.test(p.consigna || '') && given) out.push({ id: 'empieza', ok: !!tokens[0] && !tokens[0].rest && tokens[0].step === given[0].step });
  out.push(...formRules({ rs, p, tokens, state, barBeats, bars }));
  return out;
}

// Reglas de forma: «llamada (acaba en sol)» y AB = A (pregunta + respuesta) y B distinta. Compases enteros desde 0
// (con anacrusa, el compás 0 es la anacrusa y los enteros empiezan en el 1)
function formRules({ rs, p, tokens, state, barBeats, bars }) {
  const out = [];
  const b = byBars(tokens, barBeats, state.pickup);
  const off = state.pickup ? 1 : 0;
  const call = /llamada \(acaba en (do|re|mi|fa|sol|la|si)\)/i.exec(p.consigna || '');
  if (call) out.push({ id: 'llamada', ok: endsOn(b[off + Math.floor(bars / 2) - 1], SOLFA_INDEX[call[1].toLowerCase()], state.pickup || 0) });
  if (/^AB$/i.test(rs.forma || '') && bars >= 8) {
    const half = bars / 2;
    const a = b.slice(off, off + half);
    const bPart = b.slice(off + half, off + bars);
    // las frases acaban en los compases 2 y 4 de A (la estructura de la forma), y su anacrusa siguiente no cuenta
    const pick = state.pickup || 0;
    out.push({ id: 'pregunta', ok: !!phraseEnd(a[half / 2 - 1], pick) && !endsOn(a[half / 2 - 1], 0, pick) });
    out.push({ id: 'respuesta', ok: endsOn(a[half - 1], 0, pick) });
    out.push({ id: 'formaB', ok: bPart.length === half && bPart.filter((bar, k) => !same(bar || [], a[k] || [])).length >= MIN_B_CHANGES });
  }
  return out;
}

// Lo que suena al escuchar la composición: con sus matices (volumen por compás) y el calderón
function eventsOf(tokens, meter, pickup, dyn, clap) {
  const barBeats = barBeatsOf(meter);
  const spb = 60 / BPM;
  let sum = pickup ? barBeats - pickup : 0;
  const withBars = tokens.map(t => { const n = { ...t, bar: Math.floor(sum / barBeats + 1e-9) - (pickup ? 0 : 0), start: sum - (pickup ? barBeats - pickup : 0), beats: FIGURE_BEATS[t.dur] }; sum += n.beats; return n; });
  const gains = gainsFor(withBars, dyn);
  const fermata = dyn.some(m => m.signo === 'calderon');
  return withBars.filter(t => !t.rest).map((t, i, arr) => ({
    midi: clap ? 72 : stepMidi(t.step), at: t.start * spb,
    dur: t.beats * spb * LEGATO * (fermata && i === arr.length - 1 ? FERMATA : 1), gain: gains[withBars.indexOf(t)],
  }));
}
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const stepMidi = step => 12 * (Math.floor(step / 7) + 1) + LETTER_PC[((step % 7) + 7) % 7];
