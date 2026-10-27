// Curso de violonchelo: primera posición en clave de fa, con el orden habitual de los métodos de iniciación
// (cuerdas al aire, patrón 1-3-4 en cada cuerda, el dedo 2 para las terceras menores y la extensión hacia atrás).
// Todas las notas caben en primera posición (de Do2 a Re4). Los textos llevan su traducción al inglés.
import { L } from './tips-l10n.js';

const MIC_CARD = { title: L('Cómo te escucha la app', 'How the app listens to you'), text: L('Deja el móvil a un metro, a tu derecha, en un sitio silencioso. Haz notas largas: cuando suene afinada, la nota se pondrá verde y pasarás a la siguiente.', 'Put the phone about a metre away, on your right, somewhere quiet. Play long notes: when a note is in tune it turns green and you move on to the next.') };

export function celloUnits({ theory, notes, song, exercise, slots, warmup }) {
  const p = 'vc-';
  return [
    { id: p + 'u1', title: L('Primeros sonidos', 'First sounds'), sub: L('Las cuatro cuerdas al aire', 'The four open strings'), color: 'var(--u1)', lessons: [
      theory(p + 'u1-intro', L('Conoce tu violonchelo', 'Get to know your cello'), [
        { title: L('Cuatro cuerdas', 'Four strings'), text: L('De grave a aguda: Do, Sol, Re y La. Sentado y mirando hacia abajo, la cuerda Do queda a tu izquierda y la La a tu derecha, la más cercana al arco.', 'From low to high: C, G, D and A. Sitting and looking down, the C string is on your left and the A string on your right, nearest the bow.'), board: [36, 43, 50, 57] },
        { title: L('Cómo sentarte', 'How to sit'), text: L('En el borde de la silla, los pies apoyados y el chelo entre las rodillas. Ajusta la pica para que la clavija de Do quede junto a tu oreja izquierda y el borde de arriba, a la altura del esternón.', 'On the edge of the chair, feet flat and the cello between your knees. Set the endpin so the C peg is near your left ear and the top edge reaches your breastbone.') },
        { title: L('El arco', 'The bow'), text: L('Pulgar doblado frente al dedo medio, entre la nuez y el cuero, y los dedos dejados caer sobre la vara. El peso del brazo hace el sonido: toca a medio camino entre el puente y el diapasón.', 'Bent thumb opposite the middle finger, between the frog and the grip, with the fingers draped over the stick. The arm weight makes the sound: play halfway between the bridge and the fingerboard.') },
        { title: L('La clave de fa', 'The bass clef'), text: L('El chelo lee en clave de fa: el La al aire está en la 5.ª línea, el Re en la 3.ª, el Sol en la 1.ª y el Do, en la segunda línea adicional por debajo.', 'The cello reads bass clef: open A is on the top line, D on the middle line, G on the bottom line and C on the second ledger line below.'), board: [57, 50, 43, 36] },
        MIC_CARD,
      ]),
      warmup(p + 'u1-warm', L('Arcos largos', 'Long bows'), 'C2 C2 G2 G2 D3 D3 A3 A3 A3 A3 D3 D3 G2 G2 C2 C2'),
      notes(p + 'u1-ad', L('La y Re', 'A and D'), L('Las dos cuerdas agudas', 'The two high strings'), 'A3 A3 D3 D3 A3 D3 A3 D3 D3 D3 A3 A3 D3 A3 D3 A3'),
      notes(p + 'u1-gc', L('Sol y Do', 'G and C'), L('Las dos cuerdas graves', 'The two low strings'), 'G2 G2 C2 C2 G2 C2 G2 C2 C2 C2 G2 G2 C2 G2 C2 G2'),
      notes(p + 'u1-all', L('Cruzar cuerdas', 'Crossing strings'), L('Do, Sol, Re, La y vuelta', 'C, G, D, A and back'), 'C2 G2 D3 A3 A3 D3 G2 C2 G2 D3 G2 D3 A3 D3 A3 D3 G2 C2'),
      exercise(p + 'u1-rhythm', L('Primer ritmo', 'First rhythm'), L('Negras y blancas a tempo', 'Quarter and half notes in time'), { key: 'C', time: 4, bpm: 56, score: '| A3q A3q A3h | D3q D3q D3h | G2q G2q G2h | D3w |' }),
    ] },
    { id: p + 'u2', title: L('Dedos en La', 'Fingers on A'), sub: L('El patrón 1-3-4', 'The 1-3-4 pattern'), color: 'var(--u2)', lessons: [
      theory(p + 'u2-intro', L('Tus primeros dedos', 'Your first fingers'), [
        { title: L('Cuerda La', 'A string'), text: L('Sobre la cuerda La: el dedo 1 da Si, el 3 da Do♯ y el 4 da Re. En el chelo cada dedo ocupa medio tono, así que entre el 1 y el 3 queda el hueco del 2.', 'On the A string: finger 1 gives B, finger 3 gives C♯ and finger 4 gives D. On the cello each finger covers a semitone, so between 1 and 3 there is room for 2.'), board: [59, 61, 62] },
        { title: L('La mano', 'The hand'), text: L('Dedos redondos y separados, como si sujetaras una lata, y el pulgar detrás del mástil, frente al dedo 2. El codo, alto y suelto.', 'Round, spread fingers as if holding a can, and the thumb behind the neck, opposite finger 2. The elbow high and relaxed.') },
      ]),
      warmup(p + 'u2-warm', L('Patrón 0-1-3-4', 'Pattern 0-1-3-4'), 'A3 B3 A3 C#4 A3 D4 A3 B3 C#4 D4 C#4 B3 A3 A3'),
      notes(p + 'u2-a134', L('Subir y bajar', 'Up and down'), L('La, Si, Do♯, Re', 'A, B, C♯, D'), 'A3 B3 C#4 D4 C#4 B3 A3 B3 C#4 D4 C#4 B3 A3 A3 B3 B3 C#4 C#4 D4 D4'),
      notes(p + 'u2-jumps', L('Saltos', 'Leaps'), L('Combinaciones en la cuerda La', 'Combinations on the A string'), 'A3 C#4 B3 D4 A3 D4 C#4 A3 B3 D4 A3 C#4 B3 A3 D4 A3'),
      exercise(p + 'u2-melody', L('Primera melodía', 'First melody'), L('Solo cuerda La, a tempo', 'A string only, in time'), { key: 'A', time: 4, bpm: 60, score: '| A3q B3q C#4q D4q | C#4q B3q A3h | A3q C#4q B3q D4q | C#4q B3q A3h |' }),
    ] },
    { id: p + 'u3', title: L('Cuerda Re', 'D string'), sub: L('Escala de Re mayor', 'D major scale'), color: 'var(--u3)', lessons: [
      theory(p + 'u3-intro', L('La cuerda Re', 'The D string'), [
        { title: L('Mismos dedos, otra cuerda', 'Same fingers, another string'), text: L('Sobre la cuerda Re los dedos 1, 3 y 4 dan Mi, Fa♯ y Sol. Con la cuerda La ya tienes la escala de Re mayor.', 'On the D string fingers 1, 3 and 4 give E, F♯ and G. Together with the A string you have the D major scale.'), board: [52, 54, 55] },
      ]),
      warmup(p + 'u3-warm', L('Cruces Re-La', 'D–A crossings'), 'D3 A3 E3 B3 F#3 C#4 G3 D4 G3 C#4 F#3 B3 E3 A3 D3'),
      notes(p + 'u3-d134', L('Re, Mi, Fa♯, Sol', 'D, E, F♯, G'), L('Dedos en la cuerda Re', 'Fingers on the D string'), 'D3 E3 F#3 G3 F#3 E3 D3 E3 F#3 G3 F#3 E3 D3 F#3 E3 G3 F#3 D3'),
      notes(p + 'u3-scale', L('Escala de Re mayor', 'D major scale'), L('Una octava', 'One octave'), 'D3 E3 F#3 G3 A3 B3 C#4 D4 C#4 B3 A3 G3 F#3 E3 D3'),
      song(p + 'u3-mary', 'mary', L('Tu primera canción', 'Your first song')),
      song(p + 'u3-oda', 'oda', L('Beethoven en Re mayor', 'Beethoven in D major')),
    ] },
    { id: p + 'u4', title: L('Cuerda Sol', 'G string'), sub: L('Escala de Sol mayor', 'G major scale'), color: 'var(--u4)', lessons: [
      theory(p + 'u4-intro', L('La cuerda Sol', 'The G string'), [
        { title: L('Más grave', 'Lower down'), text: L('Sobre la cuerda Sol los dedos 1, 3 y 4 dan La, Si y Do. Sube a la cuerda Re y tendrás la escala de Sol mayor.', 'On the G string fingers 1, 3 and 4 give A, B and C. Move up to the D string and you have the G major scale.'), board: [45, 47, 48] },
      ]),
      warmup(p + 'u4-warm', L('Arpegio de Sol', 'G arpeggio'), 'G2 B2 D3 G3 D3 B2 G2 B2 D3 G3 B3 D4 B3 G3 D3 B2 G2'),
      notes(p + 'u4-g134', L('Sol, La, Si, Do', 'G, A, B, C'), L('Dedos en la cuerda Sol', 'Fingers on the G string'), 'G2 A2 B2 C3 B2 A2 G2 A2 B2 C3 B2 A2 G2 B2 A2 C3 B2 G2'),
      notes(p + 'u4-scale', L('Escala de Sol mayor', 'G major scale'), L('Una octava', 'One octave'), 'G2 A2 B2 C3 D3 E3 F#3 G3 F#3 E3 D3 C3 B2 A2 G2'),
      song(p + 'u4-luna', 'claro-luna', L('En las cuerdas Sol y Re', 'On the G and D strings')),
      slots(2, 1),
    ] },
    { id: p + 'u5', title: L('Cuerda Do', 'C string'), sub: L('Escala de Do mayor', 'C major scale'), color: 'var(--u5)', lessons: [
      theory(p + 'u5-intro', L('La cuerda Do', 'The C string'), [
        { title: L('La cuerda más grave', 'The lowest string'), text: L('Sobre la cuerda Do los dedos 1, 3 y 4 dan Re, Mi y Fa. Es la cuerda más gruesa: pide más peso del brazo y un arco más lento.', 'On the C string fingers 1, 3 and 4 give D, E and F. It is the thickest string: it needs more arm weight and a slower bow.'), board: [38, 40, 41] },
      ]),
      warmup(p + 'u5-warm', L('Arcos lentos en Do', 'Slow bows on C'), 'C2 C2 D2 D2 E2 E2 F2 F2 G2 G2 F2 F2 E2 E2 D2 D2 C2 C2'),
      notes(p + 'u5-c134', L('Do, Re, Mi, Fa', 'C, D, E, F'), L('Dedos en la cuerda Do', 'Fingers on the C string'), 'C2 D2 E2 F2 E2 D2 C2 D2 E2 F2 E2 D2 C2 E2 D2 F2 E2 C2'),
      notes(p + 'u5-scale', L('Escala de Do mayor', 'C major scale'), L('La octava grave', 'The low octave'), 'C2 D2 E2 F2 G2 A2 B2 C3 B2 A2 G2 F2 E2 D2 C2'),
      exercise(p + 'u5-martinillo', L('Martinillo en la cuerda Do', 'Frère Jacques on the C string'), L('Tradicional, en las cuerdas graves', 'Traditional, on the low strings'), { key: 'C', time: 4, bpm: 72, score: '| C2q D2q E2q C2q | C2q D2q E2q C2q | E2q F2q G2h | E2q F2q G2h | G2e A2e G2e F2e E2q C2q | G2e A2e G2e F2e E2q C2q | C2q G2q C2h | C2q G2q C2h |' }),
      slots(2, 1),
    ] },
    { id: p + 'u6', title: L('Ritmo', 'Rhythm'), sub: L('Corcheas y puntillos', 'Eighth notes and dots'), color: 'var(--u6)', lessons: [
      theory(p + 'u6-intro', L('Las figuras', 'Note values'), [
        { title: L('Cuánto dura cada nota', 'How long each note lasts'), text: L('Redonda: 4 pulsos. Blanca: 2. Negra: 1. Corchea: medio pulso, van de dos en dos. Un puntillo suma la mitad: negra con puntillo = 1 pulso y medio.', 'Whole note: 4 beats. Half: 2. Quarter: 1. Eighth: half a beat, in pairs. A dot adds half: dotted quarter = one and a half beats.') },
        { title: L('Arco para las corcheas', 'Bowing eighth notes'), text: L('En las corcheas usa poco arco, en el centro, y deja que el brazo siga el pulso.', 'For eighth notes use little bow, in the middle, and let the arm follow the pulse.') },
      ]),
      warmup(p + 'u6-warm', L('Notas repetidas', 'Repeated notes'), 'A3 A3 B3 B3 C#4 C#4 D4 D4 D4 D4 C#4 C#4 B3 B3 A3 A3'),
      exercise(p + 'u6-eighths', L('Corcheas', 'Eighth notes'), L('Dos notas por pulso', 'Two notes per beat'), { key: 'D', time: 4, bpm: 60, score: '| D4e D4e A3e A3e B3e B3e A3q | G3e G3e F#3e F#3e E3e E3e D3q | A3e A3e D4e D4e C#4e C#4e D4q | A3q. B3e A3h |' }),
      song(p + 'u6-jingle', 'jingle', L('Corcheas y puntillos', 'Eighth notes and dots')),
      slots(2, 1),
    ] },
    { id: p + 'u7', title: L('El dedo 2', 'Finger 2'), sub: L('Terceras menores y Do mayor', 'Minor thirds and C major'), color: 'var(--u7)', lessons: [
      theory(p + 'u7-intro', L('Dedo 2: tercera menor', 'Finger 2: minor third'), [
        { title: L('Medio tono más bajo', 'A semitone lower'), text: L('Con el dedo 2 en vez del 3 la nota baja medio tono: en la cuerda La da Do natural y en la cuerda Re, Fa natural.', 'Using finger 2 instead of 3 lowers the note a semitone: on the A string it gives C natural and on the D string F natural.'), board: [60, 53] },
        { title: L('Dos octavas', 'Two octaves'), text: L('Con 1-3-4 en las cuerdas Do y Sol y 1-2-4 en Re y La, la escala de Do mayor sube dos octavas sin mover la mano.', 'With 1-3-4 on the C and G strings and 1-2-4 on D and A, the C major scale climbs two octaves without moving the hand.') },
      ]),
      warmup(p + 'u7-warm', L('Dedo 2 y dedo 3', 'Finger 2 and finger 3'), 'A3 B3 C#4 B3 C4 B3 C#4 D4 C4 B3 A3 D3 E3 F#3 E3 F3 E3 D3'),
      notes(p + 'u7-low2', L('Do y Fa naturales', 'C and F natural'), L('Dedo 2 en La y en Re', 'Finger 2 on A and D'), 'A3 B3 C4 D4 C4 B3 A3 B3 C4 B3 A3 D3 E3 F3 G3 F3 E3 D3 E3 F3 E3 D3'),
      notes(p + 'u7-scale', L('Escala de Do mayor', 'C major scale'), L('Dos octavas', 'Two octaves'), 'C2 D2 E2 F2 G2 A2 B2 C3 D3 E3 F3 G3 A3 B3 C4 B3 A3 G3 F3 E3 D3 C3 B2 A2 G2 F2 E2 D2 C2'),
      slots(3, 2),
    ] },
    { id: p + 'u8', title: L('Extensiones y menores', 'Extensions and minor keys'), sub: L('Re menor y frases largas', 'D minor and long phrases'), color: 'var(--u8)', lessons: [
      theory(p + 'u8-intro', L('La extensión hacia atrás', 'The backward extension'), [
        { title: L('El dedo 1 se estira', 'Finger 1 reaches back'), text: L('Abre el dedo 1 hacia la cejuela sin mover el resto de la mano: en la cuerda La da Si♭. Es la extensión hacia atrás.', 'Open finger 1 back towards the nut without moving the rest of the hand: on the A string it gives B♭. That is the backward extension.'), board: [58] },
        { title: L('Y hacia delante', 'And forwards'), text: L('El dedo 4 se estira medio tono hacia el puente: en la cuerda Sol da Do♯ y en la cuerda Do, Fa♯. Con las dos extensiones tocas Re mayor y La mayor sin cambiar de posición.', 'Finger 4 stretches a semitone towards the bridge: on the G string it gives C♯ and on the C string F♯. With both extensions you can play D major and A major without shifting.'), board: [49, 42] },
        { title: L('Sol♯ en la cuerda Sol', 'G♯ on the G string'), text: L('El Sol♯ grave es el dedo 1 extendido hacia atrás en la cuerda Sol, justo después de la cuerda al aire. Lo usarás para volver a La en La menor.', 'Low G♯ is finger 1 extended back on the G string, just above the open string. You will use it to lead back to A in A minor.'), board: [44] },
        { title: L('Otro color', 'Another colour'), text: L('La escala de Re menor usa Fa natural, Si♭ y Do natural. Suena más melancólica.', 'The D minor scale uses F natural, B♭ and C natural. It sounds more melancholy.'), board: [53, 58, 60] },
      ]),
      warmup(p + 'u8-warm', L('Si y Si♭', 'B and B♭'), 'A3 B3 A3 Bb3 A3 B3 C4 Bb3 A3 G3 A3 Bb3 C4 D4 C4 Bb3 A3'),
      notes(p + 'u8-dmajor', L('Escala de Re mayor', 'D major scale'), L('Dos octavas, con extensiones', 'Two octaves, with extensions'), 'D2 E2 F#2 G2 A2 B2 C#3 D3 E3 F#3 G3 A3 B3 C#4 D4 C#4 B3 A3 G3 F#3 E3 D3 C#3 B2 A2 G2 F#2 E2 D2'),
      song(p + 'u8-minueto', 'minueto', L('Petzold, del cuaderno de Ana Magdalena Bach', 'Petzold, from the Anna Magdalena Bach notebook')),
      song(p + 'u8-estrellita', 'estrellita', L('En La mayor, con el Do♯ extendido', 'In A major, with the extended C♯')),
      notes(p + 'u8-scale', L('Escala de Re menor', 'D minor scale'), L('Natural, una octava', 'Natural, one octave'), 'D3 E3 F3 G3 A3 Bb3 C4 D4 C4 Bb3 A3 G3 F3 E3 D3'),
      song(p + 'u8-greensleeves', 'greensleeves', L('Tradicional en menor', 'Traditional, in a minor key')),
      slots(3, 3),
    ] },
  ];
}
