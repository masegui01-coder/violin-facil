// Ejercicios nuevos del curso, tipo a tipo: cada uno compone las piezas de tasks-*.js con los parámetros del catálogo
// y devuelve { pct, marks?, labels?, mistakes, skills?, note? } para el resultado (screen.js lo registra y lo enseña).
import { esc } from '../ui.js';
import { QUIZ_KINDS, playQuestion } from './tasks-quiz.js';
import { tocarPentagrama, barras, dictadoEscrito, createStaffWriter, tokensToPlay } from './tasks-staff.js';
import { singTask, lyricsUnder, singResult } from './tasks-voice.js';
import { stopGame, tapRhythm } from './tasks-rhythm.js';
import { agilityTask } from './tasks-agility.js';
import { meterQuestions, semitoneQuestions, modeQuestions, songQuestions, genRhythm, genMelody } from './gen.js';
import { pctOf, checkComposition, mistakeCodes } from './grade.js';
import { scoreTokens, barBeatsOf, stepOf, noteText, tokensText } from './notes.js';
import { lmExercise, lmQuestion, lmSong, lmUnit } from './catalog.js';
import { staffHtml, continueButton, playButton, shuffle, CLEF, tokenLabel } from './kit.js';
import { playNotes, playVoices, stopSound } from './sound.js';
import { saveWork, workOf } from './results.js';

const STAFF_KINDS = { tocarPentagrama, escala: tocarPentagrama, barras };
const runItem = (host, item, env) => (STAFF_KINDS[item.tipo] || QUIZ_KINDS[item.tipo] || QUIZ_KINDS.elegir)(host, item, env);

// Serie de preguntas con su progreso; devuelve marcas y errores
async function runItems(host, items, env, title = 'Pregunta') {
  const marks = [];
  const mistakes = [];
  for (let i = 0; i < items.length; i++) {
    if (!env.alive()) return null;
    host.innerHTML = `<p class="eyebrow lm-count">${esc(title)} ${i + 1} de ${items.length}</p><div class="lm-item"></div>`;
    const r = await runItem(host.querySelector('.lm-item'), items[i], env);
    if (!r || !env.alive()) return null;
    marks.push(r.mark);
    mistakes.push(r.mistake);
    await continueButton(host, i + 1 < items.length ? 'Siguiente' : 'Ver el resultado');
  }
  return { marks, mistakes: mistakeCodes(mistakes), labels: items.map((it, i) => `${title} ${i + 1}`) };
}

