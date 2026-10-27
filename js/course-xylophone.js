// Curso de xilófono para niños: casi todo cabe en el xilófono de juguete de 8 láminas (Do a Do, escritas Do5–Do6),
// de tres en tres notas y con una canción divertida en cada unidad. La última unidad es para xilófonos grandes.
// Notas ESCRITAS (suena una octava más agudo); la app acepta la nota en cualquier octava.

export function xylophoneUnits({ theory, notes, exercise, slots }) {
  const X = 'xyl-';
  const song = (id, title, sub, meta) => exercise(X + id, title, sub, { key: 'C', time: 4, bpm: 84, ...meta });
  return [
    { id: X + 'u1', title: 'Do, Re y Mi', sub: 'Tus tres primeras láminas', color: 'var(--u1)', lessons: [
      theory(X + 'u1-intro', '¡Hola, xilofonista!', [
        { title: 'Las baquetas', text: 'Coge cada baqueta como si dieras la mano: el pulgar a un lado, el índice al otro y los demás dedos rodeándola sin apretar.' },
        { title: 'Golpea y rebota', text: 'Da en el centro de la lámina y deja que la baqueta salte hacia arriba sola, como una pelota. Si la dejas apoyada, la nota se apaga.' },
        { title: 'Tu primera lámina: Do', text: 'Las láminas largas suenan graves y las cortas, agudas. La 1, la más larga de la izquierda, es el Do.', board: [72] },
        { title: 'Cómo te escucha la app', text: 'Pon el móvil cerca del xilófono. Da igual que tu xilófono suene más agudo o más grave: si aciertas la lámina, se pone en verde.' },
      ]),
      notes(X + 'u1-cdm', 'Do, Re y Mi', 'Las láminas 1, 2 y 3', 'C5 D5 E5 D5 C5 C5 E5 E5 D5 D5 C5 E5 D5 C5'),
      song('u1-bollitos', 'Bollitos calientes', 'Tu primera canción', { bpm: 76, score: '| E5q D5q C5h | E5q D5q C5h | C5e C5e C5e C5e D5e D5e D5e D5e | E5q D5q C5h |' }),
      song('u1-robot', 'El baile del robot', 'Do, Re y Mi con silencios', { bpm: 88, score: '| C5q C5q E5q E5q | D5q D5q C5h | C5e D5e E5e D5e C5q Rq | E5q E5q C5h |' }),
    ] },
    { id: X + 'u2', title: 'Fa y Sol', sub: 'Cinco láminas', color: 'var(--u2)', lessons: [
      theory(X + 'u2-intro', 'Dos láminas más', [
        { title: 'Fa y Sol', text: 'Fa es la lámina 4 y Sol la 5. Con Do, Re, Mi, Fa y Sol ya puedes tocar muchísimas canciones.', board: [77, 79] },
        { title: 'Una mano y otra', text: 'Alterna las baquetas: derecha, izquierda, derecha… Así nunca se cansa una mano y las notas salen iguales.' },
      ]),
      notes(X + 'u2-fg', 'Sube y baja', 'De Do a Sol', 'C5 D5 E5 F5 G5 F5 E5 D5 C5 E5 G5 E5 C5'),
      song('u2-maria', 'María tenía un corderito', 'Canción popular', { bpm: 92, score: '| E5q D5q C5q D5q | E5q E5q E5h | D5q D5q D5h | E5q G5q G5h | E5q D5q C5q D5q | E5q E5q E5q E5q | D5q D5q E5q D5q | C5w |' }),
      song('u2-himno', 'Himno de la alegría', 'Beethoven', { score: '| E5q E5q F5q G5q | G5q F5q E5q D5q | C5q C5q D5q E5q | E5q. D5e D5h | E5q E5q F5q G5q | G5q F5q E5q D5q | C5q C5q D5q E5q | D5q. C5e C5h |' }),
    ] },
    { id: X + 'u3', title: 'La, Si y Do agudo', sub: 'Todas las láminas', color: 'var(--u3)', lessons: [
      theory(X + 'u3-intro', 'El xilófono entero', [
        { title: 'La, Si y Do', text: 'La es la lámina 6, Si la 7 y la última, la más corta, otra vez Do, pero agudo. ¡Ya tienes la escala de Do!', board: [81, 83, 84] },
        { title: 'Mira antes de golpear', text: 'Antes de cada nota, mira la lámina a la que vas. Las baquetas siguen a los ojos.' },
      ]),
      notes(X + 'u3-scale', 'La escala de Do', 'De la lámina 1 a la 8', 'C5 D5 E5 F5 G5 A5 B5 C6 B5 A5 G5 F5 E5 D5 C5'),
      song('u3-patitos', 'Mis patitos', 'Canción infantil alemana', { bpm: 80, score: '| C5e D5e E5e F5e G5q G5q | A5e A5e A5e A5e G5h | A5e A5e A5e A5e G5h | F5e F5e F5e F5e E5q E5q | D5e D5e D5e D5e C5h |' }),
      song('u3-estrellita', 'Estrellita', 'Canción popular francesa', { bpm: 88, score: '| C5q C5q G5q G5q | A5q A5q G5h | F5q F5q E5q E5q | D5q D5q C5h | G5q G5q F5q F5q | E5q E5q D5h | G5q G5q F5q F5q | E5q E5q D5h | C5q C5q G5q G5q | A5q A5q G5h | F5q F5q E5q E5q | D5q D5q C5h |' }),
    ] },
    { id: X + 'u4', title: 'Corcheas', sub: 'Dos notas por pulso', color: 'var(--u4)', lessons: [
      theory(X + 'u4-intro', 'Más rápido', [
        { title: 'Las corcheas', text: 'Dos corcheas duran lo mismo que una negra. Cuenta «un-y, dos-y» y toca una nota en cada sílaba.' },
        { title: 'Notas repetidas', text: 'Para repetir una nota rápido, alterna las manos sobre la misma lámina: derecha-izquierda-derecha.' },
      ]),
      notes(X + 'u4-rep', 'Notas repetidas', 'Alterna las manos', 'E5 E5 E5 E5 G5 G5 G5 G5 F5 F5 F5 F5 D5 D5 C5 C5'),
      song('u4-jingle', 'Jingle Bells', 'Para Navidad', { bpm: 104, score: '| E5q E5q E5h | E5q E5q E5h | E5q G5q C5q. D5e | E5w | F5q F5q F5q. F5e | F5q E5q E5q E5e E5e | E5q D5q D5q E5q | D5h G5h | E5q E5q E5h | E5q E5q E5h | E5q G5q C5q. D5e | E5w | F5q F5q F5q F5q | F5q E5q E5q E5e E5e | G5q G5q F5q D5q | C5w |' }),
      song('u4-granja', 'En la granja de mi tío', '¡Ia, ia, oh!', { bpm: 100, score: '| F5q F5q F5q C5q | D5q D5q C5h | A5q A5q G5q G5q | F5h. C5q | F5q F5q F5q C5q | D5q D5q C5h | A5q A5q G5q G5q | F5h. C5e C5e | F5q F5q F5q C5e C5e | F5q F5q F5h | F5e F5e F5q F5e F5e F5q | F5e F5e F5e F5e F5q F5q | F5q F5q F5q C5q | D5q D5q C5h | A5q A5q G5q G5q | F5w |' }),
    ] },
    { id: X + 'u5', title: 'Saltos', sub: 'De lámina en lámina', color: 'var(--u5)', lessons: [
      theory(X + 'u5-intro', 'Saltar sin miedo', [
        { title: 'El arpegio', text: 'Do, Mi, Sol y Do agudo: una lámina sí y otra no. Es el salto más famoso de la música.', board: [72, 76, 79, 84] },
        { title: 'Notas en otra octava', text: 'Si la partitura pide una nota más grave que tu lámina 1, toca la del mismo nombre que tengas: la app también te la da por buena.' },
      ]),
      notes(X + 'u5-arp', 'Arpegio de Do', 'Saltos de una lámina', 'C5 E5 G5 C6 G5 E5 C5 E5 G5 E5 C6 G5 E5 C5'),
      song('u5-santos', 'Cuando los santos', 'When the Saints, de Nueva Orleans', { bpm: 112, score: '| Rq C5q E5q F5q | G5w | Rq C5q E5q F5q | G5w | Rq C5q E5q F5q | G5h E5h | C5h E5h | D5w | Rq E5q E5q D5q | C5h. C5q | E5h G5q G5q | F5w | Rq E5q F5q G5q | E5h C5h | D5h D5h | C5w |' }),
      song('u5-londres', 'El puente de Londres', 'Canción inglesa', { bpm: 96, score: '| G5q. A5e G5q F5q | E5q F5q G5h | D5q E5q F5h | E5q F5q G5h | G5q. A5e G5q F5q | E5q F5q G5h | D5h G5h | E5q C5h. |' }),
      song('u5-martinillo', 'Martinillo', 'Tócalo en canon con alguien', { bpm: 96, score: '| C5q D5q E5q C5q | C5q D5q E5q C5q | E5q F5q G5h | E5q F5q G5h | G5e A5e G5e F5e E5q C5q | G5e A5e G5e F5e E5q C5q | C5q G4q C5h | C5q G4q C5h |' }),
    ] },
    { id: X + 'u6', title: 'Xilófono grande', sub: 'Graves y láminas de atrás', color: 'var(--u6)', lessons: [
      theory(X + 'u6-intro', 'Si tu xilófono tiene más láminas', [
        { title: 'Las láminas de atrás', text: 'Los xilófonos grandes tienen una segunda fila, como las teclas negras del piano: son los sostenidos y bemoles.', board: [73, 75, 78] },
        { title: 'Las graves', text: 'A la izquierda de tu Do hay láminas más largas: Si, La, Sol… Si tu xilófono no las tiene, toca la misma nota en otra lámina: también vale.' },
      ]),
      song('u6-cumple', 'Cumpleaños feliz', 'Para todas las fiestas', { time: 3, bpm: 100, score: '| Rh G4e G4e | A4q G4q C5q | B4h G4e G4e | A4q G4q D5q | C5h G4e G4e | G5q E5q C5q | B4q A4q F5e F5e | E5q C5q D5q | C5h Rq |' }),
      song('u6-tetris', 'La canción del Tetris', 'Korobéiniki, canción popular rusa', { bpm: 120, score: '| E5q B4e C5e D5q C5e B4e | A4q A4e C5e E5q D5e C5e | B4q. C5e D5q E5q | C5q A4q A4h | D5q. F5e A5q G5e F5e | E5q. C5e E5q D5e C5e | B4q B4e C5e D5q E5q | C5q A4q A4h |' }),
      song('u6-elisa', 'Para Elisa', 'Beethoven', { time: 3, bpm: 72, score: '| E5e D#5e E5e D#5e E5e B4e | D5e C5e A4h | C4e E4e A4e B4q. | E4e G#4e B4e C5q. | E4e E5e D#5e E5e D#5e E5e | B4e D5e C5e A4q. | C4e E4e A4e B4q. | E4e C5e B4e A4q. |' }),
    ] },
    { id: X + 'u7', title: 'Concierto', sub: 'Tus canciones favoritas', color: 'var(--u7)', lessons: [
      theory(X + 'u7-intro', '¡Ya eres xilofonista!', [
        { title: 'Tu concierto', text: 'Elige tus tres canciones favoritas, tócalas seguidas y grábate. Enséñaselo a tu familia: ¡los aplausos también cuentan!' },
      ]),
      slots(3, 1),
    ] },
  ];
}
