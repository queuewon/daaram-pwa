import { describe, expect, it } from "vitest";
import { createGateToken, timingSafeEqual, verifyGateToken } from "./gate";

describe("timingSafeEqual", () => {
  it("같은 문자열이면 true", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
  });

  it("길이가 같고 내용이 다르면 false", () => {
    expect(timingSafeEqual("abc", "abd")).toBe(false);
  });

  it("길이가 다르면 false", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("createGateToken / verifyGateToken", () => {
  const secret = "correct-horse-battery-staple";

  it("발급 직후 같은 secret과 만료 전 시각으로 검증하면 통과한다", async () => {
    const now = new Date("2026-07-11T00:00:00Z");
    const token = await createGateToken(secret, now, 60);

    const result = await verifyGateToken(token, secret, now);

    expect(result).toEqual({ ok: true });
  });

  it("exp가 지난 시각으로 검증하면 expired", async () => {
    const now = new Date("2026-07-11T00:00:00Z");
    const token = await createGateToken(secret, now, -10);

    const result = await verifyGateToken(token, secret, now);

    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("다른 secret으로 검증하면 bad-signature", async () => {
    const now = new Date("2026-07-11T00:00:00Z");
    const token = await createGateToken(secret, now, 60);

    const result = await verifyGateToken(token, "wrong-secret", now);

    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("서명 부분이 변조되면 bad-signature", async () => {
    const now = new Date("2026-07-11T00:00:00Z");
    const token = await createGateToken(secret, now, 60);
    const [payload, signature] = token.split(".");
    const tampered = `${payload}.${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`;

    const result = await verifyGateToken(tampered, secret, now);

    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("형식이 다른 문자열이면 malformed", async () => {
    const now = new Date("2026-07-11T00:00:00Z");

    const result = await verifyGateToken("not-a-token", secret, now);

    expect(result).toEqual({ ok: false, reason: "malformed" });
  });
});
