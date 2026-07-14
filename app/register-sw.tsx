"use client";

import { useEffect } from "react";

export function RegisterServiceWorker(): null {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // 개발 모드에서는 서비스워커를 등록하지 않는다.
    // 이미 설치된 워커가 남아 있으면 오래된 캐시(특히 cache-first로 잡히는 "/" HTML)가
    // 코드 변경을 가려버려 디버깅을 방해하므로, 기존 등록을 해제해 캐시 충돌을 원천 차단한다.
    // 오프라인 캐싱은 프로덕션 빌드에서만 동작한다. [F7]
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        );
      return;
    }

    navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}
