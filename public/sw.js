// CACHE_VERSION을 배포마다 올려서 구버전 캐시를 강제 무효화한다 (F7: 구버전 앱 갇힘 방지)
const CACHE_VERSION = "v4";
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

// Next.js 빌드 청크는 파일명에 콘텐츠 해시가 박혀 있어 내용이 바뀌면 경로 자체가 바뀐다.
// 그래서 미리 목록을 알 수 없고, 버전 걱정 없이 최초 요청 시점에 캐시해도 안전하다(불변 자원).
function isBuildAsset(pathname) {
  return pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOriginGet = event.request.method === "GET" && url.origin === self.location.origin;

  if (!isSameOriginGet) return;

  const isPrecachedShellAsset = APP_SHELL_URLS.includes(url.pathname);

  if (isPrecachedShellAsset) {
    event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
    return;
  }

  if (isBuildAsset(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }),
    );
  }
});
