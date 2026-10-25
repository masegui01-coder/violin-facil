// Acordes: notas, nombre en las dos nomenclaturas, forma en la guitarra y posición en el piano.

const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const EU = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const QUALITY = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], 5: [0, 7], sus2: [0, 2, 7], sus4: [0, 5, 7] };

// Trastes de la 6.ª (Mi grave) a la 1.ª (Mi aguda); -1 = no suena. Dedos: 1 índice … 4 meñique. barre: traste de la cejilla.
const GUITAR = {
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  A: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  D: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  Dm: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  C: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  C7: { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  D7: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  A7: { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  E7: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  Em7: { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  Am7: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  Asus2: { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  Dsus2: { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  Fmaj7: { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  F: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
  Bm: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: 2 },
  Bb: { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: 1 },
  B7: { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  E5: { frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
  A5: { frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0] },
  D5: { frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 2, 0] },
  G5: { frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },
  C5: { frets: [-1, 3, 5, 5, -1, -1], fingers: [0, 1, 3, 4, 0, 0] },
};
export const GUITAR_OPEN = [40, 45, 50, 55, 59, 64]; // sonido real de las cuerdas al aire: Mi2 La2 Re3 Sol3 Si3 Mi4

// Posiciones de la mano derecha en el piano pensadas para moverse poco (Do, Fa y Sol cerca del Do central)
const PIANO = {
  C: [60, 64, 67], F: [60, 65, 69], G: [59, 62, 67], Am: [60, 64, 69], Dm: [62, 65, 69], Em: [59, 64, 67],
  G7: [59, 65, 67], D: [62, 66, 69], A: [61, 64, 69], E: [59, 64, 68], C7: [58, 64, 67], D7: [60, 62, 66],
};

export function parseChord(name) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(name);
  if (!m || !(m[3] in QUALITY)) throw new Error('Acorde desconocido: ' + name);
  const root = (LETTERS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  return { name, letter: m[1], acc: m[2], quality: m[3], root, pcs: QUALITY[m[3]].map(i => (root + i) % 12) };
}

const ACC = { '#': '♯', b: '♭', '': '' };

// «Lam», «Sol7», «Fa♯m» o «Am», «G7», «F♯m»
export function chordLabel(name, nom = 'eu') {
  const c = parseChord(name);
  const q = c.quality === 'maj7' ? (nom === 'eu' ? '7M' : 'maj7') : c.quality;
  return (nom === 'us' ? c.letter : EU[c.letter]) + ACC[c.acc] + q;
}

export const guitarShape = name => GUITAR[name] || null;

// Notas reales que suenan con la forma de guitarra
export function guitarMidis(name) {
  const shape = GUITAR[name];
  return shape ? shape.frets.map((f, i) => (f < 0 ? null : GUITAR_OPEN[i] + f)).filter(x => x !== null) : [];
}

export function pianoMidis(name) {
  if (PIANO[name]) return PIANO[name];
  const c = parseChord(name);
  return QUALITY[c.quality].map(i => 60 + c.root + i);
}

// Cuántos dedos hay que mover para cambiar de un acorde a otro (para ordenar los cambios de más fácil a más difícil)
export function guitarChangeCost(a, b) {
  const sa = GUITAR[a], sb = GUITAR[b];
  if (!sa || !sb) return 6;
  return sa.frets.reduce((n, f, i) => n + (f !== sb.frets[i] || sa.fingers[i] !== sb.fingers[i] ? 1 : 0), 0);
}
