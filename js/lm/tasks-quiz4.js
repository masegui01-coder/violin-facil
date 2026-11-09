// Preguntas nuevas del Nivel 4: grados, tríadas, acordes, cadencias, modulación, notas enarmónicas, agrupación de las corcheas
// de la amalgama, ritmos que suenan igual, inversión de intervalos, claves de do y de fa en 3.ª, y adornos. Cada pregunta se
// pinta en «host» y resuelve con { mark: 'ok'|'near'|'bad', mistake } tras mostrar la corrección (como tasks-quiz.js).
import { esc } from '../ui.js';
import { scoreTokens, stepOf, tokenMidi, midiOf, noteText, keyAcc, accOfName, LETTERS } from './notes.js';
import { staffHtml, nameButtons, playButton, shuffle, seedOf, onceClick, whyHtml, CLEF, tokenLabel } from './kit.js';
import { clefCell, endCell, chordCell } from './staff-lm.js';
import { choose, headHtml, elegir, optionCells, playQuestion } from './tasks-quiz.js';
import { createStaffWriter, wantsPalette } from './tasks-staff.js';
import { armaduraOf, DEGREE_NAME, noteAtPosition, TRIAD_TYPES } from './harmony.js';
import { stopSound } from './sound.js';

const ROMAN_UP = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const cap = s => s[0].toUpperCase() + s.slice(1);
const markOf = oks => (oks.every(Boolean) ? 'ok' : oks.some(Boolean) ? 'near' : 'bad');
const noteToken = name => ({ ...scoreTokens(`| ${name}w |`)[0], beats: 4 });
// La alteración que hay que dibujar delante de una nota suelta: la que la armadura no pone ya
const signOf = (name, arm) => { const acc = accOfName(name); return acc === keyAcc(name[0], arm) ? null : acc === 1 ? '#' : acc === -1 ? 'b' : 'n'; };

// Opciones barajadas en cada intento (la correcta no cae siempre en el mismo sitio); correct: posiciones buenas del catálogo
function shuffledOptions(item, options, correct, env) {
  const order = shuffle(options.map((_, i) => i), ((env.attempt ?? env.seed ?? 0) >>> 0) + seedOf(item.id || item.q));
  return { options: order.map(i => options[i]), correct: correct.map(c => order.indexOf(c)), order };
}

