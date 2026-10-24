// Lector XML mínimo (sin dependencias) para MusicXML. Funciona igual en el navegador y en Node.

const ENTITIES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
}

function parseAttrs(src) {
  const attrs = {};
  src.replace(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g, (m, k, v, a, b) => { attrs[k] = decode(a ?? b); return ''; });
  return attrs;
}

// Devuelve el elemento raíz como { name, attrs, children, text }
export function parseXml(src) {
  const root = { name: '#document', attrs: {}, children: [], text: '' };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>|<!\[CDATA\[([\s\S]*?)\]\]>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const top = stack[stack.length - 1];
    if (m[2] !== undefined) top.text += m[2];
    else if (m[3]) {
      if (top.name !== m[3]) throw new Error(`XML mal formado: se esperaba </${top.name}> y llegó </${m[3]}>`);
      stack.pop();
    } else if (m[4]) {
      const node = { name: m[4], attrs: parseAttrs(m[5] || ''), children: [], text: '' };
      top.children.push(node);
      if (!m[6]) stack.push(node);
    } else if (m[7]) top.text += decode(m[7]);
  }
  if (stack.length !== 1) throw new Error('XML mal formado: hay etiquetas sin cerrar');
  const el = root.children[0];
  if (!el) throw new Error('El archivo no contiene XML');
  return el;
}

export const child = (node, name) => (node ? node.children.find(c => c.name === name) || null : null);
export const childrenOf = (node, name) => (node ? node.children.filter(c => c.name === name) : []);
export const textOf = (node, name) => { const c = child(node, name); return c ? c.text.trim() : ''; };

// Busca en profundidad el primer elemento con ese nombre
export function find(node, name) {
  if (!node) return null;
  for (const c of node.children) {
    if (c.name === name) return c;
    const deep = find(c, name);
    if (deep) return deep;
  }
  return null;
}
