// Curso para instrumentos de viento (trompeta, clarinete, saxo, flauta y oboe), generado a partir del perfil.
// Notas escritas. La «escala de la banda» es Si♭ mayor de concierto en la tonalidad escrita de cada instrumento.
import { parseNote, noteLabel } from './music.js';
import { getState } from './store.js';

// «C4 D4 E4» → «Do, Re, Mi» (o «C4, D4, E4» con la nomenclatura americana)
const names = list => list.map(n => noteLabel(parseNote(n), getState().nom)).join(', ');
// «Eb» → «Mi♭» (o «E♭»): nombre de una tonalidad, sin octava
const keyName = k => noteLabel(parseNote(k + '4'), getState().nom).replace(/\d+$/, '');

const SCALES = {
  C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], G: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'], D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'], Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'], Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
};
// Octava de la tónica para que la escala quede en el registro cómodo de cada instrumento
const SCALE_START = {
  trumpet: ['C', 4], clarinet: ['C', 4], sax: ['G', 4], 'sax-tenor': ['C', 5], 'sax-bari': ['G', 4], flute: ['Bb', 4], oboe: ['Bb', 4],
  'eb-clarinet': ['G', 3], 'bass-clarinet': ['C', 4], piccolo: ['Bb', 4], 'sax-soprano': ['C', 5], flugelhorn: ['C', 4],
  horn: ['F', 4], trombone: ['Bb', 2], euphonium: ['C', 4], tuba: ['Bb', 2],
};
const HIGH_NOTES = {
  trumpet: 'C5 D5 E5 F5 G5', clarinet: 'B4 C5 D5 E5 F5 G5', sax: 'D5 E5 F#5 G5 A5', 'sax-tenor': 'D5 E5 F5 G5 A5', 'sax-bari': 'D5 E5 F#5 G5 A5',
  flute: 'C6 D6 Eb6 F6', oboe: 'F5 G5 A5 Bb5',
  'eb-clarinet': 'A4 B4 C5 D5', 'bass-clarinet': 'B4 C5 D5', piccolo: 'Bb5 C6 D6', 'sax-soprano': 'D5 E5 F5 G5 A5',
  flugelhorn: 'C5 D5 E5 F5 G5', horn: 'D5 E5 F5', trombone: 'C4 D4 Eb4 F4 G4', euphonium: 'C5 D5 E5 F5 G5', tuba: 'G3 A3 Bb3 C4',
};
const SECOND_KEY = {
  trumpet: 'F', clarinet: 'F', sax: 'D', 'sax-tenor': 'F', 'sax-bari': 'D', flute: 'F', oboe: 'F',
  'eb-clarinet': 'D', 'bass-clarinet': 'F', piccolo: 'F', 'sax-soprano': 'F', flugelhorn: 'F', horn: 'C', trombone: 'Eb', euphonium: 'F', tuba: 'Eb',
};

const FAMILY_CARDS = {
  metal: [
    { title: 'La respiración', text: 'Coge aire por la boca, profundo y sin subir los hombros, como si bostezaras. Sopla con el aire rápido y constante: la nota depende más del aire que de apretar los labios.' },
    { title: 'La embocadura', text: 'Labios juntos, comisuras firmes y la boquilla centrada de lado a lado; la altura depende del instrumento (en la trompa, unos dos tercios de labio de arriba). Haz vibrar los labios (el «buzz») y deja que la boquilla lo amplifique.' },
  ],
  madera: [
    { title: 'La respiración', text: 'Coge aire profundo, con el abdomen, sin subir los hombros. Mantén la columna de aire constante: un sonido estable sale de un aire estable.' },
    { title: 'La embocadura', text: 'El labio de abajo cubre un poco los dientes, los dientes de arriba apoyan en la boquilla y los labios rodean la boquilla como una goma, sin morder. Si el sonido sale alto y estrecho, afloja la mandíbula.' },
  ],
};
// La flauta y el oboe no tienen boquilla con caña: su propia tarjeta de embocadura
const EMBOUCHURE_OF = {
  flute: { title: 'La embocadura', text: 'La placa de la embocadura apoya bajo el labio de abajo, que tapa un tercio del agujero. Labios relajados y una abertura pequeña: sopla hacia el borde del agujero, como al soplar sobre una botella.' },
  oboe: { title: 'La embocadura', text: 'Los dos labios cubren los dientes y rodean la punta de la caña doble como un cordón, sin morder. Solo entran unos milímetros de caña.' },
};
EMBOUCHURE_OF.piccolo = EMBOUCHURE_OF.flute;
const cardsFor = inst => FAMILY_CARDS[inst.family].map(c => (c.title === 'La embocadura' && EMBOUCHURE_OF[inst.id]) || c);
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

