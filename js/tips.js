// Consejos pedagógicos de cada instrumento: embocadura, postura, respiración… Cada consejo tiene sus pasos
// (uno por viñeta de la ilustración, en tips-art.js), cómo comprobar que va bien, errores típicos y las fuentes.
// kind: el tipo de consejo; coach.js lo usa para enlazar un fallo detectado con el consejo que lo arregla.
import { L } from './tips-l10n.js';

// ---------- Bibliografía ----------
export const SOURCES = {
  teal: 'Larry Teal, The Art of Saxophone Playing (Summy-Birchard, 1963)',
  londeix: 'Jean-Marie Londeix, Hello! Mr. Sax (Leduc, 1989)',
  rascher: 'Sigurd Rascher, Top-Tones for the Saxophone (Carl Fischer, 1941)',
  stein: 'Keith Stein, The Art of Clarinet Playing (Summy-Birchard, 1958)',
  pino: 'David Pino, The Clarinet and Clarinet Playing (Scribner, 1980)',
  klose: 'Hyacinthe Klosé, Método completo de clarinete (1843)',
  rothwell: 'Evelyn Rothwell, Oboe Technique (Oxford University Press, 1953)',
  wye: 'Trevor Wye, Practice Book for the Flute, vol. 1: Tone (Novello, 1980)',
  taffanel: 'Paul Taffanel y Philippe Gaubert, Méthode complète de flûte (Leduc, 1923)',
  linde: 'Hans-Martin Linde, The Recorder Player\'s Handbook (Schott, 1974)',
  farkas: 'Philip Farkas, The Art of Brass Playing (Wind Music, 1962)',
  farkasHorn: 'Philip Farkas, The Art of French Horn Playing (Summy-Birchard, 1956)',
  arban: 'Jean-Baptiste Arban, Método completo de trompeta (1864)',
  jacobs: 'Brian Frederiksen, Arnold Jacobs: Song and Wind (WindSong Press, 1996)',
  wick: 'Denis Wick, Trombone Technique (Oxford University Press, 1971)',
  galamian: 'Ivan Galamian, Principles of Violin Playing and Teaching (Prentice-Hall, 1962)',
  suzuki: 'Shinichi Suzuki, Suzuki Violin School, vol. 1 (Summy-Birchard)',
  flesch: 'Carl Flesch, The Art of Violin Playing (Carl Fischer, 1924)',
  carlevaro: 'Abel Carlevaro, Escuela de la guitarra (Barry, 1979)',
  shearer: 'Aaron Shearer, Classic Guitar Technique (Franco Colombo, 1959)',
  pujol: 'Emilio Pujol, Escuela razonada de la guitarra (Ricordi Americana, 1934)',
  hill: 'James Hill y J. Chalmers Doane, Ukulele in the Classroom (Doane, 2008)',
  mark: 'Thomas Mark, What Every Pianist Needs to Know About the Body (GIA, 2003)',
  neuhaus: 'Heinrich Neuhaus, El arte del piano (Real Musical, 1987)',
  stone: 'George Lawrence Stone, Stick Control (Stone Percussion, 1935)',
  conable: 'Barbara Conable, What Every Musician Needs to Know About the Body (Andover, 2000)',
};

// ---------- Consejos que comparten varias familias ----------
const BREATH = {
  kind: 'breath', art: 'breath', sources: ['jacobs', 'conable'],
  title: L('La respiración', 'Breathing'),
  intro: L('El sonido sale del aire, no de los labios. Una respiración baja y un aire que no se cae arreglan la mitad de los problemas de afinación.', 'The sound comes from the air, not the lips. A low breath and air that does not sag fix half of all tuning problems.'),
  steps: [
    { t: L('Respira bajo', 'Breathe low'), d: L('Coge el aire por las comisuras, sin subir los hombros: se abren la barriga, los costados y la espalda.', 'Take the air in through the corners of the mouth, without lifting the shoulders: belly, sides and back expand.') },
    { t: L('Aire constante', 'Steady air'), d: L('Suelta el aire como un «ssss» largo e igual, o empujando la llama de una vela sin apagarla.', 'Let the air out like a long, even "ssss", or bending a candle flame without blowing it out.') },
    { t: L('Respira a tiempo', 'Breathe in time'), d: L('Respira en el pulso de antes de empezar: cuatro tiempos para coger aire y ocho para soltarlo con el metrónomo.', 'Breathe on the beat before you start: four beats in and eight beats out with the metronome.') },
  ],
  check: L('Con una mano en la barriga y otra en el pecho, solo debe moverse la de abajo.', 'With one hand on your belly and one on your chest, only the lower one should move.'),
  avoid: [L('Subir los hombros al respirar', 'Lifting the shoulders to breathe'), L('Quedarse sin aire al final de la frase', 'Running out of air at the end of a phrase'), L('Apretar la barriga como una tabla', 'Clenching the belly like a board')],
};

const FRETTING = {
  kind: 'fretting', art: 'fretting', sources: ['carlevaro', 'shearer'],
  title: L('Pisar las cuerdas', 'Fretting the strings'),
  intro: L('Una nota limpia no necesita fuerza, necesita sitio: justo detrás del traste y con la punta del dedo.', 'A clean note does not need force, it needs the right place: just behind the fret, with the fingertip.'),
  steps: [
    { t: L('Junto al traste', 'Next to the fret'), d: L('Pisa justo detrás del traste, no en medio de la casilla: así basta con muy poca fuerza y no desafina.', 'Press just behind the fret, not in the middle of the space: that needs very little force and stays in tune.') },
    { t: L('Con la punta', 'With the tip'), d: L('El dedo llega desde arriba, curvado, para no tocar la cuerda de al lado. Uñas cortas en esta mano.', 'The finger comes from above, curved, so it does not touch the next string. Keep the nails of this hand short.') },
    { t: L('Pulgar detrás', 'Thumb behind'), d: L('El pulgar descansa detrás del mástil, a la altura del dedo medio. No aprietes como una pinza.', 'The thumb rests behind the neck, opposite the middle finger. Do not squeeze like a clamp.') },
  ],
  check: L('Afloja poco a poco hasta que la nota trastee y luego aprieta solo un poco más: esa es la fuerza justa.', 'Loosen bit by bit until the note buzzes, then press just a little more: that is the right amount of force.'),
  avoid: [L('Pisar en mitad de la casilla', 'Pressing in the middle of the space'), L('Empujar la cuerda hacia un lado (sube la nota)', 'Pushing the string sideways (it goes sharp)'), L('Muñeca muy doblada', 'A sharply bent wrist')],
};

