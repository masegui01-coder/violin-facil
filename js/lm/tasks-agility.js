// Agilidad de notas: aparece una nota en el pentagrama y hay que nombrarla antes de que se acabe su tiempo.
// Fácil («nombrar»): un tiempo fijo por nota. Media («leer-a-tempo»): las notas llegan a tempo y el tempo sube.
// Se guarda el récord de aciertos de cada ejercicio.
import { esc } from '../ui.js';
import { rng } from '../generate.js';
import { gradeAgility, mistakeCodes } from './grade.js';
import { stepOf, positionText, letterText, barBeatsOf, LETTERS, keyAcc, midiOf, interval, accOfName } from './notes.js';
import { noteCell, clefCell } from './staff-lm.js';
import { nameButtons, nameText, namesFor, CLEF, GLYPH } from './kit.js';
import { parseKey, degreeOf, triadOfDegree, parseNumeral, numeralFor, enharmonicNames, TRIAD_TYPES, triadFromRoot } from './harmony.js';
import { chordStaff } from './tasks-quiz4.js';
import { wait, clicks, now, stopSound } from './sound.js';

const LEAD_IN_S = 0.6;
import { recordOf, saveRecord } from './results.js';

const FEEDBACK_MS = 450;
const TICK_MS = 50;
const BEATS_PER_NOTE = 2; // a tempo: una nota cada dos pulsos

// Plan del ejercicio: cuántas notas, cuánto tiempo para cada una y qué nota sale (sin repetir la anterior)
// Serie de notas al azar que no se puede adivinar sin leer: con muchas notas, nunca la misma dos veces seguidas; con
// dos o tres, se permite repetir (como mucho dos seguidas) y la serie se rehace si alternar o repetir siempre la misma
// nota, o decir «la misma que antes» o «la contraria de antes», acertaría el 60 % o más (con la bolsa sol/mi,
// «sol, mi, sol, mi…» ya no aprueba). Con pocas notas, al menos 16 por serie, y la nota se corrige por el azar.
const MAX_RUN = 2;
const GUESS_LIMIT = 0.6;
const MAX_TRIES = 200;
const SMALL_POOL = 3;
export const MIN_SMALL_NOTES = 16;
export function guessable(notes, pool) {
  const share = f => notes.filter((n, i) => n === f(i)).length / notes.length;
  const guesses = [...pool.map(n => () => n), ...pool.flatMap(a => pool.filter(b => b !== a).map(b => i => (i % 2 ? b : a)))];
  if (guesses.some(g => share(g) >= GUESS_LIMIT)) return true;
  // la misma que la anterior / otra distinta de la anterior (al azar entre las demás)
  const moves = notes.slice(1).map((n, i) => n === notes[i]);
  const same = moves.filter(Boolean).length / Math.max(1, moves.length);
  const other = (1 - same) / Math.max(1, pool.length - 1);
  return same >= GUESS_LIMIT || other >= GUESS_LIMIT;
}
// Nota sobre 100 descontado el azar: con k botones, contestar a ciegas acierta 1 de cada k y debe dar 0
export function chanceCorrected(pct, k) {
  if (k < 2) return pct;
  const p = pct / 100;
  return Math.max(0, Math.round(100 * (p - 1 / k) / (1 - 1 / k)));
}
export function noteSeries(pool, count, r) {
  const small = pool.length <= SMALL_POOL;
  let notes = [];
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    notes = [];
    for (let i = 0; i < count; i++) {
      const run = i >= MAX_RUN && notes.slice(-MAX_RUN).every(n => n === notes[i - 1]);
      const options = pool.length > 1 && (!small || run) ? pool.filter(n => n !== notes[i - 1]) : pool;
      notes.push(options[Math.floor(r() * options.length)]);
    }
    if (pool.length < 2 || !guessable(notes, pool)) break;
  }
  return notes;
}

