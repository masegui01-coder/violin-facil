// Corrección del dictado: arriba «Lo que sonó», abajo «Lo que has tocado», alineados pulso a pulso y nota a nota.
// Verde = nota y ritmo bien; amarillo = cerca; rojo = mal, falta o sobra. Además del color, cada nota lleva su signo
// (✓ ≈ ✕) y una lista de botones con el detalle «Sonaba X · tocaste Y» para teclado y lector de pantalla.
import { $, esc, starsHtml } from '../ui.js';
import { createStaff } from '../staff.js';
import { noteLabel, parseScore, keyCount } from '../music.js';
import * as audio from '../audio.js';
import { EXTRA_LISTEN_PENALTY, LEVEL_COUNT, meterParts } from '../dictation.js';
import { eventsToScore, spellPlayed, spellingsOf, withIoi } from '../dictation-score.js';

const GLYPH = { ok: '✓', near: '≈', bad: '✕' };
const MARK_Y = 26;
const DRUM_LOOKAHEAD_S = 0.3;
const DRUM_TICK_MS = 100;
const FIGURE = { 4: 'redonda', 3: 'blanca con puntillo', 2: 'blanca', 1.5: 'negra con puntillo', 1: 'negra', 0.75: 'corchea con puntillo', 0.5: 'corchea', 0.25: 'semicorchea' };
const figureName = beats => FIGURE[beats] || 'nota ligada';
// Duración tocada en figuras («negra con puntillo + semicorchea»), cada una en su <span> para traducirla
const FIGURE_PIECES = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];
function figureHtml(beats) {
  if (FIGURE[beats]) return `<span>${FIGURE[beats]}</span>`;
  const pieces = [];
  let left = beats;
  for (let guard = 0; left > 1e-6 && guard < 16; guard++) {
    const v = FIGURE_PIECES.find(x => x <= left + 1e-6);
    if (!v) break;
    pieces.push(v);
    left -= v;
  }
  return pieces.length ? pieces.map(v => `<span>${FIGURE[v]}</span>`).join(' + ') : `<span>${figureName(beats)}</span>`;
}

// Notas que suenan del dictado, con su índice en la partitura
export function expectedEvents(dict) {
  return dict.notes.map((n, index) => ({ ...n, index })).filter(n => !n.rest)
    .map(n => ({ midi: n.midi, start: n.start, beats: n.beats, index: n.index, letter: n.letter, acc: n.acc, oct: n.oct }));
}

// Caja o cajón: golpes programados poco a poco (para poder pararlos). El primero de cada compás, acentuado.
export function playDrums(notes, bpm, barBeats, t0) {
  const spb = 60 / bpm;
  const hits = notes.filter(n => !n.rest).map(n => ({ time: t0 + n.start * spb, accent: n.start % barBeats < 1e-6 }));
  let i = 0;
  const timer = setInterval(() => {
    const until = audio.audioTime() + DRUM_LOOKAHEAD_S;
    for (; i < hits.length && hits[i].time < until; i++) audio.drumHit(hits[i].time, hits[i].accent, hits[i].accent ? 1 : 0.6);
    if (i >= hits.length) clearInterval(timer);
  }, DRUM_TICK_MS);
  return () => clearInterval(timer);
}

// Si el ritmo de una nota se da por bueno, se escribe con la figura del dictado (con su silencio y, la última, entera):
// así lo tocado no aparece «distinto» por soltar antes la nota. Si no, en percusión hasta el golpe siguiente.
function displayEvents(dict, expected, played, pairs) {
  const P = withIoi(played);
  const byPlayed = new Map(pairs.filter(x => x.p !== null && x.e !== null).map(x => [x.p, x]));
  return P.map((p, j) => {
    const pair = byPlayed.get(j);
    // en percusión, sin la figura del dictado: como mucho hasta el golpe siguiente y nunca más larga que la esperada
    let beats = dict.rhythmOnly ? Math.min(p.ioi, pair ? expected[pair.e].beats : 1) : p.beats;
    if (pair && pair.rhythm >= 100) beats = p.last ? expected[pair.e].beats : Math.min(expected[pair.e].beats, p.ioi);
    return { start: p.start, beats, midi: p.midi };
  });
}