// ---------- Por grupo de instrumentos ----------
const SAX = [
  {
    kind: 'embouchure', art: 'reed-lip', sources: ['teal', 'londeix'],
    title: L('La embocadura', 'The embouchure'),
    intro: L('La caña tiene que poder vibrar: el labio de abajo hace de cojín entre los dientes y la caña, y los dientes de arriba se apoyan encima de la boquilla.', 'The reed has to be free to vibrate: the lower lip is a cushion between the teeth and the reed, and the upper teeth rest on top of the mouthpiece.'),
    steps: [
      { t: L('Boca relajada', 'Relaxed mouth'), d: L('Los labios están delante de los dientes, sin tensión.', 'The lips sit in front of the teeth, without tension.') },
      { t: L('Dobla el labio', 'Roll the lip'), d: L('Enrolla el labio de abajo hacia dentro hasta tapar el borde de los dientes (más o menos la mitad de la parte roja).', 'Roll the lower lip in until it covers the edge of the teeth (about half of the red part).') },
      { t: L('Apoya la boquilla', 'Place the mouthpiece'), d: L('La caña descansa sobre el labio, como sobre un cojín. Los dientes de arriba van sobre la boquilla, a 1 cm de la punta más o menos, y los labios cierran alrededor como una bolsa con cordón.', 'The reed rests on the lip like a cushion. The upper teeth sit on the mouthpiece about 1 cm from the tip, and the lips close around it like a drawstring bag.') },
    ],
    check: L('Si notas el diente apretando la caña, dobla un poco más el labio; si el sonido se ahoga, estás mordiendo.', 'If you feel the tooth pressing on the reed, roll the lip in a bit more; if the sound is choked, you are biting.'),
    avoid: [L('Sonreír: tensa las comisuras', 'Smiling: it tightens the corners'), L('Morder: el sonido se ahoga y sube', 'Biting: the sound chokes and goes sharp'), L('Hinchar los mofletes', 'Puffing out the cheeks')],
  },
  {
    kind: 'posture', art: 'sax-posture', sources: ['teal', 'conable'],
    title: L('La postura y el arnés', 'Posture and the neck strap'),
    intro: L('El saxo viene a ti, no tú al saxo: ajusta el arnés para que la boquilla llegue a la boca con la cabeza recta.', 'The sax comes to you, not you to the sax: set the strap so the mouthpiece reaches your mouth with your head straight.'),
    steps: [
      { t: L('De pie y recto', 'Stand tall'), d: L('Pies a la anchura de los hombros, rodillas sueltas y la cabeza recta, mirando al frente.', 'Feet shoulder-width apart, knees loose and head straight, looking ahead.') },
      { t: L('Ajusta el arnés', 'Adjust the strap'), d: L('Sube o baja el arnés hasta que la boquilla entre en la boca sin bajar ni subir la cabeza.', 'Raise or lower the strap until the mouthpiece meets your mouth without lowering or raising your head.') },
      { t: L('Sentado', 'Sitting'), d: L('En el borde de la silla y con la espalda recta. El alto puede ir al lado de la pierna derecha o delante; el tenor y el barítono, al lado.', 'On the edge of the chair with a straight back. The alto can go beside the right leg or in front; the tenor and baritone go to the side.') },
    ],
    check: L('Cierra los ojos, ponte recto y acerca el saxo: si tienes que mover la cabeza para encontrar la boquilla, reajusta el arnés.', 'Close your eyes, stand tall and bring the sax up: if you have to move your head to find the mouthpiece, readjust the strap.'),
    avoid: [L('Arnés muy largo: bajas la cabeza', 'Strap too long: you lower your head'), L('Arnés muy corto: subes los hombros', 'Strap too short: you raise your shoulders'), L('Dedos rectos o lejos de las llaves', 'Straight fingers or fingers far from the keys')],
  },
  {
    kind: 'mouthpiece', art: 'sax-neck', sources: ['rascher', 'teal'],
    title: L('Para empezar: tudel y boquilla', 'To start: neck and mouthpiece'),
    intro: L('Antes de montar el saxo entero, sopla solo con la boquilla (o con boquilla y tudel). Te dice al momento si la embocadura y el aire van bien.', 'Before assembling the whole sax, blow on the mouthpiece alone (or mouthpiece and neck). It tells you straight away whether your embouchure and air are right.'),
    steps: [
      { t: L('Solo la boquilla', 'Mouthpiece alone'), d: L('Con la embocadura de siempre, sopla un aire constante y escucha la nota.', 'With your usual embouchure, blow steady air and listen to the note.') },
      { t: L('Mira el afinador', 'Watch the tuner'), d: L('Muy grave: embocadura floja o poco aire. Muy agudo: estás mordiendo.', 'Very low: loose embouchure or too little air. Very high: you are biting.') },
      { t: L('Tu nota de referencia', 'Your reference note'), d: L('Solo boquilla (sonido real): soprano Do, alto La (880 Hz), tenor Sol, barítono Re. Con el tudel, el alto da La♭ / Sol♯.', 'Mouthpiece alone (concert pitch): soprano C, alto A (880 Hz), tenor G, baritone D. With the neck, the alto gives A♭ / G♯.') },
    ],
    check: L('Mantén la nota de referencia 8 tiempos sin que se mueva la aguja.', 'Hold the reference note for 8 beats without the needle moving.'),
    avoid: [L('Buscar la nota apretando los labios', 'Finding the note by squeezing the lips'), L('Inflar los mofletes', 'Puffing the cheeks')],
  },
  BREATH,
];

