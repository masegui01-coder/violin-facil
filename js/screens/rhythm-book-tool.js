// Botón del Libro de lecturas en Estudio, solo para quien puede usarlo (la pantalla se descarga al abrirla)
import { $ } from '../ui.js';
import { go } from '../router.js';
import { getState } from '../store.js';

export const canUseRhythmBook = () => !!(getState().proTester || getState().adminUser);

export function refreshRhythmBookTool() {
  const tool = $('toolRhythmBook');
  if (tool) tool.hidden = !canUseRhythmBook();
}
$('toolRhythmBook').addEventListener('click', () => go('rhythmbook'));
