// Reglas de creatividad del Nivel 4 (sin DOM, se prueban aparte): tresillos, síncopas con su detector métrico, reparto de
// las corcheas en grupos (5/8, 7/8), cambios de compás, acordes por compás, cadencias y modulación. Cada una devuelve
// un booleano o un número y acepta cualquier solución correcta (no una respuesta única).
import { FIGURE_BEATS, barBeatsOf, isCompound, isAmalgam, groupingOf, isTriplet, tokenMidi } from './notes.js';
import { beatWeight } from './prosody.js';
import { cadenciaDe, chordOfNumeral, numeralProblem, noteOfDegree } from './harmony.js';
import { snapBeat } from '../music.js';

const EPS = 1e-6;
const beatsOf = t => t.beats ?? FIGURE_BEATS[t.dur] ?? 0;

// Las fichas con su instante de comienzo y su compás (si no lo traen). plan: { sizes, meters } de un compás cambiante
export function withTimes(tokens, meter = '4/4', plan = null) {
  let at = 0;
  const sizeAt = b => (plan ? plan.sizes[Math.min(b, plan.sizes.length - 1)] : barBeatsOf(meter));
  const out = tokens.map(t => { const n = { ...t, start: t.start ?? at, beats: beatsOf(t) }; at = snapBeat(n.start + n.beats); return n; });
  const edges = [0];
  for (let b = 0; b < 200 && edges[b] < at; b++) edges.push(edges[b] + sizeAt(b));
  return out.map(t => { let b = 0; while (b < edges.length - 2 && t.start >= edges[b + 1] - EPS) b++; return { ...t, bar: t.bar ?? b, barStart: edges[b], barSize: sizeAt(b), meter: plan ? plan.meters[Math.min(b, plan.meters.length - 1)] : meter }; });
}

// Pulsos ocupados por tresillos (cada tresillo de corcheas con su silencio cuenta 1; el de negras, 2)
export function tripletBeats(tokens) {
  return Math.round(tokens.filter(t => isTriplet(t.dur)).reduce((s, t) => s + beatsOf(t), 0) * 1000) / 1000;
}

// Síncopas: una nota (con sus ligaduras unidas) que empieza en una parte más débil y se sostiene sobre otra más fuerte
// (pesos 3, 2, 1, 0 de beatWeight). El contratiempo (silencio en el pulso) y el puntillo (empieza en el pulso) no lo son.
// Devuelve [{ index, start, crossesBar }]
export function syncopations(tokens, meter = '4/4', plan = null) {
  const ts = withTimes(tokens, meter, plan);
  // las ligaduras de prolongación se unen: la nota ligada es una sola
  const merged = [];
  ts.forEach((t, i) => {
    const prev = merged[merged.length - 1];
    if (prev && prev.tie && !prev.rest && !t.rest && tokenMidi(prev) === tokenMidi(t)) { prev.beats += t.beats; prev.tie = !!t.tie; return; }
    merged.push({ ...t, index: i });
  });
  const out = [];
  merged.forEach(t => {
    if (t.rest) return;
    const m = t.meter || meter;
    const comp = isCompound(m);
    const w = pos => beatWeight(pos - t.barStart, t.barSize, comp, isAmalgam(m) ? groupingOf(m, {}, t.bar) : null);
    const w0 = w(t.start);
    // posiciones de la cuadrícula de semicorchea entre el comienzo y el final de la nota
    let sync = false;
    for (let p = Math.floor(t.start * 4 + EPS) / 4 + 0.25; p < t.start + t.beats - EPS && !sync; p += 0.25) if (p > t.start + EPS && w(p) > w0) sync = true;
    if (sync) out.push({ index: t.index, start: t.start, crossesBar: t.start + t.beats > t.barStart + t.barSize + EPS });
  });
  return out;
}

// Reparto en grupos: en el inicio de cada grupo de cada compás hay un ataque o un silencio. groupP: { agrupacion, agrupaciones }
export function groupsOk(tokens, meter, groupP = {}, plan = null) {
  const ts = withTimes(tokens, meter, plan);
  const bars = [...new Set(ts.map(t => t.bar))];
  return bars.every(b => {
    const inBar = ts.filter(t => t.bar === b);
    const m = inBar[0].meter || meter;
    let at = 0;
    return groupingOf(m, groupP, b).every(g => {
      const rel = at * 0.5;
      at += g;
      return inBar.some(t => Math.abs(t.start - t.barStart - rel) < EPS);
    });
  });
}

// Cambios de compás escritos: los compases distintos del anterior
export const meterChanges = plan => (plan ? plan.meters.slice(1).filter((m, i) => m !== plan.meters[i]).length : 0);

// Acordes por compás (números romanos): las notas de cada compás, su primera nota o ninguna regla de notas. key: la
// tonalidad. Devuelve { permitidos, fijos, notas, primer } como booleanos
export function chordRules(tokens, chords, spec, key, meter = '4/4', plan = null) {
  const ts = withTimes(tokens, meter, plan).filter(t => !t.rest);
  const pcsOf = numeral => { try { return new Set(chordOfNumeral(key, numeral).notes.map(n => ((tokenMidi({ name: n }) % 12) + 12) % 12)); } catch (e) { return new Set(); } };
  const barsCount = Math.max(1, ...withTimes(tokens, meter, plan).map(t => t.bar + 1));
  const list = Array.from({ length: barsCount }, (_, b) => chords[b]);
  const out = { permitidos: true, fijos: true, notas: true, primer: true };
  const valid = n => n && !numeralProblem(key, n) && (!spec.permitidos || spec.permitidos.some(p => p.toLowerCase() === n.toLowerCase()));
  if (spec.permitidos) out.permitidos = list.every(valid);
  if (spec.fijos) out.fijos = list.length === spec.fijos.length && list.every((c, b) => c === spec.fijos[b]);
  if (spec.soloNotasDelAcorde) out.notas = list.every((c, b) => !!c && ts.filter(t => t.bar === b).every(t => pcsOf(c).has(((tokenMidi(t) % 12) + 12) % 12)));
  if (spec.primerTiempo) out.primer = list.every((c, b) => { const first = ts.find(t => t.bar === b); return !!c && !!first && pcsOf(c).has(((tokenMidi(first) % 12) + 12) % 12); });
  return out;
}
// Cadencia que hacen los acordes elegidos al final de un compás (desde 1)
export const cadenceAt = (chords, bar) => (chords.slice(0, bar).every(Boolean) ? cadenciaDe(chords.slice(0, bar)) : null);

// Modulación: la nota nueva aparece (en cualquier octava) y la frase acaba en la tónica de llegada
export function modulationOk(tokens, { hasta, notaNueva }) {
  const sounding = tokens.filter(t => !t.rest);
  if (!sounding.length) return false;
  const pcOf = name => { const m = /^([A-G])([#b]?)/.exec(name); return ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12; };
  const appears = sounding.some(t => ((tokenMidi(t) % 12) + 12) % 12 === pcOf(notaNueva));
  const tonic = noteOfDegree(hasta, 1);
  const last = sounding[sounding.length - 1];
  return appears && ((tokenMidi(last) % 12) + 12) % 12 === pcOf(tonic);
}
