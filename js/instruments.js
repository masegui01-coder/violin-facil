// Perfiles de instrumento. Las partituras están siempre en notas ESCRITAS (lo que lee el músico);
// el micrófono oye notas REALES. transpose = semitonos que hay que sumar a la escrita para obtener la real.

export const INSTRUMENTS = [
  {
    id: 'violin', name: 'Violín', family: 'cuerda', transpose: 0, written: [55, 88], minHz: 180, maxHz: 1600,
    board: 'violin', firstNotes: ['A4', 'E5', 'D4', 'G3'], bandKey: 'D',
    blurb: 'Cuerda frotada, cuatro cuerdas',
  },
  {
    id: 'trumpet', name: 'Trompeta', family: 'metal', transpose: -2, written: [54, 84], minHz: 150, maxHz: 1250,
    board: 'valves', firstNotes: ['C4', 'D4', 'E4', 'F4', 'G4'], bandKey: 'C', inKey: 'Si♭',
    blurb: 'En Si♭, tres pistones',
  },
  {
    id: 'clarinet', name: 'Clarinete', family: 'madera', transpose: -2, written: [52, 91], minHz: 140, maxHz: 1900,
    board: 'keys', firstNotes: ['G4', 'F4', 'E4', 'D4', 'C4'], bandKey: 'C', inKey: 'Si♭',
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
];

export function instrumentById(id) {
  return INSTRUMENTS.find(i => i.id === id) || INSTRUMENTS[0];
}

export const writtenToSounding = (midi, inst) => midi + inst.transpose;
export const soundingToWritten = (midi, inst) => midi - inst.transpose;

// ¿Está la nota escrita dentro del registro cómodo del instrumento?
export function inRange(midi, inst) {
  return midi >= inst.written[0] && midi <= inst.written[1];
}
