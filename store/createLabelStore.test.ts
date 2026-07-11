import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../lib/infra/db";
import { recipeCategoryRepository } from "../lib/infra/repositories";
import { createLabelStore } from "./createLabelStore";
import { generateId } from "../lib/domain/ids";
import type { RecipeCategoryId } from "../lib/domain/ids";

const useTestLabelStore = createLabelStore(recipeCategoryRepository, () =>
  generateId<"RecipeCategoryId">(),
);

beforeEach(async () => {
  await db.open();
  useTestLabelStore.setState({ items: [] });
});

afterEach(async () => {
  await db.recipe_categories.clear();
});

function validForm(overrides: Partial<Record<string, unknown>> = {}) {
  return { name: "빙과류", colorHex: "#ff8800", ...overrides };
}

describe("createLabelStore — 생성", () => {
  it("id가 null이면 새 항목을 만든다", async () => {
    const result = await useTestLabelStore.getState().saveLabel({ id: null, form: validForm() });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("빙과류");
    expect(useTestLabelStore.getState().items).toHaveLength(1);
  });

  it("잘못된 폼 입력이면 InvalidForm 오류를 반환하고 아무것도 저장하지 않는다", async () => {
    const result = await useTestLabelStore
      .getState()
      .saveLabel({ id: null, form: validForm({ name: "" }) });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("InvalidForm");
    expect(useTestLabelStore.getState().items).toHaveLength(0);
  });
});

describe("createLabelStore — 수정", () => {
  it("기존 항목을 교체한다", async () => {
    const created = await useTestLabelStore.getState().saveLabel({ id: null, form: validForm() });
    if (!created.ok) throw new Error("test setup");

    const updated = await useTestLabelStore
      .getState()
      .saveLabel({ id: created.value.id, form: validForm({ colorHex: "#00ff00" }) });

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.colorHex).toBe("#00ff00");
    expect(useTestLabelStore.getState().items).toHaveLength(1);
  });

  it("존재하지 않는 id로 수정하면 NotFound 오류를 반환한다", async () => {
    const result = await useTestLabelStore.getState().saveLabel({
      id: "no-such-category" as RecipeCategoryId,
      form: validForm(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("NotFound");
  });
});

describe("createLabelStore — removeLabel", () => {
  it("목록에서 제거한다", async () => {
    const created = await useTestLabelStore.getState().saveLabel({ id: null, form: validForm() });
    if (!created.ok) throw new Error("test setup");

    await useTestLabelStore.getState().removeLabel(created.value.id);

    expect(useTestLabelStore.getState().items).toHaveLength(0);
  });
});
