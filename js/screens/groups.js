// Mis grupos (beta): grupos pequeños que ensayan cada uno en su casa. Lista, crear, unirse y ficha del grupo.
import { $, esc, toast } from '../ui.js';
import { go } from '../router.js';
import { cloudConfigured, cloudErrorText, ensureSignedIn } from '../cloud.js';
import * as api from '../groups-api.js';
import { INSTRUMENTS, instrumentById } from '../instruments.js';
import { currentAccount } from '../account.js';
import { getState, update } from '../store.js';
import { isStale, MAX_MEMBERS, MAX_SONGS } from '../group-mix.js';
import { sheet } from './band-ui.js';

const BETA_NOTE = `<div class="beta-note"><b>Grupos · beta</b><span>Estamos estrenando esta parte: puede tener fallos y cambiará con lo que nos contéis.
  Cada uno graba su parte en casa encima de la maqueta y de lo que han subido los demás. Canciones de hasta 5 minutos y hasta ${MAX_MEMBERS} músicos.</span></div>`;

let openGroup = null; // { groupId, name, code }
let joinCode = new URLSearchParams(location.search).get('grupo') || '';

const body = html => { $('groupBody').innerHTML = html; };
const myGroups = () => getState().groups || [];
const accountName = () => String((currentAccount() && currentAccount().displayName) || '').slice(0, 30);
const instOptions = sel => INSTRUMENTS.map(i => `<option value="${i.id}" ${i.id === sel ? 'selected' : ''}>${esc(i.name)}</option>`).join('')
  + `<option value="voz" ${sel === 'voz' ? 'selected' : ''}>Voz</option><option value="bajo" ${sel === 'bajo' ? 'selected' : ''}>Bajo eléctrico</option><option value="bateria" ${sel === 'bateria' ? 'selected' : ''}>Batería</option><option value="otro" ${sel === 'otro' ? 'selected' : ''}>Otro</option>`;
export const partName = id => ({ voz: 'Voz', bajo: 'Bajo eléctrico', bateria: 'Batería', otro: 'Otro' }[id] || instrumentById(id).name);

export function renderGroups() {
  if (!cloudConfigured()) { body('<p class="empty">Los grupos necesitan conexión con el servidor.</p>'); return; }
  if (openGroup) { loadGroup(openGroup); return; }
  const list = myGroups();
  body(`${BETA_NOTE}
    ${list.length ? `<h2>Mis grupos</h2><div class="list">${list.map(g => `<button type="button" class="list-row" data-open-group="${esc(g.groupId)}"><span><b>${esc(g.name)}</b><small>Código ${esc(g.code)}</small></span><span class="chev">›</span></button>`).join('')}</div>` : ''}
    <form class="panel form" id="groupJoinForm"><h2>Unirme a un grupo</h2>
      <label for="gJoinCode">Código del grupo</label><input id="gJoinCode" class="input" maxlength="6" autocomplete="off" placeholder="Ej.: K7P2QX" value="${esc(joinCode)}" style="text-transform:uppercase">
      <label for="gJoinNick">Tu nombre</label><input id="gJoinNick" class="input" maxlength="30" value="${esc(accountName())}">
      <label for="gJoinInst">Qué tocas</label><select id="gJoinInst" class="select">${instOptions(getState().instrument)}</select>
      <button class="btn" type="submit">Unirme</button><p id="gJoinError" class="warn" hidden></p></form>
    <form class="panel form" id="groupCreateForm"><h2>Crear un grupo</h2>
      <label for="gName">Nombre del grupo</label><input id="gName" class="input" maxlength="60" placeholder="Ej.: Los del garaje">
      <label for="gNick">Tu nombre</label><input id="gNick" class="input" maxlength="30" value="${esc(accountName())}">
      <label for="gInst">Qué tocas</label><select id="gInst" class="select">${instOptions(getState().instrument)}</select>
      <button class="btn ghost" type="submit">Crear grupo</button><p id="gCreateError" class="warn" hidden></p></form>`);
  $('groupBody').querySelectorAll('[data-open-group]').forEach(b => b.addEventListener('click', () => {
    openGroup = myGroups().find(g => g.groupId === b.dataset.openGroup);
    renderGroups();
  }));
  $('groupJoinForm').addEventListener('submit', onJoin);
  $('groupCreateForm').addEventListener('submit', onCreate);
}

const showError = (id, text) => { $(id).textContent = text; $(id).hidden = false; };
const remember = g => update({ groups: [...myGroups().filter(x => x.groupId !== g.groupId), { groupId: g.groupId, name: g.name, code: g.code }] });

async function onJoin(e) {
  e.preventDefault();
  const code = $('gJoinCode').value.trim().toUpperCase();
  const nick = $('gJoinNick').value.trim();
  if (code.length !== 6 || !nick) { showError('gJoinError', 'Escribe el código de 6 caracteres y tu nombre.'); return; }
  try {
    const g = await api.joinGroup(code, nick, $('gJoinInst').value);
    remember(g);
    joinCode = '';
    toast(`Te has unido a ${g.name}`);
    openGroup = g;
    renderGroups();
  } catch (err) { showError('gJoinError', cloudErrorText(err)); }
}

async function onCreate(e) {
  e.preventDefault();
  const name = $('gName').value.trim();
  const nick = $('gNick').value.trim();
  if (!name || !nick) { showError('gCreateError', 'Escribe el nombre del grupo y el tuyo.'); return; }
  try {
    const g = await api.createGroup(name, nick, $('gInst').value);
    remember(g);
    openGroup = g;
    renderGroups();
  } catch (err) { showError('gCreateError', cloudErrorText(err)); }
}

