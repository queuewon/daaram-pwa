import { describe, expect, it } from "vitest";
import { formatDateWithWeekday, todayDateString } from "./date";

describe("todayDateString", () => {
  it("YYYY-MM-DD 형식의 문자열을 반환한다", () => {
    expect(todayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatDateWithWeekday", () => {
  it("2024-01-01(월요일)을 YYYY.MM.DD 요일 형식으로 반환한다", () => {
    expect(formatDateWithWeekday("2024-01-01")).toBe("2024.01.01 월요일");
  });

  it("한 자리 월/일도 0패딩을 유지한다", () => {
    expect(formatDateWithWeekday("2026-01-05")).toBe("2026.01.05 월요일");
  });

  it.each([
    ["2024-01-07", "일요일"],
    ["2024-01-01", "월요일"],
    ["2024-01-02", "화요일"],
    ["2024-01-03", "수요일"],
    ["2024-01-04", "목요일"],
    ["2024-01-05", "금요일"],
    ["2024-01-06", "토요일"],
  ])("%s는 %s를 반환한다", (dateString, expectedWeekday) => {
    expect(formatDateWithWeekday(dateString)).toBe(
      `${dateString.replaceAll("-", ".")} ${expectedWeekday}`,
    );
  });
});