const CLARINET = [
  {
    kind: 'embouchure', art: 'clar-embouchure', sources: ['stein', 'pino'],
    title: L('La embocadura', 'The embouchure'),
    intro: L('Como en el saxo, el labio de abajo cubre los dientes, pero en el clarinete la barbilla va estirada hacia abajo y la boquilla entra con más ángulo.', 'As on the sax, the lower lip covers the teeth, but on the clarinet the chin is stretched down and the mouthpiece goes in at a steeper angle.'),
    steps: [
      { t: L('Dobla el labio', 'Roll the lip'), d: L('Labio de abajo sobre los dientes, un poco menos que en el saxo.', 'Lower lip over the teeth, slightly less than on the sax.') },
      { t: L('Barbilla estirada', 'Stretched chin'), d: L('Estira la barbilla hacia abajo, como al decir «iu»: lisa y en punta, sin arrugas ni bultos.', 'Stretch the chin down, as when saying "ee-oo": smooth and pointed, with no wrinkles or lumps.') },
      { t: L('El ángulo', 'The angle'), d: L('El clarinete forma unos 30-40 grados con el cuerpo. Dientes de arriba sobre la boquilla y comisuras firmes hacia el centro.', 'The clarinet sits at about 30-40 degrees to the body. Upper teeth on the mouthpiece and firm corners pulling to the centre.') },
    ],
    check: L('Mírate en el espejo: barbilla lisa y en punta, mofletes sin hinchar.', 'Look in a mirror: smooth, pointed chin and no puffed cheeks.'),
    avoid: [L('Barbilla arrugada, con bultos', 'A bunched-up, lumpy chin'), L('Clarinete muy pegado al cuerpo', 'Clarinet held too close to the body'), L('Morder: chirridos y sonido fino', 'Biting: squeaks and a thin sound')],
  },
  {
    kind: 'posture', art: 'woodwind-hold', sources: ['klose', 'conable'],
    title: L('Cómo sujetarlo', 'How to hold it'),
    intro: L('El peso del clarinete descansa en el pulgar derecho; los demás dedos quedan libres para tapar los agujeros.', 'The weight of the clarinet rests on the right thumb; the other fingers stay free to cover the holes.'),
    steps: [
      { t: L('Pulgar derecho', 'Right thumb'), d: L('El apoyapulgar va entre la uña y la primera articulación del pulgar derecho.', 'The thumb rest sits between the nail and the first joint of the right thumb.') },
      { t: L('Dedos en C', 'C-shaped fingers'), d: L('Manos curvadas, como sujetando una pelota de tenis; los dedos tapan con la yema plana.', 'Curved hands, as if holding a tennis ball; the fingers cover with the flat pad.') },
      { t: L('Cabeza recta', 'Head straight'), d: L('El clarinete sube hacia la boca, no la cabeza baja hacia él. Codos sueltos, separados del cuerpo.', 'The clarinet comes up to the mouth, the head does not go down to it. Loose elbows, away from the body.') },
    ],
    check: L('Tras tocar una nota grave, mira las yemas: debe quedar marcado el círculo del agujero.', 'After a low note, look at your fingertips: the ring of the hole should be marked.'),
    avoid: [L('Tapar con la punta del dedo', 'Covering with the fingertip'), L('Dedos muy levantados de los agujeros', 'Fingers lifted high off the holes'), L('Codos pegados al cuerpo', 'Elbows pressed to the body')],
  },
  {
    kind: 'mouthpiece', art: 'clar-barrel', sources: ['pino', 'stein'],
    title: L('Para empezar: boquilla y barrilete', 'To start: mouthpiece and barrel'),
    intro: L('Con la boquilla sola, o con boquilla y barrilete, compruebas la embocadura antes de montar todo el clarinete.', 'With the mouthpiece alone, or mouthpiece and barrel, you can check your embouchure before assembling the whole clarinet.'),
    steps: [
      { t: L('Solo la boquilla', 'Mouthpiece alone'), d: L('En el clarinete en Si♭ debe dar un Do agudo (sonido real) claro y estable.', 'On a B♭ clarinet it should give a clear, steady high C (concert pitch).') },
      { t: L('Con el barrilete', 'With the barrel'), d: L('Al añadir el barrilete, la nota baja a un Fa♯ (sonido real).', 'Adding the barrel lowers the note to an F♯ (concert pitch).') },
      { t: L('Corrige', 'Correct it'), d: L('Si sale más baja, falta aire o la embocadura está floja; si chilla, estás mordiendo. En el requinto y el clarinete bajo la nota es otra: usa siempre la misma referencia.', 'If it is lower, you need more air or a firmer embouchure; if it shrieks, you are biting. On E♭ and bass clarinet the note is different: always use the same reference.') },
    ],
    check: L('Mantén la nota 8 tiempos sin que se mueva en el afinador.', 'Hold the note for 8 beats without it moving on the tuner.'),
    avoid: [L('Buscar la nota mordiendo', 'Finding the note by biting'), L('Caña seca: mójala antes', 'A dry reed: wet it first')],
  },
  BREATH,
];

const OBOE = [
  {
    kind: 'embouchure', art: 'oboe-embouchure', sources: ['rothwell'],
    title: L('La embocadura', 'The embouchure'),
    intro: L('En el oboe los dos labios cubren los dientes y la caña doble vibra entre ellos: poca caña dentro y labios redondos, como para silbar.', 'On the oboe both lips cover the teeth and the double reed vibrates between them: little reed in the mouth and round lips, as if to whistle.'),
    steps: [
      { t: L('Los dos labios dentro', 'Both lips in'), d: L('Dobla los dos labios sobre los dientes, sin apretar la mandíbula.', 'Roll both lips over the teeth, without clenching the jaw.') },
      { t: L('Poca caña', 'Little reed'), d: L('Solo entra la punta de la caña, unos milímetros. Los labios la rodean como un cordón.', 'Only the tip of the reed goes in, a few millimetres. The lips surround it like a drawstring.') },
      { t: L('Aire con apoyo', 'Supported air'), d: L('La abertura es muy pequeña, así que el aire va con presión pero sin hinchar los mofletes.', 'The opening is very small, so the air is under pressure but without puffing the cheeks.') },
    ],
    check: L('Con la caña sola debe salir un «graznido» con varios Do a la vez.', 'The reed alone should give a "crow" with several Cs at once.'),
    avoid: [L('Meter demasiada caña: sonido abierto y alto', 'Too much reed in: an open, sharp sound'), L('Morder la caña', 'Biting the reed'), L('Hinchar los mofletes', 'Puffing the cheeks')],
  },
  {
    kind: 'mouthpiece', art: 'oboe-crow', sources: ['rothwell'],
    title: L('Para empezar: la caña sola', 'To start: the reed alone'),
    intro: L('Antes de tocar, prueba la caña sola: el sonido que hace dice si está húmeda, abierta y bien colocada en los labios.', 'Before playing, try the reed alone: its sound tells you whether it is wet, open and well placed on the lips.'),
    steps: [
      { t: L('Moja la caña', 'Wet the reed'), d: L('Dos o tres minutos en un vaso de agua (solo la parte de la caña, no el tudel).', 'Two or three minutes in a glass of water (just the cane part, not the staple).') },
      { t: L('El graznido', 'The crow'), d: L('Sopla con los labios cerca del hilo: debe sonar un graznido con Do en varias octavas.', 'Blow with the lips near the thread: it should crow with Cs in several octaves.') },
      { t: L('Solo la punta', 'Just the tip'), d: L('Luego, con solo la punta en los labios, saca un Do limpio y sostenido.', 'Then, with just the tip between the lips, play a clean, sustained C.') },
    ],
    check: L('Si solo suena agudo, la caña está cerrada o muerdes; si suena muy grave y sucio, está demasiado abierta.', 'If it only sounds high, the reed is closed or you are biting; if it is very low and fuzzy, it is too open.'),
    avoid: [L('Caña seca', 'A dry reed'), L('Apretar la mandíbula', 'Clenching the jaw')],
  },
  { ...CLARINET[1], art: 'oboe-hold', sources: ['rothwell', 'conable'], intro: L('El oboe se sujeta como el clarinete: el peso en el pulgar derecho y los dedos curvados, cerca de las llaves.', 'The oboe is held like the clarinet: the weight on the right thumb and the fingers curved, close to the keys.') },
  BREATH,
];

