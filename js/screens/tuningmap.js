// Mapa de afinación: media y dispersión de cada nota a partir de todo lo que has tocado con este instrumento.
import { $, esc } from '../ui.js';
import { register, go } from '../router.js';
import { commonLabel, commonSpell, signedCents } from '../music.js';
import { instrumentById } from '../instruments.js';
import { getState } from '../store.js';
import { tuningStats, mapSummary, MIN_SAMPLES } from '../tuning-map.js';

export { tuningStats };
const SCALE_CENTS = 30;

const colorFor = c => (Math.abs(c) < 5 ? 'var(--ok)' : Math.abs(c) < 12 ? 'var(--warn)' : 'var(--bad)');

function render() {
  const s = getState();
  const inst = instrumentById(s.instrument);
  const data = s.tuning[s.instrument] || {};
  const rows = Object.entries(data).map(([midi, e]) => ({ midi: Number(midi), ...tuningStats(e) })).sort((a, b) => b.midi - a.midi);
  // Con la octava (en nomenclatura europea noteLabel no la lleva): dos filas «Do» eran ambiguas
  const name = r => commonLabel(r.midi, s.nom) + (s.nom === 'us' ? '' : commonSpell(r.midi).oct);
  $('tmSummary').textContent = mapSummary(rows, inst.name, name);
  $('tmLegend').hidden = !rows.length;
  $('tmList').innerHTML = rows.map(r => {
    const w = Math.min(50, Math.abs(r.mean) / SCALE_CENTS * 50);
    const left = r.mean >= 0 ? 50 : 50 - w;
    return `<button type="button" class="tm-row${r.n < MIN_SAMPLES ? ' few' : ''}" data-midi="${r.midi}"><b>${esc(name(r))}</b>
      <span class="tm-bar" title="${Math.round(r.mean)} cents"><i style="left:${left}%;width:${w}%;background:${colorFor(r.mean)}"></i></span>
      <small>${signedCents(r.mean)} ¢ · ${r.n}×</small></button>`;
  }).join('');
}

register('tuningmap', { enter: render });

$('tmList').addEventListener('click', e => {
  const row = e.target.closest('[data-midi]');
  if (row) go('longtone', { midi: Number(row.dataset.midi) });
});
