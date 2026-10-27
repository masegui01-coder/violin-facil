// Perfil: nivel, perfil de habilidades, informe semanal, cromos, temas de color y diploma.
import { $, esc, toast, icon } from '../ui.js';
import { skills, radarPoints, compareWeeks } from '../report.js';
import { levelFor, CARDS, THEMES } from '../rewards.js';
import { weekId } from '../engage.js';
import { keyLabel } from '../generate.js';
import { instrumentById } from '../instruments.js';
import { getState, update, knownChords } from '../store.js';
import { SONGBOOK, playableCount } from '../songbook.js';
import { chordLabel } from '../chords.js';
import { tuningStats } from './tuningmap.js';

const DAY_MS = 86400000;
const avg = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function currentSkills() {
  const s = getState();
  const inst = instrumentById(s.instrument);
  const tune = Object.values(s.tuning[s.instrument] || {}).map(tuningStats).filter(t => t.n >= 3);
  const tuningAbs = tune.length ? avg(tune.map(t => Math.abs(t.mean))) : null;
  const gym = Object.entries(s.gym).filter(([k]) => k.startsWith(s.instrument + ':')).map(([, v]) => v);
  const since = new Date(Date.now() - 30 * DAY_MS).toISOString().slice(0, 10);
  const practiceDays30 = Object.entries(s.practiceLog).filter(([d, m]) => d >= since && m > 0).length;
  return skills({ tuningAbs, tempoAcc: avg(s.recentAcc), gymBest: gym.length ? Math.max(...gym) : 0, readingAcc: avg(s.recentReading), practiceDays30, rhythmOnly: inst.rhythmOnly || inst.fixedPitch, chordsKnown: inst.polyphonic ? knownChords().length : null });
}

function radarSvg(list) {
  const cx = 130, cy = 115, r = 80;
  const grid = [25, 50, 75, 100].map(v => `<polygon points="${radarPoints(list.map(() => v), cx, cy, r).map(p => p.join(',')).join(' ')}" class="radar-grid"/>`).join('');
  const shape = radarPoints(list.map(x => x.value), cx, cy, r).map(p => p.join(',')).join(' ');
  const labels = radarPoints(list.map(() => 128), cx, cy, r).map(([x, y], i) => `<text x="${x}" y="${y + 4}" class="radar-label">${esc(list[i].name)} ${Math.round(list[i].value)}</text>`).join('');
  return `<svg viewBox="0 0 260 230" class="radar" role="img" aria-label="Perfil de habilidades">${grid}<polygon points="${shape}" class="radar-shape"/>${labels}</svg>`;
}

// Nombres legibles para los ejercicios del gimnasio en el informe
function exerciseName(id) {
  const m = /^gym-(scale|arpeggio|thirds)-(.+)$/.exec(id);
  if (m) return `${{ scale: 'Escala', arpeggio: 'Arpegio', thirds: 'Terceras' }[m[1]]} de ${keyLabel(m[2])}`;
  if (id.startsWith('rud-')) return 'Rudimento ' + id.slice(4);
  return id;
}

function prevWeekId() {
  return weekId(new Date(Date.now() - 7 * DAY_MS));
}

function reportLines() {
  const s = getState();
  return compareWeeks(s.history[weekId()], s.history[prevWeekId()]).map(l => ({ ...l, text: l.text.replace(/^(gym-[^:]+|rud-[^:]+):/, (_, id) => exerciseName(id) + ':') }));
}

// Guitarra y piano: acordes que sabes, canciones que abren y la evolución de tus cambios de un minuto
const SPARK_POINTS = 10;
function chordsHtml() {
  const s = getState();
  if (!instrumentById(s.instrument).polyphonic) return '';
  const known = knownChords();
  const pairs = Object.entries(s.changes).filter(([k]) => k.startsWith(s.instrument + ':'));
  const pairName = k => k.split(':')[1].split('-').map(c => chordLabel(c, s.nom)).join(' – ');
  return `<h3>Tus acordes</h3>
    <p class="small">${known.length} acordes · ${playableCount(known)} de ${SONGBOOK.length} canciones del cancionero</p>
    ${pairs.length ? `<div class="changes-list">${pairs.map(([k, hist]) => {
      const last = hist.slice(-SPARK_POINTS);
      const best = Math.max(...hist.map(h => h.count));
      return `<div class="changes-row"><span>${esc(pairName(k))}</span><span class="spark">${last.map(h => `<i style="height:${Math.max(8, h.count / best * 100)}%"></i>`).join('')}</span><b>${best}</b></div>`;
    }).join('')}<small class="muted">Récord de cambios en un minuto y tus últimos intentos</small></div>` : ''}`;
}

