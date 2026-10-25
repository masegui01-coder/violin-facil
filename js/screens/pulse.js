// Pulso visual: un péndulo que va de un extremo a otro y llega a cada lado justo en el pulso.
// Hay uno en cada pantalla de tocar a tempo (lección, ritmo y acordes): createPulse(id del contenedor).

const SWING = 44;          // recorrido en % a cada lado del centro
const HIT_WINDOW = 0.12;   // fracción de pulso que el extremo queda encendido

export function createPulse(id, flashSelector = null) {
  const root = () => document.getElementById(id);
  const flash = () => (flashSelector ? document.querySelector(flashSelector) : null);
  return {
    show(visible) {
      root().hidden = !visible;
      if (!visible && flash()) flash().classList.remove('beat');
    },
    // beat: pulsos transcurridos con decimales (negativo durante la cuenta previa); meter: pulsos por compás
    draw(beat, meter) {
      if (beat === null) return;
      const el = root();
      el.querySelector('.pulse-bob').style.left = (50 - SWING * Math.cos(Math.PI * beat)) + '%';
      const k = Math.round(beat);
      const near = Math.abs(beat - k) < HIT_WINDOW;
      const left = ((k % 2) + 2) % 2 === 0;
      el.querySelector('.pulse-mark.l').classList.toggle('hit', near && left);
      el.querySelector('.pulse-mark.r').classList.toggle('hit', near && !left);
      el.classList.toggle('down', near && meter > 1 && ((k % meter) + meter) % meter === 0);
      if (flash()) flash().classList.toggle('beat', near);
    },
  };
}

// Péndulo de la lección (el que usa el reproductor)
const lessonPulse = createPulse('pulse', '#lesson .staff-card');
export const showPulse = visible => lessonPulse.show(visible);
export const drawPulse = (beat, meter) => lessonPulse.draw(beat, meter);
