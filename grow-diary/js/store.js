// =============================================================================
// store.js — Camada de dados: Auth + Firestore + Storage
// -----------------------------------------------------------------------------
// Concentra TODA a conversa com o Firebase para o resto do app não precisar
// conhecer os detalhes do SDK. Pontos de integração comentados:
//   • LOGIN / CADASTRO / LOGOUT ............ Firebase Auth
//   • CONFIG do grow ....................... Firestore  users/{uid}
//   • REGISTROS diários .................... Firestore  users/{uid}/entries/{data}
//   • FOTOS (comprimidas) .................. Storage    users/{uid}/photos/{data}/{arquivo}
// =============================================================================

import { auth, db, storage } from './firebase-init.js';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, getDoc, setDoc, collection, getDocs, deleteDoc,
  serverTimestamp, writeBatch, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  ref, uploadBytes, getDownloadURL, deleteObject,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// ---------------------------------------------------------------------------
// AUTENTICAÇÃO  (ponto de integração: login / cadastro / logout)
// ---------------------------------------------------------------------------
export function watchAuth(cb) { return onAuthStateChanged(auth, cb); }
export function currentUid() { return auth.currentUser ? auth.currentUser.uid : null; }

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export function logout() { return signOut(auth); }

// Traduz códigos de erro do Firebase Auth pra mensagens em português.
export function authErrorMessage(code) {
  const map = {
    'auth/invalid-email': 'E-mail inválido.',
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
// Helpers de caminho no Firestore
// ---------------------------------------------------------------------------
function userDocRef(uid) { return doc(db, 'users', uid); }
function entriesColRef(uid) { return collection(db, 'users', uid, 'entries'); }
function entryDocRef(uid, date) { return doc(db, 'users', uid, 'entries', date); }

// ---------------------------------------------------------------------------
// CONFIG DO GROW  (documento users/{uid})  — data de plantio, nome, meta,
// e o checklist de pós-colheita.
// ---------------------------------------------------------------------------
export async function loadConfig(uid) {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

// Grava/atualiza a config sem apagar o resto do documento (merge).
export async function saveConfig(uid, data) {
  await setDoc(userDocRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ---------------------------------------------------------------------------
// REGISTROS DIÁRIOS  (users/{uid}/entries/{YYYY-MM-DD})
// ---------------------------------------------------------------------------
export async function saveEntry(uid, entry) {
  const ref = entryDocRef(uid, entry.date);
  const existing = await getDoc(ref);
  const payload = {
    ...entry,
    updatedAt: serverTimestamp(),
    createdAt: existing.exists() ? existing.data().createdAt || serverTimestamp() : serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

export async function loadEntries(uid) {
  const snap = await getDocs(entriesColRef(uid));
  const map = {};
  snap.forEach((d) => { map[d.id] = { date: d.id, ...d.data() }; });
  return map;
}

export async function loadEntry(uid, date) {
  const snap = await getDoc(entryDocRef(uid, date));
  return snap.exists() ? { date, ...snap.data() } : null;
}

// --- Listeners em TEMPO REAL (o coração da sincronização multi-dispositivo) --
// Um registro salvo no celular chega sozinho no PC via onSnapshot.
// `meta` traz { fromCache, hasPendingWrites } — usado no indicador de sync.
export function watchConfig(uid, cb) {
  return onSnapshot(userDocRef(uid), (snap) =>
    cb(snap.exists() ? snap.data() : null, snap.metadata)
  );
}
export function watchEntries(uid, cb) {
  return onSnapshot(entriesColRef(uid), (snap) => {
    const map = {};
    snap.forEach((d) => { map[d.id] = { date: d.id, ...d.data() }; });
    cb(map, snap.metadata);
  });
}

export async function deleteEntry(uid, date) {
  await deleteDoc(entryDocRef(uid, date));
}

// ---------------------------------------------------------------------------
// FOTOS  (Storage users/{uid}/photos/{data}/{arquivo})
// As fotos são COMPRIMIDAS no navegador antes de subir (canvas → JPEG).
// ---------------------------------------------------------------------------

// Redimensiona pra no máx. `maxSide` px no lado maior e exporta JPEG `quality`.
// Retorna um Blob pronto pra upload. (Requisito técnico: ~1280px, JPEG ~0.7.)
export function compressImage(file, maxSide = 1280, quality = 0.7) {
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
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao comprimir'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

// Comprime + envia UMA foto. Retorna { url, path } pra salvar na entrada.
export async function uploadPhoto(uid, date, file) {
  const blob = await compressImage(file);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = `users/${uid}/photos/${date}/${name}`;
  const r = ref(storage, path);
  await uploadBytes(r, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(r);
  return { url, path };
}

export async function deletePhoto(path) {
  try { await deleteObject(ref(storage, path)); }
  catch (e) { console.warn('[storage] não removeu a foto (pode já não existir):', e); }
}

// ---------------------------------------------------------------------------
// EXPORT / IMPORT  (backup extra em JSON, além da nuvem)
// Fotos NÃO são embutidas no JSON (só as URLs) — mantém o arquivo leve, como
// pede o requisito. As imagens continuam guardadas no Firebase Storage.
// ---------------------------------------------------------------------------
export async function exportAll(uid) {
  const [config, entries] = await Promise.all([loadConfig(uid), loadEntries(uid)]);
  return {
    app: 'diario-de-cultivo',
    version: 1,
    exportedAt: new Date().toISOString(),
    note: 'Fotos não são embutidas neste backup (apenas as URLs). As imagens seguem no Firebase Storage.',
    config: config || null,
    entries: Object.values(entries),
  };
}

// Restaura config + entradas de um objeto exportado. Usa batch pra escrever tudo.
export async function importAll(uid, data) {
  if (!data || data.app !== 'diario-de-cultivo') throw new Error('Arquivo de backup inválido.');
  if (data.config) await saveConfig(uid, stripTimestamps(data.config));

  const entries = Array.isArray(data.entries) ? data.entries : [];
  // Firestore aceita até 500 operações por batch; dividimos por segurança.
  for (let i = 0; i < entries.length; i += 400) {
    const batch = writeBatch(db);
    for (const e of entries.slice(i, i + 400)) {
      if (!e.date) continue;
      batch.set(entryDocRef(uid, e.date), { ...stripTimestamps(e), updatedAt: serverTimestamp() }, { merge: true });
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
