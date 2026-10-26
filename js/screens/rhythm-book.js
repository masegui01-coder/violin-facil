// Libro de lecturas (beta, solo testers pro y administrador): lecturas a primera vista en 10 niveles, hasta el de las
// pruebas de acceso a enseñanzas superiores. Se eligen nivel, compases, tonalidad, figuras y elementos, y la app genera
// una lectura o un libro entero, grabados como una partitura impresa, para tocar a tempo, imprimir o enviar en PDF.
import { $, esc, toast } from '../ui.js';
import { register, go } from '../router.js';
import { getState, update, instrumentProgress } from '../store.js';
import { currentAccount } from '../account.js';
import { instrumentById } from '../instruments.js';
import { lessonKey } from '../course.js';
import { parseScore } from '../music.js';
import { launch } from '../launch.js';
import { keyLabel } from '../generate.js';
import { engrave, svgElement } from '../engrave.js';
import { MAX_LEVEL, LEVELS, FAMILIES, FAMILY_IDS, METERS, KEYS, generateReading, generateBook } from '../rhythm-reading.js';
import * as audio from '../audio.js';
import { scoresPdf, sharePdf, downloadPdf, openPdf } from '../pdf-export.js';
import { L } from '../tips-l10n.js';

// Textos de la pantalla con su traducción
[
  ['Iniciación: redondas, blancas y negras', 'Beginner: whole, half and quarter notes'],
  ['Corcheas y silencios', 'Eighth notes and rests'],
  ['Puntillo, semicorcheas y ligaduras', 'Dots, sixteenth notes and ties'],
  ['Síncopas, combinaciones y compás de 6/8', 'Syncopation, combinations and 6/8 time'],
  ['Tresillos, matices y agógica', 'Triplets, dynamics and tempo changes'],
  ['Seisillos, cromatismos y cambios de compás', 'Sextuplets, chromaticism and changing meters'],
  ['Fusas, compases de amalgama y saltos amplios', 'Thirty-second notes, mixed meters and wide leaps'],
  ['Profesional: adornos, trinos y cambios de tonalidad y de carácter', 'Professional: grace notes, trills and changes of key and character'],
  ['Prueba de acceso a enseñanzas superiores', 'Conservatory (higher education) entrance exam'],
  ['Virtuoso: todo a la vez y cambios en cada compás', 'Virtuoso: everything at once, changing every bar'],
  ['Redondas', 'Whole notes'],
  ['Blancas', 'Half notes'],
  ['Negras', 'Quarter notes'],
  ['Corcheas', 'Eighth notes'],
  ['Semicorcheas', 'Sixteenth notes'],
  ['Fusas', 'Thirty-second notes'],
  ['Puntillos', 'Dots'],
  ['Tresillos', 'Triplets'],
  ['Seisillos y quintillos', 'Sextuplets and quintuplets'],
  ['Síncopas', 'Syncopation'],
  ['Ligaduras de prolongación', 'Ties'],
  ['Matices y reguladores', 'Dynamics and hairpins'],
  ['Articulaciones y ligaduras', 'Articulation and slurs'],
  ['Agógica (rit., accel., calderones)', 'Tempo changes (rit., accel., fermatas)'],
  ['Alteraciones accidentales', 'Accidentals'],
  ['Técnicas extendidas (slap, frulato…)', 'Extended techniques (slap, flutter-tongue…)'],
  ['Sin cambios de clave', 'No clef changes'],
  ['Sol y fa', 'Treble and bass'],
  ['Sol, fa y do (3.ª y 4.ª)', 'Treble, bass, alto and tenor'],
  ['El 7-8 equivale a una lectura de grado profesional y el 9, a una prueba de acceso a enseñanzas superiores.', 'Levels 7-8 match professional-grade sight-reading and level 9 a conservatory entrance exam.'],
  ['Compás', 'Time signature'],
  ['Variable (cambia)', 'Variable (changes)'],
  ['Tonalidad', 'Key'],
  ['Aleatoria', 'Random'],
  ['Modo', 'Mode'],
  ['Mayor o menor', 'Major or minor'],
  ['Menor', 'Minor'],
  ['Cambios de clave', 'Clef changes'],
  ['Elementos', 'Elements'],
  ['Lectura generada', 'Generated reading'],
  ['Tu libro de lecturas', 'Your reading book'],
  ['Libro de lecturas', 'Reading book'],
  ['Lecturas a primera vista en 10 niveles, hasta prueba de acceso a superior', 'Sight-reading in 10 levels, up to conservatory entrance'],
  ['Al tocar a tempo la app mide el ritmo y las notas a pulso constante (sin rit. ni cambios de tempo).', 'When you play in time the app checks rhythm and notes at a steady pulse (no rit. or tempo changes).'],
  ['Compases variables', 'Changing meters'],
  ['Blanca con doble puntillo', 'Double-dotted half note'],
  ['Negra con doble puntillo', 'Double-dotted quarter note'],
  ['Corchea con doble puntillo', 'Double-dotted eighth note'],
  ['Semicorchea con puntillo', 'Dotted sixteenth note'],
  ['Redonda con puntillo', 'Dotted whole note'],
  ['Fusa', 'Thirty-second note'],
].forEach(([es, en]) => L(es, en));

