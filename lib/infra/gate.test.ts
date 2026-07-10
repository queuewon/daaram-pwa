import { describe, expect, it } from "vitest";
import { hashPassword } from "./gate";

describe("hashPassword", () => {
  it("같은 입력에 대해 같은 해시를 반환한다", async () => {
    const a = await hashPassword("abc");
    const b = await hashPassword("abc");
    expect(a).toBe(b);
  });

  it("다른 입력에 대해 다른 해시를 반환한다", async () => {
    const a = await hashPassword("abc");
    const b = await hashPassword("xyz");
    expect(a).not.toBe(b);
  });
});
