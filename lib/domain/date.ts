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

/** ISO 문자열을 로컬 시각의 'YYYY-MM-DD HH:mm:ss'로 포맷한다. 파싱 실패 시 원본 반환. */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}
