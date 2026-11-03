// Espacios compartidos que dirige o posee el usuario (su banda, sus grupos, su escuela). Antes de borrar su cuenta
// elige, para cada uno, traspasarlo a otro miembro o borrarlo entero, para que no queden huérfanos. Sin DOM ni red.
export const DELETE = 'delete';
const OWNER_FIELD = { band: 'directorUid', group: 'ownerUid', school: 'ownerUid' };
const NAME_MAX = 60;

// Los demás miembros, por nombre: los que pueden quedarse con el espacio
export function transferCandidates(members, uid) {
  return (members || []).filter(m => m && m.id && m.id !== uid)
    .map(m => ({ id: m.id, nickname: String(m.nickname || '').slice(0, NAME_MAX) || '—' }))
    .sort((a, b) => a.nickname.localeCompare(b.nickname, 'es'));
}

// loaded: [{ kind, id, doc, members }] ya leídos de la nube → los que son suyos, con sus candidatos
export function ownedSpaces(loaded, uid) {
  return (loaded || []).filter(s => s && s.doc && OWNER_FIELD[s.kind] && s.doc[OWNER_FIELD[s.kind]] === uid)
    .map(s => ({ kind: s.kind, id: s.id, name: String(s.doc.name || ''), code: s.doc.code || null, candidates: transferCandidates(s.members, uid) }));
}

// Lo que sale elegido al abrir la hoja: pasarlo al primer candidato; sin más miembros, solo se puede borrar
export const defaultChoice = space => (space.candidates.length ? space.candidates[0].id : DELETE);

export const spaceKey = space => `${space.kind}:${space.id}`;

// Cada espacio tiene que tener una elección: borrar o uno de sus candidatos
export function choicesValid(spaces, choices) {
  return spaces.every(s => {
    const c = choices[spaceKey(s)];
    return c === DELETE || s.candidates.some(m => m.id === c);
  });
}

// Escrituras de un traspaso: [{ path, data }] (las reglas solo las aceptan del dueño actual hacia un miembro)
export function transferWrites(space, newUid) {
  const to = space.candidates.find(m => m.id === newUid);
  if (!to) throw new Error('El nuevo responsable debe ser miembro');
  if (space.kind === 'band') {
    return [
      { path: ['bands', space.id], data: { directorUid: to.id, directorName: to.nickname } },
      { path: ['bands', space.id, 'members', to.id], data: { role: 'director' } },
    ];
  }
  if (space.kind === 'group') return [{ path: ['groups', space.id], data: { ownerUid: to.id } }];
  if (space.kind === 'school') return [{ path: ['schools', space.id], data: { ownerUid: to.id, ownerName: to.nickname } }];
  throw new Error(`Espacio desconocido: ${space.kind}`);
}

// Estado con el que sigue el borrado de la cuenta: sin los espacios borrados (ya no hay nada suyo que buscar en ellos)
// ni la escuela traspasada (el profesor no tiene ficha). De la banda y los grupos traspasados se borra luego lo suyo.
export function stateAfterSpaces(state, spaces, choices) {
  const deleted = new Set(spaces.filter(s => choices[spaceKey(s)] === DELETE).map(spaceKey));
  const school = state.school && spaces.some(s => s.kind === 'school' && s.id === state.school.schoolId) ? null : state.school;
  return {
    ...state,
    band: state.band && deleted.has(`band:${state.band.bandId}`) ? null : state.band,
    groups: (state.groups || []).filter(g => !(g && deleted.has(`group:${g.groupId}`))),
    school,
  };
}
