// Inglés de la práctica: pistas de la lección (figura y duración, cuerda y dedo, pistones, llaves…), afinador,
// metrónomo, mapa de afinación y Perfil (niveles, cromos, temas, diploma e informe semanal).
// Las frases fijas van en PRACTICE_EXACT; las que llevan números o notas, en practicePatterns().

export const PRACTICE_EXACT = {
  // ---------- Lección: digitaciones sin números ----------
  'Fuera de la primera posición': 'Outside first position', 'Digitación: consulta tu tabla o a tu profesor': 'Fingering: check your chart or ask your teacher',
  'El Do central': 'Middle C', 'Tecla': 'Key', 'Tecla a la izquierda del Do central': 'Key to the left of middle C', 'Tecla junto al Do central': 'Key next to middle C',
  'Tecla octava grave': 'Key in the low octave', 'Tecla octava aguda': 'Key in the high octave', 'Tecla muy aguda': 'Very high key',
  'Todo abierto': 'All open', 'Sin pistones (al aire)': 'No valves (open)', 'Sin cilindros (al aire)': 'No valves (open)',
  // ---------- Afinador y metrónomo ----------
  'Afinada': 'In tune', 'Micrófono sin permiso': 'Microphone blocked', 'Sin': 'None',
  // ---------- Mapa de afinación ----------
  'Tu afinación está muy equilibrada en todas las notas con datos suficientes.': 'Your tuning is very even across all the notes with enough data.',
  // ---------- Perfil: estadísticas, niveles y temas ----------
  'puntos': 'points', 'lecciones hechas': 'lessons done', 'Nivel máximo': 'Top level', 'Precisión': 'Accuracy', 'Técnica': 'Technique',
  'Educando': 'Trainee', 'Aprendiz': 'Apprentice', 'Músico': 'Musician', 'Músico de atril': 'Section player', 'Solista': 'Soloist',
  'Concertino': 'Concertmaster', 'Maestro': 'Maestro',
  'Barniz': 'Varnish', 'Azul banda': 'Band blue', 'Verde bosque': 'Forest green', 'Granate': 'Garnet',
  'Se gana en los cofres de la rutina': 'Won in the routine chests', 'Se ganan en los cofres de la rutina diaria.': 'You win them in the daily routine chests.',
  'Un protector de racha': 'A streak freeze',
  // ---------- Cromos ----------
  'Saxofón': 'Saxophone', 'La 440': 'A 440', 'Afinación justa': 'Just intonation', 'Pasodoble': 'Pasodoble',
  'Compuso la Novena sinfonía cuando ya estaba completamente sordo.': 'He wrote his Ninth Symphony when he was already completely deaf.',
  'Escribió su primera sinfonía con unos ocho años.': 'He wrote his first symphony at about eight years old.',
  'Tuvo veinte hijos y varios fueron también compositores.': 'He had twenty children and several of them were composers too.',
  'Era sacerdote y le llamaban «el cura rojo» por su pelo.': 'He was a priest and was called “the Red Priest” because of his hair.',
  'Se le llama el padre de la sinfonía y del cuarteto de cuerda.': 'He is called the father of the symphony and the string quartet.',
  'Compuso la Sinfonía del Nuevo Mundo durante su estancia en Estados Unidos.': 'He wrote the New World Symphony while living in the United States.',
  'Escribió los ballets El lago de los cisnes y El cascanueces.': 'He wrote the ballets Swan Lake and The Nutcracker.',
  'Le llamaban «el rey de la marcha»; ayudó a crear el sousafón.': 'He was called “the March King” and helped create the sousaphone.',
  'Fue el gran compositor de ragtime; The Entertainer es de 1902.': 'He was the great ragtime composer; The Entertainer dates from 1902.',
  'Su Aleluya pertenece al oratorio El Mesías.': 'His Hallelujah chorus belongs to the oratorio Messiah.',
  'Sus cuatro cuerdas se afinan en quintas: Sol, Re, La y Mi.': 'Its four strings are tuned in fifths: G, D, A and E.',
  'Los pistones se generalizaron en el siglo XIX; antes la trompeta natural tocaba sobre todo sus armónicos.': 'Valves spread in the 19th century; before that the natural trumpet mostly played its harmonics.',
  'Su registro grave se llama chalumeau, por un instrumento antiguo.': 'Its low register is called chalumeau, after an old instrument.',
  'Lo inventó Adolphe Sax hacia 1840; es de metal pero de la familia de la madera, porque usa caña.': 'Adolphe Sax invented it around 1840; it is made of metal but belongs to the woodwind family because it uses a reed.',
  'Es de la familia de la madera aunque hoy casi todas son de metal.': 'It belongs to the woodwind family although nearly all of them are metal today.',
  'La orquesta afina con el La del oboe.': "The orchestra tunes to the oboe's A.",
  'La bordonera son los alambres que vibran bajo el parche y le dan su sonido.': 'The snares are the wires that vibrate under the head and give it its sound.',
  'En la banda de desfile marca el paso de todos los músicos.': 'In a marching band it sets the step for every musician.',
  'Es el instrumento más grave de la familia del metal.': 'It is the lowest instrument in the brass family.',
  'Cambia de nota con la vara, sin pistones.': 'It changes notes with the slide, without valves.',
  'La frecuencia de referencia La = 440 Hz se adoptó como estándar internacional en 1955.': 'The reference pitch A = 440 Hz became the international standard in 1955.',
  'Maelzel lo patentó en 1815 y Beethoven fue de los primeros en usarlo.': 'Maelzel patented it in 1815 and Beethoven was one of the first to use it.',
  'Es la marcha más típica de las bandas españolas, en compás de 2/4.': 'It is the most typical march of Spanish bands, in 2/4 time.',
  'En un acorde, la tercera mayor afinada «de verdad» es unos 14 cents más baja que en el piano.': 'In a chord, a “truly” tuned major third is about 14 cents lower than on the piano.',
  // ---------- Diploma e informe semanal ----------
  'Diploma de constancia': 'Certificate of perseverance', 'Se concede a': 'Awarded to', 'Músico de Band Flow': 'Band Flow musician',
  'Tu semana pasada': 'Your last week', 'Sigue así: diez minutos al día se notan.': 'Keep it up: ten minutes a day makes a difference.', '¡Vamos!': "Let's go!",
};

