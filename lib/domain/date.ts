export function todayDateString(): string {
  return new Date().toLocaleDateString("sv-SE");
}

const WEEKDAY_LABELS = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;

export function formatDateWithWeekday(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${dateString.replaceAll("-", ".")} ${WEEKDAY_LABELS[date.getDay()]}`;
}
