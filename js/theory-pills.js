// Píldoras de teoría: 2-3 tarjetas (menos de un minuto) y 1-2 preguntas, justo antes de la unidad donde hacen falta.
// No bloquean el curso. Las preguntas vuelven después, sueltas, en la rutina diaria (repaso espaciado).
// Pregunta: { id, q, options, answer (índice), why, play? (notas REALES que suenan al pulsar «Escuchar») }.

const BAND_FAMILIES = {
  title: 'La banda por tonalidades',
  text: 'En Do (suenan lo que leen): flauta, oboe, fagot, trombón, bombardino en clave de fa, tuba, violín y piano. En Si♭: clarinete, trompeta, fliscorno, saxo soprano y tenor. En Mi♭: saxo alto y barítono, requinto. En Fa: trompa. La guitarra suena una octava más grave de lo escrito.',
};
const WHY_TRANSPOSE = {
  title: '¿Por qué? No es un defecto',
  text: 'Es tradición y comodidad: todos los tamaños de una familia usan los mismos dedos para la misma nota escrita, así un saxofonista cambia de alto a tenor sin aprender nada nuevo. Viene de cuando los metales cambiaban de tubo para tocar en cada tonalidad.',
};
const BAND_TUNING_NOTE = 'La banda afina al Si♭ de concierto: es la nota natural de la mayoría de sus instrumentos. La orquesta afina al La (todas las cuerdas tienen un La y el oboe lo da con un sonido estable). Algunas bandas usan La = 442 Hz en vez de 440.';
const WARM_UP = { title: 'Primero calienta', text: 'El aire caliente sube la afinación: afina después de unos minutos tocando, no en frío. Y vuelve a comprobarla en mitad del ensayo.' };

const bandQuestion = (written, extra) => ({
  id: 'tune-bb', q: 'El director pide «un Si♭ de concierto». ¿Qué nota tocas tú?', options: ['Do', 'Si♭', 'Sol', 'Fa'], answer: ['Do', 'Si♭', 'Sol', 'Fa'].indexOf(written),
  why: `Tu instrumento ${extra}: para que suene Si♭ tú lees y tocas ${written}.`, play: [70],
});

