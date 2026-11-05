// Digitaciones por instrumento (notas escritas). Trompeta: combinación de pistones.
// Madera: agujeros/llaves pulsados. Formato: "T L1 L2 L3 R1 R2 R3 +Llave" (T = pulgar, 8va = llave de octava o registro,
// 8va² = 2.ª llave de octava (lateral) del oboe, L1½ = medio agujero del oboe). Llaves con flecha: «Re↑» de palma (saxo),
// «Mi♭→» lateral (clarinete y saxo). Las fichas del diagrama son cortas; el texto dice qué llave es y con qué mano.
// Las tablas de madera cubren el registro de las lecciones (fuente: Woodwind Fingering Guide, digitaciones «Basic»)
// y están marcadas como «en revisión».
import { fingering as violinFingering, fingerText as violinText } from './music.js';

const TRUMPET = {
  54: '123', 55: '13', 56: '23', 57: '12', 58: '1', 59: '2', 60: '', 61: '123', 62: '13', 63: '23', 64: '12', 65: '1', 66: '2',
  67: '', 68: '23', 69: '12', 70: '1', 71: '2', 72: '', 73: '12', 74: '1', 75: '2', 76: '', 77: '1', 78: '2', 79: '', 80: '23',
  81: '12', 82: '1', 83: '2', 84: '',
};
// Con 1-3 y 1-2-3 la trompeta sale alta: en Fa#3, Sol3, Do#4 y Re4 (escritos) se saca la bomba del 3.er pistón
const TRUMPET_SLIDE = new Set([54, 55, 61, 62]);

const FLUTE = {
  60: 'T L1 L2 L3 R1 R2 R3 +Do', 61: 'T L1 L2 L3 R1 R2 R3 +Do♯', 62: 'T L1 L2 L3 R1 R2 R3', 63: 'T L1 L2 L3 R1 R2 R3 +Mi♭',
  64: 'T L1 L2 L3 R1 R2 +Mi♭', 65: 'T L1 L2 L3 R1 +Mi♭', 66: 'T L1 L2 L3 R3 +Mi♭', 67: 'T L1 L2 L3 +Mi♭',
  68: 'T L1 L2 L3 +Sol♯ +Mi♭', 69: 'T L1 L2 +Mi♭', 70: 'T L1 R1 +Mi♭', 71: 'T L1 +Mi♭', 72: 'L1 +Mi♭', 73: '+Mi♭',
  74: 'T L2 L3 R1 R2 R3', 75: 'T L2 L3 R1 R2 R3 +Mi♭', 76: 'T L1 L2 L3 R1 R2 +Mi♭', 77: 'T L1 L2 L3 R1 +Mi♭',
  78: 'T L1 L2 L3 R3 +Mi♭', 79: 'T L1 L2 L3 +Mi♭', 80: 'T L1 L2 L3 +Sol♯ +Mi♭', 81: 'T L1 L2 +Mi♭', 82: 'T L1 R1 +Mi♭',
  83: 'T L1 +Mi♭', 84: 'L1 +Mi♭', 85: '+Mi♭',
  // Tercera octava
  86: 'T L2 L3 +Mi♭', 87: 'T L1 L2 L3 R1 R2 R3 +Sol♯ +Mi♭', 88: 'T L1 L2 R1 R2 +Mi♭', 89: 'T L1 L3 R1 +Mi♭',
  90: 'T L1 L3 R3 +Mi♭', 91: 'L1 L2 L3 +Mi♭', 92: 'L2 L3 +Sol♯ +Mi♭', 93: 'T L2 R1 +Mi♭',
};

