// Amigos: tu código, solicitudes, el muro con los logros de tus amigos (y reacciones), la lista de amigos con lo que
// están tocando, la clasificación de la semana y los avisos que te dejan. También mantiene tu perfil al día.
import { $, esc, toast, num } from '../ui.js';
import { register, go, currentScreen } from '../router.js';
import { cloudConfigured } from '../cloud.js';
import { currentAccount } from '../account.js';
import * as fr from '../friends-api.js';
import { levelFor } from '../rewards.js';
import { weekId } from '../engage.js';
import { instrumentById } from '../instruments.js';
import { lessonTitle } from '../course.js';
import { getState, subscribe, currentStreak, today } from '../store.js';
import { sheet } from './band-ui.js';

const PROFILE_DELAY_MS = 8000;
const MAX_EVENTS_PER_DAY = 12;
const INVITE_PARAM = 'amigo';

let tab = 'wall';
let data = { friends: [], requests: [], feed: [], mine: [], me: null };
let pendingCode = new URLSearchParams(location.search).get(INVITE_PARAM) || '';
let ready = false;

const myName = () => String((currentAccount() && currentAccount().displayName) || getState().nickname || 'Músico').slice(0, 60);
const instName = id => (id ? instrumentById(id).name : '');
const initial = name => esc((String(name || '').trim() || '?')[0].toUpperCase());

// ---------- Perfil y muro (en segundo plano) ----------
function profilePatch() {
  const s = getState();
  return {
    name: myName(), instrument: s.instrument, xp: s.xp, level: levelFor(s.xp).name, streak: currentStreak(s.streak),
    badges: (s.badges || []).length, week: weekId(), weekMinutes: fr.weekMinutes(s.practiceLog),
  };
}

let profileTimer = 0;
function scheduleProfile(extra = {}) {
  clearTimeout(profileTimer);
  profileTimer = setTimeout(() => fr.updateProfile({ ...profilePatch(), ...extra }).catch(() => {}), PROFILE_DELAY_MS);
}

// Como mucho unas pocas publicaciones al día, para que el muro no se llene
function canPost() {
  const key = 'bf-posts-' + today();
  try {
    const n = Number(localStorage.getItem(key) || 0);
    if (n >= MAX_EVENTS_PER_DAY) return false;
    localStorage.setItem(key, String(n + 1));
  } catch (e) { /* sin almacenamiento: se publica igual */ }
  return true;
}

function post(event) {
  if (ready && canPost()) fr.postEvent({ ...event, instrument: getState().instrument }).catch(() => {});
}

let prevState = getState();
subscribe(next => {
  const before = prevState;
  prevState = next;
  if (!ready) return;
  fr.eventsFromChange(before, next, next.nom).forEach(post);
  scheduleProfile();
});

window.addEventListener('lesson-finished', e => {
  if (!ready) return;
  const { lesson, stars } = e.detail;
  const title = lessonTitle(lesson);
  scheduleProfile({ playing: { title, at: Date.now() } });
  const isSong = lesson.kind === 'song' || (lesson.kind === 'chords' && lesson.mode === 'strum');
  if (isSong && stars === 3 && title && !lesson.oneTake) post({ type: 'song', icon: '🎵', text: `ha tocado «${title}» con 3 estrellas` });
});

// Al entrar con la cuenta: código de amigo, perfil y avisos pendientes
window.addEventListener('account-ready', async () => {
  if (!cloudConfigured() || !currentAccount()) return;
  ready = true;
  try {
    await fr.ensureFriendCode(myName());
    await fr.updateProfile(profilePatch());
    showInbox();
  } catch (e) { /* sin conexión: se reintenta en el siguiente cambio */ }
  if (pendingCode) go('friends');
  renderCard();
});

async function showInbox() {
  const items = await fr.readInbox();
  if (!items.length) return;
  const line = i => (i.kind === 'reaction' ? `<b>${esc(i.fromName)}</b> ${esc(i.emoji)} a «${esc(i.text || 'tu logro')}»`
    : i.kind === 'cheer' ? `<b>${esc(i.fromName)}</b> te anima a practicar ${esc(i.emoji)}` : `<b>${esc(i.fromName)}</b> ${esc(i.emoji)}`);
  setTimeout(() => {
    if ($('sheet').open) return;
    sheet(`<p class="eyebrow">Tus amigos</p><h2>${items.length === 1 ? 'Tienes un aviso' : `Tienes ${items.length} avisos`}</h2>
      <ul class="inbox">${items.slice(0, 12).map(i => `<li>${line(i)}<small>${fr.timeAgo(i.at)}</small></li>`).join('')}</ul>
      <button type="button" class="btn small" data-close>¡Genial!</button>`);
  }, 1500);
  fr.clearInbox(items).catch(() => {});
}

