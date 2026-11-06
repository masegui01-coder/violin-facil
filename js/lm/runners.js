// Ejercicios nuevos del curso, tipo a tipo: cada uno compone las piezas de tasks-*.js con los parámetros del catálogo
// y devuelve { pct, marks?, labels?, mistakes, skills?, note? } para el resultado (screen.js lo registra y lo enseña).
import { esc } from '../ui.js';
import { QUIZ_KINDS, playQuestion } from './tasks-quiz.js';
import { tocarPentagrama, barras, dictadoEscrito } from './tasks-staff.js';
import { singTask, lyricsUnder, singResult, SONG_WORDS, SONG_WORDS2 } from './tasks-voice.js';
import { singSong } from './tasks-song.js';
import { stopGame, tapRhythm } from './tasks-rhythm.js';
import { agilityTask } from './tasks-agility.js';
import { lecturaDosVoces } from './tasks-duo.js';
import { meterQuestions, semitoneQuestions, modeQuestions, songQuestions, genRhythm, genMelody, gainsFor } from './gen.js';
import { pctOf, mistakeCodes } from './grade.js';
import { creatividad } from './creative.js';
import { scoreTokens, barBeatsOf, noteText, solfaToName } from './notes.js';
import { lmExercise, lmQuestion, lmSong, lmUnit } from './catalog.js';
import { staffHtml, continueButton, playButton, shuffle, CLEF, tokenLabel, withBreaths } from './kit.js';
import { playEvents, stopSound } from './sound.js';
import { figureHtml, bindFigures, CARD_FIGURE } from './figures/index.js';
import { fitSystems } from './systems.js';
import { currentLang } from '../i18n.js';

const STAFF_KINDS = { tocarPentagrama, escala: tocarPentagrama, barras };
const runItem = (host, item, env) => (STAFF_KINDS[item.tipo] || QUIZ_KINDS[item.tipo] || QUIZ_KINDS.elegir)(host, item, env);

// Serie de preguntas con su progreso; devuelve marcas y errores
async function runItems(host, items, env, title = 'Pregunta') {
  const marks = [];
  const mistakes = [];
  for (let i = 0; i < items.length; i++) {
    if (!env.alive()) return null;
    stopSound(); // lo que sonaba en la pregunta anterior (una canción entera, por ejemplo) no sigue en esta
    host.innerHTML = `<p class="eyebrow lm-count">${esc(title)} ${i + 1} de ${items.length}</p><div class="lm-item"></div>`;
    const r = await runItem(host.querySelector('.lm-item'), items[i], env);
    if (!r || !env.alive()) return null;
    marks.push(r.mark);
    mistakes.push(r.mistake);
    await continueButton(host, i + 1 < items.length ? 'Siguiente' : 'Ver el resultado');
  }
  stopSound();
  return { marks, mistakes: mistakeCodes(mistakes), labels: items.map((it, i) => `${title} ${i + 1}`) };
}

