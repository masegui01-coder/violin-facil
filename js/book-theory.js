// Contenido de teoría de los tres libros: lenguaje musical por niveles (con preguntas), glosario de cada libro
// y técnica propia de cada familia de instrumentos para los libros 2 y 3.

// ---------- Lenguaje musical ----------
// Cada tema: tarjetas (título y texto, a veces con notas para el diagrama) y preguntas de una respuesta
export const LANGUAGE = {
  1: [
    { id: 'lm1-pentagrama', title: 'El pentagrama y la clave', cards: [
      { title: 'Cinco líneas y cuatro espacios', text: 'La música se escribe en el pentagrama. Cuanto más arriba está una nota, más aguda suena. Las líneas y los espacios se cuentan de abajo arriba.' },
      { title: 'La clave', text: 'Al principio de cada línea va la clave, que dice qué nota es cada línea. La clave de sol se enrosca en la segunda línea: ahí está el Sol. Los instrumentos graves usan la clave de fa, que marca el Fa en la cuarta línea.' },
      { title: 'Líneas adicionales', text: 'Las notas que no caben en el pentagrama se escriben con pequeñas líneas adicionales por encima o por debajo. El Do central, en clave de sol, va en la primera línea adicional de abajo.' },
    ], quiz: [
      { id: 'lm1-clave-sol', q: '¿En qué línea se enrosca la clave de sol?', options: ['En la primera', 'En la segunda', 'En la tercera', 'En la cuarta'], answer: 1, why: 'En la segunda línea, y por eso esa línea es Sol.' },
      { id: 'lm1-agudo', q: 'Cuanto más arriba está una nota en el pentagrama…', options: ['Más grave suena', 'Más fuerte suena', 'Más aguda suena', 'Más dura'], answer: 2, why: 'La altura en el papel es la altura del sonido: arriba, agudo; abajo, grave.' },
    ] },
    { id: 'lm1-figuras', title: 'Redonda, blanca y negra', cards: [
      { title: 'Las figuras dicen cuánto dura', text: 'La negra dura un pulso. La blanca, dos (es una negra hueca). La redonda, cuatro (hueca y sin plica).' },
      { title: 'El pulso', text: 'El pulso es el latido regular de la música, el que marcas con el pie. Las figuras se miden contando pulsos: «uno, dos, tres, cuatro».' },
    ], quiz: [
      { id: 'lm1-blanca', q: '¿Cuántos pulsos dura una blanca?', options: ['Uno', 'Dos', 'Tres', 'Cuatro'], answer: 1, why: 'Dos pulsos: lo mismo que dos negras.' },
      { id: 'lm1-redonda', q: '¿Cuántas negras caben en una redonda?', options: ['Dos', 'Tres', 'Cuatro', 'Ocho'], answer: 2, why: 'Cuatro: la redonda dura cuatro pulsos.' },
    ] },
    { id: 'lm1-compas', title: 'El compás', cards: [
      { title: 'Grupos de pulsos', text: 'Las barras verticales dividen la música en compases. Cada compás tiene el mismo número de pulsos. La barra doble del final indica que la obra termina.' },
      { title: 'La indicación de compás', text: 'Los dos números del principio: el de arriba dice cuántos pulsos hay en cada compás; el de abajo, qué figura vale un pulso (el 4 significa la negra). 4/4 son cuatro negras por compás.' },
      { title: 'Parte fuerte', text: 'El primer pulso de cada compás es el más importante: la parte fuerte. Si marcas un poco el «uno», la música respira y los demás te siguen.' },
    ], quiz: [
      { id: 'lm1-cuatrocuartos', q: 'En un compás de 3/4, ¿cuántas negras hay?', options: ['Dos', 'Tres', 'Cuatro', 'Seis'], answer: 1, why: 'El número de arriba manda: tres pulsos de negra.' },
    ] },
    { id: 'lm1-silencios', title: 'Los silencios', cards: [
      { title: 'Callar también es música', text: 'Cada figura tiene su silencio, que dura lo mismo. El silencio de negra parece un rayo; el de blanca es un rectángulo encima de la tercera línea; el de redonda, colgado de la cuarta.' },
      { title: 'Cuenta durante el silencio', text: 'En un silencio el pulso sigue. Cuenta por dentro y prepárate para la nota siguiente: el error más típico es entrar antes de tiempo.' },
    ], quiz: [
      { id: 'lm1-silencio', q: 'Un silencio de blanca dura…', options: ['Un pulso', 'Dos pulsos', 'Medio pulso', 'Cuatro pulsos'], answer: 1, why: 'Lo mismo que la blanca: dos pulsos.' },
    ] },
    { id: 'lm1-corcheas', title: 'Corcheas y puntillo', cards: [
      { title: 'La corchea', text: 'Dura medio pulso: dos corcheas valen una negra. Sueltas llevan un corchete; juntas se unen con una barra. Cuéntalas «uno-y, dos-y».' },
      { title: 'El puntillo', text: 'Un puntillo a la derecha de una nota le suma la mitad de lo que vale. Blanca con puntillo: 2 + 1 = 3 pulsos. Negra con puntillo: 1 + ½ = 1 y medio.' },
    ], quiz: [
      { id: 'lm1-puntillo', q: '¿Cuánto dura una blanca con puntillo?', options: ['Dos pulsos', 'Dos y medio', 'Tres pulsos', 'Cuatro pulsos'], answer: 2, why: 'La blanca (2) más la mitad (1): tres pulsos.' },
      { id: 'lm1-corchea', q: '¿Cuántas corcheas caben en una negra?', options: ['Una', 'Dos', 'Tres', 'Cuatro'], answer: 1, why: 'Dos: cada corchea dura medio pulso.' },
    ] },
    { id: 'lm1-alteraciones', title: 'Sostenidos, bemoles y becuadros', cards: [
      { title: 'Alteraciones', text: 'El sostenido (♯) sube la nota medio tono; el bemol (♭) la baja medio tono; el becuadro (♮) anula la alteración y deja la nota natural.' },
      { title: 'Valen todo el compás', text: 'Una alteración escrita junto a una nota afecta a esa nota durante el resto del compás. En el compás siguiente, la nota vuelve a ser natural.' },
    ], quiz: [
      { id: 'lm1-sostenido', q: '¿Qué hace el sostenido?', options: ['Baja medio tono', 'Sube medio tono', 'Alarga la nota', 'La hace más fuerte'], answer: 1, why: 'Sube la nota medio tono (un semitono).' },
      { id: 'lm1-compasalt', q: 'Si en un compás aparece Fa♯, ¿cómo es el siguiente Fa del mismo compás?', options: ['Natural', 'Sostenido', 'Bemol', 'Depende del instrumento'], answer: 1, why: 'Sostenido: la alteración vale hasta la barra de compás.' },
    ] },
    { id: 'lm1-armadura', title: 'La armadura', cards: [
      { title: 'Alteraciones fijas', text: 'Las alteraciones que van junto a la clave, al principio de cada línea, son la armadura: valen para toda la obra y en todas las octavas.' },
      { title: 'Te dice la tonalidad', text: 'Un sostenido (Fa♯) suele ser Sol mayor; dos (Fa♯ y Do♯), Re mayor; un bemol (Si♭), Fa mayor; dos bemoles, Si♭ mayor. Sin nada: Do mayor o La menor.' },
    ], quiz: [
      { id: 'lm1-armadura-re', q: 'Una armadura con Fa♯ y Do♯ suele ser…', options: ['Sol mayor', 'Re mayor', 'Fa mayor', 'La mayor'], answer: 1, why: 'Dos sostenidos: Re mayor (o su relativa, Si menor).' },
    ] },
    { id: 'lm1-repeticiones', title: 'Signos de repetición', cards: [
      { title: 'Barras de repetición', text: 'Dos puntos junto a una barra doble significan «vuelve a tocar desde la barra de repetición anterior», o desde el principio si no hay ninguna.' },
      { title: 'Casillas de 1.ª y 2.ª vez', text: 'La primera vez tocas la casilla 1 y repites; la segunda vez te la saltas y tocas la casilla 2.' },
      { title: 'D. C. y Fine', text: 'Da Capo (D. C.) es «desde el principio». Al fine se termina en la palabra Fine. Al Coda manda saltar al signo de la coda (un círculo con una cruz).' },
    ], quiz: [
      { id: 'lm1-dc', q: '¿Qué significa D. C. al Fine?', options: ['Termina aquí', 'Repite desde el principio hasta «Fine»', 'Más despacio hasta el final', 'Salta a la coda'], answer: 1, why: 'Da Capo: desde el principio, y se termina donde pone Fine.' },
    ] },
    { id: 'lm1-matices', title: 'Fuerte y suave: los matices', cards: [
      { title: 'Las dinámicas', text: 'pp (pianissimo, muy suave), p (piano, suave), mp y mf (medio), f (forte, fuerte) y ff (fortissimo, muy fuerte). Vienen del italiano.' },
      { title: 'Reguladores', text: 'El «abanico» que se abre (<) es crescendo: cada vez más fuerte. El que se cierra (>) es diminuendo: cada vez más suave.' },
    ], quiz: [
      { id: 'lm1-piano', q: '¿Qué significa la «p» bajo una nota?', options: ['Pausa', 'Suave', 'Pulso', 'Picado'], answer: 1, why: 'p es piano: tocar suave.' },
    ] },
  ],
  2: [
    { id: 'lm2-compases', title: 'Compases de 2/4, 3/4 y 4/4', cards: [
      { title: 'Binario, ternario y cuaternario', text: '2/4 tiene dos pulsos (marchas, pasodobles); 3/4, tres (valses, minuetos); 4/4, cuatro (casi todo el pop). La C en lugar de números es 4/4.' },
      { title: 'Cómo se marca', text: 'Los directores marcan el 2 abajo-arriba; el 3 abajo-derecha-arriba; el 4 abajo-izquierda-derecha-arriba. Siempre el primero hacia abajo: la parte fuerte.' },
    ], quiz: [
      { id: 'lm2-c', q: '¿Qué compás indica una C al principio?', options: ['2/4', '3/4', '4/4', '6/8'], answer: 2, why: 'La C es el compás de compasillo: 4/4.' },
      { id: 'lm2-vals', q: '¿En qué compás suele ir un vals?', options: ['2/4', '3/4', '4/4', '5/4'], answer: 1, why: 'En 3/4: un-dos-tres, con el uno fuerte.' },
    ] },
    { id: 'lm2-semicorcheas', title: 'Semicorcheas', cards: [
      { title: 'Cuatro por pulso', text: 'La semicorchea dura un cuarto de pulso: cuatro valen una negra. Lleva dos corchetes o dos barras. Cuéntalas «1-e-y-a».' },
      { title: 'Combinaciones', text: 'Corchea y dos semicorcheas («ta-ti-ti»), dos semicorcheas y corchea («ti-ti-ta») y corchea con puntillo y semicorchea (el ritmo «saltado» de las marchas).' },
    ], quiz: [
      { id: 'lm2-semi', q: '¿Cuántas semicorcheas caben en una blanca?', options: ['Dos', 'Cuatro', 'Seis', 'Ocho'], answer: 3, why: 'Una blanca son dos negras y cada negra cuatro semicorcheas: ocho.' },
    ] },
    { id: 'lm2-ligaduras', title: 'Ligaduras', cards: [
      { title: 'Ligadura de unión', text: 'Une dos notas iguales: se toca una sola nota que dura lo que suman las dos. Sirve para alargar una nota más allá de la barra de compás.' },
      { title: 'Ligadura de expresión', text: 'Abarca notas distintas y significa «tocar ligado»: sin cortar entre ellas (en viento, sin volver a picar; en cuerda, en el mismo arco).' },
    ], quiz: [
      { id: 'lm2-union', q: 'Una ligadura entre dos notas iguales…', options: ['Se tocan dos veces', 'Suman su duración en una sola nota', 'Se tocan más fuerte', 'Se tocan más rápido'], answer: 1, why: 'Es una ligadura de unión: una sola nota con la duración de las dos.' },
    ] },
    { id: 'lm2-articulacion', title: 'Articulación', cards: [
      { title: 'Cómo empieza y acaba cada nota', text: 'Picado: cada nota con su ataque. Ligado: sin cortes. Staccato (un punto encima): corta y separada. Tenuto (una rayita): larga y apoyada. Acento (>): con más fuerza al empezar.' },
      { title: 'Por qué importa', text: 'Las mismas notas suenan a marcha o a nana según la articulación. Leerla y respetarla es la diferencia entre tocar notas y hacer música.' },
    ], quiz: [
      { id: 'lm2-staccato', q: 'Un punto encima o debajo de una nota indica…', options: ['Que se alarga', 'Staccato: corta y separada', 'Que se repite', 'Que es más grave'], answer: 1, why: 'Es staccato: la nota se toca corta.' },
    ] },
    { id: 'lm2-escalas', title: 'Escalas mayores y el círculo de quintas', cards: [
      { title: 'Tono, tono, semitono…', text: 'Toda escala mayor sigue el mismo patrón de distancias: tono, tono, semitono, tono, tono, tono, semitono. Por eso, empezando en otra nota, hacen falta alteraciones.' },
      { title: 'El círculo de quintas', text: 'Sube de quinta en quinta y cada tonalidad suma un sostenido: Do (0), Sol (1), Re (2), La (3), Mi (4). Bajando de quinta en quinta se suman bemoles: Fa (1), Si♭ (2), Mi♭ (3), La♭ (4).' },
      { title: 'Orden de las alteraciones', text: 'Los sostenidos aparecen siempre en el mismo orden: Fa, Do, Sol, Re, La, Mi, Si. Los bemoles, al revés: Si, Mi, La, Re, Sol, Do, Fa.' },
    ], quiz: [
      { id: 'lm2-patron', q: 'En la escala mayor, ¿dónde están los semitonos?', options: ['Entre 1-2 y 5-6', 'Entre 3-4 y 7-8', 'Entre 2-3 y 6-7', 'No tiene semitonos'], answer: 1, why: 'Entre los grados 3-4 y 7-8 (en Do: Mi-Fa y Si-Do).' },
      { id: 'lm2-mib', q: '¿Cuántos bemoles tiene Mi♭ mayor?', options: ['Uno', 'Dos', 'Tres', 'Cuatro'], answer: 2, why: 'Tres: Si♭, Mi♭ y La♭.' },
    ] },
    { id: 'lm2-menores', title: 'Tonalidades menores', cards: [
      { title: 'La relativa menor', text: 'Cada tonalidad mayor tiene una menor con la misma armadura, una tercera menor por debajo: Do mayor y La menor, Sol mayor y Mi menor, Fa mayor y Re menor.' },
      { title: 'Cómo distinguirlas', text: 'Mira la última nota y el acorde final: si acaba en La con la armadura de Do, está en La menor. En menor suele aparecer el 7.º grado subido (Sol♯ en La menor).' },
    ], quiz: [
      { id: 'lm2-relativa', q: '¿Cuál es la relativa menor de Sol mayor?', options: ['Re menor', 'Mi menor', 'La menor', 'Si menor'], answer: 1, why: 'Mi menor: comparten el Fa♯ de la armadura.' },
    ] },
    { id: 'lm2-intervalos', title: 'Intervalos', cards: [
      { title: 'La distancia entre dos notas', text: 'Se cuentan las notas de la primera a la última, ambas incluidas: Do-Mi es una tercera (Do, Re, Mi); Do-Sol, una quinta; Do-Do, una octava.' },
      { title: 'Mayores y menores', text: 'Una tercera mayor tiene dos tonos (Do-Mi); una menor, tono y medio (La-Do). La tercera mayor suena alegre y la menor, melancólica.' },
      { title: 'Para afinar', text: 'Las quintas y octavas tienen que sonar «limpias», sin batidos. En la banda, afinar los acordes es escuchar estos intervalos.' },
    ], quiz: [
      { id: 'lm2-quinta', q: '¿Qué intervalo hay de Re a La?', options: ['Una cuarta', 'Una quinta', 'Una sexta', 'Una tercera'], answer: 1, why: 'Re, Mi, Fa, Sol, La: cinco notas, una quinta.' },
    ] },
    { id: 'lm2-tempo', title: 'El tempo y sus palabras', cards: [
      { title: 'Del más lento al más rápido', text: 'Largo, Adagio, Andante (al paso), Moderato, Allegro (rápido y alegre), Vivace y Presto. Muchas partituras ponen también el metrónomo: ♩ = 96.' },
      { title: 'Cambios de tempo', text: 'Ritardando (rit.): cada vez más despacio. Accelerando: cada vez más deprisa. A tempo: vuelve a la velocidad de antes. Fermata (𝄐): la nota se alarga a gusto.' },
    ], quiz: [
      { id: 'lm2-andante', q: '¿Cuál es más rápido?', options: ['Adagio', 'Andante', 'Allegro', 'Largo'], answer: 2, why: 'Allegro es rápido; Andante es al paso y Adagio y Largo, lentos.' },
      { id: 'lm2-rit', q: '¿Qué significa «rit.»?', options: ['Repetir', 'Ritmo libre', 'Cada vez más despacio', 'Más fuerte'], answer: 2, why: 'Ritardando: frenar poco a poco.' },
    ] },
  ],
  3: [
    { id: 'lm3-compuestos', title: 'Compases compuestos: 6/8', cards: [
      { title: 'Pulsos que se dividen en tres', text: 'En 6/8 hay seis corcheas por compás agrupadas de tres en tres: se sienten dos pulsos de negra con puntillo. Suena a «balanceo», como una barcarola o una jota.' },
      { title: 'Cómo se cuenta', text: 'Lento, se cuentan las seis corcheas; a tempo, solo dos pulsos: «UNO-y-a, DOS-y-a». 9/8 tiene tres pulsos y 12/8, cuatro.' },
    ], quiz: [
      { id: 'lm3-68', q: '¿Cuántos pulsos se sienten en un 6/8 rápido?', options: ['Dos', 'Tres', 'Seis', 'Ocho'], answer: 0, why: 'Dos pulsos de negra con puntillo, cada uno con tres corcheas.' },
    ] },
    { id: 'lm3-tresillos', title: 'Tresillos y síncopas', cards: [
      { title: 'El tresillo', text: 'Tres notas en el tiempo de dos, marcadas con un 3. Un tresillo de corcheas ocupa una negra: tres notas iguales en un pulso.' },
      { title: 'La síncopa', text: 'Una nota que empieza en parte débil y se alarga sobre la fuerte. Da empuje: es el alma del jazz, el pop y muchos pasodobles. Siente el pulso aunque no lo toques.' },
    ], quiz: [
      { id: 'lm3-tresillo', q: 'Un tresillo de corcheas dura…', options: ['Media negra', 'Una negra', 'Una blanca', 'Tres negras'], answer: 1, why: 'Tres corcheas en el tiempo de dos: una negra.' },
    ] },
    { id: 'lm3-acordes', title: 'Acordes y funciones', cards: [
      { title: 'El acorde', text: 'Tres o más notas a la vez. El más común es la tríada: fundamental, tercera y quinta (Do-Mi-Sol). Si la tercera es mayor, el acorde es mayor; si es menor, menor.' },
      { title: 'Tónica, subdominante y dominante', text: 'Sobre los grados I, IV y V se construyen los acordes principales. La tónica (I) es reposo; la dominante (V) es tensión que pide volver a la tónica. Con I-IV-V se acompañan miles de canciones.' },
      { title: 'La séptima de dominante', text: 'Añadir la séptima a la dominante (Sol7 en Do) aumenta la tensión y hace la vuelta a casa más clara. Es la cadencia perfecta: V7-I.' },
    ], quiz: [
      { id: 'lm3-dominante', q: 'En Do mayor, ¿cuál es el acorde de dominante?', options: ['Fa', 'La menor', 'Sol', 'Re menor'], answer: 2, why: 'Sol: está sobre el V grado.' },
    ] },
    { id: 'lm3-cromatica', title: 'Escala cromática y enarmonías', cards: [
      { title: 'Doce semitonos', text: 'La escala cromática recorre todos los semitonos de la octava. Subiendo se escribe con sostenidos y bajando con bemoles.' },
      { title: 'Enarmonía', text: 'Do♯ y Re♭ suenan igual en tu instrumento: son la misma tecla o posición escrita de dos maneras. Se escribe una u otra según la tonalidad.' },
    ], quiz: [
      { id: 'lm3-enarm', q: '¿Qué nota suena igual que Sol♯?', options: ['La♭', 'La♯', 'Sol♭', 'Fa♯'], answer: 0, why: 'Sol♯ y La♭ son enarmónicas.' },
    ] },
    { id: 'lm3-menores', title: 'Las tres escalas menores', cards: [
      { title: 'Natural, armónica y melódica', text: 'La menor natural usa las notas de su relativa mayor. La armónica sube el 7.º grado (Sol♯ en La menor). La melódica sube el 6.º y el 7.º al subir y los deja naturales al bajar.' },
      { title: 'Para qué sirve', text: 'El 7.º subido crea la «sensible» que empuja hacia la tónica. Por eso en piezas en menor aparecen alteraciones que no están en la armadura.' },
    ], quiz: [
      { id: 'lm3-armonica', q: 'En La menor armónica, ¿qué nota se altera?', options: ['Fa♯', 'Sol♯', 'Do♯', 'Ninguna'], answer: 1, why: 'El 7.º grado, Sol, sube a Sol♯.' },
    ] },
    { id: 'lm3-forma', title: 'La forma musical', cards: [
      { title: 'Frases y secciones', text: 'La música se organiza en frases (normalmente de 4 u 8 compases) que forman secciones. Se nombran con letras: A, B, C… Si una sección vuelve, se repite la letra.' },
      { title: 'Formas habituales', text: 'Binaria (A-B), ternaria (A-B-A), rondó (A-B-A-C-A) y tema con variaciones. Una marcha de banda suele tener introducción, primera parte, segunda y trío.' },
    ], quiz: [
      { id: 'lm3-ternaria', q: 'La forma A-B-A se llama…', options: ['Binaria', 'Ternaria', 'Rondó', 'Variaciones'], answer: 1, why: 'Ternaria: tres secciones, y la primera vuelve al final.' },
    ] },
    { id: 'lm3-transporte', title: 'Instrumentos transpositores', cards: [
      { title: 'Lo escrito y lo que suena', text: 'Un clarinete o una trompeta en Si♭ que lee Do produce un Si♭ real. Se escribe así para que la misma digitación se lea igual en toda la familia.' },
      { title: 'Afinar con la banda', text: 'Cuando el director pide un Si♭ de concierto, la trompeta toca su Do escrito, el saxo alto su Sol y la trompa su Fa. El oído manda: escucha y ajusta.' },
    ], quiz: [
      { id: 'lm3-sib', q: 'Un clarinete en Si♭ lee Do. ¿Qué nota real suena?', options: ['Do', 'Si♭', 'Re', 'Mi♭'], answer: 1, why: 'Si♭: suena un tono más grave de lo escrito.' },
    ] },
    { id: 'lm3-fraseo', title: 'Fraseo e interpretación', cards: [
      { title: 'Pensar en frases', text: 'Una frase tiene un punto culminante, como una pregunta o una respuesta. Llévala hacia él y relaja al final. Respira (o cambia de arco) en el final de las frases, no en mitad.' },
      { title: 'Estudiar con cabeza', text: 'Busca el pasaje difícil, tócalo lento y perfecto, y sube la velocidad poco a poco. Diez minutos atentos valen más que una hora en piloto automático.' },
      { title: 'Tocar en público', text: 'Los nervios son normales. Prepárate tocando la obra completa sin parar aunque falles: en un concierto, la música sigue.' },
    ], quiz: [
      { id: 'lm3-respirar', q: '¿Dónde conviene respirar o cambiar de arco?', options: ['En cualquier sitio', 'En mitad de la frase', 'Al final de las frases', 'Solo en los silencios largos'], answer: 2, why: 'Al final de las frases: así no se rompe el sentido musical.' },
    ] },
  ],
};