// ---------- Tarjeta en Aprender ----------
export async function renderCard() {
  const box = $('friendsCard');
  if (!box) return;
  if (!ready) { box.innerHTML = ''; return; }
  box.innerHTML = `<button type="button" class="today-friends" id="openFriends"><span class="ic">👥</span><div><b>Amigos</b><small>Mira qué tocan tus amigos y anímales</small></div></button>`;
  $('openFriends').addEventListener('click', () => go('friends'));
  try {
    const requests = await fr.listRequests();
    if (requests.length) box.querySelector('small').textContent = `${requests.length} ${requests.length === 1 ? 'solicitud nueva' : 'solicitudes nuevas'}`;
  } catch (e) { /* sin conexión */ }
}

window.addEventListener('screen-change', e => { if (e.detail.id === 'learn') renderCard(); });

// ---------- Pantalla ----------
const body = html => { $('friendsBody').innerHTML = html; };

function reactionsHtml(ev, mine) {
  const me = currentAccount() && currentAccount().uid;
  const counts = Object.values(ev.reactions || {}).filter(r => fr.REACTIONS.includes(r)).reduce((m, r) => ({ ...m, [r]: (m[r] || 0) + 1 }), {});
  if (mine) return Object.keys(counts).length ? `<span class="react-sum">${Object.entries(counts).map(([r, n]) => `${r} ${n}`).join(' · ')}</span>` : '';
  return `<span class="reacts">${fr.REACTIONS.map(r => `<button type="button" class="react${ev.reactions && ev.reactions[me] === r ? ' on' : ''}" data-react="${r}" data-ev="${esc(ev.owner)}/${esc(ev.id)}">${r}${counts[r] ? ` ${counts[r]}` : ''}</button>`).join('')}</span>`;
}

function wallHtml() {
  const all = [...data.feed, ...data.mine.map(e => ({ ...e, ownerName: 'Tú', isMine: true }))].sort((a, b) => b.at - a.at).slice(0, 40);
  if (!all.length) return '<p class="empty">Aquí verás los logros de tus amigos: insignias, canciones con 3 estrellas, rachas… ¡y podrás aplaudirles!</p>';
  return all.map(ev => `<div class="post"><span class="avatar">${initial(ev.ownerName)}</span><div><p><b>${esc(ev.ownerName)}</b> ${esc(ev.text)} ${esc(ev.icon || '')}</p>
    <small>${fr.timeAgo(ev.at)}${ev.instrument ? ' · ' + esc(instName(ev.instrument)) : ''}</small>${reactionsHtml(ev, ev.isMine)}</div></div>`).join('');
}

function friendsHtml() {
  if (!data.friends.length) return '<p class="empty">Todavía no tienes amigos en Band Flow. Comparte tu código o tu enlace de invitación.</p>';
  return data.friends.map(f => `<div class="friend"><span class="avatar">${initial(f.name)}</span><div>
      <b>${esc(f.name)}</b><small>${esc(instName(f.instrument))}${f.level ? ' · ' + esc(f.level) : ''}${num(f.streak) ? ` · 🔥 ${num(f.streak)}` : ''}</small>
      ${f.playing ? `<small>Tocando «${esc(f.playing.title)}» · ${fr.timeAgo(f.playing.at)}</small>` : f.lastActive ? `<small>Activo ${fr.timeAgo(f.lastActive)}</small>` : ''}</div>
    <span class="row"><button type="button" class="btn ghost small" data-cheer="${f.id}">💪 Animar</button><button type="button" class="btn ghost small danger" data-unfriend="${f.id}">Quitar</button></span></div>`).join('');
}

function weekHtml() {
  const me = { ...profilePatch(), id: 'me', name: 'Tú' };
  const board = fr.friendsWeekBoard([me, ...data.friends]);
  return `<p class="muted small">Minutos de práctica esta semana (de lunes a domingo).</p>
    <ol class="board">${board.map((p, i) => `<li class="${p.id === 'me' ? 'me' : ''}"><span class="pos">${i + 1}</span><span class="avatar">${initial(p.name)}</span><b>${esc(p.name)}</b><span>${num(p.minutes)} min</span></li>`).join('')}</ol>`;
}