const SHARE_TEXT = 'Lectura de Band Flow para practicar: https://masegui01-coder.github.io/violin-facil/';
const EXPORT_BUTTONS = scope => `<div class="row rb-export"><button type="button" class="btn ghost small" data-pdf="${scope}" data-how="print">Imprimir</button>
  <button type="button" class="btn ghost small" data-pdf="${scope}" data-how="download">Descargar PDF</button>
  <button type="button" class="btn ghost small rb-wa" data-pdf="${scope}" data-how="share">Enviar por WhatsApp</button></div>`;

const BARS = [8, 12, 16, 24, 32, 48, 64, 96];
const BOOK_SIZES = [6, 12, 20];
const TOGGLES = [['dynamics', 'Matices y reguladores'], ['articulation', 'Articulaciones y ligaduras'], ['agogic', 'Agógica (rit., accel., calderones)'],
  ['chromatic', 'Alteraciones accidentales'], ['extended', 'Técnicas extendidas (slap, frulato…)']];
const CLEF_OPTIONS = [['none', 'Sin cambios de clave'], ['solfa', 'Sol y fa'], ['all', 'Sol, fa y do (3.ª y 4.ª)']];
const DEFAULTS = { bars: 16, meter: 'var', bpm: 72, level: 3, key: 'random', scale: 'any', families: FAMILY_IDS, rests: true,
  dynamics: true, articulation: true, agogic: true, chromatic: true, extended: false, clefs: 'none', count: 12 };

let preview = null; // { song, seed }
let stopListen = null;

export const canUseRhythmBook = () => !!(getState().proTester || getState().adminUser);
const inst = () => instrumentById(getState().instrument);
// Opciones guardadas (las de la versión anterior tenían dificultad 1-5: se pasa a nivel)
function opts() {
  const saved = getState().rhythmBookOpts || {};
  const level = saved.level || (saved.difficulty ? Math.min(MAX_LEVEL, saved.difficulty * 2 - 1) : DEFAULTS.level);
  return { ...DEFAULTS, ...saved, level, families: Array.isArray(saved.families) ? saved.families : DEFAULTS.families };
}
const minutes = o => Math.max(1, Math.round((o.bars * 3 * 60) / o.bpm / 60 * 10) / 10);
const keyText = k => (k === 'random' ? 'Aleatoria' : keyLabel(k));
const pressed = on => `aria-pressed="${!!on}"`;

