// Idioma de la interfaz. La app está escrita en español; en inglés se traduce lo que se ve en pantalla
// (textos, etiquetas de accesibilidad y marcadores) a partir del diccionario de i18n-en.js, también lo que
// aparece después gracias a un observador del DOM. Al volver al español se recupera el texto original.
import { EXACT, INSTRUMENT_NAMES, PATTERNS, setDeepTranslate } from './i18n-en.js';
import { CONTENT } from './i18n-en-content.js';

export const LANGS = [['es', 'Español'], ['en', 'English']];
const ATTRS = ['aria-label', 'placeholder', 'title'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);
const INSTRUMENT_RE = new RegExp(Object.keys(INSTRUMENT_NAMES).sort((a, b) => b.length - a.length).join('|'), 'gi');
const INSTRUMENT_LOWER = Object.fromEntries(Object.entries(INSTRUMENT_NAMES).map(([es, en]) => [es.toLowerCase(), en]));

let lang = 'es';
let observer = null;
const originalText = new WeakMap(); // nodo de texto → texto en español
const shownText = new WeakMap(); // nodo de texto → lo último que pusimos
const originalAttrs = new WeakMap(); // elemento → { atributo: texto en español }

export const currentLang = () => lang;

const instrumentsIn = text => text.replace(INSTRUMENT_RE, m => INSTRUMENT_LOWER[m.toLowerCase()] || m);

// Traduce una frase (si no la conoce, la deja como está). Respeta los espacios de alrededor.
export function translate(es) {
  const trimmed = String(es).trim();
  if (!trimmed) return es;
  let out = EXACT[trimmed] ?? CONTENT[trimmed] ?? INSTRUMENT_NAMES[trimmed];
  if (out === undefined) {
    for (const [re, fn] of PATTERNS) {
      const m = re.exec(trimmed);
      if (m) { out = instrumentsIn(fn(...m)); break; }
    }
  }
  return out === undefined ? es : String(es).replace(trimmed, out);
}

export const t = es => (lang === 'en' ? translate(es) : es);
setDeepTranslate(text => { const out = translate(text); return out; });

function translateTextNode(node) {
  const parent = node.parentNode;
  if (!parent || SKIP.has(parent.nodeName)) return;
  const current = node.nodeValue;
  if (current !== shownText.get(node)) originalText.set(node, current); // el texto lo cambió la app: es el nuevo original
  const original = originalText.get(node) ?? current;
  const target = lang === 'en' ? translate(original) : original;
  shownText.set(node, target);
  if (current !== target) node.nodeValue = target;
}

function translateAttrs(el) {
  let saved = originalAttrs.get(el);
  ATTRS.forEach(attr => {
    if (!el.hasAttribute(attr)) return;
    const value = el.getAttribute(attr);
    if (!saved) { saved = {}; originalAttrs.set(el, saved); }
    const shown = saved[`_${attr}`];
    if (value !== shown) saved[attr] = value;
    const target = lang === 'en' ? translate(saved[attr]) : saved[attr];
    saved[`_${attr}`] = target;
    if (value !== target) el.setAttribute(attr, target);
  });
}

function walk(root) {
  if (root.nodeType === 3) { translateTextNode(root); return; }
  if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
  translateAttrs(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = it.nextNode(); n; n = it.nextNode()) {
    if (n.nodeType === 3) translateTextNode(n);
    else if (!SKIP.has(n.nodeName)) translateAttrs(n);
  }
}

function translateTitle() {
  const original = document.title.split(' · ').map(part => (lang === 'en' ? translate(part) : part));
  const next = original.join(' · ');
  if (next !== document.title) document.title = next;
}

function observe() {
  if (observer) return;
  observer = new MutationObserver(records => {
    records.forEach(r => {
      if (r.type === 'characterData') translateTextNode(r.target);
      else if (r.type === 'attributes') translateAttrs(r.target);
      else r.addedNodes.forEach(walk);
    });
    translateTitle();
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

// Cambia el idioma de toda la pantalla al momento
export function setLang(next) {
  lang = next === 'en' ? 'en' : 'es';
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  walk(document.body);
  translateTitle();
  if (lang === 'en') observe();
  else if (observer) { observer.disconnect(); observer = null; }
}

// Idioma por defecto para quien empieza: el del navegador
export const defaultLang = () => (typeof navigator !== 'undefined' && /^en\b/i.test(navigator.language || '') ? 'en' : 'es');
