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
  percussion: `<ellipse cx="12" cy="9" rx="8" ry="3" ${S}/><path d="M4 9v7c0 1.7 3.6 3 8 3s8-1.3 8-3V9" ${S}/><path d="M7 3l4 5M17 3l-4 5" ${S}/>`,
  recorder: `<path d="M10.5 2h3l-.5 4h-2z" ${S}/><path d="M11 6h2l.6 13c0 1.6-.8 3-1.6 3s-1.6-1.4-1.6-3z" ${S}/><circle cx="12" cy="9.5" r=".8" fill="currentColor"/><circle cx="12" cy="12" r=".8" fill="currentColor"/><circle cx="12" cy="14.5" r=".8" fill="currentColor"/><circle cx="12" cy="17" r=".8" fill="currentColor"/>`,
  cajon: `<rect x="5" y="3" width="14" height="18" rx="1.5" ${S}/><circle cx="12" cy="15" r="2.6" ${S}/><path d="M7.5 6h9" ${S}/>`,
  horn: `<circle cx="12" cy="11" r="5.5" ${S}/><circle cx="12" cy="11" r="2.5" ${S}/><path d="M6.6 12.5C5 17 2.5 19.5 2 21h6c0-2 .8-4 2.2-5.4" ${S}/><path d="M17.5 11H22" ${S}/>`,
  trombone: `<path d="M3 8h14a2.5 2.5 0 0 1 0 5H8" ${S}/><path d="M3 15h15" ${S}/><path d="M18 15l3.5-3v6z" ${S}/><path d="M8 13v2" ${S}/>`,
  euphonium: `<path d="M9 2v4" ${S}/><path d="M7.5 6h7v8a4.5 4.5 0 0 1-9 0v-3" ${S}/><path d="M14.5 8l5-4v5" ${S}/><path d="M9.5 9v4M12 9v4" ${S}/>`,
  tuba: `<path d="M8 2h3v3" ${S}/><path d="M6 5h9v9a5 5 0 0 1-10 0V9" ${S}/><path d="M15 5l4-3h3v7h-3l-4-2" ${S}/><path d="M8.5 9v4M11 9v4" ${S}/>`,
  guitar: `<path d="M15 3l6 6" ${S}/><path d="M17.5 5.5l-6 6" ${S}/><path d="M11.5 11.5c-1.6-1.6-4.6-1.4-6.3.6-1.4 1.6-1.6 3.4-.6 4.5-1.6.9-1.8 2.8-.4 4.1 1.3 1.3 3.2 1.2 4.1-.4 1.1 1 2.9.8 4.5-.6 2-1.7 2.2-4.7.6-6.3z" ${S}/><circle cx="9" cy="15" r="1.4" fill="currentColor"/>`,
  piano: `<rect x="2" y="5" width="20" height="14" rx="2" ${S}/><path d="M7 5v14M12 5v14M17 5v14" ${S}/><rect x="5.6" y="5" width="2.8" height="8" fill="currentColor"/><rect x="10.6" y="5" width="2.8" height="8" fill="currentColor"/><rect x="15.6" y="5" width="2.8" height="8" fill="currentColor"/>`,
  sax: `<path d="M14 2v9.5c0 4.5-2.5 8.5-6 8.5-2.2 0-3.5-1.4-3.5-3.2 0-1.5 1.1-2.6 2.6-2.6h2.4" ${S}/><path d="M12 2h4" ${S}/><circle cx="14" cy="6" r=".9" fill="currentColor"/><circle cx="14" cy="9" r=".9" fill="currentColor"/>`,
};

const ICON_ALIAS = { ukulele: 'guitar', 'bass-clarinet': 'clarinet', 'eb-clarinet': 'clarinet', piccolo: 'flute', flugelhorn: 'trumpet' };

export function instrumentIcon(id) {
  const key = id.startsWith('sax') ? 'sax' : ICON_ALIAS[id] || id;
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[key] || ICONS.violin}</svg>`;
}

// Agrupados por familia para que con tantos instrumentos sea fácil encontrar el tuyo
const GROUPS = [['escuela', 'Para empezar (niños)'], ['cuerda', 'Cuerda'], ['madera', 'Viento madera'], ['metal', 'Viento metal'], ['percusion', 'Percusión'], ['pulsada', 'Guitarra'], ['tecla', 'Teclado']];

export function instrumentCardsHtml(selected) {
  const card = i => `<button type="button" class="inst-opt" data-inst="${i.id}" aria-pressed="${i.id === selected}">
    <span class="inst-ic">${instrumentIcon(i.id)}</span><b>${esc(i.name)}</b><small>${esc(i.blurb)}</small></button>`;
  return GROUPS.map(([family, title]) => {
    const list = INSTRUMENTS.filter(i => i.family === family);
    return list.length ? `<p class="inst-group">${title}</p>${list.map(card).join('')}` : '';
  }).join('');
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
