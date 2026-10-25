// «Mi rutina de hoy»: unos 10 minutos encadenados con un solo botón y un cofre sorpresa al terminar.
// 1) sonido (notas tenidas o pulso), 2) técnica del día, 3) repertorio (tarea de la banda, pasaje difícil o siguiente lección).
import { $, toast, icon } from '../ui.js';
import { go } from '../router.js';
import { technique, MAJOR_KEYS, keyLabel } from '../generate.js';
import { instrumentById } from '../instruments.js';
import { noteLabel, parseNote } from '../music.js';
import { openChest, CARDS, THEMES } from '../rewards.js';
import { getState, update, today } from '../store.js';
import { launch, nextLesson } from '../launch.js';
import { RUDIMENTS, rudimentLesson } from './perc-tools.js';
import { tuningStats } from './tuningmap.js';
import { pendingBandLesson } from './band.js';

const KINDS = ['scale', 'arpeggio', 'thirds'];
const KIND_NAME = { scale: 'Escala', arpeggio: 'Arpegio', thirds: 'Terceras' };
const START_BPM = 60;
const LONGTONE_SECS = 16;

let routine = null;

const dayNumber = () => Math.floor(new Date(today() + 'T12:00').getTime() / 86400000);
const best = id => getState().gym[`${getState().instrument}:${id}`] || 0;

// La nota más desafinada de tu mapa (con datos suficientes) o la primera nota del instrumento
function weakNote(inst) {
  const data = getState().tuning[inst.id] || {};
  const worst = Object.entries(data).map(([m, e]) => ({ midi: Number(m), ...tuningStats(e) }))
    .filter(r => r.n >= 3 && Math.abs(r.mean) >= 5).sort((a, b) => Math.abs(b.mean) - Math.abs(a.mean))[0];
  return worst ? worst.midi : parseNote(inst.firstNotes[0]).midi;
}

function techniqueLesson(inst) {
  const d = dayNumber();
  const kind = KINDS[d % KINDS.length];
  const keys = MAJOR_KEYS.filter(k => technique(kind, k, inst, START_BPM));
  const key = keys[d % keys.length];
  const id = `gym-${kind}-${key}`;
  const bpm = best(id) || START_BPM;
  return { lesson: { id, kind: 'song', song: technique(kind, key, inst, bpm), fixedSpeed: true, gym: { id, bpm } }, title: `${KIND_NAME[kind]} de ${keyLabel(key)} a ${bpm} BPM` };
}

async function buildSteps() {
  const inst = instrumentById(getState().instrument);
  const steps = [];
  if (inst.rhythmOnly) {
    const pulse = RUDIMENTS[0];
    steps.push({ title: pulse.name, lesson: rudimentLesson(pulse, best('rud-pulse') || START_BPM), mode: 'tempo' });
    const r = RUDIMENTS[1 + (dayNumber() % (RUDIMENTS.length - 1))];
    steps.push({ title: r.name, lesson: rudimentLesson(r, best('rud-' + r.id) || START_BPM), mode: 'tempo' });
  } else {
    const midi = weakNote(inst);
    steps.push({ title: `Notas tenidas: ${noteLabel({ midi }, getState().nom, inst.id !== 'violin')}`, longtone: midi });
    const t = techniqueLesson(inst);
    steps.push({ title: t.title, lesson: t.lesson, mode: 'tempo' });
  }
  const band = await pendingBandLesson().catch(() => null);
  if (band) steps.push({ title: `Tarea de la banda: ${band.title}`, lesson: band.lesson, mode: band.mode });
  else {
    const next = nextLesson();
    if (next) steps.push({ title: next.title || 'Siguiente lección del curso', lesson: next });
  }
  return steps;
}

function runStep() {
  const step = routine.steps[routine.index];
  const last = routine.index === routine.steps.length - 1;
  const after = { label: last ? 'Abrir mi cofre' : `Paso ${routine.index + 2} de ${routine.steps.length}: ${routine.steps[routine.index + 1].title}`, run: nextStep };
  toast(`Paso ${routine.index + 1} de ${routine.steps.length}: ${step.title}`);
  if (step.longtone !== undefined) go('longtone', { midi: step.longtone, secs: LONGTONE_SECS, routine: after });
  else launch({ ...step.lesson, nextAction: () => after }, { mode: step.mode, from: 'course' });
}

function nextStep() {
  routine.index++;
  if (routine.index < routine.steps.length) runStep();
  else finishRoutine();
}

function applyReward(reward) {
  const s = getState();
  if (reward.type === 'freeze') update({ freezes: Math.min(2, s.freezes + 1) });
  if (reward.type === 'card') update({ cards: [...s.cards, reward.card] });
  if (reward.type === 'theme') update({ themes: [...s.themes, reward.theme] });
  if (reward.type === 'xp') update({ xp: s.xp + reward.xp });
}

function finishRoutine() {
  routine = null;
  update({ routineDone: { ...getState().routineDone, [today()]: true } });
  const reward = openChest(getState(), Math.random);
  applyReward(reward);
  go('learn');
  const extra = reward.type === 'card' ? `<p class="muted">${CARDS[reward.card][1]}</p>`
    : reward.type === 'theme' ? `<p class="muted">Actívalo en Perfil → Tu estilo. Hay ${THEMES.length - 1} temas por descubrir.</p>` : '';
  $('sheetBody').innerHTML = `<div class="sheet-body chest"><div class="chest-ic" aria-hidden="true">${icon('gift')}</div><h2>¡Rutina completada!</h2>
    <p>Tu premio: <b>${reward.text}</b></p>${extra}<button type="button" class="btn" data-close>¡Genial!</button></div>`;
  $('sheetBody').querySelector('[data-close]').addEventListener('click', () => $('sheet').close());
  $('sheet').showModal();
}

export async function startRoutine() {
  toast('Preparando tu rutina…');
  const steps = await buildSteps();
  routine = { steps, index: 0 };
  runStep();
}

export const routineDoneToday = () => !!getState().routineDone[today()];
