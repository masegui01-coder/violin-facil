// Inglés de «Dictados» (Estudio): elegir nivel, escuchar, tocar y la corrección nota a nota.
// Las frases fijas van en DICTATION_EXACT; las que llevan números o notas, en dictationPatterns().
import { MELODIC_LEVELS, RHYTHM_LEVELS } from './dictation.js';

const LEVELS_EN = [
  ['Three notes', 'Degrees 1, 2 and 3 moving by step; quarter notes, half notes and a long final note'],
  ['Pentachord', 'Five notes moving by step, and the quarter rest'],
  ['The scale', 'The whole scale, within the octave, moving by step'],
  ['Thirds and the tonic chord', 'Leaps of a 3rd and through the tonic chord: 3rd, 5th and octave'],
  ['Eighth notes', 'Two eighth notes per beat'],
  ['Dots and 3/4', 'Dotted quarter, dotted half and 3/4 time'],
  ['Fourths, fifths and low notes', 'Leaps of a 4th and a 5th, and notes below the tonic'],
  ['6/8 time', 'Compound duple time: two dotted-quarter beats, with rests'],
  ['Harmonic minor', 'Minor key, with the leading note rising to the tonic'],
  ['Accidentals and sixteenths', 'Common accidentals and sixteenth notes moving by step'],
];
const RHYTHM_EN = [
  ['Quarter, half and whole notes', 'The beat with quarter, half and whole notes'],
  ['Quarter rest', 'Quarter, half notes and quarter rests'],
  ['Eighth notes', 'Two eighth notes per beat'],
  ['Syncopation and 3/4', 'Eighth, quarter and eighth; dotted half and 3/4 time'],
  ['Dotted quarter', 'Dotted quarter and eighth note'],
  ['Eighth rest', 'Off-beats with eighth rests'],
  ['6/8 time', 'Compound duple time: two dotted-quarter beats'],
  ['Sixteenth notes', 'Four sixteenth notes per beat'],
  ['Eighth and sixteenths', 'An eighth and two sixteenths, and the other way round'],
  ['Dotted eighth and syncopation', 'Dotted eighth and sixteenth, and sixteenth syncopations'],
];
const levelTexts = (levels, en) => Object.fromEntries(levels.flatMap((cfg, i) => [[cfg.name, en[i][0]], [cfg.desc, en[i][1]]]));

