// Curso de percusión (caja, bombo y platos): pulso, figuras, silencios, rudimentos, acentos y ritmos de banda.
// Todo en una sola línea (C5). D = mano derecha, I = mano izquierda.

const bar = (...cells) => '| ' + cells.join(' | ') + ' |';
const repeat = (cell, n) => Array(n).fill(cell);
const hands = (pattern, n) => Array.from({ length: n }, (_, i) => pattern[i % pattern.length]);

const GRIP = [
  { title: 'Las baquetas', text: 'Sujeta cada baqueta a un tercio del final, entre el pulgar y la segunda falange del índice. El resto de dedos la rodean sin apretar: la baqueta tiene que poder rebotar.' },
  { title: 'Golpe y rebote', text: 'Deja caer la baqueta desde unos 10 cm y deja que rebote sola hacia arriba. El sonido sale de la caída, no de empujar. Muñeca suelta y hombros relajados.' },
  { title: 'Cómo te escucha la app', text: 'Practica en la caja, en un pad o en una mesa. La app no oye notas: detecta cada golpe y te dice si llega a tiempo, antes o después. Calibra el micrófono una vez en Estudio.' },
];

export function percUnits({ theory, exercise, slots }) {
  const ex = (id, title, sub, bpm, score, sticking, time = 4) => ({ ...exercise(id, title, sub, { key: 'C', time, bpm, score }), sticking: sticking.split(' ') });
  const P = 'perc-';
  return [
    { id: P + 'u1', title: 'El pulso', sub: 'Negras, blancas y redondas', color: 'var(--u1)', lessons: [
      theory(P + 'u1-intro', 'Antes de empezar', GRIP),
      ex(P + 'u1-quarters', 'Negras', 'Un golpe por pulso', 60, bar(...repeat('C5q C5q C5q C5q', 4)), hands('DI', 16).join(' ')),
      ex(P + 'u1-halves', 'Blancas y negras', 'Cuenta los pulsos largos', 60, bar('C5h C5h', 'C5q C5q C5h', 'C5h C5q C5q', 'C5w'), 'D I D I D I D I D'),
      ex(P + 'u1-mix', 'Redondas y negras', 'Cuatro pulsos sin tocar', 66, bar('C5w', 'C5q C5q C5q C5q', 'C5w', 'C5q C5q C5h'), 'D D I D I D D I D'),
    ] },
    { id: P + 'u2', title: 'Corcheas', sub: 'Dos golpes por pulso', color: 'var(--u2)', lessons: [
      theory(P + 'u2-intro', 'Las corcheas', [{ title: 'Uno-y, dos-y', text: 'Cada pulso se divide en dos: cuenta «uno-y, dos-y…». Alterna las manos (D I D I) y deja que caigan a la misma altura para que suenen igual.' }]),
      ex(P + 'u2-eighths', 'Corcheas alternadas', 'D I D I', 60, bar(...repeat('C5e C5e C5e C5e C5e C5e C5e C5e', 2), 'C5e C5e C5e C5e C5q C5q', 'C5w'), hands('DI', 23).join(' ')),
      ex(P + 'u2-mix', 'Negras y corcheas', 'Mezclar figuras', 66, bar('C5q C5e C5e C5q C5e C5e', 'C5e C5e C5q C5e C5e C5q', 'C5q C5q C5e C5e C5e C5e', 'C5h C5h'), 'D D I D D I D I D D I D D I D I D I D I'),
    ] },
    { id: P + 'u3', title: 'Silencios', sub: 'Saber cuándo no tocar', color: 'var(--u3)', lessons: [
      theory(P + 'u3-intro', 'Los silencios', [{ title: 'El silencio también se cuenta', text: 'Durante un silencio sigue contando y mueve la baqueta en el aire sin tocar: así no pierdes el pulso.' }]),
      ex(P + 'u3-rests', 'Silencios de negra', 'Cuenta en el aire', 66, bar('C5q Rq C5q Rq', 'Rq C5q Rq C5q', 'C5q C5q Rq C5q', 'C5h Rh'), 'D D I D D I D D'),
      ex(P + 'u3-eighth-rests', 'Contratiempo', 'Golpe en la «y»', 60, bar('Re C5e Re C5e Re C5e Re C5e', 'Re C5e Re C5e C5q C5q', 'Re C5e Re C5e Re C5e Re C5e', 'C5h Rh'), 'I I I I I I D I I I I I D'),
    ] },
    { id: P + 'u4', title: 'Semicorcheas', sub: 'Cuatro golpes por pulso', color: 'var(--u4)', lessons: [
      theory(P + 'u4-intro', 'Las semicorcheas', [{ title: 'Uno-e-y-a', text: 'Cada pulso se divide en cuatro: «uno-e-y-a». Empieza despacio (al 50 %) y no aceleres: la regularidad es más importante que la velocidad.' }]),
      ex(P + 'u4-sixteenths', 'Semicorcheas', 'D I D I', 56, bar(...repeat('C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s C5s', 2), 'C5s C5s C5s C5s C5q C5s C5s C5s C5s C5q', 'C5w'), [...hands('DI', 32), ...'D I D I D D I D I D'.split(' '), 'D'].join(' ')),
      ex(P + 'u4-combos', 'Corchea y dos semicorcheas', 'Galope', 60, bar('C5e C5s C5s C5e C5s C5s C5e C5s C5s C5e C5s C5s', 'C5s C5s C5e C5s C5s C5e C5s C5s C5e C5s C5s C5e', 'C5e C5s C5s C5e C5s C5s C5q C5q', 'C5w'), 'D D I D D I D D I D D I D I D D I D D I D D I D D D I D D I D I D'),
    ] },
    { id: P + 'u5', title: 'Rudimentos', sub: 'La técnica básica de caja', color: 'var(--u5)', lessons: [
      theory(P + 'u5-intro', 'Los rudimentos', [{ title: 'El abecedario del percusionista', text: 'Los rudimentos son combinaciones de manos que aparecen en todas las marchas: golpes simples (D I D I), dobles (D D I I) y paradiddle (D I D D I D I I). Mira las letras debajo de cada nota.' }]),
      ex(P + 'u5-singles', 'Golpes simples', 'D I D I', 60, bar(...repeat('C5e C5e C5e C5e C5e C5e C5e C5e', 3), 'C5w'), hands('DI', 25).join(' ')),
      ex(P + 'u5-doubles', 'Golpes dobles', 'D D I I', 56, bar(...repeat('C5e C5e C5e C5e C5e C5e C5e C5e', 3), 'C5w'), hands(['D', 'D', 'I', 'I'], 25).join(' ')),
      ex(P + 'u5-paradiddle', 'Paradiddle', 'D I D D · I D I I', 56, bar(...repeat('C5e> C5e C5e C5e C5e> C5e C5e C5e', 3), 'C5w'), hands(['D', 'I', 'D', 'D', 'I', 'D', 'I', 'I'], 25).join(' ')),
    ] },
    { id: P + 'u6', title: 'Acentos', sub: 'Golpes fuertes y suaves', color: 'var(--u6)', lessons: [
      theory(P + 'u6-intro', 'Los acentos', [{ title: 'Fuerte y suave', text: 'Una nota con «>» se toca más fuerte, levantando más la baqueta. Las demás, bajas y suaves. La app compara la fuerza de tus golpes acentuados con la del resto.' }]),
      ex(P + 'u6-first', 'Acento en la parte fuerte', 'El primero de cada grupo', 60, bar(...repeat('C5e> C5e C5e C5e C5e> C5e C5e C5e', 3), 'C5w>'), hands('DI', 25).join(' ')),
      ex(P + 'u6-moving', 'Acentos que se mueven', 'Uno de cada cuatro semicorcheas', 52, bar('C5s> C5s C5s C5s C5s C5s> C5s C5s C5s C5s C5s> C5s C5s C5s C5s C5s>', 'C5s> C5s C5s C5s C5s C5s> C5s C5s C5s C5s C5s> C5s C5s C5s C5s C5s>', 'C5w'), hands('DI', 33).join(' ')),
    ] },
    { id: P + 'u7', title: 'Ritmos de banda', sub: 'Marcha, pasodoble y vals', color: 'var(--u7)', lessons: [
      theory(P + 'u7-intro', 'Tocar en la banda', [{ title: 'El motor de la banda', text: 'La percusión lleva el tempo de toda la banda. En la marcha y el pasodoble (2/4) el pulso no se puede mover; en el vals (3/4), el bombo marca el primer tiempo y la caja el segundo y el tercero.' }]),
      ex(P + 'u7-march', 'Marcha', '2/4 con puntillo', 76, bar('C5e. C5s C5e. C5s', 'C5e C5e C5q', 'C5e. C5s C5e. C5s', 'C5e C5e C5q', 'C5s C5s C5s C5s C5e C5e', 'C5q> Rq'), 'D I D I D I D D I D I D I D D I D I D I D', 2),
      ex(P + 'u7-pasodoble', 'Pasodoble', '2/4 vivo', 88, bar('C5e> C5e C5e> C5e', 'C5e> C5s C5s C5e> C5e', 'C5e> C5e C5e> C5e', 'C5e> C5s C5s C5q>', 'C5s C5s C5s C5s C5s C5s C5s C5s', 'C5q> Rq'), 'D I D I D D I D I D I D I D D I D D I D I D I D I D', 2),
      ex(P + 'u7-waltz', 'Vals', '3/4: um-pa-pa', 120, bar(...repeat('C5q> C5q C5q', 7), 'C5h.'), hands(['D', 'I', 'I'], 22).join(' '), 3),
      slots(2, 1),
    ] },
    { id: P + 'u8', title: 'Tu música', sub: 'El ritmo de tus canciones', color: 'var(--u8)', lessons: [
      theory(P + 'u8-intro', 'El ritmo de las canciones', [{ title: 'Toca la melodía con la caja', text: 'Cada canción de la biblioteca se puede practicar como ritmo: tocas un golpe por cada nota. Es la mejor forma de aprender a leer cualquier partitura.' }]),
      slots(3, 2),
    ] },
  ];
}
