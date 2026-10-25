// Tarjeta «Hoy»: objetivo diario, racha con protectores y reto del día (la misma partitura para todos los de tu instrumento).
import { levelFor } from '../rewards.js';
import { $, icon, toast } from '../ui.js';
import { dailyProgress, dailySeed, BADGES, earnedBadges } from '../engage.js';
import { sightReading, rhythmReading } from '../generate.js';
import { instrumentById } from '../instruments.js';
import { getState, update, today, currentStreak } from '../store.js';
import { launch } from '../launch.js';
import { startRoutine, routineDoneToday } from './routine.js';

const GOAL_XP = 10;
const LEVEL_FOR = { new: 1, basic: 2, fluent: 3 };

export function dailyLesson() {
  const s = getState();
  const day = today();
  const inst = instrumentById(s.instrument);
  const level = LEVEL_FOR[s.level] || 1;
  const song = inst.rhythmOnly ? rhythmReading(level, dailySeed(day, s.instrument)) : sightReading(level, inst, dailySeed(day, s.instrument));
  return {
    id: `daily-${day}`, kind: 'song', song: { ...song, title: 'Reto del día', by: song.by }, oneTake: true, daily: day, sticking: song.sticking,
    nextAction: () => ({ label: 'Ver clasificación', run: () => window.dispatchEvent(new CustomEvent('open-daily-board')) }),
  };
}

// Racha semanal: días de esta semana (lunes a domingo) con práctica; el objetivo amable es 5 de 7
export function weekDays(practiceLog, day = today()) {
  const d = new Date(day + 'T12:00');
  const monday = new Date(d - ((d.getDay() + 6) % 7) * 86400000);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday.getTime() + i * 86400000);
    const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    return { key, done: (practiceLog[key] || 0) > 0, today: key === day };
  });
}

function weekDots() {
  const days = weekDays(getState().practiceLog);
  const count = days.filter(x => x.done).length;
  return `<div class="week-dots" title="Días con práctica esta semana"><div class="dots">${days.map((x, i) => `<span class="${x.done ? 'on' : ''}${x.today ? ' today' : ''}">${'LMXJVSD'[i]}</span>`).join('')}</div>
    <small>${count >= 5 ? '¡Semana completa!' : `${count} de 5 días esta semana`}</small></div>`;
}

function ring(ratio) {
  const r = 26, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 64 64" class="ring" aria-hidden="true"><circle cx="32" cy="32" r="${r}" class="ring-bg"/><circle cx="32" cy="32" r="${r}" class="ring-fg" stroke-dasharray="${c * ratio} ${c}"/></svg>`;
}

export function renderToday() {
  const s = getState();
  const day = today();
  const goal = dailyProgress(s.practiceLog, s.dailyGoal, day);
  const streak = currentStreak(s.streak);
  const doneToday = s.dailyDone[day] !== undefined;
  $('todayCard').innerHTML = `<div class="today">
    <div class="today-goal">${ring(goal.ratio)}<div><b>${Math.round(goal.minutes)}/${goal.goal} min</b><small>${goal.done ? '¡Objetivo cumplido!' : 'Objetivo de hoy'}</small></div></div>
    <div class="today-streak"><span class="ic">${icon('flame')}</span><div><b>${streak} ${streak === 1 ? 'día' : 'días'}</b><small>${s.freezes ? `${s.freezes} ${s.freezes === 1 ? 'protector' : 'protectores'}` : 'Racha'}</small></div></div>
    <button type="button" class="today-routine${routineDoneToday() ? ' done' : ''}" id="routineBtn"><span class="ic">${icon('routine')}</span><div><b>${routineDoneToday() ? 'Rutina de hoy hecha ✓' : 'Mi rutina de hoy · 10 min'}</b><small>${routineDoneToday() ? 'Puedes repetirla si quieres' : 'Sonido, técnica y repertorio, con cofre sorpresa'}</small></div></button>
    ${weekDots()}
    <button type="button" class="today-daily" id="dailyBtn"><span class="ic">${icon('sight')}</span><div><b>Reto del día</b><small>${doneToday ? `Hecho · ${s.dailyDone[day]}★` : 'Una toma · igual para todos'}</small></div></button>
    <button type="button" class="today-link" id="dailyBoardBtn">Clasificación del reto</button>
    <button type="button" class="today-link" id="leagueBtn">Liga semanal</button>
  </div>`;
  $('routineBtn').addEventListener('click', startRoutine);
  $('dailyBtn').addEventListener('click', () => launch(dailyLesson(), { mode: 'tempo', from: 'course' }));
  $('dailyBoardBtn').addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-daily-board')));
  $('leagueBtn').addEventListener('click', () => window.dispatchEvent(new CustomEvent('open-league')));
}

window.addEventListener('lesson-finished', e => {
  const { lesson, stars } = e.detail;
  if (!lesson.daily) return;
  const prev = getState().dailyDone[lesson.daily];
  update({ dailyDone: { ...getState().dailyDone, [lesson.daily]: Math.max(prev || 0, stars) } });
});

// Celebraciones: objetivo diario cumplido e insignias nuevas
export function checkCelebrations(s) {
  const day = today();
  if (dailyProgress(s.practiceLog, s.dailyGoal, day).done && s.goalCelebrated !== day) {
    update({ goalCelebrated: day, xp: s.xp + GOAL_XP });
    toast(`¡Objetivo de hoy cumplido! +${GOAL_XP} puntos`);
    return;
  }
  const lvl = levelFor(s.xp);
  if (s.levelSeen === undefined) update({ levelSeen: lvl.index });
  else if (lvl.index > s.levelSeen) {
    update({ levelSeen: lvl.index });
    toast(`¡Subes de nivel! Ahora eres ${lvl.name}`);
    return;
  }
  const earned = earnedBadges(s);
  const fresh = earned.filter(id => !s.badges.includes(id));
  if (fresh.length) {
    update({ badges: earned });
    toast('Nueva insignia: ' + BADGES.find(b => b.id === fresh[0]).name);
  }
}