const FLUTE = [
  {
    kind: 'embouchure', art: 'flute-embouchure', sources: ['wye', 'taffanel'],
    title: L('La embocadura', 'The embouchure'),
    intro: L('En la flauta no hay caña: el sonido sale al partir el aire en el borde del agujero. Labios relajados y una abertura pequeña y centrada.', 'There is no reed on the flute: the sound comes from splitting the air on the edge of the hole. Relaxed lips and a small, centred opening.'),
    steps: [
      { t: L('Apoya la placa', 'Rest the lip plate'), d: L('El borde del agujero queda justo donde empieza el labio de abajo, en la línea entre labio y barbilla.', 'The edge of the hole sits right where the lower lip begins, on the line between lip and chin.') },
      { t: L('Cubre un tercio', 'Cover a third'), d: L('El labio de abajo tapa entre un cuarto y un tercio del agujero.', 'The lower lip covers between a quarter and a third of the hole.') },
      { t: L('Sopla como «pu»', 'Blow like "poo"'), d: L('Una abertura pequeña en el centro de los labios y el aire hacia el borde de enfrente, no dentro del agujero.', 'A small opening in the centre of the lips, with the air aimed at the far edge, not into the hole.') },
    ],
    check: L('Con un espejo: el chorro de aire debe empañar la placa justo por debajo del agujero, en forma de triángulo pequeño.', 'In a mirror: the air jet should fog the lip plate just below the hole, in a small triangle.'),
    avoid: [L('Sonreír: abertura ancha y sonido con aire', 'Smiling: a wide opening and an airy sound'), L('Girar la flauta hacia dentro (baja la nota)', 'Rolling the flute in (it goes flat)'), L('Soplar más fuerte para subir', 'Blowing harder to go up')],
  },
  {
    kind: 'posture', art: 'flute-hold', sources: ['wye', 'conable'],
    title: L('Cómo sujetarla', 'How to hold it'),
    intro: L('La flauta se equilibra en tres puntos, sin agarrarla: así los dedos quedan libres.', 'The flute balances on three points, without gripping: that leaves the fingers free.'),
    steps: [
      { t: L('Tres apoyos', 'Three points'), d: L('La barbilla, la base del índice izquierdo y el pulgar derecho (debajo, entre el primer y el segundo dedo).', 'The chin, the base of the left index finger, and the right thumb (underneath, between the first and second fingers).') },
      { t: L('Cabeza y brazos', 'Head and arms'), d: L('Gira la cabeza un poco a la izquierda y lleva la flauta hacia la boca. Codos sueltos, hombros bajos.', 'Turn your head slightly to the left and bring the flute to your mouth. Loose elbows, low shoulders.') },
      { t: L('Sentado', 'Sitting'), d: L('Siéntate en diagonal en la silla, girado a la derecha, para que el brazo derecho no choque con el respaldo.', 'Sit diagonally on the chair, turned to the right, so the right arm does not hit the backrest.') },
    ],
    check: L('Suelta los dedos de la mano derecha (menos el pulgar): la flauta no debe caerse ni girar.', 'Lift the right-hand fingers (except the thumb): the flute should not fall or roll.'),
    avoid: [L('Flauta inclinada hacia abajo', 'Flute tilted downwards'), L('Hombro derecho subido', 'Raised right shoulder'), L('Agarrar la flauta con fuerza', 'Gripping the flute tightly')],
  },
  {
    kind: 'mouthpiece', art: 'flute-head', sources: ['wye'],
    title: L('Para empezar: la cabeza sola', 'To start: the head joint alone'),
    intro: L('Practicar con la cabeza de la flauta sola es la forma más rápida de encontrar el sonido.', 'Practising on the head joint alone is the quickest way to find your sound.'),
    steps: [
      { t: L('Extremo abierto', 'Open end'), d: L('Sujeta la cabeza con la mano derecha y sopla: debe salir una nota clara, aproximadamente un La.', 'Hold the head joint with your right hand and blow: you should get a clear note, roughly an A.') },
      { t: L('Extremo tapado', 'Covered end'), d: L('Tapa el extremo con la palma: la nota baja más o menos una octava.', 'Cover the end with your palm: the note drops about an octave.') },
      { t: L('Sirena', 'Siren'), d: L('Destapa y tapa poco a poco: el sonido sube y baja sin cortarse, como una sirena.', 'Uncover and cover slowly: the sound slides up and down without breaking, like a siren.') },
    ],
    check: L('Si la nota sale con mucho aire, adelanta un poco el labio de arriba y haz la abertura más pequeña.', 'If the note is very airy, bring the top lip slightly forward and make the opening smaller.'),
    avoid: [L('Tapar demasiado el agujero', 'Covering too much of the hole'), L('Soplar dentro del agujero', 'Blowing into the hole')],
  },
  BREATH,
];

const RECORDER = [
  {
    kind: 'holes', art: 'recorder-holes', sources: ['linde'],
    title: L('Tapar bien los agujeros', 'Covering the holes'),
    intro: L('Casi todos los chillidos de la flauta dulce son un agujero mal tapado. La mano izquierda va arriba y la derecha abajo.', 'Almost every recorder squeak is a hole not fully covered. The left hand goes on top and the right hand below.') ,
    steps: [
      { t: L('Izquierda arriba', 'Left hand on top'), d: L('Pulgar izquierdo detrás, en el agujero de atrás; índice, medio y anular en los tres primeros agujeros.', 'Left thumb at the back, on the back hole; index, middle and ring fingers on the first three holes.') },
      { t: L('Con la yema', 'With the pad'), d: L('Tapa con la yema plana, no con la punta: tiene que quedar el círculo marcado en el dedo.', 'Cover with the flat pad, not the tip: the ring should show on your finger.') },
      { t: L('Pulgar entreabierto', 'Half-open thumb'), d: L('Para las notas agudas, el pulgar de atrás deja una rendija pequeña doblando la punta.', 'For the high notes, the back thumb leaves a small gap by bending its tip.') },
    ],
    check: L('Toca el Do grave muy suave: si sale limpio, todos los agujeros están bien tapados.', 'Play the low C very softly: if it comes out clean, every hole is properly covered.'),
    avoid: [L('Dedos rectos y tensos', 'Straight, tense fingers'), L('Mano derecha arriba', 'Right hand on top'), L('Levantar mucho los dedos', 'Lifting the fingers high')],
  },
  {
    kind: 'breath', art: 'recorder-breath', sources: ['linde'],
    title: L('Soplar «du»', 'Blowing "doo"'),
    intro: L('La flauta dulce necesita muy poco aire. Si soplas como en otros vientos, todas las notas suben y chillan.', 'The recorder needs very little air. If you blow as on other wind instruments, every note goes sharp and squeaks.'),
    steps: [
      { t: L('Labios suaves', 'Gentle lips'), d: L('La boquilla descansa sobre el labio de abajo, sin dientes; los labios la cierran sin apretar.', 'The mouthpiece rests on the lower lip, with no teeth; the lips close around it without squeezing.') },
      { t: L('Di «du»', 'Say "doo"'), d: L('Cada nota empieza con la lengua, como al decir «du» muy suave.', 'Each note starts with the tongue, as when saying a very soft "doo".') },
      { t: L('Aire templado', 'Warm air'), d: L('Sopla como para calentarte las manos, no para apagar una vela.', 'Blow as if warming your hands, not blowing out a candle.') },
    ],
    check: L('Graves suaves, agudas un poco más rápidas, pero nunca fuerte.', 'Soft low notes, slightly faster air for the high ones, but never loud.'),
    avoid: [L('Soplar fuerte', 'Blowing hard'), L('Morder la boquilla', 'Biting the mouthpiece'), L('Empezar las notas sin lengua', 'Starting notes without the tongue')],
  },
];

