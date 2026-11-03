// Estado de la aguja del afinador (sin DOM): solo se muestra una lectura si hay micrófono y sonido.
// Sin permiso o sin señal la aguja queda neutra (gris y centrada): nunca debe parecer «afinada».

// Tras un silencio breve se mantiene la última lectura (entre arcos o golpes de lengua no parpadea)
export const SIGNAL_HOLD_MS = 600;

// denied: el navegador negó el micrófono; ready: el micrófono está abierto o concedido;
// pitch: lectura de audio.readPitch() (null si la app suena o no hay micrófono; {freq:null} si hay silencio);
// msSinceSignal: tiempo desde la última nota oída (Infinity si aún no se ha oído ninguna)
export function tunerMode({ denied = false, ready = false, pitch = null, msSinceSignal = Infinity } = {}) {
  if (denied) return 'denied';
  if (!ready) return 'idle';
  if (pitch && pitch.freq !== null && pitch.freq !== undefined) return 'live';
  return msSinceSignal <= SIGNAL_HOLD_MS ? 'hold' : 'idle';
}

// Error de getUserMedia que significa «permiso denegado» (no «sin micrófono» ni «cerrado al salir»)
export const isPermissionError = err => !!err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