function playedScoreOf(dict, expected, played, pairs) {
  const spellings = spellingsOf(dict.notes);
  const flats = keyCount(dict.key) < 0;
  const nameOf = e => (dict.rhythmOnly ? 'C5' : spellPlayed(e.midi, spellings, flats));
  const shown = displayEvents(dict, expected, played, pairs);
  const { text, heads } = eventsToScore(shown, { barBeats: dict.barBeats, totalBeats: dict.totalBeats, nameOf });
  return { score: parseScore(text), heads };
}

// Índices de la partitura que forman una nota (la cabeza y lo que va ligado detrás)
function pieceIndexes(notes, head) {
  if (head === null || head === undefined) return [];
  const out = [head];
  for (let k = head; notes[k] && notes[k].tie && notes[k + 1] && !notes[k + 1].rest; k++) out.push(k + 1);
  return out;
}

// Color en todas las figuras de la nota; el signo (✓ ≈ ✕), solo en la cabeza
function markNote(svg, index, state, sign = true) {
  const g = svg.querySelectorAll('.st-note')[index];
  const head = g && g.querySelector('ellipse');
  if (!head) return;
  g.classList.add('dict-' + state);
  if (!sign) return;
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', head.getAttribute('cx'));
  t.setAttribute('y', MARK_Y);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('class', 'dict-mark');
  t.textContent = GLYPH[state];
  g.appendChild(t);
}

// ---------- Textos de cada nota ----------
const KIND_TEXT = {
  exact: ['Correcta', 'Cerca: nota bien, ritmo distinto'],
  octave: ['Cerca: otra octava', 'Cerca: otra octava y ritmo distinto'],
  accidental: ['Cerca: revisa la alteración', 'Cerca: revisa la alteración y el ritmo'],
  step: ['Cerca: la nota de al lado', 'Cerca: la nota de al lado y ritmo distinto'],
  wrong: ['Mal: otra nota', 'Mal: otra nota y ritmo distinto'],
  missing: ['Falta: no la has tocado'], extra: ['Sobra: nota de más'],
};
const PERC_TEXT = { exact: ['Correcto', 'Cerca: ritmo distinto'], missing: ['Falta: golpe sin tocar'], extra: ['Sobra: golpe de más'] };

function kindText(pair, perc) {
  const table = perc ? PERC_TEXT : KIND_TEXT;
  const row = table[pair.kind] || table.exact;
  return row[pair.rhythmOk || row.length === 1 ? 0 : 1];
}

// «Nota» es femenino y «golpe», masculino
const STATE_WORD = { ok: 'correcta', near: 'cerca', bad: 'mal' };
const STATE_WORD_PERC = { ok: 'correcto', near: 'cerca', bad: 'mal' };
function chipLabel(pair, n, perc) {
  if (pair.kind === 'extra') return perc ? 'Golpe de más' : 'Nota de más';
  const word = pair.kind === 'missing' ? 'falta' : (perc ? STATE_WORD_PERC : STATE_WORD)[pair.state];
  return `${perc ? 'Golpe' : 'Nota'} ${n}: ${word}`;
}

function noteText(n, beats, perc, nom, flats) {
  const fig = figureHtml(beats);
  return perc ? fig : `<b>${esc(noteLabel(n, nom, flats))}</b> · ${fig}`;
}

