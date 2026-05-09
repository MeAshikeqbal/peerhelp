/**
 * PeerHelp Service Worker
 *
 * Strategy:
 *  - App-shell offline only: never caches authenticated API responses
 *    to prevent cross-user data leaks with Supabase cookie-based auth.
 *  - Navigation: network-first → /offline fallback
 *  - _next/static + /font/*: cache-first (immutable)
 *  - /api/*, /auth/*: network-only (no cache)
 *  - Push notifications: show notification + focus/open URL on click
 *
 * Bump CACHE_VERSION on each deploy to bust stale caches.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `peerhelp-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `peerhelp-static-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/api/pwa/icon-192",
  "/api/pwa/icon-512",
];

// ─── Install ─────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith("peerhelp-shell-") ||
                  key.startsWith("peerhelp-static-")) &&
                key !== SHELL_CACHE &&
                key !== STATIC_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // NEVER cache auth or API responses — prevents cross-user Supabase leaks
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    request.headers.has("Authorization")
  ) {
    return;
  }

  // Cache-first for immutable static assets
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/font/")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Network-first for navigations → /offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .open(SHELL_CACHE)
          .then((cache) => cache.match("/offline"))
          .then((cached) => cached || new Response("Offline", { status: 503 }))
      )
    );
    return;
  }
});

// ─── Push ─────────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "PeerHelp", body: event.data.text(), url: "/dashboard" };
  }

  const { title = "PeerHelp", body = "", url = "/dashboard", icon } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? "/api/pwa/icon-192",
      badge: "/api/pwa/icon-192",
      data: { url },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";
  const targetFullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Prefer an already-open tab whose URL starts with the target
        // (handles cases where targetUrl has query params / hash).
        for (const client of clientList) {
          if (client.url.startsWith(new URL(targetUrl, self.location.origin).origin) &&
            new URL(client.url).pathname === new URL(targetUrl, self.location.origin).pathname &&
            "focus" in client
          ) {
            client.navigate(targetFullUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetFullUrl);
      })
  );
});
