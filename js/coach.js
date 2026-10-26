// Consejos personalizados: busca en lo que has tocado los patrones típicos de un fallo de técnica
// (agudas que suben al apretar, octavas que se escapan, armónicos equivocados, dedos fuera de sitio…)
// y los convierte en un consejo con su explicación. Sin DOM ni red: recibe los datos y devuelve la lista.
import { L } from './tips-l10n.js';

export const MIN_SAMPLES = 20; // lecturas de afinación + notas intentadas antes de opinar
const MIN_NOTES = 4; // notas con datos en un registro para fiarse de su media
const MIN_SLIPS = 3; // tropiezos iguales antes de verlo como costumbre
const MAX_TIPS = 3;
const LONGTONES_KEPT = 8;

// Tipo de técnica de cada instrumento (decide qué fallos tienen sentido)
const KIND_BY_ID = {
  sax: 'reed', 'sax-tenor': 'reed', 'sax-bari': 'reed', 'sax-soprano': 'reed',
  clarinet: 'clarinet', 'eb-clarinet': 'clarinet', 'bass-clarinet': 'clarinet', oboe: 'reed',
  flute: 'flute', piccolo: 'flute', recorder: 'recorder',
  trumpet: 'brass', flugelhorn: 'brass', horn: 'brass', euphonium: 'brass', tuba: 'brass', trombone: 'trombone',
  violin: 'bowed', cello: 'bowed', guitar: 'fretted', ukulele: 'fretted', piano: 'keys', cajon: 'perc', percussion: 'perc',
};
export const techniqueKind = inst => KIND_BY_ID[inst.id] || 'reed';
const WINDS = ['reed', 'clarinet', 'flute', 'recorder', 'brass', 'trombone'];
const isWind = kind => WINDS.includes(kind);

// Registro de una nota escrita dentro de la tesitura del instrumento: tercio grave, medio o agudo
export function registerOf(midi, inst) {
  const [lo, hi] = inst.written;
  const third = (hi - lo) / 3;
  return midi < lo + third ? 'low' : midi >= hi - third ? 'high' : 'mid';
}

// ---------- Datos que se van guardando (funciones puras: devuelven el registro nuevo) ----------
export const emptyCoach = () => ({ notes: { low: 0, mid: 0, high: 0 }, slips: {}, longtones: [] });

// notes: notas escritas intentadas; slips: [{midi, off}] con off = semitonos entre lo que sonó y lo que tocaba
export function addAttempts(coach = emptyCoach(), inst, { notes = [], slips = [] }) {
  const next = { ...emptyCoach(), ...coach, notes: { ...emptyCoach().notes, ...(coach.notes || {}) }, slips: { ...(coach.slips || {}) } };
  notes.forEach(midi => { next.notes[registerOf(midi, inst)]++; });
  slips.filter(s => s.off).forEach(s => {
    const key = `${registerOf(s.midi, inst)}:${s.off > 0 ? '+' : ''}${s.off}`;
    next.slips[key] = (next.slips[key] || 0) + 1;
  });
  return next;
}

export function addLongtone(coach = emptyCoach(), r) {
  if (!r) return coach;
  const take = { mean: r.mean, stability: r.stability, centsPer10dB: r.centsPer10dB, dynamicRange: r.dynamicRange };
  return { ...emptyCoach(), ...coach, longtones: [...(coach.longtones || []), take].slice(-LONGTONES_KEPT) };
}

// ---------- Estadísticas ----------
const round = v => Math.round(v);

