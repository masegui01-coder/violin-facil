// Gimnasio de técnica: escalas, arpegios y terceras en las 12 tonalidades, con el tempo que sube al superarlas.
import { $, esc } from '../ui.js';
import { register } from '../router.js';
import { technique, MAJOR_KEYS, EXERCISE_IDS, keyLabel } from '../generate.js';
import { instrumentById } from '../instruments.js';
import { getState, recordGym } from '../store.js';
import { launch } from '../launch.js';
import { renderRudiments } from './perc-tools.js';

const START_BPM = 60;
const STEP_BPM = 4;
const PASS_STARS = 2;
const KIND_NAME = { scale: 'Escala', arpeggio: 'Arpegio', thirds: 'Terceras' };

let kind = 'scale';

const bestBpm = id => getState().gym[`${getState().instrument}:${id}`] || 0;

function gymLesson(exKind, key, bpm) {
  const song = technique(exKind, key, instrumentById(getState().instrument), bpm);
  return {
    id: song.id, kind: 'song', song, fixedSpeed: true, gym: { id: song.id, bpm },
    nextAction: ({ stars }) => (stars >= PASS_STARS
      ? { label: `Subir a ${bpm + STEP_BPM} BPM`, run: () => launch(gymLesson(exKind, key, bpm + STEP_BPM), { mode: 'tempo', from: 'practice' }) }
      : { label: `Repetir a ${bpm} BPM`, run: () => launch(gymLesson(exKind, key, bpm), { mode: 'tempo', from: 'practice' }) }),
  };
}

function render() {
  const inst = instrumentById(getState().instrument);
  if (inst.rhythmOnly) { renderRudiments(); return; }
  $('gymKinds').closest('.setting').hidden = false;
  $('gymKinds').innerHTML = EXERCISE_IDS.map(k => `<button type="button" data-kind="${k}" aria-pressed="${k === kind}">${KIND_NAME[k]}</button>`).join('');
  $('gymList').innerHTML = MAJOR_KEYS.map(key => {
    const song = technique(kind, key, inst, START_BPM);
    if (!song) return '';
    const best = bestBpm(song.id);
    return `<button type="button" class="gym-row" data-key="${key}"><span><b>${esc(keyLabel(key))}</b><small>${best ? 'Tu récord' : 'Sin intentar'}</small></span>
      <span class="gym-bpm">${best ? best + ' BPM' : '—'}</span></button>`;
  }).join('');
}

register('gym', { enter: render });

// Guarda el récord cuando una pasada sale con 2 estrellas o más
window.addEventListener('lesson-finished', e => {
  const { lesson, stars } = e.detail;
  if (lesson.gym && stars >= PASS_STARS) recordGym(lesson.gym.id, lesson.gym.bpm);
});

$('gymKinds').addEventListener('click', e => { const b = e.target.closest('[data-kind]'); if (b) { kind = b.dataset.kind; render(); } });
$('gymList').addEventListener('click', e => {
  const b = e.target.closest('[data-key]');
  if (!b) return;
  const id = `gym-${kind}-${b.dataset.key}`;
  launch(gymLesson(kind, b.dataset.key, bestBpm(id) || START_BPM), { mode: 'tempo', from: 'practice' });
});
