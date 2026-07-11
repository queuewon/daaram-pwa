import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../lib/infra/db";
import { useChecklistStore } from "./checklistStore";
import type { DailyChecklistId, RecipeId } from "../lib/domain/ids";

beforeEach(async () => {
  await db.open();
  useChecklistStore.setState({ items: [] });
});

afterEach(async () => {
  await db.daily_checklist.clear();
});

function validForm(overrides: Partial<Record<string, unknown>> = {}) {
  return { recipeId: "recipe-1", date: "2026-07-11", batchSize: 1000, ...overrides };
}

describe("checklistStore.addChecklistItem", () => {
  it("유효한 폼이면 status:pending으로 새 항목을 만든다", async () => {
    const result = await useChecklistStore.getState().addChecklistItem(validForm());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("pending");
    expect(useChecklistStore.getState().items).toHaveLength(1);
  });

  it("잘못된 폼 입력이면 InvalidForm 오류를 반환하고 아무것도 저장하지 않는다", async () => {
    const result = await useChecklistStore.getState().addChecklistItem(validForm({ batchSize: 0 }));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidForm");
    expect(useChecklistStore.getState().items).toHaveLength(0);
  });
});

describe("checklistStore.cycleStatus", () => {
  it("pending → in_progress → done → pending 순으로 순환하고 DB에도 반영한다", async () => {
    const created = await useChecklistStore.getState().addChecklistItem(validForm());
    if (!created.ok) throw new Error("test setup");
    const id = created.value.id;

    const first = await useChecklistStore.getState().cycleStatus(id);
    expect(first.ok && first.value.status).toBe("in_progress");

    const second = await useChecklistStore.getState().cycleStatus(id);
    expect(second.ok && second.value.status).toBe("done");

    const third = await useChecklistStore.getState().cycleStatus(id);
    expect(third.ok && third.value.status).toBe("pending");

    expect(useChecklistStore.getState().items.find((i) => i.id === id)?.status).toBe("pending");

    const persisted = await db.daily_checklist.get(id);
    expect(persisted?.status).toBe("pending");
  });

  it("존재하지 않는 id면 NotFound 오류를 반환한다", async () => {
    const result = await useChecklistStore
      .getState()
      .cycleStatus("no-such-item" as DailyChecklistId);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("NotFound");
  });
});

describe("checklistStore.removeChecklistItem", () => {
  it("목록에서 제거한다", async () => {
    const created = await useChecklistStore.getState().addChecklistItem(validForm());
    if (!created.ok) throw new Error("test setup");

    await useChecklistStore.getState().removeChecklistItem(created.value.id);

    expect(useChecklistStore.getState().items).toHaveLength(0);
  });
});

describe("checklistStore.loadByDate", () => {
  it("해당 날짜의 항목만 불러온다", async () => {
    await useChecklistStore.getState().addChecklistItem(validForm({ date: "2026-07-11" }));
    await useChecklistStore
      .getState()
      .addChecklistItem(validForm({ date: "2026-07-12", recipeId: "recipe-2" as RecipeId }));

    await useChecklistStore.getState().loadByDate("2026-07-11");

    const items = useChecklistStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].date).toBe("2026-07-11");
  });
});
