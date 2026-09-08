/*
 * Jorsas Tech service worker.
 *
 * Deliberately conservative so it can never serve a live SaaS user stale data:
 *   - Only GET requests are considered. Everything else passes straight through.
 *   - API and proxied backend paths (/api, /storage, /contact/send) are NEVER
 *     cached and NEVER intercepted. Token auth and fresh data always hit network.
 *   - Navigations are network first: the network answer wins whenever the user
 *     is online, and the cache only steps in when the network fails (offline),
 *     falling back to a branded offline page if nothing is cached yet.
 *   - Content hashed build assets (/_next/static and self hosted fonts) are
 *     cache first (stale while revalidate) because their URL changes on every
 *     deploy, so a cached copy can never be wrong.
 *   - Cross origin requests (fonts.gstatic proxies, 8x8 live classes, Unsplash)
 *     are left untouched.
 *
 * skipWaiting + clients.claim mean a freshly deployed worker takes control on
 * the next load, so combined with network first navigation nobody gets stuck on
 * an old shell.
 */

const VERSION = "v1";
const RUNTIME_CACHE = "jorsas-runtime-" + VERSION;
const OFFLINE_URL = "/offline.html";

// Precache only the offline fallback so an offline navigation always has
// something to show. Everything else is cached on demand at runtime.
const PRECACHE_URLS = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("jorsas-runtime-") && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allow the page to prompt an updated worker to take over immediately.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|webp|avif|svg|ico)$/.test(url.pathname);
}

function isBackendPath(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/storage/") ||
    url.pathname === "/contact/send"
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only ever touch GET. POST and friends must reach the network untouched.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  // Leave cross origin and backend traffic completely alone.
  if (url.origin !== self.location.origin) return;
  if (isBackendPath(url)) return;

  // Full page navigations: network first, offline fallback second.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Build assets: serve from cache instantly, refresh in the background.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.status === 200) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Everything else (RSC payloads, data requests): plain network, no caching,
  // so nothing here can ever go stale.
});
