// Discriminación auditiva del Nivel 4 (sin DOM, con semilla): tresillos, tríadas, intervalos y sus inversiones, síncopa,
// cadencias, adornos, compases de amalgama, cambios de compás y hemiola, y modulación. Cada pregunta es del tipo
// «escucha y elige» (options, answer, play, why) y las genera choiceQuestions4(p, count, seed) a partir de las opciones
// escritas en el catálogo; si no reconoce las opciones, devuelve null y se usa el generador de siempre.
import { rng } from '../generate.js';
import { intervalNote } from './notes.js';
import { triadFromRoot, keyScale, parseKey } from './harmony.js';

const norm = o => String(o).toLowerCase();
const cap = s => s[0].toUpperCase() + s.slice(1);

// Elige la respuesta de cada ronda: se turnan todas para que salgan y de vez en cuando una al azar
function picker(options, r) {
  return k => (k % 3 === 0 ? Math.floor(r() * options.length) : (Math.floor(r() * options.length) + k) % options.length);
}
const bars = (bar, n) => `| ${Array(n).fill(bar).join(' | ')} |`;

// ---------- Ritmo: tresillo, síncopa, puntillo ----------
const RHYTHM_CELLS = {
  'dos corcheas': 'C5e C5e C5q', tresillo: 'C5e:3 C5e:3 C5e:3 C5q', 'tresillo con silencio': 'C5e:3 Re:3 C5e:3 C5q',
  'sin síncopa': 'C5q C5q', 'con síncopa': 'C5e C5q C5e', 'en el pulso': 'C5e C5e C5e C5e', contratiempo: 'Re C5e Re C5e', síncopa: 'C5e C5q C5e', puntillo: 'C5q. C5e',
};
const RHYTHM_WHY = {
  'dos corcheas': 'Dos notas en cada pulso, iguales.', tresillo: 'Tres notas iguales en cada pulso: el pulso se divide en tres.', 'tresillo con silencio': 'Tres partes en el pulso, con la del medio en silencio.',
  'sin síncopa': 'Todas las notas empiezan en el pulso.', 'con síncopa': 'Una nota empieza en la parte débil y se sostiene sobre el pulso.', 'en el pulso': 'Las corcheas caen en cada parte, sin silencios.',
  contratiempo: 'Hay silencios en el pulso y las notas caen en la parte débil.', síncopa: 'Una nota empieza a la mitad del pulso y llega al siguiente.', puntillo: 'Una nota larga con puntillo y una corta.',
};
function rhythmQuestions(options, count, seed, r) {
  const pick = picker(options, r);
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const name = norm(options[a]);
    // «dos corcheas» frente a «tresillo» sin más: un compás entero de corcheas o de tresillos
    const simple = options.length === 2 && options.some(o => norm(o) === 'dos corcheas');
    const bar = simple ? (name === 'tresillo' ? 'C5e:3 C5e:3 C5e:3 C5e:3 C5e:3 C5e:3' : 'C5e C5e C5e C5e') : RHYTHM_CELLS[name];
    return { tipo: 'escucharRitmo', id: `ritmo4-${k}`, code: /síncopa|contratiempo|pulso/.test(name) ? 'sincopa' : /tresillo|corcheas/.test(name) ? '3>2' : 'ritmo', q: 'Escucha el ritmo: ¿cuál es?', options: options.map(String), answer: a,
      play: { partitura: bars(bar, 4), compas: '2/4', clap: true, tempo: 76 }, why: RHYTHM_WHY[name] || `Era «${options[a]}».` };
  });
}

