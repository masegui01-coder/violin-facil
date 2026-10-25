// Digitaciones por instrumento (notas escritas). Trompeta: combinación de pistones.
// Madera: agujeros/llaves pulsados. Formato: "T L1 L2 L3 R1 R2 R3 +Llave" (T = pulgar, 8va = llave de octava o registro).
// Las tablas de madera cubren el registro de las lecciones y están marcadas como «en revisión».
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
};

const CLARINET = {
  52: 'T L1 L2 L3 R1 R2 R3 +Mi', 53: 'T L1 L2 L3 R1 R2 R3 +Fa', 54: 'T L1 L2 L3 R1 R2 R3 +Fa♯', 55: 'T L1 L2 L3 R1 R2 R3', 57: 'T L1 L2 L3 R1 R2',
  59: 'T L1 L2 L3 R1', 60: 'T L1 L2 L3', 62: 'T L1 L2', 64: 'T L1', 65: 'T', 66: 'L1', 67: '', 68: '+Sol♯', 69: '+La',
  70: '+La 8va', 71: '8va T L1 L2 L3 R1 R2 R3 +Mi', 72: '8va T L1 L2 L3 R1 R2 R3 +Fa', 74: '8va T L1 L2 L3 R1 R2 R3',
  73: '8va T L1 L2 L3 R1 R2 R3 +Fa♯', 76: '8va T L1 L2 L3 R1 R2', 78: '8va T L1 L2 L3 R1', 79: '8va T L1 L2 L3', 81: '8va T L1 L2', 83: '8va T L1', 84: '8va T',
};

const SAX = {
  58: 'L1 L2 L3 R1 R2 R3 +Si♭', 59: 'L1 L2 L3 R1 R2 R3 +Si', 60: 'L1 L2 L3 R1 R2 R3 +Do', 61: 'L1 L2 L3 R1 R2 R3 +Do♯',
  62: 'L1 L2 L3 R1 R2 R3', 63: 'L1 L2 L3 R1 R2 R3 +Mi♭', 64: 'L1 L2 L3 R1 R2', 65: 'L1 L2 L3 R1', 66: 'L1 L2 L3 R2',
  67: 'L1 L2 L3', 68: 'L1 L2 L3 +Sol♯', 69: 'L1 L2', 70: 'L1 +Bis', 71: 'L1', 72: 'L2', 73: '',
  74: '8va L1 L2 L3 R1 R2 R3', 75: '8va L1 L2 L3 R1 R2 R3 +Mi♭', 76: '8va L1 L2 L3 R1 R2', 77: '8va L1 L2 L3 R1',
  78: '8va L1 L2 L3 R2', 79: '8va L1 L2 L3', 80: '8va L1 L2 L3 +Sol♯', 81: '8va L1 L2', 82: '8va L1 +Bis', 83: '8va L1',
  84: '8va L2', 85: '8va',
};

