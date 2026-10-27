// Curso de ukelele (Sol-Do-Mi-La, con el Sol agudo). Idea: el instrumento más agradecido para empezar.
// Primera canción el primer día con acordes de un dedo ({C}, {Am}), los cuatro acordes mágicos del pop,
// el rasgueo de isla, nuevas tonalidades, punteo, fingerpicking, el chuck y el reggae, la cejilla y, para terminar,
// la cadencia andaluza. El ukelele se escribe como suena. Los cambios de un minuto miden tu progreso.

export function ukuleleUnits({ theory, notes, exercise, song, chordsHold, changes, sbSong, slots }) {
  return [
    { id: 'uk1', title: 'Tu primer acorde', sub: 'Do con un dedo y tu primera canción', color: 'var(--u1)', lessons: [
      theory('uk1-intro', 'Conoce tu ukelele', [
        { title: 'Sol, Do, Mi, La', text: 'Las cuatro cuerdas, de la de arriba (la 4.ª) a la de abajo (la 1.ª). El Sol es agudo, no grave: por eso el ukelele suena tan alegre y brillante.', board: [67, 60, 64, 69] },
        { title: 'Cómo se sujeta', text: 'Apoya el cuerpo contra el pecho y sujétalo suave con el antebrazo derecho. El mástil, un poco hacia arriba. El pulgar izquierdo, detrás del mástil, sin apretar.' },
        { title: 'Se rasguea con el índice', text: 'Hacia abajo con la uña, hacia arriba con la yema. Rasguea donde acaba el mástil, no encima de la boca: suena más dulce.' },
        { title: 'Cómo te escucha la app', text: 'Deja el móvil a medio metro. En los acordes, rasguea y deja sonar: cuando el acorde suene limpio, se pondrá verde. Afina antes en Estudio → Afinador.' },
      ]),
      notes('uk1-open', 'Cuerdas al aire', 'Pulsa cada cuerda sin pisar', 'G4 G4 C4 C4 E4 E4 A4 A4 E4 C4 G4 A4 C4 E4 A4'),
      theory('uk1-c-intro', 'Acordes de un dedo', [
        { title: '{C}: un solo dedo', text: 'Dedo 3 (anular) en el traste 3 de la 1.ª cuerda, la de abajo. Rasguea las cuatro. Ya estás tocando un acorde.', chord: 'C' },
        { title: '{Am}: también un dedo', text: 'Dedo 2 (medio) en el traste 2 de la 4.ª cuerda, la de arriba. Suena más triste que {C}: es un acorde menor.', chord: 'Am' },
        { title: 'Apoya justo detrás del traste', text: 'Con la yema, de punta y casi tocando el metal del traste. Así basta con poca fuerza y la cuerda no zumba.' },
      ]),
      chordsHold('uk1-c', 'Suena {C}', 'Pon el dedo, rasguea y deja sonar', ['C', 'C', 'C', 'C']),
      chordsHold('uk1-cam', '{C} y {Am}', 'Cambia sin prisa', ['C', 'Am', 'C', 'Am', 'C', 'Am']),
      changes('uk1-ch', 'C', 'Am', 30),
      sbSong('uk1-song', 'uke-do-lam', 'Tu primera canción'),
    ] },
    { id: 'uk2', title: 'Fa y Sol', sub: 'Los cuatro acordes mágicos', color: 'var(--u2)', lessons: [
      theory('uk2-intro', 'Dos acordes nuevos', [
        { title: '{F}', text: 'Dedo 1 en el traste 1 de la 2.ª cuerda (Mi) y dedo 2 en el traste 2 de la 4.ª (Sol). Truco: de {Am} a {F} el dedo 2 no se mueve, solo añades el 1.', chord: 'F' },
        { title: '{G}', text: 'Un triángulo: dedo 1 en el traste 2 de la 3.ª, dedo 2 en el traste 2 de la 1.ª y dedo 3 en el traste 3 de la 2.ª. Es el más difícil de los cuatro: dale tiempo.', chord: 'G' },
        { title: 'Los cuatro mágicos', text: '{C}, {G}, {Am} y {F}: con estos cuatro se tocan cientos de canciones de pop. Ya los tienes todos.' },
      ]),
      chordsHold('uk2-cf', '{C} y {F}', 'Con el dedo 2 de ancla', ['C', 'F', 'C', 'F', 'Am', 'F']),
      changes('uk2-ch-amf', 'Am', 'F', 30),
      chordsHold('uk2-cg', '{C} y {G}', 'El triángulo, despacio', ['C', 'G', 'C', 'G', 'F', 'G', 'C']),
      changes('uk2-ch-cg', 'C', 'G', 20),
      sbSong('uk2-cumple', 'cumple-do', 'Para cualquier cumpleaños'),
      sbSong('uk2-pop', 'pop-cuatro', 'Los cuatro acordes del pop'),
      slots(1, 1),
    ] },
    { id: 'uk3', title: 'Ritmo de isla', sub: 'Rasgueos y séptimas', color: 'var(--u3)', lessons: [
      theory('uk3-intro', 'La mano derecha', [
        { title: 'El péndulo', text: 'La mano no para: abajo en cada pulso y arriba entre pulsos, toques o no. Así nunca pierdes el compás.' },
        { title: 'El rasgueo de isla', text: 'Abajo, abajo-arriba, arriba-abajo-arriba (↓ ↓↑ ↑↓↑). Es el ritmo del ukelele por excelencia. Dilo en voz alta mientras rasgueas: «uno, dos-y, y-cua-tro-y».' },
        { title: '{C7} y {G7}', text: '{C7} es el acorde más fácil de todos: dedo 1 en el traste 1 de la 1.ª cuerda. {G7} es un triángulo al revés que el de {G}. Las séptimas «piden» volver a casa.', chord: 'G7' },
        { title: '{Dm}', text: 'Lo vas a encontrar en las canciones de esta unidad: trastes 2, 2 y 1 en las cuerdas 4, 3 y 2 (la 1.ª al aire). Es {F} con un dedo más.', chord: 'Dm' },
      ]),
      chordsHold('uk3-sevenths', '{G7} y {C7}', 'Con ganas de volver a {C}', ['C', 'G7', 'C', 'C7', 'F', 'G7', 'C']),
      changes('uk3-ch', 'C', 'G7', 30),
      sbSong('uk3-clementine', 'clementine', 'En tres por cuatro'),
      sbSong('uk3-aloha', 'aloha-oe', 'La canción hawaiana más famosa'),
      sbSong('uk3-saints', 'saints-do', 'Con {C7} y {G7}'),
      slots(1, 2),
    ] },
    { id: 'uk4', title: 'Re, La y el blues', sub: 'Nuevas tonalidades', color: 'var(--u4)', lessons: [
      theory('uk4-intro', 'Acordes de Re y La', [
        { title: '{D}', text: 'Dedos 1, 2 y 3 en el traste 2 de las cuerdas 4, 3 y 2. Si no caben, prueba a pisar las tres con el dedo 1 estirado.', chord: 'D' },
        { title: '{A}', text: 'Dedo 2 en el traste 2 de la 4.ª y dedo 1 en el traste 1 de la 3.ª. {A7} es todavía más fácil: solo el dedo 1.', chord: 'A' },
        { title: 'El blues: {A7}, {D7} y {E7}', text: 'Doce compases con tres séptimas. {D7}: traste 2 en las cuerdas 4 y 2. {E7}: trastes 1, 2 y 2 en las cuerdas 4, 3 y 1.', chord: 'E7' },
      ]),
      chordsHold('uk4-da', '{D} y {A}', 'El cambio de las canciones del oeste', ['D', 'A', 'D', 'A', 'D', 'A']),
      changes('uk4-ch-da', 'D', 'A', 25),
      sbSong('uk4-tom', 'tom-dooley', 'Dos acordes, una canción entera'),
      sbSong('uk4-cucaracha', 'cucaracha', 'Rápida y alegre, con {A7}'),
      chordsHold('uk4-blues-ch', 'Las séptimas del blues', '{A7}, {D7} y {E7}', ['A7', 'D7', 'A7', 'E7', 'D7', 'A7']),
      sbSong('uk4-blues', 'blues-la', 'Doce compases de blues'),
      slots(1, 2),
    ] },
    { id: 'uk5', title: 'Melodías', sub: 'Punteo nota a nota', color: 'var(--u5)', lessons: [
      theory('uk5-intro', 'Tocar melodías', [
        { title: 'Un dedo por traste', text: 'El dedo 1 se encarga del traste 1, el 2 del 2 y el 3 del 3. Pulsa con el pulgar o el índice, de una en una.', board: [69, 71, 72] },
        { title: 'Las cuerdas La y Mi', text: 'Cuerda La (1.ª): La al aire, Si en el traste 2 y Do en el 3. Cuerda Mi (2.ª): Mi al aire, Fa en el traste 1 y Sol en el 3.', board: [64, 65, 67] },
        { title: 'La cuerda Do', text: 'Do al aire y Re en el traste 2. Con las tres cuerdas ya tienes la escala de Do entera.', board: [60, 62] },
      ]),
      notes('uk5-a', 'Cuerda La', 'La, Si y Do', 'A4 B4 C5 B4 A4 B4 C5 C5 B4 A4 A4 C5 B4 A4'),
      notes('uk5-e', 'Cuerda Mi', 'Mi, Fa y Sol', 'E4 F4 G4 F4 E4 F4 G4 G4 F4 E4 E4 G4 F4 E4'),
      notes('uk5-scale', 'Escala de Do', 'Tres cuerdas', 'C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4'),
      exercise('uk5-oda', 'Oda a la alegría', 'Beethoven en las cuerdas Do y Mi', { key: 'C', time: 4, bpm: 72, score: '| E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | E4q. D4e D4h | E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | D4q. C4e C4h |' }),
      exercise('uk5-estrellita', 'Estrellita', 'En Do, en las cuerdas Do, Mi y La', { key: 'C', time: 4, bpm: 80, score: '| C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h | G4q G4q F4q F4q | E4q E4q D4h | G4q G4q F4q F4q | E4q E4q D4h | C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h |' }),
      slots(1, 1),
    ] },
    { id: 'uk6', title: 'Menores y fingerpicking', sub: 'Tocar con los dedos', color: 'var(--u6)', lessons: [
      theory('uk6-intro', 'Con los dedos', [
        { title: 'p, i, m, a', text: 'Pulgar (p) para la 4.ª cuerda, índice (i) para la 3.ª, medio (m) para la 2.ª y anular (a) para la 1.ª. Cada dedo, su cuerda.' },
        { title: 'El patrón p-i-m-a', text: 'Una cuerda detrás de otra, de arriba abajo, y deja que todas sigan sonando. Despacio y parejo: suena a caja de música.' },
        { title: '{Dm} y {Em}', text: '{Dm}: trastes 2, 2 y 1 en las cuerdas 4, 3 y 2. {Em}: trastes 4, 3 y 2 en las cuerdas 3, 2 y 1 (la 4.ª al aire).', chord: 'Dm' },
      ]),
      chordsHold('uk6-minors', '{Am}, {Dm} y {Em}', 'Arpegia p-i-m-a en cada uno', ['Am', 'Dm', 'Em', 'Am', 'Dm', 'Am']),
      changes('uk6-ch', 'Am', 'Dm', 25),
      sbSong('uk6-nana', 'nana-lam', 'Una nana en tres por cuatro'),
      sbSong('uk6-scarborough', 'scarborough', 'Melancólica, en 3 por 4'),
      slots(1, 2),
    ] },
    { id: 'uk7', title: 'El chuck y el reggae', sub: 'Golpe apagado y contratiempo', color: 'var(--u7)', lessons: [
      theory('uk7-intro', 'Ritmos con carácter', [
        { title: 'El chuck', text: 'En el 2 y el 4, rasguea hacia abajo y apaga las cuerdas a la vez con el canto de la mano. Suena «chuck», como una caja de batería.' },
        { title: 'Reggae', text: 'Rasguea solo a contratiempo, entre los pulsos (hacia arriba), y apaga enseguida. Cuenta «uno-Y, dos-Y» y toca solo en la Y.' },
        { title: '{Em7}', text: 'Dedo 1 en el traste 2 de la 3.ª y dedo 2 en el traste 2 de la 1.ª. Un color suave que queda bien en el reggae.', chord: 'Em7' },
      ]),
      sbSong('uk7-reggae', 'uke-reggae', 'Rasgueo a contratiempo'),
      sbSong('uk7-susanna', 'oh-susanna', 'Con chuck en el 2 y el 4'),
      sbSong('uk7-balada', 'pop-cejilla', 'Balada con {Em}', { title: 'Balada en La menor' }),
      slots(1, 2),
    ] },
    { id: 'uk8', title: 'Cejilla y Si♭', sub: 'Acordes móviles', color: 'var(--u8)', lessons: [
      theory('uk8-intro', 'La cejilla', [
        { title: 'Mucho más fácil que en guitarra', text: 'Solo son cuatro cuerdas y están poco tensas. Estira el dedo 1 sobre todas, un poco de lado, y presiona con el peso del brazo.' },
        { title: '{Bb}', text: 'Cejilla en el traste 1 con el dedo 1, dedo 2 en el traste 2 de la 3.ª y dedo 3 en el traste 3 de la 4.ª.', chord: 'Bb' },
        { title: '{Bm} y {B7}', text: 'Cejilla en el traste 2. Para {Bm}, dedo 3 en el traste 4 de la 4.ª; para {B7}, dedo 2 en el traste 3 de la 3.ª.', chord: 'Bm' },
      ]),
      chordsHold('uk8-bb', 'Suena {Bb}', 'Cuerda a cuerda, sin prisa', ['F', 'Bb', 'F', 'C', 'F', 'Bb']),
      changes('uk8-ch', 'F', 'Bb', 20),
      sbSong('uk8-bm', 'sim-cejilla', 'Cejilla en el traste 2'),
      sbSong('uk8-medio', 'por-medio', 'Con {Bb} con cejilla'),
      slots(2, 3),
    ] },
    { id: 'uk9', title: 'Rumba y cadencia andaluza', sub: 'Flamenco en el ukelele', color: 'var(--u1)', lessons: [
      theory('uk9-intro', 'Flamenco en cuatro cuerdas', [
        { title: 'La cadencia andaluza', text: '{Am}, {G}, {F} y {E}: bajando de uno en uno. Es el sonido del flamenco y en el ukelele también funciona.', chord: 'E' },
        { title: '{E}', text: 'Dedo 1 en el traste 1 de la 4.ª, dedo 2 en el traste 2 de la 1.ª y dedo 4 en el traste 4 de la 3.ª. Si cuesta, usa {E7} mientras tanto.' },
        { title: 'El rasgueo de rumba', text: 'Abajo, arriba y un golpe seco con la palma que apaga las cuerdas en el 2 y el 4. Empieza despacio.' },
      ]),
      changes('uk9-ch', 'F', 'E', 20),
      sbSong('uk9-cadencia', 'cadencia-andaluza', 'El sonido del flamenco'),
      sbSong('uk9-tangos', 'por-tangos', 'Con {Dm} al final'),
      sbSong('uk9-rumba', 'rumba-flamenca', 'Alegre y rápida'),
    ] },
  ];
}