// ---------- Ficha del grupo ----------
async function loadGroup(g) {
  body('<p class="empty">Cargando el grupo…</p>');
  try {
    const [user, group, members, songs] = await Promise.all([ensureSignedIn(), api.getGroup(g.groupId), api.listMembers(g.groupId), api.listSongs(g.groupId)]);
    if (!group) throw new Error('Este grupo ya no existe.');
    const stale = songs.filter(s => isStale(api.millis(s.updatedAt)));
    stale.forEach(s => api.deleteSong(g.groupId, s).catch(() => {}));
    const alive = songs.filter(s => !stale.includes(s)).sort((a, b) => api.millis(b.updatedAt) - api.millis(a.updatedAt));
    showGroup({ ...g, ...group, groupId: g.groupId }, members, alive, user.uid);
  } catch (err) {
    body(`<div class="panel"><h2>No he podido abrir el grupo</h2><p class="warn">${esc(cloudErrorText(err))}</p>
      <div class="row"><button type="button" class="btn small" id="gRetry">Reintentar</button><button type="button" class="btn ghost small" id="gForget">Quitar de mis grupos</button><button type="button" class="btn ghost small" id="gBack">Volver</button></div></div>`);
    $('gRetry').addEventListener('click', () => loadGroup(g));
    $('gForget').addEventListener('click', () => { update({ groups: myGroups().filter(x => x.groupId !== g.groupId) }); openGroup = null; renderGroups(); });
    $('gBack').addEventListener('click', () => { openGroup = null; renderGroups(); });
  }
}

function showGroup(group, members, songs, uid) {
  const me = members.find(m => m.id === uid) || { nickname: accountName(), instrument: getState().instrument };
  const link = `${location.origin}${location.pathname}?grupo=${group.code}`;
  body(`<button type="button" class="text-link" id="gAll">‹ Mis grupos</button>
    <div class="band-hero"><p class="eyebrow">Grupo · beta</p><h1>${esc(group.name)}</h1><p>Código <b>${esc(group.code)}</b> · ${members.length} de ${MAX_MEMBERS} músicos</p>
      <button type="button" class="btn small" id="gInvite">Invitar al grupo</button></div>
    <h2>Canciones</h2>
    ${songs.length ? `<div class="list">${songs.map(s => {
      const parts = Object.entries(s.parts || {});
      const demo = parts.some(([id]) => id === 'demo');
      const players = parts.filter(([id]) => id !== 'demo').map(([, p]) => p.nickname);
      return `<button type="button" class="list-row" data-song="${esc(s.id)}"><span><b>${esc(s.title)}</b>
        <small>${demo ? 'Maqueta ✓' : 'Sin maqueta'} · ${players.length ? esc(players.join(', ')) : 'nadie ha grabado aún'}${s.parts && s.parts[uid] ? '' : ' · te falta tu parte'}</small></span><span class="chev">›</span></button>`;
    }).join('')}</div>` : '<p class="empty">Aún no hay canciones. Crea la primera y sube la maqueta.</p>'}
    ${songs.length < MAX_SONGS ? '<button type="button" class="btn" id="gNewSong">+ Nueva canción</button>' : `<p class="muted small">Máximo ${MAX_SONGS} canciones en la beta.</p>`}
    <h2>Músicos</h2>
    <div class="list">${members.map(m => `<div class="list-row"><span><b>${esc(m.nickname)}</b><small>${esc(partName(m.instrument))}${m.id === group.ownerUid ? ' · creó el grupo' : ''}</small></span></div>`).join('')}</div>
    <p class="muted small">Las canciones que nadie toca en 60 días se borran para ahorrar espacio.</p>
    <button type="button" class="btn ghost small" id="gLeave">Salir del grupo</button>`);
  $('gAll').addEventListener('click', () => { openGroup = null; renderGroups(); });
  $('gInvite').addEventListener('click', async () => {
    const text = `Únete a «${group.name}» en Band Flow para ensayar a distancia: ${link} (código ${group.code})`;
    try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Invitación copiada'); } } catch (e) { /* cancelado */ }
  });
  $('groupBody').querySelectorAll('[data-song]').forEach(b => b.addEventListener('click', () => go('groupsong', { group, songId: b.dataset.song, me: { uid, ...me } })));
  const newBtn = $('gNewSong');
  if (newBtn) newBtn.addEventListener('click', () => sheet(`<h2>Nueva canción</h2>
      <label for="gsNewTitle">Título</label><input id="gsNewTitle" class="input" maxlength="80">
      <label for="gsNewBpm">Tempo (pulsos por minuto, para la cuenta previa)</label><input id="gsNewBpm" class="input" type="number" min="40" max="240" value="100">
      <button type="button" class="btn" id="gsNewOk">Crear</button>`, box => box.querySelector('#gsNewOk').addEventListener('click', async () => {
    const title = $('gsNewTitle').value.trim();
    const bpm = Math.min(240, Math.max(40, Number($('gsNewBpm').value) || 100));
    if (!title) { toast('Ponle un título'); return; }
    try {
      const songId = await api.createSong(group.groupId, { title, bpm });
      $('sheet').close();
      go('groupsong', { group, songId, me: { uid, ...me } });
    } catch (err) { toast(cloudErrorText(err)); }
  })));
  $('gLeave').addEventListener('click', async e => {
    if (!e.target.dataset.confirm) { e.target.dataset.confirm = '1'; e.target.textContent = '¿Seguro? Toca otra vez'; return; }
    await api.leaveGroup(group.groupId).catch(() => {});
    update({ groups: myGroups().filter(x => x.groupId !== group.groupId) });
    openGroup = null;
    renderGroups();
  });
}

export const groupInviteCode = () => joinCode;
