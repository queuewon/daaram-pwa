import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { createGateToken, GATE_COOKIE_NAME } from "./lib/infra/gate";

const ORIGINAL_ENV = process.env.GATE_PASSWORD;
const SECRET = "correct-horse-battery-staple";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

beforeEach(() => {
  process.env.GATE_PASSWORD = SECRET;
});

afterEach(() => {
  process.env.GATE_PASSWORD = ORIGINAL_ENV;
});

describe("proxy (게이트)", () => {
  it("유효한 서명+미만료 토큰 쿠키가 있으면 통과시킨다", async () => {
    const token = await createGateToken(SECRET, new Date(), THIRTY_DAYS_SECONDS);
    const req = new NextRequest("https://example.com/", {
      headers: { cookie: `${GATE_COOKIE_NAME}=${token}` },
    });

    const res = await proxy(req);

    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("쿠키가 없으면 /gate로 리다이렉트한다", async () => {
    const req = new NextRequest("https://example.com/");

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/gate");
  });

  it("형식이 깨지거나 위조된 쿠키 값이면 /gate로 리다이렉트한다", async () => {
    const token = await createGateToken(SECRET, new Date(), THIRTY_DAYS_SECONDS);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    const req = new NextRequest("https://example.com/", {
      headers: { cookie: `${GATE_COOKIE_NAME}=${tampered}` },
    });

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/gate");
  });

  it("만료된 토큰 쿠키면 /gate로 리다이렉트한다", async () => {
    const token = await createGateToken(SECRET, new Date(), -10);
    const req = new NextRequest("https://example.com/", {
      headers: { cookie: `${GATE_COOKIE_NAME}=${token}` },
    });

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/gate");
  });

  it("/gate 경로 자체는 쿠키 없이도 통과시킨다", async () => {
    const req = new NextRequest("https://example.com/gate");

    const res = await proxy(req);

    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("GATE_PASSWORD가 설정되지 않으면 유효해 보이는 쿠키가 있어도 통과시키지 않는다", async () => {
    const token = await createGateToken(SECRET, new Date(), THIRTY_DAYS_SECONDS);
    process.env.GATE_PASSWORD = "";
    const req = new NextRequest("https://example.com/", {
      headers: { cookie: `${GATE_COOKIE_NAME}=${token}` },
    });

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/gate");
  });
});
