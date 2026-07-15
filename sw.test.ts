import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// public/sw.js는 순수 JS(classic worker)라 앱 번들에서 import되지 않는다.
// 여기서는 SW 전역(self/caches/fetch)을 모킹해 install/activate 동작을 직접 검증한다. [F7]
const swSource = readFileSync(fileURLToPath(new URL("./public/sw.js", import.meta.url)), "utf8");

interface CacheObj {
  name: string;
  addAllArgs: string[][];
  addAll(urls: string[]): Promise<void>;
  match(): Promise<undefined>;
  put(): Promise<void>;
}

interface CachesMock {
  open(name: string): Promise<CacheObj>;
  keys(): Promise<string[]>;
  delete(name: string): Promise<boolean>;
  match(): Promise<undefined>;
}

interface SwEvent {
  waitUntil(p: Promise<unknown>): void;
}
type Handler = (event: SwEvent) => void;

interface SwGlobal {
  addEventListener(type: string, handler: Handler): void;
  skipWaiting(): void;
  clients: { claim(): Promise<void> };
  location: { origin: string };
}

interface LoadedSw {
  handlers: Record<string, Handler>;
  cachesMock: CachesMock;
  cacheNames(): string[];
  deleted(): string[];
  /** install 시 addAll에 넘어간 모든 URL(모든 캐시 합산). */
  precachedUrls(): string[];
}

/**
 * sw.js를 모킹된 SW 전역에서 실행한다.
 * redirecting: 이 경로들을 프리캐시하면 실제 브라우저처럼 addAll이 TypeError로 거부한다.
 */
function loadServiceWorker(redirecting: Set<string>, initialCacheNames: string[] = []): LoadedSw {
  const handlers: Record<string, Handler> = {};
  const store = new Map<string, CacheObj>();
  const deletedNames: string[] = [];

  function makeCache(name: string): CacheObj {
    const addAllArgs: string[][] = [];
    return {
      name,
      addAllArgs,
      async addAll(urls) {
        addAllArgs.push([...urls]);
        for (const url of urls) {
          if (redirecting.has(url)) {
            throw new TypeError(`Cache.addAll(): '${url}' 응답이 리다이렉트됨`);
          }
        }
      },
      async match() {
        return undefined;
      },
      async put() {},
    };
  }

  for (const name of initialCacheNames) store.set(name, makeCache(name));

  const cachesMock: CachesMock = {
    async open(name) {
      if (!store.has(name)) store.set(name, makeCache(name));
      return store.get(name) as CacheObj;
    },
    async keys() {
      return [...store.keys()];
    },
    async delete(name) {
      deletedNames.push(name);
      return store.delete(name);
    },
    async match() {
      return undefined;
    },
  };

  const selfMock: SwGlobal = {
    addEventListener(type, handler) {
      handlers[type] = handler;
    },
    skipWaiting() {},
    clients: { async claim() {} },
    location: { origin: "https://daaram-pwa.vercel.app" },
  };

  const fetchMock = async (): Promise<unknown> => ({ ok: true, clone: () => ({}) });

  const factory = new Function("self", "caches", "fetch", "URL", swSource) as (
    self: SwGlobal,
    caches: CachesMock,
    fetch: () => Promise<unknown>,
    url: typeof globalThis.URL,
  ) => void;
  factory(selfMock, cachesMock, fetchMock, URL);

  return {
    handlers,
    cachesMock,
    cacheNames: () => [...store.keys()],
    deleted: () => deletedNames,
    precachedUrls: () => [...store.values()].flatMap((c) => c.addAllArgs).flat(),
  };
}

describe("service worker install", () => {
  it("리다이렉트되는 경로를 프리캐시하지 않아 install이 성공한다", async () => {
    const sw = loadServiceWorker(new Set(["/"]));
    let waited: Promise<unknown> | undefined;
    sw.handlers.install({ waitUntil: (p) => (waited = p) });

    await expect(waited).resolves.toBeUndefined();
  });

  it("프리캐시 목록에 리다이렉트되는 '/'가 없고 정적 자원만 담는다", async () => {
    const sw = loadServiceWorker(new Set(["/"]));
    let waited: Promise<unknown> | undefined;
    sw.handlers.install({ waitUntil: (p) => (waited = p) });
    await waited;

    const urls = sw.precachedUrls();
    expect(urls).toContain("/manifest.json");
    expect(urls).toContain("/icons/icon.svg");
    expect(urls).not.toContain("/");
  });

  it("[하네스 자체 검증] '/'를 프리캐시하면 addAll이 실제로 거부한다", async () => {
    const sw = loadServiceWorker(new Set(["/"]));
    const cache = await sw.cachesMock.open("probe");

    await expect(cache.addAll(["/"])).rejects.toBeInstanceOf(TypeError);
    await expect(cache.addAll(["/manifest.json"])).resolves.toBeUndefined();
  });
});

describe("service worker activate", () => {
  it("현재 버전이 아닌 구버전 캐시를 삭제하고 현재 캐시는 남긴다", async () => {
    const sw = loadServiceWorker(new Set(["/"]), ["app-shell-v4", "app-shell-v5"]);
    let waited: Promise<unknown> | undefined;
    sw.handlers.activate({ waitUntil: (p) => (waited = p) });
    await waited;

    expect(sw.deleted()).toContain("app-shell-v4");
    expect(sw.cacheNames()).toContain("app-shell-v5");
    expect(sw.cacheNames()).not.toContain("app-shell-v4");
  });
});

describe("service worker 캐시 버전", () => {
  it("배포 시 구캐시 무효화가 트리거되도록 CACHE_VERSION이 v5다", () => {
    expect(swSource).toContain('CACHE_VERSION = "v5"');
  });
});
