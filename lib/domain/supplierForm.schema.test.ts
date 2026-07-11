import { describe, expect, it } from "vitest";
import { supplierFormInputSchema } from "./supplierForm.schema";

function validInput() {
  return { name: "동네유업", contact: "010-1234-5678", memo: "매주 화요일 배송" };
}

describe("supplierFormInputSchema — happy path", () => {
  it("정상 입력을 통과시킨다", () => {
    expect(supplierFormInputSchema.safeParse(validInput()).success).toBe(true);
  });

  it("contact/memo가 빈 문자열이어도 통과한다", () => {
    const result = supplierFormInputSchema.safeParse({ ...validInput(), contact: "", memo: "" });

    expect(result.success).toBe(true);
  });
});

describe("supplierFormInputSchema — 검증 실패", () => {
  it("name이 빈 문자열이면 거부한다", () => {
    expect(supplierFormInputSchema.safeParse({ ...validInput(), name: "" }).success).toBe(false);
  });
});
