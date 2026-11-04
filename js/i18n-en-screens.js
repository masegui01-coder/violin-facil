// Inglés de: Hojas y pantallas de Estudio, Canciones, cuenta, rutina, test de nivel y Perfil.
// Las frases fijas van en SCREENS_EXACT; las que llevan números, nombres o notas, en screensPatterns().

export const SCREENS_EXACT = {
  // ---------- Accesibilidad y Banda (cambios de maquetación) ----------
  'Saltar al contenido': 'Skip to content', 'Como te verán tus músicos': 'How your musicians will see you',
  // ---------- Acceso y cuenta ----------
  'Guardamos tu nombre, tu correo y tu progreso para que no lo pierdas al cambiar de móvil y para mejorar la beta. Puedes borrar tu cuenta cuando quieras desde Ajustes.':
    'We store your name, your email and your progress so you don’t lose it when you change phone, and to improve the beta. You can delete your account at any time from Settings.',
  'Política de privacidad': 'Privacy policy',
  'Escribe tu correo y te enviaré un enlace para cambiar la contraseña.': "Type your email and I'll send you a link to change your password.",
  'Has entrado como': 'Signed in as', '. Tu progreso se guarda en tu cuenta y lo recuperas en cualquier dispositivo.': '. Your progress is saved to your account and you can get it back on any device.',
  'Tester de la beta': 'Beta tester', 'Tester pro': 'Pro tester',
  'Tienes abiertas todas las lecciones y los tres libros de cada instrumento.': 'You have every lesson and all three books of every instrument unlocked.',
  'Confirma que eres tú': "Confirm it's you", 'Para borrar la cuenta escribe tu contraseña.': 'To delete your account, type your password.',
  'Testers': 'Testers', 'con cuenta': 'with an account', 'hoy': 'today', 'esta semana': 'this week', 'Días': 'Days', 'Min.': 'Min.', 'Lecc.': 'Lessons',
  'Tester': 'Tester', 'Pro': 'Pro',
  'Durante la beta todas las cuentas ven todo el contenido (menos este panel y las métricas). «Pro» queda guardado para cuando se cierre el contenido.':
    'During the beta every account sees all the content (except this panel and the metrics). “Pro” is kept for when the content is locked.',
  'Marca «Pro» para que ese tester vea todo (lecciones, libros, libro de lecturas…) menos este panel y las métricas. Se aplica la próxima vez que abra la app.':
    'Tick “Pro” so that tester sees everything (lessons, books, reading book…) except this panel and the metrics. It applies the next time they open the app.',
  // ---------- Recorrido de bienvenida ----------
  'Aquí ves con qué instrumento practicas. Púlsalo para cambiarlo cuando quieras: cada instrumento guarda su propio progreso.':
    'This shows the instrument you practise. Tap it to change it whenever you like: each instrument keeps its own progress.',
  'Lo primero que ves al abrir la app: la próxima lección (o la tarea de tu banda si vence pronto). Cada lección te da hasta 3 estrellas y desbloquea la siguiente.':
    'The first thing you see when you open the app: your next lesson (or your band task if it is due soon). Each lesson gives you up to 3 stars and unlocks the next one.',
  'Tu objetivo de minutos, tu racha de días seguidos y el reto del día: la misma partitura para todos los que tocan tu instrumento.':
    'Your minutes goal, your streak of days in a row and the daily challenge: the same score for everyone who plays your instrument.',
  'Deja el móvil a un metro, en un sitio silencioso. Toca la nota marcada: se pone verde cuando suena afinada. Si la oyes en rojo, el indicador te dice si vas alto o bajo.':
    'Put the phone about a metre away, somewhere quiet. Play the highlighted note: it turns green when it is in tune. If it turns red, the meter tells you whether you are sharp or flat.',
  'Toda la biblioteca por estilos. Cada canción se puede tocar nota a nota, a tempo o de memoria. También puedes importar tus propias partituras en MusicXML.':
    'The whole library, by style. You can play each song note by note, in time or from memory. You can also import your own MusicXML scores.',
  'Afinador, metrónomo y herramientas para subir de nivel: notas tenidas, mapa de afinación, gimnasio de técnica y más. Pulsa «¿Para qué sirve cada una?» cuando quieras.':
    'Tuner, metronome and tools to level up: long tones, tuning map, technique gym and more. Tap “What is each one for?” whenever you like.',
  'Únete a tu banda con el código que te dé tu director y ensaya las tareas que te ponga. Si eres director, crea tu banda aquí.':
    'Join your band with the code your conductor gives you and rehearse the tasks they set. If you are a conductor, create your band here.',
  'Tus estadísticas, insignias, estilos de música y ajustes: nombres de las notas (Do-Re-Mi o C-D-E), exigencia de afinación y texto grande.':
    'Your stats, badges, music styles and settings: note names (Do-Re-Mi or C-D-E), tuning strictness and large text.',
  'Tu progreso se guarda en tu cuenta, así no lo pierdes si cambias de móvil. Puedes repetir este recorrido desde Perfil. ¡A tocar!':
    "Your progress is saved to your account, so you won't lose it if you change phone. You can replay this tour from Profile. Let's play!",
  // ---------- Hoja de una canción o lección ----------
  'Inicial': 'Beginner', 'Avanzado': 'Advanced', 'Acorde a acorde': 'Chord by chord', 'A tempo, con el cifrado': 'In time, with the chord chart',
  'Un minuto de cambios': 'One minute of changes', 'Tocar el ritmo': 'Play the rhythm',
  'La partitura espera a que cada nota suene bien.': 'The score waits until each note sounds right.',
  'Cuenta de un compás y la partitura avanza sola.': 'One bar of count-in, then the score moves on its own.',
  'Sin partitura: tocas y al final comparo lo que has tocado con la canción.': 'No score: you play and at the end I compare what you played with the song.',
  'Donde más fallas:': 'Where you slip most:', 'Practicar esos compases en bucle': 'Loop those bars',
  'Clasificación': 'Leaderboard', 'Compartir partitura': 'Share score', 'Retar a un amigo': 'Challenge a friend',
  'Borrar esta partitura': 'Delete this score', 'Pulsa otra vez para borrarla': 'Tap again to delete it',
  '¿Qué canción has tocado?': 'Which song did you play?', 'te costó ·': 'tricky ·',
  // ---------- Mis partituras e importar ----------
  'Todavía no has importado ninguna partitura.': "You haven't imported any scores yet.",
  'Cómo conseguir tu partitura en MusicXML': 'How to get your score as MusicXML',
  'MusicXML es el formato estándar para intercambiar partituras. Casi todos los programas de música lo exportan.': 'MusicXML is the standard format for exchanging scores. Almost every music program exports it.',
  'Si ya la tienes en un programa de partituras': 'If you already have it in a notation program',
  '(gratis, para ordenador): abre la partitura, ve a Archivo → Exportar y elige MusicXML; vale tanto .mxl como .musicxml.': '(free, for desktop): open the score, go to File → Export and choose MusicXML; both .mxl and .musicxml work.',
  ': busca Exportar → MusicXML.': ': look for Export → MusicXML.',
  'Si la tienes en papel o en PDF': 'If you have it on paper or as a PDF',
  'Escanéala con una app de lectura de partituras que exporte a MusicXML. Por ejemplo, PlayScore 2 o Sheet Music Scanner; algunas solo exportan en su versión de pago.':
    'Scan it with a score-reading app that exports to MusicXML, such as PlayScore 2 or Sheet Music Scanner; some only export in their paid version.',
  'También puedes abrir el PDF en MuseScore con su función de importar PDF, revisarla y exportarla como en el paso anterior.':
    'You can also open the PDF in MuseScore with its PDF import, check it and export it as in the previous step.',
  'Revisa siempre el resultado: los escáneres a veces confunden alguna nota o figura.': 'Always check the result: scanners sometimes get a note or a note value wrong.',
  'Si la tienes en MIDI': 'If you have it as MIDI',
  'Ábrela en MuseScore (Archivo → Abrir), revisa que las figuras estén bien y expórtala como MusicXML.': 'Open it in MuseScore (File → Open), check the note values and export it as MusicXML.',
  'Partituras gratis y legales': 'Free, legal scores',
  '(imslp.org): miles de partituras de dominio público en PDF; pásalas a MusicXML como se explica arriba.': '(imslp.org): thousands of public-domain scores as PDF; convert them to MusicXML as explained above.',
  ': muchas obras tradicionales y clásicas que puedes descargar en MusicXML. Usa solo las de dominio público o las que su autor comparte libremente.':
    ': lots of traditional and classical pieces you can download as MusicXML. Only use public-domain ones or those their author shares freely.',
  'Las de tu banda o tu profesor: pídeles el MusicXML; casi todos los programas lo exportan.': "Your band's or your teacher's: ask them for the MusicXML; almost every program exports it.",
  'Si la partitura tiene varias partes (una obra para banda, por ejemplo), elige la tuya al importarla: las demás sonarán de fondo como banda virtual.':
    'If the score has several parts (a band piece, for example), pick yours when you import it: the others will play in the background as a virtual band.',
  'De los acordes y dobles cuerdas se toca la nota más aguda.': 'For chords and double stops, the top note is played.',
  'Pásate el archivo al móvil por WhatsApp, correo o Drive y elígelo con «Importar partitura».': 'Send the file to your phone by WhatsApp, email or Drive and pick it with “Import score”.',
  'Lo que importas se queda en tu móvil, para tu uso. Respeta los derechos de autor: no compartas partituras que no puedas compartir.':
    "What you import stays on your phone, for your own use. Respect copyright: don't share scores you aren't allowed to share.",
  'Descargar un ejemplo para probar': 'Download an example to try',
  'Nombre': 'Name', 'Tu parte (las demás sonarán en la banda virtual)': 'Your part (the others will play in the virtual band)', 'Guardar y ensayar': 'Save and rehearse',
  'Comprueba que sea un MusicXML (.musicxml, .xml o .mxl). Los PDF e imágenes hay que convertirlos antes.': 'Check that it is a MusicXML file (.musicxml, .xml or .mxl). PDFs and images need converting first.',
  // ---------- Estudio ----------
  'Para qué sirve cada herramienta': 'What each tool is for',
  'Afina antes de tocar. En viento es cromático y te dice la nota escrita y la real; en violín, cuerda a cuerda. Puedes elegir La 440, 441 o 442 Hz en Perfil.':
    'Tune before you play. For winds it is chromatic and shows both the written and the concert note; for violin, string by string. You can choose A 440, 441 or 442 Hz in Profile.',
  'Marca el pulso con sonido y luces. Elige el compás o pulsa «Marcar tempo» al ritmo que quieras.': 'Keeps the beat with sound and lights. Pick the time signature or tap “Tap tempo” at the speed you want.',
  'Sostén una nota y mira la gráfica: la línea es tu afinación y el relleno, tu volumen. Te dice si eres estable, si tienes vibrato y si te desafinas al hacer crescendo.':
    'Hold a note and watch the graph: the line is your pitch and the fill is your volume. It tells you whether you are steady, whether you have vibrato and whether you go out of tune in a crescendo.',
  'Toca lo que quieras y la app lo escribe en el pentagrama. Guárdalo o compáralo con una canción para comprobar si te la sabes de memoria.':
    'Play whatever you like and the app writes it on the staff. Save it or compare it with a song to check whether you know it from memory.',
  'Resume todo lo que tocas: qué notas te salen altas o bajas. Pulsa una nota para trabajarla con notas tenidas.': 'Sums up everything you play: which notes come out sharp or flat. Tap a note to work on it with long tones.',
  'Escalas, arpegios y terceras en las 12 tonalidades, siempre a tu mejor tempo. Si lo haces con 2 estrellas, sube 4 pulsos por minuto.':
    'Scales, arpeggios and thirds in all 12 keys, always at your best tempo. Get 2 stars and it goes up 4 beats per minute.',
  'La app suena un acorde y tú colocas la tercera, la quinta o la sexta en su sitio justo, como en la banda. Sin auriculares, alterna escuchar y tocar.':
    'The app plays a chord and you place the 3rd, the 5th or the 6th exactly in tune, as in a band. Without headphones, it alternates listening and playing.',
  'Una partitura nueva cada vez, en tres niveles, y una sola toma: sin escucharla antes ni repetir.': 'A new score every time, in three levels, and a single take: no listening first and no retries.',
  'Una obra al azar, una sola toma y sin ayudas en pantalla, como en una prueba real.': 'A random piece, a single take and no on-screen help, like a real audition.',
  'Percusión: calibrar el micrófono': 'Percussion: calibrate the microphone',
  'Mide el retraso de tu móvil con unos golpes de prueba, para que la app sepa al milisegundo si te adelantas o te retrasas. Hazlo una vez por móvil.':
    "Measures your phone's delay with a few test strokes, so the app knows to the millisecond whether you are early or late. Do it once per phone.",
  'Percusión: gimnasio de rudimentos': 'Percussion: rudiment gym',
  'Pulso estable, golpes simples y dobles, paradiddle, semicorcheas y acentos, con el tempo que sube cuando lo haces bien.':
    'Steady pulse, single and double strokes, paradiddles, sixteenths and accents, with a tempo that goes up when you play well.',
  'Otra partitura': 'Another score', 'Otra audición': 'Another audition',
  'Una partitura nueva cada vez y una sola toma: sin escucharla antes ni repetir. Elige el nivel.': 'A new score every time and a single take: no listening first and no retries. Choose the level.',
  'Blancas y negras, por grados, en la tonalidad de la banda': 'Half and quarter notes, stepwise, in the band key',
  'Corcheas, puntillos, saltos y tonalidades vecinas': 'Eighth notes, dots, leaps and nearby keys',
  'Semicorcheas, silencios, menores y saltos amplios': 'Sixteenth notes, rests, minor keys and wide leaps',
  // ---------- Afinar en acorde ----------
  'Tónica': 'Root', '3.ª mayor': 'Major 3rd', '3.ª menor': 'Minor 3rd', '5.ª': '5th', '6.ª mayor': 'Major 6th', 'Octava': 'Octave',
  // las raíces del acorde («Fa» también es una opción de un test de teoría, apuntada con L() como «F note»)
  'Do': 'C', 'Re': 'D', 'Mi': 'E', 'Fa': 'F', 'Sol': 'G', 'La': 'A', 'Si': 'B',
  'Objetivo: igual que el afinador': 'Target: same as the tuner', 'Escucha el acorde…': 'Listen to the chord…', 'Ahora tú': 'Your turn',
  'En su sitio': 'Spot on', 'Toca la nota y busca que el punto se ponga verde': 'Play the note and get the dot to turn green',
  // ---------- Toca libre, gimnasio, notas tenidas ----------
  'Toca lo que quieras: la app lo escribe en el pentagrama. Guárdalo o compáralo con una canción para comprobar si te la sabes de memoria.':
    'Play whatever you like: the app writes it on the staff. Save it or compare it with a song to check whether you know it from memory.',
  'Guardadas': 'Saved', 'Comparar': 'Compare', 'Tu récord': 'Your best', 'Sin intentar': 'Not tried yet',
  'afinación media': 'average tuning', 'sin vibrato': 'no vibrato', 'Sostén la nota…': 'Hold the note…',
  // ---------- Acordes (guitarra, ukelele y piano) ----------
  'Un minuto': 'One minute', 'Casi: alguna cuerda suena de más o rozada.': 'Almost: a string is ringing that shouldn’t, or is muted.',
  'Casi: alguna tecla de más suena a la vez.': 'Almost: an extra key is sounding at the same time.',
  '¡Todos los acordes limpios!': 'All chords clean!', 'Un compás de cuenta y empezamos': 'One bar of count-in and we start',
  'Pulsa Empezar cuando tengas la mano colocada': 'Press Start when your hand is in position',
  'Rasguea todas las cuerdas del acorde y deja que suenen. Si una nota no sale, apoya mejor la yema justo detrás del traste.':
    "Strum all the strings of the chord and let them ring. If a note doesn't sound, press with your fingertip just behind the fret.",
  'Rasguea las cuatro cuerdas con el índice, suave y cerca del final del mástil. Si una nota zumba, apoya la yema justo detrás del traste.':
    'Strum the four strings with your index finger, gently and near the end of the neck. If a note buzzes, press with your fingertip just behind the fret.',
  'Baja las teclas del acorde a la vez y mantenlas. Puedes tocarlo en cualquier octava: lo que cuenta son las notas.':
    'Press the keys of the chord together and hold them. You can play it in any octave: what counts are the notes.',
  // ---------- Percusión ----------
  'Pulso estable': 'Steady pulse', 'Golpes simples': 'Single strokes', 'Golpes dobles': 'Double strokes', 'Paradiddle': 'Paradiddle', 'Acentos': 'Accents',
  'Negras con las dos manos': 'Quarter notes with both hands', 'Cuatro por pulso, sin acelerar': 'Four per beat, without rushing', 'Uno de cada cuatro': 'One in every four',
  'Gimnasio de rudimentos': 'Rudiment gym', 'Calibrando…': 'Calibrating…', 'Escuchando…': 'Listening…', '¡Calibrado!': 'Calibrated!',
  'No he oído bien los golpes. Sube el volumen del móvil, quita los auriculares y vuelve a intentarlo.': "I couldn't hear the strokes well. Turn the phone volume up, take your headphones off and try again.",
  'El retraso de tu móvil es de': "Your phone's delay is", '. Lo tendré en cuenta para medir tus golpes.': ". I'll take it into account when timing your strokes.",
  'Si cambias de móvil o usas auriculares Bluetooth, vuelve a calibrar.': 'If you change phone or use Bluetooth headphones, calibrate again.',
  'Te oigo: espera a que acabe la cuenta': 'I can hear you: wait for the count-in to finish', 'Golpe de más': 'Extra stroke',
  'Sigue la línea y golpea en cada nota': 'Follow the line and strike on every note', 'Escucha el ritmo…': 'Listen to the rhythm…',
  'Guitarra de fondo (mejor con auriculares)': 'Backing guitar (best with headphones)',
  'Consejo: calibra el micrófono en Estudio para medir mejor': 'Tip: calibrate the microphone in Practice for better timing',
  // ---------- Lección y resultado ----------
  'Activa el micrófono para empezar': 'Turn on the microphone to start', 'Una toma': 'One take',
  'Marcada como completada: ya puedes seguir con la siguiente.': 'Marked as done: you can move on to the next one.',
  '¡Correcto!': 'Correct!', 'No exactamente.': 'Not quite.',
  // ---------- Libro (y las variaciones de sus ejercicios: «Ejercicio 3: Ritmo nuevo») ----------
  'Ritmo nuevo': 'New rhythm', 'Saltos': 'Leaps', 'Notas largas': 'Long notes', 'Con corcheas': 'With eighth notes', 'Eco': 'Echo',
  'Récord de cambios en un minuto y tus últimos intentos': 'Best changes in a minute and your latest attempts',
  'Índice': 'Contents', 'Capítulo dominado': 'Chapter mastered', 'Capítulo completado': 'Chapter completed',
  // ---------- Test de nivel ----------
  '. Las unidades anteriores quedan abiertas por si quieres repasar algo.': '. The earlier units stay open in case you want to review something.',
  'Las primeras unidades te darán una buena base. Irás rápido: cuando una lección te salga, pasa a la siguiente.': 'The first units will give you a solid base. You will go fast: when a lesson goes well, move on to the next.',
  // ---------- Cambiar de instrumento ----------
  'El curso, las digitaciones y el afinador se adaptan. Tu progreso se guarda por separado para cada instrumento.': 'The course, fingerings and tuner adapt. Your progress is saved separately for each instrument.',
  // ---------- Rutina ----------
  'Repaso de teoría: una pregunta': 'Theory review: one question', 'Repaso de teoría': 'Theory review', 'Siguiente lección del curso': 'Next lesson in the course',
  'Abrir mi cofre': 'Open my chest', '¡Rutina completada!': 'Routine complete!', 'Tu premio:': 'Your prize:', '¡Genial!': 'Great!',
};