export function coachStats(inst, tuning = {}, coach = emptyCoach()) {
  const regs = { low: { n: 0, sum: 0, notes: 0, spreads: [] }, mid: { n: 0, sum: 0, notes: 0, spreads: [] }, high: { n: 0, sum: 0, notes: 0, spreads: [] } };
  let samples = 0;
  Object.entries(tuning).forEach(([midi, e]) => {
    if (!e || !e.n) return;
    const r = regs[registerOf(Number(midi), inst)];
    r.n += e.n; r.sum += e.sum; r.notes++;
    samples += e.n;
    if (e.n > 1) {
      const m = e.sum / e.n;
      r.spreads.push(Math.sqrt(Math.max(0, (e.sumSq - e.n * m * m) / (e.n - 1))));
    }
  });
  const reg = Object.fromEntries(Object.entries(regs).map(([k, r]) => [k, {
    mean: r.n ? r.sum / r.n : 0, n: r.n, notes: r.notes,
    spread: r.spreads.length ? r.spreads.reduce((a, b) => a + b, 0) / r.spreads.length : 0, spreadNotes: r.spreads.length,
    attempts: (coach.notes || {})[k] || 0,
  }]));
  const total = reg.low.n + reg.mid.n + reg.high.n;
  const allSpreads = Object.values(regs).flatMap(r => r.spreads);
  const attempts = reg.low.attempts + reg.mid.attempts + reg.high.attempts;
  return {
    reg, samples: samples + attempts, attempts,
    mean: total ? (regs.low.sum + regs.mid.sum + regs.high.sum) / total : 0,
    spread: allSpreads.length ? allSpreads.reduce((a, b) => a + b, 0) / allSpreads.length : 0, spreadNotes: allSpreads.length,
    slips: coach.slips || {}, longtones: coach.longtones || [],
  };
}

// Tropiezos de un registro (o de todos) cuyo salto cumple la condición
export function slipsWhere(stats, test, register = null) {
  return Object.entries(stats.slips).reduce((sum, [key, count]) => {
    const [reg, off] = key.split(':');
    return (!register || reg === register) && test(Number(off)) ? sum + count : sum;
  }, 0);
}

const attemptsIn = (stats, register) => (register ? stats.reg[register].attempts : stats.attempts);
const rate = (count, attempts) => (attempts ? count / attempts : 0);
const cents = v => `${v >= 0 ? '+' : ''}${round(v)} ¢`;
const pct = v => `${round(v * 100)} %`;

// ---------- Reglas: cada una mira un patrón y explica qué técnica suele estar detrás ----------
const REG = { low: L('Graves', 'Low notes'), mid: L('Medias', 'Middle notes'), high: L('Agudas', 'High notes') };
const ev = (label, value) => ({ label, value });

// Texto según el tipo de instrumento (si no hay uno propio, el de «default»)
const pick = (map, kind) => map[kind] || map.default;

