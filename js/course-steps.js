// Niveles intermedios del modo casual. Cada lección del curso se reparte en pasos cortos para que quien empieza de
// cero avance poco a poco: cada nota (o acorde) nueva por separado y junto a una vecina conocida, las nuevas juntas,
// la lección por partes, las canciones frase a frase y después enteras despacio. Al final de cada unidad, un repaso
// que recorre todas sus notas y un reto a tempo con sitio para respirar.
// Los pasos llevan `parentKey`: si ya tenías hecha la lección original, sus pasos cuentan como hechos.
// Revisado con criterios de profesores de cada familia: sin pasos repetidos, sin cromatismos ni saltos raros en los
// repasos, las frases respetan la anacrusa y «Despacio» solo aparece cuando hay figuras rápidas.
import { parseNote, parseScore, noteLabel } from './music.js';
import { songById, octaveShiftFor } from './songs.js';
import { getState } from './store.js';

const NEW_BLOCK = 3;          // notas nuevas por bloque; cada bloque termina con «Notas nuevas juntas»
const NEIGHBOUR_MAX = 4;      // la nota de apoyo, como mucho a una tercera mayor; si no, la nueva se toca sola
const MIN_PARTS_NOTES = 12;   // a partir de aquí la lección de notas se practica también por mitades
const MIN_PHRASE_BARS = 8;    // las canciones más cortas no se trocean: nota a nota y enteras
const MAX_PHRASES = 4;
const SLOW_SPEED = 0.7;
const SLOW_MAX_BPM = 72;
const FAST_HITS_PER_SECOND = 5; // por encima, la percusión tiene también un paso «Casi a tempo»
const CHALLENGE_BPM = [60, 84]; // el reto a tempo acelera unidad a unidad, de 60 a 84
const REVIEW_WINDOW = 12;     // notas como mucho en el repaso de una unidad
const REVIEW_CHORDS = 6;
const SHIFTS = [0, 12, -12, 24, -24];

const label = n => noteLabel(parseNote(n), getState().nom);
const joinNames = list => (list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' y ' + list[list.length - 1]);
const uniq = list => [...new Set(list)];
const barsOf = score => score.split('|').map(b => b.trim()).filter(Boolean);
const scoreText = bars => '| ' + bars.join(' | ') + ' |';
const pitched = n => !n.rest;
const midiOf = n => parseNote(n).midi;
const byPitch = (x, y) => midiOf(x) - midiOf(y);
const isPalindrome = list => list.join(' ') === [...list].reverse().join(' ');

