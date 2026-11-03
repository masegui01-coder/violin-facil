// Perfil → Tu cuenta: sesión, estadísticas, borrar la cuenta y, para el administrador, el panel de testers.
import { $, esc, toast, num } from '../ui.js';
import { go } from '../router.js';
import { cloudConfigured, getCloud } from '../cloud.js';
import { currentAccount, signOutAccount, deleteAccount, accountErrorText } from '../account.js';
import { flushPush, stopSync, deleteCloudData, isAdmin, listTesters, signedInRecently, isNetworkFailure } from '../sync.js';
import { analyticsAvailable, setAnalyticsConsent } from '../analytics.js';
import { getState, replaceState } from '../store.js';
import { openAccountReminder } from './account.js';
import { BETA_ALL_TESTERS } from '../metrics.js';
import { listProTesters, setProTester } from '../roles-api.js';
import { sheet } from './band-ui.js';

const DAY_MS = 86400000;
const CANCELLED = 'auth/user-cancelled';
let confirmDelete = false;

const fmtDay = ms => (ms ? new Date(ms).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—');

export async function renderAccountPanel() {
  confirmDelete = false;
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
      ${getState().proTester ? `<p><span class="pill ok">${BETA_ALL_TESTERS ? 'Tester de la beta' : 'Tester pro'}</span> <span class="muted small">Tienes abiertas todas las lecciones y los tres libros de cada instrumento.</span></p>` : ''}
      <div id="accAdmin"></div>
      <div class="row"><button type="button" class="btn ghost small" id="accSignOut">Cerrar sesión</button><button type="button" class="btn ghost small danger" id="accDelete">Borrar mi cuenta</button></div>`;
    $('accSignOut').addEventListener('click', signOut);
    $('accDelete').addEventListener('click', removeAccount);
    if (await isAdmin(acc.uid)) {
      $('accAdmin').innerHTML = '<div class="row"><button type="button" class="btn small" id="accMetrics">Métricas de la app</button><button type="button" class="btn ghost small" id="accTesters">Panel de testers</button></div>';
      $('accMetrics').addEventListener('click', () => go('metrics'));
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
  const { importedSongs, recordings } = getState();
  replaceState({ importedSongs, recordings, onboarded: true });
  go('account');
}

// Contraseña para confirmar que eres tú (cuentas de correo); al cerrar la ventana se cancela
function askPassword() {
  return new Promise((resolve, reject) => {
    let done = false;
    sheet(`<h2>Confirma que eres tú</h2><p class="muted small">Para borrar la cuenta escribe tu contraseña.</p>
      <label for="delPass">Contraseña</label><input id="delPass" class="input" type="password" autocomplete="current-password">
      <div class="row"><button type="button" class="btn danger" id="delPassOk">Borrar mi cuenta</button><button type="button" class="btn ghost small" data-close>Cancelar</button></div>`, box => {
      box.querySelector('#delPassOk').addEventListener('click', () => {
        const pass = box.querySelector('#delPass').value;
        if (!pass) { toast('Escribe tu contraseña'); return; }
        done = true;
        $('sheet').close();
        resolve(pass);
      });
    });
    $('sheet').addEventListener('close', () => { if (!done) reject(Object.assign(new Error('cancel'), { code: CANCELLED })); }, { once: true });
  });
}

// Vuelve a entrar con el mismo proveedor (Google o correo) para que Firebase permita borrar el usuario
async function reauthenticate(c, user) {
  const providers = (user.providerData || []).map(p => p.providerId);
  if (providers.includes('google.com')) {
    const provider = new c.authFns.GoogleAuthProvider();
    if (user.email) provider.setCustomParameters({ login_hint: user.email });
    await c.authFns.reauthenticateWithPopup(user, provider);
    return;
  }
  if (providers.includes('password') && user.email) {
    const pass = await askPassword();
    await c.authFns.reauthenticateWithCredential(user, c.authFns.EmailAuthProvider.credential(user.email, pass));
    return;
  }
  throw Object.assign(new Error('reauth'), { code: 'auth/requires-recent-login' });
}

// Orden: 1) confirmar que eres tú (si hace falta); 2) borrar los datos; 3) borrar el usuario. Si falla 1, no se borra nada.
async function removeAccount() {
  if (!confirmDelete) { confirmDelete = true; $('accDelete').textContent = '¿Seguro? Se borra todo tu progreso'; return; }
  confirmDelete = false;
  $('accDelete').textContent = 'Borrar mi cuenta';
  const c = await getCloud();
  const user = c.auth.currentUser;
  if (!user || user.isAnonymous) return;
  try {
    if (!signedInRecently(user)) await reauthenticate(c, user);
  } catch (e) {
    toast(e.code === CANCELLED || e.code === 'auth/popup-closed-by-user' ? 'No se ha borrado nada.' : `No se ha borrado nada. ${accountErrorText(e)}`);
    return;
  }
  try {
    const failed = await deleteCloudData(user.uid, getState());
    if (failed.some(isNetworkFailure)) { toast('Sin conexión: la cuenta no se ha borrado. Vuelve a intentarlo con internet.'); return; }
    await deleteAccount();
    replaceState({});
    toast(failed.length ? 'Cuenta borrada. Algún dato compartido no se ha podido borrar: escríbenos si quieres que lo quitemos.' : 'Cuenta borrada');
    go('account');
  } catch (e) { toast(accountErrorText(e)); }
}

// ---------- Panel de testers (solo administrador) ----------
function testersCsv(list) {
  const head = ['Nombre', 'Correo', 'Instrumento', 'Instrumentos', 'Alta', 'Último uso', 'Días de práctica', 'Minutos', 'Lecciones', 'Nivel', 'Racha', 'Banda', 'Dispositivo'];
  const rows = list.map(t => [t.name, t.email, t.instrument, (t.instruments || []).join(', '), fmtDay(t.createdAt), fmtDay(t.lastSeen), t.daysPracticed, t.minutes, t.lessons, t.level, t.streak, t.band, t.platform]);
  const safe = v => { const t = String(v ?? ''); return /^[=+\-@\t]/.test(t) ? "'" + t : t; }; // evita fórmulas maliciosas en Excel
  const cell = raw => { const v = safe(raw); return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  return [head, ...rows].map(r => r.map(cell).join(';')).join('\r\n');
}

export async function openTesters() {
  $('sheetBody').innerHTML = '<div class="sheet-body"><h2>Testers</h2><p class="empty">Cargando…</p></div>';
  $('sheet').showModal();
  let list = [];
  let pros = {};
  try { [list, pros] = await Promise.all([listTesters(), listProTesters().catch(() => ({}))]); } catch (e) { $('sheetBody').innerHTML = `<div class="sheet-body"><h2>Testers</h2><p class="warn">${esc(accountErrorText(e))}</p></div>`; return; }
  const now = Date.now();
  const active = days => list.filter(t => now - t.lastSeen < days * DAY_MS).length;
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>Testers</h2>
    <div class="stats"><div class="stat"><b>${list.length}</b><span>con cuenta</span></div><div class="stat"><b>${active(1)}</b><span>hoy</span></div><div class="stat"><b>${active(7)}</b><span>esta semana</span></div></div>
    <div class="table-wrap"><table class="prog-table testers-table"><thead><tr><th>Tester</th><th>Instrumento</th><th>Último uso</th><th class="num">Días</th><th class="num">Min.</th><th class="num">Lecc.</th><th>Pro</th></tr></thead><tbody>
    ${list.map(t => `<tr><td><b>${esc(t.name)}</b><br><small>${esc(t.email)}</small></td><td>${esc(t.instrument || '')}<br><small>${esc(t.level || '')}</small></td>
      <td>${fmtDay(t.lastSeen)}<br><small>${esc(t.platform || '')}</small></td><td class="num">${num(t.daysPracticed)}</td><td class="num">${num(t.minutes)}</td><td class="num">${num(t.lessons)}</td>
      <td><label class="check-chip" title="Tester pro: todo abierto menos el panel de administrador"><input type="checkbox" data-pro="${esc(t.id)}" ${pros[t.id] ? 'checked' : ''}> Pro</label></td></tr>`).join('')}
    </tbody></table></div>
    <p class="muted small">${BETA_ALL_TESTERS ? 'Durante la beta todas las cuentas ven todo el contenido (menos este panel y las métricas). «Pro» queda guardado para cuando se cierre el contenido.' : 'Marca «Pro» para que ese tester vea todo (lecciones, libros, libro de lecturas…) menos este panel y las métricas. Se aplica la próxima vez que abra la app.'}</p>
    <div class="row"><button type="button" class="btn small" id="testersCsv">Descargar (CSV)</button><button type="button" class="btn ghost small" data-close>Cerrar</button></div></div>`;
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('sheetBody').querySelectorAll('[data-pro]').forEach(box => box.addEventListener('change', async () => {
    try { await setProTester(box.dataset.pro, box.checked); toast(box.checked ? 'Ahora es tester pro' : 'Ya no es tester pro'); } catch (e) { box.checked = !box.checked; toast(accountErrorText(e)); }
  }));
  $('testersCsv').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob(['﻿' + testersCsv(list)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `testers-band-flow-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