function render() {
  if (!cloudConfigured() || !currentAccount()) { body('<p class="empty">Crea tu usuario (en Perfil) para tener amigos.</p>'); return; }
  const code = data.me && data.me.code;
  body(`<div class="panel friend-code"><div><small>Tu código de amigo</small><b>${esc(code || '……')}</b></div>
      <button type="button" class="btn small" id="shareFriend">Invitar</button></div>
    <form class="row add-friend" id="addFriend"><input id="friendCode" class="input" maxlength="6" placeholder="Código de tu amigo" value="${esc(pendingCode)}" style="text-transform:uppercase" autocomplete="off"><button class="btn small" type="submit">Añadir</button></form>
    ${data.requests.length ? `<h2>Solicitudes</h2>${data.requests.map(r => `<div class="friend"><span class="avatar">${initial(r.fromName)}</span><div><b>${esc(r.fromName)}</b><small>${esc(instName(r.fromInstrument))} · quiere ser tu amigo</small></div>
      <span class="row"><button type="button" class="btn small" data-accept="${r.id}">Aceptar</button><button type="button" class="btn ghost small" data-decline="${r.id}">No</button></span></div>`).join('')}` : ''}
    <div class="subtabs" role="tablist">${[['wall', 'Muro'], ['friends', `Amigos (${data.friends.length})`], ['week', 'Semana']].map(([id, name]) => `<button type="button" role="tab" data-ftab="${id}" aria-selected="${tab === id}">${name}</button>`).join('')}</div>
    <div class="band-view">${tab === 'wall' ? wallHtml() : tab === 'friends' ? friendsHtml() : weekHtml()}</div>`);
}

async function load() {
  if (!cloudConfigured() || !currentAccount()) { render(); return; }
  body('<p class="empty">Cargando a tus amigos…</p>');
  try {
    const uid = currentAccount().uid;
    const [friends, requests, mine, me] = await Promise.all([fr.listFriends(), fr.listRequests(), fr.myEvents(), fr.getProfile(uid)]);
    data = { friends, requests, mine, me, feed: [] };
    render();
    data.feed = await fr.loadFeed(friends);
    if (currentScreen() === 'friends') render();
  } catch (e) {
    body(`<p class="warn">No he podido cargar tus amigos. ${esc(e.message || '')}</p>`);
  }
}

register('friends', { enter: load });

$('friendsBody').addEventListener('submit', async e => {
  if (e.target.id !== 'addFriend') return;
  e.preventDefault();
  const code = $('friendCode').value.trim().toUpperCase();
  if (code.length !== 6) { toast('El código tiene 6 caracteres'); return; }
  try {
    const name = await fr.sendRequest(code, { name: myName(), instrument: getState().instrument });
    pendingCode = '';
    $('friendCode').value = '';
    toast(`Solicitud enviada a ${name}`);
  } catch (err) { toast(err.message); }
});

$('friendsBody').addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;
  try {
    if (t.dataset.ftab) { tab = t.dataset.ftab; render(); return; }
    if (t.id === 'shareFriend') { shareInvite(); return; }
    if (t.dataset.accept) {
      const req = data.requests.find(r => r.id === t.dataset.accept);
      await fr.acceptRequest(req, myName());
      toast(`¡${req.fromName} y tú ya sois amigos!`);
      load();
    }
    if (t.dataset.decline) { await fr.declineRequest(data.requests.find(r => r.id === t.dataset.decline)); load(); }
    if (t.dataset.cheer) {
      await fr.nudge(t.dataset.cheer, myName());
      t.disabled = true;
      toast('¡Ánimo enviado!');
    }
    if (t.dataset.unfriend) {
      if (!t.dataset.confirm) { t.dataset.confirm = '1'; t.textContent = '¿Seguro?'; return; }
      await fr.removeFriend(t.dataset.unfriend);
      load();
    }
    if (t.dataset.react) {
      const [owner, id] = t.dataset.ev.split('/');
      const ev = data.feed.find(x => x.owner === owner && x.id === id);
      const me = currentAccount().uid;
      const now = await fr.react(ev, t.dataset.react, myName());
      ev.reactions = { ...(ev.reactions || {}) };
      if (now) ev.reactions[me] = now; else delete ev.reactions[me];
      render();
    }
  } catch (err) { toast('No se ha podido: ' + (err.message || 'inténtalo otra vez')); }
});

async function shareInvite() {
  const code = data.me && data.me.code;
  if (!code) return;
  const link = `${location.origin}${location.pathname}?${INVITE_PARAM}=${code}`;
  const text = `¡Practica conmigo en Band Flow! Mi código de amigo es ${code}: ${link}`;
  if (navigator.share) { try { await navigator.share({ title: 'Band Flow', text }); return; } catch (err) { if (err.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); toast('Invitación copiada'); } catch (err) { toast(link); }
}
