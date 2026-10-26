// Grupos en Firestore: grupos pequeños que ensayan a distancia. Cada canción tiene una maqueta y una pista por músico.
// El audio va troceado en documentos (sin almacén de archivos: así no hace falta el plan de pago de Firebase).
// groups/{gid} · groupCodes/{code} · groups/{gid}/members/{uid} · groups/{gid}/songs/{sid}
// groups/{gid}/songs/{sid}/tracks/{tid} (tid = 'demo' o el uid) · …/tracks/{tid}/chunks/{n}
import { getCloud, ensureSignedIn, randomCode } from './cloud.js';
import { splitBytes, joinBytes, MAX_MEMBERS } from './group-mix.js';

const MAX_CODE_TRIES = 5;
const refs = async () => { const c = await getCloud(); return { db: c.db, fs: c.fs }; };
const rows = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
export const millis = t => (t && t.toMillis ? t.toMillis() : t || 0);

export async function createGroup(name, nickname, instrument) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const ref = fs.doc(fs.collection(db, 'groups'));
  for (let i = 0; i < MAX_CODE_TRIES; i++) {
    const code = randomCode();
    const batch = fs.writeBatch(db);
    batch.set(ref, { name, ownerUid: user.uid, code, createdAt: fs.serverTimestamp() });
    batch.set(fs.doc(db, 'groups', ref.id, 'members', user.uid), { nickname, instrument, code, joinedAt: fs.serverTimestamp() });
    batch.set(fs.doc(db, 'groupCodes', code), { groupId: ref.id, groupName: name });
    try {
      await batch.commit();
      return { groupId: ref.id, name, code };
    } catch (e) {
      if (!String(e.code).includes('permission')) throw e; // el código ya existía
    }
  }
  throw new Error('No he podido generar un código libre. Inténtalo otra vez.');
}

export async function joinGroup(code, nickname, instrument) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const clean = code.trim().toUpperCase();
  const snap = await fs.getDoc(fs.doc(db, 'groupCodes', clean));
  if (!snap.exists()) throw new Error('No existe ningún grupo con ese código. Pídeselo otra vez a tu grupo.');
  const { groupId, groupName } = snap.data();
  await fs.setDoc(fs.doc(db, 'groups', groupId, 'members', user.uid), { nickname, instrument, code: clean, joinedAt: fs.serverTimestamp() });
  const members = await listMembers(groupId);
  if (members.length > MAX_MEMBERS) {
    await fs.deleteDoc(fs.doc(db, 'groups', groupId, 'members', user.uid));
    throw new Error(`Este grupo ya tiene ${MAX_MEMBERS} músicos, el máximo de la beta.`);
  }
  return { groupId, name: groupName, code: clean };
}

export async function leaveGroup(groupId) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  await fs.deleteDoc(fs.doc(db, 'groups', groupId, 'members', user.uid));
}

export async function getGroup(groupId) {
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'groups', groupId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listMembers(groupId) {
  const { db, fs } = await refs();
  return rows(await fs.getDocs(fs.collection(db, 'groups', groupId, 'members')));
}

export async function listSongs(groupId) {
  const { db, fs } = await refs();
  return rows(await fs.getDocs(fs.collection(db, 'groups', groupId, 'songs')));
}

export async function createSong(groupId, { title, bpm }) {
  const user = await ensureSignedIn();
  const { db, fs } = await refs();
  const ref = fs.doc(fs.collection(db, 'groups', groupId, 'songs'));
  await fs.setDoc(ref, { title, bpm, createdBy: user.uid, sections: [], parts: {}, updatedAt: fs.serverTimestamp() });
  return ref.id;
}

export async function updateSong(groupId, songId, patch) {
  const { db, fs } = await refs();
  await fs.updateDoc(fs.doc(db, 'groups', groupId, 'songs', songId), { ...patch, updatedAt: fs.serverTimestamp() });
}

export async function getSong(groupId, songId) {
  const { db, fs } = await refs();
  const snap = await fs.getDoc(fs.doc(db, 'groups', groupId, 'songs', songId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Sube una pista (maqueta o la parte de un músico): borra la anterior y guarda la nueva en trozos.
// En la canción queda un resumen (quién ha subido qué y su versión) para no descargar audio sin necesidad.
export async function saveTrack(groupId, songId, trackId, blob, meta) {
  const { db, fs } = await refs();
  await deleteTrackAudio(groupId, songId, trackId);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const parts = splitBytes(bytes);
  const base = ['groups', groupId, 'songs', songId, 'tracks', trackId];
  for (let i = 0; i < parts.length; i++) {
    await fs.setDoc(fs.doc(db, ...base, 'chunks', String(i)), { i, data: fs.Bytes.fromUint8Array(parts[i]) });
  }
  const version = Date.now();
  const info = { ...meta, mime: blob.type || 'audio/webm', chunks: parts.length, bytes: bytes.length, version };
  await fs.setDoc(fs.doc(db, ...base), info);
  await updateSong(groupId, songId, { [`parts.${trackId}`]: info });
  return info;
}

export async function loadTrackAudio(groupId, songId, trackId, chunks) {
  const { db, fs } = await refs();
  const base = ['groups', groupId, 'songs', songId, 'tracks', trackId, 'chunks'];
  const snaps = await Promise.all(Array.from({ length: chunks }, (_, i) => fs.getDoc(fs.doc(db, ...base, String(i)))));
  if (snaps.some(s => !s.exists())) throw new Error('Falta un trozo de la pista: quizá se está subiendo otra vez. Prueba en un momento.');
  return joinBytes(snaps.map(s => s.data().data.toUint8Array()));
}

async function deleteTrackAudio(groupId, songId, trackId) {
  const { db, fs } = await refs();
  const chunks = await fs.getDocs(fs.collection(db, 'groups', groupId, 'songs', songId, 'tracks', trackId, 'chunks'));
  await Promise.all(chunks.docs.map(d => fs.deleteDoc(d.ref)));
}

export async function deleteTrack(groupId, songId, trackId) {
  const { db, fs } = await refs();
  await deleteTrackAudio(groupId, songId, trackId);
  await fs.deleteDoc(fs.doc(db, 'groups', groupId, 'songs', songId, 'tracks', trackId));
  await updateSong(groupId, songId, { [`parts.${trackId}`]: fs.deleteField() });
}

export async function deleteSong(groupId, song) {
  const { db, fs } = await refs();
  await Promise.all(Object.keys(song.parts || {}).map(tid => deleteTrackAudio(groupId, song.id, tid)
    .then(() => fs.deleteDoc(fs.doc(db, 'groups', groupId, 'songs', song.id, 'tracks', tid)))));
  await fs.deleteDoc(fs.doc(db, 'groups', groupId, 'songs', song.id));
}