// ---------- Teoría: ficha (tarjetas) y práctica interactiva ----------
function cardHtml(card, env) {
  const ex = card.ejemplo ? scoreTokens(card.ejemplo) : null;
  return `<h2 class="lm-q" tabindex="-1">${esc(card.titulo)}</h2><p>${esc(card.texto)}</p>
    ${ex ? `${staffHtml(ex, { label: ex.map(t => tokenLabel(t, env.nom)).join(', ') })}${playButton('lmCardPlay', 'Escuchar el ejemplo')}` : ''}`;
}
async function showCards(host, cards, env, summary) {
  if (summary) {
    host.innerHTML = `<p class="eyebrow">Resumen de la teoría</p>${cards.map(c => `<div class="lm-card-sum"><h3>${esc(c.titulo)}</h3><p>${esc(c.texto)}</p></div>`).join('')}`;
    host.querySelector('h3').setAttribute('tabindex', '-1');
    host.querySelector('h3').focus();
    await continueButton(host, 'A practicar');
    return;
  }
  for (let i = 0; i < cards.length; i++) {
    if (!env.alive()) return;
    host.innerHTML = `<p class="eyebrow">Ficha ${i + 1} de ${cards.length}</p><div class="lm-card">${cardHtml(cards[i], env)}</div>`;
    host.querySelector('.lm-q').focus();
    const play = host.querySelector('#lmCardPlay');
    if (play) play.addEventListener('click', () => playQuestion({ partitura: cards[i].ejemplo }, env));
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
  const tokens = scoreTokens(p.partitura);
  const take = await singTask(host, {
    tokens, key: p.tonalidad, echo: ex.variant === 'facil', variant: ex.variant, meter: p.compas, bpm: p.tempo || 72, clef: CLEF[p.clave] || 'treble',
    intro: p.apoyo || '', introLabel: 'Apoyo:',
  }, env);
  return take && { ...singResult(take), labels: take.names.map(n => noteText(n, env.nom)), range: take.range };
}
async function cancionCantada(host, ex, env) {
  const song = ex.params.cancion;
  const tokens = scoreTokens(song.partitura);
  const names = /nombre de notas/.test(ex.params.modo || '');
  const take = await singTask(host, {
    tokens, key: song.tonalidad, echo: ex.variant === 'facil', variant: ex.variant, meter: song.compas, bpm: song.tempo || 72,
    under: lyricsUnder(tokens, song.letra, env.nom, names), intro: ex.params.consigna || '',
  }, env);
  return take && { ...singResult(take), labels: take.names.map(n => noteText(n, env.nom)), range: take.range };
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
function voicesOf(frag) {
  const rep = frag.repetir || 1;
  return frag.voces.map(v => {
    const one = scoreTokens(v.partitura);
    const len = one.reduce((s, t) => s + t.beats, 0);
    return Array.from({ length: rep }, (_, k) => one.map(t => ({ midi: t.midi, start: t.start + k * len, beats: t.beats, rest: t.rest }))).flat();
  });
}
function workHtml(a, id) {
  const frag = a.fragmento;
  return `<article class="lm-work">
    <p class="eyebrow"><span>${esc(a.epoca || '')}</span>${a.pais ? ` · <span>${esc(a.pais)}</span>` : ''}</p>
    <h2 class="lm-q" tabindex="-1">${esc(a.compositor)}</h2><p class="muted small"><span>${esc(a.vida || '')}</span>${a.genero ? ` · <span>${esc(a.genero)}</span>` : ''}</p>
    <p class="lm-work-title"><b>${esc(a.obra)}</b></p>
    <ul class="lm-facts">${(a.ficha || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${frag ? `<div class="lm-listen"><p class="muted small"><span>${frag.voces.map(v => esc(v.nombre)).join(' · ')}</span></p>
      ${playButton(id, 'Escuchar el fragmento')}<button type="button" class="btn ghost small" data-stop-audio>Parar</button>
      ${frag.nota ? `<p class="muted small">${esc(frag.nota)}</p>` : ''}</div>` : ''}
  </article>`;
}
function bindWork(host, a, id) {
  const frag = a.fragmento;
  if (!frag) return;
  host.querySelector(`#${id}`).addEventListener('click', () => {
    stopSound();
    const voices = voicesOf(frag);
    // golpe por sorpresa (Haydn): acorde ff en el compás y pulso indicados
    if (frag.golpe) {
      const at = (frag.golpe.compas - 1) * barBeatsOf(frag.compas) + (frag.golpe.pulso - 1);
      frag.golpe.notas.forEach(n => voices.push([{ midi: scoreTokens(`| ${n}q |`)[0].midi, start: at, beats: 1, rest: false }]));
    }
    playVoices(voices, frag.tempo || 80);
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

// ---------- Creatividad: componer con restricciones y escucharlo ----------
const normFig = f => (f === 'ee' ? 'e' : f === 'rq' ? 'Rq' : f);
async function creatividad(host, ex, env) {
  const p = ex.params;
  const rs = p.restricciones || {};
  const meter = rs.compas || '4/4';
  const figures = (rs.figuras || ['q', 'h']).map(normFig);
  const rhythmOnly = !rs.notas;
  const given = rs.dada ? scoreTokens(rs.dada) : null;
  const saved = workOf(ex.id);
  host.innerHTML = `<p>${esc(p.consigna || '')}</p>
    ${given ? `<p class="dict-staff-label">La llamada de la app</p>${staffHtml(given, { meter, label: given.map(t => tokenLabel(t, env.nom)).join(', ') })}${playButton('lmGivenPlay', 'Escuchar la llamada')}` : ''}
    <p class="dict-staff-label">Tu composición</p><div class="lm-writer"></div>
    ${rs.notas ? `<p class="muted small"><span>Notas:</span> <span>${rs.notas.map(n => noteText(n, env.nom)).join(', ')}</span></p>` : ''}
    ${rs.letra ? '<label class="lm-lyrics"><span>Tu letra</span><input type="text" id="lmLyrics" maxlength="120" autocomplete="off"></label>' : ''}
    <div class="controls">${playButton('lmMinePlay', 'Escuchar lo que has escrito')}<button type="button" class="btn" data-check>Comprobar y guardar</button></div>
    <div class="lm-feedback"></div>`;
  const w = createStaffWriter(host.querySelector('.lm-writer'), { figures, rhythmOnly, max: 64, nom: env.nom, say: env.say, meter });
  if (saved) env.say('Tienes una composición guardada de otra vez: puedes escribir una nueva');
  host.querySelector('#lmGivenPlay')?.addEventListener('click', () => { stopSound(); playNotes(tokensToPlay(given), 80); });
  host.querySelector('#lmMinePlay').addEventListener('click', () => { stopSound(); playNotes(tokensToPlay(w.tokens()), 80, { clap: rhythmOnly }); });
  await new Promise(r => host.querySelector('[data-check]').addEventListener('click', r, { once: true }));
  const tokens = w.tokens();
  const finals = rs.final ? String(rs.final).split('|').map(stepOf) : null;
  const semis = rs.mustInclude && rs.mustInclude.semitonos ? rs.mustInclude.semitonos.map(x => x.split('-').map(stepOf)) : null;
  const must = rs.mustInclude ? Object.fromEntries(Object.entries(rs.mustInclude).filter(([k]) => k !== 'semitonos')) : null;
  const c = checkComposition(tokens, {
    barBeats: barBeatsOf(meter), bars: rs.compases || 2, figures, notes: rs.notas ? rs.notas.map(stepOf) : null,
    endSteps: finals, endFigure: rs.finalFigura || null, maxLeap: rs.saltoMax ?? null, mustFigures: must && Object.keys(must).length ? must : null, semitones: semis,
  });
  const lyrics = host.querySelector('#lmLyrics')?.value.trim() || '';
  saveWork(ex.id, `${tokensText(tokens)}${lyrics ? `\n${lyrics}` : ''}`);
  w.lock();
  host.querySelector('[data-check]').disabled = true;
  return { pct: c.pct, marks: c.rules.map(r => (r.ok ? 'ok' : 'bad')), labels: c.rules.map(r => RULE_NAME[r.id]), mistakes: c.mistakes, note: 'Tu composición queda guardada. Si estás en una clase, tu profesor la escuchará y le pondrá nota.', work: tokensText(tokens) };
}
const RULE_NAME = {
  longitud: 'Número de compases', compases: 'Compases completos', figuras: 'Figuras permitidas', notas: 'Notas permitidas',
  final: 'Final', saltos: 'Sin saltos', incluye: 'Figuras obligatorias', semitonos: 'Los semitonos',
};

// ---------- Repaso por competencias ----------
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
      const order = lmExercise(pp.ordenamiento);
      const lect = pp.lectura || {};
      const melody = order ? scoreTokens(order.params.partitura).filter(t => t.bar === 0) : genMelody({ notas: lect.notas || ['G4', 'E4'], bars: 1, barBeats: 4, seed });
      const take = await singTask(host, { tokens: melody, echo: ex.variant === 'facil', variant: ex.variant, bpm: 72 }, sub);
      return take && singResult(take);
    }
    case 'lectura': return agilityTask(host, { notas: pp.notas, cantidad: pp.cantidad, segundosPorNota: pp.segundosPorNota, clave: 'sol', modo: 'nombrar' }, sub);
    case 'dictado': {
      const mel = pp.melodico || {};
      const notas = mel.notas || ['C4', 'D4', 'E4'];
      const tokens = genMelody({ notas, bars: 2, barBeats: barBeatsOf(mel.meter || pp.ritmico?.meter || '4/4'), seed, figures: ['q', 'h'] });
      return dictadoEscrito(host, { partitura: `| ${tokens.map(t => t.name + t.dur).join(' ')} |`, compas: mel.meter || pp.ritmico?.meter || '4/4', tempo: 72, escuchas: 3, tipo: 'melodico' }, sub);
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
  teoria, stop, agilidad, entonacion, 'cancion-cantada': cancionCantada, escribir, discriminacion, audicion, creatividad, repaso,
};
