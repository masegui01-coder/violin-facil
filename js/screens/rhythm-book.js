// Libro de lecturas rítmicas (beta, solo testers pro y administrador): eliges compases, figuras, dificultad
// y escala, y la app genera una lectura o un libro entero de lecturas progresivas para tocar a tempo.
import { $, esc, toast } from '../ui.js';
import { register, go } from '../router.js';
import { getState, update, instrumentProgress } from '../store.js';
import { instrumentById } from '../instruments.js';
import { lessonKey } from '../course.js';
import { parseScore } from '../music.js';
import { createStaff } from '../staff.js';
import { launch } from '../launch.js';
import { MAJOR_KEYS, keyLabel } from '../generate.js';
import { sliceScore } from '../book.js';
import { VALUES, SCALE_KINDS, MAX_DIFFICULTY, generateReading, generateBook } from '../rhythm-reading.js';
import * as audio from '../audio.js';
import { scoresPdf, sharePdf, downloadPdf, openPdf } from '../pdf-export.js';

const SHARE_TEXT = 'Lectura rítmica de Band Flow para practicar: https://masegui01-coder.github.io/violin-facil/';
const EXPORT_BUTTONS = scope => `<div class="row rb-export"><button type="button" class="btn ghost small" data-pdf="${scope}" data-how="print">Imprimir</button>
  <button type="button" class="btn ghost small" data-pdf="${scope}" data-how="download">Descargar PDF</button>
  <button type="button" class="btn ghost small rb-wa" data-pdf="${scope}" data-how="share">Enviar por WhatsApp</button></div>`;

const BARS = [4, 8, 12, 16, 24, 32];
const BOOK_SIZES = [6, 12, 20];
const BARS_PER_LINE = 4;
const DIFFICULTY = ['Muy fácil', 'Fácil', 'Media', 'Difícil', 'Muy difícil'];
const DEFAULTS = { bars: 8, time: 4, values: ['h', 'q', 'e'], rests: true, difficulty: 2, tonic: 'C', scale: 'major', bpm: 72, count: 12 };

let preview = null; // { song, seed }
let stopListen = null;

export const canUseRhythmBook = () => !!(getState().proTester || getState().adminUser);
const inst = () => instrumentById(getState().instrument);
const opts = () => ({ ...DEFAULTS, ...(getState().rhythmBookOpts || {}) });
const minutes = o => Math.max(1, Math.round((o.bars * o.time * 60) / o.bpm / 60 * 10) / 10);