// Figuras y grupos irregulares
const FIGURE_EN = { Redonda: 'Whole', Blanca: 'Half', Negra: 'Quarter', Corchea: 'Eighth', Semicorchea: 'Sixteenth', Fusa: 'Thirty-second', Nota: 'Note' };
const GROUP_EN = { tresillo: 'triplet', quintillo: 'quintuplet', seisillo: 'sextuplet', septillo: 'septuplet', 'grupo irregular': 'tuplet' };
const FIGURE = '(Redonda|Blanca|Negra|Corchea|Semicorchea|Fusa)';
// Matiz del dedo en la cuerda: «dedo 2 alto», «dedo 1 extendido atrás»…
const FINGER_TAG_EN = { bajo: 'low', alto: 'high', extendido: 'extended', 'extendido atrás': 'back extension', 'extendido adelante': 'forward extension' };
// Nombre de la cuerda de guitarra o ukelele entre paréntesis
const STRING_TAG_EN = { aguda: 'high', agudo: 'high', grave: 'low' };
const ordinal = n => `${n}${n === '1' ? 'st' : n === '2' ? 'nd' : n === '3' ? 'rd' : 'th'}`;
const plural = (n, word) => `${n} ${word}${n === '1' ? '' : 's'}`;
const lowerFirst = text => text.charAt(0).toLowerCase() + text.slice(1);
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
// Avisos de los pistones que suelen salir altos (trompeta, fliscorno, bombardino)
const SLIDE_HINT_EN = {
  'saca la bomba del 3.er pistón': 'pull out the 3rd valve slide',
  'tiende a salir alta: corrígela con el oído': 'tends to be sharp: correct it by ear',
  'tiende a salir alta: usa el 4.º pistón si lo tienes': 'tends to be sharp: use the 4th valve if you have one',
};
const MEDAL_EN = { oro: 'Gold', plata: 'Silver', bronce: 'Bronze' };

