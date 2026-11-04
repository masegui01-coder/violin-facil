// Cobertura del inglés: cada aviso (toast) y cada mensaje de error de acceso que hay en el código tiene su
// traducción. Se leen las fuentes y se sacan los textos a mano (sin ejecutar las pantallas): así un aviso nuevo
// sin traducir hace fallar esta prueba en lugar de salir en español a quien usa la app en inglés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { translate } from '../js/i18n.js';
import { EXACT } from '../js/i18n-en.js';
import { CONTENT } from '../js/i18n-en-content.js';
import { TIPS_EN } from '../js/tips-l10n.js';
// Los consejos y textos escritos con L(es, en) apuntan su inglés en TIPS_EN al cargarse
const L_MODULES = ['coach', 'course-cello', 'method', 'pro-figures', 'theory-pills', 'tips', 'tips-photos', 'tips-art'];
await Promise.all(L_MODULES.map(name => import(`../js/${name}.js`)));

const ROOT = new URL('../js/', import.meta.url);
const SOURCES = [
  ...readdirSync(ROOT).filter(f => f.endsWith('.js')),
  ...readdirSync(new URL('screens/', ROOT)).filter(f => f.endsWith('.js')).map(f => `screens/${f}`),
];
const read = file => readFileSync(new URL(file, ROOT), 'utf8');
// Un error de la nube de ejemplo: lo que llega detrás de «No se ha podido enviar tu progreso: »
const SAMPLE_ERROR = 'No hay conexión. Inténtalo de nuevo cuando tengas internet.';
const SAMPLE_VALUE = '3';
const QUOTES = { "'": "'", '"': '"', '`': '`' };

// Desde la posición de un paréntesis de apertura, el texto hasta su cierre (respetando cadenas y plantillas)
function argumentAt(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (QUOTES[c]) { i = literalEnd(src, i); continue; }
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return src.slice(open + 1, i);
  }
  return '';
}

// Posición de la comilla que cierra el literal que empieza en «start» (las plantillas pueden anidar ${…})
function literalEnd(src, start) {
  const q = src[start];
  for (let i = start + 1; i < src.length; i++) {
    if (src[i] === '\\') { i++; continue; }
    if (q === '`' && src[i] === '$' && src[i + 1] === '{') {
      let depth = 0;
      for (let j = i + 1; j < src.length; j++) {
        if (QUOTES[src[j]]) { j = literalEnd(src, j); continue; }
        if (src[j] === '{') depth++;
        else if (src[j] === '}' && --depth === 0) { i = j; break; }
      }
      continue;
    }
    if (src[i] === q) return i;
  }
  return src.length;
}

// Texto de una plantilla con un valor de ejemplo en cada ${…}
function templateSample(body) {
  let out = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\') { out += body[++i]; continue; }
    if (body[i] === '$' && body[i + 1] === '{') {
      let depth = 0;
      let j = i + 1;
      for (; j < body.length; j++) {
        if (QUOTES[body[j]]) { j = literalEnd(body, j); continue; }
        if (body[j] === '{') depth++;
        else if (body[j] === '}' && --depth === 0) break;
      }
      const expr = body.slice(i + 2, j);
      out += /ErrorText/.test(expr) ? SAMPLE_ERROR : SAMPLE_VALUE;
      i = j;
      continue;
    }
    out += body[i];
  }
  return out;
}

// Mensajes (con su forma final de ejemplo) que hay dentro de una expresión: se saltan las comparaciones
function messagesIn(expr) {
  const found = [];
  for (let i = 0; i < expr.length; i++) {
    if (!QUOTES[expr[i]]) continue;
    const end = literalEnd(expr, i);
    const raw = expr.slice(i + 1, end);
    const before = expr.slice(0, i).trimEnd();
    const after = expr.slice(end + 1).trimStart();
    i = end;
    if (/[!=]==?$/.test(before) || /^[!=]==?/.test(after)) continue;
    let text = expr[i - raw.length - 1] === '`' ? templateSample(raw) : raw.replace(/\\(.)/g, '$1');
    if (after.startsWith('+')) text += /ErrorText/.test(after) ? SAMPLE_ERROR : SAMPLE_VALUE;
    if (/\p{L}{2}/u.test(text)) found.push(text.trim());
  }
  return found;
}