// Una serie con las dos claves: cada nota sale en una clave al azar, sin rachas de más de MAX_CLEF_RUN en la misma. Cada
// elemento es «clave:nota» («sol:C5», «fa:G2»): la clave va con la nota, y la misma nota puede salir en las dos (do4)
const MAX_CLEF_RUN = 3;
export function mixedSeries(pools, count, r) {
  const out = [];
  let run = 0;
  let last = null;
  // las claves de la serie: sol y fa, o las que traiga la bolsa (do4 y fa3 en el Nivel 4)
  const clefs = Object.keys(pools);
  for (let i = 0; i < count; i++) {
    let clef = clefs[Math.floor(r() * clefs.length)];
    if (clef === last && run >= MAX_CLEF_RUN) clef = clefs.find(c => c !== last);
    run = clef === last ? run + 1 : 1;
    last = clef;
    const options = pools[clef].filter(n => `${clef}:${n}` !== out[i - 1]);
    out.push(`${clef}:${options[Math.floor(r() * options.length)]}`);
  }
  return out;
}

// Dos notas seguidas para contar su intervalo: { a, b, number } con notas naturales de la bolsa y los números pedidos.
// Con «especies» (Nivel 3: «3M», «4A»…), las dos notas salen de la bolsa con sus alteraciones y se pide también la especie
export function intervalSeries(pool, numbers, count, r, especies = null) {
  if (especies && especies.length) return speciesSeries(pool, numbers, count, r, especies);
  const steps = [...new Set(pool)].sort((x, y) => stepOf(x) - stepOf(y));
  const has = n => steps.find(x => stepOf(x) === n);
  const out = [];
  for (let i = 0; i < count; i++) {
    let item = null;
    for (let tries = 0; tries < 60 && !item; tries++) {
      const number = numbers[(i + Math.floor(r() * 2)) % numbers.length];
      const a = steps[Math.floor(r() * steps.length)];
      const up = r() < 0.5;
      const b = has(stepOf(a) + (up ? 1 : -1) * (number - 1));
      if (b && JSON.stringify([a, b]) !== JSON.stringify(out[i - 1] && [out[i - 1].a, out[i - 1].b])) item = { a, b, number };
    }
    out.push(item || { a: steps[0], b: has(stepOf(steps[0]) + numbers[0] - 1) || steps[1], number: numbers[0] });
  }
  return out;
}

function speciesSeries(pool, numbers, count, r, especies) {
  const names = [...new Set(pool)];
  // todas las parejas de la bolsa cuyo intervalo es de los pedidos, con su código («3M»)
  const pairs = [];
  names.forEach(a => names.forEach(b => {
    if (a === b || midiOf(a) >= midiOf(b)) return;
    const iv = interval(a, b);
    if (numbers.includes(iv.number) && especies.includes(iv.code)) pairs.push({ a, b, number: iv.number, code: iv.code });
  }));
  const out = [];
  for (let i = 0; i < count; i++) {
    // las especies se turnan para que salgan todas; la misma pareja no sale dos veces seguidas
    const want = especies[(i + Math.floor(r() * 2)) % especies.length];
    const options = pairs.filter(p => p.code === want && !(out[i - 1] && out[i - 1].a === p.a && out[i - 1].b === p.b));
    const from = options.length ? options : pairs;
    const pick = from[Math.floor(r() * from.length)];
    // hacia abajo la mitad de las veces: la nota grave se enseña la segunda
    out.push(r() < 0.5 ? pick : { ...pick, a: pick.b, b: pick.a });
  }
  return out;
}

// Una armadura que aparece y se responde con su tonalidad (Nivel 3): −3 … 3
const MAJOR_OF = { '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F', 0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#' };
const RELATIVE_OF = { '-7': 'Ab', '-6': 'Eb', '-5': 'Bb', '-4': 'F', '-3': 'C', '-2': 'G', '-1': 'D', 0: 'A', 1: 'E', 2: 'B', 3: 'F#', 4: 'C#', 5: 'G#', 6: 'D#', 7: 'A#' };
export const keyAnswers = n => ({ major: MAJOR_OF[n], minor: RELATIVE_OF[n] });
function armaduraSeries(armaduras, count, r) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const options = armaduras.filter(a => a !== out[i - 1]);
    out.push(options[Math.floor(r() * options.length)]);
  }
  return out;
}

