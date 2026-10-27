// Exporta el método Pro de un instrumento al formato JSON de lecciones (para revisarlo o pasárselo a un profesor).
// Uso: node tools/exportar-curso-pro.mjs [instrumento] [eu|us]   → docs/curso-pro/<instrumento>.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { instrumentById } from '../js/instruments.js';
import { buildMethod } from '../js/method.js';

const id = process.argv[2] || 'trumpet';
const nom = process.argv[3] || 'eu';
const inst = instrumentById(id);
// Solo los campos del formato de lección (lo demás es lo que usa la pantalla)
const lessons = buildMethod(inst, nom).map(({ leccion_id, titulo_leccion, pestana_libro, pestana_relax, pestana_practica }) => ({
  leccion_id, titulo_leccion, pestana_libro, pestana_relax: pestana_relax.map(({ id: _, notesAreNames, ...it }) => it), pestana_practica,
}));
mkdirSync(new URL('../docs/curso-pro/', import.meta.url), { recursive: true });
const out = new URL(`../docs/curso-pro/${id}.json`, import.meta.url);
writeFileSync(out, JSON.stringify(lessons, null, 2) + '\n', 'utf8');
console.log(`${lessons.length} lecciones → docs/curso-pro/${id}.json`);
