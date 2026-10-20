const CACHE_NAME = 'laundry-time-__SW_VERSION__';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  /* __PRECACHE_ASSETS__ */
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('laundry-time-') && key !== CACHE_NAME)
        .map(key => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.includes('/@vite') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/src/') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) cache.put('./index.html', response.clone());
        return response;
      } catch {
        return (
          (await cache.match(request)) ||
          (await cache.match('./index.html')) ||
          (await cache.match('./'))
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached && url.pathname.includes('/assets/')) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      if (cached) return cached;
      throw new Error('Network unavailable and asset not cached');
    }
  })());
});
