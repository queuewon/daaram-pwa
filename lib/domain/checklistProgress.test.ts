import { describe, expect, it } from "vitest";
import { calculateChecklistProgress } from "./checklistProgress";

describe("calculateChecklistProgress", () => {
  it("빈 배열이면 total/doneCount/ratio 모두 0이다", () => {
    expect(calculateChecklistProgress([])).toEqual({ total: 0, doneCount: 0, ratio: 0 });
  });

  it("3개 중 1개 done이면 ratio는 1/3이다", () => {
    const result = calculateChecklistProgress([
      { status: "done" },
      { status: "pending" },
      { status: "in_progress" },
    ]);

    expect(result).toEqual({ total: 3, doneCount: 1, ratio: 1 / 3 });
  });

  it("전부 done이면 ratio는 1이다", () => {
    const result = calculateChecklistProgress([{ status: "done" }, { status: "done" }]);

    expect(result).toEqual({ total: 2, doneCount: 2, ratio: 1 });
  });

  it("done이 없으면 ratio는 0이다", () => {
    const result = calculateChecklistProgress([{ status: "pending" }, { status: "in_progress" }]);

    expect(result).toEqual({ total: 2, doneCount: 0, ratio: 0 });
  });
});
