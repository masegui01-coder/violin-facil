// Liga semanal (sin DOM ni red): las reglas aceptan una suma cada minuto (hora del servidor), como mucho
// LEAGUE_MAX_WRITE puntos por escritura y LEAGUE_WEEK_MAX en la semana. Lo que aún no se puede enviar se acumula.
export const LEAGUE_INTERVAL_MS = 60000;
export const LEAGUE_MARGIN_MS = 5000;   // diferencia de reloj entre el móvil y el servidor
export const LEAGUE_MAX_WRITE = 120;
export const LEAGUE_WEEK_MAX = 5000;

// pending: puntos por enviar · current: { score, atMs } del documento (null si no hay) · now: hora del cliente
// → { send: puntos a sumar ya, carry: puntos que esperan, waitMs: cuándo volver a intentarlo (0 = nada pendiente) }
export function leaguePlan(pending, current, now) {
  const score = (current && current.score) || 0;
  const wanted = Math.min(Math.max(0, pending), Math.max(0, LEAGUE_WEEK_MAX - score)); // lo que pase del tope se pierde
  if (wanted <= 0) return { send: 0, carry: 0, waitMs: 0 };
  const nextAt = current && current.atMs ? current.atMs + LEAGUE_INTERVAL_MS + LEAGUE_MARGIN_MS : 0;
  if (nextAt > now) return { send: 0, carry: wanted, waitMs: nextAt - now };
  const send = Math.min(wanted, LEAGUE_MAX_WRITE);
  const carry = wanted - send;
  return { send, carry, waitMs: carry ? LEAGUE_INTERVAL_MS + LEAGUE_MARGIN_MS : 0 };
}
