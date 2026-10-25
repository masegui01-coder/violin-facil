// Perfil → Tu cuenta: sesión, estadísticas, borrar la cuenta y, para el administrador, el panel de testers.
import { $, esc, toast } from '../ui.js';
import { go } from '../router.js';
import { cloudConfigured } from '../cloud.js';
import { currentAccount, signOutAccount, deleteAccount, accountErrorText } from '../account.js';
import { flushPush, stopSync, deleteCloudData, isAdmin, listTesters } from '../sync.js';
import { analyticsAvailable, setAnalyticsConsent } from '../analytics.js';
import { getState, replaceState } from '../store.js';
import { openAccountReminder } from './account.js';

const DAY_MS = 86400000;
let confirmDelete = false;

const fmtDay = ms => (ms ? new Date(ms).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—');

export async function renderAccountPanel() {
  const box = $('accountPanel');
  const acc = cloudConfigured() ? currentAccount() : null;
  const consent = analyticsAvailable() ? `<label class="switch-row" for="setAnalytics"><span>Estadísticas de uso (Google Analytics)</span><input id="setAnalytics" type="checkbox" class="switch" ${getState().analyticsConsent ? 'checked' : ''}></label>` : '';
  if (!acc) {
    box.innerHTML = `<h2>Tu cuenta</h2><p>Todavía no tienes usuario: tu progreso solo está en este dispositivo.</p>
      <button type="button" class="btn" id="accCreate">Crear mi usuario</button>${consent}`;
    $('accCreate').addEventListener('click', openAccountReminder);
  } else {
    box.innerHTML = `<h2>Tu cuenta</h2><p>Has entrado como <b>${esc(acc.displayName || acc.email)}</b>${acc.displayName && acc.email ? ` (${esc(acc.email)})` : ''}. Tu progreso se guarda en tu cuenta y lo recuperas en cualquier dispositivo.</p>
      <p class="muted small">Las grabaciones y las partituras importadas se quedan en este dispositivo.</p>
      ${consent}
      <div id="accAdmin"></div>
      <div class="row"><button type="button" class="btn ghost small" id="accSignOut">Cerrar sesión</button><button type="button" class="btn ghost small danger" id="accDelete">Borrar mi cuenta</button></div>`;
    $('accSignOut').addEventListener('click', signOut);
    $('accDelete').addEventListener('click', removeAccount);
    if (await isAdmin(acc.uid)) {
      $('accAdmin').innerHTML = '<button type="button" class="btn small" id="accTesters">Panel de testers</button>';
      $('accTesters').addEventListener('click', openTesters);
    }
  }
  $('setAnalytics')?.addEventListener('change', e => setAnalyticsConsent(e.target.checked));
}

// Al cerrar sesión se limpia este dispositivo: el progreso ya está en la cuenta y así no se mezcla con otra persona
async function signOut() {
  await flushPush();
  stopSync();
  await signOutAccount();
  replaceState({});
  go('account');
}

async function removeAccount() {
  if (!confirmDelete) { confirmDelete = true; $('accDelete').textContent = '¿Seguro? Se borra todo tu progreso'; return; }
  const acc = currentAccount();
  try {
    await deleteCloudData(acc.uid);
    await deleteAccount();
    replaceState({});
    toast('Cuenta borrada');
    go('account');
  } catch (e) { toast(accountErrorText(e)); }
  confirmDelete = false;
}

// ---------- Panel de testers (solo administrador) ----------
function testersCsv(list) {
  const head = ['Nombre', 'Correo', 'Instrumento', 'Instrumentos', 'Alta', 'Último uso', 'Días de práctica', 'Minutos', 'Lecciones', 'Nivel', 'Racha', 'Banda', 'Dispositivo'];
  const rows = list.map(t => [t.name, t.email, t.instrument, (t.instruments || []).join(', '), fmtDay(t.createdAt), fmtDay(t.lastSeen), t.daysPracticed, t.minutes, t.lessons, t.level, t.streak, t.band, t.platform]);
  const cell = v => (/[;"\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
  return [head, ...rows].map(r => r.map(cell).join(';')).join('\r\n');
}

async function openTesters() {
  $('sheetBody').innerHTML = '<div class="sheet-body"><h2>Testers</h2><p class="empty">Cargando…</p></div>';
  $('sheet').showModal();
  let list = [];
  try { list = await listTesters(); } catch (e) { $('sheetBody').innerHTML = `<div class="sheet-body"><h2>Testers</h2><p class="warn">${esc(accountErrorText(e))}</p></div>`; return; }
  const now = Date.now();
  const active = days => list.filter(t => now - t.lastSeen < days * DAY_MS).length;
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>Testers</h2>
    <div class="stats"><div class="stat"><b>${list.length}</b><span>con cuenta</span></div><div class="stat"><b>${active(1)}</b><span>hoy</span></div><div class="stat"><b>${active(7)}</b><span>esta semana</span></div></div>
    <div class="table-wrap"><table class="prog-table testers-table"><thead><tr><th>Tester</th><th>Instrumento</th><th>Último uso</th><th class="num">Días</th><th class="num">Min.</th><th class="num">Lecc.</th></tr></thead><tbody>
    ${list.map(t => `<tr><td><b>${esc(t.name)}</b><br><small>${esc(t.email)}</small></td><td>${esc(t.instrument || '')}<br><small>${esc(t.level || '')}</small></td>
      <td>${fmtDay(t.lastSeen)}<br><small>${esc(t.platform || '')}</small></td><td class="num">${t.daysPracticed}</td><td class="num">${t.minutes}</td><td class="num">${t.lessons}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="row"><button type="button" class="btn small" id="testersCsv">Descargar (CSV)</button><button type="button" class="btn ghost small" data-close>Cerrar</button></div></div>`;
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('testersCsv').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob(['﻿' + testersCsv(list)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `testers-band-flow-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
