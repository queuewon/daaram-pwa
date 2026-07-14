import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  formatYearMonth,
  monthRange,
  nextMonth,
  previousMonth,
  productionDates,
  yearMonthOf,
} from "./calendar";

describe("monthRange", () => {
  it("일반 달은 01일부터 말일까지", () => {
    expect(monthRange({ year: 2026, month: 7 })).toEqual({
      start: "2026-07-01",
      end: "2026-07-31",
    });
  });

  it("2월 평년은 28일까지", () => {
    expect(monthRange({ year: 2026, month: 2 })).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
  });

  it("2월 윤년은 29일까지", () => {
    expect(monthRange({ year: 2024, month: 2 })).toEqual({
      start: "2024-02-01",
      end: "2024-02-29",
    });
  });
});

describe("buildMonthGrid", () => {
  it("수요일 시작(2026-07)이면 앞에 null 3칸이 온다", () => {
    const grid = buildMonthGrid({ year: 2026, month: 7 });
    expect(grid[0].slice(0, 4)).toEqual([null, null, null, "2026-07-01"]);
  });

  it("모든 주는 7칸이다", () => {
    const grid = buildMonthGrid({ year: 2026, month: 7 });
    for (const week of grid) expect(week).toHaveLength(7);
  });

  it("그 달의 모든 날짜가 순서대로 포함된다", () => {
    const grid = buildMonthGrid({ year: 2026, month: 2 });
    const days = grid.flat().filter((d): d is string => d !== null);
    expect(days).toHaveLength(28);
    expect(days[0]).toBe("2026-02-01");
    expect(days[27]).toBe("2026-02-28");
  });
});

describe("formatYearMonth", () => {
  it("YYYY년 M월 형식", () => {
    expect(formatYearMonth({ year: 2026, month: 7 })).toBe("2026년 7월");
  });
});

describe("previousMonth / nextMonth", () => {
  it("1월의 이전 달은 전년 12월", () => {
    expect(previousMonth({ year: 2026, month: 1 })).toEqual({ year: 2025, month: 12 });
  });

  it("12월의 다음 달은 다음 해 1월", () => {
    expect(nextMonth({ year: 2026, month: 12 })).toEqual({ year: 2027, month: 1 });
  });

  it("일반적인 경우", () => {
    expect(previousMonth({ year: 2026, month: 7 })).toEqual({ year: 2026, month: 6 });
    expect(nextMonth({ year: 2026, month: 7 })).toEqual({ year: 2026, month: 8 });
  });
});

describe("yearMonthOf", () => {
  it("날짜 문자열에서 연/월을 뽑는다", () => {
    expect(yearMonthOf("2026-07-14")).toEqual({ year: 2026, month: 7 });
  });

  it("잘못된 문자열은 유효한 월(1-12)로 폴백한다", () => {
    const ym = yearMonthOf("not-a-date");
    expect(ym.month).toBeGreaterThanOrEqual(1);
    expect(ym.month).toBeLessThanOrEqual(12);
    expect(ym.year).toBeGreaterThan(2000);
  });
});

describe("productionDates", () => {
  it("기록이 있는 날짜 집합을 중복 없이 만든다", () => {
    const set = productionDates([
      { date: "2026-07-01" },
      { date: "2026-07-01" },
      { date: "2026-07-03" },
    ]);
    expect(set.has("2026-07-01")).toBe(true);
    expect(set.has("2026-07-03")).toBe(true);
    expect(set.size).toBe(2);
  });

  it("빈 입력은 빈 집합", () => {
    expect(productionDates([]).size).toBe(0);
  });
});