// ---------- Filas de botones (número y nombre, tipo y número…) ----------
function rowsHtml(rows) {
  return rows.map(r => `<div class="lm-classrow" role="group" aria-label="${esc(r.label)}"><span class="muted small">${esc(r.label)}</span><div class="lm-names lm-numbers">${r.options.map(([v, t]) => `<button type="button" class="lm-name" data-${r.key}="${esc(v)}" aria-pressed="false">${esc(t)}</button>`).join('')}</div></div>`).join('')
    + '<div class="controls"><button type="button" class="btn" data-check disabled>Comprobar</button></div><div class="lm-feedback"></div>';
}
// Espera a que cada fila tenga una elección y se pulse «Comprobar»; marca lo bueno y lo malo. right: { clave: valor }
async function pickRows(host, rows, right) {
  const chosen = {};
  const check = host.querySelector('[data-check]');
  const sel = rows.map(r => `[data-${r.key}]`).join(',');
  const onClick = e => {
    const b = e.target.closest(sel);
    if (!b || b.disabled) return;
    const r = rows.find(x => b.hasAttribute(`data-${x.key}`));
    chosen[r.key] = b.dataset[r.key];
    host.querySelectorAll(`[data-${r.key}]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    check.disabled = !rows.every(x => chosen[x.key] !== undefined);
  };
  host.addEventListener('click', onClick);
  await onceClick(host, '[data-check]');
  host.removeEventListener('click', onClick);
  stopSound();
  const ok = rows.map(r => String(chosen[r.key]) === String(right[r.key]));
  rows.forEach(r => host.querySelectorAll(`[data-${r.key}]`).forEach(x => {
    x.disabled = true;
    if (x.dataset[r.key] === String(right[r.key])) x.classList.add('right');
    else if (x.dataset[r.key] === chosen[r.key]) x.classList.add('wrong');
  }));
  check.remove();
  return { chosen, ok };
}
const finish = (host, item, ok, why) => {
  const mark = markOf(ok);
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, why ?? item.why ?? '');
  return { mark, mistake: mark === 'ok' ? null : item.id };
};

// ---------- Grado de una nota en una tonalidad ----------
const GRADE_NAMES = [...Object.values(DEGREE_NAME), 'subtónica'];
async function identificarGrado(host, item, env) {
  const arm = armaduraOf(item.tonalidad);
  const rows = [
    { key: 'grado', label: 'Grado', options: ROMAN_UP.map((r, i) => [String(i + 1), r]) },
    { key: 'nombre', label: 'Nombre', options: GRADE_NAMES.map(n => [n, cap(n)]) },
  ];
  host.innerHTML = `${headHtml(item)}${staffHtml([noteToken(item.nota)], { clef: 'treble', bars: false, armadura: arm, label: `${item.tonalidad}: ${noteText(item.nota, env.nom)}` })}${rowsHtml(rows)}`;
  host.querySelector('.lm-q').focus();
  const { ok } = await pickRows(host, rows, { grado: item.respuesta.grado, nombre: item.respuesta.nombre });
  return finish(host, item, ok);
}

// ---------- Clase de una tríada ----------
// Pentagrama con un acorde (clave, tres notas apiladas, barra final)
export function chordStaff(notes, { clef = 'treble', armadura = 0, label = '', marks = null } = {}) {
  const steps = notes.map(stepOf).sort((a, b) => a - b);
  const sorted = [...notes].sort((a, b) => stepOf(a) - stepOf(b));
  const accs = sorted.map(n => signOf(n, armadura));
  return `<div class="lm-staff lm-chordstaff" data-clef="${clef}"${armadura ? ` data-armadura="${armadura}"` : ''} role="img" aria-label="${esc(label)}"><span class="lm-bargroup"><span class="lm-sc">${clefCell(clef, null, armadura)}</span><span class="lm-sc">${chordCell({ steps, clef, accs, mark: marks })}</span><span class="lm-sc">${endCell(false)}</span></span></div>`;
}
async function clasificarAcorde(host, item, env) {
  const rows = [{ key: 'tipo', label: 'Clase de tríada', options: TRIAD_TYPES.map(t => [t, cap(t)]) }];
  host.innerHTML = `${headHtml(item)}${playButton('lmQPlay')}${chordStaff(item.notas, { label: `Tríada: ${item.notas.map(n => noteText(n, env.nom)).join(', ')}` })}${rowsHtml(rows)}`;
  host.querySelector('.lm-q').focus();
  host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion({ notas: item.notas, acorde: true }, env));
  const { ok } = await pickRows(host, rows, { tipo: item.respuesta.tipo });
  return finish(host, item, ok);
}

// ---------- Escribir una tríada ----------
async function construirAcorde(host, item, env) {
  const clef = CLEF[item.clave] || 'treble';
  const armadura = item.tonalidad ? armaduraOf(item.tonalidad) : 0;
  const want = item.respuesta;
  host.innerHTML = `${headHtml(item)}<p class="muted small">Escribe las tres notas, de abajo arriba.</p><div class="lm-writer"></div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  const w = createStaffWriter(host.querySelector('.lm-writer'), { clef, wide: true, figures: ['w'], max: want.length, nom: env.nom, say: env.say, armadura, accidentals: wantsPalette(env, want, armadura) });
  await onceClick(host, '[data-check]');
  const written = w.tokens().slice().sort((a, b) => a.step - b.step || tokenMidi(a) - tokenMidi(b));
  const sorted = [...want].sort((a, b) => stepOf(a) - stepOf(b));
  // la altura real y también el nombre: do♯ no es re♭
  const marks = sorted.map((n, i) => (written[i] && written[i].step === stepOf(n) && tokenMidi(written[i]) === midiOf(n) ? 'ok' : 'bad'));
  w.lock(marks);
  host.querySelector('[data-check]').remove();
  const right = marks.filter(m => m === 'ok').length;
  const mark = right === want.length && written.length === want.length ? 'ok' : right * 2 >= want.length ? 'near' : 'bad';
  const shown = sorted.map(n => noteText(n, env.nom)).join(' – ');
  host.querySelector('.lm-feedback').innerHTML = `${mark === 'ok' ? '' : chordStaff(want, { clef, armadura, label: `Respuesta: ${shown}` })}${whyHtml(mark, item.why || (mark === 'ok' ? '' : `Respuesta: ${shown}`))}`;
  return { mark, mistake: mark === 'ok' ? null : item.id };
}

// ---------- Armonizar un compás: el acorde que cubre las notas fuertes ----------
async function armonizar(host, item, env) {
  const tokens = scoreTokens(item.partitura);
  const arm = item.armadura || armaduraOf(item.tonalidad);
  const sh = shuffledOptions(item, item.opciones, item.correctas, env);
  const staff = staffHtml(tokens, { meter: item.compas, armadura: arm, label: tokens.map(t => tokenLabel(t, env.nom)).join(', ') });
  return choose(host, item, env, { options: sh.options, correct: sh.correct, extraHtml: staff });
}

// ---------- Cadencias ----------
const CADENCES = ['perfecta', 'plagal', 'semicadencia', 'rota'];
async function clasificarCadencia(host, item, env) {
  const right = CADENCES.indexOf(item.respuesta);
  const prog = `<p class="lm-prog" aria-label="Progresión"><b>${esc(item.progresion.join(' – '))}</b></p>`;
  return choose(host, { ...item, play: item.play || { tonalidad: item.tonalidad, progresion: item.progresion } }, env, { options: CADENCES.map(cap), correct: [right], extraHtml: prog });
}
async function clasificarModulacion(host, item, env) {
  const options = ['dominante', 'subdominante', 'relativa'];
  const sh = shuffledOptions(item, options.map(cap), [options.indexOf(item.respuesta)], env);
  return choose(host, item, env, { options: sh.options, correct: sh.correct });
}

// ---------- Otro nombre para la misma tecla ----------
async function enarmonico(host, item, env) {
  const want = item.respuesta;
  const arm = 0;
  host.innerHTML = `${headHtml(item)}${staffHtml([noteToken(item.nota)], { bars: false, label: `Nota: ${noteText(item.nota, env.nom)}` })}<div class="lm-writer lm-big"></div>
    <div class="controls"><button type="button" class="btn" data-check>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  const w = createStaffWriter(host.querySelector('.lm-writer'), { figures: ['w'], max: 1, nom: env.nom, say: env.say, armadura: arm, accidentals: true });
  await onceClick(host, '[data-check]');
  const got = w.tokens()[0];
  // la misma tecla con otra letra (se admite cualquier nombre enarmónico válido)
  const ok = !!got && tokenMidi(got) === midiOf(item.nota) && got.name[0] !== item.nota[0];
  w.lock([ok ? 'ok' : 'bad']);
  host.querySelector('[data-check]').remove();
  const mark = ok ? 'ok' : 'bad';
  host.querySelector('.lm-feedback').innerHTML = `${ok ? '' : staffHtml([noteToken(want)], { bars: false, label: `Respuesta: ${noteText(want, env.nom)}` })}${whyHtml(mark, item.why || '')}`;
  return { mark, mistake: ok ? null : item.id };
}

// ---------- Agrupar las corcheas de un compás de amalgama ----------
const GROUP_OPTIONS = { '5/8': [[3, 2], [2, 3]], '7/8': [[2, 2, 3], [3, 2, 2], [2, 3, 2]] };
async function agrupar(host, item, env) {
  const tokens = scoreTokens(item.fuente);
  const options = GROUP_OPTIONS[item.compas] || [item.respuesta];
  const draw = g => staffHtml(tokens, { meter: item.compas, agrupacion: g, label: tokens.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ') });
  host.innerHTML = `${headHtml(item)}<div class="lm-agrupar-staff">${draw(null)}</div>
    <div class="lm-classrow" role="group" aria-label="Agrupación"><span class="muted small">Grupos de corcheas</span><div class="lm-names lm-numbers">${options.map(g => `<button type="button" class="lm-name" data-grupo="${g.join('+')}" aria-pressed="false">${g.join(' + ')}</button>`).join('')}</div></div>
    <div class="controls"><button type="button" class="btn" data-check disabled>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  let chosen = null;
  const check = host.querySelector('[data-check]');
  const onClick = e => {
    const b = e.target.closest('[data-grupo]');
    if (!b || b.disabled) return;
    chosen = b.dataset.grupo;
    host.querySelectorAll('[data-grupo]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    host.querySelector('.lm-agrupar-staff').innerHTML = draw(chosen.split('+').map(Number));
    check.disabled = false;
  };
  host.addEventListener('click', onClick);
  await onceClick(host, '[data-check]');
  host.removeEventListener('click', onClick);
  const ok = chosen === item.respuesta.join('+');
  host.querySelectorAll('[data-grupo]').forEach(x => { x.disabled = true; if (x.dataset.grupo === item.respuesta.join('+')) x.classList.add('right'); else if (x.dataset.grupo === chosen) x.classList.add('wrong'); });
  check.remove();
  host.querySelector('.lm-agrupar-staff').innerHTML = draw(item.respuesta);
  return finish(host, item, [ok]);
}

// ---------- ¿Suenan igual? ----------
async function mismoRitmo(host, item, env) {
  const pairs = item.pares;
  const staff = text => { const tk = scoreTokens(text); return staffHtml(tk, { meter: item.compas, label: tk.map(t => tokenLabel(t, env.nom, { pitch: false })).join(', ') }); };
  host.innerHTML = `${headHtml(item)}${pairs.map(([a, b], k) => `<fieldset class="lm-same" data-pair="${k}"><legend>Pareja ${k + 1}</legend>
      <div class="lm-same-row">${playButton(`lmSame${k}`, 'Escuchar las dos')}</div>${staff(a)}${staff(b)}
      <div class="seg two" role="group" aria-label="¿Suenan igual?"><button type="button" data-same="${k}:si" aria-pressed="false">Suenan igual</button><button type="button" data-same="${k}:no" aria-pressed="false">Suenan distinto</button></div></fieldset>`).join('')}
    <div class="controls"><button type="button" class="btn" data-check disabled>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  // las dos seguidas, solo el ritmo (palmas)
  pairs.forEach(([a, b], k) => host.querySelector(`#lmSame${k}`).addEventListener('click', () => {
    playQuestion({ partitura: `| ${[a, b].map(x => x.replace(/[|]/g, '').trim()).join(' | ')} |`, compas: item.compas, tempo: 84, clap: true }, env);
  }));
  const answers = {};
  const check = host.querySelector('[data-check]');
  const onClick = e => {
    const b = e.target.closest('[data-same]');
    if (!b || b.disabled) return;
    const [k, v] = b.dataset.same.split(':');
    answers[k] = v;
    b.closest('fieldset').querySelectorAll('[data-same]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    check.disabled = Object.keys(answers).length < pairs.length;
  };
  host.addEventListener('click', onClick);
  await onceClick(host, '[data-check]');
  host.removeEventListener('click', onClick);
  stopSound();
  const oks = pairs.map(([, , same], k) => (answers[k] === 'si') === !!same);
  host.querySelectorAll('[data-same]').forEach(x => { x.disabled = true; });
  host.querySelectorAll('fieldset').forEach((f, k) => f.classList.add(oks[k] ? 'ok' : 'bad'));
  check.remove();
  const right = oks.filter(Boolean).length;
  const mark = right === pairs.length ? 'ok' : right * 2 >= pairs.length ? 'near' : 'bad';
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || '');
  return { mark, mistake: mark === 'ok' ? null : item.id };
}

