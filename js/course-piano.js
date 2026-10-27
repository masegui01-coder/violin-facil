// Curso de piano. Primer día: la Oda a la alegría con la mano derecha. Después la mano izquierda en clave de fa,
// acordes para acompañar canciones (cada acorde desbloquea canciones del cancionero), la posición de Sol,
// el paso del pulgar y por fin las dos manos juntas. Los números bajo las notas son los dedos (1 = pulgar).

export function pianoUnits({ theory, notes, exercise, song, chordsHold, changes, sbSong, slots }) {
  const bass = { clef: 'bass' };
  return [
    { id: 'pu1', title: 'Posición de Do', sub: 'Cinco dedos, tu primera melodía', color: 'var(--u1)', lessons: [
      theory('pu1-intro', 'Conoce el teclado', [
        { title: 'Encuentra el Do', text: 'Las teclas negras van en grupos de dos y de tres. El Do es la tecla blanca justo a la izquierda de cada grupo de dos. El del centro del piano es el Do central.', board: [60] },
        { title: 'Tus dedos tienen número', text: 'En las dos manos: 1 el pulgar, 2 el índice, 3 el medio, 4 el anular y 5 el meñique. Los verás debajo de cada nota.' },
        { title: 'La postura', text: 'Siéntate a la altura justa para que el antebrazo quede recto. Mano redondeada, como si sujetaras una naranja, y toca con la yema.' },
        { title: 'Cómo te escucha la app', text: 'Deja el móvil cerca del piano. Toca cada nota con decisión y suéltala: cuando suene la correcta se pondrá verde.' },
      ]),
      notes('pu1-cde', 'Do, Re, Mi', 'Dedos 1, 2 y 3', 'C4 D4 E4 D4 C4 E4 D4 C4 C4 D4 E4 E4 D4 C4', { fingers: '1 2 3 2 1 3 2 1 1 2 3 3 2 1' }),
      notes('pu1-cg', 'Cinco dedos', 'Do, Re, Mi, Fa y Sol', 'C4 D4 E4 F4 G4 F4 E4 D4 C4 E4 G4 E4 C4', { fingers: '1 2 3 4 5 4 3 2 1 3 5 3 1' }),
      exercise('pu1-oda', 'Oda a la alegría', 'Tu primera canción, hoy mismo', { key: 'C', time: 4, bpm: 72, score: '| E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | E4q. D4e D4h | E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | D4q. C4e C4h |' },
        { fingers: '3 3 4 5 5 4 3 2 1 1 2 3 3 2 2 3 3 4 5 5 4 3 2 1 1 2 3 2 1 1' }),
      exercise('pu1-mary', 'María tenía un corderito', 'Sin mirar las manos', { key: 'C', time: 4, bpm: 84, score: '| E4q D4q C4q D4q | E4q E4q E4h | D4q D4q D4h | E4q G4q G4h | E4q D4q C4q D4q | E4q E4q E4q E4q | D4q D4q E4q D4q | C4w |' },
        { fingers: '3 2 1 2 3 3 3 2 2 2 3 5 5 3 2 1 2 3 3 3 3 2 2 3 2 1' }),
    ] },
    { id: 'pu2', title: 'Mano izquierda', sub: 'La clave de fa', color: 'var(--u2)', lessons: [
      theory('pu2-intro', 'La clave de fa', [
        { title: 'Otra clave para los graves', text: 'La mano izquierda lee en clave de fa: los dos puntos rodean la línea del Fa. El Do grave (un Do por debajo del central) está en el segundo espacio.', board: [48, 50, 52, 53, 55] },
        { title: 'Al revés que la derecha', text: 'En la izquierda el meñique (5) está en el Do y el pulgar (1) en el Sol. Subir es ir hacia el pulgar.' },
      ]),
      notes('pu2-five', 'Cinco dedos (izquierda)', 'Do, Re, Mi, Fa y Sol graves', 'C3 D3 E3 F3 G3 F3 E3 D3 C3 E3 G3 E3 C3', { ...bass, fingers: '5 4 3 2 1 2 3 4 5 3 1 3 5' }),
      exercise('pu2-oda', 'Oda con la izquierda', 'La misma canción, una octava más grave', { key: 'C', time: 4, bpm: 72, score: '| E3q E3q F3q G3q | G3q F3q E3q D3q | C3q C3q D3q E3q | E3q. D3e D3h | E3q E3q F3q G3q | G3q F3q E3q D3q | C3q C3q D3q E3q | D3q. C3e C3h |' },
        { ...bass, fingers: '3 3 2 1 1 2 3 4 5 5 4 3 3 4 4 3 3 2 1 1 2 3 4 5 5 4 3 4 5 5' }),
      exercise('pu2-estrellita', 'Estrellita (izquierda)', 'Con un pequeño estiramiento', { key: 'C', time: 4, bpm: 80, score: '| C3q C3q G3q G3q | A3q A3q G3h | F3q F3q E3q E3q | D3q D3q C3h |' },
        { ...bass, fingers: '5 5 1 1 1 1 1 2 2 3 3 4 4 5' }),
    ] },
    { id: 'pu3', title: 'Tus primeros acordes', sub: 'Do, Fa y Sol', color: 'var(--u3)', lessons: [
      theory('pu3-intro', 'Tres notas a la vez', [
        { title: '{C}', text: 'Dedos 1, 3 y 5 en Do, Mi y Sol. Baja las tres teclas a la vez, como una sola.', chord: 'C' },
        { title: '{F} sin moverte casi', text: 'Deja el pulgar en Do, sube el 3 al Fa y el 5 al La. Así el cambio es mínimo.', chord: 'F' },
        { title: '{G} cerca del Do', text: 'Pulgar al Si, dedo 2 al Re y el 5 se queda en el Sol. Con {C}, {F} y {G} se acompañan cientos de canciones.', chord: 'G' },
      ]),
      chordsHold('pu3-c', 'Suena {C}', 'Las tres teclas a la vez', ['C', 'C', 'C', 'C']),
      chordsHold('pu3-cfg', '{C}, {F} y {G}', 'Moviendo lo mínimo', ['C', 'F', 'C', 'G', 'C', 'F', 'G', 'C']),
      changes('pu3-ch-cg', 'C', 'G', 30),
      changes('pu3-ch-cf', 'C', 'F', 30),
      sbSong('pu3-cumple', 'cumple-do', 'Acompaña un cumpleaños'),
      sbSong('pu3-kumbaya', 'kumbaya-do', 'Tres acordes, una canción'),
    ] },
    { id: 'pu4', title: 'Acompañar canciones', sub: 'Menores y séptimas', color: 'var(--u4)', lessons: [
      theory('pu4-intro', 'Más colores', [
        { title: '{Am}', text: 'Desde {C}, cambia solo el 5: del Sol al La. Un dedo y el acorde se vuelve triste.', chord: 'Am' },
        { title: '{G7}', text: 'Como {G}, pero con el Fa: pide volver a {C}. Pulgar en Si, 4 en Fa y 5 en Sol.', chord: 'G7' },
        { title: '{Dm}', text: 'Re, Fa y La con los dedos 1, 3 y 5.', chord: 'Dm' },
        { title: '{C7}', text: 'Es {C} con un Si♭ añadido: Do, Mi, Sol y Si♭. Suena a blues y pide ir a {F}.', chord: 'C7' },
      ]),
      chordsHold('pu4-minors', 'Menores y séptimas', '{Am}, {Dm} y {G7}', ['Am', 'Dm', 'G7', 'C', 'Am', 'F', 'G7', 'C']),
      sbSong('pu4-pop', 'pop-cuatro', 'Los cuatro acordes del pop'),
      sbSong('pu4-clementine', 'clementine', 'Con {G7}'),
      sbSong('pu4-grace', 'grace-do', 'En tres por cuatro'),
      sbSong('pu4-saints', 'saints-do', 'Con {C7}'),
    ] },
    { id: 'pu5', title: 'Posición de Sol', sub: 'Tu primer sostenido', color: 'var(--u5)', lessons: [
      theory('pu5-intro', 'Otra posición', [
        { title: 'Pulgar en Sol', text: 'Coloca el pulgar derecho en el Sol de arriba del Do central y los demás dedos en La, Si, Do y Re.', board: [67, 69, 71, 72, 74] },
        { title: 'Fa sostenido', text: 'En Sol mayor el Fa es sostenido: la tecla negra justo a la derecha del Fa. La armadura te lo recuerda al principio de cada línea.', board: [66] },
      ]),
      notes('pu5-g', 'Cinco dedos en Sol', 'Sol, La, Si, Do y Re', 'G4 A4 B4 C5 D5 C5 B4 A4 G4 B4 D5 B4 G4', { fingers: '1 2 3 4 5 4 3 2 1 3 5 3 1' }),
      song('pu5-minueto', 'minueto', 'Petzold, del cuaderno de Ana Magdalena Bach'),
      song('pu5-estrellita', 'estrellita', 'En otra tonalidad'),
      slots(1, 1),
    ] },
    { id: 'pu6', title: 'Ritmo', sub: 'Corcheas y puntillos', color: 'var(--u6)', lessons: [
      theory('pu6-intro', 'Las figuras', [
        { title: 'Cuánto dura cada nota', text: 'Redonda: 4 pulsos. Blanca: 2. Negra: 1. Corchea: medio pulso. Un puntillo suma la mitad de la nota.' },
        { title: 'Cuenta en voz alta', text: '«Uno y dos y tres y cuatro y»: las corcheas caen en los números y en las «y». Activa el metrónomo para no correr.' },
      ]),
      exercise('pu6-eighths', 'Corcheas', 'Dos notas por pulso', { key: 'C', time: 4, bpm: 66, score: '| C4e C4e D4e D4e E4e E4e D4q | E4e E4e F4e F4e G4h | G4e F4e E4e D4e C4q E4q | D4q. D4e C4h |' },
        { fingers: '1 1 2 2 3 3 2 3 3 4 4 5 5 4 3 2 1 3 2 2 1' }),
      song('pu6-jingle', 'jingle', 'Corcheas con alegría'),
      song('pu6-mary', 'mary', 'Ahora en Re'),
      slots(2, 1),
    ] },
    { id: 'pu7', title: 'Escalas', sub: 'El paso del pulgar', color: 'var(--u7)', lessons: [
      theory('pu7-intro', 'Más allá de cinco dedos', [
        { title: 'El pulgar pasa por debajo', text: 'Sube Do-Re-Mi con 1-2-3 y pasa el pulgar por debajo hasta el Fa. Sigue con 1-2-3-4-5 hasta el Do de arriba.', board: [60, 62, 64, 65, 67, 69, 71, 72] },
        { title: 'Bajando', text: 'Al bajar es al revés: el dedo 3 cruza por encima del pulgar del Fa al Mi.' },
        { title: '{E}', text: 'Mi, Sol♯ y Si: la tecla negra del medio es el Sol♯. En La menor, {E} es el acorde que vuelve a {Am}.', chord: 'E' },
      ]),
      notes('pu7-scale', 'Escala de Do (derecha)', 'Con paso del pulgar', 'C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4', { fingers: '1 2 3 1 2 3 4 5 4 3 2 1 3 2 1' }),
      notes('pu7-scale-lh', 'Escala de Do (izquierda)', 'El 3 cruza al subir', 'C3 D3 E3 F3 G3 A3 B3 C4 B3 A3 G3 F3 E3 D3 C3', { ...bass, fingers: '5 4 3 2 1 3 2 1 2 3 1 2 3 4 5' }),
      song('pu7-greensleeves', 'greensleeves', 'Tradicional inglesa'),
      sbSong('pu7-vals', 'vals-lam', 'Vals con {Am}, {Dm} y {E}'),
      slots(2, 2),
    ] },
    { id: 'pu8', title: 'Las dos manos', sub: 'Bajo, acorde y Para Elisa', color: 'var(--u8)', lessons: [
      theory('pu8-intro', 'Las dos manos juntas', [
        { title: 'Bajo y acorde', text: 'La izquierda toca la nota que da nombre al acorde (el bajo) y la derecha el acorde. Empieza muy despacio: primero que suenen juntas, luego a tempo.', chord: 'C' },
        { title: 'Para Elisa', text: 'Beethoven la escribió en 1810. El famoso comienzo alterna Mi y Re♯ con los dedos 5 y 4 de la derecha.', board: [76, 75] },
      ]),
      chordsHold('pu8-bass', 'Bajo y acorde', 'Izquierda en el bajo, derecha en el acorde', ['C', 'F', 'G', 'C', 'Am', 'Dm', 'G7', 'C']),
      sbSong('pu8-kumbaya', 'kumbaya-do', 'Ahora con las dos manos'),
      notes('pu8-elisa', 'Para Elisa', 'El comienzo, mano derecha', 'E5 D#5 E5 D#5 E5 B4 D5 C5 A4 C4 E4 A4 B4 E4 G#4 B4 C5', { fingers: '5 4 5 4 5 2 4 3 1 1 2 3 4 1 3 4 5', noReverse: true }),
      slots(2, 3),
    ] },
  ];
}
