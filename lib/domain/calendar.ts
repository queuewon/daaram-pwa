export interface YearMonth {
  year: number;
  /** 1-12 */
  month: number;
}

export interface MonthRange {
  start: string;
  end: string;
}

/** 달력 주 시작 요일: 일요일(0). */
const WEEK_START_DAY = 0;
const DAYS_PER_WEEK = 7;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dateString(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function daysInMonth(year: number, month: number): number {
  // month는 1-12. new Date(year, month, 0)은 그 달의 마지막 날.
  return new Date(year, month, 0).getDate();
}

export function monthRange(ym: YearMonth): MonthRange {
  const last = daysInMonth(ym.year, ym.month);
  return {
    start: dateString(ym.year, ym.month, 1),
    end: dateString(ym.year, ym.month, last),
  };
}

/** 주(7칸) 배열의 배열. 달 밖 칸은 null. 주 시작은 일요일. */
export function buildMonthGrid(ym: YearMonth): (string | null)[][] {
  const firstWeekday = new Date(ym.year, ym.month - 1, 1).getDay();
  const leadingBlanks = (firstWeekday - WEEK_START_DAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const total = daysInMonth(ym.year, ym.month);

  const cells: (string | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= total; day++) cells.push(dateString(ym.year, ym.month, day));
  while (cells.length % DAYS_PER_WEEK !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += DAYS_PER_WEEK) {
    weeks.push(cells.slice(i, i + DAYS_PER_WEEK));
  }
  return weeks;
}

export function formatYearMonth(ym: YearMonth): string {
  return `${ym.year}년 ${ym.month}월`;
}

export function previousMonth(ym: YearMonth): YearMonth {
  return ym.month === 1 ? { year: ym.year - 1, month: 12 } : { year: ym.year, month: ym.month - 1 };
}

export function nextMonth(ym: YearMonth): YearMonth {
  return ym.month === 12 ? { year: ym.year + 1, month: 1 } : { year: ym.year, month: ym.month + 1 };
}

export function yearMonthOf(dateString: string): YearMonth {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (match) return { year: Number(match[1]), month: Number(match[2]) };
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function productionDates(items: readonly { date: string }[]): ReadonlySet<string> {
  return new Set(items.map((item) => item.date));
}
