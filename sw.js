// Guarda la app para que funcione sin internet. Primero intenta la red (para recibir actualizaciones) y si no hay, usa lo guardado.
// Solo se ocupa de archivos de la propia app y solo guarda respuestas correctas.
const CACHE = 'libreta-v6';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './fonts/bricolage.woff2', './fonts/publicsans.woff2', './fonts/jetbrainsmono.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate';
  const key = isPage ? new URL('./index.html', self.registration.scope).href : url.origin + url.pathname;
  e.respondWith((async () => {
    try {
      const r = await fetch(req);
      if (r.ok && r.type === 'basic') {
        const copy = r.clone();
        e.waitUntil(caches.open(CACHE).then(c => c.put(key, copy)));
        return r;
      }
      const cached = await caches.match(key);
      return cached || r;
    } catch (err) {
      const cached = await caches.match(key);
      return cached || Response.error();
    }
  })());
});
