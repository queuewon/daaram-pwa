import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";
import { hashPassword } from "./lib/infra/gate";

const ORIGINAL_ENV = process.env.GATE_PASSWORD;

beforeEach(() => {
  process.env.GATE_PASSWORD = "correct-horse-battery-staple";
});

afterEach(() => {
  process.env.GATE_PASSWORD = ORIGINAL_ENV;
});

describe("proxy (게이트)", () => {
  it("유효한 게이트 쿠키가 있으면 통과시킨다", async () => {
    const hashed = await hashPassword("correct-horse-battery-staple");
    const req = new NextRequest("https://example.com/", {
      headers: { cookie: `gate_session=${hashed}` },
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

  it("잘못된 쿠키 값이면 /gate로 리다이렉트한다", async () => {
    const req = new NextRequest("https://example.com/", {
      headers: { cookie: "gate_session=wrong-hash" },
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
});
