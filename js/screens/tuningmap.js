// Mapa de afinación: media y dispersión de cada nota a partir de todo lo que has tocado con este instrumento.
import { $, esc } from '../ui.js';
import { register, go } from '../router.js';
import { noteLabel, isBowed } from '../music.js';
import { instrumentById } from '../instruments.js';
import { getState } from '../store.js';

const MIN_SAMPLES = 3;
const SCALE_CENTS = 30;

export function tuningStats(entry) {
  const m = entry.sum / entry.n;
  const variance = entry.n > 1 ? Math.max(0, (entry.sumSq - entry.n * m * m) / (entry.n - 1)) : 0;
  return { mean: m, spread: Math.sqrt(variance), n: entry.n };
}

const colorFor = c => (Math.abs(c) < 5 ? 'var(--ok)' : Math.abs(c) < 12 ? 'var(--warn)' : 'var(--bad)');

function render() {
  const s = getState();
  const inst = instrumentById(s.instrument);
  const data = s.tuning[s.instrument] || {};
  const rows = Object.entries(data).map(([midi, e]) => ({ midi: Number(midi), ...tuningStats(e) })).sort((a, b) => b.midi - a.midi);
  const reliable = rows.filter(r => r.n >= MIN_SAMPLES);
  const worst = [...reliable].sort((a, b) => Math.abs(b.mean) - Math.abs(a.mean)).slice(0, 3).filter(r => Math.abs(r.mean) >= 5);
  const name = r => noteLabel({ midi: r.midi }, s.nom, !isBowed(s.instrument));
  $('tmSummary').textContent = !rows.length
    ? `Aún no hay datos de tu ${inst.name.toLowerCase()}. Haz lecciones o notas tenidas y aquí verás qué notas te salen altas o bajas.`
    : worst.length
      ? `Notas a vigilar: ${worst.map(r => `${name(r)} (${r.mean > 0 ? '+' : ''}${Math.round(r.mean)} ¢)`).join(', ')}. Toca una para practicarla con notas tenidas.`
      : 'Tu afinación está muy equilibrada en todas las notas con datos suficientes.';
  $('tmList').innerHTML = rows.map(r => {
    const w = Math.min(50, Math.abs(r.mean) / SCALE_CENTS * 50);
    const left = r.mean >= 0 ? 50 : 50 - w;
    return `<button type="button" class="tm-row" data-midi="${r.midi}"><b>${esc(name(r))}</b>
      <span class="tm-bar" title="${Math.round(r.mean)} cents"><i style="left:${left}%;width:${w}%;background:${colorFor(r.mean)}"></i></span>
      <small>${r.mean > 0 ? '+' : ''}${Math.round(r.mean)} ¢ · ${r.n}×</small></button>`;
  }).join('');
}

register('tuningmap', { enter: render });

$('tmList').addEventListener('click', e => {
  const row = e.target.closest('[data-midi]');
  if (row) go('longtone', { midi: Number(row.dataset.midi) });
});