const BRASS = [
  {
    kind: 'buzz', art: 'brass-buzz', sources: ['farkas', 'jacobs'],
    title: L('La vibración de los labios (buzz)', 'The lip buzz'),
    intro: L('En los metales tus labios son la caña: vibran con el aire dentro de la boquilla. Si el buzz es bueno, el instrumento solo lo amplifica.', 'On brass instruments your lips are the reed: they vibrate with the air inside the mouthpiece. If the buzz is good, the instrument just amplifies it.'),
    steps: [
      { t: L('Labios juntos', 'Lips together'), d: L('Junta los labios como al decir «m», con las comisuras firmes y el centro blando.', 'Bring the lips together as when saying "m", with firm corners and a soft centre.') },
      { t: L('Sopla y vibra', 'Blow and buzz'), d: L('Sopla entre ellos hasta que vibren como una moto. Sin boquilla, unos segundos.', 'Blow between them until they vibrate like a motorbike. Without the mouthpiece, for a few seconds.') },
      { t: L('Con la boquilla', 'On the mouthpiece'), d: L('Haz el buzz en la boquilla: sirenas de grave a agudo y canciones sencillas antes de tocar el instrumento.', 'Buzz on the mouthpiece: sirens from low to high and simple tunes before playing the instrument.') },
    ],
    check: L('Canta la nota y después hazla con el buzz: debe salir la misma, sin buscarla.', 'Sing the note and then buzz it: the same note should come out, without searching.'),
    avoid: [L('Apretar la boquilla contra los labios', 'Pressing the mouthpiece into the lips'), L('Hinchar los mofletes', 'Puffing the cheeks'), L('Soplar sin pensar la nota', 'Blowing without hearing the note first')],
  },
  {
    kind: 'embouchure', art: 'brass-placement', sources: ['farkas', 'farkasHorn', 'arban'],
    title: L('Dónde poner la boquilla', 'Where to place the mouthpiece'),
    intro: L('La boquilla se centra de lado a lado; de arriba abajo depende del instrumento y de tus labios. Lo importante es que siempre vaya al mismo sitio.', 'The mouthpiece is centred side to side; top to bottom depends on the instrument and on your lips. What matters is that it always goes to the same place.'),
    steps: [
      { t: L('Centrada', 'Centred'), d: L('El centro de la boquilla coincide con el centro de la boca.', 'The centre of the mouthpiece lines up with the centre of the mouth.') },
      { t: L('Más o menos alta', 'Higher or lower'), d: L('Trompeta: mitad y mitad o un poco más arriba. Trompa: unos dos tercios de labio de arriba. Metales graves: más labio de arriba que de abajo.', 'Trumpet: half and half or slightly higher. Horn: about two thirds upper lip. Low brass: more upper lip than lower.') },
      { t: L('Poca presión', 'Little pressure'), d: L('Apoya la boquilla lo justo para que no se escape el aire. El agudo sale con aire más rápido, no apretando.', 'Rest the mouthpiece just enough to stop air escaping. High notes come from faster air, not pressure.') },
    ],
    check: L('Después de tocar, la marca de la boquilla debe ser suave y verse siempre en el mismo sitio.', 'After playing, the mouthpiece mark should be faint and always in the same place.'),
    avoid: [L('Boquilla torcida a un lado', 'Mouthpiece off to one side'), L('Mucha presión en el agudo', 'Lots of pressure up high'), L('Cambiar el sitio cada día', 'Changing the spot every day')],
  },
  {
    kind: 'posture', art: 'brass-posture', sources: ['farkas', 'conable'],
    title: L('La postura', 'Posture'),
    intro: L('El instrumento viene a la boca y la espalda queda recta para que el aire salga libre.', 'The instrument comes to the mouth and the back stays straight so the air flows freely.'),
    steps: [
      { t: L('Espalda recta', 'Straight back'), d: L('De pie o sentado en el borde de la silla, la espalda recta y los pies apoyados.', 'Standing or sitting on the edge of the chair, back straight and feet flat.') },
      { t: L('El peso, a la izquierda', 'Weight on the left'), d: L('La mano izquierda sostiene el instrumento; la derecha solo mueve los pistones o la vara, con los dedos curvados.', 'The left hand holds the instrument; the right just moves the valves or slide, with curved fingers.') },
      { t: L('Cabeza recta', 'Head straight'), d: L('Lleva la boquilla a la boca sin bajar la barbilla. La tuba y el bombardino apoyan en las piernas o en un soporte.', 'Bring the mouthpiece to the mouth without dropping the chin. Tuba and euphonium rest on the lap or a stand.') },
    ],
    check: L('Respira hondo con el instrumento en posición: si notas el pecho encogido, endereza la espalda.', 'Take a deep breath with the instrument in position: if your chest feels cramped, straighten your back.'),
    avoid: [L('Apoyarse en el respaldo', 'Leaning on the backrest'), L('Codos pegados al cuerpo', 'Elbows pressed to the body'), L('Inclinar la cabeza hacia el instrumento', 'Tilting the head towards the instrument')],
  },
  BREATH,
];

