const CACHE = 'mates-app-v5';
const FILES = ['./', './index.html', './src/app.js', './src/style.css', './src/logic.js', './src/marketplace.js', './src/data.js', './src/ui.js', './src/photos.js', './src/community.js', './src/community-logic.js', './src/community-data.js', './src/community.css', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './assets/people/person-12.jpg', './assets/people/person-13.jpg', './assets/people/person-14.jpg'];
const urls = new Set(FILES.map(file => new URL(file, self.location).href));
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mates-app-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !urls.has(event.request.url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      throw error;
    }
  })());
});