const isMixed = p => p.clave === 'mixta' || p.clave === 'gran';
// Las bolsas de notas por clave: un objeto { sol, fa } o, en el repaso, una lista de las dos (sol: do4 o más; fa: do4 o menos)
export function poolsOf(p) {
  if (!isMixed(p)) return null;
  if (!Array.isArray(p.notas)) return { ...p.notas };
  const c4 = stepOf('C4');
  return { sol: p.notas.filter(n => stepOf(n) >= c4), fa: p.notas.filter(n => stepOf(n) <= c4) };
}

export function agilityPlan(p, seed) {
  const r = rng(seed);
  const pools = poolsOf(p);
  const pool = pools ? Object.values(pools).flat() : p.notas;
  const small = pool.length <= SMALL_POOL && !['armadura', 'grado', 'fundamental', 'acorde'].includes(p.modo);
  let count = p.cantidad;
  let secs;
  if (p.modo === 'leer-a-tempo') {
    const [lo, hi] = Array.isArray(p.tempo) ? p.tempo : [p.tempo || 80, p.tempo || 80];
    count = Math.max(small ? MIN_SMALL_NOTES : 4, Math.round((p.compases || 4) * barBeatsOf(p.compas || '4/4') / BEATS_PER_NOTE));
    secs = Array.from({ length: count }, (_, i) => (60 / (lo + (hi - lo) * (count > 1 ? i / (count - 1) : 0))) * BEATS_PER_NOTE);
  } else secs = Array(Math.max(count || 12, small ? MIN_SMALL_NOTES : 0)).fill(p.segundosPorNota || 3);
  if (p.modo === 'armadura') return { notes: armaduraSeries(p.armaduras || [-3, -2, -1, 0, 1, 2, 3], secs.length, r), secs, keys: true, both: /relativa/.test(p.respuesta || '') };
  if (p.modo === 'grado') return { notes: degreeSeries(p, secs.length, r), secs, degree: true };
  if (p.modo === 'fundamental') return { notes: rootSeries(p, secs.length, r), secs, root: true };
  if (p.modo === 'acorde') return { notes: chordSeries(p, secs.length, r), secs, chord: true };
  if (p.modo === 'enarmonica') return { notes: noteSeries(pool, secs.length, r), secs, enh: true };
  if (p.modo === 'intervalo') return { notes: intervalSeries(pool, p.intervalos || [2, 3, 4, 5], secs.length, r, p.especies), secs, intervals: true, species: !!(p.especies && p.especies.length) };
  if (pools) return { notes: mixedSeries(pools, secs.length, r), secs, mixed: true };
  return { notes: noteSeries(pool, secs.length, r), secs };
}
// ---- Nivel 4: grado de una nota, fundamental de un grado, clase de una tríada, notas enarmónicas ----
// Una nota de la bolsa llevada a la escala de la tonalidad (con la armadura puesta: el fa de Sol M es fa♯)
const inKey = (name, key) => {
  const k = parseKey(key);
  return name[0] + ({ '-1': 'b', 0: '', 1: '#' })[keyAcc(name[0], k.armadura)] + name.slice(-1);
};
function degreeSeries(p, count, r) {
  const pool = [...new Set(p.notas)];
  const out = [];
  for (let i = 0; i < count; i++) {
    let item = null;
    for (let tries = 0; tries < 50 && !item; tries++) {
      const key = p.tonalidades[Math.floor(r() * p.tonalidades.length)];
      const note = inKey(pool[Math.floor(r() * pool.length)], key);
      const d = degreeOf(key, note);
      const cand = { key, note, grado: d && d.grado };
      if (d && JSON.stringify([cand.key, cand.note]) !== JSON.stringify(out[i - 1] && [out[i - 1].key, out[i - 1].note])) item = cand;
    }
    out.push(item || { key: p.tonalidades[0], note: 'C4', grado: 1 });
  }
  return out;
}
const rootOf = (key, numeral) => triadOfDegree(key, parseNumeral(numeral).grado).root.replace(/[0-9]$/, '');
const GRADE_NUMBER = { I: 1, IV: 4, V: 5, II: 2, III: 3, VI: 6, VII: 7 };
function rootSeries(p, count, r) {
  const out = [];
  for (let i = 0; i < count; i++) {
    let item = null;
    for (let tries = 0; tries < 40 && !item; tries++) {
      const key = p.tonalidades[Math.floor(r() * p.tonalidades.length)];
      const g = p.grados[Math.floor(r() * p.grados.length)];
      const numeral = numeralFor(key, GRADE_NUMBER[g]);
      const cand = { key, numeral, root: rootOf(key, numeral) };
      if (!out[i - 1] || out[i - 1].key !== key || out[i - 1].numeral !== numeral) item = cand;
    }
    out.push(item);
  }
  return out;
}
const CHORD_ROOTS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb3', 'Eb4', 'F#3', 'B3'];
function chordSeries(p, count, r) {
  const types = p.tipos || TRIAD_TYPES;
  const out = [];
  for (let i = 0; i < count; i++) {
    // los tipos se turnan para que salgan todos; la raíz es al azar
    const tipo = types[(i + Math.floor(r() * 2)) % types.length];
    const root = CHORD_ROOTS[Math.floor(r() * CHORD_ROOTS.length)];
    out.push({ tipo, notes: triadFromRoot(root, tipo) });
  }
  return out;
}
// Todas las fundamentales posibles (para los botones) y el otro nombre de una nota
const rootNames = p => [...new Set(p.tonalidades.flatMap(k => p.grados.map(g => rootOf(k, numeralFor(k, GRADE_NUMBER[g])))))];
const enhOf = name => enharmonicNames(name)[0].replace(/[0-9]$/, '');
const noteLetters = names => [...new Set(names)].sort((x, y) => LETTERS.indexOf(x[0]) - LETTERS.indexOf(y[0]) || x.length - y.length);

