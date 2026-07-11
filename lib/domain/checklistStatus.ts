import type { DailyChecklistStatus } from "./entities";

const CYCLE: Record<DailyChecklistStatus, DailyChecklistStatus> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
};

export function nextChecklistStatus(current: DailyChecklistStatus): DailyChecklistStatus {
  return CYCLE[current];
}