// ---------- Tríadas ----------
const ROOTS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'Eb4', 'F#4', 'B3', 'A3'];
function chordQuestions(options, count, seed, r) {
  const pick = picker(options, r);
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const tipo = norm(options[a]);
    // sin dobles alteraciones: si la tríada no se puede escribir, otra raíz
    let notes = null;
    for (let tries = 0; tries < 30 && !(notes && notes.every(Boolean)); tries++) notes = triadFromRoot(ROOTS[Math.floor(r() * ROOTS.length)], tipo);
    const together = r() < 0.5;
    return { tipo: 'escucharAcorde', id: `acorde4-${k}`, code: 'acorde', q: together ? 'Escucha el acorde: ¿de qué clase es?' : 'Escucha el arpegio: ¿de qué clase es la tríada?', options: options.map(cap), answer: a,
      play: { notas: notes, ...(together ? { acorde: true } : {}) },
      why: { mayor: 'Suena luminoso: 3.ª mayor y 3.ª menor.', menor: 'Suena más oscuro: 3.ª menor y 3.ª mayor.', disminuida: 'Suena tensa: dos terceras menores.', aumentada: 'Suena inquieta y abierta: dos terceras mayores.' }[tipo] };
  });
}

// ---------- Intervalos y su inversión ----------
const SPECIES_FOR = { 3: ['M', 'm'], 6: ['M', 'm'], 4: ['J'], 5: ['J'] };
function intervalQuestions(options, count, seed, r) {
  const pick = picker(options, r);
  const starts = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'];
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const number = Number(String(options[a])[0]);
    const kinds = SPECIES_FOR[number];
    const from = starts[Math.floor(r() * starts.length)];
    const to = intervalNote(from, number, kinds[Math.floor(r() * kinds.length)]) || intervalNote(from, number, kinds[0]);
    return { tipo: 'escucharIntervalo', id: `inversion4-${k}`, code: 'inversion', q: 'Escucha el intervalo: ¿qué número tiene?', options: [...options], answer: a,
      play: { notas: [from, to] }, why: number === 3 || number === 6 ? 'La 3.ª y la 6.ª son inversiones una de otra: 3 + 6 = 9.' : 'La 4.ª y la 5.ª son inversiones una de otra: 4 + 5 = 9.' };
  });
}

// ---------- Cadencias ----------
const CADENCE_KEYS = ['Do M', 'Sol M', 'Fa M', 'Re M', 'La m', 'Mi m'];
const CADENCE_PROG = { perfecta: [['I', 'IV', 'V', 'I'], ['I', 'ii', 'V', 'I'], ['V', 'I']], plagal: [['I', 'V', 'IV', 'I'], ['IV', 'I'], ['I', 'ii', 'IV', 'I']], semicadencia: [['I', 'IV', 'V'], ['I', 'vi', 'V'], ['I', 'ii', 'V']], rota: [['I', 'IV', 'V', 'vi'], ['I', 'ii', 'V', 'vi']] };
const CADENCE_WHY = { perfecta: 'V–I: llega a casa, punto final.', plagal: 'IV–I: el «amén».', semicadencia: 'Termina en V: la frase queda abierta, como una coma.', rota: 'V–vi: se esperaba la tónica y llega el sexto grado, una sorpresa.' };
function cadenceQuestions(options, count, seed, r) {
  const pick = picker(options, r);
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const name = norm(options[a]);
    const tonalidad = CADENCE_KEYS[Math.floor(r() * CADENCE_KEYS.length)];
    const minor = parseKey(tonalidad).minor;
    const list = CADENCE_PROG[name];
    // en menor, los acordes se escriben con su clase: i, iv, V, VI…
    const prog = list[Math.floor(r() * list.length)].map(c => (minor ? ({ I: 'i', ii: 'ii°', IV: 'iv', vi: 'VI' })[c] || c : c));
    return { tipo: 'escucharCadencia', id: `cadencia4-${k}`, code: 'cadencia', q: 'Escucha el final de la frase: ¿qué cadencia es?', options: options.map(cap), answer: a,
      play: { tonalidad, progresion: prog }, why: CADENCE_WHY[name] };
  });
}

