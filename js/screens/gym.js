// Gimnasio de técnica: escalas, arpegios y terceras en las 12 tonalidades, con el tempo que sube al superarlas.
import { $, esc } from '../ui.js';
import { register } from '../router.js';
import { technique, MAJOR_KEYS, EXERCISE_IDS, keyLabel } from '../generate.js';
import { instrumentById } from '../instruments.js';
import { getState, recordGym, update } from '../store.js';
import { launch } from '../launch.js';
import { renderRudiments } from './perc-tools.js';

const START_BPM = 60;
const STEP_BPM = 4;
const MIN_BPM = 32;
const MAX_BPM = 200;
const PASS_STARS = 2;
const KIND_NAME = { scale: 'Escala', arpeggio: 'Arpegio', thirds: 'Terceras' };
const FIGURES = [['q', 'Negras'], ['h', 'Blancas'], ['e', 'Corcheas']];

let kind = 'scale';

const bestBpm = id => getState().gym[`${getState().instrument}:${id}`] || 0;

// Tempo y figura que eligió el alumno (por defecto negras a 60, lo cómodo para empezar)
const opts = () => ({ figure: 'q', bpm: START_BPM, ...getState().gymOpts });
const clampBpm = bpm => Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));

function gymLesson(exKind, key, bpm) {
  const song = technique(exKind, key, instrumentById(getState().instrument), bpm, opts().figure);
  return {
    id: song.id, kind: 'song', song, fixedSpeed: true, fromGym: true, gym: { id: song.id, bpm },
    nextAction: ({ stars }) => (stars >= PASS_STARS
      ? { label: `Subir a ${bpm + STEP_BPM} BPM`, run: () => launch(gymLesson(exKind, key, clampBpm(bpm + STEP_BPM)), { mode: 'tempo', from: 'practice' }) }
      : { label: `Repetir a ${bpm} BPM`, run: () => launch(gymLesson(exKind, key, bpm), { mode: 'tempo', from: 'practice' }) }),
  };
}

function render() {
  const inst = instrumentById(getState().instrument);
  if (inst.rhythmOnly) { renderRudiments(); return; }
  $('gymKinds').closest('.setting').hidden = false;
  const { figure, bpm } = opts();
  $('gymKinds').innerHTML = EXERCISE_IDS.map(k => `<button type="button" data-kind="${k}" aria-pressed="${k === kind}">${KIND_NAME[k]}</button>`).join('');
  $('gymFigures').innerHTML = FIGURES.map(([f, name]) => `<button type="button" data-figure="${f}" aria-pressed="${f === figure}">${name}</button>`).join('');
  $('gymBpm').textContent = `${bpm} BPM`;
  $('gymSlower').disabled = bpm <= MIN_BPM;
  $('gymFaster').disabled = bpm >= MAX_BPM;
  $('gymList').innerHTML = MAJOR_KEYS.map(key => {
    const song = technique(kind, key, inst, bpm, figure);
    if (!song) return '';
    const best = bestBpm(song.id);
    return `<button type="button" class="gym-row" data-key="${key}"><span><b>${esc(keyLabel(key))}</b><small>${best ? 'Tu récord' : 'Sin intentar'}</small></span>
      <span class="gym-bpm">${best ? best + ' BPM' : '—'}</span></button>`;
  }).join('');
}

register('gym', { enter: render });

// Guarda el récord cuando una pasada sale con 2 estrellas o más
// y deja el tempo elegido en el último que se tocó, para que «Subir» o «Repetir» se recuerden
window.addEventListener('lesson-finished', e => {
  const { lesson, stars } = e.detail;
  if (!lesson.gym) return;
  if (stars >= PASS_STARS) recordGym(lesson.gym.id, lesson.gym.bpm);
  if (lesson.fromGym) update({ gymOpts: { ...opts(), bpm: lesson.gym.bpm } });
});

$('gymKinds').addEventListener('click', e => { const b = e.target.closest('[data-kind]'); if (b) { kind = b.dataset.kind; render(); } });
$('gymFigures').addEventListener('click', e => { const b = e.target.closest('[data-figure]'); if (b) { update({ gymOpts: { ...opts(), figure: b.dataset.figure } }); render(); } });
const nudge = delta => { update({ gymOpts: { ...opts(), bpm: clampBpm(opts().bpm + delta) } }); render(); };
$('gymSlower').addEventListener('click', () => nudge(-STEP_BPM));
$('gymFaster').addEventListener('click', () => nudge(STEP_BPM));
$('gymList').addEventListener('click', e => {
  const b = e.target.closest('[data-key]');
  if (b) launch(gymLesson(kind, b.dataset.key, opts().bpm), { mode: 'tempo', from: 'practice' });
});