function formHtml(o) {
  return `<div class="panel form rb-form">
    <div class="rb-grid">
      <label>Compases<select class="select" data-opt="bars">${BARS.map(b => `<option value="${b}" ${b === o.bars ? 'selected' : ''}>${b}</option>`).join('')}</select></label>
      <label>Compás<select class="select" data-opt="time">${[2, 3, 4].map(t => `<option value="${t}" ${t === o.time ? 'selected' : ''}>${t}/4</option>`).join('')}</select></label>
      <label>Tempo ♩<input class="input" type="number" min="40" max="180" step="2" data-opt="bpm" value="${o.bpm}"></label>
    </div>
    <p class="muted small">Duración: unos ${minutes(o)} min por lectura a ♩ = ${o.bpm}.</p>
    <span class="rb-label">Figuras</span>
    <div class="chips-row wrap">${VALUES.map(v => `<button type="button" class="chip-btn" data-value="${v.id}" aria-pressed="${o.values.includes(v.id)}">${v.name}</button>`).join('')}
      <button type="button" class="chip-btn" data-rests aria-pressed="${o.rests}">Silencios</button></div>
    <span class="rb-label">Dificultad</span>
    <div class="seg five" role="group" aria-label="Dificultad">${DIFFICULTY.map((d, i) => `<button type="button" data-diff="${i + 1}" aria-pressed="${o.difficulty === i + 1}">${i + 1}</button>`).join('')}</div>
    <p class="muted small">${DIFFICULTY[o.difficulty - 1]}${o.difficulty >= 4 ? ': con síncopas y saltos' : o.difficulty >= 3 ? ': con combinaciones de semicorcheas' : ''}${o.difficulty >= 5 ? ' y acentos' : ''}.</p>
    <div class="rb-grid">
      <label>Escala de<select class="select" data-opt="tonic">${MAJOR_KEYS.map(k => `<option value="${k}" ${k === o.tonic ? 'selected' : ''}>${esc(keyLabel(k).replace(' mayor', ''))}</option>`).join('')}</select></label>
      <label>Tipo<select class="select" data-opt="scale">${SCALE_KINDS.map(([id, name]) => `<option value="${id}" ${id === o.scale ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
      <label>Lecturas del libro<select class="select" data-opt="count">${BOOK_SIZES.map(n => `<option value="${n}" ${n === o.count ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    </div>
    <div class="row"><button type="button" class="btn" id="rbOne">Generar una lectura</button><button type="button" class="btn ghost" id="rbBook">Crear el libro</button></div></div>`;
}

function staffLines(song) {
  const score = parseScore(song.score);
  const lines = Math.ceil(score.bars.length / BARS_PER_LINE);
  return { score, lines };
}

function previewHtml() {
  if (!preview) return '';
  const { lines } = staffLines(preview.song);
  return `<div class="book-sheet rb-preview"><header class="bp-head"><div><p class="eyebrow">Lectura generada</p><h2>${esc(preview.song.title)}</h2><p class="muted">${esc(preview.song.by)}</p></div></header>
    ${Array.from({ length: lines }, (_, i) => `<div class="bp-system"><svg class="staff" id="rbs-${i}" role="img" aria-label="Lectura, renglón ${i + 1}"></svg></div>`).join('')}
    <div class="row"><button type="button" class="btn" id="rbPlay">Tocar a tempo</button><button type="button" class="btn ghost small" id="rbListen">Escuchar</button><button type="button" class="btn ghost small" id="rbAgain">Otra</button></div>
    ${EXPORT_BUTTONS('one')}</div>`;
}

function bookHtml() {
  const saved = getState().rhythmBook;
  if (!saved) return '';
  const book = generateBook({ ...saved.opts, inst: inst(), seed: saved.seed }, saved.opts.count);
  const progress = instrumentProgress();
  return `<h2>Tu libro de lecturas rítmicas</h2><p class="muted small">${book.length} lecturas · de las figuras largas a todas las elegidas, subiendo la dificultad poco a poco.</p>
    ${EXPORT_BUTTONS('book')}
    <div class="book-pages">${book.map(x => {
      const stars = progress[lessonKey({ id: x.id })] || 0;
      return `<button type="button" class="book-page${stars ? ' bronze' : ''}" data-reading="${x.number}"><span class="book-num">${x.number}</span>
        <span class="book-text"><b>${esc(x.song.title)}</b><small>${x.values.map(v => VALUES.find(y => y.id === v).name.toLowerCase()).join(', ')} · dificultad ${x.difficulty}</small></span>
        <span class="book-medal">${stars ? '★'.repeat(stars) : '○'}</span></button>`;
    }).join('')}</div>`;
}

function drawPreview() {
  if (!preview) return;
  const { score, lines } = staffLines(preview.song);
  for (let i = 0; i < lines; i++) {
    const slice = sliceScore(score, i * BARS_PER_LINE, BARS_PER_LINE);
    createStaff($(`rbs-${i}`)).render(slice, { key: preview.song.key, time: preview.song.time, mode: 'review', clef: inst().clef || 'treble' });
  }
}

function render() {
  stopAudio();
  if (!canUseRhythmBook()) { $('rbBody').innerHTML = '<p class="muted">Esta herramienta está en pruebas solo para testers pro.</p>'; return; }
  const o = opts();
  $('rbBody').innerHTML = `<p class="muted small"><span class="beta-pill">Beta</span> Para ${esc(inst().name.toLowerCase())}: lecturas para dominar figuras, silencios y combinaciones sobre las notas de una escala, sin que la afinación sea el reto.</p>
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

// Renglones de una lectura dibujados fuera de la pantalla (para el PDF del libro entero)
function offscreenSystems(host, song) {
  const { score, lines } = staffLines(song);
  return Array.from({ length: lines }, (_, i) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'staff');
    host.appendChild(svg);
    createStaff(svg).render(sliceScore(score, i * BARS_PER_LINE, BARS_PER_LINE), { key: song.key, time: song.time, mode: 'review', clef: inst().clef || 'treble' });
    return svg;
  });
}

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
    if (scope === 'one') {
      items = [{ title: preview.song.title, sub: `${preview.song.by} · tempo ${preview.song.bpm}`, svgs: [...document.querySelectorAll('.rb-preview svg.staff')] }];
      name = `lectura-ritmica-${preview.seed % 1000}.pdf`;
    } else {
      const saved = getState().rhythmBook;
      const book = generateBook({ ...saved.opts, inst: inst(), seed: saved.seed }, saved.opts.count);
      items = book.map(x => ({ title: x.song.title, sub: `${x.song.by} · tempo ${x.song.bpm}`, svgs: offscreenSystems(host, x.song) }));
      name = `libro-lecturas-ritmicas-${inst().id}.pdf`;
    }
    const blob = await scoresPdf(items, { footer: `Band Flow · lecturas rítmicas · ${inst().name}` });
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
  const value = ['tonic', 'scale'].includes(key) ? el.value : Math.min(180, Math.max(key === 'bpm' ? 40 : 1, Number(el.value) || DEFAULTS[key]));
  setOpts({ [key]: value });
});

$('rbBody').addEventListener('click', e => {
  const t = e.target;
  const value = t.closest('[data-value]');
  if (value) {
    const o = opts();
    const values = o.values.includes(value.dataset.value) ? o.values.filter(v => v !== value.dataset.value) : [...o.values, value.dataset.value];
    if (!values.some(v => ['q', 'h', 'w', 'e'].includes(v))) { toast('Deja al menos la negra, la blanca, la redonda o la corchea'); return; }
    setOpts({ values });
    return;
  }
  if (t.closest('[data-rests]')) { setOpts({ rests: !opts().rests }); return; }
  const diff = t.closest('[data-diff]');
  if (diff) { setOpts({ difficulty: Math.min(MAX_DIFFICULTY, Number(diff.dataset.diff)) }); return; }
  const reading = t.closest('[data-reading]');
  if (reading) {
    const saved = getState().rhythmBook;
    const x = generateBook({ ...saved.opts, inst: inst(), seed: saved.seed }, saved.opts.count)[Number(reading.dataset.reading) - 1];
    play(x.song, x.id);
    return;
  }
  if (t.id === 'rbOne' || t.id === 'rbAgain') {
    const seed = Math.floor(Math.random() * 1e6);
    preview = { seed, song: generateReading({ ...opts(), inst: inst(), seed, title: `Lectura rítmica ${seed % 1000}` }) };
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
