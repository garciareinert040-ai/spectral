// =============================================================================
// store.js — Camada de dados: Auth + Firestore
// -----------------------------------------------------------------------------
// Concentra TODA a conversa com o Firebase. Pontos de integração:
//   • LOGIN / CADASTRO / SENHA / LOGOUT .... Firebase Auth
//   • PERFIL + CULTIVOS .................... Firestore  users/{uid}
//        { activeGrowId, grows: { <id>: { strain, tipo, datas, ... } } }
//   • REGISTROS diários .................... Firestore  users/{uid}/entries/{id}
//        id = "<growId>__<data>"  (cultivo "principal" antigo: id = "<data>")
//   • FOTOS (comprimidas → data URL) ....... dentro do próprio registro
//
// Tudo continua sob users/{uid}/... — as MESMAS regras de segurança de antes
// valem pra qualquer número de cultivos e qualquer número de usuários.
// =============================================================================

import { auth, db } from './firebase-init.js';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc,
  serverTimestamp, writeBatch, onSnapshot, deleteField,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Id do cultivo que existia antes do app suportar vários cultivos. Os registros
// dele continuam com o id antigo (só a data) — nada é movido nem regravado.
export const LEGACY_GROW_ID = 'principal';

// ---------------------------------------------------------------------------
// AUTENTICAÇÃO
// ---------------------------------------------------------------------------
export function watchAuth(cb) { return onAuthStateChanged(auth, cb); }
export function currentUid() { return auth.currentUser ? auth.currentUser.uid : null; }
export function currentEmail() { return auth.currentUser ? auth.currentUser.email : ''; }

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
export function logout() { return signOut(auth); }

// Traduz códigos de erro do Firebase Auth pra mensagens em português.
export function authErrorMessage(code) {
  const map = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/missing-email': 'Digite seu e-mail.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Conta não encontrada. Você quis dizer criar conta?',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já tem conta. Tente entrar.',
    'auth/weak-password': 'Senha fraca — use pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
    'auth/network-request-failed': 'Sem conexão. Verifique a internet.',
  };
  return map[code] || 'Algo deu errado. Tente novamente.';
}

// ---------------------------------------------------------------------------
// Caminhos
// ---------------------------------------------------------------------------
function userDocRef(uid) { return doc(db, 'users', uid); }
function entriesColRef(uid) { return collection(db, 'users', uid, 'entries'); }
export function entryDocId(growId, date) {
  return growId === LEGACY_GROW_ID ? date : `${growId}__${date}`;
}
function entryRef(uid, id) { return doc(db, 'users', uid, 'entries', id); }

