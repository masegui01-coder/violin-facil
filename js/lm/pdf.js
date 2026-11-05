// Ficha de la unidad en PDF (opcional, para imprimir): novedades, objetivos, la teoría, la canción con su partitura
// y la lista de ejercicios. En inglés sale traducida.
import { createPdf } from '../pdf-writer.js';
import { svgToPng, sharePdf } from '../pdf-export.js';
import { engrave, svgElement } from '../engrave.js';
import { parseScore } from '../music.js';
import { t, currentLang } from '../i18n.js';
import { getState } from '../store.js';
import { SECTION_NAME, VARIANT_NAME } from './catalog.js';
import { figureHtml, CARD_FIGURE } from './figures/index.js';

const MARGIN = 16;
const WIDTH = 178;
const FIGURE_W = 96; // ancho de cada ilustración en el papel (mm)
// Papel blanco: los colores del tema claro, sea cual sea el de la pantalla (y el de la unidad)
const LIGHT_UNITS = ['#B4461F', '#17798A', '#5D4A9C', '#2B7A4B', '#A3385A', '#2F55A4', '#8C5A12', '#3B4A5E'];
const PAPER = '--surface:#FFFFFF;--surface-2:#F5F7FA;--ink:#141B26;--muted:#5A6678;--staff:#2F3947;--ok:#16804F;--bad:#C2372F;--u2:#17798A;--accent:#B4461F';

// La ilustración fija de una tarjeta como imagen: se pinta fuera de la vista con los colores del papel y se rasteriza
async function figureImage(dibujo, unit) {
  const html = figureHtml(dibujo, { lang: currentLang(), nom: getState().nom, still: true });
  if (!html) return null;
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = `position:fixed;left:-10000px;top:0;width:360px;${PAPER};--unit:${LIGHT_UNITS[(unit - 1) % 8]}`;
  box.innerHTML = html;
  document.body.append(box);
  try { return await svgToPng(box.querySelector('svg')); } catch (e) { return null; } finally { box.remove(); }
}
const BOTTOM = 280;
const CHARS_PER_MM = 0.52; // Helvetica 10 pt, aproximado
const plain = s => String(t(s)).replace(/[«»“”]/g, '"').replace(/[♯]/g, '#').replace(/[♭]/g, 'b').replace(/—/g, '-').replace(/…/g, '...');

function wrap(text, size) {
  const max = Math.floor(WIDTH * CHARS_PER_MM * 10 / size);
  const out = [];
  let line = '';
  plain(text).split(/\s+/).forEach(w => {
    if ((line + ' ' + w).trim().length > max) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
  });
  if (line) out.push(line);
  return out;
}

export async function unitPdf(unit) {
  const doc = createPdf().page();
  let y = MARGIN;
  const room = h => { if (y + h > BOTTOM) { doc.page(); y = MARGIN; } };
  const para = (text, { size = 10, bold = false, gray = 0, gap = 1.5 } = {}) => {
    wrap(text, size).forEach(l => { room(size * 0.5); doc.text(l, MARGIN, y + size * 0.4, { size, bold, gray }); y += size * 0.45; });
    y += gap;
  };
  para(`${t('Lenguaje musical')} · ${t('Nivel')} ${unit.level} · ${t('Unidad')} ${unit.unit}`, { size: 9, gray: 100 });
  para(unit.title, { size: 18, bold: true, gap: 1 });
  para(unit.goal, { size: 11, gray: 70, gap: 4 });
  para(t('Novedades'), { size: 12, bold: true });
  unit.novelties.forEach(n => para(`- ${plain(n)}`));
  y += 2;
  para(t('Objetivos'), { size: 12, bold: true });
  unit.objectives.forEach(n => para(`- ${plain(n)}`));
  y += 2;
  para(t('Teoría'), { size: 12, bold: true });
  const cards = unit.raw.teoria.ficha || [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    room(12);
    para(c.titulo, { bold: true, gap: 0.5 });
    const img = await figureImage(c.dibujo || CARD_FIGURE[`lm${unit.level}-u${unit.unit}-${i + 1}`], unit.unit);
    if (img) {
      const h = FIGURE_W * img.ratio;
      room(h);
      doc.image(img.data, MARGIN, y, FIGURE_W, h, img.w, img.h);
      y += h + 1;
    }
    para(c.texto, { gap: 2.5 });
  }
  if (unit.song) {
    room(40);
    para(`${t('Canción de la unidad')}: ${plain(unit.song.titulo)}`, { size: 12, bold: true });
    const [num, den] = String(unit.song.compas).split('/').map(Number);
    for (const markup of engrave(parseScore(unit.song.partitura), { key: 'C', meter: [num, den], clef: 'treble', tempo: { unit: 'q', bpm: unit.song.tempo } })) {
      const img = await svgToPng(svgElement(markup));
      const h = WIDTH * img.ratio;
      room(h);
      doc.image(img.data, MARGIN, y, WIDTH, h, img.w, img.h);
      y += h + 1;
    }
    if (unit.song.letra) para(unit.song.letra.map(bar => bar.join('')).filter(Boolean).join(' / '), { size: 9, gray: 60, gap: 4 });
  }
  para(t('Ejercicios'), { size: 12, bold: true });
  unit.exercises.forEach(e => para(`${plain(SECTION_NAME[e.section])} · ${plain(e.title)} (${plain(VARIANT_NAME[e.variant])})`, { size: 9, gap: 0.6 }));
  const blob = doc.footer((n, total) => `Band Flow · ${plain(unit.title)} - ${n}/${total}`).blob();
  return sharePdf(blob, `lenguaje-musical-u${unit.unit}.pdf`, plain(unit.title));
}
