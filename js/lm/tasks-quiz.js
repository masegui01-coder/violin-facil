// Preguntas del curso (teoría, audición, discriminación y repaso): elegir, escuchar y elegir (compás, intervalo,
// matiz, modo, frase, forma), contar pulsos, completar un compás, emparejar signos, ordenar y nombrar notas.
// Cada pregunta se pinta en «host» y resuelve con { mark: 'ok'|'near'|'bad', mistake } tras mostrar la corrección.
import { esc } from '../ui.js';
import { orderMark } from './grade.js';
import { scoreTokens, barBeatsOf, solfaToName, letterText, midiOf, FIGURE_NAME, REST_NAME, beamBeatsOf, accidentalSigns, attackTokens, isAmalgam, groupingOf } from './notes.js';
import { nameText, namesFor } from './kit.js';
import { staffHtml, nameButtons, playButton, shuffle, seedOf, onceClick, whyHtml, CLEF, tokenLabel, tight } from './kit.js';
import { expandForm, formOf } from './form.js';
import { noteCell, clefCell, gapCell, endCell, layoutTokens, accSlotCell, keySignatureSteps, stepAtY, timeCell } from './staff-lm.js';
import { playNotes, clicks, stopSound } from './sound.js';
import { positionText } from './notes.js';
import { DYN_GAIN } from './gen.js';
import { chordVoicing, ornamentedTokens } from './harmony.js';

const LISTEN_BPM = 84;
const PAIR_BPM = 60;
const CHORD_BPM = 66; // negra por acorde
const DYN_RANGE = [0.25, 1];
const FERMATA_STRETCH = 2.5; // una nota con calderón suena unas dos veces y media su valor

// ---------- Sonido de una pregunta «escuchar…» ----------
// Partitura de las ilustraciones: además del formato de siempre, «^» alarga la figura (calderón) y «+» suena a la vez
export function figureNotes(text) {
  const out = [];
  let start = 0;
  text.replace(/\|/g, ' ').trim().split(/\s+/).filter(Boolean).forEach(tok => {
    const fermata = tok.endsWith('^');
    const parts = tok.replace(/\^$/, '').split('+').map(p => scoreTokens(p)[0]).filter(Boolean);
    if (!parts.length) return;
    const beats = parts[0].beats * (fermata ? FERMATA_STRETCH : 1);
    parts.forEach(t => out.push({ midi: t.midi, start, beats, rest: t.rest }));
    start += beats;
  });
  return out;
}
// Un acorde: las notas a la vez y la fundamental una octava más grave; negra a 66
export function chordNotes(notes, start = 0, beats = 2) {
  const midis = notes.map(midiOf);
  return [{ midi: midis[0] - 12, start, beats, rest: false }, ...midis.map(m => ({ midi: m, start, beats, rest: false }))];
}
// Progresión de acordes (números romanos en una tonalidad): una negra por acorde y el último, una redonda
export function progressionNotes(key, progresion) {
  let at = 0;
  return progresion.flatMap((numeral, i) => {
    const beats = i === progresion.length - 1 ? 4 : 1;
    const { bass, notes } = chordVoicing(key, numeral);
    const out = [bass, ...notes].map(n => ({ midi: midiOf(n), start: at, beats, rest: false }));
    at += beats;
    return out;
  });
}
// «Dos versiones» de la misma frase, cada una con su matiz (pp…ff), con un silencio entre ellas
const VERSION_PHRASE = '| G4q A4q B4q C5q | G4h Rh |';
const VERSION_GAP_BEATS = 2;
function versionNotes(play) {
  const phrase = scoreTokens(play.partitura || VERSION_PHRASE);
  const span = phrase.reduce((s, t) => Math.max(s, t.start + t.beats), 0) + VERSION_GAP_BEATS;
  return play.versiones.flatMap((v, k) => phrase.map(t => ({ midi: t.midi, start: t.start + k * span, beats: t.beats, rest: t.rest, gain: DYN_GAIN[v] ?? DYN_GAIN.mf })));
}
export function notesOfPlay(play, env) {
  if (play.versiones) return versionNotes(play);
  // Nivel 4: un acorde (notas a la vez, con la fundamental una octava grave) o una progresión de números romanos
  if (play.progresion) return progressionNotes(play.tonalidad, play.progresion);
  if (play.notas && play.acorde) return chordNotes(play.notas);
  // adornos: suena su realización (trino, mordente…), no la nota escrita
  if (play.ornamentos && play.partitura) return attackTokens(ornamentedTokens(play.partitura, play.ornamentos, play.armadura || 0)).map(t => ({ midi: t.midi, start: t.start, beats: t.beats, rest: t.rest }));
  // intervalo: las dos notas una detrás de otra (melódico) o a la vez (armónico)
  if (play.notas) return play.notas.map((n, i) => ({ midi: midiOf(n), start: play.armonico ? 0 : i * 1.2, beats: play.armonico ? 2 : 1, rest: false }));
  // dos voces a la vez: la segunda partitura suena junto a la primera, nota contra nota
  if (play.voz2 && play.partitura) return [...attackTokens(scoreTokens(play.partitura)), ...attackTokens(scoreTokens(play.voz2))].map(t => ({ midi: t.midi, start: t.start, beats: t.beats, rest: t.rest }));
  const text = play.cancion ? env.songScore(play.cancion) : play.partitura;
  if (!text) return [];
  if (/[\^+]/.test(text)) return figureNotes(text);
  const tokens = scoreTokens(text);
  // con repetición, casillas o D.C., suena en el orden de la forma; una nota ligada es una sola
  const form = formOf(play);
  const ordered = form ? expandForm(tokens, form, { pickup: play.anacrusa || 0, barBeats: barBeatsOf(play.compas || '4/4') }) : attackTokens(tokens);
  return ordered.map(t => ({ midi: t.midi, start: t.start, beats: t.beats, rest: t.rest }));
}
// Volumen por nota: un matiz fijo (pp…ff) o un regulador (cresc/dim) de punta a punta
export function gainsOf(play, notes) {
  if (play.versiones) return notes.map(n => n.gain);
  const dyn = play.dinamica || play.dyn;
  if (!dyn) return null;
  if (dyn in DYN_GAIN) return notes.map(() => DYN_GAIN[dyn]);
  const [lo, hi] = DYN_RANGE;
  const k = i => (notes.length > 1 ? i / (notes.length - 1) : 0);
  return notes.map((_, i) => (dyn === 'cresc' ? lo + (hi - lo) * k(i) : dyn === 'dim' ? hi - (hi - lo) * k(i) : 0.7));
}
// «pulso»: un clic por pulso; «acento:N»: clics con el primero de cada N más fuerte (sin notas)
function playPulse(sound, notes, bpm) {
  const beats = Math.max(1, Math.round(notes.reduce((end, n) => Math.max(end, n.start + n.beats), 0)));
  const meter = Number((/^acento:(\d)$/.exec(sound) || [])[1] || 0);
  const end = clicks(beats, bpm, { accentEvery: meter, level: meter ? 0.8 : 0.6 });
  return { t0: end - beats * 60 / bpm, end };
}
export function playQuestion(play, env) {
  stopSound();
  const notes = notesOfPlay(play, env);
  const bpm = play.progresion || play.acorde ? CHORD_BPM : play.notas ? PAIR_BPM : play.tempo || LISTEN_BPM;
  if (play.sound && /^(pulso|acento:\d)$/.test(play.sound)) return playPulse(play.sound, notes, bpm);
  const out = playNotes(notes, bpm, { gains: gainsOf(play, notes), accentEvery: play.acentoPrimero ? barBeatsOf(play.compas) : 0, clap: !!play.clap });
  // pulso: un clic suave por negra mientras suena (para oír si una nota ligada cae sobre él)
  if (play.pulso) clicks(Math.ceil(notes.reduce((end, n) => Math.max(end, n.start + n.beats), 0)), bpm, { at: out.t0, accentEvery: 2, level: 0.3 });
  return out;
}

