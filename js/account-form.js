// Formulario de acceso sin DOM: qué campo está mal (para marcarlo y llevar el foco) y textos del aviso.
const MIN_PASS = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Primer fallo del formulario, en el orden en que se ven los campos: { field, message } o null
export function validateAccountForm({ signup, name = '', email = '', pass = '' }) {
  if (signup && !name.trim()) return { field: 'Name', message: 'Escribe tu nombre.' };
  if (!email.trim()) return { field: 'Email', message: 'Escribe tu correo.' };
  if (!EMAIL_RE.test(email.trim())) return { field: 'Email', message: 'Ese correo no parece válido.' };
  if (!pass) return { field: 'Pass', message: 'Escribe una contraseña.' };
  if (signup && pass.length < MIN_PASS) return { field: 'Pass', message: 'La contraseña necesita al menos 6 caracteres.' };
  return null;
}

// Campos a marcar según el error de Firebase (los demás errores no son de un campo concreto)
const FIELDS_BY_CODE = {
  'auth/invalid-email': ['Email'], 'auth/user-not-found': ['Email'], 'auth/email-already-in-use': ['Email'],
  'auth/missing-password': ['Pass'], 'auth/weak-password': ['Pass'], 'auth/wrong-password': ['Pass'],
  'auth/invalid-credential': ['Email', 'Pass'],
};
export const fieldsForError = err => FIELDS_BY_CODE[(err && err.code) || ''] || [];

// Texto del aviso «Crea tu usuario»: con 0 puntos no se presume de lo que aún no hay
export function reminderText(xp) {
  return xp > 0
    ? `Tus ${xp} puntos, tu racha y tus lecciones se guardarán en tu cuenta. Así no se pierden si cambias de móvil o borras el navegador.`
    : 'Todo lo que toques desde hoy (puntos, racha y lecciones) se guardará en tu cuenta. Así no se pierde si cambias de móvil o borras el navegador.';
}

// El aviso automático sale como mucho una vez al día
export const reminderDue = (lastDay, day) => lastDay !== day;
