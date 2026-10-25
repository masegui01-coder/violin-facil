// Elegir instrumento: tarjetas con icono, usadas en la bienvenida, en Perfil y desde la barra superior.
import { $, esc, toast } from '../ui.js';
import { INSTRUMENTS, instrumentById } from '../instruments.js';
import { getState, update } from '../store.js';

const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  violin: `<path d="M12 2v7" ${S}/><path d="M10 2h4" ${S}/><path d="M9.5 9c-2 0-3 1.6-2.2 3.4-1.3 1.2-1.4 3.6.3 5.3 1.9 1.9 6.9 1.9 8.8 0 1.7-1.7 1.6-4.1.3-5.3.8-1.8-.2-3.4-2.2-3.4z" ${S}/><path d="M10 13.5v2M14 13.5v2M10 19.5h4" ${S}/>`,
  trumpet: `<path d="M2 11h11l6-5v12l-6-5H2z" ${S}/><path d="M6 11V7.5M8.5 11V7.5M11 11V7.5" ${S}/><path d="M4 14h8" ${S}/>`,
  clarinet: `<path d="M12 2v16" ${S}/><path d="M9.5 18h5l1.5 4h-8z" ${S}/><circle cx="12" cy="7" r="1" fill="currentColor"/><circle cx="12" cy="10.5" r="1" fill="currentColor"/><circle cx="12" cy="14" r="1" fill="currentColor"/><path d="M11 2h2" ${S}/>`,
  oboe: `<path d="M12 1.5v17" ${S}/><path d="M10.5 18.5h3l1 3.5h-5z" ${S}/><circle cx="12" cy="7" r=".9" fill="currentColor"/><circle cx="12" cy="10" r=".9" fill="currentColor"/><circle cx="12" cy="13" r=".9" fill="currentColor"/>`,
  flute: `<path d="M2 12h20" ${S} stroke-width="2.4"/><circle cx="6" cy="12" r=".9" fill="var(--surface)"/><circle cx="11" cy="12" r=".9" fill="var(--surface)"/><circle cx="14" cy="12" r=".9" fill="var(--surface)"/><circle cx="17" cy="12" r=".9" fill="var(--surface)"/>`,
  sax: `<path d="M14 2v9.5c0 4.5-2.5 8.5-6 8.5-2.2 0-3.5-1.4-3.5-3.2 0-1.5 1.1-2.6 2.6-2.6h2.4" ${S}/><path d="M12 2h4" ${S}/><circle cx="14" cy="6" r=".9" fill="currentColor"/><circle cx="14" cy="9" r=".9" fill="currentColor"/>`,
};

export function instrumentIcon(id) {
  const key = id.startsWith('sax') ? 'sax' : id;
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[key] || ICONS.violin}</svg>`;
}

export function instrumentCardsHtml(selected) {
  return INSTRUMENTS.map(i => `<button type="button" class="inst-opt" data-inst="${i.id}" aria-pressed="${i.id === selected}">
    <span class="inst-ic">${instrumentIcon(i.id)}</span><b>${esc(i.name)}</b><small>${esc(i.blurb)}</small></button>`).join('');
}

// Hoja para cambiar de instrumento. onPicked se llama tras guardar.
export function openInstrumentPicker({ title = 'Elige tu instrumento', intro = '', onPicked = () => {}, onClosed = () => {} } = {}) {
  const current = getState().instrument;
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>${esc(title)}</h2>
    <p class="muted small">${esc(intro || 'El curso, las digitaciones y el afinador se adaptan. Tu progreso se guarda por separado para cada instrumento.')}</p>
    <div class="inst-grid">${instrumentCardsHtml(current)}</div>
    <button type="button" class="btn ghost small" data-close>Cerrar</button></div>`;
  $('sheetBody').querySelector('.inst-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-inst]');
    if (!b) return;
    update({ instrument: b.dataset.inst, instrumentChosen: true });
    $('sheet').close();
    toast(`Ahora practicas con: ${instrumentById(b.dataset.inst).name}`);
    onPicked(b.dataset.inst);
  });
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => { update({ instrumentChosen: true }); $('sheet').close(); onClosed(); });
  $('sheet').showModal();
}