// Clarinete (Boehm). Llaves de meñique por su nota del chalumeau: Mi (Mi/Si), Fa (Fa/Do), Fa♯ (Fa♯/Do♯),
// La♭ (La♭/Mi♭, meñique derecho) y Do♯ (Do♯/Sol♯, meñique izquierdo); Mi♭→ es la 4.ª llave lateral de la derecha.
const CLARINET = {
  52: 'T L1 L2 L3 R1 R2 R3 +Mi', 53: 'T L1 L2 L3 R1 R2 R3 +Fa', 54: 'T L1 L2 L3 R1 R2 R3 +Fa♯', 55: 'T L1 L2 L3 R1 R2 R3',
  56: 'T L1 L2 L3 R1 R2 R3 +La♭', 57: 'T L1 L2 L3 R1 R2', 58: 'T L1 L2 L3 R1', 59: 'T L1 L2 L3 R2', 60: 'T L1 L2 L3',
  61: 'T L1 L2 L3 +Do♯', 62: 'T L1 L2', 63: 'T L1 L2 +Mi♭→', 64: 'T L1', 65: 'T', 66: 'L1', 67: '', 68: '+Sol♯', 69: '+La',
  70: '+La 8va', 71: '8va T L1 L2 L3 R1 R2 R3 +Mi', 72: '8va T L1 L2 L3 R1 R2 R3 +Fa', 73: '8va T L1 L2 L3 R1 R2 R3 +Fa♯',
  74: '8va T L1 L2 L3 R1 R2 R3', 75: '8va T L1 L2 L3 R1 R2 R3 +La♭', 76: '8va T L1 L2 L3 R1 R2', 77: '8va T L1 L2 L3 R1',
  78: '8va T L1 L2 L3 R2', 79: '8va T L1 L2 L3', 80: '8va T L1 L2 L3 +Do♯', 81: '8va T L1 L2', 82: '8va T L1 L2 +Mi♭→',
  83: '8va T L1', 84: '8va T',
  // Sobreagudo
  85: '8va T L2 L3 R1 R2', 86: '8va T L2 L3 R1 +La♭', 87: '8va T L2 L3 R3 +La♭', 88: '8va T L2 L3 +La♭', 89: '8va T L2 L3 +Do♯ +La♭', 90: '8va T L2 +La♭',
  91: '8va T L2 R1 R2 +La♭',
};

const SAX = {
  58: 'L1 L2 L3 R1 R2 R3 +Si♭', 59: 'L1 L2 L3 R1 R2 R3 +Si', 60: 'L1 L2 L3 R1 R2 R3 +Do', 61: 'L1 L2 L3 R1 R2 R3 +Do♯',
  62: 'L1 L2 L3 R1 R2 R3', 63: 'L1 L2 L3 R1 R2 R3 +Mi♭', 64: 'L1 L2 L3 R1 R2', 65: 'L1 L2 L3 R1', 66: 'L1 L2 L3 R2',
  67: 'L1 L2 L3', 68: 'L1 L2 L3 +Sol♯', 69: 'L1 L2', 70: 'L1 +Bis', 71: 'L1', 72: 'L2', 73: '',
  74: '8va L1 L2 L3 R1 R2 R3', 75: '8va L1 L2 L3 R1 R2 R3 +Mi♭', 76: '8va L1 L2 L3 R1 R2', 77: '8va L1 L2 L3 R1',
  78: '8va L1 L2 L3 R2', 79: '8va L1 L2 L3', 80: '8va L1 L2 L3 +Sol♯', 81: '8va L1 L2', 82: '8va L1 +Bis', 83: '8va L1',
  84: '8va L2', 85: '8va',
  // Llaves de palma (Re↑, Mi♭↑, Fa↑) y la lateral de Mi agudo (Mi→)
  86: '8va +Re↑', 87: '8va +Re↑ +Mi♭↑', 88: '8va +Re↑ +Mi♭↑ +Mi→', 89: '8va +Re↑ +Mi♭↑ +Fa↑ +Mi→',
};