// La respuesta de una nota: su nombre con alteración y sin octava («C», «Bb», «F#»)
export const answerOf = name => name.replace(/[0-9]$/, '');

// Botones de respuesta de la agilidad: las siete notas (con la armadura, el si de un bemol es si♭); en Fácil, solo las
// de la unidad. En el modo «intervalo», los números de intervalo (2.ª … 8.ª).
const SPECIES_TEXT = { M: 'mayor', m: 'menor', J: 'justa', A: 'aumentada', d: 'disminuida' };
const SPECIES_BUTTONS = [['M', 'Mayor'], ['m', 'Menor'], ['J', 'Justo'], ['A', 'Aum.'], ['d', 'Dism.']];
const KEY_NAMES = { C: 'Do', G: 'Sol', D: 'Re', A: 'La', F: 'Fa', Bb: 'Si♭', Eb: 'Mi♭', E: 'Mi', B: 'Si', 'F#': 'Fa♯', Ab: 'La♭', Db: 'Re♭', Gb: 'Sol♭', Cb: 'Do♭', 'C#': 'Do♯', 'G#': 'Sol♯', 'D#': 'Re♯', 'A#': 'La♯' };
export function answerButtons(p, variant, nom) {
  if (p.modo === 'grado') return `<div class="lm-names lm-numbers" role="group" aria-label="Grado">${[1, 2, 3, 4, 5, 6, 7].map(n => `<button type="button" class="lm-name" data-name="${n}">${n}</button>`).join('')}</div>`;
  if (p.modo === 'acorde') return `<div class="lm-names lm-numbers" role="group" aria-label="Clase de tríada">${(p.tipos || TRIAD_TYPES).map(t => `<button type="button" class="lm-name" data-name="${t}">${t[0].toUpperCase()}${t.slice(1)}</button>`).join('')}</div>`;
  if (p.modo === 'fundamental') return nameButtons(noteLetters(rootNames(p)), nom);
  if (p.modo === 'enarmonica') return nameButtons(noteLetters([...new Set(p.notas.map(n => n.replace(/[0-9]$/, '')))].flatMap(n => [n, enhOf(n + '4')])), nom);
  if (p.modo === 'intervalo') {
    const numbers = p.intervalos || [2, 3, 4, 5];
    const nums = `<div class="lm-names lm-numbers" role="group" aria-label="Intervalos">${numbers.map(n => `<button type="button" class="lm-name" data-name="${n}">${n}.ª</button>`).join('')}</div>`;
    // con especies, una segunda fila: M, m, J, A, d (se pulsa después del número)
    const kinds = (p.especies || []).map(x => x.slice(1));
    return p.especies && p.especies.length ? `${nums}<div class="lm-names lm-numbers lm-species" role="group" aria-label="Especie">${SPECIES_BUTTONS.filter(([v]) => kinds.includes(v)).map(([v, t]) => `<button type="button" class="lm-name" data-esp="${v}">${t}</button>`).join('')}</div>` : nums;
  }
  // armadura → tonalidad: la mayor y, en Media, también su relativa menor
  if (p.modo === 'armadura') {
    const both = /relativa/.test(p.respuesta || '');
    const arms = p.armaduras || [-3, -2, -1, 0, 1, 2, 3];
    const names = arms.map(a => MAJOR_OF[a]);
    const row = (label, list, attr) => `<div class="lm-names" role="group" aria-label="${label}">${list.map(k => `<button type="button" class="lm-name" ${attr}="${k}">${esc(KEY_NAMES[k])}${attr === 'data-minor' ? ' m' : ''}</button>`).join('')}</div>`;
    return `${row('Tonalidad mayor', names, 'data-name')}${both ? row('Su relativa menor', arms.map(a => RELATIVE_OF[a]), 'data-minor') : ''}`;
  }
  const pools = poolsOf(p);
  const all = pools ? Object.values(pools).flat() : p.notas;
  const arm = p.armadura || 0;
  const names = namesFor(arm);
  // Fácil: solo los nombres de las notas de la unidad (al empezar son dos o tres); Media: los siete
  // las notas con alteración que no pone la armadura (sol♯ en la menor armónica, mi♭ sin armadura…) tienen su botón
  const extra = all.map(answerOf).filter(n => !names.includes(n));
  const sorted = [...names.map(n => n), ...extra].filter((n, i, l) => l.indexOf(n) === i).sort((x, y) => LETTERS.indexOf(x[0]) - LETTERS.indexOf(y[0]) || x.length - y.length);
  const shown = variant === 'facil' ? sorted.filter(n => all.some(x => answerOf(x) === n)) : sorted.filter(n => !extra.some(e => e[0] === n[0]) || extra.includes(n) || all.some(x => answerOf(x) === n));
  return nameButtons(shown, nom);
}

