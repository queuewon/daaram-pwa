import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

// public/sw.js는 순수 JS(classic worker)라 앱 번들에서 import되지 않는다.
// SW 전역(self/caches/fetch)을 모킹해 "자폭(self-unregister)" 동작을 직접 검증한다. [F7]
const swSource = readFileSync(fileURLToPath(new URL("./public/sw.js", import.meta.url)), "utf8");

interface SwEvent {
  waitUntil(p: Promise<unknown>): void;
}
type Handler = (event: SwEvent) => void;

interface ClientMock {
  url: string;
  navigate: (url: string) => void;
}

function loadServiceWorker(initialCacheNames: string[] = [], clients: ClientMock[] = []) {
  const handlers: Record<string, Handler> = {};
  const cacheNames = new Set(initialCacheNames);
  const deletedNames: string[] = [];

  const cachesMock = {
    async keys() {
      return [...cacheNames];
    },
    async delete(name: string) {
      deletedNames.push(name);
      return cacheNames.delete(name);
    },
    async open() {
      return { async addAll() {}, async match() {}, async put() {} };
    },
    async match() {
      return undefined;
    },
  };

  const selfMock = {
    addEventListener(type: string, handler: Handler) {
      handlers[type] = handler;
    },
    skipWaiting: vi.fn(),
    registration: { unregister: vi.fn(async () => {}) },
    clients: {
      async matchAll() {
        return clients;
      },
      async claim() {},
    },
    location: { origin: "https://daaram-pwa.vercel.app" },
  };

  const fetchMock = async (): Promise<unknown> => ({ ok: true, clone: () => ({}) });

  const factory = new Function("self", "caches", "fetch", "URL", swSource) as (
    self: typeof selfMock,
    caches: typeof cachesMock,
    fetch: () => Promise<unknown>,
    url: typeof globalThis.URL,
  ) => void;
  factory(selfMock, cachesMock, fetchMock, URL);

  return {
    handlers,
    self: selfMock,
    remainingCaches: () => [...cacheNames],
    deleted: () => deletedNames,
  };
}

describe("service worker 자폭 — 더 이상 가로채지 않음", () => {
  it("fetch 핸들러를 등록하지 않는다", () => {
    const sw = loadServiceWorker();
    expect(sw.handlers.fetch).toBeUndefined();
  });

  it("install은 skipWaiting으로 즉시 활성화한다", () => {
    const sw = loadServiceWorker();
    sw.handlers.install({ waitUntil: () => {} });
    expect(sw.self.skipWaiting).toHaveBeenCalled();
  });
});

describe("service worker 자폭 — activate 정리", () => {
  it("모든 캐시를 삭제한다", async () => {
    const sw = loadServiceWorker(["app-shell-v5", "app-shell-v4"]);
    let waited: Promise<unknown> | undefined;
    sw.handlers.activate({ waitUntil: (p) => (waited = p) });
    await waited;

    expect(sw.remainingCaches()).toHaveLength(0);
    expect(sw.deleted()).toEqual(expect.arrayContaining(["app-shell-v5", "app-shell-v4"]));
  });

  it("자기 자신의 등록을 해제한다", async () => {
    const sw = loadServiceWorker();
    let waited: Promise<unknown> | undefined;
    sw.handlers.activate({ waitUntil: (p) => (waited = p) });
    await waited;

    expect(sw.self.registration.unregister).toHaveBeenCalled();
  });

  it("열린 window 클라이언트를 재로드한다", async () => {
    const navigate = vi.fn();
    const sw = loadServiceWorker([], [{ url: "https://daaram-pwa.vercel.app/", navigate }]);
    let waited: Promise<unknown> | undefined;
    sw.handlers.activate({ waitUntil: (p) => (waited = p) });
    await waited;

    expect(navigate).toHaveBeenCalledWith("https://daaram-pwa.vercel.app/");
  });
});

describe("service worker 자폭 — 데이터 안전", () => {
  it("Cache Storage만 건드리고 IndexedDB는 절대 접근하지 않는다", () => {
    expect(swSource.toLowerCase()).not.toContain("indexeddb");
  });
});
