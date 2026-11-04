// Inglés de: Cursos, teoría, digitaciones, libro de lecturas, importar MusicXML y avisos de módulos de js/.
// Las frases fijas van en COURSE_EXACT; las que llevan números, nombres o notas, en coursePatterns().

export const COURSE_EXACT = {
  // ---------- Aviso de cookies (analytics.js) y novedades (main.js) ----------
  'Cookies de estadísticas': 'Analytics cookies', '¿Nos ayudas a mejorar la beta?': 'Will you help us improve the beta?',
  'Con tu permiso usamos Google Analytics (cookies) para saber qué partes de la app se usan. Puedes cambiarlo en Perfil.': 'With your permission we use Google Analytics (cookies) to see which parts of the app are used. You can change this in Profile.',
  'No, gracias': 'No, thanks', 'Aceptar': 'Accept',
  'Novedad: elige tu instrumento': 'New: choose your instrument',
  'Band Flow ya no es solo para violín. Elige el instrumento que quieres aprender o practicar; podrás cambiarlo cuando quieras desde el botón de arriba.': 'Band Flow is no longer just for violin. Choose the instrument you want to learn or practise; you can change it whenever you like with the button at the top.',
  // ---------- Diagramas: mástil, pistones y acordes (boards.js, keydiagram.js) ----------
  'Mástil del ukelele': 'Ukulele fretboard', 'Mástil de la guitarra': 'Guitar fretboard', 'Sin diagrama': 'No diagram',
  'Al aire': 'Open', 'Pistones': 'Valves', 'Cilindros': 'Rotary valves', '+ bomba del 3.º': '+ 3rd valve slide',
  // ---------- Importar MusicXML (musicxml.js, unzip.js, xml.js) ----------
  'La armadura no está soportada: las alteraciones se mostrarán junto a cada nota.': 'The key signature is not supported: accidentals will be shown next to each note.',
  'Partitura importada': 'Imported score',
  'El archivo .mxl no es un ZIP válido': 'The .mxl file is not a valid ZIP', 'Directorio del ZIP dañado': 'The ZIP directory is damaged',
  'Compresión del .mxl no soportada': 'This .mxl compression is not supported', 'No encuentro la partitura dentro del .mxl': "I can't find the score inside the .mxl",
  'XML mal formado: hay etiquetas sin cerrar': 'Malformed XML: some tags are not closed', 'El archivo no contiene XML': 'The file contains no XML',
  'El pasaje no tiene compases': 'The passage has no bars',
  // ---------- Ritmo: consejo tras tocar (onsets.js) y pasajes (passages.js) ----------
  'No he oído ningún golpe: deja el móvil cerca (a un palmo de la mesa o del pad), con el micrófono destapado, y toca un poco más fuerte.': "I didn't hear any strokes: put the phone close (a hand's width from the table or pad), with the microphone uncovered, and play a little louder.",
  'Se me escapan muchos golpes: toca más fuerte o acerca el móvil, y calibra el micrófono en Estudio.': "I'm missing a lot of strokes: play louder or bring the phone closer, and calibrate the microphone in Practice.",
  'El pulso medio es bueno pero irregular: practica despacio con el metrónomo hasta que todos los golpes caigan igual.': 'Your average pulse is good but uneven: practise slowly with the metronome until every stroke lands evenly.',
  '¡Pulso muy firme! Sube un poco el tempo.': 'Very steady pulse! Raise the tempo a little.',
  '¡Pasaje dominado! Otra vez': 'Passage mastered! Again',
  // ---------- Fuentes de los consejos (tips.js) ----------
  'Hyacinthe Klosé, Método completo de clarinete (1843)': 'Hyacinthe Klosé, Complete Method for the Clarinet (1843)',
  'Paul Taffanel y Philippe Gaubert, Méthode complète de flûte (Leduc, 1923)': 'Paul Taffanel and Philippe Gaubert, Méthode complète de flûte (Leduc, 1923)',
  'Jean-Baptiste Arban, Método completo de trompeta (1864)': 'Jean-Baptiste Arban, Complete Conservatory Method for Trumpet (1864)',
  'Abel Carlevaro, Escuela de la guitarra (Barry, 1979)': 'Abel Carlevaro, School of Guitar (Barry, 1979)',
  'James Hill y J. Chalmers Doane, Ukulele in the Classroom (Doane, 2008)': 'James Hill and J. Chalmers Doane, Ukulele in the Classroom (Doane, 2008)',
  'Heinrich Neuhaus, El arte del piano (Real Musical, 1987)': 'Heinrich Neuhaus, The Art of Piano Playing (Barrie & Jenkins, 1973)',
  // ---------- Libro de lecturas (rhythm-reading.js y screens/rhythm-book.js) ----------
  'Iniciación: redondas, blancas y negras': 'Beginner: whole, half and quarter notes', 'Corcheas y silencios': 'Eighth notes and rests',
  'Puntillo, semicorcheas y ligaduras': 'Dots, sixteenth notes and ties', 'Síncopas, combinaciones y compás de 6/8': 'Syncopation, combinations and 6/8 time',
  'Tresillos, matices y agógica': 'Triplets, dynamics and tempo changes', 'Seisillos, cromatismos y cambios de compás': 'Sextuplets, chromaticism and changing meters',
  'Fusas, compases de amalgama y saltos amplios': 'Thirty-second notes, mixed meters and wide leaps',
  'Profesional: adornos, trinos y cambios de tonalidad y de carácter': 'Professional: grace notes, trills and changes of key and character',
  'Prueba de acceso a enseñanzas superiores': 'Conservatory (higher education) entrance exam',
  'Virtuoso: todo a la vez y cambios en cada compás': 'Virtuoso: everything at once, changing every bar',
  'Redondas': 'Whole notes', 'Blancas': 'Half notes', 'Negras': 'Quarter notes', 'Corcheas': 'Eighth notes', 'Semicorcheas': 'Sixteenth notes',
  'Fusas': 'Thirty-second notes', 'Puntillos': 'Dots', 'Tresillos': 'Triplets', 'Seisillos y quintillos': 'Sextuplets and quintuplets',
  'Síncopas': 'Syncopation', 'Ligaduras de prolongación': 'Ties', 'Matices y reguladores': 'Dynamics and hairpins',
  'Articulaciones y ligaduras': 'Articulation and slurs', 'Agógica (rit., accel., calderones)': 'Tempo changes (rit., accel., fermatas)',
  'Alteraciones accidentales': 'Accidentals', 'Técnicas extendidas (slap, frulato…)': 'Extended techniques (slap, flutter-tongue…)',
  'Sin cambios de clave': 'No clef changes', 'Sol y fa': 'Treble and bass', 'Sol, fa y do (3.ª y 4.ª)': 'Treble, bass, alto and tenor',
  'El 7-8 equivale a una lectura de grado profesional y el 9, a una prueba de acceso a enseñanzas superiores.': 'Levels 7-8 match professional-grade sight-reading and level 9 a conservatory entrance exam.',
  'Compás': 'Time signature', 'Variable (cambia)': 'Variable (changes)', 'Tonalidad': 'Key', 'Aleatoria': 'Random', 'Modo': 'Mode',
  'Mayor o menor': 'Major or minor', 'Menor': 'Minor', 'Cambios de clave': 'Clef changes', 'Elementos': 'Elements',
  'Lectura generada': 'Generated reading', 'Tu libro de lecturas': 'Your reading book', 'Libro de lecturas': 'Reading book',
  'Lecturas a primera vista en 10 niveles, hasta prueba de acceso a superior': 'Sight-reading in 10 levels, up to conservatory entrance',
  'Al tocar a tempo la app mide el ritmo y las notas a pulso constante (sin rit. ni cambios de tempo).': 'When you play in time the app checks rhythm and notes at a steady pulse (no rit. or tempo changes).',
  'Compases variables': 'Changing meters',
  'Redonda con puntillo': 'Dotted whole note', 'Blanca con doble puntillo': 'Double-dotted half note', 'Negra con doble puntillo': 'Double-dotted quarter note',
  'Corchea con doble puntillo': 'Double-dotted eighth note', 'Semicorchea con puntillo': 'Dotted sixteenth note', 'Fusa': 'Thirty-second note',
  'Esta herramienta está en pruebas solo para testers pro.': 'This tool is being tested by pro testers only.',
  'Entra con tu cuenta de tester para usarla.': 'Sign in with your tester account to use it.',
  'Has entrado con': 'You are signed in as',
  '. Pide al administrador que te marque como tester pro en su panel.': '. Ask the administrator to mark you as a pro tester in their panel.',
  'Lectura de Band Flow para practicar: https://masegui01-coder.github.io/violin-facil/': 'A Band Flow reading to practise: https://masegui01-coder.github.io/violin-facil/',
};