// ---------- Elegir (con sonido opcional) ----------
const LISTEN_MISTAKE = { escucharCompas: 'compas', escucharModo: 'modo', escucharIntervalo: 'semitono-oido', escucharMatiz: 'matiz', escucharMovimiento: 'movimiento' };
// Las preguntas del Nivel 4 que son «escucha y elige» (tasks-quiz4.js) se corrigen igual que las demás

export function headHtml(item) {
  return `<h2 class="lm-q" tabindex="-1">${esc(item.q)}</h2>`;
}

export async function choose(host, item, env, { options, correct, extraHtml = '', optionHtml = null }) {
  host.innerHTML = `${headHtml(item)}${item.play ? playButton('lmQPlay') : ''}${extraHtml}
    <div class="quiz-options lm-options" role="group" aria-label="Respuestas">${options.map((o, k) => `<button type="button" class="quiz-opt" data-opt="${k}">${optionHtml ? optionHtml(o, k) : esc(o)}</button>`).join('')}</div>
    <div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  if (item.play) {
    host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion(item.play, env));
    playQuestion(item.play, env);
  }
  const b = await onceClick(host, '[data-opt]');
  stopSound(); // al contestar se calla lo que sonaba
  const chosen = Number(b.dataset.opt);
  const mark = correct.includes(chosen) ? 'ok' : 'bad';
  host.querySelectorAll('[data-opt]').forEach(x => {
    const k = Number(x.dataset.opt);
    x.disabled = true;
    if (correct.includes(k) && (k === chosen || mark === 'bad')) x.classList.add('right');
    else if (k === chosen) x.classList.add('wrong');
  });
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why);
  return { mark, mistake: mark === 'ok' ? null : item.code || item.id || LISTEN_MISTAKE[item.tipo] || 'teoria' };
}

// Opciones barajadas en cada intento (semilla del intento + la pregunta): la correcta no cae siempre en el mismo sitio
// Las listas con un orden propio (números, «la primera / la segunda», «de dos / de tres», matices de suave a fuerte)
// se dejan en su orden: barajarlas confunde
const ORDERED = /^(\d+|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|ninguno|ninguna|la primera|la segunda|el primero|el segundo|de dos|de tres|de cuatro|ppp|pp|p|mp|mf|f|ff|fff)$/i;
export const isOrdered = item => !!item.orden || item.options.every(o => ORDERED.test(String(o).trim()));
export function shuffledChoice(item, seed) {
  if (isOrdered(item)) return { options: [...item.options], correct: [item.answer] };
  const order = shuffle(item.options.map((_, i) => i), (seed >>> 0) + seedOf(item.id || item.q));
  return { options: order.map(i => item.options[i]), correct: [order.indexOf(item.answer)] };
}
export const elegir = (host, item, env) => choose(host, item, env, shuffledChoice(item, env.attempt ?? env.seed ?? 0));

// ---------- Contar (escribir el número) ----------
// Se escribe la respuesta (o se ajusta con − y +): no se elige entre números dados. Sin partitura, es de cálculo
// («¿cuántas corcheas llenan un 2/4?»); con ella, se cuentan pulsos, compases o semitonos de lo que se ve
const COUNT_MAX = 99;
async function contar(host, item, env) {
  const tokens = item.partitura ? scoreTokens(item.partitura) : null;
  const right = Number(item.respuesta);
  host.innerHTML = `${headHtml(item)}${item.play ? playButton('lmQPlay') : ''}${tokens ? staffHtml(tokens, { clef: CLEF[item.clave] || 'treble', meter: item.compas || null, pickup: item.anacrusa || 0, armadura: item.armadura || 0, form: formOf(item), label: tokens.map(t => tokenLabel(t, env.nom)).join(', ') }) : ''}
    <div class="lm-count-in"><button type="button" class="round" data-dec aria-label="Uno menos">−</button>
    <input type="number" inputmode="numeric" min="0" max="${COUNT_MAX}" data-count aria-label="Tu respuesta" placeholder="?">
    <button type="button" class="round" data-inc aria-label="Uno más">+</button></div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  const input = host.querySelector('[data-count]');
  const step = d => { input.value = String(Math.max(0, Math.min(COUNT_MAX, (Number(input.value) || 0) + d))); env.say(input.value); };
  host.querySelector('[data-dec]').addEventListener('click', () => step(-1));
  host.querySelector('[data-inc]').addEventListener('click', () => step(1));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); host.querySelector('[data-check]').click(); } });
  if (item.play) host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion(item.play, env));
  host.querySelector('.lm-q').focus();
  await onceClick(host, '[data-check]');
  const given = input.value === '' ? null : Number(input.value);
  const mark = given === right ? 'ok' : 'bad';
  host.querySelectorAll('[data-count],[data-dec],[data-inc]').forEach(x => { x.disabled = true; });
  host.querySelector('[data-check]').remove();
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || `Son ${right}.`);
  return { mark, mistake: mark === 'ok' ? null : item.id || 'contar' };
}