const OBOE = {
  60: 'L1 L2 L3 R1 R2 R3 +Do', 62: 'L1 L2 L3 R1 R2 R3', 63: 'L1 L2 L3 R1 R2 R3 +Mi♭', 64: 'L1 L2 L3 R1 R2',
  67: 'L1 L2 L3', 69: 'L1 L2', 71: 'L1', 76: '8va L1 L2 L3 R1 R2', 79: '8va L1 L2 L3', 81: '8va L1 L2', 83: '8va L1',
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

function parseKeys(spec, instId) {
  const tokens = spec.split(' ').filter(Boolean);
  return {
    type: 'keys', thumb: HAS_THUMB[instId], thumbOn: tokens.includes('T'), octave: tokens.includes('8va'), octaveName: OCTAVE_NAME[instId],
    holes: ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'].filter(h => tokens.includes(h)),
    extras: tokens.filter(t => t.startsWith('+')).map(t => t.slice(1)),
  };
}

// Flauta dulce soprano, digitación alemana (la de casi todas las flautas escolares). T = pulgar, ½ = medio pulgar.
// Agujeros 1-3 mano izquierda y 4-7 derecha. Notas escritas (suena una octava más aguda).
const RECORDER = {
  60: 'T 1 2 3 4 5 6 7', 62: 'T 1 2 3 4 5 6', 64: 'T 1 2 3 4 5', 65: 'T 1 2 3 4', 66: 'T 1 2 3 5 6', 67: 'T 1 2 3',
  68: 'T 1 2 4 5 6', 69: 'T 1 2', 70: 'T 1 3 4', 71: 'T 1', 72: 'T 2', 73: '1 2', 74: '2', 75: '2 3 4 5 6',
  76: '½ 1 2 3 4 5', 77: '½ 1 2 3 4 6', 79: '½ 1 2 3', 81: '½ 1 2', 83: '½ 1 2 4 5', 84: '½ 1 4 5',
};
// Con digitación barroca (pone «B» en la flauta) el Fa grave es distinto
export const RECORDER_BAROQUE_F = 'T 1 2 3 4 6 7';

// Guitarra en primera posición (hasta el traste 5): la cuerda donde la nota queda más cerca de la cejuela.
// midi ESCRITO (suena una octava más grave).
const GUITAR_STRINGS = [40, 45, 50, 55, 59, 64];
const GUITAR_MAX_FRET = 5;
const GUITAR_STRING_EU = ['Mi grave', 'La', 'Re', 'Sol', 'Si', 'Mi aguda'];
export function guitarPosition(writtenMidi) {
  const sounding = writtenMidi - 12;
  const options = GUITAR_STRINGS.map((open, i) => ({ string: 6 - i, fret: sounding - open })).filter(o => o.fret >= 0 && o.fret <= GUITAR_MAX_FRET);
  if (!options.length) return null;
  return options.sort((a, b) => a.fret - b.fret || a.string - b.string)[0];
}

const PIANO_OCTAVE = { 2: 'octava grave', 3: 'a la izquierda del Do central', 4: 'junto al Do central', 5: 'octava aguda', 6: 'muy aguda' };

// Devuelve la digitación de una nota escrita o null si no está en las tablas
export function fingeringFor(rawId, midi) {
  const instId = SAME_AS[rawId] || rawId;
  if (instId === 'guitar') {
    const pos = guitarPosition(midi);
    return pos ? { type: 'fret', ...pos } : null;
  }
  if (instId === 'piano') return midi >= 21 && midi <= 108 ? { type: 'key', midi } : null;
  if (instId === 'recorder') {
    if (!(midi in RECORDER)) return null;
    const t = RECORDER[midi].split(' ');
    return { type: 'recorder', thumb: t.includes('T') ? 'closed' : t.includes('½') ? 'half' : 'open', holes: t.filter(x => /^\d$/.test(x)).map(Number) };
  }
  if (instId === 'trombone') {
    const drop = brassDrop('trombone', midi);
    return drop === null ? null : { type: 'slide', position: drop + 1 };
  }
  if (instId === 'horn' || instId === 'tuba') {
    const drop = brassDrop(instId, midi);
    return drop === null ? null : { type: 'valves', valves: VALVES_BY_DROP[drop].split('').filter(Boolean).map(Number), slide: false };
  }
  if (instId === 'violin') {
    const f = violinFingering(midi);
    return f ? { type: 'violin', ...f } : null;
  }
  if (instId === 'trumpet') {
    return midi in TRUMPET ? { type: 'valves', valves: TRUMPET[midi].split('').map(Number), slide: TRUMPET_SLIDE.has(midi) } : null;
  }
  const table = WOODWIND[instId];
  return table && midi in table ? parseKeys(table[midi], instId) : null;
}

export const fingeringsReviewed = instId => ['recorder', 'violin', 'trumpet', 'flugelhorn', 'euphonium', 'horn', 'trombone', 'tuba', 'guitar', 'piano'].includes(instId);


const HAND = { L: 'izq.', R: 'der.' };

export function fingeringText(instId, midi, nom) {
  if (instId === 'violin') return violinText(midi, nom);
  const f = fingeringFor(instId, midi);
  if (!f) return 'Digitación: consulta tu tabla o a tu profesor';
  if (f.type === 'fret') return `Cuerda ${f.string} (${GUITAR_STRING_EU[6 - f.string]}) · ${f.fret ? `traste ${f.fret}, dedo ${Math.min(4, f.fret)}` : 'al aire'}`;
  if (f.type === 'key') return midi === 60 ? 'El Do central' : `Tecla ${PIANO_OCTAVE[Math.floor(midi / 12) - 1] || ''}`.trim();
  if (f.type === 'recorder') {
    const thumb = f.thumb === 'closed' ? 'pulgar' : f.thumb === 'half' ? 'medio pulgar' : 'sin pulgar';
    const holes = f.holes.length ? ` · ${f.holes.length === 1 ? 'agujero' : 'agujeros'} ${f.holes.join('-')}` : ' · todo abierto';
    return `${thumb}${holes}${midi === 65 ? ' (alemana)' : ''}`;
  }
  if (f.type === 'slide') return `Vara en la ${f.position}.ª posición`;
  if (f.type === 'valves') {
    if (!f.valves.length) return 'Sin pistones (al aire)';
    return (f.valves.length === 1 ? 'Pistón ' : 'Pistones ') + f.valves.join(' y ') + (f.slide ? ' · saca la bomba del 3.er pistón' : '');
  }
  const parts = [];
  if (f.octave) parts.push('llave de ' + f.octaveName);
  if (f.thumbOn) parts.push('pulgar');
  ['L', 'R'].forEach(h => {
    const fingers = f.holes.filter(x => x[0] === h).map(x => x[1]);
    if (fingers.length) parts.push(`${HAND[h]} ${fingers.join('-')}`);
  });
  f.extras.forEach(e => parts.push('llave ' + e));
  return parts.length ? parts.join(' · ') : 'Todo abierto';
}
