import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GATE_COOKIE_NAME,
  GATE_COOKIE_TTL_SECONDS,
  GATE_FAILURE_DELAY_MS,
  verifyGateToken,
} from "../../../lib/infra/gate";
import { POST } from "./route";

const ORIGINAL_ENV = process.env.GATE_PASSWORD;
const SECRET = "correct-horse-battery-staple";

function makeRequest(body: unknown): Request {
  return new Request("https://example.com/api/gate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.GATE_PASSWORD = SECRET;
});

afterEach(() => {
  process.env.GATE_PASSWORD = ORIGINAL_ENV;
  vi.useRealTimers();
});

describe("POST /api/gate", () => {
  it("올바른 비밀번호면 200과 검증 가능한 서명 쿠키를 발급한다", async () => {
    const response = await POST(makeRequest({ password: SECRET }));

    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`Max-Age=${GATE_COOKIE_TTL_SECONDS}`);

    const tokenMatch = setCookie.match(new RegExp(`${GATE_COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch?.[1];
    expect(token).toBeDefined();
    const result = await verifyGateToken(token as string, SECRET, new Date());
    expect(result.ok).toBe(true);
  });

  it("틀린 비밀번호면 401이고 지연 후 응답하며 쿠키를 발급하지 않는다", async () => {
    vi.useFakeTimers();
    const promise = POST(makeRequest({ password: "wrong" }));
    await vi.advanceTimersByTimeAsync(GATE_FAILURE_DELAY_MS);
    const response = await promise;

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("GATE_PASSWORD가 설정되지 않으면 401이다", async () => {
    process.env.GATE_PASSWORD = "";
    vi.useFakeTimers();
    const promise = POST(makeRequest({ password: SECRET }));
    await vi.advanceTimersByTimeAsync(GATE_FAILURE_DELAY_MS);
    const response = await promise;

    expect(response.status).toBe(401);
  });

  it("password 필드가 비어있으면 401이다", async () => {
    vi.useFakeTimers();
    const promise = POST(makeRequest({ password: "" }));
    await vi.advanceTimersByTimeAsync(GATE_FAILURE_DELAY_MS);
    const response = await promise;

    expect(response.status).toBe(401);
  });
});
