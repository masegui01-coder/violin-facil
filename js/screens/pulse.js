// Pulso visual: un péndulo que va de un extremo a otro y llega a cada lado justo en el pulso.
import { $ } from '../ui.js';

const SWING = 44;          // recorrido en % a cada lado del centro
const HIT_WINDOW = 0.12;   // fracción de pulso que el extremo queda encendido

export function showPulse(visible) {
  $('pulse').hidden = !visible;
  if (!visible) {
    document.querySelector('#lesson .staff-card').classList.remove('beat');
  }
}

// beat: pulsos transcurridos con decimales (negativo durante la cuenta previa); meter: pulsos por compás
export function drawPulse(beat, meter) {
  if (beat === null) return;
  $('pulseBob').style.left = (50 - SWING * Math.cos(Math.PI * beat)) + '%';
  const k = Math.round(beat);
  const near = Math.abs(beat - k) < HIT_WINDOW;
  const left = ((k % 2) + 2) % 2 === 0;
  document.querySelector('#pulse .pulse-mark.l').classList.toggle('hit', near && left);
  document.querySelector('#pulse .pulse-mark.r').classList.toggle('hit', near && !left);
  const downbeat = meter > 1 && ((k % meter) + meter) % meter === 0;
  $('pulse').classList.toggle('down', near && downbeat);
  document.querySelector('#lesson .staff-card').classList.toggle('beat', near);
}
