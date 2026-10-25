// Gráficos ligeros en SVG/HTML para los paneles: columnas por día, barras horizontales, minigráficas y cifras.
// Barras finas (≤ 24 px) con el extremo redondeado, rejilla tenue y el valor solo donde importa; el resto, en el tooltip.
import { esc } from './ui.js';

const PAD = { top: 18, right: 6, bottom: 22, left: 30 };
const MAX_BAR = 24;
const GAP = 2;

// Escala «redonda» para el eje (0, 30, 60…)
export function niceMax(v) {
  if (v <= 0) return 10;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map(k => k * p).find(n => n >= v);
}

// Barra con el extremo superior redondeado (4 px) y la base recta
const bar = (x, y, w, h) => {
  const r = Math.min(4, w / 2, h);
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
};

// series: [{ label, value, tip, strong }]; xLabels: índices que llevan etiqueta en el eje
export function columns(series, { height = 140, width = 340, unit = '', xLabels = null, title = '' } = {}) {
  const max = niceMax(Math.max(...series.map(s => s.value), 0));
  const w = width - PAD.left - PAD.right, h = height - PAD.top - PAD.bottom;
  const slot = w / series.length;
  const bw = Math.min(MAX_BAR, slot - GAP);
  const y = v => PAD.top + h - (v / max) * h;
  const grid = [0, max / 2, max].map(v => `<line x1="${PAD.left}" x2="${width - PAD.right}" y1="${y(v)}" y2="${y(v)}" class="ch-grid"/>
    <text x="${PAD.left - 6}" y="${y(v) + 4}" class="ch-axis" text-anchor="end">${Math.round(v)}</text>`).join('');
  const labelAt = xLabels || [0, Math.floor(series.length / 2), series.length - 1];
  const bars = series.map((s, i) => {
    const x = PAD.left + i * slot + (slot - bw) / 2;
    const bh = Math.max(s.value > 0 ? 2 : 0, (s.value / max) * h);
    return `<g class="ch-hit" data-tip="${esc(s.tip || `${s.label}: ${s.value} ${unit}`)}">
      <rect x="${PAD.left + i * slot}" y="${PAD.top}" width="${slot}" height="${h}" fill="transparent"/>
      ${bh ? `<path d="${bar(x, PAD.top + h - bh, bw, bh)}" class="ch-bar${s.strong ? ' strong' : ''}"/>` : ''}
      ${s.strong && s.value ? `<text x="${x + bw / 2}" y="${PAD.top + h - bh - 5}" class="ch-value" text-anchor="middle">${s.value}</text>` : ''}
      ${labelAt.includes(i) ? `<text x="${x + bw / 2}" y="${height - 6}" class="ch-axis" text-anchor="middle">${esc(s.label)}</text>` : ''}</g>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">${grid}${bars}</svg>`;
}

// Barras horizontales con el valor al final: [{ label, value, display, sub }]
export function hbars(rows, { max = null } = {}) {
  const top = max || Math.max(1, ...rows.map(r => r.value));
  return `<div class="hbars">${rows.map(r => `<div class="hbar"><span class="hbar-label">${esc(r.label)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>
    <span class="hbar-track"><i style="width:${Math.max(r.value > 0 ? 2 : 0, Math.round(r.value / top * 100))}%"></i></span><b>${esc(r.display ?? String(r.value))}</b></div>`).join('')}</div>`;
}

// Minigráfica de columnas (actividad de un músico): sin ejes, la última barra destacada
export function sparkbars(values, { width = 84, height = 26 } = {}) {
  const max = Math.max(1, ...values);
  const slot = width / values.length, bw = Math.max(2, slot - GAP);
  return `<svg class="sparkbars" viewBox="0 0 ${width} ${height}" aria-hidden="true">${values.map((v, i) => {
    const bh = v > 0 ? Math.max(2, v / max * height) : 0;
    return bh ? `<rect x="${i * slot}" y="${height - bh}" width="${bw}" height="${bh}" rx="1.5" class="${i === values.length - 1 ? 'strong' : ''}"/>` : `<rect x="${i * slot}" y="${height - 1}" width="${bw}" height="1" class="zero"/>`;
  }).join('')}</svg>`;
}

// Cifra con su comparación: { label, value, delta (texto), good (true/false/null) }
export function statTile({ label, value, delta = '', good = null, hint = '' }) {
  return `<div class="tile"><span class="tile-label">${esc(label)}</span><b class="tile-value">${esc(String(value))}</b>
    ${delta ? `<span class="tile-delta ${good === true ? 'up' : good === false ? 'down' : ''}">${good === true ? '▲' : good === false ? '▼' : ''} ${esc(delta)}</span>` : ''}
    ${hint ? `<small class="tile-hint">${esc(hint)}</small>` : ''}</div>`;
}

// Tooltip compartido: al pasar o tocar cualquier elemento con data-tip
let tipEl = null;
export function attachTooltips(root) {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'ch-tip';
    tipEl.hidden = true;
    document.body.appendChild(tipEl);
  }
  const show = e => {
    const t = e.target.closest('[data-tip]');
    if (!t || !root.contains(t)) { tipEl.hidden = true; return; }
    tipEl.textContent = t.dataset.tip;
    tipEl.hidden = false;
    const r = t.getBoundingClientRect();
    tipEl.style.left = Math.min(window.innerWidth - tipEl.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - tipEl.offsetWidth / 2)) + 'px';
    tipEl.style.top = Math.max(8, r.top - tipEl.offsetHeight - 8) + 'px';
  };
  root.addEventListener('pointerover', show);
  root.addEventListener('click', show);
  root.addEventListener('pointerleave', () => { tipEl.hidden = true; });
}