// Una nota (o dos, en el intervalo) en su clave: el escenario de la pregunta. «gran»: gran pentagrama con las dos claves
// Signo que hay que dibujar delante de una nota suelta: el que la armadura no pone ya ('#', 'b' o 'n' el becuadro)
const signOf = (name, arm) => {
  const acc = accOfName(name);
  const key = keyAcc(name[0], arm);
  return acc === key ? null : acc === 1 ? '#' : acc === -1 ? 'b' : 'n';
};
function stageHtml(item, plan, p, arm) {
  const wide = 56;
  // Nivel 4: una nota con la armadura de su tonalidad (grado), un acorde escrito, la tonalidad y el grado, o una nota con alteración
  if (plan.degree) {
    const k = parseKey(item.key);
    return `<span class="lm-sc" aria-hidden="true">${clefCell('treble', null, k.armadura)}</span><span class="lm-ag-note" id="lmAgNote" role="img">${noteCell({ step: stepOf(item.note), dur: 'w', clef: 'treble', w: wide, acc: signOf(item.note, k.armadura) })}<span class="lm-ag-key">${item.key}</span></span>`;
  }
  if (plan.root) {
    const k = parseKey(item.key);
    return `<span class="lm-sc" aria-hidden="true">${clefCell('treble', null, k.armadura)}</span><span class="lm-ag-note" id="lmAgNote" role="img"><span class="lm-ag-key">${item.key} · ${item.numeral}</span></span>`;
  }
  if (plan.chord) return `<span class="lm-ag-note" id="lmAgNote" role="img">${chordStaff(item.notes, { label: 'Una tríada' })}</span>`;
  if (plan.enh) return `<span class="lm-sc" aria-hidden="true">${clefCell('treble', null, 0)}</span><span class="lm-ag-note" id="lmAgNote" role="img">${noteCell({ step: stepOf(item), dur: 'w', clef: 'treble', w: wide, acc: signOf(item, 0) })}</span>`;
  if (plan.keys) {
    const clef = CLEF[p.clave] || 'treble';
    return `<span class="lm-sc" aria-hidden="true">${clefCell(clef, null, item)}</span><span class="lm-ag-note" id="lmAgNote" role="img" aria-label="Una armadura">${noteCell({ step: null, clef, w: wide })}</span>`;
  }
  if (plan.intervals) {
    const clef = CLEF[p.clave] || 'treble';
    return `<span class="lm-sc" aria-hidden="true">${clefCell(clef, null, arm)}</span><span class="lm-ag-note" id="lmAgNote" role="img">${noteCell({ step: stepOf(item.a), dur: 'w', clef, w: wide, acc: signOf(item.a, arm) })}${noteCell({ step: stepOf(item.b), dur: 'w', clef, w: wide, acc: signOf(item.b, arm) })}</span>`;
  }
  if (plan.mixed && p.clave === 'gran') {
    const [clefName, name] = item.split(':');
    const clef = clefName === 'fa' ? 'bass' : 'treble';
    const row = c => `<span class="lm-ag-row"><span class="lm-sc" aria-hidden="true">${clefCell(c, null, arm)}</span><span class="lm-sc">${noteCell(c === clef ? { step: stepOf(name), dur: 'w', clef: c, w: wide, acc: signOf(name, arm) } : { step: null, clef: c, w: wide })}</span></span>`;
    return `<span class="lm-ag-grand" id="lmAgNote" role="img">${row('treble')}${row('bass')}</span>`;
  }
  const [clefName, name] = plan.mixed ? item.split(':') : [p.clave, item];
  const clef = CLEF[clefName] || 'treble';
  return `<span class="lm-sc" aria-hidden="true">${clefCell(clef, null, arm)}</span><span class="lm-ag-note" id="lmAgNote" role="img">${noteCell({ step: stepOf(name), dur: 'w', clef, w: wide, acc: signOf(name, arm) })}</span>`;
}