// ---------- Pantalla ----------
export function renderResult(root, { dict, inst, played, result, record, nom }, actions) {
  const perc = dict.rhythmOnly;
  const expected = expectedEvents(dict);
  const { pairs } = result;
  const mine = playedScoreOf(dict, expected, played, pairs);
  const flats = keyCount(dict.key) < 0;
  const chips = numberPairs(pairs);
  root.innerHTML = resultHtml(dict, result, record, chips, perc, expected);
  // la escala la marca el dictado: una nota de más muy corta no ensancha los dos pentagramas
  const minBeats = Math.min(1, ...dict.notes.map(n => n.beats));
  const [num, den] = meterParts(dict.meter);
  const opts = { key: perc ? 'C' : dict.key, time: [num, den], mode: 'review', clef: perc ? 'perc' : inst.clef || 'treble', minBeats, fixedScale: true, beams: dict.meter === '6/8' ? 1.5 : 1 };
  createStaff($('dictStaffWant')).render(parseScore(dict.score), opts);
  createStaff($('dictStaffMine')).render(mine.score, opts);
  sizeStaves([$('dictStaffWant'), $('dictStaffMine')]);
  pairs.forEach(x => {
    if (x.e !== null) markNote($('dictStaffWant'), expected[x.e].index, x.state);
    if (x.p !== null) pieceIndexes(mine.score.notes, mine.heads[x.p]).forEach((k, n) => markNote($('dictStaffMine'), k, x.state, n === 0));
  });
  const select = k => showDetail(k, { pairs, expected, played: withIoi(played), mine, perc, nom, flats, chips, dict });
  wireResult(root, { dict, mine, pairs, expected, select, actions, perc });
  $('dictScores').focus();
}

// Tamaño de los pentagramas: en rem (crecen con el texto grande) y, si sobra sitio (escritorio), más grandes,
// los dos con la misma escala para que sigan alineados pulso a pulso
const STAFF_SCALE = 0.75;
const MAX_GROW = 1.8;
const MIN_GROW = 0.8; // en el móvil, algo más pequeños para ver más compases
const STAFF_PAD = 24;
function sizeStaves(svgs) {
  const box = svgs[0].closest('.dict-staves');
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const widths = svgs.map(svg => svg.viewBox.baseVal.width);
  // todo en rem: si cambia el tamaño de letra (también después), el pentagrama crece o mengua con él
  const natural = Math.max(...widths) * STAFF_SCALE / 16;
  const room = box ? (box.clientWidth - STAFF_PAD) / rem : natural;
  const grow = Math.max(MIN_GROW, Math.min(MAX_GROW, room / natural));
  svgs.forEach((svg, k) => {
    svg.removeAttribute('width');
    svg.style.width = `${(widths[k] * STAFF_SCALE * grow / 16).toFixed(2)}rem`;
  });
}

// Número de cada nota del dictado (las de más no tienen número)
function numberPairs(pairs) {
  let n = 0;
  return pairs.map(x => (x.e !== null ? ++n : null));
}

