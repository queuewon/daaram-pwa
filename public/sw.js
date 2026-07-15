// 자폭(self-destruct) 서비스워커. [F7]
// 이 앱은 게이트가 네트워크로 돌아 오프라인이 원래 불가하고, 데이터는 브라우저 로컬 DB에 있어
// 서비스워커의 실익이 없다. 과거에 설치된 SW를 안전하게 걷어내기 위해 fetch 핸들러 없이
// 스스로 등록을 해제하고 Cache Storage를 비운다. (레시피·재료 데이터는 절대 건드리지 않는다.)
// register-sw.tsx가 더 이상 SW를 등록하지 않으므로, 이 스크립트는 기존 설치분 정리 용도다.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Cache Storage 전부 삭제 (브라우저 로컬 DB는 손대지 않음)
      for (const key of await caches.keys()) await caches.delete(key);
      // 자기 등록 해제 → 이후 요청은 전부 네트워크로
      await self.registration.unregister();
      // 현재 열려 있는 탭을 새로고침해 컨트롤러(SW) 없이 다시 로드
      for (const client of await self.clients.matchAll({ type: "window" })) {
        client.navigate(client.url);
      }
    })(),
  );
});
