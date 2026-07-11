import { describe, expect, it } from "vitest";
import { ingredientFormInputSchema } from "./ingredientForm.schema";
import type { SupplierId } from "./ids";

function validInput() {
  return {
    name: "우유",
    supplierId: null as SupplierId | null,
    packagePrice: 1000,
    packageAmount: 500,
    stockCount: 10,
    stockUnit: "개",
  };
}

describe("ingredientFormInputSchema — happy path", () => {
  it("정상 입력을 통과시킨다", () => {
    expect(ingredientFormInputSchema.safeParse(validInput()).success).toBe(true);
  });

  it("supplierId가 문자열이어도 통과한다", () => {
    const result = ingredientFormInputSchema.safeParse({
      ...validInput(),
      supplierId: "supplier-1" as SupplierId,
    });

    expect(result.success).toBe(true);
  });
});

describe("ingredientFormInputSchema — 검증 실패", () => {
  it("name이 빈 문자열이면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), name: "" }).success).toBe(false);
  });

  it("packagePrice가 음수면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), packagePrice: -1 }).success).toBe(
      false,
    );
  });

  it("packageAmount가 0이면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), packageAmount: 0 }).success).toBe(
      false,
    );
  });

  it("stockCount가 음수면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), stockCount: -1 }).success).toBe(
      false,
    );
  });

  it("stockUnit이 빈 문자열이면 거부한다", () => {
    expect(ingredientFormInputSchema.safeParse({ ...validInput(), stockUnit: "" }).success).toBe(
      false,
    );
  });
});