// Oboe semiautomático (el habitual en los conservatorios): 1.ª llave de octava (pulgar) de Mi5 a Sol♯5 y 2.ª (lateral, con el
// índice) de La5 a Do6. L1½ = medio agujero del índice izquierdo.
const OBOE = {
  58: 'L1 L2 L3 R1 R2 R3 +Si♭ +Do', 59: 'L1 L2 L3 R1 R2 R3 +Si +Do', 60: 'L1 L2 L3 R1 R2 R3 +Do', 61: 'L1 L2 L3 R1 R2 R3 +Do♯',
  62: 'L1 L2 L3 R1 R2 R3', 63: 'L1 L2 L3 R1 R2 R3 +Mi♭', 64: 'L1 L2 L3 R1 R2', 65: 'L1 L2 L3 R1 R2 +Fa', 66: 'L1 L2 L3 R1',
  67: 'L1 L2 L3', 68: 'L1 L2 L3 +Sol♯', 69: 'L1 L2', 70: 'L1 L2 R1', 71: 'L1', 72: 'L1 R1',
  73: 'L1½ L2 L3 R1 R2 R3 +Do♯', 74: 'L1½ L2 L3 R1 R2 R3', 75: 'L1½ L2 L3 R1 R2 R3 +Mi♭',
  76: '8va L1 L2 L3 R1 R2', 77: '8va L1 L2 L3 R1 R2 +Fa', 78: '8va L1 L2 L3 R1', 79: '8va L1 L2 L3', 80: '8va L1 L2 L3 +Sol♯',
  81: '8va² L1 L2', 82: '8va² L1 L2 R1', 83: '8va² L1', 84: '8va² L1 R1',
  // Tercera octava
  85: 'L2 L3 R1 +Do', 86: 'L1½ L2 L3 R2 +Do', 87: 'L1½ L2 L3 R2 R3 +Mi♭', 88: '8va L1½ L2 L3 R2 R3 +Sol♯ +Mi♭',
  89: '8va L1½ L2 R2 R3 +Sol♯ +Mi♭',
};

// Familias con la misma digitación escrita: saxos, clarinetes, flauta y flautín, y los metales en clave de sol en Si♭
const SAME_AS = { 'sax-tenor': 'sax', 'sax-bari': 'sax', 'sax-soprano': 'sax', 'bass-clarinet': 'clarinet', 'eb-clarinet': 'clarinet', piccolo: 'flute', flugelhorn: 'trumpet', euphonium: 'trumpet' };

// Metales: cada combinación de pistones baja la nota abierta (un armónico) unos semitonos; la vara del trombón, igual.
// Armónicos en notas escritas. Se elige el armónico más cercano por encima (lo habitual en las tablas).
const VALVES_BY_DROP = ['', '2', '1', '12', '23', '13', '123'];
const PARTIALS = {
  horn: [55, 60, 64, 67, 72, 74, 76, 79, 84],      // trompa en Fa: Sol3, Do4, Mi4, Sol4, Do5, Re5, Mi5, Sol5, Do6
  tuba: [34, 41, 46, 50, 53, 58, 60],              // tuba en Si♭ (clave de fa): Si♭1, Fa2, Si♭2, Re3, Fa3, Si♭3, Do4
  trombone: [34, 46, 53, 58, 62, 65, 70, 72],      // trombón: Si♭1, Si♭2, Fa3, Si♭3, Re4, Fa4, Si♭4, Do5
};
export function brassDrop(instId, midi) {
  const partial = PARTIALS[instId].find(p => p >= midi && p - midi <= 6);
  return partial === undefined ? null : partial - midi;
}
const WOODWIND = { flute: FLUTE, clarinet: CLARINET, sax: SAX, oboe: OBOE };
const HAS_THUMB = { flute: true, clarinet: true, sax: false, oboe: false };
const OCTAVE_NAME = { clarinet: 'registro', sax: 'octava', oboe: 'octava', flute: 'octava' };
// Lo que no cabe en la ficha: de qué llave se trata y con qué mano se toca
const KEY_TEXT = {
  clarinet: {
    Mi: 'Mi/Si (meñique izq.)', Fa: 'Fa/Do (meñique der.)', 'Fa♯': 'Fa♯/Do♯ (meñique izq.)', 'La♭': 'La♭/Mi♭ (meñique der.)',
    'Do♯': 'Do♯/Sol♯ (meñique izq.)', 'Mi♭→': 'lateral de Mi♭/Si♭ (la de abajo)',
  },
};