// ---------- Glosario de cada libro ----------
export const GLOSSARY = {
  1: [
    ['Pentagrama', 'Las cinco líneas donde se escribe la música.'], ['Clave', 'Signo del principio que da nombre a las notas.'],
    ['Pulso', 'El latido regular de la música.'], ['Compás', 'Grupo de pulsos entre dos barras.'],
    ['Negra', 'Figura de un pulso.'], ['Blanca', 'Figura de dos pulsos.'], ['Redonda', 'Figura de cuatro pulsos.'],
    ['Corchea', 'Figura de medio pulso.'], ['Puntillo', 'Suma a la nota la mitad de su valor.'],
    ['Sostenido', 'Sube la nota medio tono.'], ['Bemol', 'Baja la nota medio tono.'], ['Becuadro', 'Anula una alteración.'],
    ['Armadura', 'Alteraciones fijas junto a la clave.'], ['Da Capo', 'Volver al principio.'], ['Piano / forte', 'Suave / fuerte.'],
  ],
  2: [
    ['Semicorchea', 'Figura de un cuarto de pulso.'], ['Ligadura de unión', 'Suma la duración de dos notas iguales.'],
    ['Ligadura de expresión', 'Tocar sin cortes entre las notas.'], ['Staccato', 'Nota corta y separada.'],
    ['Tenuto', 'Nota larga y apoyada.'], ['Acento', 'Ataque más fuerte.'], ['Escala mayor', 'Siete notas con el patrón T-T-S-T-T-T-S.'],
    ['Relativa menor', 'Tonalidad menor con la misma armadura.'], ['Intervalo', 'Distancia entre dos notas.'],
    ['Allegro', 'Rápido.'], ['Andante', 'Al paso.'], ['Ritardando', 'Cada vez más despacio.'], ['Fermata', 'Calderón: alargar a gusto.'],
  ],
  3: [
    ['6/8', 'Compás de dos pulsos divididos en tres.'], ['Tresillo', 'Tres notas en el tiempo de dos.'], ['Síncopa', 'Nota en parte débil prolongada sobre la fuerte.'],
    ['Tríada', 'Acorde de tres notas.'], ['Dominante', 'Acorde del V grado, de tensión.'], ['Cadencia perfecta', 'Dominante a tónica: V-I.'],
    ['Escala cromática', 'Los doce semitonos seguidos.'], ['Enarmonía', 'Misma nota con dos nombres.'], ['Sensible', 'El 7.º grado a medio tono de la tónica.'],
    ['Forma ternaria', 'A-B-A.'], ['Rondó', 'A-B-A-C-A.'], ['Transpositor', 'Instrumento que suena distinto de lo que lee.'], ['Frase', 'Unidad musical con sentido completo.'],
  ],
};