// Sube o baja octavas una partitura en texto (las canciones del repertorio se colocan en el registro del instrumento)
const shiftName = (name, octaves) => name.replace(/(-?\d+)$/, o => String(Number(o) + octaves));
function shiftScore(score, semitones) {
  const octaves = semitones / 12;
  if (!octaves) return score;
  return score.split(/\s+/).map(tok => (tok.startsWith('@') ? tok : tok.replace(/([A-G](?:##|#|bb|b)?)(-?\d)/g, (_, n, o) => n + (Number(o) + octaves)))).join(' ');
}

// Notas (escritas) de una partitura, en orden de aparición
function scoreNotes(score) {
  try { return parseScore(score).notes.filter(pitched).map(n => n.letter + ({ 1: '#', 2: '##', '-1': 'b', '-2': 'bb' }[n.acc] || '') + n.oct); } catch { return []; }
}

// Frases de 2 o 4 compases (como mucho cuatro). La anacrusa va con la primera frase y un resto de un compás se une a
// la frase anterior, para no cortar a media frase.
function phrasesOf(count, pickup) {
  const start = pickup ? 1 : 0;
  const body = count - start;
  if (body < MIN_PHRASE_BARS) return [];
  let size = body <= 8 ? 2 : 4;
  if (body / size > MAX_PHRASES) size = Math.ceil(body / MAX_PHRASES);
  const out = [];
  for (let a = start; a < count; a += size) out.push([a, Math.min(count, a + size)]);
  if (out.length > 1 && out[out.length - 1][1] - out[out.length - 1][0] < 2) out[out.length - 2][1] = out.pop()[1];
  out[0][0] = 0;
  return out.length > 1 ? out : [];
}

// Trozo de partitura: arrastra las indicaciones de compás, clave y tonalidad de los compases anteriores
function sliceScore(score, a, b) {
  const bars = barsOf(score);
  const carried = bars.slice(0, a).flatMap(bar => bar.split(/\s+/).filter(t => /^@(time|key|clef):/.test(t)));
  const head = [...new Map(carried.map(t => [t.split(':')[0], t])).values()];
  const slice = bars.slice(a, b);
  if (head.length) slice[0] = head.join(' ') + ' ' + slice[0];
  return scoreText(slice);
}

// Golpes (notas no silencio) antes del compás a: para recortar la línea de manos de percusión
const hitsBefore = (score, a) => (a ? parseScore(scoreText(barsOf(score).slice(0, a))).notes.filter(pitched).length : 0);

function sliceSticking(list, score, a, b) {
  if (!list) return null;
  const total = parseScore(score).notes.filter(pitched).length;
  if (list.length !== total) return null;
  return list.slice(hitsBefore(score, a), hitsBefore(score, b));
}

// Golpes por segundo en la figura más rápida de una partitura
function hitsPerSecond(score, bpm) {
  const beats = parseScore(score).notes.filter(pitched).map(n => n.beats);
  return beats.length ? bpm / 60 / Math.min(...beats) : 0;
}

// Despacio: al 70 % y nunca por encima de 72 pulsos por minuto
const slowFactor = bpm => Math.round(100 * Math.min(SLOW_SPEED, SLOW_MAX_BPM / bpm)) / 100;
const hasShortNotes = score => parseScore(score).notes.some(n => pitched(n) && n.beats < 1);

// Quita los pares cromáticos de la misma nota (Fa y Fa♯): se queda con la que más sale
function withoutChromaticPairs(names, counts, fresh = new Set()) {
  const byLetter = new Map();
  names.forEach(n => {
    const p = parseNote(n);
    const k = p.letter + p.oct;
    const prev = byLetter.get(k);
    const score = x => (fresh.has(x) ? 1e6 : 0) + (counts.get(x) || 0); // la alteración que se acaba de aprender gana
    if (!prev || score(n) > score(prev)) byLetter.set(k, n);
  });
  return [...byLetter.values()].sort(byPitch);
}

// Ventana de notas seguidas del repaso: la que contiene más notas nuevas de la unidad
function reviewWindow(sorted, fresh) {
  if (sorted.length <= REVIEW_WINDOW) return sorted;
  let best = 0;
  let bestCount = -1;
  for (let i = 0; i + REVIEW_WINDOW <= sorted.length; i++) {
    const count = sorted.slice(i, i + REVIEW_WINDOW).filter(n => fresh.has(n)).length;
    if (count > bestCount) { best = i; bestCount = count; }
  }
  return sorted.slice(best, best + REVIEW_WINDOW);
}

// Repaso: sube por todas las notas y vuelve a bajar (de vecina en vecina)
function reviewWalk(s) {
  const path = [...s, ...s.slice(0, -1).reverse()];
  return path.length >= 8 ? path : [...path, ...s.slice(1), ...s.slice(0, -1).reverse()];
}

// Reto: terceras quebradas hacia arriba (Do Mi Re Fa…) si hay notas para ello; si no, grados seguidos
function challengeWalk(s) {
  if (s.length < 5) return reviewWalk(s);
  const up = [];
  for (let i = 0; i + 2 < s.length; i++) up.push(s[i], s[i + 2]);
  return [...up, ...s.slice(0, -1).reverse()];
}

// Compases del reto: tres notas y un silencio para respirar; en la primera unidad, blancas
function challengeBars(seq, first) {
  const bars = [];
  if (first) {
    for (let i = 0; i < seq.length; i += 3) {
      const [a, b, c] = seq.slice(i, i + 3);
      bars.push([a, b].filter(Boolean).map(n => n + 'h').join(' ') + (b ? '' : ' Rh'));
      if (c) bars.push(c + 'h Rh');
    }
  } else {
    for (let i = 0; i < seq.length; i += 3) {
      const group = seq.slice(i, i + 3);
      bars.push([...group.map(n => n + 'q'), ...Array(4 - group.length).fill('Rq')].join(' '));
    }
  }
  return bars;
}

const challengeBpm = (index, total) => Math.round(CHALLENGE_BPM[0] + (CHALLENGE_BPM[1] - CHALLENGE_BPM[0]) * index / Math.max(1, total - 1));

// ¿Cuántas notas de una canción no conoce todavía el alumno? (para elegir las de «Tu música»)
export function unknownNotes(song, inst, known) {
  if (inst.rhythmOnly || !known) return 0;
  const shift = octaveShiftFor(song, inst);
  if (shift === null) return Infinity;
  const key = m => (inst.anyOctave ? ((m % 12) + 12) % 12 : m);
  const names = uniq(scoreNotes(song.score || '').map(n => key(midiOf(n) + shift)));
  return names.filter(k => !known.has(k)).length;
}

function makeSteps(inst) {
  // identidad de una nota: la altura (los enarmónicos son la misma nota); en el xilófono, solo el nombre
  const keyOf = n => (inst.anyOctave ? ((midiOf(n) % 12) + 12) % 12 : midiOf(n));
  const known = new Map();       // clave → nombre de la nota ya presentada
  const knownChords = new Set();
  const seenGlobal = new Set();  // contenido de pasos ya generados (para no repetir repasos entre unidades)

  // Octava de una canción del repertorio: la que cabe en el instrumento y trae menos notas nuevas
  function songShift(song) {
    const fallback = octaveShiftFor(song, inst);
    if (fallback === null || inst.rhythmOnly) return fallback ?? 0;
    const names = uniq(scoreNotes(song.score));
    const midis = names.map(midiOf);
    const fits = k => Math.min(...midis) + k >= inst.written[0] && Math.max(...midis) + k <= inst.written[1];
    const unknown = k => names.filter(n => !known.has(keyOf(shiftName(n, k / 12)))).length;
    const options = SHIFTS.filter(fits);
    if (!known.size || !options.length) return fallback;
    return options.reduce((best, k) => (unknown(k) < unknown(best) ? k : best), fallback);
  }

  return function expandUnit(unit, index, total, lessonKey) {
    const core = unit.lessons.filter(l => !l.optional && !l.slot && l.kind !== 'slots' && l.kind !== 'theory');
    const reverseOk = core.filter(l => l.kind === 'notes').length === 1;
    const seen = new Set();
    const unitFresh = new Set();
    const unitChords = [];
    const unitNewChords = [];
    const pairs = new Set();
    let lastChords = [];
    const contentOf = l => [l.kind, l.mode || '', l.notes || '', l.song ? l.song.score : '', (l.chords || []).join(' '), [].concat(l.sticking || []).join(''), l.speedOverride || '', l.bpm || ''].join('#');

    // añade un paso si no repite nada de lo ya visto en la unidad (ni la propia lección)
    const push = (steps, s, key = contentOf(s)) => {
      if (seen.has(key) || seenGlobal.has(key)) return;
      seen.add(key);
      seenGlobal.add(key);
      steps.push(s);
    };
    const step = (parent, n, fields) => ({ id: `${parent.id}-p${n}`, step: true, parentKey: parent.parentKeyOf, ...fields });

    // «Nota nueva»: la nota sola y después alternando con la conocida más cercana (incluidas las que se acaban de
    // presentar). Se agrupan de tres en tres y cada grupo termina con «Notas nuevas juntas», de grave a agudo.
    function newNoteSteps(parent, list, extra, fingerOf, distinct) {
      const fresh = [];
      uniq(list).forEach(n => { if (!known.has(keyOf(n)) && !fresh.some(f => keyOf(f) === keyOf(n))) fresh.push(n); });
      const steps = [];
      const fingers = seq => (fingerOf && seq.every(n => fingerOf.has(n)) ? { fingers: seq.map(n => fingerOf.get(n)).join(' ') } : {});
      fresh.forEach((n, i) => {
        const midi = midiOf(n);
        const near = [...known.values()].map(k => [k, Math.abs(midiOf(k) - midi)]).filter(([, d]) => d > 0 && d <= NEIGHBOUR_MAX)
          .sort((x, y) => x[1] - y[1] || Math.abs(midiOf(x[0]) - midi) - Math.abs(midiOf(y[0]) - midi))[0];
        const seq = near ? [n, n, n, n, near[0], n, near[0], n] : [n, n, n, n, n, n];
        push(steps, step(parent, 'n' + i, { kind: 'notes', title: 'Nota nueva', sub: label(n), notes: seq.join(' '), ...extra, ...fingers(seq) }));
        known.set(keyOf(n), n);
        unitFresh.add(n);
      });
      for (let b = 0; b < fresh.length; b += NEW_BLOCK) {
        const block = fresh.slice(b, b + NEW_BLOCK).sort(byPitch);
        // solo si son vecinas (como mucho una tercera entre cada dos): si no, sería un salto, no un ejercicio
        const close = block.every((n, i) => !i || midiOf(n) - midiOf(block[i - 1]) <= NEIGHBOUR_MAX);
        if (block.length < 2 || distinct <= 2 || !close) continue;
        const updown = [...block, ...block.slice(1, -1).reverse()];
        const seq = Array.from({ length: 12 }, (_, i) => updown[i % updown.length]);
        push(steps, step(parent, 'nn' + (b / NEW_BLOCK || ''), { kind: 'notes', title: 'Notas nuevas juntas', sub: joinNames(block.map(label)), notes: seq.join(' '), ...extra, ...fingers(seq) }));
      }
      return steps;
    }

    function notesLesson(lesson) {
      const list = lesson.notes.split(' ');
      const extra = lesson.clef ? { clef: lesson.clef } : {};
      const fingerList = lesson.fingers ? lesson.fingers.split(' ') : null;
      const fingerOf = fingerList ? new Map(list.map((n, i) => [n, fingerList[i]]).reverse()) : null; // el dedo de la primera vez
      const distinct = uniq(list.map(keyOf)).length;
      const steps = newNoteSteps(lesson, list, extra, fingerOf, distinct);
      const part = (a, b) => ({ ...extra, ...(fingerList ? { fingers: fingerList.slice(a, b).join(' ') } : {}) });
      if (list.length >= MIN_PARTS_NOTES && distinct > 2) {
        const half = Math.ceil(list.length / 2);
        push(steps, step(lesson, 'a', { kind: 'notes', title: 'Primera parte', sub: lesson.title, notes: list.slice(0, half).join(' '), ...part(0, half) }));
        push(steps, step(lesson, 'b', { kind: 'notes', title: 'Segunda parte', sub: lesson.title, notes: list.slice(half).join(' '), ...part(half, list.length) }));
      }
      if (reverseOk && !lesson.noReverse && list.length >= MIN_PARTS_NOTES && !isPalindrome(list)) {
        const back = { notes: [...list].reverse().join(' '), ...extra, ...(fingerList ? { fingers: [...fingerList].reverse().join(' ') } : {}) };
        push(steps, step(lesson, 'r', { kind: 'notes', title: 'Al revés', sub: lesson.title, after: true, ...back }));
      }
      return steps;
    }

    function songLesson(lesson) {
      const found = lesson.song || songById(lesson.songId);
      if (!found || !found.score) return { steps: [] };
      const shift = lesson.songId ? songShift(found) : 0;
      const base = { ...found, score: shiftScore(found.score, shift) };
      const title = lesson.title || base.title;
      const from = lesson.songId ? { fromSong: lesson.songId } : {};
      const perc = { ...(lesson.tones ? { tones: true } : {}) };
      const copy = (id, fields) => ({ ...base, id, ...fields });
      const notesIn = scoreNotes(base.score);
      const steps = inst.rhythmOnly ? [] : newNoteSteps(lesson, notesIn, lesson.clef ? { clef: lesson.clef } : {}, null, uniq(notesIn.map(keyOf)).length);
      const bars = barsOf(base.score);
      const half = Math.ceil(bars.length / 2);
      // las notas largas (redondas y blancas) no se trocean: son ejercicios de aire, no frases
      const longOnly = !parseScore(base.score).notes.some(n => pitched(n) && n.beats < 2);
      const parts = inst.rhythmOnly ? (bars.length >= 4 ? [[0, half], [half, bars.length]] : []) : longOnly ? [] : phrasesOf(bars.length, base.pickup);
      parts.forEach(([a, b], i) => {
        const id = `${lesson.id}-p${i + 1}`;
        const sticking = sliceSticking(lesson.sticking || base.sticking, base.score, a, b);
        const body = barsOf(base.score).slice(a === 0 && base.pickup ? 1 : a, b).join('|') + [].concat(sticking || []).join('');
        push(steps, step(lesson, i + 1, {
          kind: 'song', title: inst.rhythmOnly ? (i ? 'Segunda mitad' : 'Primera mitad') : `Frase ${i + 1}`, sub: title, mode: 'learn', ...from, ...perc,
          ...(sticking ? { sticking } : {}),
          song: copy(id, { title, score: sliceScore(base.score, a, b), pickup: a === 0 ? base.pickup || 0 : 0, others: undefined }),
        }), 'phrase#' + body);
      });
      // canción corta a tempo: antes, entera y nota a nota
      if (!inst.rhythmOnly && !parts.length && hasShortNotes(base.score)) {
        push(steps, step(lesson, 'l', { kind: 'song', title: 'Nota a nota', sub: title, mode: 'learn', ...from, song: copy(`${lesson.id}-pl`, { title }) }));
      }
      const sticking = lesson.sticking ? { sticking: lesson.sticking } : {};
      if (hasShortNotes(base.score)) {
        push(steps, step(lesson, 's', { kind: 'song', title: 'Despacio', sub: title, speedOverride: slowFactor(base.bpm), fixedSpeed: true, ...from, ...perc, ...sticking, song: copy(`${lesson.id}-ps`, { title }) }));
      }
      if (inst.rhythmOnly && hitsPerSecond(base.score, base.bpm) > FAST_HITS_PER_SECOND) {
        push(steps, step(lesson, 'c', { kind: 'song', title: 'Casi a tempo', sub: title, speedOverride: 0.85, fixedSpeed: true, ...perc, ...sticking, song: copy(`${lesson.id}-pc`, { title }) }));
      }
      return { steps, shift };
    }

    function chordLesson(lesson) {
      const steps = [];
      const chords = uniq(lesson.chords || []);
      const fresh = chords.filter(c => !knownChords.has(c));
      // un «Acorde nuevo» antes de una lección que ya solo mantiene ese acorde sería repetirla
      const soloHold = lesson.mode === 'hold' && chords.length === 1;
      if (!soloHold) fresh.forEach((c, i) => push(steps, step(lesson, 'c' + i, { kind: 'chords', mode: 'hold', title: 'Acorde nuevo', sub: `{${c}}`, chords: [c, c, c] })));
      if (lesson.mode === 'changes') {
        const [a, b] = lesson.pair;
        if (!pairs.has([a, b].sort().join('|'))) push(steps, step(lesson, 'w', { kind: 'chords', mode: 'hold', title: 'Cambio lento', sub: `{${a}}–{${b}}`, chords: [a, b, a, b, a, b] }));
      }
      if (lesson.mode === 'strum') {
        if (chords.length >= 2 && !chords.every(c => lastChords.includes(c))) {
          push(steps, step(lesson, 'h', { kind: 'chords', mode: 'hold', title: 'Los acordes de la canción', sub: lesson.title, chords: [...chords, ...chords] }));
        }
        const bpm = Math.min(Math.round(lesson.bpm * SLOW_SPEED), SLOW_MAX_BPM);
        if (bpm < lesson.bpm) push(steps, step(lesson, 's', { ...lesson, id: `${lesson.id}-ps`, title: 'Despacio', sub: lesson.title, bpm }));
      }
      chords.forEach(c => {
        if (!knownChords.has(c)) unitNewChords.push(c);
        knownChords.add(c);
        if (!unitChords.includes(c)) unitChords.push(c);
      });
      const list = lesson.chords || [];
      for (let i = 1; i < list.length; i++) pairs.add([list[i - 1], list[i]].sort().join('|'));
      lastChords = chords;
      return steps;
    }

    // Repaso y reto de la unidad
    function unitClose(P) {
      const close = { step: true, unitReview: true };
      if (inst.rhythmOnly) return rhythmClose(core, P, close);
      const out = [];
      if (unitChords.length >= 2) {
        // primero los acordes nuevos de la unidad; como mucho seis
        const chosen = uniq([...unitNewChords, ...unitChords]).slice(0, REVIEW_CHORDS);
        out.push({ ...close, id: P + 'h', kind: 'chords', mode: 'hold', title: 'Repaso', sub: 'Los acordes de la unidad', chords: [...chosen, ...[...chosen].reverse().slice(1)] });
        out.push({ ...close, id: P + 'g', kind: 'chords', mode: 'strum', title: 'Reto a tempo', sub: 'Los acordes de la unidad', time: 4, bpm: 70, chords: chosen,
          chart: [...chosen, ...chosen].map(chord => ({ chord, beats: 4 })) });
      }
      // las notas de las lecciones de notas de la unidad (si no hay, las de sus canciones)
      const notesLessons = core.filter(l => l.kind === 'notes');
      const source = [...(notesLessons.length ? notesLessons.flatMap(l => l.notes.split(' ')) : core.flatMap(l => l._notes || [])), ...unitFresh];
      const counts = new Map();
      source.forEach(n => counts.set(n, (counts.get(n) || 0) + 1));
      const sorted = withoutChromaticPairs(uniq(source), counts, unitFresh).filter((n, i, all) => all.findIndex(m => keyOf(m) === keyOf(n)) === i);
      if (sorted.length < 3) return out;
      const s = reviewWindow(sorted, unitFresh);
      const clef = core.find(l => l.clef)?.clef;
      const extra = clef ? { clef } : {};
      const review = reviewWalk(s);
      const tonic = s[0];
      const seq = challengeWalk(s);
      const bars = [...challengeBars(seq, index === 0), tonic + 'w'];
      const r = { ...close, id: P + 'r', kind: 'notes', title: 'Repaso', sub: 'Las notas de la unidad', notes: review.join(' '), ...extra };
      const t = { ...close, id: P + 't', kind: 'song', title: 'Reto a tempo', sub: 'Sin parar, siguiendo el pulso', ...extra,
        song: { id: P + 't', title: 'Reto a tempo', by: 'Ejercicio', style: null, difficulty: 1, key: 'C', time: 4, bpm: challengeBpm(index, total), score: scoreText(bars) } };
      // si la unidad ya tiene repaso y reto de acordes, de notas solo el repaso (no cuatro repasos seguidos)
      [r, ...(out.length ? [] : [t])].forEach(x => { const c = contentOf(x); if (!seenGlobal.has(c)) { seenGlobal.add(c); out.push(x); } });
      return out;
    }

    const out = [];
    unit.lessons.forEach(lesson => {
      if (lesson.kind === 'slots' && !out.some(l => l.unitReview)) out.push(...unitClose(unit.id + '-x'));
      if (!core.includes(lesson)) { out.push(lesson); return; }
      seen.add(contentOf(lesson));
      const parent = { ...lesson, parentKeyOf: lessonKey(lesson) };
      let steps = [];
      let shown = lesson;
      if (lesson.kind === 'notes') steps = notesLesson(parent);
      else if (lesson.kind === 'chords') steps = chordLesson(parent);
      else if (lesson.kind === 'song') {
        const res = songLesson(parent);
        steps = res.steps;
        // la lección original se toca en la misma octava que sus pasos
        if (lesson.songId && res.shift !== undefined) shown = { ...lesson, octaveShift: res.shift };
      }
      if (lesson.kind === 'song' && !inst.rhythmOnly) {
        const song = lesson.song || songById(lesson.songId);
        const notes = song && song.score ? scoreNotes(shiftScore(song.score, shown.octaveShift || 0)) : [];
        notes.forEach(n => { if (!known.has(keyOf(n))) known.set(keyOf(n), n); });
        shown = { ...shown, _notes: notes };
      }
      if (lesson.kind === 'notes') lesson.notes.split(' ').forEach(n => { if (!known.has(keyOf(n))) known.set(keyOf(n), n); });
      out.push(...steps.filter(l => !l.after), shown, ...steps.filter(l => l.after));
      const i = core.indexOf(lesson);
      core[i] = shown;
    });
    if (!out.some(l => l.unitReview)) out.push(...unitClose(unit.id + '-x'));
    out.forEach(l => { delete l._notes; });
    return { ...unit, lessons: out, known: new Set(known.keys()) };
  };
}

// Percusión: un repaso con el principio de cada ejercicio de la unidad (un compás; en compás de 3, el ciclo de 12
// entero) y el último ejercicio un poco más rápido
function rhythmClose(core, P, close) {
  const all = core.filter(l => l.kind === 'song' && l.song && l.song.score);
  if (!all.length) return [];
  const time = all[0].song.time;
  const take = time === 3 ? 4 : 1;
  const fullStart = l => barsOf(l.song.score).length >= take && parseScore(scoreText(barsOf(l.song.score).slice(0, take))).totalBeats === l.song.time * take;
  const songs = all.filter(l => l.song.time === time && fullStart(l));
  const out = [];
  const first = songs.map(l => ({ bars: barsOf(l.song.score).slice(0, take), sticking: sliceSticking(l.sticking, l.song.score, 0, take) }));
  const distinct = uniq(first.map(f => f.bars.join('|')));
  if (songs.length >= 2 && distinct.length >= 2) {
    const sticking = first.every(f => f.sticking) ? first.flatMap(f => f.sticking) : null;
    const base = songs[0];
    out.push({ ...close, id: P + 'm', kind: 'song', title: 'Repaso', sub: 'El principio de cada ejercicio', ...(base.tones ? { tones: true } : {}), ...(sticking ? { sticking } : {}),
      song: { ...base.song, id: P + 'm', title: 'Repaso', pickup: 0, score: scoreText(first.flatMap(f => f.bars)) } });
  }
  const last = all[all.length - 1];
  out.push({ ...last, ...close, id: P + 'r', title: 'Reto: más rápido', sub: last.title, speedOverride: 1.15, fixedSpeed: true, song: { ...last.song, id: P + 'r' } });
  return out;
}

// Añade los pasos intermedios a todas las unidades de un instrumento. Cada unidad sale con `known`: las notas que el
// alumno ya conoce al terminarla (para elegir canciones de «Tu música» que pueda tocar).
export function expandCourse(units, inst, lessonKey) {
  const expandUnit = makeSteps(inst);
  return units.map((unit, i) => expandUnit(unit, i, units.length, lessonKey));
}
