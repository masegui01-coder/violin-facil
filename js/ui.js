// Utilidades de interfaz compartidas por todas las pantallas.

export const $ = id => document.getElementById(id);

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(text) {
  return String(text).replace(/[&<>"']/g, c => ESCAPES[c]);
}

export function starsHtml(n, max = 3) {
  return `<span class="stars" aria-label="${n} de ${max} estrellas">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;
}

let toastTimer = 0;
export function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
}

// Iconos en línea (trazo con currentColor)
export const ICONS = {
  learn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18c3-1 5-6 8-6s5 5 8 6M6 6h.01M12 4h.01M18 6h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="6" cy="18" r="2" fill="currentColor"/><circle cx="18" cy="18" r="2" fill="currentColor"/></svg>',
  songs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="17" cy="16" r="3" fill="currentColor"/></svg>',
  practice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v7a4 4 0 0 0 8 0V3M12 14v7M9 21h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  theory: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6v14" stroke="currentColor" stroke-width="2"/></svg>',
  notes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v11" stroke="currentColor" stroke-width="2.2"/><ellipse cx="10.5" cy="16" rx="4" ry="3" transform="rotate(-20 10.5 16)" fill="currentColor"/></svg>',
  song: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V6l10-2v11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="6.5" cy="17.5" rx="3" ry="2.4" fill="currentColor"/><ellipse cx="16.5" cy="15.5" rx="3" ry="2.4" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z" fill="currentColor"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
  metro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l4 18H5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 16l5-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  tuner: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16a9 9 0 0 1 18 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 16l4-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16" r="1.8" fill="currentColor"/></svg>',
  gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2" fill="currentColor" opacity=".85"/><rect x="2" y="6" width="20" height="4" rx="1.5" fill="currentColor"/><path d="M12 6v15" stroke="var(--surface)" stroke-width="2"/><path d="M12 6c-2-4-6-4-6-1.5S10 6 12 6zM12 6c2-4 6-4 6-1.5S14 6 12 6z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  routine: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l3 2M9 2h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  free: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h3l2-6 4 12 3-9 2 3h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  longtone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 19h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".5"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="4" height="16" rx="1" fill="currentColor" opacity=".45"/><rect x="10" y="9" width="4" height="11" rx="1" fill="currentColor"/><rect x="17" y="6" width="4" height="14" rx="1" fill="currentColor" opacity=".7"/></svg>',
  gym: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  chord: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="9" cy="18" rx="3.5" ry="2.6" fill="currentColor"/><ellipse cx="9" cy="12" rx="3.5" ry="2.6" fill="currentColor"/><ellipse cx="9" cy="6" rx="3.5" ry="2.6" fill="currentColor"/><path d="M12.5 6v12" stroke="currentColor" stroke-width="2"/></svg>',
  sight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
  audition: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  band: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 20c.8-3 3-5 6-5s5.2 2 6 5M14 15.3c.6-.2 1.3-.3 2-.3 3 0 5.2 2 6 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

export function icon(name) { return ICONS[name] || ''; }