export const DICTATION_EXACT = {
  ...levelTexts(MELODIC_LEVELS, LEVELS_EN),
  ...levelTexts(RHYTHM_LEVELS, RHYTHM_EN),
  // ---------- Estudio y ayuda ----------
  'Dictados': 'Dictation',
  'Escucha una melodía y tócala de oído, en 10 niveles': 'Hear a melody and play it by ear, in 10 levels',
  'Escucha un ritmo y tócalo de oído, en 10 niveles': 'Hear a rhythm and play it by ear, in 10 levels',
  'Escuchas una melodía corta tres veces, con el acorde de tónica y un compás de claqueta antes, y la tocas de oído. La app la corrige nota a nota: verde si está bien, amarillo si te acercas y rojo si falla. En percusión, dictados de ritmo.':
    'You hear a short melody three times, with the tonic chord and a bar of count-in first, and play it by ear. The app marks it note by note: green if it is right, yellow if you are close and red if it is wrong. On percussion, rhythm dictations.',
  // ---------- Elegir ----------
  'Escucha un ritmo corto tres veces y tócalo de oído. Solo cuenta el ritmo.': 'Hear a short rhythm three times and play it by ear. Only the rhythm counts.',
  'Escucha una melodía corta tres veces y tócala de oído. La app la corrige nota a nota.': 'Hear a short melody three times and play it by ear. The app marks it note by note.',
  'Tonalidad:': 'Key:', '(la de tu banda)': "(your band's key)",
  'Desde el nivel 8 puede cambiar a una tonalidad vecina.': 'From level 8 it may move to a neighbouring key.',
  'Longitud': 'Length', 'Recomendado': 'Recommended', 'Empezar el dictado': 'Start the dictation',
  'Este dictado no cabe en el registro de tu instrumento': "This dictation doesn't fit your instrument's range",
  // ---------- Escuchar ----------
  'Preparado': 'Ready', 'Tocar ahora': 'Play now', 'Cambiar nivel': 'Change level',
  'Antes de cada escucha suena el acorde de tónica y un compás de claqueta. Entre escucha y escucha hay una pausa para pensar.':
    'Before each listen you hear the tonic chord and a bar of count-in. There is a pause to think between listens.',
  'Acorde de tónica': 'Tonic chord', 'Escucha…': 'Listen…', 'Pausa: repásalo en tu cabeza': 'Pause: go over it in your head',
  'Cuando quieras, toca lo que has oído': "When you're ready, play what you heard",
  'Ya puedes tocar: pulsa «Tocar ahora»': 'You can play now: press “Play now”',
  // ---------- Tocar ----------
  'para oír lo que tocas.': 'to hear what you play.', 'Tu turno': 'Your turn', 'Atento a la claqueta': 'Listen for the count-in',
  'Termina solo cuando pasa el tiempo del dictado y dejas de tocar.': 'It stops by itself once the dictation time is over and you stop playing.',
  'No se pudo abrir el micrófono': "Couldn't open the microphone",
  'Atento a la claqueta: después, toca lo que has oído': 'Listen for the count-in, then play what you heard',
  '¡Ahora! Toca': 'Now! Play', 'Termina la última nota': 'Finish the last note',
  'No he oído nada': "I didn't hear anything", 'Volver a tocar': 'Play again',
  'Comprueba que el micrófono no está tapado, acércate un poco y toca más fuerte. Empieza justo después de la claqueta.':
    "Check the microphone isn't covered, move a little closer and play louder. Start right after the count-in.",
  // ---------- Corrección ----------
  'Aciertos exactos': 'Exact hits', 'Cercanía': 'Closeness', '¡Nuevo récord en este nivel!': 'New record on this level!',
  'Nota y ritmo bien': 'Right note and rhythm', 'Cerca': 'Close', 'Mal, falta o sobra': 'Wrong, missing or extra',
  'Lo que sonó': 'What was played', 'Lo que has tocado': 'What you played',
  'Partitura del dictado': 'Dictation score', 'Partitura de lo que has tocado': 'Score of what you played',
  'Pulsa una nota del pentagrama o de la lista para ver qué sonaba y qué tocaste.': 'Tap a note on the staff or in the list to see what was played and what you played.',
  'Golpes uno a uno': 'Hits one by one', 'Notas una a una': 'Notes one by one',
  'Nota de más': 'Extra note', 'Golpe de más': 'Extra hit',
  'Volver a escuchar el dictado': 'Hear the dictation again', 'Escuchar tu versión': 'Hear your version', 'Otro dictado': 'Another dictation',
  'Sonaba': 'Expected', 'Tocaste': 'You played', 'Nada': 'Nothing', 'Ningún golpe': 'No hit', 'Ninguna nota': 'No note',
  'Ocho compases, solo hasta el nivel 5: más largos no se recuerdan con tres escuchas.': 'Eight bars only up to level 5: longer ones are too hard to remember with three listens.',
  '(relativo menor de tu banda)': "(relative minor of your band's key)",
  'En este nivel puede cambiar a una tonalidad vecina o a menor.': 'On this level it may move to a neighbouring key or to minor.',
  'Antes de cada escucha suena un compás de claqueta.': 'Before each listen you hear a bar of count-in.',
  'Antes de cada escucha suena la cadencia de la tonalidad y un compás de claqueta.': 'Before each listen you hear the cadence of the key and a bar of count-in.',
  'Antes de cada escucha suena el acorde de tónica y un compás de claqueta.': 'Before each listen you hear the tonic chord and a bar of count-in.',
  'Entre escucha y escucha hay una pausa para pensar.': 'There is a pause to think between listens.',
  'Cadencia de la tonalidad': 'Cadence of the key',
  'Ya puedes tocar cuando quieras: pulsa «Tocar ahora»': 'You can play whenever you like: press “Play now”',
  'Te escucho': "I'm listening", 'Nota final': 'Final mark', 'Altura': 'Pitch', 'Ritmo': 'Rhythm',
  'Has tocado todo en otra octava: no resta.': 'You played everything in another octave: no points lost.',
  'Cerca: revisa la alteración': 'Close: check the accidental', 'Cerca: revisa la alteración y el ritmo': 'Close: check the accidental and the rhythm',
  'Cerca: la nota de al lado': 'Close: the next note along', 'Cerca: la nota de al lado y ritmo distinto': 'Close: the next note along and different rhythm',
  'Partituras: lo que sonó y lo que has tocado': 'Scores: what was played and what you played',
  'Parece que lo has tocado transportado: las distancias entre notas están bien, pero todo va desplazado. Escucha el acorde de tónica y comprueba en qué nota empiezas.':
    'It looks like you played it transposed: the distances between notes are right, but everything is shifted. Listen to the tonic chord and check which note you start on.',
  'Para superar el nivel hacen falta 80 en altura y en ritmo.': 'To pass the level you need 80 in pitch and in rhythm.',
  'A destiempo:': 'Off the beat:',
  'Correcta': 'Right', 'Correcto': 'Right', 'Cerca: nota bien, ritmo distinto': 'Close: right note, different rhythm',
  'Cerca: otra octava': 'Close: another octave', 'Cerca: otra octava y ritmo distinto': 'Close: another octave and different rhythm',
  'Cerca: a un semitono': 'Close: a semitone away', 'Cerca: a un semitono y ritmo distinto': 'Close: a semitone away and different rhythm',
  'Cerca: a un tono': 'Close: a whole tone away', 'Cerca: a un tono y ritmo distinto': 'Close: a whole tone away and different rhythm',
  'Mal: otra nota': 'Wrong: another note', 'Mal: otra nota y ritmo distinto': 'Wrong: another note and different rhythm',
  'Falta: no la has tocado': "Missing: you didn't play it", 'Sobra: nota de más': 'Extra: one note too many',
  'Cerca: ritmo distinto': 'Close: different rhythm', 'Falta: golpe sin tocar': 'Missing: hit not played', 'Sobra: golpe de más': 'Extra: one hit too many',
  'redonda': 'whole note', 'blanca con puntillo': 'dotted half note', 'blanca': 'half note', 'negra con puntillo': 'dotted quarter note',
  'negra': 'quarter note', 'corchea con puntillo': 'dotted eighth note', 'corchea': 'eighth note', 'semicorchea': 'sixteenth note', 'nota ligada': 'tied note',
};

