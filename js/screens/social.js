// Social: compartir partituras, retar a amigos, clasificaciones abiertas, reto del día y liga semanal.
import { $, esc, toast } from '../ui.js';
import { cloudConfigured, cloudErrorText } from '../cloud.js';
import * as social from '../social-api.js';
import { songPayload } from '../band-api.js';
import { SONGS, songById, MY_STYLE } from '../songs.js';
import { instrumentById } from '../instruments.js';
import { weekId } from '../engage.js';
import { getState, update, today, addImportedSong } from '../store.js';
import { launch } from '../launch.js';

const LEAGUE_BASE = 5;
const LEAGUE_PER_STAR = 10;
const params = new URLSearchParams(location.search);

const inst = () => getState().instrument;
const instName = () => instrumentById(inst()).name;
const isRepertoire = id => SONGS.some(s => s.id === id);

function sheet(html) {
  $('sheetBody').innerHTML = `<div class="sheet-body">${html}<button type="button" class="btn ghost small" data-close>Cerrar</button></div>`;
  $('sheetBody').querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $('sheet').close()));
  if (!$('sheet').open) $('sheet').showModal();
}

// Nombre público: el de la banda, uno guardado o se pide una vez
function nickname() {
  const s = getState();
  const known = s.nickname || (s.band && s.band.nickname);
  if (known) return Promise.resolve(known);
  return new Promise(resolve => {
    sheet(`<h2>¿Cómo te llamamos?</h2><p class="muted small">Es el nombre que verán tus amigos en los retos y clasificaciones. Usa un apodo si prefieres.</p>
      <input id="nickInput" class="input" maxlength="30" placeholder="Tu apodo"><button type="button" class="btn" id="nickOk">Guardar</button>`);
    $('nickOk').addEventListener('click', () => {
      const name = $('nickInput').value.trim();
      if (!name) return;
      update({ nickname: name });
      $('sheet').close();
      resolve(name);
    });
  });
}