const plural = (n, word, many = `${word}s`) => `${n} ${n === '1' ? word : many}`;
const MONTH_EN = { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sept: 'Sept', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec' };
// Fechas pintadas en español antes de cambiar de idioma: «3 nov» → «3 Nov»
const dateEn = d => d.replace(/\b(ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)\b\.?/g, m => MONTH_EN[m.replace('.', '')]);
const KIND_EN = { Escala: 'scale', Arpegio: 'arpeggio', Terceras: 'thirds' };

// tr: traductor de frases (para lo que va dentro); noteEn y notesEn: nombres de nota en letras
export function screensPatterns({ tr, noteEn, notesEn }) {
  return [
    // Hoja de una canción o lección
    [/^(\d+) tarjetas?$/, (m, n) => plural(n, 'card')],
    [/^(\d+) notas$/, (m, n) => plural(n, 'note')],
    [/^(\d+) compases$/, (m, n) => plural(n, 'bar')],
    [/^compases (\d+)–(\d+)$/, (m, a, b) => `bars ${a}–${b}`],
    [/^Tu última toma · (.+)$/, (m, d) => `Your last take · ${dateEn(d)}`],
    // Mis partituras y cancionero
    [/^Te (falta|faltan): (.+)$/, (m, w, list) => `Missing: ${list}`],
    // Afinar en acorde
    [/^Objetivo: ([+−-]?\d+) cents respecto al afinador$/, (m, c) => `Target: ${c} cents from the tuner`],
    [/^(Alto|Bajo) (\d+) cents$/, (m, w, c) => `${c} cents ${w === 'Alto' ? 'sharp' : 'flat'}`],
    [/^¡Clavada! (\d+) (vez|veces)$/, (m, n) => `Nailed it! ${n === '1' ? 'Once' : `${n} times`}`],
    [/^Oigo (\S+): toca una cuerda al aire$/, (m, n) => `I hear ${noteEn(n)}: play an open string`],
    // Toca libre
    [/^(\d+) (nota tocada|notas tocadas)$/, (m, n) => `${plural(n, 'note')} played`],
    [/^(\d{1,2} \S+ \d{4},? \d{1,2}:\d{2}) · (\d+) notas$/, (m, when, n) => `${dateEn(when)} · ${plural(n, 'note')}`],
    [/^Toca «(.+)» sin mirar la partitura\. Cuando acabes, pulsa «Terminar y comparar»\.$/, (m, s) => `Play “${tr(s)}” without looking at the score. When you finish, tap “Finish and compare”.`],
    [/^(\d+) de (\d+) notas en su sitio \((\d+) %\)(?: · (\d+) de más)?$/, (m, a, b, p, x) => `${a} of ${b} notes in place (${p} %)${x ? ` · ${x} extra` : ''}`],
    // Notas tenidas
    [/^vibrato · (\d+) ¢$/, (m, w) => `vibrato · ${w} ¢`],
    // Acordes
    [/^(\d+) de (\d+) acordes( a tiempo)?$/, (m, a, b, inTime) => `${a} of ${b} chords${inTime ? ' in time' : ''}`],
    [/^Ahora (\S+)$/, (m, c) => `Now ${c}`],
    [/^¡Nuevo récord! (\d+) cambios \(antes (\d+)\)$/, (m, n, b) => `New record! ${n} changes (was ${b})`],
    [/^(\d+) cambios en un minuto( · récord: (\d+))?$/, (m, n, r, b) => `${n} changes in a minute${r ? ` · best: ${b}` : ''}`],
    [/^Pon (\S+) y rasguea$/, (m, c) => `Play ${c} and strum`],
    [/^Empieza con (\S+) y cambia todo lo rápido que puedas sin que suene sucio$/, (m, c) => `Start with ${c} and change as fast as you can while keeping it clean`],
    [/^Tu récord: (\d+) · meta: (\d+)$/, (m, b, g) => `Your best: ${b} · target: ${g}`],
    [/^Meta: (\d+) cambios$/, (m, g) => `Target: ${g} changes`],
    [/^Y vuelta a (\S+)$/, (m, c) => `And back to ${c}`],
    [/^♩ = (\d+) · cambia de acorde cuando llegue la línea$/, (m, b) => `♩ = ${b} · change chord when the line arrives`],
    // Reto del día
    [/^Hecho · (\d)★$/, (m, n) => `Done · ${n}★`],
    // Percusión: calibración y resultado del ritmo (el consejo del final se traduce aparte)
    [/^Sube el volumen y no hagas ruido: van a sonar (\d+) golpes y el micrófono medirá cuánto tardan en llegar\.$/, (m, n) => `Turn the volume up and keep quiet: ${n} strokes will sound and the microphone will measure how long they take to arrive.`],
    [/^(\d+) perfectos · (\d+) bien · (\d+) fuera de tiempo · (\d+) sin tocar((?: · [^.]+)*)\. ?(.*)$/, (m, p, g, o, x, extra, tip) => {
      const parts = extra.split(' · ').filter(Boolean).map(part => part
        .replace(/^Acentos claros$/, 'Clear accents').replace(/^Marca más los acentos$/, 'Bring out the accents more')
        .replace(/^Graves y agudos: (\d+) % bien( \(grave con la palma en el centro, agudo con los dedos en el borde\))?$/, (s, n, how) => `Bass and slap: ${n} % right${how ? ' (bass with the palm in the centre, slap with the fingers on the edge)' : ''}`));
      return `${p} perfect · ${g} good · ${o} off the beat · ${x} missed${parts.map(s => ` · ${s}`).join('')}.${tip ? ` ${tr(tip)}` : ''}`;
    }],
    // Resultado
    [/^Probar al (\d+) %$/, (m, n) => `Try at ${n} %`],
    [/^Tu primera toma, hace (\d+) días?$/, (m, n) => `Your first take, ${plural(n, 'day')} ago`],
    // Libro
    [/^Partitura, renglón (\d+)$/, (m, n) => `Score, line ${n}`],
    [/^Digitación de (\S+)$/, (m, n) => `Fingering for ${noteEn(n)}`],
    [/^Tócala con la app: Aprender → Libro → página (\d+)$/, (m, n) => `Play it with the app: Learn → Book → page ${n}`],
    [/^Capítulo (\d+): (.+)$/, (m, n, title) => `Chapter ${n}: ${tr(title)}`],
    [/^pág\. (\d+)$/, (m, n) => `p. ${n}`],
    [/^(.+) · (\d+) páginas$/, (m, sub, n) => `${tr(sub)} · ${n} pages`],
    [/^Este libro se abre al aprobar el examen del Libro (\d+)$/, (m, n) => `This book opens when you pass the Book ${n} exam`],
    [/^Está al final del Libro (\d+): preguntas de lenguaje musical y una lectura\. ¿Ya tocas a este nivel\? Puedes abrirlo directamente\.$/,
      (m, n) => `It is at the end of Book ${n}: music theory questions and a reading. Already playing at this level? You can open it straight away.`],
    // Test de nivel
    [/^«(.+)»\. Las unidades anteriores quedan abiertas por si quieres repasar algo\.$/, (m, u) => `“${tr(u)}”. The earlier units stay open in case you want to review something.`],
    [/^Tocarás (\d+) fragmentos, cada uno de una unidad más avanzada\. Cuando uno no te salga \(menos de (\d+) estrellas\) paramos y te colocamos en esa unidad\.$/,
      (m, n, s) => `You will play ${n} excerpts, each from a more advanced unit. When one doesn't go well (fewer than ${s} stars) we stop and place you in that unit.`],
    // Recorrido de bienvenida
    [/^Te enseño la app en un minuto\. Practicarás con (.+): la app te escucha por el micrófono y te dice si cada nota suena bien\.$/,
      (m, i) => `Let me show you the app in a minute. You'll practise the ${tr(i).toLowerCase()}: the app listens through the microphone and tells you whether each note sounds right.`],
    [/^(\d+) de (\d+)$/, (m, a, b) => `${a} of ${b}`],
    // Cuenta
    [/^Recordármelo luego \((?:queda 1 día|quedan (\d+) días)\)$/, (m, n) => `Remind me later (${n ? `${n} days` : '1 day'} left)`],
    // Rutina
    // Informe semanal: el récord de un ejercicio del gimnasio («Escala de Sol mayor: de 60 a 72 BPM»)
    [/^(.+): de (\d+) a (\d+) BPM$/, (m, x, a, b) => `${tr(x)}: from ${a} to ${b} BPM`],
    [/^Rudimento (\S+)$/, (m, id) => `Rudiment ${id}`],
    [/^(Escala|Arpegio|Terceras) de ([^:]+) a (\d+) BPM$/, (m, kind, key, bpm) => {
      const whole = tr(`${kind} de ${key}`);
      return `${whole === `${kind} de ${key}` ? `${tr(key)} ${KIND_EN[kind]}` : whole} at ${bpm} BPM`;
    }],
    [/^Notas tenidas: (.+)$/, (m, n) => `Long tones: ${notesEn(n)}`],
    [/^Cambios de un minuto: (\S+) y (\S+)$/, (m, a, b) => `One-minute changes: ${a} and ${b}`],
    [/^Tarea de la banda: (.+)$/, (m, x) => `Band task: ${tr(x)}`],
    [/^Actívalo en Perfil → Tu estilo\. Hay (\d+) temas por descubrir\.$/, (m, n) => `Turn it on in Profile → Your style. There are ${n} themes to discover.`],
    // Perfil: el eje de constancia del radar
    [/^Constancia (\d+)$/, (m, n) => `Consistency ${n}`],
  ];
}
