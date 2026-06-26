const APP_CACHE = "household-assistant-shell-v18";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./version.json",
  "./CHANGELOG.md",
  "./ALPHA_INSTALL.md",
  "./GITHUB_PAGES_DEPLOY.md",
  "./SUPABASE_SYNC_SETUP.md",
  "./README.md",
  "./.nojekyll",
  "./js/app.js",
  "./js/core/auth.js",
  "./js/core/constants.js",
  "./js/core/dom.js",
  "./js/core/format.js",
  "./js/core/icons.js",
  "./js/core/notifications.js",
  "./js/core/store.js",
  "./js/core/sync.js",
  "./js/core/updates.js",
  "./js/modules/calculations.js",
  "./js/modules/dashboard.js",
  "./js/modules/hubs.js",
  "./js/modules/debts.js",
  "./js/modules/savings.js",
  "./js/modules/settings.js",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/badge-96.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== APP_CACHE).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const route = event.notification.data?.route || "dashboard";
      const targetUrl = new URL(`./index.html#${route}`, self.registration.scope).href;
      const existing = clientList.find((client) => client.url.startsWith(self.registration.scope));
      if (existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});