function parseKeys(spec, instId) {
  const tokens = spec.split(' ').filter(Boolean);
  return {
    type: 'keys', thumb: HAS_THUMB[instId], thumbOn: tokens.includes('T'), octave: tokens.includes('8va') || tokens.includes('8va²'),
    octave2: tokens.includes('8va²'), octaveName: OCTAVE_NAME[instId], instId,
    holes: ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'].filter(h => tokens.includes(h)),
    half: ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'].filter(h => tokens.includes(h + '½')),
    extras: tokens.filter(t => t.startsWith('+')).map(t => t.slice(1)),
  };
}

// Nombre de una llave en el texto: «Re↑» es la de palma (mano izquierda), «Mi→» la lateral (mano derecha)
export function keyName(extra, instId) {
  const known = (KEY_TEXT[instId] || {})[extra];
  if (known) return known;
  if (extra.endsWith('↑')) return `de palma ${extra.slice(0, -1)} (mano izq.)`;
  if (extra.endsWith('→')) return `lateral ${extra.slice(0, -1)} (mano der.)`;
  return extra;
}

// Flauta dulce soprano, digitación barroca (la de casi toda flauta moderna). T = pulgar, ½ = medio pulgar.
// Agujeros 1-3 mano izquierda y 4-7 derecha; el 6 y el 7 son dobles: «6½»/«7½» = se tapa solo el agujero grande.
// Notas escritas (suena una octava más aguda). El Do♯6 necesita tapar la campana: se remite a la tabla.
const RECORDER = {
  60: 'T 1 2 3 4 5 6 7', 61: 'T 1 2 3 4 5 6 7½', 62: 'T 1 2 3 4 5 6', 63: 'T 1 2 3 4 5 6½', 64: 'T 1 2 3 4 5', 65: 'T 1 2 3 4 6 7', 66: 'T 1 2 3 5 6', 67: 'T 1 2 3',
  68: 'T 1 2 4 5 6', 69: 'T 1 2', 70: 'T 1 3 4', 71: 'T 1', 72: 'T 2', 73: '1 2', 74: '2', 75: '2 3 4 5 6',
  76: '½ 1 2 3 4 5', 77: '½ 1 2 3 4 6', 78: '½ 1 2 3 5', 79: '½ 1 2 3', 80: '½ 1 2 4', 81: '½ 1 2',
  82: '½ 1 2 4 5 6', 83: '½ 1 2 4 5', 84: '½ 1 4 5', 86: '½ 1 3 4 6',
};

// Guitarra en primera posición (hasta el traste 5): la cuerda donde la nota queda más cerca de la cejuela.
// midi ESCRITO (suena una octava más grave).
const GUITAR_STRINGS = [40, 45, 50, 55, 59, 64];
const GUITAR_MAX_FRET = 5;
// Nombre de cada cuerda por su número (1 = la de abajo al tocar)
export const STRING_NAMES = {
  guitar: { eu: { 1: 'Mi aguda', 2: 'Si', 3: 'Sol', 4: 'Re', 5: 'La', 6: 'Mi grave' }, us: { 1: 'high E', 2: 'B', 3: 'G', 4: 'D', 5: 'A', 6: 'low E' } },
  ukulele: { eu: { 1: 'La', 2: 'Mi', 3: 'Do', 4: 'Sol agudo' }, us: { 1: 'A', 2: 'E', 3: 'C', 4: 'high G' } },
};
export const stringName = (instId, n, nom) => ((STRING_NAMES[instId] || STRING_NAMES.guitar)[nom === 'us' ? 'us' : 'eu'])[n];
export function guitarPosition(writtenMidi) {
  const sounding = writtenMidi - 12;
  const options = GUITAR_STRINGS.map((open, i) => ({ string: 6 - i, fret: sounding - open })).filter(o => o.fret >= 0 && o.fret <= GUITAR_MAX_FRET);
  if (!options.length) return null;
  return options.sort((a, b) => a.fret - b.fret || a.string - b.string)[0];
}

