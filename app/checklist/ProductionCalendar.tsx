"use client";

import {
  buildMonthGrid,
  formatYearMonth,
  nextMonth,
  previousMonth,
  type YearMonth,
} from "@/lib/domain/calendar";

interface ProductionCalendarProps {
  viewYM: YearMonth;
  selectedDate: string;
  today: string;
  markedDates: ReadonlySet<string>;
  onSelectDate: (date: string) => void;
  onChangeMonth: (ym: YearMonth) => void;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const NAV_BUTTON_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-full border-transparent bg-data-soft text-lg leading-none text-data hover:brightness-95";

export function ProductionCalendar({
  viewYM,
  selectedDate,
  today,
  markedDates,
  onSelectDate,
  onChangeMonth,
}: ProductionCalendarProps) {
  const weeks = buildMonthGrid(viewYM);

  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => onChangeMonth(previousMonth(viewYM))}
          className={NAV_BUTTON_CLASS}
        >
          ‹
        </button>
        <span className="font-bold text-gray-900">{formatYearMonth(viewYM)}</span>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => onChangeMonth(nextMonth(viewYM))}
          className={NAV_BUTTON_CLASS}
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-xs">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={label}
            className={
              index === 0 ? "text-red-400" : index === 6 ? "text-blue-400" : "text-gray-400"
            }
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.flat().map((date, index) => {
          if (date === null) return <span key={`blank-${index}`} />;
          const day = Number(date.slice(-2));
          const isSelected = date === selectedDate;
          const isToday = date === today;
          const marked = markedDates.has(date);
          const stateClass = isSelected
            ? "bg-data font-bold text-white"
            : isToday
              ? "bg-data-soft font-semibold text-data"
              : "border-transparent text-gray-700 hover:bg-gray-50";
          return (
            <button
              key={date}
              type="button"
              aria-label={date}
              aria-pressed={isSelected}
              onClick={() => onSelectDate(date)}
              className={`relative flex h-10 items-center justify-center rounded-full border-transparent text-sm ${stateClass}`}
            >
              {day}
              {marked && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-data"}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