function resultHtml(dict, result, record, chips, perc, expected) {
  const next = dict.level < LEVEL_COUNT && result.passed ? `<p class="dict-next">Superado: el nivel ${dict.level + 1} queda recomendado</p>` : '';
  const best = record.isRecord ? '<p class="dict-record">¡Nuevo récord en este nivel!</p>' : `<p class="muted small center">Tu récord en este nivel: ${record.prevBest} %</p>`;
  return `<p class="eyebrow">Nivel ${dict.level} · ${dict.meter} · ${dict.bars} compases</p>
    <div id="dictScores" class="dict-scores ${perc ? 'one' : ''}" tabindex="-1">
      <div class="dict-score main"><b>${result.score} %</b><span>Nota final</span></div>
      ${perc ? '' : `<div class="dict-score"><b>${result.pitchPct} %</b><span>Altura</span></div>`}
      <div class="dict-score"><b>${result.rhythmPct} %</b><span>Ritmo</span></div>
    </div>
    <p class="muted small center">${perc ? `${result.exact} de ${expected.length} golpes exactos` : `${result.exact} de ${expected.length} notas exactas`}</p>
    ${result.octaveShift ? '<p class="muted small center">Has tocado todo en otra octava: no resta.</p>' : ''}
    ${result.transposed ? '<p class="dict-warn" role="note">Parece que lo has tocado transportado: las distancias entre notas están bien, pero todo va desplazado. Escucha el acorde de tónica y comprueba en qué nota empiezas.</p>' : ''}
    ${!result.passed && result.score >= 80 ? `<p class="muted small center">Para superar el nivel hacen falta 80 en altura y en ritmo.</p>` : ''}
    <div class="dict-stars">${starsHtml(result.stars)}</div>
    ${result.penalty ? `<p class="muted small center">Incluye −${EXTRA_LISTEN_PENALTY} puntos por la escucha extra</p>` : ''}
    ${best}${next}
    <ul class="dict-legend">
      <li><span class="dict-sw ok" aria-hidden="true">✓</span>Nota y ritmo bien</li>
      <li><span class="dict-sw near" aria-hidden="true">≈</span>Cerca</li>
      <li><span class="dict-sw bad" aria-hidden="true">✕</span>Mal, falta o sobra</li>
    </ul>
    <div class="dict-staves" tabindex="0" role="region" aria-label="Partituras: lo que sonó y lo que has tocado">
      <p class="dict-staff-label">Lo que sonó</p>
      <svg id="dictStaffWant" class="dict-svg" role="img" aria-label="Partitura del dictado"></svg>
      <p class="dict-staff-label">Lo que has tocado</p>
      <svg id="dictStaffMine" class="dict-svg" role="img" aria-label="Partitura de lo que has tocado"></svg>
    </div>
    <div id="dictDetail" class="dict-detail" aria-live="polite"><p class="muted small">Pulsa una nota del pentagrama o de la lista para ver qué sonaba y qué tocaste.</p></div>
    <div class="dict-chips" role="group" aria-label="${perc ? 'Golpes uno a uno' : 'Notas una a una'}">${result.pairs.map((x, k) => `<button type="button" class="dict-chip ${x.state}" data-pair="${k}" aria-label="${esc(chipLabel(x, chips[k], perc))}"><span aria-hidden="true">${GLYPH[x.state]}</span><small aria-hidden="true">${chips[k] ?? '+'}</small></button>`).join('')}</div>
    <div class="controls dict-actions">
      <button id="dictHearWant" class="btn ghost" type="button">Volver a escuchar el dictado</button>
      <button id="dictHearMine" class="btn ghost" type="button">Escuchar tu versión</button>
      <button id="dictAgain" class="btn" type="button">Otro dictado</button>
      <button id="dictChange" class="btn ghost" type="button">Cambiar nivel</button>
    </div>`;
}

// «A destiempo»: en qué parte del compás sonaba y en cuál se tocó (en 6/8, contando corcheas)
const fmtCount = x => String(Math.round(x * 100) / 100).replace('.', ',');
function offBeatText(e, p, dict) {
  const inBar = x => ((x % dict.barBeats) + dict.barBeats) % dict.barBeats;
  if (Math.abs(inBar(e.start) - inBar(p.start)) < 1e-6) return '';
  const eighths = dict.meter === '6/8';
  const count = x => fmtCount((eighths ? inBar(x) * 2 : inBar(x)) + 1);
  return eighths ? `Sonaba en la corchea ${count(e.start)} · tocaste en la ${count(p.start)}` : `Sonaba en el tiempo ${count(e.start)} · tocaste en el ${count(p.start)}`;
}

function showDetail(k, { pairs, expected, played, mine, perc, nom, flats, chips, dict }) {
  const x = pairs[k];
  const e = x.e !== null ? expected[x.e] : null;
  const p = x.p !== null ? played[x.p] : null;
  const pNote = p && !perc ? (mine.score.notes[mine.heads[x.p]] || p) : p;
  const head = x.kind === 'extra' ? (perc ? 'Golpe de más' : 'Nota de más') : `${perc ? 'Golpe' : 'Nota'} ${chips[k]}`;
  $('dictDetail').innerHTML = `<p class="dict-detail-head ${x.state}"><span class="dict-sw ${x.state}" aria-hidden="true">${GLYPH[x.state]}</span><b>${head}</b> · <span>${kindText(x, perc)}</span></p>
    <dl>
      <div><dt>Sonaba</dt><dd>${e ? noteText(e, e.beats, perc, nom, flats) : '<span>Nada</span>'}</dd></div>
      <div><dt>Tocaste</dt><dd>${p ? noteText(pNote, p.beats, perc, nom, flats) : `<span>${perc ? 'Ningún golpe' : 'Ninguna nota'}</span>`}</dd></div>
    </dl>
    ${e && p && offBeatText(e, p, dict) ? `<p class="dict-offbeat"><span>A destiempo:</span> <span>${offBeatText(e, p, dict)}</span></p>` : ''}
    <p class="muted small">${perc ? '' : `<span>Altura</span> ${x.pitch}/100 · `}<span>Ritmo</span> ${x.rhythm}/100</p>`;
  document.querySelectorAll('.dict-sel').forEach(el => el.classList.remove('dict-sel'));
  if (e) highlight($('dictStaffWant'), [e.index]);
  if (p && pieceIndexes(mine.score.notes, mine.heads[x.p]).length) highlight($('dictStaffMine'), pieceIndexes(mine.score.notes, mine.heads[x.p]));
  document.querySelectorAll('.dict-chip').forEach(c => c.setAttribute('aria-pressed', String(Number(c.dataset.pair) === k)));
}

