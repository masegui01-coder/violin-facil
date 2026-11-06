// Ajustes → Tu cuenta: sesión, estadísticas, borrar la cuenta y, para el administrador, el panel de testers.
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
import { testerControlHtml, bindTesterControls } from './tester.js';
import { loadOwnedSpaces, transferSpace, deleteSpace } from '../spaces-api.js';
import { DELETE, defaultChoice, spaceKey, choicesValid, stateAfterSpaces } from '../spaces.js';

const DAY_MS = 86400000;
const CANCELLED = 'auth/user-cancelled';

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
      ${getState().proTester ? `<p><span class="pill ok">${BETA_ALL_TESTERS ? 'Tester de la beta' : 'Tester pro'}</span> <span class="muted small">Tienes abiertas todas las lecciones y los tres libros de cada instrumento.</span></p>` : ''}
      <div id="accTester">${testerControlHtml()}</div>
      <div id="accAdmin"></div>
      <div class="row"><button type="button" class="btn ghost small" id="accSignOut">Cerrar sesión</button><button type="button" class="btn ghost small danger" id="accDelete">Borrar mi cuenta</button></div>`;
    bindTesterControls($('accTester'));
    $('accSignOut').addEventListener('click', signOut);
    $('accDelete').addEventListener('click', () => { removeAccount().catch(e => toast(accountErrorText(e))); });
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

// ---------- Bandas, grupos y escuela que dirige: traspasar o borrar antes de borrar la cuenta ----------
const SPACE_TEXT = {
  band: { eyebrow: 'Banda que diriges', to: 'Pasar la dirección a', del: 'Nadie: borrar la banda entera' },
  group: { eyebrow: 'Grupo que creaste', to: 'Pasar el grupo a', del: 'Nadie: borrar el grupo entero' },
  school: { eyebrow: 'Escuela de la que eres profesor', to: 'Pasar la escuela a', del: 'Nadie: borrar la escuela entera' },
};

function spaceHtml(space, i) {
  const t = SPACE_TEXT[space.kind];
  const pick = space.candidates.length
    ? `<label for="delSpace${i}">${t.to}</label><select id="delSpace${i}" class="input" data-space="${esc(spaceKey(space))}">
        ${space.candidates.map(m => `<option value="${esc(m.id)}">${esc(m.nickname)}</option>`).join('')}<option value="${DELETE}">${t.del}</option></select>`
    : '<p class="muted small">No hay más miembros: se borrará con todo su contenido.</p>';
  return `<div class="panel"><p class="eyebrow">${t.eyebrow}</p><h3>${esc(space.name)}</h3>${pick}</div>`;
}

// Hoja con cada espacio y qué hacer con él. Devuelve las elecciones; cancelar (o cerrar) rechaza y no se borra nada.
function askSpaces(spaces) {
  return new Promise((resolve, reject) => {
    let done = false;
    sheet(`<h2>Antes de borrar tu cuenta</h2>
      <p>Diriges o has creado estos espacios. Si se quedan sin responsable, nadie podrá gestionarlos. Elige qué hacer con cada uno.</p>
      ${spaces.map(spaceHtml).join('')}
      <div class="row"><button type="button" class="btn danger" id="delSpacesOk">Continuar y borrar mi cuenta</button><button type="button" class="btn ghost small" data-close>Cancelar</button></div>`, box => {
      box.querySelector('#delSpacesOk').addEventListener('click', () => {
        const choices = Object.fromEntries(spaces.map(sp => [spaceKey(sp), defaultChoice(sp)]));
        box.querySelectorAll('[data-space]').forEach(sel => { choices[sel.dataset.space] = sel.value; });
        if (!choicesValid(spaces, choices)) { toast('Elige qué hacer con cada espacio'); return; }
        done = true;
        $('sheet').close();
        resolve(choices);
      });
    });
    $('sheet').addEventListener('close', () => { if (!done) reject(Object.assign(new Error('cancel'), { code: CANCELLED })); }, { once: true });
  });
}

// Aplica cada elección; al primer fallo para (y la cuenta no se borra)
async function settleSpaces(spaces, choices, uid) {
  for (const space of spaces) {
    const choice = choices[spaceKey(space)];
    if (choice === DELETE) await deleteSpace(space, uid);
    else await transferSpace(space, choice);
  }
}

// Confirmación antes de borrar la cuenta: <dialog> modal (MD3) con aviso claro, «Cancelar» (botón de texto) con el foco
// al abrir y el botón de borrar en rojo, los dos en una fila alineada a la derecha. Escape o «Cancelar» la cierran sin borrar nada. Devuelve true solo si se confirma.
const DELETE_DIALOG = `<form method="dialog" class="sheet-body">
  <span class="confirm-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></span>
  <h2 id="delConfirmTitle">¿Borrar tu cuenta?</h2>
  <p id="delConfirmText">Se borrarán para siempre tu usuario, tu progreso guardado en la nube y lo que hayas compartido. No se puede deshacer.</p>
  <div class="confirm-actions"><button type="submit" class="btn text" value="cancel" id="delConfirmCancel" autofocus>Cancelar</button><button type="submit" class="btn danger-fill" value="delete" id="delConfirmOk">Borrar mi cuenta</button></div>
