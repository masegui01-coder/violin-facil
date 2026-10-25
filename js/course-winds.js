// Curso para instrumentos de viento (trompeta, clarinete, saxo, flauta y oboe), generado a partir del perfil.
// Notas escritas. La «escala de la banda» es Si♭ mayor de concierto en la tonalidad escrita de cada instrumento.
import { parseNote } from './music.js';

const SCALES = {
  C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], G: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'], D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'], Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'], Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
};
// Octava de la tónica para que la escala quede en el registro cómodo de cada instrumento
const SCALE_START = {
  trumpet: ['C', 4], clarinet: ['C', 4], sax: ['G', 4], 'sax-tenor': ['C', 5], 'sax-bari': ['G', 4], flute: ['Bb', 4], oboe: ['Bb', 4],
  'eb-clarinet': ['G', 4], 'bass-clarinet': ['C', 4], piccolo: ['Bb', 4], 'sax-soprano': ['C', 5], flugelhorn: ['C', 4],
  horn: ['F', 4], trombone: ['Bb', 2], euphonium: ['C', 4], tuba: ['Bb', 1],
};
const HIGH_NOTES = {
  trumpet: 'C5 D5 E5 F5 G5', clarinet: 'B4 C5 D5 E5 F#5 G5', sax: 'D5 E5 F#5 G5 A5', 'sax-tenor': 'D5 E5 F5 G5 A5', 'sax-bari': 'D5 E5 F#5 G5 A5',
  flute: 'D5 E5 F5 G5 A5 Bb5', oboe: 'E5 G5 A5 B5',
  'eb-clarinet': 'B4 C5 D5 E5 F#5 G5', 'bass-clarinet': 'B4 C5 D5 E5 F#5 G5', piccolo: 'D5 E5 F5 G5 A5 Bb5', 'sax-soprano': 'D5 E5 F5 G5 A5',
  flugelhorn: 'C5 D5 E5 F5 G5', horn: 'G5 A5 Bb5 C6', trombone: 'D4 Eb4 F4 G4', euphonium: 'C5 D5 E5 F5 G5', tuba: 'D3 Eb3 F3 G3',
};
const SECOND_KEY = {
  trumpet: 'F', clarinet: 'F', sax: 'D', 'sax-tenor': 'F', 'sax-bari': 'D', flute: 'F', oboe: 'F',
  'eb-clarinet': 'D', 'bass-clarinet': 'F', piccolo: 'F', 'sax-soprano': 'F', flugelhorn: 'F', horn: 'C', trombone: 'Eb', euphonium: 'F', tuba: 'Eb',
};

const FAMILY_CARDS = {
  metal: [
    { title: 'La respiración', text: 'Coge aire por la boca, profundo y sin subir los hombros, como si bostezaras. Sopla con el aire rápido y constante: la nota depende más del aire que de apretar los labios.' },
    { title: 'La embocadura', text: 'Labios juntos, comisuras firmes y la boquilla centrada, mitad arriba y mitad abajo. Haz vibrar los labios (el «buzz») y deja que la boquilla lo amplifique.' },
  ],
  madera: [
    { title: 'La respiración', text: 'Coge aire profundo, con el abdomen, sin subir los hombros. Mantén la columna de aire constante: un sonido estable sale de un aire estable.' },
    { title: 'La embocadura', text: 'Comisuras firmes y labios relajados alrededor de la boquilla, la caña o la embocadura. No muerdas: si el sonido sale alto y estrecho, afloja la mandíbula.' },
  ],
};
const MIC_CARD = { title: 'Cómo te escucha la app', text: 'Deja el móvil a un metro y no soples hacia el micrófono. La app enseña la nota escrita en tu instrumento, aunque el sonido real sea otro si transporta.' };

function scaleFrom(key, letter, octave) {
  const names = SCALES[key];
  const tonicIdx = names.findIndex(n => n[0] === letter[0]);
  const out = [];
  let oct = octave;
  for (let i = 0; i < 8; i++) {
    const name = names[(tonicIdx + i) % 7];
    if (i > 0 && name[0] === 'C' && names[(tonicIdx + i - 1) % 7][0] === 'B') oct++;
    out.push(name + oct);
  }
  return out;
}

const midis = names => names.map(n => parseNote(n).midi);