const HORN_HAND = {
  kind: 'hand', art: 'horn-hand', sources: ['farkasHorn'],
  title: L('La mano derecha en la campana', 'The right hand in the bell'),
  intro: L('En la trompa la mano derecha dentro de la campana cambia el timbre y la afinación: es parte del instrumento.', 'On the horn the right hand inside the bell changes the tone and the tuning: it is part of the instrument.'),
  steps: [
    { t: L('Mano de cuchara', 'Spoon-shaped hand'), d: L('Dedos juntos y rectos, la palma un poco ahuecada, como una cuchara.', 'Fingers together and straight, the palm slightly cupped, like a spoon.') },
    { t: L('Dentro de la campana', 'Inside the bell'), d: L('Apoya el dorso de los dedos en la pared de la campana, a las «tres en punto», sin taparla.', 'Rest the back of the fingers against the bell wall, at "three o\'clock", without blocking it.') },
    { t: L('Afina con la mano', 'Tune with the hand'), d: L('Si cierras más la mano, la nota baja; si la abres, sube. Busca la posición que da un sonido redondo.', 'Closing the hand more lowers the note; opening it raises it. Find the position that gives a round sound.') },
  ],
  check: L('Toca una nota larga y abre y cierra un poco la mano: oirás cambiar el color y la afinación.', 'Play a long note and open and close the hand a little: you will hear the colour and pitch change.'),
  avoid: [L('Mano fuera de la campana: sonido estridente y alto', 'Hand out of the bell: a harsh, sharp sound'), L('Tapar demasiado: sonido apagado y bajo', 'Blocking too much: a muffled, flat sound')],
};

const SLIDE = {
  kind: 'slide', art: 'trombone-slide', sources: ['wick'],
  title: L('Las posiciones de la vara', 'Slide positions'),
  intro: L('El trombón tiene siete posiciones, cada una medio tono más grave. No hay marcas: el oído y el brazo aprenden dónde están.', 'The trombone has seven positions, each a semitone lower. There are no marks: the ear and the arm learn where they are.'),
  steps: [
    { t: L('Sujeta la vara', 'Hold the slide'), d: L('Con el pulgar, el índice y el medio, suelta, como un lápiz. El brazo se mueve desde el codo.', 'With the thumb, index and middle fingers, loosely, like a pencil. The arm moves from the elbow.') },
    { t: L('Referencias', 'Landmarks'), d: L('1.ª cerrada; 3.ª, justo antes de la campana; 4.ª, a la altura del borde de la campana; 6.ª, con el brazo casi estirado.', '1st closed; 3rd, just before the bell; 4th, level with the edge of the bell; 6th, with the arm almost straight.') },
    { t: L('Afina con el oído', 'Tune by ear'), d: L('Toca despacio con el afinador y corrige la vara un poco hacia dentro (sube) o hacia fuera (baja).', 'Play slowly with the tuner and nudge the slide in (sharper) or out (flatter).') },
  ],
  check: L('Cambia entre 1.ª y 4.ª con los ojos cerrados y comprueba en el afinador si llegas.', 'Move between 1st and 4th with your eyes closed and check on the tuner whether you land.'),
  avoid: [L('Mover el hombro en vez del codo', 'Moving the shoulder instead of the elbow'), L('Agarrar la vara con toda la mano', 'Gripping the slide with the whole hand'), L('Cambiar de posición sin parar el aire', 'Changing position with the air stopped')],
};

const VIOLIN = [
  {
    kind: 'posture', art: 'violin-hold', sources: ['galamian', 'suzuki'],
    title: L('Cómo sujetar el violín', 'How to hold the violin'),
    intro: L('El violín se sostiene entre la clavícula y la mandíbula, no con la mano izquierda: así esa mano queda libre para los dedos.', 'The violin is held between the collarbone and the jaw, not with the left hand: that leaves the left hand free for the fingers.'),
    steps: [
      { t: L('En la clavícula', 'On the collarbone'), d: L('Apoya el violín en la clavícula izquierda, con la almohadilla ajustada a tu hombro.', 'Rest the violin on your left collarbone, with the shoulder rest fitted to your shoulder.') },
      { t: L('Peso de la cabeza', 'Weight of the head'), d: L('Deja caer la mandíbula sobre la barbada, sin apretar ni subir el hombro.', 'Let your jaw drop onto the chin rest, without clamping or raising your shoulder.') },
      { t: L('Voluta a la izquierda', 'Scroll to the left'), d: L('El violín apunta hacia la izquierda y un poco hacia arriba; la voluta, a la altura de la nariz.', 'The violin points to the left and slightly upward; the scroll at nose height.') },
    ],
    check: L('Suelta la mano izquierda unos segundos: el violín debe quedarse en su sitio sin esfuerzo.', 'Let go with your left hand for a few seconds: the violin should stay in place without effort.'),
    avoid: [L('Subir el hombro izquierdo', 'Raising the left shoulder'), L('Violín caído hacia el suelo', 'Violin drooping towards the floor'), L('Apretar el cuello con la mandíbula', 'Clamping the neck with the jaw')],
  },
  {
    kind: 'bow', art: 'violin-bow', sources: ['galamian', 'flesch'],
    title: L('El arco', 'The bow'),
    intro: L('Un buen sonido es la suma de tres cosas: el peso del brazo, la velocidad del arco y el punto de contacto.', 'A good sound is the sum of three things: arm weight, bow speed and the contact point.'),
    steps: [
      { t: L('Agarre suelto', 'Loose bow hold'), d: L('Pulgar doblado frente al dedo medio, entre la nuez y el cuero; el meñique curvo sobre la vara.', 'Bent thumb opposite the middle finger, between the frog and the grip; little finger curved on the stick.') },
      { t: L('Paralelo al puente', 'Parallel to the bridge'), d: L('El arco cruza la cuerda recto, a medio camino entre el puente y el diapasón.', 'The bow crosses the string straight, halfway between the bridge and the fingerboard.') },
      { t: L('Una altura por cuerda', 'One level per string'), d: L('Cada cuerda tiene su altura de brazo: Sol con el codo alto, Mi con el codo bajo. Cambia de cuerda moviendo el codo.', 'Each string has its own arm level: G with the elbow high, E with it low. Change string by moving the elbow.') },
    ],
    check: L('Toca notas largas mirando el espejo: el arco no debe resbalar hacia el diapasón.', 'Play long notes watching a mirror: the bow should not slide towards the fingerboard.'),
    avoid: [L('Pulgar rígido y recto', 'A stiff, straight thumb'), L('Arco torcido', 'A crooked bow'), L('Apretar con los dedos en vez de pesar con el brazo', 'Pressing with the fingers instead of using arm weight')],
  },
  {
    kind: 'left-hand', art: 'violin-left', sources: ['galamian', 'suzuki'],
    title: L('La mano izquierda', 'The left hand'),
    intro: L('La afinación depende del marco de la mano: el pulgar y los dedos en su sitio, siempre a la misma distancia.', 'Intonation depends on the hand frame: thumb and fingers in place, always the same distance apart.'),
    steps: [
      { t: L('Muñeca recta', 'Straight wrist'), d: L('La muñeca sigue la línea del brazo, sin apoyarse en el mástil.', 'The wrist follows the line of the arm, without resting on the neck.') },
      { t: L('Pulgar enfrente', 'Thumb opposite'), d: L('El pulgar, suelto, frente al primer o segundo dedo; deja un hueco entre el mástil y la palma.', 'The thumb, loose, opposite the first or second finger; leave a gap between the neck and the palm.') },
      { t: L('Dedos de martillo', 'Hammer fingers'), d: L('Los dedos caen desde arriba con la yema, curvados, y vuelven a su sitio cada vez.', 'The fingers drop from above on the pad, curved, and return to the same spot each time.') },
    ],
    check: L('Comprueba con las cuerdas al aire: el 3.er dedo en la cuerda La es un Re, una octava por encima del Re al aire; si está afinado, la cuerda Re vibra sola.', 'Check against the open strings: 3rd finger on the A string is a D, an octave above open D; when it is in tune, the D string rings in sympathy.'),
    avoid: [L('Palma pegada al mástil', 'Palm stuck to the neck'), L('Dedos planos que tocan otra cuerda', 'Flat fingers touching another string'), L('Pulgar apretando', 'A squeezing thumb')],
  },
];