// Ukelele: se escribe como suena. Cuerdas de la 4.ª (Sol agudo) a la 1.ª (La)
// Las melodías agudas suben por la cuerda La más allá del traste 5 (el soprano del colegio tiene 12 trastes).
const UKULELE_STRINGS = [67, 60, 64, 69];
const UKULELE_MAX_FRET = 12;
// Dedo para un traste: en primera posición, dedo = traste y el 5 con el meñique (4) sin moverse; más arriba, un dedo por
// traste con el índice en el 5 (5.ª posición) y en el 9 (9.ª)
export const fretFinger = fret => (fret <= 5 ? Math.min(4, fret) : 1 + ((fret - 5) % 4));
export function ukulelePosition(midi) {
  const options = UKULELE_STRINGS.map((open, i) => ({ string: 4 - i, fret: midi - open })).filter(o => o.fret >= 0 && o.fret <= UKULELE_MAX_FRET);
  if (!options.length) return null;
  return options.sort((a, b) => a.fret - b.fret || a.string - b.string)[0];
}

// Octava de la tecla contada desde el Do central (Do4 = octava 4)
const PIANO_OCTAVE = {
  1: 'tres octavas por debajo del Do central', 2: 'dos octavas por debajo del Do central', 3: 'una octava por debajo del Do central',
  4: 'junto al Do central', 5: 'una octava por encima del Do central', 6: 'dos octavas por encima del Do central', 7: 'tres octavas por encima del Do central',
};

// Devuelve la digitación de una nota escrita o null si no está en las tablas
// Lo que no comparte digitación con su familia: el flautín empieza en Re4 y el sobreagudo del clarinete bajo es propio
const OWN_LIMITS = { piccolo: [62, 108], 'bass-clarinet': [0, 84] };

export function fingeringFor(rawId, midi) {
  const instId = SAME_AS[rawId] || rawId;
  const limits = OWN_LIMITS[rawId];
  if (limits && (midi < limits[0] || midi > limits[1])) return null;
  if (instId === 'guitar') {
    const pos = guitarPosition(midi);
    return pos ? { type: 'fret', ...pos } : null;
  }
  if (instId === 'ukulele') {
    const pos = ukulelePosition(midi);
    return pos ? { type: 'fret', ...pos } : null;
  }
  if (instId === 'piano') return midi >= 21 && midi <= 108 ? { type: 'key', midi } : null;
  if (instId === 'xylophone') return midi >= 60 && midi <= 96 ? { type: 'bar', midi } : null;
  if (instId === 'recorder') {
    if (!(midi in RECORDER)) return null;
    const t = RECORDER[midi].split(' ');
    return { type: 'recorder', thumb: t.includes('T') ? 'closed' : t.includes('½') ? 'half' : 'open', holes: t.filter(x => /^\d$/.test(x)).map(Number), half: t.filter(x => /^\d½$/.test(x)).map(x => Number(x[0])) };
  }
  if (instId === 'trombone') {
    const drop = brassDrop('trombone', midi);
    return drop === null ? null : { type: 'slide', position: drop + 1 };
  }
  if (instId === 'horn' || instId === 'tuba') {
    const drop = brassDrop(instId, midi);
    return drop === null ? null : { type: 'valves', valves: VALVES_BY_DROP[drop].split('').filter(Boolean).map(Number), slide: false };
  }
  if (instId === 'violin' || instId === 'cello') {
    const f = violinFingering(midi, instId);
    return f ? { type: 'violin', ...f } : null;
  }
  if (instId === 'trumpet') {
    return midi in TRUMPET ? { type: 'valves', valves: TRUMPET[midi].split('').map(Number), slide: TRUMPET_SLIDE.has(midi) } : null;
  }
  const table = WOODWIND[instId];
  return table && midi in table ? parseKeys(table[midi], instId) : null;
}

export const fingeringsReviewed = instId => ['recorder', 'violin', 'cello', 'trumpet', 'flugelhorn', 'euphonium', 'horn', 'trombone', 'tuba', 'guitar', 'ukulele', 'piano', 'xylophone'].includes(instId);


const HAND = { L: 'izq.', R: 'der.' };