const STATE_EN = { correcta: 'right', correcto: 'right', cerca: 'close', mal: 'wrong', falta: 'missing' };
const plural = (n, one, many) => `${n} ${n === '1' ? one : many}`;

export function dictationPatterns() {
  return [
    [/^Nivel (\d+) · (\d\/\d) · (\d+) compases$/, (m, l, meter, b) => `Level ${l} · ${meter} · ${b} bars`],
    [/^(\d+) compases$/, (m, n) => `${n} bars`],
    [/^Nivel (\d+)$/, (m, l) => `Level ${l}`],
    [/^Récord (\d+) %$/, (m, n) => `Best ${n} %`],
    [/^Escucha (\d+) de (\d+)$/, (m, a, b) => `Listen ${a} of ${b}`],
    [/^Escucha extra \(−(\d+) puntos\)$/, (m, n) => `Extra listen (−${n} points)`],
    [/^Otra escucha \(−(\d+) puntos\)$/, (m, n) => `One more listen (−${n} points)`],
    [/^Incluye −(\d+) puntos por la escucha extra$/, (m, n) => `Includes −${n} points for the extra listen`],
    [/^Claqueta: (\d+)$/, (m, n) => `Count-in: ${n}`],
    [/^Compás (\d+) de (\d+)$/, (m, a, b) => `Bar ${a} of ${b}`],
    [/^(\d+) (nota|notas)$/, (m, n) => plural(n, 'note', 'notes')],
    [/^(\d+) (golpe|golpes)$/, (m, n) => plural(n, 'hit', 'hits')],
    [/^Aciertos exactos (\d+) % · cercanía (\d+) %$/, (m, a, b) => `Exact hits ${a} % · closeness ${b} %`],
    [/^Tu récord en este nivel: (\d+) %$/, (m, n) => `Your best on this level: ${n} %`],
    [/^Superado: el nivel (\d+) queda recomendado$/, (m, n) => `Passed: level ${n} is now recommended`],
    [/^Nota (\d+) % · altura (\d+) % · ritmo (\d+) %$/, (m, a, b, c) => `Mark ${a} % · pitch ${b} % · rhythm ${c} %`],
    [/^Nota (\d+) %$/, (m, a) => `Mark ${a} %`],
    [/^(\d+) de (\d+) notas exactas$/, (m, a, b) => `${a} of ${b} notes exact`],
    [/^(\d+) de (\d+) golpes exactos$/, (m, a, b) => `${a} of ${b} hits exact`],
    [/^Escuchar otra vez \(te (?:queda 1|quedan (\d+))\)$/, (m, n) => `Listen again (${n || 1} left)`],
    [/^Sonaba en el tiempo ([\d,]+) · tocaste en el ([\d,]+)$/, (m, a, b) => `It was on beat ${a.replace(',', '.')} · you played on ${b.replace(',', '.')}`],
    [/^Sonaba en la corchea ([\d,]+) · tocaste en la ([\d,]+)$/, (m, a, b) => `It was on eighth ${a.replace(',', '.')} · you played on ${b.replace(',', '.')}`],
    [/^Notas oídas: (\d+)$/, (m, n) => `Notes heard: ${n}`],
    [/^Golpes oídos: (\d+)$/, (m, n) => `Hits heard: ${n}`],
    [/^(Nota|Golpe) (\d+): (correcta|correcto|cerca|mal|falta)$/, (m, k, n, s) => `${k === 'Nota' ? 'Note' : 'Hit'} ${n}: ${STATE_EN[s]}`],
    [/^(Nota|Golpe) (\d+)$/, (m, k, n) => `${k === 'Nota' ? 'Note' : 'Hit'} ${n}`],
  ];
}