const RULES = [
  {
    id: 'pinch-high', kinds: [...WINDS],
    test: s => s.reg.high.notes >= MIN_NOTES && s.reg.high.mean >= 12 && s.reg.high.mean - s.reg.low.mean >= 8,
    weight: s => s.reg.high.mean - s.reg.low.mean,
    tip: k => (k === 'recorder' ? 'breath' : 'embouchure'),
    title: L('Las agudas te salen altas', 'Your high notes come out sharp'),
    why: k => pick({
      default: L('Al subir, la afinación sube más que en las graves. Es la señal típica de apretar o morder la boquilla para que salgan las agudas.', 'As you go up, the pitch rises more than in the low notes. That is the classic sign of pinching or biting the mouthpiece to get the high notes out.'),
      flute: L('Al subir, la afinación sube más que en las graves. Suele pasar al soplar más fuerte en vez de hacer el aire más rápido y estrecho.', 'As you go up, the pitch rises more than in the low notes. It usually happens when you blow harder instead of making the air faster and narrower.'),
      brass: L('Al subir, la afinación sube más que en las graves. Suele ser apretar la boquilla contra los labios para llegar arriba.', 'As you go up, the pitch rises more than in the low notes. It is usually pressing the mouthpiece against the lips to reach the top.'),
      trombone: L('Al subir, la afinación sube más que en las graves. Suele ser apretar la boquilla contra los labios para llegar arriba.', 'As you go up, the pitch rises more than in the low notes. It is usually pressing the mouthpiece against the lips to reach the top.'),
      recorder: L('Al subir, la afinación sube más que en las graves: estás soplando demasiado fuerte en las agudas.', 'As you go up, the pitch rises more than in the low notes: you are blowing too hard on the high notes.'),
    }, k),
    action: k => pick({
      default: L('Deja la mandíbula quieta en las agudas y sube con el aire, no con los labios. Repasa el cojín del labio de abajo.', 'Keep your jaw still on the high notes and go up with the air, not the lips. Review the lower lip cushion.'),
      flute: L('Haz la abertura de los labios más pequeña y adelanta un poco el labio de arriba en vez de soplar más.', 'Make the lip opening smaller and bring the top lip slightly forward instead of blowing harder.'),
      brass: L('Toca las agudas con la mitad de presión: si no salen, pide más velocidad de aire (sílaba «i»), no más fuerza contra la boquilla.', 'Play the high notes with half the pressure: if they do not come out, ask for faster air (the syllable "ee"), not more force on the mouthpiece.'),
      trombone: L('Toca las agudas con la mitad de presión: si no salen, pide más velocidad de aire (sílaba «i»), no más fuerza contra la boquilla.', 'Play the high notes with half the pressure: if they do not come out, ask for faster air (the syllable "ee"), not more force on the mouthpiece.'),
      recorder: L('Sopla como si dijeras «du» suave también arriba: el pulgar de atrás entreabierto hace el trabajo, no el aire.', 'Blow as if saying a soft "doo" up high too: the half-open back thumb does the work, not the air.'),
    }, k),
    evidence: s => [ev(REG.high, cents(s.reg.high.mean)), ev(REG.low, cents(s.reg.low.mean))],
  },
  {
    id: 'flat-high', kinds: [...WINDS],
    test: s => s.reg.high.notes >= MIN_NOTES && s.reg.high.mean <= -12 && s.reg.high.mean - s.reg.low.mean <= -8,
    weight: s => s.reg.low.mean - s.reg.high.mean,
    tip: () => 'breath',
    title: L('Las agudas se te quedan bajas', 'Your high notes stay flat'),
    why: () => L('Las agudas bajan respecto a las graves. Suele ser falta de apoyo: el aire llega lento o se cae al final de la frase.', 'The high notes drop compared with the low ones. It is usually a lack of support: the air arrives slowly or sags at the end of the phrase.'),
    action: () => L('Antes de una aguda, respira bajo (barriga y costados) y sopla un aire más rápido, como para empujar una vela sin apagarla.', 'Before a high note, breathe low (belly and sides) and blow faster air, as if bending a candle flame without putting it out.'),
    evidence: s => [ev(REG.high, cents(s.reg.high.mean)), ev(REG.low, cents(s.reg.low.mean))],
  },
  {
    id: 'octave-up-low', kinds: ['reed', 'clarinet', 'flute', 'recorder'],
    count: (s, k) => slipsWhere(s, off => off === 12 || (k === 'clarinet' && off === 19), 'low'),
    test: (s, k) => { const c = RULES_BY_ID['octave-up-low'].count(s, k); return c >= MIN_SLIPS && rate(c, attemptsIn(s, 'low')) >= 0.12; },
    weight: (s, k) => 100 * rate(RULES_BY_ID['octave-up-low'].count(s, k), attemptsIn(s, 'low')),
    tip: k => (k === 'recorder' ? 'holes' : 'embouchure'),
    title: L('En las graves se te escapa la nota de arriba', 'Low notes jump up to the upper note'),
    why: k => pick({
      default: L('Varias veces, en las notas graves, ha sonado la octava de arriba. Pasa al apretar demasiado los labios o al meter poca boquilla.', 'Several times the upper octave sounded on low notes. It happens when the lips squeeze too much or too little mouthpiece is in the mouth.'),
      clarinet: L('Varias veces, en las notas graves, ha sonado una nota de arriba o un chirrido. Suele ser un agujero mal tapado o morder la caña.', 'Several times a higher note or a squeak sounded on low notes. It is usually a hole not fully covered or biting the reed.'),
      flute: L('Varias veces, en las notas graves, ha sonado la octava de arriba: el aire va demasiado rápido o la abertura es muy pequeña.', 'Several times the upper octave sounded on low notes: the air is too fast or the opening is too small.'),
      recorder: L('Varias veces, en las notas graves, ha sonado la octava de arriba: algún agujero no queda bien tapado o soplas demasiado.', 'Several times the upper octave sounded on low notes: a hole is not fully covered or you blow too hard.'),
    }, k),
    action: k => pick({
      default: L('En las graves, baja la mandíbula, abre la garganta como al decir «o» y suelta presión del labio sin perder el cojín.', 'On low notes, drop the jaw, open the throat as when saying "oh" and release lip pressure without losing the cushion.'),
      clarinet: L('Tapa los agujeros con la yema plana (no la punta) y comprueba en el espejo que la barbilla sigue estirada, sin morder.', 'Cover the holes with the flat pad of the finger (not the tip) and check in a mirror that the chin stays flat, without biting.'),
      flute: L('En las graves, agranda un poco la abertura, dirige el aire más hacia abajo y sopla más lento y cálido.', 'On low notes, open the aperture a little, aim the air lower and blow slower, warmer air.'),
      recorder: L('Comprueba que cada dedo tapa con la yema entera (te tiene que quedar la marca del agujero) y sopla «du» más suave.', 'Check each finger covers with the whole pad (it should leave a ring mark) and blow a softer "doo".'),
    }, k),
    evidence: (s, k) => [ev(L('Saltos de octava en graves', 'Octave jumps on low notes'), String(RULES_BY_ID['octave-up-low'].count(s, k))), ev(L('Notas graves', 'Low notes'), String(attemptsIn(s, 'low')))],
  },
  {
    id: 'partials', kinds: ['brass', 'trombone'],
    count: s => slipsWhere(s, off => Math.abs(off) >= 3 && Math.abs(off) <= 12),
    test: s => { const c = RULES_BY_ID.partials.count(s); return c >= MIN_SLIPS && rate(c, s.attempts) >= 0.12; },
    weight: s => 100 * rate(RULES_BY_ID.partials.count(s), s.attempts),
    tip: () => 'buzz',
    title: L('Se te va a otro armónico', 'You land on the wrong partial'),
    why: () => L('Con la misma posición salen varias notas (armónicos). Cuando suena otra a 3, 4, 5 o más semitonos, el oído y la vibración de los labios no iban a la nota buena.', 'Several notes come out of the same position (partials). When another one 3, 4, 5 or more semitones away sounds, your ear and lip buzz were not aiming at the right note.'),
    action: () => L('Canta la nota antes de tocarla y haz el buzz con la boquilla sola hasta que salga a la primera; luego vuelve al instrumento.', 'Sing the note before playing it and buzz it on the mouthpiece alone until it comes out first time; then go back to the instrument.'),
    evidence: s => [ev(L('Saltos a otro armónico', 'Jumps to another partial'), String(RULES_BY_ID.partials.count(s))), ev(L('Notas intentadas', 'Notes attempted'), String(s.attempts))],
  },
  {
    id: 'slide', kinds: ['trombone'],
    count: s => slipsWhere(s, off => Math.abs(off) <= 2),
    test: s => { const c = RULES_BY_ID.slide.count(s); return c >= MIN_SLIPS && rate(c, s.attempts) >= 0.12; },
    weight: s => 100 * rate(RULES_BY_ID.slide.count(s), s.attempts),
    tip: () => 'slide',
    title: L('La vara no llega a su posición', 'The slide misses its position'),
    why: () => L('Muchas notas te salen a uno o dos semitonos: la vara se queda corta o se pasa de la posición.', 'Many notes come out one or two semitones off: the slide stops short of or past the position.'),
    action: () => L('Practica las posiciones despacio con el afinador: mueve la vara desde la muñeca y el codo, sin mover el hombro.', 'Practise the positions slowly with the tuner: move the slide from the wrist and elbow, not the shoulder.'),
    evidence: s => [ev(L('Notas a 1-2 semitonos', 'Notes 1-2 semitones off'), String(RULES_BY_ID.slide.count(s)))],
  },
  {
    id: 'finger-place', kinds: ['bowed'],
    count: s => slipsWhere(s, off => Math.abs(off) <= 2),
    test: s => { const c = RULES_BY_ID['finger-place'].count(s); return (c >= MIN_SLIPS && rate(c, s.attempts) >= 0.12) || (s.reg.high.notes >= MIN_NOTES && Math.abs(s.reg.high.mean) >= 15); },
    weight: s => Math.max(100 * rate(RULES_BY_ID['finger-place'].count(s), s.attempts), Math.abs(s.reg.high.mean)),
    tip: () => 'left-hand',
    title: L('Los dedos caen fuera de su sitio', 'Your fingers land out of place'),
    why: () => L('Muchas notas salen a un semitono de la buena, o las agudas se desafinan: la mano izquierda no mantiene el marco entre los dedos.', 'Many notes come out a semitone away, or the high notes go out of tune: the left hand is not keeping its frame between the fingers.'),
    action: () => L('Coloca los dedos como un bloque, con el pulgar detrás y suelto, y compara con las cuerdas al aire: la nota pisada que coincide con otra cuerda al aire (por ejemplo, el Re en la cuerda La) la hace vibrar sola si está afinada.', 'Place the fingers as a block, with the thumb loose behind, and check against the open strings: a stopped note that matches another open string (for example the D on the A string) makes it ring in sympathy when it is in tune.'),
    evidence: s => [ev(L('Notas a 1-2 semitonos', 'Notes 1-2 semitones off'), String(RULES_BY_ID['finger-place'].count(s))), ev(REG.high, cents(s.reg.high.mean))],
  },
  {
    id: 'wrong-string', kinds: ['bowed', 'fretted'],
    count: s => slipsWhere(s, off => [5, 7].includes(Math.abs(off))),
    test: s => { const c = RULES_BY_ID['wrong-string'].count(s); return c >= MIN_SLIPS && rate(c, s.attempts) >= 0.1; },
    weight: s => 100 * rate(RULES_BY_ID['wrong-string'].count(s), s.attempts),
    tip: k => (k === 'bowed' ? 'bow' : 'right-hand'),
    title: L('Suena la cuerda de al lado', 'The next string sounds'),
    why: k => pick({
      default: L('Varias notas han salido a una cuarta o una quinta: justo la distancia entre cuerdas. Estás tocando la cuerda vecina.', 'Several notes came out a fourth or a fifth away: exactly the distance between strings. You are playing the neighbouring string.'),
    }, k),
    action: k => pick({
      bowed: L('Cada cuerda tiene su altura de brazo: cambia de cuerda moviendo el codo antes de que llegue la nota, no solo la muñeca.', 'Each string has its own arm height: change string by moving the elbow before the note arrives, not just the wrist.'),
      default: L('Apoya la mano derecha (el pulgar o la palma) para tener una referencia, y mira la cuerda las primeras veces.', 'Anchor your right hand (thumb or palm) so you have a reference point, and look at the string the first few times.'),
    }, k),
    evidence: s => [ev(L('Saltos de cuerda', 'String jumps'), String(RULES_BY_ID['wrong-string'].count(s)))],
  },
  {
    id: 'press-sharp', kinds: ['fretted'],
    test: s => s.reg.low.n + s.reg.mid.n + s.reg.high.n >= 12 && s.mean >= 10,
    weight: s => s.mean,
    tip: () => 'fretting',
    title: L('Las notas te suben al pisar', 'Notes go sharp when you fret'),
    why: () => L('Casi todo te sale alto. En instrumentos con trastes suele ser apretar demasiado o empujar la cuerda hacia un lado.', 'Almost everything comes out sharp. On fretted instruments it is usually pressing too hard or pushing the string sideways.'),
    action: () => L('Pisa justo detrás del traste con la fuerza mínima para que no trastee, y sin estirar la cuerda. Afina antes de empezar.', 'Press just behind the fret with the least force that stops it buzzing, without bending the string. Tune before you start.'),
    evidence: s => [ev(L('Media', 'Average'), cents(s.mean))],
  },
  {
    id: 'unstable', kinds: [...WINDS, 'bowed', 'fretted'],
    test: s => s.spreadNotes >= MIN_NOTES && s.spread >= 15,
    weight: s => s.spread,
    tip: k => (k === 'bowed' ? 'bow' : k === 'fretted' ? 'fretting' : 'breath'),
    title: L('La afinación de cada nota se mueve mucho', 'The tuning of each note moves around a lot'),
    why: k => pick({
      default: L('La misma nota te sale unas veces alta y otras baja. Suele ser un aire que no llega constante.', 'The same note comes out sometimes sharp and sometimes flat. It is usually air that is not steady.'),
      bowed: L('La misma nota te sale unas veces alta y otras baja: los dedos no caen siempre igual o el arco aprieta de más.', 'The same note comes out sometimes sharp and sometimes flat: the fingers do not land the same way each time or the bow presses too much.'),
      fretted: L('La misma nota te sale unas veces alta y otras baja: cambia cuánto aprietas o dónde pisas.', 'The same note comes out sometimes sharp and sometimes flat: how hard you press or where you fret keeps changing.'),
    }, k),
    action: k => pick({
      default: L('Haz notas tenidas de 8 tiempos mirando la línea: que no se mueva ni al principio ni al final.', 'Play 8-beat long notes watching the line: it should not move at the start or at the end.'),
      bowed: L('Notas largas con arco entero a velocidad constante y el peso del brazo, no de los dedos.', 'Long notes with a whole bow at a steady speed, using arm weight rather than finger pressure.'),
      fretted: L('Toca cada nota cuatro veces seguidas mirando el afinador y busca la presión mínima que suene limpia.', 'Play each note four times in a row watching the tuner and look for the least pressure that sounds clean.'),
    }, k),
    evidence: s => [ev(L('Variación media', 'Average variation'), `±${round(s.spread)} ¢`)],
    goto: 'longtone',
  },
  {
    id: 'dynamic-pitch', kinds: [...WINDS],
    test: s => s.longtones.filter(l => l.dynamicRange > 8).length >= 2 && Math.abs(avgSlope(s)) >= 5,
    weight: s => 3 * Math.abs(avgSlope(s)),
    tip: k => (k === 'brass' || k === 'trombone' || k === 'recorder' ? 'breath' : 'embouchure'),
    title: L('El volumen te cambia la afinación', 'Volume changes your tuning'),
    why: () => L('En tus notas tenidas, al cambiar de piano a forte la afinación se mueve. Los labios acompañan al aire en vez de quedarse quietos.', 'In your long notes the pitch moves when you go from soft to loud. The lips follow the air instead of staying still.'),
    action: () => L('Crescendo y diminuendo en una nota: más aire para el forte sin apretar, y en el piano mantén la velocidad del aire.', 'Crescendo and diminuendo on one note: more air for forte without squeezing, and keep the air speed up in piano.'),
    evidence: s => [ev(L('Cambio por cada 10 dB', 'Change per 10 dB'), cents(avgSlope(s)))],
    goto: 'longtone',
  },
  {
    id: 'neighbour-key', kinds: ['keys'],
    count: s => slipsWhere(s, off => Math.abs(off) <= 2),
    test: s => { const c = RULES_BY_ID['neighbour-key'].count(s); return c >= MIN_SLIPS && rate(c, s.attempts) >= 0.12; },
    weight: s => 100 * rate(RULES_BY_ID['neighbour-key'].count(s), s.attempts),
    tip: () => 'hand',
    title: L('Se te escapa la tecla de al lado', 'You hit the key next door'),
    why: () => L('Muchas notas han salido a una o dos teclas: la mano no está colocada sobre su posición o los dedos van planos.', 'Many notes landed one or two keys away: the hand is not set over its position or the fingers are flat.'),
    action: () => L('Antes de tocar, pon los cinco dedos sobre sus cinco teclas y mira la primera nota; dedos curvos, tocando con la yema.', 'Before playing, set five fingers on their five keys and look at the first note; curved fingers, playing on the pads.'),
    evidence: s => [ev(L('Teclas vecinas', 'Neighbouring keys'), String(RULES_BY_ID['neighbour-key'].count(s)))],
  },
  {
    id: 'perc-timing', kinds: ['perc'],
    test: (s, k, extra) => (extra.recentAcc || []).length >= 3 && avg(extra.recentAcc) < 0.7,
    weight: (s, k, extra) => 100 * (1 - avg(extra.recentAcc)),
    tip: () => 'stroke',
    title: L('Los golpes llegan fuera de tiempo', 'Your strokes land off the beat'),
    why: () => L('En tus últimas lecciones a tempo, bastantes golpes no caen con el pulso. Suele ser rigidez: si la mano no rebota, el siguiente golpe llega tarde.', 'In your latest lessons at tempo, quite a few strokes miss the beat. It is usually stiffness: if the hand does not bounce, the next stroke is late.'),
    action: () => L('Practica con el metrónomo lento dejando que la mano rebote sola después de cada golpe; sube 4 BPM solo cuando salga relajado.', 'Practise with a slow metronome letting the hand bounce back after every stroke; go up 4 BPM only when it feels relaxed.'),
    evidence: (s, k, extra) => [ev(L('Precisión a tempo', 'Accuracy at tempo'), pct(avg(extra.recentAcc)))],
    goto: 'metro',
  },
];
const RULES_BY_ID = Object.fromEntries(RULES.map(r => [r.id, r]));
const avg = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
function avgSlope(s) {
  const takes = s.longtones.filter(l => l.dynamicRange > 8);
  return takes.length ? avg(takes.map(l => l.centsPer10dB)) : 0;
}

