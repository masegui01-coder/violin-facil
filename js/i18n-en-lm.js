// Inglés del curso de Lenguaje Musical: la vista «Lenguaje» de Aprender, la pantalla de ejercicio y su corrección.
// El contenido del nivel (fichas, preguntas, audiciones) va en i18n-en-lm-content-*.js, que se descarga con el resto
// del contenido (i18n-en-content.js); aquí, además, los textos de las audiciones corregidos tras el cotejo.
const ORD_EN = { primera: '1st', segunda: '2nd', tercera: '3rd', cuarta: '4th', quinta: '5th', primer: '1st', segundo: '2nd', tercer: '3rd', cuarto: '4th' };
const FIG_EN = {
  Redonda: 'Whole note', 'Blanca con puntillo': 'Dotted half note', Blanca: 'Half note', 'Negra con puntillo': 'Dotted quarter note', Negra: 'Quarter note',
  'Corchea con puntillo': 'Dotted eighth note', Corchea: 'Eighth note', Semicorchea: 'Sixteenth note',
  'Silencio de redonda': 'Whole rest', 'Silencio de blanca': 'Half rest', 'Silencio de negra': 'Quarter rest', 'Silencio de corchea': 'Eighth rest', Silencio: 'Rest',
};
const FIG_RE = Object.keys(FIG_EN).sort((a, b) => b.length - a.length).join('|');
const SECTION_EN = {
  Teoría: 'Theory', Ritmo: 'Rhythm', 'Agilidad de notas': 'Note agility', Entonación: 'Singing in tune', Dictado: 'Dictation',
  'Canción de la unidad': 'Unit song', 'Audición y cultura': 'Listening and culture', Creatividad: 'Creativity', Repaso: 'Review',
};

