"use client";

import { useEffect } from "react";

/**
 * 서비스워커를 등록하지 않고, 과거에 설치된 워커와 캐시를 정리한다. [F7]
 * 이 앱은 오프라인이 원래 불가하고 데이터가 IndexedDB에 있어 SW의 실익이 없어 걷어냈다.
 * public/sw.js(자폭 스크립트)가 주 정리 경로이고, 여기서는 페이지가 뜨는 클라이언트를 위한
 * 이중 안전장치로 기존 등록 해제 + Cache Storage 삭제만 수행한다. (IndexedDB는 건드리지 않음.)
 */
export function ServiceWorkerCleanup(): null {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        );
    }
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }, []);

  return null;
}