// ---------- Teoría: ficha (tarjetas) y práctica interactiva ----------
// Ilustración de la tarjeta (su campo «dibujo» o, si falta, la de su posición en la unidad); fija con «reducir movimiento»
// Letra grande (125 % o más): la explicación del dibujo también va escrita, porque el texto del SVG no crece
const BIG_TEXT_PX = 20;
const bigText = () => parseFloat(getComputedStyle(document.documentElement).fontSize) >= BIG_TEXT_PX;
const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function cardFigure(card, i, env, still) {
  const dibujo = card.dibujo || CARD_FIGURE[`lm${env.level}-u${env.unit}-${i + 1}`];
  return figureHtml(dibujo, { lang: currentLang(), nom: env.nom, still: still || reduceMotion(), big: bigText() });
}
const playFigure = env => (score, { dyn, sound }) => playQuestion({ partitura: score, dyn, sound }, env);
// El ejemplo de la tarjeta con su compás (el suyo o el primero de la unidad), sus barras y, si la hay, su anacrusa
function cardExample(card, env, text = card.ejemplo) {
  const ex = withBreaths(scoreTokens(text), card.comas || [], card.anacrusa || 0);
  const meter = card.compas || (lmUnit(env.level, env.unit)?.meters || [])[0] || '4/4';
  return staffHtml(ex, { meter, pickup: card.anacrusa || 0, label: ex.map(t => tokenLabel(t, env.nom)).join(', ') });
}
function cardHtml(card, i, env) {
  const example = card.ejemplo ? `<div class="lm-card-ex">${cardExample(card, env)}${playButton('lmCardPlay', 'Escuchar el ejemplo')}</div>` : '';
  // ejemploCompleto: la escala o la idea entera, solo para mirarla (puede pasar de las notas que ya se leen)
  const whole = card.ejemploCompleto ? `<div class="lm-card-ex lm-card-ex2"><p class="dict-staff-label">Entera, solo para mirarla</p>${cardExample(card, env, card.ejemploCompleto)}${playButton('lmCardPlay2', 'Escuchar entera')}</div>` : '';
  return `<h2 class="lm-q" tabindex="-1">${esc(card.titulo)}</h2><div class="lm-card-art">${cardFigure(card, i, env, false)}</div><div class="lm-card-text"><p>${esc(card.texto)}</p>${example}${whole}</div>`;
}
async function showCards(host, cards, env, summary) {
  const unitColor = `--unit:var(--u${((env.unit - 1) % 8) + 1})`;
  if (summary) {
    host.innerHTML = `<p class="eyebrow">Resumen de la teoría</p>${cards.map((c, i) => `<div class="lm-card-sum" style="${unitColor}"><h2>${esc(c.titulo)}</h2>${cardFigure(c, i, env, true)}<p>${esc(c.texto)}</p></div>`).join('')}`;
    bindFigures(host, playFigure(env));
    host.querySelector('h2').setAttribute('tabindex', '-1');
    host.querySelector('h2').focus();
    await continueButton(host, 'A practicar');
    return;
  }
  for (let i = 0; i < cards.length; i++) {
    if (!env.alive()) return;
    host.innerHTML = `<p class="eyebrow">Ficha ${i + 1} de ${cards.length}</p><div class="lm-card" style="${unitColor}">${cardHtml(cards[i], i, env)}</div>`;
    fitSystems(host); // la clave de cada renglón del ejemplo, ya al pintar (sin esperar al siguiente fotograma)
    bindFigures(host, playFigure(env));
    host.querySelector('.lm-q').focus();
    const play = host.querySelector('#lmCardPlay');
    if (play) play.addEventListener('click', () => playQuestion({ partitura: cards[i].ejemplo }, env));
    host.querySelector('#lmCardPlay2')?.addEventListener('click', () => playQuestion({ partitura: cards[i].ejemploCompleto }, env));
    await continueButton(host, i + 1 < cards.length ? 'Siguiente' : 'A practicar');
  }
}
async function teoria(host, ex, env) {
  const p = ex.params;
  await showCards(host, p.ficha || [], env, /resumen/.test(p.herramienta?.params?.cards || ''));
  const r = await runItems(host, p.items || [], env);
  return r && { ...r, pct: pctOf(r.marks) };
}

// ---------- Ritmo: STOP ----------
async function stop(host, ex, env) {
  const base = ex.params.base;
  if (!base) return { pct: 0, mistakes: [] };
  return stopGame(host, { ...ex.params, base: { ...base, tokens: scoreTokens(base.partitura) } }, env);
}

// ---------- Agilidad ----------
const agilidad = (host, ex, env) => agilityTask(host, ex.params, env);