const upDown = list => [...list, ...list.slice(0, -1).reverse()].join(' ');
const repeatPattern = (list, pattern) => pattern.map(i => list[i]).join(' ');
const toScore = (notes, dur) => {
  const bars = [];
  const perBar = { w: 1, h: 2, q: 4 }[dur];
  for (let i = 0; i < notes.length; i += perBar) bars.push(notes.slice(i, i + perBar).map(n => n + dur).join(' '));
  return '| ' + bars.join(' | ') + ' |';
};

export function windUnits(inst, helpers) {
  const { theory, notes, song, exercise, slots, warmup } = helpers;
  const first = inst.firstNotes;
  const [tonic, oct] = SCALE_START[inst.id];
  const scale = scaleFrom(inst.bandKey, tonic, oct);
  const second = SECOND_KEY[inst.id];
  // la segunda escala en la octava que cabe en el registro (los graves, como trombón y tuba, más abajo)
  const fits = list => midis(list).every(m => m >= inst.written[0] && m <= inst.written[1]);
  const scale2 = [4, 3, 5, 2, 1].map(o => scaleFrom(second, second, o)).find(fits) || scaleFrom(second, second, 4);
  const high = HIGH_NOTES[inst.id].split(' ');
  const cards = FAMILY_CARDS[inst.family];
  const p = `${inst.id}-`;
  return [
    { id: p + 'u1', title: 'Primeros sonidos', sub: 'Aire, embocadura y tres notas', color: 'var(--u1)', lessons: [
      theory(p + 'u1-intro', `Conoce tu ${inst.name.toLowerCase()}`, [...cards, { title: 'Tus primeras notas', text: `Empezamos por ${first.slice(0, 3).join(', ')} (notas escritas). El diagrama te muestra qué pulsar en cada una.`, board: midis(first.slice(0, 1)) }, MIC_CARD]),
      warmup(p + 'u1-warm', 'Notas tenidas', repeatPattern(first, [0, 0, 1, 1, 2, 2, 1, 1, 0, 0])),
      notes(p + 'u1-three', 'Tres notas', `${first.slice(0, 3).join(', ')}`, repeatPattern(first, [0, 1, 2, 1, 0, 0, 1, 2, 2, 1, 0, 1, 2, 1, 0, 0])),
      exercise(p + 'u1-long', 'Sonidos largos', 'Redondas: mantén el aire 4 pulsos', { key: 'C', time: 4, bpm: 60, score: toScore([first[0], first[1], first[2], first[1], first[0]], 'w') }),
      exercise(p + 'u1-rhythm', 'Primer ritmo', 'Negras y blancas', { key: 'C', time: 4, bpm: 60, score: `| ${first[0]}q ${first[0]}q ${first[0]}h | ${first[1]}q ${first[1]}q ${first[1]}h | ${first[2]}q ${first[1]}q ${first[0]}h | ${first[0]}w |` }),
    ] },
    { id: p + 'u2', title: 'Cinco notas', sub: 'Tu primera melodía', color: 'var(--u2)', lessons: [
      theory(p + 'u2-intro', 'Dos notas nuevas', [{ title: 'Ampliamos', text: `Añadimos ${first[3]} y ${first[4]}. Mira el diagrama de cada una antes de tocarla.`, board: midis([first[3]]) }]),
      notes(p + 'u2-five', 'Cinco notas', first.join(', '), repeatPattern(first, [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2, 0, 1, 3, 4, 3, 1, 0])),
      exercise(p + 'u2-melody', 'Primera melodía', 'Con las cinco notas, a tempo', { key: 'C', time: 4, bpm: 66, score: `| ${first[0]}q ${first[1]}q ${first[2]}q ${first[3]}q | ${first[4]}h ${first[4]}h | ${first[3]}q ${first[2]}q ${first[1]}q ${first[0]}q | ${first[0]}w |` }),
      slots(1, 1),
    ] },
    { id: p + 'u3', title: 'La escala de la banda', sub: 'Si♭ mayor de concierto', color: 'var(--u3)', lessons: [
      theory(p + 'u3-intro', 'La escala de la banda', [
        { title: 'Si♭ de concierto', text: inst.transpose ? `Las bandas afinan y calientan en Si♭ mayor de concierto. Tu ${inst.name.toLowerCase()} está en ${inst.inKey}: para ti esa escala se escribe empezando en ${scale[0].replace(/\d/, '')}.` : 'Las bandas afinan y calientan en Si♭ mayor de concierto. Tu instrumento está en Do, así que para ti es Si♭ mayor tal cual.' },
      ]),
      notes(p + 'u3-scale', 'Escala de la banda', 'Subir y bajar', upDown(scale)),
      song(p + 'u3-oda', 'oda', 'Beethoven'),
      slots(1, 1),
    ] },
    { id: p + 'u4', title: 'Ritmo', sub: 'Corcheas y puntillos', color: 'var(--u4)', lessons: [
      theory(p + 'u4-intro', 'Las figuras', [{ title: 'Cuánto dura cada nota', text: 'Redonda: 4 pulsos. Blanca: 2. Negra: 1. Corchea: medio pulso. Un puntillo suma la mitad. Para las corcheas usa un picado suave con la lengua: «tu-tu».' }]),
      exercise(p + 'u4-eighths', 'Corcheas', 'Picado suave', { key: inst.bandKey, time: 4, bpm: 60, score: `| ${scale[0]}e ${scale[0]}e ${scale[1]}e ${scale[1]}e ${scale[2]}e ${scale[2]}e ${scale[1]}q | ${scale[2]}e ${scale[2]}e ${scale[3]}e ${scale[3]}e ${scale[4]}h | ${scale[4]}e ${scale[3]}e ${scale[2]}e ${scale[1]}e ${scale[0]}h |` }),
      song(p + 'u4-jingle', 'jingle', 'Corcheas y puntillos'),
      slots(2, 1),
    ] },
    { id: p + 'u5', title: 'Registro agudo', sub: 'Más arriba sin apretar', color: 'var(--u5)', lessons: [
      theory(p + 'u5-intro', 'Subir de registro', [{ title: 'Aire, no fuerza', text: inst.family === 'metal' ? 'Para subir, acelera el aire y estrecha un poco la apertura de los labios. No aprietes la boquilla contra la boca.' : 'Para subir, usa la llave de octava o registro, acelera el aire y no muerdas. El agudo sale con aire rápido, no con presión.', board: midis([high[0]]) }]),
      warmup(p + 'u5-warm', 'Escala en terceras', [scale[0], scale[2], scale[1], scale[3], scale[2], scale[4], scale[3], scale[5], scale[4], scale[6], scale[5], scale[7]].join(' ')),
      notes(p + 'u5-high', 'Notas agudas', high.join(', '), upDown(high)),
      slots(2, 2),
    ] },
    { id: p + 'u6', title: 'Escalas y arpegios', sub: 'Técnica de banda', color: 'var(--u6)', lessons: [
      theory(p + 'u6-intro', 'Escalas', [{ title: 'Otra tonalidad', text: `Muchas obras de banda están en Mi♭ y Fa de concierto. Practicamos la escala de ${second} escrita y su arpegio.` }]),
      notes(p + 'u6-scale', `Escala de ${second}`, 'Subir y bajar', upDown(scale2)),
      notes(p + 'u6-arp', 'Arpegio', 'Tónica, tercera y quinta', [scale[0], scale[2], scale[4], scale[7], scale[4], scale[2], scale[0]].join(' ')),
      song(p + 'u6-minueto', 'minueto', 'Bach'),
      slots(2, 2),
    ] },
    { id: p + 'u7', title: 'Afinar en banda', sub: 'Terceras, quintas y expresión', color: 'var(--u7)', lessons: [
      theory(p + 'u7-intro', 'Afinar dentro del acorde', [
        { title: 'No basta con el afinador', text: 'En un acorde, la tercera mayor suena mejor unos 14 cents más baja que en el afinador, y la quinta unos 2 cents más alta. Lo practicarás en «Estudio → Afinar en acorde».' },
        { title: 'Tu mapa de afinación', text: 'Cada vez que tocas, la app apunta si cada nota te sale alta o baja. Míralo en «Estudio → Mapa de afinación» y trabaja tus notas débiles con notas tenidas.' },
      ]),
      song(p + 'u7-greensleeves', 'greensleeves', 'Expresión en menor'),
      slots(3, 3),
    ] },
  ];
}
