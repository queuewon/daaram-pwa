import { describe, expect, it } from "vitest";
import { generateId, type RecipeId } from "./ids";

describe("generateId", () => {
  it("호출할 때마다 서로 다른 값을 반환한다", () => {
    const a = generateId<"RecipeId">();
    const b = generateId<"RecipeId">();

    expect(a).not.toBe(b);
  });

  it("빈 문자열이 아닌 값을 반환한다", () => {
    const id: RecipeId = generateId<"RecipeId">();

    expect(id.length).toBeGreaterThan(0);
  });
});