// ---------- Entonación y canción cantada ----------
async function entonacion(host, ex, env) {
  const p = ex.params;
  const tokens = withBreaths(scoreTokens(p.partitura), p.comas || [], p.anacrusa || 0);
  // lectura melódica: hay que leer las notas en el pentagrama (sin el nombre escrito debajo ni dicho por la app)
  // lectura en Fácil: con apoyo (la primera nota y un botón para oír la nota que toca), nunca en eco
  const reading = ex.skills.includes('lectura');
  // ordenamiento con notas que la unidad aún no lee: de oído, con sus nombres y sin pentagrama
  const taught = (env.unitNotes || []);
  const noStaff = !reading && taught.length > 0 && tokens.some(t => !t.rest && !taught.includes(t.name));
  const take = await singTask(host, {
    tokens, key: p.tonalidad, echo: !reading && ex.variant === 'facil', variant: ex.variant, meter: p.compas, bpm: p.tempo || 72, clef: CLEF[p.clave] || 'treble',
    intro: reading ? (ex.variant === 'facil' ? SUPPORT.lectura : SUPPORT.solo) : ex.variant === 'facil' ? SUPPORT.eco : SUPPORT.solo,
    hideNames: reading, help: reading && ex.variant === 'facil', noStaff, dynamics: Array.isArray(p.matices) ? p.matices : null,
  }, env);
  return take && { ...singResult(take), labels: take.names.map(n => noteText(n, env.nom)), range: take.range };
}
// Lo que la app hace en cada variante (los apoyos de verdad)
const SUPPORT = {
  eco: 'Con apoyo: la app canta cada compás y tú lo repites (eco).',
  lectura: 'Lectura con apoyo: la app da la tonalidad y la primera nota; si dudas, puedes oír la nota que toca (cuenta como «casi»).',
  solo: 'Sin apoyo: la app da el acorde de la tonalidad y la primera nota; después cantas tú solo.',
};
async function cancionCantada(host, ex, env) {
  const song = ex.params.cancion;
  const tokens = withBreaths(scoreTokens(song.partitura), song.comas || [], song.anacrusa || 0);
  const names = /nombre de notas/.test(ex.params.modo || '');
  // a tempo: afinación (entonación) y ataques (ritmo) de cada nota, cada una con su porcentaje
  const take = await singSong(host, {
    tokens, key: song.tonalidad, echo: ex.variant === 'facil', variant: ex.variant, meter: song.compas, bpm: song.tempo || 72,
    // «con nombre de notas»: los nombres se leen en el pentagrama, no se escriben debajo (ni los dice la app)
    under: names ? [] : lyricsUnder(tokens, song.letra, env.nom, false, SONG_WORDS[song.titulo] || ''), hideNames: names, intro: ex.params.consigna || '', habanera: /habanera/i.test(song.estilo || ''),
    // 2.ª estrofa: debajo de la 1.ª y cantada en la segunda vuelta (barra de repetición), siempre con su letra
    under2: song.letra2 ? lyricsUnder(tokens, song.letra2, env.nom, false, SONG_WORDS2[song.titulo] || '') : null,
    dynamics: Array.isArray(song.matices) ? song.matices : null,
  }, env);
  return take && { ...take, labels: take.names.map(n => noteText(n, env.nom)) };
}

// ---------- Dictado escrito ----------
async function escribir(host, ex, env) {
  const r = await dictadoEscrito(host, ex.params, env);
  return r && { pct: r.pct, marks: r.marks, mistakes: r.mistakes };
}

// ---------- Discriminación auditiva ----------
async function discriminacion(host, ex, env) {
  const p = ex.params;
  if (p.compases && p.cancion) {
    const bars = p.cancion.partitura.split('|').map(x => x.trim()).filter(Boolean).slice(p.compases[0] - 1, p.compases[1]);
    const rhythmOnly = /ritmo de los compases/.test(p.descripcion || '') && !/notas/.test(p.descripcion || '');
    return escribir(host, { ...ex, params: { partitura: `| ${bars.join(' | ')} |`, compas: p.cancion.compas, tempo: p.cancion.tempo, escuchas: 3, tipo: rhythmOnly ? 'ritmico' : 'melodico' } }, env);
  }
  const count = p.cantidad || 8;
  const t = `${ex.title} ${p.descripcion || ''}`;
  let items;
  if (/ternario|binario/i.test(t)) items = meterQuestions(count, env.seed);
  else if (/semitono/i.test(t)) items = semitoneQuestions(count, env.seed);
  else if (/mayor o menor/i.test(t)) items = modeQuestions(count, env.seed);
  else {
    const songs = (p.canciones || [1, 2, 3, 4, 5, 6, 7, 8]).map(n => lmUnit(ex.level, n)?.song).filter(Boolean);
    items = songQuestions(songs, Math.min(count, songs.length), env.seed);
  }
  const r = await runItems(host, items, env);
  return r && { ...r, pct: pctOf(r.marks) };
}

