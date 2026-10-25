// Recompensas: niveles con nombre de banda, cofres sorpresa, cromos coleccionables y temas de color.

export const LEVELS = [
  { xp: 0, name: 'Educando' }, { xp: 200, name: 'Aprendiz' }, { xp: 600, name: 'Músico' }, { xp: 1500, name: 'Músico de atril' },
  { xp: 3500, name: 'Solista' }, { xp: 7000, name: 'Concertino' }, { xp: 12000, name: 'Maestro' },
];

export function levelFor(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const next = LEVELS[i + 1] || null;
  return { index: i, name: LEVELS[i].name, next, progress: next ? (xp - LEVELS[i].xp) / (next.xp - LEVELS[i].xp) : 1 };
}

export const THEMES = [
  { id: 'barniz', name: 'Barniz', free: true },
  { id: 'banda', name: 'Azul banda' },
  { id: 'bosque', name: 'Verde bosque' },
  { id: 'granate', name: 'Granate' },
  { id: 'oro', name: 'Oro' },
];

export const CARDS = [
  ['Beethoven', 'Compuso la Novena sinfonía cuando ya estaba completamente sordo.'],
  ['Mozart', 'Escribió su primera sinfonía con unos ocho años.'],
  ['Bach', 'Tuvo veinte hijos y varios fueron también compositores.'],
  ['Vivaldi', 'Era sacerdote y le llamaban «el cura rojo» por su pelo.'],
  ['Haydn', 'Se le llama el padre de la sinfonía y del cuarteto de cuerda.'],
  ['Dvořák', 'Compuso la Sinfonía del Nuevo Mundo durante su estancia en Estados Unidos.'],
  ['Tchaikovsky', 'Escribió los ballets El lago de los cisnes y El cascanueces.'],
  ['Sousa', 'Le llamaban «el rey de la marcha»; ayudó a crear el sousafón.'],
  ['Joplin', 'Fue el gran compositor de ragtime; The Entertainer es de 1902.'],
  ['Händel', 'Su Aleluya pertenece al oratorio El Mesías.'],
  ['Violín', 'Sus cuatro cuerdas se afinan en quintas: Sol, Re, La y Mi.'],
  ['Trompeta', 'Los pistones se generalizaron en el siglo XIX; antes la trompeta natural tocaba sobre todo sus armónicos.'],
  ['Clarinete', 'Su registro grave se llama chalumeau, por un instrumento antiguo.'],
  ['Saxofón', 'Lo inventó Adolphe Sax hacia 1840; es de metal pero de la familia de la madera, porque usa caña.'],
  ['Flauta', 'Es de la familia de la madera aunque hoy casi todas son de metal.'],
  ['Oboe', 'La orquesta afina con el La del oboe.'],
  ['Caja', 'La bordonera son los alambres que vibran bajo el parche y le dan su sonido.'],
  ['Bombo', 'En la banda de desfile marca el paso de todos los músicos.'],
  ['Tuba', 'Es el instrumento más grave de la familia del metal.'],
  ['Trombón', 'Cambia de nota con la vara, sin pistones.'],
  ['La 440', 'La frecuencia de referencia La = 440 Hz se adoptó como estándar internacional en 1955.'],
  ['Metrónomo', 'Maelzel lo patentó en 1815 y Beethoven fue de los primeros en usarlo.'],
  ['Pasodoble', 'Es la marcha más típica de las bandas españolas, en compás de 2/4.'],
  ['Afinación justa', 'En un acorde, la tercera mayor afinada «de verdad» es unos 14 cents más baja que en el piano.'],
];

// Cofre sorpresa tras completar la rutina. r: generador aleatorio (0..1)
export function openChest(state, r) {
  const missingCards = CARDS.map((_, i) => i).filter(i => !state.cards.includes(i));
  const lockedThemes = THEMES.filter(t => !t.free && !state.themes.includes(t.id));
  const roll = r();
  if (roll < 0.25 && state.freezes < 2) return { type: 'freeze', text: 'Un protector de racha' };
  if (roll < 0.5 && missingCards.length) {
    const card = missingCards[Math.floor(r() * missingCards.length)];
    return { type: 'card', card, text: `Cromo: ${CARDS[card][0]}` };
  }
  if (roll < 0.62 && lockedThemes.length) {
    const theme = lockedThemes[Math.floor(r() * lockedThemes.length)];
    return { type: 'theme', theme: theme.id, text: `Tema de color: ${theme.name}` };
  }
  const xp = [20, 30, 50][Math.floor(r() * 3)];
  return { type: 'xp', xp, text: `+${xp} puntos` };
}
