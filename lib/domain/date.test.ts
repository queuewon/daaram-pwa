import { describe, expect, it } from "vitest";
import { todayDateString } from "./date";

describe("todayDateString", () => {
  it("YYYY-MM-DD 형식의 문자열을 반환한다", () => {
    expect(todayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