// ---------- Audición: ficha, fragmento sintetizado y preguntas ----------
// El fragmento con todo lo que pide la ficha: matices y reguladores por compás (también a lo largo de las
// repeticiones), accelerando de una repetición a otra (tempo → tempoFinal) y el golpe por sorpresa
const STRIKE_GAIN = 1.4;
export function workEvents(frag) {
  const rep = frag.repetir || 1;
  const barBeats = barBeatsOf(frag.compas);
  const bpm0 = frag.tempo || 80;
  const bpm1 = frag.tempoFinal || bpm0;
  const bpmOf = k => (rep > 1 ? bpm0 + (bpm1 - bpm0) * k / (rep - 1) : bpm0);
  const voices = frag.voces.map(v => scoreTokens(v.partitura));
  const repBeats = Math.max(...voices.map(v => v.reduce((sum, t) => sum + t.beats, 0)));
  const repBars = Math.max(...voices.map(v => (v.length ? v[v.length - 1].bar : 0) + 1));
  const repStart = k => Array.from({ length: k }, (_, j) => repBeats * 60 / bpmOf(j)).reduce((x, y) => x + y, 0);
  const events = [];
  voices.forEach(one => {
    const all = Array.from({ length: rep }, (_, k) => one.map(t => ({ ...t, bar: k * repBars + t.bar, rep: k }))).flat();
    const gains = gainsFor(all, frag.matices || []);
    all.forEach((t, j) => {
      if (t.rest) return;
      const spb = 60 / bpmOf(t.rep);
      events.push({ midi: t.midi, at: repStart(t.rep) + t.start * spb, dur: t.beats * spb * 0.92, gain: gains[j] });
    });
  });
  if (frag.golpe) {
    const at = ((frag.golpe.compas - 1) * barBeats + (frag.golpe.pulso - 1)) * 60 / bpm0;
    frag.golpe.notas.forEach(n => events.push({ midi: scoreTokens('| ' + n + 'q |')[0].midi, at, dur: 60 / bpm0, gain: STRIKE_GAIN }));
  }
  return events;
}
function workHtml(a, id) {
  const frag = a.fragmento;
  return `<article class="lm-work">
    <p class="eyebrow"><span>${esc(a.epoca || '')}</span>${a.pais ? ` · <span>${esc(a.pais)}</span>` : ''}</p>
    <h2 class="lm-q" tabindex="-1">${esc(a.compositor)}</h2><p class="muted small"><span>${esc(a.vida || '')}</span>${a.genero ? ` · <span>${esc(a.genero)}</span>` : ''}</p>
    <p class="lm-work-title"><b>${esc(a.obra)}</b></p>
    <ul class="lm-facts">${(a.ficha || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${frag ? `<div class="lm-listen"><p class="muted small">${frag.voces.map(v => `<span>${esc(v.nombre)}</span>`).join(' · ')}</p>
      ${playButton(id, 'Escuchar el fragmento')}<button type="button" class="btn ghost small" data-stop-audio>Parar</button>
      ${frag.nota ? `<p class="muted small">${esc(frag.nota)}</p>` : ''}</div>` : ''}
  </article>`;
}
function bindWork(host, a, id) {
  const frag = a.fragmento;
  if (!frag) return;
  host.querySelector(`#${id}`).addEventListener('click', () => {
    stopSound();
    playEvents(workEvents(frag));
  });
  host.querySelector('[data-stop-audio]').addEventListener('click', stopSound);
}
async function audicion(host, ex, env) {
  const a = ex.params.audicion;
  host.innerHTML = `${workHtml(a, 'lmWorkPlay')}${a.extra ? `<details class="lm-extra"><summary><span>También:</span> <span>${esc(a.extra.compositor)}</span></summary>${workHtml(a.extra, 'lmWorkPlay2')}</details>` : ''}`;
  bindWork(host, a, 'lmWorkPlay');
  if (a.extra) bindWork(host, a.extra, 'lmWorkPlay2');
  host.querySelector('.lm-q').focus();
  await continueButton(host, 'A las preguntas');
  stopSound();
  const r = await runItems(host, ex.params.preguntas || [], env);
  return r && { ...r, pct: pctOf(r.marks) };
}

// ---------- Repaso por competencias ----------
const normFig = f => (f === 'ee' ? 'e' : f === 'rq' ? 'Rq' : f);
// Tonalidad de la unidad y su tónica entre las notas que se usan (do; la en la menor; si no hay, sol)
const unitKeyOf = ex => (lmUnit(ex.level, ex.unit) || {}).key || 'Do M';
function tonicOf(ex, notas) {
  const minor = /^La m/.test(unitKeyOf(ex));
  return [minor ? 'A4' : 'C4', minor ? 'A3' : 'C5', 'G4'].find(n => notas.includes(n)) || notas[0];
}