</form>`;

function deleteDialog() {
  let dlg = $('delConfirm');
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.id = 'delConfirm';
  dlg.className = 'sheet confirm-dialog';
  dlg.setAttribute('aria-labelledby', 'delConfirmTitle');
  dlg.setAttribute('aria-describedby', 'delConfirmText');
  dlg.innerHTML = DELETE_DIALOG;
  document.body.append(dlg);
  return dlg;
}

export function confirmDeletion() {
  const dlg = deleteDialog();
  const opener = document.activeElement;
  return new Promise(resolve => {
    dlg.addEventListener('close', () => {
      // El foco vuelve al botón que la abrió (si sigue en pantalla)
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
      resolve(dlg.returnValue === 'delete');
    }, { once: true });
    dlg.returnValue = '';
    dlg.showModal();
    $('delConfirmCancel').focus();
  });
}

// Orden: 0) qué hacer con lo que dirige; 1) confirmar que eres tú (si hace falta); 2) traspasar o borrar sus espacios;
// 3) borrar los datos; 4) borrar el usuario. Si se cancela 0 o falla 1, no se borra nada.
async function removeAccount() {
  if (!(await confirmDeletion())) return;
  const c = await getCloud();
  const user = c.auth.currentUser;
  if (!user || user.isAnonymous) return;
  let spaces = [];
  let choices = {};
  try {
    spaces = await loadOwnedSpaces(user.uid, getState());
    if (spaces.length) choices = await askSpaces(spaces);
    if (!signedInRecently(user)) await reauthenticate(c, user);
  } catch (e) {
    toast(e.code === CANCELLED || e.code === 'auth/popup-closed-by-user' ? 'No se ha borrado nada.' : `No se ha borrado nada. ${accountErrorText(e)}`);
    return;
  }
  try {
    await settleSpaces(spaces, choices, user.uid);
  } catch (e) {
    toast(`No se ha borrado tu cuenta: no he podido traspasar o borrar uno de tus espacios. ${accountErrorText(e)}`);
    return;
  }
  try {
    const failed = await deleteCloudData(user.uid, stateAfterSpaces(getState(), spaces, choices));
    if (failed.some(isNetworkFailure)) { toast('Sin conexión: la cuenta no se ha borrado. Vuelve a intentarlo con internet.'); return; }
    await deleteAccount();
    replaceState({});
    toast(failed.length ? 'Cuenta borrada. Algún dato compartido no se ha podido borrar: escríbenos a tizaestudiogames+violin@gmail.com y lo quitamos.' : 'Cuenta borrada');
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
