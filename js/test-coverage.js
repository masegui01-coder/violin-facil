// Checklist de pruebas de la beta: qué partes de la app ha usado cada tester (sin DOM ni red).
// Se deduce del estado guardado y de las pantallas visitadas (state.seenScreens), que viajan en el resumen del tester.

// Pantallas que cuentan como «probadas» al abrirlas
export const TRACKED_SCREENS = ['placement', 'theory', 'lesson', 'free', 'chords', 'rhythm', 'tuner', 'metro', 'longtone', 'tuningmap', 'chord', 'gym', 'friends', 'groupsong', 'result'];

const has = obj => !!obj && Object.keys(obj).length > 0;
const seen = (s, id) => !!(s.seenScreens && s.seenScreens[id]);

export const FEATURES = [
  { id: 'onboarding', area: 'Primeros pasos', label: 'Bienvenida y elegir instrumento', test: s => !!s.onboarded },
  { id: 'placement', area: 'Primeros pasos', label: 'Test de nivel', test: s => seen(s, 'placement') },
  { id: 'theory', area: 'Aprender', label: 'Lecciones de teoría y píldoras', test: s => seen(s, 'theory') },
  { id: 'lesson', area: 'Aprender', label: 'Lección con micrófono (notas y canciones)', test: s => seen(s, 'lesson') },
  { id: 'finish', area: 'Aprender', label: 'Terminar una lección y ver el resultado coloreado', test: s => seen(s, 'result') || (s.lessonsPlayed || 0) > 0 },
  { id: 'chords', area: 'Aprender', label: 'Acordes (guitarra, ukelele, piano)', test: s => seen(s, 'chords') },
  { id: 'rhythm', area: 'Aprender', label: 'Ritmo (percusión y cajón)', test: s => seen(s, 'rhythm') },
  { id: 'routine', area: 'Aprender', label: 'Rutina del día', test: s => has(s.routineDone) },
  { id: 'daily', area: 'Aprender', label: 'Reto del día', test: s => has(s.dailyDone) },
  { id: 'free', area: 'Canciones', label: 'Toca libre y de memoria', test: s => seen(s, 'free') },
  { id: 'import', area: 'Canciones', label: 'Importar una partitura MusicXML', test: s => (s.importedSongs || []).length > 0 },
  { id: 'tuner', area: 'Estudio', label: 'Afinador', test: s => seen(s, 'tuner') },
  { id: 'metro', area: 'Estudio', label: 'Metrónomo', test: s => seen(s, 'metro') },
  { id: 'longtone', area: 'Estudio', label: 'Notas tenidas', test: s => seen(s, 'longtone') },
  { id: 'tuningmap', area: 'Estudio', label: 'Mapa de afinación', test: s => seen(s, 'tuningmap') },
  { id: 'chord-tune', area: 'Estudio', label: 'Afinar en acorde', test: s => seen(s, 'chord') },
  { id: 'gym', area: 'Estudio', label: 'Gimnasio de técnica', test: s => seen(s, 'gym') },
  { id: 'band-member', area: 'Banda', label: 'Unirse a una banda y ensayar tareas', test: s => !!s.band && s.band.role !== 'director' },
  { id: 'band-director', area: 'Banda', label: 'Crear y dirigir una banda', test: s => !!s.band && s.band.role === 'director' },
  { id: 'groups', area: 'Banda', label: 'Crear o unirse a un grupo', test: s => (s.groups || []).length > 0 },
  { id: 'group-song', area: 'Banda', label: 'Escuchar y grabar en una canción de grupo', test: s => seen(s, 'groupsong') },
  { id: 'friends', area: 'Social', label: 'Amigos y muro', test: s => seen(s, 'friends') },
  { id: 'boards', area: 'Social', label: 'Clasificaciones públicas con apodo', test: s => !!s.publicBoards },
  { id: 'kid', area: 'Perfil', label: 'Modo niño', test: s => !!s.kidMode },
];

export const featuresFromState = state => FEATURES.filter(f => { try { return f.test(state); } catch (e) { return false; } }).map(f => f.id);

// Para cada parte: quién la ha probado. Estado: 'ok' (2 o más), 'few' (1) o 'missing' (nadie); y lo revisado a mano
export function coverage(testers, manual = {}) {
  return FEATURES.map(f => {
    const by = testers.filter(t => (t.features || []).includes(f.id));
    const status = by.length >= 2 ? 'ok' : by.length === 1 ? 'few' : 'missing';
    return { id: f.id, area: f.area, label: f.label, count: by.length, names: by.map(t => t.name).slice(0, 5), status, checked: !!(manual[f.id] && manual[f.id].ok) };
  });
}

// Instrumentos y dispositivos que nadie ha probado todavía
export function untested(all, testers, key) {
  const used = new Set(testers.flatMap(t => key(t)));
  return all.filter(x => !used.has(x));
}