// ---------- Señalar un compás en la partitura ----------
// Cada compás escrito (entre barras) es un botón: «toca la anacrusa», «el compás con calderón», «dónde acaba la
// pregunta»… calderon: n.º de compás (desde 0) cuya última nota lleva calderón
function barButtons(item, env) {
  const bars = item.partitura.split('|').map(x => x.trim()).filter(Boolean);
  const clef = CLEF[item.clave] || 'treble';
  const pulse = item.compas ? beamBeatsOf(item.compas) : 1;
  const fine = item.dc && item.dc.fine ? Number(item.dc.fine) : null; // «Fine» sobre ese compás y «D.C. al Fine» al final
  return bars.map((text, k) => {
    const tokens = scoreTokens(`| ${text} |`);
    // Nivel 4: el compás de este compás (si cambia, lo dice su «@time») y el reparto de las corcheas en la amalgama
    const own = /@time:(\S+)/.exec(text);
    const barMeter = own ? own[1] : item.compas;
    const lay = layoutTokens(tokens, { clef, pulse, grouping: barMeter && (isAmalgam(barMeter) || own) ? () => groupingOf(barMeter, item) : null });
    const signs = accidentalSigns(tokens, tokens.map(() => 0), item.armadura || 0);
    const cells = (own ? `<span class="lm-sc" aria-hidden="true">${timeCell(barMeter)}</span>` : '') + tokens.map((t, i) => `<span class="lm-sc">${noteCell({ ...t, clef, beam: lay[i].beam, up: lay[i].up, acc: signs[i], tuplet: lay[i].tuplet, fermata: item.calderon === k && i === tokens.length - 1 })}</span>`).join('');
    const close = k === bars.length - 1 ? endCell(false) : gapCell(true, null, 14);
    const tag = fine === k + 1 ? '<span class="lm-flag-tag" lang="it">Fine</span>' : '';
    const dcTag = fine && k === bars.length - 1 ? '<span class="lm-dc" lang="it">D.C. al Fine</span>' : '';
    const said = `Compás ${k + 1}: ${tokens.map(t => tokenLabel(t, env.nom)).join(', ')}${fine === k + 1 ? ', Fine' : ''}`;
    // cada compás es un grupo (la clave de cada renglón y la reducción a lo ancho los pone systems.js) con su botón
    return `<span class="lm-bargroup"><button type="button" class="lm-bar-btn" data-bar="${k}" aria-label="${esc(said)}">${tag}${cells}<span class="lm-sc">${close}</span>${dcTag}</button></span>`;
  }).join('');
}
async function senalar(host, item, env) {
  host.innerHTML = `${headHtml(item)}${item.play ? playButton('lmQPlay') : ''}
    <div class="lm-staff lm-pick-bars${tight(scoreTokens(item.partitura), CLEF[item.clave] || 'treble') ? ' lm-tight' : ''}"${item.armadura ? ` data-armadura="${item.armadura}"` : ''} role="group" aria-label="Compases">${barButtons(item, env).replace('<span class="lm-bargroup">', `<span class="lm-bargroup"><span class="lm-sc" aria-hidden="true">${clefCell(CLEF[item.clave] || 'treble', item.compas || null, item.armadura || 0)}</span>`)}</div>
    <div class="lm-feedback"></div>`;
  if (item.play) host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion(item.play, env));
  host.querySelector('.lm-q').focus();
  const b = await onceClick(host, '[data-bar]');
  const chosen = Number(b.dataset.bar);
  const mark = chosen === Number(item.respuesta) ? 'ok' : 'bad';
  host.querySelectorAll('[data-bar]').forEach(x => {
    x.disabled = true;
    const k = Number(x.dataset.bar);
    if (k === Number(item.respuesta)) x.classList.add('right');
    else if (k === chosen) x.classList.add('wrong');
  });
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || '');
  return { mark, mistake: mark === 'ok' ? null : item.id || 'senalar' };
}

