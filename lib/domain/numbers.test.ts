import { describe, expect, it } from "vitest";
import { parseNonNegativeNumber, parsePositiveNumber } from "./numbers";

describe("parseNonNegativeNumber", () => {
  it("0 이상의 값을 받아들인다", () => {
    const result = parseNonNegativeNumber(0);
    expect(result).toEqual({ ok: true, value: 0 });
  });

  it("양수를 받아들인다", () => {
    const result = parseNonNegativeNumber(5);
    expect(result).toEqual({ ok: true, value: 5 });
  });

  it("음수는 OutOfRange로 거부한다", () => {
    const result = parseNonNegativeNumber(-1);
    expect(result).toEqual({ ok: false, error: { type: "OutOfRange", value: -1 } });
  });
});

describe("parsePositiveNumber", () => {
  it("양수를 받아들인다", () => {
    const result = parsePositiveNumber(5);
    expect(result).toEqual({ ok: true, value: 5 });
  });

  it("0은 OutOfRange로 거부한다", () => {
    const result = parsePositiveNumber(0);
    expect(result).toEqual({ ok: false, error: { type: "OutOfRange", value: 0 } });
  });

  it("음수는 OutOfRange로 거부한다", () => {
    const result = parsePositiveNumber(-1);
    expect(result).toEqual({ ok: false, error: { type: "OutOfRange", value: -1 } });
  });
});
