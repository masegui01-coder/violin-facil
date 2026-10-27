// Píldoras de teoría: 2-3 tarjetas (menos de un minuto) y 1-2 preguntas, justo antes de la unidad donde hacen falta.
// No bloquean el curso. Las preguntas vuelven después, sueltas, en la rutina diaria (repaso espaciado).
// Pregunta: { id, q, options, answer (índice), why, play? (notas REALES que suenan al pulsar «Escuchar») }.
// cards puede ser una función del instrumento, para explicar lo mismo con el ejemplo de cada uno.
import { L, TIPS_EN } from './tips-l10n.js';
import { instrumentById } from './instruments.js';

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
  cello: { cards: [
    { title: 'Afinas por quintas', text: 'Do, Sol, Re y La: cada cuerda está una quinta por encima de la anterior, una octava por debajo de la viola. Se afina primero el La (220 Hz con el La de 440) y las demás comparándolas con ella.', board: [36, 43, 50, 57] },
    { title: 'Clavijas y tensores', text: 'Las clavijas hacen cambios grandes; los tensores finos del cordal, los pequeños. Gira las clavijas empujándolas hacia dentro para que no se suelten.' },
    { title: 'Instrumento en Do', text: 'El chelo suena exactamente lo que lees. Lee en clave de fa y, para las notas agudas, en clave de do en 4.ª y en clave de sol. ' + BAND_TUNING_NOTE },
  ], quiz: [{ id: 'orch-a', q: '¿A qué nota afina la orquesta?', options: ['Si♭', 'La', 'Do', 'Mi'], answer: 1, why: 'Al La: todas las cuerdas tienen un La y el oboe lo da con un sonido estable.', play: [57] }] },
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
  'eb-clarinet': { cards: [
    { title: 'Requinto en Mi♭', text: 'Es el clarinete pequeño: cuando lees Do, suena Mi♭, una tercera menor más aguda. Lleva los mismos dedos que el clarinete en Si♭.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Con el barrilete: sacarlo un poco baja la afinación. En el agudo tiende a subir: no muerdas la caña. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Sol', 'está en Mi♭ (suena una tercera menor más aguda de lo escrito)')] },
  'bass-clarinet': { cards: [
    { title: 'Clarinete bajo en Si♭', text: 'Se escribe en clave de sol como el clarinete y suena una novena más grave: cuando lees Do, suena Si♭ una octava y un tono por debajo. Mismos dedos que el clarinete.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Moviendo la boquilla o el tudel: sacarlo baja la afinación. Necesita mucho aire y una embocadura más relajada que el clarinete. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Do', 'está en Si♭ (suena una novena más grave de lo escrito)')] },
  piccolo: { cards: [
    { title: 'Flautín en Do', text: 'Se escribe como la flauta pero suena una octava más aguda, para no llenar la partitura de líneas adicionales. Mismos dedos que la flauta.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Sacando un poco la cabeza baja la afinación. Se oye muchísimo: escucha a la banda y toca más suave de lo que crees. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Si♭', 'está en Do (suena una octava más aguda, pero la nota es la misma)')] },
  'sax-soprano': { cards: [
    { title: 'Saxo soprano en Si♭', text: 'Cuando lees Do, suena Si♭: un tono más grave. Usa los mismos dedos que el resto de saxos.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Moviendo la boquilla: metida sube, sacada baja. Es el saxo más difícil de afinar: escucha mucho y usa el mapa de afinación. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Do', 'está en Si♭ (suena un tono más grave de lo escrito)')] },
  flugelhorn: { cards: [
    { title: 'Fliscorno en Si♭', text: 'Se toca y se lee igual que la trompeta (mismos pistones), pero su tubo es más ancho y suena más redondo y dulce. Cuando lees Do, suena Si♭.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Con la bomba de afinación: sacarla baja la afinación. En Re y Do♯ graves, saca un poco la del 3.er pistón. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Do', 'está en Si♭ (suena un tono más grave de lo escrito)')] },
  horn: { cards: [
    { title: 'Trompa en Fa', text: 'Cuando lees Do, suena Fa: una quinta más grave. Por eso, cuando la banda afina al Si♭ de concierto, tú tocas tu Fa.' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Con la bomba general, y también con la mano derecha dentro del pabellón: cuanto más la cierras, más baja la nota. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Fa', 'está en Fa (suena una quinta más grave de lo escrito)')] },
  trombone: { cards: [
    { title: 'Lees en sonido real', text: 'El trombón es un instrumento en Si♭ (con la vara cerrada da la serie de Si♭), pero lee en clave de fa y suena lo que lees: cuando la banda afina al Si♭, tú tocas Si♭ en 1.ª posición, con la vara cerrada.' },
    BAND_FAMILIES,
    { title: 'Siete posiciones', text: 'Cada posición de la vara baja medio tono. Las posiciones no son marcas fijas: afinas con el oído, moviendo la vara un poco hacia dentro o hacia fuera.' },
    { title: 'Cómo se afina', text: 'Con la bomba de afinación de la campana, con la vara en 1.ª. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Si♭', 'lee en sonido real (suena lo que lees)'), { id: 'tbn-pos', q: '¿Qué pasa al alargar la vara una posición?', options: ['La nota sube medio tono', 'La nota baja medio tono', 'Suena más fuerte', 'No cambia'], answer: 1, why: 'Baja medio tono: el tubo es más largo.' }] },
  euphonium: { cards: [
    { title: 'Bombardino en Si♭', text: 'En las bandas españolas suele leerse en clave de sol en Si♭: los mismos pistones que la trompeta y suena una novena más grave. (Si lees en clave de fa, suena lo que lees.)' },
    BAND_FAMILIES, WHY_TRANSPOSE,
    { title: 'Cómo se afina', text: 'Con la bomba general: sacarla baja la afinación. Necesita aire abundante y lento. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Do', 'está en Si♭ en clave de sol (suena una novena más grave de lo escrito)')] },
  tuba: { cards: [
    { title: 'Lees en sonido real (clave de fa)', text: 'En las bandas la tuba lee en clave de fa y suena lo que lees, aunque el instrumento sea en Si♭ o Fa. Cuando la banda afina al Si♭, tú tocas Si♭.' },
    BAND_FAMILIES,
    { title: 'El cimiento de la banda', text: 'La tuba sostiene la afinación de todos: si el bajo está afinado, el acorde entero suena mejor.' },
    { title: 'Cómo se afina', text: 'Con la bomba general. En el grave el aire debe ser lento y muy abundante. ' + WARM_UP.text },
  ], quiz: [bandQuestion('Si♭', 'lee en sonido real en clave de fa (suena lo que lees)')] },
  recorder: { cards: [
    { title: 'Tu flauta dulce', text: 'La flauta del cole se llama flauta dulce soprano. Suena una octava más aguda de lo que se escribe, para que la partitura sea fácil de leer.' },
    { title: 'Tapar bien', text: 'El secreto de la flauta es tapar los agujeros con la yema del dedo, sin dejar rendijas. Si una nota chilla o no sale, mira qué dedo deja pasar el aire.' },
    { title: 'Afinar la flauta', text: 'Sacando un poquito la cabeza de la flauta (la parte de arriba) suena más grave; metiéndola, más aguda. Así todos los de clase suenan juntos.' },
  ], quiz: [{ id: 'rec-squeak', q: 'Si tu flauta pita muy fuerte, ¿qué haces?', options: ['Soplar más fuerte', 'Soplar más suave', 'Morder la boquilla', 'Tapar menos agujeros'], answer: 1, why: 'Soplar más suave: la flauta dulce necesita muy poco aire.' }] },
  xylophone: { cards: [
    { title: 'Láminas de madera', text: 'Xilo quiere decir «madera» en griego. Las láminas largas suenan graves y las cortas agudas. Los de juguete suelen ser de metal: se llaman metalófonos o carillones.' },
    { title: 'Se escribe más grave', text: 'El xilófono suena una octava más agudo de lo que se escribe, para que la partitura no se llene de líneas adicionales. Cada marca suena en una octava distinta: la app te escucha en cualquiera.' },
    { title: 'Viene afinado', text: 'Las láminas se afinan en la fábrica limando la madera por debajo: tú no tienes que afinar nada. Solo acertar la lámina.' },
  ], quiz: [{ id: 'xyl-long', q: '¿Qué láminas suenan más graves?', options: ['Las más cortas', 'Las más largas', 'Las de colores claros', 'Todas igual'], answer: 1, why: 'Cuanto más larga es la lámina, más despacio vibra y más grave suena.' }] },
  cajon: { cards: [
    { title: 'Un instrumento peruano', text: 'El cajón nació en Perú. Paco de Lucía lo trajo al flamenco en los años 70 y desde entonces no falta en ningún tablao.' },
    { title: 'Las bordonas', text: 'Dentro lleva cuerdas o bordonas pegadas a la tapa: son las que dan el chasquido del agudo. Algunos cajones tienen un tornillo para tensarlas o aflojarlas.' },
    { title: 'Afinar el cajón', text: 'No da notas: se ajusta el sonido. Si los tornillos de las esquinas de arriba están más flojos, el agudo restalla más.' },
  ], quiz: [{ id: 'cajon-snares', q: '¿Qué produce el chasquido del agudo?', options: ['La madera de detrás', 'Las bordonas de dentro', 'El agujero', 'Las patas'], answer: 1, why: 'Las bordonas (cuerdas) pegadas a la tapa vibran con el golpe en el borde.' }] },
  percussion: { cards: [
    { title: 'Percusión que afina', text: 'Caja, bombo y platos no dan una nota concreta: solo se tensan los parches para que suenen bien. Los timbales, el xilófono y el glockenspiel sí dan notas.' },
    { title: 'Los timbales', text: 'Se afinan con el pedal, que tensa el parche, y el timbalero comprueba la nota con un diapasón o de oído antes de cada obra.' },
    { title: 'La banda afina al Si♭', text: BAND_TUNING_NOTE },
  ], quiz: [{ id: 'perc-tune', q: '¿Cuál de estos instrumentos de percusión da notas afinadas?', options: ['Caja', 'Bombo', 'Timbales', 'Platos'], answer: 2, why: 'Los timbales: el pedal tensa el parche hasta la nota que pide la obra.' }] },
  guitar: { cards: [
    { title: 'Mi, La, Re, Sol, Si, Mi', text: 'Casi todas las cuerdas están a una cuarta de la siguiente, salvo Sol-Si, que están a una tercera. Así las formas de los acordes caben bajo la mano.', board: [52, 57, 62, 67, 71, 76] },
    { title: 'Suena una octava más grave', text: 'La guitarra se escribe una octava por encima de como suena, para no llenar la partitura de líneas adicionales. Por lo demás está en Do.' },
    { title: 'Afina cada vez', text: 'Las cuerdas se destensan con el calor, la humedad y el uso. Afina siempre antes de tocar, empezando por la 5.ª cuerda: un La de 110 Hz, dos octavas por debajo del La 440 del diapasón.' },
  ], quiz: [{ id: 'gtr-third', q: '¿Entre qué dos cuerdas el intervalo no es una cuarta?', options: ['Mi y La', 'Re y Sol', 'Sol y Si', 'La y Re'], answer: 2, why: 'Entre Sol y Si hay una tercera mayor; entre las demás, cuartas.', play: [55, 59] }] },
  ukulele: { cards: [
    { title: 'La afinación reentrante', text: 'Sol, Do, Mi, La, pero el Sol está por encima del Do: la cuerda de arriba no es la más grave. Por eso los acordes suenan cerrados y brillantes.', board: [67, 60, 64, 69] },
    { title: 'Se escribe como suena', text: 'El ukelele lee la clave de sol tal cual, sin transportar. Su nota más grave al aire es el Do central (Do4).' },
    { title: 'Afina cada vez', text: 'Las cuerdas de nailon se estiran mucho las primeras semanas: afina antes de cada sesión. La 1.ª cuerda es el La 440 del diapasón.' },
  ], quiz: [{ id: 'uke-reentrant', q: '¿Cuál es la cuerda más grave del ukelele con afinación normal?', options: ['La 4.ª (Sol)', 'La 3.ª (Do)', 'La 2.ª (Mi)', 'La 1.ª (La)'], answer: 1, why: 'La 3.ª, el Do central. El Sol de la 4.ª está afinado agudo: es la afinación reentrante.', play: [67, 60] }] },
  piano: { cards: [
    { title: 'Tú no lo afinas', text: 'Un piano acústico lo afina un afinador profesional, una o dos veces al año. Un piano digital nunca se desafina.' },
    { title: 'Doce semitonos iguales', text: 'Se afina el La central a 440 Hz y se reparten los doce semitonos de la octava exactamente iguales (temperamento igual). Así suena bien en todas las tonalidades.' },
    { title: 'Octavas estiradas', text: 'Las cuerdas del piano son rígidas y sus armónicos salen algo más altos de lo «perfecto». Por eso el afinador deja los agudos un poco altos y los graves un poco bajos: así suena afinado.' },
  ], quiz: [{ id: 'piano-tuner', q: '¿Quién afina un piano acústico?', options: ['Quien lo toca, antes de cada clase', 'Un afinador profesional', 'Se afina solo', 'Nadie: nunca se desafina'], answer: 1, why: 'Un afinador profesional, una o dos veces al año (el digital no se desafina).' }] },
};

// Tono y semitono, explicado con el instrumento de cada uno (en el piano con las teclas negras, en la guitarra con los trastes…)
const TONE_EXAMPLE = {
  pulsada: L('En el mástil cada traste es un semitono: de Do a Re hay dos trastes; de Mi a Fa, solo uno.', 'On the neck each fret is a semitone: from C to D there are two frets; from E to F, just one.'),
  xylophone: L('En el xilófono los semitonos se ven en la fila de atrás: entre Do y Re hay una lámina; entre Mi y Fa y entre Si y Do, ninguna.', 'On the xylophone you can see semitones in the back row: between C and D there is a bar; between E and F and between B and C, none.'),
  tecla: L('En el piano se ve en las teclas negras: entre Do y Re hay una; entre Mi y Fa y entre Si y Do, ninguna.', 'On the piano you can see it in the black keys: there is one between C and D, and none between E and F or between B and C.'),
  cuerda: L('En el diapasón se nota en los dedos: de Do a Re se separan; de Mi a Fa van pegados.', 'On the fingerboard you feel it in the fingers: from C to D they are apart; from E to F they sit together.'),
  // en el chelo cada dedo está a medio tono del siguiente
  cello: L('En el chelo cada dedo está a medio tono del siguiente: de Do a Re te saltas un dedo; de Mi a Fa usas dos dedos seguidos.', 'On the cello each finger is a semitone from the next: from C to D you skip a finger; from E to F you use two neighbouring fingers.'),
  viento: L('En tu instrumento cada semitono tiene su propia digitación: lo verás en el diagrama de cada nota.', 'On your instrument each semitone has its own fingering: you will see it in the diagram for each note.'),
};
function toneCard(instId) {
  const fam = instrumentById(instId).family;
  const example = TONE_EXAMPLE[instId] || TONE_EXAMPLE[fam] || TONE_EXAMPLE.viento;
  const base = L('Entre Do y Re, Re y Mi, Fa y Sol, Sol y La y La y Si hay un tono: cabe una nota en medio (Do♯ o Re♭, por ejemplo). Entre Mi y Fa y entre Si y Do solo hay un semitono: no cabe ninguna.', 'Between C and D, D and E, F and G, G and A and A and B there is a whole tone: one note fits in between (C♯ or D♭, for example). Between E and F and between B and C there is only a semitone: nothing fits.');
  return { title: 'Siete nombres, doce sonidos', text: L(`${base} ${example}`, `${TIPS_EN[base]} ${TIPS_EN[example]}`) };
}

// Píldoras por nivel: unit = unidad del curso (0 = la primera) donde aparecen
const LEVEL_PILLS = [
  { id: 'names', unit: 0, title: 'Las notas tienen dos nombres', skip: ['percussion', 'cajon'], cards: instId => [
    { title: 'Do, Re, Mi… o C, D, E…', text: 'En España decimos Do, Re, Mi, Fa, Sol, La, Si. En inglés usan letras: C, D, E, F, G, A, B. El número (C4, A4) dice la octava: el Do central es C4.' },
    toneCard(instId),
  ], quiz: [{ id: 'names-a', q: '¿Cómo se llama el La en notación americana?', options: ['L', 'A', 'G', 'H'], answer: 1, why: 'A. C es Do, D Re, E Mi, F Fa, G Sol, A La y B Si.' }] },
  { id: 'figures', unit: 1, title: 'Pulso y figuras', cards: [
    { title: 'El pulso', text: 'Es el latido regular de la música, lo que marcas con el pie. Las figuras dicen cuántos pulsos dura cada nota.' },
    { title: 'Cuánto dura cada una', text: 'Redonda: 4 pulsos. Blanca: 2. Negra: 1. Corchea: medio. Cada silencio tiene su figura equivalente.' },
  ], quiz: [{ id: 'fig-half', q: '¿Cuántas negras caben en una blanca?', options: ['1', '2', '3', '4'], answer: 1, why: 'Dos: la blanca dura 2 pulsos y la negra 1.' }] },
  { id: 'meter', unit: 2, title: 'El compás', cards: [
    { title: 'Grupos de pulsos', text: 'El compás agrupa los pulsos. El número de arriba dice cuántos hay en cada compás: 4/4 (cuatro), 3/4 (tres, como un vals), 2/4 (dos, como un pasodoble).' },
    { title: 'El primer tiempo manda', text: 'El primer pulso de cada compás es el más fuerte. Contar «UNO-dos-tres» te ayuda a no perderte.' },
  ], quiz: [{ id: 'meter-34', q: 'Un vals va en…', options: ['2/4', '3/4', '4/4', '6/8'], answer: 1, why: 'En 3/4: tres pulsos por compás, el primero fuerte.' }] },
  { id: 'accidentals', unit: 3, title: 'Sostenidos y bemoles', skip: ['percussion', 'cajon'], cards: [
    { title: 'Medio tono arriba o abajo', text: 'El sostenido (♯) sube la nota medio tono; el bemol (♭) la baja medio tono; el becuadro (♮) la devuelve a natural.' },
    { title: 'Dos nombres para un sonido', text: 'Do♯ y Re♭ suenan igual (en el piano son la misma tecla negra): se escribe uno u otro según la tonalidad.' },
  ], quiz: [{ id: 'acc-sharp', q: 'Escucha: ¿la segunda nota está más alta o más baja?', options: ['Más alta: es un sostenido', 'Más baja: es un bemol', 'Es la misma nota'], answer: 0, why: 'Sube medio tono: Fa y luego Fa♯.', play: [[65], [66]] }] },
  { id: 'key', unit: 4, title: 'La armadura', skip: ['percussion', 'cajon'], cards: [
    { title: 'Alteraciones fijas', text: 'Los sostenidos o bemoles del principio de cada línea valen para toda la obra: si hay un Fa♯, todos los Fa son sostenidos.' },
    { title: 'Te dice la tonalidad', text: 'Sin alteraciones: Do mayor. Un sostenido (Fa♯): Sol mayor. Dos (Fa♯ y Do♯): Re mayor. Un bemol (Si♭): Fa mayor. Dos (Si♭ y Mi♭): Si♭ mayor, la favorita de la banda.' },
  ], quiz: [{ id: 'key-g', q: 'La armadura tiene un solo sostenido, Fa♯. ¿Qué tonalidad mayor es?', options: ['Do mayor', 'Sol mayor', 'Re mayor', 'Fa mayor'], answer: 1, why: 'Sol mayor: su escala tiene un Fa♯.' }] },
  { id: 'scale', unit: 5, title: 'La escala mayor', skip: ['percussion', 'cajon'], cards: [
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
  { id: 'cajon-palos', unit: 3, title: 'Los palos del flamenco', only: ['cajon'], cards: [
    { title: 'Palos de cuatro', text: 'Tangos, tientos y rumba van en cuatro tiempos. Son los más fáciles para empezar a acompañar.' },
    { title: 'Palos de doce', text: 'Soleá, alegrías y bulerías cuentan doce tiempos con acentos en 3, 6, 8, 10 y 12. La seguiriya también es de doce, pero con otros acentos: la verás más adelante.' },
  ], quiz: [{ id: 'palos-12', q: '¿Cuál de estos palos va en compás de 12?', options: ['Rumba', 'Tangos', 'Bulerías', 'Ninguno'], answer: 2, why: 'Las bulerías, como la soleá y las alegrías, cuentan doce tiempos.' }] },
  { id: 'cajon-palmas', unit: 6, title: 'Palmas y jaleo', only: ['cajon'], cards: [
    { title: 'Palmas claras y sordas', text: 'Las claras (dedos de una mano contra la palma de la otra) suenan fuerte y agudo; las sordas (palmas huecas) suenan suave. El cajón dialoga con ellas.' },
    { title: 'Escuchar al cante y al baile', text: 'El cajón acompaña: cuando canta el cantaor, toca más suave; cuando el bailaor zapatea, deja hueco o refuérzalo en los acentos.' },
  ], quiz: [{ id: 'palmas-sordas', q: '¿Cómo suenan las palmas sordas?', options: ['Fuertes y agudas', 'Suaves y graves', 'Como un aplauso normal', 'No suenan'], answer: 1, why: 'Suaves: se dan con las palmas huecas, sin chasquido.' }] },
  { id: 'chords', unit: 6, title: 'Intervalos y acordes', skip: ['percussion', 'cajon'], cards: [
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
  return list.map(p => ({ id: 'th-' + p.id, kind: 'theory', title: p.title, sub: 'Píldora de teoría · 1 min', cards: typeof p.cards === 'function' ? p.cards(instId) : p.cards, quiz: p.quiz, unit: p.unit, optional: true, pill: true }));
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
