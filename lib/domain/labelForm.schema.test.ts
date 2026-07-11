import { describe, expect, it } from "vitest";
import { labelFormInputSchema } from "./labelForm.schema";

function validInput() {
  return { name: "빙과류", colorHex: "#ff8800" };
}

describe("labelFormInputSchema — happy path", () => {
  it("정상 입력을 통과시킨다", () => {
    expect(labelFormInputSchema.safeParse(validInput()).success).toBe(true);
  });

  it("영문 대문자 hex도 통과한다", () => {
    expect(labelFormInputSchema.safeParse({ ...validInput(), colorHex: "#FF8800" }).success).toBe(
      true,
    );
  });
});

describe("labelFormInputSchema — 검증 실패", () => {
  it("name이 빈 문자열이면 거부한다", () => {
    expect(labelFormInputSchema.safeParse({ ...validInput(), name: "" }).success).toBe(false);
  });

  it("colorHex가 3자리 단축형이면 거부한다", () => {
    expect(labelFormInputSchema.safeParse({ ...validInput(), colorHex: "#f80" }).success).toBe(
      false,
    );
  });

  it("colorHex가 색상명이면 거부한다", () => {
    expect(labelFormInputSchema.safeParse({ ...validInput(), colorHex: "red" }).success).toBe(
      false,
    );
  });

  it("colorHex에 #이 없으면 거부한다", () => {
    expect(labelFormInputSchema.safeParse({ ...validInput(), colorHex: "ff8800" }).success).toBe(
      false,
    );
  });
});
