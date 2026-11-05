// Traspasar o borrar los espacios que posee el usuario (banda, grupos, escuela) antes de borrar su cuenta.
// Solo con su sesión: las reglas permiten al director o dueño actual traspasarlo a un miembro o borrarlo todo.
import { getCloud } from './cloud.js';
import { deleteSong } from './groups-api.js';
import { ownedSpaces, transferWrites } from './spaces.js';

const BAND_SUBS = ['tasks', 'events', 'notices', 'rewards', 'library', 'progress'];
const NOT_FOUND = ['permission', 'not-found']; // ya no es miembro o el espacio ya no existe: no es suyo

const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs }; };
const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));

async function readSpace(fs, db, kind, coll, id, membersColl = 'members') {
  try {
    const snap = await fs.getDoc(fs.doc(db, coll, id));
    if (!snap.exists()) return null;
    const members = rows(await fs.getDocs(fs.collection(db, coll, id, membersColl)));
    return { kind, id, doc: snap.data(), members };
  } catch (e) {
    if (NOT_FOUND.some(c => String(e && e.code).includes(c))) return null;
    throw e; // sin conexión: no se puede decidir nada
  }
}

// Espacios que dirige o posee, a partir de lo que recuerda este dispositivo (bandas, grupos y escuela)
export async function loadOwnedSpaces(uid, state) {
  const { db, fs } = await refs();
  const reads = [];
  if (state.band && state.band.bandId && state.band.role === 'director') reads.push(readSpace(fs, db, 'band', 'bands', state.band.bandId));
  (state.groups || []).filter(g => g && g.groupId).forEach(g => reads.push(readSpace(fs, db, 'group', 'groups', g.groupId)));
  if (state.school && state.school.schoolId && state.school.role === 'teacher') reads.push(readSpace(fs, db, 'school', 'schools', state.school.schoolId));
  // Aula Pro: la escuela que se creó al pedir el acceso (si no es la misma de la pestaña Escuela)
  const aulaSid = state.aula && state.aula.schoolId;
  if (aulaSid && !(state.school && state.school.schoolId === aulaSid)) reads.push(readSpace(fs, db, 'school', 'schools', aulaSid));
  return ownedSpaces((await Promise.all(reads)).filter(Boolean), uid);
}

// Traspaso en una sola escritura (documento del espacio y, en la banda, el papel del nuevo director)
export async function transferSpace(space, newUid) {
  const { db, fs } = await refs();
  const batch = fs.writeBatch(db);
  transferWrites(space, newUid).forEach(w => batch.update(fs.doc(db, ...w.path), w.data));
  await batch.commit();
}

const deleteAll = async (fs, docs) => { await Promise.all(docs.map(d => fs.deleteDoc(d.ref))); };
const listDocs = async (fs, db, ...path) => (await fs.getDocs(fs.collection(db, ...path))).docs;

// Banda: subcolecciones y fichas primero (las reglas lo miran en el documento de la banda), el código y la banda al final
async function deleteBand(fs, db, space, uid) {
  for (const sub of BAND_SUBS) await deleteAll(fs, await listDocs(fs, db, 'bands', space.id, sub));
  const members = await listDocs(fs, db, 'bands', space.id, 'members');
  // Las estadísticas privadas de cada músico (members/{uid}/private/stats) no se borran solas con su ficha
  await Promise.all(members.map(m => fs.deleteDoc(fs.doc(db, 'bands', space.id, 'members', m.id, 'private', 'stats'))));
  await deleteAll(fs, members.filter(m => m.id !== uid));
  if (space.code) await fs.deleteDoc(fs.doc(db, 'bandCodes', space.code));
  await fs.deleteDoc(fs.doc(db, 'bands', space.id, 'members', uid));
  await fs.deleteDoc(fs.doc(db, 'bands', space.id));
}

// Grupo: canciones con sus pistas (hace falta seguir siendo miembro), fichas, código y grupo; mi ficha la última
async function deleteGroup(fs, db, space, uid) {
  const songs = rows(await fs.getDocs(fs.collection(db, 'groups', space.id, 'songs')));
  for (const song of songs) await deleteSong(space.id, song);
  const members = await listDocs(fs, db, 'groups', space.id, 'members');
  await deleteAll(fs, members.filter(m => m.id !== uid));
  if (space.code) await fs.deleteDoc(fs.doc(db, 'groupCodes', space.code));
  await fs.deleteDoc(fs.doc(db, 'groups', space.id));
  await fs.deleteDoc(fs.doc(db, 'groups', space.id, 'members', uid));
}

// Escuela: todo en una escritura (las fichas de alumno solo se borran junto al contador o con la escuela)
async function deleteSchool(fs, db, space) {
  // Aula Pro: cada clase con sus fichas, tareas, resúmenes, comentarios y su código (las fichas se borran con la clase)
  const classes = await listDocs(fs, db, 'schools', space.id, 'classes');
  for (const c of classes) {
    const cls = { id: c.id, ...c.data() };
    const lists = await Promise.all(['students', 'tasks', 'summaries', 'feedback', 'works'].map(n => listDocs(fs, db, 'schools', space.id, 'classes', cls.id, n)));
    const batch = fs.writeBatch(db);
    lists.flat().forEach(d => batch.delete(d.ref));
    if (cls.code && !cls.closed) batch.delete(fs.doc(db, 'classCodes', cls.code)); // cerrada: el código ya no existe
    batch.delete(c.ref);
    await batch.commit();
  }
  const [members, progress] = await Promise.all([listDocs(fs, db, 'schools', space.id, 'members'), listDocs(fs, db, 'schools', space.id, 'progress')]);
  const batch = fs.writeBatch(db);
  [...members, ...progress].forEach(d => batch.delete(d.ref));
  if (space.code) batch.delete(fs.doc(db, 'schoolCodes', space.code));
  batch.delete(fs.doc(db, 'schools', space.id));
  await batch.commit();
}

export async function deleteSpace(space, uid) {
  const { db, fs } = await refs();
  if (space.kind === 'band') return deleteBand(fs, db, space, uid);
  if (space.kind === 'group') return deleteGroup(fs, db, space, uid);
  if (space.kind === 'school') return deleteSchool(fs, db, space);
  throw new Error(`Espacio desconocido: ${space.kind}`);
}
