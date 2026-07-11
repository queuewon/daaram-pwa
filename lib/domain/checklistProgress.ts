import type { DailyChecklistStatus } from "./entities";

export interface ChecklistProgress {
  total: number;
  doneCount: number;
  ratio: number;
}

export function calculateChecklistProgress(
  items: readonly { status: DailyChecklistStatus }[],
): ChecklistProgress {
  const total = items.length;
  const doneCount = items.filter((item) => item.status === "done").length;
  const ratio = total === 0 ? 0 : doneCount / total;

  return { total, doneCount, ratio };
}