// ---------- Invertir un intervalo ----------
const SPECIES = [['M', 'Mayor'], ['m', 'Menor'], ['J', 'Justo'], ['A', 'Aumentado'], ['d', 'Disminuido']];
async function invertirIntervalo(host, item, env) {
  const [a, b] = item.notas;
  const tokens = [a, b].map(noteToken);
  const rows = [
    { key: 'num', label: 'Número', options: [2, 3, 4, 5, 6, 7, 8].map(n => [String(n), `${n}.ª`]) },
    { key: 'esp', label: 'Especie', options: SPECIES },
  ];
  host.innerHTML = `${headHtml(item)}${playButton('lmQPlay')}${staffHtml(tokens, { bars: false, label: `Dos notas: ${tokens.map(t => tokenLabel(t, env.nom)).join(', ')}` })}${rowsHtml(rows)}`;
  host.querySelector('.lm-q').focus();
  host.querySelector('#lmQPlay').addEventListener('click', () => playQuestion({ notas: item.notas }, env));
  const { ok } = await pickRows(host, rows, { num: item.respuesta.numero, esp: item.respuesta.especie });
  return finish(host, item, ok);
}

// ---------- Notas reales y notas extrañas al acorde ----------
async function clasificarNotas(host, item, env) {
  const tokens = scoreTokens(item.partitura);
  const arm = item.armadura || armaduraOf(item.tonalidad);
  const sounding = tokens.filter(t => !t.rest);
  host.innerHTML = `${headHtml(item)}${staffHtml(tokens, { meter: item.compas, armadura: arm, label: tokens.map(t => tokenLabel(t, env.nom)).join(', ') })}
    <div class="lm-realrows">${sounding.map((t, k) => `<div class="lm-classrow" role="group" aria-label="Nota ${k + 1}"><span class="muted small">Nota ${k + 1} (${esc(noteText(t.name, env.nom))})</span>
      <div class="seg two"><button type="button" data-real="${k}:real" aria-pressed="false">Real</button><button type="button" data-real="${k}:extraña" aria-pressed="false">Extraña</button></div></div>`).join('')}</div>
    <div class="controls"><button type="button" class="btn" data-check disabled>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  const answers = {};
  const check = host.querySelector('[data-check]');
  const onClick = e => {
    const b = e.target.closest('[data-real]');
    if (!b || b.disabled) return;
    const [k, v] = b.dataset.real.split(':');
    answers[k] = v;
    b.closest('.seg').querySelectorAll('[data-real]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    check.disabled = Object.keys(answers).length < sounding.length;
  };
  host.addEventListener('click', onClick);
  await onceClick(host, '[data-check]');
  host.removeEventListener('click', onClick);
  const oks = sounding.map((_, k) => answers[k] === item.respuesta[k]);
  host.querySelectorAll('[data-real]').forEach(x => { x.disabled = true; const [k, v] = x.dataset.real.split(':'); if (item.respuesta[k] === v) x.classList.add('right'); else if (answers[k] === v) x.classList.add('wrong'); });
  check.remove();
  const right = oks.filter(Boolean).length;
  const mark = right === sounding.length ? 'ok' : right * 2 >= sounding.length ? 'near' : 'bad';
  host.querySelector('.lm-feedback').innerHTML = whyHtml(mark, item.why || '');
  return { mark, mistake: mark === 'ok' ? null : item.id };
}

// ---------- Claves de do y de fa en 3.ª ----------
async function ubicarNota(host, item, env) {
  const clef = CLEF[item.clave];
  const rows = [
    { key: 'tipo', label: 'Dónde', options: [['linea', 'Línea'], ['espacio', 'Espacio']] },
    { key: 'n', label: 'Cuál (de abajo arriba)', options: [1, 2, 3, 4, 5].map(n => [String(n), `${n}.ª`]) },
  ];
  host.innerHTML = `${headHtml(item)}${staffHtml([noteToken(item.nota)], { clef, bars: false, label: `Una nota en clave de ${item.clave}` })}${rowsHtml(rows)}`;
  host.querySelector('.lm-q').focus();
  const { ok } = await pickRows(host, rows, { tipo: item.respuesta.tipo, n: item.respuesta.n });
  return finish(host, item, ok);
}
async function nombreEnClave(host, item, env) {
  const clef = CLEF[item.clave];
  const want = item.respuesta;
  const shown = noteAtPosition(item.posicion, clef);
  host.innerHTML = `${headHtml(item)}${staffHtml([noteToken(shown)], { clef, bars: false, label: `Una nota en clave de ${item.clave}` })}
    ${nameButtons(LETTERS, env.nom)}
    <div class="lm-classrow" role="group" aria-label="Octava"><span class="muted small">Octava</span><div class="lm-names lm-numbers">${[2, 3, 4, 5].map(o => `<button type="button" class="lm-name" data-oct="${o}" aria-pressed="false">${o}</button>`).join('')}</div></div>
    <div class="controls"><button type="button" class="btn" data-check disabled>Comprobar</button></div><div class="lm-feedback"></div>`;
  host.querySelector('.lm-q').focus();
  const chosen = {};
  const check = host.querySelector('[data-check]');
  const onClick = e => {
    const b = e.target.closest('[data-name],[data-oct]');
    if (!b || b.disabled) return;
    const k = b.hasAttribute('data-name') ? 'name' : 'oct';
    chosen[k] = b.dataset[k];
    host.querySelectorAll(`[data-${k}]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    check.disabled = !(chosen.name && chosen.oct);
  };
  host.addEventListener('click', onClick);
  await onceClick(host, '[data-check]');
  host.removeEventListener('click', onClick);
  const oks = [chosen.name === want[0], chosen.oct === want.slice(1)];
  host.querySelectorAll('[data-name],[data-oct]').forEach(x => { x.disabled = true; });
  check.remove();
  return finish(host, item, oks);
}