// ---------- Completar: cada «?» es un hueco en su sitio del pentagrama ----------
// Un hueco: vale cualquiera de las correctas. Varios (orden: true): se rellenan uno a uno y la correcta de cada
// hueco es correctas[k]. Las opciones se barajan en cada intento (data-opt guarda su número del catálogo)
export function optionCells(text, env, armadura = 0) {
  const tokens = scoreTokens(`| ${text} |`);
  // nombre accesible con la figura y la altura («Negra mi»), no solo la figura
  return `<span class="lm-opt-staff" aria-hidden="true">${staffHtml(tokens, { bars: false, armadura: armadura || 0 })}</span><span class="sr-only">${esc(tokens.map(t => tokenLabel(t, env.nom)).join(', '))}</span>`;
}
function holeStaff(item, fills, now, env) {
  const bars = item.partitura.split('|').map(x => x.trim()).filter(Boolean);
  let hole = 0;
  const cells = bars.map((bar, b) => {
    const parts = bar.split(/\s+/).flatMap(tok => {
      if (tok !== '?') return scoreTokens(`| ${tok} |`).map(t => ({ t }));
      const k = hole++;
      return fills[k] ? scoreTokens(`| ${fills[k]} |`).map(t => ({ t, filled: true })) : [{ hole: k }];
    });
    const lay = layoutTokens(parts.map(x => x.t || { dur: 'q', beats: 1 }), { clef: 'treble', pulse: item.compas ? beamBeatsOf(item.compas) : 1, grouping: item.compas && isAmalgam(item.compas) ? () => groupingOf(item.compas, item) : null });
    const signs = accidentalSigns(parts.map(x => x.t || { rest: true }), parts.map(() => 0), item.armadura || 0);
    const html = parts.map((x, i) => (x.hole !== undefined
      ? `<span class="lm-sc lm-hole-sc${x.hole === now ? ' lm-now' : ''}" aria-hidden="true">${noteCell({ step: null })}<span class="lm-hole-q">?</span></span>`
      : `<span class="lm-sc${x.filled ? ' lm-filled' : ''}">${noteCell({ ...x.t, clef: 'treble', beam: lay[i].beam, up: lay[i].up, acc: signs[i], tuplet: lay[i].tuplet })}</span>`)).join('');
    return `<span class="lm-bargroup">${b === 0 ? `<span class="lm-sc">${clefCell('treble', item.compas || null, item.armadura || 0)}</span>` : ''}${html}<span class="lm-sc">${b === bars.length - 1 ? endCell(false) : gapCell(true, null, 14)}</span></span>`;
  }).join('');
  // para el lector de pantalla: las notas que se ven, con «hueco» en su sitio y los compases separados por «|»
  let k = 0;
  const said = bars.map(bar => bar.split(/\s+/).map(tok => {
    if (tok !== '?') return scoreTokens(`| ${tok} |`).map(t => tokenLabel(t, env.nom)).join(', ');
    const f = fills[k++];
    return f ? scoreTokens(`| ${f} |`).map(t => tokenLabel(t, env.nom)).join(', ') : 'hueco';
  }).join(', ')).join(' | ');
  return `<div class="lm-staff lm-complete"${item.armadura ? ` data-armadura="${item.armadura}"` : ''} role="img" aria-label="${esc(said)}">${cells}</div>`;
}
async function completar(host, item, env) {
  const holes = (item.partitura.match(/\?/g) || []).length;
  const order = shuffle(item.opciones.map((_, i) => i), ((env.attempt ?? env.seed ?? 0) >>> 0) + seedOf(item.id || item.q));
  const fills = [];
  const picks = [];
  for (let k = 0; k < holes; k++) {
    host.innerHTML = `${headHtml(item)}${holes > 1 ? `<p class="eyebrow">Hueco ${k + 1} de ${holes}</p>` : ''}${holeStaff(item, fills, k, env)}
      <div class="quiz-options lm-options" role="group" aria-label="Respuestas">${order.map(i => `<button type="button" class="quiz-opt" data-opt="${i}">${optionCells(item.opciones[i], env, item.armadura || 0)}</button>`).join('')}</div>
      <div class="lm-feedback"></div>`;
    host.querySelector('.lm-q').focus();
    const b = await onceClick(host, '[data-opt]');
    if (!env.alive()) return null;
    picks.push(Number(b.dataset.opt));
    fills.push(item.opciones[Number(b.dataset.opt)]);
  }
  const right = picks.map((p, k) => (holes > 1 ? p === item.correctas[k] : item.correctas.includes(p)));
  const ok = right.filter(Boolean).length;
  const mark = ok === holes ? 'ok' : ok > 0 ? 'near' : 'bad';
  host.querySelector('.lm-complete').outerHTML = holeStaff(item, fills, -1, env);
  host.querySelectorAll('[data-opt]').forEach(x => {
    const i = Number(x.dataset.opt);
    x.disabled = true;
    if (holes === 1 ? item.correctas.includes(i) && (i === picks[0] || mark === 'bad') : item.correctas.includes(i)) x.classList.add('right');
    else if (picks.includes(i)) x.classList.add('wrong');
  });
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why);
  return { mark, mistake: mark === 'ok' ? null : item.id || 'completar' };
}