function formHtml(o) {
  return `<div class="panel form rb-form">
    <span class="rb-label">Nivel</span>
    <div class="seg rb-levels" role="group" aria-label="Nivel">${Array.from({ length: MAX_LEVEL }, (_, i) => `<button type="button" data-level="${i + 1}" ${pressed(o.level === i + 1)}>${i + 1}</button>`).join('')}</div>
    <p class="small"><b>${esc(LEVELS[o.level - 1])}</b></p>
    <p class="muted small">El 7-8 equivale a una lectura de grado profesional y el 9, a una prueba de acceso a enseñanzas superiores.</p>
    <div class="rb-grid">
      <label>Compases<select class="select" data-opt="bars">${BARS.map(b => `<option value="${b}" ${b === o.bars ? 'selected' : ''}>${b}</option>`).join('')}</select></label>
      <label>Compás<select class="select" data-opt="meter"><option value="var" ${o.meter === 'var' ? 'selected' : ''}>Variable (cambia)</option>${METERS.map(m => `<option value="${m}" ${m === o.meter ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
      <label>Tempo ♩<input class="input" type="number" min="30" max="200" step="2" data-opt="bpm" value="${o.bpm}"></label>
      <label>Tonalidad<select class="select" data-opt="key"><option value="random" ${o.key === 'random' ? 'selected' : ''}>Aleatoria</option>${KEYS.map(k => `<option value="${k}" ${k === o.key ? 'selected' : ''}>${esc(keyLabel(k))}</option>`).join('')}</select></label>
      ${o.key === 'random' ? `<label>Modo<select class="select" data-opt="scale">${[['any', 'Mayor o menor'], ['major', 'Mayor'], ['minor', 'Menor']].map(([v, t]) => `<option value="${v}" ${v === o.scale ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}
      <label>Cambios de clave<select class="select" data-opt="clefs">${CLEF_OPTIONS.map(([v, t]) => `<option value="${v}" ${v === o.clefs ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label>Lecturas del libro<select class="select" data-opt="count">${BOOK_SIZES.map(n => `<option value="${n}" ${n === o.count ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    </div>
    <p class="muted small">Unos ${minutes(o)} min por lectura. Con «Variable» el compás cambia cada pocos compases (en los niveles altos, casi en cada uno). Los cambios de clave empiezan en el nivel 6.</p>
    <span class="rb-label">Figuras</span>
    <div class="chips-row wrap">${FAMILIES.map(f => `<button type="button" class="chip-btn" data-family="${f.id}" ${pressed(f.id === 'rest' ? o.rests && o.families.includes('rest') : o.families.includes(f.id))}>${f.name}</button>`).join('')}</div>
    <span class="rb-label">Elementos</span>
    <div class="chips-row wrap">${TOGGLES.map(([k, t]) => `<button type="button" class="chip-btn" data-toggle="${k}" ${pressed(o[k])}>${t}</button>`).join('')}</div>
    <div class="row"><button type="button" class="btn" id="rbOne">Generar una lectura</button><button type="button" class="btn ghost" id="rbBook">Crear el libro</button></div></div>`;
}

const engraveSong = song => engrave(parseScore(song.score), { key: song.key, meter: song.meter, clef: inst().clef || 'treble', tempo: { unit: 'q', bpm: song.bpm } });

function previewHtml() {
  if (!preview) return '';
  return `<div class="book-sheet rb-preview"><header class="bp-head"><div><p class="eyebrow">Lectura generada</p><h2>${esc(preview.song.title)}</h2><p class="muted">${esc(keyText(preview.song.key))} · ${esc(preview.song.by)}</p></div></header>
    <div class="rb-systems" id="rbSystems"></div>
    <div class="row"><button type="button" class="btn" id="rbPlay">Tocar a tempo</button><button type="button" class="btn ghost small" id="rbListen">Escuchar</button><button type="button" class="btn ghost small" id="rbAgain">Otra</button></div>
    <p class="muted small">Al tocar a tempo la app mide el ritmo y las notas a pulso constante (sin rit. ni cambios de tempo).</p>
    ${EXPORT_BUTTONS('one')}</div>`;
}

function savedBook() {
  const saved = getState().rhythmBook;
  if (!saved) return null;
  const o = { ...DEFAULTS, ...saved.opts, level: saved.opts.level || Math.min(MAX_LEVEL, (saved.opts.difficulty || 2) * 2 - 1) };
  return { o, book: generateBook({ ...o, inst: inst(), seed: saved.seed }, o.count) };
}

function bookHtml() {
  const saved = savedBook();
  if (!saved) return '';
  const progress = instrumentProgress();
  return `<h2>Tu libro de lecturas</h2><p class="muted small">${saved.book.length} lecturas, del nivel ${saved.book[0].level} al ${saved.book[saved.book.length - 1].level}.</p>
    ${EXPORT_BUTTONS('book')}
    <div class="book-pages">${saved.book.map(x => {
      const stars = progress[lessonKey({ id: x.id })] || 0;
      return `<button type="button" class="book-page${stars ? ' bronze' : ''}" data-reading="${x.number}"><span class="book-num">${x.number}</span>
        <span class="book-text"><b>${esc(x.song.title)}</b><small>${esc(keyText(x.song.key))} · ${esc(x.song.by)}</small></span>
        <span class="book-medal">${stars ? '★'.repeat(stars) : '○'}</span></button>`;
    }).join('')}</div>`;
}

function drawPreview() {
  if (!preview) return;
  const host = $('rbSystems');
  engraveSong(preview.song).forEach(markup => host.appendChild(svgElement(markup)));
}

function render() {
  stopAudio();
  if (!canUseRhythmBook()) {
    const acc = currentAccount();
    $('rbBody').innerHTML = `<p class="muted">Esta herramienta está en pruebas solo para testers pro.</p>
      <p class="muted small">${acc ? `Has entrado con <b>${esc(acc.email || acc.displayName || '')}</b>. Pide al administrador que te marque como tester pro en su panel.` : 'Entra con tu cuenta de tester para usarla.'}</p>`;
    return;
  }
  const o = opts();
  $('rbBody').innerHTML = `<p class="muted small"><span class="beta-pill">Beta</span> Lecturas a primera vista para ${esc(inst().name.toLowerCase())}, en su registro y escritas como una partitura impresa.</p>
    ${formHtml(o)}${previewHtml()}${bookHtml()}`;
  drawPreview();
}

const setOpts = patch => { update({ rhythmBookOpts: { ...opts(), ...patch } }); render(); };

function stopAudio() {
  if (stopListen) stopListen();
  stopListen = null;
}

function play(song, id) {
  stopAudio();
  launch({ id, kind: 'song', title: song.title, sub: song.by, song }, { mode: 'tempo', from: 'rhythmbook' });
}

register('rhythmbook', { enter: render, leave: stopAudio });

async function exportPdf(scope, how, btn) {
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Preparando…';
  const host = document.createElement('div');
  host.className = 'rb-offscreen';
  document.body.appendChild(host);
  try {
    let items;
    let name;
    const asSvgs = song => engraveSong(song).map(markup => host.appendChild(svgElement(markup)));
    if (scope === 'one') {
      items = [{ title: preview.song.title, sub: `${keyText(preview.song.key)} · ${preview.song.by}`, svgs: asSvgs(preview.song) }];
      name = `lectura-${preview.seed % 1000}.pdf`;
    } else {
      const { book } = savedBook();
      items = book.map(x => ({ title: x.song.title, sub: `${keyText(x.song.key)} · ${x.song.by}`, svgs: asSvgs(x.song) }));
      name = `libro-de-lecturas-${inst().id}.pdf`;
    }
    const blob = await scoresPdf(items, { footer: `Band Flow · lecturas · ${inst().name}` });
    if (how === 'print') openPdf(blob);
    else if (how === 'download') downloadPdf(blob, name);
    else {
      const result = await sharePdf(blob, name, SHARE_TEXT);
      if (result === 'downloaded') {
        toast('PDF descargado: adjúntalo en WhatsApp');
        window.open(`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`, '_blank');
      }
    }
  } catch (err) {
    toast('No he podido crear el PDF. Comprueba la conexión e inténtalo de nuevo.');
  } finally {
    host.remove();
    btn.disabled = false;
    btn.textContent = label;
  }
}

$('rbBody').addEventListener('change', e => {
  const el = e.target.closest('[data-opt]');
  if (!el) return;
  const key = el.dataset.opt;
  const numeric = { bars: [4, 96], bpm: [30, 200], count: [1, 40] };
  const value = numeric[key] ? Math.min(numeric[key][1], Math.max(numeric[key][0], Number(el.value) || DEFAULTS[key])) : el.value;
  setOpts({ [key]: value });
});

$('rbBody').addEventListener('click', e => {
  const t = e.target;
  const level = t.closest('[data-level]');
  if (level) { setOpts({ level: Number(level.dataset.level) }); return; }
  const fam = t.closest('[data-family]');
  if (fam) {
    const o = opts();
    const id = fam.dataset.family;
    if (id === 'rest') { setOpts({ rests: !(o.rests && o.families.includes('rest')), families: o.families.includes('rest') ? o.families : [...o.families, 'rest'] }); return; }
    const families = o.families.includes(id) ? o.families.filter(f => f !== id) : [...o.families, id];
    if (!families.some(f => ['q', 'h', 'w', 'e'].includes(f))) { toast('Deja al menos la negra, la blanca, la redonda o la corchea'); return; }
    setOpts({ families });
    return;
  }
  const toggle = t.closest('[data-toggle]');
  if (toggle) { setOpts({ [toggle.dataset.toggle]: !opts()[toggle.dataset.toggle] }); return; }
  const reading = t.closest('[data-reading]');
  if (reading) {
    const x = savedBook().book[Number(reading.dataset.reading) - 1];
    play(x.song, x.id);
    return;
  }
  if (t.id === 'rbOne' || t.id === 'rbAgain') {
    const seed = Math.floor(Math.random() * 1e6);
    preview = { seed, song: generateReading({ ...opts(), inst: inst(), seed, title: `Lectura ${seed % 1000}` }) };
    render();
    return;
  }
  if (t.id === 'rbBook') {
    const o = opts();
    update({ rhythmBook: { opts: { ...o }, seed: Math.floor(Math.random() * 1e6) } });
    toast(`Libro de ${o.count} lecturas creado`);
    render();
    return;
  }
  const pdf = t.closest('[data-pdf]');
  if (pdf) { exportPdf(pdf.dataset.pdf, pdf.dataset.how, pdf); return; }
  if (t.id === 'rbPlay' && preview) { play(preview.song, `rl-p-${preview.seed}`); return; }
  if (t.id === 'rbListen' && preview) {
    if (stopListen) { stopAudio(); t.textContent = 'Escuchar'; return; }
    stopListen = audio.playScore(parseScore(preview.song.score).notes, preview.song.bpm, (beat, done) => { if (done) { stopListen = null; t.textContent = 'Escuchar'; } });
    t.textContent = 'Parar';
  }
});

// Botón en Estudio, solo para quien puede usarlo
export function refreshRhythmBookTool() {
  const tool = $('toolRhythmBook');
  if (tool) tool.hidden = !canUseRhythmBook();
}
$('toolRhythmBook').addEventListener('click', () => go('rhythmbook'));