export const LM_EXACT = {
  ...FIG_EN, ...SECTION_EN,
  // ---------- Vista Lenguaje ----------
  Lenguaje: 'Music', 'Lenguaje musical': 'Music theory', 'Gratis para todos': 'Free for everyone',
  'Ritmo, lectura, entonación, dictado y audición: lo común a todos los instrumentos, unidad a unidad, y aplicado en el tuyo.':
    'Rhythm, reading, singing, dictation and listening: what every instrument shares, unit by unit, and applied to yours.',
  'Tus competencias': 'Your skills', 'Sin datos': 'No data yet', Lectura: 'Reading', Audición: 'Listening',
  Próximamente: 'Coming soon', ejercicios: 'exercises', estrellas: 'stars', 'Sin hacer': 'Not done',
  'Nivel 1': 'Level 1', 'Nivel 2': 'Level 2', 'Nivel 3': 'Level 3', 'Nivel 4': 'Level 4', Nivel: 'Level',
  'Pulso, negra, corchea, blanca y redonda · 2/4, 3/4 y 4/4 · clave de sol · do mayor y la menor': 'Pulse, quarter, eighth, half and whole notes · 2/4, 3/4 and 4/4 · treble clef · C major and A minor',
  'Clave de fa, semicorcheas, puntillo, 6/8 e intervalos': 'Bass clef, sixteenth notes, dots, 6/8 and intervals',
  'Menores, intervalos mayores y menores, ligaduras y tres alteraciones': 'Minor keys, major and minor intervals, ties and three accidentals',
  'Todas las tonalidades, tresillos, síncopas, grados y acordes': 'All keys, triplets, syncopation, degrees and chords',
  '← Todas las unidades': '← All units', 'Qué aprendes en esta unidad': 'What you learn in this unit', Novedades: 'New', Objetivos: 'Goals',
  'Ficha de la unidad en PDF': 'Unit sheet as PDF', 'En tu instrumento': 'On your instrument', 'Lección:': 'Lesson:', Ejercicios: 'Exercises',
  'Ficha y práctica interactiva': 'Theory card and interactive practice', 'Palmas al micrófono y el juego STOP': 'Clapping into the microphone and the STOP game',
  'Nombra las notas contra reloj': 'Name the notes against the clock', 'Canta: la app te escucha y corrige': 'Sing: the app listens and corrects you',
  'Escucha y escribe en el pentagrama': 'Listen and write on the staff', 'La canción de la unidad, cantada': 'The unit song, sung',
  'Una obra, su historia y preguntas': 'A piece, its story and questions', 'Compón y escúchalo': 'Compose and listen to it', 'Todas las competencias': 'All the skills',
  'Notas tenidas': 'Long tones', 'Afinar en acorde': 'Chord tuning', 'Gimnasio: la escala': 'Gym: the scale', 'Lectura a primera vista': 'Sight-reading',
  'Lectura rítmica': 'Rhythm reading', 'Dictado tocado': 'Played dictation', 'Toca libre de memoria': 'Free play from memory', 'Modo libro': 'Book mode', 'Método Pro': 'Pro Method',
  Fácil: 'Easy', Media: 'Medium',
  // ---------- Pantalla del ejercicio ----------
  'Volver a la unidad': 'Back to the unit', Resultado: 'Result', Calificación: 'Mark', '(en Fácil, como mucho 8)': '(on Easy, 8 at most)',
  'Siguiente ejercicio': 'Next exercise', Repetir: 'Repeat', 'Para repasar': 'To review', Bien: 'Right', Cerca: 'Close', 'Mal o falta': 'Wrong or missing',
  'No se ha podido hacer el ejercicio. Inténtalo otra vez.': "The exercise couldn't run. Please try again.", 'Este ejercicio todavía no está disponible.': "This exercise isn't available yet.",
  'Este ejercicio todavía no está disponible': "This exercise isn't available yet", 'No se ha podido crear el PDF': "Couldn't create the PDF",
  'No se ha podido abrir Lenguaje musical. Revisa la conexión.': "Couldn't open Music theory. Check your connection.",
  Continuar: 'Continue', Siguiente: 'Next', 'Ver el resultado': 'See the result', Comprobar: 'Check', 'Comprobar y guardar': 'Check and save',
  'A practicar': "Let's practise", 'A las preguntas': 'On to the questions', 'Resumen de la teoría': 'Theory summary', 'Escuchar el ejemplo': 'Listen to the example',
  '¡Correcto!': 'Correct!', 'Casi.': 'Almost.', 'No exactamente.': 'Not quite.', Respuestas: 'Answers', 'Elige…': 'Choose…', Hueco: 'Gap',
  'Nombres de nota': 'Note names', Hecho: 'Done', Figura: 'Note value', 'Pentagrama para escribir': 'Staff to write on', 'Nota más aguda': 'Higher note',
  'Nota más grave': 'Lower note', '↑ Más aguda': '↑ Higher', '↓ Más grave': '↓ Lower', Borrar: 'Delete', 'Nota sin seleccionar': 'Note deselected',
  'Toca entre dos figuras para poner o quitar una barra.': 'Tap between two notes to add or remove a bar line.', 'Figuras del ritmo': 'Rhythm notes',
  'Barra puesta': 'Bar line added', 'Barra quitada': 'Bar line removed', 'Escuchar': 'Listen', 'Lo que sonaba': 'What was played',
  'Escucha el ritmo y escríbelo con las figuras.': 'Listen to the rhythm and write it with note values.', 'Escucha la melodía y escríbela en el pentagrama.': 'Listen to the melody and write it on the staff.',
  // Canto
  'Necesito el micrófono': 'I need the microphone', 'para oír cómo cantas.': 'to hear you sing.', 'Activar micrófono': 'Turn on microphone', 'Micrófono sin permiso': 'Microphone not allowed',
  Preparado: 'Ready', 'Oír la primera nota': 'Hear the first note', 'Escucha la tonalidad': 'Listen to the key', 'Tu primera nota:': 'Your first note:',
  'Escucha y repite': 'Listen and repeat', 'Canta:': 'Sing:', '¡Hecho!': 'Done!', 'Apoyo:': 'Support:',
  // STOP y toques
  'La app palmea este ritmo, pero se equivocará en algún momento. ¡Pulsa STOP en cuanto lo notes!': 'The app claps this rhythm, but it will make a mistake at some point. Press STOP as soon as you notice!',
  'Empezar la ronda': 'Start the round', 'Claqueta…': 'Count-in…', 'Escucha…': 'Listen…', '¡Parada a tiempo!': 'Stopped in time!', 'No has parado la música': "You didn't stop the music",
  'Has parado antes del error': 'You stopped before the mistake', 'Has parado tarde': 'You stopped too late', 'Siguiente ronda': 'Next round', 'Cambió una figura': 'A note value changed',
  'Una negra se partió en dos corcheas': 'A quarter note was split into two eighth notes', 'Dos corcheas se juntaron en una negra': 'Two eighth notes merged into a quarter note',
  'Sonó un silencio donde había una negra': 'A rest sounded where there was a quarter note', 'Sonó una negra donde había un silencio': 'A quarter note sounded where there was a rest',
  'Una blanca duró solo un pulso': 'A half note lasted only one beat', 'Una redonda se cortó a la mitad': 'A whole note was cut in half', 'Se saltó el silencio': 'The rest was skipped',
  'Un compás tuvo un pulso de más': 'A bar had one beat too many',
  'Toca el botón con el ritmo de la partitura (o pulsa la barra espaciadora). Primero suena un compás de claqueta.': 'Tap the button with the rhythm of the score (or press the space bar). A bar of count-in comes first.',
  Empezar: 'Start', 'Toca aquí': 'Tap here', '¡Ahora!': 'Now!',
  // Agilidad
  'Las notas llegan a tempo y cada vez más deprisa: nómbralas a tiempo.': 'The notes arrive in time and faster and faster: name them in time.',
  'Nombra cada nota antes de que se acabe la barra de tiempo.': 'Name each note before the time bar runs out.', 'Tu récord:': 'Your record:', 'Aciertos:': 'Correct:',
  '¡Bien!': 'Well done!', Era: 'It was', 'Tiempo. Era': "Time's up. It was", '¡Nuevo récord!': 'New record!',
  // Audición, creatividad y repaso
  'Escuchar el fragmento': 'Listen to the excerpt', Parar: 'Stop', 'También:': 'Also:', 'La llamada de la app': "The app's call", 'Tu composición': 'Your composition',
  'Notas:': 'Notes:', 'Tu letra': 'Your lyrics', 'Escuchar la llamada': 'Listen to the call', 'Escuchar lo que has escrito': 'Listen to what you wrote',
  'Tu composición queda guardada. Si estás en una clase, envíasela a tu profesor: la escuchará y le pondrá nota.': 'Your composition is saved. If you are in a class, send it to your teacher: they will listen to it and mark it.',
  'Enviar a mi profesor': 'Send to my teacher', 'Enviada a tu profesor': 'Sent to your teacher', Composiciones: 'Compositions',
  'Sus composiciones del curso de Lenguaje Musical aparecerán aquí cuando te las envíe.': 'Their compositions from the Music theory course will appear here when they send them to you.',
  'reglas cumplidas': 'rules met', 'Esta composición no se puede reproducir': "This composition can't be played",
  'Tienes una composición guardada de otra vez: puedes escribir una nueva': 'You have a composition saved from last time: you can write a new one',
  'Número de compases': 'Number of bars', 'Compases completos': 'Complete bars', 'Figuras permitidas': 'Allowed note values', 'Notas permitidas': 'Allowed notes',
  Final: 'Ending', 'Sin saltos': 'No leaps', 'Figuras obligatorias': 'Required note values', 'Los semitonos': 'The semitones',
  'Toca el ritmo en la pantalla, a tempo.': 'Tap the rhythm on the screen, in time.', 'Canta: la app te escucha.': 'Sing: the app listens to you.',
  'Nombra las notas a tiempo.': 'Name the notes in time.', 'Escucha y escribe la melodía.': 'Listen and write down the melody.', 'Preguntas de teoría.': 'Theory questions.',
  '¿Qué canción es? Y una pregunta de la audición.': 'Which song is it? And a listening question.', 'Siguiente parte': 'Next part',
  // Discriminación auditiva (preguntas generadas)
  '¿De cuántos pulsos es el compás?': 'How many beats are in each bar?', 'De dos': 'In two', 'De tres': 'In three', 'De cuatro': 'In four',
  'El golpe grave llega cada dos pulsos.': 'The low beat comes every two beats.', 'El golpe grave llega cada tres pulsos.': 'The low beat comes every three beats.',
  'El golpe grave llega cada cuatro pulsos.': 'The low beat comes every four beats.', 'Escucha la escalera: ¿dónde está el peldaño corto?': 'Listen to the staircase: where is the short step?',
  'Entre la 1.ª y la 2.ª': 'Between the 1st and 2nd', 'Entre la 2.ª y la 3.ª': 'Between the 2nd and 3rd', 'Entre la 3.ª y la 4.ª': 'Between the 3rd and 4th', 'Entre la 4.ª y la 5.ª': 'Between the 4th and 5th',
  'El semitono es el paso más corto: mi-fa o si-do.': 'The semitone is the shortest step: E-F or B-C.', 'Escucha: ¿mayor o menor?': 'Listen: major or minor?',
  Mayor: 'Major', Menor: 'Minor', 'Menor: suena más oscuro (la-do-mi).': 'Minor: it sounds darker (A-C-E).', 'Mayor: luminoso (do-mi-sol).': 'Major: bright (C-E-G).',
  '¿Qué canción es? Escucha su ritmo': 'Which song is it? Listen to its rhythm',
  // Herramientas lanzadas desde una unidad
  'Repetir el dictado': 'Repeat the dictation', 'Notas tenidas con regulador': 'Long tones with a swell', 'Afinar en acorde: la tercera': 'Chord tuning: the third', 'Afinar en acorde: la tónica': 'Chord tuning: the root', Gimnasio: 'Gym', 'Responder tocando la pantalla (sin micrófono)': 'Answer by tapping the screen (no microphone)',
  ' · Los matices se miden con el micrófono': ' · Dynamics are measured with the microphone', 'Toca aquí': 'Tap here', 'regulador p < f > p': 'swell p < f > p', 'regulador: crece más en el centro': 'swell: grow more in the middle',
  'Haz un regulador: empieza piano, crece hasta forte en la mitad y vuelve a piano.': 'Make a swell: start piano, grow to forte in the middle and go back to piano.', 'Más dictados como este': 'More dictations like this', '¡Ejercicio completado!': 'Exercise completed!', 'Ejercicio guardado': 'Exercise saved',
  // Vara del trombón (keydiagram.js): «Vara» y las siete posiciones
  Vara: 'Slide', '1.ª': '1st', '2.ª': '2nd', '3.ª': '3rd', '4.ª': '4th', '6.ª': '6th', '7.ª': '7th',
  // PDF
  Ejercicio: 'Exercise',
  // Códigos de error (LM_MISTAKES): ficha del alumno en el Aula y «Para repasar» del resultado
  'tocó en un silencio de negra': 'clapped in a quarter rest', 'calló una negra': 'left out a quarter note', 'hizo negra en lugar de dos corcheas': 'played a quarter note instead of two eighths',
  'dividió una negra': 'split a quarter note', 'blanca acortada': 'half note cut short', 'redonda acortada': 'whole note cut short', 'no contó el compás de silencio': "didn't count the bar of rest",
  'acento fuera del primer tiempo': 'accent off the first beat', 'entrada de anacrusa en tiempo fuerte': 'upbeat entered on the downbeat', 'aceleró': 'sped up', 'se retrasó': 'dragged',
  'nota X leída/cantada como Y (p. ej. «E4>F4»)': 'note X read/sung as Y (e.g. “E4>F4”)', 'semitono cantado como tono (mi-fa, si-do)': 'semitone sung as a tone (E-F, B-C)',
  'tendencia a subir': 'tends to go sharp', 'tendencia a bajar': 'tends to go flat', 'matiz no respetado': 'dynamic not followed', 'calderón no respetado': 'fermata not held',
  'confundió mayor y menor': 'mixed up major and minor', 'confundió el compás': 'mixed up the time signature', 'paró antes del error': 'stopped before the mistake', 'paró tarde': 'stopped late',
  'no paró la música': "didn't stop the music", 'faltó una barra de compás': 'a bar line was missing', 'sobró una barra de compás': 'an extra bar line', 'faltó una nota': 'a note was missing',
  'sobró una nota': 'an extra note', 'nota equivocada': 'wrong note', 'número de compases': 'number of bars', 'compases incompletos': 'incomplete bars', 'figura no permitida': 'note value not allowed',
  'nota no permitida': 'note not allowed', 'final no pedido': 'wrong ending', 'salto no permitido': 'leap not allowed', 'faltan figuras obligatorias': 'required note values missing',
  'faltan los semitonos': 'the semitones are missing', 'no se oyó la nota': 'the note was not heard', 'se acabó el tiempo': 'time ran out',
};