// ---------- Adornos ----------
async function reconocerOrnamento(host, item, env) {
  const tokens = scoreTokens(item.partitura);
  const arm = item.armadura || 0;
  const options = item.opciones;
  const sh = shuffledOptions(item, options.map(cap), [options.indexOf(item.respuesta)], env);
  const staff = staffHtml(tokens, { meter: item.compas, armadura: arm, ornaments: item.ornamentos, label: `${tokens.map(t => tokenLabel(t, env.nom)).join(', ')} con un adorno` });
  return choose(host, item, env, { options: sh.options, correct: sh.correct, extraHtml: staff });
}
async function realizarOrnamento(host, item, env) {
  const tokens = scoreTokens(item.partitura);
  const arm = item.armadura || 0;
  const sh = shuffledOptions(item, item.opciones, item.correctas, env);
  const staff = staffHtml(tokens, { meter: item.compas, armadura: arm, ornaments: item.ornamentos, label: `${tokens.map(t => tokenLabel(t, env.nom)).join(', ')} con un adorno` });
  return choose(host, item, env, { options: sh.options, correct: sh.correct, extraHtml: staff, optionHtml: o => optionCells(o, env, arm) });
}

export const QUIZ_KINDS_4 = {
  identificarGrado, clasificarAcorde, construirAcorde, armonizar, clasificarCadencia, clasificarModulacion, enarmonico, agrupar, mismoRitmo,
  invertirIntervalo, clasificarNotas, ubicarNota, nombreEnClave, reconocerOrnamento, realizarOrnamento,
  escucharAcorde: (host, item, env) => elegir(host, { ...item, play: { ...item.play, acorde: true } }, env),
  escucharCadencia: elegir, escucharModulacion: elegir, escucharRitmo: elegir, escucharOrnamento: elegir,
};
