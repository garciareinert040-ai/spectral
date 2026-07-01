// =============================================================================
// firebase-init.js — Inicialização do Firebase (config + SDK modular via CDN)
// -----------------------------------------------------------------------------
// TUDO que fala com a nuvem começa aqui. O SDK é carregado por CDN (ESM), então
// não há build/npm — é só HTML estático + Firebase.
//
//  >>>>>>>>>>>>>>>>>>>>>>>>  PASSO OBRIGATÓRIO  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
//  Cole as chaves do SEU projeto Firebase em `firebaseConfig` abaixo.
//  (Console do Firebase → engrenagem ⚙ → "Configurações do projeto" →
//   seção "Seus apps" → app da Web → objeto firebaseConfig.)
//  Veja o README para o passo a passo completo.
//  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// =============================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// ┌──────────────────────────────────────────────────────────────────────────┐
// │  COLE AQUI a configuração do seu projeto Firebase (plano Spark / grátis):  │
// └──────────────────────────────────────────────────────────────────────────┘
const firebaseConfig = {
  apiKey: "AIzaSyC3FEgY_TCf1x4F0OSmrLnvfbKEkSoE2vI",
  authDomain: "autoflower-pineapple-express.firebaseapp.com",
  projectId: "autoflower-pineapple-express",
  storageBucket: "autoflower-pineapple-express.firebasestorage.app",
  messagingSenderId: "611224860939",
  appId: "1:611224860939:web:f3054b62a8d1797d008a0e"
};

// Detecta se a config ainda é o placeholder — o app mostra um aviso amigável
// em vez de quebrar com erro do Firebase.
export const configPending = Object.values(firebaseConfig).some(
  (v) => typeof v === 'string' && v.includes('COLE_AQUI')
);

let app, auth, db, storage;

if (!configPending) {
  app = initializeApp(firebaseConfig);

  // --- Auth: sessão persistente (não pedir login toda vez) -------------------
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch((e) =>
    console.warn('[firebase] persistência de auth:', e)
  );

  // --- Firestore com CACHE OFFLINE (IndexedDB, multi-abas) --------------------
  // Assim o app continua funcionando sem internet e sincroniza ao voltar.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  // --- Storage: fotos comprimidas ------------------------------------------
  storage = getStorage(app);
}

export { app, auth, db, storage };