function highlight(svg, indexes) {
  const groups = svg.querySelectorAll('.st-note');
  indexes.forEach(i => groups[i] && groups[i].classList.add('dict-sel'));
  const head = groups[indexes[0]] && groups[indexes[0]].querySelector('ellipse');
  const box = svg.closest('.dict-staves');
  if (!head || !box || !svg.viewBox.baseVal || !svg.viewBox.baseVal.width) return;
  const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  const x = Number(head.getAttribute('cx')) * scale;
  if (x < box.scrollLeft + 40 || x > box.scrollLeft + box.clientWidth - 40) box.scrollLeft = Math.max(0, x - box.clientWidth / 2);
}

// Pulsar una nota del pentagrama: la pareja de esa nota
function pairFromStaff(target, svg, pairs, expected, mine, isMine) {
  const g = target.closest('.st-note');
  if (!g) return -1;
  const index = [...svg.querySelectorAll('.st-note')].indexOf(g);
  return pairs.findIndex(x => (isMine
    ? x.p !== null && pieceIndexes(mine.score.notes, mine.heads[x.p]).includes(index)
    : x.e !== null && expected[x.e].index === index));
}

function wireResult(root, { dict, mine, pairs, expected, select, actions, perc }) {
  root.querySelectorAll('.dict-chip').forEach(c => {
    c.addEventListener('click', () => select(Number(c.dataset.pair)));
    c.addEventListener('focus', () => select(Number(c.dataset.pair)));
  });
  [['dictStaffWant', false], ['dictStaffMine', true]].forEach(([id, isMine]) => {
    $(id).addEventListener('click', e => {
      const k = pairFromStaff(e.target, $(id), pairs, expected, mine, isMine);
      if (k >= 0) select(k);
    });
  });
  // Escuchar / Parar: la etiqueta original se guarda al montar y vuelve al parar, al acabar o al pulsar el otro botón
  const hearButtons = [$('dictHearWant'), $('dictHearMine')];
  hearButtons.forEach(b => { b.dataset.label = b.textContent; });
  let playing = null;
  const resetAll = () => { hearButtons.forEach(b => { b.textContent = b.dataset.label; b.setAttribute('aria-pressed', 'false'); }); playing = null; };
  const hear = (btn, notes) => {
    const wasPlaying = playing === btn;
    actions.stopAll();
    resetAll();
    if (wasPlaying) return;
    playing = btn;
    btn.textContent = 'Parar';
    btn.setAttribute('aria-pressed', 'true');
    const done = () => { if (playing === btn) resetAll(); };
    if (perc) {
      const total = notes.length ? notes[notes.length - 1].start + notes[notes.length - 1].beats : 0;
      actions.register(playDrums(notes, dict.bpm, dict.barBeats, audio.audioTime() + 0.15));
      const id = setTimeout(done, (total * 60 / dict.bpm + 0.5) * 1000);
      actions.register(() => clearTimeout(id));
    } else {
      actions.register(audio.playScore(notes, dict.bpm, (beat, end) => { if (end) done(); }));
    }
  };
  $('dictHearWant').addEventListener('click', e => hear(e.currentTarget, dict.notes));
  $('dictHearMine').addEventListener('click', e => hear(e.currentTarget, mine.score.notes));
  $('dictAgain').addEventListener('click', () => { actions.stopAll(); resetAll(); actions.again(); });
  $('dictChange').addEventListener('click', () => { actions.stopAll(); resetAll(); actions.setup(); });
}