// Notas y tonalidades tal como las escribe keyLabel() de generate.js: «Fa♯ menor», «Si♭ mayor»
const NOTE = '(?:Do|Re|Mi|Fa|Sol|La|Si)[♯♭]?';
const HAND_EN = { D: 'R', I: 'L' };
const MS_TIP = { adelantarte: ['rush', 'listen to the beat and wait for it'], retrasarte: ['drag', 'anticipate the stick movement a little'] };

// tr: traductor de frases (para lo que va dentro); noteEn y notesEn: nombres de nota en letras
export function coursePatterns({ tr, noteEn, notesEn }) {
  const key = (n, mode) => `${noteEn(n)} ${mode === 'menor' ? 'minor' : 'major'}`;
  const lowerInst = name => tr(name[0].toUpperCase() + name.slice(1)).toLowerCase();
  return [
    // Insignia de Banda (main.js)
    [/^(\d+) tareas? pendientes?$/, (m, n) => `${n} pending task${n === '1' ? '' : 's'}`],
    // Títulos con dos acordes: «{C7} y {G7}»
    [/^(\{[^}]+\}) y (\{[^}]+\})$/, (m, a, b) => `${a} and ${b}`],
    // Diagrama de acorde (boards.js): «Acorde Lam» → «Am chord»
    [new RegExp(`^Acorde ((?:${NOTE}|[A-G][♯♭]?)\\S*)$`), (m, c) => `${noteEn(c)} chord`],
    // Importar MusicXML: avisos y errores
    [/^(\d+) (?:nota está|notas están) fuera del registro que reconoce la app\.$/, (m, n) => `${n} note${n === '1' ? ' is' : 's are'} outside the range the app recognises.`],
    [/^(\d+) (?:nota requiere|notas requieren) posiciones altas: no mostraré digitación para ellas\.$/, (m, n) => `${n} note${n === '1' ? ' needs' : 's need'} high positions: I won't show fingering for ${n === '1' ? 'it' : 'them'}.`],
    [/^XML mal formado: se esperaba (<\/[^>]*>) y llegó (<\/[^>]*>)$/, (m, a, b) => `Malformed XML: expected ${a} but found ${b}`],
    [/^(Nota|Indicación|Figura) no válida: (.*)$/, (m, k, x) => `Invalid ${({ Nota: 'note', Indicación: 'marking', Figura: 'note value' })[k]}: ${x}`],
    [/^Tonalidad no soportada: (.*)$/, (m, x) => `Unsupported key: ${x}`],
    // Consejo de ritmo (onsets.js)
    [/^Tiendes a (adelantarte|retrasarte) unos (\d+) ms: .+$/, (m, w, n) => `You tend to ${MS_TIP[w][0]} by about ${n} ms: ${MS_TIP[w][1]}.`],
    // Pasajes (passages.js)
    [/^(Subir|Repetir) al (\d+) %$/, (m, w, n) => `${w === 'Subir' ? 'Go up to' : 'Repeat at'} ${n} %`],
    [/^(.+) · c\. (\d+)–(\d+)$/, (m, title, a, b) => `${tr(title)} · bars ${a}–${b}`],
    // Manos de percusión: «D I D I», «D I D D · I D I I en corcheas»
    [/^([DI](?: [DI]| · [DI])+)( en corcheas)?$/, (m, hands, eighths) => `${hands.replace(/[DI]/g, h => HAND_EN[h])}${eighths ? ' in eighth notes' : ''}`],
    // Curso de viento: la frase del trombón en la primera unidad
    [/^Empezamos por (.+) \(notas escritas\)\. El diagrama te muestra en qué posición va la vara en cada una\.$/, (m, a) => `We start with ${notesEn(a)} (written notes). The diagram shows you the slide position for each one.`],
    // Libro de lecturas: «Re mayor · 6/8 · nivel 3», el pie del PDF y la entrada
    [new RegExp(`^(${NOTE}) (mayor|menor) · ((?:\\d+/\\d+|Compases variables) · nivel \\d+)$`), (m, n, mode, rest) => `${key(n, mode)} · ${tr(rest)}`],
    [/^Band Flow · lecturas · (.+)$/, (m, i) => `Band Flow · readings · ${tr(i)}`],
    [/^Lecturas a primera vista para (.+), en su registro y escritas como una partitura impresa\.$/, (m, i) => `Sight-reading for ${lowerInst(i)}, in its range and engraved like a printed score.`],
  ];
}