// Xilófono: las láminas naturales se cuentan desde el Do escrito Do5 (la 1, la más larga); las alteradas van en la fila de atrás
const BAR_STEP = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
export const isNaturalBar = midi => midi % 12 in BAR_STEP;
export const xyloBar = midi => (Math.floor(midi / 12) - 6) * 7 + BAR_STEP[midi % 12] + 1;
function xyloText(midi) {
  if (!isNaturalBar(midi)) {
    const n = xyloBar(midi - 1);
    return n >= 1 ? `Fila de atrás, entre las láminas ${n} y ${n + 1}` : 'Fila de atrás, antes de la lámina 1 (xilófono grande)';
  }
  const n = xyloBar(midi);
  if (n < 1) return 'Más grave que la lámina 1 (xilófono grande)';
  if (n === 1) return 'Lámina 1: la más larga, a la izquierda';
  return n <= 8 ? `Lámina ${n} desde la izquierda` : `Lámina ${n}: la segunda octava`;
}

// Las notas con 1-3 y 1-2-3 salen altas: cada instrumento las corrige a su manera
const SLIDE_HINT = {
  trumpet: ' · saca la bomba del 3.er pistón',
  flugelhorn: ' · tiende a salir alta: corrígela con el oído',
  euphonium: ' · tiende a salir alta: usa el 4.º pistón si lo tienes',
};
export function fingeringText(instId, midi, nom) {
  if (instId === 'violin' || instId === 'cello') return violinText(midi, nom, instId);
  const f = fingeringFor(instId, midi);
  if (!f) return 'Digitación: consulta tu tabla o a tu profesor';
  if (f.type === 'fret') return `Cuerda ${f.string} (${stringName(instId, f.string, nom)}) · ${f.fret ? `traste ${f.fret}, dedo ${fretFinger(f.fret)}` : 'al aire'}`;
  if (f.type === 'bar') return xyloText(midi);
  if (f.type === 'key') return midi === 60 ? 'El Do central' : `Tecla ${PIANO_OCTAVE[Math.floor(midi / 12) - 1] || ''}`.trim();
  if (f.type === 'recorder') {
    const thumb = f.thumb === 'closed' ? 'pulgar' : f.thumb === 'half' ? 'medio pulgar' : 'sin pulgar';
    const holes = f.holes.length ? ` · ${f.holes.length === 1 ? 'agujero' : 'agujeros'} ${f.holes.join('-')}` : ' · todo abierto';
    const half = f.half.map(h => ` · solo el agujero grande del ${h}`).join('');
    return `${thumb}${holes}${half}`;
  }
  if (f.type === 'slide') return `Vara en la ${f.position}.ª posición`;
  if (f.type === 'valves') {
    const [one, many] = instId === 'horn' ? ['Cilindro ', 'Cilindros '] : ['Pistón ', 'Pistones '];
    if (!f.valves.length) return instId === 'horn' ? 'Sin cilindros (al aire)' : 'Sin pistones (al aire)';
    const list = f.valves.length === 1 ? String(f.valves[0]) : `${f.valves.slice(0, -1).join(', ')} y ${f.valves[f.valves.length - 1]}`;
    return (f.valves.length === 1 ? one : many) + list + (f.slide ? SLIDE_HINT[instId] || SLIDE_HINT.trumpet : '');
  }
  const parts = [];
  if (f.octave) parts.push(f.octave2 ? 'llave de octava 2.ª (lateral)' : 'llave de ' + f.octaveName);
  if (f.thumbOn) parts.push('pulgar');
  f.half.forEach(x => parts.push(`medio agujero ${HAND[x[0]]} ${x[1]}`));
  ['L', 'R'].forEach(h => {
    const fingers = f.holes.filter(x => x[0] === h).map(x => x[1]);
    if (fingers.length) parts.push(`${HAND[h]} ${fingers.join('-')}`);
  });
  f.extras.forEach(e => parts.push('llave ' + keyName(e, f.instId)));
  return parts.length ? parts.join(' · ') : 'Todo abierto';
}