// Todos los avisos: toast('…'), y los textos que la pantalla del director pasa a addSub(…, 'aviso')
function toastMessages() {
  const out = new Map();
  SOURCES.forEach(file => {
    const src = read(file);
    for (const m of src.matchAll(/\btoast\(/g)) {
      const arg = argumentAt(src, m.index + 'toast'.length);
      if (/^\s*(msg|link|url|err\.message)\s*$/.test(arg)) continue; // variables: se comprueban en su origen
      messagesIn(arg).forEach(text => out.set(text, file));
    }
    for (const m of src.matchAll(/addSub\(ctx, [^\n]*?, reload, ('[^']+')\)/g)) out.set(m[1].slice(1, -1), file);
  });
  return out;
}

// Literales que devuelve una función (de su cuerpo hasta la siguiente función de primer nivel)
function returnedTexts(file, name) {
  const src = read(file);
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${file}: ${name}`);
  const end = src.indexOf('\nexport ', start + 1);
  return messagesIn(src.slice(start, end < 0 ? undefined : end)).filter(x => !/^auth\/|^[\w-]+$/.test(x));
}

// Errores de acceso: los de Firebase, los del formulario y los de la pantalla de acceso
function authMessages() {
  return [
    ...returnedTexts('account.js', 'accountErrorText'),
    ...returnedTexts('account-form.js', 'validateAccountForm'),
    ...returnedTexts('cloud.js', 'cloudErrorText'),
    ...returnedTexts('audio.js', 'micErrorText'),
  ];
}

// Mensajes de error que acaban en un aviso (toast(err.message) o cloudErrorText)
function errorMessages() {
  const out = [];
  SOURCES.filter(f => /-api\.js$|^cloud\.js$|^audio\.js$|^musicxml\.js$|^screens\//.test(f)).forEach(file => {
    const src = read(file);
    for (const m of src.matchAll(/new Error\(/g)) {
      messagesIn(argumentAt(src, m.index + 'new Error'.length)).filter(x => x.includes(' ')).forEach(x => out.push(x));
    }
  });
  return out;
}

const untranslated = texts => texts.filter(es => translate(es) === es);

test('se encuentran los avisos del código (la extracción funciona)', () => {
  const toasts = toastMessages();
  assert.ok(toasts.size > 100, `solo ${toasts.size} avisos`);
  ['Tarea creada', 'Invitación copiada', 'Te he enviado un correo para cambiar la contraseña', 'Aviso publicado'].forEach(x => assert.ok(toasts.has(x), x));
  assert.ok(authMessages().includes('Correo o contraseña incorrectos.'));
});

test('cada aviso (toast) tiene su traducción al inglés', () => {
  const missing = untranslated([...toastMessages().keys()]);
  assert.deepEqual(missing, []);
});

test('cada error de acceso y de conexión tiene su traducción al inglés', () => {
  assert.deepEqual(untranslated(authMessages()), []);
  assert.deepEqual(untranslated(errorMessages()), []);
});

test('los avisos compuestos con un error o un nombre se traducen enteros', () => {
  assert.equal(translate(`No se ha podido enviar tu progreso: ${SAMPLE_ERROR}`), "Couldn't send your progress: No connection. Try again when you're online.");
  assert.equal(translate('Te has unido a Banda Sinfónica'), 'You joined Banda Sinfónica');
  assert.equal(translate('Repaso: +20 puntos'), 'Review: +20 points');
});

test('las traducciones al inglés no usan las comillas españolas «»', () => {
  assert.ok(Object.keys(TIPS_EN).length > 1000, 'se han cargado los textos escritos con L(es, en)');
  [EXACT, CONTENT, TIPS_EN].forEach(dict => {
    const bad = Object.values(dict).filter(en => /«[^«»]*»/.test(en));
    assert.deepEqual(bad, []);
  });
  assert.equal(translate('No has elegido estilos todavía. Elígelos en tu perfil o mira «Todas».'), "You haven't chosen styles yet. Pick them in your profile or see “All”.");
});

// Palabras que delatan que una pista de la lección sigue en español
const SPANISH_HINT = /[ñáéíóú]|(?<!\p{L})(cuerda|dedo|traste|aire|tiempos?|medio|pistón|pistones|cilindros?|vara|llave|pulgar|agujeros?|izq|der|tecla|negra|blanca|corchea|redonda|puntillo|tresillo)(?!\p{L})/iu;

test('las pistas de la lección (digitación, figura y duración) se traducen para todos los instrumentos', async () => {
  const { INSTRUMENTS } = await import('../js/instruments.js');
  const { fingeringText } = await import('../js/fingerings.js');
  const { noteValueName } = await import('../js/harmony.js');
  const hints = new Set();
  INSTRUMENTS.forEach(inst => ['us', 'eu'].forEach(nom => {
    for (let midi = 24; midi <= 100; midi++) hints.add(fingeringText(inst.id, midi, nom));
  }));
  [6, 4, 3.5, 3, 2, 1.75, 1.5, 1, 0.875, 0.75, 0.5, 0.375, 0.25, 0.125].forEach(beats => hints.add(noteValueName(beats)));
  ['w', 'h', 'q', 'e', 's', 't'].forEach(dur => [3, 5, 6, 7, 9].forEach(tuplet => hints.add(noteValueName(1, { dur, tuplet }))));
  const left = [...hints].filter(es => SPANISH_HINT.test(translate(es)));
  assert.deepEqual(left, []);
  assert.equal(translate('Negra · 1 tiempo'), 'Quarter note · 1 beat');
  assert.equal(translate('Cuerda A · al aire'), 'Open A string');
  assert.equal(translate('Cuerda La · dedo 2 alto'), 'A string · finger 2 (high)');
});

test('Ajustes: el aviso de borrar la cuenta tiene su inglés', () => {
  assert.equal(translate('Idioma, apariencia, privacidad y tu cuenta'), 'Language, appearance, privacy and your account');
  assert.equal(translate('¿Borrar tu cuenta?'), 'Delete your account?');
  assert.equal(translate('Se borrarán para siempre tu usuario, tu progreso guardado en la nube y lo que hayas compartido. No se puede deshacer.'),
    'Your user, your progress saved in the cloud and anything you have shared will be deleted forever. This cannot be undone.');
});

// Textos que una revisión en inglés encontró en español fuera de las pantallas principales (hojas, diálogos, Estudio)
test('hojas y herramientas: la hoja de la canción, afinar en acorde, la rutina y el radar se traducen', () => {
  const cases = {
    'Inicial': 'Beginner', '32 notas': '32 notes', '3 tarjetas': '3 cards', 'De memoria': 'From memory', 'Clasificación': 'Leaderboard',
    'Retar a un amigo': 'Challenge a friend', 'La partitura espera a que cada nota suene bien.': 'The score waits until each note sounds right.',
    'Tónica': 'Root', '3.ª mayor': 'Major 3rd', '3.ª menor': 'Minor 3rd', '5.ª': '5th', '6.ª mayor': 'Major 6th', 'Fa': 'F',
    'Objetivo: -14 cents respecto al afinador': 'Target: -14 cents from the tuner',
    'Paso 1 de 3: Notas tenidas: Si♭4': 'Step 1 of 3: Long tones: B♭4', 'Constancia 0': 'Consistency 0',
    'Sin intentar': 'Not tried yet', 'Todavía no has importado ninguna partitura.': "You haven't imported any scores yet.",
    'Test de nivel · Violín': 'Level test · Violin',
  };
  Object.entries(cases).forEach(([es, en]) => assert.equal(translate(es), en, es));
  assert.match(translate('Tocarás 7 fragmentos, cada uno de una unidad más avanzada. Cuando uno no te salga (menos de 2 estrellas) paramos y te colocamos en esa unidad.'), /^You will play 7 excerpts/);
  assert.match(translate('Guardamos tu nombre, tu correo y tu progreso para que no lo pierdas al cambiar de móvil y para mejorar la beta. Puedes borrar tu cuenta cuando quieras desde Ajustes.'), /from Settings\.$/);
});

test('en inglés el director es «conductor» y la clasificación, «leaderboard»', () => {
  [EXACT, CONTENT, TIPS_EN].forEach(dict => {
    assert.deepEqual(Object.values(dict).filter(en => /\bdirector\b|\branking/i.test(en) && !/directory/i.test(en)), []);
  });
});