// La píldora «Tu instrumento y la afinación», una por instrumento
const INSTRUMENT_PILL = {
  violin: { cards: [
    { title: 'Afinas por quintas', text: 'Sol, Re, La y Mi: cada cuerda está una quinta por encima de la anterior. Se afina primero el La (440 Hz, o 442 en muchas orquestas) y las demás comparándolas con ella.', board: [55, 62, 69, 76] },
    { title: 'Clavijas y tensores', text: 'Las clavijas hacen cambios grandes; los tensores finos del cordal, los pequeños. Las cuerdas se destensan con el calor y la humedad: afina cada vez que abras el estuche.' },
    { title: 'Instrumento en Do', text: 'El violín suena exactamente lo que lees. ' + BAND_TUNING_NOTE },
  ], quiz: [{ id: 'orch-a', q: '¿A qué nota afina la orquesta?', options: ['Si♭', 'La', 'Do', 'Mi'], answer: 1, why: 'Al La: todas las cuerdas tienen un La y el oboe lo da con un sonido estable.', play: [69] }] },
  trumpet: { cards: [
    { title: 'Trompeta en Si♭', text: 'Cuando lees Do, suena Si♭: un tono más grave. Por eso tu parte está escrita un tono más alta que la de la flauta.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Con la bomba general: sacarla alarga el tubo y baja la afinación; meterla la sube. En Re y Do♯ graves saca un poco la bomba del 3.er pistón. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Do', 'está en Si♭ (suena un tono más grave de lo escrito)')] },
  clarinet: { cards: [
    { title: 'Clarinete en Si♭', text: 'Cuando lees Do, suena Si♭: un tono más grave. En tiempos de Mozart había clarinetes en Do, en Si♭ y en La; en la banda se impuso el de Si♭, cómodo en sus tonalidades con bemoles.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Sacando un poco el barrilete (o el cuerpo superior) baja la afinación; metiéndolo, sube. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Do', 'está en Si♭ (suena un tono más grave de lo escrito)')] },
  sax: { cards: [
    { title: 'Saxo alto en Mi♭', text: 'Cuando lees Do, suena Mi♭: una sexta más grave. Adolphe Sax creó la familia en dos grupos, Si♭ (soprano y tenor) y Mi♭ (alto y barítono), todos con los mismos dedos.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Moviendo la boquilla en el tudel: metida sube la afinación, sacada la baja. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Sol', 'está en Mi♭ (suena una sexta más grave de lo escrito)')] },
  'sax-tenor': { cards: [
    { title: 'Saxo tenor en Si♭', text: 'Cuando lees Do, suena Si♭ una octava y un tono más grave. Usa los mismos dedos que el alto: por eso los saxofonistas cambian de uno a otro con facilidad.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Moviendo la boquilla en el tudel: metida sube, sacada baja. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Do', 'está en Si♭ (suena una novena más grave de lo escrito)')] },
  'sax-bari': { cards: [
    { title: 'Saxo barítono en Mi♭', text: 'Cuando lees Do, suena Mi♭ más de una octava por debajo. Es el alto en grande: mismos dedos, una octava más grave.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Moviendo la boquilla en el tudel: metida sube, sacada baja. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Sol', 'está en Mi♭ (suena una octava y una sexta más grave de lo escrito)')] },
  flute: { cards: [
    { title: 'Flauta en Do', text: 'La flauta suena lo que lees: cuando la banda afina al Si♭ de concierto, tú tocas Si♭. (El flautín, en cambio, suena una octava más agudo.)' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Sacando un poco la cabeza baja la afinación; metiéndola, sube. Tapar más o menos el agujero con el labio también cambia la nota. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Si♭', 'está en Do (suena lo que lees)')] },
  oboe: { cards: [
    { title: 'Oboe en Do', text: 'El oboe suena lo que lees. En la orquesta es quien da el La para afinar: su sonido es estable y se oye por encima de todos.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Sobre todo con la caña: metida más a fondo sube la afinación. La caña y cómo la sujetas con los labios cambian mucho la nota. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Si♭', 'está en Do (suena lo que lees)'), { id: 'oboe-a', q: '¿Qué instrumento da el La para afinar a la orquesta?', options: ['Violín', 'Trompeta', 'Oboe', 'Piano'], answer: 2, why: 'El oboe: su sonido es estable y penetrante, y casi siempre estaba en las orquestas.', play: [69] }] },
  percussion: { cards: [
    { title: 'Percusión que afina', text: 'Caja, bombo y platos no dan una nota concreta: solo se tensan los parches para que suenen bien. Los timbales, el xilófono y el glockenspiel sí dan notas.' },
    { title: 'Los timbales', text: 'Se afinan con el pedal, que tensa el parche, y el timbalero comprueba la nota con un diapasón o de oído antes de cada obra.' },
    { title: 'La banda afina al Si♭', text: BAND_TUNING_NOTE },
  ], quiz: [{ id: 'perc-tune', q: '¿Cuál de estos instrumentos de percusión da notas afinadas?', options: ['Caja', 'Bombo', 'Timbales', 'Platos'], answer: 2, why: 'Los timbales: el pedal tensa el parche hasta la nota que pide la obra.' }] },
  guitar: { cards: [
    { title: 'Mi, La, Re, Sol, Si, Mi', text: 'Casi todas las cuerdas están a una cuarta de la siguiente, salvo Sol-Si, que están a una tercera. Así las formas de los acordes caben bajo la mano.', board: [52, 57, 62, 67, 71, 76] },
    { title: 'Suena una octava más grave', text: 'La guitarra se escribe una octava por encima de como suena, para no llenar la partitura de líneas adicionales. Por lo demás está en Do.' },
    { title: 'Afina cada vez', text: 'Las cuerdas se destensan con el calor, la humedad y el uso. Afina siempre antes de tocar, empezando por la 5.ª cuerda (La = 440 Hz).' },
  ], quiz: [{ id: 'gtr-third', q: '¿Entre qué dos cuerdas el intervalo no es una cuarta?', options: ['Mi y La', 'Re y Sol', 'Sol y Si', 'La y Re'], answer: 2, why: 'Entre Sol y Si hay una tercera mayor; entre las demás, cuartas.', play: [55, 59] }] },
  piano: { cards: [
    { title: 'Tú no lo afinas', text: 'Un piano acústico lo afina un afinador profesional, una o dos veces al año. Un piano digital nunca se desafina.' },
    { title: 'Doce semitonos iguales', text: 'Se afina el La central a 440 Hz y se reparten los doce semitonos de la octava exactamente iguales (temperamento igual). Así suena bien en todas las tonalidades.' },
    { title: 'Octavas estiradas', text: 'Las cuerdas del piano son rígidas y sus armónicos salen algo más altos de lo «perfecto». Por eso el afinador deja los agudos un poco altos y los graves un poco bajos: así suena afinado.' },
  ], quiz: [{ id: 'piano-tuner', q: '¿Quién afina un piano acústico?', options: ['Quien lo toca, antes de cada clase', 'Un afinador profesional', 'Se afina solo', 'Nadie: nunca se desafina'], answer: 1, why: 'Un afinador profesional, una o dos veces al año (el digital no se desafina).' }] },
};

// Píldoras por nivel: unit = unidad del curso (0 = la primera) donde aparecen
const LEVEL_PILLS = [
  { id: 'names', unit: 0, title: 'Las notas tienen dos nombres', skip: ['percussion'], cards: [
    { title: 'Do, Re, Mi… o C, D, E…', text: 'En España decimos Do, Re, Mi, Fa, Sol, La, Si. En inglés usan letras: C, D, E, F, G, A, B. El número (C4, A4) dice la octava: el Do central es C4.' },
    { title: 'Siete nombres, doce sonidos', text: 'Entre casi todas las notas hay una tecla negra (un semitono). Entre Mi y Fa y entre Si y Do no: ahí ya están a un semitono.' },
  ], quiz: [{ id: 'names-a', q: '¿Cómo se llama el La en notación americana?', options: ['L', 'A', 'G', 'H'], answer: 1, why: 'A. C es Do, D Re, E Mi, F Fa, G Sol, A La y B Si.' }] },
  { id: 'figures', unit: 1, title: 'Pulso y figuras', cards: [
    { title: 'El pulso', text: 'Es el latido regular de la música, lo que marcas con el pie. Las figuras dicen cuántos pulsos dura cada nota.' },
    { title: 'Cuánto dura cada una', text: 'Redonda: 4 pulsos. Blanca: 2. Negra: 1. Corchea: medio. Cada silencio tiene su figura equivalente.' },
  ], quiz: [{ id: 'fig-half', q: '¿Cuántas negras caben en una blanca?', options: ['1', '2', '3', '4'], answer: 1, why: 'Dos: la blanca dura 2 pulsos y la negra 1.' }] },
  { id: 'meter', unit: 2, title: 'El compás', cards: [
    { title: 'Grupos de pulsos', text: 'El compás agrupa los pulsos. El número de arriba dice cuántos hay en cada compás: 4/4 (cuatro), 3/4 (tres, como un vals), 2/4 (dos, como un pasodoble).' },
    { title: 'El primer tiempo manda', text: 'El primer pulso de cada compás es el más fuerte. Contar «UNO-dos-tres» te ayuda a no perderte.' },
  ], quiz: [{ id: 'meter-34', q: 'Un vals va en…', options: ['2/4', '3/4', '4/4', '6/8'], answer: 1, why: 'En 3/4: tres pulsos por compás, el primero fuerte.' }] },
  { id: 'accidentals', unit: 3, title: 'Sostenidos y bemoles', skip: ['percussion'], cards: [
    { title: 'Medio tono arriba o abajo', text: 'El sostenido (♯) sube la nota medio tono; el bemol (♭) la baja medio tono; el becuadro (♮) la devuelve a natural.' },
    { title: 'Dos nombres para un sonido', text: 'Do♯ y Re♭ suenan igual en el piano: se escribe uno u otro según la tonalidad.' },
  ], quiz: [{ id: 'acc-sharp', q: 'Escucha: ¿la segunda nota está más alta o más baja?', options: ['Más alta: es un sostenido', 'Más baja: es un bemol', 'Es la misma nota'], answer: 0, why: 'Sube medio tono: Fa y luego Fa♯.', play: [[65], [66]] }] },
  { id: 'key', unit: 4, title: 'La armadura', skip: ['percussion'], cards: [
    { title: 'Alteraciones fijas', text: 'Los sostenidos o bemoles del principio de cada línea valen para toda la obra: si hay un Fa♯, todos los Fa son sostenidos.' },
    { title: 'Te dice la tonalidad', text: 'Sin alteraciones: Do mayor. Un sostenido (Fa♯): Sol mayor. Dos (Fa♯ y Do♯): Re mayor. Un bemol (Si♭): Fa mayor. Dos (Si♭ y Mi♭): Si♭ mayor, la favorita de la banda.' },
  ], quiz: [{ id: 'key-g', q: 'La armadura tiene un solo sostenido, Fa♯. ¿Qué tonalidad mayor es?', options: ['Do mayor', 'Sol mayor', 'Re mayor', 'Fa mayor'], answer: 1, why: 'Sol mayor: su escala tiene un Fa♯.' }] },
  { id: 'scale', unit: 5, title: 'La escala mayor', skip: ['percussion'], cards: [
    { title: 'Tono, tono, semitono…', text: 'Toda escala mayor sigue el mismo patrón: tono, tono, semitono, tono, tono, tono, semitono. Empieces donde empieces, suena «a escala mayor».' },
    { title: 'Mayor y menor', text: 'La escala menor cambia algunos pasos y suena más triste. Escucha la diferencia en los acordes: el mayor suena luminoso; el menor, melancólico.' },
  ], quiz: [{ id: 'ear-major', q: 'Escucha el acorde. ¿Es mayor o menor?', options: ['Mayor', 'Menor'], variants: [{ play: [60, 64, 67], answer: 0 }, { play: [60, 63, 67], answer: 1 }], why: 'El mayor tiene la tercera mayor (4 semitonos); el menor, la tercera menor (3).' }] },
  { id: 'perc-read', unit: 3, title: 'Leer percusión', only: ['percussion'], cards: [
    { title: 'Cada sitio, un instrumento', text: 'La clave de percusión son dos barras: no hay notas, sino instrumentos. Lo habitual: bombo en el primer espacio, caja en el tercero y platos encima del pentagrama, con la cabeza en forma de ×.' },
    { title: 'D e I', text: 'Las letras bajo las notas dicen la mano: D derecha, I izquierda. Respetarlas desde el principio hace que los pasajes rápidos salgan solos.' },
  ], quiz: [{ id: 'perc-hand', q: '¿Qué indica una «I» debajo de una nota?', options: ['Instrumento', 'Mano izquierda', 'Más intenso', 'Repetir'], answer: 1, why: 'Mano izquierda; la D es la derecha.' }] },
  { id: 'perc-accents', unit: 5, title: 'Acentos y redobles', only: ['percussion'], cards: [
    { title: 'El acento', text: 'El signo > sobre una nota pide tocarla más fuerte que las demás. Sube la baqueta un poco más, no aprietes.' },
    { title: 'El redoble', text: 'Las rayitas cruzadas en la plica piden un redoble: muchos golpes seguidos que suenan como un sonido continuo. Se aprende despacio, golpe a golpe.' },
  ], quiz: [{ id: 'perc-accent', q: '¿Qué significa el signo > sobre una nota?', options: ['Más fuerte (acento)', 'Más rápido', 'Más largo', 'Mano derecha'], answer: 0, why: 'Es un acento: esa nota se toca más fuerte que las demás.' }] },
  { id: 'chords', unit: 6, title: 'Intervalos y acordes', skip: ['percussion'], cards: [
    { title: 'La distancia entre dos notas', text: 'Se cuenta en notas: de Do a Mi hay una tercera (Do-Re-Mi); de Do a Sol, una quinta. La octava es la misma nota más aguda.' },
    { title: 'Un acorde son terceras apiladas', text: 'Do-Mi-Sol: una tercera y otra tercera. En la banda cada sección toca una nota del acorde: por eso es tan importante afinar en conjunto.' },
  ], quiz: [{ id: 'int-fifth', q: '¿Qué intervalo hay de Do a Sol?', options: ['Tercera', 'Cuarta', 'Quinta', 'Octava'], answer: 2, why: 'Una quinta: Do-Re-Mi-Fa-Sol son cinco notas.', play: [[60], [67]] }] },
  { id: 'dynamics', unit: 7, title: 'Dinámicas y expresión', cards: [
    { title: 'Fuerte y piano', text: 'pp (pianísimo), p (piano), mp, mf, f (forte), ff (fortísimo). Crescendo (<) sube poco a poco; diminuendo (>) baja.' },
    { title: 'Tocar en grupo', text: 'En la banda, «piano» no es tocar flojo sin más: es dejar que se oiga la melodía. Escucha a los demás mientras tocas.' },
  ], quiz: [{ id: 'dyn-f', q: '¿Qué significa «f» en la partitura?', options: ['Final', 'Forte: fuerte', 'Flauta', 'Fa'], answer: 1, why: 'Forte, fuerte. «p» es piano, suave.' }] },
];

const INSTRUMENT_TITLE = 'Tu instrumento y la afinación';

// Píldoras del instrumento, en orden de unidad. Cada una es una lección de teoría opcional.
export function pillsFor(instId) {
  const own = INSTRUMENT_PILL[instId];
  const list = [
    ...(own ? [{ id: 'instrument', unit: 0, title: INSTRUMENT_TITLE, ...own }] : []),
    ...LEVEL_PILLS.filter(p => !(p.skip || []).includes(instId) && (!p.only || p.only.includes(instId))),
  ];
  return list.map(p => ({ id: 'th-' + p.id, kind: 'theory', title: p.title, sub: 'Píldora de teoría · 1 min', cards: p.cards, quiz: p.quiz, unit: p.unit, optional: true, pill: true }));
}

// Concreta una pregunta: las que tienen variantes eligen una (p. ej. acorde mayor o menor al azar)
export function resolveQuestion(q, rand = Math.random) {
  if (!q.variants) return q;
  const v = q.variants[Math.floor(rand() * q.variants.length)];
  return { ...q, ...v };
}

// Repaso: la pregunta que toca hoy de las píldoras ya vistas (gira por días y prefiere las que fallaste)
export function reviewQuestion(pills, answers, dayNumber) {
  const pool = pills.flatMap(p => (p.quiz || []).map(q => ({ ...q, pillTitle: p.title })));
  if (!pool.length) return null;
  const failed = pool.filter(q => (answers[q.id]?.wrong || 0) > (answers[q.id]?.right || 0));
  const list = failed.length ? failed : pool;
  return list[dayNumber % list.length];
}