// Textos de las audiciones corregidos tras el cotejo musicológico (no están en i18n-en-lm-content-*.js)
export const LM_COTEJO_EN = {
  'Acorde de sol mayor de toda la orquesta, con timbal.': 'A G major chord from the whole orchestra, with timpani.',
  'Anacrusa de una negra (en 1893 la letra era «Good mor-ning to you»; con «Hap-py birth-day» se partió en dos notas). Dominio público.': 'A one-quarter-note upbeat (in 1893 the words were “Good mor-ning to you”; with “Hap-py birth-day” it was split into two notes). Public domain.',
  'Aun así compuso más de 450 obras (más de 250 canciones), y organizaba conciertos en su casa de Berlín los domingos. En 1846, por fin, publicó música con su propio nombre.': 'Even so she composed more than 450 works (over 250 songs), and held Sunday concerts at her home in Berlin. In 1846 she finally published music under her own name.',
  'Bajo obstinado, entrada del violín 1 y, en el compás 5, el violín 2 con la misma melodía: el canon. Todo en negras. Dominio público.': 'Ground bass, the entry of violin 1 and, in bar 5, violin 2 with the same melody: the canon. All in quarter notes. Public domain.',
  'Canción para coro': 'Choral song',
  'Compases 1-8. Soprano y bajo del coro (Gartenlieder op. 3 n.º 5, Bote & Bock 1847). Empieza en la menor y termina en do mayor, su tono relativo. Dominio público.': 'Bars 1-8. Soprano and bass of the choir (Gartenlieder op. 3 no. 5, Bote & Bock 1847). It starts in A minor and ends in C major, its relative key. Public domain.',
  'Con los años, alguien le cambió la letra… y se convirtió en una de las canciones más cantadas del mundo: «Cumpleaños feliz».': 'Over the years someone changed the words… and it became one of the most sung songs in the world: “Happy Birthday”.',
  'Do M (original en Sol M)': 'C major (originally in G major)', 'Dos pulsos: UN-dos, UN-dos.': 'Two beats: ONE-two, ONE-two.',
  'Dos: una nota de arriba y otra de abajo.': 'Two: a top note and a bottom note.',
  'En 1893 publicaron «Good Morning to All» («Buenos días a todos»): se atribuye la melodía a Mildred y la letra a Patty.': 'In 1893 they published “Good Morning to All”: the tune is credited to Mildred and the words to Patty.',
  'En su época muchas compositoras firmaban con nombre de hombre.': "In her time many women composers signed with a man's name.",
  'Escucha esta canción de jardín: empieza en la menor y acaba en do mayor. Las mismas notas, otro color.': 'Listen to this garden song: it starts in A minor and ends in C major. The same notes, another colour.',
  'Euphemia Allan (o Allen)': 'Euphemia Allan (or Allen)',
  'Euphemia Allan (o Allen) tenía unos 16 años cuando compuso este vals, en 1877. Lo editó su hermano, Mozart Allan, en Glasgow.': 'Euphemia Allan (or Allen) was about 16 when she wrote this waltz, in 1877. Her brother, Mozart Allan, published it in Glasgow.',
  'Fanny era tan buena pianista y compositora como su hermano Felix, pero su padre le escribió en 1820 que para Felix la música sería una profesión y para ella «solo un adorno».': 'Fanny was as good a pianist and composer as her brother Felix, but in 1820 her father wrote to her that for Felix music would be a profession and for her “only an ornament”.',
  'Hoy es el himno de Europa (sin letra): lo adoptaron el Consejo de Europa en 1972 y la Unión Europea en 1985.': 'Today it is the anthem of Europe (without words): the Council of Europe adopted it in 1972 and the European Union in 1985.',
  'La frase completa de 8 compases en p, repetida en pp y rematada con el golpe ff. Todas las notas son corcheas picadas. Dominio público.': 'The whole 8-bar phrase in p, repeated in pp and finished off with the ff bang. All notes are staccato eighth notes. Public domain.',
  'La m (original)': 'A minor (original)',
  'La partitura pide tocarlo con las manos de canto, como si cortaras con un cuchillo: de ahí su nombre, «Chop Waltz» («vals del corte»). Hoy se conoce como «Chopsticks» («palillos chinos») y mucha gente lo toca con un dedo de cada mano.': 'The score asks you to play it with the sides of your hands, as if chopping with a knife: hence its name, “Chop Waltz”. Today it is known as “Chopsticks” and many people play it with one finger of each hand.',
  'La primera nota es anacrusa.': 'The first note is an upbeat.',
  'Lo publicó con un seudónimo de chico, «Arthur de Lulli» (un guiño al compositor Lully); en su época muchas compositoras firmaban con nombre de hombre para que las tomaran en serio.': "She published it under a boy's pen name, “Arthur de Lulli” (a nod to the composer Lully); in her time many women composers signed with a man's name to be taken seriously.",
  'Mozart conocía una canción popular francesa muy sencilla (la melodía se publicó en 1761) y, ya en Viena, escribió doce VARIACIONES sobre ella.': 'Mozart knew a very simple French folk song (the tune was published in 1761) and, once in Vienna, he wrote twelve VARIATIONS on it.',
  'Mozart tocaba el piano y el violín ante reyes y emperatrices cuando tenía seis años, y viajó por media Europa con su hermana Nannerl, que también era una pianista excelente.': 'Mozart played the piano and the violin for kings and empresses at the age of six, and travelled across Europe with his sister Nannerl, who was also an excellent pianist.',
  'Muchas compositoras lo hacían para que las tomaran en serio': 'Many women composers did it to be taken seriously',
  'Nota de abajo': 'Bottom note', 'Nota de arriba': 'Top note',
  'Por esa broma la sinfonía se conoce como «La sorpresa». Se dice que quería despertar a los que se dormían, pero Haydn contó que solo quería sorprender al público con algo nuevo. En alemán se llama «la del golpe de timbal».': 'Because of that joke the symphony is known as the “Surprise”. People say he wanted to wake up those who fell asleep, but Haydn said he only wanted to surprise the audience with something new. In German it is called the one “with the drumstroke”.',
  'Primeros 8 compases, una octava más grave que el original: las dos notas se abren (2.ª, 3.ª, 6.ª, octava). Empieza en el primer tiempo. Dominio público.': 'First 8 bars, an octave lower than the original: the two notes open out (2nd, 3rd, 6th, octave). It starts on the first beat. Public domain.',
  'Se atribuye a Mildred; a su hermana Patty, la letra.': 'It is credited to Mildred; the words to her sister Patty.',
  'Se cuenta que en el estreno, en 1824, Beethoven no oía los aplausos y una cantante le dio la vuelta para que viera al público aplaudir.': 'The story goes that at the premiere, in 1824, Beethoven could not hear the applause and a singer turned him round so he could see the audience clapping.',
  'Sinfonía n.º 94 en sol mayor, «La sorpresa» (1791, estrenada en Londres en 1792), 2.º movimiento — comienzo': 'Symphony No. 94 in G major, “Surprise” (1791, premiered in London in 1792), 2nd movement — opening',
  Soprano: 'Soprano',
  'Su Novena fue la primera sinfonía de un gran compositor con coro y solistas cantando en el último movimiento.': 'His Ninth was the first symphony by a great composer with a choir and soloists singing in the last movement.',
  'Tema (violonchelos y contrabajos, pizzicato)': 'Theme (cellos and double basses, pizzicato)',
  'Tema de la obra, en 2/4 como lo escribió Mozart (en la partitura, una octava más agudo). Dominio público.': 'The theme of the piece, in 2/4 as Mozart wrote it (an octave higher in the score). Public domain.',
  'Transportado a la menor. Simplificación: la semifrase de 4 compases se repite cuatro veces, cada vez más rápida y más fuerte (accelerando y crescendo). Dominio público.': 'Transposed to A minor. Simplified: the 4-bar half-phrase is repeated four times, faster and louder each time (accelerando and crescendo). Public domain.',
  'Violín 2': 'Violin 2',
  '«Gartenlieder», op. 3 (1846-1847) — n.º 5, «Abendlich schon rauscht der Wald»': '“Gartenlieder”, op. 3 (1846-1847) — no. 5, “Abendlich schon rauscht der Wald”',
};