// ---------- Técnica por familia (libros 2 y 3, un tema por capítulo) ----------
export const FAMILY_OF = {
  madera: 'madera', escuela: 'madera', metal: 'metal', cuerda: 'cuerda', pulsada: 'pulsada', tecla: 'tecla', percusion: 'percusion',
};

export const TECHNIQUE = {
  // El ukelele: afinación reentrante (Sol agudo), rasgueo con el índice y punteo con un dedo por cuerda
  ukulele: {
    2: [
      ['Postura y relajación', 'El ukelele contra el pecho, sujeto con el antebrazo derecho, y el pulgar izquierdo detrás del mástil sin apretar.'],
      ['Cambios limpios', 'Busca el dedo que no se mueve entre dos acordes (de {Am} a {F}, el dedo 2) y mueve los demás a la vez. Los cambios de un minuto miden tu progreso.'],
      ['Ritmos de rasgueo', 'El índice como un péndulo: abajo en el pulso y arriba entre pulsos, toques o no. Así cualquier rasgueo sale a tempo.'],
      ['Acordes de séptima', 'Muchas séptimas del ukelele son más fáciles que el acorde normal ({C7}, {A7}). Dan empuje a la vuelta a casa.'],
      ['Punteo con los dedos', 'p-i-m-a, un dedo por cuerda: pulgar en el Sol, índice en el Do, medio en el Mi y anular en el La. Lento y parejo.'],
      ['Primera posición', 'Un dedo por traste en los tres primeros trastes. La escala de Do usa las cuerdas Do, Mi y La; el Sol agudo repite notas.'],
      ['Apagar las cuerdas', 'El chuck: rasguea hacia abajo y apaga a la vez con el canto de la mano. Un sonido limpio es tan importante como las notas.'],
      ['Acompañar una canción', 'Cambia de acorde justo en la parte fuerte. Si dudas, simplifica el rasgueo, nunca el pulso.'],
    ],
    3: [
      ['La cejilla', 'Con cuatro cuerdas poco tensas es mucho más fácil que en guitarra: el dedo 1 algo de lado y el peso del brazo.'],
      ['Acordes móviles', 'Las formas de {Bb} y {Bm} sirven en todo el mástil: súbelas traste a traste y cambia de tonalidad sin aprender acordes nuevos.'],
      ['Melodía en la 1.ª cuerda', 'Sube por la cuerda La más allá del traste 5 para tocar melodías agudas; el Sol agudo te deja sonar notas al aire entre medias (campanella).'],
      ['Fingerpicking reentrante', 'Como el Sol de la 4.ª es agudo, los patrones p-i-m-a suenan como un arpa: deja que las notas se mezclen.'],
      ['Técnicas de adorno', 'Ligados ascendentes (hammer-on), descendentes (pull-off) y deslizamientos (slides) dan expresión a la melodía.'],
      ['Armonía funcional', 'I-IV-V, ii-V-I y el círculo de quintas: entender por qué van los acordes te permite sacar canciones de oído.'],
      ['Lectura de cifrados', 'Lee cifrados y tablaturas de 4 líneas (la de arriba es la 1.ª cuerda, La), pero aprende también la partitura.'],
      ['Tocar con otros', 'En un grupo el ukelele suena brillante: deja espacio a la voz y fíjate en el bajo y el ritmo de los demás.'],
    ],
  },
  // El violonchelo tiene sus propias posiciones y estudios (Dotzauer, Lee), distintos de los del violín
  cello: {
    2: [
      ['Arco recto', 'El arco paralelo al puente y a medio camino entre el puente y el diapasón. Míralo en un espejo: un arco recto suena limpio.'],
      ['El peso del brazo', 'El sonido sale del peso del brazo que cae en la cuerda a través del índice y el medio, no de apretar con la mano.'],
      ['Detaché y legato', 'Detaché: una nota por arco, sin cortes. Legato: varias notas en el mismo arco, cambiando los dedos justo a tiempo.'],
      ['El dedo 2 y el dedo 3', 'En el chelo cada dedo es medio tono: el 2 da la tercera menor y el 3 la mayor. Escucha la diferencia entre Do natural (dedo 2) y Do♯ (dedo 3) en la cuerda La.'],
      ['Las extensiones', 'Hacia atrás, el 1 se abre medio tono hacia la cejuela (Si♭ en la cuerda La); hacia delante, el 4 se estira medio tono (Do♯ en la cuerda Sol). La mano no se mueve: se abre.'],
      ['Cambios de cuerda', 'Cada cuerda tiene su altura de brazo: Do con el codo alto, La con el codo bajo. Prepara el brazo antes de cambiar.'],
      ['La afinación', 'Compara con las cuerdas al aire: el Re con el dedo 4 en la cuerda La debe «hacer vibrar» la cuerda Re al aire.'],
      ['Escalas de dos octavas', 'Do, Re y Sol mayor en primera posición, de memoria y lentas, con la afinación vigilada nota a nota.'],
    ],
    3: [
      ['La cuarta posición', 'Desliza la mano hasta que el dedo 1 dé el Mi en la cuerda La (donde el pulgar toca el talón del mástil). Practica el cambio con un dedo guía y sin prisa.'],
      ['El vibrato', 'Un balanceo del brazo entero que mueve el dedo sobre la cuerda. Empieza lento, con el metrónomo, sobre notas largas.'],
      ['Staccato y spiccato', 'Staccato: notas cortas con el arco en la cuerda. Spiccato: el arco rebota cerca del punto de equilibrio. Empieza lento.'],
      ['Dobles cuerdas', 'Dos cuerdas a la vez con el mismo peso. Empieza con una cuerda al aire y escucha que el intervalo esté afinado.'],
      ['Estudios técnicos', 'Los estudios de Dotzauer y de Lee trabajan arco y mano izquierda. Uno por semana, lento y perfecto.'],
      ['La clave de do en 4.ª', 'Para las notas agudas el chelo lee en clave de do en 4.ª: el Do central está en la 4.ª línea. Lee despacio las primeras veces.'],
      ['Tocar en sección', 'Copia los arcos del solista de chelos y escucha a tu atril: misma parte del arco y mismo carácter.'],
      ['Preparar un solo', 'Decide los arcos y las digitaciones, márcalos y grábate. La interpretación se construye antes del concierto.'],
    ],
  },

  madera: {
    2: [
      ['La respiración', 'Toma aire por la boca, abajo, como si llenaras la tripa, sin subir los hombros. Una columna de aire firme y constante es la base de un buen sonido.'],
      ['Notas tenidas', 'Cada día, unas notas largas de 8 pulsos: empieza suave, crece y vuelve. Escucha que el sonido no tiemble ni cambie de afinación.'],
      ['Picado y ligado', 'Pica con la punta de la lengua, como diciendo «tu». En lo ligado la lengua no se mueve y los dedos cambian a la vez, justo a tiempo.'],
      ['Dedos rápidos y relajados', 'Los dedos, cerca de las llaves y curvos. Sube la velocidad con el metrónomo de 4 en 4: si se tensan, vuelve atrás.'],
      ['El registro agudo', 'Para subir, más velocidad de aire y la embocadura estable, sin morder. Practica saltos de octava lentos y afinados.'],
      ['La afinación', 'Cada instrumento tiene notas que tienden a salir altas o bajas. Usa el mapa de afinación y corrige con la embocadura y el aire.'],
      ['Matices sin desafinar', 'En piano el sonido tiende a bajar y en forte a subir. Mantén el aire apoyado en los dos extremos.'],
      ['Escalas de memoria', 'Las escalas en todas las tonalidades son el vocabulario del músico. Tócalas de memoria, ligadas y picadas.'],
    ],
    3: [
      ['El vibrato', 'Una ondulación suave del sonido con el aire (diafragma) o la mandíbula, según el instrumento. Empieza lento y a tempo: 4 ondas por pulso.'],
      ['Doble picado', 'Alterna «tu-ku» para picar muy rápido. Practica solo la sílaba «ku» hasta que suene igual de clara que «tu».'],
      ['Dinámicas extremas', 'Prepara pp y ff con notas tenidas. El sonido debe seguir siendo bonito y afinado en los dos extremos.'],
      ['Posiciones alternativas', 'Muchas notas tienen digitaciones alternativas que hacen más fáciles los pasajes rápidos o afinan mejor. Consúltalas en un buen método.'],
      ['Estudios técnicos', 'Los estudios (Klosé, Rubank, Berbiguier…) trabajan un problema concreto. Toca uno cada semana, lento y perfecto antes que rápido.'],
      ['Tocar en sección', 'En la banda tu sonido debe empastar con el de tus compañeros: escucha a quien toca la misma voz y ajústate a él.'],
      ['Lectura a primera vista', 'Antes de tocar, mira la armadura, el compás y los pasajes difíciles. Al tocar, mantén el pulso aunque falles notas.'],
      ['Preparar un solo', 'Grábate, escúchate y corrige. Decide dónde respirar y marca los matices en la partitura antes del ensayo.'],
    ],
  },
  metal: {
    2: [
      ['La respiración', 'Toma aire abajo, sin subir los hombros, y suéltalo con una columna constante. El metal suena con aire, no con presión de labios.'],
      ['El zumbido', 'Unos minutos de zumbido con la boquilla sola fortalecen los labios y afinan el oído. Imita notas largas y glissandos suaves.'],
      ['Picado y ligado', 'Pica con la lengua como en «tu». En el ligado entre armónicos, usa el aire y una sílaba que se cierra («ta-a-i») sin volver a picar.'],
      ['Flexibilidad', 'Cambia de armónico sin mover los pistones (o la vara). Empieza con dos notas vecinas y amplía poco a poco.'],
      ['El registro agudo', 'Más velocidad de aire y apertura más pequeña, no más presión de la boquilla. Descansa tanto como tocas.'],
      ['La afinación', 'Las notas con 1.ª y 3.ª bomba juntas salen altas: corrígelas con la bomba o la vara. El oído manda.'],
      ['Resistencia', 'Toca en bloques cortos con descansos. Los labios se cansan antes de lo que parece: cuídalos para que no se resientan.'],
      ['Escalas de memoria', 'Las escalas en todas las tonalidades son tu vocabulario. Tócalas de memoria, ligadas y picadas.'],
    ],
    3: [
      ['Doble y triple picado', 'Alterna «tu-ku» (doble) o «tu-tu-ku» (triple) para pasajes rápidos. Practica la «ku» sola hasta que suene clara.'],
      ['El vibrato', 'Ondulación suave con la mandíbula o la mano. En la banda se usa poco y siempre con gusto: escucha a tu sección.'],
      ['Dinámicas extremas', 'En pp el aire sigue moviéndose; en ff, abre el sonido sin romperlo. Practica crescendos largos en notas tenidas.'],
      ['Sordinas', 'La sordina cambia el color y la afinación. Pruébala antes del ensayo y ajusta la bomba general si hace falta.'],
      ['Estudios técnicos', 'El Arban y los estudios de Clarke trabajan flexibilidad y dedos. Uno por semana, lento y perfecto antes que rápido.'],
      ['Tocar en sección', 'Empasta con tu sección: mismo sonido, mismas articulaciones y mismos finales de nota.'],
      ['Lectura a primera vista', 'Antes de tocar, mira armadura, compás y pasajes difíciles. Al tocar, mantén el pulso aunque falles notas.'],
      ['Preparar un solo', 'Grábate y escúchate. Decide dónde respirar y descansar: un solo largo es también una carrera de fondo.'],
    ],
  },
  cuerda: {
    2: [
      ['Arco recto', 'El arco paralelo al puente y a medio camino entre el puente y el diapasón. Míralo en un espejo: un arco recto suena limpio.'],
      ['Distribución del arco', 'Una blanca con todo el arco, dos negras con la mitad cada una. Planifica cuánto arco gastas para no quedarte sin él.'],
      ['Detaché y legato', 'Detaché: una nota por arco, sin cortes. Legato: varias notas en el mismo arco, cambiando los dedos justo a tiempo.'],
      ['Segundo dedo alto y bajo', 'El segundo dedo pegado al primero o al tercero cambia la tonalidad. Escucha la diferencia entre Do natural y Do♯ en la cuerda La.'],
      ['Cambios de cuerda', 'Prepara el codo antes de cambiar de cuerda. El movimiento sale del brazo, no solo de la muñeca.'],
      ['La afinación', 'Compara con las cuerdas al aire: un Re pisado en la cuerda La debe «hacer vibrar» la cuerda Re al aire.'],
      ['Matices con el arco', 'Más peso y velocidad de arco para forte; menos para piano. El punto de contacto también cambia: más cerca del puente, más fuerte.'],
      ['Escalas de dos octavas', 'Las escalas en primera posición, de memoria y lentas, con la afinación vigilada nota a nota.'],
    ],
    3: [
      ['La tercera posición', 'Desliza la mano para que el primer dedo esté donde estaba el tercero. Practica el cambio con un dedo guía y sin prisa.'],
      ['El vibrato', 'Un balanceo suave del dedo desde la muñeca o el brazo. Empieza lento, con el metrónomo, sobre notas largas.'],
      ['Staccato y spiccato', 'Staccato: notas cortas con el arco en la cuerda. Spiccato: el arco rebota cerca del punto de equilibrio. Empieza lento.'],
      ['Dobles cuerdas', 'Dos cuerdas a la vez con el mismo peso. Empieza con una cuerda al aire y escucha que el intervalo esté afinado.'],
      ['Estudios técnicos', 'Los estudios de Wohlfahrt y Kayser trabajan arco y mano izquierda. Uno por semana, lento y perfecto.'],
      ['Tocar en sección', 'Copia los arcos del concertino y escucha a tu atril: misma parte del arco y mismo carácter.'],
      ['Lectura a primera vista', 'Antes de tocar, mira armadura, compás, posiciones y pasajes difíciles. Al tocar, no te pares.'],
      ['Preparar un solo', 'Decide los arcos y las digitaciones, márcalos y grábate. La interpretación se construye antes del concierto.'],
    ],
  },
  pulsada: {
    2: [
      ['Postura y relajación', 'Espalda recta, hombros sueltos y el pulgar izquierdo detrás del mástil, sin apretar. La tensión es el gran enemigo de la velocidad.'],
      ['Cambios limpios', 'Busca dedos guía y mueve todos los dedos a la vez. Los cambios de un minuto miden tu progreso: apunta tu récord.'],
      ['Ritmos de rasgueo', 'Mantén la mano como un péndulo y varía solo dónde tocas: así cualquier ritmo sale a tempo.'],
      ['Acordes de séptima', 'Las séptimas dan color y empuje a la vuelta a casa. Apréndelas como «primas» de los acordes que ya sabes.'],
      ['Arpegios con los dedos', 'p-i-m-a por cuerdas. Practica despacio con el metrónomo y deja sonar todas las notas.'],
      ['Primera posición', 'Un dedo por traste. Practica la escala de Do y de Sol leyendo las notas, no solo de memoria.'],
      ['Silenciar', 'Apaga las cuerdas que no suenan con la palma o con dedos libres. Un sonido limpio es tan importante como las notas.'],
      ['Acompañar una canción', 'Escucha la melodía y cambia de acorde justo en la parte fuerte. Si dudas, simplifica el rasgueo, no el pulso.'],
    ],
    3: [
      ['La cejilla', 'El dedo 1 algo de lado y el peso del brazo, no la fuerza del pulgar. Las formas con cejilla se mueven por todo el mástil.'],
      ['Acordes móviles', 'Una misma forma con cejilla sirve para 12 acordes: solo cambia el traste. Aprende dónde está cada nota en las dos cuerdas graves.'],
      ['Escalas pentatónicas', 'Cinco notas que suenan bien sobre casi todo: la base de los solos de blues y rock. Apréndelas en una posición y luego muévelas.'],
      ['Fingerpicking avanzado', 'El pulgar marca el bajo alternando cuerdas mientras los dedos tocan la melodía. Lento y regular, el pulgar nunca para.'],
      ['Técnicas de adorno', 'Ligados ascendentes (hammer-on), descendentes (pull-off) y deslizamientos (slides) dan expresión a la melodía.'],
      ['Armonía funcional', 'I-IV-V, ii-V-I y el círculo de quintas: entender por qué van los acordes te permite sacar canciones de oído.'],
      ['Lectura de cifrados', 'Lee cifrados y tablaturas, pero aprende también la partitura: te abre todo el repertorio.'],
      ['Tocar con otros', 'En un grupo, menos es más: deja espacio a la voz y al resto. Escucha el bajo y el ritmo del batería.'],
    ],
  },
  tecla: {
    2: [
      ['Postura y peso', 'Sentado a la altura justa, antebrazos paralelos al teclado y dedos curvos. El sonido sale del peso del brazo, no de golpear.'],
      ['Las dos manos juntas', 'Practica cada mano sola y luego juntas, lento. Si se traban, vuelve a la mano que falla.'],
      ['Paso del pulgar', 'En las escalas el pulgar pasa por debajo de la mano sin girar la muñeca. Es la clave de las escalas largas.'],
      ['Acordes en la izquierda', 'Acompaña con acordes en la mano izquierda: primero en bloque, luego bajo-acorde (como un vals o una marcha).'],
      ['Legato y staccato', 'Legato: una tecla no se suelta hasta que suena la siguiente. Staccato: el dedo rebota desde la tecla.'],
      ['Leer en clave de fa', 'La mano izquierda lee la clave de fa: el Fa está en la cuarta línea. Repasa las notas cada día cinco minutos.'],
      ['Dinámicas', 'Forte con más peso y piano con menos, sin cambiar la velocidad. Practica una escala en crescendo y diminuendo.'],
      ['Escalas de dos octavas', 'Manos separadas y juntas, con la digitación correcta. La digitación se estudia, no se improvisa.'],
    ],
    3: [
      ['El pedal', 'El pedal de resonancia se cambia justo después de tocar el acorde nuevo («pedal sincopado»): sube y baja sin dejar huecos.'],
      ['Inversiones de acordes', 'Do-Mi-Sol, Mi-Sol-Do y Sol-Do-Mi son el mismo acorde. Elegir la inversión más cercana hace el acompañamiento fluido.'],
      ['Arpegios a dos manos', 'Arpegios de dos octavas con el paso del pulgar. Primero lentos y con el brazo acompañando el movimiento.'],
      ['Independencia de manos', 'Una mano en legato y otra en staccato, o una fuerte y otra suave: la melodía debe destacar sobre el acompañamiento.'],
      ['Estudios técnicos', 'Czerny, Burgmüller y Hanon trabajan problemas concretos. Uno por semana, lento y perfecto antes que rápido.'],
      ['Ornamentos', 'Trinos, mordentes y grupetos adornan la melodía. Tócalos con los dedos relajados y siempre a tempo.'],
      ['Lectura a primera vista', 'Lee primero el ritmo, después las notas. Mantén el pulso aunque te saltes alguna nota de la izquierda.'],
      ['Preparar una obra', 'Divide la obra en secciones, aprende las difíciles primero y une. Grábate antes de tocarla en público.'],
    ],
  },
  percusion: {
    2: [
      ['Agarre y rebote', 'Las baquetas sueltas entre el pulgar y el índice: deja que reboten. El golpe sale de la muñeca, no del hombro.'],
      ['Golpes simples y dobles', 'D-I-D-I y DD-II. Empieza lento con el metrónomo y sube de 4 en 4 cuando salga perfectamente igualado.'],
      ['El paradiddle', 'D-I-D-D, I-D-I-I. Con él se cambia de mano sin pensar. Practícalo con acento en la primera nota.'],
      ['Acentos', 'Un acento es un golpe más alto, no más tenso: sube más la baqueta y deja las demás notas bajas.'],
      ['Leer ritmos', 'Cuenta en voz alta «1-y-2-y» o «1-e-y-a». Leer bien el ritmo es la mitad del trabajo del percusionista.'],
      ['Matices', 'Más altura de baqueta, más volumen. Practica crescendos de pp a ff sin acelerar.'],
      ['Tocar con la banda', 'El percusionista sostiene el tempo de todos: escucha a la banda pero no te dejes arrastrar.'],
      ['Estudiar con metrónomo', 'El metrónomo es tu compañero de ensayo. Ponlo también en las corcheas para comprobar que lo entre pulsos está igualado.'],
    ],
    3: [
      ['El redoble', 'Dobles cada vez más rápidos hasta que suenen continuos. El redoble a presión (buzz) se hace apoyando la baqueta.'],
      ['Flams y drags', 'El flam: una nota de adorno muy baja justo antes del golpe principal. El drag: dos notas de adorno. Dan cuerpo al golpe.'],
      ['Compases compuestos', 'En 6/8 y 12/8 siente el pulso en grupos de tres. Muchas marchas y ritmos latinos van así.'],
      ['Independencia', 'En el cajón, el grave y el agudo; en la batería, manos y pies. Practica cada parte sola y luego juntas, lento.'],
      ['Estudios técnicos', 'Los estudios de caja (Wilcoxon, Delécluse) combinan rudimentos y lectura. Uno por semana, lento y perfecto.'],
      ['Los palos flamencos', 'Rumba, tangos, bulerías y soleá: aprende su compás y dónde caen los acentos. Escucha discos y cuenta con ellos.'],
      ['Lectura a primera vista', 'Busca primero las figuras más rápidas y los cambios de compás. Al tocar, no te pares nunca.'],
      ['Preparar un solo', 'Decide los matices y las manos (stickings), márcalos y grábate. Un solo de percusión también cuenta una historia.'],
    ],
  },
};