// Afinación desplazada por igual en todo el registro: no es la técnica, es el instrumento sin afinar
function globalOffset(s, kind) {
  if (kind === 'keys' || kind === 'perc' || kind === 'fretted') return null;
  const regs = ['low', 'mid', 'high'].filter(r => s.reg[r].notes >= MIN_NOTES);
  if (regs.length < 2) return null;
  const means = regs.map(r => s.reg[r].mean);
  if (!(means.every(m => m >= 12) || means.every(m => m <= -12)) || Math.max(...means) - Math.min(...means) > 10) return null;
  const sharp = s.mean > 0;
  return {
    id: sharp ? 'tune-sharp' : 'tune-flat', tip: 'mouthpiece', weight: Math.abs(s.mean), goto: 'tuner',
    title: sharp ? L('Afinas alto en todas las notas', 'You play sharp on every note') : L('Afinas bajo en todas las notas', 'You play flat on every note'),
    why: L('Todo el registro se desvía lo mismo, así que no parece un problema de técnica: es la afinación del instrumento.', 'The whole range is off by the same amount, so it does not look like a technique problem: it is how the instrument is tuned.'),
    action: pick({
      default: sharp ? L('Saca un poco la boquilla (o la bomba de afinación) y vuelve a comprobar con el afinador.', 'Pull the mouthpiece (or tuning slide) out a little and check again with the tuner.')
        : L('Mete un poco la boquilla (o la bomba de afinación) y vuelve a comprobar con el afinador.', 'Push the mouthpiece (or tuning slide) in a little and check again with the tuner.'),
      bowed: L('Afina las cuatro cuerdas al aire con el afinador antes de empezar.', 'Tune the four open strings with the tuner before you start.'),
    }, kind),
    evidence: [ev(L('Media', 'Average'), cents(s.mean))],
  };
}

// Consejos para este músico, de más a menos importante. extra: { recentAcc } para la percusión.
export function coachAdvice(inst, tuning, coach, extra = {}) {
  const kind = techniqueKind(inst);
  const s = coachStats(inst, tuning, coach);
  const needed = kind === 'perc' ? 0 : MIN_SAMPLES;
  if (s.samples < needed && kind !== 'perc') return { ready: false, progress: s.samples / needed, items: [] };
  const items = RULES.filter(r => r.kinds.includes(kind) && r.test(s, kind, extra)).map(r => ({
    id: r.id, tip: r.tip(kind), weight: r.weight(s, kind, extra), title: r.title,
    why: r.why(kind), action: r.action(kind), evidence: r.evidence(s, kind, extra), goto: r.goto || null,
  }));
  const offset = globalOffset(s, kind);
  if (offset) items.push(offset);
  const ready = kind !== 'perc' || (extra.recentAcc || []).length >= 3;
  return { ready, progress: ready ? 1 : (extra.recentAcc || []).length / 3, items: items.sort((a, b) => b.weight - a.weight).slice(0, MAX_TIPS) };
}
