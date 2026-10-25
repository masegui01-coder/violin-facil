// Curso de cajón flamenco. Dos sonidos: grave (palma en el centro, abajo en la partitura) y agudo (dedos en el borde,
// arriba). La app distingue los dos por el sonido. Del pulso a la rumba y los tangos (4/4) y después al compás de 12
// de la soleá, las alegrías y las bulerías (acentos en 3, 6, 8, 10 y 12).

const NOTE = { G: 'F4', A: 'C5' };

// «G A . A>» con una duración: G grave, A agudo, «.» silencio, «>» acento
function cells(pattern, dur) {
  return pattern.split(' ').map(t => (t === '.' ? 'R' + dur : NOTE[t[0]] + dur + (t.endsWith('>') ? '>' : ''))).join(' ');
}
const tonesOf = patterns => patterns.join(' ').split(' ').filter(t => t !== '.').map(t => t[0]);
const score = bars => '| ' + bars.join(' | ') + ' |';

const POSTURE = [
  { title: 'Cómo sentarte', text: 'Siéntate encima del cajón, en la mitad de atrás, con las piernas a los lados. Inclínate un poco hacia delante y deja caer las manos sobre la tapa (la cara con el agujero va detrás).' },
  { title: 'El grave', text: 'Palma relajada, golpeando un poco por encima del centro de la tapa. Deja que la mano rebote: así suena hondo, como un bombo. En la partitura va abajo y lleva una G.' },
  { title: 'El agudo', text: 'Las yemas de los dedos, juntos, en el borde de arriba, cerca de la esquina. Suena seco y con chasquido. En la partitura va arriba y lleva una A.' },
  { title: 'Cómo te escucha la app', text: 'La app oye cada golpe y te dice si llega a tiempo y si fue grave o agudo. Pon el móvil cerca, en un sitio sin ruido, y calibra el micrófono en Estudio.' },
];