// ---------- Emparejar ----------
async function emparejar(host, item, env) {
  const names = shuffle(item.pares.map(p => p[1]), seedOf(item.id || item.q));
  host.innerHTML = `${headHtml(item)}<div class="lm-pairs">${item.pares.map(([sign], i) => `<label class="lm-pair"><span class="lm-sign" lang="it">${esc(sign)}</span>
    <select data-pair="${i}"><option value="">Elige…</option>${names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select></label>`).join('')}</div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  await onceClick(host, '[data-check]');
  const picks = [...host.querySelectorAll('[data-pair]')];
  const right = picks.filter((s, i) => s.value === item.pares[i][1]);
  picks.forEach((s, i) => {
    const ok = s.value === item.pares[i][1];
    s.disabled = true;
    s.closest('.lm-pair').classList.add(ok ? 'ok' : 'bad');
    s.closest('.lm-pair').insertAdjacentHTML('beforeend', `<span class="dict-sw ${ok ? 'ok' : 'bad'}" aria-hidden="true">${ok ? '✓' : '✕'}</span>${ok ? '' : `<small class="muted">${esc(item.pares[i][1])}</small>`}`);
  });
  host.querySelector('[data-check]').remove();
  const mark = right.length === picks.length ? 'ok' : right.length * 2 >= picks.length ? 'near' : 'bad';
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why);
  return { mark, mistake: mark === 'ok' ? null : item.id || 'emparejar' };
}

// ---------- Ordenar ----------
async function ordenar(host, item, env) {
  const want = item.respuesta || item.items;
  let order = shuffle(item.items, seedOf(item.id || item.q));
  if (order.every((x, i) => x === want[i]) && order.length > 1) order = [...order.slice(1), order[0]];
  const draw = focus => {
    host.querySelector('.lm-order').innerHTML = order.map((x, i) => `<li><span class="lm-order-text">${esc(x)}</span>
      <button type="button" class="icon-btn" data-up="${i}" aria-label="Subir ${esc(x)}" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" class="icon-btn" data-down="${i}" aria-label="Bajar ${esc(x)}" ${i === order.length - 1 ? 'disabled' : ''}>↓</button></li>`).join('');
    if (focus) host.querySelector(focus)?.focus();
  };
  host.innerHTML = `${headHtml(item)}<ol class="lm-order"></ol><div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  draw();
  host.querySelector('.lm-q').focus();
  const move = e => {
    const up = e.target.closest('[data-up]');
    const down = e.target.closest('[data-down]');
    if (!up && !down) return;
    const i = Number((up || down).dataset[up ? 'up' : 'down']);
    const j = up ? i - 1 : i + 1;
    [order[i], order[j]] = [order[j], order[i]];
    draw(`[data-${up ? 'up' : 'down'}="${j}"]`);
    env.say(`${order[j]}: posición ${j + 1}`);
  };
  host.addEventListener('click', move);
  await onceClick(host, '[data-check]');
  host.removeEventListener('click', move);
  const mark = orderMark(want, order);
  host.querySelector('.lm-order').innerHTML = order.map((x, i) => `<li class="${x === want[i] ? 'ok' : 'bad'}"><span class="dict-sw ${x === want[i] ? 'ok' : 'bad'}" aria-hidden="true">${x === want[i] ? '✓' : '✕'}</span><span class="lm-order-text">${esc(x)}</span></li>`).join('');
  host.querySelector('[data-check]').remove();
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || `Orden correcto: ${want.join(', ')}`);
  return { mark, mistake: mark === 'ok' ? null : item.id || 'ordenar' };
}

// ---------- Nombrar notas en orden ----------
async function nombrarNotas(host, item, env) {
  const tokens = scoreTokens(item.partitura).filter(t => !t.rest);
  const armadura = item.armadura || 0;
  const want = item.respuesta.map(x => solfaToName(x) || x); // con su alteración («Bb», «F#»)
  const given = [];
  const clef = CLEF[item.clave] || 'treble';
  // con su compás se pintan las barras (sin silencios, las notas son todo el compás)
  const meter = tokens.length === scoreTokens(item.partitura).length ? item.compas || null : null;
  const render = () => {
    host.querySelector('.lm-staff-box').innerHTML = staffHtml(tokens, { clef, meter, armadura, current: given.length, under: given.map(l => nameText(l, env.nom)) });
  };
  // Nivel 3: una paleta ♯ ♭ ♮ delante de la letra (la armadura no basta: sol♯ de la menor armónica, si♮ de do menor)
  const palette = env.level >= 3 ? `<div class="seg three lm-modrow" role="group" aria-label="Alteración de la próxima nota">${[['#', '♯ Sostenido'], ['b', '♭ Bemol'], ['n', '♮ Becuadro']].map(([v, t]) => `<button type="button" data-mod="${v}" aria-pressed="false">${t}</button>`).join('')}</div>` : '';
  let mod = null;
  host.innerHTML = `${headHtml(item)}<div class="lm-staff-box"></div>${palette}${nameButtons(namesFor(armadura), env.nom)}
    <p class="muted small center" aria-live="polite" id="lmNameProg">Nota 1 de ${tokens.length}</p><div class="lm-feedback"></div>`;
  render();
  host.querySelector('.lm-q').focus();
  const setMod = e => {
    const m = e.target.closest('[data-mod]');
    if (!m) return;
    mod = mod === m.dataset.mod ? null : m.dataset.mod;
    host.querySelectorAll('[data-mod]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mod === mod)));
  };
  host.addEventListener('click', setMod);
  while (given.length < want.length) {
    const b = await onceClick(host, '[data-name]');
    // con la paleta, la letra lleva la alteración elegida; sin ella, la de la armadura
    given.push(mod ? b.dataset.name[0] + (mod === '#' ? '#' : mod === 'b' ? 'b' : '') : b.dataset.name);
    mod = null;
    host.querySelectorAll('[data-mod]').forEach(x => x.setAttribute('aria-pressed', 'false'));
    render();
    host.querySelector('#lmNameProg').textContent = given.length < want.length ? `Nota ${given.length + 1} de ${tokens.length}` : 'Hecho';
  }
  host.removeEventListener('click', setMod);
  host.querySelectorAll('[data-name],[data-mod]').forEach(b => { b.disabled = true; });
  const marks = want.map((w, i) => (given[i] === w ? 'ok' : 'bad'));
  host.querySelector('.lm-staff-box').innerHTML = staffHtml(tokens, { clef, meter, armadura, marks, under: want.map((w, i) => (given[i] === w ? nameText(w, env.nom) : `${nameText(given[i], env.nom)} → ${nameText(w, env.nom)}`)) });
  const right = marks.filter(m => m === 'ok').length;
  const mark = right === want.length ? 'ok' : right * 2 >= want.length ? 'near' : 'bad';
  const wrongAt = marks.findIndex(m => m === 'bad');
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why);
  return { mark, mistake: wrongAt < 0 ? null : `${tokens[wrongAt].name}>${given[wrongAt]}` };
}

// ---------- Clasificar un compás: simple o compuesto, y binario, ternario o cuaternario ----------
// Nivel 4: los compases de amalgama (5/8, 7/8) no son simples ni compuestos: sus pulsos son desiguales (3+2, 2+2+3…)
const METER_ROWS = [['tipo', 'Tipo', [['simple', 'Simple'], ['compuesto', 'Compuesto'], ['amalgama', 'De amalgama']]],
  ['pulsos', 'Pulsos', [['binario', 'Binario'], ['ternario', 'Ternario'], ['cuaternario', 'Cuaternario'], ['3+2 o 2+3', '3+2 o 2+3'], ['2+2+3, 3+2+2 o 2+3+2', '2+2+3, 3+2+2 o 2+3+2']]]];
async function clasificarCompas(host, item, env) {
  const right = item.respuesta;
  const chosen = {};
  host.innerHTML = `${headHtml(item)}<div class="lm-staff lm-tight" role="img" aria-label="Compás de ${esc(item.compas)}"><span class="lm-bargroup"><span class="lm-sc">${clefCell('treble', item.compas, 0)}</span><span class="lm-sc">${endCell(false)}</span></span></div>
    ${METER_ROWS.map(([k, label, opts]) => `<div class="lm-classrow" role="group" aria-label="${label}"><span class="muted small">${label}</span><div class="quiz-options lm-options">${opts.map(([v, t]) => `<button type="button" class="quiz-opt" data-${k}="${v}" aria-pressed="false">${t}</button>`).join('')}</div></div>`).join('')}
    <div class="controls"><button type="button" class="btn" data-check disabled>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  const check = host.querySelector('[data-check]');
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-tipo],[data-pulsos]');
    if (!b || b.disabled) return;
    const k = b.hasAttribute('data-tipo') ? 'tipo' : 'pulsos';
    chosen[k] = b.dataset[k];
    host.querySelectorAll(`[data-${k}]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    check.disabled = !(chosen.tipo && chosen.pulsos);
  });
  await onceClick(host, '[data-check]');
  const okType = chosen.tipo === right.tipo;
  const okPulse = chosen.pulsos === right.pulsos;
  const mark = okType && okPulse ? 'ok' : okType || okPulse ? 'near' : 'bad';
  host.querySelectorAll('[data-tipo],[data-pulsos]').forEach(x => {
    x.disabled = true;
    const v = x.dataset.tipo || x.dataset.pulsos;
    if (v === right.tipo || v === right.pulsos) x.classList.add('right');
    else if (v === chosen.tipo || v === chosen.pulsos) x.classList.add('wrong');
  });
  check.remove();
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || `${right.tipo} ${right.pulsos}`);
  return { mark, mistake: mark === 'ok' ? null : 'compas' };
}

// ---------- Clasificar un intervalo: número (2.ª…8.ª) y especie (M, m, J, A, d) ----------
const SPECIES_ROW = [['M', 'Mayor'], ['m', 'Menor'], ['J', 'Justo'], ['A', 'Aumentado'], ['d', 'Disminuido']];
async function clasificarIntervalo(host, item, env) {
  const right = item.respuesta;
  const [a, b] = item.notas;
  const tokens = [a, b].map(n => ({ ...scoreTokens(`| ${n}w |`)[0], beats: 4 }));
  const clef = CLEF[item.clave] || 'treble';
  const chosen = {};
  const seq = staffHtml(tokens, { clef, bars: false, armadura: 0, label: `Dos notas: ${tokens.map(t => tokenLabel(t, env.nom)).join(', ')}` });
  host.innerHTML = `${headHtml(item)}${playButton('lmQPlay')}${seq}
    <div class="lm-classrow" role="group" aria-label="Número"><span class="muted small">Número</span><div class="lm-names lm-numbers">${[2, 3, 4, 5, 6, 7, 8].map(n => `<button type="button" class="lm-name" data-num="${n}" aria-pressed="false">${n}.ª</button>`).join('')}</div></div>
    <div class="lm-classrow" role="group" aria-label="Especie"><span class="muted small">Especie</span><div class="lm-names lm-numbers">${SPECIES_ROW.map(([v, t]) => `<button type="button" class="lm-name" data-esp="${v}" aria-pressed="false">${t}</button>`).join('')}</div></div>
    <div class="controls"><button type="button" class="btn" data-check disabled>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion({ notas: item.notas }, env));
  const check = host.querySelector('[data-check]');
  host.addEventListener('click', e => {
    const bt = e.target.closest('[data-num],[data-esp]');
    if (!bt || bt.disabled) return;
    const k = bt.hasAttribute('data-num') ? 'num' : 'esp';
    chosen[k] = bt.dataset[k];
    host.querySelectorAll(`[data-${k}]`).forEach(x => x.setAttribute('aria-pressed', String(x === bt)));
    check.disabled = !(chosen.num && chosen.esp);
  });
  await onceClick(host, '[data-check]');
  stopSound();
  const okNum = Number(chosen.num) === right.numero;
  const okEsp = chosen.esp === right.especie;
  // el número vale la mitad; la especie, la otra
  const mark = okNum && okEsp ? 'ok' : okNum || okEsp ? 'near' : 'bad';
  host.querySelectorAll('[data-num],[data-esp]').forEach(x => {
    x.disabled = true;
    if (x.dataset.num === String(right.numero) || x.dataset.esp === right.especie) x.classList.add('right');
    else if (x.dataset.num === chosen.num || x.dataset.esp === chosen.esp) x.classList.add('wrong');
  });
  check.remove();
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || `${right.numero}${right.especie}`);
  // número fallado: «3>4»; número bien y especie mal: «especie»
  return { mark, mistake: mark === 'ok' ? null : !okNum ? `${right.numero}>${chosen.num}` : 'especie' };
}