const GUITAR = [
  {
    kind: 'posture', art: 'guitar-posture', sources: ['carlevaro', 'pujol'],
    title: L('La postura', 'Posture'),
    intro: L('Una guitarra bien colocada se queda en su sitio sola y deja las dos manos libres.', 'A well-placed guitar stays in place on its own and leaves both hands free.'),
    steps: [
      { t: L('Sentado y recto', 'Sitting tall'), d: L('En el borde de la silla, la espalda recta y los dos pies apoyados.', 'On the edge of the chair, back straight and both feet flat.') },
      { t: L('Pierna izquierda alta', 'Left leg raised'), d: L('Sube la pierna izquierda con un reposapiés (o un soporte en la guitarra) para que el mástil suba unos 45 grados.', 'Raise the left leg with a footstool (or a guitar support) so the neck rises to about 45 degrees.') },
      { t: L('Cuatro apoyos', 'Four contact points'), d: L('Pierna izquierda, pierna derecha, pecho y antebrazo derecho. La mano izquierda no sujeta.', 'Left leg, right leg, chest and right forearm. The left hand does not hold it up.') },
    ],
    check: L('Suelta la mano izquierda: la guitarra no debe moverse.', 'Let go with your left hand: the guitar should not move.'),
    avoid: [L('Encorvarse para mirar el diapasón', 'Hunching to look at the fingerboard'), L('Guitarra tumbada en horizontal', 'Guitar lying flat'), L('Hombros subidos', 'Raised shoulders')],
  },
  FRETTING,
  {
    kind: 'right-hand', art: 'guitar-right', sources: ['shearer', 'carlevaro'],
    title: L('La mano derecha', 'The right hand'),
    intro: L('La mano derecha necesita un punto de apoyo y un movimiento pequeño: así encuentra siempre la cuerda.', 'The right hand needs an anchor and a small movement: that way it always finds the string.'),
    steps: [
      { t: L('Sobre la boca', 'Over the soundhole'), d: L('El antebrazo descansa en el borde de la guitarra y la mano cae sobre la boca, con la muñeca un poco arqueada.', 'The forearm rests on the edge of the guitar and the hand falls over the soundhole, wrist slightly arched.') },
      { t: L('Pulgar y dedos', 'Thumb and fingers'), d: L('El pulgar (p) toca las tres cuerdas graves; índice (i) y medio (m) se alternan en las agudas.', 'The thumb (p) plays the three bass strings; index (i) and middle (m) alternate on the treble strings.') },
      { t: L('Pulsa hacia la palma', 'Pluck towards the palm'), d: L('El dedo empuja la cuerda hacia dentro y la suelta, moviéndose desde el nudillo, no desde la punta.', 'The finger pushes the string in and releases it, moving from the knuckle, not the tip.') },
    ],
    check: L('Toca una cuerda al aire alternando i-m: las dos notas deben sonar igual de fuertes.', 'Play an open string alternating i-m: both notes should sound equally loud.'),
    avoid: [L('Muñeca apoyada en la tapa', 'Wrist resting on the top'), L('Tirar de la cuerda hacia fuera', 'Pulling the string outwards'), L('Mano flotando sin apoyo', 'A hand floating with no anchor')],
  },
];

const UKULELE = [
  {
    kind: 'posture', art: 'uke-hold', sources: ['hill'],
    title: L('Cómo sujetar el ukelele', 'How to hold the ukulele'),
    intro: L('El ukelele se sujeta contra el pecho con el antebrazo derecho; la mano izquierda solo pisa.', 'The ukulele is held against the chest with the right forearm; the left hand only frets.'),
    steps: [
      { t: L('Contra el pecho', 'Against the chest'), d: L('Apoya el cuerpo del ukelele en el pecho, un poco por debajo del corazón.', 'Rest the body of the ukulele against your chest, a little below the heart.') },
      { t: L('El antebrazo sujeta', 'The forearm holds it'), d: L('El antebrazo derecho lo aprieta suavemente contra ti. El mástil apunta un poco hacia arriba.', 'The right forearm presses it gently against you. The neck points slightly upward.') },
      { t: L('Rasguea donde acaba el mástil', 'Strum where the neck ends'), d: L('Rasguea donde el mástil se une al cuerpo (hacia el traste 12 en el soprano y el concierto): abajo con la uña del índice y arriba con la yema.', 'Strum where the neck joins the body (around the 12th fret on soprano and concert ukuleles): down with the index fingernail and up with the pad.') },
    ],
    check: L('Suelta la mano izquierda: el ukelele no debe caerse.', 'Let go with your left hand: the ukulele should not fall.'),
    avoid: [L('Sujetar el mástil con la mano izquierda', 'Holding the neck up with the left hand'), L('Rasguear sobre la boca con fuerza', 'Strumming hard over the soundhole'), L('Muñeca rígida', 'A stiff wrist')],
  },
  FRETTING,
  { ...GUITAR[2], sources: ['hill'], art: 'guitar-right', title: L('La mano derecha', 'The right hand'),
    intro: L('En el ukelele el rasgueo sale de la muñeca, suelta como al sacudir agua de la mano.', 'On the ukulele the strum comes from the wrist, loose as when shaking water off your hand.') },
];

