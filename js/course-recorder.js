// Curso de flauta dulce para niños, como en los colegios: primero Si-La-Sol con la mano izquierda, luego Do y Re
// agudos, la mano derecha, Fa♯ y Do grave, el Fa y por fin las agudas con medio pulgar. Una canción en cada unidad.
// Notas ESCRITAS (la flauta soprano suena una octava más aguda).

export function recorderUnits({ theory, notes, exercise, slots }) {
  const R = 'rec-';
  const song = (id, title, sub, meta) => exercise(R + id, title, sub, { key: 'G', time: 4, bpm: 80, ...meta });
  return [
    { id: R + 'u1', title: 'Si, La y Sol', sub: 'Tus tres primeras notas', color: 'var(--u1)', lessons: [
      theory(R + 'u1-intro', '¡Hola, flautista!', [
        { title: 'Cómo se coge', text: 'La mano izquierda va arriba, cerca de la boquilla, y la derecha abajo. El pulgar izquierdo tapa el agujerito de detrás.' },
        { title: 'Sopla suave', text: 'Sopla despacito, como si dijeras «tuuu» para apagar una vela sin que se caiga la cera. Si la flauta pita, estás soplando demasiado fuerte.' },
        { title: 'Tu primera nota: Si', text: 'Tapa el agujero de detrás con el pulgar y el primer agujero con el dedo índice izquierdo. Usa la yema del dedo, que quede bien tapado.', board: [71] },
        { title: 'Cómo te escucha la app', text: 'Deja el móvil cerca, en un sitio sin ruido. Cuando suene la nota correcta se pondrá verde. ¡Así sabrás que lo haces bien!' },
      ]),
      notes(R + 'u1-si', 'La nota Si', 'Pulgar y dedo 1', 'B4 B4 B4 B4 B4 B4 B4 B4'),
      notes(R + 'u1-la', 'Si y La', 'Añade el dedo 2', 'B4 A4 B4 A4 A4 B4 A4 A4 B4 B4 A4 B4'),
      notes(R + 'u1-sol', 'Si, La y Sol', 'Tres dedos de la mano izquierda', 'B4 A4 G4 A4 B4 B4 A4 G4 G4 A4 B4 A4 G4 G4'),
      song('u1-bollitos', 'Bollitos calientes', 'Tu primera canción', { bpm: 72, score: '| B4q A4q G4h | B4q A4q G4h | G4e G4e G4e G4e A4e A4e A4e A4e | B4q A4q G4h |' }),
    ] },
    { id: R + 'u2', title: 'Do y Re agudos', sub: 'Más arriba', color: 'var(--u2)', lessons: [
      theory(R + 'u2-intro', 'Dos notas nuevas', [
        { title: 'Do agudo', text: 'Pulgar detrás y solo el dedo 2 (el corazón). ¡Ojo! El dedo 1 se levanta.', board: [72] },
        { title: 'Re agudo', text: 'Ahora suelta también el pulgar: solo el dedo 2 tapa su agujero. Sopla un poquito más suave todavía.', board: [74] },
      ]),
      notes(R + 'u2-cd', 'Do y Re', 'Arriba y abajo', 'B4 C5 D5 C5 B4 A4 G4 A4 B4 C5 D5 D5 C5 B4'),
      song('u2-maria', 'María tenía un corderito', 'Con Si, La, Sol y Re', { score: '| B4q A4q G4q A4q | B4q B4q B4h | A4q A4q A4h | B4q D5q D5h | B4q A4q G4q A4q | B4q B4q B4q B4q | A4q A4q B4q A4q | G4w |' }),
    ] },
    { id: R + 'u3', title: 'Beethoven', sub: 'El Himno de la alegría', color: 'var(--u3)', lessons: [
      theory(R + 'u3-intro', 'Una canción famosa', [
        { title: 'Beethoven', text: 'Escribió esta melodía hace unos 200 años y hoy es el himno de Europa. ¡Y ya la puedes tocar con las notas que sabes!' },
        { title: 'Notas largas y cortas', text: 'La negra dura un pulso; la blanca, dos. El puntito al lado de una nota la hace un poco más larga.' },
      ]),
      notes(R + 'u3-warm', 'Calentamiento', 'Sol, La, Si, Do y Re', 'G4 A4 B4 C5 D5 C5 B4 A4 G4 B4 D5 B4 G4'),
      song('u3-himno', 'Himno de la alegría', 'Beethoven', { bpm: 84, score: '| B4q B4q C5q D5q | D5q C5q B4q A4q | G4q G4q A4q B4q | B4q. A4e A4h | B4q B4q C5q D5q | D5q C5q B4q A4q | G4q G4q A4q B4q | A4q. G4e G4h |' }),
    ] },
    { id: R + 'u4', title: 'La mano derecha', sub: 'Mi y Re graves', color: 'var(--u4)', lessons: [
      theory(R + 'u4-intro', 'Bajamos', [
        { title: 'Mi grave', text: 'Tapa el pulgar y los tres agujeros de la mano izquierda, y con la derecha los agujeros 4 y 5 (índice y medio). Sopla muy suave: las notas graves piden poco aire.', board: [64] },
        { title: 'Re grave', text: 'Igual que Mi, pero tapando también el agujero 6. Si chilla, revisa que todos los dedos tapen bien.', board: [62] },
      ]),
      notes(R + 'u4-ed', 'Mi y Re', 'Mano derecha', 'G4 E4 G4 E4 D4 E4 G4 A4 G4 E4 D4 D4'),
      song('u4-escalera', 'La escalera', 'De Re a Re', { bpm: 72, score: '| D4q E4q G4q A4q | B4q C5q D5h | D5q C5q B4q A4q | G4q E4q D4h |' }),
    ] },
    { id: R + 'u5', title: 'Fa sostenido y Do grave', sub: 'La escala de Sol', color: 'var(--u5)', lessons: [
      theory(R + 'u5-intro', 'Las últimas notas graves', [
        { title: 'Fa sostenido', text: 'Mano izquierda entera y, en la derecha, los agujeros 5 y 6 (el 4 queda abierto).', board: [66] },
        { title: 'Do grave', text: 'Todos los agujeros tapados, también el 7. Es la nota más difícil: sopla muy despacito.', board: [60] },
      ]),
      notes(R + 'u5-scale', 'Escala de Sol', 'Subir y bajar', 'G4 A4 B4 C5 D5 C5 B4 A4 G4 F#4 E4 D4 E4 F#4 G4'),
      notes(R + 'u5-low', 'Do grave', 'Hasta abajo del todo', 'G4 E4 D4 C4 D4 E4 G4 E4 C4 C4'),
      song('u5-cumple', 'Cumpleaños feliz', 'Para tocar en todas las fiestas', { time: 3, bpm: 96, score: '| Rh D4e D4e | E4q D4q G4q | F#4h D4e D4e | E4q D4q A4q | G4h D4e D4e | D5q B4q G4q | F#4q E4q C5e C5e | B4q G4q A4q | G4h Rq |' }),
    ] },
    { id: R + 'u6', title: 'El Fa', sub: 'Canciones en Do', color: 'var(--u6)', lessons: [
      theory(R + 'u6-intro', 'Fa natural', [
        { title: 'Fa (flauta alemana)', text: 'Pulgar y agujeros 1, 2, 3 y 4. Casi todas las flautas del colegio son «alemanas». Si la tuya pone una «B» (barroca), el Fa es pulgar y 1-2-3-4-6-7: pregunta a tu profe.', board: [65] },
      ]),
      notes(R + 'u6-fa', 'Fa', 'Entre Mi y Sol', 'E4 F4 G4 F4 E4 F4 G4 A4 G4 F4 E4 D4 C4'),
      song('u6-oda', 'Himno de la alegría en Do', 'Ahora más grave', { key: 'C', bpm: 84, score: '| E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | E4q. D4e D4h | E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | D4q. C4e C4h |' }),
      song('u6-noche', 'Noche de paz', 'F. X. Gruber', { key: 'C', time: 3, bpm: 72, score: '| G4q. A4e G4q | E4h. | G4q. A4e G4q | E4h. | D5h D5q | B4h. | C5h C5q | G4h. | A4h A4q | C5q. B4e A4q | G4q. A4e G4q | E4h. |' }),
    ] },
    { id: R + 'u7', title: 'Notas agudas', sub: 'El medio pulgar', color: 'var(--u7)', lessons: [
      theory(R + 'u7-intro', 'El truco del pulgar', [
        { title: 'Medio pulgar', text: 'Para las notas agudas, el pulgar deja abierta una rendija: dobla un poco la punta del dedo para destapar solo la mitad del agujero.', board: [76] },
        { title: 'Mi agudo', text: 'Medio pulgar y los agujeros 1, 2, 3, 4 y 5. Sopla un poquito más rápido que en las graves, pero sin pitar.', board: [76] },
      ]),
      notes(R + 'u7-mi', 'Mi agudo', 'Con medio pulgar', 'D5 E5 D5 E5 C5 D5 E5 E5 D5 C5 B4'),
      song('u7-martinillo', 'Martinillo', 'Canción popular', { bpm: 88, score: '| G4q A4q B4q G4q | G4q A4q B4q G4q | B4q C5q D5h | B4q C5q D5h | D5e E5e D5e C5e B4q G4q | D5e E5e D5e C5e B4q G4q | G4q D4q G4h | G4q D4q G4h |' }),
      song('u7-estrellita', 'Estrellita', 'Canción popular francesa', { score: '| G4q G4q D5q D5q | E5q E5q D5h | C5q C5q B4q B4q | A4q A4q G4h | D5q D5q C5q C5q | B4q B4q A4h | D5q D5q C5q C5q | B4q B4q A4h | G4q G4q D5q D5q | E5q E5q D5h | C5q C5q B4q B4q | A4q A4q G4h |' }),
    ] },
    { id: R + 'u8', title: 'Concierto', sub: 'Tus canciones favoritas', color: 'var(--u8)', lessons: [
      theory(R + 'u8-intro', '¡Ya eres flautista!', [
        { title: 'Tu concierto', text: 'Con todas las notas que sabes puedes tocar muchísimas canciones. Grábate y enséñaselo a tu familia: en «Estudio» puedes escucharte.' },
      ]),
      song('u8-jingle', 'Jingle Bells', 'Para Navidad', { bpm: 100, score: '| B4q B4q B4h | B4q B4q B4h | B4q D5q G4q. A4e | B4w | C5q C5q C5q. C5e | C5q B4q B4q B4e B4e | B4q A4q A4q B4q | A4h D5h |' }),
      slots(2, 1),
    ] },
  ];
}