// ---------- Armadura: colocar las alteraciones en el pentagrama, en su orden ----------
// Se elige ♯ o ♭ y se toca una casilla del pentagrama a la altura elegida (con el teclado, flechas y Intro). Se acierta con
// el número, el signo y el orden (y la altura) correctos
const SLOTS = 7;
export function armaduraMark(placed, want, clef = 'treble') {
  const steps = keySignatureSteps(want, clef);
  const sym = want < 0 ? 'b' : '#';
  const ok = placed.length === Math.abs(want) && placed.every((p, i) => p.sym === sym && p.step === steps[i]);
  if (ok) return 'ok';
  // alguna bien colocada (signo y altura en su casilla) = casi
  return placed.some((p, i) => p.sym === sym && p.step === steps[i]) ? 'near' : 'bad';
}
async function armadura(host, item, env) {
  const clef = CLEF[item.clave] || 'treble';
  const want = item.respuesta;
  const placed = [];
  let sym = want < 0 ? 'b' : '#';
  let cursor = CLEF_MID[clef];
  const draw = () => {
    host.querySelector('.lm-keysig').innerHTML = `<span class="lm-sc" aria-hidden="true">${clefCell(clef, null, 0)}</span>${Array.from({ length: SLOTS }, (_, i) => `<button type="button" class="lm-sc lm-keyslot" data-slot="${i}" aria-label="${esc(placed[i] ? `Casilla ${i + 1}: ${placed[i].sym === '#' ? 'sostenido' : 'bemol'}, ${positionText(placed[i].step, clef)}` : `Casilla ${i + 1}, vacía: toca la línea o el espacio donde va la alteración`)}">${accSlotCell(placed[i] ? placed[i].step : null, placed[i] && placed[i].sym === 'b' ? '♭' : '♯')}</button>`).join('')}`;
  };
  host.innerHTML = `${headHtml(item)}<p class="muted">Tonalidad: ${esc(item.tonalidadPedida || '')}. Elige el signo y toca el pentagrama, de izquierda a derecha, donde va cada alteración.</p>
    <div class="seg two lm-symrow" role="group" aria-label="Signo"><button type="button" data-sym="#" aria-pressed="${sym === '#'}">♯ Sostenido</button><button type="button" data-sym="b" aria-pressed="${sym === 'b'}">♭ Bemol</button></div>
    <div class="lm-staff lm-keysig" role="group" aria-label="Pentagrama para la armadura"></div>
    <div class="controls"><button type="button" class="btn ghost small" data-undo>Borrar la última</button><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  draw();
  host.querySelector('.lm-q').focus();
  const lastFree = () => placed.length;
  const place = (step, slot = lastFree()) => {
    if (slot !== placed.length || placed.length >= SLOTS) return; // se rellenan en orden, de izquierda a derecha
    placed.push({ sym, step });
    draw();
    env.say(`${sym === '#' ? 'Sostenido' : 'Bemol'} puesto: ${positionText(step, clef)}`);
  };
  host.addEventListener('click', e => {
    const s = e.target.closest('[data-sym]');
    if (s) { sym = s.dataset.sym; host.querySelectorAll('[data-sym]').forEach(x => x.setAttribute('aria-pressed', String(x === s))); return; }
    if (e.target.closest('[data-undo]')) { placed.pop(); draw(); return; }
    const slot = e.target.closest('[data-slot]');
    if (!slot || slot.disabled) return;
    const svg = slot.querySelector('svg');
    // con el ratón o el dedo, la altura es donde se toca; con el teclado (clic sin posición), la del cursor
    place(e.detail ? stepAtY(svg, e.clientY, clef) : cursor, Number(slot.dataset.slot));
  });
  host.addEventListener('keydown', e => {
    if (!e.target.closest('[data-slot]')) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); cursor += e.key === 'ArrowUp' ? 1 : -1; env.say(positionText(cursor, clef)); }
  });
  await onceClick(host, '[data-check]');
  const mark = armaduraMark(placed, want, clef);
  host.querySelectorAll('button').forEach(b => { b.disabled = true; });
  const steps = keySignatureSteps(want, clef);
  host.querySelector('.lm-feedback').innerHTML = `${mark === 'ok' ? '' : `<p class="dict-staff-label">Así va</p><div class="lm-staff">${`<span class="lm-bargroup"><span class="lm-sc">${clefCell(clef, null, want)}</span></span>`}</div>`}${whyHtml(mark, item.why || '')}`;
  return { mark, mistake: mark === 'ok' ? null : 'armadura' };
}
const CLEF_MID = { treble: 34, bass: 22 };

export const QUIZ_KINDS = {
  elegir, contar, completar, emparejar, ordenar, nombrarNotas, senalar, clasificarCompas, clasificarIntervalo, armadura,
  escucharMovimiento: elegir,
  escucharCompas: elegir, escucharIntervalo: elegir, escucharMatiz: elegir, escucharModo: elegir, escucharFrase: elegir, escucharForma: elegir,
};