async function shareText(text, url) {
  if (navigator.share) { try { await navigator.share({ title: 'Band Flow', text, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast('Enlace copiado'); } catch (e) { toast(url); }
}
const linkWith = (key, code) => `${location.origin}${location.pathname}?${key}=${code}`;

function boardHtml({ me, rows }, unit = 'pct') {
  if (!rows.length) return '<p class="empty">Todavía nadie. ¡Sé el primero!</p>';
  return `<div class="leader">${rows.map((r, i) => `<div class="leader-row${r.uid === me ? ' me' : ''}"><span class="leader-pos">${i + 1}</span>
    <span><b>${esc(r.name)}</b>${r.instrument ? `<br><small class="muted">${esc(instrumentById(r.instrument).name)}</small>` : ''}</span>
    <b>${unit === 'pct' ? Math.round(r.score * 100) + ' %' : Math.round(r.score) + ' pts'}</b></div>`).join('')}</div>`;
}

async function showBoard(title, path, extra = '', unit = 'pct') {
  sheet(`<h2>${esc(title)}</h2>${extra}<div id="boardBox"><p class="muted">Cargando…</p></div>`);
  try { $('boardBox').innerHTML = boardHtml(await social.topScores(path), unit); }
  catch (err) { $('boardBox').innerHTML = `<p class="warn">${esc(cloudErrorText(err))}</p>`; }
}

// ---------- Acciones desde la ficha de una canción ----------
async function challengeFriend(song) {
  const name = await nickname();
  try {
    const code = await social.createChallenge(songPayload(song), inst(), name);
    await shareText(`${name} te reta a tocar «${song.title}» (${instName()}) en Band Flow. ¿Quién lo hace mejor?`, linkWith('reto', code));
    openChallenge(code);
  } catch (err) { toast(cloudErrorText(err)); }
}

async function shareScore(song) {
  const name = await nickname();
  try {
    const code = await social.shareScore(songPayload(song), name);
    await shareText(`${name} te comparte la partitura «${song.title}» para ensayar en Band Flow.`, linkWith('partitura', code));
  } catch (err) { toast(cloudErrorText(err)); }
}

async function openChallenge(code) {
  try {
    const ch = await social.getChallenge(code);
    const lesson = { id: 'reto-' + code, kind: 'song', song: { ...ch.song, id: 'reto-' + code, style: null, difficulty: 2 }, oneTake: true, fixedSpeed: true, challenge: code,
      nextAction: () => ({ label: 'Ver el reto', run: () => openChallenge(code) }) };
    sheet(`<p class="eyebrow">Reto de ${esc(ch.ownerName)}</p><h2>${esc(ch.song.title)}</h2>
      <p class="muted small">${esc(instrumentById(ch.instrument).name)} · a tempo, al 100 % y en una sola toma. Cuenta tu mejor intento.</p>
      <button type="button" class="btn big" id="acceptChallenge">Aceptar el reto</button>
      <button type="button" class="btn ghost small" id="shareChallenge">Invitar a más amigos</button><div id="boardBox"><p class="muted">Cargando…</p></div>`);
    $('acceptChallenge').addEventListener('click', () => { $('sheet').close(); launch(lesson, { mode: 'tempo', from: 'songs' }); });
    $('shareChallenge').addEventListener('click', () => shareText(`Reto en Band Flow: «${ch.song.title}». ¿Quién lo toca mejor?`, linkWith('reto', code)));
    $('boardBox').innerHTML = boardHtml(await social.topScores(['challenges', code]));
  } catch (err) { sheet(`<h2>Reto</h2><p class="warn">${esc(cloudErrorText(err))}</p>`); }
}

async function openSharedScore(code) {
  try {
    const shared = await social.getSharedScore(code);
    sheet(`<p class="eyebrow">Partitura de ${esc(shared.ownerName)}</p><h2>${esc(shared.song.title)}</h2><p class="muted small">${esc(shared.song.by || '')}</p>
      <button type="button" class="btn big" id="saveShared">Guardar en «Mis partituras»</button>`);
    $('saveShared').addEventListener('click', () => {
      addImportedSong({ ...shared.song, id: 'imp-' + code, style: MY_STYLE.id, difficulty: 2, importedAt: new Date().toISOString() });
      $('sheet').close();
      toast('Guardada en «Mis partituras»');
    });
  } catch (err) { sheet(`<h2>Partitura compartida</h2><p class="warn">${esc(cloudErrorText(err))}</p>`); }
}

window.addEventListener('social-action', e => {
  if (!cloudConfigured()) { toast('Lo social llegará cuando se conecte el servidor'); return; }
  const { action, songId } = e.detail;
  const song = songById(songId);
  if (action === 'challenge') challengeFriend(song);
  if (action === 'share') shareScore(song);
  if (action === 'board') showBoard(`${song.title} · ${instName()}`, ['boards', `${songId}_${inst()}`], '<p class="muted small">Mejor toma a tempo al 100 % de cada músico.</p>');
});

window.addEventListener('open-daily-board', () => {
  if (!cloudConfigured()) { toast('La clasificación llegará cuando se conecte el servidor'); return; }
  showBoard(`Reto del día · ${instName()}`, ['daily', `${today()}_${inst()}`], '<p class="muted small">La misma partitura para todos los que tocan tu instrumento hoy.</p>');
});
window.addEventListener('open-league', () => {
  if (!cloudConfigured()) { toast('La liga llegará cuando se conecte el servidor'); return; }
  showBoard(`Liga semanal · ${instName()}`, ['leagues', `${weekId()}_${inst()}`], '<p class="muted small">Puntos de esta semana (de lunes a domingo). Cada lección suma.</p>', 'pts');
});

// Resultados: retos, clasificación de la canción, reto del día y liga semanal
window.addEventListener('lesson-finished', async e => {
  if (!cloudConfigured()) return;
  const { lesson, mode, stars, accuracy, speed } = e.detail;
  if (accuracy === null || accuracy === undefined) return;
  try {
    const name = getState().nickname || (getState().band && getState().band.nickname);
    if (!name) return;
    const entry = { name, score: accuracy, stars, instrument: inst() };
    if (lesson.challenge) await social.submitScore(['challenges', lesson.challenge], entry);
    if (lesson.daily) await social.submitScore(['daily', `${lesson.daily}_${inst()}`], entry);
    if (mode === 'tempo' && speed === 1 && lesson.songId && isRepertoire(lesson.songId)) await social.submitScore(['boards', `${lesson.songId}_${inst()}`], entry);
    if (stars > 0) await social.addLeaguePoints(['leagues', `${weekId()}_${inst()}`], { name, points: LEAGUE_BASE + stars * LEAGUE_PER_STAR, instrument: inst() });
  } catch (err) { toast('No se ha podido enviar tu resultado: ' + cloudErrorText(err)); }
});

// Enlaces: ?reto=CÓDIGO y ?partitura=CÓDIGO
if (cloudConfigured() && getState().onboarded) {
  if (params.get('reto')) setTimeout(() => openChallenge(params.get('reto')), 300);
  else if (params.get('partitura')) setTimeout(() => openSharedScore(params.get('partitura')), 300);
}

export { nickname };