const PIANO = [
  {
    kind: 'posture', art: 'piano-posture', sources: ['mark', 'neuhaus'],
    title: L('Sentarse al piano', 'Sitting at the piano'),
    intro: L('La altura y la distancia del banco deciden si el peso del brazo llega a las teclas o se queda en los hombros.', 'The height and distance of the bench decide whether the arm weight reaches the keys or stays in the shoulders.'),
    steps: [
      { t: L('Altura del banco', 'Bench height'), d: L('Los antebrazos quedan más o menos horizontales, a la altura de las teclas.', 'The forearms are roughly level with the keys.') },
      { t: L('Distancia', 'Distance'), d: L('Siéntate en la mitad delantera del banco, con los codos un poco por delante del cuerpo.', 'Sit on the front half of the bench, with the elbows slightly in front of the body.') },
      { t: L('Pies y espalda', 'Feet and back'), d: L('Los pies apoyados (el derecho, cerca del pedal) y la espalda recta, sin rigidez.', 'Feet flat (the right one near the pedal) and the back upright, without stiffness.') },
    ],
    check: L('Deja caer los brazos y súbelos a las teclas: si los hombros se mueven, ajusta la altura del banco.', 'Let your arms hang, then lift them to the keys: if your shoulders move, adjust the bench height.'),
    avoid: [L('Banco demasiado bajo: muñecas caídas', 'Bench too low: drooping wrists'), L('Sentarse muy cerca', 'Sitting too close'), L('Espalda encorvada', 'A hunched back')],
  },
  {
    kind: 'hand', art: 'piano-hand', sources: ['mark', 'neuhaus'],
    title: L('La forma de la mano', 'Hand shape'),
    intro: L('La mano del piano es la que tienes al dejar el brazo colgando: redonda y sin tensión.', 'The piano hand is the one you have when your arm hangs loosely: round and relaxed.'),
    steps: [
      { t: L('Mano natural', 'Natural hand'), d: L('Deja caer el brazo al lado del cuerpo y mira la forma de la mano: esa es la buena.', 'Let your arm hang at your side and look at the shape of your hand: that is the right one.') },
      { t: L('En la yema', 'On the pads'), d: L('Toca con la yema de los dedos curvados; el pulgar, sobre su lado.', 'Play on the pads of curved fingers; the thumb on its side.') },
      { t: L('Cinco dedos, cinco teclas', 'Five fingers, five keys'), d: L('Antes de empezar, coloca cada dedo sobre su tecla y mira la primera nota.', 'Before starting, place each finger over its key and look at the first note.') },
    ],
    check: L('Mientras tocas, la muñeca debe poder moverse arriba y abajo sin esfuerzo.', 'While you play, the wrist should be able to move up and down without effort.'),
    avoid: [L('Dedos planos', 'Flat fingers'), L('Muñeca caída o muy alta', 'A wrist that sags or sits too high'), L('Nudillos hundidos', 'Collapsed knuckles')],
  },
];

const CAJON = [
  {
    kind: 'stroke', art: 'cajon-strokes', sources: ['stone', 'conable'],
    title: L('Los golpes del cajón', 'Cajón strokes'),
    intro: L('El cajón tiene dos sonidos básicos: el grave en el centro y el agudo en el borde de arriba. La mano rebota, nunca se queda pegada.', 'The cajón has two basic sounds: the bass in the centre and the slap at the top edge. The hand bounces, it never sticks.'),
    steps: [
      { t: L('Postura', 'Posture'), d: L('Siéntate encima, hacia el borde delantero, con las piernas abiertas y el cuerpo un poco inclinado.', 'Sit on top, towards the front edge, legs apart and body leaning slightly forward.') },
      { t: L('El grave', 'The bass'), d: L('Golpea con la palma relajada cerca del centro de la tapa y deja que la mano rebote.', 'Hit with a relaxed palm near the centre of the front plate and let the hand bounce off.') },
      { t: L('El agudo', 'The slap'), d: L('Golpea con los dedos juntos en el borde de arriba, cerca de las esquinas.', 'Hit with the fingers together on the top edge, near the corners.') },
    ],
    check: L('Alterna grave y agudo con el metrónomo lento: los dos golpes deben sonar con el mismo volumen.', 'Alternate bass and slap with a slow metronome: both strokes should sound equally loud.'),
    avoid: [L('Dejar la mano pegada a la tapa', 'Leaving the hand stuck to the plate'), L('Golpear con la muñeca rígida', 'Hitting with a stiff wrist'), L('Encorvarse para llegar abajo', 'Hunching to reach down')],
  },
];

const PERCUSSION = [
  {
    kind: 'stroke', art: 'stick-grip', sources: ['stone'],
    title: L('Agarre y rebote', 'Grip and rebound'),
    intro: L('La baqueta rebota sola si la dejas: el golpe es un lanzamiento, no un empujón contra el parche.', 'The stick bounces by itself if you let it: the stroke is a throw, not a push into the head.'),
    steps: [
      { t: L('El punto de apoyo', 'The fulcrum'), d: L('Pinza suave entre el pulgar y el índice, a un tercio del final de la baqueta.', 'A gentle pinch between the thumb and index finger, a third of the way up from the end of the stick.') },
      { t: L('Los otros dedos', 'The other fingers'), d: L('Medio, anular y meñique rodean la baqueta sin apretar.', 'Middle, ring and little fingers wrap around the stick without squeezing.') },
      { t: L('Deja que rebote', 'Let it bounce'), d: L('Lanza la baqueta desde la muñeca y deja que vuelva arriba sola. La caja, a la altura del cinturón.', 'Throw the stick from the wrist and let it come back up by itself. The snare at belt height.') },
    ],
    check: L('Golpes sueltos al metrónomo: la baqueta debe volver a la misma altura cada vez.', 'Single strokes with the metronome: the stick should come back to the same height every time.'),
    avoid: [L('Apretar la baqueta', 'Squeezing the stick'), L('Enterrar el golpe en el parche', 'Burying the stroke into the head'), L('Codos pegados al cuerpo', 'Elbows pressed to the body')],
  },
];

const GROUPS = {
  sax: SAX, 'sax-tenor': SAX, 'sax-bari': SAX, 'sax-soprano': SAX,
  clarinet: CLARINET, 'eb-clarinet': CLARINET, 'bass-clarinet': CLARINET,
  oboe: OBOE, flute: FLUTE, piccolo: FLUTE, recorder: RECORDER,
  trumpet: BRASS, flugelhorn: BRASS, euphonium: BRASS, tuba: BRASS,
  horn: [...BRASS.slice(0, 3), HORN_HAND, BREATH], trombone: [BRASS[0], BRASS[1], SLIDE, BRASS[2], BREATH],
  violin: VIOLIN, guitar: GUITAR, ukulele: UKULELE, piano: PIANO, cajon: CAJON, percussion: PERCUSSION,
};

export const tipsFor = instId => GROUPS[instId] || [];
export const tipOfKind = (instId, kind) => tipsFor(instId).find(t => t.kind === kind) || null;