export function renderProgress() {
  const s = getState();
  const lvl = levelFor(s.xp);
  const lines = reportLines();
  $('progressPanel').innerHTML = `<h2>Tu progreso</h2>
    <div class="level"><div><small>Nivel</small><b>${esc(lvl.name)}</b></div><div class="level-bar"><i style="width:${Math.round(lvl.progress * 100)}%"></i></div>
      <small>${lvl.next ? `${lvl.next.xp - s.xp} puntos para ${esc(lvl.next.name)}` : 'Nivel máximo'}</small></div>
    ${radarSvg(currentSkills())}
    ${chordsHtml()}
    <h3>Esta semana</h3>
    <ul class="report">${lines.map(l => `<li class="${l.good ? 'up' : 'down'}">${esc(l.text)}</li>`).join('') || '<li>Practica unos días y aquí verás cómo mejoras.</li>'}</ul>
    <div class="row"><button type="button" class="btn ghost small" id="openCards">Mis cromos (${s.cards.length}/${CARDS.length})</button><button type="button" class="btn ghost small" id="openDiploma">Mi diploma</button></div>
    <div class="setting"><span id="themeLabel">Tu estilo (temas que has ganado)</span><div class="theme-row" role="group" aria-labelledby="themeLabel">
      ${THEMES.map(t => { const owned = t.free || s.themes.includes(t.id); return `<button type="button" class="theme-opt" data-theme-id="${t.id}" data-swatch="${t.id}" aria-pressed="${s.theme === t.id}" ${owned ? '' : 'disabled'} title="${owned ? t.name : 'Se gana en los cofres de la rutina'}">${owned ? esc(t.name) : `<span class="ic">${icon('lock')}</span>`}</button>`; }).join('')}</div></div>`;
  $('openCards').addEventListener('click', openCards);
  $('openDiploma').addEventListener('click', downloadDiploma);
  $('progressPanel').querySelectorAll('[data-theme-id]').forEach(b => b.addEventListener('click', () => { update({ theme: b.dataset.themeId }); renderProgress(); }));
}

function openCards() {
  const s = getState();
  $('sheetBody').innerHTML = `<div class="sheet-body"><h2>Mis cromos</h2><p class="muted small">Se ganan en los cofres de la rutina diaria.</p>
    <div class="cards">${CARDS.map(([name, fact], i) => (s.cards.includes(i) ? `<div class="card on"><b>${esc(name)}</b><small>${esc(fact)}</small></div>` : '<div class="card"><b>?</b></div>')).join('')}</div>
    <button type="button" class="btn small" data-close>Cerrar</button></div>`;
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('sheet').showModal();
}

// Diploma en imagen para guardar o compartir
function downloadDiploma() {
  const s = getState();
  const cv = document.createElement('canvas');
  cv.width = 1200; cv.height = 850;
  const g = cv.getContext('2d');
  g.fillStyle = '#FBF7EF'; g.fillRect(0, 0, 1200, 850);
  g.strokeStyle = '#B4461F'; g.lineWidth = 14; g.strokeRect(30, 30, 1140, 790);
  g.lineWidth = 3; g.strokeRect(56, 56, 1088, 738);
  g.textAlign = 'center'; g.fillStyle = '#141B26';
  g.font = '700 30px Figtree, sans-serif'; g.fillText('BAND FLOW', 600, 150);
  g.font = '64px "Young Serif", Georgia, serif'; g.fillText('Diploma de constancia', 600, 250);
  g.font = '30px Figtree, sans-serif'; g.fillText('Se concede a', 600, 330);
  g.font = '56px "Young Serif", Georgia, serif'; g.fillText(s.nickname || (s.band && s.band.nickname) || 'Músico de Band Flow', 600, 420);
  const days = Object.values(s.practiceLog).filter(m => m > 0).length;
  const minutes = Math.round(Object.values(s.practiceLog).reduce((a, b) => a + b, 0));
  g.font = '30px Figtree, sans-serif';
  g.fillText(`${instrumentById(s.instrument).name} · nivel ${levelFor(s.xp).name}`, 600, 500);
  g.fillText(`${days} días de práctica · ${minutes} minutos · ${s.badges.length} insignias`, 600, 560);
  g.font = '24px Figtree, sans-serif'; g.fillStyle = '#5A6678';
  g.fillText(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), 600, 700);
  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = 'diploma-band-flow.png';
  a.click();
  toast('Diploma descargado');
}

// Informe semanal: se enseña una vez al empezar cada semana si la anterior tuvo práctica
export function maybeWeeklyReport() {
  const s = getState();
  const prev = s.history[prevWeekId()];
  if (!prev || s.reportSeen === weekId()) return;
  update({ reportSeen: weekId() });
  const lines = compareWeeks(prev, s.history[weekId(new Date(Date.now() - 14 * DAY_MS))]);
  $('sheetBody').innerHTML = `<div class="sheet-body"><p class="eyebrow">Tu semana pasada</p><h2>Informe semanal</h2>
    <ul class="report">${lines.map(l => `<li class="${l.good ? 'up' : 'down'}">${esc(l.text.replace(/^(gym-[^:]+|rud-[^:]+):/, (_, id) => exerciseName(id) + ':'))}</li>`).join('')}</ul>
    <p class="muted small">Sigue así: diez minutos al día se notan.</p><button type="button" class="btn small" data-close>¡Vamos!</button></div>`;
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  setTimeout(() => { if (!$('sheet').open && !document.querySelector('#tour:not([hidden])')) $('sheet').showModal(); }, 800);
}