// ---------- Adornos ----------
const PHRASES = ['| G4q A4q |', '| C5q B4q |', '| E5q D5q |'];
function ornamentQuestions(options, count, seed, r) {
  const pick = picker(options, r);
  const single = !options.some(o => /sin adorno/.test(norm(o)));
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const name = norm(options[a]);
    const signo = single ? name : ['trino', 'mordente'][Math.floor(r() * 2)];
    const play = single
      ? { partitura: '| D5h |', compas: '2/4', ornamentos: [{ indice: 0, signo }] }
      : /sin adorno/.test(name) ? { partitura: `${PHRASES[k % PHRASES.length]}`, compas: '2/4' } : { partitura: `| G4h A4h |`, compas: '4/4', ornamentos: [{ indice: 0, signo }] };
    return { tipo: 'escucharOrnamento', id: `adorno4-${k}`, code: 'ornamento', q: single ? 'Escucha: ¿qué adorno suena?' : 'Escucha la frase: ¿lleva adorno?', options: options.map(cap), answer: a, play,
      why: single ? { trino: 'Alterna la nota con su vecina y acaba en ella.', mordente: 'Principal, vecina de abajo y principal, muy rápido.', apoyatura: 'Una nota vecina que toma la mitad del valor y resuelve.', grupeto: 'Cuatro notas: vecina de arriba, principal, vecina de abajo y principal.' }[name] : /sin adorno/.test(name) ? 'Todas las notas suenan como se escriben.' : 'Una nota se adorna con un trino o un mordente.' };
  });
}

// ---------- Compases: amalgama, cambios de compás y hemiola ----------
const PITCH_OF = { F: 'C3', m: 'G3', d: 'G4' };
const eighths = pat => pat.split('').map(c => `${PITCH_OF[c]}e`).join(' ');
const METER_PATTERN = { '5/8 (3+2)': 'Fddmd', '5/8 (2+3)': 'Fdmdd', '7/8 (2+2+3)': 'Fdmdmdd', '5/8': 'Fddmd', '6/8': 'Fddmdd', '6/8 (3+3)': 'Fddmdd', '3/4 (2+2+2)': 'Fdmdmd' };
function amalgamQuestions(options, count, seed, r) {
  const pick = picker(options, r);
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const name = options[a];
    const pat = METER_PATTERN[name];
    const meter = name.startsWith('7') ? '7/8' : name.startsWith('5') ? '5/8' : name.startsWith('6') ? '6/8' : '3/4';
    const text = eighths(pat);
    return { tipo: 'escucharCompas', id: `amalgama4-${k}`, code: /^7/.test(name) ? '7/8>agr' : '5/8>2+3', q: 'Escucha dónde caen los apoyos: ¿qué compás es?', options: [...options], answer: a,
      play: { partitura: bars(text, 4), compas: meter, tempo: 132 }, why: `Era ${name}: el apoyo grave marca el inicio de cada compás y el medio, el de cada grupo.` };
  });
}
function meterChangeQuestions(options, count, seed, r) {
  const pick = picker(options, r);
  const hemiola = options.some(o => /hemiola/.test(norm(o)));
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const name = norm(options[a]);
    let text;
    let why;
    if (hemiola) {
      const six = eighths('Fddmdd');
      const three = eighths('Fdmdmd');
      text = /hemiola/.test(name) ? `| ${[three, six, three, six].join(' | ')} |` : /6\/8/.test(name) ? bars(six, 4) : bars(three, 4);
      why = /hemiola/.test(name) ? 'Alternan dos grupos de tres con tres grupos de dos: la hemiola.' : /6\/8/.test(name) ? 'Dos grupos de tres corcheas.' : 'Tres grupos de dos corcheas.';
    } else {
      const bar3 = 'C3q G4q G4q';
      const bar2 = 'C3q G4q';
      text = /cambia/.test(name) ? `| ${bar3} | ${bar2} | ${bar3} | ${bar2} |` : bars(bar3, 4);
      why = /cambia/.test(name) ? 'El compás se acorta: de tres pulsos pasa a dos.' : 'Todos los compases tienen tres pulsos.';
    }
    return { tipo: 'escucharCompas', id: `cambio4-${k}`, code: 'cambio', q: 'Escucha los compases: ¿cómo siguen?', options: [...options], answer: a,
      play: { partitura: text, tempo: hemiola ? 150 : 100 }, why };
  });
}