// Figuras de una nota por pulso o más largas (las melodías generadas no parten pulsos); si la unidad aún no tiene
// la blanca, solo negras
function longFigures(figs = []) {
  const ok = (figs || []).map(normFig).filter(f => ['q', 'h', 'w'].includes(f));
  return ok.length ? ok : ['q'];
}
// Notas con figura y compás → partitura en texto con barras
function scoreText(tokens, barBeats) {
  const bars = [];
  let cur = [];
  let sum = 0;
  tokens.forEach(t => {
    cur.push((t.rest ? 'R' : t.name || 'C5') + t.dur);
    sum += t.beats;
    if (Math.abs(sum % barBeats) < 1e-6) { bars.push(cur.join(' ')); cur = []; }
  });
  if (cur.length) bars.push(cur.join(' '));
  return `| ${bars.join(' | ')} |`;
}
const COMP_HINT = {
  ritmo: 'Toca el ritmo en la pantalla, a tempo.', entonacion: 'Canta: la app te escucha.', lectura: 'Nombra las notas a tiempo.',
  dictado: 'Escucha y escribe la melodía.', teoria: 'Preguntas de teoría.', audicion: '¿Qué canción es? Y una pregunta de la audición.',
};
const COMP_TITLE = { ritmo: 'Ritmo', entonacion: 'Entonación', lectura: 'Lectura', dictado: 'Dictado', teoria: 'Teoría', audicion: 'Audición' };
async function repasoPart(host, part, ex, env) {
  const pp = part.params || {};
  const seed = pp.seed || env.seed;
  const sub = { ...env, seed };
  switch (part.competencia) {
    case 'ritmo': {
      const meter = (pp.compas || ['4/4'])[0];
      const tokens = genRhythm({ figuras: (pp.figuras || ['q']).map(normFig), barBeats: barBeatsOf(meter), bars: Math.min(pp.compases || 4, 4), seed });
      return tapRhythm(host, { tokens, meter, bpm: pp.tempo || 72 }, sub);
    }
    case 'entonacion': {
      // el ordenamiento entero y, después, una lectura cantada nueva con las notas y figuras de la unidad
      const order = lmExercise(pp.ordenamiento);
      const lect = pp.lectura || {};
      const takes = [];
      if (order) {
        const otoks = scoreTokens(order.params.partitura);
        const noStaff = otoks.some(t => !t.rest && !(env.unitNotes || []).includes(t.name));
        const t1 = await singTask(host, { tokens: otoks, key: unitKeyOf(ex), echo: ex.variant === 'facil', variant: ex.variant, bpm: order.params.tempo || 72, meter: order.params.compas, noStaff, intro: noStaff ? 'Ordenamiento de la unidad, de oído: canta los nombres.' : 'Ordenamiento de la unidad.' }, sub);
        if (!t1) return null;
        takes.push(singResult(t1));
        await continueButton(host, 'Ahora, una lectura nueva');
      }
      const meter = (order && order.params.compas) || '4/4';
      const pool = lect.notas || env.unitNotes || ['G4', 'E4'];
      const melody = genMelody({ notas: pool, bars: Math.min(lect.compases || 2, 4), barBeats: barBeatsOf(meter), seed, figures: longFigures(lect.figuras), tonic: tonicOf(ex, pool) });
      const t2 = await singTask(host, { tokens: melody, key: unitKeyOf(ex), echo: false, variant: ex.variant, bpm: 72, meter, hideNames: true, help: ex.variant === 'facil', intro: 'Lectura cantada: lee las notas en el pentagrama.' }, sub);
      if (!t2) return null;
      takes.push(singResult(t2));
      return { pct: Math.round(takes.reduce((s, x) => s + x.pct, 0) / takes.length), mistakes: mistakeCodes(takes.flatMap(x => x.mistakes)) };
    }
    case 'lectura': return agilityTask(host, { notas: pp.notas, cantidad: pp.cantidad, segundosPorNota: pp.segundosPorNota, clave: 'sol', modo: 'nombrar' }, sub);
    case 'dictado': {
      // dictado rítmico (las figuras de la unidad) y dictado melódico (sus notas), los dos con la paleta de la unidad
      const rit = pp.ritmico || {};
      const mel = pp.melodico || {};
      const meter = rit.meter || mel.meter || '4/4';
      const figures = (ex.params.figurasUnidad || []).map(normFig);
      const parts = [];
      if (rit.level || rit.cells) {
        const rhythm = genRhythm({ figuras: (rit.cells || figures).map(normFig).filter(f => f !== 'qq'), barBeats: barBeatsOf(meter), bars: Math.min(rit.bars || 2, 4), seed });
        const r1 = await dictadoEscrito(host, { partitura: scoreText(rhythm, barBeatsOf(meter)), compas: meter, tempo: 72, escuchas: 3, tipo: 'ritmico', figurasUnidad: figures }, sub);
        if (!r1) return null;
        parts.push(r1);
      }
      // las notas que ya conoce la unidad (y su tónica: la en la unidad en la menor)
      const notas = mel.notas || env.unitNotes || ['C4', 'D4', 'E4'];
      const bars = Array.isArray(mel.compases) ? mel.compases[0] : mel.bars || 2;
      const tokens = genMelody({ notas, bars, barBeats: barBeatsOf(mel.meter || meter), seed: seed + 1, figures: longFigures(mel.figuras || figures), tonic: tonicOf(ex, notas) });
      const r2 = await dictadoEscrito(host, { partitura: scoreText(tokens, barBeatsOf(mel.meter || meter)), compas: mel.meter || meter, tempo: 72, escuchas: 3, tipo: 'melodico', figurasUnidad: figures }, sub);
      if (!r2) return null;
      parts.push(r2);
      return { pct: Math.round(parts.reduce((s, x) => s + x.pct, 0) / parts.length), mistakes: mistakeCodes(parts.flatMap(x => x.mistakes)) };
    }
    case 'teoria': {
      const pool = [...(pp.propias || []), ...shuffle(pp.banco || [], seed)];
      const items = [...new Set(pool)].map(id => lmQuestion(ex.level, id)).filter(Boolean).slice(0, pp.cantidad || 4);
      const r = await runItems(host, items, sub);
      return r && { ...r, pct: pctOf(r.marks) };
    }
    case 'audicion': {
      const songs = (pp.cancionesPosibles || []).map(t => lmSong(ex.level, t)).filter(Boolean);
      const items = [...(songs.length > 1 ? songQuestions(songs, 1, seed) : []), lmQuestion(ex.level, pp.preguntaAudicion)].filter(Boolean);
      const r = await runItems(host, items, sub);
      return r && { ...r, pct: pctOf(r.marks) };
    }
    default: return { pct: 0, mistakes: [] };
  }
}
async function repaso(host, ex, env) {
  const parts = ex.params.partes || [];
  const done = [];
  for (let i = 0; i < parts.length; i++) {
    if (!env.alive()) return null;
    const part = parts[i];
    host.innerHTML = `<p class="eyebrow lm-count">Parte ${i + 1} de ${parts.length}</p><h2 class="lm-q" tabindex="-1">${esc(COMP_TITLE[part.competencia] || part.competencia)}</h2>
      <p class="muted">${esc(COMP_HINT[part.competencia] || '')}</p>`;
    host.querySelector('.lm-q').focus();
    await continueButton(host, 'Empezar');
    const box = document.createElement('div');
    host.replaceChildren(box);
    const r = await repasoPart(box, part, ex, env);
    if (!r || !env.alive()) return null;
    done.push({ skill: part.competencia, peso: part.peso || 1, pct: r.pct, mistakes: r.mistakes || [] });
    await continueButton(host, i + 1 < parts.length ? 'Siguiente parte' : 'Ver el resultado');
  }
  const weight = done.reduce((s, d) => s + d.peso, 0) || 1;
  const pct = Math.round(done.reduce((s, d) => s + d.pct * d.peso, 0) / weight);
  const skills = Object.fromEntries(done.map(d => [d.skill, d.pct]));
  // 3 estrellas solo con el 90 % y ninguna competencia por debajo del 70 %
  const stars = pct >= 90 && done.every(d => d.pct >= 70) ? 3 : pct >= 80 ? 2 : pct >= (ex.params.aprobado || 60) ? 1 : 0;
  return {
    pct, stars, skills, marks: done.map(d => (d.pct >= 80 ? 'ok' : d.pct >= 60 ? 'near' : 'bad')), labels: done.map(d => `${COMP_TITLE[d.skill]} ${d.pct} %`),
    mistakes: mistakeCodes(done.flatMap(d => d.mistakes)),
  };
}

export const RUNNERS = {
  'lectura-ritmica': lecturaDosVoces, // solo la de dos voces (voz1); las demás, en el ensayo rítmico (launcher)
  teoria, stop, agilidad, entonacion, 'cancion-cantada': cancionCantada, escribir, discriminacion, audicion, creatividad, repaso,
};
