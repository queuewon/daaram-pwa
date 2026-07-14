import { describe, expect, it } from "vitest";
import { formatDateTime, formatDateWithWeekday, todayDateString } from "./date";

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

describe("formatDateTime", () => {
  it("ISO 문자열을 로컬 시각 'YYYY-MM-DD HH:mm:ss'로 반환한다", () => {
    // 로컬 시각 컴포넌트로 Date를 만들고 ISO로 변환하면, 다시 로컬로 포맷했을 때
    // 원래 로컬 컴포넌트가 나와야 한다 (타임존 독립적인 검증).
    const local = new Date(2026, 6, 14, 2, 10, 17);
    expect(formatDateTime(local.toISOString())).toBe("2026-07-14 02:10:17");
  });

  it("한 자리 값도 0패딩한다", () => {
    const local = new Date(2026, 0, 5, 9, 3, 7);
    expect(formatDateTime(local.toISOString())).toBe("2026-01-05 09:03:07");
  });

  it("파싱할 수 없는 문자열은 원본을 그대로 반환한다", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
  });
});
