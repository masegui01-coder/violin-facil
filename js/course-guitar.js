// Curso de guitarra. Idea: tocar una canción de verdad el primer día y que cada acorde nuevo desbloquee canciones.
// Orden inspirado en los métodos más usados: Mim y Lam (dos y tres dedos), Re-La-Mi, Sol-Do, séptimas, punteo,
// arpegios, quintas y por último la cejilla. Los cambios de un minuto miden tu progreso con un número que sube.
// Notas ESCRITAS (la guitarra suena una octava más grave).

export function guitarUnits({ theory, notes, exercise, song, chordsHold, changes, sbSong, slots }) {
  return [
    { id: 'gu1', title: 'Tus primeros acordes', sub: 'Mim y Lam: tu primera canción hoy', color: 'var(--u1)', lessons: [
      theory('gu1-intro', 'Conoce tu guitarra', [
        { title: 'Seis cuerdas', text: 'De grave a aguda: Mi, La, Re, Sol, Si y Mi. Se numeran al revés: la 1.ª es la Mi aguda (la más fina) y la 6.ª la Mi grave.', board: [52, 57, 62, 67, 71, 76] },
        { title: 'Afina siempre antes', text: 'Una guitarra desafinada suena mal aunque lo hagas todo bien. Usa el afinador de la pestaña Estudio cada vez que empieces.' },
        { title: 'Las yemas duelen al principio', text: 'Es normal. Con 10 o 15 minutos al día salen callos en dos o tres semanas y deja de doler. Mejor poco cada día que mucho un día.' },
        { title: 'Cómo te escucha la app', text: 'Deja el móvil a medio metro. En los acordes, rasguea y deja sonar: cuando el acorde suene limpio, se pondrá verde.' },
      ]),
      notes('gu1-open', 'Cuerdas al aire', 'Pulsa cada cuerda sin pisar', 'E5 E5 B4 B4 G4 G4 B4 E5 E3 E3 A3 A3 D4 D4 G4 B4 E5'),
      theory('gu1-em-intro', 'Tu primer acorde: {Em}', [
        { title: '{Em}: solo dos dedos', text: 'Dedos 2 y 3 en el traste 2 de las cuerdas 5 y 4. Rasguea las seis cuerdas de arriba abajo. Apoya la yema justo detrás del traste, no encima.', chord: 'Em' },
        { title: '{Am}: el primo de {Em}', text: 'Baja los dedos 2 y 3 una cuerda (cuerdas 4 y 3) y añade el 1 en el traste 1 de la cuerda 2. No toques la 6.ª cuerda.', chord: 'Am' },
      ]),
      chordsHold('gu1-em', 'Suena {Em}', 'Pon los dedos, rasguea y deja sonar', ['Em', 'Em', 'Em', 'Em']),
      chordsHold('gu1-emam', '{Em} y {Am}', 'Cambia sin prisa', ['Em', 'Am', 'Em', 'Am', 'Em', 'Am']),
      changes('gu1-ch', 'Em', 'Am', 20),
      sbSong('gu1-song', 'balada-mim', 'Tu primera canción'),
    ] },
    { id: 'gu2', title: 'Re, La y Mi', sub: 'Tres acordes, decenas de canciones', color: 'var(--u2)', lessons: [
      theory('gu2-intro', 'Tres acordes nuevos', [
        { title: '{D}', text: 'Triángulo con los dedos 1, 3 y 2 en las tres cuerdas agudas. Rasguea solo desde la 4.ª cuerda (Re) hacia abajo.', chord: 'D' },
        { title: '{A}', text: 'Los dedos 1, 2 y 3 en fila en el traste 2. Si no caben, inclínalos un poco. Rasguea desde la 5.ª cuerda.', chord: 'A' },
        { title: '{E}', text: 'Es {Em} con el dedo 1 en el traste 1 de la 3.ª cuerda. Fíjate: el 2 y el 3 ya estaban.', chord: 'E' },
        { title: 'Dedos ancla', text: 'Cuando cambies, busca el dedo que no se mueve o que solo se desliza. De {A} a {E} el dedo 1 se queda casi en el mismo sitio.' },
      ]),
      chordsHold('gu2-da', '{D} y {A}', 'El cambio más famoso', ['D', 'A', 'D', 'A', 'D', 'A']),
      changes('gu2-ch-da', 'D', 'A', 25),
      sbSong('gu2-tom', 'tom-dooley', 'Dos acordes, una canción entera'),
      chordsHold('gu2-ae', '{A} y {E}', 'Con dedo ancla', ['A', 'E', 'A', 'E', 'D', 'A', 'E', 'A']),
      changes('gu2-ch-ae', 'A', 'E', 25),
      sbSong('gu2-mosq', 'tres-mosqueteros', 'Re, La y Mi juntos'),
      slots(1, 1),
    ] },
    { id: 'gu3', title: 'Sol y Do', sub: 'Los acordes de mil canciones', color: 'var(--u3)', lessons: [
      theory('gu3-intro', 'Sol y Do', [
        { title: '{G}', text: 'Dedo 2 en el traste 3 de la 6.ª, dedo 1 en el 2 de la 5.ª y dedo 3 en el 3 de la 1.ª. Suenan las seis cuerdas.', chord: 'G' },
        { title: '{C}', text: 'Una escalera: dedo 3 en la 5.ª (traste 3), dedo 2 en la 4.ª (traste 2) y dedo 1 en la 2.ª (traste 1). No toques la 6.ª.', chord: 'C' },
      ]),
      chordsHold('gu3-gc', '{G} y {C}', 'Despacio y limpio', ['G', 'C', 'G', 'C', 'G', 'D', 'G']),
      changes('gu3-ch-gc', 'G', 'C', 20),
      sbSong('gu3-cumple', 'cumple', 'Para cualquier cumpleaños'),
      changes('gu3-ch-gd', 'G', 'D', 25),
      sbSong('gu3-grace', 'amazing-grace', 'En tres por cuatro'),
      slots(1, 1),
    ] },
    { id: 'gu4', title: 'Ritmo y séptimas', sub: 'Rasgueo con ganas', color: 'var(--u4)', lessons: [
      theory('gu4-intro', 'La mano derecha', [
        { title: 'El péndulo', text: 'La mano no para de moverse arriba y abajo al ritmo, toques o no. Abajo en cada pulso, arriba entre pulsos. Así nunca pierdes el compás.' },
        { title: 'El rasgueo de casi todo', text: 'Abajo, abajo-arriba, arriba-abajo-arriba (↓ ↓↑ ↑↓↑). Empieza con la mano suelta y la púa sujeta sin apretar.' },
        { title: 'Acordes de séptima', text: '{A7}, {D7}, {E7} y {G7} suenan con «ganas de ir» al siguiente acorde. Muchos son más fáciles que el acorde normal.', chord: 'A7' },
      ]),
      chordsHold('gu4-sevenths', 'Las séptimas', '{A7}, {D7}, {E7} y {G7}', ['A7', 'D7', 'E7', 'G7', 'A7', 'D7']),
      sbSong('gu4-kumbaya', 'kumbaya', 'Rasgueo ↓ ↓↑ ↑↓↑'),
      sbSong('gu4-cucaracha', 'cucaracha', 'Rápida y alegre'),
      sbSong('gu4-saints', 'when-saints', 'Con {G7} y {D7}'),
      slots(1, 2),
    ] },
    { id: 'gu5', title: 'Punteo', sub: 'Melodías nota a nota', color: 'var(--u5)', lessons: [
      theory('gu5-intro', 'Tocar melodías', [
        { title: 'Primera posición', text: 'Cada dedo se encarga de un traste: el 1 del primero, el 2 del segundo y el 3 del tercero. Pulsa con la púa hacia abajo.', board: [76, 77, 79] },
        { title: 'Las cuerdas 1 y 2', text: 'Cuerda 1: Mi (al aire), Fa (traste 1) y Sol (traste 3). Cuerda 2: Si (al aire), Do (traste 1) y Re (traste 3).', board: [71, 72, 74] },
      ]),
      notes('gu5-e', 'Cuerda 1', 'Mi, Fa y Sol', 'E5 F5 G5 F5 E5 F5 G5 G5 F5 E5 E5 G5 F5 E5'),
      notes('gu5-b', 'Cuerda 2', 'Si, Do y Re', 'B4 C5 D5 C5 B4 C5 D5 D5 C5 B4 D5 E5 D5 C5 B4'),
      exercise('gu5-oda', 'Oda a la alegría', 'Beethoven en las dos primeras cuerdas', { key: 'C', time: 4, bpm: 72, score: '| E5q E5q F5q G5q | G5q F5q E5q D5q | C5q C5q D5q E5q | E5q. D5e D5h | E5q E5q F5q G5q | G5q F5q E5q D5q | C5q C5q D5q E5q | D5q. C5e C5h |' }),
      song('gu5-estrellita', 'estrellita', 'Melodía con la púa'),
      slots(1, 1),
    ] },
    { id: 'gu6', title: 'Arpegios', sub: 'Dedos de la mano derecha', color: 'var(--u6)', lessons: [
      theory('gu6-intro', 'Arpegiar', [
        { title: 'p i m a', text: 'Pulgar (p) para las cuerdas graves; índice (i), medio (m) y anular (a) para las cuerdas 3, 2 y 1. Deja que todo suene junto.' },
        { title: '{Fmaj7}, un Fa sin cejilla', text: 'Dedos 3, 2 y 1 en escalera sobre las cuerdas 4, 3 y 2; la 1.ª al aire. Suena precioso y prepara la cejilla.', chord: 'Fmaj7' },
        { title: '{Dm}', text: 'Como {D}, pero el dedo 1 baja al traste 1 de la 1.ª cuerda. Más triste, más bonito.', chord: 'Dm' },
      ]),
      chordsHold('gu6-am-c', 'Arpegia {Am}, {C} y {Fmaj7}', 'p-i-m-a en cada acorde', ['Am', 'C', 'Fmaj7', 'Am', 'C', 'Fmaj7']),
      changes('gu6-ch', 'C', 'Fmaj7', 20),
      sbSong('gu6-sol', 'sol-naciente', 'Arpegios en 3 por 4'),
      chordsHold('gu6-dm', '{Dm} y {Am}', 'Los menores', ['Dm', 'Am', 'Dm', 'Am', 'E', 'Am']),
      sbSong('gu6-scarborough', 'scarborough', 'Melancólica, en 3 por 4'),
      slots(1, 2),
    ] },
    { id: 'gu7', title: 'Quintas y blues', sub: 'Power chords', color: 'var(--u7)', lessons: [
      theory('gu7-intro', 'Acordes de quinta', [
        { title: 'Dos notas, mucha energía', text: 'Un acorde de quinta ({E5}, {A5}…) es solo la nota base y su quinta. Se mueve igual por todo el mástil: aprende la forma una vez y sirve siempre.', chord: 'G5' },
        { title: 'Silencia lo que sobra', text: 'Toca solo las cuerdas del acorde. Apoya un poco la palma derecha sobre las cuerdas graves cerca del puente para un sonido más seco.' },
        { title: '{B7}', text: 'El acorde que lleva de vuelta a {E} en el blues. Cuatro dedos: tómate tu tiempo.', chord: 'B7' },
      ]),
      chordsHold('gu7-power', 'Quintas', '{E5}, {G5}, {A5}, {D5} y {C5}', ['E5', 'G5', 'A5', 'D5', 'C5', 'E5']),
      sbSong('gu7-riff', 'rock-quintas', 'Tu primer riff'),
      sbSong('gu7-blues', 'blues-mi', 'Doce compases de blues'),
      slots(1, 2),
    ] },
    { id: 'gu8', title: 'La cejilla', sub: 'Fa y Sim: el gran salto', color: 'var(--u8)', lessons: [
      theory('gu8-intro', 'La cejilla', [
        { title: 'El dedo 1 como cejuela', text: 'Estira el dedo 1 sobre todas las cuerdas en el traste 1, un poco de lado (el hueso, no la yema). Presiona con el peso del brazo, no apretando el pulgar.', chord: 'F' },
        { title: 'Paciencia', text: 'La cejilla tarda semanas en sonar limpia. Toca primero solo las cuerdas agudas y ve añadiendo. Todos los guitarristas han pasado por aquí.' },
        { title: '{Bm}', text: 'Cejilla en el traste 2 desde la 5.ª cuerda, con la forma de {Am} dos trastes más arriba.', chord: 'Bm' },
      ]),
      chordsHold('gu8-f', 'Suena {F}', 'Cuerda a cuerda, sin prisa', ['F', 'F', 'C', 'F', 'Am', 'F']),
      changes('gu8-ch', 'C', 'F', 15),
      sbSong('gu8-pop', 'pop-cuatro', 'Los cuatro acordes del pop'),
      sbSong('gu8-cejilla', 'pop-cejilla', 'Con {F} de verdad'),
      sbSong('gu8-bm', 'sim-cejilla', 'Cejilla en el traste 2'),
      slots(2, 3),
    ] },
  ];
}
