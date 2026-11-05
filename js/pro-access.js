// Acceso al Aula Pro (profesor, de pago): se consulta SOLO aquí. El alumno nunca paga.
// Hoy: licencia que activa el administrador en la escuela del profesor (schools/{sid}.premium, ver school.js).
// Mañana: compras de Google Play / App Store. La compra la verificará el servidor y escribirá la misma licencia en la
// escuela (las reglas de Firestore solo se fían de ella); mientras llega, el cliente puede pasar aquí la compra local
// (purchase) para no hacer esperar al profesor. Ninguna pantalla mira la licencia por su cuenta: todas llaman a proAccess().
import { premiumActive } from './school.js';

export const PRO_SOURCE = { license: 'license', store: 'store' };
// Pagos de las tiendas: desactivados hasta que exista la verificación en el servidor
export const STORE_PURCHASES = false;

// { active, source, until (ms o null), requested } para una escuela (o ninguna) y, en el futuro, una compra de tienda
export function proAccess({ school = null, purchase = null, now = Date.now() } = {}) {
  if (STORE_PURCHASES && purchase && purchase.active && (!purchase.until || purchase.until >= now)) {
    return { active: true, source: PRO_SOURCE.store, until: purchase.until || null, requested: false };
  }
  if (premiumActive(school, now)) {
    const until = school.premium.until ? Date.parse(school.premium.until) : null;
    return { active: true, source: PRO_SOURCE.license, until: Number.isFinite(until) ? until : null, requested: false };
  }
  // Licencia que existió y ya no vale (venció o el administrador la quitó): el profesor conserva sus clases en solo lectura,
  // puede exportarlas y borrar datos, y pedir la renovación
  const p = school && school.premium;
  const requested = !!(school && school.proRequestedAt);
  if (!p) return { active: false, source: null, until: null, requested };
  const ended = p.until ? Date.parse(p.until) : NaN;
  const at = school.proRequestedAt;
  const askedMs = at && typeof at.toMillis === 'function' ? at.toMillis() : Number(at) || 0;
  return {
    active: false, source: null, until: null, expired: true, revoked: !p.active,
    expiredAt: Number.isFinite(ended) && p.active ? ended : null,
    requested: askedMs > (Number.isFinite(ended) ? ended : 0),
  };
}

// Escuela en la que el profesor tiene su Aula: la de la pestaña Escuela si es suya, o la que se creó al pedir el acceso
export function aulaSchoolId(state) {
  if (state.school && state.school.role === 'teacher' && state.school.schoolId) return state.school.schoolId;
  return (state.aula && state.aula.schoolId) || null;
}