// ---------- Modulación ----------
const MODULATIONS = [
  { desde: 'Do M', hasta: 'Sol M', rel: 'dominante' }, { desde: 'Sol M', hasta: 'Re M', rel: 'dominante' }, { desde: 'Fa M', hasta: 'Do M', rel: 'dominante' },
  { desde: 'Do M', hasta: 'Fa M', rel: 'subdominante' }, { desde: 'Sol M', hasta: 'Do M', rel: 'subdominante' },
  { desde: 'Do M', hasta: 'La m', rel: 'relativa' }, { desde: 'La m', hasta: 'Do M', rel: 'relativa' },
];
// Una frase de cuatro compases: dos en el tono de salida y dos en el de llegada, acabando en la tónica de llegada
function modulatingPhrase(desde, hasta) {
  const a = keyScale(desde, { harm: true });
  const b = keyScale(hasta, { harm: true });
  const q = (sc, ds) => ds.map(d => `${sc[(d - 1) % 7]}q`).join(' ');
  return `| ${q(a, [1, 3, 5, 3])} | ${q(a, [2, 4, 3, 2])} | ${q(b, [3, 5, 7, 5])} | ${b[0]}w |`;
}
function stayingPhrase(desde) {
  const a = keyScale(desde, { harm: true });
  const q = (ds) => ds.map(d => `${a[(d - 1) % 7]}q`).join(' ');
  return `| ${q([1, 3, 5, 3])} | ${q([2, 4, 3, 2])} | ${q([5, 3, 2, 4])} | ${a[0]}w |`;
}
function modulationQuestions(options, count, seed, r) {
  const pick = picker(options, r);
  return Array.from({ length: count }, (_, k) => {
    const a = pick(k);
    const name = norm(options[a]);
    const stay = /^no modula/.test(name);
    const want = stay ? null : /dominante/.test(name) && !/sub/.test(name) ? 'dominante' : /subdominante/.test(name) ? 'subdominante' : /relativo/.test(name) ? 'relativa' : null;
    const pool = want ? MODULATIONS.filter(m => m.rel === want) : MODULATIONS;
    const m = pool[Math.floor(r() * pool.length)];
    const text = stay ? stayingPhrase(m.desde) : modulatingPhrase(m.desde, m.hasta);
    return { tipo: 'escucharModulacion', id: `modula4-${k}`, code: 'modula', q: 'Escucha la melodía: ¿se queda en su tonalidad o modula?', options: [...options], answer: a,
      play: { partitura: text, compas: '4/4', tempo: 84 }, why: stay ? 'Todas las notas son de la tonalidad y acaba en su tónica.' : 'Aparece una nota nueva y la frase acaba en la tónica de otra tonalidad.' };
  });
}

export function choiceQuestions4(p, count, seed) {
  const options = p.opciones || [];
  if (!options.length) return null;
  const r = rng(seed);
  if (options.every(o => RHYTHM_CELLS[norm(o)])) return rhythmQuestions(options, count, seed, r);
  if (options.every(o => ['mayor', 'menor', 'disminuida', 'aumentada'].includes(norm(o))) && options.length >= 2 && options.includes('mayor') && options.includes('menor') && !options.some(o => /natural|armónica|melódica/.test(o))) return chordQuestions(options, count, seed, r);
  if (options.every(o => /^[3-6]\.ª$/.test(o))) return intervalQuestions(options, count, seed, r);
  if (options.every(o => ['perfecta', 'plagal', 'semicadencia', 'rota'].includes(norm(o)))) return cadenceQuestions(options, count, seed, r);
  if (options.every(o => ['sin adorno', 'con adorno', 'trino', 'mordente', 'apoyatura', 'grupeto', 'acciaccatura'].includes(norm(o)))) return ornamentQuestions(options, count, seed, r);
  if (options.every(o => METER_PATTERN[o]) && options.some(o => /^[57]\/8/.test(o))) return amalgamQuestions(options, count, seed, r);
  if (options.some(o => /hemiola|cambia a/.test(norm(o)))) return meterChangeQuestions(options, count, seed, r);
  if (options.some(o => /modula/.test(norm(o)))) return modulationQuestions(options, count, seed, r);
  return null;
}