// Lo que dice la armadura, en palabras (hasta tres alteraciones)
const ARM_TEXT = { '-1': 'un bemol: el si es si♭', '-2': 'dos bemoles: el si es si♭ y el mi es mi♭', '-3': 'tres bemoles: si♭, mi♭ y la♭', 1: 'un sostenido: el fa es fa♯', 2: 'dos sostenidos: fa♯ y do♯', 3: 'tres sostenidos: fa♯, do♯ y sol♯' };
export const keyNotice = arm => `Armadura de ${ARM_TEXT[arm] || `${Math.abs(arm)} alteraciones`}.`;

export async function agilityTask(host, p, env) {
  const plan = agilityPlan(p, (env.attempt ?? env.seed) >>> 0); // otra serie en cada intento: no se aprende de memoria
  const arm = p.armadura || 0;
  const key = `agil:${env.id}`;
  const best = recordOf(key);
  const buttons = answerButtons(p, env.variant, env.nom);
  const nameCount = (buttons.match(/data-name/g) || []).length;
  // contestar a ciegas acierta 1 de cada k: con dos pasos (número y especie, mayor y relativa), k es el producto
  const count = p.modo === 'intervalo' && p.especies ? nameCount * (buttons.match(/data-esp/g) || []).length : p.modo === 'armadura' ? nameCount * (/relativa/.test(p.respuesta || '') ? (buttons.match(/data-minor/g) || []).length : 1) : nameCount;
  const intro = plan.degree ? 'Aparece una nota con la armadura de su tonalidad: toca el número de su grado (1 a 7).' : plan.root ? 'Aparecen una tonalidad y un grado: toca el nombre de la nota fundamental de ese acorde.' : plan.chord ? 'Aparece una tríada escrita: toca su clase.' : plan.enh ? 'Aparece una nota con ♯ o ♭: toca su otro nombre (el enarmónico).'
    : plan.keys ? 'Aparece una armadura: toca la tonalidad antes de que se acabe la barra de tiempo.' : plan.intervals ? 'Dos notas seguidas: ¿qué intervalo forman? Cuéntalo antes de que se acabe la barra de tiempo.'
    : p.modo === 'leer-a-tempo' ? 'Las notas llegan con el metrónomo, cada vez más deprisa: nómbralas antes de la siguiente.' : 'Nombra cada nota antes de que se acabe la barra de tiempo.';
  host.innerHTML = `<p class="muted">${intro}</p>${arm ? `<p class="lm-notice">${keyNotice(arm)}</p>` : ''}${plan.mixed ? `<p class="lm-notice">${p.clave === 'gran' ? 'Gran pentagrama: la nota puede estar arriba (clave de sol) o abajo (clave de fa).' : 'Cada nota puede salir en clave de sol o en clave de fa: mira la clave.'}</p>` : ''}
    <p class="muted small">${best ? `<span>Tu récord:</span> <b>${best}</b>` : ''}</p>
    <div class="controls"><button type="button" class="btn big" id="lmAgGo">Empezar</button></div>`;
  host.querySelector('#lmAgGo').focus();
  await new Promise(r => host.querySelector('#lmAgGo').addEventListener('click', r, { once: true }));
  host.innerHTML = `<div class="lm-ag-top"><span id="lmAgCount">1 / ${plan.notes.length}</span><span><span>Aciertos:</span> <b id="lmAgRight">0</b></span></div>
    <div class="lm-ag-stage" id="lmAgStage"></div>
    <div class="lm-ag-time" aria-hidden="true"><i id="lmAgBar"></i></div>
    ${buttons}
    <p id="lmAgFeedback" class="lm-ag-feedback" aria-live="polite"></p>`;
  let right = 0;
  const misses = [];
  // a tempo: un pulso continuo (dos clics por nota, cada vez más deprisa) programado de una vez; cada nota dura su
  // hueco aunque se conteste antes, para no perder el pulso
  const tempo = p.modo === 'leer-a-tempo';
  const slots = plan.secs.reduce((acc, s) => [...acc, (acc.length ? acc[acc.length - 1] : 0) + s], []).map((end, i) => end - plan.secs[i]);
  const t0 = tempo ? now() + LEAD_IN_S : 0;
  if (tempo) plan.secs.forEach((s, i) => clicks(2, 120 / s, { at: t0 + slots[i], accentEvery: 2, level: 0.45 }));
  if (tempo) await wait((t0 - now()) * 1000);
  for (let i = 0; i < plan.notes.length; i++) {
    if (!env.alive()) { stopSound(); return null; }
    const item = plan.notes[i];
    // lo que hay que contestar (nombre con alteración, o el número del intervalo) y cómo se llama la nota para el alumno
    const mixed = plan.mixed ? item.split(':') : null;
    const name = plan.keys || plan.root || plan.chord ? '' : plan.degree ? item.note : plan.intervals ? item.a : mixed ? mixed[1] : item;
    // lo que se contesta, en uno o dos pasos: el nombre (o el número del intervalo) y, si hace falta, la especie o la relativa menor
    const keyOf = plan.keys ? keyAnswers(item) : null;
    const needs = plan.keys ? (plan.both ? ['name', 'minor'] : ['name']) : plan.species ? ['name', 'esp'] : ['name'];
    const correctParts = plan.degree ? [String(item.grado)] : plan.root ? [item.root] : plan.chord ? [item.tipo] : plan.enh ? [enhOf(item)] : plan.keys ? [keyOf.major, keyOf.minor] : plan.species ? [String(item.number), interval(item.a, item.b).quality] : [plan.intervals ? String(item.number) : answerOf(name)];
    const correct = correctParts.slice(0, needs.length).join('|');
    const clefName = plan.intervals ? p.clave : mixed ? mixed[0] : p.clave;
    host.querySelector('#lmAgStage').innerHTML = stageHtml(item, plan, p, arm);
    const noteBox = host.querySelector('#lmAgNote');
    if (name) noteBox.dataset.step = String(stepOf(name));
    noteBox.dataset.name = name;
    noteBox.dataset.answer = correct;
    noteBox.dataset.clef = clefName;
    noteBox.setAttribute('aria-label', plan.degree ? `Nota ${i + 1} en ${item.key}: ${positionText(stepOf(item.note), 'treble')}` : plan.root ? `Tonalidad ${item.key}, grado ${item.numeral}` : plan.chord ? `Tríada ${i + 1}` : plan.enh ? `Nota ${i + 1}: ${positionText(stepOf(item), 'treble')}` : plan.keys ? `Armadura ${i + 1}: ${keyNotice(item)}` : plan.intervals ? `Intervalo ${i + 1}: ${positionText(stepOf(item.a), CLEF[p.clave] || 'treble')} y ${positionText(stepOf(item.b), CLEF[p.clave] || 'treble')}` : `Nota ${i + 1}: ${positionText(stepOf(name), CLEF[clefName] || 'treble')}${mixed ? `, en clave de ${clefName === 'fa' ? 'fa' : 'sol'}` : ''}`);
    host.querySelector('#lmAgCount').textContent = `${i + 1} / ${plan.notes.length}`;
    if (i === 0) host.querySelector('[data-name]').focus();
    const limit = tempo ? Math.max(0, (t0 + slots[i] + plan.secs[i] - now()) * 1000) : plan.secs[i] * 1000;
    const started = performance.now();
    const bar = host.querySelector('#lmAgBar');
    host.querySelectorAll('[data-name],[data-esp],[data-minor]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    const given = {};
    const answer = await new Promise(resolve => {
      const timer = setInterval(() => {
        const t = performance.now() - started;
        bar.style.width = `${Math.max(0, 100 - 100 * t / limit)}%`;
        if (t >= limit || !env.alive()) { clearInterval(timer); host.removeEventListener('click', onPick); resolve(null); }
      }, TICK_MS);
      const onPick = e => {
        const b = e.target.closest('[data-name],[data-esp],[data-minor]');
        if (!b) return;
        const kind = b.hasAttribute('data-esp') ? 'esp' : b.hasAttribute('data-minor') ? 'minor' : 'name';
        if (!needs.includes(kind)) return;
        given[kind] = b.dataset[kind];
        host.querySelectorAll(`[data-${kind}]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        // hasta que no están todos los pasos, se espera
        if (needs.some(k => given[k] === undefined)) return;
        clearInterval(timer);
        host.removeEventListener('click', onPick);
        resolve(needs.map(k => given[k]).join('|'));
      };
      host.addEventListener('click', onPick);
    });
    const ok = answer === correct;
    if (ok) right++;
    else if (plan.species) misses.push(!answer ? `${item.number}-t` : answer.split('|')[0] !== String(item.number) ? `${item.number}>${answer.split('|')[0]}` : 'especie');
    else if (plan.degree || plan.root) misses.push('grado');
    else if (plan.chord) misses.push('acorde');
    else if (plan.enh) misses.push('enarmonia');
    else if (plan.keys) misses.push('armadura');
    else if (plan.intervals) misses.push(answer ? `${correct}>${answer}` : `${correct}-t`);
    else misses.push(answer ? `${name}>${answer}` : `${name}-t`);
    host.querySelector('#lmAgRight').textContent = String(right);
    const fb = host.querySelector('#lmAgFeedback');
    fb.className = `lm-ag-feedback ${ok ? 'ok' : 'bad'}`;
    const shown = plan.degree ? correct : plan.chord ? correct : plan.root || plan.enh ? nameText(correct, env.nom) : plan.keys ? correct.split('|').map((k, j) => `${KEY_NAMES[k]}${j ? ' m' : ' M'}`).join(' · ') : plan.species ? `${item.number}.ª ${SPECIES_TEXT[correct.split('|')[1]]}` : plan.intervals ? `${correct}.ª` : nameText(correct, env.nom);
    fb.innerHTML = `<span class="dict-sw ${ok ? 'ok' : 'bad'}" aria-hidden="true">${GLYPH[ok ? 'ok' : 'bad']}</span> <span>${ok ? '¡Bien!' : answer ? 'Era' : 'Tiempo. Era'}</span>${ok ? '' : ` <b>${esc(shown)}</b>`}`;
    // a tempo, la nota siguiente llega en su pulso; si no, tras un momento para ver la corrección
    await wait(tempo ? (t0 + slots[i] + plan.secs[i] - now()) * 1000 : FEEDBACK_MS);
  }
  // contrato: aciertos sobre el total (los tiempos agotados cuentan como fallo, sin restar más), descontado el azar
  const g = gradeAgility(right, 0, plan.notes.length);
  const pct = chanceCorrected(g.pct, count);
  const record = saveRecord(key, right);
  host.querySelector('#lmAgFeedback').innerHTML = record ? '<b>¡Nuevo récord!</b>' : '';
  return { pct, right, total: plan.notes.length, record, mistakes: mistakeCodes(misses) };
}