// Primera nota que pide otro registro: clarinetes (llave de registro desde el Si4), oboe (llave de octava desde el Fa5)
// y trompa (parciales muy juntos desde el Re5). En la unidad 3 la escala llega hasta antes; la completa, en la 5.
const REGISTER_BREAK = { clarinet: 71, 'bass-clarinet': 71, oboe: 77, horn: 74 };
const avg = list => list.reduce((a, b) => a + b, 0) / list.length;

// Unidad 3: la escala de la banda en dos mitades, cada una con su canción; primero la mitad más cercana a las notas
// que ya conoces, y al final la escala entera y el Himno de la alegría.
function scaleUnit(inst, helpers, scale, p) {
  const { theory, notes, song, exercise, slots } = helpers;
  const limit = REGISTER_BREAK[inst.id];
  const below = limit ? scale.filter(n => parseNote(n).midi < limit) : scale;
  const known = avg(midis(inst.firstNotes));
  const low = below.slice(0, 5);
  const high = below.length > 5 ? below.slice(4) : [];
  const lowFirst = !high.length || Math.abs(avg(midis(low)) - known) <= Math.abs(avg(midis(high)) - known);
  const key = inst.bandKey;
  const q = (list, idx) => idx.map(i => list[i] + 'q').join(' ');
  const top = low[Math.min(4, low.length - 1)]; // con cuatro notas, «María» sube a la cuarta en vez de a la quinta
  const lowPart = [
    notes(p + 'u3-low', 'La parte grave', names(low), repeatPattern(low, low.length < 5 ? [0, 1, 2, 3, 2, 1, 0, 2, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2, 0])),
    exercise(p + 'u3-mary', 'María tenía un corderito', 'Con la parte grave de la escala', { key, time: 4, bpm: 72,
      score: `| ${q(low, [2, 1, 0, 1])} | ${low[2]}q ${low[2]}q ${low[2]}h | ${low[1]}q ${low[1]}q ${low[1]}h | ${low[2]}q ${top}q ${top}h | ${q(low, [2, 1, 0, 1])} | ${q(low, [2, 2, 2, 2])} | ${q(low, [1, 1, 2, 1])} | ${low[0]}w |` }),
  ];
  const highPart = high.length < 3 ? [] : [
    notes(p + 'u3-high', 'La parte aguda', names(high), repeatPattern(high, [0, 1, 2, high.length - 1, 2, 1, 0, 2, 0, 1, high.length - 1, 1, 0])),
    exercise(p + 'u3-bells', 'Campanas', 'Con la parte aguda de la escala', { key, time: 4, bpm: 72,
      score: `| ${high.at(-1)}h ${high.at(-2)}h | ${high.at(-3)}h ${high[0]}h | ${[...high].map(n => n + 'q').slice(0, 4).join(' ')} | ${high.at(-1)}h ${high[0]}h | ${[...high].reverse().slice(0, 4).map(n => n + 'q').join(' ')} | ${high[0]}w |` }),
  ];
  const whole = limit && below.length < scale.length;
  return { id: p + 'u3', title: 'La escala de la banda', sub: whole ? 'Hasta el paso de registro' : 'Si♭ mayor de concierto, por mitades', color: 'var(--u3)', lessons: [
    theory(p + 'u3-intro', 'La escala de la banda', [
      { title: 'Si♭ de concierto', text: inst.inKey ? `Las bandas afinan y calientan en Si♭ mayor de concierto. Tu ${inst.name.toLowerCase()} está en ${inst.inKey}: para ti esa escala se escribe empezando en ${names([scale[0]]).replace(/\d/, '')}.` : inst.transpose ? `Las bandas afinan y calientan en Si♭ mayor de concierto. Tu ${inst.name.toLowerCase()} suena una octava más aguda de lo escrito, pero la escala se escribe igual: Si♭ mayor.` : 'Las bandas afinan y calientan en Si♭ mayor de concierto. Tu parte se escribe en sonido real, así que para ti es Si♭ mayor tal cual.' },
      { title: 'Por mitades', text: whole ? 'Primero aprendes la escala hasta el paso de registro, con una canción. Las notas de arriba llegan en «Registro agudo», cuando sepas usar la llave de registro.' : 'Aprendes la escala en dos mitades, cada una con una canción corta. Cuando tengas las dos, la tocas entera y llega el Himno de la alegría.' },
    ]),
    ...(lowFirst ? [...lowPart, ...highPart] : [...highPart, ...lowPart]),
    notes(p + 'u3-scale', whole ? 'Escala hasta el paso' : 'Escala de la banda', 'Subir y bajar', upDown(below)),
    // el Himno en la escala que acabas de aprender (sin notas nuevas ni puntillos, que llegan en la unidad 4)
    ...(low.length < 5 ? [] : [exercise(p + 'u3-oda', 'Himno de la alegría', 'Beethoven, con la escala de la banda', { key, time: 4, bpm: 76,
      score: `| ${q(low, [2, 2, 3, 4])} | ${q(low, [4, 3, 2, 1])} | ${q(low, [0, 0, 1, 2])} | ${low[2]}q ${low[1]}q ${low[1]}h | ${q(low, [2, 2, 3, 4])} | ${q(low, [4, 3, 2, 1])} | ${q(low, [0, 0, 1, 2])} | ${low[1]}q ${low[0]}q ${low[0]}h |` })]),
    slots(1, 1),
  ] };
}

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
  const cards = cardsFor(inst);
  const p = `${inst.id}-`;
  return [
    { id: p + 'u1', title: 'Primeros sonidos', sub: 'Aire, embocadura y tres notas', color: 'var(--u1)', lessons: [
      theory(p + 'u1-intro', `Conoce tu ${inst.name.toLowerCase()}`, [...cards, { title: 'Tus primeras notas', text: `Empezamos por ${names(first.slice(0, 3))} (notas escritas). ${inst.id === 'trombone' ? 'El diagrama te muestra en qué posición va la vara' : 'El diagrama te muestra qué pulsar'} en cada una.`, board: midis(first.slice(0, 1)) }, MIC_CARD]),
      warmup(p + 'u1-warm', 'Notas tenidas', repeatPattern(first, [0, 0, 1, 1, 2, 2, 1, 1, 0, 0])),
      notes(p + 'u1-three', 'Tres notas', names(first.slice(0, 3)), repeatPattern(first, [0, 1, 2, 1, 0, 0, 1, 2, 2, 1, 0, 1, 2, 1, 0, 0])),
      exercise(p + 'u1-long', 'Sonidos largos', 'Redondas: mantén el aire 4 pulsos', { key: 'C', time: 4, bpm: 60, score: '| ' + [first[0], first[1], first[2], first[1], first[0]].map(n => n + 'w').join(' | Rw | ') + ' |' }),
      exercise(p + 'u1-rhythm', 'Primer ritmo', 'Negras y blancas', { key: 'C', time: 4, bpm: 60, score: `| ${first[0]}q ${first[0]}q ${first[0]}h | ${first[1]}q ${first[1]}q ${first[1]}h | ${first[2]}q ${first[1]}q ${first[0]}h | ${first[0]}w |` }),
    ] },
    { id: p + 'u2', title: 'Cinco notas', sub: 'Tu primera melodía', color: 'var(--u2)', lessons: [
      theory(p + 'u2-intro', 'Dos notas nuevas', [{ title: 'Ampliamos', text: `Añadimos ${names([first[3]])} y ${names([first[4]])}. Mira el diagrama de cada una antes de tocarla.`, board: midis([first[3]]) }]),
      notes(p + 'u2-five', 'Cinco notas', names(first), repeatPattern(first, [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2, 0, 1, 3, 4, 3, 1, 0])),
      exercise(p + 'u2-melody', 'Primera melodía', 'Con las cinco notas, a tempo', { key: 'C', time: 4, bpm: 66, score: `| ${first[0]}q ${first[1]}q ${first[2]}q ${first[3]}q | ${first[4]}h ${first[4]}h | ${first[3]}q ${first[2]}q ${first[1]}q ${first[0]}q | ${first[0]}w |` }),
      slots(1, 1),
    ] },
    scaleUnit(inst, helpers, scale, p),
    { id: p + 'u4', title: 'Ritmo', sub: 'Corcheas y puntillos', color: 'var(--u4)', lessons: [
      theory(p + 'u4-intro', 'Las figuras', [{ title: 'Cuánto dura cada nota', text: 'Redonda: 4 pulsos. Blanca: 2. Negra: 1. Corchea: medio pulso. Un puntillo suma la mitad. Para las corcheas usa un picado suave con la lengua: «tu-tu».' }]),
      exercise(p + 'u4-eighths', 'Corcheas', 'Picado suave', { key: inst.bandKey, time: 4, bpm: 60, score: `| ${scale[0]}e ${scale[0]}e ${scale[1]}e ${scale[1]}e ${scale[2]}e ${scale[2]}e ${scale[1]}q | ${scale[2]}e ${scale[2]}e ${scale[3]}e ${scale[3]}e ${scale[4]}h | ${scale[4]}e ${scale[3]}e ${scale[2]}e ${scale[1]}e ${scale[0]}h |` }),
      song(p + 'u4-jingle', 'jingle', 'Corcheas y puntillos'),
      slots(2, 1),
    ] },
    { id: p + 'u5', title: 'Registro agudo', sub: 'Más arriba sin apretar', color: 'var(--u5)', lessons: [
      theory(p + 'u5-intro', 'Subir de registro', [{ title: 'Aire, no fuerza', text: inst.family === 'metal' ? 'Para subir, acelera el aire y estrecha un poco la apertura de los labios. No aprietes la boquilla contra la boca.' : inst.fingers === 'flute' || inst.id === 'flute' ? 'Para subir a la segunda octava casi no cambian los dedos: sopla más rápido, acerca un poco los labios al bisel y dirige el aire algo más arriba. Sin forzar.' : 'Para subir, usa la llave de octava o registro, acelera el aire y no muerdas. El agudo sale con aire rápido, no con presión.', board: midis([high[0]]) }]),
      ...(REGISTER_BREAK[inst.id] ? [] : [warmup(p + 'u5-warm', 'Escala en terceras', [scale[0], scale[2], scale[1], scale[3], scale[2], scale[4], scale[3], scale[5], scale[4], scale[6], scale[5], scale[7]].join(' '))]),
      notes(p + 'u5-high', 'Notas agudas', names(high), upDown(high)),
      ...(REGISTER_BREAK[inst.id] ? [
        notes(p + 'u5-scale', 'Escala de la banda completa', 'Ahora sí, hasta arriba', upDown(scale)),
        warmup(p + 'u5-warm', 'Escala en terceras', [scale[0], scale[2], scale[1], scale[3], scale[2], scale[4], scale[3], scale[5], scale[4], scale[6], scale[5], scale[7]].join(' ')),
      ] : []),
      slots(2, 2),
    ] },
    { id: p + 'u6', title: 'Escalas y arpegios', sub: 'Técnica de banda', color: 'var(--u6)', lessons: [
      theory(p + 'u6-intro', 'Escalas', [{ title: 'Otra tonalidad', text: `Muchas obras de banda están en Mi♭ y Fa de concierto. Practicamos la escala de ${keyName(second)} escrita y su arpegio.` }]),
      notes(p + 'u6-scale', `Escala de ${keyName(second)}`, 'Subir y bajar', upDown(scale2)),
      notes(p + 'u6-arp', `Arpegio de ${keyName(second)}`, 'Tónica, tercera y quinta', [scale2[0], scale2[2], scale2[4], scale2[7], scale2[4], scale2[2], scale2[0]].join(' ')),
      song(p + 'u6-minueto', 'minueto', 'Petzold'),
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

// Escala de la banda escrita para el instrumento (8 notas, de la tónica a la octava). La usa el método Pro.
export const bandScale = inst => scaleFrom(inst.bandKey, ...SCALE_START[inst.id]);
