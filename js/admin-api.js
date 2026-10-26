// Lecturas solo para el administrador (las reglas de firestore.rules lo comprueban): bandas y grupos para las métricas.
import { getCloud } from './cloud.js';

const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));

export async function listBandsWithMembers() {
  const { db, fs } = await getCloud();
  const bands = rows(await fs.getDocs(fs.collection(db, 'bands')));
  return Promise.all(bands.map(async b => ({
    ...b, members: (await fs.getDocs(fs.collection(db, 'bands', b.id, 'members'))).size,
  })));
}

export async function listGroupsWithSongs() {
  const { db, fs } = await getCloud();
  const groups = rows(await fs.getDocs(fs.collection(db, 'groups')));
  return Promise.all(groups.map(async g => ({
    ...g,
    members: (await fs.getDocs(fs.collection(db, 'groups', g.id, 'members'))).size,
    songs: rows(await fs.getDocs(fs.collection(db, 'groups', g.id, 'songs'))),
  })));
}