const POS_RE = /^(primera|segunda|tercera|cuarta|quinta) línea$|^(primer|segundo|tercer|cuarto) espacio$/;
const posEn = text => {
  let m = POS_RE.exec(text);
  if (m) return m[1] ? `${ORD_EN[m[1]]} line` : `${ORD_EN[m[2]]} space`;
  m = /^línea adicional (\d) por (debajo|encima)$/.exec(text);
  if (m) return `ledger line ${m[1]} ${m[2] === 'debajo' ? 'below' : 'above'}`;
  m = /^(debajo|encima) de la línea adicional (\d)$/.exec(text);
  if (m) return `${m[1] === 'debajo' ? 'below' : 'above'} ledger line ${m[2]}`;
  return ({ 'debajo del pentagrama': 'below the staff', 'encima del pentagrama': 'above the staff' })[text];
};

export function lmPatterns({ tr, noteEn }) {
  const figEn = f => FIG_EN[f] || f;
  const noteOr = x => (noteEn ? noteEn(x) : x);
  return [
    [/^(Pregunta|Ficha|Ronda|Parte|Nota) (\d+) de (\d+)$/, (m, k, a, b) => `${({ Pregunta: 'Question', Ficha: 'Card', Ronda: 'Round', Parte: 'Part', Nota: 'Note' })[k]} ${a} of ${b}`],
    [/^Escuchas: (\d+)$/, (m, n) => `Listens left: ${n}`],
    [/^Escucha extra: −(\d+) puntos cada una$/, (m, n) => `Extra listen: −${n} points each`],
    [/^Incluye −(\d+) puntos por las escuchas extra$/, (m, n) => `Includes −${n} points for extra listens`],
    // lista de figuras (etiqueta de un pentagrama): «Negra Do4, Silencio de negra, Blanca Sol4»
    [new RegExp(`^(?:${FIG_RE})(?: [^,]+)?(?:, (?:${FIG_RE})(?: [^,]+)?)+$`), m => m.split(', ').map(tr).join(', ')],
    [new RegExp(`^(\\d+): (${FIG_RE})(?: (.+))?$`), (m, i, f, n) => `${i}: ${figEn(f)}${n ? ` ${noteOr(n)}` : ''}`],
    [new RegExp(`^(${FIG_RE})(?: (.+))? (añadida|borrada)$`), (m, f, n, w) => `${figEn(f)}${n ? ` ${noteOr(n)}` : ''} ${w === 'añadida' ? 'added' : 'deleted'}`],
    [new RegExp(`^(${FIG_RE}) (.+)$`), (m, f, n) => `${figEn(f)} ${noteOr(n)}`],
    [/^Seleccionada: (.+)\. Flechas para cambiarla, Suprimir para borrarla$/, (m, x) => `Selected: ${tr(x)}. Arrows to change it, Delete to remove it`],
    [/^Añadir ([^:.]+)(?:: ([^,]+), (.+))?\. Toca una línea o un espacio; flechas arriba y abajo para cambiar la nota$/, (m, f, n, pos) => {
      const fig = FIG_EN[f.charAt(0).toUpperCase() + f.slice(1)] || f;
      return `Add ${fig.toLowerCase()}${n ? `: ${noteOr(n)}, ${posEn(pos) || pos}` : ''}. Tap a line or a space; up and down arrows change the note`;
    }],
    [/^(.+), ((?:primera|segunda|tercera|cuarta|quinta) línea|(?:primer|segundo|tercer|cuarto) espacio|línea adicional \d por (?:debajo|encima)|(?:debajo|encima) de la línea adicional \d|(?:debajo|encima) del pentagrama)$/, (m, n, pos) => `${noteOr(n)}, ${posEn(pos)}`],
    [/^Nota (\d+): (.+)$/, (m, i, pos) => (posEn(pos) ? `Note ${i}: ${posEn(pos)}` : undefined)],
    [/^((?:primera|segunda|tercera|cuarta|quinta) línea|(?:primer|segundo|tercer|cuarto) espacio|línea adicional \d por (?:debajo|encima)|(?:debajo|encima) de la línea adicional \d|(?:debajo|encima) del pentagrama)$/, m => posEn(m)],
    [/^Barra entre la (\d+) y la (\d+)$/, (m, a, b) => `Bar line between ${a} and ${b}`],
    [/^Barra (\d+): (bien|falta|sobra)$/, (m, n, k) => `Bar line ${n}: ${({ bien: 'right', falta: 'missing', sobra: 'extra' })[k]}`],
    [/^(Subir|Bajar) (.+)$/, (m, d, x) => `Move ${tr(x)} ${d === 'Subir' ? 'up' : 'down'}`],
    [/^(.+): posición (\d+)$/, (m, x, n) => `${tr(x)}: position ${n}`],
    [/^Orden correcto: (.+)$/, (m, x) => `Correct order: ${x.split(', ').map(tr).join(', ')}`],
    [/^Respuesta: (.+)$/, (m, x) => `Answer: ${noteOr(x)}`],
    [/^(.+): (bien|casi|mal)$/, (m, x, k) => `${tr(x)}: ${({ bien: 'right', casi: 'close', mal: 'wrong' })[k]}`],
    [/^(.+): (afinada|alta|baja|no te he oído)$/, (m, n, k) => `${noteOr(n)}: ${({ afinada: 'in tune', alta: 'sharp', baja: 'flat', 'no te he oído': "I didn't hear you" })[k]}`],
    [/^compás (\d+)$/, (m, n) => `bar ${n}`],
    [/^(\d+) de (\d+) a tiempo$/, (m, a, b) => `${a} of ${b} in time`],
    [/^Resultado: (\d+) %$/, (m, n) => `Result: ${n} %`],
    [/^Probar la versión (Fácil|Media)$/, (m, v) => `Try the ${v === 'Fácil' ? 'Easy' : 'Medium'} version`],
    [/^Ejercicios hechos de la unidad( \d+)?$/, (m, n) => `Exercises done in the unit${n || ''}`],
    [/^(.+): (Fácil|Media)(?:, (\d+) %)?$/, (m, x, v, p) => `${tr(x)}: ${v === 'Fácil' ? 'Easy' : 'Medium'}${p ? `, ${p} %` : ''}`],
    [/^Era «(.+)»\.$/, (m, x) => `It was “${tr(x)}”.`],
    [/^(Escala|Arpegio) de (Do|Re|Mi|Fa|Sol|La|Si)([♯♭]?) (mayor|menor)$/, (m, k, n, a, q) => `${noteOr(n)}${a} ${q === 'mayor' ? 'major' : 'minor'} ${k === 'Escala' ? 'scale' : 'arpeggio'}`],
    [/^De memoria: (.+)$/, (m, x) => `From memory: ${tr(x)}`],
    [/^Libro: (.+)$/, (m, x) => `Book: ${tr(x)}`],
    [/^Lee o canta (.+) como (.+)$/, (m, a, b) => `Reads or sings ${a} as ${b}`],
    [/^No se ha podido enviar: (.+)$/, (m, x) => `Couldn't send it: ${tr(x)}`],
    [/^Lenguaje musical · Nivel (\d+) · Unidad (\d+)$/, (m, a, b) => `Music theory · Level ${a} · Unit ${b}`],
  ];
}
