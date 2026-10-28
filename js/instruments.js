// Perfiles de instrumento. Las partituras están siempre en notas ESCRITAS (lo que lee el músico);
// el micrófono oye notas REALES. transpose = semitonos que hay que sumar a la escrita para obtener la real.
// La guitarra se escribe una octava por encima de como suena. polyphonic: toca acordes (se reconocen por el cromagrama).

export const INSTRUMENTS = [
  {
    id: 'violin', name: 'Violín', family: 'cuerda', transpose: 0, written: [55, 88], minHz: 180, maxHz: 1600,
    board: 'violin', firstNotes: ['A4', 'E5', 'D4', 'G3'], bandKey: 'D',
    blurb: 'Cuerda frotada, cuatro cuerdas',
  },
  {
    id: 'cello', name: 'Violonchelo', family: 'cuerda', transpose: 0, clef: 'bass', written: [36, 76], comfort: [36, 63], minHz: 55, maxHz: 900,
    board: 'cello', firstNotes: ['A3', 'D3', 'G2', 'C2'], bandKey: 'D',
    blurb: 'Cuerda frotada, sentado y en clave de fa',
  },
  {
    id: 'trumpet', name: 'Trompeta', family: 'metal', transpose: -2, written: [54, 84], minHz: 150, maxHz: 1250,
    board: 'valves', firstNotes: ['C4', 'D4', 'E4', 'F4', 'G4'], bandKey: 'C', inKey: 'Si♭',
    blurb: 'En Si♭, tres pistones',
  },
  {
    id: 'clarinet', name: 'Clarinete', family: 'madera', transpose: -2, written: [52, 91], minHz: 140, maxHz: 1900,
    octaveSlack: true, board: 'keys', firstNotes: ['G4', 'F4', 'E4', 'D4', 'C4'], bandKey: 'C', inKey: 'Si♭',
    blurb: 'En Si♭, caña simple',
  },
  {
    id: 'sax', name: 'Saxofón alto', family: 'madera', transpose: -9, written: [58, 89], minHz: 130, maxHz: 1000,
    board: 'keys', firstNotes: ['B4', 'A4', 'G4', 'C5', 'D5'], bandKey: 'G', inKey: 'Mi♭',
    blurb: 'En Mi♭, caña simple',
  },
  {
    id: 'sax-tenor', name: 'Saxofón tenor', family: 'madera', transpose: -14, written: [58, 89], minHz: 95, maxHz: 750,
    board: 'keys', fingers: 'sax', firstNotes: ['B4', 'A4', 'G4', 'C5', 'D5'], bandKey: 'C', inKey: 'Si♭',
    blurb: 'En Si♭, una octava más grave',
  },
  {
    id: 'sax-bari', name: 'Saxofón barítono', family: 'madera', transpose: -21, written: [58, 89], minHz: 65, maxHz: 450,
    board: 'keys', fingers: 'sax', firstNotes: ['B4', 'A4', 'G4', 'C5', 'D5'], bandKey: 'G', inKey: 'Mi♭',
    blurb: 'En Mi♭, el más grave',
  },
  {
    id: 'flute', name: 'Flauta', family: 'madera', transpose: 0, written: [60, 96], minHz: 250, maxHz: 2400,
    board: 'keys', firstNotes: ['B4', 'A4', 'G4', 'C5', 'D5'], bandKey: 'Bb',
    blurb: 'Flauta travesera en Do',
  },
  {
    id: 'oboe', name: 'Oboe', family: 'madera', transpose: 0, written: [58, 93], minHz: 220, maxHz: 1900,
    board: 'keys', firstNotes: ['B4', 'A4', 'G4', 'E4', 'D4'], bandKey: 'Bb',
    blurb: 'Doble caña, en Do',
  },
  {
    id: 'eb-clarinet', name: 'Requinto', family: 'madera', transpose: 3, written: [52, 91], minHz: 170, maxHz: 2300,
    octaveSlack: true, board: 'keys', fingers: 'clarinet', firstNotes: ['G4', 'F4', 'E4', 'D4', 'C4'], bandKey: 'G', inKey: 'Mi♭',
    blurb: 'Clarinete pequeño en Mi♭',
  },
  {
    id: 'bass-clarinet', name: 'Clarinete bajo', family: 'madera', transpose: -14, written: [52, 84], minHz: 60, maxHz: 900,
    octaveSlack: true, board: 'keys', fingers: 'clarinet', firstNotes: ['G4', 'F4', 'E4', 'D4', 'C4'], bandKey: 'C', inKey: 'Si♭',
    blurb: 'En Si♭, una octava más grave',
  },
  {
    id: 'piccolo', name: 'Flautín', family: 'madera', transpose: 12, written: [60, 86], minHz: 500, maxHz: 2450,
    board: 'keys', fingers: 'flute', firstNotes: ['B4', 'A4', 'G4', 'C5', 'D5'], bandKey: 'Bb',
    blurb: 'Suena una octava más aguda',
  },
  {
    id: 'sax-soprano', name: 'Saxofón soprano', family: 'madera', transpose: -2, written: [58, 89], minHz: 200, maxHz: 1500,
    board: 'keys', fingers: 'sax', firstNotes: ['B4', 'A4', 'G4', 'C5', 'D5'], bandKey: 'C', inKey: 'Si♭',
    blurb: 'En Si♭, recto y agudo',
  },
  {
    id: 'flugelhorn', name: 'Fliscorno', family: 'metal', transpose: -2, written: [54, 84], minHz: 150, maxHz: 1250,
    board: 'valves', fingers: 'trumpet', firstNotes: ['C4', 'D4', 'E4', 'F4', 'G4'], bandKey: 'C', inKey: 'Si♭',
    blurb: 'En Si♭, sonido más dulce que la trompeta',
  },
  {
    id: 'horn', name: 'Trompa', family: 'metal', transpose: -7, written: [55, 84], minHz: 80, maxHz: 950,
    board: 'valves', firstNotes: ['G4', 'F4', 'E4', 'D4', 'C4'], bandKey: 'F', inKey: 'Fa',
    blurb: 'En Fa, la mano dentro del pabellón',
  },
  {
    id: 'trombone', name: 'Trombón', family: 'metal', transpose: 0, clef: 'bass', written: [40, 72], minHz: 70, maxHz: 650,
    board: 'slide', firstNotes: ['F3', 'Eb3', 'D3', 'C3', 'Bb2'], bandKey: 'Bb',
    blurb: 'Vara de siete posiciones, clave de fa',
  },
  {
    id: 'euphonium', name: 'Bombardino', family: 'metal', transpose: -14, written: [54, 84], minHz: 60, maxHz: 650,
    board: 'valves', fingers: 'trumpet', firstNotes: ['C4', 'D4', 'E4', 'F4', 'G4'], bandKey: 'C', inKey: 'Si♭',
    blurb: 'En clave de sol en Si♭ (como en las bandas)',
  },
  {
    id: 'tuba', name: 'Tuba', family: 'metal', transpose: 0, clef: 'bass', written: [34, 60], minHz: 50, maxHz: 360,
    board: 'valves', firstNotes: ['Bb2', 'C3', 'D3', 'Eb3', 'F3'], bandKey: 'Bb',
    blurb: 'Si♭ grave, clave de fa',
  },
  {
    id: 'recorder', name: 'Flauta dulce', family: 'escuela', transpose: 12, written: [60, 86], minHz: 480, maxHz: 2450,
    board: 'recorder', firstNotes: ['B4', 'A4', 'G4', 'C5', 'D5'], bandKey: 'G',
    blurb: 'La del cole: para niños y principiantes',
  },
  // Láminas afinadas de fábrica (fixedPitch: no se corrige la afinación) y cada marca suena en una octava distinta
  // (anyOctave: vale la nota en cualquier octava). Se escribe una octava por debajo de como suena.
  {
    id: 'xylophone', name: 'Xilófono', family: 'escuela', transpose: 12, written: [60, 86], minHz: 240, maxHz: 4300,
    board: 'xylophone', firstNotes: ['C5', 'D5', 'E5'], bandKey: 'C', timbre: 'mallet', fixedPitch: true, anyOctave: true,
    blurb: 'Láminas de colores y dos baquetas',
  },
  {
    id: 'guitar', name: 'Guitarra', family: 'pulsada', polyphonic: true, transpose: -12, written: [52, 81], minHz: 70, maxHz: 1100,
    board: 'fretboard', firstNotes: ['E5', 'B4', 'G4'], bandKey: 'G',
    blurb: 'Acordes, rasgueo y punteo',
  },
  {
    id: 'ukulele', name: 'Ukelele', family: 'pulsada', polyphonic: true, transpose: 0, written: [60, 84], minHz: 230, maxHz: 1400,
    board: 'fretboard', firstNotes: ['A4', 'B4', 'C5'], bandKey: 'C',
    blurb: 'Cuatro cuerdas: canciones desde el primer día',
  },
  {
    id: 'piano', name: 'Piano', family: 'tecla', polyphonic: true, transpose: 0, written: [36, 96], minHz: 60, maxHz: 2100,
    board: 'keyboard', firstNotes: ['C4', 'D4', 'E4', 'F4', 'G4'], bandKey: 'C',
    blurb: 'Piano o teclado, las dos manos',
  },
  {
    id: 'cajon', name: 'Cajón flamenco', family: 'percusion', rhythmOnly: true, tones: true, transpose: 0, written: [65, 72], minHz: 180, maxHz: 1600,
    board: 'none', firstNotes: ['C5'], bandKey: 'C',
    blurb: 'Grave y agudo: rumba, tangos y bulerías',
  },
  {
    id: 'percussion', name: 'Percusión', family: 'percusion', rhythmOnly: true, transpose: 0, written: [72, 72], minHz: 180, maxHz: 1600,
    board: 'none', firstNotes: ['C5'], bandKey: 'C',
    blurb: 'Caja, bombo y platos: ritmo y rudimentos',
  },
];