// Una pieza de una digitación de viento madera o flauta dulce («izq. 1-2-3», «llave Mi♭», «medio pulgar»…)
function woodwindPartEn(part, noteEn) {
  const rules = [
    [/^pulgar$/, () => 'thumb'], [/^medio pulgar$/, () => 'half thumb'], [/^sin pulgar$/, () => 'no thumb'],
    [/^todo abierto$/, () => 'all open'], [/^izq\. ([\d-]+)$/, (m, f) => `L ${f}`], [/^der\. ([\d-]+)$/, (m, f) => `R ${f}`],
    [/^agujeros? ([\d-]+)( \(alemana\))?$/, (m, h, de) => `${h.includes('-') ? 'holes' : 'hole'} ${h}${de ? ' (German)' : ''}`],
    [/^llave de (octava|registro)$/, (m, k) => (k === 'octava' ? 'octave key' : 'register key')],
    [/^llave (\S+)$/, (m, k) => `${noteEn(k)} key`],
  ];
  for (const [re, fn] of rules) {
    const m = re.exec(part);
    if (m) return fn(...m);
  }
  return null;
}

// Frases con números o notas. tr: traductor de frases; noteEn y notesEn: nombres de nota en letras
export function practicePatterns({ tr, noteEn, notesEn }) {
  const stringName = name => name.replace(/^(\S+)(?: (aguda|agudo|grave))?$/, (m, n, tag) => (tag ? `${STRING_TAG_EN[tag]} ${noteEn(n)}` : noteEn(n)));
  return [
    // Lección: figura y duración («Negra · 1 tiempo», «Corchea con puntillo · 0,75 tiempo»)
    [new RegExp(`^(${FIGURE.slice(1, -1)}|Nota)( con (doble )?puntillo)? · (medio|[\\d,]+) tiempos?$`), (m, f, dot, dbl, n) => {
      const name = f === 'Nota' ? 'Note' : `${dot ? (dbl ? 'Double-dotted ' : 'Dotted ') : ''}${dot ? FIGURE_EN[f].toLowerCase() : FIGURE_EN[f]} note`;
      const beats = n === 'medio' ? 'half a beat' : `${n.replace(',', '.')} beat${n === '1' ? '' : 's'}`;
      return `${name} · ${beats}`;
    }],
    [new RegExp(`^${FIGURE} de (tresillo|quintillo|seisillo|septillo|grupo irregular)$`), (m, f, g) => `${FIGURE_EN[f]}-note ${GROUP_EN[g]}`],
    // Cuerda frotada: «Cuerda A · al aire», «Cuerda La · dedo 2 alto»
    [/^Cuerda (\S+) · (al aire|dedo (\d)(?: (bajo|alto|extendido(?: atrás| adelante)?))?)$/, (m, s, how, f, tag) => (how === 'al aire'
      ? `Open ${noteEn(s)} string`
      : `${noteEn(s)} string · finger ${f}${tag ? ` (${FINGER_TAG_EN[tag]})` : ''}`)],
    // Guitarra y ukelele: «Cuerda 1 (Mi aguda) · traste 2, dedo 2»
    [/^Cuerda (\d) \(([^)]+)\) · (al aire|traste (\d+), dedo (\d))$/, (m, n, name, how, fret, f) => `String ${n} (${stringName(name)}) · ${how === 'al aire' ? 'open' : `fret ${fret}, finger ${f}`}`],
    // Metal: pistones, cilindros y vara
    [/^(Pistón|Pistones|Cilindro|Cilindros) ([\d, ]+(?: y \d)?)(?: · (.+))?$/, (m, kind, list, hint) => `${/s$/.test(kind) ? 'Valves' : 'Valve'} ${list.replace(' y ', ' and ')}${hint ? ` · ${SLIDE_HINT_EN[hint] || tr(hint)}` : ''}`],
    [/^Vara en la (\d)\.ª posición$/, (m, n) => `Slide in ${ordinal(n)} position`],
    // Viento madera y flauta dulce: piezas separadas por « · »
    [/^[a-záéíóúñ.]+(?: [^·]+)?(?: · [^·]+)*$/i, (m, ...rest) => {
      const parts = m.split(' · ').map(p => woodwindPartEn(p, noteEn));
      return parts.every(Boolean) ? capitalize(parts.join(' · ')).replace(/^([LR]) /, '$1 ') : undefined;
    }],
    // Afinador
    [/^(Alta|Baja) (\d+) cents(?: · suena (.+))?$/, (m, dir, c, real) => `${dir === 'Alta' ? 'Sharp' : 'Flat'} ${c} cents${real ? ` · sounds ${noteEn(real)}` : ''}`],
    [/^Afinada · suena (.+)$/, (m, real) => `In tune · sounds ${noteEn(real)}`],
    [/^(Alta: afloja|Baja: tensa) (\d+) cents$/, (m, dir, c) => `${dir === 'Alta: afloja' ? 'Sharp: loosen' : 'Flat: tighten'} ${c} cents`],
    [/^Oigo (\S+): toca una cuerda al aire$/, (m, n) => `I hear ${noteEn(n)}: play an open string`],
    [/^Pulsa una cuerda para oír su nota \(La = (\d+) Hz\)\.$/, (m, hz) => `Tap a string to hear its note (A = ${hz} Hz).`],
    [/^Afinador cromático \(La = (\d+) Hz\)\.$/, (m, hz) => `Chromatic tuner (A = ${hz} Hz).`],
    [/^Notas de afinación de banda \(Si♭, La y Fa de concierto, escritas para tu instrumento\)\. La = (\d+) Hz\.$/, (m, hz) => `Band tuning notes (concert B♭, A and F, written for your instrument). A = ${hz} Hz.`],
    [/^(\d)\.ª (\S+)$/, (m, n, note) => `${ordinal(n)} ${noteEn(note)}`],
    // Mapa de afinación
    [/^Aún no hay datos de tu (.+)\. Haz lecciones o notas tenidas y aquí verás qué notas te salen altas o bajas\.$/, (m, inst) => `No data for your ${lowerFirst(tr(capitalize(inst)))} yet. Do lessons or long tones and you will see here which notes come out sharp or flat.`],
    [/^Notas a vigilar: (.+)\. Toca una para practicarla con notas tenidas\.$/, (m, list) => `Notes to watch: ${notesEn(list)}. Tap one to practise it with long tones.`],
    // Perfil: nivel, cromos, cofres, diploma e informe semanal
    [/^(\d+) puntos para (.+)$/, (m, n, lvl) => `${n} points to ${tr(lvl)}`],
    [/^Mis cromos \((\d+)\/(\d+)\)$/, (m, a, b) => `My cards (${a}/${b})`],
    [/^Cromo: (.+)$/, (m, name) => `Card: ${tr(name)}`],
    [/^Tema de color: (.+)$/, (m, name) => `Colour theme: ${tr(name)}`],
    [/^(.+) · nivel (\D.*)$/, (m, inst, lvl) => `${tr(inst)} · level ${tr(lvl)}`],
    [/^(\d+) días de práctica · (\d+) minutos · (\d+) insignias$/, (m, d, min, b) => `${plural(d, 'day')} of practice · ${plural(min, 'minute')} · ${plural(b, 'badge')}`],
    [/^Afinación media: de ±(\d+) a ±(\d+) cents$/, (m, a, b) => `Average tuning: from ±${a} to ±${b} cents`],
    [/^Precisión a tempo: del (\d+) % al (\d+) %$/, (m, a, b) => `Timing accuracy: from ${a} % to ${b} %`],
    [/^(\d+) minutos en (\d+) días \(la semana pasada: (\d+) en (\d+)\)$/, (m, a, d, b, e) => `${plural(a, 'minute')} over ${plural(d, 'day')} (last week: ${b} over ${e})`],
    [/^(\d+) minutos en (\d+) días esta semana$/, (m, a, d) => `${plural(a, 'minute')} over ${plural(d, 'day')} this week`],
    [/^¡Medalla de (.+) en la página (\d+)!$/, (m, medal, n) => `${MEDAL_EN[medal] || tr(medal)} medal on page ${n}!`],
  ];
}
