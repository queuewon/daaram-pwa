import { describe, expect, it } from "vitest";
import { nextChecklistStatus } from "./checklistStatus";

describe("nextChecklistStatus", () => {
  it("pending 다음은 in_progress다", () => {
    expect(nextChecklistStatus("pending")).toBe("in_progress");
  });

  it("in_progress 다음은 done이다", () => {
    expect(nextChecklistStatus("in_progress")).toBe("done");
  });

  it("done 다음은 pending으로 순환한다", () => {
    expect(nextChecklistStatus("done")).toBe("pending");
  });
});
