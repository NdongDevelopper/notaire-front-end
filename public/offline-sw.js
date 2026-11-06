/* Easy Notaire - Offline First Service Worker
 *
 * This worker deliberately handles only the application shell and same-origin
 * static resources. API/data caching remains in IndexedDB (apiCache.ts), where
 * cache entries can be scoped to the authenticated user.
 *
 * Why a custom worker?
 * - Vite dev-server SPA navigations normally require the network after refresh.
 * - Browser "Offline" must still be able to resolve /dashboard/* to index.html.
 * - The worker is intentionally independent from vite-plugin-pwa so dev and
 *   production use the same navigation strategy.
 */

const VERSION = 'easy-notaire-shell-v4';
const SHELL_CACHE = VERSION;
const LEGACY_CACHES = [
  'easy-notaire-shell-v3',
  'easy-notaire-shell-v2',
  'easy-notaire-shell-v1',
  'easy-notaire-assets-v3',
  'easy-notaire-assets-v2',
  'easy-notaire-assets-v1',
  'workbox-precache',
  'api-cache',
  'api-cache-dev',
];

const isSameOrigin = (url) => url.origin === self.location.origin;
const isApiRequest = (url) => url.pathname.startsWith('/api/');
const isDevInternal = (url) =>
  url.pathname.startsWith('/@vite/') ||
  url.pathname.startsWith('/@react-refresh') ||
  url.pathname.startsWith('/node_modules/.vite/');

async function putSafe(cache, request, response) {
  if (!response || !response.ok) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    // A cache failure must never break the application.
  }
}

async function cacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(new Request('/index.html', {
      cache: 'no-store',
      credentials: 'same-origin',
    }));
    await putSafe(cache, new Request('/index.html'), response);
  } catch {
    // The page that registered the worker may already be enough to populate
    // the cache through the fetch handler below.
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(cacheShell());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name !== SHELL_CACHE && (
            LEGACY_CACHES.includes(name) ||
            name.startsWith('easy-notaire-shell-') ||
            name.startsWith('easy-notaire-assets-')
          ))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never let the shell worker replace API requests. IndexedDB API caching is
  // handled by Axios so it can remain scoped to the authenticated user.
  if (!isSameOrigin(url) || isApiRequest(url)) return;

  // SPA navigation: network first while online, cached index.html offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);

        try {
          const response = await fetch(request);
          if (response.ok) {
            // Keep the latest HTML available for the next offline session.
            await putSafe(cache, new Request('/index.html'), response);
          }
          return response;
        } catch {
          const cached = await cache.match('/index.html');
          if (cached) return cached;

          // Last chance: an exact cached navigation may exist from a previous
          // version or browser navigation.
          const exact = await cache.match(request);
          if (exact) return exact;

          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Easy Notaire hors ligne</title><body><h1>Easy Notaire</h1><p>Cette page n’a pas encore été ouverte en ligne sur cet appareil.</p></body>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
        }
      })(),
    );
    return;
  }

  // Same-origin application resources: network first, cache fallback.
  // This is important in Vite development because transformed TS/JS modules
  // are requested individually after index.html.
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    isDevInternal(url) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const response = await fetch(request);
          if (response.ok) await putSafe(cache, request, response);
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw new Error('Offline resource unavailable');
        }
      })(),
    );
  }
});
