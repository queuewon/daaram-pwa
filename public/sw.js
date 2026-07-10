// CACHE_VERSION을 배포마다 올려서 구버전 캐시를 강제 무효화한다 (F7: 구버전 앱 갇힘 방지)
const CACHE_VERSION = "v1";
const CACHE_NAME = `app-shell-${CACHE_VERSION}`;
const APP_SHELL_URLS = ["/", "/manifest.json", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isAppShellRequest =
    event.request.method === "GET" &&
    url.origin === self.location.origin &&
    APP_SHELL_URLS.includes(url.pathname);

  if (!isAppShellRequest) {
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});