export function instrumentById(id) {
  return INSTRUMENTS.find(i => i.id === id) || INSTRUMENTS[0];
}

export const writtenToSounding = (midi, inst) => midi + inst.transpose;
export const soundingToWritten = (midi, inst) => midi - inst.transpose;

// La nota oída llevada a la octava de la que toca, en los instrumentos donde vale cualquier octava (xilófono).
// En los clarinetes (octaveSlack) se perdona una octava arriba o abajo: el detector a veces se equivoca de octava en
// las notas de garganta (Si♭), y el alumno no puede caer en la octava con la misma digitación (el registro sube una 12.ª).
export function foldOctave(midi, target, inst) {
  const octaves = Math.round((target - midi) / 12);
  const folded = midi + 12 * octaves;
  if (inst.anyOctave || (inst.octaveSlack && Math.abs(octaves) === 1 && Math.abs(folded - target) < 1)) return folded;
  return midi;
}

// Tolerancia de afinación: en las láminas fijas solo importa acertar la lámina, no los cents
export const toleranceFor = (cents, inst) => (inst.fixedPitch ? Math.max(cents, 50) : cents);

// ¿Está la nota escrita dentro del registro cómodo del instrumento?
export function inRange(midi, inst) {
  return midi >= inst.written[0] && midi <= inst.written[1];
}