export function cajonUnits({ theory, exercise, slots }) {
  const C = 'caj-';
  const ex = (id, title, sub, bpm, bars, dur, time = 4) => ({
    ...exercise(C + id, title, sub, { key: 'C', time, bpm, score: score(bars.map(b => cells(b, dur))) }),
    tones: true, sticking: tonesOf(bars),
  });
  const twelve = (id, title, sub, bpm, counts) => ex(id, title, sub, bpm, [counts.slice(0, 3), counts.slice(3, 6), counts.slice(6, 9), counts.slice(9, 12)].map(c => c.join(' ')), 'q', 3);
  const SOLEA = ['G', '.', 'A>', 'G', '.', 'A>', 'G', 'A>', '.', 'A>', '.', 'A>'];
  return [
    { id: C + 'u1', title: 'Los dos sonidos', sub: 'Grave y agudo', color: 'var(--u1)', lessons: [
      theory(C + 'u1-intro', 'Antes de tocar', POSTURE),
      ex('u1-bass', 'Graves', 'Palma en el centro', 70, ['G G G G', 'G G G G', 'G G G G', 'G G G .'], 'q'),
      ex('u1-slap', 'Agudos', 'Dedos en el borde', 70, ['A A A A', 'A A A A', 'A A A A', 'A A A .'], 'q'),
      ex('u1-both', 'Grave y agudo', 'Uno y uno', 70, ['G A G A', 'G A G A', 'G G A A', 'G A G .'], 'q'),
    ] },
    { id: C + 'u2', title: 'Corcheas', sub: 'Tu primer ritmo', color: 'var(--u2)', lessons: [
      theory(C + 'u2-intro', 'Dos golpes por pulso', [{ title: 'Uno-y, dos-y', text: 'Cada pulso se parte en dos. Cuenta en voz alta «uno-y, dos-y…» y mantén las manos sueltas: las corcheas salen del rebote.' }]),
      ex('u2-eighths', 'Corcheas', 'Grave y agudo alternados', 70, ['G A G A G A G A', 'G A G A G A G A', 'G G A A G G A A', 'G A G A G . . .'], 'e'),
      ex('u2-beat', 'El ritmo básico', 'El que suena en mil canciones', 76, ['G . A . G G A .', 'G . A . G G A .', 'G . A . G G A .', 'G . A . G . A .'], 'e'),
    ] },
    { id: C + 'u3', title: 'Rumba', sub: 'El 3-3-2', color: 'var(--u3)', lessons: [
      theory(C + 'u3-intro', 'La rumba', [
        { title: 'Tres, tres y dos', text: 'La rumba flamenca agrupa las ocho corcheas del compás en 3 + 3 + 2. Los graves caen al principio de cada grupo: uno, el «y» del dos y el cuatro.' },
        { title: 'Suelto y alegre', text: 'No aprietes. La rumba se baila: si mueves el cuerpo, el ritmo sale solo.' },
      ]),
      ex('u3-332', 'Rumba básica', '3 + 3 + 2', 84, ['G A A G A A G A', 'G A A G A A G A', 'G A A G A A G A', 'G A A G A A G .'], 'e'),
      ex('u3-groove', 'Rumba con aire', 'Graves y agudos mezclados', 92, ['G . A G . A G A', 'G . A G . A G A', 'G A A G A A G A', 'G . A G . A G .'], 'e'),
    ] },
    { id: C + 'u4', title: 'Tangos', sub: 'El uno en silencio', color: 'var(--u4)', lessons: [
      theory(C + 'u4-intro', 'Por tangos', [
        { title: 'Un compás de cuatro', text: 'Los tangos flamencos van en cuatro tiempos, pero el uno muchas veces no se toca: se siente. Cuenta «(uno) dos, tres, cuatro» y deja ese hueco.' },
      ]),
      ex('u4-basic', 'Tangos básicos', 'El uno se siente', 80, ['. A G A', '. A G A', '. A G A', '. A G A'], 'q'),
      ex('u4-eighths', 'Tangos con corcheas', 'Rellenando', 84, ['. G A . G G A .', '. G A . G G A .', '. G A G G G A .', '. G A . G . A .'], 'e'),
      ex('u4-accents', 'Tangos con acentos', 'Marca el cuatro', 88, ['. A G A>', '. A G A>', '. A G A>', '. A G A>'], 'q'),
    ] },
    { id: C + 'u5', title: 'El compás de 12', sub: 'La base del flamenco', color: 'var(--u5)', lessons: [
      theory(C + 'u5-intro', 'Contar hasta 12', [
        { title: 'Doce tiempos', text: 'La soleá, las alegrías y las bulerías cuentan doce tiempos. Los fuertes son el 3, el 6, el 8, el 10 y el 12. Dilo en voz alta: «uno, dos, TRES, cuatro, cinco, SEIS, siete, OCHO, nueve, DIEZ, once, DOCE».' },
        { title: 'En la partitura', text: 'Lo escribimos en cuatro compases de tres tiempos. Los acentos (>) son los agudos fuertes; los demás, graves suaves.' },
      ]),
      twelve('u5-count', 'Contar 12', 'Graves con acentos agudos', 84, ['G', 'G', 'A>', 'G', 'G', 'A>', 'G', 'A>', 'G', 'A>', 'G', 'A>']),
      twelve('u5-twice', 'Los acentos solos', 'Silencio donde no hay acento', 84, ['.', '.', 'A>', '.', '.', 'A>', '.', 'A>', '.', 'A>', '.', 'A>']),
    ] },
    { id: C + 'u6', title: 'Soleá', sub: 'Despacio y con peso', color: 'var(--u6)', lessons: [
      theory(C + 'u6-intro', 'La soleá', [{ title: 'La madre del compás', text: 'La soleá es lenta y solemne. Cada acento pesa. Toca el grave con la palma bien suelta y deja respirar los silencios.' }]),
      twelve('u6-base', 'Soleá', 'Compás de 12, lento', 76, SOLEA),
      twelve('u6-full', 'Soleá con graves', 'Rellena los huecos', 80, ['G', 'G', 'A>', 'G', 'G', 'A>', 'G', 'A>', 'G', 'A>', 'G', 'A>']),
    ] },
    { id: C + 'u7', title: 'Alegrías', sub: 'El 12 con alegría', color: 'var(--u7)', lessons: [
      theory(C + 'u7-intro', 'Las alegrías', [{ title: 'Mismo compás, otro carácter', text: 'Las alegrías usan el mismo compás de 12 que la soleá, pero más vivo y luminoso. Llega con las manos sueltas a cada acento.' }]),
      twelve('u7-base', 'Alegrías', 'Más rápido', 104, SOLEA),
      ex('u7-eighths', 'Alegrías con corcheas', 'Graves en corcheas, acentos agudos', 96, ['G G G G A> .', 'G G G G A> .', 'G G A> . G G', 'A> . G G A> .'], 'e', 3),
    ] },
    { id: C + 'u8', title: 'Bulerías', sub: 'Desde el 12', color: 'var(--u8)', lessons: [
      theory(C + 'u8-intro', 'Las bulerías', [
        { title: 'Se empieza en el 12', text: 'Las bulerías se cuentan empezando por el 12: «DOCE, uno, dos, TRES, cuatro, cinco, SEIS, siete, OCHO, nueve, DIEZ, once». Es el palo más rápido y juguetón.' },
        { title: 'Escucha mucho', text: 'Pon bulerías de tus artistas favoritos y cuenta el compás en voz alta mientras suenan. Cuando lo sientas, tócalo encima.' },
      ]),
      twelve('u8-base', 'Bulerías desde el 12', 'Despacio primero', 110, ['A>', 'G', '.', 'A>', 'G', '.', 'A>', 'G', 'A>', '.', 'A>', '.']),
      twelve('u8-full', 'Bulerías con graves', 'Rellena con la palma', 110, ['A>', 'G', 'G', 'A>', 'G', 'G', 'A>', 'G', 'A>', 'G', 'A>', 'G']),
    ] },
  ];
}
