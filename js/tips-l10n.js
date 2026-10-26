// Textos de los consejos: se escriben en español y en inglés a la vez, L(es, en) devuelve el español y apunta la
// traducción, que i18n.js consulta igual que el diccionario de contenidos. Así ningún consejo se queda sin traducir.
export const TIPS_EN = {};

export function L(es, en) {
  TIPS_EN[es] = en;
  return es;
}