// ---------------------------------------------------------------------------
// PERFIL / CULTIVOS  (documento users/{uid})
// ---------------------------------------------------------------------------
export async function loadConfig(uid) {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

// Merge cru no documento do usuário (usado pelo import de backup).
export async function saveConfig(uid, data) {
  await setDoc(userDocRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Grava a configuração COMPLETA de um cultivo (sempre o objeto inteiro).
export async function saveGrow(uid, growId, grow, extra = {}) {
  const payload = { grows: { [growId]: grow }, updatedAt: serverTimestamp(), ...extra };
  if (growId === LEGACY_GROW_ID) payload.legacyMigrated = true;
  await setDoc(userDocRef(uid), payload, { merge: true });
}

// Cria um cultivo novo e já o deixa ativo.
export async function createGrow(uid, grow) {
  const id = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await saveGrow(uid, id, { ...grow, createdAt: new Date().toISOString() }, { activeGrowId: id });
  return id;
}

export async function setActiveGrow(uid, growId) {
  await setDoc(userDocRef(uid), { activeGrowId: growId }, { merge: true });
}

// Apaga um cultivo e TODOS os registros dele. Irreversível.
export async function deleteGrow(uid, growId, entryIds, nextActiveId) {
  for (let i = 0; i < entryIds.length; i += 400) {
    const batch = writeBatch(db);
    entryIds.slice(i, i + 400).forEach((id) => batch.delete(entryRef(uid, id)));
    await batch.commit();
  }
  const upd = { [`grows.${growId}`]: deleteField(), activeGrowId: nextActiveId || null };
  if (growId === LEGACY_GROW_ID) upd.legacyMigrated = true;
  await updateDoc(userDocRef(uid), upd);
}

// ---------------------------------------------------------------------------
// REGISTROS DIÁRIOS
// ---------------------------------------------------------------------------
export async function saveEntry(uid, growId, entry) {
  const ref = entryRef(uid, entryDocId(growId, entry.date));
  const existing = await getDoc(ref);
  const payload = {
    ...entry,
    growId,
    updatedAt: serverTimestamp(),
    createdAt: existing.exists() ? existing.data().createdAt || serverTimestamp() : serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

export async function deleteEntry(uid, growId, date) {
  await deleteDoc(entryRef(uid, entryDocId(growId, date)));
}

function docToEntry(d) {
  const data = d.data();
  return { ...data, _id: d.id, date: data.date || d.id };
}

export async function loadEntries(uid) {
  const snap = await getDocs(entriesColRef(uid));
  const list = [];
  snap.forEach((d) => list.push(docToEntry(d)));
  return list;
}

// --- Listeners em TEMPO REAL (sincronização multi-dispositivo) --------------
export function watchConfig(uid, cb) {
  return onSnapshot(userDocRef(uid), (snap) =>
    cb(snap.exists() ? snap.data() : null, snap.metadata)
  );
}
// Entrega TODOS os registros da conta; o app filtra pelo cultivo ativo.
export function watchEntries(uid, cb) {
  return onSnapshot(entriesColRef(uid), (snap) => {
    const list = [];
    snap.forEach((d) => list.push(docToEntry(d)));
    cb(list, snap.metadata);
  });
}

// ---------------------------------------------------------------------------
// FOTOS  (guardadas como DATA URL dentro do registro, no Firestore)
// As fotos são COMPRIMIDAS no navegador (canvas → JPEG) e viram um texto
// "data:image/jpeg;base64,..." salvo junto do registro do dia. Sem Storage.
//
// Limite do Firestore: 1 documento ≤ 1 MiB. Por isso comprimimos com folga
// (máx. ~1080px, JPEG ~0.6) e o app avisa se um dia ficar grande demais.
// ---------------------------------------------------------------------------

// Redimensiona pra no máx. `maxSide` px no lado maior e devolve uma DATA URL JPEG.
export function compressImageToDataURL(file, maxSide = 1080, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > height && width > maxSide) { height = Math.round(height * maxSide / width); width = maxSide; }
      else if (height > maxSide) { width = Math.round(width * maxSide / height); height = maxSide; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

// Comprime UMA foto e devolve { data } (a data URL) pra guardar no registro.
export async function preparePhoto(file) {
  const data = await compressImageToDataURL(file);
  return { data };
}

// ---------------------------------------------------------------------------
// EXPORT / IMPORT  (backup extra em JSON, além da nuvem)
// As fotos (data URLs) NÃO vão no JSON — manteria o arquivo enorme. Exportamos
// só os dados estruturados; as imagens seguem guardadas no Firestore (nuvem).
// ---------------------------------------------------------------------------

// Remove o conteúdo pesado das fotos, deixando só a contagem (pro backup leve).
function stripPhotos(entry) {
  if (!entry || !Array.isArray(entry.photos)) return entry;
  const { photos, ...rest } = entry;
  return { ...rest, photoCount: photos.length };
}

export async function exportAll(uid) {
  const [config, entries] = await Promise.all([loadConfig(uid), loadEntries(uid)]);
  return {
    app: 'diario-de-cultivo',
    version: 2,
    exportedAt: new Date().toISOString(),
    note: 'Backup de dados de todos os cultivos. As fotos não vão embutidas (só a contagem por dia) — elas seguem guardadas no Firestore, na nuvem.',
    config: config ? stripTimestamps(config) : null,
    entries: entries.map(stripPhotos),
  };
}

// Restaura perfil/cultivos + registros de um backup. Aceita backups antigos (v1).
export async function importAll(uid, data) {
  if (!data || data.app !== 'diario-de-cultivo') throw new Error('Arquivo de backup inválido.');
  if (data.config) await saveConfig(uid, stripTimestamps(data.config));

  const entries = Array.isArray(data.entries) ? data.entries : [];
  for (let i = 0; i < entries.length; i += 400) {
    const batch = writeBatch(db);
    for (const e of entries.slice(i, i + 400)) {
      if (!e.date) continue;
      const id = e._id || entryDocId(e.growId || LEGACY_GROW_ID, e.date);
      const { _id, ...rest } = stripTimestamps(e);
      batch.set(entryRef(uid, id), { ...rest, updatedAt: serverTimestamp() }, { merge: true });
    }
    await batch.commit();
  }
  return entries.length;
}

// Remove campos de timestamp (serverTimestamp vira objeto estranho no JSON).
function stripTimestamps(obj) {
  const { createdAt, updatedAt, ...rest } = obj || {};
  return rest;
}
