// =============================================================================
// sw.js — Service Worker (PWA / app shell offline)
// -----------------------------------------------------------------------------
// Cacheia SÓ o "app shell" (HTML/CSS/JS/fontes/SDK) pra instalar no celular e
// abrir rápido mesmo com conexão ruim. Os DADOS (Firestore/Storage) NÃO passam
// por aqui — o próprio Firestore cuida do offline com IndexedDB.
// Ao mudar arquivos do app, suba o número da versão pra forçar atualização.
// =============================================================================
const VERSION = 'cultivo-v1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/app.js',
  './js/firebase-init.js',
  './js/store.js',
  './js/data.js',
  './js/phase.js',
  './js/reminders.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Domínios de terceiros que valem cachear (fontes, gráficos, SDK do Firebase).
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'www.gstatic.com'];
// Domínios de DADOS que NUNCA devem ser cacheados pelo SW (Firebase cuida deles).
const DATA_HOSTS = ['firestore.googleapis.com', 'firebasestorage.googleapis.com', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firebaseinstallations.googleapis.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // 1) Dados do Firebase: passa direto pra rede, sem cache.
  if (DATA_HOSTS.some((h) => url.hostname.endsWith(h))) return;

  // 2) CDN de shell (fontes/gráficos/SDK): stale-while-revalidate.
  if (CDN_HOSTS.some((h) => url.hostname.endsWith(h))) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 3) Mesma origem (app shell): cache-first, com fallback pra index no modo SPA.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html')))
    );
  }
});

function staleWhileRevalidate(request) {
  return caches.open(VERSION).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && res.status === 200) cache.put(request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
}
